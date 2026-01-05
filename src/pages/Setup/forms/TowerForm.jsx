import { useState, useRef } from "react";
import { TowerAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function TowerForm({ setup, projects, onSuccess }) {
  const [towerForm, setTowerForm] = useState({
    project: "",
    name: "",
    towertype: "",
    totalfloors: "",
    status: "",
    notes: "",
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [importProjectId, setImportProjectId] = useState(null);

  const excelInputRef = useRef(null);

  const updateTowerForm = (key, val) =>
    setTowerForm((f) => ({ ...f, [key]: val }));

  // ---------- IMPORT EXCEL FLOW ----------

  const handleExcelButtonClick = () => {
    // open project selection modal
    setShowProjectModal(true);
  };

  const handleProjectSelectForImport = (projectId) => {
    setImportProjectId(projectId);
    // also set in normal tower form for convenience
    setTowerForm((prev) => ({ ...prev, project: String(projectId) }));
    setShowProjectModal(false);

    // after modal closes, trigger file chooser
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
      await axiosInstance.post("client/towers/upload-excel/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Towers Excel imported successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail || "Failed to import Towers Excel";
      alert(msg);
    } finally {
      e.target.value = "";
    }
  };

  // ---------- NORMAL ADD TOWER FLOW ----------

  const handleAddTower = async (e) => {
    e.preventDefault();
    if (!towerForm.project || !towerForm.name.trim()) {
      alert("Project and Tower Name are required");
      return;
    }

    const payload = {
      project: Number(towerForm.project),
      name: towerForm.name,
      towertype: towerForm.towertype ? Number(towerForm.towertype) : null,
      totalfloors: towerForm.totalfloors ? Number(towerForm.totalfloors) : 0,
      status: towerForm.status || "DRAFT",
      notes: towerForm.notes || "",
    };

    try {
      await TowerAPI.create(payload);
      alert("Tower created successfully!");

      setTowerForm({
        project: towerForm.project, // Keep selected project
        name: "",
        towertype: "",
        totalfloors: "",
        status: "",
        notes: "",
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create tower");
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
                  Choose a project for which you want to import towers from
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
        <h3>Add Tower</h3>
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

      {/* ---------- ADD TOWER FORM ---------- */}
      <form onSubmit={handleAddTower} className="project-form">
        {/* Row 1: Project, Tower Name, Tower Type */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Select Project <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={towerForm.project}
              onChange={(e) => updateTowerForm("project", e.target.value)}
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
              Tower Name <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={towerForm.name}
              onChange={(e) => updateTowerForm("name", e.target.value)}
              placeholder="Enter tower name"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Tower Type</label>
            <select
              className="field-input"
              value={towerForm.towertype}
              onChange={(e) => updateTowerForm("towertype", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.tower_types?.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Total Floors, Status */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Total Floors</label>
            <input
              className="field-input"
              type="number"
              value={towerForm.totalfloors}
              onChange={(e) => updateTowerForm("totalfloors", e.target.value)}
              placeholder="Enter total floors"
              min="0"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Status</label>
            <select
              className="field-input"
              value={towerForm.status}
              onChange={(e) => updateTowerForm("status", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.statuses?.floor?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-field-full">
          <label className="field-label">Note</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={towerForm.notes}
            onChange={(e) => updateTowerForm("notes", e.target.value)}
            placeholder="Add notes"
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions-right">
          <button type="submit" className="btn-add-project">
            ADD TOWER
          </button>
        </div>
      </form>
    </div>
  );
}
