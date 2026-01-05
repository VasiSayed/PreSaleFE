import { useState, useEffect } from "react";
import { LeadStageAPI } from "../../../api/endpoints";

export default function StagesForm({ projects, onSuccess }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize with Registration and Won
  const initializeStages = () => {
    return [
      { id: null, name: "Registration", order: 1, isFixed: true, isNew: false },
      { id: null, name: "", order: 2, isFixed: false, isNew: true },
      { id: null, name: "", order: 3, isFixed: false, isNew: true },
      { id: null, name: "", order: 4, isFixed: false, isNew: true },
      { id: null, name: "", order: 5, isFixed: false, isNew: true },
      { id: null, name: "", order: 6, isFixed: false, isNew: true },
      { id: null, name: "", order: 7, isFixed: false, isNew: true },
      { id: null, name: "Won", order: 8, isFixed: true, isNew: false },
    ];
  };

  // Load stages when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadStages();
    } else {
      setStages(initializeStages());
    }
  }, [selectedProjectId]);

  const loadStages = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    try {
      const data = await LeadStageAPI.getStages({ project_id: selectedProjectId });
      const stagesList = Array.isArray(data) ? data : data.results || [];

      if (stagesList.length === 0) {
        // No stages exist, initialize with defaults
        setStages(initializeStages());
      } else {
        // Map existing stages
        const mappedStages = initializeStages().map((defaultStage, index) => {
          const existingStage = stagesList.find(s => s.order === defaultStage.order);
          if (existingStage) {
            return {
              ...defaultStage,
              id: existingStage.id,
              name: existingStage.name,
              isNew: false,
            };
          }
          return defaultStage;
        });
        setStages(mappedStages);
      }
    } catch (error) {
      console.error("Failed to load stages:", error);
      setStages(initializeStages());
    } finally {
      setLoading(false);
    }
  };

  const updateStageName = (index, value) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], name: value };
    setStages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }

    // Validate all stages have names
    const emptyStages = stages.filter((s, i) => i > 0 && i < 7 && !s.name.trim());
    if (emptyStages.length > 0) {
      alert("Please fill all 6 middle stages");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload for all stages
      const promises = stages.map((stage) => {
        const payload = {
          name: stage.name,
          order: stage.order,
          project: Number(selectedProjectId),
        };

        if (stage.id && !stage.isNew) {
          // Update existing stage
          return LeadStageAPI.updateStage(stage.id, payload);
        } else if (stage.name.trim()) {
          // Create new stage
          return LeadStageAPI.createStage(payload);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      alert("Stages saved successfully!");
      loadStages(); // Reload
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to save stages:", error);
      alert("Failed to save stages. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (selectedProjectId) {
      loadStages();
    } else {
      setStages(initializeStages());
    }
  };

  const removeButtonStyle = {
    width: "28px",
    height: "28px",
    padding: 0,
    borderRadius: "4px",
    background: "white",
    border: "1px solid #dc2626",
    color: "#dc2626",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Stages Setup</h3>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {/* Project Selector */}
        <div className="form-grid" style={{ marginBottom: "24px" }}>
          <div className="form-field">
            <label className="field-label">
              Select Project <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Select Project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.project_name || `Project #${project.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedProjectId ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            Please select a project to manage stages
          </div>
        ) : loading ? (
          <div className="loading-spinner">Loading stages...</div>
        ) : (
          <>
            {/* Stages Label */}
            <div className="form-field-full" style={{ marginBottom: "12px" }}>
              <label className="field-label">Stages:</label>
            </div>

            {/* All 8 Stages */}
            {stages.map((stage, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="text"
                  className="field-input"
                  value={stage.name}
                  onChange={(e) => updateStageName(index, e.target.value)}
                  placeholder={stage.isFixed ? stage.name : `Enter stage ${index} name`}
                  readOnly={stage.isFixed}
                  disabled={submitting}
                  style={{
                    background: stage.isFixed ? "#f9fafb" : "white",
                    cursor: stage.isFixed ? "not-allowed" : "text",
                  }}
                  required={!stage.isFixed}
                />
                {!stage.isFixed && (
                  <button
                    type="button"
                    style={removeButtonStyle}
                    onClick={() => updateStageName(index, "")}
                    disabled={submitting}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "32px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={submitting}
                style={{ padding: "12px 32px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-add-project"
                disabled={submitting}
                style={{ padding: "12px 32px" }}
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}