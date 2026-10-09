(() => {
  const root = document.documentElement;

  const updateViewport = () => {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const width = viewport ? viewport.width : window.innerWidth;

    root.style.setProperty("--app-height", `${Math.round(height)}px`);
    root.style.setProperty("--app-width", `${Math.round(width)}px`);
    root.classList.toggle("mobile-landscape", width > height);
    root.classList.toggle("mobile-portrait", width <= height);
  };

  updateViewport();
  window.addEventListener("resize", updateViewport, { passive: true });
  window.addEventListener("orientationchange", updateViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });

  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false },
  );
})();
