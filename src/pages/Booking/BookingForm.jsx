// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import axiosInstance from "../../api/axiosInstance";
// import "./BookingForm.css";
// import projectImage from "../../assets/project.webp";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { toSentenceCase } from "../../utils/text";
// import PaymentLeadCreateModal from "../../components/Payments/PaymentLeadCreateModal";

// const BOOK_API_PREFIX = "/book";

// const DOC_TYPES = [
//   { value: "AGREEMENT_PDF", label: "Agreement PDF" },
//   { value: "BOOKING_FORM_PDF", label: "Booking Form PDF" },
//   { value: "PAYMENT_PROOF", label: "Payment Proof" },
//   { value: "IDENTITY_PROOF", label: "Identity Proof (PAN/Aadhaar)" },
//   { value: "OTHER", label: "Other" },
// ];

// const PAYMENT_MODES = [
//   { value: "CHEQUE", label: "Cheque" },
//   { value: "RTGS", label: "RTGS / NEFT" },
//   { value: "UPI", label: "UPI" },
//   { value: "CASH", label: "Cash" },
//   { value: "OTHER", label: "Other" },
// ];

// // ✅ ADD ALL THESE FUNCTIONS HERE (BEFORE Section component)
// // Validation functions
// const validatePAN = (pan) => {
//   if (!pan) return false;
//   return pan.trim().length === 10;
// };

// const formatDateTime = (value) => {
//   if (!value) return "-";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return value;
//   const day = String(d.getDate()).padStart(2, "0");
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const year = d.getFullYear();
//   const hours = String(d.getHours()).padStart(2, "0");
//   const minutes = String(d.getMinutes()).padStart(2, "0");
//   return `${day}-${month}-${year} ${hours}:${minutes}`;
// };

// const validateAadhar = (aadhar) => {
//   const aadharRegex = /^[0-9]{12}$/;
//   return aadharRegex.test(aadhar.replace(/\s/g, ""));
// };

// const validateEmail = (email) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// const validatePhone = (phone) => {
//   const phoneRegex = /^[0-9]{10}$/;
//   return phoneRegex.test(phone.replace(/[^0-9]/g, ""));
// };

// const getTodayDate = () => {
//   const today = new Date();
//   return today.toISOString().split("T")[0];
// };

// // Convert YYYY-MM-DD to DD/MM/YYYY
// const formatDateDDMMYYYY = (dateString) => {
//   if (!dateString) return "";
//   if (typeof dateString !== "string") {
//     // If it's a Date object, convert to string first
//     if (dateString instanceof Date) {
//       dateString = dateString.toISOString().split("T")[0];
//     } else {
//       return String(dateString);
//     }
//   }

//   // If already in DD/MM/YYYY format, return as is
//   if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
//   // If in DD-MM-YYYY format, convert to DD/MM/YYYY
//   if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
//     return dateString.replace(/-/g, "/");
//   }

//   // If in YYYY-MM-DD format, convert to DD/MM/YYYY
//   if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
//     const [year, month, day] = dateString.split("-");
//     return `${day}/${month}/${year}`;
//   }

//   // Try parsing as Date object
//   try {
//     const date = new Date(dateString);
//     if (!isNaN(date.getTime())) {
//       const day = String(date.getDate()).padStart(2, "0");
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const year = date.getFullYear();
//       return `${day}/${month}/${year}`;
//     }
//   } catch (e) {
//     // Ignore
//   }

//   return dateString;
// };

// // Convert DD-MM-YYYY to YYYY-MM-DD (for HTML date input)
// const formatDateYYYYMMDD = (dateString) => {
//   if (!dateString) return "";
//   if (typeof dateString !== "string") return dateString;

//   // If already in YYYY-MM-DD format, return as is
//   if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

//   // If in DD-MM-YYYY format, convert to YYYY-MM-DD
//   if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
//     const [day, month, year] = dateString.split("-");
//     return `${year}-${month}-${day}`;
//   }

//   // Try parsing as Date object
//   try {
//     const date = new Date(dateString);
//     if (!isNaN(date.getTime())) {
//       const year = date.getFullYear();
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const day = String(date.getDate()).padStart(2, "0");
//       return `${year}-${month}-${day}`;
//     }
//   } catch (e) {
//     // Ignore
//   }

//   return dateString;
// };

// const Section = ({ id, title, open, onToggle, children }) => (
//   <div className="bf-section">
//     <button
//       type="button"
//       className="bf-section-header"
//       onClick={() => onToggle(id)}
//     >
//       <span className="bf-section-title">{title}</span>
//       <span className={`bf-chevron ${open ? "bf-chevron-open" : ""}`}>▾</span>
//     </button>
//     {open && <div className="bf-section-body">{children}</div>}
//   </div>
// );

// const BookingForm = () => {
//   const rootRef = useRef(null);
//   const navigate = useNavigate();
//   // --------- Discount (in Flat Information) ----------
//   const [discountPercent, setDiscountPercent] = useState("");
//   const [discountAmount, setDiscountAmount] = useState("");
//   const [searchParams] = useSearchParams();
//   const leadIdFromUrl =
//     searchParams.get("lead_id") || searchParams.get("lead") || null;
//   const [primaryDob, setPrimaryDob] = useState("");
//   const projectIdFromUrl =
//     searchParams.get("project_id") || searchParams.get("project");
//   const [agreementValue, setAgreementValue] = useState(""); // numeric string
//   const [agreementValueWords, setAgreementValueWords] = useState("");

//   const [interestedUnitError, setInterestedUnitError] = useState("");
//   const [agreementEditable, setAgreementEditable] = useState(true);
//   const [agreementTouched, setAgreementTouched] = useState(false);

//   // Payment Lead Modal
//   const [showPaymentLeadModal, setShowPaymentLeadModal] = useState(false);

//   // Multi-type attachments (Agreement PDF, Booking Form, Payment Proof, Other)
//   const [showPaymentDocModal, setShowPaymentDocModal] = useState(false);
//   const [paymentDocs, setPaymentDocs] = useState([]); // ab ye generic attachments array hai
//   const [newPaymentDoc, setNewPaymentDoc] = useState({
//     label: "",
//     doc_type: "PAYMENT_PROOF", // AGREEMENT_PDF / BOOKING_FORM_PDF / PAYMENT_PROOF / OTHER
//     payment_mode: "UPI", // CHEQUE / RTGS / UPI / CASH / OTHER
//     ref_no: "",
//     bank_name: "",
//     amount: "",
//     date: "",
//     remarks: "",
//     file: null,
//   });

//   const handlePaymentDocFileChange = (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (!file) return;
//     setNewPaymentDoc((prev) => ({ ...prev, file }));
//   };

//   const handleAddPaymentDoc = () => {
//     // Basic validations
//     if (!newPaymentDoc.file) {
//       toast.error("Please upload a file for this attachment.");
//       return;
//     }

//     if (!newPaymentDoc.label.trim()) {
//       toast.error("Please enter a label / title for the attachment.");
//       return;
//     }

//     if (
//       newPaymentDoc.doc_type === "PAYMENT_PROOF" &&
//       (!newPaymentDoc.amount || !newPaymentDoc.payment_mode)
//     ) {
//       toast.error("For Payment Proof, please fill Payment Mode and Amount.");
//       return;
//     }

//     // Push into array
//     setPaymentDocs((prev) => [...prev, newPaymentDoc]);

//     // Reset modal state
//     setNewPaymentDoc({
//       label: "",
//       doc_type: "PAYMENT_PROOF",
//       payment_mode: "UPI",
//       ref_no: "",
//       bank_name: "",
//       amount: "",
//       date: "",
//       remarks: "",
//       file: null,
//     });

//     setShowPaymentDocModal(false);
//   };

//   // ---------- user + lead ----------
//   const [currentUser, setCurrentUser] = useState(null);
//   const [leadId] = useState(leadIdFromUrl);

//   // ---------- PROJECT SELECTION (Channel Partner style) ----------
//   const [scopeProjects, setScopeProjects] = useState([]);
//   const [projectId, setProjectId] = useState(
//     projectIdFromUrl ||
//       localStorage.getItem("ACTIVE_PROJECT_ID") ||
//       localStorage.getItem("PROJECT_ID") ||
//       null
//   );
//   const [projectName, setProjectName] = useState("");

//   // (section/activeItem kept if you later re-enable SalesSubnav)
//   const [section] = useState("pre");
//   const [activeItem] = useState("booking-form");

//   const [openSections, setOpenSections] = useState({
//     applicantNames: true,
//     contactDetails: true,
//     addressProfile: true,
//     additionalApplicants: true,
//     flatInfo: true,
//     taxDetails: true,
//     costSummary: true,
//     taxConfig: false,
//     taxesStatutory: true,
//     paymentSchedule: true,
//     paymentsSummary: true,
//     funding: true,
//     advanceDeposit: true,
//     leadPayments: true,
//     attachments: true, // ✅ NEW
//     applicantSummary: true,
//   });

//   const handleFileChange = (key) => (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (!file) return;
//     setFiles((prev) => ({ ...prev, [key]: file }));
//   };

//   // ✅ ADD THESE 4 NEW FUNCTIONS
//   // PAN validation with toast
//   const handlePrimaryPanChange = (value) => {
//     setPrimaryPanNo(value.toUpperCase());
//     if (value.length === 10 && !validatePAN(value)) {
//       toast.error("PAN must be 10 characters.");
//     }
//   };

//   // Aadhar validation with toast
//   const handlePrimaryAadharChange = (value) => {
//     const cleaned = value.replace(/\s/g, "");
//     setPrimaryAadharNo(cleaned);
//     if (cleaned.length === 12 && !validateAadhar(cleaned)) {
//       toast.error("Invalid Aadhar format. Must be 12 digits.");
//     }
//   };

//   // Email validation
//   const handleEmailChange = (value) => {
//     setEmail1(value);
//     if (value && !validateEmail(value)) {
//       toast.warn("Please enter a valid email address");
//     }
//   };

//   // Phone validation
//   const handlePhoneChange = (value) => {
//     const cleaned = value.replace(/[^0-9]/g, "");
//     setPhone1(cleaned);
//     if (cleaned.length === 10 && !validatePhone(cleaned)) {
//       toast.error("Invalid phone number. Must be 10 digits.");
//     }
//   };

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [project, setProject] = useState(null);
//   const [towers, setTowers] = useState([]);
//   const [paymentPlans, setPaymentPlans] = useState([]);
//   const [leadProfile, setLeadProfile] = useState(null);

//   // ✅ Validate project_id and lead_id on mount
//   useEffect(() => {
//     if (!projectIdFromUrl || !leadIdFromUrl) {
//       toast.error("Cannot Book Flat Without Any Relation To Lead");
//       navigate("/leads");
//       return;
//     }
//   }, [projectIdFromUrl, leadIdFromUrl]);

//   // --------- Top booking info ----------
//   // const [formRefNo, setFormRefNo] = useState("");
//   const [bookingDate, setBookingDate] = useState(getTodayDate()); // ✅ Auto-set today
//   const [office, setOffice] = useState("");
//   //const [status] = useState("DRAFT");
//   const [status, setStatus] = useState("DRAFT");
//   // --------- Primary applicant ----------
//   const [primaryTitle, setPrimaryTitle] = useState("Mr.");
//   const [primaryFullName, setPrimaryFullName] = useState("");
//   const [primaryPanNo, setPrimaryPanNo] = useState("");
//   const [primaryAadharNo, setPrimaryAadharNo] = useState("");

//   // Contact details
//   const [email1, setEmail1] = useState("");
//   const [phone1, setPhone1] = useState("");

//   // --------- Address & profile ----------
//   const [permanentAddress, setPermanentAddress] = useState("");
//   const [correspondenceAddress, setCorrespondenceAddress] = useState("");
//   const [preferredCorrespondence, setPreferredCorrespondence] =
//     useState("PERMANENT");
//   const [residentialStatus, setResidentialStatus] = useState("Owned");

//   // --------- Flat selection state ----------
//   const [selectedTowerId, setSelectedTowerId] = useState("");
//   const [selectedUnitId, setSelectedUnitId] = useState("");

//   const [towerOpen, setTowerOpen] = useState(false);
//   const [unitOpen, setUnitOpen] = useState(false);

//   // --------- Flat info (auto from inventory but editable) ----------
//   const [superBuiltupSqft, setSuperBuiltupSqft] = useState("");
//   const [carpetSqft, setCarpetSqft] = useState("");
//   const [balconySqft, setBalconySqft] = useState("");
//   const [agreementDone, setAgreementDone] = useState(false);

//   const [parkingRequired, setParkingRequired] = useState("NO"); // YES / NO (UI)
//   const [parkingDetails, setParkingDetails] = useState("");
//   const [parkingNumber, setParkingNumber] = useState("");
//   const [parkingCount, setParkingCount] = useState("1");

//   // Parking states
//   //const [parkingRequired, setParkingRequired] = useState("NO");
//   //const [parkingCount, setParkingCount] = useState(""); // user selects 1,2,3...
//   const [parkingAmount, setParkingAmount] = useState("1000000"); // per parking editable
//   const [parkingTotal, setParkingTotal] = useState(""); // total = count * amount

//   // --------- Cost Summary & Offers ----------
//   const [costTemplate, setCostTemplate] = useState(null);
//   const [offers, setOffers] = useState([]);
//   const [selectedOfferId, setSelectedOfferId] = useState("");
//   const [selectedOfferData, setSelectedOfferData] = useState(null);

//   // Company logo and name from template
//   const [companyLogoUrl, setCompanyLogoUrl] = useState("");
//   const [companyName, setCompanyName] = useState("");

//   // Computed cost values
//   const [gstAmount, setGstAmount] = useState(0);
//   const [stampDutyAmount, setStampDutyAmount] = useState(0);
//   const [totalTaxes, setTotalTaxes] = useState(0);
//   const [offerDiscountValue, setOfferDiscountValue] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);
//   const [baseRateDisplay, setBaseRateDisplay] = useState("");
//   const [pricePerParking, setPricePerParking] = useState(0);
//   const [gstNo, setGstNo] = useState("");

//   // --------- KYC gating state ----------
//   const [requiresKyc, setRequiresKyc] = useState("NO"); // "YES" | "NO"
//   const [kycDealAmount, setKycDealAmount] = useState(""); // amount for KYC request
//   const [kycRequestId, setKycRequestId] = useState(null); // backend KYC row id
//   const [kycRequestStatus, setKycRequestStatus] = useState(null); // PENDING / APPROVED / REJECTED

//   const canShowRemoveKyc = requiresKyc === "YES" && !kycRequestId; // jaise hi request send ho jaaye, button gayab
//   const isKycFrozen = !!kycRequestId;

//   const handleRemoveKyc = () => {
//     // Sirf front-end reset; agar backend me koi draft row ban rahi hai
//     // to uske liye alag API call bhi laga sakte ho yaha.
//     setRequiresKyc("NO");
//     setKycDealAmount("");
//     setKycRequestId(null);
//     setKycRequestStatus(null);
//   };

//   // --------- Payment plan ----------
//   const [paymentPlanType, setPaymentPlanType] = useState("MASTER"); // MASTER / CUSTOM
//   const [selectedPaymentPlanId, setSelectedPaymentPlanId] = useState("");
//   const [masterSlabs, setMasterSlabs] = useState([]);
//   const [masterPlanDueDates, setMasterPlanDueDates] = useState({});
//   const [customPlanName, setCustomPlanName] = useState("");

//   // Smart default for master plan dates: copy previous slab date on focus if empty
//   const handleMasterDueDateFocus = (slabId, index) => {
//     setMasterPlanDueDates((prev) => {
//       // If already has a date, don't override
//       if (prev[slabId]) return prev;
//       if (!selectedPaymentPlan || index === 0) return prev;

//       const prevSlab = selectedPaymentPlan.slabs[index - 1];
//       if (!prevSlab) return prev;

//       const prevDate = prev[prevSlab.id];
//       if (!prevDate) return prev;

//       return {
//         ...prev,
//         [slabId]: prevDate,
//       };
//     });
//   };

//   // Smart default for custom plan dates: copy previous row date on focus if empty
//   const handleCustomDueDateFocus = (index) => {
//     setCustomSlabs((prev) => {
//       if (!prev || !prev[index] || prev[index].days) return prev;
//       if (index === 0) return prev;

//       const prevDate = prev[index - 1].days;
//       if (!prevDate) return prev;

//       const next = [...prev];
//       next[index] = { ...next[index], days: prevDate };
//       return next;
//     });
//   };

//   const [customSlabs, setCustomSlabs] = useState([
//     { name: "", percentage: "", days: "", due_date: "", amount: "" },
//   ]);

//   // --------- Additional Charges (dynamic) ----------
//   const [additionalCharges, setAdditionalCharges] = useState([
//     { name: "", type: "FIXED", value: "", amount: 0 }, // FIXED or PERCENTAGE
//   ]);

//   // Tax checkboxes (to enable/disable taxes)
//   const [gstEnabled, setGstEnabled] = useState(true);
//   const [stampDutyEnabled, setStampDutyEnabled] = useState(true);
//   const [registrationEnabled, setRegistrationEnabled] = useState(true);
//   const [legalFeeEnabled, setLegalFeeEnabled] = useState(true);

//   // Computed values for display
//   const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
//   const [amountBeforeTaxes, setAmountBeforeTaxes] = useState(0);

//   // ---------- Lead Payments (from full-info API) ----------
//   const dealBaseAmount = useMemo(() => {
//     // Priority: finalAmount (incl. taxes) -> agreementValue -> lead budget
//     const finalAmt = Number(finalAmount || 0);
//     if (finalAmt > 0) return finalAmt;

//     const agrAmt = Number(agreementValue || 0);
//     if (agrAmt > 0) return agrAmt;

//     const budgetAmt = leadProfile?.budget ? Number(leadProfile.budget) : 0;
//     return budgetAmt || 0;
//   }, [finalAmount, agreementValue, leadProfile]);

//   const leadPaymentsInfo = useMemo(() => {
//     const payments = leadProfile?.payments || [];
//     if (!payments.length) {
//       return {
//         baseAmount: dealBaseAmount,
//         totalPaid: 0,
//         balance: dealBaseAmount,
//         rows: [],
//       };
//     }

//     // sort by date (oldest → newest)
//     const sorted = [...payments].sort((a, b) => {
//       const da = a.payment_date ? new Date(a.payment_date) : 0;
//       const db = b.payment_date ? new Date(b.payment_date) : 0;
//       return da - db;
//     });

//     let running = dealBaseAmount || 0;
//     let totalPaid = 0;

//     const rows = sorted.map((p) => {
//       const amt = Number(p.amount || 0);
//       totalPaid += amt;

//       if (dealBaseAmount) {
//         running -= amt; // 👈 yahi "minus from last" hai
//       }

//       return {
//         ...p,
//         running_balance: dealBaseAmount ? running : null,
//       };
//     });

//     const balance = dealBaseAmount
//       ? Math.max(dealBaseAmount - totalPaid, 0)
//       : 0;

//     return {
//       baseAmount: dealBaseAmount,
//       totalPaid,
//       balance,
//       rows,
//     };
//   }, [leadProfile, dealBaseAmount]);

//   // ---------- Calculate additional charges total ----------
//   useEffect(() => {
//     const total = additionalCharges.reduce((sum, charge) => {
//       return sum + (Number(charge.amount) || 0);
//     }, 0);
//     setAdditionalChargesTotal(total);
//   }, [additionalCharges]);

//   // Auto calculate agreement value from base rate × (carpet + balcony if entered)
//   useEffect(() => {
//     if (agreementTouched) return; // user manual mode

//     const rate = Number(baseRateDisplay) || 0;
//     const carpet = Number(carpetSqft) || 0;
//     const balcony = Number(balconySqft) || 0;

//     if (!rate || !carpet) {
//       setAgreementValue("");
//       return;
//     }

//     // Use carpet + balcony if balcony is entered, otherwise just carpet
//     const area = balcony > 0 ? carpet + balcony : carpet;
//     const total = Math.round(rate * area);
//     setAgreementValue(String(total));
//   }, [baseRateDisplay, carpetSqft, balconySqft, agreementTouched]);
//   // When project or parkingCount changes → load backend amount
//   useEffect(() => {
//     if (parkingRequired !== "YES") return;
//     if (!project?.price_per_parking) return;
//     if (!parkingCount) return;

//     // backend amount default
//     const backendPrice = Number(project.price_per_parking);

//     // Set price only if user has not edited
//     if (!parkingAmount) {
//       setParkingAmount(String(backendPrice));
//     }
//   }, [project, parkingRequired, parkingCount]);

//   useEffect(() => {
//     if (parkingRequired !== "YES") return;

//     const amt = Number(parkingAmount) || 0;
//     const count = Number(parkingCount) || 0;

//     setParkingTotal(String(amt * count));
//   }, [parkingAmount, parkingCount, parkingRequired]);

//   // Function to refresh lead profile (to update payments after creation)
//   const refreshLeadProfile = async () => {
//     if (!leadId) return;
//     try {
//       const res = await axiosInstance.get(
//         `/sales/sales-leads/${leadId}/full-info/`
//       );
//       const data = res.data || {};
//       setLeadProfile(data);
//     } catch (err) {
//       console.error("Failed to refresh lead profile", err);
//     }
//   };

//   useEffect(() => {
//     if (!leadId) return;

//     const fetchLeadProfile = async () => {
//       try {
//         const res = await axiosInstance.get(
//           `/sales/sales-leads/${leadId}/full-info/`
//         );
//         const data = res.data || {};

//         // 🔒 IMPORTANT: validate URL project_id with lead.project
//         if (projectIdFromUrl && data.project) {
//           const urlPid = Number(projectIdFromUrl);
//           const leadPid = Number(data.project);

//           if (urlPid !== leadPid) {
//             toast.error("Cannot Book Flat Without Any Relation To Lead");
//             navigate("/leads");
//             return; // stop here
//           }
//         }

//         setLeadProfile(data);

//         // ---- Primary name ----
//         const fullName =
//           data.full_name ||
//           `${data.first_name || ""} ${data.last_name || ""}`.trim();
//         if (fullName) {
//           setPrimaryFullName(fullName);
//         }

//         // ---- Contact ----
//         if (data.email) setEmail1(data.email);
//         if (data.mobile_number) setPhone1(data.mobile_number);

//         // ---- Primary DOB ----
//         if (data.personal_info?.date_of_birth) {
//           setPrimaryDob(data.personal_info.date_of_birth);
//         }

//         // ---- Address ----
//         if (data.address) {
//           const addr = data.address;
//           const parts = [
//             addr.flat_or_building,
//             addr.area,
//             addr.city,
//             addr.state,
//             addr.country,
//             addr.pincode,
//           ].filter(Boolean);

//           if (parts.length) {
//             const fullAddr = parts.join(", ");
//             setPermanentAddress((prev) => prev || fullAddr);
//             setCorrespondenceAddress((prev) => prev || fullAddr);
//           }
//         }

//         // ---- Office info → office field ----
//         if (data.professional_info) {
//           const p = data.professional_info;

//           const locationPart =
//             p.office_location && p.office_pincode
//               ? `${p.office_location} - ${p.office_pincode}`
//               : p.office_location || p.office_pincode;

//           const officeParts = [
//             p.occupation_name,
//             p.organization_name,
//             locationPart,
//           ].filter(Boolean);

//           const officeText = officeParts.join(", ");
//           if (officeText) {
//             setOffice((prev) => prev || officeText);
//           }
//         }

//         // ---- Project from lead (if you still want to sync local state) ----
//         if (data.project) {
//           const pid = data.project;
//           setProjectId(pid);
//           localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
//           localStorage.setItem("PROJECT_ID", String(pid));
//         }
//       } catch (err) {
//         console.error("Failed to load lead full-info", err);

//         // 🔒 If lead not found / inaccessible → treat as "no relation"
//         const status = err?.response?.status;
//         if (status === 404 || status === 403) {
//           toast.error("Cannot Book Flat Without Any Relation To Lead");
//           navigate("/leads");
//         }
//       }
//     };

//     fetchLeadProfile();
//   }, [leadId, projectIdFromUrl, navigate]);

//   // ---------- Autofill tower/unit from lead's interested units ----------
//   useEffect(() => {
//     if (
//       !leadProfile ||
//       !leadProfile.interested_unit_links ||
//       leadProfile.interested_unit_links.length === 0 ||
//       !towers.length
//     ) {
//       setInterestedUnitError("");
//       return;
//     }

//     // pick primary interested unit if flagged, else first
//     const primaryLink =
//       leadProfile.interested_unit_links.find((l) => l.is_primary) ||
//       leadProfile.interested_unit_links[0];

//     if (!primaryLink) {
//       setInterestedUnitError("");
//       return;
//     }

//     const unitId = String(primaryLink.unit);
//     let foundTowerId = null;
//     let selectedUnitFromLead = null;

//     towers.forEach((tower) => {
//       (tower.floors || []).forEach((floor) => {
//         (floor.units || []).forEach((unit) => {
//           if (String(unit.id) === unitId) {
//             foundTowerId = String(tower.id);
//             selectedUnitFromLead = unit;
//           }
//         });
//       });
//     });

//     if (foundTowerId && selectedUnitFromLead) {
//       setSelectedTowerId(foundTowerId);
//       setSelectedUnitId(unitId);

//       const inv = selectedUnitFromLead.inventory || {};
//       const unitStatus = selectedUnitFromLead.status;
//       const invUnitStatus = inv.unit_status;
//       const availabilityStatus = inv.availability_status;

//       const isAvailable =
//         unitStatus === "AVAILABLE" &&
//         invUnitStatus === "AVAILABLE" &&
//         availabilityStatus === "AVAILABLE";

//       if (!isAvailable) {
//         setInterestedUnitError(
//           `Lead ka interested unit ${selectedUnitFromLead.unit_no} available nahi hai. Please select another unit.`
//         );
//         setUnitOpen(true); // dropdown khul jaayega
//       } else {
//         setInterestedUnitError("");
//       }
//     } else {
//       setInterestedUnitError("");
//     }
//   }, [leadProfile, towers]);

//   // ---------- Calculate amount before taxes ----------
//   useEffect(() => {
//     const baseValue = Number(agreementValue) || 0;
//     const additionalTotal = Number(additionalChargesTotal) || 0;

//     // Include parking in pre-tax amount so totals respond to parking changes
//     const parkingTotalNumber =
//       parkingRequired === "YES" ? Number(parkingTotal) || 0 : 0;

//     setAmountBeforeTaxes(baseValue + additionalTotal + parkingTotalNumber);
//   }, [agreementValue, additionalChargesTotal, parkingTotal, parkingRequired]);

//   // ---------- Calculate taxes based on amount before taxes ----------
//   useEffect(() => {
//     if (!costTemplate) {
//       setGstAmount(0);
//       setStampDutyAmount(0);
//       setTotalTaxes(0);
//       return;
//     }

//     // Base for GST and Stamp Duty: unit cost + additional charges + parking total
//     const unitCost = Number(agreementValue || 0);
//     const additionalTotal = Number(additionalChargesTotal) || 0;
//     const parkingTotalNumber = parkingRequired === "YES" ? Number(parkingTotal) || 0 : 0;
//     const baseForTaxes = unitCost + additionalTotal + parkingTotalNumber;

//     const gstPercent = Number(costTemplate.gst_percent) || 0;
//     const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
//     const regAmount = Number(costTemplate.registration_amount) || 0;
//     const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

//     const calcGst = gstEnabled ? (baseForTaxes * gstPercent) / 100 : 0;
//     const calcStamp = stampDutyEnabled ? (baseForTaxes * stampPercent) / 100 : 0;
//     const calcReg = registrationEnabled ? regAmount : 0;
//     const calcLegal = legalFeeEnabled ? legalAmount : 0;

//     const calcTotal = calcGst + calcStamp + calcReg + calcLegal;

//     setGstAmount(calcGst);
//     setStampDutyAmount(calcStamp);
//     setTotalTaxes(calcTotal);
//   }, [
//     agreementValue,
//     additionalChargesTotal,
//     parkingTotal,
//     parkingRequired,
//     costTemplate,
//     gstEnabled,
//     stampDutyEnabled,
//     registrationEnabled,
//     legalFeeEnabled,
//   ]);

//   // ---------- Calculate offer discount and final amount ----------
//   useEffect(() => {
//     const beforeDiscount = Number(amountBeforeTaxes) || 0;
//     const taxes = Number(totalTaxes) || 0;
//     const totalWithTaxes = beforeDiscount + taxes;

//     let discount = 0;

//     if (selectedOfferData) {
//       if (selectedOfferData.percentage) {
//         discount =
//           (totalWithTaxes * Number(selectedOfferData.percentage)) / 100;
//       } else if (selectedOfferData.amount) {
//         discount = Number(selectedOfferData.amount);
//       }
//     }

//     setOfferDiscountValue(discount);
//     setFinalAmount(totalWithTaxes - discount);
//   }, [amountBeforeTaxes, totalTaxes, selectedOfferData]);

//   // ---------- Calculate additional charge amounts based on type ----------
//   useEffect(() => {
//     const baseValue = Number(agreementValue) || 0;

//     setAdditionalCharges((prev) =>
//       prev.map((charge) => {
//         if (!charge.value) return { ...charge, amount: 0 };

//         if (charge.type === "PERCENTAGE") {
//           const amount = (baseValue * Number(charge.value)) / 100;
//           return { ...charge, amount };
//         } else {
//           // FIXED
//           return { ...charge, amount: Number(charge.value) || 0 };
//         }
//       })
//     );
//   }, [agreementValue]);
//   // --------- Funding / advance ----------
//   const [loanRequired, setLoanRequired] = useState("NO"); // YES / NO
//   const [bookingAmount, setBookingAmount] = useState("");
//   const [otherCharges, setOtherCharges] = useState("");
//   const [projectPricePerSqft, setProjectPricePerSqft] = useState("");

//   // Top photo
//   const [photoFile, setPhotoFile] = useState(null);

//   // --------- Additional applicants (dynamic, UI-only for now) ----------
//   const [additionalApplicants, setAdditionalApplicants] = useState([
//     { full_name: "", relation: "", dob: "", aadhar: "", pan: "" },
//   ]);

//   // --------- All upload files ----------
//   const [files, setFiles] = useState({
//     primaryPanFront: null,
//     primaryPanBack: null,
//     primaryAadharFront: null,
//     primaryAadharBack: null,

//     secondAadharFront: null,
//     secondAadharBack: null,
//     secondPanFront: null,
//     secondPanBack: null,

//     thirdAadharFront: null,
//     thirdAadharBack: null,
//     thirdPanFront: null,
//     thirdPanBack: null,

//     fourthAadharFront: null,
//     fourthAadharBack: null,
//     fourthPanFront: null,
//     fourthPanBack: null,

//     kycPan: null,
//     kycAadhar: null,
//   });

//   // const handleFileChange = (key) => (e) => {
//   //   const file = e.target.files && e.target.files[0];
//   //   if (!file) return;
//   //   setFiles((prev) => ({ ...prev, [key]: file }));
//   // };

//   const totalAdvanceNumber =
//     Number(bookingAmount || 0) + Number(otherCharges || 0);
//   const totalAdvance = totalAdvanceNumber || "";

//   const toggleSection = (key) => {
//     setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   // ---------- Load MY_SCOPE projects (localStorage + API fallback) ----------
//   useEffect(() => {
//     let projectsFromLS = [];
//     try {
//       const raw = localStorage.getItem("MY_SCOPE");
//       if (raw) {
//         const parsed = JSON.parse(raw);
//         projectsFromLS = parsed.projects || [];
//         setScopeProjects(projectsFromLS);
//       }
//     } catch (err) {
//       console.error("Failed to parse MY_SCOPE from localStorage", err);
//     }

//     // Fallback: direct API if MY_SCOPE empty
//     if (projectsFromLS.length === 0) {
//       (async () => {
//         try {
//           const res = await axiosInstance.get("/client/my-scope/");
//           const data = res.data || {};
//           const projs = data.projects || [];
//           setScopeProjects(projs);
//           try {
//             localStorage.setItem("MY_SCOPE", JSON.stringify(data));
//           } catch {}
//         } catch (err) {
//           console.error("Failed to load projects from my-scope", err);
//         }
//       })();
//     }
//   }, []);

//   // ---------- When URL / scopeProjects / projectId change → set selected project ----------
//   useEffect(() => {
//     const idParam = searchParams.get("project_id");

//     if (idParam) {
//       const pid = Number(idParam);
//       setProjectId(pid);

//       localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
//       localStorage.setItem("PROJECT_ID", String(pid));

//       const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
//       const displayName = proj
//         ? proj.name || `Project #${proj.id}`
//         : `Project #${pid}`;
//       setProjectName(displayName);
//     } else if (projectId) {
//       const pid = Number(projectId);
//       const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
//       const displayName = proj
//         ? proj.name || `Project #${proj.id}`
//         : `Project #${pid}`;
//       setProjectName(displayName);
//     }
//   }, [searchParams, scopeProjects, projectId]);

//   // ---------- Read user from localStorage ----------
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("user");
//       if (raw) {
//         const parsed = JSON.parse(raw);
//         setCurrentUser(parsed);
//       }
//     } catch (e) {
//       console.error("Failed to parse user from localStorage", e);
//     }
//   }, []);

//   const currentProjectLabel =
//     projectName || (projectId ? `Project #${projectId}` : "Select a project");

//   const handleProjectCardSelect = (proj) => {
//     const pid = Number(proj.id);
//     setProjectId(pid);
//     const displayName = proj.name || `Project #${proj.id}`;
//     setProjectName(displayName);

//     localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
//     localStorage.setItem("PROJECT_ID", String(pid));
//   };

//   // ---------- Fetch booking-setup data whenever projectId changes ----------
//   useEffect(() => {
//     if (!projectId) {
//       setProject(null);
//       setTowers([]);
//       setPaymentPlans([]);
//       setLoading(false);
//       return;
//     }

//     const fetchSetup = async () => {
//       try {
//         setLoading(true);
//         setError("");
//         const res = await axiosInstance.get("/client/booking-setup/", {
//           params: { project_id: projectId },
//         });
//         setProject(res.data.project || null);
//         if (res.data.project?.price_per_parking) {
//           setPricePerParking(Number(res.data.project.price_per_parking) || 0);
//         }
//         setTowers(res.data.towers || []);
//         setPaymentPlans(res.data.payment_plans || []);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load booking setup. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSetup();
//   }, [projectId]);

//   // ---------- Close dropdowns on outside click ----------
//   useEffect(() => {
//     const handler = (e) => {
//       if (!rootRef.current) return;
//       if (!rootRef.current.contains(e.target)) {
//         setTowerOpen(false);
//         setUnitOpen(false);
//       }
//     };
//     document.addEventListener("click", handler);
//     return () => document.removeEventListener("click", handler);
//   }, []);

//   // ---------- Derived tower + unit ----------
//   const selectedTower = towers.find(
//     (t) => String(t.id) === String(selectedTowerId)
//   );

//   const towerUnits = useMemo(() => {
//     if (!selectedTower) return [];
//     const units = [];
//     (selectedTower.floors || []).forEach((floor) => {
//       (floor.units || []).forEach((u) => {
//         units.push({
//           ...u,
//           floor_number: floor.number,
//         });
//       });
//     });
//     return units;
//   }, [selectedTower]);

//   const selectedUnit = towerUnits.find(
//     (u) => String(u.id) === String(selectedUnitId)
//   );

//   // ---------- Fetch cost template & offers when leadId is available ----------
//   useEffect(() => {
//     if (!leadId) {
//       setCostTemplate(null);
//       setOffers([]);
//       return;
//     }

//     const fetchCostData = async () => {
//       try {
//         const res = await axiosInstance.get(`/costsheet/lead/${leadId}/init/`);
//         const data = res.data || {};

//         // Store template data
//         const template = data.template || {};
//         setCompanyLogoUrl(template.company_logo_url || "");
//         setCompanyName(template.company_name || "");
//         setCostTemplate({
//           gst_percent: template.gst_percent || 0,
//           stamp_duty_percent: template.stamp_duty_percent || 0,
//           registration_amount: template.registration_amount || 0,
//           legal_fee_amount: template.legal_fee_amount || 0,
//           share_application_money_membership_fees:
//             Number(template.share_application_money_membership_fees) || 0,
//           development_charges_psf:
//             Number(template.development_charges_psf) || 0,
//           electrical_watern_n_all_charges:
//             Number(template.electrical_watern_n_all_charges) || 0,
//           provisional_maintenance_psf:
//             Number(template.provisional_maintenance_psf) || 0,
//           terms_and_conditions: template.terms_and_conditions || "",
//           provisional_maintenance_months:
//             template.provisional_maintenance_months || "",
//         });

//         // Store company logo and name
//         setCompanyLogoUrl(template.company_logo_url || "");
//         setCompanyName(template.company_name || "");

//         // Store offers
//         setOffers(data.offers || []);

//         if (data.project) {
//           if (data.project.price_per_sqft) {
//             setBaseRateDisplay(String(data.project.price_per_sqft)); // shows 51,599 on mount
//           }
//           if (data.project.price_per_parking) {
//             setPricePerParking(Number(data.project.price_per_parking) || 0);
//           }
//         }
//         // Optional: Update payment plans if different from project-level
//         if (data.payment_plans && data.payment_plans.length > 0) {
//           setPaymentPlans(data.payment_plans);
//         }
//       } catch (err) {
//         console.error("Failed to fetch cost template & offers:", err);
//         // Don't block form if this fails
//       }
//     };

//     fetchCostData();
//   }, [leadId]);

//   // ---------- KYC status refresh ----------
//   const handleRefreshKycStatus = async () => {
//     if (!kycRequestId) {
//       alert("No KYC request found. Please send KYC request first.");
//       return;
//     }

//     try {
//       const res = await axiosInstance.get(
//         `${BOOK_API_PREFIX}/kyc-requests/${kycRequestId}/`
//       );
//       const data = res.data || {};

//       setKycRequestStatus(data.status || "PENDING");

//       if (data.status === "APPROVED") {
//         alert("KYC has been APPROVED. You can proceed with booking.");
//       } else if (data.status === "REJECTED") {
//         alert("KYC has been REJECTED. Please review with admin.");
//       } else {
//         // PENDING
//         alert("KYC is still pending with admin.");
//       }
//     } catch (err) {
//       console.error("Failed to refresh KYC status", err);
//       if (err?.response?.data) {
//         alert(
//           "Failed to refresh KYC status.\n" +
//             JSON.stringify(err.response.data, null, 2)
//         );
//       } else {
//         alert("Failed to refresh KYC status. Please try again.");
//       }
//     }
//   };

//   const handleAdditionalApplicantChange = (index, field, value) => {
//     setAdditionalApplicants((prev) =>
//       prev.map((app, i) => (i === index ? { ...app, [field]: value } : app))
//     );
//   };

//   const handleAddAdditionalApplicant = () => {
//     setAdditionalApplicants((prev) => [
//       ...prev,
//       { full_name: "", relation: "", dob: "", aadhar: "", pan: "" }, // ✅ Include all fields
//     ]);
//   };

//   const handleAddAdditionalCharge = () => {
//     setAdditionalCharges((prev) => [
//       ...prev,
//       { name: "", type: "FIXED", value: "", amount: 0 },
//     ]);
//   };

//   const handleUpdateAdditionalCharge = (index, field, value) => {
//     setAdditionalCharges((prev) =>
//       prev.map((charge, idx) => {
//         if (idx !== index) return charge;

//         const updated = { ...charge, [field]: value };

//         // Recalculate amount when value or type changes
//         if (field === "value" || field === "type") {
//           const baseValue = Number(agreementValue) || 0;
//           const chargeValue = field === "value" ? value : charge.value;
//           const chargeType = field === "type" ? value : charge.type;

//           if (chargeType === "PERCENTAGE") {
//             updated.amount = (baseValue * Number(chargeValue || 0)) / 100;
//           } else {
//             updated.amount = Number(chargeValue || 0);
//           }
//         }

//         return updated;
//       })
//     );
//   };

//   const handleRemoveAdditionalCharge = (index) => {
//     if (additionalCharges.length === 1) return;
//     setAdditionalCharges((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   // ---------- KYC request create ----------
//   const handleSendKycRequest = async () => {
//     if (!selectedUnitId) {
//       toast.error("Please select a unit before sending KYC request.");
//       return;
//     }
//     if (!project?.id) {
//       toast.error("Project is missing – cannot create KYC request.");
//       return;
//     }
//     if (!kycDealAmount || Number(kycDealAmount) <= 0) {
//       toast.error("Please enter a valid deal amount for KYC.");
//       return;
//     }

//     try {
//       // backend expects: { project_id, unit_id, amount }
//       const payload = {
//         project_id: project.id,
//         unit_id: selectedUnitId,
//         amount: Number(kycDealAmount),
//       };

//       const res = await axiosInstance.post(
//         `${BOOK_API_PREFIX}/kyc-requests/`,
//         payload
//       );
//       const data = res.data || {};

//       setKycRequestId(data.id);
//       setKycRequestStatus(data.status || "PENDING");

//       alert("KYC request sent to project admin.");
//     } catch (err) {
//       console.error("Failed to create KYC request", err);
//       if (err?.response?.data) {
//         alert(
//           "Failed to send KYC request.\n" +
//             JSON.stringify(err.response.data, null, 2)
//         );
//       } else {
//         alert("Failed to send KYC request. Please try again.");
//       }
//     }
//   };

//   // ---------- Calculate costs whenever agreementValue or template changes ----------
//   // useEffect(() => {
//   //   if (!agreementValue || !costTemplate) {
//   //     setGstAmount(0);
//   //     setStampDutyAmount(0);
//   //     setTotalTaxes(0);
//   //     return;
//   //   }

//   //   const baseValue = Number(agreementValue) || 0;
//   //   const gstPercent = Number(costTemplate.gst_percent) || 0;
//   //   const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
//   //   const regAmount = Number(costTemplate.registration_amount) || 0;
//   //   const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

//   //   const calcGst = (baseValue * gstPercent) / 100;
//   //   const calcStamp = (baseValue * stampPercent) / 100;
//   //   const calcTotal = calcGst + calcStamp + regAmount + legalAmount;

//   //   setGstAmount(calcGst);
//   //   setStampDutyAmount(calcStamp);
//   //   setTotalTaxes(calcTotal);
//   // }, [agreementValue, costTemplate]);

//   // ---------- Calculate offer discount and final amount ----------
//   useEffect(() => {
//     const baseValue = Number(agreementValue) || 0;
//     const taxes = Number(totalTaxes) || 0;
//     const amountBeforeDiscount = baseValue + taxes;

//     let discount = 0;

//     if (selectedOfferData) {
//       if (selectedOfferData.percentage) {
//         // Percentage-based discount
//         discount =
//           (amountBeforeDiscount * Number(selectedOfferData.percentage)) / 100;
//       } else if (selectedOfferData.amount) {
//         // Flat amount discount
//         discount = Number(selectedOfferData.amount);
//       }
//     }

//     setOfferDiscountValue(discount);
//     setFinalAmount(amountBeforeDiscount - discount);
//   }, [agreementValue, totalTaxes, selectedOfferData]);

//   // ---------- Update selected offer data when offer changes ----------
//   useEffect(() => {
//     if (!selectedOfferId) {
//       setSelectedOfferData(null);
//       return;
//     }
//     const offer = offers.find((o) => String(o.id) === String(selectedOfferId));
//     setSelectedOfferData(offer || null);
//   }, [selectedOfferId, offers]);

//   // Amount helpers
//   const stripAmount = (value) => {
//     if (!value) return "";
//     // Sirf digits + ek dot allow
//     return value.replace(/[^\d.]/g, "");
//   };

//   const formatINR = (value) => {
//     if (value === null || value === undefined || value === "") return "";
//     const num = Number(String(value));
//     if (Number.isNaN(num)) return "";
//     return num.toLocaleString("en-IN", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     });
//   };

//   // // Auto-fill KYC deal amount from agreement value if empty
//   // useEffect(() => {
//   //   if (!kycDealAmount && agreementValue) {
//   //     setKycDealAmount(agreementValue);
//   //   }
//   // }, [agreementValue, kycDealAmount]);

//   // When unit changes → auto-fill areas + base agreement value from inventory
//   // Agreement value auto-suggestion from inventory, but always editable
//   // BookingForm.jsx

//   // ... (Your existing code to derive selectedUnit)

//   // ---------- THE FIX: Unit Data Autofill useEffect ----------
//   useEffect(() => {
//     // 1. Exit if no unit is selected
//     if (!selectedUnit) {
//       // Clear relevant fields if no unit is selected
//       setCarpetSqft("");
//       setSuperBuiltupSqft("");
//       setBalconySqft("");
//       setBaseRateDisplay("");
//       setAgreementTouched(false); // Reset to allow auto-calculation when a unit IS picked
//       // You may also clear other related fields here (e.g., parking)
//       return;
//     }

//     const inventory = selectedUnit.inventory || {};

//     // 2. Load Unit Area Data into state
//     // This update triggers your existing Agreement Value calculation useEffect
//     setCarpetSqft(
//       String(inventory.carpet_area || inventory.rera_area_sqft || "")
//     );
//     setSuperBuiltupSqft(String(inventory.super_builtup_area || ""));
//     setBalconySqft(
//       String(
//         inventory.balcony_area ||
//           inventory.balcony_area_sqft ||
//           inventory.balcony_sqft ||
//           ""
//       )
//     );

//     // 3. Load Base Rate Data into state
//     // Use price_per_sqft first, or fallback to inventory-level rates
//     const rateToDisplay =
//       inventory.price_per_sqft ||
//       inventory.rate_psf ||
//       inventory.base_price_psf;

//     if (rateToDisplay) {
//       setBaseRateDisplay(String(rateToDisplay));
//       // Set agreementTouched to false so the agreement value calculation runs
//       setAgreementTouched(false);
//     } else {
//       setBaseRateDisplay("");
//     }

//     // 4. (Optional) Load Parking Details
//     // setParkingRequired(inventory.has_parking ? "YES" : "NO");
//     // setParkingCount(String(inventory.parking_count || "1"));
//     // setParkingDetails(inventory.parking_details || "");
//   }, [selectedUnit]); // Dependency on selectedUnit ensures this runs when a unit is picked

//   // Auto-generate agreement value in words
//   useEffect(() => {
//     if (agreementValue) {
//       const words = numberToWords(Math.floor(Number(agreementValue)));
//       setAgreementValueWords(words);
//     } else {
//       setAgreementValueWords("");
//     }
//   }, [agreementValue]);

//   // ✅ Carpet / Super Built-up change hone par Agreement Value auto-calc (editable till user touches)
//   useEffect(() => {
//     if (!selectedUnit) return;

//     const inv = selectedUnit.inventory || {};
//     const ratePsf = inv.rate_psf || inv.base_price_psf;

//     if (!ratePsf) return; // per sq.ft hi nahi mila
//     if (!agreementEditable) return; // inventory direct amount mode
//     if (agreementTouched) return; // user ne manually Agreement Value change kar diya

//     // Ab carpet ya super built-up dono me se jo diya ho use as area
//     // If balcony is entered, add it to the area
//     const baseArea = Number(carpetSqft || superBuiltupSqft || 0);
//     const balcony = Number(balconySqft || 0);
//     const area = balcony > 0 ? baseArea + balcony : baseArea;
//     if (!area) return;

//     const baseAmount = Number(ratePsf) * area;
//     const discount = Number(discountAmount) || 0;
//     const finalAmount = baseAmount - discount;

//     setAgreementValue(String(Math.round(finalAmount)));
//     setAgreementValueWords(numberToWords(Math.floor(finalAmount)));
//   }, [
//     carpetSqft,
//     superBuiltupSqft,
//     balconySqft,
//     discountAmount,
//     selectedUnit,
//     agreementEditable,
//     agreementTouched,
//   ]);

//   // Calculate discount amount from percentage or vice versa
//   // ✅ Discount (%) <-> Amount sync + sahi base se calculation
//   useEffect(() => {
//     if (!selectedUnit) return;

//     const inv = selectedUnit.inventory || {};

//     // 1) Pehle direct agreement / total cost dekho
//     let basePrice = Number(
//       inv.total_cost || inv.agreement_value || selectedUnit.agreement_value || 0
//     );

//     // 2) Agar direct amount nahi hai, to rate_per_sqft * area se nikalo
//     const ratePsf = inv.rate_psf || inv.base_price_psf || null;
//     const area = Number(
//       carpetSqft ||
//         superBuiltupSqft ||
//         inv.saleable_sqft ||
//         inv.builtup_sqft ||
//         inv.rera_area_sqft ||
//         0
//     );

//     if (!basePrice && ratePsf && area) {
//       basePrice = Number(ratePsf) * area;
//     }

//     // 3) Last fallback: current agreementValue ko base maan lo
//     if (!basePrice) {
//       basePrice = Number(agreementValue) || 0;
//     }

//     if (!basePrice) return; // kuch bhi base nahi mila

//     if (discountPercent && !discountAmount) {
//       // % diya hai → amount nikaalo
//       const calculatedAmount = (basePrice * Number(discountPercent)) / 100;
//       setDiscountAmount(calculatedAmount.toFixed(2));
//     } else if (discountAmount && !discountPercent) {
//       // amount diya hai → % nikaalo
//       const calculatedPercent = (Number(discountAmount) / basePrice) * 100;
//       setDiscountPercent(calculatedPercent.toFixed(2));
//     }
//   }, [
//     discountPercent,
//     discountAmount,
//     selectedUnit,
//     carpetSqft,
//     superBuiltupSqft,
//     agreementValue,
//   ]);

//   // ---------- Payment plan helpers ----------
//   const selectedPaymentPlan = paymentPlans.find(
//     (p) => String(p.id) === String(selectedPaymentPlanId)
//   );
//   // total percentage for master plan
//   const masterTotalPercentage = useMemo(
//     () => masterSlabs.reduce((sum, s) => sum + Number(s.percentage || 0), 0),
//     [masterSlabs]
//   );

//   // plan selection → MASTER or CUSTOM
//   const handlePaymentPlanChange = (e) => {
//     const value = e.target.value;

//     if (value === "__CUSTOM__") {
//       setPaymentPlanType("CUSTOM");
//       setSelectedPaymentPlanId("");
//       setMasterSlabs([]);
//     } else {
//       setPaymentPlanType("MASTER");
//       setSelectedPaymentPlanId(value);
//     }
//   };

//   const handleMasterSlabChange = (index, field, value) => {
//     setMasterSlabs((prev) => {
//       const next = [...prev];
//       const slab = { ...next[index] };

//       if (field === "name") {
//         slab.name = value;
//       }

//       if (field === "percentage") {
//         // ✅ Integer only - no decimals, no leading zeros
//         const cleaned = value.replace(/[^\d]/g, ""); // Remove non-digits
//         const p = cleaned ? Math.floor(Number(cleaned)) : 0;
//         slab.percentage = p;
//         // ✅ auto-recalculate amount from %
//         slab.amount =
//           paymentPlanBaseAmount > 0 ? (paymentPlanBaseAmount * p) / 100 : 0;
//       }

//       if (field === "amount") {
//         const a = Number(value) || 0;
//         slab.amount = a;
//         // ✅ auto-recalculate % from amount (integer only)
//         slab.percentage =
//           paymentPlanBaseAmount > 0 && a > 0
//             ? Math.floor((a / paymentPlanBaseAmount) * 100)
//             : slab.percentage;
//       }

//       if (field === "due_date") {
//         slab.due_date = value;
//       }

//       if (field === "days") {
//         slab.days = value;
//       }

//       next[index] = slab;
//       return next;
//     });
//   };

//   // ---- EXISTING CUSTOM LOGIC (keep as is) ----
//   const handleAddCustomSlab = () => {
//     setCustomSlabs((prev) => [...prev, { name: "", percentage: "", days: "" }]);
//   };

//   const handleUpdateCustomSlab = (index, field, value) => {
//     setCustomSlabs((prev) =>
//       prev.map((row, idx) => {
//         if (idx !== index) return row;
//         const updated = { ...row };

//         if (field === "percentage") {
//           // ✅ Integer only - no decimals, no leading zeros
//           const cleaned = value.replace(/[^\d]/g, ""); // Remove non-digits
//           updated[field] = cleaned ? Math.floor(Number(cleaned)) : "";
//         } else {
//           updated[field] = value;
//         }

//         return updated;
//       })
//     );
//   };

//   const handleRemoveCustomSlab = (index) => {
//     setCustomSlabs((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   const customTotalPercentage = customSlabs.reduce(
//     (sum, row) => sum + Number(row.percentage || 0),
//     0
//   );

//   // Helper function to convert number to words (Indian format)
//   const numberToWords = (num) => {
//     if (!num || num === 0) return "Zero Rupees Only";

//     const ones = [
//       "",
//       "One",
//       "Two",
//       "Three",
//       "Four",
//       "Five",
//       "Six",
//       "Seven",
//       "Eight",
//       "Nine",
//     ];
//     const tens = [
//       "",
//       "",
//       "Twenty",
//       "Thirty",
//       "Forty",
//       "Fifty",
//       "Sixty",
//       "Seventy",
//       "Eighty",
//       "Ninety",
//     ];

//     const teens = [
//       "Ten",
//       "Eleven",
//       "Twelve",
//       "Thirteen",
//       "Fourteen",
//       "Fifteen",
//       "Sixteen",
//       "Seventeen",
//       "Eighteen",
//       "Nineteen",
//     ];

//     const convertLessThanThousand = (n) => {
//       if (n === 0) return "";
//       if (n < 10) return ones[n];
//       if (n < 20) return teens[n - 10];
//       if (n < 100)
//         return (
//           tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
//         );
//       return (
//         ones[Math.floor(n / 100)] +
//         " Hundred" +
//         (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
//       );
//     };

//     const crore = Math.floor(num / 10000000);
//     const lakh = Math.floor((num % 10000000) / 100000);
//     const thousand = Math.floor((num % 100000) / 1000);
//     const remainder = num % 1000;

//     let result = "";
//     if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
//     if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
//     if (thousand > 0)
//       result += convertLessThanThousand(thousand) + " Thousand ";
//     if (remainder > 0) result += convertLessThanThousand(remainder);

//     return result.trim() + " Rupees Only";
//   };

//   // ✅ ADD THIS ENTIRE BLOCK
//   // Calculate all applicants (including primary)
//   const allApplicants = useMemo(() => {
//     const applicants = [
//       {
//         sequence: 1,
//         title: primaryTitle,
//         full_name: primaryFullName,
//         dob: primaryDob,
//         pan: primaryPanNo,
//         aadhar: primaryAadharNo,
//         email: email1,
//         phone: phone1,
//         isPrimary: true,
//       },
//     ];

//     additionalApplicants.forEach((app, idx) => {
//       if (app.full_name && app.full_name.trim()) {
//         applicants.push({
//           sequence: idx + 2,
//           title: "Mr.",
//           full_name: app.full_name,
//           relation: app.relation,
//           dob: app.dob,
//           pan: app.pan,
//           aadhar: app.aadhar,
//           isPrimary: false,
//         });
//       }
//     });

//     return applicants;
//   }, [
//     primaryTitle,
//     primaryFullName,
//     primaryDob,
//     primaryPanNo,
//     primaryAadharNo,
//     email1,
//     phone1,
//     additionalApplicants,
//   ]);

//   const payments = useMemo(
//     () =>
//       leadProfile && Array.isArray(leadProfile.payments)
//         ? leadProfile.payments
//         : [],
//     [leadProfile]
//   );

//   const totalClearedPaid = useMemo(() => {
//     if (!payments.length) return 0;

//     return payments.reduce((sum, p) => {
//       if (!p || !p.amount) return sum;

//       const status = String(p.status || "").toUpperCase();
//       if (status === "PENDING") {
//         // do NOT minus pending
//         return sum;
//       }

//       return sum + Number(p.amount || 0);
//     }, 0);
//   }, [payments]);

//   const netPayableAfterReceipts = useMemo(() => {
//     const gross = Number(finalAmount || 0);
//     return gross - totalClearedPaid;
//   }, [finalAmount, totalClearedPaid]);

//   // UPDATE paymentPlanBaseAmount
//   const paymentPlanBaseAmount = useMemo(() => {
//     const grandTotal = Number(finalAmount || 0);
//     const kycAmount = requiresKyc === "YES" ? Number(kycDealAmount || 0) : 0;
//     return grandTotal - kycAmount;
//   }, [finalAmount, requiresKyc, kycDealAmount]);

//   useEffect(() => {
//     if (!selectedPaymentPlan || !selectedPaymentPlan.slabs) {
//       setMasterSlabs([]);
//       return;
//     }

//     // Load slabs from selected master plan + pre-compute amount
//     const editable = selectedPaymentPlan.slabs.map((s) => {
//       // ✅ Integer only - no decimals
//       const percentage = Math.floor(Number(s.percentage || 0));
//       const computedAmount =
//         paymentPlanBaseAmount > 0
//           ? (paymentPlanBaseAmount * percentage) / 100
//           : 0;

//       return {
//         id: s.id,
//         order_index: s.order_index,
//         name: s.name,
//         percentage,
//         amount: computedAmount, // ✅ amount set on load
//         days: s.days ?? "",
//         due_date: s.due_date || "",
//       };
//     });

//     setMasterSlabs(editable);
//   }, [selectedPaymentPlan, paymentPlanBaseAmount]); // ✅ depend on base amount also

//   const termsList = useMemo(() => {
//     if (!costTemplate?.terms_and_conditions) return [];
//     const raw = String(costTemplate.terms_and_conditions).trim();
//     if (!raw) return [];
//     return raw
//       .split(/\r?\n\r?\n+/) // split on blank lines
//       .map((p) => p.replace(/^\d+\.\s*/, "").trim()) // drop leading "1. "
//       .filter(Boolean);
//   }, [costTemplate]);

//   // UPDATED possessionCharges useMemo - WITHOUT PARKING
//   // Location: BookingForm.jsx (around line ~1400)
//   // Replace entire useMemo with this
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

//   const possessionCharges = useMemo(() => {
//     if (!costTemplate) return null;

//     // Match CostSheet calculation: development_charges_psf is applied on total
//     // pricing area (carpet + balcony where balcony pricing is enabled). Fall
//     // back to super built-up if nothing is provided to avoid a 0 multiplier.
//     const carpet = Number(carpetSqft || 0);
//     const balcony = Number(balconySqft || 0);
//     const superBuiltUp = Number(superBuiltupSqft || 0);
//     const isBalconyCarpetPricing = project?.is_pricing_balcony_carpert === true;

//     // Total area used for all PSF possession charges (dev + provisional)
//     const totalAreaForCharges =
//       (isBalconyCarpetPricing ? carpet + balcony : carpet) || carpet + balcony || superBuiltUp;

//     // Share Application Fees (flat) - NOT included in GST base
//     const shareFee = Number(
//       costTemplate.share_application_money_membership_fees || 0
//     );

//     // Development Charges @ PSF × total area
//     const devPsqf = Number(costTemplate.development_charges_psf || 0);
//     const devAmount = devPsqf * totalAreaForCharges;

//     // Electrical, Water, Gas (flat)
//     const electrical = Number(
//       costTemplate.electrical_watern_n_all_charges || 0
//     );

//     // Provisional Maintenance @ PSF × total area × months
//     const provPsqf = Number(costTemplate.provisional_maintenance_psf || 0);
//     const provMonths = Number(costTemplate.provisional_maintenance_months || 0);
//     const provAmount = provPsqf * totalAreaForCharges * provMonths;

//     // Legal & Compliance Charges (flat)
//     const legalAmount = legalFeeEnabled ? Number(costTemplate.legal_fee_amount || 0) : 0;

//     // Base for GST: Legal + Development + Electrical + Provisional Maintenance
//     const baseForGst = legalAmount + devAmount + electrical + provAmount;

//     // GST on possession (18%) - applied on baseForGst
//     const possessionGst = (baseForGst * 18) / 100;

//     // Total with GST (includes shareFee which is not in GST base)
//     const totalWithGst = shareFee + baseForGst + possessionGst;

//     return {
//       shareFee,
//       devPsqf,
//       devAmount,
//       electrical,
//       provPsqf,
//       provAmount,
//       provMonths,
//       totalAreaForCharges,
//       legalAmount,
//       baseForGst,
//       possessionGst,
//       total: baseForGst,
//       totalWithGst,
//     };
//   }, [
//     costTemplate,
//     carpetSqft,
//     balconySqft,
//     superBuiltupSqft,
//     project,
//     legalFeeEnabled,
//   ]);

//   const effectiveBaseRate = useMemo(() => {
//     const netBase = Number(agreementValue || 0); // after discount
//     const area = Number(carpetSqft || 0); // carpet area

//     if (!netBase || !area) return 0;

//     return netBase / area;
//   }, [agreementValue, carpetSqft]);

//   // useEffect(() => {
//   //   if (effectiveBaseRate > 0) {
//   //     setBaseRateDisplay(effectiveBaseRate.toFixed(2)); // ✅ override display
//   //   }
//   // }, [effectiveBaseRate]);

//   // useEffect(() => {
//   //   if (effectiveBaseRate > 0) {
//   //     setBaseRateDisplay(effectiveBaseRate.toFixed(2)); // ✅ override display
//   //   }
//   // }, [effectiveBaseRate]);

//   // ---------- Save Booking ----------
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   // COMPLETE handleSaveBooking FUNCTION
//   // Location: BookingForm.jsx (around line 2600)
//   // Replace entire function with this
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   // COMPLETE handleSaveBooking FUNCTION
//   // Location: BookingForm.jsx (around line 2600)
//   // Replace entire function with this
//   // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

//   const handleSaveBooking = async () => {
//     // ---------- VALIDATIONS ----------
//     if (!selectedUnitId) {
//       toast.error("Please select a tower & flat (unit) before saving.");
//       return;
//     }

//     if (!primaryPanNo || !validatePAN(primaryPanNo)) {
//       toast.error("Please enter a valid PAN number for primary applicant.");
//       return;
//     }
//     if (!primaryAadharNo || !validateAadhar(primaryAadharNo)) {
//       toast.error("Please enter a valid Aadhar number for primary applicant.");
//       return;
//     }
//     if (email1 && !validateEmail(email1)) {
//       toast.error("Please enter a valid email address.");
//       return;
//     }
//     if (phone1 && !validatePhone(phone1)) {
//       toast.error("Please enter a valid 10-digit phone number.");
//       return;
//     }
//     if (!bookingDate) {
//       toast.error("Please select Booking Date.");
//       return;
//     }
//     if (!agreementValue) {
//       toast.error("Please enter Agreement Value.");
//       return;
//     }
//     if (paymentPlanType === "MASTER" && !selectedPaymentPlanId) {
//       toast.error("Please select a Payment Plan.");
//       return;
//     }
//     if (paymentPlanType === "CUSTOM" && customTotalPercentage !== 100) {
//       toast.error("Custom payment plan slabs must total 100%.");
//       return;
//     }

//     if (!primaryFullName) {
//       toast.error("Please enter Primary Applicant full name.");
//       return;
//     }

//     for (let i = 0; i < additionalApplicants.length; i++) {
//       const app = additionalApplicants[i];
//       if (app.full_name && app.full_name.trim()) {
//         if (app.pan && !validatePAN(app.pan)) {
//           toast.error(`Invalid PAN for applicant ${i + 2}: ${app.full_name}`);
//           return;
//         }
//         if (app.aadhar && !validateAadhar(app.aadhar)) {
//           toast.error(
//             `Invalid Aadhar for applicant ${i + 2}: ${app.full_name}`
//           );
//           return;
//         }
//       }
//     }

//     // Sales user constraint
//     if (currentUser?.role === "SALES" && !leadId) {
//       toast.error("SALES user must link a lead. Open booking via Lead screen.");
//       return;
//     }

//     if (requiresKyc === "YES") {
//       if (!kycRequestId) {
//         toast.error("Please send KYC request before saving booking.");
//         return;
//       }
//     }

//     setSaving(true);
//     toast.info("Submitting booking...");

//     try {
//       const fd = new FormData();

//       // ==================================================
//       // BASIC INFO
//       // ==================================================
//       fd.append("unit_id", selectedUnitId);
//       if (leadId) fd.append("sales_lead_id", String(leadId));

//       fd.append("booking_date", bookingDate || "");
//       fd.append("office_address", office || "");
//       fd.append("status", status);

//       // ==================================================
//       // PRIMARY APPLICANT SNAPSHOT (Booking model)
//       // ==================================================
//       fd.append("primary_title", primaryTitle || "Mr.");
//       fd.append("primary_full_name", primaryFullName || "");
//       fd.append("primary_email", email1 || "");
//       fd.append("primary_mobile_number", phone1 || "");
//       fd.append("email_2", "");
//       fd.append("phone_2", "");

//       // ==================================================
//       // ADDRESSES
//       // ==================================================
//       fd.append("permanent_address", permanentAddress || "");
//       fd.append("correspondence_address", correspondenceAddress || "");
//       fd.append("preferred_correspondence", preferredCorrespondence || "");
//       fd.append("residential_status", residentialStatus || "");

//       // ==================================================
//       // FLAT INFO
//       // ==================================================
//       fd.append("super_builtup_sqft", superBuiltupSqft || "");
//       fd.append("carpet_sqft", carpetSqft || "");
//       fd.append("balcony_sqft", balconySqft || "");
//       fd.append("agreement_value", agreementValue || "");
//       fd.append("agreement_value_words", agreementValueWords || "");
//       fd.append("agreement_done", agreementDone);
//       const customerBaseRate = Number(stripAmount(baseRateDisplay)) || 0;
//       fd.append("customer_base_price_psf", String(customerBaseRate));

//       // ✅ PARKING - Calculate ALL values first, then append
//       const parkingCountNum =
//         parkingRequired === "YES" ? Number(parkingCount || 0) : 0;
//       const parkingAmountPerUnit =
//         parkingRequired === "YES" ? Number(parkingAmount || 0) : 0;
//       const parkingTotalAmount = parkingCountNum * parkingAmountPerUnit;

//       fd.append("parking_required", parkingRequired === "YES");
//       fd.append("parking_details", parkingDetails || "");
//       fd.append("parking_number", parkingNumber || "");
//       fd.append("parking_count", String(parkingCountNum));
//       fd.append("parking_amount_per_unit", String(parkingAmountPerUnit));
//       fd.append("parking_total_amount", String(parkingTotalAmount));

//       console.log("🚗 PARKING DATA:", {
//         required: parkingRequired,
//         count: parkingCountNum,
//         amount_per: parkingAmountPerUnit,
//         total: parkingTotalAmount,
//       });

//       // ==================================================
//       // TAXES & DISCOUNTS
//       // ==================================================
//       fd.append("gst_no", gstNo || "");
//       fd.append("discount_percent", discountPercent || "0");
//       fd.append("discount_amount", discountAmount || "0");

//       fd.append("additional_charges", JSON.stringify(additionalCharges));
//       fd.append("additional_charges_total", additionalChargesTotal.toFixed(2));
//       fd.append("amount_before_taxes", amountBeforeTaxes.toFixed(2));

//       // ==================================================
//       // COST TEMPLATE
//       // ==================================================
//       if (costTemplate) {
//         fd.append("gst_percent", costTemplate.gst_percent || "0");
//         fd.append("gst_enabled", gstEnabled);
//         fd.append("gst_amount", gstAmount.toFixed(2));

//         fd.append("stamp_duty_percent", costTemplate.stamp_duty_percent || "0");
//         fd.append("stamp_duty_enabled", stampDutyEnabled);
//         fd.append("stamp_duty_amount", stampDutyAmount.toFixed(2));

//         fd.append(
//           "registration_amount",
//           costTemplate.registration_amount || "0"
//         );
//         fd.append("registration_enabled", registrationEnabled);
//         fd.append("legal_fee_amount", costTemplate.legal_fee_amount || "0");
//         fd.append("legal_fee_enabled", legalFeeEnabled);
//       }

//       // ==================================================
//       // OFFER / TOTALS
//       // ==================================================
//       if (selectedOfferId) fd.append("offer_id", selectedOfferId);
//       fd.append("offer_discount", offerDiscountValue.toFixed(2));
//       fd.append("total_taxes", totalTaxes.toFixed(2));
//       fd.append("final_amount", finalAmount.toFixed(2));

//       // ==================================================
//       // COST BREAKDOWN DATA
//       // ==================================================

//       // Calculate possession totals with GST
//       const possessionBase = possessionCharges
//         ? possessionCharges.baseForGst
//         : 0;
//       const possessionGstAmt = possessionCharges
//         ? possessionCharges.possessionGst
//         : 0;
//       const possessionTotal = possessionCharges
//         ? possessionCharges.totalWithGst
//         : 0;
//       const registrationAmt = registrationEnabled
//         ? Number(costTemplate.registration_amount || 0)
//         : 0;
//       const grandTotal =
//         Number(finalAmount || 0) + possessionTotal + registrationAmt;

//       // Unit Cost Calculation (Section 1)
//       fd.append("unit_cost_base", agreementValue || "0");
//       fd.append("additional_charges_amount", additionalChargesTotal.toFixed(2));
//       fd.append("parking_charges_amount", parkingTotalAmount.toFixed(2));
//       fd.append("stamp_duty_amount_breakdown", stampAmount.toFixed(2));
//       fd.append("gst_amount_breakdown", gstAmount.toFixed(2));
//       fd.append("total_cost_section_1", finalAmount.toFixed(2));

//       // Possession Related Charges (Section 2) - WITHOUT PARKING
//       console.log(possessionCharges, "hai ya nhi?");

//       if (possessionCharges) {
//         fd.append(
//           "share_application_money_membership_amount",
//           possessionCharges.shareFee.toFixed(2)
//         );
//         fd.append(
//           "legal_compliance_charges_amount",
//           (legalFeeEnabled
//             ? Number(costTemplate.legal_fee_amount || 0)
//             : 0
//           ).toFixed(2)
//         );
//         fd.append(
//           "development_charges_amount",
//           possessionCharges.devAmount.toFixed(2)
//         );
//         fd.append(
//           "development_charges_psf",
//           possessionCharges.devPsqf.toFixed(2)
//         );
//         fd.append(
//           "electrical_water_piped_gas_charges_amount",
//           possessionCharges.electrical.toFixed(2)
//         );
//         fd.append(
//           "provisional_maintenance_amount",
//           possessionCharges.provAmount.toFixed(2)
//         );
//         fd.append(
//           "provisional_maintenance_psf",
//           possessionCharges.provPsqf.toFixed(2)
//         );
//         // ✅ REMOVED: possession_parking_charges - parking is in Unit Cost section now
//         fd.append(
//           "possessional_gst_amount",
//           possessionCharges.possessionGst.toFixed(2)
//         );
//         fd.append("possession_gst_percent", "18");
//         fd.append(
//           "total_possession_charges",
//           possessionCharges.totalWithGst.toFixed(2)
//         );
//       } else {
//         fd.append("share_application_money_membership_amount", "0");
//         fd.append("legal_compliance_charges_amount", "0");
//         fd.append("development_charges_amount", "0");
//         fd.append("development_charges_psf", "0");
//         fd.append("electrical_water_piped_gas_charges_amount", "0");
//         fd.append("provisional_maintenance_amount", "0");
//         fd.append("provisional_maintenance_psf", "0");
//         // ✅ REMOVED: possession_parking_charges
//         fd.append("possessional_gst_amount", "0");
//         fd.append("possession_gst_percent", "18");
//         fd.append("total_possession_charges", "0");
//       }

//       // Registration (Section 3)
//       fd.append("registration_amount_final", registrationAmt.toFixed(2));

//       // Grand Total
//       fd.append("grand_total_amount", grandTotal.toFixed(2));

//       // Structured JSON for complete breakdown
//       const costBreakdownData = {
//         unit_cost_calculation: {
//           unit_cost: Number(agreementValue || 0),
//           additional_charges: additionalChargesTotal,
//           parking: parkingTotalAmount, // ✅ Parking in Unit Cost section
//           stamp_duty: stampAmount,
//           stamp_duty_percent: Number(costTemplate?.gst_percent || 0),
//           gst: gstAmount,
//           gst_percent: Number(costTemplate?.gst_percent || 0),
//           total_cost_1: Number(finalAmount || 0),
//         },
//         possession_charges: possessionCharges
//           ? {
//               share_application_fees: possessionCharges.shareFee,
//               legal_compliance: legalFeeEnabled
//                 ? Number(costTemplate.legal_fee_amount || 0)
//                 : 0,
//               development_charges: possessionCharges.devAmount,
//               development_charges_psf: possessionCharges.devPsqf,
//               electrical_water_gas: possessionCharges.electrical,
//               provisional_maintenance: possessionCharges.provAmount,
//               provisional_maintenance_psf: possessionCharges.provPsqf,
//               // ✅ REMOVED: parking_charges - now in unit_cost_calculation
//               possession_gst: possessionCharges.possessionGst,
//               possession_gst_percent: 18,
//               base_total: possessionCharges.baseForGst,
//               total_with_gst: possessionCharges.totalWithGst,
//             }
//           : null,
//         registration: {
//           enabled: registrationEnabled,
//           amount: registrationAmt,
//         },
//         summary: {
//           total_cost: Number(finalAmount || 0),
//           total_possession: possessionTotal,
//           total_registration: registrationAmt,
//           grand_total: grandTotal,
//         },
//       };

//       fd.append("cost_breakdown_json", JSON.stringify(costBreakdownData));

//       console.log("💰 COST BREAKDOWN:", costBreakdownData);

//       // ==================================================
//       // PAYMENT PLAN + KYC FLAGS
//       // ==================================================
//       fd.append("payment_plan_type", paymentPlanType);

//       // Always tell backend if KYC was required or not
//       fd.append("requires_kyc", requiresKyc === "YES" ? "true" : "false");

//       // Send deal amount snapshot (0/empty if not applicable)
//       fd.append("kyc_deal_amount", kycDealAmount || "");

//       // Link the actual KYC request only when it exists
//       if (requiresKyc === "YES" && kycRequestId) {
//         fd.append("kyc_request_id", String(kycRequestId));
//       }

//       if (paymentPlanType === "MASTER" && selectedPaymentPlanId) {
//         fd.append("payment_plan_id", selectedPaymentPlanId);
//       }

//       // ==================================================
//       // PAYMENT PLAN SNAPSHOT
//       // ==================================================
//       let planSnapshot = {
//         type: paymentPlanType,
//         payment_plan_id:
//           paymentPlanType === "MASTER" ? selectedPaymentPlanId || null : null,
//         slabs: [],
//       };

//       if (paymentPlanType === "MASTER" && selectedPaymentPlan) {
//         planSnapshot.name = selectedPaymentPlan.name;

//         // Calculate amount for each slab from percentage
//         planSnapshot.slabs = masterSlabs.map((slab, idx) => {
//           const percentage = Number(slab.percentage || 0);
//           const calculatedAmount = (paymentPlanBaseAmount * percentage) / 100;

//           return {
//             order_index: idx + 1,
//             name: slab.name,
//             amount: Math.round(calculatedAmount * 100) / 100,
//             percentage: percentage,
//             days: slab.days || null,
//             due_date: slab.due_date || null,
//           };
//         });
//       } else if (paymentPlanType === "CUSTOM") {
//         planSnapshot.name = customPlanName || "Custom Plan";

//         // Calculate amount for each slab from percentage
//         planSnapshot.slabs = customSlabs.map((s, idx) => {
//           const percentage = Number(s.percentage || 0);
//           const calculatedAmount = (paymentPlanBaseAmount * percentage) / 100;

//           return {
//             order_index: idx + 1,
//             name: s.name,
//             amount: Math.round(calculatedAmount * 100) / 100,
//             percentage: percentage,
//             days: s.days || null,
//             due_date: s.due_date || null,
//           };
//         });
//       }

//       // Send plan_snapshot (for audit/reporting)
//       fd.append("plan_snapshot", JSON.stringify(planSnapshot));

//       // Send custom_payment_plan (same data structure)
//       fd.append(
//         "custom_payment_plan",
//         JSON.stringify({
//           base_payment_plan_id:
//             paymentPlanType === "MASTER" ? selectedPaymentPlanId || null : null,
//           name: planSnapshot.name,
//           slabs: planSnapshot.slabs,
//         })
//       );

//       console.log("💰 PAYMENT PLAN:", {
//         type: paymentPlanType,
//         base_amount: paymentPlanBaseAmount,
//         grand_total: grandTotal,
//         kyc_amount: kycDealAmount,
//         slabs_count: planSnapshot.slabs.length,
//       });

//       // ==================================================
//       // FUNDING
//       // ==================================================
//       fd.append("loan_required", loanRequired === "YES" ? "true" : "false");
//       fd.append("loan_bank_name", "");
//       fd.append("loan_amount_expected", "");
//       fd.append("booking_amount", bookingAmount || "0");
//       fd.append("other_charges", otherCharges || "0");

//       // ==================================================
//       // MAIN PHOTO
//       // ==================================================
//       if (photoFile) fd.append("photo", photoFile);

//       // ==================================================
//       // APPLICANTS — BRACKET NOTATION
//       // ==================================================

//       // PRIMARY APPLICANT (index 0)
//       fd.append("applicants[0][is_primary]", true);
//       fd.append("applicants[0][sequence]", "1");
//       fd.append("applicants[0][title]", primaryTitle || "Mr.");
//       fd.append("applicants[0][full_name]", primaryFullName || "");
//       fd.append("applicants[0][relation]", "");
//       if (primaryDob) {
//         fd.append("applicants[0][date_of_birth]", primaryDob);
//       }
//       fd.append("applicants[0][email]", email1 || "");
//       fd.append("applicants[0][mobile_number]", phone1 || "");
//       fd.append("applicants[0][pan_no]", primaryPanNo || "");
//       fd.append("applicants[0][aadhar_no]", primaryAadharNo || "");

//       if (files.primaryPanFront)
//         fd.append("applicants[0][pan_front]", files.primaryPanFront);
//       if (files.primaryPanBack)
//         fd.append("applicants[0][pan_back]", files.primaryPanBack);
//       if (files.primaryAadharFront)
//         fd.append("applicants[0][aadhar_front]", files.primaryAadharFront);
//       if (files.primaryAadharBack)
//         fd.append("applicants[0][aadhar_back]", files.primaryAadharBack);

//       // ADDITIONAL APPLICANTS
//       let applicantIndex = 1;

//       additionalApplicants.forEach((app, idx) => {
//         if (app.full_name && app.full_name.trim()) {
//           fd.append(`applicants[${applicantIndex}][is_primary]`, "false");
//           fd.append(
//             `applicants[${applicantIndex}][sequence]`,
//             String(applicantIndex + 1)
//           );
//           fd.append(`applicants[${applicantIndex}][title]`, "Mr.");
//           fd.append(
//             `applicants[${applicantIndex}][full_name]`,
//             app.full_name.trim()
//           );
//           fd.append(
//             `applicants[${applicantIndex}][relation]`,
//             app.relation || ""
//           );
//           if (app.dob && app.dob.trim()) {
//             fd.append(`applicants[${applicantIndex}][date_of_birth]`, app.dob);
//           }
//           fd.append(`applicants[${applicantIndex}][email]`, "");
//           fd.append(`applicants[${applicantIndex}][mobile_number]`, "");
//           fd.append(`applicants[${applicantIndex}][pan_no]`, app.pan || "");
//           fd.append(
//             `applicants[${applicantIndex}][aadhar_no]`,
//             app.aadhar || ""
//           );

//           // files
//           const filePrefix = ["second", "third", "fourth"][idx];

//           if (files[`${filePrefix}PanFront`])
//             fd.append(
//               `applicants[${applicantIndex}][pan_front]`,
//               files[`${filePrefix}PanFront`]
//             );
//           if (files[`${filePrefix}PanBack`])
//             fd.append(
//               `applicants[${applicantIndex}][pan_back]`,
//               files[`${filePrefix}PanBack`]
//             );
//           if (files[`${filePrefix}AadharFront`])
//             fd.append(
//               `applicants[${applicantIndex}][aadhar_front]`,
//               files[`${filePrefix}AadharFront`]
//             );
//           if (files[`${filePrefix}AadharBack`])
//             fd.append(
//               `applicants[${applicantIndex}][aadhar_back]`,
//               files[`${filePrefix}AadharBack`]
//             );

//           applicantIndex++;
//         }
//       });

//       // ==================================================
//       // ATTACHMENTS — BRACKET NOTATION
//       // ==================================================
//       let attachmentIndex = 0;

//       if (files.kycAadhar) {
//         fd.append(`attachments[${attachmentIndex}][label]`, "KYC Aadhar");
//         fd.append(
//           `attachments[${attachmentIndex}][doc_type]`,
//           "IDENTITY_PROOF"
//         );
//         fd.append(`attachments[${attachmentIndex}][file]`, files.kycAadhar);
//         attachmentIndex++;
//       }

//       if (files.kycPan) {
//         fd.append(`attachments[${attachmentIndex}][label]`, "KYC PAN");
//         fd.append(
//           `attachments[${attachmentIndex}][doc_type]`,
//           "IDENTITY_PROOF"
//         );
//         fd.append(`attachments[${attachmentIndex}][file]`, files.kycPan);
//         attachmentIndex++;
//       }

//       // Multi-type attachments (including Payment Proofs)
//       paymentDocs.forEach((doc) => {
//         if (!doc.file) return;

//         const label = doc.label || "Attachment";

//         fd.append(`attachments[${attachmentIndex}][label]`, label);
//         fd.append(
//           `attachments[${attachmentIndex}][doc_type]`,
//           doc.doc_type || "OTHER"
//         );

//         if (doc.doc_type === "PAYMENT_PROOF") {
//           fd.append(
//             `attachments[${attachmentIndex}][payment_mode]`,
//             doc.payment_mode || ""
//           );
//           fd.append(
//             `attachments[${attachmentIndex}][payment_ref_no]`,
//             doc.ref_no || ""
//           );
//           fd.append(
//             `attachments[${attachmentIndex}][bank_name]`,
//             doc.bank_name || ""
//           );
//           fd.append(
//             `attachments[${attachmentIndex}][payment_amount]`,
//             doc.amount || ""
//           );
//           fd.append(
//             `attachments[${attachmentIndex}][payment_date]`,
//             doc.date || ""
//           );
//           fd.append(
//             `attachments[${attachmentIndex}][remarks]`,
//             doc.remarks || ""
//           );
//         }

//         fd.append(`attachments[${attachmentIndex}][file]`, doc.file);
//         attachmentIndex++;
//       });

//       // ==================================================
//       // DEBUG LOGGING
//       // ==================================================
//       console.log("=== BOOKING SUBMISSION ===");
//       console.log("🚗 Parking:", {
//         required: fd.get("parking_required"),
//         count: fd.get("parking_count"),
//         amount_per_unit: fd.get("parking_amount_per_unit"),
//         total: fd.get("parking_total_amount"),
//       });
//       console.log("💰 Cost Breakdown:", {
//         unit_cost: fd.get("unit_cost_base"),
//         total_cost_1: fd.get("total_cost_section_1"),
//         possession_total: fd.get("total_possession_charges"),
//         grand_total: fd.get("grand_total_amount"),
//       });
//       console.log("📋 Payment Plan:", {
//         type: fd.get("payment_plan_type"),
//         base_amount: paymentPlanBaseAmount,
//         plan_snapshot: JSON.parse(fd.get("plan_snapshot") || "{}"),
//       });

//       for (let pair of fd.entries()) {
//         if (pair[1] instanceof File)
//           console.log(pair[0], "→ FILE:", pair[1].name);
//         else console.log(pair[0], "→", pair[1]);
//       }

//       // ==================================================
//       // SUBMIT
//       // ==================================================
//       const res = await axiosInstance.post(`${BOOK_API_PREFIX}/bookings/`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       toast.success("Booking saved successfully! 🎉");
//       console.log("BOOKING CREATED:", res.data);

//       // If a KYC request exists, link it to this booking
//       if (kycRequestId && res?.data?.id) {
//         try {
//           await axiosInstance.post(
//             `${BOOK_API_PREFIX}/bookings/${res.data.id}/link-kyc-request/`,
//             { kyc_request_id: kycRequestId }
//           );
//           console.log("KYC request linked to booking", res.data.id);
//         } catch (linkErr) {
//           console.error("Failed to link KYC request to booking", linkErr);
//           toast.warn("Booking saved, but failed to link KYC request.");
//         }
//       }
//     } catch (err) {
//       console.error("❌ Booking save failed:", err);
//       // Build a detailed error message from API response (e.g., unit_id errors)
//       const respData = err?.response?.data;
//       const collected = [];

//       if (typeof respData === "string") {
//         collected.push(respData);
//       } else if (Array.isArray(respData)) {
//         collected.push(...respData);
//       } else if (respData && typeof respData === "object") {
//         Object.entries(respData).forEach(([key, val]) => {
//           if (Array.isArray(val)) {
//             val.forEach((msg) => collected.push(`${key}: ${msg}`));
//           } else if (typeof val === "string") {
//             collected.push(`${key}: ${val}`);
//           }
//         });
//       }

//       if (collected.length === 0) {
//         collected.push(
//           err?.response?.data?.message ||
//             err?.response?.data?.error ||
//             err?.message ||
//             "Unknown error occurred"
//         );
//       }

//       // Show all errors together for clarity
//       toast.error(`Booking Failed:\n${collected.join("\n")}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // --- TAX BREAKUP HELPERS (Booking Form) ---
//   const baseAmountBeforeTaxes = Math.max(
//     (finalAmount || 0) - (totalTaxes || 0),
//     0
//   );

//   // GST amount
//   // const gstAmount =
//   //   gstEnabled && costTemplate
//   //     ? (baseAmountBeforeTaxes * Number(costTemplate.gst_percent || 0)) / 100
//   //     : 0;

//   // Stamp Duty amount - applied on unit cost + additional charges + parking total
//   const stampDutyBase = Number(agreementValue || 0) + Number(additionalChargesTotal || 0) + (parkingRequired === "YES" ? Number(parkingTotal || 0) : 0);
//   const stampAmount =
//     stampDutyEnabled && costTemplate
//       ? (stampDutyBase * Number(costTemplate.stamp_duty_percent || 0)) / 100
//       : 0;

//   // Registration amount (fixed)
//   const registrationAmount =
//     registrationEnabled && costTemplate
//       ? Number(costTemplate.registration_amount || 0)
//       : 0;

//   // Legal Fees amount (fixed)
//   const legalAmount =
//     legalFeeEnabled && costTemplate
//       ? Number(costTemplate.legal_fee_amount || 0)
//       : 0;

//   return (
//     <div className="setup-page">
//       <div className="setup-container">
//         <div className="booking-form-page" ref={rootRef}>
//           {loading ? (
//             <div className="bf-card">
//               <p>Loading booking setup...</p>
//             </div>
//           ) : error ? (
//             <div className="bf-card">
//               <p className="bf-error">{error}</p>
//             </div>
//           ) : (
//             <>
//               {/* -------- Top booking info -------- */}
//               {(companyLogoUrl || companyName || currentProjectLabel) && (
//                 <div className="bf-top-header">
//                   {companyLogoUrl && (
//                     <div className="bf-logo-circle">
//                       <img
//                         src={companyLogoUrl}
//                         alt={companyName || "Company Logo"}
//                       />
//                     </div>
//                   )}

//                   <div className="bf-top-title">
//                     {toSentenceCase(companyName || currentProjectLabel || "")}
//                   </div>
//                 </div>
//               )}

//               <div className="bf-row">
//                 <div className="bf-col">
//                   <label className="bf-label">
//                     {toSentenceCase("Booking Date")}{" "}
//                     <span className="bf-required">*</span>
//                   </label>
//                   <input
//                     className="bf-input"
//                     type="date"
//                     value={bookingDate}
//                     onChange={(e) => setBookingDate(e.target.value)}
//                   />
//                 </div>
//                 <div className="bf-col">
//                   <label className="bf-label">{toSentenceCase("Office")}</label>
//                   <textarea
//                     className="bf-textarea"
//                     rows={3}
//                     placeholder="Sales Office, Grand Avenue Towers, Sector 18, Gurgaon"
//                     value={office}
//                     onChange={(e) => setOffice(e.target.value)}
//                   />
//                 </div>
//                 {/* ✅ new status field */}
//                 <div className="bf-col">
//                   <label className="bf-label">
//                     {toSentenceCase("Booking Status")}
//                   </label>
//                   <input
//                     className="bf-input"
//                     type="text"
//                     value={status}
//                     onChange={(e) => setStatus(e.target.value)}
//                     placeholder="Draft / Confirmed / Cancelled"
//                   />
//                 </div>
//               </div>

//               {leadId && (
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Linked Lead")}
//                     </label>
//                     <input
//                       className="bf-input bf-input-readonly"
//                       type="text"
//                       value={
//                         leadProfile
//                           ? `#${leadId} - ${
//                               leadProfile.full_name ||
//                               leadProfile.mobile_number ||
//                               leadProfile.email ||
//                               ""
//                             }`
//                           : `Lead ID: ${leadId}`
//                       }
//                       readOnly
//                     />
//                   </div>
//                 </div>
//               )}

//               <div className="bf-photo-row">
//                 <div className="bf-photo-upload">
//                   <div className="bf-photo-circle" />
//                   <input
//                     id="bookingPhotoInput"
//                     type="file"
//                     accept="image/*"
//                     style={{ display: "none" }}
//                     onChange={(e) => {
//                       const f = e.target.files && e.target.files[0];
//                       if (f) setPhotoFile(f);
//                     }}
//                   />
//                   <label
//                     htmlFor="bookingPhotoInput"
//                     className="bf-btn-secondary"
//                     style={{ cursor: "pointer" }}
//                   >
//                     Upload Photo
//                   </label>
//                   {photoFile && (
//                     <div className="bf-file-name">Photo: {photoFile.name}</div>
//                   )}
//                 </div>
//               </div>

//               {/* Applicant Names */}
//               <Section
//                 id="applicantNames"
//                 title={toSentenceCase("Applicant Names")}
//                 open={openSections.applicantNames}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-subcard">
//                   <div className="bf-row bf-row-applicant">
//                     <div className="bf-col bf-col-title">
//                       <label className="bf-label">
//                         {toSentenceCase("Title")}
//                       </label>
//                       <div className="bf-radio-group">
//                         <label>
//                           <input
//                             type="radio"
//                             name="title1"
//                             value="Mr."
//                             checked={primaryTitle === "Mr."}
//                             onChange={(e) => setPrimaryTitle(e.target.value)}
//                           />{" "}
//                           Mr.
//                         </label>
//                         <label>
//                           <input
//                             type="radio"
//                             name="title1"
//                             value="Ms."
//                             checked={primaryTitle === "Ms."}
//                             onChange={(e) => setPrimaryTitle(e.target.value)}
//                           />{" "}
//                           Ms.
//                         </label>
//                         <label>
//                           <input
//                             type="radio"
//                             name="title1"
//                             value="Mrs."
//                             checked={primaryTitle === "Mrs."}
//                             onChange={(e) => setPrimaryTitle(e.target.value)}
//                           />{" "}
//                           Mrs.
//                         </label>
//                         <label>
//                           <input
//                             type="radio"
//                             name="title1"
//                             value="Dr."
//                             checked={primaryTitle === "Dr."}
//                             onChange={(e) => setPrimaryTitle(e.target.value)}
//                           />{" "}
//                           Dr.
//                         </label>
//                       </div>
//                     </div>
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("Full Name")}{" "}
//                         <span className="bf-required">*</span>
//                       </label>
//                       <input
//                         className="bf-input"
//                         type="text"
//                         placeholder="Rajesh Kumar"
//                         value={primaryFullName}
//                         onChange={(e) => setPrimaryFullName(e.target.value)}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* First Applicant PAN with file upload */}
//                 <div className="bf-row bf-row-upload">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("First Applicant PAN Number")}{" "}
//                       <span className="bf-required">*</span>
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={primaryPanNo}
//                       onChange={(e) => handlePrimaryPanChange(e.target.value)}
//                       maxLength={10}
//                       placeholder="ABCDE1234F"
//                       style={{ textTransform: "uppercase" }}
//                     />
//                   </div>

//                   <div className="bf-col bf-upload-btn-group">
//                     <span className="bf-label">
//                       {toSentenceCase("First Applicant PAN")}
//                     </span>

//                     <input
//                       id="primaryPanFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("primaryPanFront")}
//                     />
//                     <input
//                       id="primaryPanBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("primaryPanBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="primaryPanFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="primaryPanBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>

//                     <div className="bf-file-names">
//                       {files.primaryPanFront && (
//                         <div className="bf-file-name">
//                           Front: {files.primaryPanFront.name}
//                         </div>
//                       )}
//                       {files.primaryPanBack && (
//                         <div className="bf-file-name">
//                           Back: {files.primaryPanBack.name}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* First Applicant Aadhar with file upload */}
//                 <div className="bf-row bf-row-upload">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       First Applicant Aadhar Number{" "}
//                       <span className="bf-required">*</span>
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={primaryAadharNo}
//                       onChange={(e) =>
//                         handlePrimaryAadharChange(e.target.value)
//                       }
//                       maxLength={12}
//                       placeholder="123456789012"
//                     />
//                   </div>

//                   <div className="bf-col bf-upload-btn-group">
//                     <span className="bf-label">
//                       {toSentenceCase("First Applicant Aadhar")}
//                     </span>

//                     <input
//                       id="primaryAadharFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("primaryAadharFront")}
//                     />
//                     <input
//                       id="primaryAadharBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("primaryAadharBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="primaryAadharFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="primaryAadharBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>

//                     <div className="bf-file-names">
//                       {files.primaryAadharFront && (
//                         <div className="bf-file-name">
//                           Front: {files.primaryAadharFront.name}
//                         </div>
//                       )}
//                       {files.primaryAadharBack && (
//                         <div className="bf-file-name">
//                           Back: {files.primaryAadharBack.name}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </Section>

//               {/* Additional Applicants */}
//               <Section
//                 id="additionalApplicants"
//                 title={toSentenceCase("Additional Applicants")}
//                 open={openSections.additionalApplicants}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-subcard">
//                   {additionalApplicants.map((app, idx) => (
//                     <div
//                       key={idx}
//                       style={{
//                         marginBottom: "24px",
//                         paddingBottom: "24px",
//                         borderBottom: "1px solid #e5e7eb",
//                       }}
//                     >
//                       <div className="bf-row">
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Full Name")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             placeholder="Priya Kumar"
//                             value={app.full_name || ""}
//                             onChange={(e) =>
//                               handleAdditionalApplicantChange(
//                                 idx,
//                                 "full_name",
//                                 e.target.value
//                               )
//                             }
//                           />
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Relation")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             placeholder="Spouse"
//                             value={app.relation}
//                             onChange={(e) =>
//                               handleAdditionalApplicantChange(
//                                 idx,
//                                 "relation",
//                                 e.target.value
//                               )
//                             }
//                           />
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Date of Birth")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="date"
//                             max={getTodayDate()}
//                             value={app.dob}
//                             onChange={(e) =>
//                               handleAdditionalApplicantChange(
//                                 idx,
//                                 "dob",
//                                 e.target.value
//                               )
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="bf-row">
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Aadhar Number")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             placeholder="XXXX XXXX 1234"
//                             value={app.aadhar}
//                             onChange={(e) =>
//                               handleAdditionalApplicantChange(
//                                 idx,
//                                 "aadhar",
//                                 e.target.value
//                               )
//                             }
//                           />
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("PAN Number")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             placeholder="ABCDE1234F"
//                             value={app.pan || ""}
//                             onChange={(e) =>
//                               handleAdditionalApplicantChange(
//                                 idx,
//                                 "pan",
//                                 e.target.value
//                               )
//                             }
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}

//                   <button
//                     type="button"
//                     className="bf-btn-secondary bf-btn-full"
//                     onClick={handleAddAdditionalApplicant}
//                   >
//                     Add Additional Applicant
//                   </button>
//                 </div>

//                 {/* Rest of the file upload sections remain the same */}

//                 {/* Rest of the file upload sections remain the same */}

//                 {/* Second Applicant uploads */}
//                 <div className="bf-row bf-row-upload-compact">
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Second Applicant Aadhar")}
//                     </span>

//                     <input
//                       id="secondAadharFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("secondAadharFront")}
//                     />
//                     <input
//                       id="secondAadharBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("secondAadharBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="secondAadharFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="secondAadharBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Second Applicant Pan")}
//                     </span>

//                     <input
//                       id="secondPanFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("secondPanFront")}
//                     />
//                     <input
//                       id="secondPanBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("secondPanBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="secondPanFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="secondPanBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Third Applicant uploads */}
//                 <div className="bf-row bf-row-upload-compact">
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Third Applicant Aadhar")}
//                     </span>

//                     <input
//                       id="thirdAadharFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("thirdAadharFront")}
//                     />
//                     <input
//                       id="thirdAadharBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("thirdAadharBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="thirdAadharFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="thirdAadharBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Third Applicant Pan")}
//                     </span>

//                     <input
//                       id="thirdPanFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("thirdPanFront")}
//                     />
//                     <input
//                       id="thirdPanBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("thirdPanBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="thirdPanFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="thirdPanBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Fourth Applicant uploads */}
//                 <div className="bf-row bf-row-upload-compact">
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Fourth Applicant Aadhar")}
//                     </span>

//                     <input
//                       id="fourthAadharFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("fourthAadharFront")}
//                     />
//                     <input
//                       id="fourthAadharBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("fourthAadharBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="fourthAadharFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="fourthAadharBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                   <div className="bf-col">
//                     <span className="bf-label">
//                       {toSentenceCase("Fourth Applicant Pan")}
//                     </span>

//                     <input
//                       id="fourthPanFrontInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("fourthPanFront")}
//                     />
//                     <input
//                       id="fourthPanBackInput"
//                       type="file"
//                       accept="image/*,application/pdf"
//                       style={{ display: "none" }}
//                       onChange={handleFileChange("fourthPanBack")}
//                     />

//                     <div className="bf-btn-group">
//                       <label
//                         htmlFor="fourthPanFrontInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Front Side
//                       </label>
//                       <label
//                         htmlFor="fourthPanBackInput"
//                         className="bf-btn-gold"
//                         style={{ cursor: "pointer" }}
//                       >
//                         Back Side
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               </Section>

//               {/* Contact Details */}
//               <Section
//                 id="contactDetails"
//                 title="Contact Details"
//                 open={openSections.contactDetails}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Email 1")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="email"
//                       placeholder="contact@example.com"
//                       value={email1}
//                       onChange={(e) => handleEmailChange(e.target.value)}
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Phone Number 1")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="tel"
//                       placeholder="9876543210"
//                       value={phone1}
//                       onChange={(e) => handlePhoneChange(e.target.value)}
//                       maxLength={10}
//                     />
//                   </div>
//                 </div>
//               </Section>

//               {/* Address & Profile */}
//               <Section
//                 id="addressProfile"
//                 title="Addresses & Profile"
//                 open={openSections.addressProfile}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Permanent Address")}
//                     </label>
//                     <textarea
//                       className="bf-textarea"
//                       rows={3}
//                       placeholder="123, Gandhi Road, Chennai, Tamil Nadu, India - 600001"
//                       value={permanentAddress}
//                       onChange={(e) => setPermanentAddress(e.target.value)}
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Correspondence Address")}
//                     </label>
//                     <textarea
//                       className="bf-textarea"
//                       rows={3}
//                       placeholder="456, Nehru Street, Bangalore, Karnataka, India - 560001"
//                       value={correspondenceAddress}
//                       onChange={(e) => setCorrespondenceAddress(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       Preferred Correspondence Address
//                     </label>
//                     <div className="bf-radio-group">
//                       <label>
//                         <input
//                           type="radio"
//                           name="corrPref"
//                           value="PERMANENT"
//                           checked={preferredCorrespondence === "PERMANENT"}
//                           onChange={(e) =>
//                             setPreferredCorrespondence(e.target.value)
//                           }
//                         />{" "}
//                         Permanent Address
//                       </label>
//                       <label>
//                         <input
//                           type="radio"
//                           name="corrPref"
//                           value="CORRESPONDENCE"
//                           checked={preferredCorrespondence === "CORRESPONDENCE"}
//                           onChange={(e) =>
//                             setPreferredCorrespondence(e.target.value)
//                           }
//                         />{" "}
//                         Correspondence Address
//                       </label>
//                     </div>
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       Current Status (Residential)
//                     </label>
//                     <select
//                       className="bf-input"
//                       value={residentialStatus}
//                       onChange={(e) => setResidentialStatus(e.target.value)}
//                     >
//                       <option value="Owned">Owned</option>
//                       <option value="Rented">Rented</option>
//                       <option value="Company Provided">Company Provided</option>
//                     </select>
//                   </div>
//                 </div>
//               </Section>

//               {/* Flat Information */}
//               <Section
//                 id="flatInfo"
//                 title="Flat Information"
//                 open={openSections.flatInfo}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Building Name")}
//                     </label>
//                     <input
//                       className="bf-input bf-input-readonly"
//                       type="text"
//                       value={project?.name || ""}
//                       readOnly
//                     />
//                   </div>
//                   {/* Wing / Tower dropdown (custom) */}
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Wing / Tower")}
//                     </label>
//                     <div className="bf-dropdown">
//                       <button
//                         type="button"
//                         className="bf-input bf-dropdown-toggle"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           e.stopPropagation();
//                           setTowerOpen((open) => !open);
//                         }}
//                       >
//                         {selectedTower ? selectedTower.name : "Select Tower"}
//                       </button>

//                       {towerOpen && (
//                         <div className="bf-dropdown-menu">
//                           {towers.map((t) => (
//                             <button
//                               key={t.id}
//                               type="button"
//                               className="bf-dropdown-item"
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 setSelectedTowerId(String(t.id));
//                                 setSelectedUnitId("");
//                                 setTowerOpen(false);
//                                 setUnitOpen(false);
//                               }}
//                             >
//                               {t.name}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Flat / Unit dropdown (custom) - ENHANCED */}
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Flat / Unit")}
//                     </label>
//                     <div className="bf-dropdown">
//                       <button
//                         type="button"
//                         className="bf-input bf-dropdown-toggle"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           e.stopPropagation();
//                           if (!selectedTowerId) return;
//                           setUnitOpen((open) => !open);
//                         }}
//                         disabled={!selectedTowerId}
//                       >
//                         {selectedUnit
//                           ? `${selectedUnit.unit_no}${
//                               selectedUnit.floor_number
//                                 ? ` (Floor ${selectedUnit.floor_number})`
//                                 : ""
//                             }`
//                           : "Select Unit"}
//                       </button>

//                       {unitOpen && selectedTowerId && (
//                         <div className="bf-dropdown-menu">
//                           {towerUnits.map((u) => {
//                             // ✅ Determine unit status
//                             const unitStatus = u.status || "NOT_RELEASED";
//                             const inventoryStatus =
//                               u.inventory?.availability_status ||
//                               u.inventory?.unit_status;

//                             // Check if unit is BOOKED or BLOCKED
//                             const isBooked =
//                               unitStatus === "BOOKED" ||
//                               inventoryStatus === "BOOKED";
//                             const isBlocked =
//                               unitStatus === "BLOCKED" ||
//                               inventoryStatus === "BLOCKED" ||
//                               inventoryStatus === "BLOCKED_BY_ADMIN";
//                             const isAvailable =
//                               !isBooked &&
//                               !isBlocked &&
//                               (unitStatus === "RELEASED" ||
//                                 inventoryStatus === "AVAILABLE");

//                             // Determine background color
//                             let bgColor = "#ffffff"; // default white
//                             let textColor = "#374151"; // default dark gray
//                             let cursor = "pointer";
//                             let opacity = 1;

//                             if (isBooked) {
//                               bgColor = "#fee2e2"; // red-100
//                               textColor = "#991b1b"; // red-800
//                               cursor = "not-allowed";
//                               opacity = 0.6;
//                             } else if (isBlocked) {
//                               bgColor = "#fef3c7"; // yellow-100
//                               textColor = "#92400e"; // yellow-800
//                               cursor = "not-allowed";
//                               opacity = 0.6;
//                             } else if (!isAvailable) {
//                               bgColor = "#f3f4f6"; // gray-100
//                               textColor = "#6b7280"; // gray-500
//                               cursor = "not-allowed";
//                               opacity = 0.6;
//                             }

//                             return (
//                               <button
//                                 key={u.id}
//                                 type="button"
//                                 className="bf-dropdown-item"
//                                 disabled={!isAvailable}
//                                 onClick={(e) => {
//                                   e.preventDefault();
//                                   e.stopPropagation();

//                                   // Prevent selection if not available
//                                   if (!isAvailable) {
//                                     if (isBooked) {
//                                       toast.error(
//                                         `Unit ${u.unit_no} is already BOOKED`
//                                       );
//                                     } else if (isBlocked) {
//                                       toast.warn(
//                                         `Unit ${u.unit_no} is BLOCKED`
//                                       );
//                                     } else {
//                                       toast.warn(
//                                         `Unit ${u.unit_no} is not available for booking`
//                                       );
//                                     }
//                                     return;
//                                   }

//                                   setSelectedUnitId(String(u.id));
//                                   setUnitOpen(false);
//                                   setInterestedUnitError("");
//                                 }}
//                                 style={{
//                                   backgroundColor: bgColor,
//                                   color: textColor,
//                                   cursor: cursor,
//                                   opacity: opacity,
//                                   fontWeight:
//                                     isBooked || isBlocked ? "600" : "400",
//                                   display: "flex",
//                                   justifyContent: "space-between",
//                                   alignItems: "center",
//                                 }}
//                               >
//                                 <span>
//                                   {u.unit_no}
//                                   {u.floor_number
//                                     ? ` (Floor ${u.floor_number})`
//                                     : ""}
//                                 </span>
//                                 {isBooked && (
//                                   <span
//                                     style={{
//                                       fontSize: "11px",
//                                       padding: "2px 6px",
//                                       backgroundColor: "#dc2626",
//                                       color: "white",
//                                       borderRadius: "4px",
//                                       fontWeight: "600",
//                                     }}
//                                   >
//                                     BOOKED
//                                   </span>
//                                 )}
//                                 {isBlocked && (
//                                   <span
//                                     style={{
//                                       fontSize: "11px",
//                                       padding: "2px 6px",
//                                       backgroundColor: "#f59e0b",
//                                       color: "white",
//                                       borderRadius: "4px",
//                                       fontWeight: "600",
//                                     }}
//                                   >
//                                     BLOCKED
//                                   </span>
//                                 )}
//                                 {!isAvailable && !isBooked && !isBlocked && (
//                                   <span
//                                     style={{
//                                       fontSize: "11px",
//                                       padding: "2px 6px",
//                                       backgroundColor: "#6b7280",
//                                       color: "white",
//                                       borderRadius: "4px",
//                                       fontWeight: "600",
//                                     }}
//                                   >
//                                     NOT AVAILABLE
//                                   </span>
//                                 )}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   {interestedUnitError && (
//                     <div
//                       style={{
//                         marginTop: "4px",
//                         fontSize: "12px",
//                         color: "#dc2626",
//                       }}
//                     >
//                       {interestedUnitError}
//                     </div>
//                   )}
//                 </div>

//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Rera Area (Sq. Ft.)")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={formatINR(carpetSqft ?? "")}
//                       onChange={(e) =>
//                         setCarpetSqft(stripAmount(e.target.value))
//                       }
//                     />
//                   </div>

//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Balcony Area (Sq. Ft.)")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={formatINR(balconySqft)}
//                       onChange={(e) =>
//                         setBalconySqft(e.target.value.replace(/,/g, ""))
//                       }
//                     />
//                   </div>
//                 </div>

//                 {project?.is_pricing_balcony_carpert === true && (
//                   <div className="bf-row">
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase(
//                           "Total Area (RERA + Balcony) (Sq. Ft.)"
//                         )}
//                       </label>
//                       <input
//                         className="bf-input"
//                         type="text"
//                         value={formatINR(
//                           Number(carpetSqft || 0) + Number(balconySqft || 0) ||
//                             ""
//                         )}
//                         readOnly
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="bf-row bf-screen-only">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Base Rate / Sq. Ft.")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={formatINR(baseRateDisplay || "0")}
//                       onChange={(e) => {
//                         setBaseRateDisplay(
//                           stripAmount(e.target.value.replace(/,/g, ""))
//                         );
//                         setAgreementTouched(false);
//                       }}
//                     />
//                   </div>
//                 </div>

//                 {/* Discount Row */}
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Discount (%)")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="number"
//                       value={discountPercent}
//                       onChange={(e) => {
//                         setDiscountPercent(e.target.value);
//                         setDiscountAmount(""); // Clear amount when % changes
//                       }}
//                       placeholder="e.g., 5"
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Discount Amount")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={formatINR(discountAmount)}
//                       onChange={(e) => {
//                         setDiscountAmount(stripAmount(e.target.value));
//                         setDiscountPercent(""); // Clear % when amount changes
//                       }}
//                       placeholder="e.g., 50000"
//                     />
//                   </div>
//                 </div>

//                 {/* Agreement Value Row */}
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       Agreement Value (In Rupees){" "}
//                       <span className="bf-required">*</span>
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={formatINR(agreementValue)}
//                       onChange={(e) => {
//                         setAgreementTouched(true);
//                         setAgreementValue(stripAmount(e.target.value));
//                       }}
//                       placeholder="Enter agreement value e.g. 12500000"
//                     />
//                   </div>

//                   <div className="bf-col">
//                     <label className="bf-label">
//                       Agreement Value (In Words)
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       value={agreementValueWords}
//                       onChange={(e) => setAgreementValueWords(e.target.value)}
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Agreement Done")}
//                     </label>
//                     <select
//                       className="bf-input"
//                       value={agreementDone ? "YES" : "NO"}
//                       onChange={(e) =>
//                         setAgreementDone(e.target.value === "YES")
//                       }
//                     >
//                       <option value="NO">No</option>
//                       <option value="YES">Yes</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">{toSentenceCase("Parking")}</label>
//                     <select
//                       className="bf-input"
//                       value={parkingRequired}
//                       onChange={(e) => setParkingRequired(e.target.value)}
//                     >
//                       <option value="NO">No</option>
//                       <option value="YES">Yes</option>
//                     </select>
//                   </div>
//                   {parkingRequired === "YES" && (
//                     <>
//                       <div className="bf-col">
//                         <label className="bf-label">{toSentenceCase("Parking Details")}</label>
//                         <input
//                           className="bf-input"
//                           type="text"
//                           value={parkingDetails}
//                           onChange={(e) => setParkingDetails(e.target.value)}
//                           placeholder="Covered/Open, Type"
//                         />
//                       </div>
//                       <div className="bf-col">
//                         <label className="bf-label">{toSentenceCase("Parking Number")}</label>
//                         <input
//                           className="bf-input"
//                           type="text"
//                           value={parkingNumber}
//                           onChange={(e) => setParkingNumber(e.target.value)}
//                           placeholder="P-123"
//                         />
//                       </div>
//                     </>
//                   )}
//                 </div> */}

//                 {/* -------- PARKING SECTION -------- */}
//                 <div className="bf-row">
//                   {/* Parking Required */}
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Parking")}
//                     </label>
//                     <select
//                       className="bf-input"
//                       value={parkingRequired}
//                       onChange={(e) => {
//                         const val = e.target.value;
//                         setParkingRequired(val);

//                         if (val === "NO") {
//                           setParkingCount("");
//                           setParkingAmount("");
//                           setParkingTotal("");
//                         }
//                       }}
//                     >
//                       <option value="NO">No</option>
//                       <option value="YES">Yes</option>
//                     </select>
//                   </div>

//                   {/* No of Parking */}
//                   {parkingRequired === "YES" && (
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("No. of Parking")}
//                       </label>
//                       <select
//                         className="bf-input"
//                         value={parkingCount}
//                         onChange={(e) => {
//                           setParkingCount(e.target.value);
//                         }}
//                       >
//                         <option value="">Select</option>
//                         {Array.from({ length: 10 }).map((_, i) => (
//                           <option key={i + 1} value={i + 1}>
//                             {i + 1}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   )}

//                   {/* Parking Amount (Per Parking) */}
//                   {parkingRequired === "YES" && parkingCount && (
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         Parking Amount (Per Parking)
//                       </label>
//                       <input
//                         type="text"
//                         className="bf-input"
//                         value={formatINR(parkingAmount)}
//                         onChange={(e) => setParkingAmount(stripAmount(e.target.value))}
//                         placeholder="Enter parking price"
//                       />
//                       <div className="bf-helper">
//                         {project?.price_per_parking}
//                       </div>
//                     </div>
//                   )}

//                   {/* Total Parking Amount */}
//                   {parkingRequired === "YES" && parkingCount && (
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         Total Parking Amount (₹)
//                       </label>
//                       <input
//                         type="text"
//                         className="bf-input"
//                         value={
//                           parkingTotal
//                             ? formatINR(parkingTotal)
//                             : ""
//                         }
//                         readOnly
//                       />
//                     </div>
//                   )}
//                 </div>
//               </Section>

//               {/* Additional Charges */}
//               <Section
//                 id="costSummary"
//                 title="Additional Charges"
//                 open={openSections.costSummary}
//                 onToggle={toggleSection}
//               >
//                 {!leadId ? (
//                   <div className="bf-subcard">
//                     <p style={{ color: "#6b7280" }}>
//                       Cost summary is only available when booking is linked to a
//                       lead.
//                     </p>
//                   </div>
//                 ) : !costTemplate ? (
//                   <div className="bf-subcard">
//                     <p style={{ color: "#6b7280" }}>Loading cost template...</p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="bf-subcard">
//                       <div style={{ marginBottom: "16px" }}>
//                         <div
//                           style={{
//                             display: "grid",
//                             gridTemplateColumns: "2fr 1fr 1fr 1fr",
//                             gap: "12px",
//                             marginBottom: "8px",
//                             fontWeight: "600",
//                             fontSize: "13px",
//                             color: "#6b7280",
//                           }}
//                         >
//                           <div>Charge Name</div>
//                           <div>Type</div>
//                           <div>Value</div>
//                           <div>Amount</div>
//                         </div>

//                         {additionalCharges.map((charge, idx) => (
//                           <div
//                             key={idx}
//                             style={{
//                               display: "grid",
//                               gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
//                               gap: "12px",
//                               marginBottom: "12px",
//                               alignItems: "center",
//                             }}
//                           >
//                             <input
//                               className="bf-input"
//                               type="text"
//                               placeholder="e.g., Amenity Charges"
//                               value={charge.name}
//                               onChange={(e) =>
//                                 handleUpdateAdditionalCharge(
//                                   idx,
//                                   "name",
//                                   e.target.value
//                                 )
//                               }
//                             />

//                             <select
//                               className="bf-input"
//                               value={charge.type}
//                               onChange={(e) =>
//                                 handleUpdateAdditionalCharge(
//                                   idx,
//                                   "type",
//                                   e.target.value
//                                 )
//                               }
//                             >
//                               <option value="FIXED">Fixed</option>
//                               <option value="PERCENTAGE">Percentage</option>
//                             </select>

//                             <input
//                               className="bf-input"
//                               type="number"
//                               placeholder={
//                                 charge.type === "PERCENTAGE" ? "%" : "Amount"
//                               }
//                               value={charge.value}
//                               onChange={(e) =>
//                                 handleUpdateAdditionalCharge(
//                                   idx,
//                                   "value",
//                                   e.target.value
//                                 )
//                               }
//                             />

//                             <input
//                               className="bf-input bf-input-readonly"
//                               type="number"
//                               value={charge.amount.toFixed(2)}
//                               readOnly
//                             />

//                             {additionalCharges.length > 1 && (
//                               <button
//                                 type="button"
//                                 className="bf-btn-secondary"
//                                 onClick={() =>
//                                   handleRemoveAdditionalCharge(idx)
//                                 }
//                                 style={{ padding: "6px 12px" }}
//                               >
//                                 ✕
//                               </button>
//                             )}
//                           </div>
//                         ))}

//                         <button
//                           type="button"
//                           className="bf-btn-secondary"
//                           onClick={handleAddAdditionalCharge}
//                           style={{ marginTop: "8px" }}
//                         >
//                           + Add New Charge
//                         </button>
//                       </div>

//                       {/* Summary - WITHOUT Final Amount */}
//                       <div
//                         style={{
//                           borderTop: "1px solid #e5e7eb",
//                           paddingTop: "16px",
//                           marginTop: "16px",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             marginBottom: "8px",
//                             color: "#6b7280",
//                           }}
//                         >
//                           <span>Net Base Value</span>
//                           <span>₹{formatINR(Number(agreementValue || 0))}</span>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             marginBottom: "8px",
//                             color: "#6b7280",
//                           }}
//                         >
//                           <span>Additional Charges Total</span>
//                           <span>₹{formatINR(additionalChargesTotal)}</span>
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             paddingTop: "12px",
//                             borderTop: "2px solid #e5e7eb",
//                             fontWeight: "600",
//                             fontSize: "15px",
//                           }}
//                         >
//                           <span>Amount Before Taxes</span>
//                           <span>₹{formatINR(amountBeforeTaxes)}</span>
//                         </div>
//                       </div>

//                       {/* Offer Selection */}
//                       {offers.length > 0 && (
//                         <div style={{ marginTop: "16px" }}>
//                           <label className="bf-label">
//                             Apply Offer (Optional)
//                           </label>
//                           <select
//                             className="bf-input"
//                             value={selectedOfferId}
//                             onChange={(e) => setSelectedOfferId(e.target.value)}
//                           >
//                             <option value="">No Offer</option>
//                             {offers.map((offer) => (
//                               <option key={offer.id} value={offer.id}>
//                                 {offer.name}
//                                 {offer.percentage &&
//                                   ` (${offer.percentage}% off)`}
//                                 {offer.amount && ` (₹${offer.amount} off)`}
//                               </option>
//                             ))}
//                           </select>
//                           {offerDiscountValue > 0 && (
//                             <div
//                               style={{
//                                 marginTop: "8px",
//                                 color: "#059669",
//                                 fontWeight: "600",
//                               }}
//                             >
//                               Offer Discount: -₹{offerDiscountValue.toFixed(2)}
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </>
//                 )}
//               </Section>

//               {/* Tax Configuration Section */}
//               {costTemplate && (
//                 <Section
//                   id="taxConfig"
//                   title="Tax & Charges Configuration"
//                   open={openSections.taxConfig || false}
//                   onToggle={toggleSection}
//                 >
//                   <div className="bf-subcard">
//                     <div className="bf-row">
//                       <div className="bf-col">
//                         <label className="bf-label">
//                           {toSentenceCase("GST Percent (%)")}
//                         </label>
//                         <select
//                           className="bf-input"
//                           value={costTemplate.gst_percent || 0}
//                           onChange={(e) => {
//                             const currentValue = Number(
//                               costTemplate.gst_percent || 0
//                             );
//                             const newValue = Number(e.target.value);
//                             setCostTemplate((prev) => ({
//                               ...prev,
//                               gst_percent: newValue,
//                             }));
//                           }}
//                         >
//                           {(() => {
//                             const currentValue = Number(
//                               costTemplate.gst_percent || 0
//                             );
//                             const min = Math.max(0, currentValue - 3);
//                             const max = currentValue + 4;
//                             const options = [];
//                             for (let i = min; i <= max; i++) {
//                               options.push(
//                                 <option key={i} value={i}>
//                                   {i}%
//                                 </option>
//                               );
//                             }
//                             return options;
//                           })()}
//                         </select>
//                       </div>

//                       <div className="bf-col">
//                         <label className="bf-label">
//                           {toSentenceCase("Stamp Duty Percent (%)")}
//                         </label>
//                         <select
//                           className="bf-input"
//                           value={costTemplate.stamp_duty_percent || 0}
//                           onChange={(e) => {
//                             const newValue = Number(e.target.value);
//                             setCostTemplate((prev) => ({
//                               ...prev,
//                               stamp_duty_percent: newValue,
//                             }));
//                           }}
//                         >
//                           {(() => {
//                             const currentValue = Number(
//                               costTemplate.stamp_duty_percent || 0
//                             );
//                             const min = Math.max(0, currentValue - 3);
//                             const max = currentValue + 4;
//                             const options = [];
//                             for (let i = min; i <= max; i++) {
//                               options.push(
//                                 <option key={i} value={i}>
//                                   {i}%
//                                 </option>
//                               );
//                             }
//                             return options;
//                           })()}
//                         </select>
//                       </div>

//                       <div className="bf-col">
//                         <label className="bf-label">
//                           Provisional Maintenance Months
//                         </label>
//                         <select
//                           className="bf-input"
//                           value={
//                             costTemplate.provisional_maintenance_months || 0
//                           }
//                           onChange={(e) => {
//                             const newValue = Number(e.target.value);
//                             setCostTemplate((prev) => ({
//                               ...prev,
//                               provisional_maintenance_months: newValue,
//                             }));
//                           }}
//                         >
//                           {(() => {
//                             const currentValue = Number(
//                               costTemplate.provisional_maintenance_months || 0
//                             );
//                             const min = Math.max(0, currentValue - 3);
//                             const max = currentValue + 4;
//                             const options = [];
//                             for (let i = min; i <= max; i++) {
//                               options.push(
//                                 <option key={i} value={i}>
//                                   {i} {i === 1 ? "month" : "months"}
//                                 </option>
//                               );
//                             }
//                             return options;
//                           })()}
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </Section>
//               )}

//               <Section
//                 id="taxesStatutory"
//                 title="Cost Breakdown"
//                 open={openSections.taxesStatutory}
//                 onToggle={toggleSection}
//               >
//                 {!leadId || !costTemplate ? (
//                   <div className="bf-subcard">
//                     <p style={{ color: "#6b7280" }}>
//                       Cost breakdown will be available after selecting a unit
//                       and lead.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="bf-subcard">
//                     {/* ================== UNIT COST CALCULATION ================== */}
//                     <div className="cost-breakdown-section cost-breakdown-unit">
//                       <div className="cost-breakdown-header">
//                         Unit Cost Calculation
//                       </div>

//                       <div className="cost-breakdown-row">
//                         <span>Unit Cost</span>
//                         <span>{formatINR(agreementValue || 0)}</span>
//                       </div>

//                       {additionalChargesTotal > 0 && (
//                         <div className="cost-breakdown-row">
//                           <span>Additional Charges</span>
//                           <span>{formatINR(additionalChargesTotal)}</span>
//                         </div>
//                       )}

//                       {/* ✅ PARKING - Shown in Unit Cost section */}
//                       {parkingRequired === "YES" && parkingTotal > 0 && (
//                         <div className="cost-breakdown-row">
//                           <span>
//                             Parking ({parkingCount} × ₹
//                             {formatINR(parkingAmount)})
//                           </span>
//                           <span>{formatINR(parkingTotal)}</span>
//                         </div>
//                       )}

//                       {stampDutyEnabled && stampAmount > 0 && (
//                         <div className="cost-breakdown-row">
//                           <span>
//                             Stamp Duty ({costTemplate.stamp_duty_percent}%)
//                           </span>
//                           <span>{formatINR(stampAmount)}</span>
//                         </div>
//                       )}

//                       {gstEnabled && gstAmount > 0 && (
//                         <div className="cost-breakdown-row">
//                           <span>GST ({costTemplate.gst_percent}%)</span>
//                           <span>{formatINR(gstAmount)}</span>
//                         </div>
//                       )}

//                       <div className="cost-breakdown-row cost-breakdown-total">
//                         <span>Total Cost (1)</span>
//                         <span>
//                           {formatINR(
//                             Number(agreementValue || 0) +
//                               Number(additionalChargesTotal || 0) +
//                               (parkingRequired === "YES"
//                                 ? Number(parkingTotal || 0)
//                                 : 0) +
//                               Number(stampAmount || 0) +
//                               Number(gstAmount || 0)
//                           )}
//                         </span>
//                       </div>
//                     </div>

//                     {/* ================== POSSESSION RELATED CHARGES ================== */}
//                     {/* ✅ NO PARKING - Parking removed from this section */}
//                     {possessionCharges && possessionCharges.totalWithGst > 0 && (
//                       <div className="cost-breakdown-section cost-breakdown-possession">
//                         <div className="cost-breakdown-header">
//                           Possession Related Charges
//                         </div>

//                         {possessionCharges.shareFee > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>
//                               Share Application Money & Membership Fees
//                             </span>
//                             <span>{formatINR(possessionCharges.shareFee)}</span>
//                           </div>
//                         )}

//                         {legalFeeEnabled &&
//                           costTemplate.legal_fee_amount > 0 && (
//                             <div className="cost-breakdown-row">
//                               <span>Legal & Compliance Charges</span>
//                               <span>
//                                 {formatINR(costTemplate.legal_fee_amount)}
//                               </span>
//                             </div>
//                           )}

//                         {possessionCharges.devAmount > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>
//                               Development Charges @ Rs.{" "}
//                               {formatINR(possessionCharges.devPsqf)} PSF ×{" "}
//                               {formatINR(
//                                 possessionCharges.totalAreaForCharges || 0
//                               )}{" "}
//                               sq. ft.
//                             </span>
//                             <span>
//                               {formatINR(possessionCharges.devAmount)}
//                             </span>
//                           </div>
//                         )}

//                         {possessionCharges.electrical > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>
//                               Electrical, Water & Piped Gas Connection Charges
//                             </span>
//                             <span>
//                               {formatINR(possessionCharges.electrical)}
//                             </span>
//                           </div>
//                         )}

//                         {Number(possessionCharges?.provAmount || 0) > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>
//                               Provisional Maintenance for{" "}
//                               {possessionCharges?.provMonths || 0} months @ Rs.{" "}
//                               {formatINR(possessionCharges?.provPsqf || 0)}
//                             </span>
//                             <span>
//                               {formatINR(possessionCharges?.provAmount || 0)}
//                             </span>
//                           </div>
//                         )}

//                         {/* ✅ REMOVED: Parking line - no longer shown here */}

//                         {possessionCharges.possessionGst > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>GST on Possession Charges (18%)</span>
//                             <span>
//                               {formatINR(possessionCharges.possessionGst)}
//                             </span>
//                           </div>
//                         )}

//                         <div className="cost-breakdown-row cost-breakdown-subtotal">
//                           <span>Total Possession Related Charges (2)</span>
//                           <span>
//                             {formatINR(possessionCharges.totalWithGst)}
//                           </span>
//                         </div>
//                       </div>
//                     )}

//                     {/* ================== REGISTRATION ================== */}
//                     {registrationEnabled &&
//                       costTemplate.registration_amount > 0 && (
//                         <div className="cost-breakdown-section">
//                           <div className="cost-breakdown-row">
//                             <span>Registration Amount</span>
//                             <span>
//                               {formatINR(costTemplate.registration_amount)}
//                             </span>
//                           </div>
//                         </div>
//                       )}

//                     {/* ================== SUMMARY ================== */}
//                     <div className="cost-breakdown-section cost-breakdown-summary">
//                       <div className="cost-breakdown-row">
//                         <span>Total Cost</span>
//                         <span>{formatINR(finalAmount)}</span>
//                       </div>

//                       {possessionCharges &&
//                         possessionCharges.totalWithGst > 0 && (
//                           <div className="cost-breakdown-row">
//                             <span>Total Possession Related Charges</span>
//                             <span>
//                               {formatINR(possessionCharges.totalWithGst)}
//                             </span>
//                           </div>
//                         )}
//                     </div>

//                     {/* ================== GRAND TOTAL ================== */}
//                     <div className="cost-breakdown-grand-total">
//                       <span>GRAND TOTAL</span>
//                       <span>
//                         {formatINR(
//                           Number(finalAmount || 0) +
//                             (possessionCharges
//                               ? possessionCharges.totalWithGst
//                               : 0) +
//                             (registrationEnabled
//                               ? Number(costTemplate.registration_amount || 0)
//                               : 0)
//                         )}
//                       </span>
//                     </div>

//                     {/* Terms & Conditions */}
//                     {termsList.length > 0 && (
//                       <div
//                         className="bf-terms-card"
//                         style={{ marginTop: "24px" }}
//                       >
//                         <div className="bf-terms-title">Terms & Conditions</div>
//                         <ol className="bf-terms-list">
//                           {termsList.map((t, idx) => (
//                             <li key={idx}>{t}</li>
//                           ))}
//                         </ol>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </Section>

//               {/* Source of Funding */}
//               <Section
//                 id="funding"
//                 title="Source of Funding"
//                 open={openSections.funding}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Loan Required?")}
//                     </label>
//                     <div className="bf-radio-group">
//                       <label>
//                         <input
//                           type="radio"
//                           name="loan"
//                           value="YES"
//                           checked={loanRequired === "YES"}
//                           onChange={(e) => setLoanRequired(e.target.value)}
//                         />{" "}
//                         Yes
//                       </label>
//                       <label>
//                         <input
//                           type="radio"
//                           name="loan"
//                           value="NO"
//                           checked={loanRequired === "NO"}
//                           onChange={(e) => setLoanRequired(e.target.value)}
//                         />{" "}
//                         No
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               </Section>

//               {/* Advance Deposit */}
//               <Section
//                 id="advanceDeposit"
//                 title="Advance Deposit"
//                 open={openSections.advanceDeposit}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Booking Amount")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       placeholder="100000"
//                       value={formatINR(bookingAmount)}
//                       onChange={(e) =>
//                         setBookingAmount(stripAmount(e.target.value))
//                       }
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Other Charges")}
//                     </label>
//                     <input
//                       className="bf-input"
//                       type="text"
//                       placeholder="50000"
//                       value={formatINR(otherCharges)}
//                       onChange={(e) =>
//                         setOtherCharges(stripAmount(e.target.value))
//                       }
//                     />
//                   </div>
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("Total Advance")}
//                     </label>
//                     <input
//                       className="bf-input bf-input-readonly"
//                       type="text"
//                       value={
//                         totalAdvanceNumber
//                           ? `₹${formatINR(totalAdvanceNumber)}`
//                           : ""
//                       }
//                       readOnly
//                     />
//                   </div>
//                 </div>
//               </Section>

//               {/* Payment Schedule & KYC gating */}
//               <Section
//                 id="paymentSchedule"
//                 title="Payment Schedule & KYC"
//                 open={openSections.paymentSchedule}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-row">
//                   {/* KYC requirement */}
//                   {/* <div className="bf-col">
//                     <label className="bf-label">{toSentenceCase("KYC Approval Required?")}</label>
//                     <div className="bf-radio-group">
//                       <label>
//                         <input
//                           type="radio"
//                           name="requiresKyc"
//                           value="NO"
//                           checked={requiresKyc === "NO"}
//                           disabled={isKycFrozen} // ✅ freeze when request exists
//                           onChange={(e) => {
//                             if (isKycFrozen) return; // ignore clicks
//                             setRequiresKyc(e.target.value);
//                             if (e.target.value === "NO") {
//                               setKycDealAmount("");
//                               setKycRequestId(null);
//                               setKycRequestStatus(null);
//                             }
//                           }}
//                         />{" "}
//                         No
//                       </label>
//                       <label>
//                         <input
//                           type="radio"
//                           name="requiresKyc"
//                           value="YES"
//                           checked={requiresKyc === "YES"}
//                           disabled={isKycFrozen} // ✅
//                           onChange={(e) => {
//                             if (isKycFrozen) return;
//                             setRequiresKyc(e.target.value);
//                           }}
//                         />{" "}
//                         Yes
//                       </label>
//                     </div>

//                     {/* KYC block editable sirf tab tak jab tak request send nahi hui */}
//                   {/* {requiresKyc === "YES" && !kycRequestId && (
//                     <div className="bf-kyc-box">
//                       <div className="bf-row">
//                         <div className="bf-col">
//                           <label className="bf-label">KYC</label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={formatINR(kycDealAmount)}
//                             onChange={(e) =>
//                               setKycDealAmount(stripAmount(e.target.value))
//                             }
//                             placeholder="e.g., 1,25,00,000"
//                           />
//                         </div>
//                       </div>

//                       <div className="bf-row">
//                         <div
//                           className="bf-col"
//                           style={{ display: "flex", gap: "8px" }}
//                         >
//                           <button
//                             type="button"
//                             className="bf-btn-secondary"
//                             onClick={handleSendKycRequest}
//                             disabled={!selectedUnitId || !kycDealAmount}
//                           >
//                             Send KYC Request
//                           </button>

//                           {canShowRemoveKyc && (
//                             <button
//                               type="button"
//                               className="bf-btn-secondary"
//                               onClick={handleRemoveKyc}
//                             >
//                               Remove KYC
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )} */}

//                   {/* Request send hone ke baad pura block hide ho jaayega,
//    sirf chhota summary text dikhayenge (read-only) */}
//                   {/* {requiresKyc === "YES" && kycRequestId && (
//                       <div className="bf-kyc-box" style={{ opacity: 0.9 }}>
//                         <div className="bf-row">
//                           <div className="bf-col">
//                             <div
//                               style={{
//                                 fontSize: "13px",
//                                 color: "#047857",
//                                 fontWeight: 600,
//                               }}
//                             >
//                               KYC request sent for deal amount ₹
//                               {formatINR(kycDealAmount || 0)}.
//                             </div>
//                             <div
//                               style={{
//                                 fontSize: "11px",
//                                 color: "#6b7280",
//                                 marginTop: "4px",
//                               }}
//                             >
//                               Ref ID: {kycRequestId} &nbsp;•&nbsp; Amount and
//                               KYC fields are now locked.
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )} */}
//                   {/* </div> */}
//                   {/* KYC requirement */}
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       {toSentenceCase("KYC Approval Required?")}
//                     </label>
//                     <div className="bf-radio-group">
//                       <label>
//                         <input
//                           type="radio"
//                           name="requiresKyc"
//                           value="NO"
//                           checked={requiresKyc === "NO"}
//                           disabled={isKycFrozen}
//                           onChange={(e) => {
//                             if (isKycFrozen) return;
//                             setRequiresKyc("NO");
//                             setKycDealAmount("");
//                             setKycRequestId(null);
//                             setKycRequestStatus(null);
//                           }}
//                         />{" "}
//                         No
//                       </label>

//                       <label>
//                         <input
//                           type="radio"
//                           name="requiresKyc"
//                           value="YES"
//                           checked={requiresKyc === "YES"}
//                           disabled={isKycFrozen}
//                           onChange={(e) => {
//                             if (isKycFrozen) return;
//                             setRequiresKyc("YES");
//                           }}
//                         />{" "}
//                         Yes
//                       </label>
//                     </div>

//                     {/* Show KYC Form only if not sent */}
//                     {requiresKyc === "YES" && !kycRequestId && (
//                       <div className="bf-kyc-box">
//                         <div className="bf-row">
//                           <div className="bf-col">
//                             <label className="bf-label">
//                               {toSentenceCase("KYC Deal Amount")}
//                             </label>
//                             <input
//                               className="bf-input"
//                               type="text"
//                               value={formatINR(kycDealAmount)}
//                               onChange={(e) =>
//                                 setKycDealAmount(stripAmount(e.target.value))
//                               }
//                               placeholder="e.g., 1,25,00,000"
//                             />
//                           </div>
//                         </div>

//                         <div className="bf-row">
//                           <div
//                             className="bf-col"
//                             style={{
//                               display: "flex",
//                               gap: "8px",
//                               alignItems: "center",
//                             }}
//                           >
//                             <button
//                               type="button"
//                               className="bf-btn-secondary"
//                               onClick={handleSendKycRequest}
//                               disabled={!selectedUnitId || !kycDealAmount}
//                             >
//                               Send KYC Request
//                             </button>

//                             {canShowRemoveKyc && (
//                               <button
//                                 type="button"
//                                 className="bf-btn-secondary"
//                                 onClick={handleRemoveKyc}
//                               >
//                                 Remove KYC
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Payment Plan column */}
//                   <div className="bf-col">
//                     <label className="bf-label">
//                       Payment Plan <span className="bf-required">*</span>
//                     </label>
//                     <select
//                       className="bf-input"
//                       value={
//                         paymentPlanType === "CUSTOM"
//                           ? "__CUSTOM__"
//                           : selectedPaymentPlanId || ""
//                       }
//                       onChange={handlePaymentPlanChange}
//                     >
//                       <option value="">Select Plan</option>
//                       {paymentPlans.map((plan) => (
//                         <option key={plan.id} value={plan.id}>
//                           {plan.name} ({plan.total_percentage}%)
//                         </option>
//                       ))}
//                       <option value="__CUSTOM__">Make Your Own Plan</option>
//                     </select>
//                   </div>
//                 </div>
//                 {paymentPlanType === "MASTER" && selectedPaymentPlan && (
//                   <div className="bf-subcard">
//                     {/* Selected Plan Header */}
//                     <div className="bf-row">
//                       <div className="bf-col">
//                         <strong>{toSentenceCase("Selected Plan")}:</strong>{" "}
//                         {selectedPaymentPlan.name} (
//                         {Math.floor(masterTotalPercentage)}%)
//                       </div>
//                     </div>

//                     {/* Slab Grid */}
//                     <div style={{ marginTop: "16px" }}>
//                       {/* Grid Header */}
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns: "2fr 1fr 1fr 1fr",
//                           gap: "12px",
//                           marginBottom: "8px",
//                           fontWeight: "600",
//                           fontSize: "13px",
//                           color: "#6b7280",
//                         }}
//                       >
//                         <div>{toSentenceCase("Installment Name")}</div>
//                         <div>{toSentenceCase("Percentage")}</div>
//                         <div>{toSentenceCase("Amount")}</div>
//                         <div>{toSentenceCase("Due Date / Days")}</div>
//                       </div>

//                       {/* Slab Rows */}
//                       {masterSlabs.map((slab, index) => (
//                         <div
//                           key={slab.id || index}
//                           style={{
//                             display: "grid",
//                             gridTemplateColumns: "2fr 1fr 1fr 1fr",
//                             gap: "12px",
//                             marginBottom: "12px",
//                             alignItems: "center",
//                             padding: "8px",
//                             backgroundColor: "#f9fafb",
//                             borderRadius: "4px",
//                           }}
//                         >
//                           {/* Name */}
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={slab.name}
//                             onChange={(e) =>
//                               handleMasterSlabChange(
//                                 index,
//                                 "name",
//                                 e.target.value
//                               )
//                             }
//                           />

//                           {/* Percentage */}
//                           <input
//                             className="bf-input"
//                             type="number"
//                             step="1"
//                             min="0"
//                             value={slab.percentage || ""}
//                             onChange={(e) =>
//                               handleMasterSlabChange(
//                                 index,
//                                 "percentage",
//                                 e.target.value
//                               )
//                             }
//                           />
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={formatINR(
//                               slab.amount !== undefined &&
//                                 slab.amount !== "" &&
//                                 slab.amount !== null
//                                 ? slab.amount
//                                 : (paymentPlanBaseAmount *
//                                     Number(slab.percentage || 0)) /
//                                     100
//                             )}
//                             onChange={(e) =>
//                               handleMasterSlabChange(
//                                 index,
//                                 "amount",
//                                 e.target.value.replace(/,/g, "")
//                               )
//                             }
//                           />

//                           {/* Due Date & Days */}
//                           <div
//                             style={{
//                               display: "grid",
//                               gridTemplateColumns: "1fr 1fr",
//                               gap: "4px",
//                             }}
//                           >
//                             {/* Date */}
//                             <input
//                               className="bf-input"
//                               type="date"
//                               value={slab.due_date || ""}
//                               onChange={(e) =>
//                                 handleMasterSlabChange(
//                                   index,
//                                   "due_date",
//                                   e.target.value
//                                 )
//                               }
//                             />

//                             {/* Days */}
//                             {/* <input
//               className="bf-input"
//               type="number"
//               placeholder="Days"
//               value={slab.days}
//               onChange={(e) =>
//                 handleMasterSlabChange(index, "days", e.target.value)
//               }
//             /> */}
//                           </div>
//                         </div>
//                       ))}

//                       {/* Total */}
//                       <div
//                         style={{
//                           marginTop: "12px",
//                           padding: "8px",
//                           backgroundColor: "#f0fdf4",
//                           borderRadius: "4px",
//                           fontSize: "14px",
//                           fontWeight: "600",
//                         }}
//                       >
//                         {toSentenceCase("Total")}:{" "}
//                         {Math.floor(masterTotalPercentage)}%
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {paymentPlanType === "CUSTOM" && (
//                   <div className="bf-subcard">
//                     <div className="bf-row">
//                       <div className="bf-col">
//                         <label className="bf-label">
//                           {toSentenceCase("Custom Plan Name")}
//                         </label>
//                         <input
//                           className="bf-input"
//                           type="text"
//                           value={customPlanName}
//                           onChange={(e) => setCustomPlanName(e.target.value)}
//                           placeholder="e.g. Rajesh Custom Plan"
//                         />
//                       </div>
//                     </div>

//                     {/* Updated grid layout matching screenshot */}
//                     <div style={{ marginTop: "16px" }}>
//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns: "2fr 1fr 1fr 1fr",
//                           gap: "12px",
//                           marginBottom: "8px",
//                           fontWeight: "600",
//                           fontSize: "13px",
//                           color: "#6b7280",
//                         }}
//                       >
//                         <div>{toSentenceCase("Installment Name")}</div>
//                         <div>{toSentenceCase("Percentage")}</div>
//                         <div>{toSentenceCase("Amount")}</div>
//                         <div>{toSentenceCase("Due Date")}</div>
//                       </div>

//                       {customSlabs.map((row, idx) => (
//                         <div
//                           key={idx}
//                           style={{
//                             display: "grid",
//                             gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
//                             gap: "12px",
//                             marginBottom: "12px",
//                             alignItems: "center",
//                           }}
//                         >
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={row.name}
//                             onChange={(e) =>
//                               handleUpdateCustomSlab(
//                                 idx,
//                                 "name",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="e.g., On Booking"
//                           />

//                           <input
//                             className="bf-input"
//                             type="number"
//                             step="1"
//                             min="0"
//                             value={row.percentage || ""}
//                             onChange={(e) =>
//                               handleUpdateCustomSlab(
//                                 idx,
//                                 "percentage",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="10"
//                           />

//                           <input
//                             className="bf-input bf-input-readonly"
//                             type="text"
//                             value={
//                               row.percentage
//                                 ? `₹${formatINR(
//                                     (paymentPlanBaseAmount *
//                                       Number(row.percentage || 0)) /
//                                       100
//                                   )}`
//                                 : ""
//                             }
//                             readOnly
//                           />

//                           <input
//                             className="bf-input"
//                             type="date"
//                             value={row.days || ""}
//                             onChange={(e) =>
//                               handleUpdateCustomSlab(
//                                 idx,
//                                 "days",
//                                 e.target.value
//                               )
//                             }
//                             onFocus={() => handleCustomDueDateFocus(idx)}
//                           />

//                           {customSlabs.length > 1 && (
//                             <button
//                               type="button"
//                               className="bf-btn-secondary"
//                               onClick={() => handleRemoveCustomSlab(idx)}
//                               style={{ padding: "6px 12px" }}
//                             >
//                               ✕
//                             </button>
//                           )}
//                         </div>
//                       ))}

//                       <div
//                         style={{
//                           marginTop: "12px",
//                           color: "#dc2626",
//                           fontSize: "14px",
//                         }}
//                       >
//                         {toSentenceCase("Total Percentage")}:{" "}
//                         {Math.floor(customTotalPercentage)}% (
//                         {toSentenceCase("should be 100%")})
//                       </div>

//                       <button
//                         type="button"
//                         className="bf-btn-secondary"
//                         onClick={handleAddCustomSlab}
//                         style={{ marginTop: "8px" }}
//                       >
//                         + Add Installment
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </Section>

//               {/* Attachments & Payment Proofs */}
//               <Section
//                 id="attachments"
//                 title="Attachments & Payment Proofs"
//                 open={openSections.attachments}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-subcard">
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       marginBottom: "12px",
//                     }}
//                   >
//                     <span className="bf-label">
//                       {toSentenceCase("Attachments")}
//                     </span>
//                     <button
//                       type="button"
//                       className="bf-btn-secondary"
//                       onClick={() => setShowPaymentDocModal(true)}
//                     >
//                       + Add Attachment
//                     </button>
//                   </div>

//                   {paymentDocs.length === 0 ? (
//                     <p style={{ fontSize: "13px", color: "#6b7280" }}>
//                       No attachments added yet.
//                     </p>
//                   ) : (
//                     <ul
//                       style={{
//                         marginTop: "8px",
//                         fontSize: "13px",
//                         color: "#374151",
//                       }}
//                     >
//                       {paymentDocs.map((doc, idx) => (
//                         <li key={idx} style={{ marginBottom: "4px" }}>
//                           <strong>{doc.label || "Attachment"}</strong> (
//                           {doc.doc_type || "OTHER"})
//                           {doc.doc_type === "PAYMENT_PROOF" && (
//                             <>
//                               {" "}
//                               – {doc.payment_mode} – {doc.ref_no || "No Ref"} –
//                               ₹{formatINR(doc.amount)}
//                               {doc.date && <span> ({doc.date})</span>}
//                             </>
//                           )}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </Section>

//               {/* Applicant Summary */}
//               <Section
//                 id="applicantSummary"
//                 title={`Applicant Summary (${allApplicants.length} Total)`}
//                 open={openSections.applicantSummary}
//                 onToggle={toggleSection}
//               >
//                 <div className="bf-subcard">
//                   {allApplicants.map((applicant, idx) => (
//                     <div
//                       key={idx}
//                       style={{
//                         marginBottom: "20px",
//                         padding: "16px",
//                         backgroundColor: applicant.isPrimary
//                           ? "#f0f9ff"
//                           : "#f9fafb",
//                         borderRadius: "8px",
//                         border: applicant.isPrimary
//                           ? "2px solid #3b82f6"
//                           : "1px solid #e5e7eb",
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           marginBottom: "12px",
//                         }}
//                       >
//                         <h4
//                           style={{
//                             margin: 0,
//                             fontSize: "16px",
//                             fontWeight: "600",
//                             color: applicant.isPrimary ? "#1e40af" : "#374151",
//                           }}
//                         >
//                           {applicant.isPrimary ? "🔑 " : ""}
//                           Applicant #{applicant.sequence}: {applicant.title}{" "}
//                           {applicant.full_name}
//                         </h4>
//                         {applicant.isPrimary && (
//                           <span
//                             style={{
//                               padding: "4px 12px",
//                               backgroundColor: "#3b82f6",
//                               color: "white",
//                               borderRadius: "12px",
//                               fontSize: "12px",
//                               fontWeight: "600",
//                             }}
//                           >
//                             PRIMARY
//                           </span>
//                         )}
//                       </div>

//                       <div
//                         style={{
//                           display: "grid",
//                           gridTemplateColumns: "repeat(2, 1fr)",
//                           gap: "12px",
//                         }}
//                       >
//                         {applicant.relation && (
//                           <div>
//                             <strong
//                               style={{ fontSize: "12px", color: "#6b7280" }}
//                             >
//                               Relation:
//                             </strong>
//                             <div style={{ fontSize: "14px" }}>
//                               {applicant.relation}
//                             </div>
//                           </div>
//                         )}
//                         {applicant.dob && (
//                           <div>
//                             <strong
//                               style={{ fontSize: "12px", color: "#6b7280" }}
//                             >
//                               Date of Birth:
//                             </strong>
//                             <div style={{ fontSize: "14px" }}>
//                               {applicant.dob}
//                             </div>
//                           </div>
//                         )}
//                         <div>
//                           <strong
//                             style={{ fontSize: "12px", color: "#6b7280" }}
//                           >
//                             PAN Number:
//                           </strong>
//                           <div
//                             style={{
//                               fontSize: "14px",
//                               fontFamily: "monospace",
//                               color: applicant.pan ? "#059669" : "#9ca3af",
//                             }}
//                           >
//                             {applicant.pan || "Not provided"}
//                           </div>
//                         </div>
//                         <div>
//                           <strong
//                             style={{ fontSize: "12px", color: "#6b7280" }}
//                           >
//                             Aadhar Number:
//                           </strong>
//                           <div
//                             style={{
//                               fontSize: "14px",
//                               fontFamily: "monospace",
//                               color: applicant.aadhar ? "#059669" : "#9ca3af",
//                             }}
//                           >
//                             {applicant.aadhar
//                               ? `XXXX XXXX ${applicant.aadhar.slice(-4)}`
//                               : "Not provided"}
//                           </div>
//                         </div>
//                         {applicant.email && (
//                           <div>
//                             <strong
//                               style={{ fontSize: "12px", color: "#6b7280" }}
//                             >
//                               Email:
//                             </strong>
//                             <div style={{ fontSize: "14px" }}>
//                               {applicant.email}
//                             </div>
//                           </div>
//                         )}
//                         {applicant.phone && (
//                           <div>
//                             <strong
//                               style={{ fontSize: "12px", color: "#6b7280" }}
//                             >
//                               Phone:
//                             </strong>
//                             <div style={{ fontSize: "14px" }}>
//                               {applicant.phone}
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* Show uploaded documents */}
//                       <div
//                         style={{
//                           marginTop: "12px",
//                           paddingTop: "12px",
//                           borderTop: "1px solid #e5e7eb",
//                         }}
//                       >
//                         <strong style={{ fontSize: "12px", color: "#6b7280" }}>
//                           Documents Uploaded:
//                         </strong>
//                         <div
//                           style={{
//                             display: "flex",
//                             gap: "8px",
//                             marginTop: "6px",
//                             flexWrap: "wrap",
//                           }}
//                         >
//                           {(() => {
//                             const docs = [];
//                             const prefix = [
//                               "primary",
//                               "second",
//                               "third",
//                               "fourth",
//                             ][idx];
//                             if (files[`${prefix}PanFront`])
//                               docs.push("PAN Front");
//                             if (files[`${prefix}PanBack`])
//                               docs.push("PAN Back");
//                             if (files[`${prefix}AadharFront`])
//                               docs.push("Aadhar Front");
//                             if (files[`${prefix}AadharBack`])
//                               docs.push("Aadhar Back");

//                             return docs.length > 0 ? (
//                               docs.map((doc, i) => (
//                                 <span
//                                   key={i}
//                                   style={{
//                                     padding: "4px 8px",
//                                     backgroundColor: "#d1fae5",
//                                     color: "#065f46",
//                                     borderRadius: "6px",
//                                     fontSize: "12px",
//                                   }}
//                                 >
//                                   ✓ {doc}
//                                 </span>
//                               ))
//                             ) : (
//                               <span
//                                 style={{ fontSize: "12px", color: "#9ca3af" }}
//                               >
//                                 No documents uploaded
//                               </span>
//                             );
//                           })()}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </Section>

//               <div className="bf-actions">
//                 <button type="button" className="bf-btn-secondary">
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   className="bf-btn-primary"
//                   onClick={handleSaveBooking}
//                   disabled={saving}
//                 >
//                   {saving ? "Saving..." : "Save Booking"}
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Payment Lead Create Modal */}
//           {showPaymentLeadModal && leadId && (
//             <PaymentLeadCreateModal
//               isOpen={showPaymentLeadModal}
//               onClose={() => setShowPaymentLeadModal(false)}
//               leadId={leadId}
//               defaultPaymentType="EOI"
//               onCreated={() => {
//                 refreshLeadProfile();
//                 toast.success("Payment added successfully!");
//               }}
//             />
//           )}

//           {showPaymentDocModal && (
//             <div className="cp-project-modal-backdrop">
//               <div className="cp-project-modal">
//                 <div className="cp-project-modal-header">
//                   <div>
//                     <h2 className="cp-project-modal-title">
//                       Add Payment Document
//                     </h2>
//                     <p className="cp-project-modal-subtitle">
//                       Cheque / RTGS / UPI details add karein aur proof upload
//                       karein.
//                     </p>
//                   </div>
//                   <button
//                     type="button"
//                     className="cp-project-modal-close"
//                     onClick={() => setShowPaymentDocModal(false)}
//                   >
//                     ✕
//                   </button>
//                 </div>

//                 {/* ---------- MODAL BODY ---------- */}
//                 <div
//                   style={{ padding: "16px 0", display: "grid", gap: "12px" }}
//                 >
//                   {/* Doc Type + Label */}
//                   <div className="bf-row">
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("Document Type")}
//                       </label>
//                       <select
//                         className="bf-input"
//                         value={newPaymentDoc.doc_type}
//                         onChange={(e) =>
//                           setNewPaymentDoc((prev) => ({
//                             ...prev,
//                             doc_type: e.target.value,
//                           }))
//                         }
//                       >
//                         {DOC_TYPES.map((t) => (
//                           <option key={t.value} value={t.value}>
//                             {t.label}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("Label / Title")}
//                       </label>
//                       <input
//                         className="bf-input"
//                         type="text"
//                         placeholder="Token Amount Payment / Booking Form / Agreement"
//                         value={newPaymentDoc.label}
//                         onChange={(e) =>
//                           setNewPaymentDoc((prev) => ({
//                             ...prev,
//                             label: e.target.value,
//                           }))
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* Payment fields only for PAYMENT_PROOF */}
//                   {newPaymentDoc.doc_type === "PAYMENT_PROOF" && (
//                     <>
//                       <div className="bf-row">
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Payment Mode")}
//                           </label>
//                           <select
//                             className="bf-input"
//                             value={newPaymentDoc.payment_mode}
//                             onChange={(e) =>
//                               setNewPaymentDoc((prev) => ({
//                                 ...prev,
//                                 payment_mode: e.target.value,
//                               }))
//                             }
//                           >
//                             {PAYMENT_MODES.map((m) => (
//                               <option key={m.value} value={m.value}>
//                                 {m.label}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             Ref / Cheque No / Transaction ID
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={newPaymentDoc.ref_no}
//                             onChange={(e) =>
//                               setNewPaymentDoc((prev) => ({
//                                 ...prev,
//                                 ref_no: e.target.value,
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>

//                       <div className="bf-row">
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Bank Name")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={newPaymentDoc.bank_name}
//                             onChange={(e) =>
//                               setNewPaymentDoc((prev) => ({
//                                 ...prev,
//                                 bank_name: e.target.value,
//                               }))
//                             }
//                           />
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Amount")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="text"
//                             value={formatINR(newPaymentDoc.amount)}
//                             onChange={(e) =>
//                               setNewPaymentDoc((prev) => ({
//                                 ...prev,
//                                 amount: stripAmount(e.target.value),
//                               }))
//                             }
//                           />
//                         </div>
//                         <div className="bf-col">
//                           <label className="bf-label">
//                             {toSentenceCase("Date")}
//                           </label>
//                           <input
//                             className="bf-input"
//                             type="date"
//                             value={newPaymentDoc.date}
//                             onChange={(e) =>
//                               setNewPaymentDoc((prev) => ({
//                                 ...prev,
//                                 date: e.target.value,
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                     </>
//                   )}

//                   <div className="bf-row">
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("Remarks (optional)")}
//                       </label>
//                       <textarea
//                         className="bf-textarea"
//                         rows={2}
//                         value={newPaymentDoc.remarks}
//                         onChange={(e) =>
//                           setNewPaymentDoc((prev) => ({
//                             ...prev,
//                             remarks: e.target.value,
//                           }))
//                         }
//                       />
//                     </div>
//                     <div className="bf-col">
//                       <label className="bf-label">
//                         {toSentenceCase("Upload File")}
//                       </label>
//                       <input
//                         type="file"
//                         accept="image/*,application/pdf"
//                         onChange={handlePaymentDocFileChange}
//                       />
//                       {newPaymentDoc.file && (
//                         <div
//                           className="bf-file-name"
//                           style={{ marginTop: "4px" }}
//                         >
//                           {newPaymentDoc.file.name}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "flex-end",
//                       gap: "8px",
//                       marginTop: "8px",
//                     }}
//                   >
//                     <button
//                       type="button"
//                       className="bf-btn-secondary"
//                       onClick={() => setShowPaymentDocModal(false)}
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="button"
//                       className="bf-btn-primary"
//                       onClick={() => {
//                         if (!newPaymentDoc.file) {
//                           toast.error("Please upload a file.");
//                           return;
//                         }

//                         if (!newPaymentDoc.label.trim()) {
//                           toast.error(
//                             "Please enter a label / title for this attachment."
//                           );
//                           return;
//                         }

//                         if (
//                           newPaymentDoc.doc_type === "PAYMENT_PROOF" &&
//                           (!newPaymentDoc.amount || !newPaymentDoc.date)
//                         ) {
//                           toast.error(
//                             "For Payment Proof, amount and date are required."
//                           );
//                           return;
//                         }

//                         setPaymentDocs((prev) => [...prev, newPaymentDoc]);
//                         setNewPaymentDoc({
//                           label: "",
//                           doc_type: "PAYMENT_PROOF",
//                           payment_mode: "UPI",
//                           ref_no: "",
//                           bank_name: "",
//                           amount: "",
//                           date: "",
//                           remarks: "",
//                           file: null,
//                         });
//                         setShowPaymentDocModal(false);
//                       }}
//                     >
//                       Save Attachment
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookingForm;


import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingForm.css";
import projectImage from "../../assets/project.webp";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toSentenceCase } from "../../utils/text";
import PaymentLeadCreateModal from "../../components/Payments/PaymentLeadCreateModal";

const BOOK_API_PREFIX = "/book";

const DOC_TYPES = [
  { value: "AGREEMENT_PDF", label: "Agreement PDF" },
  { value: "BOOKING_FORM_PDF", label: "Booking Form PDF" },
  { value: "PAYMENT_PROOF", label: "Payment Proof" },
  { value: "IDENTITY_PROOF", label: "Identity Proof (PAN/Aadhaar)" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_MODES = [
  { value: "CHEQUE", label: "Cheque" },
  { value: "RTGS", label: "RTGS / NEFT" },
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

// ✅ ADD ALL THESE FUNCTIONS HERE (BEFORE Section component)
// Validation functions
const validatePAN = (pan) => {
  if (!pan) return false;
  return pan.trim().length === 10;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const validateAadhar = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar.replace(/\s/g, ""));
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ""));
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Convert YYYY-MM-DD to DD/MM/YYYY
const formatDateDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  if (typeof dateString !== "string") {
    // If it's a Date object, convert to string first
    if (dateString instanceof Date) {
      dateString = dateString.toISOString().split("T")[0];
    } else {
      return String(dateString);
    }
  }

  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
  // If in DD-MM-YYYY format, convert to DD/MM/YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString.replace(/-/g, "/");
  }

  // If in YYYY-MM-DD format, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Try parsing as Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Ignore
  }

  return dateString;
};

// Convert DD-MM-YYYY to YYYY-MM-DD (for HTML date input)
const formatDateYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  if (typeof dateString !== "string") return dateString;

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  // If in DD-MM-YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  }

  // Try parsing as Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Ignore
  }

  return dateString;
};

const Section = ({ id, title, open, onToggle, children }) => (
  <div className="bf-section">
    <button
      type="button"
      className="bf-section-header"
      onClick={() => onToggle(id)}
    >
      <span className="bf-section-title">{title}</span>
      <span className={`bf-chevron ${open ? "bf-chevron-open" : ""}`}>▾</span>
    </button>
    {open && <div className="bf-section-body">{children}</div>}
  </div>
);

const BookingForm = () => {
  const rootRef = useRef(null);
  const navigate = useNavigate();
  // --------- Discount (in Flat Information) ----------
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [searchParams] = useSearchParams();
  const leadIdFromUrl =
    searchParams.get("lead_id") || searchParams.get("lead") || null;
  const [primaryDob, setPrimaryDob] = useState("");
  const projectIdFromUrl =
    searchParams.get("project_id") || searchParams.get("project");
  const [agreementValue, setAgreementValue] = useState(""); // numeric string
  const [agreementValueWords, setAgreementValueWords] = useState("");

  const [interestedUnitError, setInterestedUnitError] = useState("");
  const [agreementEditable, setAgreementEditable] = useState(true);
  const [agreementTouched, setAgreementTouched] = useState(false);

  // Payment Lead Modal
  const [showPaymentLeadModal, setShowPaymentLeadModal] = useState(false);

  // Multi-type attachments (Agreement PDF, Booking Form, Payment Proof, Other)
  const [showPaymentDocModal, setShowPaymentDocModal] = useState(false);
  const [paymentDocs, setPaymentDocs] = useState([]); // ab ye generic attachments array hai
  const [newPaymentDoc, setNewPaymentDoc] = useState({
    label: "",
    doc_type: "PAYMENT_PROOF", // AGREEMENT_PDF / BOOKING_FORM_PDF / PAYMENT_PROOF / OTHER
    payment_mode: "UPI", // CHEQUE / RTGS / UPI / CASH / OTHER
    ref_no: "",
    bank_name: "",
    amount: "",
    date: "",
    remarks: "",
    file: null,
  });

  const handlePaymentDocFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setNewPaymentDoc((prev) => ({ ...prev, file }));
  };

  const handleAddPaymentDoc = () => {
    // Basic validations
    if (!newPaymentDoc.file) {
      toast.error("Please upload a file for this attachment.");
      return;
    }

    if (!newPaymentDoc.label.trim()) {
      toast.error("Please enter a label / title for the attachment.");
      return;
    }

    if (
      newPaymentDoc.doc_type === "PAYMENT_PROOF" &&
      (!newPaymentDoc.amount || !newPaymentDoc.payment_mode)
    ) {
      toast.error("For Payment Proof, please fill Payment Mode and Amount.");
      return;
    }

    // Push into array
    setPaymentDocs((prev) => [...prev, newPaymentDoc]);

    // Reset modal state
    setNewPaymentDoc({
      label: "",
      doc_type: "PAYMENT_PROOF",
      payment_mode: "UPI",
      ref_no: "",
      bank_name: "",
      amount: "",
      date: "",
      remarks: "",
      file: null,
    });

    setShowPaymentDocModal(false);
  };

  // ---------- user + lead ----------
  const [currentUser, setCurrentUser] = useState(null);
  const [leadId] = useState(leadIdFromUrl);

  // ---------- PROJECT SELECTION (Channel Partner style) ----------
  const [scopeProjects, setScopeProjects] = useState([]);
  const [projectId, setProjectId] = useState(
    projectIdFromUrl ||
      localStorage.getItem("ACTIVE_PROJECT_ID") ||
      localStorage.getItem("PROJECT_ID") ||
      null
  );
  const [projectName, setProjectName] = useState("");
  const [photoError, setPhotoError] = useState("");

  // (section/activeItem kept if you later re-enable SalesSubnav)
  const [section] = useState("pre");
  const [activeItem] = useState("booking-form");

  const [openSections, setOpenSections] = useState({
    applicantNames: true,
    contactDetails: true,
    addressProfile: true,
    additionalApplicants: true,
    flatInfo: true,
    taxDetails: true,
    costSummary: true,
    taxConfig: false,
    taxesStatutory: true,
    paymentSchedule: true,
    paymentsSummary: true,
    funding: true,
    advanceDeposit: true,
    leadPayments: true,
    attachments: true, // ✅ NEW
    applicantSummary: true,
  });

  const handleFileChange = (key) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  // ✅ ADD THESE 4 NEW FUNCTIONS
  // PAN validation with toast
  const handlePrimaryPanChange = (value) => {
    setPrimaryPanNo(value.toUpperCase());
    if (value.length === 10 && !validatePAN(value)) {
      toast.error("PAN must be 10 characters.");
    }
  };

  // Aadhar validation with toast
  const handlePrimaryAadharChange = (value) => {
    const cleaned = value.replace(/\s/g, "");
    setPrimaryAadharNo(cleaned);
    if (cleaned.length === 12 && !validateAadhar(cleaned)) {
      toast.error("Invalid Aadhar format. Must be 12 digits.");
    }
  };

  // Email validation
  const handleEmailChange = (value) => {
    setEmail1(value);
    if (value && !validateEmail(value)) {
      toast.warn("Please enter a valid email address");
    }
  };

  // Phone validation
  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setPhone1(cleaned);
    if (cleaned.length === 10 && !validatePhone(cleaned)) {
      toast.error("Invalid phone number. Must be 10 digits.");
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [leadProfile, setLeadProfile] = useState(null);

  // ✅ Validate project_id and lead_id on mount
  useEffect(() => {
    if (!projectIdFromUrl || !leadIdFromUrl) {
      toast.error("Cannot Book Flat Without Any Relation To Lead");
      navigate("/leads");
      return;
    }
  }, [projectIdFromUrl, leadIdFromUrl]);

  // --------- Top booking info ----------
  // const [formRefNo, setFormRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState(getTodayDate()); // ✅ Auto-set today
  const [office, setOffice] = useState("");
  //const [status] = useState("DRAFT");
  const [status, setStatus] = useState("DRAFT");
  // --------- Primary applicant ----------
  const [primaryTitle, setPrimaryTitle] = useState("Mr.");
  const [primaryFullName, setPrimaryFullName] = useState("");
  const [primaryPanNo, setPrimaryPanNo] = useState("");
  const [primaryAadharNo, setPrimaryAadharNo] = useState("");

  // Contact details
  const [email1, setEmail1] = useState("");
  const [phone1, setPhone1] = useState("");

  // --------- Address & profile ----------
  const [permanentAddress, setPermanentAddress] = useState("");
  const [correspondenceAddress, setCorrespondenceAddress] = useState("");
  const [preferredCorrespondence, setPreferredCorrespondence] =
    useState("PERMANENT");
  const [residentialStatus, setResidentialStatus] = useState("Owned");

  // --------- Flat selection state ----------
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const [towerOpen, setTowerOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  // --------- Flat info (auto from inventory but editable) ----------
  const [superBuiltupSqft, setSuperBuiltupSqft] = useState("");
  const [carpetSqft, setCarpetSqft] = useState("");
  const [balconySqft, setBalconySqft] = useState("");
  const [agreementDone, setAgreementDone] = useState(false);

  const [parkingRequired, setParkingRequired] = useState("NO"); // YES / NO (UI)
  const [parkingDetails, setParkingDetails] = useState("");
  const [parkingNumber, setParkingNumber] = useState("");
  const [parkingCount, setParkingCount] = useState("1");

  // Parking states
  //const [parkingRequired, setParkingRequired] = useState("NO");
  //const [parkingCount, setParkingCount] = useState(""); // user selects 1,2,3...
  const [parkingAmount, setParkingAmount] = useState("1000000"); // per parking editable
  const [parkingTotal, setParkingTotal] = useState(""); // total = count * amount

  // --------- Cost Summary & Offers ----------
  const [costTemplate, setCostTemplate] = useState(null);
  const [offers, setOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [selectedOfferData, setSelectedOfferData] = useState(null);

  // Company logo and name from template
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Computed cost values
  const [gstAmount, setGstAmount] = useState(0);
  const [stampDutyAmount, setStampDutyAmount] = useState(0);
  const [totalTaxes, setTotalTaxes] = useState(0);
  const [offerDiscountValue, setOfferDiscountValue] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [baseRateDisplay, setBaseRateDisplay] = useState("");
  const [pricePerParking, setPricePerParking] = useState(0);
  const [gstNo, setGstNo] = useState("");

  // --------- KYC gating state ----------
  const [requiresKyc, setRequiresKyc] = useState("NO"); // "YES" | "NO"
  const [kycDealAmount, setKycDealAmount] = useState(""); // amount for KYC request
  const [kycRequestId, setKycRequestId] = useState(null); // backend KYC row id
  const [kycRequestStatus, setKycRequestStatus] = useState(null); // PENDING / APPROVED / REJECTED

  const canShowRemoveKyc = requiresKyc === "YES" && !kycRequestId; // jaise hi request send ho jaaye, button gayab
  const isKycFrozen = !!kycRequestId;

  const handleRemoveKyc = () => {
    // Sirf front-end reset; agar backend me koi draft row ban rahi hai
    // to uske liye alag API call bhi laga sakte ho yaha.
    setRequiresKyc("NO");
    setKycDealAmount("");
    setKycRequestId(null);
    setKycRequestStatus(null);
  };

  // --------- Payment plan ----------
  const [paymentPlanType, setPaymentPlanType] = useState("MASTER"); // MASTER / CUSTOM
  const [selectedPaymentPlanId, setSelectedPaymentPlanId] = useState("");
  const [masterSlabs, setMasterSlabs] = useState([]);
  const [masterPlanDueDates, setMasterPlanDueDates] = useState({});
  const [customPlanName, setCustomPlanName] = useState("");

  // Smart default for master plan dates: copy previous slab date on focus if empty
  const handleMasterDueDateFocus = (slabId, index) => {
    setMasterPlanDueDates((prev) => {
      // If already has a date, don't override
      if (prev[slabId]) return prev;
      if (!selectedPaymentPlan || index === 0) return prev;

      const prevSlab = selectedPaymentPlan.slabs[index - 1];
      if (!prevSlab) return prev;

      const prevDate = prev[prevSlab.id];
      if (!prevDate) return prev;

      return {
        ...prev,
        [slabId]: prevDate,
      };
    });
  };

  // Smart default for custom plan dates: copy previous row date on focus if empty
  const handleCustomDueDateFocus = (index) => {
    setCustomSlabs((prev) => {
      if (!prev || !prev[index] || prev[index].days) return prev;
      if (index === 0) return prev;

      const prevDate = prev[index - 1].days;
      if (!prevDate) return prev;

      const next = [...prev];
      next[index] = { ...next[index], days: prevDate };
      return next;
    });
  };

  const [customSlabs, setCustomSlabs] = useState([
    { name: "", percentage: "", days: "", due_date: "", amount: "" },
  ]);

  // --------- Additional Charges (dynamic) ----------
  const [additionalCharges, setAdditionalCharges] = useState([
    { name: "", type: "FIXED", value: "", amount: 0 }, // FIXED or PERCENTAGE
  ]);

  // Tax checkboxes (to enable/disable taxes)
  const [gstEnabled, setGstEnabled] = useState(true);
  const [stampDutyEnabled, setStampDutyEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [legalFeeEnabled, setLegalFeeEnabled] = useState(true);

  // Editable possession charges fields
  const [developmentChargesPsf, setDevelopmentChargesPsf] = useState("500"); // Default 500
  const [provisionalMaintenanceMonths, setProvisionalMaintenanceMonths] =
    useState(6);

  // Computed values for display
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [amountBeforeTaxes, setAmountBeforeTaxes] = useState(0);

  // ---------- Lead Payments (from full-info API) ----------
  const dealBaseAmount = useMemo(() => {
    // Priority: finalAmount (incl. taxes) -> agreementValue -> lead budget
    const finalAmt = Number(finalAmount || 0);
    if (finalAmt > 0) return finalAmt;

    const agrAmt = Number(agreementValue || 0);
    if (agrAmt > 0) return agrAmt;

    const budgetAmt = leadProfile?.budget ? Number(leadProfile.budget) : 0;
    return budgetAmt || 0;
  }, [finalAmount, agreementValue, leadProfile]);

  const leadPaymentsInfo = useMemo(() => {
    const payments = leadProfile?.payments || [];
    if (!payments.length) {
      return {
        baseAmount: dealBaseAmount,
        totalPaid: 0,
        balance: dealBaseAmount,
        rows: [],
      };
    }

    // sort by date (oldest → newest)
    const sorted = [...payments].sort((a, b) => {
      const da = a.payment_date ? new Date(a.payment_date) : 0;
      const db = b.payment_date ? new Date(b.payment_date) : 0;
      return da - db;
    });

    let running = dealBaseAmount || 0;
    let totalPaid = 0;

    const rows = sorted.map((p) => {
      const amt = Number(p.amount || 0);
      totalPaid += amt;

      if (dealBaseAmount) {
        running -= amt; // 👈 yahi "minus from last" hai
      }

      return {
        ...p,
        running_balance: dealBaseAmount ? running : null,
      };
    });

    const balance = dealBaseAmount
      ? Math.max(dealBaseAmount - totalPaid, 0)
      : 0;

    return {
      baseAmount: dealBaseAmount,
      totalPaid,
      balance,
      rows,
    };
  }, [leadProfile, dealBaseAmount]);

  // ---------- Calculate additional charges total ----------
  useEffect(() => {
    const total = additionalCharges.reduce((sum, charge) => {
      return sum + (Number(charge.amount) || 0);
    }, 0);
    setAdditionalChargesTotal(total);
  }, [additionalCharges]);

  // Auto calculate agreement value from base rate × (carpet + balcony if entered)
  useEffect(() => {
    if (agreementTouched) return; // user manual mode

    const rate = Number(baseRateDisplay) || 0;
    const carpet = Number(carpetSqft) || 0;
    const balcony = Number(balconySqft) || 0;

    if (!rate || !carpet) {
      setAgreementValue("");
      return;
    }

    // Use carpet + balcony if balcony is entered, otherwise just carpet
    const area = balcony > 0 ? carpet + balcony : carpet;
    const total = Math.round(rate * area);
    setAgreementValue(String(total));
  }, [baseRateDisplay, carpetSqft, balconySqft, agreementTouched]);
  // When project or parkingCount changes → load backend amount
  useEffect(() => {
    if (parkingRequired !== "YES") return;
    if (!project?.price_per_parking) return;
    if (!parkingCount) return;

    // backend amount default
    const backendPrice = Number(project.price_per_parking);

    // Set price only if user has not edited
    if (!parkingAmount) {
      setParkingAmount(String(backendPrice));
    }
  }, [project, parkingRequired, parkingCount]);

  useEffect(() => {
    if (parkingRequired !== "YES") return;

    const amt = Number(parkingAmount) || 0;
    const count = Number(parkingCount) || 0;

    setParkingTotal(String(amt * count));
  }, [parkingAmount, parkingCount, parkingRequired]);

  // Function to refresh lead profile (to update payments after creation)
  const refreshLeadProfile = async () => {
    if (!leadId) return;
    try {
      const res = await axiosInstance.get(
        `/sales/sales-leads/${leadId}/full-info/`
      );
      const data = res.data || {};
      setLeadProfile(data);
    } catch (err) {
      console.error("Failed to refresh lead profile", err);
    }
  };

  useEffect(() => {
    if (!leadId) return;

    const fetchLeadProfile = async () => {
      try {
        const res = await axiosInstance.get(
          `/sales/sales-leads/${leadId}/full-info/`
        );
        const data = res.data || {};

        // 🔒 IMPORTANT: validate URL project_id with lead.project
        if (projectIdFromUrl && data.project) {
          const urlPid = Number(projectIdFromUrl);
          const leadPid = Number(data.project);

          if (urlPid !== leadPid) {
            toast.error("Cannot Book Flat Without Any Relation To Lead");
            navigate("/leads");
            return; // stop here
          }
        }

        setLeadProfile(data);

        // ---- Primary name ----
        const fullName =
          data.full_name ||
          `${data.first_name || ""} ${data.last_name || ""}`.trim();
        if (fullName) {
          setPrimaryFullName(fullName);
        }

        // ---- Contact ----
        if (data.email) setEmail1(data.email);
        if (data.mobile_number) setPhone1(data.mobile_number);

        // ---- Primary DOB ----
        if (data.personal_info?.date_of_birth) {
          setPrimaryDob(data.personal_info.date_of_birth);
        }

        // ---- Address ----
        if (data.address) {
          const addr = data.address;
          const parts = [
            addr.flat_or_building,
            addr.area,
            addr.city,
            addr.state,
            addr.country,
            addr.pincode,
          ].filter(Boolean);

          if (parts.length) {
            const fullAddr = parts.join(", ");
            setPermanentAddress((prev) => prev || fullAddr);
            setCorrespondenceAddress((prev) => prev || fullAddr);
          }
        }

        // ---- Office info → office field ----
        if (data.professional_info) {
          const p = data.professional_info;

          const locationPart =
            p.office_location && p.office_pincode
              ? `${p.office_location} - ${p.office_pincode}`
              : p.office_location || p.office_pincode;

          const officeParts = [
            p.occupation_name,
            p.organization_name,
            locationPart,
          ].filter(Boolean);

          const officeText = officeParts.join(", ");
          if (officeText) {
            setOffice((prev) => prev || officeText);
          }
        }

        // ---- Project from lead (if you still want to sync local state) ----
        if (data.project) {
          const pid = data.project;
          setProjectId(pid);
          localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
          localStorage.setItem("PROJECT_ID", String(pid));
        }
      } catch (err) {
        console.error("Failed to load lead full-info", err);

        // 🔒 If lead not found / inaccessible → treat as "no relation"
        const status = err?.response?.status;
        if (status === 404 || status === 403) {
          toast.error("Cannot Book Flat Without Any Relation To Lead");
          navigate("/leads");
        }
      }
    };

    fetchLeadProfile();
  }, [leadId, projectIdFromUrl, navigate]);

  // ---------- Autofill tower/unit from lead's interested units ----------
  useEffect(() => {
    if (
      !leadProfile ||
      !leadProfile.interested_unit_links ||
      leadProfile.interested_unit_links.length === 0 ||
      !towers.length
    ) {
      setInterestedUnitError("");
      return;
    }

    // pick primary interested unit if flagged, else first
    const primaryLink =
      leadProfile.interested_unit_links.find((l) => l.is_primary) ||
      leadProfile.interested_unit_links[0];

    if (!primaryLink) {
      setInterestedUnitError("");
      return;
    }

    const unitId = String(primaryLink.unit);
    let foundTowerId = null;
    let selectedUnitFromLead = null;

    towers.forEach((tower) => {
      (tower.floors || []).forEach((floor) => {
        (floor.units || []).forEach((unit) => {
          if (String(unit.id) === unitId) {
            foundTowerId = String(tower.id);
            selectedUnitFromLead = unit;
          }
        });
      });
    });

    if (foundTowerId && selectedUnitFromLead) {
      setSelectedTowerId(foundTowerId);
      setSelectedUnitId(unitId);

      const inv = selectedUnitFromLead.inventory || {};
      const unitStatus = selectedUnitFromLead.status;
      const invUnitStatus = inv.unit_status;
      const availabilityStatus = inv.availability_status;

      const isAvailable =
        unitStatus === "AVAILABLE" &&
        invUnitStatus === "AVAILABLE" &&
        availabilityStatus === "AVAILABLE";

      if (!isAvailable) {
        setInterestedUnitError(
          `Lead interested unit ${selectedUnitFromLead.unit_no} is not available. Please select another unit.`
        );
        setUnitOpen(true); // dropdown khul jaayega
      } else {
        setInterestedUnitError("");
      }
    } else {
      setInterestedUnitError("");
    }
  }, [leadProfile, towers]);

  // ---------- Calculate amount before taxes ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;
    const additionalTotal = Number(additionalChargesTotal) || 0;

    // Include parking in pre-tax amount so totals respond to parking changes
    const parkingTotalNumber =
      parkingRequired === "YES" ? Number(parkingTotal) || 0 : 0;

    setAmountBeforeTaxes(baseValue + additionalTotal + parkingTotalNumber);
  }, [agreementValue, additionalChargesTotal, parkingTotal, parkingRequired]);

  // ---------- Calculate taxes based on amount before taxes ----------
  useEffect(() => {
    if (!costTemplate) {
      setGstAmount(0);
      setStampDutyAmount(0);
      setTotalTaxes(0);
      return;
    }

    // Base for GST and Stamp Duty: unit cost + additional charges + parking total
    const unitCost = Number(agreementValue || 0);
    const additionalTotal = Number(additionalChargesTotal) || 0;
    const parkingTotalNumber =
      parkingRequired === "YES" ? Number(parkingTotal) || 0 : 0;
    const baseForTaxes = unitCost + additionalTotal + parkingTotalNumber;

    const gstPercent = Number(costTemplate.gst_percent) || 0;
    const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
    const regAmount = Number(costTemplate.registration_amount) || 0;
    const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

    const calcGst = gstEnabled ? (baseForTaxes * gstPercent) / 100 : 0;
    const calcStamp = stampDutyEnabled
      ? (baseForTaxes * stampPercent) / 100
      : 0;
    const calcReg = registrationEnabled ? regAmount : 0;
    const calcLegal = legalFeeEnabled ? legalAmount : 0;

    const calcTotal = calcGst + calcStamp + calcReg + calcLegal;

    setGstAmount(calcGst);
    setStampDutyAmount(calcStamp);
    setTotalTaxes(calcTotal);
  }, [
    agreementValue,
    additionalChargesTotal,
    parkingTotal,
    parkingRequired,
    costTemplate,
    gstEnabled,
    stampDutyEnabled,
    registrationEnabled,
    legalFeeEnabled,
  ]);

  // ---------- Calculate offer discount and final amount ----------
  useEffect(() => {
    const beforeDiscount = Number(amountBeforeTaxes) || 0;
    const taxes = Number(totalTaxes) || 0;
    const totalWithTaxes = beforeDiscount + taxes;

    let discount = 0;

    if (selectedOfferData) {
      if (selectedOfferData.percentage) {
        discount =
          (totalWithTaxes * Number(selectedOfferData.percentage)) / 100;
      } else if (selectedOfferData.amount) {
        discount = Number(selectedOfferData.amount);
      }
    }

    setOfferDiscountValue(discount);
    setFinalAmount(totalWithTaxes - discount);
  }, [amountBeforeTaxes, totalTaxes, selectedOfferData]);

  // ---------- Calculate additional charge amounts based on type ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;

    setAdditionalCharges((prev) =>
      prev.map((charge) => {
        if (!charge.value) return { ...charge, amount: 0 };

        if (charge.type === "PERCENTAGE") {
          const amount = (baseValue * Number(charge.value)) / 100;
          return { ...charge, amount };
        } else {
          // FIXED
          return { ...charge, amount: Number(charge.value) || 0 };
        }
      })
    );
  }, [agreementValue]);
  // --------- Funding / advance ----------
  const [loanRequired, setLoanRequired] = useState("NO"); // YES / NO
  const [bookingAmount, setBookingAmount] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [projectPricePerSqft, setProjectPricePerSqft] = useState("");

  // Top photo
  const [photoFile, setPhotoFile] = useState(null);

  // --------- Additional applicants (dynamic, UI-only for now) ----------
  const [additionalApplicants, setAdditionalApplicants] = useState([
    { full_name: "", relation: "", dob: "", aadhar: "", pan: "" },
  ]);

  // --------- All upload files ----------
  const [files, setFiles] = useState({
    primaryPanFront: null,
    primaryPanBack: null,
    primaryAadharFront: null,
    primaryAadharBack: null,

    secondAadharFront: null,
    secondAadharBack: null,
    secondPanFront: null,
    secondPanBack: null,

    thirdAadharFront: null,
    thirdAadharBack: null,
    thirdPanFront: null,
    thirdPanBack: null,

    fourthAadharFront: null,
    fourthAadharBack: null,
    fourthPanFront: null,
    fourthPanBack: null,

    kycPan: null,
    kycAadhar: null,
  });

  // const handleFileChange = (key) => (e) => {
  //   const file = e.target.files && e.target.files[0];
  //   if (!file) return;
  //   setFiles((prev) => ({ ...prev, [key]: file }));
  // };

  const totalAdvanceNumber =
    Number(bookingAmount || 0) + Number(otherCharges || 0);
  const totalAdvance = totalAdvanceNumber || "";

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------- Load MY_SCOPE projects (localStorage + API fallback) ----------
  useEffect(() => {
    let projectsFromLS = [];
    try {
      const raw = localStorage.getItem("MY_SCOPE");
      if (raw) {
        const parsed = JSON.parse(raw);
        projectsFromLS = parsed.projects || [];
        setScopeProjects(projectsFromLS);
      }
    } catch (err) {
      console.error("Failed to parse MY_SCOPE from localStorage", err);
    }

    // Fallback: direct API if MY_SCOPE empty
    if (projectsFromLS.length === 0) {
      (async () => {
        try {
          const res = await axiosInstance.get("/client/my-scope/");
          const data = res.data || {};
          const projs = data.projects || [];
          setScopeProjects(projs);
          try {
            localStorage.setItem("MY_SCOPE", JSON.stringify(data));
          } catch {}
        } catch (err) {
          console.error("Failed to load projects from my-scope", err);
        }
      })();
    }
  }, []);

  // ---------- When URL / scopeProjects / projectId change → set selected project ----------
  useEffect(() => {
    const idParam = searchParams.get("project_id");

    if (idParam) {
      const pid = Number(idParam);
      setProjectId(pid);

      localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
      localStorage.setItem("PROJECT_ID", String(pid));

      const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
      const displayName = proj
        ? proj.name || `Project #${proj.id}`
        : `Project #${pid}`;
      setProjectName(displayName);
    } else if (projectId) {
      const pid = Number(projectId);
      const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
      const displayName = proj
        ? proj.name || `Project #${proj.id}`
        : `Project #${pid}`;
      setProjectName(displayName);
    }
  }, [searchParams, scopeProjects, projectId]);

  // ---------- Read user from localStorage ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  const currentProjectLabel =
    projectName || (projectId ? `Project #${projectId}` : "Select a project");

  const handleProjectCardSelect = (proj) => {
    const pid = Number(proj.id);
    setProjectId(pid);
    const displayName = proj.name || `Project #${proj.id}`;
    setProjectName(displayName);

    localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
    localStorage.setItem("PROJECT_ID", String(pid));
  };

  // ---------- Fetch booking-setup data whenever projectId changes ----------
  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setTowers([]);
      setPaymentPlans([]);
      setLoading(false);
      return;
    }

    const fetchSetup = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get("/client/booking-setup/", {
          params: { project_id: projectId },
        });
        setProject(res.data.project || null);
        if (res.data.project?.price_per_parking) {
          setPricePerParking(Number(res.data.project.price_per_parking) || 0);
        }
        setTowers(res.data.towers || []);
        setPaymentPlans(res.data.payment_plans || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load booking setup. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetup();
  }, [projectId]);

  // ---------- Close dropdowns on outside click ----------
  useEffect(() => {
    const handler = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setTowerOpen(false);
        setUnitOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ---------- Derived tower + unit ----------
  const selectedTower = towers.find(
    (t) => String(t.id) === String(selectedTowerId)
  );

  const towerUnits = useMemo(() => {
    if (!selectedTower) return [];
    const units = [];
    (selectedTower.floors || []).forEach((floor) => {
      (floor.units || []).forEach((u) => {
        units.push({
          ...u,
          floor_number: floor.number,
        });
      });
    });
    return units;
  }, [selectedTower]);

  const selectedUnit = towerUnits.find(
    (u) => String(u.id) === String(selectedUnitId)
  );

  // ---------- Fetch cost template & offers when leadId is available ----------
  useEffect(() => {
    if (!leadId) {
      setCostTemplate(null);
      setOffers([]);
      return;
    }

    const fetchCostData = async () => {
      try {
        const res = await axiosInstance.get(`/costsheet/lead/${leadId}/init/`);
        const data = res.data || {};

        // Store template data
        const template = data.template || {};
        setCompanyLogoUrl(template.company_logo_url || "");
        setCompanyName(template.company_name || "");
        setCostTemplate({
          gst_percent: template.gst_percent || 0,
          stamp_duty_percent: template.stamp_duty_percent || 0,
          registration_amount: template.registration_amount || 0,
          legal_fee_amount: template.legal_fee_amount || 0,
          share_application_money_membership_fees:
            Number(template.share_application_money_membership_fees) || 0,
          development_charges_psf:
            Number(template.development_charges_psf) || 0,
          electrical_watern_n_all_charges:
            Number(template.electrical_watern_n_all_charges) || 0,
          provisional_maintenance_psf:
            Number(template.provisional_maintenance_psf) || 0,
          terms_and_conditions: template.terms_and_conditions || "",
          provisional_maintenance_months:
            template.provisional_maintenance_months || "",
        });

        // Initialize editable fields from template
        if (template.development_charges_psf) {
          setDevelopmentChargesPsf(String(template.development_charges_psf));
        } else {
          setDevelopmentChargesPsf("500"); // Default 500 if not provided
        }
        if (template.provisional_maintenance_months) {
          setProvisionalMaintenanceMonths(
            Number(template.provisional_maintenance_months) || 6
          );
        } else {
          setProvisionalMaintenanceMonths(6); // default
        }

        // Store company logo and name
        setCompanyLogoUrl(template.company_logo_url || "");
        setCompanyName(template.company_name || "");

        // Store offers
        setOffers(data.offers || []);

        if (data.project) {
          if (data.project.price_per_sqft) {
            setBaseRateDisplay(String(data.project.price_per_sqft)); // shows 51,599 on mount
          }
          if (data.project.price_per_parking) {
            setPricePerParking(Number(data.project.price_per_parking) || 0);
          }
          if (data.project?.address) {
            setOffice((prev) => prev || data.project.address);
          }
        }
        // Optional: Update payment plans if different from project-level
        if (data.payment_plans && data.payment_plans.length > 0) {
          setPaymentPlans(data.payment_plans);
        }
      } catch (err) {
        console.error("Failed to fetch cost template & offers:", err);
        // Don't block form if this fails
      }
    };

    fetchCostData();
  }, [leadId]);

  // ---------- KYC status refresh ----------
  const handleRefreshKycStatus = async () => {
    if (!kycRequestId) {
      alert("No KYC request found. Please send KYC request first.");
      return;
    }

    try {
      const res = await axiosInstance.get(
        `${BOOK_API_PREFIX}/kyc-requests/${kycRequestId}/`
      );
      const data = res.data || {};

      setKycRequestStatus(data.status || "PENDING");

      if (data.status === "APPROVED") {
        alert("KYC has been APPROVED. You can proceed with booking.");
      } else if (data.status === "REJECTED") {
        alert("KYC has been REJECTED. Please review with admin.");
      } else {
        // PENDING
        alert("KYC is still pending with admin.");
      }
    } catch (err) {
      console.error("Failed to refresh KYC status", err);
      if (err?.response?.data) {
        alert(
          "Failed to refresh KYC status.\n" +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        alert("Failed to refresh KYC status. Please try again.");
      }
    }
  };

  const handleAdditionalApplicantChange = (index, field, value) => {
    setAdditionalApplicants((prev) =>
      prev.map((app, i) => (i === index ? { ...app, [field]: value } : app))
    );
  };

  const handleAddAdditionalApplicant = () => {
    setAdditionalApplicants((prev) => [
      ...prev,
      { full_name: "", relation: "", dob: "", aadhar: "", pan: "" }, // ✅ Include all fields
    ]);
  };

  const handleAddAdditionalCharge = () => {
    setAdditionalCharges((prev) => [
      ...prev,
      { name: "", type: "FIXED", value: "", amount: 0 },
    ]);
  };

  const handleUpdateAdditionalCharge = (index, field, value) => {
    setAdditionalCharges((prev) =>
      prev.map((charge, idx) => {
        if (idx !== index) return charge;

        const updated = { ...charge, [field]: value };

        // Recalculate amount when value or type changes
        if (field === "value" || field === "type") {
          const baseValue = Number(agreementValue) || 0;
          const chargeValue = field === "value" ? value : charge.value;
          const chargeType = field === "type" ? value : charge.type;

          if (chargeType === "PERCENTAGE") {
            updated.amount = (baseValue * Number(chargeValue || 0)) / 100;
          } else {
            updated.amount = Number(chargeValue || 0);
          }
        }

        return updated;
      })
    );
  };

  const handleRemoveAdditionalCharge = (index) => {
    if (additionalCharges.length === 1) return;
    setAdditionalCharges((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ---------- KYC request create ----------
  const handleSendKycRequest = async () => {
    if (!selectedUnitId) {
      toast.error("Please select a unit before sending KYC request.");
      return;
    }
    if (!project?.id) {
      toast.error("Project is missing – cannot create KYC request.");
      return;
    }
    if (!kycDealAmount || Number(kycDealAmount) <= 0) {
      toast.error("Please enter a valid deal amount for KYC.");
      return;
    }

    try {
      // backend expects: { project_id, unit_id, amount }
      const payload = {
        project_id: project.id,
        unit_id: selectedUnitId,
        amount: Number(kycDealAmount),
      };

      const res = await axiosInstance.post(
        `${BOOK_API_PREFIX}/kyc-requests/`,
        payload
      );
      const data = res.data || {};

      setKycRequestId(data.id);
      setKycRequestStatus(data.status || "PENDING");

      alert("KYC request sent to project admin.");
    } catch (err) {
      console.error("Failed to create KYC request", err);
      if (err?.response?.data) {
        alert(
          "Failed to send KYC request.\n" +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        alert("Failed to send KYC request. Please try again.");
      }
    }
  };

  // ---------- Calculate costs whenever agreementValue or template changes ----------
  // useEffect(() => {
  //   if (!agreementValue || !costTemplate) {
  //     setGstAmount(0);
  //     setStampDutyAmount(0);
  //     setTotalTaxes(0);
  //     return;
  //   }

  //   const baseValue = Number(agreementValue) || 0;
  //   const gstPercent = Number(costTemplate.gst_percent) || 0;
  //   const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
  //   const regAmount = Number(costTemplate.registration_amount) || 0;
  //   const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

  //   const calcGst = (baseValue * gstPercent) / 100;
  //   const calcStamp = (baseValue * stampPercent) / 100;
  //   const calcTotal = calcGst + calcStamp + regAmount + legalAmount;

  //   setGstAmount(calcGst);
  //   setStampDutyAmount(calcStamp);
  //   setTotalTaxes(calcTotal);
  // }, [agreementValue, costTemplate]);

  // ---------- Calculate offer discount and final amount ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;
    const taxes = Number(totalTaxes) || 0;
    const amountBeforeDiscount = baseValue + taxes;

    let discount = 0;

    if (selectedOfferData) {
      if (selectedOfferData.percentage) {
        // Percentage-based discount
        discount =
          (amountBeforeDiscount * Number(selectedOfferData.percentage)) / 100;
      } else if (selectedOfferData.amount) {
        // Flat amount discount
        discount = Number(selectedOfferData.amount);
      }
    }

    setOfferDiscountValue(discount);
    setFinalAmount(amountBeforeDiscount - discount);
  }, [agreementValue, totalTaxes, selectedOfferData]);

  // ---------- Update selected offer data when offer changes ----------
  useEffect(() => {
    if (!selectedOfferId) {
      setSelectedOfferData(null);
      return;
    }
    const offer = offers.find((o) => String(o.id) === String(selectedOfferId));
    setSelectedOfferData(offer || null);
  }, [selectedOfferId, offers]);

  // Amount helpers
  const stripAmount = (value) => {
    if (!value) return "";
    // Sirf digits + ek dot allow
    return value.replace(/[^\d.]/g, "");
  };

  const formatINR = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(String(value));
    if (Number.isNaN(num)) return "";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // // Auto-fill KYC deal amount from agreement value if empty
  // useEffect(() => {
  //   if (!kycDealAmount && agreementValue) {
  //     setKycDealAmount(agreementValue);
  //   }
  // }, [agreementValue, kycDealAmount]);

  // When unit changes → auto-fill areas + base agreement value from inventory
  // Agreement value auto-suggestion from inventory, but always editable
  // BookingForm.jsx

  // ... (Your existing code to derive selectedUnit)

  // ---------- THE FIX: Unit Data Autofill useEffect ----------
  useEffect(() => {
    // 1. Exit if no unit is selected
    if (!selectedUnit) {
      // Clear relevant fields if no unit is selected
      setCarpetSqft("");
      setSuperBuiltupSqft("");
      setBalconySqft("");
      setBaseRateDisplay("");
      setAgreementTouched(false); // Reset to allow auto-calculation when a unit IS picked
      // You may also clear other related fields here (e.g., parking)
      return;
    }

    const inventory = selectedUnit.inventory || {};

    // 2. Load Unit Area Data into state
    // This update triggers your existing Agreement Value calculation useEffect
    setCarpetSqft(
      String(inventory.carpet_area || inventory.rera_area_sqft || "")
    );
    setSuperBuiltupSqft(String(inventory.super_builtup_area || ""));
    setBalconySqft(
      String(
        inventory.balcony_area ||
          inventory.balcony_area_sqft ||
          inventory.balcony_sqft ||
          ""
      )
    );

    // 3. Load Base Rate Data into state
    // Use price_per_sqft first, or fallback to inventory-level rates
    const rateToDisplay =
      inventory.price_per_sqft ||
      inventory.rate_psf ||
      inventory.base_price_psf;

    if (rateToDisplay) {
      setBaseRateDisplay(String(rateToDisplay));
      // Set agreementTouched to false so the agreement value calculation runs
      setAgreementTouched(false);
    } else {
      setBaseRateDisplay("");
    }

    // 4. (Optional) Load Parking Details
    // setParkingRequired(inventory.has_parking ? "YES" : "NO");
    // setParkingCount(String(inventory.parking_count || "1"));
    // setParkingDetails(inventory.parking_details || "");
  }, [selectedUnit]); // Dependency on selectedUnit ensures this runs when a unit is picked

  // Auto-generate agreement value in words
  useEffect(() => {
    if (agreementValue) {
      const words = numberToWords(Math.floor(Number(agreementValue)));
      setAgreementValueWords(words);
    } else {
      setAgreementValueWords("");
    }
  }, [agreementValue]);

  // ✅ Carpet / Super Built-up change hone par Agreement Value auto-calc (editable till user touches)
  useEffect(() => {
    if (!selectedUnit) return;

    const inv = selectedUnit.inventory || {};
    const ratePsf = inv.rate_psf || inv.base_price_psf;

    if (!ratePsf) return; // per sq.ft hi nahi mila
    if (!agreementEditable) return; // inventory direct amount mode
    if (agreementTouched) return; // user ne manually Agreement Value change kar diya

    // Ab carpet ya super built-up dono me se jo diya ho use as area
    // If balcony is entered, add it to the area
    const baseArea = Number(carpetSqft || superBuiltupSqft || 0);
    const balcony = Number(balconySqft || 0);
    const area = balcony > 0 ? baseArea + balcony : baseArea;
    if (!area) return;

    const baseAmount = Number(ratePsf) * area;
    const discount = Number(discountAmount) || 0;
    const finalAmount = baseAmount - discount;

    setAgreementValue(String(Math.round(finalAmount)));
    setAgreementValueWords(numberToWords(Math.floor(finalAmount)));
  }, [
    carpetSqft,
    superBuiltupSqft,
    balconySqft,
    discountAmount,
    selectedUnit,
    agreementEditable,
    agreementTouched,
  ]);

  // Calculate discount amount from percentage or vice versa
  // ✅ Discount (%) <-> Amount sync + sahi base se calculation
  useEffect(() => {
    if (!selectedUnit) return;

    const inv = selectedUnit.inventory || {};

    // 1) Pehle direct agreement / total cost dekho
    let basePrice = Number(
      inv.total_cost || inv.agreement_value || selectedUnit.agreement_value || 0
    );

    // 2) Agar direct amount nahi hai, to rate_per_sqft * area se nikalo
    const ratePsf = inv.rate_psf || inv.base_price_psf || null;
    const area = Number(
      carpetSqft ||
        superBuiltupSqft ||
        inv.saleable_sqft ||
        inv.builtup_sqft ||
        inv.rera_area_sqft ||
        0
    );

    if (!basePrice && ratePsf && area) {
      basePrice = Number(ratePsf) * area;
    }

    // 3) Last fallback: current agreementValue ko base maan lo
    if (!basePrice) {
      basePrice = Number(agreementValue) || 0;
    }

    if (!basePrice) return; // kuch bhi base nahi mila

    if (discountPercent && !discountAmount) {
      // % diya hai → amount nikaalo
      const calculatedAmount = (basePrice * Number(discountPercent)) / 100;
      setDiscountAmount(calculatedAmount.toFixed(2));
    } else if (discountAmount && !discountPercent) {
      // amount diya hai → % nikaalo
      const calculatedPercent = (Number(discountAmount) / basePrice) * 100;
      setDiscountPercent(calculatedPercent.toFixed(2));
    }
  }, [
    discountPercent,
    discountAmount,
    selectedUnit,
    carpetSqft,
    superBuiltupSqft,
    agreementValue,
  ]);

  // ---------- Payment plan helpers ----------
  const selectedPaymentPlan = paymentPlans.find(
    (p) => String(p.id) === String(selectedPaymentPlanId)
  );
  // total percentage for master plan
  const masterTotalPercentage = useMemo(
    () => masterSlabs.reduce((sum, s) => sum + Number(s.percentage || 0), 0),
    [masterSlabs]
  );

  // plan selection → MASTER or CUSTOM
  const handlePaymentPlanChange = (e) => {
    const value = e.target.value;

    if (value === "__CUSTOM__") {
      setPaymentPlanType("CUSTOM");
      setSelectedPaymentPlanId("");
      setMasterSlabs([]);
    } else {
      setPaymentPlanType("MASTER");
      setSelectedPaymentPlanId(value);
    }
  };

  const handleMasterSlabChange = (index, field, value) => {
    setMasterSlabs((prev) => {
      const next = [...prev];
      const slab = { ...next[index] };

      if (field === "name") {
        slab.name = value;
      }

      if (field === "percentage") {
        // ✅ Integer only - no decimals, no leading zeros
        const cleaned = value.replace(/[^\d]/g, ""); // Remove non-digits
        const p = cleaned ? Math.floor(Number(cleaned)) : 0;
        slab.percentage = p;
        // ✅ auto-recalculate amount from %
        slab.amount =
          paymentPlanBaseAmount > 0 ? (paymentPlanBaseAmount * p) / 100 : 0;
      }

      if (field === "amount") {
        const a = Number(value) || 0;
        slab.amount = a;
        // ✅ auto-recalculate % from amount (integer only)
        slab.percentage =
          paymentPlanBaseAmount > 0 && a > 0
            ? Math.floor((a / paymentPlanBaseAmount) * 100)
            : slab.percentage;
      }

      if (field === "due_date") {
        slab.due_date = value;
      }

      if (field === "days") {
        slab.days = value;
      }

      next[index] = slab;
      return next;
    });
  };

  const handleRemoveMasterSlab = (index) => {
    setMasterSlabs((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ---- EXISTING CUSTOM LOGIC (keep as is) ----
  const handleAddCustomSlab = () => {
    setCustomSlabs((prev) => [...prev, { name: "", percentage: "", days: "" }]);
  };

  const handleUpdateCustomSlab = (index, field, value) => {
    setCustomSlabs((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated = { ...row };

        if (field === "percentage") {
          // ✅ Integer only - no decimals, no leading zeros
          const cleaned = value.replace(/[^\d]/g, ""); // Remove non-digits
          updated[field] = cleaned ? Math.floor(Number(cleaned)) : "";
        } else {
          updated[field] = value;
        }

        return updated;
      })
    );
  };

  const handleRemoveCustomSlab = (index) => {
    setCustomSlabs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const customTotalPercentage = customSlabs.reduce(
    (sum, row) => sum + Number(row.percentage || 0),
    0
  );

  // Helper function to convert number to words (Indian format)
  const numberToWords = (num) => {
    if (!num || num === 0) return "Zero Rupees Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand > 0)
      result += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim() + " Rupees Only";
  };

  // ✅ ADD THIS ENTIRE BLOCK
  // Calculate all applicants (including primary)
  const allApplicants = useMemo(() => {
    const applicants = [
      {
        sequence: 1,
        title: primaryTitle,
        full_name: primaryFullName,
        dob: primaryDob,
        pan: primaryPanNo,
        aadhar: primaryAadharNo,
        email: email1,
        phone: phone1,
        isPrimary: true,
      },
    ];

    additionalApplicants.forEach((app, idx) => {
      if (app.full_name && app.full_name.trim()) {
        applicants.push({
          sequence: idx + 2,
          title: "Mr.",
          full_name: app.full_name,
          relation: app.relation,
          dob: app.dob,
          pan: app.pan,
          aadhar: app.aadhar,
          isPrimary: false,
        });
      }
    });

    return applicants;
  }, [
    primaryTitle,
    primaryFullName,
    primaryDob,
    primaryPanNo,
    primaryAadharNo,
    email1,
    phone1,
    additionalApplicants,
  ]);

  const payments = useMemo(
    () =>
      leadProfile && Array.isArray(leadProfile.payments)
        ? leadProfile.payments
        : [],
    [leadProfile]
  );

  const totalClearedPaid = useMemo(() => {
    if (!payments.length) return 0;

    return payments.reduce((sum, p) => {
      if (!p || !p.amount) return sum;

      const status = String(p.status || "").toUpperCase();
      if (status === "PENDING") {
        // do NOT minus pending
        return sum;
      }

      return sum + Number(p.amount || 0);
    }, 0);
  }, [payments]);

  const netPayableAfterReceipts = useMemo(() => {
    const gross = Number(finalAmount || 0);
    return gross - totalClearedPaid;
  }, [finalAmount, totalClearedPaid]);

  // UPDATE paymentPlanBaseAmount
  const paymentPlanBaseAmount = useMemo(() => {
    const grandTotal = Number(finalAmount || 0);
    const kycAmount = requiresKyc === "YES" ? Number(kycDealAmount || 0) : 0;
    return grandTotal - kycAmount;
  }, [finalAmount, requiresKyc, kycDealAmount]);

  useEffect(() => {
    if (!selectedPaymentPlan || !selectedPaymentPlan.slabs) {
      setMasterSlabs([]);
      return;
    }

    // Load slabs from selected master plan + pre-compute amount
    const editable = selectedPaymentPlan.slabs.map((s) => {
      // ✅ Integer only - no decimals
      const percentage = Math.floor(Number(s.percentage || 0));
      const computedAmount =
        paymentPlanBaseAmount > 0
          ? (paymentPlanBaseAmount * percentage) / 100
          : 0;

      return {
        id: s.id,
        order_index: s.order_index,
        name: s.name,
        percentage,
        amount: computedAmount, // ✅ amount set on load
        days: s.days ?? "",
        due_date: s.due_date || "",
      };
    });

    setMasterSlabs(editable);
  }, [selectedPaymentPlan, paymentPlanBaseAmount]); // ✅ depend on base amount also

  const termsList = useMemo(() => {
    if (!costTemplate?.terms_and_conditions) return [];
    const raw = String(costTemplate.terms_and_conditions).trim();
    if (!raw) return [];
    return raw
      .split(/\r?\n\r?\n+/) // split on blank lines
      .map((p) => p.replace(/^\d+\.\s*/, "").trim()) // drop leading "1. "
      .filter(Boolean);
  }, [costTemplate]);

  // UPDATED possessionCharges useMemo - WITHOUT PARKING
  // Location: BookingForm.jsx (around line ~1400)
  // Replace entire useMemo with this
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const possessionCharges = useMemo(() => {
    if (!costTemplate) return null;

    // Match CostSheet calculation: development_charges_psf is applied on total
    // pricing area (carpet + balcony where balcony pricing is enabled). Fall
    // back to super built-up if nothing is provided to avoid a 0 multiplier.
    const carpet = Number(carpetSqft || 0);
    const balcony = Number(balconySqft || 0);
    const superBuiltUp = Number(superBuiltupSqft || 0);
    const isBalconyCarpetPricing = project?.is_pricing_balcony_carpert === true;

    // Total area used for all PSF possession charges (dev + provisional)
    const totalAreaForCharges =
      (isBalconyCarpetPricing ? carpet + balcony : carpet) ||
      carpet + balcony ||
      superBuiltUp;

    // Share Application Fees (flat) - NOT included in GST base
    const shareFee = Number(
      costTemplate.share_application_money_membership_fees || 0
    );

    // Development Charges @ PSF × total area (use editable value, minimum 1, default 500)
    const devPsqf = Math.max(
      1,
      Number(
        developmentChargesPsf || costTemplate.development_charges_psf || 500
      )
    );
    const devAmount = devPsqf * totalAreaForCharges;

    // Electrical, Water, Gas (flat)
    const electrical = Number(
      costTemplate.electrical_watern_n_all_charges || 0
    );

    // Provisional Maintenance @ PSF × total area × months (use editable value)
    const provPsqf = Number(costTemplate.provisional_maintenance_psf || 0);
    const provMonths = Number(
      provisionalMaintenanceMonths ||
        costTemplate.provisional_maintenance_months ||
        6
    );
    const provAmount = provPsqf * totalAreaForCharges * provMonths;

    // Legal & Compliance Charges (flat)
    const legalAmount = legalFeeEnabled
      ? Number(costTemplate.legal_fee_amount || 0)
      : 0;

    // Base for GST: Legal + Development + Electrical + Provisional Maintenance
    const baseForGst = legalAmount + devAmount + electrical + provAmount;

    // GST on possession (18%) - applied on baseForGst
    const possessionGst = (baseForGst * 18) / 100;

    // Total with GST (includes shareFee which is not in GST base)
    const totalWithGst = shareFee + baseForGst + possessionGst;

    return {
      shareFee,
      devPsqf,
      devAmount,
      electrical,
      provPsqf,
      provAmount,
      provMonths,
      totalAreaForCharges,
      legalAmount,
      baseForGst,
      possessionGst,
      total: baseForGst,
      totalWithGst,
    };
  }, [
    costTemplate,
    carpetSqft,
    balconySqft,
    superBuiltupSqft,
    project,
    legalFeeEnabled,
    developmentChargesPsf,
    provisionalMaintenanceMonths,
  ]);

  const effectiveBaseRate = useMemo(() => {
    const netBase = Number(agreementValue || 0); // after discount
    const area = Number(carpetSqft || 0); // carpet area

    if (!netBase || !area) return 0;

    return netBase / area;
  }, [agreementValue, carpetSqft]);

  // useEffect(() => {
  //   if (effectiveBaseRate > 0) {
  //     setBaseRateDisplay(effectiveBaseRate.toFixed(2)); // ✅ override display
  //   }
  // }, [effectiveBaseRate]);

  // useEffect(() => {
  //   if (effectiveBaseRate > 0) {
  //     setBaseRateDisplay(effectiveBaseRate.toFixed(2)); // ✅ override display
  //   }
  // }, [effectiveBaseRate]);

  // ---------- Save Booking ----------
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPLETE handleSaveBooking FUNCTION
  // Location: BookingForm.jsx (around line 2600)
  // Replace entire function with this
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPLETE handleSaveBooking FUNCTION
  // Location: BookingForm.jsx (around line 2600)
  // Replace entire function with this
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleSaveBooking = async () => {
    // ---------- VALIDATIONS ----------
    if (!selectedUnitId) {
      toast.error("Please select a tower & flat (unit) before saving.");
      return;
    }

    if (!primaryPanNo || !validatePAN(primaryPanNo)) {
      toast.error("Please enter a valid PAN number for primary applicant.");
      return;
    }
    // Validate PAN card uploads (Front and Back are mandatory)
    if (!files.primaryPanFront) {
      toast.error(
        "Please upload PAN card front side image for primary applicant."
      );
      return;
    }
    if (!files.primaryPanBack) {
      toast.error(
        "Please upload PAN card back side image for primary applicant."
      );
      return;
    }
    if (!primaryAadharNo || !validateAadhar(primaryAadharNo)) {
      toast.error("Please enter a valid Aadhar number for primary applicant.");
      return;
    }
    // Validate Aadhar card uploads (Front and Back are mandatory)
    // if (!files.primaryAadharFront) {
    //   toast.error("Please upload Aadhar card front side image for primary applicant.");
    //   return;
    // }
    // if (!files.primaryAadharBack) {
    //   toast.error("Please upload Aadhar card back side image for primary applicant.");
    //   return;
    // }

    if (!files.primaryAadharFront) {
      toast.error(
        "Please upload Aadhar card front side image for primary applicant."
      );
      return;
    }
    if (!files.primaryAadharBack) {
      toast.error(
        "Please upload Aadhar card back side image for primary applicant."
      );
      return;
    }

    // NEW — block booking if no profile photo
    if (!photoFile) {
      toast.error("Please upload Profile Photo before saving the booking.");
      return;
    }

    if (email1 && !validateEmail(email1)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (phone1 && !validatePhone(phone1)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!bookingDate) {
      toast.error("Please select Booking Date.");
      return;
    }
    if (!agreementValue) {
      toast.error("Please enter Agreement Value.");
      return;
    }
    if (paymentPlanType === "MASTER" && !selectedPaymentPlanId) {
      toast.error("Please select a Payment Plan.");
      return;
    }
    if (paymentPlanType === "MASTER" && masterTotalPercentage !== 100) {
      toast.error(
        `Master payment plan slabs must total 100%. Current total: ${Math.floor(
          masterTotalPercentage
        )}%`
      );
      return;
    }
    if (paymentPlanType === "CUSTOM" && customTotalPercentage !== 100) {
      toast.error(
        `Custom payment plan slabs must total 100%. Current total: ${Math.floor(
          customTotalPercentage
        )}%`
      );
      return;
    }

    if (!primaryFullName) {
      toast.error("Please enter Primary Applicant full name.");
      return;
    }

    for (let i = 0; i < additionalApplicants.length; i++) {
      const app = additionalApplicants[i];
      if (app.full_name && app.full_name.trim()) {
        if (app.pan && !validatePAN(app.pan)) {
          toast.error(`Invalid PAN for applicant ${i + 2}: ${app.full_name}`);
          return;
        }
        if (app.aadhar && !validateAadhar(app.aadhar)) {
          toast.error(
            `Invalid Aadhar for applicant ${i + 2}: ${app.full_name}`
          );
          return;
        }

        // Validate PAN card uploads for additional applicants (if PAN is provided)
        if (app.pan && app.pan.trim()) {
          const filePrefix = ["second", "third", "fourth"][i];
          if (!files[`${filePrefix}PanFront`]) {
            toast.error(
              `Please upload PAN card front side image for applicant ${
                i + 2
              }: ${app.full_name}`
            );
            return;
          }
          if (!files[`${filePrefix}PanBack`]) {
            toast.error(
              `Please upload PAN card back side image for applicant ${i + 2}: ${
                app.full_name
              }`
            );
            return;
          }
        }

        // Validate Aadhar card uploads for additional applicants (if Aadhar is provided)
        if (app.aadhar && app.aadhar.trim()) {
          const filePrefix = ["second", "third", "fourth"][i];
          if (!files[`${filePrefix}AadharFront`]) {
            toast.error(
              `Please upload Aadhar card front side image for applicant ${
                i + 2
              }: ${app.full_name}`
            );
            return;
          }
          if (!files[`${filePrefix}AadharBack`]) {
            toast.error(
              `Please upload Aadhar card back side image for applicant ${
                i + 2
              }: ${app.full_name}`
            );
            return;
          }
        }
      }
    }

    // Sales user constraint
    if (currentUser?.role === "SALES" && !leadId) {
      toast.error("SALES user must link a lead. Open booking via Lead screen.");
      return;
    }

    if (requiresKyc === "YES") {
      if (!kycRequestId) {
        toast.error("Please send KYC request before saving booking.");
        return;
      }
    }

    setSaving(true);
    toast.info("Submitting booking...");

    try {
      const fd = new FormData();

      // ==================================================
      // BASIC INFO
      // ==================================================
      fd.append("unit_id", selectedUnitId);
      if (leadId) fd.append("sales_lead_id", String(leadId));

      fd.append("booking_date", bookingDate || "");
      fd.append("office_address", office || "");
      fd.append("status", status);

      // ==================================================
      // PRIMARY APPLICANT SNAPSHOT (Booking model)
      // ==================================================
      fd.append("primary_title", primaryTitle || "Mr.");
      fd.append("primary_full_name", primaryFullName || "");
      fd.append("primary_email", email1 || "");
      fd.append("primary_mobile_number", phone1 || "");
      fd.append("email_2", "");
      fd.append("phone_2", "");

      // ==================================================
      // ADDRESSES
      // ==================================================
      fd.append("permanent_address", permanentAddress || "");
      fd.append("correspondence_address", correspondenceAddress || "");
      fd.append("preferred_correspondence", preferredCorrespondence || "");
      fd.append("residential_status", residentialStatus || "");

      // ==================================================
      // FLAT INFO
      // ==================================================
      fd.append("super_builtup_sqft", superBuiltupSqft || "");
      fd.append("carpet_sqft", carpetSqft || "");
      fd.append("balcony_sqft", balconySqft || "");
      fd.append("agreement_value", agreementValue || "");
      fd.append("agreement_value_words", agreementValueWords || "");
      fd.append("agreement_done", agreementDone);
      const customerBaseRate = Number(stripAmount(baseRateDisplay)) || 0;
      fd.append("customer_base_price_psf", String(customerBaseRate));

      // ✅ PARKING - Calculate ALL values first, then append
      const parkingCountNum =
        parkingRequired === "YES" ? Number(parkingCount || 0) : 0;
      const parkingAmountPerUnit =
        parkingRequired === "YES" ? Number(parkingAmount || 0) : 0;
      const parkingTotalAmount = parkingCountNum * parkingAmountPerUnit;

      fd.append("parking_required", parkingRequired === "YES");
      fd.append("parking_details", parkingDetails || "");
      fd.append("parking_number", parkingNumber || "");
      fd.append("parking_count", String(parkingCountNum));
      fd.append("parking_amount_per_unit", String(parkingAmountPerUnit));
      fd.append("parking_total_amount", String(parkingTotalAmount));

      console.log("🚗 PARKING DATA:", {
        required: parkingRequired,
        count: parkingCountNum,
        amount_per: parkingAmountPerUnit,
        total: parkingTotalAmount,
      });

      // ==================================================
      // TAXES & DISCOUNTS
      // ==================================================
      fd.append("gst_no", gstNo || "");
      fd.append("discount_percent", discountPercent || "0");
      fd.append("discount_amount", discountAmount || "0");

      // Additional Charges Array (format: [{ label, amount }])
      const additionalChargesFormatted = additionalCharges
        .filter((charge) => charge.name && charge.amount > 0)
        .map((charge) => ({
          label: charge.name,
          amount: charge.amount.toFixed(2),
        }));

      // Send as FormData array using bracket notation (similar to applicants)
      additionalChargesFormatted.forEach((charge, index) => {
        fd.append(`additional_charges[${index}][label]`, charge.label);
        fd.append(`additional_charges[${index}][amount]`, charge.amount);
      });

      fd.append("additional_charges_total", additionalChargesTotal.toFixed(2));
      fd.append("amount_before_taxes", amountBeforeTaxes.toFixed(2));

      // ==================================================
      // COST TEMPLATE
      // ==================================================
      if (costTemplate) {
        fd.append("gst_percent", costTemplate.gst_percent || "0");
        fd.append("gst_enabled", gstEnabled);
        fd.append("gst_amount", gstAmount.toFixed(2));

        fd.append("stamp_duty_percent", costTemplate.stamp_duty_percent || "0");
        fd.append("stamp_duty_enabled", stampDutyEnabled);
        fd.append("stamp_duty_amount", stampDutyAmount.toFixed(2));

        fd.append(
          "registration_amount",
          costTemplate.registration_amount || "0"
        );
        fd.append("registration_enabled", registrationEnabled);
        fd.append("legal_fee_amount", costTemplate.legal_fee_amount || "0");
        fd.append("legal_fee_enabled", legalFeeEnabled);
      }

      // ==================================================
      // OFFER / TOTALS
      // ==================================================
      if (selectedOfferId) fd.append("offer_id", selectedOfferId);
      fd.append("offer_discount", offerDiscountValue.toFixed(2));
      fd.append("total_taxes", totalTaxes.toFixed(2));
      fd.append("final_amount", finalAmount.toFixed(2));

      // ==================================================
      // NEW PAYLOAD FIELDS (as per requirements)
      // ==================================================
      // Development Charges PSF (editable) - this will override the one sent in possession charges section
      // Minimum is 1, default is 500
      const devChargesPsfValue = Math.max(
        1,
        Number(
          developmentChargesPsf || costTemplate?.development_charges_psf || 500
        )
      );
      fd.append("development_charges_psf", devChargesPsfValue.toFixed(2));

      // Provisional Maintenance Months (editable)
      const provMonthsValue = Number(
        provisionalMaintenanceMonths ||
          costTemplate?.provisional_maintenance_months ||
          6
      );
      fd.append("provisional_maintenance_months", provMonthsValue);

      // Note: discount_amount, gst_percent, stamp_duty_percent, and additional_charges
      // are already sent above in their respective sections

      // ==================================================
      // COST BREAKDOWN DATA
      // ==================================================

      // Calculate possession totals with GST
      const possessionBase = possessionCharges
        ? possessionCharges.baseForGst
        : 0;
      const possessionGstAmt = possessionCharges
        ? possessionCharges.possessionGst
        : 0;
      const possessionTotal = possessionCharges
        ? possessionCharges.totalWithGst
        : 0;
      const registrationAmt = registrationEnabled
        ? Number(costTemplate.registration_amount || 0)
        : 0;
      const grandTotal =
        Number(finalAmount || 0) + possessionTotal + registrationAmt;

      // Unit Cost Calculation (Section 1)
      fd.append("unit_cost_base", agreementValue || "0");
      fd.append("additional_charges_amount", additionalChargesTotal.toFixed(2));
      fd.append("parking_charges_amount", parkingTotalAmount.toFixed(2));
      fd.append("stamp_duty_amount_breakdown", stampAmount.toFixed(2));
      fd.append("gst_amount_breakdown", gstAmount.toFixed(2));
      fd.append("total_cost_section_1", finalAmount.toFixed(2));

      // Possession Related Charges (Section 2) - WITHOUT PARKING
      console.log(possessionCharges, "hai ya nhi?");

      if (possessionCharges) {
        fd.append(
          "share_application_money_membership_amount",
          possessionCharges.shareFee.toFixed(2)
        );
        fd.append(
          "legal_compliance_charges_amount",
          (legalFeeEnabled
            ? Number(costTemplate.legal_fee_amount || 0)
            : 0
          ).toFixed(2)
        );
        fd.append(
          "development_charges_amount",
          possessionCharges.devAmount.toFixed(2)
        );
        fd.append(
          "development_charges_psf",
          possessionCharges.devPsqf.toFixed(2)
        );
        fd.append(
          "electrical_water_piped_gas_charges_amount",
          possessionCharges.electrical.toFixed(2)
        );
        fd.append(
          "provisional_maintenance_amount",
          possessionCharges.provAmount.toFixed(2)
        );
        fd.append(
          "provisional_maintenance_psf",
          possessionCharges.provPsqf.toFixed(2)
        );
        // ✅ REMOVED: possession_parking_charges - parking is in Unit Cost section now
        fd.append(
          "possessional_gst_amount",
          possessionCharges.possessionGst.toFixed(2)
        );
        fd.append("possession_gst_percent", "18");
        fd.append(
          "total_possession_charges",
          possessionCharges.totalWithGst.toFixed(2)
        );
      } else {
        fd.append("share_application_money_membership_amount", "0");
        fd.append("legal_compliance_charges_amount", "0");
        fd.append("development_charges_amount", "0");
        fd.append("development_charges_psf", "0");
        fd.append("electrical_water_piped_gas_charges_amount", "0");
        fd.append("provisional_maintenance_amount", "0");
        fd.append("provisional_maintenance_psf", "0");
        // ✅ REMOVED: possession_parking_charges
        fd.append("possessional_gst_amount", "0");
        fd.append("possession_gst_percent", "18");
        fd.append("total_possession_charges", "0");
      }

      // Registration (Section 3)
      fd.append("registration_amount_final", registrationAmt.toFixed(2));

      // Grand Total
      fd.append("grand_total_amount", grandTotal.toFixed(2));

      // Structured JSON for complete breakdown
      const costBreakdownData = {
        unit_cost_calculation: {
          unit_cost: Number(agreementValue || 0),
          additional_charges: additionalChargesTotal,
          parking: parkingTotalAmount, // ✅ Parking in Unit Cost section
          stamp_duty: stampAmount,
          stamp_duty_percent: Number(costTemplate?.gst_percent || 0),
          gst: gstAmount,
          gst_percent: Number(costTemplate?.gst_percent || 0),
          total_cost_1: Number(finalAmount || 0),
        },
        possession_charges: possessionCharges
          ? {
              share_application_fees: possessionCharges.shareFee,
              legal_compliance: legalFeeEnabled
                ? Number(costTemplate.legal_fee_amount || 0)
                : 0,
              development_charges: possessionCharges.devAmount,
              development_charges_psf: possessionCharges.devPsqf,
              electrical_water_gas: possessionCharges.electrical,
              provisional_maintenance: possessionCharges.provAmount,
              provisional_maintenance_psf: possessionCharges.provPsqf,
              // ✅ REMOVED: parking_charges - now in unit_cost_calculation
              possession_gst: possessionCharges.possessionGst,
              possession_gst_percent: 18,
              base_total: possessionCharges.baseForGst,
              total_with_gst: possessionCharges.totalWithGst,
            }
          : null,
        registration: {
          enabled: registrationEnabled,
          amount: registrationAmt,
        },
        summary: {
          total_cost: Number(finalAmount || 0),
          total_possession: possessionTotal,
          total_registration: registrationAmt,
          grand_total: grandTotal,
        },
      };

      fd.append("cost_breakdown_json", JSON.stringify(costBreakdownData));

      console.log("💰 COST BREAKDOWN:", costBreakdownData);

      // ==================================================
      // PAYMENT PLAN + KYC FLAGS
      // ==================================================
      fd.append("payment_plan_type", paymentPlanType);

      // Always tell backend if KYC was required or not
      fd.append("requires_kyc", requiresKyc === "YES" ? "true" : "false");

      // Send deal amount snapshot (0/empty if not applicable)
      fd.append("kyc_deal_amount", kycDealAmount || "");

      // Link the actual KYC request only when it exists
      if (requiresKyc === "YES" && kycRequestId) {
        fd.append("kyc_request_id", String(kycRequestId));
      }

      if (paymentPlanType === "MASTER" && selectedPaymentPlanId) {
        fd.append("payment_plan_id", selectedPaymentPlanId);
      }

      // ==================================================
      // PAYMENT PLAN SNAPSHOT
      // ==================================================
      let planSnapshot = {
        type: paymentPlanType,
        payment_plan_id:
          paymentPlanType === "MASTER" ? selectedPaymentPlanId || null : null,
        slabs: [],
      };

      if (paymentPlanType === "MASTER" && selectedPaymentPlan) {
        planSnapshot.name = selectedPaymentPlan.name;

        // Calculate amount for each slab from percentage
        planSnapshot.slabs = masterSlabs.map((slab, idx) => {
          const percentage = Number(slab.percentage || 0);
          const calculatedAmount = (paymentPlanBaseAmount * percentage) / 100;

          return {
            order_index: idx + 1,
            name: slab.name,
            amount: Math.round(calculatedAmount * 100) / 100,
            percentage: percentage,
            days: slab.days || null,
            due_date: slab.due_date || null,
          };
        });
      } else if (paymentPlanType === "CUSTOM") {
        planSnapshot.name = customPlanName || "Custom Plan";

        // Calculate amount for each slab from percentage
        planSnapshot.slabs = customSlabs.map((s, idx) => {
          const percentage = Number(s.percentage || 0);
          const calculatedAmount = (paymentPlanBaseAmount * percentage) / 100;

          return {
            order_index: idx + 1,
            name: s.name,
            amount: Math.round(calculatedAmount * 100) / 100,
            percentage: percentage,
            days: s.days || null,
            due_date: s.due_date || null,
          };
        });
      }

      // Send plan_snapshot (for audit/reporting)
      fd.append("plan_snapshot", JSON.stringify(planSnapshot));

      // Send custom_payment_plan (same data structure)
      fd.append(
        "custom_payment_plan",
        JSON.stringify({
          base_payment_plan_id:
            paymentPlanType === "MASTER" ? selectedPaymentPlanId || null : null,
          name: planSnapshot.name,
          slabs: planSnapshot.slabs,
        })
      );

      console.log("💰 PAYMENT PLAN:", {
        type: paymentPlanType,
        base_amount: paymentPlanBaseAmount,
        grand_total: grandTotal,
        kyc_amount: kycDealAmount,
        slabs_count: planSnapshot.slabs.length,
      });

      // ==================================================
      // FUNDING
      // ==================================================
      fd.append("loan_required", loanRequired === "YES" ? "true" : "false");
      fd.append("loan_bank_name", "");
      fd.append("loan_amount_expected", "");
      fd.append("booking_amount", bookingAmount || "0");
      fd.append("other_charges", otherCharges || "0");

      // ==================================================
      // MAIN PHOTO
      // ==================================================
      if (photoFile) fd.append("photo", photoFile);

      // ==================================================
      // APPLICANTS — BRACKET NOTATION
      // ==================================================

      // PRIMARY APPLICANT (index 0)
      fd.append("applicants[0][is_primary]", true);
      fd.append("applicants[0][sequence]", "1");
      fd.append("applicants[0][title]", primaryTitle || "Mr.");
      fd.append("applicants[0][full_name]", primaryFullName || "");
      fd.append("applicants[0][relation]", "");
      if (primaryDob) {
        fd.append("applicants[0][date_of_birth]", primaryDob);
      }
      fd.append("applicants[0][email]", email1 || "");
      fd.append("applicants[0][mobile_number]", phone1 || "");
      fd.append("applicants[0][pan_no]", primaryPanNo || "");
      fd.append("applicants[0][aadhar_no]", primaryAadharNo || "");

      if (files.primaryPanFront)
        fd.append("applicants[0][pan_front]", files.primaryPanFront);
      if (files.primaryPanBack)
        fd.append("applicants[0][pan_back]", files.primaryPanBack);
      if (files.primaryAadharFront)
        fd.append("applicants[0][aadhar_front]", files.primaryAadharFront);
      if (files.primaryAadharBack)
        fd.append("applicants[0][aadhar_back]", files.primaryAadharBack);

      // ADDITIONAL APPLICANTS
      let applicantIndex = 1;

      additionalApplicants.forEach((app, idx) => {
        if (app.full_name && app.full_name.trim()) {
          fd.append(`applicants[${applicantIndex}][is_primary]`, "false");
          fd.append(
            `applicants[${applicantIndex}][sequence]`,
            String(applicantIndex + 1)
          );
          fd.append(`applicants[${applicantIndex}][title]`, "Mr.");
          fd.append(
            `applicants[${applicantIndex}][full_name]`,
            app.full_name.trim()
          );
          fd.append(
            `applicants[${applicantIndex}][relation]`,
            app.relation || ""
          );
          if (app.dob && app.dob.trim()) {
            fd.append(`applicants[${applicantIndex}][date_of_birth]`, app.dob);
          }
          fd.append(`applicants[${applicantIndex}][email]`, "");
          fd.append(`applicants[${applicantIndex}][mobile_number]`, "");
          fd.append(`applicants[${applicantIndex}][pan_no]`, app.pan || "");
          fd.append(
            `applicants[${applicantIndex}][aadhar_no]`,
            app.aadhar || ""
          );

          // files
          const filePrefix = ["second", "third", "fourth"][idx];

          if (files[`${filePrefix}PanFront`])
            fd.append(
              `applicants[${applicantIndex}][pan_front]`,
              files[`${filePrefix}PanFront`]
            );
          if (files[`${filePrefix}PanBack`])
            fd.append(
              `applicants[${applicantIndex}][pan_back]`,
              files[`${filePrefix}PanBack`]
            );
          if (files[`${filePrefix}AadharFront`])
            fd.append(
              `applicants[${applicantIndex}][aadhar_front]`,
              files[`${filePrefix}AadharFront`]
            );
          if (files[`${filePrefix}AadharBack`])
            fd.append(
              `applicants[${applicantIndex}][aadhar_back]`,
              files[`${filePrefix}AadharBack`]
            );

          applicantIndex++;
        }
      });

      // ==================================================
      // ATTACHMENTS — BRACKET NOTATION
      // ==================================================
      let attachmentIndex = 0;

      if (files.kycAadhar) {
        fd.append(`attachments[${attachmentIndex}][label]`, "KYC Aadhar");
        fd.append(
          `attachments[${attachmentIndex}][doc_type]`,
          "IDENTITY_PROOF"
        );
        fd.append(`attachments[${attachmentIndex}][file]`, files.kycAadhar);
        attachmentIndex++;
      }

      if (files.kycPan) {
        fd.append(`attachments[${attachmentIndex}][label]`, "KYC PAN");
        fd.append(
          `attachments[${attachmentIndex}][doc_type]`,
          "IDENTITY_PROOF"
        );
        fd.append(`attachments[${attachmentIndex}][file]`, files.kycPan);
        attachmentIndex++;
      }

      // Multi-type attachments (including Payment Proofs)
      paymentDocs.forEach((doc) => {
        if (!doc.file) return;

        const label = doc.label || "Attachment";

        fd.append(`attachments[${attachmentIndex}][label]`, label);
        fd.append(
          `attachments[${attachmentIndex}][doc_type]`,
          doc.doc_type || "OTHER"
        );

        if (doc.doc_type === "PAYMENT_PROOF") {
          fd.append(
            `attachments[${attachmentIndex}][payment_mode]`,
            doc.payment_mode || ""
          );
          fd.append(
            `attachments[${attachmentIndex}][payment_ref_no]`,
            doc.ref_no || ""
          );
          fd.append(
            `attachments[${attachmentIndex}][bank_name]`,
            doc.bank_name || ""
          );
          fd.append(
            `attachments[${attachmentIndex}][payment_amount]`,
            doc.amount || ""
          );
          fd.append(
            `attachments[${attachmentIndex}][payment_date]`,
            doc.date || ""
          );
          fd.append(
            `attachments[${attachmentIndex}][remarks]`,
            doc.remarks || ""
          );
        }

        fd.append(`attachments[${attachmentIndex}][file]`, doc.file);
        attachmentIndex++;
      });

      // ==================================================
      // DEBUG LOGGING
      // ==================================================
      console.log("=== BOOKING SUBMISSION ===");
      console.log("🚗 Parking:", {
        required: fd.get("parking_required"),
        count: fd.get("parking_count"),
        amount_per_unit: fd.get("parking_amount_per_unit"),
        total: fd.get("parking_total_amount"),
      });
      console.log("💰 Cost Breakdown:", {
        unit_cost: fd.get("unit_cost_base"),
        total_cost_1: fd.get("total_cost_section_1"),
        possession_total: fd.get("total_possession_charges"),
        grand_total: fd.get("grand_total_amount"),
      });
      console.log("📋 Payment Plan:", {
        type: fd.get("payment_plan_type"),
        base_amount: paymentPlanBaseAmount,
        plan_snapshot: JSON.parse(fd.get("plan_snapshot") || "{}"),
      });

      for (let pair of fd.entries()) {
        if (pair[1] instanceof File)
          console.log(pair[0], "→ FILE:", pair[1].name);
        else console.log(pair[0], "→", pair[1]);
      }

      // ==================================================
      // SUBMIT
      // ==================================================
      const res = await axiosInstance.post(`${BOOK_API_PREFIX}/bookings/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Booking saved successfully! 🎉");
      console.log("BOOKING CREATED:", res.data);

      // If a KYC request exists, link it to this booking
      if (kycRequestId && res?.data?.id) {
        try {
          await axiosInstance.post(
            `${BOOK_API_PREFIX}/bookings/${res.data.id}/link-kyc-request/`,
            { kyc_request_id: kycRequestId }
          );
          console.log("KYC request linked to booking", res.data.id);
        } catch (linkErr) {
          console.error("Failed to link KYC request to booking", linkErr);
          toast.warn("Booking saved, but failed to link KYC request.");
        }
      }
    } catch (err) {
      console.error("❌ Booking save failed:", err);
      // Build a detailed error message from API response (e.g., unit_id errors)
      const respData = err?.response?.data;
      const collected = [];

      if (typeof respData === "string") {
        collected.push(respData);
      } else if (Array.isArray(respData)) {
        collected.push(...respData);
      } else if (respData && typeof respData === "object") {
        Object.entries(respData).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            val.forEach((msg) => collected.push(`${key}: ${msg}`));
          } else if (typeof val === "string") {
            collected.push(`${key}: ${val}`);
          }
        });
      }

      if (collected.length === 0) {
        collected.push(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Unknown error occurred"
        );
      }

      // Show all errors together for clarity
      toast.error(`Booking Failed:\n${collected.join("\n")}`);
    } finally {
      setSaving(false);
    }
  };

  // --- TAX BREAKUP HELPERS (Booking Form) ---
  const baseAmountBeforeTaxes = Math.max(
    (finalAmount || 0) - (totalTaxes || 0),
    0
  );

  // GST amount
  // const gstAmount =
  //   gstEnabled && costTemplate
  //     ? (baseAmountBeforeTaxes * Number(costTemplate.gst_percent || 0)) / 100
  //     : 0;

  // Stamp Duty amount - applied on unit cost + additional charges + parking total
  const stampDutyBase =
    Number(agreementValue || 0) +
    Number(additionalChargesTotal || 0) +
    (parkingRequired === "YES" ? Number(parkingTotal || 0) : 0);
  const stampAmount =
    stampDutyEnabled && costTemplate
      ? (stampDutyBase * Number(costTemplate.stamp_duty_percent || 0)) / 100
      : 0;

  // Registration amount (fixed)
  const registrationAmount =
    registrationEnabled && costTemplate
      ? Number(costTemplate.registration_amount || 0)
      : 0;

  // Legal Fees amount (fixed)
  const legalAmount =
    legalFeeEnabled && costTemplate
      ? Number(costTemplate.legal_fee_amount || 0)
      : 0;

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="booking-form-page" ref={rootRef}>
          {loading ? (
            <div className="bf-card">
              <p>Loading booking setup...</p>
            </div>
          ) : error ? (
            <div className="bf-card">
              <p className="bf-error">{error}</p>
            </div>
          ) : (
            <>
              {/* -------- Top booking info -------- */}
              {(companyLogoUrl || companyName || currentProjectLabel) && (
                <div className="bf-top-header">
                  {companyLogoUrl && (
                    <div className="bf-logo-circle">
                      <img
                        src={companyLogoUrl}
                        alt={companyName || "Company Logo"}
                      />
                    </div>
                  )}

                  {/* <div className="bf-top-title">
                    {toSentenceCase(companyName || currentProjectLabel || "")}
                  </div> */}


                  <div className="bf-top-title">
                  {(companyName || currentProjectLabel || "")
                    .toLowerCase()
                    .split(" ")
                    .filter(Boolean)
                    .map(word => word[0].toUpperCase() + word.slice(1))
                    .join(" ")}
                </div>

                  
                </div>
              )}

              <div className="bf-row">
                <div className="bf-col">
                  <label className="bf-label">
                    {toSentenceCase("Booking Date")}{" "}
                    <span className="bf-required">*</span>
                  </label>
                  <input
                    className="bf-input"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="bf-col">
                  <label className="bf-label">{toSentenceCase("Office")}</label>
                  <textarea
                    className="bf-textarea"
                    rows={3}
                    placeholder="Sales Office, Grand Avenue Towers, Sector 18, Gurgaon"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                  />
                </div>
                {/* ✅ new status field */}
                <div className="bf-col">
                  <label className="bf-label">
                    {toSentenceCase("Booking Status")}
                  </label>
                  <input
                    className="bf-input"
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Draft / Confirmed / Cancelled"
                  />
                </div>
              </div>

              {leadId && (
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Linked Lead")}
                    </label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="text"
                      value={
                        leadProfile
                          ? `#${leadId} - ${
                              leadProfile.full_name ||
                              leadProfile.mobile_number ||
                              leadProfile.email ||
                              ""
                            }`
                          : `Lead ID: ${leadId}`
                      }
                      readOnly
                    />
                  </div>
                </div>
              )}

              {/* <div className="bf-photo-row">
                <div className="bf-photo-upload">
                  <div className="bf-photo-circle" />
                  <input
                    id="bookingPhotoInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) setPhotoFile(f);
                    }}
                  />
                  <label
                    htmlFor="bookingPhotoInput"
                    className="bf-btn-secondary"
                    style={{ cursor: "pointer" }}
                  >
                    Upload Photo
                  </label>
                  {photoFile && (
                    <div className="bf-file-name">Photo: {photoFile.name}</div>
                  )}
                </div>
              </div> */}

              <div className="bf-photo-row">
                <div className="bf-photo-upload">
                  {/* Label + Required Star */}
                  <label
                    style={{
                      fontWeight: "600",
                      marginBottom: "6px",
                      display: "block",
                    }}
                  >
                    Profile Photo <span style={{ color: "red" }}>*</span>
                  </label>

                  {/* Circle Preview */}
                  <div className="bf-photo-circle" />

                  {/* File Input */}
                  <input
                    id="bookingPhotoInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) {
                        setPhotoFile(f);
                        setPhotoError(""); // clear error
                      }
                    }}
                  />

                  {/* Upload Button */}
                  <label
                    htmlFor="bookingPhotoInput"
                    className="bf-btn-secondary"
                    style={{ cursor: "pointer" }}
                  >
                    Upload Photo
                  </label>

                  {/* Show name only when file selected */}
                  {photoFile && (
                    <div className="bf-file-name">
                      Selected: {photoFile.name}
                    </div>
                  )}

                  {/* --- ERROR MESSAGE --- */}
                  {!photoFile && photoError && (
                    <div
                      style={{
                        color: "red",
                        marginTop: "6px",
                        fontSize: "14px",
                      }}
                    >
                      {photoError}
                    </div>
                  )}
                </div>
              </div>

              {/* Applicant Names */}
              <Section
                id="applicantNames"
                title={toSentenceCase("Applicant Names")}
                open={openSections.applicantNames}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  <div className="bf-row bf-row-applicant">
                    <div className="bf-col bf-col-title">
                      <label className="bf-label">
                        {toSentenceCase("Title")}
                      </label>
                      <div className="bf-radio-group">
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Mr."
                            checked={primaryTitle === "Mr."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Mr.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Ms."
                            checked={primaryTitle === "Ms."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Ms.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Mrs."
                            checked={primaryTitle === "Mrs."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Mrs.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Dr."
                            checked={primaryTitle === "Dr."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Dr.
                        </label>
                      </div>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Full Name")}{" "}
                        <span className="bf-required">*</span>
                      </label>
                      <input
                        className="bf-input"
                        type="text"
                        placeholder="Rajesh Kumar"
                        value={primaryFullName}
                        onChange={(e) => setPrimaryFullName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* First Applicant PAN with file upload */}
                <div className="bf-row bf-row-upload">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("First Applicant PAN Number")}{" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={primaryPanNo}
                      onChange={(e) => handlePrimaryPanChange(e.target.value)}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>

                  <div className="bf-col bf-upload-btn-group">
                    <span className="bf-label">
                      {toSentenceCase("First Applicant PAN")}{" "}
                      <span className="bf-required">*</span>
                    </span>

                    <input
                      id="primaryPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryPanFront")}
                    />
                    <input
                      id="primaryPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="primaryPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="primaryPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>

                    <div className="bf-file-names">
                      {files.primaryPanFront && (
                        <div className="bf-file-name">
                          Front: {files.primaryPanFront.name}
                        </div>
                      )}
                      {files.primaryPanBack && (
                        <div className="bf-file-name">
                          Back: {files.primaryPanBack.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* First Applicant Aadhar with file upload */}
                <div className="bf-row bf-row-upload">
                  <div className="bf-col">
                    <label className="bf-label">
                      First Applicant Aadhar Number{" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={primaryAadharNo}
                      onChange={(e) =>
                        handlePrimaryAadharChange(e.target.value)
                      }
                      maxLength={12}
                      placeholder="123456789012"
                    />
                  </div>

                  <div className="bf-col bf-upload-btn-group">
                    <span className="bf-label">
                      {toSentenceCase("First Applicant Aadhar")}{" "}
                      <span className="bf-required">*</span>
                    </span>

                    <input
                      id="primaryAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryAadharFront")}
                    />
                    <input
                      id="primaryAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="primaryAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="primaryAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>

                    <div className="bf-file-names">
                      {files.primaryAadharFront && (
                        <div className="bf-file-name">
                          Front: {files.primaryAadharFront.name}
                        </div>
                      )}
                      {files.primaryAadharBack && (
                        <div className="bf-file-name">
                          Back: {files.primaryAadharBack.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Additional Applicants */}
              <Section
                id="additionalApplicants"
                title={toSentenceCase("Additional Applicants")}
                open={openSections.additionalApplicants}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  {additionalApplicants.map((app, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "24px",
                        paddingBottom: "24px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Full Name")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="Priya Kumar"
                            value={app.full_name || ""}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "full_name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Relation")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="Spouse"
                            value={app.relation}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "relation",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Date of Birth")}
                          </label>
                          <input
                            className="bf-input"
                            type="date"
                            max={getTodayDate()}
                            value={app.dob}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "dob",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Aadhar Number")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="XXXX XXXX 1234"
                            value={app.aadhar}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "aadhar",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("PAN Number")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="ABCDE1234F"
                            value={app.pan || ""}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "pan",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="bf-btn-secondary bf-btn-full"
                    onClick={handleAddAdditionalApplicant}
                  >
                    Add Additional Applicant
                  </button>
                </div>

                {/* Rest of the file upload sections remain the same */}

                {/* Rest of the file upload sections remain the same */}

                {/* Second Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Second Applicant Aadhar")}
                    </span>

                    <input
                      id="secondAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondAadharFront")}
                    />
                    <input
                      id="secondAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="secondAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="secondAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Second Applicant Pan")}
                    </span>

                    <input
                      id="secondPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondPanFront")}
                    />
                    <input
                      id="secondPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="secondPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="secondPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>

                {/* Third Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Third Applicant Aadhar")}
                    </span>

                    <input
                      id="thirdAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdAadharFront")}
                    />
                    <input
                      id="thirdAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="thirdAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="thirdAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Third Applicant Pan")}
                    </span>

                    <input
                      id="thirdPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdPanFront")}
                    />
                    <input
                      id="thirdPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="thirdPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="thirdPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fourth Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Fourth Applicant Aadhar")}
                    </span>

                    <input
                      id="fourthAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthAadharFront")}
                    />
                    <input
                      id="fourthAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="fourthAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="fourthAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">
                      {toSentenceCase("Fourth Applicant Pan")}
                    </span>

                    <input
                      id="fourthPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthPanFront")}
                    />
                    <input
                      id="fourthPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="fourthPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="fourthPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Contact Details */}
              <Section
                id="contactDetails"
                title="Contact Details"
                open={openSections.contactDetails}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Email 1")}
                    </label>
                    <input
                      className="bf-input"
                      type="email"
                      placeholder="contact@example.com"
                      value={email1}
                      onChange={(e) => handleEmailChange(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Phone Number 1")}
                    </label>
                    <input
                      className="bf-input"
                      type="tel"
                      placeholder="9876543210"
                      value={phone1}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                    />
                  </div>
                </div>
              </Section>

              {/* Address & Profile */}
              <Section
                id="addressProfile"
                title="Addresses & Profile"
                open={openSections.addressProfile}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Permanent Address")}
                    </label>
                    <textarea
                      className="bf-textarea"
                      rows={3}
                      placeholder="123, Gandhi Road, Chennai, Tamil Nadu, India - 600001"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Correspondence Address")}
                    </label>
                    <textarea
                      className="bf-textarea"
                      rows={3}
                      placeholder="456, Nehru Street, Bangalore, Karnataka, India - 560001"
                      value={correspondenceAddress}
                      onChange={(e) => setCorrespondenceAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Preferred Correspondence Address
                    </label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="corrPref"
                          value="PERMANENT"
                          checked={preferredCorrespondence === "PERMANENT"}
                          onChange={(e) =>
                            setPreferredCorrespondence(e.target.value)
                          }
                        />{" "}
                        Permanent Address
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="corrPref"
                          value="CORRESPONDENCE"
                          checked={preferredCorrespondence === "CORRESPONDENCE"}
                          onChange={(e) =>
                            setPreferredCorrespondence(e.target.value)
                          }
                        />{" "}
                        Correspondence Address
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      Current Status (Residential)
                    </label>
                    <select
                      className="bf-input"
                      value={residentialStatus}
                      onChange={(e) => setResidentialStatus(e.target.value)}
                    >
                      <option value="Owned">Owned</option>
                      <option value="Rented">Rented</option>
                      <option value="Company Provided">Company Provided</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Flat Information */}
              <Section
                id="flatInfo"
                title="Flat Information"
                open={openSections.flatInfo}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Building Name")}
                    </label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="text"
                      value={project?.name || ""}
                      readOnly
                    />
                  </div>
                  {/* Wing / Tower dropdown (custom) */}
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Wing / Tower")}
                    </label>
                    <div className="bf-dropdown">
                      <button
                        type="button"
                        className="bf-input bf-dropdown-toggle"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTowerOpen((open) => !open);
                        }}
                      >
                        {selectedTower ? selectedTower.name : "Select Tower"}
                      </button>

                      {towerOpen && (
                        <div className="bf-dropdown-menu">
                          {towers.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className="bf-dropdown-item"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTowerId(String(t.id));
                                setSelectedUnitId("");
                                setTowerOpen(false);
                                setUnitOpen(false);
                              }}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flat / Unit dropdown (custom) - ENHANCED */}
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Flat / Unit")}
                    </label>
                    <div className="bf-dropdown">
                      <button
                        type="button"
                        className="bf-input bf-dropdown-toggle"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selectedTowerId) return;
                          setUnitOpen((open) => !open);
                        }}
                        disabled={!selectedTowerId}
                      >
                        {selectedUnit
                          ? `${selectedUnit.unit_no}${
                              selectedUnit.floor_number
                                ? ` (Floor ${selectedUnit.floor_number})`
                                : ""
                            }`
                          : "Select Unit"}
                      </button>

                      {unitOpen && selectedTowerId && (
                        <div className="bf-dropdown-menu">
                          {towerUnits.map((u) => {
                            // ✅ Determine unit status
                            const unitStatus = u.status || "NOT_RELEASED";
                            const inventoryStatus =
                              u.inventory?.availability_status ||
                              u.inventory?.unit_status;

                            // Check if unit is BOOKED or BLOCKED
                            const isBooked =
                              unitStatus === "BOOKED" ||
                              inventoryStatus === "BOOKED";
                            const isBlocked =
                              unitStatus === "BLOCKED" ||
                              inventoryStatus === "BLOCKED" ||
                              inventoryStatus === "BLOCKED_BY_ADMIN";
                            const isAvailable =
                              !isBooked &&
                              !isBlocked &&
                              (unitStatus === "RELEASED" ||
                                inventoryStatus === "AVAILABLE");

                            // Determine background color
                            let bgColor = "#ffffff"; // default white
                            let textColor = "#374151"; // default dark gray
                            let cursor = "pointer";
                            let opacity = 1;

                            if (isBooked) {
                              bgColor = "#fee2e2"; // red-100
                              textColor = "#991b1b"; // red-800
                              cursor = "not-allowed";
                              opacity = 0.6;
                            } else if (isBlocked) {
                              bgColor = "#fef3c7"; // yellow-100
                              textColor = "#92400e"; // yellow-800
                              cursor = "not-allowed";
                              opacity = 0.6;
                            } else if (!isAvailable) {
                              bgColor = "#f3f4f6"; // gray-100
                              textColor = "#6b7280"; // gray-500
                              cursor = "not-allowed";
                              opacity = 0.6;
                            }

                            return (
                              <button
                                key={u.id}
                                type="button"
                                className="bf-dropdown-item"
                                disabled={!isAvailable}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // Prevent selection if not available
                                  if (!isAvailable) {
                                    if (isBooked) {
                                      toast.error(
                                        `Unit ${u.unit_no} is already BOOKED`
                                      );
                                    } else if (isBlocked) {
                                      toast.warn(
                                        `Unit ${u.unit_no} is BLOCKED`
                                      );
                                    } else {
                                      toast.warn(
                                        `Unit ${u.unit_no} is not available for booking`
                                      );
                                    }
                                    return;
                                  }

                                  setSelectedUnitId(String(u.id));
                                  setUnitOpen(false);
                                  setInterestedUnitError("");
                                }}
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  cursor: cursor,
                                  opacity: opacity,
                                  fontWeight:
                                    isBooked || isBlocked ? "600" : "400",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {u.unit_no}
                                  {u.floor_number
                                    ? ` (Floor ${u.floor_number})`
                                    : ""}
                                </span>
                                {isBooked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#dc2626",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    BOOKED
                                  </span>
                                )}
                                {isBlocked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#f59e0b",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    BLOCKED
                                  </span>
                                )}
                                {!isAvailable && !isBooked && !isBlocked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#6b7280",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    NOT AVAILABLE
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {interestedUnitError && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#dc2626",
                      }}
                    >
                      {interestedUnitError}
                    </div>
                  )}
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Carpet Area (Sq. Ft.)")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={formatINR(carpetSqft ?? "")}
                      onChange={(e) =>
                        setCarpetSqft(stripAmount(e.target.value))
                      }
                    />
                  </div>

                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Balcony Area (Sq. Ft.)")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={formatINR(balconySqft)}
                      onChange={(e) =>
                        setBalconySqft(e.target.value.replace(/,/g, ""))
                      }
                    />
                  </div>
                </div>

                {project?.is_pricing_balcony_carpert === true && (
                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Total Area(Sq. ft.)")}
                      </label>
                      <input
                        className="bf-input"
                        type="text"
                        value={formatINR(
                          Number(carpetSqft || 0) + Number(balconySqft || 0) ||
                            ""
                        )}
                        readOnly
                      />
                    </div>
                  </div>
                )}

                <div className="bf-row bf-screen-only">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Base Rate / Sq. Ft.")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={formatINR(baseRateDisplay || "0")}
                      onChange={(e) => {
                        setBaseRateDisplay(
                          stripAmount(e.target.value.replace(/,/g, ""))
                        );
                        setAgreementTouched(false);
                      }}
                    />
                  </div>
                </div>

                {/* Discount Row */}
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Discount (%)")}
                    </label>
                    <input
                      className="bf-input"
                      type="number"
                      value={discountPercent}
                      onChange={(e) => {
                        setDiscountPercent(e.target.value);
                        setDiscountAmount(""); // Clear amount when % changes
                      }}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Discount Amount")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={formatINR(discountAmount)}
                      onChange={(e) => {
                        setDiscountAmount(stripAmount(e.target.value));
                        setDiscountPercent(""); // Clear % when amount changes
                      }}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                {/* Agreement Value Row */}
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Agreement Value (In Rupees){" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={formatINR(agreementValue)}
                      onChange={(e) => {
                        setAgreementTouched(true);
                        setAgreementValue(stripAmount(e.target.value));
                      }}
                      placeholder="Enter agreement value e.g. 12500000"
                    />
                  </div>

                  <div className="bf-col">
                    <label className="bf-label">
                      Agreement Value (In Words)
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={agreementValueWords}
                      onChange={(e) => setAgreementValueWords(e.target.value)}
                    />
                  </div>
                  {/* <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Agreement Done")}
                    </label>
                    <select
                      className="bf-input"
                      value={agreementDone ? "YES" : "NO"}
                      onChange={(e) =>
                        setAgreementDone(e.target.value === "YES")
                      }
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div> */}
                </div>

                {/* <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">{toSentenceCase("Parking")}</label>
                    <select
                      className="bf-input"
                      value={parkingRequired}
                      onChange={(e) => setParkingRequired(e.target.value)}
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                  {parkingRequired === "YES" && (
                    <>
                      <div className="bf-col">
                        <label className="bf-label">{toSentenceCase("Parking Details")}</label>
                        <input
                          className="bf-input"
                          type="text"
                          value={parkingDetails}
                          onChange={(e) => setParkingDetails(e.target.value)}
                          placeholder="Covered/Open, Type"
                        />
                      </div>
                      <div className="bf-col">
                        <label className="bf-label">{toSentenceCase("Parking Number")}</label>
                        <input
                          className="bf-input"
                          type="text"
                          value={parkingNumber}
                          onChange={(e) => setParkingNumber(e.target.value)}
                          placeholder="P-123"
                        />
                      </div>
                    </>
                  )}
                </div> */}

                {/* -------- PARKING SECTION -------- */}
                <div className="bf-row">
                  {/* Parking Required */}
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Parking")}
                    </label>
                    <select
                      className="bf-input"
                      value={parkingRequired}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParkingRequired(val);

                        if (val === "NO") {
                          setParkingCount("");
                          setParkingAmount("");
                          setParkingTotal("");
                        }
                      }}
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>

                  {/* No of Parking */}
                  {parkingRequired === "YES" && (
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("No. of Parking")}
                      </label>
                      <select
                        className="bf-input"
                        value={parkingCount}
                        onChange={(e) => {
                          setParkingCount(e.target.value);
                        }}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Parking Amount (Per Parking) */}
                  {parkingRequired === "YES" && parkingCount && (
                    <div className="bf-col">
                      <label className="bf-label">
                        Parking Amount (Per Parking)
                      </label>
                      <input
                        type="text"
                        className="bf-input"
                        value={formatINR(parkingAmount)}
                        onChange={(e) =>
                          setParkingAmount(stripAmount(e.target.value))
                        }
                        placeholder="Enter parking price"
                      />
                      <div className="bf-helper">
                        {project?.price_per_parking}
                      </div>
                    </div>
                  )}

                  {/* Total Parking Amount */}
                  {parkingRequired === "YES" && parkingCount && (
                    <div className="bf-col">
                      <label className="bf-label">
                        Total Parking Amount (₹)
                      </label>
                      <input
                        type="text"
                        className="bf-input"
                        value={parkingTotal ? formatINR(parkingTotal) : ""}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </Section>

              {/* Additional Charges */}
              <Section
                id="costSummary"
                title="Additional Charges"
                open={openSections.costSummary}
                onToggle={toggleSection}
              >
                {!leadId ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>
                      Cost summary is only available when booking is linked to a
                      lead.
                    </p>
                  </div>
                ) : !costTemplate ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>Loading cost template...</p>
                  </div>
                ) : (
                  <>
                    <div className="bf-subcard">
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: "12px",
                            marginBottom: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          <div>Charge Name</div>
                          <div>Type</div>
                          <div>Value</div>
                          <div>Amount</div>
                        </div>

                        {additionalCharges.map((charge, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                              gap: "12px",
                              marginBottom: "12px",
                              alignItems: "center",
                            }}
                          >
                            <input
                              className="bf-input"
                              type="text"
                              placeholder="e.g., Amenity Charges"
                              value={charge.name}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                            />

                            <select
                              className="bf-input"
                              value={charge.type}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "type",
                                  e.target.value
                                )
                              }
                            >
                              <option value="FIXED">Fixed</option>
                              <option value="PERCENTAGE">Percentage</option>
                            </select>

                            <input
                              className="bf-input"
                              type="number"
                              placeholder={
                                charge.type === "PERCENTAGE" ? "%" : "Amount"
                              }
                              value={charge.value}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "value",
                                  e.target.value
                                )
                              }
                            />

                            <input
                              className="bf-input bf-input-readonly"
                              type="number"
                              value={charge.amount.toFixed(2)}
                              readOnly
                            />

                            {additionalCharges.length > 1 && (
                              <button
                                type="button"
                                className="bf-btn-secondary"
                                onClick={() =>
                                  handleRemoveAdditionalCharge(idx)
                                }
                                style={{ padding: "6px 12px" }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          className="bf-btn-secondary"
                          onClick={handleAddAdditionalCharge}
                          style={{ marginTop: "8px" }}
                        >
                          + Add New Charge
                        </button>
                      </div>

                      {/* Summary - WITHOUT Final Amount */}
                      <div
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          paddingTop: "16px",
                          marginTop: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            color: "#6b7280",
                          }}
                        >
                          <span>Net Base Value</span>
                          <span>₹{formatINR(Number(agreementValue || 0))}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            color: "#6b7280",
                          }}
                        >
                          <span>Additional Charges Total</span>
                          <span>₹{formatINR(additionalChargesTotal)}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "12px",
                            borderTop: "2px solid #e5e7eb",
                            fontWeight: "600",
                            fontSize: "15px",
                          }}
                        >
                          <span>Amount Before Taxes</span>
                          <span>₹{formatINR(amountBeforeTaxes)}</span>
                        </div>
                      </div>

                      {/* Offer Selection */}
                      {offers.length > 0 && (
                        <div style={{ marginTop: "16px" }}>
                          <label className="bf-label">
                            Apply Offer (Optional)
                          </label>
                          <select
                            className="bf-input"
                            value={selectedOfferId}
                            onChange={(e) => setSelectedOfferId(e.target.value)}
                          >
                            <option value="">No Offer</option>
                            {offers.map((offer) => (
                              <option key={offer.id} value={offer.id}>
                                {offer.name}
                                {offer.percentage &&
                                  ` (${offer.percentage}% off)`}
                                {offer.amount && ` (₹${offer.amount} off)`}
                              </option>
                            ))}
                          </select>
                          {offerDiscountValue > 0 && (
                            <div
                              style={{
                                marginTop: "8px",
                                color: "#059669",
                                fontWeight: "600",
                              }}
                            >
                              Offer Discount: -₹{offerDiscountValue.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Section>

              {/* Tax Configuration Section */}
              {costTemplate && (
                <Section
                  id="taxConfig"
                  title="Tax & Charges "
                  open={openSections.taxConfig || false}
                  onToggle={toggleSection}
                >
                  <div className="bf-subcard">
                    <div className="bf-row">
                      <div className="bf-col">
                        <label className="bf-label">
                          {toSentenceCase("GST Percent (%)")}
                        </label>
                        <select
                          className="bf-input"
                          value={costTemplate.gst_percent || 0}
                          onChange={(e) => {
                            const currentValue = Number(
                              costTemplate.gst_percent || 0
                            );
                            const newValue = Number(e.target.value);
                            setCostTemplate((prev) => ({
                              ...prev,
                              gst_percent: newValue,
                            }));
                          }}
                        >
                          {(() => {
                            const currentValue = Number(
                              costTemplate.gst_percent || 0
                            );
                            const min = Math.max(0, currentValue - 3);
                            const max = currentValue + 4;
                            const options = [];
                            for (let i = min; i <= max; i++) {
                              options.push(
                                <option key={i} value={i}>
                                  {i}%
                                </option>
                              );
                            }
                            return options;
                          })()}
                        </select>
                      </div>

                      <div className="bf-col">
                        <label className="bf-label">
                          {toSentenceCase("Stamp Duty Percent (%)")}
                        </label>
                        <select
                          className="bf-input"
                          value={costTemplate.stamp_duty_percent || 0}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setCostTemplate((prev) => ({
                              ...prev,
                              stamp_duty_percent: newValue,
                            }));
                          }}
                        >
                          {(() => {
                            const currentValue = Number(
                              costTemplate.stamp_duty_percent || 0
                            );
                            const min = Math.max(0, currentValue - 3);
                            const max = currentValue + 4;
                            const options = [];
                            for (let i = min; i <= max; i++) {
                              options.push(
                                <option key={i} value={i}>
                                  {i}%
                                </option>
                              );
                            }
                            return options;
                          })()}
                        </select>
                      </div>

                      <div className="bf-col">
                        <label className="bf-label">
                          Development Charges PSF (₹)
                        </label>
                        <input
                          type="number"
                          className="bf-input"
                          value={developmentChargesPsf}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Allow empty temporarily while typing, but validate on blur
                            if (val === "" || Number(val) >= 1) {
                              setDevelopmentChargesPsf(val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            // Ensure minimum is 1, default to 500 if invalid
                            if (!val || val < 1) {
                              setDevelopmentChargesPsf("500");
                            } else {
                              setDevelopmentChargesPsf(String(val));
                            }
                          }}
                          min="1"
                          step="1"
                          placeholder="500"
                        />
                      </div>

                      <div className="bf-col">
                        <label className="bf-label">
                          Provisional Maintenance Months
                        </label>
                        <select
                          className="bf-input"
                          value={provisionalMaintenanceMonths || 6}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setProvisionalMaintenanceMonths(newValue);
                            // Also update costTemplate for consistency
                            setCostTemplate((prev) => ({
                              ...prev,
                              provisional_maintenance_months: newValue,
                            }));
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => i + 1).map(
                            (month) => (
                              <option key={month} value={month}>
                                {month} {month === 1 ? "month" : "months"}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              <Section
                id="taxesStatutory"
                title="Cost Breakdown"
                open={openSections.taxesStatutory}
                onToggle={toggleSection}
              >
                {!leadId || !costTemplate ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>
                      Cost breakdown will be available after selecting a unit
                      and lead.
                    </p>
                  </div>
                ) : (
                  <div className="bf-subcard">
                    {/* ================== UNIT COST CALCULATION ================== */}
                    <div className="cost-breakdown-section cost-breakdown-unit">
                      <div className="cost-breakdown-header">
                        Unit Cost Calculation
                      </div>

                      <div className="cost-breakdown-row">
                        <span>Unit Cost</span>
                        <span>{formatINR(agreementValue || 0)}</span>
                      </div>

                      {additionalChargesTotal > 0 && (
                        <div className="cost-breakdown-row">
                          <span>Additional Charges</span>
                          <span>{formatINR(additionalChargesTotal)}</span>
                        </div>
                      )}

                      {/* ✅ PARKING - Shown in Unit Cost section */}
                      {parkingRequired === "YES" && parkingTotal > 0 && (
                        <div className="cost-breakdown-row">
                          <span>
                            Parking ({parkingCount} × ₹
                            {formatINR(parkingAmount)})
                          </span>
                          <span>{formatINR(parkingTotal)}</span>
                        </div>
                      )}

                      {stampDutyEnabled && stampAmount > 0 && (
                        <div className="cost-breakdown-row">
                          <span>
                            Stamp Duty ({costTemplate.stamp_duty_percent}%)
                          </span>
                          <span>{formatINR(stampAmount)}</span>
                        </div>
                      )}

                      {gstEnabled && gstAmount > 0 && (
                        <div className="cost-breakdown-row">
                          <span>GST ({costTemplate.gst_percent}%)</span>
                          <span>{formatINR(gstAmount)}</span>
                        </div>
                      )}

                      <div className="cost-breakdown-row cost-breakdown-total">
                        <span>Total Cost (1)</span>
                        <span>
                          {formatINR(
                            Number(agreementValue || 0) +
                              Number(additionalChargesTotal || 0) +
                              (parkingRequired === "YES"
                                ? Number(parkingTotal || 0)
                                : 0) +
                              Number(stampAmount || 0) +
                              Number(gstAmount || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ================== POSSESSION RELATED CHARGES ================== */}
                    {/* ✅ NO PARKING - Parking removed from this section */}
                    {possessionCharges &&
                      possessionCharges.totalWithGst > 0 && (
                        <div className="cost-breakdown-section cost-breakdown-possession">
                          <div className="cost-breakdown-header">
                            Possession Related Charges
                          </div>

                          {possessionCharges.shareFee > 0 && (
                            <div className="cost-breakdown-row">
                              <span>
                                Share Application Money & Membership Fees
                              </span>
                              <span>
                                {formatINR(possessionCharges.shareFee)}
                              </span>
                            </div>
                          )}

                          {legalFeeEnabled &&
                            costTemplate.legal_fee_amount > 0 && (
                              <div className="cost-breakdown-row">
                                <span>Legal & Compliance Charges</span>
                                <span>
                                  {formatINR(costTemplate.legal_fee_amount)}
                                </span>
                              </div>
                            )}

                          {possessionCharges.devAmount > 0 && (
                            <div className="cost-breakdown-row">
                              <span>
                                Development Charges @ Rs.{" "}
                                <input
                                  type="number"
                                  value={
                                    developmentChargesPsf ||
                                    possessionCharges.devPsqf ||
                                    500
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow empty temporarily while typing, but validate on blur
                                    if (val === "" || Number(val) >= 1) {
                                      setDevelopmentChargesPsf(val);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    // Ensure minimum is 1, default to 500 if invalid
                                    if (!val || val < 1) {
                                      setDevelopmentChargesPsf("500");
                                    } else {
                                      setDevelopmentChargesPsf(String(val));
                                    }
                                  }}
                                  min="1"
                                  step="1"
                                  style={{
                                    width: "80px",
                                    padding: "4px 8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    margin: "0 4px",
                                  }}
                                />{" "}
                                PSF ×{" "}
                                {formatINR(
                                  possessionCharges.totalAreaForCharges || 0
                                )}{" "}
                                sq. ft.
                              </span>
                              <span>
                                {formatINR(possessionCharges.devAmount)}
                              </span>
                            </div>
                          )}

                          {possessionCharges.electrical > 0 && (
                            <div className="cost-breakdown-row">
                              <span>
                                Electrical, Water & Piped Gas Connection Charges
                              </span>
                              <span>
                                {formatINR(possessionCharges.electrical)}
                              </span>
                            </div>
                          )}

                          {Number(possessionCharges?.provAmount || 0) > 0 && (
                            <div className="cost-breakdown-row">
                              <span>
                                Provisional Maintenance for{" "}
                                <input
                                  type="number"
                                  value={
                                    provisionalMaintenanceMonths ||
                                    possessionCharges?.provMonths ||
                                    6
                                  }
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 6;
                                    setProvisionalMaintenanceMonths(val);
                                  }}
                                  style={{
                                    width: "60px",
                                    padding: "4px 8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    margin: "0 4px",
                                  }}
                                />{" "}
                                months @ Rs.{" "}
                                {formatINR(possessionCharges?.provPsqf || 0)}
                              </span>
                              <span>
                                {formatINR(possessionCharges?.provAmount || 0)}
                              </span>
                            </div>
                          )}

                          {/* ✅ REMOVED: Parking line - no longer shown here */}

                          {possessionCharges.possessionGst > 0 && (
                            <div className="cost-breakdown-row">
                              <span>GST on Possession Charges (18%)</span>
                              <span>
                                {formatINR(possessionCharges.possessionGst)}
                              </span>
                            </div>
                          )}

                          <div className="cost-breakdown-row cost-breakdown-subtotal">
                            <span>Total Possession Related Charges (2)</span>
                            <span>
                              {formatINR(possessionCharges.totalWithGst)}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* ================== REGISTRATION ================== */}
                    {registrationEnabled &&
                      costTemplate.registration_amount > 0 && (
                        <div className="cost-breakdown-section">
                          <div className="cost-breakdown-row">
                            <span>Registration Amount</span>
                            <span>
                              {formatINR(costTemplate.registration_amount)}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* ================== SUMMARY ================== */}
                    <div className="cost-breakdown-section cost-breakdown-summary">
                      <div className="cost-breakdown-row">
                        <span>Total Cost</span>
                        <span>{formatINR(finalAmount)}</span>
                      </div>

                      {possessionCharges &&
                        possessionCharges.totalWithGst > 0 && (
                          <div className="cost-breakdown-row">
                            <span>Total Possession Related Charges</span>
                            <span>
                              {formatINR(possessionCharges.totalWithGst)}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* ================== GRAND TOTAL ================== */}
                    <div className="cost-breakdown-row cost-breakdown-subtotal">
                      <span>GRAND TOTAL</span>
                      <span>
                        {formatINR(
                          Number(finalAmount || 0) +
                            (possessionCharges
                              ? possessionCharges.totalWithGst
                              : 0) +
                            (registrationEnabled
                              ? Number(costTemplate.registration_amount || 0)
                              : 0)
                        )}
                      </span>
                    </div>

                    {/* Terms & Conditions */}
                    {/* {termsList.length > 0 && (
                      <div
                        className="bf-terms-card"
                        style={{ marginTop: "24px" }}
                      >
                        <div className="bf-terms-title">Terms & Conditions</div>
                        <ol className="bf-terms-list">
                          {termsList.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ol>
                      </div>
                    )} */}
                  </div>
                )}
              </Section>

              {/* Source of Funding */}
              <Section
                id="funding"
                title="Source of Funding"
                open={openSections.funding}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Loan Required?")}
                    </label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="loan"
                          value="YES"
                          checked={loanRequired === "YES"}
                          onChange={(e) => setLoanRequired(e.target.value)}
                        />{" "}
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="loan"
                          value="NO"
                          checked={loanRequired === "NO"}
                          onChange={(e) => setLoanRequired(e.target.value)}
                        />{" "}
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Advance Deposit */}
              <Section
                id="advanceDeposit"
                title="Advance Deposit"
                open={openSections.advanceDeposit}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Booking Amount")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      placeholder="100000"
                      value={formatINR(bookingAmount)}
                      onChange={(e) =>
                        setBookingAmount(stripAmount(e.target.value))
                      }
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Other Charges")}
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      placeholder="50000"
                      value={formatINR(otherCharges)}
                      onChange={(e) =>
                        setOtherCharges(stripAmount(e.target.value))
                      }
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("Total Advance")}
                    </label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="text"
                      value={
                        totalAdvanceNumber
                          ? `₹${formatINR(totalAdvanceNumber)}`
                          : ""
                      }
                      readOnly
                    />
                  </div>
                </div>
              </Section>

              {/* Payment Schedule & KYC gating */}
              <Section
                id="paymentSchedule"
                title="Payment Schedule & KYC"
                open={openSections.paymentSchedule}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  {/* KYC requirement */}
                  {/* <div className="bf-col">
                    <label className="bf-label">{toSentenceCase("KYC Approval Required?")}</label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="NO"
                          checked={requiresKyc === "NO"}
                          disabled={isKycFrozen} // ✅ freeze when request exists
                          onChange={(e) => {
                            if (isKycFrozen) return; // ignore clicks
                            setRequiresKyc(e.target.value);
                            if (e.target.value === "NO") {
                              setKycDealAmount("");
                              setKycRequestId(null);
                              setKycRequestStatus(null);
                            }
                          }}
                        />{" "}
                        No
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="YES"
                          checked={requiresKyc === "YES"}
                          disabled={isKycFrozen} // ✅
                          onChange={(e) => {
                            if (isKycFrozen) return;
                            setRequiresKyc(e.target.value);
                          }}
                        />{" "}
                        Yes
                      </label>
                    </div>

                    {/* KYC block editable sirf tab tak jab tak request send nahi hui */}
                  {/* {requiresKyc === "YES" && !kycRequestId && (
                    <div className="bf-kyc-box">
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">KYC</label>
                          <input
                            className="bf-input"
                            type="text"
                            value={formatINR(kycDealAmount)}
                            onChange={(e) =>
                              setKycDealAmount(stripAmount(e.target.value))
                            }
                            placeholder="e.g., 1,25,00,000"
                          />
                        </div>
                      </div>

                      <div className="bf-row">
                        <div
                          className="bf-col"
                          style={{ display: "flex", gap: "8px" }}
                        >
                          <button
                            type="button"
                            className="bf-btn-secondary"
                            onClick={handleSendKycRequest}
                            disabled={!selectedUnitId || !kycDealAmount}
                          >
                            Send KYC Request
                          </button>

                          {canShowRemoveKyc && (
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={handleRemoveKyc}
                            >
                              Remove KYC
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Request send hone ke baad pura block hide ho jaayega,
   sirf chhota summary text dikhayenge (read-only) */}
                  {/* {requiresKyc === "YES" && kycRequestId && (
                      <div className="bf-kyc-box" style={{ opacity: 0.9 }}>
                        <div className="bf-row">
                          <div className="bf-col">
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#047857",
                                fontWeight: 600,
                              }}
                            >
                              KYC request sent for deal amount ₹
                              {formatINR(kycDealAmount || 0)}.
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#6b7280",
                                marginTop: "4px",
                              }}
                            >
                              Ref ID: {kycRequestId} &nbsp;•&nbsp; Amount and
                              KYC fields are now locked.
                            </div>
                          </div>
                        </div>
                      </div>
                    )} */}
                  {/* </div> */}
                  {/* KYC requirement */}
                  <div className="bf-col">
                    <label className="bf-label">
                      {toSentenceCase("KYC Approval Required?")}
                    </label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="NO"
                          checked={requiresKyc === "NO"}
                          disabled={isKycFrozen}
                          onChange={(e) => {
                            if (isKycFrozen) return;
                            setRequiresKyc("NO");
                            setKycDealAmount("");
                            setKycRequestId(null);
                            setKycRequestStatus(null);
                          }}
                        />{" "}
                        No
                      </label>

                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="YES"
                          checked={requiresKyc === "YES"}
                          disabled={isKycFrozen}
                          onChange={(e) => {
                            if (isKycFrozen) return;
                            setRequiresKyc("YES");
                          }}
                        />{" "}
                        Yes
                      </label>
                    </div>

                    {/* Show KYC Form only if not sent */}
                    {requiresKyc === "YES" && !kycRequestId && (
                      <div className="bf-kyc-box">
                        <div className="bf-row">
                          <div className="bf-col">
                            <label className="bf-label">
                              {toSentenceCase("KYC Deal Amount")}
                            </label>
                            <input
                              className="bf-input"
                              type="text"
                              value={formatINR(kycDealAmount)}
                              onChange={(e) =>
                                setKycDealAmount(stripAmount(e.target.value))
                              }
                              placeholder="e.g., 1,25,00,000"
                            />
                          </div>
                        </div>

                        <div className="bf-row">
                          <div
                            className="bf-col"
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={handleSendKycRequest}
                              disabled={!selectedUnitId || !kycDealAmount}
                            >
                              Send KYC Request
                            </button>

                            {canShowRemoveKyc && (
                              <button
                                type="button"
                                className="bf-btn-secondary"
                                onClick={handleRemoveKyc}
                              >
                                Remove KYC
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Plan column */}
                  <div className="bf-col">
                    <label className="bf-label">
                      Payment Plan <span className="bf-required">*</span>
                    </label>
                    <select
                      className="bf-input"
                      value={
                        paymentPlanType === "CUSTOM"
                          ? "__CUSTOM__"
                          : selectedPaymentPlanId || ""
                      }
                      onChange={handlePaymentPlanChange}
                    >
                      <option value="">Select Plan</option>
                      {paymentPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.total_percentage}%)
                        </option>
                      ))}
                      <option value="__CUSTOM__">Make Your Own Plan</option>
                    </select>
                  </div>
                </div>
                {paymentPlanType === "MASTER" && selectedPaymentPlan && (
                  <div className="bf-subcard">
                    {/* Selected Plan Header */}
                    <div className="bf-row">
                      <div className="bf-col">
                        <strong>{toSentenceCase("Selected Plan")}:</strong>{" "}
                        {selectedPaymentPlan.name} (
                        {Math.floor(masterTotalPercentage)}%)
                      </div>
                    </div>

                    {/* Slab Grid */}
                    <div style={{ marginTop: "16px" }}>
                      {/* Grid Header */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                          gap: "12px",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        <div>{toSentenceCase("Installment Name")}</div>
                        <div>{toSentenceCase("Percentage")}</div>
                        <div>{toSentenceCase("Amount")}</div>
                        <div>{toSentenceCase("Due Date / Days")}</div>
                        <div>{toSentenceCase("Action")}</div>
                      </div>

                      {/* Slab Rows */}
                      {masterSlabs.map((slab, index) => (
                        <div
                          key={slab.id || index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                            gap: "12px",
                            marginBottom: "12px",
                            alignItems: "center",
                            padding: "8px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "4px",
                          }}
                        >
                          {/* Name */}
                          <input
                            className="bf-input"
                            type="text"
                            value={slab.name}
                            onChange={(e) =>
                              handleMasterSlabChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                          />

                          {/* Percentage */}
                          <input
                            className="bf-input"
                            type="number"
                            step="1"
                            min="0"
                            value={slab.percentage || ""}
                            onChange={(e) =>
                              handleMasterSlabChange(
                                index,
                                "percentage",
                                e.target.value
                              )
                            }
                          />
                          <input
                            className="bf-input"
                            type="text"
                            value={formatINR(
                              slab.amount !== undefined &&
                                slab.amount !== "" &&
                                slab.amount !== null
                                ? slab.amount
                                : (paymentPlanBaseAmount *
                                    Number(slab.percentage || 0)) /
                                    100
                            )}
                            onChange={(e) =>
                              handleMasterSlabChange(
                                index,
                                "amount",
                                e.target.value.replace(/,/g, "")
                              )
                            }
                          />

                          {/* Due Date & Days */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "4px",
                            }}
                          >
                            {/* Date */}
                            <input
                              className="bf-input"
                              type="date"
                              value={slab.due_date || ""}
                              onChange={(e) =>
                                handleMasterSlabChange(
                                  index,
                                  "due_date",
                                  e.target.value
                                )
                              }
                            />

                            {/* Days */}
                            {/* <input
              className="bf-input"
              type="number"
              placeholder="Days"
              value={slab.days}
              onChange={(e) =>
                handleMasterSlabChange(index, "days", e.target.value)
              }
            /> */}
                          </div>

                          {/* Delete Button */}
                          {masterSlabs.length > 1 && (
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={() => handleRemoveMasterSlab(index)}
                              style={{
                                padding: "6px 12px",
                                minWidth: "40px",
                                cursor: "pointer",
                                border: "1px solid #dc2626",
                                color: "#dc2626",
                                background: "#fff",
                              }}
                              title="Delete this slab"
                            >
                              ✕
                            </button>
                          )}
                          {masterSlabs.length === 1 && <div></div>}
                        </div>
                      ))}

                      {/* Total */}
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 12px",
                          backgroundColor:
                            masterTotalPercentage === 100
                              ? "#f0fdf4"
                              : "#fef2f2",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color:
                            masterTotalPercentage === 100
                              ? "#166534"
                              : "#dc2626",
                          border: `2px solid ${
                            masterTotalPercentage === 100
                              ? "#10b981"
                              : "#ef4444"
                          }`,
                        }}
                      >
                        {toSentenceCase("Total")}:{" "}
                        <span style={{ fontSize: "16px" }}>
                          {Math.floor(masterTotalPercentage)}%
                        </span>
                        {masterTotalPercentage !== 100 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            (Should be 100%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentPlanType === "CUSTOM" && (
                  <div className="bf-subcard">
                    <div className="bf-row">
                      <div className="bf-col">
                        <label className="bf-label">
                          {toSentenceCase("Custom Plan Name")}
                        </label>
                        <input
                          className="bf-input"
                          type="text"
                          value={customPlanName}
                          onChange={(e) => setCustomPlanName(e.target.value)}
                          placeholder="e.g. Rajesh Custom Plan"
                        />
                      </div>
                    </div>

                    {/* Updated grid layout matching screenshot */}
                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr",
                          gap: "12px",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        <div>{toSentenceCase("Installment Name")}</div>
                        <div>{toSentenceCase("Percentage")}</div>
                        <div>{toSentenceCase("Amount")}</div>
                        <div>{toSentenceCase("Due Date")}</div>
                      </div>

                      {customSlabs.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                            gap: "12px",
                            marginBottom: "12px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            className="bf-input"
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              handleUpdateCustomSlab(
                                idx,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="e.g., On Booking"
                          />

                          <input
                            className="bf-input"
                            type="number"
                            step="1"
                            min="0"
                            value={row.percentage || ""}
                            onChange={(e) =>
                              handleUpdateCustomSlab(
                                idx,
                                "percentage",
                                e.target.value
                              )
                            }
                            placeholder="10"
                          />

                          <input
                            className="bf-input bf-input-readonly"
                            type="text"
                            value={
                              row.percentage
                                ? `₹${formatINR(
                                    (paymentPlanBaseAmount *
                                      Number(row.percentage || 0)) /
                                      100
                                  )}`
                                : ""
                            }
                            readOnly
                          />

                          <input
                            className="bf-input"
                            type="date"
                            value={row.days || ""}
                            onChange={(e) =>
                              handleUpdateCustomSlab(
                                idx,
                                "days",
                                e.target.value
                              )
                            }
                            onFocus={() => handleCustomDueDateFocus(idx)}
                          />

                          {customSlabs.length > 1 && (
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={() => handleRemoveCustomSlab(idx)}
                              style={{ padding: "6px 12px" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 12px",
                          backgroundColor:
                            customTotalPercentage === 100
                              ? "#f0fdf4"
                              : "#fef2f2",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color:
                            customTotalPercentage === 100
                              ? "#166534"
                              : "#dc2626",
                          border: `2px solid ${
                            customTotalPercentage === 100
                              ? "#10b981"
                              : "#ef4444"
                          }`,
                        }}
                      >
                        {toSentenceCase("Total Percentage")}:{" "}
                        <span style={{ fontSize: "16px" }}>
                          {Math.floor(customTotalPercentage)}%
                        </span>
                        {customTotalPercentage !== 100 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            ({toSentenceCase("should be 100%")})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="bf-btn-secondary"
                        onClick={handleAddCustomSlab}
                        style={{ marginTop: "8px" }}
                      >
                        + Add Installment
                      </button>
                    </div>
                  </div>
                )}
              </Section>

              {/* Attachments & Payment Proofs */}
              <Section
                id="attachments"
                title="Attachments & Payment Proofs"
                open={openSections.attachments}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span className="bf-label">
                      {toSentenceCase("Attachments")}
                    </span>
                    <button
                      type="button"
                      className="bf-btn-secondary"
                      onClick={() => setShowPaymentDocModal(true)}
                    >
                      + Add Attachment
                    </button>
                  </div>

                  {paymentDocs.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#6b7280" }}>
                      No attachments added yet.
                    </p>
                  ) : (
                    <ul
                      style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#374151",
                      }}
                    >
                      {paymentDocs.map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>
                          <strong>{doc.label || "Attachment"}</strong> (
                          {doc.doc_type || "OTHER"})
                          {doc.doc_type === "PAYMENT_PROOF" && (
                            <>
                              {" "}
                              – {doc.payment_mode} – {doc.ref_no || "No Ref"} –
                              ₹{formatINR(doc.amount)}
                              {doc.date && <span> ({doc.date})</span>}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>

              {/* Applicant Summary */}
              <Section
                id="applicantSummary"
                title={`Applicant Summary (${allApplicants.length} Total)`}
                open={openSections.applicantSummary}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  {allApplicants.map((applicant, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "20px",
                        padding: "16px",
                        backgroundColor: applicant.isPrimary
                          ? "#f0f9ff"
                          : "#f9fafb",
                        borderRadius: "8px",
                        border: applicant.isPrimary
                          ? "2px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "600",
                            color: applicant.isPrimary ? "#1e40af" : "#374151",
                          }}
                        >
                          {applicant.isPrimary ? "🔑 " : ""}
                          Applicant #{applicant.sequence}: {applicant.title}{" "}
                          {applicant.full_name}
                        </h4>
                        {applicant.isPrimary && (
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "12px",
                        }}
                      >
                        {applicant.relation && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Relation:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.relation}
                            </div>
                          </div>
                        )}
                        {applicant.dob && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Date of Birth:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.dob}
                            </div>
                          </div>
                        )}
                        <div>
                          <strong
                            style={{ fontSize: "12px", color: "#6b7280" }}
                          >
                            PAN Number:
                          </strong>
                          <div
                            style={{
                              fontSize: "14px",
                              fontFamily: "monospace",
                              color: applicant.pan ? "#059669" : "#9ca3af",
                            }}
                          >
                            {applicant.pan || "Not provided"}
                          </div>
                        </div>
                        <div>
                          <strong
                            style={{ fontSize: "12px", color: "#6b7280" }}
                          >
                            Aadhar Number:
                          </strong>
                          <div
                            style={{
                              fontSize: "14px",
                              fontFamily: "monospace",
                              color: applicant.aadhar ? "#059669" : "#9ca3af",
                            }}
                          >
                            {applicant.aadhar
                              ? `XXXX XXXX ${applicant.aadhar.slice(-4)}`
                              : "Not provided"}
                          </div>
                        </div>
                        {applicant.email && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Email:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.email}
                            </div>
                          </div>
                        )}
                        {applicant.phone && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Phone:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.phone}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show uploaded documents */}
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <strong style={{ fontSize: "12px", color: "#6b7280" }}>
                          Documents Uploaded:
                        </strong>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {(() => {
                            const docs = [];
                            const prefix = [
                              "primary",
                              "second",
                              "third",
                              "fourth",
                            ][idx];
                            if (files[`${prefix}PanFront`])
                              docs.push("PAN Front");
                            if (files[`${prefix}PanBack`])
                              docs.push("PAN Back");
                            if (files[`${prefix}AadharFront`])
                              docs.push("Aadhar Front");
                            if (files[`${prefix}AadharBack`])
                              docs.push("Aadhar Back");

                            return docs.length > 0 ? (
                              docs.map((doc, i) => (
                                <span
                                  key={i}
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                  }}
                                >
                                  ✓ {doc}
                                </span>
                              ))
                            ) : (
                              <span
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                No documents uploaded
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
              {/* {termsList.length > 0 && (
                <div className="bf-terms-card" style={{ marginTop: "24px" }}>
                  <div className="bf-terms-title">Terms & Conditions</div>
                  <ol className="bf-terms-list">
                    {termsList.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ol>
                </div>
              )} */}
              <div className="bf-terms-card" style={{ marginTop: "24px" }}>
                <div className="bf-terms-title">
                  <b>Terms & Conditions</b>
                </div>

                <ul className="bf-terms-list" style={{ paddingLeft: "18px" }}>
                  <li style={{ marginBottom: "10px" }}>
                    <strong>Payment Schedule</strong>
                    <br />
                    All payments will follow the Payment Schedule provided. If,
                    for any reason, the Agreement for Sale is not executed
                    within the expected time, the applicant shall still continue
                    making payments/instalments as per the schedule whenever
                    demand letters are raised.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Stamp Duty & Registration</strong>
                    <br />
                    The applicant agrees to pay the applicable stamp duty,
                    registration charges, and any related government fees before
                    execution of the Agreement for Sale.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Delay in Payments</strong>
                    <br />
                    If the applicant is unable to make payments within the
                    specified time after receiving the demand letter, an
                    interest of 21% p.a. will be charged on the outstanding
                    amount from the date of the demand letter until the payment
                    is completed, along with applicable GST.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Grace Period & Cancellation</strong>
                    <br />
                    If payment is not made even after the grace period, the
                    booking will automatically stand cancelled. Any amount paid
                    may be forfeited fully or as deemed appropriate in line with
                    MAHARERA rules.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Government Charges & GST Revisions</strong>
                    <br />
                    The purchaser will be responsible for paying any increase or
                    revision in GST or other government taxes/charges as and
                    when applicable. All “other charges” will attract GST at
                    18%, payable by the applicant.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Lock-In Period & Restrictions on Transfer</strong>
                    <br />
                    As per company policy, there is a lock-in period until
                    possession. During this period, the applicant cannot sell,
                    transfer, or create third-party rights over the flat without
                    the developer’s prior written consent and completion of
                    applicable formalities and charges as per company norms.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Cancellation by Applicant</strong>
                    <br />
                    If the applicant chooses to cancel the booking, 10% of the
                    total consideration + GST will be forfeited. The remaining
                    amount will be refunded (without interest) after the
                    applicant submits the cancellation request along with all
                    original documents and receipts issued for the flat.
                  </li>

                  <li style={{ marginBottom: "10px" }}>
                    <strong>Rights After Cancellation/Termination</strong>
                    <br />
                    In case the Agreement/Flat is cancelled or terminated, the
                    applicant will have no legal claim or right over the flat.
                    The developer will have complete freedom to sell the flat to
                    any third party.
                  </li>
                </ul>
              </div>

              <div className="bf-actions">
                <button type="button" className="bf-btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  className="bf-btn-primary"
                  onClick={handleSaveBooking}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Booking"}
                </button>
              </div>
            </>
          )}

          {/* Payment Lead Create Modal */}
          {showPaymentLeadModal && leadId && (
            <PaymentLeadCreateModal
              isOpen={showPaymentLeadModal}
              onClose={() => setShowPaymentLeadModal(false)}
              leadId={leadId}
              defaultPaymentType="EOI"
              onCreated={() => {
                refreshLeadProfile();
                toast.success("Payment added successfully!");
              }}
            />
          )}

          {showPaymentDocModal && (
            <div className="cp-project-modal-backdrop">
              <div className="cp-project-modal">
                <div className="cp-project-modal-header">
                  <div>
                    <h2 className="cp-project-modal-title">
                      Add Payment Document
                    </h2>
                    <p className="cp-project-modal-subtitle">
                      Cheque / RTGS / UPI details add karein aur proof upload
                      karein.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cp-project-modal-close"
                    onClick={() => setShowPaymentDocModal(false)}
                  >
                    ✕
                  </button>
                </div>

                {/* ---------- MODAL BODY ---------- */}
                <div
                  style={{ padding: "16px 0", display: "grid", gap: "12px" }}
                >
                  {/* Doc Type + Label */}
                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Document Type")}
                      </label>
                      <select
                        className="bf-input"
                        value={newPaymentDoc.doc_type}
                        onChange={(e) =>
                          setNewPaymentDoc((prev) => ({
                            ...prev,
                            doc_type: e.target.value,
                          }))
                        }
                      >
                        {DOC_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Label / Title")}
                      </label>
                      <input
                        className="bf-input"
                        type="text"
                        placeholder="Token Amount Payment / Booking Form / Agreement"
                        value={newPaymentDoc.label}
                        onChange={(e) =>
                          setNewPaymentDoc((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Payment fields only for PAYMENT_PROOF */}
                  {newPaymentDoc.doc_type === "PAYMENT_PROOF" && (
                    <>
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Payment Mode")}
                          </label>
                          <select
                            className="bf-input"
                            value={newPaymentDoc.payment_mode}
                            onChange={(e) =>
                              setNewPaymentDoc((prev) => ({
                                ...prev,
                                payment_mode: e.target.value,
                              }))
                            }
                          >
                            {PAYMENT_MODES.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            Ref / Cheque No / Transaction ID
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            value={newPaymentDoc.ref_no}
                            onChange={(e) =>
                              setNewPaymentDoc((prev) => ({
                                ...prev,
                                ref_no: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Bank Name")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            value={newPaymentDoc.bank_name}
                            onChange={(e) =>
                              setNewPaymentDoc((prev) => ({
                                ...prev,
                                bank_name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Amount")}
                          </label>
                          <input
                            className="bf-input"
                            type="text"
                            value={formatINR(newPaymentDoc.amount)}
                            onChange={(e) =>
                              setNewPaymentDoc((prev) => ({
                                ...prev,
                                amount: stripAmount(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">
                            {toSentenceCase("Date")}
                          </label>
                          <input
                            className="bf-input"
                            type="date"
                            value={newPaymentDoc.date}
                            onChange={(e) =>
                              setNewPaymentDoc((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Remarks (optional)")}
                      </label>
                      <textarea
                        className="bf-textarea"
                        rows={2}
                        value={newPaymentDoc.remarks}
                        onChange={(e) =>
                          setNewPaymentDoc((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">
                        {toSentenceCase("Upload File")}
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handlePaymentDocFileChange}
                      />
                      {newPaymentDoc.file && (
                        <div
                          className="bf-file-name"
                          style={{ marginTop: "4px" }}
                        >
                          {newPaymentDoc.file.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      type="button"
                      className="bf-btn-secondary"
                      onClick={() => setShowPaymentDocModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="bf-btn-primary"
                      onClick={() => {
                        if (!newPaymentDoc.file) {
                          toast.error("Please upload a file.");
                          return;
                        }

                        if (!newPaymentDoc.label.trim()) {
                          toast.error(
                            "Please enter a label / title for this attachment."
                          );
                          return;
                        }

                        if (
                          newPaymentDoc.doc_type === "PAYMENT_PROOF" &&
                          (!newPaymentDoc.amount || !newPaymentDoc.date)
                        ) {
                          toast.error(
                            "For Payment Proof, amount and date are required."
                          );
                          return;
                        }

                        setPaymentDocs((prev) => [...prev, newPaymentDoc]);
                        setNewPaymentDoc({
                          label: "",
                          doc_type: "PAYMENT_PROOF",
                          payment_mode: "UPI",
                          ref_no: "",
                          bank_name: "",
                          amount: "",
                          date: "",
                          remarks: "",
                          file: null,
                        });
                        setShowPaymentDocModal(false);
                      }}
                    >
                      Save Attachment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
