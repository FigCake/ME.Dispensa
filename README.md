# Dispensa

Quick replies (`/commands` and scripts) on a Dock above the chat input in [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine), with easy choice QRs, a memo pad, a 🌟 visualizer that turns a topic into an HTML page, and commands for Marinara's tracker, lorebooks, characters and connections. *Dispensa* is Italian for pantry. 한국어: [README-ko.md](README-ko.md)

## Setup

1. In the server `.env`, set `ENABLE_EXTERNAL_EXTENSIONS=true` and restart Marinara
2. Settings → Addons → External Extensions: turn on **Allow third-party extension imports**, import `ME-Dispensa-<version>.zip`
3. **Dispensa** → **Review and Run**: approve the hash (it must equal the one in `SHA256SUMS.txt`)

Or add `FigCake/ME.Dispensa` as a source in [Fetchy](https://github.com/FigCake/ME.Fetchy). Dispensa needs **full_page_access**; it reads and writes the chat and calls the AI only when a QR runs, and talks to no outside server.

## Dock

Star left of the input → point at or touch the `⋯` handle above it.

* Bubbles: 🍰 visualizer · 📝 memo pad · ⚙ the Dispensa window · your sets (folders) and QRs · 🔥 Fornello's buttons · stop while a QR runs
* Click runs a QR, **Ctrl/⌘+click** edits it, **right-click** (long-press) opens its sub menu
* The **Dock** tab chooses what it shows (same in every chat): a set as a folder or a row, single QRs, or a new QR made right there

The Dispensa window also opens from the cake in Marinara's top bar → **Dispensa settings**. Its **?** tips explain each setting.

## Library and QR editor

* **Import QRs**: `.mqr.json`, or SillyTavern QR sets (converted on import); **Export**: `.mqr.json`; copy, paste, drag to reorder
* Set lists: **Global** · **This chat** · **Character** decide where a set's QRs auto-run; **All sets** holds every set
* **New QR**: **QR** (a /command or script), **Easy choice QR**, **Visualizer QR**
* Editor: suggestions (`/`, `{{`), a searchable command list (badges: Dispensa, Marinara, Compat — kept so imported QRs keep working — or the extension that added it), sub menus, auto-run triggers, **▶ Run** (Ctrl+Enter) and **🐞 Step** with breakpoints

### Easy choice QRs

A QR made of cards: it asks its steps (choices or text boxes) in order, then sends one prompt with the answers (`{{name}}`). It runs, debugs and exports like any QR; **Turn into a script** keeps only the script. The **Example QRs** set has two to try: **Cooking & recipe** and **The Holiday Drop**.

## 🌟 Visualizer

* 🍰 → topic → **🌟 Make page**; `[[mood|bright|dark]]` is asked at run time, `[[memo]]` picks a memo
* The **Visualizer** set holds QRs that make pages with `/visz`: **Last message** (the last message as a new interactive scene) and **Fandom wiki**
* Viewer above the Dock: gallery, send to chat, save as HTML or PNG, fullscreen; HTML code blocks in the chat get a 🌟 button
* Modes: full pages with scripts need [Fornello](https://github.com/FigCake/ME.Fornello) (Marinara's CSP blocks page scripts); otherwise HTML and CSS only
* Settings (🌟 tab): output, language, AI connection, whether the chat's RP preset goes along, and the prompt in chunks to switch, edit and reorder

## 📝 Memo pad

* Add: select chat text → **Memo**, the 📝 bubble, or paste many in the 📝 tab (OOC wrappers come off)
* A memo is its text; an optional title shows in lists instead, the text on hover
* **💬 Send OOC** (Ctrl+Enter): get the result as a character message, steer the next reply (`/guided`), send as me, or put in the input
* Use memos in the 🌟 topic box, `[[memo]]`, or scripts (`/memo`)

## Message numbers and variables

* Messages count from 1. Imported SillyTavern QRs (counting from 0) are converted once; one that can't be converted keeps counting from 0, with the reason in the editor
* Chat variables go into Marinara's chat variables when the name and value fit (so `{{getvar::name}}` works in prompts and lorebooks)

## Commands

The editor's command list shows every command with its arguments. Dispensa's and Marinara's own:

| Group | Commands |
|---|---|
| Tracker | `/tracker-get` `/tracker-set` `/tracker-add` `/agents-retry` (paths: `date`, `world.<field>`, `custom.<field>`, `persona.<stat>`, `char.<name>.<field>`, `status`…) |
| Lorebooks, persona, connections | `/lore-books` `/lore-list` `/persona-get` `/connection` `/connections` `/peek-prompt` `/reload-page` |
| Text and data | `/trim` `/split` `/join` `/json-get` `/json-set` `/json-keys` `/randompick` `/date` `/count` `/isempty` |
| Input | `/form` `/pick` `/confirm` `/notify` `/wait-reply` |
| Dock, visualizer, memo pad | `/dock` `/dock-layout` `/qr-later` `/visz` `/memo` `/memo-add` `/memo-list` `/randomchar` |
| Marinara's own | `/guided` `/as` `/impersonate` `/illustrate` `/selfie` `/video` `/emote` `/roll` `/remind` `/scene` `/status` `/goto` `/random` `/impersonate_prompt` |


## License and credits

* Dispensa is released under the [GNU AGPL-3.0](LICENSE). Copyright (C) 2026 FigCake
* The STscript interpreter follows the source and behavior of [SillyTavern](https://github.com/SillyTavern/SillyTavern) (AGPL-3.0), and the Marinara integration follows the API and behavior of [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine) (AGPL-3.0); Dispensa is treated as derived from both and uses the same license
* The complete source is `ME-Dispensa-<version>-source.zip` in the public repository. If you distribute a modified version or offer it as a service, its source must be released under the AGPL-3.0 too
* The 🌟 슈퍼비즈 visualizer prompt (the text of `src/visz/superviz.ts`), the 수퍼라비 prompt of the Last message QR (`src/visz/last-message.ts`) and the prompts of the example QRs Cooking & recipe and The Holiday Drop (`src/qr/examples.ts`) are Copyright (C) 2026 FigCake and licensed separately, under [CC BY-NC-SA 4.0](LICENSE-SUPERVIZ.txt): share and adapt them with credit, not for commercial use, adaptations under the same license. They are text Dispensa sends to the AI, not code; everything else in Dispensa, the default QRs and other samples included, is AGPL-3.0
* Icons from [Lucide](https://lucide.dev) (ISC); image saving uses [html-to-image](https://github.com/bubkoo/html-to-image) (MIT); license texts in `THIRD_PARTY_NOTICES.txt` and at the end of `extension.js`
