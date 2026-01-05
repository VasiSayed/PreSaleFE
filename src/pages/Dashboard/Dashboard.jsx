import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css"; // ✅ IMPORTANT (your old: import "./"; was wrong)

const SCOPE_URL = "/client/my-scope/";
const DASH_URL = "/dashboard/presales-exec/";

const filters = {
  dateRanges: ["ALL", "Today", "WTD", "MTD", "QTD", "YTD", "Custom"],
};

const upper = (v) => (v == null ? "" : String(v).trim().toUpperCase());
const safeArr = (v) => (Array.isArray(v) ? v : []);
const autoColumns = (rows) => {
  const r0 = rows?.[0];
  return r0 && typeof r0 === "object" ? Object.keys(r0) : [];
};

// numbers from "₹0", "0.0%", "N/A"
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v) => (v == null || v === "" ? "N/A" : String(v));

// --- KPI Card ---
const KPICard = ({ title, value, sub }) => (
  <div className="kpi-card">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{fmt(value)}</div>
    {sub ? <div className="kpi-sub">{sub}</div> : null}
  </div>
);

// --- Chart Card ---
const ChartCard = ({ title, subtitle, children, onViewDetail }) => (
  <div className="chart-card">
    <div className="chart-header">
      <div>
        <div className="chart-title">{title}</div>
        {subtitle ? <div className="chart-sub">{subtitle}</div> : null}
      </div>
      <button className="btn-ghost" type="button" onClick={onViewDetail}>
        View detail
      </button>
    </div>
    <div className="chart-body">{children}</div>
  </div>
);

// --- Table Card ---
const TableCard = ({
  title,
  columns = [],
  rows = [],
  rightActions = null,
  onExport,
}) => (
  <div className="table-card">
    <div className="table-header">
      <div className="table-title">{title}</div>
      <div className="table-actions">
        {rightActions}
        <button className="btn-ghost" type="button" onClick={onExport}>
          Export
        </button>
      </div>
    </div>

    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>{r?.[c] ?? "N/A"}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="empty-cell" colSpan={Math.max(columns.length, 1)}>
                No rows
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// =====================
// ✅ PURE CSS MINI CHARTS (no library, always visible)
// =====================

const MiniBarList = ({ data = [], labelKey, valueKey, maxValue }) => {
  const max =
    typeof maxValue === "number"
      ? maxValue
      : Math.max(1, ...data.map((d) => toNum(d?.[valueKey])));

  return (
    <div className="mini-chart">
      {data?.length ? (
        data.map((d, i) => {
          const label = d?.[labelKey] ?? "N/A";
          const val = toNum(d?.[valueKey]);
          const pct = Math.max(0, Math.min(100, (val / max) * 100));
          return (
            <div className="mini-row" key={i}>
              <div className="mini-left">
                <div className="mini-label">{label}</div>
                <div className="mini-value">{val}</div>
              </div>
              <div className="mini-track">
                <div
                  className="mini-fill c-blue"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="mini-empty">No data</div>
      )}
    </div>
  );
};

const MiniStacked = ({ data = [], labelKey, series = [] }) => {
  const totals = data.map((d) =>
    series.reduce((acc, s) => acc + toNum(d?.[s.key]), 0)
  );
  const maxTotal = Math.max(1, ...totals);

  return (
    <div className="mini-chart">
      <div className="mini-legend">
        {series.map((s) => (
          <span key={s.key} className="mini-leg">
            <span className={`mini-dot ${s.color}`} />
            {s.name}
          </span>
        ))}
      </div>

      {data?.length ? (
        data.map((d, i) => {
          const label = d?.[labelKey] ?? "N/A";
          const rowTotal = series.reduce(
            (acc, s) => acc + toNum(d?.[s.key]),
            0
          );
          const widthPct = (rowTotal / maxTotal) * 100;

          return (
            <div className="mini-row" key={i}>
              <div className="mini-left">
                <div className="mini-label">{label}</div>
                <div className="mini-value">{rowTotal}</div>
              </div>

              <div className="mini-track">
                <div className="mini-stack" style={{ width: `${widthPct}%` }}>
                  {series.map((s) => {
                    const v = toNum(d?.[s.key]);
                    const segPct = rowTotal ? (v / rowTotal) * 100 : 0;
                    return (
                      <div
                        key={s.key}
                        className={`mini-seg ${s.color}`}
                        style={{ width: `${segPct}%` }}
                        title={`${s.name}: ${v}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="mini-empty">No data</div>
      )}
    </div>
  );
};

// ----- inventory aggregations from table rows -----
const aggregateBy = (rows, groupKey, keys) => {
  const map = new Map();
  (rows || []).forEach((r) => {
    const g = r?.[groupKey] ?? "N/A";
    const prev = map.get(g) || { [groupKey]: g };
    keys.forEach((k) => {
      prev[k] = (prev[k] || 0) + toNum(r?.[k]);
    });
    map.set(g, prev);
  });
  return Array.from(map.values());
};

const sumKey = (rows, key) =>
  (rows || []).reduce((acc, r) => acc + toNum(r?.[key]), 0);

export default function SirDashboard() {
  const { user } = useAuth();

  const [scope, setScope] = useState(null);

  const [dateRange, setDateRange] = useState("ALL");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [siteId, setSiteId] = useState("ALL");
  const [tower, setTower] = useState("");
  const [configuration, setConfiguration] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [channelPartner, setChannelPartner] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [campaign, setCampaign] = useState("");

  const [leadLimit, setLeadLimit] = useState(20);
  const [leadOffset, setLeadOffset] = useState(0);

  const [dash, setDash] = useState(null);

  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [error, setError] = useState("");

  const brand = scope?.brand;

  // refs (scroll buttons)
  const secOverviewRef = useRef(null);
  const secLeadRef = useRef(null);
  const secCPRef = useRef(null);
  const secSalesRef = useRef(null);
  const secInvSnapRef = useRef(null);
  const secInvTableRef = useRef(null);

  // ---------- fetch scope ----------
  useEffect(() => {
    const run = async () => {
      setLoadingScope(true);
      setError("");
      try {
        const res = await axiosInstance.get(SCOPE_URL);
        setScope(res.data || null);
        setSiteId("ALL");
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.detail || "Unable to load scope. Please try again."
        );
      } finally {
        setLoadingScope(false);
      }
    };
    run();
  }, []);

  const buildProjectParams = (selectedProjectId) => {
    if (!selectedProjectId || selectedProjectId === "ALL") return {};
    return { project_id: Number(selectedProjectId) };
  };

  // ---------- fetch dashboard ----------
  const fetchDashboard = async () => {
    if (!scope) return;

    setLoadingDash(true);
    setError("");

    try {
      const params = {
        lead_limit: leadLimit,
        lead_offset: leadOffset,
        drill_limit: 10,
      };

      const dr = upper(dateRange);
      if (dr === "CUSTOM") {
        params.date_mode = "CUSTOM";
        if (customFrom) params.from_date = customFrom;
        if (customTo) params.to_date = customTo;
      } else if (dr === "ALL") {
        params.date_mode = "ALL";
      } else {
        params.date_mode = dr;
      }

      Object.assign(params, buildProjectParams(siteId));

      // (optional) backend params not confirmed yet — keep UI only
      // params.tower = tower || undefined; etc...

      const res = await axiosInstance.get(DASH_URL, { params });

      if (res.data?.success === false) {
        throw new Error(res.data?.error || "Dashboard API returned error");
      }

      setDash(res.data?.data || null);
    } catch (e) {
      console.error(e);
      setDash(null);
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoadingDash(false);
    }
  };

  // auto initial load once scope arrives
  useEffect(() => {
    if (!scope) return;
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // ============= DATA FROM RESPONSE =============
  const kpis = safeArr(dash?.overview?.kpis);

  const funnel = safeArr(dash?.overview?.charts?.lead_pipeline_funnel?.data);
  const sourceWise = safeArr(dash?.overview?.charts?.source_wise?.data);
  const siteConv = safeArr(dash?.overview?.charts?.site_wise_conversion?.data);

  const tables = dash?.tables || {};
  const tSite = tables?.site_summary || null;
  const tLeads = tables?.lead_list || null;
  const tCP = tables?.cp_performance || null;
  const tSales = tables?.sales_performance || null;
  const tInv = tables?.inventory || null;
  const tConfig = tables?.configuration_matrix || null;
  const tCampaign = tables?.campaign_performance || null;

  const leadPage = dash?.meta?.lead_pagination || null;

  // inventory snapshot from inventory table
  const invRows = safeArr(tInv?.rows);
  const invTotalUnits = sumKey(invRows, "Units Total");
  const invAvailable = sumKey(invRows, "Available");
  const invBooked = sumKey(invRows, "Booked");
  const invBlocked = sumKey(invRows, "Blocked");
  const invRegistered = sumKey(invRows, "Registered"); // may be N/A => 0

  const invByConfig = useMemo(
    () => aggregateBy(invRows, "Config", ["Available", "Booked", "Blocked"]),
    [invRows]
  );
  const invByTower = useMemo(
    () => aggregateBy(invRows, "Tower", ["Available", "Booked", "Blocked"]),
    [invRows]
  );

  const isLoading = loadingScope || loadingDash;

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="sir-dashboard">
      <div className="app-root">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-top">
            <div className="app-logo">
              <span className="brand-mark" />
              {brand?.company_name
                ? brand.company_name
                : "Vibe Pre-Sales Cockpit"}
            </div>

            <div className="user-info">
              Logged in as: <b>{user?.role ? user.role : "User"}</b>
              <span className="sep">•</span>
              as_of: <b>{dash?.meta?.as_of || "N/A"}</b>
            </div>
          </div>

          {/* quick nav pills (no sidebar) */}
          <div className="pill-row">
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secOverviewRef)}
            >
              Overview
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secLeadRef)}
            >
              Lead Pipeline
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secCPRef)}
            >
              Channel Partners
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secSalesRef)}
            >
              Sales Team
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secInvSnapRef)}
            >
              Inventory Snapshot
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secInvTableRef)}
            >
              Inventory Table
            </button>
          </div>

          {/* FILTERS */}
          <div className="filters-row">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {filters.dateRanges.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {upper(dateRange) === "CUSTOM" ? (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </>
            ) : null}

            <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="ALL">All Sites (Group View)</option>
              {(scope?.projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              value={tower}
              onChange={(e) => setTower(e.target.value)}
              placeholder="Tower / Phase / Wing"
            />
            <input
              value={configuration}
              onChange={(e) => setConfiguration(e.target.value)}
              placeholder="Configuration (1BHK, 2BHK...)"
            />
            <input
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              placeholder="Lead Source"
            />
            <input
              value={channelPartner}
              onChange={(e) => setChannelPartner(e.target.value)}
              placeholder="Channel Partner"
            />
            <input
              value={salesPerson}
              onChange={(e) => setSalesPerson(e.target.value)}
              placeholder="Sales Person"
            />
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Campaign"
            />

            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                setLeadOffset(0);
                fetchDashboard();
              }}
              disabled={loadingDash}
            >
              Apply
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className="main-content">
          {error ? <div className="alert alert-error">{error}</div> : null}
          {isLoading ? <div className="alert">Loading analytics…</div> : null}

          {/* OVERVIEW KPIs */}
          <section className="band" ref={secOverviewRef}>
            <div className="band-title">Overview KPIs</div>
            <div className="kpi-grid">
              {kpis.length ? (
                kpis.map((k) => (
                  <KPICard
                    key={k.id || k.title}
                    title={k.title || "KPI"}
                    value={k.value ?? "N/A"}
                    sub={k.sub || ""}
                  />
                ))
              ) : (
                <KPICard title="No KPIs" value="N/A" sub="API returned empty" />
              )}
            </div>
          </section>

          {/* ✅ LEAD PIPELINE CHARTS (your required titles/subtitles) */}
          <section className="band" ref={secLeadRef}>
            <div className="band-title">Lead Pipeline Charts</div>
            <div className="charts-grid">
              <ChartCard
                title={
                  dash?.overview?.charts?.lead_pipeline_funnel?.title ||
                  "Lead Pipeline Funnel"
                }
                subtitle={
                  dash?.overview?.charts?.lead_pipeline_funnel?.subtitle ||
                  "Registrations metrics are N/A"
                }
                onViewDetail={() => {}}
              >
                <MiniBarList data={funnel} labelKey="stage" valueKey="count" />
              </ChartCard>

              <ChartCard
                title={
                  dash?.overview?.charts?.source_wise?.title ||
                  "Source-wise Leads & Bookings"
                }
                subtitle={
                  dash?.overview?.charts?.source_wise?.subtitle ||
                  "Based on leads + bookings linkage"
                }
                onViewDetail={() => {}}
              >
                <MiniStacked
                  data={sourceWise}
                  labelKey="source"
                  series={[
                    { key: "leads", name: "Leads", color: "c-blue" },
                    { key: "bookings", name: "Bookings", color: "c-red" },
                  ]}
                />
              </ChartCard>

              <ChartCard
                title={
                  dash?.overview?.charts?.site_wise_conversion?.title ||
                  "Site-wise Conversion Ratios"
                }
                subtitle={
                  dash?.overview?.charts?.site_wise_conversion?.subtitle ||
                  "Lead→Booking % by site (Lead→Registration is N/A)"
                }
                onViewDetail={() => {}}
              >
                <MiniBarList
                  data={siteConv}
                  labelKey="site"
                  valueKey="lead_to_booking_pct"
                  maxValue={100}
                />
              </ChartCard>
            </div>
          </section>

          {/* SITE SUMMARY TABLE */}
          <section className="band">
            <div className="band-title">Site Summary</div>
            <TableCard
              title={tSite?.title || "Site Summary"}
              columns={tSite?.columns || autoColumns(tSite?.rows || [])}
              rows={tSite?.rows || []}
              onExport={() => console.log("Export Site Summary")}
            />
          </section>

          {/* LEAD LIST TABLE + PAGER */}
          <section className="band">
            <div className="band-title">Lead List</div>

            <TableCard
              title={tLeads?.title || "Lead List"}
              columns={tLeads?.columns || autoColumns(tLeads?.rows || [])}
              rows={tLeads?.rows || []}
              rightActions={
                <div className="lead-pager">
                  <select
                    value={leadLimit}
                    onChange={(e) => {
                      setLeadOffset(0);
                      setLeadLimit(Number(e.target.value));
                    }}
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}/page
                      </option>
                    ))}
                  </select>

                  <button
                    className="btn-ghost"
                    type="button"
                    disabled={!leadPage?.prev_offset && leadOffset <= 0}
                    onClick={() => {
                      setLeadOffset(
                        leadPage?.prev_offset ??
                          Math.max(leadOffset - leadLimit, 0)
                      );
                      setTimeout(fetchDashboard, 0);
                    }}
                  >
                    Prev
                  </button>

                  <button
                    className="btn-ghost"
                    type="button"
                    disabled={!leadPage?.has_next}
                    onClick={() => {
                      setLeadOffset(
                        leadPage?.next_offset ?? leadOffset + leadLimit
                      );
                      setTimeout(fetchDashboard, 0);
                    }}
                  >
                    Next
                  </button>
                </div>
              }
              onExport={() => console.log("Export Lead List")}
            />
          </section>

          {/* CP PERFORMANCE */}
          <section className="band" ref={secCPRef}>
            <div className="band-title">Channel Partners</div>
            <TableCard
              title={tCP?.title || "CP Performance"}
              columns={tCP?.columns || autoColumns(tCP?.rows || [])}
              rows={tCP?.rows || []}
              onExport={() => console.log("Export CP")}
            />
          </section>

          {/* SALES PERFORMANCE */}
          <section className="band" ref={secSalesRef}>
            <div className="band-title">Sales Team</div>
            <TableCard
              title={tSales?.title || "Sales Performance"}
              columns={tSales?.columns || autoColumns(tSales?.rows || [])}
              rows={tSales?.rows || []}
              onExport={() => console.log("Export Sales")}
            />
          </section>

          {/* ✅ INVENTORY SNAPSHOT (AFTER SALES TEAM, BEFORE INVENTORY TABLE) */}
          <section className="band" ref={secInvSnapRef}>
            <div className="band-title">Inventory Snapshot</div>

            <div className="kpi-grid kpi-grid-compact">
              <KPICard
                title="Total Inventory Units"
                value={invTotalUnits}
                sub="From Inventory table"
              />
              <KPICard
                title="Available Units"
                value={invAvailable}
                sub="Ready to sell"
              />
              <KPICard title="Booked Units" value={invBooked} sub="Booked" />
              <KPICard title="Blocked Units" value={invBlocked} sub="On hold" />
              <KPICard
                title="Registered Units"
                value={invRegistered || "N/A"}
                sub="May be N/A in API"
              />
            </div>

            <div style={{ height: 12 }} />

            <div className="charts-grid charts-grid-2">
              <ChartCard
                title="Inventory Status by Configuration"
                subtitle="Available / Booked / Blocked"
                onViewDetail={() => {}}
              >
                <MiniStacked
                  data={invByConfig}
                  labelKey="Config"
                  series={[
                    { key: "Available", name: "Available", color: "c-blue" },
                    { key: "Booked", name: "Booked", color: "c-red" },
                    { key: "Blocked", name: "Blocked", color: "c-orange" },
                  ]}
                />
              </ChartCard>

              <ChartCard
                title="Inventory Status by Site/Tower"
                subtitle="Available / Booked / Blocked"
                onViewDetail={() => {}}
              >
                <MiniStacked
                  data={invByTower}
                  labelKey="Tower"
                  series={[
                    { key: "Available", name: "Available", color: "c-blue" },
                    { key: "Booked", name: "Booked", color: "c-red" },
                    { key: "Blocked", name: "Blocked", color: "c-orange" },
                  ]}
                />
              </ChartCard>
            </div>
          </section>

          {/* INVENTORY TABLE */}
          <section className="band" ref={secInvTableRef}>
            <div className="band-title">Inventory Table</div>
            <TableCard
              title={tInv?.title || "Inventory"}
              columns={tInv?.columns || autoColumns(tInv?.rows || [])}
              rows={tInv?.rows || []}
              onExport={() => console.log("Export Inventory")}
            />
          </section>

          {/* CONFIG MATRIX */}
          <section className="band">
            <div className="band-title">Configuration Matrix</div>
            <TableCard
              title={tConfig?.title || "Configuration Matrix"}
              columns={tConfig?.columns || autoColumns(tConfig?.rows || [])}
              rows={tConfig?.rows || []}
              onExport={() => console.log("Export Config Matrix")}
            />
          </section>

          {/* CAMPAIGNS */}
          <section className="band">
            <div className="band-title">Campaign Performance</div>
            <TableCard
              title={tCampaign?.title || "Campaign Performance"}
              columns={tCampaign?.columns || autoColumns(tCampaign?.rows || [])}
              rows={tCampaign?.rows || []}
              onExport={() => console.log("Export Campaigns")}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
