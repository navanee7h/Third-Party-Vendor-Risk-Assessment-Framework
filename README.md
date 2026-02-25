# 🛡️ VendorGuard — Vendor Risk Management Dashboard

A comprehensive, interactive Third-Party Risk Management (TPRM) dashboard aligned with ISO 27001:2013 and NIST Cybersecurity Framework (CSF) standards. Built to assess, monitor, and manage vendor risks through quantitative scoring, automated compliance control mapping, and structured treatment workflows.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![ISO 27001](https://img.shields.io/badge/ISO_27001:2013-Annex_A.15-blue) ![NIST CSF](https://img.shields.io/badge/NIST_CSF-ID.SC-orange)

---

## ✨ Features

### 📊 Risk Assessment Engine
- Quantitative Risk Scoring — Calculates inherent risk using a weighted model: `(Data Sensitivity + Access Level + Business Criticality) / 3`
- Automatic Risk Classification — Vendors are categorized into Low, Medium, or High risk tiers based on configurable thresholds
- Real-Time Dashboard — Interactive doughnut chart (Chart.js), animated stat cards, and a comprehensive vendor registry table

### 📋 Compliance Framework Integration
- ISO 27001:2013 (Annex A.15) — Automated mapping of Supplier Relationship controls (A.15.1.1 – A.15.2.2)
- NIST CSF (ID.SC) — Supply Chain Risk Management controls (ID.SC-1, ID.SC-2, ID.SC-4)
- Service-Based Control Assignment — Controls auto-assigned based on vendor service type (Cloud Hosting, Payment Processor, Data Analytics, etc.)
- Configurable Framework Selection — Choose ISO only, NIST only, or both from Settings

### 🔧 Risk Treatment Workflow
- Four Treatment Options — Mitigate, Accept, Transfer, Avoid (aligned with ISO 27005)
- Status Tracking — Pending → In Progress → Completed lifecycle
- Review Date Management — Scheduled review dates with overdue detection
- Treatment Summary Panels — Visual breakdown of treatment distribution and status counts

### ✏️ Inline Editing & Comments
- Edit Modal — Full vendor editing (name, service type, risk factors, treatment, status, review date, notes) with real-time risk recalculation
- Comment System — Threaded notes per vendor with timestamps, avatars, and delete capability
- Action Buttons — Edit (✏️), Comment (💬), and Delete (🗑️) per vendor row

### 🔔 Smart Notifications
- High Risk Alerts — Triggered when vendors score in the High risk tier
- Overdue Review Alerts — Flagged when review dates are past due
- Pending Treatment Alerts — Highlighted when treatments are awaiting action
- Upcoming Review Reminders — Configurable reminder window (7/14/30 days)
- Notification Preferences — Toggle each alert type on/off from Settings

### ⚙️ Configurable Settings
- Profile & Organization — Display name, role, company branding
- Risk Thresholds — Adjust High/Medium cutoff scores
- Compliance Framework — Switch between ISO 27001, NIST CSF, or both
- Export Preferences — CSV delimiter (comma/semicolon/tab), control inclusion, report branding
- Appearance — Dark theme with compact mode and animation toggles
- All settings persist in `localStorage`

### 📤 Export & Reporting
- CSV Export — Full vendor registry with risk scores, control mappings, and treatment status
- Framework-Aware Export — Only includes controls for the selected compliance framework
- Report Branding — Optional organization name and timestamp header

---

## 🛠️ Tech Stack

| Layer         | Technology                                          |
|---------------|-----------------------------------------------------|
| Structure     | HTML5, Semantic Elements                            |
| Styling       | CSS3 (Custom Properties, Grid, Flexbox, Animations) |
| Logic         | Vanilla JavaScript (ES6+)                           |
| Charts        | Chart.js                                            |
| Icons         | Font Awesome 6.5                                    |
| Typography    | Google Fonts (Inter)                                |
| Persistence   | localStorage API                                    |

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools, frameworks, or servers required

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/navanee7h/Third-Party-Vendor-Risk-Assessment-Framework.git
   cd vendor-risk-dashboard
   ```

2. Open in browser
   ```bash
   # Simply open index.html in your browser
   start index.html        # Windows
   open index.html          # macOS
   xdg-open index.html      # Linux
   ```

3. That's it! The dashboard loads with sample vendor data to explore.

---

## 📁 Project Structure

```
vendor-risk-dashboard/
├── index.html          # Main dashboard page
├── settings.html       # Settings & configuration page
├── style.css           # Global styles (dark theme, components, modals)
├── script.js           # Core logic (risk engine, CRUD, charts, notifications)
└── README.md           # Project documentation
```

---

## 📐 Risk Scoring Model

```
Inherent Risk Score = (Data Sensitivity + Access Level + Business Criticality) / 3
```

| Factor               | Low (1)       | Medium (2)    | High (3)         |
|----------------------|---------------|---------------|------------------|
| Data Sensitivity     | Public data   | Internal data | PII / Financial  |
| Access Level         | Read-only     | Limited write | Full admin       |
| Business Criticality | Nice-to-have  | Important     | Mission-critical |

| Risk Tier   | Default Score Range | Color |
|-------------|---------------------|-------|
| 🟢 Low     | ≤ 1.5               | Green |
| 🟡 Medium  | 1.5 – 2.3           | Amber |
| 🔴 High    | > 2.3               | Red   |

> Thresholds are configurable from the Settings page.

---

## 🏛️ Compliance Mapping

### ISO 27001:2013 — Annex A.15

| Control   | Description                                              |
|-----------|----------------------------------------------------------|
| A.15.1.1  | Information security policy for supplier relationships   |
| A.15.1.2  | Addressing security within supplier agreements           |
| A.15.1.3  | ICT supply chain                                         |
| A.15.2.1  | Monitoring and review of supplier services               |
| A.15.2.2  | Managing changes to supplier services                    |

### NIST CSF — Supply Chain Risk Management

| Control  | Description                                       |
|----------|---------------------------------------------------|
| ID.SC-1  | Supply chain risk management processes            |
| ID.SC-2  | Identification and prioritization of suppliers    |
| ID.SC-4  | Supplier assessment using audits and testing      |

---

## 📸 Screenshots

> _Add screenshots of the dashboard, settings page, edit modal, and comment system here._

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Built as a demonstration of GRC (Governance, Risk & Compliance) and Third-Party Risk Management capabilities.

---

<p align="center">
  <b>VendorGuard</b> — Simplifying Third-Party Risk Management
</p>
