// src/pages/ChannelPartnerSetup/forms/ProgramEnrolmentForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints";

export default function ProgramEnrolmentForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    partnerTier: "",
    programStartDate: "",
    programEndDate: "",
  });

  const [partnerTiers, setPartnerTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const updateForm = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

  // Load partner tiers for dropdown
  const loadPartnerTiers = async () => {
    setLoadingMasters(true);
    try {
      const data = await ChannelAPI.listPartnerTiers();
      setPartnerTiers(data.results || data);
    } catch (err) {
      console.error("Error loading partner tiers:", err);
    } finally {
      setLoadingMasters(false);
    }
  };

  useEffect(() => {
    loadPartnerTiers();
  }, []);

  // When partner changes, populate form
  useEffect(() => {
    if (partner) {
      setFormData({
        partnerTier: partner.partner_tier?.id || partner.partner_tier_id || "",
        programStartDate: partner.program_start_date || "",
        programEndDate: partner.program_end_date || "",
      });
    } else {
      setFormData({
        partnerTier: "",
        programStartDate: "",
        programEndDate: "",
      });
    }
  }, [partner]);

  const handleSave = async () => {
    if (!partnerId) {
      alert("Please select a partner from the top dropdown.");
      return;
    }

    setLoading(true);

    const payload = {
      partner_tier_id: formData.partnerTier || null,
      program_start_date: formData.programStartDate || null,
      program_end_date: formData.programEndDate || null,
    };

    try {
      const data = await ChannelAPI.updateSection(
        partnerId,
        "program",
        payload
      );
      alert("Program Enrolment saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving program enrolment:", error);
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
        partnerTier: partner.partner_tier?.id || partner.partner_tier_id || "",
        programStartDate: partner.program_start_date || "",
        programEndDate: partner.program_end_date || "",
      });
    } else {
      setFormData({
        partnerTier: "",
        programStartDate: "",
        programEndDate: "",
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Partner Tier:</label>
          <select
            className="field-input"
            value={formData.partnerTier}
            onChange={(e) => updateForm("partnerTier", e.target.value)}
            disabled={loadingMasters}
          >
            <option value="">Select</option>
            {partnerTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </select>
          {loadingMasters && (
            <small className="field-note">Loading tiers...</small>
          )}
        </div>

        <div className="form-field">
          <label className="field-label">Program Start Date:</label>
          <input
            className="field-input"
            type="date"
            value={formData.programStartDate}
            onChange={(e) => updateForm("programStartDate", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Program End Date:</label>
          <input
            className="field-input"
            type="date"
            value={formData.programEndDate}
            onChange={(e) => updateForm("programEndDate", e.target.value)}
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

// import { useState, useEffect } from "react";

// export default function ProgramEnrolmentForm({ partnerId, onSave }) {
//   const [formData, setFormData] = useState({
//     partnerTier: "",
//     programStartDate: "",
//     programEndDate: "",
//   });

//   const [partnerTiers, setPartnerTiers] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadPartnerTiers();

//     if (partnerId) {
//       loadProgramData(partnerId);
//     }
//   }, [partnerId]);

//   const loadPartnerTiers = async () => {
//     try {
//       const response = await fetch("/api/channel/partner-tiers/");
//       const data = await response.json();
//       setPartnerTiers(data.results || data);
//     } catch (error) {
//       console.error("Error loading partner tiers:", error);
//     }
//   };

//   const loadProgramData = async (id) => {
//     try {
//       const response = await fetch(`/api/channel/partners/${id}/`);
//       const data = await response.json();

//       setFormData({
//         partnerTier: data.partner_tier?.id || "",
//         programStartDate: data.program_start_date || "",
//         programEndDate: data.program_end_date || "",
//       });
//     } catch (error) {
//       console.error("Error loading program data:", error);
//     }
//   };

//   const updateForm = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

//   const handleSave = async () => {
//     if (!partnerId) {
//       alert("Please save partner identity first");
//       return;
//     }

//     setLoading(true);

//     const payload = {
//       partner_tier_id: formData.partnerTier || null,
//       program_start_date: formData.programStartDate || null,
//       program_end_date: formData.programEndDate || null,
//     };

//     try {
//       const response = await fetch(
//         `/api/channel/partners/${partnerId}/update_section/`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             section: "program",
//             data: payload,
//           }),
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         alert("Program Enrolment saved successfully!");
//         if (onSave) onSave(data);
//       } else {
//         const error = await response.json();
//         alert(`Error: ${JSON.stringify(error)}`);
//       }
//     } catch (error) {
//       console.error("Error saving program data:", error);
//       alert("Error saving data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setFormData({
//       partnerTier: "",
//       programStartDate: "",
//       programEndDate: "",
//     });
//   };

//   return (
//     <div className="form-container">
//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Partner Tier:</label>
//           <select
//             className="field-input"
//             value={formData.partnerTier}
//             onChange={(e) => updateForm("partnerTier", e.target.value)}
//           >
//             <option value="">Select</option>
//             {partnerTiers.map((tier) => (
//               <option key={tier.id} value={tier.id}>
//                 {tier.name} ({tier.code})
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Program Start Date:</label>
//           <input
//             className="field-input"
//             type="date"
//             value={formData.programStartDate}
//             onChange={(e) => updateForm("programStartDate", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Program End Date:</label>
//           <input
//             className="field-input"
//             type="date"
//             value={formData.programEndDate}
//             onChange={(e) => updateForm("programEndDate", e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="form-actions">
//         <button
//           type="button"
//           className="btn-cancel"
//           onClick={handleCancel}
//           disabled={loading}
//         >
//           Cancel
//         </button>
//         <button
//           type="button"
//           className="btn-save"
//           onClick={handleSave}
//           disabled={loading || !partnerId}
//         >
//           {loading ? "Saving..." : "Save"}
//         </button>
//       </div>
//     </div>
//   );
// }
