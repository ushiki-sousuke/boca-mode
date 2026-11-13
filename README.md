# BOCAモード for Claude Code

Claude Code がコードを書くあいだだけ、設計の土台を **Business Object-Centric Architecture（BOCA）** の3部に限る仕組みです。
決まりの文（CLAUDE.md やメモリ）で頼むのではなく、フック（決まった時に必ず動くチェック）で情報の入口を閉じます。

## なぜ要るのか

AI は、世の中にある大量のコードを手本に学んでいます。その多くは、データを「サービス」などの処理役が外から読み書きする書き方です。
設計のときにそれを持ち込むと、資料を読ませていても、いつもの書き方に戻ってしまいます。
BOCA だけを目の前に置いて設計させると、「注文・請求書・契約などの業務の主体が、自分のことは自分で答える」形に変わります。

BOCA の3部：

- **Manifesto**：考え方の定義
- **Practicum**：よくある書き方12例と、それを置き換えるコード
- **Apologia**：よく出る反論への答えと、良し悪しを「変更のしやすさ」で測る方法

公開ページ：https://boca-apocryphon.surge.sh/ （このリポジトリの `docs/boca/` が同じ本文です）

## 何をするか

- `/boca` … BOCAモードに入る（ユーザーが打っても、Claude がスキルとして呼んでも）
- コードを編集しようとした（.js .ts .py .gs .ps1 .cs など）… 入り忘れていても自動で入る
- モード中、BOCA をまだ全文読んでいない … BOCA を読むこと以外を止める
- モード中 … Web検索・Web取得・サブエージェント・ほかのスキル・ドキュメント系の外部ツールを止める。読む・探す・コマンドは、BOCA と作業中のプロジェクトの中だけ（ほかのプロジェクトのコードを手本に読むことも止める）
- 会話の要約・`/clear` … BOCA を読み直させる
- `/boca end` … モードを出る

フックはコードの良し悪しを**判定しません**。開け閉めするのは情報の入口だけです。
振る舞いの決まり（Claude Code 本来の指示・CLAUDE.md・メモリ・ほかのフック）は何も外しません。

## 組み込み方

Node.js と Git が要ります（Git が無ければ、このページの「Code」→「Download ZIP」で取り寄せて展開しても構いません）。

```
git clone https://github.com/ushiki-sousuke/boca-mode.git
cd boca-mode
node install.js
```

いちばん簡単なのは、Claude Code に「https://github.com/ushiki-sousuke/boca-mode を README のとおりに入れて」と頼むことです。

これで `~/.claude` に次が入ります。`settings.json` と `CLAUDE.md` は書き換える前に `.bak-<日時>` を作ります。何度動かしても二重になりません。

- `hooks/boca-mode.js`（フック本体）
- `skills/boca/SKILL.md`（`/boca` スキル）
- `docs/boca/`（BOCA の写し）
- `boca-mode.json`（BOCA の置き場所・プロジェクトの目印などの設定）
- `settings.json` のフック登録（SessionStart・UserPromptSubmit・PostToolUse(Read)・PreToolUse）
- `CLAUDE.md` の「設計の拠り所」の節（`claude-md-snippet.md`）

Claude Code を開き直すと確実に効きます。確かめ方：Claude Code で `/boca` と打ち、BOCA を読み終えるまでほかの操作が止まれば入っています。

オプション：

- `--dir <dir>`：BOCA を写さず、手元の置き場所を使う
- `--no-claude-md`：CLAUDE.md に節を足さない
- `--uninstall`：外す（BOCA の写しは残す）

## 設定（`~/.claude/boca-mode.json`）

```json
{ "dir": "~/.claude/docs/boca" }
```

ほかに、`markers`（プロジェクトの根の目印。既定は `.git`・`package.json`・`appsscript.json` など）、`code`（自動で入るファイルの拡張子）を上書きできます。

## 試験

```
node test/test.js
```

仮のホームフォルダに組み込み、模擬の入力で止まる・通るを確かめます（本物の `~/.claude` には触りません）。

## 権利

BOCA の文章の権利は作者にあります。
