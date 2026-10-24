# Dispensa

A quick reply bar for [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine): runs SillyTavern Quick Replies (STscript) in Marinara, from a bar above the chat input. *Dispensa* is Italian for pantry. 한국어: [README-ko.md](README-ko.md)

## Features

* **Dock** — round icon bubbles above the chat input, out of sight until you want them
* **SillyTavern QR sets, as they are** — an STscript interpreter runs `/gen`, `/sendas`, `/if`, `/setvar`, closures, pipes and the rest
* **The whole Quick Reply feature set** — auto-run, sub menus, sets per chat or character, an editor with suggestions and a debugger
* **Marinara from scripts** — the Tracker Panel, lorebooks, character cards, the persona, the AI connection, the Author's Note
* **📝 Memo pad** — keep text from the chat, send it as OOC or use it for a 🌟 page
* **🌟 Visualizer** — HTML pages from the 슈퍼비즈 prompt
* **Screen language** — English or 한국어 (🌐 in the Dispensa window; follows Marinara's language by default, shared with Fornello)

## Dock

Star left of the input → `⋯` handle → point at it or touch it.

| Bubble | Does |
|---|---|
| 🍰 | Visualizer menu |
| 📝 | Memo pad |
| ⚙ | Dispensa window (the Library) |
| Sets · QRs | What the **Dock** tab puts there; a set is a folder |
| Stop | Shows while a QR runs |

| Action | Result |
|---|---|
| Click a QR | Run it |
| **Ctrl+click** (⌘+click on a Mac) | Edit it |
| **Right-click** (long-press on phones) | Open its sub menu |

The Dock is the same row of shortcuts in every chat, apart from where sets auto-run. In the Dispensa window's **Dock** tab: **+ Set** (a set as one **Folder** bubble, or a **Row**: its QRs as bubbles on a line of their own), **+ QR** (one QR), **New QR** (make one right there: command/script, OOC or visualizer page; it is kept in a 'Dock' set that auto-runs everywhere), ⠿ to reorder, ✕ to take off. Example: make `/pg-translate` (Polyglot's paragraph translation of the last reply) a new QR with an icon, turn on auto-run after the AI's reply, or leave it off and click it.

## Library (the Dispensa window)

| Button | Does |
|---|---|
| **Import QRs** | Import SillyTavern QR set JSON (several at once; a one-QR file goes into the open set) |
| **New set** · **New QR** | Make your own (a new QR starts as a command/script, an OOC, or a visualizer page) |
| **Export** | `.qr.json` for SillyTavern (numbering converted back; you are warned about commands it lacks) or `.mqr.json` for Marinara |
| **Paste** | Paste a copied QR (plain text becomes a QR that sends it) |
| ⠿ | Drag to reorder; sets also drag to another list |
| ⋯ | Set: duplicate, delete · QR: copy, cut, duplicate, move/copy to a set, export one, delete |

The set column is split like SillyTavern's lists: **Global** · **This chat** · **Character** (each character in the chat) decide where a set's QRs auto-run; **All sets** lists every set. Drag from All sets to add, back to remove, between lists to move.

| Set setting | Means |
|---|---|
| Auto-run in | Where it auto-runs, as switches: global · this chat · a character |
| Color | Fill or outline color |
| How text QRs send | What a plain-text QR does: put in the input, append to it, or prepend |

| QR editor | |
|---|---|
| Script | STscript; `/` or `{{` brings suggestions |
| Command list | Search, click to insert; marked SillyTavern / Dispensa / Marinara, or with the name of the extension that added it (Polyglot's `/pg-translate`, `/pg-annotate`…) |
| Sub menu | Sub menus: chained items, `%%parent%%` |
| Auto-run | App start · after my message · after the AI's reply · opening a chat · new chat · each group turn · right before the AI writes · a lorebook entry in play · block other auto-runs |
| **▶ Run** (Ctrl+Enter) | Run, result below |
| **🐞 Step** | Step through (into, over, out); breakpoints on line numbers or `/breakpoint` |

## 🌟 Visualizer

* 🍰 bubble → topic box → **🌟 Make page**
* `[[mood|bright|dark]]` asked at run time; `[[memo]]` (or `[[메모]]`) picks a memo
* The Visualizer set holds ordinary QRs that make pages with `/visz`: ask for a topic, the last message's scene, a memo; topics are kept in the memo pad
* Viewer above the bar: ☆ gallery · ➤ into the chat · ⤓ HTML file · 🖼 PNG · ⛶ fullscreen · ✕ close; or straight to the chat
* HTML code blocks in the chat get a 🌟 view button

| Setting | Means |
|---|---|
| Mode | Auto (full with Fornello, light otherwise), full (scripts, needs [Fornello](https://github.com/FigCake/ME.Fornello)), light (HTML and CSS only) |
| Show result in | Viewer or chat |
| Result language | The page's language |
| Chat pages to Gallery too | Keep pages sent to the chat in the gallery too |
| Allow outside resources | Let viewer pages load fonts and images from the web |
| AI connection | A separate connection for the visualizer |
| Prompt | Superviz in chunks to switch, edit, reorder; **Reset** restores it |

* Marinara's CSP stops page scripts; with Fornello, the viewer runs them on ▶ Run
* Additions to the original 슈퍼비즈: Google Fonts and async errors shown in the page (full mode); key visuals as inline SVG (both modes)
* With Fornello, a "Fornello commands" chunk teaches the page commands (`genChat`, `setLore`, `setTracker`, …): DM-style pages get real replies, and what happens there goes back to the story (`"@chat"` lorebook, tracker)

## 📝 Memo pad

* Add: select chat text → **📝 Memo** · the 📝 bubble · paste many in the 📝 tab (`*{OOC: …}*` / `[OOC: …]` wrappers come off)
* **💬 Send OOC** (Ctrl+Enter): as a character reply to the request · steering the next reply (Marinara's `/guided`) · as your message · into the input
* Use in the 🌟 topic box, `[[memo]]`, or scripts: `/memo`, `/memo-add`, `/memo-list`, `/ooc`

## Variables

* Chat variables go into Marinara's chat variables when they fit its rules (`{{getvar::name}}` works in prompts and lorebooks)
* Message numbers: converted once on import (SillyTavern counts from 0, Marinara from 1), back on export

## Setup

1. In the server `.env`, set `ENABLE_EXTERNAL_EXTENSIONS=true` and restart Marinara
2. Settings → Addons → External Extensions: turn on **Allow third-party extension imports**, then import `ME-Dispensa-<version>.zip`
3. Open **Dispensa** in the list → **Review and Run**: read the code and approve the hash (it must equal the one in `SHA256SUMS.txt`)

With [Fetchy](https://github.com/FigCake/ME.Fetchy), add `FigCake/ME.Dispensa` as a source to install and update.

## Is it safe

Dispensa asks for **full_page_access**: it draws the bar above the chat input and runs QRs in the page. It reads and writes the chat and calls the AI only when you run a QR, and talks to no outside server. Commands that delete messages, QRs or sets, or change a character card, ask first.


## License and credits

* Dispensa is released under the [GNU AGPL-3.0](LICENSE). Copyright (C) 2026 FigCake
* The STscript interpreter follows the source and behavior of [SillyTavern](https://github.com/SillyTavern/SillyTavern) (AGPL-3.0), and the Marinara integration follows the API and behavior of [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine) (AGPL-3.0); Dispensa is treated as derived from both and uses the same license
* The complete source is `ME-Dispensa-<version>-source.zip` in the public repository. If you distribute a modified version or offer it as a service, its source must be released under the AGPL-3.0 too
* The 🌟 슈퍼비즈 visualizer prompt (the text of `src/visz/superviz.ts`) is Copyright (C) 2026 FigCake and licensed separately, under [CC BY-NC-SA 4.0](LICENSE-SUPERVIZ.txt): share and adapt it with credit, not for commercial use, adaptations under the same license. It is text Dispensa sends to the AI, not code; everything else in Dispensa, the default QRs and other samples included, is AGPL-3.0
* Icons from [Lucide](https://lucide.dev) (ISC); image saving uses [html-to-image](https://github.com/bubkoo/html-to-image) (MIT), license text in `THIRD_PARTY_NOTICES.txt` and at the end of `extension.js`
