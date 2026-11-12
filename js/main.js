(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealItems = document.querySelectorAll(".reveal");
  const reveal = (el) => el.classList.add("is-visible");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach(reveal);
  }

  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const dialog = document.getElementById("work-dialog");
  const dialogContent = dialog.querySelector(".modal__content");
  let lastTrigger = null;

  const openWork = (id, trigger) => {
    const source = document.getElementById(`detail-${id}`);
    if (!source || typeof dialog.showModal !== "function") {
      document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    dialogContent.replaceChildren(...Array.from(source.childNodes, (node) => node.cloneNode(true)));
    lastTrigger = trigger || document.querySelector(`[data-work="${id}"]`);
    dialog.showModal();
    dialog.scrollTop = 0;
  };

  document.querySelectorAll(".card__open").forEach((button) => {
    button.addEventListener("click", () => openWork(button.dataset.work, button));
  });

  dialog.querySelector(".modal__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    dialogContent.replaceChildren();
    lastTrigger?.focus();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-open]");
    if (!link) return;
    event.preventDefault();
    openWork(link.dataset.open);
  });

  setupSkills();

  function setupSkills() {
    const area = document.querySelector(".skills-area");
    const sphere = area?.querySelector(".skills");
    const panel = area?.querySelector(".skill-panel");
    if (!sphere || !panel) return;

    const nodes = Array.from(sphere.querySelectorAll(".skill"));
    const golden = Math.PI * (3 - Math.sqrt(5));
    const points = nodes.map((_, i) => {
      const y = 1 - (i / (nodes.length - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      return { x: Math.cos(golden * i) * r, y, z: Math.sin(golden * i) * r };
    });

    let radius = 0;
    let angleY = 0;
    let angleX = -0.25;
    let speed = 0.004;
    let targetSpeed = 0.004;
    let dragging = null;
    let visible = !("IntersectionObserver" in window);
    let active = null;

    const select = (node) => {
      if (active === node) return;
      active?.classList.remove("is-active");
      active = node;
      node.classList.add("is-active");
      const pop = node.querySelector(".skill__pop");
      panel.replaceChildren(...Array.from(pop.childNodes, (child) => child.cloneNode(true)));
      panel.hidden = false;
    };

    nodes.forEach((node) => {
      const button = node.querySelector(".skill__icon");
      button.addEventListener("pointerenter", () => select(node));
      button.addEventListener("focus", () => select(node));
      button.addEventListener("click", () => select(node));
    });

    const layout = () => {
      radius = Math.max(120, Math.min(250, area.clientWidth * 0.34));
      sphere.style.setProperty("--sphere-height", `${radius * 2 + 110}px`);
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
        const depth = (p.y * sinX + z1 * cosX + 1) / 2;
        const node = nodes[i];
        node.style.transform = `translate(${x1 * radius}px, ${y1 * radius}px) scale(${0.6 + depth * 0.4})`;
        node.style.setProperty("--depth", depth.toFixed(3));
        node.style.zIndex = String(Math.round(depth * 100));
        node.classList.toggle("is-back", depth < 0.4);
      });
    };

    sphere.classList.add("is-sphere");
    layout();
    render();
    window.addEventListener("resize", () => {
      layout();
      render();
    });

    if (reduceMotion) return;

    sphere.addEventListener("pointerenter", () => {
      targetSpeed = 0.0015;
    });
    sphere.addEventListener("pointerleave", () => {
      targetSpeed = 0.004;
    });
    sphere.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = { x: event.clientX, y: event.clientY, moved: false };
    });
    window.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - dragging.x;
      const dy = event.clientY - dragging.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
      angleY += dx * 0.008;
      angleX = Math.max(-1.2, Math.min(1.2, angleX - dy * 0.008));
      speed = dx * 0.0008;
      dragging.x = event.clientX;
      dragging.y = event.clientY;
    });
    window.addEventListener("pointerup", () => {
      dragging = null;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      }).observe(sphere);
    }

    const tick = () => {
      if (visible) {
        if (!dragging) {
          speed += (targetSpeed - speed) * 0.05;
          angleY += speed;
        }
        render();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
