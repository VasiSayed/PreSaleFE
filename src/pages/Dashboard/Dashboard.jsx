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

// ✅ NEW backend urls (assuming axiosInstance baseURL already has /api)
const EXEC_URL = "/presales/dashboard/executive/";
const DRILL_LEADS_URL = "/presales/dashboard/drill/leads/";
const DRILL_INV_URL = "/presales/dashboard/drill/inventory-units/";
const DRILL_BOOKINGS_URL = "/presales/dashboard/drill/bookings/";
const DRILL_COSTSHEETS_URL = "/presales/dashboard/drill/cost-sheets/";
const DRILL_VISITS_URL = "/presales/dashboard/drill/site-visits/";

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

const cleanCaseDateRange = (v) => {
  // backend expects exact strings: Today/WTD/MTD/QTD/YTD/Custom/ALL
  const s = String(v || "").trim();
  if (!s) return "ALL";
  if (upper(s) === "CUSTOM") return "Custom";
  if (upper(s) === "TODAY") return "Today";
  if (upper(s) === "ALL") return "ALL";
  if (["WTD", "MTD", "QTD", "YTD"].includes(upper(s))) return upper(s);
  return s; // fallback
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
  onRowClick,
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
              <tr
                key={i}
                className={onRowClick ? "row-clickable" : ""}
                onClick={() => onRowClick?.(r)}
              >
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

/* ---------------- Basic Modal + Drawer ---------------- */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Drawer({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="drawer-overlay" onMouseDown={onClose}>
      <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{title}</div>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}

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
  onCategoryClick, // ✅ NEW: drill click
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

  const onChartClick = (e) => {
    if (!onCategoryClick) return;
    const label = e?.activeLabel;
    if (label != null) onCategoryClick(label);
  };

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
                onClick={(_, idx) => {
                  if (!onCategoryClick) return;
                  const label = pieData?.[idx]?.name;
                  if (label != null) onCategoryClick(label);
                }}
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

          {onCategoryClick ? (
            <div className="chart-footnote">
              Tip: click on bar/slice to drill
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
              onClick={onChartClick}
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

          {onCategoryClick ? (
            <div className="chart-footnote">
              Tip: click on chart to drill (hover then click)
            </div>
          ) : null}
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
              onClick={onChartClick}
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

          {onCategoryClick ? (
            <div className="chart-footnote">
              Tip: click on chart to drill (hover then click)
            </div>
          ) : null}
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
            onClick={onChartClick}
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

        {onCategoryClick ? (
          <div className="chart-footnote">Tip: click on bar group to drill</div>
        ) : null}
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

  /* ---------------- Drill States ---------------- */
  const [leadsDrill, setLeadsDrill] = useState({
    open: false,
    title: "Leads",
    loading: false,
    error: "",
    columns: [],
    rows: [],
    total: 0,
    limit: 50,
    offset: 0,
    extraParams: {},
  });

  const [invDrill, setInvDrill] = useState({
    open: false,
    title: "Inventory Drill",
    loading: false,
    error: "",
    breadcrumb: [], // [{label, params}]
    data: null, // response.data
    params: { level: "site" },
  });

  /* ---------------- Build common params for all endpoints ---------------- */
  const buildCommonParams = (overrides = {}) => {
    const params = {};

    // date range
    const dr = cleanCaseDateRange(dateRange);
    params.date_range = dr;

    if (dr === "Custom") {
      if (customFrom) params.from = customFrom; // backend supports from OR from_date
      if (customTo) params.to = customTo; // backend supports to OR to_date
    }

    // site/project
    if (siteId && siteId !== "ALL") {
      params.project_id = Number(siteId);
      params.site_id = Number(siteId); // harmless
    }

    // other filters
    if (tower && tower !== "ALL") params.tower = tower; // tower name
    if (configuration && configuration !== "ALL")
      params.configuration = configuration;
    if (leadSource && leadSource !== "ALL") params.lead_source = leadSource;

    if (channelPartnerId && channelPartnerId !== "ALL")
      params.channel_partner_id = Number(channelPartnerId);
    if (salesUserId && salesUserId !== "ALL")
      params.sales_user_id = Number(salesUserId);
    if (campaignId && campaignId !== "ALL")
      params.campaign_id = Number(campaignId);

    return { ...params, ...overrides };
  };

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
      const params = buildCommonParams({
        lead_limit: leadLimit,
        lead_offset: resetOffset ? 0 : leadOffset,
        drill_limit: 10,
      });

      const res = await axiosInstance.get(EXEC_URL, { params });

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

  /* ---------------- Drill API: Leads ---------------- */
  const openLeadsDrill = async (extraParams = {}, title = "Leads") => {
    setLeadsDrill((s) => ({
      ...s,
      open: true,
      title,
      loading: true,
      error: "",
      rows: [],
      total: 0,
      offset: 0,
      limit: 50,
      extraParams,
    }));

    try {
      const params = buildCommonParams({
        ...extraParams,
        limit: 50,
        offset: 0,
      });
      const res = await axiosInstance.get(DRILL_LEADS_URL, { params });

      if (res.data?.success === false)
        throw new Error(res.data?.error || "Drill error");

      const data = res.data?.data || {};
      setLeadsDrill((s) => ({
        ...s,
        loading: false,
        columns: data.columns || autoColumns(data.rows || []),
        rows: data.rows || [],
        total: data.total || 0,
        limit: data.limit ?? 50,
        offset: data.offset ?? 0,
      }));
    } catch (e) {
      setLeadsDrill((s) => ({
        ...s,
        loading: false,
        error:
          e?.response?.data?.detail ||
          e?.message ||
          "Unable to load leads drill",
      }));
    }
  };

  const paginateLeadsDrill = async (nextOffset) => {
    setLeadsDrill((s) => ({ ...s, loading: true, error: "" }));
    try {
      const params = buildCommonParams({
        ...leadsDrill.extraParams,
        limit: leadsDrill.limit,
        offset: nextOffset,
      });

      const res = await axiosInstance.get(DRILL_LEADS_URL, { params });

      if (res.data?.success === false)
        throw new Error(res.data?.error || "Drill error");

      const data = res.data?.data || {};
      setLeadsDrill((s) => ({
        ...s,
        loading: false,
        columns: data.columns || s.columns,
        rows: data.rows || [],
        total: data.total || 0,
        limit: data.limit ?? s.limit,
        offset: data.offset ?? nextOffset,
      }));
    } catch (e) {
      setLeadsDrill((s) => ({
        ...s,
        loading: false,
        error: e?.response?.data?.detail || e?.message || "Unable to paginate",
      }));
    }
  };

  /* ---------------- Drill API: Inventory Tree ---------------- */
  const fetchInventoryDrill = async (params) => {
    setInvDrill((s) => ({ ...s, loading: true, error: "" }));
    try {
      const res = await axiosInstance.get(DRILL_INV_URL, {
        params: buildCommonParams(params),
      });

      if (res.data?.success === false)
        throw new Error(res.data?.error || "Inventory drill error");

      setInvDrill((s) => ({
        ...s,
        loading: false,
        data: res.data?.data || null,
        params,
      }));
    } catch (e) {
      setInvDrill((s) => ({
        ...s,
        loading: false,
        error:
          e?.response?.data?.detail ||
          e?.message ||
          "Unable to load inventory drill",
      }));
    }
  };

  const openInventoryDrill = async (
    initialParams = { level: "site" },
    title = "Inventory Drill"
  ) => {
    setInvDrill({
      open: true,
      title,
      loading: false,
      error: "",
      breadcrumb: [{ label: "Root", params: initialParams }],
      data: null,
      params: initialParams,
    });
    await fetchInventoryDrill(initialParams);
  };

  const invGoToCrumb = async (idx) => {
    const crumb = invDrill.breadcrumb[idx];
    if (!crumb) return;
    const nextBreadcrumb = invDrill.breadcrumb.slice(0, idx + 1);
    setInvDrill((s) => ({ ...s, breadcrumb: nextBreadcrumb }));
    await fetchInventoryDrill(crumb.params);
  };

  const invOnNodeClick = async (node) => {
    const p = node?.drill_params;
    if (!p) return;

    const nextCrumb = { label: node?.label || "Next", params: p };
    setInvDrill((s) => ({ ...s, breadcrumb: [...s.breadcrumb, nextCrumb] }));
    await fetchInventoryDrill(p);
  };

  const invUnitPaginate = async (offsetDelta) => {
    const cur = invDrill.data;
    const p = invDrill.params || {};
    const limit = Number(cur?.limit || 200);
    const offset = Number(cur?.offset || 0);

    const nextOffset = Math.max(offset + offsetDelta, 0);
    await fetchInventoryDrill({
      ...p,
      level: "unit",
      limit,
      offset: nextOffset,
    });
  };

  /* ---------------- Drill API: Simple list drills (Bookings/Cost/Visits) ---------------- */
  const [simpleDrill, setSimpleDrill] = useState({
    open: false,
    title: "",
    loading: false,
    error: "",
    rows: [],
    columns: [],
    total: 0,
    limit: 50,
    offset: 0,
    url: "",
  });

  const openSimpleDrill = async (url, title) => {
    setSimpleDrill({
      open: true,
      title,
      loading: true,
      error: "",
      rows: [],
      columns: [],
      total: 0,
      limit: 50,
      offset: 0,
      url,
    });

    try {
      const res = await axiosInstance.get(url, {
        params: buildCommonParams({ limit: 50, offset: 0 }),
      });

      if (res.data?.success === false)
        throw new Error(res.data?.error || "Drill error");
      const data = res.data?.data || {};

      const rows = data.rows || [];
      setSimpleDrill((s) => ({
        ...s,
        loading: false,
        rows,
        columns: autoColumns(rows),
        total: data.total ?? rows.length ?? 0,
        limit: data.limit ?? 50,
        offset: data.offset ?? 0,
      }));
    } catch (e) {
      setSimpleDrill((s) => ({
        ...s,
        loading: false,
        error:
          e?.response?.data?.detail || e?.message || "Unable to load drill",
      }));
    }
  };

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

  // helpers for mapping label->id
  const siteIdByName = (siteName) => {
    const s = sites.find((x) => (x.label || x.name) === siteName);
    return s?.id || null;
  };
  const cpIdByLabel = (label) => cps.find((x) => x.label === label)?.id || null;
  const spIdByLabel = (label) =>
    salesPeople.find((x) => x.label === label)?.id || null;

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

            {/* Optional quick drill buttons */}
            <button
              className="btn-ghost"
              type="button"
              onClick={() =>
                openSimpleDrill(DRILL_BOOKINGS_URL, "Bookings Drill")
              }
            >
              Bookings Drill
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() =>
                openSimpleDrill(DRILL_COSTSHEETS_URL, "Cost Sheets Drill")
              }
            >
              CostSheets Drill
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() =>
                openSimpleDrill(DRILL_VISITS_URL, "Site Visits Drill")
              }
            >
              Visits Drill
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
                onViewDetail={() => openLeadsDrill({}, "Leads Drill")}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
                // Optional: drill by stage (best effort)
                onCategoryClick={(stage) => {
                  // You can add smarter mapping later. For now open leads.
                  openLeadsDrill({}, `Leads Drill • ${stage}`);
                }}
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
                onViewDetail={() => openLeadsDrill({}, "Leads Drill")}
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
                onCategoryClick={(src) =>
                  openLeadsDrill(
                    { lead_source: src },
                    `Leads Drill • Source: ${src}`
                  )
                }
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
                onViewDetail={() => openLeadsDrill({}, "Leads Drill")}
                yTickFormatter={(v) => `${v}%`}
                valueFormatter={(v) => `${toNum(v)}%`}
                onCategoryClick={(siteName) => {
                  const pid = siteIdByName(siteName);
                  if (pid)
                    return openLeadsDrill(
                      { project_id: pid, site_id: pid },
                      `Leads Drill • Site: ${siteName}`
                    );
                  return openLeadsDrill({}, `Leads Drill • Site: ${siteName}`);
                }}
              />

              <div className="note">
                Note: Lead→Registration is sometimes N/A in API, shown as 0 for
                visualization.
              </div>
            </div>
          </section>

          {/* Site Summary Table (row click -> inventory drill) */}
          <section className="band">
            <TableCard
              title={tSite?.title || "Site Summary"}
              columns={tSite?.columns || autoColumns(tSite?.rows || [])}
              rows={tSite?.rows || []}
              onExport={() => console.log("Export Site Summary")}
              onRowClick={(row) => {
                const siteName = row?.Site;
                const pid = siteIdByName(siteName);
                if (pid)
                  return openInventoryDrill(
                    { level: "tower", project_id: pid },
                    `Inventory • ${siteName}`
                  );
                return openInventoryDrill({ level: "site" }, "Inventory Drill");
              }}
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

                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() =>
                      openLeadsDrill({}, "Leads Drill (Full List)")
                    }
                  >
                    Drill
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
              onRowClick={(row) => {
                const cfg = row?.Configuration;
                if (!cfg) return;
                openLeadsDrill(
                  { configuration: cfg },
                  `Leads Drill • Config: ${cfg}`
                );
              }}
            />
          </section>

          {/* CP Performance (row click -> leads drill by CP) */}
          <section className="band" ref={secCPRef}>
            <div className="band-title">Channel Partners</div>
            <TableCard
              title={tCP?.title || "CP Performance"}
              columns={tCP?.columns || autoColumns(tCP?.rows || [])}
              rows={tCP?.rows || []}
              onExport={() => console.log("Export CP")}
              onRowClick={(row) => {
                const name = row?.["CP Name"];
                const id = cpIdByLabel(name);
                if (id)
                  return openLeadsDrill(
                    { channel_partner_id: id },
                    `Leads Drill • CP: ${name}`
                  );
                openLeadsDrill({}, `Leads Drill • CP: ${name}`);
              }}
            />
          </section>

          {/* Sales Performance (row click -> leads drill by salesperson) */}
          <section className="band" ref={secSalesRef}>
            <div className="band-title">Sales Team</div>
            <TableCard
              title={tSales?.title || "Sales Performance"}
              columns={tSales?.columns || autoColumns(tSales?.rows || [])}
              rows={tSales?.rows || []}
              onExport={() => console.log("Export Sales")}
              onRowClick={(row) => {
                const name = row?.Salesperson;
                const id = spIdByLabel(name);
                if (id)
                  return openLeadsDrill(
                    { sales_user_id: id },
                    `Leads Drill • Sales: ${name}`
                  );
                openLeadsDrill({}, `Leads Drill • Sales: ${name}`);
              }}
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
                onViewDetail={() =>
                  openInventoryDrill({ level: "site" }, "Inventory Drill")
                }
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
                onCategoryClick={() =>
                  openInventoryDrill({ level: "site" }, "Inventory Drill")
                }
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
                onViewDetail={() =>
                  openInventoryDrill({ level: "site" }, "Inventory Drill")
                }
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
                onCategoryClick={(towerName) => {
                  // jump to floors for this tower name (backend supports tower_id as name)
                  const base = {};
                  if (siteId && siteId !== "ALL")
                    base.project_id = Number(siteId);
                  openInventoryDrill(
                    { level: "floor", ...base, tower_id: towerName },
                    `Inventory • Tower: ${towerName}`
                  );
                }}
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
              onRowClick={() =>
                openInventoryDrill({ level: "site" }, "Inventory Drill")
              }
            />
          </section>
        </main>
      </div>

      {/* ---------------- Leads Drill Modal ---------------- */}
      <Modal
        open={leadsDrill.open}
        title={leadsDrill.title}
        onClose={() => setLeadsDrill((s) => ({ ...s, open: false }))}
      >
        {leadsDrill.error ? (
          <div className="alert alert-error">{leadsDrill.error}</div>
        ) : null}
        {leadsDrill.loading ? (
          <div className="alert">Loading drill…</div>
        ) : null}

        <div className="drill-toolbar">
          <div className="drill-meta">
            Total: <b>{leadsDrill.total}</b> • Offset:{" "}
            <b>{leadsDrill.offset}</b> • Limit: <b>{leadsDrill.limit}</b>
          </div>
          <div className="drill-actions">
            <button
              className="btn-ghost"
              type="button"
              disabled={leadsDrill.loading || leadsDrill.offset <= 0}
              onClick={() =>
                paginateLeadsDrill(
                  Math.max(leadsDrill.offset - leadsDrill.limit, 0)
                )
              }
            >
              Prev
            </button>
            <button
              className="btn-ghost"
              type="button"
              disabled={
                leadsDrill.loading ||
                leadsDrill.offset + leadsDrill.limit >= leadsDrill.total
              }
              onClick={() =>
                paginateLeadsDrill(leadsDrill.offset + leadsDrill.limit)
              }
            >
              Next
            </button>
          </div>
        </div>

        <div className="table-scroll drill-table">
          <table>
            <thead>
              <tr>
                {(leadsDrill.columns || []).map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(leadsDrill.rows || []).length ? (
                leadsDrill.rows.map((r, i) => (
                  <tr key={i}>
                    {leadsDrill.columns.map((c) => (
                      <td key={c}>{r?.[c] ?? "N/A"}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="empty-cell"
                    colSpan={Math.max(leadsDrill.columns.length, 1)}
                  >
                    No rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ---------------- Simple Drill Modal (Bookings/Cost/Visits) ---------------- */}
      <Modal
        open={simpleDrill.open}
        title={simpleDrill.title}
        onClose={() => setSimpleDrill((s) => ({ ...s, open: false }))}
      >
        {simpleDrill.error ? (
          <div className="alert alert-error">{simpleDrill.error}</div>
        ) : null}
        {simpleDrill.loading ? (
          <div className="alert">Loading drill…</div>
        ) : null}

        <div className="drill-toolbar">
          <div className="drill-meta">
            Total: <b>{simpleDrill.total}</b>
          </div>
        </div>

        <div className="table-scroll drill-table">
          <table>
            <thead>
              <tr>
                {(simpleDrill.columns || []).map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(simpleDrill.rows || []).length ? (
                simpleDrill.rows.map((r, i) => (
                  <tr key={i}>
                    {simpleDrill.columns.map((c) => (
                      <td key={c}>{r?.[c] ?? "N/A"}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="empty-cell"
                    colSpan={Math.max(simpleDrill.columns.length, 1)}
                  >
                    No rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ---------------- Inventory Drill Drawer ---------------- */}
      <Drawer
        open={invDrill.open}
        title={invDrill.title}
        onClose={() => setInvDrill((s) => ({ ...s, open: false }))}
      >
        {invDrill.error ? (
          <div className="alert alert-error">{invDrill.error}</div>
        ) : null}
        {invDrill.loading ? (
          <div className="alert">Loading inventory…</div>
        ) : null}

        {/* Breadcrumb */}
        <div className="crumbs">
          {invDrill.breadcrumb.map((c, idx) => (
            <button
              key={idx}
              className={`crumb ${
                idx === invDrill.breadcrumb.length - 1 ? "crumb-active" : ""
              }`}
              type="button"
              onClick={() => invGoToCrumb(idx)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {invDrill.data?.level !== "unit" ? (
          <div className="inv-nodes">
            {(invDrill.data?.nodes || []).map((n) => (
              <button
                key={String(n.id)}
                className="inv-node"
                type="button"
                onClick={() => invOnNodeClick(n)}
              >
                <div className="inv-node-title">{n.label}</div>
                <div className="inv-node-counts">
                  <span>
                    Total: <b>{n?.counts?.total ?? 0}</b>
                  </span>
                  <span>
                    Avail: <b>{n?.counts?.available ?? 0}</b>
                  </span>
                  <span>
                    Booked: <b>{n?.counts?.booked ?? 0}</b>
                  </span>
                  <span>
                    Blocked: <b>{n?.counts?.blocked ?? 0}</b>
                  </span>
                </div>
                <div className="inv-node-next">Next: {n.next_level}</div>
              </button>
            ))}
            {!invDrill.loading && !(invDrill.data?.nodes || []).length ? (
              <div className="mini-empty">No nodes</div>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="drill-toolbar">
              <div className="drill-meta">
                Total: <b>{invDrill.data?.total ?? 0}</b> • Offset:{" "}
                <b>{invDrill.data?.offset ?? 0}</b> • Limit:{" "}
                <b>{invDrill.data?.limit ?? 0}</b>
              </div>
              <div className="drill-actions">
                <button
                  className="btn-ghost"
                  type="button"
                  disabled={
                    invDrill.loading || (invDrill.data?.offset ?? 0) <= 0
                  }
                  onClick={() =>
                    invUnitPaginate(-(invDrill.data?.limit || 200))
                  }
                >
                  Prev
                </button>
                <button
                  className="btn-ghost"
                  type="button"
                  disabled={invDrill.loading || !invDrill.data?.has_next}
                  onClick={() => invUnitPaginate(invDrill.data?.limit || 200)}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="table-scroll drill-table">
              <table>
                <thead>
                  <tr>
                    {autoColumns(invDrill.data?.rows || []).map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(invDrill.data?.rows || []).length ? (
                    invDrill.data.rows.map((r, i) => (
                      <tr key={i}>
                        {autoColumns(invDrill.data?.rows || []).map((c) => (
                          <td key={c}>{r?.[c] ?? "N/A"}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="empty-cell"
                        colSpan={Math.max(
                          autoColumns(invDrill.data?.rows || []).length,
                          1
                        )}
                      >
                        No rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
