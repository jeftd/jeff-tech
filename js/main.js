/* =========================================================
   Jeff Technologies — main.js
   1) Red de nodos animada (canvas)  · la firma del sitio
   2) Reveal en scroll
   3) Menú móvil
   ========================================================= */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1) Red de nodos ---------- */
  const canvas = document.getElementById("net");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, nodes = [], raf = null;
    const mouse = { x: -9999, y: -9999 };

    const COLORS = { node: "#5FE3E8", line: "95, 227, 232", gold: "#D4AF6A" };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      // Densidad según área, con tope para móviles
      const count = Math.min(72, Math.max(26, Math.floor((w * h) / 20000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 1,
          gold: Math.random() < 0.08,
        });
      }
    }

    const LINK = 150;      // distancia de conexión entre nodos
    const MOUSE_LINK = 200;

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Conexiones nodo-nodo
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const a = (1 - dist / LINK) * 0.5;
            ctx.strokeStyle = `rgba(${COLORS.line}, ${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        // Conexión al cursor (interacción sutil)
        const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < MOUSE_LINK) {
          const a = (1 - md / MOUSE_LINK) * 0.7;
          ctx.strokeStyle = `rgba(212, 175, 106, ${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Nodo
        ctx.beginPath();
        ctx.fillStyle = n.gold ? COLORS.gold : COLORS.node;
        ctx.globalAlpha = n.gold ? 0.9 : 0.65;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    }

    function drawStatic() {
      // Versión sin animación para prefers-reduced-motion
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dist = Math.hypot(n.x - m.x, n.y - m.y);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${COLORS.line}, ${(1 - dist / LINK) * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.fillStyle = n.gold ? COLORS.gold : COLORS.node;
        ctx.globalAlpha = 0.7;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function start() {
      size();
      build();
      if (raf) cancelAnimationFrame(raf);
      if (reduceMotion) drawStatic();
      else frame();
    }

    window.addEventListener("resize", start);
    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });

    // Pausa cuando el hero no está visible (ahorra batería)
    if (!reduceMotion && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { if (!raf) frame(); }
          else if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.02 }).observe(canvas);
    }

    start();
  }

  /* ---------- 2) Reveal en scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- 3) Menú móvil ---------- */
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  /* Año dinámico en footer */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
