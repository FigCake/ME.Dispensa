# Dispensa

Quick replies (`/commands` and scripts) on a Dock above the chat input in [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine), with easy choice QRs, a memo pad and memo boards, a 🌟 visualizer that turns a topic into an HTML page, and commands for Marinara's tracker, lorebooks, characters and connections. *Dispensa* is Italian for pantry. 한국어: [README-ko.md](README-ko.md)

## Setup

1. In the server `.env`, set `ENABLE_EXTERNAL_EXTENSIONS=true` and restart Marinara
2. Settings → Addons → External Extensions: turn on **Allow third-party extension imports**, import `ME-Dispensa-<version>.zip`
3. **Dispensa** → **Review and Run**: approve the hash (it must equal the one in `SHA256SUMS.txt`)

Or add `FigCake/ME.Dispensa` in [Fetchy](https://github.com/FigCake/ME.Fetchy). Dispensa needs **full_page_access**; it reads and writes the chat and calls the AI only when a QR runs, and talks to no outside server.

## Dock

Star left of the input → point at or touch the `⋯` handle above it.

* Bubbles: 🍰 visualizer · 📝 memo pad · ⚙ Dispensa window · your sets and QRs · 🔥 Fornello's buttons · stop while a QR runs
* Click runs a QR, **Ctrl/⌘+click** edits it, **right-click** (long-press) opens its sub menu
* In the QR library, put a set on it with "On the Dock" (folder or row) and a QR with "Own bubble on the Dock"; the same in every chat. The order and the 🍰 / 📝 bubbles are in the window's ⚙

Marinara's top bar → the cake → **📚 QR library**, **📋 Memo boards** or **🖼 Gallery** opens the Dispensa window on that tab. Its tabs and tools are icons (names on hover), **?** explains each setting, and **⚙** in its header holds Dispensa's settings (the whole screen on a phone): the AI connection for pages, OOC results and Gallery runs, whether the chat's RP preset goes along (lorebooks and the summary always do), and the Dock's order and bubbles. A QR's `/gen` uses the chat's own connection.

## Library and QR editor

* **Import**: `.mqr.json` or SillyTavern QR sets (converted); **Export**: `.mqr.json`; copy, paste, drag to reorder
* **Global** · **This chat** · **Character** decide where a set's QRs auto-run; **All sets** holds every set
* **New QR**: **QR** (a /command or script), **Easy choice QR**, **Visualizer QR**
* Editor: suggestions (`/`, `{{`), a searchable command list, sub menus, auto-run triggers, **▶ Run** (Ctrl+Enter), **🐞 Step** with breakpoints

### Easy choice QRs

Cards that ask their steps (choices or text boxes) in order, then send one prompt with the answers (`{{name}}`). **Turn into a script** keeps only the script. Try the **Example QRs** set: **Cooking & recipe**, **The Holiday Drop**.

## 🌟 Visualizer

* 🍰 → topic → **🌟 Make page**; `[[mood|bright|dark]]` is asked at run time, `[[memo]]` picks a memo
* The **Visualizer** set: **Last message** (the last message as an interactive scene) and **Fandom wiki**, made with `/visz`
* Viewer above the Dock: send to chat, save as HTML or PNG, fullscreen; HTML code blocks in the chat get a 🌟 button
* Gallery (🍰 → 🖼, or the window's 🖼 tab): a list or cards with a picture of each page (▦), folders, search, ☑ to move or delete several, 📋 to put a page on a memo board. ⚙ chooses what it keeps by itself — results in the open chat, Gallery runs, or both — and whether only HTML pages; ☆ in the viewer always saves. Pages are kept on Marinara's server (in its game assets folder, `dispensa/gallery`), so every device sees them
* **▶** (Gallery): runs any QR for the Gallery only — nothing goes to the chat, it can run while the chat replies, on "Gallery runs' AI" (⚙) with the chat's card, persona, messages, preset, lorebooks and summary
* Pages are full (with scripts) when [Fornello](https://github.com/FigCake/ME.Fornello) is there to run them (Marinara's CSP blocks page scripts), HTML and CSS only otherwise. With Fornello's character assets, a page's `{{raw::name}}` and `[img:name]` show the chat's characters' pictures (in the viewer and the Gallery too), and scripts get `/asset` and `/assets`
* Settings (**Visualizer**, under the sets in the QR library): language, where the result goes (viewer, current chat or Gallery), full pages (off: HTML and CSS only, even with Fornello), outside resources, the prompt in chunks to switch, edit and reorder, and export / import (.visz.json)

## 📝 Memo pad

* Add: select chat text → **Memo**, the 📝 bubble, or paste many in the 📝 tab (OOC wrappers come off)
* An optional title shows in lists; the text shows on hover
* **💬 Send OOC** (Ctrl+Enter): as a character message, to steer the next reply (`/guided`), as me, or into the input
* Use memos in the 🌟 topic box, `[[memo]]` or `/memo`
* Where a memo shows: 🌐 every chat · 👤 this character's chats · 📍 this chat. The 📝 tab sets where new ones go; the button on a memo moves it
* Memos are drawn: Markdown (headings, **bold**, *italic*, ~~strikethrough~~, `code`, lists, checkboxes) plus `<u>` and `<span style="color · font-size · font-family">`, written with format buttons. OOC, the input, pages and scripts get the text without the tags
* ⋯ → Duplicate; Delete can be undone from the toast
* The 📝 bubble lists the 4 newest and the 📌 pinned memos shown in this chat; `/memo-list chat` · `character` · `global` keeps to one place
* The 📝 bubble's 📋 tab lists the memo boards; one opens in the Dispensa window

### 📋 Boards

Dispensa window → 📋: memos laid out like a cork board.

* A card is the memo itself (edit either) and drawn the same way; a memo can be on several boards (⋯ → On a board)
* Drag cards; on a phone a tap opens one large and a long press picks it up (drag, resize from its corner, turn with its top knob). Pan by dragging, zoom with the wheel or two fingers
* Magnets and background pictures go to Marinara's Global Gallery ("Dispensa" folder), so every device sees them
* **Sections** (▦): a frame of 2–6 columns; ⠿ moves a block, ⇥ ⤓ merge, ⇤ ⤒ split, empty sections take a memo or picture
* 💬 sends the board top to bottom; cards are numbered in that order (⋯ → No card numbers)
* 🎨 **Themes**: 12 to start from (Warm workspace, Bento, Editorial serif, Dark tech, Guideline sheet, Duotone, Kinetic type, Architect grid, Pop sticker, Cottage scrapbook, Clean neutral, Linen journal), then change any of 7 colors, the title and card fonts (installed fonts too), corners, shadow, background pattern and tilt; **Advanced** takes CSS of your own, applied only inside the board
* 💾 **Save this look** keeps it in **My themes**; ⬇ saves it as a `.board-theme.json` file to share, ⬆ loads one
* With the Gallery: a page put on a board is its picture (a tap opens the page); a card's ⋯ or 💬 → **🖼 Run a QR for the Gallery** runs a QR with that memo or the whole board as its memo

## Message numbers and variables

* Messages count from 1; imported SillyTavern QRs (counting from 0) are converted once, and one that can't be keeps counting from 0 with the reason in the editor
* Chat variables also go into Marinara's chat variables when they fit, so `{{getvar::name}}` works in prompts and lorebooks

## Commands

Every command and its arguments are in the editor's command list. Dispensa's and Marinara's own:

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
* The 🌟 visualizer prompt (the text of `src/visz/superviz.ts`), the prompt of the Last message QR (`src/visz/last-message.ts`) and the prompts of the example QRs Cooking & recipe and The Holiday Drop (`src/qr/examples.ts`) are Copyright (C) 2026 FigCake and licensed separately, under [CC BY-NC-SA 4.0](LICENSE-SUPERVIZ.txt): share and adapt them with credit, not for commercial use, adaptations under the same license. They are text Dispensa sends to the AI, not code; everything else in Dispensa, the default QRs and other samples included, is AGPL-3.0
* Icons from [Lucide](https://lucide.dev) (ISC); image saving uses [html-to-image](https://github.com/bubkoo/html-to-image) (MIT); license texts in `THIRD_PARTY_NOTICES.txt` and at the end of `extension.js`
