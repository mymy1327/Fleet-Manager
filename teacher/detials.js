const navLinks = document.querySelectorAll("[data-view]");
const viewSections = document.querySelectorAll("[data-view-content]");
//language 

function render() {
    const view = location.hash.slice(1) || "home";
    const activeView = document.querySelector(`[data-view-content="${view}"]`) || document.querySelector('[data-view-content="home"]');
    viewSections.forEach(section => { section.hidden = section !== activeView; });
    navLinks.forEach(link => link.classList.toggle("active", link.dataset.view === activeView.dataset.viewContent));
}

window.addEventListener("hashchange", render);

//language

render();
