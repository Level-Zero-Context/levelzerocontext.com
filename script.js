/* Level Zero Context — Landing Edition
   Island Nav, Blur Reveals (IntersectionObserver), Wort Reveal.
   Kein Tracking, keine externen Aufrufe. */
(() => {
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* burger + overlay */
  const burger = document.querySelector(".burger");
  const overlay = document.querySelector(".nav-overlay");
  if (burger && overlay) {
    const setOpen = (open) => {
      burger.classList.toggle("open", open);
      overlay.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setOpen(!burger.classList.contains("open")));
    overlay.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* scroll reveals */
  const revealables = [...document.querySelectorAll(".reveal")];
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* tagline: each word wakes up as it enters the viewport */
  const words = [...document.querySelectorAll(".tagline .w")];
  if (words.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      words.forEach((w) => w.classList.add("on"));
    } else {
      const wordIo = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("on");
              wordIo.unobserve(entry.target);
            }
          }
        },
        { threshold: 1, rootMargin: "0px 0px -12% 0px" }
      );
      words.forEach((w) => wordIo.observe(w));
    }
  }
})();
