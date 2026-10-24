/*! Dispensa 0.3.0 — quick reply bar for Marinara Engine 2.5.x (External Extension).
 * Runs SillyTavern Quick Replies (STscript) in Marinara.
 * Copyright (C) 2026 FigCake. Derived from SillyTavern and Marinara Engine (both AGPL-3.0); includes html-to-image (MIT).
 * License: AGPL-3.0, except the 슈퍼비즈 prompt text (the SUPERVIZ chunks): CC BY-NC-SA 4.0, see LICENSE-SUPERVIZ.txt.
 * Source: https://github.com/FigCake/ME.Dispensa (ME-Dispensa-0.3.0-source.zip) */
"use strict";
(() => {
  // src/host/marinara-global.ts
  var resolved = null;
  function getMarinara() {
    if (resolved) return resolved;
    const scoped = typeof marinara !== "undefined" ? marinara : globalThis.marinara;
    if (scoped) {
      resolved = scoped;
      return scoped;
    }
    const KEY5 = "dispensa-dev-storage";
    const read = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY5) ?? "{}");
      } catch {
        return {};
      }
    };
    return {
      version: 0,
      log: console,
      storage: {
        get: async () => read(),
        patch: async (values) => {
          const next = { ...read(), ...values };
          localStorage.setItem(KEY5, JSON.stringify(next));
          return next;
        }
      },
      onCleanup: () => {
      }
    };
  }

  // src/host/api.ts
  var ApiError = class extends Error {
    constructor(message, status, body) {
      super(message);
      this.status = status;
      this.body = body;
      this.name = "ApiError";
    }
  };
  async function api(path, options = {}) {
    const method = options.method ?? "GET";
    const headers = { Accept: "application/json" };
    if (method !== "GET") headers["x-marinara-csrf"] = "1";
    if (options.body !== void 0) headers["Content-Type"] = "application/json";
    const doFetch = getMarinara().fetch ?? fetch;
    const res = await doFetch(`/api${path}`, {
      method,
      headers,
      body: options.body === void 0 ? void 0 : JSON.stringify(options.body),
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal
    });
    const text7 = await res.text();
    let data = text7;
    try {
      data = text7 ? JSON.parse(text7) : null;
    } catch {
    }
    if (!res.ok) {
      const message = (data && typeof data === "object" && "error" in data ? String(data.error) : "") || `${res.status} ${res.statusText}`;
      throw new ApiError(message, res.status, data);
    }
    return data;
  }

  // src/i18n.ts
  var KEY = "figcake:lang";
  var LANG_EVENT = "figcake:lang";
  function langChoice() {
    try {
      const v = localStorage.getItem(KEY);
      return v === "en" || v === "ko" ? v : "auto";
    } catch {
      return "auto";
    }
  }
  function setLangChoice(choice) {
    try {
      if (choice === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch {
    }
    override = choice;
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LANG_EVENT));
  }
  var override = null;
  function lang() {
    const choice = override ?? langChoice();
    if (choice !== "auto") return choice;
    const html = typeof document !== "undefined" ? document.documentElement.lang : "";
    return /^ko\b/i.test(html) ? "ko" : "en";
  }
  function t(en, ko) {
    return lang() === "ko" ? ko : en;
  }
  function onLangChange(fn) {
    let last = lang();
    const check2 = () => {
      const now = lang();
      if (now !== last) {
        last = now;
        fn();
      }
    };
    window.addEventListener(LANG_EVENT, check2);
    const watch = new MutationObserver(check2);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => {
      window.removeEventListener(LANG_EVENT, check2);
      watch.disconnect();
    };
  }
  var LANG_NAMES = {
    auto: () => t("Same as Marinara", "마리나라 언어 따르기"),
    en: () => "English",
    ko: () => "한국어"
  };

  // src/host/composer.ts
  var visible = (el2) => {
    const r = el2.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  function findComposer() {
    const areas = [...document.querySelectorAll("textarea[data-chat-composer]")];
    const textarea = areas.find(visible) ?? areas[0];
    if (!textarea) return null;
    const container = textarea.closest(".mari-chat-input") ?? textarea.parentElement;
    return { textarea, container, sendButton: findSendButton(container), chatId: textarea.dataset.chatId || null };
  }
  function findSendButton(container) {
    const byClass = container.querySelector(".mari-chat-send-btn");
    if (byClass) return byClass;
    const buttons = [...container.querySelectorAll("button")];
    return buttons.find((b) => /send|보내|전송/i.test(`${b.getAttribute("aria-label") ?? ""} ${b.title}`)) ?? buttons.find((b) => b.querySelector("svg.lucide-send, svg.lucide-send-horizontal, svg.lucide-arrow-up")) ?? null;
  }
  function setComposerText(textarea, text7) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(textarea, text7);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function isGenerating(composer) {
    if (!composer) return false;
    const b = composer.sendButton;
    if (!b) return false;
    return !!b.querySelector("svg.lucide-square, svg.lucide-circle-stop, svg.lucide-loader-circle, .animate-spin") || /stop|중지/i.test(b.getAttribute("aria-label") ?? "");
  }
  async function waitUntil(test, timeoutMs, stepMs = 100) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if (test()) return true;
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return test();
  }
  async function submitThroughComposer(line) {
    const composer = findComposer();
    if (!composer) throw new Error(t("Couldn't find the chat input. Open a chat and run it again.", "채팅 입력창을 찾지 못했어요. 채팅을 연 상태에서 실행해 주세요."));
    await waitUntil(() => !isGenerating(findComposer()), 12e4);
    const draft = composer.textarea.value;
    setComposerText(composer.textarea, line);
    await new Promise((r) => setTimeout(r, 30));
    const button = findComposer()?.sendButton ?? composer.sendButton;
    if (button && !button.disabled) {
      button.click();
    } else {
      composer.textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", ctrlKey: true, bubbles: true }));
    }
    if (draft) {
      await waitUntil(() => composer.textarea.value === "", 2e3, 50);
      setComposerText(composer.textarea, draft);
    }
  }

  // src/host/variables.ts
  var MARINARA_NAME = /^[A-Za-z_]\w{0,63}$/;
  var MAX_VALUE = 1e4;
  var MAX_VARS = 500;
  function fitsMarinara(name, value) {
    return MARINARA_NAME.test(name) && value.length <= MAX_VALUE;
  }
  var ChatVariables = class {
    chatId = null;
    marinaraVars = /* @__PURE__ */ new Map();
    privateVars = /* @__PURE__ */ new Map();
    dirtyMarinara = /* @__PURE__ */ new Map();
    dirtyPrivate = false;
    get currentChatId() {
      return this.chatId;
    }
    /** Switch to a chat (or reload it with fresh metadata). Pending writes are flushed first. */
    async load(chatId, metadata) {
      await this.flush();
      const marinaraVars = /* @__PURE__ */ new Map();
      const privateVars = /* @__PURE__ */ new Map();
      if (chatId) {
        const meta = parseObject(metadata);
        for (const [k, v] of Object.entries(parseObject(meta.macroVariables))) marinaraVars.set(k, String(v));
        const stored = await getMarinara().storage.get();
        const all = parseObject(stored.chatVars);
        for (const [k, v] of Object.entries(parseObject(all[chatId]))) privateVars.set(k, String(v));
      }
      this.chatId = chatId;
      this.marinaraVars = marinaraVars;
      this.privateVars = privateVars;
      this.dirtyMarinara.clear();
      this.dirtyPrivate = false;
    }
    get(name) {
      return this.marinaraVars.get(name) ?? this.privateVars.get(name);
    }
    has(name) {
      return this.marinaraVars.has(name) || this.privateVars.has(name);
    }
    set(name, value) {
      this.requireChat();
      const inMarinara = this.marinaraVars.has(name);
      const canUseMarinara = (inMarinara || fitsMarinara(name, value) && this.marinaraVars.size < MAX_VARS) && value.length <= MAX_VALUE;
      if (canUseMarinara && !this.privateVars.has(name)) {
        this.marinaraVars.set(name, value);
        this.dirtyMarinara.set(name, value);
      } else {
        if (inMarinara) {
          this.marinaraVars.delete(name);
          this.dirtyMarinara.set(name, null);
        }
        this.privateVars.set(name, value);
        this.dirtyPrivate = true;
      }
    }
    delete(name) {
      if (this.marinaraVars.delete(name)) this.dirtyMarinara.set(name, null);
      if (this.privateVars.delete(name)) this.dirtyPrivate = true;
    }
    entries() {
      return [...this.marinaraVars.entries(), ...this.privateVars.entries()];
    }
    async flush() {
      const chatId = this.chatId;
      if (!chatId) return;
      let pending = Object.fromEntries(this.dirtyMarinara);
      this.dirtyMarinara.clear();
      for (let attempt = 0; attempt < 8 && Object.keys(pending).length; attempt++) {
        try {
          await api(`/chats/${encodeURIComponent(chatId)}/metadata`, { method: "PATCH", body: { macroVariables: pending } });
          pending = {};
        } catch (e) {
          const bad = e instanceof ApiError ? /Invalid chat variable name: (.+)$|Chat variable (.+) is too long/.exec(e.message) : null;
          const name = bad?.[1] ?? bad?.[2];
          if (!name || !(name in pending)) throw e;
          const value = pending[name];
          delete pending[name];
          this.marinaraVars.delete(name);
          if (value !== null) {
            this.privateVars.set(name, value);
            this.dirtyPrivate = true;
          }
        }
      }
      if (this.dirtyPrivate) {
        this.dirtyPrivate = false;
        const m2 = getMarinara();
        const stored = await m2.storage.get();
        const all = parseObject(stored.chatVars);
        all[chatId] = Object.fromEntries(this.privateVars);
        if (this.privateVars.size === 0) delete all[chatId];
        await m2.storage.patch({ chatVars: all });
      }
    }
    requireChat() {
      if (!this.chatId) throw new Error(t("Chat variables work only with a chat open.", "채팅을 연 상태에서만 채팅 변수를 쓸 수 있어요."));
    }
  };
  var GlobalVariables = class {
    vars = /* @__PURE__ */ new Map();
    loaded = false;
    dirty = false;
    async load() {
      if (this.loaded) return;
      const stored = await getMarinara().storage.get();
      for (const [k, v] of Object.entries(parseObject(stored.globalVars))) this.vars.set(k, String(v));
      this.loaded = true;
    }
    get(name) {
      return this.vars.get(name);
    }
    has(name) {
      return this.vars.has(name);
    }
    set(name, value) {
      this.vars.set(name, value);
      this.dirty = true;
    }
    delete(name) {
      if (this.vars.delete(name)) this.dirty = true;
    }
    entries() {
      return [...this.vars.entries()];
    }
    async flush() {
      if (!this.dirty) return;
      this.dirty = false;
      await getMarinara().storage.patch({ globalVars: Object.fromEntries(this.vars) });
    }
  };
  function parseObject(value) {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  // src/ui/composer-text.ts
  function getComposerText() {
    return findComposer()?.textarea.value ?? "";
  }
  function setComposerTextIfPresent(text7) {
    const composer = findComposer();
    if (composer) setComposerText(composer.textarea, text7);
  }

  // src/ui/sanitize.ts
  var ALLOWED = /* @__PURE__ */ new Set([
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "small",
    "mark",
    "sub",
    "sup",
    "br",
    "hr",
    "p",
    "div",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "font",
    "img",
    "a",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "details",
    "summary"
  ]);
  var ATTRS = /* @__PURE__ */ new Set(["color", "href", "src", "alt", "title", "colspan", "rowspan", "class"]);
  function sanitizeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const out = document.createDocumentFragment();
    for (const node of [...template.content.childNodes]) {
      const clean = cleanNode(node);
      if (clean) out.append(clean);
    }
    return out;
  }
  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el2 = node;
    const tag = el2.tagName.toLowerCase();
    if (!ALLOWED.has(tag)) {
      if (["script", "style", "iframe", "object", "embed", "svg", "math", "template"].includes(tag)) return null;
      const frag = document.createDocumentFragment();
      for (const child of [...el2.childNodes]) {
        const c = cleanNode(child);
        if (c) frag.append(c);
      }
      return frag;
    }
    const copy = document.createElement(tag);
    for (const attr of [...el2.attributes]) {
      const name = attr.name.toLowerCase();
      if (!ATTRS.has(name)) continue;
      if ((name === "href" || name === "src") && !safeUrl(attr.value, name === "src")) continue;
      copy.setAttribute(name, attr.value);
    }
    if (tag === "a") {
      copy.setAttribute("target", "_blank");
      copy.setAttribute("rel", "noopener noreferrer");
    }
    if (tag === "img") copy.setAttribute("referrerpolicy", "no-referrer");
    for (const child of [...el2.childNodes]) {
      const c = cleanNode(child);
      if (c) copy.append(c);
    }
    return copy;
  }
  function safeUrl(url, isImage) {
    const u = url.trim().toLowerCase();
    if (u.startsWith("https://") || u.startsWith("http://")) return true;
    return isImage && u.startsWith("data:image/");
  }

  // src/ui/theme.ts
  var THEME_TOKENS = `
:host {
  --d-font: var(--dsp-font, inherit);
  --d-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  --d-text: var(--marinara-chat-chrome-panel-text, var(--foreground, #e5e5e5));
  --d-title: var(--marinara-chat-chrome-panel-title, var(--d-text));
  --d-muted: var(--marinara-chat-chrome-panel-muted, var(--muted-foreground, #a1a1aa));
  --d-line: var(--marinara-chat-chrome-panel-border, var(--border, #333));
  --d-divider: var(--marinara-chat-chrome-panel-divider, var(--d-line));
  --d-panel: var(--marinara-chat-chrome-panel-bg, var(--popover, #141414));
  --d-panel-solid: linear-gradient(var(--d-panel), var(--d-panel)), var(--background, #111);
  --d-btn-bg: var(--marinara-chat-chrome-button-bg, var(--secondary, #222));
  --d-btn-border: var(--marinara-chat-chrome-button-border, var(--d-line));
  --d-btn-text: var(--marinara-chat-chrome-button-text, var(--d-text));
  --d-btn-bg-hover: var(--marinara-chat-chrome-button-bg-hover, var(--accent, #2a1a3e));
  --d-btn-border-hover: var(--marinara-chat-chrome-button-border-hover, var(--d-accent));
  --d-btn-text-hover: var(--marinara-chat-chrome-button-text-hover, var(--d-text));
  --d-btn-bg-active: var(--marinara-chat-chrome-button-bg-active, var(--d-btn-bg-hover));
  --d-btn-border-active: var(--marinara-chat-chrome-button-border-active, var(--d-accent));
  --d-btn-text-active: var(--marinara-chat-chrome-button-text-active, var(--d-accent));
  --d-hl-bg: var(--marinara-chat-chrome-highlight-bg, var(--accent, #2a1a3e));
  --d-hl-text: var(--marinara-chat-chrome-highlight-text, var(--d-accent));
  --d-field: var(--marinara-chat-chrome-input-bg, var(--input, #141414));
  --d-field-border: var(--marinara-chat-chrome-input-border, var(--d-line));
  --d-field-focus: var(--marinara-chat-chrome-input-border-focus, var(--d-accent));
  --d-ring: var(--marinara-chat-chrome-focus-ring, var(--ring, var(--d-accent)));
  --d-accent: var(--marinara-chat-chrome-accent, var(--primary, #ec4b97));
  --d-accent-fill: var(--marinara-chat-chrome-accent-gradient, var(--d-accent));
  --d-accent-text: var(--primary-foreground, #fff);
  --d-danger: var(--destructive, #e5484d);
  --d-radius: var(--radius, 0.75rem);
  --d-radius-sm: calc(var(--d-radius) - 0.25rem);
  --d-shadow: 0 10px 30px rgb(0 0 0 / 0.28);
  --d-shell-bg: var(--dsp-shell-bg, var(--marinara-chat-chrome-input-bg, var(--d-panel)));
  --d-shell-border: var(--dsp-shell-border, 1px solid var(--d-field-border));
  --d-shell-radius: var(--dsp-shell-radius, var(--d-radius));
  --d-shell-shadow: var(--dsp-shell-shadow, none);
  --d-shell-blur: var(--dsp-shell-blur, none);
}
`;
  var CONTROLS = `
button { font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
  border: 1px solid var(--d-btn-border); background: var(--d-btn-bg); color: var(--d-btn-text); font-weight: 600;
  border-radius: var(--d-radius-sm); padding: 5px 10px;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 120ms ease; }
button:hover { border-color: var(--d-btn-border-hover); background: var(--d-btn-bg-hover); color: var(--d-btn-text-hover); }
button:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--d-ring); }
button:active { transform: scale(0.98); }
button:disabled { cursor: not-allowed; opacity: .45; transform: none; }
button.ghost { background: transparent; border-color: transparent; color: var(--d-muted); font-weight: 500; }
button.ghost:hover { background: var(--d-hl-bg); color: var(--d-hl-text); border-color: transparent; }
button.sel, button.on, button[aria-pressed="true"] { border-color: var(--d-btn-border-active); background: var(--d-btn-bg-active); color: var(--d-btn-text-active); }
button.primary { background: var(--d-accent-fill); color: var(--d-accent-text); border-color: transparent; font-weight: 700; }
button.primary:hover { filter: brightness(1.06); color: var(--d-accent-text); }
button.danger:hover { border-color: var(--d-danger); color: var(--d-danger); background: color-mix(in srgb, var(--d-danger) 10%, transparent); }
input:not([type=checkbox]):not([type=radio]), textarea, select { font: inherit; color: var(--d-text); background: var(--d-field);
  border: 1px solid var(--d-field-border); border-radius: var(--d-radius-sm); padding: 6px 9px; outline: none; }
input:not([type=checkbox]):not([type=radio]):focus, textarea:focus, select:focus { border-color: var(--d-field-focus); box-shadow: 0 0 0 2px var(--d-ring); }
input::placeholder, textarea::placeholder { color: var(--d-muted); }
input[type=checkbox], input[type=radio] { accent-color: var(--d-accent); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--marinara-chat-chrome-panel-scrollbar, var(--d-line)); border-radius: 8px; }
`;
  var ThemeSync = class {
    style = document.createElement("style");
    observer = null;
    timer = null;
    last = "";
    composer = null;
    start() {
      this.style.id = "dispensa-theme";
      document.head.append(this.style);
      this.observer = new MutationObserver((records) => {
        if (records.some((r) => r.target === this.style || r.type === "childList" && [...r.addedNodes].every((n) => n === this.style))) return;
        this.schedule();
      });
      this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
      this.observer.observe(document.head, { childList: true, subtree: true, characterData: true });
      this.refresh();
    }
    stop() {
      this.observer?.disconnect();
      if (this.timer) clearTimeout(this.timer);
      this.style.remove();
    }
    /** Call when the composer may have been replaced (React re-render, chat switch). */
    noticeComposer() {
      const composer = document.querySelector(".mari-chat-input-box");
      if (composer !== this.composer) {
        this.composer = composer;
        this.schedule();
      }
    }
    schedule() {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.refresh(), 120);
    }
    refresh() {
      const values = {};
      values["--dsp-font"] = getComputedStyle(document.body).fontFamily;
      const box = document.querySelector(".mari-chat-input-box");
      if (box) {
        const cs = getComputedStyle(box);
        const image = cs.backgroundImage && cs.backgroundImage !== "none" ? `${cs.backgroundImage}, ` : "";
        values["--dsp-shell-bg"] = `${image}linear-gradient(${cs.backgroundColor}, ${cs.backgroundColor})`;
        values["--dsp-shell-border"] = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
        values["--dsp-shell-radius"] = cs.borderTopLeftRadius;
        values["--dsp-shell-shadow"] = cs.boxShadow;
        values["--dsp-shell-blur"] = cs.backdropFilter || "none";
      }
      const css = `:root {
${Object.entries(values).filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v};`).join("\n")}
}`;
      if (css !== this.last) {
        this.last = css;
        this.style.textContent = css;
      }
    }
  };

  // src/ui/dialogs.ts
  var STYLE = `
:host { all: initial; }
${THEME_TOKENS}
* { box-sizing: border-box; }
.layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font: 14px/1.45 var(--d-font); color: var(--d-text); }
${CONTROLS}
.toasts { position: fixed; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; max-width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.toast { pointer-events: auto; padding: 10px 14px; border-radius: var(--d-radius); border: 1px solid var(--d-line);
  background: var(--d-panel-solid); box-shadow: var(--d-shadow); backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur);
  font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; animation: in .15s ease-out; }
.toast .title { font-weight: 600; margin-bottom: 2px; color: var(--d-title); }
.toast.success { border-color: #3fb97a; } .toast.warning { border-color: #e6a23c; } .toast.error { border-color: var(--d-danger); }
.backdrop { position: fixed; inset: 0; background: rgb(0 0 0 / .5); display: flex; align-items: center; justify-content: center; padding: 16px; pointer-events: auto; animation: fade .12s ease-out; }
.dialog { width: min(440px, 100%); max-height: calc(100vh - 32px); overflow: auto; padding: 18px;
  border-radius: calc(var(--d-radius) + 0.25rem); border: 1px solid var(--d-line); background: var(--d-panel-solid);
  box-shadow: 0 16px 48px rgb(0 0 0 / .45); backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur); }
.dialog.wide { width: min(760px, 100%); } .dialog.large .body { min-height: 40vh; }
.body { font-size: 14px; line-height: 1.5; margin-bottom: 12px; overflow-wrap: anywhere; }
.body img { max-width: 100%; }
textarea, input:not([type=checkbox]):not([type=radio]), select { width: 100%; padding: 8px 10px; resize: vertical; }
.row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; flex-wrap: wrap; }
.row button { padding: 7px 14px; }
.row button.extra { margin-right: auto; }
.choices { display: flex; flex-direction: column; gap: 6px; }
.choices button { text-align: left; width: 100%; justify-content: flex-start; padding: 8px 12px; white-space: normal; }
.pick-list { max-height: 50vh; overflow: auto; margin-top: 8px; }
.fields { display: flex; flex-direction: column; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--d-muted); }
.field.check { flex-direction: row; align-items: center; gap: 8px; color: var(--d-text); }
.field.check input { width: auto; }
.loader { position: fixed; inset: 0; background: rgb(0 0 0 / .4); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; pointer-events: auto; }
.spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--d-line); border-top-color: var(--d-accent); animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes in { from { opacity: 0; transform: translateY(-6px); } }
@keyframes fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;
  var Dialogs = class {
    host = null;
    root = null;
    layer = null;
    toastBox = null;
    loaderEl = null;
    ensure() {
      if (this.layer?.isConnected) return this.layer;
      this.host = document.createElement("div");
      this.host.id = "dispensa-dialogs";
      this.root = this.host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = STYLE;
      this.layer = document.createElement("div");
      this.layer.className = "layer";
      this.toastBox = document.createElement("div");
      this.toastBox.className = "toasts";
      this.layer.append(this.toastBox);
      this.root.append(style, this.layer);
      document.body.append(this.host);
      return this.layer;
    }
    dispose() {
      this.host?.remove();
      this.host = this.root = this.layer = this.toastBox = this.loaderEl = null;
    }
    toast(message, severity = "info", options = {}) {
      this.ensure();
      const el2 = document.createElement("div");
      el2.className = `toast ${severity}`;
      el2.setAttribute("role", severity === "error" ? "alert" : "status");
      if (options.title) {
        const t2 = document.createElement("div");
        t2.className = "title";
        t2.textContent = options.title;
        el2.append(t2);
      }
      el2.append(document.createTextNode(message));
      el2.addEventListener("click", () => el2.remove());
      this.toastBox.append(el2);
      setTimeout(() => el2.remove(), severity === "error" ? 8e3 : 4e3);
    }
    modal(build2, options = {}, onCancel) {
      const layer = this.ensure();
      const backdrop = document.createElement("div");
      backdrop.className = "backdrop";
      const dialog = document.createElement("div");
      dialog.className = `dialog${options.wide ? " wide" : ""}${options.large ? " large" : ""}`;
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      const close = () => {
        backdrop.remove();
        document.removeEventListener("keydown", onKey2, true);
      };
      const onKey2 = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
          onCancel?.();
        }
      };
      document.addEventListener("keydown", onKey2, true);
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target === backdrop) {
          close();
          onCancel?.();
        }
      });
      build2(dialog, close);
      backdrop.append(dialog);
      layer.append(backdrop);
    }
    body(html) {
      const el2 = document.createElement("div");
      el2.className = "body";
      el2.append(sanitizeHtml(html));
      return el2;
    }
    button(label, primary, onClick) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (primary) b.className = "primary";
      b.addEventListener("click", onClick);
      return b;
    }
    input(prompt, options = {}) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const multi = options.multiline || (options.rows ?? 1) > 1 || options.large;
            const field = document.createElement(multi ? "textarea" : "input");
            if (field instanceof HTMLTextAreaElement) field.rows = Math.max(options.rows ?? 4, 2);
            field.value = options.defaultValue ?? "";
            field.placeholder = options.placeholder ?? "";
            const ok = () => {
              close();
              resolve(field.value);
            };
            field.addEventListener("keydown", (e) => {
              const ke = e;
              if (ke.key === "Enter" && (!multi || ke.ctrlKey || ke.metaKey)) {
                ke.preventDefault();
                ok();
              }
            });
            const row = document.createElement("div");
            row.className = "row";
            const extra = options.extra;
            if (extra) {
              const b = this.button(extra.label, false, async () => {
                const text7 = await extra.fill();
                if (text7) {
                  const at = field.selectionStart ?? field.value.length;
                  const gap = field.value.slice(0, at).trim() ? multi ? "\n" : " " : "";
                  field.setRangeText(gap + text7, at, field.selectionEnd ?? at, "end");
                }
                field.focus();
              });
              if (extra.title) b.title = extra.title;
              b.classList.add("extra");
              row.append(b);
            }
            row.append(
              this.button(options.cancelButton ?? t("Cancel", "취소"), false, () => {
                close();
                resolve(null);
              }),
              this.button(options.okButton ?? t("OK", "확인"), true, ok)
            );
            dialog.append(this.body(prompt), field, row);
            setTimeout(() => field.focus(), 0);
          },
          options,
          () => resolve(null)
        );
      });
    }
    popup(html, options = {}) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const row = document.createElement("div");
            row.className = "row";
            if (options.cancelButton) {
              row.append(
                this.button(options.cancelButton, false, () => {
                  close();
                  resolve(false);
                })
              );
            }
            const ok = this.button(options.okButton ?? t("OK", "확인"), true, () => {
              close();
              resolve(true);
            });
            row.append(ok);
            dialog.append(this.body(html), row);
            setTimeout(() => ok.focus(), 0);
          },
          options,
          () => resolve(false)
        );
      });
    }
    /** A blank with suggested answers: click one, or type your own. Null when cancelled. */
    choose(label, options) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const field = document.createElement("input");
            field.placeholder = t("Or type it", "또는 직접 입력");
            field.style.marginTop = "8px";
            const done = (value) => {
              close();
              resolve(value);
            };
            const list = document.createElement("div");
            list.className = "choices";
            for (const option of options) list.append(this.button(option, false, () => done(option)));
            field.addEventListener("keydown", (e) => {
              if (e.key === "Enter" && !e.isComposing) {
                e.preventDefault();
                done(field.value);
              }
            });
            const row = document.createElement("div");
            row.className = "row";
            row.append(this.button(t("Cancel", "취소"), false, () => done(null)), this.button(t("OK", "확인"), true, () => done(field.value)));
            const title = document.createElement("div");
            title.className = "body";
            title.textContent = label;
            dialog.append(title, list, field, row);
            setTimeout(() => field.focus(), 0);
          },
          {},
          () => resolve(null)
        );
      });
    }
    buttons(html, labels, options = {}) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const list = document.createElement("div");
            list.className = "choices";
            const picked = /* @__PURE__ */ new Set();
            for (const label of labels) {
              const b = this.button(label, false, () => {
                if (!options.multiple) {
                  close();
                  resolve(label);
                  return;
                }
                if (picked.has(label)) picked.delete(label);
                else picked.add(label);
                b.className = picked.has(label) ? "primary" : "";
              });
              list.append(b);
            }
            const row = document.createElement("div");
            row.className = "row";
            row.append(
              this.button(t("Cancel", "취소"), false, () => {
                close();
                resolve("");
              })
            );
            if (options.multiple) {
              row.append(
                this.button(t("OK", "확인"), true, () => {
                  close();
                  resolve(JSON.stringify([...picked]));
                })
              );
            }
            if (html.trim()) dialog.append(this.body(html));
            dialog.append(list, row);
          },
          {},
          () => resolve("")
        );
      });
    }
    form(title, fields) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const controls = [];
            const body = document.createElement("div");
            body.className = "fields";
            for (const f of fields) {
              const label = document.createElement("label");
              label.className = f.type === "checkbox" ? "field check" : "field";
              const caption = document.createElement("span");
              caption.textContent = f.label ?? f.name;
              let control;
              if (f.type === "textarea") {
                control = document.createElement("textarea");
                control.rows = 3;
              } else if (f.type === "select") {
                control = document.createElement("select");
                for (const o of f.options ?? []) control.append(new Option(o, o));
              } else {
                control = document.createElement("input");
                control.type = f.type === "number" ? "number" : f.type === "checkbox" ? "checkbox" : "text";
              }
              if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = /^(true|on|1|yes)$/i.test(f.default ?? "");
              else control.value = f.default ?? "";
              if ("placeholder" in control && f.placeholder) control.placeholder = f.placeholder;
              const el2 = control;
              controls.push({ name: f.name, get: () => el2 instanceof HTMLInputElement && el2.type === "checkbox" ? String(el2.checked) : el2.value });
              if (f.type === "checkbox") label.append(control, caption);
              else label.append(caption, control);
              body.append(label);
            }
            const ok = () => {
              close();
              resolve(Object.fromEntries(controls.map((x) => [x.name, x.get()])));
            };
            body.addEventListener("keydown", (e) => {
              const ke = e;
              if (ke.key === "Enter" && (ke.ctrlKey || ke.metaKey || ke.target.tagName === "INPUT")) {
                ke.preventDefault();
                ok();
              }
            });
            const row = document.createElement("div");
            row.className = "row";
            row.append(
              this.button(t("Cancel", "취소"), false, () => {
                close();
                resolve(null);
              }),
              this.button(t("OK", "확인"), true, ok)
            );
            if (title.trim()) dialog.append(this.body(title));
            dialog.append(body, row);
            setTimeout(() => body.querySelector("input, textarea, select")?.focus(), 0);
          },
          {},
          () => resolve(null)
        );
      });
    }
    pick(prompt, items, options = {}) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const search = document.createElement("input");
            search.type = "search";
            search.placeholder = options.placeholder ?? t("Search…", "검색…");
            const list = document.createElement("div");
            list.className = "choices pick-list";
            const picked = /* @__PURE__ */ new Set();
            let active = 0;
            const visible2 = () => items.filter((i) => i.toLowerCase().includes(search.value.trim().toLowerCase()));
            const draw = () => {
              const shown = visible2();
              active = Math.min(active, Math.max(0, shown.length - 1));
              list.replaceChildren(
                ...shown.slice(0, 300).map((item, index) => {
                  const b = this.button(item, picked.has(item) || !options.multiple && index === active, () => choose(item));
                  b.setAttribute("role", "option");
                  return b;
                })
              );
              if (!shown.length) {
                const empty = document.createElement("div");
                empty.className = "body";
                empty.textContent = t("No results.", "검색 결과가 없어요.");
                list.append(empty);
              }
            };
            const choose = (item) => {
              if (!options.multiple) {
                close();
                resolve([item]);
                return;
              }
              if (picked.has(item)) picked.delete(item);
              else picked.add(item);
              draw();
            };
            search.addEventListener("input", () => {
              active = 0;
              draw();
            });
            search.addEventListener("keydown", (e) => {
              const shown = visible2();
              if (e.key === "ArrowDown") active = Math.min(active + 1, shown.length - 1);
              else if (e.key === "ArrowUp") active = Math.max(active - 1, 0);
              else if (e.key === "Enter" && shown[active]) {
                e.preventDefault();
                choose(shown[active]);
                return;
              } else return;
              e.preventDefault();
              draw();
            });
            const row = document.createElement("div");
            row.className = "row";
            row.append(
              this.button(t("Cancel", "취소"), false, () => {
                close();
                resolve([]);
              })
            );
            if (options.multiple) {
              row.append(
                this.button(t("OK", "확인"), true, () => {
                  close();
                  resolve(items.filter((i) => picked.has(i)));
                })
              );
            }
            if (prompt.trim()) dialog.append(this.body(prompt));
            dialog.append(search, list, row);
            draw();
            setTimeout(() => search.focus(), 0);
          },
          {},
          () => resolve([])
        );
      });
    }
    async notify(title, body) {
      try {
        if (typeof Notification !== "undefined") {
          if (Notification.permission === "default") await Notification.requestPermission();
          if (Notification.permission === "granted") {
            new Notification(title, { body });
            return;
          }
        }
      } catch {
      }
      this.toast(body, "info", { title });
    }
    async copy(text7) {
      try {
        await navigator.clipboard.writeText(text7);
      } catch {
        const area = document.createElement("textarea");
        area.value = text7;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
    }
    async paste() {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return await this.input(t("Paste the text here (the browser blocked reading the clipboard).", "붙여 넣을 내용을 여기에 붙여 넣어 주세요 (브라우저가 클립보드 읽기를 막았어요)."), { multiline: true, rows: 4 }) ?? "";
      }
    }
    confirm(message) {
      return this.popup(message, { okButton: t("Yes", "예"), cancelButton: t("No", "아니요") });
    }
    setInput(text7) {
      setComposerTextIfPresent(text7);
    }
    getInput() {
      return getComposerText();
    }
    beep() {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
      }
    }
    loader(state, text7 = "") {
      if (state === "hide") {
        this.loaderEl?.remove();
        this.loaderEl = null;
        return;
      }
      const layer = this.ensure();
      this.loaderEl?.remove();
      const el2 = document.createElement("div");
      el2.className = "loader";
      const spinner = document.createElement("div");
      spinner.className = "spinner";
      el2.append(spinner);
      if (text7) {
        const label = document.createElement("div");
        label.textContent = text7;
        el2.append(label);
      }
      layer.append(el2);
      this.loaderEl = el2;
    }
  };

  // src/host/react-bridge.ts
  var cached = null;
  function isQueryClient(v) {
    return !!v && typeof v === "object" && typeof v.invalidateQueries === "function" && typeof v.getQueryCache === "function";
  }
  function findQueryClient() {
    if (cached) return cached;
    const root = document.getElementById("root");
    if (!root) return null;
    const key2 = Object.keys(root).find((k) => k.startsWith("__reactContainer$"));
    let fiber = key2 ? root[key2] : null;
    const stack = [fiber];
    let visited = 0;
    while (stack.length && visited < 5e3) {
      fiber = stack.pop();
      visited++;
      if (!fiber) continue;
      const f = fiber;
      if (isQueryClient(f.memoizedProps?.client)) {
        cached = f.memoizedProps.client;
        return cached;
      }
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
    return null;
  }
  function refreshChatQueries(chatId) {
    const client = findQueryClient();
    if (!client) return false;
    void client.invalidateQueries({ queryKey: ["chats", "messages", chatId] });
    void client.invalidateQueries({ queryKey: ["chats", chatId] });
    return true;
  }
  async function openChat(chatId) {
    const client = findQueryClient();
    if (client) await client.invalidateQueries({ queryKey: ["chats", "list"] });
    const selector = `[role="button"][data-chat-id="${CSS.escape(chatId)}"]`;
    for (let i = 0; i < 20; i++) {
      const row = document.querySelector(selector);
      if (row) {
        row.click();
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    localStorage.setItem("marinara-active-chat-id", chatId);
    location.reload();
  }
  function refreshQueries(keys) {
    const client = findQueryClient();
    if (!client) return false;
    for (const queryKey of keys) void client.invalidateQueries({ queryKey });
    return true;
  }

  // src/host/chat.ts
  var MarinaraChat = class {
    chat = null;
    characters = [];
    personaName = "User";
    messageCache = null;
    stale = true;
    characterCache = /* @__PURE__ */ new Map();
    personaCache = /* @__PURE__ */ new Map();
    lastActivity = Date.now();
    constructor() {
      window.addEventListener("marinara:generation-complete", this.markStale);
    }
    dispose() {
      window.removeEventListener("marinara:generation-complete", this.markStale);
    }
    markStale = () => {
      this.stale = true;
      this.lastActivity = Date.now();
    };
    activeChatId() {
      const fromComposer = findComposer()?.chatId;
      if (fromComposer) return fromComposer;
      try {
        return localStorage.getItem("marinara-active-chat-id");
      } catch {
        return null;
      }
    }
    get detail() {
      return this.chat;
    }
    get cast() {
      return this.characters;
    }
    /** Reload chat, cast and messages when the chat changed or after writes. */
    async sync(force = false) {
      const id = this.activeChatId();
      if (!id) {
        this.chat = null;
        this.characters = [];
        this.messageCache = [];
        return null;
      }
      if (force || this.stale || this.chat?.id !== id) {
        this.chat = await api(`/chats/${encodeURIComponent(id)}`);
        this.characters = await Promise.all(this.characterIds().map((cid) => this.character(cid)));
        this.personaName = this.chat.personaId ? await this.persona(this.chat.personaId) : "User";
        this.messageCache = null;
        this.stale = false;
      }
      return this.chat;
    }
    characterIds() {
      const ids = this.chat?.characterIds;
      if (Array.isArray(ids)) return ids;
      if (typeof ids === "string") {
        try {
          const parsed = JSON.parse(ids);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
    async character(id) {
      const cached2 = this.characterCache.get(id);
      if (cached2) return cached2;
      try {
        const raw = await api(`/characters/${encodeURIComponent(id)}`);
        const data = parseObject(raw.data);
        const c = { id, name: String(data.name ?? raw.name ?? "Character") };
        this.characterCache.set(id, c);
        return c;
      } catch {
        return { id, name: "Character" };
      }
    }
    async persona(id) {
      const cached2 = this.personaCache.get(id);
      if (cached2) return cached2;
      try {
        const p = await api(`/characters/personas/${encodeURIComponent(id)}`);
        const name = p.name || "User";
        this.personaCache.set(id, name);
        return name;
      } catch {
        return "User";
      }
    }
    async requireChat() {
      const chat = await this.sync();
      if (!chat) throw new Error(t("No chat is open. Open a chat and run it again.", "열려 있는 채팅이 없어요. 채팅을 연 상태에서 실행해 주세요."));
      return chat.id;
    }
    async messages() {
      const chatId = await this.requireChat();
      if (this.messageCache) return this.messageCache;
      const raw = await api(`/chats/${encodeURIComponent(chatId)}/messages`);
      const byId = new Map(this.characters.map((c) => [c.id, c.name]));
      this.messageCache = raw.map((m2, i) => {
        const extra = parseObject(m2.extra);
        const snapshot = parseObject(extra.personaSnapshot);
        const name = m2.role === "assistant" ? m2.characterId && byId.get(m2.characterId) || this.characters[0]?.name || "Character" : m2.role === "user" ? String(snapshot.name || this.personaName) : m2.role === "narrator" ? "Narrator" : "System";
        return { number: i + 1, id: m2.id, role: m2.role, name, content: m2.content ?? "", hidden: extra.hiddenFromAI === true };
      });
      return this.messageCache;
    }
    facts(input) {
      const msgs = this.messageCache ?? [];
      const last = msgs[msgs.length - 1];
      const lastOf = (role) => [...msgs].reverse().find((m2) => m2.role === role)?.content ?? "";
      const idleMinutes = Math.round((Date.now() - this.lastActivity) / 6e4);
      return {
        user: this.personaName,
        char: this.characters[0]?.name ?? "",
        group: this.characters.map((c) => c.name).join(", "),
        input,
        lastMessage: last?.content ?? "",
        // filled in by the runtime per dialect; this is Marinara's 1-based number
        lastMessageId: String(msgs.length),
        lastCharMessage: lastOf("assistant"),
        lastUserMessage: lastOf("user"),
        model: "",
        idleDuration: idleMinutes <= 0 ? "just now" : `${idleMinutes} minute${idleMinutes === 1 ? "" : "s"}`
      };
    }
    /** Load messages if facts will need them (cheap when cached). */
    async ensureFacts() {
      if (!this.activeChatId()) return;
      await this.messages();
    }
    findCharacterId(name) {
      if (!name) return this.characters[0]?.id ?? null;
      const lower = name.trim().toLowerCase();
      return this.characters.find((c) => c.name.toLowerCase() === lower)?.id ?? this.characters.find((c) => c.name.toLowerCase().includes(lower))?.id ?? this.characters[0]?.id ?? null;
    }
    async generate(o) {
      if (o.mode === "chat") {
        const chatId = await this.requireChat();
        const res2 = await api(`/generate/dryRun`, {
          method: "POST",
          body: {
            chatId,
            // An ephemeral last user turn, like SillyTavern's quiet prompt: the
            // model sees the whole chat and then this instruction. Nothing is saved.
            userMessage: o.prompt,
            streaming: false,
            forCharacterId: o.characterName ? this.findCharacterId(o.characterName) : void 0,
            connectionId: o.connectionId || void 0
          }
        });
        return stripStops(res2.content ?? "", o.stop);
      }
      const connectionId = await this.rawConnectionId();
      const res = await api(`/generate/raw`, {
        method: "POST",
        body: {
          connectionId,
          messages: [{ role: "user", content: o.prompt }],
          streaming: false
        }
      });
      return stripStops(res.content ?? "", o.stop);
    }
    async rawConnectionId() {
      const chat = await this.sync().catch(() => null);
      const id = chat?.connectionId;
      if (id && id !== "random") return id;
      const list = await api(`/connections`);
      const pool = id === "random" ? list.filter((c) => c.useForRandom) : [];
      const pick2 = pool.length ? pool[Math.floor(Math.random() * pool.length)] : list.find((c) => c.isDefault) ?? list[0];
      if (!pick2) throw new Error(t("No AI connection. Add one in Marinara's settings first.", "AI 연결(Connection)이 없어요. 마리나라 설정에서 연결을 먼저 추가해 주세요."));
      return pick2.id;
    }
    async send(o) {
      const chatId = await this.requireChat();
      const created = await api(`/chats/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        body: {
          role: o.role,
          content: o.text,
          characterId: o.role === "assistant" ? this.findCharacterId(o.name) : null
        }
      });
      if (o.hidden && created?.id) {
        await api(`/chats/${encodeURIComponent(chatId)}/messages/bulk-hidden`, { method: "PATCH", body: { messageIds: [created.id], hidden: true } });
      }
      await this.refresh();
    }
    async setHidden(numbers, hidden) {
      const chatId = await this.requireChat();
      const msgs = await this.messages();
      const ids = numbers.map((n) => msgs[n - 1]).filter((m2) => m2 && m2.hidden !== hidden).map((m2) => m2.id);
      if (!ids.length) return 0;
      await api(`/chats/${encodeURIComponent(chatId)}/messages/bulk-hidden`, { method: "PATCH", body: { messageIds: ids, hidden } });
      await this.refresh();
      return ids.length;
    }
    async deleteMessages(numbers) {
      const chatId = await this.requireChat();
      const msgs = await this.messages();
      const ids = numbers.map((n) => msgs[n - 1]?.id).filter(Boolean);
      if (!ids.length) return 0;
      await api(`/chats/${encodeURIComponent(chatId)}/messages/bulk-delete`, { method: "POST", body: { messageIds: ids } });
      await this.refresh();
      return ids.length;
    }
    async runNativeCommand(line) {
      await submitThroughComposer(line);
      this.markStale();
    }
    async continueLast() {
      await this.runNativeCommand("/continue");
    }
    async regenerate() {
      const chatId = await this.requireChat();
      window.dispatchEvent(new CustomEvent("marinara:chat-regenerate-request", { detail: { chatId } }));
      this.markStale();
    }
    async trigger(characterName) {
      await this.requireChat();
      const name = characterName ?? this.characters[0]?.name;
      if (!name) throw new Error(t("No character to reply.", "답변할 캐릭터가 없어요."));
      await this.runNativeCommand(`/as "${name.replace(/"/g, "")}"`);
    }
    async addSwipe(text7) {
      const chatId = await this.requireChat();
      const msgs = await this.messages();
      const last = [...msgs].reverse().find((m2) => m2.role === "assistant");
      if (!last) throw new Error(t("No character message to add a swipe to.", "스와이프를 추가할 캐릭터 메시지가 없어요."));
      await api(`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(last.id)}/swipes`, { method: "POST", body: { content: text7 } });
      await this.refresh();
    }
    async openRandomCharacter(tag) {
      const current = await this.sync().catch(() => null);
      const characters = [];
      for (let offset = 0; offset < 1e4; ) {
        const page = await api(`/characters/catalog?limit=200&offset=${offset}`);
        const items = page.items ?? [];
        characters.push(...items);
        if (!page.hasMore || items.length === 0) break;
        offset += items.length;
      }
      const wanted = tag?.trim().toLowerCase();
      const pool = wanted ? characters.filter((c) => (c.tags ?? []).some((t2) => String(t2).toLowerCase() === wanted)) : characters;
      if (!pool.length) throw new Error(wanted ? t(`No characters tagged "${tag}".`, `"${tag}" 태그가 붙은 캐릭터가 없어요.`) : t("No characters.", "캐릭터가 없어요."));
      const pick2 = pool[Math.floor(Math.random() * pool.length)];
      const mode = current?.mode === "conversation" ? "conversation" : "roleplay";
      const chats = await api(`/chats`);
      const own = chats.filter((c) => c.mode === mode && Array.isArray(c.characterIds) && c.characterIds.length === 1 && c.characterIds[0] === pick2.id).sort((a, b) => String(b.lastMessageAt ?? b.updatedAt ?? "").localeCompare(String(a.lastMessageAt ?? a.updatedAt ?? "")));
      let chatId = own[0]?.id;
      if (!chatId) {
        const created = await api(`/chats`, {
          method: "POST",
          body: { name: pick2.name, mode, characterIds: [pick2.id], connectionId: current?.connectionId ?? null, personaId: current?.personaId ?? null }
        });
        chatId = created.id;
        const greeting = await this.greetings(pick2.id, pick2.firstMessage);
        if (greeting.first) {
          const msg = await api(`/chats/${encodeURIComponent(chatId)}/messages`, {
            method: "POST",
            body: { role: "assistant", content: greeting.first, characterId: pick2.id }
          });
          if (msg?.id && greeting.alternates.length) {
            await api(`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(msg.id)}/swipes/bulk`, { method: "POST", body: { contents: greeting.alternates } }).catch(() => void 0);
          }
        }
      }
      await openChat(chatId);
      this.markStale();
      return pick2.name;
    }
    async greetings(characterId, fallback) {
      try {
        const raw = await api(`/characters/${encodeURIComponent(characterId)}`);
        const data = parseObject(raw.data);
        const alternates = Array.isArray(data.alternate_greetings) ? data.alternate_greetings.map(String).filter((g) => g.trim()) : [];
        return { first: String(data.first_mes ?? fallback ?? "").trim(), alternates };
      } catch {
        return { first: (fallback ?? "").trim(), alternates: [] };
      }
    }
    async waitForIdle(timeoutMs) {
      await new Promise((r) => setTimeout(r, 400));
      const idle = await waitUntil(() => !isGenerating(findComposer()), timeoutMs, 200);
      this.markStale();
      return idle;
    }
    async refresh() {
      this.markStale();
      const chatId = this.chat?.id ?? this.activeChatId();
      if (chatId) refreshChatQueries(chatId);
    }
  };
  function stripStops(text7, stops) {
    if (!stops?.length) return text7;
    let cut = text7.length;
    for (const s of stops) {
      if (!s) continue;
      const i = text7.indexOf(s);
      if (i >= 0) cut = Math.min(cut, i);
    }
    return text7.slice(0, cut);
  }

  // src/host/marinara-extras.ts
  var enc = encodeURIComponent;
  function parseMaybeJson(v, fallback) {
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return fallback;
      }
    }
    return v ?? fallback;
  }
  var MarinaraExtrasImpl = class {
    constructor(chat) {
      this.chat = chat;
    }
    async chatId() {
      return this.chat.requireChat();
    }
    // ── tracker ──
    async getTracker() {
      const raw = await api(`/chats/${enc(await this.chatId())}/game-state`);
      if (!raw) return null;
      for (const k of ["presentCharacters", "playerStats", "personaStats", "worldCustomFields", "recentEvents", "manualOverrides", "fieldLocks"]) {
        if (typeof raw[k] === "string") raw[k] = parseMaybeJson(raw[k], null);
      }
      return raw;
    }
    async patchTracker(state, fields) {
      const body = { manual: true };
      for (const f of new Set(fields)) body[f] = state[f];
      if (state.messageId) {
        body.messageId = state.messageId;
        body.swipeIndex = state.swipeIndex ?? 0;
      }
      await api(`/chats/${enc(await this.chatId())}/game-state`, { method: "PATCH", body });
    }
    async retryAgents(types) {
      const chatId = await this.chatId();
      const doFetch = getMarinara().fetch ?? fetch;
      const res = await doFetch(`/api/generate/retry-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-marinara-csrf": "1" },
        body: JSON.stringify({ chatId, agentTypes: types, streaming: true }),
        credentials: "same-origin"
      });
      const ran = [];
      const errors = [];
      if (!res.ok || !res.body) throw new Error(`Agent retry failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            const data = evt.data ?? evt;
            if (evt.type === "agent_result" && data.success !== false) ran.push(String(data.agentName ?? data.agentType ?? ""));
            if (evt.type === "agent_error" || evt.type === "error") errors.push(String(data.error ?? evt.error ?? data.message ?? "error"));
          } catch {
          }
        }
      }
      this.chat.markStale();
      return { ran, errors };
    }
    // ── lorebooks ──
    async allBooks() {
      const res = await api(`/lorebooks`);
      const list = Array.isArray(res) ? res : res.items ?? [];
      return list;
    }
    async activeBooks() {
      const detail = await this.chat.sync();
      if (!detail) return [];
      const meta = parseObject(detail.metadata);
      const active = new Set(Array.isArray(meta.activeLorebookIds) ? meta.activeLorebookIds : []);
      const excluded = new Set(Array.isArray(meta.excludedLorebookIds) ? meta.excludedLorebookIds : []);
      const cast = new Set(this.chat.cast.map((c) => c.id));
      return (await this.allBooks()).filter((b) => !excluded.has(b.id) && (b.isGlobal || active.has(b.id) || b.chatId === detail.id || (b.characterIds ?? []).some((id) => cast.has(id)))).map((b) => ({ id: b.id, name: b.name, chatId: b.chatId }));
    }
    async chatBook(create) {
      const chatId = await this.chatId();
      const res = await api(`/lorebooks?chatId=${enc(chatId)}`);
      const own = Array.isArray(res) ? res : res.items ?? [];
      if (own[0]) return { id: own[0].id, name: own[0].name, chatId };
      if (!create) return null;
      const name = `Chat Book ${await this.chatName() || chatId}`.slice(0, 200);
      const book2 = await api(`/lorebooks`, { method: "POST", body: { name, chatId } });
      return { id: book2.id, name: book2.name, chatId };
    }
    async findBook(nameOrId) {
      const q = nameOrId.trim().toLowerCase();
      const books = await this.allBooks();
      const hit = books.find((b) => b.id === nameOrId) ?? books.find((b) => b.name?.toLowerCase() === q) ?? books.find((b) => b.name?.toLowerCase().includes(q));
      return hit ? { id: hit.id, name: hit.name, chatId: hit.chatId } : null;
    }
    async entries(bookId) {
      return api(`/lorebooks/${enc(bookId)}/entries`);
    }
    async createEntry(bookId, data) {
      return api(`/lorebooks/${enc(bookId)}/entries`, { method: "POST", body: { name: "New entry", ...data } });
    }
    async patchEntry(bookId, entryId, patch) {
      await api(`/lorebooks/${enc(bookId)}/entries/${enc(entryId)}`, { method: "PATCH", body: patch });
    }
    // ── characters and personas ──
    async character(name) {
      await this.chat.sync();
      let id = this.chat.cast[0]?.id;
      if (name) {
        const lower = name.trim().toLowerCase();
        id = this.chat.cast.find((c) => c.name.toLowerCase() === lower)?.id;
        if (!id) {
          const catalog = await api(`/characters/catalog?limit=200&search=${enc(name)}`);
          id = (catalog.items ?? []).find((c) => c.name.toLowerCase() === lower)?.id ?? catalog.items?.[0]?.id;
        }
      }
      if (!id) return null;
      const raw = await api(`/characters/${enc(id)}`);
      return { id, data: parseObject(raw.data) };
    }
    async updateCharacter(id, data) {
      await api(`/characters/${enc(id)}`, { method: "PATCH", body: { data } });
      this.chat.markStale();
    }
    async persona() {
      const detail = await this.chat.sync();
      if (!detail?.personaId) return null;
      return api(`/characters/personas/${enc(detail.personaId)}`);
    }
    // ── connections ──
    async connections() {
      const list = await api(`/connections`);
      return list.map((c) => ({ id: c.id, name: c.name, model: c.model }));
    }
    async currentConnection() {
      const detail = await this.chat.sync(true);
      const id = detail?.connectionId;
      if (!id) return null;
      if (id === "random") return { id, name: "random" };
      const c = (await this.connections()).find((x) => x.id === id);
      return c ? { id: c.id, name: c.name } : { id, name: id };
    }
    async setConnection(id) {
      const chatId = await this.chatId();
      await api(`/chats/${enc(chatId)}`, { method: "PATCH", body: { connectionId: id } });
      this.chat.markStale();
      refreshQueries([["chats", "detail", chatId], ["chats", "list"]]);
    }
    // ── prompt, chat, Author's Note ──
    async peekPrompt() {
      const res = await api(`/chats/${enc(await this.chatId())}/peek-prompt`, { method: "POST", body: {} });
      return (res.messages ?? []).map((m2) => ({ role: m2.role, content: typeof m2.content === "string" ? m2.content : JSON.stringify(m2.content) }));
    }
    async chatName() {
      const detail = await this.chat.sync();
      return detail?.name ?? "";
    }
    async renameChat(name) {
      const chatId = await this.chatId();
      await api(`/chats/${enc(chatId)}`, { method: "PATCH", body: { name } });
      this.chat.markStale();
      refreshQueries([["chats", "detail", chatId], ["chats", "list"]]);
    }
    async newChat() {
      const detail = await this.chat.sync(true);
      if (!detail) throw new Error(t("No chat is open.", "열려 있는 채팅이 없어요."));
      const cast = [...this.chat.cast];
      const name = cast.map((c) => c.name).join(", ") || detail.name || "New chat";
      const created = await api(`/chats`, {
        method: "POST",
        body: { name, mode: detail.mode ?? "roleplay", characterIds: cast.map((c) => c.id), connectionId: detail.connectionId ?? null, personaId: detail.personaId ?? null }
      });
      if (cast.length === 1) {
        const g = await this.chat.greetings(cast[0].id);
        if (g.first) {
          const msg = await api(`/chats/${enc(created.id)}/messages`, { method: "POST", body: { role: "assistant", content: g.first, characterId: cast[0].id } });
          if (msg?.id && g.alternates.length) await api(`/chats/${enc(created.id)}/messages/${enc(msg.id)}/swipes/bulk`, { method: "POST", body: { contents: g.alternates } }).catch(() => void 0);
        }
      }
      await openChat(created.id);
      this.chat.markStale();
      return created.name;
    }
    async authorNote() {
      const detail = await this.chat.sync(true);
      const meta = parseObject(detail?.metadata);
      return { text: String(meta.authorNotes ?? ""), depth: Number(meta.authorNotesDepth ?? 4) || 4 };
    }
    async setAuthorNote(text7, depth) {
      const chatId = await this.chatId();
      const body = {};
      if (text7 !== void 0) body.authorNotes = text7;
      if (depth !== void 0) body.authorNotesDepth = depth;
      await api(`/chats/${enc(chatId)}/metadata`, { method: "PATCH", body });
      this.chat.markStale();
      refreshQueries([["chats", "detail", chatId]]);
    }
    async reloadPage() {
      location.reload();
    }
  };

  // src/host/marinara-host.ts
  var MARINARA_ONLY = /\{\{(?:#if\b|persona\w*|description|personality|backstory|appearance|scenario|example|charSysInfo|charPostHistory|characters|chatId|datetime|timezone|convo_display|char_about|persona_about|convo_behavior|lorebook|lore|addnumvar::|agent::|outlet::|include::|[A-Za-z0-9_-]{21}\}\})/;
  var MarinaraHost = class {
    local = new ChatVariables();
    global = new GlobalVariables();
    ui = new Dialogs();
    chat = new MarinaraChat();
    qr;
    wand;
    memo;
    marinara = new MarinaraExtrasImpl(this.chat);
    macroCache = /* @__PURE__ */ new Map();
    facts() {
      return this.chat.facts(this.ui.getInput());
    }
    async beginRun() {
      await this.global.load();
      const detail = await this.chat.sync(true).catch(() => null);
      await this.local.load(detail?.id ?? null, detail?.metadata);
      if (detail) await this.chat.ensureFacts().catch(() => void 0);
    }
    async refreshFacts() {
      const before = this.local.currentChatId;
      const detail = await this.chat.sync().catch(() => null);
      const id = detail?.id ?? null;
      if (id !== before) await this.local.load(id, detail?.metadata);
      if (detail) await this.chat.ensureFacts().catch(() => void 0);
    }
    async resolveHostMacros(text7) {
      if (!MARINARA_ONLY.test(text7)) return text7;
      const chatId = this.chat.activeChatId();
      if (!chatId) return text7;
      const cached2 = this.macroCache.get(text7);
      if (cached2 !== void 0) return cached2;
      try {
        await this.local.flush();
        const res = await api(`/generate/dryRun`, {
          method: "POST",
          body: { chatId, returnPrompt: true, presetText: text7, injectLorebook: false, injectTrackers: false, injectChatSummary: false }
        });
        for (const m2 of res.prompt?.messages ?? []) {
          const content = typeof m2.content === "string" ? m2.content : "";
          const match = /<extension_preset>\s*([\s\S]*?)\s*<\/extension_preset>/.exec(content);
          if (match) {
            this.macroCache.set(text7, match[1]);
            return match[1];
          }
        }
      } catch {
      }
      return text7;
    }
    async flush() {
      await Promise.all([this.local.flush(), this.global.flush()]);
    }
    confirm(message) {
      return this.ui.confirm(message);
    }
    dispose() {
      this.chat.dispose();
      this.ui.dispose();
    }
  };

  // src/qr/auto.ts
  function autoTargets(sets, trigger) {
    const out = [];
    for (const set of sets) for (const item of set.items) if (item.auto?.[trigger]) out.push({ set, item });
    return out;
  }
  var key = (s) => s.normalize("NFC").trim().toLowerCase();
  function automationTargets(sets, entries) {
    const keys = /* @__PURE__ */ new Set();
    for (const e of entries) {
      for (const v of [e.name, e.id]) if (typeof v === "string" && v.trim()) keys.add(key(v));
    }
    if (!keys.size) return [];
    const out = [];
    for (const set of sets) for (const item of set.items) if (item.automationId?.trim() && keys.has(key(item.automationId))) out.push({ set, item });
    return out;
  }
  var AutoExecutor = class {
    constructor(run) {
      this.run = run;
    }
    stack = [];
    get blocked() {
      return this.stack[this.stack.length - 1] === true;
    }
    /**
     * `blocked`: whether the thing that set this off started while a QR was
     * blocking (a generation the QR began, say); by default, whether one is now.
     */
    async fire(targets, blocked = this.blocked) {
      if (blocked || !targets.length) return;
      for (const { set, item } of targets) {
        this.stack.push(item.preventAuto !== false);
        try {
          await this.run(set, item);
        } catch (e) {
          console.warn("[Dispensa] auto-run", e);
        } finally {
          this.stack.pop();
        }
      }
    }
  };

  // src/qr/scopes.ts
  var NO_CHAT = { chatId: null, characterIds: [] };
  function activeSets(state, scope) {
    const ids = state.sets.filter((s) => s.enabled).map((s) => s.id);
    if (scope.chatId) ids.push(...state.chatSets[scope.chatId] ?? []);
    for (const c of scope.characterIds) ids.push(...state.charSets[c] ?? []);
    const out = [];
    for (const id of new Set(ids)) {
      const set = state.sets.find((s) => s.id === id);
      if (set) out.push(set);
    }
    return out;
  }
  function isOnForChat(state, setId, chatId) {
    return !!chatId && (state.chatSets[chatId] ?? []).includes(setId);
  }
  function isOnForCharacter(state, setId, characterId) {
    return (state.charSets[characterId] ?? []).includes(setId);
  }
  function toggleIn(lists, key2, setId, on) {
    const list = (lists[key2] ?? []).filter((id) => id !== setId);
    if (on) list.push(setId);
    if (list.length) lists[key2] = list;
    else delete lists[key2];
  }
  function setForChat(state, chatId, setId, on) {
    toggleIn(state.chatSets, chatId, setId, on);
  }
  function setForCharacter(state, characterId, setId, on) {
    toggleIn(state.charSets, characterId, setId, on);
  }
  function elsewhere(state, setId, scope) {
    const chats = Object.entries(state.chatSets).filter(([id, sets]) => id !== scope.chatId && sets.includes(setId)).length;
    const characters = Object.entries(state.charSets).filter(([id, sets]) => !scope.characterIds.includes(id) && sets.includes(setId)).length;
    return { chats, characters };
  }
  function forgetSet(state, setId) {
    for (const lists of [state.chatSets, state.charSets]) for (const key2 of Object.keys(lists)) toggleIn(lists, key2, setId, false);
    if (state.bar) state.bar = state.bar.filter((e) => !(e.kind === "set" && e.setId === setId));
    for (const set of state.sets) {
      for (const item of set.items) {
        if (!item.contextList) continue;
        item.contextList = item.contextList.filter((l) => l.setId !== setId);
        if (!item.contextList.length) delete item.contextList;
      }
    }
  }
  function zoneSets(state, zone) {
    switch (zone.kind) {
      case "global":
        return state.sets.filter((s) => s.enabled).map((s) => s.id);
      case "chat":
        return [...state.chatSets[zone.chatId] ?? []].filter((id) => state.sets.some((s) => s.id === id));
      case "char":
        return [...state.charSets[zone.characterId] ?? []].filter((id) => state.sets.some((s) => s.id === id));
      case "all":
        return state.sets.map((s) => s.id);
    }
  }
  function reorderSlots(state, ids) {
    const wanted = ids.map((id) => state.sets.find((s) => s.id === id)).filter((s) => !!s);
    const picked = new Set(wanted);
    let next = 0;
    state.sets = state.sets.map((s) => picked.has(s) ? wanted[next++] : s);
  }
  function writeZone(state, zone, ids) {
    if (zone.kind === "global") {
      for (const s of state.sets) s.enabled = ids.includes(s.id);
      reorderSlots(state, ids);
    } else if (zone.kind === "all") reorderSlots(state, ids);
    else {
      const lists = zone.kind === "chat" ? state.chatSets : state.charSets;
      const key2 = zone.kind === "chat" ? zone.chatId : zone.characterId;
      if (ids.length) lists[key2] = ids;
      else delete lists[key2];
    }
  }
  var sameZone = (a, b) => a.kind === b.kind && (a.kind !== "chat" || a.chatId === b.chatId) && (a.kind !== "char" || a.characterId === b.characterId);
  function moveSet(state, setId, from, to, index) {
    if (to.kind === "all" && from.kind !== "all") {
      writeZone(state, from, zoneSets(state, from).filter((id) => id !== setId));
      return;
    }
    if (!sameZone(from, to) && from.kind !== "all") writeZone(state, from, zoneSets(state, from).filter((id) => id !== setId));
    const list = zoneSets(state, to).filter((id) => id !== setId);
    list.splice(Math.max(0, Math.min(index, list.length)), 0, setId);
    writeZone(state, to, list);
  }

  // src/host/chat-scope.ts
  var ChatScopeWatch = class {
    scope = NO_CHAT;
    listeners = /* @__PURE__ */ new Set();
    timer = null;
    checking = false;
    get current() {
      return this.scope;
    }
    onChange(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    /** Reads the chat on screen now, then keeps watching. */
    async start() {
      await this.check();
      this.timer = setInterval(() => void this.check(), 1e3);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.listeners.clear();
    }
    /** Reload who is in the chat (after a member was added, say). */
    async refresh() {
      const id = this.scope.chatId;
      if (!id) return;
      const characterIds = await characterIdsOf(id);
      if (this.scope.chatId !== id || same(characterIds, this.scope.characterIds)) return;
      this.set({ chatId: id, characterIds });
    }
    async check() {
      const id = findComposer()?.chatId ?? null;
      if (!id || id === this.scope.chatId || this.checking) return;
      this.checking = true;
      try {
        this.set({ chatId: id, characterIds: await characterIdsOf(id) });
      } finally {
        this.checking = false;
      }
    }
    set(next) {
      const previous = this.scope;
      this.scope = next;
      for (const fn of [...this.listeners]) {
        try {
          fn(next, previous);
        } catch (e) {
          console.error("[Dispensa]", e);
        }
      }
    }
  };
  async function characterIdsOf(chatId) {
    try {
      const chat = await api(`/chats/${encodeURIComponent(chatId)}`);
      let ids = chat.characterIds;
      if (typeof ids === "string") ids = JSON.parse(ids);
      return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  function same(a, b) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }

  // src/host/generation-watch.ts
  var BEFORE_LIMIT_MS = 6e4;
  function watchGeneration(hooks, limitMs = BEFORE_LIMIT_MS) {
    const original = window.fetch;
    let active = true;
    const wrapped = async function(input, init) {
      if (!active) return original.call(this ?? window, input, init);
      const req = describe(input, init);
      if (req.method === "POST" && /\/api\/generate$/.test(req.path)) {
        const body = parseBody(init?.body);
        await withLimit(hooks.beforeGeneration(body), limitMs);
        const res2 = await original.call(this ?? window, input, init);
        return tapStream(res2, (event) => hooks.onEvent(event, body));
      }
      const res = await original.call(this ?? window, input, init);
      if (req.method === "POST" && /\/api\/chats$/.test(req.path) && res.ok) {
        res.clone().json().then((chat) => {
          const id = chat?.id;
          if (typeof id === "string") hooks.onChatCreated({ id });
        }).catch(() => void 0);
      }
      return res;
    };
    window.fetch = wrapped;
    return () => {
      active = false;
      if (window.fetch === wrapped) window.fetch = original;
    };
  }
  function describe(input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
    let path = url;
    try {
      path = new URL(url, location.href).pathname;
    } catch {
    }
    return { method, path: path.replace(/\/+$/, "") };
  }
  function parseBody(body) {
    if (typeof body !== "string") return {};
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  async function withLimit(work, ms) {
    let timer;
    try {
      await Promise.race([work.catch((e) => console.warn("[Dispensa] before-generation", e)), new Promise((r) => timer = setTimeout(r, ms))]);
    } finally {
      clearTimeout(timer);
    }
  }
  function tapStream(res, onEvent) {
    if (!res.ok || !res.body || !/event-stream/.test(res.headers.get("content-type") ?? "")) return res;
    const [mine, theirs] = res.body.tee();
    void readEvents(mine, onEvent);
    return new Response(theirs, { status: res.status, statusText: res.statusText, headers: res.headers });
  }
  async function readEvents(stream, onEvent) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const flush = (chunk) => {
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event && typeof event.type === "string") onEvent(event);
        } catch {
        }
      }
    };
    try {
      for (; ; ) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          flush(buffer.slice(0, cut));
          buffer = buffer.slice(cut + 2);
        }
      }
      if (buffer.trim()) flush(buffer);
    } catch {
    } finally {
      onEvent({ type: "dispensa:end" });
    }
  }
  function activatedEntries(message) {
    const raw = message?.extra;
    let extra = raw;
    if (typeof raw === "string") {
      try {
        extra = JSON.parse(raw);
      } catch {
        return [];
      }
    }
    const scan = extra?.lorebookScan;
    return Array.isArray(scan?.activatedEntries) ? scan.activatedEntries : [];
  }

  // src/stscript/ast.ts
  var defaultParserFlags = () => ({
    STRICT_ESCAPING: false,
    REPLACE_GETVAR: false
  });
  var ParseError = class extends Error {
    constructor(message, index) {
      super(message);
      this.index = index;
      this.name = "ParseError";
    }
  };

  // src/stscript/parser.ts
  function parse(text7, options = {}) {
    return new Parser(text7, options).parseRoot();
  }
  var Parser = class {
    constructor(text7, options) {
      this.text = text7;
      this.flags = { ...defaultParserFlags(), ...options.flags };
      this.lookup = options.lookup ?? (() => void 0);
      this.macroDepth = computeMacroDepth(text7);
    }
    index = 0;
    /** True right after skipping the backslash of an escaped symbol. */
    jumped = false;
    flags;
    lookup;
    depth = 0;
    macroDepth;
    // ── cursor ────────────────────────────────────────────────
    get char() {
      return this.text[this.index] ?? "";
    }
    get atEnd() {
      return this.index >= this.text.length;
    }
    take(length = 1) {
      let out = "";
      for (let i = 0; i < length; i++) {
        this.jumped = false;
        out += this.text[this.index] ?? "";
        this.index++;
      }
      return out;
    }
    skipWhitespace() {
      while (/\s/.test(this.char)) {
        this.take();
        this.jumped = false;
      }
    }
    startsAt(pos, seq) {
      const rest = this.text.slice(pos);
      return typeof seq === "string" ? rest.startsWith(seq) : new RegExp(`^(?:${seq.source})`).test(rest);
    }
    /**
     * Is the symbol at the cursor (unescaped)? When the symbol is escaped and
     * offset is 0, the escaping backslash is skipped so the caller's next
     * take() reads the symbol as a literal character.
     */
    test(seq, offset = 0) {
      const escapeOffset = this.jumped ? -1 : 0;
      const base = this.index + offset + escapeOffset;
      let escapes;
      if (this.flags.STRICT_ESCAPING) {
        escapes = 0;
        while (this.text[base + escapes] === "\\") escapes++;
      } else {
        escapes = this.text[base] === "\\" ? 1 : 0;
      }
      if (!this.startsAt(base + escapes, seq)) return false;
      if (escapes === 0) return true;
      if (!this.jumped && offset === 0) {
        this.index++;
        this.jumped = true;
      }
      return false;
    }
    insideMacro() {
      return this.macroDepth[Math.min(this.index, this.text.length)] > 0;
    }
    // ── structure ─────────────────────────────────────────────
    parseRoot() {
      return this.parseClosure(true);
    }
    closureEnd() {
      if (this.depth === 0) return this.atEnd;
      if (this.atEnd) throw new ParseError(`Unclosed closure ({: without :})`, this.index);
      return this.test(":}");
    }
    commandEnd() {
      if (this.closureEnd()) return true;
      return this.test("|") && !this.insideMacro();
    }
    parseClosure(isRoot = false) {
      if (!isRoot) {
        this.take(2);
        this.depth++;
      }
      const textStart = this.index;
      const closure = { kind: "closure", args: [], executors: [], executeNow: false, raw: "" };
      let injectPipe = true;
      this.skipWhitespace();
      while (this.testNamedArg()) {
        closure.args.push(this.parseNamedArg());
        this.skipWhitespace();
      }
      while (!this.closureEnd()) {
        if (this.test("/*")) {
          this.parseBlockComment();
        } else if (this.test(/\/[/#]/)) {
          this.parseLineComment();
        } else if (this.test("/parser-flag ")) {
          this.parseParserFlag();
        } else if (this.test("/:") && !this.test(":}", 1)) {
          const node = this.parseRunShorthand();
          node.injectPipe = injectPipe;
          closure.executors.push(node);
          injectPipe = true;
        } else if (this.test(/\/break(?:\s|\||$)/)) {
          closure.executors.push(this.parseBreak());
        } else if (this.test("/")) {
          const node = this.parseCommand();
          node.injectPipe = injectPipe;
          closure.executors.push(node);
          injectPipe = true;
        } else {
          while (!this.commandEnd()) this.take();
        }
        this.skipWhitespace();
        if (this.test("|")) {
          this.take();
          if (this.test("|")) {
            injectPipe = false;
            this.take();
          }
        }
        this.skipWhitespace();
      }
      closure.raw = this.text.slice(textStart, this.index);
      if (!isRoot) {
        this.take(2);
        this.depth--;
        if (this.test("()")) {
          this.take(2);
          closure.executeNow = true;
        }
      }
      return closure;
    }
    parseBlockComment() {
      this.take(2);
      for (; ; ) {
        if (this.atEnd) throw new ParseError("Unclosed block comment (/* without *|)", this.index);
        if (this.test("*|")) break;
        if (this.test("/*")) {
          this.parseBlockComment();
          continue;
        }
        this.take();
      }
      this.take(2);
    }
    parseLineComment() {
      this.take(2);
      while (!this.atEnd && !this.test("|")) this.take();
    }
    parseParserFlag() {
      this.take("/parser-flag ".length);
      const parts3 = this.parseUnnamed(true);
      const flag2 = typeof parts3[0]?.value === "string" ? parts3[0].value : "";
      const state = typeof parts3[1]?.value === "string" ? parts3[1].value : "on";
      if (flag2 === "STRICT_ESCAPING" || flag2 === "REPLACE_GETVAR") {
        this.flags[flag2] = isTrue(state);
      }
    }
    parseRunShorthand() {
      const start2 = this.index;
      this.take(2);
      const target = this.test('"') ? this.parseQuoted() : this.parseBareValue();
      this.skipWhitespace();
      const named = [];
      while (this.testNamedArg()) {
        named.push(this.parseNamedArg());
        this.skipWhitespace();
      }
      if (!this.commandEnd()) throw new ParseError(`Unexpected text after /:${target}`, this.index);
      return {
        kind: "command",
        name: ":",
        named,
        unnamed: [{ value: target, quoted: false }],
        injectPipe: true,
        flags: { ...this.flags },
        start: start2,
        end: this.index
      };
    }
    parseBreak() {
      const start2 = this.index;
      this.take("/break".length);
      this.skipWhitespace();
      const unnamed = this.commandEnd() ? [] : this.parseUnnamed(false);
      return { kind: "break", unnamed, start: start2, end: this.index };
    }
    parseCommand() {
      const start2 = this.index;
      this.take();
      let name = "";
      while (!this.atEnd && !/\s/.test(this.char) && !this.commandEnd()) name += this.take();
      this.skipWhitespace();
      const spec = this.lookup(name);
      const named = [];
      while (this.testNamedArg()) {
        named.push(this.parseNamedArg());
        this.skipWhitespace();
      }
      this.skipWhitespace();
      let unnamed = [];
      if (!this.commandEnd()) {
        let rawQuotes = spec?.rawQuotes ?? false;
        const rawArg = named.find((a) => a.name === "raw");
        if (rawQuotes && rawArg && typeof rawArg.value === "string" && isFalse(rawArg.value)) rawQuotes = false;
        unnamed = this.parseUnnamed(spec?.split ?? false, spec?.splitCount, rawQuotes);
      }
      if (!this.commandEnd()) throw new ParseError(`Unexpected end of command /${name}`, this.index);
      return { kind: "command", name, named, unnamed, injectPipe: true, flags: { ...this.flags }, start: start2, end: this.index };
    }
    testNamedArg() {
      return /^\w+=/.test(this.text.slice(this.index));
    }
    parseNamedArg() {
      let name = "";
      while (/\w/.test(this.char)) name += this.take();
      this.take();
      let value = "";
      if (this.test("{:")) value = this.parseClosure();
      else if (this.test('"')) value = this.parseQuoted();
      else if (this.test("[")) value = this.parseList();
      else if (!this.test(/\s/)) value = this.parseBareValue();
      return { name, value };
    }
    parseUnnamed(split2, splitCount, rawQuotes = false) {
      const wasSplit = split2;
      let value = this.jumped ? this.take() : "";
      let isList = split2;
      const list = [];
      if (!split2 && !rawQuotes && this.test('"')) {
        list.push({ value: this.parseQuoted(), quoted: true });
        isList = true;
      }
      while (!this.commandEnd()) {
        if (split2 && splitCount && list.length >= splitCount) {
          split2 = false;
          if (this.test('"')) list.push({ value: this.parseQuoted(), quoted: true });
        }
        if (this.test("{:")) {
          isList = true;
          if (value.length > 0) {
            list.push({ value, quoted: false });
            value = "";
            if (!split2 && this.test('"')) list.push({ value: this.parseQuoted(), quoted: true });
          }
          list.push({ value: this.parseClosure(), quoted: false });
          if (split2) this.skipWhitespace();
        } else if (split2) {
          if (this.test('"')) list.push({ value: this.parseQuoted(), quoted: true });
          else if (this.test("[")) list.push({ value: this.parseList(), quoted: false });
          else if (!this.test(/\s/)) list.push({ value: this.parseBareValue(), quoted: false });
          else throw new ParseError("Unexpected end of unnamed argument", this.index);
          this.skipWhitespace();
        } else {
          value += this.take();
        }
      }
      if (isList && value.length > 0) list.push({ value, quoted: false });
      if (isList) {
        const first = list[0];
        if (first && typeof first.value === "string") {
          if (!first.quoted) first.value = first.value.trimStart();
          if (first.value.length === 0) list.shift();
        }
        const last = list[list.length - 1];
        if (last && typeof last.value === "string") {
          if (!last.quoted) last.value = last.value.trimEnd();
          if (last.value.length === 0) list.pop();
        }
        if (wasSplit && splitCount && splitCount + 1 < list.length) {
          let joined = "";
          for (const part of list.slice(splitCount)) {
            joined += part.quoted ? `"${part.value}"` : part.value;
          }
          list.splice(splitCount, list.length - splitCount, { value: joined, quoted: false });
        }
        return list;
      }
      return [{ value: value.trim(), quoted: false }];
    }
    parseQuoted() {
      this.take();
      let value = "";
      for (; ; ) {
        if (this.atEnd) throw new ParseError("Unclosed quoted value", this.index);
        if (this.test('"')) break;
        if (!this.flags.STRICT_ESCAPING && this.commandEnd()) {
          throw new ParseError('Unexpected "|" inside a quoted value (escape it as \\|)', this.index);
        }
        value += this.take();
      }
      this.take();
      return value;
    }
    parseList() {
      let value = this.take();
      for (; ; ) {
        if (this.atEnd) throw new ParseError("Unclosed list value ([ without ])", this.index);
        if (this.test("]")) break;
        value += this.take();
      }
      return value + this.take();
    }
    parseBareValue() {
      let value = this.jumped ? this.take() : "";
      while (!this.atEnd && !this.test(/\s/) && !this.commandEnd()) value += this.take();
      return value;
    }
  };
  function computeMacroDepth(text7) {
    const out = new Int32Array(text7.length + 1);
    let depth = 0;
    let i = 0;
    out[0] = 0;
    while (i < text7.length) {
      const isOpen = text7[i] === "{" && text7[i + 1] === "{";
      const isClose = text7[i] === "}" && text7[i + 1] === "}";
      if (isOpen || isClose) {
        out[i + 1] = depth;
        depth = isOpen ? depth + 1 : Math.max(0, depth - 1);
        out[i + 2] = depth;
        i += 2;
      } else {
        out[i + 1] = depth;
        i += 1;
      }
    }
    return out;
  }
  function isTrue(value) {
    return ["on", "true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }
  function isFalse(value) {
    return ["off", "false", "0", "no", "n"].includes(value.trim().toLowerCase());
  }

  // src/qr/convert.ts
  var INDEX_COMMANDS = /* @__PURE__ */ new Set(["hide", "unhide", "messages", "message", "cut", "goto", "jump", "scroll"]);
  var AT_COMMANDS = /* @__PURE__ */ new Set(["send", "sendas", "sys", "system", "comment", "nar"]);
  var COMPARE_COMMANDS = /* @__PURE__ */ new Set(["if", "while"]);
  var BODY_COMMANDS = /* @__PURE__ */ new Set(["if", "while", "times", "run", "loader-wrap"]);
  var ASSIGN_COMMANDS = /* @__PURE__ */ new Set(["setvar", "let", "var"]);
  var MODIFY_COMMANDS = /* @__PURE__ */ new Set(["addvar", "incvar", "decvar"]);
  var OPERAND_KEYS = ["left", "right", "a", "b", "first", "second", "x", "y"];
  var LAST_ID_RE = /\{\{lastMessageId\}\}/gi;
  var VAR_MACRO_RE = /\{\{(?:getvar|var)::\s*([^}:]+?)\s*\}\}/gi;
  var RISKY_IN_STRINGS = /\/(?:hide|unhide|messages?|cut|goto|jump|scroll|nar|random)\b|\bat=|\{\{lastMessageId\}\}/i;
  function convertToMarinara(script, registry) {
    return convertNumbering(script, registry, 1);
  }
  function convertToSillyTavern(script, registry) {
    return convertNumbering(script, registry, -1);
  }
  function convertNumbering(script, registry, delta) {
    if (!script.trimStart().startsWith("/")) return { ok: true, script, changes: 0, reasons: [] };
    let root;
    try {
      root = parse(script, { lookup: (n) => registry.get(n) });
    } catch (e) {
      return { ok: false, script, changes: 0, reasons: [t(`Syntax error: ${e instanceof Error ? e.message : String(e)}`, `문법 오류: ${e instanceof Error ? e.message : String(e)}`)] };
    }
    const reasons = /* @__PURE__ */ new Set();
    const edits = [];
    const nodes = flatten(root, reasons);
    const vars = /* @__PURE__ */ new Map();
    const info = (name) => {
      let v = vars.get(name);
      if (!v) vars.set(name, v = { literal: 0, fromLast: 0, other: false, asIndex: false });
      return v;
    };
    for (const node of nodes) {
      if (ASSIGN_COMMANDS.has(node.name)) {
        const target = assignment(node);
        if (!target) continue;
        if (node.name === "var" && target.value !== null && target.value.trim() === "") continue;
        const v = info(target.name);
        if (target.value === null) v.other = true;
        else if (/^\{\{lastMessageId\}\}$/i.test(target.value.trim())) v.fromLast++;
        else if (/^-?\d+$/.test(target.value.trim())) v.literal++;
        else v.other = true;
      } else if (MODIFY_COMMANDS.has(node.name)) {
        const name = varArg(node);
        if (!name) continue;
        const amount = node.name === "addvar" ? unnamedText(node) : "1";
        if (amount === null || !/^-?\d+$/.test(amount.trim())) info(name).other = true;
        else info(name);
      }
    }
    for (const node of nodes) {
      if (!INDEX_COMMANDS.has(node.name)) continue;
      const region = unnamedRegion(script, node);
      if (!region) continue;
      for (const m2 of region.text.matchAll(VAR_MACRO_RE)) info(m2[1]).asIndex = true;
    }
    const anchored = (name) => {
      const v = vars.get(name);
      return !!v && !v.other && (v.fromLast > 0 || v.asIndex);
    };
    for (const [name, v] of vars) {
      if ((v.fromLast > 0 || v.asIndex) && v.other) reasons.add(t(`Variable "${name}" gets message numbers mixed with other values`, `변수 "${name}"에 메시지 번호와 다른 값이 섞여 들어가요`));
    }
    let lastHandled = 0;
    const varHandled = /* @__PURE__ */ new Map();
    const handleVar = (name) => varHandled.set(name, (varHandled.get(name) ?? 0) + 1);
    const bound = (text7) => {
      const t2 = text7.trim();
      if (/^\d+$/.test(t2)) return text7.replace(t2, String(Math.max(0, Number(t2) + delta)));
      if (/^\{\{lastMessageId\}\}$/i.test(t2)) {
        lastHandled++;
        return text7;
      }
      const m2 = /^\{\{(?:getvar|var)::\s*([^}:]+?)\s*\}\}$/i.exec(t2);
      if (m2 && anchored(m2[1])) {
        handleVar(m2[1]);
        return text7;
      }
      return null;
    };
    for (const node of nodes) {
      if (node.name === "nar" && delta > 0) edits.push({ start: node.start, end: node.start + 4, text: "/sys" });
      if (node.name === "random" && delta > 0) edits.push({ start: node.start, end: node.start + "/random".length, text: "/randomchar" });
      if (node.name === "randomchar" && delta < 0) edits.push({ start: node.start, end: node.start + "/randomchar".length, text: "/random" });
      if (AT_COMMANDS.has(node.name) && node.named.some((a) => a.name === "at")) {
        const arg = namedArg(script, node, "at");
        if (arg && /^\d+$/.test(arg.value)) edits.push({ start: arg.start, end: arg.start + arg.value.length, text: String(Math.max(0, Number(arg.value) + delta)) });
        else reasons.add(t(`/${node.name}: the at= value isn't a number`, `/${node.name}의 at= 값이 숫자가 아니에요`));
      }
      if (INDEX_COMMANDS.has(node.name)) {
        const region = unnamedRegion(script, node);
        if (!region) {
          if (node.name !== "messages" && node.name !== "message") reasons.add(t(`/${node.name} uses the previous command's result (pipe) as a message number`, `/${node.name}이(가) 앞 명령의 결과(파이프)를 메시지 번호로 써요`));
          continue;
        }
        const rewritten = rewriteRange(region.text, delta, bound);
        if (rewritten === null) {
          reasons.add(t(`/${node.name}: can't follow the message number (${region.text.trim().slice(0, 40)})`, `/${node.name}의 메시지 번호를 따라갈 수 없어요 (${region.text.trim().slice(0, 40)})`));
          continue;
        }
        if (rewritten !== region.text) edits.push({ start: region.start, end: region.start + region.text.length, text: rewritten });
      }
      if (ASSIGN_COMMANDS.has(node.name)) {
        const target = assignment(node);
        if (target && target.value !== null && anchored(target.name)) {
          const value = target.value.trim();
          if (/^\{\{lastMessageId\}\}$/i.test(value)) lastHandled++;
          else if (/^-?\d+$/.test(value)) {
            const region = unnamedRegion(script, node);
            const m2 = region ? /(-?\d+)\s*$/.exec(region.text) : null;
            if (region && m2) {
              const at = region.start + m2.index;
              edits.push({ start: at, end: at + m2[1].length, text: String(Number(m2[1]) + delta) });
            }
          }
        }
      }
      if (COMPARE_COMMANDS.has(node.name)) {
        const ops = OPERAND_KEYS.map((k) => namedArg(script, node, k)).filter((o) => !!o);
        if (ops.length === 0) continue;
        const kinds = ops.map((o) => classify(o.value, anchored));
        const isIndex = (k) => k.kind === "last" || k.kind === "var" && anchored(k.name);
        const indexSides = kinds.filter(isIndex).length;
        if (indexSides === 0) continue;
        for (const k of kinds) {
          if (k.kind === "last") lastHandled++;
          if (k.kind === "var" && anchored(k.name) && /\{\{/.test(ops[kinds.indexOf(k)].value)) handleVar(k.name);
        }
        if (indexSides === 1 && ops.length === 2) {
          const otherIdx = isIndex(kinds[0]) ? 1 : 0;
          const other = kinds[otherIdx];
          if (other.kind === "lit") {
            const o = ops[otherIdx];
            const numAt = o.start + o.value.indexOf(String(other.value));
            edits.push({ start: numAt, end: numAt + String(other.value).length, text: String(other.value + delta) });
          } else {
            reasons.add(t(`/${node.name} compares a message number with a computed value`, `/${node.name}에서 메시지 번호를 계산된 값과 비교해요`));
          }
        }
      }
    }
    const totalLast = (script.match(LAST_ID_RE) ?? []).length;
    if (totalLast > lastHandled) reasons.add(t("{{lastMessageId}} is also used for things other than message numbers (text output, math, etc.)", "{{lastMessageId}}를 메시지 번호 말고 다른 곳(글자 출력, 계산 등)에도 써요"));
    const macroUses = /* @__PURE__ */ new Map();
    for (const m2 of script.matchAll(VAR_MACRO_RE)) macroUses.set(m2[1], (macroUses.get(m2[1]) ?? 0) + 1);
    for (const [name, count] of macroUses) {
      if (anchored(name) && count > (varHandled.get(name) ?? 0)) reasons.add(t(`Variable "${name}" holds a message number and is also used elsewhere`, `메시지 번호를 담은 변수 "${name}"를 다른 곳에도 써요`));
    }
    if (reasons.size) return { ok: false, script, changes: 0, reasons: [...reasons] };
    let out = script;
    const unique = dedupe(edits);
    for (const e of unique.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    return { ok: true, script: out, changes: unique.length, reasons: [] };
  }
  function flatten(root, reasons) {
    const out = [];
    const visit = (c) => {
      for (const a of c.args) if (typeof a.value !== "string") visit(a.value);
      for (const ex of c.executors) {
        if (ex.kind !== "command") continue;
        out.push(ex);
        for (const arg of ex.named) {
          if (typeof arg.value !== "string") visit(arg.value);
          else if (BODY_COMMANDS.has(ex.name) && arg.name === "else" && RISKY_IN_STRINGS.test(arg.value)) reasons.add(t(`/${ex.name}: a quoted command has a message number`, `/${ex.name}의 따옴표 속 명령에 메시지 번호가 있어요`));
        }
        for (const arg of ex.unnamed) {
          if (typeof arg.value !== "string") visit(arg.value);
          else if (BODY_COMMANDS.has(ex.name) && RISKY_IN_STRINGS.test(arg.value)) reasons.add(t(`/${ex.name}: a quoted command has a message number`, `/${ex.name}의 따옴표 속 명령에 메시지 번호가 있어요`));
        }
      }
    };
    visit(root);
    return out;
  }
  function dedupe(edits) {
    const seen = /* @__PURE__ */ new Map();
    for (const e of edits) seen.set(`${e.start}:${e.end}`, e);
    return [...seen.values()];
  }
  function unnamedText(node) {
    if (node.unnamed.length === 0) return "";
    if (node.unnamed.some((u) => typeof u.value !== "string")) return null;
    return node.unnamed.map((u) => u.value).join(" ");
  }
  function varArg(node) {
    const key2 = node.named.find((a) => a.name === "key" || a.name === "name");
    if (key2) return typeof key2.value === "string" ? key2.value.trim() : null;
    const t2 = unnamedText(node);
    return t2 ? t2.trim() : null;
  }
  function assignment(node) {
    const key2 = node.named.find((a) => a.name === "key");
    if (node.name === "setvar" || key2) {
      const name2 = key2 && typeof key2.value === "string" ? key2.value.trim() : "";
      if (!name2) return null;
      return { name: name2, value: unnamedText(node) };
    }
    const parts3 = node.unnamed;
    if (!parts3.length || typeof parts3[0].value !== "string") return null;
    const name = parts3[0].value.trim();
    if (parts3.slice(1).some((p) => typeof p.value !== "string")) return { name, value: null };
    return { name, value: parts3.slice(1).map((p) => p.value).join(" ") };
  }
  function classify(raw, anchored) {
    const t2 = raw.trim();
    if (/^\{\{lastMessageId\}\}$/i.test(t2)) return { kind: "last" };
    const m2 = /^\{\{(?:getvar|var)::\s*([^}:]+?)\s*\}\}$/i.exec(t2);
    if (m2) return { kind: "var", name: m2[1] };
    if (/^-?\d+$/.test(t2)) return { kind: "lit", value: Number(t2) };
    if (/^\w+$/.test(t2) && anchored(t2)) return { kind: "var", name: t2 };
    return { kind: "other" };
  }
  function namedArg(script, node, key2) {
    const slice = script.slice(node.start, node.end);
    const head = /^\/\S+((?:\s+\w+=(?:"(?:[^"\\]|\\.)*"|\[[^\]]*\]|\{:[\s\S]*?:\}|\S+))*)/.exec(slice);
    if (!head) return null;
    const region = slice.slice(0, head[0].length);
    const m2 = new RegExp(`(^|\\s)${key2}=("((?:[^"\\\\]|\\\\.)*)"|(?!\\{:)\\S+)`).exec(region);
    if (!m2) return null;
    const quoted = m2[3] !== void 0;
    const value = quoted ? m2[3] : m2[2];
    const start2 = node.start + m2.index + m2[1].length + key2.length + 1 + (quoted ? 1 : 0);
    return { start: start2, value };
  }
  function unnamedRegion(script, node) {
    const slice = script.slice(node.start, node.end);
    const m2 = /^\/\S+((?:\s+\w+=(?:"(?:[^"\\]|\\.)*"|\[[^\]]*\]|\S+))*)\s+([\s\S]*?)\s*$/.exec(slice);
    if (!m2 || !m2[2]) return null;
    const text7 = m2[2];
    return { start: node.start + slice.trimEnd().length - text7.length, text: text7 };
  }
  function rewriteRange(text7, delta = 1, bound = defaultBound(delta)) {
    const out = [];
    for (const part of text7.split(",")) {
      const m2 = /^(\s*)(\{\{[^}]*\}\}|[^-\s{][^-]*?)(?:(\s*-\s*)(\{\{[^}]*\}\}|\S+?))?(\s*)$/.exec(part);
      if (!m2) return null;
      const a = bound(m2[2]);
      if (a === null) return null;
      let piece = `${m2[1]}${a}`;
      if (m2[3] !== void 0) {
        const b = bound(m2[4]);
        if (b === null) return null;
        piece += `${m2[3]}${b}`;
      }
      out.push(piece + m2[5]);
    }
    return out.join(",");
  }
  function defaultBound(delta) {
    return (b) => {
      if (/^\d+$/.test(b)) return String(Math.max(0, Number(b) + delta));
      if (/^\{\{lastMessageId\}\}$/i.test(b)) return b;
      return null;
    };
  }

  // src/qr/model.ts
  var emptyState = () => ({ version: 1, sets: [], barVisible: false, chatSets: {}, charSets: {} });
  function newId(prefix = "q") {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
  function newSet(name, origin = "dispensa") {
    return { id: newId("set"), name, items: [], display: "folder", enabled: true, origin };
  }
  function newItem(label, script, dialect = "marinara", kind = "script") {
    return { id: newId("qr"), label, script, dialect, kind };
  }
  function normalizeState(raw) {
    const base = emptyState();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    return {
      version: 1,
      barVisible: r.barVisible === true,
      ...Array.isArray(r.bar) ? { bar: barEntries(r.bar) } : {},
      chatSets: idLists(r.chatSets),
      charSets: idLists(r.charSets),
      sets: Array.isArray(r.sets) ? r.sets.map((s) => ({
        ...newSet(String(s?.name ?? t("Set", "세트"))),
        ...s,
        items: Array.isArray(s?.items) ? s.items.map((i) => ({ ...newItem(String(i?.label ?? "QR"), String(i?.script ?? "")), ...i })) : []
      })) : []
    };
  }
  function barEntries(raw) {
    return raw.flatMap((e) => {
      const x = e;
      if (typeof x?.setId !== "string") return [];
      if (x.kind === "set") return [{ kind: "set", setId: x.setId, ...x.layout === "row" || x.layout === "folder" ? { layout: x.layout } : {} }];
      if (x.kind === "qr" && typeof x.itemId === "string") return [{ kind: "qr", setId: x.setId, itemId: x.itemId }];
      return [];
    });
  }
  function idLists(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const [k, v] of Object.entries(raw)) {
      const ids = Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
      if (ids.length) out[k] = [...new Set(ids)];
    }
    return out;
  }
  var BUILTIN_NAMES = { viz: "비주얼라이저", bar: "퀵바" };
  function builtinSet(state, kind) {
    const marked = state.sets.find((s) => s.builtin === kind);
    if (marked) return marked;
    const old = state.sets.find((s) => !s.builtin && s.name === BUILTIN_NAMES[kind]);
    if (old) old.builtin = kind;
    return old;
  }
  function findItem(state, name) {
    for (const set of state.sets) {
      const item = set.items.find((i) => i.label === name);
      if (item) return { set, item };
    }
    const dot = name.indexOf(".");
    if (dot > 0) {
      const setName = name.slice(0, dot);
      const label = name.slice(dot + 1);
      const set = state.sets.find((s) => s.name === setName);
      const item = set?.items.find((i) => i.label === label);
      if (set && item) return { set, item };
    }
    return void 0;
  }

  // src/qr/icons.ts
  var PAIRS = [
    ["star", "⭐"],
    ["heart", "❤️"],
    ["heart-crack", "💔"],
    ["gear", "⚙️"],
    ["gears", "⚙️"],
    ["cog", "⚙️"],
    ["dice", "🎲"],
    ["dice-d20", "🎲"],
    ["dice-six", "🎲"],
    ["bolt", "⚡"],
    ["bolt-lightning", "⚡"],
    ["book", "📖"],
    ["book-open", "📖"],
    ["bookmark", "🔖"],
    ["pen", "🖊️"],
    ["pencil", "✏️"],
    ["pen-to-square", "📝"],
    ["feather", "🪶"],
    ["trash", "🗑️"],
    ["trash-can", "🗑️"],
    ["play", "▶️"],
    ["pause", "⏸️"],
    ["stop", "⏹️"],
    ["forward", "⏩"],
    ["backward", "⏪"],
    ["comment", "💬"],
    ["comments", "💬"],
    ["message", "💬"],
    ["comment-dots", "💬"],
    ["music", "🎵"],
    ["image", "🖼️"],
    ["images", "🖼️"],
    ["camera", "📷"],
    ["video", "🎬"],
    ["user", "👤"],
    ["users", "👥"],
    ["user-secret", "🕵️"],
    ["ghost", "👻"],
    ["fire", "🔥"],
    ["moon", "🌙"],
    ["sun", "☀️"],
    ["cloud", "☁️"],
    ["snowflake", "❄️"],
    ["droplet", "💧"],
    ["umbrella", "☂️"],
    ["wand-magic-sparkles", "🪄"],
    ["wand-magic", "🪄"],
    ["magic", "🪄"],
    ["hat-wizard", "🧙"],
    ["robot", "🤖"],
    ["paper-plane", "📨"],
    ["envelope", "✉️"],
    ["clock", "🕒"],
    ["hourglass", "⏳"],
    ["bell", "🔔"],
    ["flag", "🚩"],
    ["eye", "👁️"],
    ["eye-slash", "🙈"],
    ["lock", "🔒"],
    ["unlock", "🔓"],
    ["key", "🔑"],
    ["magnifying-glass", "🔍"],
    ["search", "🔍"],
    ["check", "✅"],
    ["xmark", "❌"],
    ["times", "❌"],
    ["plus", "➕"],
    ["minus", "➖"],
    ["arrow-right", "➡️"],
    ["arrow-left", "⬅️"],
    ["arrow-up", "⬆️"],
    ["arrow-down", "⬇️"],
    ["rotate", "🔄"],
    ["rotate-right", "🔄"],
    ["arrows-rotate", "🔄"],
    ["repeat", "🔁"],
    ["shuffle", "🔀"],
    ["list", "📋"],
    ["list-ul", "📋"],
    ["clipboard", "📋"],
    ["map", "🗺️"],
    ["compass", "🧭"],
    ["globe", "🌐"],
    ["earth-asia", "🌏"],
    ["skull", "💀"],
    ["crown", "👑"],
    ["gem", "💎"],
    ["gift", "🎁"],
    ["cake-candles", "🎂"],
    ["mug-hot", "☕"],
    ["coffee", "☕"],
    ["utensils", "🍴"],
    ["house", "🏠"],
    ["home", "🏠"],
    ["tree", "🌳"],
    ["leaf", "🍃"],
    ["seedling", "🌱"],
    ["paw", "🐾"],
    ["cat", "🐱"],
    ["dog", "🐶"],
    ["dragon", "🐉"],
    ["scroll", "📜"],
    ["brain", "🧠"],
    ["lightbulb", "💡"],
    ["face-smile", "🙂"],
    ["face-laugh", "😆"],
    ["face-grin", "😁"],
    ["face-sad-tear", "😢"],
    ["face-angry", "😠"],
    ["face-surprise", "😮"],
    ["floppy-disk", "💾"],
    ["save", "💾"],
    ["copy", "📄"],
    ["paste", "📋"],
    ["code", "💻"],
    ["terminal", "💻"],
    ["bug", "🐛"],
    ["wrench", "🔧"],
    ["hammer", "🔨"],
    ["screwdriver-wrench", "🛠️"],
    ["shield", "🛡️"],
    ["shield-halved", "🛡️"],
    ["chess", "♟️"],
    ["chess-knight", "♞"],
    ["puzzle-piece", "🧩"],
    ["trophy", "🏆"],
    ["medal", "🏅"],
    ["rocket", "🚀"],
    ["plane", "✈️"],
    ["car", "🚗"],
    ["ship", "🚢"],
    ["anchor", "⚓"],
    ["mountain", "⛰️"],
    ["water", "🌊"],
    ["wind", "💨"],
    ["masks-theater", "🎭"],
    ["palette", "🎨"],
    ["paintbrush", "🖌️"],
    ["brush", "🖌️"],
    ["guitar", "🎸"],
    ["headphones", "🎧"],
    ["microphone", "🎤"],
    ["phone", "📞"],
    ["mobile", "📱"],
    ["mobile-screen", "📱"],
    ["calendar", "📅"],
    ["calendar-days", "📅"],
    ["sparkles", "✨"],
    ["wand-sparkles", "🪄"],
    ["circle-info", "ℹ️"],
    ["info", "ℹ️"],
    ["circle-question", "❓"],
    ["question", "❓"],
    ["exclamation", "❗"],
    ["triangle-exclamation", "⚠️"],
    ["ban", "🚫"],
    ["hand", "✋"],
    ["thumbs-up", "👍"],
    ["thumbs-down", "👎"],
    ["kiss-wink-heart", "😘"],
    ["face-kiss-wink-heart", "😘"],
    ["bed", "🛏️"],
    ["shower", "🚿"],
    ["bath", "🛁"],
    ["money-bill", "💵"],
    ["coins", "🪙"],
    ["cart-shopping", "🛒"],
    ["bag-shopping", "🛍️"],
    ["film", "🎞️"],
    ["tv", "📺"],
    ["newspaper", "📰"],
    ["quote-left", "❝"],
    ["at", "@"],
    ["hashtag", "#"],
    ["link", "🔗"],
    ["paperclip", "📎"],
    ["thumbtack", "📌"],
    ["location-dot", "📍"]
  ];
  var BY_NAME = new Map(PAIRS);
  var BY_EMOJI = /* @__PURE__ */ new Map();
  for (const [name, emoji] of PAIRS) if (!BY_EMOJI.has(emoji)) BY_EMOJI.set(emoji, name);
  function emojiForIcon(icon2) {
    const names = icon2.split(/\s+/).map((c) => c.replace(/^fa-/, "")).filter((c) => c && !["fa", "solid", "regular", "light", "thin", "duotone", "brands", "fw", "lg", "xl", "sm", "xs"].includes(c) && !/^\d+x$/.test(c));
    if (!names.length) return void 0;
    for (const n of names) {
      const hit = BY_NAME.get(n);
      if (hit) return hit;
    }
    return "⭐";
  }
  function iconForEmoji(emoji) {
    const name = BY_EMOJI.get(emoji.trim()) ?? BY_EMOJI.get(emoji.trim().replace(/️/g, "")) ?? BY_EMOJI.get(`${emoji.trim()}️`);
    return name ? `fa-solid fa-${name}` : void 0;
  }

  // src/qr/import.ts
  function findUnsupported(script, registry) {
    if (!script.trimStart().startsWith("/")) return [];
    let closure;
    try {
      closure = parse(script, { lookup: (n) => registry.get(n) });
    } catch (e) {
      return { error: e instanceof ParseError ? e.message : String(e) };
    }
    const unknown = /* @__PURE__ */ new Set();
    const walk = (c) => {
      for (const ex of c.executors) {
        if (ex.kind === "command") {
          if (!registry.has(ex.name)) unknown.add(ex.name);
          for (const a of ex.named) if (typeof a.value !== "string") walk(a.value);
          for (const a of ex.unnamed) if (typeof a.value !== "string") walk(a.value);
        }
      }
      for (const a of c.args) if (typeof a.value !== "string") walk(a.value);
    };
    walk(closure);
    return [...unknown].sort();
  }
  var emptyReport = () => ({ sets: [], items: [], links: [], total: 0, unsupported: [], parseErrors: [], converted: 0, keptSillyTavern: [] });
  function isStItem(json2) {
    if (!json2 || typeof json2 !== "object" || Array.isArray(json2)) return false;
    const j = json2;
    return typeof j.label === "string" && typeof j.message === "string" && !("qrList" in j);
  }
  function importSillyTavern(json2, registry, fallbackName = t("Imported QR", "가져온 QR")) {
    const report = emptyReport();
    if (isStItem(json2)) {
      const item = stItem(json2, registry, report, "");
      if (item) report.items.push(item);
      return report;
    }
    const list = Array.isArray(json2) ? json2 : [json2];
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const qrs = raw.qrList ?? raw.quickReplySlots;
      if (!Array.isArray(qrs)) continue;
      const set = newSet(String(raw.name || fallbackName), "st");
      set.disableSend = !!raw.disableSend;
      set.placeBeforeInput = !!raw.placeBeforeInput;
      set.injectInput = !!raw.injectInput;
      if (raw.color && raw.color !== "rgba(0, 0, 0, 0)" && raw.color !== "transparent") set.color = raw.color;
      if (raw.onlyBorderColor) set.colorBorderOnly = true;
      for (const q of qrs) {
        const item = stItem(q, registry, report, set.name);
        if (item) set.items.push(item);
      }
      report.sets.push(set);
    }
    return report;
  }
  function stItem(q, registry, report, setName) {
    const script = String(q.message ?? q.mes ?? "");
    if (!script.trim() && !q.label && !q.contextList?.length) return null;
    const auto = {};
    if (q.executeOnStartup) auto.startup = true;
    if (q.executeOnUser) auto.user = true;
    if (q.executeOnAi) auto.ai = true;
    if (q.executeOnChatChange) auto.chatChange = true;
    if (q.executeOnNewChat) auto.newChat = true;
    if (q.executeOnGroupMemberDraft) auto.groupDraft = true;
    if (q.executeBeforeGeneration) auto.beforeGeneration = true;
    const item = { ...newItem(String(q.label || (q.icon ? "" : "QR")), script, "st") };
    if (q.title) item.title = q.title;
    if (q.isHidden) item.hidden = true;
    if (Object.keys(auto).length) item.auto = auto;
    if (q.automationId?.trim()) item.automationId = q.automationId.trim();
    if (q.preventAutoExecute === false) item.preventAuto = false;
    const emoji = q.icon ? emojiForIcon(q.icon) : void 0;
    if (emoji) {
      item.icon = emoji;
      if (!q.showLabel && item.label) item.showLabel = false;
    }
    if (!item.label) item.label = emoji ?? "QR";
    for (const link of q.contextList ?? []) if (link?.set) report.links.push({ item, setName: link.set, chained: !!link.isChained });
    check(item, registry, report, setName);
    applyConversion(item, registry);
    if (item.dialect === "marinara") report.converted++;
    else report.keptSillyTavern.push({ set: setName, label: item.label, reasons: item.note ? item.note.split("\n") : [] });
    report.total++;
    return item;
  }
  function check(item, registry, report, setName) {
    const found = findUnsupported(item.script, registry);
    if (Array.isArray(found)) {
      if (found.length) {
        item.unsupported = found;
        report.unsupported.push({ set: setName, label: item.label, commands: found });
      }
    } else {
      item.unsupported = [t("(syntax error)", "(문법 오류)")];
      report.parseErrors.push({ set: setName, label: item.label, error: found.error });
    }
  }
  function resolveLinks(state, links) {
    const missing = /* @__PURE__ */ new Set();
    for (const { item, setName, chained } of links) {
      const set = [...state.sets].reverse().find((s) => s.name === setName);
      if (!set) {
        missing.add(setName);
        continue;
      }
      item.contextList = [...item.contextList ?? [], chained ? { setId: set.id, chained: true } : { setId: set.id }];
    }
    return [...missing];
  }
  function applyConversion(item, registry) {
    const result = convertToMarinara(item.script, registry);
    if (result.ok) {
      item.script = result.script;
      item.dialect = "marinara";
      delete item.note;
      return true;
    }
    item.dialect = "st";
    item.note = result.reasons.join("\n");
    return false;
  }
  var MQR_FORMAT = "dispensa-mqr";
  function exportMarinara(set, names) {
    return {
      format: MQR_FORMAT,
      version: 1,
      name: set.name,
      display: set.display,
      color: set.color,
      colorBorderOnly: set.colorBorderOnly || void 0,
      icon: set.icon,
      disableSend: !!set.disableSend,
      placeBeforeInput: !!set.placeBeforeInput,
      injectInput: !!set.injectInput,
      items: set.items.map((i) => mqrItem(i, names))
    };
  }
  var MQR_ITEM_FORMAT = "dispensa-mqr-item";
  function exportMarinaraItem(item, names) {
    return { format: MQR_ITEM_FORMAT, version: 1, item: mqrItem(item, names) };
  }
  function mqrItem(i, names) {
    const links = (i.contextList ?? []).map((l) => ({ set: names?.(l.setId), chained: !!l.chained })).filter((l) => l.set);
    return {
      label: i.label,
      title: i.title,
      script: i.script,
      kind: i.kind,
      dialect: i.dialect,
      icon: i.icon,
      showLabel: i.showLabel === false ? false : void 0,
      hidden: !!i.hidden,
      auto: i.auto,
      automationId: i.automationId,
      preventAuto: i.preventAuto === false ? false : void 0,
      contextList: links.length ? links : void 0,
      viz: i.kind === "viz" ? i.viz : void 0
    };
  }
  var isMqrFormat = (format) => format === MQR_FORMAT || format === "shelter-mqr";
  function isMarinaraQr(json2) {
    if (!json2 || typeof json2 !== "object") return false;
    const j = json2;
    return isMqrFormat(j.format) || j.format === MQR_ITEM_FORMAT || Array.isArray(j.sets) && j.sets.some((s) => s && typeof s === "object" && isMqrFormat(s.format));
  }
  function importMarinara(json2, registry, fallbackName = t("Imported QR", "가져온 QR")) {
    const report = emptyReport();
    const j = json2;
    if (j.format === MQR_ITEM_FORMAT) {
      if (j.item && typeof j.item === "object") report.items.push(mqrToItem(j.item, registry, report, ""));
      return report;
    }
    const list = Array.isArray(j.sets) ? j.sets : [json2];
    for (const raw of list) {
      if (!raw || !isMqrFormat(raw.format) || !Array.isArray(raw.items)) continue;
      const set = newSet(String(raw.name || fallbackName));
      set.display = raw.display === "inline" ? "inline" : "folder";
      if (typeof raw.color === "string") set.color = raw.color;
      if (raw.colorBorderOnly) set.colorBorderOnly = true;
      if (typeof raw.icon === "string" && raw.icon.trim()) set.icon = raw.icon;
      set.disableSend = !!raw.disableSend;
      set.placeBeforeInput = !!raw.placeBeforeInput;
      set.injectInput = !!raw.injectInput;
      for (const r of raw.items) set.items.push(mqrToItem(r, registry, report, set.name));
      report.sets.push(set);
    }
    return report;
  }
  function mqrToItem(r, registry, report, setName) {
    const item = {
      ...newItem(String(r.label ?? "QR"), String(r.script ?? ""), r.dialect === "st" ? "st" : "marinara", r.kind === "ooc" || r.kind === "viz" ? r.kind : "script"),
      title: typeof r.title === "string" && r.title ? r.title : void 0,
      icon: typeof r.icon === "string" ? r.icon : void 0,
      hidden: !!r.hidden,
      auto: r.auto && typeof r.auto === "object" ? r.auto : void 0
    };
    if (r.showLabel === false) item.showLabel = false;
    if (typeof r.automationId === "string" && r.automationId.trim()) item.automationId = r.automationId.trim();
    if (r.preventAuto === false) item.preventAuto = false;
    if (Array.isArray(r.contextList)) {
      for (const l of r.contextList) if (typeof l?.set === "string") report.links.push({ item, setName: l.set, chained: !!l.chained });
    }
    report.total++;
    if (item.kind === "viz") {
      const v = r.viz && typeof r.viz === "object" ? r.viz : {};
      item.viz = { action: v.action === "ooc" ? "ooc" : "viz" };
      item.script = vizScript(item);
      item.kind = "script";
      delete item.viz;
      return item;
    }
    check(item, registry, report, setName);
    if (item.dialect === "st") report.keptSillyTavern.push({ set: setName, label: item.label, reasons: [t("Saved as a SillyTavern QR", "실리태번 기준으로 저장된 QR이에요")] });
    return item;
  }
  function importAny(json2, registry, fallbackName) {
    return isMarinaraQr(json2) ? importMarinara(json2, registry, fallbackName) : importSillyTavern(json2, registry, fallbackName);
  }
  function foreignCommands(script, registry) {
    if (!script.trimStart().startsWith("/")) return [];
    let closure;
    try {
      closure = parse(script, { lookup: (n) => registry.get(n) });
    } catch {
      return [];
    }
    const found = /* @__PURE__ */ new Set();
    const walk = (c) => {
      for (const ex of c.executors) {
        if (ex.kind !== "command") continue;
        const origin = registry.get(ex.name)?.origin;
        if (origin && origin !== "st" && ex.name !== "randomchar") found.add(ex.name);
        for (const a of [...ex.named, ...ex.unnamed]) if (typeof a.value !== "string") walk(a.value);
      }
    };
    walk(closure);
    return [...found].sort();
  }
  function nonSillyTavernCommands(set, registry) {
    return set.items.map((item) => ({ label: item.label, commands: item.kind === "viz" ? ["visz"] : foreignCommands(item.script, registry) })).filter((f) => f.commands.length);
  }
  function vizScript(item) {
    const escaped = item.script.replace(/[|\\]/g, (c) => `\\${c}`);
    return `/visz action=${item.viz?.action ?? "viz"} ${escaped}`;
  }
  function exportSillyTavern(set, registry, names) {
    return {
      version: 2,
      name: set.name,
      disableSend: !!set.disableSend,
      placeBeforeInput: !!set.placeBeforeInput,
      injectInput: !!set.injectInput,
      color: set.color ?? "rgba(0, 0, 0, 0)",
      onlyBorderColor: !!set.colorBorderOnly,
      qrList: set.items.map((i, index) => stExportItem(i, index + 1, registry, names)),
      idIndex: set.items.length + 1
    };
  }
  function stExportItem(i, id, registry, names) {
    let message = i.script;
    if (i.kind === "viz") message = vizScript(i);
    else if (i.dialect !== "st" && registry) {
      const back = convertToSillyTavern(i.script, registry);
      if (back.ok) message = back.script;
    }
    const icon2 = i.icon ? iconForEmoji(i.icon) : void 0;
    return {
      id,
      icon: icon2 ?? "",
      showLabel: icon2 ? i.showLabel !== false : false,
      // the name stays as it is (/run finds QRs by name); an emoji with no Font Awesome match is left out
      label: i.label,
      title: i.title ?? "",
      message,
      contextList: (i.contextList ?? []).map((l) => ({ set: names?.(l.setId), isChained: !!l.chained })).filter((l) => l.set),
      preventAutoExecute: i.preventAuto !== false,
      isHidden: !!i.hidden,
      executeOnStartup: !!i.auto?.startup,
      executeOnUser: !!i.auto?.user,
      executeOnAi: !!i.auto?.ai,
      executeOnChatChange: !!i.auto?.chatChange,
      executeOnGroupMemberDraft: !!i.auto?.groupDraft,
      executeOnNewChat: !!i.auto?.newChat,
      executeBeforeGeneration: !!i.auto?.beforeGeneration,
      automationId: i.automationId ?? ""
    };
  }
  var OOC_PATTERNS = [
    /\*\s*\{\s*OOC\s*[:：]\s*([\s\S]*?)\s*\}\s*\*/gi,
    // *{OOC: ...}*
    /\{\s*OOC\s*[:：]\s*([\s\S]*?)\s*\}/gi,
    // {OOC: ...}
    /\[\s*OOC\s*[:：]\s*([\s\S]*?)\s*\]/gi,
    // [OOC: ...]
    /\(\(\s*OOC\s*[:：]?\s*([\s\S]*?)\s*\)\)/gi,
    // ((OOC: ...))
    /\(\s*OOC\s*[:：]\s*([\s\S]*?)\s*\)/gi,
    // (OOC: ...)
    /\*\s*OOC\s*[:：]\s*([\s\S]*?)\s*\*/gi
    // *OOC: ...*
  ];
  function extractOocNotes(text7) {
    let rest = text7;
    const notes = [];
    for (const re of OOC_PATTERNS) {
      rest = rest.replace(re, (match, body, offset) => {
        if (body.trim()) notes.push({ index: offset, body: body.trim() });
        return " ".repeat(match.length);
      });
    }
    rest = rest.replace(/^\s*OOC\s*[:：]\s*(.+)$/gim, (match, body, offset) => {
      if (body.trim()) notes.push({ index: offset, body: body.trim() });
      return " ".repeat(match.length);
    });
    notes.sort((a, b) => a.index - b.index);
    if (notes.length === 0 && text7.trim()) return [text7.trim()];
    return notes.map((n) => n.body);
  }

  // src/qr/bar.ts
  var BAR_SET = { name: () => "Dock", icon: "⚡" };
  function shownBar(state) {
    const out = [];
    for (const entry of state.bar ?? []) {
      if (entry.kind === "set") {
        const set = state.sets.find((s) => s.id === entry.setId);
        if (set) out.push({ entry, set });
        continue;
      }
      for (const set of state.sets) {
        const item = set.items.find((i) => i.id === entry.itemId);
        if (item) {
          out.push({ entry, set, item });
          break;
        }
      }
    }
    return out;
  }
  var same2 = (a, b) => a.kind === b.kind && (a.kind === "set" ? a.setId === b.setId : a.itemId === b.itemId);
  function onBar(state, entry) {
    return (state.bar ?? []).some((e) => same2(e, entry));
  }
  function addToBar(state, entry, index) {
    const bar = state.bar ??= [];
    if (bar.some((e) => same2(e, entry))) return;
    bar.splice(index === void 0 ? bar.length : Math.max(0, Math.min(index, bar.length)), 0, entry);
  }
  function removeFromBar(state, entry) {
    if (state.bar) state.bar = state.bar.filter((e) => !same2(e, entry));
  }
  function barSet(state) {
    let set = builtinSet(state, "bar");
    if (!set) {
      set = { ...newSet(BAR_SET.name()), icon: BAR_SET.icon, builtin: "bar" };
      state.sets.push(set);
    }
    return set;
  }
  function moveToOwnBar(state) {
    if (state.bar) return;
    state.bar = state.sets.filter((s) => s.enabled && s.items.some((i) => !i.hidden)).map((s) => ({ kind: "set", setId: s.id, layout: s.display === "inline" ? "row" : "folder" }));
  }
  var OLD_BAR_NAMES = ["퀵바", "Quick bar"];
  function oldBarSet(state) {
    const set = state.sets.find((s) => s.builtin === "bar") ?? state.sets.find((s) => !s.builtin && s.name === "퀵바");
    return set && OLD_BAR_NAMES.includes(set.name) ? set : void 0;
  }
  function renameOldBarSet(state) {
    const set = oldBarSet(state);
    if (!set) return;
    set.builtin = "bar";
    set.name = BAR_SET.name();
  }
  function layoutOf(entry, set) {
    if (entry.kind !== "set") return "folder";
    return entry.layout ?? (set.display === "inline" ? "row" : "folder");
  }
  function setLayout(state, setId, layout) {
    for (const e of state.bar ?? []) if (e.kind === "set" && e.setId === setId) e.layout = layout;
  }

  // src/qr/control.ts
  var TRIGGER_ARGS = [
    ["startup", "startup"],
    ["user", "user"],
    ["bot", "ai"],
    ["load", "chatChange"],
    ["newChat", "newChat"],
    ["group", "groupDraft"],
    ["generation", "beforeGeneration"]
  ];
  function createQrControl(store, runner, scope = () => NO_CHAT) {
    const timers = /* @__PURE__ */ new Set();
    const findSet = (st, name) => st.sets.find((s) => s.name === name);
    const findIn = (st, ref2) => {
      const set = findSet(st, ref2.set);
      if (!set) return void 0;
      const item = ref2.id !== void 0 ? set.items[ref2.id - 1] : set.items.find((i) => i.label === ref2.label);
      return item ? { set, item } : void 0;
    };
    const setName = (id) => store.value.sets.find((s) => s.id === id)?.name;
    const apply = (item, changes) => {
      if (changes.title !== void 0) item.title = changes.title || void 0;
      if (changes.message !== void 0) item.script = changes.message;
      if (changes.hidden !== void 0) item.hidden = changes.hidden;
      if (changes.icon !== void 0) {
        const icon2 = changes.icon.trim();
        item.icon = icon2.startsWith("fa") ? emojiForIcon(icon2) : icon2 || void 0;
      }
      if (changes.showLabel !== void 0) {
        if (changes.showLabel) delete item.showLabel;
        else item.showLabel = false;
      }
      const auto = { ...item.auto };
      for (const [arg, trigger] of TRIGGER_ARGS) {
        const v = changes[arg];
        if (v === void 0) continue;
        if (v) auto[trigger] = true;
        else delete auto[trigger];
      }
      item.auto = Object.keys(auto).length ? auto : void 0;
    };
    const setOptions2 = (set, o) => {
      if (o.nosend !== void 0) set.disableSend = o.nosend;
      if (o.before !== void 0) set.placeBeforeInput = o.before;
      if (o.inject !== void 0) set.injectInput = o.inject;
      if (o.color !== void 0) {
        if (o.color && o.color !== "transparent" && o.color !== "rgba(0, 0, 0, 0)") set.color = o.color;
        else delete set.color;
      }
      if (o.onlyBorder !== void 0) {
        if (o.onlyBorder) set.colorBorderOnly = true;
        else delete set.colorBorderOnly;
      }
    };
    const withItem = (ref2, fn) => {
      let found = false;
      store.update((st) => {
        const hit = findIn(st, ref2);
        if (!hit) return;
        found = true;
        fn(hit.item, st);
      });
      if (!found) throw new Error(ref2.id !== void 0 ? `No QR #${ref2.id} in set "${ref2.set}"` : `No QR "${ref2.label}" in set "${ref2.set}"`);
    };
    return {
      setNames: (where = "all") => {
        const st = store.value;
        if (where === "global") return st.sets.filter((s) => s.enabled).map((s) => s.name);
        if (where === "chat") {
          const chat = scope().chatId;
          return chat ? st.sets.filter((s) => isOnForChat(st, s.id, chat)).map((s) => s.name) : [];
        }
        return st.sets.map((s) => s.name);
      },
      labels: (set) => findSet(store.value, set)?.items.map((i) => i.label) ?? [],
      get: (ref2) => {
        const hit = findIn(store.value, ref2);
        if (!hit) return void 0;
        const { set, item: i } = hit;
        return {
          ...stExportItem(i, set.items.indexOf(i) + 1, void 0, setName),
          message: i.script,
          // Dispensa's names, kept for scripts written against them
          set: set.name,
          hidden: !!i.hidden,
          startup: !!i.auto?.startup,
          user: !!i.auto?.user,
          bot: !!i.auto?.ai,
          load: !!i.auto?.chatChange,
          newChat: !!i.auto?.newChat,
          group: !!i.auto?.groupDraft,
          generation: !!i.auto?.beforeGeneration
        };
      },
      create: (info, dialect) => store.update((st) => {
        let set = findSet(st, info.set);
        if (!set) {
          set = newSet(info.set);
          st.sets.push(set);
        }
        const item = newItem(info.label, info.message ?? "", dialect);
        if (dialect === "st") item.note = t("Made with /qr-create from a SillyTavern-mode script (an imported QR, etc.).", "실리태번 기준 스크립트(가져온 QR 등)에서 /qr-create로 만든 QR이에요.");
        apply(item, info);
        set.items.push(item);
      }),
      update: (ref2, changes) => {
        try {
          withItem(ref2, (item) => {
            apply(item, changes);
            if (changes.newLabel) item.label = changes.newLabel;
          });
          return true;
        } catch {
          return false;
        }
      },
      remove: (ref2) => {
        let found = false;
        store.update((st) => {
          const hit = findIn(st, ref2);
          if (!hit) return;
          hit.set.items = hit.set.items.filter((i) => i !== hit.item);
          found = true;
        });
        return found;
      },
      createSet: (name, options) => store.update((st) => {
        for (const old of st.sets.filter((s) => s.name === name)) forgetSet(st, old.id);
        st.sets = st.sets.filter((s) => s.name !== name);
        const set = newSet(name);
        setOptions2(set, options);
        st.sets.push(set);
      }),
      updateSet: (name, options) => {
        let found = false;
        store.update((st) => {
          const set = findSet(st, name);
          if (!set) return;
          found = true;
          setOptions2(set, options);
        });
        return found;
      },
      removeSet: (name) => {
        let found = false;
        store.update((st) => {
          for (const old of st.sets.filter((s) => s.name === name)) forgetSet(st, old.id);
          const before = st.sets.length;
          st.sets = st.sets.filter((s) => s.name !== name);
          found = st.sets.length !== before;
        });
        return found;
      },
      setEnabled: (name, state) => {
        let result = false;
        store.update((st) => {
          const set = findSet(st, name);
          if (!set) return;
          set.enabled = state ?? !set.enabled;
          result = set.enabled;
          if (result) addToBar(st, { kind: "set", setId: set.id });
          else removeFromBar(st, { kind: "set", setId: set.id });
        });
        return result;
      },
      setForChat: (name, state) => {
        const chat = scope().chatId;
        if (!chat) throw new Error("No chat is open");
        let result = false;
        store.update((st) => {
          const set = findSet(st, name);
          if (!set) throw new Error(`No QR set "${name}"`);
          result = state ?? !isOnForChat(st, set.id, chat);
          setForChat(st, chat, set.id, result);
        });
        return result;
      },
      setDisplay: (name, display) => {
        let found = false;
        store.update((st) => {
          const set = findSet(st, name);
          if (!set) return;
          found = true;
          set.display = display;
          setLayout(st, set.id, display === "inline" ? "row" : "folder");
        });
        return found;
      },
      contextAdd: (ref2, name, chained) => withItem(ref2, (item, st) => {
        const target = findSet(st, name);
        if (!target) throw new Error(`No QR set "${name}"`);
        const links = (item.contextList ?? []).filter((l) => l.setId !== target.id);
        links.push(chained ? { setId: target.id, chained: true } : { setId: target.id });
        item.contextList = links;
      }),
      contextDel: (ref2, name) => withItem(ref2, (item, st) => {
        const ids = st.sets.filter((s) => s.name === name).map((s) => s.id);
        item.contextList = (item.contextList ?? []).filter((l) => !ids.includes(l.setId));
        if (!item.contextList.length) delete item.contextList;
      }),
      contextClear: (ref2) => withItem(ref2, (item) => delete item.contextList),
      barVisible: (state) => {
        let result = true;
        store.update((st) => {
          st.barVisible = state ?? !st.barVisible;
          result = st.barVisible;
        });
        return result;
      },
      // SillyTavern's /qr counts the QRs of the sets on here (with or without buttons)
      visible: () => activeSets(store.value, scope()).flatMap((s) => s.items.filter((i) => !i.hidden).map((i) => ({ set: s.name, label: i.label }))),
      runLater: (name, delayMs) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          const found = findItem(store.value, name);
          if (found) void runner().run(found.set, found.item, { auto: true });
        }, delayMs);
        timers.add(timer);
      },
      run: async (name) => {
        const found = findItem(store.value, name);
        if (!found) throw new Error(`No Quick Reply named "${name}"`);
        await runner().runNested(found.set, found.item);
      },
      source: (name) => {
        const found = findItem(store.value, name);
        return found ? { script: found.item.script, dialect: found.item.dialect, label: found.item.label, setName: found.set.name } : void 0;
      },
      dispose: () => {
        for (const t2 of timers) clearTimeout(t2);
        timers.clear();
      }
    };
  }

  // src/stscript/variables.ts
  function readVar(store, name, index) {
    let value = store.get(name);
    if (index !== void 0 && index !== "") {
      try {
        const container = JSON.parse(String(value));
        const n = Number(index);
        value = Number.isNaN(n) ? container[index] : container[n];
        if (typeof value === "object" && value !== null) value = JSON.stringify(value);
      } catch {
      }
    }
    if (value === void 0 || value === null) return "";
    const text7 = String(value);
    if (text7.trim() === "" || Number.isNaN(Number(text7))) return text7;
    return Number(text7);
  }
  function writeVar(store, name, value, index, as) {
    if (!name) throw new Error("Variable name cannot be empty.");
    if (index !== void 0 && index !== "") {
      let container = null;
      try {
        container = JSON.parse(store.get(name) ?? "null");
      } catch {
        container = null;
      }
      const n = Number(index);
      if (Number.isNaN(n)) {
        const obj = container && typeof container === "object" ? container : {};
        obj[index] = convertType(value, as);
        store.set(name, JSON.stringify(obj));
      } else {
        const arr = Array.isArray(container) ? container : [];
        arr[n] = convertType(value, as);
        store.set(name, JSON.stringify(arr));
      }
    } else {
      store.set(name, String(value));
    }
    return value;
  }
  function addVar(store, name, value) {
    const current = readVar(store, name) || 0;
    try {
      const parsed = JSON.parse(String(current));
      if (Array.isArray(parsed)) {
        parsed.push(value);
        store.set(name, JSON.stringify(parsed));
        return JSON.stringify(parsed);
      }
    } catch {
    }
    const increment = Number(value);
    if (Number.isNaN(increment) || Number.isNaN(Number(current))) {
      const text7 = String(current || "") + String(value);
      store.set(name, text7);
      return text7;
    }
    const next = Number(current) + increment;
    if (Number.isNaN(next)) return "";
    store.set(name, String(next));
    return next;
  }
  function convertType(value, as) {
    if (!as) return value;
    const text7 = String(value);
    switch (as.toLowerCase()) {
      case "number":
      case "int":
      case "float":
        return Number(text7);
      case "bool":
      case "boolean":
        return ["true", "on", "1"].includes(text7.toLowerCase());
      case "array":
      case "object":
      case "list":
      case "dictionary":
      case "json":
        try {
          return JSON.parse(text7);
        } catch {
          return text7;
        }
      case "null":
        return null;
      case "string":
      default:
        return text7;
    }
  }

  // src/stscript/macros.ts
  var pad = (n) => String(n).padStart(2, "0");
  function variableReplacers(ctx, includeGetters) {
    const { local, global } = ctx;
    const list = [
      [/\{\{setvar::([^:]+)::([^}]*)\}\}/gi, (_, n, v) => (writeVar(local, n.trim(), v), "")],
      [/\{\{addvar::([^:]+)::([^}]+)\}\}/gi, (_, n, v) => (addVar(local, n.trim(), v), "")],
      [/\{\{incvar::([^}]+)\}\}/gi, (_, n) => String(addVar(local, n.trim(), 1))],
      [/\{\{decvar::([^}]+)\}\}/gi, (_, n) => String(addVar(local, n.trim(), -1))],
      [/\{\{setglobalvar::([^:]+)::([^}]*)\}\}/gi, (_, n, v) => (writeVar(global, n.trim(), v), "")],
      [/\{\{addglobalvar::([^:]+)::([^}]+)\}\}/gi, (_, n, v) => (addVar(global, n.trim(), v), "")],
      [/\{\{incglobalvar::([^}]+)\}\}/gi, (_, n) => String(addVar(global, n.trim(), 1))],
      [/\{\{decglobalvar::([^}]+)\}\}/gi, (_, n) => String(addVar(global, n.trim(), -1))]
    ];
    if (includeGetters) list.push(...getterReplacers(ctx));
    return list;
  }
  function getterReplacers(ctx) {
    return [
      [/\{\{getvar::([^}]+)\}\}/gi, (_, n) => String(readVar(ctx.local, n.trim()))],
      [/\{\{getglobalvar::([^}]+)\}\}/gi, (_, n) => String(readVar(ctx.global, n.trim()))]
    ];
  }
  function contextReplacers(ctx) {
    const f = () => ctx.facts();
    const now = () => /* @__PURE__ */ new Date();
    return [
      [/\{\{\/\/[\s\S]*?\}\}/g, () => ""],
      [/\{\{noop\}\}/gi, () => ""],
      [/\{\{newline\}\}/gi, () => "\n"],
      [/\{\{user\}\}/gi, () => f().user],
      [/\{\{char\}\}/gi, () => f().char],
      [/\{\{charName\}\}/g, () => f().char],
      [/\{\{userName\}\}/g, () => f().user],
      [/\{\{group\}\}/gi, () => f().group],
      [/\{\{input\}\}/gi, () => f().input],
      [/\{\{lastMessage\}\}/gi, () => f().lastMessage],
      [/\{\{lastMessageId\}\}/gi, () => f().lastMessageId],
      [/\{\{lastCharMessage\}\}/gi, () => f().lastCharMessage],
      [/\{\{lastUserMessage\}\}/gi, () => f().lastUserMessage],
      [/\{\{model\}\}/gi, () => f().model],
      [/\{\{idle_duration\}\}/gi, () => f().idleDuration],
      [/\{\{time\}\}/gi, () => `${pad(now().getHours())}:${pad(now().getMinutes())}`],
      [/\{\{date\}\}/gi, () => `${now().getFullYear()}-${pad(now().getMonth() + 1)}-${pad(now().getDate())}`],
      [/\{\{isodate\}\}/gi, () => now().toISOString().slice(0, 10)],
      [/\{\{isotime\}\}/gi, () => now().toISOString().slice(11, 19)],
      [/\{\{weekday\}\}/gi, () => now().toLocaleDateString(void 0, { weekday: "long" })],
      [/\{\{roll[ :]([^}]+)\}\}/gi, (_, formula) => String(rollDice(formula))],
      [/\{\{random\}\}/gi, () => String(Math.floor(Math.random() * 101))],
      [/\{\{random:(-?\d+):(-?\d+)\}\}/gi, (_, a, b) => String(randomInt(Number(a), Number(b)))],
      [/\{\{random::([^}]+)\}\}/gi, (_, list) => pickOne(list.split("::"))],
      [/\{\{random:([^}]+)\}\}/gi, (_, list) => pickOne(list.split(","))],
      [/\{\{pick::([^}]+)\}\}/gi, (_, list) => pickOne(list.split("::"))],
      [/\{\{reverse:(.+?)\}\}/gi, (_, text7) => [...text7].reverse().join("")],
      [/\{\{trim\}\}/gi, () => "\0TRIM\0"]
    ];
  }
  function applyAll(text7, replacers) {
    let out = text7;
    for (const [re, fn] of replacers) {
      if (!out.includes("{{")) break;
      out = out.replace(re, fn);
    }
    return out;
  }
  function applyTrim(text7) {
    return text7.replace(/\s*\u0000TRIM\u0000\s*/g, "");
  }
  async function substituteGlobal(text7, ctx, options = {}) {
    if (!text7.includes("{{")) return text7;
    let out = applyAll(text7, variableReplacers(ctx, !options.replaceGetvar));
    out = applyAll(out, contextReplacers(ctx));
    if (options.hostMacros !== false && ctx.resolveHostMacros && /\{\{(?!\s*(?:getvar|getglobalvar)::)/.test(out)) {
      out = await ctx.resolveHostMacros(out);
    }
    if (options.replaceGetvar) out = applyAll(out, getterReplacers(ctx));
    return applyTrim(out);
  }
  function randomInt(a, b) {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  function pickOne(options) {
    return options.length ? options[Math.floor(Math.random() * options.length)].trim() : "";
  }
  function rollDice(formula) {
    const f = formula.trim().toLowerCase().replace(/\s+/g, "");
    const m2 = /^(\d*)d(\d+)([+-]\d+)?$/.exec(f);
    if (!m2) {
      const n = Number(f);
      return Number.isNaN(n) ? 0 : n;
    }
    const count = Math.min(Number(m2[1] || 1), 1e3);
    const sides = Number(m2[2]);
    let total = Number(m2[3] || 0);
    for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * Math.max(1, sides));
    return total;
  }

  // src/stscript/scope.ts
  var isClosureValue = (v) => typeof v === "object" && v !== null && v.kind === "closure-value";
  var ScriptError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "ScriptError";
    }
  };
  var Scope = class {
    constructor(parent = null) {
      this.parent = parent;
    }
    pipe = "";
    vars = /* @__PURE__ */ new Map();
    macros = /* @__PURE__ */ new Map();
    has(name) {
      return this.vars.has(name) || (this.parent?.has(name) ?? false);
    }
    let(name, value) {
      if (this.vars.has(name)) throw new ScriptError(`Variable "${name}" is already declared in this scope`);
      this.vars.set(name, value);
    }
    set(name, value, index) {
      const owner = this.owner(name);
      if (!owner) throw new ScriptError(`No such scoped variable: "${name}" (declare it with /let first)`);
      if (index !== void 0 && index !== "") {
        const current = owner.vars.get(name);
        const parsed = parseJsonContainer(typeof current === "string" ? current : "", index);
        parsed[indexKey(index)] = value;
        owner.vars.set(name, JSON.stringify(parsed));
      } else {
        owner.vars.set(name, value);
      }
      return value;
    }
    get(name, index) {
      const owner = this.owner(name);
      if (!owner) throw new ScriptError(`No such scoped variable: "${name}"`);
      const value = owner.vars.get(name) ?? "";
      if (index === void 0 || index === "" || typeof value !== "string") return value;
      try {
        const item = JSON.parse(value)[indexKey(index)];
        return typeof item === "object" ? JSON.stringify(item) : String(item ?? "");
      } catch {
        return "";
      }
    }
    setMacro(name, value) {
      this.macros.set(name, value);
    }
    getMacro(name) {
      return this.macros.get(name) ?? this.parent?.getMacro(name);
    }
    macroNames() {
      const names = new Set(this.parent?.macroNames() ?? []);
      for (const key2 of this.macros.keys()) names.add(key2);
      return [...names];
    }
    /** This scope's own variables (for the debugger). */
    ownVars() {
      return [...this.vars.entries()];
    }
    owner(name) {
      if (this.vars.has(name)) return this;
      return this.parent?.owner(name) ?? null;
    }
  };
  function indexKey(index) {
    const n = Number(index);
    return Number.isNaN(n) ? index : n;
  }
  function parseJsonContainer(text7, index) {
    try {
      const parsed = JSON.parse(text7);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
    }
    return Number.isNaN(Number(index)) ? {} : [];
  }

  // src/stscript/interpreter.ts
  var AbortScript = class extends Error {
    constructor(reason, quiet) {
      super(reason || "Script aborted");
      this.reason = reason;
      this.quiet = quiet;
      this.name = "AbortScript";
    }
  };
  var Runtime = class {
    host;
    registry;
    dialect;
    findScript;
    signal;
    depth = 0;
    maxDepth;
    source;
    debug;
    sources = /* @__PURE__ */ new WeakMap();
    frames = [];
    constructor(options) {
      this.host = options.host;
      this.registry = options.registry;
      this.dialect = options.dialect;
      this.findScript = options.findScript;
      this.signal = options.signal;
      this.maxDepth = options.maxDepth ?? 64;
      this.source = options.source;
      this.debug = options.debug;
    }
    /** Remembers which text a closure (and the closures in it) came from. */
    tagSource(closure, source) {
      if (!this.debug) return;
      const walk = (c) => {
        this.sources.set(c, source);
        for (const a of c.args) if (typeof a.value !== "string") walk(a.value);
        for (const ex of c.executors) {
          if (ex.kind !== "command") continue;
          for (const a of ex.named) if (typeof a.value !== "string") walk(a.value);
          for (const u of ex.unnamed) if (typeof u.value !== "string") walk(u.value);
        }
      };
      walk(closure);
    }
    /** Message index written in the script → Marinara's 1-based number. */
    toMarinaraNumber(index) {
      return this.dialect === "st" ? index + 1 : index;
    }
    /** Marinara's 1-based number → index as the script expects it. */
    fromMarinaraNumber(n) {
      return this.dialect === "st" ? n - 1 : n;
    }
    parse(text7, flags) {
      return parse(text7, { flags, lookup: (name) => this.registry.get(name) });
    }
    /** Run a whole script. Never throws for /abort; returns aborted instead. */
    async runScript(text7, scope) {
      let closure;
      try {
        closure = this.parse(text7);
      } catch (e) {
        if (e instanceof ParseError) throw new ScriptError(`Parse error at ${e.index}: ${e.message}`);
        throw e;
      }
      this.tagSource(closure, this.source && this.source.text === text7 ? this.source : { label: this.source?.label ?? t("Script", "스크립트"), text: text7 });
      await this.host.beginRun?.();
      const fresh = !scope;
      if (!scope) {
        scope = new Scope();
        scope.setMacro("arg::*", "");
      }
      const root = { kind: "closure-value", closure, scope, flags: closure.executors[0]?.kind === "command" ? closure.executors[0].flags : defaultFlags() };
      try {
        const result = await this.runClosure(root, [], { broken: false }, fresh ? root.scope : void 0);
        return result;
      } catch (e) {
        if (e instanceof AbortScript) return { pipe: "", aborted: true, abortReason: e.reason, isBreak: false };
        throw e;
      } finally {
        await this.host.flush();
      }
    }
    /**
     * Execute a closure. `frame` is shared with the caller for inline bodies so
     * /break propagates to the enclosing loop. `useScope` runs in an existing
     * scope instead of a fresh child (used for the root script).
     */
    async runClosure(cv, provided = [], frame = { broken: false }, useScope) {
      if (++this.depth > this.maxDepth) {
        this.depth--;
        throw new ScriptError("Too much recursion (closure nesting exceeded the limit)");
      }
      const scope = useScope ?? new Scope(cv.scope);
      const source = this.sources.get(cv.closure) ?? null;
      if (this.debug) this.frames.push({ label: source?.label ?? this.frames[this.frames.length - 1]?.label ?? t("Script", "스크립트"), source, scope });
      try {
        for (const arg of cv.closure.args) {
          const v = await this.resolveValue(arg.value, scope, frame, cv.flags);
          scope.let(arg.name, v);
        }
        for (const p of provided) {
          if (scope.has(p.name)) scope.set(p.name, p.value);
          else scope.let(p.name, p.value);
        }
        if (cv.closure.executors.length === 0) scope.pipe = "";
        let isFirst = true;
        for (const ex of cv.closure.executors) {
          this.checkAbort();
          if (frame.broken) break;
          await this.runExecutor(ex, scope, frame, isFirst);
          isFirst = false;
        }
        return { pipe: scope.pipe, aborted: false, isBreak: frame.broken };
      } finally {
        this.depth--;
        if (this.debug) this.frames.pop();
      }
    }
    checkAbort() {
      if (this.signal?.aborted) throw new AbortScript("Stopped by user", false);
    }
    async runExecutor(ex, scope, frame, isFirst) {
      if (ex.kind === "break") {
        const value = await this.resolveUnnamed(ex.unnamed, scope, frame, defaultFlags(), false);
        if (ex.unnamed.length > 0) scope.pipe = value;
        frame.broken = true;
        return;
      }
      const def = this.registry.get(ex.name);
      if (!def) throw new ScriptError(`Unknown command /${ex.name}`);
      const named = {};
      for (const arg of ex.named) {
        named[arg.name] = await this.resolveValue(arg.value, scope, frame, ex.flags);
      }
      let unnamed;
      let hasUnnamed = ex.unnamed.length > 0;
      if (!hasUnnamed) {
        if (!isFirst && ex.injectPipe) {
          unnamed = scope.pipe;
          hasUnnamed = true;
        } else {
          unnamed = "";
        }
      } else {
        unnamed = await this.resolveUnnamed(ex.unnamed, scope, frame, ex.flags, def.split ?? false);
      }
      if (def.split && !Array.isArray(unnamed)) unnamed = unnamed === "" && !hasUnnamed ? [] : [unnamed];
      await this.host.refreshFacts();
      if (this.debug) {
        const top = this.frames[this.frames.length - 1];
        if (top) top.node = ex;
        await this.debug.beforeCommand({ node: ex, source: top?.source ?? null, scope, depth: this.depth, named, unnamed, stack: this.frames.map((f) => ({ ...f })) });
        this.checkAbort();
      }
      const result = await def.run({ rt: this, node: ex, named, unnamed, hasUnnamed, scope, frame });
      scope.pipe = normalizePipe(result);
    }
    async resolveValue(value, scope, frame, flags) {
      if (typeof value !== "string") {
        const cv = { kind: "closure-value", closure: value, scope, flags };
        if (value.executeNow) return (await this.runClosure(cv, [], frame)).pipe;
        return cv;
      }
      return this.substitute(value, scope, flags);
    }
    async resolveUnnamed(list, scope, frame, flags, split2) {
      const values = [];
      for (const item of list) values.push(await this.resolveValue(item.value, scope, frame, flags));
      if (split2) return values;
      if (values.length === 1) return values[0];
      if (values.some(isClosureValue)) return values.find(isClosureValue);
      return values.join("");
    }
    /** Scoped macros ({{pipe}}, {{var::}}, {{timesIndex}}) then the global pass. */
    async substitute(text7, scope, flags = defaultFlags()) {
      if (!text7.includes("{{")) return unescapeBraces(text7);
      const scopedNames = scope.macroNames().map(escapeRegex);
      const re = new RegExp(
        `\\{\\{pipe\\}\\}|\\{\\{var::([^\\s}]+?)(?:::((?:(?!\\}\\}).)+))?\\}\\}${scopedNames.length ? `|\\{\\{(${scopedNames.join("|")})\\}\\}` : ""}|\\{\\{arg::([^}]+?)\\}\\}`
      );
      let out = "";
      let rest = text7;
      for (; ; ) {
        const m2 = re.exec(rest);
        if (!m2) break;
        const before = rest.slice(0, m2.index);
        let value;
        if (m2[0] === "{{pipe}}") value = scope.pipe;
        else if (m2[1] !== void 0) value = scope.get(m2[1], m2[2]);
        else if (m2[3] !== void 0) value = scope.getMacro(m2[3]) ?? "";
        else value = scope.getMacro(`arg::${m2[4]}`) ?? scope.getMacro("arg::*") ?? m2[0];
        if (isClosureValue(value)) {
          if (before.trim() === "" && rest.slice(m2.index + m2[0].length).trim() === "" && out === "") return value;
          value = "[closure]";
        }
        out += await this.global(before, flags) + value;
        rest = rest.slice(m2.index + m2[0].length);
      }
      out += await this.global(rest, flags);
      return unescapeBraces(out);
    }
    global(text7, flags) {
      return substituteGlobal(
        text7,
        {
          local: this.host.local,
          global: this.host.global,
          facts: () => {
            const f = this.host.facts();
            return this.dialect === "st" ? { ...f, lastMessageId: String(Math.max(0, Number(f.lastMessageId) - 1)) } : f;
          },
          resolveHostMacros: this.host.resolveHostMacros?.bind(this.host)
        },
        { replaceGetvar: flags.REPLACE_GETVAR }
      );
    }
    /** Run a string of commands (quoted /if bodies, /run of a QR, ...). */
    async runSubcommands(text7, scope, flags, frame) {
      let body = text7;
      if (body.startsWith('"') && body.endsWith('"')) body = body.slice(1, -1);
      const closure = this.parse(body, flags);
      const cv = { kind: "closure-value", closure, scope, flags };
      return this.runClosure(cv, [], frame ?? { broken: false });
    }
    /** Execute a command body that may be a closure or a string of commands. */
    async runBody(body, call, inheritFrame, macros) {
      const frame = inheritFrame ? call.frame : { broken: false };
      if (isClosureValue(body)) {
        if (macros) {
          const scope = new Scope(body.scope);
          for (const [k, v] of Object.entries(macros)) scope.setMacro(k, v);
          return this.runClosure({ ...body, scope }, [], frame);
        }
        return this.runClosure(body, [], frame);
      }
      let text7 = body;
      if (macros) for (const [k, v] of Object.entries(macros)) text7 = text7.split(`{{${k}}}`).join(v);
      return this.runSubcommands(text7, call.scope, call.node.flags, frame);
    }
    /** /run and /: — a closure value, a scoped closure variable, or a Quick Reply. */
    async runNamed(target, provided, call) {
      if (isClosureValue(target)) return (await this.runClosure(target, provided)).pipe;
      const name = target.trim();
      if (call.scope.has(name)) {
        const v = call.scope.get(name);
        if (isClosureValue(v)) return (await this.runClosure(v, provided)).pipe;
      }
      const source = this.findScript?.(name);
      if (!source) throw new ScriptError(`No Quick Reply or closure named "${name}"`);
      const previous = this.dialect;
      this.dialect = source.dialect;
      try {
        const closure = this.parse(source.script);
        this.tagSource(closure, { label: `${source.setName}.${source.label}`, text: source.script });
        const scope = new Scope(call.scope);
        for (const p of provided) scope.setMacro(`arg::${p.name}`, isClosureValue(p.value) ? "[closure]" : p.value);
        scope.setMacro("arg::*", "");
        const cv = { kind: "closure-value", closure, scope, flags: call.node.flags };
        return (await this.runClosure(cv, provided)).pipe;
      } finally {
        this.dialect = previous;
      }
    }
    getCommand(name) {
      return this.registry.get(name);
    }
  };
  function normalizePipe(result) {
    if (result === void 0 || result === null) return "";
    if (typeof result === "string" || isClosureValue(result)) return result;
    if (typeof result === "number" || typeof result === "boolean") return String(result);
    return JSON.stringify(result) ?? "";
  }
  function unescapeBraces(text7) {
    return text7.replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  }
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function defaultFlags() {
    return { STRICT_ESCAPING: false, REPLACE_GETVAR: false };
  }
  function asText(v) {
    if (v === void 0) return "";
    if (Array.isArray(v)) return v.map((x) => asText(x)).join(" ");
    return isClosureValue(v) ? "[closure]" : v;
  }

  // src/qr/runner.ts
  var QrRunner = class {
    constructor(host, registry, state, events = {}) {
      this.host = host;
      this.registry = registry;
      this.state = state;
      this.events = events;
    }
    controller = null;
    current = null;
    /** Auto-runs under way (they run alongside a QR started by hand). */
    autoRuns = /* @__PURE__ */ new Set();
    get busy() {
      return this.controller !== null;
    }
    get running() {
      return this.current;
    }
    /** Stops the QR started by hand and every auto-run. */
    stop() {
      this.controller?.abort();
      for (const c of this.autoRuns) c.abort();
    }
    async run(set, item, options = {}) {
      if (options.auto) {
        const controller2 = new AbortController();
        this.autoRuns.add(controller2);
        try {
          await this.execute(set, item, controller2, true);
        } finally {
          this.autoRuns.delete(controller2);
        }
        return;
      }
      if (this.controller) {
        this.host.ui.toast(t("Another QR is running. Try again when it's done.", "다른 QR이 실행 중이에요. 끝난 뒤 다시 눌러 주세요."), "warning");
        return;
      }
      const controller = new AbortController();
      this.controller = controller;
      this.current = item;
      this.events.onStart?.(item);
      try {
        await this.execute(set, item, controller, false);
      } finally {
        this.controller = null;
        this.current = null;
        this.events.onEnd?.(item);
      }
    }
    async execute(set, item, controller, auto) {
      try {
        const script = item.script;
        if (item.kind === "viz") {
          if (this.host.wand?.runQr) await this.host.wand.runQr(set, item);
          else this.host.ui.toast(t("🌟 QRs run with Dispensa's Visualizer.", "🌟 QR은 Dispensa의 비주얼라이저로 실행해요."), "warning");
        } else if (script.trimStart().startsWith("/")) {
          const rt = new Runtime({
            host: this.host,
            registry: this.registry,
            dialect: item.dialect,
            signal: controller.signal,
            findScript: (name) => {
              const found = findItem(this.state(), name);
              return found ? sourceOf(found.set, found.item) : void 0;
            },
            source: { label: `${set.name}.${item.label}`, text: script }
          });
          const result = await rt.runScript(script);
          if (result.aborted && result.abortReason && result.abortReason !== "Stopped by user") {
            this.host.ui.toast(result.abortReason, "info");
          }
        } else {
          await this.sendPlain(set, script, item, auto);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.host.ui.toast(message, "error", { title: t(`QR "${item.label}" failed`, `QR "${item.label}" 실행 실패`) });
        if (!(e instanceof ScriptError)) console.error("[Dispensa]", e);
      }
    }
    /**
     * Run from the QR editor: the result comes back (the pipe, or the error
     * thrown), optionally stopping in the debugger.
     */
    async runInEditor(set, item, options) {
      if (item.kind === "viz") {
        await this.host.wand?.runQr?.(set, item);
        return { pipe: "" };
      }
      if (!item.script.trimStart().startsWith("/")) {
        await this.sendPlain(set, item.script, item);
        return { pipe: "" };
      }
      const rt = new Runtime({
        host: this.host,
        registry: this.registry,
        dialect: item.dialect,
        signal: options.signal,
        debug: options.debug,
        findScript: (name) => {
          const found = findItem(this.state(), name);
          return found ? sourceOf(found.set, found.item) : void 0;
        },
        source: { label: `${set.name}.${item.label}`, text: item.script }
      });
      const result = await rt.runScript(item.script);
      return { pipe: asText(result.pipe), aborted: result.aborted ? result.abortReason || t("Stopped", "중단됨") : void 0 };
    }
    /** Run a QR from inside another running QR (/qr). Shares the stop button. */
    async runNested(set, item) {
      if (item.kind === "viz") {
        await this.host.wand?.runQr?.(set, item);
        return;
      }
      if (!item.script.trimStart().startsWith("/")) {
        await this.sendPlain(set, item.script, item);
        return;
      }
      const rt = new Runtime({
        host: this.host,
        registry: this.registry,
        dialect: item.dialect,
        signal: this.controller?.signal,
        findScript: (name) => {
          const found = findItem(this.state(), name);
          return found ? sourceOf(found.set, found.item) : void 0;
        }
      });
      await rt.runScript(item.script);
    }
    /** SillyTavern: a QR without a leading "/" is text for the chat input (an auto-run sends it as is). */
    async sendPlain(set, text7, item, auto = false) {
      const rt = new Runtime({ host: this.host, registry: this.registry, dialect: item.dialect });
      await this.host.beginRun?.();
      const resolved2 = String(await rt.substitute(text7, new Scope()));
      const current = auto ? "" : this.host.ui.getInput();
      const line = set.injectInput && current ? set.placeBeforeInput ? `${resolved2} ${current}` : `${current} ${resolved2}` : resolved2;
      if (set.disableSend) {
        this.host.ui.setInput(line);
        return;
      }
      if (set.injectInput && current) this.host.ui.setInput("");
      await submitThroughComposer(line);
    }
  };
  function sourceOf(set, item) {
    const script = item.kind === "viz" ? `/visz ${item.label.replace(/[|\\]/g, (c) => `\\${c}`)}` : item.script;
    return { script, dialect: item.kind === "viz" ? "marinara" : item.dialect, label: item.label, setName: set.name };
  }

  // src/qr/store.ts
  var KEY2 = "qr";
  var SOFT_LIMIT = 9e5;
  var QrStore = class {
    state = emptyState();
    listeners = /* @__PURE__ */ new Set();
    saveTimer = null;
    loadedOk = false;
    /** Loaded from storage (writes are safe). */
    get ready() {
      return this.loadedOk;
    }
    get value() {
      return this.state;
    }
    async load() {
      try {
        const stored = await getMarinara().storage.get();
        this.state = normalizeState(stored[KEY2]);
        this.loadedOk = true;
      } catch (e) {
        this.loadedOk = false;
        throw e;
      }
      this.emit();
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    update(mutate) {
      mutate(this.state);
      this.emit();
      this.scheduleSave();
    }
    /** Size of the saved data in bytes, to warn before Marinara's limit. */
    size() {
      return new TextEncoder().encode(JSON.stringify(this.state)).length;
    }
    overLimit() {
      return this.size() > SOFT_LIMIT;
    }
    async saveNow() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = null;
      if (!this.loadedOk) return;
      await getMarinara().storage.patch({ [KEY2]: this.state });
    }
    scheduleSave() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        void this.saveNow().catch((e) => console.error("[Dispensa] save failed", e));
      }, 400);
    }
    emit() {
      for (const fn of this.listeners) fn(this.state);
    }
  };

  // src/stscript/commands/chat.ts
  var text = (c) => asText(c.unnamed);
  var str = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var flag = (c, key2, fallback = false) => {
    const v = str(c, key2);
    if (v === void 0 || v === "") return fallback;
    return isTrue(v) || !isFalse(v) && fallback;
  };
  function parseJsonList(c, raw) {
    if (raw === void 0) return void 0;
    const source = c.rt.host.local.has(raw) ? c.rt.host.local.get(raw) : c.rt.host.global.has(raw) ? c.rt.host.global.get(raw) : raw;
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
    }
    return void 0;
  }
  function parseRange(c, raw) {
    const out = [];
    for (const piece of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
      const m2 = /^(-?\d+)\s*(?:-\s*(-?\d+))?$/.exec(piece);
      if (!m2) throw new ScriptError(`Invalid message range "${piece}"`);
      const a = Number(m2[1]);
      const b = m2[2] !== void 0 ? Number(m2[2]) : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(c.rt.toMarinaraNumber(i));
    }
    return out.filter((n) => n >= 1);
  }
  function atArg(c) {
    const raw = str(c, "at");
    if (raw === void 0 || raw === "") return void 0;
    const n = Number(raw);
    if (Number.isNaN(n)) return void 0;
    return c.rt.toMarinaraNumber(n);
  }
  async function native(c, command, args) {
    await c.rt.host.chat.requireChat();
    await c.rt.host.chat.runNativeCommand(`/${command}${args ? ` ${args}` : ""}`);
    return "";
  }
  function passThrough(name, aliases, help) {
    return {
      name,
      aliases,
      help,
      rawQuotes: true,
      origin: "marinara",
      run: (c) => native(c, name, text(c))
    };
  }
  var chatCommands = [
    // ── talking to the user ──
    {
      name: "echo",
      rawQuotes: true,
      help: "Show a toast: /echo [severity=info|success|warning|error] [title=] text",
      origin: "st",
      run: (c) => {
        const message = text(c);
        const severity = str(c, "severity") ?? "info";
        c.rt.host.ui.toast(message, ["info", "success", "warning", "error"].includes(severity) ? severity : "info", { title: str(c, "title") });
        return message;
      }
    },
    {
      name: "popup",
      help: "Show a blocking popup (simple HTML allowed).",
      origin: "st",
      run: async (c) => {
        const ok = await c.rt.host.ui.popup(text(c), {
          large: flag(c, "large"),
          wide: flag(c, "wide"),
          okButton: str(c, "okButton"),
          cancelButton: str(c, "cancelButton")
        });
        return ok ? text(c) : "";
      }
    },
    {
      name: "input",
      help: "Ask for text: /input [default=] [placeholder=] [rows=] prompt",
      origin: "st",
      run: async (c) => {
        const answer = await c.rt.host.ui.input(text(c), {
          defaultValue: str(c, "default"),
          placeholder: str(c, "placeholder"),
          rows: Number(str(c, "rows") ?? "1") || 1,
          large: flag(c, "large"),
          wide: flag(c, "wide"),
          okButton: str(c, "okButton"),
          cancelButton: str(c, "cancelButton"),
          multiline: flag(c, "multiline")
        });
        return answer ?? "";
      }
    },
    {
      name: "buttons",
      help: 'Ask with buttons: /buttons labels=["a","b"] text → clicked label, "" when cancelled',
      origin: "st",
      run: async (c) => {
        const labels = parseJsonList(c, str(c, "labels"));
        if (!labels || labels.length === 0) throw new ScriptError('/buttons needs labels=["a","b"]');
        return c.rt.host.ui.buttons(text(c), labels, { multiple: flag(c, "multiple") });
      }
    },
    {
      name: "setinput",
      help: "Replace the chat input text.",
      origin: "st",
      run: (c) => {
        c.rt.host.ui.setInput(text(c));
        return text(c);
      }
    },
    { name: "beep", aliases: ["ding"], help: "Play a notification sound.", origin: "st", run: (c) => (c.rt.host.ui.beep(), "") },
    { name: "loader-show", help: "Show a loading overlay.", origin: "st", run: (c) => (c.rt.host.ui.loader("show", text(c)), "") },
    { name: "loader-hide", aliases: ["loader-stop"], help: "Hide the loading overlay.", origin: "st", run: (c) => (c.rt.host.ui.loader("hide"), "") },
    {
      name: "loader-wrap",
      help: "Show a loader while running a closure.",
      origin: "st",
      run: async (c) => {
        c.rt.host.ui.loader("show", str(c, "text") ?? "");
        try {
          return (await c.rt.runBody(Array.isArray(c.unnamed) ? c.unnamed[0] ?? "" : c.unnamed, c, true)).pipe;
        } finally {
          c.rt.host.ui.loader("hide");
        }
      }
    },
    // ── generation ──
    {
      name: "gen",
      help: "Generate with the chat's context (nothing is posted). Result goes to the pipe.",
      origin: "st",
      run: async (c) => {
        await c.rt.host.chat.requireChat();
        const lock = flag(c, "lock");
        if (lock) c.rt.host.ui.loader("show", "");
        try {
          return await c.rt.host.chat.generate({
            mode: "chat",
            prompt: text(c),
            lock,
            stop: parseJsonList(c, str(c, "stop")),
            characterName: str(c, "name")
          });
        } finally {
          if (lock) c.rt.host.ui.loader("hide");
        }
      }
    },
    {
      name: "genraw",
      help: "Generate from the prompt alone (no character or chat). Result goes to the pipe.",
      origin: "st",
      run: async (c) => {
        const lock = flag(c, "lock");
        if (lock) c.rt.host.ui.loader("show", "");
        try {
          return await c.rt.host.chat.generate({
            mode: "raw",
            prompt: text(c),
            lock,
            stop: parseJsonList(c, str(c, "stop")),
            as: str(c, "as") === "char" ? "char" : "system"
          });
        } finally {
          if (lock) c.rt.host.ui.loader("hide");
        }
      }
    },
    {
      name: "ask",
      help: "Generate as another character: /ask name=Alice prompt",
      origin: "st",
      run: async (c) => {
        const name = str(c, "name");
        if (!name) throw new ScriptError("/ask needs name=");
        return c.rt.host.chat.generate({ mode: "chat", prompt: text(c), characterName: name });
      }
    },
    {
      name: "trigger",
      help: "Start a normal reply (optionally for one group member).",
      origin: "st",
      run: async (c) => {
        await c.rt.host.chat.trigger(text(c).trim() || void 0);
        return "";
      }
    },
    { name: "continue", aliases: ["cont"], help: "Continue the last reply.", origin: "st", run: async (c) => (await c.rt.host.chat.continueLast(), "") },
    { name: "regenerate", aliases: ["swipe"], help: "Regenerate the last reply.", origin: "st", run: async (c) => (await c.rt.host.chat.regenerate(), "") },
    { name: "addswipe", help: "Add a swipe to the last character message.", origin: "st", run: async (c) => (await c.rt.host.chat.addSwipe(text(c)), "") },
    // ── posting ──
    {
      name: "sendas",
      rawQuotes: true,
      help: "Post a message as a character: /sendas name={{char}} text",
      origin: "st",
      run: async (c) => {
        const name = str(c, "name");
        if (!name) throw new ScriptError("/sendas needs name=");
        await c.rt.host.chat.send({ role: "assistant", name, text: text(c), at: atArg(c) });
        return "";
      }
    },
    {
      name: "send",
      rawQuotes: true,
      help: "Post a message as you (no reply is generated).",
      origin: "st",
      run: async (c) => {
        await c.rt.host.chat.send({ role: "user", text: text(c), at: atArg(c) });
        return "";
      }
    },
    {
      name: "sys",
      aliases: ["system"],
      rawQuotes: true,
      help: "Post a narrator/system message.",
      origin: "st",
      run: async (c) => {
        await c.rt.host.chat.send({ role: "system", text: text(c), at: atArg(c) });
        return "";
      }
    },
    {
      name: "comment",
      rawQuotes: true,
      help: "Post a note shown in the chat but hidden from the AI.",
      origin: "st",
      run: async (c) => {
        await c.rt.host.chat.send({ role: "system", text: text(c), at: atArg(c), hidden: true });
        return "";
      }
    },
    // ── reading and editing the chat ──
    {
      name: "messages",
      aliases: ["message"],
      help: "Get messages by number or range: /messages names=on|off 3-5",
      origin: "st",
      run: async (c) => {
        const all = await c.rt.host.chat.messages();
        const raw = text(c).trim();
        const wanted = raw ? new Set(parseRange(c, raw)) : null;
        const names = !isFalse(str(c, "names") ?? "on");
        const includeHidden = flag(c, "hidden");
        const role = str(c, "role");
        const picked = all.filter(
          (m2) => (!wanted || wanted.has(m2.number)) && (includeHidden || !m2.hidden) && (!role || (role === "char" ? m2.role === "assistant" : role === "user" ? m2.role === "user" : m2.role === "system" || m2.role === "narrator"))
        );
        return picked.map((m2) => names ? `${m2.name}: ${m2.content}` : m2.content).join("\n\n");
      }
    },
    {
      name: "hide",
      help: "Hide messages from the AI by number or range.",
      origin: "st",
      run: async (c) => String(await c.rt.host.chat.setHidden(parseRange(c, text(c)), true))
    },
    {
      name: "unhide",
      help: "Show hidden messages to the AI again.",
      origin: "st",
      run: async (c) => String(await c.rt.host.chat.setHidden(parseRange(c, text(c)), false))
    },
    {
      name: "cut",
      help: "Delete messages by number or range (asks first).",
      origin: "st",
      run: async (c) => {
        const numbers = parseRange(c, text(c));
        if (!numbers.length) return "";
        if (!await c.rt.host.confirm(t(`Delete ${numbers.length} message(s)? (#${numbers.join(", #")})`, `메시지 ${numbers.length}개를 삭제할까요? (${numbers.join(", ")}번)`))) return "";
        return String(await c.rt.host.chat.deleteMessages(numbers));
      }
    },
    {
      name: "del",
      help: "Delete the last N messages (asks first).",
      origin: "st",
      run: async (c) => {
        const count = Math.max(0, Number(text(c)) || 0);
        if (!count) return "";
        const all = await c.rt.host.chat.messages();
        const numbers = all.slice(-count).map((m2) => m2.number);
        if (!await c.rt.host.confirm(t(`Delete the last ${numbers.length} message(s)?`, `마지막 메시지 ${numbers.length}개를 삭제할까요?`))) return "";
        return String(await c.rt.host.chat.deleteMessages(numbers));
      }
    },
    // ── Marinara's own commands ──
    passThrough("guided", ["narrator", "narrate"], "Marinara: steer the next reply without posting a message."),
    {
      name: "nar",
      rawQuotes: true,
      help: "Marinara: same as /guided. (In imported SillyTavern scripts: same as /sys.)",
      origin: "marinara",
      run: async (c) => {
        if (c.rt.dialect === "st") {
          await c.rt.host.chat.send({ role: "system", text: text(c), at: atArg(c) });
          return "";
        }
        return native(c, "guided", text(c));
      }
    },
    passThrough("as", ["respond"], "Marinara: post as, or reply as, a character: /as name [message]"),
    passThrough("impersonate", ["imp"], "Marinara: write a reply as your persona."),
    passThrough("illustrate", ["ill"], "Marinara: generate an image for the chat."),
    passThrough("selfie", [], "Marinara: a character sends a selfie (Conversation)."),
    passThrough("video", [], "Marinara: a character sends a short video (Conversation)."),
    passThrough("emote", ["emotion", "sprite"], "Marinara: show or switch a sprite expression."),
    passThrough("roll", ["r", "dice"], "Marinara: roll dice and post the result."),
    passThrough("remind", ["reminder", "timer"], "Marinara: post a reminder after a delay."),
    passThrough("scene", ["rp"], "Marinara: start a Roleplay scene from a Conversation."),
    passThrough("status", [], "Marinara: set a character's presence status."),
    passThrough("impersonate_prompt", ["imp_prompt"], "Marinara: set this chat's impersonate prompt."),
    {
      name: "goto",
      aliases: ["jump", "scroll"],
      help: "Marinara: scroll to a message by number.",
      origin: "marinara",
      run: (c) => {
        const n = Number(text(c));
        return native(c, "goto", Number.isNaN(n) ? text(c) : String(c.rt.toMarinaraNumber(n)));
      }
    },
    {
      name: "randomchar",
      help: "Open a chat with a random character (optionally only characters with a tag). Same as SillyTavern's /random. Returns the name.",
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.chat.openRandomCharacter) throw new ScriptError("/randomchar is not available here");
        return c.rt.host.chat.openRandomCharacter(text(c).trim() || void 0);
      }
    },
    {
      name: "random",
      aliases: ["event"],
      help: "Marinara: ask the AI for a surprise event. (In SillyTavern-mode scripts it opens a random character's chat, like /randomchar.)",
      origin: "marinara",
      run: async (c) => {
        if (c.rt.dialect === "st" && c.rt.host.chat.openRandomCharacter) return c.rt.host.chat.openRandomCharacter(text(c).trim() || void 0);
        return native(c, "random", text(c));
      }
    }
  ];

  // src/stscript/commands/core.ts
  var MAX_LOOPS = 100;
  var text2 = (v) => asText(v);
  var str2 = (call, key2) => {
    const v = call.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var parts = (call) => Array.isArray(call.unnamed) ? call.unnamed : call.unnamed === "" ? [] : [call.unnamed];
  function operand(call, raw) {
    if (raw === void 0) return void 0;
    if (raw === "") return "";
    const n = raw.trim().length ? Number(raw) : Number.NaN;
    if (!Number.isNaN(n)) return n;
    if (call.scope.has(raw)) {
      const v = call.scope.get(raw);
      return isClosureValue(v) ? "" : v;
    }
    const { local, global } = call.rt.host;
    if (local.has(raw)) return readVar(local, raw);
    if (global.has(raw)) return readVar(global, raw);
    return raw;
  }
  function evalRule(rule, a, b) {
    if (a === void 0) throw new ScriptError("Left operand (left=) is missing");
    if (b === void 0) {
      if (rule !== void 0 && rule !== "not") throw new ScriptError(`Rule "${rule}" needs a right operand (right=)`);
      const truthy2 = rule !== "not";
      if (isTrue(String(a))) return truthy2;
      if (isFalse(String(a))) return !truthy2;
      return a ? truthy2 : !truthy2;
    }
    const r = rule ?? "eq";
    if (typeof a === "number" && typeof b === "number") {
      switch (r) {
        case "gt":
          return a > b;
        case "gte":
          return a >= b;
        case "lt":
          return a < b;
        case "lte":
          return a <= b;
        case "eq":
          return a === b;
        case "neq":
          return a !== b;
        case "in":
        case "nin":
          break;
        default:
          throw new ScriptError(`Unknown rule "${r}" for numbers (use gt, gte, lt, lte, eq, neq)`);
      }
    }
    const as = String(a).toLowerCase();
    const bs = String(b).toLowerCase();
    switch (r) {
      case "in":
        return as.includes(bs);
      case "nin":
        return !as.includes(bs);
      case "eq":
        return as === bs;
      case "neq":
        return as !== bs;
      default:
        throw new ScriptError(`Unknown rule "${r}" for text (use eq, neq, in, nin)`);
    }
  }
  function condition(call) {
    const a = operand(call, str2(call, "left") ?? str2(call, "a") ?? str2(call, "first") ?? str2(call, "x"));
    const b = operand(call, str2(call, "right") ?? str2(call, "b") ?? str2(call, "second") ?? str2(call, "y"));
    return evalRule(str2(call, "rule"), a, b);
  }
  function bodyOf(values) {
    if (values.length === 0) return void 0;
    if (isClosureValue(values[0])) return values[0];
    return values.map((v) => asText(v)).join(" ");
  }
  function varName(call) {
    const name = str2(call, "key") ?? str2(call, "name") ?? "";
    if (name) return name.trim();
    return text2(call.unnamed).trim();
  }
  function setVar(store, call) {
    const key2 = str2(call, "key") ?? str2(call, "name");
    if (!key2) throw new ScriptError("Missing key= for the variable name");
    const value = text2(call.unnamed);
    writeVar(store, key2.trim(), value, str2(call, "index"), str2(call, "as"));
    return value;
  }
  function getVar(store, call) {
    const name = varName(call);
    return String(readVar(store, name, str2(call, "index")));
  }
  function addToVar(store, call) {
    const key2 = str2(call, "key") ?? str2(call, "name");
    if (!key2) throw new ScriptError("Missing key= for the variable name");
    return String(addVar(store, key2.trim(), text2(call.unnamed)));
  }
  function num(call, v) {
    const raw = asText(v).trim();
    const n = Number(raw);
    if (raw !== "" && !Number.isNaN(n)) return n;
    const resolved2 = operand(call, raw);
    const m2 = Number(resolved2);
    return Number.isNaN(m2) ? 0 : m2;
  }
  function mathArgs(call) {
    return parts(call).flatMap((v) => asText(v).split(/\s+/)).filter((s) => s !== "").map((s) => num(call, s));
  }
  var safe = (n) => Number.isFinite(n) ? n : 0;
  function math(name, help, fn, aliases) {
    return { name, aliases, help, split: true, origin: "st", run: (call) => String(safe(fn(mathArgs(call)))) };
  }
  var coreCommands = [
    { name: "pass", aliases: ["return"], help: "Put a value into the pipe.", origin: "st", run: (c) => c.unnamed },
    {
      name: "let",
      split: true,
      splitCount: 1,
      help: "Declare a scoped variable: /let name value",
      origin: "st",
      run: (c) => {
        const key2 = str2(c, "key");
        const list = parts(c);
        const name = key2 ?? asText(list[0] ?? "");
        const value = key2 ? list.length === 1 ? list[0] : list.map((v) => asText(v)).join(" ") : list[1] ?? "";
        if (!name) throw new ScriptError("/let needs a variable name");
        c.scope.let(name, value);
        return value;
      }
    },
    {
      name: "var",
      split: true,
      splitCount: 1,
      help: "Set or get a scoped variable: /var name [value]",
      origin: "st",
      run: (c) => {
        const key2 = str2(c, "key");
        const list = parts(c);
        const name = key2 ?? asText(list[0] ?? "");
        const rest = key2 ? list : list.slice(1);
        const index = str2(c, "index");
        if (rest.length === 0) return c.scope.get(name, index);
        const value = rest.length === 1 ? rest[0] : rest.map((v) => asText(v)).join(" ");
        return c.scope.set(name, value, index);
      }
    },
    {
      name: "if",
      split: true,
      help: "Run commands when a condition holds: /if left=a rule=eq right=b else={: ... :} {: ... :}",
      origin: "st",
      run: async (c) => {
        const body = bodyOf(parts(c));
        if (condition(c)) {
          if (body !== void 0) return (await c.rt.runBody(body, c, true)).pipe;
        } else {
          const otherwise = c.named.else;
          if (otherwise !== void 0 && (isClosureValue(otherwise) || otherwise !== "")) {
            return (await c.rt.runBody(otherwise, c, true)).pipe;
          }
        }
        return "";
      }
    },
    {
      name: "while",
      split: true,
      help: "Repeat while a condition holds (max 100 unless guard=off).",
      origin: "st",
      run: async (c) => {
        const limit = isFalse(str2(c, "guard") ?? "on") ? Number.MAX_SAFE_INTEGER : MAX_LOOPS;
        const body = bodyOf(parts(c));
        let last = "";
        for (let i = 0; i < limit; i++) {
          if (!condition(c) || body === void 0) break;
          const r = await c.rt.runBody(body, c, false);
          last = r.pipe;
          if (r.isBreak) break;
        }
        return last;
      }
    },
    {
      name: "times",
      split: true,
      splitCount: 1,
      help: "Repeat N times; {{timesIndex}} counts from 0.",
      origin: "st",
      run: async (c) => {
        const list = parts(c);
        const repeats = Number(asText(list[0] ?? "0"));
        const body = bodyOf(list.slice(1));
        const limit = Math.min(Number.isNaN(repeats) ? 0 : repeats, isFalse(str2(c, "guard") ?? "on") ? Number.MAX_SAFE_INTEGER : MAX_LOOPS);
        let last = "";
        if (body === void 0) return last;
        for (let i = 0; i < limit; i++) {
          const r = await c.rt.runBody(body, c, false, { timesIndex: String(i) });
          last = r.pipe;
          if (r.isBreak) break;
        }
        return last;
      }
    },
    {
      name: "run",
      aliases: [":"],
      help: "Run a closure or a Quick Reply (Set.Label).",
      origin: "st",
      run: (c) => {
        const provided = Object.entries(c.named).map(([name, value]) => ({ name, value }));
        const target = Array.isArray(c.unnamed) ? c.unnamed[0] ?? "" : c.unnamed;
        return c.rt.runNamed(target, provided, c);
      }
    },
    {
      name: "breakpoint",
      help: "Stop here when the QR editor's debugger runs this script (does nothing otherwise).",
      origin: "st",
      run: (c) => c.scope.pipe
    },
    {
      name: "abort",
      help: "Stop the script.",
      origin: "st",
      run: (c) => {
        throw new AbortScript(text2(c.unnamed), isTrue(str2(c, "quiet") ?? "on"));
      }
    },
    {
      name: "delay",
      aliases: ["wait", "sleep"],
      help: "Wait for N milliseconds.",
      origin: "st",
      run: async (c) => {
        const ms = Math.max(0, Math.min(Number(text2(c.unnamed)) || 0, 6e5));
        await new Promise((r) => setTimeout(r, ms));
        return "";
      }
    },
    // chat (local) variables
    { name: "setvar", help: "Set a chat variable: /setvar key=name value", origin: "st", run: (c) => setVar(c.rt.host.local, c) },
    { name: "getvar", help: "Get a chat variable.", origin: "st", run: (c) => getVar(c.rt.host.local, c) },
    { name: "addvar", help: "Add to a chat variable (number add, text append, array push).", origin: "st", run: (c) => addToVar(c.rt.host.local, c) },
    { name: "incvar", help: "Add 1 to a chat variable.", origin: "st", run: (c) => String(addVar(c.rt.host.local, varName(c), 1)) },
    { name: "decvar", help: "Subtract 1 from a chat variable.", origin: "st", run: (c) => String(addVar(c.rt.host.local, varName(c), -1)) },
    {
      name: "flushvar",
      help: "Delete a chat variable.",
      origin: "st",
      run: (c) => {
        const name = varName(c);
        if (isClosureValue(c.unnamed)) throw new ScriptError("/flushvar needs a variable name");
        c.rt.host.local.delete(name);
        return "";
      }
    },
    // global variables
    { name: "setglobalvar", help: "Set a global variable.", origin: "st", run: (c) => setVar(c.rt.host.global, c) },
    { name: "getglobalvar", help: "Get a global variable.", origin: "st", run: (c) => getVar(c.rt.host.global, c) },
    { name: "addglobalvar", help: "Add to a global variable.", origin: "st", run: (c) => addToVar(c.rt.host.global, c) },
    { name: "incglobalvar", help: "Add 1 to a global variable.", origin: "st", run: (c) => String(addVar(c.rt.host.global, varName(c), 1)) },
    { name: "decglobalvar", help: "Subtract 1 from a global variable.", origin: "st", run: (c) => String(addVar(c.rt.host.global, varName(c), -1)) },
    {
      name: "flushglobalvar",
      help: "Delete a global variable.",
      origin: "st",
      run: (c) => {
        c.rt.host.global.delete(varName(c));
        return "";
      }
    },
    {
      name: "listvar",
      help: "List variables as JSON.",
      origin: "st",
      run: (c) => {
        const scope = (str2(c, "scope") ?? "all").toLowerCase();
        const out = [];
        if (scope !== "global") for (const [key2, value] of c.rt.host.local.entries()) out.push({ key: key2, value, scope: "local" });
        if (scope !== "local") for (const [key2, value] of c.rt.host.global.entries()) out.push({ key: key2, value, scope: "global" });
        return JSON.stringify(out);
      }
    },
    // math
    math("add", "Add numbers.", (xs) => xs.reduce((a, b) => a + b, 0)),
    math("mul", "Multiply numbers.", (xs) => xs.reduce((a, b) => a * b, 1)),
    math("max", "Largest number.", (xs) => xs.length ? Math.max(...xs) : 0),
    math("min", "Smallest number.", (xs) => xs.length ? Math.min(...xs) : 0),
    math("sub", "a - b.", ([a = 0, b = 0]) => a - b),
    math("div", "a / b (0 when dividing by 0).", ([a = 0, b = 0]) => b === 0 ? 0 : a / b),
    math("mod", "a mod b.", ([a = 0, b = 0]) => b === 0 ? 0 : a % b),
    math("pow", "a to the power b.", ([a = 0, b = 0]) => a ** b),
    math("sin", "Sine.", ([a = 0]) => Math.sin(a)),
    math("cos", "Cosine.", ([a = 0]) => Math.cos(a)),
    math("log", "Natural log.", ([a = 0]) => Math.log(a)),
    math("abs", "Absolute value.", ([a = 0]) => Math.abs(a)),
    math("sqrt", "Square root.", ([a = 0]) => Math.sqrt(a)),
    math("round", "Round to the nearest integer.", ([a = 0]) => Math.round(a)),
    {
      name: "rand",
      help: "Random number: /rand [to] or /rand from=a to=b round=round|ceil|floor",
      origin: "st",
      run: (c) => {
        const fromArg = str2(c, "from");
        const toArg = str2(c, "to") ?? (text2(c.unnamed).trim() || void 0);
        const from = Number(fromArg ?? 0);
        const to = Number(toArg ?? 1);
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        let n = lo + Math.random() * (hi - lo);
        const mode = str2(c, "round");
        if (mode === "round") n = Math.round(n);
        else if (mode === "ceil") n = Math.ceil(n);
        else if (mode === "floor") n = Math.floor(n);
        return String(n);
      }
    },
    // text
    {
      name: "len",
      aliases: ["length"],
      help: "Length of text, or item count of a JSON array/object.",
      origin: "st",
      run: (c) => {
        const t2 = text2(c.unnamed);
        try {
          const parsed = JSON.parse(t2);
          if (Array.isArray(parsed)) return String(parsed.length);
          if (parsed && typeof parsed === "object") return String(Object.keys(parsed).length);
        } catch {
        }
        return String(t2.length);
      }
    },
    {
      name: "trimstart",
      help: "Drop text before the first full sentence.",
      origin: "st",
      run: (c) => {
        const t2 = text2(c.unnamed);
        const m2 = /[.!?…。！？]\s+/.exec(t2);
        return m2 && /^[a-z]/.test(t2) ? t2.slice(m2.index + m2[0].length) : t2;
      }
    },
    {
      name: "trimend",
      help: "Drop text after the last full sentence.",
      origin: "st",
      run: (c) => {
        const t2 = text2(c.unnamed);
        const m2 = /[\s\S]*[.!?…。！？"”*)\]]/.exec(t2);
        return m2 ? m2[0] : t2;
      }
    },
    {
      name: "fuzzy",
      help: "Pick the closest candidate from list=[...] for the input.",
      origin: "st",
      run: (c) => {
        const listRaw = str2(c, "list") ?? "[]";
        let list = [];
        try {
          list = JSON.parse(c.rt.host.local.has(listRaw) ? String(c.rt.host.local.get(listRaw)) : listRaw);
        } catch {
          list = [];
        }
        const input = text2(c.unnamed).toLowerCase();
        let best = "";
        let bestScore = -1;
        for (const item of list) {
          const score = similarity(String(item).toLowerCase(), input);
          if (score > bestScore) {
            best = String(item);
            bestScore = score;
          }
        }
        return best;
      }
    },
    {
      name: "parser-flag",
      help: "Parser flags are handled while parsing.",
      origin: "st",
      run: () => ""
    }
  ];
  function similarity(a, b) {
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.9;
    const grams = (s) => new Set(Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2)));
    const ga = grams(a);
    const gb = grams(b);
    let common = 0;
    for (const g of ga) if (gb.has(g)) common++;
    return 2 * common / (ga.size + gb.size || 1);
  }

  // src/stscript/commands/text.ts
  var text3 = (c) => asText(c.unnamed);
  var str3 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  function regexFromString(input) {
    const m2 = /^\/([\s\S]+)\/([dgimsuvy]*)$/.exec(input);
    try {
      return m2 ? new RegExp(m2[1], m2[2]) : new RegExp(input);
    } catch {
      throw new ScriptError(`Invalid regular expression: ${input}`);
    }
  }
  function jsonFrom(c, raw) {
    const source = c.rt.host.local.has(raw) ? c.rt.host.local.get(raw) : c.rt.host.global.has(raw) ? c.rt.host.global.get(raw) : raw;
    try {
      return JSON.parse(source);
    } catch {
      throw new ScriptError(`Not valid JSON: ${source.slice(0, 60)}`);
    }
  }
  var toText = (v) => v === void 0 || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  function pathParts(path) {
    return path.replace(/\[(\d+)\]/g, ".$1").split(".").filter((p) => p !== "").map((p) => /^\d+$/.test(p) ? Number(p) : p);
  }
  function getPath(root, path) {
    let cur = root;
    for (const p of pathParts(path)) {
      if (cur === null || typeof cur !== "object") return void 0;
      cur = cur[p];
    }
    return cur;
  }
  function setPath(root, path, value) {
    const parts3 = pathParts(path);
    if (!parts3.length) return value;
    const top = root && typeof root === "object" ? root : typeof parts3[0] === "number" ? [] : {};
    let cur = top;
    parts3.forEach((p, i) => {
      if (i === parts3.length - 1) {
        cur[p] = value;
        return;
      }
      if (!cur[p] || typeof cur[p] !== "object") cur[p] = typeof parts3[i + 1] === "number" ? [] : {};
      cur = cur[p];
    });
    return top;
  }
  function parseValue(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  function parseOffset(raw) {
    let total = 0;
    for (const m2 of raw.matchAll(/([+-]?\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/gi)) {
      const n = Number(m2[1]);
      const unit = m2[2].toLowerCase();
      total += n * { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[unit];
    }
    return total;
  }
  function formatDate(d, format) {
    const pad2 = (n, w = 2) => String(n).padStart(w, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    return format.replace(
      /YYYY|MM|DD|HH|mm|ss|ddd/g,
      (t2) => t2 === "YYYY" ? String(d.getFullYear()) : t2 === "MM" ? pad2(d.getMonth() + 1) : t2 === "DD" ? pad2(d.getDate()) : t2 === "HH" ? pad2(d.getHours()) : t2 === "mm" ? pad2(d.getMinutes()) : t2 === "ss" ? pad2(d.getSeconds()) : weekdays[d.getDay()]
    );
  }
  var textCommands = [
    {
      name: "replace",
      aliases: ["re"],
      help: "Replace text: /replace [mode=literal|regex] pattern=… [replacer=…] text",
      origin: "st",
      run: (c) => {
        const pattern = str3(c, "pattern");
        if (!pattern) throw new ScriptError("/replace needs pattern=");
        const replacer = str3(c, "replacer") ?? "";
        const mode = str3(c, "mode") ?? "literal";
        if (mode === "literal") return text3(c).split(pattern).join(replacer);
        if (mode === "regex") return text3(c).replace(regexFromString(pattern), replacer);
        throw new ScriptError(`/replace mode must be literal or regex, not "${mode}"`);
      }
    },
    { name: "upper", help: "UPPERCASE the text.", origin: "st", run: (c) => text3(c).toUpperCase() },
    { name: "lower", help: "Lowercase the text.", origin: "st", run: (c) => text3(c).toLowerCase() },
    {
      name: "substr",
      aliases: ["substring"],
      help: "Part of the text: /substr start=0 end=5 text (end optional, negative counts from the end).",
      origin: "st",
      run: (c) => {
        const start2 = Number(str3(c, "start") ?? 0) || 0;
        const endRaw = str3(c, "end");
        return endRaw === void 0 || endRaw === "" ? text3(c).slice(start2) : text3(c).slice(start2, Number(endRaw));
      }
    },
    {
      name: "match",
      help: "Regex match: /match pattern=/re/flags text → JSON groups ('' when none; all matches with the g flag).",
      origin: "st",
      run: (c) => {
        const pattern = str3(c, "pattern");
        if (!pattern) throw new ScriptError("/match needs pattern=");
        const re = regexFromString(pattern);
        if (re.flags.includes("g")) return JSON.stringify([...text3(c).matchAll(re)].map((m3) => [...m3]));
        const m2 = re.exec(text3(c));
        return m2 ? JSON.stringify([...m2]) : "";
      }
    },
    {
      name: "test",
      help: "Does the regex match? /test pattern=/re/ text → true or false",
      origin: "st",
      run: (c) => {
        const pattern = str3(c, "pattern");
        if (!pattern) throw new ScriptError("/test needs pattern=");
        return JSON.stringify(regexFromString(pattern).test(text3(c)));
      }
    },
    {
      name: "sort",
      help: "Sort a JSON list (or a dictionary's keys; keysort=false sorts keys by value).",
      origin: "st",
      run: (c) => {
        const value = jsonFrom(c, text3(c));
        const cmp = (a, b) => typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
        if (Array.isArray(value)) return JSON.stringify([...value].sort(cmp));
        if (value && typeof value === "object") {
          const entries = Object.entries(value);
          const byKey = !isFalse(str3(c, "keysort") ?? "true");
          entries.sort((a, b) => byKey ? cmp(a[0], b[0]) : cmp(a[1], b[1]));
          return JSON.stringify(entries.map(([k]) => k));
        }
        throw new ScriptError("/sort needs a JSON list or dictionary");
      }
    },
    {
      name: "array-wrap",
      aliases: ["list-wrap"],
      help: "Wrap a value in a JSON list (lists stay as they are).",
      origin: "st",
      run: (c) => {
        const value = text3(c);
        if (value === "") return "[]";
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return value;
          if (parsed && typeof parsed === "object") return JSON.stringify([parsed]);
          if (isFalse(str3(c, "stringify") ?? "true")) return JSON.stringify([parsed]);
        } catch {
        }
        return JSON.stringify([value]);
      }
    },
    {
      name: "array-unwrap",
      aliases: ["list-unwrap"],
      help: "First item of a JSON list (the value itself when it is not a list).",
      origin: "st",
      run: (c) => {
        const value = text3(c);
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return toText(parsed[0]);
        } catch {
        }
        return value;
      }
    },
    // ── Dispensa additions ──
    { name: "trim", help: "Remove spaces and line breaks at both ends.", origin: "dispensa", run: (c) => text3(c).trim() },
    {
      name: "split",
      help: 'Text → JSON list: /split [separator=","] [trim=on] text',
      origin: "dispensa",
      run: (c) => {
        const sep = str3(c, "separator") ?? str3(c, "sep") ?? ",";
        const parts3 = text3(c).split(sep.startsWith("/") && sep.length > 2 ? regexFromString(sep) : sep);
        return JSON.stringify(isFalse(str3(c, "trim") ?? "on") ? parts3 : parts3.map((p) => p.trim()).filter((p) => p !== ""));
      }
    },
    {
      name: "join",
      help: 'JSON list → text: /join [separator=", "] ["a","b"]',
      origin: "dispensa",
      run: (c) => {
        const value = jsonFrom(c, text3(c));
        if (!Array.isArray(value)) throw new ScriptError("/join needs a JSON list");
        return value.map(toText).join(str3(c, "separator") ?? str3(c, "sep") ?? ", ");
      }
    },
    {
      name: "json-get",
      help: "Read a value inside JSON: /json-get path=a.b[0] {json or variable name}",
      origin: "dispensa",
      run: (c) => toText(getPath(jsonFrom(c, text3(c)), str3(c, "path") ?? ""))
    },
    {
      name: "json-set",
      help: "Change a value inside JSON: /json-set path=a.b value=… {json or variable name} → new JSON",
      origin: "dispensa",
      run: (c) => {
        const raw = text3(c).trim();
        const root = raw === "" ? {} : jsonFrom(c, raw);
        return JSON.stringify(setPath(root, str3(c, "path") ?? "", parseValue(str3(c, "value") ?? "")));
      }
    },
    {
      name: "json-keys",
      help: "The keys of a JSON object (or indexes of a list) as a JSON list.",
      origin: "dispensa",
      run: (c) => {
        const value = jsonFrom(c, text3(c));
        if (!value || typeof value !== "object") throw new ScriptError("/json-keys needs a JSON object or list");
        return JSON.stringify(Object.keys(value));
      }
    },
    {
      name: "randompick",
      help: "One random item from a JSON list or from comma-separated text.",
      origin: "dispensa",
      run: (c) => {
        const raw = text3(c).trim();
        let items;
        try {
          const parsed = JSON.parse(c.rt.host.local.get(raw) ?? raw);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          items = raw.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return items.length ? toText(items[Math.floor(Math.random() * items.length)]) : "";
      }
    },
    {
      name: "date",
      help: 'Date/time text: /date [format="YYYY-MM-DD HH:mm"] [add="+1d"] (units: ms s m h d w; ddd = weekday)',
      origin: "dispensa",
      run: (c) => {
        const base = str3(c, "from") ? new Date(str3(c, "from")) : /* @__PURE__ */ new Date();
        if (Number.isNaN(base.getTime())) throw new ScriptError(`Invalid date: ${str3(c, "from")}`);
        const d = new Date(base.getTime() + parseOffset(str3(c, "add") ?? ""));
        return formatDate(d, str3(c, "format") ?? (text3(c).trim() || "YYYY-MM-DD HH:mm"));
      }
    },
    {
      name: "count",
      help: 'How many times something appears: /count of="x" text (regex with of=/re/)',
      origin: "dispensa",
      run: (c) => {
        const of = str3(c, "of");
        if (!of) throw new ScriptError("/count needs of=");
        if (of.startsWith("/") && of.length > 2) {
          const re = regexFromString(of);
          return String([...text3(c).matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`))].length);
        }
        return String(text3(c).split(of).length - 1);
      }
    },
    {
      name: "isempty",
      help: "True when the value is empty (after trimming), otherwise false.",
      origin: "dispensa",
      run: (c) => JSON.stringify(text3(c).trim() === "" || isTrue(str3(c, "json") ?? "off") && ["[]", "{}", "null"].includes(text3(c).trim()))
    }
  ];

  // src/stscript/commands/ui.ts
  var text4 = (c) => asText(c.unnamed);
  var str4 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  function listFrom(c, raw) {
    if (!raw) return [];
    const source = c.rt.host.local.get(raw) ?? c.rt.host.global.get(raw) ?? raw;
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) return parsed.map((x) => typeof x === "object" ? JSON.stringify(x) : String(x));
    } catch {
    }
    return source.split(",").map((s) => s.trim()).filter(Boolean);
  }
  function fieldsFrom(c, raw) {
    if (!raw) throw new ScriptError('/form needs fields= (e.g. fields="name,age" or a JSON list)');
    const source = c.rt.host.local.get(raw) ?? raw;
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) {
        return parsed.map((f) => typeof f === "string" ? { name: f } : { ...f, name: String(f.name ?? f.label ?? "field"), options: Array.isArray(f.options) ? f.options.map(String) : void 0 });
      }
    } catch {
    }
    return source.split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));
  }
  var uiCommands = [
    {
      name: "form",
      help: 'Ask several things at once: /form fields="name,age,mood" title → JSON {"name":…} ("" when cancelled)',
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.ui.form) throw new ScriptError("/form is not available here");
        const result = await c.rt.host.ui.form(text4(c), fieldsFrom(c, str4(c, "fields")));
        return result ? JSON.stringify(result) : "";
      }
    },
    {
      name: "pick",
      help: 'Searchable list: /pick items=["a","b"] [multiple=on] question → chosen item ("" when cancelled; JSON list with multiple)',
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.ui.pick) throw new ScriptError("/pick is not available here");
        const items = listFrom(c, str4(c, "items") ?? str4(c, "labels"));
        if (!items.length) throw new ScriptError("/pick needs items= (a JSON list, a variable name or comma-separated words)");
        const multiple = isTrue(str4(c, "multiple") ?? "off");
        const picked = await c.rt.host.ui.pick(text4(c), items, { multiple, placeholder: str4(c, "placeholder") });
        return multiple ? JSON.stringify(picked) : picked[0] ?? "";
      }
    },
    {
      name: "confirm",
      help: "Yes/no question → true or false. /confirm [yes=Yes] [no=No] question",
      origin: "dispensa",
      run: async (c) => JSON.stringify(await c.rt.host.ui.popup(text4(c), { okButton: str4(c, "yes") ?? t("Yes", "예"), cancelButton: str4(c, "no") ?? t("No", "아니요") }))
    },
    {
      name: "clipboard-set",
      aliases: ["copy"],
      help: "Copy text to the clipboard.",
      origin: "st",
      run: async (c) => {
        if (!c.rt.host.ui.copy) throw new ScriptError("Clipboard is not available here");
        await c.rt.host.ui.copy(text4(c));
        return text4(c);
      }
    },
    {
      name: "clipboard-get",
      aliases: ["paste"],
      help: "Read text from the clipboard (the browser may ask for permission).",
      origin: "st",
      run: async (c) => {
        if (!c.rt.host.ui.paste) throw new ScriptError("Clipboard is not available here");
        return c.rt.host.ui.paste();
      }
    },
    {
      name: "notify",
      help: "System notification, even when you are in another tab: /notify [title=] text",
      origin: "dispensa",
      run: async (c) => {
        if (c.rt.host.ui.notify) await c.rt.host.ui.notify(str4(c, "title") ?? "Marinara", text4(c));
        else c.rt.host.ui.toast(text4(c), "info", { title: str4(c, "title") });
        return text4(c);
      }
    },
    {
      name: "wait-reply",
      aliases: ["waitreply"],
      help: "Wait until the AI finishes its reply: /wait-reply [timeout=120] → true (finished) or false (timed out)",
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.chat.waitForIdle) return "true";
        const seconds = Math.max(1, Math.min(Number(str4(c, "timeout") ?? 120) || 120, 3600));
        return JSON.stringify(await c.rt.host.chat.waitForIdle(seconds * 1e3));
      }
    },
    {
      name: "is-mobile",
      help: "True on phones and tablets.",
      origin: "st",
      run: () => JSON.stringify(typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches)
    }
  ];

  // src/stscript/commands/qr.ts
  var text5 = (c) => asText(c.unnamed).trim();
  var str5 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var bool = (c, key2) => {
    const v = str5(c, key2);
    if (v === void 0 || v === "") return void 0;
    return isTrue(v) ? true : isFalse(v) ? false : void 0;
  };
  function qr(c) {
    if (!c.rt.host.qr) throw new ScriptError("Quick Reply commands only work inside Dispensa");
    return c.rt.host.qr;
  }
  function infoChanges(c) {
    const changes = {};
    const title = str5(c, "title");
    if (title !== void 0) changes.title = title;
    const icon2 = str5(c, "icon");
    if (icon2 !== void 0) changes.icon = icon2;
    for (const [arg, key2] of [
      ["hidden", "hidden"],
      ["startup", "startup"],
      ["user", "user"],
      ["bot", "bot"],
      ["load", "load"],
      ["new", "newChat"],
      ["group", "group"],
      ["generation", "generation"],
      ["showlabel", "showLabel"]
    ]) {
      const b = bool(c, arg);
      if (b !== void 0) changes[key2] = b;
    }
    return changes;
  }
  function ref(c, labelFromText = false) {
    const set = str5(c, "set");
    if (!set) throw new ScriptError(`/${c.node.name} needs set=`);
    const id = str5(c, "id");
    if (id !== void 0 && id !== "") {
      const n = Number(id);
      if (!Number.isInteger(n) || n < 1) throw new ScriptError(`id= must be a number from 1 (got "${id}")`);
      return { set, id: n };
    }
    const label = str5(c, "label") ?? (labelFromText ? text5(c) : void 0);
    if (!label) throw new ScriptError(`/${c.node.name} needs label= or id=`);
    return { set, label };
  }
  function chatToggle(state) {
    return (c) => {
      const name = text5(c);
      if (!name) throw new ScriptError("Set name is missing");
      return String(qr(c).setForChat(name, state));
    };
  }
  function setToggle(state) {
    return (c) => {
      const name = text5(c);
      if (!name) throw new ScriptError("Set name is missing");
      return String(qr(c).setEnabled(name, state));
    };
  }
  function setOptions(c) {
    return { nosend: bool(c, "nosend"), before: bool(c, "before"), inject: bool(c, "inject"), color: str5(c, "color"), onlyBorder: bool(c, "onlyborder") };
  }
  function wrap(fn) {
    try {
      fn();
    } catch (e) {
      throw e instanceof ScriptError ? e : new ScriptError(e instanceof Error ? e.message : String(e));
    }
  }
  function keptClosures(root) {
    const out = /* @__PURE__ */ new Map();
    for (const ex of root.executors) {
      if (ex.kind !== "command" || ex.name !== "let" && ex.name !== "var") continue;
      const key2 = ex.named.find((a) => a.name === "key");
      const parts3 = ex.unnamed.map((u) => u.value);
      const name = key2 ? key2.value : parts3[0];
      const value = key2 ? parts3[0] : parts3[1];
      if (typeof name === "string" && value && typeof value !== "string") out.set(name.trim(), value);
    }
    return out;
  }
  function parseDelay(raw) {
    const m2 = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/i.exec(raw.trim());
    if (!m2) throw new ScriptError(`Invalid delay "${raw}" (e.g. 30s, 5m, 1h)`);
    const n = Number(m2[1]);
    const unit = (m2[2] ?? "s").toLowerCase();
    return n * { ms: 1, s: 1e3, m: 6e4, h: 36e5 }[unit];
  }
  var qrCommands = [
    {
      name: "qr",
      help: "Run the Nth visible Dock QR (counting from 0).",
      origin: "st",
      run: async (c) => {
        const index = Number(text5(c));
        const item = qr(c).visible()[index];
        if (!item) throw new ScriptError(`No Dock QR at index ${text5(c)}`);
        await qr(c).run(`${item.set}.${item.label}`);
        return "";
      }
    },
    { name: "qr-set", aliases: ["qrset"], help: "Turn a QR set on/off in every chat (toggle).", origin: "st", run: setToggle(void 0) },
    { name: "qr-set-on", help: "Turn a QR set on in every chat.", origin: "st", run: setToggle(true) },
    { name: "qr-set-off", help: "Turn a QR set off in every chat.", origin: "st", run: setToggle(false) },
    { name: "qr-chat-set", help: "Turn a QR set on/off for this chat (toggle).", origin: "st", run: chatToggle(void 0) },
    { name: "qr-chat-set-on", help: "Turn a QR set on for this chat.", origin: "st", run: chatToggle(true) },
    { name: "qr-chat-set-off", help: "Turn a QR set off for this chat.", origin: "st", run: chatToggle(false) },
    {
      name: "qr-set-list",
      help: "Names of QR sets as a JSON list: /qr-set-list [all|global|chat]",
      origin: "st",
      run: (c) => {
        const where = text5(c).toLowerCase();
        return JSON.stringify(qr(c).setNames(where === "global" || where === "chat" ? where : "all"));
      }
    },
    {
      name: "qr-list",
      help: "Labels of the QRs in a set as a JSON list.",
      origin: "st",
      run: (c) => {
        const set = str5(c, "set") ?? text5(c);
        return JSON.stringify(qr(c).labels(set));
      }
    },
    {
      name: "qr-get",
      help: "A QR's properties as JSON: /qr-get set=… label=… (or id=)",
      origin: "st",
      run: (c) => {
        const info = qr(c).get(ref(c, true));
        return info ? JSON.stringify(info) : "";
      }
    },
    {
      name: "qr-create",
      help: "Create a QR: /qr-create set=… label=… [icon=] [showlabel=] [title=] [hidden=] [startup=] [user=] [bot=] [load=] [new=] [group=] [generation=] script",
      origin: "st",
      run: (c) => {
        const set = str5(c, "set");
        const label = str5(c, "label");
        if (!set || !label) throw new ScriptError("/qr-create needs set= and label=");
        qr(c).create({ set, label, message: asText(c.unnamed), ...infoChanges(c) }, c.rt.dialect);
        return "";
      }
    },
    {
      name: "qr-update",
      help: "Change a QR: /qr-update set=… label=… (or id=) [newlabel=] [icon=] [title=] [hidden=] … [new script]",
      origin: "st",
      run: (c) => {
        const target = ref(c);
        const changes = infoChanges(c);
        const newLabel = str5(c, "newlabel");
        if (newLabel) changes.newLabel = newLabel;
        if (c.hasUnnamed && asText(c.unnamed) !== "") changes.message = asText(c.unnamed);
        if (!qr(c).update(target, changes)) throw new ScriptError(`No such QR in set "${target.set}"`);
        return "";
      }
    },
    {
      name: "qr-delete",
      help: "Delete a QR: /qr-delete set=… label (or id=) (asks first).",
      origin: "st",
      run: async (c) => {
        const target = ref(c, true);
        const what = target.label ?? `#${target.id}`;
        if (!await c.rt.host.confirm(t(`Delete QR "${what}" from set "${target.set}"?`, `"${target.set}" 세트의 QR "${what}"을(를) 삭제할까요?`))) return "";
        qr(c).remove(target);
        return "";
      }
    },
    {
      name: "qr-contextadd",
      help: "Add a set as a QR's sub menu: /qr-contextadd set=… label=… (or id=) [chain=true] SubMenuSet",
      origin: "st",
      run: (c) => {
        const name = text5(c);
        if (!name) throw new ScriptError("/qr-contextadd needs the sub menu's set name");
        wrap(() => qr(c).contextAdd(ref(c), name, bool(c, "chain") ?? false));
        return "";
      }
    },
    {
      name: "qr-contextdel",
      help: "Take a set off a QR's sub menu: /qr-contextdel set=… label=… (or id=) SubMenuSet",
      origin: "st",
      run: (c) => {
        wrap(() => qr(c).contextDel(ref(c), text5(c)));
        return "";
      }
    },
    {
      name: "qr-contextclear",
      help: "Clear a QR's sub menu: /qr-contextclear set=… label (or id=)",
      origin: "st",
      run: (c) => {
        wrap(() => qr(c).contextClear(ref(c, true)));
        return "";
      }
    },
    {
      name: "qr-arg",
      help: "A fallback value for a QR argument {{arg::name}}: /qr-arg name value",
      origin: "st",
      split: true,
      splitCount: 2,
      run: (c) => {
        const [key2, value] = c.unnamed.map((v) => asText(v));
        if (!key2) throw new ScriptError("/qr-arg needs a name");
        if (key2.includes("*") || c.scope.getMacro(`arg::${key2}`) === void 0) c.scope.setMacro(`arg::${key2}`, value ?? "");
        return "";
      }
    },
    {
      name: "import",
      help: "Use closures a QR keeps in /let or /var: /import from=Set.Label name [name as alias] …",
      origin: "st",
      split: true,
      run: (c) => {
        const from = str5(c, "from");
        if (!from) throw new ScriptError("/import requires from= to be set.");
        const names = c.unnamed.map((v) => asText(v)).filter(Boolean);
        if (!names.length) throw new ScriptError("/import requires the names to import.");
        const source = qr(c).source(from);
        if (!source) throw new ScriptError(`No Quick Reply found for "${from}".`);
        const closures = keptClosures(c.rt.parse(source.script));
        for (let i = 0; i < names.length; i++) {
          const src = names[i];
          let dst = src;
          if (i + 2 < names.length && names[i + 1] === "as") {
            dst = names[i + 2];
            i += 2;
          }
          const closure = closures.get(src);
          if (!closure) throw new ScriptError(`No scoped closure named "${src}" found in "${from}"`);
          const value = { kind: "closure-value", closure, scope: new Scope(c.scope), flags: c.node.flags };
          if (c.scope.has(dst)) c.scope.set(dst, value);
          else c.scope.let(dst, value);
        }
        return "";
      }
    },
    {
      name: "qr-set-create",
      aliases: ["qr-presetadd"],
      help: "Create a QR set: /qr-set-create [nosend=] [before=] [inject=] [color=] [onlyborder=] name",
      origin: "st",
      run: (c) => {
        const name = text5(c);
        if (!name) throw new ScriptError("Set name is missing");
        qr(c).createSet(name, setOptions(c));
        return "";
      }
    },
    {
      name: "qr-set-update",
      aliases: ["qr-presetupdate"],
      help: "Change a QR set's options.",
      origin: "st",
      run: (c) => {
        if (!qr(c).updateSet(text5(c), setOptions(c))) throw new ScriptError(`No QR set "${text5(c)}"`);
        return "";
      }
    },
    {
      name: "qr-set-delete",
      aliases: ["qr-presetdelete"],
      help: "Delete a QR set (asks first).",
      origin: "st",
      run: async (c) => {
        if (!await c.rt.host.confirm(t(`Delete the whole QR set "${text5(c)}"?`, `QR 세트 "${text5(c)}"를 통째로 삭제할까요?`))) return "";
        qr(c).removeSet(text5(c));
        return "";
      }
    },
    // ── Dispensa additions ──
    {
      name: "dock",
      aliases: ["qr-bar"],
      help: "Show, hide or toggle the Dock: /dock show|hide|toggle → true when shown",
      origin: "dispensa",
      run: (c) => {
        const arg = text5(c).toLowerCase();
        const state = arg === "show" || arg === "on" ? true : arg === "hide" || arg === "off" ? false : void 0;
        return String(qr(c).barVisible(state));
      }
    },
    {
      name: "dock-layout",
      aliases: ["qr-folder"],
      help: "Lay a set on the Dock as one folder bubble or a row of bubbles: /dock-layout mode=folder|row name",
      origin: "dispensa",
      run: (c) => {
        const mode = ["row", "inline"].includes(str5(c, "mode") ?? "") ? "inline" : "folder";
        if (!qr(c).setDisplay(text5(c), mode)) throw new ScriptError(`No QR set "${text5(c)}"`);
        return "";
      }
    },
    {
      name: "qr-later",
      help: "Run a QR after a delay: /qr-later delay=5m Set.Label (until the page is reloaded)",
      origin: "dispensa",
      run: (c) => {
        const name = text5(c);
        if (!name) throw new ScriptError("/qr-later needs a QR name (Label or Set.Label)");
        const ms = parseDelay(str5(c, "delay") ?? "60s");
        qr(c).runLater(name, ms);
        return "";
      }
    }
  ];

  // src/marinara/lore.ts
  var FIELD_MAP = {
    key: "keys",
    keys: "keys",
    keysecondary: "secondaryKeys",
    secondarykeys: "secondaryKeys",
    comment: "name",
    name: "name",
    title: "name",
    content: "content",
    description: "description",
    constant: "constant",
    disable: "enabled",
    // inverted
    enabled: "enabled",
    order: "order",
    probability: "probability",
    depth: "depth",
    position: "position",
    role: "role",
    scandepth: "scanDepth",
    casesensitive: "caseSensitive",
    matchwholewords: "matchWholeWords",
    group: "group",
    groupweight: "groupWeight",
    selectivelogic: "selectiveLogic",
    selective: "selective"
  };
  function marinaraField(stField) {
    const f = FIELD_MAP[stField.trim().toLowerCase()];
    if (!f) throw new Error(`Unknown lorebook field "${stField}"`);
    return f;
  }
  var truthy = (v) => /^(1|true|on|yes)$/i.test(v.trim());
  function readEntryField(entry, stField) {
    const field = marinaraField(stField);
    const raw = entry[field];
    if (stField.trim().toLowerCase() === "disable") return entry.enabled === false ? "true" : "false";
    if (Array.isArray(raw)) return raw.join(", ");
    if (raw === void 0 || raw === null) return "";
    return typeof raw === "object" ? JSON.stringify(raw) : String(raw);
  }
  function entryPatch(stField, value) {
    const lower = stField.trim().toLowerCase();
    const field = marinaraField(stField);
    if (lower === "disable") return { enabled: !truthy(value) };
    if (field === "keys" || field === "secondaryKeys") return { [field]: value.split(",").map((s) => s.trim()).filter(Boolean) };
    if (["constant", "enabled", "caseSensitive", "matchWholeWords", "selective"].includes(field)) return { [field]: truthy(value) };
    if (["order", "probability", "depth", "position", "scanDepth", "groupWeight"].includes(field)) {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error(`Field "${stField}" needs a number`);
      return { [field]: n };
    }
    return { [field]: value };
  }
  function findEntry(entries, stField, text7) {
    const q = text7.trim().toLowerCase();
    if (!q) return void 0;
    const values = (e) => readEntryField(e, stField).toLowerCase().split(/,\s*/).concat(readEntryField(e, stField).toLowerCase());
    return entries.find((e) => values(e).some((v) => v === q)) ?? entries.find((e) => values(e).some((v) => v.startsWith(q))) ?? entries.find((e) => values(e).some((v) => v.includes(q) || v && q.includes(v)));
  }

  // src/marinara/tracker.ts
  var TrackerPathError = class extends Error {
  };
  var SCALARS = /* @__PURE__ */ new Set(["date", "time", "location", "weather", "temperature"]);
  var CHAR_TEXT = /* @__PURE__ */ new Set(["mood", "appearance", "outfit", "thoughts", "emoji", "action"]);
  var DEFAULT_COLOR = "#ec4b97";
  function split(path) {
    const parts3 = path.split(".").map((p) => p.trim());
    if (parts3.some((p) => p === "")) throw new TrackerPathError(`Invalid tracker path "${path}"`);
    return parts3;
  }
  var sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  var json = (v) => JSON.stringify(v ?? null);
  function getTrackerValue(state, path) {
    if (!path.trim()) return json(state);
    if (!state) return "";
    const [head, ...rest] = split(path);
    const key2 = head.toLowerCase();
    if (SCALARS.has(key2) && rest.length === 0) return String(state[key2] ?? "");
    switch (key2) {
      case "world":
        return state.worldCustomFields?.find((f) => sameName(f.name, rest.join(".")))?.value ?? "";
      case "custom":
        return state.playerStats?.customTrackerFields?.find((f) => sameName(f.name, rest.join(".")))?.value ?? "";
      case "status":
        return String(state.playerStats?.status ?? "");
      case "persona": {
        const [stat, sub] = rest;
        const s = state.personaStats?.find((x) => sameName(x.name, stat ?? ""));
        return s ? String(sub === "max" ? s.max : s.value) : "";
      }
      case "char": {
        const [name, field, sub] = rest;
        const c = state.presentCharacters?.find((x) => sameName(x.name, name ?? ""));
        if (!c) return "";
        if (!field) return json(c);
        if (CHAR_TEXT.has(field.toLowerCase())) return String(c[field.toLowerCase()] ?? "");
        const stat = c.stats?.find((x) => sameName(x.name, field));
        if (stat) return String(sub === "max" ? stat.max : stat.value);
        const custom = Object.entries(c.customFields ?? {}).find(([k]) => sameName(k, field));
        return custom ? custom[1] : "";
      }
      case "inventory":
        return json(state.playerStats?.inventory ?? []);
      case "quests":
        return json(state.playerStats?.activeQuests ?? []);
      case "events":
        return json(state.recentEvents ?? []);
      case "characters":
        return json((state.presentCharacters ?? []).map((c) => c.name));
      default:
        throw new TrackerPathError(`Unknown tracker path "${path}"`);
    }
  }
  function setTrackerValue(state, path, value, opts = {}) {
    const [head, ...rest] = split(path);
    const key2 = head.toLowerCase();
    if (SCALARS.has(key2) && rest.length === 0) {
      state[key2] = value;
      return [key2];
    }
    const ensurePlayer = () => state.playerStats ??= { stats: [], attributes: null, skills: {}, inventory: [], activeQuests: [], status: "" };
    switch (key2) {
      case "world": {
        const name = rest.join(".");
        const list = state.worldCustomFields ??= [];
        const f = list.find((x) => sameName(x.name, name));
        if (f) f.value = value;
        else list.push({ name, value });
        return ["worldCustomFields"];
      }
      case "custom": {
        const name = rest.join(".");
        const list = ensurePlayer().customTrackerFields ??= [];
        const f = list.find((x) => sameName(x.name, name));
        if (f) f.value = value;
        else list.push({ name, value });
        return ["playerStats"];
      }
      case "status":
        ensurePlayer().status = value;
        return ["playerStats"];
      case "persona": {
        const [statName, sub] = rest;
        if (!statName) throw new TrackerPathError("persona.<stat> needs a stat name");
        const list = state.personaStats ??= [];
        upsertStat(list, statName, sub, value, opts);
        return ["personaStats"];
      }
      case "char": {
        const [name, field, sub] = rest;
        if (!name || !field) throw new TrackerPathError("char.<name>.<field> needs a character name and a field");
        const list = state.presentCharacters ??= [];
        let c = list.find((x) => sameName(x.name, name));
        if (!c) {
          c = { name, emoji: "", mood: "", appearance: null, outfit: null, thoughts: null, customFields: {}, stats: [] };
          list.push(c);
        }
        const lower = field.toLowerCase();
        if (CHAR_TEXT.has(lower)) {
          c[lower] = value;
        } else if (c.stats?.some((x) => sameName(x.name, field)) || opts.asStat || sub === "max" || opts.max !== void 0) {
          upsertStat(c.stats ??= [], field, sub, value, opts);
        } else {
          const fields = c.customFields ??= {};
          const existing = Object.keys(fields).find((k) => sameName(k, field));
          fields[existing ?? field] = value;
        }
        return ["presentCharacters"];
      }
      default:
        throw new TrackerPathError(`Can't change tracker path "${path}"`);
    }
  }
  function upsertStat(list, name, sub, value, opts) {
    const n = Number(value);
    if (Number.isNaN(n)) throw new TrackerPathError(`Stat "${name}" needs a number, got "${value}"`);
    let s = list.find((x) => sameName(x.name, name));
    if (!s) {
      s = { name, value: 0, max: opts.max ?? 100, color: opts.color ?? DEFAULT_COLOR };
      list.push(s);
    }
    if (sub === "max") s.max = n;
    else s.value = n;
    if (opts.max !== void 0) s.max = opts.max;
    if (opts.color) s.color = opts.color;
  }

  // src/stscript/commands/marinara.ts
  var TRACKER_AGENTS = ["world-state", "character-tracker", "persona-stats", "quest", "custom-tracker", "inventory-tracker"];
  var text6 = (c) => asText(c.unnamed).trim();
  var str6 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var parts2 = (c) => Array.isArray(c.unnamed) ? c.unnamed : c.unnamed === "" ? [] : [c.unnamed];
  function m(c) {
    if (!c.rt.host.marinara) throw new ScriptError("This command only works inside Marinara");
    return c.rt.host.marinara;
  }
  function varOr(c, raw) {
    if (raw === void 0) return "";
    return c.rt.host.local.get(raw) ?? c.rt.host.global.get(raw) ?? raw;
  }
  async function book(c) {
    const file = varOr(c, str6(c, "file"));
    const found = file ? await m(c).findBook(file) : await m(c).chatBook(false);
    if (!found) throw new ScriptError(file ? `No lorebook named "${file}"` : "This chat has no lorebook yet (use /getchatbook)");
    return found;
  }
  function trackerError(e) {
    if (e instanceof TrackerPathError) throw new ScriptError(e.message);
    throw e;
  }
  var confirmedCharacterEdit = false;
  var marinaraCommands = [
    // ── tracker ──
    {
      name: "tracker-get",
      help: "Read the Tracker Panel: /tracker-get custom.affection | char.Ellie.mood | persona.HP | weather (no path → everything as JSON)",
      origin: "dispensa",
      run: async (c) => {
        try {
          return getTrackerValue(await m(c).getTracker(), text6(c));
        } catch (e) {
          trackerError(e);
        }
      }
    },
    {
      name: "tracker-set",
      split: true,
      splitCount: 1,
      help: "Change the Tracker Panel: /tracker-set [max=100] [color=#f66] [stat=on] char.Ellie.affection 15",
      origin: "dispensa",
      run: async (c) => {
        const list = parts2(c);
        const path = asText(list[0] ?? "");
        const value = list.slice(1).map((v) => asText(v)).join(" ");
        if (!path) throw new ScriptError("/tracker-set needs a path and a value");
        const opts = { color: str6(c, "color"), asStat: isTrue(str6(c, "stat") ?? "off") };
        if (str6(c, "max") !== void 0) opts.max = Number(str6(c, "max"));
        const state = await m(c).getTracker() ?? {};
        try {
          const fields = setTrackerValue(state, path, value, opts);
          await m(c).patchTracker(state, fields);
        } catch (e) {
          trackerError(e);
        }
        return value;
      }
    },
    {
      name: "tracker-add",
      split: true,
      splitCount: 1,
      help: "Add to a number in the Tracker Panel: /tracker-add char.Ellie.affection 5 (negative to subtract)",
      origin: "dispensa",
      run: async (c) => {
        const list = parts2(c);
        const path = asText(list[0] ?? "");
        const amount = Number(asText(list[1] ?? "1"));
        if (!path || Number.isNaN(amount)) throw new ScriptError("/tracker-add needs a path and a number");
        const state = await m(c).getTracker() ?? {};
        try {
          const current = Number(getTrackerValue(state, path) || 0);
          const next = String((Number.isNaN(current) ? 0 : current) + amount);
          const opts = { color: str6(c, "color") };
          if (str6(c, "max") !== void 0) opts.max = Number(str6(c, "max"));
          const fields = setTrackerValue(state, path, next, opts);
          await m(c).patchTracker(state, fields);
          return next;
        } catch (e) {
          trackerError(e);
        }
      }
    },
    {
      name: "agents-retry",
      help: `Run tracker agents again: /agents-retry [types…] (default: ${TRACKER_AGENTS.join(", ")}) → JSON list of agents that ran`,
      origin: "dispensa",
      run: async (c) => {
        const raw = text6(c);
        const types = raw ? raw.split(/[\s,]+/).filter(Boolean) : TRACKER_AGENTS;
        const { ran, errors } = await m(c).retryAgents(types);
        if (errors.length) c.rt.host.ui.toast(errors.join("\n"), "warning", { title: t("Agents", "에이전트") });
        return JSON.stringify(ran);
      }
    },
    // ── lorebooks (SillyTavern World Info names) ──
    {
      name: "getchatbook",
      help: "The chat's own lorebook (created when missing). Returns its name.",
      origin: "st",
      run: async (c) => (await m(c).chatBook(true))?.name ?? ""
    },
    {
      name: "findentry",
      help: "Find a lorebook entry: /findentry file=book [field=key] text → entry id",
      origin: "st",
      run: async (c) => {
        const b = await book(c);
        return findEntry(await m(c).entries(b.id), str6(c, "field") ?? "key", text6(c))?.id ?? "";
      }
    },
    {
      name: "getentryfield",
      help: "Read an entry field: /getentryfield file=book [field=content] id",
      origin: "st",
      run: async (c) => {
        const b = await book(c);
        const id = varOr(c, text6(c));
        const entry = (await m(c).entries(b.id)).find((e) => e.id === id);
        if (!entry) return "";
        try {
          return readEntryField(entry, str6(c, "field") ?? "content");
        } catch (e) {
          throw new ScriptError(e instanceof Error ? e.message : String(e));
        }
      }
    },
    {
      name: "setentryfield",
      help: "Change an entry field: /setentryfield file=book uid=id [field=content] text",
      origin: "st",
      run: async (c) => {
        const b = await book(c);
        const id = varOr(c, str6(c, "uid"));
        if (!id) throw new ScriptError("/setentryfield needs uid=");
        try {
          await m(c).patchEntry(b.id, id, entryPatch(str6(c, "field") ?? "content", asText(c.unnamed)));
        } catch (e) {
          throw new ScriptError(e instanceof Error ? e.message : String(e));
        }
        return "";
      }
    },
    {
      name: "createentry",
      help: "New lorebook entry: /createentry file=book [key=a,b] content → entry id",
      origin: "st",
      run: async (c) => {
        const b = await book(c);
        const keys = (str6(c, "key") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const content = asText(c.unnamed);
        const entry = await m(c).createEntry(b.id, { name: keys[0] ?? content.slice(0, 30) ?? "New entry", keys, content });
        return entry.id;
      }
    },
    {
      name: "lore-books",
      help: "Names of the lorebooks active in this chat (JSON list).",
      origin: "dispensa",
      run: async (c) => JSON.stringify((await m(c).activeBooks()).map((b) => b.name))
    },
    {
      name: "lore-list",
      help: "Entries of a lorebook as JSON [{id,name,keys,enabled}]: /lore-list [file=book]",
      origin: "dispensa",
      run: async (c) => {
        const b = await book(c);
        return JSON.stringify((await m(c).entries(b.id)).map((e) => ({ id: e.id, name: e.name ?? "", keys: e.keys ?? [], enabled: e.enabled !== false })));
      }
    },
    // ── characters and personas ──
    {
      name: "char-get",
      help: "Character card data: /char-get [char=name] [field=description] (no field → whole card as JSON)",
      origin: "st",
      run: async (c) => {
        const ch = await m(c).character(str6(c, "char") ?? str6(c, "name"));
        if (!ch) return "";
        const field = str6(c, "field");
        if (!field) return JSON.stringify(ch.data);
        const v = ch.data[field];
        return v === void 0 || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    },
    {
      name: "char-update",
      help: "Change the current character's card: /char-update [char=name] description=… personality=… (asks first)",
      origin: "st",
      run: async (c) => {
        const ch = await m(c).character(str6(c, "char"));
        if (!ch) throw new ScriptError("No character to update");
        const data = {};
        for (const [k, v] of Object.entries(c.named)) if (k !== "char") data[k] = asText(v);
        if (!Object.keys(data).length) return "";
        if (!confirmedCharacterEdit) {
          if (!await c.rt.host.confirm(t(`Change the character card? (${Object.keys(data).join(", ")})<br><small>Won't ask again until the page reloads.</small>`, `캐릭터 카드를 바꿀까요? (${Object.keys(data).join(", ")})<br><small>이번 화면에서는 다시 묻지 않아요.</small>`))) return "";
          confirmedCharacterEdit = true;
        }
        await m(c).updateCharacter(ch.id, data);
        return "";
      }
    },
    {
      name: "persona-get",
      help: "Your persona: /persona-get [field=description] (no field → JSON)",
      origin: "dispensa",
      run: async (c) => {
        const p = await m(c).persona();
        if (!p) return "";
        const field = str6(c, "field");
        if (!field) return JSON.stringify(p);
        const v = p[field];
        return v === void 0 || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    },
    // ── connections and prompt ──
    {
      name: "connection",
      help: "Show or switch this chat's AI connection: /connection [name] → connection name",
      origin: "dispensa",
      run: async (c) => {
        const wanted = text6(c);
        if (!wanted) return (await m(c).currentConnection())?.name ?? "";
        const list = await m(c).connections();
        const q = wanted.toLowerCase();
        const hit = list.find((x) => x.name.toLowerCase() === q) ?? list.find((x) => x.name.toLowerCase().includes(q)) ?? list.find((x) => x.id === wanted);
        if (!hit) throw new ScriptError(`No connection named "${wanted}" (have: ${list.map((x) => x.name).join(", ")})`);
        await m(c).setConnection(hit.id);
        return hit.name;
      }
    },
    {
      name: "connections",
      help: "Names of all AI connections (JSON list).",
      origin: "dispensa",
      run: async (c) => JSON.stringify((await m(c).connections()).map((x) => x.name))
    },
    {
      name: "peek-prompt",
      help: "The prompt the AI gets for this chat: /peek-prompt [format=text|json]",
      origin: "dispensa",
      run: async (c) => {
        const msgs = await m(c).peekPrompt();
        if (str6(c, "format") === "json") return JSON.stringify(msgs);
        return msgs.map((x) => `[${x.role}]
${x.content}`).join("\n\n");
      }
    },
    // ── chat ──
    { name: "getchatname", help: "This chat's name.", origin: "st", run: async (c) => m(c).chatName() },
    {
      name: "renamechat",
      help: "Rename this chat: /renamechat new name",
      origin: "st",
      run: async (c) => {
        if (!text6(c)) throw new ScriptError("/renamechat needs a name");
        await m(c).renameChat(text6(c));
        return "";
      }
    },
    { name: "newchat", help: "Start a new chat with the current character(s) and open it.", origin: "st", run: async (c) => m(c).newChat() },
    {
      name: "note",
      help: "Author's Note: /note text sets it; /note alone returns it.",
      origin: "st",
      run: async (c) => {
        if (!c.hasUnnamed || asText(c.unnamed) === "") return (await m(c).authorNote()).text;
        await m(c).setAuthorNote(asText(c.unnamed));
        return "";
      }
    },
    {
      name: "depth",
      help: "Author's Note depth: /depth 4 (alone → current depth).",
      origin: "st",
      run: async (c) => {
        if (!text6(c)) return String((await m(c).authorNote()).depth);
        const n = Number(text6(c));
        if (!Number.isInteger(n) || n < 0) throw new ScriptError("/depth needs a whole number");
        await m(c).setAuthorNote(void 0, n);
        return "";
      }
    },
    {
      name: "reload-page",
      help: "Reload Marinara (shows tracker and connection changes right away).",
      origin: "dispensa",
      run: async (c) => {
        await c.rt.host.flush();
        await m(c).reloadPage();
        return "";
      }
    }
  ];

  // src/stscript/commands/wand.ts
  var wandCommands = [
    {
      name: "visz",
      help: "🌟 Make a page from the text through the visualizer ([[…]] asks first): /visz [output=viewer|chat] topic → true when sent",
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.wand) throw new ScriptError("/visz only works inside Dispensa");
        const text7 = asText(c.unnamed).trim();
        if (!text7) throw new ScriptError("/visz needs a topic");
        const action = c.named.action === void 0 ? void 0 : asText(c.named.action);
        const output = c.named.output === void 0 ? void 0 : asText(c.named.output);
        if (action && action !== "viz" && action !== "ooc") throw new ScriptError('/visz action= is "viz" or "ooc"');
        if (output && output !== "viewer" && output !== "chat") throw new ScriptError('/visz output= is "viewer" or "chat"');
        return String(await c.rt.host.wand.run(text7, { action, output }));
      }
    }
  ];

  // src/stscript/commands/memo.ts
  function memo(c) {
    if (!c.rt.host.memo) throw new ScriptError(`/${c.node.name} only works inside Dispensa`);
    return c.rt.host.memo;
  }
  var memoCommands = [
    {
      name: "memo",
      help: '📝 Pick memos from the Memo pad → their text ("" when none): /memo [words to find]',
      origin: "dispensa",
      run: async (c) => await memo(c).pick(asText(c.unnamed).trim() || void 0) ?? ""
    },
    {
      name: "memo-add",
      help: "📝 Keep text in the Memo pad (OOC wrappers come off) → how many memos: /memo-add text",
      origin: "dispensa",
      run: (c) => {
        const text7 = asText(c.unnamed).trim();
        if (!text7) throw new ScriptError("/memo-add needs the text to keep");
        return String(memo(c).add(text7));
      }
    },
    {
      name: "memo-list",
      help: "📝 Every memo as a JSON list",
      origin: "dispensa",
      run: (c) => JSON.stringify(memo(c).list())
    },
    {
      name: "ooc",
      help: "💬 Send text as OOC the Memo pad's way (its sending setting and wrapper) → true when sent: /ooc text",
      origin: "dispensa",
      run: async (c) => {
        const text7 = asText(c.unnamed).trim();
        if (!text7) throw new ScriptError("/ooc needs the text to send");
        return String(await memo(c).ooc(text7));
      }
    }
  ];

  // src/stscript/registry.ts
  var CommandRegistry = class {
    map = /* @__PURE__ */ new Map();
    register(...defs) {
      for (const def of defs) {
        this.map.set(def.name, def);
        for (const alias of def.aliases ?? []) this.map.set(alias, def);
      }
      return this;
    }
    /** Takes a command out, under its name and aliases (another extension's, when it stops). */
    unregister(def) {
      for (const name of [def.name, ...def.aliases ?? []]) if (this.map.get(name) === def) this.map.delete(name);
    }
    get(name) {
      return this.map.get(name);
    }
    has(name) {
      return this.map.has(name);
    }
    list() {
      return [...new Set(this.map.values())].sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  // src/stscript/external.ts
  function addExternalCommand(registry, def) {
    const taken = (name) => {
      const there = registry.get(name);
      return !!there && there.origin !== "extension";
    };
    if (!def?.name || typeof def.run !== "function") throw new Error("A command needs a name and run()");
    if (taken(def.name)) throw new Error(`/${def.name} is one of Dispensa's own commands`);
    const command = {
      name: def.name,
      aliases: (def.aliases ?? []).filter((alias) => !taken(alias)),
      help: String(def.help ?? ""),
      origin: "extension",
      from: String(def.from ?? ""),
      run: async (c) => {
        const named = Object.fromEntries(Object.entries(c.named).map(([key2, value]) => [key2, asText(value)]));
        const result = await def.run({ text: asText(c.unnamed), named });
        return result === void 0 || result === null ? "" : String(result);
      }
    };
    registry.register(command);
    return () => registry.unregister(command);
  }

  // src/stscript/index.ts
  function createRegistry() {
    return new CommandRegistry().register(...coreCommands, ...chatCommands, ...textCommands, ...uiCommands, ...qrCommands, ...marinaraCommands, ...wandCommands, ...memoCommands);
  }

  // src/host/wand-host.ts
  function createWandHost(host) {
    return {
      ui: host.ui,
      generate: (prompt, connectionId) => host.chat.generate({ mode: "chat", prompt, connectionId }),
      postAsCharacter: (text7) => host.chat.send({ role: "assistant", text: text7 }),
      sendAsUser: async (text7) => {
        await submitThroughComposer(text7);
        host.chat.markStale();
      },
      putInInput: (text7) => {
        const composer = findComposer();
        if (!composer) {
          host.ui.toast(t("Couldn't find the input.", "입력창을 찾지 못했어요."), "warning", { title: "🌟" });
          return;
        }
        const current = composer.textarea.value;
        setComposerText(composer.textarea, current.trim() ? `${current.replace(/\s+$/, "")}
${text7}` : text7);
        composer.textarea.focus();
        host.ui.toast(t("Put in the input. Edit it, then send.", "입력창에 넣었어요. 고친 뒤 보내세요."), "info", { title: "🌟" });
      },
      guided: (text7) => host.chat.runNativeCommand(`/guided ${text7}`),
      chatInfo: async () => {
        const detail = await host.chat.sync().catch(() => null);
        return { chatId: detail?.id, chatName: detail?.name ?? void 0, character: host.chat.cast[0]?.name };
      },
      hasFornello: () => !!window.__fornello
    };
  }

  // src/qr/context.ts
  function hasMenu(state, item) {
    return !!item.contextList?.some((l) => state.sets.some((s) => s.id === l.setId));
  }
  function contextMenu(state, set, item) {
    return build(state, set, item, null, [], []);
  }
  function build(state, ownSet, item, chained, hierarchy, labels) {
    const groups = [];
    const script = joinChain(chained, item.script);
    for (const link of item.contextList ?? []) {
      const set = state.sets.find((s) => s.id === link.setId);
      if (!set || hierarchy.includes(set.id)) continue;
      const nextHierarchy = [...hierarchy, set.id];
      const nextLabels = [...labels, item.label];
      const own = set.id === ownSet.id || set.items.some((i) => i.id === item.id);
      const visible2 = set.items.filter((sub) => own ? sub.hidden && !!sub.icon?.trim() : !sub.hidden);
      const entries = visible2.map((sub) => {
        const passOn = link.chained && canChain(item, sub) ? script : null;
        const finalScript = joinChain(passOn, sub.script).replace(/%%parent(-\d+)?%%/g, (_, index) => nextLabels.slice(parseInt(index ?? "-1", 10))[0] ?? "");
        return {
          set,
          item: sub,
          run: { ...sub, script: finalScript },
          children: build(state, set, sub, passOn ? script : null, nextHierarchy, nextLabels)
        };
      });
      groups.push({ set, entries });
    }
    return groups;
  }
  function joinChain(parent, script) {
    return parent && script ? `${parent} | ${script}` : script;
  }
  function canChain(parent, sub) {
    return parent.kind === "script" && sub.kind === "script";
  }

  // src/ui/dom.ts
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key2, value] of Object.entries(attrs)) {
      if (value === void 0 || value === false) continue;
      if (key2.startsWith("on") && typeof value === "function") {
        node.addEventListener(key2.slice(2), value);
      } else if (key2 === "class") {
        if (value) node.className = String(value);
      } else if (value === true) {
        node.setAttribute(key2, "");
      } else {
        node.setAttribute(key2, String(value));
      }
    }
    for (const child of children) {
      if (child === null || child === void 0 || child === false) continue;
      node.append(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }
  var ICONS = {
    "chevron-down": ["m6 9 6 6 6-6"],
    "chevron-up": ["m18 15-6-6-6 6"],
    folder: ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
    settings: [
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
    ],
    square: ["M5 5h14v14H5z"],
    "message-circle": ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
    plus: ["M5 12h14", "M12 5v14"],
    trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
    upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
    download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
    play: ["m6 3 14 9-14 9V3z"],
    x: ["M18 6 6 18", "m6 6 12 12"],
    "arrow-up": ["m5 12 7-7 7 7", "M12 19V5"],
    "arrow-down": ["M12 5v14", "m19 12-7 7-7-7"],
    wand: ["m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72", "m14 7 3 3", "M5 6v4", "M19 14v4", "M10 2v2", "M7 8H3", "M21 16h-4", "M11 3H9"],
    sparkles: ["M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z", "M20 3v4", "M22 5h-4"],
    pin: ["M12 17v5", "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"],
    paperclip: ["m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"],
    star: ["M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"],
    archive: ["M3 3h18v5H3z", "M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8", "M10 12h4"],
    image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0", "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"],
    maximize: ["M8 3H5a2 2 0 0 0-2 2v3", "M21 8V5a2 2 0 0 0-2-2h-3", "M3 16v3a2 2 0 0 0 2 2h3", "M16 21h3a2 2 0 0 0 2-2v-3"],
    minimize: ["M8 3v3a2 2 0 0 1-2 2H3", "M21 8h-3a2 2 0 0 1-2-2V3", "M3 16h3a2 2 0 0 1 2 2v3", "M16 21v-3a2 2 0 0 1 2-2h3"],
    send: ["M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z", "m21.854 2.147-10.94 10.939"],
    "refresh-cw": ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"],
    "rectangle-ellipsis": ["M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z", "M12 12h.01", "M17 12h.01", "M7 12h.01"],
    "notebook-pen": ["M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4", "M2 6h4", "M2 10h4", "M2 14h4", "M2 18h4", "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"],
    grip: ["M9 5h.01", "M9 12h.01", "M9 19h.01", "M15 5h.01", "M15 12h.01", "M15 19h.01"],
    more: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
    copy: ["M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
    bug: ["m8 2 1.88 1.88", "M14.12 3.88 16 2", "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1", "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6", "M12 20v-9", "M6.53 9C4.6 8.8 3 7.1 3 5", "M6 13H2", "M3 21c0-2.1 1.7-3.9 3.8-4", "M20.97 5c0 2.1-1.6 3.8-3.5 4", "M22 13h-4", "M17.2 17c2.1.1 3.8 1.9 3.8 4"],
    "step-over": ["M3 12a9 9 0 0 1 15-6.7L21 8", "M21 3v5h-5", "M12 17h.01"],
    "step-into": ["M12 3v12", "m7 10 5 5 5-5", "M12 20h.01"],
    "step-out": ["M12 21V9", "m7 14 5-5 5 5", "M12 4h.01"],
    clipboard: ["M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"],
    eye: ["M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"]
  };
  function icon(name) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("lucide", `lucide-${name}`);
    for (const d of ICONS[name] ?? []) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  // src/ui/form.ts
  var FORM_CSS = `
.sec { display: flex; flex-direction: column; }
.sec + .sec { margin-top: 14px; }
.sec-h { display: flex; align-items: center; gap: 6px; min-height: 24px; margin: 0 0 2px; }
.sec-h h3 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .02em; color: var(--d-muted); }
.sec-h .spacer { flex: 1; }
.set { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; min-height: 42px; padding: 7px 0; border-top: 1px solid var(--d-divider); }
.sec-h + .set, .set:first-child { border-top: 0; }
.set > .lab { flex: 1 1 120px; min-width: 0; display: flex; align-items: center; gap: 6px; color: var(--d-text); font-size: 13px; }
.set > .ctl { margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 6px; max-width: 100%; min-width: 0; }
.set > .ctl > select, .set > .ctl > input:not([type=checkbox]):not([type=radio]) { width: auto; min-width: 130px; max-width: 100%; }
.set.stack > .ctl { flex: 1 1 100%; margin-left: 0; justify-content: flex-start; }
.set.stack > .ctl > * { flex: 1; }
.switch { position: relative; display: inline-flex; width: 36px; height: 20px; flex-shrink: 0; }
.switch input { appearance: none; -webkit-appearance: none; margin: 0; width: 100%; height: 100%; border-radius: 999px; cursor: pointer;
  background: var(--d-field); border: 1px solid var(--d-field-border); transition: background-color .18s ease, border-color .18s ease; }
.switch input:checked { background: var(--d-accent); border-color: var(--d-accent); }
.switch input:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--d-ring); }
.switch input:disabled { opacity: .45; cursor: not-allowed; }
.switch .knob { position: absolute; top: 4px; left: 4px; width: 12px; height: 12px; border-radius: 50%; pointer-events: none;
  background: var(--d-muted); transition: transform .18s ease, background-color .18s ease; }
.switch input:checked + .knob { transform: translateX(16px); background: var(--d-accent-text); }
/* fixed size whatever the surrounding button rules say */
button.help { position: relative; flex-shrink: 0; width: 16px !important; height: 16px !important; min-width: 16px !important; padding: 0 !important; border-radius: 50% !important; display: inline-grid; place-items: center;
  font: 700 10px/1 var(--d-font); color: var(--d-muted); background: transparent; border: 1px solid var(--d-line); cursor: help; }
button.help::after { content: ""; position: absolute; inset: -8px; }
button.help:hover, button.help[aria-expanded="true"] { color: var(--d-hl-text); border-color: var(--d-btn-border-hover); background: var(--d-hl-bg); transform: none; }
.tip { position: fixed; z-index: 2147483000; max-width: min(300px, calc(100vw - 24px)); padding: 9px 12px; white-space: pre-line;
  font: 400 12.5px/1.55 var(--d-font); color: var(--d-text); background: var(--d-panel-solid); border: 1px solid var(--d-line);
  border-radius: var(--d-radius-sm); box-shadow: var(--d-shadow); animation: d-tip-in .12s ease-out; }
@keyframes d-tip-in { from { opacity: 0; transform: translateY(-3px); } }
.seg2 { position: relative; display: inline-flex; align-items: stretch; padding: 3px; border-radius: 999px; background: var(--d-field); border: 1px solid var(--d-field-border); max-width: 100%; }
.seg2 > button { position: relative; z-index: 1; flex: 1 1 auto; width: auto !important; min-width: 0; justify-content: center; border: 0 !important; background: transparent !important; box-shadow: none !important; transform: none !important;
  color: var(--d-muted); font-weight: 600; padding: 5px 14px; border-radius: 999px; transition: color .2s ease; }
.seg2 > button:hover { color: var(--d-text); }
.seg2 > button[aria-pressed="true"] { color: var(--d-btn-text-active); }
.seg2 > button:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--d-ring) !important; }
.seg2 > .pill { position: absolute; z-index: 0; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 999px; pointer-events: none;
  background: var(--d-btn-bg-active); border: 1px solid var(--d-btn-border-active); box-shadow: 0 1px 4px rgb(0 0 0 / .18);
  transition: transform .26s cubic-bezier(.3, .7, .2, 1), width .26s cubic-bezier(.3, .7, .2, 1); }
.d-enter { animation: d-pop-in .18s ease-out; }
@keyframes d-pop-in { from { opacity: 0; transform: translateY(8px) scale(.985); } }
.d-fade { animation: d-fade-in .18s ease-out; }
@keyframes d-fade-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;
  function h(tag, cls, ...kids) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    for (const k of kids) if (k !== null && k !== void 0 && k !== false) node.append(k);
    return node;
  }
  var open = null;
  var hoverTimer = null;
  var tipCount = 0;
  function closeTip() {
    if (!open) return;
    open.tip.remove();
    open.btn.setAttribute("aria-expanded", "false");
    open = null;
    document.removeEventListener("pointerdown", onOutside, true);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("scroll", closeTip, true);
    window.removeEventListener("resize", closeTip);
  }
  function onOutside(e) {
    if (!open) return;
    const path = e.composedPath();
    if (!path.includes(open.btn) && !path.includes(open.tip)) closeTip();
  }
  function onKey(e) {
    if (e.key !== "Escape" || !open) return;
    e.preventDefault();
    e.stopPropagation();
    open.btn.focus();
    closeTip();
  }
  function showTip(btn, text7, pinned) {
    if (open?.btn === btn) {
      open.pinned ||= pinned;
      return;
    }
    closeTip();
    const tip = h("div", "tip", text7);
    tip.id = `d-tip-${++tipCount}`;
    tip.setAttribute("role", "tooltip");
    const root = btn.getRootNode();
    (root instanceof ShadowRoot ? root : document.body).append(tip);
    const r = btn.getBoundingClientRect();
    const w = tip.offsetWidth;
    const ht = tip.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    const below = r.bottom + 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${below + ht > window.innerHeight - 8 ? Math.max(8, r.top - ht - 8) : below}px`;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-describedby", tip.id);
    open = { btn, tip, pinned };
    document.addEventListener("pointerdown", onOutside, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", closeTip, true);
    window.addEventListener("resize", closeTip);
  }
  function helpTip(text7, about = "") {
    const btn = h("button", "help", "?");
    btn.type = "button";
    btn.setAttribute("aria-label", about ? t(`Help: ${about}`, `도움말: ${about}`) : t("Help", "도움말"));
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (open?.btn === btn && open.pinned) closeTip();
      else showTip(btn, text7, true);
    });
    btn.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => showTip(btn, text7, false), 280);
    });
    btn.addEventListener("pointerleave", () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      if (open?.btn === btn && !open.pinned) closeTip();
    });
    return btn;
  }
  function toggle(checked, onChange, label, key2) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.setAttribute("role", "switch");
    input.setAttribute("aria-label", label);
    if (key2) input.dataset.key = key2;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    input.addEventListener("change", () => {
      const on = input.checked;
      if (calm) onChange(on);
      else setTimeout(() => onChange(on), 170);
    });
    return h("label", "switch", input, h("span", "knob"));
  }
  function setting(label, control, help, opts = {}) {
    const name = typeof label === "string" ? label : "";
    return h(
      "div",
      `set${opts.stack ? " stack" : ""}`,
      h("div", "lab", typeof label === "string" ? h("span", "", label) : label, help ? helpTip(help, name) : null),
      h("div", "ctl", ...Array.isArray(control) ? control : [control])
    );
  }
  function section(title, help, extra, ...kids) {
    return h("section", "sec", h("div", "sec-h", h("h3", "", title), help ? helpTip(help, title) : null, h("span", "spacer"), ...extra), ...kids);
  }
  var livePill = /* @__PURE__ */ new Map();
  function segmented(key2, options, active, onChange, label) {
    const bar = h("div", "seg2");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", label);
    const pill = h("span", "pill");
    bar.append(pill);
    const buttons = options.map((o) => {
      const b = h("button", "", o.label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(o.value === active));
      if (o.title) {
        b.title = o.title;
        b.setAttribute("aria-label", o.title);
      }
      b.addEventListener("click", () => {
        if (o.value !== active) onChange(o.value);
      });
      bar.append(b);
      return b;
    });
    const place = (value, animate) => {
      const b = buttons[options.findIndex((o) => o.value === value)];
      if (!b || !b.offsetWidth) return false;
      pill.style.transition = animate ? "" : "none";
      pill.style.width = `${b.offsetWidth}px`;
      pill.style.transform = `translateX(${b.offsetLeft}px)`;
      return true;
    };
    const old = livePill.get(key2);
    let startAt = null;
    if (old?.isConnected && old.offsetWidth) startAt = { x: new DOMMatrixReadOnly(getComputedStyle(old).transform).m41, w: old.offsetWidth };
    livePill.set(key2, pill);
    let tries = 0;
    const start2 = () => {
      if (!bar.isConnected || !place(active, false)) {
        if (++tries < 30) requestAnimationFrame(start2);
        return;
      }
      if (startAt) {
        pill.style.width = `${startAt.w}px`;
        pill.style.transform = `translateX(${startAt.x}px)`;
        void pill.offsetWidth;
        place(active, true);
      }
      watch();
    };
    const watch = () => {
      setTimeout(() => new ResizeObserver(() => place(active, false)).observe(bar), 320);
    };
    requestAnimationFrame(start2);
    return bar;
  }

  // src/ui/wand-panel.ts
  var WAND_STYLE = `
.wand-pop { width: min(440px, calc(100vw - 16px)); gap: 6px; }
.wand-pop .tabs { display: flex; gap: 4px; align-items: center; }
.wand-pop .tabs > button { width: auto; padding: 3px 10px; }
.wand-pop textarea { width: 100%; min-height: 52px; max-height: 30vh; resize: vertical; }
.wand-pop textarea { font-size: 13px; }
.wand-pop .acts { display: flex; gap: 4px; flex-wrap: nowrap; align-items: center; }
/* action buttons: label in the middle (list rows stay left-aligned) */
.wand-pop .acts button { width: auto; flex: none; justify-content: center; text-align: center; }
.wand-pop .acts button.main { flex: 1 1 auto; }
.wand-pop .acts button > .t { flex: 0 1 auto; text-align: center; }
.wand-pop .folder { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--d-muted); padding: 4px 4px 0; letter-spacing: .02em; }
.wand-pop .line { display: flex; gap: 3px; align-items: center; }
.wand-pop .line > button:first-child { flex: 1; min-width: 0; }
.wand-pop .line > button.mini { width: auto; flex: none; padding: 4px 6px; background: transparent; border-color: transparent; color: var(--d-muted); font-weight: 500; }
.wand-pop .line > button.mini:hover { background: var(--d-hl-bg); color: var(--d-hl-text); }
.wand-pop .line > button.mini.on { color: var(--d-accent); }
.wand-pop .meta { flex: none; margin-left: auto; font-size: 11px; color: var(--d-muted); font-weight: 500; }
.wand-pop .none { color: var(--d-muted); padding: 6px 4px; font-size: 12px; }
button.wand.busy { border-color: var(--d-btn-border-active); color: var(--d-btn-text-active); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .55; } }
@media (prefers-reduced-motion: reduce) { button.wand.busy { animation: none; } }
`;
  var actionIcon = (a) => a === "viz" ? "🌟" : "💬";
  var WandPanel = class {
    constructor(deps) {
      this.deps = deps;
      this.box = el("textarea", {
        part: "wand-input",
        rows: "2"
      });
      this.box.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.isComposing) {
          e.preventDefault();
          this.runTyped("viz");
        }
      });
      this.list = el("div", { class: "list" });
      this.element = el("div", { class: "pop wand-pop", part: "wand-menu", role: "dialog" });
      this.render();
    }
    element;
    box;
    list;
    tab = "items";
    archive = [];
    /** Called when the menu opens. */
    async refresh() {
      this.render();
      if (this.tab === "archive") await this.loadArchive();
      setTimeout(() => this.box.focus(), 0);
    }
    render() {
      this.box.placeholder = t("Topic of the page to make", "만들 페이지의 주제");
      this.box.setAttribute("aria-label", t("Visualizer request", "비주얼라이저 요청"));
      this.element.setAttribute("aria-label", t("Visualizer", "비주얼라이저"));
      const tabs = el(
        "div",
        { class: "tabs" },
        segmented(
          "wand-menu",
          [
            { value: "items", label: t("Items", "항목") },
            { value: "archive", label: t("Gallery", "갤러리"), title: t("Gallery: pages you made", "갤러리: 만든 페이지 모음") }
          ],
          this.tab,
          (v) => this.switchTab(v),
          t("Visualizer menu", "비주얼라이저 메뉴")
        ),
        el("span", { class: "meta" }),
        helpTip(
          t(
            "· 🌟 Make page: makes an HTML page from the topic (Ctrl+Enter)\n· 📝 Memo pad: puts picked memos in the topic box\n· [[place]], [[mood|bright|dark]]: asked when run. [[memo]] picks from the Memo pad\n· ☆: saves the topic to the Memo pad\n· Items: QRs in the Library's 'Visualizer' set\n· Gallery: pages you made",
            "· 🌟 페이지 만들기: 적은 주제로 HTML 페이지 만들기 (Ctrl+Enter)\n· 📝 메모장: 메모를 골라 주제 칸에 넣기\n· [[장소]], [[분위기|밝게|어둡게]]: 실행할 때 물어봄. [[메모]]는 메모장에서 고르기\n· ☆: 적은 주제를 메모장에 저장\n· 항목: 보관함 '비주얼라이저' 세트의 QR\n· 갤러리: 만든 페이지 모음"
          ),
          t("Visualizer menu", "비주얼라이저 메뉴")
        ),
        el("button", { class: "mini ghost", title: t("Visualizer settings", "비주얼라이저 설정"), "aria-label": t("Visualizer settings", "비주얼라이저 설정"), onclick: () => this.deps.openSettings() }, icon("settings"))
      );
      if (this.tab === "archive") {
        this.renderArchive();
        this.element.replaceChildren(tabs, this.list);
        return;
      }
      const acts = el(
        "div",
        { class: "acts" },
        el("button", { part: "wand-memo", title: t("Pick from the Memo pad into the topic box", "메모장에서 골라 주제 칸에 넣기"), onclick: () => void this.load() }, t("📝 Memo pad", "📝 메모장")),
        el("button", { part: "wand-viz", class: "main", title: t("Make an HTML page from the topic (Ctrl+Enter)", "적은 주제로 HTML 페이지 만들기 (Ctrl+Enter)"), onclick: () => this.runTyped("viz") }, el("span", { class: "t" }, t("🌟 Make page", "🌟 페이지 만들기"))),
        el("button", { class: "mini ghost", title: t("Save this topic to the Memo pad", "이 주제를 메모장에 저장"), "aria-label": t("Save to the Memo pad", "메모장에 저장"), onclick: () => this.saveTyped() }, icon("star"))
      );
      this.renderItems();
      this.element.replaceChildren(tabs, this.box, acts, this.list);
    }
    switchTab(tab) {
      this.tab = tab;
      this.render();
      if (tab === "archive") void this.loadArchive();
    }
    /** The 비주얼라이저 set's QRs (whole QRs that make pages). */
    renderItems() {
      const set = builtinSet(this.deps.qrStore.value, "viz");
      const items = set?.items ?? [];
      this.list.replaceChildren();
      if (!set || !items.length) {
        this.list.append(el("div", { class: "none" }, t("QRs in the Library's 'Visualizer' set show up here.", "보관함의 '비주얼라이저' 세트에 QR을 넣으면 여기에 나와요.")));
        return;
      }
      for (const item of items) {
        this.list.append(
          el(
            "div",
            { class: "line" },
            el(
              "button",
              { part: "wand-item", title: item.title || item.label, onclick: () => (this.deps.close(), this.deps.run(set, item)) },
              el("span", { class: "t" }, `${item.icon ? `${item.icon} ` : ""}${item.label}`)
            )
          )
        );
      }
    }
    async loadArchive() {
      try {
        this.archive = await this.deps.service.archive.list();
      } catch (e) {
        this.archive = [];
        this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Gallery", "갤러리") });
      }
      if (this.tab === "archive") this.renderArchive();
    }
    renderArchive() {
      this.list.replaceChildren();
      if (!this.archive.length) {
        this.list.append(el("div", { class: "none" }, t("The Gallery is empty. Press ☆ in the viewer to collect pages here.", "갤러리가 비어 있어요. 보기 창에서 ☆를 누르면 여기에 모여요.")));
        return;
      }
      for (const entry of this.archive) {
        const when = new Date(entry.createdAt);
        const date = `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
        this.list.append(
          el(
            "div",
            { class: "line" },
            el(
              "button",
              {
                part: "wand-archive-item",
                title: [entry.character, entry.chatName].filter(Boolean).join(" · "),
                onclick: () => {
                  this.deps.viewer()?.show({ title: entry.title, kind: entry.kind, text: entry.text, archivedId: entry.id });
                  this.deps.close();
                }
              },
              el("span", { class: "t" }, `${actionIcon(entry.kind)} ${entry.title}`),
              el("span", { class: "meta" }, date)
            ),
            el(
              "button",
              {
                class: "mini",
                title: t("Delete", "지우기"),
                "aria-label": t("Delete", "지우기"),
                onclick: async () => {
                  if (!await this.deps.ui.confirm(t(`Delete "${entry.title}" from the Gallery?`, `갤러리에서 "${entry.title}"을(를) 지울까요?`))) return;
                  await this.deps.service.archive.remove(entry.id);
                  await this.loadArchive();
                }
              },
              icon("trash")
            )
          )
        );
      }
    }
    runTyped(action) {
      const text7 = this.box.value;
      if (!text7.trim()) {
        this.box.focus();
        return;
      }
      this.deps.close();
      void this.deps.service.run(action, text7).then((sent) => {
        if (sent && this.box.value === text7) this.box.value = "";
      });
    }
    saveTyped() {
      const text7 = this.box.value.trim();
      if (!text7) return;
      this.deps.addMemo(text7);
      this.deps.ui.toast(t("Saved to the Memo pad.", "메모장에 저장했어요."), "success", { title: "📝" });
    }
    insert(text7) {
      const box = this.box;
      const start2 = box.selectionStart ?? box.value.length;
      const end = box.selectionEnd ?? start2;
      const before = box.value.slice(0, start2);
      const gap = before && !before.endsWith("\n") ? "\n\n" : "";
      box.value = before + gap + text7 + box.value.slice(end);
      const caret = (before + gap + text7).length;
      box.focus();
      box.setSelectionRange(caret, caret);
    }
    /** Memos from the 메모장 into the box. */
    async load() {
      const text7 = await this.deps.pickMemos();
      if (text7) this.insert(text7);
      else this.box.focus();
    }
  };

  // src/wand/items.ts
  var VIZ_SET = { name: () => t("Visualizer", "비주얼라이저"), icon: "🌟" };

  // src/wand/defaults.ts
  var DEFAULT_ITEMS = [
    {
      "id": "sample-community",
      "emoji": "📰",
      get title() {
        return t("Community reactions", "커뮤니티 반응");
      },
      get folder() {
        return t("Community", "커뮤니티");
      },
      "defaultAction": "ooc",
      "content": "Pause the Current RP. Show online community threads (posts + comments) about recent events.\n\n## Output Guidelines\n\n- Write 12–15 threads posted across 5 different community boards.\n- Give each board 2–5 full threads.\n- Include 2 NSFW boards as well.\n- Show not only the posts but all of their comments too (7–30 per thread, depending on how popular the post is).\n- Be realistic, and depict controversial content explicitly. The goal is to show realistic posts and comments as they are, without toning anything down.\n- If a thread is a debate, let many comments show how the argument unfolds.\n- Imitate the style of real online communities.\n\n## Visualization\n\nVisualize the content written under the guidelines above as multiple HTML outputs. Imitate the UI and board style of online communities. Each HTML must be one complete HTML output wrapped in ```html...```. Style the HTML outputs with CSS and JavaScript. Make them interactive.",
      "connectionId": null,
      "pinned": false
    },
    {
      "id": "sample-wedding",
      "emoji": "💌",
      get title() {
        return t("Mobile wedding invitation", "모바일 청첩장");
      },
      get folder() {
        return t("Anniversaries", "기념일");
      },
      "defaultAction": "viz",
      get content() {
        return t("A mobile wedding invitation for {{char}} and {{user}}. The mood of the vows: [[Mood of the vows]].", "{{char}}와 {{user}}의 모바일 청첩장. 서약문의 분위기는 [[서약문 분위기]].");
      },
      "connectionId": null,
      "pinned": false
    },
    {
      "id": "sample-diary",
      "emoji": "📔",
      get title() {
        return t("Secret diary", "비밀 일기장");
      },
      get folder() {
        return t("Personal", "개인");
      },
      "defaultAction": "viz",
      get content() {
        return t("The diary {{char}} shows no one. Mostly honest entries about recent events.", "{{char}}가 아무에게도 보여주지 않는 일기장. 최근 사건에 대한 솔직한 기록 위주로.");
      },
      "connectionId": null,
      "pinned": false
    },
    {
      "id": "sample-phone",
      "emoji": "📱",
      get title() {
        return t("Phone home screen", "휴대폰 홈 화면");
      },
      get folder() {
        return t("Personal", "개인");
      },
      "defaultAction": "viz",
      get content() {
        return t(
          "{{char}}'s phone home screen. Tapping an app icon opens that app's screen (messages, photos, notes and so on), and a back button returns to the home screen.",
          "{{char}}의 휴대폰 홈 화면. 앱 아이콘을 누르면 메시지 · 사진첩 · 메모 같은 각 앱 화면이 열리고, 뒤로 가기로 돌아올 수 있다."
        );
      },
      "connectionId": null,
      "pinned": false
    }
  ];
  var DEFAULT_OOC_TEMPLATE = "<System>\n{{내용}}\n</System>";
  var OLD_COMMUNITY_TEXT = "Pause the Current RP. 최근 사건에 관한 온라인 커뮤니티 Threads(Post+Comments)들을 보여주세요.\n\n## 출력 지침\n\n- 다양한 커뮤니티 게시판(5개)에 게시된 각각의 Thread들(12개-15개)을 작성하세요.\n- 각각의 게시판마다 2-5개의 Full threads가 배정됩니다.\n- NSFW 게시판도 2개 보여주세요.\n- 본문(post) 뿐만 아니라 comments(글의 인기에 따라 7-30개)들도 전부 볼수 있게 하세요.\n- 사실적으로, 논란의 여지가 있는 내용도 노골적으로 묘사하세요. 수위조절 없이 현실적인 posts과 comments들을 그대로 보여주는 것이 목표입니다.\n- 논쟁이 이루어지는 thread라면 많은 comments로 논쟁 흐름이 드러나게 하세요.\n- 실제 온라인 커뮤니티의 스타일을 모방합니다.\n\n## 시각화\n\n위 출력 지침에 따라 생성된 내용물들을 여러 개의 html 출력물로 시각화해주세요. 온라인 커뮤니티의 UI와 게시판 스타일을 모방합니다. 각각의 html은 ```html...```로 감싸인 하나의 완전한 html 출력물이어야합니다. html구조의 출력물들은 CSS과 JavaScript을 이용해 스타일링합니다. interactive한 출력물로 만드세요.";
  var OLD_OOC_TEMPLATES = ["<System>\n[OOC] 진행 중인 RP를 잠시 멈추고, 아래 요청에 맞는 결과물만 출력한다.\n[언어 지침] 모든 결과물은 다음 언어로 출력한다: {{언어}}\n\n{{내용}}\n</System>"];
  var CONTINUE_TEMPLATE = "<System>\nThe HTML you wrote earlier was cut off before it was finished. This is everything written so far:\n```html\n{{앞부분}}\n```\nContinue the code from EXACTLY where it stops. Output ONLY the remaining code: do not repeat anything already written, do not restart the document, do not explain, and do not wrap it in a Markdown code block. Close every open tag and end with </html>.\n</System>";
  var DEFAULT_WRAPPERS = [
    {
      id: "system",
      get name() {
        return t("<System> block", "<System> 블록");
      },
      template: DEFAULT_OOC_TEMPLATE
    },
    { "id": "ooc-paren", "name": "((OOC: …))", "template": "((OOC: {{내용}}))" },
    { "id": "ooc-bracket", "name": "[OOC: …]", "template": "[OOC: {{내용}}]" },
    {
      id: "raw",
      get name() {
        return t("No wrapper", "감싸지 않음");
      },
      template: "{{내용}}"
    }
  ];

  // src/memo/model.ts
  var REWRITTEN = /* @__PURE__ */ new Map([[OLD_COMMUNITY_TEXT, DEFAULT_ITEMS.find((i) => i.id === "sample-community")?.content ?? OLD_COMMUNITY_TEXT]]);
  var emptyMemos = () => ({ version: 1, memos: [], showButton: true, barIcon: "📝" });
  function newMemo(text7, at = Date.now()) {
    return { id: newId("memo"), text: text7.trim(), createdAt: at };
  }
  function normalizeMemos(raw) {
    const base = emptyMemos();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    return {
      version: 1,
      memos: Array.isArray(r.memos) ? r.memos.filter((m2) => m2 && typeof m2.text === "string").map((m2) => ({ id: typeof m2.id === "string" ? m2.id : newId("memo"), text: REWRITTEN.get(m2.text) ?? m2.text, createdAt: Number(m2.createdAt) || 0, ...m2.pinned ? { pinned: true } : {} })) : [],
      showButton: r.showButton !== false,
      barIcon: typeof r.barIcon === "string" && r.barIcon.trim() ? r.barIcon.trim() : base.barIcon,
      ...r.capture === false ? { capture: false } : {},
      ...r.moved ? { moved: true } : {},
      ...r.vizMoved ? { vizMoved: true } : {}
    };
  }
  function memosFrom(text7, at = Date.now()) {
    return extractOocNotes(text7).map((t2) => t2.trim()).filter(Boolean).map((t2, i) => newMemo(t2, at + i));
  }
  var fold = (s) => s.normalize("NFC").toLowerCase();
  function shownMemos(memos, query = "") {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return memos.filter((m2) => words.every((w) => fold(m2.text).includes(w))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt - a.createdAt);
  }
  function memoLine(text7, max = 80) {
    const one = text7.replace(/\s+/g, " ").trim();
    return one.length > max ? `${one.slice(0, max - 1)}…` : one;
  }
  function oocText(item) {
    if (item.kind === "viz") return item.script;
    return (item.ooc ?? item.title ?? item.script.replace(/^\/guided\s+/, "")).trim();
  }
  function moveOocToMemos(qr2, memo2, at = Date.now()) {
    const moved = [];
    for (const set of qr2.sets) {
      const keep = [];
      for (const item of set.items) {
        const isOoc = item.kind === "ooc" || item.kind === "viz" && item.viz?.action === "ooc";
        const text7 = isOoc ? oocText(item) : "";
        if (isOoc && text7) moved.push(newMemo(text7, at - moved.length));
        else if (!isOoc) keep.push(item);
      }
      set.items = keep;
    }
    for (const set of qr2.sets.filter((s) => s.name === "OOC" && !s.items.length)) forgetSet(qr2, set.id);
    qr2.sets = qr2.sets.filter((s) => !(s.name === "OOC" && !s.items.length));
    const viz = builtinSet(qr2, "viz");
    if (viz) viz.enabled = false;
    memo2.memos.push(...moved);
    memo2.moved = true;
    return moved.length;
  }
  var VIZ_QRS = () => [
    { label: t("Superviz", "슈퍼비즈"), icon: "🌟", title: t("Ask for a topic and make a page", "주제를 물어서 페이지 만들기"), script: t("/visz [[Topic of the page]]", "/visz [[만들 페이지의 주제]]") },
    { label: t("From the last message", "마지막 메시지로"), icon: "🎬", title: t("A page of the last message's scene", "마지막 메시지의 장면을 페이지로"), script: t("/visz A page of this scene: {{lastMessage}}", "/visz 이 장면을 담은 페이지: {{lastMessage}}") },
    { label: t("From a memo", "메모로"), icon: "📝", title: t("A page from a memo picked in the memo pad", "메모장에서 고른 메모로 페이지 만들기"), script: t("/visz [[memo]]", "/visz [[메모]]") }
  ];
  function vizSetWithQrs(qr2) {
    let set = builtinSet(qr2, "viz");
    if (!set) {
      set = { ...newSet(VIZ_SET.name()), icon: VIZ_SET.icon, enabled: false, builtin: "viz" };
      qr2.sets.push(set);
    }
    if (!set.items.length) for (const v of VIZ_QRS()) set.items.push({ ...newItem(v.label, v.script), icon: v.icon, title: v.title });
    return set;
  }
  function retireVizQrs(qr2, memo2, at = Date.now()) {
    const have = new Set(memo2.memos.map((m2) => m2.text));
    let n = 0;
    for (const set of qr2.sets) {
      const keep = [];
      for (const item of set.items) {
        if (item.kind !== "viz") {
          keep.push(item);
          continue;
        }
        const text7 = item.script.trim();
        if (text7 && !have.has(text7)) {
          memo2.memos.push(newMemo(text7, at - n++));
          have.add(text7);
        }
        if (item.viz?.pinned) {
          const target = barSet(qr2);
          const made = { ...newItem(item.label, `/visz ${text7.replace(/[|\\]/g, (c) => `\\${c}`)}`), ...item.icon ? { icon: item.icon } : {} };
          target.items.push(made);
          addToBar(qr2, { kind: "qr", setId: target.id, itemId: made.id });
        }
      }
      set.items = keep;
    }
    vizSetWithQrs(qr2);
    memo2.vizMoved = true;
    return n;
  }

  // src/ui/memo-panel.ts
  var MEMO_STYLE = `
.memo-pop .head-line { display: flex; align-items: center; gap: 6px; }
.memo-pop .head-line strong { font-size: 13px; color: var(--d-title); white-space: nowrap; }
.memo-pop .head-line > button { width: auto; flex: none; }
.memo-pop .head-line .grow { flex: 1; }
.memo-pop input[type=search] { width: 100%; }

`;
  var SEARCH_FROM = 6;
  var MemoPanel = class {
    constructor(deps) {
      this.deps = deps;
      this.box = el("textarea", { part: "memo-input", rows: "2" });
      this.box.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.isComposing) {
          e.preventDefault();
          void this.sendTyped();
        }
      });
      this.search = el("input", { type: "search", part: "memo-search", oninput: () => this.renderList() });
      this.list = el("div", { class: "list" });
      this.element = el("div", { class: "pop wand-pop memo-pop", part: "memo-menu", role: "dialog" });
      this.render();
    }
    element;
    box;
    search;
    list;
    /** Called when the menu opens. */
    refresh() {
      this.render();
      setTimeout(() => this.box.focus(), 0);
    }
    render() {
      this.box.placeholder = t("OOC or memo", "OOC나 메모");
      this.box.setAttribute("aria-label", t("Memo", "메모"));
      this.search.placeholder = t("Search memos", "메모 찾기");
      this.search.setAttribute("aria-label", t("Search memos", "메모 찾기"));
      this.element.setAttribute("aria-label", t("Memo pad", "메모장"));
      const head = el(
        "div",
        { class: "head-line" },
        el("strong", {}, t("📝 Memo pad", "📝 메모장")),
        el("span", { class: "grow" }),
        helpTip(
          t(
            "· 💬 Send OOC: sends the text as OOC (Ctrl+Enter). The way is set in settings\n· To input: puts it in the chat input\n· ☆: saves to the Memo pad\n· Click a memo below to load it into the box above\n· The 📝 button that shows up when you select chat text also saves",
            "· 💬 OOC 보내기: 적은 글을 OOC로 보내기 (Ctrl+Enter). 방식은 설정에서\n· 입력창에 넣기: 채팅 입력창에 넣기\n· ☆: 메모장에 저장\n· 아래 메모를 누르면 위 칸으로 불러오기\n· 채팅에서 글을 긁으면 뜨는 📝 버튼으로도 저장"
          ),
          t("Memo pad", "메모장")
        ),
        el("button", { class: "mini ghost", title: t("Memo pad and settings", "메모장 관리와 설정"), "aria-label": t("Memo pad settings", "메모장 설정"), onclick: () => this.deps.openSettings() }, icon("settings"))
      );
      const acts = el(
        "div",
        { class: "acts" },
        el("button", { part: "memo-ooc", class: "main", title: t("Send as OOC (Ctrl+Enter)", "OOC로 보내기 (Ctrl+Enter)"), onclick: () => void this.sendTyped() }, el("span", { class: "t" }, t("💬 Send OOC", "💬 OOC 보내기"))),
        el("button", { part: "memo-input-put", title: t("Put in the chat input", "채팅 입력창에 넣기"), onclick: () => this.putTyped() }, t("To input", "입력창에")),
        el("button", { class: "mini ghost", part: "memo-save", title: t("Save to the Memo pad", "메모장에 저장"), "aria-label": t("Save to the Memo pad", "메모장에 저장"), onclick: () => this.saveTyped() }, icon("star"))
      );
      const many = this.deps.store.value.memos.length >= SEARCH_FROM;
      this.renderList();
      this.element.replaceChildren(head, this.box, acts, ...many ? [this.search] : [], this.list);
    }
    renderList() {
      const all = this.deps.store.value.memos;
      const shown = shownMemos(all, all.length >= SEARCH_FROM ? this.search.value : "");
      this.list.replaceChildren();
      if (!all.length) {
        this.list.append(el("div", { class: "none" }, t("No memos. Type above and press ☆, or select text in the chat and press 📝.", "메모가 없어요. 위에 적고 ☆을 누르거나, 채팅에서 글을 긁어 📝을 누르세요.")));
        return;
      }
      if (!shown.length) this.list.append(el("div", { class: "none" }, t("No matching memos.", "찾는 메모가 없어요.")));
      for (const memo2 of shown) {
        this.list.append(
          el(
            "div",
            { class: "line" },
            el("button", { part: "memo-item", title: memo2.text.slice(0, 400), onclick: () => this.load(memo2.text) }, el("span", { class: "t" }, `${memo2.pinned ? "⭐ " : ""}${memoLine(memo2.text, 120)}`)),
            el("button", { class: "mini", title: t("Send as OOC now", "바로 OOC로 보내기"), "aria-label": t("Send as OOC", "OOC로 보내기"), onclick: () => void this.send(memo2.text) }, "💬"),
            el(
              "button",
              {
                class: `mini${memo2.pinned ? " on" : ""}`,
                title: memo2.pinned ? t("Unpin", "고정 풀기") : t("Pin to top", "위에 고정"),
                "aria-pressed": String(!!memo2.pinned),
                onclick: () => this.deps.store.update((s) => {
                  const m2 = s.memos.find((x) => x.id === memo2.id);
                  if (!m2) return;
                  if (m2.pinned) delete m2.pinned;
                  else m2.pinned = true;
                })
              },
              icon("pin")
            )
          )
        );
      }
    }
    load(text7) {
      this.box.value = text7;
      this.box.focus();
      this.box.setSelectionRange(text7.length, text7.length);
    }
    async send(text7) {
      this.deps.close();
      return this.deps.sendOoc(text7);
    }
    async sendTyped() {
      const text7 = this.box.value;
      if (!text7.trim()) {
        this.box.focus();
        return;
      }
      if (await this.send(text7) && this.box.value === text7) this.box.value = "";
    }
    putTyped() {
      const text7 = this.box.value.trim();
      if (!text7) return;
      this.deps.putInInput(text7);
      this.box.value = "";
      this.deps.close();
    }
    saveTyped() {
      const text7 = this.box.value.trim();
      if (!text7) return;
      const memos = memosFrom(text7);
      this.deps.store.update((s) => s.memos.push(...memos));
      this.box.value = "";
      this.deps.ui.toast(memos.length > 1 ? t(`Saved ${memos.length} memos.`, `메모 ${memos.length}개를 저장했어요.`) : t("Saved to the Memo pad.", "메모장에 저장했어요."), "success", { title: "📝" });
    }
  };

  // src/ui/bar.ts
  var WAND_MENU = "\0wand";
  var MEMO_MENU = "\0memo";
  var PER_ROW = 8;
  var EMOJI = /\p{Extended_Pictographic}/u;
  function firstGrapheme(text7) {
    const t2 = text7.trim();
    if (!t2) return "";
    const Seg = Intl.Segmenter;
    if (Seg) for (const { segment } of new Seg(void 0, { granularity: "grapheme" }).segment(t2)) return segment;
    return Array.from(t2)[0] ?? "";
  }
  function bubbleGlyph(icon2, name, fallback) {
    const own = icon2?.trim();
    if (own) return { text: firstGrapheme(own), emoji: EMOJI.test(own) };
    const first = firstGrapheme(name);
    if (first && EMOJI.test(first)) return { text: first, emoji: true };
    if (fallback) return { text: fallback, emoji: EMOJI.test(fallback) };
    return { text: first.toUpperCase() || "?", emoji: false };
  }
  var STYLE2 = `
${THEME_TOKENS}
:host { display: block; position: relative; z-index: 5; }
:host([hidden]) { display: none; }
* { box-sizing: border-box; }
.wrap { position: relative; font: 13px/1.25 var(--d-font); color: var(--d-text); }
${CONTROLS}
/* icon bubbles, no bar around them; at most ${PER_ROW} on a row */
:host { --bubble: 30px; --bubble-gap: 5px; }
.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--bubble-gap); padding: 6px 4px 8px; margin: 0 auto;
  max-width: calc(${PER_ROW} * var(--bubble) + ${PER_ROW - 1} * var(--bubble-gap) + 8px); }
/* a set laid out as a line: breaks before and after it (none at the very start or end) */
.bar > .break { flex-basis: 100%; height: 0; }
.bar > .break:first-child, .bar > .break:last-child, .bar > .break + .break { display: none; }
.bubble { position: relative; width: var(--bubble); height: var(--bubble); padding: 0; justify-content: center; border-radius: 50%;
  font-size: 15px; line-height: 1; font-weight: 600;
  background: var(--d-shell-bg); border: var(--d-shell-border); color: var(--d-btn-text);
  box-shadow: var(--d-shell-shadow), 0 2px 8px rgb(0 0 0 / .18); backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur); }
.bubble.busy { box-shadow: 0 0 0 2px var(--d-ring), 0 3px 10px rgb(0 0 0 / .18); }
.bubble:hover { transform: translateY(-2px); border-color: var(--d-btn-border-hover); color: var(--d-btn-text-hover); background: var(--d-shell-bg); }
.bubble:active { transform: scale(.95); }
.bubble[aria-expanded="true"], .bubble.running { border-color: var(--d-btn-border-active); box-shadow: 0 0 0 2px var(--d-ring), 0 3px 10px rgb(0 0 0 / .18); }
.bubble .letter { font-size: 12px; font-weight: 700; }
.bubble svg { width: 14px; height: 14px; }
.bubble .count { position: absolute; top: -4px; right: -4px; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; line-height: 1;
  background: var(--d-accent-fill); color: var(--d-accent-text); }
.bubble .warn-dot { position: absolute; bottom: -3px; right: -3px; font-size: 9px; }
.bubble.stop { background: var(--d-danger); border-color: transparent; color: #fff; }
/* hidden until the pointer is on the ⋯ handle or the bubbles (or a touch there) */
.slide { display: grid; grid-template-rows: 0fr; opacity: 0; transform: translateY(6px); pointer-events: none;
  transition: grid-template-rows 180ms ease, opacity 150ms ease, transform 180ms ease; }
.slide > .clip { min-height: 0; overflow: hidden; }
:host(.revealed) .slide { grid-template-rows: 1fr; opacity: 1; transform: none; pointer-events: auto; }
/* once up, badges and shadows may spill past the row */
:host(.revealed) .slide > .clip { overflow: visible; }
@media (prefers-reduced-motion: reduce) { .slide { transition: none; } }
/* the thin ⋯ strip right above the input box: point at it or touch it to bring the bubbles up */
.handle { position: relative; display: flex; align-items: center; justify-content: center; gap: 3px; height: 14px; margin: 0 0 2px; cursor: pointer; touch-action: manipulation; }
/* a finger-sized target around the small dots */
.handle::before { content: ""; position: absolute; inset: -10px 25%; }
.handle i { width: 4px; height: 4px; border-radius: 50%; background: var(--d-muted); opacity: .7; transition: background-color 150ms ease, opacity 150ms ease; }
.handle:hover i, :host(.revealed) .handle i { background: var(--d-accent); opacity: 1; }
.pop button.running { border-color: var(--d-btn-border-active); color: var(--d-btn-text-active); background: var(--d-btn-bg-active); }
.warn { color: #e6a23c; }
/* a QR with a sub menu: right-click or long-press opens it */
.bubble.has-menu::after { content: ""; position: absolute; bottom: 1px; left: 50%; width: 10px; height: 2px; margin-left: -5px; border-radius: 1px; background: currentColor; opacity: .55; }
.pop .entry-row { display: flex; gap: 4px; }
.pop .entry-row > button:first-child { flex: 1; min-width: 0; }
.pop .entry-row > .more { flex: none; width: auto; padding: 4px 8px; }
.pop .sub { display: flex; flex-direction: column; gap: 4px; margin-left: 12px; padding-left: 8px; border-left: 2px solid var(--d-line); }
.pop .group-h { font-size: 11.5px; color: var(--d-muted); padding: 4px 4px 0; }
.pop { position: absolute; bottom: calc(100% + 4px); min-width: 180px; max-width: min(440px, calc(100vw - 16px)); max-height: 50vh; overflow: auto;
  display: flex; flex-direction: column; gap: 4px; padding: 6px; z-index: 20; font-size: 12.5px; line-height: 1.3;
  background: var(--d-panel-solid); border: 1px solid var(--d-line); border-radius: var(--d-radius); box-shadow: var(--d-shadow);
  backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur); }
.pop button { justify-content: flex-start; width: 100%; min-width: 0; padding: 5px 9px; font-size: 12.5px; }
/* one line per row, cut with … instead of wrapping */
.pop button > .t { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.pop .head { font-size: 12px; color: var(--d-muted); padding: 2px 4px 4px; }
svg { width: 15px; height: 15px; flex: none; }
${WAND_STYLE}
${MEMO_STYLE}
${FORM_CSS}`;
  function paint(b, set) {
    if (!set.color) return;
    b.style.borderColor = set.color;
    if (!set.colorBorderOnly) b.style.background = `color-mix(in srgb, ${set.color} 38%, var(--d-shell-bg))`;
  }
  var QuickBar = class {
    constructor(handlers) {
      this.handlers = handlers;
      this.element = document.createElement("div");
      this.element.id = "dispensa-bar";
      this.root = this.element.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = STYLE2;
      this.container = el("div", { class: "wrap" });
      this.root.append(style, this.container);
      this.root.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && (this.openSetId || this.ctx)) {
          if (this.ctx) this.ctx = null;
          else this.openSetId = null;
          this.render();
        }
      });
      document.addEventListener("mousedown", this.onOutside, true);
      document.addEventListener("pointerdown", this.onPointerDown, true);
      this.element.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") this.setHover("bar", true);
      });
      this.element.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "touch") this.setHover("bar", false);
      });
      this.element.addEventListener("focusin", () => this.updateReveal());
      this.element.addEventListener("focusout", () => setTimeout(() => this.updateReveal(), 0));
    }
    element;
    root;
    container;
    openSetId = null;
    state = null;
    running = null;
    wand = { show: false, icon: "🍰", busy: null };
    memo = { show: false, icon: "📝" };
    overTarget = false;
    overBar = false;
    touchOpen = false;
    hideTimer = null;
    revealTarget = null;
    scope = NO_CHAT;
    /** An open sub menu (right-click / long-press on a QR). */
    ctx = null;
    /** Open nested entries in the sub menu, by path. */
    expanded = /* @__PURE__ */ new Set();
    pressTimer = null;
    pressed = false;
    /** An extra area that brings the bar up (besides the bar's own ⋯ handle). */
    bindRevealTarget(target) {
      if (target === this.revealTarget) return;
      this.revealTarget?.removeEventListener("pointerenter", this.onTargetEnter);
      this.revealTarget?.removeEventListener("pointerleave", this.onTargetLeave);
      this.revealTarget = target;
      this.overTarget = false;
      target?.addEventListener("pointerenter", this.onTargetEnter);
      target?.addEventListener("pointerleave", this.onTargetLeave);
      this.updateReveal();
    }
    onTargetEnter = (e) => {
      if (e.pointerType !== "touch") this.setHover("target", true);
    };
    onTargetLeave = (e) => {
      if (e.pointerType !== "touch") this.setHover("target", false);
    };
    /** A touch on the bar (its ⋯ handle) shows it; a touch anywhere else hides it. */
    onPointerDown = (e) => {
      if (e.pointerType !== "touch") return;
      const path = e.composedPath();
      const inside = path.includes(this.element) || !!this.revealTarget && path.includes(this.revealTarget) || path.some((n) => n.id === "dispensa-dialogs");
      if (inside !== this.touchOpen) {
        this.touchOpen = inside;
        this.updateReveal();
      }
    };
    setHover(which, over) {
      if (which === "target") this.overTarget = over;
      else this.overBar = over;
      this.updateReveal();
    }
    get armed() {
      return !!this.state?.barVisible;
    }
    get shouldShow() {
      if (!this.armed) return false;
      return !!this.ctx || this.overTarget || this.overBar || this.touchOpen || this.openSetId !== null || this.running !== null || !!this.wand.busy || this.element.matches(":focus-within");
    }
    updateReveal() {
      if (this.shouldShow) {
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hideTimer = null;
        this.element.classList.add("revealed");
        return;
      }
      if (!this.element.classList.contains("revealed") || this.hideTimer) return;
      this.hideTimer = setTimeout(() => {
        this.hideTimer = null;
        if (!this.shouldShow) this.element.classList.remove("revealed");
      }, 350);
    }
    dispose() {
      document.removeEventListener("mousedown", this.onOutside, true);
      document.removeEventListener("pointerdown", this.onPointerDown, true);
      this.bindRevealTarget(null);
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.element.remove();
    }
    onOutside = (e) => {
      const path = e.composedPath();
      const inDialog = path.some((n) => n.id === "dispensa-dialogs");
      if ((this.openSetId || this.ctx) && !path.includes(this.element) && !inDialog) {
        this.openSetId = null;
        this.ctx = null;
        this.render();
      }
    };
    /** The chat on screen: its chat and character sets join the bar. */
    setScope(scope) {
      this.scope = scope;
      this.render();
    }
    setState(state) {
      this.state = state;
      this.render();
    }
    setWand(view) {
      this.wand = view;
      this.render();
    }
    setMemo(view) {
      this.memo = view;
      this.render();
    }
    memoButton(bar) {
      const hooks = this.handlers.memo;
      if (!hooks || !this.memo.show) return;
      const open2 = this.openSetId === MEMO_MENU;
      const button = this.bubble("memo", bubbleGlyph(this.memo.icon, t("Memo pad", "메모장"), "📝"), t("Memo pad", "메모장"), (e) => {
        this.openSetId = open2 ? null : MEMO_MENU;
        this.render();
        if (!open2) hooks.panel.refresh();
        e.stopPropagation();
      }, { "aria-expanded": String(open2) });
      bar.append(button);
      if (open2) this.placePop(hooks.panel.element, button);
    }
    /** Close the 🌟 menu (after running something from it). */
    closeMenus() {
      if (this.openSetId) {
        this.openSetId = null;
        this.render();
      }
    }
    wandButtons(bar) {
      const hooks = this.handlers.wand;
      if (!hooks || !this.wand.show) return;
      const open2 = this.openSetId === WAND_MENU;
      const button = this.bubble("wand", bubbleGlyph(this.wand.icon, t("Visualizer", "비주얼라이저"), "🍰"), this.wand.busy ? t(`Making ${this.wand.busy}…`, `${this.wand.busy} 만드는 중…`) : t("Visualizer", "비주얼라이저"), (e) => {
        this.openSetId = open2 ? null : WAND_MENU;
        this.render();
        if (!open2) void hooks.panel.refresh();
        e.stopPropagation();
      }, { "aria-expanded": String(open2), class: `wand${this.wand.busy ? " busy" : ""}` });
      bar.append(button);
      if (open2) this.placePop(hooks.panel.element, button);
    }
    /** Opens a menu above the bubble, kept inside the bar's width. */
    placePop(pop, anchor) {
      requestAnimationFrame(() => {
        const barRect = this.container.getBoundingClientRect();
        const rect = anchor.getBoundingClientRect();
        const min = 8 - barRect.left;
        const max = window.innerWidth - 8 - barRect.left - pop.offsetWidth;
        pop.style.left = `${Math.max(min, Math.min(rect.left - barRect.left, max))}px`;
      });
      this.container.append(pop);
    }
    setRunning(item) {
      this.running = item;
      this.render();
    }
    bubble(part, glyph, title, onclick, extra = {}) {
      const b = el("button", { class: `bubble${extra.class ? ` ${extra.class}` : ""}`, part, title, "aria-label": title, onclick, ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "class")) });
      if (glyph instanceof SVGElement) b.append(glyph);
      else b.append(glyph.emoji ? document.createTextNode(glyph.text) : el("span", { class: "letter" }, glyph.text));
      return b;
    }
    /** Press on a QR: Ctrl/⌘ opens it in the manager, a QR with only a sub menu opens that, else it runs. */
    press(e, set, item, key2) {
      if (this.pressed) {
        this.pressed = false;
        return;
      }
      const me = e;
      if ((me.ctrlKey || me.metaKey) && this.handlers.edit) {
        this.openSetId = null;
        this.ctx = null;
        this.handlers.edit(set, item);
        this.render();
        return;
      }
      if (!item.script.trim() && this.state && hasMenu(this.state, item)) {
        this.openMenu(e, set, item, key2);
        return;
      }
      this.openSetId = null;
      this.ctx = null;
      this.handlers.run(set, item);
    }
    openMenu(e, set, item, key2) {
      e.preventDefault();
      e.stopPropagation();
      const same3 = this.ctx?.key === key2;
      this.ctx = same3 ? null : { set, item, key: key2 };
      this.expanded.clear();
      this.render();
    }
    /** Right-click, or a long press on touch, opens a QR's sub menu. */
    bindMenu(b, set, item, key2) {
      if (!this.state || !hasMenu(this.state, item)) return;
      b.classList.add("has-menu");
      b.setAttribute("aria-haspopup", "menu");
      b.addEventListener("contextmenu", (e) => this.openMenu(e, set, item, key2));
      b.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        this.pressed = false;
        if (this.pressTimer) clearTimeout(this.pressTimer);
        this.pressTimer = setTimeout(() => {
          this.pressTimer = null;
          this.pressed = true;
          this.openMenu(e, set, item, key2);
        }, 500);
      });
      const cancel = () => {
        if (this.pressTimer) clearTimeout(this.pressTimer);
        this.pressTimer = null;
      };
      b.addEventListener("pointerup", cancel);
      b.addEventListener("pointercancel", cancel);
      b.addEventListener("pointerleave", cancel);
    }
    /** A QR laid out on the bar as a bubble. */
    itemBubble(set, item) {
      const key2 = `${set.id}/${item.id}`;
      const b = this.bubble("item", bubbleGlyph(item.icon, item.label, item.kind === "ooc" ? "💬" : void 0), item.title || item.label, (e) => this.press(e, set, item, key2), this.running?.id === item.id ? { class: "running" } : {});
      paint(b, set);
      if (item.unsupported?.length) b.append(el("span", { class: "warn-dot", title: t(`Unsupported commands: ${item.unsupported.join(", ")}`, `지원 안 되는 명령: ${item.unsupported.join(", ")}`) }, "⚠"));
      this.bindMenu(b, set, item, key2);
      if (this.ctx?.key === key2) this.placePop(this.menuPop(), b);
      return b;
    }
    /** A QR in a folder's menu: icon and name. */
    itemButton(set, item, onPress) {
      const b = el("button", {
        part: "item",
        title: item.title || item.label,
        class: this.running?.id === item.id ? "running" : "",
        onclick: onPress ?? ((e) => this.press(e, set, item, `${set.id}/${item.id}`))
      });
      const glyph = item.icon?.trim() ? firstGrapheme(item.icon) : "";
      if (glyph) b.append(document.createTextNode(item.showLabel === false ? glyph : `${glyph} `));
      else if (item.kind === "ooc") b.append(icon("message-circle"));
      if (!glyph || item.showLabel !== false) b.append(el("span", { class: "t" }, item.label));
      if (item.unsupported?.length) b.append(el("span", { class: "warn", title: t(`Unsupported commands: ${item.unsupported.join(", ")}`, `지원 안 되는 명령: ${item.unsupported.join(", ")}`) }, " ⚠"));
      return b;
    }
    /** The open sub menu: the linked sets' QRs, nested ones folded under "›". */
    menuPop(inFolder = false) {
      const ctx = this.ctx;
      const back = inFolder ? el("button", { class: "more", title: t("Back", "뒤로"), "aria-label": t("Back", "뒤로"), style: "width:auto;padding:2px 8px;margin-right:6px", onclick: (e) => {
        e.stopPropagation();
        this.ctx = null;
        this.render();
      } }, "‹") : null;
      const pop = el("div", { class: "pop", part: "context-menu", role: "menu" }, el("div", { class: "head" }, back, ctx.item.label));
      if (ctx.item.script.trim()) {
        pop.append(this.itemButton(ctx.set, ctx.item, () => {
          this.ctx = null;
          this.handlers.run(ctx.set, ctx.item);
          this.render();
        }));
      }
      const groups = (list, path, into) => {
        for (const g of list) {
          into.append(el("div", { class: "group-h" }, g.set.name));
          g.entries.forEach((entry, i) => into.append(this.menuEntry(entry, `${path}/${g.set.id}:${i}`, groups)));
        }
      };
      groups(contextMenu(this.state, ctx.set, ctx.item), "", pop);
      return pop;
    }
    menuEntry(entry, path, groups) {
      const run = (e) => {
        const me = e;
        if ((me.ctrlKey || me.metaKey) && this.handlers.edit) {
          this.ctx = null;
          this.handlers.edit(entry.set, entry.item);
        } else {
          this.ctx = null;
          this.openSetId = null;
          this.handlers.run(entry.set, entry.run);
        }
        this.render();
      };
      const row = el("div", { class: "entry-row" }, this.itemButton(entry.set, entry.item, run));
      if (!entry.children.length) return row;
      const open2 = this.expanded.has(path);
      row.append(
        el("button", {
          class: "more",
          title: open2 ? t("Fold", "접기") : t("Sub menu", "하위 메뉴"),
          "aria-expanded": String(open2),
          onclick: (e) => {
            e.stopPropagation();
            if (open2) this.expanded.delete(path);
            else this.expanded.add(path);
            this.render();
          }
        }, open2 ? "‹" : "›")
      );
      if (!open2) return row;
      const sub = el("div", { class: "sub" });
      groups(entry.children, path, sub);
      return el("div", {}, row, sub);
    }
    render() {
      const s = this.state;
      this.container.replaceChildren();
      if (!s) return;
      this.element.hidden = !s.barVisible;
      if (!s.barVisible) {
        this.openSetId = null;
        this.updateReveal();
        return;
      }
      const bar = el("div", { class: "bar", part: "bar", role: "toolbar", "aria-label": "Quick Reply" });
      this.wandButtons(bar);
      this.memoButton(bar);
      const shown = shownBar(s);
      for (const [n, { entry, set, item: one }] of shown.entries()) {
        if (one) {
          bar.append(this.itemBubble(set, one));
          continue;
        }
        const items = set.items.filter((i) => !i.hidden);
        if (!items.length) continue;
        if (layoutOf(entry, set) === "row") {
          bar.append(el("div", { class: "break" }));
          for (const item of items) bar.append(this.itemBubble(set, item));
          if (n < shown.length - 1) bar.append(el("div", { class: "break" }));
          continue;
        }
        const open2 = this.openSetId === set.id;
        const folder = this.bubble("folder", bubbleGlyph(set.icon, set.name, "📁"), `${set.name} (${items.length})`, (e) => {
          this.openSetId = open2 ? null : set.id;
          this.render();
          e.stopPropagation();
        }, { "aria-expanded": String(open2) });
        folder.append(el("span", { class: "count" }, String(items.length)));
        paint(folder, set);
        bar.append(folder);
        if (open2 && this.ctx?.set.id === set.id) {
          this.placePop(this.menuPop(true), folder);
        } else if (open2) {
          const pop = el("div", { class: "pop", part: "folder-menu", role: "menu" }, el("div", { class: "head" }, set.name));
          for (const item of items) {
            const b = this.itemButton(set, item);
            this.bindMenu(b, set, item, `${set.id}/${item.id}`);
            pop.append(b);
          }
          this.placePop(pop, folder);
        }
      }
      if (this.running) {
        bar.append(this.bubble("stop", icon("square"), t(`Stop "${this.running.label}"`, `"${this.running.label}" 중지`), () => this.handlers.stop(), { class: "stop" }));
      }
      bar.append(this.bubble("manage", icon("settings"), t("Manage QRs (Dispensa)", "QR 관리 (Dispensa)"), () => this.handlers.openManager()));
      this.container.prepend(
        el("div", { class: "slide" }, el("div", { class: "clip" }, bar)),
        el("div", { class: "handle", part: "handle", title: "Dock", "aria-hidden": "true" }, el("i"), el("i"), el("i"))
      );
      this.updateReveal();
    }
  };

  // src/ui/chat-blocks.ts
  var MARK = "dispensa-view";
  var isHtmlBlock = (block) => {
    const lang2 = block.querySelector(".mari-md-codeblock-lang")?.textContent?.trim().toLowerCase() ?? "";
    return lang2 === "html" || lang2 === "htm";
  };
  function addViewButtons(onView) {
    document.querySelectorAll("[data-message-id]").forEach((message) => {
      const blocks = [...message.querySelectorAll("pre.mari-md-codeblock")].filter(isHtmlBlock);
      blocks.forEach((block, index) => {
        if (block.querySelector(`.${MARK}`)) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `${MARK} rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 font-sans text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`;
        button.style.cssText = "position:absolute;bottom:6px;right:72px;min-height:2rem;cursor:pointer;";
        button.textContent = t("🌟 View", "🌟 보기");
        button.title = t("Show as a page in the Visualizer viewer", "비주얼라이저 보기 창에서 화면으로 보기");
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = message.dataset.messageId;
          if (id) onView(id, index);
        });
        if (getComputedStyle(block).position === "static") block.style.position = "relative";
        block.append(button);
      });
    });
  }

  // src/ui/composer-toggle.ts
  var MARINARA_BUTTON = "flex shrink-0 items-center justify-center rounded-lg transition-all text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70";
  var ComposerToggle = class {
    element;
    constructor(onToggle) {
      this.element = document.createElement("button");
      this.element.type = "button";
      this.element.id = "dispensa-toggle";
      this.element.className = MARINARA_BUTTON;
      this.element.style.cssText = "width:24px;height:24px;padding:0;";
      this.element.append(icon("star"));
      const svg = this.element.querySelector("svg");
      if (svg) svg.style.cssText = "width:14px;height:14px;transition:fill 150ms ease;";
      this.element.addEventListener("click", (e) => {
        e.preventDefault();
        onToggle();
      });
      this.setArmed(false);
    }
    setArmed(armed) {
      const label = armed ? t("Turn off Dock (Dispensa)", "Dock 끄기 (Dispensa)") : t("Turn on Dock (Dispensa)", "Dock 켜기 (Dispensa)");
      this.element.title = label;
      this.element.setAttribute("aria-label", label);
      this.element.setAttribute("aria-pressed", String(armed));
      this.element.style.color = armed ? "var(--marinara-chat-chrome-accent, var(--primary))" : "";
      const svg = this.element.querySelector("svg");
      if (svg) svg.style.fill = armed ? "currentColor" : "none";
    }
    /** Keeps the button just before the text box, through React re-renders. */
    mount(box) {
      if (!box) return;
      const textarea = box.querySelector("textarea");
      const parent = textarea?.parentElement;
      if (!textarea || !parent) return;
      if (this.element.parentElement !== parent || this.element.nextElementSibling !== textarea) parent.insertBefore(this.element, textarea);
    }
    dispose() {
      this.element.remove();
    }
  };

  // src/ui/drag.ts
  var DRAG_CSS = `
.drag { flex: none; width: 22px; padding: 4px 0 !important; justify-content: center; cursor: grab; touch-action: none; color: var(--d-muted); background: none !important; border-color: transparent !important; }
.drag:active { cursor: grabbing; }
.drag svg { width: 14px; height: 14px; }
.dragging { position: relative; z-index: 3; opacity: .92; box-shadow: var(--d-shadow); border-radius: var(--d-radius-sm); background: var(--d-panel-solid); pointer-events: none; }
.drop-before { box-shadow: 0 -2px 0 var(--d-accent); }
.drop-after { box-shadow: 0 2px 0 var(--d-accent); }
`;
  function dragHandle(handle, row, rowSelector, move) {
    handle.setAttribute("aria-roledescription", t("Reorder", "순서 바꾸기"));
    handle.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const rows = siblings(row, rowSelector);
      const from = rows.indexOf(row);
      const to = from + (e.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to < rows.length) move(from, to);
    });
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const rows = siblings(row, rowSelector);
      const from = rows.indexOf(row);
      const startY = e.clientY;
      let to = from;
      handle.setPointerCapture(e.pointerId);
      row.classList.add("dragging");
      const clear = () => rows.forEach((r) => r.classList.remove("drop-before", "drop-after"));
      const onMove = (ev) => {
        row.style.transform = `translateY(${ev.clientY - startY}px)`;
        clear();
        to = from;
        rows.forEach((r, i) => {
          if (r === row) return;
          const rect = r.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (i < from && ev.clientY < mid) to = Math.min(to, i);
          if (i > from && ev.clientY > mid) to = Math.max(to, i);
        });
        if (to !== from) rows[to].classList.add(to < from ? "drop-before" : "drop-after");
      };
      const onUp = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        row.classList.remove("dragging");
        row.style.transform = "";
        clear();
        if (to !== from) move(from, to);
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });
  }
  function siblings(row, selector) {
    return row.parentElement ? [...row.parentElement.children].filter((c) => c.matches(selector)) : [row];
  }
  function moveTo(list, from, to) {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const [x] = list.splice(from, 1);
    list.splice(to, 0, x);
  }
  function dragAcross(handle, row, rowSelector, zoneSelector, rootSelector, drop) {
    handle.setAttribute("aria-roledescription", t("Move", "옮기기"));
    const others = (zone) => [...zone.children].filter((c) => c !== row && c.matches(rowSelector));
    handle.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const zone = row.closest(zoneSelector);
      if (!zone) return;
      const from = siblings(row, rowSelector).indexOf(row);
      const to = from + (e.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to <= others(zone).length) drop(zone, to);
    });
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const home = row.closest(zoneSelector);
      const root = row.closest(rootSelector);
      if (!home || !root) return;
      const zones = [...root.querySelectorAll(zoneSelector)];
      const from = siblings(row, rowSelector).indexOf(row);
      const start2 = { x: e.clientX, y: e.clientY };
      let target = null;
      handle.setPointerCapture(e.pointerId);
      row.classList.add("dragging");
      const clear = () => {
        for (const z of zones) {
          z.classList.remove("drop-into");
          for (const r of z.children) r.classList.remove("drop-before", "drop-after");
        }
      };
      const onMove = (ev) => {
        row.style.transform = `translate(${ev.clientX - start2.x}px, ${ev.clientY - start2.y}px)`;
        clear();
        let zone = null;
        let best = Infinity;
        for (const z of zones) {
          const r = z.getBoundingClientRect();
          const d = ev.clientY < r.top ? r.top - ev.clientY : ev.clientY > r.bottom ? ev.clientY - r.bottom : 0;
          if (d < best) [best, zone] = [d, z];
        }
        if (!zone) return target = null;
        const rows = others(zone);
        const index = rows.filter((r) => {
          const rect = r.getBoundingClientRect();
          return rect.top + rect.height / 2 < ev.clientY;
        }).length;
        target = { zone, index };
        if (zone === home && index === from) return;
        if (rows[index]) rows[index].classList.add("drop-before");
        else if (rows[index - 1]) rows[index - 1].classList.add("drop-after");
        else zone.classList.add("drop-into");
      };
      const onUp = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onCancel);
        row.classList.remove("dragging");
        row.style.transform = "";
        clear();
        if (target && !(target.zone === home && target.index === from)) drop(target.zone, target.index);
      };
      const onCancel = () => {
        target = null;
        onUp();
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onCancel);
    });
  }

  // src/qr/debug.ts
  function lineOf(text7, offset) {
    let n = 0;
    for (let i = 0; i < offset && i < text7.length; i++) if (text7[i] === "\n") n++;
    return n;
  }
  var DebugSession = class {
    constructor(options) {
      this.options = options;
      this.mode = options.startPaused ? "into" : "continue";
    }
    mode;
    depth = 0;
    current = null;
    resume = null;
    /** The line it last stopped on: going on does not stop again on the same line's next command. */
    lastLine = -1;
    get paused() {
      return this.current;
    }
    beforeCommand(stop) {
      if (!this.shouldStop(stop)) return;
      this.current = stop;
      this.lastLine = this.lineIn(stop);
      this.options.onPause(stop);
      return new Promise((r) => this.resume = r);
    }
    /** Go on from a stop. */
    step(mode) {
      this.mode = mode;
      this.depth = this.current?.depth ?? 0;
      const resume = this.resume;
      this.resume = null;
      this.current = null;
      this.options.onPause(null);
      resume?.();
    }
    /** Let a stopped script go (to be aborted by its signal). */
    release() {
      this.step("continue");
    }
    lineIn(stop) {
      const text7 = this.options.text();
      return stop.source && stop.source.text === text7 ? lineOf(text7, stop.node.start) : -1;
    }
    shouldStop(stop) {
      if (stop.node.name === "breakpoint") return true;
      if (this.mode === "into") return true;
      if (this.mode === "over" && stop.depth <= this.depth) return true;
      if (this.mode === "out" && stop.depth < this.depth) return true;
      const line = this.lineIn(stop);
      if (line < 0) return false;
      if (line === this.lastLine) return false;
      this.lastLine = -1;
      return this.options.breakpoints().has(line);
    }
  };

  // src/ui/run-panel.ts
  var RUN_PANEL_CSS = `
.runbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.runbar .hint { color: var(--d-muted); font-size: 12px; }
.runbar .stop-run { border-color: var(--d-danger); color: var(--d-danger); }
.out { margin-top: 2px; border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); background: var(--d-field); font-size: 12.5px; overflow: hidden; }
.out > .out-h { display: flex; align-items: center; gap: 8px; padding: 5px 10px; border-bottom: 1px solid var(--d-divider); color: var(--d-muted); font-size: 12px; }
.out > .out-h .grow { flex: 1; }
.out pre { margin: 0; padding: 8px 10px; max-height: 220px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: 12.5px/1.5 var(--d-mono); color: var(--d-text); }
.out.error pre { color: var(--d-danger); }
.dbg { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.dbg > div { min-width: 0; padding: 6px 10px; }
.dbg > div + div { border-left: 1px solid var(--d-divider); }
.dbg h4 { margin: 0 0 4px; font-size: 11.5px; font-weight: 700; color: var(--d-muted); }
.dbg .var { display: flex; gap: 8px; font: 12px/1.5 var(--d-mono); }
.dbg .var b { color: #c792ea; font-weight: 600; white-space: nowrap; }
.dbg .var span { color: var(--d-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dbg .frame { font: 12px/1.5 var(--d-mono); color: var(--d-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dbg .frame.top { color: var(--d-text); font-weight: 600; }
.dbg .lvl { margin-top: 4px; font-size: 11px; color: var(--d-muted); }
.at { padding: 6px 10px; border-bottom: 1px solid var(--d-divider); font: 12.5px/1.5 var(--d-mono); white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 560px) { .dbg { grid-template-columns: 1fr; } .dbg > div + div { border-left: 0; border-top: 1px solid var(--d-divider); } }
`;
  var RUN_HELP = () => t(
    "▶ Run: runs the script, result below (Ctrl+Enter)\n🐞 Step: stops before the first command. Also stops at lines marked by clicking the line number and at /breakpoint\nWhen stopped: Next · Into (into a closure or /run) · Out (to the end of this level) · Continue",
    "▶ 실행: 스크립트 실행, 결과는 아래에 (Ctrl+Enter)\n🐞 한 줄씩: 첫 명령 앞에서 멈춤. 줄 번호를 눌러 둔 줄과 /breakpoint에서도 멈춤\n멈추면: 다음 · 안으로(닫힘·/run 속으로) · 밖으로(이 단계 끝까지) · 계속"
  );
  var RunPanel = class {
    constructor(deps) {
      this.deps = deps;
    }
    controller = null;
    session = null;
    stop_ = null;
    result = null;
    started = 0;
    get running() {
      return this.controller !== null;
    }
    /** Ctrl+Enter, ▶, 🐞. */
    async start(debug = false) {
      if (this.controller) return;
      const controller = new AbortController();
      this.controller = controller;
      this.result = null;
      this.started = performance.now();
      this.session = debug ? new DebugSession({
        text: () => this.deps.editor()?.value ?? "",
        breakpoints: () => this.deps.breakpoints(),
        startPaused: true,
        onPause: (stop) => {
          this.stop_ = stop;
          this.markEditor();
          this.deps.changed();
        }
      }) : this.deps.breakpoints().size ? (
        // marked lines stop a plain run too
        new DebugSession({
          text: () => this.deps.editor()?.value ?? "",
          breakpoints: () => this.deps.breakpoints(),
          onPause: (stop) => {
            this.stop_ = stop;
            this.markEditor();
            this.deps.changed();
          }
        })
      ) : null;
      this.deps.changed();
      try {
        const res = await this.deps.run(controller.signal, this.session ?? void 0);
        const ms = performance.now() - this.started;
        this.result = res.aborted ? { text: res.aborted === "Stopped by user" ? t("Stopped.", "중지했어요.") : res.aborted, kind: "stopped", ms } : { text: res.pipe, kind: "ok", ms };
      } catch (e) {
        this.result = { text: e instanceof Error ? e.message : String(e), kind: "error", ms: performance.now() - this.started };
      } finally {
        this.controller = null;
        this.session = null;
        this.stop_ = null;
        this.markEditor();
        this.deps.changed();
      }
    }
    stop() {
      this.controller?.abort();
      this.session?.release();
    }
    step(mode) {
      this.session?.step(mode);
    }
    markEditor() {
      const editor = this.deps.editor();
      if (!editor) return;
      const s = this.stop_;
      editor.setMark(s && s.source && s.source.text === editor.value ? { start: s.node.start, end: s.node.end } : null);
    }
    render() {
      const paused = this.stop_;
      const bar = el("div", { class: "runbar" });
      if (!this.controller) {
        bar.append(
          el("button", { type: "button", title: t("Run the script now (Ctrl+Enter)", "지금 스크립트 실행 (Ctrl+Enter)"), onclick: () => void this.start(false) }, icon("play"), t("Run", "실행")),
          el("button", { type: "button", title: t("Stop before the first command and run line by line", "첫 명령 앞에서 멈추고 한 줄씩 실행"), onclick: () => void this.start(true) }, icon("bug"), t("Step", "한 줄씩")),
          helpTip(RUN_HELP(), t("Run and debug", "실행과 디버그"))
        );
      } else if (paused) {
        bar.append(
          el("button", { type: "button", title: t("Run to the next stop", "다음 멈출 곳까지 실행"), onclick: () => this.step("continue") }, icon("play"), t("Continue", "계속")),
          el("button", { type: "button", title: t("Stop at the next command at this level", "이 단계의 다음 명령에서 멈추기"), onclick: () => this.step("over") }, icon("step-over"), t("Next", "다음")),
          el("button", { type: "button", title: t("Step into a closure or a QR called with /run", "닫힘이나 /run한 QR 속으로 들어가기"), onclick: () => this.step("into") }, icon("step-into"), t("Into", "안으로")),
          el("button", { type: "button", title: t("Run this level to its end and stop outside", "지금 단계를 끝까지 실행하고 바깥에서 멈추기"), onclick: () => this.step("out") }, icon("step-out"), t("Out", "밖으로")),
          el("button", { type: "button", class: "stop-run", title: t("Stop", "중지"), onclick: () => this.stop() }, icon("square"), t("Stop", "중지"))
        );
      } else {
        bar.append(el("button", { type: "button", class: "stop-run", onclick: () => this.stop() }, icon("square"), t("Stop", "중지")), el("span", { class: "hint" }, t("Running…", "실행 중…")));
      }
      const box = el("div", { class: "run" }, bar);
      if (paused) box.append(this.pausedView(paused));
      else if (this.result) {
        const r = this.result;
        const head = r.kind === "error" ? t("Error", "오류") : r.kind === "stopped" ? t("Stopped", "멈춤") : t("Result", "결과");
        box.append(
          el(
            "div",
            { class: `out${r.kind === "error" ? " error" : ""}` },
            el("div", { class: "out-h" }, el("strong", {}, head), el("span", { class: "grow" }), `${Math.round(r.ms)}ms`, el("button", { type: "button", class: "icon", title: t("Close", "닫기"), "aria-label": t("Close result", "결과 닫기"), onclick: () => (this.result = null, this.deps.changed()) }, icon("x"))),
            el("pre", {}, clip(r.text) || (r.kind === "ok" ? t("(empty)", "(빈 값)") : ""))
          )
        );
      }
      return box;
    }
    pausedView(stop) {
      const text7 = stop.source?.text ?? "";
      const where = stop.source ? t(`${stop.source.label} · line ${lineOf(text7, stop.node.start) + 1}`, `${stop.source.label} · ${lineOf(text7, stop.node.start) + 1}번째 줄`) : t("(command in quotes)", "(따옴표 안 명령)");
      const vars = el("div", {}, el("h4", {}, t("Variables", "변수")));
      const frames = [...stop.stack].reverse();
      frames.forEach((f, i) => {
        const own = f.scope.ownVars();
        if (i > 0 && !own.length) return;
        if (i > 0) vars.append(el("div", { class: "lvl" }, `↑ ${f.label}`));
        if (i === 0) vars.append(el("div", { class: "var" }, el("b", {}, "{{pipe}}"), el("span", { title: show(f.scope.pipe) }, show(f.scope.pipe) || t("(empty)", "(빈 값)"))));
        for (const [k, v] of own) vars.append(el("div", { class: "var" }, el("b", {}, k), el("span", { title: show(v) }, show(v) || t("(empty)", "(빈 값)"))));
      });
      const named = Object.entries(stop.named);
      const args = named.length || (Array.isArray(stop.unnamed) ? stop.unnamed.length : stop.unnamed !== "") ? el("div", { class: "lvl" }, `${t("Arguments", "넘길 값")}: ${[...named.map(([k, v]) => `${k}=${show(v)}`), ...(Array.isArray(stop.unnamed) ? stop.unnamed : [stop.unnamed]).map(show)].filter(Boolean).join(" ")}`) : null;
      const calls = el(
        "div",
        {},
        el("h4", {}, t("Call stack", "호출 순서")),
        ...frames.map((f, i) => el("div", { class: `frame${i === 0 ? " top" : ""}` }, `${f.node ? `/${f.node.name}` : "…"}  ${f.label}`))
      );
      return el(
        "div",
        { class: "out" },
        el("div", { class: "out-h" }, el("strong", {}, t("Stopped", "멈춤")), el("span", { class: "grow" }, where)),
        el("div", { class: "at" }, text7 ? text7.slice(stop.node.start, stop.node.end).trim() : `/${stop.node.name}`),
        args ? el("div", { class: "at" }, args) : null,
        el("div", { class: "dbg" }, vars, calls)
      );
    }
  };
  function show(v) {
    if (Array.isArray(v)) return v.map(show).join(" ");
    return isClosureValue(v) ? t("{: closure :}", "{: 닫힘 :}") : v;
  }
  function clip(s) {
    return s.length > 6e3 ? t(`${s.slice(0, 6e3)}
… (${s.length - 6e3} more characters)`, `${s.slice(0, 6e3)}
… (${s.length - 6e3}자 더)`) : s;
  }

  // src/ui/script-editor.ts
  var SCRIPT_EDITOR_CSS = `
.se { position: relative; border: 1px solid var(--d-field-border); border-radius: var(--d-radius-sm); background: var(--d-field); min-height: 220px; }
.se:focus-within { border-color: var(--d-btn-border-hover); box-shadow: 0 0 0 2px var(--d-ring); }
.se .hl, .se textarea { margin: 0; border: 0; font: 13px/1.6 var(--d-mono); tab-size: 2; letter-spacing: 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal;
  padding: 8px 10px 8px 46px; }
.se .hl { min-height: 220px; color: var(--d-text); pointer-events: none; }
.se textarea { position: absolute; inset: 0; width: 100%; height: 100%; resize: none; overflow: hidden; background: transparent; color: transparent; caret-color: var(--d-text);
  outline: none; box-shadow: none; min-height: 0; border-radius: inherit; }
.se textarea::selection { background: color-mix(in srgb, var(--d-accent) 35%, transparent); color: transparent; }
.se .ln { position: relative; min-height: 1.6em; }
.se .ln::before { content: attr(data-n); position: absolute; left: -40px; width: 30px; text-align: right; color: var(--d-muted); opacity: .6; font-size: 11.5px; }
.se .ln.bp::after { content: ""; position: absolute; left: -44px; top: .45em; width: 8px; height: 8px; border-radius: 50%; background: #e5534b; }
.se .ln.paused { background: color-mix(in srgb, #e6a23c 18%, transparent); box-shadow: -46px 0 0 color-mix(in srgb, #e6a23c 18%, transparent); }
.se .gutter-hit { position: absolute; left: 0; top: 0; bottom: 0; width: 40px; cursor: pointer; }
.se .t-cmd { color: var(--d-accent); font-weight: 700; }
.se .t-arg { color: #c792ea; }
.se .t-macro { color: #3fb97a; }
.se .t-cl { color: #e6a23c; font-weight: 700; }
.se .t-pipe { color: var(--d-muted); font-weight: 700; }
.se .t-str { color: #f78c6c; }
.se .t-cmt { color: var(--d-muted); font-style: italic; }
.se .t-cur { background: color-mix(in srgb, #e6a23c 45%, transparent); border-radius: 3px; }
.se .ac { position: absolute; z-index: 6; left: 40px; right: 8px; max-width: 460px; max-height: 220px; overflow: auto; display: flex; flex-direction: column; padding: 4px;
  background: var(--d-panel-solid); border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); box-shadow: var(--d-shadow); }
.se .ac[hidden] { display: none; }
.se .ac button { justify-content: flex-start; gap: 8px; width: 100%; padding: 4px 8px; border-color: transparent; background: none; font-weight: 500; white-space: nowrap; overflow: hidden; }
.se .ac button.on, .se .ac button:hover { background: var(--d-hl-bg); }
.se .ac code { font-family: var(--d-mono); font-size: 12.5px; color: var(--d-btn-text-active); }
.se .ac small { color: var(--d-muted); overflow: hidden; text-overflow: ellipsis; }
`;
  var MACROS = () => [
    { name: "user", help: t("My name (persona)", "내 이름 (페르소나)") },
    { name: "char", help: t("Character name", "캐릭터 이름") },
    { name: "pipe", help: t("Result of the previous command", "앞 명령의 결과") },
    { name: "input", help: t("Text in the input", "입력창의 글") },
    { name: "lastMessage", help: t("Last message", "마지막 메시지") },
    { name: "lastMessageId", help: t("Last message number", "마지막 메시지 번호") },
    { name: "lastCharMessage", help: t("Character's last message", "캐릭터의 마지막 메시지") },
    { name: "lastUserMessage", help: t("My last message", "내 마지막 메시지") },
    { name: "getvar::", help: t("Chat variable value", "채팅 변수 값") },
    { name: "getglobalvar::", help: t("Global variable value", "전역 변수 값") },
    { name: "var::", help: t("Script variable value", "스크립트 안 변수 값") },
    { name: "random::", help: t("One of several", "여러 개 중 하나") },
    { name: "roll::", help: t("Dice (1d6)", "주사위 (1d6)") },
    { name: "time", help: t("Current time", "지금 시각") },
    { name: "date", help: t("Today's date", "오늘 날짜") },
    { name: "newline", help: t("Line break", "줄바꿈") },
    { name: "timesIndex", help: t("/times loop count", "/times 반복 횟수") }
  ];
  var TOKEN = /(\/[#/][^|\n]*)|(\{\{(?:(?!\}\}).)*\}\})|(\{:|:\}(?:\(\))?)|(\|\|?)|("(?:\\.|[^"\\\n])*")|((?:^|(?<=[\s|]|\{:))\/[\w:.-]+)|((?<=\s)[\w.-]+=)/g;
  var CLASSES = ["t-cmt", "t-macro", "t-cl", "t-pipe", "t-str", "t-cmd", "t-arg"];
  function highlight(text7, mark) {
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    const cls = new Array(text7.length).fill(null);
    for (const m2 of text7.matchAll(TOKEN)) {
      const g = m2.slice(1).findIndex((x) => x !== void 0);
      if (g < 0) continue;
      for (let i = m2.index; i < m2.index + m2[0].length; i++) cls[i] = CLASSES[g];
    }
    const lines = [];
    let line = "";
    let open2 = null;
    let marked = false;
    const close = () => {
      if (open2) line += "</span>";
      open2 = null;
    };
    for (let i = 0; i <= text7.length; i++) {
      const inMark = !!mark && i >= mark.start && i < mark.end;
      if (i === text7.length || text7[i] === "\n") {
        close();
        if (marked) line += "</span>";
        lines.push(line);
        line = "";
        marked = false;
        continue;
      }
      if (inMark !== marked) {
        close();
        line += inMark ? '<span class="t-cur">' : "</span>";
        marked = inMark;
      }
      if (cls[i] !== open2) {
        close();
        if (cls[i]) line += `<span class="${cls[i]}">`;
        open2 = cls[i];
      }
      line += esc(text7[i]);
    }
    return lines;
  }
  var ScriptEditor = class {
    constructor(options) {
      this.options = options;
      this.hl = el("div", { class: "hl", "aria-hidden": "true" });
      this.textarea = el("textarea", { spellcheck: "false", autocapitalize: "off", autocomplete: "off", "data-key": options.key, "aria-label": options.label });
      this.textarea.value = options.value;
      this.ac = el("div", { class: "ac", role: "listbox", hidden: true });
      const hit = el("div", { class: "gutter-hit", title: t("Click a line number to set a breakpoint", "줄 번호를 눌러 중단점 정하기") });
      hit.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.toggleBreakpointAt(e.clientY);
      });
      this.element = el("div", { class: "se" }, this.hl, this.textarea, hit, this.ac);
      this.textarea.addEventListener("input", () => {
        this.paint();
        this.options.onChange(this.textarea.value);
        this.suggest();
      });
      this.textarea.addEventListener("keydown", (e) => this.onKey(e));
      this.textarea.addEventListener("blur", () => setTimeout(() => this.closeSuggestions(), 120));
      this.textarea.addEventListener("click", () => this.closeSuggestions());
      this.paint();
    }
    element;
    textarea;
    hl;
    ac;
    breakpoints = /* @__PURE__ */ new Set();
    mark = null;
    choices = null;
    get value() {
      return this.textarea.value;
    }
    set value(v) {
      if (v === this.textarea.value) return;
      this.textarea.value = v;
      this.paint();
    }
    get lines() {
      return new Set(this.breakpoints);
    }
    setBreakpoints(lines) {
      this.breakpoints = new Set(lines);
      this.paint();
    }
    /** Marks the command the debugger stopped at (or clears it). */
    setMark(range) {
      this.mark = range;
      this.paint();
      if (range) {
        const line = this.hl.children[lineOf(this.textarea.value, range.start)];
        line?.scrollIntoView({ block: "nearest" });
      }
    }
    paint() {
      const text7 = this.textarea.value;
      const html = highlight(text7, this.mark);
      const pausedLine = this.mark ? lineOf(text7, this.mark.start) : -1;
      this.hl.innerHTML = html.map((l, i) => `<div class="ln${this.breakpoints.has(i) ? " bp" : ""}${i === pausedLine ? " paused" : ""}" data-n="${i + 1}">${l || "​"}</div>`).join("");
    }
    toggleBreakpointAt(y) {
      const lines = [...this.hl.children];
      const index = lines.findIndex((l) => {
        const r = l.getBoundingClientRect();
        return y >= r.top && y < r.bottom;
      });
      if (index < 0) return;
      if (this.breakpoints.has(index)) this.breakpoints.delete(index);
      else this.breakpoints.add(index);
      this.paint();
      this.options.onBreakpoints?.(this.lines);
    }
    onKey(e) {
      const ta = this.textarea;
      if (this.choices) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const n = this.choices.items.length;
          this.choices.index = (this.choices.index + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
          this.drawSuggestions();
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          this.accept(this.choices.items[this.choices.index]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.closeSuggestions();
          return;
        }
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.options.onRun?.();
        return;
      }
      if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.indent(e.shiftKey);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const start2 = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf("\n", start2 - 1) + 1;
        const indent = /^[ \t]*/.exec(ta.value.slice(lineStart, start2))[0];
        if (!indent) return;
        e.preventDefault();
        this.replace(start2, ta.selectionEnd, `
${indent}`);
      }
    }
    indent(out) {
      const ta = this.textarea;
      const { selectionStart: s, selectionEnd: end, value } = ta;
      if (s === end && !out) {
        this.replace(s, end, "  ");
        return;
      }
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const block = value.slice(lineStart, end);
      const changed = block.split("\n").map((l) => out ? l.replace(/^( {1,2}|\t)/, "") : `  ${l}`).join("\n");
      ta.setRangeText(changed, lineStart, end, "select");
      if (s === end) ta.setSelectionRange(Math.max(lineStart, s - (block.length - changed.length)), Math.max(lineStart, s - (block.length - changed.length)));
      ta.dispatchEvent(new Event("input"));
    }
    replace(from, to, text7) {
      this.textarea.setRangeText(text7, from, to, "end");
      this.textarea.dispatchEvent(new Event("input"));
    }
    suggest() {
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) return this.closeSuggestions();
      const before = ta.value.slice(0, ta.selectionStart);
      const cmd = /(?:^|[\s|]|\{:)\/([\w:.-]*)$/.exec(before);
      const macro = /\{\{([\w:]*)$/.exec(before);
      let items = [];
      let from = 0;
      let kind = "cmd";
      if (cmd && !before.endsWith("//")) {
        const q = cmd[1].toLowerCase();
        const all = this.options.commands();
        items = [...all.filter((c) => c.name.startsWith(q)), ...all.filter((c) => !c.name.startsWith(q) && q.length > 1 && c.name.includes(q))];
        from = ta.selectionStart - cmd[1].length;
      } else if (macro) {
        const q = macro[1].toLowerCase();
        items = MACROS().filter((m2) => m2.name.toLowerCase().startsWith(q));
        from = ta.selectionStart - macro[1].length;
        kind = "macro";
      }
      if (!items.length || items.length === 1 && items[0].name === ta.value.slice(from, ta.selectionStart)) return this.closeSuggestions();
      this.choices = { items: items.slice(0, 30), index: 0, from, kind };
      this.drawSuggestions();
    }
    drawSuggestions() {
      const c = this.choices;
      if (!c) return;
      this.ac.replaceChildren(
        ...c.items.map(
          (s, i) => el(
            "button",
            {
              type: "button",
              role: "option",
              class: i === c.index ? "on" : "",
              "aria-selected": String(i === c.index),
              onmousedown: (e) => {
                e.preventDefault();
                this.accept(s);
              }
            },
            el("code", {}, c.kind === "cmd" ? `/${s.name}` : `{{${s.name}${s.name.endsWith("::") ? "" : "}}"}`),
            s.help ? el("small", {}, s.help) : null
          )
        )
      );
      const line = this.hl.children[lineOf(this.textarea.value, this.textarea.selectionStart)];
      this.ac.style.top = `${(line?.offsetTop ?? 0) + (line?.offsetHeight ?? 20) + 2}px`;
      this.ac.hidden = false;
      this.ac.children[c.index]?.scrollIntoView({ block: "nearest" });
    }
    accept(s) {
      const c = this.choices;
      if (!c) return;
      const ta = this.textarea;
      const tail = c.kind === "cmd" ? " " : s.name.endsWith("::") ? "" : "}}";
      this.closeSuggestions();
      ta.setRangeText(s.name + tail, c.from, ta.selectionStart, "end");
      ta.dispatchEvent(new Event("input"));
      this.closeSuggestions();
    }
    closeSuggestions() {
      this.choices = null;
      this.ac.hidden = true;
    }
  };

  // src/ui/memo-view.ts
  var MEMO_VIEW_CSS = `
.memo-list { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.memo-row { display: flex; align-items: center; gap: 4px; }
.memo-row > .entry { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.memo-row .pin.on { color: var(--d-accent); }
.memo-edit { margin: 2px 0 8px 0; display: flex; flex-direction: column; gap: 6px; }
.memo-edit textarea { font-family: var(--d-font); min-height: 90px; }
.memo-count { color: var(--d-muted); font-size: 12px; }
`;
  var MemoView = class {
    constructor(deps) {
      this.deps = deps;
    }
    query = "";
    open = null;
    get state() {
      return this.deps.store.value;
    }
    update(fn) {
      this.deps.store.update(fn);
    }
    render() {
      return el("div", { class: "col wand-settings" }, this.memoCard(), this.barCard(), ...this.deps.oocSettings(), this.backupCard());
    }
    memoCard() {
      const all = this.state.memos;
      const shown = shownMemos(all, this.query);
      const list = el("div", { class: "memo-list" });
      for (const memo2 of shown) list.append(...this.row(memo2));
      if (!all.length) list.append(el("div", { class: "note" }, t("No memos. Select text in the chat and press 📝 Memo, or make a new memo.", "메모가 없어요. 채팅에서 글을 긁어 📝 메모를 누르거나, 새 메모를 만드세요.")));
      else if (!shown.length) list.append(el("div", { class: "note" }, t("No matching memos.", "찾는 메모가 없어요.")));
      return el(
        "div",
        { class: "card" },
        section(
          t("📝 Memos", "📝 메모"),
          t(
            "Text to use later, like OOC lines or page topics\n· Save with the 📝 Memo button that shows up when you select chat text\n· Use them with the 📝 button in the 🍰 menu, a [[memo]] blank, or the /memo command\n· ⭐: pin to top",
            "OOC 문구·페이지 소재처럼 나중에 쓸 글 모음\n· 채팅에서 글을 긁으면 뜨는 📝 메모 버튼으로 저장\n· 🍰 메뉴의 📝 버튼, [[메모]] 빈칸, /memo 명령으로 꺼내 쓰기\n· ⭐: 위에 고정"
          ),
          [
            el(
              "button",
              {
                onclick: () => {
                  const memo2 = newMemo(t("New memo", "새 메모"));
                  this.update((s) => s.memos.push(memo2));
                  this.open = memo2.id;
                  this.query = "";
                  this.deps.rerender();
                }
              },
              icon("plus"),
              t("New memo", "새 메모")
            ),
            el("button", { title: t("Paste many OOC lines at once. Strips wrappers like *{OOC: …}* and splits them one by one", "OOC 문구 한꺼번에 붙여넣기. *{OOC: …}* 같은 포장은 벗기고 하나씩 나눔"), onclick: () => void this.paste() }, icon("clipboard"), t("Add many", "여러 개 넣기"))
          ],
          el("input", {
            type: "search",
            placeholder: t("Search memos", "메모 찾기"),
            value: this.query,
            "data-key": "memo-search",
            "aria-label": t("Search memos", "메모 찾기"),
            oninput: (e) => {
              this.query = e.target.value;
              this.deps.rerender();
            }
          }),
          el("div", { class: "memo-count" }, this.query ? t(`${shown.length} / ${all.length}`, `${shown.length} / ${all.length}개`) : t(`${all.length}`, `${all.length}개`)),
          list
        )
      );
    }
    row(memo2) {
      const isOpen = this.open === memo2.id;
      const row = el(
        "div",
        { class: "memo-row" },
        el(
          "button",
          {
            class: `entry${isOpen ? " sel" : ""}`,
            title: memo2.text.slice(0, 400),
            onclick: () => {
              this.open = isOpen ? null : memo2.id;
              this.deps.rerender();
            }
          },
          memoLine(memo2.text, 90) || t("(empty memo)", "(빈 메모)")
        ),
        el(
          "button",
          {
            class: `icon pin${memo2.pinned ? " on" : ""}`,
            title: memo2.pinned ? t("Unpin", "고정 풀기") : t("Pin to top", "위에 고정"),
            "aria-label": memo2.pinned ? t("Unpin", "고정 풀기") : t("Pin to top", "위에 고정"),
            "aria-pressed": String(!!memo2.pinned),
            onclick: () => this.mutate(memo2.id, (m2) => m2.pinned ? delete m2.pinned : m2.pinned = true)
          },
          icon("pin")
        ),
        this.deps.menu(icon("more"), t("Memo menu", "메모 메뉴"), [
          { label: t("💬 Send as OOC", "💬 OOC로 보내기"), run: () => (this.deps.close(), void this.deps.sendOoc(memo2.text)) },
          { label: t("Put in the input", "입력창에 넣기"), run: () => (this.deps.close(), this.deps.putInInput(memo2.text)) },
          { label: t("🌟 Make page", "🌟 페이지 만들기"), sub: t("From this text", "이 글을 소재로"), run: () => (this.deps.close(), void this.deps.makePage(memo2.text)) },
          { label: t("Make a QR…", "QR로 만들기…"), sub: t("A QR in the Library that sends it as OOC", "누르면 OOC로 보내는 QR을 보관함에"), run: () => this.deps.toQr(memo2.text) },
          { label: t("Copy", "복사"), run: async () => (await this.deps.ui.copy?.(memo2.text), this.deps.ui.toast(t("Copied.", "복사했어요."), "success", { title: "📝" })) },
          "-",
          { label: t("Delete", "삭제"), danger: true, run: () => this.update((s) => s.memos = s.memos.filter((m2) => m2.id !== memo2.id)) }
        ])
      );
      if (!isOpen) return [row];
      const ta = el("textarea", {
        "data-key": `memo-${memo2.id}`,
        "aria-label": t("Memo text", "메모 내용"),
        oninput: (e) => {
          const text7 = e.target.value;
          this.deps.quietly(() => this.mutate(memo2.id, (m2) => m2.text = text7));
        }
      });
      ta.value = memo2.text;
      return [row, el("div", { class: "memo-edit" }, ta)];
    }
    mutate(id, fn) {
      this.update((s) => {
        const m2 = s.memos.find((x) => x.id === id);
        if (m2) fn(m2);
      });
    }
    async paste() {
      const text7 = await this.deps.ui.input(t("Paste the text.<br><small>Wrappers like *{OOC: …}* are stripped, and several lines are split one by one.</small>", "넣을 글을 붙여 넣으세요.<br><small>*{OOC: …}* 같은 포장은 알아서 벗기고, 여러 개면 하나씩 나눠요.</small>"), { rows: 8, multiline: true, wide: true, okButton: t("Add", "넣기") });
      if (!text7?.trim()) return;
      const memos = memosFrom(text7);
      this.update((s) => s.memos.push(...memos));
      this.deps.ui.toast(t(`Added ${memos.length} memos.`, `메모 ${memos.length}개를 넣었어요.`), "success", { title: "📝" });
    }
    barCard() {
      const s = this.state;
      return el(
        "div",
        { class: "card" },
        section(
          "Dock",
          void 0,
          [],
          setting(
            t("📝 Bubble", "📝 버블"),
            [
              el("input", { type: "text", class: "icon-input", value: s.barIcon, maxlength: "8", "data-key": "memo-bar-icon", "aria-label": t("Bubble icon", "버블 아이콘"), oninput: (e) => this.update((x) => x.barIcon = e.target.value.trim() || "📝") }),
              toggle(s.showButton, (v) => this.update((x) => x.showButton = v), t("Show 📝 bubble", "📝 버블 보이기"), "memo-show")
            ],
            t("Puts the Memo pad bubble on the Dock. Write, pick, and send memos as OOC", "Dock에 메모장 버블 두기. 메모 쓰기·고르기·OOC 보내기")
          ),
          setting(t("📝 button on selected text", "글을 긁으면 📝 버튼"), toggle(s.capture !== false, (v) => this.update((x) => x.capture = v), t("📝 button on selected text", "글을 긁으면 📝 버튼"), "memo-capture"), t("Shows a 📝 Memo button under text selected in a chat message or the input. Saves it to the Memo pad", "채팅 메시지나 입력창에서 글을 고르면 그 아래에 📝 메모 버튼 표시. 누르면 메모장에 저장"))
        )
      );
    }
    backupCard() {
      return el(
        "div",
        { class: "card" },
        section(
          t("Backup", "백업"),
          t("Export or import all memos as a .memo.json file. Imported memos are added to the current ones", "메모 전체를 .memo.json 파일로 내보내기·가져오기. 가져오면 지금 메모에 더해짐"),
          [el("button", { onclick: () => this.exportJson() }, icon("upload"), t("Export", "내보내기")), el("button", { onclick: () => this.importJson() }, icon("download"), t("Import", "가져오기"))]
        )
      );
    }
    exportJson() {
      const data = { format: "dispensa-memo", version: 1, memos: this.state.memos.map((m2) => ({ text: m2.text, pinned: m2.pinned || void 0, createdAt: m2.createdAt })) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = el("a", { href: url, download: "dispensa.memo.json" });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    }
    importJson() {
      const input = el("input", { type: "file", accept: ".json,application/json" });
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const json2 = JSON.parse(await file.text());
          const have = new Set(this.state.memos.map((m2) => m2.text));
          const fresh = (json2.memos ?? []).filter((m2) => typeof m2.text === "string" && m2.text.trim() && !have.has(m2.text)).map((m2) => ({ ...newMemo(String(m2.text), Number(m2.createdAt) || Date.now()), ...m2.pinned ? { pinned: true } : {} }));
          this.update((s) => s.memos.push(...fresh));
          this.deps.ui.toast(t(`Imported ${fresh.length} memos.`, `메모 ${fresh.length}개를 가져왔어요.`), "success", { title: "📝" });
        } catch (e) {
          this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("📝 Import", "📝 가져오기") });
        }
      });
      input.click();
    }
  };

  // src/wand/core.ts
  var FENCE_RE = /```[ \t]*([\w-]*)[^\n]*\n([\s\S]*?)(?:\n[ \t]*```|```)/g;
  var DOC_RE = /<!doctype\s+html|<html[\s>]|<body[\s>]/i;
  var TAG_RE = /<[a-z][a-z0-9-]*[\s>/]/i;
  var WAND_RE = /<!--\s*WAND_START\s*-->([\s\S]*?)(?:<!--\s*WAND_END\s*-->|$)/gi;
  function escapeRegex2(text7) {
    return String(text7).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function looksLikeHtmlDoc(code) {
    return DOC_RE.test(String(code ?? ""));
  }
  function isRenderableBlock(lang2, code) {
    const l = String(lang2 ?? "").toLowerCase();
    if (looksLikeHtmlDoc(code)) return true;
    return (l === "html" || l === "htm") && TAG_RE.test(String(code ?? ""));
  }
  function isCompleteHtml(code) {
    const c = String(code ?? "").trim();
    if (/<html[\s>]/i.test(c) || /^<!doctype/i.test(c)) return /<\/html\s*>\s*$/i.test(c);
    if (/<body[\s>]/i.test(c)) return /<\/body\s*>/i.test(c);
    return true;
  }
  function docTitle(code) {
    const m2 = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(code ?? ""));
    return m2 ? m2[1].replace(/\s+/g, " ").trim() : "";
  }
  function extractHtmlBlocks(text7) {
    const out = [];
    const src = String(text7 ?? "");
    FENCE_RE.lastIndex = 0;
    let m2;
    while (m2 = FENCE_RE.exec(src)) {
      const [whole, lang2, code] = m2;
      if (!isRenderableBlock(lang2, code)) continue;
      out.push({ start: m2.index, end: m2.index + whole.length, lang: lang2, code, title: docTitle(code), complete: isCompleteHtml(code) });
    }
    WAND_RE.lastIndex = 0;
    while (m2 = WAND_RE.exec(src)) {
      if (out.some((b) => m2.index >= b.start && m2.index < b.end)) continue;
      const code = m2[1].trim();
      out.push({ start: m2.index, end: m2.index + m2[0].length, lang: "html", code, title: docTitle(code), complete: /WAND_END/i.test(m2[0]) });
    }
    return out.sort((a, b) => a.start - b.start);
  }
  function replaceHtmlBlock(text7, index, code) {
    const b = extractHtmlBlocks(text7)[index];
    if (!b) return text7;
    const fence = "```" + (b.lang || "html") + "\n" + code.replace(/\s+$/, "") + "\n```";
    return text7.slice(0, b.start) + fence + text7.slice(b.end);
  }
  function stripReasoning(text7, tags = ["think", "thinking"]) {
    let t2 = String(text7 ?? "");
    for (const tag of tags) {
      const name = escapeRegex2(tag);
      t2 = t2.replace(new RegExp(`<${name}>[\\s\\S]*?</${name}>`, "gi"), "");
      t2 = t2.replace(new RegExp(`^[\\s\\S]*?</${name}>`, "i"), (m2) => new RegExp(`<${name}>`, "i").test(m2) ? m2 : "");
      t2 = t2.replace(new RegExp(`<${name}>[\\s\\S]*$`, "i"), "");
    }
    return t2;
  }
  function stripOuterFence(text7) {
    const t2 = String(text7 ?? "").trim();
    const m2 = /^```[\w-]*[^\n]*\n([\s\S]*?)(?:\n?```)?$/.exec(t2);
    return m2 ? m2[1] : t2;
  }
  function normalizeOutput(raw) {
    let t2 = stripReasoning(raw).trim();
    const fences = (t2.match(/```/g) || []).length;
    if (fences % 2 === 1) t2 += "\n```";
    if (!/```/.test(t2)) {
      const start2 = t2.search(/<!doctype\s+html|<html[\s>]/i);
      if (start2 >= 0) {
        const tail = t2.slice(start2);
        const endMatch = /<\/html\s*>/i.exec(tail);
        const end = endMatch ? start2 + endMatch.index + endMatch[0].length : t2.length;
        t2 = t2.slice(0, start2) + "```html\n" + t2.slice(start2, end).trim() + "\n```" + t2.slice(end);
      }
    }
    const blocks = extractHtmlBlocks(t2);
    return { text: t2.trim(), blocks, truncated: blocks.some((b) => !b.complete) };
  }
  function mergeContinuation(code, more) {
    let add = stripOuterFence(stripReasoning(more));
    add = add.replace(/^\s*\n/, "");
    const max = Math.min(600, code.length, add.length);
    for (let n = max; n >= 12; n--) {
      if (code.endsWith(add.slice(0, n))) {
        add = add.slice(n);
        break;
      }
    }
    return code + add;
  }
  function cleanOoc(text7) {
    let t2 = String(text7 ?? "").trim();
    const peel = [
      /^<system>\s*([\s\S]*?)\s*<\/system>$/i,
      /^\*\s*\{\s*ooc\s*[:：]\s*([\s\S]*?)\s*\}\s*\*$/i,
      /^\(\(\s*([\s\S]*?)\s*\)\)$/,
      /^\(\s*ooc\s*[:：]\s*([\s\S]*?)\s*\)$/i,
      /^\[\s*ooc\s*[:：]\s*([\s\S]*?)\s*\]$/i,
      /^ooc\s*[:：]\s*([\s\S]*)$/i
    ];
    let changed = true;
    while (changed) {
      changed = false;
      for (const re of peel) {
        const m2 = re.exec(t2);
        if (m2) {
          t2 = m2[1].trim();
          changed = true;
        }
      }
    }
    return t2;
  }
  function applyVars(template, vars) {
    let out = String(template ?? "");
    for (const [key2, value] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{\\{${escapeRegex2(key2)}\\}\\}`, "g"), () => String(value ?? ""));
    }
    return out;
  }
  function wrapOoc(template, content, language) {
    const tpl = String(template ?? "");
    const filled = tpl.includes("{{내용}}") ? tpl : `${tpl}

{{내용}}`;
    return applyVars(filled, { 내용: cleanOoc(content), 언어: language });
  }
  var BLANK_RE = /\[\[([^[\]\n]{1,400})\]\]/g;
  function parseBlank(inner) {
    const parts3 = String(inner).split("|").map((x) => x.trim());
    return { key: String(inner), label: parts3[0] || t("Input", "입력"), options: parts3.slice(1).filter(Boolean) };
  }
  function findBlanks(text7) {
    const seen = /* @__PURE__ */ new Map();
    let m2;
    BLANK_RE.lastIndex = 0;
    while (m2 = BLANK_RE.exec(String(text7 ?? ""))) if (!seen.has(m2[1])) seen.set(m2[1], parseBlank(m2[1]));
    return [...seen.values()];
  }
  function fillBlanks(text7, values) {
    return String(text7 ?? "").replace(BLANK_RE, (whole, inner) => Object.hasOwn(values, inner) ? String(values[inner]) : whole);
  }
  function resolveVizMode(setting2, env = {}) {
    return setting2 === "auto" ? env.fornello ? "full" : "lite" : setting2;
  }
  function activeChunks(preset, mode, env = {}) {
    return (preset?.chunks ?? []).filter((c) => c.enabled !== false && (!c.mode || c.mode === "all" || c.mode === mode) && (c.needs !== "fornello" || env.fornello === true));
  }
  function assembleVisualizer(preset, mode, { topic, language, env }) {
    let body = activeChunks(preset, mode, env).map((c) => String(c.text ?? "").trim()).filter(Boolean).join("\n\n");
    if (!body.includes("{{주제}}")) body = `[요청 주제]
{{주제}}

${body}`;
    body = applyVars(body, { 주제: cleanOoc(topic), 언어: language });
    return preset?.wrap === false ? body : `<System>
${body}
</System>`;
  }
  function findByTitle(items, query) {
    const q = String(query ?? "").trim().toLowerCase();
    if (!q) return null;
    const exact = items.find((i) => i.title.trim().toLowerCase() === q);
    if (exact) return exact;
    const partial = items.filter((i) => i.title.toLowerCase().includes(q));
    return partial.length === 1 ? partial[0] : null;
  }
  function titleFrom(text7, max = 40) {
    return cleanOoc(text7).split("\n")[0].replace(/\[\[|\]\]/g, "").trim().slice(0, max);
  }
  function hasScripts(code) {
    return /<script\b|\son[a-z]+\s*=\s*["']|javascript:/i.test(String(code ?? ""));
  }
  function heightReporter(token) {
    return `(function(){var T=${JSON.stringify(token)};var last=0;function h(){var d=document.documentElement,b=document.body;var v=Math.ceil(Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,b?b.getBoundingClientRect().height:0));if(v&&Math.abs(v-last)>2){last=v;parent.postMessage({wandHeight:v,token:T},'*');}}addEventListener('load',h);addEventListener('resize',h);document.addEventListener('DOMContentLoaded',function(){h();try{new ResizeObserver(h).observe(document.body);}catch(e){}});var n=0,i=setInterval(function(){h();if(++n>20)clearInterval(i);},250);})();`;
  }
  function buildSrcdoc(code, { token, baseUrl = "", allowExternal = true }) {
    const head = [];
    if (baseUrl) head.push(`<base href="${baseUrl.replace(/"/g, "&quot;")}">`);
    if (!allowExternal) {
      head.push(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">`);
    }
    head.push(`<script>${heightReporter(token)}<\/script>`);
    const inject = head.join("");
    let doc = String(code ?? "");
    if (!looksLikeHtmlDoc(doc)) {
      doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${doc}</body></html>`;
    }
    if (/<head[^>]*>/i.test(doc)) return doc.replace(/<head[^>]*>/i, (m2) => m2 + inject);
    if (/<html[^>]*>/i.test(doc)) return doc.replace(/<html[^>]*>/i, (m2) => `${m2}<head>${inject}</head>`);
    return inject + doc;
  }

  // node_modules/html-to-image/es/util.js
  function resolveUrl(url, baseUrl) {
    if (url.match(/^[a-z]+:\/\//i)) {
      return url;
    }
    if (url.match(/^\/\//)) {
      return window.location.protocol + url;
    }
    if (url.match(/^[a-z]+:/i)) {
      return url;
    }
    const doc = document.implementation.createHTMLDocument();
    const base = doc.createElement("base");
    const a = doc.createElement("a");
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl) {
      base.href = baseUrl;
    }
    a.href = url;
    return a.href;
  }
  var uuid = /* @__PURE__ */ (() => {
    let counter = 0;
    const random = () => (
      // eslint-disable-next-line no-bitwise
      `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
    );
    return () => {
      counter += 1;
      return `u${random()}${counter}`;
    };
  })();
  function toArray(arrayLike) {
    const arr = [];
    for (let i = 0, l = arrayLike.length; i < l; i++) {
      arr.push(arrayLike[i]);
    }
    return arr;
  }
  var styleProps = null;
  function getStyleProperties(options = {}) {
    if (styleProps) {
      return styleProps;
    }
    if (options.includeStyleProperties) {
      styleProps = options.includeStyleProperties;
      return styleProps;
    }
    styleProps = toArray(window.getComputedStyle(document.documentElement));
    return styleProps;
  }
  function px(node, styleProperty) {
    const win = node.ownerDocument.defaultView || window;
    const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
    return val ? parseFloat(val.replace("px", "")) : 0;
  }
  function getNodeWidth(node) {
    const leftBorder = px(node, "border-left-width");
    const rightBorder = px(node, "border-right-width");
    return node.clientWidth + leftBorder + rightBorder;
  }
  function getNodeHeight(node) {
    const topBorder = px(node, "border-top-width");
    const bottomBorder = px(node, "border-bottom-width");
    return node.clientHeight + topBorder + bottomBorder;
  }
  function getImageSize(targetNode, options = {}) {
    const width = options.width || getNodeWidth(targetNode);
    const height = options.height || getNodeHeight(targetNode);
    return { width, height };
  }
  function getPixelRatio() {
    let ratio;
    let FINAL_PROCESS;
    try {
      FINAL_PROCESS = process;
    } catch (e) {
    }
    const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
    if (val) {
      ratio = parseInt(val, 10);
      if (Number.isNaN(ratio)) {
        ratio = 1;
      }
    }
    return ratio || window.devicePixelRatio || 1;
  }
  var canvasDimensionLimit = 16384;
  function checkCanvasDimensions(canvas) {
    if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
        if (canvas.width > canvas.height) {
          canvas.height *= canvasDimensionLimit / canvas.width;
          canvas.width = canvasDimensionLimit;
        } else {
          canvas.width *= canvasDimensionLimit / canvas.height;
          canvas.height = canvasDimensionLimit;
        }
      } else if (canvas.width > canvasDimensionLimit) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    }
  }
  function canvasToBlob(canvas, options = {}) {
    if (canvas.toBlob) {
      return new Promise((resolve) => {
        canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
      });
    }
    return new Promise((resolve) => {
      const binaryString = window.atob(canvas.toDataURL(options.type ? options.type : void 0, options.quality ? options.quality : void 0).split(",")[1]);
      const len = binaryString.length;
      const binaryArray = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) {
        binaryArray[i] = binaryString.charCodeAt(i);
      }
      resolve(new Blob([binaryArray], {
        type: options.type ? options.type : "image/png"
      }));
    });
  }
  function createImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        img.decode().then(() => {
          requestAnimationFrame(() => resolve(img));
        });
      };
      img.onerror = reject;
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.src = url;
    });
  }
  async function svgToDataURL(svg) {
    return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
  }
  async function nodeToDataURL(node, width, height) {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    const foreignObject = document.createElementNS(xmlns, "foreignObject");
    svg.setAttribute("width", `${width}`);
    svg.setAttribute("height", `${height}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.setAttribute("x", "0");
    foreignObject.setAttribute("y", "0");
    foreignObject.setAttribute("externalResourcesRequired", "true");
    svg.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svgToDataURL(svg);
  }
  var isInstanceOfElement = (node, instance) => {
    if (node instanceof instance)
      return true;
    const nodePrototype = Object.getPrototypeOf(node);
    if (nodePrototype === null)
      return false;
    return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
  };

  // node_modules/html-to-image/es/clone-pseudos.js
  function formatCSSText(style) {
    const content = style.getPropertyValue("content");
    return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
  }
  function formatCSSProperties(style, options) {
    return getStyleProperties(options).map((name) => {
      const value = style.getPropertyValue(name);
      const priority = style.getPropertyPriority(name);
      return `${name}: ${value}${priority ? " !important" : ""};`;
    }).join(" ");
  }
  function getPseudoElementStyle(className, pseudo, style, options) {
    const selector = `.${className}:${pseudo}`;
    const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
    return document.createTextNode(`${selector}{${cssText}}`);
  }
  function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
    const style = window.getComputedStyle(nativeNode, pseudo);
    const content = style.getPropertyValue("content");
    if (content === "" || content === "none") {
      return;
    }
    const className = uuid();
    try {
      clonedNode.className = `${clonedNode.className} ${className}`;
    } catch (err) {
      return;
    }
    const styleElement = document.createElement("style");
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
    clonedNode.appendChild(styleElement);
  }
  function clonePseudoElements(nativeNode, clonedNode, options) {
    clonePseudoElement(nativeNode, clonedNode, ":before", options);
    clonePseudoElement(nativeNode, clonedNode, ":after", options);
  }

  // node_modules/html-to-image/es/mimes.js
  var WOFF = "application/font-woff";
  var JPEG = "image/jpeg";
  var mimes = {
    woff: WOFF,
    woff2: WOFF,
    ttf: "application/font-truetype",
    eot: "application/vnd.ms-fontobject",
    png: "image/png",
    jpg: JPEG,
    jpeg: JPEG,
    gif: "image/gif",
    tiff: "image/tiff",
    svg: "image/svg+xml",
    webp: "image/webp"
  };
  function getExtension(url) {
    const match = /\.([^./]*?)$/g.exec(url);
    return match ? match[1] : "";
  }
  function getMimeType(url) {
    const extension = getExtension(url).toLowerCase();
    return mimes[extension] || "";
  }

  // node_modules/html-to-image/es/dataurl.js
  function getContentFromDataUrl(dataURL) {
    return dataURL.split(/,/)[1];
  }
  function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
  }
  function makeDataUrl(content, mimeType) {
    return `data:${mimeType};base64,${content}`;
  }
  async function fetchAsDataURL(url, init, process2) {
    const res = await fetch(url, init);
    if (res.status === 404) {
      throw new Error(`Resource "${res.url}" not found`);
    }
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => {
        try {
          resolve(process2({ res, result: reader.result }));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(blob);
    });
  }
  var cache = {};
  function getCacheKey(url, contentType, includeQueryParams) {
    let key2 = url.replace(/\?.*/, "");
    if (includeQueryParams) {
      key2 = url;
    }
    if (/ttf|otf|eot|woff2?/i.test(key2)) {
      key2 = key2.replace(/.*\//, "");
    }
    return contentType ? `[${contentType}]${key2}` : key2;
  }
  async function resourceToDataURL(resourceUrl, contentType, options) {
    const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
    if (cache[cacheKey] != null) {
      return cache[cacheKey];
    }
    if (options.cacheBust) {
      resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
    }
    let dataURL;
    try {
      const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
        if (!contentType) {
          contentType = res.headers.get("Content-Type") || "";
        }
        return getContentFromDataUrl(result);
      });
      dataURL = makeDataUrl(content, contentType);
    } catch (error) {
      dataURL = options.imagePlaceholder || "";
      let msg = `Failed to fetch resource: ${resourceUrl}`;
      if (error) {
        msg = typeof error === "string" ? error : error.message;
      }
      if (msg) {
        console.warn(msg);
      }
    }
    cache[cacheKey] = dataURL;
    return dataURL;
  }

  // node_modules/html-to-image/es/clone-node.js
  async function cloneCanvasElement(canvas) {
    const dataURL = canvas.toDataURL();
    if (dataURL === "data:,") {
      return canvas.cloneNode(false);
    }
    return createImage(dataURL);
  }
  async function cloneVideoElement(video, options) {
    if (video.currentSrc) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL2 = canvas.toDataURL();
      return createImage(dataURL2);
    }
    const poster = video.poster;
    const contentType = getMimeType(poster);
    const dataURL = await resourceToDataURL(poster, contentType, options);
    return createImage(dataURL);
  }
  async function cloneIFrameElement(iframe, options) {
    var _a;
    try {
      if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
        return await cloneNode(iframe.contentDocument.body, options, true);
      }
    } catch (_b) {
    }
    return iframe.cloneNode(false);
  }
  async function cloneSingleNode(node, options) {
    if (isInstanceOfElement(node, HTMLCanvasElement)) {
      return cloneCanvasElement(node);
    }
    if (isInstanceOfElement(node, HTMLVideoElement)) {
      return cloneVideoElement(node, options);
    }
    if (isInstanceOfElement(node, HTMLIFrameElement)) {
      return cloneIFrameElement(node, options);
    }
    return node.cloneNode(isSVGElement(node));
  }
  var isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
  var isSVGElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SVG";
  async function cloneChildren(nativeNode, clonedNode, options) {
    var _a, _b;
    if (isSVGElement(clonedNode)) {
      return clonedNode;
    }
    let children = [];
    if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
      children = toArray(nativeNode.assignedNodes());
    } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
      children = toArray(nativeNode.contentDocument.body.childNodes);
    } else {
      children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
    }
    if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
      return clonedNode;
    }
    await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
      if (clonedChild) {
        clonedNode.appendChild(clonedChild);
      }
    }), Promise.resolve());
    return clonedNode;
  }
  function cloneCSSStyle(nativeNode, clonedNode, options) {
    const targetStyle = clonedNode.style;
    if (!targetStyle) {
      return;
    }
    const sourceStyle = window.getComputedStyle(nativeNode);
    if (sourceStyle.cssText) {
      targetStyle.cssText = sourceStyle.cssText;
      targetStyle.transformOrigin = sourceStyle.transformOrigin;
    } else {
      getStyleProperties(options).forEach((name) => {
        let value = sourceStyle.getPropertyValue(name);
        if (name === "font-size" && value.endsWith("px")) {
          const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
          value = `${reducedFont}px`;
        }
        if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
          value = "block";
        }
        if (name === "d" && clonedNode.getAttribute("d")) {
          value = `path(${clonedNode.getAttribute("d")})`;
        }
        targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
      });
    }
  }
  function cloneInputValue(nativeNode, clonedNode) {
    if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
      clonedNode.innerHTML = nativeNode.value;
    }
    if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
      clonedNode.setAttribute("value", nativeNode.value);
    }
  }
  function cloneSelectValue(nativeNode, clonedNode) {
    if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
      const clonedSelect = clonedNode;
      const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
      if (selectedOption) {
        selectedOption.setAttribute("selected", "");
      }
    }
  }
  function decorate(nativeNode, clonedNode, options) {
    if (isInstanceOfElement(clonedNode, Element)) {
      cloneCSSStyle(nativeNode, clonedNode, options);
      clonePseudoElements(nativeNode, clonedNode, options);
      cloneInputValue(nativeNode, clonedNode);
      cloneSelectValue(nativeNode, clonedNode);
    }
    return clonedNode;
  }
  async function ensureSVGSymbols(clone, options) {
    const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
    if (uses.length === 0) {
      return clone;
    }
    const processedDefs = {};
    for (let i = 0; i < uses.length; i++) {
      const use = uses[i];
      const id = use.getAttribute("xlink:href");
      if (id) {
        const exist = clone.querySelector(id);
        const definition = document.querySelector(id);
        if (!exist && definition && !processedDefs[id]) {
          processedDefs[id] = await cloneNode(definition, options, true);
        }
      }
    }
    const nodes = Object.values(processedDefs);
    if (nodes.length) {
      const ns = "http://www.w3.org/1999/xhtml";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("xmlns", ns);
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.overflow = "hidden";
      svg.style.display = "none";
      const defs = document.createElementNS(ns, "defs");
      svg.appendChild(defs);
      for (let i = 0; i < nodes.length; i++) {
        defs.appendChild(nodes[i]);
      }
      clone.appendChild(svg);
    }
    return clone;
  }
  async function cloneNode(node, options, isRoot) {
    if (!isRoot && options.filter && !options.filter(node)) {
      return null;
    }
    return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode, options)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
  }

  // node_modules/html-to-image/es/embed-resources.js
  var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
  var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
  var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
  function toRegex(url) {
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
  }
  function parseURLs(cssText) {
    const urls = [];
    cssText.replace(URL_REGEX, (raw, quotation, url) => {
      urls.push(url);
      return raw;
    });
    return urls.filter((url) => !isDataUrl(url));
  }
  async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
    try {
      const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
      const contentType = getMimeType(resourceURL);
      let dataURL;
      if (getContentFromUrl) {
        const content = await getContentFromUrl(resolvedURL);
        dataURL = makeDataUrl(content, contentType);
      } else {
        dataURL = await resourceToDataURL(resolvedURL, contentType, options);
      }
      return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
    } catch (error) {
    }
    return cssText;
  }
  function filterPreferredFontFormat(str8, { preferredFontFormat }) {
    return !preferredFontFormat ? str8 : str8.replace(FONT_SRC_REGEX, (match) => {
      while (true) {
        const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
        if (!format) {
          return "";
        }
        if (format === preferredFontFormat) {
          return `src: ${src};`;
        }
      }
    });
  }
  function shouldEmbed(url) {
    return url.search(URL_REGEX) !== -1;
  }
  async function embedResources(cssText, baseUrl, options) {
    if (!shouldEmbed(cssText)) {
      return cssText;
    }
    const filteredCSSText = filterPreferredFontFormat(cssText, options);
    const urls = parseURLs(filteredCSSText);
    return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
  }

  // node_modules/html-to-image/es/embed-images.js
  async function embedProp(propName, node, options) {
    var _a;
    const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
    if (propValue) {
      const cssString = await embedResources(propValue, null, options);
      node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
      return true;
    }
    return false;
  }
  async function embedBackground(clonedNode, options) {
    ;
    await embedProp("background", clonedNode, options) || await embedProp("background-image", clonedNode, options);
    await embedProp("mask", clonedNode, options) || await embedProp("-webkit-mask", clonedNode, options) || await embedProp("mask-image", clonedNode, options) || await embedProp("-webkit-mask-image", clonedNode, options);
  }
  async function embedImageNode(clonedNode, options) {
    const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
    if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
      return;
    }
    const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
    const dataURL = await resourceToDataURL(url, getMimeType(url), options);
    await new Promise((resolve, reject) => {
      clonedNode.onload = resolve;
      clonedNode.onerror = options.onImageErrorHandler ? (...attributes) => {
        try {
          resolve(options.onImageErrorHandler(...attributes));
        } catch (error) {
          reject(error);
        }
      } : reject;
      const image = clonedNode;
      if (image.decode) {
        image.decode = resolve;
      }
      if (image.loading === "lazy") {
        image.loading = "eager";
      }
      if (isImageElement) {
        clonedNode.srcset = "";
        clonedNode.src = dataURL;
      } else {
        clonedNode.href.baseVal = dataURL;
      }
    });
  }
  async function embedChildren(clonedNode, options) {
    const children = toArray(clonedNode.childNodes);
    const deferreds = children.map((child) => embedImages(child, options));
    await Promise.all(deferreds).then(() => clonedNode);
  }
  async function embedImages(clonedNode, options) {
    if (isInstanceOfElement(clonedNode, Element)) {
      await embedBackground(clonedNode, options);
      await embedImageNode(clonedNode, options);
      await embedChildren(clonedNode, options);
    }
  }

  // node_modules/html-to-image/es/apply-style.js
  function applyStyle(node, options) {
    const { style } = node;
    if (options.backgroundColor) {
      style.backgroundColor = options.backgroundColor;
    }
    if (options.width) {
      style.width = `${options.width}px`;
    }
    if (options.height) {
      style.height = `${options.height}px`;
    }
    const manual = options.style;
    if (manual != null) {
      Object.keys(manual).forEach((key2) => {
        style[key2] = manual[key2];
      });
    }
    return node;
  }

  // node_modules/html-to-image/es/embed-webfonts.js
  var cssFetchCache = {};
  async function fetchCSS(url) {
    let cache2 = cssFetchCache[url];
    if (cache2 != null) {
      return cache2;
    }
    const res = await fetch(url);
    const cssText = await res.text();
    cache2 = { url, cssText };
    cssFetchCache[url] = cache2;
    return cache2;
  }
  async function embedFonts(data, options) {
    let cssText = data.cssText;
    const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
    const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
    const loadFonts = fontLocs.map(async (loc) => {
      let url = loc.replace(regexUrl, "$1");
      if (!url.startsWith("https://")) {
        url = new URL(url, data.url).href;
      }
      return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
        cssText = cssText.replace(loc, `url(${result})`);
        return [loc, result];
      });
    });
    return Promise.all(loadFonts).then(() => cssText);
  }
  function parseCSS(source) {
    if (source == null) {
      return [];
    }
    const result = [];
    const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
    let cssText = source.replace(commentsRegex, "");
    const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
    while (true) {
      const matches = keyframesRegex.exec(cssText);
      if (matches === null) {
        break;
      }
      result.push(matches[0]);
    }
    cssText = cssText.replace(keyframesRegex, "");
    const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
    const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
    while (true) {
      let matches = importRegex.exec(cssText);
      if (matches === null) {
        matches = unifiedRegex.exec(cssText);
        if (matches === null) {
          break;
        } else {
          importRegex.lastIndex = unifiedRegex.lastIndex;
        }
      } else {
        unifiedRegex.lastIndex = importRegex.lastIndex;
      }
      result.push(matches[0]);
    }
    return result;
  }
  async function getCSSRules(styleSheets, options) {
    const ret = [];
    const deferreds = [];
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray(sheet.cssRules || []).forEach((item, index) => {
            if (item.type === CSSRule.IMPORT_RULE) {
              let importIndex = index + 1;
              const url = item.href;
              const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
                try {
                  sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
                } catch (error) {
                  console.error("Error inserting rule from remote css", {
                    rule,
                    error
                  });
                }
              })).catch((e) => {
                console.error("Error loading remote css", e.toString());
              });
              deferreds.push(deferred);
            }
          });
        } catch (e) {
          const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
          if (sheet.href != null) {
            deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              inline.insertRule(rule, inline.cssRules.length);
            })).catch((err) => {
              console.error("Error loading remote stylesheet", err);
            }));
          }
          console.error("Error inlining remote css file", e);
        }
      }
    });
    return Promise.all(deferreds).then(() => {
      styleSheets.forEach((sheet) => {
        if ("cssRules" in sheet) {
          try {
            toArray(sheet.cssRules || []).forEach((item) => {
              ret.push(item);
            });
          } catch (e) {
            console.error(`Error while reading CSS rules from ${sheet.href}`, e);
          }
        }
      });
      return ret;
    });
  }
  function getWebFontRules(cssRules) {
    return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
  }
  async function parseWebFontRules(node, options) {
    if (node.ownerDocument == null) {
      throw new Error("Provided element is not within a Document");
    }
    const styleSheets = toArray(node.ownerDocument.styleSheets);
    const cssRules = await getCSSRules(styleSheets, options);
    return getWebFontRules(cssRules);
  }
  function normalizeFontFamily(font) {
    return font.trim().replace(/["']/g, "");
  }
  function getUsedFonts(node) {
    const fonts = /* @__PURE__ */ new Set();
    function traverse(node2) {
      const fontFamily = node2.style.fontFamily || getComputedStyle(node2).fontFamily;
      fontFamily.split(",").forEach((font) => {
        fonts.add(normalizeFontFamily(font));
      });
      Array.from(node2.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          traverse(child);
        }
      });
    }
    traverse(node);
    return fonts;
  }
  async function getWebFontCSS(node, options) {
    const rules = await parseWebFontRules(node, options);
    const usedFonts = getUsedFonts(node);
    const cssTexts = await Promise.all(rules.filter((rule) => usedFonts.has(normalizeFontFamily(rule.style.fontFamily))).map((rule) => {
      const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
      return embedResources(rule.cssText, baseUrl, options);
    }));
    return cssTexts.join("\n");
  }
  async function embedWebFonts(clonedNode, options) {
    const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
    if (cssText) {
      const styleNode = document.createElement("style");
      const sytleContent = document.createTextNode(cssText);
      styleNode.appendChild(sytleContent);
      if (clonedNode.firstChild) {
        clonedNode.insertBefore(styleNode, clonedNode.firstChild);
      } else {
        clonedNode.appendChild(styleNode);
      }
    }
  }

  // node_modules/html-to-image/es/index.js
  async function toSvg(node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const clonedNode = await cloneNode(node, options, true);
    await embedWebFonts(clonedNode, options);
    await embedImages(clonedNode, options);
    applyStyle(clonedNode, options);
    const datauri = await nodeToDataURL(clonedNode, width, height);
    return datauri;
  }
  async function toCanvas(node, options = {}) {
    const { width, height } = getImageSize(node, options);
    const svg = await toSvg(node, options);
    const img = await createImage(svg);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const ratio = options.pixelRatio || getPixelRatio();
    const canvasWidth = options.canvasWidth || width;
    const canvasHeight = options.canvasHeight || height;
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    if (!options.skipAutoScale) {
      checkCanvasDimensions(canvas);
    }
    canvas.style.width = `${canvasWidth}`;
    canvas.style.height = `${canvasHeight}`;
    if (options.backgroundColor) {
      context.fillStyle = options.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  async function toBlob(node, options = {}) {
    const canvas = await toCanvas(node, options);
    const blob = await canvasToBlob(canvas);
    return blob;
  }

  // src/ui/capture.ts
  var BLANK_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  function isClear(color) {
    return !color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color);
  }
  async function captureDocument(doc) {
    const html = doc.documentElement;
    const body = doc.body ?? html;
    const view = doc.defaultView ?? window;
    const width = Math.max(html.scrollWidth, body.scrollWidth, 1);
    const height = Math.max(html.scrollHeight, body.scrollHeight, 1);
    const bodyBg = view.getComputedStyle(body).backgroundColor;
    const htmlBg = view.getComputedStyle(html).backgroundColor;
    const backgroundColor = !isClear(bodyBg) ? bodyBg : !isClear(htmlBg) ? htmlBg : "#ffffff";
    const options = { width, height, backgroundColor, pixelRatio: Math.min(2, window.devicePixelRatio || 1), imagePlaceholder: BLANK_PIXEL };
    let blob;
    try {
      blob = await toBlob(body, options);
    } catch {
      blob = await toBlob(body, { ...options, skipFonts: true });
    }
    if (!blob) throw new Error(t("Could not make the image.", "이미지를 만들지 못했어요."));
    return blob;
  }
  async function capturePage(frame, code) {
    const doc = frame && readable(frame);
    if (doc) return captureDocument(doc);
    const scratch = document.createElement("iframe");
    scratch.setAttribute("sandbox", "allow-same-origin");
    scratch.style.cssText = `position:fixed;left:-10000px;top:0;width:${frame?.clientWidth || 800}px;height:600px;border:0;`;
    const loaded = new Promise((resolve) => scratch.addEventListener("load", () => resolve(), { once: true }));
    scratch.srcdoc = code;
    document.body.append(scratch);
    try {
      await loaded;
      const d = readable(scratch);
      if (!d) throw new Error(t("Could not make the image.", "이미지를 만들지 못했어요."));
      return await captureDocument(d);
    } finally {
      scratch.remove();
    }
  }
  function readable(frame) {
    try {
      const doc = frame.contentDocument;
      return doc?.documentElement ? doc : null;
    } catch {
      return null;
    }
  }
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
  }

  // src/ui/viewer.ts
  var STYLE3 = `
${THEME_TOKENS}
:host { display: block; }
* { box-sizing: border-box; }
${CONTROLS}
.panel { margin: 0 0 6px; overflow: hidden; display: flex; flex-direction: column; max-height: 70vh;
  font: 13px/1.3 var(--d-font); color: var(--d-text);
  background: var(--d-shell-bg); border: var(--d-shell-border); border-radius: var(--d-shell-radius);
  box-shadow: var(--d-shell-shadow); backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur); }
.panel.full { position: fixed; inset: max(8px, env(safe-area-inset-top)) 8px max(8px, env(safe-area-inset-bottom)); z-index: 2147482500;
  width: auto; height: auto; max-width: none; max-height: none; margin: 0; padding: 0; color: var(--d-text);
  background: var(--d-panel-solid); box-shadow: 0 20px 60px rgb(0 0 0 / .45); }
.panel.full::backdrop { background: rgb(0 0 0 / .45); }
.head { display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-bottom: 1px solid var(--d-divider); flex-wrap: wrap; }
.title { flex: 1; min-width: 80px; font-weight: 600; color: var(--d-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 4px; }
.head button { padding: 4px 8px; }
.head button.ghost { padding: 4px 6px; }
button.warn { border-color: #e6a23c; color: #e6a23c; }
.chip-warn { font-size: 11px; padding: 2px 7px; border-radius: 999px; border: 1px solid #e6a23c; color: #e6a23c; cursor: help; }
.pages { display: flex; gap: 4px; padding: 4px 6px 0; flex-wrap: wrap; }
.pages button { padding: 2px 8px; font-size: 12px; }
.body { overflow: auto; flex: 1; min-height: 80px; }
iframe { display: block; width: 100%; height: 360px; border: 0; background: #fff; }
.panel.full iframe { height: 100% !important; }
.panel.full .body { display: flex; flex-direction: column; }
.panel.full .body iframe { flex: 1; }
pre { margin: 0; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font: inherit; }
svg { width: 15px; height: 15px; flex: none; }
`;
  var scriptProbe = null;
  function scriptsRun() {
    scriptProbe ??= new Promise((resolve) => {
      const token = `probe${Math.random().toString(36).slice(2)}`;
      const frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts");
      frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;";
      const done = (ok) => {
        window.removeEventListener("message", onMessage);
        clearTimeout(timer);
        frame.remove();
        resolve(ok);
      };
      const onMessage = (e) => {
        if (e.data?.dispensaProbe === token) done(true);
      };
      window.addEventListener("message", onMessage);
      const timer = setTimeout(() => done(false), 1500);
      frame.srcdoc = `<script>parent.postMessage({dispensaProbe:${JSON.stringify(token)}},"*")<\/script>`;
      document.body.append(frame);
    });
    return scriptProbe;
  }
  var fornello = () => {
    const bridge = window.__fornello;
    return bridge && bridge.version === 1 && typeof bridge.mount === "function" ? bridge : null;
  };
  var ViewerPanel = class {
    constructor(deps) {
      this.deps = deps;
      this.element = document.createElement("div");
      this.element.id = "dispensa-viewer";
      this.root = this.element.attachShadow({ mode: "open" });
      window.addEventListener("message", this.onMessage);
      document.addEventListener("keydown", this.onKey, true);
    }
    element;
    root;
    entry = null;
    page = 0;
    full = false;
    token = "";
    frame = null;
    scripts = null;
    resize = null;
    mounted = null;
    get open() {
      return this.entry !== null;
    }
    dispose() {
      window.removeEventListener("message", this.onMessage);
      document.removeEventListener("keydown", this.onKey, true);
      this.element.remove();
    }
    show(entry) {
      this.entry = { ...entry };
      this.page = 0;
      this.render();
      this.deps.onChange?.();
      if (this.scripts === null) {
        void scriptsRun().then((ok) => {
          this.scripts = ok;
          if (this.entry && !fornello()) this.render();
        });
      }
    }
    close() {
      this.mounted?.dispose();
      this.mounted = null;
      this.resize?.disconnect();
      this.resize = null;
      this.entry = null;
      this.full = false;
      this.frame = null;
      this.panel = null;
      this.sizeButton = null;
      this.root.replaceChildren();
      this.deps.onChange?.();
    }
    onKey = (e) => {
      if (e.key === "Escape" && this.full) {
        e.stopPropagation();
        this.setFull(false);
      }
    };
    onMessage = (event) => {
      const data = event.data;
      if (!data || typeof data.wandHeight !== "number" || data.token !== this.token || !this.frame) return;
      if (event.source !== this.frame.contentWindow || this.full) return;
      const max = Math.max(200, this.deps.store.value.settings.maxFrameHeight);
      this.frame.style.height = `${Math.min(max, Math.max(120, Math.ceil(data.wandHeight) + 4))}px`;
    };
    render() {
      const entry = this.entry;
      if (!entry) return;
      const style = document.createElement("style");
      style.textContent = STYLE3;
      const out = normalizeOutput(entry.text);
      const blocks = extractHtmlBlocks(out.text);
      this.page = Math.min(this.page, Math.max(0, blocks.length - 1));
      const current = blocks[this.page];
      const busy = !!this.deps.service.busy;
      const head = el(
        "div",
        { class: "head" },
        el("span", { class: "title", title: entry.title }, `${entry.kind === "viz" ? "🌟" : "💬"} ${entry.title}`),
        current && this.scripts === false && !fornello() && hasScripts(current.code) ? el(
          "span",
          {
            class: "chip-warn",
            title: t("Marinara blocks the page's scripts, so buttons and animations stay still. Install Fornello to run them", "마리나라가 페이지 속 스크립트를 막아서 버튼·애니메이션이 멈춤. Fornello를 설치하면 동작")
          },
          t("Scripts off", "스크립트 꺼짐")
        ) : null,
        current && !current.complete ? el("button", { class: "warn", part: "viewer-continue", title: t("The HTML was cut off. Continue writing", "HTML이 중간에 끊김. 이어서 쓰기"), disabled: busy, onclick: () => void this.continue() }, icon("refresh-cw"), t("Continue", "이어 쓰기")) : null,
        el(
          "button",
          { class: entry.archivedId ? "ghost on" : "ghost", part: "viewer-save", title: entry.archivedId ? t("In the Gallery", "갤러리에 있음") : t("Save to Gallery", "갤러리에 저장"), "aria-label": t("Save to Gallery", "갤러리에 저장"), onclick: () => void this.save() },
          icon("star")
        ),
        el("button", { class: "ghost", part: "viewer-post", title: t("Post to the chat as a character message", "채팅에 캐릭터 메시지로 넣기"), "aria-label": t("Post to chat", "채팅에 넣기"), disabled: busy, onclick: () => void this.postToChat() }, icon("send")),
        current ? el("button", { class: "ghost", title: t("Download as HTML file", "HTML 파일로 받기"), "aria-label": t("Download as HTML file", "HTML 파일로 받기"), onclick: () => this.download(current.code, current.title || entry.title) }, icon("download")) : null,
        current ? el("button", { class: "ghost", part: "viewer-image", title: t("Save as image (PNG)", "이미지(PNG)로 저장"), "aria-label": t("Save as image", "이미지로 저장"), onclick: (e) => void this.saveImage(e.currentTarget, current.code, current.title || entry.title) }, icon("image")) : null,
        this.sizeButton = el("button", { class: "ghost", title: this.full ? t("Smaller", "작게 보기") : t("Larger", "크게 보기"), "aria-label": t("Larger", "크게 보기"), onclick: () => this.setFull(!this.full) }, icon(this.full ? "minimize" : "maximize")),
        entry.archivedId ? el("button", { class: "ghost", part: "viewer-delete", title: t("Delete from Gallery", "갤러리에서 지우기"), "aria-label": t("Delete from Gallery", "갤러리에서 지우기"), onclick: () => void this.remove() }, icon("trash")) : null,
        el("button", { class: "ghost", part: "viewer-close", title: t("Close", "닫기"), "aria-label": t("Close", "닫기"), onclick: () => this.close() }, icon("x"))
      );
      const panel = el("div", { class: `panel${this.full ? " full" : ""}`, part: "viewer", role: "region", "aria-label": t("Visualizer viewer", "비주얼라이저 보기") }, head);
      if (blocks.length > 1) {
        panel.append(
          el(
            "div",
            { class: "pages" },
            ...blocks.map((b, i) => el("button", { class: i === this.page ? "sel" : "", title: b.title, onclick: () => (this.page = i, this.render()) }, b.title ? `${i + 1}. ${b.title.slice(0, 20)}` : String(i + 1)))
          )
        );
      }
      const body = el("div", { class: "body" });
      this.resize?.disconnect();
      this.resize = null;
      this.mounted?.dispose();
      this.mounted = null;
      const bridge = fornello();
      if (current && bridge) {
        this.frame = null;
        const holder = el("div", { class: "fornello" });
        body.append(holder);
        this.mounted = bridge.mount(holder, current.code);
      } else if (current) {
        this.token = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const noScripts = this.scripts === false;
        const frame = el("iframe", {
          sandbox: noScripts ? "allow-same-origin allow-popups allow-popups-to-escape-sandbox" : "allow-scripts allow-popups allow-modals allow-forms allow-downloads",
          title: current.title || entry.title,
          referrerpolicy: "no-referrer"
        });
        frame.srcdoc = buildSrcdoc(current.code, { token: this.token, allowExternal: this.deps.store.value.settings.allowExternal });
        if (noScripts) frame.addEventListener("load", () => this.measure(frame));
        this.frame = frame;
        body.append(frame);
      } else {
        this.frame = null;
        body.append(el("pre", {}, out.text));
      }
      panel.append(body);
      this.root.replaceChildren(style, panel);
      this.panel = panel;
      if (this.full) this.applyFull();
    }
    panel = null;
    sizeButton = null;
    /**
     * Big or back above the Dock, without drawing the page again (a running
     * page keeps its state). Big, the panel sits in the browser's top layer (a
     * popover), above Marinara's bars, so its buttons always stay reachable.
     */
    setFull(on) {
      if (on === this.full) return;
      this.full = on;
      this.applyFull();
      if (!on && this.frame && this.scripts === false) this.measure(this.frame);
    }
    applyFull() {
      const panel = this.panel;
      if (!panel) return;
      panel.classList.toggle("full", this.full);
      if (typeof panel.showPopover === "function") {
        try {
          if (this.full && !panel.matches(":popover-open")) {
            panel.popover = "manual";
            panel.showPopover();
          } else if (!this.full && panel.matches(":popover-open")) {
            panel.hidePopover();
            panel.removeAttribute("popover");
          }
        } catch {
        }
      }
      const b = this.sizeButton;
      if (b) {
        b.title = this.full ? t("Smaller", "작게 보기") : t("Larger", "크게 보기");
        b.replaceChildren(icon(this.full ? "minimize" : "maximize"));
      }
    }
    measure(frame) {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      const fit = () => {
        if (this.full) return;
        const body = doc.body;
        if (!body) return;
        const cs = doc.defaultView?.getComputedStyle(body);
        const margin = cs ? parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) : 0;
        const h2 = Math.ceil(body.scrollHeight + margin);
        const max = Math.max(200, this.deps.store.value.settings.maxFrameHeight);
        frame.style.height = `${Math.min(max, Math.max(120, h2 + 4))}px`;
      };
      fit();
      this.resize?.disconnect();
      this.resize = new ResizeObserver(fit);
      if (doc.body) this.resize.observe(doc.body);
    }
    async continue() {
      if (!this.entry) return;
      const next = await this.deps.service.continueEntry(this.entry);
      if (next && this.entry) {
        this.entry = next;
        this.render();
      }
    }
    async save() {
      if (!this.entry || this.entry.archivedId) return;
      try {
        await this.deps.service.save(this.entry);
        this.deps.ui.toast(t("Saved to the Gallery.", "갤러리에 저장했어요."), "success", { title: "🌟" });
      } catch (e) {
        this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Gallery", "갤러리") });
      }
      this.render();
    }
    async postToChat() {
      if (!this.entry) return;
      const entry = this.entry;
      if (await this.deps.service.postToChat(entry)) {
        if (this.deps.store.value.settings.autoArchive && !entry.archivedId) await this.deps.service.save(entry).catch(() => void 0);
        this.deps.ui.toast(t("Posted to the chat.", "채팅에 넣었어요."), "success", { title: "🌟" });
      }
      this.render();
    }
    async remove() {
      const entry = this.entry;
      if (!entry?.archivedId) return;
      if (!await this.deps.ui.confirm(t(`Delete "${entry.title}" from the Gallery?`, `갤러리에서 "${entry.title}"을(를) 지울까요?`))) return;
      await this.deps.service.archive.remove(entry.archivedId);
      this.close();
    }
    download(code, title) {
      saveBlob(new Blob([code], { type: "text/html;charset=utf-8" }), `${fileName(title)}.html`);
    }
    /** The page as it looks now, Fornello's running page included. */
    async saveImage(button, code, title) {
      button.disabled = true;
      try {
        const frame = this.frame ?? this.root.querySelector(".fornello")?.querySelector(".fornello-block")?.shadowRoot?.querySelector("iframe") ?? null;
        saveBlob(await capturePage(frame, code), `${fileName(title)}.png`);
      } catch (error) {
        this.deps.ui.toast(t(`Could not save the image: ${error instanceof Error ? error.message : String(error)}`, `이미지로 저장하지 못했어요: ${error instanceof Error ? error.message : String(error)}`), "warning", { title: "🌟" });
      } finally {
        button.disabled = false;
      }
    }
  };
  var fileName = (title) => title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "wand";

  // src/wand/superviz.ts
  var SUPERVIZ = {
    "id": "superviz",
    "name": "슈퍼비즈 (기본)",
    "wrap": true,
    "chunks": [
      {
        "id": "role",
        "name": "역할 · 임무",
        "mode": "all",
        "enabled": true,
        "text": "# ROLE\n\nAdaptive RP Interface & Document Designer\n\n# MISSION\n\nAnalyze the user's request and our RP context to design a rich, interactive, and technically robust HTML document. The final output must be both aesthetically pleasing and deeply meaningful.\n\n# CRITICAL LANGUAGE INSTRUCTION\n\nAll user-facing text in the generated HTML (UI text, titles, in-character writing, etc.) MUST be written in {{언어}}."
      },
      {
        "id": "content",
        "name": "내용 지침 (주제 · 형식 흉내 · RP 반영)",
        "mode": "all",
        "enabled": true,
        "text": '## PART 1: CREATIVE & CONTENT DIRECTIVE (The "What")\n\n### 1.1. ANALYSIS & FORMAT EMULATION\n\n- User Request: `{{주제}}`\n- Identify Format: Determine the specific format, document, or platform to emulate (e.g., a personal journal, a mobile wedding invitation, a Wikipedia article, an OS UI, a yearbook, etc.).\n- Emulate Style: Faithfully recreate the aesthetic and layout conventions of that format.\n\n### 1.2. RICH RP-BASED CONTENT INTEGRATION\n\n- Deep Context: Fill the emulated format with content that deeply reflects the personalities, memories, shared history, and relationship dynamics of {{user}} and {{char}}.\n- Diverse Content: If the format allows, mix different content types. For example, a journal could include short paragraphs, a single quoted sentence, and a bulleted list of thoughts.\n- Highlight the Core: Pay special attention to the central theme of the request (e.g., specific vows in an invitation, a secret clause in a will, a character\'s thought process).\n- Authentic Voice: Ensure all text is written in a voice that is authentic to the characters.'
      },
      {
        "id": "interaction",
        "name": "상호작용 패턴 (모달 · 이벤트 위임 · 드래그)",
        "mode": "full",
        "enabled": true,
        "text": "## PART 2: INTERACTION DESIGN & PATTERNS (The \"How\")\n\n### 2.1. CORE INTERACTION PRINCIPLE\n\n- Systematic Interaction: Implement a meaningful interactive 'system'. If there are multiple items (like posts, chat logs, files, or app icons), each item MUST be independently interactive, revealing its own unique content upon being clicked or touched.\n- Content Storage: All narrative content (descriptions, stories, names) to be revealed via interaction MUST be stored in HTML `data-*` attributes on their respective trigger elements.\n\n### 2.2. SPECIFIC INTERACTION PATTERNS\n\n- Modals: Use a hidden modal `div` for detailed information. A click on a trigger element should display the modal and populate it with content from the trigger's `data-*` attributes.\n- Grids/Lists: For choices or item lists, use Flexbox or Grid. Handle all click events efficiently using Event Delegation on the parent container.\n- Draggability: If draggable elements are needed, use `position: absolute`. The logic MUST handle both desktop (`mousedown`, `mousemove`, `mouseup`) and mobile (`touchstart`, `touchmove`, `touchend`) events for full compatibility."
      },
      {
        "id": "tech",
        "name": "기술 기반 (CSS 리셋 · gameState · updateUI)",
        "mode": "full",
        "enabled": true,
        "text": '## PART 3: TECHNICAL & ARCHITECTURAL BLUEPRINT (The "Foundation")\n\n### 3.1. CORE STRUCTURE & STYLING RULES\n\n- CSS Reset: The CSS MUST start with a universal reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`) to ensure browser consistency.\n- Layout: The `body` tag MUST have `min-height: 100vh;` for a flexible, full-page layout.\n- Theming: Use CSS Variables (`:root { --primary-color: #...; }`) to define the color palette for easy theming and maintenance.\n- Fonts: Load Google Fonts that suit the format and support {{언어}} with a `<link rel="stylesheet">`, plus a system font fallback.\n- Positioning: For child elements positioned within a parent, use `position: relative` on the parent and `position: absolute` on the child.\n\n### 3.2. JAVASCRIPT & STATE MANAGEMENT\n\n- DOM Execution: All scripts that manipulate DOM elements MUST be placed within a `DOMContentLoaded` event listener.\n- Complex State: For dynamic scenes (games, simulations), you MUST establish a central `gameState` JavaScript object to hold all relevant variables (e.g., HP, inventory, dialogue progress).\n- UI Updates: All UI changes MUST be handled by a single, dedicated `updateUI()` function that reads from the `gameState` object. Do not manipulate the DOM directly from event listeners.\n- Error Handling: Wrap async code in `try/catch` and show errors in the page.'
      },
      {
        "id": "fornello",
        "name": "Fornello 명령어 (DM · 기억 · 이야기 연결)",
        "mode": "full",
        "enabled": true,
        "needs": "fornello",
        "text": '## PART 4: LIVE CHAT COMMANDS (FORNELLO)\n\nThe page runs inside the chat app through the Fornello extension, which gives its scripts the global functions below (call them directly). Use them only when the request needs them: a page that is only read or browsed needs none. Never fake a character\'s reply with prewritten text when `genChat` can produce a real one.\n\n- `await genChat(prompt, { history: 10 })`: The AI answers `prompt` knowing the character cards and the last 10 chat messages, and returns the text; nothing is added to the chat. For conversations and turns inside the page (DMs, comments, calls, game scenes). Leave out `{ history: 10 }` only when the reply needs the whole chat (lorebooks, older events): that costs much more per call.\n- `localStorage`: Kept for this chat through reloads. Save the page\'s state (conversation history, progress) after every change and restore it on load.\n- `await setLore("@chat", { name, content, constant: true })`: Writes an entry in this chat\'s own lorebook, which the story reads.\n- `await getTracker()` / `await setTracker({ "custom.Affection": "72" })`: The chat\'s tracker values, which the story reads every turn.\n\n### RULES\n\n- Call `genChat` only on a user action (a click or a send), never on load, in loops or on timers. Ask for one in-character reply in the page\'s language, include the recent in-page history, and request the reply text only.\n- While waiting, show a typing indicator and disable the send button; on error, show a short message and enable it again.\n- After a meaningful exchange, tell the story: a summary of at most 3 sentences, written as facts, with `setLore("@chat", …)` under the same entry name each time (updated, not duplicated), and changing numbers such as affection with `setTracker` (read the current value with `getTracker()` first and change it gradually).'
      },
      {
        "id": "lite-rules",
        "name": "라이트 모드 기술 규칙 (HTML·CSS만)",
        "mode": "lite",
        "enabled": true,
        "text": "## TECHNICAL RULES (LIGHT MODE: HTML & CSS ONLY)\n\n- Do NOT use JavaScript of any kind: no `<script>` tags, no `on*` event attributes, no `javascript:` URLs.\n- Do NOT load anything external: no external stylesheets or fonts, no `@import`, no remote image URLs.\n- Build interaction with pure HTML/CSS: `<details>`/`<summary>` to fold and reveal, hidden radio or checkbox inputs with `:checked` selectors for tabs, card flips and answer reveals, and `:hover`/`:focus` transitions for polish. Every interactive element must also work on touch screens.\n- Put all CSS in one `<style>` tag in the `<head>`.\n- Fit narrow screens: `max-width: 100%`, `box-sizing: border-box`, relative units, `flex-wrap`, no horizontal overflow. Let the page height follow its content: no `100vh` heights."
      },
      {
        "id": "img-emoji",
        "name": "이미지: 이모지 · SVG 그림",
        "mode": "all",
        "enabled": true,
        "text": "## IMAGES\n\n- Image Policy: Do NOT use external images (`<img>` tags with `src`). Instead, substitute them with appropriate emojis and text descriptions.\n- Illustrations: Draw the key visuals (scenes, maps, objects) as inline SVG; keep emojis for small icons."
      },
      {
        "id": "output-full",
        "name": "출력 형식 (완전한 HTML 문서, html 코드블록 하나)",
        "mode": "all",
        "enabled": true,
        "text": "## OUTPUT FORMAT\n\n- Your entire response MUST be a single Markdown code block containing a complete, self-contained HTML document, starting with `<!DOCTYPE html>` and ending with `</html>`. Nothing should appear outside this block."
      }
    ]
  };
  var OLD_CHUNK_TEXTS = {
    // Dispensa 0.2.0, before the font and error lines
    "tech": ['## PART 3: TECHNICAL & ARCHITECTURAL BLUEPRINT (The "Foundation")\n\n### 3.1. CORE STRUCTURE & STYLING RULES\n\n- CSS Reset: The CSS MUST start with a universal reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`) to ensure browser consistency.\n- Layout: The `body` tag MUST have `min-height: 100vh;` for a flexible, full-page layout.\n- Theming: Use CSS Variables (`:root { --primary-color: #...; }`) to define the color palette for easy theming and maintenance.\n- Positioning: For child elements positioned within a parent, use `position: relative` on the parent and `position: absolute` on the child.\n\n### 3.2. JAVASCRIPT & STATE MANAGEMENT\n\n- DOM Execution: All scripts that manipulate DOM elements MUST be placed within a `DOMContentLoaded` event listener.\n- Complex State: For dynamic scenes (games, simulations), you MUST establish a central `gameState` JavaScript object to hold all relevant variables (e.g., HP, inventory, dialogue progress).\n- UI Updates: All UI changes MUST be handled by a single, dedicated `updateUI()` function that reads from the `gameState` object. Do not manipulate the DOM directly from event listeners.'],
    // Dispensa 0.2.0, before the illustrations line
    "img-emoji": ["## IMAGES\n\n- Image Policy: Do NOT use external images (`<img>` tags with `src`). Instead, substitute them with appropriate emojis and text descriptions."]
  };

  // src/wand/model.ts
  var OOC_MODES = {
    get hidden() {
      return t("Get the result (as a character message)", "결과물 받기 (캐릭터 메시지로)");
    },
    get guided() {
      return t("Steer the next reply", "전개에 반영하기 (다음 답에)");
    },
    get user() {
      return t("Send as me", "직접 보내기 (내 메시지로)");
    },
    get input() {
      return t("Put in the input (edit, then send)", "입력창에 넣기 (고친 뒤 전송)");
    }
  };
  var VIZ_OUTPUTS = {
    get viewer() {
      return t("Viewer", "보기 창");
    },
    get chat() {
      return t("Chat", "채팅");
    }
  };
  var DEFAULT_SETTINGS = {
    language: "English",
    // Marinara's security policy stops scripts in pages: full only when Fornello runs them
    vizMode: "auto",
    vizOutput: "viewer",
    autoArchive: true,
    // like the user's SillyTavern QRs: /gen with the request, then /sendas the result as the character
    oocMode: "hidden",
    oocModeV2: true,
    wrapperId: DEFAULT_WRAPPERS[0].id,
    connectionId: "",
    showButton: true,
    barIcon: "🍰",
    allowExternal: true,
    maxFrameHeight: 1600
  };
  function defaultPreset() {
    return { ...structuredClone(SUPERVIZ), known: SUPERVIZ.chunks.map((c) => c.id) };
  }
  function defaultWandState() {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      items: structuredClone(DEFAULT_ITEMS),
      itemsMoved: false,
      wrappers: structuredClone(DEFAULT_WRAPPERS),
      preset: defaultPreset()
    };
  }
  function newWandId(prefix = "w") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  var str7 = (v, fallback = "") => typeof v === "string" ? v : fallback;
  var pick = (v, allowed, fallback) => allowed.includes(v) ? v : fallback;
  function normalizeItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw;
    const item = {
      id: str7(r.id) || newWandId("item"),
      emoji: str7(r.emoji),
      title: str7(r.title) || t("Untitled item", "이름 없는 항목"),
      folder: str7(r.folder),
      defaultAction: pick(r.defaultAction, ["ooc", "viz"], "viz"),
      content: str7(r.content),
      connectionId: str7(r.connectionId ?? r.profileId) || null,
      pinned: r.pinned === true
    };
    if (r.oocMode) item.oocMode = pick(r.oocMode, Object.keys(OOC_MODES), "guided");
    if (r.vizOutput) item.vizOutput = pick(r.vizOutput, ["viewer", "chat"], "viewer");
    if (typeof r.wrapperId === "string") item.wrapperId = r.wrapperId;
    return item;
  }
  function normalizeChunk(raw) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw;
    return {
      id: str7(r.id) || newWandId("chunk"),
      name: str7(r.name) || t("Chunk", "조각"),
      mode: pick(r.mode, ["all", "full", "lite"], "all"),
      enabled: r.enabled !== false,
      text: str7(r.text),
      ...r.needs === "fornello" ? { needs: "fornello" } : {}
    };
  }
  var LATER_BUILTINS = ["fornello"];
  function withNewTexts(chunks) {
    return chunks.map((c) => {
      const current = SUPERVIZ.chunks.find((b) => b.id === c.id);
      return current && OLD_CHUNK_TEXTS[c.id]?.includes(c.text) ? { ...c, text: current.text } : c;
    });
  }
  function withNewBuiltins(chunks, known) {
    const builtins = defaultPreset().chunks;
    const seen = new Set(known ?? builtins.map((b) => b.id).filter((id) => !LATER_BUILTINS.includes(id)));
    const out = [...chunks];
    builtins.forEach((b, i) => {
      if (seen.has(b.id)) return;
      const next = builtins.slice(i + 1).find((x) => out.some((c) => c.id === x.id));
      const at = next ? out.findIndex((c) => c.id === next.id) : out.length;
      out.splice(at, 0, structuredClone(b));
    });
    return { chunks: out, known: builtins.map((b) => b.id) };
  }
  function normalizeWandState(raw) {
    const base = defaultWandState();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    const s = r.settings && typeof r.settings === "object" ? r.settings : {};
    const settings = {
      language: str7(s.language) || DEFAULT_SETTINGS.language,
      vizMode: pick(s.vizMode, ["auto", "full", "lite"], DEFAULT_SETTINGS.vizMode),
      vizOutput: pick(s.vizOutput, ["viewer", "chat"], DEFAULT_SETTINGS.vizOutput),
      autoArchive: typeof s.autoArchive === "boolean" ? s.autoArchive : DEFAULT_SETTINGS.autoArchive,
      // "guided" was the default before: settings saved then follow the new default once
      oocMode: s.oocModeV2 !== true && s.oocMode === "guided" ? DEFAULT_SETTINGS.oocMode : pick(s.oocMode, Object.keys(OOC_MODES), DEFAULT_SETTINGS.oocMode),
      oocModeV2: true,
      wrapperId: str7(s.wrapperId) || DEFAULT_SETTINGS.wrapperId,
      connectionId: str7(s.connectionId),
      showButton: typeof s.showButton === "boolean" ? s.showButton : DEFAULT_SETTINGS.showButton,
      barIcon: str7(s.barIcon).trim() || DEFAULT_SETTINGS.barIcon,
      allowExternal: typeof s.allowExternal === "boolean" ? s.allowExternal : DEFAULT_SETTINGS.allowExternal,
      maxFrameHeight: Number(s.maxFrameHeight) >= 200 ? Number(s.maxFrameHeight) : DEFAULT_SETTINGS.maxFrameHeight
    };
    const itemsMoved = r.itemsMoved === true;
    const items = itemsMoved ? [] : Array.isArray(r.items) ? r.items.map(normalizeItem).filter((i) => !!i) : base.items;
    const wrappers = Array.isArray(r.wrappers) ? r.wrappers.filter((w) => !!w && typeof w === "object").map((w) => {
      const template = str7(w.template) || "{{내용}}";
      return { id: str7(w.id) || newWandId("wrap"), name: str7(w.name) || t("Wrapper", "감싸개"), template: OLD_OOC_TEMPLATES.includes(template) ? DEFAULT_OOC_TEMPLATE : template };
    }) : base.wrappers;
    let preset = base.preset;
    if (r.preset && typeof r.preset === "object") {
      const p = r.preset;
      const stored = Array.isArray(p.chunks) ? p.chunks.map(normalizeChunk).filter((c) => !!c) : null;
      const known = Array.isArray(p.known) ? p.known.map(String) : null;
      const { chunks, known: offered } = stored ? withNewBuiltins(withNewTexts(stored), known) : { chunks: base.preset.chunks, known: base.preset.known ?? [] };
      preset = { id: str7(p.id) || base.preset.id, name: str7(p.name) || base.preset.name, wrap: p.wrap !== false, chunks, known: offered };
    }
    return { version: 1, settings, items, itemsMoved, wrappers: wrappers.length ? wrappers : base.wrappers, preset };
  }
  function itemOptions(state, item) {
    const s = state.settings;
    return {
      oocMode: item?.oocMode ?? s.oocMode,
      vizOutput: item?.vizOutput ?? s.vizOutput,
      wrapper: state.wrappers.find((w) => w.id === (item?.wrapperId ?? s.wrapperId)) ?? state.wrappers[0] ?? DEFAULT_WRAPPERS[0],
      connectionId: item?.connectionId || s.connectionId || ""
    };
  }

  // src/ui/wand-settings.ts
  var WAND_SETTINGS_STYLE = `
.wand-settings { display: flex; flex-direction: column; gap: 12px; }
.wand-settings .card { border: 1px solid var(--d-line); border-radius: var(--d-radius); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.wand-settings .chunk { border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); padding: 6px 8px; display: flex; flex-direction: column; gap: 6px; transition: opacity .15s ease; }
.wand-settings .chunk.off { opacity: .55; }
.wand-settings textarea.short { min-height: 90px; }
.wand-settings .icon-input { width: 3.4em !important; min-width: 0 !important; text-align: center; }
.wand-settings details.more > summary { cursor: pointer; color: var(--d-muted); font-size: 12px; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px; }
.wand-settings details.more > summary::before { content: "▸"; transition: transform .15s ease; }
.wand-settings details.more[open] > summary::before { transform: rotate(90deg); }
.wand-settings .field-h { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--d-muted); }
`;
  function select(key2, entries, value, onChange, label = "") {
    return el(
      "select",
      { "data-key": key2, "aria-label": label || void 0, onchange: (e) => onChange(e.target.value) },
      ...entries.map(([v, text7]) => el("option", { value: v, selected: v === value }, text7))
    );
  }
  var MODE_LABEL = () => ({ all: t("Always", "항상"), full: t("Full only", "풀 모드만"), lite: t("Light only", "라이트 모드만") });
  var VIZ_MODES = () => [
    ["auto", t("Auto", "자동")],
    ["full", t("Full (with scripts)", "풀 (스크립트 포함)")],
    ["lite", t("Light (HTML·CSS)", "라이트 (HTML·CSS)")]
  ];
  var CHUNK_NAMES_EN = {
    superviz: "Superviz (default)",
    role: "Role · mission",
    content: "Content rules (topic · format mimicry · RP)",
    interaction: "Interaction patterns (modals · event delegation · drag)",
    tech: "Tech base (CSS reset · gameState · updateUI)",
    fornello: "Fornello commands (DM · memory · story link)",
    "lite-rules": "Light mode tech rules (HTML·CSS only)",
    "img-emoji": "Images: emoji · SVG drawings",
    "output-full": "Output format (full HTML document, one html code block)"
  };
  var SHIPPED_NAMES = new Map([[SUPERVIZ.id, SUPERVIZ.name], ...SUPERVIZ.chunks.map((c) => [c.id, c.name])]);
  function shownName(x) {
    const en = CHUNK_NAMES_EN[x.id];
    return en && SHIPPED_NAMES.get(x.id) === x.name ? t(en, x.name) : x.name;
  }
  var VIZ_HELP = {
    get vizMode() {
      return t("Kind of page to make\n· Auto: Full with Fornello, Light without\n· Full: pages with working buttons and animations (needs Fornello)\n· Light: pages with HTML and CSS only", "만들 페이지 종류\n· 자동: Fornello가 있으면 풀, 없으면 라이트\n· 풀: 버튼·애니메이션이 움직이는 페이지 (Fornello 필요)\n· 라이트: HTML·CSS만 쓴 페이지");
    },
    get vizOutput() {
      return t("Where the page shows\n· Viewer: a small window above the Dock. Can post to the chat\n· Chat: straight in as a character message", "만든 페이지를 보여 줄 곳\n· 보기 창: Dock 위 작은 창. 채팅에 넣기 가능\n· 채팅: 바로 캐릭터 메시지로");
    },
    get language() {
      return t("Language of the page text. E.g. Korean, English", "페이지 글의 언어. 예: Korean, English");
    },
    get autoArchive() {
      return t("Also collects pages posted to the chat in the Gallery. The Gallery is kept in this browser only", "채팅에 올린 페이지도 갤러리에 모으기. 갤러리는 이 브라우저에만 저장");
    },
    get external() {
      return t("Lets viewer pages load fonts, images and libraries from the internet", "보기 창 페이지가 인터넷의 글꼴·그림·라이브러리를 불러오도록 허용");
    },
    get oocMode() {
      return t("How 💬 OOC is sent\n· Get the result: the AI writes what you asked for as a character message. For out-of-RP results like community reactions or mini games\n· Steer the next reply: the next reply goes the way you asked (Marinara /guided)\n· Send as me: sends the request as your message\n· Put in the input: only puts it in the input. Edit, then send\nWith the first two, the request does not stay in the chat", "💬 OOC 보내는 방식\n· 결과물 받기: AI가 요청대로 만든 글을 캐릭터 메시지로. 커뮤니티 반응·미니 게임 같은 RP 밖 결과물용\n· 전개에 반영하기: 다음 답이 요청한 방향으로 진행 (마리나라 /guided)\n· 직접 보내기: 요청 글을 내 메시지로 전송\n· 입력창에 넣기: 입력창에만 넣기. 고쳐서 직접 전송\n앞의 둘은 요청 글이 채팅에 남지 않음");
    },
    get wrapper() {
      return t("Text put around the OOC. Edit it under 'Wrappers' below", "OOC 앞뒤에 붙일 문구. 아래 '감싸개'에서 편집");
    },
    get connection() {
      return t("AI connection used to make pages. For a model other than the chat's", "만들 때 쓸 AI 연결. 채팅과 다른 모델을 쓸 때");
    },
    get bubble() {
      return t("Shows the Visualizer menu bubble on the Dock. Change its icon (an emoji) in the box next to it", "Dock에 비주얼라이저 메뉴 버블 표시. 옆 칸에서 아이콘(이모지) 변경");
    },
    get preset() {
      return t("Instructions sent to the AI when making a page. Turn each chunk on or off, or edit it", "페이지를 만들 때 AI에게 보내는 지침. 조각마다 켜기·끄기·편집");
    },
    get wrap() {
      return t("Sends the whole prompt wrapped in <System> … </System>. Usually on", "지침 전체를 <System> … </System>으로 감싸 보내기. 보통 켜 둠");
    },
    get chunkText() {
      return t("{{주제}} becomes the request, {{언어}} the result language", "{{주제}} 자리에 요청, {{언어}} 자리에 결과 언어");
    },
    get chunkMode() {
      return t("When this chunk is included. Full only / Light only: just in that mode", "이 조각을 넣을 때. 풀 모드만 / 라이트 모드만은 그 모드에서만");
    },
    get wrappers() {
      return t("Text put around OOC when it is sent. {{내용}} becomes the OOC, {{언어}} the result language", "OOC를 보낼 때 앞뒤에 붙이는 문구. {{내용}} 자리에 OOC, {{언어}} 자리에 결과 언어");
    },
    get backup() {
      return t("Saves or restores the prompt, wrappers and defaults as one file", "본체·감싸개·기본값을 파일 하나로 저장·복원");
    }
  };
  var WandSettingsView = class {
    constructor(deps) {
      this.deps = deps;
    }
    openChunk = null;
    connections = null;
    get state() {
      return this.deps.store.value;
    }
    update(fn) {
      this.deps.store.update(fn);
    }
    /** The AI connections to choose from ("" = `inherit`); loaded once, then redrawn. */
    connectionEntries(inherit) {
      if (!this.connections) {
        this.connections = [];
        void this.deps.connections().then((list) => {
          this.connections = list;
          this.deps.rerender();
        }).catch(() => void 0);
      }
      return [["", inherit], ...this.connections.map((c) => [c.id, c.name])];
    }
    render() {
      return el("div", { class: "col wand-settings" }, this.defaults(), this.presetCard(), this.backup());
    }
    /** How the 메모장 sends OOC (its tab shows these): the way and the wrappers. */
    oocCards() {
      const s = this.state.settings;
      const set = (fn) => this.update((st) => fn(st.settings));
      const wrappers = this.state.wrappers.map((w) => [w.id, w.name]);
      return [
        el(
          "div",
          { class: "card" },
          section(
            t("💬 Send OOC", "💬 OOC 보내기"),
            void 0,
            [],
            setting(t("How to send", "보내는 방식"), select("wand-ooc-mode", Object.entries(OOC_MODES), s.oocMode, (v) => set((x) => x.oocMode = v), t("How to send", "보내는 방식")), VIZ_HELP.oocMode),
            setting(t("Wrapper", "감싸개"), select("wand-wrapper", wrappers, s.wrapperId, (v) => set((x) => x.wrapperId = v), t("Wrapper", "감싸개")), VIZ_HELP.wrapper)
          )
        ),
        this.wrapperCard()
      ];
    }
    defaults() {
      const s = this.state.settings;
      const set = (fn) => this.update((st) => fn(st.settings));
      return el(
        "div",
        { class: "card" },
        section(
          t("🌟 Make page", "🌟 페이지 만들기"),
          void 0,
          [],
          setting(t("Mode", "모드"), select("wand-viz-mode", VIZ_MODES(), s.vizMode, (v) => set((x) => x.vizMode = v), t("Mode", "모드")), VIZ_HELP.vizMode),
          setting(t("Show result in", "결과를 보여 줄 곳"), select("wand-viz-output", Object.entries(VIZ_OUTPUTS), s.vizOutput, (v) => set((x) => x.vizOutput = v), t("Show result in", "결과를 보여 줄 곳")), VIZ_HELP.vizOutput),
          setting(t("Result language", "결과 언어"), el("input", { type: "text", value: s.language, "data-key": "wand-language", "aria-label": t("Result language", "결과 언어"), oninput: (e) => set((x) => x.language = e.target.value) }), VIZ_HELP.language),
          setting(t("Chat pages to Gallery too", "채팅에 올린 페이지도 갤러리에"), toggle(s.autoArchive, (v) => set((x) => x.autoArchive = v), t("Chat pages to Gallery too", "채팅에 올린 페이지도 갤러리에"), "wand-auto-archive"), VIZ_HELP.autoArchive),
          setting(t("Allow outside resources", "바깥 자료 불러오기 허용"), toggle(s.allowExternal, (v) => set((x) => x.allowExternal = v), t("Allow outside resources", "바깥 자료 불러오기 허용"), "wand-external"), VIZ_HELP.external)
        ),
        section(
          t("General", "공통"),
          void 0,
          [],
          setting(t("AI connection", "AI 연결"), select("wand-connection", this.connectionEntries(t("Same as the chat", "채팅과 같은 연결")), s.connectionId, (v) => set((x) => x.connectionId = v), t("AI connection", "AI 연결")), VIZ_HELP.connection),
          setting(
            t("Dock bubble", "Dock 버블"),
            [
              el("input", { type: "text", class: "icon-input", value: s.barIcon, "data-key": "wand-bar-icon", maxlength: "8", "aria-label": t("Bubble icon", "버블 아이콘"), oninput: (e) => set((x) => x.barIcon = e.target.value.trim() || "🍰") }),
              toggle(s.showButton, (v) => set((x) => x.showButton = v), t("Show Dock bubble", "Dock 버블 보이기"), "wand-show")
            ],
            VIZ_HELP.bubble
          )
        )
      );
    }
    presetCard() {
      const preset = this.state.preset;
      const mutateChunk = (id, fn) => this.update((s) => {
        const c = s.preset.chunks.find((x) => x.id === id);
        if (c) fn(c);
      });
      const modeLabel = MODE_LABEL();
      const chunks = preset.chunks.map((chunk, index) => {
        const open2 = this.openChunk === chunk.id;
        const name = shownName(chunk);
        const box = el(
          "div",
          { class: `chunk${chunk.enabled ? "" : " off"}` },
          el(
            "div",
            { class: "row" },
            toggle(chunk.enabled, (v) => mutateChunk(chunk.id, (c) => c.enabled = v), t(`Turn on ${name}`, `${name} 켜기`)),
            el(
              "button",
              {
                class: "entry grow",
                "aria-expanded": String(open2),
                onclick: () => {
                  this.openChunk = open2 ? null : chunk.id;
                  this.deps.rerender();
                }
              },
              name,
              el("span", { class: "meta" }, modeLabel[chunk.mode] + (chunk.needs === "fornello" ? t(" · with Fornello", " · Fornello 있을 때") : ""))
            ),
            el("button", { class: "icon", title: t("Move up", "위로"), "aria-label": t("Move up", "위로"), disabled: index === 0, onclick: () => this.moveChunk(index, -1) }, icon("arrow-up")),
            el("button", { class: "icon", title: t("Move down", "아래로"), "aria-label": t("Move down", "아래로"), disabled: index === preset.chunks.length - 1, onclick: () => this.moveChunk(index, 1) }, icon("arrow-down"))
          )
        );
        if (open2) {
          const ta = el("textarea", { "data-key": `chunk-${chunk.id}`, spellcheck: "false", "aria-label": t(`${name} text`, `${name} 내용`), oninput: (e) => mutateChunk(chunk.id, (c) => c.text = e.target.value) });
          ta.value = chunk.text;
          box.append(
            el(
              "div",
              { class: "row" },
              el("label", { class: "grow" }, t("Name", "이름"), el("input", { type: "text", value: name, "data-key": `chunk-name-${chunk.id}`, oninput: (e) => mutateChunk(chunk.id, (c) => c.name = e.target.value) })),
              el(
                "label",
                {},
                el("span", { class: "field-h" }, t("Used when", "쓰는 때"), helpTip(VIZ_HELP.chunkMode, t("Used when", "쓰는 때"))),
                select(`chunk-mode-${chunk.id}`, Object.entries(modeLabel), chunk.mode, (v) => mutateChunk(chunk.id, (c) => c.mode = v), t("Used when", "쓰는 때"))
              )
            ),
            el("div", { class: "field-h" }, t("Text", "내용"), helpTip(VIZ_HELP.chunkText, t("Text", "내용"))),
            ta,
            el(
              "div",
              { class: "row" },
              el("span", { class: "grow" }),
              el("button", { class: "danger", onclick: () => this.update((s) => s.preset.chunks = s.preset.chunks.filter((c) => c.id !== chunk.id)) }, icon("trash"), t("Delete chunk", "조각 지우기"))
            )
          );
        }
        return box;
      });
      const add = el(
        "button",
        {
          onclick: () => {
            const chunk = { id: newWandId("chunk"), name: t("New chunk", "새 조각"), mode: "all", enabled: true, text: "" };
            this.update((s) => s.preset.chunks.push(chunk));
            this.openChunk = chunk.id;
          }
        },
        icon("plus"),
        t("Add chunk", "조각 추가")
      );
      const reset = el(
        "button",
        {
          title: t("Back to the original Superviz text", "슈퍼비즈 원래 문구로 되돌리기"),
          onclick: async () => {
            if (!await this.deps.ui.popup(t("Reset the prompt to the Superviz defaults? Your edits and added chunks will be lost.", "본체를 슈퍼비즈 기본값으로 되돌릴까요? 고친 내용과 추가한 조각이 사라져요."), { okButton: t("Reset", "되돌리기"), cancelButton: t("Cancel", "취소") })) return;
            this.openChunk = null;
            this.update((s) => s.preset = defaultPreset());
          }
        },
        icon("refresh-cw"),
        t("Reset", "기본값으로")
      );
      return el(
        "div",
        { class: "card" },
        section(
          t(`🌟 Prompt: ${shownName(preset)}`, `🌟 본체: ${preset.name}`),
          VIZ_HELP.preset,
          [add, reset],
          setting(t("Wrap in <System>", "<System>으로 감싸기"), toggle(preset.wrap, (v) => this.update((s) => s.preset.wrap = v), t("Wrap in <System>", "<System>으로 감싸기")), VIZ_HELP.wrap),
          ...chunks
        )
      );
    }
    moveChunk(index, delta) {
      this.update((s) => {
        const [c] = s.preset.chunks.splice(index, 1);
        s.preset.chunks.splice(index + delta, 0, c);
      });
    }
    wrapperCard() {
      const wrappers = this.state.wrappers;
      const add = el("button", { onclick: () => this.update((s) => s.wrappers.push({ id: newWandId("wrap"), name: t("New wrapper", "새 감싸개"), template: "{{내용}}" })) }, icon("plus"), t("Add", "추가"));
      return el(
        "div",
        { class: "card" },
        section(
          t("💬 Wrappers", "💬 감싸개"),
          VIZ_HELP.wrappers,
          [add],
          ...wrappers.map((w) => {
            const ta = el("textarea", {
              class: "short",
              "data-key": `wrap-${w.id}`,
              spellcheck: "false",
              "aria-label": t(`${w.name} text`, `${w.name} 문구`),
              oninput: (e) => this.update((s) => s.wrappers.find((x) => x.id === w.id).template = e.target.value)
            });
            ta.value = w.template;
            return el(
              "div",
              { class: "chunk" },
              el(
                "div",
                { class: "row" },
                el("input", { type: "text", class: "grow", value: w.name, "data-key": `wrap-name-${w.id}`, "aria-label": t("Wrapper name", "감싸개 이름"), oninput: (e) => this.update((s) => s.wrappers.find((x) => x.id === w.id).name = e.target.value) }),
                el("button", { class: "icon danger", title: t("Delete", "지우기"), "aria-label": t("Delete", "지우기"), disabled: wrappers.length <= 1, onclick: () => this.update((s) => s.wrappers = s.wrappers.filter((x) => x.id !== w.id)) }, icon("trash"))
              ),
              ta
            );
          })
        )
      );
    }
    backup() {
      return el(
        "div",
        { class: "card" },
        section(
          t("Backup", "백업"),
          VIZ_HELP.backup,
          [el("button", { onclick: () => this.exportJson() }, icon("upload"), t("Export", "내보내기")), el("button", { onclick: () => this.importJson() }, icon("download"), t("Import", "가져오기"))]
        )
      );
    }
    exportJson() {
      const data = JSON.stringify({ format: "dispensa-wand", ...this.state }, null, 2);
      const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      const a = el("a", { href: url, download: "dispensa.wand.json" });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    }
    importJson() {
      const input = el("input", { type: "file", accept: ".json,application/json" });
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const json2 = JSON.parse(await file.text());
          if (json2.format !== "dispensa-wand") throw new Error(t("Not a Dispensa Visualizer file (.wand.json).", "Dispensa 비주얼라이저 파일(.wand.json)이 아니에요."));
          const incoming = normalizeWandState(json2);
          const items = Array.isArray(json2.items) && json2.itemsMoved !== true ? incoming.items : [];
          const extra = items.length ? t(` ${items.length} topics go to the Memo pad.`, ` 주제 ${items.length}개는 메모장에 들어가요.`) : "";
          if (!await this.deps.ui.popup(t(`Replace the prompt, wrappers and defaults with this file?${extra}`, `본체·감싸개·기본값을 이 파일로 바꿀까요?${extra}`), { okButton: t("Replace", "바꾸기"), cancelButton: t("Cancel", "취소") })) return;
          this.update((s) => Object.assign(s, incoming, { items: [], itemsMoved: true }));
          if (items.length) this.deps.importItems(items);
          this.deps.ui.toast(t("Imported the Visualizer settings.", "비주얼라이저 설정을 가져왔어요."), "success");
        } catch (e) {
          this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Import", "가져오기") });
        }
      });
      input.click();
    }
  };

  // src/ui/manager.ts
  var STYLE4 = `
:host { all: initial; }
${THEME_TOKENS}
* { box-sizing: border-box; }
${CONTROLS}
.backdrop { position: fixed; inset: 0; z-index: 2147482000; background: rgb(0 0 0 / .5); display: flex; align-items: center; justify-content: center; padding: 12px;
  font: 14px/1.45 var(--d-font); color: var(--d-text); }
.win { width: min(1040px, 100%); height: min(760px, 100%); display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid var(--d-line); border-radius: calc(var(--d-radius) + 0.25rem); box-shadow: 0 20px 60px rgb(0 0 0 / .45);
  background: var(--d-panel-solid); backdrop-filter: var(--d-shell-blur); -webkit-backdrop-filter: var(--d-shell-blur); }
header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--d-divider); }
header h2 { font-size: 16px; margin: 0 6px 0 0; color: var(--d-title); }
.main { flex: 1; display: grid; grid-template-columns: 240px 1fr; min-height: 0; }
.col { min-height: 0; overflow: auto; padding: 10px; }
.col + .col { border-left: 1px solid var(--d-divider); }
.list { display: flex; flex-direction: column; gap: 4px; }
.row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
button { padding: 6px 10px; }
button.icon { padding: 6px; }
.entry { justify-content: flex-start; width: 100%; text-align: left; overflow: hidden; text-overflow: ellipsis; }
.entry .meta { margin-left: auto; color: var(--d-muted); font-size: 12px; font-weight: 500; }
input[type=text], textarea, select { width: 100%; }
textarea { font-family: var(--d-mono); font-size: 13px; min-height: 220px; resize: vertical; tab-size: 2; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--d-muted); }
label.inline { flex-direction: row; align-items: center; gap: 6px; color: var(--d-text); font-size: 13px; }
.section { margin: 12px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--d-muted); }
.note { font-size: 12px; color: var(--d-muted); }
.warn { color: #e6a23c; font-size: 12px; }
.editor { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; padding: 10px; border: 1px solid var(--d-line); border-radius: var(--d-radius); background: var(--d-hl-bg); }
.empty { color: var(--d-muted); padding: 24px; text-align: center; }
.note-box { border: 1px dashed #e6a23c; border-radius: var(--d-radius-sm); padding: 8px 10px; font-size: 13px; }
.note-box ul { margin: 6px 0 8px; padding-left: 18px; }
svg { width: 15px; height: 15px; }
.badge { display: inline-block; font-size: 11px; line-height: 1; padding: 3px 6px; border-radius: 999px; border: 1px solid var(--d-line); color: var(--d-muted); white-space: nowrap; font-weight: 600; }
.badge.dispensa { border-color: #3fb97a; color: #3fb97a; }
.badge.marinara { border-color: var(--d-accent); color: var(--d-accent); }
.badge.extension { border-color: #8b7cf6; color: #8b7cf6; }
.foreign { font-size: 12px; color: var(--d-muted); display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
details.cmds summary { cursor: pointer; font-size: 13px; color: var(--d-text); }
.cmd-list { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow: auto; margin-top: 6px; }
.cmd { justify-content: flex-start; width: 100%; text-align: left; border-color: transparent; background: none; padding: 4px 6px; white-space: normal; font-weight: 500; color: var(--d-text); }
.cmd code { font-family: var(--d-mono); font-size: 12px; min-width: 120px; color: var(--d-btn-text-active); }
.cmd .help { color: var(--d-muted); font-size: 12px; flex: 1; }
header .tab { padding: 5px 12px; }
.main.single { grid-template-columns: 1fr; }
${FORM_CSS}
${WAND_SETTINGS_STYLE}
${SCRIPT_EDITOR_CSS}
${RUN_PANEL_CSS}
${DRAG_CSS}
${MEMO_VIEW_CSS}
.qrow { display: flex; align-items: center; gap: 4px; }
.qrow > .entry { flex: 1; min-width: 0; }
.entry .marks { color: var(--d-muted); font-weight: 500; font-size: 12px; white-space: nowrap; }
.set-row { display: flex; align-items: center; gap: 2px; }
.set-row > .entry { flex: 1; min-width: 0; }
.zone-h { display: flex; align-items: center; gap: 6px; margin: 10px 0 4px; font-size: 12px; font-weight: 600; color: var(--d-muted); }
.zone-h:first-child { margin-top: 0; }
.zone-h .count { font-weight: 500; }
.zone { display: flex; flex-direction: column; gap: 4px; min-height: 32px; border-radius: var(--d-radius-sm); }
.zone.drop-into { outline: 2px dashed var(--d-accent); outline-offset: 1px; }
.zone-empty { padding: 6px 8px; font-size: 12px; color: var(--d-muted); border: 1px dashed var(--d-line); border-radius: var(--d-radius-sm); }
.links { display: flex; flex-direction: column; gap: 4px; margin: 4px 0; }
.links .link { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-top: 1px solid var(--d-divider); }
.links .link:first-child { border-top: 0; }
.links .link .grow { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.links .link label.inline { font-size: 12px; color: var(--d-muted); }
.set > .ctl > input[type=color], input[type=color] { min-width: 0; width: 36px; height: 28px; padding: 2px; border-radius: var(--d-radius-sm); border: 1px solid var(--d-field-border); background: var(--d-field); cursor: pointer; }
details.box { border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); padding: 2px 10px; }
details.box > summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 6px; padding: 7px 0; font-size: 13px; color: var(--d-text); }
details.box > summary::-webkit-details-marker { display: none; }
details.box > summary::before { content: "▸"; color: var(--d-muted); transition: transform .15s ease; }
details.box[open] > summary::before { transform: rotate(90deg); }
details.box > summary .count { color: var(--d-muted); font-size: 12px; }
details.box[open] { padding-bottom: 8px; }
.menu-list hr { border: 0; border-top: 1px solid var(--d-divider); margin: 3px 0; width: 100%; }
.menu-list button.danger-item { color: var(--d-danger); }
.field-h { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--d-muted); }
textarea.request { font-family: var(--d-font); min-height: 110px; }
.viz-mark { font-weight: 400; }
details.more > summary { cursor: pointer; color: var(--d-muted); font-size: 12px; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px; }
details.more > summary::before { content: "▸"; transition: transform .15s ease; }
details.more[open] > summary::before { transform: rotate(90deg); }
.col-h { display: flex; align-items: center; gap: 6px; }
.col-h strong { color: var(--d-title); }
/* switches one per line, each on the right: the names read down one column, the switches down another */
.toggles { display: flex; flex-direction: column; }
.toggles .set { min-height: 38px; padding: 4px 0; }
.toggles .set:first-child { border-top: 0; }
.actions { display: flex; justify-content: flex-end; gap: 6px; }
details.menu { position: relative; }
details.menu > summary { list-style: none; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-weight: 600; white-space: nowrap;
  border: 1px solid var(--d-btn-border); background: var(--d-btn-bg); color: var(--d-btn-text); border-radius: var(--d-radius-sm); padding: 6px 10px; transition: background-color 150ms ease, border-color 150ms ease; }
details.menu > summary:hover, details.menu[open] > summary { border-color: var(--d-btn-border-hover); background: var(--d-btn-bg-hover); }
details.menu > summary::-webkit-details-marker { display: none; }
details.menu.right .menu-list { left: 0; right: auto; }
header select.lang { width: auto; flex: none; padding: 4px 6px; font-size: 12px; }
.bar-tab .row select { width: auto; min-width: 160px; max-width: 100%; }
.bar-tab select.layout { width: auto; flex: none; padding: 3px 6px; font-size: 12px; }
details.menu .menu-list { position: absolute; right: 0; top: calc(100% + 4px); z-index: 5; min-width: 240px; display: flex; flex-direction: column; gap: 2px; padding: 4px;
  background: var(--d-panel-solid); border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); box-shadow: var(--d-shadow); animation: d-fade-in .12s ease-out; }
details.menu .menu-list button { justify-content: flex-start; flex-direction: column; align-items: flex-start; gap: 1px; border-color: transparent; background: none; white-space: normal; text-align: left; }
details.menu .menu-list button:hover { background: var(--d-hl-bg); }
details.menu .menu-list small { color: var(--d-muted); font-weight: 400; font-size: 11.5px; }
@media (max-width: 720px) { .main { grid-template-columns: 1fr; } .col + .col { border-left: none; border-top: 1px solid var(--d-divider); } }
/* phones: title and buttons on one line, the tabs on the next; header buttons show only their icons */
@media (max-width: 560px) {
  header { flex-wrap: wrap; row-gap: 8px; }
  header .tabs { order: 5; width: 100%; flex-wrap: nowrap; }
  header .tabs .seg2 { flex: 1; }
  header .label { display: none; }
  .win { height: 100%; }
  .col { padding: 10px 12px; }
}
`;
  var ORIGIN_BADGE = {
    st: () => el("span", { class: "badge", title: t("Command SillyTavern also has", "실리태번에도 있는 명령") }, t("SillyTavern", "실리태번")),
    dispensa: () => el("span", { class: "badge dispensa", title: t("Dispensa-only command (not in SillyTavern)", "Dispensa 전용 명령 (실리태번에 없음)") }, "Dispensa"),
    marinara: () => el("span", { class: "badge marinara", title: t("Marinara feature command (not in SillyTavern)", "마리나라 기능 명령 (실리태번에 없음)") }, t("Marinara", "마리나라")),
    extension: (from) => el("span", { class: "badge extension", title: t(`Added by the ${from} extension`, `${from} 확장이 추가한 명령`) }, from)
  };
  var TRIGGERS = () => [
    { key: "startup", label: t("When Marinara starts", "마리나라를 켤 때") },
    { key: "user", label: t("After I send a message", "내 메시지를 보낸 뒤") },
    { key: "ai", label: t("After an AI reply", "AI 답변 뒤") },
    { key: "chatChange", label: t("When a chat opens", "채팅을 열 때") },
    { key: "newChat", label: t("When a new chat is made", "새 채팅을 만들 때") },
    { key: "groupDraft", label: t("On each character's turn in a group chat", "그룹 채팅에서 캐릭터 차례마다") },
    { key: "beforeGeneration", label: t("Just before the AI replies", "AI가 답을 쓰기 직전"), help: t("The reply waits until it finishes (up to 1 min)", "끝날 때까지 답 생성 대기 (최대 1분)") }
  ];
  var HELP = () => ({
    places: t("Where auto-run works (same as the lists on the left)", "자동 실행이 도는 곳 (왼쪽 목록의 칸과 같음)"),
    plain: t(
      "When a QR with only text (no '/') is clicked\n· Don't send: only put it in the input\n· Add to input text: add it after the typed text and send\n· Put before: put it before the typed text",
      "'/' 없이 글만 쓴 QR을 누를 때\n· 보내지 않기: 입력창에 넣기만\n· 입력창 글에 붙이기: 쓰던 글 뒤에 붙여 보내기\n· 앞에 붙이기: 쓰던 글 앞에 붙이기"
    ),
    submenu: t(
      "Other sets attached as a sub menu. Opens with a right-click on the Dock (long press on phones)\n· Chain: the picked QR takes this QR's result\n· %%parent%%: becomes this QR's name",
      "다른 세트를 하위 메뉴로 달기. Dock에서 오른쪽 클릭(휴대폰은 꾹 누르기)으로 열기\n· 이어서 실행: 이 QR의 결과를 고른 QR이 이어받음\n· %%parent%%: 이 QR 이름으로 바뀜"
    ),
    auto: t("Auto-runs at the chosen times. Only where the set is on", "고른 때에 자동 실행. 세트가 켜진 곳에서만"),
    automation: t("Runs when this lorebook entry (name or id) is used in a reply (SillyTavern's Automation ID)", "이 로어북 항목(이름이나 id)이 답변에 쓰이면 실행 (실리태번의 자동화 ID)"),
    preventAuto: t("Stops this QR from auto-running other QRs", "이 QR이 다른 QR을 자동 실행하는 것을 막음"),
    showLabel: t("Shows only the icon in folders and sub menus", "폴더·하위 메뉴에서 아이콘만 표시")
  });
  var QrManager = class {
    constructor(deps) {
      this.deps = deps;
      this.wandView = deps.wandStore ? new WandSettingsView({
        store: deps.wandStore,
        ui: deps.ui,
        connections: async () => (await api("/connections")).map((c) => ({ id: c.id, name: c.name })),
        rerender: () => this.render(),
        // an old backup's items were topics: they go to the 메모장
        importItems: (items) => this.deps.memo?.store.update((m2) => m2.memos.push(...items.map((i) => i.content.trim()).filter(Boolean).map((t2) => newMemo(t2))))
      }) : null;
      const memo2 = deps.memo;
      this.memoView = memo2 ? new MemoView({
        store: memo2.store,
        ui: deps.ui,
        sendOoc: memo2.sendOoc,
        putInInput: memo2.putInInput,
        makePage: memo2.makePage,
        toQr: (text7) => this.memoToQr(text7),
        oocSettings: () => this.wandView?.oocCards() ?? [],
        menu: (summary, label, entries) => this.menu(summary, label, entries),
        quietly: (fn) => {
          this.quiet = true;
          try {
            fn();
          } finally {
            this.quiet = false;
          }
        },
        close: () => this.close(),
        rerender: () => this.render()
      }) : null;
    }
    hostEl = null;
    root = null;
    selectedSet = null;
    selectedItem = null;
    unsubscribe = null;
    commandListOpen = false;
    commandQuery = "";
    /** Folded parts kept open through redraws (by key). */
    openParts = /* @__PURE__ */ new Set();
    tab = "qr";
    unsubscribeWand = null;
    wandView;
    memoView;
    unsubscribeMemo = null;
    /** The window slides in once, when it opens (not on every redraw). */
    entering = false;
    scope = NO_CHAT;
    names = /* @__PURE__ */ new Map();
    /** Script boxes and run panels live across redraws (caret, suggestions, a paused debugger). */
    editors = /* @__PURE__ */ new Map();
    panels = /* @__PURE__ */ new Map();
    breakpoints = /* @__PURE__ */ new Map();
    /** A change made by typing in a script box: no redraw. */
    quiet = false;
    scrollToEditor = false;
    /** A memo becomes a QR that sends it as OOC (/ooc), in a set you pick. */
    async memoToQr(text7) {
      const sets = this.state.sets;
      const NEW = t('+ New set "Memo QR"', '+ 새 세트 "메모 QR"');
      const labels = [NEW, ...sets.map((s, i) => `${s.name}${sets.filter((o) => o.name === s.name).length > 1 ? ` (${i + 1})` : ""}`)];
      const [picked] = await this.deps.ui.pick?.(t("Pick a set for the QR.", "QR을 넣을 세트를 고르세요."), labels) ?? [];
      if (!picked) return;
      const item = newItem(memoLine(text7, 14), `/ooc ${text7.replace(/[|\\]/g, (c) => `\\${c}`).replace(/\{:/g, "\\{:").replace(/:\}/g, "\\:}")}`);
      item.title = memoLine(text7, 200);
      let setId = "";
      this.deps.store.update((st) => {
        let target = picked === NEW ? void 0 : st.sets[labels.indexOf(picked) - 1];
        if (!target) {
          target = newSet(t("Memo QR", "메모 QR"));
          st.sets.push(target);
        }
        target.items.push(item);
        setId = target.id;
      });
      this.deps.ui.toast(t(`Made the QR "${item.label}". Clicking it sends it as OOC.`, `"${item.label}" QR을 만들었어요. 누르면 OOC로 보내요.`), "success", { title: "📝" });
      this.openItem(setId, item.id);
    }
    /** The chat on screen (its chat and character switches). */
    setScope(scope) {
      this.scope = scope;
      for (const id of scope.characterIds) {
        if (this.names.has(id)) continue;
        this.names.set(id, t("Character", "캐릭터"));
        void this.deps.characterName(id).then((name) => {
          this.names.set(id, name);
          this.render();
        });
      }
      this.render();
    }
    open(tab) {
      if (tab) this.tab = tab;
      if (this.hostEl) {
        this.render();
        return;
      }
      this.hostEl = el("div", { id: "dispensa-manager" });
      this.root = this.hostEl.attachShadow({ mode: "open" });
      document.body.append(this.hostEl);
      this.selectedSet ??= this.deps.store.value.sets[0]?.id ?? null;
      this.unsubscribe = this.deps.store.subscribe(() => {
        if (!this.quiet) this.render();
      });
      this.unsubscribeWand = this.deps.wandStore?.subscribe(() => this.render()) ?? null;
      this.unsubscribeMemo = this.deps.memo?.store.subscribe(() => {
        if (!this.quiet) this.render();
      }) ?? null;
      document.addEventListener("keydown", this.onKey, true);
      this.entering = true;
      this.render();
      this.entering = false;
    }
    /** Redraws when open (the screen language changed). */
    refresh() {
      if (this.hostEl) this.render();
    }
    /** Ctrl+click on the bar: straight to that QR's editor. */
    openItem(setId, itemId) {
      this.selectedSet = setId;
      this.selectedItem = itemId;
      this.scrollToEditor = true;
      this.open("qr");
    }
    close() {
      for (const p of this.panels.values()) p.stop();
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.unsubscribeWand?.();
      this.unsubscribeWand = null;
      this.unsubscribeMemo?.();
      this.unsubscribeMemo = null;
      void this.deps.wandStore?.saveNow().catch(() => void 0);
      void this.deps.memo?.store.saveNow().catch(() => void 0);
      document.removeEventListener("keydown", this.onKey, true);
      this.hostEl?.remove();
      this.hostEl = this.root = null;
      void this.deps.store.saveNow();
    }
    onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        const active = this.root?.activeElement;
        if (active && active.tagName === "TEXTAREA") return;
        const menu = this.root?.querySelector("details.menu[open]");
        e.stopPropagation();
        if (menu) {
          menu.open = false;
          return;
        }
        this.close();
      }
    };
    get set() {
      return this.deps.store.value.sets.find((s) => s.id === this.selectedSet);
    }
    get state() {
      return this.deps.store.value;
    }
    setName = (id) => this.state.sets.find((s) => s.id === id)?.name;
    render() {
      if (!this.root) return;
      const active = this.root.activeElement;
      const focusKey = active?.dataset?.key;
      const caret = active && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
      const scrolls = [...this.root.querySelectorAll(".col")].map((c) => c.scrollTop);
      this.forgetGone();
      const style = el("style");
      style.textContent = STYLE4;
      const win = el("div", { class: `win${this.entering ? " d-enter" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": "Dispensa" });
      if (this.tab === "bar") win.append(this.header(), el("div", { class: "main single" }, this.barView()));
      else if (this.tab === "wand" && this.wandView) win.append(this.header(), el("div", { class: "main single" }, this.wandView.render()));
      else if (this.tab === "memo" && this.memoView) win.append(this.header(), el("div", { class: "main single" }, this.memoView.render()));
      else win.append(this.header(), el("div", { class: "main" }, this.setColumn(), this.itemColumn()));
      const backdrop = el("div", {
        class: `backdrop${this.entering ? " d-fade" : ""}`,
        onmousedown: (e) => {
          if (e.target === backdrop) this.close();
        }
      });
      backdrop.append(win);
      this.root.replaceChildren(style, backdrop);
      [...this.root.querySelectorAll(".col")].forEach((c, i) => c.scrollTop = scrolls[i] ?? 0);
      if (focusKey) {
        const target = this.root.querySelector(`[data-key="${focusKey}"]`);
        if (target) {
          target.focus({ preventScroll: true });
          if (caret && caret[0] !== null && "setSelectionRange" in target && target.type !== "checkbox" && target.type !== "color") target.setSelectionRange(caret[0], caret[1]);
        }
      }
      if (this.scrollToEditor) {
        this.scrollToEditor = false;
        requestAnimationFrame(() => this.root?.querySelector(".editor")?.scrollIntoView({ block: "start" }));
      }
    }
    /** Drop the script boxes and panels of QRs that are gone. */
    forgetGone() {
      const ids = new Set(this.state.sets.flatMap((s) => s.items.map((i) => i.id)));
      for (const map of [this.editors, this.panels, this.breakpoints]) for (const id of [...map.keys()]) if (!ids.has(id)) map.delete(id);
    }
    header() {
      const size = this.deps.store.size() + (this.deps.wandStore?.size() ?? 0);
      const tabs = segmented(
        "dispensa-tab",
        [
          { value: "qr", label: t("Library", "보관함") },
          { value: "bar", label: "Dock", title: t("Sets and QRs on the Dock", "Dock에 놓을 세트·QR") },
          ...this.memoView ? [{ value: "memo", label: "📝", title: t("Memo pad", "메모장") }] : [],
          { value: "wand", label: "🌟", title: t("Visualizer settings", "비주얼라이저 설정") }
        ],
        this.tab,
        (v) => {
          this.tab = v;
          this.render();
        },
        t("Dispensa tabs", "Dispensa 탭")
      );
      return el(
        "header",
        {},
        el("h2", {}, "Dispensa"),
        el("div", { class: "row tabs" }, tabs),
        el("span", { class: "grow" }),
        el(
          "select",
          {
            class: "lang",
            title: t("Language", "언어"),
            "aria-label": t("Language", "언어"),
            "data-key": "lang",
            onchange: (e) => setLangChoice(e.target.value)
          },
          ...["auto", "en", "ko"].map((c) => el("option", { value: c, selected: c === langChoice() }, `🌐 ${LANG_NAMES[c]()}`))
        ),
        // the 1 MB storage only shows once it starts filling up
        size > 7e5 ? el("span", { class: "warn", title: `${Math.round(size / 1024)} KB / 1000 KB` }, t(`Storage ${Math.round(size / 1e4)}% used`, `저장 공간 ${Math.round(size / 1e4)}% 사용`)) : el("span"),
        this.tab === "qr" ? el("button", { title: t("Import SillyTavern QRs (.json, .qr.json) or Marinara QRs (.mqr.json). A file with one QR goes into the open set", "실리태번 QR(.json, .qr.json)·마리나라 QR(.mqr.json) 가져오기. QR 하나짜리 파일은 열린 세트로"), "aria-label": t("Import QRs", "QR 가져오기"), onclick: () => this.importFile() }, icon("download"), el("span", { class: "label" }, t("Import QRs", "QR 가져오기"))) : el("span"),
        // Fornello (pages with scripts, widgets) has its own settings
        typeof fornello()?.openSettings === "function" ? el("button", { title: t("Open Fornello settings (page scripts, JSX components)", "Fornello 설정 열기 (페이지 실행, JSX 컴포넌트)"), "aria-label": t("Fornello settings", "Fornello 설정"), onclick: () => (this.close(), fornello()?.openSettings?.()) }, "🔥", el("span", { class: "label" }, "Fornello")) : el("span"),
        el("button", { class: "icon", title: t("Close", "닫기"), "aria-label": t("Close", "닫기"), onclick: () => this.close() }, icon("x"))
      );
    }
    // ── the Dock ──
    /** The Dock tab: what the bar shows, in order, the same in every chat. */
    barView() {
      const { store } = this.deps;
      const st = store.value;
      const shown = shownBar(st);
      const list = el("div", { class: "list" });
      shown.forEach(({ entry, set, item }, i) => {
        const handle = el("button", { class: "drag", type: "button", title: t("Drag to reorder (or ↑↓ keys)", "끌어서 순서 바꾸기 (↑↓ 키도 가능)"), "aria-label": t(`Reorder ${item?.label ?? set.name}`, `${item?.label ?? set.name} 순서 바꾸기`), "data-key": `drag-bar-${i}` }, icon("grip"));
        const glyph = (item ? item.icon : set.icon)?.trim();
        const row = el(
          "div",
          { class: "set-row" },
          handle,
          el(
            "button",
            {
              class: "entry",
              title: item ? t("Edit", "편집") : t("Open set", "세트 열기"),
              onclick: () => item ? this.openItem(set.id, item.id) : (this.selectedSet = set.id, this.selectedItem = null, this.open("qr"))
            },
            glyph ? el("span", {}, glyph) : icon(item ? "play" : "folder"),
            el("span", { class: "grow" }, item ? item.label : set.name),
            el("span", { class: "meta" }, item ? `QR · ${set.name}` : t(`Set · ${set.items.filter((x) => !x.hidden).length}`, `세트 · ${set.items.filter((x) => !x.hidden).length}`))
          ),
          item ? el("span") : el(
            "select",
            {
              class: "layout",
              title: t("Folder: one bubble · Row: a bubble per QR, one Dock row", "폴더: 버블 하나 · 한 줄: QR마다 버블, Dock 한 줄"),
              "aria-label": t(`${set.name} layout`, `${set.name} 놓는 모양`),
              "data-key": `bar-layout-${i}`,
              onchange: (e) => store.update((x) => setLayout(x, set.id, e.target.value))
            },
            el("option", { value: "folder", selected: layoutOf(entry, set) === "folder" }, t("Folder", "폴더")),
            el("option", { value: "row", selected: layoutOf(entry, set) === "row" }, t("Row", "한 줄"))
          ),
          el("button", { class: "icon", title: t("Remove from the Dock", "Dock에서 빼기"), "aria-label": t(`Remove ${item?.label ?? set.name}`, `${item?.label ?? set.name} 빼기`), onclick: () => store.update((x) => removeFromBar(x, entry)) }, icon("x"))
        );
        dragHandle(
          handle,
          row,
          ".set-row",
          (from, to) => store.update((x) => {
            const entries = shownBar(x).map((e) => e.entry);
            moveTo(entries, from, to);
            x.bar = entries;
          })
        );
        list.append(row);
      });
      if (!shown.length) list.append(el("div", { class: "note" }, t("Empty", "비어 있음")));
      const freeSets = st.sets.filter((x) => !onBar(st, { kind: "set", setId: x.id }));
      const freeQrs = st.sets.flatMap((x) => x.items.filter((i) => !onBar(st, { kind: "qr", setId: x.id, itemId: i.id })).map((i) => ({ set: x, item: i })));
      const addSet = el(
        "select",
        { "aria-label": t("Add a set to the Dock", "Dock에 세트 넣기"), "data-key": "bar-add-set", onchange: (e) => {
          const id = e.target.value;
          if (id) store.update((x) => addToBar(x, { kind: "set", setId: id }));
        } },
        el("option", { value: "" }, t("+ Set", "+ 세트")),
        ...freeSets.map((x) => el("option", { value: x.id }, `${x.icon?.trim() ? `${x.icon.trim()} ` : ""}${x.name}`))
      );
      const addQr = el(
        "select",
        { "aria-label": t("Add a QR to the Dock", "Dock에 QR 넣기"), "data-key": "bar-add-qr", onchange: (e) => {
          const [setId, itemId] = e.target.value.split("/");
          if (itemId) store.update((x) => addToBar(x, { kind: "qr", setId, itemId }));
        } },
        el("option", { value: "" }, "+ QR"),
        ...freeQrs.map(({ set, item }) => el("option", { value: `${set.id}/${item.id}` }, `${set.name} › ${item.icon?.trim() ? `${item.icon.trim()} ` : ""}${item.label}`))
      );
      const make = this.newQrMenu((item) => {
        let target = "";
        store.update((x) => {
          const set = barSet(x);
          set.items.push(item);
          target = set.id;
          addToBar(x, { kind: "qr", setId: set.id, itemId: item.id });
        });
        this.openItem(target, item.id);
      });
      const card = section(
        "Dock",
        t(
          "The same shortcuts in every chat. Separate from where auto-run works\n· + Set: Folder (one bubble) or Row (a bubble per QR, one Dock row)\n· + QR: one QR from the Library\n· New QR: make one right here (saved in the Dock set, can auto-run)",
          "모든 채팅에서 같은 바로가기. 자동 실행 범위와 별개\n· + 세트: 폴더(버블 하나) 또는 한 줄(QR마다 버블, Dock 한 줄)\n· + QR: 보관함의 QR 하나\n· 새 QR: 여기서 바로 만들기('Dock' 세트에 저장, 자동 실행 가능)"
        ),
        [],
        list,
        el("div", { class: "row", style: "margin-top:8px;flex-wrap:wrap" }, addSet, addQr, make)
      );
      card.classList.add("card");
      return el("div", { class: "col wand-settings bar-tab" }, card);
    }
    // ── sets ──
    /**
     * The set column in SillyTavern's lists: every chat, this chat, each
     * character of the chat, then the sets on nowhere here. A set dragged to
     * another list moves there (into "꺼진 세트": off where it was).
     */
    setColumn() {
      const { store } = this.deps;
      const st = store.value;
      const chat = this.scope.chatId;
      const lists = [
        { zone: { kind: "global" }, title: t("Global", "전체"), empty: t("Drop sets here to auto-run them in every chat", "모든 채팅에서 자동 실행할 세트를 여기로") },
        ...chat ? [{ zone: { kind: "chat", chatId: chat }, title: t("This chat", "이 채팅"), empty: t("Drop sets here to auto-run them in this chat", "이 채팅에서 자동 실행할 세트를 여기로") }] : [],
        ...this.scope.characterIds.map((c) => ({ zone: { kind: "char", characterId: c }, title: t(`Character: ${this.names.get(c) ?? "…"}`, `캐릭터: ${this.names.get(c) ?? "…"}`), empty: t("Drop sets here to auto-run them in chats with this character", "이 캐릭터와의 채팅에서 자동 실행할 세트를 여기로") })),
        { zone: { kind: "all" }, title: t("All sets", "모든 세트"), empty: t("None", "없음") }
      ];
      const zoneOf = /* @__PURE__ */ new Map();
      const body = el("div", { class: "zones" });
      lists.forEach(({ zone, title, empty }, z) => {
        const ids = zoneSets(st, zone);
        const box = el("div", { class: "zone", "data-zone": String(z), role: "list", "aria-label": t(`${title} sets`, `${title} 세트`) });
        zoneOf.set(box, zone);
        for (const id of ids) {
          const s = st.sets.find((x) => x.id === id);
          if (!s) continue;
          const handle = el("button", { class: "drag", type: "button", title: t("Drag to reorder or move to another list (↑↓ keys to reorder)", "끌어서 순서 바꾸기·다른 칸으로 옮기기 (↑↓ 키로 순서)"), "aria-label": t(`Move ${s.name}`, `${s.name} 옮기기`), "data-key": `drag-set-${z}-${s.id}` }, icon("grip"));
          const row = el(
            "div",
            { class: "set-row", role: "listitem" },
            handle,
            el(
              "button",
              {
                class: `entry${s.id === this.selectedSet ? " sel" : ""}`,
                onclick: () => {
                  this.selectedSet = s.id;
                  this.selectedItem = null;
                  this.render();
                }
              },
              s.icon?.trim() ? el("span", {}, s.icon.trim()) : icon("folder"),
              el("span", { class: "grow" }, s.name),
              el("span", { class: "meta" }, String(s.items.length))
            )
          );
          dragAcross(handle, row, ".set-row", ".zone", ".zones", (target, index) => {
            const to = zoneOf.get(target);
            if (to) store.update((x) => moveSet(x, s.id, zone, to, index));
          });
          box.append(row);
        }
        if (!ids.length) box.append(el("div", { class: "zone-empty" }, empty));
        body.append(el("div", { class: "zone-h" }, title, el("span", { class: "count" }, ids.length ? String(ids.length) : "")), box);
      });
      if (!st.sets.length) body.append(el("div", { class: "note" }, t("No sets yet.", "아직 세트가 없어요.")));
      return el(
        "div",
        { class: "col" },
        el(
          "div",
          { class: "col-h" },
          el("strong", {}, t("Sets", "세트")),
          helpTip(
            t(
              "Groups of QRs. The same as SillyTavern's set lists\n· Global · This chat · Character: where auto-run works\n· All sets: every set made. Drag one into a list above to add it; drag it out of a list to remove it\n· The Dock has its own tab",
              "QR 묶음. 실리태번의 세트 목록과 같음\n· 전체 · 이 채팅 · 캐릭터: 자동 실행이 도는 곳\n· 모든 세트: 만든 세트 전부. 위 칸으로 끌어 넣기, 위 칸에서 끌어 오면 빼기\n· Dock은 Dock 탭에서 따로"
            ),
            t("Sets", "세트")
          )
        ),
        el(
          "div",
          { class: "row", style: "margin:8px 0" },
          el(
            "button",
            {
              onclick: () => {
                const s = newSet(t("New set", "새 세트"));
                store.update((x) => x.sets.push(s));
                this.selectedSet = s.id;
                this.selectedItem = null;
              }
            },
            icon("plus"),
            t("New set", "새 세트")
          )
        ),
        body
      );
    }
    mutateSet(set, fn) {
      this.deps.store.update((st) => {
        const target = st.sets.find((x) => x.id === set.id);
        if (target) fn(target, st);
      });
    }
    setPanel(set) {
      const mutate = (fn) => this.mutateSet(set, fn);
      const top = el(
        "div",
        { class: "row" },
        el("input", {
          type: "text",
          value: set.icon ?? "",
          placeholder: "📁",
          maxlength: "8",
          style: "width:3.2em;text-align:center",
          title: t("Dock bubble icon (one emoji)", "Dock 버블 아이콘 (이모지 하나)"),
          "data-key": "set-icon",
          "aria-label": t("Set icon", "세트 아이콘"),
          oninput: (e) => mutate((s) => s.icon = e.target.value.trim() || void 0)
        }),
        el("input", { type: "text", class: "grow", value: set.name, "data-key": "set-name", "aria-label": t("Set name", "세트 이름"), oninput: (e) => mutate((s) => s.name = e.target.value) }),
        this.exportMenu(set),
        this.setMenu(set)
      );
      const chat = this.scope.chatId;
      const sw = (on, change, label, key2, disabled = false) => {
        const box = toggle(on, change, label, key2);
        if (disabled) box.querySelector("input").disabled = true;
        return box;
      };
      const other = elsewhere(this.state, set.id, this.scope);
      const otherNote = [other.chats ? t(`${other.chats} other chats`, `다른 채팅 ${other.chats}곳`) : "", other.characters ? t(`${other.characters} other characters`, `다른 캐릭터 ${other.characters}명`) : ""].filter(Boolean).join(", ");
      const places = section(
        t("Auto-run in", "켜는 칸"),
        HELP().places,
        [],
        setting(t("Global", "전체"), sw(set.enabled, (v) => mutate((s) => s.enabled = v), t("Global", "전체"), "place-all")),
        setting(
          t("This chat", "이 채팅"),
          sw(isOnForChat(this.state, set.id, chat), (v) => chat && mutate((s, st) => setForChat(st, chat, s.id, v)), t("This chat", "이 채팅"), "place-chat", !chat),
          chat ? void 0 : t("Available with a chat open", "채팅을 연 상태에서 선택 가능")
        ),
        ...this.scope.characterIds.map(
          (c) => setting(t(`Character: ${this.names.get(c) ?? "…"}`, `캐릭터: ${this.names.get(c) ?? "…"}`), sw(isOnForCharacter(this.state, set.id, c), (v) => mutate((s, st) => setForCharacter(st, c, s.id, v)), t(`Character ${this.names.get(c) ?? ""}`, `캐릭터 ${this.names.get(c) ?? ""}`), `place-char-${c}`))
        ),
        otherNote ? el("div", { class: "note" }, t(`Also on in ${otherNote}`, `${otherNote}에서도 켜짐`)) : null
      );
      const looks = section(
        t("Look", "모양"),
        void 0,
        [],
        setting(
          t("Color", "색"),
          set.color ? [
            el("input", { type: "color", value: toHex(set.color) ?? "#7c6cf0", "aria-label": t("Set color", "세트 색"), "data-key": "set-color", onchange: (e) => mutate((s) => s.color = e.target.value) }),
            el("button", { type: "button", onclick: () => mutate((s) => (delete s.color, delete s.colorBorderOnly)) }, t("Remove color", "색 없애기"))
          ] : el("button", { type: "button", "data-key": "set-color-add", onclick: () => mutate((s) => s.color = "#7c6cf0") }, t("Add color", "색 칠하기")),
          t("Color of the Dock bubble", "Dock 버블에 칠할 색")
        ),
        set.color ? setting(t("Border only", "테두리만 칠하기"), toggle(!!set.colorBorderOnly, (v) => mutate((s) => v ? s.colorBorderOnly = true : delete s.colorBorderOnly), t("Border only", "테두리만 칠하기"), "set-border")) : null
      );
      const plain = this.fold(
        `set-plain-${set.id}`,
        t("How text QRs send", "글 QR 보내는 방식"),
        [set.disableSend, set.injectInput].filter(Boolean).length,
        HELP().plain,
        setting(t("Don't send", "보내지 않기"), toggle(!!set.disableSend, (v) => mutate((s) => s.disableSend = v), t("Don't send", "보내지 않기"), "set-nosend"), t("Only puts it in the input, without sending", "입력창에 넣기만 하고 보내지 않음")),
        setting(t("Add to input text", "입력창 글에 붙이기"), toggle(!!set.injectInput, (v) => mutate((s) => s.injectInput = v), t("Add to input text", "입력창 글에 붙이기"), "set-inject")),
        set.injectInput ? setting(t("Put before", "앞에 붙이기"), toggle(!!set.placeBeforeInput, (v) => mutate((s) => s.placeBeforeInput = v), t("Put before", "앞에 붙이기"), "set-before")) : null
      );
      return [top, el("div", { style: "margin-top:10px" }, places, looks), plain];
    }
    /** The set's ⋯ menu: duplicate, delete. */
    setMenu(set) {
      return this.menu(icon("more"), t("Set menu", "세트 메뉴"), [
        {
          label: t("Duplicate set", "세트 복제"),
          sub: t("Copies its QRs too", "QR까지 그대로 복제"),
          run: () => {
            const copy = duplicateSet(set, this.state);
            this.deps.store.update((st) => st.sets.splice(st.sets.findIndex((s) => s.id === set.id) + 1, 0, copy));
            this.selectedSet = copy.id;
            this.selectedItem = null;
            this.render();
            this.deps.ui.toast(t(`Made "${copy.name}".`, `"${copy.name}"을 만들었어요.`), "success");
          }
        },
        "-",
        {
          label: t("Delete set", "세트 삭제"),
          danger: true,
          run: async () => {
            if (!await this.deps.ui.popup(t(`Delete the set "${set.name}" and its ${set.items.length} QRs?`, `"${set.name}" 세트와 QR ${set.items.length}개를 삭제할까요?`), { okButton: t("Delete", "삭제"), cancelButton: t("Cancel", "취소") })) return;
            this.deps.store.update((st) => {
              st.sets = st.sets.filter((x) => x.id !== set.id);
              forgetSet(st, set.id);
            });
            this.selectedSet = this.state.sets[0]?.id ?? null;
            this.render();
          }
        }
      ]);
    }
    // ── QRs ──
    itemColumn() {
      const set = this.set;
      const col = el("div", { class: "col" });
      if (!set) {
        col.append(el("div", { class: "empty" }, t("Pick a set or make a new one.", "세트를 고르거나 새로 만드세요.")));
        return col;
      }
      col.append(...this.setPanel(set));
      col.append(
        el(
          "div",
          { class: "row", style: "margin:14px 0 6px" },
          el("div", { class: "section", style: "margin:0" }, t(`${set.items.length} QRs`, `QR ${set.items.length}개`)),
          el("span", { class: "grow" }),
          el("button", { type: "button", title: t("Paste a copied QR (or text)", "복사한 QR(또는 글) 붙여넣기"), onclick: () => void this.paste(set) }, icon("clipboard"), t("Paste", "붙여넣기"))
        )
      );
      const list = el("div", { class: "list" });
      set.items.forEach((item) => {
        const handle = el("button", { class: "drag", type: "button", title: t("Drag to reorder (or ↑↓ keys)", "끌어서 순서 바꾸기 (↑↓ 키도 가능)"), "aria-label": t(`Reorder ${item.label}`, `${item.label} 순서 바꾸기`), "data-key": `drag-qr-${item.id}` }, icon("grip"));
        const marks = [
          item.auto && Object.values(item.auto).some(Boolean) ? "⚡" : "",
          item.automationId ? "📚" : "",
          item.contextList?.length ? "☰" : "",
          item.hidden ? t("Hidden", "숨김") : ""
        ].filter(Boolean);
        const row = el(
          "div",
          { class: "qrow" },
          handle,
          el(
            "button",
            {
              class: `entry${item.id === this.selectedItem ? " sel" : ""}`,
              onclick: () => {
                this.selectedItem = this.selectedItem === item.id ? null : item.id;
                this.render();
              }
            },
            item.icon?.trim() ? el("span", {}, item.icon.trim()) : item.kind === "ooc" ? icon("message-circle") : icon("play"),
            el("span", { class: "grow" }, item.label || t("(no name)", "(이름 없음)")),
            marks.length ? el("span", { class: "marks", title: t("⚡ auto-run · 📚 lorebook link · ☰ sub menu", "⚡ 자동 실행 · 📚 로어북 연결 · ☰ 하위 메뉴") }, marks.join(" ")) : null,
            item.unsupported?.length ? el("span", { class: "warn", title: item.unsupported.join(", ") }, "⚠") : null,
            item.dialect === "st" ? el("span", { class: "meta", title: item.note ?? "" }, t("SillyTavern style", "실리태번 기준")) : null
          ),
          el("button", { class: "icon", title: t("Run", "실행"), "aria-label": t(`Run ${item.label}`, `${item.label} 실행`), onclick: () => this.deps.run(set, item) }, icon("play")),
          this.itemMenu(set, item)
        );
        dragHandle(handle, row, ".qrow", (from, to) => this.mutateSet(set, (s) => moveTo(s.items, from, to)));
        list.append(row);
        if (item.id === this.selectedItem) list.append(this.editor(set, item));
      });
      col.append(
        list,
        el(
          "div",
          { class: "row", style: "margin-top:8px" },
          this.newQrMenu((item) => {
            this.mutateSet(set, (s) => s.items.push(item));
            this.selectedItem = item.id;
            this.render();
          })
        )
      );
      return col;
    }
    /** A QR's ⋯ menu: copy, cut, duplicate, move or copy to another set, export, delete. */
    itemMenu(set, item) {
      return this.menu(icon("more"), t(`${item.label} menu`, `${item.label} 메뉴`), [
        { label: t("Copy", "복사"), sub: t("Paste into another set or SillyTavern", "다른 세트나 실리태번에 붙여넣기 가능"), run: () => void this.copyItem(item, false, set) },
        { label: t("Cut", "잘라내기"), run: () => void this.copyItem(item, true, set) },
        {
          label: t("Duplicate", "복제"),
          sub: t("One more right below", "바로 아래에 하나 더"),
          run: () => {
            const copy = cloneItem(item);
            copy.label = t(`${item.label} copy`, `${item.label} 복사본`);
            this.mutateSet(set, (s) => s.items.splice(s.items.findIndex((i) => i.id === item.id) + 1, 0, copy));
            this.selectedItem = copy.id;
            this.render();
          }
        },
        { label: t("Move to another set…", "다른 세트로 옮기기…"), run: () => void this.transfer(set, item, false) },
        { label: t("Copy to another set…", "다른 세트로 복사…"), run: () => void this.transfer(set, item, true) },
        "-",
        { label: t("Export this QR: for Marinara", "이 QR만 내보내기: 마리나라용"), sub: ".mqr.json", run: () => this.download(exportMarinaraItem(item, this.setName), `${item.label || "qr"}.mqr.json`) },
        { label: t("Export this QR: for SillyTavern", "이 QR만 내보내기: 실리태번용"), sub: t(".json (first message = #0)", ".json (첫 메시지 = 0번)"), run: () => this.download(stExportItem(item, 1, this.deps.registry, this.setName), `${item.label || "qr"}.json`) },
        "-",
        { label: t("Delete QR", "QR 삭제"), danger: true, run: () => this.removeItem(set, item) }
      ]);
    }
    removeItem(set, item) {
      this.mutateSet(set, (s) => s.items = s.items.filter((i) => i.id !== item.id));
      if (this.selectedItem === item.id) this.selectedItem = null;
      this.render();
    }
    /** A clipboard copy that both Dispensa and SillyTavern can paste. */
    async copyItem(item, cut, set) {
      const data = { ...stExportItem(item, 1, this.deps.registry, this.setName), dispensa: exportMarinaraItem(item, this.setName) };
      await (this.deps.ui.copy?.(JSON.stringify(data, null, 2)) ?? navigator.clipboard.writeText(JSON.stringify(data)));
      if (cut) this.removeItem(set, item);
      this.deps.ui.toast(cut ? t(`Cut "${item.label}". Click Paste in the set you want.`, `"${item.label}"을 잘라 냈어요. 원하는 세트에서 붙여넣기를 누르세요.`) : t(`Copied "${item.label}".`, `"${item.label}"을 복사했어요.`), "success");
    }
    async paste(set) {
      const text7 = (await (this.deps.ui.paste?.() ?? navigator.clipboard.readText())).trim();
      if (!text7) return;
      let report = null;
      try {
        const json2 = JSON.parse(text7);
        const own = json2?.dispensa;
        report = own?.format === MQR_ITEM_FORMAT ? importMarinara(own, this.deps.registry) : importAny(json2, this.deps.registry);
      } catch {
      }
      if (report && report.sets.length) {
        this.addReport(report, set);
        this.deps.ui.toast(t(`Pasted ${report.sets.length} sets.`, `세트 ${report.sets.length}개를 붙여 넣었어요.`), "success");
        return;
      }
      const items = report?.items.length ? report.items : [newItem(labelOf(text7), text7, "marinara")];
      this.addReport(report ?? { sets: [], items, links: [], total: items.length, unsupported: [], parseErrors: [], converted: 0, keptSillyTavern: [] }, set, items);
      this.selectedItem = items[0].id;
      this.render();
      this.deps.ui.toast(t(`Pasted ${items.length} QRs.`, `QR ${items.length}개를 붙여 넣었어요.`), "success");
    }
    /** Imported sets go to the end; single QRs into `set`; sub menu links find their sets by name. */
    addReport(report, set, items = report.items) {
      let missing = [];
      this.deps.store.update((st) => {
        st.sets.push(...report.sets);
        if (items.length) {
          let target = set ? st.sets.find((s) => s.id === set.id) : void 0;
          if (!target) {
            target = newSet(t("Imported QRs", "가져온 QR"));
            st.sets.push(target);
          }
          target.items.push(...items);
          this.selectedSet = target.id;
        }
        missing = resolveLinks(st, report.links);
      });
      if (missing.length) this.deps.ui.toast(t(`Couldn't find the sets used as sub menus: ${missing.join(", ")}`, `하위 메뉴로 쓰던 세트를 찾지 못했어요: ${missing.join(", ")}`), "warning");
    }
    async transfer(from, item, copy) {
      const others = this.state.sets.filter((s) => s.id !== from.id);
      if (!others.length) {
        this.deps.ui.toast(t("No other set to move it to. Make another set first.", "옮길 다른 세트가 없어요. 먼저 세트를 하나 더 만드세요."), "warning");
        return;
      }
      const labels = others.map((s, i) => `${s.name}${others.filter((o) => o.name === s.name).length > 1 ? ` (${i + 1})` : ""}`);
      const [picked] = await this.deps.ui.pick?.(t(`Pick a set to ${copy ? "copy" : "move"} "${item.label}" to.`, `"${item.label}"을 ${copy ? "복사할" : "옮길"} 세트를 고르세요.`), labels) ?? [];
      const target = picked ? others[labels.indexOf(picked)] : void 0;
      if (!target) return;
      this.deps.store.update((st) => {
        const to = st.sets.find((s) => s.id === target.id);
        const src = st.sets.find((s) => s.id === from.id);
        if (!to || !src) return;
        if (copy) to.items.push(cloneItem(item));
        else {
          src.items = src.items.filter((i) => i.id !== item.id);
          to.items.push(item);
        }
      });
      if (!copy) {
        this.selectedSet = target.id;
        this.selectedItem = item.id;
      }
      this.render();
      this.deps.ui.toast(t(`${copy ? "Copied" : "Moved"} to the set "${target.name}".`, `"${target.name}" 세트로 ${copy ? "복사했어요" : "옮겼어요"}.`), "success");
    }
    // ── the editor ──
    mutateItem(set, item, fn, quiet = false) {
      this.quiet = quiet;
      try {
        this.deps.store.update((st) => {
          const target = st.sets.find((s) => s.id === set.id)?.items.find((i) => i.id === item.id);
          if (target) fn(target);
        });
      } finally {
        this.quiet = false;
      }
    }
    scriptBox(set, item) {
      let editor = this.editors.get(item.id);
      if (!editor) {
        let checkTimer = null;
        editor = new ScriptEditor({
          value: item.script,
          key: "item-script",
          label: t("Script", "스크립트"),
          commands: () => this.deps.registry.list().map((d) => ({ name: d.name, help: d.help })),
          onChange: (value) => {
            this.mutateItem(set, item, (i) => i.script = value, true);
            if (checkTimer) clearTimeout(checkTimer);
            checkTimer = setTimeout(() => this.recheck(set, item, value), 500);
          },
          onRun: () => void this.panelFor(set, item).start(false),
          onBreakpoints: (lines) => this.breakpoints.set(item.id, lines)
        });
        editor.setBreakpoints(this.breakpoints.get(item.id) ?? /* @__PURE__ */ new Set());
        this.editors.set(item.id, editor);
      }
      editor.value = item.script;
      return editor;
    }
    /** Unknown commands after typing stops: only the warning lines change. */
    recheck(set, item, script) {
      const res = findUnsupported(script, this.deps.registry);
      this.mutateItem(set, item, (i) => i.unsupported = Array.isArray(res) ? res.length ? res : void 0 : [t("(syntax error)", "(문법 오류)")], true);
      const slot = this.root?.querySelector(`[data-checks="${item.id}"]`);
      const fresh = this.state.sets.find((s) => s.id === set.id)?.items.find((i) => i.id === item.id);
      if (slot && fresh) slot.replaceChildren(...this.checks(fresh));
    }
    checks(item) {
      const out = [];
      if (item.unsupported?.length) out.push(el("div", { class: "warn" }, `⚠ ${t("Not supported yet", "아직 지원하지 않는 명령")}: ${item.unsupported.map((c) => c.startsWith("(") ? c : `/${c}`).join(", ")}`));
      out.push(this.foreignLine(item.script));
      return out;
    }
    panelFor(set, item) {
      let panel = this.panels.get(item.id);
      if (!panel) {
        panel = new RunPanel({
          run: (signal, debug) => {
            const fresh = this.state.sets.find((s) => s.id === set.id);
            const now = fresh?.items.find((i) => i.id === item.id);
            if (!fresh || !now) throw new Error(t("Couldn't find the QR.", "QR을 찾지 못했어요."));
            return this.deps.runInEditor(fresh, now, { signal, debug });
          },
          editor: () => this.editors.get(item.id) ?? null,
          breakpoints: () => this.breakpoints.get(item.id) ?? /* @__PURE__ */ new Set(),
          changed: () => {
            const slot = this.root?.querySelector(`[data-run="${item.id}"]`);
            if (slot) slot.replaceChildren(panel.render());
          }
        });
        this.panels.set(item.id, panel);
      }
      return panel;
    }
    editor(set, item) {
      const { registry } = this.deps;
      const mutate = (fn) => this.mutateItem(set, item, fn);
      const box = el("div", { class: "editor" });
      const panel = this.panelFor(set, item);
      box.append(
        this.basics(set, item, mutate),
        item.dialect === "st" ? el(
          "div",
          { class: "note-box" },
          el("div", { class: "warn" }, t("Runs SillyTavern style (first message = #0). Why it couldn't be converted to Marinara style automatically:", "실리태번 기준(첫 메시지 = 0번)으로 실행돼요. 마리나라 기준으로 자동 변환하지 못한 이유:")),
          el("ul", {}, ...(item.note ?? t("No reason was recorded", "이유가 기록되지 않았어요")).split("\n").map((r) => el("li", {}, r))),
          el(
            "div",
            { class: "row" },
            el(
              "button",
              {
                onclick: () => {
                  let ok = false;
                  mutate((i) => ok = applyConversion(i, registry));
                  this.deps.ui.toast(ok ? t("Converted to Marinara style.", "마리나라 기준으로 바꿨어요.") : t("Can't convert it automatically yet. Fix the reasons above and try again.", "아직 자동으로 바꿀 수 없어요. 위 이유를 고친 뒤 다시 눌러 주세요."), ok ? "success" : "warning");
                }
              },
              t("Convert to Marinara style", "마리나라 기준으로 변환")
            ),
            el(
              "button",
              {
                title: t("Fixed the script by hand: mark it Marinara style (from #1)", "스크립트를 직접 고쳤으면 마리나라 기준(1번부터)으로 표시"),
                onclick: () => mutate((i) => {
                  i.dialect = "marinara";
                  delete i.note;
                })
              },
              t("Fixed by hand (mark Marinara style)", "직접 고침 (마리나라 기준으로 표시)")
            )
          )
        ) : el("span"),
        el(
          "div",
          { class: "field-h" },
          t("Script", "스크립트"),
          helpTip(
            t(
              "STscript. Marinara commands and macros like {{char}} work too\n· Typing / or {{ shows a list\n· Ctrl+Enter runs, Tab indents\n· A clicked line number stops a debug run at that line",
              "STscript. 마리나라 명령과 {{char}} 같은 매크로도 가능\n· / 나 {{ 입력 시 목록\n· Ctrl+Enter 실행, Tab 들여쓰기\n· 줄 번호를 누르면 디버그 때 그 줄에서 멈춤"
            ),
            t("Script", "스크립트")
          )
        ),
        this.scriptBox(set, item).element,
        el("div", { "data-checks": item.id }, ...this.checks(item)),
        el("div", { "data-run": item.id }, panel.render()),
        this.commandList(),
        this.submenuPart(set, item),
        this.autoPart(set, item),
        this.footer(set, item, mutate)
      );
      return box;
    }
    /** Icon, name, tooltip. */
    basics(set, item, mutate, folderField) {
      return el(
        "div",
        { class: "row" },
        el("label", {}, t("Icon", "아이콘"), el("input", { type: "text", value: item.icon ?? "", placeholder: item.kind === "ooc" ? "💬" : "", maxlength: "8", style: "width:3.2em;text-align:center", title: t("Dock bubble icon (empty: first letter of the name)", "Dock 버블 아이콘 (비우면 이름 첫 글자)"), "data-key": "item-icon", oninput: (e) => mutate((i) => i.icon = e.target.value.trim() || void 0) })),
        el("label", { class: "grow" }, t("Name", "이름"), el("input", { type: "text", value: item.label, "data-key": "item-label", oninput: (e) => mutate((i) => i.label = e.target.value) })),
        folderField ?? el("label", { class: "grow" }, el("span", { class: "field-h" }, t("Tooltip", "설명"), helpTip(t("Text shown on hover over the Dock bubble", "Dock 버블에 마우스를 올리면 보이는 글"), t("Tooltip", "설명"))), el("input", { type: "text", value: item.title ?? "", "data-key": "item-title", oninput: (e) => mutate((i) => i.title = e.target.value || void 0) }))
      );
    }
    /** Hide, icon only, delete. */
    footer(set, item, mutate, extra = []) {
      return el(
        "div",
        {},
        el(
          "div",
          { class: "toggles" },
          ...extra,
          setting(t("Hide from the Dock", "Dock에서 숨기기"), toggle(!!item.hidden, (v) => mutate((i) => i.hidden = v), t("Hide from the Dock", "Dock에서 숨기기"), "item-hidden"), t("Hidden in the set's Dock folder. Other QRs and auto-run can still use it", "Dock의 세트 폴더에서 숨김. 다른 QR·자동 실행으로는 사용 가능")),
          item.icon?.trim() ? setting(t("Icon only", "아이콘만 보이기"), toggle(item.showLabel === false, (v) => mutate((i) => v ? i.showLabel = false : delete i.showLabel), t("Icon only", "아이콘만 보이기"), "item-icon-only"), HELP().showLabel) : null
        ),
        el("div", { class: "actions" }, el("button", { class: "danger", onclick: () => this.removeItem(set, item) }, icon("trash"), t("Delete QR", "QR 삭제")))
      );
    }
    /** A folded part that stays open through redraws. */
    fold(key2, title, count, help, ...kids) {
      const d = el("details", { class: "box" }, el("summary", {}, title, count ? el("span", { class: "count" }, `· ${count}`) : null, help ? helpTip(help, title) : null), ...kids);
      d.open = this.openParts.has(key2);
      d.addEventListener("toggle", () => d.open ? this.openParts.add(key2) : this.openParts.delete(key2));
      return d;
    }
    submenuPart(set, item) {
      const mutate = (fn) => this.mutateItem(set, item, fn);
      const links = item.contextList ?? [];
      const rows = el("div", { class: "links" });
      links.forEach((link, index) => {
        const target = this.state.sets.find((s) => s.id === link.setId);
        if (!target) return;
        rows.append(
          el(
            "div",
            { class: "link" },
            el("span", { class: "grow" }, `${target.icon?.trim() ?? "📁"} ${target.name}`, el("span", { class: "note" }, t(` · ${target.items.length} QRs`, ` · QR ${target.items.length}개`))),
            el(
              "label",
              { class: "inline" },
              toggle(!!link.chained, (v) => mutate((i) => i.contextList && (i.contextList[index] = v ? { ...link, chained: true } : { setId: link.setId })), t("Chain", "이어서 실행"), `link-chain-${index}`),
              t("Chain", "이어서 실행")
            ),
            el(
              "button",
              {
                class: "icon",
                title: t("Remove from the sub menu", "하위 메뉴에서 빼기"),
                "aria-label": t(`Remove ${target.name}`, `${target.name} 빼기`),
                onclick: () => mutate((i) => {
                  i.contextList = (i.contextList ?? []).filter((_, n) => n !== index);
                  if (!i.contextList.length) delete i.contextList;
                })
              },
              icon("x")
            )
          )
        );
      });
      const choices = this.state.sets.filter((s) => !links.some((l) => l.setId === s.id));
      const add = el(
        "select",
        {
          "aria-label": t("Set to attach as a sub menu", "하위 메뉴로 달 세트"),
          "data-key": "link-add",
          onchange: (e) => {
            const id = e.target.value;
            if (id) mutate((i) => i.contextList = [...i.contextList ?? [], { setId: id }]);
          }
        },
        el("option", { value: "" }, t("+ Attach a set…", "+ 세트 달기…")),
        ...choices.map((s) => el("option", { value: s.id }, s.id === set.id ? t(`${s.name} (this set: only hidden QRs with an icon)`, `${s.name} (이 세트: 숨긴 QR 중 아이콘 있는 것만)`) : s.name))
      );
      return this.fold(`submenu-${item.id}`, t("Sub menu", "하위 메뉴"), links.length, HELP().submenu, rows, choices.length ? add : el("div", { class: "note" }, t("No sets to attach", "달 수 있는 세트 없음")));
    }
    autoPart(set, item) {
      const mutate = (fn) => this.mutateItem(set, item, fn);
      const on = TRIGGERS().filter((tr) => item.auto?.[tr.key]).length + (item.automationId ? 1 : 0);
      return this.fold(
        `auto-${item.id}`,
        t("Auto-run", "자동 실행"),
        on,
        HELP().auto,
        el(
          "div",
          { class: "toggles" },
          ...TRIGGERS().map(
            (tr) => setting(tr.label, toggle(!!item.auto?.[tr.key], (v) => mutate((i) => {
              const auto = { ...i.auto };
              if (v) auto[tr.key] = true;
              else delete auto[tr.key];
              i.auto = Object.keys(auto).length ? auto : void 0;
            }), tr.label, `auto-${tr.key}`), tr.help)
          )
        ),
        setting(
          t("When a lorebook entry is used", "로어북 항목이 쓰일 때"),
          el("input", { type: "text", value: item.automationId ?? "", placeholder: t("Entry name", "항목 이름"), "data-key": "item-automation", "aria-label": t("Lorebook entry name", "로어북 항목 이름"), oninput: (e) => mutate((i) => e.target.value.trim() ? i.automationId = e.target.value : delete i.automationId) }),
          HELP().automation
        ),
        setting(t("Block auto-run chains", "자동 실행 연쇄 막기"), toggle(item.preventAuto !== false, (v) => mutate((i) => v ? delete i.preventAuto : i.preventAuto = false), t("Block auto-run chains", "자동 실행 연쇄 막기"), "item-prevent"), HELP().preventAuto)
      );
    }
    /** "새 QR" with the kinds a QR can start as (each is still a plain QR to edit). */
    newQrMenu(add) {
      return this.menu(el("span", { class: "row", style: "gap:5px" }, icon("plus"), el("span", { class: "label" }, t("New QR", "새 QR"))), t("New QR", "새 QR"), [
        { label: t("Command / script", "명령·스크립트"), sub: t("A /command or STscript", "/명령이나 STscript"), run: () => add(newItem(t("New QR", "새 QR"), t("/echo Hello, {{user}}!", "/echo 안녕하세요, {{user}}!"))) },
        { label: "OOC", sub: t("Sends the written text as OOC", "적은 글을 OOC로 보내기"), run: () => add({ ...newItem(t("New OOC", "새 OOC"), "/ooc "), icon: "💬" }) },
        { label: t("Visualizer", "비주얼라이저"), sub: t("Makes an HTML page from a topic", "주제로 HTML 페이지 만들기"), run: () => add({ ...newItem(t("New page", "새 페이지"), t("/visz [[Topic of the page]]", "/visz [[만들 페이지의 주제]]")), icon: "🌟" }) }
      ], true);
    }
    /** A small drop-down menu (details) of actions. */
    menu(summaryContent, label, entries, opensRight = false) {
      const menu = el("details", { class: opensRight ? "menu right" : "menu" });
      const summary = el("summary", { role: "button", "aria-label": label, title: label }, summaryContent);
      const list = el("div", { class: "menu-list" });
      for (const e of entries) {
        if (e === "-") {
          list.append(el("hr"));
          continue;
        }
        list.append(
          el(
            "button",
            {
              class: e.danger ? "danger-item" : "",
              onclick: () => {
                menu.open = false;
                void e.run();
              }
            },
            e.label,
            e.sub ? el("small", {}, e.sub) : null
          )
        );
      }
      menu.append(summary, list);
      menu.addEventListener("focusout", (ev) => {
        if (!menu.contains(ev.relatedTarget)) menu.open = false;
      });
      return menu;
    }
    /** One "내보내기" button with the two file kinds under it. */
    exportMenu(set) {
      return this.menu(el("span", { class: "row", style: "gap:5px" }, icon("upload"), el("span", { class: "label" }, t("Export", "내보내기"))), t("Export set", "세트 내보내기"), [
        { label: t("For Marinara (.mqr.json)", "마리나라용 (.mqr.json)"), sub: t("To keep using it in Dispensa", "Dispensa에서 계속 쓸 때"), run: () => this.exportSet(set, "marinara") },
        { label: t("For SillyTavern (.qr.json)", "실리태번용 (.qr.json)"), sub: t("To use it in SillyTavern (first message = #0)", "실리태번에서 쓸 때 (첫 메시지 = 0번)"), run: () => this.exportSet(set, "st") }
      ]);
    }
    foreignLine(script) {
      const { registry } = this.deps;
      const found = foreignCommands(script, registry);
      if (!found.length) return el("span");
      return el(
        "div",
        { class: "foreign", title: t("Commands that don't work in SillyTavern. Exporting for SillyTavern warns about them", "실리태번에서 동작하지 않는 명령. 실리태번용으로 내보낼 때 알림") },
        t("Not in SillyTavern:", "실리태번에 없는 명령:"),
        ...found.map((name) => el("span", { class: `badge ${registry.get(name)?.origin ?? ""}` }, `/${name}`))
      );
    }
    /** Searchable list of every command; clicking one puts it into the script at the caret. */
    commandList() {
      const all = this.deps.registry.list();
      const q = this.commandQuery.trim().toLowerCase();
      const shown = q ? all.filter((d) => d.name.includes(q) || (d.aliases ?? []).some((a) => a.includes(q)) || d.help.toLowerCase().includes(q)) : all;
      const details = el(
        "details",
        { class: "cmds", ontoggle: () => this.commandListOpen = details.open },
        el("summary", {
          // remember right away: the toggle event comes later, and a redraw in between would lose it
          onclick: () => this.commandListOpen = !details.open
        }, t(`Commands (${all.length}) · `, `명령 목록 (${all.length}개) · `), ORIGIN_BADGE.st(), " ", ORIGIN_BADGE.dispensa(), " ", ORIGIN_BADGE.marinara()),
        el("input", {
          type: "text",
          placeholder: t("Find a command (name or description)", "명령 찾기 (이름이나 설명)"),
          value: this.commandQuery,
          "data-key": "command-search",
          oninput: (e) => {
            this.commandQuery = e.target.value;
            this.render();
          }
        }),
        el("div", { class: "cmd-list" }, ...shown.map((d) => this.commandRow(d)))
      );
      details.open = this.commandListOpen;
      return details;
    }
    commandRow(def) {
      const badge = def.origin === "dispensa" ? ORIGIN_BADGE.dispensa() : def.origin === "marinara" ? ORIGIN_BADGE.marinara() : def.origin === "extension" ? ORIGIN_BADGE.extension(def.from ?? "") : ORIGIN_BADGE.st();
      return el(
        "button",
        {
          class: "cmd",
          title: def.aliases?.length ? t(`Aliases: /${def.aliases.join(", /")}`, `다른 이름: /${def.aliases.join(", /")}`) : "",
          onclick: () => {
            const ta = this.root?.querySelector('textarea[data-key="item-script"]');
            if (!ta) return;
            const start2 = ta.selectionStart ?? ta.value.length;
            const end = ta.selectionEnd ?? start2;
            const before = ta.value.slice(0, start2);
            const insert = `${before && !/[\s|]$/.test(before) ? " | " : ""}/${def.name} `;
            ta.value = before + insert + ta.value.slice(end);
            ta.dispatchEvent(new Event("input"));
            const caret = start2 + insert.length;
            ta.focus();
            ta.setSelectionRange(caret, caret);
          }
        },
        el("code", {}, `/${def.name}`),
        badge,
        el("span", { class: "help" }, def.help)
      );
    }
    async importFile() {
      const input = el("input", { type: "file", accept: ".json,application/json", multiple: true });
      input.addEventListener("change", async () => {
        let added = 0;
        let converted = 0;
        const kept = [];
        const problems = [];
        for (const file of [...input.files ?? []]) {
          try {
            const json2 = JSON.parse(await file.text());
            const report = importAny(json2, this.deps.registry, file.name.replace(/\.(m?qr\.)?json$/i, ""));
            if (!report.sets.length && !report.items.length) {
              problems.push(t(`${file.name}: not a QR file.`, `${file.name}: QR 파일이 아니에요.`));
              continue;
            }
            this.addReport(report, this.set);
            if (report.sets.length) this.selectedSet = report.sets[0].id;
            added += report.total;
            converted += report.converted;
            for (const k of report.keptSillyTavern) kept.push(`${k.label}: ${k.reasons.join(" / ")}`);
            for (const u of report.unsupported) problems.push(`${u.label}: /${u.commands.join(", /")}`);
            for (const p of report.parseErrors) problems.push(t(`${p.label}: syntax error (${p.error})`, `${p.label}: 문법 오류 (${p.error})`));
          } catch (e) {
            problems.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        this.render();
        const summary = [
          t(`Imported ${added} QRs.`, `QR ${added}개를 가져왔어요.`),
          converted ? t(`${converted} were converted to Marinara style.`, `${converted}개는 마리나라 기준으로 바꿔서 저장했어요.`) : "",
          kept.length ? t(`${kept.length} were kept SillyTavern style.`, `${kept.length}개는 실리태번 기준으로 남겼어요.`) : ""
        ].filter(Boolean).join(" ");
        this.deps.ui.toast(summary, problems.length || kept.length ? "warning" : "success");
        if (problems.length || kept.length) {
          const parts3 = [];
          if (kept.length) parts3.push(`${t("<b>QRs kept SillyTavern style</b> (their message numbers couldn't be converted automatically)", "<b>실리태번 기준으로 남긴 QR</b> (메시지 번호를 자동으로 바꿀 수 없었어요)")}<br>${kept.map(escapeHtml).join("<br>")}`);
          if (problems.length) parts3.push(`${t("<b>QRs with commands not supported yet</b>", "<b>아직 지원하지 않는 명령이 들어 있는 QR</b>")}<br>${problems.map(escapeHtml).join("<br>")}`);
          await this.deps.ui.popup(parts3.join("<br><br>"), { wide: true });
        }
        if (this.deps.store.overLimit()) this.deps.ui.toast(t("Storage is almost full. Delete sets you don't use.", "저장 공간이 거의 찼어요. 쓰지 않는 세트를 지워 주세요."), "warning");
      });
      input.click();
    }
    async exportSet(set, format) {
      if (format === "st") {
        const foreign = nonSillyTavernCommands(set, this.deps.registry);
        if (foreign.length) {
          const list = foreign.map((f) => escapeHtml(`${f.label}: /${f.commands.join(", /")}`)).join("<br>");
          const ok = await this.deps.ui.popup(
            t(
              `<b>Some QRs have commands SillyTavern doesn't have.</b> Those parts won't work in SillyTavern.<br>${list}<br><br>Export as .qr.json anyway? (To keep using them in Marinara, .mqr.json is better)`,
              `<b>실리태번에는 없는 명령이 들어 있는 QR이 있어요.</b> 실리태번에서는 이 부분이 동작하지 않아요.<br>${list}<br><br>그래도 .qr.json으로 내보낼까요? (마리나라에서 계속 쓸 거라면 .mqr.json이 좋아요)`
            ),
            { okButton: t("Export", "내보내기"), cancelButton: t("Cancel", "취소"), wide: true }
          );
          if (!ok) return;
        }
      }
      const data = format === "st" ? exportSillyTavern(set, this.deps.registry, this.setName) : exportMarinara(set, this.setName);
      this.download(data, `${set.name || "qr-set"}.${format === "st" ? "qr" : "mqr"}.json`);
    }
    download(data, name) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = el("a", { href: url, download: name.replace(/[\\/:*?"<>|]/g, "_") });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    }
  };
  function cloneItem(item) {
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = newId(item.kind === "ooc" ? "ooc" : "qr");
    return copy;
  }
  function duplicateSet(set, state) {
    const copy = JSON.parse(JSON.stringify(set));
    copy.id = newId("set");
    const taken = new Set(state.sets.map((s) => s.name));
    let name = t(`${set.name} copy`, `${set.name} 복사본`);
    for (let n = 2; taken.has(name); n++) name = t(`${set.name} copy ${n}`, `${set.name} 복사본 ${n}`);
    copy.name = name;
    for (const item of copy.items) {
      item.id = newId(item.kind === "ooc" ? "ooc" : "qr");
      if (item.contextList) item.contextList = item.contextList.map((l) => l.setId === set.id ? { ...l, setId: copy.id } : l);
    }
    return copy;
  }
  function toHex(color) {
    if (!color) return void 0;
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const m2 = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color);
    return m2 ? `#${[m2[1], m2[2], m2[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : void 0;
  }
  function labelOf(text7) {
    const one = text7.replace(/\s+/g, " ").trim();
    return one.length > 14 ? `${one.slice(0, 13)}…` : one || "QR";
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // src/wand/archive.ts
  var MemoryArchive = class {
    map = /* @__PURE__ */ new Map();
    async list() {
      return [...this.map.values()].sort((a, b) => b.createdAt - a.createdAt);
    }
    async put(entry) {
      this.map.set(entry.id, structuredClone(entry));
    }
    async remove(id) {
      this.map.delete(id);
    }
  };
  var DB = "dispensa-wand";
  var STORE = "archive";
  var IndexedDbArchive = class {
    db = null;
    open() {
      this.db ??= new Promise((resolve, reject) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error(t("Couldn't open the Library.", "보관함을 열지 못했어요.")));
      });
      return this.db;
    }
    async tx(mode, run) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error(t("Library operation failed.", "보관함 작업에 실패했어요.")));
      });
    }
    async list() {
      const all = await this.tx("readonly", (s) => s.getAll());
      return all.sort((a, b) => b.createdAt - a.createdAt);
    }
    async put(entry) {
      await this.tx("readwrite", (s) => s.put(entry));
    }
    async remove(id) {
      await this.tx("readwrite", (s) => s.delete(id));
    }
  };
  function createArchive() {
    return typeof indexedDB !== "undefined" ? new IndexedDbArchive() : new MemoryArchive();
  }

  // src/wand/service.ts
  var MEMO_BLANK = /^(메모|memo)$/i;
  var AUTO_CONTINUE = 2;
  var WandService = class {
    constructor(host, state, archive, viewer, items = () => []) {
      this.host = host;
      this.state = state;
      this.archive = archive;
      this.viewer = viewer;
      this.items = items;
    }
    busyLabel = null;
    listeners = /* @__PURE__ */ new Set();
    get busy() {
      return this.busyLabel;
    }
    onBusy(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    setBusy(label) {
      this.busyLabel = label;
      for (const fn of this.listeners) fn(label);
    }
    /** Asks for every [[blank]] ([[메모]]: picks from the 메모장); null when cancelled. */
    async askBlanks(text7) {
      const values = {};
      const pick2 = this.host.pickMemos;
      for (const blank of findBlanks(text7)) {
        let answer;
        if (pick2 && !blank.options.length && MEMO_BLANK.test(blank.label.trim())) answer = await pick2();
        else if (blank.options.length && this.host.ui.choose) answer = await this.host.ui.choose(blank.label, blank.options);
        else
          answer = await this.host.ui.input(blank.options.length ? `${blank.label} (${blank.options.join(" / ")})` : blank.label, {
            // a memo can be the answer
            extra: pick2 ? { label: t("📝 Memo pad", "📝 메모장"), title: t("Pick from the Memo pad", "메모장에서 골라 넣기"), fill: pick2 } : void 0
          });
        if (answer === null) return null;
        values[blank.key] = answer;
      }
      return fillBlanks(text7, values);
    }
    /** /visz: a 🌟 QR by title, or the text as a new request. */
    runTitleOrText(textOrTitle, options = {}) {
      const item = findByTitle(this.items(), textOrTitle);
      if (item) return this.run(options.action ?? item.defaultAction, item.content, { title: item.title, item, vizOutput: options.output });
      return this.run(options.action ?? "viz", textOrTitle, { vizOutput: options.output });
    }
    /** Runs an item with its default button. */
    runItem(item, action = item.defaultAction) {
      return this.run(action, item.content, { title: item.title, item });
    }
    /** Resolves true once the request went out (false when cancelled, busy or failed). */
    async run(action, content, opts = {}) {
      const ui = this.host.ui;
      if (this.busyLabel) {
        ui.toast(t("The Visualizer is already making something. Try again when it's done.", "비주얼라이저가 이미 만들고 있어요. 끝난 뒤에 다시 눌러 주세요."), "warning", { title: "🌟" });
        return false;
      }
      const filled = await this.askBlanks(content);
      if (filled === null) {
        ui.toast(t("Cancelled.", "취소했어요."), "info", { title: "🌟" });
        return false;
      }
      if (!cleanOoc(filled)) {
        ui.toast(t("Nothing to send.", "보낼 내용이 비어 있어요."), "warning", { title: "🌟" });
        return false;
      }
      const state = this.state();
      const o = itemOptions(state, opts.item);
      const title = opts.title || titleFrom(filled) || t("Visualizer", "비주얼라이저");
      if (action === "ooc") {
        const text7 = wrapOoc(o.wrapper.template, filled, state.settings.language);
        const mode = opts.oocMode ?? o.oocMode;
        if (mode === "input") {
          this.host.putInInput(text7);
          return true;
        }
        if (mode === "user") return this.busyWhile(`💬 ${title}`, () => this.host.sendAsUser(text7));
        if (mode === "guided") return this.busyWhile(`💬 ${title}`, () => this.host.guided(text7));
        return this.generateAndDeliver(text7, { kind: "ooc", title, connectionId: o.connectionId, output: "chat" });
      }
      const env = { fornello: this.host.hasFornello?.() === true };
      const prompt = assembleVisualizer(state.preset, resolveVizMode(state.settings.vizMode, env), { topic: filled, language: state.settings.language, env });
      return this.generateAndDeliver(prompt, { kind: "viz", title, connectionId: o.connectionId, output: opts.vizOutput ?? o.vizOutput });
    }
    async busyWhile(label, fn) {
      this.setBusy(label);
      try {
        await fn();
        return true;
      } catch (e) {
        this.host.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("🌟 Failed", "🌟 실패") });
        return false;
      } finally {
        this.setBusy(null);
      }
    }
    generateAndDeliver(prompt, o) {
      return this.busyWhile(`${o.kind === "viz" ? "🌟" : "💬"} ${o.title}`, async () => {
        this.host.ui.toast(t(`Making ${o.title}…`, `${o.title} 만드는 중…`), "info", { title: "🌟" });
        let text7 = normalizeOutput(await this.host.generate(prompt, o.connectionId)).text;
        if (!text7) throw new Error(t("The reply was empty.", "응답이 비어 있어요."));
        for (let i = 0; i < AUTO_CONTINUE && normalizeOutput(text7).truncated; i++) text7 = await this.continueText(text7, o.connectionId);
        const entry = { title: o.title, kind: o.kind, text: text7 };
        if (o.output === "viewer") {
          this.viewer()?.show(entry);
          return;
        }
        await this.host.postAsCharacter(text7);
        if (this.state().settings.autoArchive && (o.kind === "viz" || extractHtmlBlocks(text7).length)) await this.save(entry);
      });
    }
    /** Finishes the first cut-off page in the text. */
    async continueText(text7, connectionId = this.state().settings.connectionId) {
      const blocks = extractHtmlBlocks(text7);
      const index = blocks.findIndex((b) => !b.complete);
      if (index < 0) return text7;
      const more = await this.host.generate(CONTINUE_TEMPLATE.replace("{{앞부분}}", blocks[index].code), connectionId);
      return replaceHtmlBlock(text7, index, mergeContinuation(blocks[index].code, more));
    }
    /** The viewer's "이어 쓰기" button. */
    async continueEntry(entry) {
      if (this.busyLabel) return null;
      let result = null;
      await this.busyWhile(t(`🌟 Continuing ${entry.title}`, `🌟 ${entry.title} 이어 쓰기`), async () => {
        result = { ...entry, text: await this.continueText(entry.text) };
        if (entry.archivedId) await this.save(result);
      });
      return result;
    }
    async save(entry) {
      const info = await this.host.chatInfo().catch(() => ({}));
      const record = {
        id: entry.archivedId ?? newWandId("page"),
        title: entry.title,
        kind: entry.kind,
        text: entry.text,
        createdAt: Date.now(),
        ...info
      };
      await this.archive.put(record);
      entry.archivedId = record.id;
      return record.id;
    }
    /** Puts a viewer result into the chat as the character's message. */
    postToChat(entry) {
      return this.busyWhile(t(`Posting ${entry.title} to chat`, `${entry.title} 채팅에 넣기`), () => this.host.postAsCharacter(entry.text));
    }
  };

  // src/wand/store.ts
  var KEY3 = "wand";
  var WandStore = class {
    state = defaultWandState();
    listeners = /* @__PURE__ */ new Set();
    saveTimer = null;
    loadedOk = false;
    /** Loaded from storage (writes are safe). */
    get ready() {
      return this.loadedOk;
    }
    get value() {
      return this.state;
    }
    async load() {
      try {
        const stored = await getMarinara().storage.get();
        this.state = normalizeWandState(stored[KEY3]);
        this.loadedOk = true;
      } catch (e) {
        this.loadedOk = false;
        throw e;
      }
      this.emit();
    }
    /** For tests and first runs without storage. */
    replace(state) {
      this.state = state;
      this.loadedOk = true;
      this.emit();
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    update(mutate) {
      mutate(this.state);
      this.emit();
      this.scheduleSave();
    }
    size() {
      return new TextEncoder().encode(JSON.stringify(this.state)).length;
    }
    async saveNow() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = null;
      if (!this.loadedOk) return;
      await getMarinara().storage.patch({ [KEY3]: this.state });
    }
    scheduleSave() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        void this.saveNow().catch((e) => console.error("[Dispensa] wand save failed", e));
      }, 400);
    }
    emit() {
      for (const fn of this.listeners) fn(this.state);
    }
  };

  // src/memo/store.ts
  var KEY4 = "memo";
  var MemoStore = class {
    state = emptyMemos();
    listeners = /* @__PURE__ */ new Set();
    saveTimer = null;
    loadedOk = false;
    get ready() {
      return this.loadedOk;
    }
    get value() {
      return this.state;
    }
    async load() {
      try {
        const stored = await getMarinara().storage.get();
        this.state = normalizeMemos(stored[KEY4]);
        this.loadedOk = true;
      } catch (e) {
        this.loadedOk = false;
        throw e;
      }
      this.emit();
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    update(mutate) {
      mutate(this.state);
      this.emit();
      this.scheduleSave();
    }
    size() {
      return new TextEncoder().encode(JSON.stringify(this.state)).length;
    }
    async saveNow() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = null;
      if (!this.loadedOk) return;
      await getMarinara().storage.patch({ [KEY4]: this.state });
    }
    scheduleSave() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        void this.saveNow().catch((e) => console.error("[Dispensa] memo save failed", e));
      }, 400);
    }
    emit() {
      for (const fn of this.listeners) fn(this.state);
    }
  };

  // src/ui/memo-capture.ts
  var OWN_LOOK = [
    "position:fixed",
    "z-index:9998",
    "transform:translateX(-50%)",
    "display:inline-flex",
    "align-items:center",
    "gap:6px",
    "min-height:36px",
    "padding:0 12px",
    "border-radius:9999px",
    "border:1px solid var(--marinara-chat-chrome-panel-border, var(--border, rgb(255 255 255 / .12)))",
    "background:var(--marinara-chat-chrome-panel-bg, var(--popover, #1d1d22))",
    "color:var(--marinara-chat-chrome-panel-text, var(--popover-foreground, var(--foreground, #e8e8ea)))",
    "box-shadow:0 25px 50px -12px rgb(0 0 0 / .4)",
    "backdrop-filter:blur(12px)",
    "font:500 12px/1 var(--font-sans, inherit)",
    "cursor:pointer"
  ].join(";");
  var MemoCapture = class {
    constructor(save) {
      this.save = save;
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.id = "dispensa-memo-capture";
      const glyph = icon("notebook-pen");
      glyph.setAttribute("width", "13");
      glyph.setAttribute("height", "13");
      glyph.style.flex = "none";
      this.button.append(glyph, this.caption);
      this.button.hidden = true;
      this.button.addEventListener("pointerdown", (e) => e.preventDefault());
      this.button.addEventListener("mousedown", (e) => e.preventDefault());
      this.button.addEventListener("click", () => {
        const text7 = this.text;
        this.hide();
        const ta = findComposer()?.textarea;
        if (ta && document.activeElement === ta) ta.setSelectionRange(ta.selectionEnd, ta.selectionEnd);
        else window.getSelection()?.removeAllRanges();
        if (text7) this.save(text7);
      });
      document.body.append(this.button);
      document.addEventListener("selectionchange", this.schedule);
      for (const type of ["mouseup", "keyup", "touchend", "select"]) document.addEventListener(type, this.schedule, true);
      document.addEventListener("keydown", this.onKey, true);
      window.addEventListener("scroll", this.onScroll, true);
      window.addEventListener("resize", this.hideNow);
    }
    button;
    caption = document.createTextNode("");
    text = "";
    timer = null;
    enabled = true;
    setEnabled(on) {
      this.enabled = on;
      if (!on) this.hide();
    }
    dispose() {
      document.removeEventListener("selectionchange", this.schedule);
      for (const type of ["mouseup", "keyup", "touchend", "select"]) document.removeEventListener(type, this.schedule, true);
      document.removeEventListener("keydown", this.onKey, true);
      window.removeEventListener("scroll", this.onScroll, true);
      window.removeEventListener("resize", this.hideNow);
      if (this.timer) clearTimeout(this.timer);
      this.button.remove();
    }
    schedule = (e) => {
      if (e && e.composedPath?.().includes(this.button)) return;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.update(), 200);
    };
    onKey = (e) => {
      if (e.key === "Escape" && !this.button.hidden) this.hide();
    };
    onScroll = () => {
      if (!this.button.hidden) this.schedule();
    };
    hideNow = () => this.hide();
    hide() {
      this.button.hidden = true;
      this.button.style.display = "none";
      this.text = "";
    }
    update() {
      if (!this.enabled) return;
      const picked = this.picked();
      if (!picked || picked.text.length < 2) {
        this.hide();
        return;
      }
      this.text = picked.text;
      const b = this.button;
      b.title = t("Add the selected text to the Memo pad", "고른 글을 메모장에 넣기");
      this.caption.data = t("Memo", "메모하기");
      const theirs = document.querySelector("[data-selection-lorebook-button]");
      const box = theirs?.getBoundingClientRect();
      if (theirs && box?.width) {
        b.className = theirs.className;
        b.setAttribute("style", "");
        b.hidden = false;
        const w2 = b.offsetWidth;
        const gap = 6;
        const theirCenter = parseFloat(theirs.style.left) || box.left + box.width / 2;
        const top = parseFloat(theirs.style.top) || box.top;
        let center2 = theirCenter + box.width / 2 + gap + w2 / 2;
        if (center2 + w2 / 2 > window.innerWidth - 8) center2 = theirCenter - box.width / 2 - gap - w2 / 2;
        b.style.left = `${Math.max(8 + w2 / 2, center2)}px`;
        b.style.top = `${top}px`;
        return;
      }
      b.className = "";
      b.setAttribute("style", OWN_LOOK);
      b.hidden = false;
      const w = b.offsetWidth || 90;
      const h2 = b.offsetHeight || 36;
      const center = Math.min(Math.max(8 + w / 2, picked.rect.left + picked.rect.width / 2), window.innerWidth - 8 - w / 2);
      let y = picked.rect.bottom + 8;
      if (y + h2 > window.innerHeight - 8) y = Math.max(8, picked.rect.top - h2 - 8);
      b.style.left = `${center}px`;
      b.style.top = `${y}px`;
    }
    /** The selected text in a chat message or the chat input, and where it is. */
    picked() {
      const ta = findComposer()?.textarea;
      if (ta && document.activeElement === ta && ta.selectionStart !== ta.selectionEnd) {
        const r = ta.getBoundingClientRect();
        return { text: ta.value.slice(ta.selectionStart, ta.selectionEnd).trim(), rect: new DOMRect(r.left, r.top - 52, r.width, 0) };
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
      const inMessage = (n) => !!(n instanceof Element ? n : n?.parentElement)?.closest("[data-message-id]");
      if (!inMessage(sel.anchorNode) && !inMessage(sel.focusNode)) return null;
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return null;
      return { text: sel.toString().trim(), rect };
    }
  };

  // src/ui/memo-pick.ts
  async function pickMemos(ui, memos, prompt = t("Pick from the Memo pad (one or more)", "메모장에서 고르기 (여러 개 가능)"), query = "") {
    const list = shownMemos(memos.value.memos, query);
    if (!list.length) {
      ui.toast(query ? t(`No memo contains "${query}".`, `"${query}"이(가) 든 메모가 없어요.`) : t("The Memo pad is empty. Select text in the chat and press 📝 to add it.", "메모장이 비어 있어요. 채팅에서 글을 긁어 📝을 누르면 들어가요."), "info", { title: "📝" });
      return null;
    }
    const labels = list.map((m2, i) => `${i + 1}. ${m2.pinned ? "⭐ " : ""}${memoLine(m2.text)}`);
    const picked = await ui.pick?.(prompt, labels, { multiple: true, placeholder: t("Search", "찾기") }) ?? [];
    const chosen = picked.map((l) => list[labels.indexOf(l)]).filter(Boolean);
    return chosen.length ? chosen.map((m2) => m2.text).join("\n\n") : null;
  }

  // src/main.ts
  async function start() {
    const marinara2 = getMarinara();
    const previous = document.getElementById("dispensa-bar");
    previous?.remove();
    const theme = new ThemeSync();
    theme.start();
    const host = new MarinaraHost();
    const registry = createRegistry();
    const store = new QrStore();
    try {
      await store.load();
    } catch (e) {
      host.ui.toast(t("Dispensa: couldn't load the saved QRs. Changes on this screen won't be saved.", "Dispensa: 저장된 QR을 불러오지 못했어요. 이번 화면에서는 변경 내용이 저장되지 않아요."), "error");
      marinara2.log.error("load failed", e);
    }
    const wandStore = new WandStore();
    try {
      await wandStore.load();
    } catch (e) {
      host.ui.toast(t("Dispensa: couldn't load the Visualizer settings. Changes on this screen won't be saved.", "Dispensa: 비주얼라이저 설정을 불러오지 못했어요. 이번 화면에서는 변경 내용이 저장되지 않아요."), "error");
      marinara2.log.error("wand load failed", e);
    }
    const firstRun = !wandStore.value.itemsMoved;
    const memoStore = new MemoStore();
    try {
      await memoStore.load();
    } catch (e) {
      host.ui.toast(t("Dispensa: couldn't load the Memo pad. Memos on this screen won't be saved.", "Dispensa: 메모장을 불러오지 못했어요. 이번 화면에서는 메모가 저장되지 않아요."), "error");
      marinara2.log.error("memo load failed", e);
    }
    if (store.ready && wandStore.ready && memoStore.ready) {
      if (!wandStore.value.itemsMoved) {
        const texts = wandStore.value.items.map((i) => i.content.trim()).filter(Boolean);
        memoStore.update((m2) => m2.memos.push(...texts.map((t2, i) => newMemo(t2, Date.now() - i))));
        wandStore.update((s) => {
          s.items = [];
          s.itemsMoved = true;
        });
      }
      if (!memoStore.value.moved) {
        let moved = 0;
        memoStore.update((m2) => store.update((s) => moved = moveOocToMemos(s, m2)));
        if (moved && !firstRun) host.ui.toast(t(`Moved ${moved} OOC notes to the 📝 Memo pad.`, `OOC 문구 ${moved}개를 📝 메모장으로 옮겼어요.`), "info", { title: "Dispensa" });
      }
      if (!memoStore.value.vizMoved) {
        let moved = 0;
        memoStore.update((m2) => store.update((s) => moved = retireVizQrs(s, m2)));
        if (moved && !firstRun) host.ui.toast(t(`Moved ${moved} Visualizer topics to the 📝 Memo pad.`, `비주얼라이저 주제 ${moved}개를 📝 메모장으로 옮겼어요.`), "info", { title: "Dispensa" });
      }
    }
    if (store.ready && !store.value.bar) store.update((s) => moveToOwnBar(s));
    if (store.ready && oldBarSet(store.value)) store.update((s) => renameOldBarSet(s));
    const chooseMemos = (query) => pickMemos(host.ui, memoStore, void 0, query);
    const scope = new ChatScopeWatch();
    const runner = new QrRunner(host, registry, () => store.value, {
      onStart: (item) => bar.setRunning(item),
      onEnd: () => bar.setRunning(null)
    });
    const qrControl = createQrControl(store, () => runner, () => scope.current);
    const bridge = {
      version: 1,
      runSlash: async (text7) => {
        const rt = new Runtime({ host, registry, dialect: "st" });
        return asText((await rt.runScript(String(text7 ?? ""))).pipe);
      },
      registerCommand: (def) => addExternalCommand(registry, def)
    };
    window.__dispensa = bridge;
    window.dispatchEvent(new Event("dispensa:ready"));
    host.qr = qrControl;
    const run = (set, item) => void runner.run(set, item);
    const manager = new QrManager({
      store,
      registry,
      ui: host.ui,
      run,
      runInEditor: (set, item, options) => runner.runInEditor(set, item, options),
      memo: { store: memoStore, sendOoc: (text7) => sendOoc(text7), putInInput: (text7) => wandHost.putInInput(text7), makePage: (text7) => wand.run("viz", text7) },
      characterName: async (id) => {
        try {
          const raw = await api(`/characters/${encodeURIComponent(id)}`);
          return String(parseObject(raw.data).name ?? raw.name ?? t("Character", "캐릭터"));
        } catch {
          return t("Character", "캐릭터");
        }
      },
      wandStore
    });
    bridge.openSettings = () => manager.open();
    let viewer = null;
    const wandHost = createWandHost(host);
    wandHost.pickMemos = () => chooseMemos();
    const wand = new WandService(wandHost, () => wandStore.value, createArchive(), () => viewer, () => []);
    const sendOoc = (text7) => wand.run("ooc", text7);
    const addMemos = (text7) => {
      const memos = memosFrom(text7);
      memoStore.update((m2) => m2.memos.push(...memos));
      return memos.length;
    };
    host.memo = { pick: chooseMemos, add: addMemos, list: () => memoStore.value.memos.map((m2) => m2.text), ooc: sendOoc };
    host.wand = { run: (text7, options) => wand.runTitleOrText(text7, options) };
    viewer = new ViewerPanel({ service: wand, store: wandStore, ui: host.ui, onChange: () => schedulePlace() });
    const wandPanel = new WandPanel({
      store: wandStore,
      service: wand,
      qrStore: store,
      viewer: () => viewer,
      ui: host.ui,
      close: () => bar.closeMenus(),
      openSettings: () => {
        bar.closeMenus();
        manager.open("wand");
      },
      pickMemos: () => chooseMemos(),
      addMemo: (text7) => memoStore.update((m2) => m2.memos.push(newMemo(text7))),
      run: (set, item) => run(set, item)
    });
    const memoPanel = new MemoPanel({
      store: memoStore,
      ui: host.ui,
      sendOoc,
      putInInput: (text7) => wandHost.putInInput(text7),
      close: () => bar.closeMenus(),
      openSettings: () => {
        bar.closeMenus();
        manager.open("memo");
      }
    });
    const capture = new MemoCapture((text7) => {
      const n = addMemos(text7);
      host.ui.toast(n > 1 ? t(`Added ${n} memos to the Memo pad.`, `메모 ${n}개를 메모장에 넣었어요.`) : t("Added to the Memo pad.", "메모장에 넣었어요."), "success", { title: "📝" });
    });
    const bar = new QuickBar({
      run,
      stop: () => runner.stop(),
      openManager: () => manager.open("qr"),
      edit: (set, item) => manager.openItem(set.id, item.id),
      wand: { panel: wandPanel },
      memo: { panel: memoPanel }
    });
    const viewChatPage = async (messageId, index) => {
      host.chat.markStale();
      const message = (await host.chat.messages()).find((m2) => m2.id === messageId);
      const fenced = message ? extractHtmlBlocks(message.content).filter((b) => /^html?$/i.test(b.lang) && message.content.startsWith("```", b.start)) : [];
      const block = fenced[index];
      if (!block) {
        host.ui.toast(t("No HTML found in this message.", "이 메시지에서 HTML을 찾지 못했어요."), "warning", { title: "🌟" });
        return;
      }
      viewer?.show({ title: block.title || t("HTML in chat", "채팅 속 HTML"), kind: "viz", text: "```html\n" + block.code + "\n```" });
    };
    const syncWand = () => bar.setWand({ show: wandStore.value.settings.showButton, icon: wandStore.value.settings.barIcon, busy: wand.busy });
    bar.setState(store.value);
    syncWand();
    const toggle2 = new ComposerToggle(() => store.update((s) => s.barVisible = !s.barVisible));
    toggle2.setArmed(store.value.barVisible);
    const unsubscribe = store.subscribe((s) => {
      bar.setState(s);
      toggle2.setArmed(s.barVisible);
      syncWand();
      wandPanel.render();
    });
    const unsubscribeWand = wandStore.subscribe(() => {
      syncWand();
      wandPanel.render();
    });
    const unsubscribeBusy = wand.onBusy(syncWand);
    const syncMemo = () => {
      bar.setMemo({ show: memoStore.value.showButton, icon: memoStore.value.barIcon });
      capture.setEnabled(memoStore.value.capture !== false);
      memoPanel.render();
    };
    syncMemo();
    const unsubscribeMemo = memoStore.subscribe(syncMemo);
    const unwatchLang = onLangChange(() => {
      bar.render();
      toggle2.setArmed(store.value.barVisible);
      wandPanel.render();
      memoPanel.render();
      manager.refresh();
    });
    let scheduled = false;
    const place = () => {
      scheduled = false;
      const composer = findComposer();
      if (!composer) {
        if (bar.element.isConnected) bar.element.remove();
        return;
      }
      const box = composer.container.querySelector(".mari-chat-input-box");
      toggle2.mount(box ?? composer.textarea.parentElement);
      const anchor = box ?? composer.textarea.closest("form") ?? composer.textarea.parentElement;
      const parent = anchor?.parentElement;
      if (!anchor || !parent) return;
      if (bar.element.parentElement !== parent || bar.element.nextElementSibling !== anchor) parent.insertBefore(bar.element, anchor);
      theme.noticeComposer();
      addViewButtons((messageId, index) => void viewChatPage(messageId, index));
      if (viewer?.open) {
        if (viewer.element.parentElement !== parent || viewer.element.nextElementSibling !== bar.element) parent.insertBefore(viewer.element, bar.element);
      } else if (viewer?.element.isConnected) viewer.element.remove();
    };
    const schedulePlace = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(place);
      }
    };
    const observer = new MutationObserver(schedulePlace);
    observer.observe(document.body, { childList: true, subtree: true });
    place();
    const auto = new AutoExecutor((set, item) => runner.run(set, item, { auto: true }));
    const fire = (trigger, blocked) => auto.fire(autoTargets(activeSets(store.value, scope.current), trigger), blocked);
    const newChats = /* @__PURE__ */ new Map();
    const onScope = () => {
      bar.setScope(scope.current);
      manager.setScope(scope.current);
    };
    const startedBlocked = /* @__PURE__ */ new WeakMap();
    let lastBlocked = false;
    const onGenerationComplete = () => void fire("ai", lastBlocked);
    window.addEventListener("marinara:generation-complete", onGenerationComplete);
    const untilListed = async (id) => {
      if (typeof id !== "string") return;
      for (let i = 0; i < 20; i++) {
        host.chat.markStale();
        const list = await host.chat.messages().catch(() => []);
        if (list.some((m2) => m2.id === id)) return;
        await new Promise((r) => setTimeout(r, 250));
      }
    };
    let beforeRunning = false;
    const entries = /* @__PURE__ */ new WeakMap();
    const stopWatching = watchGeneration({
      beforeGeneration: async (body) => {
        const blocked = auto.blocked;
        startedBlocked.set(body, blocked);
        lastBlocked = blocked;
        if (beforeRunning || blocked) return;
        beforeRunning = true;
        try {
          await fire("beforeGeneration");
        } finally {
          beforeRunning = false;
        }
      },
      onEvent: (event, body) => {
        const blocked = startedBlocked.get(body) ?? false;
        const role = event.data?.role;
        if (event.type === "message_saved" && role === "user") void untilListed(event.data.id).then(() => fire("user", blocked));
        else if (event.type === "message_saved") entries.set(body, [...entries.get(body) ?? [], ...activatedEntries(event.data)]);
        else if (event.type === "group_turn") void fire("groupDraft", blocked);
        else if (event.type === "dispensa:end") {
          const found = entries.get(body) ?? [];
          entries.delete(body);
          if (found.length) void auto.fire(automationTargets(activeSets(store.value, scope.current), found), blocked);
        }
      },
      onChatCreated: ({ id }) => newChats.set(id, auto.blocked)
    });
    let unsubscribeScope = () => {
    };
    void (async () => {
      await scope.start();
      onScope();
      unsubscribeScope = scope.onChange((now) => {
        onScope();
        void (async () => {
          await fire("chatChange");
          if (now.chatId && newChats.has(now.chatId)) {
            const blocked = newChats.get(now.chatId);
            newChats.delete(now.chatId);
            await fire("newChat", blocked);
          }
        })();
      });
      await fire("startup");
      if (scope.current.chatId) await fire("chatChange");
    })();
    const cleanup = () => {
      if (window.__dispensa === bridge) delete window.__dispensa;
      observer.disconnect();
      unsubscribeScope();
      scope.stop();
      stopWatching();
      window.removeEventListener("marinara:generation-complete", onGenerationComplete);
      unsubscribe();
      unsubscribeWand();
      unsubscribeBusy();
      unsubscribeMemo();
      unwatchLang();
      capture.dispose();
      void memoStore.saveNow().catch(() => void 0);
      viewer?.dispose();
      theme.stop();
      void wandStore.saveNow().catch(() => void 0);
      runner.stop();
      qrControl.dispose();
      manager.close();
      bar.dispose();
      toggle2.dispose();
      void host.flush().finally(() => host.dispose());
    };
    marinara2.onCleanup(cleanup);
    marinara2.log.info("Dispensa ready");
    return cleanup;
  }

  // src/entry.ts
  void start().catch((e) => {
    console.error("[Dispensa] failed to start", e);
  });
})();
/*! Third-party notices (bundled code):

html-to-image 1.11.13 (MIT)

MIT License

Copyright (c) 2017-2025 W.Y.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
