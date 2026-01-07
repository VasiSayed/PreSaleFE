import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const SCOPE_URL = "/client/my-scope/";
const DASH_URL = "/dashboard/presales-exec/";

/* ---------------- helpers ---------------- */
const upper = (v) => (v == null ? "" : String(v).trim().toUpperCase());
const safeArr = (v) => (Array.isArray(v) ? v : []);
const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

const toNum = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s || s.toUpperCase() === "N/A") return 0;

  if (s.endsWith("%")) {
    const n = parseFloat(s.replace("%", ""));
    return Number.isFinite(n) ? n : 0;
  }

  const cleaned = s.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const autoColumns = (rows) => {
  const r0 = rows?.[0];
  return r0 && typeof r0 === "object" ? Object.keys(r0) : [];
};

const formatCompact = (n) => {
  const num = typeof n === "number" ? n : toNum(n);
  if (!Number.isFinite(num)) return "0";
  if (Math.abs(num) >= 1e7) return `${(num / 1e7).toFixed(2)}Cr`;
  if (Math.abs(num) >= 1e5) return `${(num / 1e5).toFixed(2)}L`;
  if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(2)}k`;
  return `${num}`;
};

/* ---------------- UI components ---------------- */
const KPICard = ({ title, value, sub }) => (
  <div className="kpi-card">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{value ?? "N/A"}</div>
    {sub ? <div className="kpi-sub">{sub}</div> : null}
  </div>
);

const ChartCard = ({
  title,
  subtitle,
  rightActions,
  children,
  onViewDetail,
}) => (
  <div className="chart-card">
    <div className="chart-header">
      <div className="chart-head-left">
        <div className="chart-title">{title}</div>
        {subtitle ? <div className="chart-sub">{subtitle}</div> : null}
      </div>

      <div className="chart-actions">
        {rightActions}
        <button className="btn-ghost" type="button" onClick={onViewDetail}>
          View detail
        </button>
      </div>
    </div>

    <div className="chart-body">{children}</div>
  </div>
);

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
          {rows?.length ? (
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

/* ---------------- Recharts “Chart With Options” ---------------- */
const SERIES_COLORS = [
  "var(--blue)",
  "var(--orange)",
  "var(--green)",
  "var(--red)",
  "#0ea5e9",
  "#a855f7",
  "#14b8a6",
];

function ChartWithOptions({
  chartId,
  title,
  subtitle,
  data = [],
  categoryKey,
  series = [], // [{key,name}]
  defaultType = "bar", // bar | stacked | line | area | pie
  onViewDetail,
  yTickFormatter,
  valueFormatter,
}) {
  const hasMultiSeries = (series?.length || 0) > 1;

  const [chartType, setChartType] = useState(defaultType);
  const [pieMetric, setPieMetric] = useState(series?.[0]?.key || "");

  // normalize numeric series values for recharts
  const norm = useMemo(() => {
    const arr = safeArr(data).map((d) => {
      const out = { ...d };
      series.forEach((s) => {
        out[s.key] = toNum(d?.[s.key]);
      });
      out[categoryKey] = d?.[categoryKey] ?? "N/A";
      return out;
    });
    return arr;
  }, [data, series, categoryKey]);

  const pieData = useMemo(() => {
    const metric = pieMetric || series?.[0]?.key;
    return norm.map((d) => ({
      name: d?.[categoryKey] ?? "N/A",
      value: toNum(d?.[metric]),
    }));
  }, [norm, pieMetric, categoryKey, series]);

  const toolbar = (
    <div className="chart-tools">
      <select
        className="chart-select"
        value={chartType}
        onChange={(e) => setChartType(e.target.value)}
        title="Chart type"
      >
        <option value="bar">Bar</option>
        {hasMultiSeries ? <option value="stacked">Stacked Bar</option> : null}
        <option value="line">Line</option>
        <option value="area">Area</option>
        <option value="pie">Pie</option>
      </select>

      {chartType === "pie" && hasMultiSeries ? (
        <select
          className="chart-select"
          value={pieMetric}
          onChange={(e) => setPieMetric(e.target.value)}
          title="Pie metric"
        >
          {series.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );

  const tooltipFormatter = (val, name) => {
    const v =
      typeof valueFormatter === "function" ? valueFormatter(val, name) : val;
    return [v, name];
  };

  const tooltipLabel = (label) => `${label}`;

  const renderChart = () => {
    if (!norm.length) return <div className="mini-empty">No data</div>;

    if (chartType === "pie") {
      return (
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabel}
              />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={55}
                paddingAngle={2}
              >
                {pieData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {hasMultiSeries ? (
            <div className="chart-footnote">
              Pie shows:{" "}
              <b>{series.find((s) => s.key === pieMetric)?.name || "Metric"}</b>
            </div>
          ) : null}
        </div>
      );
    }

    if (chartType === "line") {
      return (
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={norm}
              margin={{ top: 10, right: 18, left: 6, bottom: 10 }}
            >
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabel}
              />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === "area") {
      return (
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={norm}
              margin={{ top: 10, right: 18, left: 6, bottom: 10 }}
            >
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabel}
              />
              <Legend />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fillOpacity={0.12}
                  strokeWidth={2.2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // bar / stacked
    const isStacked = chartType === "stacked";
    return (
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={norm}
            margin={{ top: 10, right: 18, left: 6, bottom: 10 }}
          >
            <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabel}
            />
            <Legend />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                radius={[8, 8, 0, 0]}
                stackId={isStacked ? "a" : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      rightActions={toolbar}
      onViewDetail={onViewDetail}
    >
      {renderChart()}
    </ChartCard>
  );
}

/* ---------------- main ---------------- */
export default function SirDashboard() {
  const { user } = useAuth();

  const [scope, setScope] = useState(null);
  const [dash, setDash] = useState(null);

  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState("ALL");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [siteId, setSiteId] = useState("ALL");
  const [tower, setTower] = useState("ALL");
  const [configuration, setConfiguration] = useState("ALL");
  const [leadSource, setLeadSource] = useState("ALL");
  const [channelPartnerId, setChannelPartnerId] = useState("ALL");
  const [salesUserId, setSalesUserId] = useState("ALL");
  const [campaignId, setCampaignId] = useState("ALL");

  // lead pagination
  const [leadLimit, setLeadLimit] = useState(20);
  const [leadOffset, setLeadOffset] = useState(0);

  // scroll refs (pills)
  const secOverviewRef = useRef(null);
  const secChartsRef = useRef(null);
  const secLeadsRef = useRef(null);
  const secConfigRef = useRef(null);
  const secCPRef = useRef(null);
  const secSalesRef = useRef(null);
  const secInvWidgetsRef = useRef(null);
  const secInvTableRef = useRef(null);

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const brandName =
    scope?.brand?.company_name ||
    dash?.meta?.brand?.company_name ||
    "Vibe Pre-Sales Cockpit";

  // fetch scope
  useEffect(() => {
    const run = async () => {
      setLoadingScope(true);
      setError("");
      try {
        const res = await axiosInstance.get(SCOPE_URL);
        setScope(res.data || null);
        setSiteId("ALL");
      } catch (e) {
        setError(e?.response?.data?.detail || "Unable to load scope.");
      } finally {
        setLoadingScope(false);
      }
    };
    run();
  }, []);

  // fetch dashboard
  const fetchDashboard = async ({ resetOffset = false } = {}) => {
    if (!scope) return;

    setLoadingDash(true);
    setError("");

    try {
      const params = {
        lead_limit: leadLimit,
        lead_offset: resetOffset ? 0 : leadOffset,
        drill_limit: 10,
      };

      // date_mode
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

      // site filter
      if (siteId && siteId !== "ALL") {
        params.site_id = Number(siteId);
        params.project_id = Number(siteId); // backward compat
      }

      // other filters
      if (tower && tower !== "ALL") params.tower = tower;
      if (configuration && configuration !== "ALL")
        params.configuration = configuration;
      if (leadSource && leadSource !== "ALL") params.lead_source = leadSource;

      if (channelPartnerId && channelPartnerId !== "ALL")
        params.channel_partner_id = Number(channelPartnerId);

      if (salesUserId && salesUserId !== "ALL")
        params.sales_user_id = Number(salesUserId);

      if (campaignId && campaignId !== "ALL")
        params.campaign_id = Number(campaignId);

      const res = await axiosInstance.get(DASH_URL, { params });

      if (res.data?.success === false)
        throw new Error(res.data?.error || "Dashboard error");

      setDash(res.data?.data || null);
      if (resetOffset) setLeadOffset(0);
    } catch (e) {
      setDash(null);
      setError(
        e?.response?.data?.detail || e?.message || "Unable to load dashboard."
      );
    } finally {
      setLoadingDash(false);
    }
  };

  // initial load
  useEffect(() => {
    if (!scope) return;
    fetchDashboard({ resetOffset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  /* ------------ map API data ------------ */
  const meta = dash?.meta || {};
  const fo = dash?.filter_options || {};

  const dateRanges = useMemo(
    () => [
      "ALL",
      ...(fo?.dateRanges || ["Today", "WTD", "MTD", "QTD", "YTD", "Custom"]),
    ],
    [fo]
  );

  const sites = safeArr(fo?.sites);
  const towers = uniq(safeArr(fo?.towers));
  const configs = uniq(safeArr(fo?.configurations));
  const leadSources = uniq(safeArr(fo?.lead_sources));
  const cps = safeArr(fo?.channel_partners);
  const salesPeople = safeArr(fo?.sales_people);
  const campaigns = safeArr(fo?.campaigns);

  const kpis = safeArr(dash?.overview?.kpis);

  const chartFunnel = safeArr(
    dash?.overview?.charts?.lead_pipeline_funnel?.data
  ).map((r) => ({
    stage: r?.stage ?? "N/A",
    count: toNum(r?.count),
  }));

  const chartSource = safeArr(dash?.overview?.charts?.source_wise?.data).map(
    (r) => ({
      source: r?.source ?? "Unknown",
      leads: toNum(r?.leads),
      bookings: toNum(r?.bookings),
    })
  );

  const chartSiteConv = safeArr(
    dash?.overview?.charts?.site_wise_conversion?.data
  ).map((r) => ({
    site: r?.site ?? "N/A",
    lead_to_booking_pct: toNum(r?.lead_to_booking_pct),
    lead_to_registration_pct:
      String(r?.lead_to_registration_pct || "").toUpperCase() === "N/A"
        ? 0
        : toNum(r?.lead_to_registration_pct),
  }));

  const tables = dash?.tables || {};
  const tSite = tables?.site_summary || null;
  const tLeads = tables?.lead_list || null;
  const tConfig = tables?.configuration_matrix || null;
  const tCP = tables?.cp_performance || null;
  const tSales = tables?.sales_performance || null;
  const tInventory = tables?.inventory || null;

  const leadPage = meta?.lead_pagination || null;

  // inventory widgets compute
  const invRows = safeArr(tInventory?.rows);
  const invTotals = useMemo(() => {
    const total = invRows.reduce((a, r) => a + toNum(r?.["Units Total"]), 0);
    const available = invRows.reduce((a, r) => a + toNum(r?.Available), 0);
    const booked = invRows.reduce((a, r) => a + toNum(r?.Booked), 0);
    const blocked = invRows.reduce((a, r) => a + toNum(r?.Blocked), 0);
    const registered = invRows.reduce((a, r) => a + toNum(r?.Registered), 0);
    return { total, available, booked, blocked, registered };
  }, [invRows]);

  // inventory chart data by config
  const invByConfig = useMemo(() => {
    return invRows.map((r) => ({
      config: r?.Config || "UNKNOWN",
      available: toNum(r?.Available),
      booked: toNum(r?.Booked),
      blocked: toNum(r?.Blocked),
    }));
  }, [invRows]);

  // inventory chart data by tower
  const invByTower = useMemo(() => {
    const map = new Map();
    invRows.forEach((r) => {
      const key = r?.Tower || "N/A";
      const prev = map.get(key) || {
        tower: key,
        available: 0,
        booked: 0,
        blocked: 0,
      };
      prev.available += toNum(r?.Available);
      prev.booked += toNum(r?.Booked);
      prev.blocked += toNum(r?.Blocked);
      map.set(key, prev);
    });
    return [...map.values()];
  }, [invRows]);

  const isLoading = loadingScope || loadingDash;

  return (
    <div className="sir-dashboard">
      <div className="app-root">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-top">
            <div className="app-logo">
              <span className="brand-mark" />
              {brandName}
            </div>

            <div className="user-info">
              <b>{user?.role || "User"}</b>
              <span className="sep">•</span>
              as_of: <b>{meta?.as_of || "N/A"}</b>
            </div>
          </div>

          {/* Pills */}
          <div className="pill-row">
            <button
              className="pill pill-active"
              type="button"
              onClick={() => scrollTo(secOverviewRef)}
            >
              Overview
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secChartsRef)}
            >
              Charts
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secLeadsRef)}
            >
              Leads
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secConfigRef)}
            >
              Config & Source
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
              onClick={() => scrollTo(secInvWidgetsRef)}
            >
              Inventory Widgets
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => scrollTo(secInvTableRef)}
            >
              Inventory Table
            </button>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map((d) => (
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
              {(sites.length ? sites : scope?.projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.name}
                </option>
              ))}
            </select>

            <select value={tower} onChange={(e) => setTower(e.target.value)}>
              <option value="ALL">All Towers</option>
              {towers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={configuration}
              onChange={(e) => setConfiguration(e.target.value)}
            >
              <option value="ALL">All Config</option>
              {configs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
            >
              <option value="ALL">All Lead Sources</option>
              {leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={channelPartnerId}
              onChange={(e) => setChannelPartnerId(e.target.value)}
            >
              <option value="ALL">All Channel Partners</option>
              {cps.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.label}
                </option>
              ))}
            </select>

            <select
              value={salesUserId}
              onChange={(e) => setSalesUserId(e.target.value)}
            >
              <option value="ALL">All Sales People</option>
              {salesPeople.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.label}
                </option>
              ))}
            </select>

            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="ALL">All Campaigns</option>
              {campaigns?.length ? (
                campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))
              ) : (
                <option value="ALL">No campaigns</option>
              )}
            </select>

            <button
              className="btn-primary"
              type="button"
              onClick={() => fetchDashboard({ resetOffset: true })}
              disabled={loadingDash}
            >
              Apply
            </button>
          </div>
        </header>

        {/* BODY */}
        <main className="main-content">
          {error ? <div className="alert alert-error">{error}</div> : null}
          {isLoading ? <div className="alert">Loading analytics…</div> : null}

          {/* Overview KPIs */}
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

          {/* Charts */}
          <section className="band" ref={secChartsRef}>
            <div className="band-title">Overview Charts</div>

            <div className="charts-grid">
              <ChartWithOptions
                chartId="funnel"
                title={
                  dash?.overview?.charts?.lead_pipeline_funnel?.title ||
                  "Lead Pipeline Funnel"
                }
                subtitle={
                  dash?.overview?.charts?.lead_pipeline_funnel?.subtitle || ""
                }
                data={chartFunnel}
                categoryKey="stage"
                series={[{ key: "count", name: "Count" }]}
                defaultType="bar"
                onViewDetail={() => scrollTo(secLeadsRef)}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />

              <ChartWithOptions
                chartId="source"
                title={
                  dash?.overview?.charts?.source_wise?.title ||
                  "Source-wise Leads & Bookings"
                }
                subtitle={dash?.overview?.charts?.source_wise?.subtitle || ""}
                data={chartSource}
                categoryKey="source"
                series={[
                  { key: "leads", name: "Leads" },
                  { key: "bookings", name: "Bookings" },
                ]}
                defaultType="stacked"
                onViewDetail={() => scrollTo(secLeadsRef)}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />

              <ChartWithOptions
                chartId="conversion"
                title={
                  dash?.overview?.charts?.site_wise_conversion?.title ||
                  "Site-wise Conversion Ratios"
                }
                subtitle={
                  dash?.overview?.charts?.site_wise_conversion?.subtitle || ""
                }
                data={chartSiteConv}
                categoryKey="site"
                series={[
                  { key: "lead_to_booking_pct", name: "Lead→Booking %" },
                  {
                    key: "lead_to_registration_pct",
                    name: "Lead→Reg % (N/A=0)",
                  },
                ]}
                defaultType="line"
                onViewDetail={() => scrollTo(secOverviewRef)}
                yTickFormatter={(v) => `${v}%`}
                valueFormatter={(v) => `${toNum(v)}%`}
              />

              <div className="note">
                Note: Lead→Registration is sometimes N/A in API, shown as 0 for
                visualization.
              </div>
            </div>
          </section>

          {/* Site Summary Table */}
          <section className="band">
            <TableCard
              title={tSite?.title || "Site Summary"}
              columns={tSite?.columns || autoColumns(tSite?.rows || [])}
              rows={tSite?.rows || []}
              onExport={() => console.log("Export Site Summary")}
            />
          </section>

          {/* Lead List + pagination */}
          <section className="band" ref={secLeadsRef}>
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
                      setLeadLimit(Number(e.target.value));
                      setLeadOffset(0);
                      setTimeout(
                        () => fetchDashboard({ resetOffset: true }),
                        0
                      );
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
                      const prev =
                        leadPage?.prev_offset ??
                        Math.max(leadOffset - leadLimit, 0);
                      setLeadOffset(prev);
                      setTimeout(() => fetchDashboard(), 0);
                    }}
                  >
                    Prev
                  </button>

                  <button
                    className="btn-ghost"
                    type="button"
                    disabled={!leadPage?.has_next}
                    onClick={() => {
                      const next =
                        leadPage?.next_offset ?? leadOffset + leadLimit;
                      setLeadOffset(next);
                      setTimeout(() => fetchDashboard(), 0);
                    }}
                  >
                    Next
                  </button>
                </div>
              }
              onExport={() => console.log("Export Lead List")}
            />
          </section>

          {/* Configuration Matrix */}
          <section className="band" ref={secConfigRef}>
            <div className="band-title">Configuration Matrix</div>
            <TableCard
              title={tConfig?.title || "Configuration Matrix"}
              columns={tConfig?.columns || autoColumns(tConfig?.rows || [])}
              rows={tConfig?.rows || []}
              onExport={() => console.log("Export Config Matrix")}
            />
          </section>

          {/* CP Performance */}
          <section className="band" ref={secCPRef}>
            <div className="band-title">Channel Partners</div>
            <TableCard
              title={tCP?.title || "CP Performance"}
              columns={tCP?.columns || autoColumns(tCP?.rows || [])}
              rows={tCP?.rows || []}
              onExport={() => console.log("Export CP")}
            />
          </section>

          {/* Sales Performance */}
          <section className="band" ref={secSalesRef}>
            <div className="band-title">Sales Team</div>
            <TableCard
              title={tSales?.title || "Sales Performance"}
              columns={tSales?.columns || autoColumns(tSales?.rows || [])}
              rows={tSales?.rows || []}
              onExport={() => console.log("Export Sales")}
            />
          </section>

          {/* Inventory widgets + charts */}
          <section className="band" ref={secInvWidgetsRef}>
            <div className="band-title">Inventory Widgets & Charts</div>

            <div className="kpi-grid kpi-grid-compact">
              <KPICard
                title="Total Inventory Units"
                value={invTotals.total}
                sub="Sum of inventory rows"
              />
              <KPICard
                title="Available Units"
                value={invTotals.available}
                sub="Ready to sell"
              />
              <KPICard
                title="Booked Units"
                value={invTotals.booked}
                sub="Booked/blocked in pipeline"
              />
              <KPICard
                title="Blocked Units"
                value={invTotals.blocked}
                sub="Reserved/hold"
              />
              <KPICard
                title="Registered Units"
                value={invTotals.registered || "N/A"}
                sub="API is N/A in many cases"
              />
            </div>

            <div
              className="charts-grid charts-grid-2"
              style={{ marginTop: 12 }}
            >
              <ChartWithOptions
                chartId="inv_config"
                title="Inventory Mix by Configuration"
                subtitle="Available / Booked / Blocked"
                data={invByConfig}
                categoryKey="config"
                series={[
                  { key: "available", name: "Available" },
                  { key: "booked", name: "Booked" },
                  { key: "blocked", name: "Blocked" },
                ]}
                defaultType="stacked"
                onViewDetail={() => scrollTo(secInvTableRef)}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />

              <ChartWithOptions
                chartId="inv_tower"
                title="Inventory Mix by Tower"
                subtitle="Available / Booked / Blocked"
                data={invByTower}
                categoryKey="tower"
                series={[
                  { key: "available", name: "Available" },
                  { key: "booked", name: "Booked" },
                  { key: "blocked", name: "Blocked" },
                ]}
                defaultType="stacked"
                onViewDetail={() => scrollTo(secInvTableRef)}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />
            </div>
          </section>

          {/* Inventory table */}
          <section className="band" ref={secInvTableRef}>
            <div className="band-title">Inventory</div>
            <TableCard
              title={tInventory?.title || "Inventory"}
              columns={
                tInventory?.columns || autoColumns(tInventory?.rows || [])
              }
              rows={tInventory?.rows || []}
              onExport={() => console.log("Export Inventory")}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
