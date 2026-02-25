// ===== Vendor Data Store =====
let vendors = [];
let chart = null;

// ===== Settings Helper =====
const SETTINGS_KEY = "vendorguard_settings";
function getSettings() {
    const defaults = {
        displayName: "Admin User", userRole: "Risk Analyst", orgName: "",
        highThreshold: 2.3, mediumThreshold: 1.5, reviewPeriod: "90",
        framework: "both",
        notifHighRisk: true, notifOverdue: true, notifPending: true, reminderDays: "30",
        theme: "dark", compactMode: false, enableAnimations: true,
        csvDelimiter: "comma", includeControls: true, reportBranding: true
    };
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) {
        return defaults;
    }
}

// ===== ISO 27001 Control Mapping =====
const ISO_CONTROL_MAP = {
    "Cloud Hosting": { iso: "A.15.1.1, A.15.1.3", nist: "ID.SC-2, PR.AT-3" },
    "Payment Processor": { iso: "A.15.1.2, A.15.2.1", nist: "ID.SC-4, PR.DS-5" },
    "Customer Support": { iso: "A.15.1.1, A.15.2.2", nist: "ID.SC-1, PR.AT-1" },
    "Email Service": { iso: "A.15.1.1, A.15.1.2", nist: "ID.SC-2, PR.DS-2" },
    "Data Analytics": { iso: "A.15.1.2, A.15.1.3", nist: "ID.SC-4, PR.DS-1" },
    "Security Provider": { iso: "A.15.1.1, A.15.2.1", nist: "ID.SC-2, ID.SC-4" }
};

// ===== Risk Calculation (uses settings thresholds) =====
function calculateRiskTier(score) {
    const s = getSettings();
    if (score <= s.mediumThreshold) return "Low";
    if (score <= s.highThreshold) return "Medium";
    return "High";
}

function getLevelLabel(val) {
    if (val === 1) return "Low";
    if (val === 2) return "Medium";
    return "High";
}

function getLevelClass(val) {
    if (val === 1) return "low";
    if (val === 2) return "medium";
    return "high";
}

// ===== Add Vendor =====
function addVendor() {
    const nameInput = document.getElementById("vendorName");
    const name = nameInput.value.trim();
    const errorEl = document.getElementById("formError");

    // Validation
    if (!name) {
        errorEl.textContent = "⚠ Please enter a vendor name.";
        nameInput.focus();
        return;
    }

    errorEl.textContent = "";

    const service = document.getElementById("serviceType").value;
    const sensitivity = parseInt(document.getElementById("dataSensitivity").value);
    const access = parseInt(document.getElementById("accessLevel").value);
    const criticality = parseInt(document.getElementById("businessCriticality").value);

    const treatmentAction = document.getElementById("treatmentAction").value;
    const mitigationNotes = document.getElementById("mitigationNotes").value.trim();
    const reviewDate = document.getElementById("reviewDate").value;
    const treatmentStatus = document.getElementById("treatmentStatus").value;

    const riskScore = ((sensitivity + access + criticality) / 3).toFixed(2);
    const riskTier = calculateRiskTier(parseFloat(riskScore));

    const controls = ISO_CONTROL_MAP[service] || { iso: "A.15.1.1", nist: "ID.SC-1" };

    vendors.push({
        id: Date.now(),
        name,
        service,
        sensitivity,
        access,
        criticality,
        riskScore: parseFloat(riskScore),
        riskTier,
        isoControls: controls.iso,
        nistControls: controls.nist,
        treatmentAction,
        mitigationNotes,
        reviewDate,
        treatmentStatus
    });

    // Reset form
    nameInput.value = "";
    document.getElementById("serviceType").selectedIndex = 0;
    document.getElementById("dataSensitivity").selectedIndex = 0;
    document.getElementById("accessLevel").selectedIndex = 0;
    document.getElementById("businessCriticality").selectedIndex = 0;
    document.getElementById("treatmentAction").selectedIndex = 0;
    document.getElementById("mitigationNotes").value = "";
    document.getElementById("reviewDate").value = "";
    document.getElementById("treatmentStatus").selectedIndex = 0;

    refreshDashboard();
}

// ===== Delete Vendor =====
function deleteVendor(id) {
    vendors = vendors.filter(v => v.id !== id);
    refreshDashboard();
}

// ===== Refresh All Dashboard Elements =====
function refreshDashboard() {
    applyFrameworkBanner();
    updateStats();
    updateTreatmentStats();
    updateTable();
    updateChart();
    filterTable();
}

// ===== Apply Framework Banner based on settings =====
function applyFrameworkBanner() {
    const s = getSettings();
    const isoTag = document.getElementById("frameworkISO");
    const nistTag = document.getElementById("frameworkNIST");
    if (isoTag) isoTag.style.display = (s.framework === "nist") ? "none" : "flex";
    if (nistTag) nistTag.style.display = (s.framework === "iso") ? "none" : "flex";
}

// ===== Update Stat Cards =====
function updateStats() {
    const counts = { Low: 0, Medium: 0, High: 0 };
    vendors.forEach(v => counts[v.riskTier]++);

    animateCounter("totalVendors", vendors.length);
    animateCounter("highRiskCount", counts.High);
    animateCounter("mediumRiskCount", counts.Medium);
    animateCounter("lowRiskCount", counts.Low);

    // Update vendor count badge
    document.getElementById("vendorCountBadge").textContent =
        vendors.length + (vendors.length === 1 ? " vendor" : " vendors");

    // Rebuild notifications
    buildNotifications();
}

// ===== Update Treatment Stats =====
function updateTreatmentStats() {
    const treatCounts = { Mitigate: 0, Accept: 0, Transfer: 0, Avoid: 0 };
    const statusCounts = { Pending: 0, "In Progress": 0, Completed: 0 };
    let overdueCount = 0;
    const today = new Date().toISOString().split("T")[0];

    vendors.forEach(v => {
        if (treatCounts.hasOwnProperty(v.treatmentAction)) treatCounts[v.treatmentAction]++;
        if (statusCounts.hasOwnProperty(v.treatmentStatus)) statusCounts[v.treatmentStatus]++;
        if (v.reviewDate && v.reviewDate < today && v.treatmentStatus !== "Completed") {
            overdueCount++;
        }
    });

    document.getElementById("treatMitigate").textContent = treatCounts.Mitigate;
    document.getElementById("treatAccept").textContent = treatCounts.Accept;
    document.getElementById("treatTransfer").textContent = treatCounts.Transfer;
    document.getElementById("treatAvoid").textContent = treatCounts.Avoid;

    document.getElementById("statusPending").textContent = statusCounts.Pending;
    document.getElementById("statusInProgress").textContent = statusCounts["In Progress"];
    document.getElementById("statusCompleted").textContent = statusCounts.Completed;
    document.getElementById("statusOverdue").textContent = overdueCount;
}

// ===== Animated Counter =====
function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    const currentValue = parseInt(el.textContent) || 0;

    if (currentValue === targetValue) return;

    const duration = 400;
    const start = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        const value = Math.round(currentValue + (targetValue - currentValue) * eased);
        el.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = targetValue;
        }
    }

    requestAnimationFrame(step);
}

// ===== Update Table =====
function updateTable() {
    const tbody = document.getElementById("vendorTableBody");
    const emptyState = document.getElementById("tableEmpty");
    const table = document.getElementById("vendorTable");

    if (vendors.length === 0) {
        table.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    table.style.display = "table";
    emptyState.style.display = "none";
    tbody.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];

    vendors.forEach((v, index) => {
        const tierClass = v.riskTier.toLowerCase();
        const statusClass = v.treatmentStatus.toLowerCase().replace(/\s/g, "-");
        const isOverdue = v.reviewDate && v.reviewDate < today && v.treatmentStatus !== "Completed";
        const row = document.createElement("tr");
        row.style.animationDelay = `${index * 0.04}s`;

        const fw = getSettings().framework;
        let controlText = '';
        let controlTitle = '';
        if (fw === 'iso') {
            controlText = v.isoControls;
            controlTitle = `ISO: ${v.isoControls}`;
        } else if (fw === 'nist') {
            controlText = v.nistControls;
            controlTitle = `NIST: ${v.nistControls}`;
        } else {
            controlText = v.isoControls;
            controlTitle = `ISO: ${v.isoControls} | NIST: ${v.nistControls}`;
        }

        row.innerHTML = `
            <td>
                <div class="vendor-cell">
                    <strong>${escapeHtml(v.name)}</strong>
                    <span class="vendor-controls" title="${controlTitle}">
                        <i class="fa-solid fa-certificate"></i> ${controlText}
                    </span>
                </div>
            </td>
            <td>${v.service}</td>
            <td>
                <span class="level-indicator">
                    <span class="level-dot ${getLevelClass(v.sensitivity)}"></span>
                    ${getLevelLabel(v.sensitivity)}
                </span>
            </td>
            <td>
                <span class="level-indicator">
                    <span class="level-dot ${getLevelClass(v.access)}"></span>
                    ${getLevelLabel(v.access)}
                </span>
            </td>
            <td>
                <span class="level-indicator">
                    <span class="level-dot ${getLevelClass(v.criticality)}"></span>
                    ${getLevelLabel(v.criticality)}
                </span>
            </td>
            <td>
                <span class="score-display score-${tierClass}">${v.riskScore.toFixed(2)}</span>
            </td>
            <td>
                <span class="badge badge-${tierClass}">
                    <i class="fa-solid ${tierClass === 'high' ? 'fa-triangle-exclamation' : tierClass === 'medium' ? 'fa-exclamation-circle' : 'fa-circle-check'}"></i>
                    ${v.riskTier}
                </span>
            </td>
            <td>
                <span class="treatment-badge treatment-${v.treatmentAction.toLowerCase()}">
                    ${v.treatmentAction}
                </span>
            </td>
            <td>
                <span class="status-badge status-${statusClass}">
                    ${v.treatmentStatus}
                </span>
            </td>
            <td>
                <span class="${isOverdue ? 'review-overdue' : 'review-date'}">
                    ${v.reviewDate || '—'}
                    ${isOverdue ? ' <i class="fa-solid fa-clock" title="Overdue"></i>' : ''}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="openEditModal(${v.id})" title="Edit vendor">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action btn-comment" onclick="openCommentModal(${v.id})" title="Notes & comments">
                        <i class="fa-solid fa-comment-dots"></i>
                        ${(v.comments && v.comments.length > 0) ? `<span class="comment-count">${v.comments.length}</span>` : ''}
                    </button>
                    <button class="btn-action btn-remove" onclick="deleteVendor(${v.id})" title="Remove vendor">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ===== Update Chart =====
function updateChart() {
    const chartEmpty = document.getElementById("chartEmpty");
    const canvas = document.getElementById("riskChart");

    if (vendors.length === 0) {
        chartEmpty.style.display = "block";
        canvas.style.display = "none";
        if (chart) {
            chart.destroy();
            chart = null;
        }
        return;
    }

    chartEmpty.style.display = "none";
    canvas.style.display = "block";

    const counts = { Low: 0, Medium: 0, High: 0 };
    vendors.forEach(v => counts[v.riskTier]++);

    const data = {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [{
            data: [counts.Low, counts.Medium, counts.High],
            backgroundColor: [
                "rgba(34, 197, 94, 0.75)",
                "rgba(245, 158, 11, 0.75)",
                "rgba(239, 68, 68, 0.75)"
            ],
            borderColor: [
                "rgba(34, 197, 94, 1)",
                "rgba(245, 158, 11, 1)",
                "rgba(239, 68, 68, 1)"
            ],
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 8
        }]
    };

    const config = {
        type: "doughnut",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#8896a8",
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12,
                            weight: 500
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyleWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: "#1a2736",
                    titleColor: "#e8ecf1",
                    bodyColor: "#8896a8",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: {
                        family: "'Inter', sans-serif",
                        weight: 600
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif"
                    },
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return ` ${context.raw} vendor${context.raw !== 1 ? 's' : ''} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: "easeOutQuart"
            }
        }
    };

    if (chart) chart.destroy();
    chart = new Chart(canvas, config);
}

// ===== Export to CSV =====
function exportCSV() {
    if (vendors.length === 0) {
        alert("No vendors to export.");
        return;
    }

    const s = getSettings();
    const delim = s.csvDelimiter === "semicolon" ? ";" : s.csvDelimiter === "tab" ? "\t" : ",";

    const headers = [
        "Vendor Name", "Service Type", "Data Sensitivity", "Access Level",
        "Business Criticality", "Risk Score", "Risk Tier"
    ];

    if (s.includeControls) {
        if (s.framework === "both" || s.framework === "iso") headers.push("ISO 27001 Controls");
        if (s.framework === "both" || s.framework === "nist") headers.push("NIST CSF Controls");
    }

    headers.push("Treatment Action", "Mitigation Notes", "Review Date", "Treatment Status");

    const rows = vendors.map(v => {
        const row = [
            `"${v.name}"`,
            `"${v.service}"`,
            getLevelLabel(v.sensitivity),
            getLevelLabel(v.access),
            getLevelLabel(v.criticality),
            v.riskScore.toFixed(2),
            v.riskTier
        ];

        if (s.includeControls) {
            if (s.framework === "both" || s.framework === "iso") row.push(`"${v.isoControls}"`);
            if (s.framework === "both" || s.framework === "nist") row.push(`"${v.nistControls}"`);
        }

        row.push(
            v.treatmentAction,
            `"${(v.mitigationNotes || '').replace(/"/g, '""')}"`,
            v.reviewDate || "",
            v.treatmentStatus
        );
        return row;
    });

    let csv = "";
    if (s.reportBranding && s.orgName) {
        csv += `"Vendor Risk Report — ${s.orgName}"${delim}"Generated: ${new Date().toISOString().split('T')[0]}"\n\n`;
    }
    csv += headers.join(delim) + "\n";
    rows.forEach(r => csv += r.join(delim) + "\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendor_risk_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== Search / Filter =====
function filterTable() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    const rows = document.querySelectorAll("#vendorTableBody tr");

    // Scroll to the vendor table when user starts searching
    if (query.length > 0) {
        const vendorSection = document.getElementById("section-vendors");
        if (vendorSection) {
            vendorSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    rows.forEach(row => {
        const name = row.querySelector("td:first-child")?.textContent?.toLowerCase() || "";
        const service = row.querySelector("td:nth-child(2)")?.textContent?.toLowerCase() || "";
        row.style.display = (name.includes(query) || service.includes(query)) ? "" : "none";
    });
}

// ===== Escape HTML =====
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ===== Edit Vendor Modal =====
function openEditModal(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    document.getElementById("editVendorId").value = vendorId;
    document.getElementById("editVendorName").value = vendor.name;
    document.getElementById("editServiceType").value = vendor.service;
    document.getElementById("editSensitivity").value = vendor.sensitivity;
    document.getElementById("editAccess").value = vendor.access;
    document.getElementById("editCriticality").value = vendor.criticality;
    document.getElementById("editTreatment").value = vendor.treatmentAction;
    document.getElementById("editStatus").value = vendor.treatmentStatus;
    document.getElementById("editReviewDate").value = vendor.reviewDate || "";
    document.getElementById("editNotes").value = vendor.mitigationNotes || "";

    document.getElementById("editModalOverlay").classList.add("open");
}

function closeEditModal() {
    document.getElementById("editModalOverlay").classList.remove("open");
}

function saveVendorEdit() {
    const vendorId = parseFloat(document.getElementById("editVendorId").value);
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const name = document.getElementById("editVendorName").value.trim();
    if (!name) {
        alert("Vendor name is required.");
        return;
    }

    vendor.name = name;
    vendor.service = document.getElementById("editServiceType").value;
    vendor.sensitivity = parseInt(document.getElementById("editSensitivity").value);
    vendor.access = parseInt(document.getElementById("editAccess").value);
    vendor.criticality = parseInt(document.getElementById("editCriticality").value);
    vendor.treatmentAction = document.getElementById("editTreatment").value;
    vendor.treatmentStatus = document.getElementById("editStatus").value;
    vendor.reviewDate = document.getElementById("editReviewDate").value;
    vendor.mitigationNotes = document.getElementById("editNotes").value.trim();

    // Recalculate risk
    const riskScore = ((vendor.sensitivity + vendor.access + vendor.criticality) / 3).toFixed(2);
    vendor.riskScore = parseFloat(riskScore);
    vendor.riskTier = calculateRiskTier(vendor.riskScore);

    // Update controls based on new service type
    const controls = ISO_CONTROL_MAP[vendor.service] || { iso: "A.15.1.1", nist: "ID.SC-1" };
    vendor.isoControls = controls.iso;
    vendor.nistControls = controls.nist;

    closeEditModal();
    refreshDashboard();
}

// ===== Comment / Notes System =====
function openCommentModal(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    // Init comments array if not exists
    if (!vendor.comments) vendor.comments = [];

    // If vendor has mitigationNotes but no comments, seed initial comment from notes
    if (vendor.mitigationNotes && vendor.comments.length === 0) {
        vendor.comments.push({
            text: vendor.mitigationNotes,
            author: "System",
            timestamp: new Date(vendor.id).toISOString(),
            type: "note"
        });
    }

    document.getElementById("commentVendorId").value = vendorId;
    document.getElementById("commentVendorName").textContent = vendor.name + " — " + vendor.service;
    document.getElementById("commentInput").value = "";

    renderComments(vendor);
    document.getElementById("commentModalOverlay").classList.add("open");

    // Focus input
    setTimeout(() => document.getElementById("commentInput").focus(), 200);
}

function closeCommentModal() {
    document.getElementById("commentModalOverlay").classList.remove("open");
}

function addComment() {
    const vendorId = parseFloat(document.getElementById("commentVendorId").value);
    const vendor = vendors.find(v => v.id === vendorId);
    const input = document.getElementById("commentInput");
    const text = input.value.trim();

    if (!vendor || !text) return;

    if (!vendor.comments) vendor.comments = [];

    vendor.comments.push({
        text,
        author: "Admin User",
        timestamp: new Date().toISOString(),
        type: "comment"
    });

    input.value = "";
    renderComments(vendor);
    refreshDashboard();
}

function renderComments(vendor) {
    const thread = document.getElementById("commentThread");

    if (!vendor.comments || vendor.comments.length === 0) {
        thread.innerHTML = `
            <div class="comment-empty">
                <i class="fa-regular fa-comment-dots"></i>
                <p>No notes yet. Add the first note below.</p>
            </div>
        `;
        return;
    }

    thread.innerHTML = vendor.comments.map((c, i) => {
        const date = new Date(c.timestamp);
        const timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            + " at " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const isSystem = c.type === "note";
        return `
            <div class="comment-item ${isSystem ? 'comment-system' : ''}">
                <div class="comment-avatar ${isSystem ? 'avatar-system' : ''}">
                    <i class="fa-solid ${isSystem ? 'fa-robot' : 'fa-user'}"></i>
                </div>
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-author">${escapeHtml(c.author)}</span>
                        <span class="comment-time">${timeStr}</span>
                        <button class="comment-delete" onclick="deleteComment(${vendor.id}, ${i})" title="Delete note">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="comment-text">${escapeHtml(c.text)}</div>
                </div>
            </div>
        `;
    }).join("");

    // Auto-scroll to bottom
    thread.scrollTop = thread.scrollHeight;
}

function deleteComment(vendorId, commentIndex) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.comments) return;
    vendor.comments.splice(commentIndex, 1);
    renderComments(vendor);
    refreshDashboard();
}

// ===== Mobile Sidebar Toggle =====
function setupMobileMenu() {
    const hamburger = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
        });
    }

    if (overlay) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }
}

// ===== Sample Data =====
function loadSampleData() {
    const today = new Date();
    const futureDate = (daysAhead) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split("T")[0];
    };
    const pastDate = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split("T")[0];
    };

    const sampleVendors = [
        {
            name: "AWS Cloud Services", service: "Cloud Hosting",
            sensitivity: 3, access: 3, criticality: 3,
            treatmentAction: "Mitigate", mitigationNotes: "Require annual SOC 2 Type II audit, enforce MFA on all admin accounts, enable CloudTrail logging",
            reviewDate: futureDate(45), treatmentStatus: "In Progress"
        },
        {
            name: "Stripe Payments", service: "Payment Processor",
            sensitivity: 3, access: 2, criticality: 3,
            treatmentAction: "Mitigate", mitigationNotes: "Validate PCI DSS Level 1 compliance, review tokenization practices",
            reviewDate: futureDate(30), treatmentStatus: "Completed"
        },
        {
            name: "Zendesk", service: "Customer Support",
            sensitivity: 2, access: 1, criticality: 2,
            treatmentAction: "Accept", mitigationNotes: "Low data exposure, standard SLA in place",
            reviewDate: futureDate(90), treatmentStatus: "Completed"
        },
        {
            name: "SendGrid", service: "Email Service",
            sensitivity: 1, access: 1, criticality: 1,
            treatmentAction: "Accept", mitigationNotes: "No sensitive data processed, API key rotation policy enforced",
            reviewDate: futureDate(180), treatmentStatus: "Completed"
        },
        {
            name: "Snowflake", service: "Data Analytics",
            sensitivity: 3, access: 2, criticality: 2,
            treatmentAction: "Mitigate", mitigationNotes: "Implement data masking, enforce column-level security, require annual pen test",
            reviewDate: pastDate(10), treatmentStatus: "Pending"
        },
    ];

    sampleVendors.forEach(s => {
        const riskScore = ((s.sensitivity + s.access + s.criticality) / 3).toFixed(2);
        const riskTier = calculateRiskTier(parseFloat(riskScore));
        const controls = ISO_CONTROL_MAP[s.service] || { iso: "A.15.1.1", nist: "ID.SC-1" };
        vendors.push({
            id: Date.now() + Math.random() * 10000,
            name: s.name,
            service: s.service,
            sensitivity: s.sensitivity,
            access: s.access,
            criticality: s.criticality,
            riskScore: parseFloat(riskScore),
            riskTier,
            isoControls: controls.iso,
            nistControls: controls.nist,
            treatmentAction: s.treatmentAction,
            mitigationNotes: s.mitigationNotes,
            reviewDate: s.reviewDate,
            treatmentStatus: s.treatmentStatus
        });
    });
}

// ===== Notification System =====
let notificationsDismissed = false;

function buildNotifications() {
    if (notificationsDismissed) return;

    const items = [];
    const today = new Date().toISOString().split("T")[0];
    const s = getSettings();

    // High risk vendor alerts
    if (s.notifHighRisk) {
        const highRisk = vendors.filter(v => v.riskTier === "High");
        if (highRisk.length > 0) {
            items.push({
                icon: "fa-triangle-exclamation",
                color: "var(--accent-red)",
                title: `${highRisk.length} High Risk Vendor${highRisk.length > 1 ? 's' : ''}`,
                desc: highRisk.map(v => v.name).join(", "),
                time: "Active"
            });
        }
    }

    // Overdue review alerts
    if (s.notifOverdue) {
        const overdue = vendors.filter(v => v.reviewDate && v.reviewDate < today && v.treatmentStatus !== "Completed");
        if (overdue.length > 0) {
            items.push({
                icon: "fa-clock",
                color: "var(--accent-amber)",
                title: `${overdue.length} Overdue Review${overdue.length > 1 ? 's' : ''}`,
                desc: overdue.map(v => v.name).join(", "),
                time: "Action required"
            });
        }
    }

    // Pending treatment alerts
    if (s.notifPending) {
        const pending = vendors.filter(v => v.treatmentStatus === "Pending");
        if (pending.length > 0) {
            items.push({
                icon: "fa-hourglass-half",
                color: "var(--accent-amber)",
                title: `${pending.length} Pending Treatment${pending.length > 1 ? 's' : ''}`,
                desc: pending.map(v => v.name).join(", "),
                time: "Needs attention"
            });
        }
    }

    // Upcoming reviews (using settings reminder window)
    const reminderDays = parseInt(s.reminderDays) || 30;
    const upcoming = vendors.filter(v => {
        if (!v.reviewDate || v.treatmentStatus === "Completed") return false;
        const diff = (new Date(v.reviewDate) - new Date()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= reminderDays;
    });
    if (upcoming.length > 0) {
        items.push({
            icon: "fa-calendar-check",
            color: "var(--accent-blue)",
            title: `${upcoming.length} Review${upcoming.length > 1 ? 's' : ''} Due Soon`,
            desc: upcoming.map(v => `${v.name} (${v.reviewDate})`).join(", "),
            time: `Within ${reminderDays} days`
        });
    }

    // Update badge
    const badge = document.getElementById("notifBadge");
    if (items.length > 0) {
        badge.textContent = items.length;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }

    // Update panel body
    const list = document.getElementById("notifList");
    if (items.length === 0) {
        list.innerHTML = '<p class="notif-empty"><i class="fa-solid fa-check-circle"></i> All clear — no alerts</p>';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="notif-item">
            <div class="notif-icon" style="color: ${item.color}">
                <i class="fa-solid ${item.icon}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-title">${item.title}</div>
                <div class="notif-desc">${item.desc}</div>
            </div>
            <span class="notif-time">${item.time}</span>
        </div>
    `).join("");
}

function toggleNotifications() {
    const panel = document.getElementById("notificationPanel");
    panel.classList.toggle("open");
}

function clearNotifications() {
    notificationsDismissed = true;
    const badge = document.getElementById("notifBadge");
    badge.style.display = "none";
    const list = document.getElementById("notifList");
    list.innerHTML = '<p class="notif-empty"><i class="fa-solid fa-check-circle"></i> All clear — no alerts</p>';
}

// ===== Sidebar Navigation =====
function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link[data-target]");

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Update active state
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // Scroll to target section
            const targetId = link.getAttribute("data-target");
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // Close mobile sidebar if open
            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebarOverlay");
            if (sidebar.classList.contains("active")) {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
            }
        });
    });
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();
    setupNavigation();

    // Search listener
    document.getElementById("searchInput").addEventListener("input", filterTable);

    // Close notification panel when clicking outside
    document.addEventListener("click", (e) => {
        const wrapper = document.querySelector(".notification-wrapper");
        const panel = document.getElementById("notificationPanel");
        if (wrapper && panel && !wrapper.contains(e.target)) {
            panel.classList.remove("open");
        }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeEditModal();
            closeCommentModal();
        }
    });

    // Close modals on overlay click
    document.getElementById("editModalOverlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeEditModal();
    });
    document.getElementById("commentModalOverlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeCommentModal();
    });

    // Ctrl+Enter to submit comment
    document.getElementById("commentInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addComment();
        }
    });

    // Set default review date to 90 days from now
    const defaultReview = new Date();
    defaultReview.setDate(defaultReview.getDate() + 90);
    document.getElementById("reviewDate").value = defaultReview.toISOString().split("T")[0];

    // Load sample data
    loadSampleData();
    refreshDashboard();
});