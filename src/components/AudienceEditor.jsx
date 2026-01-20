// src/pages/PostSales/Communication/admin/components/AudienceEditor.jsx
import React, { useMemo } from "react";
import {
  flattenTowers,
  flattenFloors,
  flattenAllUnitsForProject,
  toTitleCase,
} from "./commsUtils";

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

export default function AudienceEditor({
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
            All ON ho to bhi Units exclude kar sakte ho.
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
