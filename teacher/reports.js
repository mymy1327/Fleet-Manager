const reportRestApi = typeof restapi !== "undefined"
    ? restapi
    : "https://developmenterasmus.kolojar.cz";

let reportInspections = [];
let reportProblems = [];
let reportVehicles = [];

async function loadReports() {
    try {
        const [vehiclesResponse, inspectionsResponse, problemsResponse] = await Promise.all([
            fetch(reportRestApi + "/api/vehicles"),
            fetch(reportRestApi + "/api/inspections"),
            fetch(reportRestApi + "/api/problems")
        ]);

        if (!vehiclesResponse.ok || !inspectionsResponse.ok || !problemsResponse.ok) {
            throw new Error("Failed to load report data");
        }

        reportVehicles = await vehiclesResponse.json();
        reportInspections = await inspectionsResponse.json();
        reportProblems = await problemsResponse.json();
        console.log(reportProblems);

        reportVehicles = Array.isArray(reportVehicles) ? reportVehicles : [];
        reportInspections = Array.isArray(reportInspections) ? reportInspections : [];
        reportProblems = Array.isArray(reportProblems) ? reportProblems : [];

        renderReportSummary();
        renderInspectionsPerVehicle();
        renderInspectionResults();
        renderProblemsPerVehicle();
        renderProblemStatus();
        renderInspectionHistory();
    } catch (error) {
        console.error("Error loading reports:", error);
    }
}

function renderReportSummary() {
    const total = reportInspections.length;

    const passed = reportInspections.filter(
        inspection => Number(inspection.passed) === 1
    ).length;

    const totalProblems = reportProblems.length;

    const openProblems = reportProblems.filter(
        problem => String(problem.state).toLowerCase() === "open"
    ).length;

    document.getElementById("reportTotalInspections").textContent = total;
    document.getElementById("reportPassedInspections").textContent = passed;
    document.getElementById("reportTotalProblems").textContent = totalProblems;
    document.getElementById("reportOpenProblems").textContent = openProblems;
}

function renderInspectionsPerVehicle() {
    const container = document.getElementById("inspectionsPerVehicleChart");
    if (!container) return;

    const counts = {};

    reportInspections.forEach(inspection => {
        const vehicleId = Number(inspection.id_vehicles);
        counts[vehicleId] = (counts[vehicleId] || 0) + 1;
    });

    const data = Object.entries(counts).map(([id, count]) => {
        const vehicle = reportVehicles.find(
            item => Number(item.id_vehicles) === Number(id)
        );

        return {
            name: vehicle?.name || `Vehicle ${id}`,
            count
        };
    });

    renderBarChart(container, data, "inspections");
}

function renderInspectionResults() {
    const container = document.getElementById("inspectionResultsChart");
    if (!container) return;

    const passed = reportInspections.filter(
        inspection => Number(inspection.passed) === 1
    ).length;

    const failed = reportInspections.filter(
        inspection => Number(inspection.passed) !== 1
    ).length;

    renderResultChart(container, [
        { name: "Hyväksytty", value: passed },
        { name: "Hylätty", value: failed }
    ]);
}

function renderProblemsPerVehicle() {
    const container = document.getElementById("problemsPerVehicleChart");
    if (!container) return;

    const inspectionVehicleMap = {};

    reportInspections.forEach(inspection => {
        inspectionVehicleMap[inspection.id_inspections] = inspection.id_vehicles;
    });

    const counts = {};

    reportProblems.forEach(problem => {
        const vehicleId = inspectionVehicleMap[problem.id_inspections];

        if (!vehicleId) return;

        counts[vehicleId] = (counts[vehicleId] || 0) + 1;
    });

    const data = Object.entries(counts).map(([id, count]) => {
        const vehicle = reportVehicles.find(
            item => Number(item.id_vehicles) === Number(id)
        );

        return {
            name: vehicle?.name || `Vehicle ${id}`,
            count
        };
    });

    renderBarChart(container, data, "problems");
}

function renderProblemStatus() {
    const container = document.getElementById("problemStatusChart");
    if (!container) return;

    const open = reportProblems.filter(
        problem => String(problem.state).toLowerCase() === "open"
    ).length;

    const resolved = reportProblems.filter(
        problem => String(problem.state).toLowerCase() === "resolved"
    ).length;

    renderResultChart(container, [
        { name: "Resolved", value: resolved },
        { name: "Open", value: open }
    ]);
}

function renderBarChart(container, data, label) {
    if (!data.length) {
        container.innerHTML = '<div class="report-chart-empty">Ei tietoja</div>';
        return;
    }

    const max = Math.max(...data.map(item => item.count));

    container.innerHTML = `
        <div class="report-bar-list">
            ${data.map(item => `
                <div class="report-bar-item">
                    <div class="report-bar-label">
                        <span>${escapeReportHtml(item.name)}</span>
                        <strong>${item.count}</strong>
                    </div>

                    <div class="report-bar">
                        <div
                            class="report-bar-fill"
                            style="width:${max ? (item.count / max) * 100 : 0}%">
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderResultChart(container, data) {
    const total = data.reduce(
        (sum, item) => sum + item.value,
        0
    );

    if (!total) {
        container.innerHTML =
            '<div class="report-chart-empty">Ei tietoja</div>';
        return;
    }

    const firstPercent =
        (data[0].value / total) * 100;

    container.innerHTML = `
        <div class="report-donut-wrapper">

            <div class="report-donut"
                 style="--target:${firstPercent}%">

                <div class="report-donut-center">
                    <strong>${total}</strong>
                    <span>Total</span>
                </div>

            </div>

            <div class="report-donut-legend">

                ${data.map((item, index) => {
                    const percent =
                        ((item.value / total) * 100).toFixed(0);

                    return `
                        <div class="report-donut-item">

                            <div class="report-donut-label">
                                <span class="report-donut-dot ${
                                    index === 0
                                        ? "primary"
                                        : "danger"
                                }"></span>

                                <span>${item.name}</span>
                            </div>

                            <div class="report-donut-value">
                                <strong>${item.value}</strong>
                                <small>${percent}%</small>
                            </div>

                        </div>
                    `;
                }).join("")}

            </div>
        </div>
    `;
}

let inspectionHistoryPage = 1;
const inspectionHistoryPerPage = 10;

async function renderInspectionHistory() {
    const container = document.getElementById("inspectionHistoryBody");
    if (!container) return;

    if (!reportInspections.length) {
        container.innerHTML = `<tr><td colspan="5">Ei tarkastuksia</td></tr>`;
        renderInspectionHistoryPagination(0);
        return;
    }

    const sorted = [...reportInspections].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const totalPages = Math.ceil(sorted.length / inspectionHistoryPerPage);

    if (inspectionHistoryPage > totalPages) {
        inspectionHistoryPage = totalPages;
    }

    const start = (inspectionHistoryPage - 1) * inspectionHistoryPerPage;
    const pageItems = sorted.slice(start, start + inspectionHistoryPerPage);

    const rows = await Promise.all(
        pageItems.map(async inspection => {
            const vehicle = reportVehicles.find(
                item => Number(item.id_vehicles) === Number(inspection.id_vehicles)
            );

            const passed = Number(inspection.passed) === 1;
            const studentName = await getUserName(inspection);

            return `
                <tr>
                    <td>${formatReportDate(inspection.date)}</td>
                    <td>${escapeReportHtml(vehicle?.name || "-")}</td>
                    <td>${escapeReportHtml(studentName)}</td>
                    <td>${inspection.km ?? "-"} km</td>
                    <td>
                        <span class="${passed ? "report-result report-result-passed" : "report-result report-result-failed"}">
                            ${passed ? "Hyväksytty" : "Hylätty"}
                        </span>
                    </td>
                </tr>
            `;
        })
    );

    container.innerHTML = rows.join("");

    renderInspectionHistoryPagination(totalPages);
}
async function getUserName(inspection) {
    const response = await fetch(
        restapi + "/api/users/" + inspection.id_users
    );

    if (!response.ok) {
        console.error("Get user's name error:", response.status);
        return "-";
    }

    const data = await response.json();
    return data.username || "-";
}

function renderInspectionHistoryPagination(totalPages) {
    const container = document.getElementById("inspectionHistoryPagination");
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const pages = [];

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else if (inspectionHistoryPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
    } else if (inspectionHistoryPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
        pages.push(
            1,
            "...",
            inspectionHistoryPage - 1,
            inspectionHistoryPage,
            inspectionHistoryPage + 1,
            "...",
            totalPages
        );
    }

    container.innerHTML = `
        <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            ${inspectionHistoryPage === 1 ? "disabled" : ""}
            onclick="changeInspectionHistoryPage(${inspectionHistoryPage - 1})">
            ‹
        </button>

        ${pages.map(page => {
            if (page === "...") {
                return `<span class="inspection-pagination-dots">...</span>`;
            }

            return `
                <button
                    type="button"
                    class="btn btn-sm ${page === inspectionHistoryPage
                        ? "btn-primary"
                        : "btn-outline-secondary"}"
                    onclick="changeInspectionHistoryPage(${page})">
                    ${page}
                </button>
            `;
        }).join("")}

        <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            ${inspectionHistoryPage === totalPages ? "disabled" : ""}
            onclick="changeInspectionHistoryPage(${inspectionHistoryPage + 1})">
            ›
        </button>
    `;
}

function changeInspectionHistoryPage(page) {
    if (page < 1) return;

    const totalPages = Math.ceil(
        reportInspections.length / inspectionHistoryPerPage
    );

    if (page > totalPages) return;

    inspectionHistoryPage = page;
    renderInspectionHistory();
}

function formatReportDate(date) {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return date;
    }

    return value.toLocaleString("fi-FI", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function escapeReportHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    loadReports();
});