/* Level Zero Context — field, reveals, header state. No trackers, no deps. */
(() => {
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header: gains a backdrop once the page scrolls */
  const head = document.querySelector(".site-head");
  if (head) {
    const set = () => head.classList.toggle("is-scrolled", scrollY > 24);
    addEventListener("scroll", set, { passive: true });
    set();
  }

  /* scroll reveals */
  const revealables = [...document.querySelectorAll("[data-reveal]")];
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* the field: a quiet mesh of human + machine notation.
     Base layer renders once; each frame only redraws the lens
     around the pointer plus a handful of character flickers. */
  const canvas = document.getElementById("field");
  if (canvas) initField(canvas, reduced);

  function initField(canvas, reduced) {
    const ctx = canvas.getContext("2d");
    const host = canvas.closest(".hero") || canvas.parentElement;
    const FONT = "600 13px ui-monospace, Menlo, Consolas, monospace";
    const INK = "#e9f0e9";
    const GREEN = "#5dfca0";
    const AMBER = "#ffc96b";
    const CHARS =
      "01<>[]{}()/=+*#%&@$~^;:.,|—λΣπΔΩµ∂≈√·xkwz0123456789ЖЛДФ你私好時光현나";
    const CELL = 24;
    const R = 175;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let base = null;
    const grid = [];
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let lastMove = -1e9;
    let flickers = [];
    let raf = 0;
    let running = false;
    let t = Math.random() * 100;

    const pick = () => CHARS[(Math.random() * CHARS.length) | 0];

    function build() {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      grid.length = 0;
      for (let i = 0; i < cols * rows; i++) {
        grid.push({
          ch: pick(),
          a: 0.035 + Math.random() * 0.075,
          tint: Math.random() < 0.05,
        });
      }

      base = document.createElement("canvas");
      base.width = canvas.width;
      base.height = canvas.height;
      const b = base.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.font = FONT;
      b.textAlign = "center";
      b.textBaseline = "middle";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const g = grid[r * cols + c];
          b.globalAlpha = g.a;
          b.fillStyle = g.tint ? GREEN : INK;
          b.fillText(g.ch, (c + 0.5) * CELL, (r + 0.5) * CELL);
        }
      }
    }

    /* restore one cell from the cached base layer */
    function drawBaseCell(c, r) {
      ctx.clearRect(c * CELL, r * CELL, CELL, CELL);
      ctx.drawImage(
        base,
        c * CELL * dpr,
        r * CELL * dpr,
        CELL * dpr,
        CELL * dpr,
        c * CELL,
        r * CELL,
        CELL,
        CELL
      );
    }

    function frame() {
      raf = 0;
      if (!running) return;

      /* the canvas keeps its previous content, so clear before compositing */
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0, w, h);

      /* when the pointer rests (or never arrived), attention wanders on its own */
      const idle = performance.now() - lastMove > 3200;
      if (idle) {
        t += 0.006;
        pointer.tx =
          w * 0.5 + Math.cos(t * 0.9) * w * 0.3 + Math.cos(t * 0.31) * w * 0.12;
        pointer.ty =
          h * 0.5 + Math.sin(t * 0.7) * h * 0.28 + Math.sin(t * 0.43) * h * 0.1;
      }
      if (pointer.x < -9000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.x += (pointer.tx - pointer.x) * 0.085;
      pointer.y += (pointer.ty - pointer.y) * 0.085;

      /* halo of attention */
      const halo = ctx.createRadialGradient(
        pointer.x, pointer.y, 0,
        pointer.x, pointer.y, R
      );
      halo.addColorStop(0, "rgba(93,252,160,0.085)");
      halo.addColorStop(1, "rgba(93,252,160,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(pointer.x - R, pointer.y - R, R * 2, R * 2);

      /* glyphs resolve inside the lens */
      ctx.font = FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const c0 = Math.max(0, ((pointer.x - R) / CELL) | 0);
      const c1 = Math.min(cols - 1, ((pointer.x + R) / CELL) | 0);
      const r0 = Math.max(0, ((pointer.y - R) / CELL) | 0);
      const r1 = Math.min(rows - 1, ((pointer.y + R) / CELL) | 0);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const gx = (c + 0.5) * CELL;
          const gy = (r + 0.5) * CELL;
          const d = Math.hypot(gx - pointer.x, gy - pointer.y);
          if (d > R) continue;
          const k = 1 - d / R;
          const a = 0.1 + k * k * 0.9;
          if (a < 0.12) continue;
          ctx.globalAlpha = Math.min(1, a);
          ctx.fillStyle = k > 0.28 ? GREEN : INK;
          ctx.fillText(grid[r * cols + c].ch, gx, gy);
        }
      }
      ctx.globalAlpha = 1;

      /* stray characters flicker and settle */
      if (Math.random() < 0.05 && flickers.length < 9) {
        const c = (Math.random() * cols) | 0;
        const r = (Math.random() * rows) | 0;
        drawBaseCell(c, r);
        flickers.push({
          c,
          r,
          ch: pick(),
          age: 0,
          ttl: 18 + Math.random() * 37,
          amber: Math.random() < 0.3,
        });
      }
      for (let i = flickers.length - 1; i >= 0; i--) {
        const f = flickers[i];
        f.age++;
        drawBaseCell(f.c, f.r);
        if (f.age < f.ttl) {
          ctx.font = FONT;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = Math.min(
            0.9,
            0.25 + 0.65 * Math.sin((Math.PI * f.age) / f.ttl)
          );
          ctx.fillStyle = f.amber ? AMBER : GREEN;
          ctx.fillText(f.ch, (f.c + 0.5) * CELL, (f.r + 0.5) * CELL);
        } else {
          flickers.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    host.addEventListener(
      "pointermove",
      (e) => {
        const rect = canvas.getBoundingClientRect();
        pointer.tx = e.clientX - rect.left;
        pointer.ty = e.clientY - rect.top;
        lastMove = performance.now();
      },
      { passive: true }
    );
    host.addEventListener("pointerleave", () => {
      pointer.tx = -9999;
      pointer.ty = -9999;
      lastMove = -1e9;
    });

    new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop())
    ).observe(canvas);
    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start()
    );

    let resizeTimer;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (reduced) ctx.drawImage(base, 0, 0, w, h);
      }, 150);
    });

    build();
    if (reduced) ctx.drawImage(base, 0, 0, w, h);
    else start();
  }
})();
