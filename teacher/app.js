const navLinks = document.querySelectorAll("[data-view]");
const viewSections = document.querySelectorAll("[data-view-content]");
// langauge swtich
const periodButtons = document.querySelectorAll(".pill");

function render() {
    const view = location.hash.slice(1) || "home";
    const activeView = document.querySelector(`[data-view-content="${view}"]`) || document.querySelector('[data-view-content="home"]');
    viewSections.forEach(section => { section.hidden = section !== activeView; });
    navLinks.forEach(link => link.classList.toggle("active", link.dataset.view === activeView.dataset.viewContent));
}

window.addEventListener("hashchange", render);

// language switch

periodButtons.forEach((button) => {
    button.addEventListener("click", () => {
        periodButtons.forEach((periodButton) => periodButton.classList.remove("active"));
        button.classList.add("active");
    });
});

render();
