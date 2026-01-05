import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function LeadClassificationForm({ leadSetup, projects, onSuccess }) {
  const [formData, setFormData] = useState({
    project: "",
    newClassification: "",
    selectedParent: null, // For adding sub-classifications
    newSubclassification: "",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));

  // Add root classification
  const handleAddClassification = async () => {
    if (!formData.project) {
      alert("Please select a project first");
      return;
    }
    if (!formData.newClassification.trim()) {
      alert("Please enter a classification name");
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.createClassification({
        name: formData.newClassification.trim(),
        project: Number(formData.project),
        parent: null, // Root level
      });

      alert("Classification added successfully!");
      updateForm("newClassification", "");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error adding classification:", err);
      alert("Failed to add classification");
    } finally {
      setLoading(false);
    }
  };

  // Add sub-classification
  const handleAddSubclassification = async (parentId) => {
    if (!formData.newSubclassification.trim()) {
      alert("Please enter a sub-classification name");
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.createClassification({
        name: formData.newSubclassification.trim(),
        project: Number(formData.project),
        parent: parentId,
      });

      alert("Sub-classification added successfully!");
      updateForm("newSubclassification", "");
      updateForm("selectedParent", null);
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error adding sub-classification:", err);
      alert("Failed to add sub-classification");
    } finally {
      setLoading(false);
    }
  };

  // Delete classification
  const handleDeleteClassification = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.deleteClassification(id);
      alert("Classification deleted successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error deleting classification:", err);
      alert("Failed to delete classification");
    } finally {
      setLoading(false);
    }
  };

  // Render classification tree recursively
  const renderClassificationTree = (classifications, level = 0) => {
    return classifications.map((classification) => (
      <div key={classification.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            background: level === 0 ? "#fff" : "#f9fafb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <span style={{ fontSize: "0.95rem", color: "#111827", fontWeight: level === 0 ? 600 : 400 }}>
              {classification.name}
            </span>
            {level === 0 && (
              <button
                type="button"
                onClick={() => {
                  updateForm("selectedParent", classification.id);
                  updateForm("newSubclassification", "");
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.8rem",
                  background: "#e0e7ff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#4f46e5",
                }}
                disabled={loading}
              >
                + Add Sub
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDeleteClassification(classification.id, classification.name)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "18px",
            }}
            disabled={loading}
          >
            ⊗
          </button>
        </div>

        {/* Render children recursively */}
        {classification.children && classification.children.length > 0 && (
          <div>{renderClassificationTree(classification.children, level + 1)}</div>
        )}

        {/* Add sub-classification form */}
        {formData.selectedParent === classification.id && (
          <div style={{ marginLeft: "20px", marginTop: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                className="field-input"
                value={formData.newSubclassification}
                onChange={(e) => updateForm("newSubclassification", e.target.value)}
                placeholder="Enter sub-classification name"
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => handleAddSubclassification(classification.id)}
                className="btn-primary"
                style={{ whiteSpace: "nowrap", fontSize: "0.9rem" }}
                disabled={loading}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  updateForm("selectedParent", null);
                  updateForm("newSubclassification", "");
                }}
                style={{
                  padding: "8px 16px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Lead Classification Setup</h3>
      </div>

      <div className="project-form">
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

        {/* Lead Classifications Section */}
        <div className="form-section-divider">
          <h4 className="form-section-title">Lead Classifications</h4>
        </div>

        {/* List of Classifications (Tree) */}
        {leadSetup?.classifications && leadSetup.classifications.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderClassificationTree(leadSetup.classifications)}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", marginBottom: "16px" }}>
            {formData.project ? "No classifications yet. Add one below." : "Select a project to view classifications."}
          </div>
        )}

        {/* Add New Classification Input */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            className="field-input"
            value={formData.newClassification}
            onChange={(e) => updateForm("newClassification", e.target.value)}
            placeholder="Enter new classification name"
            style={{ flex: 1 }}
            disabled={loading || !formData.project}
          />
          <button
            type="button"
            onClick={handleAddClassification}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
            disabled={loading || !formData.project}
          >
            <span>⊕</span>
            {loading ? "Adding..." : "Add New Classification"}
          </button>
        </div>

        {/* Info message */}
        <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "6px", fontSize: "0.9rem", color: "#1e40af" }}>
          💡 Tip: Click "+ Add Sub" on any classification to create sub-categories
        </div>
      </div>
    </div>
  );
}