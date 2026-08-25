(() => {
  "use strict";

  const AUTO_SCROLL_DELAY = 3000;
  const AUTO_SCROLL_SPEED = 18;
  const INTERACTION_PAUSE = 3000;
  const viewport = document.querySelector("#ssf-timeline-viewport");
  const track = document.querySelector("#ssf-timeline-track");
  const previousButton = document.querySelector('[data-direction="previous"]');
  const nextButton = document.querySelector('[data-direction="next"]');
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let entries = [];
  let animationFrame = 0;
  let autoScrollPosition = 0;
  let lastFrameTime = 0;
  let resumeTimer = 0;
  let hasEnteredViewport = false;
  let interactionPaused = false;

  const escapeHtml = (value) => {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
  };

  const safeImageUrl = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  const cardMarkup = (entry, index) => {
    const image = safeImageUrl(entry.image);
    const imageMarkup = image
      ? `<img class="ssf-timeline__image" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">`
      : "";

    return `
      <article class="ssf-timeline__entry" data-index="${index}">
        <span class="ssf-timeline__marker" aria-hidden="true"></span>
        <div class="ssf-timeline__card">
          ${imageMarkup}
          <h2 class="ssf-timeline__year">${escapeHtml(entry.year)}</h2>
          <p class="ssf-timeline__content">${escapeHtml(entry.content)}</p>
        </div>
      </article>`;
  };

  const cards = () => [...track.querySelectorAll(".ssf-timeline__entry")];

  const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const updateControls = () => {
    const maximum = maxScroll();
    previousButton.disabled = viewport.scrollLeft <= 2;
    nextButton.disabled = viewport.scrollLeft >= maximum - 2;
  };

  const nearestCardIndex = () => {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    const timelineCards = cards();
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    timelineCards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const scrollToCard = (index) => {
    const card = cards()[Math.max(0, Math.min(index, entries.length - 1))];
    if (!card) return;
    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  const stopAutoScroll = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameTime = 0;
  };

  const autoScroll = (time) => {
    if (interactionPaused || reducedMotion.matches || !hasEnteredViewport) {
      stopAutoScroll();
      return;
    }

    if (!lastFrameTime) lastFrameTime = time;
    const elapsed = Math.min(time - lastFrameTime, 50);
    lastFrameTime = time;
    autoScrollPosition += (AUTO_SCROLL_SPEED * elapsed) / 1000;
    viewport.scrollLeft = autoScrollPosition;
    updateControls();

    if (viewport.scrollLeft < maxScroll() - 1) {
      animationFrame = window.requestAnimationFrame(autoScroll);
    } else {
      stopAutoScroll();
    }
  };

  const startAutoScroll = () => {
    if (animationFrame || reducedMotion.matches || interactionPaused || !hasEnteredViewport) return;
    autoScrollPosition = viewport.scrollLeft;
    animationFrame = window.requestAnimationFrame(autoScroll);
  };

  const pauseForInteraction = () => {
    interactionPaused = true;
    stopAutoScroll();
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      interactionPaused = false;
      startAutoScroll();
    }, INTERACTION_PAUSE);
  };

  const render = (timelineEntries) => {
    entries = timelineEntries;
    track.innerHTML = entries.map(cardMarkup).join("");
    updateControls();
  };

  const renderError = () => {
    track.innerHTML =
      '<p class="ssf-timeline__status" role="alert">The timeline is temporarily unavailable. Please refresh the page to try again.</p>';
  };

  const initialize = async () => {
    try {
      const response = await fetch("/api/timeline", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Timeline request failed with ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.entries) || data.entries.length === 0) {
        throw new Error("No timeline entries were returned.");
      }
      render(data.entries);
    } catch (error) {
      console.error("Timeline failed to load:", error);
      renderError();
    }
  };

  previousButton.addEventListener("click", () => {
    pauseForInteraction();
    scrollToCard(nearestCardIndex() - 1);
  });

  nextButton.addEventListener("click", () => {
    pauseForInteraction();
    scrollToCard(nearestCardIndex() + 1);
  });

  viewport.addEventListener("scroll", updateControls, { passive: true });
  viewport.addEventListener("pointerdown", pauseForInteraction, { passive: true });
  viewport.addEventListener("wheel", pauseForInteraction, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") pauseForInteraction();
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stopAutoScroll();
    else startAutoScroll();
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || hasEnteredViewport) return;
      hasEnteredViewport = true;
      window.setTimeout(startAutoScroll, AUTO_SCROLL_DELAY);
      observer.disconnect();
    },
    { threshold: 0.35 }
  );

  observer.observe(document.querySelector(".ssf-timeline"));
  window.addEventListener("resize", updateControls);
  initialize();
})();
