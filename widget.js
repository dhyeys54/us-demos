/* Booking assistant: one file for demos, live one-page sites, and clients' existing sites.
   <script src="https://dhyeys54.github.io/us-demos/widget.js" data-config="<url of widget.json>" defer></script>
   widget.json: {"name", "book_noun", "phone", "faq": [{"q","a"}], "key"?, "accent"?}
   No "key" = preview: nothing leaves the page. With a Web3Forms key, requests are emailed to the business.
   Scripted answers only (no AI); they come from faq. Page buttons can call BookingWidget.open("book").
   Theme from the page: --bw-accent, --bw-on-accent, --bw-surface, --bw-bg, --bw-ink, --bw-line, --bw-radius, --bw-font,
   --bw-scheme (light | dark: native date picker and scrollbars). */
(() => {
  const me = document.currentScript;
  const cfgUrl = new URL(me.dataset.config || "widget.json", location.href);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cfg, root, log, opts, toggle, busy = Promise.resolve();
  const ready = fetch(cfgUrl).then(r => r.json()).then(c => { cfg = c; build(); });

  const ico = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  };

  const css = accent => `
  #bw-toggle, #bw { --a: var(--bw-accent, ${accent}); --oa: var(--bw-on-accent, #fff); --s: var(--bw-surface, #fff);
    --b: var(--bw-bg, #f3f4f6); --i: var(--bw-ink, #111); --l: var(--bw-line, #d9dde3); --r: var(--bw-radius, 16px);
    --f: var(--bw-font, system-ui, sans-serif); --e: cubic-bezier(.16,1,.3,1);
    font: 15px/1.5 var(--f); box-sizing: border-box; color-scheme: var(--bw-scheme, light); }
  #bw *, #bw-toggle { box-sizing: border-box; }
  #bw svg, #bw-toggle svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
  #bw-toggle { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; display: inline-flex; align-items: center; gap: 10px;
    min-height: 52px; padding: 0 22px 0 18px; border: 0; border-radius: 999px; background: var(--a); color: var(--oa);
    font: 600 15px var(--f); cursor: pointer; box-shadow: 0 10px 28px -8px rgba(0,0,0,.45); transition: transform .15s var(--e), box-shadow .2s; }
  #bw-toggle:hover { transform: translateY(-2px); box-shadow: 0 14px 32px -8px rgba(0,0,0,.5); }
  #bw-toggle:active { transform: scale(.97); }
  #bw-toggle .bw-x { display: none; }
  #bw-toggle[aria-expanded="true"] .bw-x { display: block; }
  #bw-toggle[aria-expanded="true"] .bw-c { display: none; }
  #bw { position: fixed; right: 16px; bottom: 80px; z-index: 2147483000; width: min(380px, calc(100vw - 32px)); height: min(580px, calc(100dvh - 104px));
    display: flex; flex-direction: column; background: var(--s); color: var(--i); border: 1px solid var(--l); border-radius: var(--r);
    box-shadow: 0 24px 60px -16px rgba(0,0,0,.45); overflow: hidden; text-align: left; transform-origin: 100% 100%;
    visibility: hidden; opacity: 0; transform: translateY(12px) scale(.96);
    transition: opacity .15s, transform .15s ease-in, visibility 0s .15s; }
  #bw.open { visibility: visible; opacity: 1; transform: none; transition: opacity .2s, transform .32s var(--e), visibility 0s; }
  #bw .bw-head { display: flex; align-items: center; gap: 12px; padding: 14px 10px 14px 16px; border-bottom: 1px solid var(--l); }
  #bw .bw-av { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--a); color: var(--oa); }
  #bw .bw-av svg { width: 18px; height: 18px; }
  #bw .bw-t { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
  #bw .bw-t b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #bw .bw-t span { font-size: 12.5px; opacity: .65; }
  #bw .bw-icon { width: 40px; height: 40px; border: 0; border-radius: 50%; background: none; color: inherit; display: grid; place-items: center; cursor: pointer; }
  #bw .bw-icon:hover { background: var(--b); }
  #bw .bw-log { padding: 16px 14px 8px; overflow-y: auto; flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; scroll-behavior: smooth; overscroll-behavior: contain; }
  #bw .bw-msg { padding: 10px 14px; border-radius: 18px; max-width: 86%; animation: bw-in .28s var(--e) both; overflow-wrap: anywhere; }
  #bw .bw-bot { background: var(--b); align-self: flex-start; border-bottom-left-radius: 6px; }
  #bw .bw-me { background: var(--a); color: var(--oa); align-self: flex-end; border-bottom-right-radius: 6px; }
  #bw .bw-dots { display: inline-flex; gap: 4px; padding: 14px 16px; }
  #bw .bw-dots i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .35; animation: bw-dot 1s infinite; }
  #bw .bw-dots i:nth-child(2) { animation-delay: .15s; } #bw .bw-dots i:nth-child(3) { animation-delay: .3s; }
  @keyframes bw-in { from { opacity: 0; transform: translateY(8px); } }
  @keyframes bw-dot { 30% { opacity: 1; transform: translateY(-2px); } }
  #bw .bw-opts { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px 14px; border-top: 1px solid var(--l); max-height: 52%; overflow-y: auto; }
  #bw .bw-opts:has(form) { max-height: 78%; }
  #bw .bw-opts > button { border: 1px solid var(--l); background: var(--s); color: var(--i); border-radius: 999px; padding: 8px 14px;
    font: 14px/1.3 var(--f); cursor: pointer; min-height: 40px; text-align: left; animation: bw-in .28s var(--e) both;
    transition: border-color .15s, background .15s, color .15s; }
  #bw .bw-opts > button:hover { border-color: var(--a); background: color-mix(in srgb, var(--a) 12%, var(--s)); }
  #bw .bw-opts > .bw-go { background: var(--a); border-color: var(--a); color: var(--oa); font-weight: 600; }
  #bw .bw-opts > .bw-go:hover { background: color-mix(in srgb, var(--a) 85%, #000); }
  #bw form { display: grid; gap: 10px; width: 100%; animation: bw-in .28s var(--e) both; }
  #bw label { display: grid; gap: 4px; font-size: 13px; opacity: .9; }
  #bw input, #bw textarea { font: 16px var(--f); padding: 10px 12px; border: 1px solid var(--l); border-radius: 10px; width: 100%;
    background: var(--b); color: var(--i); caret-color: var(--a); transition: border-color .15s, box-shadow .15s; resize: vertical; }
  #bw input:focus, #bw textarea:focus { outline: none; border-color: var(--a); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 25%, transparent); }
  #bw .bw-row { display: flex; gap: 8px; }
  #bw .bw-send { flex: 1; min-height: 46px; border: 0; border-radius: 10px; background: var(--a); color: var(--oa); font: 600 15px var(--f); cursor: pointer; }
  #bw .bw-send:disabled { opacity: .6; cursor: progress; }
  #bw .bw-back { min-height: 46px; padding: 0 12px; border: 1px solid var(--l); border-radius: 10px; background: none; color: inherit; font: 14px var(--f); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
  #bw .bw-back svg { width: 16px; height: 16px; }
  #bw .bw-foot { padding: 0 14px 10px; font-size: 11.5px; opacity: .55; }
  #bw .bw-trap { position: absolute; left: -9999px; }
  #bw :focus-visible, #bw-toggle:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  @media (max-width: 480px) {
    #bw { right: 8px; left: 8px; width: auto; bottom: 76px; height: calc(100dvh - 92px); }
    #bw-toggle { right: 12px; bottom: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    #bw, #bw.open { transform: none; transition: opacity .15s, visibility 0s; }
    #bw .bw-msg, #bw .bw-opts > button, #bw form { animation: none; }
    #bw .bw-dots i { animation: none; opacity: .6; }
    #bw-toggle, #bw-toggle:hover { transition: none; transform: none; }
  }`;

  function el(tag, props = {}, parent) {
    const e = Object.assign(document.createElement(tag), props);
    if (parent) parent.appendChild(e);
    return e;
  }
  const wait = ms => new Promise(r => setTimeout(r, still ? 0 : ms));
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function add(text, who) { el("div", { className: "bw-msg bw-" + who, textContent: text }, log); scroll(); }
  // bot replies wait behind a short typing indicator; queued so fast clicks keep their order
  function say(text) {
    busy = busy.then(async () => {
      const t = el("div", { className: "bw-msg bw-bot bw-dots", innerHTML: "<i></i><i></i><i></i>" }, log);
      t.setAttribute("aria-label", "typing"); scroll();
      await wait(Math.min(900, 350 + text.length * 6));
      t.remove(); add(text, "bot");
    });
    return busy;
  }
  const bookLabel = () => "Request " + cfg.book_noun;
  function menu() {
    opts.replaceChildren();
    cfg.faq.forEach((f, i) => el("button", { type: "button", textContent: f.q, style: `animation-delay:${i * 40}ms`, onclick: () => pick(f.q) }, opts));
    el("button", { type: "button", className: "bw-go", textContent: bookLabel(), style: `animation-delay:${cfg.faq.length * 40}ms`, onclick: () => pick(bookLabel()) }, opts);
  }
  function pick(q) {
    opts.replaceChildren();
    add(q, "me");
    const f = cfg.faq.find(f => f.q === q);
    if (f) say(f.a).then(menu); else say("Sure. Leave your details and we'll get back to you.").then(book);
  }
  function book() {
    const f = el("form", {}, opts);
    f.innerHTML = `<label>Name<input name="name" required autocomplete="name"></label>
      <label>Phone<input name="phone" type="tel" required autocomplete="tel"></label>
      <label>Preferred day<input name="preferred_day" type="date" required></label>
      <label>What's it about? (optional)<textarea name="details" rows="2"></textarea></label>
      <input class="bw-trap" type="checkbox" name="botcheck" tabindex="-1" aria-hidden="true">
      <div class="bw-row"><button class="bw-back" type="button">${ico.back}Back</button><button class="bw-send">Send request</button></div>`;
    f.querySelector(".bw-back").onclick = () => { add("Ask something else", "me"); say("Of course. What would you like to know?").then(menu); f.remove(); };
    f.onsubmit = e => { e.preventDefault(); send(f); };
    f.querySelector("input").focus({ preventScroll: true });
  }
  async function send(f) {
    const data = Object.fromEntries(new FormData(f));
    if (!cfg.key) {
      f.remove();
      return say(`Thanks ${data.name}! In the live version this request goes straight to ${cfg.name} by email.`).then(menu);
    }
    if (data.botcheck) return;
    const btn = f.querySelector(".bw-send");
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: cfg.key, subject: `New ${cfg.book_noun.replace(/^an? /, "")} request from ${data.name}`,
          from_name: cfg.name + " website", page: location.href, ...data }),
      });
      if (!(await r.json()).success) throw new Error();
      f.remove();
      say(`Thanks ${data.name}! ${cfg.name} has your request and will call you to confirm.`).then(menu);
    } catch {
      btn.disabled = false; btn.textContent = "Send request";
      say("Sorry, that didn't go through. Please try again" + (cfg.phone ? ` or call ${cfg.phone}.` : "."));
    }
  }
  function setOpen(open) {
    root.classList.toggle("open", open);
    root.setAttribute("aria-hidden", !open);
    toggle.setAttribute("aria-expanded", open);
    toggle.querySelector(".bw-l").textContent = open ? "Close" : "Ask us anything";
    if (open && !log.children.length) say(`Hi! I can answer common questions or take ${cfg.book_noun} request, 24/7.`).then(menu);
    if (open) setTimeout(() => (opts.querySelector("button, input") || root).focus({ preventScroll: true }), 50);
  }
  function build() {
    el("style", { textContent: css(cfg.accent || "#1f3a8a") }, document.head);
    toggle = el("button", { id: "bw-toggle", type: "button", innerHTML: `<span class="bw-c">${ico.chat}</span><span class="bw-x">${ico.close}</span><span class="bw-l">Ask us anything</span>`,
      onclick: () => setOpen(!root.classList.contains("open")) }, document.body);
    toggle.setAttribute("aria-controls", "bw"); toggle.setAttribute("aria-expanded", "false");
    root = el("div", { id: "bw", tabIndex: -1 }, document.body);
    root.setAttribute("role", "dialog"); root.setAttribute("aria-label", cfg.name + " assistant"); root.setAttribute("aria-hidden", "true");
    const head = el("div", { className: "bw-head", innerHTML: `<span class="bw-av">${ico.chat}</span>` }, root);
    const t = el("div", { className: "bw-t" }, head);
    el("b", { textContent: cfg.name }, t); el("span", { textContent: "Replies instantly, 24/7" }, t);
    const x = el("button", { type: "button", className: "bw-icon", innerHTML: ico.close, onclick: () => { setOpen(false); toggle.focus(); } }, head);
    x.setAttribute("aria-label", "Close");
    log = el("div", { className: "bw-log" }, root); log.setAttribute("aria-live", "polite");
    opts = el("div", { className: "bw-opts" }, root);
    el("div", { className: "bw-foot", textContent: cfg.key ? "Your details go only to " + cfg.name + "." : "Example assistant: nothing you type is sent." }, root);
    root.addEventListener("keydown", e => { if (e.key === "Escape") { setOpen(false); toggle.focus(); } });
  }

  window.BookingWidget = {
    open: mode => ready.then(() => {
      if (!root.classList.contains("open")) setOpen(true);
      if (mode === "book") busy.then(() => pick(bookLabel()));
    }),
  };
})();
