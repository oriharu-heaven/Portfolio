(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal");
  const show = (el) => el.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    items.forEach(show);
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    items.forEach((el) => observer.observe(el));
  }

  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const active = document.activeElement;
    if (active && active.closest(".skill")) active.blur();
  });

  const sphere = document.querySelector(".skills");
  if (!sphere) return;
  const nodes = Array.from(sphere.querySelectorAll(".skill"));
  const count = nodes.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points = nodes.map((_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    return { x: Math.cos(t) * r, y, z: Math.sin(t) * r };
  });

  let radius = 0;
  let angleY = 0;
  let angleX = -0.25;
  let paused = false;
  let visible = false;

  const layout = () => {
    const width = sphere.parentElement.clientWidth;
    radius = Math.max(130, Math.min(300, width * 0.38));
    sphere.style.setProperty("--sphere-height", `${radius * 2 + 120}px`);
  };

  const render = () => {
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    points.forEach((p, i) => {
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const depth = (z2 + 1) / 2;
      const node = nodes[i];
      node.style.transform = `translate(${x1 * radius}px, ${y1 * radius}px) scale(${0.62 + depth * 0.38})`;
      node.style.setProperty("--depth", depth.toFixed(3));
      node.classList.toggle("is-back", depth < 0.42);
      node.style.zIndex = node.matches(":hover, :focus-within") ? "20" : String(Math.round(depth * 10));
    });
  };

  const tick = () => {
    if (!paused && visible) {
      angleY += 0.0035;
      render();
    }
    requestAnimationFrame(tick);
  };

  sphere.classList.add("is-sphere");
  layout();
  render();
  window.addEventListener("resize", () => {
    layout();
    render();
  });

  if (reduceMotion) return;

  const setPaused = (value) => {
    paused = value;
    render();
  };
  sphere.addEventListener("pointerenter", () => setPaused(true));
  sphere.addEventListener("pointerleave", () => setPaused(sphere.contains(document.activeElement)));
  sphere.addEventListener("focusin", () => setPaused(true));
  sphere.addEventListener("focusout", (event) => {
    if (!sphere.contains(event.relatedTarget)) setPaused(false);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    }).observe(sphere);
  } else {
    visible = true;
  }
  requestAnimationFrame(tick);
})();
