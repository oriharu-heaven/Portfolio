(() => {
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

  const navLinks = [...document.querySelectorAll(".nav a")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const setCurrent = () => {
    const line = window.innerHeight * 0.35;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${current.id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };
  setCurrent();
  window.addEventListener("scroll", setCurrent, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const active = document.activeElement;
    if (active && active.closest(".skill")) active.blur();
  });
})();
