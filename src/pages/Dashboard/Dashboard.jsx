// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

/* =========================================================
   BlueHeatmap (screenshot style + range filter)
   ========================================================= */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const findLastNonZeroIndex = (rows, labelsLen) => {
  let last = -1;
  for (let i = 0; i < labelsLen; i++) {
    let any = false;
    for (const r of rows) {
      const v = r?.values?.[i];
      if (typeof v === "number" && v > 0) {
        any = true;
        break;
      }
    }
    if (any) last = i;
  }
  return last === -1 ? labelsLen - 1 : last;
};

// Higher value => darker blue (like screenshot)
const getBlueShade = (value, maxValue) => {
  if (!(typeof value === "number") || value <= 0) return "#ffffff";

  // light -> dark
  const light = { r: 59, g: 130, b: 246 }; // #3b82f6
  const dark = { r: 16, g: 25, b: 150 }; // #101996
  const ratio = maxValue > 0 ? clamp(value / maxValue, 0, 1) : 0;

  const r = Math.round(light.r + ratio * (dark.r - light.r));
  const g = Math.round(light.g + ratio * (dark.g - light.g));
  const b = Math.round(light.b + ratio * (dark.b - light.b));
  return `rgb(${r}, ${g}, ${b})`;
};

const BlueHeatmap = ({
  labels = [],
  rows = [],
  decimals = 1,
  showZeros = false,
  titleRight = "Range",
}) => {
  const [mode, setMode] = useState("AUTO"); // AUTO | ALL | LAST6 | LAST12 | CUSTOM
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(
    Math.max(0, (labels?.length || 1) - 1),
  );

  useEffect(() => {
    setCustomStart(0);
    setCustomEnd(Math.max(0, (labels?.length || 1) - 1));
  }, [labels?.length]);

  const labelsLen = labels?.length || 0;
  const safeRows = Array.isArray(rows) ? rows : [];

  const lastNonZero = useMemo(
    () => findLastNonZeroIndex(safeRows, labelsLen),
    [safeRows, labelsLen],
  );

  const range = useMemo(() => {
    if (labelsLen === 0) return { start: 0, end: -1 };

    if (mode === "ALL") return { start: 0, end: labelsLen - 1 };

    if (mode === "AUTO") return { start: 0, end: lastNonZero };

    if (mode === "LAST6") {
      const end = lastNonZero;
      return { start: Math.max(0, end - 5), end };
    }

    if (mode === "LAST12") {
      const end = lastNonZero;
      return { start: Math.max(0, end - 11), end };
    }

    // CUSTOM
    const s = clamp(customStart, 0, labelsLen - 1);
    const e = clamp(customEnd, 0, labelsLen - 1);
    return { start: Math.min(s, e), end: Math.max(s, e) };
  }, [mode, labelsLen, lastNonZero, customStart, customEnd]);

  const visibleLabels = useMemo(
    () => labels.slice(range.start, range.end + 1),
    [labels, range.start, range.end],
  );

  const visibleRows = useMemo(() => {
    return safeRows.map((r) => ({
      ...r,
      values: (r.values || []).slice(range.start, range.end + 1),
    }));
  }, [safeRows, range.start, range.end]);

  const maxValue = useMemo(() => {
    let mx = 0;
    for (const r of visibleRows) {
      for (const v of r.values || []) {
        if (typeof v === "number" && v > mx) mx = v;
      }
    }
    return mx || 1;
  }, [visibleRows]);

  return (
    <div className="blue-heatmap-wrap">
      <div className="blue-heatmap-controls">
        <div className="blue-heatmap-left" />
        <div className="blue-heatmap-right">
          <span className="bh-label">{titleRight}</span>
          <select
            className="bh-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="AUTO">Auto (trim empty)</option>
            <option value="ALL">All</option>
            <option value="LAST6">Last 6</option>
            <option value="LAST12">Last 12</option>
            <option value="CUSTOM">Custom</option>
          </select>

          {mode === "CUSTOM" && labelsLen > 0 && (
            <div className="bh-custom">
              <select
                className="bh-select"
                value={customStart}
                onChange={(e) => setCustomStart(Number(e.target.value))}
              >
                {labels.map((lb, i) => (
                  <option key={`s-${lb}-${i}`} value={i}>
                    {lb}
                  </option>
                ))}
              </select>

              <span className="bh-to">to</span>

              <select
                className="bh-select"
                value={customEnd}
                onChange={(e) => setCustomEnd(Number(e.target.value))}
              >
                {labels.map((lb, i) => (
                  <option key={`e-${lb}-${i}`} value={i}>
                    {lb}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="blue-heatmap-scroll">
        <table className="blue-heatmap">
          <thead>
            <tr>
              <th className="bh-corner" />
              {visibleLabels.map((label, idx) => (
                <th key={`${label}-${idx}`} className="bh-th">
                  <div className="bh-colhead">{label}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                <th className="bh-rowhead">{row.label}</th>

                {visibleLabels.map((_, i) => {
                  const v = row?.values?.[i];
                  const hasValue =
                    typeof v === "number" && (showZeros ? v >= 0 : v > 0);

                  const bg = hasValue ? getBlueShade(v, maxValue) : "#ffffff";

                  return (
                    <td key={`${row.id}-${i}`} className="bh-td">
                      <div
                        className={`bh-cell ${hasValue ? "filled" : "empty"}`}
                        style={{ backgroundColor: bg }}
                      >
                        {hasValue
                          ? decimals > 0
                            ? Number(v).toFixed(decimals)
                            : String(Math.round(Number(v)))
                          : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================================
   Main Dashboard
   ========================================================= */
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [scopeProjects, setScopeProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [filters, setFilters] = useState({
    all: "ALL",
    sites: "",
    towers: "",
    floors: "",
    config: "",
    leadSources: "",
    channelPartners: "",
    salesPeople: "",
    campaigns: "",
  });

  const [periods, setPeriods] = useState({
    siteVisit: "Weekly",
    reVisit: "Monthly",
    uniqueCP: "Yearly",
    inventoryTracking: "Weekly",
    siteSummary: "Month",
  });

  const [channelPartnerFilter, setChannelPartnerFilter] = useState({
    mode: "TOP10", // TOP10 | LAST10 | CUSTOM
    order: "DESC", // ASC | DESC
    count: 10,
  });

  const [unitConfigs, setUnitConfigs] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [channelPartners, setChannelPartners] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: "week",
        bucket_mode: "calendar",
        year: 2026,
      };
      if (selectedProjectId) params.project_id = Number(selectedProjectId);

const response = await axiosInstance.get(
  "dashboard/vasi/admin/presales-exec/",
  {
    params,
  },
);


      const payload = response.data?.data ?? response.data;
      if (response.data?.success === false)
        throw new Error("API returned unsuccessful response");
      setData(payload);
    } catch (err) {
      setError(err?.message || "Unknown error");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadScope = async () => {
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        const projects = normalizeScopeProjects(res.data || {});
        setScopeProjects(projects);
        if (!selectedProjectId && projects.length) {
          const firstId = String(projects[0].id);
          setSelectedProjectId(firstId);
          setFilters((prev) => ({ ...prev, sites: firstId }));
        }
      } catch (err) {
        console.error("Scope Error:", err);
      }
    };
    loadScope();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setUnitConfigs([]);
      setLeadSources([]);
      setSalesUsers([]);
      setChannelPartners([]);
      return;
    }

    let isActive = true;

    const loadMasters = async () => {
      try {
        const res = await axiosInstance.get("/leadManagement/v2/leads/masters/", {
          params: { project_id: selectedProjectId },
        });
        const payload = res.data || {};
        if (!isActive) return;
        setUnitConfigs(payload.unit_configurations || payload.unit_configs || []);
        setLeadSources(payload.sources || payload.lead_sources || []);
        setSalesUsers(
          payload.assign_users || payload.assigned_users || payload.sales_users || [],
        );
      } catch (err) {
        if (!isActive) return;
        console.error("Lead masters error:", err);
        setUnitConfigs([]);
        setLeadSources([]);
        setSalesUsers([]);
      }
    };

    const loadChannelPartners = async () => {
      try {
        const res = await axiosInstance.get("/channel/partners/by-project/", {
          params: { project_id: selectedProjectId },
        });
        const list =
          res.data?.results || res.data?.data || res.data?.rows || res.data || [];
        if (!isActive) return;
        setChannelPartners(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isActive) return;
        console.error("Channel partner error:", err);
        setChannelPartners([]);
      }
    };

    loadMasters();
    loadChannelPartners();

    return () => {
      isActive = false;
    };
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () =>
      scopeProjects.find((p) => String(p.id) === String(selectedProjectId)) ||
      null,
    [scopeProjects, selectedProjectId],
  );

  const availableTowers = useMemo(
    () => (selectedProject?.towers ? selectedProject.towers : []),
    [selectedProject],
  );

  const selectedTower = useMemo(
    () =>
      availableTowers.find((t) => String(t.id) === String(filters.towers)) || null,
    [availableTowers, filters.towers],
  );

  const availableFloors = useMemo(() => {
    if (!selectedProject) return [];
    if (selectedTower) return selectedTower.floors || [];
    return (selectedProject.towers || []).flatMap((t) => t.floors || []);
  }, [selectedProject, selectedTower]);

  useEffect(() => {
    if (!scopeProjects.length && !selectedProjectId) {
      fetchData();
      return;
    }
    if (selectedProjectId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, scopeProjects.length]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sites: selectedProjectId ? String(selectedProjectId) : "",
      towers: "",
      floors: "",
    }));
  }, [selectedProjectId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "charts", label: "Charts", icon: "📈" },
    { id: "leads", label: "Leads", icon: "👥" },
    { id: "config", label: "Config & Source", icon: "⚙️" },
    { id: "channel", label: "Channel Partners", icon: "🤝" },
    { id: "sales", label: "Sales Team", icon: "💼" },
    { id: "inventory-widgets", label: "Inventory Widgets", icon: "📦" },
    { id: "inventory-table", label: "Inventory Table", icon: "📋" },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-loading">
        <p>No data available</p>
      </div>
    );
  }

  const siteSummaryRows = Array.isArray(data?.site_summary?.rows)
    ? data.site_summary.rows
    : [];
  const ssSeries = data?.site_summary_series || {};
  const ssLabels = Array.isArray(ssSeries?.labels) ? ssSeries.labels : [];
  const ssSeriesRows = Array.isArray(ssSeries?.rows) ? ssSeries.rows : [];

  return (
    <div className="dashboard">
      {/* Header Tabs */}
      <div className="dashboard-header">
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        {/* <div className="user-profile">
          <div className="user-avatar-group">
            <div className="user-avatar">👤</div>
            <div className="user-avatar">👤</div>
          </div>
        </div> */}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-left">
          <span className="filter-icon">⚙️</span>
          <span className="filter-label">Filters:</span>

          <select
            className="filter-dropdown"
            value={filters.all}
            onChange={(e) => setFilters({ ...filters, all: e.target.value })}
          >
            <option>ALL</option>
          </select>

          <select
            className="filter-dropdown"
            value={filters.sites}
            onChange={(e) => {
              const value = e.target.value;
              setFilters((prev) => ({
                ...prev,
                sites: value,
                towers: "",
                floors: "",
              }));
              setSelectedProjectId(value);
            }}
          >
            <option value="">All Sites (Group View)</option>
            {scopeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `Project ${p.id}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.towers}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                towers: e.target.value,
                floors: "",
              }))
            }
          >
            <option value="">All Towers</option>
            {availableTowers.map((tower, idx) => (
              <option key={tower.id ?? idx} value={tower.id}>
                {tower.name || `Tower ${idx + 1}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.config}
            onChange={(e) => setFilters({ ...filters, config: e.target.value })}
          >
            <option value="">All Config</option>
            {unitConfigs.map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                {cfg.name || cfg.code || `Config ${cfg.id}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.leadSources}
            onChange={(e) =>
              setFilters({ ...filters, leadSources: e.target.value })
            }
          >
            <option value="">All Lead Sources</option>
            {leadSources.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name || src.label || `Source ${src.id}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.channelPartners}
            onChange={(e) =>
              setFilters({ ...filters, channelPartners: e.target.value })
            }
          >
            <option value="">All Channel Partners</option>
            {channelPartners.map((cp, idx) => (
              <option key={cp.id ?? idx} value={cp.id ?? cp.partner_id ?? cp.cp_id}>
                {cp.full_name ||
                  cp.company_name ||
                  cp.name ||
                  cp.partner_name ||
                  cp.cp_name ||
                  `Partner ${idx + 1}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.salesPeople}
            onChange={(e) =>
              setFilters({ ...filters, salesPeople: e.target.value })
            }
          >
            <option value="">All Sales People</option>
            {salesUsers.map((user, idx) => (
              <option key={user.id ?? idx} value={user.id}>
                {user.name || user.username || `Sales ${idx + 1}`}
              </option>
            ))}
          </select>

          <select
            className="filter-dropdown"
            value={filters.campaigns}
            onChange={(e) =>
              setFilters({ ...filters, campaigns: e.target.value })
            }
          >
            <option value="">All Campaigns</option>
          </select>
        </div>

        <button className="apply-button" onClick={fetchData}>
          <span>✨</span> Apply
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* 1. CURRENT WIDGETS (Base KPI Cards) */}
        {activeTab === "overview" && Array.isArray(data?.widgets) && (
          <div className="kpi-cards-row">
            {getBaseWidgets(data.widgets)
              .slice(0, 10)
              .map((widget, idx) => (
                <KPICard
                  key={widget.id || idx}
                  title={widget.title || `KPI ${idx + 1}`}
                  value={formatWidgetValue(widget)}
                  color={getKPIColor(idx)}
                />
              ))}
          </div>
        )}

        {/* 2. SITE VISIT (Heatmap + Chart) */}
        {(activeTab === "overview" || activeTab === "charts") &&
          data?.site_visit_obj?.supported &&
          data.site_visit_obj?.labels?.length > 0 &&
          data.site_visit_obj?.current?.categories && (
            <div className="chart-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Site Visit</h2>
                  <p className="section-subtitle">
                    Heatmap + chart (trim range from dropdown)
                  </p>
                </div>
                <select
                  className="period-selector"
                  value={periods.siteVisit}
                  onChange={(e) =>
                    setPeriods({ ...periods, siteVisit: e.target.value })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              <BlueHeatmap
                labels={data.site_visit_obj.labels || []}
                rows={Object.entries(
                  data.site_visit_obj.current.categories,
                ).map(([key, cat]) => ({
                  id: `sv-${key}`,
                  label: getCategoryLabel(key),
                  values: cat?.percent || [],
                }))}
                decimals={1}
                titleRight="Range"
              />

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={transformSiteVisitData(data.site_visit_obj)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    {Object.keys(data.site_visit_obj.current.categories).map(
                      (cat) => (
                        <Line
                          key={cat}
                          type="monotone"
                          dataKey={cat}
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={renderMultiColorDot}
                          activeDot={renderActiveDot}
                          name={getCategoryLabel(cat)}
                        />
                      ),
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* 3. RE-VISIT (Heatmap + Chart) */}
        {(activeTab === "overview" || activeTab === "charts") &&
          data?.revisit_obj?.supported &&
          data.revisit_obj?.labels?.length > 0 &&
          data.revisit_obj?.current && (
            <div className="chart-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Re-Visit</h2>
                  <p className="section-subtitle">Direct vs CP</p>
                </div>
                <select
                  className="period-selector"
                  value={periods.reVisit}
                  onChange={(e) =>
                    setPeriods({ ...periods, reVisit: e.target.value })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              <BlueHeatmap
                labels={data.revisit_obj.labels || []}
                rows={[
                  {
                    id: "rv-direct",
                    label: "Direct",
                    values:
                      data.revisit_obj.current?.direct_revisit?.percent || [],
                  },
                  {
                    id: "rv-cp",
                    label: "CP",
                    values: data.revisit_obj.current?.cp_revisit?.percent || [],
                  },
                ]}
                decimals={1}
                titleRight="Range"
              />

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={transformRevisitData(data.revisit_obj)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="direct"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={renderMultiColorDot}
                      activeDot={renderActiveDot}
                      name="Direct"
                    />
                    <Line
                      type="monotone"
                      dataKey="cp"
                      stroke="#1d4ed8"
                      strokeWidth={3}
                      dot={renderMultiColorDot}
                      activeDot={renderActiveDot}
                      name="CP"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* 4. UNIQUE CP MEETINGS (Heatmap + Chart) */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "channel") &&
          data?.active_channel_partners_series?.supported &&
          data.active_channel_partners_series?.labels?.length > 0 && (
            <div className="chart-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Unique CP Meetings</h2>
                  <p className="section-subtitle">Current vs Previous series</p>
                </div>
                <select
                  className="period-selector"
                  value={periods.uniqueCP}
                  onChange={(e) =>
                    setPeriods({ ...periods, uniqueCP: e.target.value })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              <BlueHeatmap
                labels={data.active_channel_partners_series.labels || []}
                rows={(data.active_channel_partners_series.series || []).map(
                  (s) => ({
                    id: `ucp-${s.name}`,
                    label: s.name,
                    values: s.data || [],
                  }),
                )}
                decimals={0}
                titleRight="Range"
              />

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={transformSeriesData(
                      data.active_channel_partners_series,
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    {(data.active_channel_partners_series.series || []).map(
                      (serie, idx) => (
                        <Line
                          key={serie.name}
                          type="monotone"
                          dataKey={serie.name.toLowerCase()}
                          stroke={idx === 0 ? "#2563eb" : "#1d4ed8"}
                          strokeWidth={3}
                          dot={renderMultiColorDot}
                          activeDot={renderActiveDot}
                          name={serie.name}
                        />
                      ),
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* 5. INVENTORY TRACKING (Heatmap + Chart) */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "inventory-widgets") &&
          data?.inventory_tracking_obj?.supported &&
          data.inventory_tracking_obj?.labels?.length > 0 && (
            <div className="chart-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Inventory Tracking</h2>
                  <p className="section-subtitle">
                    Booked / Pipeline / Available (heatmap + chart)
                  </p>
                </div>
                <select
                  className="period-selector"
                  value={periods.inventoryTracking}
                  onChange={(e) =>
                    setPeriods({
                      ...periods,
                      inventoryTracking: e.target.value,
                    })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              <BlueHeatmap
                labels={data.inventory_tracking_obj.labels || []}
                rows={["booked", "pipeline", "available"].map((k) => {
                  const obj = data.inventory_tracking_obj.current?.[k] || {};
                  return {
                    id: `inv-${k}`,
                    label: k.charAt(0).toUpperCase() + k.slice(1),
                    values: obj.percent || obj.count || [],
                  };
                })}
                decimals={1}
                titleRight="Range"
              />

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={transformInventoryData(data.inventory_tracking_obj)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="booked"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={renderMultiColorDot}
                      activeDot={renderActiveDot}
                      name="Booked"
                    />
                    <Line
                      type="monotone"
                      dataKey="pipeline"
                      stroke="#D76767"
                      strokeWidth={3}
                      dot={renderMultiColorDot}
                      activeDot={renderActiveDot}
                      name="Pipeline"
                    />
                    <Line
                      type="monotone"
                      dataKey="available"
                      stroke="#22C75E"
                      strokeWidth={3}
                      dot={renderMultiColorDot}
                      activeDot={renderActiveDot}
                      name="Available"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* 6. CHANNEL PARTNER ACTIVE (Bar) */}
        {(activeTab === "overview" || activeTab === "channel") && (
          <BarGraphSection
            title="Channel Partner Active"
            data={toBarData(
              filterChannelPartnerRows(
                data?.active_channel_partners_overall?.rows || [],
                channelPartnerFilter,
              ),
            )}
            xKey="name"
            yKey="value"
            controls={
              <div className="bar-chart-controls">
                <select
                  className="period-selector bar-control"
                  value={channelPartnerFilter.mode}
                  onChange={(e) =>
                    setChannelPartnerFilter((prev) => ({
                      ...prev,
                      mode: e.target.value,
                    }))
                  }
                >
                  <option value="TOP10">Top 10</option>
                  <option value="LAST10">Last 10</option>
                  <option value="CUSTOM">Custom</option>
                </select>

                <select
                  className="period-selector bar-control"
                  value={channelPartnerFilter.order}
                  onChange={(e) =>
                    setChannelPartnerFilter((prev) => ({
                      ...prev,
                      order: e.target.value,
                    }))
                  }
                >
                  <option value="DESC">Desc</option>
                  <option value="ASC">Asc</option>
                </select>

                {channelPartnerFilter.mode === "CUSTOM" && (
                  <input
                    className="bar-control bar-control-input"
                    type="number"
                    min={1}
                    max={99}
                    value={channelPartnerFilter.count}
                    onChange={(e) =>
                      setChannelPartnerFilter((prev) => ({
                        ...prev,
                        count: Math.max(1, Number(e.target.value || 1)),
                      }))
                    }
                  />
                )}
              </div>
            }
          />
        )}

        {/* 7. TOP 5 CPS ACTIVE & RANKING (Bar) */}
        {(activeTab === "overview" || activeTab === "channel") && (
          <BarGraphSection
            title="Top 5 CPs Active and Ranking Based on Client Visited"
            data={toBarData(data?.top_channel_partners?.rows || [])}
            xKey="name"
            yKey="value"
          />
        )}

        {/* 8. DEAL WIDGETS */}
        {activeTab === "overview" &&
          Array.isArray(data?.widgets) &&
          getDealWidgets(data.widgets).length > 0 && (
            <div className="deal-widgets-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Deal Metrics</h2>
                  <p className="section-subtitle">
                    Win rate, close rate, revenue, and pipeline metrics
                  </p>
                </div>
              </div>

              <div className="kpi-cards-row deal-widgets">
                {getDealWidgets(data.widgets).map((widget, idx) => (
                  <KPICard
                    key={widget.id || idx}
                    title={widget.title || `Metric ${idx + 1}`}
                    value={formatWidgetValue(widget)}
                    color={getKPIColor(idx)}
                  />
                ))}
              </div>
            </div>
          )}

        {/* 9. SITE SUMMARY CARDS */}
        {activeTab === "overview" && siteSummaryRows.length > 0 && (
          <div className="site-summary-section">
            <div className="section-header-clean">
              <div>
                <h2 className="section-title">Site Summary</h2>
                <p className="section-subtitle">
                  Click a card to flip and view metrics
                </p>
              </div>

              <div className="site-summary-controls">
                <div className="period-tabs">
                  <button className="period-tab">Day</button>
                  <button className="period-tab active">Week</button>
                  <button className="period-tab">Month</button>
                  <button className="period-tab">Year</button>
                </div>
                <div className="site-summary-project">
                  <span className="site-summary-label">Project</span>
                  <select
                    className="site-summary-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {scopeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || `Project ${project.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              className={`site-summary-grid ss2-grid ${
                siteSummaryRows.length === 1 ? "ss2-single" : ""
              }`}
            >
              {siteSummaryRows.map((site, idx) => {
                const pid = site?.project_id;
                const seriesRow =
                  ssSeriesRows.find((sr) => sr?.project_id === pid) || null;
                const variant = ["green", "blue", "purple"][idx % 3];

                return (
                  <SiteSummaryCardV2
                    key={`${pid || idx}`}
                    row={site}
                    labels={ssLabels}
                    seriesRow={seriesRow}
                    variant={variant}
                    start="trend"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 10. OVERVIEW CHARTS */}
        {activeTab === "overview" && (
          <div className="overview-charts-section">
            <div className="section-header-clean">
              <div>
                <h2 className="section-title">Overview Charts</h2>
                <p className="section-subtitle">
                  Toggle chart type (line, bar, area, pie)
                </p>
              </div>
            </div>

            <div className="overview-charts-grid">
              <OverviewChartCard
                title="Lead Pipeline Funnel"
                subtitle="Leads → Qualified → Visits → Bookings → Registrations"
                data={transformLeadPipelineData(data?.lead_pipeline_funnel)}
                series={[{ key: "value", label: "Count", color: "#2563eb" }]}
                pieKey="value"
                defaultType="pie"
              />
              <OverviewChartCard
                title="Source Wise Leads vs Bookings"
                subtitle="Lead sources"
                data={transformSourceWiseData(data?.source_wise_leads_bookings)}
                series={[
                  { key: "leads", label: "Leads", color: "#2563eb" },
                  { key: "bookings", label: "Bookings", color: "#1d4ed8" },
                ]}
                pieKey="leads"
                defaultType="area"
              />
              <OverviewChartCard
                title="Site Wise Conversion Ratios"
                subtitle="Leads, qualified, visits, bookings, registrations"
                data={transformSiteConversionData(
                  data?.site_wise_conversion_ratios,
                )}
                series={[
                  { key: "leads", label: "Leads", color: "#2563eb" },
                  { key: "qualified", label: "Qualified", color: "#1d4ed8" },
                  { key: "visits", label: "Visits", color: "#0b5ed7" },
                  { key: "bookings", label: "Bookings", color: "#16a34a" },
                  {
                    key: "registrations",
                    label: "Registrations",
                    color: "#7c3aed",
                  },
                ]}
                pieKey="leads"
                defaultType="line"
              />
            </div>
          </div>
        )}

        {/* 11. CONFIGURATION MATRIX CARDS */}
        {(activeTab === "overview" || activeTab === "config") &&
          Array.isArray(data?.config_matrix?.rows) &&
          data.config_matrix.rows.length > 0 && (
            <div className="chart-section config-matrix-section">
              <div className="section-header-clean">
                <div>
                  <h2 className="section-title">Configuration Matrix</h2>
                  <p className="section-subtitle">Performance by unit type</p>
                </div>
              </div>

              <div className="config-cards-grid">
                {data.config_matrix.rows.map((config, idx) => (
                  <ConfigCard
                    key={config.configuration_id ?? idx}
                    title={config.configuration_name || `Config ${idx + 1}`}
                    subtitle="Inventory + Leads + Bookings"
                    metrics={[
                      {
                        label: "Inventory Total",
                        value: String(config.inventory?.total ?? 0),
                        icon: "📦",
                      },
                      {
                        label: "Available",
                        value: String(config.inventory?.available ?? 0),
                        icon: "✅",
                      },
                      {
                        label: "Leads",
                        value: String(config.leads?.current ?? 0),
                        icon: "👥",
                      },
                      {
                        label: "Bookings",
                        value: String(config.bookings?.current ?? 0),
                        icon: "📋",
                      },
                    ]}
                    metricsBack={[
                      {
                        label: "Inventory Total",
                        value: String(config.inventory?.total ?? 0),
                        icon: "📦",
                      },
                      {
                        label: "Booked",
                        value: String(config.inventory?.booked ?? 0),
                        icon: "🧾",
                      },
                      {
                        label: "Leads (Current)",
                        value: String(config.leads?.current ?? 0),
                        icon: "👥",
                      },
                      {
                        label: "Bookings (Current)",
                        value: String(config.bookings?.current ?? 0),
                        icon: "📋",
                      },
                    ]}
                    conversion={{
                      label: "Lead→Book",
                      value: `${Number(config.lead_to_booking_pct ?? 0).toFixed(1)}%`,
                      label2: "Sold %",
                      value2: config.inventory?.total
                        ? `${(
                            (Number(config.inventory?.booked ?? 0) /
                              Number(config.inventory?.total || 1)) *
                            100
                          ).toFixed(1)}%`
                        : "0.0%",
                    }}
                    color={getConfigCardColor(idx)}
                  />
                ))}
              </div>
            </div>
          )}

        {/* 12. SALES TEAM BAR */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "sales") &&
          data?.sales_team_performance?.supported &&
          Array.isArray(data.sales_team_performance?.rows) &&
          data.sales_team_performance.rows.length > 0 && (
            <BarGraphSection
              title="Sales Team"
              subtitle="Leads by sales user"
              data={data.sales_team_performance.rows.map((row, idx) => ({
                name: row.sales_user_name || `Sales ${idx + 1}`,
                value: Number(row.leads?.current || 0),
              }))}
              xKey="name"
              yKey="value"
            />
          )}
      </div>
    </div>
  );
};

/* =========================================================
   Small components
   ========================================================= */
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

const pickAny = (obj, keys, fallback = null) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return fallback;
};

const SS_ACCENT = {
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

const KPICard = ({ title, value, color }) => (
  <div className="kpi-card" style={{ backgroundColor: color }}>
    <div className="kpi-card-title">{title}</div>
    <div className="kpi-card-value">{value}</div>
  </div>
);

const SiteCard = ({ title, subtitle, percentage, metrics, color }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`site-card site-card-flip ${flipped ? "flipped" : ""}`}
      style={{ backgroundColor: color }}
      onClick={() => setFlipped((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setFlipped((prev) => !prev);
      }}
    >
      <div className="site-card-inner">
        <div className="site-card-face site-card-front">
          <div className="site-card-header">
            <h3>{title}</h3>
            <span className="site-percentage">{percentage}</span>
          </div>
          <p className="site-subtitle">{subtitle}</p>
          <div className="site-card-hint">Click to view chart</div>
        </div>

        <div className="site-card-face site-card-back">
          <div className="site-card-header">
            <h3>{title}</h3>
            <span className="site-percentage">{percentage}</span>
          </div>
          <p className="site-subtitle">{subtitle}</p>

          <div className="site-metrics">
            {metrics.map((metric, idx) => (
              <div key={idx} className="site-metric">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-info">
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="view-details-btn">Click to view chart</button>
        </div>
      </div>
    </div>
  );
};

const ConfigCard = ({
  title,
  subtitle,
  metrics,
  metricsBack = metrics,
  conversion,
  color,
}) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`config-card config-card-flip ${flipped ? "flipped" : ""}`}
      style={{ backgroundColor: color }}
      onClick={() => setFlipped((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setFlipped((prev) => !prev);
      }}
    >
      <div className="config-card-inner">
        <div className="config-card-face config-card-front">
          <div className="config-card-header">
            <h3>{title}</h3>
          </div>
          <p className="config-subtitle">{subtitle}</p>

          <div className="config-metrics-grid">
            {metrics.map((metric, idx) => (
              <div key={idx} className="config-metric-item">
                <div className="config-icon">{metric.icon}</div>
                <div className="config-metric-info">
                  <div className="config-metric-label">{metric.label}</div>
                  <div className="config-metric-value">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="config-conversion-row">
            <div className="conversion-item">
              <span className="conversion-icon">📊</span>
              <div className="conversion-info">
                <span className="conversion-label">{conversion.label}</span>
                <span className="conversion-value">{conversion.value}</span>
              </div>
            </div>
            <div className="conversion-item">
              <span className="conversion-icon">📈</span>
              <div className="conversion-info">
                <span className="conversion-label">{conversion.label2}</span>
                <span className="conversion-value">{conversion.value2}</span>
              </div>
            </div>
          </div>

          <div className="config-card-footer">
            <button className="config-view-chart-btn">Click to flip</button>
          </div>
        </div>

        <div className="config-card-face config-card-back">
          <div className="config-card-header">
            <h3>{title}</h3>
          </div>
          <p className="config-subtitle">Current Counts</p>

          <div className="config-metrics-grid">
            {metricsBack.map((metric, idx) => (
              <div key={idx} className="config-metric-item">
                <div className="config-icon">{metric.icon}</div>
                <div className="config-metric-info">
                  <div className="config-metric-label">{metric.label}</div>
                  <div className="config-metric-value">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="config-conversion-row">
            <div className="conversion-item">
              <span className="conversion-icon">📊</span>
              <div className="conversion-info">
                <span className="conversion-label">{conversion.label}</span>
                <span className="conversion-value">{conversion.value}</span>
              </div>
            </div>
            <div className="conversion-item">
              <span className="conversion-icon">📈</span>
              <div className="conversion-info">
                <span className="conversion-label">{conversion.label2}</span>
                <span className="conversion-value">{conversion.value2}</span>
              </div>
            </div>
          </div>

          <div className="config-card-footer">
            <button className="config-view-chart-btn">Click to flip</button>
          </div>
        </div>
      </div>
    </div>
  );
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
    row?.lead_to_registration_pct ??
    row?.lead_to_booking_pct ??
    pickAny(row?.leads, ["pct"], null) ??
    pickAny(row?.qualified, ["pct"], null) ??
    pickAny(row?.bookings, ["pct"], null) ??
    pickAny(row?.registrations, ["pct"], null);

  const badgeTxt =
    badgePct === null || badgePct === undefined
      ? null
      : `${toNum(badgePct).toFixed(1)}%`;

  const accent = SS_ACCENT[variant] || SS_ACCENT.green;

  const y = Array.isArray(seriesRow?.data)
    ? seriesRow.data.map((v) => toNum(v))
    : [];
  const x = Array.isArray(labels) ? labels : [];
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
        {chartData.length ? (
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
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty-state">No trend data</div>
        )}
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
      <div
        className="ss2-inner"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="ss2-side ss2-front">{front}</div>
        <div className="ss2-side ss2-back">{back}</div>
      </div>
    </div>
  );
}

const BarGraphSection = ({ title, subtitle, data, xKey, yKey, controls }) => {
  const safeData = Array.isArray(data) ? data : [];
  const hasData = safeData.length > 0;

  return (
    <div className="chart-section bar-chart-section">
      <div className="section-header-clean">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {controls}
      </div>

      <div className="chart-wrapper bar-chart-wrapper">
        {!hasData ? (
          <div className="chart-empty-state">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={safeData}
              margin={{ top: 24, right: 16, left: 0, bottom: 32 }}
              barCategoryGap="10%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis
                dataKey={xKey}
                stroke="#94a3b8"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12, fontWeight: 600 }}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey={yKey} radius={[10, 10, 0, 0]}>
                <LabelList
                  dataKey={yKey}
                  position="top"
                  style={{ fill: "#64748b", fontWeight: 700, fontSize: "12px" }}
                />
                {safeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const OverviewChartCard = ({
  title,
  subtitle,
  data,
  series,
  pieKey,
  defaultType = "bar",
}) => {
  const [chartType, setChartType] = useState(defaultType);
  const safeData = Array.isArray(data) ? data : [];
  const hasData = safeData.length > 0;
  const pieDataKey = pieKey || series?.[0]?.key;

  return (
    <div className="overview-chart-card">
      <div className="overview-chart-header">
        <div>
          <h3 className="overview-chart-title">{title}</h3>
          {subtitle && <p className="overview-chart-subtitle">{subtitle}</p>}
        </div>
        <div className="chart-type-toggle">
          {CHART_TYPES.map((type) => (
            <button
              key={type.id}
              className={`chart-type-btn ${
                chartType === type.id ? "active" : ""
              }`}
              onClick={() => setChartType(type.id)}
              title={type.label}
            >
              <span className="chart-type-icon">{type.icon}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper overview-chart-frame">
        {!hasData ? (
          <div className="chart-empty-state">No data available</div>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={safeData} margin={{ top: 10, right: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              {series.map((s, idx) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  fill={s.color || getBarColor(idx)}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : chartType === "area" ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              {series.map((s, idx) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color || getBarColor(idx)}
                  fill={`${s.color || getBarColor(idx)}33`}
                  strokeWidth={2}
                  dot={renderMultiColorDot}
                  activeDot={renderActiveDot}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : chartType === "pie" ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={safeData}
                dataKey={pieDataKey}
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {safeData.map((_, idx) => (
                  <Cell key={`slice-${idx}`} fill={getBarColor(idx)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={safeData} margin={{ top: 10, right: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              {series.map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color || getBarColor(idx)}
                  strokeWidth={2}
                  dot={renderMultiColorDot}
                  activeDot={renderActiveDot}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   Helpers
   ========================================================= */
const toArray = (val) => (Array.isArray(val) ? val : []);

const normalizeScopeProjects = (scopeData = {}) => {
  const rawProjects = Array.isArray(scopeData.projects)
    ? scopeData.projects
    : Array.isArray(scopeData.accesses)
      ? scopeData.accesses
      : [];

  return rawProjects
    .map((proj, pIdx) => {
      const id = proj?.id ?? proj?.project_id ?? proj?.project;
      if (!id) return null;
      const name =
        proj?.name ??
        proj?.project_name ??
        proj?.project_label ??
        `Project ${id}`;

      const towersRaw =
        proj?.towers ||
        proj?.tower ||
        proj?.project_towers ||
        proj?.tower_list ||
        proj?.towers_list ||
        proj?.tower_details ||
        [];

      const towers = toArray(towersRaw).map((tower, tIdx) => {
        const towerId =
          tower?.id ??
          tower?.tower_id ??
          tower?.tower ??
          tower?.name ??
          `${id}-tower-${tIdx}`;
        const towerName =
          tower?.name ??
          tower?.tower_name ??
          tower?.label ??
          tower?.tower ??
          `Tower ${tIdx + 1}`;

        const floorsRaw =
          tower?.floors ||
          tower?.floor ||
          tower?.floor_list ||
          tower?.floors_list ||
          tower?.floor_details ||
          tower?.levels ||
          [];

        const floors = toArray(floorsRaw).map((floor, fIdx) => ({
          id:
            floor?.id ??
            floor?.floor_id ??
            floor?.level_id ??
            floor?.name ??
            `${towerId}-floor-${fIdx}`,
          name:
            floor?.name ??
            floor?.floor_name ??
            floor?.label ??
            floor?.level ??
            floor?.floor ??
            `Floor ${fIdx + 1}`,
        }));

        return { id: towerId, name: towerName, floors };
      });

      return { id, name, towers };
    })
    .filter(Boolean);
};

const getKPIColor = (index) => {
  const colors = [
    "#CDDCF6",
    "#F6CDCD",
    "#F6EFCD",
    "#CDF6D3",
    "#DCCDF6",
    "#CDDCF6",
    "#F6CDCD",
    "#F6EFCD",
    "#CDF6D3",
    "#CDE8F6",
  ];
  return colors[index % colors.length];
};

const getBarColor = (index) => {
  const colors = [
    "#a8b5ff",
    "#b8d5ff",
    "#a8e6cf",
    "#c8e6a8",
    "#ffe8a8",
    "#ffcfcf",
    "#e8cfff",
    "#ffc8e8",
    "#d8d8ff",
    "#ffd8d8",
  ];
  return colors[index % colors.length];
};

const getSiteCardColor = (index) => {
  const colors = ["#d4ffe8", "#d4e8ff", "#e8d4ff"];
  return colors[index % colors.length];
};

const getConfigCardColor = (index) => {
  const colors = ["#e8f4ff", "#e8ffe8", "#f4e8ff", "#fff4e8"];
  return colors[index % colors.length];
};

const getCategoryLabel = (key) => {
  const labelMap = {
    direct: "Direct Site Visits",
    cp: "CP Site Visitrs",
    online: "Online Leads - Site Visits",
    other: "Other Site Visit",
  };
  return labelMap[key] || key;
};

const transformSiteVisitData = (siteVisitObj) => {
  if (
    !siteVisitObj ||
    !siteVisitObj.labels ||
    !siteVisitObj.current ||
    !siteVisitObj.current.categories
  )
    return [];

  return siteVisitObj.labels.map((label, idx) => {
    const point = { name: label };
    Object.keys(siteVisitObj.current.categories).forEach((cat) => {
      point[cat] = siteVisitObj.current.categories[cat]?.percent?.[idx] || 0;
    });
    return point;
  });
};

const transformRevisitData = (revisitObj) => {
  if (!revisitObj || !revisitObj.labels || !revisitObj.current) return [];

  return revisitObj.labels.map((label, idx) => ({
    name: label,
    direct: revisitObj.current?.direct_revisit?.percent?.[idx] || 0,
    cp: revisitObj.current?.cp_revisit?.percent?.[idx] || 0,
  }));
};

const transformSeriesData = (seriesObj) => {
  if (!seriesObj || !seriesObj.labels || !seriesObj.series) return [];

  return seriesObj.labels.map((label, idx) => {
    const point = { name: label };
    seriesObj.series.forEach((s) => {
      point[s.name.toLowerCase()] = s.data?.[idx] || 0;
    });
    return point;
  });
};

const transformInventoryData = (inventoryObj) => {
  if (!inventoryObj || !inventoryObj.labels || !inventoryObj.current) return [];

  return inventoryObj.labels.map((label, idx) => ({
    name: label,
    booked:
      inventoryObj.current?.booked?.percent?.[idx] ||
      inventoryObj.current?.booked?.count?.[idx] ||
      0,
    pipeline:
      inventoryObj.current?.pipeline?.percent?.[idx] ||
      inventoryObj.current?.pipeline?.count?.[idx] ||
      0,
    available:
      inventoryObj.current?.available?.percent?.[idx] ||
      inventoryObj.current?.available?.count?.[idx] ||
      0,
  }));
};

const POINT_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#22c55e",
];

const renderMultiColorDot = (props) => {
  const { cx, cy, index } = props;
  if (cx == null || cy == null) return null;
  const fill = POINT_COLORS[index % POINT_COLORS.length];
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#ffffff" strokeWidth={1} />;
};

const renderActiveDot = (props) => {
  const { cx, cy, index } = props;
  if (cx == null || cy == null) return null;
  const fill = POINT_COLORS[index % POINT_COLORS.length];
  return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#ffffff" strokeWidth={2} />;
};

const CHART_TYPES = [
  { id: "line", label: "Line", icon: "〰️" },
  { id: "bar", label: "Bar", icon: "📊" },
  { id: "area", label: "Area", icon: "⛰️" },
  { id: "pie", label: "Pie", icon: "🥧" },
];

const dealWidgetIds = [
  "total_sold_value_period",
  "deal_win_rate_pct",
  "deal_close_rate_pct",
  "deal_avg_days_to_close",
  "deal_open_deals",
  "deal_expected_revenue",
  "deal_open_deal_age_days",
  "deal_active_cp_count",
  "deal_cp_expected_revenue_pipeline",
];

const formatNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
};

const formatWidgetValue = (widget) => {
  if (!widget) return "0";
  const value = widget.current ?? 0;
  const unit = widget.unit || "";
  const title = widget.title || "";

  if (unit === "INR" || title.includes("₹")) {
    return `₹${formatNumber(value)}`;
  }
  if (unit === "%" || title.includes("%")) {
    return `${Number(value).toFixed(1)}%`;
  }
  if (unit === "days" || title.toLowerCase().includes("days")) {
    return `${Number(value).toFixed(1)}`;
  }
  return formatNumber(value);
};

const getDealWidgets = (widgets = []) =>
  widgets.filter((w) => dealWidgetIds.includes(w.id));

const getBaseWidgets = (widgets = []) =>
  widgets.filter((w) => !dealWidgetIds.includes(w.id));

const getAllChannelPartnerRows = (data) => {
  const candidates = [
    data?.all_channel_partners_by_leads,
    data?.channel_partners_by_leads,
    data?.channel_partner_leads,
    data?.active_channel_partners_table,
  ].filter(Boolean);

  const rows = candidates[0]?.rows || [];

  if (rows.length > 0) return rows;

  const seriesRows = data?.active_channel_partners_series?.series || [];
  const labels = data?.active_channel_partners_series?.labels || [];
  const lastIndex = labels.length - 1;

  return seriesRows.map((s) => ({
    name: s.name,
    kind: "series",
    leads: { current: s.data?.[lastIndex] ?? 0 },
  }));
};

const toBarData = (rows = []) =>
  rows.map((row) => ({
    name:
      row.cp_name ||
      row.name ||
      row.channel_partner_name ||
      row.source ||
      "Unknown",
    value: Number(
      row.lead_count_till_now ??
        row.lead_count?.current ??
        row.leads?.current ??
        row.cur ??
        row.leads_cur ??
        row.value ??
        0,
    ),
  }));

const filterChannelPartnerRows = (rows = [], filter) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const count = Math.max(1, Number(filter?.count || 10));
  const mode = filter?.mode || "TOP10";
  const order = filter?.order || "DESC";

  const byCount = (a, b) => {
    const aVal = Number(a?.lead_count_till_now ?? a?.lead_count?.current ?? 0);
    const bVal = Number(b?.lead_count_till_now ?? b?.lead_count?.current ?? 0);
    return order === "ASC" ? aVal - bVal : bVal - aVal;
  };

  let sliced = safeRows;
  if (mode === "TOP10") sliced = safeRows.slice(0, 10);
  if (mode === "LAST10") sliced = safeRows.slice(-10);
  if (mode === "CUSTOM") sliced = safeRows.slice(0, count);

  return [...sliced].sort(byCount);
};

const transformLeadPipelineData = (pipeline) => {
  if (!pipeline?.steps) return [];
  return pipeline.steps.map((step) => ({
    name: step.label || step.key,
    value: step.value || 0,
  }));
};

const transformSourceWiseData = (sourceObj) => {
  if (!sourceObj?.rows) return [];
  return sourceObj.rows.map((row) => ({
    name: row.source || "Unknown",
    leads: row.leads_cur ?? row.leads?.current ?? 0,
    bookings: row.bookings_cur ?? row.bookings?.current ?? 0,
  }));
};

const transformSiteConversionData = (conversionObj) => {
  if (!conversionObj?.rows) return [];
  return conversionObj.rows.map((row) => ({
    name: row.project_name || `Project ${row.project_id || ""}`.trim(),
    leads: row.leads?.current ?? 0,
    qualified: row.qualified?.current ?? 0,
    visits: row.site_visits_done?.current ?? 0,
    bookings: row.bookings?.current ?? 0,
    registrations: row.registrations?.current ?? 0,
  }));
};

export default Dashboard;
