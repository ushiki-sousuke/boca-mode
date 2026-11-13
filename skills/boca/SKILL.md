---
name: boca
description: BOCAモードに入る・出る。コーディングと設計のあいだは、Business Object-Centric Architecture（BOCA）の3部だけを土台に進める。引数なし（入る）／end（出る）。作業や設計の話が始まったら、考え始める前に入る。
---

BOCAモードの切り替えは、フック `~/.claude/hooks/boca-mode.js` が行う（このスキルを呼んだ時点で切り替わっている）。BOCA の置き場所は `~/.claude/boca-mode.json`。

- 引数なし：BOCAモードに入る。土台は BOCA の3部（Manifesto・Practicum・Apologia）。
- `end`：モードを出る。記録の後片付けや、外の情報が要るときは出てから。

モードに入ったら、3部をまだ全文読んでいなければ読む。設計は BOCA の根（業務の主体に責任を持たせ、プログラマーが判断を手放すこと）から、場面ごとに問う。
