import { useState } from "react";
import { LeadSetupAPI } from "../../../api/endpoints";

export default function BudgetOfferingForm({ leadSetup, projects, onSuccess }) {
  const [formData, setFormData] = useState({
    project: "",
    currency: "INR",
    budgetMin: "",
    budgetMax: "",
    offeringTypes: [], // Multi-select for offering types
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));

  const handleOfferingTypeToggle = (typeId) => {
    const current = formData.offeringTypes;
    const updated = current.includes(typeId)
      ? current.filter((id) => id !== typeId)
      : [...current, typeId];
    updateForm("offeringTypes", updated);
  };

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

      // Budget Offer section
      const budgetOffer = {};
      if (formData.currency) budgetOffer.currency = formData.currency;
      if (formData.budgetMin) budgetOffer.budget_min = formData.budgetMin;
      if (formData.budgetMax) budgetOffer.budget_max = formData.budgetMax;
      if (formData.offeringTypes.length > 0) {
        budgetOffer.offering_types = formData.offeringTypes;
      }

      // Send as nested JSON in FormData
      if (Object.keys(budgetOffer).length > 0) {
        Object.entries(budgetOffer).forEach(([key, value]) => {
          if (key === "offering_types") {
            payload.append(`budget_offer[${key}]`, JSON.stringify(value));
          } else {
            payload.append(`budget_offer[${key}]`, value);
          }
        });
      }

      await LeadSetupAPI.saveSetup(payload);

      alert("Budget & Offering Settings saved successfully!");

      setFormData({
        project: "",
        currency: "INR",
        budgetMin: "",
        budgetMax: "",
        offeringTypes: [],
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error saving budget settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Budget & Offering Settings</h3>
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

        {/* Default Currency */}
        <div className="form-field" style={{ marginTop: "20px" }}>
          <label className="field-label">Default Currency</label>
          <select
            className="field-input"
            value={formData.currency}
            onChange={(e) => updateForm("currency", e.target.value)}
            disabled={loading}
          >
            <option value="INR">INR (Indian Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
            <option value="AED">AED (UAE Dirham)</option>
          </select>
        </div>

        {/* Budget Range */}
        <div className="form-field" style={{ marginTop: "20px" }}>
          <label className="field-label">Budget Range</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <input
              className="field-input"
              type="number"
              value={formData.budgetMin}
              onChange={(e) => updateForm("budgetMin", e.target.value)}
              placeholder="Min budget"
              style={{ flex: 1 }}
              disabled={loading}
              step="0.01"
            />
            <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>to</span>
            <input
              className="field-input"
              type="number"
              value={formData.budgetMax}
              onChange={(e) => updateForm("budgetMax", e.target.value)}
              placeholder="Max budget"
              style={{ flex: 1 }}
              disabled={loading}
              step="0.01"
            />
          </div>
        </div>

        {/* Offering Types (Multi-select checkboxes) */}
        <div style={{ marginTop: "20px", marginBottom: "24px" }}>
          <label className="field-label" style={{ marginBottom: "12px", display: "block" }}>
            Offering Types
          </label>
          <div className="checkbox-group">
            {leadSetup?.offering_types?.map((type) => (
              <label key={type.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.offeringTypes.includes(type.id)}
                  onChange={() => handleOfferingTypeToggle(type.id)}
                  disabled={loading}
                />
                <span>{type.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="form-actions-right" style={{ marginTop: "24px" }}>
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