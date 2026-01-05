import { useState, useRef } from "react";
import { FloorAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function FloorForm({ setup, projects, onSuccess }) {
  const [floorForm, setFloorForm] = useState({
    tower: "",
    number: "",
    totalunits: "",
    status: "",
    notes: "",
  });

  const [floorDocFile, setFloorDocFile] = useState(null);

  const fileInputRef = useRef(null); // for floor plan document
  const excelInputRef = useRef(null); // for excel import

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [importProjectId, setImportProjectId] = useState(null);

  const updateFloorForm = (key, val) =>
    setFloorForm((f) => ({ ...f, [key]: val }));

  // ---------- IMPORT EXCEL FLOW ----------

  const handleExcelButtonClick = () => {
    setShowProjectModal(true);
  };

  const handleProjectSelectForImport = (projectId) => {
    setImportProjectId(projectId);
    setShowProjectModal(false);

    // (optional) Nothing to set in floorForm directly, floors belong to tower
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
      await axiosInstance.post("client/floors/upload-excel/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Floors Excel imported successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail || "Failed to import Floors Excel";
      alert(msg);
    } finally {
      e.target.value = "";
    }
  };

  // ---------- NORMAL ADD FLOOR FLOW ----------

  const handleAddFloor = async (e) => {
    e.preventDefault();

    if (!floorForm.tower || !floorForm.number) {
      alert("Tower and Floor Number are required");
      return;
    }

    try {
      const payload = {
        tower: Number(floorForm.tower),
        number: String(floorForm.number),
        totalunits: floorForm.totalunits ? Number(floorForm.totalunits) : 0,
        status: floorForm.status || "DRAFT",
        notes: floorForm.notes || "",
      };

      const floor = await FloorAPI.create(payload);

      if (floorDocFile) {
        const fd = new FormData();
        fd.append("floor", floor.id);
        fd.append("file", floorDocFile);

        await axiosInstance.post("client/floor-docs/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert("Floor created successfully!");

      setFloorForm({
        tower: floorForm.tower,
        number: "",
        totalunits: "",
        status: "",
        notes: "",
      });
      setFloorDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create floor");
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
                  Choose a project for which you want to import floors from
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
        <h3>Add Floor</h3>
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

      {/* ---------- ADD FLOOR FORM ---------- */}
      <form onSubmit={handleAddFloor} className="project-form">
        {/* Row 1: Tower, Floor Number, Total Units */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Select Tower <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={floorForm.tower}
              onChange={(e) => updateFloorForm("tower", e.target.value)}
              required
            >
              <option value="">Select Tower</option>
              {projects.flatMap((p) =>
                (p.towers || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {p.name} - {t.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              Floor Number <span className="required">*</span>
            </label>
            <input
              className="field-input"
              type="text"
              value={floorForm.number}
              onChange={(e) => updateFloorForm("number", e.target.value)}
              placeholder="e.g., G, 1, 12A"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Total Units on Floor</label>
            <input
              className="field-input"
              type="number"
              value={floorForm.totalunits}
              onChange={(e) => updateFloorForm("totalunits", e.target.value)}
              placeholder="Enter total units"
              min="0"
            />
          </div>
        </div>

        {/* Row 2: Status, Floor Plan Document */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Status</label>
            <select
              className="field-input"
              value={floorForm.status}
              onChange={(e) => updateFloorForm("status", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.statuses?.floor?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Floor Plan Document</label>
            <div
              className="file-upload-box"
              onClick={() => fileInputRef.current?.click()}
              title="Click to choose file"
            >
              <svg
                className="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="32"
                height="32"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="upload-text">
                {floorDocFile ? floorDocFile.name : "Click to browse file"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              style={{ display: "none" }}
              onChange={(e) => setFloorDocFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-field-full">
          <label className="field-label">Note</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={floorForm.notes}
            onChange={(e) => updateFloorForm("notes", e.target.value)}
            placeholder="Add notes"
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions-right">
          <button type="submit" className="btn-add-project">
            ADD FLOOR
          </button>
        </div>
      </form>
    </div>
  );
}
