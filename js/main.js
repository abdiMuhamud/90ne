import { MENU } from "./menu-data.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const { gsap, ScrollTrigger } = window;
const hasGsap = !!(gsap && ScrollTrigger);
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------- utils */
const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ------------------------------------------------------- open / closed */
// Hargeisa is UTC+3 with no DST. Open daily 07:00 – 24:00.
function updateOpenStatus() {
  const now = new Date();
  const h = (now.getUTCHours() + 3) % 24;
  const m = now.getUTCMinutes();
  const open = h >= 7;
  const status = $(".nav__status");
  const label = $(".js-open-status");
  const line = $(".js-open-line");
  if (open) {
    const left = 24 * 60 - (h * 60 + m);
    label.textContent = "Open now · until midnight";
    line.textContent = left <= 60 ? `Open now — closing in ${left} min` : "Open now — until midnight";
    status.classList.remove("is-closed");
  } else {
    label.textContent = "Opens 7 AM";
    line.textContent = "Closed now — we open at 7:00 AM";
    status.classList.add("is-closed");
  }
}
updateOpenStatus();
setInterval(updateOpenStatus, 60_000);
$(".js-year").textContent = new Date().getFullYear();

/* -------------------------------------------------------------- lenis */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (hasGsap) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  lenis.stop();
}

function scrollToTarget(target) {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 && id !== "#") return;
    e.preventDefault();
    closeDrawer();
    scrollToTarget(id === "#" || id === "#top" ? document.body : id);
  });
});

/* ---------------------------------------------------------------- nav */
const nav = $(".nav");
const burger = $(".nav__burger");
function closeDrawer() {
  document.body.classList.remove("nav-open");
  burger.setAttribute("aria-expanded", "false");
  $(".drawer").setAttribute("aria-hidden", "true");
  lenis?.start();
}
burger.addEventListener("click", () => {
  const open = !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", open);
  burger.setAttribute("aria-expanded", String(open));
  $(".drawer").setAttribute("aria-hidden", String(!open));
  open ? lenis?.stop() : lenis?.start();
});
addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

let lastY = 0;
function onScroll() {
  const y = scrollY;
  nav.classList.toggle("is-scrolled", y > 40);
  nav.classList.toggle("is-hidden", y > 600 && y > lastY + 4 && !document.body.classList.contains("nav-open"));
  if (y < lastY - 4) nav.classList.remove("is-hidden");
  lastY = y;
}
addEventListener("scroll", onScroll, { passive: true });

const sections = ["story", "menu", "delivery", "soon", "visit"].map((id) => document.getElementById(id));
const navLinks = $$(".nav__links a");
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => s && io.observe(s));

/* --------------------------------------------------------------- menu */
const tabsEl = $(".menu__tabs");
const panel = $(".menu__panel");
const frame = $(".menu__frame");
const capName = $(".menu__cap-name");
const capTag = $(".menu__cap-tag");
const search = $(".menu__search input");
let current = MENU[0].id;

tabsEl.innerHTML = MENU.map(
  (c, i) => `<button class="tab" role="tab" id="tab-${c.id}" aria-controls="menu-panel" aria-selected="${i === 0}" data-id="${c.id}">${esc(c.name)}</button>`
).join("");
panel.id = "menu-panel";
panel.setAttribute("role", "tabpanel");

function highlight(text, q) {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
}

function itemHTML([name, price, desc = "", star = false], q) {
  const priceHTML = Array.isArray(price)
    ? `<span class="mitem__price mitem__price--sizes">${price.map((p) => `<span>${money(p)}</span>`).join("")}</span>`
    : `<span class="mitem__price">${money(price)}</span>`;
  return `<li class="mitem">
    <div class="mitem__row"><span class="mitem__name">${highlight(name, q)}${star ? '<span class="mitem__star">✦ Signature</span>' : ""}</span><span class="mitem__dots"></span>${priceHTML}</div>
    ${desc ? `<p class="mitem__desc">${highlight(desc, q)}</p>` : ""}
  </li>`;
}

function groupHTML(g, q, label) {
  const wide = g.items.some((it) => it[2] && it[2].length > 30) || g.sizes;
  return `<div class="mgroup">
    <h3>${esc(label || g.title)}</h3>
    ${g.note ? `<p class="mgroup__note">${esc(g.note)}</p>` : ""}
    ${g.sizes ? '<div class="mgroup__sizes"><span>S</span><span>M</span><span>L</span></div>' : ""}
    <ul class="mlist ${wide ? "mlist--wide" : ""}">${g.items.map((it) => itemHTML(it, q)).join("")}</ul>
  </div>`;
}

function setVisual(cat) {
  capName.textContent = cat.name;
  capTag.textContent = cat.tag;
  const src = cat.img + (cat.img.endsWith("latte-art") ? ".webp" : "-sm.webp");
  const old = $$("img", frame);
  if (old.length && old[old.length - 1].getAttribute("src") === src) return;
  const img = new Image();
  img.src = src;
  img.alt = "";
  frame.appendChild(img);
  if (hasGsap && !reduced) {
    gsap.fromTo(img, { clipPath: "inset(100% 0 0 0)", scale: 1.25 }, {
      clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.1, ease: "expo.out",
      onComplete: () => old.forEach((o) => o.remove()),
    });
  } else old.forEach((o) => o.remove());
}

function animatePanel() {
  if (!hasGsap || reduced) return;
  gsap.fromTo($$(".mgroup h3, .mitem, .mgroup__note", panel),
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: .7, ease: "power3.out", stagger: .025, clearProps: "transform" });
}

function renderCategory(id, animate = true) {
  current = id;
  const cat = MENU.find((c) => c.id === id);
  $$(".tab", tabsEl).forEach((t) => t.setAttribute("aria-selected", String(t.dataset.id === id)));
  panel.setAttribute("aria-labelledby", "tab-" + id);
  panel.innerHTML = cat.groups.map((g) => groupHTML(g)).join("");
  setVisual(cat);
  if (animate) animatePanel();
  ScrollTrigger?.refresh?.();
}

function renderSearch(q) {
  const results = [];
  for (const cat of MENU) for (const g of cat.groups) {
    const items = g.items.filter((it) => (it[0] + " " + (it[2] || "")).toLowerCase().includes(q));
    if (items.length) results.push({ ...g, items, _label: `${cat.name} · ${g.title}`, _cat: cat });
  }
  $$(".tab", tabsEl).forEach((t) => t.setAttribute("aria-selected", "false"));
  panel.innerHTML = results.length
    ? results.map((g) => groupHTML(g, q, g._label)).join("")
    : `<p class="menu__empty">Nothing matches “${esc(q)}” — try “latte”, “tea” or “pizza”.</p>`;
  if (results[0]) setVisual(results[0]._cat);
  animatePanel();
}

tabsEl.addEventListener("click", (e) => {
  const t = e.target.closest(".tab");
  if (!t) return;
  search.value = "";
  renderCategory(t.dataset.id);
  t.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  // If the reader is deep in a long category, bring the new one into view.
  const body = $(".menu__body");
  if (body.getBoundingClientRect().top < 0) {
    if (lenis) lenis.scrollTo(body, { offset: -150, duration: 1 });
    else scrollTo({ top: scrollY + body.getBoundingClientRect().top - 150, behavior: "smooth" });
  }
});
tabsEl.addEventListener("keydown", (e) => {
  if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
  const i = MENU.findIndex((c) => c.id === current);
  const n = MENU[(i + (e.key === "ArrowRight" ? 1 : -1) + MENU.length) % MENU.length];
  renderCategory(n.id);
  $(`#tab-${n.id}`).focus();
});
let st;
search.addEventListener("input", () => {
  clearTimeout(st);
  st = setTimeout(() => {
    const q = search.value.trim().toLowerCase();
    q.length > 1 ? renderSearch(q) : renderCategory(current);
  }, 140);
});
renderCategory(current, false);

/* ------------------------------------------------------------ reviews */
const reviews = $$(".review");
let ri = 0, rTimer;
function showReview(i) {
  ri = (i + reviews.length) % reviews.length;
  reviews.forEach((r, k) => r.classList.toggle("is-active", k === ri));
  $(".reviews__count b").textContent = String(ri + 1).padStart(2, "0");
  clearInterval(rTimer);
  rTimer = setInterval(() => showReview(ri + 1), 7000);
}
$(".rv-next").addEventListener("click", () => showReview(ri + 1));
$(".rv-prev").addEventListener("click", () => showReview(ri - 1));
showReview(0);

/* ---------------------------------------------- cursor / magnetic / tilt */
if (finePointer && !reduced) {
  const cursor = $(".cursor");
  const label = $(".cursor__label");
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; });
  document.addEventListener("mouseleave", () => (cursor.style.opacity = 0));
  (function loop() {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    const lab = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button, input, .tab");
    cursor.classList.toggle("is-label", !!lab);
    cursor.classList.toggle("is-hover", !lab && !!link);
    label.textContent = lab ? lab.dataset.cursor : "";
  });

  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1), background .5s, color .5s, border-color .5s, box-shadow .5s";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 700);
    });
  });

  $$(".tilt").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform .9s cubic-bezier(.22,1,.36,1), box-shadow .6s";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 900);
    });
  });

  // 3D product stages (phone + loyalty card) follow the pointer.
  $$(".soon__stage").forEach((stage) => {
    const obj = $(".tilt-3d", stage);
    const base = obj.classList.contains("phone") ? [-18, 8, 2] : [16, 10, -4];
    const sheen = $(".loyalty__sheen", stage);
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      obj.style.transform = `rotateY(${base[0] + px * 30}deg) rotateX(${base[1] - py * 22}deg) rotateZ(${base[2]}deg)`;
      if (sheen) sheen.style.setProperty("--sx", `${px * 60}%`);
    });
    stage.addEventListener("mouseleave", () => { obj.style.transform = ""; });
  });
}

/* ------------------------------------------------------- text splitting */
function splitLines(el) {
  const html = el.innerHTML;
  // Wrap each word (keeping <em>/<br>) so we can group by rendered line.
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const words = [];
  const walk = (node, wrapEm) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) words.push({ space: true });
          else words.push({ text: w, em: wrapEm });
        });
      } else if (n.nodeName === "BR") words.push({ br: true });
      else walk(n, wrapEm || n.nodeName === "EM");
    });
  };
  walk(tmp, false);
  el.innerHTML = words.map((w) => w.br ? "<br>" : w.space ? " " : `<span class="w">${w.em ? `<em>${esc(w.text)}</em>` : esc(w.text)}</span>`).join("");
  const lines = [];
  let lastTop = null;
  $$(".w", el).forEach((w) => {
    const t = w.offsetTop;
    if (lastTop === null || Math.abs(t - lastTop) > 4) { lines.push([]); lastTop = t; }
    lines[lines.length - 1].push(w.innerHTML);
  });
  el.innerHTML = lines.map((l) => `<span class="ln"><span>${l.join(" ")}</span></span>`).join("");
  return $$(".ln > span", el);
}

/* ------------------------------------------------------------ preloader */
const loader = $(".loader");
function runLoader() {
  return new Promise((resolve) => {
    if (!hasGsap || reduced) { loader.remove(); resolve(); return; }
    const tl = gsap.timeline();
    const count = $(".loader__count");
    const obj = { v: 0 };
    tl.to(".loader__logo .draw > *", { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", stagger: .12 })
      .to(".loader__logo .flame", { strokeDashoffset: 0, duration: .8, ease: "power2.out", stagger: .1 }, "-=.6")
      .to(".loader__logo text", { opacity: 1, duration: .8, ease: "power2.out" }, "-=.5")
      .to(".loader__bar span", { scaleX: 1, duration: 2, ease: "power2.inOut" }, 0)
      .to(obj, { v: 100, duration: 2, ease: "power2.inOut", onUpdate: () => (count.textContent = Math.round(obj.v)) }, 0);
    const ready = Promise.all([
      new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }))),
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => tl.eventCallback("onComplete", r)),
    ]);
    // Never hold visitors hostage on a slow connection.
    Promise.race([ready, new Promise((r) => setTimeout(r, 4500))]).then(() => {
      gsap.to(loader, {
        clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut",
        onComplete: () => { loader.remove(); },
      });
      setTimeout(resolve, 450);
    });
  });
}

/* --------------------------------------------------------- scroll motion */
function initMotion() {
  document.body.classList.remove("is-loading");
  lenis?.start();
  window.dispatchEvent(new Event("9one:ready"));
  if (!hasGsap || reduced) {
    $$(".fade-up").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
    $$(".count").forEach((el) => (el.textContent = el.dataset.to));
    return;
  }

  // Hero intro
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hero__title .word", { yPercent: 115, rotate: 4, duration: 1.4, stagger: .08 })
    .from(".hero__eyebrow", { opacity: 0, y: 20, duration: 1 }, .2)
    .from(".hero__lede", { opacity: 0, y: 30, duration: 1.2 }, .45)
    .from(".hero__ctas .btn", { opacity: 0, y: 30, duration: 1.1, stagger: .1 }, .55)
    .from(".hero__aside .hero__stat", { opacity: 0, x: 30, duration: 1.1, stagger: .1 }, .7)
    .from(".nav", { yPercent: -100, opacity: 0, duration: 1.2 }, .3)
    .from(".hero__scroll", { opacity: 0, duration: 1 }, 1);

  gsap.to(".hero__content", {
    yPercent: -18, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // Split headings
  $$(".split").forEach((el) => {
    const lines = splitLines(el);
    gsap.from(lines, {
      yPercent: 110, rotate: 2, duration: 1.3, ease: "expo.out", stagger: .09,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  // Fade-ups
  $$(".fade-up").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // Image reveals
  $$(".reveal-img").forEach((el) => {
    const img = $("img, iframe", el);
    gsap.fromTo(el, { clipPath: "inset(18% 12% 18% 12% round 32px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
      onComplete: () => (el.style.clipPath = ""),
    });
    if (img && img.tagName === "IMG") gsap.from(img, { scale: 1.3, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
  });

  // Parallax
  $$(".parallax img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, scrub: true } });
  });
  $$(".parallax-bg").forEach((bg) => {
    gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: bg.parentElement, scrub: true } });
  });
  gsap.fromTo(".story__float", { y: 80 }, { y: -40, ease: "none", scrollTrigger: { trigger: ".story", scrub: true } });

  // Counters
  $$(".count").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +el.dataset.to, duration: 2, ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: "top 90%" },
    });
  });

  // Steps & cards
  gsap.from(".step", { opacity: 0, x: 60, duration: 1.2, ease: "expo.out", stagger: .14, scrollTrigger: { trigger: ".steps", start: "top 80%" } });
  gsap.from(".soon__card", { opacity: 0, y: 80, duration: 1.4, ease: "expo.out", stagger: .15, scrollTrigger: { trigger: ".soon__grid", start: "top 82%" } });
  gsap.from(".social-pill", { opacity: 0, y: 30, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".gallery__follow", start: "top 92%" } });
  gsap.from(".footer__grid > div", { opacity: 0, y: 30, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".footer__grid", start: "top 92%" } });

  // Menu: arched frame drift
  gsap.from(".menu", { borderRadius: "120px 120px 0 0", ease: "none", scrollTrigger: { trigger: ".menu", start: "top bottom", end: "top 40%", scrub: true } });

  // Horizontal signatures (desktop)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const track = $(".signatures__track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".signatures", start: "top top", end: () => "+=" + dist(), pin: ".signatures__pin",
        scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    gsap.from(".sig", { opacity: 0, y: 80, rotateY: -12, duration: 1.3, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".signatures", start: "top 70%" } });
  });
  mm.add("(max-width: 900px)", () => {
    gsap.from(".sig", { opacity: 0, x: 60, duration: 1.2, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".signatures__track", start: "top 85%" } });
  });

  ScrollTrigger.refresh();
}

runLoader().then(initMotion);
