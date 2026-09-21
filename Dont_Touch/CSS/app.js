const navLinks = document.querySelectorAll("[data-view]");
const viewSections = document.querySelectorAll("[data-view-content]");
const languageSwitch = document.querySelector("[data-language-switch]");
const periodButtons = document.querySelectorAll(".pill");
const languageKey = "fleetManagerLanguage";

function getPreferredLanguage() {
    const saved = localStorage.getItem(languageKey);
    if (saved === "en" || saved === "fi") {
        return saved;
    }
    return location.pathname.endsWith("Index_fi.html") ? "fi" : "en";
}

function setPreferredLanguage(lang) {
    localStorage.setItem(languageKey, lang);
}

function render() {
    const view = location.hash.slice(1).split("?")[0] || "home";
    const activeView = document.querySelector(`[data-view-content="${view}"]`) || document.querySelector('[data-view-content="home"]');
    viewSections.forEach(section => { section.hidden = section !== activeView; });
    navLinks.forEach(link => link.classList.toggle("active", link.dataset.view === activeView.dataset.viewContent));
}

window.addEventListener("hashchange", render);

languageSwitch?.addEventListener("click", () => {
    const currentLanguage = getPreferredLanguage();
    const nextLanguage = currentLanguage === "fi" ? "en" : "fi";
    setPreferredLanguage(nextLanguage);

    const targetPage = nextLanguage === "fi" ? "Index_fi.html" : "Index_en.html";
    window.location.href = `${targetPage}${location.hash}`;
});

const currentLanguage = getPreferredLanguage();
if (currentLanguage === "fi") {
    languageSwitch.textContent = "FI";
} else {
    languageSwitch.textContent = "EN";
}

periodButtons.forEach((button) => {
    button.addEventListener("click", () => {
        periodButtons.forEach((periodButton) => periodButton.classList.remove("active"));
        button.classList.add("active");
    });
});

render();
