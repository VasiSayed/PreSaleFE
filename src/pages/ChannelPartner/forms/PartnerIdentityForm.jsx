// import { useState } from "react";

// export default function PartnerIdentityForm() {
//   const [formData, setFormData] = useState({
//     partnerId: "",
//     firstName: "",
//     lastName: "",
//     parentAgent: "",
//     agentType: "",
//     emailId: "",
//     mobileNumber: "",
//     address: "",
//     password: "",
//     panNumber: "",
//     gstIn: "",
//     companyName: "",
//     commission: "",
//     reraNumber: "",
//     updateDate: "",
//   });

//   const updateForm = (key, val) =>
//     setFormData((f) => ({ ...f, [key]: val }));

//   const handleSave = () => {
//     console.log("Identity Data:", formData);
//     alert("Channel Partner Identity saved! (Static)");
//   };

//   const handleCancel = () => {
//     setFormData({
//       partnerId: "",
//       firstName: "",
//       lastName: "",
//       parentAgent: "",
//       agentType: "",
//       emailId: "",
//       mobileNumber: "",
//       address: "",
//       password: "",
//       panNumber: "",
//       gstIn: "",
//       companyName: "",
//       commission: "",
//       reraNumber: "",
//       updateDate: "",
//     });
//   };

//   return (
//     <div className="form-container">
//       {/* 3-Column Grid */}
//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Partner ID:</label>
//           <input
//             className="field-input"
//             value={formData.partnerId}
//             onChange={(e) => updateForm("partnerId", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">First Name:</label>
//           <input
//             className="field-input"
//             value={formData.firstName}
//             onChange={(e) => updateForm("firstName", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Last Name:</label>
//           <input
//             className="field-input"
//             value={formData.lastName}
//             onChange={(e) => updateForm("lastName", e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Parent Agent:</label>
//           <select
//             className="field-input"
//             value={formData.parentAgent}
//             onChange={(e) => updateForm("parentAgent", e.target.value)}
//           >
//             <option value="">Select</option>
//             <option value="agent1">Agent 1</option>
//             <option value="agent2">Agent 2</option>
//           </select>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Agent Type:</label>
//           <select
//             className="field-input"
//             value={formData.agentType}
//             onChange={(e) => updateForm("agentType", e.target.value)}
//           >
//             <option value="">Select</option>
//             <option value="individual">Individual</option>
//             <option value="corporate">Corporate</option>
//           </select>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Email ID:</label>
//           <input
//             className="field-input"
//             type="email"
//             value={formData.emailId}
//             onChange={(e) => updateForm("emailId", e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Mobile Number:</label>
//           <input
//             className="field-input"
//             value={formData.mobileNumber}
//             onChange={(e) => updateForm("mobileNumber", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Address:</label>
//           <input
//             className="field-input"
//             value={formData.address}
//             onChange={(e) => updateForm("address", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Password:</label>
//           <input
//             className="field-input"
//             type="password"
//             value={formData.password}
//             onChange={(e) => updateForm("password", e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">PAN Number:</label>
//           <input
//             className="field-input"
//             value={formData.panNumber}
//             onChange={(e) => updateForm("panNumber", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">GST IN:</label>
//           <input
//             className="field-input"
//             value={formData.gstIn}
//             onChange={(e) => updateForm("gstIn", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Company Name:</label>
//           <input
//             className="field-input"
//             value={formData.companyName}
//             onChange={(e) => updateForm("companyName", e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Commission:</label>
//           <select
//             className="field-input"
//             value={formData.commission}
//             onChange={(e) => updateForm("commission", e.target.value)}
//           >
//             <option value="">Select</option>
//             <option value="5">5%</option>
//             <option value="10">10%</option>
//             <option value="15">15%</option>
//           </select>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Rera Number:</label>
//           <input
//             className="field-input"
//             value={formData.reraNumber}
//             onChange={(e) => updateForm("reraNumber", e.target.value)}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Update Date:</label>
//           <input
//             className="field-input"
//             type="date"
//             value={formData.updateDate}
//             onChange={(e) => updateForm("updateDate", e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Action Buttons */}
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

// forms/PartnerIdentityForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints"; // adjust path if needed

export default function PartnerIdentityForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    partnerId: "",
    firstName: "",
    lastName: "",
    parentAgent: "",
    agentType: "",
    source: "",
    subSource: "",
    emailId: "",
    mobileNumber: "",
    address: "",
    password: "",
    panNumber: "",
    gstIn: "",
    companyName: "",
    commission: "",
    reraNumber: "",
    updateDate: "",
  });

  const [loading, setLoading] = useState(false);

  // masters from /api/channel/setup-bundle/
  const [agentTypes, setAgentTypes] = useState([]);
  const [parentAgents, setParentAgents] = useState([]);
  const [sources, setSources] = useState([]);
  const [subSources, setSubSources] = useState([]);

  // ---- 1) Load setup-bundle on mount ----
  useEffect(() => {
    const loadSetupBundle = async () => {
      try {
        const data = await ChannelAPI.getSetupBundle();

        // parent agents
        setParentAgents(data.parent_agents || []);

        // agent types
        setAgentTypes(data.masters?.agent_types || []);

        // sources (backend can put this in multiple places, handle generically)
        const srcs =
          (data.masters &&
            (data.masters.sources || data.masters.lead_sources)) ||
          data.sources ||
          [];
        setSources(srcs);
      } catch (err) {
        console.error("Error loading channel setup-bundle:", err);
      }
    };

    loadSetupBundle();
  }, []);

  // ---- 2) When partner prop changes, pre-fill the form ----
  useEffect(() => {
    if (partner) {
      setFormData({
        partnerId: partner.id,
        firstName: partner.user?.first_name || "",
        lastName: partner.user?.last_name || "",
        parentAgent: partner.parent_agent?.id || "",
        agentType: partner.agent_type?.id || "",
        source: partner.source?.id || "",
        subSource: partner.sub_source?.id || "",
        emailId: partner.user?.email || "",
        mobileNumber: partner.mobile_number || "",
        address: partner.address || "",
        password: "",
        panNumber: partner.pan_number || "",
        gstIn: partner.gst_in || "",
        companyName: partner.company_name || "",
        commission: partner.commission_text || "",
        reraNumber: partner.rera_number || "",
        updateDate: partner.last_update_date || "",
      });
    } else {
      // new partner
      setFormData({
        partnerId: "",
        firstName: "",
        lastName: "",
        parentAgent: "",
        agentType: "",
        source: "",
        subSource: "",
        emailId: "",
        mobileNumber: "",
        address: "",
        password: "",
        panNumber: "",
        gstIn: "",
        companyName: "",
        commission: "",
        reraNumber: "",
        updateDate: "",
      });
    }
  }, [partner]);

  // ---- 3) Sub-source options depend on selected source ----
  useEffect(() => {
    const selected = sources.find(
      (s) => String(s.id) === String(formData.source)
    );

    if (selected && (selected.sub_sources || selected.children)) {
      const subs = selected.sub_sources || selected.children || [];
      setSubSources(subs);
    } else {
      setSubSources([]);
      setFormData((prev) => ({ ...prev, subSource: "" }));
    }
  }, [formData.source, sources]);

  const updateForm = (key, val) =>
    setFormData((f) => ({
      ...f,
      [key]: val,
    }));

  // ---- 4) Save (create or update_section: identity) ----
  const handleSave = async () => {
    if (!formData.emailId) {
      alert("Email is required");
      return;
    }
    if (!partnerId && !formData.password) {
      alert("Password is required for new partner");
      return;
    }

    setLoading(true);

    const payload = {
      email: formData.emailId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      password: formData.password || undefined, // backend can ignore on PATCH
      parent_agent_id: formData.parentAgent || null,
      agent_type_id: formData.agentType || null,
      source_id: formData.source || null,
      mobile_number: formData.mobileNumber,
      address: formData.address,
      pan_number: formData.panNumber,
      gst_in: formData.gstIn,
      company_name: formData.companyName,
      commission_text: formData.commission,
      rera_number: formData.reraNumber,
      last_update_date: formData.updateDate || null,
      // NOTE: not sending sub_source_id yet because it’s not in your API sample.
      // When backend adds it, just add: sub_source_id: formData.subSource || null,
    };

    try {
      let data;
      if (partnerId) {
        // update existing partner's identity section
        data = await ChannelAPI.updateSection(partnerId, "identity", payload);
      } else {
        // create new partner
        data = await ChannelAPI.createPartner(payload);
      }

      alert("Channel Partner Identity saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving identity:", error);
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
      // reset back to partner values
      setFormData({
        partnerId: partner.id,
        firstName: partner.user?.first_name || "",
        lastName: partner.user?.last_name || "",
        parentAgent: partner.parent_agent?.id || "",
        agentType: partner.agent_type?.id || "",
        source: partner.source?.id || "",
        subSource: partner.sub_source?.id || "",
        emailId: partner.user?.email || "",
        mobileNumber: partner.mobile_number || "",
        address: partner.address || "",
        password: "",
        panNumber: partner.pan_number || "",
        gstIn: partner.gst_in || "",
        companyName: partner.company_name || "",
        commission: partner.commission_text || "",
        reraNumber: partner.rera_number || "",
        updateDate: partner.last_update_date || "",
      });
    } else {
      // clear form for new partner
      setFormData({
        partnerId: "",
        firstName: "",
        lastName: "",
        parentAgent: "",
        agentType: "",
        source: "",
        subSource: "",
        emailId: "",
        mobileNumber: "",
        address: "",
        password: "",
        panNumber: "",
        gstIn: "",
        companyName: "",
        commission: "",
        reraNumber: "",
        updateDate: "",
      });
    }
  };

  return (
    <div className="form-container">
      {/* 3-Column Grid */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Partner ID:</label>
          <input
            className="field-input"
            value={formData.partnerId}
            disabled
            style={{ background: "#f3f4f6" }}
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            First Name: <span style={{ color: "red" }}>*</span>
          </label>
          <input
            className="field-input"
            value={formData.firstName}
            onChange={(e) => updateForm("firstName", e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label className="field-label">
            Last Name: <span style={{ color: "red" }}>*</span>
          </label>
          <input
            className="field-input"
            value={formData.lastName}
            onChange={(e) => updateForm("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        {/* Parent Agent */}
        <div className="form-field">
          <label className="field-label">Parent Agent:</label>
          <select
            className="field-input"
            value={formData.parentAgent}
            onChange={(e) => updateForm("parentAgent", e.target.value)}
          >
            <option value="">Select</option>
            {parentAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.label || agent.name || agent.id}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Type */}
        <div className="form-field">
          <label className="field-label">Agent Type:</label>
          <select
            className="field-input"
            value={formData.agentType}
            onChange={(e) => updateForm("agentType", e.target.value)}
          >
            <option value="">Select</option>
            {agentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div className="form-field">
          <label className="field-label">Source:</label>
          <select
            className="field-input"
            value={formData.source}
            onChange={(e) => updateForm("source", e.target.value)}
          >
            <option value="">Select</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Sub Source row – only if backend sends sub_sources */}
      {subSources.length > 0 && (
        <div className="form-row">
          <div className="form-field">
            <label className="field-label">Sub Source:</label>
            <select
              className="field-input"
              value={formData.subSource}
              onChange={(e) => updateForm("subSource", e.target.value)}
            >
              <option value="">Select</option>
              {subSources.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">
            Email ID: <span style={{ color: "red" }}>*</span>
          </label>
          <input
            className="field-input"
            type="email"
            value={formData.emailId}
            onChange={(e) => updateForm("emailId", e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label className="field-label">Mobile Number:</label>
          <input
            className="field-input"
            value={formData.mobileNumber}
            onChange={(e) => updateForm("mobileNumber", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Address:</label>
          <input
            className="field-input"
            value={formData.address}
            onChange={(e) => updateForm("address", e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">
            Password: {!partnerId && <span style={{ color: "red" }}>*</span>}
          </label>
          <input
            className="field-input"
            type="password"
            value={formData.password}
            onChange={(e) => updateForm("password", e.target.value)}
            placeholder={partnerId ? "Leave blank to keep current" : ""}
            required={!partnerId}
          />
        </div>

        <div className="form-field">
          <label className="field-label">PAN Number:</label>
          <input
            className="field-input"
            value={formData.panNumber}
            onChange={(e) => updateForm("panNumber", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">GST IN:</label>
          <input
            className="field-input"
            value={formData.gstIn}
            onChange={(e) => updateForm("gstIn", e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Company Name:</label>
          <input
            className="field-input"
            value={formData.companyName}
            onChange={(e) => updateForm("companyName", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Commission:</label>
          <input
            className="field-input"
            value={formData.commission}
            onChange={(e) => updateForm("commission", e.target.value)}
            placeholder="e.g., 5%, 10%, Custom terms"
          />
        </div>

        <div className="form-field">
          <label className="field-label">Rera Number:</label>
          <input
            className="field-input"
            value={formData.reraNumber}
            onChange={(e) => updateForm("reraNumber", e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
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
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}


