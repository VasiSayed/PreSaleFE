// import { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import { useSetupData } from "./hooks/useSetupData";
// import ProjectForm from "./forms/ProjectForm";
// import TowerForm from "./forms/TowerForm";
// import FloorForm from "./forms/FloorForm";
// import UnitForm from "./forms/UnitForm";
// import PaymentPlanForm from "./forms/PaymentPlanForm";
// import MilestonePlanForm from "./forms/MilestonePlanForm";
// import BankForm from "./forms/BankForm";
// import NotificationList from "./forms/NotificationList";
//  import "./Setup.css";

// export default function Setup() {
//   const [searchParams] = useSearchParams();

//   // Collapsible sections state
//   const [openSections, setOpenSections] = useState({
//     project: searchParams.get("open") === "project" || true,
//     tower: false,
//     floor: false,
//     unit: false,
//     payment: false,
//     milestone: false,
//     bank: false,
//     notification: false,
//     additionalInfo: false, // NEW SECTION
//   });

//   const toggleSection = (key) =>
//     setOpenSections((s) => ({ ...s, [key]: !s[key] }));

//   const {
//     setup,
//     scope,
//     loading,
//     error,
//     isStaff,
//     adminIdForScope,
//     setAdminIdForScope,
//     handleLoadScopeForAdmin,
//     reload,
//     projects,
//     towersByProject,
//     floorsByTower,
//     users,
//   } = useSetupData();

//   console.log("Setup data:", {
//     setup,
//     scope,
//     projects,
//     users,
//     loading,
//     error
//   });

//   useEffect(() => {
//     const section = searchParams.get("open");
//     if (section && openSections[section] !== undefined) {
//       setOpenSections((s) => ({ ...s, [section]: true }));
//     }
//   }, [searchParams]);

//   if (loading) {
//     return (
//       <div className="setup-page">
//         <div className="setup-container">
//           <div className="loading-spinner">Loading...</div>
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

//         {/* Project Setup */}
//         <SectionWrapper
//           title="Project Setup"
//           isOpen={openSections.project}
//           onToggle={() => toggleSection("project")}
//         >
//           <ProjectForm
//             setup={setup}
//             scope={scope}
//             isStaff={isStaff}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Tower Setup */}
//         <SectionWrapper
//           title="Tower Setup"
//           isOpen={openSections.tower}
//           onToggle={() => toggleSection("tower")}
//         >
//           <TowerForm
//             setup={setup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Floor Setup */}
//         <SectionWrapper
//           title="Floor Setup"
//           isOpen={openSections.floor}
//           onToggle={() => toggleSection("floor")}
//         >
//           <FloorForm
//             setup={setup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Unit Setup */}
//         <SectionWrapper
//           title="Flats/ Unit Setup"
//           isOpen={openSections.unit}
//           onToggle={() => toggleSection("unit")}
//         >
//           <UnitForm
//             setup={setup}
//             projects={projects}
//             towersByProject={towersByProject}
//             floorsByTower={floorsByTower}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Payment Setup */}
//         <SectionWrapper
//           title="Payment Setup"
//           isOpen={openSections.payment}
//           onToggle={() => toggleSection("payment")}
//         >
//           <PaymentPlanForm
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Milestone Plan Creation */}
//         <SectionWrapper
//           title="Milestone Plan Creation"
//           isOpen={openSections.milestone}
//           onToggle={() => toggleSection("milestone")}
//         >
//           <MilestonePlanForm
//             setup={setup}
//             projects={projects}
//             users={users}
//             isOpen={openSections.milestone}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Bank Setup */}
//         <SectionWrapper
//           title="Bank Setup"
//           isOpen={openSections.bank}
//           onToggle={() => toggleSection("bank")}
//         >
//           <BankForm
//             setup={setup}
//             projects={projects}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* Notifications */}
//         <SectionWrapper
//           title="Notification / Alerts"
//           isOpen={openSections.notification}
//           onToggle={() => toggleSection("notification")}
//         >
//           <NotificationList
//             setup={setup}
//             users={users}
//             isOpen={openSections.notification}
//             onSuccess={reload}
//           />
//         </SectionWrapper>

//         {/* NEW: Additional Information */}
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

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSetupData } from "./hooks/useSetupData";
import ProjectForm from "./forms/ProjectForm";
import TowerForm from "./forms/TowerForm";
import FloorForm from "./forms/FloorForm";
import UnitForm from "./forms/UnitForm";
import PaymentPlanForm from "./forms/PaymentPlanForm";
import MilestonePlanForm from "./forms/MilestonePlanForm";
import BankForm from "./forms/BankForm";
import NotificationList from "./forms/NotificationList";
import "./Setup.css";

export default function Setup() {
  const [searchParams] = useSearchParams();
  const openParam = searchParams.get("open");
  const [openSections, setOpenSections] = useState({
    project: searchParams.get("open") === "project" || true,
    tower: false,
    floor: false,
    unit: false,
    payment: false,
    milestone: false,
    bank: false,
    notification: false,
    additionalInfo: false,
  });

  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const {
    setup,
    scope,
    loading,
    error,
    isStaff,
    adminIdForScope,
    setAdminIdForScope,
    handleLoadScopeForAdmin,
    reload,
    projects,
    towersByProject,
    floorsByTower,
    users,
  } = useSetupData();

  console.log("Setup data:", {
    setup,
    scope,
    projects,
    users,
    loading,
    error,
  });

  useEffect(() => {
    const section = searchParams.get("open");
    if (section && openSections[section] !== undefined) {
      setOpenSections((s) => ({ ...s, [section]: true }));
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="loading-spinner">Loading...</div>
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
        {/* Staff Admin ID Filter */}
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

        {/* Project Setup */}
        <SectionWrapper
          title="Project Setup"
          isOpen={openSections.project}
          onToggle={() => toggleSection("project")}
        >
          <ProjectForm
            setup={setup}
            scope={scope}
            isStaff={isStaff}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Tower Setup */}
        <SectionWrapper
          title="Tower Setup"
          isOpen={openSections.tower}
          onToggle={() => toggleSection("tower")}
        >
          <TowerForm setup={setup} projects={projects} onSuccess={reload} />
        </SectionWrapper>

        {/* Floor Setup */}
        <SectionWrapper
          title="Floor Setup"
          isOpen={openSections.floor}
          onToggle={() => toggleSection("floor")}
        >
          <FloorForm setup={setup} projects={projects} onSuccess={reload} />
        </SectionWrapper>

        {/* Unit Setup */}
        <SectionWrapper
          title="Flats/ Unit Setup"
          isOpen={openSections.unit}
          onToggle={() => toggleSection("unit")}
        >
          <UnitForm
            setup={setup}
            projects={projects}
            towersByProject={towersByProject}
            floorsByTower={floorsByTower}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Payment Setup */}
        <SectionWrapper
          title="Payment Setup"
          isOpen={openSections.payment}
          onToggle={() => toggleSection("payment")}
        >
          <PaymentPlanForm projects={projects} onSuccess={reload} />
        </SectionWrapper>

        {/* Milestone Plan Creation */}
        <SectionWrapper
          title="Milestone Plan Creation"
          isOpen={openSections.milestone}
          onToggle={() => toggleSection("milestone")}
        >
          <MilestonePlanForm
            setup={setup}
            projects={projects}
            users={users}
            isOpen={openSections.milestone}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* Bank Setup */}
        <SectionWrapper
          title="Bank Setup"
          isOpen={openSections.bank}
          onToggle={() => toggleSection("bank")}
        >
          <BankForm setup={setup} projects={projects} onSuccess={reload} />
        </SectionWrapper>

        {/* Notifications */}
        <SectionWrapper
          title="Notification / Alerts"
          isOpen={openSections.notification}
          onToggle={() => toggleSection("notification")}
        >
          <NotificationList
            setup={setup}
            users={users}
            isOpen={openSections.notification}
            onSuccess={reload}
          />
        </SectionWrapper>

        {/* NEW: Additional Information (if you add later) */}
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
