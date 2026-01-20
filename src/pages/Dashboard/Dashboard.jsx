// SirDashboard.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

import { motion } from "framer-motion";

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
  LabelList,
} from "recharts";

/* =========================================================================
   ENDPOINTS
   ========================================================================= */

const API_PREFIX = (axiosInstance?.defaults?.baseURL || "").includes("/api")
  ? ""
  : "/api";

const SCOPE_URL = `${API_PREFIX}/client/my-scope/`;
const DASH_URL = `${API_PREFIX}/dashboard/vasi/presales-exec/`;

const AUTO_FETCH_ON_CHANGE = true;

/* ---------------- helpers ---------------- */
const upper = (v) => (v == null ? "" : String(v).trim().toUpperCase());
const safeArr = (v) => (Array.isArray(v) ? v : []);
const uniq = (arr) => [
  ...new Set((arr || []).filter((x) => x != null && x !== "")),
];

const toNum = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null) return 0;
  if (typeof v === "object") return 0;

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

const formatCompact = (n) => {
  const num = typeof n === "number" ? n : toNum(n);
  if (!Number.isFinite(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e7) return `${(num / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${(num / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(2)}k`;
  return `${num}`;
};

const formatINRCompact = (n) => `₹${formatCompact(n)}`;

const signedCompact = (n) => {
  const v = toNum(n);
  if (!Number.isFinite(v)) return "N/A";
  if (v === 0) return "0";
  return v > 0 ? `+${formatCompact(v)}` : `${formatCompact(v)}`;
};

const pctTxt = (v) => {
  if (
    v === null ||
    v === undefined ||
    v === "" ||
    String(v).toUpperCase() === "N/A"
  )
    return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pickAny = (obj, keys, fallback = null) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return fallback;
};

const normalizeApiEnvelope = (payload) => {
  if (!payload) return null;
  if (payload?.success === false)
    throw new Error(payload?.error || "API error");
  return payload?.data ?? payload;
};

const compareLabelByPeriod = (dr) => {
  const x = upper(dr);
  if (x === "DAY") return "vs yesterday";
  if (x === "WEEK") return "vs last week";
  if (x === "MONTH") return "vs last month";
  if (x === "YEAR") return "vs last year";
  return "vs prev";
};

const SERIES_COLORS = [
  "var(--blue)",
  "var(--teal)",
  "var(--orange)",
  "var(--purple)",
  "var(--pink)",
  "var(--green)",
  "var(--red)",
];

/* ---------------- label renderers (show counts on chart, no hover needed) ---------------- */
const BarTopLabel = (props) => {
  const { x, y, width, value } = props;
  if (value == null) return null;
  const txt = formatCompact(value);
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize="12"
      fontWeight="800"
      fill="#0f172a"
    >
      {txt}
    </text>
  );
};

const BarRightLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (value == null) return null;
  const txt = formatCompact(value);
  return (
    <text
      x={x + width + 10}
      y={y + height / 2 + 4}
      textAnchor="start"
      fontSize="12"
      fontWeight="900"
      fill="#0f172a"
    >
      {txt}
    </text>
  );
};

const SmallPointLabel = (props) => {
  const { x, y, value } = props;
  if (value == null) return null;
  const txt = formatCompact(value);
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="#0f172a"
    >
      {txt}
    </text>
  );
};

const PieValueLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  value,
}) => {
  if (value == null) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.65;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#0f172a"
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="900"
      fontSize="12"
    >
      {formatCompact(value)}
    </text>
  );
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
        {onViewDetail ? (
          <button className="btn-ghost" type="button" onClick={onViewDetail}>
            View detail
          </button>
        ) : null}
      </div>
    </div>

    <div className="chart-body">{children}</div>
  </div>
);

/* ---------------- Recharts “Chart With Options” ---------------- */
function ChartWithOptions({
  chartId,
  title,
  subtitle,
  data = [],
  categoryKey,
  series = [], // [{key,name}]
  defaultType = "bar", // bar | line | area | pie
  onViewDetail,
  yTickFormatter,
  valueFormatter,
}) {
  const hasMultiSeries = (series?.length || 0) > 1;
  const [chartType, setChartType] = useState(defaultType);
  const [pieMetric] = useState(series?.[0]?.key || "");

  const norm = useMemo(() => {
    return safeArr(data).map((d) => {
      const out = { ...d };
      series.forEach((s) => {
        out[s.key] = toNum(d?.[s.key]);
      });
      out[categoryKey] = d?.[categoryKey] ?? "N/A";
      return out;
    });
  }, [data, series, categoryKey]);

  const pieData = useMemo(() => {
    const metric = pieMetric || series?.[0]?.key;
    return norm.map((d) => ({
      name: d?.[categoryKey] ?? "N/A",
      value: toNum(d?.[metric]),
    }));
  }, [norm, pieMetric, categoryKey, series]);

  const chartTypes = [
    { key: "bar", title: "Bar" },
    { key: "pie", title: "Pie" },
    { key: "line", title: "Line" },
    { key: "area", title: "Area" },
  ];

  const Icon = ({ type }) => {
    if (type === "bar")
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19V5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 19V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 19V9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M17 19V6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M3 19H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    if (type === "pie")
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12V3a9 9 0 1 1-9 9h9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9h-9V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    if (type === "line")
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19V5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M3 19H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 14l4-5 4 3 5-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19V5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3 19H21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M6 14l4-5 4 3 5-7V19H6Z" fill="currentColor" opacity="0.18" />
        <path
          d="M6 14l4-5 4 3 5-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const toolbar = (
    <div className="chart-iconbar" role="tablist" aria-label="Chart type">
      {chartTypes.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`chart-icobtn ${chartType === t.key ? "active" : ""}`}
          onClick={() => setChartType(t.key)}
          title={t.title}
          aria-label={t.title}
        >
          <Icon type={t.key} />
        </button>
      ))}
    </div>
  );

  const tooltipFormatter = (val, name) => {
    const v =
      typeof valueFormatter === "function" ? valueFormatter(val, name) : val;
    return [v, name];
  };

  const renderChart = () => {
    if (!norm.length) return <div className="mini-empty">No data</div>;

    if (chartType === "pie") {
      return (
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* tooltip optional; values already on chart */}
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={55}
                paddingAngle={2}
                labelLine={false}
                label={PieValueLabel}
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
              margin={{ top: 18, right: 18, left: 6, bottom: 10 }}
            >
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                >
                  <LabelList dataKey={s.key} content={SmallPointLabel} />
                </Line>
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
              margin={{ top: 18, right: 18, left: 6, bottom: 10 }}
            >
              <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
              <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
              <Tooltip formatter={tooltipFormatter} />
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
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                >
                  <LabelList dataKey={s.key} content={SmallPointLabel} />
                </Area>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // bar
    return (
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={norm}
            margin={{ top: 22, right: 18, left: 6, bottom: 10 }}
          >
            <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                radius={[8, 8, 0, 0]}
              >
                <LabelList dataKey={s.key} content={BarTopLabel} />
              </Bar>
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

/* ---------------- Flip Tiles ---------------- */
const TILE_ICON = {
  site_visits: "🌐",
  online_leads: "🧑‍🤝‍🧑",
  revisits: "🔁",
  active_channel_partners: "👥",
  cp_meetings: "🤝",
  inventory_status: "📦",
  top_channel_partners: "🏆",
};

/* wrap long y-axis labels (Top CPs overlap fix) */
const cleanPartnerName = (s) =>
  String(s || "")
    .replace(/^Channel\s*Partner\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

const WrapTick = (props) => {
  const { x, y, payload } = props;
  const raw = cleanPartnerName(payload?.value ?? "");
  if (!raw) return null;

  // split into 2 lines max
  const words = raw.split(" ");
  let line1 = raw;
  let line2 = "";
  if (words.length >= 3) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(" ");
    line2 = words.slice(mid).join(" ");
  } else if (raw.length > 16) {
    line1 = raw.slice(0, 16);
    line2 = raw.slice(16);
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        textAnchor="end"
        fill="#667085"
        fontSize="12"
        fontWeight="700"
      >
        <tspan x={0} dy={-2}>
          {line1}
        </tspan>
        {line2 ? (
          <tspan x={0} dy={14}>
            {line2}
          </tspan>
        ) : null}
      </text>
    </g>
  );
};

function MiniChart({ tile }) {
  const s = tile?.series;
  const kind = tile?.kind;

  // ✅ Rank horizontal bar (Top Channel Partners)
  if (kind === "rank_hbar") {
    const rows = safeArr(tile?.rank);
    if (!rows.length) return <div className="mini-empty">No rank data</div>;

    const data = rows.map((r) => ({
      name: cleanPartnerName(r?.name ?? "N/A"),
      value: toNum(r?.value),
    }));

const maxLen = data.reduce(
  (m, d) => Math.max(m, String(d.name || "").length),
  0,
);
// approx 7px per character + padding, clamp
const yAxisWidth = Math.min(190, Math.max(90, Math.round(maxLen * 7 + 18)));

return (
  <div className="mini-chart">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        // ✅ remove big left margin (YAxis already takes width)
        margin={{ top: 10, right: 28, left: 8, bottom: 10 }}
        barCategoryGap={14}
      >
        <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={yAxisWidth}
          tick={<WrapTick />}
          interval={0}
          tickMargin={8}
        />
        <Tooltip />
        <Bar
          dataKey="value"
          // ✅ no rounded ends
          radius={0}
          barSize={30}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={SERIES_COLORS[idx % SERIES_COLORS.length]} />
          ))}
          <LabelList dataKey="value" content={BarRightLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

  }

  // Compare series (current vs previous)
  if (!s?.labels?.length || !s?.current?.length) {
    return <div className="mini-empty">No trend data</div>;
  }

  const data = s.labels.map((lab, idx) => ({
    label: lab,
    a: toNum(s.current?.[idx]),
    b: toNum(s.previous?.[idx]),
  }));

  if (kind === "line_compare") {
    return (
      <div className="mini-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 18, right: 16, left: 8, bottom: 10 }}
          >
            <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="a"
              name={s.current_label || "Current"}
              stroke="var(--orange)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            >
              <LabelList dataKey="a" content={SmallPointLabel} />
            </Line>
            <Line
              type="monotone"
              dataKey="b"
              name={s.previous_label || "Previous"}
              stroke="var(--blue)"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
            >
              <LabelList dataKey="b" content={SmallPointLabel} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // bar compare
  return (
    <div className="mini-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 16, left: 8, bottom: 10 }}
        >
          <CartesianGrid stroke="#eaeaea" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="a"
            name={s.current_label || "Current"}
            fill="var(--blue)"
            radius={[8, 8, 0, 0]}
          >
            <LabelList dataKey="a" content={BarTopLabel} />
          </Bar>
          <Bar
            dataKey="b"
            name={s.previous_label || "Previous"}
            fill="var(--green)"
            radius={[8, 8, 0, 0]}
          >
            <LabelList dataKey="b" content={BarTopLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FlipStatCard({ tile }) {
  const [flipped, setFlipped] = useState(false);

  const delta = pctTxt(tile?.delta_pct);
  const isUp = delta !== null ? delta >= 0 : null;

  return (
    <div
      className={`flip-tile ${tile?.span === 2 ? "span-2" : ""}`}
      onClick={() => setFlipped((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setFlipped((v) => !v)}
      title="Click to view details"
    >
      <motion.div
        className="flip-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55 }}
      >
        {/* FRONT */}
        <div className="flip-face flip-front">
          <div className="flip-top">
            <div className="flip-ico">{TILE_ICON[tile?.id] || "📊"}</div>
            <div className="flip-cta">CLICK TO VIEW DETAILS</div>
          </div>

          <div className="flip-title">{tile?.title || "Metric"}</div>

          <div className="flip-value">
            {tile?.value_label ? tile.value_label : (tile?.value ?? "N/A")}
          </div>

          <div className="flip-divider" />

          <div className="flip-delta">
            {delta === null ? (
              <span className="delta-na">N/A</span>
            ) : (
              <>
                <span className={`delta-arrow ${isUp ? "up" : "down"}`}>
                  {isUp ? "↗" : "↘"}
                </span>
                <span className={`delta-pct ${isUp ? "up" : "down"}`}>
                  {Math.abs(delta).toFixed(1)}%
                </span>
              </>
            )}
            <span className="delta-label">
              {tile?.compare_label || "vs prev"}
            </span>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-face flip-back">
          <div className="flip-back-head">
            <div className="flip-back-title">{tile?.title || "Details"}</div>
            <div className="flip-back-sub">
              {tile?.value_label ? tile.value_label : (tile?.value ?? "N/A")}
            </div>
          </div>

          <MiniChart tile={tile} />
          <div className="flip-back-hint">Click again to go back</div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Site Summary Card V2 ---------------- */
const SS_ACCENT = {
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

function SiteMetricBox({ label, value }) {
  return (
    <div className="ss2-metric">
      <div className="ss2-metric-ico" />
      <div className="ss2-metric-meta">
        <div className="ss2-metric-k">{label}</div>
        <div className="ss2-metric-v">{value ?? "N/A"}</div>
      </div>
    </div>
  );
}

function SiteSummaryCardV2({
  row,
  labels,
  seriesRow,
  variant = "green",
  start = "trend",
}) {
  const [flipped, setFlipped] = useState(false);

  const siteName =
    row?.project_name ||
    row?.project_label ||
    row?.site ||
    row?.label ||
    row?.name ||
    "Site";

  const leadsCur = pickAny(row?.leads, ["current"], null);
  const qualCur = pickAny(row?.qualified, ["current"], null);
  const bookCur = pickAny(row?.bookings, ["current"], null);
  const regCur = pickAny(row?.registrations, ["current"], null);

  const badgePct =
    pickAny(row?.leads, ["pct"], null) ??
    pickAny(row?.qualified, ["pct"], null) ??
    pickAny(row?.bookings, ["pct"], null) ??
    pickAny(row?.registrations, ["pct"], null);

  const badgeTxt =
    badgePct === null || badgePct === undefined
      ? null
      : `${toNum(badgePct).toFixed(1)}%`;

  const accent = SS_ACCENT[variant] || SS_ACCENT.green;

  const y = safeArr(seriesRow?.data).map((v) => toNum(v));
  const x = safeArr(labels);
  const chartData = x.map((lab, i) => ({
    label: lab,
    value: toNum(y?.[i] ?? 0),
  }));

  const gid = useMemo(() => {
    const key = `${row?.project_id || siteName}-${variant}`.replace(
      /\s+/g,
      "-",
    );
    return `ss2grad-${key}`;
  }, [row?.project_id, siteName, variant]);

  const onFlip = () => setFlipped((v) => !v);

  const TrendFace = (
    <div className="ss2-face ss2-trend">
      <div className="ss2-head">
        <div>
          <div className="ss2-title">{siteName}</div>
          <div className="ss2-sub">Conversion Trend</div>
        </div>

        <div className="ss2-badge" style={{ color: accent }}>
          {badgeTxt ? `↗ ${badgeTxt}` : "Trend"}
        </div>
      </div>

      <div className="ss2-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 18, right: 14, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2.6}
              fill={`url(#${gid})`}
              fillOpacity={1}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            >
              <LabelList dataKey="value" content={SmallPointLabel} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="ss2-hint">Click to view metrics</div>
    </div>
  );

  const MetricsFace = (
    <div className="ss2-face ss2-metrics">
      <div className="ss2-head">
        <div>
          <div className="ss2-title">{siteName}</div>
          <div className="ss2-sub">Key Metrics</div>
        </div>

        <div className="ss2-badge" style={{ color: accent }}>
          {badgeTxt || "Metrics"}
        </div>
      </div>

      <div className="ss2-metrics-grid">
        <SiteMetricBox label="Total Leads" value={leadsCur ?? "N/A"} />
        <SiteMetricBox label="Qualified" value={qualCur ?? "N/A"} />
        <SiteMetricBox label="Bookings" value={bookCur ?? "N/A"} />
        <SiteMetricBox label="Registrations" value={regCur ?? "N/A"} />
      </div>

      <div className="ss2-hint">Click to view chart</div>
    </div>
  );

  const front = start === "metrics" ? MetricsFace : TrendFace;
  const back = start === "metrics" ? TrendFace : MetricsFace;

  return (
    <div
      className={`site-summary-card ss2 ${variant}`}
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => e.key === "Enter" && onFlip()}
      title="Click to flip"
    >
      <motion.div
        className="ss2-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="ss2-side ss2-front">{front}</div>
        <div className="ss2-side ss2-back">{back}</div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   MAIN
   ========================================================================= */
export default function SirDashboard() {
  const { user } = useAuth();

  const [scope, setScope] = useState(null);
  const [dash, setDash] = useState(null);

  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [error, setError] = useState("");

  const [dateRange, setDateRange] = useState("Year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [siteId, setSiteId] = useState("ALL");
  const [tower, setTower] = useState("ALL");
  const [configuration, setConfiguration] = useState("ALL");
  const [leadSource, setLeadSource] = useState("ALL");
  const [channelPartnerId, setChannelPartnerId] = useState("ALL");
  const [salesUserId, setSalesUserId] = useState("ALL");
  const [campaignId, setCampaignId] = useState("ALL");

  const secOverviewRef = useRef(null);
  const secChartsRef = useRef(null);
  const secInvWidgetsRef = useRef(null);
  const secInvTableRef = useRef(null);

  const abortRef = useRef(null);

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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

  // build params
  const buildParams = useCallback(() => {
    const params = {};
    const dr = upper(dateRange);

    if (dr === "CUSTOM") {
      params.period = "custom";
      if (customFrom) params.from = customFrom;
      if (customTo) params.to = customTo;
    } else {
      params.period = (dr || "YEAR").toLowerCase();
    }

    if (siteId && siteId !== "ALL") params.project_id = Number(siteId);
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

    return params;
  }, [
    dateRange,
    customFrom,
    customTo,
    siteId,
    tower,
    configuration,
    leadSource,
    channelPartnerId,
    salesUserId,
    campaignId,
  ]);

  const fetchDashboard = useCallback(async () => {
    if (!scope) return;

    try {
      if (abortRef.current) abortRef.current.abort();
    } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingDash(true);
    setError("");

    const params = buildParams();

    try {
      const res = await axiosInstance.get(DASH_URL, {
        params,
        signal: controller.signal,
      });
      const data = normalizeApiEnvelope(res.data);
      setDash(data || null);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setDash(null);
      setError(
        e?.response?.data?.detail || e?.message || "Unable to load dashboard.",
      );
    } finally {
      setLoadingDash(false);
    }
  }, [scope, buildParams]);

  useEffect(() => {
    if (!scope) return;
    fetchDashboard();
  }, [scope, fetchDashboard]);

  const filtersKey = useMemo(() => {
    return JSON.stringify({
      dateRange,
      customFrom,
      customTo,
      siteId,
      tower,
      configuration,
      leadSource,
      channelPartnerId,
      salesUserId,
      campaignId,
    });
  }, [
    dateRange,
    customFrom,
    customTo,
    siteId,
    tower,
    configuration,
    leadSource,
    channelPartnerId,
    salesUserId,
    campaignId,
  ]);

  useEffect(() => {
    if (!scope) return;
    if (!AUTO_FETCH_ON_CHANGE) return;
    const t = setTimeout(() => fetchDashboard(), 350);
    return () => clearTimeout(t);
  }, [filtersKey, scope, fetchDashboard]);

  /* =========================================================================
     MAP API -> UI
     ========================================================================= */

  const meta = dash?.meta || {};
  const fo = dash?.filter_options || {};

  const brandName =
    scope?.brand?.company_name ||
    meta?.brand?.company_name ||
    "Vibe Pre-Sales Cockpit";

  const dateRanges = useMemo(
    () => ["Year", "Month", "Week", "Day", "Custom"],
    [],
  );

  const sites = safeArr(
    fo?.sites || scope?.projects || meta?.project_debug?.projects || [],
  );
  const towers = uniq(safeArr(fo?.towers || []));
  const configs = uniq(safeArr(fo?.configurations || []));
  const leadSources = uniq(safeArr(fo?.lead_sources || []));
  const cps = safeArr(fo?.channel_partners || []);
  const salesPeople = safeArr(fo?.sales_people || []);
  const campaigns = safeArr(fo?.campaigns || []);

  // KPIs
  const kpis = useMemo(() => {
    return safeArr(dash?.kpis).map((k) => {
      const unit = k?.unit === "%" ? "%" : "";
      const isINR = upper(k?.unit) === "INR";

      const curVal = k?.current;
      const prevVal = k?.previous;

      const curText =
        curVal === null || curVal === undefined
          ? "N/A"
          : unit === "%"
            ? `${toNum(curVal).toFixed(1)}%`
            : isINR
              ? formatINRCompact(curVal)
              : formatCompact(curVal);

      const prevText =
        prevVal === null || prevVal === undefined
          ? "Prev: N/A"
          : unit === "%"
            ? `Prev: ${toNum(prevVal).toFixed(1)}%`
            : `Prev: ${formatCompact(prevVal)}`;

      const diffText =
        k?.diff === null || k?.diff === undefined
          ? "Diff: N/A"
          : unit === "%"
            ? `Diff: ${toNum(k?.diff) >= 0 ? "+" : ""}${toNum(k?.diff).toFixed(1)}%`
            : `Diff: ${signedCompact(k?.diff)}`;

      // ✅ safe pct: if prev=0 and cur>0 then show N/A (avoid infinite)
      const rawPct = k?.pct;
      const safePct = toNum(prevVal) === 0 && toNum(curVal) > 0 ? null : rawPct;

      const pctText =
        safePct === null || safePct === undefined
          ? "Pct: N/A"
          : `Pct: ${toNum(safePct).toFixed(1)}%`;

      return {
        id: k?.id,
        title: k?.title || "KPI",
        value: curText,
        sub: `${prevText} • ${diffText} • ${pctText}`,
      };
    });
  }, [dash]);

  const charts = dash?.charts || {};

  const chartFunnel = useMemo(() => {
    const steps = safeArr(charts?.lead_pipeline_funnel?.steps);
    return steps.map((s) => ({
      stage: s?.label || s?.key || "Stage",
      count: toNum(s?.value),
    }));
  }, [charts]);

  const chartSource = useMemo(() => {
    const rows = safeArr(charts?.source_wise_leads_bookings?.rows);
    return rows.map((r) => ({
      source: r?.source || "Unknown",
      leads: toNum(r?.leads_cur ?? r?.leads?.current),
      bookings: toNum(r?.bookings_cur ?? r?.bookings?.current),
    }));
  }, [charts]);

  const chartSiteConv = useMemo(() => {
    const rows = safeArr(charts?.site_wise_conversion_ratios?.rows);
    return rows.map((r) => ({
      site:
        r?.project_name ||
        r?.project_label ||
        `Project #${r?.project_id ?? "-"}`,
      lead_to_booking_pct: toNum(
        r?.lead_to_booking_pct?.current ?? r?.lead_to_booking_pct ?? 0,
      ),
      lead_to_registration_pct: toNum(
        r?.lead_to_registration_pct?.current ??
          r?.lead_to_registration_pct ??
          0,
      ),
    }));
  }, [charts]);

  // Tiles
  const quickTiles = useMemo(() => {
    const mkSeries = (chartBlock) => {
      const labels = safeArr(chartBlock?.labels);
      const s0 = chartBlock?.series?.[0];
      const s1 = chartBlock?.series?.[1];
      const cur = safeArr(s0?.data);
      const prev = safeArr(s1?.data);
      return {
        labels,
        current: cur.length ? cur : new Array(labels.length).fill(0),
        previous: prev.length ? prev : new Array(labels.length).fill(0),
        current_label: s0?.name || "Current",
        previous_label: s1?.name || "Previous",
      };
    };

    const mkTotalsDelta = (chartBlock) => {
      const pct = chartBlock?.totals?.pct;
      return pct === null || pct === undefined ? null : toNum(pct);
    };

    const siteVisits = charts?.site_visits;
    const onlineLeads = charts?.online_leads;
    const activeCP = charts?.active_channel_partners;
    const inventoryStatus = charts?.inventory_status;

    const tiles = [];

    tiles.push({
      id: "site_visits",
      title: "Site Visits",
      value: formatCompact(siteVisits?.totals?.current ?? 0),
      delta_pct: mkTotalsDelta(siteVisits),
      compare_label: compareLabelByPeriod(dateRange),
      kind: "bar_compare",
      series: mkSeries(siteVisits),
    });

    tiles.push({
      id: "online_leads",
      title: "Online Leads",
      value: formatCompact(onlineLeads?.totals?.current ?? 0),
      delta_pct: mkTotalsDelta(onlineLeads),
      compare_label: "vs prev",
      kind: "line_compare",
      series: mkSeries(onlineLeads),
    });

    tiles.push({
      id: "revisits",
      title: "Revisits",
      value: formatCompact(charts?.revisit?.totals?.current ?? 0),
      delta_pct: mkTotalsDelta(charts?.revisit),
      compare_label: "vs prev",
      kind: "bar_compare",
      series: mkSeries(charts?.revisit),
    });

    tiles.push({
      id: "active_channel_partners",
      title: "Active Channel Partners",
      value: formatCompact(activeCP?.totals?.current ?? 0),
      delta_pct: mkTotalsDelta(activeCP),
      compare_label: "vs prev",
      kind: "bar_compare",
      series: mkSeries(activeCP),
    });

    tiles.push({
      id: "cp_meetings",
      title: "Unique CP Meetings",
      value: "N/A",
      delta_pct: null,
      compare_label: "vs prev",
      kind: "line_compare",
      series: null,
    });



// inventory tile (snapshot + optional activity series)
const snap = inventoryStatus?.snapshot || dash?.inventory_snapshot || {};
const soldSeries = inventoryStatus?.activity_sold_units_series;

// ✅ snapshot sold% (same as widgets)
const snapSoldPct =
  snap?.sold_pct !== null && snap?.sold_pct !== undefined
    ? toNum(snap.sold_pct)
    : toNum(snap?.total) > 0 && toNum(snap?.sold) > 0
      ? (toNum(snap.sold) / toNum(snap.total)) * 100
      : null;

tiles.push({
  id: "inventory_status",
  title: "Inventory Track",
  value: formatCompact(snap?.total ?? 0),
  // ✅ show SOLD % here (matches widgets)
  delta_pct: snapSoldPct,
  compare_label: "sold %",
  kind: "bar_compare",
  // back side can still show trend chart if series exists
  series: soldSeries
    ? {
        labels: safeArr(soldSeries?.labels),
        current: safeArr(soldSeries?.series?.[0]?.data),
        previous: safeArr(soldSeries?.series?.[1]?.data),
        current_label: soldSeries?.series?.[0]?.name || "Current",
        previous_label: soldSeries?.series?.[1]?.name || "Previous",
      }
    : null,
});


    const top = charts?.top_channel_partners;
    const topRows = safeArr(top?.rows).map((r) => ({
      name: cleanPartnerName(
        r?.name ||
          r?.cp_name ||
          r?.label ||
          r?.["CP Name"] ||
          r?.["CP"] ||
          "Partner",
      ),
      value: toNum(
        r?.cur ??
          r?.leads?.current ??
          r?.leads_cur ??
          r?.visits?.current ??
          r?.bookings?.current ??
          0,
      ),
    }));

    tiles.push({
      id: "top_channel_partners",
      title: "Top Channel Partners",
      value: top?.total ?? topRows.length ?? 0,
      delta_pct: null,
      compare_label: "rank",
      kind: "rank_hbar",
      rank: topRows,
      span: 2,
    });

    return tiles;
  }, [charts, dash, dateRange]);

  // Site Summary
  const siteSummary = dash?.site_summary || {};
  const siteSummaryRows = safeArr(siteSummary?.rows);
  const ssSeries = dash?.site_summary_series || {};
  const ssLabels = safeArr(ssSeries?.labels);
  const ssSeriesRows = safeArr(ssSeries?.rows);

  // Inventory widgets
  const invSnap =
    dash?.inventory_snapshot || charts?.inventory_status?.snapshot || {};
  const invTotals = useMemo(() => {
    return {
      total: toNum(invSnap?.total),
      available: toNum(invSnap?.available),
      booked: toNum(invSnap?.booked),
      blocked: toNum(invSnap?.blocked),
      sold_pct: invSnap?.sold_pct,
    };
  }, [invSnap]);

  const isLoading = loadingScope || loadingDash;

  // KPI split: 7 top, 6 bottom
  const kpiTop = kpis.slice(0, 7);
  const kpiBottom = kpis.slice(7, 13);

  return (
    <div className="sir-dashboard">
      <div className="app-root">
        {/* HEADER */}
        <header className="app-header">
          <div
            className="filters-row"
            style={{
              flexWrap: "nowrap", // ✅ one line
              overflowX: "auto", // if screen smaller, still one line
              whiteSpace: "nowrap",
              gap: 12,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "var(--muted)",
                fontWeight: 800,
              }}
            >
              <span style={{ fontSize: 16 }}>⎇</span>
            </span>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ minWidth: 120 }}
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
                  style={{ minWidth: 150 }}
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{ minWidth: 150 }}
                />
              </>
            ) : null}

            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="ALL">All Sites (Group View)</option>
              {sites.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>

            <select
              value={tower}
              onChange={(e) => setTower(e.target.value)}
              style={{ minWidth: 150 }}
            >
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
              style={{ minWidth: 150 }}
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
              style={{ minWidth: 170 }}
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
              style={{ minWidth: 190 }}
            >
              <option value="ALL">All Channel Partners</option>
              {cps.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.label || cp.name || `CP #${cp.id}`}
                </option>
              ))}
            </select>

            <select
              value={salesUserId}
              onChange={(e) => setSalesUserId(e.target.value)}
              style={{ minWidth: 170 }}
            >
              <option value="ALL">All Sales People</option>
              {salesPeople.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.label || sp.name || `User #${sp.id}`}
                </option>
              ))}
            </select>

            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              style={{ minWidth: 170 }}
            >
              <option value="ALL">All Campaigns</option>
              {campaigns?.length ? (
                campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || c.name || `Campaign #${c.id}`}
                  </option>
                ))
              ) : (
                <option value="ALL">No campaigns</option>
              )}
            </select>

            <button
              className="btn-primary"
              type="button"
              onClick={fetchDashboard}
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
            <div className="band-subtitle">Real-time performance metrics</div>

            {/* Row 1: 7 */}
            <div
              className="kpi-grid"
              style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
            >
              {kpiTop.length ? (
                kpiTop.map((k) => (
                  <KPICard
                    key={k.id || k.title}
                    title={k.title}
                    value={k.value}
                    sub={k.sub}
                  />
                ))
              ) : (
                <KPICard title="No KPIs" value="N/A" sub="API returned empty" />
              )}
            </div>

            {/* Row 2: 6 */}
            {kpiBottom.length ? (
              <div
                className="kpi-grid"
                style={{
                  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                  marginTop: 16,
                }}
              >
                {kpiBottom.map((k) => (
                  <KPICard
                    key={k.id || k.title}
                    title={k.title}
                    value={k.value}
                    sub={k.sub}
                  />
                ))}
              </div>
            ) : null}
          </section>

          {/* Charts */}
          <section className="band" ref={secChartsRef}>
            <div className="band-title">Overview Charts</div>

            <div className="charts-grid">
              <ChartWithOptions
                chartId="funnel"
                title="Lead Pipeline Funnel"
                subtitle=""
                data={chartFunnel}
                categoryKey="stage"
                series={[{ key: "count", name: "Count" }]}
                defaultType="bar"
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />

              <ChartWithOptions
                chartId="source"
                title="Source-wise Leads & Bookings"
                subtitle=""
                data={chartSource}
                categoryKey="source"
                series={[
                  { key: "leads", name: "Leads" },
                  { key: "bookings", name: "Bookings" },
                ]}
                defaultType="bar"
                yTickFormatter={(v) => formatCompact(v)}
                valueFormatter={(v) => formatCompact(v)}
              />

              <ChartWithOptions
                chartId="conversion"
                title="Site-wise Conversion Ratios"
                subtitle=""
                data={chartSiteConv}
                categoryKey="site"
                series={[
                  { key: "lead_to_booking_pct", name: "Lead→Booking %" },
                  { key: "lead_to_registration_pct", name: "Lead→Reg %" },
                ]}
                defaultType="line"
                yTickFormatter={(v) => `${toNum(v).toFixed(1)}%`}
                valueFormatter={(v) => `${toNum(v).toFixed(1)}%`}
              />
            </div>
          </section>

          {/* Site Summary */}
          <section className="band">
            <div className="band-head-row">
              <div>
                <div className="band-title">Site Summary</div>
                <div className="band-subtitle">
                  Click a card to flip and view details
                </div>
              </div>

              <div className="period-toggle">
                {["Day", "Week", "Month", "Year"].map((x) => (
                  <button
                    key={x}
                    className={upper(dateRange) === upper(x) ? "active" : ""}
                    type="button"
                    onClick={() => setDateRange(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div className="site-summary-grid ss2-grid">
              {siteSummaryRows.length ? (
                siteSummaryRows.slice(0, 12).map((r, idx) => {
                  const pid = r?.project_id;
                  const seriesRow =
                    ssSeriesRows.find((sr) => sr?.project_id === pid) || null;

                  const variant = ["green", "blue", "purple"][idx % 3];
                  const start = idx % 3 === 1 ? "metrics" : "trend";

                  return (
                    <SiteSummaryCardV2
                      key={pid || idx}
                      row={r}
                      labels={ssLabels}
                      seriesRow={seriesRow}
                      variant={variant}
                      start={start}
                    />
                  );
                })
              ) : (
                <div className="mini-empty">No site summary data</div>
              )}
            </div>
          </section>

          {/* Site Analytics */}
          <section className="band">
            <div className="band-title">Site Analytics</div>
            <div className="band-subtitle">
              Click a card to flip and view details
            </div>

            <div className="quick-tiles-grid">
              {quickTiles.map((t) => (
                <FlipStatCard key={t.id} tile={t} />
              ))}
            </div>
          </section>

          {/* Inventory Widgets */}
          <section className="band" ref={secInvWidgetsRef}>
            <div className="band-title">Inventory Widgets</div>

            <div className="kpi-grid kpi-grid-compact">
              <KPICard
                title="Total Inventory Units"
                value={formatCompact(invTotals.total)}
                sub="Snapshot"
              />
              <KPICard
                title="Available Units"
                value={formatCompact(invTotals.available)}
                sub="Snapshot"
              />
              <KPICard
                title="Booked Units"
                value={formatCompact(invTotals.booked)}
                sub="Snapshot"
              />
              <KPICard
                title="Blocked Units"
                value={formatCompact(invTotals.blocked)}
                sub="Snapshot"
              />
              <KPICard
                title="Sold %"
                value={
                  invTotals.sold_pct === null ||
                  invTotals.sold_pct === undefined
                    ? "N/A"
                    : `${toNum(invTotals.sold_pct).toFixed(1)}%`
                }
                sub="Snapshot"
              />
            </div>
          </section>

          {/* Inventory Table (optional) */}
          <section
            className="band"
            ref={secInvTableRef}
            style={{ display: "none" }}
          />
        </main>
      </div>
    </div>
  );
}
