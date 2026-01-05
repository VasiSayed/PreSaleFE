import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function LeadSourceForm({ leadSetup, projects, onSuccess }) {
  const [formData, setFormData] = useState({
    project: "",
    newSource: "",
    selectedParent: null, // For adding sub-sources
    newSubsource: "",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));

  // Add root source
  const handleAddSource = async () => {
    if (!formData.project) {
      alert("Please select a project first");
      return;
    }
    if (!formData.newSource.trim()) {
      alert("Please enter a source name");
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.createSource({
        name: formData.newSource.trim(),
        project: Number(formData.project),
        parent: null, // Root level
      });

      alert("Source added successfully!");
      updateForm("newSource", "");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error adding source:", err);
      alert("Failed to add source");
    } finally {
      setLoading(false);
    }
  };

  // Add sub-source
  const handleAddSubsource = async (parentId) => {
    if (!formData.newSubsource.trim()) {
      alert("Please enter a sub-source name");
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.createSource({
        name: formData.newSubsource.trim(),
        project: Number(formData.project),
        parent: parentId,
      });

      alert("Sub-source added successfully!");
      updateForm("newSubsource", "");
      updateForm("selectedParent", null);
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error adding sub-source:", err);
      alert("Failed to add sub-source");
    } finally {
      setLoading(false);
    }
  };

  // Delete source
  const handleDeleteSource = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await LeadSetupAPI.deleteSource(id);
      alert("Source deleted successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error deleting source:", err);
      alert("Failed to delete source");
    } finally {
      setLoading(false);
    }
  };

  // Render source tree recursively
  const renderSourceTree = (sources, level = 0) => {
    return sources.map((source) => (
      <div key={source.id} style={{ marginLeft: `${level * 20}px` }}>
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
              {source.name}
            </span>
            {level === 0 && (
              <button
                type="button"
                onClick={() => {
                  updateForm("selectedParent", source.id);
                  updateForm("newSubsource", "");
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
            onClick={() => handleDeleteSource(source.id, source.name)}
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
        {source.children && source.children.length > 0 && (
          <div>{renderSourceTree(source.children, level + 1)}</div>
        )}

        {/* Add sub-source form */}
        {formData.selectedParent === source.id && (
          <div style={{ marginLeft: "20px", marginTop: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                className="field-input"
                value={formData.newSubsource}
                onChange={(e) => updateForm("newSubsource", e.target.value)}
                placeholder="Enter sub-source name"
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => handleAddSubsource(source.id)}
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
                  updateForm("newSubsource", "");
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
        <h3>Lead Source Setup</h3>
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

        {/* Lead Sources Section */}
        <div className="form-section-divider">
          <h4 className="form-section-title">Lead Sources</h4>
        </div>

        {/* List of Sources (Tree) */}
        {leadSetup?.sources && leadSetup.sources.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSourceTree(leadSetup.sources)}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", marginBottom: "16px" }}>
            {formData.project ? "No sources yet. Add one below." : "Select a project to view sources."}
          </div>
        )}

        {/* Add New Source Input */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            className="field-input"
            value={formData.newSource}
            onChange={(e) => updateForm("newSource", e.target.value)}
            placeholder="Enter new source name"
            style={{ flex: 1 }}
            disabled={loading || !formData.project}
          />
          <button
            type="button"
            onClick={handleAddSource}
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
            {loading ? "Adding..." : "Add New Source"}
          </button>
        </div>

        {/* Info message */}
        <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "6px", fontSize: "0.9rem", color: "#1e40af" }}>
          💡 Tip: Click "+ Add Sub" on any source to create sub-categories
        </div>
      </div>
    </div>
  );
}