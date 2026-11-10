/*! Dispensa 0.5.0 — quick replies on a Dock for Marinara Engine 2.5.x (External Extension).
 * Runs SillyTavern Quick Replies (STscript) in Marinara.
 * Copyright (C) 2026 FigCake. Derived from SillyTavern and Marinara Engine (both AGPL-3.0); includes html-to-image (MIT) and Lucide icons (ISC).
 * License: AGPL-3.0, except the prompt texts of 슈퍼비즈, 수퍼라비 and the example QRs: CC BY-NC-SA 4.0, see LICENSE-SUPERVIZ.txt.
 * Source: https://github.com/FigCake/ME.Dispensa (ME-Dispensa-0.5.0-source.zip) */
"use strict";
(() => {
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
    for (const child2 of children) {
      if (child2 === null || child2 === void 0 || child2 === false) continue;
      node.append(typeof child2 === "string" ? document.createTextNode(child2) : child2);
    }
    return node;
  }
  function firstGrapheme(text7) {
    const t2 = text7.trim();
    if (!t2) return "";
    if (typeof Intl.Segmenter === "function") for (const { segment } of new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(t2)) return segment;
    return Array.from(t2)[0] ?? "";
  }
  function onCtrlEnter(box, action) {
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.isComposing) {
        e.preventDefault();
        action();
      }
    });
  }
  var ICONS = {
    folder: ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
    "folder-plus": ["M12 10v6", "M9 13h6", "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
    settings: [
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
    ],
    square: ["M5 5h14v14H5z"],
    plus: ["M5 12h14", "M12 5v14"],
    trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
    upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
    download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
    play: ["m6 3 14 9-14 9V3z"],
    x: ["M18 6 6 18", "m6 6 12 12"],
    "arrow-up": ["m5 12 7-7 7 7", "M12 19V5"],
    "arrow-down": ["M12 5v14", "m19 12-7 7-7-7"],
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
    "notebook-pen": ["M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4", "M2 6h4", "M2 10h4", "M2 14h4", "M2 18h4", "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"],
    grip: ["M9 5h.01", "M9 12h.01", "M9 19h.01", "M15 5h.01", "M15 12h.01", "M15 19h.01"],
    more: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
    "square-pen": ["M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"],
    copy: ["M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
    bug: ["m8 2 1.88 1.88", "M14.12 3.88 16 2", "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1", "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6", "M12 20v-9", "M6.53 9C4.6 8.8 3 7.1 3 5", "M6 13H2", "M3 21c0-2.1 1.7-3.9 3.8-4", "M20.97 5c0 2.1-1.6 3.8-3.5 4", "M22 13h-4", "M17.2 17c2.1.1 3.8 1.9 3.8 4"],
    "step-over": ["M3 12a9 9 0 0 1 15-6.7L21 8", "M21 3v5h-5", "M12 17h.01"],
    "step-into": ["M12 3v12", "m7 10 5 5 5-5", "M12 20h.01"],
    "step-out": ["M12 21V9", "m7 14 5-5 5 5", "M12 4h.01"],
    clipboard: ["M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"],
    eye: ["M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"],
    "square-sparkles": ["M11 15H7", "M15.41 2.49a.6.6 0 0 1 1.18 0l.63 3.334a1.2 1.2 0 0 0 .956.955l3.334.631a.6.6 0 0 1 0 1.18l-3.334.63a1.2 1.2 0 0 0-.955.956l-.631 3.334a.6.6 0 0 1-1.18 0l-.63-3.334a1.2 1.2 0 0 0-.956-.955L10.49 8.59a.6.6 0 0 1 0-1.18l3.334-.63a1.2 1.2 0 0 0 .955-.956z", "M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6", "M9 13v4"],
    "moon-star": ["M18 5h4", "M20 3v4", "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"],
    "layout-dashboard": ["M4 3h5a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1Z", "M15 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1Z", "M15 12h5a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1Z", "M4 16h5a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1Z"],
    "images": ["M18 22H4a2 2 0 0 1-2-2V6", "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18", "M10 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", "M8 2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2Z"],
    "square-check-big": ["M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344", "m9 11 3 3L22 4"],
    "layout-grid": ["M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z", "M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z", "M15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z", "M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z"],
    "list": ["M3 12h.01", "M3 18h.01", "M3 6h.01", "M8 12h13", "M8 18h13", "M8 6h13"],
    "palette": ["M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z", "M13 6.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0", "M17 10.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0", "M6 12.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0", "M8 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0"],
    "magnet": ["m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15", "m5 8 4 4", "m12 15 4 4"],
    "message-square": ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
    "maximize-2": ["M15 3h6v6", "m21 3-7 7", "m3 21 7-7", "M9 21H3v-6"],
    "minus": ["M5 12h14"],
    "columns-3": ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z", "M9 3v18", "M15 3v18"],
    search: ["m21 21-4.34-4.34", "M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0"],
    "scan": ["M3 7V5a2 2 0 0 1 2-2h2", "M17 3h2a2 2 0 0 1 2 2v2", "M21 17v2a2 2 0 0 1-2 2h-2", "M7 21H5a2 2 0 0 1-2-2v-2"]
  };
  function withIcons(bar, names) {
    bar.querySelectorAll("button").forEach((b, i) => {
      const name = names[i];
      if (name) b.replaceChildren(icon(name));
    });
    return bar;
  }
  function icon(name) {
    const ns = "http://www.w3.org/2000/svg";
    const svg2 = document.createElementNS(ns, "svg");
    svg2.setAttribute("viewBox", "0 0 24 24");
    svg2.setAttribute("fill", "none");
    svg2.setAttribute("stroke", "currentColor");
    svg2.setAttribute("stroke-width", "2");
    svg2.setAttribute("stroke-linecap", "round");
    svg2.setAttribute("stroke-linejoin", "round");
    svg2.setAttribute("aria-hidden", "true");
    svg2.classList.add("lucide", `lucide-${name}`);
    for (const d of ICONS[name] ?? []) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg2.append(path);
    }
    return svg2;
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
    /** `blocked`: whether what set this off started while a QR was blocking; by default, whether one is now. */
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
    if (state.dock) state.dock = state.dock.filter((e) => !(e.kind === "set" && e.setId === setId));
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
    const picked2 = new Set(wanted);
    let next = 0;
    state.sets = state.sets.map((s) => picked2.has(s) ? wanted[next++] : s);
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

  // src/util.ts
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  var escapeRegex = (text7) => RegExp.escape?.(text7) ?? text7.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(text7) {
    return text7.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
  }
  function oneLine(text7, max = 80) {
    const one = text7.replace(/\s+/g, " ").trim();
    return one.length > max ? `${one.slice(0, max - 1)}…` : one;
  }
  var ID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
  function newId(prefix) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return `${prefix}_${Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("")}`;
  }

  // src/auto-run.ts
  function startAutoRun(deps) {
    const { scope, chat } = deps;
    const auto = new AutoExecutor(deps.run);
    const fire = (trigger, blocked) => auto.fire(autoTargets(activeSets(deps.state(), scope.current), trigger), blocked);
    const newChats = /* @__PURE__ */ new Map();
    const startedBlocked = /* @__PURE__ */ new WeakMap();
    let lastBlocked = false;
    const onGenerationComplete = () => void fire("ai", lastBlocked);
    window.addEventListener("marinara:generation-complete", onGenerationComplete);
    const untilListed = async (id) => {
      if (typeof id !== "string") return;
      for (let i = 0; i < 20; i++) {
        chat.markStale();
        const list = await chat.messages().catch(() => []);
        if (list.some((m2) => m2.id === id)) return;
        await sleep(250);
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
          if (found.length) void auto.fire(automationTargets(activeSets(deps.state(), scope.current), found), blocked);
        }
      },
      onChatCreated: ({ id }) => newChats.set(id, auto.blocked)
    });
    let unsubscribeScope = () => {
    };
    void (async () => {
      await scope.start();
      deps.onScope(scope.current);
      unsubscribeScope = scope.onChange((now) => {
        deps.onScope(scope.current);
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
    return () => {
      unsubscribeScope();
      scope.stop();
      stopWatching();
      window.removeEventListener("marinara:generation-complete", onGenerationComplete);
    };
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

  // src/shared/i18n.ts
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
    if (!name) throw new Error(t("Variable name cannot be empty.", "변수 이름이 비어 있어요."));
    if (index !== void 0 && index !== "") {
      let container;
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
      return Number.isInteger(n) && n > 0 ? rollDice(`1d${n}`) : 0;
    }
    const count = Math.min(Number(m2[1] || 1), 1e3);
    const sides = Number(m2[2]);
    let total = Number(m2[3] || 0);
    for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * Math.max(1, sides));
    return total;
  }

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
    /** Is the unescaped symbol at the cursor? An escaped one at offset 0 gets its backslash skipped, so take() reads it literally. */
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
      if (this.atEnd) throw new ParseError(t(`Unclosed closure ({: without :})`, `닫히지 않은 클로저예요 ({: 뒤에 :}가 없어요)`), this.index);
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
        if (this.atEnd) throw new ParseError(t("Unclosed block comment (/* without *|)", "닫히지 않은 블록 주석이에요 (/* 뒤에 *|가 없어요)"), this.index);
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
      if (!this.commandEnd()) throw new ParseError(t(`Unexpected text after /:${target}`, `/:${target} 뒤에 예상하지 못한 글자가 있어요`), this.index);
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
      if (!this.commandEnd()) throw new ParseError(t(`Unexpected end of command /${name}`, `/${name} 명령어가 예상하지 못하게 끝났어요`), this.index);
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
          else throw new ParseError(t("Unexpected end of unnamed argument", "이름 없는 인수가 예상하지 못하게 끝났어요"), this.index);
          this.skipWhitespace();
        } else {
          value += this.take();
        }
      }
      if (!isList) return [{ value: value.trim(), quoted: false }];
      if (value.length > 0) list.push({ value, quoted: false });
      return finishList(list, wasSplit ? splitCount : void 0);
    }
    parseQuoted() {
      this.take();
      let value = "";
      for (; ; ) {
        if (this.atEnd) throw new ParseError(t("Unclosed quoted value", "닫히지 않은 따옴표 값이에요"), this.index);
        if (this.test('"')) break;
        if (!this.flags.STRICT_ESCAPING && this.commandEnd()) {
          throw new ParseError(t('Unexpected "|" inside a quoted value (escape it as \\|)', '따옴표 값 안에 "|"가 있어요 (\\|로 써 주세요)'), this.index);
        }
        value += this.take();
      }
      this.take();
      return value;
    }
    parseList() {
      let value = this.take();
      for (; ; ) {
        if (this.atEnd) throw new ParseError(t("Unclosed list value ([ without ])", "닫히지 않은 목록 값이에요 ([ 뒤에 ]가 없어요)"), this.index);
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
  function finishList(list, splitCount) {
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
    if (splitCount && splitCount + 1 < list.length) {
      let joined = "";
      for (const part of list.slice(splitCount)) {
        joined += part.quoted ? `"${String(part.value)}"` : String(part.value);
      }
      list.splice(splitCount, list.length - splitCount, { value: joined, quoted: false });
    }
    return list;
  }
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
      if (this.vars.has(name)) throw new ScriptError(t(`Variable "${name}" is already declared in this scope`, `"${name}" 변수는 이 범위에서 이미 선언됐어요`));
      this.vars.set(name, value);
    }
    set(name, value, index) {
      const owner = this.owner(name);
      if (!owner) throw new ScriptError(t(`No such scoped variable: "${name}" (declare it with /let first)`, `"${name}"(이)라는 범위 변수가 없어요 (먼저 /let으로 선언해 주세요)`));
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
      if (!owner) throw new ScriptError(t(`No such scoped variable: "${name}"`, `"${name}"(이)라는 범위 변수가 없어요`));
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
    /** Stops the run and the QRs it runs with /qr. */
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
    parse(text7, flags) {
      return parse(text7, { flags, lookup: (name) => this.registry.get(name) });
    }
    /** Run a whole script. Never throws for /abort; returns aborted instead. */
    async runScript(text7, scope) {
      let closure;
      try {
        closure = this.parse(text7);
      } catch (e) {
        if (e instanceof ParseError) throw new ScriptError(t(`Parse error at ${e.index}: ${e.message}`, `문법 오류 (${e.index}번째 글자): ${e.message}`));
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
    /** `frame` is shared with the caller for inline bodies so /break reaches the enclosing loop. */
    async runClosure(cv, provided = [], frame = { broken: false }, useScope) {
      if (++this.depth > this.maxDepth) {
        this.depth--;
        throw new ScriptError(t("Too much recursion (closure nesting exceeded the limit)", "재귀가 너무 깊어요 (클로저 중첩 한도를 넘었어요)"));
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
      if (!def) throw new ScriptError(t(`Unknown command /${ex.name}`, `알 수 없는 명령어예요: /${ex.name}`));
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
      if (!source) throw new ScriptError(t(`No Quick Reply or closure named "${name}"`, `"${name}"(이)라는 QR이나 클로저가 없어요`));
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
  function defaultFlags() {
    return { STRICT_ESCAPING: false, REPLACE_GETVAR: false };
  }
  function asText(v) {
    if (v === void 0) return "";
    if (Array.isArray(v)) return v.map((x) => asText(x)).join(" ");
    return isClosureValue(v) ? "[closure]" : v;
  }

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
      if (!m2) throw new ScriptError(t(`Invalid message range "${piece}"`, `올바르지 않은 메시지 범위예요: "${piece}"`));
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
        if (!labels || labels.length === 0) throw new ScriptError(t('/buttons needs labels=["a","b"]', '/buttons에는 labels=["a","b"]가 필요해요'));
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
      help: "Generate with the chat's context (nothing is posted); memory=on adds the chat's lorebooks and summary. Result goes to the pipe.",
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
            characterName: str(c, "name"),
            ...flag(c, "memory") ? { memory: true } : {}
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
        if (!name) throw new ScriptError(t("/ask needs name=", "/ask에는 name=이 필요해요"));
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
      unlisted: true,
      help: "Post a message as a character: /sendas name={{char}} text",
      origin: "st",
      run: async (c) => {
        const name = str(c, "name");
        if (!name) throw new ScriptError(t("/sendas needs name=", "/sendas에는 name=이 필요해요"));
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
        const picked2 = all.filter(
          (m2) => (!wanted || wanted.has(m2.number)) && (includeHidden || !m2.hidden) && (!role || (role === "char" ? m2.role === "assistant" : role === "user" ? m2.role === "user" : m2.role === "system" || m2.role === "narrator"))
        );
        return picked2.map((m2) => names ? `${m2.name}: ${m2.content}` : m2.content).join("\n\n");
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
      unlisted: true,
      help: "Marinara: same as /guided. (In QRs counting from #0: same as /sys.)",
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
      help: "Open a chat with a random character (optionally only characters with a tag). Returns the name.",
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.chat.openRandomCharacter) throw new ScriptError(t("/randomchar is not available here", "/randomchar는 여기서 쓸 수 없어요"));
        return c.rt.host.chat.openRandomCharacter(text(c).trim() || void 0);
      }
    },
    {
      name: "random",
      aliases: ["event"],
      help: "Marinara: ask the AI for a surprise event. (In QRs counting from #0: /randomchar.)",
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
    if (a === void 0) throw new ScriptError(t("Left operand (left=) is missing", "왼쪽 값(left=)이 없어요"));
    if (b === void 0) {
      if (rule !== void 0 && rule !== "not") throw new ScriptError(t(`Rule "${rule}" needs a right operand (right=)`, `"${rule}" 규칙에는 오른쪽 값(right=)이 필요해요`));
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
          throw new ScriptError(t(`Unknown rule "${r}" for numbers (use gt, gte, lt, lte, eq, neq)`, `숫자에 쓸 수 없는 규칙이에요: "${r}" (gt, gte, lt, lte, eq, neq 중 하나를 써 주세요)`));
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
        throw new ScriptError(t(`Unknown rule "${r}" for text (use eq, neq, in, nin)`, `글자에 쓸 수 없는 규칙이에요: "${r}" (eq, neq, in, nin 중 하나를 써 주세요)`));
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
    if (!key2) throw new ScriptError(t("Missing key= for the variable name", "변수 이름(key=)이 없어요"));
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
    if (!key2) throw new ScriptError(t("Missing key= for the variable name", "변수 이름(key=)이 없어요"));
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
        if (!name) throw new ScriptError(t("/let needs a variable name", "/let에는 변수 이름이 필요해요"));
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
        await sleep(ms);
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
        if (isClosureValue(c.unnamed)) throw new ScriptError(t("/flushvar needs a variable name", "/flushvar에는 변수 이름이 필요해요"));
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
        let list;
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
      throw new ScriptError(t(`Invalid regular expression: ${input}`, `올바르지 않은 정규식이에요: ${input}`));
    }
  }
  function jsonFrom(c, raw) {
    const source = c.rt.host.local.has(raw) ? c.rt.host.local.get(raw) : c.rt.host.global.has(raw) ? c.rt.host.global.get(raw) : raw;
    try {
      return JSON.parse(source);
    } catch {
      throw new ScriptError(t(`Not valid JSON: ${source.slice(0, 60)}`, `올바른 JSON이 아니에요: ${source.slice(0, 60)}`));
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
        if (!pattern) throw new ScriptError(t("/replace needs pattern=", "/replace에는 pattern=이 필요해요"));
        const replacer = str3(c, "replacer") ?? "";
        const mode = str3(c, "mode") ?? "literal";
        if (mode === "literal") return text3(c).split(pattern).join(replacer);
        if (mode === "regex") return text3(c).replace(regexFromString(pattern), replacer);
        throw new ScriptError(t(`/replace mode must be literal or regex, not "${mode}"`, `/replace mode=는 literal이나 regex여야 해요 ("${mode}"는 안 돼요)`));
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
        if (!pattern) throw new ScriptError(t("/match needs pattern=", "/match에는 pattern=이 필요해요"));
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
        if (!pattern) throw new ScriptError(t("/test needs pattern=", "/test에는 pattern=이 필요해요"));
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
        throw new ScriptError(t("/sort needs a JSON list or dictionary", "/sort에는 JSON 목록이나 딕셔너리가 필요해요"));
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
        if (!Array.isArray(value)) throw new ScriptError(t("/join needs a JSON list", "/join에는 JSON 목록이 필요해요"));
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
        if (!value || typeof value !== "object") throw new ScriptError(t("/json-keys needs a JSON object or list", "/json-keys에는 JSON 객체나 목록이 필요해요"));
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
        if (Number.isNaN(base.getTime())) throw new ScriptError(t(`Invalid date: ${str3(c, "from")}`, `올바르지 않은 날짜예요: ${str3(c, "from")}`));
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
        if (!of) throw new ScriptError(t("/count needs of=", "/count에는 of=가 필요해요"));
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
    if (!raw) throw new ScriptError(t('/form needs fields= (e.g. fields="name,age" or a JSON list)', '/form에는 fields=가 필요해요 (예: fields="name,age" 또는 JSON 목록)'));
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
        if (!c.rt.host.ui.form) throw new ScriptError(t("/form is not available here", "/form은 여기서 쓸 수 없어요"));
        const result = await c.rt.host.ui.form(text4(c), fieldsFrom(c, str4(c, "fields")));
        return result ? JSON.stringify(result) : "";
      }
    },
    {
      name: "pick",
      help: 'Searchable list: /pick items=["a","b"] [multiple=on] question → chosen item ("" when cancelled; JSON list with multiple)',
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.ui.pick) throw new ScriptError(t("/pick is not available here", "/pick은 여기서 쓸 수 없어요"));
        const items = listFrom(c, str4(c, "items") ?? str4(c, "labels"));
        if (!items.length) throw new ScriptError(t("/pick needs items= (a JSON list, a variable name or comma-separated words)", "/pick에는 items=가 필요해요 (JSON 목록, 변수 이름, 쉼표로 나눈 낱말)"));
        const multiple = isTrue(str4(c, "multiple") ?? "off");
        const picked2 = await c.rt.host.ui.pick(text4(c), items, { multiple, placeholder: str4(c, "placeholder") });
        return multiple ? JSON.stringify(picked2) : picked2[0] ?? "";
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
        if (!c.rt.host.ui.copy) throw new ScriptError(t("Clipboard is not available here", "여기서는 클립보드를 쓸 수 없어요"));
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
        if (!c.rt.host.ui.paste) throw new ScriptError(t("Clipboard is not available here", "여기서는 클립보드를 쓸 수 없어요"));
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

  // src/qr/script-text.ts
  function escapeScriptText(text7) {
    return text7.replace(/[|\\]/g, (c) => `\\${c}`).replace(/\{:/g, "\\{:").replace(/:\}/g, "\\:}");
  }

  // src/qr/steps.ts
  var STEP_NAME = /^[\p{L}_][\p{L}\p{N}_]*$/u;
  function newStepQr() {
    return { steps: [], prompt: "", frame: "system", send: "result", as: "{{char}}" };
  }
  var str5 = (v) => typeof v === "string" ? v : "";
  function normalizeStepQr(raw) {
    if (!raw || typeof raw !== "object") return void 0;
    const r = raw;
    const steps = (Array.isArray(r.steps) ? r.steps : []).flatMap((s) => {
      if (!s || typeof s !== "object") return [];
      const x = s;
      const name = str5(x.name).trim();
      const options = (Array.isArray(x.options) ? x.options : []).map((o) => typeof o === "string" ? { label: o } : { label: str5(o?.label), ...str5(o?.prompt) ? { prompt: str5(o.prompt) } : {} });
      const c = x.custom;
      return [
        {
          name,
          kind: x.kind === "input" ? "input" : "choice",
          question: str5(x.question),
          options,
          ...c && typeof c === "object" ? { custom: { label: str5(c.label), question: str5(c.question) } } : {},
          ...x.perOption === true ? { perOption: true } : {}
        }
      ];
    });
    return {
      steps,
      prompt: str5(r.prompt),
      frame: r.frame === "ooc" || r.frame === "none" ? r.frame : "system",
      send: r.send === "user" || r.send === "input" ? r.send : "result",
      as: str5(r.as) || "{{char}}",
      ...str5(r.cancelText) ? { cancelText: str5(r.cancelText) } : {},
      ...str5(r.doneText) ? { doneText: str5(r.doneText) } : {},
      ...r.clean === false ? { clean: false } : {},
      ...Array.isArray(r.keep) ? { keep: r.keep.filter((k) => typeof k === "string") } : {}
    };
  }
  function stepProblems(q) {
    const out = [];
    const names = /* @__PURE__ */ new Set();
    for (const s of q.steps) {
      if (!STEP_NAME.test(s.name)) out.push(`name:${s.name}`);
      else if (names.has(s.name)) out.push(`duplicate:${s.name}`);
      names.add(s.name);
      if (s.kind === "choice" && !s.options.some((o) => o.label.trim()) && !s.custom?.label.trim()) out.push(`options:${s.name}`);
    }
    if (q.steps.filter((s) => s.kind === "choice" && s.perOption).length > 1) out.push("perOption");
    if (!q.prompt.trim() && !q.steps.some((s) => s.kind === "choice" && s.perOption)) out.push("prompt");
    return out;
  }
  var quote = (text7) => JSON.stringify(text7);
  var get = (name) => `{{getvar::${name}}}`;
  function fill(text7, names, branch) {
    return text7.replace(/\{\{([\p{L}\p{N}_]+)(:prompt)?\}\}/gu, (whole, name, wantsPrompt) => {
      if (!names.has(name)) return whole;
      if (wantsPrompt) return branch && branch.name === name ? branch.prompt : whole;
      return get(name);
    });
  }
  function framed(text7, frame) {
    if (frame === "system") return `<System>
${text7}
</System>`;
    if (frame === "ooc") return `*{OOC: ${text7}}*`;
    return text7;
  }
  function stepsScript(q) {
    if (stepProblems(q).length) return `/echo severity=warning ${escapeScriptText(t("This step QR isn't finished: see its editor.", "아직 덜 만든 단계 QR이에요. 편집 창을 확인해 주세요."))}`;
    const names = new Set(q.steps.map((s) => s.name));
    const made = [];
    const keep = new Set(q.keep ?? []);
    const lines = [];
    const flush = (list) => (q.clean === false ? [] : list).filter((n) => !keep.has(n)).map((n) => `/flushvar ${n}`);
    const cancel = () => [...q.cancelText?.trim() ? [`/echo ${escapeScriptText(q.cancelText.trim())}`] : [], ...flush(made), "/abort"].join(" | ");
    for (const s of q.steps) {
      made.push(s.name);
      const ifEmpty = () => `/if left=${get(s.name)} right="" rule=eq {: ${cancel()} :} |`;
      if (s.kind === "input") {
        lines.push(`/input ${escapeScriptText(fill(s.question || s.name, names))} |`, `/setvar key=${s.name} {{pipe}} |`, ifEmpty());
        continue;
      }
      const options = s.options.filter((o) => o.label.trim());
      const custom = s.custom?.label.trim() ? s.custom : void 0;
      const labels = [...options.map((o) => o.label), ...custom ? [custom.label] : []];
      lines.push(`/buttons labels=${JSON.stringify(labels)} ${escapeScriptText(fill(s.question || s.name, names))} |`, `/setvar key=${s.name} {{pipe}} |`, ifEmpty());
      if (custom) {
        const typed = `${s.name}_typed`;
        if (s.perOption) made.push(typed);
        lines.push(
          `/if left=${get(s.name)} right=${quote(custom.label)} rule=eq {: /input ${escapeScriptText(fill(custom.question || custom.label, names))} | /setvar key=${s.name} {{pipe}}${s.perOption ? ` | /setvar key=${typed} 1` : ""} :} |`,
          ifEmpty()
        );
      }
    }
    const send = (prompt) => {
      const text7 = escapeScriptText(framed(prompt, q.frame));
      if (q.send === "input") return `/setinput ${text7}`;
      if (q.send === "user") return `/send ${text7} | /trigger`;
      const as = fill(q.as.trim() || "{{char}}", names);
      return `/gen lock=on ${text7} | /sendas name=${quote(as)}`;
    };
    const branch = q.steps.find((s) => s.kind === "choice" && s.perOption);
    if (branch) {
      const template = q.prompt.trim() ? q.prompt : `{{${branch.name}:prompt}}`;
      for (const o of branch.options.filter((o2) => o2.label.trim())) {
        lines.push(`/if left=${get(branch.name)} right=${quote(o.label)} rule=eq {: ${send(fill(template, names, { name: branch.name, prompt: fill(o.prompt ?? "", names) }))} :} |`);
      }
      if (branch.custom?.label.trim()) lines.push(`/if left=${get(`${branch.name}_typed`)} right="1" rule=eq {: ${send(fill(template, names, { name: branch.name, prompt: get(branch.name) }))} :} |`);
    } else {
      lines.push(`${send(fill(q.prompt, names))} |`);
    }
    if (q.doneText?.trim()) lines.push(`/echo ${escapeScriptText(q.doneText.trim())} |`);
    lines.push(...flush(made).map((l) => `${l} |`));
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \|$/, "");
    return lines.join("\n");
  }

  // src/qr/model.ts
  var AUTO_TRIGGERS = [
    { key: "startup", st: "executeOnStartup", info: "startup", arg: "startup" },
    { key: "user", st: "executeOnUser", info: "user", arg: "user" },
    { key: "ai", st: "executeOnAi", info: "bot", arg: "bot" },
    { key: "chatChange", st: "executeOnChatChange", info: "load", arg: "load" },
    { key: "newChat", st: "executeOnNewChat", info: "newChat", arg: "new" },
    { key: "groupDraft", st: "executeOnGroupMemberDraft", info: "group", arg: "group" },
    { key: "beforeGeneration", st: "executeBeforeGeneration", info: "generation", arg: "generation" }
  ];
  var DOCK_SPAN = { x: { min: 8, max: 16, default: 16 }, y: { min: 1, max: 4, default: 2 } };
  var emptyState = () => ({ version: 1, sets: [], dockVisible: false, dock: [], chatSets: {}, charSets: {} });
  function newSet(name, origin = "dispensa") {
    return { id: newId("set"), name, items: [], display: "folder", enabled: true, origin };
  }
  function newItem(label, script, dialect = "marinara") {
    return { id: newId("qr"), label, script, dialect };
  }
  function normalizeState(raw) {
    const base = emptyState();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    return {
      version: 1,
      dockVisible: r.dockVisible === true,
      dock: Array.isArray(r.dock) ? dockEntries(r.dock) : [],
      chatSets: idLists(r.chatSets),
      charSets: idLists(r.charSets),
      ...dockOptions(r),
      sets: Array.isArray(r.sets) ? r.sets.map((s) => ({
        ...newSet(String(s?.name ?? t("Set", "세트"))),
        ...s,
        items: Array.isArray(s?.items) ? s.items.map((i) => withSteps({ ...newItem(String(i?.label ?? "QR"), String(i?.script ?? "")), ...i })) : []
      })) : []
    };
  }
  function withSteps(item) {
    if (item.steps === void 0) return item;
    const steps = normalizeStepQr(item.steps);
    if (!steps) {
      delete item.steps;
      return item;
    }
    return { ...item, steps, script: stepsScript(steps), dialect: "marinara" };
  }
  function dockOptions(r) {
    const out = {};
    if (typeof r.dockSearch === "boolean") out.dockSearch = r.dockSearch;
    const flow = r.dockFlow === "x" || r.dockFlow === "y" ? r.dockFlow : void 0;
    if (flow) out.dockFlow = flow;
    if (flow && typeof r.dockSpan === "number" && Number.isFinite(r.dockSpan)) {
      const { min, max } = DOCK_SPAN[flow];
      out.dockSpan = Math.max(min, Math.min(max, Math.round(r.dockSpan)));
    }
    return out;
  }
  function dockEntries(raw) {
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
  function builtinSet(state, kind) {
    return state.sets.find((s) => s.builtin === kind);
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

  // src/stscript/commands/qr.ts
  var text5 = (c) => asText(c.unnamed).trim();
  var str6 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var bool = (c, key2) => {
    const v = str6(c, key2);
    if (v === void 0 || v === "") return void 0;
    return isTrue(v) ? true : isFalse(v) ? false : void 0;
  };
  function qr(c) {
    if (!c.rt.host.qr) throw new ScriptError(t("Quick Reply commands only work inside Dispensa", "QR 명령어는 Dispensa 안에서만 쓸 수 있어요"));
    return c.rt.host.qr;
  }
  function infoChanges(c) {
    const changes = {};
    const title = str6(c, "title");
    if (title !== void 0) changes.title = title;
    const icon2 = str6(c, "icon");
    if (icon2 !== void 0) changes.icon = icon2;
    for (const [arg, key2] of [["hidden", "hidden"], ...AUTO_TRIGGERS.map(({ arg: arg2, info }) => [arg2, info]), ["showlabel", "showLabel"]]) {
      const b = bool(c, arg);
      if (b !== void 0) changes[key2] = b;
    }
    return changes;
  }
  function ref(c, labelFromText = false) {
    const set = str6(c, "set");
    if (!set) throw new ScriptError(t(`/${c.node.name} needs set=`, `/${c.node.name}에는 set=이 필요해요`));
    const id = str6(c, "id");
    if (id !== void 0 && id !== "") {
      const n = Number(id);
      if (!Number.isInteger(n) || n < 1) throw new ScriptError(t(`id= must be a number from 1 (got "${id}")`, `id=는 1 이상의 숫자여야 해요 (받은 값: "${id}")`));
      return { set, id: n };
    }
    const label = str6(c, "label") ?? (labelFromText ? text5(c) : void 0);
    if (!label) throw new ScriptError(t(`/${c.node.name} needs label= or id=`, `/${c.node.name}에는 label=이나 id=가 필요해요`));
    return { set, label };
  }
  function chatToggle(state) {
    return (c) => {
      const name = text5(c);
      if (!name) throw new ScriptError(t("Set name is missing", "세트 이름이 없어요"));
      return String(qr(c).setForChat(name, state));
    };
  }
  function setToggle(state) {
    return (c) => {
      const name = text5(c);
      if (!name) throw new ScriptError(t("Set name is missing", "세트 이름이 없어요"));
      return String(qr(c).setEnabled(name, state));
    };
  }
  function setOptions(c) {
    return { nosend: bool(c, "nosend"), before: bool(c, "before"), inject: bool(c, "inject"), color: str6(c, "color"), onlyBorder: bool(c, "onlyborder") };
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
    if (!m2) throw new ScriptError(t(`Invalid delay "${raw}" (e.g. 30s, 5m, 1h)`, `올바르지 않은 지연 시간이에요: "${raw}" (예: 30s, 5m, 1h)`));
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
        if (!item) throw new ScriptError(t(`No Dock QR at index ${text5(c)}`, `${text5(c)}번 자리에 Dock QR이 없어요`));
        await qr(c).run(`${item.set}.${item.label}`, c.rt.signal);
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
        const set = str6(c, "set") ?? text5(c);
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
        const set = str6(c, "set");
        const label = str6(c, "label");
        if (!set || !label) throw new ScriptError(t("/qr-create needs set= and label=", "/qr-create에는 set=과 label=이 필요해요"));
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
        const newLabel = str6(c, "newlabel");
        if (newLabel) changes.newLabel = newLabel;
        if (c.hasUnnamed && asText(c.unnamed) !== "") changes.message = asText(c.unnamed);
        if (!qr(c).update(target, changes)) throw new ScriptError(t(`No such QR in set "${target.set}"`, `"${target.set}" 세트에 그런 QR이 없어요`));
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
        if (!name) throw new ScriptError(t("/qr-contextadd needs the sub menu's set name", "/qr-contextadd에는 하위 메뉴의 세트 이름이 필요해요"));
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
        if (!key2) throw new ScriptError(t("/qr-arg needs a name", "/qr-arg에는 이름이 필요해요"));
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
        const from = str6(c, "from");
        if (!from) throw new ScriptError(t("/import requires from= to be set.", "/import에는 from=이 필요해요."));
        const names = c.unnamed.map((v) => asText(v)).filter(Boolean);
        if (!names.length) throw new ScriptError(t("/import requires the names to import.", "/import에는 가져올 이름이 필요해요."));
        const source = qr(c).source(from);
        if (!source) throw new ScriptError(t(`No Quick Reply found for "${from}".`, `"${from}"에 맞는 QR이 없어요.`));
        const closures = keptClosures(c.rt.parse(source.script));
        for (let i = 0; i < names.length; i++) {
          const src = names[i];
          let dst = src;
          if (i + 2 < names.length && names[i + 1] === "as") {
            dst = names[i + 2];
            i += 2;
          }
          const closure = closures.get(src);
          if (!closure) throw new ScriptError(t(`No scoped closure named "${src}" found in "${from}"`, `"${from}"에 "${src}"(이)라는 범위 클로저가 없어요`));
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
        if (!name) throw new ScriptError(t("Set name is missing", "세트 이름이 없어요"));
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
        if (!qr(c).updateSet(text5(c), setOptions(c))) throw new ScriptError(t(`No QR set "${text5(c)}"`, `"${text5(c)}" QR 세트가 없어요`));
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
      help: "Show, hide or toggle the Dock: /dock show|hide|toggle → true when shown",
      origin: "dispensa",
      run: (c) => {
        const arg = text5(c).toLowerCase();
        const state = arg === "show" || arg === "on" ? true : arg === "hide" || arg === "off" ? false : void 0;
        return String(qr(c).dockVisible(state));
      }
    },
    {
      name: "dock-layout",
      help: "Lay a set on the Dock as one folder bubble or a row of bubbles: /dock-layout mode=folder|row name",
      origin: "dispensa",
      run: (c) => {
        const mode = str6(c, "mode") === "row" ? "inline" : "folder";
        if (!qr(c).setDisplay(text5(c), mode)) throw new ScriptError(t(`No QR set "${text5(c)}"`, `"${text5(c)}" QR 세트가 없어요`));
        return "";
      }
    },
    {
      name: "qr-later",
      help: "Run a QR after a delay: /qr-later delay=5m Set.Label (until the page is reloaded)",
      origin: "dispensa",
      run: (c) => {
        const name = text5(c);
        if (!name) throw new ScriptError(t("/qr-later needs a QR name (Label or Set.Label)", "/qr-later에는 QR 이름이 필요해요 (Label 또는 Set.Label)"));
        const ms = parseDelay(str6(c, "delay") ?? "60s");
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
    if (!f) throw new Error(t(`Unknown lorebook field "${stField}"`, `알 수 없는 로어북 필드예요: "${stField}"`));
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
      if (Number.isNaN(n)) throw new Error(t(`Field "${stField}" needs a number`, `"${stField}" 필드에는 숫자가 필요해요`));
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

  // src/shared/tracker.ts
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
  var str7 = (c, key2) => {
    const v = c.named[key2];
    return v === void 0 ? void 0 : asText(v);
  };
  var parts2 = (c) => Array.isArray(c.unnamed) ? c.unnamed : c.unnamed === "" ? [] : [c.unnamed];
  function m(c) {
    if (!c.rt.host.marinara) throw new ScriptError(t("This command only works inside Marinara", "이 명령어는 마리나라 안에서만 쓸 수 있어요"));
    return c.rt.host.marinara;
  }
  function varOr(c, raw) {
    if (raw === void 0) return "";
    return c.rt.host.local.get(raw) ?? c.rt.host.global.get(raw) ?? raw;
  }
  async function book(c) {
    const file = varOr(c, str7(c, "file"));
    const found = file ? await m(c).findBook(file) : await m(c).chatBook(false);
    if (!found) throw new ScriptError(file ? t(`No lorebook named "${file}"`, `"${file}"(이)라는 로어북이 없어요`) : t("This chat has no lorebook yet (use /getchatbook)", "이 채팅에는 아직 로어북이 없어요 (/getchatbook을 써 보세요)"));
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
      help: "Read the Tracker Panel: /tracker-get custom.<field> | char.<name>.<stat> | persona.<stat> | weather (no path → everything as JSON)",
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
      help: "Change the Tracker Panel: /tracker-set [max=100] [color=#f66] [stat=on] path value",
      origin: "dispensa",
      run: async (c) => {
        const list = parts2(c);
        const path = asText(list[0] ?? "");
        const value = list.slice(1).map((v) => asText(v)).join(" ");
        if (!path) throw new ScriptError(t("/tracker-set needs a path and a value", "/tracker-set에는 경로와 값이 필요해요"));
        const opts = { color: str7(c, "color"), asStat: isTrue(str7(c, "stat") ?? "off") };
        if (str7(c, "max") !== void 0) opts.max = Number(str7(c, "max"));
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
      help: "Add to a number in the Tracker Panel: /tracker-add path number (negative to subtract)",
      origin: "dispensa",
      run: async (c) => {
        const list = parts2(c);
        const path = asText(list[0] ?? "");
        const amount = Number(asText(list[1] ?? "1"));
        if (!path || Number.isNaN(amount)) throw new ScriptError(t("/tracker-add needs a path and a number", "/tracker-add에는 경로와 숫자가 필요해요"));
        const state = await m(c).getTracker() ?? {};
        try {
          const current = Number(getTrackerValue(state, path) || 0);
          const next = String((Number.isNaN(current) ? 0 : current) + amount);
          const opts = { color: str7(c, "color") };
          if (str7(c, "max") !== void 0) opts.max = Number(str7(c, "max"));
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
        return findEntry(await m(c).entries(b.id), str7(c, "field") ?? "key", text6(c))?.id ?? "";
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
          return readEntryField(entry, str7(c, "field") ?? "content");
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
        const id = varOr(c, str7(c, "uid"));
        if (!id) throw new ScriptError(t("/setentryfield needs uid=", "/setentryfield에는 uid=가 필요해요"));
        try {
          await m(c).patchEntry(b.id, id, entryPatch(str7(c, "field") ?? "content", asText(c.unnamed)));
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
        const keys = (str7(c, "key") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
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
        const ch = await m(c).character(str7(c, "char") ?? str7(c, "name"));
        if (!ch) return "";
        const field = str7(c, "field");
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
        const ch = await m(c).character(str7(c, "char"));
        if (!ch) throw new ScriptError(t("No character to update", "바꿀 캐릭터가 없어요"));
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
        const field = str7(c, "field");
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
        if (!hit) throw new ScriptError(t(`No connection named "${wanted}" (have: ${list.map((x) => x.name).join(", ")})`, `"${wanted}"(이)라는 연결이 없어요 (있는 연결: ${list.map((x) => x.name).join(", ")})`));
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
        if (str7(c, "format") === "json") return JSON.stringify(msgs);
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
        if (!text6(c)) throw new ScriptError(t("/renamechat needs a name", "/renamechat에는 이름이 필요해요"));
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
        if (!Number.isInteger(n) || n < 0) throw new ScriptError(t("/depth needs a whole number", "/depth에는 정수가 필요해요"));
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

  // src/stscript/commands/visz.ts
  var viszCommands = [
    {
      name: "visz",
      help: "🌟 Make a page from the text through the visualizer ([[…]] asks first): /visz [output=viewer|chat|gallery] [prompt=last] topic (prompt=last: the text is a message, made into a new scene) → true when sent",
      origin: "dispensa",
      run: async (c) => {
        if (!c.rt.host.visz) throw new ScriptError(t("/visz only works inside Dispensa", "/visz는 Dispensa 안에서만 쓸 수 있어요"));
        const text7 = asText(c.unnamed).trim();
        if (!text7) throw new ScriptError(t("/visz needs a topic", "/visz에는 주제가 필요해요"));
        const action = c.named.action === void 0 ? void 0 : asText(c.named.action);
        const output = c.named.output === void 0 ? void 0 : asText(c.named.output);
        if (action && action !== "viz" && action !== "ooc") throw new ScriptError(t('/visz action= is "viz" or "ooc"', '/visz action=은 "viz"나 "ooc"예요'));
        if (output && output !== "viewer" && output !== "chat" && output !== "gallery") throw new ScriptError(t('/visz output= is "viewer", "chat" or "gallery"', '/visz output=은 "viewer", "chat", "gallery" 중 하나예요'));
        const prompt = c.named.prompt === void 0 ? void 0 : asText(c.named.prompt);
        if (prompt && prompt !== "superviz" && prompt !== "last") throw new ScriptError(t('/visz prompt= is "superviz" or "last"', '/visz prompt=는 "superviz"나 "last"예요'));
        return String(await c.rt.host.visz.run(text7, { action, output, prompt }));
      }
    }
  ];

  // src/stscript/commands/memo.ts
  function memo(c) {
    if (!c.rt.host.memo) throw new ScriptError(t(`/${c.node.name} only works inside Dispensa`, `/${c.node.name}은(는) Dispensa 안에서만 쓸 수 있어요`));
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
        if (!text7) throw new ScriptError(t("/memo-add needs the text to keep", "/memo-add에는 남길 글이 필요해요"));
        return String(memo(c).add(text7));
      }
    },
    {
      name: "memo-list",
      help: "📝 The memos shown in this chat as a JSON list; only one place: /memo-list chat | character | global (or scope=…)",
      origin: "dispensa",
      run: (c) => {
        const places = ["chat", "character", "global"];
        const isPlace2 = (v) => places.includes(v);
        const named = c.named.scope === void 0 ? void 0 : asText(c.named.scope).trim().toLowerCase();
        if (named && !isPlace2(named)) throw new ScriptError(t("/memo-list scope= is chat, character or global", "/memo-list scope=는 chat, character, global 중 하나예요"));
        const word = asText(c.unnamed).trim().toLowerCase();
        const only = named && isPlace2(named) ? named : isPlace2(word) ? word : void 0;
        return JSON.stringify(memo(c).list(only));
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
    /** Removes the names and aliases that still point to this command. */
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
      return [...new Set(this.map.values())].filter((d) => !d.unlisted).sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  // src/stscript/external.ts
  function addExternalCommand(registry2, def) {
    const taken = (name) => {
      const there = registry2.get(name);
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
    registry2.register(command);
    return () => registry2.unregister(command);
  }

  // src/stscript/index.ts
  function createRegistry() {
    return new CommandRegistry().register(...coreCommands, ...chatCommands, ...textCommands, ...uiCommands, ...qrCommands, ...marinaraCommands, ...viszCommands, ...memoCommands);
  }

  // src/shared/dispensa-bridge.ts
  var DISPENSA_READY = "dispensa:ready";
  var DISPENSA_DOCK = "dispensa:dock";

  // src/bridge.ts
  function validDockGroup(group) {
    if (!group || typeof group !== "object") return null;
    const g = group;
    if (typeof g.name !== "string" || !Array.isArray(g.items)) return null;
    const text7 = (v) => typeof v === "string" ? v : void 0;
    const items = [];
    for (const raw of g.items) {
      const item = raw && typeof raw === "object" ? raw : null;
      if (!item || typeof item.label !== "string" || typeof item.run !== "function") continue;
      const run = item.run;
      items.push({ label: item.label, title: text7(item.title), group: text7(item.group), run: () => run() });
    }
    const remove = typeof g.remove === "function" ? g.remove : null;
    return { name: g.name, icon: text7(g.icon) ?? "", items, ...remove ? { remove: () => remove() } : {} };
  }
  function publishBridge(host, registry2, openSettings, setDockGroup, dockShown, importQrs) {
    const bridge = {
      version: 1,
      runSlash: async (text7) => {
        const rt = new Runtime({ host, registry: registry2, dialect: "st" });
        return asText((await rt.runScript(String(text7 ?? ""))).pipe);
      },
      registerCommand: (def) => addExternalCommand(registry2, def),
      openSettings,
      // anything that is not a group takes the bubble out
      setDockGroup: (id, group) => setDockGroup(String(id), validDockGroup(group)),
      dockShown,
      ...importQrs ? { importQrs: async (json2, name, options) => importQrs(json2, String(name ?? ""), typeof options?.characterId === "string" ? options.characterId : void 0) } : {}
    };
    window.__dispensa = bridge;
    window.dispatchEvent(new Event(DISPENSA_READY));
    return () => {
      if (window.__dispensa === bridge) delete window.__dispensa;
    };
  }

  // src/extension.ts
  var EXTENSION = { name: "Dispensa", id: "dispensa" };

  // src/shared/marinara-global.ts
  var resolved = null;
  function getMarinara() {
    if (resolved) return resolved;
    const scoped = typeof marinara !== "undefined" ? marinara : globalThis.marinara;
    if (scoped) {
      resolved = scoped;
      return scoped;
    }
    const KEY2 = `${EXTENSION.id}-dev-storage`;
    const read = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY2) ?? "{}");
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
          localStorage.setItem(KEY2, JSON.stringify(next));
          return next;
        }
      },
      onCleanup: () => {
      }
    };
  }

  // src/shared/api.ts
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
    const hasBody = options.body !== void 0;
    const headers = { Accept: "application/json" };
    if (method !== "GET") headers["x-marinara-csrf"] = "1";
    if (hasBody) headers["Content-Type"] = "application/json";
    const doFetch = getMarinara().fetch ?? fetch;
    const res = await doFetch(`/api${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : void 0,
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
    if (!res.ok) throw new ApiError(errorText(data) || `${res.status} ${res.statusText}`, res.status, data);
    return data;
  }
  function errorText(data) {
    if (!data || typeof data !== "object" || !("error" in data)) return "";
    const error = String(data.error);
    const details = data.details;
    if (!Array.isArray(details) || !details.length) return error;
    const why = details.slice(0, 3).map((d) => [d?.path, d?.message].filter((x) => typeof x === "string" && x).join(": ")).filter(Boolean);
    return why.length ? `${error}: ${why.join("; ")}` : error;
  }

  // src/shared/composer.ts
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
  async function submitThroughComposer(line, stillWanted = () => true) {
    if (!findComposer()) throw new Error(t("Could not find the chat input. Run this with a chat open.", "채팅 입력창을 찾지 못했어요. 채팅을 연 상태에서 실행해 주세요."));
    await waitUntil(() => !isGenerating(findComposer()), 12e4);
    if (!stillWanted()) throw new Error(t("Another chat was opened in the meantime, so nothing was sent.", "그사이 다른 채팅이 열려서 보내지 않았어요."));
    const composer = findComposer();
    if (!composer) throw new Error(t("Could not find the chat input. Run this with a chat open.", "채팅 입력창을 찾지 못했어요. 채팅을 연 상태에서 실행해 주세요."));
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

  // src/shared/react-bridge.ts
  var cached = null;
  function isQueryClient(v) {
    return !!v && typeof v === "object" && typeof v.invalidateQueries === "function" && typeof v.getQueryCache === "function";
  }
  function findQueryClient() {
    if (cached) return cached;
    const node = document.querySelector("#root *");
    const fiberKey = node && Object.keys(node).find((k) => k.startsWith("__reactFiber$"));
    for (let fiber = fiberKey ? node[fiberKey] : null; fiber; fiber = fiber.return ?? null) {
      const client = fiber.memoizedProps?.client;
      if (isQueryClient(client)) return cached = client;
    }
    return null;
  }
  function refreshChatQueries(chatId) {
    const client = findQueryClient();
    if (!client) return false;
    void client.invalidateQueries({ queryKey: ["chats", "messages", chatId] });
    void client.invalidateQueries({ queryKey: ["chats", "messageCount", chatId] });
    void client.invalidateQueries({ queryKey: ["chats", "detail", chatId] });
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
        const body = {
          chatId,
          // an unsaved last user turn, like SillyTavern's quiet prompt
          userMessage: o.prompt,
          streaming: false,
          forCharacterId: o.characterName ? this.findCharacterId(o.characterName) : void 0,
          connectionId: o.connectionId || void 0,
          ...o.presetId && o.preset !== false ? { presetId: o.presetId } : {},
          // without the preset, Marinara puts in only what is asked for: the lorebooks and the summary the preset would bring
          ...o.preset === false ? { skipPreset: true, injectLorebook: true, injectChatSummary: true } : o.memory ? { injectLorebook: true, injectChatSummary: true } : {}
        };
        if (o.maxTokens) {
          const long = await this.generateLong(body, o.connectionId, o.maxTokens, o.instruction ? o.prompt : null).catch(() => null);
          if (long !== null) return stripStops(long, o.stop);
        }
        const res2 = await api(`/generate/dryRun`, { method: "POST", body });
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
    /**
     * The dry run can't be given a reply length, so it only builds the prompt and the raw route answers
     * it with the length asked for. null when that fails (the caller makes a plain dry run).
     */
    async generateLong(body, connectionId, maxTokens, instruction) {
      const built = await api(`/generate/dryRun`, { method: "POST", body: { ...body, returnPrompt: true } });
      let messages = built.prompt?.messages;
      if (!Array.isArray(messages) || !messages.length) return null;
      if (instruction !== null) messages = asInstruction(messages, instruction);
      const res = await api(`/generate/raw`, {
        method: "POST",
        body: { connectionId: connectionId || await this.rawConnectionId(), messages: fitRawMessages(messages), parameters: { ...rawParameters(built.parameters ?? {}), maxTokens }, streaming: false }
      });
      return typeof res.content === "string" ? res.content : null;
    }
    async rawConnectionId() {
      const chat = await this.sync().catch(() => null);
      const id = chat?.connectionId;
      if (id && id !== "random") return id;
      const pick2 = pickRawConnection(await api(`/connections`), id === "random");
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
      await sleep(400);
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
  var NOT_CHAT = /* @__PURE__ */ new Set(["image_generation", "video_generation", "audio_generation", "audio", "decision"]);
  var yes = (v) => v === true || v === "true";
  function pickRawConnection(list, random) {
    const chat = list.filter((c) => !NOT_CHAT.has(String(c.provider ?? "")) && !yes(c.profileImportReviewRequired));
    const pool = random ? chat.filter((c) => yes(c.useForRandom)) : [];
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : chat.find((c) => yes(c.isDefault)) ?? chat[0];
  }
  function fitRawMessages(messages, max = 200) {
    const clean = messages.filter((m2) => (m2.role === "system" || m2.role === "user" || m2.role === "assistant") && typeof m2.content === "string").map((m2) => ({ role: m2.role, content: m2.content, ...m2.images ? { images: m2.images } : {}, ...m2.files ? { files: m2.files } : {}, ...m2.providerMetadata ? { providerMetadata: m2.providerMetadata } : {} }));
    if (clean.length <= max) return clean;
    let head = 0;
    while (head < clean.length && clean[head].role === "system" && head < max / 2) head++;
    return [...clean.slice(0, head), ...clean.slice(clean.length - (max - head))];
  }
  function rawParameters(p) {
    const out = {};
    const num3 = (k, min, max, int = false) => {
      const v = p[k];
      if (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max && (!int || Number.isInteger(v))) out[k] = v;
    };
    num3("temperature", 0, 5);
    num3("maxContext", 1, Number.MAX_SAFE_INTEGER, true);
    num3("topP", 0, 1);
    num3("topK", 0, 1e4, true);
    num3("minP", 0, 1);
    num3("frequencyPenalty", -2, 2);
    num3("presencePenalty", -2, 2);
    const oneOf = (k, values) => {
      if (typeof p[k] === "string" && values.includes(p[k])) out[k] = p[k];
    };
    oneOf("reasoningEffort", ["low", "medium", "high", "xhigh", "maximum"]);
    oneOf("verbosity", ["low", "medium", "high"]);
    oneOf("serviceTier", ["flex", "priority"]);
    const custom = p.customParameters;
    if (custom && typeof custom === "object" && !Array.isArray(custom)) out.customParameters = custom;
    return out;
  }
  function asInstruction(messages, prompt) {
    const marker = prompt.replace(/<\/?[A-Za-z][\w-]*>/g, "\n").split("\n").map((l) => l.trim()).find((l) => l.length >= 6 && !l.includes("{{"));
    let at = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        at = i;
        break;
      }
    }
    if (at < 0 || !marker) return messages;
    const content = messages[at].content;
    const from = content.indexOf(marker.slice(0, 60));
    if (from < 0) return messages;
    const own = content.slice(0, from).trim();
    const out = messages.slice(0, at);
    if (own) out.push({ ...messages[at], content: own });
    out.push({ role: "system", content: `[Instruction for the next reply, from the system — not a message from the user. Do not answer it as a chat message or stay in a texting style; carry it out and write exactly what it asks for.]

${content.slice(from).trim()}` });
    out.push({ role: "user", content: "[Carry out the instruction above now.]" }, ...messages.slice(at + 1));
    return out;
  }

  // src/host/model-pick.ts
  function chatModelPick(chat) {
    if (!chat?.connectionId) return null;
    const raw = parseObject(parseObject(chat.metadata).modelOverride);
    const model = typeof raw.model === "string" ? raw.model.trim() : "";
    const connectionId = typeof raw.connectionId === "string" ? raw.connectionId.trim() : "";
    if (!model || connectionId !== chat.connectionId) return null;
    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : model;
    return { connectionId, model, name };
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
  function characterByName(items, name) {
    const lower = name.trim().toLowerCase();
    const nameOf = (c) => typeof c.name === "string" ? c.name.toLowerCase() : "";
    return items.find((c) => nameOf(c) === lower) ?? (lower ? items.find((c) => nameOf(c).includes(lower)) : void 0);
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
      if (!res.ok || !res.body) throw new Error(t(`Agent retry failed (${res.status})`, `에이전트를 다시 돌리지 못했어요 (${res.status})`));
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
          id = characterByName(catalog.items ?? [], name)?.id;
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
    async promptPresets() {
      const list = await api(`/prompts`);
      return (Array.isArray(list) ? list : []).filter((p) => typeof p.id === "string").map((p) => ({ id: p.id, name: typeof p.name === "string" && p.name.trim() ? p.name : p.id }));
    }
    async connections() {
      const list = await api(`/connections`);
      return list.map((c) => ({ id: c.id, name: c.name, model: c.model }));
    }
    async currentConnection() {
      const detail = await this.chat.sync(true);
      const id = detail?.connectionId;
      if (!id) return null;
      if (id === "random") return { id, name: "random" };
      const pick2 = chatModelPick(detail);
      const c = (await this.connections()).find((x) => x.id === id);
      const model = pick2?.model ?? c?.model;
      return { id, name: c?.name ?? id, ...model ? { model } : {} };
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
    constructor(ui) {
      this.ui = ui;
    }
    local = new ChatVariables();
    global = new GlobalVariables();
    chat = new MarinaraChat();
    qr;
    visz;
    memo;
    marinara = new MarinaraExtrasImpl(this.chat);
    macroCache = /* @__PURE__ */ new Map();
    facts() {
      return this.chat.facts(this.ui.getInput());
    }
    async beginRun() {
      this.macroCache.clear();
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
      const key2 = `${chatId}
${text7}`;
      const cached2 = this.macroCache.get(key2);
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
            this.macroCache.set(key2, match[1]);
            return match[1];
          }
        }
      } catch {
      }
      return text7;
    }
    /** A character's name by id (the Library's "this character" switches); a stand-in when it can't be read. */
    async characterName(id) {
      try {
        const raw = await api(`/characters/${encodeURIComponent(id)}`);
        return String(parseObject(raw.data).name ?? raw.name ?? t("Character", "캐릭터"));
      } catch {
        return t("Character", "캐릭터");
      }
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

  // src/host/fornello.ts
  async function chatPictures() {
    const bridge = window.__fornello;
    if (typeof bridge?.pictures !== "function") return [];
    const list = await bridge.pictures().catch(() => []);
    return Array.isArray(list) ? list.filter((p) => p && typeof p.name === "string" && typeof p.person === "string") : [];
  }
  function fornello() {
    const bridge = window.__fornello;
    return bridge && bridge.version === 1 && typeof bridge.mount === "function" ? bridge : null;
  }
  function fornelloInstalled() {
    return !!window.__fornello;
  }
  var pictures = /* @__PURE__ */ new Map();
  async function pageWithPictures(code, chatId) {
    const bridge = window.__fornello;
    if (typeof bridge?.fillAssets !== "function") return code;
    const filled = await bridge.fillAssets(code, chatId).catch(() => code);
    if (filled === code) return code;
    let out = filled;
    for (const url of new Set(filled.match(/\/api\/(?:characters\/[^"'()\s/]+\/gallery|sprites\/[^"'()\s/]+)\/file\/[^"'()\s<>]+/g) ?? [])) {
      let data = pictures.get(url);
      if (!data) {
        data = (getMarinara().fetch ?? fetch)(url, { credentials: "same-origin" }).then((r) => r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))).then((blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error ?? new Error("read"));
          reader.readAsDataURL(blob);
        }));
        pictures.set(url, data);
        const tried = data;
        data.catch(() => pictures.get(url) === tried && pictures.delete(url));
      }
      const inline2 = await data.catch(() => null);
      if (inline2) out = out.split(url).join(inline2);
    }
    return out;
  }

  // src/stscript/host.ts
  var LONG_REPLY_TOKENS = 35e3;

  // src/host/visz-host.ts
  function createViszHost(host, ui) {
    return {
      ui,
      // a page with its story is long: the reply may be, whatever the chat's own length
      // and it goes as an instruction, so a texting preset doesn't have the character answer it
      generate: (prompt, connectionId, preset, memory, presetId) => host.chat.generate({ mode: "chat", prompt, connectionId, preset, memory, maxTokens: LONG_REPLY_TOKENS, instruction: true, ...presetId ? { presetId } : {} }),
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
      hasFornello: fornelloInstalled,
      pictures: chatPictures
    };
  }

  // src/memo/markdown.ts
  var CHECK_MARK = "✓";
  var HEADING = /^(#{1,3})\s+(.*)$/;
  var CHECK = /^(\s*)[-*]\s+\[( |x|X|✓|✔)\](?:\s(.*))?$/;
  var BULLET = /^(\s*)[-*]\s+(.*)$/;
  var NUMBER = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
  var indentOf = (spaces) => Math.min(6, Math.floor(spaces.replace(/\t/g, "  ").length / 2));
  function parseMemo(text7) {
    const blocks = [];
    let checks = 0;
    let gap = false;
    const last = () => gap ? void 0 : blocks[blocks.length - 1];
    for (const line of text7.replace(/\r\n?/g, "\n").split("\n")) {
      let m2;
      if (!line.trim()) {
        gap = true;
        continue;
      }
      if (m2 = line.match(HEADING)) {
        blocks.push({ kind: "heading", level: m2[1].length, content: parseInline(m2[2]) });
      } else if (m2 = line.match(CHECK)) {
        const item = { indent: indentOf(m2[1]), checked: m2[2] !== " ", index: checks++, content: parseInline(m2[3] ?? "") };
        const prev = last();
        if (prev?.kind === "checks") prev.items.push(item);
        else blocks.push({ kind: "checks", items: [item] });
      } else if ((m2 = line.match(NUMBER)) || (m2 = line.match(BULLET))) {
        const ordered = m2.length === 4;
        const item = { indent: indentOf(m2[1]), content: parseInline(ordered ? m2[3] : m2[2]) };
        const prev = last();
        if (prev?.kind === "list" && prev.ordered === ordered) prev.items.push(item);
        else blocks.push({ kind: "list", ordered, start: ordered ? Number(m2[2]) : 1, items: [item] });
      } else {
        const prev = last();
        if (prev?.kind === "paragraph") prev.lines.push(parseInline(line));
        else blocks.push({ kind: "paragraph", lines: [parseInline(line)] });
      }
      gap = false;
    }
    return blocks;
  }
  var STYLE_ATTR = `style\\s*=\\s*(?:"([^"<>]*)"|'([^'<>]*)')`;
  var SPAN_OPEN = new RegExp(`^<span\\s+${STYLE_ATTR}\\s*>`, "i");
  var PAIRS = [
    ["**", "bold"],
    ["~~", "strike"],
    ["*", "italic"],
    ["_", "italic"]
  ];
  function parseInline(text7) {
    const out = [];
    let plain = "";
    const flush = () => {
      if (plain) out.push({ kind: "text", text: plain });
      plain = "";
    };
    let i = 0;
    while (i < text7.length) {
      const rest = text7.slice(i);
      if (rest[0] === "`") {
        const end = text7.indexOf("`", i + 1);
        if (end > i + 1) {
          flush();
          out.push({ kind: "code", text: text7.slice(i + 1, end) });
          i = end + 1;
          continue;
        }
      }
      if (rest[0] === "<") {
        const tag = matchTag(text7, i);
        if (tag) {
          flush();
          out.push(tag.node);
          i = tag.end;
          continue;
        }
      }
      const pair = PAIRS.find(([mark]) => rest.startsWith(mark));
      if (pair) {
        const [mark, kind] = pair;
        let end = text7.indexOf(mark, i + mark.length);
        while (end > 0 && text7[end + mark.length] === mark[0]) end++;
        const wordy = mark === "_" && (/\w/.test(text7[i - 1] ?? "") || /\w/.test(text7[end + 1] ?? ""));
        if (end > i + mark.length && !/\s/.test(text7[i + mark.length]) && !/\s/.test(text7[end - 1]) && !wordy) {
          flush();
          out.push({ kind, children: parseInline(text7.slice(i + mark.length, end)) });
          i = end + mark.length;
          continue;
        }
      }
      plain += text7[i];
      i++;
    }
    flush();
    return out;
  }
  function matchTag(text7, at) {
    const rest = text7.slice(at);
    const u = /^<u>/i.exec(rest);
    const span = u ? null : SPAN_OPEN.exec(rest);
    if (!u && !span) return null;
    const name = u ? "u" : "span";
    const openLen = (u ?? span)[0].length;
    const tags = new RegExp(`<${name}(?:\\s[^<>]*)?>|</${name}>`, "gi");
    tags.lastIndex = at + openLen;
    let depth = 1;
    for (let m2 = tags.exec(text7); m2; m2 = tags.exec(text7)) {
      depth += m2[0][1] === "/" ? -1 : 1;
      if (depth) continue;
      const children = parseInline(text7.slice(at + openLen, m2.index));
      const end = m2.index + m2[0].length;
      if (u) return { node: { kind: "underline", children }, end };
      return { node: { kind: "span", style: parseStyle(span[1] ?? span[2]), children }, end };
    }
    return null;
  }
  var COLOR = /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i;
  var SIZE = /^(\d{1,3}(?:\.\d{1,2})?)(em|rem|px|%)$/i;
  var FONT = /^[\p{L}\p{N} _\-'",.]{1,100}$/u;
  function parseStyle(style) {
    const out = {};
    for (const part of style.split(";")) {
      const at = part.indexOf(":");
      if (at < 0) continue;
      const key2 = part.slice(0, at).trim().toLowerCase();
      const value = part.slice(at + 1).trim();
      if (key2 === "color" && COLOR.test(value)) out.color = value;
      else if (key2 === "font-size") {
        const m2 = value.match(SIZE);
        if (!m2) continue;
        const n = Number(m2[1]);
        const unit = m2[2].toLowerCase();
        const [min, max] = unit === "px" ? [8, 48] : unit === "%" ? [50, 300] : [0.5, 3];
        out.size = `${Math.min(max, Math.max(min, n))}${unit}`;
      } else if (key2 === "font-family" && FONT.test(value)) out.font = value;
    }
    return out;
  }
  function textForAi(text7) {
    return text7.replace(new RegExp(`<span\\s+${STYLE_ATTR}\\s*>|</span>|</?u>`, "gi"), "");
  }
  function plainText(text7) {
    return textForAi(text7).replace(/^[ \t]*(?:#{1,6}[ \t]+|[-*+][ \t]+\[[ xX✓]\][ \t]+|[-*+][ \t]+|\d+[.)][ \t]+|>[ \t]?)/gm, "").replace(/(\*\*|__|~~|`)(.+?)\1/g, "$2").replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2");
  }
  function toggleCheck(text7, index) {
    let n = 0;
    return text7.split("\n").map((line) => {
      const m2 = line.match(CHECK);
      if (!m2 || n++ !== index) return line;
      const at = line.indexOf("[") + 1;
      return line.slice(0, at) + (m2[2] === " " ? CHECK_MARK : " ") + line.slice(at + 1);
    }).join("\n");
  }
  function wrap2(e, open2, close) {
    const { text: text7, start: start2, end } = e;
    const inner = text7.slice(start2, end);
    if (text7.slice(start2 - open2.length, start2) === open2 && text7.slice(end, end + close.length) === close) {
      return { text: text7.slice(0, start2 - open2.length) + inner + text7.slice(end + close.length), start: start2 - open2.length, end: end - open2.length };
    }
    if (inner.startsWith(open2) && inner.endsWith(close) && inner.length >= open2.length + close.length) {
      const bare = inner.slice(open2.length, inner.length - close.length);
      return { text: text7.slice(0, start2) + bare + text7.slice(end), start: start2, end: start2 + bare.length };
    }
    return { text: text7.slice(0, start2) + open2 + inner + close + text7.slice(end), start: start2 + open2.length, end: end + open2.length };
  }
  var SPAN_AROUND = new RegExp(`<span\\s+${STYLE_ATTR}\\s*>$`, "i");
  function styleSelection(e, prop, value) {
    const before = e.text.slice(0, e.start);
    const m2 = before.match(SPAN_AROUND);
    if (m2 && e.text.startsWith("</span>", e.end)) {
      const parts3 = (m2[1] ?? m2[2]).split(";").map((p) => p.trim()).filter((p) => p && p.split(":")[0].trim().toLowerCase() !== prop);
      if (value) parts3.push(`${prop}: ${value}`);
      const openStart = e.start - m2[0].length;
      if (!parts3.length) {
        const inner = e.text.slice(e.start, e.end);
        return { text: e.text.slice(0, openStart) + inner + e.text.slice(e.end + "</span>".length), start: openStart, end: openStart + inner.length };
      }
      const open2 = `<span style="${parts3.join("; ")}">`;
      const shift = open2.length - m2[0].length;
      return { text: e.text.slice(0, openStart) + open2 + e.text.slice(e.start), start: e.start + shift, end: e.end + shift };
    }
    if (!value) return e;
    return wrap2(e, `<span style="${prop}: ${value}">`, "</span>");
  }
  var MARKER = /^(\s*)(#{1,3}\s+|[-*]\s+\[(?: |x|X|✓|✔)\]\s?|[-*]\s+|\d{1,9}[.)]\s+)?/;
  var markerKind = (marker) => {
    const m2 = marker.trim();
    if (!m2) return null;
    if (m2.startsWith("#")) return `h${m2.length}`;
    if (/\[/.test(m2)) return "check";
    if (/^\d/.test(m2)) return "number";
    return "bullet";
  };
  function setLines(e, kind) {
    const from = e.text.lastIndexOf("\n", e.start - 1) + 1;
    const toBreak = e.text.indexOf("\n", e.end);
    const to = toBreak < 0 ? e.text.length : toBreak;
    const lines = e.text.slice(from, to).split("\n");
    const parsed = lines.map((line) => {
      const m2 = line.match(MARKER);
      return { indent: m2[1], kind: markerKind(m2[2] ?? ""), body: line.slice(m2[0].length) };
    });
    const off = parsed.every((p) => p.kind === kind);
    let n = 0;
    const marker = (indent) => {
      if (off) return indent;
      if (kind === "number") return `${indent}${++n}. `;
      if (kind === "bullet") return `${indent}- `;
      if (kind === "check") return `${indent}- [ ] `;
      return `${"#".repeat(Number(kind[1]))} `;
    };
    const block2 = parsed.map((p) => marker(p.indent) + p.body).join("\n");
    const text7 = e.text.slice(0, from) + block2 + e.text.slice(to);
    return e.start === e.end ? { text: text7, start: from + block2.length, end: from + block2.length } : { text: text7, start: from, end: from + block2.length };
  }
  function continueList(e) {
    if (e.start !== e.end) return null;
    const from = e.text.lastIndexOf("\n", e.start - 1) + 1;
    const line = e.text.slice(from, e.start);
    let m2;
    let next;
    let body;
    if (m2 = line.match(CHECK)) {
      next = `${m2[1]}- [ ] `;
      body = m2[3] ?? "";
    } else if (m2 = line.match(NUMBER)) {
      next = `${m2[1]}${Number(m2[2]) + 1}. `;
      body = m2[3];
    } else if (m2 = line.match(BULLET)) {
      next = `${m2[1]}- `;
      body = m2[2];
    } else return null;
    if (!body.trim()) {
      const text8 = e.text.slice(0, from) + e.text.slice(e.start);
      return { text: text8, start: from, end: from };
    }
    const text7 = e.text.slice(0, e.start) + "\n" + next + e.text.slice(e.start);
    const at = e.start + 1 + next.length;
    return { text: text7, start: at, end: at };
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
  function convertToMarinara(script, registry2) {
    if (!script.trimStart().startsWith("/")) return { ok: true, script, changes: 0, reasons: [] };
    let root;
    try {
      root = parse(script, { lookup: (n) => registry2.get(n) });
    } catch (e) {
      return { ok: false, script, changes: 0, reasons: [t(`Syntax error: ${e instanceof Error ? e.message : String(e)}`, `문법 오류: ${e instanceof Error ? e.message : String(e)}`)] };
    }
    const reasons = /* @__PURE__ */ new Set();
    const nodes = flatten(root, reasons);
    const vars = readVariables(script, nodes);
    const anchored = (name) => {
      const v = vars.get(name);
      return !!v && !v.other && (v.fromLast > 0 || v.asIndex);
    };
    for (const [name, v] of vars) {
      if ((v.fromLast > 0 || v.asIndex) && v.other) reasons.add(t(`Variable "${name}" gets message numbers mixed with other values`, `변수 "${name}"에 메시지 번호와 다른 값이 섞여 들어가요`));
    }
    const pass = { script, edits: [], reasons, anchored, lastHandled: 0, varHandled: /* @__PURE__ */ new Map() };
    for (const node of nodes) rewriteNode(pass, node);
    checkAccounted(pass);
    if (reasons.size) return { ok: false, script, changes: 0, reasons: [...reasons] };
    const edits = dedupe(pass.edits);
    let out = script;
    for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    return { ok: true, script: out, changes: edits.length, reasons: [] };
  }
  function readVariables(script, nodes) {
    const vars = /* @__PURE__ */ new Map();
    const info = (name) => {
      let v = vars.get(name);
      if (!v) vars.set(name, v = { fromLast: 0, other: false, asIndex: false });
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
        else if (!/^-?\d+$/.test(target.value.trim())) v.other = true;
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
    return vars;
  }
  function handleVar(pass, name) {
    pass.varHandled.set(name, (pass.varHandled.get(name) ?? 0) + 1);
  }
  function bound(pass, text7) {
    const t2 = text7.trim();
    if (/^\d+$/.test(t2)) return text7.replace(t2, String(Number(t2) + 1));
    if (/^\{\{lastMessageId\}\}$/i.test(t2)) {
      pass.lastHandled++;
      return text7;
    }
    const m2 = /^\{\{(?:getvar|var)::\s*([^}:]+?)\s*\}\}$/i.exec(t2);
    if (m2 && pass.anchored(m2[1])) {
      handleVar(pass, m2[1]);
      return text7;
    }
    return null;
  }
  function rewriteNode(pass, node) {
    if (node.name === "nar") pass.edits.push({ start: node.start, end: node.start + 4, text: "/sys" });
    if (node.name === "random") pass.edits.push({ start: node.start, end: node.start + "/random".length, text: "/randomchar" });
    if (AT_COMMANDS.has(node.name) && node.named.some((a) => a.name === "at")) rewriteAt(pass, node);
    if (INDEX_COMMANDS.has(node.name)) rewriteIndex(pass, node);
    if (ASSIGN_COMMANDS.has(node.name)) rewriteAssignment(pass, node);
    if (COMPARE_COMMANDS.has(node.name)) rewriteComparison(pass, node);
  }
  function rewriteAt(pass, node) {
    const arg = namedArg(pass.script, node, "at");
    if (arg && /^\d+$/.test(arg.value)) pass.edits.push({ start: arg.start, end: arg.start + arg.value.length, text: String(Number(arg.value) + 1) });
    else pass.reasons.add(t(`/${node.name}: the at= value isn't a number`, `/${node.name}의 at= 값이 숫자가 아니에요`));
  }
  function rewriteIndex(pass, node) {
    const region = unnamedRegion(pass.script, node);
    if (!region) {
      if (node.name !== "messages" && node.name !== "message") pass.reasons.add(t(`/${node.name} uses the previous command's result (pipe) as a message number`, `/${node.name}이(가) 앞 명령의 결과(파이프)를 메시지 번호로 써요`));
      return;
    }
    const rewritten = rewriteRange(region.text, (b) => bound(pass, b));
    if (rewritten === null) {
      pass.reasons.add(t(`/${node.name}: can't follow the message number (${region.text.trim().slice(0, 40)})`, `/${node.name}의 메시지 번호를 따라갈 수 없어요 (${region.text.trim().slice(0, 40)})`));
      return;
    }
    if (rewritten !== region.text) pass.edits.push({ start: region.start, end: region.start + region.text.length, text: rewritten });
  }
  function rewriteAssignment(pass, node) {
    const target = assignment(node);
    if (!target || target.value === null || !pass.anchored(target.name)) return;
    const value = target.value.trim();
    if (/^\{\{lastMessageId\}\}$/i.test(value)) pass.lastHandled++;
    else if (/^-?\d+$/.test(value)) {
      const region = unnamedRegion(pass.script, node);
      const m2 = region ? /(-?\d+)\s*$/.exec(region.text) : null;
      if (region && m2) {
        const at = region.start + m2.index;
        pass.edits.push({ start: at, end: at + m2[1].length, text: String(Number(m2[1]) + 1) });
      }
    }
  }
  function rewriteComparison(pass, node) {
    const ops = OPERAND_KEYS.map((k) => namedArg(pass.script, node, k)).filter((o) => !!o);
    if (ops.length === 0) return;
    const kinds = ops.map((o) => classify(o.value, pass.anchored));
    const isIndex = (k) => k.kind === "last" || k.kind === "var" && pass.anchored(k.name);
    const indexSides = kinds.filter(isIndex).length;
    if (indexSides === 0) return;
    kinds.forEach((k, i) => {
      if (k.kind === "last") pass.lastHandled++;
      if (k.kind === "var" && pass.anchored(k.name) && /\{\{/.test(ops[i].value)) handleVar(pass, k.name);
    });
    if (indexSides !== 1 || ops.length !== 2) return;
    const otherIdx = isIndex(kinds[0]) ? 1 : 0;
    const other = kinds[otherIdx];
    if (other.kind === "lit") {
      const o = ops[otherIdx];
      const numAt = o.start + o.value.indexOf(String(other.value));
      pass.edits.push({ start: numAt, end: numAt + String(other.value).length, text: String(other.value + 1) });
    } else {
      pass.reasons.add(t(`/${node.name} compares a message number with a computed value`, `/${node.name}에서 메시지 번호를 계산된 값과 비교해요`));
    }
  }
  function checkAccounted(pass) {
    const totalLast = (pass.script.match(LAST_ID_RE) ?? []).length;
    if (totalLast > pass.lastHandled) pass.reasons.add(t("{{lastMessageId}} is also used for things other than message numbers (text output, math, etc.)", "{{lastMessageId}}를 메시지 번호 말고 다른 곳(글자 출력, 계산 등)에도 써요"));
    const macroUses = /* @__PURE__ */ new Map();
    for (const m2 of pass.script.matchAll(VAR_MACRO_RE)) macroUses.set(m2[1], (macroUses.get(m2[1]) ?? 0) + 1);
    for (const [name, count] of macroUses) {
      if (pass.anchored(name) && count > (pass.varHandled.get(name) ?? 0)) pass.reasons.add(t(`Variable "${name}" holds a message number and is also used elsewhere`, `메시지 번호를 담은 변수 "${name}"를 다른 곳에도 써요`));
    }
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
  function rewriteRange(text7, bound2 = defaultBound) {
    const out = [];
    for (const part of text7.split(",")) {
      const m2 = /^(\s*)(\{\{[^}]*\}\}|[^-\s{][^-]*?)(?:(\s*-\s*)(\{\{[^}]*\}\}|\S+?))?(\s*)$/.exec(part);
      if (!m2) return null;
      const a = bound2(m2[2]);
      if (a === null) return null;
      let piece = `${m2[1]}${a}`;
      if (m2[3] !== void 0) {
        const b = bound2(m2[4]);
        if (b === null) return null;
        piece += `${m2[3]}${b}`;
      }
      out.push(piece + m2[5]);
    }
    return out.join(",");
  }
  function defaultBound(b) {
    if (/^\d+$/.test(b)) return String(Number(b) + 1);
    if (/^\{\{lastMessageId\}\}$/i.test(b)) return b;
    return null;
  }

  // src/qr/icons.ts
  var PAIRS2 = [
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
  var BY_NAME = new Map(PAIRS2);
  function emojiForIcon(icon2) {
    const names = icon2.split(/\s+/).map((c) => c.replace(/^fa-/, "")).filter((c) => c && !["fa", "solid", "regular", "light", "thin", "duotone", "brands", "fw", "lg", "xl", "sm", "xs"].includes(c) && !/^\d+x$/.test(c));
    if (!names.length) return void 0;
    for (const n of names) {
      const hit = BY_NAME.get(n);
      if (hit) return hit;
    }
    return "⭐";
  }

  // src/qr/import.ts
  function findUnsupported(script, registry2) {
    if (!script.trimStart().startsWith("/")) return [];
    let closure;
    try {
      closure = parse(script, { lookup: (n) => registry2.get(n) });
    } catch (e) {
      return { error: e instanceof ParseError ? e.message : String(e) };
    }
    const unknown = /* @__PURE__ */ new Set();
    const walk = (c) => {
      for (const ex of c.executors) {
        if (ex.kind === "command") {
          if (!registry2.has(ex.name)) unknown.add(ex.name);
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
  function importSillyTavern(json2, registry2, fallbackName = t("Imported QR", "가져온 QR")) {
    const report = emptyReport();
    if (isStItem(json2)) {
      const item = stItem(json2, registry2, report, "");
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
        const item = stItem(q, registry2, report, set.name);
        if (item) set.items.push(item);
      }
      report.sets.push(set);
    }
    return report;
  }
  function stItem(q, registry2, report, setName) {
    const script = String(q.message ?? q.mes ?? "");
    if (!script.trim() && !q.label && !q.contextList?.length) return null;
    const item = itemFromSt(q, script);
    for (const link of q.contextList ?? []) if (link?.set) report.links.push({ item, setName: link.set, chained: !!link.isChained });
    check(item, registry2, report, setName);
    applyConversion(item, registry2);
    if (item.dialect === "marinara") report.converted++;
    else report.keptSillyTavern.push({ set: setName, label: item.label, reasons: item.note ? item.note.split("\n") : [] });
    report.total++;
    return item;
  }
  function itemFromSt(q, script) {
    const auto = {};
    for (const { key: key2, st } of AUTO_TRIGGERS) if (q[st]) auto[key2] = true;
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
    return item;
  }
  function check(item, registry2, report, setName) {
    const found = findUnsupported(item.script, registry2);
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
  function applyConversion(item, registry2) {
    const result = convertToMarinara(item.script, registry2);
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
      kind: "script",
      dialect: i.dialect,
      icon: i.icon,
      showLabel: i.showLabel === false ? false : void 0,
      hidden: !!i.hidden,
      auto: i.auto,
      automationId: i.automationId,
      preventAuto: i.preventAuto === false ? false : void 0,
      contextList: links.length ? links : void 0,
      steps: i.steps
    };
  }
  function isMarinaraQr(json2) {
    if (!json2 || typeof json2 !== "object") return false;
    const j = json2;
    return j.format === MQR_FORMAT || j.format === MQR_ITEM_FORMAT || Array.isArray(j.sets) && j.sets.some((s) => s && typeof s === "object" && s.format === MQR_FORMAT);
  }
  function importMarinara(json2, registry2, fallbackName = t("Imported QR", "가져온 QR")) {
    const report = emptyReport();
    const j = json2;
    if (j.format === MQR_ITEM_FORMAT) {
      if (j.item && typeof j.item === "object") report.items.push(mqrToItem(j.item, registry2, report, ""));
      return report;
    }
    const list = Array.isArray(j.sets) ? j.sets : [json2];
    for (const raw of list) {
      if (!raw || raw.format !== MQR_FORMAT || !Array.isArray(raw.items)) continue;
      const set = newSet(String(raw.name || fallbackName));
      set.display = raw.display === "inline" ? "inline" : "folder";
      if (typeof raw.color === "string") set.color = raw.color;
      if (raw.colorBorderOnly) set.colorBorderOnly = true;
      if (typeof raw.icon === "string" && raw.icon.trim()) set.icon = raw.icon;
      set.disableSend = !!raw.disableSend;
      set.placeBeforeInput = !!raw.placeBeforeInput;
      set.injectInput = !!raw.injectInput;
      for (const r of raw.items) set.items.push(mqrToItem(r, registry2, report, set.name));
      report.sets.push(set);
    }
    return report;
  }
  function mqrToItem(r, registry2, report, setName) {
    const item = {
      ...newItem(String(r.label ?? "QR"), String(r.script ?? ""), r.dialect === "st" ? "st" : "marinara"),
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
    if (r.steps) Object.assign(item, withSteps({ ...item, steps: r.steps }));
    check(item, registry2, report, setName);
    if (item.dialect === "st") report.keptSillyTavern.push({ set: setName, label: item.label, reasons: [t("Saved counting from #0", "0번부터 세는 QR로 저장됨")] });
    return item;
  }
  function importAny(json2, registry2, fallbackName) {
    return isMarinaraQr(json2) ? importMarinara(json2, registry2, fallbackName) : importSillyTavern(json2, registry2, fallbackName);
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
    /\*\s*OOC\s*[:：]\s*([\s\S]*?)\s*\*/gi,
    // *OOC: ...*
    /<\s*System\s*>([\s\S]*?)<\s*\/\s*System\s*>/gi
    // <System>...</System>, Dispensa's own default wrapper
  ];
  function extractOocNotes(text7) {
    let rest = text7;
    const notes = [];
    const take = (match, body, offset) => {
      if (body.trim()) notes.push({ index: offset + (match.length - match.trimStart().length), body: body.trim() });
      return " ".repeat(match.length);
    };
    for (const re of OOC_PATTERNS) rest = rest.replace(re, take);
    rest = rest.replace(/^[ \t]*OOC\s*[:：][ \t]*(.+)$/gim, take);
    if (!notes.length) return text7.trim() ? [text7.trim()] : [];
    let at = 0;
    let run = null;
    const end = () => {
      if (run) notes.push({ index: run.index, body: run.lines.join("\n").trim() });
      run = null;
    };
    for (const line of text7.split("\n")) {
      const plain = line.trim() !== "" && rest.slice(at, at + line.length) === line;
      if (plain) (run ??= { index: at, lines: [] }).lines.push(line);
      else end();
      at += line.length + 1;
    }
    end();
    notes.sort((a, b) => a.index - b.index);
    return notes.map((n) => n.body).filter(Boolean);
  }

  // src/memo/board-frame.ts
  var FRAME_COLS = { min: 2, max: 6, default: 4 };
  var HEAD_KEY = "head";
  var cardKey = (memoId) => `card:${memoId}`;
  var magnetKey = (id) => `magnet:${id}`;
  function frameItems(board) {
    const out = [];
    out.push({ key: HEAD_KEY, cell: board.headCell ?? { c: 0, r: 0, w: 2, h: 1 } });
    for (const c of board.cards) out.push({ key: cardKey(c.memoId), cell: c.cell ?? { c: 0, r: 0, w: 1, h: 1 } });
    for (const m2 of board.magnets) if (!m2.sticker) out.push({ key: magnetKey(m2.id), cell: m2.cell ?? { c: 0, r: 0, w: 1, h: 1 } });
    return out;
  }
  var overlaps = (a, b) => a.c < b.c + b.w && b.c < a.c + a.w && a.r < b.r + b.h && b.r < a.r + a.h;
  function firstFree(taken, size, cols) {
    for (let r = 0; ; r++) {
      for (let c = 0; c + size.w <= cols; c++) {
        const cell = { c, r, ...size };
        if (!taken.some((t2) => overlaps(t2, cell))) return cell;
      }
    }
  }
  function fit(cell, cols) {
    const w = Math.max(1, Math.min(cols, Math.round(cell.w)));
    const h2 = Math.max(1, Math.min(6, Math.round(cell.h)));
    return { c: Math.max(0, Math.min(cols - w, Math.round(cell.c))), r: Math.max(0, Math.round(cell.r)), w, h: h2 };
  }
  function settle(items, cols, fixed = []) {
    const placed = [];
    const order = [...fixed.map((k) => items.find((i) => i.key === k)).filter((i) => !!i), ...items.filter((i) => !fixed.includes(i.key))];
    for (const item of order) {
      const want = fit(item.cell, cols);
      const free = !placed.some((p) => overlaps(p.cell, want));
      placed.push({ key: item.key, cell: free ? want : firstFree(placed.map((p) => p.cell), { w: want.w, h: want.h }, cols) });
    }
    return items.map((i) => placed.find((p) => p.key === i.key));
  }
  function applyItems(board, items) {
    const by = new Map(items.map((i) => [i.key, i.cell]));
    board.headCell = by.get(HEAD_KEY);
    for (const c of board.cards) c.cell = by.get(cardKey(c.memoId));
    for (const m2 of board.magnets) {
      if (m2.sticker) delete m2.cell;
      else m2.cell = by.get(magnetKey(m2.id));
    }
  }
  function arrangeFrame(board) {
    const cols = board.cols ?? FRAME_COLS.default;
    const items = frameItems(board);
    const known = /* @__PURE__ */ new Set([HEAD_KEY, ...board.cards.filter((c) => c.cell).map((c) => cardKey(c.memoId)), ...board.magnets.filter((m2) => m2.cell).map((m2) => magnetKey(m2.id))]);
    const kept = items.filter((i) => known.has(i.key));
    const placed = settle(kept, cols, kept.map((i) => i.key));
    for (const i of items) if (!known.has(i.key)) placed.push({ key: i.key, cell: firstFree(placed.map((p) => p.cell), { w: 1, h: 1 }, cols) });
    applyItems(board, placed);
  }
  function moveBlock(board, key2, c, r) {
    const cols = board.cols ?? FRAME_COLS.default;
    const items = frameItems(board);
    const me = items.find((i) => i.key === key2);
    if (!me) return;
    const from = me.cell;
    const to = fit({ ...from, c, r }, cols);
    const hit = items.filter((i) => i.key !== key2 && overlaps(i.cell, to));
    const moved = items.map((i) => {
      if (i.key === key2) return { ...i, cell: to };
      const at = hit.indexOf(i);
      if (at >= 0) return { ...i, cell: { ...i.cell, c: from.c + (i.cell.c - to.c), r: from.r + (i.cell.r - to.r) } };
      return i;
    });
    applyItems(board, settle(moved, cols, [key2, ...hit.map((h2) => h2.key)]));
  }
  function spanBlock(board, key2, w, h2) {
    const cols = board.cols ?? FRAME_COLS.default;
    const items = frameItems(board).map((i) => i.key === key2 ? { ...i, cell: { ...i.cell, w, h: h2 } } : i);
    applyItems(board, settle(items, cols, [key2]));
  }
  function setColumns(board, cols) {
    board.cols = Math.max(FRAME_COLS.min, Math.min(FRAME_COLS.max, Math.round(cols)));
    applyItems(board, settle(frameItems(board), board.cols, [HEAD_KEY]));
  }
  function frameRows(items) {
    return Math.max(1, ...items.map((i) => i.cell.r + i.cell.h)) + 1;
  }
  function freeCells(items, cols) {
    const rows = frameRows(items);
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!items.some((i) => overlaps(i.cell, { c, r, w: 1, h: 1 }))) out.push({ c, r });
    return out;
  }

  // src/memo/board-themes.ts
  var chip = (key2, en, ko, value) => ({ key: key2, label: [en, ko], value });
  var PAPER = (v) => chip("paper", "Background", "바탕", v);
  var PAGE_INK = (v) => chip("pageInk", "Title", "제목 글자", v);
  var CARD = (v) => chip("card", "Card", "카드", v);
  var CARD2 = (v) => chip("card2", "Second card", "보조 카드", v);
  var INK = (v) => chip("ink", "Text", "글자", v);
  var ACCENT = (v) => chip("accent", "Accent", "강조색", v);
  var ACCENT2 = (v) => chip("accent2", "Second accent", "보조 강조색", v);
  var BOARD_THEMES = [
    { id: "warm", name: ["Warm workspace", "웜 워크스페이스"], grid: 0, colors: [PAPER("#e9e5df"), CARD("#fffdfa"), INK("#2a2520"), ACCENT("#e8743b")] },
    { id: "bento", name: ["Bento", "벤토"], grid: 24, colors: [PAPER("#ecebe6"), CARD("#ffffff"), CARD2("#121212"), INK("#121212"), ACCENT("#d4ff3a")] },
    { id: "editorial", name: ["Editorial serif", "에디토리얼 세리프"], grid: 16, numbered: true, colors: [PAPER("#f4f0e8"), INK("#1a1714"), ACCENT("#e2401c")] },
    { id: "tech", name: ["Dark tech", "다크 테크"], grid: 16, colors: [PAPER("#09090b"), PAGE_INK("#e6e6ea"), CARD("#111114"), INK("#e6e6ea"), ACCENT("#5b8cff")] },
    { id: "spec", name: ["Guideline sheet", "가이드 시트"], grid: 16, numbered: true, colors: [PAPER("#f3f1ec"), INK("#141414"), ACCENT("#e8381f"), ACCENT2("#d9d5cc")] },
    { id: "duotone", name: ["Duotone", "듀오톤"], grid: 16, colors: [PAPER("#f6f4ef"), ACCENT("#2340ff"), PAGE_INK("#ffffff"), CARD("#ffffff"), INK("#0f1140")] },
    { id: "kinetic", name: ["Kinetic type", "키네틱 타이포"], grid: 16, numbered: true, colors: [PAPER("#0e0e0e"), PAGE_INK("#efe9dc"), CARD("#efe9dc"), INK("#0e0e0e"), ACCENT("#d7ff3d")] },
    { id: "archi", name: ["Architect grid", "건축 도면"], grid: 40, numbered: true, colors: [PAPER("#f2f2ef"), CARD("#fafaf8"), INK("#1d1d1b"), ACCENT("#ff5a1f")] },
    { id: "pop", name: ["Pop sticker", "팝 스티커"], grid: 0, colors: [PAPER("#fff8e7"), CARD("#ffffff"), INK("#111111"), ACCENT("#ff2e88"), ACCENT2("#ffe600")] },
    { id: "cottage", name: ["Cottage scrapbook", "코티지 스크랩북"], grid: 0, colors: [PAPER("#cdb38c"), CARD("#fbf6ea"), INK("#3d3227"), ACCENT("#b5646b"), ACCENT2("#8a9a6b")] },
    { id: "clean", name: ["Clean neutral", "클린 뉴트럴"], grid: 0, colors: [PAPER("#efe8de"), CARD("#f8f4ee"), CARD2("#e2d6c6"), INK("#3f3a34"), ACCENT("#b29a80")] },
    { id: "linen", name: ["Linen journal", "린넨 저널"], grid: 0, colors: [PAPER("#e6dfd3"), CARD("#faf7f1"), INK("#3b352d"), ACCENT("#9b7b5c")] }
  ];
  var DEFAULT_THEME = "warm";
  var HEX = /^#[0-9a-f]{6}$/i;
  function themeById(id) {
    return BOARD_THEMES.find((t2) => t2.id === id) ?? BOARD_THEMES.find((t2) => t2.id === DEFAULT_THEME);
  }
  var ALL_COLORS = [
    PAPER(""),
    PAGE_INK(""),
    CARD(""),
    CARD2(""),
    INK(""),
    ACCENT(""),
    ACCENT2("")
  ].map(({ key: key2, label }) => ({ key: key2, label }));
  function chipDefault(theme, key2) {
    const own = (k) => theme.colors.find((c) => c.key === k)?.value;
    const derived = {
      paper: () => own("paper"),
      pageInk: () => own("ink"),
      card: () => own("paper"),
      card2: () => own("ink"),
      ink: () => own("ink"),
      accent: () => own("accent"),
      accent2: () => own("accent")
    };
    return own(key2) ?? derived[key2]() ?? "#888888";
  }
  var ownsChip = (theme, key2) => theme.colors.some((c) => c.key === key2);
  var SHADOWS = ["none", "soft", "strong"];
  var PATTERNS = ["none", "dots", "grid", "lines"];
  var FONT_KINDS = ["sans", "serif", "italic", "mono", "display"];
  var MAX_CSS = 2e4;
  var fontName = (v) => typeof v === "string" && v.trim() && v.length <= 80 && !/[;{}<>"\\]/.test(v) ? v.trim() : void 0;
  function normalizeStyle(raw) {
    const r = raw && typeof raw === "object" ? raw : {};
    const out = {};
    const tf = fontName(r.titleFont);
    const cf = fontName(r.cardFont);
    if (tf) out.titleFont = tf;
    if (cf) out.cardFont = cf;
    if (typeof r.radius === "number" && Number.isFinite(r.radius)) out.radius = Math.round(Math.min(40, Math.max(0, r.radius)));
    if (SHADOWS.includes(r.shadow)) out.shadow = r.shadow;
    if (PATTERNS.includes(r.pattern)) out.pattern = r.pattern;
    if (r.tilt === "straight" || r.tilt === "tilted") out.tilt = r.tilt;
    if (typeof r.css === "string" && r.css.trim() && !cssProblem(r.css)) out.css = r.css.trim();
    return Object.keys(out).length ? out : void 0;
  }
  function normalizeTheme(raw) {
    const r = raw;
    if (!r || typeof r.id !== "string" || !BOARD_THEMES.some((t2) => t2.id === r.id)) return void 0;
    const theme = themeById(r.id);
    const colors = {};
    const given = r.colors && typeof r.colors === "object" ? r.colors : {};
    for (const { key: key2 } of ALL_COLORS) {
      const v = given[key2];
      if (typeof v === "string" && HEX.test(v) && v.toLowerCase() !== chipDefault(theme, key2).toLowerCase()) colors[key2] = v.toLowerCase();
    }
    const style = normalizeStyle(r.style);
    return { id: theme.id, ...Object.keys(colors).length ? { colors } : {}, ...style ? { style } : {} };
  }
  function themeColors(saved) {
    const theme = themeById(saved?.id);
    const out = Object.fromEntries(theme.colors.map((c) => [c.key, saved?.colors?.[c.key] ?? c.value]));
    for (const [key2, value] of Object.entries(saved?.colors ?? {})) if (value) out[key2] = value;
    return out;
  }
  function allColors(saved) {
    const theme = themeById(saved?.id);
    return Object.fromEntries(ALL_COLORS.map(({ key: key2 }) => [key2, saved?.colors?.[key2] ?? chipDefault(theme, key2)]));
  }
  function cssParts(css) {
    let code = "";
    const strings = [];
    for (let i = 0; i < css.length; ) {
      if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        if (end < 0) return null;
        code += " ";
        i = end + 2;
      } else if (css[i] === '"' || css[i] === "'") {
        const end = css.indexOf(css[i], i + 1);
        if (end < 0 || css.slice(i + 1, end).includes("\n")) return null;
        code += `"#${strings.length}"`;
        strings.push(css.slice(i + 1, end));
        i = end + 1;
      } else code += css[i++];
    }
    return { code, strings };
  }
  function cssProblem(css) {
    if (css.length > MAX_CSS) return "too-long";
    if (/[<\\]/.test(css)) return "not-allowed";
    const parts3 = cssParts(css);
    if (!parts3) return "unbalanced";
    const { code, strings } = parts3;
    if (/@(?!media\b|supports\b|container\b|keyframes\b|-webkit-keyframes\b)[\w-]+/i.test(code)) return "not-allowed";
    if (/image-set\s*\(|\bimage\s*\(|cross-fade\s*\(|expression\s*\(|javascript:|-moz-binding|behavior\s*:/i.test(code)) return "not-allowed";
    if (/position\s*:\s*(fixed|sticky)/i.test(code)) return "not-allowed";
    for (const m2 of code.matchAll(/\burl\s*\(([^)]*)(\)?)/gi)) {
      const arg = m2[1].trim();
      const quoted = /^"#(\d+)"$/.exec(arg);
      const target = quoted ? strings[Number(quoted[1])] : arg;
      if (!m2[2] || !/^data:image\//i.test(target.trim())) return "not-allowed";
    }
    let depth = 0;
    for (const c of code) {
      if (c === "{") depth++;
      else if (c === "}" && --depth < 0) return "unbalanced";
    }
    return depth === 0 ? null : "unbalanced";
  }
  function snapTo(value, grid) {
    return grid ? Math.round(value / grid) * grid : Math.round(value);
  }
  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.55 ? "#2b2b2b" : "#f4f4f4";
  }
  var THEME_FILE_KIND = "dispensa.board-theme";
  var lookOf = (s) => ({ id: s.base, ...s.colors ? { colors: { ...s.colors } } : {}, ...s.style ? { style: { ...s.style } } : {} });
  var savedOf = (id, name, look) => ({
    id,
    name: name.trim().slice(0, 60),
    base: look.id,
    ...look.colors ? { colors: { ...look.colors } } : {},
    ...look.style ? { style: { ...look.style } } : {}
  });
  function normalizeSavedThemes(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const r of raw) {
      const look = normalizeTheme({ id: r?.base, colors: r?.colors, style: r?.style });
      if (!look || typeof r.id !== "string" || !r.id || out.some((x) => x.id === r.id)) continue;
      const name = typeof r.name === "string" && r.name.trim() ? r.name : themeById(look.id).name[0];
      out.push(savedOf(r.id, name, look));
    }
    return out;
  }
  function themeFile(name, look) {
    return { kind: THEME_FILE_KIND, version: 1, name, base: look.id, colors: { ...allColors(look) }, ...look.style ? { style: { ...look.style } } : {} };
  }
  function readThemeFile(json2) {
    const r = json2;
    if (!r || typeof r !== "object" || r.kind !== THEME_FILE_KIND) return { error: "not-a-theme" };
    const look = normalizeTheme({ id: r.base, colors: r.colors, style: r.style });
    if (!look) return { error: "unknown-theme" };
    const name = typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 60) : themeById(look.id).name[0];
    const css = r.style?.css;
    return { name, look, droppedCss: typeof css === "string" && !!css.trim() && !look.style?.css };
  }
  function sameLook(a, saved) {
    if (!a || a.id !== saved.base) return false;
    const x = allColors(a);
    const y = allColors(lookOf(saved));
    return Object.keys(x).every((k) => x[k] === y[k]) && JSON.stringify(normalizeStyle(a.style) ?? {}) === JSON.stringify(normalizeStyle(saved.style) ?? {});
  }

  // src/memo/board.ts
  var STICKER_W = { min: 0.03, max: 1, default: 0.16 };
  function stickerOf(raw) {
    const r = raw;
    if (!r || typeof r !== "object" || typeof r.x !== "number" || typeof r.y !== "number" || typeof r.w !== "number") return void 0;
    if (![r.x, r.y, r.w].every(Number.isFinite)) return void 0;
    const w = Math.round(Math.max(STICKER_W.min, Math.min(STICKER_W.max, r.w)) * 1e3) / 1e3;
    return { x: Math.round(Math.max(0, Math.min(1 - STICKER_W.min, r.x)) * 1e3) / 1e3, y: Math.round(Math.max(0, Math.min(400, r.y)) * 1e3) / 1e3, w };
  }
  var BOARD_W = 2400;
  var BOARD_H = 1600;
  var CARD_W = { min: 140, max: 640, default: 240 };
  var MAGNET_SIZE = { min: 24, max: 400, default: 72 };
  var MAX_ROTATE = 30;
  var HEX2 = /^#[0-9a-f]{6}$/i;
  function cellOf(raw) {
    const r = raw;
    if (!r || typeof r !== "object") return void 0;
    const n = (v, min, max) => typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : min;
    return { c: n(r.c, 0, 5), r: n(r.r, 0, 200), w: n(r.w, 1, 6), h: n(r.h, 1, 6) };
  }
  var num2 = (v, fallback) => typeof v === "number" && Number.isFinite(v) ? v : fallback;
  var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  var round = (v) => Math.round(v * 10) / 10;
  function newBoard(name, at = Date.now()) {
    return { id: newId("board"), name: name.trim() || "Board", createdAt: at, theme: { id: DEFAULT_THEME }, cards: [], magnets: [] };
  }
  function image(raw) {
    const r = raw;
    return r && typeof r.id === "string" && typeof r.url === "string" && r.url.startsWith("/api/") ? { id: r.id, url: r.url } : void 0;
  }
  function normalizeBoards(raw, memos) {
    if (!Array.isArray(raw)) return [];
    const ids = new Set(memos.map((m2) => m2.id));
    return raw.filter((b) => !!b && typeof b === "object" && typeof b.id === "string").map((b) => {
      const bgImage = image(b.background?.image);
      const oldColor = b.background?.color;
      const bgColor = typeof oldColor === "string" && HEX2.test(oldColor) ? oldColor : void 0;
      const cards = (Array.isArray(b.cards) ? b.cards : []).filter((c) => c && typeof c.memoId === "string" && ids.has(c.memoId)).map((c) => ({
        memoId: c.memoId,
        x: round(clamp(num2(c.x, 0), 0, BOARD_W - CARD_W.min)),
        y: round(clamp(num2(c.y, 0), 0, BOARD_H - 40)),
        w: round(clamp(num2(c.w, CARD_W.default), CARD_W.min, CARD_W.max)),
        z: num2(c.z, 0),
        ...cellOf(c.cell) ? { cell: cellOf(c.cell) } : {},
        ...num2(c.rotate, 0) ? { rotate: round(clamp(num2(c.rotate, 0), -MAX_ROTATE, MAX_ROTATE)) } : {},
        ...typeof c.color === "string" && HEX2.test(c.color) ? { color: c.color } : {}
      }));
      const magnets = (Array.isArray(b.magnets) ? b.magnets : []).flatMap((m2) => {
        const img = m2 && image(m2.image);
        if (!img) return [];
        return [
          {
            id: typeof m2.id === "string" ? m2.id : newId("magnet"),
            image: img,
            x: round(clamp(num2(m2.x, 0), 0, BOARD_W - MAGNET_SIZE.min)),
            y: round(clamp(num2(m2.y, 0), 0, BOARD_H - MAGNET_SIZE.min)),
            size: round(clamp(num2(m2.size, MAGNET_SIZE.default), MAGNET_SIZE.min, MAGNET_SIZE.max)),
            z: num2(m2.z, 0),
            ...cellOf(m2.cell) ? { cell: cellOf(m2.cell) } : {},
            ...stickerOf(m2.sticker) ? { sticker: stickerOf(m2.sticker) } : {},
            ...num2(m2.rotate, 0) ? { rotate: round(clamp(num2(m2.rotate, 0), -MAX_ROTATE, MAX_ROTATE)) } : {},
            ...m2.page && typeof m2.page.archiveId === "string" && typeof m2.page.title === "string" ? { page: { archiveId: m2.page.archiveId, title: m2.page.title.slice(0, 120) } } : {}
          }
        ];
      });
      return {
        id: b.id,
        name: typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 60) : "Board",
        createdAt: num2(b.createdAt, 0),
        ...bgImage ? { background: { image: bgImage } } : {},
        // a board saved before themes kept its own background color: it becomes the theme's background chip
        theme: normalizeTheme(b.theme) ?? normalizeTheme({ id: DEFAULT_THEME, colors: bgColor ? { paper: bgColor } : {} }),
        ...b.layout === "frame" ? { layout: "frame" } : {},
        ...typeof b.cols === "number" ? { cols: Math.max(2, Math.min(6, Math.round(b.cols))) } : {},
        ...cellOf(b.headCell) ? { headCell: cellOf(b.headCell) } : {},
        ...b.numbers === false ? { numbers: false } : {},
        cards,
        magnets
      };
    });
  }
  function topZ(board) {
    return Math.max(0, ...board.cards.map((c) => c.z), ...board.magnets.map((m2) => m2.z)) + 1;
  }
  function freeSpot(board, w) {
    const right = Math.max(0, ...board.cards.map((c) => c.x + c.w), ...board.magnets.map((m2) => m2.x + m2.size));
    if (right + 40 + w <= BOARD_W) return { x: Math.max(60, right + 40), y: 60 };
    const bottom = Math.max(0, ...board.cards.map((c) => c.y + 260), ...board.magnets.map((m2) => m2.y + m2.size));
    return { x: 60, y: Math.min(bottom + 40, BOARD_H - 120) };
  }
  function placeMemos(board, memoIds, at = { x: 40, y: 40 }) {
    const fresh = memoIds.filter((id, i) => memoIds.indexOf(id) === i && !board.cards.some((c) => c.memoId === id));
    let z = topZ(board);
    fresh.forEach((memoId) => {
      const n = board.cards.length;
      const col = n % 4;
      const row = Math.floor(n / 4) % 6;
      board.cards.push({
        memoId,
        x: clamp(at.x + col * (CARD_W.default + 24) + row * 12, 0, BOARD_W - CARD_W.default),
        y: clamp(at.y + row * 180 + col * 10, 0, BOARD_H - 160),
        w: CARD_W.default,
        rotate: [-2, 1.5, -1, 2.5][n % 4],
        z: z++
      });
    });
    return fresh.length;
  }
  function boardsWith(boards, memoId) {
    return boards.filter((b) => b.cards.some((c) => c.memoId === memoId));
  }
  function sentParts(board, memos) {
    const byId = new Map(memos.map((m2) => [m2.id, m2]));
    const frame = board.layout === "frame";
    const cards = frame ? liveCards(board, memos).cards : board.cards;
    if (frame) arrangeFrame({ ...board, cards });
    return [...cards].sort((a, b) => frame ? a.cell.r - b.cell.r || a.cell.c - b.cell.c : a.y - b.y || a.x - b.x).map((c) => ({ memoId: c.memoId, memo: byId.get(c.memoId) })).filter((p) => !!p.memo).map(({ memoId, memo: m2 }) => ({ memoId, text: textForAi([m2.title?.trim() ? `## ${m2.title.trim()}` : "", m2.text].filter(Boolean).join("\n")).trim() })).filter((p) => p.text);
  }
  function liveCards(board, memos) {
    const ids = new Set(memos.map((m2) => m2.id));
    return { ...structuredClone(board), cards: board.cards.filter((c) => ids.has(c.memoId)).map((c) => structuredClone(c)) };
  }
  function boardText(board, memos) {
    return sentParts(board, memos).map((p) => p.text).join("\n\n");
  }
  function cardNumbers(board, memos) {
    return new Map(sentParts(board, memos).map((p, i) => [p.memoId, i + 1]));
  }
  function rotationFrom(dx, dy) {
    const deg = Math.atan2(dx, -dy) * 180 / Math.PI;
    const held = clamp(deg, -MAX_ROTATE, MAX_ROTATE);
    return Math.abs(held) < 2 ? 0 : round(held);
  }

  // src/memo/model.ts
  var MEMO_PLACES = ["all", "character", "chat"];
  var emptyMemos = () => ({ version: 1, memos: [], showButton: true, dockIcon: "📝" });
  function newMemo(text7, at = Date.now(), owner) {
    return { id: newId("memo"), text: text7.trim(), createdAt: at, ...owner ? { owner } : {} };
  }
  function normalizeOwner(raw) {
    if (!raw || typeof raw !== "object") return void 0;
    const r = raw;
    if (typeof r.chatId === "string" && r.chatId) return { chatId: r.chatId };
    if (Array.isArray(r.characterIds)) {
      const ids = [...new Set(r.characterIds.filter((x) => typeof x === "string" && !!x))].sort();
      if (ids.length) return { characterIds: ids };
    }
    return void 0;
  }
  var isPlace = (v) => MEMO_PLACES.includes(v);
  function normalizeMemos(raw) {
    const base = emptyMemos();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    const icon2 = r.dockIcon;
    const folders = normalizeFolders(r.folders);
    const folderIds = new Set(folders.map((f) => f.id));
    const memos = Array.isArray(r.memos) ? r.memos.filter((m2) => m2 && typeof m2.text === "string").map((m2) => {
      const owner = normalizeOwner(m2.owner);
      return {
        id: typeof m2.id === "string" ? m2.id : newId("memo"),
        ...typeof m2.title === "string" && m2.title.trim() ? { title: m2.title.trim() } : {},
        text: m2.text,
        createdAt: Number(m2.createdAt) || 0,
        ...m2.pinned ? { pinned: true } : {},
        ...owner ? { owner } : {},
        // a folder deleted (on another device too) leaves its memos in no folder
        ...typeof m2.folder === "string" && folderIds.has(m2.folder) ? { folder: m2.folder } : {}
      };
    }) : [];
    const boards = normalizeBoards(r.boards, memos);
    const themes = normalizeSavedThemes(r.themes);
    return {
      version: 1,
      memos,
      showButton: r.showButton !== false,
      dockIcon: typeof icon2 === "string" && icon2.trim() ? icon2.trim() : base.dockIcon,
      ...r.capture === false ? { capture: false } : {},
      ...isPlace(r.savePlace) && r.savePlace !== "all" ? { savePlace: r.savePlace } : {},
      ...boards.length ? { boards } : {},
      ...themes.length ? { themes } : {},
      ...folders.length ? { folders } : {}
    };
  }
  function normalizeFolders(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const f of raw) {
      if (!f || typeof f.id !== "string" || !f.id || out.some((x) => x.id === f.id)) continue;
      out.push({ id: f.id, name: (typeof f.name === "string" && f.name.trim() ? f.name.trim() : "Folder").slice(0, 40) });
    }
    return out;
  }
  function newFolder(name) {
    return { id: newId("folder"), name: name.trim().slice(0, 40) || "Folder" };
  }
  var memosInFolder = (memos, folder2) => folder2 === "all" ? memos : memos.filter((m2) => m2.folder === folder2);
  function placeOf(owner) {
    return !owner ? "all" : "chatId" in owner ? "chat" : "character";
  }
  function placeHere(place2, scope) {
    if (place2 === "chat") return scope.chatId ? "chat" : "all";
    if (place2 === "character") return scope.characterIds.length ? "character" : "all";
    return "all";
  }
  function ownerFor(place2, scope) {
    const here = placeHere(place2, scope);
    if (here === "chat") return { chatId: scope.chatId };
    if (here === "character") return { characterIds: [...new Set(scope.characterIds)].sort() };
    return void 0;
  }
  function isVisible(m2, scope) {
    const o = m2.owner;
    if (!o) return true;
    if ("chatId" in o) return o.chatId === scope.chatId;
    return o.characterIds.every((id) => scope.characterIds.includes(id));
  }
  function visibleMemos(memos, scope) {
    return memos.filter((m2) => isVisible(m2, scope));
  }
  function memosOf(memos, scope, place2) {
    return visibleMemos(memos, scope).filter((m2) => placeOf(m2.owner) === place2);
  }
  var RECENT_IN_DOCK = 4;
  function dockMemos(memos, scope, recent = RECENT_IN_DOCK) {
    const here = visibleMemos(memos, scope).sort((a, b) => b.createdAt - a.createdAt);
    return { recent: here.filter((m2) => !m2.pinned).slice(0, recent), pinned: here.filter((m2) => m2.pinned) };
  }
  function memosFrom(text7, at = Date.now(), owner) {
    return extractOocNotes(text7).map((t2) => t2.trim()).filter(Boolean).map((t2, i) => newMemo(t2, at + i, owner && structuredClone(owner)));
  }
  function memoLabel(m2, max) {
    return m2.title?.trim() || oneLine(plainText(m2.text), max);
  }
  var fold = (s) => s.normalize("NFC").toLowerCase();
  function shownMemos(memos, query = "") {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return memos.filter((m2) => words.every((w) => fold(`${m2.title ?? ""} ${m2.text}`).includes(w))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt - a.createdAt);
  }

  // src/host/fonts.ts
  var faces = null;
  var added = /* @__PURE__ */ new Set();
  function load() {
    faces ??= api("/fonts").then((list) => {
      const map = /* @__PURE__ */ new Map();
      for (const f of Array.isArray(list) ? list : []) {
        if (!f || typeof f.family !== "string" || typeof f.url !== "string") continue;
        map.set(f.family, [...map.get(f.family) ?? [], f]);
      }
      return map;
    }).catch(() => {
      faces = null;
      return /* @__PURE__ */ new Map();
    });
    return faces;
  }
  async function installedFonts() {
    return [...(await load()).keys()].sort((a, b) => a.localeCompare(b));
  }
  async function useFont(family) {
    const name = family.trim().replace(/^['"]|['"]$/g, "");
    if (!name || added.has(name) || typeof FontFace === "undefined") return;
    const files = (await load()).get(name);
    if (!files) return;
    added.add(name);
    for (const f of files) {
      const descriptors = { weight: String(f.weight ?? "400"), style: f.style ?? "normal", display: "swap" };
      if (f.unicodeRange) descriptors.unicodeRange = f.unicodeRange;
      try {
        document.fonts.add(new FontFace(name, `url("${f.url}")`, descriptors));
      } catch {
      }
    }
  }

  // src/host/global-gallery.ts
  var FOLDER = "Dispensa";
  var folderId = null;
  function folder() {
    folderId ??= (async () => {
      const folders = await api("/global-gallery/folders");
      const found = Array.isArray(folders) ? folders.find((f) => f?.name === FOLDER) : void 0;
      if (found) return found.id;
      return (await api("/global-gallery/folders", { method: "POST", body: { name: FOLDER } })).id;
    })().catch((e) => {
      folderId = null;
      throw e;
    });
    return folderId;
  }
  function lookUpFolder() {
    folderId = null;
    return folder();
  }
  async function boardImages() {
    const id = await folder();
    const list = await picturesIn(id);
    if (list.length) return list;
    const again = await lookUpFolder();
    return again === id ? list : picturesIn(again);
  }
  async function picturesIn(id) {
    const list = await api(`/global-gallery?folderId=${encodeURIComponent(id)}`);
    return (Array.isArray(list) ? list : []).filter((i) => typeof i?.id === "string" && typeof i.url === "string").sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))).map((i) => ({ id: i.id, url: i.url }));
  }
  async function uploadBoardImage(file) {
    const id = await folder();
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await (getMarinara().fetch ?? fetch)(`/api/global-gallery/upload?folderId=${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "x-marinara-csrf": "1", Accept: "application/json" },
      body: form,
      credentials: "same-origin"
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.id || !body.url) throw new Error(body?.error || t(`Upload failed (${res.status}).`, `올리지 못했어요 (${res.status}).`));
    if (body.folderId !== void 0 && body.folderId !== id) {
      const again = await lookUpFolder();
      await api(`/global-gallery/${encodeURIComponent(body.id)}`, { method: "PATCH", body: { folderId: again } }).catch(() => void 0);
    }
    return { id: body.id, url: body.url };
  }
  async function deleteBoardImage(id) {
    await api(`/global-gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // src/host/storage-size.ts
  var encoder = new TextEncoder();
  function utf8Bytes(text7) {
    return encoder.encode(text7).length;
  }
  function entryBytes(key2, value) {
    return utf8Bytes(JSON.stringify(key2)) + 1 + utf8Bytes(JSON.stringify(value ?? null));
  }
  function objectBytes(entries) {
    let sum = 0;
    let n = 0;
    for (const b of entries) {
      sum += b;
      n++;
    }
    return 2 + sum + Math.max(0, n - 1);
  }
  function entriesOf(stored) {
    return new Map(Object.entries(stored).map(([k, v]) => [k, entryBytes(k, v)]));
  }

  // src/host/persisted-store.ts
  var STORAGE_LIMIT = 1e6;
  var STORAGE_SOFT_LIMIT = 9e5;
  var STORAGE_SHOW_FROM = 7e5;
  var SAVE_DELAY_MS = 400;
  var RETRY_MS = [5e3, 2e4, 6e4];
  var MAX_RETRIES = 10;
  var storedEntries = /* @__PURE__ */ new Map();
  function remember(stored) {
    storedEntries = entriesOf(stored);
  }
  var PersistedStore = class {
    constructor(spec) {
      this.spec = spec;
      this.state = spec.normalize(void 0);
    }
    state;
    listeners = /* @__PURE__ */ new Set();
    saveTimer = null;
    loadedOk = false;
    /** The stored keys as JSON when this tab last read or wrote them. */
    base = {};
    /** Changes made here since the last save, to replay on a newer stored value. */
    pending = [];
    /** The save in progress: a refresh waits for it, and saves run one at a time. */
    saving = null;
    /** Saves failed in a row (picks the retry wait). */
    failures = 0;
    /** Called on the first failure after a save that worked; `full`: past Marinara's limit. */
    onSaveError = null;
    /** Loaded from storage (writes are safe). */
    get ready() {
      return this.loadedOk;
    }
    get value() {
      return this.state;
    }
    async load() {
      try {
        const parts3 = this.partsOf(await this.readStorage());
        const fresh = !Object.keys(parts3).length && !!this.spec.initial;
        this.state = fresh ? this.spec.initial() : this.spec.normalize(this.rawOf(parts3));
        this.base = parts3;
        this.pending = [];
        this.loadedOk = true;
        if (fresh) this.scheduleSave();
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
    /** Like subscribe, but `fn` runs only when the slice `pick` returns has changed (compared as JSON). */
    select(pick2, fn) {
      const key2 = (s) => {
        const v = pick2(s);
        return typeof v === "string" ? v : JSON.stringify(v);
      };
      let last = key2(this.state);
      return this.subscribe((s) => {
        const next = key2(s);
        if (next === last) return;
        last = next;
        fn(s);
      });
    }
    update(mutate) {
      mutate(this.state);
      this.pending.push(mutate);
      this.emit();
      this.scheduleSave();
    }
    /** Takes what another device saved meanwhile (when nothing here waits to be saved). */
    async refresh() {
      if (this.saving) await this.saving.catch(() => void 0);
      if (!this.loadedOk || this.pending.length || this.saveTimer || this.saving) return;
      const parts3 = this.partsOf(await this.readStorage());
      if (this.pending.length || this.saveTimer || this.saving) return;
      if (!Object.keys(parts3).length || sameParts(parts3, this.base)) return;
      this.state = this.spec.normalize(this.rawOf(parts3));
      this.base = parts3;
      this.emit();
    }
    owns(key2) {
      return key2 === this.spec.key || !!this.spec.split && key2.startsWith(`${this.spec.key}:`);
    }
    /** This store's key sizes once saved, emptied parts included (Marinara keeps them as null). */
    storedSizes() {
      const out = /* @__PURE__ */ new Map();
      if (!this.loadedOk || !this.pending.length && !this.saveTimer && !this.saving) {
        for (const [k, b] of storedEntries) if (this.owns(k)) out.set(k, b);
        return out;
      }
      for (const [k, v] of Object.entries(this.parts())) if (v != null) out.set(k, entryBytes(k, v));
      for (const k of storedEntries.keys()) if (this.owns(k) && !out.has(k)) out.set(k, entryBytes(k, null));
      return out;
    }
    /** Bytes of this store's keys, to warn before Marinara's limit. */
    size() {
      let sum = 0;
      for (const b of this.storedSizes().values()) sum += b;
      return sum;
    }
    /** Saves waiting changes now (leaving the page); no request when there are none. */
    flush() {
      if (!this.saveTimer && !this.pending.length) return (this.saving ?? Promise.resolve()).catch(() => void 0);
      return this.saveNow();
    }
    async saveNow() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = null;
      if (!this.loadedOk) return;
      while (this.saving) await this.saving.catch(() => void 0);
      this.saving = this.write().then(
        () => {
          this.failures = 0;
        },
        (e) => {
          this.failed(e);
          throw e;
        }
      ).finally(() => this.saving = null);
      return this.saving;
    }
    /** Schedules a retry (the changes stay in `pending`); tells the person on the first failure. */
    failed(error) {
      console.error(`[Dispensa] ${this.spec.label} save failed`, error);
      const wait = RETRY_MS[Math.min(this.failures, RETRY_MS.length - 1)];
      if (this.failures++ === 0) this.onSaveError?.({ full: storageUsed([this]) > STORAGE_LIMIT, error });
      if (!this.saveTimer && this.failures <= MAX_RETRIES) this.saveTimer = setTimeout(() => void this.saveNow().catch(() => void 0), wait);
    }
    parts() {
      return this.spec.split ? this.spec.split(this.state) : { [this.spec.key]: this.state };
    }
    async readStorage() {
      const stored = await getMarinara().storage.get();
      remember(stored);
      return stored;
    }
    async write() {
      let taken = this.pending;
      this.pending = [];
      try {
        const stored = this.partsOf(await this.readStorage());
        taken = [...taken, ...this.pending];
        this.pending = [];
        if (Object.keys(stored).length && !sameParts(stored, this.base)) {
          const next = this.spec.normalize(this.rawOf(stored));
          for (const op of taken) {
            try {
              op(next);
            } catch (e) {
              console.warn(`[Dispensa] ${this.spec.label}: a change could not be replayed`, e);
            }
          }
          this.state = next;
          this.emit();
        }
        const out = {};
        for (const [k, v] of Object.entries(this.parts())) if (v != null) out[k] = JSON.stringify(v);
        const patch = {};
        for (const [k, v] of Object.entries(out)) if (stored[k] !== v) patch[k] = JSON.parse(v);
        for (const k of Object.keys(stored)) if (!(k in out)) patch[k] = null;
        if (Object.keys(patch).length) {
          const after = await getMarinara().storage.patch(patch);
          if (after && typeof after === "object") remember(after);
        }
        this.base = out;
      } catch (e) {
        this.pending = [...taken, ...this.pending];
        throw e;
      }
    }
    /** This store's keys in what storage holds, as JSON (parts written as null are gone). */
    partsOf(stored) {
      const out = {};
      for (const [k, v] of Object.entries(stored)) {
        if (v == null || !this.owns(k)) continue;
        out[k] = JSON.stringify(v);
      }
      return out;
    }
    rawOf(parts3) {
      if (!this.spec.join) return parts3[this.spec.key] === void 0 ? void 0 : JSON.parse(parts3[this.spec.key]);
      return this.spec.join(Object.fromEntries(Object.entries(parts3).map(([k, v]) => [k, JSON.parse(v)])));
    }
    scheduleSave() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => void this.saveNow().catch(() => void 0), SAVE_DELAY_MS);
    }
    emit() {
      for (const fn of this.listeners) fn(this.state);
    }
  };
  function sameParts(a, b) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
  }
  function storageUsed(stores) {
    const all = new Map(storedEntries);
    for (const s of stores) {
      if (!s) continue;
      for (const k of all.keys()) if (s.owns(k)) all.delete(k);
      for (const [k, b] of s.storedSizes()) all.set(k, b);
    }
    return objectBytes(all.values());
  }

  // src/memo/store.ts
  var MEMO = "memo:m:";
  var BOARD = "memo:b:";
  function splitMemos(s) {
    const { memos, boards, ...rest } = s;
    const parts3 = { memo: { ...rest, order: memos.map((m2) => m2.id), boardOrder: (boards ?? []).map((b) => b.id) } };
    for (const m2 of memos) parts3[MEMO + m2.id] = m2;
    for (const b of boards ?? []) parts3[BOARD + b.id] = b;
    return parts3;
  }
  function inOrder(items, order, age) {
    const ids = Array.isArray(order) ? order.filter((x) => typeof x === "string") : [];
    const rank = new Map(ids.map((id, i) => [id, i]));
    return [...items].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || age(a) - age(b));
  }
  function joinMemos(parts3) {
    const main = parts3.memo && typeof parts3.memo === "object" ? parts3.memo : {};
    const own = (prefix) => Object.entries(parts3).filter(([k, v]) => k.startsWith(prefix) && v && typeof v === "object").map(([k, v]) => ({ ...v, id: k.slice(prefix.length) }));
    const memos = own(MEMO);
    const boards = own(BOARD);
    const merge2 = (old, split2) => [...Array.isArray(old) ? old.filter((x) => !split2.some((y) => y.id === x?.id)) : [], ...split2];
    return {
      ...main,
      memos: Array.isArray(main.memos) ? merge2(main.memos, memos) : inOrder(memos, main.order, (m2) => Number(m2.createdAt) || 0),
      boards: Array.isArray(main.boards) ? merge2(main.boards, boards) : inOrder(boards, main.boardOrder, () => 0)
    };
  }
  var MemoStore = class extends PersistedStore {
    constructor() {
      super({ key: "memo", normalize: normalizeMemos, split: splitMemos, join: joinMemos, label: "memo" });
    }
  };

  // src/qr/dock.ts
  function shownDock(state) {
    const out = [];
    for (const entry of state.dock ?? []) {
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
  function onDock(state, entry) {
    return (state.dock ?? []).some((e) => same2(e, entry));
  }
  function addToDock(state, entry, index) {
    const entries = state.dock ??= [];
    if (entries.some((e) => same2(e, entry))) return;
    entries.splice(index === void 0 ? entries.length : Math.max(0, Math.min(index, entries.length)), 0, entry);
  }
  function removeFromDock(state, entry) {
    if (state.dock) state.dock = state.dock.filter((e) => !same2(e, entry));
  }
  function layoutOf(entry, set) {
    if (entry.kind !== "set") return "folder";
    return entry.layout ?? (set.display === "inline" ? "row" : "folder");
  }
  function setLayout(state, setId, layout) {
    for (const e of state.dock ?? []) if (e.kind === "set" && e.setId === setId) e.layout = layout;
  }
  function dockFlow(state) {
    const flow = state.dockFlow ?? "wrap";
    if (flow === "wrap") return { flow, span: 0 };
    const { min, max, default: fallback } = DOCK_SPAN[flow];
    const span = state.dockSpan;
    return { flow, span: typeof span === "number" ? Math.max(min, Math.min(max, Math.round(span))) : fallback };
  }
  function dockSlice(state) {
    return JSON.stringify(state, (key2, value) => key2 === "script" ? typeof value === "string" && value.trim() !== "" : value);
  }

  // src/qr/control.ts
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
      if (changes.message !== void 0) {
        item.script = changes.message;
        delete item.steps;
      }
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
      for (const { key: key2, info } of AUTO_TRIGGERS) {
        const v = changes[info];
        if (v === void 0) continue;
        if (v) auto[key2] = true;
        else delete auto[key2];
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
      if (!found) throw new Error(ref2.id !== void 0 ? t(`No QR #${ref2.id} in set "${ref2.set}"`, `"${ref2.set}" 세트에 QR #${ref2.id}가 없어요`) : t(`No QR "${ref2.label}" in set "${ref2.set}"`, `"${ref2.set}" 세트에 "${ref2.label}" QR이 없어요`));
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
          id: set.items.indexOf(i) + 1,
          icon: i.icon ?? "",
          showLabel: i.showLabel !== false,
          label: i.label,
          title: i.title ?? "",
          message: i.script,
          contextList: (i.contextList ?? []).map((l) => ({ set: setName(l.setId), isChained: !!l.chained })).filter((l) => l.set),
          preventAutoExecute: i.preventAuto !== false,
          isHidden: !!i.hidden,
          automationId: i.automationId ?? "",
          ...Object.fromEntries(AUTO_TRIGGERS.map(({ key: key2, st }) => [st, !!i.auto?.[key2]])),
          // Dispensa's own keys
          set: set.name,
          hidden: !!i.hidden,
          ...Object.fromEntries(AUTO_TRIGGERS.map(({ key: key2, info }) => [info, !!i.auto?.[key2]]))
        };
      },
      create: (info, dialect) => store.update((st) => {
        let set = findSet(st, info.set);
        if (!set) {
          set = newSet(info.set);
          st.sets.push(set);
        }
        const item = newItem(info.label, info.message ?? "", dialect);
        if (dialect === "st") item.note = t("Made with /qr-create by a QR counting from #0.", "0번부터 세는 QR이 /qr-create로 만든 QR이에요.");
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
          if (result) addToDock(st, { kind: "set", setId: set.id });
          else removeFromDock(st, { kind: "set", setId: set.id });
        });
        return result;
      },
      setForChat: (name, state) => {
        const chat = scope().chatId;
        if (!chat) throw new Error(t("No chat is open", "열려 있는 채팅이 없어요"));
        let result = false;
        store.update((st) => {
          const set = findSet(st, name);
          if (!set) throw new Error(t(`No QR set "${name}"`, `"${name}" QR 세트가 없어요`));
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
        if (!target) throw new Error(t(`No QR set "${name}"`, `"${name}" QR 세트가 없어요`));
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
      dockVisible: (state) => {
        let result = true;
        store.update((st) => {
          st.dockVisible = state ?? !st.dockVisible;
          result = st.dockVisible;
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
      run: async (name, signal) => {
        const found = findItem(store.value, name);
        if (!found) throw new Error(t(`No Quick Reply named "${name}"`, `"${name}"(이)라는 QR이 없어요`));
        await runner().runNested(found.set, found.item, signal);
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

  // src/qr/recent.ts
  var RECENT_KEY = "dispensa:qr-recent";
  var RECENT_MAX = 20;
  function parseRecent(text7) {
    if (!text7) return [];
    try {
      const raw = JSON.parse(text7);
      if (!Array.isArray(raw)) return [];
      return raw.filter((r) => !!r && typeof r === "object" && typeof r.setId === "string" && typeof r.itemId === "string" && typeof r.at === "number" && Number.isFinite(r.at)).map(({ setId, itemId, at }) => ({ setId, itemId, at })).slice(0, RECENT_MAX);
    } catch {
      return [];
    }
  }
  function addRecent(list, run) {
    return [run, ...list.filter((r) => r.itemId !== run.itemId)].slice(0, RECENT_MAX);
  }
  function recentItems(state, list, limit = RECENT_MAX) {
    const out = [];
    for (const r of list) {
      if (out.length >= limit) break;
      const set = state.sets.find((s) => s.items.some((i) => i.id === r.itemId));
      const item = set?.items.find((i) => i.id === r.itemId);
      if (set && item) out.push({ set, item, at: r.at });
    }
    return out;
  }
  var RecentRuns = class {
    constructor(storage, now = Date.now) {
      this.storage = storage;
      this.now = now;
    }
    list() {
      try {
        return parseRecent(this.storage.read());
      } catch {
        return [];
      }
    }
    record(set, item) {
      try {
        this.storage.write(JSON.stringify(addRecent(this.list(), { setId: set.id, itemId: item.id, at: this.now() })));
      } catch {
      }
    }
    shown(state, limit) {
      return recentItems(state, this.list(), limit);
    }
  };
  function localRecentStorage(key2 = RECENT_KEY) {
    return {
      read: () => {
        try {
          return globalThis.localStorage?.getItem(key2) ?? null;
        } catch {
          return null;
        }
      },
      write: (text7) => {
        try {
          globalThis.localStorage?.setItem(key2, text7);
        } catch {
        }
      }
    };
  }

  // src/qr/gallery-run.ts
  function over(target, replaced) {
    return new Proxy(target, {
      get(obj, key2) {
        if (typeof key2 === "string" && Object.prototype.hasOwnProperty.call(replaced, key2)) return replaced[key2];
        const v = Reflect.get(obj, key2, obj);
        return typeof v === "function" ? v.bind(obj) : v;
      }
    });
  }
  function inRunOnly(base) {
    const mine = /* @__PURE__ */ new Map();
    return {
      get: (n) => mine.has(n) ? mine.get(n) ?? void 0 : base.get(n),
      set: (n, v) => void mine.set(n, v),
      delete: (n) => void mine.set(n, null),
      has: (n) => mine.has(n) ? mine.get(n) !== null : base.has(n),
      entries: () => {
        const all = new Map(base.entries());
        for (const [k, v] of mine) {
          if (v === null) all.delete(k);
          else all.set(k, v);
        }
        return [...all];
      }
    };
  }
  function galleryHost(base, connectionId, title, input, preset, runQr, presetId) {
    const run = { host: base, outputs: [], madePages: 0, failedPages: 0 };
    const refuse = (what) => async () => {
      throw new ScriptError(t(`${what}: this changes the chat, so it doesn't run from the Gallery.`, `${what}: 채팅을 바꾸는 명령이라 갤러리에서는 실행되지 않아요.`));
    };
    const chat = over(base.chat, {
      send: async (o) => void run.outputs.push(o.text),
      generate: (o) => base.chat.generate({ ...o, connectionId: o.connectionId || connectionId || void 0, memory: true, preset: o.preset ?? preset, maxTokens: LONG_REPLY_TOKENS, instruction: true, ...presetId ? { presetId } : {} }),
      setHidden: refuse("/hide"),
      runNativeCommand: refuse(t("Marinara's own commands", "마리나라 명령")),
      continueLast: refuse("/continue"),
      regenerate: refuse("/regenerate"),
      trigger: refuse("/trigger"),
      addSwipe: refuse("/addswipe"),
      deleteMessages: refuse("/del"),
      openRandomCharacter: refuse("/random")
    });
    const ui = over(base.ui, { setInput: (text7) => void (text7 && run.outputs.push(text7)), loader: () => void 0 });
    const marinara2 = base.marinara ? over(base.marinara, {
      patchTracker: refuse("/tracker-set"),
      retryAgents: refuse("/agents-retry"),
      createEntry: refuse(t("Adding a lorebook entry", "로어북 항목 추가")),
      patchEntry: refuse(t("Changing a lorebook entry", "로어북 항목 수정")),
      chatBook: (create) => create ? refuse(t("Making the chat's lorebook", "채팅 로어북 만들기"))() : base.marinara.chatBook(false),
      updateCharacter: refuse(t("Changing a character", "캐릭터 수정")),
      setConnection: refuse("/connection"),
      renameChat: refuse(t("Renaming the chat", "채팅 이름 바꾸기")),
      newChat: refuse(t("A new chat", "새 채팅")),
      setAuthorNote: refuse(t("The author's note", "작가 노트")),
      reloadPage: refuse("/reload-page")
    }) : void 0;
    const visz = base.visz ? {
      run: async (text7, options) => {
        const ok = await base.visz.run(text7, { ...options, gallery: { connectionId, title, input } });
        if (ok) run.madePages++;
        else run.failedPages++;
        return ok;
      }
    } : void 0;
    const qr2 = base.qr ? over(base.qr, {
      run: (name) => runQr ? runQr(name, run.host) : refuse("/qr")(),
      runLater: () => {
        throw new ScriptError(t("/qr-later: this changes the chat, so it doesn't run from the Gallery.", "/qr-later: 채팅을 바꾸는 명령이라 갤러리에서는 실행되지 않아요."));
      }
    }) : void 0;
    const local = inRunOnly(base.local);
    if (input !== void 0) local.set("input", input);
    const memo2 = base.memo && input !== void 0 ? over(base.memo, { pick: async () => input }) : base.memo;
    const confirm = refuse(t("Deleting or changing messages", "메시지 지우기·바꾸기"));
    run.host = over(base, { chat, ui, marinara: marinara2, visz, qr: qr2, local, confirm, memo: memo2 });
    return run;
  }

  // src/qr/runner.ts
  var QrRunner = class {
    constructor(host, registry2, state, events = {}) {
      this.host = host;
      this.registry = registry2;
      this.state = state;
      this.events = events;
    }
    controller = null;
    current = null;
    /** Auto-runs under way (they run alongside a QR started by hand). */
    autoRuns = /* @__PURE__ */ new Set();
    /** /run and /: look QRs up by name. */
    findScript = (name) => {
      const found = findItem(this.state(), name);
      return found ? sourceOf(found.set, found.item) : void 0;
    };
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
    /**
     * The host for a run, telling onPosted what the QR posts and the reply a /trigger it ran
     * brings (read once the chat is idle again).
     */
    posting(item) {
      const posted = this.events.onPosted;
      if (!posted) return this.host;
      const base = this.host;
      const chat = new Proxy(base.chat, {
        get: (obj, key2) => {
          if (key2 === "send") return async (o) => (await obj.send(o), posted(item, o.text));
          if (key2 === "trigger") return async (name) => {
            const since = await this.lastMessageId();
            await obj.trigger(name);
            void this.replyAfter(item, since);
          };
          const v = Reflect.get(obj, key2, obj);
          return typeof v === "function" ? v.bind(obj) : v;
        }
      });
      return new Proxy(base, { get: (obj, key2) => key2 === "chat" ? chat : ((v) => typeof v === "function" ? v.bind(obj) : v)(Reflect.get(obj, key2, obj)) });
    }
    async lastMessageId() {
      try {
        return (await this.host.chat.messages()).at(-1)?.id ?? null;
      } catch {
        return null;
      }
    }
    /** The chat's reply to what the QR sent, once it is done. */
    async replyAfter(item, since) {
      try {
        if (!await this.host.chat.waitForIdle?.(10 * 6e4)) return;
        const all = await this.host.chat.messages();
        const at = since ? all.findIndex((m2) => m2.id === since) : -1;
        if (since && at < 0) return;
        const from = at + 1;
        const reply = all.slice(from).find((m2) => m2.role !== "user");
        if (reply) this.events.onPosted?.(item, reply.content);
      } catch {
      }
    }
    /**
     * Runs a QR from the Gallery: it reads the chat but doesn't change it, uses `connectionId` with
     * the chat's context, and doesn't wait for (or block) other runs. Returns what it made: the text
     * it would have posted, else what it returned, or null when the visualizer saved it already.
     */
    async runInGallery(set, item, connectionId, input, title = item.label, preset, presetId) {
      const controller = new AbortController();
      const runQr = async (name, host) => {
        const found = this.host.qr?.source(name);
        if (!found) throw new ScriptError(t(`No Quick Reply named "${name}"`, `"${name}"(이)라는 QR이 없어요`));
        const rt = new Runtime({ host, registry: this.registry, dialect: found.dialect, signal: controller.signal, findScript: this.findScript });
        if (found.script.trimStart().startsWith("/")) await rt.runScript(found.script);
        else run.outputs.push(String(await rt.substitute(found.script, new Scope())));
      };
      const run = galleryHost(this.host, connectionId, title, input, preset, runQr, presetId);
      this.autoRuns.add(controller);
      try {
        let pipe = "";
        if (item.script.trimStart().startsWith("/")) {
          const rt = new Runtime({ host: run.host, registry: this.registry, dialect: item.dialect, signal: controller.signal, findScript: this.findScript, source: { label: `${set.name}.${item.label}`, text: item.script } });
          const result = await rt.runScript(item.script);
          if (result.aborted && result.abortReason) throw new ScriptError(result.abortReason);
          pipe = asText(result.pipe);
        } else {
          await run.host.beginRun?.();
          const prompt = String(await new Runtime({ host: run.host, registry: this.registry, dialect: item.dialect }).substitute(item.script, new Scope()));
          run.outputs.push(await run.host.chat.generate({ mode: "chat", prompt }));
        }
        const made = run.outputs.filter((x) => x.trim()).join("\n\n");
        if (made) return made;
        if (run.madePages || run.failedPages) return null;
        return pipe.trim() && pipe !== "true" && pipe !== "false" ? pipe : "";
      } finally {
        this.autoRuns.delete(controller);
      }
    }
    async execute(set, item, controller, auto) {
      try {
        const script = item.script;
        if (script.trimStart().startsWith("/")) {
          const rt = new Runtime({
            host: this.posting(item),
            registry: this.registry,
            dialect: item.dialect,
            signal: controller.signal,
            findScript: this.findScript,
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
    /** Run from the QR editor: returns the pipe or the thrown error, optionally stopping in the debugger. */
    async runInEditor(set, item, options) {
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
        findScript: this.findScript,
        source: { label: `${set.name}.${item.label}`, text: item.script }
      });
      const result = await rt.runScript(item.script);
      return { pipe: asText(result.pipe), aborted: result.aborted ? result.abortReason || t("Stopped", "중단됨") : void 0 };
    }
    /** Run a QR from inside a running QR (/qr). It stops with the caller's `signal`, else with the stop button. */
    async runNested(set, item, signal) {
      if (!item.script.trimStart().startsWith("/")) {
        await this.sendPlain(set, item.script, item);
        return;
      }
      const rt = new Runtime({
        host: this.posting(this.current ?? item),
        registry: this.registry,
        dialect: item.dialect,
        signal: signal ?? this.controller?.signal,
        findScript: this.findScript
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
      const since = await this.lastMessageId();
      await submitThroughComposer(line);
      if (this.events.onPosted) void this.replyAfter(item, since);
    }
  };
  function sourceOf(set, item) {
    return { script: item.script, dialect: item.dialect, label: item.label, setName: set.name };
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
        const passOn = link.chained ? script : null;
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

  // src/qr/search.ts
  var CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  var PLAIN_RUN = /[\t\n\r\x20-\x7F\uAC00-\uD7A3]+(?![\p{M}\u1160-\u11FF\uD7B0-\uD7FF])/gu;
  var CLUSTER = /.[\p{M}\u1160-\u11FF\uD7B0-\uD7FF]*/gsu;
  var COMPAT_JAMO = /^[\u3131-\u318E]$/;
  var isConsonant = (c) => c >= "ㄱ" && c <= "ㅎ";
  function foldCluster(c) {
    if (COMPAT_JAMO.test(c)) return c;
    return c.normalize("NFKC").toLowerCase().replace(/[\u1100-\u1112]/g, (j) => CHO[j.charCodeAt(0) - 4352]);
  }
  function foldText(raw, track) {
    const parts3 = [];
    let length = 0;
    let from = null;
    let to = null;
    const push = (folded, at, size) => {
      if (track && !from && folded.length !== size) {
        from = Array.from({ length }, (_, i) => i);
        to = from.map((i) => i + 1);
      }
      if (from && to) {
        for (let i = 0; i < folded.length; i++) {
          const same3 = folded.length === size;
          from.push(same3 ? at + i : at);
          to.push(same3 ? at + i + 1 : at + size);
        }
      }
      parts3.push(folded);
      length += folded.length;
    };
    const other = (start2, end) => {
      if (start2 >= end) return;
      for (const m2 of raw.slice(start2, end).matchAll(CLUSTER)) push(foldCluster(m2[0]), start2 + m2.index, m2[0].length);
    };
    let last = 0;
    for (const m2 of raw.matchAll(PLAIN_RUN)) {
      other(last, m2.index);
      push(m2[0].toLowerCase(), m2.index, m2[0].length);
      last = m2.index + m2[0].length;
    }
    other(last, raw.length);
    return { raw, norm: parts3.join(""), from, to };
  }
  function initials(norm) {
    let out = "";
    for (let i = 0; i < norm.length; i++) {
      const code = norm.charCodeAt(i);
      out += code >= 44032 && code <= 55203 ? CHO[Math.floor((code - 44032) / 588)] : norm[i];
    }
    return out;
  }
  function foldScript(raw) {
    return raw.normalize("NFKC").toLowerCase().replace(/[\u1100-\u1112]/g, (j) => CHO[j.charCodeAt(0) - 4352]);
  }
  function foldName(raw) {
    const f = foldText(raw, true);
    f.cho = initials(f.norm);
    return f;
  }
  var foldOptional = (raw) => raw?.trim() ? foldText(raw, true) : void 0;
  function rawRange(f, s, e) {
    return f.from && f.to ? [f.from[s], f.to[e - 1]] : [s, e];
  }
  function merge(ranges) {
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const r of sorted) {
      const last = out[out.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else out.push([r[0], r[1]]);
    }
    return out;
  }
  var MAX_MENU_ENTRIES = 5e3;
  function buildIndex(state, options = {}) {
    const sets = [];
    const items = [];
    let menuEntries = 0;
    const addMenu = (groups, path) => {
      for (const g of groups) {
        for (const entry of g.entries) {
          if (menuEntries++ >= MAX_MENU_ENTRIES) return;
          items.push({ set: entry.set, item: entry.item, run: entry.run, path, name: foldName(entry.item.label), parents: foldText(path.join(" › "), true) });
          if (entry.children.length) addMenu(entry.children, [...path, entry.item.label]);
        }
      }
    };
    for (const set of state.sets) {
      sets.push({ set, name: foldName(set.name) });
      for (const item of set.items) {
        items.push({
          set,
          item,
          run: item,
          path: [],
          name: foldName(item.label),
          title: foldOptional(item.title),
          icon: foldOptional(item.icon),
          lore: foldOptional(item.automationId),
          body: item.script ? foldScript(item.script) : void 0
        });
        if ((options.menus ?? true) && item.contextList?.length) addMenu(contextMenu(state, set, item), [item.label]);
      }
    }
    return { sets, items };
  }
  function indexCache(options = {}) {
    let state = null;
    let index = null;
    return {
      get(now) {
        if (now !== state || !index) {
          state = now;
          index = buildIndex(now, options);
        }
        return index;
      },
      invalidate() {
        index = null;
      }
    };
  }
  var SCORE = { exact: 100, prefix: 80, word: 60, contains: 40, initials: 20, other: 10, body: 5 };
  function parseQuery(query) {
    const texts = foldText(query, false).norm.split(/\s+/).filter(Boolean);
    return { terms: texts.map((text7) => ({ text: text7, cho: [...text7].some(isConsonant) })), whole: texts.join(" ") };
  }
  var WORD = /[\p{L}\p{N}]/u;
  function inName(f, term) {
    let first = -1;
    for (let at = f.norm.indexOf(term.text); at >= 0; at = f.norm.indexOf(term.text, at + 1)) {
      if (at === 0) return { score: SCORE.prefix, at };
      if (!WORD.test(f.norm[at - 1])) return { score: SCORE.word, at };
      if (first < 0) first = at;
    }
    if (first >= 0) return { score: SCORE.contains, at: first };
    if (!term.cho || !f.cho) return null;
    const n = term.text.length;
    outer: for (let p = 0; p + n <= f.norm.length; p++) {
      for (let i = 0; i < n; i++) {
        const q = term.text[i];
        if (isConsonant(q) ? f.cho[p + i] !== q : f.norm[p + i] !== q) continue outer;
      }
      return { score: SCORE.initials, at: p };
    }
    return null;
  }
  var isExact = (f, whole) => f.norm.trim().split(/\s+/).join(" ") === whole;
  function scoreSet(x, terms, whole) {
    if (isExact(x.name, whole)) return { set: x.set, score: SCORE.exact, marks: [[0, x.name.raw.length]] };
    let score = SCORE.exact;
    const marks = [];
    for (const term of terms) {
      const m2 = inName(x.name, term);
      if (!m2) return null;
      score = Math.min(score, m2.score);
      marks.push(rawRange(x.name, m2.at, m2.at + term.text.length));
    }
    return { set: x.set, score, marks: merge(marks) };
  }
  function scoreItem(x, terms, whole, body) {
    const fields = /* @__PURE__ */ new Set();
    const marks = {};
    const mark = (field, f, at, term) => {
      fields.add(field);
      (marks[field] ??= []).push(rawRange(f, at, at + term.text.length));
    };
    const exact = isExact(x.name, whole);
    if (exact) {
      fields.add("name");
      marks.name = [[0, x.name.raw.length]];
    }
    let score = SCORE.exact;
    for (const term of terms) {
      let best = 0;
      const m2 = exact ? null : inName(x.name, term);
      if (m2) {
        best = m2.score;
        mark("name", x.name, m2.at, term);
      }
      if (exact) best = SCORE.exact;
      for (const field of ["title", "icon", "lore"]) {
        const f = x[field];
        const at = f ? f.norm.indexOf(term.text) : -1;
        if (f && at >= 0) {
          best = Math.max(best, SCORE.other);
          mark(field, f, at, term);
        }
      }
      if (x.parents) {
        const at = x.parents.norm.indexOf(term.text);
        if (at >= 0) {
          best = Math.max(best, SCORE.other);
          mark("path", x.parents, at, term);
        }
      }
      if (body && x.body && x.body.includes(term.text)) {
        best = Math.max(best, SCORE.body);
        fields.add("body");
      }
      if (!best) return null;
      score = Math.min(score, best);
    }
    for (const k of Object.keys(marks)) marks[k] = merge(marks[k]);
    return { set: x.set, item: x.item, run: x.run, path: x.path, hidden: !!x.item.hidden && !x.path.length, score, fields: [...fields], marks };
  }
  var LINE_MAX = 90;
  function scriptLine(raw, folded, terms) {
    let at = -1;
    for (const term of terms) {
      const i = folded.indexOf(term.text);
      if (i >= 0 && (at < 0 || i < at)) at = i;
    }
    let lineNo = 0;
    for (let i = folded.indexOf("\n"); i >= 0 && i < at; i = folded.indexOf("\n", i + 1)) lineNo++;
    let start2 = 0;
    for (let n = 0; n < lineNo; n++) start2 = raw.indexOf("\n", start2) + 1;
    const end = raw.indexOf("\n", start2);
    let line = raw.slice(start2, end < 0 ? raw.length : end).trim();
    if (line.length > LINE_MAX) {
      const f2 = foldText(line, true);
      let pos = 0;
      for (const term of terms) {
        const i = f2.norm.indexOf(term.text);
        if (i >= 0) {
          pos = rawRange(f2, i, i + term.text.length)[0];
          break;
        }
      }
      const from = Math.max(0, Math.min(pos - 30, line.length - LINE_MAX));
      line = `${from > 0 ? "…" : ""}${line.slice(from, from + LINE_MAX)}${from + LINE_MAX < line.length ? "…" : ""}`;
    }
    const f = foldText(line, true);
    const marks = [];
    for (const term of terms) {
      for (let i = f.norm.indexOf(term.text); i >= 0; i = f.norm.indexOf(term.text, i + term.text.length)) marks.push(rawRange(f, i, i + term.text.length));
    }
    return { text: line, marks: merge(marks) };
  }
  function search(index, query, options = {}) {
    const { terms, whole } = parseQuery(query);
    if (!terms.length) return { sets: [], items: [] };
    const limit = options.limit ?? Infinity;
    const sets = index.sets.flatMap((x) => scoreSet(x, terms, whole) ?? []);
    const folded = /* @__PURE__ */ new Map();
    const items = index.items.flatMap((x) => {
      if (!(options.menus ?? true) && x.path.length) return [];
      const hit = scoreItem(x, terms, whole, !!options.body);
      if (hit && x.body && hit.fields.includes("body")) folded.set(hit, x.body);
      return hit ?? [];
    });
    sets.sort((a, b) => b.score - a.score);
    items.sort((a, b) => b.score - a.score || (a.path.length ? 1 : 0) - (b.path.length ? 1 : 0));
    const shownSets = sets.slice(0, limit);
    const shownItems = items.slice(0, Math.max(0, limit - shownSets.length));
    for (const hit of shownItems) {
      const body = folded.get(hit);
      if (body) hit.line = scriptLine(hit.item.script, body, terms);
    }
    return { sets: shownSets, items: shownItems };
  }

  // src/visz/set.ts
  var VISZ_SET = { name: () => t("Visualizer", "비주얼라이저"), icon: "🌟" };
  var LAST_MESSAGE_SCRIPT = "/visz prompt=last {{lastMessage}}";
  var WIKI_EN = "Recreate the screen of a wiki page about {{char}}, made by {{char}}'s fans. Put {{char}}'s basic profile, team or agency, catchphrase, nicknames and the like in a table, and fill the page with a table of contents: Before debut, After debut, Portfolio, Biography, Other career, Interviews and quotes, Public reception, Incidents, Trivia. Add footnotes with extra details and strikethroughs to show the fans' point of view richly. Style it as fans would decorate a wiki, with {{char}}'s signature color and the signature color of {{char}}'s team (or, without one, {{char}}'s own).";
  var WIKI_KO = "{{char}}의 팬들이 꾸민 {{char}}의 위키 페이지 화면을 구현한다. {{char}}에 대한 기본 신상 정보, 소속팀이나 소속사, 캐치프레이즈, 별명 등을 테이블에 담고 목차로 데뷔 전, 데뷔 후, 포트폴리오, 바이오그래피, 기타 경력, 인터뷰 및 어록, 대중 평가, 사건 사고, 여담을 넣어 내용을 채운다. 부가적인 내용들이 담긴 각주나 취소선들을 넣어 팬들의 시각을 풍부하게 묘사한다. {{char}}의 상징색과 {{char}}의 소속팀(없으면 {{char}} 개인의) 상징색을 활용하여 팬들이 꾸밀 법한 위키 스타일로 구현한다.";
  var VISZ_QRS = () => [
    { label: t("Last message", "마지막 메시지"), icon: "🎬", title: t("A new scene made from the last message", "마지막 메시지로 새 장면 만들기"), script: LAST_MESSAGE_SCRIPT },
    { label: t("Fandom wiki", "팬덤 위키"), icon: "📖", title: t("{{char}}'s wiki page, as the fans made it", "팬들이 꾸민 {{char}}의 위키 페이지"), script: `/visz ${t(WIKI_EN, WIKI_KO)}` }
  ];
  function viszSet() {
    const items = VISZ_QRS().map((v) => ({ ...newItem(v.label, v.script), icon: v.icon, title: v.title }));
    return { ...newSet(VISZ_SET.name()), icon: VISZ_SET.icon, enabled: false, builtin: "visz", items };
  }

  // src/qr/examples.ts
  var COOKING_PROMPT = `SYSTEM_COMMAND: You are a master storyteller and recipe crafter.
A user has made choices for a cooking scenario. Your task is to interpret these choices and generate a story and recipe.

Chef and Recipient:
- The Chef is '{{chef}}'.
- The Recipient is '{{chef:prompt}}'.
You MUST narrate from the Chef's point of view.

User Choices to build the context:
- Main Reason/Situation for Cooking: '{{reason}}'
- Dish Concept: '{{concept}}'
- Special Emotion/Intent/Hidden Meaning: '{{touch}}'
- Recipe Style: '{{recipe_style}}'

Your Task:
Imagine the Chef cooking for the Recipient.
This culinary moment is primarily inspired by the comprehensive context built from: the 'Main Reason/Situation for Cooking', 'Dish Concept', and the user-defined 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}').
The narrative MUST naturally reflect the established relationship context between the Chef and Recipient as understood from prior interactions and the overall situation.
Write a 500+ word story from the Chef's perspective.

The story should be structured as:
<Format>
🔥 Cook’s Glow
(Detail the Chef's main thoughts and motivations stemming from the 'Main Reason/Situation for Cooking'. Explicitly consider how their established relationship with the Recipient (informed by prior chat context) influences these motivations and the choice to express the 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}') through a 'Dish Concept' meal. The dish's tone must stem from this rich, multi-faceted, and established context.)

🥄 Heart’s Core
(Describe the dish’s core characteristics and how they connect to the overall context, the 'Main Reason/Situation for Cooking' for the Recipient, the 'Dish Concept', the 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}'), or a particular aspect of the Recipient as understood through their established relationship.)

🪄 Secret Touch
(Incorporate a special touch, flavor, ingredient, or presentation method that is directly inspired by or represents the user-defined 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}'). This is where '{{touch}}' should most clearly manifest.)

🍋 Side Spark
(If a side dish is prepared, describe its nature and how it complements the main dish and the overall theme, possibly reflecting an aspect of the 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}'). Explain its relevance. If no side dish, this section can be very short or omitted by the AI if contextually appropriate.)

🍽️ Dish It Out
(Describe how the Chef presents and serves the meal, reflecting their feelings (informed by '{{touch}}') and the dynamic of their established relationship with the Recipient in this specific context.)

🌟 Shared Moment
(Detail the Recipient's response upon seeing and tasting the meal. Describe the dialogue between the Chef and Recipient, their unfolding emotions, and how this shared experience, centered around the Chef's efforts driven by the 'Main Reason/Situation for Cooking' and colored by their established relationship and the expressed 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}'), influences their interaction, a shift in their dynamic, or the Chef's internal state.)
</Format>

In the Chef's voice: ensure authenticity and depth, reflecting their personality. Base actions and internal thoughts on the Recipient's traits and their established relationship (as known from prior chat context). The emotional tone, and any subtle undercurrents or intentions, should align with the 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}') provided by the user. Detail key cooking steps naturally within the narrative, but keep them integrated rather than a separate focus unless the Recipe Style is 'Detailed (Full Recipe)'.

If the Recipe Style is 'Detailed (Full Recipe)', write a complete recipe anyone could follow: exact amounts, times and every step.

If the Recipe Style is 'Skill-based (Chef Level)', this recipe MUST be tailored to the Chef's ('{{chef}}') INDIVIDUAL cooking skill and knowledge. First, based on '{{chef}}'s established personality, background, and any mentions of cooking in our roleplay so far, you MUST INFER their likely cooking proficiency (e.g., complete novice, decent home cook, gourmet enthusiast, professional chef, or even comically inept). Then, craft a recipe where the chosen ingredients, the complexity of techniques, the number of steps, and the style of instruction DIRECTLY REFLECT this inferred skill level.

<Recipe Card>
End with a separate 'Recipe Card'. This section MUST be presented as a single \`\`\`html code block: an HTML structure styled with CSS to evoke a classic or charming recipe book/card aesthetic.
The HTML structure should clearly delineate the Dish Name, Ingredients List, and Step-by-step Instructions.
CSS styling should aim for:
- Visual Presentation: A clean, aesthetically pleasing layout reminiscent of a physical recipe card or a page from a well-loved cookbook (e.g., consider using borders, a distinct background for the "card", and clear visual separation between the dish name, ingredients, and instructions sections).
- Typography: Primarily use fonts that are highly readable for the ingredients and instructions. A complementary, possibly more decorative or handwritten-style font, could be used for the Dish Name or section titles if it enhances the recipe book theme and remains legible.
The Chef's narrative tone (e.g., sweet, cheeky, reflecting their established relationship and the 'Special Emotion/Intent/Hidden Meaning' ('{{touch}}')) must still be evident in the textual content of the recipe itself (dish name, ingredients descriptions, and steps). The visual styling provides the "recipe book" container for this toned text.
All specified content (dish name, ingredients, steps) MUST be included within this styled HTML structure.
</Recipe Card>

Output Language: the language the roleplay is written in.
---
Begin the story now from the Chef's point of view.`;
  var COOKING = {
    steps: [
      // each option's own text is the other one: the Recipient
      { name: "chef", kind: "choice", question: "Step 1: Who will cook?", options: [{ label: "{{char}}", prompt: "{{user}}" }, { label: "{{user}}", prompt: "{{char}}" }], perOption: true },
      {
        name: "reason",
        kind: "input",
        question: "Step 2: What is the main reason or situation for {{chef}} cooking?\n(Examples: A date at home, their partner's birthday, a special occasion, for fun, or to celebrate together.)",
        options: []
      },
      { name: "concept", kind: "choice", question: "Step 3: What is your cooking concept?", options: ["Creative", "Celebratory", "Daily Special", "Light & Fresh", "Warm & Hearty", "Sweet Dessert"].map((label) => ({ label })) },
      {
        name: "touch",
        kind: "choice",
        question: "Step 4: What feeling or message do you want to convey through this dish?",
        options: ["Love", "Gratitude", "Friendship", "Playfulness", "Comfort", "Celebration"].map((label) => ({ label })),
        custom: { label: "Custom (Manual Input)", question: "What special emotion, intention, or hidden meaning do you want to convey? (e.g., revenge, longing, subtle warning, sweet temptation, etc.)" }
      },
      { name: "recipe_style", kind: "choice", question: "Step 5: {{chef}} is cooking. Choose your recipe type.", options: [{ label: "Detailed (Full Recipe)" }, { label: "Skill-based (Chef Level)" }] }
    ],
    prompt: COOKING_PROMPT,
    frame: "system",
    send: "result",
    as: "{{chef}}",
    cancelText: "Cancelled!✨",
    doneText: "Completed!💡"
  };
  var HOLIDAY_DROP_PROMPT = `[Pause the current RP. Execute the following Special Event.]
Based on the current RP context (Era, Currency, Characters' Fame/Job, Relationship, Personalities), write a detailed response covering the following 3 sections.

Scenario: {{holiday}} Merchandise (MD) featuring {{star}} has been released.

Section 1 & 2 Format: Standard Markdown text.

1. The Merchandise Lineup (8 Items)
Introduce 8 distinct MD items released. For each item, describe:
- Name
- Appearance
- Reason for Release
- Price

2. The Reaction ({{star:prompt}}'s Perspective)
Describe {{star:prompt}}'s reaction upon seeing the MD lineup.
- Strictly reflect {{star:prompt}}'s personality, spending habits, and financial status/wealth.
- Explicitly state whether {{star:prompt}} decides to purchase any of the items.

Section 3 Format: A single \`\`\`html code block.

3. Fan Reactions
Generate a complete HTML artifact representing a Social Media Feed.
- Design: Modern social feed layout with profile pics, usernames, and bubbles.
- Content: 12 fan reactions/comments about the MD launch.

Output Language: the language the roleplay is written in.`;
  var HOLIDAY_DROP = {
    steps: [
      { name: "star", kind: "choice", question: "Whose MD is being released?", options: [{ label: "{{char}}", prompt: "{{user}}" }, { label: "{{user}}", prompt: "{{char}}" }], perOption: true },
      { name: "holiday", kind: "choice", question: "Which holiday?", options: [{ label: "Valentine's Day" }, { label: "Halloween" }, { label: "Christmas" }], custom: { label: "Custom (Manual Input)", question: "Which holiday or occasion?" } }
    ],
    prompt: HOLIDAY_DROP_PROMPT,
    frame: "system",
    send: "result",
    as: "{{char}}",
    cancelText: "Cancelled!",
    doneText: "Generated! 💳"
  };
  function exampleQrs() {
    return [
      withSteps({ ...newItem(t("Cooking & recipe", "요리와 레시피"), ""), icon: "🧑‍🍳", title: t("Who cooks, why and how: a story and a recipe card", "누가·왜·어떻게 요리하는지 골라 이야기와 레시피 카드 받기"), steps: structuredClone(COOKING) }),
      withSteps({ ...newItem(t("The Holiday Drop", "홀리데이 MD 출시"), ""), icon: "🎁", title: t("Holiday merch of a character: the lineup, a reaction and the fans' feed", "캐릭터의 기념일 MD: 라인업, 반응, 팬 피드"), steps: structuredClone(HOLIDAY_DROP) })
    ];
  }
  function exampleSet() {
    return { ...newSet(t("Example QRs", "예시 QR")), icon: "🧭", enabled: false, items: exampleQrs() };
  }

  // src/qr/store.ts
  function firstRunState() {
    return { ...emptyState(), sets: [viszSet(), exampleSet()] };
  }
  var QrStore = class extends PersistedStore {
    constructor() {
      super({ key: "qr", normalize: normalizeState, initial: firstRunState, label: "QR" });
    }
  };

  // src/ui/chat-blocks.ts
  var MARK = "dispensa-view";
  var isHtmlBlock = (block2) => {
    const lang2 = block2.querySelector(".mari-md-codeblock-lang")?.textContent?.trim().toLowerCase() ?? "";
    return lang2 === "html" || lang2 === "htm";
  };
  function addViewButtons(onView) {
    document.querySelectorAll("[data-message-id]").forEach((message) => {
      const blocks = [...message.querySelectorAll("pre.mari-md-codeblock")].filter(isHtmlBlock);
      blocks.forEach((block2, index) => {
        if (block2.querySelector(`.${MARK}`)) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `${MARK} rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 font-sans text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`;
        button.style.cssText = "position:absolute;bottom:6px;right:72px;min-height:2rem;cursor:pointer;";
        button.textContent = t("🌟 View", "🌟 보기");
        button.title = t("View as a page", "페이지로 보기");
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = message.dataset.messageId;
          if (id) onView(id, index);
        });
        if (getComputedStyle(block2).position === "static") block2.style.position = "relative";
        block2.append(button);
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
      const svg2 = this.element.querySelector("svg");
      if (svg2) svg2.style.cssText = "width:14px;height:14px;transition:fill 150ms ease;";
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
      const svg2 = this.element.querySelector("svg");
      if (svg2) svg2.style.fill = armed ? "currentColor" : "none";
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
      for (const child2 of [...el2.childNodes]) {
        const c = cleanNode(child2);
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
    for (const child2 of [...el2.childNodes]) {
      const c = cleanNode(child2);
      if (c) copy.append(c);
    }
    return copy;
  }
  function safeUrl(url, isImage) {
    const u = url.trim().toLowerCase();
    if (u.startsWith("https://") || u.startsWith("http://")) return true;
    return isImage && u.startsWith("data:image/");
  }

  // src/shared/theme.ts
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
    /** `id`: the <style> element's id in <head>. */
    constructor(id) {
      this.id = id;
    }
    style = document.createElement("style");
    observer = null;
    timer = null;
    last = "";
    composer = null;
    start() {
      this.style.id = this.id;
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
        const image2 = cs.backgroundImage && cs.backgroundImage !== "none" ? `${cs.backgroundImage}, ` : "";
        values["--dsp-shell-bg"] = `${image2}linear-gradient(${cs.backgroundColor}, ${cs.backgroundColor})`;
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
.toast .toast-action { margin-left: 10px; padding: 2px 10px; font-size: 12px; }
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
.pick-list .pick-group { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.pick-list svg { width: 16px; height: 16px; flex: none; }
.pick-list .pick-group .grow { flex: 1; }
.pick-list .pick-group.open { border-color: var(--d-accent); }
.pick-list .pick-count { font-weight: 400; font-size: 12px; color: var(--d-muted); }
.pick-list .pick-items { display: flex; flex-direction: column; gap: 4px; padding-left: 18px; }
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
  function confirmIn(ui, message) {
    return ui.popup(message, { okButton: t("Yes", "예"), cancelButton: t("No", "아니요") });
  }
  var Dialogs = class {
    host = null;
    root = null;
    layer = null;
    toastBox = null;
    loaderEl = null;
    ensure() {
      if (this.layer?.isConnected) return this.layer;
      this.host = el("div", { id: "dispensa-dialogs" });
      this.root = this.host.attachShadow({ mode: "open" });
      this.toastBox = el("div", { class: "toasts" });
      this.layer = el("div", { class: "layer" }, this.toastBox);
      this.root.append(el("style", {}, STYLE), this.layer);
      document.body.append(this.host);
      return this.layer;
    }
    dispose() {
      this.host?.remove();
      this.host = this.root = this.layer = this.toastBox = this.loaderEl = null;
    }
    toast(message, severity = "info", options = {}) {
      this.ensure();
      const action = options.action;
      const button = action ? el("button", { class: "toast-action", onclick: () => action.run() }, action.label) : null;
      const toast = el("div", { class: `toast ${severity}`, role: severity === "error" ? "alert" : "status", onclick: () => toast.remove() }, options.title ? el("div", { class: "title" }, options.title) : null, message, button);
      this.toastBox.append(toast);
      setTimeout(() => toast.remove(), severity === "error" ? 8e3 : 4e3);
    }
    modal(build2, options = {}, onCancel) {
      const layer = this.ensure();
      const backdrop = el("div", { class: "backdrop" });
      const dialog = el("div", { class: `dialog${options.wide ? " wide" : ""}${options.large ? " large" : ""}`, role: "dialog", "aria-modal": "true" });
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
      return el("div", { class: "body" }, sanitizeHtml(html));
    }
    button(label, primary, onClick) {
      return el("button", { type: "button", class: primary ? "primary" : void 0, onclick: onClick }, label);
    }
    row(...buttons) {
      return el("div", { class: "row" }, ...buttons);
    }
    input(prompt, options = {}) {
      return new Promise((resolve) => {
        this.modal(
          (dialog, close) => {
            const multi = options.multiline || (options.rows ?? 1) > 1 || options.large;
            const field = multi ? el("textarea") : el("input");
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
            const row = this.row();
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
            setTimeout(() => (field.focus(), !multi && field.value && field.select()), 0);
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
            const row = this.row();
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
            const field = el("input", { placeholder: t("Or type it", "또는 직접 입력"), style: "margin-top:8px" });
            const done = (value) => {
              close();
              resolve(value);
            };
            const list = el("div", { class: "choices" }, ...options.map((option) => this.button(option, false, () => done(option))));
            field.addEventListener("keydown", (e) => {
              if (e.key === "Enter" && !e.isComposing) {
                e.preventDefault();
                done(field.value);
              }
            });
            const row = this.row(this.button(t("Cancel", "취소"), false, () => done(null)), this.button(t("OK", "확인"), true, () => done(field.value)));
            dialog.append(el("div", { class: "body" }, label), list, field, row);
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
            const list = el("div", { class: "choices" });
            const picked2 = /* @__PURE__ */ new Set();
            for (const label of labels) {
              const b = this.button(label, false, () => {
                if (!options.multiple) {
                  close();
                  resolve(label);
                  return;
                }
                if (picked2.has(label)) picked2.delete(label);
                else picked2.add(label);
                b.className = picked2.has(label) ? "primary" : "";
              });
              list.append(b);
            }
            const row = this.row(
              this.button(t("Cancel", "취소"), false, () => {
                close();
                resolve("");
              })
            );
            if (options.multiple) {
              row.append(
                this.button(t("OK", "확인"), true, () => {
                  close();
                  resolve(JSON.stringify([...picked2]));
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
            const body = el("div", { class: "fields" });
            for (const f of fields) {
              const caption = el("span", {}, f.label ?? f.name);
              let control;
              if (f.type === "textarea") control = el("textarea", { rows: "3" });
              else if (f.type === "select") control = el("select", {}, ...(f.options ?? []).map((o) => new Option(o, o)));
              else control = el("input", { type: f.type === "number" ? "number" : f.type === "checkbox" ? "checkbox" : "text" });
              if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = /^(true|on|1|yes)$/i.test(f.default ?? "");
              else control.value = f.default ?? "";
              if ("placeholder" in control && f.placeholder) control.placeholder = f.placeholder;
              const field = control;
              controls.push({ name: f.name, get: () => field instanceof HTMLInputElement && field.type === "checkbox" ? String(field.checked) : field.value });
              body.append(el("label", { class: f.type === "checkbox" ? "field check" : "field" }, ...f.type === "checkbox" ? [control, caption] : [caption, control]));
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
            const row = this.row(
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
            const search2 = el("input", { type: "search", placeholder: options.placeholder ?? t("Search…", "검색…") });
            const list = el("div", { class: "choices pick-list" });
            const picked2 = /* @__PURE__ */ new Set();
            const groups = (options.groups ?? []).filter((g) => g.items.length);
            let open2 = groups.length === 1 ? groups[0] : null;
            let active = 0;
            const grouped = () => groups.length > 0 && !search2.value.trim();
            const visible2 = () => {
              if (grouped()) return open2 ? open2.items : [];
              return items.filter((i) => i.toLowerCase().includes(search2.value.trim().toLowerCase()));
            };
            const option = (item, label, index) => {
              const b = this.button(label, picked2.has(item) || !options.multiple && index === active, () => choose(item));
              b.setAttribute("role", "option");
              return b;
            };
            const draw = () => {
              const shown = visible2();
              active = Math.min(active, Math.max(0, shown.length - 1));
              if (grouped()) {
                list.replaceChildren(
                  ...groups.flatMap((g) => {
                    const isOpen = g === open2;
                    const head = el(
                      "button",
                      { type: "button", class: `pick-group${isOpen ? " open" : ""}`, "aria-expanded": String(isOpen), onclick: () => (open2 = isOpen ? null : g, active = 0, draw()) },
                      g.icon?.trim() ? el("span", { class: "pick-icon" }, g.icon.trim()) : icon("folder"),
                      el("span", { class: "grow" }, g.label),
                      el("span", { class: "pick-count" }, String(g.items.length))
                    );
                    return isOpen ? [head, el("div", { class: "pick-items" }, ...g.items.map((item, i) => option(item, g.names[i] ?? item, i)))] : [head];
                  })
                );
                return;
              }
              list.replaceChildren(...shown.slice(0, 300).map((item, index) => option(item, item, index)));
              if (!shown.length) list.append(el("div", { class: "body" }, t("No results.", "검색 결과가 없어요.")));
            };
            const choose = (item) => {
              if (!options.multiple) {
                close();
                resolve([item]);
                return;
              }
              if (picked2.has(item)) picked2.delete(item);
              else picked2.add(item);
              draw();
            };
            search2.addEventListener("input", () => {
              active = 0;
              draw();
            });
            search2.addEventListener("keydown", (e) => {
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
            const row = this.row(
              this.button(t("Cancel", "취소"), false, () => {
                close();
                resolve([]);
              })
            );
            if (options.multiple) {
              row.append(
                this.button(t("OK", "확인"), true, () => {
                  close();
                  resolve(items.filter((i) => picked2.has(i)));
                })
              );
            }
            if (prompt.trim()) dialog.append(this.body(prompt));
            dialog.append(search2, list, row);
            draw();
            setTimeout(() => search2.focus(), 0);
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
        const area = el("textarea", { style: "position:fixed;opacity:0" });
        area.value = text7;
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
        return await this.input(t("Paste here (the browser blocked the clipboard).", "여기에 붙여 넣어 주세요 (브라우저가 클립보드를 막았어요)."), { multiline: true, rows: 4 }) ?? "";
      }
    }
    confirm(message) {
      return confirmIn(this, message);
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
      this.loaderEl = el("div", { class: "loader" }, el("div", { class: "spinner" }), text7 ? el("div", {}, text7) : null);
      layer.append(this.loaderEl);
    }
  };

  // src/shared/form.ts
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
.switch:has(input:disabled) { filter: grayscale(1); opacity: .6; }
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
    const place2 = (value, animate) => {
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
      if (!bar.isConnected || !place2(active, false)) {
        if (++tries < 30) requestAnimationFrame(start2);
        return;
      }
      if (startAt) {
        pill.style.width = `${startAt.w}px`;
        pill.style.transform = `translateX(${startAt.x}px)`;
        void pill.offsetWidth;
        place2(active, true);
      }
      watch();
    };
    const watch = () => {
      setTimeout(() => new ResizeObserver(() => place2(active, false)).observe(bar), 320);
    };
    requestAnimationFrame(start2);
    return bar;
  }

  // src/visz/core.ts
  var FENCE_RE = /```[ \t]*([\w-]*)[^\n]*\n([\s\S]*?)(?:\n[ \t]*```|```)/g;
  var DOC_RE = /<!doctype\s+html|<html[\s>]|<body[\s>]/i;
  var TAG_RE = /<[a-z][a-z0-9-]*[\s>/]/i;
  var OLD_MARKERS = /<!--\s*WAND_START\s*-->([\s\S]*?)(?:<!--\s*WAND_END\s*-->|$)/gi;
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
    OLD_MARKERS.lastIndex = 0;
    while (m2 = OLD_MARKERS.exec(src)) {
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
      const name = escapeRegex(tag);
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
    const peel2 = [
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
      for (const re of peel2) {
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
      out = out.replace(new RegExp(`\\{\\{${escapeRegex(key2)}\\}\\}`, "g"), () => String(value ?? ""));
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
  function titleFrom(text7, max = 40) {
    return cleanOoc(text7).split("\n")[0].replace(/\[\[|\]\]/g, "").trim().slice(0, max);
  }
  function hasScripts(code) {
    return /<script\b|\son[a-z]+\s*=\s*["']|javascript:/i.test(String(code ?? ""));
  }
  function heightReporter(token) {
    return `(()=>{const token=${JSON.stringify(token)};let sent=-1,queued=false;const send=()=>{queued=false;const page=document.documentElement,body=document.body;if(!page||!body)return;const px=Math.ceil(Math.max(page.scrollHeight,body.scrollHeight));if(px>0&&Math.abs(px-sent)>2){sent=px;parent.postMessage({viszHeight:px,token},"*");}};const soon=()=>{if(!queued){queued=true;requestAnimationFrame(send);}};addEventListener("load",soon);addEventListener("resize",soon);document.addEventListener("DOMContentLoaded",()=>{soon();if(window.ResizeObserver)new ResizeObserver(soon).observe(document.body);});[200,800,2000,5000].forEach((ms)=>setTimeout(send,ms));})();`;
  }
  function buildSrcdoc(code, { token, baseUrl = "", allowExternal = true }) {
    const head = [];
    if (baseUrl) head.push(`<base href="${escapeHtml(baseUrl)}">`);
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
  function fencedPage(text7) {
    if (extractHtmlBlocks(text7).length) return text7;
    const at = text7.search(/<!doctype\s+html|<html[\s>]/i);
    if (at < 0) return text7;
    const end = text7.search(/<\/html>/i);
    const stop = end < 0 ? text7.length : end + "</html>".length;
    return `${text7.slice(0, at)}\`\`\`html
${text7.slice(at, stop).trim()}
\`\`\`${text7.slice(stop)}`;
  }

  // src/visz/gallery.ts
  function folderName(raw) {
    return raw.replace(/\s+/g, " ").trim().slice(0, 40);
  }
  function galleryFolders(entries) {
    return [...new Set(entries.map((e) => e.folder ?? "").filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }
  function shownPages(entries, folder2, query = "") {
    const fold2 = (s) => s.normalize("NFC").toLowerCase();
    const words = fold2(query).split(/\s+/).filter(Boolean);
    return entries.filter((e) => (folder2 === null || (e.folder ?? "") === folder2) && words.every((w) => fold2(`${e.title} ${e.character ?? ""} ${e.chatName ?? ""}`).includes(w)));
  }
  function filed(entry, folder2) {
    const next = { ...entry };
    const name = folderName(folder2);
    if (name) next.folder = name;
    else delete next.folder;
    return next;
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
    const width2 = options.width || getNodeWidth(targetNode);
    const height = options.height || getNodeHeight(targetNode);
    return { width: width2, height };
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
  async function svgToDataURL(svg2) {
    return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg2)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
  }
  async function nodeToDataURL(node, width2, height) {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg2 = document.createElementNS(xmlns, "svg");
    const foreignObject = document.createElementNS(xmlns, "foreignObject");
    svg2.setAttribute("width", `${width2}`);
    svg2.setAttribute("height", `${height}`);
    svg2.setAttribute("viewBox", `0 0 ${width2} ${height}`);
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");
    foreignObject.setAttribute("x", "0");
    foreignObject.setAttribute("y", "0");
    foreignObject.setAttribute("externalResourcesRequired", "true");
    svg2.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svgToDataURL(svg2);
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
    await children.reduce((deferred, child2) => deferred.then(() => cloneNode(child2, options)).then((clonedChild) => {
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
      const selectedOption = Array.from(clonedSelect.children).find((child2) => nativeNode.value === child2.getAttribute("value"));
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
      const svg2 = document.createElementNS(ns, "svg");
      svg2.setAttribute("xmlns", ns);
      svg2.style.position = "absolute";
      svg2.style.width = "0";
      svg2.style.height = "0";
      svg2.style.overflow = "hidden";
      svg2.style.display = "none";
      const defs = document.createElementNS(ns, "defs");
      svg2.appendChild(defs);
      for (let i = 0; i < nodes.length; i++) {
        defs.appendChild(nodes[i]);
      }
      clone.appendChild(svg2);
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
  function filterPreferredFontFormat(str9, { preferredFontFormat }) {
    return !preferredFontFormat ? str9 : str9.replace(FONT_SRC_REGEX, (match) => {
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
      const image2 = clonedNode;
      if (image2.decode) {
        image2.decode = resolve;
      }
      if (image2.loading === "lazy") {
        image2.loading = "eager";
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
    const deferreds = children.map((child2) => embedImages(child2, options));
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
          const inline2 = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
          if (sheet.href != null) {
            deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              inline2.insertRule(rule, inline2.cssRules.length);
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
      Array.from(node2.children).forEach((child2) => {
        if (child2 instanceof HTMLElement) {
          traverse(child2);
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
    const { width: width2, height } = getImageSize(node, options);
    const clonedNode = await cloneNode(node, options, true);
    await embedWebFonts(clonedNode, options);
    await embedImages(clonedNode, options);
    applyStyle(clonedNode, options);
    const datauri = await nodeToDataURL(clonedNode, width2, height);
    return datauri;
  }
  async function toCanvas(node, options = {}) {
    const { width: width2, height } = getImageSize(node, options);
    const svg2 = await toSvg(node, options);
    const img = await createImage(svg2);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const ratio = options.pixelRatio || getPixelRatio();
    const canvasWidth = options.canvasWidth || width2;
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

  // src/shared/capture.ts
  var BLANK_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  function isClear(color) {
    return !color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color);
  }
  async function captureDocument(doc, behind = "#ffffff") {
    const html = doc.documentElement;
    const body = doc.body ?? html;
    const view = doc.defaultView ?? window;
    const width2 = Math.max(html.scrollWidth, body.scrollWidth, 1);
    const height = Math.max(html.scrollHeight, body.scrollHeight, 1);
    const bodyBg = view.getComputedStyle(body).backgroundColor;
    const htmlBg = view.getComputedStyle(html).backgroundColor;
    const backgroundColor = !isClear(bodyBg) ? bodyBg : !isClear(htmlBg) ? htmlBg : behind;
    const options = { width: width2, height, backgroundColor, pixelRatio: Math.min(2, window.devicePixelRatio || 1), imagePlaceholder: BLANK_PIXEL };
    let blob;
    try {
      blob = await toBlob(body, options);
    } catch {
      blob = await toBlob(body, { ...options, skipFonts: true });
    }
    if (!blob) throw new Error(t("Could not make the image.", "이미지를 만들지 못했어요."));
    return blob;
  }
  async function capturePage(frame, code, behind) {
    const doc = frame && readable(frame);
    if (doc) return captureDocument(doc, behind);
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

  // src/ui/gallery-actions.ts
  async function pickQr(ui, state, prompt) {
    const entries = state.sets.flatMap((set) => set.items.map((item) => ({ set, item, label: `${set.name} › ${item.label}` })));
    if (!entries.length || !ui.pick) {
      ui.toast(t("There are no QRs yet.", "아직 QR이 없어요."), "info", { title: "🖼" });
      return null;
    }
    const groups = state.sets.map((set) => ({ label: set.name, ...set.icon ? { icon: set.icon } : {}, items: set.items.map((item) => `${set.name} › ${item.label}`), names: set.items.map((item) => item.label) }));
    const [label] = await ui.pick(prompt, entries.map((e) => e.label), { placeholder: t("Search QRs", "QR 찾기"), groups });
    return entries.find((e) => e.label === label) ?? null;
  }
  function galleryActions(d) {
    const { ui, runner, visz, memoStore } = d;
    const galleryRun = async (set, item, input, about) => {
      const s = d.viszStore.value.settings;
      const title = about ? `${item.label} · ${about}` : item.label;
      ui.toast(t(`${title}: making it inside the Gallery…`, `${title}: 갤러리 내부에서 만드는 중…`), "info", { title: "🖼" });
      try {
        const made = await runner.runInGallery(set, item, s.galleryConnectionId || s.connectionId, input, title, s.sendPreset, s.galleryPresetId || void 0);
        if (made === null) return;
        const text7 = fencedPage(made);
        if (!text7.trim()) {
          ui.toast(t(`${title} made nothing to keep.`, `${title}: 남길 결과가 없어요.`), "warning", { title: "🖼" });
          return;
        }
        if (!visz.keeps("gallery", text7)) {
          ui.toast(visz.notKept("gallery", title), "warning", { title: "🖼" });
          return;
        }
        await visz.save({ title, kind: extractHtmlBlocks(text7).length ? "viz" : "ooc", text: text7 });
        ui.toast(t(`${title}: saved to the Gallery.`, `${title}: 갤러리에 저장했어요.`), "success", { title: "🖼" });
      } catch (e) {
        ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t(`🖼 ${title} failed`, `🖼 ${title} 실패`) });
      }
    };
    const runForGallery = async (text7, about) => {
      const chosen = await pickQr(ui, d.store.value, t(`A QR to run inside the Gallery on "${about}"`, `"${about}"을(를) 소재로 갤러리 내부에서 실행할 QR`));
      if (chosen) await galleryRun(chosen.set, chosen.item, text7, about);
    };
    const openPage2 = async (id) => {
      const entry = (await visz.archive.list()).find((e) => e.id === id);
      const viewer = d.viewer();
      if (!entry || !viewer) return false;
      viewer.show({ title: entry.title, kind: entry.kind, text: entry.text, archivedId: entry.id, ...entry.chatId ? { chatId: entry.chatId } : {} });
      return true;
    };
    const sendToBoard = async (entry) => {
      const boards = memoStore.value.boards ?? [];
      const names = [...boards.map((b, i) => `${i + 1}. ${b.name}`), t("＋ A new board", "＋ 새 보드")];
      const [choice] = ui.pick ? await ui.pick(t("Put it on which board?", "어느 보드에 붙일까요?"), names) : [];
      if (!choice) return;
      const index = names.indexOf(choice);
      const onBoard = (s) => {
        const known = index < boards.length ? s.boards?.find((b) => b.id === boards[index].id) : void 0;
        if (known) return known;
        const made = newBoard(entry.title);
        (s.boards ??= []).push(made);
        return made;
      };
      const code = extractHtmlBlocks(entry.text)[0]?.code;
      try {
        if (!code) {
          const memo2 = { ...newMemo(entry.text, Date.now(), d.memoOwner()), title: entry.title };
          memoStore.update((s) => {
            s.memos.push(memo2);
            const b = onBoard(s);
            placeMemos(b, [memo2.id], freeSpot(b, CARD_W.default));
          });
        } else {
          ui.toast(t("Taking the page's picture…", "페이지 그림을 찍는 중…"), "info", { title: "📋" });
          const blob = await capturePage(null, await pageWithPictures(code, entry.chatId));
          const image2 = await uploadBoardImage(new File([blob], `${entry.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "page"}.png`, { type: "image/png" }));
          memoStore.update((s) => {
            const b = onBoard(s);
            b.magnets.push({ id: newId("magnet"), image: image2, ...freeSpot(b, MAGNET_SIZE.max), size: MAGNET_SIZE.max, z: topZ(b) + 1, page: { archiveId: entry.id, title: entry.title } });
          });
        }
        ui.toast(t(`On the board: ${entry.title}`, `보드에 붙였어요: ${entry.title}`), "success", { title: "📋" });
      } catch (e) {
        ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("📋 Couldn't put it on the board", "📋 보드에 붙이지 못했어요") });
      }
    };
    return { galleryRun, runForGallery, openPage: openPage2, sendToBoard };
  }

  // src/ui/gallery-view.ts
  var GALLERY_CSS = `
.gal-board { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 6px 2px; }
.gal-card { position: relative; display: grid; gap: 4px; padding: 6px; border-radius: var(--d-radius-sm); border: 1px solid var(--d-line); background: var(--d-field); text-align: left; cursor: pointer; }
.gal-card.sel { outline: 2px solid var(--d-accent); }
.gal-card .shot { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 4px; background: #fff; }
/* a page drawn four times larger, then shrunk: it reads like a screenshot */
.gal-card .shot iframe { position: absolute; left: 0; top: 0; width: 400%; height: 400%; border: 0; transform: scale(.25); transform-origin: 0 0; pointer-events: none; }
.gal-card .shot .txt { position: absolute; inset: 0; padding: 34px 8px 6px; font-size: 10.5px; line-height: 1.4; color: #333; overflow: hidden; white-space: pre-wrap; }
.gal-card .t { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gal-card .meta { font-size: 11px; color: var(--d-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gal-card .acts { position: absolute; right: 10px; top: 10px; display: flex; gap: 3px; }
.gal-card .acts button { width: 26px; height: 26px; padding: 0; justify-content: center; }
.gal-card input[type=checkbox] { position: absolute; left: 10px; top: 10px; }
.gallery .gal-tools, .gallery .gal-picked { display: flex; gap: 4px; align-items: center; }
.gallery .gal-tools select, .gallery .gal-picked select { width: auto; max-width: 9.5em; flex: none; padding: 3px 6px; font-size: 12.5px; }
.gallery .gal-tools input[type=search] { flex: 1; min-width: 0; }
.gallery .gal-tools > button, .gallery .gal-picked > button { width: auto; flex: none; padding: 3px 8px; font-size: 12.5px; }
.gallery .gal-picked { padding: 4px; border-radius: var(--d-radius-sm); background: var(--d-hl-bg); }
.gallery .gal-picked .count { flex: 1; font-size: 12px; color: var(--d-hl-text); }
.gallery .line { display: flex; gap: 3px; align-items: center; }
.gallery .line > button:first-child { flex: 1; min-width: 0; }
.gallery .line > button.mini { width: auto; flex: none; padding: 4px 6px; background: transparent; border-color: transparent; color: var(--d-muted); font-weight: 500; }
.gallery .line > button.mini:hover { background: var(--d-hl-bg); color: var(--d-hl-text); }
.gallery .line > button.mini.on { color: var(--d-accent); }
.gallery .meta { flex: none; margin-left: auto; font-size: 11px; color: var(--d-muted); font-weight: 500; }
.gallery .none { color: var(--d-muted); padding: 6px 4px; font-size: 12px; }
.gallery .line input[type=checkbox] { flex: none; margin: 0 2px 0 4px; }
.gallery .gal-tools .grow { flex: 1; }
.gallery .gal-tools > button.gal-run { background: var(--d-accent-fill); color: var(--d-accent-text); border-color: transparent; }
.gallery .gal-settings { display: grid; gap: 2px; padding: 6px 8px; border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); margin: 6px 0; }
.gallery .gal-card .t { color: var(--d-text); }
.gallery.wide .gal-board { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
/* inside the window: never wider than it; on a phone the tools wrap and cards get smaller */
.gallery { min-width: 0; }
.gallery .gal-tools { flex-wrap: wrap; }
.gallery .gal-tools input[type=search] { min-width: 8em; }
@media (max-width: 600px) { .gallery.wide .gal-board { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; } }
`;
  var VIEW_KEY = "dispensa.galleryView";
  var actionIcon = (kind) => kind === "viz" ? "🌟" : "💬";
  var GalleryView = class {
    constructor(deps, wide = false) {
      this.deps = deps;
      this.element = el("div", { class: `gallery${wide ? " wide" : ""}` });
      this.search = el("input", {
        type: "search",
        part: "visz-archive-search",
        oninput: () => {
          this.query = this.search.value;
          this.renderPages();
        }
      });
    }
    element;
    archive = [];
    /** QRs running for the Gallery now. */
    making = 0;
    /** The Gallery as a list or as a board of page pictures (remembered in this browser). */
    view = (() => {
      try {
        return localStorage.getItem(VIEW_KEY) === "board" ? "board" : "list";
      } catch {
        return "list";
      }
    })();
    previews = null;
    /** The Gallery folder shown: null for every page, "" for pages in no folder. */
    folder = null;
    query = "";
    picking = false;
    picked = /* @__PURE__ */ new Set();
    search;
    settingsOpen = false;
    /** Reads the Gallery and draws it. */
    load() {
      return this.loadArchive();
    }
    async loadArchive() {
      try {
        this.archive = await this.deps.service.archive.list();
      } catch (e) {
        this.archive = [];
        this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Gallery", "갤러리") });
      }
      this.renderArchive();
    }
    /** "▶ With a QR": runs one for the Gallery only, while the chat goes on. */
    makeButton() {
      return el(
        "button",
        {
          part: "visz-archive-run",
          class: "gal-run",
          disabled: this.deps.store.value.settings.collect === "chat",
          "aria-label": this.making ? t(`With a QR (${this.making} running)`, `QR로 만들기 (${this.making}개 진행 중)`) : t("With a QR", "QR로 만들기"),
          title: this.deps.store.value.settings.collect === "chat" ? t("The Gallery's settings keep only results from the chat (⚙)", "갤러리 설정이 채팅 결과만 저장하게 되어 있어요 (⚙)") : t("Run a QR inside the Gallery, even while the chat replies", "갤러리 내부에서 QR 실행. 채팅이 답하는 중에도 돼요"),
          onclick: () => void this.makeWithQr()
        },
        icon("play"),
        this.making ? ` ${this.making}` : null
      );
    }
    async makeWithQr() {
      const chosen = await pickQr(this.deps.ui, this.deps.qrStore.value, t("A QR to run inside the Gallery", "갤러리 내부에서 실행할 QR"));
      if (!chosen) return;
      this.making++;
      this.renderArchive();
      try {
        await this.deps.runInGallery(chosen.set, chosen.item);
      } finally {
        this.making--;
        await this.loadArchive();
      }
    }
    renderArchive() {
      this.element.replaceChildren();
      if (!this.archive.length) {
        this.element.append(el("div", { class: "gal-tools" }, el("span", { class: "grow" }), this.makeButton(), this.settingsButton()), ...this.settingsBox(), el("div", { class: "none" }, t("Empty", "비어 있음")));
        return;
      }
      const folders = galleryFolders(this.archive);
      if (this.folder && !folders.includes(this.folder)) this.folder = null;
      this.search.placeholder = t("Search pages", "페이지 찾기");
      this.search.setAttribute("aria-label", t("Search pages", "페이지 찾기"));
      const folderSelect = this.folderSelect(folders);
      const tools = el(
        "div",
        { class: "gal-tools" },
        folderSelect,
        this.search,
        this.folder ? el("button", { class: "ghost", title: t("Rename or undo this folder", "이 폴더 이름 바꾸기·풀기"), "aria-label": t("Folder", "폴더"), onclick: () => void this.folderMenu() }, "⋯") : null,
        el(
          "button",
          {
            class: "ghost",
            part: "visz-archive-view",
            title: this.view === "board" ? t("Show as a list", "목록으로 보기") : t("Show as a board of pictures", "그림 보드로 보기"),
            "aria-label": this.view === "board" ? t("List", "목록") : t("Board", "보드"),
            onclick: () => {
              this.view = this.view === "board" ? "list" : "board";
              try {
                localStorage.setItem(VIEW_KEY, this.view);
              } catch {
              }
              this.renderArchive();
            }
          },
          icon(this.view === "board" ? "list" : "layout-grid")
        ),
        el(
          "button",
          {
            class: this.picking ? "on" : "ghost",
            part: "visz-archive-pick",
            "aria-pressed": String(this.picking),
            title: this.picking ? t("Stop picking", "고르기 그만") : t("Pick pages to move or delete", "옮기거나 지울 페이지 고르기"),
            "aria-label": this.picking ? t("Stop picking", "고르기 그만") : t("Pick", "고르기"),
            onclick: () => {
              this.picking = !this.picking;
              this.picked.clear();
              this.renderArchive();
            }
          },
          icon(this.picking ? "x" : "square-check-big")
        ),
        this.makeButton(),
        this.settingsButton(),
        this.deps.openWide ? el("button", { class: "ghost", part: "visz-archive-wide", title: t("Open the Gallery large", "갤러리 크게 열기"), "aria-label": t("Open the Gallery large", "갤러리 크게 열기"), onclick: () => this.deps.openWide?.() }, icon("maximize-2")) : null
      );
      const pages = el("div", { class: "pages" });
      this.element.append(tools, ...this.settingsBox(), ...this.picking ? [this.pickedBar(folders)] : [], pages);
      this.renderPages(pages);
    }
    folderSelect(folders) {
      const select2 = el("select", { part: "visz-archive-folder", "aria-label": t("Folder", "폴더"), title: t("Folder", "폴더") });
      const option = (value, label) => el("option", { value }, label);
      select2.append(option("*", t("All pages", "모든 페이지")), option("", t("Not in a folder", "폴더 없음")), ...folders.map((f) => option(f, `📁 ${f}`)));
      select2.value = this.folder === null ? "*" : this.folder;
      select2.addEventListener("change", () => {
        this.folder = select2.value === "*" ? null : select2.value;
        this.picked.clear();
        this.renderArchive();
      });
      return select2;
    }
    /** Actions on the picked pages. */
    pickedBar(folders) {
      const shown = shownPages(this.archive, this.folder, this.query);
      const move2 = el("select", { "aria-label": t("Move to", "옮길 곳"), title: t("Move to", "옮길 곳") });
      move2.append(
        el("option", { value: "*" }, t("Move to…", "옮기기…")),
        ...folders.map((f) => el("option", { value: f }, `📁 ${f}`)),
        el("option", { value: "+" }, t("➕ New folder…", "➕ 새 폴더…")),
        el("option", { value: "" }, t("Out of the folder", "폴더에서 빼기"))
      );
      move2.addEventListener("change", () => {
        const to = move2.value;
        move2.value = "*";
        if (to !== "*") void this.movePicked(to);
      });
      const all = shown.length > 0 && shown.every((e) => this.picked.has(e.id));
      return el(
        "div",
        { class: "gal-picked" },
        el("span", { class: "count" }, t(`${this.picked.size} picked`, `${this.picked.size}개 고름`)),
        el(
          "button",
          {
            class: "ghost",
            onclick: () => {
              for (const e of shown) {
                if (all) this.picked.delete(e.id);
                else this.picked.add(e.id);
              }
              this.renderArchive();
            }
          },
          all ? t("None", "모두 풀기") : t("All", "모두 고르기")
        ),
        move2,
        el("button", { class: "ghost", title: t("Delete the picked pages", "고른 페이지 지우기"), "aria-label": t("Delete", "지우기"), onclick: () => void this.deletePicked() }, icon("trash"))
      );
    }
    renderPages(box = this.element.querySelector(".pages")) {
      if (!box) return;
      box.replaceChildren();
      const shown = shownPages(this.archive, this.folder, this.query);
      if (!shown.length) box.append(el("div", { class: "none" }, t("No pages here.", "여기에는 페이지가 없어요.")));
      if (this.view === "board" && shown.length) return this.renderBoard(box, shown);
      for (const entry of shown) {
        const when = new Date(entry.createdAt);
        const date = `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
        const pick2 = this.picking ? el("input", { type: "checkbox", "aria-label": entry.title }) : null;
        if (pick2) {
          pick2.checked = this.picked.has(entry.id);
          pick2.addEventListener("click", () => this.togglePick(entry.id));
        }
        box.append(
          el(
            "div",
            { class: "line" },
            pick2,
            el(
              "button",
              {
                part: "visz-archive-item",
                title: [entry.character, entry.chatName].filter(Boolean).join(" · "),
                onclick: () => {
                  if (this.picking) return this.togglePick(entry.id);
                  this.deps.viewer()?.show({ title: entry.title, kind: entry.kind, text: entry.text, archivedId: entry.id, ...entry.chatId ? { chatId: entry.chatId } : {} });
                  this.deps.close();
                }
              },
              el("span", { class: "t" }, `${actionIcon(entry.kind)} ${entry.title}`),
              el("span", { class: "meta" }, this.folder === null && entry.folder ? `📁 ${entry.folder} · ${date}` : date)
            ),
            this.picking ? null : el("button", { class: "mini", title: t("Put on a memo board", "메모 보드에 붙이기"), "aria-label": t("Put on a memo board", "메모 보드에 붙이기"), onclick: () => void this.deps.sendToBoard(entry) }, icon("pin")),
            this.picking ? null : el(
              "button",
              {
                class: "mini",
                title: t("Delete", "지우기"),
                "aria-label": t("Delete", "지우기"),
                onclick: async () => {
                  if (!await confirmIn(this.deps.ui, t(`Delete "${entry.title}" from the Gallery?`, `갤러리에서 "${entry.title}"을(를) 지울까요?`))) return;
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
    /** The pages as cards with a small picture of each; pictures are drawn when they scroll into view. */
    renderBoard(box, shown) {
      this.previews?.disconnect();
      this.previews = typeof IntersectionObserver === "function" ? new IntersectionObserver((seen) => {
        for (const s of seen) {
          if (!s.isIntersecting) continue;
          const frame = s.target;
          void pageWithPictures(frame.dataset.code ?? "", frame.dataset.chat || void 0).then((code) => frame.srcdoc = code);
          this.previews?.unobserve(frame);
        }
      }) : null;
      const grid = el("div", { class: "gal-board" });
      for (const entry of shown) {
        const code = extractHtmlBlocks(entry.text)[0]?.code;
        const frame = code ? el("iframe", { sandbox: "", loading: "lazy", "aria-hidden": "true", tabindex: "-1" }) : null;
        if (frame && code) {
          const shown2 = code.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
          frame.dataset.code = this.deps.store.value.settings.allowExternal ? shown2 : `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data:; style-src 'unsafe-inline'">${shown2}`;
          if (entry.chatId) frame.dataset.chat = entry.chatId;
          if (this.previews) this.previews.observe(frame);
          else void pageWithPictures(frame.dataset.code, entry.chatId).then((c) => frame.srcdoc = c);
        }
        const pick2 = this.picking ? el("input", { type: "checkbox", "aria-label": entry.title }) : null;
        if (pick2) pick2.checked = this.picked.has(entry.id);
        const card = el(
          "div",
          {
            class: `gal-card${this.picked.has(entry.id) ? " sel" : ""}`,
            part: "visz-archive-card",
            role: "button",
            tabindex: "0",
            title: [entry.character, entry.chatName].filter(Boolean).join(" · "),
            onclick: (e) => {
              if (e.target.closest(".acts")) return;
              if (this.picking) return this.togglePick(entry.id);
              this.deps.viewer()?.show({ title: entry.title, kind: entry.kind, text: entry.text, archivedId: entry.id, ...entry.chatId ? { chatId: entry.chatId } : {} });
              this.deps.close();
            },
            onkeydown: (e) => {
              if (e.key === "Enter" && e.target === card) card.click();
            }
          },
          el("div", { class: "shot" }, frame ?? el("div", { class: "txt" }, entry.text.slice(0, 400))),
          el("span", { class: "t" }, `${actionIcon(entry.kind)} ${entry.title}`),
          el("span", { class: "meta" }, [entry.character, dateOf(entry.createdAt)].filter(Boolean).join(" · ")),
          pick2,
          this.picking ? null : el(
            "div",
            { class: "acts" },
            el("button", { class: "mini", title: t("Put on a memo board", "메모 보드에 붙이기"), "aria-label": t("Put on a memo board", "메모 보드에 붙이기"), onclick: () => void this.deps.sendToBoard(entry) }, icon("pin")),
            el(
              "button",
              {
                class: "mini",
                title: t("Delete", "지우기"),
                "aria-label": t("Delete", "지우기"),
                onclick: async () => {
                  if (!await confirmIn(this.deps.ui, t(`Delete "${entry.title}" from the Gallery?`, `갤러리에서 "${entry.title}"을(를) 지울까요?`))) return;
                  await this.deps.service.archive.remove(entry.id);
                  await this.loadArchive();
                }
              },
              icon("trash")
            )
          )
        );
        grid.append(card);
      }
      box.append(grid);
    }
    togglePick(id) {
      if (this.picked.has(id)) this.picked.delete(id);
      else this.picked.add(id);
      this.renderArchive();
    }
    async askFolderName(prompt, value = "") {
      const name = folderName(await this.deps.ui.input(prompt, { defaultValue: value, okButton: t("OK", "확인") }) ?? "");
      return name || null;
    }
    async movePicked(to) {
      const pages = this.archive.filter((e) => this.picked.has(e.id));
      if (!pages.length) return;
      const folder2 = to === "+" ? await this.askFolderName(t("Name of the new folder", "새 폴더 이름")) : to;
      if (folder2 === null) return;
      for (const e of pages) await this.deps.service.archive.put(filed(e, folder2));
      this.picked.clear();
      this.picking = false;
      this.deps.ui.toast(folder2 ? t(`Moved ${pages.length} pages to ${folder2}.`, `페이지 ${pages.length}개를 ${folder2} 폴더로 옮겼어요.`) : t(`Took ${pages.length} pages out of their folder.`, `페이지 ${pages.length}개를 폴더에서 뺐어요.`), "success", { title: t("Gallery", "갤러리") });
      await this.loadArchive();
    }
    async deletePicked() {
      const pages = this.archive.filter((e) => this.picked.has(e.id));
      if (!pages.length) return;
      if (!await confirmIn(this.deps.ui, t(`Delete ${pages.length} pages from the Gallery?`, `갤러리에서 페이지 ${pages.length}개를 지울까요?`))) return;
      for (const e of pages) await this.deps.service.archive.remove(e.id);
      this.picked.clear();
      this.picking = false;
      await this.loadArchive();
    }
    /** Rename the open folder, or undo it (its pages stay, in no folder). */
    async folderMenu() {
      const folder2 = this.folder;
      if (!folder2) return;
      const rename = t("Rename", "이름 바꾸기");
      const undo = t("Undo the folder (pages stay)", "폴더 풀기 (페이지는 남아요)");
      const choice = await this.deps.ui.buttons(`📁 ${escapeHtml(folder2)}`, [rename, undo]);
      const pages = this.archive.filter((e) => e.folder === folder2);
      if (choice === rename) {
        const name = await this.askFolderName(t("New name of the folder", "폴더의 새 이름"), folder2);
        if (!name || name === folder2) return;
        for (const e of pages) await this.deps.service.archive.put(filed(e, name));
        this.folder = name;
      } else if (choice === undo) {
        for (const e of pages) await this.deps.service.archive.put(filed(e, ""));
        this.folder = null;
      } else return;
      await this.loadArchive();
    }
    settingsButton() {
      return el("button", { class: this.settingsOpen ? "on" : "ghost", part: "visz-archive-settings", "aria-pressed": String(this.settingsOpen), title: t("What the Gallery keeps", "갤러리에 저장할 결과"), "aria-label": t("Gallery settings", "갤러리 설정"), onclick: () => (this.settingsOpen = !this.settingsOpen, this.renderArchive()) }, icon("settings"));
    }
    /** ⚙: what is kept by itself (the AI for Gallery runs is with Dispensa's AI, in the window's header). */
    settingsBox() {
      if (!this.settingsOpen) return [];
      const s = this.deps.store.value.settings;
      const set = (fn) => {
        this.deps.store.update((st) => fn(st.settings));
        this.renderArchive();
      };
      const choose = (key2, entries, value, label, onChange) => {
        const box = el("select", { "data-key": key2, "aria-label": label }, ...entries.map(([v, text7]) => el("option", { value: v, ...v === value ? { selected: true } : {} }, text7)));
        box.value = value;
        box.addEventListener("change", () => onChange(box.value));
        return box;
      };
      return [
        el(
          "div",
          { class: "gal-settings" },
          setting(
            t("Keep", "저장할 결과"),
            choose("gallery-collect", [["chat", t("Results in the open chat", "현재 채팅 메시지만")], ["gallery", t("Gallery runs (▶)", "갤러리 실행만")], ["all", t("Both", "전체")]], s.collect, t("Keep", "저장할 결과"), (v) => set((x) => x.collect = v)),
            t("From the open chat (not /guided), from ▶, or both. ☆ in the viewer always saves", "현재 채팅(/guided 제외) · ▶ 실행 · 둘 다. 보기 창 ☆는 늘 저장")
          ),
          setting(t("HTML pages only", "HTML만 저장"), toggle(s.htmlOnly, (v) => set((x) => x.htmlOnly = v), t("HTML pages only", "HTML만 저장"), "gallery-html-only"))
        )
      ];
    }
  };
  function dateOf(at) {
    const when = new Date(at);
    return `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
  }

  // src/ui/visz-panel.ts
  var VISZ_PANEL_CSS = `
.visz-pop { width: min(440px, calc(100vw - 16px)); gap: 6px; }
.visz-pop .tabs { display: flex; gap: 4px; align-items: center; }
.visz-pop .tabs > button { width: auto; padding: 3px 10px; }
.visz-pop textarea { width: 100%; min-height: 52px; max-height: 30vh; resize: vertical; }
.visz-pop textarea { font-size: 13px; }
.visz-pop .acts { display: flex; gap: 4px; flex-wrap: nowrap; align-items: center; }
.visz-pop .acts button { width: auto; flex: none; justify-content: center; text-align: center; }
.visz-pop .acts button.main { flex: 1 1 auto; }
.visz-pop .acts button > .t { flex: 0 1 auto; text-align: center; }
.visz-pop .folder { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--d-muted); padding: 4px 4px 0; letter-spacing: .02em; }
.visz-pop .line { display: flex; gap: 3px; align-items: center; }
.visz-pop .line > button:first-child { flex: 1; min-width: 0; }
.visz-pop .line > button.mini { width: auto; flex: none; padding: 4px 6px; background: transparent; border-color: transparent; color: var(--d-muted); font-weight: 500; }
.visz-pop .line > button.mini:hover { background: var(--d-hl-bg); color: var(--d-hl-text); }
.visz-pop .line > button.mini.on { color: var(--d-accent); }
.visz-pop .meta { flex: none; margin-left: auto; font-size: 11px; color: var(--d-muted); font-weight: 500; }
.visz-pop .none { color: var(--d-muted); padding: 6px 4px; font-size: 12px; }
.visz-pop .line input[type=checkbox] { flex: none; margin: 0 2px 0 4px; }
button.visz.busy { border-color: var(--d-btn-border-active); color: var(--d-btn-text-active); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .55; } }
@media (prefers-reduced-motion: reduce) { button.visz.busy { animation: none; } }
${GALLERY_CSS}
`;
  var ViszPanel = class {
    constructor(deps) {
      this.deps = deps;
      this.box = el("textarea", {
        part: "visz-input",
        rows: "2"
      });
      onCtrlEnter(this.box, () => this.runTyped("viz"));
      this.list = el("div", { class: "list" });
      this.gallery = new GalleryView({ ...deps, openWide: () => (deps.close(), deps.openGallery()) });
      this.element = el("div", { class: "pop visz-pop", part: "visz-menu", role: "dialog" });
      this.render();
    }
    element;
    box;
    list;
    tab = "items";
    gallery;
    async refresh() {
      this.render();
      if (this.tab === "archive") await this.gallery.load();
      setTimeout(() => this.box.focus(), 0);
    }
    render() {
      this.box.placeholder = t("Topic of the page to make", "만들 페이지의 주제");
      this.box.setAttribute("aria-label", t("Visualizer request", "비주얼라이저 요청"));
      this.element.setAttribute("aria-label", t("Visualizer", "비주얼라이저"));
      const tabs = el(
        "div",
        { class: "tabs" },
        withIcons(segmented(
          "visz-menu",
          [
            { value: "items", label: "🌟", title: t("Visualizer: make a page", "비주얼라이저: 페이지 만들기") },
            { value: "archive", label: "🖼", title: t("Gallery: pages you made", "갤러리: 만든 페이지 모음") }
          ],
          this.tab,
          (v) => this.switchTab(v),
          t("Visualizer menu", "비주얼라이저 메뉴")
        ), ["moon-star", "images"]),
        el("span", { class: "meta" }),
        helpTip(
          t(
            "[[mood|bright|dark]]: asked when run · [[memo]]: pick a memo",
            "[[분위기|밝게|어둡게]]: 실행할 때 물어봄 · [[메모]]: 메모 고르기"
          ),
          t("Visualizer menu", "비주얼라이저 메뉴")
        ),
        el("button", { class: "mini ghost", title: t("Visualizer settings", "비주얼라이저 설정"), "aria-label": t("Visualizer settings", "비주얼라이저 설정"), onclick: () => this.deps.openSettings() }, icon("settings"))
      );
      if (this.tab === "archive") {
        this.element.replaceChildren(tabs, this.gallery.element);
        return;
      }
      const acts = el(
        "div",
        { class: "acts" },
        el("button", { part: "visz-memo", title: t("Pick memos into the box", "메모를 골라 칸에 넣기"), onclick: () => void this.load() }, t("📝 Memo pad", "📝 메모장")),
        el("button", { part: "visz-viz", class: "main", title: t("Make the page (Ctrl+Enter)", "페이지 만들기 (Ctrl+Enter)"), onclick: () => this.runTyped("viz") }, el("span", { class: "t" }, t("🌟 Make page", "🌟 페이지 만들기"))),
        el("button", { class: "mini ghost", title: t("Save this topic to the Memo pad", "이 주제를 메모장에 저장"), "aria-label": t("Save to the Memo pad", "메모장에 저장"), onclick: () => this.saveTyped() }, icon("star"))
      );
      this.renderItems();
      this.element.replaceChildren(tabs, this.box, acts, this.list);
    }
    switchTab(tab) {
      this.tab = tab;
      this.render();
      if (tab === "archive") void this.gallery.load();
    }
    renderItems() {
      const set = builtinSet(this.deps.qrStore.value, "visz");
      const items = set?.items ?? [];
      this.list.replaceChildren();
      if (!set || !items.length) {
        this.list.append(el("div", { class: "none", title: t("QRs in the Library's 'Visualizer' set show up here", "보관함의 '비주얼라이저' 세트에 넣은 QR이 여기에 나와요") }, t("No QRs", "QR 없음")));
        return;
      }
      for (const item of items) {
        this.list.append(
          el(
            "div",
            { class: "line" },
            el(
              "button",
              { part: "visz-item", title: item.title || item.label, onclick: () => (this.deps.close(), this.deps.run(set, item)) },
              el("span", { class: "t" }, `${item.icon ? `${item.icon} ` : ""}${item.label}`)
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
    async load() {
      const text7 = await this.deps.pickMemos();
      if (text7) this.insert(text7);
      else this.box.focus();
    }
  };

  // src/ui/memo-place.ts
  var PLACE_MARK = { all: "🌐", character: "👤", chat: "📍" };
  function placeLabel(place2) {
    if (place2 === "chat") return t("This chat", "이 채팅");
    if (place2 === "character") return t("This character", "이 캐릭터");
    return t("Every chat", "전체");
  }
  var placePrefix = (place2) => place2 === "all" ? "" : `${PLACE_MARK[place2]} `;

  // src/ui/memo-panel.ts
  var MEMO_STYLE = `
.memo-pop .head-line { display: flex; align-items: center; gap: 6px; }
.memo-pop .head-line strong { font-size: 13px; color: var(--d-title); white-space: nowrap; }
.memo-pop .head-line > button { width: auto; flex: none; }
.memo-pop .head-line .grow { flex: 1; }
.memo-pop input[type=search] { width: 100%; }
.memo-pop .acts .place { width: auto; flex: none; font-size: 12px; }
.memo-pop .list-head { font-size: 11px; color: var(--d-muted); margin: 6px 2px 2px; }
.memo-pop .board-line { display: flex; align-items: center; gap: 8px; }
.memo-pop .board-line > button { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; text-align: left; }
.memo-pop .board-line .swatch { display: flex; gap: 2px; flex: none; }
.memo-pop .board-line .swatch i { width: 14px; height: 12px; border-radius: 3px; display: block; border: 1px solid rgb(0 0 0 / .15); }
.memo-pop .board-line .t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

`;
  var SEARCH_FROM = 6;
  var MemoPanel = class {
    constructor(deps) {
      this.deps = deps;
      this.box = el("textarea", { part: "memo-input", rows: "2" });
      onCtrlEnter(this.box, () => void this.sendTyped());
      this.search = el("input", { type: "search", part: "memo-search", oninput: () => this.renderList() });
      this.list = el("div", { class: "list" });
      this.element = el("div", { class: "pop visz-pop memo-pop", part: "memo-menu", role: "dialog" });
      this.render();
    }
    element;
    box;
    search;
    list;
    /** Where the memo being written is saved; null: the memo pad's setting. */
    place = null;
    tab = "memo";
    refresh() {
      this.place = null;
      this.render();
      setTimeout(() => this.box.focus(), 0);
    }
    render() {
      this.box.placeholder = t("OOC or memo", "OOC나 메모");
      this.box.setAttribute("aria-label", t("Memo", "메모"));
      this.search.placeholder = t("Search memos", "메모 찾기");
      this.search.setAttribute("aria-label", t("Search memos", "메모 찾기"));
      this.element.setAttribute("aria-label", t("Memo pad", "메모장"));
      const tabs = withIcons(segmented(
        "memo-menu",
        [
          { value: "memo", label: "📝", title: t("Memo pad", "메모장") },
          { value: "boards", label: "📋", title: t("Memo boards", "메모 보드") }
        ],
        this.tab,
        (v) => (this.tab = v, this.render()),
        t("Memo pad menu", "메모장 메뉴")
      ), ["notebook-pen", "layout-dashboard"]);
      if (this.tab === "boards") {
        const head2 = el(
          "div",
          { class: "head-line" },
          tabs,
          el("span", { class: "grow" }),
          el("button", { class: "mini ghost", title: t("Open the memo boards large", "메모 보드 크게 열기"), "aria-label": t("Open the memo boards large", "메모 보드 크게 열기"), onclick: () => this.deps.openBoard() }, icon("maximize-2"))
        );
        this.element.replaceChildren(head2, this.boardList());
        return;
      }
      const head = el(
        "div",
        { class: "head-line" },
        tabs,
        el("span", { class: "grow" }),
        helpTip(
          t(
            "· 🌐 / 👤 / 📍: saved for every chat, this character or this chat\n· 📌: pinned memos stay listed here",
            "· 🌐 / 👤 / 📍: 전체·이 캐릭터·이 채팅에 저장\n· 📌: 고정한 메모는 여기 늘 보여요"
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
        this.placeButton(),
        el("button", { class: "mini ghost", part: "memo-save", title: t("Save to the Memo pad", "메모장에 저장"), "aria-label": t("Save to the Memo pad", "메모장에 저장"), onclick: () => this.saveTyped() }, icon("star"))
      );
      const many = visibleMemos(this.deps.store.value.memos, this.deps.scope()).length >= SEARCH_FROM;
      this.renderList();
      this.element.replaceChildren(head, this.box, acts, ...many ? [this.search] : [], this.list);
    }
    /** 📋: the boards, each opening in the Dispensa window. */
    boardList() {
      const state = this.deps.store.value;
      const boards = state.boards ?? [];
      const list = el("div", { class: "list" });
      if (!boards.length) {
        list.append(el("div", { class: "none" }, t("No boards", "보드 없음")), el("button", { onclick: () => this.deps.openBoard("new") }, t("＋ Make one", "＋ 보드 만들기")));
        return list;
      }
      for (const board of boards) {
        const colors = themeColors(board.theme);
        const cards = liveCards(board, state.memos).cards.length;
        const pictures2 = board.magnets.length;
        list.append(
          el(
            "div",
            { class: "line board-line" },
            el(
              "button",
              { part: "memo-board", title: t("Open this board", "이 보드 열기"), onclick: () => this.deps.openBoard(board.id) },
              el("span", { class: "swatch" }, ...[colors.paper, colors.card ?? colors.paper, colors.accent].map((c) => Object.assign(el("i"), { style: `background:${c}` }))),
              el("span", { class: "t" }, board.name),
              el("span", { class: "meta" }, pictures2 ? t(`${cards} ${cards === 1 ? "card" : "cards"} · ${pictures2} ${pictures2 === 1 ? "picture" : "pictures"}`, `카드 ${cards} · 그림 ${pictures2}`) : t(`${cards} ${cards === 1 ? "card" : "cards"}`, `카드 ${cards}`))
            )
          )
        );
      }
      return list;
    }
    /** Pressing it tries the next place open here. */
    placeButton() {
      const scope = this.deps.scope();
      const here = placeHere(this.place ?? this.deps.store.value.savePlace ?? "all", scope);
      const open2 = ["all", "character", "chat"].filter((p) => placeHere(p, scope) === p);
      const label = t(`Saved to: ${placeLabel(here)}`, `저장할 곳: ${placeLabel(here)}`);
      return el(
        "button",
        {
          class: "mini ghost place",
          part: "memo-place",
          title: label,
          "aria-label": label,
          onclick: () => {
            this.place = open2[(open2.indexOf(here) + 1) % open2.length];
            this.render();
          }
        },
        `${PLACE_MARK[here]} ${placeLabel(here)}`
      );
    }
    renderList() {
      const scope = this.deps.scope();
      const all = visibleMemos(this.deps.store.value.memos, scope);
      const query = all.length >= SEARCH_FROM ? this.search.value : "";
      this.list.replaceChildren();
      if (!all.length) {
        this.list.append(el("div", { class: "none" }, t("No memos", "메모 없음")));
        return;
      }
      if (query.trim()) {
        const found = shownMemos(all, query);
        if (!found.length) this.list.append(el("div", { class: "none" }, t("No matching memos.", "찾는 메모가 없어요.")));
        for (const memo2 of found) this.list.append(this.line(memo2));
        return;
      }
      const { recent, pinned } = dockMemos(all, scope);
      if (recent.length) this.list.append(el("div", { class: "list-head" }, t("Recent", "최근 메모")), ...recent.map((m2) => this.line(m2)));
      if (pinned.length) this.list.append(el("div", { class: "list-head" }, t("📌 Pinned", "📌 고정")), ...pinned.map((m2) => this.line(m2)));
    }
    line(memo2) {
      return el(
        "div",
        { class: "line" },
        el("button", { part: "memo-item", title: memo2.text.slice(0, 400), onclick: () => this.load(memo2.text) }, el("span", { class: "t" }, `${memo2.pinned ? "📌 " : ""}${placePrefix(placeOf(memo2.owner))}${memoLabel(memo2, 120)}`)),
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
      );
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
      const place2 = this.place ?? this.deps.store.value.savePlace ?? "all";
      const memos = memosFrom(text7, Date.now(), ownerFor(place2, this.deps.scope()));
      this.deps.store.update((s) => s.memos.push(...memos));
      this.box.value = "";
      this.place = null;
      this.deps.ui.toast(memos.length > 1 ? t(`Saved ${memos.length} memos.`, `메모 ${memos.length}개를 저장했어요.`) : t("Saved to the Memo pad.", "메모장에 저장했어요."), "success", { title: "📝" });
    }
  };

  // src/ui/search-box.ts
  function searchBox(opts) {
    const input = el("input", { type: "text", class: "search-input", value: opts.value, placeholder: opts.placeholder, "aria-label": opts.label, autocomplete: "off", spellcheck: "false", enterkeyhint: "search", "data-key": opts.key });
    const clear = el(
      "button",
      {
        type: "button",
        class: "search-clear",
        title: t("Clear", "지우기"),
        "aria-label": t("Clear the search", "찾을 글 지우기"),
        hidden: !opts.value,
        onclick: () => {
          input.value = "";
          clear.hidden = true;
          opts.onInput("");
          opts.cleared();
          input.focus();
        }
      },
      icon("x")
    );
    input.addEventListener("input", () => {
      clear.hidden = !input.value;
      opts.onInput(input.value);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") e.stopPropagation();
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        opts.move(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        opts.enter(e.ctrlKey || e.metaKey);
      } else if (e.key === "Delete" && input.value && input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
        e.preventDefault();
        clear.click();
      }
    });
    const box = el("div", { class: "search-box", part: opts.part }, icon("search"), input, clear);
    return { box, input };
  }
  function marked(text7, ranges) {
    const out = document.createDocumentFragment();
    let at = 0;
    for (const [s, e] of ranges ?? []) {
      if (s < at || e <= s) continue;
      if (s > at) out.append(text7.slice(at, s));
      out.append(el("mark", { class: "found" }, text7.slice(s, e)));
      at = e;
    }
    if (at < text7.length) out.append(text7.slice(at));
    return out;
  }
  var SEARCH_BOX_CSS = `
.search-box { position: relative; display: flex; align-items: center; }
.search-box > svg { position: absolute; left: 8px; width: 14px; height: 14px; color: var(--d-muted); pointer-events: none; }
.search-box > input.search-input { width: 100%; padding-left: 28px; padding-right: 28px; }
.search-box > .search-clear { position: absolute; right: 3px; padding: 3px; border-color: transparent; background: none; color: var(--d-muted); }
.search-box > .search-clear[hidden] { display: none; }
.search-box > .search-clear svg { width: 13px; height: 13px; }
mark.found { background: color-mix(in srgb, var(--d-accent) 32%, transparent); color: inherit; border-radius: 2px; padding: 0 1px; }
`;

  // src/ui/dock-search.ts
  var LIMIT = 30;
  var RECENT_SHOWN = 8;
  var WAIT_MS = 80;
  var DockSearch = class {
    constructor(deps) {
      this.deps = deps;
      const { box, input } = searchBox({
        value: "",
        placeholder: t("Search QRs", "QR 찾기"),
        label: t("Search QRs", "QR 찾기"),
        onInput: (text7) => {
          this.query = text7;
          this.openSet = null;
          this.openMenu = null;
          if (this.timer) clearTimeout(this.timer);
          if (!text7.trim()) this.draw();
          else this.timer = setTimeout(() => (this.timer = null, this.draw()), WAIT_MS);
        },
        move: (by) => this.move(by),
        enter: (edit) => {
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
            this.draw();
          }
          this.activate(this.rows[this.active], edit);
        },
        cleared: () => void 0
      });
      this.input = input;
      this.list = el("div", { class: "search-list", role: "listbox", "aria-label": t("Search results", "찾은 결과") });
      this.element = el("div", { class: "pop search-pop", part: "search-pop", role: "dialog", "aria-label": t("Search QRs", "QR 찾기") }, box, this.list);
    }
    element;
    input;
    list;
    query = "";
    /** A set or a sub menu opened from the results. */
    openSet = null;
    openMenu = null;
    active = 0;
    rows = [];
    timer = null;
    caret = null;
    /** Fresh on each opening; focus unless opened by touch (no keyboard pop-up). */
    opened(focus) {
      this.query = "";
      this.input.value = "";
      this.input.dispatchEvent(new Event("input"));
      this.openSet = null;
      this.openMenu = null;
      this.draw();
      if (focus) this.input.focus({ preventScroll: true });
    }
    /** Before a Dock redraw: notes focus and caret. */
    keepFocus() {
      const root = this.element.getRootNode();
      const has = root.activeElement === this.input;
      this.caret = has ? [this.input.selectionStart, this.input.selectionEnd] : null;
      return has;
    }
    /** After the redraw. */
    restoreFocus() {
      if (!this.caret) return;
      this.input.focus({ preventScroll: true });
      if (this.caret[0] !== null) this.input.setSelectionRange(this.caret[0], this.caret[1]);
      this.caret = null;
    }
    dispose() {
      if (this.timer) clearTimeout(this.timer);
    }
    move(by) {
      if (!this.rows.length) return;
      this.active = (this.active + by + this.rows.length) % this.rows.length;
      this.list.querySelectorAll(".row-main").forEach((b, i) => b.classList.toggle("active", i === this.active));
      this.list.querySelectorAll(".row-main")[this.active]?.scrollIntoView({ block: "nearest" });
    }
    activate(row, edit) {
      if (!row) return;
      if (row.kind === "set") {
        this.openSet = row.set.id;
        this.active = 0;
        this.draw();
        return;
      }
      if (edit && this.deps.edit) {
        this.deps.edit(row.set, row.item);
        return;
      }
      const state = this.deps.state();
      if (!row.run.script.trim() && state && hasMenu(state, row.item)) {
        this.openMenu = { set: row.set, item: row.item };
        this.active = 0;
        this.draw();
        return;
      }
      this.deps.run(row.set, row.run);
    }
    compute() {
      const state = this.deps.state();
      const heads = /* @__PURE__ */ new Map();
      if (!state) return { rows: [], heads, empty: "" };
      if (this.openMenu) {
        const { set, item } = this.openMenu;
        const rows2 = [];
        const add = (groups, path) => {
          for (const g of groups) {
            if (!path.length && g.entries.length) heads.set(rows2.length, g.set.name);
            for (const entry of g.entries) {
              rows2.push({ kind: "item", set: entry.set, item: entry.item, run: entry.run, path, hidden: false, showSet: false });
              add(entry.children, [...path, entry.item.label]);
            }
          }
        };
        add(contextMenu(state, set, item), []);
        return { rows: rows2, heads, back: item.label, empty: t("Nothing in this menu", "이 메뉴는 비어 있어요") };
      }
      if (this.openSet) {
        const set = state.sets.find((s) => s.id === this.openSet);
        if (set) {
          const rows2 = set.items.map((item) => ({ kind: "item", set, item, run: item, path: [], hidden: !!item.hidden, showSet: false }));
          return { rows: rows2, heads, back: set.name, empty: t("This set has no QRs", "이 세트에는 QR이 없어요") };
        }
        this.openSet = null;
      }
      if (!this.query.trim()) {
        const recent = (this.deps.recent?.() ?? []).slice(0, RECENT_SHOWN);
        const rows2 = recent.map(({ set, item }) => ({ kind: "item", set, item, run: item, path: [], hidden: !!item.hidden, showSet: true }));
        if (rows2.length) heads.set(0, t("Recent", "최근 실행"));
        return { rows: rows2, heads, empty: t("No QRs run yet", "아직 실행한 QR이 없어요") };
      }
      const index = this.deps.index?.() ?? buildIndex(state);
      const found = search(index, this.query, { body: true, limit: LIMIT });
      const rows = [
        ...found.sets.map((h2) => ({ kind: "set", set: h2.set, marks: h2.marks })),
        ...found.items.map((h2) => ({ kind: "item", set: h2.set, item: h2.item, run: h2.run, path: h2.path, hidden: h2.hidden, marks: h2.marks.name, line: h2.line, showSet: true }))
      ];
      if (found.sets.length) heads.set(0, t("Sets", "세트"));
      if (found.items.length) heads.set(found.sets.length, t("QR", "QR"));
      return { rows, heads, empty: t("Nothing found", "찾은 게 없어요") };
    }
    draw() {
      const { rows, heads, back, empty } = this.compute();
      this.rows = rows;
      this.active = Math.max(0, Math.min(this.active, rows.length - 1));
      const out = [];
      if (back) {
        out.push(
          el(
            "div",
            { class: "head" },
            el("button", { class: "more back", type: "button", title: t("Back", "뒤로"), "aria-label": t("Back", "뒤로"), onclick: (e) => (e.stopPropagation(), this.openSet = null, this.openMenu = null, this.active = 0, this.draw()) }, "‹"),
            back
          )
        );
      }
      rows.forEach((row, i) => {
        const head = heads.get(i);
        if (head) out.push(el("div", { class: "group-h" }, head));
        out.push(this.row(row, i));
      });
      if (!rows.length) out.push(el("div", { class: "empty-note" }, empty));
      this.list.replaceChildren(...out);
    }
    row(row, i) {
      const cls = `row-main${i === this.active ? " active" : ""}`;
      if (row.kind === "set") {
        const count = row.set.items.filter((x) => !x.hidden).length;
        return el(
          "div",
          { class: "entry-row" },
          el(
            "button",
            { class: cls, part: "item", role: "option", title: row.set.name, onclick: (e) => (e.stopPropagation(), this.active = i, this.activate(row, false)) },
            document.createTextNode(`${row.set.icon?.trim() || "📁"} `),
            el("span", { class: "t" }, el("span", { class: "lab" }, marked(row.set.name, row.marks))),
            el("span", { class: "tag" }, String(count)),
            el("span", { class: "go", "aria-hidden": "true" }, "›")
          )
        );
      }
      const { item } = row;
      const main = el(
        "button",
        {
          class: `${cls}${row.hidden ? " dim" : ""}`,
          part: "item",
          role: "option",
          title: [item.title || item.label, row.hidden ? t("Hidden from the Dock", "Dock에서 숨김") : ""].filter(Boolean).join("\n"),
          onclick: (e) => {
            e.stopPropagation();
            const me = e;
            this.activate(row, me.ctrlKey || me.metaKey);
          }
        },
        item.icon?.trim() ? document.createTextNode(`${firstGrapheme(item.icon)} `) : null,
        el(
          "span",
          { class: "t" },
          el("span", { class: "lab" }, row.path.length ? `${row.path.join(" › ")} › ` : "", marked(item.label, row.marks)),
          row.line ? el("span", { class: "line" }, marked(row.line.text, row.line.marks)) : null
        ),
        row.hidden ? el("span", { class: "tag" }, t("Hidden", "숨김")) : null,
        row.showSet ? el("span", { class: "tag" }, row.set.name) : null
      );
      const edit = this.deps.edit ? el("button", { class: "more", type: "button", title: t("Edit (Ctrl+click)", "편집 (Ctrl+클릭)"), "aria-label": t(`Edit ${item.label}`, `${item.label} 편집`), onclick: (e) => (e.stopPropagation(), this.deps.edit(row.set, item)) }, "✎") : null;
      return el("div", { class: "entry-row" }, main, edit);
    }
  };
  var DOCK_SEARCH_CSS = `
.search-pop { width: min(360px, calc(100vw - 16px)); padding-top: 0; }
.search-pop > .search-box { position: sticky; top: 0; z-index: 1; margin: 0 -6px; padding: 6px 6px 4px; background: var(--d-panel-solid); }
.search-pop > .search-box > svg { left: 14px; }
.search-pop > .search-box > .search-clear { right: 9px; width: auto; }
.search-pop .search-list { display: flex; flex-direction: column; gap: 4px; }
.search-pop .row-main.active { border-color: var(--d-btn-border-hover); background: var(--d-hl-bg); }
.search-pop .row-main.dim { opacity: .6; }
.search-pop .row-main > .t { display: flex; flex-direction: column; }
.search-pop .row-main .lab { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-pop .row-main .line { font: 11px/1.3 var(--d-mono); color: var(--d-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-pop .row-main .tag { flex: none; max-width: 38%; margin-left: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 500; color: var(--d-muted); }
.search-pop .row-main .go { flex: none; margin-left: 6px; color: var(--d-muted); }
.search-pop .head { display: flex; align-items: center; gap: 6px; }
.search-pop .head > .back { width: auto; padding: 2px 8px; }
.search-pop .empty-note { padding: 8px 6px; color: var(--d-muted); }
`;

  // src/ui/dock.ts
  var VISZ_MENU = "\0visz";
  var MEMO_MENU = "\0memo";
  var GROUP_MENU = "\0group:";
  var SEARCH_MENU = "\0search";
  var PER_ROW = 8;
  var EMOJI = /\p{Extended_Pictographic}/u;
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
:host { --bubble: 30px; --bubble-gap: 5px; }
.bubbles { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--bubble-gap); padding: 6px 4px 8px; margin: 0 auto;
  max-width: calc(${PER_ROW} * var(--bubble) + ${PER_ROW - 1} * var(--bubble-gap) + 8px); }
/* a set laid out as a line: breaks around it */
.bubbles > .break, .lane > .break { flex-basis: 100%; height: 0; }
.bubbles > .break:first-child, .bubbles > .break:last-child, .bubbles > .break + .break,
.lane > .break:first-child, .lane > .break:last-child, .lane > .break + .break { display: none; }
/* scrolling: a lane of --span bubbles (x) or lines (y), 🔍 ⏹ ⚙ fixed after it; padding keeps badges and rings whole */
.bubbles.flow-x, .bubbles.flow-y { flex-wrap: nowrap; align-items: center; gap: 2px; max-width: 100%; padding: 0 4px 2px; }
.bubbles > .lane { min-width: 0; padding: 6px 6px 8px; gap: var(--bubble-gap); scrollbar-width: none; }
.bubbles > .lane::-webkit-scrollbar { display: none; }
.flow-x > .lane { display: flex; flex-wrap: nowrap; align-items: center; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain;
  max-width: calc(var(--span) * var(--bubble) + (var(--span) - 1) * var(--bubble-gap) + 12px); }
.flow-x > .lane > * { flex: none; }
.flow-y > .lane { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; overflow-y: auto; overflow-x: hidden; overscroll-behavior-y: contain;
  width: calc(${PER_ROW} * var(--bubble) + ${PER_ROW - 1} * var(--bubble-gap) + 12px);
  max-height: calc(var(--span) * var(--bubble) + (var(--span) - 1) * var(--bubble-gap) + 14px); }
.flow-x > .lane.more-start { -webkit-mask-image: linear-gradient(to right, transparent, #000 28px); mask-image: linear-gradient(to right, transparent, #000 28px); }
.flow-x > .lane.more-end { -webkit-mask-image: linear-gradient(to left, transparent, #000 28px); mask-image: linear-gradient(to left, transparent, #000 28px); }
.flow-x > .lane.more-start.more-end { -webkit-mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, transparent, #000 28px, #000 calc(100% - 28px), transparent); }
.flow-y > .lane.more-start { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 16px); mask-image: linear-gradient(to bottom, transparent, #000 16px); }
.flow-y > .lane.more-end { -webkit-mask-image: linear-gradient(to top, transparent, #000 16px); mask-image: linear-gradient(to top, transparent, #000 16px); }
.flow-y > .lane.more-start.more-end { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 16px, #000 calc(100% - 16px), transparent); mask-image: linear-gradient(to bottom, transparent, #000 16px, #000 calc(100% - 16px), transparent); }
.bubbles > .tail { flex: none; display: flex; align-items: center; gap: var(--bubble-gap); padding: 6px 2px 8px; }
.flow-y > .tail { display: grid; grid-auto-flow: column; grid-template-rows: repeat(var(--tail-rows, 1), var(--bubble)); }
.lane > .sep { width: 1px; height: calc(var(--bubble) - 8px); margin: 0 2px; background: var(--d-line); }
.lane > .sep:first-child, .lane > .sep:last-child, .lane > .sep + .sep { display: none; }
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
/* hidden until the pointer or a touch is on the ⋯ handle or the bubbles */
.slide { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; opacity: 0; transform: translateY(6px); pointer-events: none;
  transition: grid-template-rows 180ms ease, opacity 150ms ease, transform 180ms ease; }
.slide > .clip { min-height: 0; overflow: hidden; }
:host(.revealed) .slide { grid-template-rows: 1fr; opacity: 1; transform: none; pointer-events: auto; }
/* once up, badges and shadows may spill past the row */
:host(.revealed) .slide > .clip { overflow: visible; }
@media (prefers-reduced-motion: reduce) { .slide { transition: none; } }
.handle { position: relative; display: flex; align-items: center; justify-content: center; gap: 3px; height: 14px; margin: 0 0 2px; cursor: pointer; touch-action: manipulation; }
/* a finger-sized target around the small dots */
.handle::before { content: ""; position: absolute; inset: -10px 25%; }
.handle i { width: 4px; height: 4px; border-radius: 50%; background: var(--d-muted); opacity: .7; transition: background-color 150ms ease, opacity 150ms ease; }
.handle:hover i, :host(.revealed) .handle i { background: var(--d-accent); opacity: 1; }
.pop button.running { border-color: var(--d-btn-border-active); color: var(--d-btn-text-active); background: var(--d-btn-bg-active); }
.warn { color: #e6a23c; }
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
.pop button > .t { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.pop .head { font-size: 12px; color: var(--d-muted); padding: 2px 4px 4px; }
svg { width: 15px; height: 15px; flex: none; }
${VISZ_PANEL_CSS}
${MEMO_STYLE}
${SEARCH_BOX_CSS}
${DOCK_SEARCH_CSS}
${FORM_CSS}`;
  function paint(b, set) {
    if (!set.color) return;
    b.style.borderColor = set.color;
    if (!set.colorBorderOnly) b.style.background = `color-mix(in srgb, ${set.color} 38%, var(--d-shell-bg))`;
  }
  var Dock = class {
    constructor(handlers) {
      this.handlers = handlers;
      this.element = document.createElement("div");
      this.element.id = "dispensa-dock";
      this.root = this.element.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = STYLE2;
      this.container = el("div", { class: "wrap" });
      this.root.append(style, this.container);
      this.search = new DockSearch({
        state: () => this.state,
        index: handlers.searchIndex,
        recent: handlers.recent,
        run: (set, item) => {
          this.openSetId = null;
          this.ctx = null;
          handlers.run(set, item);
          this.render();
        },
        edit: handlers.edit ? (set, item) => {
          this.openSetId = null;
          this.ctx = null;
          handlers.edit(set, item);
          this.render();
        } : void 0
      });
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
        if (e.pointerType !== "touch") this.setHover("dock", true);
      });
      this.element.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "touch") this.setHover("dock", false);
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
    visz = { show: false, icon: "🍰", busy: null };
    memo = { show: false, icon: "📝" };
    groups = [];
    overTarget = false;
    overDock = false;
    touchOpen = false;
    hideTimer = null;
    revealTarget = null;
    /** An open sub menu (right-click / long-press on a QR). */
    ctx = null;
    /** Open nested entries in the sub menu, by path. */
    expanded = /* @__PURE__ */ new Set();
    pressTimer = null;
    pressed = false;
    /** Touch opens 🔍 without the keyboard. */
    lastPointer = "";
    search;
    /** Lane scroll, kept through redraws. */
    scrollPos = { x: 0, y: 0 };
    laneObserver = null;
    /** When the open menu opened: scrolling its bubble into view mustn't close it. */
    openedMenu = null;
    openedAt = 0;
    /** An extra area that brings the Dock up (besides the Dock's own ⋯ handle). */
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
    /** A touch on the Dock (its ⋯ handle) shows it; a touch anywhere else hides it. */
    onPointerDown = (e) => {
      this.lastPointer = e.pointerType;
      if (e.pointerType !== "touch") return;
      const path = e.composedPath();
      const inside = path.includes(this.element) || !!this.revealTarget && path.includes(this.revealTarget) || path.some((n) => n.id === "dispensa-dialogs");
      if (inside !== this.touchOpen) {
        this.touchOpen = inside;
        this.updateReveal();
      }
    };
    setHover(which, over2) {
      if (which === "target") this.overTarget = over2;
      else this.overDock = over2;
      this.updateReveal();
    }
    get armed() {
      return !!this.state?.dockVisible;
    }
    get shouldShow() {
      if (!this.armed) return false;
      return !!this.ctx || this.overTarget || this.overDock || this.touchOpen || this.openSetId !== null || this.running !== null || !!this.visz.busy || this.element.matches(":focus-within");
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
      this.search.dispose();
      this.laneObserver?.disconnect();
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
    setState(state) {
      this.state = state;
      this.render();
    }
    setVisz(view) {
      this.visz = view;
      this.render();
    }
    setMemo(view) {
      this.memo = view;
      this.render();
    }
    /** Other extensions' buttons, by extension id. */
    setGroups(groups) {
      this.groups = [...groups];
      if (this.openSetId?.startsWith(GROUP_MENU) && !groups.has(this.openSetId.slice(GROUP_MENU.length))) this.openSetId = null;
      this.render();
    }
    groupButtons(bubbles) {
      for (const [id, group] of this.groups) {
        if (!group.items.length) continue;
        const key2 = GROUP_MENU + id;
        const open2 = this.openSetId === key2;
        const button = this.bubble("extension", bubbleGlyph(group.icon, group.name, "🧩"), `${group.name} (${group.items.length})`, (e) => {
          this.openSetId = open2 ? null : key2;
          this.render();
          e.stopPropagation();
        }, { "aria-expanded": String(open2) });
        button.append(el("span", { class: "count" }, String(group.items.length)));
        bubbles.append(button);
        if (!open2) continue;
        const pop = el("div", { class: "pop", part: "extension-menu", role: "menu" }, el("div", { class: "head" }, group.name));
        let heading;
        for (const item of group.items) {
          if (item.group && item.group !== heading) pop.append(el("div", { class: "group-h" }, item.group));
          heading = item.group;
          pop.append(
            el("button", { role: "menuitem", title: item.title, onclick: () => {
              this.closeMenus();
              try {
                item.run();
              } catch {
              }
            } }, el("span", { class: "t" }, item.label))
          );
        }
        this.placePop(pop, button);
      }
    }
    searchButton(bubbles) {
      if (this.state?.dockSearch === false) return;
      const open2 = this.openSetId === SEARCH_MENU;
      const button = this.bubble("search", icon("search"), t("Search QRs", "QR 찾기"), (e) => {
        this.openSetId = open2 ? null : SEARCH_MENU;
        this.render();
        if (!open2) this.search.opened(this.lastPointer !== "touch");
        e.stopPropagation();
      }, { "aria-expanded": String(open2) });
      bubbles.append(button);
      if (open2) this.placePop(this.search.element, button);
    }
    memoButton(bubbles) {
      const hooks = this.handlers.memo;
      if (!hooks || !this.memo.show) return;
      const open2 = this.openSetId === MEMO_MENU;
      const button = this.bubble("memo", bubbleGlyph(this.memo.icon, t("Memo pad", "메모장"), "📝"), t("Memo pad", "메모장"), (e) => {
        this.openSetId = open2 ? null : MEMO_MENU;
        this.render();
        if (!open2) hooks.panel.refresh();
        e.stopPropagation();
      }, { "aria-expanded": String(open2) });
      bubbles.append(button);
      if (open2) this.placePop(hooks.panel.element, button);
    }
    closeMenus() {
      if (this.openSetId) {
        this.openSetId = null;
        this.render();
      }
    }
    viszButton(bubbles) {
      const hooks = this.handlers.visz;
      if (!hooks || !this.visz.show) return;
      const open2 = this.openSetId === VISZ_MENU;
      const button = this.bubble("visz", bubbleGlyph(this.visz.icon, t("Visualizer", "비주얼라이저"), "🍰"), this.visz.busy ? t(`Making ${this.visz.busy}…`, `${this.visz.busy} 만드는 중…`) : t("Visualizer", "비주얼라이저"), (e) => {
        this.openSetId = open2 ? null : VISZ_MENU;
        this.render();
        if (!open2) void hooks.panel.refresh();
        e.stopPropagation();
      }, { "aria-expanded": String(open2), class: `visz${this.visz.busy ? " busy" : ""}` });
      bubbles.append(button);
      if (open2) this.placePop(hooks.panel.element, button);
    }
    /** Opens a menu above the bubble, kept inside the Dock's width. */
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
    /** Ctrl/⌘ opens the QR in the manager, a QR with only a sub menu opens that, else it runs. */
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
    itemBubble(set, item) {
      const key2 = `${set.id}/${item.id}`;
      const b = this.bubble("item", bubbleGlyph(item.icon, item.label), item.title || item.label, (e) => this.press(e, set, item, key2), this.running?.id === item.id ? { class: "running" } : {});
      paint(b, set);
      if (item.unsupported?.length) b.append(el("span", { class: "warn-dot", title: t(`Unsupported commands: ${item.unsupported.join(", ")}`, `지원 안 되는 명령: ${item.unsupported.join(", ")}`) }, "⚠"));
      this.bindMenu(b, set, item, key2);
      if (this.ctx?.key === key2) this.placePop(this.menuPop(), b);
      return b;
    }
    /** A QR in a folder's menu. */
    itemButton(set, item, onPress) {
      const b = el("button", {
        part: "item",
        title: item.title || item.label,
        class: this.running?.id === item.id ? "running" : "",
        onclick: onPress ?? ((e) => this.press(e, set, item, `${set.id}/${item.id}`))
      });
      const glyph = item.icon?.trim() ? firstGrapheme(item.icon) : "";
      if (glyph) b.append(document.createTextNode(item.showLabel === false ? glyph : `${glyph} `));
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
    /** Restores the lane's scroll, fades hidden edges, turns the wheel sideways. */
    keepScroll(lane, flow, tailCount) {
      lane.parentElement.style.setProperty("--tail-rows", String(Math.max(1, Math.min(tailCount, this.state ? dockFlow(this.state).span : 1))));
      lane.scrollLeft = this.scrollPos.x;
      lane.scrollTop = this.scrollPos.y;
      const fade = () => {
        if (flow === "x") {
          lane.classList.toggle("more-start", lane.scrollLeft > 1);
          lane.classList.toggle("more-end", lane.scrollLeft + lane.clientWidth < lane.scrollWidth - 1);
        } else {
          lane.classList.toggle("more-start", lane.scrollTop > 1);
          lane.classList.toggle("more-end", lane.scrollTop + lane.clientHeight < lane.scrollHeight - 1);
        }
      };
      lane.addEventListener("scroll", () => {
        fade();
        if (Math.abs(lane.scrollLeft - this.scrollPos.x) < 1 && Math.abs(lane.scrollTop - this.scrollPos.y) < 1) return;
        this.scrollPos = { x: lane.scrollLeft, y: lane.scrollTop };
        if ((this.openSetId || this.ctx) && performance.now() - this.openedAt > 300) {
          this.openSetId = null;
          this.ctx = null;
          this.render();
        }
      });
      if (flow === "x") {
        lane.addEventListener(
          "wheel",
          (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            const room = e.deltaY > 0 ? lane.scrollWidth - lane.clientWidth - lane.scrollLeft : lane.scrollLeft;
            if (room < 1) return;
            e.preventDefault();
            lane.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
          },
          { passive: false }
        );
      }
      this.laneObserver?.disconnect();
      this.laneObserver = typeof ResizeObserver === "function" ? new ResizeObserver(fade) : null;
      this.laneObserver?.observe(lane);
      requestAnimationFrame(fade);
    }
    render() {
      const s = this.state;
      const searchFocused = this.openSetId === SEARCH_MENU && this.search.keepFocus();
      const menu = this.ctx?.key ?? this.openSetId;
      if (menu && menu !== this.openedMenu) this.openedAt = performance.now();
      this.openedMenu = menu;
      const oldLane = this.container.querySelector(".lane");
      if (oldLane) this.scrollPos = { x: oldLane.scrollLeft, y: oldLane.scrollTop };
      this.container.replaceChildren();
      if (!s) return;
      this.element.hidden = !s.dockVisible;
      if (!s.dockVisible) {
        this.openSetId = null;
        this.updateReveal();
        return;
      }
      if (this.openSetId === SEARCH_MENU && s.dockSearch === false) this.openSetId = null;
      const { flow, span } = dockFlow(s);
      const bubbles = el("div", { class: `bubbles flow-${flow}`, part: "dock", role: "toolbar", "aria-label": "Quick Reply" });
      const lane = flow === "wrap" ? bubbles : el("div", { class: "lane" });
      const tail = flow === "wrap" ? bubbles : el("div", { class: "tail" });
      if (flow !== "wrap") {
        bubbles.style.setProperty("--span", String(span));
        bubbles.append(lane, tail);
      }
      const lineBreak = () => el("div", { class: flow === "x" ? "sep" : "break" });
      this.viszButton(lane);
      this.memoButton(lane);
      const shown = shownDock(s);
      for (const [n, { entry, set, item: one }] of shown.entries()) {
        if (one) {
          lane.append(this.itemBubble(set, one));
          continue;
        }
        const items = set.items.filter((i) => !i.hidden);
        if (!items.length) continue;
        if (layoutOf(entry, set) === "row") {
          lane.append(lineBreak());
          const own = new Set(shown.flatMap((x) => x.item ? [x.item.id] : []));
          for (const item of items) if (!own.has(item.id)) lane.append(this.itemBubble(set, item));
          if (n < shown.length - 1 || flow !== "wrap") lane.append(lineBreak());
          continue;
        }
        const open2 = this.openSetId === set.id;
        const folder2 = this.bubble("folder", bubbleGlyph(set.icon, set.name, "📁"), `${set.name} (${items.length})`, (e) => {
          this.openSetId = open2 ? null : set.id;
          this.render();
          e.stopPropagation();
        }, { "aria-expanded": String(open2) });
        folder2.append(el("span", { class: "count" }, String(items.length)));
        paint(folder2, set);
        lane.append(folder2);
        if (open2 && this.ctx?.set.id === set.id) {
          this.placePop(this.menuPop(true), folder2);
        } else if (open2) {
          const pop = el("div", { class: "pop", part: "folder-menu", role: "menu" }, el("div", { class: "head" }, set.name));
          for (const item of items) {
            const b = this.itemButton(set, item);
            this.bindMenu(b, set, item, `${set.id}/${item.id}`);
            pop.append(b);
          }
          this.placePop(pop, folder2);
        }
      }
      this.groupButtons(lane);
      this.searchButton(tail);
      if (this.running) {
        tail.append(this.bubble("stop", icon("square"), t(`Stop "${this.running.label}"`, `"${this.running.label}" 중지`), () => this.handlers.stop(), { class: "stop" }));
      }
      tail.append(this.bubble("manage", icon("settings"), t("Manage QRs (Dispensa)", "QR 관리 (Dispensa)"), () => this.handlers.openManager()));
      this.container.prepend(
        el("div", { class: "slide" }, el("div", { class: "clip" }, bubbles)),
        el("div", { class: "handle", part: "handle", title: "Dock", "aria-hidden": "true" }, el("i"), el("i"), el("i"))
      );
      if (flow !== "wrap") this.keepScroll(lane, flow, tail.children.length);
      if (searchFocused) this.search.restoreFocus();
      this.updateReveal();
    }
  };

  // src/ui/dock-placement.ts
  function keepDockPlaced(parts3) {
    let scheduled = false;
    const place2 = () => {
      scheduled = false;
      const composer = findComposer();
      if (!composer) {
        if (parts3.dock.isConnected) parts3.dock.remove();
        return;
      }
      const box = composer.container.querySelector(".mari-chat-input-box");
      parts3.toggle.mount(box ?? composer.textarea.parentElement);
      const anchor = box ?? composer.textarea.closest("form") ?? composer.textarea.parentElement;
      const parent = anchor?.parentElement;
      if (!anchor || !parent) return;
      if (parts3.dock.parentElement !== parent || parts3.dock.nextElementSibling !== anchor) parent.insertBefore(parts3.dock, anchor);
      parts3.afterPlace?.();
      const viewer = parts3.viewer();
      if (viewer?.open) {
        if (viewer.element.parentElement !== parent || viewer.element.nextElementSibling !== parts3.dock) parent.insertBefore(viewer.element, parts3.dock);
      } else if (viewer?.element.isConnected) viewer.element.remove();
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(place2);
      }
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    place2();
    return { schedule, dispose: () => observer.disconnect() };
  }

  // src/ui/files.ts
  function downloadJson(data, name) {
    saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), name.replace(/[\\/:*?"<>|]/g, "_"));
  }
  var picking = null;
  function pickFiles(onFiles, { accept = "", multiple = false, json: json2 = false } = {}) {
    picking?.remove();
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    const phone = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const filter = json2 ? phone ? "" : ".json,application/json" : accept;
    if (filter) input.accept = filter;
    input.style.display = "none";
    const done = () => {
      input.remove();
      if (picking === input) picking = null;
    };
    input.addEventListener("change", () => {
      const files = [...input.files ?? []];
      done();
      if (files.length) onFiles(files);
    });
    input.addEventListener("cancel", done);
    document.body.append(input);
    picking = input;
    input.click();
  }

  // src/ui/memo-editor.ts
  var MEMO_EDITOR_CSS = `
.memo-tools { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.memo-tools > button { min-width: 2em; padding: 3px 7px; font-size: 12.5px; justify-content: center; }
.memo-tools .sep { width: 1px; align-self: stretch; margin: 2px 3px; background: var(--d-line); }
.memo-tools input[type=color] { width: 2em; height: 1.9em; padding: 1px; border-radius: var(--d-radius-sm); cursor: pointer; }
.memo-tools select { width: auto; max-width: 9em; padding: 3px 6px; font-size: 12.5px; }
.memo-edit .done-line { display: flex; justify-content: flex-end; }
`;
  var BASIC_FONTS = [
    ["sans-serif", () => t("Sans", "고딕")],
    ["serif", () => t("Serif", "명조")],
    ["monospace", () => t("Monospace", "고정폭")]
  ];
  var SIZES = [
    ["0.85em", () => t("Small", "작게")],
    ["1.25em", () => t("Large", "크게")],
    ["1.6em", () => t("Huge", "아주 크게")]
  ];
  var familyValue = (family) => BASIC_FONTS.some(([f]) => f === family) ? family : `'${family.replace(/'/g, "")}'`;
  function memoEditor(deps) {
    const ta = el("textarea", { "data-key": deps.key, "aria-label": t("Memo text", "메모 내용"), oninput: () => deps.onText(ta.value) });
    ta.value = deps.text;
    setTimeout(() => {
      const root = ta.getRootNode();
      if (!ta.isConnected || root.activeElement && root.activeElement !== document.body) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 0);
    const apply = (step) => {
      const next = step({ text: ta.value, start: ta.selectionStart, end: ta.selectionEnd });
      if (!next) return false;
      ta.value = next.text;
      ta.focus();
      ta.setSelectionRange(next.start, next.end);
      deps.onText(next.text);
      return true;
    };
    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (apply(continueList)) e.preventDefault();
    });
    const keep = (e) => e.preventDefault();
    const button = (label, title, run, style = "") => el("button", { type: "button", title, "aria-label": title, style, onmousedown: keep, onclick: run }, label);
    const marks = (label, title, open2, close, style = "") => button(label, title, () => apply((e) => wrap2(e, open2, close)), style);
    const lines = (label, title, kind) => button(label, title, () => apply((e) => setLines(e, kind)));
    const color = el("input", { type: "color", value: "#e5484d", title: t("Text color", "글자색"), "aria-label": t("Text color", "글자색") });
    color.addEventListener("change", () => apply((e) => styleSelection(e, "color", color.value)));
    const noColor = button("⌀", t("No color", "글자색 빼기"), () => apply((e) => styleSelection(e, "color", "")));
    const choose = (label, options, run) => {
      const select2 = el("select", { "aria-label": label, title: label });
      const fill2 = (list) => select2.replaceChildren(el("option", { value: "" }, label), el("option", { value: "-" }, t("Default", "기본")), ...list.map(([v, l]) => el("option", { value: v }, l)));
      fill2(options);
      select2.addEventListener("change", () => {
        const v = select2.value;
        select2.value = "";
        if (v) run(v === "-" ? "" : v);
      });
      return { select: select2, fill: fill2 };
    };
    const size = choose(t("Size", "크기"), SIZES.map(([v, l]) => [v, l()]), (v) => apply((e) => styleSelection(e, "font-size", v)));
    const basic = BASIC_FONTS.map(([v, l]) => [v, l()]);
    const font = choose(t("Font", "글꼴"), basic, (v) => apply((e) => styleSelection(e, "font-family", v && familyValue(v))));
    void deps.fonts().then((names) => names.length && font.fill([...basic, ...names.map((n) => [n, n])])).catch(() => void 0);
    const sep = () => el("span", { class: "sep" });
    const tools = el(
      "div",
      { class: "memo-tools", role: "toolbar", "aria-label": t("Format", "서식") },
      marks("B", t("Bold", "굵게"), "**", "**", "font-weight:700"),
      marks("I", t("Italic", "기울임"), "*", "*", "font-style:italic"),
      marks("S", t("Strikethrough", "취소선"), "~~", "~~", "text-decoration:line-through"),
      marks("U", t("Underline", "밑줄"), "<u>", "</u>", "text-decoration:underline"),
      marks("</>", t("Code", "코드"), "`", "`"),
      sep(),
      lines("H1", t("Heading 1", "제목 1"), "h1"),
      lines("H2", t("Heading 2", "제목 2"), "h2"),
      lines("H3", t("Heading 3", "제목 3"), "h3"),
      sep(),
      lines("•", t("Bulleted list", "점 목록"), "bullet"),
      lines("1.", t("Numbered list", "번호 목록"), "number"),
      lines("☐", t("Checklist", "체크박스 목록"), "check"),
      sep(),
      color,
      noColor,
      size.select,
      font.select
    );
    const done = el("div", { class: "done-line" }, el("button", { type: "button", onclick: () => deps.onDone() }, t("Done", "완료")));
    return [tools, ta, done];
  }

  // src/ui/memo-render.ts
  var MEMO_RENDER_CSS = `
.memo-body { padding: 8px 10px; border: 1px solid var(--d-field-border); border-radius: var(--d-radius-sm); background: var(--d-field);
  cursor: text; white-space: normal; word-break: break-word; line-height: 1.55; min-height: 2.4em; }
.memo-body:hover { border-color: var(--d-btn-border-hover); }
.memo-body > :first-child { margin-top: 0; } .memo-body > :last-child { margin-bottom: 0; }
.memo-body h1, .memo-body h2, .memo-body h3 { margin: .5em 0 .3em; line-height: 1.3; color: var(--d-title); }
.memo-body h1 { font-size: 1.4em; } .memo-body h2 { font-size: 1.2em; } .memo-body h3 { font-size: 1.05em; }
.memo-body p { margin: .35em 0; }
.memo-body ul, .memo-body ol { margin: .35em 0; padding-left: 1.4em; }
.memo-body ul.checks { list-style: none; padding-left: .2em; }
.memo-body ul.checks label { display: inline-flex; flex-direction: row; gap: 6px; align-items: baseline; cursor: pointer; font-size: inherit; color: inherit; }
.memo-body ul.checks .done > label > span { text-decoration: line-through; color: var(--d-muted); }
.memo-body code { font-family: var(--d-mono); font-size: .9em; padding: 0 4px; border-radius: 4px; background: var(--d-btn-bg); }
.memo-body .empty { color: var(--d-muted); }
`;
  function renderMemo(text7, hooks) {
    return parseMemo(text7).map((b) => block(b, hooks));
  }
  function block(b, hooks) {
    if (b.kind === "heading") return el(`h${b.level}`, {}, ...inlines(b.content, hooks));
    if (b.kind === "paragraph") return el("p", {}, ...b.lines.flatMap((line, i) => [...i ? [el("br")] : [], ...inlines(line, hooks)]));
    if (b.kind === "list") {
      const list2 = el(b.ordered ? "ol" : "ul", b.ordered && b.start !== 1 ? { start: String(b.start) } : {});
      for (const item of b.items) list2.append(indented(el("li", {}, ...inlines(item.content, hooks)), item.indent));
      return list2;
    }
    const list = el("ul", { class: "checks" });
    for (const item of b.items) {
      const box = el("input", { type: "checkbox" });
      box.checked = item.checked;
      box.addEventListener("click", (e) => {
        e.stopPropagation();
        hooks.onToggle(item.index);
      });
      const label = el("label", { onclick: (e) => e.stopPropagation() }, box, el("span", {}, ...inlines(item.content, hooks)));
      list.append(indented(el("li", { class: item.checked ? "done" : "" }, label), item.indent));
    }
    return list;
  }
  function indented(li, indent) {
    if (indent) li.style.marginLeft = `${indent * 1.2}em`;
    return li;
  }
  function inlines(list, hooks) {
    return list.map((n) => inline(n, hooks));
  }
  function inline(n, hooks) {
    switch (n.kind) {
      case "text":
        return document.createTextNode(n.text);
      case "code":
        return el("code", {}, n.text);
      case "bold":
        return el("strong", {}, ...inlines(n.children, hooks));
      case "italic":
        return el("em", {}, ...inlines(n.children, hooks));
      case "strike":
        return el("s", {}, ...inlines(n.children, hooks));
      case "underline":
        return el("u", {}, ...inlines(n.children, hooks));
      case "span": {
        const span = el("span", {}, ...inlines(n.children, hooks));
        if (n.style.color) span.style.color = n.style.color;
        if (n.style.size) span.style.fontSize = n.style.size;
        if (n.style.font) {
          span.style.fontFamily = n.style.font;
          hooks.useFont(n.style.font);
        }
        return span;
      }
    }
  }

  // src/ui/memo-view.ts
  var MEMO_VIEW_CSS = `
.memo-list { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.memo-row { display: flex; align-items: center; gap: 4px; }
.memo-row > .entry { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.memo-row .pin.on { color: var(--d-accent); }
.memo-row .menu.place > summary { min-width: 2em; text-align: center; }
.memo-row .menu.place .away { opacity: .45; }
.memo-edit { margin: 2px 0 8px 0; display: flex; flex-direction: column; gap: 6px; }
.memo-edit textarea { font-family: var(--d-font); min-height: 90px; }
.memo-count { color: var(--d-muted); font-size: 12px; }
${MEMO_RENDER_CSS}
${MEMO_EDITOR_CSS}
`;
  var MemoView = class {
    constructor(deps) {
      this.deps = deps;
    }
    query = "";
    open = null;
    /** Every memo, not only this chat's. */
    everywhere = false;
    writing = false;
    get state() {
      return this.deps.store.value;
    }
    /** The window closes: nothing stays open for writing. */
    leave() {
      this.open = null;
      this.writing = false;
    }
    /** Shown even when it belongs to another chat. */
    show(id) {
      this.open = id;
      this.writing = false;
      const memo2 = this.state.memos.find((m2) => m2.id === id);
      if (memo2 && !isVisible(memo2, this.deps.scope())) this.everywhere = true;
      this.query = "";
    }
    update(fn) {
      this.deps.store.update(fn);
    }
    render() {
      return el("div", { class: "col cards" }, this.memoCard(), this.placeCard(), this.captureCard(), ...this.deps.oocSettings(), this.backupCard());
    }
    newOwner() {
      return ownerFor(this.state.savePlace ?? "all", this.deps.scope());
    }
    memoCard() {
      const scope = this.deps.scope();
      const all = this.everywhere ? this.state.memos : this.state.memos.filter((m2) => isVisible(m2, scope));
      const shown = shownMemos(all, this.query);
      const list = el("div", { class: "memo-list" });
      for (const memo2 of shown) list.append(...this.row(memo2));
      if (!all.length) list.append(el("div", { class: "note" }, this.everywhere || !this.state.memos.length ? t("No memos", "메모 없음") : t("None in this chat", "이 채팅 메모 없음")));
      else if (!shown.length) list.append(el("div", { class: "note" }, t("No match", "찾는 메모 없음")));
      return el(
        "div",
        { class: "card" },
        section(
          t("📝 Memos", "📝 메모"),
          t(
            "· Select chat text → Memo\n· Use in the 🍰 menu, [[memo]] or /memo · 📌: pin (pinned memos stay in the 📝 bubble)\n· 🌐 every chat · 👤 this character's chats · 📍 this chat only",
            "· 채팅 글 긁기 → 메모하기\n· 🍰 메뉴·[[메모]]·/memo로 꺼내 쓰기 · 📌: 고정 (고정한 메모는 📝 버블에 늘 보여요)\n· 🌐 모든 채팅 · 👤 이 캐릭터의 채팅 · 📍 이 채팅에서만"
          ),
          [
            el(
              "button",
              {
                onclick: () => {
                  const memo2 = newMemo("", Date.now(), this.newOwner());
                  this.update((s) => s.memos.push(memo2));
                  this.open = memo2.id;
                  this.writing = true;
                  this.query = "";
                  this.deps.rerender();
                }
              },
              icon("plus"),
              t("New memo", "새 메모")
            ),
            el("button", { title: t("Paste many at once; OOC wrappers come off", "한꺼번에 붙여넣기. OOC 포장은 벗김"), onclick: () => void this.paste() }, icon("clipboard"), t("Add many", "여러 개 넣기"))
          ],
          segmented(
            "memo-where",
            [
              { value: "here", label: t("Shown here", "여기 보이는 메모"), title: t("Memos shown in this chat", "이 채팅에서 보이는 메모") },
              { value: "all", label: t("Every memo", "모든 메모"), title: t("Memos of every chat and character", "모든 채팅·캐릭터의 메모") }
            ],
            this.everywhere ? "all" : "here",
            (v) => {
              this.everywhere = v === "all";
              this.deps.rerender();
            },
            t("Which memos", "보여 줄 메모")
          ),
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
              this.writing = !isOpen && !memo2.text.trim();
              this.deps.rerender();
            }
          },
          memoLabel(memo2, 90) || t("(empty memo)", "(빈 메모)")
        ),
        this.placeMenu(memo2),
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
          { label: t("🌟 Make page", "🌟 페이지 만들기"), run: () => (this.deps.close(), void this.deps.makePage(memo2.text)) },
          { label: t("Make a QR", "QR로 만들기"), run: () => this.deps.toQr(memo2) },
          { label: t("Copy", "복사"), run: async () => (await this.deps.ui.copy?.(memo2.text), this.deps.ui.toast(t("Copied.", "복사했어요."), "success", { title: "📝" })) },
          { label: t("Duplicate", "복제"), run: () => this.duplicate(memo2) },
          { label: t("📋 On a board…", "📋 보드에 놓기…"), sub: this.onBoards(memo2), run: () => void this.putOnBoards(memo2) },
          "-",
          { label: t("Delete", "삭제"), danger: true, run: () => this.remove(memo2) }
        ])
      );
      if (!isOpen) return [row];
      const title = el("input", {
        type: "text",
        value: memo2.title ?? "",
        placeholder: t("Title (optional)", "제목 (선택)"),
        "data-key": `memo-title-${memo2.id}`,
        "aria-label": t("Memo title", "메모 제목"),
        oninput: (e) => {
          const value = e.target.value;
          this.mutate(memo2.id, (m2) => value.trim() ? m2.title = value : delete m2.title);
        }
      });
      return [row, el("div", { class: "memo-edit" }, title, ...this.body(memo2))];
    }
    body(memo2) {
      if (this.writing) {
        return memoEditor({
          text: memo2.text,
          key: `memo-${memo2.id}`,
          // the window does not redraw for memo text (see manager/index.ts), so typing keeps its caret
          onText: (text7) => this.mutate(memo2.id, (m2) => m2.text = text7),
          onDone: () => {
            this.writing = false;
            this.deps.rerender();
          },
          fonts: () => this.deps.fonts()
        });
      }
      const drawn = renderMemo(memo2.text, {
        onToggle: (index) => {
          this.mutate(memo2.id, (m2) => m2.text = toggleCheck(m2.text, index));
          this.deps.rerender();
        },
        useFont: (family) => this.deps.useFont(family)
      });
      const box = el(
        "div",
        {
          class: "memo-body",
          role: "button",
          tabindex: "0",
          onclick: () => {
            this.writing = true;
            this.deps.rerender();
          },
          onkeydown: (e) => {
            if (e.key !== "Enter" || e.target !== box) return;
            this.writing = true;
            this.deps.rerender();
          }
        },
        ...drawn.length ? drawn : [el("span", { class: "empty" }, t("Empty", "빈 메모"))]
      );
      return [box];
    }
    onBoards(memo2) {
      const names = boardsWith(this.state.boards ?? [], memo2.id).map((b) => b.name);
      return names.length ? names.join(", ") : void 0;
    }
    /** Puts the memo on picked boards, then opens the first. */
    async putOnBoards(memo2) {
      const boards = this.state.boards ?? [];
      const fresh = t("➕ New board…", "➕ 새 보드…");
      const labels = boards.map((b, i) => `${i + 1}. 📋 ${b.name}${b.cards.some((c) => c.memoId === memo2.id) ? t(" (already on)", " (이미 있음)") : ""}`);
      const picked2 = await this.deps.ui.pick?.(t("Boards to put the memo on", "메모를 놓을 보드"), [...labels, fresh], { multiple: true }) ?? [];
      const ids = picked2.filter((l) => l !== fresh).map((l) => boards[labels.indexOf(l)]?.id).filter((x) => !!x);
      let made = null;
      if (picked2.includes(fresh)) {
        const name = (await this.deps.ui.input(t("Name of the new board", "새 보드 이름"), { okButton: t("Make", "만들기") }))?.trim();
        if (name) made = newBoard(name.slice(0, 60));
      }
      if (!ids.length && !made) return;
      this.update((s) => {
        if (made) s.boards = [...s.boards ?? [], made];
        for (const b of s.boards ?? []) if (ids.includes(b.id) || b.id === made?.id) {
          placeMemos(b, [memo2.id]);
          if (b.layout === "frame") arrangeFrame(b);
        }
      });
      this.deps.openBoard(made?.id ?? ids[0]);
    }
    /** Not pinned, so the 📝 bubble does not list it twice. */
    duplicate(memo2) {
      const copy = { ...structuredClone(memo2), id: newId("memo"), createdAt: Date.now() };
      delete copy.pinned;
      this.update((s) => {
        const at = s.memos.findIndex((m2) => m2.id === memo2.id);
        s.memos.splice(at < 0 ? s.memos.length : at + 1, 0, copy);
      });
      this.open = copy.id;
      this.writing = false;
      this.deps.rerender();
    }
    /** Deletes at once; the toast's Undo puts the memo back where it was. */
    remove(memo2) {
      const at = this.state.memos.findIndex((m2) => m2.id === memo2.id);
      if (at < 0) return;
      const kept = structuredClone(this.state.memos[at]);
      this.update((s) => s.memos = s.memos.filter((m2) => m2.id !== memo2.id));
      if (this.open === memo2.id) this.open = null;
      this.deps.ui.toast(t(`Deleted "${memoLabel(kept, 30) || t("(empty memo)", "(빈 메모)")}".`, `「${memoLabel(kept, 30) || "(빈 메모)"}」 메모를 지웠어요.`), "info", {
        title: "📝",
        action: {
          label: t("Undo", "되돌리기"),
          run: () => {
            if (this.state.memos.some((m2) => m2.id === kept.id)) return;
            this.update((s) => s.memos.splice(Math.min(at, s.memos.length), 0, kept));
            this.deps.rerender();
          }
        }
      });
    }
    placeMenu(memo2) {
      const scope = this.deps.scope();
      const place2 = placeOf(memo2.owner);
      const here = isVisible(memo2, scope);
      const where = place2 === "all" ? placeLabel("all") : here ? placeLabel(place2) : place2 === "chat" ? t("Another chat", "다른 채팅") : t("Other characters", "다른 캐릭터");
      const move2 = (to) => () => this.mutate(memo2.id, (m2) => {
        const owner = ownerFor(to, scope);
        if (owner) m2.owner = owner;
        else delete m2.owner;
      });
      const entries = ["all", "character", "chat"].filter((p) => placeHere(p, scope) === p).map((p) => ({ label: `${PLACE_MARK[p]} ${placeLabel(p)}${p === place2 && here ? " ✓" : ""}`, run: move2(p) }));
      const summary = el("span", { class: here ? "" : "away" }, PLACE_MARK[place2]);
      const menu = this.deps.menu(summary, t(`Shown in: ${where}`, `보이는 곳: ${where}`), entries);
      menu.classList.add("place");
      return menu;
    }
    mutate(id, fn) {
      this.update((s) => {
        const m2 = s.memos.find((x) => x.id === id);
        if (m2) fn(m2);
      });
    }
    async paste() {
      const text7 = await this.deps.ui.input(t("Paste the text.<br><small>OOC wrappers come off; several notes become several memos.</small>", "넣을 글을 붙여 넣으세요.<br><small>OOC 포장은 벗기고, 여러 개면 하나씩 나눠요.</small>"), { rows: 8, multiline: true, wide: true, okButton: t("Add", "넣기") });
      if (!text7?.trim()) return;
      const memos = memosFrom(text7, Date.now(), this.newOwner());
      this.update((s) => s.memos.push(...memos));
      this.deps.ui.toast(t(`Added ${memos.length} memos.`, `메모 ${memos.length}개를 넣었어요.`), "success", { title: "📝" });
    }
    placeCard() {
      const current = this.state.savePlace ?? "all";
      return el(
        "div",
        { class: "card" },
        section(
          t("Where new memos go", "새 메모 저장할 곳"),
          t(
            "Used unless you choose when writing (the 🌐 / 👤 / 📍 button in the 📝 bubble)\n· With no chat open, a memo goes to every chat\n· In a group chat, this character means everyone in it",
            "메모를 쓸 때 고르지 않으면 이대로 저장해요 (📝 버블의 🌐 / 👤 / 📍 단추)\n· 채팅을 안 열었으면 전체로 저장해요\n· 그룹 채팅에서 이 캐릭터는 그 채팅의 모든 캐릭터예요"
          ),
          [],
          segmented(
            "memo-save-place",
            ["all", "character", "chat"].map((p) => ({ value: p, label: `${PLACE_MARK[p]} ${placeLabel(p)}` })),
            current,
            (v) => this.update((s) => {
              if (v === "all") delete s.savePlace;
              else s.savePlace = v;
            }),
            t("Where new memos go", "새 메모 저장할 곳")
          )
        )
      );
    }
    /** The 📝 bubble's row, for the window's ⚙ settings. */
    dockBubble() {
      const s = this.state;
      return setting(
        t("📝 Memo bubble", "📝 메모 버블"),
        [
          el("input", { type: "text", class: "icon-input", value: s.dockIcon, maxlength: "8", "data-key": "memo-dock-icon", "aria-label": t("Bubble icon", "버블 아이콘"), oninput: (e) => this.update((x) => x.dockIcon = e.target.value.trim() || "📝") }),
          toggle(s.showButton, (v) => this.update((x) => x.showButton = v), t("Show 📝 bubble", "📝 버블 보이기"), "memo-show")
        ]
      );
    }
    captureCard() {
      const s = this.state;
      return el(
        "div",
        { class: "card" },
        setting(t("📝 button on selected text", "글을 긁으면 📝 버튼"), toggle(s.capture !== false, (v) => this.update((x) => x.capture = v), t("📝 button on selected text", "글을 긁으면 📝 버튼"), "memo-capture"))
      );
    }
    backupCard() {
      return el(
        "div",
        { class: "card" },
        section(
          t("Backup", "백업"),
          t("All memos as .memo.json; imports are added", "메모 전체를 .memo.json으로. 가져오면 더해짐"),
          [el("button", { onclick: () => this.exportJson() }, icon("upload"), t("Export", "내보내기")), el("button", { onclick: () => this.importJson() }, icon("download"), t("Import", "가져오기"))]
        )
      );
    }
    exportJson() {
      const folders = new Map((this.state.folders ?? []).map((f) => [f.id, f.name]));
      downloadJson({ format: "dispensa-memo", version: 1, memos: this.state.memos.map((m2) => ({ title: m2.title, text: m2.text, pinned: m2.pinned || void 0, createdAt: m2.createdAt, owner: m2.owner, folder: m2.folder ? folders.get(m2.folder) : void 0 })) }, "dispensa.memo.json");
    }
    importJson() {
      pickFiles(async ([file]) => {
        try {
          let json2;
          try {
            json2 = JSON.parse(await file.text());
          } catch {
            json2 = {};
          }
          if (!json2 || !Array.isArray(json2.memos)) {
            this.deps.ui.toast(t(`${file.name} isn't a memo file (.memo.json).`, `${file.name}은(는) 메모 파일(.memo.json)이 아니에요.`), "warning", { title: "📝" });
            return;
          }
          const have = new Set(this.state.memos.map((m2) => m2.text));
          const list = (json2.memos ?? []).filter((m2) => typeof m2.text === "string" && m2.text.trim() && !have.has(m2.text));
          const folders = [...this.state.folders ?? []];
          const folderFor = (name) => {
            if (typeof name !== "string" || !name.trim()) return void 0;
            const found = folders.find((f) => f.name === name.trim().slice(0, 40)) ?? newFolder(name);
            if (!folders.includes(found)) folders.push(found);
            return found.id;
          };
          const fresh = list.map((m2) => {
            const folder2 = folderFor(m2.folder);
            return { ...newMemo(String(m2.text), Number(m2.createdAt) || Date.now(), normalizeOwner(m2.owner)), ...typeof m2.title === "string" && m2.title.trim() ? { title: m2.title.trim() } : {}, ...m2.pinned ? { pinned: true } : {}, ...folder2 ? { folder: folder2 } : {} };
          });
          this.update((s) => {
            s.memos.push(...fresh);
            if (folders.length) s.folders = folders;
          });
          this.deps.ui.toast(fresh.length ? t(`Imported ${fresh.length} ${fresh.length === 1 ? "memo" : "memos"}.`, `메모 ${fresh.length}개를 가져왔어요.`) : t("Every memo in the file is already here.", "파일의 메모가 모두 이미 있어요."), "success", { title: "📝" });
        } catch (e) {
          this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("📝 Import", "📝 가져오기") });
        }
      }, { json: true });
    }
  };

  // src/ui/menu.ts
  function dropMenu(summaryContent, label, entries, opensRight = false) {
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
            title: e.sub,
            onclick: () => {
              menu.open = false;
              void e.run();
            }
          },
          e.label
        )
      );
    }
    menu.append(summary, list);
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      menu.classList.toggle("right", opensRight);
      const box = clipBox(menu);
      const r = list.getBoundingClientRect();
      const flip = () => menu.classList.toggle("right");
      if (!opensRight && r.left < box.left) flip();
      else if (opensRight && r.right > box.right) flip();
      else return;
      const after = list.getBoundingClientRect();
      if (after.left < box.left || after.right > box.right) {
        const lostNow = Math.max(0, box.left - after.left) + Math.max(0, after.right - box.right);
        const lostBefore = Math.max(0, box.left - r.left) + Math.max(0, r.right - box.right);
        if (lostBefore < lostNow) flip();
      }
    });
    menu.addEventListener("focusout", (ev) => {
      if (!menu.contains(ev.relatedTarget)) menu.open = false;
    });
    return menu;
  }
  function clipBox(node) {
    for (let n = parentOf(node); n; n = parentOf(n)) {
      const style = getComputedStyle(n);
      if (style.overflowX !== "visible" || style.overflow !== "visible") {
        const r = n.getBoundingClientRect();
        return { left: Math.max(0, r.left), right: Math.min(window.innerWidth, r.right) };
      }
    }
    return { left: 0, right: window.innerWidth };
  }
  var parentOf = (n) => n.parentElement ?? (n.getRootNode().host || null);

  // src/ui/board-card.ts
  var BOARD_CARD_CSS = `
.board-card { position: absolute; transform-origin: 50% 50%; border-radius: 6px; padding: 10px 12px 12px; box-shadow: 0 3px 10px rgb(0 0 0 / .22);
  background: #fffaf0; color: #2b2b2b; cursor: pointer; max-height: 420px; overflow: hidden; touch-action: none; }
.board-card::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 28px; pointer-events: none;
  background: linear-gradient(transparent, var(--paper, #fffaf0)); }
.board-card .card-title { font-weight: 700; margin-bottom: 4px; font-size: 15px; }
.board-card .memo-drawn { font-size: 14px; line-height: 1.5; word-break: break-word; }
.board-card .memo-drawn h1 { font-size: 1.3em; } .board-card .memo-drawn h2 { font-size: 1.15em; } .board-card .memo-drawn h3 { font-size: 1.05em; }
.board-card .memo-drawn p, .board-card .memo-drawn ul, .board-card .memo-drawn ol { margin: .3em 0; }
.board-card .memo-drawn ul, .board-card .memo-drawn ol { padding-left: 1.3em; }
.board-card .memo-drawn ul.checks { list-style: none; padding-left: 0; }
.board-card .memo-drawn ul.checks label { display: inline-flex; flex-direction: row; gap: 5px; align-items: baseline; font-size: inherit; color: inherit; }
.board-card .memo-drawn .done > label > span { text-decoration: line-through; opacity: .6; }
.board-card .memo-drawn code { font-family: var(--d-mono); font-size: .9em; background: rgb(0 0 0 / .07); padding: 0 3px; border-radius: 3px; }
.board-over .paper { padding: 14px 16px; border-radius: 8px; box-shadow: 0 3px 12px rgb(0 0 0 / .2); max-width: 720px; width: 100%; align-self: center; }
.board-over .paper .card-title { font-weight: 700; font-size: 18px; margin-bottom: 6px; }
.board-over .paper .memo-body { background: transparent; border: none; padding: 0; color: inherit; }
`;
  var two = (n) => String(n).padStart(2, "0");
  function cardEl(ctx, card, memo2, num3, moving = false) {
    const alt = num3 % 3 === 2 ? " alt1" : num3 % 4 === 0 ? " alt2" : "";
    const node = el("div", { class: `board-card${alt}${moving ? " moving" : ""}`, "data-card": card.memoId, role: "button", tabindex: "0", "aria-label": memoLabel(memo2, 60) || t("(empty memo)", "(빈 메모)") });
    if (card.color) {
      node.style.setProperty("--card", card.color);
      node.style.setProperty("--ink", inkOn(card.color));
      node.style.background = card.color;
      node.style.color = inkOn(card.color);
    }
    const day = new Date(memo2.createdAt || Date.now());
    const numbered = ctx.board()?.numbers !== false && num3 > 0;
    node.append(el("div", { class: "card-head" }, numbered ? el("span", { class: "num" }, two(num3)) : null, el("span", { class: "meta" }, `${two(day.getMonth() + 1)}.${two(day.getDate())}`)));
    if (memo2.title?.trim()) node.append(el("div", { class: "card-title" }, memo2.title.trim()));
    node.append(
      el(
        "div",
        { class: "memo-drawn" },
        ...renderMemo(memo2.text, {
          // redraw: the numbers change when an empty card gets text
          onToggle: (index) => {
            ctx.mutateMemo(memo2.id, (m2) => m2.text = toggleCheck(m2.text, index));
            ctx.deps.rerender();
          },
          useFont: (f) => ctx.deps.useFont(f)
        })
      )
    );
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target === node) ctx.openCard(card.memoId);
    });
    return node;
  }
  function boardHead(ctx, board, inFrame = false) {
    const n = two(ctx.boards().findIndex((b) => b.id === board.id) + 1);
    const big = inFrame && themeById(board.theme?.id).numbered;
    return el("header", { class: "board-head" }, big ? el("div", { class: "big" }, `№${n}`) : null, el("h1", {}, board.name));
  }
  function zoomPanel(ctx, card, memo2, z) {
    const colors = themeColors(ctx.board()?.theme);
    const paper = card.color ?? colors.card ?? colors.paper;
    const setColor = (value) => ctx.updateBoard((b) => {
      const c = b.cards.find((x) => x.memoId === card.memoId);
      if (!c) return;
      if (value) c.color = value;
      else delete c.color;
    });
    const color = el("input", { type: "color", value: paper, title: t("Paper color", "메모지 색"), "aria-label": t("Paper color", "메모지 색") });
    color.addEventListener("change", () => setColor(color.value));
    const head = el(
      "div",
      { class: "over-head" },
      el("button", { onclick: z.close, title: t("Back to the board", "보드로 돌아가기") }, "‹ ", t("Board", "보드")),
      el("span", { class: "grow" }),
      color,
      dropMenu("⋯", t("Card menu", "카드 메뉴"), [
        { label: t("💬 Send as OOC", "💬 OOC로 보내기"), run: () => (ctx.deps.close(), void ctx.deps.sendOoc(memo2.text)) },
        { label: t("Put in the input", "입력창에 넣기"), run: () => (ctx.deps.close(), ctx.deps.putInInput(memo2.text)) },
        { label: t("🖼 Run a QR inside the Gallery", "🖼 갤러리 내부에서 QR 실행"), run: () => ctx.deps.runForGallery(memo2.text, memoLabel(memo2, 40)) },
        { label: t("Open in the 📝 tab", "📝 탭에서 열기"), run: () => ctx.deps.openMemo(memo2.id) },
        { label: t("Plain paper", "기본 메모지"), run: () => setColor(null) },
        "-",
        { label: t("Off the board", "보드에서 빼기"), sub: t("The memo stays", "메모는 남아요"), danger: true, run: () => (ctx.takeOff(memo2.id), z.close()) }
      ])
    );
    const paperEl = el("div", { class: "paper" });
    paperEl.style.background = paper;
    paperEl.style.color = inkOn(paper);
    if (z.writing) {
      const title = el("input", {
        type: "text",
        value: memo2.title ?? "",
        placeholder: t("Title (optional)", "제목 (선택)"),
        "data-key": `board-title-${memo2.id}`,
        "aria-label": t("Memo title", "메모 제목"),
        oninput: (e) => ctx.mutateMemo(memo2.id, (m2) => {
          const v = e.target.value;
          if (v.trim()) m2.title = v;
          else delete m2.title;
        })
      });
      paperEl.append(
        el(
          "div",
          { class: "memo-edit" },
          title,
          ...memoEditor({
            text: memo2.text,
            key: `board-memo-${memo2.id}`,
            onText: (text7) => ctx.mutateMemo(memo2.id, (m2) => m2.text = text7),
            onDone: () => z.write(false),
            fonts: () => ctx.deps.fonts()
          })
        )
      );
    } else {
      if (memo2.title?.trim()) paperEl.append(el("div", { class: "card-title" }, memo2.title.trim()));
      const drawn = renderMemo(memo2.text, {
        onToggle: (index) => {
          ctx.mutateMemo(memo2.id, (m2) => m2.text = toggleCheck(m2.text, index));
          ctx.deps.rerender();
        },
        useFont: (f) => ctx.deps.useFont(f)
      });
      paperEl.append(
        el(
          "div",
          { class: "memo-body", role: "button", tabindex: "0", onclick: () => z.write(true) },
          ...drawn.length ? drawn : [el("span", { class: "empty" }, t("Empty", "빈 메모"))]
        )
      );
    }
    return el("div", { class: "board-over", role: "dialog", "aria-label": memoLabel(memo2, 60) }, head, paperEl);
  }

  // src/ui/board-stickers.ts
  var BOARD_STICKERS_CSS = `
.board-frame { position: relative; }
/* the sections' own box (inside the padding), so shares of it line up with the columns */
.frame-stickers { position: absolute; inset: var(--pad); pointer-events: none; z-index: 6; }
.board-sticker { position: absolute; pointer-events: auto; touch-action: none; cursor: grab; transform-origin: 50% 50%; filter: drop-shadow(0 3px 4px rgb(0 0 0 / .3)); }
.board-sticker img { display: block; width: 100%; height: auto; pointer-events: none; -webkit-user-drag: none; }
.board-sticker.page img { box-sizing: border-box; border: 6px solid #fff; border-bottom-width: 20px; border-radius: 2px; background: #fff; }
.board-sticker.picked { outline: 2px dashed var(--d-accent); outline-offset: 4px; z-index: 1; }
.board-sticker.dragging { cursor: grabbing; }
.board-sticker .board-handle { z-index: 2; }
/* outside the corners: a sticker can be small */
.board-sticker .board-handle.resize { right: -11px; bottom: -11px; }
.board-sticker .board-handle.turn { left: calc(50% - 11px); top: -30px; }
.board-sticker .board-handle.drop { left: -11px; top: -11px; }
.board-sticker .sticker-tools { position: absolute; left: 50%; top: calc(100% + 14px); transform: translateX(-50%); display: flex; gap: 4px; white-space: nowrap; }
.board-sticker .sticker-tools button { width: auto; padding: 3px 8px; font-size: 12px; background: var(--d-panel-solid); color: var(--d-text); border: 1px solid var(--d-line); border-radius: 6px; }
`;
  var TAP_SLOP = 6;
  var picked = null;
  var scrolls = /* @__PURE__ */ new Map();
  var lastBoard = "";
  function rowPitch(layer) {
    const frame = layer?.closest(".board-frame");
    if (!frame) return 188;
    const style = getComputedStyle(frame);
    return (parseFloat(style.gridAutoRows) || 176) + (parseFloat(style.rowGap) || 0);
  }
  function stickerSpot() {
    const top = scrolls.get(lastBoard)?.top ?? 0;
    return { x: 0.42, y: Math.round((top / 188 + 0.2) * 100) / 100, w: STICKER_W.default };
  }
  function watchStage(stage, boardId) {
    lastBoard = boardId;
    const kept = scrolls.get(boardId);
    if (kept) requestAnimationFrame(() => stage.isConnected && (stage.scrollTop = kept.top, stage.scrollLeft = kept.left));
    stage.addEventListener("scroll", () => scrolls.set(boardId, { top: stage.scrollTop, left: stage.scrollLeft }), { passive: true });
    stage.addEventListener(
      "pointerdown",
      (e) => {
        if (!picked || e.target.closest(".board-sticker")) return;
        picked = null;
        for (const node of stage.querySelectorAll(".board-sticker.picked")) {
          node.classList.remove("picked");
          node.querySelectorAll(".board-handle, .sticker-tools").forEach((h2) => h2.remove());
        }
      },
      true
    );
  }
  function stickerLayer(ctx, board) {
    const layer = el("div", { class: "frame-stickers" });
    const stickers = board.magnets.filter((m2) => m2.sticker).sort((a, b) => a.z - b.z);
    if (picked && !stickers.some((m2) => m2.id === picked)) picked = null;
    for (const m2 of stickers) layer.append(stickerEl(ctx, m2, layer));
    return layer;
  }
  var tidy = (s) => ({ x: Math.round(s.x * 1e3) / 1e3, y: Math.round(s.y * 1e3) / 1e3, w: Math.round(s.w * 1e3) / 1e3 });
  function place(node, s, rotate = 0) {
    node.style.left = `${s.x * 100}%`;
    node.style.top = `calc(${s.y} * (var(--row-h) + var(--gap)))`;
    node.style.width = `${s.w * 100}%`;
    node.style.transform = rotate ? `rotate(${rotate}deg)` : "";
  }
  function stickerEl(ctx, m2, layer) {
    const isPicked = picked === m2.id;
    const node = el(
      "div",
      { class: `board-sticker${m2.page ? " page" : ""}${isPicked ? " picked" : ""}`, "data-sticker": m2.id, ...m2.page ? { title: m2.page.title } : {} },
      el("img", { src: m2.image.url, alt: "", draggable: "false" })
    );
    place(node, m2.sticker, m2.rotate);
    if (isPicked) {
      const handle = (kind) => {
        const h2 = el("div", { class: `board-handle ${kind}`, "data-handle": kind, title: kind === "resize" ? t("Drag to resize", "끌어서 크기 바꾸기") : t("Drag to turn", "끌어서 돌리기") });
        h2.addEventListener("pointerdown", (e) => kind === "resize" ? resize(ctx, e, m2, node, layer) : turn(ctx, e, m2, node));
        return h2;
      };
      const tool = (label, run) => el("button", { type: "button", onpointerdown: (e) => e.stopPropagation(), onclick: (e) => (e.stopPropagation(), run()) }, label);
      node.append(
        handle("resize"),
        handle("turn"),
        el("div", { class: "board-handle drop", role: "button", title: t("Remove the magnet", "마그넷 떼기"), onpointerdown: (e) => e.stopPropagation(), onclick: () => update(ctx, m2.id, (b) => b.magnets = b.magnets.filter((x) => x.id !== m2.id)) }, "✕"),
        el(
          "div",
          { class: "sticker-tools" },
          ...m2.page ? [tool(t("Open", "열기"), () => void openPage(ctx, m2))] : [],
          tool(t("Into a section", "구획에 넣기"), () => {
            picked = null;
            update(ctx, m2.id, (b) => {
              const x = b.magnets.find((y) => y.id === m2.id);
              if (x) delete x.sticker;
              arrangeFrame(b);
            });
          })
        )
      );
    }
    node.addEventListener("pointerdown", (e) => move(ctx, e, m2, node, layer));
    return node;
  }
  async function openPage(ctx, m2) {
    const ok = await ctx.deps.openPage(m2.page.archiveId);
    if (!ok) ctx.deps.ui.toast(t("This page isn't in this browser's Gallery.", "이 페이지는 이 브라우저의 갤러리에 없어요."), "info", { title: "📋" });
  }
  function update(ctx, id, fn) {
    ctx.updateBoard((b) => {
      if (b.magnets.some((m2) => m2.id === id)) fn(b);
    });
  }
  function follow(e, step, done) {
    const start2 = { x: e.clientX, y: e.clientY };
    let moved = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const onMove = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - start2.x;
      const dy = ev.clientY - start2.y;
      if (!moved && Math.hypot(dx, dy) < TAP_SLOP) return;
      moved = true;
      step(ev, dx, dy);
    };
    const onUp = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      done(moved && ev.type !== "pointercancel", ev);
    };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
  }
  var width = (layer) => layer.getBoundingClientRect().width || 1;
  function move(ctx, e, m2, node, layer) {
    if (e.target.closest(".board-handle, .sticker-tools") || e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    const from = { ...m2.sticker };
    let now = from;
    follow(
      e,
      (_ev, dx, dy) => {
        node.classList.add("dragging");
        now = { ...from, x: Math.max(0, Math.min(1 - STICKER_W.min, from.x + dx / width(layer))), y: Math.max(0, from.y + dy / rowPitch(layer)) };
        place(node, now, m2.rotate);
      },
      (moved) => {
        node.classList.remove("dragging");
        if (!moved) {
          picked = picked === m2.id ? null : m2.id;
          ctx.deps.rerender();
          return;
        }
        picked = m2.id;
        update(ctx, m2.id, (b) => {
          const x = b.magnets.find((y) => y.id === m2.id);
          x.sticker = tidy(now);
          x.z = topZ(b);
        });
      }
    );
  }
  function resize(ctx, e, m2, node, layer) {
    e.preventDefault();
    e.stopPropagation();
    const from = { ...m2.sticker };
    let now = from;
    follow(
      e,
      (_ev, dx) => {
        now = { ...from, w: Math.max(STICKER_W.min, Math.min(STICKER_W.max, from.w + dx / width(layer))) };
        place(node, now, m2.rotate);
      },
      (moved) => moved && update(ctx, m2.id, (b) => b.magnets.find((y) => y.id === m2.id).sticker = tidy(now))
    );
  }
  function turn(ctx, e, m2, node) {
    e.preventDefault();
    e.stopPropagation();
    const r = node.getBoundingClientRect();
    const centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    let deg = m2.rotate ?? 0;
    follow(
      e,
      (ev) => {
        deg = rotationFrom(ev.clientX - centre.x, ev.clientY - centre.y);
        place(node, m2.sticker, deg);
      },
      (moved) => moved && update(ctx, m2.id, (b) => {
        const x = b.magnets.find((y) => y.id === m2.id);
        if (deg) x.rotate = deg;
        else delete x.rotate;
      })
    );
  }
  function peel(ctx, block2, id) {
    const layer = block2.closest(".board-frame")?.querySelector(".frame-stickers");
    if (!layer) return;
    const f = layer.getBoundingClientRect();
    const r = block2.getBoundingClientRect();
    const sticker = tidy({ x: Math.max(0, (r.left - f.left) / f.width), y: Math.max(0, (r.top - f.top) / rowPitch(layer)), w: Math.min(r.width / f.width, 0.33) });
    picked = id;
    update(ctx, id, (b) => {
      const m2 = b.magnets.find((x) => x.id === id);
      m2.sticker = sticker;
      m2.z = topZ(b);
      delete m2.cell;
      delete m2.rotate;
      arrangeFrame(b);
    });
  }

  // src/ui/board-frame-view.ts
  var BOARD_FRAME_CSS = `
/* its own stacking: stickers stay under the board's overlays (a card open large, the theme panel) */
.board-stage.frame-mode { isolation: isolate; overflow: auto; cursor: default; touch-action: pan-x pan-y; user-select: text; -webkit-user-select: text; }
.board-frame { --pad: 14px; --row-h: 176px; --gap: var(--frame-gap, 12px); display: grid; gap: var(--gap); padding: var(--pad); grid-auto-rows: var(--row-h); min-width: calc(var(--cols) * 150px); }
.board-frame > * { position: relative; min-width: 0; min-height: 0; }
.board-frame .board-card { position: relative; left: auto; top: auto; width: auto !important; max-height: none; height: 100%; transform: none !important; }
/* a picture fills its section and is cut to it, whatever its own size */
.board-frame .board-magnet { position: relative; width: auto !important; height: 100%; transform: none !important; filter: none; display: block; overflow: hidden; }
.board-frame .board-magnet img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.board-frame .board-magnet.page { cursor: pointer; }
.board-frame .board-head { height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; padding: 14px 16px; border-radius: 4px; }
.board-frame .board-head .big { font: 700 64px/0.85 var(--bt-sans, sans-serif); letter-spacing: -4px; color: var(--accent); margin-bottom: auto; }
/* bottom right: the top of a card holds its number and date */
.board-frame .block-tools { position: absolute; right: 6px; bottom: 6px; z-index: 5; display: flex; gap: 2px; opacity: 0; transition: opacity .15s; }
.board-frame > *:hover .block-tools, .board-frame > *:focus-within .block-tools, .board-frame .block-tools:focus-within { opacity: 1; }
.board-frame .block-tools button { width: 24px; height: 24px; padding: 0; justify-content: center; font-size: 12px; border-radius: 6px; background: var(--d-panel-solid); color: var(--d-text); border: 1px solid var(--d-line); }
.board-frame .block-tools button[data-drag] { cursor: grab; touch-action: none; }
.board-frame .slot { border: 1.5px dashed color-mix(in srgb, var(--ink, #888) 25%, transparent); border-radius: 8px; display: grid; place-items: center; }
.board-frame .slot button { width: auto; background: transparent; border: none; color: color-mix(in srgb, var(--ink, #888) 55%, transparent); font-size: 13px; }
.board-frame .dragging { opacity: .85; z-index: 20; box-shadow: 0 18px 40px -10px rgb(0 0 0 / .45); pointer-events: none; }
.board-frame .drop-hint { outline: 2px solid var(--accent, var(--d-accent)); outline-offset: 2px; border-radius: 8px; pointer-events: none; z-index: 4; }
@media (pointer: coarse) { .board-frame .block-tools { opacity: .85; } }
${BOARD_STICKERS_CSS}
/* phone: with many columns the board scrolls sideways inside its own frame */
@media (max-width: 600px) {
  .board-frame { min-width: calc(var(--cols) * 128px); --gap: 8px; --pad: 8px; --row-h: 160px; }
  .board-frame .board-head .big { font-size: 40px; letter-spacing: -2px; }
}
`;
  function frameView(ctx, board) {
    const copy = liveCards(board, ctx.state().memos);
    arrangeFrame(copy);
    const cols = copy.cols ?? FRAME_COLS.default;
    const items = frameItems(copy);
    const frame = el("div", { class: "board-frame" });
    frame.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    frame.style.setProperty("--cols", String(cols));
    const memos = new Map(ctx.state().memos.map((m2) => [m2.id, m2]));
    const numbers = cardNumbers(copy, ctx.state().memos);
    for (const item of items) {
      let block2 = null;
      if (item.key === HEAD_KEY) block2 = boardHead(ctx, board, true);
      else if (item.key.startsWith("card:")) {
        const card = copy.cards.find((c) => cardKey(c.memoId) === item.key);
        const memo2 = card && memos.get(card.memoId);
        if (card && memo2) block2 = cardEl(ctx, card, memo2, numbers.get(card.memoId) ?? 0);
      } else {
        const m2 = copy.magnets.find((x) => magnetKey(x.id) === item.key);
        if (m2)
          block2 = el(
            "div",
            {
              class: `board-magnet${m2.page ? " page" : ""}`,
              "data-magnet": m2.id,
              ...m2.page ? {
                title: m2.page.title,
                onclick: (e) => {
                  if (e.target.closest(".block-tools")) return;
                  void ctx.deps.openPage(m2.page.archiveId).then((ok) => ok || ctx.deps.ui.toast(t("This page isn't in this browser's Gallery.", "이 페이지는 이 브라우저의 갤러리에 없어요."), "info", { title: "📋" }));
                }
              } : {}
            },
            el("img", { src: m2.image.url, alt: "", draggable: "false" })
          );
      }
      if (!block2) continue;
      placeInFrame(block2, item);
      block2.dataset.block = item.key;
      block2.append(blockTools(ctx, item, cols));
      const memoId = block2.dataset.card;
      if (memoId) block2.addEventListener("click", (e) => {
        if (!e.target.closest(".block-tools, input, label")) ctx.openCard(memoId);
      });
      frame.append(block2);
    }
    for (const free of freeCells(items, cols)) {
      const slot = el(
        "div",
        { class: "slot" },
        el("button", { title: t("Put a memo here", "여기에 메모 놓기"), onclick: () => void ctx.addMemos(free) }, "＋ ", t("Memo", "메모")),
        el("button", { title: t("Put a picture here", "여기에 그림 놓기"), onclick: () => ctx.pickMagnet(free) }, icon("magnet"))
      );
      placeInFrame(slot, { key: "", cell: { ...free, w: 1, h: 1 } });
      frame.append(slot);
    }
    frame.append(stickerLayer(ctx, copy));
    const stage = el("div", { class: "board-stage frame-mode", "aria-label": board.name }, frame);
    watchStage(stage, board.id);
    if (board.background?.image) {
      stage.style.backgroundImage = `url("${board.background.image.url}")`;
      stage.style.backgroundSize = "cover";
    }
    return stage;
  }
  function columnsSelect(ctx, board) {
    const select2 = el("select", { "aria-label": t("Columns", "칸 수"), title: t("Columns", "칸 수") });
    for (let n = FRAME_COLS.min; n <= FRAME_COLS.max; n++) select2.append(el("option", { value: String(n), selected: n === (board.cols ?? FRAME_COLS.default) }, t(`${n} columns`, `${n}칸`)));
    select2.addEventListener(
      "change",
      () => ctx.updateBoard((b) => {
        arrangeFrame(b);
        setColumns(b, Number(select2.value));
      })
    );
    return select2;
  }
  function placeInFrame(node, item) {
    node.style.gridColumn = `${item.cell.c + 1} / span ${item.cell.w}`;
    node.style.gridRow = `${item.cell.r + 1} / span ${item.cell.h}`;
  }
  function blockTools(ctx, item, cols) {
    const { w, h: h2 } = item.cell;
    const span = (dw, dh) => () => ctx.updateBoard((b) => {
      arrangeFrame(b);
      spanBlock(b, item.key, w + dw, h2 + dh);
    });
    const tool = (label, title, run, ok = true) => ok ? el("button", { type: "button", title, "aria-label": title, onclick: (e) => (e.stopPropagation(), run()) }, label) : null;
    const drag = el("button", { type: "button", "data-drag": "", title: t("Drag to another section", "끌어서 다른 구획으로"), "aria-label": t("Move", "옮기기") }, "⠿");
    drag.addEventListener("pointerdown", (e) => dragBlock(ctx, e, item));
    return el(
      "div",
      { class: "block-tools" },
      drag,
      tool("⇥", t("Merge with the section on the right", "오른쪽 구획과 합치기"), span(1, 0), item.cell.c + w < cols),
      tool("⇤", t("Split from the right", "오른쪽을 나누기"), span(-1, 0), w > 1),
      tool("⤓", t("Merge with the section below", "아래 구획과 합치기"), span(0, 1), h2 < 6),
      tool("⤒", t("Split from below", "아래를 나누기"), span(0, -1), h2 > 1),
      item.key.startsWith("magnet:") ? el("button", { type: "button", title: t("Peel off as a sticker", "스티커로 떼기"), "aria-label": t("Peel off as a sticker", "스티커로 떼기"), onclick: (e) => (e.stopPropagation(), peel(ctx, e.currentTarget.closest("[data-block]"), item.key.slice("magnet:".length))) }, "✂") : null
    );
  }
  function dragBlock(ctx, e, item) {
    const handle = e.currentTarget;
    const block2 = handle.closest("[data-block]");
    const frame = block2?.parentElement;
    if (!block2 || !frame) return;
    e.preventDefault();
    handle.setPointerCapture?.(e.pointerId);
    const cols = Number(frame.style.getPropertyValue("--cols")) || FRAME_COLS.default;
    const start2 = { x: e.clientX, y: e.clientY };
    const grab = block2.getBoundingClientRect();
    const offX = start2.x - grab.left;
    const offY = start2.y - grab.top;
    const hint = el("div", { class: "drop-hint" });
    const cellAt = (x, y) => {
      const r = frame.getBoundingClientRect();
      const style = getComputedStyle(frame);
      const pad2 = parseFloat(style.paddingLeft) || 0;
      const gap = parseFloat(style.columnGap) || 0;
      const colW = (r.width - pad2 * 2 - gap * (cols - 1)) / cols;
      const rowH = (parseFloat(style.gridAutoRows) || 176) + (parseFloat(style.rowGap) || gap);
      return {
        c: Math.max(0, Math.min(cols - item.cell.w, Math.round((x - offX - r.left - pad2 + frame.scrollLeft) / (colW + gap)))),
        r: Math.max(0, Math.round((y - offY - r.top - pad2 + frame.scrollTop) / rowH))
      };
    };
    const onMove = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      block2.classList.add("dragging");
      block2.style.setProperty("transform", `translate(${ev.clientX - start2.x}px, ${ev.clientY - start2.y}px)`, "important");
      placeInFrame(hint, { key: "", cell: { ...item.cell, ...cellAt(ev.clientX, ev.clientY) } });
      if (!hint.isConnected) frame.append(hint);
    };
    const onUp = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      hint.remove();
      block2.classList.remove("dragging");
      block2.style.removeProperty("transform");
      if (Math.hypot(ev.clientX - start2.x, ev.clientY - start2.y) < 6 || ev.type === "pointercancel") return;
      const at = cellAt(ev.clientX, ev.clientY);
      if (at.c === item.cell.c && at.r === item.cell.r) return;
      ctx.updateBoard((b) => {
        arrangeFrame(b);
        moveBlock(b, item.key, at.c, at.r);
      });
    };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
  }

  // src/ui/board-pictures.ts
  var BOARD_PICTURES_CSS = `
.board-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.board-images .pic { position: relative; aspect-ratio: 1; border-radius: var(--d-radius-sm); border: 1px solid var(--d-line); overflow: hidden; background: var(--d-field); padding: 0; }
.board-images .pic img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.board-images .pic .del { position: absolute; right: 3px; top: 3px; width: 22px; height: 22px; padding: 0; border-radius: 50%; font-size: 12px; justify-content: center; }
`;
  var BoardPictures = class {
    /** `centerPoint`: where a new magnet goes in the free layout. */
    constructor(ctx, centerPoint) {
      this.ctx = ctx;
      this.centerPoint = centerPoint;
    }
    /** null: closed. */
    kind = null;
    slot = null;
    pictures = null;
    busy = false;
    get isOpen() {
      return this.kind !== null;
    }
    open(kind, slot = null) {
      this.kind = kind;
      this.slot = slot;
      this.ctx.deps.rerender();
      void this.load();
    }
    close() {
      this.kind = null;
    }
    panel() {
      const head = el(
        "div",
        { class: "over-head" },
        el("button", { onclick: () => (this.close(), this.ctx.deps.rerender()) }, "‹ ", t("Board", "보드")),
        el("strong", {}, this.kind === "background" ? t("Background picture", "배경 그림") : t("Magnets", "마그넷")),
        helpTip(t("Pictures are kept in Marinara's Global Gallery, in the Dispensa folder, so every device sees them.", "그림은 마리나라 전역 갤러리의 Dispensa 폴더에 저장돼요. 다른 기기에서도 보여요."), t("Pictures", "그림")),
        el("span", { class: "grow" }),
        el("button", { disabled: this.busy, onclick: () => pickFiles((files) => void this.upload(files), { accept: "image/png,image/jpeg,image/gif,image/webp,image/avif", multiple: true }) }, icon("upload"), this.busy ? t("Uploading…", "올리는 중…") : t("Upload", "올리기"))
      );
      const grid = el("div", { class: "board-images" });
      if (this.pictures === null) grid.append(el("div", { class: "note" }, t("Loading…", "불러오는 중…")));
      else if (!this.pictures.length) grid.append(el("div", { class: "note" }, t("No pictures", "그림 없음")));
      for (const pic of this.pictures ?? []) {
        grid.append(
          el(
            "button",
            { class: "pic", title: t("Use this picture", "이 그림 쓰기"), onclick: () => this.use(pic) },
            el("img", { src: pic.url, alt: "", loading: "lazy" }),
            el(
              "button",
              {
                class: "del ghost",
                title: t("Delete from the Gallery", "갤러리에서 지우기"),
                "aria-label": t("Delete", "지우기"),
                onclick: (e) => {
                  e.stopPropagation();
                  void this.remove(pic);
                }
              },
              "✕"
            )
          )
        );
      }
      return el("div", { class: "board-over", role: "dialog" }, head, grid);
    }
    async load() {
      try {
        this.pictures = await this.ctx.deps.images.list();
      } catch (e) {
        this.pictures = [];
        this.ctx.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Pictures", "그림") });
      }
      this.ctx.deps.rerender();
    }
    async upload(files) {
      if (!files.length) return;
      this.busy = true;
      this.ctx.deps.rerender();
      try {
        for (const f of files) await this.ctx.deps.images.upload(f);
      } catch (e) {
        this.ctx.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Upload", "올리기") });
      } finally {
        this.busy = false;
      }
      await this.load();
    }
    use(pic) {
      if (this.kind === "background") {
        this.ctx.updateBoard((b) => b.background = { image: pic });
      } else {
        const at = this.centerPoint();
        const cell = this.slot;
        this.ctx.updateBoard((b) => {
          const sticker = b.layout === "frame" && !cell ? { sticker: stickerSpot() } : {};
          b.magnets.push({ id: newId("magnet"), image: pic, x: Math.round(clamp(at.x, 0, BOARD_W - MAGNET_SIZE.default)), y: Math.round(clamp(at.y, 0, BOARD_H - MAGNET_SIZE.default)), size: MAGNET_SIZE.default, z: topZ(b), ...cell ? { cell: { ...cell, w: 1, h: 1 } } : {}, ...sticker });
          if (b.layout === "frame") arrangeFrame(b);
        });
      }
      this.close();
      this.ctx.deps.rerender();
    }
    async remove(pic) {
      const used = this.ctx.boards().filter((b) => b.background?.image?.id === pic.id || b.magnets.some((m2) => m2.image.id === pic.id)).length;
      const ask = used ? t(`Delete this picture? It is used on ${used} ${used === 1 ? "board" : "boards"} and goes from them too.`, `이 그림을 지울까요? 보드 ${used}개에서 쓰고 있어서 거기서도 사라져요.`) : t("Delete this picture from the Global Gallery?", "이 그림을 전역 갤러리에서 지울까요?");
      if (!await confirmIn(this.ctx.deps.ui, ask)) return;
      try {
        await this.ctx.deps.images.remove(pic.id);
      } catch (e) {
        this.ctx.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Pictures", "그림") });
        return;
      }
      this.ctx.deps.store.update((s) => {
        for (const b of s.boards ?? []) {
          b.magnets = b.magnets.filter((m2) => m2.image.id !== pic.id);
          if (b.background?.image?.id === pic.id) delete b.background;
        }
      });
      await this.load();
    }
  };

  // src/ui/board-stage.ts
  var BOARD_STAGE_CSS = `
.board-stage { position: relative; flex: 1; min-height: 240px; overflow: hidden; border-radius: var(--d-radius); border: 1px solid var(--d-line);
  background: var(--d-field); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
.board-stage.panning { cursor: grabbing; }
.board-surface { position: absolute; left: 0; top: 0; transform-origin: 0 0; background-color: #e8dcc8; background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / .08); }
.board-magnet { position: absolute; transform-origin: 50% 50%; cursor: pointer; touch-action: none; filter: drop-shadow(0 3px 4px rgb(0 0 0 / .3)); }
.board-magnet img { display: block; width: 100%; height: auto; pointer-events: none; -webkit-user-drag: none; }
/* a Gallery page's picture: framed like a print */
.board-magnet.page img { box-sizing: border-box; border: 6px solid #fff; border-bottom-width: 20px; border-radius: 2px; background: #fff; }
.board-card.moving, .board-magnet.moving { outline: 2px dashed var(--d-accent); outline-offset: 4px; cursor: move; }
.board-handle { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: var(--d-accent); border: 2px solid #fff; box-shadow: 0 1px 4px rgb(0 0 0 / .4); touch-action: none; }
/* inside the card's corners: a card keeps its overflow hidden */
.board-handle { z-index: 1; }
.board-handle.resize { right: 3px; bottom: 3px; cursor: nwse-resize; }
.board-handle.turn { left: calc(50% - 11px); top: 3px; cursor: grab; }
.board-handle.drop { left: 3px; top: 3px; background: var(--d-danger); display: grid; place-items: center; color: #fff; font-size: 12px; cursor: pointer; }
`;
  var LONG_PRESS_MS = 450;
  var TAP_SLOP2 = 8;
  var ZOOM = { min: 0.3, max: 2 };
  var BoardStage = class {
    constructor(ctx) {
      this.ctx = ctx;
    }
    /** null zoom: not set yet (it depends on the screen width). */
    view = { x: 0, y: 0, zoom: null };
    moving = null;
    stageEl = null;
    /** Two fingers are down: a one-finger drag or long press under way stops counting. */
    pinching = false;
    surfaceEl = null;
    /** Removes the last drawn stage's window listeners. */
    stageWatch = null;
    resetView() {
      this.view = { x: 0, y: 0, zoom: this.view.zoom };
    }
    putDown() {
      this.moving = null;
    }
    /** Called when the section layout shows instead. */
    forget() {
      this.stageWatch?.abort();
      this.stageWatch = null;
      this.stageEl = null;
      this.surfaceEl = null;
    }
    zoomButtons() {
      return [
        el("button", { title: t("Zoom out", "축소"), "aria-label": t("Zoom out", "축소"), onclick: () => this.zoomBy(1 / 1.25) }, icon("minus")),
        el("span", { class: "zoom" }, `${Math.round(this.zoom() * 100)}%`),
        el("button", { title: t("Zoom in", "확대"), "aria-label": t("Zoom in", "확대"), onclick: () => this.zoomBy(1.25) }, icon("plus")),
        el("button", { title: t("Show every card", "모든 카드 보기"), "aria-label": t("Fit", "맞춤"), onclick: () => this.fit() }, icon("scan"), el("span", { class: "lbl" }, t("Fit", "맞춤")))
      ];
    }
    centerPoint() {
      const s = this.stageEl;
      if (!s) return { x: 60, y: 60 };
      const r = s.getBoundingClientRect();
      return this.toBoard(r.left + r.width / 2, r.top + r.height / 3);
    }
    render(board) {
      const surface = el("div", { class: "board-surface" });
      surface.style.width = `${BOARD_W}px`;
      surface.style.height = `${BOARD_H}px`;
      if (board.background?.image) {
        surface.style.backgroundImage = `url("${board.background.image.url}")`;
        surface.style.backgroundSize = "cover";
        surface.style.backgroundRepeat = "no-repeat";
      }
      const memos = new Map(this.ctx.state().memos.map((m2) => [m2.id, m2]));
      const numbers = cardNumbers(board, this.ctx.state().memos);
      const straight = keepsStraight(board, this.ctx.grid());
      for (const card of board.cards) {
        const memo2 = memos.get(card.memoId);
        if (!memo2) continue;
        const moving = this.isMoving("card", card.memoId);
        const node = cardEl(this.ctx, card, memo2, numbers.get(card.memoId) ?? 0, moving);
        this.place(node, card.x, card.y, card.w, straight ? 0 : card.rotate, card.z);
        if (moving) node.append(...this.handles("card", card.memoId));
        surface.append(node);
      }
      for (const magnet of board.magnets) surface.append(this.magnetEl(magnet, straight));
      const stage = el("div", { class: "board-stage", "aria-label": board.name });
      stage.append(surface);
      this.stageEl = stage;
      this.surfaceEl = surface;
      this.applyView();
      this.watchStage(stage);
      return stage;
    }
    zoom() {
      this.view.zoom ??= window.innerWidth < 720 ? 0.6 : 0.9;
      return this.view.zoom;
    }
    zoomBy(factor, at) {
      const before = this.zoom();
      const after = clamp(before * factor, ZOOM.min, ZOOM.max);
      const stage = this.stageEl;
      const point = at ?? (stage ? { x: stage.clientWidth / 2, y: stage.clientHeight / 2 } : { x: 0, y: 0 });
      this.view.x = point.x - (point.x - this.view.x) * after / before;
      this.view.y = point.y - (point.y - this.view.y) * after / before;
      this.view.zoom = after;
      this.applyView();
    }
    fit() {
      const stage = this.stageEl;
      if (!stage) return;
      const items = [...stage.querySelectorAll(".board-card, .board-magnet")];
      if (!items.length) {
        this.view = { x: 0, y: 0, zoom: this.zoom() };
        return this.applyView();
      }
      const left = Math.min(...items.map((i) => i.offsetLeft));
      const top = Math.min(...items.map((i) => i.offsetTop));
      const right = Math.max(...items.map((i) => i.offsetLeft + i.offsetWidth));
      const bottom = Math.max(...items.map((i) => i.offsetTop + i.offsetHeight));
      const zoom = clamp(Math.min(stage.clientWidth / (right - left + 80), stage.clientHeight / (bottom - top + 80)), ZOOM.min, 1.2);
      this.view = { x: (stage.clientWidth - (right - left) * zoom) / 2 - left * zoom, y: (stage.clientHeight - (bottom - top) * zoom) / 2 - top * zoom, zoom };
      this.applyView();
    }
    applyView() {
      if (this.surfaceEl) this.surfaceEl.style.transform = `translate(${this.view.x}px, ${this.view.y}px) scale(${this.zoom()})`;
      const label = this.stageEl?.parentElement?.querySelector(".board-bar .zoom");
      if (label) label.textContent = `${Math.round(this.zoom() * 100)}%`;
    }
    toBoard(clientX, clientY) {
      const r = this.stageEl.getBoundingClientRect();
      return { x: (clientX - r.left - this.view.x) / this.zoom(), y: (clientY - r.top - this.view.y) / this.zoom() };
    }
    magnetEl(m2, straight) {
      const moving = this.isMoving("magnet", m2.id);
      const node = el("div", { class: `board-magnet${moving ? " moving" : ""}${m2.page ? " page" : ""}`, "data-magnet": m2.id, ...m2.page ? { title: m2.page.title } : {} }, el("img", { src: m2.image.url, alt: "", draggable: "false" }));
      this.place(node, m2.x, m2.y, m2.size, straight ? 0 : m2.rotate, m2.z);
      if (moving) node.append(...this.handles("magnet", m2.id));
      return node;
    }
    place(node, x, y, w, rotate = 0, z = 0) {
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.width = `${w}px`;
      node.style.transform = rotate ? `rotate(${rotate}deg)` : "";
      node.style.zIndex = String(z);
    }
    isMoving(kind, id) {
      return this.moving?.kind === kind && this.moving.id === id;
    }
    handles(kind, id) {
      const drop = el("div", { class: "board-handle drop", role: "button", "data-handle": "drop", title: kind === "card" ? t("Off the board", "보드에서 빼기") : t("Remove the magnet", "마그넷 떼기") }, "✕");
      return [
        ...this.ctx.board() && keepsStraight(this.ctx.board(), this.ctx.grid()) ? [] : [el("div", { class: "board-handle turn", "data-handle": "turn", title: t("Drag to turn", "끌어서 돌리기") })],
        el("div", { class: "board-handle resize", "data-handle": "resize", title: t("Drag to resize", "끌어서 크기 바꾸기") }),
        Object.assign(drop, { onclick: () => kind === "card" ? this.ctx.takeOff(id) : this.removeMagnet(id) })
      ];
    }
    removeMagnet(id) {
      this.moving = null;
      this.ctx.updateBoard((b) => b.magnets = b.magnets.filter((m2) => m2.id !== id));
    }
    watchStage(stage) {
      this.stageWatch?.abort();
      const watch = new AbortController();
      this.stageWatch = watch;
      this.pinching = false;
      const pointers = /* @__PURE__ */ new Map();
      let pinch = null;
      stage.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const r = stage.getBoundingClientRect();
          this.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, { x: e.clientX - r.left, y: e.clientY - r.top });
        },
        { passive: false }
      );
      stage.addEventListener("pointerdown", (e) => {
        const target = e.target;
        if (target.closest("input, label, a")) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
          this.pinching = true;
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom() };
          return;
        }
        const handle = target.closest("[data-handle]");
        const item = target.closest("[data-card], [data-magnet]");
        if (handle?.dataset.handle === "drop") return;
        if (handle && item) return this.dragHandle(e, item, handle.dataset.handle);
        if (item) return this.pressItem(e, item);
        this.pan(e, stage);
      });
      const forget2 = (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        if (!pointers.size) this.pinching = false;
      };
      stage.addEventListener("pointermove", (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const r = stage.getBoundingClientRect();
          const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
          this.zoomBy(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist / this.zoom(), mid);
        }
      });
      const { signal } = watch;
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) window.addEventListener(type, forget2, { capture: true, signal });
      stage.addEventListener("lostpointercapture", forget2, { signal });
    }
    /** `pinched`: a second finger came down meanwhile, or the system cancelled the pointer (palm rejection): nothing is tapped or saved. */
    follow(e, move2, up) {
      const target = e.target;
      target.setPointerCapture?.(e.pointerId);
      const start2 = { x: e.clientX, y: e.clientY };
      let moved = false;
      let pinched = false;
      const onMove = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        if (this.pinching) pinched = true;
        if (pinched) return;
        if (!moved && Math.hypot(ev.clientX - start2.x, ev.clientY - start2.y) > TAP_SLOP2) moved = true;
        if (moved) move2(ev);
      };
      const onUp = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        window.removeEventListener("pointermove", onMove, true);
        window.removeEventListener("pointerup", onUp, true);
        window.removeEventListener("pointercancel", onUp, true);
        up(ev, moved, pinched || this.pinching || ev.type === "pointercancel");
      };
      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onUp, true);
    }
    pan(e, stage) {
      const from = { x: this.view.x, y: this.view.y, cx: e.clientX, cy: e.clientY };
      stage.classList.add("panning");
      this.follow(
        e,
        (ev) => {
          this.view.x = from.x + ev.clientX - from.cx;
          this.view.y = from.y + ev.clientY - from.cy;
          this.applyView();
        },
        (_ev, moved, pinched) => {
          stage.classList.remove("panning");
          if (!moved && !pinched && this.moving) {
            this.moving = null;
            this.ctx.deps.rerender();
          }
        }
      );
    }
    pressItem(e, item) {
      const kind = item.dataset.card ? "card" : "magnet";
      const id = item.dataset.card ?? item.dataset.magnet;
      const touch = e.pointerType !== "mouse";
      const wasMoving = this.isMoving(kind, id);
      let lifted = !touch || wasMoving;
      let byLongPress = false;
      let timer = null;
      if (!wasMoving) {
        timer = setTimeout(() => {
          timer = null;
          if (this.pinching) return;
          lifted = byLongPress = true;
          navigator.vibrate?.(15);
          item.classList.add("moving");
        }, LONG_PRESS_MS);
      }
      const start2 = { x: parseFloat(item.style.left), y: parseFloat(item.style.top), cx: e.clientX, cy: e.clientY };
      const pan = { x: this.view.x, y: this.view.y };
      let panned = false;
      this.follow(
        e,
        (ev) => {
          if (timer) clearTimeout(timer);
          timer = null;
          if (!lifted) {
            panned = true;
            this.view.x = pan.x + ev.clientX - start2.cx;
            this.view.y = pan.y + ev.clientY - start2.cy;
            return this.applyView();
          }
          const z = this.zoom();
          item.style.left = `${clamp(start2.x + (ev.clientX - start2.cx) / z, 0, BOARD_W - item.offsetWidth)}px`;
          item.style.top = `${clamp(start2.y + (ev.clientY - start2.cy) / z, 0, BOARD_H - 40)}px`;
        },
        (_ev, moved, pinched) => {
          if (timer) clearTimeout(timer);
          if (pinched) {
            if (byLongPress) item.classList.remove("moving");
            item.style.left = `${start2.x}px`;
            item.style.top = `${start2.y}px`;
            return;
          }
          if (panned) return;
          if (moved) {
            if (touch) this.moving = { kind, id };
            return this.commitPlace(kind, id, { x: parseFloat(item.style.left), y: parseFloat(item.style.top) }, true);
          }
          if (byLongPress) {
            this.moving = { kind, id };
            return this.ctx.deps.rerender();
          }
          if (kind === "card") return this.ctx.openCard(id);
          const page = this.ctx.board()?.magnets.find((m2) => m2.id === id)?.page;
          if (page && !wasMoving) {
            void this.ctx.deps.openPage(page.archiveId).then((ok) => ok || this.ctx.deps.ui.toast(t("This page isn't in this browser's Gallery.", "이 페이지는 이 브라우저의 갤러리에 없어요."), "info", { title: "📋" }));
            return;
          }
          this.moving = wasMoving ? null : { kind, id };
          this.ctx.deps.rerender();
        }
      );
    }
    dragHandle(e, item, handle) {
      const kind = item.dataset.card ? "card" : "magnet";
      const id = item.dataset.card ?? item.dataset.magnet;
      const start2 = { w: item.offsetWidth, cx: e.clientX };
      const limits = kind === "card" ? CARD_W : MAGNET_SIZE;
      const rect = item.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      let rotate = 0;
      this.follow(
        e,
        (ev) => {
          if (handle === "resize") {
            item.style.width = `${clamp(start2.w + (ev.clientX - start2.cx) / this.zoom(), limits.min, limits.max)}px`;
          } else {
            rotate = rotationFrom(ev.clientX - center.x, ev.clientY - center.y);
            item.style.transform = rotate ? `rotate(${rotate}deg)` : "";
          }
        },
        (_ev, moved, pinched) => {
          if (!moved || pinched) return;
          if (handle === "resize") this.commitPlace(kind, id, { w: parseFloat(item.style.width) });
          else this.commitPlace(kind, id, { rotate });
        }
      );
    }
    commitPlace(kind, id, change, toTop = false) {
      const grid = this.ctx.grid();
      this.ctx.updateBoard((b) => {
        const z = topZ(b);
        const target = kind === "card" ? b.cards.find((c) => c.memoId === id) : b.magnets.find((m2) => m2.id === id);
        if (!target) return;
        if (change.x !== void 0) target.x = Math.max(0, snapTo(change.x, grid));
        if (change.y !== void 0) target.y = Math.max(0, snapTo(change.y, grid));
        if (change.w !== void 0) {
          const w = Math.max(grid, snapTo(change.w, grid));
          if ("memoId" in target) target.w = clamp(w, CARD_W.min, CARD_W.max);
          else target.size = clamp(w, MAGNET_SIZE.min, MAGNET_SIZE.max);
        }
        if (change.rotate !== void 0) {
          if (change.rotate) target.rotate = change.rotate;
          else delete target.rotate;
        }
        if (toTop) target.z = z;
      });
    }
  };
  function keepsStraight(board, grid) {
    const tilt = board.theme?.style?.tilt;
    return tilt === "straight" ? true : tilt === "tilted" ? false : grid > 0;
  }

  // src/ui/board-theme-css.ts
  var BOARD_THEME_CSS = `
.bt { --bt-sans: 'IBM Plex Sans KR', 'Pretendard', 'Noto Sans KR', system-ui, sans-serif; --bt-serif: 'Hahmlet', 'Gowun Batang', 'Nanum Myeongjo', 'Noto Serif KR', serif;
  --bt-italic: 'Instrument Serif', 'Cormorant Garamond', 'Fraunces', Georgia, serif; --bt-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  --bt-display: 'Anton', 'Black Han Sans', Impact, sans-serif; --muted: color-mix(in srgb, var(--ink) 55%, var(--card, var(--paper))); }
/* the whole tab, so the title reads on the theme's ground */
.bt.board-tab { background: var(--paper); }
.bt .board-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; padding: 2px 6px 4px; color: var(--pageInk, var(--ink)); }
.bt .board-head h1 { margin: 0; font: 600 26px/1.1 var(--bt-sans); letter-spacing: -1px; }
.bt .board-stage { background: var(--paper); border-color: color-mix(in srgb, var(--pageInk, var(--ink)) 14%, transparent); }
.bt .board-surface { background-color: var(--paper); box-shadow: none; }
.bt .board-card { background: var(--card); color: var(--ink); font-family: var(--bt-sans); }
.bt .board-card::after { background: linear-gradient(transparent, var(--card)); }
.bt .card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.bt .card-head .meta { font: 400 10.5px var(--bt-mono); color: var(--muted); letter-spacing: .04em; margin-left: auto; }
.bt-linen .card-head .meta { margin-left: 0; }
.bt .board-card .card-title { font-family: inherit; }
.bt .board-card .memo-drawn .red, .bt .board-card .memo-drawn ul.checks input { accent-color: var(--accent); }
.bt-mini { position: relative; height: 74px; border-radius: 8px; overflow: hidden; background: var(--paper); border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); }
.bt-mini .mc { position: absolute; left: 12px; top: 14px; width: 54%; bottom: -6px; background: var(--card, #fff); border-radius: 4px; padding: 7px 8px; box-shadow: 0 2px 6px rgb(0 0 0 / .15); }
.bt-mini .mc b { display: block; font: 700 12px var(--bt-mono); color: var(--accent); }
.bt-mini .mc i { display: block; height: 4px; margin-top: 5px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 55%, transparent); }
.bt-mini .mc i + i { width: 70%; }
.bt-mini .dot { position: absolute; right: 12px; top: 14px; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); }

/* warm workspace */
.bt-warm .board-surface { background-image: radial-gradient(color-mix(in srgb, var(--ink) 20%, transparent) 1px, transparent 1.2px); background-size: 18px 18px; }
.bt-warm .board-card { border-radius: 16px; background: linear-gradient(180deg, var(--card), color-mix(in srgb, var(--card) 94%, var(--ink))); box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent), 0 14px 24px -18px color-mix(in srgb, var(--ink) 60%, transparent); }
.bt-warm .card-head .num { font: 600 11px var(--bt-mono); color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--card)); padding: 2px 7px; border-radius: 6px; }
.bt-warm .board-card .card-title { font: 600 16px var(--bt-sans); letter-spacing: -.4px; }

/* bento */
.bt-bento .board-card { border-radius: 26px; padding: 18px 20px 20px; box-shadow: none; }
.bt-bento .board-card.alt1 { background: var(--accent); color: var(--on-accent); --card: var(--accent); }
.bt-bento .board-card.alt2 { background: var(--card2); color: var(--on-card2); --card: var(--card2); --ink: var(--on-card2); }
.bt-bento .card-head .num { font: 700 32px/1 var(--bt-sans); letter-spacing: -2px; }
.bt-bento .card-head .meta { background: color-mix(in srgb, var(--ink) 8%, transparent); padding: 3px 9px; border-radius: 999px; }
.bt-bento .board-card .card-title { font: 700 18px var(--bt-sans); letter-spacing: -.6px; margin-top: 8px; }
.bt-bento .board-head h1 { font: 700 30px var(--bt-sans); letter-spacing: -1.5px; }

/* editorial serif */
.bt-editorial .board-card { background: transparent; box-shadow: none; border-left: 1px solid color-mix(in srgb, var(--ink) 22%, transparent); border-radius: 0; padding: 0 14px; font-family: var(--bt-serif); }
.bt-editorial .board-card::after { background: linear-gradient(transparent, var(--paper)); }
.bt-editorial .card-head .num { font: italic 400 40px/1 var(--bt-italic); color: var(--accent); }
.bt-editorial .card-head .meta { font: italic 400 13px var(--bt-italic); letter-spacing: 0; }
.bt-editorial .board-card .card-title { font: 600 20px var(--bt-serif); letter-spacing: -.8px; padding-bottom: 6px; border-bottom: 1px solid var(--ink); }
.bt-editorial .board-head { border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); padding: 6px 2px 10px; }
.bt-editorial .board-head h1 { font: 800 40px/1 var(--bt-serif); letter-spacing: -2.5px; }

/* dark tech */
.bt-tech .board-surface { background-image: linear-gradient(color-mix(in srgb, var(--pageInk) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--pageInk) 5%, transparent) 1px, transparent 1px); background-size: 32px 32px; }
.bt-tech .board-card { border-radius: 12px; border: 1px solid color-mix(in srgb, var(--ink) 10%, transparent); box-shadow: 0 1px 0 color-mix(in srgb, var(--ink) 6%, transparent) inset, 0 20px 40px -20px #000; font-size: 13.5px; }
.bt-tech .card-head .num { font: 400 12px var(--bt-mono); color: var(--accent); }
.bt-tech .card-head .meta { border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent); padding: 1px 6px; border-radius: 4px; }
.bt-tech .board-card .card-title { font: 600 16px var(--bt-sans); letter-spacing: -.3px; }
.bt-tech .board-head h1 { background: linear-gradient(180deg, var(--pageInk), color-mix(in srgb, var(--pageInk) 50%, var(--paper))); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 30px; }

/* guideline sheet */
.bt-spec .board-surface { background-image: linear-gradient(90deg, color-mix(in srgb, var(--ink) 7%, transparent) 1px, transparent 1px); background-size: 192px 100%; }
.bt-spec .board-card { background: var(--paper); --card: var(--paper); border-top: 2px solid var(--ink); border-radius: 0; box-shadow: none; padding: 8px 2px 4px; }
.bt-spec .card-head .num { font: 300 42px/1 var(--bt-sans); letter-spacing: -2px; }
.bt-spec .card-head .meta { text-transform: uppercase; }
.bt-spec .board-card .card-title { font: 600 16px var(--bt-sans); padding-bottom: 6px; border-bottom: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); }
.bt-spec .board-head h1 { font: 700 32px var(--bt-sans); letter-spacing: -1.6px; }
.bt-spec .board-head h1::after { content: "."; color: var(--accent); }

/* duotone */
.bt-duotone .board-head { background: var(--accent); color: var(--pageInk); border-radius: var(--d-radius-sm); padding: 14px 16px 12px; }
.bt-duotone .board-head h1 { font: 700 34px/1 var(--bt-sans); letter-spacing: -2px; }
.bt-duotone .board-card { border-radius: 2px; box-shadow: 0 1px 0 color-mix(in srgb, var(--ink) 8%, transparent), 0 18px 30px -24px var(--ink); }
.bt-duotone .card-head .num { font: 700 13px var(--bt-sans); color: var(--accent); }
.bt-duotone .board-card .card-title { font: 700 18px var(--bt-sans); letter-spacing: -.8px; }

/* kinetic type */
.bt-kinetic .board-card { border-radius: 4px; box-shadow: none; }
.bt-kinetic .board-card.alt1 { background: var(--accent); color: var(--on-accent); --card: var(--accent); }
.bt-kinetic .card-head .num { font: 400 54px/.85 var(--bt-display); color: transparent; -webkit-text-stroke: 1.2px var(--ink); }
.bt-kinetic .board-card.alt1 .card-head .num { -webkit-text-stroke-color: var(--on-accent); }
.bt-kinetic .card-head .meta { color: inherit; opacity: .7; text-transform: uppercase; }
.bt-kinetic .board-card .card-title { font: 700 18px var(--bt-sans); letter-spacing: -.8px; margin-top: 6px; }
.bt-kinetic .board-head h1 { font: 400 40px/1 var(--bt-display); letter-spacing: 0; text-transform: uppercase; }

/* architect grid */
.bt-archi .board-surface { background-image: linear-gradient(color-mix(in srgb, var(--ink) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--ink) 9%, transparent) 1px, transparent 1px); background-size: 40px 40px; }
.bt-archi .board-card { border-radius: 0; box-shadow: none; outline: 1px solid var(--ink); }
.bt-archi .card-head .num { font: 400 11px var(--bt-mono); color: var(--accent); }
.bt-archi .board-card .card-title { font: 600 16px var(--bt-sans); margin-top: 14px; }
.bt-archi .board-head h1 { font: 300 32px var(--bt-sans); letter-spacing: -1.6px; }

/* pop sticker */
.bt-pop .board-surface { background-image: radial-gradient(circle at 1020px 60px, color-mix(in srgb, var(--ink) 30%, var(--accent)) 1.6px, transparent 1.9px), radial-gradient(circle at 1020px 60px, var(--accent) 0 330px, transparent 331px);
  background-size: 12px 12px, auto; }
.bt-pop .board-surface::before { content: ""; position: absolute; left: 690px; top: -270px; width: 660px; height: 660px; border-radius: 50%; border: 3px solid var(--ink); pointer-events: none; }
.bt-pop .board-stage.frame-mode { background-image: radial-gradient(circle at 95% 0, var(--accent) 0 180px, transparent 181px); }
.bt-pop .board-card { border: 3px solid var(--ink); border-radius: 0; box-shadow: 6px 6px 0 var(--ink); }
.bt-pop .board-card::after { display: none; }
.bt-pop .card-head { border-bottom: 3px solid var(--ink); padding-bottom: 4px; margin-bottom: 8px; }
.bt-pop .card-head .num { font: 900 32px/0.9 'Black Han Sans', var(--bt-sans); }
.bt-pop .card-head .meta { font: 600 11px var(--bt-mono); color: var(--ink); background: var(--accent2); padding: 1px 6px; }
.bt-pop .board-card.alt1 .card-head .meta { background: var(--accent); color: var(--on-accent); }
.bt-pop .board-card .card-title { font: 700 18px var(--bt-sans); letter-spacing: -.6px; }
.bt-pop .board-head h1 { font: 900 40px/0.95 'Black Han Sans', var(--bt-sans); letter-spacing: -1px; }
.bt-pop .board-frame .board-head { background: var(--accent2); border: 3px solid var(--ink); border-radius: 0; box-shadow: 6px 6px 0 var(--ink); }

/* the title block in the section layout, per theme */
.bt .board-frame .board-head { background: var(--card, var(--paper)); color: var(--ink); }
.bt-bento .board-frame .board-head { background: var(--card2); color: var(--on-card2); border-radius: 26px; }
.bt-bento .board-frame { --frame-gap: 14px; }
.bt-editorial .board-frame .board-head, .bt-spec .board-frame .board-head, .bt-archi .board-frame .board-head { background: transparent; }
.bt-editorial .board-frame .board-head .big { font: italic 400 72px/0.85 var(--bt-italic); letter-spacing: -2px; }
.bt-spec .board-frame .board-head .big { font-weight: 300; color: var(--accent); }
.bt-archi .board-frame { --frame-gap: 0px; } .bt-archi .board-frame > * { outline: 1px solid var(--ink); }
.bt-spec .board-frame { --frame-gap: 20px; }
.bt-tech .board-frame .board-head { border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); border-radius: 12px; }
.bt-duotone .board-frame .board-head { background: var(--accent); color: var(--pageInk); border-radius: 2px; }
.bt-kinetic .board-frame .board-head { background: transparent; color: var(--pageInk); }
.bt-kinetic .board-frame .board-head .big { font: 400 92px/0.8 var(--bt-display); color: transparent; -webkit-text-stroke: 1.5px var(--accent); letter-spacing: 0; }
.bt-warm .board-frame .board-head { border-radius: 16px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent); }
.bt-clean .board-frame .board-head { border-radius: 24px; background: var(--card2); }
.bt-linen .board-frame .board-head, .bt-cottage .board-frame .board-head { align-items: center; text-align: center; }

/* cottage scrapbook */
.bt-cottage .board-surface { background-image: radial-gradient(color-mix(in srgb, var(--ink) 12%, transparent) 1px, transparent 1.2px), radial-gradient(rgb(255 255 255 / .1) 1px, transparent 1.2px); background-size: 7px 7px, 11px 11px; }
.bt-cottage .board-card { border-radius: 2px; border-top: 3px solid var(--accent); font-family: var(--bt-serif); line-height: 24px; overflow: visible; max-height: none;
  background-image: linear-gradient(color-mix(in srgb, var(--ink) 13%, transparent) 1px, transparent 1px); background-size: 100% 24px; background-position: 0 46px; box-shadow: 0 4px 10px rgb(0 0 0 / .2); }
.bt-cottage .board-card:nth-child(3n+2) { border-top-color: var(--accent2); }
.bt-cottage .board-card::before { content: ""; position: absolute; left: 50%; top: -9px; width: 12px; height: 20px; border-radius: 3px; background: color-mix(in srgb, var(--paper) 70%, var(--ink)); transform: translateX(-50%); }
.bt-cottage .board-card::after { display: none; }
.bt-cottage .card-head .num { font: italic 400 20px var(--bt-italic); color: var(--accent); }
.bt-cottage .card-head .meta { font: italic 400 13px var(--bt-italic); }
.bt-cottage .board-card .card-title { font: 700 18px var(--bt-serif); }
.bt-cottage .board-head h1 { font: 700 30px var(--bt-serif); }

/* clean neutral */
.bt-clean .board-card { border-radius: 24px; padding: 18px 18px 20px; box-shadow: 0 18px 30px -20px color-mix(in srgb, var(--ink) 50%, transparent); }
.bt-clean .board-card.alt1 { background: var(--card2); --card: var(--card2); }
.bt-clean .card-head .num { font: italic 400 24px var(--bt-italic); color: var(--accent); }
.bt-clean .card-head .meta { font: 300 10px var(--bt-sans); letter-spacing: .14em; text-transform: uppercase; }
.bt-clean .board-card .card-title { font: 600 16px var(--bt-sans); }
.bt-clean .board-head h1 { font: 300 32px var(--bt-sans); letter-spacing: -1.4px; }

/* linen journal */
.bt-linen .board-surface { background-image: repeating-linear-gradient(0deg, rgb(0 0 0 / .03) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(255 255 255 / .08) 0 1px, transparent 1px 4px); }
.bt-linen .board-card { border-radius: 0; padding: 18px 18px 20px; box-shadow: 0 1px 1px rgb(0 0 0 / .06), 0 14px 24px -20px color-mix(in srgb, var(--ink) 60%, transparent); line-height: 1.7;
  clip-path: polygon(0 1%, 5% 0, 12% .8%, 20% 0, 30% .7%, 40% 0, 50% .8%, 60% .1%, 70% .8%, 80% 0, 90% .7%, 100% .2%, 99.5% 12%, 100% 30%, 99.4% 50%, 100% 70%, 99.5% 88%, 100% 99.4%, 90% 100%, 80% 99.3%, 70% 100%, 60% 99.4%, 50% 100%, 40% 99.3%, 30% 100%, 20% 99.4%, 10% 100%, 0 99.4%, .5% 85%, 0 65%, .6% 45%, 0 25%); }
.bt-linen .card-head { justify-content: center; }
.bt-linen .card-head .num { font: italic 300 22px var(--bt-italic); color: var(--accent); }
.bt-linen .card-head .meta { font: 300 10px var(--bt-sans); letter-spacing: .2em; }
.bt-linen .board-card .card-title { font: 400 18px var(--bt-serif); text-align: center; }
.bt-linen .board-card .card-title::after { content: ""; display: block; width: 26px; margin: 8px auto 4px; border-top: 1px solid var(--accent); }
.bt-linen .board-head { justify-content: center; text-align: center; }
.bt-linen .board-head h1 { font: 300 30px var(--bt-serif); }

/* what a look changes over its theme (classes set by board-theme-panel.ts); x-<chip>: a chip the theme doesn't name */
.bt.x-pageInk .board-head, .bt.x-pageInk .board-head h1 { color: var(--pageInk); -webkit-text-fill-color: var(--pageInk); }
.bt.x-card .board-card:not(.alt1):not(.alt2) { background: var(--card); --card: var(--card); }
.bt.x-card2 .board-card.alt2 { background: var(--card2); color: var(--on-card2); --card: var(--card2); }
.bt.x-accent2 .card-head .meta { color: var(--accent2); opacity: 1; }
.bt.s-tfont .board-head h1 { font-family: var(--s-tfont); }
.bt.s-cfont .board-card, .bt.s-cfont .board-card .card-title { font-family: var(--s-cfont); }
.bt.s-radius .board-card, .bt.s-radius .board-frame .board-head { border-radius: var(--s-radius); }
.bt.s-shadow-none .board-card { box-shadow: none; }
.bt.s-shadow-soft .board-card { box-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 8px 18px -10px rgb(0 0 0 / .35); }
.bt.s-shadow-strong .board-card { box-shadow: 0 2px 4px rgb(0 0 0 / .12), 0 22px 40px -14px rgb(0 0 0 / .6); }
.bt.s-pattern .board-surface, .bt.s-pattern .board-stage.frame-mode { background-color: var(--paper); background-size: auto; background-position: 0 0; }
.bt.s-pattern .board-surface::before { display: none; }
.bt.s-pattern-none .board-surface, .bt.s-pattern-none .board-stage.frame-mode { background-image: none; }
.bt.s-pattern-dots .board-surface, .bt.s-pattern-dots .board-stage.frame-mode { background-image: radial-gradient(color-mix(in srgb, var(--on-paper, var(--ink)) 22%, transparent) 1px, transparent 1.3px); background-size: 18px 18px; }
.bt.s-pattern-grid .board-surface, .bt.s-pattern-grid .board-stage.frame-mode { background-image: linear-gradient(color-mix(in srgb, var(--on-paper, var(--ink)) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--on-paper, var(--ink)) 9%, transparent) 1px, transparent 1px); background-size: 32px 32px; }
.bt.s-pattern-lines .board-surface, .bt.s-pattern-lines .board-stage.frame-mode { background-image: linear-gradient(color-mix(in srgb, var(--on-paper, var(--ink)) 10%, transparent) 1px, transparent 1px); background-size: 100% 28px; }
`;

  // src/ui/board-theme-panel.ts
  var BOARD_THEME_PANEL_CSS = `
.theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.theme-grid button { display: grid; gap: 6px; width: auto; padding: 6px; border-radius: 10px; text-align: left; background: transparent; border: 1px solid var(--d-line); }
.theme-grid button[aria-pressed="true"] { border-color: var(--d-accent); box-shadow: 0 0 0 2px var(--d-ring); }
.theme-grid button span { font-size: 12.5px; padding: 0 2px; }
.theme-chips { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.theme-chips label { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; font-size: 13px; color: var(--d-text); }
.theme-chips input[type=color] { width: 2.4em; height: 2em; padding: 1px; cursor: pointer; }
.theme-chips .reset, .theme-shape .reset { width: auto; padding: 2px 6px; font-size: 12px; }
.theme-chips.more { margin-top: 8px; }
.theme-grid .mine { position: relative; display: grid; }
.theme-grid .mine > button { width: 100%; min-width: 0; box-sizing: border-box; }
.theme-grid .mine > button > span { padding-right: 58px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.theme-grid .mine .acts { position: absolute; right: 6px; bottom: 4px; display: flex; gap: 3px; }
.theme-grid .mine .acts button { width: 24px; height: 24px; padding: 0; justify-content: center; font-size: 12px; border-radius: 6px; }
.theme-files { display: flex; flex-wrap: wrap; gap: 6px; }
.theme-files button { width: auto; padding: 4px 10px; }
.theme-shape { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px 16px; }
.theme-shape label { display: grid; grid-template-columns: 6.5em 1fr auto; align-items: center; gap: 6px; font-size: 13px; color: var(--d-text); }
.theme-shape select, .theme-shape input[type=range] { width: 100%; min-width: 0; }
.theme-css textarea { width: 100%; min-height: 9em; font: 12px/1.45 var(--d-mono); resize: vertical; }
.theme-css .row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.theme-css .row button { width: auto; padding: 4px 10px; }
${BOARD_THEME_CSS}
`;
  var fontCss = (font) => FONT_KINDS.includes(font) ? `var(--bt-${font})` : `"${font}", var(--bt-sans)`;
  function dressBoard(tab, board, useFont2 = () => {
  }) {
    const theme = themeById(board.theme?.id);
    const colors = themeColors(board.theme);
    tab.classList.add("bt", `bt-${theme.id}`);
    for (const [key2, value] of Object.entries(colors)) tab.style.setProperty(`--${key2}`, value);
    for (const key2 of Object.keys(board.theme?.colors ?? {})) if (!ownsChip(theme, key2)) tab.classList.add(`x-${key2}`);
    tab.style.setProperty("--on-accent", inkOn(colors.accent ?? "#888888"));
    tab.style.setProperty("--on-paper", inkOn(colors.paper ?? "#888888"));
    tab.style.setProperty("--on-card2", inkOn(colors.card2 ?? colors.ink ?? "#888888"));
    const style = board.theme?.style;
    if (!style) return;
    for (const [cls, font] of [["s-tfont", style.titleFont], ["s-cfont", style.cardFont]]) {
      if (!font) continue;
      tab.classList.add(cls);
      tab.style.setProperty(`--${cls}`, fontCss(font));
      if (!FONT_KINDS.includes(font)) useFont2(font);
    }
    if (style.radius !== void 0) {
      tab.classList.add("s-radius");
      tab.style.setProperty("--s-radius", `${style.radius}px`);
    }
    if (style.shadow) tab.classList.add(`s-shadow-${style.shadow}`);
    if (style.pattern) tab.classList.add("s-pattern", `s-pattern-${style.pattern}`);
    if (style.css && !cssProblem(style.css)) {
      tab.classList.add("bt-own");
      tab.append(el("style", {}, `.board-tab.bt-own {
${style.css}
}`));
    }
  }
  function miniLook(id, look) {
    const mini = el("div", { class: `bt bt-mini bt-${id}` }, el("div", { class: "mc" }, el("b", {}, "01"), el("i"), el("i")), el("div", { class: "dot" }));
    for (const [key2, value] of Object.entries(look)) mini.style.setProperty(`--${key2}`, value);
    return mini;
  }
  function themePanel(ctx, board, close) {
    const current = themeById(board.theme?.id);
    const look = board.theme ?? { id: current.id };
    const saved = ctx.state().themes ?? [];
    const head = el("div", { class: "over-head" }, el("button", { onclick: close }, "‹ ", t("Board", "보드")), el("strong", {}, t("Theme", "테마")), el("span", { class: "grow" }));
    const grid = el("div", { class: "theme-grid" });
    const mineShown = saved.find((s) => sameLook(board.theme, s));
    for (const theme of BOARD_THEMES) {
      const mini = miniLook(theme.id, theme.id === current.id && !mineShown ? themeColors(look) : themeColors({ id: theme.id }));
      grid.append(
        el(
          "button",
          {
            "aria-pressed": String(theme.id === current.id && !mineShown),
            onclick: () => ctx.updateBoard((b) => b.theme = theme.id === b.theme?.id ? b.theme : { id: theme.id })
          },
          mini,
          el("span", {}, t(theme.name[0], theme.name[1]))
        )
      );
    }
    const lookName = mineShown?.name ?? t(current.name[0], current.name[1]);
    const files = el(
      "div",
      { class: "theme-files" },
      el("button", { onclick: () => void saveLook(ctx, look, lookName) }, "💾 ", t("Save this look", "이 모양 저장")),
      el("button", { onclick: () => downloadJson(themeFile(lookName, look), `${lookName}.board-theme.json`) }, "⬇ ", t("Save as a file", "파일로 저장")),
      el("button", { onclick: () => pickFiles((list) => void loadFiles(ctx, list), { json: true, multiple: true }) }, "⬆ ", t("Load a theme file", "테마 파일 불러오기"))
    );
    const changed = Object.keys(look.colors ?? {}).length > 0 || !!look.style;
    return el(
      "div",
      { class: "board-over", role: "dialog", "aria-label": t("Theme", "테마") },
      head,
      // the user's own first: on a phone the twelve themes run long
      files,
      saved.length ? el("strong", {}, t("My themes", "내 테마")) : null,
      saved.length ? myThemes(ctx, board, saved) : null,
      el("strong", {}, t(`Colors of ${current.name[0]}`, `${current.name[1]} 색`)),
      colorChips(ctx, look),
      el("strong", {}, t("Shape", "모양")),
      shapeControls(ctx, look),
      cssBox(ctx, look),
      changed ? el("button", { style: "width:auto;justify-self:start", onclick: () => ctx.updateBoard((b) => b.theme = { id: current.id }) }, t(`All back to ${current.name[0]} as it comes`, `모두 ${current.name[1]} 기본으로`)) : null,
      el("strong", {}, t("Themes", "테마"), helpTip(t("Grid themes keep cards straight and lined up. A theme's fonts show when Marinara has them", "격자 테마는 카드를 반듯하게 맞춤. 테마 글꼴은 마리나라에 있을 때만"), t("Themes", "테마"))),
      grid
    );
  }
  function colorChips(ctx, look) {
    const theme = themeById(look.id);
    const colors = allColors(look);
    const changed = look.colors ?? {};
    const chip2 = (key2, label) => {
      const input = el("input", { type: "color", value: colors[key2], "aria-label": t(label[0], label[1]) });
      input.addEventListener("change", () => recolor(ctx, key2, input.value));
      return el(
        "label",
        {},
        input,
        t(label[0], label[1]),
        changed[key2] ? el("button", { class: "reset ghost", title: t("Theme's color", "테마 기본 색"), onclick: (e) => (e.preventDefault(), recolor(ctx, key2, null)) }, "↺") : null
      );
    };
    const own = el("div", { class: "theme-chips" }, ...theme.colors.map((c) => chip2(c.key, c.label)));
    const others = ALL_COLORS.filter((c) => !ownsChip(theme, c.key));
    if (!others.length) return own;
    const more = el("details", { class: "fold", ...others.some((c) => changed[c.key]) ? { open: true } : {} }, el("summary", {}, t("More colors", "색 더 보기")), el("div", { class: "theme-chips more" }, ...others.map((c) => chip2(c.key, c.label))));
    return el("div", {}, own, more);
  }
  function shapeControls(ctx, look) {
    const style = look.style ?? {};
    const themes = t("Theme's", "테마 기본");
    const select2 = (key2, label, options, value) => {
      const box = el("select", { "aria-label": label }, el("option", { value: "" }, themes), ...options.map(([v, text7]) => el("option", { value: v, ...v === value ? { selected: true } : {} }, text7)));
      box.addEventListener("change", () => restyle(ctx, { [key2]: box.value || void 0 }));
      return { box, row: el("label", {}, label, box, el("span")) };
    };
    const kinds = [
      ["sans", t("Sans", "고딕")],
      ["serif", t("Serif", "명조")],
      ["italic", t("Italic serif", "이탤릭 세리프")],
      ["mono", t("Monospace", "고정폭")],
      ["display", t("Display", "디스플레이")]
    ];
    const fontRow = (key2, label) => {
      const current = style[key2];
      const extra = current && !kinds.some(([k]) => k === current) ? [[current, current]] : [];
      const { box, row } = select2(key2, label, [...kinds, ...extra], current);
      void ctx.deps.fonts().then((families) => {
        for (const f of families) if (f !== current) box.append(el("option", { value: f }, f));
      });
      return row;
    };
    const radius = el("input", { type: "range", min: "0", max: "40", step: "1", value: String(style.radius ?? 12), "aria-label": t("Corners", "모서리") });
    radius.addEventListener("change", () => restyle(ctx, { radius: Number(radius.value) }));
    const shadowNames = { none: t("None", "없음"), soft: t("Soft", "은은하게"), strong: t("Strong", "진하게") };
    const patternNames = { none: t("None", "없음"), dots: t("Dots", "점"), grid: t("Grid", "격자"), lines: t("Lines", "줄") };
    return el(
      "div",
      { class: "theme-shape" },
      fontRow("titleFont", t("Title font", "제목 글꼴")),
      fontRow("cardFont", t("Card font", "카드 글꼴")),
      el(
        "label",
        {},
        t("Corners", "모서리"),
        radius,
        style.radius !== void 0 ? el("button", { class: "reset ghost", title: themes, onclick: (e) => (e.preventDefault(), restyle(ctx, { radius: void 0 })) }, "↺") : el("span", { class: "note" }, themes)
      ),
      select2("shadow", t("Shadow", "그림자"), SHADOWS.map((s) => [s, shadowNames[s]]), style.shadow).row,
      select2("pattern", t("Background", "바탕 무늬"), PATTERNS.map((p) => [p, patternNames[p]]), style.pattern).row,
      select2("tilt", t("Cards", "카드"), [["straight", t("Kept straight", "반듯하게")], ["tilted", t("Tilted as placed", "놓은 대로 기울게")]], style.tilt).row
    );
  }
  function cssBox(ctx, look) {
    const area = el("textarea", { spellcheck: "false", maxlength: String(MAX_CSS), placeholder: ".board-card { border: 2px dashed var(--accent); }\n.board-head h1 { letter-spacing: 4px; }", "aria-label": t("Your CSS", "직접 쓰는 CSS") });
    area.value = look.style?.css ?? "";
    const apply = () => {
      const css = area.value.trim();
      const problem = css ? cssProblem(css) : null;
      if (problem) {
        ctx.deps.ui.toast(
          problem === "too-long" ? t(`The CSS is over ${MAX_CSS} characters.`, `CSS가 ${MAX_CSS}자를 넘어요.`) : problem === "unbalanced" ? t("The CSS has a { or } (or a quote) that isn't closed.", "CSS에 닫히지 않은 { } 또는 따옴표가 있어요.") : t(`The CSS uses something a board can't: url() other than a data: picture, @import and other @ rules but @media/@supports/@container/@keyframes, position: fixed or sticky, "<" or a backslash.`, '보드에서 쓸 수 없는 것이 있어요: data: 그림이 아닌 url(), @import 같은 @규칙(@media·@supports·@container·@keyframes는 돼요), position: fixed·sticky, "<", 역슬래시.'),
          "warning"
        );
        return;
      }
      restyle(ctx, { css: css || void 0 });
    };
    return el(
      "details",
      { class: "fold theme-css", ...look.style?.css ? { open: true } : {} },
      el("summary", {}, t("Advanced: your own CSS", "고급: CSS 직접 쓰기"), helpTip(t(
        "Applies only inside this board, after the theme. Parts: .board-card, .card-title, .card-head .num, .card-head .meta, .board-head h1, .board-surface; colors: var(--paper), var(--card), var(--ink), var(--accent)… It goes with the look into My themes and theme files.",
        "이 보드 안에만, 테마 다음에 적용돼요. 부분: .board-card, .card-title, .card-head .num, .card-head .meta, .board-head h1, .board-surface / 색: var(--paper), var(--card), var(--ink), var(--accent)… 내 테마와 테마 파일에도 같이 저장돼요."
      ), "CSS")),
      area,
      el(
        "div",
        { class: "row" },
        el("button", { onclick: apply }, t("Apply", "적용")),
        look.style?.css ? el("button", { class: "ghost", onclick: () => restyle(ctx, { css: void 0 }) }, t("Remove", "지우기")) : null
      )
    );
  }
  function myThemes(ctx, board, saved) {
    const grid = el("div", { class: "theme-grid" });
    for (const s of saved) {
      const look = lookOf(s);
      grid.append(
        el(
          "div",
          { class: "mine" },
          el("button", { "aria-pressed": String(sameLook(board.theme, s)), onclick: () => ctx.updateBoard((b) => b.theme = lookOf(s)) }, miniLook(s.base, themeColors(look)), el("span", {}, s.name)),
          el(
            "div",
            { class: "acts" },
            el("button", { class: "ghost", title: t("Save as a file", "파일로 저장"), "aria-label": t("Save as a file", "파일로 저장"), onclick: () => downloadJson(themeFile(s.name, look), `${s.name}.board-theme.json`) }, "⬇"),
            el("button", { class: "ghost", title: t("Remove from My themes", "내 테마에서 지우기"), "aria-label": t("Remove from My themes", "내 테마에서 지우기"), onclick: () => void forget(ctx, s) }, "✕")
          )
        )
      );
    }
    return grid;
  }
  async function saveLook(ctx, look, suggested) {
    const name = (await ctx.deps.ui.input(t("A name for this look", "이 모양의 이름"), { defaultValue: suggested }))?.trim();
    if (!name) return;
    ctx.deps.store.update((s) => {
      const list = s.themes ?? [];
      const same3 = list.find((x) => x.name === name);
      const entry = savedOf(same3?.id ?? newId("theme"), name, look);
      s.themes = same3 ? list.map((x) => x === same3 ? entry : x) : [...list, entry];
    });
    ctx.deps.ui.toast(t(`Saved to My themes: ${name}`, `내 테마에 저장했어요: ${name}`), "success");
  }
  async function loadFiles(ctx, files) {
    const added2 = [];
    for (const file of files) {
      let read;
      try {
        read = readThemeFile(JSON.parse(await file.text()));
      } catch {
        read = { error: "not-a-theme" };
      }
      if ("error" in read) {
        ctx.deps.ui.toast(read.error === "unknown-theme" ? t(`${file.name}: made from a theme this Dispensa doesn't have (update Dispensa?)`, `${file.name}: 이 Dispensa에 없는 테마로 만든 파일이에요(Dispensa를 업데이트해 보세요)`) : t(`${file.name} isn't a board theme file`, `${file.name}은(는) 보드 테마 파일이 아니에요`), "warning");
        continue;
      }
      if (read.droppedCss) ctx.deps.ui.toast(t(`${file.name}: its CSS uses something a board can't, so it was left out.`, `${file.name}: 보드에서 쓸 수 없는 CSS가 있어서 CSS는 빼고 불러왔어요.`), "warning");
      added2.push(savedOf(newId("theme"), read.name, read.look));
    }
    const last = added2.at(-1);
    if (!last) return;
    ctx.deps.store.update((s) => {
      const keep = (s.themes ?? []).filter((x) => !added2.some((a) => a.name === x.name));
      s.themes = [...keep, ...added2];
    });
    ctx.updateBoard((b) => b.theme = lookOf(last));
    ctx.deps.ui.toast(t(`Loaded into My themes: ${added2.map((a) => a.name).join(", ")}`, `내 테마로 불러왔어요: ${added2.map((a) => a.name).join(", ")}`), "success");
  }
  async function forget(ctx, s) {
    if (!await confirmIn(ctx.deps.ui, t(`Remove "${s.name}" from My themes? Boards using it keep their look.`, `"${s.name}"을(를) 내 테마에서 지울까요? 이 모양을 쓰는 보드는 그대로예요.`))) return;
    ctx.deps.store.update((st) => {
      const list = (st.themes ?? []).filter((x) => x.id !== s.id);
      if (list.length) st.themes = list;
      else delete st.themes;
    });
  }
  function recolor(ctx, key2, value) {
    ctx.updateBoard((b) => {
      const theme = themeById(b.theme?.id);
      const colors = { ...b.theme?.colors ?? {}, [key2]: value ?? chipDefault(theme, key2) };
      b.theme = normalizeTheme({ ...b.theme, id: theme.id, colors }) ?? { id: theme.id };
    });
  }
  function restyle(ctx, change) {
    ctx.updateBoard((b) => {
      const theme = themeById(b.theme?.id);
      const style = { ...b.theme?.style ?? {} };
      for (const [k, v] of Object.entries(change)) {
        if (v === void 0) delete style[k];
        else style[k] = v;
      }
      b.theme = normalizeTheme({ ...b.theme, id: theme.id, style }) ?? { id: theme.id };
    });
  }

  // src/ui/notes-view.ts
  var NOTES_VIEW_CSS = `
.notes { flex: 1; min-height: 0; display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 8px; }
.notes > section { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; padding: 8px;
  border: 1px solid var(--d-line); border-radius: var(--d-radius); background: var(--d-panel-solid); }
.notes .n-head { display: flex; align-items: center; gap: 6px; }
.notes .n-head strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
.notes .n-head > button, .notes .n-head > .menu > summary { width: auto; flex: none; padding: 4px 8px; }
.notes .n-head select { width: auto; max-width: 11em; padding: 3px 6px; }
.notes .folder { display: flex; align-items: center; gap: 4px; }
.notes .folder > button.entry { flex: 1; min-width: 0; justify-content: flex-start; gap: 8px; border-color: transparent; background: none; text-align: left; }
.notes .folder > button.entry.sel { background: var(--d-hl-bg); border-color: var(--d-line); font-weight: 600; }
.notes .folder .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notes .folder .count { color: var(--d-muted); font-size: 12px; font-weight: 400; }
.notes .note-row { display: flex; flex-direction: column; align-items: stretch; gap: 2px; text-align: left; padding: 8px 10px; white-space: normal; }
.notes .note-row .top { display: flex; gap: 6px; align-items: baseline; }
.notes .note-row .title { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notes .note-row .date { color: var(--d-muted); font-size: 11.5px; flex: none; }
.notes .note-row .preview { color: var(--d-muted); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notes .note-row .where { color: var(--d-muted); font-size: 11.5px; }
.notes .empty-note { color: var(--d-muted); text-align: center; margin: 24px auto; }
.notes .memo-body { cursor: text; min-height: 120px; }
.notes .memo-body .empty { color: var(--d-muted); }
.notes .n-title { font-size: 16px; font-weight: 600; }
@media (max-width: 600px) {
  .notes { grid-template-columns: minmax(0, 1fr); }
  .notes[data-level="list"] .n-folders, .notes[data-level="memo"] .n-folders { display: none; }
  .notes[data-level="folders"] .n-main { display: none; }
}
@media (min-width: 601px) { .notes .phone-only { display: none; } }
`;
  var two2 = (n) => String(n).padStart(2, "0");
  var dateOf2 = (at) => {
    if (!at) return "";
    const d = new Date(at);
    return d.toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? `${two2(d.getHours())}:${two2(d.getMinutes())}` : `${two2(d.getMonth() + 1)}.${two2(d.getDate())}`;
  };
  var NotesView = class {
    constructor(deps) {
      this.deps = deps;
    }
    /** "all" or a folder id. */
    folder = "all";
    open = null;
    writing = false;
    query = "";
    /** On a phone: what shows (the folders, a folder's memos, or a memo). */
    level = "list";
    get state() {
      return this.deps.store.value;
    }
    update(fn) {
      this.deps.store.update(fn);
    }
    mutate(id, fn) {
      this.update((s) => {
        const m2 = s.memos.find((x) => x.id === id);
        if (m2) fn(m2);
      });
    }
    render() {
      const folders = this.state.folders ?? [];
      if (this.folder !== "all" && !folders.some((f) => f.id === this.folder)) this.folder = "all";
      const memo2 = this.open ? this.state.memos.find((m2) => m2.id === this.open) : void 0;
      if (this.open && !memo2) this.open = null;
      const level = memo2 ? "memo" : this.level === "memo" ? "list" : this.level;
      const folderPane = this.folderPane();
      const main = memo2 ? this.memoPane(memo2) : this.listPane();
      this.keepScroll(folderPane, "folders");
      this.keepScroll(main, memo2 ? `memo:${memo2.id}` : `list:${this.folder}`);
      return el("div", { class: "notes", "data-level": level }, folderPane, main);
    }
    /** Panes are drawn anew on each redraw: each keeps its scroll (per folder, per memo). */
    scrolls = /* @__PURE__ */ new Map();
    keepScroll(pane, key2) {
      const top = this.scrolls.get(key2);
      if (top) requestAnimationFrame(() => pane.isConnected && (pane.scrollTop = top));
      pane.addEventListener("scroll", () => this.scrolls.set(key2, pane.scrollTop), { passive: true });
    }
    folderPane() {
      const memos = this.state.memos;
      const row = (id, label, glyph, count) => el(
        "div",
        { class: "folder" },
        el(
          "button",
          {
            class: `entry${this.folder === id ? " sel" : ""}`,
            "aria-pressed": String(this.folder === id),
            onclick: () => {
              this.folder = id;
              this.open = null;
              this.query = "";
              this.level = "list";
              this.deps.rerender();
            }
          },
          glyph,
          el("span", { class: "name" }, label),
          el("span", { class: "count" }, String(count))
        )
      );
      const list = [row("all", t("All memos", "모든 메모"), icon("notebook-pen"), memos.length)];
      for (const f of this.state.folders ?? []) list.push(row(f.id, f.name, icon("folder"), memosInFolder(memos, f.id).length));
      return el(
        "section",
        { class: "n-folders", "aria-label": t("Folders", "폴더") },
        el("div", { class: "n-head" }, el("strong", {}, t("Folders", "폴더"))),
        ...list,
        el("button", { class: "ghost", onclick: () => void this.makeFolder() }, icon("folder-plus"), t("New folder", "새 폴더"))
      );
    }
    folderName(id) {
      return id ? this.state.folders?.find((f) => f.id === id)?.name : void 0;
    }
    listPane() {
      const all = memosInFolder(this.state.memos, this.folder);
      const shown = shownMemos(all, this.query);
      const name = this.folder === "all" ? t("All memos", "모든 메모") : this.folderName(this.folder) ?? "";
      const rows = shown.map((m2) => {
        const text7 = oneLine(plainText(m2.text), 90);
        const where = this.folder === "all" ? this.folderName(m2.folder) : void 0;
        return el(
          "button",
          {
            class: "note-row",
            "data-memo": m2.id,
            onclick: () => {
              this.open = m2.id;
              this.writing = !m2.text.trim();
              this.level = "memo";
              this.deps.rerender();
            }
          },
          el("span", { class: "top" }, m2.pinned ? el("span", {}, "📌") : null, el("span", { class: "title" }, memoLabel(m2, 60) || t("(empty memo)", "(빈 메모)")), el("span", { class: "date" }, dateOf2(m2.createdAt))),
          m2.title?.trim() && text7 ? el("span", { class: "preview" }, text7) : null,
          where ? el("span", { class: "where" }, `📁 ${where}`) : null
        );
      });
      return el(
        "section",
        { class: "n-main", "aria-label": name },
        el(
          "div",
          { class: "n-head" },
          el("button", { class: "phone-only", title: t("Folders", "폴더"), "aria-label": t("Folders", "폴더"), onclick: () => (this.level = "folders", this.deps.rerender()) }, "‹"),
          el("strong", {}, name),
          el("button", { title: t("New memo", "새 메모"), "aria-label": t("New memo", "새 메모"), onclick: () => this.newMemo() }, icon("square-pen")),
          // a folder's own menu here, where it has room (the folder pane is narrow)
          this.folder !== "all" ? dropMenu(icon("more"), t("Folder menu", "폴더 메뉴"), [
            { label: t("Rename folder", "폴더 이름 바꾸기"), run: () => void this.renameFolder(this.folder) },
            "-",
            { label: t("Delete folder", "폴더 지우기"), sub: t("Its memos stay, in no folder", "메모는 남아요 (폴더 없이)"), danger: true, run: () => void this.deleteFolder(this.folder) }
          ]) : null
        ),
        el("input", {
          type: "search",
          placeholder: t("Search memos", "메모 찾기"),
          value: this.query,
          "data-key": "notes-search",
          "aria-label": t("Search memos", "메모 찾기"),
          oninput: (e) => {
            this.query = e.target.value;
            this.deps.rerender();
          }
        }),
        ...rows,
        !all.length ? el("div", { class: "empty-note" }, t("No memos", "메모 없음")) : !shown.length ? el("div", { class: "empty-note" }, t("No match", "찾는 메모 없음")) : null
      );
    }
    memoPane(memo2) {
      const folders = this.state.folders ?? [];
      const move2 = el("select", { title: t("Folder", "폴더"), "aria-label": t("Folder", "폴더"), "data-key": "notes-folder" });
      move2.append(el("option", { value: "", selected: !memo2.folder }, t("No folder", "폴더 없음")));
      for (const f of folders) move2.append(el("option", { value: f.id, selected: memo2.folder === f.id }, `📁 ${f.name}`));
      move2.addEventListener("change", () => this.mutate(memo2.id, (m2) => move2.value ? m2.folder = move2.value : delete m2.folder));
      const back = () => {
        this.open = null;
        this.writing = false;
        this.level = "list";
        this.deps.rerender();
      };
      const head = el(
        "div",
        { class: "n-head" },
        el("button", { title: t("Back to the list", "목록으로"), "aria-label": t("Back to the list", "목록으로"), onclick: back }, "‹"),
        el("strong", {}, ""),
        move2,
        el(
          "button",
          {
            title: memo2.pinned ? t("Unpin", "고정 풀기") : t("Pin to top", "위에 고정"),
            "aria-label": memo2.pinned ? t("Unpin", "고정 풀기") : t("Pin to top", "위에 고정"),
            "aria-pressed": String(!!memo2.pinned),
            onclick: () => this.mutate(memo2.id, (m2) => m2.pinned ? delete m2.pinned : m2.pinned = true)
          },
          icon("pin")
        ),
        dropMenu(icon("more"), t("Memo menu", "메모 메뉴"), [
          { label: t("💬 Send as OOC", "💬 OOC로 보내기"), run: () => (this.deps.close(), void this.deps.sendOoc(memo2.text)) },
          { label: t("Put in the input", "입력창에 넣기"), run: () => (this.deps.close(), this.deps.putInInput(memo2.text)) },
          { label: t("Open in the 📝 tab", "📝 탭에서 열기"), run: () => this.deps.openMemo(memo2.id) },
          "-",
          { label: t("Delete", "삭제"), danger: true, run: () => void this.remove(memo2) }
        ])
      );
      const title = el("input", {
        type: "text",
        class: "n-title",
        value: memo2.title ?? "",
        placeholder: t("Title (optional)", "제목 (선택)"),
        "data-key": `notes-title-${memo2.id}`,
        "aria-label": t("Memo title", "메모 제목"),
        oninput: (e) => {
          const value = e.target.value;
          this.mutate(memo2.id, (m2) => value.trim() ? m2.title = value : delete m2.title);
        }
      });
      return el("section", { class: "n-main" }, head, title, ...this.body(memo2));
    }
    body(memo2) {
      if (this.writing) {
        return memoEditor({
          text: memo2.text,
          key: `notes-${memo2.id}`,
          // the window does not redraw for memo text, so typing keeps its caret
          onText: (text7) => this.mutate(memo2.id, (m2) => m2.text = text7),
          onDone: () => {
            this.writing = false;
            this.deps.rerender();
          },
          fonts: () => this.deps.fonts()
        });
      }
      const drawn = renderMemo(memo2.text, {
        onToggle: (index) => {
          this.mutate(memo2.id, (m2) => m2.text = toggleCheck(m2.text, index));
          this.deps.rerender();
        },
        useFont: (family) => this.deps.useFont(family)
      });
      const write = () => {
        this.writing = true;
        this.deps.rerender();
      };
      return [
        el(
          "div",
          { class: "memo-body", role: "button", tabindex: "0", onclick: write, onkeydown: (e) => e.key === "Enter" && e.target === e.currentTarget && write() },
          ...drawn.length ? drawn : [el("span", { class: "empty" }, t("Empty", "빈 메모"))]
        )
      ];
    }
    /** A new memo in the open folder, where new memos go (the memo pad's setting). */
    newMemo() {
      const memo2 = newMemo("", Date.now(), ownerFor(this.state.savePlace ?? "all", this.deps.scope()));
      if (this.folder !== "all") memo2.folder = this.folder;
      this.update((s) => s.memos.push(memo2));
      this.open = memo2.id;
      this.writing = true;
      this.query = "";
      this.level = "memo";
      this.deps.rerender();
    }
    async makeFolder() {
      const name = (await this.deps.ui.input(t("Name of the new folder", "새 폴더 이름"), { okButton: t("Make", "만들기") }))?.trim();
      if (!name) return;
      const folder2 = newFolder(name);
      this.update((s) => s.folders = [...s.folders ?? [], folder2]);
      this.folder = folder2.id;
      this.open = null;
      this.level = "list";
      this.deps.rerender();
    }
    async renameFolder(id) {
      const name = (await this.deps.ui.input(t("Folder name", "폴더 이름"), { defaultValue: this.folderName(id) ?? "", okButton: t("Rename", "바꾸기") }))?.trim();
      if (!name) return;
      this.update((s) => {
        const f = s.folders?.find((x) => x.id === id);
        if (f) f.name = name.slice(0, 40);
      });
    }
    async deleteFolder(id) {
      const count = memosInFolder(this.state.memos, id).length;
      const ask = count ? t(`Delete the folder "${this.folderName(id)}"? Its ${count} ${count === 1 ? "memo stays" : "memos stay"}, in no folder.`, `「${this.folderName(id)}」 폴더를 지울까요? 메모 ${count}개는 폴더 없이 남아요.`) : t(`Delete the folder "${this.folderName(id)}"?`, `「${this.folderName(id)}」 폴더를 지울까요?`);
      if (!await confirmIn(this.deps.ui, ask)) return;
      this.update((s) => {
        s.folders = (s.folders ?? []).filter((f) => f.id !== id);
        if (!s.folders.length) delete s.folders;
        for (const m2 of s.memos) if (m2.folder === id) delete m2.folder;
      });
      if (this.folder === id) this.folder = "all";
      this.deps.rerender();
    }
    async remove(memo2) {
      if (!await confirmIn(this.deps.ui, t(`Delete "${memoLabel(memo2, 30) || t("(empty memo)", "(빈 메모)")}"?`, `「${memoLabel(memo2, 30) || "(빈 메모)"}」 메모를 지울까요?`))) return;
      this.update((s) => {
        s.memos = s.memos.filter((m2) => m2.id !== memo2.id);
        for (const b of s.boards ?? []) b.cards = b.cards.filter((c) => c.memoId !== memo2.id);
      });
      this.open = null;
      this.writing = false;
      this.level = "list";
      this.deps.rerender();
    }
  };

  // src/ui/board-view.ts
  var BOARD_VIEW_CSS = `
.board-tab { display: flex; flex-direction: column; min-height: 0; min-width: 0; height: 100%; gap: 6px; padding: 8px; position: relative; }
.board-bar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.board-bar > button, .board-bar > .menu > summary { width: auto; padding: 4px 9px; font-size: 13px; }
.board-bar select { width: auto; max-width: 12em; padding: 4px 6px; }
.board-bar input[type=color] { width: 2.2em; height: 2em; padding: 1px; cursor: pointer; }
.board-bar .sep { width: 1px; align-self: stretch; margin: 2px 2px; background: var(--d-line); }
.board-bar .zoom { min-width: 3.4em; text-align: center; font-size: 12px; color: color-mix(in srgb, var(--on-paper, var(--d-text)) 65%, transparent); }
/* phone: icons only, so the bar keeps to one or two rows */
.board-bar .lbl { display: none; }
.board-bar .grow { flex: 1; }
@media (max-width: 600px) { .board-bar .zoom { min-width: 2.6em; } }
.board-empty { margin: auto; text-align: center; color: var(--d-muted); display: grid; gap: 8px; justify-items: center; padding: 24px; }
.board-over { position: absolute; inset: 8px; z-index: 5; display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: var(--d-radius);
  background: var(--d-panel-solid); border: 1px solid var(--d-line); box-shadow: var(--d-shadow); overflow: auto; }
.board-over { color: var(--d-text); }
.board-over .over-head { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.board-over .over-head .grow { flex: 1; }
.board-over .over-head > button, .board-over .over-head > .menu > summary { width: auto; padding: 4px 9px; }
.board-over .over-head input[type=color] { width: 2.2em; height: 2em; padding: 1px; cursor: pointer; }
${BOARD_STAGE_CSS}
${BOARD_CARD_CSS}
${BOARD_PICTURES_CSS}
${BOARD_FRAME_CSS}
${BOARD_THEME_PANEL_CSS}
${NOTES_VIEW_CSS}
`;
  var MODE_KEY = "dispensa.memo-board-mode";
  function savedMode() {
    try {
      return localStorage.getItem(MODE_KEY) === "notes" ? "notes" : "board";
    } catch {
      return "board";
    }
  }
  var BoardView = class {
    constructor(deps) {
      this.deps = deps;
      this.notes = new NotesView(deps);
      this.ctx = {
        deps,
        state: () => this.state,
        boards: () => this.boards,
        board: () => this.board,
        updateBoard: (fn) => this.updateBoard(fn),
        mutateMemo: (id, fn) => this.mutateMemo(id, fn),
        grid: () => themeById(this.board?.theme?.id).grid,
        openCard: (id) => this.openCard(id),
        takeOff: (id) => this.takeOff(id),
        addMemos: (slot) => this.addMemos(slot),
        pickMagnet: (slot) => this.openPictures("magnet", slot)
      };
      this.stage = new BoardStage(this.ctx);
      this.pictures = new BoardPictures(this.ctx, () => this.stage.centerPoint());
    }
    boardId = null;
    /** The memo id of the card shown large. */
    zoomed = null;
    writing = false;
    theming = false;
    ctx;
    stage;
    pictures;
    notes;
    mode = savedMode();
    get state() {
      return this.deps.store.value;
    }
    get boards() {
      return this.state.boards ?? [];
    }
    get board() {
      const list = this.boards;
      return list.find((b) => b.id === this.boardId) ?? list[0] ?? null;
    }
    updateBoard(fn) {
      const id = this.board?.id;
      if (!id) return;
      this.deps.store.update((s) => {
        const b = s.boards?.find((x) => x.id === id);
        if (b) fn(b);
      });
    }
    mutateMemo(id, fn) {
      this.deps.store.update((s) => {
        const m2 = s.memos.find((x) => x.id === id);
        if (m2) fn(m2);
      });
    }
    show(boardId) {
      this.boardId = boardId;
      this.zoomed = null;
      this.stage.putDown();
    }
    /** The button that changes the tab's look (boards ↔ notebook), kept per browser. */
    modeButton() {
      const notes = this.mode === "notes";
      return el(
        "button",
        {
          title: notes ? t("Show as boards", "보드로 보기") : t("Show as a notebook: folders and memos", "메모장으로 보기: 폴더와 메모"),
          "data-key": "board-mode",
          onclick: () => {
            this.mode = notes ? "board" : "notes";
            try {
              localStorage.setItem(MODE_KEY, this.mode);
            } catch {
            }
            this.stage.putDown();
            this.deps.rerender();
          }
        },
        icon(notes ? "layout-dashboard" : "notebook-pen"),
        el("span", { class: "lbl" }, notes ? t("Boards", "보드") : t("Notebook", "메모장"))
      );
    }
    render() {
      if (this.mode === "notes") {
        this.stage.forget();
        return el("div", { class: "board-tab notes-mode" }, el("div", { class: "board-bar" }, this.modeButton()), this.notes.render());
      }
      const board = this.board;
      if (board) this.boardId = board.id;
      const tab = el("div", { class: "board-tab" }, this.bar(board));
      if (!board) {
        tab.append(
          el(
            "div",
            { class: "board-empty" },
            el("div", {}, t("No boards", "보드 없음")),
            el("button", { onclick: () => void this.makeBoard() }, icon("plus"), t("New board", "새 보드"))
          )
        );
        return tab;
      }
      dressBoard(tab, board, (family) => this.deps.useFont(family));
      if (board.layout === "frame") {
        this.stage.forget();
        tab.append(frameView(this.ctx, board));
      } else tab.append(boardHead(this.ctx, board), this.stage.render(board));
      if (this.theming) tab.append(themePanel(this.ctx, board, () => (this.theming = false, this.deps.rerender())));
      else if (this.pictures.isOpen) tab.append(this.pictures.panel());
      else if (this.zoomed) {
        const card = board.cards.find((c) => c.memoId === this.zoomed);
        const memo2 = this.state.memos.find((m2) => m2.id === this.zoomed);
        if (card && memo2)
          tab.append(
            zoomPanel(this.ctx, card, memo2, {
              writing: this.writing,
              write: (on) => (this.writing = on, this.deps.rerender()),
              close: () => (this.zoomed = null, this.writing = false, this.deps.rerender())
            })
          );
        else this.zoomed = null;
      }
      return tab;
    }
    // ── the bar above the board ──
    bar(board) {
      const bar = el("div", { class: "board-bar" }, this.modeButton(), el("span", { class: "sep" }));
      if (this.boards.length) {
        const select2 = el("select", { "aria-label": t("Board", "보드"), title: t("Board", "보드"), "data-key": "board-select" });
        for (const b of this.boards) select2.append(el("option", { value: b.id, selected: b.id === board?.id }, `📋 ${b.name}`));
        select2.addEventListener("change", () => {
          this.show(select2.value);
          this.stage.resetView();
          this.deps.rerender();
        });
        bar.append(select2);
      }
      bar.append(el("button", { title: t("New board", "새 보드"), "aria-label": t("New board", "새 보드"), onclick: () => void this.makeBoard() }, icon("plus")));
      if (!board) return bar;
      const frame = board.layout === "frame";
      bar.append(
        dropMenu(bold(icon("more")), t("Board menu", "보드 메뉴"), [
          { label: t("Rename", "이름 바꾸기"), run: () => void this.renameBoard() },
          { label: t("🖼 Background picture", "🖼 배경 그림"), run: () => this.openPictures("background") },
          { label: t("No background picture", "배경 그림 빼기"), run: () => this.updateBoard((b) => delete b.background) },
          board.numbers === false ? { label: t("Number the cards", "카드 번호 붙이기"), sub: t("01, 02 … in the order the board is sent", "보내는 순서대로 01, 02 …"), run: () => this.updateBoard((b) => delete b.numbers) } : { label: t("No card numbers", "카드 번호 빼기"), run: () => this.updateBoard((b) => b.numbers = false) },
          "-",
          { label: t("Delete board", "보드 지우기"), sub: t("Its memos stay", "메모는 남아요"), danger: true, run: () => void this.deleteBoard() }
        ]),
        el("button", { title: t("Theme and colors", "테마와 색"), onclick: () => this.openTheme() }, icon("palette"), el("span", { class: "lbl" }, t("Theme", "테마"))),
        el(
          "button",
          {
            title: frame ? t("Lay cards out freely", "카드를 자유롭게 놓기") : t("Cut the board into sections", "보드를 구획으로 나누기"),
            "aria-pressed": String(frame),
            onclick: () => this.toggleLayout()
          },
          icon(frame ? "columns-3" : "layout-grid"),
          el("span", { class: "lbl" }, frame ? t("Sections", "구획 배치") : t("Free", "자유 배치"))
        ),
        ...frame ? [columnsSelect(this.ctx, board)] : [],
        el("span", { class: "sep" }),
        el("button", { title: t("Put memos on the board", "메모를 보드에 놓기"), onclick: () => void this.addMemos() }, icon("notebook-pen"), el("span", { class: "lbl" }, t("Memos", "메모 가져오기"))),
        el("button", { title: t("Write a new memo on the board", "보드에 새 메모 쓰기"), onclick: () => this.newCard() }, icon("square-pen"), el("span", { class: "lbl" }, t("New memo", "새 메모"))),
        el("button", { title: t("Stick a picture on the board", "보드에 그림 붙이기"), onclick: () => this.openPictures("magnet") }, icon("magnet"), el("span", { class: "lbl" }, t("Magnet", "마그넷"))),
        el("span", { class: "sep" }),
        ...frame ? [] : this.stage.zoomButtons(),
        el("span", { class: "sep" }),
        dropMenu(el("span", {}, icon("message-square"), el("span", { class: "lbl" }, t(" Send", " 보내기"))), t("Send the board", "보드 보내기"), [
          { label: t("💬 Send as OOC", "💬 OOC로 보내기"), sub: t("Every card, in reading order", "모든 카드를 읽는 순서대로"), run: () => this.sendBoard("ooc") },
          { label: t("Put in the input", "입력창에 넣기"), run: () => this.sendBoard("input") },
          { label: t("🌟 Make page", "🌟 페이지 만들기"), run: () => this.sendBoard("page") },
          { label: t("🖼 Run a QR inside the Gallery", "🖼 갤러리 내부에서 QR 실행"), run: () => this.sendBoard("gallery") }
        ]),
        el("span", { class: "grow" }),
        el("button", { title: t("The Gallery", "갤러리"), "aria-label": t("The Gallery", "갤러리"), onclick: () => this.deps.openGallery() }, icon("images"))
      );
      return bar;
    }
    // ── what opens over the board ──
    openCard(memoId) {
      this.zoomed = memoId;
      this.writing = false;
      this.stage.putDown();
      this.deps.rerender();
    }
    openTheme() {
      this.theming = true;
      this.pictures.close();
      this.zoomed = null;
      this.deps.rerender();
    }
    openPictures(kind, slot = null) {
      this.theming = false;
      this.zoomed = null;
      this.pictures.open(kind, slot);
    }
    toggleLayout() {
      this.stage.putDown();
      this.updateBoard((b) => {
        if (b.layout === "frame") delete b.layout;
        else {
          b.layout = "frame";
          arrangeFrame(b);
        }
      });
    }
    // ── boards and cards ──
    async makeBoard() {
      const name = (await this.deps.ui.input(t("Name of the new board", "새 보드 이름"), { okButton: t("Make", "만들기") }))?.trim();
      if (!name) return;
      const board = newBoard(name.slice(0, 60));
      this.deps.store.update((s) => s.boards = [...s.boards ?? [], board]);
      this.show(board.id);
      this.stage.resetView();
      this.deps.rerender();
    }
    async renameBoard() {
      const board = this.board;
      if (!board) return;
      const name = (await this.deps.ui.input(t("New name of the board", "보드의 새 이름"), { defaultValue: board.name, okButton: t("OK", "확인") }))?.trim();
      if (name) this.updateBoard((b) => b.name = name.slice(0, 60));
    }
    async deleteBoard() {
      const board = this.board;
      if (!board) return;
      if (!await confirmIn(this.deps.ui, t(`Delete the board "${board.name}"? Its memos stay in the memo pad.`, `"${board.name}" 보드를 지울까요? 메모는 메모장에 그대로 남아요.`))) return;
      this.deps.store.update((s) => {
        s.boards = (s.boards ?? []).filter((b) => b.id !== board.id);
        if (!s.boards.length) delete s.boards;
      });
      this.boardId = null;
      this.deps.rerender();
    }
    async addMemos(slot) {
      const board = this.board;
      if (!board) return;
      const on = new Set(board.cards.map((c) => c.memoId));
      const memos = this.state.memos.filter((m2) => !on.has(m2.id));
      if (!memos.length) {
        this.deps.ui.toast(
          this.state.memos.length ? t("Every memo is on this board already.", "모든 메모가 이미 이 보드에 있어요.") : t("No memos yet: write one with New memo.", "아직 메모가 없어요. 새 메모로 써 보세요."),
          "info",
          { title: "📋" }
        );
        return;
      }
      const labels = memos.map((m2, i) => `${i + 1}. ${m2.pinned ? "📌 " : ""}${memoLabel(m2, 60) || t("(empty memo)", "(빈 메모)")}`);
      const picked2 = await this.deps.ui.pick?.(t("Memos to put on the board", "보드에 놓을 메모"), labels, { multiple: true, placeholder: t("Search", "찾기") }) ?? [];
      const ids = picked2.map((l) => memos[labels.indexOf(l)]?.id).filter((x) => !!x);
      if (!ids.length) return;
      const at = this.stage.centerPoint();
      this.updateBoard((b) => {
        placeMemos(b, ids, { x: Math.max(0, at.x - 200), y: Math.max(0, at.y - 60) });
        if (b.layout !== "frame") return;
        const first = b.cards.find((c) => c.memoId === ids[0]);
        if (first && slot) first.cell = { ...slot, w: 1, h: 1 };
        arrangeFrame(b);
      });
    }
    newCard() {
      const memo2 = newMemo("", Date.now(), ownerFor(this.state.savePlace ?? "all", this.deps.scope()));
      const at = this.stage.centerPoint();
      this.deps.store.update((s) => {
        s.memos.push(memo2);
        const b = s.boards?.find((x) => x.id === this.board?.id);
        if (!b) return;
        placeMemos(b, [memo2.id], { x: Math.max(0, at.x - CARD_W.default / 2), y: Math.max(0, at.y) });
        if (b.layout === "frame") arrangeFrame(b);
      });
      this.zoomed = memo2.id;
      this.writing = true;
      this.deps.rerender();
    }
    takeOff(memoId) {
      this.stage.putDown();
      this.updateBoard((b) => b.cards = b.cards.filter((c) => c.memoId !== memoId));
    }
    sendBoard(how) {
      const board = this.board;
      if (!board) return;
      const text7 = boardText(board, this.state.memos);
      if (!text7) {
        this.deps.ui.toast(t("The board has no memos with text.", "보드에 글이 있는 메모가 없어요."), "info", { title: "📋" });
        return;
      }
      if (how === "gallery") return this.deps.runForGallery(text7, board.name);
      this.deps.close();
      if (how === "ooc") void this.deps.sendOoc(text7);
      else if (how === "input") this.deps.putInInput(text7);
      else void this.deps.makePage(text7);
    }
  };
  function bold(svg2) {
    svg2.setAttribute("stroke-width", "3");
    return svg2;
  }

  // src/visz/defaults.ts
  var DEFAULT_OOC_TEMPLATE = "<System>\n{{내용}}\n</System>";
  var CONTINUE_TEMPLATE = "<System>\nThe HTML you wrote earlier was cut off before it was finished. This is everything written so far:\n```html\n{{앞부분}}\n```\nContinue the code from EXACTLY where it stops. Output ONLY the remaining code: do not repeat anything already written, do not restart the document, do not explain, and do not wrap it in a Markdown code block. Close every open tag and end with </html>.\n</System>";
  var DEFAULT_WRAPPERS = [
    {
      id: "system",
      get name() {
        return t("<System> block", "<System> 블록");
      },
      template: DEFAULT_OOC_TEMPLATE
    },
    { id: "ooc-star", name: "*{OOC: …}*", template: "*{OOC: {{내용}}}*" },
    {
      id: "raw",
      get name() {
        return t("No wrapper", "틀 없음");
      },
      template: "{{내용}}"
    }
  ];

  // src/visz/superviz.ts
  var SUPERVIZ = {
    "id": "superviz",
    "name": "비주얼라이저 (기본)",
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

  // src/visz/model.ts
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
  var VISZ_OUTPUTS = {
    get viewer() {
      return t("Viewer", "보기 창");
    },
    get chat() {
      return t("Current chat", "현재 채팅");
    },
    get gallery() {
      return t("Gallery", "갤러리");
    }
  };
  var DEFAULT_SETTINGS = {
    language: "English",
    // Marinara's security policy stops scripts in pages: full only when Fornello runs them
    viszMode: "auto",
    viszOutput: "viewer",
    collect: "all",
    htmlOnly: true,
    // like the user's SillyTavern QRs: /gen with the request, then /sendas the result as the character
    oocMode: "hidden",
    wrapperId: DEFAULT_WRAPPERS[0].id,
    connectionId: "",
    galleryConnectionId: "",
    galleryPresetId: "",
    sendPreset: true,
    showButton: true,
    dockIcon: "🍰",
    allowExternal: true,
    maxFrameHeight: 1600
  };
  function defaultPreset() {
    return { ...structuredClone(SUPERVIZ), known: SUPERVIZ.chunks.map((c) => c.id) };
  }
  function defaultViszState() {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      wrappers: structuredClone(DEFAULT_WRAPPERS),
      preset: defaultPreset()
    };
  }
  var str8 = (v, fallback = "") => typeof v === "string" ? v : fallback;
  var pick = (v, allowed, fallback) => allowed.includes(v) ? v : fallback;
  function normalizeChunk(raw) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw;
    return {
      id: str8(r.id) || newId("chunk"),
      name: str8(r.name) || t("Chunk", "조각"),
      mode: pick(r.mode, ["all", "full", "lite"], "all"),
      enabled: r.enabled !== false,
      text: str8(r.text),
      ...r.needs === "fornello" ? { needs: "fornello" } : {}
    };
  }
  function withNewBuiltins(chunks, known) {
    const builtins = defaultPreset().chunks;
    const seen = new Set(known ?? builtins.map((b) => b.id));
    const out = [...chunks];
    builtins.forEach((b, i) => {
      if (seen.has(b.id)) return;
      const next = builtins.slice(i + 1).find((x) => out.some((c) => c.id === x.id));
      const at = next ? out.findIndex((c) => c.id === next.id) : out.length;
      out.splice(at, 0, structuredClone(b));
    });
    return { chunks: out, known: builtins.map((b) => b.id) };
  }
  function normalizeViszState(raw) {
    const base = defaultViszState();
    if (!raw || typeof raw !== "object") return base;
    const r = raw;
    const wrappers = Array.isArray(r.wrappers) ? normalizeWrappers(r.wrappers) : base.wrappers;
    return {
      version: 1,
      settings: normalizeSettings(r.settings && typeof r.settings === "object" ? r.settings : {}),
      wrappers: wrappers.length ? wrappers : base.wrappers,
      preset: r.preset && typeof r.preset === "object" ? normalizePreset(r.preset, base.preset) : base.preset
    };
  }
  function normalizeSettings(s) {
    return {
      language: str8(s.language) || DEFAULT_SETTINGS.language,
      // auto: full pages with Fornello, light without; "lite" (the "Full pages" switch off) stays light
      viszMode: s.viszMode === "lite" ? "lite" : "auto",
      viszOutput: pick(s.viszOutput, ["viewer", "chat", "gallery"], DEFAULT_SETTINGS.viszOutput),
      // saved before there was a choice: "chat pages to the Gallery" off kept only what the Gallery itself made
      collect: pick(s.collect, ["chat", "gallery", "all"], s.autoArchive === false ? "gallery" : DEFAULT_SETTINGS.collect),
      htmlOnly: typeof s.htmlOnly === "boolean" ? s.htmlOnly : DEFAULT_SETTINGS.htmlOnly,
      oocMode: pick(s.oocMode, Object.keys(OOC_MODES), DEFAULT_SETTINGS.oocMode),
      wrapperId: str8(s.wrapperId) || DEFAULT_SETTINGS.wrapperId,
      connectionId: str8(s.connectionId),
      galleryConnectionId: str8(s.galleryConnectionId),
      galleryPresetId: str8(s.galleryPresetId),
      sendPreset: typeof s.sendPreset === "boolean" ? s.sendPreset : DEFAULT_SETTINGS.sendPreset,
      showButton: typeof s.showButton === "boolean" ? s.showButton : DEFAULT_SETTINGS.showButton,
      dockIcon: str8(s.dockIcon).trim() || DEFAULT_SETTINGS.dockIcon,
      allowExternal: typeof s.allowExternal === "boolean" ? s.allowExternal : DEFAULT_SETTINGS.allowExternal,
      maxFrameHeight: Number(s.maxFrameHeight) >= 200 ? Number(s.maxFrameHeight) : DEFAULT_SETTINGS.maxFrameHeight
    };
  }
  function normalizeWrappers(raw) {
    return raw.filter((w) => !!w && typeof w === "object").map((w) => ({ id: str8(w.id) || newId("wrap"), name: str8(w.name) || t("Wrapper", "틀"), template: str8(w.template) || "{{내용}}" }));
  }
  function normalizePreset(p, base) {
    const stored = Array.isArray(p.chunks) ? p.chunks.map(normalizeChunk).filter((c) => !!c) : null;
    const known = Array.isArray(p.known) ? p.known.map(String) : null;
    const { chunks, known: offered } = stored ? withNewBuiltins(stored, known) : { chunks: base.chunks, known: base.known ?? [] };
    return { id: str8(p.id) || base.id, name: str8(p.name) || base.name, wrap: p.wrap !== false, chunks, known: offered };
  }
  function viszOptions(state) {
    const s = state.settings;
    return {
      oocMode: s.oocMode,
      viszOutput: s.viszOutput,
      wrapper: state.wrappers.find((w) => w.id === s.wrapperId) ?? state.wrappers[0] ?? DEFAULT_WRAPPERS[0],
      connectionId: s.connectionId
    };
  }

  // src/ui/visz-settings.ts
  var VISZ_SETTINGS_CSS = `
.cards { display: flex; flex-direction: column; gap: 12px; }
.cards .card { border: 1px solid var(--d-line); border-radius: var(--d-radius); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.cards .chunk { border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); padding: 6px 8px; display: flex; flex-direction: column; gap: 6px; transition: opacity .15s ease; }
.cards .chunk.off { opacity: .55; }
.cards textarea.short { min-height: 90px; }
.cards .icon-input { width: 3.4em !important; min-width: 0 !important; text-align: center; }
.cards details.more > summary { cursor: pointer; color: var(--d-muted); font-size: 12px; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px; }
.cards details.more > summary::before { content: "▸"; transition: transform .15s ease; }
.cards details.more[open] > summary::before { transform: rotate(90deg); }
.cards .field-h { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--d-muted); }
`;
  function select(key2, entries, value, onChange, label = "") {
    return el(
      "select",
      { "data-key": key2, "aria-label": label || void 0, onchange: (e) => onChange(e.target.value) },
      ...entries.map(([v, text7]) => el("option", { value: v, selected: v === value }, text7))
    );
  }
  var MODE_LABEL = () => ({ all: t("Always", "항상"), full: t("Full only", "풀 모드만"), lite: t("Light only", "라이트 모드만") });
  var CHUNK_NAMES_EN = {
    superviz: "Visualizer (default)",
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
  var VISZ_HELP = {
    get viszOutput() {
      return t("· Viewer: a window above the Dock\n· Current chat: straight in as a character message\n· Gallery: kept in the Gallery only", "· 보기 창: Dock 위 작은 창\n· 현재 채팅: 바로 캐릭터 메시지로\n· 갤러리: 갤러리에만 저장");
    },
    get full() {
      return t("With Fornello, pages with scripts. Off: HTML and CSS only", "Fornello가 있으면 스크립트가 도는 페이지. 끄면 HTML·CSS만");
    },
    get external() {
      return t("Pages may load fonts, images and libraries from the web", "페이지가 인터넷의 글꼴·그림·라이브러리를 불러옴");
    },
    get oocMode() {
      return t("· Get the result: the AI's answer as a character message\n· Steer the next reply: Marinara's /guided\n· Send as me: as your message\n· Put in the input: edit, then send", "· 결과물 받기: AI의 답을 캐릭터 메시지로\n· 전개에 반영하기: 마리나라 /guided\n· 직접 보내기: 내 메시지로\n· 입력창에 넣기: 고친 뒤 직접 전송");
    },
    get wrapper() {
      return t("Put around the request so the AI reads it as a request, not an RP line", "AI가 RP 대사가 아닌 요청으로 알아듣게 앞뒤에 붙는 문구");
    },
    get sendPreset() {
      return t("Pages and OOC results get the chat's RP preset too (cards, chat, lorebooks and summary always go)", "페이지·OOC 결과물에 RP 프리셋도 보냄 (카드·채팅·로어북·서사 요약은 늘 들어감)");
    },
    get chunkText() {
      return t("{{주제}} becomes the request, {{언어}} the result language", "{{주제}} 자리에 요청, {{언어}} 자리에 결과 언어");
    },
    get wrappers() {
      return t("{{내용}}: the OOC · {{언어}}: the result language", "{{내용}}: OOC · {{언어}}: 결과 언어");
    },
    get backup() {
      return t("Export / Import: the prompt, wrappers and defaults in one file", "내보내기·가져오기: 본체·틀·기본값을 파일 하나로");
    }
  };
  var ViszSettingsView = class {
    constructor(deps) {
      this.deps = deps;
    }
    openChunk = null;
    connections = null;
    presets = null;
    get state() {
      return this.deps.store.value;
    }
    update(fn) {
      this.deps.store.update(fn);
    }
    /** The prompt presets to choose from ("" = the chat's own); loaded once, then redrawn. */
    presetEntries() {
      if (!this.presets) {
        this.presets = [];
        void this.deps.presets().then((list) => {
          this.presets = list;
          this.deps.rerender();
        }).catch(() => void 0);
      }
      return [["", t("The chat's own", "채팅의 프리셋")], ...this.presets.map((p) => [p.id, p.name])];
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
    /** The Library's Visualizer panel: its defaults with backup, then the prompt's chunks. */
    render() {
      return el("div", { class: "cards visz-settings" }, this.defaults(), this.presetCard());
    }
    /**
     * The AI Dispensa calls itself — pages, OOC results and Gallery runs (QRs' /gen go to the chat's
     * own connection): shown from the window's header.
     */
    commonAi() {
      const s = this.state.settings;
      const set = (fn) => this.update((st) => fn(st.settings));
      return el(
        "div",
        { class: "card" },
        section(
          "AI",
          t("A QR's /gen uses the chat's own connection", "QR의 /gen은 채팅 연결을 씀"),
          [],
          setting(t("AI connection", "AI 연결"), select("visz-connection", this.connectionEntries(t("Same as the chat", "채팅과 같은 연결")), s.connectionId, (v) => set((x) => x.connectionId = v), t("AI connection", "AI 연결"))),
          setting(t("Gallery runs' AI", "갤러리 실행용 AI"), select("visz-gallery-connection", this.connectionEntries(t("Same as above", "위와 같은 연결")), s.galleryConnectionId, (v) => set((x) => x.galleryConnectionId = v), t("Gallery runs' AI", "갤러리 실행용 AI")), t("For ▶ in the Gallery", "갤러리의 ▶용")),
          setting(t("RP preset too", "RP 프리셋 같이 보내기"), toggle(s.sendPreset, (v) => set((x) => x.sendPreset = v), t("RP preset too", "RP 프리셋 같이 보내기"), "visz-send-preset"), VISZ_HELP.sendPreset),
          s.sendPreset ? setting(
            t("Gallery runs' preset", "갤러리 실행 프리셋"),
            select("visz-gallery-preset", this.presetEntries(), s.galleryPresetId, (v) => set((x) => x.galleryPresetId = v), t("Gallery runs' preset", "갤러리 실행 프리셋")),
            t(
              "Gallery runs and their pages are made with this preset. In a conversation chat Marinara takes only a preset's conversation prompt (its sections are for roleplay chats): fill that in for an RP style there",
              "갤러리 실행과 그 페이지는 이 프리셋으로 만들어요. 대화(conversation) 채팅에서는 마리나라가 프리셋의 대화용 프롬프트만 써요(섹션은 롤플레이 채팅용). 거기서 RP 문체를 원하면 그 칸을 채워 주세요"
            )
          ) : null
        )
      );
    }
    /** How the memo pad sends OOC; shown in the memo tab. */
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
            setting(t("How to send", "보내는 방식"), select("visz-ooc-mode", Object.entries(OOC_MODES), s.oocMode, (v) => set((x) => x.oocMode = v), t("How to send", "보내는 방식")), VISZ_HELP.oocMode),
            setting(t("Wrapper", "틀"), select("visz-wrapper", wrappers, s.wrapperId, (v) => set((x) => x.wrapperId = v), t("Wrapper", "틀")), VISZ_HELP.wrapper)
          )
        ),
        this.wrapperCard()
      ];
    }
    /** The 🍰 bubble's row, for the window's ⚙ settings. */
    dockBubble() {
      const s = this.state.settings;
      const set = (fn) => this.update((st) => fn(st.settings));
      return setting(
        t("🍰 Visualizer bubble", "🍰 비주얼라이저 버블"),
        [
          el("input", { type: "text", class: "icon-input", value: s.dockIcon, "data-key": "visz-dock-icon", maxlength: "8", "aria-label": t("Bubble icon", "버블 아이콘"), oninput: (e) => set((x) => x.dockIcon = e.target.value.trim() || "🍰") }),
          toggle(s.showButton, (v) => set((x) => x.showButton = v), t("Show Dock bubble", "Dock 버블 보이기"), "visz-show")
        ]
      );
    }
    defaults() {
      const s = this.state.settings;
      const set = (fn) => this.update((st) => fn(st.settings));
      return el(
        "div",
        { class: "card" },
        section(
          t("Visualizer", "비주얼라이저"),
          VISZ_HELP.backup,
          [el("button", { onclick: () => this.exportJson() }, icon("upload"), t("Export", "내보내기")), el("button", { onclick: () => this.importJson() }, icon("download"), t("Import", "가져오기"))],
          setting(t("Result language", "결과 언어"), el("input", { type: "text", value: s.language, "data-key": "visz-language", "aria-label": t("Result language", "결과 언어"), oninput: (e) => set((x) => x.language = e.target.value) })),
          setting(t("Result goes to", "결과물 보낼 곳"), select("visz-output", Object.entries(VISZ_OUTPUTS), s.viszOutput, (v) => set((x) => x.viszOutput = v), t("Result goes to", "결과물 보낼 곳")), VISZ_HELP.viszOutput),
          setting(t("Full pages", "풀 페이지"), toggle(s.viszMode !== "lite", (v) => set((x) => x.viszMode = v ? "auto" : "lite"), t("Full pages", "풀 페이지"), "visz-full"), VISZ_HELP.full),
          setting(t("Allow outside resources", "외부 자료 불러오기 허용"), toggle(s.allowExternal, (v) => set((x) => x.allowExternal = v), t("Allow outside resources", "외부 자료 불러오기 허용"), "visz-external"), VISZ_HELP.external)
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
                el("span", { class: "field-h" }, t("Used when", "쓰는 때")),
                select(`chunk-mode-${chunk.id}`, Object.entries(modeLabel), chunk.mode, (v) => mutateChunk(chunk.id, (c) => c.mode = v), t("Used when", "쓰는 때"))
              )
            ),
            el("div", { class: "field-h" }, t("Text", "내용"), helpTip(VISZ_HELP.chunkText, t("Text", "내용"))),
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
            const chunk = { id: newId("chunk"), name: t("New chunk", "새 조각"), mode: "all", enabled: true, text: "" };
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
          onclick: async () => {
            if (!await this.deps.ui.popup(t("Reset the prompt to the default? Your edits and added chunks will be lost.", "본체를 기본값으로 되돌릴까요? 고친 내용과 추가한 조각이 사라져요."), { okButton: t("Reset", "되돌리기"), cancelButton: t("Cancel", "취소") })) return;
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
          void 0,
          [add, reset],
          setting(t("Wrap in <System>", "<System>으로 감싸기"), toggle(preset.wrap, (v) => this.update((s) => s.preset.wrap = v), t("Wrap in <System>", "<System>으로 감싸기"))),
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
      const add = el("button", { onclick: () => this.update((s) => s.wrappers.push({ id: newId("wrap"), name: t("New wrapper", "새 틀"), template: "{{내용}}" })) }, icon("plus"), t("Add", "추가"));
      return el(
        "div",
        { class: "card" },
        section(
          t("💬 Wrappers", "💬 틀"),
          VISZ_HELP.wrappers,
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
                el("input", { type: "text", class: "grow", value: w.name, "data-key": `wrap-name-${w.id}`, "aria-label": t("Wrapper name", "틀 이름"), oninput: (e) => this.update((s) => s.wrappers.find((x) => x.id === w.id).name = e.target.value) }),
                el("button", { class: "icon danger", title: t("Delete", "지우기"), "aria-label": t("Delete", "지우기"), disabled: wrappers.length <= 1, onclick: () => this.update((s) => s.wrappers = s.wrappers.filter((x) => x.id !== w.id)) }, icon("trash"))
              ),
              ta
            );
          })
        )
      );
    }
    exportJson() {
      downloadJson({ format: "dispensa-visz", ...this.state }, "dispensa.visz.json");
    }
    importJson() {
      pickFiles(async ([file]) => {
        try {
          let json2 = {};
          try {
            json2 = JSON.parse(await file.text());
          } catch {
          }
          if (json2?.format !== "dispensa-visz") throw new Error(t("Not a Dispensa Visualizer file (.visz.json).", "Dispensa 비주얼라이저 파일(.visz.json)이 아니에요."));
          const incoming = normalizeViszState(json2);
          if (!await this.deps.ui.popup(t("Replace the prompt, wrappers and defaults with this file?", "본체·틀·기본값을 이 파일로 바꿀까요?"), { okButton: t("Replace", "바꾸기"), cancelButton: t("Cancel", "취소") })) return;
          this.update((s) => Object.assign(s, incoming));
          this.deps.ui.toast(t("Imported the Visualizer settings.", "비주얼라이저 설정을 가져왔어요."), "success");
        } catch (e) {
          this.deps.ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("Import", "가져오기") });
        }
      }, { json: true });
    }
  };

  // src/ui/manager/import-export.ts
  var QrFiles = class {
    constructor(ctx) {
      this.ctx = ctx;
    }
    get deps() {
      return this.ctx.deps;
    }
    exportSet(set) {
      downloadJson(exportMarinara(set, this.ctx.setName), `${set.name || "qr-set"}.mqr.json`);
    }
    exportItem(item) {
      downloadJson(exportMarinaraItem(item, this.ctx.setName), `${item.label || "qr"}.mqr.json`);
    }
    /** Ticked QRs as one set, "Selected QRs". */
    exportItems(items) {
      const set = { ...newSet(t("Selected QRs", "선택한 QR")), items };
      downloadJson(exportMarinara(set, this.ctx.setName), `${set.name}.mqr.json`);
    }
    async copyItem(item, cut, set) {
      const { ui } = this.deps;
      const data = JSON.stringify(exportMarinaraItem(item, this.ctx.setName), null, 2);
      await (ui.copy?.(data) ?? navigator.clipboard.writeText(data));
      if (cut) this.ctx.removeItem(set, item);
      ui.toast(cut ? t(`Cut "${item.label}". Click Paste in the set you want.`, `"${item.label}"을 잘라 냈어요. 원하는 세트에서 붙여넣기를 누르세요.`) : t(`Copied "${item.label}".`, `"${item.label}"을 복사했어요.`), "success");
    }
    async paste(set) {
      const { ui, registry: registry2 } = this.deps;
      const text7 = (await (ui.paste?.() ?? navigator.clipboard.readText())).trim();
      if (!text7) return;
      let report = null;
      try {
        const json2 = JSON.parse(text7);
        const own = json2?.dispensa;
        report = own?.format === MQR_ITEM_FORMAT ? importMarinara(own, registry2) : importAny(json2, registry2);
      } catch {
      }
      if (report && report.sets.length) {
        this.addReport(report, set);
        ui.toast(t(`Pasted ${report.sets.length} sets.`, `세트 ${report.sets.length}개를 붙여 넣었어요.`), "success");
        return;
      }
      const items = report?.items.length ? report.items : [newItem(oneLine(text7, 14) || "QR", text7, "marinara")];
      this.addReport(report ?? { sets: [], items, links: [], total: items.length, unsupported: [], parseErrors: [], converted: 0, keptSillyTavern: [] }, set, items);
      this.ctx.selectedItem = items[0].id;
      this.ctx.render();
      ui.toast(t(`Pasted ${items.length} QRs.`, `QR ${items.length}개를 붙여 넣었어요.`), "success");
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
          this.ctx.selectedSet = target.id;
        }
        missing = resolveLinks(st, report.links);
      });
      if (missing.length) this.deps.ui.toast(t(`Couldn't find the sets used as sub menus: ${missing.join(", ")}`, `하위 메뉴로 쓰던 세트를 찾지 못했어요: ${missing.join(", ")}`), "warning");
    }
    /** A QR file another extension hands over (Fornello's card bundles): its sets join the Library. How many QRs came in. */
    importJson(json2, name, characterId) {
      const report = importAny(json2, this.deps.registry, name.replace(/\.(m?qr\.)?json$/i, ""));
      if (!report.sets.length && !report.items.length) return 0;
      if (characterId) {
        const st = this.ctx.state;
        const theirs = new Set(st.charSets?.[characterId] ?? []);
        if (report.sets.length && report.sets.every((s) => st.sets.some((x) => x.name === s.name && theirs.has(x.id)))) return report.total;
        for (const s of report.sets) s.enabled = false;
      }
      this.addReport(report, this.ctx.state.sets.find((s) => s.id === this.ctx.selectedSet));
      if (characterId) this.deps.store.update((st) => report.sets.forEach((s) => setForCharacter(st, characterId, s.id, true)));
      if (report.sets.length) this.ctx.selectedSet = report.sets[0].id;
      this.ctx.render();
      return report.total;
    }
    /** Single QRs go into the open set. */
    importFile() {
      pickFiles((files) => void this.importFiles(files), { json: true, multiple: true });
    }
    async importFiles(files) {
      const { ui, registry: registry2 } = this.deps;
      let added2 = 0;
      let converted = 0;
      const kept = [];
      const problems = [];
      for (const file of files) {
        try {
          const json2 = JSON.parse(await file.text());
          const report = importAny(json2, registry2, file.name.replace(/\.(m?qr\.)?json$/i, ""));
          if (!report.sets.length && !report.items.length) {
            problems.push(t(`${file.name}: not a QR file.`, `${file.name}: QR 파일이 아니에요.`));
            continue;
          }
          this.addReport(report, this.ctx.state.sets.find((s) => s.id === this.ctx.selectedSet));
          if (report.sets.length) this.ctx.selectedSet = report.sets[0].id;
          added2 += report.total;
          converted += report.converted;
          for (const k of report.keptSillyTavern) kept.push(`${k.label}: ${k.reasons.join(" / ")}`);
          for (const u of report.unsupported) problems.push(`${u.label}: /${u.commands.join(", /")}`);
          for (const p of report.parseErrors) problems.push(t(`${p.label}: syntax error (${p.error})`, `${p.label}: 문법 오류 (${p.error})`));
        } catch (e) {
          problems.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      this.ctx.render();
      const summary = [
        t(`Imported ${added2} QRs.`, `QR ${added2}개를 가져왔어요.`),
        converted ? t(`${converted} were converted to count from #1.`, `${converted}개는 1번부터 세도록 바꿨어요.`) : "",
        kept.length ? t(`${kept.length} still count messages from #0.`, `${kept.length}개는 메시지를 0번부터 세요.`) : ""
      ].filter(Boolean).join(" ");
      ui.toast(summary, problems.length || kept.length ? "warning" : "success");
      if (problems.length || kept.length) {
        const parts3 = [];
        if (kept.length) parts3.push(`${t("<b>QRs counting messages from #0</b> (couldn't convert them)", "<b>메시지를 0번부터 세는 QR</b> (자동 변환 실패)")}<br>${kept.map(escapeHtml).join("<br>")}`);
        if (problems.length) parts3.push(`${t("<b>QRs with commands not supported yet</b>", "<b>아직 지원하지 않는 명령이 들어 있는 QR</b>")}<br>${problems.map(escapeHtml).join("<br>")}`);
        await ui.popup(parts3.join("<br><br>"), { wide: true });
      }
      if (this.ctx.storageUsed() > STORAGE_SOFT_LIMIT) ui.toast(t("Storage is almost full. Delete sets you don't use.", "저장 공간이 거의 찼어요. 쓰지 않는 세트를 지워 주세요."), "warning");
    }
  };

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
    "▶ Run (Ctrl+Enter): result below\n🐞 Step: stops at the start, at marked lines and at /breakpoint",
    "▶ 실행 (Ctrl+Enter): 결과는 아래에\n🐞 한 줄씩: 처음·표시한 줄·/breakpoint에서 멈춤"
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
          el("button", { type: "button", title: t("Run (Ctrl+Enter)", "실행 (Ctrl+Enter)"), onclick: () => void this.start(false) }, icon("play"), t("Run", "실행")),
          el("button", { type: "button", title: t("Run one command at a time", "한 명령씩 실행"), onclick: () => void this.start(true) }, icon("bug"), t("Step", "한 줄씩")),
          helpTip(RUN_HELP(), t("Run and debug", "실행과 디버그"))
        );
      } else if (paused) {
        bar.append(
          el("button", { type: "button", title: t("Run to the next stop", "다음 멈출 곳까지 실행"), onclick: () => this.step("continue") }, icon("play"), t("Continue", "계속")),
          el("button", { type: "button", title: t("Next command at this level", "이 단계의 다음 명령"), onclick: () => this.step("over") }, icon("step-over"), t("Next", "다음")),
          el("button", { type: "button", title: t("Into a closure or /run", "클로저·/run 속으로"), onclick: () => this.step("into") }, icon("step-into"), t("Into", "안으로")),
          el("button", { type: "button", title: t("Finish this level", "이 단계 끝까지"), onclick: () => this.step("out") }, icon("step-out"), t("Out", "밖으로")),
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
    const cls = new Array(text7.length).fill(null);
    for (const m2 of text7.matchAll(TOKEN)) {
      const g = m2.slice(1).findIndex((x) => x !== void 0);
      if (g < 0) continue;
      for (let i = m2.index; i < m2.index + m2[0].length; i++) cls[i] = CLASSES[g];
    }
    const lines = [];
    let line = "";
    let open2 = null;
    let marked2 = false;
    const close = () => {
      if (open2) line += "</span>";
      open2 = null;
    };
    for (let i = 0; i <= text7.length; i++) {
      const inMark = !!mark && i >= mark.start && i < mark.end;
      if (i === text7.length || text7[i] === "\n") {
        close();
        if (marked2) line += "</span>";
        lines.push(line);
        line = "";
        marked2 = false;
        continue;
      }
      if (inMark !== marked2) {
        close();
        line += inMark ? '<span class="t-cur">' : "</span>";
        marked2 = inMark;
      }
      if (cls[i] !== open2) {
        close();
        if (cls[i]) line += `<span class="${cls[i]}">`;
        open2 = cls[i];
      }
      line += escapeHtml(text7[i]);
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
    /** Marks the command the debugger stopped at. */
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
      const block2 = value.slice(lineStart, end);
      const changed = block2.split("\n").map((l) => out ? l.replace(/^( {1,2}|\t)/, "") : `  ${l}`).join("\n");
      ta.setRangeText(changed, lineStart, end, "select");
      if (s === end) ta.setSelectionRange(Math.max(lineStart, s - (block2.length - changed.length)), Math.max(lineStart, s - (block2.length - changed.length)));
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

  // src/ui/manager/step-editor.ts
  var FRAMES = () => [
    { value: "system", label: "<System> … </System>" },
    { value: "ooc", label: "*{OOC: … }*" },
    { value: "none", label: t("No frame", "틀 없음") }
  ];
  var SENDS = () => [
    {
      value: "result",
      label: t("Get a character reply", "캐릭터 답변으로 받기")
    },
    {
      value: "user",
      label: t("Send as my message, then a reply", "내 메시지로 보내고 답 받기")
    },
    { value: "input", label: t("Put it in the chat input", "입력창에 넣기") }
  ];
  function problemText(code) {
    const [kind, name] = code.split(/:(.*)/s);
    if (kind === "name")
      return name ? t(`"${name}": a name is letters, digits and _ (not starting with a digit), no spaces`, `"${name}": 이름은 글자·숫자·_만 (숫자로 시작 X, 띄어쓰기 X)`) : t("A step has no name", "이름 없는 단계가 있어요");
    if (kind === "duplicate") return t(`Two steps are called "${name}"`, `"${name}" 이름의 단계가 둘이에요`);
    if (kind === "options") return t(`"${name}" has no options`, `"${name}"에 선택지가 없어요`);
    if (kind === "perOption") return t("Only one step can have a prompt per option", "선택지별 프롬프트는 한 단계만 쓸 수 있어요");
    return t("Write the prompt", "프롬프트를 적어 주세요");
  }
  function freeName(q) {
    const base = t("step", "단계");
    let n = q.steps.length + 1;
    while (q.steps.some((s) => s.name === `${base}${n}`)) n++;
    return `${base}${n}`;
  }
  function stepEditor(ctx, set, item) {
    const q = item.steps;
    const edit = (fn) => ctx.mutateItem(set, item, (i) => {
      if (!i.steps) return;
      fn(i.steps);
      i.script = stepsScript(i.steps);
    });
    const problems = stepProblems(q);
    return el(
      "div",
      { class: "steps" },
      el(
        "div",
        { class: "field-h" },
        t("Steps", "단계"),
        helpTip(
          t(
            "Asked in order; {{name}} puts a step's answer in the prompt\n· Cancel at any step stops the QR",
            "차례로 물어봄. {{이름}} 자리에 그 단계의 답이 들어감\n· 어느 단계든 취소하면 QR이 멈춤"
          ),
          t("Steps", "단계")
        )
      ),
      ...q.steps.map((s, n) => stepCard(q, s, n, edit)),
      el(
        "div",
        { class: "row" },
        el(
          "button",
          {
            onclick: () => edit(
              (x) => x.steps.push({
                name: freeName(x),
                kind: "choice",
                question: "",
                options: [{ label: "" }, { label: "" }]
              })
            )
          },
          icon("plus"),
          t("Choice step", "선택지 단계")
        ),
        el(
          "button",
          {
            onclick: () => edit(
              (x) => x.steps.push({
                name: freeName(x),
                kind: "input",
                question: "",
                options: []
              })
            )
          },
          icon("plus"),
          t("Text box step", "입력 단계")
        )
      ),
      finish(ctx, q, edit),
      problems.length ? el("ul", { class: "warn step-problems" }, ...problems.map((p) => el("li", {}, problemText(p)))) : null,
      ctx.fold(
        `steps-script-${item.id}`,
        t("Script made from the steps", "단계로 만든 스크립트"),
        0,
        t("What runs (read only)", "실제로 실행되는 스크립트 (읽기 전용)"),
        el("pre", { class: "step-script" }, item.script)
      ),
      el(
        "div",
        { class: "row" },
        el(
          "button",
          {
            title: t("Keep the script, drop the cards", "스크립트만 남기고 카드는 없앰"),
            onclick: async () => {
              const ok = await ctx.deps.ui.popup(t("Turn this into a plain QR? The cards can't come back.", "일반 QR로 바꿀까요? 카드는 되돌릴 수 없어요."), {
                okButton: t("Turn into a script", "스크립트로 바꾸기"),
                cancelButton: t("Cancel", "취소")
              });
              if (ok) ctx.mutateItem(set, item, (i) => delete i.steps);
            }
          },
          t("Turn into a script", "스크립트로 바꾸기")
        )
      )
    );
  }
  function stepCard(q, s, n, edit) {
    const step = (fn) => edit((x) => x.steps[n] && fn(x.steps[n]));
    const move2 = (by) => edit((x) => {
      const [moved] = x.steps.splice(n, 1);
      x.steps.splice(n + by, 0, moved);
    });
    const key2 = `step-${n}`;
    const badName = !STEP_NAME.test(s.name) || q.steps.some((o, m2) => m2 !== n && o.name === s.name);
    return el(
      "div",
      { class: "step-card" },
      el(
        "div",
        { class: "row" },
        el("span", { class: "step-no" }, String(n + 1)),
        el(
          "label",
          { class: "grow" },
          t("Name (where the answer is kept)", "이름 (답이 저장되는 곳)"),
          el("input", {
            type: "text",
            value: s.name,
            class: badName ? "bad" : "",
            "data-key": `${key2}-name`,
            oninput: (e) => {
              const name = e.target.value.trim();
              edit((x) => {
                const old = x.steps[n]?.name;
                if (old === void 0 || old === name) return;
                x.steps[n].name = name;
                if (!old || !name || x.steps.some((o, m2) => m2 !== n && (o.name === old || o.name === name))) return;
                x.prompt = x.prompt.replaceAll(`{{${old}}}`, `{{${name}}}`).replaceAll(`{{${old}:prompt}}`, `{{${name}:prompt}}`);
                if (x.keep) x.keep = x.keep.map((k) => k === old ? name : k);
              });
            }
          })
        ),
        el(
          "label",
          {},
          t("Kind", "종류"),
          el(
            "select",
            {
              "data-key": `${key2}-kind`,
              onchange: (e) => step((x) => x.kind = e.target.value === "input" ? "input" : "choice")
            },
            el("option", { value: "choice", selected: s.kind === "choice" }, t("Choice", "선택지")),
            el("option", { value: "input", selected: s.kind === "input" }, t("Text box", "입력"))
          )
        ),
        el(
          "button",
          {
            class: "icon",
            title: t("Move up", "위로"),
            "aria-label": t("Move up", "위로"),
            disabled: n === 0,
            onclick: () => move2(-1)
          },
          icon("arrow-up")
        ),
        el(
          "button",
          {
            class: "icon",
            title: t("Move down", "아래로"),
            "aria-label": t("Move down", "아래로"),
            disabled: n === q.steps.length - 1,
            onclick: () => move2(1)
          },
          icon("arrow-down")
        ),
        el(
          "button",
          {
            class: "icon",
            title: t("Delete step", "단계 삭제"),
            "aria-label": t("Delete step", "단계 삭제"),
            onclick: () => edit((x) => x.steps.splice(n, 1))
          },
          icon("trash")
        )
      ),
      el(
        "label",
        {},
        t("Question", "질문"),
        el("input", {
          type: "text",
          value: s.question,
          placeholder: s.kind === "choice" ? t("Who cooks?", "누가 요리하나요?") : t("What should they cook?", "무엇을 만들까요?"),
          "data-key": `${key2}-question`,
          oninput: (e) => step((x) => x.question = e.target.value)
        })
      ),
      s.kind === "choice" ? choicePart(s, key2, step) : null
    );
  }
  function choicePart(s, key2, step) {
    return el(
      "div",
      { class: "step-options" },
      ...s.options.map(
        (o, m2) => el(
          "div",
          { class: "step-option" },
          el(
            "div",
            { class: "row" },
            el("input", {
              type: "text",
              class: "grow",
              value: o.label,
              placeholder: t(`Option ${m2 + 1}`, `선택지 ${m2 + 1}`),
              "aria-label": t(`Option ${m2 + 1}`, `선택지 ${m2 + 1}`),
              "data-key": `${key2}-opt-${m2}`,
              oninput: (e) => step((x) => x.options[m2] && (x.options[m2].label = e.target.value))
            }),
            el(
              "button",
              {
                class: "icon",
                title: t("Remove option", "선택지 빼기"),
                "aria-label": t("Remove option", "선택지 빼기"),
                onclick: () => step((x) => x.options.splice(m2, 1))
              },
              icon("x")
            )
          ),
          s.perOption ? el(
            "textarea",
            {
              class: "step-text",
              placeholder: t("What is sent when this one is picked", "이걸 고르면 보낼 내용"),
              "aria-label": t(`Prompt for option ${m2 + 1}`, `선택지 ${m2 + 1}의 프롬프트`),
              "data-key": `${key2}-opt-${m2}-prompt`,
              oninput: (e) => step((x) => {
                const v = e.target.value;
                if (!x.options[m2]) return;
                if (v) x.options[m2].prompt = v;
                else delete x.options[m2].prompt;
              })
            },
            o.prompt ?? ""
          ) : null
        )
      ),
      el("div", { class: "row" }, el("button", { onclick: () => step((x) => x.options.push({ label: "" })) }, icon("plus"), t("Option", "선택지"))),
      setting(
        t("'Type it' option", "직접 입력 선택지"),
        toggle(!!s.custom, (v) => step((x) => v ? x.custom = { label: t("Type it", "직접 입력"), question: "" } : delete x.custom), t("'Type it' option", "직접 입력 선택지"), `${key2}-custom`),
        t("A button for typing the answer", "답을 직접 적는 버튼")
      ),
      s.custom ? el(
        "div",
        { class: "row" },
        el(
          "label",
          { class: "grow" },
          t("Button", "버튼"),
          el("input", {
            type: "text",
            value: s.custom.label,
            "data-key": `${key2}-custom-label`,
            oninput: (e) => step((x) => x.custom && (x.custom.label = e.target.value))
          })
        ),
        el(
          "label",
          { class: "grow" },
          t("Its question", "글상자 질문"),
          el("input", {
            type: "text",
            value: s.custom.question,
            "data-key": `${key2}-custom-question`,
            oninput: (e) => step((x) => x.custom && (x.custom.question = e.target.value))
          })
        )
      ) : null,
      setting(
        t("A prompt for each option", "선택지마다 다른 프롬프트"),
        toggle(!!s.perOption, (v) => step((x) => v ? x.perOption = true : delete x.perOption), t("A prompt for each option", "선택지마다 다른 프롬프트"), `${key2}-per-option`),
        t(
          `Each option sends its own text, at {{${s.name}:prompt}}`,
          `선택지마다 보낼 글이 따로. {{${s.name}:prompt}} 자리에 들어감`
        )
      )
    );
  }
  function finish(ctx, q, edit) {
    const insert = (text7) => {
      const ta = ctx.root?.querySelector('textarea[data-key="steps-prompt"]');
      if (!ta) return;
      const start2 = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? start2;
      ta.value = ta.value.slice(0, start2) + text7 + ta.value.slice(end);
      ta.focus();
      ta.setSelectionRange(start2 + text7.length, start2 + text7.length);
      ta.dispatchEvent(new Event("input"));
    };
    const chips = q.steps.filter((s) => s.name).flatMap((s) => [`{{${s.name}}}`, ...s.kind === "choice" && s.perOption ? [`{{${s.name}:prompt}}`] : []]);
    return el(
      "div",
      { class: "step-finish" },
      el(
        "div",
        { class: "field-h" },
        t("Prompt", "프롬프트"),
        helpTip(
          t("Sent at the end; {{name}} becomes that step's answer", "마지막에 보낼 내용. {{이름}}은 그 단계의 답"),
          t("Prompt", "프롬프트")
        )
      ),
      chips.length ? el(
        "div",
        { class: "row step-chips" },
        ...chips.map(
          (c) => el(
            "button",
            {
              class: "chip",
              title: t("Put it in the prompt", "프롬프트에 넣기"),
              onclick: () => insert(c)
            },
            c
          )
        )
      ) : null,
      el(
        "textarea",
        {
          class: "step-text",
          "data-key": "steps-prompt",
          "aria-label": t("Prompt", "프롬프트"),
          oninput: (e) => edit((x) => x.prompt = e.target.value)
        },
        q.prompt
      ),
      el(
        "div",
        { class: "row" },
        el(
          "label",
          { class: "grow" },
          t("Frame", "틀"),
          el(
            "select",
            {
              "data-key": "steps-frame",
              onchange: (e) => edit((x) => x.frame = e.target.value)
            },
            ...FRAMES().map((f) => el("option", { value: f.value, selected: q.frame === f.value }, f.label))
          )
        ),
        el(
          "label",
          { class: "grow" },
          t("Send", "보내기"),
          el(
            "select",
            {
              "data-key": "steps-send",
              onchange: (e) => edit((x) => x.send = e.target.value)
            },
            ...SENDS().map((f) => el("option", { value: f.value, selected: q.send === f.value }, f.label))
          )
        ),
        q.send === "result" ? el(
          "label",
          { class: "grow" },
          t("Posted as", "보낼 이름"),
          el("input", {
            type: "text",
            value: q.as,
            placeholder: "{{char}}",
            title: t("{{char}}, a step's {{name}}, or any name", "{{char}}, 단계의 {{이름}}, 아무 이름"),
            "data-key": "steps-as",
            oninput: (e) => edit((x) => x.as = e.target.value)
          })
        ) : null
      ),
      el(
        "div",
        { class: "row" },
        el(
          "label",
          { class: "grow" },
          t("When cancelled, say", "취소하면 알림"),
          el("input", {
            type: "text",
            value: q.cancelText ?? "",
            placeholder: t("(nothing)", "(알림 없음)"),
            "data-key": "steps-cancel",
            oninput: (e) => edit((x) => e.target.value ? x.cancelText = e.target.value : delete x.cancelText)
          })
        ),
        el(
          "label",
          { class: "grow" },
          t("When done, say", "끝나면 알림"),
          el("input", {
            type: "text",
            value: q.doneText ?? "",
            placeholder: t("(nothing)", "(알림 없음)"),
            "data-key": "steps-done",
            oninput: (e) => edit((x) => e.target.value ? x.doneText = e.target.value : delete x.doneText)
          })
        )
      ),
      setting(
        t("Delete the answers afterwards", "끝나면 답 지우기"),
        toggle(q.clean !== false, (v) => edit((x) => v ? delete x.clean : x.clean = false), t("Delete the answers afterwards", "끝나면 답 지우기"), "steps-clean"),
        t(
          "The answers (chat variables) go when the QR ends; ticked ones stay",
          "QR이 끝나면 답(채팅 변수)을 지움. 고른 것은 남김"
        )
      ),
      q.clean !== false && q.steps.some((s) => s.name) ? el(
        "div",
        { class: "row step-keep" },
        el("span", { class: "note" }, t("Keep:", "남길 답:")),
        ...q.steps.filter((s) => s.name).map(
          (s, n) => el(
            "label",
            { class: "inline" },
            el("input", {
              type: "checkbox",
              checked: !!q.keep?.includes(s.name),
              "data-key": `steps-keep-${n}`,
              onchange: (e) => edit((x) => {
                const keep = new Set(x.keep ?? []);
                if (e.target.checked) keep.add(s.name);
                else keep.delete(s.name);
                if (keep.size) x.keep = [...keep];
                else delete x.keep;
              })
            }),
            s.name
          )
        )
      ) : null
    );
  }
  var STEP_EDITOR_CSS = `
.steps { display: flex; flex-direction: column; gap: 8px; }
.step-card { display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--d-line); border-radius: var(--d-radius); background: var(--d-panel-solid); }
.step-no { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; background: var(--d-accent); color: var(--d-panel-solid); font-size: 12px; font-weight: 700; align-self: flex-end; margin-bottom: 6px; }
.step-card label:not(.inline) select { width: auto; }
.step-options { display: flex; flex-direction: column; gap: 6px; padding-left: 10px; border-left: 2px solid var(--d-divider); }
.step-option { display: flex; flex-direction: column; gap: 4px; }
.step-option input, .step-card label input, .step-card select { font-size: 13px; }
textarea.step-text { min-height: 70px; font-family: var(--d-font); font-size: 13px; }
.step-option textarea.step-text { min-height: 54px; }
input.bad { border-color: #e6a23c; }
.step-finish { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--d-divider); }
.step-chips { gap: 4px; }
button.chip { padding: 2px 8px; font-family: var(--d-mono); font-size: 12px; border-radius: 999px; }
.step-keep { gap: 10px; }
.step-problems { margin: 0; padding-left: 18px; }
pre.step-script { margin: 6px 0 0; padding: 8px; max-height: 260px; overflow: auto; white-space: pre-wrap; word-break: break-word; font: 12px/1.5 var(--d-mono); border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); }
`;

  // src/ui/manager/item-editor.ts
  var ORIGIN_BADGE = {
    dispensa: () => el("span", { class: "badge dispensa", title: t("Dispensa command", "Dispensa 명령") }, "Dispensa"),
    marinara: () => el("span", { class: "badge marinara", title: t("Marinara's own command", "마리나라 자체 명령") }, t("Marinara", "마리나라")),
    compat: () => el("span", { class: "badge compat", title: t("Kept so imported QRs keep working", "가져온 QR이 그대로 돌도록 둔 명령") }, t("Compat", "호환")),
    extension: (from) => el("span", { class: "badge extension", title: t(`Added by ${from}`, `${from}이(가) 추가한 명령`) }, from)
  };
  var TRIGGER_LABELS = () => ({
    startup: { label: t("When Marinara starts", "마리나라를 켤 때") },
    user: { label: t("After I send a message", "내 메시지를 보낸 뒤") },
    ai: { label: t("After an AI reply", "AI 답변 뒤") },
    chatChange: { label: t("When a chat opens", "채팅을 열 때") },
    newChat: { label: t("When a new chat is made", "새 채팅을 만들 때") },
    groupDraft: { label: t("On each character's turn in a group chat", "그룹 채팅에서 캐릭터 차례마다") },
    beforeGeneration: { label: t("Just before the AI replies", "AI가 답을 쓰기 직전"), help: t("The reply waits for it (up to 1 min)", "끝날 때까지 답 대기 (최대 1분)") }
  });
  var TRIGGERS = () => {
    const labels = TRIGGER_LABELS();
    return AUTO_TRIGGERS.map(({ key: key2 }) => ({ key: key2, ...labels[key2] }));
  };
  var HELP = () => ({
    submenu: t(
      "Other sets as this QR's right-click menu\n· Chain: the picked QR gets this QR's result\n· %%parent%%: this QR's name",
      "다른 세트를 이 QR의 오른쪽 클릭 메뉴로\n· 이어서 실행: 고른 QR이 이 QR의 결과를 받음\n· %%parent%%: 이 QR 이름"
    ),
    auto: t("Runs by itself at these times, where its set is on", "세트가 켜진 곳에서 이때 자동 실행"),
    automation: t("Runs when this lorebook entry (name or id) is used in a reply", "이 로어북 항목(이름·id)이 답변에 쓰이면 실행"),
    preventAuto: t("What this QR does sets off no other auto-runs", "이 QR이 한 일로는 다른 자동 실행이 돌지 않음"),
    showLabel: t("Shows only the icon in folders and sub menus", "폴더·하위 메뉴에서 아이콘만 표시")
  });
  var ItemEditor = class {
    constructor(ctx) {
      this.ctx = ctx;
    }
    editors = /* @__PURE__ */ new Map();
    panels = /* @__PURE__ */ new Map();
    breakpoints = /* @__PURE__ */ new Map();
    commandListOpen = false;
    commandQuery = "";
    forgetGone() {
      const ids = new Set(this.ctx.state.sets.flatMap((s) => s.items.map((i) => i.id)));
      for (const map of [this.editors, this.panels, this.breakpoints]) for (const id of [...map.keys()]) if (!ids.has(id)) map.delete(id);
    }
    /** Open script boxes take a script changed elsewhere (the box ignores its own text). */
    syncScripts() {
      for (const [id, editor] of this.editors) {
        const item = this.ctx.state.sets.flatMap((s) => s.items).find((i) => i.id === id);
        if (item) editor.value = item.script;
      }
    }
    /** For when the window closes. */
    stopAll() {
      for (const p of this.panels.values()) p.stop();
    }
    render(set, item) {
      const { registry: registry2, ui } = this.ctx.deps;
      const mutate = (fn) => this.ctx.mutateItem(set, item, fn);
      const box = el("div", { class: "editor" });
      const panel = this.panelFor(set, item);
      box.append(
        this.basics(item, mutate),
        item.dialect === "st" ? el(
          "div",
          { class: "note-box" },
          el("div", { class: "warn" }, t("Counts messages from #0. Not converted because:", "메시지를 0번부터 셈. 변환하지 못한 이유:")),
          el("ul", {}, ...(item.note ?? t("No reason was recorded", "이유가 기록되지 않았어요")).split("\n").map((r) => el("li", {}, r))),
          el(
            "div",
            { class: "row" },
            el(
              "button",
              {
                onclick: () => {
                  let ok = false;
                  mutate((i) => ok = applyConversion(i, registry2));
                  ui.toast(ok ? t("Converted to Marinara style.", "마리나라 기준으로 바꿨어요.") : t("Can't convert it yet. Fix the reasons above.", "아직 변환할 수 없어요. 위 이유를 고쳐 주세요."), ok ? "success" : "warning");
                }
              },
              t("Convert to Marinara style", "마리나라 기준으로 변환")
            ),
            el(
              "button",
              {
                title: t("Mark it as counting from #1", "1번부터 세는 QR로 표시"),
                onclick: () => mutate((i) => {
                  i.dialect = "marinara";
                  delete i.note;
                })
              },
              t("Fixed by hand (mark Marinara style)", "직접 고침 (마리나라 기준으로 표시)")
            )
          )
        ) : el("span"),
        ...item.steps ? [stepEditor(this.ctx, set, item)] : this.scriptPart(set, item),
        el("div", { "data-checks": item.id }, ...this.checks(item)),
        el("div", { "data-run": item.id }, panel.render()),
        item.steps ? el("span") : this.commandList(),
        this.submenuPart(set, item),
        this.autoPart(set, item),
        this.footer(set, item, mutate)
      );
      return box;
    }
    scriptPart(set, item) {
      return [
        el(
          "div",
          { class: "field-h" },
          t("Script", "스크립트"),
          helpTip(
            t(
              "Commands and macros like {{char}}\n· / or {{ shows a list · Ctrl+Enter runs\n· Click a line number for a breakpoint",
              "명령과 {{char}} 같은 매크로\n· / 나 {{ 입력 시 목록 · Ctrl+Enter 실행\n· 줄 번호 누르기 = 중단점"
            ),
            t("Script", "스크립트")
          )
        ),
        this.scriptBox(set, item).element
      ];
    }
    scriptBox(set, item) {
      let editor = this.editors.get(item.id);
      if (!editor) {
        let checkTimer = null;
        editor = new ScriptEditor({
          value: item.script,
          key: "item-script",
          label: t("Script", "스크립트"),
          commands: () => this.ctx.deps.registry.list().map((d) => ({ name: d.name, help: d.help })),
          onChange: (value) => {
            this.ctx.mutateItem(set, item, (i) => i.script = value);
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
      const res = findUnsupported(script, this.ctx.deps.registry);
      this.ctx.mutateItem(set, item, (i) => i.unsupported = Array.isArray(res) ? res.length ? res : void 0 : [t("(syntax error)", "(문법 오류)")]);
      const slot = this.ctx.root?.querySelector(`[data-checks="${item.id}"]`);
      const fresh = this.ctx.state.sets.find((s) => s.id === set.id)?.items.find((i) => i.id === item.id);
      if (slot && fresh) slot.replaceChildren(...this.checks(fresh));
    }
    checks(item) {
      const out = [];
      if (item.unsupported?.length) out.push(el("div", { class: "warn" }, `⚠ ${t("Not supported yet", "아직 지원하지 않는 명령")}: ${item.unsupported.map((c) => c.startsWith("(") ? c : `/${c}`).join(", ")}`));
      return out;
    }
    panelFor(set, item) {
      let panel = this.panels.get(item.id);
      if (!panel) {
        panel = new RunPanel({
          run: (signal, debug) => {
            const fresh = this.ctx.state.sets.find((s) => s.id === set.id);
            const now = fresh?.items.find((i) => i.id === item.id);
            if (!fresh || !now) throw new Error(t("Couldn't find the QR.", "QR을 찾지 못했어요."));
            return this.ctx.deps.runInEditor(fresh, now, { signal, debug });
          },
          editor: () => this.editors.get(item.id) ?? null,
          breakpoints: () => this.breakpoints.get(item.id) ?? /* @__PURE__ */ new Set(),
          changed: () => {
            const slot = this.ctx.root?.querySelector(`[data-run="${item.id}"]`);
            if (slot) slot.replaceChildren(panel.render());
          }
        });
        this.panels.set(item.id, panel);
      }
      return panel;
    }
    basics(item, mutate) {
      return el(
        "div",
        { class: "row" },
        el("label", {}, t("Icon", "아이콘"), el("input", { type: "text", value: item.icon ?? "", maxlength: "8", style: "width:3.2em;text-align:center", title: t("Dock bubble icon (empty: first letter)", "Dock 버블 아이콘 (비우면 이름 첫 글자)"), "data-key": "item-icon", oninput: (e) => mutate((i) => i.icon = e.target.value.trim() || void 0) })),
        el("label", { class: "grow" }, t("Name", "이름"), el("input", { type: "text", value: item.label, "data-key": "item-label", oninput: (e) => mutate((i) => i.label = e.target.value) })),
        el("label", { class: "grow" }, el("span", { class: "field-h" }, t("Tooltip", "설명"), helpTip(t("Shown on hover", "마우스를 올리면 보이는 글"), t("Tooltip", "설명"))), el("input", { type: "text", value: item.title ?? "", "data-key": "item-title", oninput: (e) => mutate((i) => i.title = e.target.value || void 0) }))
      );
    }
    footer(set, item, mutate) {
      return el(
        "div",
        {},
        el(
          "div",
          { class: "toggles" },
          setting(
            t("Own bubble on the Dock", "Dock에 따로 놓기"),
            toggle(onDock(this.ctx.state, { kind: "qr", setId: set.id, itemId: item.id }), (v) => this.ctx.deps.store.update((st) => (v ? addToDock : removeFromDock)(st, { kind: "qr", setId: set.id, itemId: item.id })), t("Own bubble on the Dock", "Dock에 따로 놓기"), "item-dock")
          ),
          setting(t("Hide from the Dock", "Dock에서 숨기기"), toggle(!!item.hidden, (v) => mutate((i) => i.hidden = v), t("Hide from the Dock", "Dock에서 숨기기"), "item-hidden"), t("Left out of its set's bubbles on the Dock; other QRs and auto-run still use it", "Dock의 세트 버블에서만 뺌. 다른 QR·자동 실행은 그대로")),
          item.icon?.trim() ? setting(t("Icon only", "아이콘만 보이기"), toggle(item.showLabel === false, (v) => mutate((i) => v ? i.showLabel = false : delete i.showLabel), t("Icon only", "아이콘만 보이기"), "item-icon-only"), HELP().showLabel) : null
        ),
        el("div", { class: "actions" }, el("button", { class: "danger", onclick: () => this.ctx.removeItem(set, item) }, icon("trash"), t("Delete QR", "QR 삭제")))
      );
    }
    submenuPart(set, item) {
      const mutate = (fn) => this.ctx.mutateItem(set, item, fn);
      const state = this.ctx.state;
      const links = item.contextList ?? [];
      const rows = el("div", { class: "links" });
      links.forEach((link, index) => {
        const target = state.sets.find((s) => s.id === link.setId);
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
      const choices = state.sets.filter((s) => !links.some((l) => l.setId === s.id));
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
        ...choices.map((s) => el("option", { value: s.id }, s.id === set.id ? t(`${s.name} (this set: its hidden QRs with an icon)`, `${s.name} (이 세트: 숨긴 QR 중 아이콘 있는 것)`) : s.name))
      );
      return this.ctx.fold(`submenu-${item.id}`, t("Sub menu", "하위 메뉴"), links.length, HELP().submenu, rows, choices.length ? add : el("div", { class: "note" }, t("No sets to attach", "달 수 있는 세트 없음")));
    }
    autoPart(set, item) {
      const mutate = (fn) => this.ctx.mutateItem(set, item, fn);
      const on = TRIGGERS().filter((tr) => item.auto?.[tr.key]).length + (item.automationId ? 1 : 0);
      return this.ctx.fold(
        `auto-${item.id}`,
        t("Auto-run", "자동 실행"),
        on,
        HELP().auto,
        el(
          "div",
          { class: "toggles" },
          ...TRIGGERS().map(
            (tr) => setting(
              tr.label,
              toggle(
                !!item.auto?.[tr.key],
                (v) => mutate((i) => {
                  const auto = { ...i.auto };
                  if (v) auto[tr.key] = true;
                  else delete auto[tr.key];
                  i.auto = Object.keys(auto).length ? auto : void 0;
                }),
                tr.label,
                `auto-${tr.key}`
              ),
              tr.help
            )
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
    /** Searchable command list; a click puts the command in at the caret. */
    commandList() {
      const all = this.ctx.deps.registry.list();
      const q = this.commandQuery.trim().toLowerCase();
      const shown = q ? all.filter((d) => d.name.includes(q) || d.help.toLowerCase().includes(q)) : all;
      const details = el(
        "details",
        { class: "cmds", ontoggle: () => this.commandListOpen = details.open },
        el(
          "summary",
          {
            // remember right away: the toggle event comes later, and a redraw in between would lose it
            onclick: () => this.commandListOpen = !details.open
          },
          t(`Commands (${all.length}) · `, `명령 목록 (${all.length}개) · `),
          ORIGIN_BADGE.dispensa(),
          " ",
          ORIGIN_BADGE.marinara(),
          " ",
          ORIGIN_BADGE.compat()
        ),
        el("input", {
          type: "text",
          placeholder: t("Find a command", "명령 찾기"),
          value: this.commandQuery,
          "data-key": "command-search",
          oninput: (e) => {
            this.commandQuery = e.target.value;
            this.ctx.render();
          }
        }),
        el("div", { class: "cmd-list" }, ...shown.map((d) => this.commandRow(d)))
      );
      details.open = this.commandListOpen;
      return details;
    }
    commandRow(def) {
      const badge = def.origin === "marinara" ? ORIGIN_BADGE.marinara() : def.origin === "extension" ? ORIGIN_BADGE.extension(def.from ?? "") : def.origin === "st" ? ORIGIN_BADGE.compat() : ORIGIN_BADGE.dispensa();
      return el(
        "button",
        {
          class: "cmd",
          onclick: () => {
            const ta = this.ctx.root?.querySelector('textarea[data-key="item-script"]');
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
  };

  // src/qr/copy.ts
  function cloneItem(item) {
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = newId("qr");
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
      item.id = newId("qr");
      if (item.contextList) item.contextList = item.contextList.map((l) => l.setId === set.id ? { ...l, setId: copy.id } : l);
    }
    return copy;
  }

  // src/ui/drag.ts
  var DRAG_CSS = `
.drag { flex: none; width: 22px; padding: 4px 0 !important; justify-content: center; cursor: grab; touch-action: none; color: var(--d-muted); background: none !important; border-color: transparent !important; }
.drag:active { cursor: grabbing; }
.drag svg { width: 14px; height: 14px; }
.dragging { position: relative; z-index: 3; opacity: .92; box-shadow: var(--d-shadow); border-radius: var(--d-radius-sm); background: var(--d-panel-solid); pointer-events: none; }
.drop-before { box-shadow: 0 -2px 0 var(--d-accent); }
.drop-after { box-shadow: 0 2px 0 var(--d-accent); }
`;
  function dragHandle(handle, row, rowSelector, move2) {
    handle.setAttribute("aria-roledescription", t("Reorder", "순서 바꾸기"));
    handle.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const rows = siblings(row, rowSelector);
      const from = rows.indexOf(row);
      const to = from + (e.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to < rows.length) move2(from, to);
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
        if (to !== from) move2(from, to);
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
      const zones2 = [...root.querySelectorAll(zoneSelector)];
      const from = siblings(row, rowSelector).indexOf(row);
      const start2 = { x: e.clientX, y: e.clientY };
      let target = null;
      handle.setPointerCapture(e.pointerId);
      row.classList.add("dragging");
      const clear = () => {
        for (const z of zones2) {
          z.classList.remove("drop-into");
          for (const r of z.children) r.classList.remove("drop-before", "drop-after");
        }
      };
      const onMove = (ev) => {
        row.style.transform = `translate(${ev.clientX - start2.x}px, ${ev.clientY - start2.y}px)`;
        clear();
        let zone = null;
        let best = Infinity;
        for (const z of zones2) {
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

  // src/ui/manager/set-panel.ts
  var HELP2 = () => ({
    places: t("Where its QRs auto-run", "자동 실행이 도는 곳"),
    plain: t(
      "For a QR that is plain text (no '/')\n· Don't send: input only\n· Add to input text: after the typed text\n· Put before: before the typed text",
      "'/' 없는 글 QR을 누를 때\n· 보내지 않기: 입력창에만\n· 입력창 글에 붙이기: 쓰던 글 뒤에\n· 앞에 붙이기: 쓰던 글 앞에"
    )
  });
  function setPanel(ctx, set, files) {
    const mutate = (fn) => ctx.mutateSet(set, fn);
    const state = ctx.state;
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
      el("button", { onclick: () => files.exportSet(set) }, icon("upload"), t("Export", "내보내기")),
      setMenu(ctx, set)
    );
    const chat = ctx.scope.chatId;
    const sw = (on, change, label, key2, disabled = false) => {
      const box = toggle(on, change, label, key2);
      if (disabled) box.querySelector("input").disabled = true;
      return box;
    };
    const other = elsewhere(state, set.id, ctx.scope);
    const otherNote = [other.chats ? t(`${other.chats} other chats`, `다른 채팅 ${other.chats}곳`) : "", other.characters ? t(`${other.characters} other characters`, `다른 캐릭터 ${other.characters}명`) : ""].filter(Boolean).join(", ");
    const places = section(
      t("Auto-run in", "켜는 칸"),
      HELP2().places,
      [],
      setting(t("Global", "전체"), sw(set.enabled, (v) => mutate((s) => s.enabled = v), t("Global", "전체"), "place-all")),
      setting(
        t("This chat", "이 채팅"),
        sw(isOnForChat(state, set.id, chat), (v) => chat && mutate((s, st) => setForChat(st, chat, s.id, v)), t("This chat", "이 채팅"), "place-chat", !chat),
        chat ? void 0 : t("Available with a chat open", "채팅을 연 상태에서 선택 가능")
      ),
      ...ctx.scope.characterIds.map(
        (c) => setting(t(`Character: ${ctx.characterName(c)}`, `캐릭터: ${ctx.characterName(c)}`), sw(isOnForCharacter(state, set.id, c), (v) => mutate((s, st) => setForCharacter(st, c, s.id, v)), t(`Character ${ctx.characterName(c, "")}`, `캐릭터 ${ctx.characterName(c, "")}`), `place-char-${c}`))
      ),
      otherNote ? el("div", { class: "note" }, t(`Also on in ${otherNote}`, `${otherNote}에서도 켜짐`)) : null
    );
    const docked = (state.dock ?? []).find((e) => e.kind === "set" && e.setId === set.id);
    const dockPlace = docked ? layoutOf(docked, set) : "off";
    const onDockRow = setting(
      t("On the Dock", "Dock에 놓기"),
      el(
        "select",
        {
          "data-key": "set-dock",
          "aria-label": t("On the Dock", "Dock에 놓기"),
          onchange: (e) => {
            const v = e.target.value;
            mutate((s, st) => {
              if (v === "off") return removeFromDock(st, { kind: "set", setId: s.id });
              if (!onDock(st, { kind: "set", setId: s.id })) addToDock(st, { kind: "set", setId: s.id });
              setLayout(st, s.id, v);
            });
          }
        },
        ...[["off", t("Off", "안 놓기")], ["folder", t("Folder", "폴더")], ["row", t("Row", "한 줄")]].map(([v, label]) => el("option", { value: v, selected: v === dockPlace }, label))
      ),
      t("Folder: one bubble · Row: a bubble per QR. The order is in ⚙ settings", "폴더: 버블 하나 · 한 줄: QR마다 버블. 순서는 ⚙ 설정에서")
    );
    const looks = section(
      t("Look", "모양"),
      void 0,
      [],
      onDockRow,
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
    const plain = ctx.fold(
      `set-plain-${set.id}`,
      t("How text QRs send", "글 QR 보내는 방식"),
      [set.disableSend, set.injectInput].filter(Boolean).length,
      HELP2().plain,
      setting(t("Don't send", "보내지 않기"), toggle(!!set.disableSend, (v) => mutate((s) => s.disableSend = v), t("Don't send", "보내지 않기"), "set-nosend")),
      setting(t("Add to input text", "입력창 글에 붙이기"), toggle(!!set.injectInput, (v) => mutate((s) => s.injectInput = v), t("Add to input text", "입력창 글에 붙이기"), "set-inject")),
      set.injectInput ? setting(t("Put before", "앞에 붙이기"), toggle(!!set.placeBeforeInput, (v) => mutate((s) => s.placeBeforeInput = v), t("Put before", "앞에 붙이기"), "set-before")) : null
    );
    return [top, el("div", { style: "margin-top:10px" }, places, looks), plain];
  }
  function setMenu(ctx, set) {
    const { store, ui } = ctx.deps;
    return dropMenu(icon("more"), t("Set menu", "세트 메뉴"), [
      {
        label: t("Duplicate set", "세트 복제"),
        run: () => {
          const copy = duplicateSet(set, ctx.state);
          store.update((st) => st.sets.splice(st.sets.findIndex((s) => s.id === set.id) + 1, 0, copy));
          ctx.selectedSet = copy.id;
          ctx.selectedItem = null;
          ctx.render();
          ui.toast(t(`Made "${copy.name}".`, `"${copy.name}"을 만들었어요.`), "success");
        }
      },
      "-",
      {
        label: t("Delete set", "세트 삭제"),
        danger: true,
        run: async () => {
          if (!await ui.popup(t(`Delete the set "${set.name}" and its ${set.items.length} QRs?`, `"${set.name}" 세트와 QR ${set.items.length}개를 삭제할까요?`), { okButton: t("Delete", "삭제"), cancelButton: t("Cancel", "취소") })) return;
          store.update((st) => {
            st.sets = st.sets.filter((x) => x.id !== set.id);
            forgetSet(st, set.id);
          });
          ctx.selectedSet = ctx.state.sets[0]?.id ?? null;
          ctx.render();
        }
      }
    ]);
  }
  function toHex(color) {
    if (!color) return void 0;
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const m2 = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color);
    return m2 ? `#${[m2[1], m2[2], m2[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : void 0;
  }

  // src/ui/manager/item-list.ts
  function itemColumn(ctx, editor, files) {
    const set = ctx.state.sets.find((s) => s.id === ctx.selectedSet);
    const col = el("div", { class: "col" });
    if (!set) {
      col.append(el("div", { class: "empty" }, t("Pick a set or make a new one.", "세트를 고르거나 새로 만드세요.")));
      return col;
    }
    col.append(...setPanel(ctx, set, files));
    col.append(
      el(
        "div",
        { class: "row", style: "margin:14px 0 6px" },
        el("div", { class: "section", style: "margin:0" }, t(`${set.items.length} QRs`, `QR ${set.items.length}개`)),
        el("span", { class: "grow" }),
        el("button", { type: "button", onclick: () => void files.paste(set) }, icon("clipboard"), t("Paste", "붙여넣기"))
      )
    );
    const list = el("div", { class: "list" });
    set.items.forEach((item) => {
      const handle = el("button", { class: "drag", type: "button", title: t("Drag (or ↑↓) to reorder", "끌어서(또는 ↑↓) 순서 바꾸기"), "aria-label": t(`Reorder ${item.label}`, `${item.label} 순서 바꾸기`), "data-key": `drag-qr-${item.id}` }, icon("grip"));
      const marks = [...itemMarks(item), item.hidden ? t("Hidden", "숨김") : ""].filter(Boolean);
      const row = el(
        "div",
        { class: "qrow" },
        handle,
        el(
          "button",
          {
            class: `entry${item.id === ctx.selectedItem ? " sel" : ""}`,
            onclick: () => {
              ctx.selectedItem = ctx.selectedItem === item.id ? null : item.id;
              ctx.render();
            }
          },
          item.icon?.trim() ? el("span", {}, item.icon.trim()) : icon("play"),
          el("span", { class: "grow" }, item.label || t("(no name)", "(이름 없음)")),
          marks.length ? el("span", { class: "marks", title: MARKS_TITLE() }, marks.join(" ")) : null,
          item.unsupported?.length ? el("span", { class: "warn", title: item.unsupported.join(", ") }, "⚠") : null,
          item.dialect === "st" ? el("span", { class: "meta", title: item.note ?? "" }, t("From #0", "0번부터")) : null
        ),
        el("button", { class: "icon", title: t("Run", "실행"), "aria-label": t(`Run ${item.label}`, `${item.label} 실행`), onclick: () => ctx.deps.run(set, item) }, icon("play")),
        itemMenu(ctx, files, set, item)
      );
      dragHandle(handle, row, ".qrow", (from, to) => ctx.mutateSet(set, (s) => moveTo(s.items, from, to)));
      list.append(row);
      if (item.id === ctx.selectedItem) list.append(editor.render(set, item));
    });
    col.append(
      list,
      el(
        "div",
        { class: "row", style: "margin-top:8px" },
        newQrMenu((item) => {
          ctx.mutateSet(set, (s) => s.items.push(item));
          ctx.selectedItem = item.id;
          ctx.render();
        })
      )
    );
    return col;
  }
  function newQrMenu(add) {
    return dropMenu(
      el("span", { class: "row", style: "gap:5px" }, icon("plus"), el("span", { class: "label" }, t("New QR", "새 QR"))),
      t("New QR", "새 QR"),
      [
        { label: t("QR", "일반 QR"), run: () => add(newItem(t("New QR", "새 QR"), "")) },
        {
          label: t("Easy choice QR", "쉬운 선택지 QR"),
          run: () => add(withSteps({ ...newItem(t("New easy choice QR", "새 쉬운 선택지 QR"), ""), steps: newStepQr(), icon: "🧭" }))
        },
        { label: t("Visualizer QR", "비주얼라이저 QR"), run: () => add({ ...newItem(t("New page", "새 페이지"), "/visz "), icon: "🌟" }) }
      ],
      true
    );
  }
  function itemMarks(item) {
    return [item.auto && Object.values(item.auto).some(Boolean) ? "⚡" : "", item.automationId ? "📚" : "", item.contextList?.length ? "☰" : ""].filter(Boolean);
  }
  var MARKS_TITLE = () => t("⚡ auto-run · 📚 lorebook link · ☰ sub menu", "⚡ 자동 실행 · 📚 로어북 연결 · ☰ 하위 메뉴");
  function itemMenu(ctx, files, set, item) {
    const own = { kind: "qr", setId: set.id, itemId: item.id };
    const docked = onDock(ctx.state, own);
    return dropMenu(icon("more"), t(`${item.label} menu`, `${item.label} 메뉴`), [
      { label: t("Copy", "복사"), run: () => void files.copyItem(item, false, set) },
      { label: t("Cut", "잘라내기"), run: () => void files.copyItem(item, true, set) },
      {
        label: t("Duplicate", "복제"),
        run: () => {
          const copy = cloneItem(item);
          copy.label = t(`${item.label} copy`, `${item.label} 복사본`);
          ctx.mutateSet(set, (s) => s.items.splice(s.items.findIndex((i) => i.id === item.id) + 1, 0, copy));
          ctx.selectedItem = copy.id;
          ctx.render();
        }
      },
      { label: t("Move to another set…", "다른 세트로 옮기기…"), run: () => void transferItems(ctx, [{ set, item }], false) },
      { label: t("Copy to another set…", "다른 세트로 복사…"), run: () => void transferItems(ctx, [{ set, item }], true) },
      "-",
      {
        // same as the editor's switch
        label: docked ? t("Remove from the Dock", "Dock에서 빼기") : t("Own bubble on the Dock", "Dock에 따로 놓기"),
        run: () => ctx.deps.store.update((st) => (docked ? removeFromDock : addToDock)(st, own))
      },
      { label: t("Export this QR", "이 QR만 내보내기"), sub: ".mqr.json", run: () => files.exportItem(item) },
      "-",
      { label: t("Delete QR", "QR 삭제"), danger: true, run: () => ctx.removeItem(set, item) }
    ]);
  }
  async function transferItems(ctx, picked2, copy) {
    const { store, ui } = ctx.deps;
    if (!picked2.length) return false;
    const from = new Set(picked2.map((p) => p.set.id));
    const others = ctx.state.sets.filter((s) => !(from.size === 1 && from.has(s.id)));
    if (!others.length) {
      ui.toast(t("No other set to move it to. Make another set first.", "옮길 다른 세트가 없어요. 먼저 세트를 하나 더 만드세요."), "warning");
      return false;
    }
    const labels = others.map((s, i) => `${s.name}${others.filter((o) => o.name === s.name).length > 1 ? ` (${i + 1})` : ""}`);
    const what = picked2.length === 1 ? t(`"${picked2[0].item.label}"`, `"${picked2[0].item.label}"`) : t(`${picked2.length} QRs`, `QR ${picked2.length}개`);
    const [choice] = await ui.pick?.(t(`Pick a set to ${copy ? "copy" : "move"} ${what} to.`, `${what}을 ${copy ? "복사할" : "옮길"} 세트를 고르세요.`), labels) ?? [];
    const target = choice ? others[labels.indexOf(choice)] : void 0;
    if (!target) return false;
    store.update((st) => {
      const to = st.sets.find((s) => s.id === target.id);
      if (!to) return;
      for (const { set, item } of picked2) {
        const src = st.sets.find((s) => s.id === set.id);
        const live = src?.items.find((i) => i.id === item.id);
        if (!src || !live) continue;
        if (copy) to.items.push(cloneItem(live));
        else if (src.id !== to.id) {
          src.items = src.items.filter((i) => i.id !== live.id);
          to.items.push(live);
        }
      }
    });
    if (!copy && picked2.length === 1) {
      ctx.selectedSet = target.id;
      ctx.selectedItem = picked2[0].item.id;
    }
    ctx.render();
    ui.toast(
      picked2.length === 1 ? t(`${copy ? "Copied" : "Moved"} to the set "${target.name}".`, `"${target.name}" 세트로 ${copy ? "복사했어요" : "옮겼어요"}.`) : t(`${copy ? "Copied" : "Moved"} ${what} to the set "${target.name}".`, `${what}을 "${target.name}" 세트로 ${copy ? "복사했어요" : "옮겼어요"}.`),
      "success"
    );
    return true;
  }

  // src/ui/manager/search-results.ts
  var LIMIT2 = 200;
  var stacked = () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 720px)").matches;
  function searchResults(ctx, files, redraw) {
    const live = new Set(ctx.state.sets.flatMap((s) => s.items.map((i) => i.id)));
    for (const id of [...ctx.searchPicked]) if (!live.has(id)) ctx.searchPicked.delete(id);
    const { sets, items } = search(ctx.searchIndex(), ctx.searchQuery, { body: true, menus: false, limit: LIMIT2 });
    const box = el("div", { class: "results", role: "listbox", "aria-label": t("Search results", "찾은 결과") });
    if (!sets.length && !items.length) {
      box.append(el("div", { class: "zone-empty" }, t("Nothing found", "찾은 게 없어요")));
      if (ctx.searchPicked.size) box.append(bulkBar(ctx, files, redraw));
      return box;
    }
    if (sets.length) {
      box.append(el("div", { class: "zone-h" }, t("Sets", "세트"), el("span", { class: "count" }, String(sets.length))));
      for (const hit of sets) box.append(setRow(ctx, hit));
    }
    if (items.length) {
      box.append(el("div", { class: "zone-h" }, t("QR", "QR"), el("span", { class: "count" }, items.length >= LIMIT2 - sets.length ? `${items.length}+` : String(items.length))));
      for (const hit of items) box.append(itemRow(ctx, files, hit, redraw));
    }
    if (ctx.searchPicked.size) box.append(bulkBar(ctx, files, redraw));
    const rows = box.querySelectorAll(".hit");
    ctx.searchActive = Math.max(0, Math.min(ctx.searchActive, rows.length - 1));
    rows[ctx.searchActive]?.classList.add("active");
    return box;
  }
  function setRow(ctx, hit) {
    const s = hit.set;
    return el(
      "div",
      { class: "set-row hit", role: "option" },
      el(
        "button",
        {
          class: `entry${s.id === ctx.selectedSet && !ctx.viszOpen ? " sel" : ""}`,
          onclick: () => {
            ctx.selectedSet = s.id;
            ctx.selectedItem = null;
            if (ctx.viszOpen) ctx.viszOpen = false;
            ctx.render();
            if (stacked()) requestAnimationFrame(() => ctx.root?.querySelector(".main > .col + .col")?.scrollIntoView({ block: "start" }));
          }
        },
        s.icon?.trim() ? el("span", {}, s.icon.trim()) : icon("folder"),
        el("span", { class: "grow name" }, marked(s.name, hit.marks)),
        el("span", { class: "meta" }, String(s.items.length))
      )
    );
  }
  function itemRow(ctx, files, hit, redraw) {
    const { set, item } = hit;
    const marks = itemMarks(item);
    const label = item.label || t("(no name)", "(이름 없음)");
    const open2 = el(
      "button",
      {
        class: `entry${item.id === ctx.selectedItem ? " sel" : ""}`,
        title: [item.title, hit.hidden ? t("Hidden from the Dock", "Dock에서 숨김") : ""].filter(Boolean).join("\n") || label,
        onclick: () => ctx.openItem(set.id, item.id)
      },
      item.icon?.trim() ? el("span", {}, item.icon.trim()) : icon("play"),
      el("span", { class: "grow name" }, item.label ? marked(item.label, hit.marks.name) : label),
      marks.length ? el("span", { class: "marks", title: MARKS_TITLE() }, marks.join(" ")) : null,
      hit.hidden ? el("span", { class: "meta" }, t("Hidden", "숨김")) : null,
      // second line: set and matched script line
      el("span", { class: "sub" }, el("span", { class: "tag", title: t("Set", "세트") }, set.name), hit.line ? el("span", { class: "line" }, marked(hit.line.text, hit.line.marks)) : null)
    );
    return el(
      "div",
      { class: `qrow hit${hit.hidden ? " dim" : ""}`, role: "option" },
      el("input", {
        type: "checkbox",
        class: "pick",
        checked: ctx.searchPicked.has(item.id),
        title: t("Pick", "고르기"),
        "aria-label": t(`Pick ${item.label}`, `${item.label} 고르기`),
        onchange: (e) => {
          if (e.target.checked) ctx.searchPicked.add(item.id);
          else ctx.searchPicked.delete(item.id);
          redraw();
        }
      }),
      open2,
      el("button", { class: "icon", title: t("Run", "실행"), "aria-label": t(`Run ${item.label}`, `${item.label} 실행`), onclick: () => ctx.deps.run(set, item) }, icon("play")),
      itemMenu(ctx, files, set, item)
    );
  }
  function pickedItems(ctx) {
    return ctx.state.sets.flatMap((set) => set.items.filter((i) => ctx.searchPicked.has(i.id)).map((item) => ({ set, item })));
  }
  function bulkBar(ctx, files, redraw) {
    const { store, ui } = ctx.deps;
    const picked2 = pickedItems(ctx);
    const n = picked2.length;
    const done = () => {
      ctx.searchPicked.clear();
      ctx.render();
    };
    const transfer = async (copy) => {
      if (await transferItems(ctx, picked2, copy)) done();
    };
    return el(
      "div",
      { class: "bulk", role: "toolbar", "aria-label": t("Picked QRs", "고른 QR") },
      el("span", { class: "grow" }, t(`${n} picked`, `${n}개 고름`)),
      el("button", { type: "button", onclick: () => void transfer(false) }, t("Move to set…", "세트로 옮기기…")),
      el("button", { type: "button", onclick: () => void transfer(true) }, t("Copy to set…", "세트로 복사…")),
      el("button", { type: "button", title: ".mqr.json", onclick: () => files.exportItems(picked2.map((p) => p.item)) }, t("Export", "내보내기")),
      el(
        "button",
        {
          type: "button",
          onclick: () => {
            store.update((st) => picked2.forEach(({ set, item }) => addToDock(st, { kind: "qr", setId: set.id, itemId: item.id })));
            ui.toast(t(`Put ${n} QRs on the Dock.`, `QR ${n}개를 Dock에 놓았어요.`), "success");
            done();
          }
        },
        t("Put on the Dock", "Dock에 놓기")
      ),
      el(
        "button",
        {
          type: "button",
          class: "danger",
          onclick: async () => {
            if (!await ui.popup(t(`Delete ${n} QRs?`, `QR ${n}개를 삭제할까요?`), { okButton: t("Delete", "삭제"), cancelButton: t("Cancel", "취소") })) return;
            const ids = new Set(picked2.map((p) => p.item.id));
            store.update((st) => st.sets.forEach((s) => s.items = s.items.filter((i) => !ids.has(i.id))));
            if (ctx.selectedItem && ids.has(ctx.selectedItem)) ctx.selectedItem = null;
            done();
          }
        },
        t("Delete", "삭제")
      ),
      el(
        "button",
        {
          type: "button",
          class: "icon",
          title: t("Unpick all", "모두 풀기"),
          "aria-label": t("Unpick all", "모두 풀기"),
          onclick: () => {
            ctx.searchPicked.clear();
            redraw();
          }
        },
        icon("x")
      )
    );
  }
  var SEARCH_RESULTS_CSS = `
.results { display: flex; flex-direction: column; gap: 4px; }
.results .zone-h { margin-top: 10px; }
.results .zone-h:first-child { margin-top: 0; }
.results .hit.active > .entry { border-color: var(--d-btn-border-hover); background: var(--d-hl-bg); }
.results .entry { flex-wrap: wrap; row-gap: 2px; }
.results .entry .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.results .entry .sub { flex-basis: 100%; display: flex; align-items: baseline; gap: 6px; min-width: 0; font-weight: 400; }
.results .entry .tag { flex: none; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 6px; border-radius: 999px; border: 1px solid var(--d-line); color: var(--d-muted); font-size: 11px; }
.results .entry .line { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 11.5px/1.35 var(--d-mono); color: var(--d-muted); }
.results .hit.dim > .entry { opacity: .6; }
.col-search { margin: 8px 0 0; }
.results .qrow { gap: 2px; }
.results .qrow > input.pick { flex: none; margin: 0 2px 0 0; width: 15px; height: 15px; }
/* narrow column: small ▶ and ⋯ */
.results .qrow > button.icon { padding: 5px 4px; }
.results .qrow > details.menu > summary { padding: 5px 5px; }
.results .entry { padding-left: 7px; padding-right: 7px; }
.results .bulk { position: sticky; bottom: -10px; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 8px -10px -10px; padding: 8px 10px 10px;
  background: var(--d-panel-solid); border-top: 1px solid var(--d-divider); font-size: 12.5px; }
.results .bulk > .grow { flex-basis: 100%; color: var(--d-muted); }
.results .bulk button { padding: 4px 8px; font-size: 12px; }
.results .bulk button.danger { color: var(--d-danger); }
/* keeps the bar in sight */
.col:has(.results .bulk) .visz-foot { position: static; }
`;

  // src/ui/manager/set-column.ts
  function setColumn(ctx, files) {
    const { store } = ctx.deps;
    const area = el("div", { class: "col-body" });
    const draw = () => void area.replaceChildren(ctx.searchQuery.trim() ? searchResults(ctx, files, draw) : zones(ctx));
    draw();
    const rows = () => [...area.querySelectorAll(".hit")];
    const { box } = searchBox({
      value: ctx.searchQuery,
      placeholder: t("Search sets and QRs", "세트·QR 찾기"),
      label: t("Search sets and QRs (Ctrl+F)", "세트·QR 찾기 (Ctrl+F)"),
      key: "lib-search",
      onInput: (text7) => {
        ctx.searchQuery = text7;
        ctx.searchActive = 0;
        draw();
      },
      move: (by) => {
        const list = rows();
        if (!list.length) return;
        list[ctx.searchActive]?.classList.remove("active");
        ctx.searchActive = (ctx.searchActive + by + list.length) % list.length;
        list[ctx.searchActive].classList.add("active");
        list[ctx.searchActive].scrollIntoView({ block: "nearest" });
      },
      enter: () => rows()[ctx.searchActive]?.querySelector(".entry")?.click(),
      // clearing also unticks
      cleared: () => ctx.searchPicked.clear()
    });
    return el(
      "div",
      { class: "col" },
      el(
        "div",
        { class: "col-h" },
        el("strong", {}, t("Sets", "세트")),
        helpTip(
          t(
            "Groups of QRs\n· Global · This chat · Character: where they auto-run\n· All sets: drag into a list to add, out to remove",
            "QR 묶음\n· 전체 · 이 채팅 · 캐릭터: 자동 실행이 도는 곳\n· 모든 세트: 위 칸으로 끌면 넣기, 끌어 오면 빼기"
          ),
          t("Sets", "세트")
        )
      ),
      el("div", { class: "col-search" }, box),
      el(
        "div",
        { class: "row", style: "margin:8px 0" },
        el(
          "button",
          {
            onclick: () => {
              const s = newSet(t("New set", "새 세트"));
              store.update((x) => x.sets.push(s));
              ctx.selectedSet = s.id;
              ctx.selectedItem = null;
              if (ctx.viszOpen) ctx.viszOpen = false;
            }
          },
          icon("plus"),
          t("New set", "새 세트")
        )
      ),
      area,
      ctx.viszOpen === null ? null : el(
        "div",
        { class: "visz-foot" },
        el(
          "button",
          {
            class: `entry visz-entry${ctx.viszOpen ? " sel" : ""}`,
            part: "library-visz",
            "aria-pressed": String(ctx.viszOpen),
            onclick: () => {
              ctx.viszOpen = !ctx.viszOpen;
              ctx.render();
            }
          },
          icon("moon-star"),
          el("span", { class: "grow" }, t("Visualizer", "비주얼라이저"))
        )
      )
    );
  }
  function zones(ctx) {
    const { store } = ctx.deps;
    const st = store.value;
    const chat = ctx.scope.chatId;
    const lists = [
      { zone: { kind: "global" }, title: t("Global", "전체"), empty: t("Drag sets here", "여기로 끌어 놓기") },
      ...chat ? [{ zone: { kind: "chat", chatId: chat }, title: t("This chat", "이 채팅"), empty: t("Drag sets here", "여기로 끌어 놓기") }] : [],
      ...ctx.scope.characterIds.map((c) => ({ zone: { kind: "char", characterId: c }, title: t(`Character: ${ctx.characterName(c)}`, `캐릭터: ${ctx.characterName(c)}`), empty: t("Drag sets here", "여기로 끌어 놓기") })),
      { zone: { kind: "all" }, title: t("All sets", "모든 세트"), empty: t("None", "없음") }
    ];
    const zoneOf = /* @__PURE__ */ new Map();
    const body = el("div", { class: "zones" });
    lists.forEach(({ zone, title, empty }, z) => {
      const ids = zoneSets(st, zone);
      const box = el("div", { class: "zone", "data-zone": String(z), role: "list", "aria-label": zone.kind === "all" ? title : t(`${title} sets`, `${title} 세트`) });
      zoneOf.set(box, zone);
      for (const id of ids) {
        const s = st.sets.find((x) => x.id === id);
        if (!s) continue;
        const handle = el("button", { class: "drag", type: "button", title: t("Drag to reorder or to another list", "끌어서 순서 바꾸기·다른 칸으로"), "aria-label": t(`Move ${s.name}`, `${s.name} 옮기기`), "data-key": `drag-set-${z}-${s.id}` }, icon("grip"));
        const row = el(
          "div",
          { class: "set-row", role: "listitem" },
          handle,
          el(
            "button",
            {
              class: `entry${s.id === ctx.selectedSet && !ctx.viszOpen ? " sel" : ""}`,
              onclick: () => {
                ctx.selectedSet = s.id;
                ctx.selectedItem = null;
                if (ctx.viszOpen) ctx.viszOpen = false;
                ctx.render();
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
    return body;
  }

  // src/ui/manager/settings-pop.ts
  function settingsPop(ctx, parts3, close) {
    return el(
      "div",
      { class: "set-pop", role: "dialog", "aria-label": t("Dispensa settings", "Dispensa 설정") },
      el(
        "div",
        { class: "pop-h" },
        el("strong", { class: "grow" }, t("Dispensa settings", "Dispensa 설정")),
        el("button", { class: "icon", title: t("Close", "닫기"), "aria-label": t("Close settings", "설정 닫기"), onclick: close }, icon("x"))
      ),
      el("div", { class: "cards" }, parts3.ai, dockCard(ctx, parts3.bubbles))
    );
  }
  function dockCard(ctx, bubbles) {
    const { store } = ctx.deps;
    const shown = shownDock(store.value);
    const list = el("div", { class: "list dock-list" });
    shown.forEach(({ entry, set, item }, i) => {
      const name = item?.label ?? set.name;
      const handle = el("button", { class: "drag", type: "button", title: t("Drag (or ↑↓) to reorder", "끌어서(또는 ↑↓) 순서 바꾸기"), "aria-label": t(`Reorder ${name}`, `${name} 순서 바꾸기`), "data-key": `drag-dock-${i}` }, icon("grip"));
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
            onclick: () => item ? ctx.openItem(set.id, item.id) : (ctx.selectedSet = set.id, ctx.selectedItem = null, ctx.open("qr"))
          },
          glyph ? el("span", {}, glyph) : icon(item ? "play" : "folder"),
          el("span", { class: "grow" }, name),
          el("span", { class: "meta" }, item ? `QR · ${set.name}` : t(`Set · ${set.items.filter((x) => !x.hidden).length}`, `세트 · ${set.items.filter((x) => !x.hidden).length}`))
        ),
        item ? el("span") : el(
          "select",
          {
            class: "layout",
            title: t("Folder: one bubble · Row: a bubble per QR", "폴더: 버블 하나 · 한 줄: QR마다 버블"),
            "aria-label": t(`${set.name} layout`, `${set.name} 놓는 모양`),
            "data-key": `dock-layout-${i}`,
            onchange: (e) => store.update((x) => setLayout(x, set.id, e.target.value))
          },
          el("option", { value: "folder", selected: layoutOf(entry, set) === "folder" }, t("Folder", "폴더")),
          el("option", { value: "row", selected: layoutOf(entry, set) === "row" }, t("Row", "한 줄"))
        ),
        el("button", { class: "icon", title: t("Remove from the Dock", "Dock에서 빼기"), "aria-label": t(`Remove ${name}`, `${name} 빼기`), onclick: () => store.update((x) => removeFromDock(x, entry)) }, icon("x"))
      );
      dragHandle(
        handle,
        row,
        ".set-row",
        (from, to) => store.update((x) => {
          const entries = shownDock(x).map((e) => e.entry);
          moveTo(entries, from, to);
          x.dock = entries;
        })
      );
      list.append(row);
    });
    const groups = ctx.deps.dockGroups?.() ?? [];
    for (const g of groups) {
      list.append(
        el(
          "div",
          { class: "set-row" },
          el("span", { class: "drag" }),
          el("span", { class: "entry", style: "cursor:default" }, g.icon ? el("span", {}, g.icon) : icon("folder"), el("span", { class: "grow" }, g.name), el("span", { class: "meta" }, String(g.count))),
          g.remove ? el("button", { class: "icon", title: t("Remove from the Dock", "Dock에서 빼기"), "aria-label": t(`Remove ${g.name}`, `${g.name} 빼기`), onclick: () => g.remove() }, icon("x")) : el("span")
        )
      );
    }
    if (!shown.length && !groups.length) list.append(el("div", { class: "note" }, t("Empty", "비어 있음")));
    const card = section(
      "Dock",
      t(
        "The same shortcuts in every chat, in this order\n· Put a set or a QR on it with 'On the Dock' in the QR library",
        "모든 채팅에서 같은 바로가기, 이 순서대로\n· 세트·QR은 QR 보관함의 'Dock에 놓기'로 넣어요"
      ),
      [],
      list,
      ...bubbles,
      overflowSetting(ctx),
      setting(
        t("🔍 Search bubble", "🔍 찾기 버블"),
        toggle(store.value.dockSearch !== false, (v) => store.update((x) => v ? delete x.dockSearch : x.dockSearch = false), t("Show 🔍 bubble", "🔍 버블 보이기"), "dock-search"),
        t("Empty: recent runs on this device", "비우면 이 기기의 최근 실행")
      )
    );
    card.classList.add("card");
    return card;
  }
  function overflowSetting(ctx) {
    const { store } = ctx.deps;
    const { flow, span } = dockFlow(store.value);
    const flowSelect = el(
      "select",
      {
        class: "layout",
        "aria-label": t("When bubbles overflow", "넘칠 때"),
        "data-key": "dock-flow",
        onchange: (e) => {
          const v = e.target.value;
          store.update((x) => {
            delete x.dockSpan;
            if (v === "wrap") delete x.dockFlow;
            else x.dockFlow = v;
          });
        }
      },
      el("option", { value: "wrap", selected: flow === "wrap" }, t("Wrap", "줄바꿈")),
      el("option", { value: "x", selected: flow === "x" }, t("Scroll sideways", "가로 스크롤")),
      el("option", { value: "y", selected: flow === "y" }, t("Scroll up and down", "세로 스크롤"))
    );
    const range = flow === "wrap" ? null : DOCK_SPAN[flow];
    const spanSelect = range ? el(
      "select",
      {
        class: "layout",
        "aria-label": flow === "x" ? t("Bubbles in view", "보이는 버블 수") : t("Lines in view", "보이는 줄 수"),
        "data-key": "dock-span",
        onchange: (e) => store.update((x) => x.dockSpan = Number(e.target.value))
      },
      ...Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i).map(
        (n) => el("option", { value: String(n), selected: n === span }, flow === "x" ? t(`${n} bubbles`, `${n}개`) : t(`${n} lines`, `${n}줄`))
      )
    ) : null;
    return setting(
      t("When bubbles overflow", "넘칠 때"),
      spanSelect ? [flowSelect, spanSelect] : flowSelect,
      t("Scrolling keeps 🔍 ⏹ ⚙ at the end", "스크롤해도 🔍 ⏹ ⚙는 끝에 고정")
    );
  }

  // src/ui/manager/style.ts
  var MANAGER_CSS = `
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
details.cmds summary { cursor: pointer; font-size: 13px; color: var(--d-text); }
.cmd-list { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow: auto; margin-top: 6px; }
.cmd { justify-content: flex-start; width: 100%; text-align: left; border-color: transparent; background: none; padding: 4px 6px; white-space: normal; font-weight: 500; color: var(--d-text); }
.cmd code { font-family: var(--d-mono); font-size: 12px; min-width: 120px; color: var(--d-btn-text-active); }
.cmd .help { color: var(--d-muted); font-size: 12px; flex: 1; }
header .tab { padding: 5px 12px; }
.main.single { grid-template-columns: 1fr; }
.main.board-main { overflow: hidden; }
${FORM_CSS}
${VISZ_SETTINGS_CSS}
/* ⚙ Dispensa settings, under the header's button; the whole window on a phone */
.win > header { position: relative; }
.set-pop { position: absolute; right: 12px; top: calc(100% + 4px); z-index: 30; width: min(460px, calc(100% - 24px)); max-height: 72vh; overflow: auto; padding: 10px 12px 12px; border: 1px solid var(--d-line); border-radius: var(--d-radius); box-shadow: var(--d-shadow); background: var(--d-panel-solid); }
.set-pop .pop-h { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.set-pop .dock-list { margin: 4px 0 8px; }
.set-pop select.layout { width: auto; flex: none; padding: 3px 6px; font-size: 12px; }
@media (max-width: 600px) { .set-pop { position: fixed; inset: 0; width: auto; max-height: none; border: none; border-radius: 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); } }
/* the Library's Visualizer entry, kept in sight under the sets */
.visz-foot { position: sticky; bottom: -10px; margin: 12px -10px -10px; padding: 8px 10px 10px; background: var(--d-panel-solid); }
${GALLERY_CSS}
${SCRIPT_EDITOR_CSS}
${STEP_EDITOR_CSS}
${RUN_PANEL_CSS}
${DRAG_CSS}
${MEMO_VIEW_CSS}
${BOARD_VIEW_CSS}
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
details.more > summary { cursor: pointer; color: var(--d-muted); font-size: 12px; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px; }
details.more > summary::before { content: "▸"; transition: transform .15s ease; }
details.more[open] > summary::before { transform: rotate(90deg); }
.col-h { display: flex; align-items: center; gap: 6px; }
.col-h strong { color: var(--d-title); }
/* one switch per line, names in one column and switches in another */
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
@media (max-width: 600px) { header select.lang { width: 4.4em; } header h2 { font-size: 14px; margin-right: 2px; } header { gap: 4px; } }
details.menu .menu-list { position: absolute; right: 0; top: calc(100% + 4px); z-index: 5; min-width: 240px; display: flex; flex-direction: column; gap: 2px; padding: 4px;
  background: var(--d-panel-solid); border: 1px solid var(--d-line); border-radius: var(--d-radius-sm); box-shadow: var(--d-shadow); animation: d-fade-in .12s ease-out; }
details.menu .menu-list button { justify-content: flex-start; flex-direction: column; align-items: flex-start; gap: 1px; border-color: transparent; background: none; white-space: normal; text-align: left; }
details.menu .menu-list button:hover { background: var(--d-hl-bg); }
details.menu .menu-list small { color: var(--d-muted); font-weight: 400; font-size: 11.5px; }
@media (max-width: 720px) { .main { grid-template-columns: 1fr; } .col + .col { border-left: none; border-top: 1px solid var(--d-divider); } }
/* phones: tabs on their own line, header buttons icon-only */
@media (max-width: 560px) {
  header { flex-wrap: wrap; row-gap: 8px; }
  header .tabs { order: 5; width: 100%; flex-wrap: nowrap; }
  header .tabs .seg2 { flex: 1; }
  header .label { display: none; }
  .win { height: 100%; }
  .col { padding: 10px 12px; }
  .visz-foot { margin: 12px -12px -10px; padding: 8px 12px 10px; }
}
`;

  // src/ui/manager/index.ts
  var librarySlice = (state) => JSON.stringify(state, (key2, value) => key2 === "script" || key2 === "unsupported" ? void 0 : value);
  var memoSlice = (state) => JSON.stringify(state, (key2, value) => key2 === "text" ? void 0 : value);
  var QrManager = class {
    constructor(deps) {
      this.deps = deps;
      this.viszOpen = deps.viszStore ? false : null;
      this.galleryView = deps.gallery ? new GalleryView({ ...deps.gallery, ui: deps.ui, close: () => this.close() }, true) : null;
      this.viszView = deps.viszStore ? new ViszSettingsView({
        store: deps.viszStore,
        ui: deps.ui,
        connections: async () => (await deps.connections()).map((c) => ({ id: c.id, name: c.name })),
        presets: () => deps.promptPresets?.() ?? Promise.resolve([]),
        rerender: () => this.render()
      }) : null;
      const memo2 = deps.memo;
      this.memoView = memo2 ? new MemoView({
        store: memo2.store,
        ui: deps.ui,
        sendOoc: memo2.sendOoc,
        putInInput: memo2.putInInput,
        makePage: memo2.makePage,
        toQr: (memo3) => this.memoToQr(memo3),
        oocSettings: () => this.viszView?.oocCards() ?? [],
        menu: (summary, label, entries) => dropMenu(summary, label, entries),
        close: () => this.close(),
        rerender: () => this.render(),
        scope: () => this.scope,
        fonts: memo2.fonts,
        useFont: memo2.useFont,
        openBoard: (id) => {
          this.boardView?.show(id);
          this.tab = "board";
          this.render();
        }
      }) : null;
      this.boardView = memo2 ? new BoardView({
        store: memo2.store,
        ui: deps.ui,
        rerender: () => this.render(),
        scope: () => this.scope,
        fonts: memo2.fonts,
        useFont: memo2.useFont,
        sendOoc: memo2.sendOoc,
        putInInput: memo2.putInInput,
        makePage: memo2.makePage,
        runForGallery: memo2.runForGallery,
        openGallery: () => this.open("gallery"),
        openPage: async (id) => {
          const ok = await memo2.openPage(id);
          if (ok) this.close();
          return ok;
        },
        close: () => this.close(),
        openMemo: (id) => {
          this.memoView?.show(id);
          this.tab = "memo";
          this.render();
        },
        images: memo2.images
      }) : null;
    }
    hostEl = null;
    root = null;
    selectedSet = null;
    selectedItem = null;
    scope = NO_CHAT;
    tab = "qr";
    unsubscribers = [];
    openParts = /* @__PURE__ */ new Set();
    viszView;
    galleryView;
    /** ⚙ Dispensa settings are open under the header. */
    settingsOpen = false;
    viszOpen;
    memoView;
    boardView;
    editor = new ItemEditor(this);
    files = new QrFiles(this);
    /** The window slides in on open, not on every redraw. */
    entering = false;
    names = /* @__PURE__ */ new Map();
    scrollToEditor = false;
    searchQuery = "";
    searchActive = 0;
    searchPicked = /* @__PURE__ */ new Set();
    /** Without sub menu entries: the Library doesn't list them. */
    index = indexCache({ menus: false });
    get state() {
      return this.deps.store.value;
    }
    setName = (id) => this.state.sets.find((s) => s.id === id)?.name;
    searchIndex() {
      return this.index.get(this.state);
    }
    storageUsed() {
      return storageUsed([this.deps.store, this.deps.viszStore, this.deps.memo?.store]);
    }
    characterName(id, fallback = "…") {
      return this.names.get(id) ?? fallback;
    }
    /** A new plain QR with the memo as its script, in the Library's open set. */
    memoToQr(memo2) {
      const item = newItem(memo2.title?.trim() || oneLine(memo2.text, 14), textForAi(memo2.text));
      let setId = "";
      this.deps.store.update((st) => {
        let target = st.sets.find((x) => x.id === this.selectedSet);
        if (!target) {
          target = newSet(t("Memo QR", "메모 QR"));
          st.sets.push(target);
        }
        target.items.push(item);
        setId = target.id;
      });
      this.openItem(setId, item.id);
    }
    /** The chat on screen, for the chat and character switches. */
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
    /** Adds a QR file's sets to the Library (Fornello's card bundles hand them over). */
    importQrs(json2, name, characterId) {
      return this.files.importJson(json2, name, characterId);
    }
    /** The memo boards tab, on one board when given. */
    openBoard(id) {
      if (id && id !== "new") this.boardView?.show(id);
      this.open("board");
      if (id === "new") void this.boardView?.makeBoard();
    }
    open(tab) {
      if (tab === "visz") {
        if (this.viszOpen !== null) this.viszOpen = true;
        tab = "qr";
      } else if (tab === "dock") {
        this.settingsOpen = true;
        tab = void 0;
      } else if (tab === "qr" && this.viszOpen) this.viszOpen = false;
      if (tab) this.tab = tab;
      if (this.tab === "gallery") void this.galleryView?.load();
      if (this.hostEl) {
        this.render();
        return;
      }
      this.hostEl = el("div", { id: "dispensa-manager" });
      this.root = this.hostEl.attachShadow({ mode: "open" });
      document.body.append(this.hostEl);
      this.selectedSet ??= this.deps.store.value.sets[0]?.id ?? null;
      const redraw = () => this.render();
      this.index.invalidate();
      this.unsubscribers = [
        this.deps.store.subscribe(() => this.index.invalidate()),
        this.deps.store.select(librarySlice, redraw),
        // a script changed elsewhere (a /qr-update while the window is open) shows in its open box
        this.deps.store.subscribe(() => this.editor.syncScripts()),
        this.deps.viszStore?.subscribe(redraw),
        this.deps.memo?.store.select(memoSlice, redraw)
      ].filter((off) => !!off);
      document.addEventListener("keydown", this.onKey, true);
      this.entering = true;
      this.render();
      this.entering = false;
    }
    /** Redraws when open (after the screen language changed). */
    refresh() {
      if (this.hostEl) this.render();
    }
    /** Ctrl+click on the Dock: straight to that QR's editor. */
    openItem(setId, itemId) {
      this.selectedSet = setId;
      this.selectedItem = itemId;
      this.settingsOpen = false;
      this.scrollToEditor = true;
      this.open("qr");
    }
    close() {
      this.settingsOpen = false;
      this.searchQuery = "";
      this.searchActive = 0;
      this.searchPicked.clear();
      this.memoView?.leave();
      this.editor.stopAll();
      for (const off of this.unsubscribers) off();
      this.unsubscribers = [];
      void this.deps.viszStore?.saveNow().catch(() => void 0);
      void this.deps.memo?.store.saveNow().catch(() => void 0);
      document.removeEventListener("keydown", this.onKey, true);
      this.hostEl?.remove();
      this.hostEl = this.root = null;
      void this.deps.store.saveNow().catch(() => void 0);
    }
    onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "f" && this.tab === "qr") {
        e.preventDefault();
        e.stopPropagation();
        if (this.settingsOpen) {
          this.settingsOpen = false;
          this.render();
        }
        const box = this.root?.querySelector('[data-key="lib-search"]');
        box?.focus();
        box?.select();
        return;
      }
      if (e.key === "Escape" && !e.defaultPrevented) {
        const active = this.root?.activeElement;
        if (active && active.tagName === "TEXTAREA") return;
        const menu = this.root?.querySelector("details.menu[open]");
        e.stopPropagation();
        if (menu) {
          menu.open = false;
          return;
        }
        if (this.settingsOpen) {
          this.settingsOpen = false;
          this.render();
          return;
        }
        this.close();
      }
    };
    mutateSet(set, fn) {
      this.deps.store.update((st) => {
        const target = st.sets.find((x) => x.id === set.id);
        if (target) fn(target, st);
      });
    }
    mutateItem(set, item, fn) {
      this.deps.store.update((st) => {
        const target = st.sets.find((s) => s.id === set.id)?.items.find((i) => i.id === item.id);
        if (target) fn(target);
      });
    }
    removeItem(set, item) {
      this.mutateSet(set, (s) => s.items = s.items.filter((i) => i.id !== item.id));
      if (this.selectedItem === item.id) this.selectedItem = null;
      this.render();
    }
    fold(key2, title, count, help, ...kids) {
      const d = el("details", { class: "box" }, el("summary", {}, title, count ? el("span", { class: "count" }, `· ${count}`) : null, help ? helpTip(help, title) : null), ...kids);
      d.open = this.openParts.has(key2);
      d.addEventListener("toggle", () => d.open ? this.openParts.add(key2) : this.openParts.delete(key2));
      return d;
    }
    render() {
      if (!this.root) return;
      const active = this.root.activeElement;
      const focusKey = active?.dataset?.key;
      const caret = active && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null;
      const scrolls2 = [...this.root.querySelectorAll(".col")].map((c) => c.scrollTop);
      this.editor.forgetGone();
      const style = el("style");
      style.textContent = MANAGER_CSS + SEARCH_BOX_CSS + SEARCH_RESULTS_CSS;
      const win = el("div", { class: `win${this.entering ? " d-enter" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": "Dispensa" });
      if (this.tab === "memo" && this.memoView) win.append(this.header(), el("div", { class: "main single" }, this.memoView.render()));
      else if (this.tab === "board" && this.boardView) win.append(this.header(), el("div", { class: "main single board-main" }, this.boardView.render()));
      else if (this.tab === "gallery" && this.galleryView) win.append(this.header(), el("div", { class: "main single" }, this.galleryView.element));
      else win.append(this.header(), el("div", { class: "main" }, setColumn(this, this.files), this.viszOpen && this.viszView ? el("div", { class: "col" }, this.viszView.render()) : itemColumn(this, this.editor, this.files)));
      const backdrop = el("div", {
        class: `backdrop${this.entering ? " d-fade" : ""}`,
        onmousedown: (e) => {
          if (e.target === backdrop) this.close();
        }
      });
      backdrop.append(win);
      this.root.replaceChildren(style, backdrop);
      [...this.root.querySelectorAll(".col")].forEach((c, i) => c.scrollTop = scrolls2[i] ?? 0);
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
    header() {
      const size = this.storageUsed();
      const tabIcons = { qr: "square-sparkles", memo: "notebook-pen", board: "layout-dashboard", gallery: "images" };
      const tabOptions = [
        { value: "qr", label: "📚", title: t("QR library", "QR 보관함") },
        ...this.memoView ? [{ value: "memo", label: "📝", title: t("Memo pad", "메모장") }] : [],
        ...this.boardView ? [{ value: "board", label: "📋", title: t("Memo boards", "메모 보드") }] : [],
        ...this.galleryView ? [{ value: "gallery", label: "🖼", title: t("Gallery", "갤러리") }] : []
      ];
      const tabs = withIcons(
        segmented(
          "dispensa-tab",
          tabOptions,
          this.tab,
          (v) => this.open(v),
          t("Dispensa tabs", "Dispensa 탭")
        ),
        tabOptions.map((o) => tabIcons[o.value] ?? null)
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
        size > STORAGE_SHOW_FROM ? el("span", { class: "warn", title: `${Math.round(size / 1024)} KB / ${STORAGE_LIMIT / 1e3} KB` }, t(`Storage ${Math.round(size / STORAGE_LIMIT * 100)}% used`, `저장 공간 ${Math.round(size / STORAGE_LIMIT * 100)}% 사용`)) : el("span"),
        this.tab === "qr" ? el("button", { title: t("Import QR files (.json, .qr.json, .mqr.json)", "QR 파일 가져오기 (.json, .qr.json, .mqr.json)"), "aria-label": t("Import QRs", "QR 가져오기"), onclick: () => this.files.importFile() }, icon("download"), el("span", { class: "label" }, t("Import QRs", "QR 가져오기"))) : el("span"),
        el(
          "button",
          {
            class: this.settingsOpen ? "on" : "",
            part: "dispensa-settings",
            "aria-pressed": String(this.settingsOpen),
            title: t("Dispensa settings", "Dispensa 설정"),
            "aria-label": t("Dispensa settings", "Dispensa 설정"),
            onclick: () => (this.settingsOpen = !this.settingsOpen, this.render())
          },
          icon("settings")
        ),
        el("button", { class: "icon", title: t("Close", "닫기"), "aria-label": t("Close", "닫기"), onclick: () => this.close() }, icon("x")),
        this.settingsOpen ? settingsPop(this, { ai: this.viszView?.commonAi() ?? null, bubbles: [this.viszView?.dockBubble(), this.memoView?.dockBubble()].filter((x) => !!x) }, () => (this.settingsOpen = false, this.render())) : null
      );
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
      const picked2 = this.picked();
      if (!picked2 || picked2.text.length < 2) {
        this.hide();
        return;
      }
      this.text = picked2.text;
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
      const center = Math.min(Math.max(8 + w / 2, picked2.rect.left + picked2.rect.width / 2), window.innerWidth - 8 - w / 2);
      let y = picked2.rect.bottom + 8;
      if (y + h2 > window.innerHeight - 8) y = Math.max(8, picked2.rect.top - h2 - 8);
      b.style.left = `${center}px`;
      b.style.top = `${y}px`;
    }
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
  async function pickMemos(ui, memos, scope, prompt = t("Pick from the Memo pad (one or more)", "메모장에서 고르기 (여러 개 가능)"), query = "") {
    const list = shownMemos(visibleMemos(memos.value.memos, scope), query);
    if (!list.length) {
      ui.toast(query ? t(`No memo contains "${query}".`, `"${query}"이(가) 든 메모가 없어요.`) : t("The Memo pad is empty. Select text in the chat and press 📝 to add it.", "메모장이 비어 있어요. 채팅에서 글을 긁어 📝을 누르면 들어가요."), "info", { title: "📝" });
      return null;
    }
    const labels = list.map((m2, i) => `${i + 1}. ${m2.pinned ? "📌 " : ""}${memoLabel(m2)}`);
    const picked2 = await ui.pick?.(prompt, labels, { multiple: true, placeholder: t("Search", "찾기") }) ?? [];
    const chosen = picked2.map((l) => list[labels.indexOf(l)]).filter(Boolean);
    return chosen.length ? chosen.map((m2) => textForAi(m2.text)).join("\n\n") : null;
  }

  // src/shared/top-menu.ts
  var registry = () => window.__figcakeMenu ??= { version: 1, sources: [] };
  function addMenuSource(source) {
    const list = registry().sources;
    const at = list.findIndex((s) => s.id === source.id);
    if (at >= 0) list.splice(at, 1);
    list.push(source);
    list.sort((a, b) => a.order - b.order);
    return () => {
      const now = registry().sources;
      const i = now.indexOf(source);
      if (i >= 0) now.splice(i, 1);
    };
  }
  function menuItems() {
    return registry().sources.flatMap((s) => {
      try {
        return s.items();
      } catch {
        return [];
      }
    });
  }
  var MENU_ICONS = {
    cake: svg('<path d="M16 13H3"/><path d="M16 17H3"/><path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6"/><circle cx="9" cy="7" r="2"/>'),
    flame: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>')
  };
  function svg(paths) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }
  var TOPBAR = 'header[data-component="TopBar"] nav.mari-topbar-panel-nav';
  var POLYGLOT = "pg-mari-launch";
  var BUTTON = "figcake-menu";
  var POP = "figcake-menu-pop";
  var STYLE_ID = "figcake-menu-style";
  var STYLE3 = `
#${BUTTON} { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; padding: 0; border: 0;
  border-radius: var(--radius, .75rem); background: none; color: var(--muted-foreground); cursor: pointer; transition: color .2s, background-color .2s; }
#${BUTTON} svg { width: .875rem; height: .875rem; }
#${BUTTON}:hover { background: var(--accent); color: var(--marinara-chat-chrome-button-text-hover, var(--foreground)); }
@media (pointer: coarse) { #${BUTTON} { width: 2.25rem; height: 2.25rem; } }
@media (max-width: 767px) { #${BUTTON} { order: 8; } }
#${BUTTON}.float { position: fixed; right: .875rem; top: .875rem; z-index: 9000; background: var(--card); box-shadow: 0 6px 20px rgb(0 0 0 / .35); }
#${POP} { position: fixed; z-index: 10001; display: grid; min-width: 11rem; max-width: min(18rem, calc(100vw - 16px)); max-height: calc(100dvh - 5rem); overflow: auto; padding: .25rem;
  border: 1px solid var(--marinara-chat-chrome-panel-border, var(--border)); border-radius: .75rem;
  background: var(--marinara-chat-chrome-panel-bg, var(--popover)); color: var(--marinara-chat-chrome-panel-text, var(--popover-foreground));
  font-size: .75rem; box-shadow: 0 25px 50px -12px rgb(0 0 0 / .4); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
#${POP} button { display: flex; align-items: center; gap: .5rem; padding: .5rem .625rem; border: 0; border-radius: .5rem; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
#${POP} button:hover { background: var(--marinara-chat-chrome-highlight-bg-hover, var(--accent)); }
#${POP} button > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${POP} .icon { display: inline-flex; width: .875rem; justify-content: center; flex: none; opacity: .75; }
#${POP} .icon svg { width: .875rem; height: .875rem; }
#${POP} .group { padding: .5rem .625rem .125rem; font-size: .6875rem; opacity: .6; }
`;
  var SVG_TAGS = /* @__PURE__ */ new Set(["svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect"]);
  var SVG_ATTRS = /* @__PURE__ */ new Set(["xmlns", "viewbox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "opacity", "class"]);
  function safeSvg(markup) {
    const tpl = document.createElement("template");
    tpl.innerHTML = markup;
    const root = tpl.content.firstElementChild;
    const clean = (el2) => SVG_TAGS.has(el2.localName.toLowerCase()) && [...el2.attributes].every((a) => SVG_ATTRS.has(a.name.toLowerCase())) && [...el2.children].every(clean);
    return root && tpl.content.childElementCount === 1 && root.localName.toLowerCase() === "svg" && clean(root) ? document.importNode(root, true) : null;
  }
  function iconOf(icon2) {
    const span = document.createElement("span");
    span.className = "icon";
    const svg2 = icon2.startsWith("<svg") ? safeSvg(icon2) : null;
    if (svg2) span.append(svg2);
    else if (!icon2.startsWith("<svg")) span.textContent = icon2;
    return span;
  }
  var closeOpen = null;
  function openMenu(btn, byKeyboard = false) {
    const old = document.getElementById(POP);
    if (closeOpen || old) {
      if (closeOpen) closeOpen(false);
      else old?.remove();
      return;
    }
    const box = document.createElement("div");
    box.id = POP;
    box.setAttribute("role", "menu");
    const entries = [];
    const close = (refocus) => {
      box.remove();
      document.removeEventListener("keydown", onKey2, true);
      document.removeEventListener("click", onOutside2);
      btn.setAttribute("aria-expanded", "false");
      if (closeOpen === close) closeOpen = null;
      if (refocus && btn.isConnected) btn.focus();
    };
    const onOutside2 = () => close(false);
    const onKey2 = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close(true);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || !entries.length) return;
      const at = entries.indexOf(document.activeElement);
      if (at < 0 && document.activeElement !== btn) return;
      e.preventDefault();
      const last = entries.length - 1;
      const next = e.key === "Home" ? 0 : e.key === "End" ? last : e.key === "ArrowDown" ? at < 0 || at === last ? 0 : at + 1 : at <= 0 ? last : at - 1;
      entries[next].focus();
    };
    let group;
    for (const item of menuItems()) {
      if (item.group && item.group !== group) {
        const head = document.createElement("div");
        head.className = "group";
        head.textContent = item.group;
        box.append(head);
      }
      group = item.group;
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      if (item.title) b.title = item.title;
      const label = document.createElement("span");
      label.textContent = item.label;
      b.append(iconOf(item.icon), label);
      b.addEventListener("click", () => {
        close(false);
        item.run();
      });
      box.append(b);
      entries.push(b);
    }
    const r = btn.getBoundingClientRect();
    box.style.top = `${Math.round(r.bottom + 6)}px`;
    box.style.right = `${Math.max(8, Math.round(innerWidth - r.right))}px`;
    document.body.append(box);
    btn.setAttribute("aria-expanded", "true");
    closeOpen = close;
    document.addEventListener("keydown", onKey2, true);
    setTimeout(() => {
      if (closeOpen === close) document.addEventListener("click", onOutside2, { once: true });
    });
    if (byKeyboard) entries[0]?.focus();
  }
  function keepTopMenu() {
    let own = null;
    const dress = (btn) => {
      const title = registry().sources.map((s) => s.name).join(" · ") || t("Menu", "메뉴");
      if (btn.title !== title) {
        btn.title = title;
        btn.setAttribute("aria-label", title);
      }
    };
    const drop = () => {
      if (!own) return;
      own.remove();
      own = null;
      document.getElementById(STYLE_ID)?.remove();
    };
    const place2 = () => {
      const someoneElse = document.getElementById(POLYGLOT) ?? (own ? null : document.getElementById(BUTTON));
      if (someoneElse || !registry().sources.length) {
        drop();
        return;
      }
      if (!own) {
        own = document.createElement("button");
        own.type = "button";
        own.id = BUTTON;
        own.innerHTML = MENU_ICONS.cake;
        own.setAttribute("aria-haspopup", "menu");
        own.setAttribute("aria-expanded", "false");
        own.addEventListener("click", (e) => {
          e.stopPropagation();
          openMenu(e.currentTarget, e.detail === 0);
        });
      }
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = STYLE3;
        document.head.append(style);
      }
      dress(own);
      const bar = document.querySelector(TOPBAR);
      const settings = bar ? [...bar.children].find((c) => c.getAttribute("data-topbar-hover-key") === "settings") ?? null : null;
      if (bar) {
        own.classList.remove("float");
        if (own.parentElement !== bar || own.nextElementSibling !== settings) bar.insertBefore(own, settings);
      } else if (!own.isConnected || own.parentElement !== document.body) {
        own.classList.add("float");
        document.body.append(own);
      }
    };
    place2();
    const timer = setInterval(place2, 1500);
    return () => {
      clearInterval(timer);
      if (own) {
        closeOpen?.(false);
        document.getElementById(POP)?.remove();
      }
      drop();
    };
  }

  // src/ui/viewer.ts
  var STYLE4 = `
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
/* the reply's own words around a page (a story before it, a note after it) */
.body .prose { white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px 14px; font-size: 14px; line-height: 1.55; }
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
      const token = newId("probe");
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
      if (!data || typeof data.viszHeight !== "number" || data.token !== this.token || !this.frame) return;
      if (event.source !== this.frame.contentWindow || this.full) return;
      const max = Math.max(200, this.deps.store.value.settings.maxFrameHeight);
      this.frame.style.height = `${Math.min(max, Math.max(120, Math.ceil(data.viszHeight) + 4))}px`;
    };
    render() {
      const entry = this.entry;
      if (!entry) return;
      const style = document.createElement("style");
      style.textContent = STYLE4;
      const out = normalizeOutput(entry.text);
      const blocks = extractHtmlBlocks(out.text);
      this.page = Math.min(this.page, Math.max(0, blocks.length - 1));
      const current = blocks[this.page];
      const panel = el("div", { class: `panel${this.full ? " full" : ""}`, part: "viewer", role: "region", "aria-label": t("Visualizer viewer", "비주얼라이저 보기") }, this.head(entry, current));
      if (blocks.length > 1) panel.append(this.pageTabs(blocks));
      panel.append(this.body(entry, out.text, blocks, current));
      this.root.replaceChildren(style, panel);
      this.panel = panel;
      if (this.full) this.applyFull();
    }
    /** The title and the buttons for the page shown. */
    head(entry, current) {
      const busy = !!this.deps.service.busy;
      return el(
        "div",
        { class: "head" },
        el("span", { class: "title", title: entry.title }, `${entry.kind === "viz" ? "🌟" : "💬"} ${entry.title}`),
        current && this.scripts === false && !fornello() && hasScripts(current.code) ? el(
          "span",
          {
            class: "chip-warn",
            title: t("Scripts are blocked; Fornello runs them", "스크립트가 막혀 있음. Fornello가 있으면 동작")
          },
          t("Scripts off", "스크립트 꺼짐")
        ) : null,
        current && !current.complete ? el("button", { class: "warn", part: "viewer-continue", title: t("Cut off: continue writing", "끊김: 이어서 쓰기"), disabled: busy, onclick: () => void this.continue() }, icon("refresh-cw"), t("Continue", "이어 쓰기")) : null,
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
    }
    /** One button per page when the reply has several. */
    pageTabs(blocks) {
      return el(
        "div",
        { class: "pages" },
        ...blocks.map((b, i) => el("button", { class: i === this.page ? "sel" : "", title: b.title, onclick: () => (this.page = i, this.render()) }, b.title ? `${i + 1}. ${b.title.slice(0, 20)}` : String(i + 1)))
      );
    }
    /** The page (in Fornello, or in a frame of our own) with the reply's words around it; the text alone when there is no page. */
    body(entry, text7, blocks, current) {
      const body = el("div", { class: "body" });
      const prose = (from, to) => {
        const words = text7.slice(from, to).trim();
        return words ? el("div", { class: "prose" }, words) : null;
      };
      const before = current ? prose(this.page > 0 ? blocks[this.page - 1].end : 0, current.start) : null;
      const after = current && this.page === blocks.length - 1 ? prose(current.end, text7.length) : null;
      if (before) body.append(before);
      this.resize?.disconnect();
      this.resize = null;
      this.mounted?.dispose();
      this.mounted = null;
      const bridge = fornello();
      if (current && bridge) {
        this.frame = null;
        const holder = el("div", { class: "fornello" });
        body.append(holder);
        this.mounted = bridge.mount(holder, current.code, entry.chatId ? { chatId: entry.chatId } : void 0);
      } else if (current) {
        this.frame = this.pageFrame(current, entry.title);
        body.append(this.frame);
      } else {
        this.frame = null;
        body.append(el("pre", {}, text7));
      }
      if (after) body.append(after);
      return body;
    }
    /** A sandboxed frame for the page; it reports its height unless scripts are blocked, then we measure it. */
    pageFrame(page, title) {
      this.token = newId("v");
      const noScripts = this.scripts === false;
      const frame = el("iframe", {
        sandbox: noScripts ? "allow-same-origin allow-popups allow-popups-to-escape-sandbox" : "allow-scripts allow-popups allow-modals allow-forms allow-downloads",
        title: page.title || title,
        referrerpolicy: "no-referrer"
      });
      frame.srcdoc = buildSrcdoc(page.code, { token: this.token, allowExternal: this.deps.store.value.settings.allowExternal });
      if (noScripts) frame.addEventListener("load", () => this.measure(frame));
      return frame;
    }
    panel = null;
    sizeButton = null;
    /**
     * Big or back above the Dock without redrawing (a running page keeps its state). Big, it is
     * a top-layer popover above Marinara's bars, so its buttons stay reachable.
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
      const fit2 = () => {
        if (this.full) return;
        const body = doc.body;
        if (!body) return;
        const cs = doc.defaultView?.getComputedStyle(body);
        const margin = cs ? parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) : 0;
        const h2 = Math.ceil(body.scrollHeight + margin);
        const max = Math.max(200, this.deps.store.value.settings.maxFrameHeight);
        frame.style.height = `${Math.min(max, Math.max(120, h2 + 4))}px`;
      };
      fit2();
      this.resize?.disconnect();
      this.resize = new ResizeObserver(fit2);
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
        if (this.deps.service.keeps("chat", entry.text) && !entry.archivedId) await this.deps.service.save(entry).catch(() => void 0);
        this.deps.ui.toast(t("Posted to the chat.", "채팅에 넣었어요."), "success", { title: "🌟" });
      }
      this.render();
    }
    async remove() {
      const entry = this.entry;
      if (!entry?.archivedId) return;
      if (!await confirmIn(this.deps.ui, t(`Delete "${entry.title}" from the Gallery?`, `갤러리에서 "${entry.title}"을(를) 지울까요?`))) return;
      await this.deps.service.archive.remove(entry.archivedId);
      this.close();
    }
    download(code, title) {
      saveBlob(new Blob([code], { type: "text/html;charset=utf-8" }), `${fileName(title)}.html`);
    }
    /** The page as it looks now, a running page included. */
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
  var fileName = (title) => title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "page";

  // src/visz/archive.ts
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
  var DB = "dispensa-visz";
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

  // src/visz/synced-archive.ts
  var BATCH = 60;
  var FORMAT = "dispensa-page";
  var SENT = "sent";
  function entryOf(raw, id) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw;
    if (r.format !== FORMAT || typeof r.text !== "string") return null;
    const str9 = (v) => typeof v === "string" && v ? v : void 0;
    return {
      id,
      title: str9(r.title) ?? "",
      kind: r.kind === "ooc" ? "ooc" : "viz",
      text: r.text,
      createdAt: Number(r.createdAt) || Date.now(),
      ...str9(r.chatId) ? { chatId: str9(r.chatId) } : {},
      ...str9(r.chatName) ? { chatName: str9(r.chatName) } : {},
      ...str9(r.character) ? { character: str9(r.character) } : {},
      ...str9(r.folder) ? { folder: str9(r.folder) } : {}
    };
  }
  var SyncedArchive = class {
    constructor(local, files, memory) {
      this.local = local;
      this.files = files;
      this.memory = memory;
    }
    syncing = null;
    async list() {
      this.syncing ??= this.sync().finally(() => this.syncing = null);
      await this.syncing.catch(() => void 0);
      return this.local.list();
    }
    async put(entry) {
      await this.local.put(entry);
      this.change((m2) => {
        if (!m2.dirty.includes(entry.id)) m2.dirty.push(entry.id);
        m2.gone = m2.gone.filter((id) => id !== entry.id);
      });
      await this.send(entry).catch(() => void 0);
    }
    async remove(id) {
      await this.local.remove(id);
      this.change((m2) => {
        delete m2.seen[id];
        m2.dirty = m2.dirty.filter((x) => x !== id);
        if (!m2.gone.includes(id)) m2.gone.push(id);
      });
      await this.files.remove(id).then(() => this.change((m2) => m2.gone = m2.gone.filter((x) => x !== id))).catch(() => void 0);
    }
    change(fn) {
      const m2 = this.memory.read();
      fn(m2);
      this.memory.write(m2);
    }
    async send(entry) {
      const { id, ...rest } = entry;
      await this.files.write(id, { format: FORMAT, version: 1, ...rest });
      this.change((m2) => {
        m2.dirty = m2.dirty.filter((x) => x !== id);
        m2.seen[id] = SENT;
      });
    }
    async sync() {
      const remote = await this.files.list();
      const mem = this.memory.read();
      let budget = BATCH;
      for (const id of mem.gone) {
        if (remote.has(id)) {
          remote.delete(id);
          if (budget <= 0) continue;
          budget--;
          await this.files.remove(id);
        }
        this.change((m2) => m2.gone = m2.gone.filter((x) => x !== id));
      }
      const local = new Map((await this.local.list()).map((e) => [e.id, e]));
      for (const [id, modified] of remote) {
        const here = local.get(id);
        const seen = this.memory.read().seen[id];
        if (here && mem.dirty.includes(id)) continue;
        if (here && (seen === void 0 || seen === SENT || seen === modified)) {
          if (seen !== modified) this.change((m2) => m2.seen[id] = modified);
          continue;
        }
        if (budget-- <= 0) break;
        const entry = entryOf(await this.files.read(id).catch(() => null), id);
        if (!entry) continue;
        await this.local.put(entry);
        this.change((m2) => m2.seen[id] = modified);
      }
      for (const [id, entry] of local) {
        const { seen, dirty } = this.memory.read();
        const changedHere = dirty.includes(id);
        if (remote.has(id) && !changedHere) continue;
        if (!remote.has(id) && seen[id] !== void 0 && !changedHere) {
          await this.local.remove(id);
          this.change((m2) => delete m2.seen[id]);
          continue;
        }
        if (budget-- <= 0) break;
        await this.send(entry).catch(() => void 0);
      }
    }
  };
  function localSyncStore(key2) {
    const empty = () => ({ seen: {}, dirty: [], gone: [] });
    return {
      read() {
        try {
          const raw = JSON.parse(localStorage.getItem(key2) ?? "null");
          return { seen: { ...raw?.seen ?? {} }, dirty: [...raw?.dirty ?? []], gone: [...raw?.gone ?? []] };
        } catch {
          return empty();
        }
      },
      write(memory) {
        try {
          localStorage.setItem(key2, JSON.stringify(memory));
        } catch {
        }
      }
    };
  }

  // src/host/gallery-files.ts
  var DIR = "dispensa/gallery";
  var child = (node, name) => node?.children?.find((c) => c.type === "folder" && c.name === name);
  var galleryFiles = {
    async list() {
      const root = await api("/game-assets/tree");
      const folder2 = child(child(root, "dispensa"), "gallery");
      const out = /* @__PURE__ */ new Map();
      for (const f of folder2?.children ?? []) {
        if (f.type !== "file" || typeof f.name !== "string" || !f.name.endsWith(".json")) continue;
        out.set(f.name.slice(0, -5), String(f.modified ?? ""));
      }
      return out;
    },
    async read(id) {
      const { content } = await api(`/game-assets/file-content/${DIR}/${encodeURIComponent(id)}.json`);
      return JSON.parse(content);
    },
    async write(id, data) {
      await api(`/game-assets/file-content/${DIR}/${encodeURIComponent(id)}.json`, { method: "PUT", body: { content: JSON.stringify(data) } });
    },
    async remove(id) {
      try {
        await api(`/game-assets/file/${DIR}/${encodeURIComponent(id)}.json`, { method: "DELETE" });
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) throw e;
      }
    }
  };

  // src/visz/last-message.ts
  var LAST_MESSAGE_PROMPT = `<System>
# ROLE

Creative Director, Narrative Technologist & Responsive Interface Architect

# PRIMARY OBJECTIVE

Your task is NOT to simply re-style or display the 'Core Input'. Your task is to act as a creative director and developer, using the 'Core Input' as a creative brief to inspire and build a completely new, context-aware, interactive, and technically robust HTML scene. You must deconstruct the input's meaning and build a new scene that represents its theme, consequence, or underlying concept.

# CRITICAL LANGUAGE INSTRUCTION

All generated user-facing text MUST be written in {{언어}}.

## 1. CREATIVE BRIEF (The Last Message)

\`\`\`text
{{장면}}
\`\`\`

## 2. DESIGN & TECHNICAL DIRECTIVES

### A. CREATIVE & AESTHETIC PRINCIPLES

- Contextual Aesthetics: The UI's entire aesthetic MUST be derived from the conversational context. Consider the relationship between {{user}} and {{char}}, their personalities, and the immediate mood to decide on colors, fonts, and overall style.
- Polished Feel: Use smooth CSS \`transitions\` for all state changes (e.g., \`:hover\`, class toggles) to create a high-quality user experience.

### B. LAYOUT & RESPONSIVENESS

- Flexible Layout: Utilize \`display: flex\` or \`display: grid\` for all layouts. Use \`flex-wrap: wrap;\` and \`gap\` for consistent, responsive item spacing.
- Relative Sizing: Primarily use relative units (\`%\`, \`em\`, \`rem\`, \`vw\`, \`vh\`). Use \`min-height\` instead of \`height\` to allow containers to grow.
- Container Sizing: Set a \`max-width\` (e.g., \`max-width: 500px;\`) and \`width: 90%;\` on the main container for readability on all screen sizes.
- Overflow Prevention: Use \`word-wrap: break-word;\` for text and \`max-width: 100%;\` for images (\`<img>\`) to prevent horizontal scrolling.

### C. INTERACTION DESIGN & PATTERNS

- Core Principle: The scene must feature multiple co-existing interactive elements.
- Content Storage: All narrative content (descriptions, stories) to be revealed via interaction MUST be stored in HTML \`data-*\` attributes.
- Modals: For detailed info, use a hidden modal \`div\`. A click on a trigger element should display the modal and populate it with content from the trigger's \`data-*\` attributes.
- Grids/Lists: For choices or items, use Flexbox or Grid. Handle all click events efficiently using Event Delegation on the parent container.
- Draggability: If draggable elements are needed, use \`position: absolute\`. The logic MUST handle both desktop (\`mousedown\`) and mobile (\`touchstart\`) events.

### D. JAVASCRIPT & STATE MANAGEMENT

- DOM Execution: All JS code MUST be enclosed in a \`DOMContentLoaded\` event listener.
- Complex State: For dynamic scenes (games, simulations), you MUST establish a central \`gameState\` JavaScript object to hold all relevant variables (e.g., score, inventory, status).
- UI Updates: All UI changes MUST be handled by a single, dedicated \`updateUI()\` function that reads from the \`gameState\` object. Do not manipulate the DOM directly from event listeners.

### E. CORE TECHNICAL MANDATES & STYLING

- Viewport: The \`<head>\` MUST include \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\`.
- CSS Reset: The CSS MUST start with a universal reset (\`* { box-sizing: border-box; margin: 0; padding: 0; }\`).
- CSS Theming: Use CSS Variables (\`:root { --primary-color: #...; }\`) to define the color palette for easy theming.
- Styling Location: All CSS MUST be inside a single \`<style>\` tag within the \`<head>\`.
- Recommended Body Layout: Start with \`body { display: grid; place-items: center; min-height: 100vh; margin: 0; overflow-x: hidden; }\` for a stable base.

### F. IMAGE SOURCING STRATEGIES (CRITICAL)

- Primary Goal: Build a visually rich scene with emojis, inline SVG drawings and external images.
- Emojis: Use for small icons, labels and status marks.
- Inline SVG Drawings: Draw the key visuals (the scene, maps, objects, the characters' belongings and rooms) as inline SVG.
- External Images: Use for the scene's mood or background. Find directly linkable images from public domain sites like Pexels, Unsplash, Pixabay. The \`src\` must point to an image file (.jpg, .png, etc.), e.g. \`https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg\`.
{{FORNELLO}}
## 3. FINAL OUTPUT FORMAT

- Enclose the entire HTML code from \`<!DOCTYPE html>\` to \`</html>\` in a single Markdown code block (\`\`\`html ... \`\`\`).
- Do not write any other text outside of this code block.
</System>`;
  function assembleLastMessage(scene, language, fornello2) {
    const section2 = fornello2?.trim() ? `
${fornello2.trim().replace(/^#+\s*(?:PART\s+\d+:\s*)?(.*)$/m, "### G. $1").replace(/^#{2,3}\s+RULES\s*$/m, "#### RULES")}
` : "";
    return applyVars(LAST_MESSAGE_PROMPT, { 언어: language, FORNELLO: section2, 장면: scene.trim() });
  }

  // src/visz/service.ts
  var MEMO_BLANK = /^(메모|memo)$/i;
  var AUTO_CONTINUE = 2;
  var ViszService = class {
    constructor(host, state, archive, viewer) {
      this.host = host;
      this.state = state;
      this.archive = archive;
      this.viewer = viewer;
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
    /** Asks for every [[blank]] ([[memo]]: picks from the memo pad); null when cancelled. */
    async askBlanks(text7, memo2) {
      const values = {};
      const pick2 = memo2 !== void 0 ? async () => memo2 : this.host.pickMemos;
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
    /** /visz: the text as a request. */
    runText(text7, options = {}) {
      return this.run(options.action ?? "viz", text7, { viszOutput: options.output, prompt: options.prompt, gallery: options.gallery });
    }
    /** Resolves true once the request went out (false when cancelled, busy or failed). */
    async run(action, content, opts = {}) {
      const filled = await this.request(action, content, opts);
      if (filled === null) return false;
      const state = this.state();
      const o = viszOptions(state);
      const last = action === "viz" && opts.prompt === "last";
      const title = (last ? t("Last message", "마지막 메시지") : titleFrom(filled)) || t("Visualizer", "비주얼라이저");
      const gallery = opts.gallery;
      if (action === "ooc") {
        const text7 = wrapOoc(o.wrapper.template, filled, state.settings.language);
        if (gallery) return this.makeForGallery(text7, { kind: "ooc", title: gallery.title || title, connectionId: gallery.connectionId || o.connectionId });
        return this.sendOoc(text7, title, o);
      }
      const prompt = await this.pagePrompt(state, filled, last);
      if (gallery) return this.makeForGallery(prompt, { kind: "viz", title: gallery.title || title, connectionId: gallery.connectionId || o.connectionId });
      return this.generateAndDeliver(prompt, { kind: "viz", title, connectionId: o.connectionId, output: opts.viszOutput ?? o.viszOutput });
    }
    /** The request with its blanks filled; null (and a toast) when busy, cancelled or empty. */
    async request(action, content, opts) {
      const ui = this.host.ui;
      if (this.busyLabel && !opts.gallery) {
        ui.toast(t("The Visualizer is already making something. Try again when it's done.", "비주얼라이저가 이미 만들고 있어요. 끝난 뒤에 다시 눌러 주세요."), "warning", { title: "🌟" });
        return null;
      }
      const filled = opts.prompt === "last" && action === "viz" ? content : await this.askBlanks(content, opts.gallery?.input);
      if (filled === null) {
        ui.toast(t("Cancelled.", "취소했어요."), "info", { title: "🌟" });
        return null;
      }
      if (!cleanOoc(filled)) {
        ui.toast(t("Nothing to send.", "보낼 내용이 비어 있어요."), "warning", { title: "🌟" });
        return null;
      }
      return filled;
    }
    /** OOC sent the chosen way: into the input, as the user, as /guided, or to the AI with the answer posted. */
    sendOoc(text7, title, o) {
      if (o.oocMode === "input") {
        this.host.putInInput(text7);
        return Promise.resolve(true);
      }
      if (o.oocMode === "user") return this.busyWhile(`💬 ${title}`, () => this.host.sendAsUser(text7));
      if (o.oocMode === "guided") return this.busyWhile(`💬 ${title}`, () => this.host.guided(text7));
      return this.generateAndDeliver(text7, { kind: "ooc", title, connectionId: o.connectionId, output: "chat" });
    }
    /** The prompt for a page (the visualizer's, or the last message's), the characters' pictures told after it. */
    async pagePrompt(state, topic, last) {
      const env = { fornello: this.host.hasFornello?.() === true };
      const language = state.settings.language;
      let prompt;
      if (last) {
        const fornello2 = env.fornello ? state.preset.chunks.find((c) => c.id === "fornello" && c.enabled !== false)?.text ?? null : null;
        prompt = assembleLastMessage(topic, language, fornello2);
      } else {
        prompt = assembleVisualizer(state.preset, resolveVizMode(state.settings.viszMode, env), { topic, language, env });
      }
      return prompt + await this.picturesNote();
    }
    /** The chat's character pictures for a page: how to use them and their names, or "" when there are none. */
    async picturesNote() {
      const list = await this.host.pictures?.().catch(() => []) ?? [];
      if (!list.length) return "";
      const byPerson = /* @__PURE__ */ new Map();
      for (const p of list) byPerson.set(p.person, [...byPerson.get(p.person) ?? [], p.name]);
      return [
        "",
        "",
        "[Character pictures]",
        // no HTML tag in it: Marinara's outgoing-prompt cleanup would take the tag out
        "The characters have their own pictures. Where a picture of them fits the page, use one of these instead of a picture from outside: write {{raw::name}} where its address goes (as an image's src value, or inside url() in CSS); it is filled in when the page is shown.",
        ...[...byPerson].map(([who, names]) => `${who}: ${names.join(", ")}`)
      ].join("\n");
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
        let text7 = normalizeOutput(await this.host.generate(prompt, o.connectionId, this.state().settings.sendPreset, true)).text;
        if (!text7) throw new Error(t("The reply was empty.", "응답이 비어 있어요."));
        for (let i = 0; i < AUTO_CONTINUE && normalizeOutput(text7).truncated; i++) text7 = await this.continueText(text7, o.connectionId);
        const entry = { title: o.title, kind: o.kind, text: text7 };
        if (o.output === "viewer") {
          this.viewer()?.show(entry);
          return;
        }
        if (o.output === "gallery") {
          await this.save(entry);
          this.host.ui.toast(t(`${o.title}: saved to the Gallery.`, `${o.title}: 갤러리에 저장했어요.`), "success", { title: "🖼" });
          return;
        }
        await this.host.postAsCharacter(text7);
        if (this.keeps("chat", text7)) await this.save(entry);
      });
    }
    /**
     * Makes it on its own connection with the chat's context (card, persona, chat, preset, lorebooks,
     * summary) and keeps it in the Gallery only; it doesn't take the visualizer's busy slot, so it can
     * run while the chat replies or another page is being made.
     */
    async makeForGallery(prompt, o) {
      const ui = this.host.ui;
      ui.toast(t(`Making ${o.title} inside the Gallery…`, `갤러리 내부에서 ${o.title} 만드는 중…`), "info", { title: "🖼" });
      try {
        const presetId = this.state().settings.galleryPresetId || void 0;
        let text7 = normalizeOutput(await this.host.generate(prompt, o.connectionId, this.state().settings.sendPreset, true, presetId)).text;
        if (!text7) throw new Error(t("The reply was empty.", "응답이 비어 있어요."));
        for (let i = 0; i < AUTO_CONTINUE && normalizeOutput(text7).truncated; i++) text7 = await this.continueText(text7, o.connectionId, presetId);
        text7 = fencedPage(text7);
        if (!this.keeps("gallery", text7, o.kind === "viz")) {
          ui.toast(this.notKept("gallery", o.title), "warning", { title: "🖼" });
          return false;
        }
        await this.save({ title: o.title, kind: o.kind, text: text7 });
        ui.toast(t(`${o.title}: saved to the Gallery.`, `${o.title}: 갤러리에 저장했어요.`), "success", { title: "🖼" });
        return true;
      } catch (e) {
        ui.toast(e instanceof Error ? e.message : String(e), "error", { title: t("🖼 Failed", "🖼 실패") });
        return false;
      }
    }
    /** Finishes the first cut-off page in the text. */
    async continueText(text7, connectionId = this.state().settings.connectionId, presetId) {
      const blocks = extractHtmlBlocks(text7);
      const index = blocks.findIndex((b) => !b.complete);
      if (index < 0) return text7;
      const more = await this.host.generate(CONTINUE_TEMPLATE.replace("{{앞부분}}", blocks[index].code), connectionId, this.state().settings.sendPreset, true, presetId);
      return replaceHtmlBlock(text7, index, mergeContinuation(blocks[index].code, more));
    }
    /** The viewer's "Continue" button. */
    async continueEntry(entry) {
      if (this.busyLabel) return null;
      let result = null;
      await this.busyWhile(t(`🌟 Continuing ${entry.title}`, `🌟 ${entry.title} 이어 쓰기`), async () => {
        result = { ...entry, text: await this.continueText(entry.text) };
        if (entry.archivedId) await this.save(result);
      });
      return result;
    }
    /** Whether the Gallery's settings keep a result: from the open chat or from a Gallery run, with or without a page. */
    keeps(from, text7, page = false) {
      const s = this.state().settings;
      if (s.collect !== "all" && s.collect !== from) return false;
      return page || !s.htmlOnly || extractHtmlBlocks(text7).length > 0;
    }
    /** Why a result wasn't kept, for the toast. */
    notKept(from, title) {
      const s = this.state().settings;
      if (s.collect !== "all" && s.collect !== from) return t(`${title}: the Gallery's settings keep only results from the chat.`, `${title}: 갤러리 설정이 채팅 결과만 저장하게 되어 있어요.`);
      return t(`${title}: no HTML page in it, and the Gallery keeps only pages.`, `${title}: HTML 페이지가 없어요. 갤러리는 HTML만 저장하게 되어 있어요.`);
    }
    async save(entry) {
      const info = await this.host.chatInfo().catch(() => ({}));
      const record = {
        id: entry.archivedId ?? newId("page"),
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
    postToChat(entry) {
      return this.busyWhile(t(`Posting ${entry.title} to chat`, `${entry.title} 채팅에 넣기`), () => this.host.postAsCharacter(entry.text));
    }
  };

  // src/visz/store.ts
  var ViszStore = class extends PersistedStore {
    constructor() {
      super({ key: "visz", normalize: normalizeViszState, label: "visz" });
    }
  };

  // src/main.ts
  async function load2(store, ui, message, what) {
    try {
      await store.load();
    } catch (e) {
      ui.toast(message, "error");
      getMarinara().log.error(`${what} load failed`, e);
    }
  }
  async function start() {
    const marinara2 = getMarinara();
    document.getElementById("dispensa-dock")?.remove();
    const theme = new ThemeSync("dispensa-theme");
    theme.start();
    const dialogs = new Dialogs();
    const host = new MarinaraHost(dialogs);
    const registry2 = createRegistry();
    const store = new QrStore();
    const viszStore = new ViszStore();
    const memoStore = new MemoStore();
    let toldSaveError = 0;
    const onSaveError = ({ full }) => {
      if (Date.now() - toldSaveError < 1e4) return;
      toldSaveError = Date.now();
      host.ui.toast(
        full ? t("Dispensa: storage is full, so changes aren't saved. Delete QR sets, memos or boards you don't use.", "Dispensa: 저장 공간이 가득 차서 변경 내용이 저장되지 않아요. 쓰지 않는 QR 세트, 메모, 보드를 지워 주세요.") : t("Dispensa: couldn't save changes. Trying again shortly.", "Dispensa: 변경 내용을 저장하지 못했어요. 잠시 뒤 다시 저장해 볼게요."),
        "error"
      );
    };
    for (const s of [store, viszStore, memoStore]) s.onSaveError = onSaveError;
    await load2(store, host.ui, t("Dispensa: couldn't load the saved QRs. Changes on this screen won't be saved.", "Dispensa: 저장된 QR을 불러오지 못했어요. 이번 화면에서는 변경 내용이 저장되지 않아요."), "QR");
    await load2(viszStore, host.ui, t("Dispensa: couldn't load the Visualizer settings. Changes on this screen won't be saved.", "Dispensa: 비주얼라이저 설정을 불러오지 못했어요. 이번 화면에서는 변경 내용이 저장되지 않아요."), "visz");
    await load2(memoStore, host.ui, t("Dispensa: couldn't load the Memo pad. Memos on this screen won't be saved.", "Dispensa: 메모장을 불러오지 못했어요. 이번 화면에서는 메모가 저장되지 않아요."), "memo");
    const scope = new ChatScopeWatch();
    const runner = new QrRunner(host, registry2, () => store.value, {
      onStart: (item) => dock.setRunning(item),
      onEnd: () => dock.setRunning(null),
      // a page a QR posted (or the reply it started) goes to the Gallery too, once
      onPosted: (item, text7) => {
        if (!visz.keeps("chat", text7) || collected.has(text7)) return;
        collected.add(text7);
        if (collected.size > 50) collected.delete(collected.values().next().value);
        void visz.save({ title: item.label, kind: extractHtmlBlocks(text7).length ? "viz" : "ooc", text: text7 }).catch((e) => marinara2.log.warn("Gallery save failed", e));
      }
    });
    const collected = /* @__PURE__ */ new Set();
    const qrControl = createQrControl(store, () => runner, () => scope.current);
    host.qr = qrControl;
    const run = (set, item) => void runner.run(set, item);
    const recent = new RecentRuns(localRecentStorage());
    const runByHand = (set, item) => {
      recent.record(set, item);
      run(set, item);
    };
    const searchIndex = indexCache();
    let viewer = null;
    const viszHost = createViszHost(host, dialogs);
    const chooseMemos = (query) => pickMemos(host.ui, memoStore, scope.current, void 0, query);
    const memoOwner = () => ownerFor(memoStore.value.savePlace ?? "all", scope.current);
    viszHost.pickMemos = () => chooseMemos();
    const archive = new SyncedArchive(createArchive(), galleryFiles, localSyncStore("dispensa-gallery-sync"));
    const visz = new ViszService(viszHost, () => viszStore.value, archive, () => viewer);
    const sendOoc = (text7) => visz.run("ooc", text7);
    const memoOut = {
      sendOoc: (text7) => sendOoc(textForAi(text7)),
      putInInput: (text7) => viszHost.putInInput(textForAi(text7)),
      makePage: (text7) => visz.run("viz", textForAi(text7))
    };
    const addMemos = (text7) => {
      const memos = memosFrom(text7, Date.now(), memoOwner());
      memoStore.update((m2) => m2.memos.push(...memos));
      return memos.length;
    };
    host.memo = { pick: chooseMemos, add: addMemos, list: (only) => (only ? memosOf(memoStore.value.memos, scope.current, only === "global" ? "all" : only) : visibleMemos(memoStore.value.memos, scope.current)).map((m2) => textForAi(m2.text)) };
    host.visz = { run: (text7, options) => visz.runText(text7, options) };
    const { galleryRun, runForGallery, openPage: openPage2, sendToBoard } = galleryActions({ ui: host.ui, runner, visz, viszStore, store, memoStore, memoOwner, viewer: () => viewer });
    const manager = new QrManager({
      store,
      registry: registry2,
      ui: host.ui,
      gallery: { service: visz, store: viszStore, qrStore: store, viewer: () => viewer, runInGallery: (set, item) => galleryRun(set, item), sendToBoard: (entry) => sendToBoard(entry) },
      run: runByHand,
      runInEditor: (set, item, options) => runner.runInEditor(set, item, options),
      memo: { store: memoStore, ...memoOut, runForGallery: (text7, about) => void runForGallery(text7, about), openPage: openPage2, fonts: installedFonts, useFont: (family) => void useFont(family), images: { list: boardImages, upload: uploadBoardImage, remove: deleteBoardImage } },
      characterName: (id) => host.characterName(id),
      connections: () => host.marinara.connections(),
      promptPresets: () => host.marinara.promptPresets(),
      viszStore,
      dockGroups: () => [...dockGroups].map(([id, g]) => ({ id, name: g.name, icon: g.icon, count: g.items.length, ...g.remove ? { remove: () => g.remove() } : {} }))
    });
    const dockGroups = /* @__PURE__ */ new Map();
    let dockBuilt = null;
    const setDockGroup = (id, group) => {
      if (group) dockGroups.set(id, group);
      else dockGroups.delete(id);
      dockBuilt?.setGroups(dockGroups);
      manager.refresh();
    };
    const unpublish = publishBridge(host, registry2, () => manager.open(), setDockGroup, () => store.value.dockVisible, (json2, name, characterId) => manager.importQrs(json2, name, characterId));
    const removeMenu = addMenuSource({ id: "dispensa", name: "Dispensa", order: 10, items: () => [
      { icon: icon("square-sparkles").outerHTML, label: t("QR library", "QR 보관함"), run: () => manager.open("qr") },
      { icon: icon("layout-dashboard").outerHTML, label: t("Memo boards", "메모 보드"), run: () => manager.open("board") },
      { icon: icon("images").outerHTML, label: t("Gallery", "갤러리"), run: () => manager.open("gallery") }
    ] });
    const stopTopMenu = keepTopMenu();
    viewer = new ViewerPanel({ service: visz, store: viszStore, ui: host.ui, onChange: () => placement.schedule() });
    const viszPanel = new ViszPanel({
      store: viszStore,
      service: visz,
      qrStore: store,
      viewer: () => viewer,
      ui: host.ui,
      close: () => dock.closeMenus(),
      openSettings: () => {
        dock.closeMenus();
        manager.open("visz");
      },
      pickMemos: () => chooseMemos(),
      addMemo: (text7) => memoStore.update((m2) => m2.memos.push(newMemo(text7, Date.now(), memoOwner()))),
      run: (set, item) => run(set, item),
      runInGallery: (set, item) => galleryRun(set, item),
      sendToBoard: (entry) => sendToBoard(entry),
      openGallery: () => manager.open("gallery")
    });
    const memoPanel = new MemoPanel({
      store: memoStore,
      ui: host.ui,
      sendOoc: memoOut.sendOoc,
      putInInput: memoOut.putInInput,
      close: () => dock.closeMenus(),
      openSettings: () => {
        dock.closeMenus();
        manager.open("memo");
      },
      scope: () => scope.current,
      openBoard: (id) => {
        dock.closeMenus();
        manager.openBoard(id);
      }
    });
    const capture = new MemoCapture((text7) => {
      const n = addMemos(text7);
      host.ui.toast(n > 1 ? t(`Added ${n} memos to the Memo pad.`, `메모 ${n}개를 메모장에 넣었어요.`) : t("Added to the Memo pad.", "메모장에 넣었어요."), "success", { title: "📝" });
    });
    const dock = new Dock({
      run: runByHand,
      stop: () => runner.stop(),
      openManager: () => manager.open("qr"),
      edit: (set, item) => manager.openItem(set.id, item.id),
      visz: { panel: viszPanel },
      memo: { panel: memoPanel },
      searchIndex: () => searchIndex.get(store.value),
      recent: () => recent.shown(store.value)
    });
    dockBuilt = dock;
    dock.setGroups(dockGroups);
    const toggle2 = new ComposerToggle(() => store.update((s) => s.dockVisible = !s.dockVisible));
    const viewChatPage = async (messageId, index) => {
      host.chat.markStale();
      const message = (await host.chat.messages()).find((m2) => m2.id === messageId);
      const fenced = message ? extractHtmlBlocks(message.content).filter((b) => /^html?$/i.test(b.lang) && message.content.startsWith("```", b.start)) : [];
      const block2 = fenced[index];
      if (!block2) {
        host.ui.toast(t("No HTML found in this message.", "이 메시지에서 HTML을 찾지 못했어요."), "warning", { title: "🌟" });
        return;
      }
      viewer?.show({ title: block2.title || t("HTML in chat", "채팅 속 HTML"), kind: "viz", text: "```html\n" + block2.code + "\n```" });
    };
    const syncVisz = () => dock.setVisz({ show: viszStore.value.settings.showButton, icon: viszStore.value.settings.dockIcon, busy: visz.busy });
    const syncMemo = () => dock.setMemo({ show: memoStore.value.showButton, icon: memoStore.value.dockIcon });
    const syncCapture = () => capture.setEnabled(memoStore.value.capture !== false);
    dock.setState(store.value);
    syncVisz();
    toggle2.setArmed(store.value.dockVisible);
    syncMemo();
    syncCapture();
    memoPanel.render();
    const unsubscribers = [
      store.subscribe(() => searchIndex.invalidate()),
      store.select(dockSlice, (s) => dock.setState(s)),
      store.select((s) => s.dockVisible, (s) => {
        toggle2.setArmed(s.dockVisible);
        window.dispatchEvent(new Event(DISPENSA_DOCK));
      }),
      // the Visualizer set's QRs are the visz menu's items
      store.select((s) => builtinSet(s, "visz")?.items.map((i) => [i.id, i.label, i.icon, i.title]) ?? null, () => viszPanel.render()),
      viszStore.select((s) => [s.settings.showButton, s.settings.dockIcon], syncVisz),
      visz.onBusy(syncVisz),
      memoStore.select((s) => [s.showButton, s.dockIcon], syncMemo),
      memoStore.select((s) => s.capture !== false, syncCapture),
      memoStore.select((s) => s.memos, () => memoPanel.render()),
      // the screen language changed: everything open draws again
      onLangChange(() => {
        dock.render();
        toggle2.setArmed(store.value.dockVisible);
        viszPanel.render();
        memoPanel.render();
        manager.refresh();
      })
    ];
    const placement = keepDockPlaced({
      dock: dock.element,
      toggle: toggle2,
      viewer: () => viewer,
      afterPlace: () => {
        theme.noticeComposer();
        addViewButtons((messageId, index) => void viewChatPage(messageId, index));
      }
    });
    const stopAutoRun = startAutoRun({
      state: () => store.value,
      scope,
      chat: host.chat,
      run: (set, item) => runner.run(set, item, { auto: true }),
      onScope: (now) => {
        manager.setScope(now);
        memoPanel.render();
      }
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") for (const s of [store, viszStore, memoStore]) void s.refresh().catch(() => void 0);
    };
    document.addEventListener("visibilitychange", onVisible);
    const flushStores = () => {
      for (const s of [store, viszStore, memoStore]) void s.flush().catch(() => void 0);
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushStores();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flushStores);
    const cleanup = () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flushStores);
      unpublish();
      stopTopMenu();
      removeMenu();
      placement.dispose();
      stopAutoRun();
      for (const off of unsubscribers) off();
      capture.dispose();
      viewer?.dispose();
      theme.stop();
      runner.stop();
      qrControl.dispose();
      manager.close();
      flushStores();
      dock.dispose();
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

-----

Lucide icons (ISC; some icons from Feather, MIT), drawn as SVG paths

ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

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
