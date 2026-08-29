/* WASLL Journey — mobile interaction layer */
document.addEventListener("DOMContentLoaded", () => {
  const staircase = document.getElementById("staircase-container");
  const workspace = document.getElementById("workspace");
  if (!staircase || !workspace) return;

  const mobileQuery = window.matchMedia("(max-width: 720px)");

  function isMobile() {
    return mobileQuery.matches || window.matchMedia("(pointer: coarse)").matches;
  }

  function syncMobileLayout() {
    const mobile = isMobile();
    document.body.classList.toggle("mobile-device", mobile);
    if (!mobile) {
      document.documentElement.style.removeProperty("--mobile-step-w");
      document.documentElement.style.removeProperty("--mobile-logo-size");
      workspace.style.height = "";
      return;
    }

    const width = Math.max(320, window.visualViewport?.width || window.innerWidth);
    const stepWidth = Math.max(96, Math.min(128, Math.round(width * 0.29)));
    const logoSize = Math.max(46, Math.min(60, Math.round(stepWidth * 0.5)));
    document.documentElement.style.setProperty("--mobile-step-w", `${stepWidth}px`);
    document.documentElement.style.setProperty("--mobile-logo-size", `${logoSize}px`);

    if (window.visualViewport) {
      workspace.style.height = `${Math.max(320, window.visualViewport.height)}px`;
    }
  }

  function refreshStaircaseSpace() {
    if (!isMobile()) return;

    const steps = staircase.querySelectorAll(".step");
    let maxRows = 1;
    const logoSize = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--mobile-logo-size"),
      10,
    ) || 52;

    steps.forEach((step) => {
      const logos = step.querySelectorAll(".step-logo, .step-unknown");
      const stepWidth = parseInt(getComputedStyle(step).width, 10) || 110;
      const columns = Math.max(1, Math.floor((stepWidth - 12) / (logoSize + 4)));
      maxRows = Math.max(maxRows, Math.ceil(logos.length / columns));
    });

    // Prevent logos/actions from being clipped above the staircase.
    staircase.style.paddingTop = `${Math.min(420, 112 + maxRows * 62)}px`;
  }

  function keepUsefulStepVisible() {
    if (!isMobile()) return;
    const target = staircase.querySelector(".step.selected") || staircase.lastElementChild;
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }

  const observer = new MutationObserver(() => {
    refreshStaircaseSpace();
    keepUsefulStepVisible();
  });
  observer.observe(staircase, { childList: true, subtree: true });

  window.addEventListener("resize", syncMobileLayout, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(syncMobileLayout, 100), { passive: true });
  window.visualViewport?.addEventListener("resize", syncMobileLayout, { passive: true });
  mobileQuery.addEventListener?.("change", syncMobileLayout);

  syncMobileLayout();
  refreshStaircaseSpace();
});
