// src/pages/PostSales/Communication/admin/components/AudienceEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  flattenTowers,
  flattenFloors,
  flattenAllUnitsForProject,
  toTitleCase,
  safeList,
} from "./commsUtils";
import axiosInstance from "../api/axiosInstance";

/* ---------------- APIs ---------------- */
const GROUPS_API = "/communications/groups/";
const DN_CUSTOMERS_API = "/financial/demand-notes/customers/";

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

const parseIdsFromText = (txt) => {
  const s = String(txt || "");
  const parts = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  // keep only numeric-ish
  return parts.filter((x) => /^\d+$/.test(x));
};

export default function AudienceEditor({
  scope,
  formProjectId,
  formTowerId,
  setFormTowerId,
  formFloorId,
  setFormFloorId,
  audience,
  setAudience,

  // backward compatible props (if parent still passes)
  groupsForProject: groupsForProjectProp,
  groupsLoading: groupsLoadingProp,
}) {
  /* ---------------- internal fetch: groups + customers ---------------- */
  const [groupsLocal, setGroupsLocal] = useState([]);
  const [groupsLoadingLocal, setGroupsLoadingLocal] = useState(false);

  const [customersLocal, setCustomersLocal] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const fetchGroups = async (projectId) => {
    if (!projectId) {
      setGroupsLocal([]);
      return;
    }
    setGroupsLoadingLocal(true);
    try {
      const res = await axiosInstance.get(GROUPS_API, {
        params: { page_size: 200, project_id: Number(projectId) },
      });

      // API may return array OR paginated object
      const raw = res?.data?.results ?? res?.data ?? [];
      const arr = Array.isArray(raw) ? raw : safeList(raw);
      setGroupsLocal(arr);
    } catch {
      setGroupsLocal([]);
    } finally {
      setGroupsLoadingLocal(false);
    }
  };

  const fetchCustomers = async (projectId) => {
    if (!projectId) {
      setCustomersLocal([]);
      return;
    }
    setCustomersLoading(true);
    try {
      const res = await axiosInstance.get(DN_CUSTOMERS_API, {
        params: {
          page_size: 200,
          project_id: Number(projectId),
          project_ids: String(projectId),
        },
      });

      const raw = res?.data?.results ?? res?.data ?? [];
      const arr = Array.isArray(raw) ? raw : safeList(raw);

      // normalize: {customer_id,...}
      const list = (arr || [])
        .map((c) => ({
          ...c,
          __uid: c?.customer_id ?? c?.customerId ?? c?.id,
        }))
        .filter((c) => Number.isFinite(Number(c.__uid)));

      setCustomersLocal(list);
    } catch {
      setCustomersLocal([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(formProjectId);
    fetchCustomers(formProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formProjectId]);

  // use fetched groups; fallback to props if parent still supplies
  const groupsForProject =
    (groupsLocal && groupsLocal.length ? groupsLocal : groupsForProjectProp) ||
    [];
  const groupsLoading = !!groupsLoadingLocal || !!groupsLoadingProp;

  /* ---------------- scope-based options ---------------- */
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

  const customerOptions = (customersLocal || []).map((c) => {
    const name = c?.customer_name || c?.name || "";
    const email = c?.email || "";
    const dn = c?.dn_count ?? null;
    const due = c?.dn_due_sum ?? null;

    const right =
      dn != null ? `DN:${dn}${due != null ? ` • Due:${due}` : ""}` : null;

    return {
      value: c.__uid,
      label: `${name || "Customer"}${email ? ` • ${email}` : ""}${
        right ? ` • ${right}` : ""
      }`,
    };
  });

  const unitExcludeOptions = allUnitsForProject.map((u) => ({
    value: u.id,
    label: u.__label || `Unit ${u.unit_no}`,
  }));

  const set = (patch) => setAudience((prev) => ({ ...prev, ...patch }));

  // keep user_ids_text + user_ids in sync
  const setUserIdsText = (text) => {
    const ids = parseIdsFromText(text);
    set({ user_ids_text: text, user_ids: ids });
  };

  const setUserIdsFromPick = (arr) => {
    const ids = (arr || [])
      .map((x) => String(x))
      .filter((x) => /^\d+$/.test(x));
    set({ user_ids: ids, user_ids_text: ids.join(",") });
  };

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
            All ON ho to bhi Units exclude kar sakte ho.
          </div>
        </div>

        {/* ✅ Individuals (include) from DN customers API */}
        <div className="dn-field">
          <label
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span>Individuals (include)</span>
            <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
              {customersLoading
                ? "Loading..."
                : formProjectId
                  ? `${customerOptions.length} customers`
                  : ""}
            </span>
          </label>

          <MultiSelect
            disabled={!formProjectId || customersLoading}
            value={audience.user_ids || []}
            onChange={setUserIdsFromPick}
            options={customerOptions}
            placeholder={
              !formProjectId
                ? "Select project first"
                : customersLoading
                  ? "Loading..."
                  : "No customers"
            }
            size={6}
          />

          {/* keep your old textbox (optional / power users) */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              Or paste User IDs (comma separated)
            </div>
            <input
              className="dn-input"
              placeholder="12,15,21"
              value={audience.user_ids_text || ""}
              onChange={(e) => setUserIdsText(e.target.value)}
            />
          </div>
        </div>

        {/* ✅ Groups from groups API */}
        <div className="dn-field">
          <label
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span>Groups (include)</span>
            <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
              {groupsLoading
                ? "Loading..."
                : formProjectId
                  ? `${groupOptions.length} groups`
                  : ""}
            </span>
          </label>
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
            size={6}
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
          <label>Pick Tower (for Floor list)</label>
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
              {!formProjectId ? "Select project first" : "Optional"}
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
            placeholder={!formTowerId ? "Pick Tower first" : "No floors"}
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
