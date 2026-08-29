/* WASLL Journey — country/region selector UI */
document.addEventListener("DOMContentLoaded", () => {
  const hiddenPicker = document.getElementById("country-picker");
  const hiddenCountries = document.getElementById("countries-container");
  const sidebar = document.getElementById("sidebar");
  if (!hiddenPicker || !hiddenCountries || typeof ASSETS_DATA === "undefined") return;

  const names = {
    FR:"France", UK:"Royaume-Uni", TN:"Tunisie", BE:"Belgique", CA:"Canada", QC:"Québec", US:"États-Unis", DE:"Allemagne", ES:"Espagne",
    IT:"Italie", PT:"Portugal", NL:"Pays-Bas", CH:"Suisse", AT:"Autriche", PL:"Pologne", SE:"Suède", NO:"Norvège", DK:"Danemark",
    GR:"Grèce", IE:"Irlande", AU:"Australie", JP:"Japon", CUSTOM:"Mes logos"
  };
  const regions = { FR:"Europe", UK:"Europe", BE:"Europe", DE:"Europe", ES:"Europe", IT:"Europe", PT:"Europe", NL:"Europe", CH:"Europe", AT:"Europe", PL:"Europe", SE:"Europe", NO:"Europe", DK:"Europe", GR:"Europe", IE:"Europe", TN:"Afrique du Nord", CA:"Amérique du Nord", QC:"Québec", US:"Amérique du Nord", AU:"Océanie", JP:"Asie", CUSTOM:"Personnel" };
  const aliases = { UK:"Britain England Great Britain Royaume Uni", US:"USA United States America", QC:"Quebec Québec", CA:"Canada", BE:"Belgium Belgique", TN:"Tunisia Tunisie", CUSTOM:"custom personnel importé importés mes logos" };
  const groups = ["Personnel","Amérique du Nord","Europe","Afrique du Nord","Amérique du Sud","Asie","Océanie"];
  const qcFlag = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flag_of_Quebec.svg";

  const trigger = document.createElement("button");
  trigger.id = "country-selector-trigger";
  trigger.type = "button";
  sidebar.insertBefore(trigger, document.querySelector(".logos-header"));

  const modal = document.createElement("div");
  modal.id = "country-modal";
  modal.innerHTML = `
    <div class="country-modal-panel" role="dialog" aria-modal="true" aria-labelledby="country-modal-title">
      <div class="country-modal-head"><span id="country-modal-title" class="country-modal-title">Pays & régions</span><button class="country-modal-close" type="button" aria-label="Fermer">×</button></div>
      <div class="country-modal-search-wrap"><input id="country-modal-search" type="search" autocomplete="off" placeholder="Rechercher un pays, une région…" /></div>
      <div class="country-modal-body"><div id="country-modal-results"></div></div>
    </div>`;
  document.body.appendChild(modal);

  const results = modal.querySelector("#country-modal-results");
  const search = modal.querySelector("#country-modal-search");
  const close = () => { modal.classList.remove("open"); search.value = ""; render(); };
  modal.querySelector(".country-modal-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  trigger.addEventListener("click", () => { modal.classList.add("open"); setTimeout(() => search.focus(), 30); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });

  function currentCode() {
    return hiddenCountries.querySelector(".country-btn.active")?.dataset.code || "FR";
  }

  function select(code) {
    const button = hiddenCountries.querySelector(`.country-btn[data-code="${CSS.escape(code)}"]`);
    if (button) button.click();
    document.body.classList.toggle("custom-collection", code === "CUSTOM");
    updateTrigger();
    close();
  }

  function flagFor(code, data) {
    if (code === "QC") return `<img class="country-card-flag" src="${qcFlag}" alt="Drapeau du Québec">`;
    if (code === "CUSTOM") return `<span class="country-card-icon">＋</span>`;
    return `<span class="fi fi-${data.flag} country-card-flag"></span>`;
  }

  function triggerVisual(code, data) {
    if (code === "QC") return `<img class="country-trigger-flag" src="${qcFlag}" alt="Drapeau du Québec">`;
    if (code === "CUSTOM") return `<span class="country-trigger-icon">＋</span>`;
    return `<span class="fi fi-${data.flag} country-trigger-flag"></span>`;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const current = currentCode();
    results.innerHTML = "";
    const entries = Object.entries(ASSETS_DATA).filter(([code]) => {
      const haystack = `${names[code] || code} ${aliases[code] || ""} ${regions[code] || ""} ${code}`.toLowerCase();
      return !q || haystack.includes(q);
    });

    if (!entries.length) { results.innerHTML = `<div class="country-modal-empty">Aucun pays ou région trouvé</div>`; return; }
    const byGroup = new Map(groups.map(g => [g, []]));
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
        card.className = "country-card" + (code === current ? " active" : "");
        card.innerHTML = `${flagFor(code, data)}<span class="country-card-copy"><span class="country-card-name">${names[code] || code}</span><span class="country-card-code">${code === "CUSTOM" ? "COLLECTION PERSONNELLE" : code}</span></span>`;
        card.addEventListener("click", () => select(code));
        grid.appendChild(card);
      });
      results.appendChild(section);
    });
  }

  function updateTrigger() {
    const code = currentCode();
    const data = ASSETS_DATA[code] || ASSETS_DATA.FR;
    trigger.innerHTML = `${triggerVisual(code, data)}<span class="country-trigger-copy"><span class="country-trigger-eyebrow">Collection actuelle</span><span class="country-trigger-name">${names[code] || code}</span></span><span class="country-trigger-chevron">⌄</span>`;
    trigger.setAttribute("aria-label", `Changer de collection — ${names[code] || code}`);
  }

  /* The original renderer owns selection state; mirror its buttons with stable data-code hooks. */
  const decorateButtons = () => {
    hiddenCountries.querySelectorAll(".country-btn").forEach((button, index) => {
      const code = Object.keys(ASSETS_DATA)[index];
      if (code) button.dataset.code = code;
    });
    updateTrigger();
    document.body.classList.toggle("custom-collection", currentCode() === "CUSTOM");
  };

  new MutationObserver(decorateButtons).observe(hiddenCountries, { childList:true });
  decorateButtons();
  search.addEventListener("input", render);
  render();
});
