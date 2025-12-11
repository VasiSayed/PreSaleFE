// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api/axiosInstance"; // adjust path if needed
// import { showToast } from "../utils/toast";
// import "./OnsiteRegistration.css";

// const SCOPE_URL = "/client/my-scope/";
// const ONSITE_API = "/sales/onsite-registration/";
// const LEAD_MASTERS_API = "/leadManagement/v2/leads/masters/";

// // CP Mode
// const CP_MODE = {
//   REGISTERED: "REGISTERED",
//   UNREGISTERED: "UNREGISTERED",
// };

// // enums (must match backend TextChoices)
// const NATIONALITY_OPTIONS = [
//   { value: "INDIAN", label: "Indian" },
//   { value: "NRI", label: "NRI" },
//   { value: "OTHER", label: "Others" },
// ];

// const AGE_GROUP_OPTIONS = [
//   // { value: "LT20", label: "<20" },
//   { value: "20_25", label: "20-25" },
//   { value: "26_35", label: "26-35" },
//   { value: "36_45", label: "36-45" },
//   { value: "46_60", label: "46-60" },
//   { value: "GT60", label: ">60" },
// ];

// // Budget slabs (start from 1 Cr)
// const BUDGET_OPTIONS = [
//   { value: 10000000, label: "1 Cr – 1.5 Cr" },
//   { value: 15000000, label: "1.5 Cr – 2 Cr" },
//   { value: 20000000, label: "2 Cr – 2.5 Cr" },
//   { value: 25000000, label: "2.5 Cr – 3 Cr" },
//   { value: 30000000, label: "3 Cr – 3.5 Cr" },
//   { value: 35000000, label: "3.5 Cr – 4 Cr" },
//   { value: 40000000, label: "4 Cr – 4.5 Cr" },
//   { value: 45000000, label: "4.5 Cr – 5 Cr" },
//   { value: 50000000, label: "5 Cr – 5.5 Cr" },
//   { value: 55000000, label: "5.5 Cr – 6 Cr" },
//   { value: 60000000, label: "6 Cr – 6.5 Cr" },
//   { value: 65000000, label: "6.5 Cr – 7 Cr" },
// ];

// const initialForm = {
//   project_id: "",
//   first_name: "",
//   last_name: "",
//   mobile_number: "",
//   email: "",

//   nationality: "",
//   age_group: "",

//   unit_configuration_id: "",
//   budget: "",

//   // Source / Sub-source / Purpose
//   source_id: "",
//   sub_source_id: "",
//   purpose_id: "",

//   // Residential address
//   residential_address: "",
//   residence_city: "",
//   residence_locality: "",
//   residence_pincode: "",

//   // CP
//   has_channel_partner: false,
//   channel_partner_id: "",
// };

// export default function OnsiteRegistration() {
//   const [form, setForm] = useState(initialForm);

//   const [scopeLoading, setScopeLoading] = useState(true);
//   const [projects, setProjects] = useState([]);

//   const navigate = useNavigate();

//   // masters for project
//   const [mastersLoading, setMastersLoading] = useState(false);
//   const [unitConfigs, setUnitConfigs] = useState([]);
//   const [sourcesTree, setSourcesTree] = useState([]);
//   const [purposes, setPurposes] = useState([]);

//   const [cpLoading, setCpLoading] = useState(false);
//   const [channelPartners, setChannelPartners] = useState([]);

//   const [submitting, setSubmitting] = useState(false);

//   const [lookupResult, setLookupResult] = useState(null);
//   const [checkingPhone, setCheckingPhone] = useState(false);
//   const [showLookupModal, setShowLookupModal] = useState(false);

//   // ---------- CP state (REGISTERED vs UNREGISTERED) ----------
//   const [cpMode, setCpMode] = useState(CP_MODE.REGISTERED);

//     const existingProjectLead = useMemo(() => {
//       if (!lookupResult?.present || !form.project_id) return null;
//       const pid = Number(form.project_id);
//       const leads = lookupResult.leads || [];
//       return leads.find((lead) => Number(lead.project) === pid) || null;
//     }, [lookupResult, form.project_id]);

//   // Quick CP create modal + form
//   const [showQuickCpModal, setShowQuickCpModal] = useState(false);
//   const [quickCpForm, setQuickCpForm] = useState({
//     name: "",
//     email: "",
//     mobile_number: "",
//     company_name: "",
//     pan_number: "",
//     rera_number: "",
//     partner_tier_id: "",
//   });
//   const [quickCpOtpSending, setQuickCpOtpSending] = useState(false);
//   const [quickCpOtpVerifying, setQuickCpOtpVerifying] = useState(false);
//   const [quickCpOtpCode, setQuickCpOtpCode] = useState("");
//   const [quickCpEmailVerified, setQuickCpEmailVerified] = useState(false);
//   const [partnerTiers, setPartnerTiers] = useState([]);

//   // ---------- Phone lookup (10 digits + project) ----------
//   useEffect(() => {
//     const digits = (form.mobile_number || "").replace(/\D/g, "");

//     // naya lookup start -> close modal
//     setShowLookupModal(false);

//     if (digits.length === 10 && form.project_id) {
//       setCheckingPhone(true);
//       api
//         .get("/sales/sales-leads/lookup-by-phone/", {
//           params: {
//             phone: digits,
//             project_id: form.project_id,
//           },
//         })
//         .then((res) => {
//           setLookupResult(res.data || null);
//         })
//         .catch((err) => {
//           console.error("phone lookup failed", err);
//           setLookupResult(null);
//         })
//         .finally(() => setCheckingPhone(false));
//     } else {
//       setLookupResult(null);
//     }
//   }, [form.mobile_number, form.project_id]);

//   // ---------- Load scope with projects (MY_SCOPE) ----------
//   useEffect(() => {
//     setScopeLoading(true);
//     api
//       .get(SCOPE_URL, { params: { include_units: true, unit_type: true } })
//       .then((res) => {
//         const data = res.data || {};
//         const list = data.projects || data.project_list || data.results || [];
//         setProjects(list);

//         // auto-select project if only one
//         if (list.length === 1) {
//           setForm((prev) => ({ ...prev, project_id: String(list[0].id) }));
//         }
//       })
//       .catch((err) => {
//         console.error("Failed to load project scope", err);
//         showToast("Failed to load project scope", "error");
//       })
//       .finally(() => setScopeLoading(false));
//   }, []);

//   // ---------- Load lead masters for selected project ----------
//   useEffect(() => {
//     if (!form.project_id) {
//       setUnitConfigs([]);
//       setSourcesTree([]);
//       setPurposes([]);
//       return;
//     }

//     setMastersLoading(true);
//     api
//       .get(LEAD_MASTERS_API, { params: { project_id: form.project_id } })
//       .then((res) => {
//         const data = res.data || {};
//         setUnitConfigs(data.unit_configurations || data.unit_configs || []);
//         setSourcesTree(data.sources || []);
//         setPurposes(data.purposes || []);
//       })
//       .catch((err) => {
//         console.error("Failed to load lead masters", err);
//         showToast("Failed to load project lead masters", "error");
//         setUnitConfigs([]);
//         setSourcesTree([]);
//         setPurposes([]);
//       })
//       .finally(() => setMastersLoading(false));
//   }, [form.project_id]);

//   // ---------- Load partner tiers for Quick CP when project selected ----------
//   useEffect(() => {
//     if (!form.project_id) {
//       setPartnerTiers([]);
//       return;
//     }

//     api
//       .get("/channel/partner-tiers/")
//       .then((res) => {
//         const list = res.data?.results || res.data || [];
//         setPartnerTiers(list);
//       })
//       .catch((err) => {
//         console.error("Failed to load partner tiers", err);
//       });
//   }, [form.project_id]);

//   const selectedProject = useMemo(
//     () =>
//       projects.find((p) => String(p.id) === String(form.project_id)) || null,
//     [projects, form.project_id]
//   );

//   const selectedSource = useMemo(
//     () =>
//       sourcesTree.find((s) => String(s.id) === String(form.source_id)) || null,
//     [sourcesTree, form.source_id]
//   );

//   const subSourceOptions = useMemo(
//     () => selectedSource?.children || [],
//     [selectedSource]
//   );

//   const leadsForPhone = useMemo(
//     () => lookupResult?.leads || [],
//     [lookupResult]
//   );

//   const existingLeadInCurrentProject = useMemo(
//     () =>
//       leadsForPhone.find(
//         (lead) => String(lead.project) === String(form.project_id)
//       ) || null,
//     [leadsForPhone, form.project_id]
//   );

//   const hasExistingLeadInProject = !!existingLeadInCurrentProject;

//   const hasLeadsInOtherProjects = useMemo(
//     () =>
//       leadsForPhone.some(
//         (lead) => String(lead.project) !== String(form.project_id)
//       ),
//     [leadsForPhone, form.project_id]
//   );

//   // ---------- Load CPs when needed (REGISTERED mode only) ----------
//   useEffect(() => {
//     if (!form.project_id || !form.has_channel_partner) {
//       setChannelPartners([]);
//       return;
//     }

//     if (cpMode !== CP_MODE.REGISTERED) {
//       setChannelPartners([]);
//       return;
//     }

//     setCpLoading(true);
//     api
//       .get("/channel/partners/by-project/", {
//         params: { project_id: form.project_id },
//       })
//       .then((res) => {
//         const data = res.data || {};
//         const list = data.results || data || [];
//         setChannelPartners(list);
//       })
//       .catch((err) => {
//         console.error("Failed to load channel partners", err);
//         showToast("Failed to load channel partners", "error");
//       })
//       .finally(() => setCpLoading(false));
//   }, [form.project_id, form.has_channel_partner, cpMode]);

//   // ---------- helpers ----------
//   const handleChange = (name, value) => {
//     setForm((prev) => {
//       const next = { ...prev, [name]: value };

//       if (name === "project_id") {
//         // project change => reset project-specific stuff
//         next.unit_configuration_id = "";
//         next.budget = "";
//         next.source_id = "";
//         next.sub_source_id = "";
//         next.purpose_id = "";
//         next.has_channel_partner = false;
//         next.channel_partner_id = "";
//         setCpMode(CP_MODE.REGISTERED);
//       }

//       if (name === "has_channel_partner" && value === false) {
//         next.channel_partner_id = "";
//         setCpMode(CP_MODE.REGISTERED);
//       }

//       if (name === "source_id") {
//         next.sub_source_id = "";
//       }

//       return next;
//     });
//   };

//   const validate = () => {
//     const missing = [];

//     if (!form.project_id) missing.push("Project");
//     if (!form.first_name.trim()) missing.push("First Name");
//     if (!form.last_name.trim()) missing.push("Last Name");
//     if (!form.mobile_number.trim()) missing.push("Mobile Number");
//     // email is optional now
//     if (!form.unit_configuration_id) missing.push("Configuration (2/3/4 BHK)");

//     if (form.has_channel_partner && !form.channel_partner_id) {
//       missing.push("Channel Partner");
//     }

//     if (missing.length) {
//       showToast("Please fill required fields:\n" + missing.join("\n"), "error");
//       return false;
//     }

//     return true;
//   };

//   const buildOnsitePayload = () => {
//     return {
//       project_id: Number(form.project_id),
//       first_name: form.first_name.trim(),
//       last_name: form.last_name.trim(),
//       mobile_number: form.mobile_number.trim(),
//       email: form.email.trim() || "",

//       nationality: form.nationality || null,
//       age_group: form.age_group || null,

//       unit_configuration_id: form.unit_configuration_id
//         ? Number(form.unit_configuration_id)
//         : null,

//       budget: form.budget ? Number(form.budget) : null,

//       source_id: form.source_id ? Number(form.source_id) : null,
//       sub_source_id: form.sub_source_id ? Number(form.sub_source_id) : null,
//       purpose_id: form.purpose_id ? Number(form.purpose_id) : null,

//       residential_address: form.residential_address.trim(),
//       residence_city: form.residence_city.trim(),
//       residence_locality: form.residence_locality.trim(),
//       residence_pincode: form.residence_pincode.trim(),

//       has_channel_partner: !!form.has_channel_partner,
//       channel_partner_id:
//         form.has_channel_partner && form.channel_partner_id
//           ? Number(form.channel_partner_id)
//           : null,

//       // backend still expects this, so always send true
//       terms_accepted: true,
//     };
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (submitting) return;
//     if (!validate()) return;

//     if (hasExistingLeadInProject) {
//       showToast(
//         "This customer is already part of this project. Please schedule a site visit instead.",
//         "error"
//       );
//       return;
//     }

//     const payload = buildOnsitePayload();

//     setSubmitting(true);
//     try {
//       const res = await api.post(ONSITE_API, payload);
//       console.log("Onsite registration success:", res.data);
//       showToast("Onsite registration created successfully.", "success");
//       setForm(initialForm);
//       setLookupResult(null);
//       setCpMode(CP_MODE.REGISTERED);
//     } catch (err) {
//       console.error("Failed to create onsite registration", err);
//       let msg = "Failed to create onsite registration.";
//       const data = err?.response?.data;
//       if (data) {
//         if (typeof data === "string") msg = data;
//         else if (data.detail) msg = data.detail;
//       }
//       showToast(msg, "error");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleScheduleSiteVisit = async () => {
//     if (!hasExistingLeadInProject || !existingLeadInCurrentProject) {
//       showToast(
//         "No existing lead in this project to schedule a visit.",
//         "error"
//       );
//       return;
//     }
//     if (!form.unit_configuration_id) {
//       showToast(
//         "Please select a configuration before scheduling a visit.",
//         "error"
//       );
//       return;
//     }

//     const digits = (form.mobile_number || "").replace(/\D/g, "");

//     const memberName =
//       existingLeadInCurrentProject.full_name ||
//       `${existingLeadInCurrentProject.first_name || ""} ${
//         existingLeadInCurrentProject.last_name || ""
//       }`.trim() ||
//       `${form.first_name} ${form.last_name}`.trim() ||
//       digits;

//     const payload = {
//       lead_id: existingLeadInCurrentProject.id,
//       project_id: Number(form.project_id),
//       unit_config_id: Number(form.unit_configuration_id),
//       inventory_id: null,
//       scheduled_at: new Date().toISOString(), // auto current date-time
//       member_name: memberName,
//       member_mobile_number: digits,
//       notes: "NEW",
//     };

//     try {
//       await api.post("/sales/site-visits/", payload);
//       showToast("Site visit scheduled successfully.", "success");
//     } catch (err) {
//       console.error("Failed to schedule site visit", err);
//       let msg = "Failed to schedule site visit.";
//       const data = err?.response?.data;
//       if (data) {
//         if (typeof data === "string") msg = data;
//         else if (data.detail) msg = data.detail;
//       }
//       showToast(msg, "error");
//     }
//   };

//   const handleCopyAndCreate = async () => {
//     if (submitting) return;
//     if (!validate()) return;

//     if (!hasLeadsInOtherProjects || !leadsForPhone.length) {
//       showToast("No other project lead found to copy data from.", "error");
//       return;
//     }

//     // later: allow user to pick; for now take first
//     const fromLead = leadsForPhone[0];

//     const payload = buildOnsitePayload();

//     setSubmitting(true);
//     try {
//       // 1) create new lead in current project via onsite API
//       const res = await api.post(ONSITE_API, payload);
//       const newLeadId = res?.data?.lead?.id;

//       if (newLeadId && fromLead?.id) {
//         // 2) copy missing fields from old lead to new lead
//         await api.post("/sales/sales-leads/copy-missing/", {
//           from_lead_id: fromLead.id,
//           to_lead_id: newLeadId,
//         });
//       }

//       showToast(
//         "Lead created in this project and data copied from existing lead.",
//         "success"
//       );
//       setForm(initialForm);
//       setLookupResult(null);
//       setCpMode(CP_MODE.REGISTERED);
//     } catch (err) {
//       console.error("Failed to copy data & create lead", err);
//       let msg = "Failed to copy data & create lead.";
//       const data = err?.response?.data;
//       if (data) {
//         if (typeof data === "string") msg = data;
//         else if (data.detail) msg = data.detail;
//       }
//       showToast(msg, "error");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ---------- Quick CP: OTP send/verify + create ----------
//   const handleSendQuickCpOtp = async () => {
//     const email = (quickCpForm.email || "").trim();
//     if (!email) {
//       showToast("Please enter CP email first.", "error");
//       return;
//     }

//     setQuickCpEmailVerified(false);
//     setQuickCpOtpCode("");
//     setQuickCpOtpSending(true);

//     try {
//       await api.post("/sales/sales-leads/email-otp/start/", { email });
//       showToast("OTP sent to CP email.", "success");
//     } catch (err) {
//       console.error("Failed to send quick CP OTP", err);
//       let msg = "Failed to send OTP.";
//       const data = err?.response?.data;
//       if (data?.detail) msg = data.detail;
//       showToast(msg, "error");
//     } finally {
//       setQuickCpOtpSending(false);
//     }
//   };

//   const handleVerifyQuickCpOtp = async () => {
//     const email = (quickCpForm.email || "").trim();
//     const otp = (quickCpOtpCode || "").trim();

//     if (!email) {
//       showToast("Please enter CP email first.", "error");
//       return;
//     }
//     if (!otp) {
//       showToast("Please enter OTP.", "error");
//       return;
//     }

//     setQuickCpOtpVerifying(true);
//     try {
//       await api.post("/sales/sales-leads/email-otp/verify/", { email, otp });
//       showToast("CP email verified.", "success");
//       setQuickCpEmailVerified(true);
//     } catch (err) {
//       console.error("Failed to verify quick CP OTP", err);
//       setQuickCpEmailVerified(false);
//       let msg = "Failed to verify OTP.";
//       const data = err?.response?.data;
//       if (data?.detail) msg = data.detail;
//       showToast(msg, "error");
//     } finally {
//       setQuickCpOtpVerifying(false);
//     }
//   };

//   const handleQuickCpCreate = async () => {
//     if (!quickCpEmailVerified) {
//       showToast("Please verify CP email first.", "error");
//       return;
//     }

//     if (
//       !quickCpForm.name ||
//       !quickCpForm.email ||
//       !quickCpForm.partner_tier_id
//     ) {
//       showToast("Name, Email, and Partner Tier are required.", "error");
//       return;
//     }

//     try {
//       const body = {
//         name: quickCpForm.name,
//         email: quickCpForm.email,
//         mobile_number: quickCpForm.mobile_number || "",
//         company_name: quickCpForm.company_name || "",
//         pan_number: quickCpForm.pan_number || "",
//         rera_number: quickCpForm.rera_number || "",
//         partner_tier_id: quickCpForm.partner_tier_id,
//         project_id: form.project_id,
//       };

//       const res = await api.post("/channel/partners/quick-create/", body);
//       showToast("Channel Partner created successfully.", "success");

//       const newCp = res.data;

//       // Reload CPs for this project (registered mode)
//       const reloadRes = await api.get("/channel/partners/by-project/", {
//         params: { project_id: form.project_id },
//       });
//       const list = reloadRes.data?.results || reloadRes.data || [];
//       setChannelPartners(list);

//       // Auto-select new CP in form
//       setForm((prev) => ({
//         ...prev,
//         has_channel_partner: true,
//         channel_partner_id: String(newCp.id),
//       }));
//       setCpMode(CP_MODE.REGISTERED);

//       // Close modal + reset quick form
//       setShowQuickCpModal(false);
//       setQuickCpForm({
//         name: "",
//         email: "",
//         mobile_number: "",
//         company_name: "",
//         pan_number: "",
//         rera_number: "",
//         partner_tier_id: "",
//       });
//       setQuickCpOtpCode("");
//       setQuickCpEmailVerified(false);
//     } catch (err) {
//       console.error("Failed to create quick CP", err);
//       let msg = "Failed to create Channel Partner.";
//       const data = err?.response?.data;
//       if (data?.detail) msg = data.detail;
//       showToast(msg, "error");
//     }
//   };

//   // ---------- render ----------
//   return (
//     <div className="onsite-page">
//       <div className="onsite-card">
//         <div className="onsite-header">
//           <button
//             type="button"
//             className="onsite-back-btn"
//             onClick={() => window.history.back()}
//           >
//             ←
//           </button>
//           <h1 className="onsite-title">Onsite Registration</h1>
//         </div>

//         <form className="onsite-body" onSubmit={handleSubmit}>
//           {/* Project */}
//           <div className="onsite-field">
//             <label className="onsite-label">
//               Project <span className="onsite-required">*</span>
//             </label>
//             <select
//               className="onsite-input"
//               value={form.project_id}
//               onChange={(e) => handleChange("project_id", e.target.value)}
//               disabled={scopeLoading}
//             >
//               <option value="">
//                 {scopeLoading ? "Loading..." : "Select Project"}
//               </option>
//               {projects.map((p) => (
//                 <option key={p.id} value={p.id}>
//                   {p.name || p.project_name || `Project #${p.id}`}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* First / Last / Mobile in one row */}
//           <div className="onsite-row-3">
//             {/* First Name */}
//             <div className="onsite-field">
//               <label className="onsite-label">
//                 First Name <span className="onsite-required">*</span>
//               </label>
//               <input
//                 className="onsite-input"
//                 type="text"
//                 placeholder="Enter First Name"
//                 value={form.first_name}
//                 onChange={(e) => handleChange("first_name", e.target.value)}
//               />
//             </div>

//             {/* Last Name */}
//             <div className="onsite-field">
//               <label className="onsite-label">
//                 Last Name <span className="onsite-required">*</span>
//               </label>
//               <input
//                 className="onsite-input"
//                 type="text"
//                 placeholder="Enter Last Name"
//                 value={form.last_name}
//                 onChange={(e) => handleChange("last_name", e.target.value)}
//               />
//             </div>

//             {/* Mobile + Lookup */}
//             <div className="onsite-field">
//               <label className="onsite-label">
//                 Mobile Number <span className="onsite-required">*</span>
//               </label>
//               <input
//                 className="onsite-input"
//                 type="tel"
//                 placeholder="Enter Mobile Number"
//                 value={form.mobile_number}
//                 onChange={(e) => handleChange("mobile_number", e.target.value)}
//               />

//               {/* Banner: only for checking / when something is present */}
//               {(checkingPhone || lookupResult) && (
//                 <div className="onsite-lookup-banner">
//                   {checkingPhone ? (
//                     <span>Checking existing records…</span>
//                   ) : lookupResult?.present ? (
//                     <>
//                       <span>
//                         Lead / opportunity already exists for this mobile.
//                         Leads: {lookupResult.lead_count || 0}, Opportunities:{" "}
//                         {lookupResult.opportunity_count || 0}.
//                       </span>
//                       <button
//                         type="button"
//                         className="onsite-lookup-more-btn"
//                         onClick={() => setShowLookupModal(true)}
//                       >
//                         View more
//                       </button>
//                     </>
//                   ) : null}
//                 </div>
//               )}

//               {/* Separate info line ONLY when nothing is found */}
//               {!checkingPhone && lookupResult && !lookupResult.present && (
//                 <div className="onsite-helper">
//                   No existing lead found. New lead will be created.
//                 </div>
//               )}

//               {/* If lead exists for this project: show warning + link to lead page */}
//               {!checkingPhone &&
//                 lookupResult?.present &&
//                 existingProjectLead && (
//                   <div className="onsite-helper-warning">
//                     This customer is already registered in this project.{" "}
//                     <button
//                       type="button"
//                       className="onsite-link-btn"
//                       onClick={() =>
//                         navigate(`/leads/${existingProjectLead.id}/`)
//                       } // 👈 adjust path if needed
//                     >
//                       View lead
//                     </button>{" "}
//                     or schedule a new site visit instead of creating a new lead.
//                   </div>
//                 )}

//               {/* Lead(s) in other projects */}
//               {!checkingPhone &&
//                 !hasExistingLeadInProject &&
//                 lookupResult?.present &&
//                 lookupResult.leads?.length > 0 && (
//                   <div className="onsite-helper">
//                     This customer already exists in another project. You can
//                     copy their data into this project.
//                   </div>
//                 )}
//             </div>
//           </div>

//           {/* Email / Nationality / Age in one row */}
//           <div className="onsite-row-3">
//             <div className="onsite-field">
//               <label className="onsite-label">Email</label>
//               <input
//                 className="onsite-input"
//                 type="email"
//                 placeholder="Enter Email (optional)"
//                 value={form.email}
//                 onChange={(e) => handleChange("email", e.target.value)}
//               />
//             </div>

//             <div className="onsite-field">
//               <label className="onsite-label">Nationality</label>
//               <div className="onsite-radio-group">
//                 {NATIONALITY_OPTIONS.map((opt) => (
//                   <label key={opt.value} className="onsite-radio-option">
//                     <input
//                       type="radio"
//                       name="nationality"
//                       value={opt.value}
//                       checked={form.nationality === opt.value}
//                       onChange={(e) =>
//                         handleChange("nationality", e.target.value)
//                       }
//                     />
//                     <span>{opt.label}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div className="onsite-field">
//               <label className="onsite-label">Age (in years)</label>
//               <div className="onsite-radio-group">
//                 {AGE_GROUP_OPTIONS.map((opt) => (
//                   <label key={opt.value} className="onsite-radio-option">
//                     <input
//                       type="radio"
//                       name="age_group"
//                       value={opt.value}
//                       checked={form.age_group === opt.value}
//                       onChange={(e) =>
//                         handleChange("age_group", e.target.value)
//                       }
//                     />
//                     <span>{opt.label}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Residential Address */}
//           <div className="onsite-field">
//             <label className="onsite-label">Residential Address</label>
//             <textarea
//               className="onsite-input"
//               rows={2}
//               placeholder="Flat / building, street..."
//               value={form.residential_address}
//               onChange={(e) =>
//                 handleChange("residential_address", e.target.value)
//               }
//             />
//           </div>

//           {/* Pin Code ABOVE City & Locality */}
//           <div className="onsite-field">
//             <label className="onsite-label">Pin Code</label>
//             <input
//               className="onsite-input"
//               type="text"
//               value={form.residence_pincode}
//               onChange={(e) =>
//                 handleChange("residence_pincode", e.target.value)
//               }
//             />
//           </div>

//           <div className="onsite-field">
//             <label className="onsite-label">Residence City</label>
//             <input
//               className="onsite-input"
//               type="text"
//               value={form.residence_city}
//               onChange={(e) => handleChange("residence_city", e.target.value)}
//             />
//           </div>

//           <div className="onsite-field">
//             <label className="onsite-label">Locality</label>
//             <input
//               className="onsite-input"
//               type="text"
//               value={form.residence_locality}
//               onChange={(e) =>
//                 handleChange("residence_locality", e.target.value)
//               }
//             />
//           </div>

//           {/* Configuration (UnitConfiguration) */}
//           <div className="onsite-field">
//             <label className="onsite-label">
//               Configuration <span className="onsite-required">*</span>
//             </label>
//             {mastersLoading ? (
//               <div className="onsite-helper">Loading configurations...</div>
//             ) : unitConfigs.length === 0 ? (
//               <div className="onsite-helper">
//                 {selectedProject
//                   ? "No configurations configured for this project."
//                   : "Select a project to see configurations."}
//               </div>
//             ) : (
//               <div className="onsite-type-pills">
//                 {unitConfigs.map((cfg) => {
//                   const active =
//                     String(form.unit_configuration_id) === String(cfg.id);
//                   return (
//                     <button
//                       key={cfg.id}
//                       type="button"
//                       className={
//                         "onsite-type-pill" +
//                         (active ? " onsite-type-pill-active" : "")
//                       }
//                       onClick={() =>
//                         handleChange(
//                           "unit_configuration_id",
//                           active ? "" : String(cfg.id)
//                         )
//                       }
//                     >
//                       {cfg.name ||
//                         cfg.label ||
//                         cfg.configuration ||
//                         `Config #${cfg.id}`}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Budget */}
//           <div className="onsite-field">
//             <label className="onsite-label">Budget (Min)</label>
//             <div className="onsite-type-pills">
//               {BUDGET_OPTIONS.map((b) => {
//                 const active = String(form.budget) === String(b.value);
//                 return (
//                   <button
//                     key={b.value}
//                     type="button"
//                     className={
//                       "onsite-type-pill" +
//                       (active ? " onsite-type-pill-active" : "")
//                     }
//                     onClick={() =>
//                       handleChange("budget", active ? "" : String(b.value))
//                     }
//                   >
//                     {b.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Source as pills */}
//           <div className="onsite-field">
//             <label className="onsite-label">Source of Visit</label>
//             {mastersLoading ? (
//               <div className="onsite-helper">Loading sources...</div>
//             ) : sourcesTree.length === 0 ? (
//               <div className="onsite-helper">
//                 {selectedProject
//                   ? "No sources configured."
//                   : "Select a project to see sources."}
//               </div>
//             ) : (
//               <div className="onsite-type-pills">
//                 {sourcesTree.map((s) => {
//                   const active = String(form.source_id) === String(s.id);
//                   return (
//                     <button
//                       key={s.id}
//                       type="button"
//                       className={
//                         "onsite-type-pill" +
//                         (active ? " onsite-type-pill-active" : "")
//                       }
//                       onClick={() =>
//                         handleChange("source_id", active ? "" : String(s.id))
//                       }
//                     >
//                       {s.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Sub Source as pills */}
//           <div className="onsite-field">
//             <label className="onsite-label">Sub Source</label>
//             {!subSourceOptions.length ? (
//               <div className="onsite-helper">
//                 {selectedSource
//                   ? "No sub-sources configured."
//                   : "Select a source to see sub-sources."}
//               </div>
//             ) : (
//               <div className="onsite-type-pills">
//                 {subSourceOptions.map((s) => {
//                   const active = String(form.sub_source_id) === String(s.id);
//                   return (
//                     <button
//                       key={s.id}
//                       type="button"
//                       className={
//                         "onsite-type-pill" +
//                         (active ? " onsite-type-pill-active" : "")
//                       }
//                       onClick={() =>
//                         handleChange(
//                           "sub_source_id",
//                           active ? "" : String(s.id)
//                         )
//                       }
//                     >
//                       {s.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Purpose */}
//           <div className="onsite-field">
//             <label className="onsite-label">Purpose</label>
//             {purposes.length === 0 ? (
//               <div className="onsite-helper">
//                 {selectedProject
//                   ? "No purposes configured."
//                   : "Select a project to see purposes."}
//               </div>
//             ) : (
//               <div className="onsite-type-pills">
//                 {purposes.map((p) => {
//                   const active = String(form.purpose_id) === String(p.id);
//                   return (
//                     <button
//                       key={p.id}
//                       type="button"
//                       className={
//                         "onsite-type-pill" +
//                         (active ? " onsite-type-pill-active" : "")
//                       }
//                       onClick={() =>
//                         handleChange("purpose_id", active ? "" : String(p.id))
//                       }
//                     >
//                       {p.name}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Channel Partner toggle */}
//           <div className="onsite-field onsite-checkbox-row">
//             <label className="onsite-checkbox-label">
//               <input
//                 type="checkbox"
//                 checked={form.has_channel_partner}
//                 onChange={(e) =>
//                   handleChange("has_channel_partner", e.target.checked)
//                 }
//               />
//             </label>
//             <span>Channel Partner involved</span>
//           </div>

//           {/* CP Type + CP section */}
//           {form.has_channel_partner && (
//             <>
//               {/* CP Type selector */}
//               <div className="onsite-field">
//                 <label className="onsite-label">Channel Partner Type</label>
//                 <select
//                   className="onsite-input"
//                   value={cpMode}
//                   onChange={(e) => {
//                     const nextMode = e.target.value;
//                     setCpMode(nextMode);
//                     setForm((prev) => ({
//                       ...prev,
//                       channel_partner_id: "",
//                     }));
//                   }}
//                 >
//                   <option value={CP_MODE.REGISTERED}>Registered</option>
//                   <option value={CP_MODE.UNREGISTERED}>Unregistered</option>
//                 </select>
//               </div>

//               {/* Registered: show CP dropdown */}
//               {cpMode === CP_MODE.REGISTERED && (
//                 <div className="onsite-field">
//                   <label className="onsite-label">
//                     Channel Partner <span className="onsite-required">*</span>
//                   </label>
//                   <select
//                     className="onsite-input"
//                     value={form.channel_partner_id}
//                     onChange={(e) =>
//                       handleChange("channel_partner_id", e.target.value)
//                     }
//                     disabled={cpLoading}
//                   >
//                     <option value="">
//                       {cpLoading ? "Loading..." : "Select Channel Partner"}
//                     </option>
//                     {channelPartners.map((cp) => {
//                       const fullName =
//                         cp.full_name ||
//                         cp.name ||
//                         [cp.first_name, cp.last_name].filter(Boolean).join(" ");
//                       const label =
//                         fullName ||
//                         cp.company_name ||
//                         cp.email ||
//                         `CP #${cp.id}`;
//                       return (
//                         <option key={cp.id} value={cp.id}>
//                           {label}
//                         </option>
//                       );
//                     })}
//                   </select>
//                 </div>
//               )}

//               {/* Unregistered: quick CP create button */}
//               {cpMode === CP_MODE.UNREGISTERED && (
//                 <div className="onsite-field">
//                   <label className="onsite-label">
//                     Channel Partner <span className="onsite-required">*</span>
//                   </label>
//                   <button
//                     type="button"
//                     className="btn-primary"
//                     onClick={() => setShowQuickCpModal(true)}
//                     style={{ padding: "10px 16px", borderRadius: 8 }}
//                   >
//                     + Create New Channel Partner
//                   </button>
//                   <div className="onsite-helper" style={{ marginTop: 4 }}>
//                     Once created & verified, the partner will be auto-selected
//                     for this registration.
//                   </div>
//                 </div>
//               )}
//             </>
//           )}

//           {/* Disclaimer */}
//           <div className="onsite-disclaimer">
//             <strong>Disclaimer:</strong> This is a pre-sales customer
//             registration form for project communication only. The information
//             you share will be stored securely and will <u>not</u> be sold or
//             shared with unrelated third-party advertisers.
//           </div>

//           {/* Footer */}
//           <div className="onsite-footer">
//             <button
//               type="submit"
//               className="onsite-submit-btn"
//               disabled={submitting || !!existingProjectLead} // 👈 disable if lead already exists for this project
//             >
//               {submitting ? "Creating..." : "CREATE"}
//             </button>

//             {hasExistingLeadInProject && (
//               <button
//                 type="button"
//                 className="onsite-submit-btn onsite-submit-btn-secondary"
//                 onClick={handleScheduleSiteVisit}
//                 disabled={submitting}
//                 style={{ marginLeft: 8 }}
//               >
//                 Schedule Site Visit
//               </button>
//             )}

//             {!hasExistingLeadInProject && hasLeadsInOtherProjects && (
//               <button
//                 type="button"
//                 className="onsite-submit-btn onsite-submit-btn-secondary"
//                 onClick={handleCopyAndCreate}
//                 disabled={submitting}
//                 style={{ marginLeft: 8 }}
//               >
//                 Copy Data & Create
//               </button>
//             )}
//           </div>
//         </form>
//       </div>

//       {/* Quick CP Create Modal */}
//       {showQuickCpModal && (
//         <div className="modal-overlay">
//           <div className="modal" style={{ maxWidth: "600px" }}>
//             <h3 className="modal-title">Create New Channel Partner</h3>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">
//                 Name<span className="required">*</span>
//               </label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={quickCpForm.name}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({ ...prev, name: e.target.value }))
//                 }
//               />
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">
//                 Email<span className="required">*</span>
//               </label>
//               <div style={{ display: "flex", gap: "10px" }}>
//                 <input
//                   type="email"
//                   className="form-input"
//                   style={{ flex: 1 }}
//                   value={quickCpForm.email}
//                   onChange={(e) => {
//                     setQuickCpForm((prev) => ({
//                       ...prev,
//                       email: e.target.value,
//                     }));
//                     setQuickCpEmailVerified(false);
//                     setQuickCpOtpCode("");
//                   }}
//                 />
//                 <button
//                   type="button"
//                   className="btn-secondary"
//                   onClick={handleSendQuickCpOtp}
//                   disabled={quickCpOtpSending}
//                   style={{ whiteSpace: "nowrap" }}
//                 >
//                   {quickCpOtpSending ? "Sending..." : "Send OTP"}
//                 </button>
//               </div>
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">
//                 OTP<span className="required">*</span>
//               </label>
//               <div style={{ display: "flex", gap: "10px" }}>
//                 <input
//                   type="text"
//                   className="form-input"
//                   style={{ flex: 1 }}
//                   placeholder="Enter OTP"
//                   value={quickCpOtpCode}
//                   onChange={(e) => setQuickCpOtpCode(e.target.value)}
//                 />
//                 <button
//                   type="button"
//                   className="btn-secondary"
//                   onClick={handleVerifyQuickCpOtp}
//                   disabled={quickCpOtpVerifying}
//                   style={{ whiteSpace: "nowrap" }}
//                 >
//                   {quickCpOtpVerifying ? "Verifying..." : "Verify"}
//                 </button>
//               </div>
//               {quickCpEmailVerified && (
//                 <span style={{ fontSize: 12, color: "#16a34a" }}>
//                   ✓ Email verified
//                 </span>
//               )}
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">
//                 Partner Tier<span className="required">*</span>
//               </label>
//               <select
//                 className="form-input"
//                 value={quickCpForm.partner_tier_id}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({
//                     ...prev,
//                     partner_tier_id: e.target.value,
//                   }))
//                 }
//               >
//                 <option value="">Select Partner Tier</option>
//                 {partnerTiers.map((tier) => (
//                   <option key={tier.id} value={tier.id}>
//                     {tier.name || tier.title || `Tier #${tier.id}`}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">Mobile Number</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={quickCpForm.mobile_number}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({
//                     ...prev,
//                     mobile_number: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">Company Name</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={quickCpForm.company_name}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({
//                     ...prev,
//                     company_name: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">PAN Number</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={quickCpForm.pan_number}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({
//                     ...prev,
//                     pan_number: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             <div style={{ marginBottom: "15px" }}>
//               <label className="form-label">RERA Number</label>
//               <input
//                 type="text"
//                 className="form-input"
//                 value={quickCpForm.rera_number}
//                 onChange={(e) =>
//                   setQuickCpForm((prev) => ({
//                     ...prev,
//                     rera_number: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             <div className="modal-actions">
//               <button
//                 type="button"
//                 className="btn-secondary"
//                 onClick={() => {
//                   setShowQuickCpModal(false);
//                   setQuickCpForm({
//                     name: "",
//                     email: "",
//                     mobile_number: "",
//                     company_name: "",
//                     pan_number: "",
//                     rera_number: "",
//                     partner_tier_id: "",
//                   });
//                   setQuickCpOtpCode("");
//                   setQuickCpEmailVerified(false);
//                 }}
//               >
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 className="btn-primary"
//                 onClick={handleQuickCpCreate}
//               >
//                 Create CP
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Existing lead details modal */}
//       {showLookupModal && lookupResult?.present && (
//         <div className="modal-overlay">
//           <div className="modal" style={{ maxWidth: "800px" }}>
//             <h3 className="modal-title">Existing Lead Details</h3>

//             {leadsForPhone.length === 0 ? (
//               <div className="onsite-helper">No lead details available.</div>
//             ) : (
//               leadsForPhone.map((lead) => (
//                 <div
//                   key={lead.id}
//                   style={{
//                     borderBottom: "1px solid #e5e7eb",
//                     paddingBottom: 12,
//                     marginBottom: 12,
//                   }}
//                 >
//                   <div style={{ fontWeight: 600, marginBottom: 4 }}>
//                     #{lead.id} –{" "}
//                     {lead.full_name ||
//                       `${lead.first_name || ""} ${lead.last_name || ""}`.trim()}
//                   </div>

//                   <div style={{ fontSize: 13, marginBottom: 4 }}>
//                     <strong>Project:</strong> {lead.project} &nbsp;|&nbsp;
//                     <strong>Phone:</strong> {lead.mobile_number} &nbsp;|&nbsp;
//                     <strong>Email:</strong> {lead.email || "-"}
//                   </div>

//                   <div style={{ fontSize: 13, marginBottom: 4 }}>
//                     <strong>Status:</strong> {lead.status_name || "-"}{" "}
//                     &nbsp;|&nbsp;
//                     <strong>Purpose:</strong> {lead.purpose_name || "-"}
//                   </div>

//                   {lead.address && (
//                     <div style={{ fontSize: 13, marginBottom: 4 }}>
//                       <strong>Address:</strong>{" "}
//                       {[
//                         lead.address.flat_or_building,
//                         lead.address.area,
//                         lead.address.city,
//                         lead.address.pincode,
//                       ]
//                         .filter(Boolean)
//                         .join(", ")}
//                     </div>
//                   )}

//                   {/* Last update */}
//                   {lead.last_update ? (
//                     <div
//                       style={{
//                         fontSize: 13,
//                         padding: "8px 10px",
//                         borderRadius: 6,
//                         background: "#f9fafb",
//                         marginTop: 4,
//                       }}
//                     >
//                       <div style={{ fontWeight: 600, marginBottom: 2 }}>
//                         Last Update ({lead.last_update.type}):
//                       </div>
//                       <div>{lead.last_update.title || "-"}</div>
//                       <div style={{ marginTop: 2 }}>
//                         <strong>On:</strong>{" "}
//                         {lead.last_update.event_date
//                           ? lead.last_update.event_date
//                               .slice(0, 16)
//                               .replace("T", " ")
//                           : "-"}
//                         {"  "} | <strong>By:</strong>{" "}
//                         {lead.last_update.created_by || "-"}
//                       </div>
//                     </div>
//                   ) : (
//                     <div style={{ fontSize: 13, marginTop: 4 }}>
//                       No updates recorded yet.
//                     </div>
//                   )}
//                 </div>
//               ))
//             )}

//             <div className="modal-actions">
//               <button
//                 type="button"
//                 className="btn-secondary"
//                 onClick={() => setShowLookupModal(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance"; // adjust path if needed
import { showToast } from "../utils/toast";
import "./OnsiteRegistration.css";

const SCOPE_URL = "/client/my-scope/";
const ONSITE_API = "/sales/onsite-registration/";
const LEAD_MASTERS_API = "/leadManagement/v2/leads/masters/";

// CP Mode
const CP_MODE = {
  REGISTERED: "REGISTERED",
  UNREGISTERED: "UNREGISTERED",
};

// enums (must match backend TextChoices)
const NATIONALITY_OPTIONS = [
  { value: "INDIAN", label: "Indian" },
  { value: "NRI", label: "NRI" },
  { value: "OTHER", label: "Others" },
];

const AGE_GROUP_OPTIONS = [
  { value: "20_25", label: "20-25" },
  { value: "26_35", label: "26-35" },
  { value: "36_45", label: "36-45" },
  { value: "46_60", label: "46-60" },
  { value: "GT60", label: ">60" },
];

// Budget slabs (start from 1 Cr)
const BUDGET_OPTIONS = [
  { value: 10000000, label: " below 2 cr" },
  { value: 15000000, label: "2 to 2.5 cr" },
  { value: 20000000, label: "2.5 to 3 cr" },
  { value: 25000000, label: "3-4 cr" },
  { value: 30000000, label: "4-5 cr" },
  { value: 35000000, label: "5cr and above" },
];

const initialForm = {
  project_id: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  email: "",

  nationality: "",
  age_group: "",

  unit_configuration_id: "",
  budget: "",

  // Source / Sub-source / Purpose
  source_id: "",
  sub_source_id: "",
  purpose_id: "",

  // Residential address
  residential_address: "",
  residence_city: "",
  residence_locality: "",
  residence_pincode: "",

  // CP
  channel_partner_id: "",
};

export default function OnsiteRegistration() {
  const [form, setForm] = useState(initialForm);

  const [scopeLoading, setScopeLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const navigate = useNavigate();

  // masters for project
  const [mastersLoading, setMastersLoading] = useState(false);
  const [unitConfigs, setUnitConfigs] = useState([]);
  const [sourcesTree, setSourcesTree] = useState([]);
  const [purposes, setPurposes] = useState([]);

  const [cpLoading, setCpLoading] = useState(false);
  const [channelPartners, setChannelPartners] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [lookupResult, setLookupResult] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [brandLogo, setBrandLogo] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Pincode lookup
  const [loadingPincode, setLoadingPincode] = useState(false);

  // ---------- CP state (REGISTERED vs UNREGISTERED) ----------
  const [cpMode, setCpMode] = useState(CP_MODE.REGISTERED);

  const existingProjectLead = useMemo(() => {
    if (!lookupResult?.present || !form.project_id) return null;
    const pid = Number(form.project_id);
    const leads = lookupResult.leads || [];
    return leads.find((lead) => Number(lead.project) === pid) || null;
  }, [lookupResult, form.project_id]);

  // Quick CP create modal + form
  const [showQuickCpModal, setShowQuickCpModal] = useState(false);
  const [quickCpForm, setQuickCpForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    company_name: "",
    pan_number: "",
    rera_number: "",
    partner_tier_id: "",
  });
  const [quickCpOtpSending, setQuickCpOtpSending] = useState(false);
  const [quickCpOtpVerifying, setQuickCpOtpVerifying] = useState(false);
  const [quickCpOtpCode, setQuickCpOtpCode] = useState("");
  const [quickCpEmailVerified, setQuickCpEmailVerified] = useState(false);
  const [partnerTiers, setPartnerTiers] = useState([]);

  // ---------- Phone lookup (10 digits + project) ----------
  useEffect(() => {
    const digits = (form.mobile_number || "").replace(/\D/g, "");

    // naya lookup start -> close modal
    setShowLookupModal(false);

    if (digits.length === 10 && form.project_id) {
      setCheckingPhone(true);
      api
        .get("/sales/sales-leads/lookup-by-phone/", {
          params: {
            phone: digits,
            project_id: form.project_id,
          },
        })
        .then((res) => {
          setLookupResult(res.data || null);
        })
        .catch((err) => {
          console.error("phone lookup failed", err);
          setLookupResult(null);
        })
        .finally(() => setCheckingPhone(false));
    } else {
      setLookupResult(null);
    }
  }, [form.mobile_number, form.project_id]);

  // ---------- Pincode lookup (6 digits) ----------
  useEffect(() => {
    const pincodeDigits = (form.residence_pincode || "").replace(/\D/g, "");

    if (pincodeDigits.length === 6) {
      setLoadingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
        .then((res) => res.json())
        .then((dataArray) => {
          // Response is an array: [{"Message":"...","Status":"Success","PostOffice":[...]}]
          const response = dataArray?.[0];
          if (response?.Status === "Success" && response?.PostOffice?.length > 0) {
            const postOffice = response.PostOffice[0]; // Use first post office
            setForm((prev) => ({
              ...prev,
              residence_city: postOffice.District || prev.residence_city,
              residence_locality: postOffice.Name || prev.residence_locality,
            }));
          }
        })
        .catch((err) => {
          console.error("pincode lookup failed", err);
          // Silent fail - manual entry still available
        })
        .finally(() => setLoadingPincode(false));
    }
  }, [form.residence_pincode]);

  // ---------- Load scope with projects (MY_SCOPE) ----------
  useEffect(() => {
    setScopeLoading(true);
    api
      .get(SCOPE_URL, { params: { include_units: true, unit_type: true } })
      .then((res) => {
        const data = res.data || {};
        const list = data.projects || data.project_list || data.results || [];
        setProjects(list);

        if (data.brand) {
          if (data.brand.logo_url) {
            setBrandLogo(data.brand.logo_url);
          }
          if (data.brand.company_name) {
            setCompanyName(data.brand.company_name);
          }
        }

        // auto-select project if only one
        if (list.length === 1) {
          setForm((prev) => ({ ...prev, project_id: String(list[0].id) }));
        }
      })
      .catch((err) => {
        console.error("Failed to load project scope", err);
        showToast("Failed to load project scope", "error");
      })
      .finally(() => setScopeLoading(false));
  }, []);

  // ---------- Load lead masters for selected project ----------
  useEffect(() => {
    if (!form.project_id) {
      setUnitConfigs([]);
      setSourcesTree([]);
      setPurposes([]);
      return;
    }

    setMastersLoading(true);
    api
      .get(LEAD_MASTERS_API, { params: { project_id: form.project_id } })
      .then((res) => {
        const data = res.data || {};
        setUnitConfigs(data.unit_configurations || data.unit_configs || []);
        setSourcesTree(data.sources || []);
        setPurposes(data.purposes || []);
      })
      .catch((err) => {
        console.error("Failed to load lead masters", err);
        showToast("Failed to load project lead masters", "error");
        setUnitConfigs([]);
        setSourcesTree([]);
        setPurposes([]);
      })
      .finally(() => setMastersLoading(false));
  }, [form.project_id]);

  // ---------- Load partner tiers for Quick CP when project selected ----------
  useEffect(() => {
    if (!form.project_id) {
      setPartnerTiers([]);
      return;
    }

    api
      .get("/channel/partner-tiers/")
      .then((res) => {
        const list = res.data?.results || res.data || [];
        setPartnerTiers(list);
      })
      .catch((err) => {
        console.error("Failed to load partner tiers", err);
      });
  }, [form.project_id]);

  const selectedProject = useMemo(
    () =>
      projects.find((p) => String(p.id) === String(form.project_id)) || null,
    [projects, form.project_id]
  );

  const selectedSource = useMemo(
    () =>
      sourcesTree.find((s) => String(s.id) === String(form.source_id)) || null,
    [sourcesTree, form.source_id]
  );

  const subSourceOptions = useMemo(
    () => selectedSource?.children || [],
    [selectedSource]
  );

  const leadsForPhone = useMemo(
    () => lookupResult?.leads || [],
    [lookupResult]
  );

  const existingLeadInCurrentProject = useMemo(
    () =>
      leadsForPhone.find(
        (lead) => String(lead.project) === String(form.project_id)
      ) || null,
    [leadsForPhone, form.project_id]
  );

  const hasExistingLeadInProject = !!existingLeadInCurrentProject;

  const hasLeadsInOtherProjects = useMemo(
    () =>
      leadsForPhone.some(
        (lead) => String(lead.project) !== String(form.project_id)
      ),
    [leadsForPhone, form.project_id]
  );

  // 👉 Source pe for_cp true ho toh hi CP flows
  const isCpSource = useMemo(
    () => !!(selectedSource && selectedSource.for_cp),
    [selectedSource]
  );

  // ---------- Load CPs when needed (source.for_cp === true) ----------
  useEffect(() => {
    if (!form.project_id || !isCpSource) {
      setChannelPartners([]);
      return;
    }

    if (cpMode !== CP_MODE.REGISTERED) {
      setChannelPartners([]);
      return;
    }

    setCpLoading(true);
    api
      .get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      })
      .then((res) => {
        const data = res.data || {};
        const list = data.results || data || [];
        setChannelPartners(list);
      })
      .catch((err) => {
        console.error("Failed to load channel partners", err);
        showToast("Failed to load channel partners", "error");
      })
      .finally(() => setCpLoading(false));
  }, [form.project_id, isCpSource, cpMode]);

  // ---------- helpers ----------
  const handleChange = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "project_id") {
        // project change => reset project-specific stuff
        next.unit_configuration_id = "";
        next.budget = "";
        next.source_id = "";
        next.sub_source_id = "";
        next.purpose_id = "";
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);
      }

      if (name === "source_id") {
        next.sub_source_id = "";
        // source change -> CP UI auto based on for_cp, so no manual toggle required
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);
      }

      return next;
    });
  };

  const validate = () => {
    const missing = [];

    if (!form.project_id) missing.push("Project");
    if (!form.first_name.trim()) missing.push("First Name");
    if (!form.last_name.trim()) missing.push("Last Name");
    if (!form.mobile_number.trim()) missing.push("Mobile Number");
    // email is optional now
    if (!form.unit_configuration_id) missing.push("Configuration (2/3/4 BHK)");

    // 👉 Agar source CP-type hai, toh Channel Partner required
    if (isCpSource && !form.channel_partner_id) {
      missing.push("Channel Partner");
    }

    if (missing.length) {
      showToast("Please fill required fields:\n" + missing.join("\n"), "error");
      return false;
    }

    return true;
  };

  const buildOnsitePayload = () => {
    return {
      project_id: Number(form.project_id),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim() || "",

      nationality: form.nationality || null,
      age_group: form.age_group || null,

      unit_configuration_id: form.unit_configuration_id
        ? Number(form.unit_configuration_id)
        : null,

      budget: form.budget ? Number(form.budget) : null,

      source_id: form.source_id ? Number(form.source_id) : null,
      sub_source_id: form.sub_source_id ? Number(form.sub_source_id) : null,
      purpose_id: form.purpose_id ? Number(form.purpose_id) : null,

      residential_address: form.residential_address.trim(),
      residence_city: form.residence_city.trim(),
      residence_locality: form.residence_locality.trim(),
      residence_pincode: form.residence_pincode.trim(),

      // 👉 Backend expects this: true only when source.for_cp
      has_channel_partner: !!isCpSource,
      channel_partner_id:
        isCpSource && form.channel_partner_id
          ? Number(form.channel_partner_id)
          : null,

      // backend still expects this, so always send true
      terms_accepted: true,
    };
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successLeadId, setSuccessLeadId] = useState(null);
  const [successLeadName, setSuccessLeadName] = useState("");

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (submitting) return;
  //   if (!validate()) return;

  //   if (hasExistingLeadInProject) {
  //     showToast(
  //       "This customer is already part of this project. Please schedule a site visit instead.",
  //       "error"
  //     );
  //     return;
  //   }

  //   const payload = buildOnsitePayload();

  //   setSubmitting(true);
  //   try {
  //     const res = await api.post(ONSITE_API, payload);
  //     console.log("Onsite registration success:", res.data);
  //     showToast("Onsite registration created successfully.", "success");
  //     setForm(initialForm);
  //     setLookupResult(null);
  //     setCpMode(CP_MODE.REGISTERED);
  //   } catch (err) {
  //     console.error("Failed to create onsite registration", err);
  //     let msg = "Failed to create onsite registration.";
  //     const data = err?.response?.data;
  //     if (data) {
  //       if (typeof data === "string") msg = data;
  //       else if (data.detail) msg = data.detail;
  //     }
  //     showToast(msg, "error");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    if (hasExistingLeadInProject) {
      showToast(
        "This customer is already part of this project. Please schedule a site visit instead.",
        "error"
      );
      return;
    }

    const payload = buildOnsitePayload();

    setSubmitting(true);
    try {
      const res = await api.post(ONSITE_API, payload);
      console.log("Onsite registration success:", res.data);
      showToast("Onsite registration created successfully.", "success");

      // 🎯 take lead id from response
      const newLeadId = res?.data?.lead?.id || null;

      // Try to get name from response, fallback to form
      const fn = res?.data?.lead?.first_name || form.first_name;
      const ln = res?.data?.lead?.last_name || form.last_name;
      const fullName = `${fn || ""} ${ln || ""}`.trim() || "Customer";

      setSuccessLeadId(newLeadId);
      setSuccessLeadName(fullName);
      setShowSuccessModal(true);

      // Reset form state
      setForm(initialForm);
      setLookupResult(null);
      setCpMode(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to create onsite registration", err);
      let msg = "Failed to create onsite registration.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSiteVisit = async () => {
    if (!hasExistingLeadInProject || !existingLeadInCurrentProject) {
      showToast(
        "No existing lead in this project to schedule a visit.",
        "error"
      );
      return;
    }
    if (!form.unit_configuration_id) {
      showToast(
        "Please select a configuration before scheduling a visit.",
        "error"
      );
      return;
    }

    const digits = (form.mobile_number || "").replace(/\D/g, "");

    const memberName =
      existingLeadInCurrentProject.full_name ||
      `${existingLeadInCurrentProject.first_name || ""} ${
        existingLeadInCurrentProject.last_name || ""
      }`.trim() ||
      `${form.first_name} ${form.last_name}`.trim() ||
      digits;

    const payload = {
      lead_id: existingLeadInCurrentProject.id,
      project_id: Number(form.project_id),
      unit_config_id: Number(form.unit_configuration_id),
      inventory_id: null,
      scheduled_at: new Date().toISOString(), // auto current date-time
      member_name: memberName,
      member_mobile_number: digits,
      notes: "NEW",
    };

    try {
      await api.post("/sales/site-visits/", payload);
      showToast("Site visit scheduled successfully.", "success");
    } catch (err) {
      console.error("Failed to schedule site visit", err);
      let msg = "Failed to schedule site visit.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    }
  };

  const handleCopyAndCreate = async () => {
    if (submitting) return;
    if (!validate()) return;

    if (!hasLeadsInOtherProjects || !leadsForPhone.length) {
      showToast("No other project lead found to copy data from.", "error");
      return;
    }

    const fromLead = leadsForPhone[0];
    const payload = buildOnsitePayload();

    setSubmitting(true);
    try {
      const res = await api.post(ONSITE_API, payload);
      const newLeadId = res?.data?.lead?.id;

      if (newLeadId && fromLead?.id) {
        await api.post("/sales/sales-leads/copy-missing/", {
          from_lead_id: fromLead.id,
          to_lead_id: newLeadId,
        });
      }

      showToast(
        "Lead created in this project and data copied from existing lead.",
        "success"
      );
      setForm(initialForm);
      setLookupResult(null);
      setCpMode(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to copy data & create lead", err);
      let msg = "Failed to copy data & create lead.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Quick CP: OTP send/verify + create ----------
  const handleSendQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }

    setQuickCpEmailVerified(false);
    setQuickCpOtpCode("");
    setQuickCpOtpSending(true);

    try {
      await api.post("/sales/sales-leads/email-otp/start/", { email });
      showToast("OTP sent to CP email.", "success");
    } catch (err) {
      console.error("Failed to send quick CP OTP", err);
      let msg = "Failed to send OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpSending(false);
    }
  };

  const handleVerifyQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    const otp = (quickCpOtpCode || "").trim();

    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }
    if (!otp) {
      showToast("Please enter OTP.", "error");
      return;
    }

    setQuickCpOtpVerifying(true);
    try {
      await api.post("/sales/sales-leads/email-otp/verify/", { email, otp });
      showToast("CP email verified.", "success");
      setQuickCpEmailVerified(true);
    } catch (err) {
      console.error("Failed to verify quick CP OTP", err);
      setQuickCpEmailVerified(false);
      let msg = "Failed to verify OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpVerifying(false);
    }
  };

  const handleQuickCpCreate = async () => {
    if (!quickCpEmailVerified) {
      showToast("Please verify CP email first.", "error");
      return;
    }

    if (
      !quickCpForm.name ||
      !quickCpForm.email ||
      !quickCpForm.partner_tier_id
    ) {
      showToast("Name, Email, and Partner Tier are required.", "error");
      return;
    }

    try {
      const body = {
        name: quickCpForm.name,
        email: quickCpForm.email,
        mobile_number: quickCpForm.mobile_number || "",
        company_name: quickCpForm.company_name || "",
        pan_number: quickCpForm.pan_number || "",
        rera_number: quickCpForm.rera_number || "",
        partner_tier_id: quickCpForm.partner_tier_id,
        project_id: form.project_id,
      };

      const res = await api.post("/channel/partners/quick-create/", body);
      showToast("Channel Partner created successfully.", "success");

      const newCp = res.data;

      // Reload CPs for this project (registered mode)
      const reloadRes = await api.get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      });
      const list = reloadRes.data?.results || reloadRes.data || [];
      setChannelPartners(list);

      // Auto-select new CP in form
      setForm((prev) => ({
        ...prev,
        channel_partner_id: String(newCp.id),
      }));
      setCpMode(CP_MODE.REGISTERED);

      // Close modal + reset quick form
      setShowQuickCpModal(false);
      setQuickCpForm({
        name: "",
        email: "",
        mobile_number: "",
        company_name: "",
        pan_number: "",
        rera_number: "",
        partner_tier_id: "",
      });
      setQuickCpOtpCode("");
      setQuickCpEmailVerified(false);
    } catch (err) {
      console.error("Failed to create quick CP", err);
      let msg = "Failed to create Channel Partner.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    }
  };

  // ---------- render ----------
  return (
    <div
      className="onsite-page"
      style={{ "--brand-logo": `url(${brandLogo})` }}
    >
      <div className="onsite-card">
        <div className="onsite-header">
          <div className="onsite-header-left">
            {/* <button
              type="button"
              className="onsite-back-btn"
              onClick={() => window.history.back()}
            >
              ←
            </button> */}

            {brandLogo && (
              <div className="onsite-logo-wrap">
                <img src={brandLogo} alt="Brand Logo" className="onsite-logo" />
              </div>
            )}
          </div>

          <div className="onsite-header-right">
            {selectedProject && (
              <>
                <h2 className="onsite-project-name">
                  {selectedProject.name ||
                    selectedProject.project_name ||
                    "Project Name"}
                </h2>
                {selectedProject.rera_number && (
                  <p className="onsite-rera-number">
                    RERA: {selectedProject.rera_number}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add title section after header */}
        <div className="onsite-title-section">
          {/* <button
              type="button"
              className="onsite-back-btn"
              onClick={() => window.history.back()}
            >
              ←
            </button> */}
          <h1 className="onsite-title">Customer Registration Form</h1>
        </div>

        <form className="onsite-body" onSubmit={handleSubmit}>
          {/* Project (Full Width - Outside Grid) */}
          <div className="onsite-field">
            <label className="onsite-label">
              Project <span className="onsite-required">*</span>
            </label>
            <select
              className="onsite-input"
              value={form.project_id}
              onChange={(e) => handleChange("project_id", e.target.value)}
              disabled={scopeLoading}
            >
              <option value="">
                {scopeLoading ? "Loading..." : "Select Project"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* First / Last / Mobile */}
          <div className="onsite-row-3 onsite-row-tight">
            {/* First Name */}
            <div className="onsite-field">
              <label className="onsite-label">
                First Name <span className="onsite-required">*</span>
              </label>
              <input
                className="onsite-input"
                type="text"
                placeholder="Enter First Name"
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="onsite-field">
              <label className="onsite-label">
                Last Name <span className="onsite-required">*</span>
              </label>
              <input
                className="onsite-input"
                type="text"
                placeholder="Enter Last Name"
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />
            </div>

            {/* Mobile + Lookup */}
            <div className="onsite-field">
              <label className="onsite-label">
                Mobile Number <span className="onsite-required">*</span>
              </label>
              <input
                className="onsite-input"
                type="tel"
                placeholder="Enter Mobile Number"
                value={form.mobile_number}
                onChange={(e) => handleChange("mobile_number", e.target.value)}
              />

              {(checkingPhone || lookupResult) && (
                <div className="onsite-lookup-banner">
                  {checkingPhone ? (
                    <span>Checking existing records…</span>
                  ) : lookupResult?.present ? (
                    <>
                      <span>
                        Lead / opportunity already exists for this mobile.
                        Leads: {lookupResult.lead_count || 0}, Opportunities:{" "}
                        {lookupResult.opportunity_count || 0}.
                      </span>
                      <button
                        type="button"
                        className="onsite-lookup-more-btn"
                        onClick={() => setShowLookupModal(true)}
                      >
                        View more
                      </button>
                    </>
                  ) : null}
                </div>
              )}

              {/* {!checkingPhone && lookupResult && !lookupResult.present && (
                <div className="onsite-helper">
                  No existing lead found. New lead will be created.
                </div>
              )} */}

              {!checkingPhone &&
                lookupResult?.present &&
                existingProjectLead && (
                  <div className="onsite-helper-warning">
                    This customer is already registered in this project.{" "}
                    <button
                      type="button"
                      className="onsite-link-btn"
                      onClick={() =>
                        navigate(`/leads/${existingProjectLead.id}/`)
                      }
                    >
                      View lead
                    </button>{" "}
                    or schedule a new site visit instead of creating a new lead.
                  </div>
                )}

              {!checkingPhone &&
                !hasExistingLeadInProject &&
                lookupResult?.present &&
                lookupResult.leads?.length > 0 && (
                  <div className="onsite-helper">
                    This customer already exists in another project. You can
                    copy their data into this project.
                  </div>
                )}
            </div>
          </div>

          {/* Email / Nationality / Age */}
          <div className="onsite-row-3 onsite-row-tight">
            <div className="onsite-field">
              <label className="onsite-label">Email</label>
              <input
                className="onsite-input"
                type="email"
                placeholder="Enter Email (optional)"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Nationality</label>
              <select
                className="onsite-input"
                value={form.nationality}
                onChange={(e) => handleChange("nationality", e.target.value)}
              >
                <option value="">Select Nationality</option>
                {NATIONALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Age (in years)</label>
              <select
                className="onsite-input"
                value={form.age_group}
                onChange={(e) => handleChange("age_group", e.target.value)}
              >
                <option value="">Select Age</option>
                {AGE_GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Residential Address */}
          <div className="onsite-field">
            <label className="onsite-label">Residential Address</label>
            <textarea
              className="onsite-input"
              rows={2}
              placeholder="Flat / building, street..."
              value={form.residential_address}
              onChange={(e) =>
                handleChange("residential_address", e.target.value)
              }
            />
          </div>

          {/* Pin Code / City / Locality */}
          <div className="onsite-row-3 onsite-row-tight">
            <div className="onsite-field">
              <label className="onsite-label">
                Pin Code
                {loadingPincode && (
                  <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
                    (Looking up...)
                  </span>
                )}
              </label>
              <input
                className="onsite-input"
                type="text"
                maxLength={6}
                value={form.residence_pincode}
                onChange={(e) =>
                  handleChange("residence_pincode", e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter 6-digit pincode"
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Residence City</label>
              <input
                className="onsite-input"
                type="text"
                value={form.residence_city}
                onChange={(e) => handleChange("residence_city", e.target.value)}
                placeholder="Auto-filled from pincode"
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Locality</label>
              <input
                className="onsite-input"
                type="text"
                value={form.residence_locality}
                onChange={(e) =>
                  handleChange("residence_locality", e.target.value)
                }
                placeholder="Auto-filled from pincode"
              />
            </div>
          </div>

          {/* Configuration / Budget / Source */}
          <div className="onsite-row-3 onsite-row-tight">
            {/* Configuration */}
            <div className="onsite-field">
              <label className="onsite-label">
                Configuration <span className="onsite-required">*</span>
              </label>
              {mastersLoading ? (
                <div className="onsite-helper">Loading configurations...</div>
              ) : unitConfigs.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No configurations configured for this project."
                    : "Select a project to see configurations."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.unit_configuration_id}
                  onChange={(e) =>
                    handleChange("unit_configuration_id", e.target.value)
                  }
                >
                  <option value="">Select Configuration</option>
                  {unitConfigs.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.name ||
                        cfg.label ||
                        cfg.configuration ||
                        `Config #${cfg.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Budget */}
            <div className="onsite-field">
              <label className="onsite-label">Budget (Min)</label>
              <select
                className="onsite-input"
                value={form.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
              >
                <option value="">Select Budget</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Source of Visit */}
            <div className="onsite-field">
              <label className="onsite-label">Source of Visit</label>
              {mastersLoading ? (
                <div className="onsite-helper">Loading sources...</div>
              ) : sourcesTree.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No sources configured."
                    : "Select a project to see sources."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.source_id}
                  onChange={(e) => handleChange("source_id", e.target.value)}
                >
                  <option value="">Select Source</option>
                  {sourcesTree.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sub Source / Purpose */}
          {subSourceOptions.length > 0 && (
            <div className="onsite-field onsite-row-tight">
              <label className="onsite-label">Sub Source</label>
              <select
                className="onsite-input"
                value={form.sub_source_id}
                onChange={(e) => handleChange("sub_source_id", e.target.value)}
              >
                <option value="">Select Sub Source</option>
                {subSourceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Purpose + CP Type + CP in one row */}
          {isCpSource ? (
            <div className="onsite-row-3 onsite-row-tight">
              {/* Purpose */}
              <div className="onsite-field">
                <label className="onsite-label">Purpose</label>
                {purposes.length === 0 ? (
                  <div className="onsite-helper">
                    {selectedProject
                      ? "No purposes configured."
                      : "Select a project to see purposes."}
                  </div>
                ) : (
                  <select
                    className="onsite-input"
                    value={form.purpose_id}
                    onChange={(e) => handleChange("purpose_id", e.target.value)}
                  >
                    <option value="">Select Purpose</option>
                    {purposes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Channel Partner Type */}
              <div className="onsite-field">
                <label className="onsite-label">Channel Partner Type</label>
                <select
                  className="onsite-input"
                  value={cpMode}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    setCpMode(nextMode);
                    setForm((prev) => ({
                      ...prev,
                      channel_partner_id: "",
                    }));
                  }}
                >
                  <option value={CP_MODE.REGISTERED}>Registered</option>
                  <option value={CP_MODE.UNREGISTERED}>Unregistered</option>
                </select>
              </div>

              {/* Channel Partner */}
              <div className="onsite-field">
                <label className="onsite-label">
                  Channel Partner <span className="onsite-required">*</span>
                </label>

                {cpMode === CP_MODE.REGISTERED ? (
                  <select
                    className="onsite-input"
                    value={form.channel_partner_id}
                    onChange={(e) =>
                      handleChange("channel_partner_id", e.target.value)
                    }
                    disabled={cpLoading}
                  >
                    <option value="">
                      {cpLoading ? "Loading..." : "Select Channel Partner"}
                    </option>
                    {channelPartners.map((cp) => {
                      const fullName =
                        cp.full_name ||
                        cp.name ||
                        [cp.first_name, cp.last_name].filter(Boolean).join(" ");
                      const label =
                        fullName ||
                        cp.company_name ||
                        cp.email ||
                        `CP #${cp.id}`;
                      return (
                        <option key={cp.id} value={cp.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowQuickCpModal(true)}
                    style={{ padding: "10px 16px", borderRadius: 8 }}
                  >
                    + Create New Channel Partner
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Non-CP sources ke liye Purpose simple dropdown hi rahega */
            <div className="onsite-field onsite-row-tight">
              <label className="onsite-label">Purpose</label>
              {purposes.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No purposes configured."
                    : "Select a project to see purposes."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.purpose_id}
                  onChange={(e) => handleChange("purpose_id", e.target.value)}
                >
                  <option value="">Select Purpose</option>
                  {purposes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="onsite-footer">
            <button
              type="submit"
              className="onsite-submit-btn"
              disabled={submitting || !!existingProjectLead}
            >
              {submitting ? "Creating..." : "CREATE"}
            </button>

            {hasExistingLeadInProject && (
              <button
                type="button"
                className="onsite-submit-btn onsite-submit-btn-secondary"
                onClick={handleScheduleSiteVisit}
                disabled={submitting}
                style={{ marginLeft: 8 }}
              >
                Schedule Site Visit
              </button>
            )}

            {!hasExistingLeadInProject && hasLeadsInOtherProjects && (
              <button
                type="button"
                className="onsite-submit-btn onsite-submit-btn-secondary"
                onClick={handleCopyAndCreate}
                disabled={submitting}
                style={{ marginLeft: 8 }}
              >
                Copy Data & Create
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Quick CP Create Modal */}
      {showQuickCpModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3 className="modal-title">Create New Channel Partner</h3>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Email<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={quickCpForm.email}
                  onChange={(e) => {
                    setQuickCpForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setQuickCpEmailVerified(false);
                    setQuickCpOtpCode("");
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSendQuickCpOtp}
                  disabled={quickCpOtpSending}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpSending ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                OTP<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter OTP"
                  value={quickCpOtpCode}
                  onChange={(e) => setQuickCpOtpCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleVerifyQuickCpOtp}
                  disabled={quickCpOtpVerifying}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
              {quickCpEmailVerified && (
                <span style={{ fontSize: 12, color: "#16a34a" }}>
                  ✓ Email verified
                </span>
              )}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Partner Tier<span className="required">*</span>
              </label>
              <select
                className="form-input"
                value={quickCpForm.partner_tier_id}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    partner_tier_id: e.target.value,
                  }))
                }
              >
                <option value="">Select Partner Tier</option>
                {partnerTiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name || tier.title || `Tier #${tier.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.mobile_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    mobile_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.company_name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.pan_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    pan_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">RERA Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.rera_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    rera_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowQuickCpModal(false);
                  setQuickCpForm({
                    name: "",
                    email: "",
                    mobile_number: "",
                    company_name: "",
                    pan_number: "",
                    rera_number: "",
                    partner_tier_id: "",
                  });
                  setQuickCpOtpCode("");
                  setQuickCpEmailVerified(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleQuickCpCreate}
              >
                Create CP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal after creating onsite registration */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ maxWidth: "520px", textAlign: "center" }}
          >
            <h3 className="modal-title">Thank you!</h3>

            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 12 }}>
              Dear <strong>{successLeadName || "Customer"}</strong>,
            </p>
            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
              Thank you so much for taking the time to fill out our registration form and for trusting us with your personal details. We truly appreciate it.

            </p>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              
              Please rest assured that your information is safe with us. We respect your privacy, and you will never receive unnecessary calls or messages from our side — whether or not you decide to purchase a property with us.

            </p>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              Warm Regards,<br></br>
              Team Shree Ram Krushna Developers
            </p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (successLeadId) {
                    navigate(`/leads/${successLeadId}/`);
                  }
                }}
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing lead details modal */}
      {showLookupModal && lookupResult?.present && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "800px" }}>
            <h3 className="modal-title">Existing Lead Details</h3>

            {leadsForPhone.length === 0 ? (
              <div className="onsite-helper">No lead details available.</div>
            ) : (
              leadsForPhone.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    #{lead.id} –{" "}
                    {lead.full_name ||
                      `${lead.first_name || ""} ${lead.last_name || ""}`.trim()}
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Project:</strong> {lead.project} &nbsp;|&nbsp;
                    <strong>Phone:</strong> {lead.mobile_number} &nbsp;|&nbsp;
                    <strong>Email:</strong> {lead.email || "-"}
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Status:</strong> {lead.status_name || "-"}{" "}
                    &nbsp;|&nbsp;
                    <strong>Purpose:</strong> {lead.purpose_name || "-"}
                  </div>

                  {lead.address && (
                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      <strong>Address:</strong>{" "}
                      {[
                        lead.address.flat_or_building,
                        lead.address.area,
                        lead.address.city,
                        lead.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}

                  {lead.last_update ? (
                    <div
                      style={{
                        fontSize: 13,
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        marginTop: 4,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        Last Update ({lead.last_update.type}):
                      </div>
                      <div>{lead.last_update.title || "-"}</div>
                      <div style={{ marginTop: 2 }}>
                        <strong>On:</strong>{" "}
                        {lead.last_update.event_date
                          ? lead.last_update.event_date
                              .slice(0, 16)
                              .replace("T", " ")
                          : "-"}
                        {"  "} | <strong>By:</strong>{" "}
                        {lead.last_update.created_by || "-"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      No updates recorded yet.
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowLookupModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
