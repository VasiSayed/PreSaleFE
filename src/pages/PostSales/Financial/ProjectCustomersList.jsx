import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";
import "./v2.css";

/* ---------------- helpers ---------------- */

function toTitleCase(text) {
  if (text === null || text === undefined) return "";
  const s = String(text).trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDMY(dateStr) {
  // supports: "YYYY-MM-DD" and ISO "YYYY-MM-DDTHH:mm:ss"
  if (!dateStr) return "-";
  const s = String(dateStr).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

function inr(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Pagination({ page, pageSize, count, onPage }) {
  const total = Math.max(1, Math.ceil((count || 0) / (pageSize || 20)));
  return (
    <div className="pc-pagination">
      <button
        className="dn-btn dn-btn-light"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </button>

      <div className="pc-page-meta">
        Page <b>{page}</b> / {total} • Total <b>{count || 0}</b>
      </div>

      <button
        className="dn-btn dn-btn-light"
        disabled={page >= total}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

const SCOPE_KEY = "DN_SCOPE_V2";

function readStoredScope() {
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeStoredScope(scope) {
  try {
    localStorage.setItem(SCOPE_KEY, JSON.stringify(scope));
  } catch {}
}

export default function ProjectCustomersList() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  // ✅ Outside only search + buttons
  const [search, setSearch] = useState(sp.get("search") || "");

  // pagination (URL me sirf yahi)
  const [page, setPage] = useState(Number(sp.get("page") || 1));
  const [pageSize, setPageSize] = useState(Number(sp.get("page_size") || 20));

  // my-scope
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeErr, setScopeErr] = useState("");
  const [myScope, setMyScope] = useState(null);

  // scope selections (modal)
  const stored = useMemo(() => readStoredScope(), []);
  const [projectId, setProjectId] = useState(stored?.projectId || "");
  const [towerId, setTowerId] = useState(stored?.towerId || "");
  const [floorId, setFloorId] = useState(stored?.floorId || "");
  const [unitId, setUnitId] = useState(stored?.unitId || "");

  // modal
  const [filtersOpen, setFiltersOpen] = useState(false);

  // list
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resp, setResp] = useState({ count: 0, results: [] });

  const projects = myScope?.projects || [];
  const selectedProject =
    projects.find((p) => String(p.id) === String(projectId)) || null;
  const towers = selectedProject?.towers || [];
  const selectedTower =
    towers.find((t) => String(t.id) === String(towerId)) || null;
  const floors = selectedTower?.floors || [];

  const canLoad = useMemo(() => !!String(projectId || "").trim(), [projectId]);

  // ✅ URL me scope fields nahi (sirf page/search)
  const syncQS = (overrides = {}) => {
    const next = {
      search: overrides.search ?? search ?? "",
      page: String(overrides.page ?? page),
      page_size: String(overrides.page_size ?? pageSize),
    };
    setSp(next, { replace: true });
  };

  const loadMyScope = async () => {
    setScopeLoading(true);
    setScopeErr("");
    try {
      const { data } = await axiosInstance.get("client/my-scope/");
      setMyScope(data || null);
    } catch (e) {
      setScopeErr(
        e?.response?.data?.detail || e?.message || "Failed to load my scope"
      );
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    loadMyScope();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ auto-select project/tower if length 1
  useEffect(() => {
    if (!myScope) return;
    if (!projectId && projects.length === 1)
      setProjectId(String(projects[0].id));
  }, [myScope, projects, projectId]);

  useEffect(() => {
    if (!myScope) return;
    if (!projectId) return;
    const p = projects.find((x) => String(x.id) === String(projectId));
    const ts = p?.towers || [];
    if (!towerId && ts.length === 1) setTowerId(String(ts[0].id));
  }, [myScope, projects, projectId, towerId]);

  // project change -> validate dependent
  useEffect(() => {
    if (!projectId) return;

    if (towerId && !towers.some((t) => String(t.id) === String(towerId))) {
      setTowerId("");
      setFloorId("");
      return;
    }
    if (floorId && !floors.some((f) => String(f.id) === String(floorId))) {
      setFloorId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, towers.length, floors.length]);

  const loadCustomers = async (opts = {}) => {
    if (!canLoad) return;

    const p = opts.page ?? page;
    const ps = opts.pageSize ?? pageSize;
    const srch = opts.search ?? search;

    setLoading(true);
    setErr("");

    const controller = new AbortController();
    try {
      syncQS({ page: p, page_size: ps, search: srch });

      const { data } = await axiosInstance.get(
        "financial/demand-notes/project-customers/",
        {
          params: {
            project_id: projectId,
            page: p,
            page_size: ps,
            search: srch || undefined,
            tower_id: towerId || undefined,
            floor_id: floorId || undefined,
            unit_id: unitId || undefined,
          },
          signal: controller.signal,
        }
      );

      setResp(data || { count: 0, results: [] });

      // persist scope
      writeStoredScope({ projectId, towerId, floorId, unitId });
    } catch (e) {
      if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
        setErr(e?.response?.data?.detail || e?.message || "Request failed");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  // auto load after project available
  const didAutoLoadRef = useRef(false);
  useEffect(() => {
    if (!canLoad) return;
    if (!didAutoLoadRef.current) {
      didAutoLoadRef.current = true;
      loadCustomers({ page: 1 });
      return;
    }
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, page, pageSize]);

  const onSearchApply = () => {
    setPage(1);
    loadCustomers({ page: 1, search });
  };

  const onReset = () => {
    setSearch("");
    setPage(1);
    setPageSize(20);

    // keep project, reset tower/floor/unit
    setTowerId("");
    setFloorId("");
    setUnitId("");

    writeStoredScope({ projectId, towerId: "", floorId: "", unitId: "" });
    syncQS({ search: "", page: 1, page_size: 20 });
    loadCustomers({ page: 1, search: "" });
  };

  const openCustomer = (c) => {
    const customerId = c?.customer_id;
    if (!customerId) return;

    nav(`/post-sales/financial/customer-demand-notes/customers/${customerId}`, {
      state: { customer: c },
    });
  };

  return (
    <div className="demand-notes-page">
      {/* ✅ ONE LINE Header: Search LEFT + Buttons RIGHT (Title case labels) */}
      <div className="pc-toolbar">
        <div className="pc-toolbar-left">
          <div className="pc-search">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Name / Email / Phone"
              wrapperClassName="pc-searchbar"
            />
          </div>
        </div>

        <div className="pc-toolbar-right">
          <div className="pc-actions">
            <button
              className="dn-btn dn-btn-light demand-filter-btn"
              onClick={() => setFiltersOpen(true)}
              disabled={scopeLoading}
            >
              Filters
            </button>

            <button
              className="dn-btn dn-btn-primary"
              onClick={onSearchApply}
              disabled={!canLoad || loading || scopeLoading}
            >
              Search
            </button>

            <button
              className="dn-btn dn-btn-light"
              onClick={onReset}
              disabled={loading || scopeLoading}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ✅ compact meta row (no clutter) */}
      <div className="pc-meta-row">
        <div className="pc-meta-left">
          {scopeErr ? <span className="dn-error">{scopeErr}</span> : null}
          {scopeLoading ? (
            <span className="dn-loading">Loading Scope...</span>
          ) : null}
          {!canLoad && !scopeLoading ? (
            <span className="dn-help">Select Project In Filters.</span>
          ) : null}
          {err ? <span className="dn-error">{err}</span> : null}
          {loading ? <span className="dn-loading">Loading...</span> : null}
        </div>

        <div className="pc-meta-right">
          <span className="dn-help" style={{ marginTop: 0 }}>
            Page <b>{page}</b> • Total <b>{resp?.count || 0}</b>
          </span>
        </div>
      </div>

      {/* List */}
      <div className="dn-table-wrap">
        <table
          className="dn-subtable"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--dn-border)",
                textAlign: "left",
              }}
            >
              {/* ✅ Action first */}
              <th style={{ width: 110 }}>Action</th>

              <th>Customer</th>
              <th>Contact</th>
              <th>Bookings</th>
              <th>Total Dn</th>
              <th className="dn-money">Due</th>
              <th className="dn-money">Paid</th>
              <th className="dn-money">Total</th>
              <th>Last Due</th>
            </tr>
          </thead>

          <tbody>
            {(resp?.results || []).map((c) => {
              const customerName = toTitleCase(c.customer_name || "Customer");
              const email = (c.email || "").trim();
              const phone = (c.phone_number || "").trim();
              const contactLine =
                [email, phone].filter(Boolean).join(" • ") || "-";

              return (
                <tr
                  key={c.customer_id}
                  className="dn-row"
                  style={{
                    borderBottom: "1px solid var(--dn-border)",
                    cursor: "pointer",
                  }}
                  onClick={() => openCustomer(c)}
                >
                  {/* ✅ Action column */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="dn-btn dn-btn-light"
                      onClick={() => openCustomer(c)}
                    >
                      Open
                    </button>
                  </td>

                  {/* ✅ Customer: same font as others (no extra bold styles) */}
                  <td className="pc-customer">
                    <div className="pc-one-line">{customerName}</div>
                  </td>

                  {/* ✅ Contact one line */}
                  <td className="pc-contact">
                    <div className="pc-one-line">{contactLine}</div>
                  </td>

                  <td>{c.booking_count ?? "-"}</td>

                  {/* ✅ Total DN only */}
                  <td>
                    <div className="pc-one-line">
                      {c?.dn_counts?.total ?? "-"}
                    </div>
                  </td>

                  <td className="dn-money">₹ {inr(c?.dn_sums?.due_sum)}</td>
                  <td className="dn-money">₹ {inr(c?.dn_sums?.paid_sum)}</td>
                  <td className="dn-money">₹ {inr(c?.dn_sums?.total_sum)}</td>

                  {/* ✅ dd-mm-yyyy */}
                  <td>{formatDMY(c.last_due_date)}</td>
                </tr>
              );
            })}

            {!loading && (resp?.results || []).length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: 12, color: "var(--dn-muted)" }}
                >
                  No Customers Found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        count={resp?.count || 0}
        onPage={(p) => setPage(p)}
      />

      {/* ---------------- FILTER MODAL ---------------- */}
      {filtersOpen ? (
        <div
          className="dn-modal-overlay"
          onMouseDown={() => setFiltersOpen(false)}
        >
          <div
            className="dn-modal dn-modal-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <h3 className="dn-modal-title">Filters</h3>
                <div className="dn-modal-sub">Scope + Pagination</div>
              </div>
              <button
                className="dn-close-btn"
                onClick={() => setFiltersOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="dn-grid">
                <div className="dn-field">
                  <label>Project</label>
                  <select
                    className="dn-select"
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      setTowerId("");
                      setFloorId("");
                    }}
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {toTitleCase(p.name)}
                      </option>
                    ))}
                  </select>
                  {projects.length === 1 ? (
                    <div className="dn-help">
                      Auto-Selected (Only 1 Project)
                    </div>
                  ) : null}
                </div>

                <div className="dn-field">
                  <label>Tower</label>
                  <select
                    className="dn-select"
                    value={towerId}
                    onChange={(e) => {
                      setTowerId(e.target.value);
                      setFloorId("");
                    }}
                    disabled={!projectId}
                  >
                    <option value="">All Towers</option>
                    {towers.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {toTitleCase(t.name)}
                      </option>
                    ))}
                  </select>
                  {projectId && towers.length === 1 ? (
                    <div className="dn-help">Auto-Selected (Only 1 Tower)</div>
                  ) : null}
                </div>

                <div className="dn-field">
                  <label>Floor</label>
                  <select
                    className="dn-select"
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    disabled={!towerId}
                  >
                    <option value="">All Floors</option>
                    {floors.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {toTitleCase(String(f.number))}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dn-field">
                  <label>Unit Id (Optional)</label>
                  <input
                    className="dn-input"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    placeholder="Optional Unit Id"
                  />
                  <div className="dn-help">
                    Only If Backend Supports Unit Filter
                  </div>
                </div>

                <div className="dn-field">
                  <label>Page Size</label>
                  <select
                    className="dn-select"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </button>
              <button
                className="dn-btn dn-btn-primary"
                disabled={!projectId}
                onClick={() => {
                  setFiltersOpen(false);
                  setPage(1);
                  loadCustomers({ page: 1 });
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
