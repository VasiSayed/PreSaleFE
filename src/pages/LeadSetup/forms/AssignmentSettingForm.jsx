import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function AssignmentSettingForm({ leadSetup, users, projects, onSuccess }) {
const [formData, setFormData] = useState({
  project: "",
  source: "",
  assignee: "", // Single user ID (not array)
  availabilityStrategy: "ROUND_ROBIN",
  isActive: true,
  notes: "",
});
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));

  const handleAssigneeToggle = (userId) => {
    const current = formData.assignees;
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    updateForm("assignees", updated);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.project) {
    alert("Project is required");
    return;
  }

  if (!formData.assignee) {
    alert("Please select an assignee");
    return;
  }

  setLoading(true);

  try {
    const payload = new FormData();
    payload.append("project", Number(formData.project));

    // Build assignment rule as proper object (not stringified)
    const rule = {
      project: Number(formData.project),
      source: formData.source ? Number(formData.source) : null,
      assignees: [Number(formData.assignee)], // Single assignee in array
      availability_strategy: formData.availabilityStrategy,
      is_active: formData.isActive,
      notes: formData.notes || "",
    };

    // Append as nested FormData fields (not JSON string)
    payload.append("assignment_rules[0][project]", rule.project);
    payload.append("assignment_rules[0][source]", rule.source || "");
    payload.append("assignment_rules[0][assignees]", JSON.stringify(rule.assignees));
    payload.append("assignment_rules[0][availability_strategy]", rule.availability_strategy);
    payload.append("assignment_rules[0][is_active]", rule.is_active);
    payload.append("assignment_rules[0][notes]", rule.notes);

    await LeadSetupAPI.saveSetup(payload);

      alert("Assignment Settings saved successfully!");

setFormData({
  project: "",
  source: "",
  assignee: "",
  availabilityStrategy: "ROUND_ROBIN",
  isActive: true,
  notes: "",
});
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error saving assignment settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Assignment Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {/* Project Selection */}
        <div className="form-field">
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

        {/* Lead Source (Optional) */}
        <div className="form-field">
          <label className="field-label">Assign by Source (Optional)</label>
          <select
            className="field-input"
            value={formData.source}
            onChange={(e) => updateForm("source", e.target.value)}
            disabled={loading}
          >
            <option value="">All Sources (Default Rule)</option>
            {leadSetup?.sources?.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Owner/Sales Agent (Single Select) */}
<div className="form-field">
  <label className="field-label">
    Lead Owner/Sales Agent <span className="required">*</span>
  </label>
  <select
    className="field-input"
    value={formData.assignee}
    onChange={(e) => updateForm("assignee", e.target.value)}
    required
    disabled={loading}
  >
    <option value="">Select User</option>
    {users && users.length > 0 ? (
      users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.username || user.email || `User ${user.id}`}
        </option>
      ))
    ) : (
      <option disabled>No users available</option>
    )}
  </select>
</div>
        {/* Auto Assignment Toggle */}
        <div style={{ marginTop: "24px", marginBottom: "24px" }}>
          <div className="form-section-title" style={{ marginBottom: "12px" }}>
            Auto Assignment
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
              Enable automatic lead distribution
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
                checked={formData.isActive}
                onChange={(e) => updateForm("isActive", e.target.checked)}
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
                  backgroundColor: formData.isActive ? "#6366f1" : "#d1d5db",
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
                    left: formData.isActive ? "26px" : "3px",
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

        {/* Assignment Rules Box */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px",
            background: "#fafafa",
            marginBottom: "20px",
          }}
        >
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            Assignment Strategy
          </h4>

          {/* Assign by Availability Strategy */}
          <div className="form-field">
            <label className="field-label">Distribution Strategy</label>
            <select
              className="field-input"
              value={formData.availabilityStrategy}
              onChange={(e) => updateForm("availabilityStrategy", e.target.value)}
              disabled={loading}
            >
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="LEAST_LOAD">Least Busy</option>
              <option value="RANDOM">Random</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-field" style={{ marginTop: "16px" }}>
            <label className="field-label">Notes (Optional)</label>
            <textarea
              className="field-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="Add notes about this assignment rule..."
              disabled={loading}
            />
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