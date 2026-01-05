// import { useState } from "react";

// export default function ComplianceDocsForm() {
//   const [formData, setFormData] = useState({
//     regulatoryCompliance: false,
//     businessLicense: null,
//   });

//   const updateForm = (key, val) =>
//     setFormData((f) => ({ ...f, [key]: val }));

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     updateForm("businessLicense", file);
//   };

//   const handleSave = () => {
//     console.log("Compliance Data:", formData);
//     alert("Compliance and Documents saved! (Static)");
//   };

//   const handleCancel = () => {
//     setFormData({
//       regulatoryCompliance: false,
//       businessLicense: null,
//     });
//   };

//   return (
//     <div className="form-container">
//       <div className="form-section-note">
//         <p>Regulatory adherence and required legal documents.</p>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Regulatory Compliance Approved</label>
//           <label className="toggle-switch">
//             <input
//               type="checkbox"
//               checked={formData.regulatoryCompliance}
//               onChange={(e) => updateForm("regulatoryCompliance", e.target.checked)}
//             />
//             <span className="toggle-slider"></span>
//           </label>
//           <small className="field-note">Confirm all regulatory requirements are met.</small>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Business License</label>
//           <div className="file-upload-wrapper">
//             <input
//               type="file"
//               id="business-license"
//               className="file-input"
//               onChange={handleFileChange}
//               accept=".pdf,.jpg,.png"
//             />
//             <label htmlFor="business-license" className="file-upload-btn">
//               📎 Upload File
//             </label>
//             {formData.businessLicense && (
//               <span className="file-name">{formData.businessLicense.name}</span>
//             )}
//           </div>
//           <small className="field-note">Upload valid business license document.</small>
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

// forms/ComplianceDocsForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints"; // adjust path

export default function ComplianceDocsForm({ partnerId, partner, onSave }) {
  const [formData, setFormData] = useState({
    regulatoryCompliance: false,
  });

  const [attachments, setAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("BUSINESS_LICENSE");
  const [fileDescription, setFileDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        regulatoryCompliance: !!partner.regulatory_compliance_approved,
      });
    } else {
      setFormData({
        regulatoryCompliance: false,
      });
    }
  }, [partner]);

  useEffect(() => {
    if (partnerId) {
      loadAttachments(partnerId);
    } else {
      setAttachments([]);
    }
  }, [partnerId]);

  const loadAttachments = async (id) => {
    try {
      const data = await ChannelAPI.listAttachments(id);
      setAttachments(data.results || data || []);
    } catch (error) {
      console.error("Error loading attachments:", error);
    }
  };

  const updateForm = (key, val) =>
    setFormData((f) => ({
      ...f,
      [key]: val,
    }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !partnerId) {
      alert("Please select a file and save partner identity first");
      return;
    }

    setUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append("file", selectedFile);
    formDataUpload.append("file_type", fileType);
    formDataUpload.append("description", fileDescription);

    try {
      await ChannelAPI.uploadAttachment(partnerId, formDataUpload);
      alert("File uploaded successfully!");
      setSelectedFile(null);
      setFileDescription("");
      const input = document.getElementById("business-license");
      if (input) input.value = "";
      loadAttachments(partnerId);
    } catch (error) {
      console.error("Error uploading file:", error);
      const msg =
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Error uploading file";
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?"))
      return;

    try {
      await ChannelAPI.deleteAttachment(partnerId, attachmentId);
      alert("Attachment deleted successfully!");
      loadAttachments(partnerId);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      const msg =
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Error deleting attachment";
      alert(msg);
    }
  };

  const handleSave = async () => {
    if (!partnerId) {
      alert("Please save partner identity first");
      return;
    }

    setLoading(true);

    const payload = {
      regulatory_compliance_approved: formData.regulatoryCompliance,
    };

    try {
      const data = await ChannelAPI.updateSection(partnerId, "compliance", payload);
      alert("Compliance status saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving compliance data:", error);
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
        regulatoryCompliance: !!partner.regulatory_compliance_approved,
      });
    } else {
      setFormData({
        regulatoryCompliance: false,
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-section-note">
        <p>Regulatory adherence and required legal documents.</p>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Regulatory Compliance Approved</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.regulatoryCompliance}
              onChange={(e) =>
                updateForm("regulatoryCompliance", e.target.checked)
              }
            />
            <span className="toggle-slider"></span>
          </label>
          <small className="field-note">
            Confirm all regulatory requirements are met.
          </small>
        </div>
      </div>

      {/* File Upload Section */}
      <div
        className="form-row"
        style={{ flexDirection: "column", gap: "1rem" }}
      >
        <h4>Document Uploads</h4>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="field-label">Document Type</label>
            <select
              className="field-input"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="BUSINESS_LICENSE">Business License</option>
              <option value="AGREEMENT">Agreement</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-field" style={{ flex: 2 }}>
            <label className="field-label">Description</label>
            <input
              className="field-input"
              type="text"
              placeholder="Document description"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ flex: 2 }}>
            <label className="field-label">File</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="business-license"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="business-license" className="file-upload-btn">
                📎 Choose File
              </label>
              {selectedFile && (
                <span className="file-name">{selectedFile.name}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn-save"
            onClick={handleFileUpload}
            disabled={uploading || !selectedFile || !partnerId}
            style={{ height: "fit-content" }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* List of attachments */}
        {attachments.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h5>Uploaded Documents</h5>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>
                    Description
                  </th>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>
                    Uploaded
                  </th>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr
                    key={attachment.id}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "0.5rem" }}>
                      {attachment.file_type}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {attachment.description || "-"}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {attachment.created_at
                        ? new Date(
                            attachment.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <a
                        href={attachment.file_url || attachment.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginRight: "1rem", color: "#3b82f6" }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        style={{
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
