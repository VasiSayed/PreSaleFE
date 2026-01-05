import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function SiteVisitSettingForm({ leadSetup, projects, onSuccess }) {
  const [formData, setFormData] = useState({
    project: "",
    enableScheduledVisits: true,
    defaultFollowupDays: 3,
    notifyEmail: true,
    notifySMS: false,
    notifyInApp: true,
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

      // Build notify_channels array
      const notifyChannels = [];
      if (formData.notifyEmail) notifyChannels.push("EMAIL");
      if (formData.notifySMS) notifyChannels.push("SMS");
      if (formData.notifyInApp) notifyChannels.push("IN_APP");

      // Site Settings section
      payload.append("site_settings[enable_scheduled_visits]", formData.enableScheduledVisits);
      payload.append("site_settings[default_followup_days]", formData.defaultFollowupDays);
      payload.append("site_settings[notify_channels]", JSON.stringify(notifyChannels));

      await LeadSetupAPI.saveSetup(payload);

      alert("Site Visit Settings saved successfully!");

      setFormData({
        project: "",
        enableScheduledVisits: true,
        defaultFollowupDays: 3,
        notifyEmail: true,
        notifySMS: false,
        notifyInApp: true,
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error saving site visit settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Site Visit Settings</h3>
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

        {/* Enable Scheduled Visits */}
        <div style={{ marginBottom: "24px" }}>
          <div className="form-section-title" style={{ marginBottom: "12px" }}>
            Enable Scheduled Visits
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
            }}
          >
            <label style={{ fontSize: "0.95rem", color: "#374151" }}>
              Allow clients to schedule site visits
            </label>
            <label
              style={{
                position: "relative",
                display: "inline-block",
                width: "48px",
                height: "24px",
              }}
            >
              <input
                type="checkbox"
                checked={formData.enableScheduledVisits}
                onChange={(e) => updateForm("enableScheduledVisits", e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
                disabled={loading}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: loading ? "not-allowed" : "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: formData.enableScheduledVisits ? "#6366f1" : "#d1d5db",
                  transition: "0.3s",
                  borderRadius: "24px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: "",
                    height: "18px",
                    width: "18px",
                    left: formData.enableScheduledVisits ? "26px" : "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    transition: "0.3s",
                    borderRadius: "50%",
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Default Follow-up Days */}
        <div className="form-field" style={{ marginBottom: "24px" }}>
          <label className="field-label">Default Follow-up Time (Days)</label>
          <select
            className="field-input"
            value={formData.defaultFollowupDays}
            onChange={(e) => updateForm("defaultFollowupDays", Number(e.target.value))}
            disabled={loading}
          >
            <option value={1}>1 Day</option>
            <option value={2}>2 Days</option>
            <option value={3}>3 Days</option>
            <option value={5}>5 Days</option>
            <option value={7}>7 Days (1 Week)</option>
            <option value={14}>14 Days (2 Weeks)</option>
          </select>
        </div>

        {/* Notify via */}
        <div style={{ marginBottom: "24px" }}>
          <label className="field-label" style={{ marginBottom: "12px", display: "block" }}>
            Notify via
          </label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.notifyEmail}
                onChange={(e) => updateForm("notifyEmail", e.target.checked)}
                disabled={loading}
              />
              <span>Email</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.notifySMS}
                onChange={(e) => updateForm("notifySMS", e.target.checked)}
                disabled={loading}
              />
              <span>SMS</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.notifyInApp}
                onChange={(e) => updateForm("notifyInApp", e.target.checked)}
                disabled={loading}
              />
              <span>In-App</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="form-actions-right">
          <button
            type="submit"
            className="btn-add-project"
            disabled={loading}
          >
            {loading ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </form>
    </div>
  );
}