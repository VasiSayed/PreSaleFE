import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LeadAPI } from "../../../api/endpoints";
import SearchBar from "../../../common/SearchBar";
import "./LeadsList.css";

const SEARCH_DELAY_MS = 5000; // ✅ Auto search after 5 sec
const MIN_AUTO_CHARS = 2; // ✅ 2 chars se kam pe auto hit nahi

function debounce(fn, delay) {
  let timeoutId;

  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}

// Helper: Convert text to title case (first letter of every word capitalized)
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ✅ SearchBar kabhi string deta hai, kabhi event (e.target.value)
function getInputValue(val) {
  if (typeof val === "string") return val;
  if (
    val &&
    typeof val === "object" &&
    val.target &&
    typeof val.target.value === "string"
  ) {
    return val.target.value;
  }
  return "";
}

export default function LeadsList() {
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (userData?.role || "").toUpperCase();
  const canDelete = userRole === "ADMIN";

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  // ✅ Filters state FIRST
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    project: "",
  });

  // ✅ Sorting state (API ordering)
  const [sortKey, setSortKey] = useState(""); // e.g. "status"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"
  const [ordering, setOrdering] = useState(""); // final param sent to API

  // ✅ Hide Columns state
  const DEFAULT_VISIBLE = {
    id: true,
    lead_name: true,
    contact: true,
    email: true,
    source: true,
    project: true,
    budget: true,
    is_deal: true, // ✅ NEW column
    status: true,
    assigned_to: true,
    latest_remarks: true,
  };

  const [colVis, setColVis] = useState(DEFAULT_VISIBLE);
  const [colsModalOpen, setColsModalOpen] = useState(false);
  const [tempColVis, setTempColVis] = useState(DEFAULT_VISIBLE);

  // ✅ keep latest values for stable debounce + fetchList
  const qRef = useRef("");
  const pageRef = useRef(1);
  const filtersRef = useRef({ status: "", source: "", project: "" });
  const orderingRef = useRef("");

  useEffect(() => {
    qRef.current = q;
  }, [q]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    orderingRef.current = ordering;
  }, [ordering]);

  const [modalOpen, setModalOpen] = useState(false);

  // 🔹 Import Excel modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [scopeProjects, setScopeProjects] = useState([]);
  const [importProjectId, setImportProjectId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

  // ---------- MY_SCOPE se projects load karo ----------
  useEffect(() => {
    const raw = localStorage.getItem("MY_SCOPE");
    if (!raw) return;

    try {
      const scope = JSON.parse(raw);

      let projects = [];
      if (Array.isArray(scope.projects)) {
        projects = scope.projects;
      } else if (Array.isArray(scope.project_scope)) {
        projects = scope.project_scope;
      } else if (Array.isArray(scope.project_list)) {
        projects = scope.project_list;
      }

      setScopeProjects(projects || []);

      if (projects && projects.length === 1) {
        setImportProjectId(String(projects[0].id));
      }
    } catch (err) {
      console.error("Failed to parse MY_SCOPE", err);
    }
  }, []);

  // ✅ Columns config (label + backend ordering token)
  // NOTE: backend must support these ordering keys; if not supported, button will still call API but ordering may fallback.
  const COLS = useMemo(
    () => [
      { id: "id", label: "ID", orderingKey: "id" },
      { id: "lead_name", label: "Lead Name", orderingKey: "name" }, // if backend supports name
      { id: "contact", label: "Contact", orderingKey: "" }, // optional: add backend ordering if needed
      { id: "email", label: "Email", orderingKey: "email" },
      { id: "source", label: "Source", orderingKey: "source" },
      { id: "project", label: "Project", orderingKey: "project" },
      { id: "budget", label: "Budget", orderingKey: "budget" },
      { id: "is_deal", label: "IMP", orderingKey: "deal" }, // ✅ deal first/last via alias
      { id: "status", label: "Status", orderingKey: "status" },
      { id: "assigned_to", label: "Assigned To", orderingKey: "assign_to" },
      { id: "latest_remarks", label: "Latest Remarks", orderingKey: "" },
    ],
    [],
  );

  const visibleColCount = useMemo(() => {
    const visible = COLS.filter((c) => colVis[c.id]).length;
    return 1 + visible; // + Actions
  }, [COLS, colVis]);

  // ---------- 1) Stable fetchList (no deps) ----------
  const fetchList = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const latestQ = qRef.current || "";
      const latestPage = pageRef.current || 1;
      const latestFilters = filtersRef.current || {
        status: "",
        source: "",
        project: "",
      };
      const latestOrdering = orderingRef.current || "";

      const searchParam = typeof opts.q === "string" ? opts.q : latestQ;
      const pageParam =
        typeof opts.page === "number" && opts.page > 0 ? opts.page : latestPage;

      const params = {
        page: pageParam,
        status: opts.status ?? latestFilters.status,
        source: opts.source ?? latestFilters.source,
        project: opts.project ?? latestFilters.project,
        ordering: opts.ordering ?? latestOrdering, // ✅ NEW
      };

      const cleanedQ = (searchParam || "").trim();
      if (cleanedQ) {
        params.q = cleanedQ;
        params.search = cleanedQ;
      }

      const data = await LeadAPI.list(params);

      const items = Array.isArray(data) ? data : (data.results ?? []);
      setRows(items);
      setCount(
        Array.isArray(data) ? items.length : (data.count ?? items.length),
      );
    } catch (e) {
      console.error("Failed to load leads", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- 2) Debounced search (5 sec) ----------
  const debouncedSearch = useMemo(() => {
    return debounce((val) => {
      fetchList({ q: val, page: 1 });
    }, SEARCH_DELAY_MS);
  }, [fetchList]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  // ---------- 3) Initial load ----------
  useEffect(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);

  // ---------- 4) Search handlers ----------
  const handleSearchChange = (valueOrEvent) => {
    const v = getInputValue(valueOrEvent);
    setQ(v);
    setPage(1);

    const trimmed = v.trim();

    if (!trimmed) {
      debouncedSearch.cancel?.();
      fetchList({ q: "", page: 1 });
      return;
    }

    if (trimmed.length < MIN_AUTO_CHARS) {
      debouncedSearch.cancel?.();
      return;
    }

    debouncedSearch(trimmed);
  };

  const handleSearchNow = () => {
    debouncedSearch.cancel?.();
    const trimmed = (q || "").trim();
    setPage(1);
    fetchList({ q: trimmed, page: 1 });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await LeadAPI.delete(id);
      alert("Lead deleted successfully!");
      fetchList();
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Failed to delete lead");
    }
  };

  const resetFilters = () => {
    const cleared = { status: "", source: "", project: "" };
    setFilters(cleared);
    setQ("");
    setPage(1);
    setModalOpen(false);

    debouncedSearch.cancel?.();
    fetchList({ ...cleared, q: "", page: 1 });
  };

  const applyFilters = () => {
    setPage(1);
    setModalOpen(false);

    debouncedSearch.cancel?.();
    fetchList({
      status: filters.status,
      source: filters.source,
      project: filters.project,
      q,
      page: 1,
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("new") || statusLower.includes("fresh"))
      return "badge-new";
    if (statusLower.includes("contact") || statusLower.includes("working"))
      return "badge-contacted";
    if (statusLower.includes("qualified")) return "badge-qualified";
    if (statusLower.includes("won") || statusLower.includes("converted"))
      return "badge-converted";
    if (statusLower.includes("lost")) return "badge-lost";
    return "badge-default";
  };

  // ✅ Sort handler (API ordering)
  const buildOrderingParam = (key, dir) => {
    if (!key) return "";
    // deal alias: "deal" = deals first, "-deal" = deals last
    if (key === "deal") return dir === "asc" ? "deal" : "-deal";
    return dir === "asc" ? key : `-${key}`;
  };

  const handleSort = (orderingKey) => {
    if (!orderingKey) return;

    setPage(1);

    // toggle
    setSortKey((prevKey) => {
      const nextKey = orderingKey;

      setSortDir((prevDir) => {
        const nextDir =
          prevKey === nextKey ? (prevDir === "asc" ? "desc" : "asc") : "asc";

        const nextOrdering = buildOrderingParam(nextKey, nextDir);
        setOrdering(nextOrdering);

        // ✅ hit API with ordering
        fetchList({ page: 1, ordering: nextOrdering });

        return nextDir;
      });

      return nextKey;
    });
  };

  // ---------- Hide columns modal helpers ----------
  const openColsModal = () => {
    setTempColVis(colVis);
    setColsModalOpen(true);
  };

  const applyCols = () => {
    setColVis(tempColVis);
    setColsModalOpen(false);
  };

  const selectAllCols = () => {
    const all = {};
    COLS.forEach((c) => (all[c.id] = true));
    setTempColVis(all);
  };

  const clearAllCols = () => {
    const none = {};
    COLS.forEach((c) => (none[c.id] = false));
    setTempColVis(none);
  };

  const handleDownloadSample = () => {
    const header = [
      "first_name",
      "last_name",
      "email",
      "mobile_number",
      "company",
      "budget",
      "annual_income",
      "walking",
      "tel_res",
      "tel_office",
      "classification",
      "sub_classification",
      "source",
      "sub_source",
      "status",
      "sub_status",
      "purpose",
      "stage",
      "cp_email",
      "assign_to_email",
    ];

    const sampleRow = [
      "Rahul",
      "Sharma",
      "rahul@example.com",
      "9876543210",
      "ABC Corp",
      "30000000",
      "2500000",
      "true",
      "0221234567",
      "0227654321",
      "Hot",
      "Interested - High Budget",
      "Website",
      "Google Ads",
      "Open",
      "Contacted",
      "Investment",
      "New Lead",
      "cp1@example.com",
      "vasisayed09421@gmail.com",
    ];

    const csvContent = `${header.join(",")}\n${sampleRow.join(",")}`;

    const blob = new Blob([csvContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sales_leads_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------- Import Excel helpers ----------
  const openImportModal = () => {
    setImportResult(null);
    setImportFile(null);
    setImportModalOpen(true);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    setImportFile(file || null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();

    if (!importProjectId) {
      alert("Please select a project");
      return;
    }
    if (!importFile) {
      alert("Please select an Excel file");
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("project_id", importProjectId);

      const data = await LeadAPI.importExcel(importProjectId, formData);

      setImportResult(data);

      if (data?.created_count > 0) {
        fetchList({ page: 1 });
      }
    } catch (err) {
      console.error("Excel import failed", err);
      const apiData = err?.response?.data;

      setImportResult({
        project_id: importProjectId,
        created_count: 0,
        created_ids: [],
        error_count: 1,
        errors: [
          {
            row: "-",
            name: "",
            errors: [
              apiData?.detail ||
                "Import failed. Please check the file and try again.",
            ],
          },
        ],
      });
    } finally {
      setImportLoading(false);
    }
  };

  // header cell with sort button
  const HeaderCell = ({ label, orderingKey }) => {
    const active = orderingKey && sortKey === orderingKey;
    const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "↕";

    return (
      <div className="th-wrap">
        <span>{label}</span>
        <button
          type="button"
          className={`th-sort-btn ${active ? "active" : ""}`}
          onClick={() => handleSort(orderingKey)}
          disabled={!orderingKey || loading}
          title={
            orderingKey
              ? `Sort by ${label}`
              : "Sorting not available for this column"
          }
        >
          {arrow}
        </button>
      </div>
    );
  };

  return (
    <div className="leads-list-page">
      <div className="leads-list-container">
        {/* Header */}
        <div className="list-header">
          {/* LEFT: Search */}
          <div className="list-header-left" style={{ display: "flex", gap: 8 }}>
            <SearchBar
              value={q}
              onChange={(val) => handleSearchChange(val)}
              placeholder="Search leads by name, email, phone..."
              wrapperClassName="search-box"
            />

            <button
              type="button"
              className="filter-btn"
              onClick={handleSearchNow}
              disabled={loading}
              title="Instant search (no wait)"
            >
              🔎 Search
            </button>
          </div>

          {/* RIGHT: Filters + Excel + Add Lead */}
          <div className="list-header-right">
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
              onClick={handleDownloadSample}
            >
              ⬇ Sample Excel
            </button>

            <button
              type="button"
              className="filter-btn"
              onClick={openImportModal}
            >
              📥 Import Excel
            </button>

            {/* ✅ NEW: Hide Columns */}
            <button
              type="button"
              className="filter-btn"
              onClick={openColsModal}
              title="Show/Hide table columns"
            >
              👁️ Columns
            </button>

            <button
              className="filter-btn"
              onClick={() => navigate("/leads/new")}
            >
              <i className="fa fa-plus" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading leads...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Actions</th>

                  {colVis.id && (
                    <th>
                      <HeaderCell label="ID" orderingKey="id" />
                    </th>
                  )}
                  {colVis.lead_name && (
                    <th>
                      <HeaderCell label="Lead Name" orderingKey="name" />
                    </th>
                  )}
                  {colVis.contact && (
                    <th>
                      <HeaderCell label="Contact" orderingKey="" />
                    </th>
                  )}
                  {colVis.email && (
                    <th>
                      <HeaderCell label="Email" orderingKey="email" />
                    </th>
                  )}
                  {colVis.source && (
                    <th>
                      <HeaderCell label="Source" orderingKey="source" />
                    </th>
                  )}
                  {colVis.project && (
                    <th>
                      <HeaderCell label="Project" orderingKey="project" />
                    </th>
                  )}
                  {colVis.budget && (
                    <th>
                      <HeaderCell label="Budget" orderingKey="budget" />
                    </th>
                  )}
                  {colVis.is_deal && (
                    <th style={{ width: 80 }}>
                      <HeaderCell label="IMP" orderingKey="deal" />
                    </th>
                  )}
                  {colVis.status && (
                    <th>
                      <HeaderCell label="Status" orderingKey="status" />
                    </th>
                  )}
                  {colVis.assigned_to && (
                    <th>
                      <HeaderCell label="Assigned To" orderingKey="assign_to" />
                    </th>
                  )}
                  {colVis.latest_remarks && (
                    <th>
                      <HeaderCell label="Latest Remarks" orderingKey="" />
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((lead) => {
                    const leadId =
                      lead.lead_code || lead.code || `L-${lead.id}`;

                    const leadNameRaw =
                      lead.lead_name ||
                      [lead.first_name, lead.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      "-";
                    const leadName =
                      leadNameRaw !== "-" ? toTitleCase(leadNameRaw) : "-";

                    const contact =
                      lead.mobile_number ||
                      lead.contact_number ||
                      lead.phone ||
                      "-";

                    const email = lead.email ? toTitleCase(lead.email) : "-";

                    const source =
                      lead.source_name ||
                      lead.lead_source_name ||
                      lead.source?.name ||
                      "-";
                    const sourceFormatted =
                      source !== "-" ? toTitleCase(source) : "-";

                    const latestRemarksRaw =
                      (lead.latest_remarks &&
                        String(lead.latest_remarks).trim()) ||
                      "NA";
                    const latestRemarks =
                      latestRemarksRaw !== "NA"
                        ? toTitleCase(latestRemarksRaw)
                        : "NA";

                    const project =
                      lead.project_name ||
                      lead.project?.name ||
                      lead.project_lead?.project?.name ||
                      "-";

                    const budget =
                      lead.budget != null
                        ? `₹${Number(lead.budget).toLocaleString()}`
                        : "-";

                    const status =
                      lead.status_name ||
                      lead.status?.name ||
                      lead.stage_name ||
                      lead.sub_status?.name ||
                      "New";

                    const assignedTo =
                      lead.assigned_to_name ||
                      lead.assign_to_name ||
                      lead.current_owner?.name ||
                      "-";

                    const isDeal = !!lead.is_deal;

                    return (
                      <tr key={lead.id}>
                        <td className="row-actions">
                          <button
                            title="View"
                            className="action-btn view-btn"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            👁️
                          </button>
                          <button
                            title="Edit"
                            className="action-btn edit-btn"
                            onClick={() => navigate(`/leads/new/${lead.id}`)}
                          >
                            ✏️
                          </button>
                          {canDelete && (
                            <button
                              title="Delete"
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(lead.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </td>

                        {colVis.id && <td>{leadId}</td>}
                        {colVis.lead_name && (
                          <td className="lead-name">{leadName}</td>
                        )}
                        {colVis.contact && <td>{contact}</td>}
                        {colVis.email && (
                          <td className="email-cell">{email}</td>
                        )}
                        {colVis.source && <td>{sourceFormatted}</td>}
                        {colVis.project && <td>{project}</td>}
                        {colVis.budget && <td>{budget}</td>}

                        {/* ✅ NEW: IMP / is_deal */}
                        {colVis.is_deal && (
                          <td>
                            <span
                              className={`deal-pill ${isDeal ? "yes" : "no"}`}
                            >
                              {isDeal ? "DEAL" : "-"}
                            </span>
                          </td>
                        )}

                        {colVis.status && (
                          <td>
                            <span
                              className={`status-badge ${getStatusBadgeClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                        )}

                        {colVis.assigned_to && <td>{assignedTo}</td>}
                        {colVis.latest_remarks && (
                          <td className="remarks-cell">{latestRemarks}</td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={visibleColCount} className="empty-state">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Columns Modal */}
      {colsModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>👁️ Columns</h3>
              <button
                className="filter-close"
                onClick={() => setColsModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={selectAllCols}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearAllCols}
                >
                  Clear All
                </button>
              </div>

              <div className="cols-grid">
                {COLS.map((c) => (
                  <label key={c.id} className="col-check">
                    <input
                      type="checkbox"
                      checked={!!tempColVis[c.id]}
                      onChange={(e) =>
                        setTempColVis((prev) => ({
                          ...prev,
                          [c.id]: e.target.checked,
                        }))
                      }
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setColsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={applyCols}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Import Excel Modal */}
      {importModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>📥 Import Leads from Excel</h3>
              <button
                className="filter-close"
                onClick={() => setImportModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div className="filter-body">
                <label className="filter-label">Project</label>
                {scopeProjects.length > 0 ? (
                  <select
                    className="filter-select"
                    value={importProjectId}
                    onChange={(e) => setImportProjectId(e.target.value)}
                    disabled={scopeProjects.length === 1}
                  >
                    <option value="">-- Select Project --</option>
                    {scopeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.project_name || `Project #${p.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="small-hint">
                    No projects found in MY_SCOPE. Please re-login or check
                    /client/my-scope/.
                  </p>
                )}

                <label className="filter-label" style={{ marginTop: "12px" }}>
                  Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFileChange}
                />
                <p className="small-hint">
                  Required columns: <b>first_name, mobile_number</b>.
                </p>

                {importResult && (
                  <div
                    className={`import-result ${
                      (importResult.error_count ?? 0) > 0
                        ? "has-errors"
                        : "has-success"
                    }`}
                  >
                    <div className="import-summary">
                      <span>
                        Created:&nbsp;
                        <span className="created-count">
                          {importResult.created_count ?? 0}
                        </span>
                      </span>
                      <span>
                        Errors:&nbsp;
                        <span className="error-count">
                          {importResult.error_count ?? 0}
                        </span>
                      </span>
                    </div>

                    <p
                      className={`import-message ${
                        (importResult.error_count ?? 0) > 0
                          ? "import-message-error"
                          : "import-message-success"
                      }`}
                    >
                      {(importResult.error_count ?? 0) > 0
                        ? "Some rows could not be imported. Please check the errors below."
                        : "All rows imported successfully."}
                    </p>

                    {Array.isArray(importResult.errors) &&
                      importResult.errors.length > 0 && (
                        <div className="import-errors-list">
                          <h4>Row level errors</h4>
                          <ul>
                            {importResult.errors.map((errObj, idx) => (
                              <li key={idx}>
                                <strong>Row {errObj.row}</strong>
                                {errObj.name ? ` (${errObj.name})` : ""}:{" "}
                                {Array.isArray(errObj.errors)
                                  ? errObj.errors.join("; ")
                                  : String(errObj.errors)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setImportModalOpen(false)}
                  disabled={importLoading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={importLoading || !importProjectId || !importFile}
                >
                  {importLoading ? "Importing..." : "Start Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
