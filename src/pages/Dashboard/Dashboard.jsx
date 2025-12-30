// // src/pages/Dashboard.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import axiosInstance from "../../api/axiosInstance";
// import { useAuth } from "../../context/AuthContext";
// import "./Dashboard.css";
// import { formatINR } from "../../utils/number";

// const SCOPE_URL = "/client/my-scope/";

// // Decide which dashboard URL to call based on role
// function getDashboardUrl(role) {
//   const r = role || "";

//   if (r === "ADMIN" || r === "SUPER_ADMIN"|| r === "MANAGER") {
//     return "/dashboard/admin/";
//   }

//   if (r === "SALES" || r === "RECEPTION" || r === "CALLING_TEAM") {
//     return "/dashboard/sales/";
//   }

//   if (r === "CHANNEL_PARTNER" || r === "CP" || r === "CHANNEL PATNER") {
//     return "/dashboard/channel-partner/";
//   }

//   // Fallback
//   return "/dashboard/sales/";
// }

// export default function Dashboard() {
//   const { user } = useAuth();


//   // Date filter
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [isDateOpen, setIsDateOpen] = useState(false);
//   const [scope, setScope] = useState(null);
//   const [selectedProjectIds, setSelectedProjectIds] = useState([]);
//   const [metrics, setMetrics] = useState(null);
//   const isSalesMetrics = !!metrics?.summary;

//   const [loadingScope, setLoadingScope] = useState(true);
//   const [loadingMetrics, setLoadingMetrics] = useState(false);
//   const [error, setError] = useState("");

//   // Analytics/project dropdown
//   const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
//   const analyticsRef = useRef(null);
//   const dateRef = useRef(null);

//   // Label for date button
//   const dateLabel = useMemo(() => {
//     if (fromDate && toDate) return `${fromDate} - ${toDate}`;
//     if (fromDate && !toDate) return `From ${fromDate}`;
//     if (!fromDate && toDate) return `Until ${toDate}`;
//     return "Last 30 days";
//   }, [fromDate, toDate]);

//   // ---------------- Fetch scope (admin + projects) ----------------
//   useEffect(() => {
//     const fetchScope = async () => {
//       setLoadingScope(true);
//       setError("");
//       try {
//         const res = await axiosInstance.get(SCOPE_URL);
//         const data = res.data || {};
//         const projects = data.projects || [];

//         setScope(data);
//         // default = all projects selected
//         setSelectedProjectIds(projects.map((p) => p.id));
//       } catch (err) {
//         console.error("Scope load failed", err);
//         setError(
//           err?.response?.data?.detail ||
//             "Unable to load project scope. Please try again."
//         );
//       } finally {
//         setLoadingScope(false);
//       }
//     };

//     fetchScope();
//   }, []);

//   // ---------------- Fetch dashboard metrics (GET + query params) ----------------
//   useEffect(() => {
//     if (!scope) return;

//     const fetchMetrics = async () => {
//       setLoadingMetrics(true);
//       setError("");

//       const dashboardUrl = getDashboardUrl(user?.role);
//       const allProjectIds = (scope.projects || []).map((p) => p.id);

//       // If nothing selected OR all selected -> do not send `projects` param
//       const isAllSelected =
//         selectedProjectIds.length === 0 ||
//         selectedProjectIds.length === allProjectIds.length;

//       const params = {};
//       if (!isAllSelected && selectedProjectIds.length > 0) {
//         params.projects = selectedProjectIds.join(",");
//       }

//       // from_date / to_date (optional) – backend defaults last 30 days if missing
//       if (fromDate) params.from_date = fromDate;
//       if (toDate) params.to_date = toDate;

//       try {
//         const res = await axiosInstance.get(dashboardUrl, { params });
//         const data = res.data?.data || res.data || null;
//         setMetrics(data);
//       } catch (err) {
//         console.error("Dashboard metrics load failed", err);
//         setError(
//           err?.response?.data?.detail ||
//             "Unable to load dashboard analytics. Please try again."
//         );
//       } finally {
//         setLoadingMetrics(false);
//       }
//     };

//     fetchMetrics();
//   }, [scope, selectedProjectIds, user?.role, fromDate, toDate]);

//   // ---------------- Close dropdowns on outside click ----------------
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         analyticsRef.current &&
//         !analyticsRef.current.contains(event.target)
//       ) {
//         setIsAnalyticsOpen(false);
//       }
//       if (dateRef.current && !dateRef.current.contains(event.target)) {
//         setIsDateOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Total leads should mean:
//   // - SALES: user's active leads (summary.my_active_leads)
//   // - ADMIN: total in current period, from by_source / total_leads / new_leads
//   const totalLeads = useMemo(() => {
//     if (!metrics) return 0;

//     if (isSalesMetrics) {
//       // SALES response
//       return metrics.summary?.my_active_leads ?? 0;
//     }

//     // ADMIN response
//     if (typeof metrics.leads?.total_leads === "number") {
//       return metrics.leads.total_leads;
//     }

//     // sum of by_source if available
//     const src = metrics.leads?.by_source || {};
//     const totalFromSource = Object.values(src).reduce(
//       (acc, v) => acc + (v || 0),
//       0
//     );
//     if (totalFromSource) return totalFromSource;

//     // last fallback: sum of by_stage
//     const stages = metrics.leads?.by_stage || {};
//     return Object.values(stages).reduce((acc, v) => acc + (v || 0), 0);
//   }, [metrics, isSalesMetrics]);

//   // New leads:
//   // - SALES: my_new_leads (today from backend)
//   // - ADMIN: new_leads in selected period
//   const newLeadsToday =
//     (isSalesMetrics
//       ? metrics?.summary?.my_new_leads
//       : metrics?.leads?.new_leads) ?? 0;

//   const leadSourceMap = metrics?.leads?.by_source || {};
//   const leadSourceEntries = Object.entries(leadSourceMap);
//   const maxLeadSourceCount =
//     leadSourceEntries.reduce((max, [, v]) => (v > max ? v : max), 0) || 1;
//   const [leadStatusCount, setLeadStatusCount] = useState({
//   Hot: 0,
//   Warm: 0,
//   Cold: 0,
// });

//   const leadQualityScore = useMemo(() => {
//     const cls = metrics?.leads?.by_classification || {};
//     const hot = cls["Hot"] || 0;
//     const warm = cls["Warm"] || 0;
//     const cold = cls["Cold"] || 0;
//     const total = hot + warm + cold;
//     if (!total) return 0;
//     const score = ((hot * 1 + warm * 0.7 + cold * 0.3) / total) * 100;
//     return Math.round(score);
//   }, [metrics]);

//   const pipelineStages = Object.entries(metrics?.leads?.by_stage || {});

//   const tasksCounts = useMemo(() => {
//     const sv = metrics?.site_visits || {};
//     const last = sv.last_period || {};
//     const f = metrics?.followups || {}; // only in SALES JSON

//     return {
//       completed: last.COMPLETED || 0,
//       upcoming: sv.upcoming || 0,
//       // SALES: followups.today / followups.overdue
//       // ADMIN: no followups -> 0
//       dueToday: f.today || 0,
//       overdue: f.overdue || 0,
//     };
//   }, [metrics]);

//   const totalTasks =
//     tasksCounts.completed +
//     tasksCounts.upcoming +
//     tasksCounts.dueToday +
//     tasksCounts.overdue;

//   const selectedProjectsLabel = useMemo(() => {
//     if (!scope?.projects?.length) return "No projects";
//     const all = scope.projects;
//     if (
//       selectedProjectIds.length === 0 ||
//       selectedProjectIds.length === all.length
//     ) {
//       return "All Projects";
//     }
//     const names = all
//       .filter((p) => selectedProjectIds.includes(p.id))
//       .map((p) => p.name);
//     if (names.length <= 2) return names.join(", ");
//     return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
//   }, [scope, selectedProjectIds]);

//   const selectedProjectsCount =
//     selectedProjectIds.length || scope?.projects?.length || 0;

//   // ---------------- Handlers for project dropdown ----------------
//   const toggleProject = (projectId) => {
//     setSelectedProjectIds((prev) => {
//       if (prev.includes(projectId)) {
//         return prev.filter((id) => id !== projectId);
//       }
//       return [...prev, projectId];
//     });
//   };

//  useEffect(() => {
//   const fetchLeadStatusCounts = async () => {
//     try {
//       let page = 1;
//       let hasNext = true;

//       const counts = {
//         Hot: 0,
//         Warm: 0,
//         Cold: 0,
//       };

//       while (hasNext) {
//         const res = await axiosInstance.get("/sales/sales-leads/", {
//           params: { page },
//         });

//         const data = res.data || {};
//         const results = Array.isArray(data) ? data : data.results || [];

//         results.forEach((lead) => {
//           const status =
//             (lead.status_name || "").trim().toLowerCase();

//           if (status === "hot") counts.Hot += 1;
//           else if (status === "warm") counts.Warm += 1;
//           else if (status === "cold") counts.Cold += 1;
//         });

//         hasNext = !!data.next;
//         page += 1;
//       }

//       console.log("✅ Lead status counts:", counts);
//       setLeadStatusCount(counts);
//     } catch (err) {
//       console.error("❌ Failed to load lead status counts", err);
//     }
//   };

//   fetchLeadStatusCounts();
// }, []);

//   const selectAllProjects = () => {
//     if (!scope?.projects) return;
//     setSelectedProjectIds(scope.projects.map((p) => p.id));
//   };

//   const clearAllProjects = () => {
//     // clear selection => backend treats as ALL (no projects query param)
//     setSelectedProjectIds([]);
//   };

//   // ---------------- Render ----------------
//   const isLoading = loadingScope || loadingMetrics;

//   return (
//     <div className="page-container dashboard-page">
//       <div className="page-content">
//         {/* HEADER */}
//         <header className="dashboard-header">
//           <div>
//             <h1 className="dashboard-title">Dashboard View</h1>
//             <p className="dashboard-subtitle">
//               Analytics for <strong>{selectedProjectsLabel}</strong>
//             </p>
//           </div>

//           <div className="dashboard-actions">
//             {/* DATE FILTER */}
//             <div className="date-filter-wrapper" ref={dateRef}>
//               <button
//                 type="button"
//                 className="dash-btn date-btn"
//                 onClick={() => setIsDateOpen((prev) => !prev)}
//               >
//                 <span className="dash-btn-icon">📅</span>
//                 <span>{dateLabel}</span>
//               </button>

//               {isDateOpen && (
//                 <div className="date-popover">
//                   <div className="date-popover-row">
//                     <label>
//                       From
//                       <input
//                         type="date"
//                         value={fromDate}
//                         onChange={(e) => setFromDate(e.target.value)}
//                       />
//                     </label>
//                     <label>
//                       To
//                       <input
//                         type="date"
//                         value={toDate}
//                         onChange={(e) => setToDate(e.target.value)}
//                       />
//                     </label>
//                   </div>
//                   <div className="date-popover-actions">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setFromDate("");
//                         setToDate("");
//                         setIsDateOpen(false);
//                       }}
//                     >
//                       Reset
//                     </button>
//                     <button type="button" onClick={() => setIsDateOpen(false)}>
//                       Apply
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Analytics / Project dropdown */}
//             <div className="analytics-wrapper" ref={analyticsRef}>
//               <button
//                 type="button"
//                 className="dash-btn analytics-btn"
//                 onClick={() => setIsAnalyticsOpen((prev) => !prev)}
//               >
//                 <span className="dash-btn-icon">📊</span>
//                 <span>Analytics ({selectedProjectsCount})</span>
//               </button>

//               {isAnalyticsOpen && (
//                 <div className="analytics-menu">
//                   <div className="analytics-menu-header">Projects</div>
//                   <div className="analytics-menu-actions">
//                     <button type="button" onClick={selectAllProjects}>
//                       Select all
//                     </button>
//                     <button type="button" onClick={clearAllProjects}>
//                       Clear
//                     </button>
//                   </div>
//                   <div className="analytics-menu-body">
//                     {(scope?.projects || []).map((p) => (
//                       <label
//                         key={p.id}
//                         className="analytics-menu-item"
//                         title={p.name}
//                       >
//                         <span className="analytics-menu-label">{p.name}</span>
//                         <input
//                           type="checkbox"
//                           checked={
//                             selectedProjectIds.length === 0
//                               ? true
//                               : selectedProjectIds.includes(p.id)
//                           }
//                           onChange={() => toggleProject(p.id)}
//                         />
//                       </label>
//                     ))}
//                     {!scope?.projects?.length && (
//                       <div className="analytics-menu-empty">
//                         No projects assigned.
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Notification bell */}
//             <button type="button" className="notification-bell">
//               🔔
//             </button>
//           </div>
//         </header>

//         {/* Error / loading */}
//         {error && (
//           <div className="dashboard-alert dashboard-alert-error">{error}</div>
//         )}

//         {isLoading && (
//           <div className="dashboard-loading">Loading analytics…</div>
//         )}

//         {!isLoading && !metrics && !error && (
//           <div className="dashboard-empty">No analytics data yet.</div>
//         )}

//         {/* MAIN CONTENT */}
//         {!isLoading && metrics && (
//           <>
//             {/* ROW 1: Lead Overview + Tasks */}
//             <div className="dashboard-row">
//               {/* LEAD OVERVIEW CARD */}
//               <section className="card lead-overview-card">
//                 <header className="card-header">
//                   <h2>Lead Overview</h2>
//                 </header>

//                 <div className="lead-overview-top">
//                   <div className="lead-overview-metric">
//                     <div className="metric-label">Total leads</div>
//                     <div className="metric-value">{formatINR(totalLeads)}</div>
//                   </div>
//                   <div className="lead-overview-metric">
//                     <div className="metric-label">New leads</div>
//                     <div className="metric-value">{formatINR(newLeadsToday)}</div>
//                     <div className="metric-subtext">
//                       {isSalesMetrics ? "added today" : "in selected period"}
//                     </div>
//                   </div>
//                   <div className="lead-overview-metric">
                    
//                     <div className="lead-status-breakdown">
//               <div className="lead-status-item hot">
//                 <span className="label">Hot  : </span>
//                 <span className="value">{leadStatusCount.Hot}</span>
//               </div>

//               <div className="lead-status-item warm">
//                 <span className="label">Warm  : </span>
//                 <span className="value">{leadStatusCount.Warm}</span>
//               </div>

//               <div className="lead-status-item cold">
//                 <span className="label">Cold : </span>
//                 <span className="value">{leadStatusCount.Cold}</span>
//               </div>
//             </div>

                    
//                   </div>
//                 </div>

//                 <div className="lead-overview-bottom">
//                   <div className="lead-source-header">
//                     Lead source breakdown
//                   </div>
//                   <div className="lead-source-list">
//                     {leadSourceEntries.length === 0 && (
//                       <p className="muted-text">No lead source data.</p>
//                     )}
//                     {leadSourceEntries.map(([name, count]) => (
//                       <div key={name} className="lead-source-row">
//                         <span className="lead-source-name">{name}</span>
//                         <div className="lead-source-bar">
//                           <div
//                             className="lead-source-bar-fill"
//                             style={{
//                               width: `${(count / maxLeadSourceCount) * 100}%`,
//                             }}
//                           />
//                         </div>
//                         <span className="lead-source-count">{formatINR(count)}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </section>

//               {/* TASKS & FOLLOW-UPS CARD */}
//               <section className="card tasks-card">
//                 <header className="card-header">
//                   <h2>Tasks &amp; Follow-ups</h2>
//                 </header>

//                 <div className="tasks-card-content">
//                   <div className="tasks-donut">
//                     <div className="tasks-donut-inner">
//                       <div className="tasks-donut-label">Total</div>
//                       <div className="tasks-donut-value">{formatINR(totalTasks)}</div>
//                     </div>
//                   </div>
//                   <ul className="tasks-legend">
//                     <li>
//                       <span className="legend-dot completed" />
//                       <span>Completed</span>
//                       <span className="legend-count">
//                         {formatINR(tasksCounts.completed)}
//                       </span>
//                     </li>
//                     <li>
//                       <span className="legend-dot upcoming" />
//                       <span>Upcoming</span>
//                       <span className="legend-count">
//                         {formatINR(tasksCounts.upcoming)}
//                       </span>
//                     </li>
//                     <li>
//                       <span className="legend-dot due-today" />
//                       <span>Due Today</span>
//                       <span className="legend-count">
//                         {formatINR(tasksCounts.dueToday)}
//                       </span>
//                     </li>
//                     <li>
//                       <span className="legend-dot overdue" />
//                       <span>Overdue</span>
//                       <span className="legend-count">
//                         {formatINR(tasksCounts.overdue)}
//                       </span>
//                     </li>
//                   </ul>
//                 </div>
//               </section>
//             </div>

//             {/* ROW 2: PIPELINE + SUMMARY */}
//             <div className="dashboard-row">
//               {/* LEAD PIPELINE STAGES */}
//               <section className="card pipeline-card">
//                 <header className="card-header">
//                   <h2>Lead Pipeline Stages</h2>
//                 </header>
//                 <div className="pipeline-stages">
//                   <div className="pipeline-stage first-stage">
//                     <div className="pipeline-stage-name">New Leads</div>
//                     <div className="pipeline-stage-count">{formatINR(newLeadsToday)}</div>
//                   </div>
//                   {pipelineStages.map(([name, count]) => (
//                     <div key={name} className="pipeline-stage">
//                       <div className="pipeline-stage-name">{name}</div>
//                       <div className="pipeline-stage-count">{formatINR(count)}</div>
//                     </div>
//                   ))}
//                   {pipelineStages.length === 0 && (
//                     <p className="muted-text">
//                       No stage-wise data yet for selected projects.
//                     </p>
//                   )}
//                 </div>
//               </section>

//               {/* SUMMARY CARD */}
//               <section className="card summary-card">
//                 <header className="card-header">
//                   <h2>Bookings &amp; Revenue Snapshot</h2>
//                 </header>
//                 <div className="summary-grid">
//                   <div className="summary-item">
//                     <div className="summary-label">Bookings</div>
//                     <div className="summary-value">
//                       {/* SALES: my_bookings_count, ADMIN: count */}
//                       {formatINR(metrics?.bookings?.my_bookings_count ??
//                         metrics?.bookings?.count ??
//                         0)}
//                     </div>
//                   </div>
//                   <div className="summary-item">
//                     <div className="summary-label">Agreement value</div>
//                     <div className="summary-value">
//                     {formatINR(
//                       metrics?.bookings?.my_bookings_value ??
//                       metrics?.bookings?.total_agreement_value ??
//                       0
//                     )}
//                   </div>

//                   </div>

//                   <div className="summary-item">
//                     <div className="summary-label">Cost sheets</div>
//                     <div className="summary-value">
//                       {formatINR(Object.values(
//                         metrics?.cost_sheets?.count_by_status || {}
//                       ).reduce((a, b) => a + b, 0))}
//                     </div>
//                   </div>
//                   <div className="summary-item">
//                     <div className="summary-label">KYC pending</div>
//                     <div className="summary-value">
//                       {formatINR(metrics?.kyc?.requests_by_status?.PENDING ?? 0)}
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";
import { formatINR } from "../../utils/number";
import { useNavigate } from "react-router-dom";

const SCOPE_URL = "/client/my-scope/";

// Decide which dashboard URL to call based on role
function getDashboardUrl(role) {
  const r = role || "";

  if (r === "ADMIN" || r === "SUPER_ADMIN"|| r === "MANAGER") {
    return "/dashboard/admin/";
  }

  if (r === "SALES" || r === "RECEPTION" || r === "CALLING_TEAM") {
    return "/dashboard/sales/";
  }

  if (r === "CHANNEL_PARTNER" || r === "CP" || r === "CHANNEL PATNER") {
    return "/dashboard/channel-partner/";
  }

  // Fallback
  return "/dashboard/sales/";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();


  // Date filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [scope, setScope] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const isSalesMetrics = !!metrics?.summary;

  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState("");
  const [channelPartnerCount, setChannelPartnerCount] = useState(0);
  
  // Analytics/project dropdown
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const analyticsRef = useRef(null);
  const dateRef = useRef(null);
  const finalChannelPartnerCount = useMemo(() => {
  // ADMIN / SUPER_ADMIN → dashboard metrics se
  if (["ADMIN", "SUPER_ADMIN"].includes(user?.role)) {
    return metrics?.leads?.by_source?.["Channel Partner"] ?? 0;
  }

  // SALES / MANAGER → calculated CP count
  return channelPartnerCount;
}, [user?.role, metrics, channelPartnerCount]);

  // Label for date button
  const dateLabel = useMemo(() => {
    if (fromDate && toDate) return `${fromDate} - ${toDate}`;
    if (fromDate && !toDate) return `From ${fromDate}`;
    if (!fromDate && toDate) return `Until ${toDate}`;
    return "Last 30 days";
  }, [fromDate, toDate]);


  
  // ---------------- Fetch scope (admin + projects) ----------------
  useEffect(() => {
    const fetchScope = async () => {
      setLoadingScope(true);
      setError("");
      try {
        const res = await axiosInstance.get(SCOPE_URL);
        const data = res.data || {};
        const projects = data.projects || [];
       

        setScope(data);
        // default = all projects selected
        setSelectedProjectIds(projects.map((p) => p.id));
      } catch (err) {
        console.error("Scope load failed", err);
        setError(
          err?.response?.data?.detail ||
            "Unable to load project scope. Please try again."
        );
      } finally {
        setLoadingScope(false);
      }
    };

    fetchScope();
  }, []);

useEffect(() => {
  if (!["SALES", "MANAGER"].includes(user?.role)) return;

  const fetchSalesCpCount = async () => {
    try {
      let page = 1;
      let hasNext = true;
      const cpSet = new Set();

      while (hasNext) {
        const res = await axiosInstance.get("/sales/sales-leads/", {
          params: { page },
        });

        const data = res.data || {};
        const results = Array.isArray(data) ? data : data.results || [];

        results.forEach((lead) => {
          if (lead.source_name === "Channel Partner") {
            const key =
              lead.channel_partner ||
              lead.channel_partner_name ||
              lead.cp_referral_code ||
              lead.mobile_number;

            if (key) cpSet.add(key);
          }
        });

        hasNext = !!data.next;
        page += 1;
      }

      setChannelPartnerCount(cpSet.size);
    } catch (err) {
      console.error("❌ Sales CP count failed", err);
      setChannelPartnerCount(0);
    }
  };

  fetchSalesCpCount();
}, [user?.role]);

  // ---------------- Fetch dashboard metrics (GET + query params) ----------------
  useEffect(() => {
    if (!scope) return;

    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      setError("");

      const dashboardUrl = getDashboardUrl(user?.role);
      const allProjectIds = (scope.projects || []).map((p) => p.id);

      // If nothing selected OR all selected -> do not send `projects` param
      const isAllSelected =
        selectedProjectIds.length === 0 ||
        selectedProjectIds.length === allProjectIds.length;

      const params = {};
      if (!isAllSelected && selectedProjectIds.length > 0) {
        params.projects = selectedProjectIds.join(",");
      }

      // from_date / to_date (optional) – backend defaults last 30 days if missing
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      try {
        const res = await axiosInstance.get(dashboardUrl, { params });
        const data = res.data?.data || res.data || null;
        setMetrics(data);
      } catch (err) {
        console.error("Dashboard metrics load failed", err);
        setError(
          err?.response?.data?.detail ||
            "Unable to load dashboard analytics. Please try again."
        );
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [scope, selectedProjectIds, user?.role, fromDate, toDate]);

  // ---------------- Close dropdowns on outside click ----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        analyticsRef.current &&
        !analyticsRef.current.contains(event.target)
      ) {
        setIsAnalyticsOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Total leads should mean:
  // - SALES: user's active leads (summary.my_active_leads)
  // - ADMIN: total in current period, from by_source / total_leads / new_leads
  const totalLeads = useMemo(() => {
    if (!metrics) return 0;

    if (isSalesMetrics) {
      // SALES response
      return metrics.summary?.my_active_leads ?? 0;
    }

    // ADMIN response
    if (typeof metrics.leads?.total_leads === "number") {
      return metrics.leads.total_leads;
    }

    // sum of by_source if available
    const src = metrics.leads?.by_source || {};
    const totalFromSource = Object.values(src).reduce(
      (acc, v) => acc + (v || 0),
      0
    );
    if (totalFromSource) return totalFromSource;

    // last fallback: sum of by_stage
    const stages = metrics.leads?.by_stage || {};
    return Object.values(stages).reduce((acc, v) => acc + (v || 0), 0);
  }, [metrics, isSalesMetrics]);

  // New leads:
  // - SALES: my_new_leads (today from backend)
  // - ADMIN: new_leads in selected period
  const newLeadsToday =
    (isSalesMetrics
      ? metrics?.summary?.my_new_leads
      : metrics?.leads?.new_leads) ?? 0;

  const leadSourceMap = metrics?.leads?.by_source || {};
  const leadSourceEntries = Object.entries(leadSourceMap);
  const maxLeadSourceCount =
    leadSourceEntries.reduce((max, [, v]) => (v > max ? v : max), 0) || 1;
  const [leadStatusCount, setLeadStatusCount] = useState({
  Hot: 0,
  Warm: 0,
  Cold: 0,
});

  const leadQualityScore = useMemo(() => {
    const cls = metrics?.leads?.by_classification || {};
    const hot = cls["Hot"] || 0;
    const warm = cls["Warm"] || 0;
    const cold = cls["Cold"] || 0;
    const total = hot + warm + cold;
    if (!total) return 0;
    const score = ((hot * 1 + warm * 0.7 + cold * 0.3) / total) * 100;
    return Math.round(score);
  }, [metrics]);

  const pipelineStages = Object.entries(metrics?.leads?.by_stage || {});

  const tasksCounts = useMemo(() => {
    const sv = metrics?.site_visits || {};
    const last = sv.last_period || {};
    const f = metrics?.followups || {}; // only in SALES JSON

    return {
      completed: last.COMPLETED || 0,
      upcoming: sv.upcoming || 0,
      // SALES: followups.today / followups.overdue
      // ADMIN: no followups -> 0
      dueToday: f.today || 0,
      overdue: f.overdue || 0,
    };
  }, [metrics]);

  const totalTasks =
    tasksCounts.completed +
    tasksCounts.upcoming +
    tasksCounts.dueToday +
    tasksCounts.overdue;

  const selectedProjectsLabel = useMemo(() => {
    if (!scope?.projects?.length) return "No projects";
    const all = scope.projects;
    if (
      selectedProjectIds.length === 0 ||
      selectedProjectIds.length === all.length
    ) {
      return "All Projects";
    }
    const names = all
      .filter((p) => selectedProjectIds.includes(p.id))
      .map((p) => p.name);
    if (names.length <= 2) return names.join(", ");
    return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
  }, [scope, selectedProjectIds]);



  const selectedProjectsCount =
    selectedProjectIds.length || scope?.projects?.length || 0;

  // ---------------- Handlers for project dropdown ----------------
  const toggleProject = (projectId) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      }
      return [...prev, projectId];
    });
  };

 useEffect(() => {
  const fetchLeadStatusCounts = async () => {
    try {
      let page = 1;
      let hasNext = true;

      const counts = {
        Hot: 0,
        Warm: 0,
        Cold: 0,
      };

      while (hasNext) {
        const res = await axiosInstance.get("/sales/sales-leads/", {
          params: { page },
        });

        const data = res.data || {};
        const results = Array.isArray(data) ? data : data.results || [];

        results.forEach((lead) => {
          const status =
            (lead.status_name || "").trim().toLowerCase();

          if (status === "hot") counts.Hot += 1;
          else if (status === "warm") counts.Warm += 1;
          else if (status === "cold") counts.Cold += 1;
        });

        hasNext = !!data.next;
        page += 1;
      }

      console.log("✅ Lead status counts:", counts);
      setLeadStatusCount(counts);
    } catch (err) {
      console.error("❌ Failed to load lead status counts", err);
    }
  };

  fetchLeadStatusCounts();
}, []);

  const selectAllProjects = () => {
    if (!scope?.projects) return;
    setSelectedProjectIds(scope.projects.map((p) => p.id));
  };

  const clearAllProjects = () => {
    // clear selection => backend treats as ALL (no projects query param)
    setSelectedProjectIds([]);
  };

  // ---------------- Render ----------------
  const isLoading = loadingScope || loadingMetrics;

  return (
    <div className="page-container dashboard-page">
      <div className="page-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard View</h1>
            <p className="dashboard-subtitle">
              Analytics for <strong>{selectedProjectsLabel}</strong>
            </p>
          </div>

          <div className="dashboard-actions">
            {/* DATE FILTER */}
            <div className="date-filter-wrapper" ref={dateRef}>
              <button
                type="button"
                className="dash-btn date-btn"
                onClick={() => setIsDateOpen((prev) => !prev)}
              >
                <span className="dash-btn-icon">📅</span>
                <span>{dateLabel}</span>
              </button>

              {isDateOpen && (
                <div className="date-popover">
                  <div className="date-popover-row">
                    <label>
                      From
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </label>
                    <label>
                      To
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="date-popover-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setIsDateOpen(false);
                      }}
                    >
                      Reset
                    </button>
                    <button type="button" onClick={() => setIsDateOpen(false)}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Analytics / Project dropdown */}
            <div className="analytics-wrapper" ref={analyticsRef}>
              <button
                type="button"
                className="dash-btn analytics-btn"
                onClick={() => setIsAnalyticsOpen((prev) => !prev)}
              >
                <span className="dash-btn-icon">📊</span>
                <span>Analytics ({selectedProjectsCount})</span>
              </button>

              {isAnalyticsOpen && (
                <div className="analytics-menu">
                  <div className="analytics-menu-header">Projects</div>
                  <div className="analytics-menu-actions">
                    <button type="button" onClick={selectAllProjects}>
                      Select all
                    </button>
                    <button type="button" onClick={clearAllProjects}>
                      Clear
                    </button>
                  </div>
                  <div className="analytics-menu-body">
                    {(scope?.projects || []).map((p) => (
                      <label
                        key={p.id}
                        className="analytics-menu-item"
                        title={p.name}
                      >
                        <span className="analytics-menu-label">{p.name}</span>
                        <input
                          type="checkbox"
                          checked={
                            selectedProjectIds.length === 0
                              ? true
                              : selectedProjectIds.includes(p.id)
                          }
                          onChange={() => toggleProject(p.id)}
                        />
                      </label>
                    ))}
                    {!scope?.projects?.length && (
                      <div className="analytics-menu-empty">
                        No projects assigned.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification bell */}
            <button type="button" className="notification-bell">
              🔔
            </button>
          </div>
        </header>

        {/* Error / loading */}
        {error && (
          <div className="dashboard-alert dashboard-alert-error">{error}</div>
        )}

        {isLoading && (
          <div className="dashboard-loading">Loading analytics…</div>
        )}

        {!isLoading && !metrics && !error && (
          <div className="dashboard-empty">No analytics data yet.</div>
        )}

        {/* MAIN CONTENT */}
        {!isLoading && metrics && (
          <>
            {/* ROW 1: Lead Overview + Tasks */}
            <div className="dashboard-row">
              {/* LEAD OVERVIEW CARD */}
              <section className="card lead-overview-card">
                <header className="card-header">
                  <h2>Lead Overview</h2>
                </header>

                <div className="lead-overview-top">
                  <div className="lead-overview-metric">
                    <div className="metric-label">Total leads</div>
                    <div className="metric-value">{formatINR(totalLeads)}</div>
                  </div>
                  <div className="lead-overview-metric">
                    <div className="metric-label">New leads</div>
                    <div className="metric-value">{formatINR(newLeadsToday)}</div>
                    <div className="metric-subtext">
                      {isSalesMetrics ? "added today" : "in selected period"}
                    </div>
                  </div>
                                <div className="lead-overview-metric">
                <div className="metric-label">Active Channel Partners</div>
                <div
  className="metric-value clickable"
  onClick={() => {
    if (["ADMIN", "SUPER_ADMIN"].includes(user?.role)) {
      navigate("/channel-partner-setup");
    } else {
      navigate("/channel-partners");
    }
  }}
>
 {formatINR(finalChannelPartnerCount)}

</div>


                <div className="metric-subtext">
 Channel partners with Leads
                </div>
              </div>

                  <div className="lead-overview-metric">
                    
                    <div className="lead-status-breakdown">
              <div className="lead-status-item hot">
                <span className="label">Hot  : </span>
                <span className="value">{leadStatusCount.Hot}</span>
              </div>

              <div className="lead-status-item warm">
                <span className="label">Warm  : </span>
                <span className="value">{leadStatusCount.Warm}</span>
              </div>

              <div className="lead-status-item cold">
                <span className="label">Cold : </span>
                <span className="value">{leadStatusCount.Cold}</span>
              </div>
            </div>

                    
                  </div>
                </div>

                <div className="lead-overview-bottom">
                  <div className="lead-source-header">
                    Lead source breakdown
                  </div>
                  <div className="lead-source-list">
                    {leadSourceEntries.length === 0 && (
                      <p className="muted-text">No lead source data.</p>
                    )}
                    {leadSourceEntries.map(([name, count]) => (
                      <div key={name} className="lead-source-row">
                        <span className="lead-source-name">{name}</span>
                        <div className="lead-source-bar">
                          <div
                            className="lead-source-bar-fill"
                            style={{
                              width: `${(count / maxLeadSourceCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="lead-source-count">{formatINR(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* TASKS & FOLLOW-UPS CARD */}
              <section className="card tasks-card">
                <header className="card-header">
                  <h2>Tasks &amp; Follow-ups</h2>
                </header>

                <div className="tasks-card-content">
                  <div className="tasks-donut">
                    <div className="tasks-donut-inner">
                      <div className="tasks-donut-label">Total</div>
                      <div className="tasks-donut-value">{formatINR(totalTasks)}</div>
                    </div>
                  </div>
                  <ul className="tasks-legend">
                    <li>
                      <span className="legend-dot completed" />
                      <span>Completed</span>
                      <span className="legend-count">
                        {formatINR(tasksCounts.completed)}
                      </span>
                    </li>
                    <li>
                      <span className="legend-dot upcoming" />
                      <span>Upcoming</span>
                      <span className="legend-count">
                        {formatINR(tasksCounts.upcoming)}
                      </span>
                    </li>
                    <li>
                      <span className="legend-dot due-today" />
                      <span>Due Today</span>
                      <span className="legend-count">
                        {formatINR(tasksCounts.dueToday)}
                      </span>
                    </li>
                    <li>
                      <span className="legend-dot overdue" />
                      <span>Overdue</span>
                      <span className="legend-count">
                        {formatINR(tasksCounts.overdue)}
                      </span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* ROW 2: PIPELINE + SUMMARY */}
            <div className="dashboard-row">
              {/* LEAD PIPELINE STAGES */}
              <section className="card pipeline-card">
                <header className="card-header">
                  <h2>Lead Pipeline Stages</h2>
                </header>
                <div className="pipeline-stages">
                  <div className="pipeline-stage first-stage">
                    <div className="pipeline-stage-name">New Leads</div>
                    <div className="pipeline-stage-count">{formatINR(newLeadsToday)}</div>
                  </div>
                  {pipelineStages.map(([name, count]) => (
                    <div key={name} className="pipeline-stage">
                      <div className="pipeline-stage-name">{name}</div>
                      <div className="pipeline-stage-count">{formatINR(count)}</div>
                    </div>
                  ))}
                  {pipelineStages.length === 0 && (
                    <p className="muted-text">
                      No stage-wise data yet for selected projects.
                    </p>
                  )}
                </div>
              </section>

              {/* SUMMARY CARD */}
              <section className="card summary-card">
                <header className="card-header">
                  <h2>Bookings &amp; Revenue Snapshot</h2>
                </header>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-label">Bookings</div>
                    <div className="summary-value">
                      {/* SALES: my_bookings_count, ADMIN: count */}
                      {formatINR(metrics?.bookings?.my_bookings_count ??
                        metrics?.bookings?.count ??
                        0)}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Agreement value</div>
                    <div className="summary-value">
                    {formatINR(
                      metrics?.bookings?.my_bookings_value ??
                      metrics?.bookings?.total_agreement_value ??
                      0
                    )}
                  </div>

                  </div>

                  <div className="summary-item">
                    <div className="summary-label">Cost sheets</div>
                    <div className="summary-value">
                      {formatINR(Object.values(
                        metrics?.cost_sheets?.count_by_status || {}
                      ).reduce((a, b) => a + b, 0))}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">KYC pending</div>
                    <div className="summary-value">
                      {formatINR(metrics?.kyc?.requests_by_status?.PENDING ?? 0)}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

