// // src/pages/ChannelPartnerSetup/ChannelPartnerSetup.jsx
// import { useState, useEffect } from "react";
// import { useSearchParams } from "react-router-dom";

// import { ChannelAPI } from "../../api/endpoints";

// import PartnerIdentityForm from "./forms/PartnerIdentityForm";
// import ProgramEnrolmentForm from "./forms/ProgramEnrolmentForm";
// import ProductAuthForm from "./forms/ProductAuthForm";
// import LeadManagementForm from "./forms/LeadManagementForm";
// import ComplianceDocsForm from "./forms/ComplianceDocsForm";
// import OperationalSetupForm from "./forms/OperationalSetupForm";
// import TargetScorecardForm from "./forms/TargetScorecardForm";
// import SystemAuditForm from "./forms/SystemAuditForm";

// import "./ChannelPartnerSetup.css";
// import { toast } from "react-hot-toast"; // 🔔 add this

// // Reusable Section Wrapper Component
// function SectionWrapper({ title, isOpen, onToggle, children }) {
//   return (
//     <div className="setup-section">
//       <button type="button" className="section-header" onClick={onToggle}>
//         <h3 className="section-title">{title}</h3>
//         <span className={`chevron ${isOpen ? "open" : ""}`}>▼</span>
//       </button>
//       {isOpen && <div className="section-content">{children}</div>}
//     </div>
//   );
// }

// export default function ChannelPartnerSetup() {
//   const [searchParams] = useSearchParams();
//   const openParam = searchParams.get("open");

//   const [partners, setPartners] = useState([]);
//   const [selectedPartnerId, setSelectedPartnerId] = useState("");
//   const [selectedPartner, setSelectedPartner] = useState(null);
//   const [loadingPartners, setLoadingPartners] = useState(false);

//   const [openSections, setOpenSections] = useState({
//     identity: true,
//     program: openParam === "program",
//     product: openParam === "product",
//     leadMgmt: openParam === "leadMgmt",
//     compliance: openParam === "compliance",
//     operational: openParam === "operational",
//     target: openParam === "target",
//     audit: openParam === "audit",
//   });

//   const toggleSection = (key) => {
//     setOpenSections((s) => ({ ...s, [key]: !s[key] }));
//   };

//   // Load list of partners for dropdown
//   const loadPartners = async () => {
//     setLoadingPartners(true);
//     try {
//       const data = await ChannelAPI.listAdminPartners();

//       let list = [];

//       // 1) Direct array (future-proof)
//       if (Array.isArray(data)) {
//         list = data;
//       }
//       // 2) Paginated response
//       else if (Array.isArray(data?.results)) {
//         list = data.results;
//       }
//       // 3) Our current shape: { admin_id, projects: [...] }
//       else if (Array.isArray(data?.projects)) {
//         data.projects.forEach((proj) => {
//           (proj.channel_partners || []).forEach((cp) => {
//             list.push({
//               ...cp,
//               project_id: proj.id,
//               project_name: proj.name,
//             });
//           });
//         });
//       }

//       setPartners(list);
//       // optional success toast only once is noisy, so skip
//     } catch (err) {
//       console.error("Error loading partners:", err);
//       setPartners([]);
//       toast.error("Failed to load channel partners");
//     } finally {
//       setLoadingPartners(false);
//     }
//   };

//   // Load selected partner details
//   const loadPartnerDetail = async (id) => {
//     if (!id) {
//       setSelectedPartner(null);
//       return;
//     }
//     try {
//       const data = await ChannelAPI.getPartner(id);
//       setSelectedPartner(data);
//       // could toast.info but that will be spammy when switching; skip
//     } catch (err) {
//       console.error("Error loading partner detail:", err);
//       toast.error("Failed to load partner details");
//     }
//   };

//   useEffect(() => {
//     loadPartners();
//   }, []);

//   useEffect(() => {
//     if (selectedPartnerId) {
//       loadPartnerDetail(selectedPartnerId);
//     } else {
//       setSelectedPartner(null);
//     }
//   }, [selectedPartnerId]);

//   // When Identity form saves (create / update)
//   const handleIdentitySaved = (partner) => {
//     if (partner?.id) {
//       setSelectedPartnerId(String(partner.id));
//       setSelectedPartner(partner);
//       loadPartners();
//       toast.success("Channel partner identity saved successfully"); // ✅
//     } else {
//       toast.error("Something went wrong saving partner identity");
//     }
//   };

//   // When any other section saves successfully
//   const handleSectionSaved = (partner) => {
//     if (partner?.id) {
//       setSelectedPartner(partner);
//       toast.success("Channel partner details updated"); // ✅
//     } else {
//       // in case forms call onSave without partner (edge)
//       toast.success("Section saved"); // still show success
//     }
//   };

//   const partnerId = selectedPartnerId || null;

//   return (
//     <div className="channel-partner-setup-page">
//       <div className="setup-container">
//         <div className="page-header">
//           <h1>Channel Partner Setup</h1>
//           <p className="page-subtitle">
//             Select a partner to edit all sections, or leave blank to create a
//             new partner in the Identity section.
//           </p>
//         </div>

//         {/* Global Partner Selector */}
//         <div className="form-container" style={{ marginBottom: "1.5rem" }}>
//           <div className="form-row">
//             <div className="form-field">
//               <label className="field-label">Select Channel Partner</label>
//               <select
//                 className="field-input"
//                 value={selectedPartnerId}
//                 onChange={(e) => setSelectedPartnerId(e.target.value)}
//               >
//                 <option value="">-- New Partner / No selection --</option>

//                 {Array.isArray(partners) &&
//                   partners.map((p) => (
//                     <option key={p.id} value={p.id}>
//                       {p.user_name || p.company_name || `Partner #${p.id}`}
//                       {p.project_name ? ` — ${p.project_name}` : ""}
//                     </option>
//                   ))}
//               </select>
//               {loadingPartners && (
//                 <small className="field-note">Loading partners...</small>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Section 1: Channel Partner Identity */}
//         <SectionWrapper
//           title="Channel Partner Identity"
//           isOpen={openSections.identity}
//           onToggle={() => toggleSection("identity")}
//         >
//           <PartnerIdentityForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleIdentitySaved}
//           />
//         </SectionWrapper>

//         {/* Section 2: Program Enrolment */}
//         <SectionWrapper
//           title="Program Enrolment"
//           isOpen={openSections.program}
//           onToggle={() => toggleSection("program")}
//         >
//           <ProgramEnrolmentForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 3: Product Authorization */}
//         <SectionWrapper
//           title="Product Authorization"
//           isOpen={openSections.product}
//           onToggle={() => toggleSection("product")}
//         >
//           <ProductAuthForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 4: Lead Management */}
//         <SectionWrapper
//           title="Lead Management"
//           isOpen={openSections.leadMgmt}
//           onToggle={() => toggleSection("leadMgmt")}
//         >
//           <LeadManagementForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 5: Compliance and Documents */}
//         <SectionWrapper
//           title="Compliance and Documents"
//           isOpen={openSections.compliance}
//           onToggle={() => toggleSection("compliance")}
//         >
//           <ComplianceDocsForm
//             partnerId={partnerId}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 6: Operational Setup */}
//         <SectionWrapper
//           title="Operational Setup"
//           isOpen={openSections.operational}
//           onToggle={() => toggleSection("operational")}
//         >
//           <OperationalSetupForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 7: Target & Scorecard */}
//         <SectionWrapper
//           title="Target & Scorecard"
//           isOpen={openSections.target}
//           onToggle={() => toggleSection("target")}
//         >
//           <TargetScorecardForm
//             partnerId={partnerId}
//             partner={selectedPartner}
//             onSave={handleSectionSaved}
//           />
//         </SectionWrapper>

//         {/* Section 8: System Audit */}
//         <SectionWrapper
//           title="System Audit"
//           isOpen={openSections.audit}
//           onToggle={() => toggleSection("audit")}
//         >
//           <SystemAuditForm partnerId={partnerId} />
//         </SectionWrapper>
//       </div>
//     </div>
//   );
// }



// src/pages/ChannelPartner/ChannelPartnerSetup.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { ChannelAPI } from "../../api/endpoints";

import PartnerIdentityForm from "./forms/PartnerIdentityForm";
import ProgramEnrolmentForm from "./forms/ProgramEnrolmentForm";
import ProductAuthForm from "./forms/ProductAuthForm";
import LeadManagementForm from "./forms/LeadManagementForm";
import ComplianceDocsForm from "./forms/ComplianceDocsForm";
import OperationalSetupForm from "./forms/OperationalSetupForm";
import TargetScorecardForm from "./forms/TargetScorecardForm";
import SystemAuditForm from "./forms/SystemAuditForm";

import "./ChannelPartnerSetup.css";
import { toast } from "react-hot-toast";

// Reusable Section Wrapper Component
function SectionWrapper({ title, isOpen, onToggle, children }) {
  return (
    <div className="setup-section">
      <button type="button" className="section-header" onClick={onToggle}>
        <h3 className="section-title">{title}</h3>
        <span className={`chevron ${isOpen ? "open" : ""}`}>▼</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

export default function ChannelPartnerSetup() {
  const [searchParams] = useSearchParams();
  const openParam = searchParams.get("open");
  const partnerIdFromQuery = searchParams.get("partner_id") || ""; // 👈 new

  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(
    partnerIdFromQuery // 👈 initial from URL
  );
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loadingPartners, setLoadingPartners] = useState(false);

  const [openSections, setOpenSections] = useState({
    identity: true,
    program: openParam === "program",
    product: openParam === "product",
    leadMgmt: openParam === "leadMgmt",
    compliance: openParam === "compliance",
    operational: openParam === "operational",
    target: openParam === "target",
    audit: openParam === "audit",
  });

  const toggleSection = (key) => {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  };

  // 🔹 If URL partner_id changes (direct link / navigation), sync state
  useEffect(() => {
    if (partnerIdFromQuery && partnerIdFromQuery !== selectedPartnerId) {
      setSelectedPartnerId(partnerIdFromQuery);
    }
  }, [partnerIdFromQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load list of partners for dropdown
  const loadPartners = async () => {
    setLoadingPartners(true);
    try {
      const data = await ChannelAPI.listAdminPartners();

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.results)) {
        list = data.results;
      } else if (Array.isArray(data?.projects)) {
        data.projects.forEach((proj) => {
          (proj.channel_partners || []).forEach((cp) => {
            list.push({
              ...cp,
              project_id: proj.id,
              project_name: proj.name,
            });
          });
        });
      }

      setPartners(list);
    } catch (err) {
      console.error("Error loading partners:", err);
      setPartners([]);
      toast.error("Failed to load channel partners");
    } finally {
      setLoadingPartners(false);
    }
  };

  // Load selected partner details
  const loadPartnerDetail = async (id) => {
    if (!id) {
      setSelectedPartner(null);
      return;
    }
    try {
      const data = await ChannelAPI.getPartner(id);
      setSelectedPartner(data);
    } catch (err) {
      console.error("Error loading partner detail:", err);
      toast.error("Failed to load partner details");
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      loadPartnerDetail(selectedPartnerId);
    } else {
      setSelectedPartner(null);
    }
  }, [selectedPartnerId]);

  // When Identity form saves (create / update)
  const handleIdentitySaved = (partner) => {
    if (partner?.id) {
      setSelectedPartnerId(String(partner.id));
      setSelectedPartner(partner);
      loadPartners();
      toast.success("Channel partner identity saved successfully");
    } else {
      toast.error("Something went wrong saving partner identity");
    }
  };

  // When any other section saves successfully
  const handleSectionSaved = (partner) => {
    if (partner?.id) {
      setSelectedPartner(partner);
      toast.success("Channel partner details updated");
    } else {
      toast.success("Section saved");
    }
  };

  const partnerId = selectedPartnerId || null;

  return (
    <div className="channel-partner-setup-page">
      <div className="setup-container">
        <div className="page-header">
          <h1>Channel Partner Setup</h1>
          <p className="page-subtitle">
            Select a partner to edit all sections, or leave blank to create a
            new partner in the Identity section.
          </p>
        </div>

        {/* Global Partner Selector */}
        <div className="form-container" style={{ marginBottom: "1.5rem" }}>
          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Select Channel Partner</label>
              <select
                className="field-input"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                <option value="">-- New Partner / No selection --</option>

                {Array.isArray(partners) &&
                  partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user_name || p.company_name || `Partner #${p.id}`}
                      {p.project_name ? ` — ${p.project_name}` : ""}
                    </option>
                  ))}
              </select>
              {loadingPartners && (
                <small className="field-note">Loading partners...</small>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Channel Partner Identity */}
        <SectionWrapper
          title="Channel Partner Identity"
          isOpen={openSections.identity}
          onToggle={() => toggleSection("identity")}
        >
          <PartnerIdentityForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleIdentitySaved}
          />
        </SectionWrapper>

        {/* Section 2: Program Enrolment */}
        <SectionWrapper
          title="Program Enrolment"
          isOpen={openSections.program}
          onToggle={() => toggleSection("program")}
        >
          <ProgramEnrolmentForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleSectionSaved}
          />
        </SectionWrapper>

        {/* Section 3: Product Authorization */}
        <SectionWrapper
          title="Product Authorization"
          isOpen={openSections.product}
          onToggle={() => toggleSection("product")}
        >
          <ProductAuthForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleSectionSaved}
          />
        </SectionWrapper>

        {/* Section 4: Lead Management */}
        <SectionWrapper
          title="Lead Management"
          isOpen={openSections.leadMgmt}
          onToggle={() => toggleSection("leadMgmt")}
        >
          <LeadManagementForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleSectionSaved}
          />
        </SectionWrapper>

        {/* Section 5: Compliance and Documents */}
        <SectionWrapper
          title="Compliance and Documents"
          isOpen={openSections.compliance}
          onToggle={() => toggleSection("compliance")}
        >
          <ComplianceDocsForm partnerId={partnerId} onSave={handleSectionSaved} />
        </SectionWrapper>

        {/* Section 6: Operational Setup */}
        <SectionWrapper
          title="Operational Setup"
          isOpen={openSections.operational}
          onToggle={() => toggleSection("operational")}
        >
          <OperationalSetupForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleSectionSaved}
          />
        </SectionWrapper>

        {/* Section 7: Target & Scorecard */}
        <SectionWrapper
          title="Target & Scorecard"
          isOpen={openSections.target}
          onToggle={() => toggleSection("target")}
        >
          <TargetScorecardForm
            partnerId={partnerId}
            partner={selectedPartner}
            onSave={handleSectionSaved}
          />
        </SectionWrapper>

        {/* Section 8: System Audit */}
        <SectionWrapper
          title="System Audit"
          isOpen={openSections.audit}
          onToggle={() => toggleSection("audit")}
        >
          <SystemAuditForm partnerId={partnerId} />
        </SectionWrapper>
      </div>
    </div>
  );
}
