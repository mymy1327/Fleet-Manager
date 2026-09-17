function getVehicleDetails(vehicleId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://${ip}/api/vehicles?code=` + vehicleId, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            // work with response here (code: xhr.status, json response: xhr.responseText)
            console.log(xhr.responseText)
        };
        xhr.send();
    }
console.log("bre")

const navLinks = document.querySelectorAll("[data-view]");
const viewSections = document.querySelectorAll("[data-view-content]");
const languageSwitch = document.querySelector("[data-language-switch]");

function render() {
    const view = location.hash.slice(1) || "home";
    const activeView = document.querySelector(`[data-view-content="${view}"]`) || document.querySelector('[data-view-content="home"]');
    viewSections.forEach(section => { section.hidden = section !== activeView; });
    navLinks.forEach(link => link.classList.toggle("active", link.dataset.view === activeView.dataset.viewContent));
}

window.addEventListener("hashchange", render);

languageSwitch?.addEventListener("click", () => {
    const targetPage = location.pathname.endsWith("Index_fi.html") ? "Index_en.html" : "Index_fi.html";
    window.location.href = `${targetPage}${location.hash}`;
});

render();