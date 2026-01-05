// src/pages/ChannelPartnerSetup/forms/LeadManagementForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints";

export default function LeadManagementForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    enableLeadSharing: false,
    crmIntegration: "",
  });

  const [crmIntegrations, setCrmIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const updateForm = (key, val) => setFormData((f) => ({ ...f, [key]: val }));

  // Load CRM integrations
  const loadCrmIntegrations = async () => {
    setLoadingMasters(true);
    try {
      const data = await ChannelAPI.listCrmIntegrations();
      setCrmIntegrations(data.results || data);
    } catch (err) {
      console.error("Error loading CRM integrations:", err);
    } finally {
      setLoadingMasters(false);
    }
  };

  useEffect(() => {
    loadCrmIntegrations();
  }, []);

  // Populate from partner when it changes
  useEffect(() => {
    if (partner) {
      setFormData({
        enableLeadSharing: !!partner.enable_lead_sharing,
        crmIntegration:
          partner.crm_integration?.id || partner.crm_integration_id || "",
      });
    } else {
      setFormData({
        enableLeadSharing: false,
        crmIntegration: "",
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
      enable_lead_sharing: formData.enableLeadSharing,
      crm_integration_id: formData.crmIntegration || null,
    };

    try {
      const data = await ChannelAPI.updateSection(
        partnerId,
        "lead_mgmt",
        payload
      );
      alert("Lead Management saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving lead management:", error);
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
        enableLeadSharing: !!partner.enable_lead_sharing,
        crmIntegration:
          partner.crm_integration?.id || partner.crm_integration_id || "",
      });
    } else {
      setFormData({
        enableLeadSharing: false,
        crmIntegration: "",
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-section-note">
        <p>How leads will be shared and which CRM is connected.</p>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Enable Lead Sharing</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.enableLeadSharing}
              onChange={(e) =>
                updateForm("enableLeadSharing", e.target.checked)
              }
            />
            <span className="toggle-slider"></span>
          </label>
          <small className="field-note">
            Allow leads to be pushed automatically to the CRM.
          </small>
        </div>

        <div className="form-field">
          <label className="field-label">CRM Integration:</label>
          <select
            className="field-input"
            value={formData.crmIntegration}
            onChange={(e) => updateForm("crmIntegration", e.target.value)}
            disabled={loadingMasters}
          >
            <option value="">Select</option>
            {crmIntegrations.map((crm) => (
              <option key={crm.id} value={crm.id}>
                {crm.name}
              </option>
            ))}
          </select>
          {loadingMasters && (
            <small className="field-note">Loading CRMs...</small>
          )}
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

// export default function LeadManagementForm({ partnerId, onSave }) {
//   const [formData, setFormData] = useState({
//     enableLeadSharing: false,
//     crmIntegration: "",
//   });

//   const [crmIntegrations, setCrmIntegrations] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadCrmIntegrations();

//     if (partnerId) {
//       loadLeadManagementData(partnerId);
//     }
//   }, [partnerId]);

//   const loadCrmIntegrations = async () => {
//     try {
//       const response = await fetch("/api/channel/crm-integrations/");
//       const data = await response.json();
//       setCrmIntegrations(data.results || data);
//     } catch (error) {
//       console.error("Error loading CRM integrations:", error);
//     }
//   };

//   const loadLeadManagementData = async (id) => {
//     try {
//       const response = await fetch(`/api/channel/partners/${id}/`);
//       const data = await response.json();

//       setFormData({
//         enableLeadSharing: data.enable_lead_sharing || false,
//         crmIntegration: data.crm_integration?.id || "",
//       });
//     } catch (error) {
//       console.error("Error loading lead management data:", error);
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
//       enable_lead_sharing: formData.enableLeadSharing,
//       crm_integration_id: formData.crmIntegration || null,
//     };

//     try {
//       const response = await fetch(
//         `/api/channel/partners/${partnerId}/update_section/`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             section: "lead_mgmt",
//             data: payload,
//           }),
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         alert("Lead Management saved successfully!");
//         if (onSave) onSave(data);
//       } else {
//         const error = await response.json();
//         alert(`Error: ${JSON.stringify(error)}`);
//       }
//     } catch (error) {
//       console.error("Error saving lead management data:", error);
//       alert("Error saving data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setFormData({
//       enableLeadSharing: false,
//       crmIntegration: "",
//     });
//   };

//   return (
//     <div className="form-container">
//       <div className="form-section-note">
//         <p>How leads will be shared and managed</p>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Enable Lead Sharing</label>
//           <label className="toggle-switch">
//             <input
//               type="checkbox"
//               checked={formData.enableLeadSharing}
//               onChange={(e) =>
//                 updateForm("enableLeadSharing", e.target.checked)
//               }
//             />
//             <span className="toggle-slider"></span>
//           </label>
//           <small className="field-note">
//             Allow leads to be shared directly with CRM.
//           </small>
//         </div>

//         <div className="form-field">
//           <label className="field-label">CRM Integration:</label>
//           <select
//             className="field-input"
//             value={formData.crmIntegration}
//             onChange={(e) => updateForm("crmIntegration", e.target.value)}
//           >
//             <option value="">Select</option>
//             {crmIntegrations.map((crm) => (
//               <option key={crm.id} value={crm.id}>
//                 {crm.name}
//               </option>
//             ))}
//           </select>
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
