// BOCAモードの試験。仮のホームフォルダを作ってそこへ組み込み、フックに模擬の入力を流して、止まる・通るを確かめる。
// 本物の ~/.claude には触らない。使い方：node test/test.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'boca-mode-test-'));
const env = { ...process.env, USERPROFILE: HOME, HOME };
const CLAUDE = path.join(HOME, '.claude');

// 仮のプロジェクト
const GAS = path.join(HOME, 'gas', 'tool'); fs.mkdirSync(GAS, { recursive: true });
fs.writeFileSync(path.join(GAS, 'appsscript.json'), '{}');
const APP = path.join(HOME, 'app'); fs.mkdirSync(path.join(APP, '.git'), { recursive: true });
fs.writeFileSync(path.join(APP, 'main.py'), 'print(1)');
fs.writeFileSync(path.join(APP, 'README.md'), 'app');
const OTHER = path.join(HOME, 'other-repo'); fs.mkdirSync(path.join(OTHER, '.git'), { recursive: true });
fs.writeFileSync(path.join(OTHER, 'lib.js'), 'x');
const OUTSIDE = path.join(HOME, 'notes'); fs.mkdirSync(OUTSIDE); fs.writeFileSync(path.join(OUTSIDE, 'n.md'), 'x');

let fail = 0;
const check = (label, got, want) => { const ok = got.startsWith(want); if (!ok) fail++; console.log(`${ok ? 'OK ' : 'NG '} ${label.padEnd(46)} ${got.slice(0, 56)}`); };

// 組み込み（2回動かして二重にならないことも見る）
execFileSync('node', [path.join(REPO, 'install.js')], { env, stdio: 'pipe' });
execFileSync('node', [path.join(REPO, 'install.js')], { env, stdio: 'pipe' });
const settings = JSON.parse(fs.readFileSync(path.join(CLAUDE, 'settings.json'), 'utf8'));
const ours = Object.values(settings.hooks).flat().flatMap(g => g.hooks).filter(h => /boca-mode/.test(h.command));
check('install twice: 4 hooks, not 8', String(ours.length), '4');
const md = fs.readFileSync(path.join(CLAUDE, 'CLAUDE.md'), 'utf8');
check('install twice: one CLAUDE.md section', String(md.split('boca-mode:begin').length - 1), '1');
check('docs copied', String(['1-manifesto.md', '2-practicum.md', '3-apologia.md'].every(f => fs.existsSync(path.join(CLAUDE, 'docs', 'boca', f)))), 'true');

const HOOK = path.join(CLAUDE, 'hooks', 'boca-mode.js');
const SID = 'test';
const run = (ev, o) => {
  const r = execFileSync('node', [HOOK, ev], { env, input: JSON.stringify({ session_id: SID, cwd: APP, ...o }) }).toString();
  if (!r) return 'allow';
  return 'deny: ' + JSON.parse(r).hookSpecificOutput.permissionDecisionReason.split('\n')[0];
};
const pre = (tool, ti, cwd) => run('PreToolUse', { tool_name: tool, tool_input: ti, ...(cwd ? { cwd } : {}) });
const doc = f => path.join(CLAUDE, 'docs', 'boca', f);
const readAll = () => ['1-manifesto.md', '2-practicum.md', '3-apologia.md'].forEach(f => run('PostToolUse', { tool_name: 'Read', tool_input: { file_path: doc(f) } }));
const state = () => JSON.parse(fs.readFileSync(path.join(CLAUDE, 'hooks', 'state', `boca-${SID}.json`), 'utf8')).on ? 'on' : 'off';

run('SessionStart', { source: 'startup' });
check('no mode: WebSearch', pre('WebSearch', { query: 'x' }), 'allow');
check('no mode: read outside', pre('Read', { file_path: path.join(OUTSIDE, 'n.md') }), 'allow');
check('no mode: markdown edit is not coding', pre('Write', { file_path: path.join(OUTSIDE, 'n.md') }), 'allow');
// コードの編集で自動で入る
check('python edit: auto-enter', pre('Edit', { file_path: path.join(APP, 'main.py') }), 'deny: 【BOCAモード】');
check('  -> mode', state(), 'on');
check('before reading: read project', pre('Read', { file_path: path.join(APP, 'README.md') }), 'deny');
check('before reading: read BOCA', pre('Read', { file_path: doc('1-manifesto.md') }), 'allow');
readAll();
check('after reading: edit python', pre('Edit', { file_path: path.join(APP, 'main.py') }), 'allow');
check('after reading: read project', pre('Read', { file_path: path.join(APP, 'README.md') }), 'allow');
check('read outside', pre('Read', { file_path: path.join(OUTSIDE, 'n.md') }), 'deny');
check('read other repo (no examples)', pre('Read', { file_path: path.join(OTHER, 'lib.js') }), 'deny');
check('grep outside', pre('Grep', { pattern: 'x', path: OUTSIDE }), 'deny');
check('grep in project (no path)', pre('Grep', { pattern: 'x' }), 'allow');
check('WebSearch', pre('WebSearch', { query: 'x' }), 'deny');
check('WebFetch', pre('WebFetch', { url: 'https://example.com' }), 'deny');
check('Agent', pre('Agent', { prompt: 'x' }), 'deny');
check('other skill', pre('Skill', { skill: 'wiki' }), 'deny');
check('docs connector', pre('mcp__claude_ai_Claude_Docs__read', {}), 'deny');
check('bash git status', pre('Bash', { command: 'git status' }), 'allow');
check('bash cat outside', pre('Bash', { command: `cat "${path.join(OUTSIDE, 'n.md')}"` }), 'deny');
check('bash curl', pre('Bash', { command: 'curl -s example.com' }), 'deny');
check('edit GAS code (adds project)', pre('Edit', { file_path: path.join(GAS, 'Code.js') }), 'allow');
check('read GAS project after editing it', pre('Read', { file_path: path.join(GAS, 'appsscript.json') }), 'allow');
check('clasp push', pre('Bash', { command: 'clasp push' }, GAS), 'allow');
run('SessionStart', { source: 'compact' });
check('after compact: read project', pre('Read', { file_path: path.join(APP, 'README.md') }), 'deny');
readAll();
check('/boca end (Skill)', pre('Skill', { skill: 'boca', args: 'end' }), 'allow');
check('  -> mode', state(), 'off');
check('after end: WebSearch', pre('WebSearch', { query: 'x' }), 'allow');
check('/boca (user) enters', run('UserPromptSubmit', { prompt: '/boca' }), 'allow');
check('  -> mode', state(), 'on');
check('/boca end (user)', run('UserPromptSubmit', { prompt: '/boca end' }), 'allow');
check('  -> mode', state(), 'off');

execFileSync('node', [path.join(REPO, 'install.js'), '--uninstall'], { env, stdio: 'pipe' });
const after = JSON.parse(fs.readFileSync(path.join(CLAUDE, 'settings.json'), 'utf8'));
check('uninstall: hooks removed', String(Object.values(after.hooks || {}).flat().flatMap(g => g.hooks).filter(h => /boca-mode/.test(h.command)).length), '0');
check('uninstall: CLAUDE.md section removed', String(fs.readFileSync(path.join(CLAUDE, 'CLAUDE.md'), 'utf8').includes('boca-mode:begin')), 'false');

fs.rmSync(HOME, { recursive: true, force: true });
console.log(fail ? `\n${fail} 件 NG` : '\nすべて OK');
process.exit(fail ? 1 : 0);
