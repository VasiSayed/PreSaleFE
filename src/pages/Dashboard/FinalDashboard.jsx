import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

/* ---------------- helpers: period mapping ---------------- */
const mapUiPeriodToApi = (uiPeriod) => {
  const v = String(uiPeriod || "").toLowerCase();
  if (v.startsWith("day")) return "day";
  if (v.startsWith("week")) return "week";
  if (v.startsWith("month")) return "month";
  if (v.startsWith("year")) return "year";
  return "week";
};

const clampInventoryPeriod = (uiPeriod) => {
  const v = String(uiPeriod || "");
  return v === "Weekly" || v === "Yearly" ? v : "Weekly";
};

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const pct = (num, den) => {
  const n = safeNum(num);
  const d = safeNum(den);
  if (!d) return 0;
  return (n / d) * 100;
};

const Dashboard = () => {
  const { user } = useAuth(); // keep for future use

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const initialFilters = {
    all: "ALL",
    sites: "All Sites (Group View)",
    towers: "All Towers",
    config: "All Config",
    leadSources: "All Lead Sources",
    channelPartners: "All Channel Partners",
    salesPeople: "All Sales People",
    campaigns: "All Campaigns",
  };

  const initialPeriods = {
    siteVisit: "Weekly",
    reVisit: "Monthly",
    uniqueCP: "Yearly",
    inventoryTracking: "Weekly", // ✅ default weekly
    siteSummary: "Month",
  };

  // ✅ Draft (UI-controlled) vs Applied (fetch-controlled)
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [draftPeriods, setDraftPeriods] = useState(initialPeriods);
  const [appliedPeriods, setAppliedPeriods] = useState(initialPeriods);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Global period from appliedPeriods.siteSummary (you can change this to another global control later)
      const apiPeriod = mapUiPeriodToApi(appliedPeriods.siteSummary);

      const params = {
        period: apiPeriod,
        bucket_mode: "calendar",
        year: 2026,
        // NOTE: you can add applied filters mapping here later
      };

      const response = await axiosInstance.get(
        "dashboard/vasi/presales-exec/",
        {
          params,
        },
      );

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      setError(err?.message || "Unknown error");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [appliedPeriods.siteSummary]);

  // ✅ Fetch only when applied state changes (Apply button triggers this)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = () => {
    // ✅ enforce inventory tracking restriction
    const nextPeriods = {
      ...draftPeriods,
      inventoryTracking: clampInventoryPeriod(draftPeriods.inventoryTracking),
    };
    setDraftPeriods(nextPeriods);
    setAppliedFilters(draftFilters);
    setAppliedPeriods(nextPeriods);
  };

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

  return (
    <div className="dashboard">
      {/* Top Navigation Tabs */}
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
        <div className="user-profile">
          <div className="user-avatar-group">
            <div className="user-avatar">👤</div>
            <div className="user-avatar">👤</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-left">
          <span className="filter-icon">⚙️</span>
          <span className="filter-label">Filters:</span>

          <select
            className="filter-dropdown"
            value={draftFilters.all}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, all: e.target.value })
            }
          >
            <option>ALL</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.sites}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, sites: e.target.value })
            }
          >
            <option>All Sites (Group View)</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.towers}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, towers: e.target.value })
            }
          >
            <option>All Towers</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.config}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, config: e.target.value })
            }
          >
            <option>All Config</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.leadSources}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, leadSources: e.target.value })
            }
          >
            <option>All Lead Sources</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.channelPartners}
            onChange={(e) =>
              setDraftFilters({
                ...draftFilters,
                channelPartners: e.target.value,
              })
            }
          >
            <option>All Channel Partners</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.salesPeople}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, salesPeople: e.target.value })
            }
          >
            <option>All Sales People</option>
          </select>

          <select
            className="filter-dropdown"
            value={draftFilters.campaigns}
            onChange={(e) =>
              setDraftFilters({ ...draftFilters, campaigns: e.target.value })
            }
          >
            <option>All Campaigns</option>
          </select>
        </div>

        <button className="apply-button" onClick={handleApply}>
          <span>✨</span> Apply
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* KPI Cards Row - ONLY FIRST 10 WIDGETS - Show in Overview only */}
        {activeTab === "overview" &&
          data?.widgets &&
          data.widgets.length > 0 && (
            <div className="kpi-cards-row">
              {data.widgets.slice(0, 10).map((widget, idx) => (
                <KPICard
                  key={widget.id || idx}
                  title={widget.title}
                  value={widget.current?.toLocaleString?.() || "0"}
                  color={getKPIColor(idx)}
                />
              ))}
            </div>
          )}

        {/* =================== Site Visit =================== */}
        {(activeTab === "overview" || activeTab === "charts") &&
          data?.site_visit_obj?.supported &&
          data.site_visit_obj.labels &&
          data.site_visit_obj.current?.categories && (
            <div className="chart-section" key="site-visit">
              <div className="section-header-clean">
                <h2 className="section-title">Site Visit</h2>
                <select
                  className="period-selector"
                  value={draftPeriods.siteVisit}
                  onChange={(e) =>
                    setDraftPeriods({
                      ...draftPeriods,
                      siteVisit: e.target.value,
                    })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              {/* ✅ BLUE TABLE */}
              <div className="heatmap-container heatmap-blue">
                <table className="gradient-heatmap blue-heatmap">
                  <thead>
                    <tr>
                      <th></th>
                      {data.site_visit_obj.labels.map((label, idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allValues = Object.values(
                        data.site_visit_obj.current.categories,
                      )
                        .flatMap((cat) => cat?.percent || [])
                        .filter((v) => v > 0);

                      const maxValue =
                        allValues.length > 0 ? Math.max(...allValues) : 1;

                      return Object.entries(
                        data.site_visit_obj.current.categories,
                      ).map(
                        ([categoryKey, categoryData]) =>
                          categoryData?.percent && (
                            <tr key={categoryKey}>
                              <td className="row-label">
                                {getCategoryLabel(categoryKey)}
                              </td>

                              {categoryData.percent.map((value, idx) => {
                                const bgColor =
                                  value > 0
                                    ? getGradientColorByValue(value, maxValue)
                                    : "transparent"; // ✅ show blue background for empty

                                return (
                                  <td key={idx}>
                                    <div
                                      className="heat-cell"
                                      style={{
                                        backgroundColor: bgColor,
                                        color:
                                          value > 0
                                            ? "#ffffff"
                                            : "rgba(255,255,255,0.65)",
                                        borderColor:
                                          value > 0
                                            ? "rgba(255,255,255,0.18)"
                                            : "rgba(255,255,255,0.14)",
                                        textShadow:
                                          value > 0
                                            ? "0 1px 2px rgba(0,0,0,0.35)"
                                            : "none",
                                      }}
                                    >
                                      {value > 0 ? value.toFixed(1) : ""}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ),
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={transformSiteVisitData(data.site_visit_obj)}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#999"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    {Object.keys(data.site_visit_obj.current.categories).map(
                      (cat) => {
                        const colors = {
                          direct: "#f0a500",
                          cp: "#dc3545",
                          online: "#28a745",
                          other: "#17a2b8",
                        };
                        return (
                          <Line
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stroke={colors[cat] || "#3b82f6"}
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            name={getCategoryLabel(cat)}
                          />
                        );
                      },
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Re-Visit =================== */}
        {(activeTab === "overview" || activeTab === "charts") &&
          data?.revisit_obj?.supported &&
          data.revisit_obj.labels &&
          data.revisit_obj.current && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">Re-Visit</h2>
                <select
                  className="period-selector"
                  value={draftPeriods.reVisit}
                  onChange={(e) =>
                    setDraftPeriods({
                      ...draftPeriods,
                      reVisit: e.target.value,
                    })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              {/* ✅ BLUE TABLE */}
              <div className="heatmap-container heatmap-blue">
                <table className="gradient-heatmap blue-heatmap">
                  <thead>
                    <tr>
                      <th></th>
                      {data.revisit_obj.labels.map((label, idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.revisit_obj.current.direct_revisit?.percent && (
                      <tr>
                        <td className="row-label">Direct Re-Visit</td>
                        {data.revisit_obj.current.direct_revisit.percent.map(
                          (value, idx) => (
                            <td key={idx}>
                              <div
                                className="heat-cell"
                                style={{
                                  backgroundColor:
                                    value > 0
                                      ? getGradientColor(
                                          idx,
                                          data.revisit_obj.labels.length,
                                        )
                                      : "transparent",
                                  color: "#fff",
                                  borderColor: "rgba(255,255,255,0.18)",
                                  textShadow:
                                    value > 0
                                      ? "0 1px 2px rgba(0,0,0,0.35)"
                                      : "none",
                                }}
                              >
                                {value > 0 ? value.toFixed(1) : ""}
                              </div>
                            </td>
                          ),
                        )}
                      </tr>
                    )}
                    {data.revisit_obj.current.cp_revisit?.percent && (
                      <tr>
                        <td className="row-label">CP Re-Visit</td>
                        {data.revisit_obj.current.cp_revisit.percent.map(
                          (value, idx) => (
                            <td key={idx}>
                              <div
                                className="heat-cell"
                                style={{
                                  backgroundColor:
                                    value > 0
                                      ? getGradientColor(
                                          idx,
                                          data.revisit_obj.labels.length,
                                        )
                                      : "transparent",
                                  color: "#fff",
                                  borderColor: "rgba(255,255,255,0.18)",
                                  textShadow:
                                    value > 0
                                      ? "0 1px 2px rgba(0,0,0,0.35)"
                                      : "none",
                                }}
                              >
                                {value > 0 ? value.toFixed(1) : ""}
                              </div>
                            </td>
                          ),
                        )}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={transformRevisitData(data.revisit_obj)}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#999"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="direct"
                      stroke="#28a745"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Direct Re-Visit"
                    />
                    <Line
                      type="monotone"
                      dataKey="cp"
                      stroke="#dc3545"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="CP Re-Visit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Unique CP Meetings =================== */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "channel") &&
          data?.active_channel_partners_series?.supported && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">Unique CP Meetings</h2>
                <select
                  className="period-selector"
                  value={draftPeriods.uniqueCP}
                  onChange={(e) =>
                    setDraftPeriods({
                      ...draftPeriods,
                      uniqueCP: e.target.value,
                    })
                  }
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>

              {/* ✅ BLUE TABLE */}
              <div className="heatmap-container heatmap-blue">
                <table className="gradient-heatmap blue-heatmap">
                  <thead>
                    <tr>
                      <th></th>
                      {data.active_channel_partners_series.labels.map(
                        (label, idx) => (
                          <th key={idx}>{label}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.active_channel_partners_series.series?.map(
                      (serie) => (
                        <tr key={serie.name}>
                          <td className="row-label">{serie.name}</td>
                          {serie.data?.map((value, idx) => (
                            <td key={idx}>
                              <div
                                className="heat-cell"
                                style={{
                                  backgroundColor:
                                    value > 0
                                      ? getGradientColor(
                                          idx,
                                          data.active_channel_partners_series
                                            .labels.length,
                                        )
                                      : "transparent",
                                  color: "#fff",
                                  borderColor: "rgba(255,255,255,0.18)",
                                  textShadow:
                                    value > 0
                                      ? "0 1px 2px rgba(0,0,0,0.35)"
                                      : "none",
                                }}
                              >
                                {value > 0 ? value : ""}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={transformSeriesData(
                      data.active_channel_partners_series,
                    )}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#999"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    {data.active_channel_partners_series.series?.map(
                      (serie, idx) => (
                        <Line
                          key={serie.name}
                          type="monotone"
                          dataKey={serie.name.toLowerCase()}
                          stroke={idx === 0 ? "#1e40af" : "#f0a500"}
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          name={serie.name}
                        />
                      ),
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Inventory Tracking =================== */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "inventory-widgets") &&
          data?.inventory_tracking_obj?.supported && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">Inventory Tracking</h2>

                {/* ✅ ONLY Weekly / Yearly */}
                <select
                  className="period-selector"
                  value={clampInventoryPeriod(draftPeriods.inventoryTracking)}
                  onChange={(e) =>
                    setDraftPeriods({
                      ...draftPeriods,
                      inventoryTracking: clampInventoryPeriod(e.target.value),
                    })
                  }
                >
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
              </div>

              {/* ✅ BLUE TABLE */}
              <div className="heatmap-container heatmap-blue">
                <table className="gradient-heatmap blue-heatmap">
                  <thead>
                    <tr>
                      <th></th>
                      {data.inventory_tracking_obj.labels?.map((label, idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["booked", "pipeline", "available"].map(
                      (key) =>
                        data.inventory_tracking_obj.current?.[key] && (
                          <tr key={key}>
                            <td className="row-label">
                              Inventory{" "}
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </td>
                            {(
                              data.inventory_tracking_obj.current[key]
                                ?.percent ||
                              data.inventory_tracking_obj.current[key]?.count ||
                              []
                            ).map((value, idx) => (
                              <td key={idx}>
                                <div
                                  className="heat-cell"
                                  style={{
                                    backgroundColor:
                                      value > 0
                                        ? getGradientColor(
                                            idx,
                                            data.inventory_tracking_obj.labels
                                              .length,
                                          )
                                        : "transparent",
                                    color: "#fff",
                                    borderColor: "rgba(255,255,255,0.18)",
                                    textShadow:
                                      value > 0
                                        ? "0 1px 2px rgba(0,0,0,0.35)"
                                        : "none",
                                  }}
                                >
                                  {value > 0
                                    ? value.toFixed(
                                        data.inventory_tracking_obj.current[key]
                                          ?.percent
                                          ? 1
                                          : 0,
                                      )
                                    : ""}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={transformInventoryData(data.inventory_tracking_obj)}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#999"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="booked"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Inventory Booked"
                    />
                    <Line
                      type="monotone"
                      dataKey="pipeline"
                      stroke="#f08080"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Inventory In Pipeline"
                    />
                    <Line
                      type="monotone"
                      dataKey="available"
                      stroke="#28a745"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      name="Inventory Available"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Config Matrix (Cards + Table) =================== */}
        {(activeTab === "overview" ||
          activeTab === "config" ||
          activeTab === "inventory-table") &&
          data?.config_matrix?.supported &&
          data.config_matrix.rows?.length > 0 && (
            <div className="config-matrix-section">
              <div className="section-header-clean">
                <h2 className="section-title">Configuration Matrix</h2>
                <p className="section-subtitle">Performance by unit type</p>
              </div>

              {(activeTab === "overview" || activeTab === "config") && (
                <div className="config-cards-grid">
                  {data.config_matrix.rows.map((cfg, idx) => {
                    const inv = cfg.inventory || {};
                    const soldPct = pct(inv.booked, inv.total);

                    return (
                      <ConfigCard
                        key={cfg.configuration_id || idx}
                        title={cfg.configuration_name || `Config ${idx + 1}`} // ✅ fixed
                        subtitle="Key Metrics"
                        metrics={[
                          {
                            label: "Inv Total",
                            value: String(inv.total || 0),
                            icon: "📦",
                          },
                          {
                            label: "Available",
                            value: String(inv.available || 0),
                            icon: "✅",
                          },
                          {
                            label: "Leads",
                            value: String(cfg.leads?.current || 0),
                            icon: "👥",
                          },
                          {
                            label: "Bookings",
                            value: String(cfg.bookings?.current || 0),
                            icon: "📋",
                          },
                        ]}
                        conversion={{
                          label: "Lead→Book",
                          value: `${safeNum(cfg.lead_to_booking_pct).toFixed(1)}%`,
                          label2: "Sold %",
                          value2: `${soldPct.toFixed(1)}%`,
                        }}
                        color={getConfigCardColor(idx)}
                      />
                    );
                  })}
                </div>
              )}

              {/* ✅ Proper table view (Config tab + Inventory-table tab) */}
              <div style={{ marginTop: 18 }}>
                <ConfigMatrixTable rows={data.config_matrix.rows} />
              </div>
            </div>
          )}

        {/* =================== Sales Team =================== */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "sales") &&
          data?.sales_team_performance?.supported &&
          data.sales_team_performance.rows?.length > 0 && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">Sales Team</h2>
                <p className="section-subtitle">
                  Individual performance metrics
                </p>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data.sales_team_performance.rows.map((row, idx) => ({
                      name: row.sales_user_name || `Sales ${idx + 1}`,
                      value: row.leads?.current || 0,
                      color: getBarColor(idx),
                    }))}
                    margin={{ top: 30, right: 30, left: 0, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      stroke="#999"
                      interval={0}
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{
                          fill: "#111827",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      />
                      {data.sales_team_performance.rows.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Channel Partner Active =================== */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "channel") &&
          data?.top_channel_partners?.supported &&
          data.top_channel_partners.rows?.length > 0 && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">Channel Partner Active</h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data.top_channel_partners.rows.map((row, idx) => ({
                      name: row.cp_name || row.name || `CP ${idx + 1}`,
                      value:
                        row.lead_count?.current || row.meetings?.current || 0,
                      color: getBarColor(idx),
                    }))}
                    margin={{ top: 30, right: 30, left: 0, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      stroke="#999"
                      interval={0}
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis stroke="#999" style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{
                          fill: "#111827",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      />
                      {data.top_channel_partners.rows.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Top 5 CPs =================== */}
        {(activeTab === "overview" ||
          activeTab === "charts" ||
          activeTab === "channel") &&
          data?.top_channel_partners?.supported &&
          data.top_channel_partners.rows?.length > 0 && (
            <div className="chart-section">
              <div className="section-header-clean">
                <h2 className="section-title">
                  Top 5 CPs Active and Ranking Based on Client Visited
                </h2>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.top_channel_partners.rows
                      .slice(0, 5)
                      .map((row, idx) => ({
                        name: row.cp_name || row.name || `CP ${idx + 1}`,
                        value:
                          row.site_visits?.current ||
                          row.meetings?.current ||
                          0,
                        color: getBarColor(idx),
                      }))}
                    layout="horizontal"
                    margin={{ top: 20, right: 50, left: 80, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      stroke="#999"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#999"
                      width={70}
                      style={{ fontSize: "11px" }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      <LabelList
                        dataKey="value"
                        position="right"
                        style={{
                          fill: "#111827",
                          fontWeight: "600",
                          fontSize: "12px",
                        }}
                      />
                      {data.top_channel_partners.rows
                        .slice(0, 5)
                        .map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(index)}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* =================== Site Summary =================== */}
        {activeTab === "overview" &&
          data?.site_summary?.rows &&
          data.site_summary.rows.length > 0 && (
            <div className="site-summary-section">
              <div className="section-header-clean">
                <h2 className="section-title">Site Summary</h2>
                <p className="section-subtitle">
                  Click a card to flip and view details
                </p>
                <div className="period-tabs">
                  <button className="period-tab">Day</button>
                  <button className="period-tab">Week</button>
                  <button className="period-tab active">Month</button>
                  <button className="period-tab">Year</button>
                </div>
              </div>

              <div className="site-cards-grid">
                {data.site_summary.rows.map((site, idx) => (
                  <SiteCard
                    key={site.project_id || idx}
                    title={site.project_name || `Project ${idx + 1}`}
                    subtitle="Key Metrics"
                    percentage={
                      site.lead_to_registration_pct
                        ? `${site.lead_to_registration_pct.toFixed(1)}%`
                        : "0%"
                    }
                    metrics={[
                      {
                        label: "Total Leads",
                        value: String(site.leads?.current || 0),
                        icon: "👥",
                      },
                      {
                        label: "Qualified",
                        value: String(site.qualified?.current || 0),
                        icon: "✓",
                      },
                      {
                        label: "Bookings",
                        value: String(site.bookings?.current || 0),
                        icon: "📋",
                      },
                      {
                        label: "Registrations",
                        value: String(site.registrations?.current || 0),
                        icon: "📝",
                      },
                    ]}
                    color={getSiteCardColor(idx)}
                  />
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

/* ================= Components ================= */

// KPI Card Component
const KPICard = ({ title, value, color }) => (
  <div className="kpi-card" style={{ backgroundColor: color }}>
    <div className="kpi-card-title">{title}</div>
    <div className="kpi-card-value">{value}</div>
  </div>
);

// Site Card Component
const SiteCard = ({ title, subtitle, percentage, metrics, color }) => (
  <div className="site-card" style={{ backgroundColor: color }}>
    <div className="site-card-header">
      <h3>{title}</h3>
      <span className="site-percentage">{percentage}</span>
    </div>
    <p className="site-subtitle">{subtitle}</p>
    <div className="site-metrics">
      {metrics.map((metric, idx) => (
        <div key={idx} className="site-metric">
          <div className="metric-icon-wrapper">
            <span className="metric-icon">{metric.icon}</span>
            <div className="metric-info">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <button className="view-details-btn">Click to view chart</button>
  </div>
);

// Config Card Component
const ConfigCard = ({ title, subtitle, metrics, conversion, color }) => (
  <div className="config-card" style={{ backgroundColor: color }}>
    <div className="config-card-header">
      <h3>{title}</h3>
    </div>
    <p className="config-subtitle">{subtitle}</p>
    <div className="config-metrics-row">
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
      <button className="config-view-chart-btn">Click to view chart</button>
    </div>
  </div>
);

// ✅ Config Matrix Table (proper fields)
const ConfigMatrixTable = ({ rows = [] }) => {
  if (!rows?.length) return null;

  return (
    <div className="blueTableWrap">
      <table className="blueTable">
        <thead>
          <tr>
            <th>Configuration</th>
            <th className="num">Inv Total</th>
            <th className="num">Avail</th>
            <th className="num">Booked</th>
            <th className="num">Blocked</th>
            <th className="num">Pipeline</th>
            <th className="num">Leads Cur</th>
            <th className="num">Leads Prev</th>
            <th className="num">Leads Diff</th>
            <th className="num">Bookings Cur</th>
            <th className="num">Bookings Prev</th>
            <th className="num">Bookings Diff</th>
            <th className="num">Lead→Booking %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const inv = r.inventory || {};
            return (
              <tr key={r.configuration_id || r.configuration_name}>
                <td>{r.configuration_name || "-"}</td>
                <td className="num">{inv.total ?? 0}</td>
                <td className="num">{inv.available ?? 0}</td>
                <td className="num">{inv.booked ?? 0}</td>
                <td className="num">{inv.blocked ?? 0}</td>
                <td className="num">{inv.pipeline ?? 0}</td>
                <td className="num">{r.leads?.current ?? 0}</td>
                <td className="num">{r.leads?.previous ?? 0}</td>
                <td className="num">{r.leads?.diff ?? 0}</td>
                <td className="num">{r.bookings?.current ?? 0}</td>
                <td className="num">{r.bookings?.previous ?? 0}</td>
                <td className="num">{r.bookings?.diff ?? 0}</td>
                <td className="num">
                  {safeNum(r.lead_to_booking_pct).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ================= Helper Functions ================= */

// Exact widget colors - only first 10
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

// Gradient color function - dark to light (#101996 to #D5E6F2) based on value
const getGradientColorByValue = (value, maxValue) => {
  if (value <= 0) return "transparent";

  const startColor = { r: 16, g: 25, b: 150 };
  const endColor = { r: 213, g: 230, b: 242 };

  const ratio = Math.min(value / (maxValue || 1), 1);
  const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
  const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
  const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));

  return `rgb(${r}, ${g}, ${b})`;
};

// Keep old function for other heatmaps that use index-based coloring
const getGradientColor = (index, total) => {
  const startColor = { r: 16, g: 92, b: 150 };
  const endColor = { r: 205, g: 220, b: 246 };

  const ratio = index / (total - 1 || 1);

  const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
  const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
  const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));

  return `rgb(${r}, ${g}, ${b})`;
};

const getCategoryLabel = (key) => {
  const labelMap = {
    direct: "Direct Site Visits",
    cp: "CP Site Visits",
    online: "Online Leads - Site Visits",
    other: "Other Site Visit",
  };
  return labelMap[key] || key;
};

const transformSiteVisitData = (siteVisitObj) => {
  if (!siteVisitObj?.labels || !siteVisitObj?.current?.categories) return [];
  return siteVisitObj.labels.map((label, idx) => {
    const point = { name: label };
    Object.keys(siteVisitObj.current.categories).forEach((cat) => {
      point[cat] = siteVisitObj.current.categories[cat]?.percent?.[idx] || 0;
    });
    return point;
  });
};

const transformRevisitData = (revisitObj) => {
  if (!revisitObj?.labels || !revisitObj?.current) return [];
  return revisitObj.labels.map((label, idx) => ({
    name: label,
    direct: revisitObj.current?.direct_revisit?.percent?.[idx] || 0,
    cp: revisitObj.current?.cp_revisit?.percent?.[idx] || 0,
  }));
};

const transformSeriesData = (seriesObj) => {
  if (!seriesObj?.labels || !seriesObj?.series) return [];
  return seriesObj.labels.map((label, idx) => {
    const point = { name: label };
    seriesObj.series.forEach((s) => {
      point[s.name.toLowerCase()] = s.data?.[idx] || 0;
    });
    return point;
  });
};

const transformInventoryData = (inventoryObj) => {
  if (!inventoryObj?.labels || !inventoryObj?.current) return [];
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

export default Dashboard;
