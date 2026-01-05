import { useState, useRef } from "react";
import { UnitAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function UnitForm({
  setup,
  projects,
  towersByProject,
  floorsByTower,
  onSuccess,
}) {
  const [unitForm, setUnitForm] = useState({
    project: "",
    tower: "",
    floor: "",
    unitno: "",
    unittype: "",
    carpetsqft: "",
    builtupsqft: "",
    rerasqft: "",
    facing: "",
    parkingtype: "",
    agreementvalue: "",
    constructionstart: "",
    completiondate: "",
    status: "",
    notes: "",
  });

  const excelInputRef = useRef(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [importProjectId, setImportProjectId] = useState(null);

  const updateUnitForm = (key, val) =>
    setUnitForm((f) => ({ ...f, [key]: val }));

  const towersForUnit = towersByProject[unitForm.project] || [];
  const floorsForUnit = floorsByTower[unitForm.tower] || [];

  // ---------- IMPORT EXCEL FLOW ----------

  const handleExcelButtonClick = () => {
    setShowProjectModal(true);
  };

  const handleProjectSelectForImport = (projectId) => {
    setImportProjectId(projectId);
    // Also set in form so dependent tower/floor dropdowns can use it if needed later
    setUnitForm((prev) => ({ ...prev, project: String(projectId) }));
    setShowProjectModal(false);

    setTimeout(() => {
      excelInputRef.current?.click();
    }, 0);
  };

  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importProjectId) {
      alert("Please select a project before importing Excel.");
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("project_id", importProjectId);

    try {
      await axiosInstance.post("client/units/upload-excel/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Units Excel imported successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to import Units Excel";
      alert(msg);
    } finally {
      e.target.value = "";
    }
  };

  // ---------- NORMAL ADD UNIT FLOW ----------

  const handleAddUnit = async (e) => {
    e.preventDefault();

    const required = ["project", "tower", "floor", "unitno"];
    for (const k of required) {
      if (!unitForm[k]) {
        alert("Project, Tower, Floor, and Unit Number are required");
        return;
      }
    }

    const payload = {
      project: Number(unitForm.project),
      tower: Number(unitForm.tower),
      floor: Number(unitForm.floor),
      unit_no: unitForm.unitno,
      unittype: unitForm.unittype ? Number(unitForm.unittype) : null,
      carpetsqft: unitForm.carpetsqft ? Number(unitForm.carpetsqft) : null,
      builtupsqft: unitForm.builtupsqft ? Number(unitForm.builtupsqft) : null,
      rerasqft: unitForm.rerasqft ? Number(unitForm.rerasqft) : null,
      facing: unitForm.facing ? Number(unitForm.facing) : null,
      parkingtype: unitForm.parkingtype ? Number(unitForm.parkingtype) : null,
      agreementvalue: unitForm.agreementvalue
        ? Number(unitForm.agreementvalue)
        : null,
      constructionstart: unitForm.constructionstart || null,
      completiondate: unitForm.completiondate || null,
      status: unitForm.status || "NOT_RELEASED",
      notes: unitForm.notes || "",
    };

    try {
      await UnitAPI.create(payload);
      alert("Unit created successfully!");

      setUnitForm({
        ...unitForm,
        unitno: "",
        unittype: "",
        carpetsqft: "",
        builtupsqft: "",
        rerasqft: "",
        facing: "",
        parkingtype: "",
        agreementvalue: "",
        constructionstart: "",
        completiondate: "",
        status: "",
        notes: "",
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create unit");
    }
  };

  return (
    <div className="project-form-container">
      {/* ---------- PROJECT SELECT MODAL ---------- */}
      {showProjectModal && (
        <div className="cp-project-modal-backdrop">
          <div className="cp-project-modal">
            <div className="cp-project-modal-header">
              <div>
                <h2 className="cp-project-modal-title">Select Project</h2>
                <p className="cp-project-modal-subtitle">
                  Choose a project for which you want to import units from
                  Excel.
                </p>
              </div>
              <button
                type="button"
                className="cp-project-modal-close"
                onClick={() => setShowProjectModal(false)}
              >
                ✕
              </button>
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: "16px 0", color: "#6b7280" }}>
                No projects found in your scope. Please login again or contact
                admin.
              </div>
            ) : (
              <div className="cp-project-grid">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="cp-project-card"
                    onClick={() => handleProjectSelectForImport(p.id)}
                  >
                    <div className="cp-project-info">
                      <div className="cp-project-name">{p.name}</div>
                      <div className="cp-project-meta">
                        Status: {p.status || "-"} • Approval:{" "}
                        {p.approval_status || "-"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- HEADER + IMPORT BUTTON ---------- */}
      <div className="form-header">
        <h3>Add Flat / Unit</h3>
        <button
          type="button"
          className="btn-import"
          onClick={handleExcelButtonClick}
        >
          <span className="import-icon">📄</span>
          IMPORT EXCEL
        </button>
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleExcelFileChange}
        />
      </div>

      {/* ---------- ADD UNIT FORM ---------- */}
      <form onSubmit={handleAddUnit} className="project-form">
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Select Project <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={unitForm.project}
              onChange={(e) => {
                updateUnitForm("project", e.target.value);
                updateUnitForm("tower", "");
                updateUnitForm("floor", "");
              }}
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              Select Tower <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={unitForm.tower}
              onChange={(e) => {
                updateUnitForm("tower", e.target.value);
                updateUnitForm("floor", "");
              }}
              disabled={!unitForm.project}
              required
            >
              <option value="">Select Tower</option>
              {towersForUnit.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              Select Floor <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={unitForm.floor}
              onChange={(e) => updateUnitForm("floor", e.target.value)}
              disabled={!unitForm.tower}
              required
            >
              <option value="">Select Floor</option>
              {floorsForUnit.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Unit Number <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={unitForm.unitno}
              onChange={(e) => updateUnitForm("unitno", e.target.value)}
              placeholder="Enter unit number"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Unit Type</label>
            <select
              className="field-input"
              value={unitForm.unittype}
              onChange={(e) => updateUnitForm("unittype", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.unit_types?.map((ut) => (
                <option key={ut.id} value={ut.id}>
                  {ut.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Facing</label>
            <select
              className="field-input"
              value={unitForm.facing}
              onChange={(e) => updateUnitForm("facing", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.facings?.map((fc) => (
                <option key={fc.id} value={fc.id}>
                  {fc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Carpet Area (sq. ft.)</label>
            <input
              className="field-input"
              type="number"
              value={unitForm.carpetsqft}
              onChange={(e) => updateUnitForm("carpetsqft", e.target.value)}
              step="0.01"
              placeholder="Enter carpet area"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Built Up Area (sq. ft.)</label>
            <input
              className="field-input"
              type="number"
              value={unitForm.builtupsqft}
              onChange={(e) => updateUnitForm("builtupsqft", e.target.value)}
              step="0.01"
              placeholder="Enter built-up area"
            />
          </div>

          <div className="form-field">
            <label className="field-label">RERA Area (sq. ft.)</label>
            <input
              className="field-input"
              type="number"
              value={unitForm.rerasqft}
              onChange={(e) => updateUnitForm("rerasqft", e.target.value)}
              step="0.01"
              placeholder="Enter RERA area"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Parking Type</label>
            <select
              className="field-input"
              value={unitForm.parkingtype}
              onChange={(e) => updateUnitForm("parkingtype", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.parking_types?.map((pk) => (
                <option key={pk.id} value={pk.id}>
                  {pk.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Agreement Value</label>
            <input
              className="field-input"
              type="number"
              value={unitForm.agreementvalue}
              onChange={(e) => updateUnitForm("agreementvalue", e.target.value)}
              step="0.01"
              placeholder="Enter value"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Status</label>
            <select
              className="field-input"
              value={unitForm.status}
              onChange={(e) => updateUnitForm("status", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.statuses?.unit?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Construction Start Date</label>
            <input
              className="field-input"
              type="date"
              value={unitForm.constructionstart}
              onChange={(e) =>
                updateUnitForm("constructionstart", e.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label className="field-label">Completion Date</label>
            <input
              className="field-input"
              type="date"
              value={unitForm.completiondate}
              onChange={(e) => updateUnitForm("completiondate", e.target.value)}
            />
          </div>
        </div>

        <div className="form-field-full">
          <label className="field-label">Note</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={unitForm.notes}
            onChange={(e) => updateUnitForm("notes", e.target.value)}
            placeholder="Add notes"
          />
        </div>

        <div className="form-actions-right">
          <button type="submit" className="btn-add-project">
            SAVE UNIT
          </button>
        </div>
      </form>
    </div>
  );
}
