import { useState, useEffect } from "react";
import { AdditionalInfoAPI } from "../../../api/endpoints";

export default function AdditionalInfoForm({ setup, projects, onSuccess }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Existing items from backend
  const [existingData, setExistingData] = useState({
    visitingHalf: [],
    familySize: [],
    residencyOwnership: [],
    possessionDesigned: [],
    occupations: [],
  });

  // New items to be added (array of strings)
  const [newItems, setNewItems] = useState({
    visitingHalf: [""],
    familySize: [""],
    residencyOwnership: [""],
    possessionDesigned: [""],
    occupations: [""],
  });

  // Load existing data when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadAllData();
    } else {
      setExistingData({
        visitingHalf: [],
        familySize: [],
        residencyOwnership: [],
        possessionDesigned: [],
        occupations: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const loadAllData = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    try {
      const params = { project_id: selectedProjectId };

      const [
        visitingHalfData,
        familySizeData,
        residencyOwnershipData,
        possessionDesignedData,
        occupationsData,
      ] = await Promise.all([
        AdditionalInfoAPI.getVisitingHalf(params),
        AdditionalInfoAPI.getFamilySize(params),
        AdditionalInfoAPI.getResidencyOwnership(params),
        AdditionalInfoAPI.getPossessionDesigned(params),
        AdditionalInfoAPI.getOccupations(params),
      ]);

      setExistingData({
        visitingHalf: Array.isArray(visitingHalfData) ? visitingHalfData : visitingHalfData.results || [],
        familySize: Array.isArray(familySizeData) ? familySizeData : familySizeData.results || [],
        residencyOwnership: Array.isArray(residencyOwnershipData) ? residencyOwnershipData : residencyOwnershipData.results || [],
        possessionDesigned: Array.isArray(possessionDesignedData) ? possessionDesignedData : possessionDesignedData.results || [],
        occupations: Array.isArray(occupationsData) ? occupationsData : occupationsData.results || [],
      });
    } catch (error) {
      console.error("Failed to load additional info data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new empty input field
  const handleAddField = (category) => {
    setNewItems((prev) => ({
      ...prev,
      [category]: [...prev[category], ""],
    }));
  };

  // Update value in new items array
  const handleUpdateField = (category, index, value) => {
    setNewItems((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) => (i === index ? value : item)),
    }));
  };

  // Remove field from new items
  const handleRemoveField = (category, index) => {
    setNewItems((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  // Delete existing item
  const handleDeleteExisting = async (category, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setSubmitting(true);
    try {
      const deleteMap = {
        visitingHalf: AdditionalInfoAPI.deleteVisitingHalf,
        familySize: AdditionalInfoAPI.deleteFamilySize,
        residencyOwnership: AdditionalInfoAPI.deleteResidencyOwnership,
        possessionDesigned: AdditionalInfoAPI.deletePossessionDesigned,
        occupations: AdditionalInfoAPI.deleteOccupation,
      };

      await deleteMap[category](id);
      alert("Item deleted successfully!");
      loadAllData();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save all new items
  const handleSaveAll = async () => {
    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }

    // Check if there are any new items to save
    const hasNewItems = Object.values(newItems).some((arr) => 
      arr.some((val) => val.trim())
    );

    if (!hasNewItems) {
      alert("No new items to save");
      return;
    }

    setSubmitting(true);
    try {
      const promises = [];

      // Helper to create payload
      const createPayload = (value) => ({
        name: value.trim(),
        code: value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 50),
        project: Number(selectedProjectId),
      });

      // Visiting Half
      newItems.visitingHalf.forEach((value) => {
        if (value.trim()) {
          promises.push(AdditionalInfoAPI.createVisitingHalf(createPayload(value)));
        }
      });

      // Family Size
      newItems.familySize.forEach((value) => {
        if (value.trim()) {
          promises.push(AdditionalInfoAPI.createFamilySize(createPayload(value)));
        }
      });

      // Residency Ownership
      newItems.residencyOwnership.forEach((value) => {
        if (value.trim()) {
          promises.push(AdditionalInfoAPI.createResidencyOwnership(createPayload(value)));
        }
      });

      // Possession Designed
      newItems.possessionDesigned.forEach((value) => {
        if (value.trim()) {
          promises.push(AdditionalInfoAPI.createPossessionDesigned(createPayload(value)));
        }
      });

      // Occupations
      newItems.occupations.forEach((value) => {
        if (value.trim()) {
          promises.push(AdditionalInfoAPI.createOccupation(createPayload(value)));
        }
      });

      await Promise.all(promises);

      alert("All items saved successfully!");

      // Reset new items to initial state (one empty field per category)
      setNewItems({
        visitingHalf: [""],
        familySize: [""],
        residencyOwnership: [""],
        possessionDesigned: [""],
        occupations: [""],
      });

      loadAllData();
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Failed to save items:", error);
      
      let errorMsg = "Failed to save some items. ";
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          errorMsg += Object.entries(data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('; ');
        } else {
          errorMsg += String(data);
        }
      }
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Render a category section
  const renderCategory = (title, category) => {
    return (
      <div className="form-field-full" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <label className="field-label" style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>
            {title}:
          </label>
          <button
            type="button"
            onClick={() => handleAddField(category)}
            disabled={submitting}
            title="Add new field"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "#102a54",
              color: "white",
              border: "none",
              fontSize: "20px",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0d1f3f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#102a54";
            }}
          >
            +
          </button>
        </div>

        {/* Existing items (read-only, with delete) */}
        {existingData[category].length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500" }}>
              Existing Items:
            </div>
            {existingData[category].map((item) => (
              <div key={item.id} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  className="field-input"
                  value={item.name}
                  readOnly
                  style={{ background: "#f9fafb", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(category, item.id)}
                  disabled={submitting}
                  title="Delete"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "4px",
                    background: "white",
                    border: "1px solid #dc2626",
                    color: "#dc2626",
                    fontSize: "20px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) e.currentTarget.style.background = "#fee2e2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New input fields */}
        {newItems[category].length > 0 && (
          <div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", fontWeight: "500" }}>
              New Items:
            </div>
            {newItems[category].map((value, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  className="field-input"
                  value={value}
                  onChange={(e) => handleUpdateField(category, index, e.target.value)}
                  placeholder="Enter value"
                  style={{ flex: 1 }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveField(category, index)}
                  disabled={submitting || newItems[category].length === 1}
                  title="Remove"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "4px",
                    background: "white",
                    border: "1px solid #dc2626",
                    color: "#dc2626",
                    fontSize: "20px",
                    cursor: (submitting || newItems[category].length === 1) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: newItems[category].length === 1 ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && newItems[category].length > 1) {
                      e.currentTarget.style.background = "#fee2e2";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Additional Information Setup</h3>
      </div>

      <div className="project-form">
        {/* Project Selector */}
        <div className="form-grid" style={{ marginBottom: "32px" }}>
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

        {/* Show loading or content */}
        {!selectedProjectId ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            Please select a project to manage additional information
          </div>
        ) : loading ? (
          <div className="loading-spinner">Loading additional information...</div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "40px", 
              marginBottom: "32px" 
            }}>
              {/* Left Column */}
              <div>
                {renderCategory("Visiting on behalf", "visitingHalf")}
                {renderCategory("Current Residence Type", "familySize")}
                {renderCategory("Occupation", "occupations")}
              </div>

              {/* Right Column */}
              <div>
                {renderCategory("Current Residence Ownership", "residencyOwnership")}
                {renderCategory("Possession Desired in", "possessionDesigned")}
              </div>
            </div>

            {/* Save All Button */}
            <div className="form-actions-right">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={submitting}
                style={{
                  background: "#102a54",
                  color: "white",
                  padding: "12px 40px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = "#0d1f3f";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#102a54";
                }}
              >
                {submitting ? "SAVING..." : "SAVE ALL"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}