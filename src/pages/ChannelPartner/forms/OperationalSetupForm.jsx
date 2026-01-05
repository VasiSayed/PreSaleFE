// forms/OperationalSetupForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints"; // adjust path

export default function OperationalSetupForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    onboardingStatus: "",
    supportContact: "",
    setupNotes: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        onboardingStatus: partner.onboarding_status || "",
        supportContact: partner.dedicated_support_contact_email || "",
        setupNotes: partner.technical_setup_notes || "",
      });
    } else {
      setFormData({
        onboardingStatus: "",
        supportContact: "",
        setupNotes: "",
      });
    }
  }, [partner]);

  const updateForm = (key, val) =>
    setFormData((f) => ({
      ...f,
      [key]: val,
    }));

  const handleSave = async () => {
    if (!partnerId) {
      alert("Please save Channel Partner Identity first");
      return;
    }

    setLoading(true);

    const payload = {
      onboarding_status: formData.onboardingStatus || null,
      dedicated_support_contact_email: formData.supportContact || "",
      technical_setup_notes: formData.setupNotes || "",
    };

    try {
      const data = await ChannelAPI.updateSection(
        partnerId,
        "operational",
        payload
      );
      alert("Operational Setup saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving operational setup:", error);
      const msg = error.response?.data
        ? JSON.stringify(error.response.data)
        : "Error saving data";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (partner) {
      setFormData({
        onboardingStatus: partner.onboarding_status || "",
        supportContact: partner.dedicated_support_contact_email || "",
        setupNotes: partner.technical_setup_notes || "",
      });
    } else {
      setFormData({
        onboardingStatus: "",
        supportContact: "",
        setupNotes: "",
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Onboarding Status</label>
          <select
            className="field-input"
            value={formData.onboardingStatus}
            onChange={(e) => updateForm("onboardingStatus", e.target.value)}
          >
            <option value="">Select</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">Dedicated Support Contact</label>
          <input
            className="field-input"
            type="email"
            placeholder="support@acmesolutions.com"
            value={formData.supportContact}
            onChange={(e) => updateForm("supportContact", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Technical Setup Notes</label>
          <textarea
            className="field-input"
            rows="3"
            placeholder="Any special integrations or setup requirements."
            value={formData.setupNotes}
            onChange={(e) => updateForm("setupNotes", e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={loading || !partnerId}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
