// src/pages/Opportunities/OppurnityList.jsx (path adjust kar lena)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";
import "../PreSalesCRM/Leads/LeadsList.css"; // Use LeadsList CSS for consistent styling
import { toast } from "react-toastify";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Helper: Convert text to sentence case
function toSentenceCase(text) {
  if (!text || typeof text !== "string") return text;
  // Handle multi-word strings: split by spaces, capitalize first word, lowercase rest
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return text;
  if (words.length === 1) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  // First word capitalized, rest lowercase
  return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() + 
    " " + words.slice(1).map(w => w.toLowerCase()).join(" ");
}

// Helper: Convert text to title case (first letter of every word capitalized)
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  // Split by spaces and capitalize first letter of each word
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function OppurnityList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [excelUploading, setExcelUploading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]); // multi
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState(null); // total + by_status

  // 🔹 status configs (per project) for change-status / filters
  const [statusConfigs, setStatusConfigs] = useState([]);
  const [statusConfigsProjectId, setStatusConfigsProjectId] = useState(null);

  // 🔹 status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusChangeValue, setStatusChangeValue] = useState(""); // stores status_config_id
  const [statusComment, setStatusComment] = useState("");

  // ---- helper: build project param (comma separated ids) ----
  const buildProjectParam = (idsArray) => {
    const arr = idsArray || [];
    if (!arr.length) return undefined;
    return arr.join(","); // backend expects comma-separated string
  };

  // ---- helper: status label from configs / fallback ----
  const statusLabelForCode = (code) => {
    if (!code) return "";
    const cfg = statusConfigs.find((c) => c.code === code);
    if (cfg) return toSentenceCase(cfg.label);

    if (code === "NEW") return "New";
    if (code === "IN_REVIEW") return "In review";
    if (code === "CONVERTED") return "Converted";

    // fallback: QUALIFIED_LEAD -> "Qualified lead"
    return code
      .toLowerCase()
      .split("_")
      .map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)
      .join(" ");
  };

  // ---- helper: load status configs for a project ----
  const loadStatusConfigs = async (projectId) => {
    try {
      const params = projectId ? { project_id: projectId } : {};
      const res = await axiosInstance.get(
        "/sales/lead-opportunity-status-configs/",
        { params }
      );
      const configs = res.data || [];
      setStatusConfigs(configs);
      setStatusConfigsProjectId(projectId || null);
      return configs;
    } catch (err) {
      console.error("Failed to load opportunity status configs", err);
      setStatusConfigs([]);
      setStatusConfigsProjectId(projectId || null);
      return [];
    }
  };



    const handleExcelChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setExcelUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axiosInstance.post(
          "/sales/lead-opportunities/import-opportunities/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const data = res?.data || {};
        const summary = data.summary || {};

        toast.success(
          `Imported: ${summary.processed || 0}, skipped: ${
            summary.skipped || 0
          }, errors: ${summary.errors || 0}`
        );

        // list refresh
        setPage(1);
        fetchList({ page: 1 });
      } catch (err) {
        console.error("Opportunity import failed", err);

        const resp = err?.response;
        let msg =
          resp?.data?.detail ||
          resp?.data?.error ||
          (typeof resp?.data === "string" ? resp.data : null);

        if (!msg && resp?.data && typeof resp.data === "object") {
          const firstKey = Object.keys(resp.data)[0];
          const firstVal = resp.data[firstKey];
          if (Array.isArray(firstVal)) msg = firstVal[0];
          else if (typeof firstVal === "string") msg = firstVal;
        }

        toast.error(msg || "Failed to import opportunities.");
      } finally {
        setExcelUploading(false);
        // same file dobara choose kar sake isliye reset
        e.target.value = "";
      }
    };



const downloadSampleExcel = () => {
  const header = [
    "project_id",
    "source_system",
    "source_name",
    "external_id",
    "full_name",
    "email",
    "mobile_number",
    "to_lead",
    "owner_username",
    "owner_email",
    "remark",
    "status_code",
  ];

  const rows = [
    [
      "1",
      "CALLING",
      "Jan Calling Sheet",
      "HOT Lead",
      "vIBHU NIRBHAVNE",
      "rahul@example.com",
      "07806512710",
      "yes",
      "sales1",
      "sales1@client.com",
      "Very interested, wants site visit",
      "CONVERTED",
    ],
    [
      "1",
      "CALLING",
      "Jan Calling Sheet",
      "Cold Lead",
      "MURTHI NIRBHAVNE",
      "cold@example.com",
      "209323999",
      "no",
      "sales1",
      "sales2@client.com",
      "Not interested right now",
      "NEW",
    ],
  ];

  const csvLines = [
    header.join(","), // header row
    ...rows.map((r) =>
      r
        .map((value) => {
          const v = value ?? "";
          if (/[",\n]/.test(v)) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opportunities_import_template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};





  // ---- main fetch ----
  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const projectIdsFromOpts = opts.project_ids ?? selectedProjectIds;
      const projectParam = buildProjectParam(projectIdsFromOpts);

      const params = {
        search: (opts.q ?? q) || undefined,
        status: (opts.status ?? status) || undefined,
        project: projectParam, // backend: qp.getlist("project")
        date_from: (opts.date_from ?? startDate) || undefined,
        date_to: (opts.date_to ?? endDate) || undefined,
        page: opts.page ?? page,
      };

      const res = await axiosInstance.get("/sales/lead-opportunities/", {
        params,
      });
      const data = res.data;

      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);

      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);

      if (!Array.isArray(data) && data.summary) {
        setSummary(data.summary);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error("Failed to load opportunities", err);
    } finally {
      setLoading(false);
    }
  };

  // ---- debounced search ----
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setPage(1);
        fetchList({ q: val, page: 1 });
      }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, selectedProjectIds, startDate, endDate]
  );

  // ---- load my-scope projects + initial fetch ----
  useEffect(() => {
    const loadScopeAndFetch = async () => {
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        const data = res.data || {};

        let scopeProjects = [];

        if (Array.isArray(data.projects)) {
          scopeProjects = data.projects.map((p) => ({
            id: p.id ?? p.project_id,
            name:
              p.name ??
              p.project_name ??
              `Project #${p.id || p.project_id || "?"}`,
          }));
        } else if (Array.isArray(data.accesses)) {
          scopeProjects = data.accesses.map((a) => ({
            id: a.project_id,
            name: a.project_name,
          }));
        }

        scopeProjects = scopeProjects.filter((p) => p.id);
        setProjects(scopeProjects);

        let defaultProjectIds = [];

        if (scopeProjects.length === 1) {
          // only one → auto-select
          defaultProjectIds = [String(scopeProjects[0].id)];
        } else if (scopeProjects.length > 1) {
          // many → select first (can change via filters)
          defaultProjectIds = [String(scopeProjects[0].id)];
        }

        setSelectedProjectIds(defaultProjectIds);

        // load status configs for default project (if any)
        if (defaultProjectIds.length) {
          await loadStatusConfigs(defaultProjectIds[0]);
        } else {
          await loadStatusConfigs(null);
        }

        await fetchList({
          page: 1,
          project_ids: defaultProjectIds,
        });
      } catch (err) {
        console.error("Failed to load my-scope for opportunities", err);
        await loadStatusConfigs(null);
        await fetchList({ page: 1 });
      }
    };

    loadScopeAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / 10));

  const formatDT = (v) => {
    if (!v) return "-";
    return new Date(v).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (st) => {
    switch (st) {
      case "NEW":
        return "#3b82f6";
      case "IN_REVIEW":
        return "#6366f1";
      case "CONVERTED":
        return "#059669";
      case "JUNK":
        return "#dc2626";
      case "DUPLICATE":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const handleSearchChange = (val) => {
    setQ(val);
    debouncedSearch(val);
  };

  // ---- multi project toggle ----
  const toggleProject = (id, checked) => {
    setSelectedProjectIds((prev) => {
      const sid = String(id);
      if (checked) {
        if (prev.includes(sid)) return prev;
        return [...prev, sid];
      } else {
        return prev.filter((x) => x !== sid);
      }
    });
  };

  const resetFilters = async () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    setQ("");

    // projects ko reset karne ka simple tareeka → sirf first scope project
    let defaultIds = [];
    if (projects.length === 1) {
      defaultIds = [String(projects[0].id)];
    } else if (projects.length > 1) {
      defaultIds = [String(projects[0].id)];
    }
    setSelectedProjectIds(defaultIds);
    setPage(1);
    setModalOpen(false);

    if (defaultIds.length) {
      await loadStatusConfigs(defaultIds[0]);
    } else {
      await loadStatusConfigs(null);
    }

    fetchList({
      q: "",
      status: "",
      date_from: "",
      date_to: "",
      project_ids: defaultIds,
      page: 1,
    });
  };

  const applyFilters = () => {
    setModalOpen(false);
    setPage(1);
    fetchList({
      q,
      status,
      project_ids: selectedProjectIds,
      date_from: startDate,
      date_to: endDate,
      page: 1,
    });
  };

  // ---- convert API call (manual convert) ----
  // ---- convert API call (manual convert) ----
  // const handleConvert = async (oppId) => {
  //   if (!window.confirm("Convert this opportunity to Lead?")) return;

  //   try {
  //     const res = await axiosInstance.post(
  //       `/sales/lead-opportunities/${oppId}/convert/`,
  //       {}
  //     );

  //     const leadId = res?.data?.sales_lead_id;
  //     if (leadId) {
  //       toast.success(`Converted to Sales Lead #${leadId}`);
  //     } else {
  //       toast.success("Converted to lead successfully.");
  //     }

  //     // refresh list
  //     fetchList({ page });
  //   } catch (err) {
  //     console.error("Convert failed", err);

  //     const resp = err?.response;
  //     const msgFromServer =
  //       resp?.data?.detail ||
  //       resp?.data?.error ||
  //       (typeof resp?.data === "string" ? resp.data : null);

  //     toast.error(msgFromServer || "Failed to convert opportunity.");
  //   }
  // };

  // ---- helper: derive project id from an opportunity row ----
  const deriveProjectIdFromOpp = (opp) => {
    if (!opp) return null;
    if (opp.project_id) return String(opp.project_id);
    if (typeof opp.project === "number") return String(opp.project);
    if (opp.project && typeof opp.project === "object" && opp.project.id) {
      return String(opp.project.id);
    }
    // fallback: use first selected project filter
    if (selectedProjectIds.length) return selectedProjectIds[0];
    return null;
  };

  // 🔹 open status change modal (now using status_config_id)
  const openStatusModal = async (opp) => {
    setStatusTarget(opp);

    const projId = deriveProjectIdFromOpp(opp);

    let configs = statusConfigs;
    if (projId && projId !== statusConfigsProjectId) {
      configs = await loadStatusConfigs(projId);
    }

    // default selection = config matching current status (if exists),
    // else first non-CONVERTED config
    const currentCfg =
      configs.find(
        (cfg) => cfg.code === opp.status && cfg.code !== "CONVERTED"
      ) || configs.find((cfg) => cfg.code !== "CONVERTED");

    setStatusChangeValue(currentCfg ? String(currentCfg.id) : "");
    setStatusComment("");
    setStatusModalOpen(true);
  };

  // 🔹 submit status change
  // 🔹 submit status change
  const submitStatusChange = async () => {
    if (!statusTarget) return;
    if (!statusChangeValue) {
      toast.error("Please select a status.");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/sales/lead-opportunities/${statusTarget.id}/change-status/`,
        {
          status_config_id: statusChangeValue,
          comment: statusComment,
        }
      );

      const data = res?.data || {};
      const label =
        data.status_config_label ||
        data.status_config_code ||
        statusLabelForCode(statusTarget.status) ||
        "";

      let msg = label
        ? `Status updated to "${toSentenceCase(label)}".`
        : "Status updated successfully.";

      if (data.auto_converted) {
        if (data.sales_lead_id) {
          msg = `${msg} Auto-converted to sales lead #${data.sales_lead_id}.`;
        } else {
          msg = `${msg} Auto-converted to lead.`;
        }
      }

      toast.success(msg);

      setStatusModalOpen(false);
      setStatusTarget(null);
      // refresh current page
      fetchList({ page });
    } catch (err) {
      console.error("Status update failed", err);

      const resp = err?.response;
      // DRF validation errors ko human readable banaane ke liye
      let msgFromServer =
        resp?.data?.detail ||
        resp?.data?.error ||
        (typeof resp?.data === "string" ? resp.data : null);

      if (!msgFromServer && resp?.data && typeof resp.data === "object") {
        // first error message uthao
        const firstKey = Object.keys(resp.data)[0];
        const firstVal = resp.data[firstKey];
        if (Array.isArray(firstVal)) {
          msgFromServer = firstVal[0];
        } else if (typeof firstVal === "string") {
          msgFromServer = firstVal;
        }
      }

      toast.error(msgFromServer || "Failed to update status.");
    }
  };

  // 🔹 derived status options (dynamic)
  const byStatus = summary?.by_status || {};

  const allStatusCodes = useMemo(() => {
    const fromConfigs = statusConfigs.map((cfg) => cfg.code);
    const fromSummary = Object.keys(byStatus);
    const set = new Set([...fromConfigs, ...fromSummary]);
    return Array.from(set);
  }, [statusConfigs, byStatus]);

  const statusFilterOptions = useMemo(() => {
    const opts = allStatusCodes.map((code) => ({
      value: code,
      label: statusLabelForCode(code),
    }));
    return [{ value: "", label: "All status" }, ...opts];
  }, [allStatusCodes, statusConfigs]); // statusLabelForCode depends on configs

  const statusChangeOptions = useMemo(
    () => statusConfigs, // sab dikhao, including CONVERTED
    [statusConfigs]
  );

  const totalOpp = summary?.total ?? count;

  return (
    <div className="leads-list-page">
      <div className="leads-list-container">
        {/* Header */}
        <div className="list-header">
          {/* LEFT: Search */}
          <div className="list-header-left">
            <SearchBar
              value={q}
              onChange={handleSearchChange}
              placeholder="Search by name, email, mobile..."
              wrapperClassName="search-box"
            />
          </div>

          {/* RIGHT: Filters + Excel + Add Opportunity */}
          <div className="list-header-right">
            <input
              id="opp-excel-input"
              type="file"
              accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: "none" }}
              onChange={handleExcelChange}
            />

            <button
              type="button"
              className="filter-btn"
              onClick={() => setModalOpen(true)}
            >
              <i className="fa fa-filter" /> Filters
            </button>

            <button
              type="button"
              className="filter-btn"
              onClick={downloadSampleExcel}
            >
              ⬇ Sample excel
            </button>

            <button
              type="button"
              className="filter-btn"
              onClick={() => document.getElementById("opp-excel-input")?.click()}
              disabled={excelUploading}
            >
              {excelUploading ? "Importing..." : "📥 Import excel"}
            </button>

            <button
              className="btn-add"
              onClick={() => navigate("/sales/opportunities/add")}
            >
              <i className="fa fa-plus" style={{ marginRight: "6px" }} />
              Add opportunity
            </button>
          </div>
        </div>

      {/* Stats row */}
      {/* <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Opportunities</div>
          <div className="stat-value">{totalOpp}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status Breakdown</div>
          <div className="stat-value-small">
            {allStatusCodes.length ? (
              allStatusCodes.map((st) => (
                <span
                  key={st}
                  style={{
                    marginRight: "12px",
                    fontSize: "12px",
                    color: getStatusColor(st),
                  }}
                >
                  {statusLabelForCode(st)}: {byStatus[st] ?? 0}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                No data yet
              </span>
            )}
          </div>
        </div>
      </div> */}

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Actions</th>
              <th>Full Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Source System</th>
              <th>Source Name</th>
              <th>Project</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div className="loading-spinner"></div>
                  <div style={{ marginTop: "12px", color: "#6b7280" }}>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((o) => {
                const contact = o.mobile_number || "-";
                const projectName = toSentenceCase(
                  o.project_name || o.project?.name || o.project || "-"
                );

                return (
                  <tr key={o.id}>
                    <td className="row-actions">
                      {/* Convert */}
                      {/* <button
                        className="icon-btn icon-btn-view"
                        title="Convert to Lead"
                        onClick={() => handleConvert(o.id)}
                      >
                        <i className="fa fa-exchange" />
                      </button> */}
                      {/* Change Status */}
                      <button
                        className="icon-btn icon-btn-edit"
                        title="Change status"
                        onClick={() => openStatusModal(o)}
                        style={{ marginLeft: "4px" }}
                      >
                        <i className="fa fa-tag" />
                      </button>
                    </td>
                    <td>{o.full_name || "-"}</td>
                    <td>📱 {contact}</td>
                    <td>{o.email ? toTitleCase(o.email) : "-"}</td>
                    <td>{toSentenceCase(o.source_system || "")}</td>
                    <td>{o.source_name ? toTitleCase(o.source_name) : "-"}</td>
                    <td>{projectName}</td>
                    <td>
                      {o.status_config_label ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(
                              o.status_config_code || ""
                            )}20`,
                            color: getStatusColor(o.status_config_code || ""),
                          }}
                        >
                          {toSentenceCase(o.status_config_label)}
                        </span>
                      ) : (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: "#e5e7eb",
                            color: "#4b5563",
                          }}
                        >
                          Fresh
                        </span>
                      )}
                    </td>

                    <td>{formatDT(o.created_at)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    📭
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    No opportunities found
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    Try adjusting your filters or search query
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination BELOW table */}
      <div className="pagination-info">
        {count > 0 ? (
          <>
            {(page - 1) * 10 + 1}-{Math.min(page * 10, count)} of {count}
          </>
        ) : (
          "No results"
        )}
        <button
          className="pagination-btn"
          onClick={() => {
            const newPage = page - 1;
            setPage(newPage);
            fetchList({ page: newPage });
          }}
          disabled={page === 1}
        >
          ❮
        </button>
        <button
          className="pagination-btn"
          onClick={() => {
            const newPage = page + 1;
            setPage(newPage);
            fetchList({ page: newPage });
          }}
          disabled={page >= totalPages}
        >
          ❯
        </button>
      </div>
      </div>

      {/* Filter Modal */}
      {modalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>🔍 Filters</h3>
              <button
                className="filter-close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              {/* Status */}
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusFilterOptions.map((s) => (
                  <option key={s.value || "ALL"} value={s.value}>
                    {toSentenceCase(s.label)}
                  </option>
                ))}
              </select>

              {/* Multi project */}
              <label className="filter-label">Projects</label>
              <div className="filter-multi-projects">
                {!projects.length && (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    No projects found in scope.
                  </div>
                )}
                {projects.map((p) => {
                  const idStr = String(p.id);
                  return (
                    <label
                      key={p.id}
                      className="checkbox-label"
                      style={{ display: "block", marginBottom: "4px" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(idStr)}
                        onChange={(e) => toggleProject(idStr, e.target.checked)}
                      />{" "}
                      {toSentenceCase(p.name)}
                    </label>
                  );
                })}
              </div>

              {/* Date range */}
              <label className="filter-label">Start date</label>
              <input
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label className="filter-label">End date</label>
              <input
                type="date"
                className="filter-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button className="btn-secondary" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn-primary" onClick={applyFilters}>
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Status Change Modal */}
      {statusModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>Change opportunity status</h3>
              <button
                className="filter-close"
                onClick={() => setStatusModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <div
                style={{
                  fontSize: 13,
                  marginBottom: 8,
                  color: "#4b5563",
                }}
              >
                {statusTarget && (
                  <>
                    <div>
                      <strong>Opportunity:</strong>{" "}
                      {statusTarget.full_name || "-"}
                    </div>
                    <div>
                      <strong>Current status:</strong>{" "}
                      {toSentenceCase(
                        statusTarget.status_config_label ||
                          statusTarget.status_config_code ||
                          statusLabelForCode(statusTarget.status) ||
                          "-"
                      )}
                    </div>
                  </>
                )}
              </div>

              <label className="filter-label">New status</label>
              <select
                className="filter-select"
                value={statusChangeValue}
                onChange={(e) => setStatusChangeValue(e.target.value)}
              >
                <option value="">Select status</option>
                {statusChangeOptions.map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>
                    {toSentenceCase(cfg.label)}
                    {cfg.can_convert ? " (Auto-convert)" : ""}
                  </option>
                ))}
              </select>

              <label className="filter-label">Comment (optional)</label>
              <textarea
                className="filter-input"
                rows={3}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Reason / note for this status change"
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="filter-actions">
              <button
                className="btn-secondary"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={submitStatusChange}>
                Update status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
