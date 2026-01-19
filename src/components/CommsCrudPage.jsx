// src/pages/PostSales/Communication/admin/components/CommsCrudPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

import "../pages/PostSales/Financial/DemandNotes.css";
import "../pages/Booking/MyBookings.css";
import "../pages/PreSalesCRM/Leads/LeadsList.css";
import "../pages/PostSales/Financial/PaymentReceipts.css";

import useMyScope from "./useMyScope";
import AudienceEditor from "./AudienceEditor";
import {
  DEFAULT_PAGE_SIZE,
  safeList,
  normalizePaginated,
  toTitleCase,
  getStoredUser,
  isAdminUser,
  flattenTowers,
  flattenFloors,
  flattenUnits,
  buildAudiencePayload,
} from "./commsUtils";

const defaultAudienceState = {
  all: true,
  user_ids_text: "",
  group_ids: [],
  tower_ids: [],
  floor_ids: [],
  exclude_unit_ids: [],
};

export default function CommsCrudPage({
  pageTitle,
  endpoint,
  orderingOptions = [],
  columns = [],
  formFields = [],
  withAudience = false,

  buildCreatePayload,
  buildUpdatePayload,

  getExtraListParams = () => ({}),
  renderExtraFilterFields = () => null,
  renderTopBarExtra = () => null,

  // ✅ NEW: hook points for custom form UI and custom save endpoint
  renderFormExtra = null,
  createRequest = null,
  updateRequest = null,
  hydrateEditingForm = null,

  onFormOpen = null,
  onFormProjectChange = null,
}) {
  const { scope, scopeLoading, scopeError } = useMyScope();

  const me = useMemo(() => getStoredUser(), []);
  const canManage = isAdminUser(me);

  const autoProjectId = useMemo(() => {
    const ps = scope?.projects || [];
    return ps.length === 1 ? String(ps[0].id) : "";
  }, [scope]);

  // ---------------- list state ----------------
  const [openFilter, setOpenFilter] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [unitId, setUnitId] = useState("");

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- form state ----------------
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [formProjectId, setFormProjectId] = useState("");
  const [formTowerId, setFormTowerId] = useState("");
  const [formFloorId, setFormFloorId] = useState("");

  const [audience, setAudience] = useState(defaultAudienceState);

  // groups for audience (optional)
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsForProject, setGroupsForProject] = useState([]);

  // ---------------- derived scope lists ----------------
  const effectiveProjectId = projectId || autoProjectId;

  const towers = useMemo(
    () => flattenTowers(scope, effectiveProjectId),
    [scope, effectiveProjectId],
  );

  const floors = useMemo(
    () => flattenFloors(scope, effectiveProjectId, towerId),
    [scope, effectiveProjectId, towerId],
  );

  const units = useMemo(
    () => flattenUnits(scope, effectiveProjectId, towerId, floorId),
    [scope, effectiveProjectId, towerId, floorId],
  );

  // ---------------- helpers ----------------
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const buildParams = () => {
    const p = { page_size: DEFAULT_PAGE_SIZE };

    if (effectiveProjectId) p.project_id = effectiveProjectId;
    if (towerId) p.tower_id = towerId;
    if (floorId) p.floor_id = floorId;
    if (unitId) p.unit_id = unitId;

    if (search.trim()) p.search = search.trim();
    if (ordering) p.ordering = ordering;

    const extra = getExtraListParams?.() || {};
    return { ...p, ...extra };
  };

  // ---------------- list fetch ----------------
  const fetchList = async (urlOrNull = null, paramsOverride = null) => {
    setLoading(true);
    setError("");

    try {
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

  // auto select project + initial fetch if only single project
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

  // load groups for audience
  const loadGroupsForProject = async (pid) => {
    if (!pid) {
      setGroupsForProject([]);
      return;
    }
    setGroupsLoading(true);
    try {
      const res = await axiosInstance.get("/communications/groups/", {
        params: { project_id: pid, page_size: 200 },
      });
      setGroupsForProject(safeList(res.data));
    } catch {
      setGroupsForProject([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  // actions
  const resetAll = () => {
    const pid = autoProjectId || "";
    setProjectId(pid);
    setTowerId("");
    setFloorId("");
    setUnitId("");
    setSearch("");
    setOrdering("");

    const extra = getExtraListParams?.(true) || {};
    if (pid)
      fetchList(null, {
        page_size: DEFAULT_PAGE_SIZE,
        project_id: pid,
        ...extra,
      });
    else {
      setRows([]);
      setCount(0);
      setNextUrl(null);
      setPrevUrl(null);
      setError("Select Project from Filters (project_id is required).");
    }
  };

  const closeFilter = () => setOpenFilter(false);

  const openCreate = () => {
    const pid = effectiveProjectId || "";
    setEditing(null);
    setForm({});
    setFormProjectId(pid);
    setFormTowerId("");
    setFormFloorId("");
    setAudience(defaultAudienceState);
    setOpenForm(true);

    if (withAudience) loadGroupsForProject(pid);
    if (onFormOpen) onFormOpen({ projectId: pid });
  };

  const openEdit = async (item) => {
    const pid = String(
      item?.project || item?.project_id || effectiveProjectId || "",
    );
    setEditing(item);
    setFormProjectId(pid);
    setFormTowerId("");
    setFormFloorId("");
    setForm(item || {});
    setAudience(defaultAudienceState);
    setOpenForm(true);

    if (withAudience) loadGroupsForProject(pid);
    if (onFormOpen) onFormOpen({ projectId: pid, item });

    if (hydrateEditingForm) {
      try {
        const extra = await hydrateEditingForm({ item, projectId: pid });
        if (extra && typeof extra === "object") {
          setForm((prev) => ({ ...prev, ...extra }));
        }
      } catch {
        // ignore hydrate failures
      }
    }
  };

  useEffect(() => {
    if (!openForm) return;
    if (withAudience) loadGroupsForProject(formProjectId);
    if (onFormProjectChange) onFormProjectChange({ projectId: formProjectId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formProjectId, openForm]);

  const closeForm = () => setOpenForm(false);

  const save = async () => {
    setSaving(true);
    try {
      if (!formProjectId) throw new Error("Project is required.");

      const audPayload = withAudience ? buildAudiencePayload(audience) : null;

      if (!editing) {
        const payload = buildCreatePayload({ form, formProjectId, audPayload });

        if (createRequest) {
          await createRequest({ payload, formProjectId, form });
        } else {
          await axiosInstance.post(endpoint, payload);
        }
      } else {
        const payload = buildUpdatePayload({
          form,
          formProjectId,
          audPayload,
          editing,
        });

        if (updateRequest) {
          await updateRequest({ payload, formProjectId, editing, form });
        } else {
          await axiosInstance.patch(`${endpoint}${editing.id}/`, payload);
        }
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

        {/* Outside bar */}
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

            {renderTopBarExtra ? (
              <div className="dn-field dn-span-3">{renderTopBarExtra()}</div>
            ) : null}
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
          <div className="dn-modal-overlay" onMouseDown={closeFilter}>
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
                      value={effectiveProjectId}
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
                      disabled={!effectiveProjectId}
                    >
                      <option value="">
                        {!effectiveProjectId
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

                  {renderExtraFilterFields ? (
                    <div className="dn-field dn-span-3">
                      {renderExtraFilterFields()}
                    </div>
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

        {/* Form Modal */}
        {openForm ? (
          <div className="dn-modal-overlay" onMouseDown={closeForm}>
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
                    const cls = `dn-field ${f.span3 ? "dn-span-3" : ""}`;

                    if (f.type === "textarea") {
                      return (
                        <div key={f.name} className={cls}>
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
                        <div key={f.name} className={cls}>
                          <label>{f.label}</label>
                          <select
                            className="dn-select"
                            value={v}
                            onChange={(e) => setField(f.name, e.target.value)}
                            disabled={!!f.disabled}
                          >
                            {(f.options || []).map((o) => (
                              <option key={String(o.value)} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (f.type === "checkbox") {
                      return (
                        <div key={f.name} className={cls}>
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
                      <div key={f.name} className={cls}>
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

                  {/* ✅ NEW custom extra block */}
                  {renderFormExtra
                    ? renderFormExtra({
                        scope,
                        scopeLoading,
                        scopeError,
                        form,
                        setField,
                        setForm,
                        formProjectId,
                        setFormProjectId,
                        editing,
                        me,
                      })
                    : null}

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
