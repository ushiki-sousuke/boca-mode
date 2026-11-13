// BOCAモード for Claude Code
// コーディングのあいだだけ、設計の土台を Business Object-Centric Architecture（BOCA）の3部に限る仕組み。
// このフックは判定をしない（コードの良し悪しを決めない）。開け閉めするのは情報の入口だけ。
// 振る舞いの決まり（Claude Code 本来の指示文・CLAUDE.md・メモリ・ほかのフック）は何も外さない。
//
// 設定：~/.claude/boca-mode.json（install.js が作る。BOCA の置き場所など）
// 状態（会話ごと）：~/.claude/hooks/state/boca-<セッションID>.json  { on, root, read }
// 入る：/boca（ユーザーの入力、または Claude の Skill 呼び出し）。忘れても、コードの編集に手をつけた時点で自動で入る。
// 出る：/boca end のみ。
// モードのあいだ：
//   - BOCA の3部を全文読むまで、BOCA を読むこと以外は何もできない
//   - Web検索・Web取得・サブエージェント・ほかのスキル・外のドキュメント系ツールは使えない
//   - 読む・探すのは BOCA と作業中のプロジェクトの中だけ（コマンドも、それ以外の場所やネットを指すものは止める）
//   - 会話が要約・/clear されたら読んだ記録を消し、BOCA を読み直させる
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');
const STATE_DIR = path.join(CLAUDE, 'hooks', 'state');
const DOCS = ['1-manifesto.md', '2-practicum.md', '3-apologia.md'];
const NAME = 'BOCA（Business Object-Centric Architecture）';
const DEFAULTS = {
  dir: '~/.claude/docs/boca',
  markers: ['.git', 'package.json', 'appsscript.json', '.clasp.json', 'pyproject.toml', 'requirements.txt'],
  code: '\\.(js|mjs|cjs|ts|tsx|jsx|gs|py|ps1|psm1|sh|bat|cmd|html|htm|css|scss|vue|svelte|java|kt|go|rs|rb|php|swift|c|h|cpp|hpp|cs|sql)$',
  commands: ['(^|[;&|(]\\s*|\\bnpx\\s+)clasp(\\.cmd)?\\s+(push|deploy)\\b'],
};
const ENTER = ['', 'on', 'start', 'code'];
const LEAVE = ['end', 'off', 'stop', 'おわり'];

function loadConfig() {
  let user = {};
  try { user = JSON.parse(fs.readFileSync(path.join(CLAUDE, 'boca-mode.json'), 'utf8')); } catch { /* 設定がなければ既定 */ }
  const c = { ...DEFAULTS, ...user };
  c.dir = String(c.dir).replace(/^~(?=[\\/])/, HOME);
  return c;
}
const CFG = loadConfig();

// リンク越しでも同じファイルと分かるよう実体のパスでそろえる。/c/… も C:/… に直す。
// まだ無いファイルでも、あるところまで親をたどって実体にし、残りをつなぐ。
function norm(p) {
  const s = String(p || '').replace(/^\/([a-zA-Z])\//, '$1:/').replace(/^~(?=[\\/])/, HOME);
  let r = path.resolve(s);
  const rest = [];
  for (let i = 0; i < 40; i++) {
    try { r = path.join(fs.realpathSync.native(r), ...rest); break; } catch { /* まだ無い */ }
    const up = path.dirname(r);
    if (up === r) { r = path.join(r, ...rest); break; }
    rest.unshift(path.basename(r));
    r = up;
  }
  return r.replace(/\\/g, '/').toLowerCase();
}
const fix = p => String(p || '').replace(/^\/([a-zA-Z])\//, '$1:/').replace(/^~(?=[\\/])/, HOME);
const docs = () => DOCS.map(f => norm(path.join(CFG.dir, f)));
const inside = (p, root) => { const a = norm(p), b = norm(root); return a === b || a.startsWith(b.endsWith('/') ? b : b + '/'); };

function readStdin() { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; } }
function stateFile(sid) { return path.join(STATE_DIR, `boca-${String(sid || 'unknown').replace(/[^\w-]/g, '_')}.json`); }
function load(sid) {
  try { const s = JSON.parse(fs.readFileSync(stateFile(sid), 'utf8')); return { on: !!s.on, root: s.root || [], read: s.read || [] }; }
  catch { return { on: false, root: [], read: [] }; }
}
function save(sid, st) { fs.mkdirSync(STATE_DIR, { recursive: true }); fs.writeFileSync(stateFile(sid), JSON.stringify(st)); }

// 目印のあるフォルダ（プロジェクトの根）を上へたどって探す
function projectRoot(file) {
  let dir = path.resolve(fix(file || '.'));
  try { if (!fs.statSync(dir).isDirectory()) dir = path.dirname(dir); } catch { dir = path.dirname(dir); }
  for (let i = 0; i < 14; i++) {
    if (CFG.markers.some(m => fs.existsSync(path.join(dir, m)))) return dir;
    const up = path.dirname(dir); if (up === dir) break; dir = up;
  }
  return null;
}

// この操作がコーディングか。そうならプロジェクトの根を返す
function codingRoot(tool, ti, cwd) {
  if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const f = fix(ti.file_path || ti.notebook_path || '');
    if (new RegExp(CFG.code, 'i').test(f)) return projectRoot(f) || path.dirname(path.resolve(f));
  }
  if (tool === 'Bash' || tool === 'PowerShell') {
    const c = String(ti.command || '');
    if (CFG.commands.some(rx => new RegExp(rx, 'im').test(c))) return projectRoot(cwd) || cwd;
  }
  return null;
}

function out(obj) { process.stdout.write(JSON.stringify(obj)); }
function deny(reason) { out({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }); }

function addRoot(st, root) { if (root && !st.root.some(r => norm(r) === norm(root))) st.root.push(root); }
function enter(st, root) { if (!st.on) { st.on = true; st.root = []; } addRoot(st, root); }
function leave(st) { st.on = false; st.root = []; }
function command(st, key, cwd) {
  if (ENTER.includes(key)) { enter(st, projectRoot(cwd) || cwd); return true; }
  if (LEAVE.includes(key)) { leave(st); return true; }
  return false;
}

function allowedPath(p, st, cwd) {
  const raw = fix(p);
  const target = raw ? (path.isAbsolute(raw) ? raw : path.join(cwd || '.', raw)) : (cwd || '.');
  if (inside(target, CFG.dir)) return true;
  if (st.root.some(r => inside(target, r))) return true;
  if (/\/appdata\/local\/temp\/claude\/|^\/tmp\/claude/.test(norm(target))) return true;   // ツールの一時出力（画面写真など）
  return false;
}

const TAG = '【BOCAモード】';
const EXIT = 'モードを出るのは /boca end。';

function guard(event, input) {
  const sid = input.session_id;
  const st = load(sid);
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const cwd = input.cwd || process.cwd();

  if (event === 'SessionStart') {
    const src = input.source || 'startup';
    if (src === 'compact' || src === 'clear') { st.read = []; save(sid, st); }
    else if (src === 'startup') { try { fs.unlinkSync(stateFile(sid)); } catch {} }
    return;
  }

  if (event === 'UserPromptSubmit') {
    const m = String(input.prompt || '').match(/^\s*\/boca(?:\s+(\S+))?/i);
    if (!m) return;
    if (command(st, (m[1] || '').toLowerCase(), cwd)) save(sid, st);
    return;
  }

  if (event === 'PostToolUse') {
    if (tool !== 'Read' || ti.offset != null || ti.limit != null) return;
    const hit = docs().find(p => p === norm(ti.file_path));
    if (!hit) return;
    if (!st.read.includes(hit)) st.read.push(hit);
    save(sid, st);
    return;
  }

  if (event !== 'PreToolUse') return;

  // 入る・出る（Claude の Skill 呼び出し）
  if (tool === 'Skill' && /^boca$/i.test(String(ti.skill || ''))) {
    if (command(st, String(ti.args || '').trim().split(/\s+/)[0].toLowerCase(), cwd)) save(sid, st);
    return;
  }

  // コーディングに手をつけたら自動で入る
  const root = codingRoot(tool, ti, cwd);
  if (root) { enter(st, root); save(sid, st); }
  if (!st.on) return;

  const missing = docs().filter(p => !st.read.includes(p));
  if (missing.length) {
    if (tool === 'Read' && missing.includes(norm(ti.file_path)) && ti.offset == null && ti.limit == null) return;
    if (tool === 'ToolSearch') return;
    return deny(`${TAG}この作業の土台は ${NAME} の3部だけ。先に全文を読む（Read を offset/limit なしで）。まだ：\n` +
      missing.map(p => '  - ' + p).join('\n') + `\n${EXIT}`);
  }

  const closed = /^(WebSearch|WebFetch|Agent|Task|Artifact|ArtifactComments|ArtifactData|Skill|SendMessage|RemoteTrigger)$/.test(tool)
    || /^mcp__(claude_ai_|claude-in-chrome|Claude_Browser)/.test(tool);
  if (closed) return deny(`${TAG}このあいだは BOCA 以外の情報を参照しない（${tool} は使えない）。外の情報が要るなら /boca end でモードを出てから。`);

  if (['Read', 'Grep', 'Glob', 'NotebookRead'].includes(tool)) {
    const p = ti.file_path || ti.path || ti.notebook_path || '';
    if (!allowedPath(p, st, cwd)) return deny(`${TAG}読む・探すのは BOCA と作業中のプロジェクトの中だけ（${p || cwd} は外）。${EXIT}`);
    save(sid, st);
    return;
  }

  if (tool === 'Bash' || tool === 'PowerShell') {
    const c = String(ti.command || '');
    if (/\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|irm|gh|lynx)\b|https?:\/\/|\bnpm\s+(view|info|search|docs)\b|\bpip\s+(download|search)\b/i.test(c)) {
      return deny(`${TAG}ネットの情報は参照しない。${EXIT}`);
    }
    const paths = c.match(/[A-Za-z]:[\\\/][^\s'"`;|&)<>]*|\/[a-zA-Z]\/[^\s'"`;|&)<>]*|~[\\\/][^\s'"`;|&)<>]*/g) || [];
    for (const raw of paths) {
      if (/program files|\.exe$|[\\\/]\.claude[\\\/](scripts|hooks)([\\\/]|$)/i.test(raw)) continue;
      if (!allowedPath(raw, st, cwd)) return deny(`${TAG}コマンドが BOCA と作業中のプロジェクトの外を指している（${raw}）。${EXIT}`);
    }
    save(sid, st);
  }
}

try { guard(process.argv[2], readStdin()); } catch (e) {
  process.stderr.write(`boca-mode: ${e && e.message}\n`);
  process.exit(0);
}
