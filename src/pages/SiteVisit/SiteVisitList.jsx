import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";
import "../PreSalesCRM/Leads/LeadsList.css"; // Use LeadsList CSS for consistent styling

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
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


const formatDMY = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};



export default function SiteVisitList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        search: opts.q ?? q,
        status: opts.status ?? status,
        project: opts.project ?? project,
        start_date: opts.start_date ?? startDate,
        end_date: opts.end_date ?? endDate,
        page: opts.page ?? page,
      };

      const r = await axiosInstance.get("/sales/site-visits/summary/", {
        params,
      });
      const data = r.data;

      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);
      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);

      // Extract unique projects
      const projectMap = new Map();
      items.forEach((item) => {
        if (item.project && !projectMap.has(item.project)) {
          projectMap.set(item.project, {
            id: item.project,
            name: item.project,
          });
        }
      });
      setProjects(Array.from(projectMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((val) => {
      setPage(1);
      fetchList({ q: val, page: 1 });
    }, 350),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, project, startDate, endDate]
  );

  const handleSearchChange = (value) => {
    setQ(value);
    setPage(1);
    debouncedSearch(value);
  };

  useEffect(() => {
    const loadScopeAndFetch = async () => {
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        const data = res.data || {};

        // Projects extract karne ka generic logic (shape kuch bhi ho)
        let scopeProjects = [];

        if (Array.isArray(data.projects)) {
          scopeProjects = data.projects.map((p) => ({
            id: p.id ?? p.project_id,
            name:
              p.name ?? p.project_name ?? `Project #${p.id || p.project_id}`,
          }));
        } else if (Array.isArray(data.accesses)) {
          // fallback if your scope response has `accesses`
          scopeProjects = data.accesses.map((a) => ({
            id: a.project_id,
            name: a.project_name,
          }));
        }

        // Sirf valid ids rakho
        scopeProjects = scopeProjects.filter((p) => p.id);
        setProjects(scopeProjects);

        if (scopeProjects.length > 0) {
          // ✅ Auto-select first project (even if multiple)
          const defaultProjectId = String(scopeProjects[0].id);
          setProject(defaultProjectId);

          // summary API ko project id ke saath call karo
          fetchList({
            page: 1,
            project: defaultProjectId,
          });
        } else {
          // no projects → simple fetch
          fetchList({ page: 1 });
        }
      } catch (err) {
        console.error("Failed to load my-scope", err);
        // fallback without project filter
        fetchList({ page: 1 });
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

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "NO_SHOW", label: "No Show" },
    { value: "RESCHEDULED", label: "Rescheduled" },
  ];

  const resetFilters = () => {
    setStatus("");
    setProject("");
    setStartDate("");
    setEndDate("");
    setQ("");
    setModalOpen(false);
    fetchList({
      q: "",
      status: "",
      project: "",
      start_date: "",
      end_date: "",
      page: 1,
    });
  };

  const applyFilters = () => {
    setModalOpen(false);
    fetchList({
      q,
      status,
      project,
      start_date: startDate,
      end_date: endDate,
      page: 1,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "#3b82f6";
      case "COMPLETED":
        return "#059669";
      case "CANCELLED":
        return "#dc2626";
      case "NO_SHOW":
        return "#f59e0b";
      case "RESCHEDULED":
        return "#6366f1";
      default:
        return "#6b7280";
    }
  };

  const renderLatestRemark = (remark) => {
    if (!remark) {
      return (
        <div className="remark-cell">
          <div className="remark-empty">—</div>
        </div>
      );
    }

    const fullText = toTitleCase(remark);
    const displayText = remark.length > 150 ? remark.slice(0, 150).trim() + "…" : remark;

    return (
      <div className="remark-cell" title={fullText}>
        <div className="remark-content">
          {toTitleCase(displayText)}
        </div>
      </div>
    );
  };

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
              placeholder="Search by lead name, mobile, project..."
              wrapperClassName="search-box"
            />
          </div>

          {/* RIGHT: Filters */}
          <div className="list-header-right">
            <button className="filter-btn" onClick={() => setModalOpen(true)}>
              <i className="fa fa-filter" /> Filters
            </button>

            {/* <button
              className="filter-btn"
              onClick={() => navigate("/sales/lead/site-visit/create")}
            >
              <i className="fa fa-plus" />
              Add Site Visit
            </button> */}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Actions</th>
                <th>Lead Name</th>
                <th>Mobile</th>
                <th>Project</th>
                <th>Latest Visit</th>
                <th>Status</th>
                <th>Total Visits Schedule</th>
                <th style={{ width: 320, minWidth: 280 }}>Latest Remark</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  {/* 👇 7 → 8 because 8 columns */}
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    <div className="loading-spinner"></div>
                    <div style={{ marginTop: "12px", color: "#6b7280" }}>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((v) => (
                  <tr key={v.lead_id}>
                    <td className="row-actions">
                      <button
                        className="icon-btn icon-btn-view"
                        title="View All Visits"
                        onClick={() =>
                          navigate(
                            `/sales/lead/site-visit/by-lead/${v.lead_id}`
                          )
                        }
                      >
                        <i className="fa fa-eye" />
                      </button>
                    </td>

                    <td>
                      <div className="lead-name">
                        {toTitleCase(v.lead_name || "")}
                      </div>
                    </td>
                    <td>
                      {/* <div className="mobile-number">📱 {v.mobile}</div> */}
                      <div className="mobile-number">{v.mobile}</div>
                    </td>
                    <td>
                      <div className="project-name">
                        {toTitleCase(v.project || "")}
                      </div>
                    </td>
                    <td>{formatDMY(v.latest_scheduled_at)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(
                            v.latest_status
                          )}20`,
                          color: getStatusColor(v.latest_status),
                        }}
                      >
                        {toTitleCase(v.latest_status || "")}
                      </span>
                    </td>
                    <td>
                      <span className="visits-count">{v.total_visits}</span>
                    </td>
                    {/* 👇 NEW: Latest Remark column */}
                    <td>{renderLatestRemark(v.latest_remarks)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* 👇 7 → 8 here too */}
                  <td
                    colSpan={8}
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
                      No site visits found
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
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <label className="filter-label">Project</label>
              <select
                className="filter-select"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {toTitleCase(p.name || "")}
                  </option>
                ))}
              </select>

              <label className="filter-label">Start Date</label>
              <input
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label className="filter-label">End Date</label>
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
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
