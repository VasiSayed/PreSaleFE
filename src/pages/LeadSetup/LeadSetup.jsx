// import { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useLeadSetupData } from "./hooks/useLeadSetupData";
// import ProjectUnitConfigForm from "./forms/ProjectUnitConfigForm";
// import LeadClassificationForm from "./forms/LeadClassificationForm";
// import LeadSourceForm from "./forms/LeadSourceForm";
// import AssignmentSettingForm from "./forms/AssignmentSettingForm";
// import BudgetOfferingForm from "./forms/BudgetOfferingForm";
// import SiteVisitSettingForm from "./forms/SiteVisitSettingForm";
// import DataReportingForm from "./forms/DataReportingForm";
// import "./LeadSetup.css";
// import AdditionalInfoForm from "./forms/AdditionalInfoForm"; //
// import StagesForm from "./forms/StagesForm"; //

// export default function LeadSetup() {
//   const [searchParams] = useSearchParams();

//   // Collapsible sections state
//   const [openSections, setOpenSections] = useState({
//     projectUnit: searchParams.get("open") === "projectUnit" || false,
//     classification: false,
//     source: false,
//     assignment: false,
//     budget: false,
//     siteVisit: false,
//     reporting: false,
//   });

//   const toggleSection = (key) =>
//     setOpenSections((s) => ({ ...s, [key]: !s[key] }));

//   // Load lead setup data & scope using custom hook
//   const {
//     setup,          // ← ADD THIS LINE!
//     leadSetup,
//     leadScope,
//     loading,
//     error,
//     isStaff,
//     adminIdForScope,
//     setAdminIdForScope,
//     handleLoadScopeForAdmin,
//     reload,
//     projects,
//     units,
//     users,
//   } = useLeadSetupData();

//   // Debug logging
//   console.log("Lead Setup data:", {
//     leadSetup,
//     leadScope,
//     projects,
//     users,
//     loading,
//     error,
//   });

//   // Auto-open section from URL query param
//   useEffect(() => {
//     const section = searchParams.get("open");
//     if (section && openSections[section] !== undefined) {
//       setOpenSections((s) => ({ ...s, [section]: true }));
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchParams]);

//   if (loading) {
//     return (
//       <div className="setup-page">
//         <div className="setup-container">
//           <div className="loading-spinner">Loading Lead Setup...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="setup-page">
//         <div className="setup-container">
//           <div className="error-message">{error}</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="setup-page">
//       <div className="setup-container">
//         {/* Staff Admin ID Filter */}
//         {isStaff && (
//           <div className="staff-filter">
//             <input
//               className="form-input"
//               placeholder="Admin ID for scope"
//               value={adminIdForScope}
//               onChange={(e) => setAdminIdForScope(e.target.value)}
//             />
//             <button className="btn-secondary" onClick={handleLoadScopeForAdmin}>
//               Load Admin Scope
//             </button>
//           </div>
//         )}

//         {/* Project & Unit Configuration */}
//         <SectionWrapper
//           title="Project & Unit Configuration"
//           isOpen={openSections.projectUnit}
//           onToggle={() => toggleSection("projectUnit")}
//         >
//           <ProjectUnitConfigForm
//             setup={setup}
//             leadSetup={leadSetup}
//             projects={projects}
//             units={units}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Lead Classification Setup */}
//         <SectionWrapper
//           title="Lead Classification Setup"
//           isOpen={openSections.classification}
//           onToggle={() => toggleSection("classification")}
//         >
//           <LeadClassificationForm
//             leadSetup={leadSetup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Lead Source Setup */}
//         <SectionWrapper
//           title="Lead Source Setup"
//           isOpen={openSections.source}
//           onToggle={() => toggleSection("source")}
//         >
//           <LeadSourceForm
//             leadSetup={leadSetup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Assignment Setting */}
//         <SectionWrapper
//           title="Assignment Setting"
//           isOpen={openSections.assignment}
//           onToggle={() => toggleSection("assignment")}
//         >
//           <AssignmentSettingForm
//             leadSetup={leadSetup}
//             users={users}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Budget & Offering Setting */}
//         <SectionWrapper
//           title="Budget & Offering Setting"
//           isOpen={openSections.budget}
//           onToggle={() => toggleSection("budget")}
//         >
//           <BudgetOfferingForm
//             leadSetup={leadSetup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Site Visit Setting */}
//         <SectionWrapper
//           title="Site Visit Setting"
//           isOpen={openSections.siteVisit}
//           onToggle={() => toggleSection("siteVisit")}
//         >
//           <SiteVisitSettingForm
//             leadSetup={leadSetup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Data & Reporting */}
//         <SectionWrapper
//           title="Data & Reporting"
//           isOpen={openSections.reporting}
//           onToggle={() => toggleSection("reporting")}
//         >
//           <DataReportingForm
//             leadSetup={leadSetup}
//             projects={projects}    
//             users={users}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         <SectionWrapper
//           title="Additional Information"
//           isOpen={openSections.additionalInfo}
//           onToggle={() => toggleSection("additionalInfo")}
//         >
//           <AdditionalInfoForm
//             setup={setup}
//             projects={projects}  
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* NEW: Stages */}
//         <SectionWrapper
//           title="Stages"
//           isOpen={openSections.stages}
//           onToggle={() => toggleSection("stages")}
//         >
//           <StagesForm projects={projects} onSuccess={reload} />
//         </SectionWrapper>

//       </div>
//     </div>
//   );
// }

// // Collapsible Section Wrapper Component
// function SectionWrapper({ title, isOpen, onToggle, children }) {
//   return (
//     <div className="setup-section">
//       <button onClick={onToggle} className="section-header">
//         <h2 className="section-title">{title}</h2>
//         <svg
//           className={`chevron-icon ${isOpen ? "rotated" : ""}`}
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>
//       </button>

//       {isOpen && <div className="section-content">{children}</div>}
//     </div>
//   );
// }

// src/pages/LeadSetup/LeadSetup.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useLeadSetupData } from "./hooks/useLeadSetupData";

import ProjectUnitConfigForm from "./forms/ProjectUnitConfigForm";
import LeadClassificationForm from "./forms/LeadClassificationForm";
import LeadSourceForm from "./forms/LeadSourceForm";
import AssignmentSettingForm from "./forms/AssignmentSettingForm";
import BudgetOfferingForm from "./forms/BudgetOfferingForm";
import SiteVisitSettingForm from "./forms/SiteVisitSettingForm";
import DataReportingForm from "./forms/DataReportingForm";
import AdditionalInfoForm from "./forms/AdditionalInfoForm";
import StagesForm from "./forms/StagesForm";

import "./LeadSetup.css";

export default function LeadSetup() {
  const [searchParams] = useSearchParams();

  // URL se project_id (optional)  =>  /lead-setup?project_id=2
  const projectIdFromUrl = searchParams.get("project_id") || "";
  const openParam = searchParams.get("open") || "";

  // 🔹 Saare data + activeProjectId hook se aayega
  const {
    setup,
    leadSetup,
    leadScope,
    loading,
    error,
    isStaff,
    adminIdForScope,
    setAdminIdForScope,
    handleLoadScopeForAdmin,
    reload,
    projects,
    units,
    users,
    activeProjectId,
    setActiveProjectId,
  } = useLeadSetupData(projectIdFromUrl);

  // Kaunsa section open hai (URL ke ?open=... se pre-open)
  const [openSections, setOpenSections] = useState({
    projectUnit: openParam === "projectUnit",
    classification: openParam === "classification",
    source: openParam === "source",
    assignment: openParam === "assignment",
    budget: openParam === "budget",
    siteVisit: openParam === "siteVisit",
    reporting: openParam === "reporting",
    additionalInfo: openParam === "additionalInfo",
    stages: openParam === "stages",
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Agar URL me ?open=source / ?open=stages change ho gaya to us section ko open karo
  useEffect(() => {
    const section = searchParams.get("open");
    if (section) {
      setOpenSections((prev) => ({
        ...prev,
        [section]: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debug (optional)
  console.log("Lead Setup data:", {
    activeProjectId,
    leadSetup,
    projects,
    users,
    loading,
    error,
    leadScope,
  });

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="loading-spinner">Loading Lead Setup...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        {/* 🔹 Global Project selector (masters iske hisaab se reload hoga) */}
        <div className="setup-header-row">
          <div>
            <h1 className="setup-title">Lead Setup</h1>
            <p className="setup-subtitle">
              Select project to configure classifications, sources, stages and
              more.
            </p>
          </div>

          <div className="setup-project-select">
            <label className="form-label">Project</label>
            <select
              className="form-input"
              value={activeProjectId || ""}
              onChange={(e) => setActiveProjectId(e.target.value)}
            >
              <option value="">-- Select project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff ko Admin ID se scope change karne ka option */}
        {isStaff && (
          <div className="staff-filter">
            <input
              className="form-input"
              placeholder="Admin ID for scope"
              value={adminIdForScope}
              onChange={(e) => setAdminIdForScope(e.target.value)}
            />
            <button className="btn-secondary" onClick={handleLoadScopeForAdmin}>
              Load Admin Scope
            </button>
          </div>
        )}

        {/* Project & Unit Configuration */}
        <SectionWrapper
          title="Project & Unit Configuration"
          isOpen={openSections.projectUnit}
          onToggle={() => toggleSection("projectUnit")}
        >
          <ProjectUnitConfigForm
            setup={setup}
            leadSetup={leadSetup}
            projects={projects}
            units={units}
            activeProjectId={activeProjectId}
            onProjectChange={setActiveProjectId} // agar form ke andar project change karna ho
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Lead Classification Setup */}
        <SectionWrapper
          title="Lead Classification Setup"
          isOpen={openSections.classification}
          onToggle={() => toggleSection("classification")}
        >
          <LeadClassificationForm
            leadSetup={leadSetup}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Lead Source Setup */}
        <SectionWrapper
          title="Lead Source Setup"
          isOpen={openSections.source}
          onToggle={() => toggleSection("source")}
        >
          <LeadSourceForm
            leadSetup={leadSetup}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Assignment Setting */}
        <SectionWrapper
          title="Assignment Setting"
          isOpen={openSections.assignment}
          onToggle={() => toggleSection("assignment")}
        >
          <AssignmentSettingForm
            leadSetup={leadSetup}
            users={users}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Budget & Offering Setting */}
        <SectionWrapper
          title="Budget & Offering Setting"
          isOpen={openSections.budget}
          onToggle={() => toggleSection("budget")}
        >
          <BudgetOfferingForm
            leadSetup={leadSetup}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Site Visit Setting */}
        <SectionWrapper
          title="Site Visit Setting"
          isOpen={openSections.siteVisit}
          onToggle={() => toggleSection("siteVisit")}
        >
          <SiteVisitSettingForm
            leadSetup={leadSetup}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Data & Reporting */}
        <SectionWrapper
          title="Data & Reporting"
          isOpen={openSections.reporting}
          onToggle={() => toggleSection("reporting")}
        >
          <DataReportingForm
            leadSetup={leadSetup}
            projects={projects}
            users={users}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Additional Info */}
        <SectionWrapper
          title="Additional Information"
          isOpen={openSections.additionalInfo}
          onToggle={() => toggleSection("additionalInfo")}
        >
          <AdditionalInfoForm
            setup={setup}
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Stages */}
        <SectionWrapper
          title="Stages"
          isOpen={openSections.stages}
          onToggle={() => toggleSection("stages")}
        >
          <StagesForm
            projects={projects}
            activeProjectId={activeProjectId}
            onSuccess={reload}
          />
        </SectionWrapper>
      </div>
    </div>
  );
}

// Collapsible Section Wrapper Component
function SectionWrapper({ title, isOpen, onToggle, children }) {
  return (
    <div className="setup-section">
      <button onClick={onToggle} className="section-header">
        <h2 className="section-title">{title}</h2>
        <svg
          className={`chevron-icon ${isOpen ? "rotated" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}
