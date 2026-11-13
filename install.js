#!/usr/bin/env node
// BOCAモードを Claude Code に組み込む。何度動かしても二重にならない。
//   node install.js                  … ~/.claude に組み込む（BOCA はこのリポジトリの docs/boca/ から ~/.claude/docs/boca/ へ写す）
//   node install.js --dir <dir>      … BOCA を写さず、手元の <dir> を使う
//   node install.js --no-claude-md   … ~/.claude/CLAUDE.md に「設計の拠り所」の節を足さない
//   node install.js --uninstall      … 外す（BOCA の写しは残す）
// 入れるもの：
//   ~/.claude/hooks/boca-mode.js、~/.claude/skills/boca/SKILL.md、~/.claude/boca-mode.json、
//   ~/.claude/settings.json の hooks（SessionStart・UserPromptSubmit・PostToolUse(Read)・PreToolUse(全ツール)）、
//   ~/.claude/CLAUDE.md の節（<!-- boca-mode:begin --> ～ end）
// settings.json と CLAUDE.md は書き換える前に .bak-<日時> を作る。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const has = name => args.includes(name);

const REPO = __dirname;
const CLAUDE = path.join(os.homedir(), '.claude');
const HOOK = path.join(CLAUDE, 'hooks', 'boca-mode.js');
const SKILL = path.join(CLAUDE, 'skills', 'boca', 'SKILL.md');
const CONFIG = path.join(CLAUDE, 'boca-mode.json');
const SETTINGS = path.join(CLAUDE, 'settings.json');
const CLAUDE_MD = path.join(CLAUDE, 'CLAUDE.md');
const DOCS = ['1-manifesto.md', '2-practicum.md', '3-apologia.md'];
const STAMP = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
const BEGIN = '<!-- boca-mode:begin -->', END = '<!-- boca-mode:end -->';

const log = m => console.log('  ' + m);
const backup = f => { if (fs.existsSync(f)) { fs.copyFileSync(f, `${f}.bak-${STAMP}`); log(`控え ${f}.bak-${STAMP}`); } };
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); log(`写した ${to}`); };
const isOurs = h => /boca-mode\.js/.test(String(h.command || '') + ' ' + (h.args || []).join(' '));

function readJson(f, dflt) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } }

function removeHooks(settings) {
  const hooks = settings.hooks || {};
  for (const ev of Object.keys(hooks)) {
    hooks[ev] = hooks[ev].map(g => ({ ...g, hooks: (g.hooks || []).filter(h => !isOurs(h)) })).filter(g => g.hooks.length);
    if (!hooks[ev].length) delete hooks[ev];
  }
  settings.hooks = hooks;
}

function addHooks(settings) {
  const cmd = ev => ({ type: 'command', command: `node "${HOOK}" ${ev}`, timeout: 10 });
  const add = (ev, group) => { (settings.hooks[ev] = settings.hooks[ev] || []).push(group); };
  add('SessionStart', { hooks: [cmd('SessionStart')] });
  add('UserPromptSubmit', { hooks: [cmd('UserPromptSubmit')] });
  add('PostToolUse', { matcher: 'Read', hooks: [cmd('PostToolUse')] });
  add('PreToolUse', { hooks: [cmd('PreToolUse')] });
}

function setClaudeMd(on) {
  let text = fs.existsSync(CLAUDE_MD) ? fs.readFileSync(CLAUDE_MD, 'utf8') : '';
  const re = new RegExp(`\\n?${BEGIN}[\\s\\S]*?${END}\\n?`);
  const had = re.test(text);
  if (!on && !had) return;
  backup(CLAUDE_MD);
  text = text.replace(re, '\n');
  if (on) text = text.replace(/\s*$/, '\n\n') + fs.readFileSync(path.join(REPO, 'claude-md-snippet.md'), 'utf8').trim() + '\n';
  fs.writeFileSync(CLAUDE_MD, text);
  log(on ? `CLAUDE.md に節を${had ? '入れ直した' : '足した'}` : 'CLAUDE.md から節を外した');
}

function install() {
  console.log('BOCAモードを組み込みます：' + CLAUDE);
  copy(path.join(REPO, 'hooks', 'boca-mode.js'), HOOK);
  copy(path.join(REPO, 'skills', 'boca', 'SKILL.md'), SKILL);

  const cfg = readJson(CONFIG, {});
  const given = opt('--dir');
  if (given) { cfg.dir = path.resolve(given).replace(/\\/g, '/'); log(`BOCA：${cfg.dir}（手元のものを使う）`); }
  else if (cfg.dir && !cfg.dir.startsWith('~/.claude/docs/boca')) { log(`BOCA：${cfg.dir}（設定を保つ）`); }
  else {
    for (const f of DOCS) copy(path.join(REPO, 'docs', 'boca', f), path.join(CLAUDE, 'docs', 'boca', f));
    cfg.dir = '~/.claude/docs/boca';
  }
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
  log(`設定 ${CONFIG}`);

  const settings = readJson(SETTINGS, {});
  backup(SETTINGS);
  removeHooks(settings);
  addHooks(settings);
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n');
  log(`フックを登録 ${SETTINGS}`);

  if (!has('--no-claude-md')) setClaudeMd(true);
  console.log('完了。Claude Code を開き直すと確実に効きます。コーディングの前に /boca、出るときは /boca end。');
}

function uninstall() {
  console.log('BOCAモードを外します：' + CLAUDE);
  const settings = readJson(SETTINGS, null);
  if (settings) { backup(SETTINGS); removeHooks(settings); fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n'); log('フックを外した'); }
  for (const f of [HOOK, SKILL, CONFIG]) if (fs.existsSync(f)) { fs.unlinkSync(f); log(`消した ${f}`); }
  setClaudeMd(false);
  console.log('完了。BOCA の写し（~/.claude/docs/boca/）は残しています。');
}

has('--uninstall') ? uninstall() : install();
