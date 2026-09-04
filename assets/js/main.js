(() => {
  "use strict";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionPreference.matches;

  const methodSteps = [
    {
      image: "assets/derived/psf-scan-construction.png?v=20260903d",
      motionImage: "assets/derived/psf-scan-build.webp?v=20260904a",
      dwell: 9300,
      alt: "Step 1: monochromatic far-depth PSFs accumulate from lambda 1 through lambda 9, then combine into an x-lambda PSF scan",
      title: "Construct the far-depth PSF wavelength scan",
      description: "Stack the monochromatic far-depth PSFs across wavelength to form the x-lambda scan."
    },
    {
      image: "assets/derived/psf-scan-shift.png?v=20260903d",
      alt: "Step 2: a far-depth PSF at one wavelength reappears as a similar near-depth PSF at a shifted wavelength",
      title: "Relate the near- and far-depth scans",
      description: "A far-depth PSF at wavelength lambda reappears as a similar near-depth PSF at the shifted wavelength lambda plus delta lambda."
    },
    {
      image: "assets/derived/multiband-rejection.png?v=20260903d",
      alt: "Step 3: pass bands transmit focused far-depth light while stop bands reject the shifted near-depth focus",
      title: "Reject the shifted near-depth focus",
      description: "Pass bands transmit focused far-depth light; the corresponding focused near-depth light shifts into stop bands and is rejected."
    },
    {
      image: "assets/derived/depth-wavelength-recap.png?v=20260903m",
      alt: "Step 4: the complete depth–wavelength symmetry relationship and split-spectrum optical design",
      title: "Depth–wavelength symmetry",
      description: "Spectrum splitting prevents sharp far-depth focusing behavior from transferring to near depth, enabling sharp far-depth PSFs and defocused near-depth PSFs across the visible spectrum."
    }
  ];

  const intuitionSteps = [
    {
      image: "assets/derived/symmetry-intuition-wavelength.png?v=20260904a",
      alt: "A wavelength longer than the design wavelength causes a focal-front shift in a diffractive lens",
      title: "A longer wavelength shifts the focus forward",
      description: "For lambda greater than the design wavelength, chromatic phase mismatch produces a focal-front shift relative to the design wavelength."
    },
    {
      image: "assets/derived/symmetry-intuition-depth.png?v=20260904a",
      alt: "The spherical wave from a near-depth point source compensates chromatic phase mismatch and produces an opposing focal-back shift",
      title: "A near-depth wave shifts the focus back",
      description: "The spherical phase of a near-depth point source counterbalances that mismatch, producing the opposing focal-back shift and a similar PSF."
    },
    {
      image: "assets/derived/symmetry-intuition-validation.png?v=20260904a",
      alt: "Focal point intensity versus source wavelength and depth for a hyperbolic metalens designed at 450 nm, with the depth–wavelength symmetry model overlaid as a red dotted curve and a magnified inset.",
      title: "The model predicts the focal-intensity map",
      description: "For a hyperbolic metalens designed at λd = 450 nm, the predicted depth–wavelength correspondence agrees with the focal-intensity distribution computed using the Rayleigh–Sommerfeld diffraction integral."
    }
  ];

  const sequencePlayers = [];

  const updateAllAutoplay = () => {
    const candidates = sequencePlayers
      .filter((player) => player.canAutoplay())
      .sort((a, b) => b.visibility - a.visibility);
    const activePlayer = candidates[0] || null;
    sequencePlayers.forEach((player) => player.setRunning(player === activePlayer));
  };

  const createSequencePlayer = ({
    root,
    steps,
    frameSelector,
    countSelector,
    titleSelector,
    descriptionSelector,
    tabSelector,
    toggleSelector,
    tabDataKey,
    label,
    interval = 4800,
    autoplay = true
  }) => {
    if (!root) return null;

    const frame = root.querySelector(frameSelector);
    const count = root.querySelector(countSelector);
    const title = root.querySelector(titleSelector);
    const description = root.querySelector(descriptionSelector);
    const tabs = Array.from(root.querySelectorAll(tabSelector));
    const toggle = root.querySelector(toggleSelector);
    const visual = frame?.closest(".method-visual, .intuition-visual, [data-player-visual]") || frame?.parentElement;
    if (!frame || !steps.length || tabs.length !== steps.length) return null;

    const dataPrefix = tabDataKey.replace(/Step$/, "");
    const resolvedSteps = steps.map((step, index) => {
      const tab = tabs[index];
      return {
        ...step,
        image: tab?.dataset[`${dataPrefix}Image`] || step.image,
        alt: tab?.dataset[`${dataPrefix}Alt`] || step.alt,
        title: tab?.dataset[`${dataPrefix}Heading`] || step.title,
        description: tab?.dataset[`${dataPrefix}Description`] || step.description
      };
    });

    resolvedSteps.forEach((step) => {
      const preload = new Image();
      preload.src = step.image;
    });

    const declaredTabIndexes = tabs.map((tab) => Number(tab.dataset[tabDataKey]));
    const tabValuesAreOneBased = !declaredTabIndexes.includes(0) && declaredTabIndexes.every((value) => Number.isFinite(value) && value >= 1);
    let active = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true" || tab.classList.contains("is-active")));
    let userPaused = !autoplay || reducedMotion;
    let pointerInside = false;
    let focusInside = false;
    let timer = null;
    let transitionTimer = null;

    const controller = {
      root,
      visibility: 0,
      canAutoplay: () => autoplay && !userPaused && !pointerInside && !focusInside && controller.visibility >= 0.25 && document.visibilityState === "visible",
      setRunning: (shouldRun) => {
        if (!shouldRun) {
          if (timer) window.clearInterval(timer);
          timer = null;
          root.dataset.playerRunning = "false";
          return;
        }
        if (!timer) timer = window.setInterval(() => showStep(active + 1), interval);
        root.dataset.playerRunning = "true";
      },
      pauseForReducedMotion: () => {
        userPaused = true;
        updateToggle();
      }
    };

    const updateToggle = () => {
      if (!toggle) return;
      toggle.innerHTML = userPaused
        ? '<i class="fas fa-play" aria-hidden="true"></i><span>Play</span>'
        : '<i class="fas fa-pause" aria-hidden="true"></i><span>Pause</span>';
      toggle.setAttribute("aria-label", userPaused ? `Play ${label} animation` : `Pause ${label} animation`);
      toggle.setAttribute("aria-pressed", String(!userPaused));
    };

    const commitStep = (index, moveFocus) => {
      active = (index + resolvedSteps.length) % resolvedSteps.length;
      const step = resolvedSteps[active];
      frame.src = step.image;
      frame.alt = step.alt;
      if (count) count.textContent = `${String(active + 1).padStart(2, "0")} / ${String(resolvedSteps.length).padStart(2, "0")}`;
      if (title) title.textContent = step.title;
      if (description) description.textContent = step.description;
      root.dataset.activeStep = String(active + 1);
      if (tabs[active]?.id) visual?.setAttribute("aria-labelledby", tabs[active].id);
      if (visual) {
        const describedBy = [title?.id, description?.id];
        const scrollHint = root.querySelector("[data-intuition-scroll-hint]");
        if (active === 2 && scrollHint?.id) describedBy.push(scrollHint.id);
        const descriptionIds = describedBy.filter(Boolean).join(" ");
        if (descriptionIds) visual.setAttribute("aria-describedby", descriptionIds);
      }
      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === active;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      if (moveFocus) tabs[active]?.focus();
    };

    const crossfadeTo = (index, moveFocus = false, immediate = false) => {
      if (transitionTimer) window.clearTimeout(transitionTimer);
      visual?.querySelectorAll(".player-frame-outgoing").forEach((element) => element.remove());
      if (immediate || reducedMotion) {
        commitStep(index, moveFocus);
        frame.classList.remove("is-entering");
        visual?.classList.remove("is-transitioning");
        return;
      }

      const outgoing = frame.cloneNode(false);
      outgoing.removeAttribute("id");
      outgoing.removeAttribute("data-intuition-frame");
      outgoing.removeAttribute("data-lightbox");
      outgoing.removeAttribute("role");
      outgoing.removeAttribute("tabindex");
      outgoing.removeAttribute("aria-label");
      outgoing.alt = "";
      outgoing.setAttribute("aria-hidden", "true");
      outgoing.classList.add("player-frame-outgoing");
      frame.parentElement?.insertBefore(outgoing, frame);
      frame.parentElement?.classList.add("player-frame-stack");
      frame.classList.add("is-entering");
      visual?.classList.add("is-transitioning");
      commitStep(index, moveFocus);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          outgoing.classList.add("is-leaving");
          frame.classList.remove("is-entering");
          visual?.classList.remove("is-transitioning");
        });
      });
      transitionTimer = window.setTimeout(() => outgoing.remove(), 360);
    };

    const showStep = (index, moveFocus = false) => {
      crossfadeTo(index, moveFocus);
    };

    const resetAutoplayClock = () => {
      controller.setRunning(false);
      updateAllAutoplay();
    };

    tabs.forEach((tab, tabIndex) => {
      const declaredIndex = Number(tab.dataset[tabDataKey]);
      const targetIndex = Number.isFinite(declaredIndex)
        ? declaredIndex - (tabValuesAreOneBased ? 1 : 0)
        : tabIndex;
      tab.addEventListener("click", () => {
        showStep(targetIndex);
        resetAutoplayClock();
      });
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (tabIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        showStep(nextIndex, true);
        resetAutoplayClock();
      });
    });

    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      updateToggle();
      resetAutoplayClock();
    });

    root.addEventListener("mouseenter", () => {
      pointerInside = true;
      updateAllAutoplay();
    });
    root.addEventListener("mouseleave", () => {
      pointerInside = false;
      updateAllAutoplay();
    });
    root.addEventListener("focusin", () => {
      focusInside = true;
      updateAllAutoplay();
    });
    root.addEventListener("focusout", (event) => {
      if (root.contains(event.relatedTarget)) return;
      focusInside = false;
      updateAllAutoplay();
    });

    commitStep(active, false);
    updateToggle();
    sequencePlayers.push(controller);
    return controller;
  };

  const createMethodPlayer = () => {
    const root = document.querySelector("[data-method-player]");
    if (!root) return null;

    const frame = root.querySelector("#method-frame, [data-method-frame]");
    const count = root.querySelector("#method-count, [data-method-count]");
    const title = root.querySelector("#method-step-title, [data-method-title]");
    const description = root.querySelector("#method-step-description, [data-method-description]");
    const tabs = Array.from(root.querySelectorAll("[data-method-step]"));
    const visual = frame?.closest(".method-visual, [data-player-visual]") || frame?.parentElement;
    if (!frame || !tabs.length || tabs.length !== methodSteps.length) return null;

    const steps = methodSteps.map((step, index) => {
      const tab = tabs[index];
      return {
        ...step,
        image: tab?.dataset.methodImage || step.image,
        motionImage: tab?.dataset.methodMotionImage || step.motionImage,
        alt: tab?.dataset.methodAlt || step.alt,
        title: tab?.dataset.methodHeading || step.title,
        description: tab?.dataset.methodDescription || step.description
      };
    });

    let active = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true" || tab.classList.contains("is-active")));
    let pointerInside = false;
    let focusInside = false;
    let running = false;
    let timer = null;
    let transitionTimer = null;
    let motionImageFailed = false;
    const interval = 5400;
    const transitionDuration = 180;

    const writeFrame = (source, alt) => {
      if (frame.getAttribute("src") !== source) frame.src = source;
      frame.alt = alt;
    };

    const sourceForStep = (step) => (
      step.motionImage && !motionImageFailed
        ? step.motionImage
        : step.image
    );

    const commitStep = (index, moveFocus = false) => {
      active = (index + steps.length) % steps.length;
      const step = steps[active];
      writeFrame(sourceForStep(step), step.alt);
      if (count) count.textContent = `${String(active + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
      if (title) title.textContent = step.title;
      if (description) description.textContent = step.description;
      root.dataset.activeStep = String(active + 1);
      if (tabs[active]?.id) visual?.setAttribute("aria-labelledby", tabs[active].id);
      visual?.setAttribute(
        "aria-describedby",
        active === 3
          ? "method-step-title method-step-description method-scroll-hint"
          : "method-step-title method-step-description"
      );
      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === active;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      if (moveFocus) tabs[active]?.focus();
    };

    const crossfade = (commit, immediate = false) => {
      if (transitionTimer) window.clearTimeout(transitionTimer);
      visual?.querySelectorAll(".player-frame-outgoing").forEach((element) => element.remove());
      if (immediate || reducedMotion) {
        commit();
        frame.classList.remove("is-entering");
        visual?.classList.remove("is-transitioning");
        return;
      }

      const outgoing = frame.cloneNode(false);
      outgoing.removeAttribute("id");
      outgoing.removeAttribute("data-lightbox");
      outgoing.removeAttribute("role");
      outgoing.removeAttribute("tabindex");
      outgoing.removeAttribute("aria-label");
      outgoing.alt = "";
      outgoing.setAttribute("aria-hidden", "true");
      outgoing.classList.add("player-frame-outgoing");
      frame.parentElement?.insertBefore(outgoing, frame);
      frame.parentElement?.classList.add("player-frame-stack");
      frame.classList.add("is-entering");
      visual?.classList.add("is-transitioning");
      commit();

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          outgoing.classList.add("is-leaving");
          frame.classList.remove("is-entering");
          visual?.classList.remove("is-transitioning");
        });
      });
      transitionTimer = window.setTimeout(() => outgoing.remove(), transitionDuration + 80);
    };

    const currentDwell = () => steps[active].dwell || interval;

    const stopClock = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const schedule = () => {
      if (!running || timer) return;
      timer = window.setTimeout(() => {
        timer = null;
        if (!running) return;
        crossfade(() => commitStep(active + 1));
        schedule();
      }, currentDwell());
    };

    const showStep = (index, moveFocus = false) => {
      stopClock();
      crossfade(() => commitStep(index, moveFocus));
      running = false;
      root.dataset.playerRunning = "false";
      updateAllAutoplay();
    };

    const controller = {
      root,
      visibility: 0,
      canAutoplay: () => !reducedMotion && !pointerInside && !focusInside && controller.visibility >= 0.25 && document.visibilityState === "visible",
      setRunning: (shouldRun) => {
        if (!shouldRun) {
          running = false;
          stopClock();
          root.dataset.playerRunning = "false";
          return;
        }
        if (running) return;
        const step = steps[active];
        writeFrame(sourceForStep(step), step.alt);
        running = true;
        root.dataset.playerRunning = "true";
        schedule();
      },
      pauseForReducedMotion: () => {
        running = false;
        stopClock();
        const step = steps[active];
        writeFrame(sourceForStep(step), step.alt);
        root.dataset.playerRunning = "false";
      }
    };

    tabs.forEach((tab, tabIndex) => {
      tab.addEventListener("click", () => showStep(tabIndex));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (tabIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        showStep(nextIndex, true);
      });
    });

    root.addEventListener("mouseenter", () => {
      pointerInside = true;
      updateAllAutoplay();
    });
    root.addEventListener("mouseleave", () => {
      pointerInside = false;
      updateAllAutoplay();
    });
    root.addEventListener("focusin", () => {
      focusInside = true;
      updateAllAutoplay();
    });
    root.addEventListener("focusout", (event) => {
      if (root.contains(event.relatedTarget)) return;
      focusInside = false;
      updateAllAutoplay();
    });

    frame.addEventListener("error", () => {
      const step = steps[active];
      if (step.motionImage && frame.getAttribute("src") === step.motionImage) {
        motionImageFailed = true;
        writeFrame(step.image, step.alt);
      }
    });

    commitStep(active);
    sequencePlayers.push(controller);
    return controller;
  };

  createSequencePlayer({
    root: document.querySelector("[data-symmetry-intuition]"),
    steps: intuitionSteps,
    frameSelector: "[data-intuition-frame]",
    countSelector: "[data-intuition-count]",
    titleSelector: "[data-intuition-title]",
    descriptionSelector: "[data-intuition-copy]",
    tabSelector: "[data-intuition-step]",
    toggleSelector: "[data-intuition-toggle]",
    tabDataKey: "intuitionStep",
    label: "depth–wavelength intuition",
    interval: 4200,
    autoplay: false
  });

  createMethodPlayer();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const player = sequencePlayers.find((candidate) => candidate.root === entry.target);
        if (player) player.visibility = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      updateAllAutoplay();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    sequencePlayers.forEach((player) => observer.observe(player.root));
  } else {
    const updateFallbackVisibility = () => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      sequencePlayers.forEach((player) => {
        const rect = player.root.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
        player.visibility = rect.height > 0 ? visibleHeight / Math.min(rect.height, viewportHeight) : 0;
      });
      updateAllAutoplay();
    };
    window.addEventListener("scroll", updateFallbackVisibility, { passive: true });
    window.addEventListener("resize", updateFallbackVisibility, { passive: true });
    updateFallbackVisibility();
  }

  document.addEventListener("visibilitychange", updateAllAutoplay);
  const handleMotionPreference = (event) => {
    reducedMotion = event.matches;
    if (reducedMotion) sequencePlayers.forEach((player) => player.pauseForReducedMotion());
    updateAllAutoplay();
  };
  if (typeof motionPreference.addEventListener === "function") motionPreference.addEventListener("change", handleMotionPreference);
  else if (typeof motionPreference.addListener === "function") motionPreference.addListener(handleMotionPreference);

  const copyButton = document.querySelector("[data-copy-bibtex]");
  const bibtex = document.querySelector("#bibtex-code");

  if (copyButton && bibtex) {
    copyButton.addEventListener("click", async () => {
      const text = bibtex.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      copyButton.classList.add("copied");
      copyButton.querySelector("span").textContent = "Copied";
      window.setTimeout(() => {
        copyButton.classList.remove("copied");
        copyButton.querySelector("span").textContent = "Copy";
      }, 1800);
    });
  }

  const scrollButton = document.querySelector("[data-scroll-top]");
  if (scrollButton) {
    const updateScrollButton = () => scrollButton.classList.toggle("visible", window.scrollY > 500);
    scrollButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
    window.addEventListener("scroll", updateScrollButton, { passive: true });
    updateScrollButton();
  }

  document.querySelectorAll("[data-result-tabs]").forEach((tabGroup) => {
    const tabs = Array.from(tabGroup.querySelectorAll("[data-result-tab]"));
    const panels = Array.from(tabGroup.querySelectorAll("[data-result-panel]"));
    if (!tabs.length || !panels.length) return;

    const selectTab = (value, moveFocus = false) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.resultTab === value;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) tab.focus();
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.resultPanel !== value;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab.dataset.resultTab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        selectTab(tabs[nextIndex].dataset.resultTab, true);
      });
    });

    const defaultValue = tabGroup.dataset.defaultTab || tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.resultTab || tabs[0].dataset.resultTab;
    selectTab(defaultValue);
  });

  const videos = Array.from(document.querySelectorAll("video"));
  videos.forEach((video) => {
    const fallback = video.closest(".video-frame")?.querySelector("[data-video-error]");

    video.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== video) other.pause();
      });
    });

    video.addEventListener("loadedmetadata", () => {
      video.classList.remove("has-error");
      if (fallback) fallback.hidden = true;
    });

    video.addEventListener("error", () => {
      video.classList.add("has-error");
      if (fallback) fallback.hidden = false;
    });
  });

  const dialog = document.querySelector("[data-image-dialog]");
  if (dialog && typeof dialog.showModal === "function") {
    const dialogImage = dialog.querySelector("[data-dialog-image]");
    const dialogCaption = dialog.querySelector("[data-dialog-caption]");
    const closeButton = dialog.querySelector("[data-dialog-close]");

    document.querySelectorAll("[data-lightbox]").forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt}. Open full-size image.`);

      const open = () => {
        dialogImage.src = image.currentSrc || image.src;
        dialogImage.alt = image.alt;
        const figureCaption = image.closest("figure")?.querySelector("figcaption");
        const caption = figureCaption?.innerText?.replace(/\s+/g, " ").trim();
        dialogCaption.textContent = caption || image.alt;
        dialog.showModal();
      };

      image.addEventListener("click", open);
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
})();
