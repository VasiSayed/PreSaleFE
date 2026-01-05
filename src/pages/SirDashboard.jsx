import React from "react";
import "./SirDashboard.css";

const filters = {
  dateRanges: ["Today", "WTD", "MTD", "QTD", "YTD", "Custom"],
};

const KPICard = ({ title, value, sub }) => (
  <div className="kpi-card">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{value}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const ChartPlaceholder = ({ title, subtitle }) => (
  <div className="chart-card">
    <div className="chart-header">
      <div>
        <div className="chart-title">{title}</div>
        {subtitle && <div className="chart-sub">{subtitle}</div>}
      </div>
      <button className="btn-ghost" type="button">
        View detail
      </button>
    </div>
    <div className="chart-body">Sample bars / funnel here</div>
  </div>
);

const TablePlaceholder = ({ title, columns, rows }) => (
  <div className="table-card">
    <div className="table-header">
      <div className="table-title">{title}</div>
      <div className="table-actions">
        <button className="btn-ghost" type="button">
          Export
        </button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c}>{r[c]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function SirDashboard() {
  // simple dummy data for main tables
  const siteSummaryRows = [
    {
      Site: "Project A – Thane",
      "Total Leads": 1240,
      "Qualified Leads": 420,
      "Site Visits": 180,
      Bookings: 56,
      Registrations: 32,
      "Lead→Booking %": "4.5%",
      "Lead→Registration %": "2.6%",
      "Total Sold Value": "₹42.3 Cr",
      "Reg Pending Value": "₹9.7 Cr",
    },
    {
      Site: "Project B – Pune",
      "Total Leads": 890,
      "Qualified Leads": 300,
      "Site Visits": 130,
      Bookings: 44,
      Registrations: 25,
      "Lead→Booking %": "4.9%",
      "Lead→Registration %": "2.8%",
      "Total Sold Value": "₹31.8 Cr",
      "Reg Pending Value": "₹6.1 Cr",
    },
  ];

  const leadListRows = [
    {
      "Lead ID": "LD-1001",
      Name: "Rahul Sharma",
      Site: "Project A – Thane",
      Config: "2 BHK",
      Source: "Google Ads",
      Status: "Negotiation",
      Classification: "Hot",
      Score: 92,
      Created: "2025-12-15",
      "Last Activity": "2025-12-28",
      Owner: "Ankit S",
      "SLA Status": "Within SLA",
    },
    {
      "Lead ID": "LD-1002",
      Name: "Priya Mehta",
      Site: "Project B – Pune",
      Config: "3 BHK",
      Source: "Channel Partner",
      Status: "Site Visit Done",
      Classification: "Warm",
      Score: 76,
      Created: "2025-12-20",
      "Last Activity": "2025-12-29",
      Owner: "Neha K",
      "SLA Status": "Breached",
    },
  ];

  const configRows = [
    {
      Configuration: "1 BHK",
      Leads: 520,
      Qualified: 160,
      Visits: 60,
      Bookings: 18,
      Registrations: 10,
      "Lead→Booking %": "3.5%",
      "Booking→Reg %": "55.6%",
      "Booking Value": "₹8.2 Cr",
      "Reg Value": "₹4.6 Cr",
    },
    {
      Configuration: "2 BHK",
      Leads: 980,
      Qualified: 340,
      Visits: 140,
      Bookings: 52,
      Registrations: 30,
      "Lead→Booking %": "5.3%",
      "Booking→Reg %": "57.7%",
      "Booking Value": "₹24.5 Cr",
      "Reg Value": "₹14.1 Cr",
    },
  ];

  const campaignRows = [
    {
      Campaign: "Diwali Blast – Google",
      Channel: "Google Search",
      Sites: "A, B",
      Spend: "₹8,50,000",
      Leads: 430,
      Qualified: 180,
      Visits: 90,
      Bookings: 28,
      Registrations: 16,
      "Booking Value": "₹13.2 Cr",
      "Reg Value": "₹7.4 Cr",
      CPL: "₹1,977",
      "Cost/Booking": "₹30,357",
      "ROI %": "4.5x",
    },
    {
      Campaign: "CP Meet – Mumbai",
      Channel: "CP Event",
      Sites: "A",
      Spend: "₹3,20,000",
      Leads: 140,
      Qualified: 70,
      Visits: 50,
      Bookings: 20,
      Registrations: 12,
      "Booking Value": "₹9.8 Cr",
      "Reg Value": "₹5.6 Cr",
      CPL: "₹2,285",
      "Cost/Booking": "₹16,000",
      "ROI %": "6.1x",
    },
  ];

  const cpRows = [
    {
      "CP Name": "Shakti Realtors",
      Code: "CP-001",
      Type: "Firm",
      Sites: "Project A",
      Leads: 210,
      "Leads Worked": 190,
      Visits: 85,
      Bookings: 28,
      Cancellations: 3,
      Registrations: 18,
      "Lead→Booking %": "13.3%",
      "Lead→Reg %": "8.6%",
      Revenue: "₹11.4 Cr",
      Payout: "₹62 L",
      "Payout Status": "Pending",
    },
    {
      "CP Name": "Prime Homes",
      Code: "CP-014",
      Type: "Individual",
      Sites: "Project B",
      Leads: 120,
      "Leads Worked": 100,
      Visits: 40,
      Bookings: 12,
      Cancellations: 1,
      Registrations: 7,
      "Lead→Booking %": "10.0%",
      "Lead→Reg %": "5.8%",
      Revenue: "₹5.7 Cr",
      Payout: "₹31 L",
      "Payout Status": "Released",
    },
  ];

  const salesRows = [
    {
      Salesperson: "Ankit Shah",
      Role: "Senior Sales",
      Sites: "Project A",
      "Leads Allocated": 180,
      "Leads in Pipeline": 62,
      Calls: 540,
      Messages: 210,
      Emails: 90,
      Meetings: 40,
      "Site Visits": 32,
      Bookings: 14,
      Cancellations: 1,
      Registrations: 9,
      "Lead→Booking %": "7.8%",
      "Lead→Reg %": "5.0%",
      "Booking Value": "₹6.3 Cr",
      "Reg Value": "₹3.9 Cr",
      "Avg Response Time": "1.4 hrs",
      "SLA % Met": "92%",
    },
    {
      Salesperson: "Neha Kulkarni",
      Role: "Sales",
      Sites: "Project B",
      "Leads Allocated": 160,
      "Leads in Pipeline": 55,
      Calls: 480,
      Messages: 180,
      Emails: 70,
      Meetings: 34,
      "Site Visits": 28,
      Bookings: 12,
      Cancellations: 2,
      Registrations: 7,
      "Lead→Booking %": "7.5%",
      "Lead→Reg %": "4.4%",
      "Booking Value": "₹5.1 Cr",
      "Reg Value": "₹3.0 Cr",
      "Avg Response Time": "2.1 hrs",
      "SLA % Met": "88%",
    },
  ];

  const inventoryRows = [
    {
      Site: "Project A – Thane",
      Tower: "T1",
      Config: "2 BHK",
      "Units Total": 120,
      Available: 38,
      Blocked: 6,
      Booked: 58,
      Registered: 18,
      "Avg Price": "₹1.38 Cr",
    },
    {
      Site: "Project B – Pune",
      Tower: "B2",
      Config: "3 BHK",
      "Units Total": 80,
      Available: 22,
      Blocked: 4,
      Booked: 39,
      Registered: 15,
      "Avg Price": "₹1.62 Cr",
    },
  ];

  return (
    <div className="sir-dashboard">
      <div className="app-root">
        {/* Header */}
        <header className="app-header">
          <div className="app-logo">Vibe Pre-Sales Cockpit</div>
          <div className="filters-row">
            <select>
              {filters.dateRanges.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <input defaultValue="All Sites (Group View)" />
            <input placeholder="Tower / Phase / Wing" />
            <input placeholder="Configuration (1BHK, 2BHK...)" />
            <input placeholder="Lead Source" />
            <input placeholder="Channel Partner" />
            <input placeholder="Sales Person" />
            <input placeholder="Campaign" />
            <button className="btn-primary" type="button">
              Apply
            </button>
          </div>
          <div className="user-info">Logged in as: CXO – Group</div>
        </header>

        <div className="app-body">
          {/* Left nav */}
          <aside className="side-nav">
            <div className="nav-section-title">Dashboards</div>
            <button className="nav-item nav-item-active" type="button">
              Overview
            </button>
            <button className="nav-item" type="button">
              Lead Pipeline
            </button>
            <button className="nav-item" type="button">
              Configuration & Source
            </button>
            <button className="nav-item" type="button">
              Campaign & ROI
            </button>
            <button className="nav-item" type="button">
              Channel Partners
            </button>
            <button className="nav-item" type="button">
              Sales Team
            </button>
            <button className="nav-item" type="button">
              Inventory & Booking
            </button>
          </aside>

          {/* Main content */}
          <main className="main-content">
            {/* Band 1: KPI strip */}
            <section className="band band-kpis">
              <div className="band-title">Overview KPIs (Group / Site)</div>
              <div className="kpi-grid">
                <KPICard
                  title="Total Leads (MTD)"
                  value="2,430"
                  sub="+12% vs last month"
                />
                <KPICard
                  title="Total Qualified Leads"
                  value="820"
                  sub="34% of leads"
                />
                <KPICard
                  title="Lead → Booking %"
                  value="4.7%"
                  sub="+0.4 pts vs last month"
                />
                <KPICard
                  title="Lead → Registration %"
                  value="2.5%"
                  sub="+0.2 pts vs last month"
                />
                <KPICard
                  title="Total Inventory (Units)"
                  value="1,480"
                  sub="All active projects"
                />
                <KPICard
                  title="Total Sold (Units)"
                  value="860"
                  sub="58% sold"
                />
                <KPICard
                  title="Total Sold Value (₹)"
                  value="₹132.5 Cr"
                  sub="Realised bookings"
                />
                <KPICard
                  title="Registration Pending Value (₹)"
                  value="₹25.6 Cr"
                  sub="Awaiting registration"
                />
                <KPICard
                  title="Calls Made (MTD)"
                  value="4,320"
                  sub="Avg 18 calls/lead"
                />
                <KPICard
                  title="Site Visits Done (MTD)"
                  value="430"
                  sub="+9% vs last month"
                />
                <KPICard
                  title="Active Campaigns"
                  value="7"
                  sub="Performance marketing + CP"
                />
                <KPICard
                  title="Average Response Time"
                  value="1.9 hrs"
                  sub="SLA target: 2 hrs"
                />
              </div>
            </section>

            {/* Band 2: Charts row */}
            <section className="band band-charts">
              <div className="charts-grid">
                <ChartPlaceholder
                  title="Lead Pipeline Funnel"
                  subtitle="2430 Leads → 1980 Contacted → 610 Visits → 114 Bookings → 62 Registrations"
                />
                <ChartPlaceholder
                  title="Source-wise Leads & Bookings"
                  subtitle="Google, Meta, Portals, CP, Walk-in, Referral..."
                />
                <ChartPlaceholder
                  title="Site-wise Conversion Ratios"
                  subtitle="Lead→Booking %, Lead→Registration % by site"
                />
              </div>
            </section>

            {/* Band 3: Tables tabs */}
            <section className="band band-tables">
              <div className="tabs-header">
                <button className="tab tab-active" type="button">
                  Site Summary
                </button>
                <button className="tab" type="button">
                  Leads
                </button>
                <button className="tab" type="button">
                  CP Performance
                </button>
                <button className="tab" type="button">
                  Sales Performance
                </button>
                <button className="tab" type="button">
                  Campaigns
                </button>
                <button className="tab" type="button">
                  Inventory
                </button>
              </div>

              <TablePlaceholder
                title="Site Summary (click a site to drill into Site view)"
                columns={[
                  "Site",
                  "Total Leads",
                  "Qualified Leads",
                  "Site Visits",
                  "Bookings",
                  "Registrations",
                  "Lead→Booking %",
                  "Lead→Registration %",
                  "Total Sold Value",
                  "Reg Pending Value",
                ]}
                rows={siteSummaryRows}
              />
            </section>

            {/* Lead Pipeline section */}
            <section className="band">
              <div className="band-title">Lead Pipeline (Wireframe)</div>
              <div className="kpi-grid">
                <KPICard
                  title="New Leads (MTD)"
                  value="2,430"
                  sub="All sites"
                />
                <KPICard
                  title="Leads Breaching SLA"
                  value="84"
                  sub="3.5% of new leads"
                />
                <KPICard
                  title="Average Lead Age"
                  value="11.3 days"
                  sub="Pipeline only"
                />
                <KPICard
                  title="Leads by Stage"
                  value="New 640 · Visit 610 · Booking 114"
                  sub="Snapshot"
                />
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Lead Funnel" />
                <ChartPlaceholder title="Lead Age Buckets" />
                <ChartPlaceholder title="Stage Distribution" />
              </div>
              <TablePlaceholder
                title="Lead List"
                columns={[
                  "Lead ID",
                  "Name",
                  "Site",
                  "Config",
                  "Source",
                  "Status",
                  "Classification",
                  "Score",
                  "Created",
                  "Last Activity",
                  "Owner",
                  "SLA Status",
                ]}
                rows={leadListRows}
              />
            </section>

            {/* Configuration & Source section */}
            <section className="band">
              <div className="band-title">
                Configuration & Source Analytics (Wireframe)
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Configuration-wise Leads & Bookings" />
                <ChartPlaceholder title="Configuration-wise Conversion %" />
                <ChartPlaceholder title="Source-wise Leads & Bookings" />
                <ChartPlaceholder title="Source-wise Conversion & Revenue" />
              </div>
              <TablePlaceholder
                title="Configuration Matrix"
                columns={[
                  "Configuration",
                  "Leads",
                  "Qualified",
                  "Visits",
                  "Bookings",
                  "Registrations",
                  "Lead→Booking %",
                  "Booking→Reg %",
                  "Booking Value",
                  "Reg Value",
                ]}
                rows={configRows}
              />
            </section>

            {/* Campaign & ROI section */}
            <section className="band">
              <div className="band-title">Campaign & ROI (Wireframe)</div>
              <div className="kpi-grid">
                <KPICard
                  title="Total Spend (MTD)"
                  value="₹18.6 L"
                  sub="Performance + CP events"
                />
                <KPICard title="Avg CPL" value="₹2,140" sub="All campaigns" />
                <KPICard
                  title="Cost per Booking"
                  value="₹29,300"
                  sub="Across 114 bookings"
                />
                <KPICard
                  title="Overall Campaign ROI %"
                  value="5.1x"
                  sub="Revenue / Spend"
                />
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Spend vs Leads vs Bookings (per Campaign)" />
                <ChartPlaceholder title="Campaign Funnel" />
              </div>
              <TablePlaceholder
                title="Campaign Performance"
                columns={[
                  "Campaign",
                  "Channel",
                  "Sites",
                  "Spend",
                  "Leads",
                  "Qualified",
                  "Visits",
                  "Bookings",
                  "Registrations",
                  "Booking Value",
                  "Reg Value",
                  "CPL",
                  "Cost/Booking",
                  "ROI %",
                ]}
                rows={campaignRows}
              />
            </section>

            {/* CP Performance section */}
            <section className="band">
              <div className="band-title">
                Channel Partner Performance (Wireframe)
              </div>
              <div className="kpi-grid">
                <KPICard
                  title="Active CPs"
                  value="42"
                  sub="Onboarded this year"
                />
                <KPICard
                  title="CP Leads (MTD)"
                  value="560"
                  sub="23% of total leads"
                />
                <KPICard
                  title="CP Lead→Booking %"
                  value="11.8%"
                  sub="Better than direct by +3 pts"
                />
                <KPICard
                  title="CP Revenue (MTD)"
                  value="₹21.9 Cr"
                  sub="Bookings via CP"
                />
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Top CPs by Revenue" />
                <ChartPlaceholder title="CP Conversion Scatter" />
              </div>
              <TablePlaceholder
                title="CP Performance"
                columns={[
                  "CP Name",
                  "Code",
                  "Type",
                  "Sites",
                  "Leads",
                  "Leads Worked",
                  "Visits",
                  "Bookings",
                  "Cancellations",
                  "Registrations",
                  "Lead→Booking %",
                  "Lead→Reg %",
                  "Revenue",
                  "Payout",
                  "Payout Status",
                ]}
                rows={cpRows}
              />
            </section>

            {/* Sales Performance section */}
            <section className="band">
              <div className="band-title">
                Sales Team Performance (Wireframe)
              </div>
              <div className="kpi-grid">
                <KPICard
                  title="Active Salespeople"
                  value="18"
                  sub="Mapped to current sites"
                />
                <KPICard
                  title="Leads per Salesperson"
                  value="135"
                  sub="Avg in current month"
                />
                <KPICard
                  title="Team Lead→Booking %"
                  value="4.7%"
                  sub="Target 5.0%"
                />
                <KPICard
                  title="Avg Response Time"
                  value="1.9 hrs"
                  sub="SLA target 2 hrs"
                />
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Sales Leaderboard" />
                <ChartPlaceholder title="Effort vs Outcome Scatter" />
              </div>
              <TablePlaceholder
                title="Sales Performance"
                columns={[
                  "Salesperson",
                  "Role",
                  "Sites",
                  "Leads Allocated",
                  "Leads in Pipeline",
                  "Calls",
                  "Messages",
                  "Emails",
                  "Meetings",
                  "Site Visits",
                  "Bookings",
                  "Cancellations",
                  "Registrations",
                  "Lead→Booking %",
                  "Lead→Reg %",
                  "Booking Value",
                  "Reg Value",
                  "Avg Response Time",
                  "SLA % Met",
                ]}
                rows={salesRows}
              />
            </section>

            {/* Inventory & Booking section */}
            <section className="band">
              <div className="band-title">Inventory & Booking (Wireframe)</div>
              <div className="kpi-grid">
                <KPICard title="Total Inventory Units" value="1,480" />
                <KPICard title="Available Units" value="560" />
                <KPICard title="Booked Units" value="720" />
                <KPICard title="Registered Units" value="200" />
                <KPICard title="Sales Velocity (Units/month)" value="124" />
              </div>
              <div className="charts-grid">
                <ChartPlaceholder title="Inventory Status by Configuration" />
                <ChartPlaceholder title="Sales Velocity by Site/Tower" />
              </div>
              <TablePlaceholder
                title="Inventory"
                columns={[
                  "Site",
                  "Tower",
                  "Config",
                  "Units Total",
                  "Available",
                  "Blocked",
                  "Booked",
                  "Registered",
                  "Avg Price",
                ]}
                rows={inventoryRows}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
