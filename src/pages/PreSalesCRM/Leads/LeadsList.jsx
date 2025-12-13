// src/pages/.../LeadsList.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LeadAPI } from "../../../api/endpoints";
import SearchBar from "../../../common/SearchBar";
import "./LeadsList.css";

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function LeadsList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    project: "",
  });

  const [modalOpen, setModalOpen] = useState(false);

  // 🔹 NEW: Import Excel modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [scopeProjects, setScopeProjects] = useState([]);
  const [importProjectId, setImportProjectId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null); // API ka full response

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
        // ek hi project hai -> auto select
        setImportProjectId(String(projects[0].id));
      }
    } catch (err) {
      console.error("Failed to parse MY_SCOPE", err);
    }
  }, []);

  // ---------- 1) Stable fetchList using useCallback ----------
  const fetchList = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const searchParam =
          typeof opts.q === "string" ? opts.q : q || undefined;
        const pageParam =
          typeof opts.page === "number" && opts.page > 0
            ? opts.page
            : page || 1;

        const params = {
          search: searchParam,
          page: pageParam,
          status: opts.status ?? filters.status,
          source: opts.source ?? filters.source,
          project: opts.project ?? filters.project,
        };

        const data = await LeadAPI.list(params);

        const items = Array.isArray(data) ? data : data.results ?? [];
        setRows(items);
        setCount(
          Array.isArray(data) ? items.length : data.count ?? items.length
        );
      } catch (e) {
        console.error("Failed to load leads", e);
      } finally {
        setLoading(false);
      }
    },
    [q, page, filters]
  );

  // ---------- 2) Debounced search that uses latest fetchList ----------
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        // always search from page 1 when typing
        fetchList({ q: val, page: 1 });
      }, 350),
    [fetchList]
  );

  // ---------- 3) Initial load ----------
  useEffect(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);

  // ---------- 4) SearchBar handler ----------
  const handleSearchChange = (value) => {
    setQ(value);
    setPage(1);
    debouncedSearch(value);
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

    // page 1 + no filters
    fetchList({ ...cleared, q: "", page: 1 });
  };

  const applyFilters = () => {
    setPage(1);
    setModalOpen(false);

    // current filters + current search
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

  const handleDownloadSample = () => {
    // 👇 Columns aligned with backend import_excel
    const header = [
      "first_name",
      "last_name",
      "email",
      "mobile_number",
      "company",
      "budget",
      "annual_income",
      "walking", // "true" / "false"
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
      "cp_email", // Channel Partner user email
      "assign_to_email",
    ];

    const sampleRow = [
      "Rahul",
      "Sharma",
      "rahul@example.com",
      "9876543210",
      "ABC Corp",
      "30000000", // budget
      "2500000", // annual_income
      "true", // walking -> "true" / "false"
      "0221234567", // tel_res
      "0227654321", // tel_office
      "Hot", // classification
      "Interested - High Budget", // sub_classification
      "Website", // source
      "Google Ads", // sub_source
      "Open", // status
      "Contacted", // sub_status
      "Investment", // purpose
      "New Lead", // stage (LeadStage.name)
      "cp1@example.com", // cp_email (role = CHANNEL_PARTNER)
      "vasisayed09421@gmail.com",
    ];

    const csvContent = `${header.join(",")}\n${sampleRow.join(",")}`;

    // 👇 keep content CSV but download as .xlsx (Excel-friendly)
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
      formData.append("project_id", importProjectId); // optional body

      const data = await LeadAPI.importExcel(importProjectId, formData);

      setImportResult(data);

      // Kuch leads create hue to list refresh
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
              placeholder="Search leads by name, email, phone..."
              wrapperClassName="search-box"
            />
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
                  <th>ID</th>
                  <th>Lead Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Latest Remarks</th>
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
                      (lead.latest_remarks && lead.latest_remarks.trim()) ||
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
                          <button
                            title="Delete"
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(lead.id)}
                          >
                            🗑️
                          </button>
                        </td>
                        <td>{leadId}</td>
                        <td className="lead-name">{leadName}</td>
                        <td>{contact}</td>
                        <td className="email-cell">{email}</td>
                        <td>{sourceFormatted}</td>
                        <td>{project}</td>
                        <td>{budget}</td>

                        <td>
                          <span
                            className={`status-badge ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>{assignedTo}</td>
                        <td className="remarks-cell">{latestRemarks}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-state">
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

              {/* future me yaha Source / Project bhi add kar sakte hain */}
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
                  Required columns: <b>first_name, mobile_number</b>.{" "}
                  {/* <br />
                  Optional: last_name, company, budget, annual_income, walking (
                  <code>true</code>/<code>false</code>), tel_res, tel_office,
                  classification, sub_classification, source, sub_source,
                  status, sub_status, purpose, stage, cp_email. */}
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
