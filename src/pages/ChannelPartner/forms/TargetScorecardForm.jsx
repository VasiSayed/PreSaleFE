// import { useState } from "react";

// export default function TargetScorecardForm() {
//   const [formData, setFormData] = useState({
//     annualRevenue: "",
//     q1Performance: "",
//   });

//   const updateForm = (key, val) =>
//     setFormData((f) => ({ ...f, [key]: val }));

//   const handleSave = () => {
//     console.log("Target & Scorecard Data:", formData);
//     alert("Target & Scorecard saved! (Static)");
//   };

//   const handleCancel = () => {
//     setFormData({
//       annualRevenue: "",
//       q1Performance: "",
//     });
//   };

//   return (
//     <div className="form-container">
//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Annual Revenue Target (USD)</label>
//           <input
//             className="field-input"
//             type="number"
//             placeholder="500,000"
//             value={formData.annualRevenue}
//             onChange={(e) => updateForm("annualRevenue", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Q1 Performance</label>
//           <input
//             className="field-input"
//             type="text"
//             placeholder="Achieved 85%"
//             value={formData.q1Performance}
//             onChange={(e) => updateForm("q1Performance", e.target.value)}
//             readOnly
//             style={{ background: "#f3f4f6" }}
//           />
//         </div>
//       </div>

//       <div className="form-actions">
//         <button type="button" className="btn-cancel" onClick={handleCancel}>
//           Cancel
//         </button>
//         <button type="button" className="btn-save" onClick={handleSave}>
//           Save
//         </button>
//       </div>
//     </div>
//   );
// }

// forms/TargetScorecardForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints"; // adjust path

export default function TargetScorecardForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    annualRevenue: "",
    q1Performance: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        annualRevenue: partner.annual_revenue_target || "",
        q1Performance: partner.q1_performance_text || "",
      });
    } else {
      setFormData({
        annualRevenue: "",
        q1Performance: "",
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
      annual_revenue_target: formData.annualRevenue || null,
      q1_performance_text: formData.q1Performance,
    };

    try {
      const data = await ChannelAPI.updateSection(partnerId, "target", payload);
      alert("Target & Scorecard saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving target data:", error);
      const msg =
        error.response?.data
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
        annualRevenue: partner.annual_revenue_target || "",
        q1Performance: partner.q1_performance_text || "",
      });
    } else {
      setFormData({
        annualRevenue: "",
        q1Performance: "",
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Annual Revenue Target (USD)</label>
          <input
            className="field-input"
            type="number"
            placeholder="500000"
            value={formData.annualRevenue}
            onChange={(e) => updateForm("annualRevenue", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Q1 Performance</label>
          <input
            className="field-input"
            type="text"
            placeholder="Achieved 85%"
            value={formData.q1Performance}
            onChange={(e) => updateForm("q1Performance", e.target.value)}
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
