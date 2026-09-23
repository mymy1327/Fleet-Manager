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

    const closed = reportProblems.filter(
        problem => String(problem.state).toLowerCase() === "closed"
    ).length;

    renderResultChart(container, [
        { name: "Open", value: open },
        { name: "Closed", value: closed }
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
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (!total) {
        container.innerHTML = '<div class="report-chart-empty">Ei tietoja</div>';
        return;
    }

    container.innerHTML = `
        <div class="report-result-list">
            ${data.map(item => `
                <div class="report-result-item">
                    <span class="report-result-value">${item.value}</span>
                    <span class="report-result-label">${item.name}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderInspectionHistory() {
    const container = document.getElementById("inspectionHistoryBody");
    if (!container) return;

    if (!reportInspections.length) {
        container.innerHTML = `
            <tr>
                <td colspan="5">Ei tarkastuksia</td>
            </tr>
        `;
        return;
    }

    const sorted = [...reportInspections].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    container.innerHTML = sorted.map(inspection => {
        const vehicle = reportVehicles.find(
            item => Number(item.id_vehicles) === Number(inspection.id_vehicles)
        );

        const passed = Number(inspection.passed) === 1;

        return `
            <tr>
                <td>${formatReportDate(inspection.date)}</td>
                <td>${escapeReportHtml(vehicle?.name || "-")}</td>
                <td>${inspection.id_users ?? "-"}</td>
                <td>${inspection.km ?? "-"} km</td>
                <td>
                    <span class="${passed ? "report-result-passed" : "report-result-failed"}">
                        ${passed ? "Hyväksytty" : "Hylätty"}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
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