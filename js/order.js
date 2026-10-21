// In-site ordering: bag, item options, checkout (delivery / pickup / dine-in)
// and hand-off to the café's WhatsApp, which is how orders reach the team today.
import { MENU } from "./menu-data.js";

const WHATSAPP = "252638833831";
const SIDES = ["Rice", "Chips", "Tortilla wrap"];
const SIZES = ["Small", "Medium", "Large"];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => "$" + n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ------------------------------------------------------------ catalogue */
const ITEMS = new Map();
for (const cat of MENU) for (const g of cat.groups) for (const [name, price, desc = ""] of g.items) {
  ITEMS.set(name, {
    name, desc, cat: cat.name, img: cat.img,
    price: Array.isArray(price) ? price : [price],
    sizes: Array.isArray(price),
    sides: cat.id === "mains",
  });
}
export const needsOptions = (name) => { const it = ITEMS.get(name); return !!(it && (it.sizes || it.sides)); };

/* -------------------------------------------------------------- storage */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const params = new URLSearchParams(location.search);
const tableFromUrl = (params.get("table") || "").trim();

const state = {
  bag: store.get("9one.bag", []), // [{key, name, option, price, qty}]
  note: "",
  step: "bag",
  mode: tableFromUrl ? "dine" : store.get("9one.mode", "delivery"),
  details: { ...store.get("9one.details", {}), table: tableFromUrl || "" },
  location: null,
};
const save = () => { store.set("9one.bag", state.bag); store.set("9one.mode", state.mode); };

const count = () => state.bag.reduce((a, l) => a + l.qty, 0);
const total = () => state.bag.reduce((a, l) => a + l.qty * l.price, 0);

/* ----------------------------------------------------------------- DOM */
document.body.insertAdjacentHTML("beforeend", `
  <button class="bagfab" aria-label="Open your order" hidden>
    <span class="bagfab__icon"><svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><b class="bagfab__count">0</b></span>
    <span class="bagfab__label">Your order</span>
    <span class="bagfab__total">$0.00</span>
  </button>

  <div class="sheet-backdrop" hidden></div>

  <aside class="bag" role="dialog" aria-modal="true" aria-label="Your order" aria-hidden="true">
    <header class="bag__head">
      <svg viewBox="0 0 360 80" class="logo bag__logo"><use href="#mark" width="132" height="80" /><text x="138" y="66" textLength="218" lengthAdjust="spacingAndGlyphs">NE CAFÉ</text></svg>
      <button class="bag__close" aria-label="Close"><span></span><span></span></button>
    </header>
    <ol class="bag__steps" aria-hidden="true">
      <li data-s="bag"><i>1</i>Bag</li><li data-s="details"><i>2</i>Details</li><li data-s="review"><i>3</i>Confirm</li>
    </ol>
    <div class="bag__notice" hidden></div>
    <div class="bag__body" data-lenis-prevent></div>
    <footer class="bag__foot"></footer>
  </aside>

  <div class="opt" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="opt__card">
      <div class="opt__img"></div>
      <div class="opt__body">
        <p class="opt__cat"></p>
        <h3 class="opt__name"></h3>
        <p class="opt__desc"></p>
        <fieldset class="opt__choices"><legend></legend><div class="opt__chips"></div></fieldset>
        <div class="opt__row">
          <div class="qty"><button data-q="-1" aria-label="Less">−</button><b>1</b><button data-q="1" aria-label="More">+</button></div>
          <button class="btn btn--gold opt__add">Add</button>
        </div>
      </div>
      <button class="opt__close" aria-label="Close"><span></span><span></span></button>
    </div>
  </div>

  <div class="toast" role="status" aria-live="polite"></div>
`);

const fab = $(".bagfab");
const bag = $(".bag");
const backdrop = $(".sheet-backdrop");
const body = $(".bag__body");
const foot = $(".bag__foot");
const notice = $(".bag__notice");
const opt = $(".opt");
const toastEl = $(".toast");

/* --------------------------------------------------------------- toast */
let toastT;
function toast(msg) {
  toastEl.innerHTML = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
}

/* ------------------------------------------------------------ bag ops */
function add(name, option = "", qty = 1, fromEl) {
  const it = ITEMS.get(name);
  if (!it) return;
  const price = it.sizes ? it.price[SIZES.indexOf(option)] : it.price[0];
  const key = name + (option ? "|" + option : "");
  const line = state.bag.find((l) => l.key === key);
  if (line) line.qty += qty;
  else state.bag.push({ key, name, option, price, qty });
  save();
  refresh();
  flyToBag(fromEl);
  toast(`<b>${esc(name)}</b>${option ? " · " + esc(option) : ""} added <button class="toast__btn" type="button">View order</button>`);
}
function setQty(key, qty) {
  const line = state.bag.find((l) => l.key === key);
  if (!line) return;
  line.qty = qty;
  if (line.qty <= 0) state.bag = state.bag.filter((l) => l !== line);
  save();
  refresh();
  if (state.step === "bag") renderStep();
}

function flyToBag(fromEl) {
  if (!fromEl || reduced || !window.gsap) return bump();
  const a = fromEl.getBoundingClientRect();
  const b = fab.getBoundingClientRect();
  const dot = document.createElement("i");
  dot.className = "fly-dot";
  document.body.appendChild(dot);
  const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
  const ex = b.width ? b.left + 30 : innerWidth - 60, ey = b.height ? b.top + b.height / 2 : innerHeight - 50;
  window.gsap.set(dot, { x: sx, y: sy });
  window.gsap.to(dot, { x: ex, duration: .75, ease: "power1.inOut" });
  window.gsap.to(dot, { y: ey, duration: .75, ease: "back.in(1.6)", onComplete: () => { dot.remove(); bump(); } });
}
function bump() {
  fab.classList.remove("is-bump");
  void fab.offsetWidth;
  fab.classList.add("is-bump");
}

/* -------------------------------------------------------- menu badges */
function refresh() {
  const n = count();
  fab.hidden = n === 0;
  document.body.classList.toggle("has-bag", n > 0);
  $(".bagfab__count").textContent = n;
  $(".bagfab__total").textContent = money(total());
  $$(".js-bag-count").forEach((el) => { el.textContent = n; el.hidden = n === 0; });
  const per = {};
  state.bag.forEach((l) => (per[l.name] = (per[l.name] || 0) + l.qty));
  $$("[data-add]").forEach((btn) => {
    const q = per[btn.dataset.add] || 0;
    btn.classList.toggle("is-in", q > 0);
    btn.querySelector(".madd__n").textContent = q || "";
  });
}
document.addEventListener("9one:menu-rendered", refresh);

/* ------------------------------------------------------------- options */
let optItem = null, optQty = 1, optChoice = "";
function openOptions(name, fromEl) {
  const it = ITEMS.get(name);
  optItem = it; optQty = 1;
  const choices = it.sizes ? SIZES : SIDES;
  optChoice = it.sizes ? "Medium" : SIDES[0];
  $(".opt__img").style.backgroundImage = `url(${it.img}${it.img.endsWith("latte-art") ? "" : "-sm"}.webp)`;
  $(".opt__cat").textContent = it.cat;
  $(".opt__name").textContent = it.name;
  $(".opt__desc").textContent = it.desc || (it.sides ? "Served with your choice of side." : "");
  $(".opt__choices legend").textContent = it.sizes ? "Choose a size" : "Choose your side";
  $(".opt__chips").innerHTML = choices.map((c, i) => `
    <label class="chip-opt"><input type="radio" name="optc" value="${c}" ${c === optChoice ? "checked" : ""} />
      <span>${c}${it.sizes ? `<small>${money(it.price[i])}</small>` : ""}</span></label>`).join("");
  updateOptButton();
  opt._from = fromEl;
  openLayer(opt);
  setTimeout(() => $(".chip-opt input:checked", opt)?.focus(), 50);
}
function updateOptButton() {
  const unit = optItem.sizes ? optItem.price[SIZES.indexOf(optChoice)] : optItem.price[0];
  $(".opt .qty b").textContent = optQty;
  $(".opt__add").textContent = `Add ${optQty} · ${money(unit * optQty)}`;
}
opt.addEventListener("change", (e) => { if (e.target.name === "optc") { optChoice = e.target.value; updateOptButton(); } });
opt.addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]");
  if (q) { optQty = Math.max(1, optQty + +q.dataset.q); updateOptButton(); }
  if (e.target.closest(".opt__add")) { closeLayer(opt); add(optItem.name, optChoice, optQty, opt._from); }
  if (e.target.closest(".opt__close") || e.target === opt) closeLayer(opt);
});

/* -------------------------------------------------------- layer control */
let openLayers = 0;
function openLayer(el) {
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-open");
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add("is-on"));
  openLayers++;
  document.body.classList.add("sheet-open");
  // Freeze the page behind so phones don't scroll it while typing in the sheet.
  document.documentElement.classList.add("sheet-lock");
  window.__lenis?.stop();
  fitSheet();
}
function closeLayer(el) {
  if (!el.classList.contains("is-open")) return;
  el.setAttribute("aria-hidden", "true");
  el.classList.remove("is-open");
  openLayers = Math.max(0, openLayers - 1);
  if (!openLayers) {
    backdrop.classList.remove("is-on");
    setTimeout(() => { if (!openLayers) backdrop.hidden = true; }, 400);
    document.body.classList.remove("sheet-open");
    document.documentElement.classList.remove("sheet-lock");
    window.__lenis?.start();
  }
}

/* ----------------------------------------------- phones: keyboard-aware sheet */
// When the on-screen keyboard opens, iOS and Android shrink the *visual* viewport but leave
// fixed elements sized to the full screen, so the sheet's buttons end up under the keyboard.
// Size and place the sheet from visualViewport instead, and go full-height while typing.
const vv = window.visualViewport;
const sheetMQ = matchMedia("(max-width: 900px)");
let baseH = vv ? vv.height : innerHeight;
const typingInBag = () => bag.contains(document.activeElement) && document.activeElement.matches("input, textarea, select");
function fitSheet() {
  if (!sheetMQ.matches) {
    bag.classList.remove("kb-open");
    bag.style.removeProperty("--sheet-top");
    bag.style.removeProperty("--sheet-h");
    return;
  }
  const h = vv ? vv.height : innerHeight;
  const top = vv ? vv.offsetTop : 0;
  const typing = typingInBag();
  if (!typing) baseH = Math.max(h, innerHeight * 0.6);
  const kb = typing && h < baseH - 120;
  bag.classList.toggle("kb-open", kb);
  const sheetH = Math.round(kb ? h : h * 0.92);
  bag.style.setProperty("--sheet-top", `${Math.round(top + h - sheetH)}px`);
  bag.style.setProperty("--sheet-h", `${sheetH}px`);
}
vv?.addEventListener("resize", fitSheet);
vv?.addEventListener("scroll", fitSheet);
addEventListener("resize", fitSheet);
addEventListener("orientationchange", () => { baseH = 0; setTimeout(fitSheet, 300); });
bag.addEventListener("focusin", (e) => {
  if (!e.target.matches("input, textarea, select")) return;
  // Wait for the keyboard animation, then keep the field in view above it.
  setTimeout(() => {
    fitSheet();
    if (document.activeElement === e.target) revealInSheet(e.target);
  }, 350);
});
bag.addEventListener("focusout", () => setTimeout(fitSheet, 150));

// Scroll only the sheet (never the page behind it) to bring an element to the middle.
function revealInSheet(el) {
  const b = body.getBoundingClientRect(), r = el.getBoundingClientRect();
  body.scrollBy({ top: r.top - b.top - (b.height - r.height) / 2, behavior: reduced ? "auto" : "smooth" });
}
backdrop.addEventListener("click", () => { closeLayer(opt); closeLayer(bag); });
addEventListener("keydown", (e) => { if (e.key === "Escape") { closeLayer(opt); closeLayer(bag); } });

export function openBag(step = "bag") {
  state.step = count() ? step : "bag";
  renderStep();
  openLayer(bag);
  setTimeout(() => $(".bag__close").focus(), 60);
}
$(".bag__close").addEventListener("click", () => closeLayer(bag));
fab.addEventListener("click", () => openBag());
toastEl.addEventListener("click", (e) => { if (e.target.closest(".toast__btn")) { toastEl.classList.remove("is-on"); openBag(); } });

/* --------------------------------------------------------------- hours */
function openNow() {
  const h = (new Date().getUTCHours() + 3) % 24; // Hargeisa, UTC+3
  return h >= 7;
}

/* --------------------------------------------------------------- steps */
function renderSteps() {
  const order = ["bag", "details", "review", "sent"];
  const i = order.indexOf(state.step);
  $$(".bag__steps li").forEach((li, k) => {
    li.classList.toggle("is-done", k < i);
    li.classList.toggle("is-now", k === i);
  });
  $(".bag__steps").hidden = state.step === "sent";
  const closed = !openNow();
  notice.hidden = !(closed || state.mode === "dine" && state.details.table);
  notice.innerHTML = closed
    ? "We’re closed right now — send your order and we’ll confirm it from <b>7:00 AM</b>."
    : `Ordering for <b>table ${esc(state.details.table)}</b> — we’ll bring it to you.`;
}

function renderStep() {
  renderSteps();
  ({ bag: renderBag, details: renderDetails, review: renderReview, sent: renderSent })[state.step]();
  body.scrollTop = 0;
  if (window.gsap && !reduced) window.gsap.from(body.children, { opacity: 0, y: 14, duration: .5, stagger: .04, ease: "power3.out", clearProps: "all" });
}

function renderBag() {
  if (!count()) {
    body.innerHTML = `<div class="bag__empty">
      <svg viewBox="0 0 132 80"><use href="#mark"/></svg>
      <h3>Your bag is empty</h3>
      <p>Tap <b>+</b> on anything in the menu — coffee, shaah, breakfast or a 9ONE pizza.</p>
      <button class="btn btn--gold" data-browse>Browse the menu</button>
    </div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = `
    <ul class="lines">${state.bag.map((l) => {
      const it = ITEMS.get(l.name);
      return `<li class="line">
        <i class="line__img" style="background-image:url(${it.img}${it.img.endsWith("latte-art") ? "" : "-sm"}.webp)"></i>
        <div class="line__txt"><b>${esc(l.name)}</b>${l.option ? `<small>${esc(l.option)}</small>` : ""}<span>${money(l.price)}</span></div>
        <div class="qty qty--sm"><button data-line="${esc(l.key)}" data-d="-1" aria-label="Remove one">−</button><b>${l.qty}</b><button data-line="${esc(l.key)}" data-d="1" aria-label="Add one">+</button></div>
      </li>`;
    }).join("")}</ul>
    <label class="field field--area"><span>Notes for the kitchen</span>
      <textarea rows="2" class="js-note" placeholder="Less sugar, no onions, extra hot…">${esc(state.note)}</textarea></label>
    <button class="bag__more" data-browse>+ Add more items</button>`;
  foot.innerHTML = `
    <div class="sum"><span>Subtotal</span><b>${money(total())}</b></div>
    <button class="btn btn--gold btn--block" data-go="details">Checkout <svg><use href="#ico-arrow"/></svg></button>`;
}

function renderDetails() {
  const d = state.details;
  const modes = [["delivery", "Delivery", "To your door"], ["pickup", "Pickup", "Collect at 9ONE"], ["dine", "Dine-in", "At your table"]];
  body.innerHTML = `
    <div class="modes" role="radiogroup" aria-label="How would you like it?">
      ${modes.map(([v, t, s]) => `<label class="mode"><input type="radio" name="mode" value="${v}" ${state.mode === v ? "checked" : ""}/><span><b>${t}</b><small>${s}</small></span></label>`).join("")}
    </div>
    <form class="form" novalidate>
      <div class="grid2">
        <label class="field"><span>Name</span><input name="name" autocomplete="name" enterkeyhint="next" autocapitalize="words" value="${esc(d.name || "")}" required placeholder="Your name" /></label>
        <label class="field"><span>Phone</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" value="${esc(d.phone || "")}" required placeholder="063 …" /></label>
      </div>
      <div class="when when--delivery">
        <label class="field"><span>Area / neighbourhood</span><input name="area" enterkeyhint="next" autocomplete="address-level3" value="${esc(d.area || "")}" placeholder="e.g. Masalaha, Jigjiga Yar, 26 June…" /></label>
        <label class="field"><span>Address & landmark</span><input name="address" enterkeyhint="go" autocomplete="street-address" value="${esc(d.address || "")}" placeholder="Street, building, nearest landmark" /></label>
        <button type="button" class="locbtn ${state.location ? "is-set" : ""}">
          <svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
          <span>${state.location ? "Location added — we’ll find you" : "Share my current location"}</span>
        </button>
      </div>
      <div class="when when--pickup">
        <label class="field"><span>Pickup time</span>
          <select name="pickup">${["As soon as possible", "In 15 minutes", "In 30 minutes", "In 45 minutes", "In 1 hour"].map((o) => `<option ${d.pickup === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
      </div>
      <div class="when when--dine">
        <label class="field"><span>Table number</span><input name="table" inputmode="numeric" enterkeyhint="go" value="${esc(d.table || "")}" placeholder="Number on your table" /></label>
      </div>
      <div class="when when--delivery when--pickup">
        <span class="field__label">Payment</span>
        <div class="pays">${["Cash", "ZAAD", "eDahab"].map((p) => `<label class="pay"><input type="radio" name="pay" value="${p}" ${(d.pay || "Cash") === p ? "checked" : ""}/><span>${p}</span></label>`).join("")}</div>
      </div>
      <p class="form__err" hidden></p>
    </form>`;
  syncMode();
  foot.innerHTML = `
    <div class="sum"><span>${count()} item${count() > 1 ? "s" : ""}</span><b>${money(total())}</b></div>
    <div class="foot2"><button class="btn btn--ghost" data-go="bag">Back</button><button class="btn btn--gold" data-go="review">Review order <svg><use href="#ico-arrow"/></svg></button></div>`;
}

function syncMode() {
  const form = $(".form", body);
  if (!form) return;
  $$(".when", form).forEach((w) => (w.hidden = !w.classList.contains("when--" + state.mode)));
}

function readForm() {
  const form = $(".form", body);
  if (!form) return true;
  const f = Object.fromEntries(new FormData(form).entries());
  Object.assign(state.details, f);
  store.set("9one.details", { name: f.name, phone: f.phone, area: f.area, address: f.address, pay: f.pay });
  const err = [];
  if (!f.name?.trim()) err.push("your name");
  if ((f.phone || "").replace(/\D/g, "").length < 7) err.push("a phone number we can call");
  if (state.mode === "delivery" && !f.area?.trim() && !state.location) err.push("your area (or share your location)");
  if (state.mode === "delivery" && !f.address?.trim() && !state.location) err.push("an address or landmark");
  if (state.mode === "dine" && !f.table?.trim()) err.push("your table number");
  const box = $(".form__err", form);
  if (err.length) {
    box.hidden = false;
    box.textContent = "Please add " + err.join(", ") + ".";
    revealInSheet(box);
    return false;
  }
  return true;
}

function orderLines() {
  return state.bag.map((l) => `• ${l.qty}× ${l.name}${l.option ? ` (${l.option})` : ""} — ${money(l.qty * l.price)}`).join("\n");
}

function renderReview() {
  const d = state.details;
  const where = {
    delivery: `<b>Delivery</b><span>${esc([d.area, d.address].filter(Boolean).join(", ") || "Shared location")}${state.location ? " · 📍 pin" : ""}</span>`,
    pickup: `<b>Pickup</b><span>${esc(d.pickup || "As soon as possible")} · 9ONE, Masalaha</span>`,
    dine: `<b>Dine-in</b><span>Table ${esc(d.table)}</span>`,
  }[state.mode];
  body.innerHTML = `
    <div class="review-card">
      <div class="rc__row">${where}</div>
      <div class="rc__row"><b>${esc(d.name)}</b><span>${esc(d.phone)}${state.mode !== "dine" ? " · " + esc(d.pay || "Cash") : ""}</span></div>
    </div>
    <ul class="rlines">${state.bag.map((l) => `<li><span>${l.qty}×</span><b>${esc(l.name)}${l.option ? `<small>${esc(l.option)}</small>` : ""}</b><em>${money(l.qty * l.price)}</em></li>`).join("")}</ul>
    ${state.note ? `<p class="rnote"><b>Note</b> ${esc(state.note)}</p>` : ""}
    <div class="rtotal"><span>Total${state.mode === "delivery" ? " before delivery" : ""}</span><b>${money(total())}</b></div>
    <p class="rsmall">${state.mode === "delivery" ? "Any delivery fee is confirmed by our team before your order goes out. " : ""}Tapping <b>Send order</b> opens WhatsApp with your order ready — just press send, and we’ll confirm it right back.</p>`;
  foot.innerHTML = `
    <div class="foot2"><button class="btn btn--ghost" data-go="details">Back</button>
    <button class="btn btn--gold js-send"><svg><use href="#ico-wa"/></svg> Send order</button></div>`;
}

let lastOrderNo = "";
function sendOrder() {
  const d = state.details;
  lastOrderNo = "9" + Math.floor(1000 + Math.random() * 9000);
  const mode = { delivery: "🛵 Delivery", pickup: "🛍️ Pickup", dine: "🍽️ Dine-in" }[state.mode];
  const lines = [
    `☕ *9ONE Café — New order #${lastOrderNo}*`,
    ``,
    `*${mode}*`,
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
  ];
  if (state.mode === "delivery") {
    if (d.area) lines.push(`Area: ${d.area}`);
    if (d.address) lines.push(`Address: ${d.address}`);
    if (state.location) lines.push(`Location: https://maps.google.com/?q=${state.location.lat},${state.location.lng}`);
  }
  if (state.mode === "pickup") lines.push(`Pickup: ${d.pickup || "As soon as possible"}`);
  if (state.mode === "dine") lines.push(`Table: ${d.table}`);
  if (state.mode !== "dine") lines.push(`Payment: ${d.pay || "Cash"}`);
  lines.push(``, `*Order*`, orderLines());
  if (state.note) lines.push(``, `📝 ${state.note}`);
  lines.push(`--------------------`, `*Total: ${money(total())}*${state.mode === "delivery" ? " + delivery" : ""}`);
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
  state._sentUrl = url;
  state.step = "sent";
  renderStep();
}

function renderSent() {
  const firstName = (state.details.name || "").split(" ")[0];
  body.innerHTML = `
    <div class="sent">
      <div class="sent__ring"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none" /><path d="M15 27l7 7 15-16" fill="none"/></svg></div>
      <p class="eyebrow">Order #${lastOrderNo}</p>
      <h3>Mahadsanid${firstName ? ", " + esc(firstName) : ""}!</h3>
      <p>Your order is ready in WhatsApp — press <b>send</b> there and our team will confirm it and the timing right away.</p>
      <a class="btn btn--ghost btn--block" href="${state._sentUrl}" target="_blank" rel="noopener"><svg><use href="#ico-wa"/></svg> WhatsApp didn’t open? Tap here</a>
      <a class="sent__call" href="tel:+${WHATSAPP}">Or call us · +252 63 883 3831</a>
    </div>`;
  foot.innerHTML = `<button class="btn btn--gold btn--block js-done">Done — start a new order</button>`;
}

/* -------------------------------------------------------------- events */
bag.addEventListener("click", (e) => {
  const t = e.target;
  const step = t.closest("[data-go]");
  if (step) {
    const to = step.dataset.go;
    document.activeElement?.blur?.(); // close the keyboard before changing step
    if (state.step === "bag") state.note = $(".js-note", body)?.value || state.note;
    if (state.step === "details" && to === "review" && !readForm()) return;
    if (state.step === "details" && to === "bag") readForm();
    state.step = to;
    renderStep();
    return;
  }
  const d = t.closest("[data-d]");
  if (d) {
    state.note = $(".js-note", body)?.value || state.note;
    const line = state.bag.find((l) => l.key === d.dataset.line);
    setQty(d.dataset.line, line.qty + +d.dataset.d);
    return;
  }
  if (t.closest("[data-browse]")) {
    state.note = $(".js-note", body)?.value || state.note;
    closeLayer(bag);
    goToMenu();
    return;
  }
  if (t.closest(".js-send")) return sendOrder();
  if (t.closest(".js-done")) {
    state.bag = []; state.note = ""; state.location = null; save(); refresh();
    closeLayer(bag);
    return;
  }
  if (t.closest(".locbtn")) return shareLocation(t.closest(".locbtn"));
});
bag.addEventListener("change", (e) => {
  if (e.target.name === "mode") { state.mode = e.target.value; save(); syncMode(); renderSteps(); }
});
// Keyboard "Next" walks the visible fields; on the last one, "Go" continues to review.
bag.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.target.matches(".form input")) return;
  e.preventDefault();
  const fields = $$(".form input:not([type=radio]), .form select", body).filter((f) => f.offsetParent);
  const next = fields[fields.indexOf(e.target) + 1];
  if (next) next.focus();
  else $('[data-go="review"]', foot)?.click();
});
bag.addEventListener("input", (e) => {
  if (e.target.classList.contains("js-note")) state.note = e.target.value;
  const err = $(".form__err", body);
  if (err && e.target.closest(".form")) err.hidden = true;
});

function shareLocation(btn) {
  if (!navigator.geolocation) return toast("Location isn’t available on this device — add a landmark instead.");
  btn.classList.add("is-busy");
  $("span", btn).textContent = "Finding you…";
  navigator.geolocation.getCurrentPosition(
    (p) => {
      state.location = { lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) };
      btn.classList.remove("is-busy"); btn.classList.add("is-set");
      $("span", btn).textContent = "Location added — we’ll find you";
    },
    () => {
      btn.classList.remove("is-busy");
      $("span", btn).textContent = "Couldn’t get location — add a landmark instead";
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* --------------------------------------------------- add buttons + CTAs */
document.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    e.preventDefault();
    const name = addBtn.dataset.add;
    if (needsOptions(name)) openOptions(name, addBtn);
    else add(name, "", 1, addBtn);
    return;
  }
  const cta = e.target.closest("[data-order]");
  if (cta) {
    e.preventDefault();
    if (cta.dataset.order === "delivery" || cta.dataset.order === "pickup") { state.mode = cta.dataset.order; save(); }
    if (count()) openBag();
    else goToMenu(true);
  }
});

function goToMenu(hint) {
  window.__closeDrawer?.();
  const target = $(".menu__tabs");
  if (window.__lenis) window.__lenis.scrollTo(target, { offset: -90, duration: 1.3 });
  else target.scrollIntoView({ behavior: "smooth" });
  if (hint) setTimeout(() => toast("Tap <b>+</b> on any item to start your order"), 900);
}

refresh();
if (tableFromUrl) setTimeout(() => toast(`Welcome — ordering for <b>table ${esc(tableFromUrl)}</b>`), 3000);
