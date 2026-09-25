<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
CheckAccessSession(["teacher", "admin"]);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n='title'>Hyria Garage</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="/assets/style.css">
    <link rel="stylesheet" href="addvehicle.css">
    <link rel ="stylesheet" href="createChecklists.css">
    <link rel="stylesheet" href="inspection-report.css">
    <meta name='data-i18n-url' content='./index.lang'>
    <meta name='data-i18n-languages' content='fi;en'>
</head>
<body>
    <header class="topbar">
        <div class="topbar-row">
            <a class="brand" href="#home" aria-label="Hyria Garage home">
                <span class="brand-mark" aria-hidden="true">&#x26DF;</span>
                <strong data-i18n="title">Hyria Garage</strong>
            </a>
            <div class="header-actions">
                <button class="language-switch" type="button"  data-i18n="langswitch" data-language-switch>EN</button>
                <button class="logout" type="button" data-i18n="logout">&#x21AA;&nbsp; Logout</button>
            </div>
        </div>
        <div class="topbar-row">
            <nav class="main-nav" aria-label="Main navigation">
                <a href="#home" data-view="home"><span>&#x2317;</span data-i18n="home">Home</a>
                <a href="#fleet" data-view="fleet"><span class="nav-icon" aria-hidden="true">&#x26DF;</span data-i18n="garage">Garage</a>
                <a href="#inspections" data-view="inspections"><span>&#x1F5B9;</span data-i18n="inspections">Inspections</a>
                <a href="#faults" data-view="faults"><span>&#x25B3;</span data-i18n="faults">Faults</a>
                <a href="#reports" data-view="reports"><span>&#x25A5;</span data-i18n="reports">Reports</a>
            </nav>
        </div>
    </header>

    <main id="app" class="page">
        <section data-view-content="home">
            <div class="page-heading"><div><h1 data-i18n="home">Home</h1><p class="subtitle"data-i18n="overviewoffleet">Overview of the fleet and recent events</p></div></div>
            <div class="cards">
                <article class="card-teacher-main-page"><span class="card-icon" aria-hidden="true">&#x26DF;</span><strong id="totalvehicles" class="card-value"></strong><span class="card-label" data-18n="totalvehicle">Total vehicles</span></article>
                <article class="card-teacher-main-page"><span class="card-icon green">&#x2713;</span><strong id="totalavailable"class="card-value"></strong><span class="card-label" data-i18n="availablevehicle">Available</span></article>
                <article class="card-teacher-main-page"><span class="card-icon">&#x1F5B9;</span><strong id="totalinspections" class="card-value"></strong><span class="card-label" data-i18n="totalinspection">Total inspections</span></article>
                <article class="card-teacher-main-page"><span class="card-icon green">&#x25B3;</span><strong id="totalfaults" class="card-value"></strong><span class="card-label" data-i18n="openfault">Open faults</span></article>
            </div>
            <div class="grid-2">
                <section class="panel large"><h2 class="panel-title" data-i18n="recentinspection">Recent inspections<a class="panel-action" href="#inspections">View all</a></h2><div class="empty" data-i18n="noinspection">No inspections yet</div></section>
                <section class="panel large"><h2 class="panel-title" data-i18n="openfault">Open faults<a class="panel-action" href="#faults">View all</a></h2><div class="empty" data-i18n="noopenfault">No open faults - all good!</div></section>
            </div>
        </section>

        <section data-view-content="fleet" hidden>
            <div class="page-heading"><div><h1>Garage</h1><p class="subtitle" data-i18n="managefleet">Manage your fleet</p></div>
            <button class="button" id="addVehicleButton" type="button" data-i18n="addvehicle">&#xFF0B;&nbsp; Add vehicle</button>
            <div id="addVehicleModal" class="vehicle-modal">
    <div class="vehicle-modal-content">

        <div class="vehicle-modal-header">
            <h2 data-i18n="naddvehicle">Add Vehicle</h2>
            <button type="button" class="vehicle-modal-close" id="closeVehicleModal">
                &times;
            </button>
        </div>

        <form id="addVehicleForm">

            <!-- Vehicle information -->
            <div class="vehicle-form-section">
                <h3 data-i18n="vehicleinformation">Vehicle Information</h3>

                <div class="vehicle-form-grid">

                    <div class="vehicle-form-group">
                        <label for="vehicleName" data-i18n="vehiclename">
                            Vehicle name
                        </label>
                        <input type="text" id="vehicleName" name="name" data-i18n-placeholder="entervehicle" placeholder="Enter vehicle name" required>
                    </div>

                    <div class="vehicle-form-group">
                        <label for="vehicleType" data-i18n="vehicletype">Vehicle type</label>
                        <input type="text" id="vehicleType" name="type" data-i18n-placeholder="entervehicle"placeholder="Enter vehicle type" required>
                    </div>

                    <div class="vehicle-form-group">
                        <label for="licensePlate" data-i18n="licenseplate">License plate</label>
                        <input type="text" id="licensePlate" name="license_plate" data-i18n-placeholder="enterlicenseplate" placeholder="Enter license plate" required>
                    </div>

                    <div class="vehicle-form-group">
                        <label for="vehicleCode" data-i18n="vehiclecode">
                            Vehicle code
                        </label>
                        <input type="text" id="vehicleCode" name="code" data-i18n-placeholder="entervehiclecode" placeholder="Enter vehicle code" required>
                    </div>

                </div>
            </div>


            <!-- Maintenance information -->
            <div class="vehicle-form-section">
                <h3 data-i18n="maintenance">Maintenance</h3>

                <div class="vehicle-form-grid">

                    <div class="vehicle-form-group">
                        <label for="lastMaintenance" data-i18n="lastmaintenance">Last maintenance</label>
                        <input type="date" id="lastMaintenance" name="last_maintenance">
                    </div>

                    <div class="vehicle-form-group">
                        <label for="lastMaintenanceKm" data-i18n="lastmaintenancekm" >Last maintenance (km)</label>
                        <input type="number" id="lastMaintenanceKm" name="last_maintenance_km" placeholder="e.g. 125000" min="0">
                    </div>

                    <div class="vehicle-form-group">
                        <label for="nextMaintenance" data-i18n="nextmaintenace">
                            Next maintenance
                        </label>
                        <input type="date" id="nextMaintenance" name="next_maintenance">
                    </div>

                    <div class="vehicle-form-group">
                        <label for="maintenanceIntervalKm" data-i18n="maintenanceinterval">
                            Maintenance interval (km)
                        </label>
                        <input type="number" id="maintenanceIntervalKm" name="maintenance_interval_km" placeholder="e.g. 10000" min="0" >
                    </div>

                </div>
            </div>


            <!-- Vehicle state -->
            <div class="vehicle-form-section">
                <h3 data-i18n="status" >Status</h3>

                <div class="vehicle-form-group">
                    <label for="vehicleState" data-i18n="vehiclestate">State</label>

                    <select id="vehicleState" name="state" required>
                        <option value="" data-i18n="selectstate">Select state</option>
                        <option value="available" data-i18n="available">Available</option>
                        <option value="in use" data-i18n="inuse">In Use</option>
                        <option value="disable" data-i18n="disable">Disable</option>
                    </select>
                </div>
            </div>


            <!-- Vehicle file -->
            <div class="vehicle-form-section">
                <h3 data-i18n="vehicleimage">Vehicle Image</h3>

                <div class="vehicle-form-group">

                    <label for="vehicleFile" data-i18n="vehicleimage">Vehicle image</label>

                    <input type="file" id="vehicleFile" name="id_files" accept="image/*">
                    <div id="imagePreview" class="image-preview"></div>
                    <small class="vehicle-file-info" data-i18n="uploadimagevehicle">Upload an image of the vehicle.</small>

                </div>
            </div>


            <!-- Buttons -->
            <div class="vehicle-modal-actions">

                <button type="button" class="vehicle-btn vehicle-btn-cancel" id="cancelVehicleButton" data-i18n="cancel">
                    Cancel
                </button>

                <button type="submit" class="vehicle-btn vehicle-btn-add" data-i18n="addvehicle">
                    Add Vehicle
                </button>

            </div>

        </form>
    </div>
</div>
        </div>
            <section id="car" class="garage-list">
                <div class="empty"><span class="empty-icon" aria-hidden="true">&#x26DF;</span data-i18n="novehiclesyet">No vehicles yet. Add the first one!</div>
            </section>
        </section>

        <section data-view-content="inspections" hidden>
            <div class="page-heading"><div><h1 data-i18n="inspections">Inspections</h1><p class="subtitle" data-i18n="allvehicledeparture">All vehicle departure inspections</p></div>
            <button class="button" id="assignChecklistButton" type="button" data-i18n="assignchecklist">&#xFF0B;&nbsp; Assign Checklist</button>
            <div id="vehicleChecklistModal" class="checklist-modal">
        <div class="checklist-modal-content">
            <div class="checklist-modal-header">
                <h2 data-i18n="nassignchecklists">Assign Checklists</h2>
                <button type="button" class="checklist-modal-close" id="closeChecklistModal">&times;</button>
            </div>
            <div class="vehicle-selector">
                <label for="vehicleSelect" data-i18n="vehicle">Vehicle</label>
                <select id="vehicleSelect"></select>
            </div>

            <div id="selectedVehicle" class="selected-vehicle">
                <div class="selected-vehicle-image">
                    <img id="selectedVehicleImage" src="" alt="Vehicle">
                </div>

                <div class="selected-vehicle-info">
                    <h3 id="selectedVehicleName"></h3>
                    <p>
                        <span data-i18n="license:">License:</span>
                        <strong id="selectedVehicleLicense"></strong>
                    </p>
                    <p>
                        <span data-i18n="type:">Type:</span>
                        <strong id="selectedVehicleType"></strong>
                    </p>
                </div>
            </div>

            <div class="checklist-lists">
                <div class="checklist-list-container">
                    <div class="checklist-list-header">
                        <div>
                            <h3 data-i18n="assignedchecklists">Assigned Checklists</h3>

                            <span id="assignedChecklistCount">
                                0
                            </span>
                        </div>
                    </div>

                    <div id="assignedChecklistList" class="checklist-list assigned-list">
                        <div class="checklist-empty" data-i18n="dragchecklsits">
                            Drag checklists here
                        </div>
                    </div>
                </div>

                <div class="checklist-list-container">
                    <div class="checklist-list-header">
                        <div>
                            <h3 data-i18n="availablechecklists">Available Checklists</h3>
                            <span id="availableChecklistCount">0</span>
                        </div>
                        <button type="button" id="addChecklistButton" class="add-checklist-button" data-i18n="+addchecklist">+ Add Checklist</button>
                    </div>

                    <div id="availableChecklistList" class="checklist-list available-list">
                        <div class="checklist-empty" data-i18n="loadingchecklists">
                            Loading checklists...
                        </div>
                    </div>
                </div>
            </div>

            <div class="checklist-modal-actions">
                <button type="button" id="cancelChecklistButton" class="checklist-btn checklist-btn-cancel" data-i18n="cancel">
                    Cancel
                </button>

                <button type="button" id="submitChecklistButton" class="checklist-btn checklist-btn-submit" data-i18n="submit">
                    Submit
                </button>
            </div>
        </div>
    </div>
    <div class="modal fade" id="editChecklistModal" tabindex="-1" aria-labelledby="editChecklistModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editChecklistModalLabel" data-i18n="editchecklist">
                    Edit Checklist
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="editChecklistForm">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="editChecklistName" class="form-label" data-i18n="name">Name</label>
                        <input type="text" class="form-control" id="editChecklistName" required>
                    </div>
                    <div class="mb-3">
                        <label for="editChecklistDescription" class="form-label" data-i18n="description">Description</label>
                        <textarea class="form-control" id="editChecklistDescription" rows="5"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="cancel">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveEditChecklistButton" data-i18n="save">Save</button>
                </div>
            </form>

        </div>
    </div>
</div>
    <div id="addChecklistModal" class="checklist-modal checklist-modal-small">
        <div class="checklist-modal-content">
            <div class="checklist-modal-header">
                <h2 data-i18n="addchecklist">Add Checklist</h2>
                <button type="button" class="checklist-modal-close" id="closeAddChecklistModal">&times;</button>
            </div>
            <form id="addChecklistForm">
                <div class="checklist-form-group">
                    <label for="newChecklistName" data-i18n="checklistname">Checklist name</label>
                    <input type="text" id="newChecklistName" data-i18n-placeholder="enterchecklistname" placeholder="Enter checklist name" required>
                </div>
                <div class="checklist-form-group">
                    <label for="newChecklistDescription" data-i18n="description" >Description</label>
                    <textarea id="newChecklistDescription" data-i18n-placeholder="enterchecklistdescription" placeholder="Enter checklist description" rows="5" required></textarea>
                </div>
                <div class="checklist-modal-actions">
                    <button type="button" id="cancelAddChecklistButton" class="checklist-btn checklist-btn-cancel">Cancel</button>

                    <button type="submit" class="checklist-btn checklist-btn-submit" data-i18n=" addchecklist"> Add Checklist</button>
                </div>
            </form>
        </div>
    </div>
        </div>
            <section class="panel single-panel">
    <div class="inspection-header">
        <div>
            <h2 class="inspection-header-h2" data-i18n="vehicles">Vehicles</h2>
            <p data-i18n="clickavehicletodeparture">Click a vehicle to start the departure inspection</p>
        </div>
        <button type="button" class="inspection-refresh btn btn-primary btn-sm" id="refreshInspections" data-i18n="refresh">↻ Refresh</button>
    </div>

    <div id="inspectionList" class="vehicle-card-grid">
        <div class="inspection-loading" data-i18n="loadingvehicles">Loading vehicles...</div>
    </div>
</section>
        </section>

        <section data-view-content="faults" hidden>
    <div class="page-heading">
        <div>
            <h1 data-i18n="problems">Problems</h1>
            <p class="subtitle" data-i18n="trackandresolveproblems">Track and resolve vehicle problems</p>
        </div>

        <div class="problem-toolbar">
            <div class="vehicle-filter">
                <button type="button" class="btn btn-outline-secondary" id="vehicleFilterButton" data-i18n="vehicle">
                    Vehicle
                </button>

                <div id="vehicleFilterDropdown" class="vehicle-filter-dropdown" hidden>
                    <input type="text" id="vehicleSearchInput" class="form-control" data-i18n-placeholder="searchvehicle" placeholder="Search vehicle...">
                    <div id="vehicleFilterList" class="vehicle-filter-list"></div>
                </div>
            </div>

            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="problemSortButton" data-bs-toggle="dropdown" aria-expanded="false" data-i18n="sort">Sort</button>

                <ul class="dropdown-menu dropdown-menu-end" id="problemSortMenu">
                    <li>
                        <button class="dropdown-item" type="button" data-sort="priority-desc" data-i18n="priorityhigh">
                            Priority: High ↓
                        </button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button" data-sort="priority-asc" data-i18n="prioritylow">
                            Priority: Low ↑
                        </button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button" data-sort="open" data-i18n="open">
                            Open
                        </button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button" data-sort="resolved" data-i18n="resolved">
                            Resolved
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <section class="panel single-panel">
        <div class="problem-header">
            <div>
                <h2 data-i18n="problems">Problems</h2>
                <p>All reported vehicle problems</p>
            </div>

            <span id="problemCount" class="badge bg-secondary">0</span>
        </div>

        <div id="problemList" class="problem-card-grid">
            <div class="inspection-loading" data-i18n="loadingproblems">Loading problems...</div>
        </div>
    </section>
</section>

        <section data-view-content="reports" hidden>
    <div class="page-heading">
        <div>
            <h1 data-i18n="reports">Reports</h1>
            <p class="subtitle" data-i18n="fleetusageandinspection">Fleet usage and inspection reports</p>
        </div>
    </div>

    <div class="cards report-summary-cards">
        <article class="card-teacher-main-page">
            <span class="card-icon">&#x25A3;</span>
            <strong id="reportTotalInspections" class="card-value">0</strong>
            <span class="card-label" data-i18n="totalinspection">Total inspections</span>
        </article>

        <article class="card-teacher-main-page">
            <span class="card-icon green">&#x2713;</span>
            <strong id="reportPassedInspections" class="card-value">0</strong>
            <span class="card-label" data-i18n="passedinspections" >Passed inspections</span>
        </article>

        <article class="card-teacher-main-page">
            <span class="card-icon orange">&#x1F5B9;</span>
            <strong id="reportTotalProblems" class="card-value">0</strong>
            <span class="card-label" data-i18n="totalproblems">Total problems</span>
        </article>

        <article class="card-teacher-main-page">
            <span class="card-icon red">&#x25B3;</span>
            <strong id="reportOpenProblems" class="card-value">0</strong>
            <span class="card-label" data-i18n="openproblems">Open problems</span>
        </article>
    </div>

    <div class="grid-2 report-charts">
        <section class="panel large">
            <h2 class="panel-title" data-i18n="inspectionspervehicle">
                <span class="icon">&#x25A3;</span>
                Inspections per vehicle
            </h2>

            <div id="inspectionsPerVehicleChart" class="report-chart">
                <div class="empty" data-i18n="noinspectiondata">No inspection data</div>
            </div>
        </section>

        <section class="panel large">
            <h2 class="panel-title" data-i18n="inspectionresults">
                <span class="icon">&#x2713;</span>
                Inspection results
            </h2>

            <div id="inspectionResultsChart" class="report-chart">
                <div class="empty" data-i18n="noinspectiondata">No inspection data</div>
            </div>
        </section>

        <section class="panel large">
            <h2 class="panel-title" data-i18n="problemspervehicle">
                <span class="icon">&#x1F5B9;</span>
                Problems per vehicle
            </h2>

            <div id="problemsPerVehicleChart" class="report-chart">
                <div class="empty" data-i18n="noproblemdata">No problem data</div>
            </div>
        </section>

        <section class="panel large">
            <h2 class="panel-title" data-i18n="problemstatus">
                <span class="icon">&#x25A3;</span>
                Problem status
            </h2>

            <div id="problemStatusChart" class="report-chart">
                <div class="empty" data-i18n="noproblemdata">No problem data</div>
            </div>
        </section>
    </div>

    <section class="panel table-panel">
        <h2 class="panel-title" data-i18n="inspectionhistory">
            <span class="icon">&#x25A3;</span>
            Inspection history
        </h2>

        <div class="table-responsive">
            <table class="table" id="inspectionHistoryTable">
                <thead>
                    <tr>
                        <th data-i18n="date">Date</th>
                        <th data-i18n="vehicle">Vehicle</th>
                        <th data-i18n="student">Student</th>
                        <th data-i18n="odometer">Odometer</th>
                        <th data-i18n="result">Result</th>
                    </tr>
                </thead>

                <tbody id="inspectionHistoryBody">
                    <tr>
                        <td colspan="5" data-i18n="noinspectiondata">No inspection data</td>
                    </tr>
                </tbody>
            </table>
            <div id="inspectionHistoryPagination" class="inspection-history-pagination"></div>
        </div>
    </section>
</section>
<div class="modal fade" id="editProblemModal" tabindex="-1" aria-labelledby="editProblemModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editProblemModalLabel">Edit Problem</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <form id="editProblemForm">
                <div class="modal-body">
                     <div class="problem-image-container">
                        <label class="form-label" data-i18n="problemimage">Problem Image</label>
                        <div id="editProblemImageBox" class="problem-image-box">
                            <span data-i18n="noimage">No image</span>
                            <img id="editProblemImage" src="" alt="Problem image">
                        </div>
                        <label class="form-label" data-i18n="description">Description</label>
                        <div id="problemDescription" class="container-fluid justify-content-start text-left border rounded-1 fs-6">description goes here</div>
                    </div>
                    <div class="mb-3">
                        <label for="editProblemPriority" class="form-label" data-i18n="priority">Priority</label>
                        <select id="editProblemPriority" class="form-select">
                            <option value="low" data-i18n="low">Low</option>
                            <option value="medium" data-i18n="medium">Medium</option>
                            <option value="high" data-i18n="high">High</option>
                            <option value="critical" data-i18n="critical">Critical</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="editProblemState" class="form-label" data-i18n="state">State</label>
                        <select id="editProblemState" class="form-select">
                            <option value="open" data-i18n="open">Open</option>
                            <option value="resolved" data-i18n="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-i18n="cancel">
                        Cancel
                    </button>

                    <button type="submit" class="btn btn-primary" id="saveProblemButton" data-i18n="save">
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
    </main>
    <script src="/assets/apiCommunication.js"></script>
    <script src="/assets/languageManager.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="app.js"></script>
    <script src="vehiclelist.js"></script>
    <script src="vehicle.js"></script>
    <script src="addvehicle.js"></script>
    <script src="createChecklists.js"></script>
    <script src="inspections.js"></script>
    <script src="problems.js"></script>
    <script src="reports.js"></script>
</body>
</html>
