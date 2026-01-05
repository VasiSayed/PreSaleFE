// import { useState } from "react";
// import { ProjectAPI } from "../../../api/endpoints";
// import axiosInstance from "../../../api/axiosInstance";

// export default function ProjectForm({ setup, scope, isStaff, onSuccess }) {
//   const [projectForm, setProjectForm] = useState({
//     name: "",
//     location: "",
//     developer: "",
//     rerano: "",
//     startdate: "",
//     enddate: "",
//     possessiondate: "",
//     projecttype: "",
//     status: "",
//     approvalstatus: "",
//     notes: "",
//     adminid: "", // Staff only
//   });

//   const updateProjectForm = (key, val) =>
//     setProjectForm((f) => ({ ...f, [key]: val }));

//   const handleAddProject = async (e) => {
//     e.preventDefault();
    
//     if (!projectForm.name.trim()) {
//       alert("Project Name is required");
//       return;
//     }

//     // Staff validation
//     if (isStaff && !projectForm.adminid) {
//       alert("Admin ID is required for staff");
//       return;
//     }

//     const payload = {
//       name: projectForm.name,
//       location: projectForm.location || null,
//       developer: projectForm.developer || null,
//       rerano: projectForm.rerano || null,
//       startdate: projectForm.startdate || null,
//       enddate: projectForm.enddate || null,
//       possessiondate: projectForm.possessiondate || null,
//       projecttype: projectForm.projecttype ? Number(projectForm.projecttype) : null,
//       status: projectForm.status || "DRAFT",
//       approvalstatus: projectForm.approvalstatus || "PENDING",
//       notes: projectForm.notes || "",
//     };

//     // Add admin_id for staff
//     if (isStaff) {
//       payload.adminid = Number(projectForm.adminid);
//     }

//     try {
//       await ProjectAPI.create(payload);
//       alert("Project created successfully!");
      
//       setProjectForm({
//         name: "",
//         location: "",
//         developer: "",
//         rerano: "",
//         startdate: "",
//         enddate: "",
//         possessiondate: "",
//         projecttype: "",
//         status: "",
//         approvalstatus: "",
//         notes: "",
//         adminid: isStaff ? projectForm.adminid : "", // Keep admin_id for convenience
//       });
      
//       onSuccess && onSuccess();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to create project");
//     }
//   };

//   return (
//     <div className="project-form-container">
//       <div className="form-header">
//         <h3>Add Projects</h3>
//         <button type="button" className="btn-import">
//           <span className="import-icon">📄</span>
//           IMPORT EXCEL
//         </button>
//       </div>

//       <form onSubmit={handleAddProject} className="project-form">
//         {/* Row 1: Project Name, Location, Developer */}
//         <div className="form-grid">
//           <div className="form-field">
//             <label className="field-label">
//               Project Name <span className="required">*</span>
//             </label>
//             <input
//               className="field-input"
//               value={projectForm.name}
//               onChange={(e) => updateProjectForm("name", e.target.value)}
//               placeholder="Enter project name"
//               required
//             />
//           </div>

//           <div className="form-field">
//             <label className="field-label">Location</label>
//             <input
//               className="field-input"
//               value={projectForm.location}
//               onChange={(e) => updateProjectForm("location", e.target.value)}
//               placeholder="Enter location"
//             />
//           </div>

//           <div className="form-field">
//             <label className="field-label">Developer</label>
//             <input
//               className="field-input"
//               value={projectForm.developer}
//               onChange={(e) => updateProjectForm("developer", e.target.value)}
//               placeholder="Enter developer name"
//             />
//           </div>
//         </div>

//         {/* Row 2: Project Type, RERA No, (empty) */}
//         <div className="form-grid">
//           <div className="form-field">
//             <label className="field-label">Project Type</label>
//             <select
//               className="field-input"
//               value={projectForm.projecttype}
//               onChange={(e) => updateProjectForm("projecttype", e.target.value)}
//             >
//               <option value="">--Select--</option>
//               {setup?.lookups?.project_types?.map((pt) => (
//                 <option key={pt.id} value={pt.id}>
//                   {pt.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="form-field">
//             <label className="field-label">RERA No</label>
//             <input
//               className="field-input"
//               value={projectForm.rerano}
//               onChange={(e) => updateProjectForm("rerano", e.target.value)}
//               placeholder="Enter RERA number"
//             />
//           </div>
//         </div>

//         {/* Row 3: Start Date, End Date, Possession Date */}
//         <div className="form-grid">
//           <div className="form-field">
//             <label className="field-label">Start Date</label>
//             <input
//               className="field-input"
//               type="date"
//               value={projectForm.startdate}
//               onChange={(e) => updateProjectForm("startdate", e.target.value)}
//             />
//           </div>

//           <div className="form-field">
//             <label className="field-label">End Date</label>
//             <input
//               className="field-input"
//               type="date"
//               value={projectForm.enddate}
//               onChange={(e) => updateProjectForm("enddate", e.target.value)}
//             />
//           </div>

//           <div className="form-field">
//             <label className="field-label">Possession Date</label>
//             <input
//               className="field-input"
//               type="date"
//               value={projectForm.possessiondate}
//               onChange={(e) => updateProjectForm("possessiondate", e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Row 4: Project Status, Approval Status */}
//         <div className="form-grid">
//           <div className="form-field">
//             <label className="field-label">Project Status</label>
//             <select
//               className="field-input"
//               value={projectForm.status}
//               onChange={(e) => updateProjectForm("status", e.target.value)}
//             >
//               <option value="">--Select--</option>
//               {setup?.statuses?.project?.map((s) => (
//                 <option key={s.code} value={s.code}>
//                   {s.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="form-field">
//             <label className="field-label">Approval Status</label>
//             <select
//               className="field-input"
//               value={projectForm.approvalstatus}
//               onChange={(e) => updateProjectForm("approvalstatus", e.target.value)}
//             >
//               <option value="">--Select--</option>
//               {setup?.statuses?.approval?.map((s) => (
//                 <option key={s.code} value={s.code}>
//                   {s.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Staff-Only Field: Admin ID */}
//         {isStaff && (
//           <div className="form-grid">
//             <div className="form-field">
//               <label className="field-label">
//                 Admin ID (Owner) <span className="required">*</span>
//               </label>
//               <input
//                 className="field-input"
//                 placeholder="Admin user ID"
//                 value={projectForm.adminid}
//                 onChange={(e) => updateProjectForm("adminid", e.target.value)}
//               />
//             </div>
//           </div>
//         )}

//         {/* Row 5: Notes (full width) */}
//         <div className="form-field-full">
//           <label className="field-label">Note</label>
//           <textarea
//             className="field-textarea"
//             rows={3}
//             value={projectForm.notes}
//             onChange={(e) => updateProjectForm("notes", e.target.value)}
//             placeholder="Add notes"
//           />
//         </div>

//         {/* Submit Button */}
//         <div className="form-actions-right">
//           <button type="submit" className="btn-add-project">
//             ADD PROJECT
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }




import { useState, useRef } from "react";
import { ProjectAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function ProjectForm({ setup, scope, isStaff, onSuccess }) {
  const [projectForm, setProjectForm] = useState({
    name: "",
    location: "",
    developer: "",
    rerano: "",
    startdate: "",
    enddate: "",
    possessiondate: "",
    projecttype: "",
    status: "",
    approvalstatus: "",
    notes: "",
    adminid: "", // Staff only
  });

  // Hidden file input for Excel import
  const excelInputRef = useRef(null);

  const updateProjectForm = (key, val) =>
    setProjectForm((f) => ({ ...f, [key]: val }));

  const handleExcelButtonClick = () => {
    if (excelInputRef.current) {
      excelInputRef.current.click();
    }
  };

  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      await axiosInstance.post("client/projects/upload-excel/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Projects Excel imported successfully!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to import Projects Excel");
    } finally {
      // reset so same file can be reselected
      e.target.value = "";
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    if (!projectForm.name.trim()) {
      alert("Project Name is required");
      return;
    }

    // Staff validation
    if (isStaff && !projectForm.adminid) {
      alert("Admin ID is required for staff");
      return;
    }

    const payload = {
      name: projectForm.name,
      location: projectForm.location || null,
      developer: projectForm.developer || null,
      rerano: projectForm.rerano || null,
      startdate: projectForm.startdate || null,
      enddate: projectForm.enddate || null,
      possessiondate: projectForm.possessiondate || null,
      projecttype: projectForm.projecttype
        ? Number(projectForm.projecttype)
        : null,
      status: projectForm.status || "DRAFT",
      approvalstatus: projectForm.approvalstatus || "PENDING",
      notes: projectForm.notes || "",
    };

    // Add admin_id for staff
    if (isStaff) {
      payload.adminid = Number(projectForm.adminid);
    }

    try {
      await ProjectAPI.create(payload);
      alert("Project created successfully!");

      setProjectForm({
        name: "",
        location: "",
        developer: "",
        rerano: "",
        startdate: "",
        enddate: "",
        possessiondate: "",
        projecttype: "",
        status: "",
        approvalstatus: "",
        notes: "",
        adminid: isStaff ? projectForm.adminid : "", // keep adminid for convenience
      });

      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Add Projects</h3>
        <button
          type="button"
          className="btn-import"
          onClick={handleExcelButtonClick}
        >
          <span className="import-icon">📄</span>
          IMPORT EXCEL
        </button>
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleExcelFileChange}
        />
      </div>

      <form onSubmit={handleAddProject} className="project-form">
        {/* Row 1: Project Name, Location, Developer */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Project Name <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={projectForm.name}
              onChange={(e) => updateProjectForm("name", e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Location</label>
            <input
              className="field-input"
              value={projectForm.location}
              onChange={(e) => updateProjectForm("location", e.target.value)}
              placeholder="Enter location"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Developer</label>
            <input
              className="field-input"
              value={projectForm.developer}
              onChange={(e) => updateProjectForm("developer", e.target.value)}
              placeholder="Enter developer name"
            />
          </div>
        </div>

        {/* Row 2: Project Type, RERA No */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Project Type</label>
            <select
              className="field-input"
              value={projectForm.projecttype}
              onChange={(e) => updateProjectForm("projecttype", e.target.value)}
            >
              <option value="">--Select--</option>
              {setup?.lookups?.project_types?.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">RERA No</label>
            <input
              className="field-input"
              value={projectForm.rerano}
              onChange={(e) => updateProjectForm("rerano", e.target.value)}
              placeholder="Enter RERA number"
            />
          </div>
        </div>

        {/* Row 3: Start Date, End Date, Possession Date */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Start Date</label>
            <input
              className="field-input"
              type="date"
              value={projectForm.startdate}
              onChange={(e) => updateProjectForm("startdate", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label">End Date</label>
            <input
              className="field-input"
              type="date"
              value={projectForm.enddate}
              onChange={(e) => updateProjectForm("enddate", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label">Possession Date</label>
            <input
              className="field-input"
              type="date"
              value={projectForm.possessiondate}
              onChange={(e) =>
                updateProjectForm("possessiondate", e.target.value)
              }
            />
          </div>
        </div>

        {/* Row 4: Project Status, Approval Status */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Project Status</label>
            <select
              className="field-input"
              value={projectForm.status}
              onChange={(e) => updateProjectForm("status", e.target.value)}
            >
              <option value="">--Select--</option>
              {setup?.statuses?.project?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Approval Status</label>
            <select
              className="field-input"
              value={projectForm.approvalstatus}
              onChange={(e) =>
                updateProjectForm("approvalstatus", e.target.value)
              }
            >
              <option value="">--Select--</option>
              {setup?.statuses?.approval?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff-Only Field: Admin ID */}
        {isStaff && (
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">
                Admin ID (Owner) <span className="required">*</span>
              </label>
              <input
                className="field-input"
                placeholder="Admin user ID"
                value={projectForm.adminid}
                onChange={(e) => updateProjectForm("adminid", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="form-field-full">
          <label className="field-label">Note</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={projectForm.notes}
            onChange={(e) => updateProjectForm("notes", e.target.value)}
            placeholder="Add notes"
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions-right">
          <button type="submit" className="btn-add-project">
            ADD PROJECT
          </button>
        </div>
      </form>
    </div>
  );
}
