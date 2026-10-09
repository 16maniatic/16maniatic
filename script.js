document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Navegación ----------
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("nav-menu");

const setMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menu.classList.toggle("is-open", open);
};

toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
  setMenu(false);
  toggle.focus();
});
// Cierra el menú al tocar fuera de la barra
document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setMenu(false); });

window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

// Resalta el enlace de la sección visible
const links = [...menu.querySelectorAll("a")];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => a.classList.toggle("is-active", a.hash === `#${entry.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

// ---------- Animaciones de entrada ----------
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("is-visible");
    obs.unobserve(el);
    // Una vez terminada la entrada, quita los retrasos para que el hover responda al instante
    setTimeout(() => el.classList.add("is-done"), 1800);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

document.querySelectorAll(".reveal").forEach((el) => {
  // Escalonado entre bloques hermanos (p. ej. las tres columnas de habilidades)
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.setProperty("--d", `${siblings.indexOf(el) * 90}ms`);
  revealObserver.observe(el);
});

// Numera los elementos de cada lista para escalonarlos desde CSS
document.querySelectorAll(".tags, .list, .timeline__list").forEach((list) => {
  [...list.children].forEach((li, i) => li.style.setProperty("--i", i));
});

// ---------- Foco de luz que sigue al cursor ----------
if (window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".spot").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

// ---------- Copiar correo ----------
const copyBtn = document.getElementById("copy-mail");
const mailStatus = document.querySelector(".mail__status");
let statusTimer;

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.mail);
    copyBtn.textContent = "Copiada ✓";
    copyBtn.classList.remove("is-done");
    void copyBtn.offsetWidth; // reinicia la animación si se pulsa varias veces
    copyBtn.classList.add("is-done");
    mailStatus.textContent = "Dirección copiada al portapapeles.";
  } catch {
    mailStatus.textContent = `No se pudo copiar. La dirección es ${copyBtn.dataset.mail}`;
  }
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    copyBtn.textContent = "Copiar dirección";
    copyBtn.classList.remove("is-done");
    mailStatus.textContent = "";
  }, 2500);
});

// ---------- Campo de estrellas ----------
(() => {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h, dpr, stars = [], streak = null, nextStreak = performance.now() + 6000;

  // Tres capas de profundidad: cuanto más cerca, más grande, brillante, más parallax
  // y más rápida la deriva (px/s), lo que da sensación de viaje por el espacio
  const LAYERS = [
    { density: 0.00018, size: [0.3, 0.7], alpha: [0.25, 0.55], parallax: 0.03, drift: 4 },
    { density: 0.00007, size: [0.6, 1.1], alpha: [0.45, 0.8], parallax: 0.07, drift: 10 },
    { density: 0.00002, size: [1.0, 1.6], alpha: [0.7, 1.0], parallax: 0.14, drift: 22 },
  ];
  // Dirección de la deriva: hacia la izquierda y ligeramente hacia arriba
  const DRIFT_X = -Math.cos(0.2), DRIFT_Y = -Math.sin(0.2);
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    // En móvil, la barra de direcciones cambia el alto al hacer scroll:
    // si sólo varía un poco el alto, ajustamos el lienzo sin regenerar las estrellas.
    const sameWidth = window.innerWidth === w;
    const smallHeightChange = Math.abs(window.innerHeight - h) < 160;
    if (sameWidth && smallHeightChange && stars.length) {
      h = window.innerHeight;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = [];
    LAYERS.forEach((layer) => {
      const count = Math.round(w * h * layer.density);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(...layer.size),
          a: rand(...layer.alpha),
          p: layer.parallax,
          v: layer.drift * rand(0.85, 1.15),
          tw: rand(0.4, 1.6),   // velocidad de titileo
          ph: Math.random() * Math.PI * 2,
          tint: Math.random() < 0.15 ? "200,215,255" : "255,255,255",
        });
      }
    });
  }

  function spawnStreak(now) {
    // Estela plateada que cruza en diagonal: un pequeño guiño al Silver Surfer
    const fromLeft = Math.random() < 0.5;
    streak = {
      x: fromLeft ? -100 : w + 100,
      y: rand(h * 0.05, h * 0.5),
      vx: (fromLeft ? 1 : -1) * rand(9, 13),
      vy: rand(1.5, 3.5),
      len: rand(140, 240),
    };
    nextStreak = now + rand(9000, 16000);
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const scroll = window.scrollY;

    for (const s of stars) {
      const t = now / 1000;
      const x = (((s.x + t * s.v * DRIFT_X) % w) + w) % w;
      const y = (((s.y + t * s.v * DRIFT_Y - scroll * s.p) % h) + h) % h;
      const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(now * 0.001 * s.tw + s.ph);
      ctx.fillStyle = `rgba(${s.tint},${s.a * twinkle})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.3) {
        // Halo suave para las estrellas más cercanas
        ctx.fillStyle = `rgba(${s.tint},${0.08 * twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!reduceMotion) {
      if (!streak && now > nextStreak) spawnStreak(now);
      if (streak) {
        const { x, y, vx, vy, len } = streak;
        const mag = Math.hypot(vx, vy);
        const tx = x - (vx / mag) * len;
        const ty = y - (vy / mag) * len;
        const g = ctx.createLinearGradient(x, y, tx, ty);
        g.addColorStop(0, "rgba(255,255,255,0.9)");
        g.addColorStop(0.3, "rgba(205,214,228,0.35)");
        g.addColorStop(1, "rgba(205,214,228,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        streak.x += vx;
        streak.y += vy;
        if (streak.x < -400 || streak.x > w + 400 || streak.y > h + 400) streak = null;
      }
      requestAnimationFrame(draw);
    }
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(0); }, 150);
  });
  if (reduceMotion) window.addEventListener("scroll", () => draw(0), { passive: true });

  resize();
  reduceMotion ? draw(0) : requestAnimationFrame(draw);
})();
