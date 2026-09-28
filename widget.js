/* Booking assistant: one file for demos, live one-page sites, and clients' existing sites.
   <script src="https://dhyeys54.github.io/us-demos/widget.js" data-config="<url of widget.json>" defer></script>
   widget.json: {"name", "book_noun", "phone", "faq": [{"q","a"}], "key"?, "accent"?}
   No "key" = preview: nothing leaves the page. With a Web3Forms key, requests are emailed to the business.
   Scripted answers only (no AI); they come from faq. Page buttons can call BookingWidget.open("book"). */
(() => {
  const me = document.currentScript;
  const cfgUrl = new URL(me.dataset.config || "widget.json", location.href);
  let cfg, root, log, opts, toggle;
  const ready = fetch(cfgUrl).then(r => r.json()).then(c => { cfg = c; build(); });

  const css = accent => `
  #bw-toggle, #bw { --a: var(--bw-accent, ${accent}); --oa: var(--bw-on-accent, #fff); --s: var(--bw-surface, #fff);
    --b: var(--bw-bg, #f3f4f6); --i: var(--bw-ink, #111); --l: var(--bw-line, #d9dde3); --r: var(--bw-radius, 14px);
    --f: var(--bw-font, system-ui, sans-serif); font: 15px/1.5 var(--f); box-sizing: border-box; }
  #bw *, #bw-toggle { box-sizing: border-box; }
  #bw-toggle { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; min-height: 48px; padding: 12px 20px; border: 0;
    border-radius: 999px; background: var(--a); color: var(--oa); font-weight: 600; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  #bw { position: fixed; right: 16px; bottom: 80px; z-index: 2147483000; width: min(360px, calc(100vw - 32px)); max-height: 70vh;
    display: none; flex-direction: column; background: var(--s); color: var(--i); border: 1px solid var(--l);
    border-radius: var(--r); box-shadow: 0 16px 48px rgba(0,0,0,.28); overflow: hidden; text-align: left; }
  #bw.open { display: flex; animation: bw-pop .18s ease-out; }
  @keyframes bw-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } }
  #bw .bw-head { background: var(--a); color: var(--oa); padding: 14px 16px; font-weight: 700; }
  #bw .bw-log { padding: 14px; overflow-y: auto; flex: 1 0 120px; display: flex; flex-direction: column; gap: 8px; }
  #bw .bw-msg { padding: 10px 12px; border-radius: 12px; max-width: 85%; }
  #bw .bw-bot { background: var(--b); align-self: flex-start; }
  #bw .bw-me { background: var(--a); color: var(--oa); align-self: flex-end; }
  #bw .bw-opts { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 14px; overflow-y: auto; min-height: 0; }
  #bw .bw-opts > button { border: 1px solid var(--l); background: var(--b); color: var(--i); border-radius: 999px; padding: 8px 12px;
    font: 14px var(--f); cursor: pointer; min-height: 40px; }
  #bw form { display: grid; gap: 8px; width: 100%; }
  #bw label { display: grid; gap: 4px; font-size: 14px; }
  #bw input, #bw textarea { font: 16px var(--f); padding: 10px; border: 1px solid var(--l); border-radius: 8px; width: 100%;
    background: var(--b); color: var(--i); }
  #bw .bw-send { min-height: 44px; border: 0; border-radius: 8px; background: var(--a); color: var(--oa); font: 600 15px var(--f); cursor: pointer; }
  #bw .bw-send:disabled { opacity: .6; }
  #bw .bw-trap { position: absolute; left: -9999px; }
  #bw :focus-visible, #bw-toggle:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { #bw.open { animation: none; } }`;

  function el(tag, props = {}, parent) {
    const e = Object.assign(document.createElement(tag), props);
    if (parent) parent.appendChild(e);
    return e;
  }
  function say(text, who = "bot") {
    el("div", { className: "bw-msg bw-" + who, textContent: text }, log);
    log.scrollTop = log.scrollHeight;
  }
  const bookLabel = () => "Request " + cfg.book_noun;
  function menu() {
    opts.replaceChildren();
    [...cfg.faq.map(f => f.q), bookLabel()].forEach(q => el("button", { type: "button", textContent: q, onclick: () => pick(q) }, opts));
  }
  function pick(q) {
    say(q, "me");
    const f = cfg.faq.find(f => f.q === q);
    if (f) { say(f.a); menu(); } else book();
  }
  function book() {
    say("Sure. Leave your details and we'll get back to you.");
    opts.replaceChildren();
    const f = el("form", {}, opts);
    f.innerHTML = `<label>Name<input name="name" required autocomplete="name"></label>
      <label>Phone<input name="phone" type="tel" required autocomplete="tel"></label>
      <label>Preferred day<input name="preferred_day" type="date" required></label>
      <label>What's it about? (optional)<textarea name="details" rows="2"></textarea></label>
      <input class="bw-trap" type="checkbox" name="botcheck" tabindex="-1" aria-hidden="true">
      <button class="bw-send">Send request</button>`;
    f.onsubmit = e => { e.preventDefault(); send(f); };
  }
  async function send(f) {
    const data = Object.fromEntries(new FormData(f));
    if (!cfg.key) {
      say(`Thanks ${data.name}! In the live version this request goes straight to ${cfg.name} by phone and email, and you'd get a confirmation text.`);
      return menu();
    }
    if (data.botcheck) return;
    const btn = f.querySelector("button");
    btn.disabled = true; btn.textContent = "Sending...";
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: cfg.key, subject: `New ${cfg.book_noun.replace(/^an? /, "")} request from ${data.name}`,
          from_name: cfg.name + " website", page: location.href, ...data }),
      });
      if (!(await r.json()).success) throw new Error();
      say(`Thanks ${data.name}! ${cfg.name} has your request and will call you to confirm.`);
      menu();
    } catch {
      btn.disabled = false; btn.textContent = "Send request";
      say("Sorry, that didn't go through. Please try again" + (cfg.phone ? ` or call ${cfg.phone}.` : "."));
    }
  }
  function setOpen(open) {
    root.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    if (open && !log.children.length) { say(`Hi! I can answer common questions or take ${cfg.book_noun} request, 24/7.`); menu(); }
    if (open) (opts.querySelector("button, input") || root).focus();
  }
  function build() {
    el("style", { textContent: css(cfg.accent || "#1f3a8a") }, document.head);
    toggle = el("button", { id: "bw-toggle", type: "button", textContent: "Ask us anything", onclick: () => setOpen(!root.classList.contains("open")) }, document.body);
    toggle.setAttribute("aria-controls", "bw"); toggle.setAttribute("aria-expanded", "false");
    root = el("div", { id: "bw", tabIndex: -1 }, document.body);
    root.setAttribute("role", "dialog"); root.setAttribute("aria-label", cfg.name + " assistant");
    el("div", { className: "bw-head", textContent: cfg.name + " assistant" }, root);
    log = el("div", { className: "bw-log" }, root); log.setAttribute("aria-live", "polite");
    opts = el("div", { className: "bw-opts" }, root);
    root.addEventListener("keydown", e => { if (e.key === "Escape") { setOpen(false); toggle.focus(); } });
  }

  window.BookingWidget = {
    open: mode => ready.then(() => {
      if (!root.classList.contains("open")) setOpen(true);
      if (mode === "book") pick(bookLabel());
    }),
  };
})();
