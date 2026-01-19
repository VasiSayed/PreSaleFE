// src/pages/PostSales/Communication/CommunicationsAdminPages.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

import "../Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";
import "../Financial/PaymentReceipts.css";
/* ---------------- constants ---------------- */
const DEFAULT_PAGE_SIZE = 30;

const API_SCOPE = "/client/my-scope/";
const SCOPE_PARAMS = { include_units: true };

const EP = {
  groups: "/communications/groups/",
  eventTypes: "/communications/event-types/",
  events: "/communications/events/",
  notices: "/communications/notices/",
  polls: "/communications/polls/",
  surveys: "/communications/surveys/",
  forumCategories: "/communications/forum-categories/",
  forumPosts: "/communications/forum-posts/",
};

/* ---------------- utils ---------------- */
const safeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const normalizePaginated = (data) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: data?.results || [],
    count: data?.count ?? (data?.results?.length || 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
};

const toTitleCase = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const fmtDT = (v) => {
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(v);
  }
};

/* ---------------- auth/role ---------------- */
function getStoredUser() {
  const keys = [
    "user",
    "USER",
    "current_user",
    "CURRENT_USER",
    "user_data",
    "USER_DATA",
  ];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

function isAdminUser(u) {
  if (!u) return false;
  if (u.role === "ADMIN") return true;
  if (u.is_superuser) return true;
  if (u.is_staff) return true;
  return false;
}

/* ---------------- scope hook ---------------- */
function useMyScope() {
  const [scope, setScope] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");

  const fetchScope = async () => {
    setScopeLoading(true);
    setScopeError("");
    try {
      const res = await axiosInstance.get(API_SCOPE, { params: SCOPE_PARAMS });
      setScope(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail || e?.message || "Failed to load scope.";
      setScopeError(String(msg));
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    fetchScope();
  }, []);

  return { scope, scopeLoading, scopeError, refetchScope: fetchScope };
}

/* ---------------- scope helpers ---------------- */
function flattenTowers(scope, projectId) {
  const pid = Number(projectId);
  const p = (scope?.projects || []).find((x) => x.id === pid);
  return p?.towers || [];
}

function flattenFloors(scope, projectId, towerId) {
  const towers = flattenTowers(scope, projectId);
  const tid = Number(towerId);
  const t = towers.find((x) => x.id === tid);
  return t?.floors || [];
}

function flattenUnits(scope, projectId, towerId, floorId) {
  const floors = flattenFloors(scope, projectId, towerId);
  const fid = Number(floorId);
  const f = floors.find((x) => x.id === fid);
  return f?.units || [];
}

function flattenAllUnitsForProject(scope, projectId) {
  const pid = Number(projectId);
  const p = (scope?.projects || []).find((x) => x.id === pid);
  const out = [];
  (p?.towers || []).forEach((t) => {
    (t?.floors || []).forEach((f) => {
      (f?.units || []).forEach((u) => {
        out.push({
          ...u,
          __label: `${t.name} • Floor ${f.number} • Unit ${u.unit_no} (${
            u.status || "-"
          })`,
        });
      });
    });
  });
  return out;
}

/* ---------------- MultiSelect ---------------- */
function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  size = 6,
  disabled,
}) {
  return (
    <select
      className="dn-select"
      multiple
      size={size}
      disabled={disabled}
      value={(value || []).map((x) => String(x))}
      onChange={(e) => {
        const picked = Array.from(e.target.selectedOptions).map((o) => o.value);
        onChange(picked);
      }}
      style={{ height: "auto" }}
    >
      {options?.length ? null : (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {(options || []).map((o) => (
        <option key={o.value} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---------------- Audience Editor ---------------- */
function AudienceEditor({
  scope,
  formProjectId,
  formTowerId,
  setFormTowerId,
  formFloorId,
  setFormFloorId,
  audience,
  setAudience,
  groupsForProject,
  groupsLoading,
}) {
  const towers = useMemo(
    () => flattenTowers(scope, formProjectId),
    [scope, formProjectId],
  );
  const floors = useMemo(
    () => flattenFloors(scope, formProjectId, formTowerId),
    [scope, formProjectId, formTowerId],
  );

  const allUnitsForProject = useMemo(
    () =>
      formProjectId ? flattenAllUnitsForProject(scope, formProjectId) : [],
    [scope, formProjectId],
  );

  const towerOptions = towers.map((t) => ({
    value: t.id,
    label: toTitleCase(t.name),
  }));
  const floorOptions = floors.map((f) => ({
    value: f.id,
    label: `Floor ${f.number}`,
  }));
  const groupOptions = (groupsForProject || []).map((g) => ({
    value: g.id,
    label: `${toTitleCase(g.name)} (${g.visibility || "-"})`,
  }));
  const unitExcludeOptions = allUnitsForProject.map((u) => ({
    value: u.id,
    label: u.__label || `Unit ${u.unit_no}`,
  }));

  const set = (patch) => setAudience((prev) => ({ ...prev, ...patch }));

  return (
    <div
      className="dn-field dn-span-3"
      style={{ borderTop: "1px solid #eee", paddingTop: 10 }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Audience</div>

      <div className="dn-grid">
        <div className="dn-field">
          <label>
            <input
              type="checkbox"
              checked={!!audience.all}
              onChange={(e) => set({ all: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            All (broadcast)
          </label>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            All ON ho to bhi unit exclude kar sakte ho.
          </div>
        </div>

        <div className="dn-field">
          <label>User IDs (comma separated)</label>
          <input
            className="dn-input"
            placeholder="12,15,21"
            value={audience.user_ids_text || ""}
            onChange={(e) => set({ user_ids_text: e.target.value })}
          />
        </div>

        <div className="dn-field">
          <label>Groups (include)</label>
          <MultiSelect
            disabled={!formProjectId || groupsLoading}
            value={audience.group_ids || []}
            onChange={(arr) => set({ group_ids: arr })}
            options={groupOptions}
            placeholder={
              !formProjectId
                ? "Select project first"
                : groupsLoading
                  ? "Loading..."
                  : "No groups"
            }
          />
        </div>

        <div className="dn-field">
          <label>Include Towers</label>
          <MultiSelect
            disabled={!formProjectId}
            value={audience.tower_ids || []}
            onChange={(arr) => set({ tower_ids: arr })}
            options={towerOptions}
            placeholder={!formProjectId ? "Select project first" : "No towers"}
          />
        </div>

        <div className="dn-field">
          <label>Form Tower (for Floor pick)</label>
          <select
            className="dn-select"
            value={formTowerId}
            onChange={(e) => {
              setFormTowerId(e.target.value);
              setFormFloorId("");
            }}
            disabled={!formProjectId}
          >
            <option value="">
              {!formProjectId ? "Select project first" : "Optional tower"}
            </option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {toTitleCase(t.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="dn-field">
          <label>Include Floors</label>
          <MultiSelect
            disabled={!formTowerId}
            value={audience.floor_ids || []}
            onChange={(arr) => set({ floor_ids: arr })}
            options={floorOptions}
            placeholder={!formTowerId ? "Pick Form Tower first" : "No floors"}
          />
        </div>

        <div className="dn-field dn-span-3">
          <label>Exclude Units</label>
          <MultiSelect
            disabled={!formProjectId}
            value={audience.exclude_unit_ids || []}
            onChange={(arr) => set({ exclude_unit_ids: arr })}
            options={unitExcludeOptions}
            placeholder={!formProjectId ? "Select project first" : "No units"}
            size={8}
          />
        </div>
      </div>
    </div>
  );
}

function buildAudiencePayload(aud) {
  const parseIds = (txt) =>
    String(txt || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

  const pickNums = (arr) =>
    (arr || []).map((x) => Number(x)).filter((n) => Number.isFinite(n));

  const out = { all: !!aud.all };

  const userIds = parseIds(aud.user_ids_text);
  const groupIds = pickNums(aud.group_ids);
  const towerIds = pickNums(aud.tower_ids);
  const floorIds = pickNums(aud.floor_ids);
  const excludeUnits = pickNums(aud.exclude_unit_ids);

  if (userIds.length) out.user_ids = userIds;
  if (groupIds.length) out.group_ids = groupIds;
  if (towerIds.length) out.tower_ids = towerIds;
  if (floorIds.length) out.floor_ids = floorIds;
  if (excludeUnits.length) out.exclude_unit_ids = excludeUnits;

  return out;
}

/* ---------------- shared CRUD page ---------------- */
function CommsCrudPage({
  pageTitle,
  endpoint,
  orderingOptions = [],
  columns = [],
  withAudience = false,
  buildCreatePayload,
  buildUpdatePayload,
  formFields = [],
  extraTopFilters = null,
  onFormOpen = null,
}) {
  const { scope, scopeLoading, scopeError } = useMyScope();

  const me = useMemo(() => getStoredUser(), []);
  const canManage = isAdminUser(me);

  // auto select if only 1 project
  const autoProjectId = useMemo(() => {
    const ps = scope?.projects || [];
    return ps.length === 1 ? String(ps[0].id) : "";
  }, [scope]);

  // list filters (list ke liye alag)
  const [openFilter, setOpenFilter] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");

  // list data
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // form modal (add/edit ke liye alag)
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // form scope (add/edit)
  const [formProjectId, setFormProjectId] = useState("");
  const [formTowerId, setFormTowerId] = useState("");
  const [formFloorId, setFormFloorId] = useState("");

  // audience form state
  const [audience, setAudience] = useState({
    all: true,
    user_ids_text: "",
    group_ids: [],
    tower_ids: [],
    floor_ids: [],
    exclude_unit_ids: [],
  });

  // groups for audience dropdown
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsForProject, setGroupsForProject] = useState([]);

  const towers = useMemo(
    () => flattenTowers(scope, projectId || autoProjectId),
    [scope, projectId, autoProjectId],
  );
  const floors = useMemo(
    () => flattenFloors(scope, projectId || autoProjectId, towerId),
    [scope, projectId, autoProjectId, towerId],
  );
  const units = useMemo(
    () => flattenUnits(scope, projectId || autoProjectId, towerId, floorId),
    [scope, projectId, autoProjectId, towerId, floorId],
  );

  const buildParams = () => {
    const p = { page_size: DEFAULT_PAGE_SIZE };
    const pid = projectId || autoProjectId;

    if (pid) p.project_id = pid;
    if (towerId) p.tower_id = towerId;
    if (floorId) p.floor_id = floorId;
    if (unitId) p.unit_id = unitId;

    if (search.trim()) p.search = search.trim();
    if (ordering) p.ordering = ordering;

    return p;
  };

  const fetchList = async (urlOrNull = null, paramsOverride = null) => {
    setLoading(true);
    setError("");

    try {
      // pagination url already has params -> no need guard
      if (!urlOrNull) {
        const params = paramsOverride || buildParams();
        if (!params.project_id) {
          setRows([]);
          setCount(0);
          setNextUrl(null);
          setPrevUrl(null);
          setError("Select Project from Filters (project_id is required).");
          setLoading(false);
          return;
        }
        const res = await axiosInstance.get(endpoint, { params });
        const norm = normalizePaginated(res.data);
        setRows(norm.results || []);
        setCount(norm.count || 0);
        setNextUrl(norm.next || null);
        setPrevUrl(norm.previous || null);
        return;
      }

      const res = await axiosInstance.get(urlOrNull);
      const norm = normalizePaginated(res.data);
      setRows(norm.results || []);
      setCount(norm.count || 0);
      setNextUrl(norm.next || null);
      setPrevUrl(norm.previous || null);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load list.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // auto select project & auto fetch if single project
  useEffect(() => {
    if (!scope || scopeLoading) return;
    if (!projectId && autoProjectId) {
      setProjectId(autoProjectId);
      fetchList(null, {
        page_size: DEFAULT_PAGE_SIZE,
        project_id: autoProjectId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeLoading, autoProjectId]);

  // reset dependent filters
  useEffect(() => {
    setTowerId("");
    setFloorId("");
    setUnitId("");
  }, [projectId]);

  useEffect(() => {
    setFloorId("");
    setUnitId("");
  }, [towerId]);

  useEffect(() => {
    setUnitId("");
  }, [floorId]);

  const resetAll = () => {
    const pid = autoProjectId || "";
    setProjectId(pid);
    setTowerId("");
    setFloorId("");
    setUnitId("");
    setSearch("");
    setOrdering("");

    if (pid) {
      fetchList(null, { page_size: DEFAULT_PAGE_SIZE, project_id: pid });
    } else {
      setRows([]);
      setCount(0);
      setNextUrl(null);
      setPrevUrl(null);
      setError("Select Project from Filters (project_id is required).");
    }
  };

  const closeFilter = () => setOpenFilter(false);

  const loadGroupsForProject = async (pid) => {
    if (!pid) {
      setGroupsForProject([]);
      return;
    }
    setGroupsLoading(true);
    try {
      const res = await axiosInstance.get(EP.groups, {
        params: { project_id: pid, page_size: 200 },
      });
      setGroupsForProject(safeList(res.data));
    } catch {
      setGroupsForProject([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const openCreate = () => {
    const pid = projectId || autoProjectId || "";
    setEditing(null);
    setForm({});
    setFormProjectId(pid);
    setFormTowerId("");
    setFormFloorId("");
    setAudience({
      all: true,
      user_ids_text: "",
      group_ids: [],
      tower_ids: [],
      floor_ids: [],
      exclude_unit_ids: [],
    });
    setOpenForm(true);
    if (withAudience) loadGroupsForProject(pid);
    if (onFormOpen) onFormOpen({ projectId: pid });
  };

  const openEdit = (item) => {
    setEditing(item);
    const pid = String(
      item?.project || item?.project_id || projectId || autoProjectId || "",
    );
    setFormProjectId(pid);
    setFormTowerId("");
    setFormFloorId("");
    setForm(item || {});
    setAudience({
      all: false,
      user_ids_text: "",
      group_ids: [],
      tower_ids: [],
      floor_ids: [],
      exclude_unit_ids: [],
    });
    setOpenForm(true);
    if (withAudience) loadGroupsForProject(pid);
    if (onFormOpen) onFormOpen({ projectId: pid });
  };

  useEffect(() => {
    if (!openForm) return;
    if (!withAudience) return;
    loadGroupsForProject(formProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formProjectId, openForm]);

  const closeForm = () => setOpenForm(false);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (!formProjectId) throw new Error("Project is required.");

      const audPayload = withAudience ? buildAudiencePayload(audience) : null;

      if (!editing) {
        const payload = buildCreatePayload({ form, formProjectId, audPayload });
        await axiosInstance.post(endpoint, payload);
      } else {
        const payload = buildUpdatePayload({
          form,
          formProjectId,
          audPayload,
          editing,
        });
        await axiosInstance.patch(`${endpoint}${editing.id}/`, payload);
      }

      setOpenForm(false);
      fetchList();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Save failed.";
      alert(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container payment-receipts-page">
        {/* Header */}
        <div className="list-header">
          <div className="list-header-left">
            <div style={{ fontWeight: 900, fontSize: 16 }}>{pageTitle}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Role: {me?.role || "-"}{" "}
              {scope?.admin_id ? `• scope admin_id: ${scope.admin_id}` : ""}
            </div>
          </div>

          <div className="list-header-right dn-header-actions">
            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={resetAll}
              disabled={loading}
            >
              Reset
            </button>

            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={() => setOpenFilter(true)}
              title="Filters"
            >
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              Filters
            </button>

            <button
              type="button"
              className="filter-btn"
              onClick={() => fetchList()}
              disabled={loading}
            >
              Apply
            </button>

            {canManage ? (
              <button
                type="button"
                className="filter-btn"
                onClick={openCreate}
                disabled={loading}
              >
                + Add
              </button>
            ) : null}
          </div>
        </div>

        {/* Outside bar: Search + Ordering */}
        <div className="dn-filters pr-outside-bar">
          <div className="dn-filters-grid pr-outside-grid">
            <div className="dn-field">
              <label>Search</label>
              <input
                className="dn-input"
                placeholder="search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dn-field">
              <label>Ordering</label>
              <select
                className="dn-select"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
              >
                <option value="">Default</option>
                {(orderingOptions || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="dn-field">
              <label>Total Records</label>
              <div className="dn-input" style={{ background: "#f8fafc" }}>
                {count}
              </div>
            </div>
          </div>
        </div>

        {loading ? <div className="dn-loading">Loading...</div> : null}
        {error ? <div className="dn-error dn-mb">{error}</div> : null}

        {/* Table */}
        <div className="booking-table-wrapper pr-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table
              className="booking-table dn-subtable"
              style={{ minWidth: 1100 }}
            >
              <thead>
                <tr>
                  {(columns || []).map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {canManage ? <th>Actions</th> : null}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr className="dn-row">
                    <td
                      colSpan={(columns?.length || 0) + (canManage ? 1 : 0)}
                      className="booking-empty-row"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="dn-row">
                      {(columns || []).map((c) => (
                        <td key={c.key} className={c.className || ""}>
                          {c.render ? c.render(r) : (r?.[c.key] ?? "-")}
                        </td>
                      ))}
                      {canManage ? (
                        <td>
                          <button
                            className="dn-btn dn-btn-light"
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pr-pagination">
            <button
              className="dn-btn dn-btn-light"
              disabled={!prevUrl || loading}
              onClick={() => fetchList(prevUrl)}
            >
              Prev
            </button>
            <button
              className="dn-btn dn-btn-light"
              disabled={!nextUrl || loading}
              onClick={() => fetchList(nextUrl)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        {openFilter ? (
          <div
            className="dn-modal-overlay"
            onMouseDown={closeFilter}
            style={{ zIndex: 99999 }}
          >
            <div
              className="dn-modal dn-modal-wide"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">Filters</div>
                </div>
                <button className="dn-close-btn" onClick={closeFilter}>
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                <div className="dn-grid">
                  <div className="dn-field">
                    <label>Project *</label>
                    <select
                      className="dn-select"
                      value={projectId || autoProjectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      disabled={scopeLoading || !!autoProjectId}
                      title={
                        autoProjectId ? "Auto selected (single project)" : ""
                      }
                    >
                      <option value="">
                        {scopeLoading ? "Loading..." : "Select Project"}
                      </option>
                      {(scope?.projects || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {toTitleCase(p.name)}
                        </option>
                      ))}
                    </select>
                    {scopeError ? (
                      <div className="dn-error">{scopeError}</div>
                    ) : null}
                  </div>

                  <div className="dn-field">
                    <label>Tower</label>
                    <select
                      className="dn-select"
                      value={towerId}
                      onChange={(e) => setTowerId(e.target.value)}
                      disabled={!(projectId || autoProjectId)}
                    >
                      <option value="">
                        {!(projectId || autoProjectId)
                          ? "Select project first"
                          : "All Towers"}
                      </option>
                      {towers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {toTitleCase(t.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Floor</label>
                    <select
                      className="dn-select"
                      value={floorId}
                      onChange={(e) => setFloorId(e.target.value)}
                      disabled={!towerId}
                    >
                      <option value="">
                        {!towerId ? "Select tower first" : "All Floors"}
                      </option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          Floor {f.number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Unit</label>
                    <select
                      className="dn-select"
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      disabled={!floorId}
                    >
                      <option value="">
                        {!floorId ? "Select floor first" : "All Units"}
                      </option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unit_no} ({u.status || "-"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {extraTopFilters ? (
                    <div className="dn-field dn-span-3">{extraTopFilters}</div>
                  ) : null}
                </div>
              </div>

              <div className="dn-modal-footer">
                <button className="dn-btn dn-btn-light" onClick={closeFilter}>
                  Cancel
                </button>
                <button
                  className="dn-btn dn-btn-primary"
                  onClick={() => {
                    closeFilter();
                    fetchList();
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form Modal (Add/Edit) */}
        {openForm ? (
          <div
            className="dn-modal-overlay"
            onMouseDown={closeForm}
            style={{ zIndex: 99999 }}
          >
            <div
              className="dn-modal dn-modal-wide"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">
                    {editing ? "Edit" : "Add"} {pageTitle}
                  </div>
                </div>
                <button className="dn-close-btn" onClick={closeForm}>
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                <div className="dn-grid">
                  <div className="dn-field dn-span-3">
                    <label>Project *</label>
                    <select
                      className="dn-select"
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      disabled={scopeLoading || !!autoProjectId}
                    >
                      <option value="">
                        {scopeLoading ? "Loading..." : "Select Project"}
                      </option>
                      {(scope?.projects || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {toTitleCase(p.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(formFields || []).map((f) => {
                    const v = form?.[f.name] ?? "";
                    const common = {
                      key: f.name,
                      className: `dn-field ${f.span3 ? "dn-span-3" : ""}`,
                    };

                    if (f.type === "textarea") {
                      return (
                        <div {...common}>
                          <label>{f.label}</label>
                          <textarea
                            className="dn-input"
                            rows={f.rows || 4}
                            value={v}
                            onChange={(e) => setField(f.name, e.target.value)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "select") {
                      return (
                        <div {...common}>
                          <label>{f.label}</label>
                          <select
                            className="dn-select"
                            value={v}
                            onChange={(e) => setField(f.name, e.target.value)}
                          >
                            {(f.options || []).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (f.type === "checkbox") {
                      return (
                        <div {...common}>
                          <label>
                            <input
                              type="checkbox"
                              checked={!!form?.[f.name]}
                              onChange={(e) =>
                                setField(f.name, e.target.checked)
                              }
                              style={{ marginRight: 8 }}
                            />
                            {f.label}
                          </label>
                        </div>
                      );
                    }

                    return (
                      <div {...common}>
                        <label>{f.label}</label>
                        <input
                          className="dn-input"
                          type={f.type || "text"}
                          value={v}
                          onChange={(e) => setField(f.name, e.target.value)}
                          placeholder={f.placeholder || ""}
                        />
                      </div>
                    );
                  })}

                  {withAudience ? (
                    <AudienceEditor
                      scope={scope}
                      formProjectId={formProjectId}
                      formTowerId={formTowerId}
                      setFormTowerId={setFormTowerId}
                      formFloorId={formFloorId}
                      setFormFloorId={setFormFloorId}
                      audience={audience}
                      setAudience={setAudience}
                      groupsForProject={groupsForProject}
                      groupsLoading={groupsLoading}
                    />
                  ) : null}
                </div>
              </div>

              <div className="dn-modal-footer">
                <button
                  className="dn-btn dn-btn-light"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="dn-btn dn-btn-primary"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   PAGES
========================= */

/** 1) Groups */
export function CommsGroupsPage() {
  return (
    <CommsCrudPage
      pageTitle="Groups"
      endpoint={EP.groups}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
        { value: "name", label: "Name ASC" },
        { value: "-name", label: "Name DESC" },
      ]}
      columns={[
        {
          key: "name",
          label: "Name",
          render: (r) => toTitleCase(r?.name || "-"),
          className: "dn-wrap",
        },
        { key: "visibility", label: "Visibility" },
        { key: "join_policy", label: "Join Policy" },
        {
          key: "description",
          label: "Description",
          render: (r) => r?.description || "-",
          className: "dn-wrap",
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
      ]}
      withAudience={false}
      formFields={[
        { name: "name", label: "Name" },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          span3: true,
        },
        {
          name: "visibility",
          label: "Visibility",
          type: "select",
          options: [
            { value: "PUBLIC", label: "PUBLIC" },
            { value: "PRIVATE", label: "PRIVATE" },
            { value: "SECRET", label: "SECRET" },
          ],
        },
        {
          name: "join_policy",
          label: "Join Policy",
          type: "select",
          options: [
            { value: "OPEN", label: "OPEN" },
            { value: "REQUEST", label: "REQUEST" },
            { value: "INVITE", label: "INVITE" },
          ],
        },
      ]}
      buildCreatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name || "",
        description: form.description || "",
        visibility: form.visibility || "PRIVATE",
        join_policy: form.join_policy || "REQUEST",
      })}
      buildUpdatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name,
        description: form.description,
        visibility: form.visibility,
        join_policy: form.join_policy,
      })}
    />
  );
}

/** 2) Event Types */
export function CommsEventTypesPage() {
  return (
    <CommsCrudPage
      pageTitle="Event Types"
      endpoint={EP.eventTypes}
      orderingOptions={[
        { value: "order", label: "Order ASC" },
        { value: "-order", label: "Order DESC" },
        { value: "name", label: "Name ASC" },
      ]}
      columns={[
        {
          key: "name",
          label: "Name",
          render: (r) => toTitleCase(r?.name || "-"),
        },
        { key: "slug", label: "Slug", className: "dn-mono" },
        { key: "order", label: "Order" },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
      ]}
      withAudience={false}
      formFields={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug", placeholder: "society-meeting" },
        { name: "order", label: "Order", type: "number" },
      ]}
      buildCreatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name || "",
        slug: form.slug || "",
        order: form.order === "" || form.order == null ? 1 : Number(form.order),
      })}
      buildUpdatePayload={({ form, formProjectId }) => ({
        project: Number(formProjectId),
        name: form.name,
        slug: form.slug,
        order:
          form.order === "" || form.order == null ? null : Number(form.order),
      })}
    />
  );
}

/** 3) Notices */
export function CommsNoticesPage() {
  return (
    <CommsCrudPage
      pageTitle="Notices"
      endpoint={EP.notices}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
        { value: "-priority", label: "Priority DESC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        { key: "priority", label: "Priority" },
        {
          key: "requires_ack",
          label: "Ack?",
          render: (r) => (r?.requires_ack ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        {
          key: "targets",
          label: "Targets",
          render: (r) => (Array.isArray(r?.targets) ? r.targets.length : "-"),
        },
      ]}
      withAudience={true}
      formFields={[
        { name: "title", label: "Title", span3: true },
        { name: "body", label: "Body", type: "textarea", rows: 6, span3: true },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { value: "LOW", label: "LOW" },
            { value: "MEDIUM", label: "MEDIUM" },
            { value: "HIGH", label: "HIGH" },
          ],
        },
        { name: "requires_ack", label: "Requires Ack", type: "checkbox" },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title || "",
        body: form.body || "",
        priority: form.priority || "MEDIUM",
        requires_ack: !!form.requires_ack,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title,
        body: form.body,
        priority: form.priority,
        requires_ack: !!form.requires_ack,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}

/** 4) Events */
export function CommsEventsPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [etLoading, setEtLoading] = useState(false);

  const loadEventTypes = async (projectId) => {
    if (!projectId) {
      setEventTypes([]);
      return;
    }
    setEtLoading(true);
    try {
      const res = await axiosInstance.get(EP.eventTypes, {
        params: { project_id: projectId, page_size: 200 },
      });
      setEventTypes(safeList(res.data));
    } catch {
      setEventTypes([]);
    } finally {
      setEtLoading(false);
    }
  };

  return (
    <CommsCrudPage
      pageTitle="Events"
      endpoint={EP.events}
      orderingOptions={[
        { value: "-start_at", label: "Start DESC" },
        { value: "start_at", label: "Start ASC" },
        { value: "-created_at", label: "Created DESC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        {
          key: "event_type",
          label: "Type",
          render: (r) =>
            r?.event_type_name || r?.event_type_label || r?.event_type || "-",
        },
        { key: "start_at", label: "Start", render: (r) => fmtDT(r?.start_at) },
        { key: "end_at", label: "End", render: (r) => fmtDT(r?.end_at) },
        {
          key: "location_text",
          label: "Location",
          render: (r) => r?.location_text || "-",
          className: "dn-wrap",
        },
        {
          key: "requires_rsvp",
          label: "RSVP?",
          render: (r) => (r?.requires_rsvp ? "Yes" : "No"),
        },
      ]}
      withAudience={true}
      onFormOpen={({ projectId }) => loadEventTypes(projectId)}
      formFields={[
        {
          name: "event_type",
          label: "Event Type",
          type: "select",
          options: [
            { value: "", label: etLoading ? "Loading..." : "Select type" },
            ...eventTypes.map((t) => ({
              value: t.id,
              label: toTitleCase(t.name),
            })),
          ],
        },
        { name: "title", label: "Title", span3: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 5,
          span3: true,
        },
        { name: "start_at", label: "Start At", type: "datetime-local" },
        { name: "end_at", label: "End At", type: "datetime-local" },
        { name: "location_text", label: "Location", span3: true },
        { name: "requires_rsvp", label: "Requires RSVP", type: "checkbox" },
        {
          name: "requires_checkin",
          label: "Requires Check-in",
          type: "checkbox",
        },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        event_type: Number(form.event_type),
        title: form.title || "",
        description: form.description || "",
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        location_text: form.location_text || "",
        requires_rsvp: !!form.requires_rsvp,
        requires_checkin: !!form.requires_checkin,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        event_type: form.event_type ? Number(form.event_type) : undefined,
        title: form.title,
        description: form.description,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        location_text: form.location_text,
        requires_rsvp: !!form.requires_rsvp,
        requires_checkin: !!form.requires_checkin,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}

/** 5) Polls */
export function CommsPollsPage() {
  return (
    <CommsCrudPage
      pageTitle="Polls"
      endpoint={EP.polls}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
      ]}
      columns={[
        {
          key: "question",
          label: "Question",
          render: (r) => r?.question || "-",
          className: "dn-wrap",
        },
        {
          key: "allow_multi_select",
          label: "Multi?",
          render: (r) => (r?.allow_multi_select ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        {
          key: "total_votes",
          label: "Votes",
          render: (r) => r?.total_votes ?? "-",
        },
      ]}
      withAudience={true}
      formFields={[
        { name: "question", label: "Question", span3: true },
        {
          name: "allow_multi_select",
          label: "Allow Multi Select",
          type: "checkbox",
        },
        {
          name: "options_text",
          label: "Options (one per line)",
          type: "textarea",
          rows: 6,
          span3: true,
        },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => {
        const options = String(form.options_text || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          project: Number(formProjectId),
          question: form.question || "",
          allow_multi_select: !!form.allow_multi_select,
          audience: audPayload || { all: true },
          ...(options.length ? { options } : {}), // change key if backend differs
        };
      }}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        question: form.question,
        allow_multi_select: !!form.allow_multi_select,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}

/** 6) Surveys */
export function CommsSurveysPage() {
  return (
    <CommsCrudPage
      pageTitle="Surveys"
      endpoint={EP.surveys}
      orderingOptions={[
        { value: "-created_at", label: "Created DESC" },
        { value: "created_at", label: "Created ASC" },
      ]}
      columns={[
        {
          key: "title",
          label: "Title",
          render: (r) => toTitleCase(r?.title || "-"),
          className: "dn-wrap",
        },
        {
          key: "is_anonymous",
          label: "Anonymous?",
          render: (r) => (r?.is_anonymous ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => fmtDT(r?.created_at),
        },
        { key: "status", label: "Status", render: (r) => r?.status || "-" },
      ]}
      withAudience={true}
      formFields={[
        { name: "title", label: "Title", span3: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 5,
          span3: true,
        },
        { name: "is_anonymous", label: "Anonymous", type: "checkbox" },
      ]}
      buildCreatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title || "",
        description: form.description || "",
        is_anonymous: !!form.is_anonymous,
        audience: audPayload || { all: true },
      })}
      buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
        project: Number(formProjectId),
        title: form.title,
        description: form.description,
        is_anonymous: !!form.is_anonymous,
        ...(audPayload ? { audience: audPayload } : {}),
      })}
    />
  );
}

/** 7) Forums (Categories + Posts) */
export function CommsForumsPage() {
  const [tab, setTab] = useState("categories"); // categories | posts

  return (
    <div>
      <div className="dn-filters pr-outside-bar" style={{ marginBottom: 10 }}>
        <div className="dn-filters-grid pr-outside-grid">
          <div className="dn-field">
            <label>Forums Tab</label>
            <select
              className="dn-select"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
            >
              <option value="categories">Categories</option>
              <option value="posts">Posts</option>
            </select>
          </div>
        </div>
      </div>

      {tab === "categories" ? (
        <CommsCrudPage
          pageTitle="Forum Categories"
          endpoint={EP.forumCategories}
          orderingOptions={[
            { value: "order", label: "Order ASC" },
            { value: "-order", label: "Order DESC" },
          ]}
          columns={[
            {
              key: "name",
              label: "Name",
              render: (r) => toTitleCase(r?.name || "-"),
            },
            { key: "slug", label: "Slug", className: "dn-mono" },
            { key: "order", label: "Order" },
            {
              key: "created_at",
              label: "Created",
              render: (r) => fmtDT(r?.created_at),
            },
          ]}
          withAudience={false}
          formFields={[
            { name: "name", label: "Name" },
            {
              name: "slug",
              label: "Slug",
              placeholder: "construction-updates",
            },
            { name: "order", label: "Order", type: "number" },
          ]}
          buildCreatePayload={({ form, formProjectId }) => ({
            project: Number(formProjectId),
            name: form.name || "",
            slug: form.slug || "",
            order:
              form.order === "" || form.order == null ? 1 : Number(form.order),
          })}
          buildUpdatePayload={({ form, formProjectId }) => ({
            project: Number(formProjectId),
            name: form.name,
            slug: form.slug,
            order:
              form.order === "" || form.order == null
                ? null
                : Number(form.order),
          })}
        />
      ) : (
        <CommsCrudPage
          pageTitle="Forum Posts"
          endpoint={EP.forumPosts}
          orderingOptions={[
            { value: "-created_at", label: "Created DESC" },
            { value: "created_at", label: "Created ASC" },
          ]}
          columns={[
            {
              key: "title",
              label: "Title",
              render: (r) => toTitleCase(r?.title || "-"),
              className: "dn-wrap",
            },
            {
              key: "category",
              label: "Category",
              render: (r) =>
                r?.category_name || r?.category_label || r?.category || "-",
            },
            {
              key: "created_at",
              label: "Created",
              render: (r) => fmtDT(r?.created_at),
            },
            {
              key: "targets",
              label: "Targets",
              render: (r) =>
                Array.isArray(r?.targets) ? r.targets.length : "-",
            },
          ]}
          withAudience={true}
          formFields={[
            {
              name: "category",
              label: "Category ID (for now)",
              placeholder: "1",
            },
            { name: "title", label: "Title", span3: true },
            {
              name: "content",
              label: "Content",
              type: "textarea",
              rows: 6,
              span3: true,
            },
          ]}
          buildCreatePayload={({ form, formProjectId, audPayload }) => ({
            project: Number(formProjectId),
            category: Number(form.category),
            title: form.title || "",
            content: form.content || "",
            audience: audPayload || { all: true },
          })}
          buildUpdatePayload={({ form, formProjectId, audPayload }) => ({
            project: Number(formProjectId),
            category: form.category ? Number(form.category) : undefined,
            title: form.title,
            content: form.content,
            ...(audPayload ? { audience: audPayload } : {}),
          })}
        />
      )}
    </div>
  );
}
