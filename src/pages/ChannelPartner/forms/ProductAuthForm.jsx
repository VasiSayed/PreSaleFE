// import { useState } from "react";

// export default function ProductAuthForm() {
//   const [formData, setFormData] = useState({
//     project1: false,
//     project2: false,
//     project3: false,
//   });

//   const updateForm = (key, val) =>
//     setFormData((f) => ({ ...f, [key]: val }));

//   const handleSave = () => {
//     console.log("Product Authorization Data:", formData);
//     alert("Product Authorization saved! (Static)");
//   };

//   const handleCancel = () => {
//     setFormData({
//       project1: false,
//       project2: false,
//       project3: false,
//     });
//   };

//   return (
//     <div className="form-container">
//       <div className="form-row">
//         <div className="form-field">
//           <label className="field-label">Project 1</label>
//           <label className="toggle-switch">
//             <input
//               type="checkbox"
//               checked={formData.project1}
//               onChange={(e) => updateForm("project1", e.target.checked)}
//             />
//             <span className="toggle-slider"></span>
//           </label>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Project 2</label>
//           <label className="toggle-switch">
//             <input
//               type="checkbox"
//               checked={formData.project2}
//               onChange={(e) => updateForm("project2", e.target.checked)}
//             />
//             <span className="toggle-slider"></span>
//           </label>
//         </div>

//         <div className="form-field">
//           <label className="field-label">Project 3</label>
//           <label className="toggle-switch">
//             <input
//               type="checkbox"
//               checked={formData.project3}
//               onChange={(e) => updateForm("project3", e.target.checked)}
//             />
//             <span className="toggle-slider"></span>
//           </label>
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

// import { useState, useEffect } from "react";

// export default function ProductAuthForm({ partnerId, onSave }) {
//   const [projects, setProjects] = useState([]);
//   const [selectedProjects, setSelectedProjects] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadProjects();

//     if (partnerId) {
//       loadAuthorizedProjects(partnerId);
//     }
//   }, [partnerId]);

//   const loadProjects = async () => {
//     try {
//       // Call the API to get projects with units
//       const response = await fetch("/api/client/my-scope/?include_units=true");
//       const data = await response.json();

//       // Extract projects from the response
//       const projectsList = data.projects || [];
//       setProjects(projectsList);
//     } catch (error) {
//       console.error("Error loading projects:", error);
//     }
//   };

//   const loadAuthorizedProjects = async (id) => {
//     try {
//       const response = await fetch(`/api/channel/partners/${id}/`);
//       const data = await response.json();

//       // Extract authorized project IDs
//       const authorizedIds = (data.project_authorizations || []).map(
//         (auth) => auth.project
//       );
//       setSelectedProjects(authorizedIds);
//     } catch (error) {
//       console.error("Error loading authorized projects:", error);
//     }
//   };

//   const toggleProject = (projectId) => {
//     setSelectedProjects((prev) => {
//       if (prev.includes(projectId)) {
//         return prev.filter((id) => id !== projectId);
//       } else {
//         return [...prev, projectId];
//       }
//     });
//   };

//   const handleSave = async () => {
//     if (!partnerId) {
//       alert("Please save partner identity first");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetch(
//         `/api/channel/partners/${partnerId}/update_section/`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             section: "product_auth",
//             data: {
//               project_ids: selectedProjects,
//             },
//           }),
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         alert("Product Authorization saved successfully!");
//         if (onSave) onSave(data);
//       } else {
//         const error = await response.json();
//         alert(`Error: ${JSON.stringify(error)}`);
//       }
//     } catch (error) {
//       console.error("Error saving product authorization:", error);
//       alert("Error saving data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     setSelectedProjects([]);
//   };

//   return (
//     <div className="form-container">
//       <div className="form-section-note">
//         <p>Select projects this channel partner is authorized to sell</p>
//       </div>

//       {projects.length === 0 ? (
//         <div className="form-row">
//           <p>Loading projects...</p>
//         </div>
//       ) : (
//         <div
//           className="form-row"
//           style={{ flexDirection: "column", gap: "1rem" }}
//         >
//           {projects.map((project) => (
//             <div
//               key={project.id}
//               className="form-field"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "1rem",
//                 padding: "0.75rem",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "0.5rem",
//                 background: selectedProjects.includes(project.id)
//                   ? "#f0f9ff"
//                   : "white",
//               }}
//             >
//               <label className="toggle-switch">
//                 <input
//                   type="checkbox"
//                   checked={selectedProjects.includes(project.id)}
//                   onChange={() => toggleProject(project.id)}
//                 />
//                 <span className="toggle-slider"></span>
//               </label>

//               <div style={{ flex: 1 }}>
//                 <div style={{ fontWeight: "600", fontSize: "1rem" }}>
//                   {project.name}
//                 </div>
//                 <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
//                   Status: {project.status} | Approval: {project.approval_status}
//                   {project.towers && project.towers.length > 0 && (
//                     <span> | {project.towers.length} tower(s)</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

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


// forms/ProductAuthForm.jsx
import { useState, useEffect } from "react";
import { ChannelAPI } from "../../../api/endpoints"; // adjust path

export default function ProductAuthForm({ partnerId, partner, onSave }) {
  const [projects, setProjects] = useState([]);          // <-- local state
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load projects from channel/setup-bundle
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const bundle = await ChannelAPI.getSetupBundle();
      setProjects(bundle.projects || []);
    } catch (error) {
      console.error("Error loading projects for product auth:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Initial selection from partner.project_authorizations
  useEffect(() => {
    if (partner && partner.project_authorizations) {
      setSelectedProjects(
        partner.project_authorizations.map((auth) => auth.project)
      );
    } else {
      setSelectedProjects([]);
    }
  }, [partner]);

  const toggleProject = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = async () => {
    if (!partnerId) {
      alert("Please select/save a partner first");
      return;
    }

    setLoading(true);

    try {
      const data = await ChannelAPI.updateSection(partnerId, "product_auth", {
        project_ids: selectedProjects,
      });
      alert("Product Authorization saved successfully!");
      if (onSave) onSave(data);
    } catch (error) {
      console.error("Error saving product authorization:", error);
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
    if (partner && partner.project_authorizations) {
      setSelectedProjects(
        partner.project_authorizations.map((auth) => auth.project)
      );
    } else {
      setSelectedProjects([]);
    }
  };

  return (
    <div className="form-container">
      <div className="form-section-note">
        <p>Select projects this channel partner is authorized to sell</p>
      </div>

      {loadingProjects ? (
        <div className="form-row">
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="form-row">
          <p>No projects available in setup-bundle.</p>
        </div>
      ) : (
        <div
          className="form-row"
          style={{ flexDirection: "column", gap: "1rem" }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className="form-field"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                background: selectedProjects.includes(project.id)
                  ? "#f0f9ff"
                  : "white",
              }}
            >
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                />
                <span className="toggle-slider"></span>
              </label>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                  {project.name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Status: {project.status} | Approval:{" "}
                  {project.approval_status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

