const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  navigation.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
}

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();

const carousel = document.querySelector("[data-banner-carousel]");
if (carousel) {
  const track = carousel.querySelector(".banner-track");
  const slides = [...carousel.querySelectorAll(".banner-slide")];
  const dots = [...carousel.querySelectorAll("[data-banner-dot]")];
  const pauseButton = carousel.querySelector("[data-banner-pause]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = 0;
  let paused = reduceMotion;

  const show = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.setAttribute("aria-hidden", String(!active));
      slide.setAttribute("aria-label", `Slide ${slideIndex + 1} of ${slides.length}`);
      if (active) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.setAttribute("aria-selected", String(active));
      dot.tabIndex = active ? 0 : -1;
    });
  };

  const stop = () => window.clearInterval(timer);

  const start = () => {
    stop();
    if (paused || slides.length < 2) return;
    timer = window.setInterval(() => show(index + 1), 6000);
  };

  const go = (nextIndex) => {
    show(nextIndex);
    start();
  };

  carousel.querySelector("[data-banner-prev]").addEventListener("click", () => go(index - 1));
  carousel.querySelector("[data-banner-next]").addEventListener("click", () => go(index + 1));
  dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => go(dotIndex)));
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play" : "Pause";
    if (paused) stop();
    else start();
  });
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  });

  let pointerStart = null;
  carousel.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    pointerStart = event.clientX;
  });
  carousel.addEventListener("pointerup", (event) => {
    if (pointerStart == null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? index + 1 : index - 1);
  });

  if (reduceMotion) {
    pauseButton.setAttribute("aria-pressed", "true");
    pauseButton.textContent = "Play";
  }
  show(0);
  start();
}
