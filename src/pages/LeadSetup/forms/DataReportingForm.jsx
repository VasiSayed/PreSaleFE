import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function DataReportingForm({ leadSetup, projects, onSuccess }) {
  const [formData, setFormData] = useState({
    project: "",
    reportType: "SUMMARY",
    exportFormat: "CSV",
    frequency: "WEEKLY",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project) {
      alert("Project is required");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("project", Number(formData.project));

      // Reporting section
      payload.append("reporting[report_type]", formData.reportType);
      payload.append("reporting[export_format]", formData.exportFormat);
      payload.append("reporting[frequency]", formData.frequency);

      await LeadSetupAPI.saveSetup(payload);

      alert("Data & Reporting Settings saved successfully!");

      setFormData({
        project: "",
        reportType: "SUMMARY",
        exportFormat: "CSV",
        frequency: "WEEKLY",
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error saving reporting settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Data & Reporting</h3>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {/* Project Selection */}
        <div className="form-field" style={{ marginBottom: "24px" }}>
          <label className="field-label">
            Select Project <span className="required">*</span>
          </label>
          <select
            className="field-input"
            value={formData.project}
            onChange={(e) => updateForm("project", e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Report Type */}
        <div className="form-field" style={{ marginBottom: "20px" }}>
          <label className="field-label">Report Type</label>
          <select
            className="field-input"
            value={formData.reportType}
            onChange={(e) => updateForm("reportType", e.target.value)}
            disabled={loading}
          >
            <option value="SUMMARY">Summary</option>
            <option value="DETAILED">Detailed</option>
            <option value="ANALYTICS">Analytics</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        {/* Auto-Export Format */}
        <div className="form-field" style={{ marginBottom: "20px" }}>
          <label className="field-label">Auto-Export Format</label>
          <select
            className="field-input"
            value={formData.exportFormat}
            onChange={(e) => updateForm("exportFormat", e.target.value)}
            disabled={loading}
          >
            <option value="CSV">CSV</option>
            <option value="EXCEL">Excel</option>
            <option value="PDF">PDF</option>
            <option value="JSON">JSON</option>
          </select>
        </div>

        {/* Frequency */}
        <div className="form-field" style={{ marginBottom: "32px" }}>
          <label className="field-label">Frequency</label>
          <select
            className="field-input"
            value={formData.frequency}
            onChange={(e) => updateForm("frequency", e.target.value)}
            disabled={loading}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setFormData({
              project: "",
              reportType: "SUMMARY",
              exportFormat: "CSV",
              frequency: "WEEKLY",
            })}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: "10px 24px",
              background: "#6366f1",
              fontSize: "0.9rem",
            }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}