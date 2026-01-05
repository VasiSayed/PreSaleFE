// import { useState, useEffect } from "react";

// export default function SystemAuditForm() {
//   const [formData, setFormData] = useState({
//     lastModifiedBy: "Admin User",
//     lastModifiedDate: "",
//   });

//   useEffect(() => {
//     // Set current date/time
//     const now = new Date().toISOString().slice(0, 16);
//     setFormData((f) => ({ ...f, lastModifiedDate: now }));
//   }, []);

//   return (
//     <div className="form-container">
//       <div className="form-section-note">
//         <p>Automatic audit trail for this record.</p>
//       </div>

//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Last Modified By</label>
//           <input
//             className="field-input"
//             type="text"
//             value={formData.lastModifiedBy}
//             readOnly
//             style={{ background: "#f3f4f6" }}
//           />
//         </div>

//         <div className="form-field">
//           <label className="field-label">Last Modified Date</label>
//           <input
//             className="field-input"
//             type="datetime-local"
//             value={formData.lastModifiedDate}
//             readOnly
//             style={{ background: "#f3f4f6" }}
//           />
//         </div>
//       </div>

//       <div className="form-actions">
//         <button type="button" className="btn-cancel" disabled>
//           Cancel
//         </button>
//         <button type="button" className="btn-save" disabled>
//           Save
//         </button>
//       </div>
//     </div>
//   );
// }

// forms/SystemAuditForm.jsx
import { useState, useEffect } from "react";

export default function SystemAuditForm({ partner }) {
  const [formData, setFormData] = useState({
    createdBy: "",
    createdAt: "",
    lastModifiedBy: "",
    lastModifiedDate: "",
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        createdBy:
          partner.created_by_user?.full_name ||
          partner.created_by_user?.email ||
          "Unknown",
        createdAt: partner.created_at
          ? new Date(partner.created_at).toLocaleString()
          : "",
        lastModifiedBy:
          partner.last_modified_by_user?.full_name ||
          partner.last_modified_by_user?.email ||
          "Unknown",
        lastModifiedDate: partner.last_modified_at
          ? new Date(partner.last_modified_at).toLocaleString()
          : "",
      });
    } else {
      const now = new Date().toLocaleString();
      setFormData({
        createdBy: "Current User",
        createdAt: now,
        lastModifiedBy: "Current User",
        lastModifiedDate: now,
      });
    }
  }, [partner]);

  return (
    <div className="form-container">
      <div className="form-section-note">
        <p>Automatic audit trail for this record.</p>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Created By</label>
          <input
            className="field-input"
            type="text"
            value={formData.createdBy}
            readOnly
            style={{ background: "#f3f4f6" }}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Created At</label>
          <input
            className="field-input"
            type="text"
            value={formData.createdAt}
            readOnly
            style={{ background: "#f3f4f6" }}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Last Modified By</label>
          <input
            className="field-input"
            type="text"
            value={formData.lastModifiedBy}
            readOnly
            style={{ background: "#f3f4f6" }}
          />
        </div>

        <div className="form-field">
          <label className="field-label">Last Modified Date</label>
          <input
            className="field-input"
            type="text"
            value={formData.lastModifiedDate}
            readOnly
            style={{ background: "#f3f4f6" }}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" disabled>
          Cancel
        </button>
        <button type="button" className="btn-save" disabled>
          Save
        </button>
      </div>
    </div>
  );
}

