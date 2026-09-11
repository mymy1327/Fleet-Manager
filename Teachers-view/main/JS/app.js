const app = document.querySelector("#app");
const navLinks = document.querySelectorAll("[data-view]");
const carIcon = `<svg viewBox="0 0 24 24" class="svg-icon" aria-hidden="true"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"/></svg>`;

const emptyPanel = (title, icon, message, extra = "") => `
    <section class="panel ${extra}">
        <h2 class="panel-title"><span class="icon">${icon}</span>${title}</h2>
        <div class="empty">${message}</div>
    </section>`;

const stat = (icon, label, tone = "") => `
    <article class="card">
        <span class="card-icon ${tone}">${icon}</span>
        <strong class="card-value">0</strong>
        <span class="card-label">${label}</span>
    </article>`;

function home() {
    return `
        <div class="page-heading"><div><h1>Etusivu</h1><p class="subtitle">Kaluston yleiskatsaus ja viimeisimmät tapahtumat</p></div></div>
        <div class="cards">
            ${stat(carIcon, "Kalusto yhteensä")}
            ${stat("✓", "Saatavilla", "green")}
            ${stat("▣", "Tarkastukset", "")}
            ${stat("△", "Avoimet viat", "green")}
        </div>
        <div class="grid-2">
            ${emptyPanel("Viimeisimmät tarkastukset", "", "Ei tarkastuksia vielä", "large")}
            ${emptyPanel("Avoimet viat", "", "Ei avoimia vikoja — kaikki kunnossa!", "large")}
        </div>`;
}

function listPage(title, subtitle, button, message, icon = "▣") {
    return `
        <div class="page-heading">
            <div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>
            <button class="button" type="button">＋&nbsp; ${button}</button>
        </div>
        ${emptyPanel("", icon, message, "single-panel")}`;
}

function reports() {
    return `
        <div class="page-heading">
            <div><h1>Raportit</h1><p class="subtitle">Kaluston käyttö- ja tarkastusraportti</p></div>
            <div class="filters">Ajanjakso:
                <span class="pill">7 pv</span><span class="pill active">30 pv</span><span class="pill">90 pv</span>
            </div>
        </div>
        <div class="cards">
            ${stat("▣", "Tarkastuksia")}
            ${stat("✓", "Hyväksytty", "green")}
            ${stat("△", "Vikailmoituksia", "orange")}
            ${stat("△", "Avoimia vikoja", "red")}
        </div>
        <div class="grid-2">
            ${emptyPanel("Tarkastukset per ajoneuvo", carIcon, "Ei tarkastuksia valitulla ajanjaksolla", "large")}
            ${emptyPanel("Tarkastustulokset", "⌁", "Ei tarkastuksia valitulla ajanjaksolla", "large")}
            ${emptyPanel("Viat per ajoneuvo", carIcon, "Ei vikoja valitulla ajanjaksolla", "large")}
            ${emptyPanel("Aktiivisimmat oppilaat", "♧", "Ei tarkastuksia valitulla ajanjaksolla", "large")}
        </div>
        <section class="panel table-panel">
            <h2 class="panel-title"><span class="icon">▤</span>Tarkastushistoria</h2>
            <table class="table"><thead><tr><th>Päivämäärä</th><th>Ajoneuvo</th><th>Oppilas</th><th>Km-lukema</th><th>Tulos</th></tr></thead>
            <tbody><tr><td colspan="5">Ei tarkastuksia valitulla ajanjaksolla</td></tr></tbody></table>
        </section>`;
}

const views = {
    home,
    fleet: () => listPage("Kalusto", "Hallinnoi kalustoasi", "Lisää ajoneuvo", "Ei ajoneuvoja vielä. Lisää ensimmäinen!", carIcon),
    inspections: () => listPage("Tarkastukset", "Kaikki ajonlähtötarkastukset", "Uusi tarkastus", "Ei tarkastuksia vielä", "▣"),
    faults: () => `
        <div class="page-heading"><div><h1>Vikailmoitukset</h1><p class="subtitle">Seuraa ja ratkaise kaluston viat</p></div>
        <div class="filters">⌕ <select class="select"><option>Kaikki</option></select></div></div>
        ${emptyPanel("", "△", "Ei vikailmoituksia", "single-panel")}`,
    reports
};

function render() {
    const view = location.hash.slice(1) || "home";
    app.innerHTML = (views[view] || views.home)();
    navLinks.forEach(link => link.classList.toggle("active", link.dataset.view === view));
}

window.addEventListener("hashchange", render);
render();
