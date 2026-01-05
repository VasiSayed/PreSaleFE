import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function ProjectUnitConfigForm({ setup, leadSetup, projects, onSuccess }) {
  console.log("🎨 ProjectUnitConfigForm Props:");
  console.log("  - setup:", setup);
  console.log("  - setup.lookups:", setup?.lookups);
  console.log("  - setup.lookups.unit_types:", setup?.lookups?.unit_types);
  console.log("  - leadSetup:", leadSetup);
  console.log("  - leadSetup.offering_types:", leadSetup?.offering_types);
  console.log("  - projects:", projects);

  const [formData, setFormData] = useState({
    project: "",
    unitTypes: "",
    offeringType: "",
    projectDescription: "",
    projectImage: null,
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

      if (formData.projectDescription) {
        payload.append("project_lead[project_description]", formData.projectDescription);
      }
      if (formData.projectImage) {
        payload.append("project_lead[logo]", formData.projectImage);
      }
      
      if (formData.unitTypes) {
        payload.append("project_lead[unit_types]", JSON.stringify([Number(formData.unitTypes)]));
      }

      if (formData.offeringType) {
        payload.append("budget_offer[offering_types]", JSON.stringify([Number(formData.offeringType)]));
      }

      console.log("📤 Submitting payload:");
      for (let pair of payload.entries()) {
        console.log(`  ${pair[0]}:`, pair[1]);
      }

      await LeadSetupAPI.saveSetup(payload);
      
      alert("Project & Unit Configuration saved successfully!");
      
      setFormData({
        project: "",
        unitTypes: "",
        offeringType: "",
        projectDescription: "",
        projectImage: null,
      });
      
      onSuccess && onSuccess();
      
    } catch (err) {
      console.error("❌ Error saving configuration:", err);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateForm("projectImage", file);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Project & Unit Configuration</h3>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-grid">
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

          <div className="form-field">
            <label className="field-label">Unit Type</label>
            <select
              className="field-input"
              value={formData.unitTypes}
              onChange={(e) => updateForm("unitTypes", e.target.value)}
              disabled={loading}
            >
              <option value="">Select Unit Type</option>
              {setup?.lookups?.unit_types ? (
                setup.lookups.unit_types.map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name}
                  </option>
                ))
              ) : (
                <option disabled>No unit types available</option>
              )}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Offering Type</label>
            <select
              className="field-input"
              value={formData.offeringType}
              onChange={(e) => updateForm("offeringType", e.target.value)}
              disabled={loading}
            >
              <option value="">Select Offering Type</option>
              {leadSetup?.offering_types ? (
                leadSetup.offering_types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))
              ) : (
                <option disabled>No offering types available</option>
              )}
            </select>
          </div>
        </div>

        <div className="form-field-full">
          <label className="field-label">Project Description</label>
          <textarea
            className="field-textarea"
            rows={4}
            value={formData.projectDescription}
            onChange={(e) => updateForm("projectDescription", e.target.value)}
            placeholder="Grand Heights Residencies offers luxurious urban living with state-of-the-art amenities and breathtaking city views. Each unit is designed for comfort and modern aesthetics."
            disabled={loading}
          />
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Project Image/Logo</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                className="field-input"
                type="text"
                value={formData.projectImage ? formData.projectImage.name : ""}
                placeholder="No file selected"
                readOnly
                style={{ flex: 1 }}
              />
              <label className="btn-secondary" style={{ margin: 0, cursor: "pointer" }}>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions-right">
          <button 
            type="submit" 
            className="btn-add-project"
            disabled={loading}
          >
            {loading ? "SAVING..." : "SAVE CONFIGURATION"}
          </button>
        </div>
      </form>
    </div>
  );
}