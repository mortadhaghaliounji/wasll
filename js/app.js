document.addEventListener("DOMContentLoaded", () => {
  let currentCountry = "FR";
  let steps = [];
  let history = [];
  let selectedStepId = null;
  const customLogos = {};
  Object.keys(ASSETS_DATA).forEach((key) => (customLogos[key] = []));

  const countriesContainer = document.getElementById("countries-container");
  const countrySearch = document.getElementById("country-search");
  const logoSearch = document.getElementById("logo-search");
  const logosCount = document.getElementById("logos-count");
  const logosContainer = document.getElementById("logos-container");
  const staircaseContainer = document.getElementById("staircase-container");
  const emptyHint = document.getElementById("empty-hint");
  const startJourneyBtn = document.getElementById("start-journey-btn");
  const importFileInput = document.getElementById("import-file");
  const downloadBtn = document.getElementById("download-btn");
  const toolbarExportBtn = document.getElementById("toolbar-export-btn");
  const undoBtn = document.getElementById("undo-btn");
  const clearBtn = document.getElementById("clear-btn");
  const mobileToggle = document.getElementById("mobile-toggle");
  const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobile-overlay");
  const addingHint = document.getElementById("adding-hint");
  const logosLabel = document.getElementById("logos-label");
  const journeyTitle = document.getElementById("journey-title");
  const selectionBanner = document.getElementById("selection-banner");
  const cancelSelectionBtn = document.getElementById("cancel-selection-btn");

  renderCountries();
  renderLogos();
  renderStaircase();
  countrySearch?.addEventListener("input", renderCountries);
  logoSearch?.addEventListener("input", renderLogos);

  mobileToggle.addEventListener("click", () => {
    sidebar.classList.contains("mobile-open") ? closeMobilePanel() : openMobilePanel();
  });
  startJourneyBtn?.addEventListener("click", () => {
    openMobilePanel();
  });
  overlay.addEventListener("click", closeMobilePanel);
  sidebarCloseBtn.addEventListener("click", closeMobilePanel);
  cancelSelectionBtn?.addEventListener("click", exitSelectMode);

  function openMobilePanel() {
    sidebar.classList.add("mobile-open");
    overlay.classList.remove("hidden");
    setTimeout(() => {
      if (logoSearch) {
        logoSearch.focus({ preventScroll: true });
      }
    }, 150);
  }
  function closeMobilePanel() {
    sidebar.classList.remove("mobile-open");
    overlay.classList.add("hidden");
    selectedStepId = null;
    syncSelectionState();
    renderStaircase();
  }

  function pushHistory() {
    history.push(JSON.stringify(steps));
    if (history.length > 30) history.shift();
  }

  undoBtn.addEventListener("click", () => {
    if (!history.length) return;
    steps = JSON.parse(history.pop());
    exitSelectMode();
    renderStaircase();
  });

  clearBtn.addEventListener("click", () => {
    if (!steps.length || !confirm("Effacer tout le parcours ?")) return;
    pushHistory();
    steps = [];
    exitSelectMode();
    renderStaircase();
  });

  importFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      customLogos[currentCountry].push({ name: file.name.replace(/\.[^/.]+$/, ""), src: e.target.result });
      renderLogos();
      importFileInput.value = "";
    };
    reader.readAsDataURL(file);
  });

  downloadBtn.addEventListener("click", exportImage);
  toolbarExportBtn?.addEventListener("click", exportImage);

  async function exportImage() {
    if (!steps.length) return alert("Ajoutez au moins un logo pour exporter votre parcours !");
    const btns = [downloadBtn, toolbarExportBtn].filter(Boolean);
    btns.forEach(b => {
      b.disabled = true;
      const t = b.querySelector("span");
      if (t) t.textContent = "Génération…";
    });
    try {
      const url = await buildExportCanvas();
      const a = document.createElement("a");
      a.download = `parcours-politique-${Date.now()}.png`;
      a.href = url;
      a.click();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'exportation.");
    } finally {
      btns.forEach(b => {
        b.disabled = false;
        const t = b.querySelector("span");
        if (t) t.textContent = "Exporter";
      });
    }
  }

  async function buildExportCanvas() {
    const DPR = Math.max(2, window.devicePixelRatio || 2);
    const STEP_W = 160, BASE_H = 50, INC_H = 40;
    const PAD_L = 80, PAD_R = 60, PAD_T = 220, PAD_B = 70;
    const LOGO_SIZE = 80, LINE_W = 3;
    const BG = "#FAFAF8", INK = "#0C0C0C", RED = "#D01020", MUTED = "#aaaaaa";
    const n = steps.length;
    const maxH = BASE_H + (n - 1) * INC_H;
    const canvasW = PAD_L + n * STEP_W + PAD_R;
    const canvasH = PAD_T + maxH + PAD_B;
    const canvas = document.createElement("canvas");
    canvas.width = canvasW * DPR;
    canvas.height = canvasH * DPR;
    const ctx = canvas.getContext("2d");
    ctx.scale(DPR, DPR);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const title = journeyTitle.value.trim() || "Mon Parcours Politique";
    ctx.font = "700 28px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = INK;
    ctx.fillText(title.toUpperCase(), PAD_L, 46);
    ctx.fillStyle = RED;
    ctx.fillRect(PAD_L, 54, 60, 3);

    const floorY = PAD_T + maxH;
    ctx.strokeStyle = INK;
    ctx.lineWidth = LINE_W;
    ctx.beginPath();
    ctx.moveTo(PAD_L, floorY);
    ctx.lineTo(PAD_L + n * STEP_W, floorY);
    ctx.stroke();

    await Promise.all(steps.map(async (step, i) => {
      const stepH = BASE_H + i * INC_H;
      const stepX = PAD_L + i * STEP_W;
      const stepY = floorY - stepH;
      ctx.strokeStyle = INK;
      ctx.lineWidth = LINE_W;
      ctx.strokeRect(stepX, stepY, STEP_W, stepH);
      ctx.font = "600 12px 'Syne', sans-serif";
      ctx.fillStyle = MUTED;
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), stepX + STEP_W / 2, floorY - 10);
      ctx.textAlign = "left";

      const imgs = await Promise.all(step.imgs.map(loadImg));
      const valid = imgs.filter(Boolean);
      if (valid.length) {
        const cols = Math.min(valid.length, 3);
        const size = Math.min(LOGO_SIZE, (STEP_W - 12) / cols);
        const rows = Math.ceil(valid.length / cols);
        const totalW = cols * size + (cols - 1) * 4;
        const totalH = rows * size + (rows - 1) * 4;
        const startX = stepX + (STEP_W - totalW) / 2;
        const startY = stepY - totalH - 16;
        valid.forEach((img, li) => {
          const col = li % cols, row = Math.floor(li / cols);
          ctx.drawImage(img, startX + col * (size + 4), startY + row * (size + 4), size, size);
        });
      }

      if (step.dates?.trim()) {
        ctx.font = "600 10px 'Syne', sans-serif";
        ctx.fillStyle = "#555";
        ctx.textAlign = "center";
        step.dates.split("\n").forEach((line, li) => ctx.fillText(line, stepX + STEP_W / 2, stepY + 18 + li * 14));
        ctx.textAlign = "left";
      }
    }));

    ctx.font = "600 11px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.textAlign = "right";
    ctx.fillText("WASLL POLITICAL JOURNEY", canvasW - 20, canvasH - 16);
    return canvas.toDataURL("image/png");
  }

  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback without crossOrigin
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = src;
      };
      img.src = src;
    });
  }

  function renderCountries() {
    countriesContainer.innerHTML = "";
    const query = (countrySearch?.value || "").trim().toLocaleLowerCase();
    const entries = Object.entries(ASSETS_DATA).filter(([code, data]) => {
      const label = data.label || data.region || code;
      return !query || `${code} ${label}`.toLocaleLowerCase().includes(query);
    });

    entries.forEach(([code, data]) => {
      const btn = document.createElement("button");
      btn.className = "country-btn" + (code === currentCountry ? " active" : "");
      btn.dataset.code = code;
      const label = data.label || (data.region ? "Québec" : code);
      btn.title = label;
      btn.setAttribute("aria-label", label);

      const flagSrc = data.flagSrc || (data.flag ? `https://flagcdn.com/w80/${data.flag.toLowerCase()}.png` : null);
      if (flagSrc) {
        const img = document.createElement("img");
        img.src = flagSrc;
        img.alt = label;
        img.className = "country-flag-image";
        img.onerror = () => {
          if (data.flag) {
            img.outerHTML = `<span class="fi fi-${data.flag}"></span>`;
          }
        };
        btn.appendChild(img);
      } else if (data.flag) {
        btn.innerHTML = `<span class="fi fi-${data.flag}"></span>`;
      }

      const name = document.createElement("span");
      name.className = "country-name";
      name.textContent = label;
      btn.appendChild(name);

      btn.addEventListener("click", () => {
        currentCountry = code;
        exitSelectMode();
        renderCountries();
        renderLogos();
        if (window.innerWidth <= 720) countrySearch?.blur();
      });
      countriesContainer.appendChild(btn);
    });

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "country-empty";
      empty.textContent = "Aucun pays ou région";
      countriesContainer.appendChild(empty);
    }
  }

  function renderLogos() {
    logosContainer.innerHTML = "";
    const q = (logoSearch?.value || "").trim().toLowerCase();
    const allFiles = [
      ...(ASSETS_DATA[currentCountry]?.files || []),
      ...(customLogos[currentCountry] || [])
    ];

    const unknownMatches = !q || "inconnu ? independant neutre aucun non affilie".includes(q);
    const filteredFiles = allFiles.filter((asset) => {
      if (!q) return true;
      const haystack = `${asset.name || ""} ${asset.rawFile || ""}`.toLowerCase();
      return haystack.includes(q);
    });

    const totalCount = allFiles.length;
    if (logosCount) {
      if (q) {
        logosCount.textContent = `${filteredFiles.length} / ${totalCount}`;
      } else {
        logosCount.textContent = `${totalCount} parti${totalCount > 1 ? "s" : ""}`;
      }
    }

    if (unknownMatches) {
      appendLogoItem({ name: "Inconnu / Sans étiquette", src: null }, true);
    }

    filteredFiles.forEach((asset) => appendLogoItem(asset, false));

    if (!filteredFiles.length && !unknownMatches) {
      const empty = document.createElement("div");
      empty.className = "logos-empty-state";
      empty.innerHTML = `
        <p>Aucun parti ne correspond à « <strong>${escHtml(q)}</strong> »</p>
        <button type="button" class="logos-reset-btn">Effacer la recherche</button>
      `;
      empty.querySelector(".logos-reset-btn").addEventListener("click", () => {
        if (logoSearch) {
          logoSearch.value = "";
          renderLogos();
          logoSearch.focus();
        }
      });
      logosContainer.appendChild(empty);
    }
  }

  function appendLogoItem(asset, isUnknown) {
    const div = document.createElement("div");
    const name = asset.name || (isUnknown ? "Inconnu / Sans étiquette" : "Logo");
    div.className = "logo-item";
    div.title = name;
    div.setAttribute("aria-label", name);

    const visual = document.createElement("div");
    visual.className = "logo-item-visual";

    if (isUnknown) {
      visual.innerHTML = `<span class="unknown-icon">?</span>`;
    } else {
      const img = document.createElement("img");
      img.src = asset.src;
      img.alt = name;
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = () => {
        visual.innerHTML = `<div class="logo-missing"><span class="miss-icon">🏛️</span></div>`;
      };
      visual.appendChild(img);
    }

    const caption = document.createElement("div");
    caption.className = "logo-item-caption";
    caption.textContent = isUnknown ? "Inconnu" : name;

    div.appendChild(visual);
    div.appendChild(caption);

    div.addEventListener("click", () => {
      onLogoClick(asset.src);
      if (window.innerWidth <= 720) closeMobilePanel();
    });
    logosContainer.appendChild(div);
  }

  function onLogoClick(src) {
    pushHistory();
    if (selectedStepId !== null) {
      const step = steps.find((item) => item.id === selectedStepId);
      if (step) {
        step.imgs.push(src);
        exitSelectMode();
        renderStaircase();
        return;
      }
    }
    steps.push({ id: Date.now() + Math.random(), imgs: [src], dates: "" });
    renderStaircase();
  }

  function syncSelectionState() {
    if (selectedStepId === null) {
      addingHint.classList.add("hidden");
      logosLabel.style.display = "";
      selectionBanner?.classList.add("hidden");
    } else {
      addingHint.classList.remove("hidden");
      logosLabel.style.display = "none";
      selectionBanner?.classList.remove("hidden");
    }
  }

  function exitSelectMode() {
    selectedStepId = null;
    syncSelectionState();
    renderStaircase();
  }

  function toggleSelectStep(id) {
    selectedStepId = selectedStepId === id ? null : id;
    syncSelectionState();
    if (selectedStepId !== null && window.innerWidth <= 720) {
      openMobilePanel();
    }
    renderStaircase();
  }

  function moveStep(id, direction) {
    const index = steps.findIndex((s) => s.id === id);
    const next = index + direction;
    if (next < 0 || next >= steps.length) return;
    pushHistory();
    [steps[index], steps[next]] = [steps[next], steps[index]];
    renderStaircase();
  }

  function renderStaircase() {
    document.querySelectorAll(".date-input").forEach((el, i) => {
      if (steps[i]) steps[i].dates = el.innerText;
    });
    staircaseContainer.innerHTML = "";
    emptyHint.style.display = steps.length ? "none" : "flex";
    if (!steps.length) return;

    steps.forEach((step, i) => {
      const stepEl = document.createElement("div");
      stepEl.className = "step" + (step.id === selectedStepId ? " selected" : "");
      stepEl.style.height = `${48 + i * 38}px`;
      const content = document.createElement("div");
      content.className = "step-content";

      const logos = document.createElement("div");
      logos.className = "step-logos";
      step.imgs.forEach((src, li) => {
        const el = src ? document.createElement("img") : document.createElement("div");
        el.className = src ? "step-logo" : "step-unknown";
        if (src) { el.src = src; el.alt = "Logo"; el.title = "Cliquer pour retirer"; }
        else el.textContent = "?";
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          pushHistory();
          step.imgs.splice(li, 1);
          if (!step.imgs.length) steps = steps.filter((s) => s.id !== step.id);
          renderStaircase();
        });
        logos.appendChild(el);
      });
      content.appendChild(logos);

      const date = document.createElement("div");
      date.className = "date-input";
      date.contentEditable = "true";
      date.spellcheck = false;
      date.innerHTML = escHtml(step.dates || "");
      date.addEventListener("blur", () => { step.dates = date.innerText; });
      date.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); document.execCommand("insertLineBreak"); }
        if (event.key === "Escape") date.blur();
      });
      content.appendChild(date);

      const actions = document.createElement("div");
      actions.className = "step-actions";
      const button = (text, className, handler, disabled = false) => {
        const b = document.createElement("button");
        b.className = `step-btn ${className}`;
        b.textContent = text;
        b.disabled = disabled;
        b.addEventListener("click", (event) => { event.stopPropagation(); handler(); });
        return b;
      };
      actions.appendChild(button("+ Logo", "add-btn", () => toggleSelectStep(step.id)));
      actions.appendChild(button("←", "move-btn", () => moveStep(step.id, -1), i === 0));
      actions.appendChild(button("→", "move-btn", () => moveStep(step.id, 1), i === steps.length - 1));
      actions.appendChild(button("✕", "del-btn", () => {
        pushHistory();
        steps = steps.filter((s) => s.id !== step.id);
        if (selectedStepId === step.id) exitSelectMode();
        renderStaircase();
      }));
      content.appendChild(actions);

      const number = document.createElement("div");
      number.className = "step-num";
      number.textContent = i + 1;
      stepEl.appendChild(number);
      stepEl.appendChild(content);
      staircaseContainer.appendChild(stepEl);
    });
  }

  function escHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }
});
