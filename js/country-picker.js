/* WASLL Journey — country/region selector UI */
document.addEventListener("DOMContentLoaded", () => {
  const hiddenCountries = document.getElementById("countries-container");
  const sidebar = document.getElementById("sidebar");
  const importLabel = document.querySelector('label[for="import-file"]');
  if (!hiddenCountries || !sidebar || typeof ASSETS_DATA === "undefined") return;

  const names = {
    CUSTOM:"Importés", FR:"France", UK:"Royaume-Uni", TN:"Tunisie", BE:"Belgique", CA:"Canada", QC:"Québec", US:"États-Unis", DE:"Allemagne", ES:"Espagne",
    IT:"Italie", PT:"Portugal", NL:"Pays-Bas", CH:"Suisse", AT:"Autriche", PL:"Pologne", SE:"Suède", NO:"Norvège", DK:"Danemark",
    GR:"Grèce", IE:"Irlande", AU:"Australie", JP:"Japon"
  };
  const regions = {
    CUSTOM:"Personnel", CA:"Amérique du Nord", QC:"Québec", US:"Amérique du Nord", TN:"Afrique du Nord", AU:"Océanie", JP:"Asie",
    FR:"Europe", UK:"Europe", BE:"Europe", DE:"Europe", ES:"Europe", IT:"Europe", PT:"Europe", NL:"Europe", CH:"Europe", AT:"Europe", PL:"Europe", SE:"Europe", NO:"Europe", DK:"Europe", GR:"Europe", IE:"Europe"
  };
  const aliases = {
    CUSTOM:"custom personnel importé importés mes logos", UK:"Britain England Great Britain Royaume Uni", US:"USA United States America",
    QC:"Quebec Québec", CA:"Canada", BE:"Belgium Belgique", TN:"Tunisia Tunisie"
  };
  const groups = ["Personnel", "Europe", "Afrique du Nord", "Amérique du Nord", "Amérique du Sud", "Asie", "Océanie"];
  const qcFlag = "assets/QC/flag.svg";

  const trigger = document.createElement("button");
  trigger.id = "country-selector-trigger";
  trigger.type = "button";
  sidebar.insertBefore(trigger, document.querySelector(".logos-header"));

  const modal = document.createElement("div");
  modal.id = "country-modal";
  modal.innerHTML = `
    <div class="country-modal-panel" role="dialog" aria-modal="true" aria-labelledby="country-modal-title">
      <div class="country-modal-head">
        <div><div id="country-modal-title" class="country-modal-title">Choisir une collection</div><div class="country-modal-subtitle">Pays, régions et logos importés</div></div>
        <button class="country-modal-close" type="button" aria-label="Fermer">×</button>
      </div>
      <div class="country-modal-search-wrap"><input id="country-modal-search" type="search" autocomplete="off" placeholder="Rechercher un pays ou une région…" /></div>
      <div class="country-modal-body"><div id="country-modal-results"></div></div>
    </div>`;
  document.body.appendChild(modal);

  const results = modal.querySelector("#country-modal-results");
  const search = modal.querySelector("#country-modal-search");
  const close = () => { modal.classList.remove("open"); search.value = ""; render(); };

  modal.querySelector(".country-modal-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  trigger.addEventListener("click", () => {
    modal.classList.add("open");
    render();
    requestAnimationFrame(() => search.focus());
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) close();
  });
  search.addEventListener("input", render);

  /* Every import belongs to the dedicated Imported collection. */
  importLabel?.addEventListener("click", () => {
    const customButton = hiddenCountries.querySelector('.country-btn[data-code="CUSTOM"]');
    if (customButton) customButton.click();
    document.body.classList.add("custom-collection");
    updateTrigger();
  });

  function currentCode() {
    return hiddenCountries.querySelector(".country-btn.active")?.dataset.code || "FR";
  }

  function select(code) {
    const button = hiddenCountries.querySelector(`.country-btn[data-code="${CSS.escape(code)}"]`);
    if (!button) return;
    button.click();
    document.body.classList.toggle("custom-collection", code === "CUSTOM");
    updateTrigger();
    close();
  }

  function getFlagSrc(code, data) {
    if (data?.flagSrc) return data.flagSrc;
    if (code === "QC") return qcFlag;
    if (data?.flag) return `https://flagcdn.com/w80/${data.flag.toLowerCase()}.png`;
    return null;
  }

  function flagFor(code, data, triggerMode = false) {
    const cls = triggerMode ? "country-trigger-flag" : "country-card-flag";
    if (code === "CUSTOM") return `<span class="${triggerMode ? "country-trigger-icon" : "country-card-icon"}">＋</span>`;
    const src = getFlagSrc(code, data);
    const flagClass = data?.flag ? `fi fi-${data.flag}` : "";
    if (src) {
      return `<img class="${cls}" src="${src}" alt="${names[code] || code}" loading="eager" onerror="this.outerHTML='<span class=\\'${cls} ${flagClass}\\'></span>'" />`;
    }
    return `<span class="${cls} ${flagClass}"></span>`;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const current = currentCode();
    results.innerHTML = "";
    const entries = Object.entries(ASSETS_DATA).filter(([code]) => {
      const haystack = `${names[code] || code} ${aliases[code] || ""} ${regions[code] || ""} ${code}`.toLowerCase();
      return !q || haystack.includes(q);
    });

    if (!entries.length) {
      results.innerHTML = `<div class="country-modal-empty">Aucun pays ou région trouvé</div>`;
      return;
    }

    const byGroup = new Map(groups.map(group => [group, []]));
    entries.forEach(entry => (byGroup.get(regions[entry[0]] || "Europe") || byGroup.get("Europe")).push(entry));

    byGroup.forEach((items, group) => {
      if (!items.length) return;
      const section = document.createElement("section");
      section.className = "country-group";
      section.innerHTML = `<div class="country-group-title">${group}</div><div class="country-grid"></div>`;
      const grid = section.querySelector(".country-grid");

      items.forEach(([code, data]) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "country-card" + (code === current ? " active" : "") + (code === "CUSTOM" ? " custom" : "");
        card.innerHTML = `${flagFor(code, data)}<span class="country-card-copy"><span class="country-card-name">${names[code] || code}</span><span class="country-card-code">${code === "CUSTOM" ? "COLLECTION PERSONNELLE · IMPORTS UNIQUEMENT" : code}</span></span>`;
        card.addEventListener("click", () => select(code));
        grid.appendChild(card);
      });
      results.appendChild(section);
    });
  }

  function updateTrigger() {
    const code = currentCode();
    const data = ASSETS_DATA[code] || ASSETS_DATA.FR;
    trigger.innerHTML = `${flagFor(code, data, true)}<span class="country-trigger-copy"><span class="country-trigger-eyebrow">Collection actuelle</span><span class="country-trigger-name">${names[code] || code}</span></span><span class="country-trigger-chevron">⌄</span>`;
    trigger.setAttribute("aria-label", `Changer de collection — ${names[code] || code}`);
  }

  /* The original app owns the actual selection state. We mirror its generated buttons. */
  const decorateButtons = () => {
    const codes = Object.keys(ASSETS_DATA);
    hiddenCountries.querySelectorAll(".country-btn").forEach((button) => {
      if (!button.dataset.code) {
        const label = button.querySelector(".country-name")?.textContent?.trim();
        const match = codes.find(code => (names[code] || ASSETS_DATA[code]?.label) === label);
        if (match) button.dataset.code = match;
      }
    });
    updateTrigger();
    document.body.classList.toggle("custom-collection", currentCode() === "CUSTOM");
  };

  new MutationObserver(decorateButtons).observe(hiddenCountries, { childList: true });
  decorateButtons();
});
