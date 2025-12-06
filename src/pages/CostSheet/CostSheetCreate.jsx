// // src/pages/CostSheet/CostSheetCreate.jsx
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../../api/axiosInstance";
// import { toast } from "react-hot-toast";
// import "./CostSheetCreate.css";
// import { formatINR } from "../../utils/number";
// import { toSentenceCase } from "../../utils/text";

// // Generic collapsible section with chevron
// const SectionCard = ({ title, children, defaultOpen = true }) => {
//   const [open, setOpen] = useState(defaultOpen);

//   return (
//     <section className={`cs-card ${open ? "cs-card-open" : "cs-card-closed"}`}>
//       <button
//         type="button"
//         className="cs-card-header"
//         onClick={() => setOpen((prev) => !prev)}
//       >
//         <h2 className="cs-section-title">{title}</h2>
//         <span className={`cs-chevron ${open ? "cs-chevron-open" : ""}`} />
//       </button>

//       {open && <div className="cs-card-body">{children}</div>}
//     </section>
//   );
// };

// const CostSheetCreate = () => {
//   const { leadId } = useParams(); // route: /cost-sheets/create/:leadId
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [initError, setInitError] = useState("");
//   const [apiErrors, setApiErrors] = useState([]);

//   // ----------- API data -----------
//   const [lead, setLead] = useState(null);
//   const [project, setProject] = useState(null);
//   const [template, setTemplate] = useState(null);
//   const [paymentPlans, setPaymentPlans] = useState([]);
//   const [offers, setOffers] = useState([]);

//   const formatINRNoDecimals = (val) => {
//     if (val === null || val === undefined || val === "") return "";
//     const num = Number(val);
//     if (Number.isNaN(num)) return "";
//     return num.toLocaleString("en-IN", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     });
//   };
//   const [discountFocused, setDiscountFocused] = useState(false);

//   const [towers, setTowers] = useState([]); // nested tower -> floor -> inventories
//   const [inventoryMap, setInventoryMap] = useState({}); // inventory_id -> inventory

//   // dates from backend
//   const [apiToday, setApiToday] = useState(""); // "today" from init API
//   const [validTillLimit, setValidTillLimit] = useState(""); // max allowed valid_till

//   // ----------- Header form -----------
//   const [quotationDate, setQuotationDate] = useState("");
//   const [validTill, setValidTill] = useState("");
//   const [status, setStatus] = useState("DRAFT");
//   const [preparedBy, setPreparedBy] = useState("");
//   //  const [quotationNo, setQuotationNo] = useState("");

//   // ----------- Attachments -----------
//   const [attachments, setAttachments] = useState([]);
//   const fileInputRef = useRef(null);

//   // ----------- Customer & Unit section -----------
//   const [customerName, setCustomerName] = useState("");
//   const [customerContactPerson, setCustomerContactPerson] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [customerEmail, setCustomerEmail] = useState("");

//   const [projectName, setProjectName] = useState("");
//   const [selectedTowerId, setSelectedTowerId] = useState("");
//   const [selectedFloorId, setSelectedFloorId] = useState("");
//   const [selectedInventoryId, setSelectedInventoryId] = useState("");

//   const [towerName, setTowerName] = useState("");
//   const [floorNumber, setFloorNumber] = useState("");
//   const [unitNo, setUnitNo] = useState("");

//   // ----------- Base pricing -----------
//   const [areaBasis, setAreaBasis] = useState("RERA"); // RERA / CARPET / SALEABLE
//   const [baseAreaSqft, setBaseAreaSqft] = useState("");
//   const [baseRatePsf, setBaseRatePsf] = useState(""); // editable – from inventory/project

//   // 💡 New discount logic
//   const [discountType, setDiscountType] = useState("Fixed"); // "Percentage" | "Fixed"
//   const [discountValue, setDiscountValue] = useState(""); // user input

//   const baseValue = useMemo(() => {
//     const a = parseFloat(baseAreaSqft) || 0;
//     const r = parseFloat(baseRatePsf) || 0;
//     return a * r; // ≈ Agreement value before discount
//   }, [baseAreaSqft, baseRatePsf]);

//   // Derived: discountPercent, discountAmount, netBaseValue
//   const { discountPercent, discountAmount, netBaseValue } = useMemo(() => {
//     const bv = baseValue || 0;
//     const rawVal = parseFloat(discountValue) || 0;

//     if (!bv || !rawVal) {
//       return {
//         discountPercent: 0,
//         discountAmount: 0,
//         netBaseValue: bv,
//       };
//     }

//     if (discountType === "Percentage") {
//       const discAmt = (bv * rawVal) / 100;
//       return {
//         discountPercent: rawVal, // user entered %
//         discountAmount: discAmt,
//         netBaseValue: bv - discAmt,
//       };
//     } else {
//       // Fixed (flat amount)
//       const discAmt = rawVal;
//       const pct = bv ? (discAmt * 100) / bv : 0;
//       return {
//         discountPercent: pct,
//         discountAmount: discAmt,
//         netBaseValue: bv - discAmt,
//       };
//     }
//   }, [baseValue, discountType, discountValue]);

//   const safeDiscountPercent =
//     discountPercent !== null &&
//     discountPercent !== undefined &&
//     !Number.isNaN(discountPercent)
//       ? Number(discountPercent.toFixed(2))
//       : null;

//   const safeDiscountAmount =
//     discountAmount !== null &&
//     discountAmount !== undefined &&
//     !Number.isNaN(discountAmount)
//       ? Number(discountAmount.toFixed(2))
//       : null;

//   // ----------- Payment plan -----------
//   const [paymentPlanType, setPaymentPlanType] = useState("MASTER"); // MASTER or CUSTOM
//   const [selectedPlanId, setSelectedPlanId] = useState("");
//   const [planRows, setPlanRows] = useState([]); // {name, percentage, due_date, slab_id?}
//   const [planError, setPlanError] = useState("");

//   const handleDueDateFocus = (index) => {
//     setPlanRows((rows) => {
//       const copy = [...rows];
//       const row = copy[index];

//       if (!row || row.due_date) return rows;

//       const prev = copy[index - 1];
//       const fallback =
//         (prev && prev.due_date) || quotationDate || apiToday || "";

//       if (!fallback) return rows;

//       copy[index] = { ...row, due_date: fallback };
//       return copy;
//     });
//   };

//   const totalPercentage = useMemo(
//     () =>
//       planRows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0),
//     [planRows]
//   );

//   // ----------- Additional charges -----------
//   const [charges, setCharges] = useState([
//     { name: "Amenity Charges", type: "Fixed", value: "", amount: "" },
//   ]);

//   // Parking (top toggle + dropdown drives this)
//   const [hasParking, setHasParking] = useState(false);
//   const [parkingCount, setParkingCount] = useState("");

//   const additionalChargesTotal = useMemo(
//     () => charges.reduce((sum, c) => sum + (parseFloat(c.amount || 0) || 0), 0),
//     [charges]
//   );

//   // Base + additional (WITHOUT statutory – those are added in tax base)
//   const amountBeforeTaxes = useMemo(
//     () => (netBaseValue || 0) + (additionalChargesTotal || 0),
//     [netBaseValue, additionalChargesTotal]
//   );

//   const baseAreaNum = parseFloat(baseAreaSqft || 0) || 0;
//   const effectiveBaseRate =
//     baseAreaNum && netBaseValue ? netBaseValue / baseAreaNum : 0;

//   // ----------- Statutory charges (parking, dev, maintenance, etc.) -----------
// const {
//   parkingAmount,
//   membershipAmount,
//   developmentChargesAmount,
//   electricalChargesAmount,
//   provisionalMaintenanceAmount,
//   statutoryChargesTotal,
// } = useMemo(() => {
//   const selectedInv =
//     selectedInventoryId && inventoryMap[String(selectedInventoryId)]
//       ? inventoryMap[String(selectedInventoryId)]
//       : null;

//   const carpetAreaSqft =
//     parseFloat((selectedInv && selectedInv.carpet_sqft) || baseAreaSqft || 0) ||
//     0;

//   // Car parking (same as before)
//   const pricePerParking =
//     project && project.price_per_parking
//       ? Number(project.price_per_parking)
//       : 0;

//   const parkingCountNum = Number(parkingCount || 0) || 0;
//   const parkingAmt = pricePerParking * parkingCountNum;

//   // ✅ Share application / membership = FIXED AMOUNT (jitna template me hai utna hi)
//   const membershipAmt =
//     template && template.share_application_money_membership_fees
//       ? Number(template.share_application_money_membership_fees)
//       : 0;

//   // Development charges per sq. ft. on carpet area (same as before)
//   const devRate =
//     template && template.development_charges_psf
//       ? Number(template.development_charges_psf)
//       : 0;
//   const devAmt = devRate * carpetAreaSqft;

//   // ✅ Electrical / water / piped gas = FIXED AMOUNT (no × carpet area)
//   const elecAmt =
//     template && template.electrical_watern_n_all_charges
//       ? Number(template.electrical_watern_n_all_charges)
//       : 0;

//   // Provisional maintenance per sq. ft. (same as before)
//   const provRate =
//     template && template.provisional_maintenance_psf
//       ? Number(template.provisional_maintenance_psf)
//       : 0;
//   const provAmt = provRate * carpetAreaSqft;

//   const statutoryTotal =
//     parkingAmt + membershipAmt + devAmt + elecAmt + provAmt;

//   return {
//     parkingAmount: parkingAmt,
//     membershipAmount: membershipAmt,
//     developmentChargesAmount: devAmt,
//     electricalChargesAmount: elecAmt,
//     provisionalMaintenanceAmount: provAmt,
//     statutoryChargesTotal: statutoryTotal,
//   };
// }, [
//   project,
//   template,
//   parkingCount,
//   selectedInventoryId,
//   inventoryMap,
//   baseAreaSqft,
//   netBaseValue,
// ]);


//   const handleBrowseClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFilesChange = (e) => {
//     const files = Array.from(e.target.files || []);
//     setAttachments(files);
//   };

//   // ----------- Taxes toggle -----------
//   const [taxes, setTaxes] = useState({
//     gst: true,
//     stampDuty: true,
//     registration: true,
//     legalFees: true,
//   });

//   const [chargeFocusIndex, setChargeFocusIndex] = useState(null);

//   const {
//     gstAmount,
//     stampAmount,
//     registrationAmountCalc,
//     legalAmountCalc,
//     totalTaxes,
//     finalAmount,
//   } = useMemo(() => {
//     // Base for tax = (Net Base + Additional) + Statutory
//     const baseForTaxes =
//       (amountBeforeTaxes || 0) + (statutoryChargesTotal || 0);

//     const gstPercent =
//       taxes.gst && template?.gst_percent
//         ? parseFloat(template.gst_percent) || 0
//         : 0;

//     const stampPercent =
//       taxes.stampDuty && template?.stamp_duty_percent
//         ? parseFloat(template.stamp_duty_percent) || 0
//         : 0;

//     const gstVal = (baseForTaxes * gstPercent) / 100;
//     const stampVal = (baseForTaxes * stampPercent) / 100;

//     const regVal =
//       taxes.registration && template?.registration_amount
//         ? parseFloat(template.registration_amount) || 0
//         : 0;

//     const legalVal =
//       taxes.legalFees && template?.legal_fee_amount
//         ? parseFloat(template.legal_fee_amount) || 0
//         : 0;

//     const totalTax = gstVal + stampVal + regVal + legalVal;
//     const final = baseForTaxes + totalTax;

//     return {
//       gstAmount: gstVal,
//       stampAmount: stampVal,
//       registrationAmountCalc: regVal,
//       legalAmountCalc: legalVal,
//       totalTaxes: totalTax,
//       finalAmount: final,
//     };
//   }, [amountBeforeTaxes, statutoryChargesTotal, taxes, template]);

//   // ----------- Text sections -----------
// const [termsAndConditions, setTermsAndConditions] = useState("");

// // Lines ko split + trim + empty remove + starting numbers strip
// const termsList = useMemo(() => {
//   if (!termsAndConditions) return [];
//   return termsAndConditions
//     .split(/\r?\n/)
//     .map((line) => line.trim())
//     .filter(Boolean)
//     .map((line) => {
//       // "1. Payment Schedule" -> "Payment Schedule"
//       const m = line.match(/^\d+\.?\s*(.*)$/);
//       return m && m[1] ? m[1] : line;
//     });
// }, [termsAndConditions]);

//   const handleDiscountValueChange = (e) => {
//     const input = e.target.value;

//     if (discountType === "Percentage") {
//       setDiscountValue(input);
//       return;
//     }

//     const raw = input.replace(/,/g, "");

//     if (raw === "") {
//       setDiscountValue("");
//       return;
//     }

//     const num = Number(raw);
//     if (Number.isNaN(num)) return;

//     setDiscountValue(raw);
//   };

//   // Load username from localStorage for "Prepared by"
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("user");
//       if (raw) {
//         const u = JSON.parse(raw);
//         const name = u?.username || u?.full_name || "";
//         if (name) setPreparedBy(name);
//       }
//     } catch (e) {
//       console.warn("Could not read user from localStorage", e);
//     }
//   }, []);

//   // ==============================
//   // 1) Load init + sales lead full-info + booking data
//   // ==============================
//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         setInitError("");

//         // ---- Cost sheet init ----
//         const initRes = await api.get(`/costsheet/lead/${leadId}/init/`);
//         const data = initRes.data;

//         // ---- Sales Lead full-info (for interested_unit_links, etc.) ----
//         const salesRes = await api.get(
//           `/sales/sales-leads/${leadId}/full-info/`
//         );
//         const salesFull = salesRes.data;

//         setLead(data.lead);
//         setProject(data.project);
//         setTemplate(data.template);
//         setPaymentPlans(data.payment_plans || []);
//         setOffers(data.offers || []);

//         setApiToday(data.today);
//         setQuotationDate(data.today);
//         setValidTill(data.valid_till);
//         setValidTillLimit(data.valid_till);

//         // Prefer full-info where available
//         const leadFullName = salesFull?.full_name || data.lead.full_name || "";
//         const leadMobile =
//           salesFull?.mobile_number || data.lead.mobile_number || "";
//         const leadEmail = salesFull?.email || data.lead.email || "";

//         setCustomerName(leadFullName);
//         setCustomerContactPerson(leadFullName);
//         setCustomerPhone(leadMobile);
//         setCustomerEmail(leadEmail);

//         setProjectName(data.project.name || "");

//         // project level default base rate (will be overridden by unit-specific if any)
// const projectRate =
//   data.project.price_per_sqft != null
//     ? String(Math.round(Number(data.project.price_per_sqft)))
//     : "";

// setBaseRatePsf(projectRate);

//         if (data.template) {
//           setTermsAndConditions(data.template.terms_and_conditions || "");
//         }

//         // ---- Booking Setup (tower -> floor -> units/inventory) ----
//         const bookingRes = await api.get("/client/booking-setup/", {
//           params: {
//             project_id: data.project.id,
//           },
//         });

//         const bookingData = bookingRes.data || {};
//         const towersFromApi = bookingData.towers || [];

//         // Interested unit from sales-full
//         let primaryInterestedUnitId = null;
//         if (
//           salesFull &&
//           Array.isArray(salesFull.interested_unit_links) &&
//           salesFull.interested_unit_links.length > 0
//         ) {
//           const primaryLink =
//             salesFull.interested_unit_links.find((l) => l.is_primary) ||
//             salesFull.interested_unit_links[0];
//           primaryInterestedUnitId = primaryLink?.unit || null;
//         }

//         let defaultInventoryId = null;

//         /**
//          * Transform booking-setup structure:
//          * towers[id,name,floors[id,number,units[unit + inventory]]]
//          *  -> towers[tower_id,tower_name,floors[floor_id,floor_number,inventories[]]]
//          * Keep ALL units that have inventory.
//          * Mark which ones are AVAILABLE vs BOOKED.
//          * Also: pick default inventory from salesFull.interested_unit_links
//          */
//         const towersList = towersFromApi
//           .map((tower) => {
//             const floors = (tower.floors || [])
//               .map((floor) => {
//                 const inventories = (floor.units || [])
//                   .filter((u) => !!u.inventory)
//                   .map((u) => {
//                     const inv = u.inventory;

//                     const isBooked =
//                       u.status === "BOOKED" ||
//                       inv.availability_status === "BOOKED" ||
//                       inv.unit_status === "BOOKED";

//                     const isAvailable = inv.availability_status === "AVAILABLE";

//                     // If this unit matches the interested unit, remember its inventory_id
//                     if (
//                       primaryInterestedUnitId &&
//                       u.id === primaryInterestedUnitId &&
//                       !defaultInventoryId
//                     ) {
//                       defaultInventoryId = inv.id;
//                     }

//                     return {
//                       // primary key we POST as inventory_id
//                       inventory_id: inv.id,
//                       unit_id: u.id,

//                       unit_no: u.unit_no,
//                       configuration:
//                         inv.configuration_name || inv.unit_type_name || "",

//                       rera_area_sqft: inv.rera_area_sqft,
//                       saleable_sqft: inv.saleable_sqft,
//                       carpet_sqft: inv.carpet_sqft,

//                       agreement_value: inv.agreement_value || u.agreement_value,
//                       rate_psf: inv.rate_psf,
//                       base_price_psf: inv.base_price_psf,
//                       total_cost: inv.total_cost,

//                       // new flags
//                       isBooked,
//                       isAvailable,
//                       unit_status: u.status,
//                       inventory_status: inv.availability_status,
//                     };
//                   });

//                 return {
//                   floor_id: floor.id,
//                   floor_number: floor.number,
//                   inventories,
//                 };
//               })
//               .filter((f) => (f.inventories || []).length > 0);

//             return {
//               tower_id: tower.id,
//               tower_name: tower.name,
//               floors,
//             };
//           })
//           .filter((t) => (t.floors || []).length > 0);

//         setTowers(towersList);

//         // Flatten inventory lookup map (keyed by inventory_id)
//         const invMap = {};
//         towersList.forEach((t) => {
//           (t.floors || []).forEach((f) => {
//             (f.inventories || []).forEach((inv) => {
//               invMap[String(inv.inventory_id)] = {
//                 ...inv,
//                 tower_id: t.tower_id,
//                 tower_name: t.tower_name,
//                 floor_id: f.floor_id,
//                 floor_number: f.floor_number,
//               };
//             });
//           });
//         });
//         setInventoryMap(invMap);

//         // If we found a default inventory from interested_unit_links, auto-select it
//         if (defaultInventoryId) {
//           const inv = invMap[String(defaultInventoryId)];
//           if (inv) {
//             setSelectedInventoryId(String(inv.inventory_id));
//             setSelectedTowerId(String(inv.tower_id || ""));
//             setTowerName(inv.tower_name || "");
//             setSelectedFloorId(String(inv.floor_id || ""));
//             setFloorNumber(inv.floor_number || "");
//             setUnitNo(inv.unit_no || "");

//             // Area basis: RERA preferred, else saleable, else carpet
//             const autoArea =
//               inv.rera_area_sqft || inv.saleable_sqft || inv.carpet_sqft || "";
//             setAreaBasis(inv.rera_area_sqft ? "RERA" : "SALEABLE");
//             setBaseAreaSqft(autoArea || "");

//             // Prefill Base Rate / sq. ft. from inventory (editable)
// const autoRatePsfRaw =
//   inv.base_price_psf || inv.rate_psf || data.project.price_per_sqft || "";

// if (autoRatePsfRaw !== "") {
//   const clean = String(Math.round(Number(autoRatePsfRaw)));
//   setBaseRatePsf(clean);
// }

//           }
//         }

//         // optional: payment plans from booking-setup
//         if (bookingData.payment_plans) {
//           setPaymentPlans(bookingData.payment_plans);
//         }
//       } catch (err) {
//         console.error(err);
//         setInitError("Failed to load cost sheet init data.");
//         toast.error("Failed to load cost sheet init data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (leadId) {
//       load();
//     }
//   }, [leadId]);

//   // ==============================
//   // 2) Inventory select handlers
//   // ==============================
//   const handleTowerChange = (e) => {
//     const value = e.target.value;
//     setSelectedTowerId(value);
//     setSelectedFloorId("");
//     setSelectedInventoryId("");
//     setTowerName(
//       towers.find((t) => String(t.tower_id) === value)?.tower_name || ""
//     );
//   };

//   const handleFloorChange = (e) => {
//     const value = e.target.value;
//     setSelectedFloorId(value);
//     setSelectedInventoryId("");
//     const tower = towers.find((t) => String(t.tower_id) === selectedTowerId);
//     const floor =
//       tower?.floors.find((f) => String(f.floor_id) === value) || null;
//     setFloorNumber(floor?.floor_number || "");
//   };

//   const handleInventoryChange = (e) => {
//     const value = e.target.value;
//     setSelectedInventoryId(value);

//     const inv = inventoryMap[String(value)];
//     if (!inv) return;

//     setSelectedTowerId(String(inv.tower_id || ""));
//     setTowerName(inv.tower_name || "");
//     setSelectedFloorId(String(inv.floor_id || ""));
//     setFloorNumber(inv.floor_number || "");
//     setUnitNo(inv.unit_no || "");

//     // area basis: RERA preferred, else saleable, else carpet
//     let area = inv.rera_area_sqft || inv.saleable_sqft || inv.carpet_sqft || "";
//     setAreaBasis(inv.rera_area_sqft ? "RERA" : "SALEABLE");
//     setBaseAreaSqft(area || "");

//     // When user changes unit manually, also update base rate from that unit (still editable)
// const autoRatePsfRaw =
//   inv.base_price_psf || inv.rate_psf || project?.price_per_sqft || "";
// if (autoRatePsfRaw !== "") {
//   const clean = String(Math.round(Number(autoRatePsfRaw)));
//   setBaseRatePsf(clean);
// }

//   };

//   const selectedTower = towers.find(
//     (t) => String(t.tower_id) === String(selectedTowerId)
//   );
//   const floors = selectedTower ? selectedTower.floors || [] : [];
//   const selectedFloor = floors.find(
//     (f) => String(f.floor_id) === String(selectedFloorId)
//   );
//   const inventories = selectedFloor ? selectedFloor.inventories || [] : [];

//   // ==============================
//   // 3) Payment plan handlers
//   // ==============================
//   const handlePlanSelect = (e) => {
//     const value = e.target.value;
//     setSelectedPlanId(value);
//     setPlanError("");

//     const plan = paymentPlans.find((p) => String(p.id) === String(value));
//     if (!plan) {
//       setPlanRows([]);
//       return;
//     }

//     const rows = (plan.slabs || []).map((slab) => ({
//       slab_id: slab.id,
//       name: slab.name,
//       percentage: slab.percentage,
//       due_date: "",
//     }));
//     setPlanRows(rows);
//   };

//   const handlePlanRowChange = (index, field, value) => {
//     setPlanError("");
//     const updated = [...planRows];
//     updated[index] = { ...updated[index], [field]: value };
//     setPlanRows(updated);
//   };

//   const addInstallment = () => {
//     setPlanRows((rows) => [
//       ...rows,
//       { slab_id: null, name: "", percentage: "", due_date: "" },
//     ]);
//   };

//   const removeInstallment = (index) => {
//     setPlanError("");
//     setPlanRows((rows) => rows.filter((_, i) => i !== index));
//   };

//   const handleChargeAmountChange = (index, input) => {
//     const raw = input.replace(/,/g, "");

//     if (raw === "") {
//       handleChargesChange(index, "amount", "");
//       return;
//     }

//     const num = Number(raw);
//     if (Number.isNaN(num)) return;

//     handleChargesChange(index, "amount", raw); // store raw number
//   };

//   // ==============================
//   // 4) Charges / Taxes handlers
//   // ==============================
//   const handleChargesChange = (index, field, value) => {
//     const updated = [...charges];
//     updated[index][field] = value;
//     setCharges(updated);
//   };

//   const addCharge = () => {
//     setCharges([
//       ...charges,
//       { name: "", type: "Fixed", value: "", amount: "" },
//     ]);
//   };

//   const handleTaxChange = (name) => {
//     setTaxes((prev) => ({ ...prev, [name]: !prev[name] }));
//   };

//   // ==============================
//   // 5) Date handlers (validation)
//   // ==============================
//   const handleQuotationDateChange = (e) => {
//     const value = e.target.value;

//     if (apiToday && value < apiToday) {
//       toast.error("Quoted date cannot be before today.");
//       setQuotationDate(apiToday);
//       return;
//     }

//     if (validTill && value > validTill) {
//       toast.error("Quoted date cannot be after Valid Until date.");
//       setQuotationDate(validTill);
//       return;
//     }

//     setQuotationDate(value);
//   };

//   const handleValidTillChange = (e) => {
//     const value = e.target.value;

//     if (apiToday && value < apiToday) {
//       toast.error("Valid until cannot be before today.");
//       setValidTill(apiToday);
//       return;
//     }

//     if (validTillLimit && value > validTillLimit) {
//       toast.error("Valid until cannot go beyond allowed validity.");
//       setValidTill(validTillLimit);
//       return;
//     }

//     if (quotationDate && value < quotationDate) {
//       toast.error("Valid until cannot be before quoted date.");
//       setValidTill(quotationDate);
//       return;
//     }

//     setValidTill(value);
//   };

//   // ==============================
//   // 6) Save (POST)
//   // ==============================
//   // const handleSave = async () => {
//   //   setApiErrors([]);
//   //   if (!lead || !project) {
//   //     toast.error("Lead / project not loaded.");
//   //     return;
//   //   }
//   //   if (!selectedInventoryId) {
//   //     toast.error("Please select an inventory/unit.");
//   //     return;
//   //   }

//   //   const selectedInv = inventoryMap[String(selectedInventoryId)];
//   //   if (selectedInv && selectedInv.isBooked) {
//   //     toast.error("This unit is already booked. Please choose another unit.");
//   //     return;
//   //   }

//   //   // Quoted date cannot be after valid_till
//   //   if (quotationDate && validTill && quotationDate > validTill) {
//   //     toast.error("Quote date cannot be after Valid Until date.");
//   //     return;
//   //   }

//   //   // Whatever plan type: if rows present, total must be 100
//   //   if (planRows.length && Math.round(totalPercentage * 1000) !== 100000) {
//   //     toast.error("Total payment plan percentage must be exactly 100%.");
//   //     return;
//   //   }

//   //   // ==========================
//   //   // Build custom_payment_plan ALWAYS
//   //   // ==========================
//   //   const customPaymentPlan =
//   //     planRows.length > 0
//   //       ? planRows.map((row) => ({
//   //           name: row.name,
//   //           percentage: row.percentage,
//   //           // Installment amount based on FINAL AMOUNT (after taxes)
//   //           amount:
//   //             finalAmount && row.percentage
//   //               ? (
//   //                   (finalAmount * parseFloat(row.percentage || 0)) /
//   //                   100
//   //                 ).toFixed(2)
//   //               : null,
//   //           due_date: row.due_date || null,
//   //         }))
//   //       : null;

//   //   try {
//   //     setSaving(true);

//   //     const payload = {
//   //       // FK inputs – MUST be *_id to match serializer
//   //       lead_id: lead.id,
//   //       project_id: project.id,
//   //       inventory_id: Number(selectedInventoryId),
//   //       project_template_id: template ? template.project_template_id : null,

//   //       // quotation_no: quotationNo.trim(),
//   //       date: quotationDate,
//   //       valid_till: validTill,
//   //       status,

//   //       customer_name: customerName,
//   //       customer_contact_person: customerContactPerson,
//   //       customer_phone: customerPhone,
//   //       customer_email: customerEmail,

//   //       project_name: projectName,
//   //       tower_name: towerName,
//   //       floor_number: floorNumber,
//   //       unit_no: unitNo,

//   //       base_area_sqft: baseAreaSqft || null,
//   //       base_rate_psf: baseRatePsf || null,
//   //       base_value: baseValue || null, // Agreement/Base value from Area × Rate

//   //       discount_percent: safeDiscountPercent,
//   //       discount_amount: safeDiscountAmount,

//   //       net_base_value: netBaseValue || null,

//   //       payment_plan_type: paymentPlanType,
//   //       payment_plan:
//   //         paymentPlanType === "MASTER" ? selectedPlanId || null : null,
//   //       custom_payment_plan:
//   //         paymentPlanType === "CUSTOM"
//   //           ? planRows.map((row) => ({
//   //               name: row.name,
//   //               percentage: row.percentage,
//   //               // Installment amount now based on FINAL AMOUNT (after taxes)
//   //               amount:
//   //                 finalAmount && row.percentage
//   //                   ? (
//   //                       (finalAmount * parseFloat(row.percentage || 0)) /
//   //                       100
//   //                     ).toFixed(2)
//   //                   : null,
//   //               due_date: row.due_date || null,
//   //             }))
//   //           : null,

//   //       gst_percent: taxes.gst && template ? template.gst_percent : null,
//   //       gst_amount: taxes.gst ? gstAmount || null : null,
//   //       stamp_duty_percent:
//   //         taxes.stampDuty && template ? template.stamp_duty_percent : null,
//   //       stamp_duty_amount: taxes.stampDuty ? stampAmount || null : null,
//   //       registration_amount: taxes.registration
//   //         ? registrationAmountCalc || null
//   //         : null,
//   //       legal_fee_amount: taxes.legalFees ? legalAmountCalc || null : null,

//   //       additional_charges_total: additionalChargesTotal || null,
//   //       offers_total: null,
//   //       net_payable_amount: finalAmount || null,

//   //       terms_and_conditions: termsAndConditions,
//   //       // notes: internalNotes,
//   //     };

//   //     const res = await api.post("/costsheet/cost-sheets/all/", payload);

//   //     toast.success("Cost Sheet created successfully.");
//   //     const created = res?.data;
//   //     const newId = created?.id;
//   //     if (newId) {
//   //       navigate(`/costsheet/${newId}`);
//   //     }
//   //   } catch (err) {
//   //     console.error(err);

//   //     const backendErrors = [];

//   //     if (err.response && err.response.data) {
//   //       const data = err.response.data;

//   //       if (typeof data === "string") {
//   //         backendErrors.push(data);
//   //       } else if (typeof data === "object") {
//   //         if (Array.isArray(data.__all__)) {
//   //           backendErrors.push(...data.__all__);
//   //         }
//   //         if (Array.isArray(data.non_field_errors)) {
//   //           backendErrors.push(...data.non_field_errors);
//   //         }

//   //         Object.keys(data).forEach((key) => {
//   //           if (key === "__all__" || key === "non_field_errors") return;

//   //           const value = data[key];
//   //           if (Array.isArray(value)) {
//   //             value.forEach((msg) => {
//   //               backendErrors.push(`${key}: ${msg}`);
//   //             });
//   //           } else if (typeof value === "string") {
//   //             backendErrors.push(`${key}: ${value}`);
//   //           }
//   //         });
//   //       }
//   //     }

//   //     if (backendErrors.length) {
//   //       setApiErrors(backendErrors);
//   //       toast.error(backendErrors[0]);
//   //     } else {
//   //       toast.error("Failed to create cost sheet.");
//   //     }
//   //   } finally {
//   //     setSaving(false);
//   //   }
//   // };

//   const handleSave = async () => {
//   setApiErrors([]);
//   if (!lead || !project) {
//     toast.error("Lead / project not loaded.");
//     return;
//   }
//   if (!selectedInventoryId) {
//     toast.error("Please select an inventory/unit.");
//     return;
//   }

//   const selectedInv = inventoryMap[String(selectedInventoryId)];
//   if (selectedInv && selectedInv.isBooked) {
//     toast.error("This unit is already booked. Please choose another unit.");
//     return;
//   }

//   // Quoted date cannot be after valid_till
//   if (quotationDate && validTill && quotationDate > validTill) {
//     toast.error("Quote date cannot be after Valid Until date.");
//     return;
//   }

//   // Whatever plan type: if rows present, total must be 100
//   if (planRows.length && Math.round(totalPercentage * 1000) !== 100000) {
//     toast.error("Total payment plan percentage must be exactly 100%.");
//     return;
//   }

//   // ==========================
//   // Build custom_payment_plan ALWAYS
//   // ==========================
//   const customPaymentPlan =
//     planRows.length > 0
//       ? planRows.map((row) => ({
//           name: row.name,
//           percentage: row.percentage,
//           // Installment amount based on FINAL AMOUNT (after taxes)
//           amount:
//             finalAmount && row.percentage
//               ? (
//                   (finalAmount * parseFloat(row.percentage || 0)) /
//                   100
//                 ).toFixed(2)
//               : null,
//           due_date: row.due_date || null,
//         }))
//       : null;

//   try {
//     setSaving(true);

//     const payload = {
//       // FK inputs – MUST be *_id to match serializer
//       lead_id: lead.id,
//       project_id: project.id,
//       inventory_id: Number(selectedInventoryId),
//       project_template_id: template ? template.project_template_id : null,

//       // quotation_no: quotationNo.trim(),
//       date: quotationDate,
//       valid_till: validTill,
//       status,

//       customer_name: customerName,
//       customer_contact_person: customerContactPerson,
//       customer_phone: customerPhone,
//       customer_email: customerEmail,

//       project_name: projectName,
//       tower_name: towerName,
//       floor_number: floorNumber,
//       unit_no: unitNo,

//       base_area_sqft: baseAreaSqft || null,
//       base_rate_psf: baseRatePsf || null,
//       base_value: baseValue || null, // Agreement/Base value from Area × Rate

//       discount_percent: safeDiscountPercent,
//       discount_amount: safeDiscountAmount,

//       net_base_value: netBaseValue || null,

//       // ------- Payment Plan -------
//       payment_plan_type: paymentPlanType,          // MASTER / CUSTOM jo UI se aaya
//       payment_plan: selectedPlanId || null,        // ✅ master plan ki ID ALWAYS (agar koi select hai)
//       custom_payment_plan: customPaymentPlan,      // ✅ hamesha custom array (MASTER + CUSTOM dono me)

//       // ------- Taxes / Charges -------
//       gst_percent: taxes.gst && template ? template.gst_percent : null,
//       gst_amount: taxes.gst ? gstAmount || null : null,
//       stamp_duty_percent:
//         taxes.stampDuty && template ? template.stamp_duty_percent : null,
//       stamp_duty_amount: taxes.stampDuty ? stampAmount || null : null,
//       registration_amount: taxes.registration
//         ? registrationAmountCalc || null
//         : null,
//       legal_fee_amount: taxes.legalFees ? legalAmountCalc || null : null,

//       additional_charges_total: additionalChargesTotal || null,
//       offers_total: null,
//       net_payable_amount: finalAmount || null,

//       terms_and_conditions: termsAndConditions,
//       // notes: internalNotes,
//     };

//     const res = await api.post("/costsheet/cost-sheets/all/", payload);

//     toast.success("Cost Sheet created successfully.");
//     const created = res?.data;
//     const newId = created?.id;
//     if (newId) {
//       navigate(`/costsheet/${newId}`);
//     }
//   } catch (err) {
//     console.error(err);

//     const backendErrors = [];

//     if (err.response && err.response.data) {
//       const data = err.response.data;

//       if (typeof data === "string") {
//         backendErrors.push(data);
//       } else if (typeof data === "object") {
//         if (Array.isArray(data.__all__)) {
//           backendErrors.push(...data.__all__);
//         }
//         if (Array.isArray(data.non_field_errors)) {
//           backendErrors.push(...data.non_field_errors);
//         }

//         Object.keys(data).forEach((key) => {
//           if (key === "__all__" || key === "non_field_errors") return;

//           const value = data[key];
//           if (Array.isArray(value)) {
//             value.forEach((msg) => {
//               backendErrors.push(`${key}: ${msg}`);
//             });
//           } else if (typeof value === "string") {
//             backendErrors.push(`${key}: ${value}`);
//           }
//         });
//       }
//     }

//     if (backendErrors.length) {
//       setApiErrors(backendErrors);
//       toast.error(backendErrors[0]);
//     } else {
//       toast.error("Failed to create cost sheet.");
//     }
//   } finally {
//     setSaving(false);
//   }
// };


//   // ==============================
//   // RENDER
//   // ==============================
//   if (loading) {
//     return <div className="cs-page">Loading...</div>;
//   }

//   if (initError) {
//     return <div className="cs-page">Error: {initError}</div>;
//   }

//   return (
//     <div className="cs-page">
//       <div className="cs-page-inner">
//         {/* QUOTATION HEADER */}
//         <SectionCard title="Quotation Header">
//           <div className="cs-grid-3">
//             <div className="cs-field">
//               <label className="cs-label">Quote Date</label>
//               <input
//                 type="date"
//                 className="cs-input"
//                 value={quotationDate}
//                 onChange={handleQuotationDateChange}
//                 min={apiToday || undefined}
//                 max={validTill || validTillLimit || undefined}
//               />
//             </div>
//             <div className="cs-field">
//               <label className="cs-label">Valid Until</label>
//               <input
//                 type="date"
//                 className="cs-input"
//                 value={validTill}
//                 onChange={handleValidTillChange}
//                 min={apiToday || undefined}
//                 max={validTillLimit || undefined}
//               />
//             </div>
//             <div className="cs-field">
//               <label className="cs-label">Status</label>
//               <select
//                 className="cs-select"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//               >
//                 <option value="DRAFT">Draft</option>
//                 <option value="SENT">Sent</option>
//                 <option value="ACCEPTED">Accepted</option>
//                 <option value="REJECTED">Rejected</option>
//               </select>
//             </div>
//             <div className="cs-field cs-field--full">
//               <label className="cs-label">Prepared By</label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={preparedBy}
//                 readOnly
//                 placeholder="Will be auto set from logged-in user"
//               />
//             </div>
//           </div>
//         </SectionCard>

//         {/* CUSTOMER & UNIT DETAILS */}
//         <SectionCard title="Customer & Unit Details">
//           <div className="cs-grid-3">
//             <div className="cs-field">
//               <label className="cs-label">Customer Name</label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={customerName}
//                 readOnly
//               />
//             </div>
//             <div className="cs-field">
//               <label className="cs-label">Contact Person</label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={customerContactPerson}
//                 readOnly
//               />
//             </div>
//             <div className="cs-field">
//               <label className="cs-label">Phone</label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={customerPhone}
//                 readOnly
//               />
//             </div>
//             <div className="cs-field">
//               <label className="cs-label">Email</label>
//               <input
//                 type="email"
//                 className="cs-input"
//                 value={customerEmail}
//                 readOnly
//               />
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Project</label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={projectName}
//                 readOnly
//               />
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Tower</label>
//               <select
//                 className="cs-select"
//                 value={selectedTowerId}
//                 onChange={handleTowerChange}
//               >
//                 <option value="">Select Tower</option>
//                 {towers.map((t) => (
//                   <option key={t.tower_id} value={t.tower_id}>
//                     {t.tower_name || `Tower ${t.tower_id}`}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Floor</label>
//               <select
//                 className="cs-select"
//                 value={selectedFloorId}
//                 onChange={handleFloorChange}
//               >
//                 <option value="">Select Floor</option>
//                 {floors.map((f) => (
//                   <option key={f.floor_id} value={f.floor_id}>
//                     {f.floor_number}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Unit</label>
//               <select
//                 className="cs-select"
//                 value={selectedInventoryId}
//                 onChange={handleInventoryChange}
//               >
//                 <option value="">Select Unit</option>
//                 {inventories.map((inv) => {
//                   const isBooked = inv.isBooked;
//                   const isAvailable = inv.isAvailable;

//                   return (
//                     <option
//                       key={inv.inventory_id}
//                       value={inv.inventory_id}
//                       disabled={!isAvailable}
//                       style={isBooked ? { color: "red" } : undefined}
//                     >
//                       {inv.unit_no} ({inv.configuration})
//                       {isBooked ? " - BOOKED" : ""}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>
//         </SectionCard>

//         {/* BASE PRICING */}
//         <SectionCard title="Base Pricing">
//           <div className="cs-grid-3">
//             <div className="cs-field">
//               <label className="cs-label">Area Basis</label>
//               <select
//                 className="cs-select"
//                 value={areaBasis}
//                 onChange={(e) => setAreaBasis(e.target.value)}
//               >
//                 <option value="RERA">RERA Area</option>
//                 <option value="CARPET">Carpet Area</option>
//                 <option value="SALEABLE">Saleable Area</option>
//               </select>
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Area (sq. ft.)</label>
//               <input
//                 type="number"
//                 className="cs-input"
//                 value={baseAreaSqft}
//                 onChange={(e) => setBaseAreaSqft(e.target.value)}
//               />
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">
//                 Base Rate/sq. ft.{" "}
//                 {effectiveBaseRate > 0 ? (
//                   <span className="cs-hint">
//                     (Current: {formatINR(effectiveBaseRate)} / sq. ft.)
//                   </span>
//                 ) : (
//                   project?.price_per_sqft && (
//                     <span className="cs-hint">
//                       (Project: {formatINR(project.price_per_sqft)})
//                     </span>
//                   )
//                 )}
//               </label>

//               <input
//                 type="text"
//                 className="cs-input"
//                 value={
//                   baseRatePsf === "" ? "" : formatINRNoDecimals(baseRatePsf) // ✅ ab .00 nahi aayega
//                 }
//                 onChange={(e) => {
//                   const input = e.target.value;
//                   const raw = input.replace(/,/g, "");

//                   if (raw === "") {
//                     setBaseRatePsf("");
//                     return;
//                   }

//                   const num = Number(raw);
//                   if (Number.isNaN(num)) return;

//                   // state mein raw number (without commas / decimals) store karo
//                   setBaseRatePsf(String(Math.round(num)));
//                 }}
//               />
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">Agreement Value (Base Value)</label>
//               <input
//                 type="text"
//                 className="cs-input cs-input--currency"
//                 value={baseValue ? formatINR(baseValue) : ""}
//                 readOnly
//               />
//             </div>

//             {/* Discount Type */}
//             <div className="cs-field">
//               <label className="cs-label">Discount Type</label>
//               <select
//                 className="cs-select"
//                 value={discountType}
//                 onChange={(e) => setDiscountType(e.target.value)}
//               >
//                 <option value="Percentage">Percentage</option>
//                 <option value="Fixed">Flat Amount</option>
//               </select>
//             </div>

//             {/* Discount Input */}
//             <div className="cs-field">
//               <label className="cs-label">
//                 {discountType === "Percentage"
//                   ? "Discount (%)"
//                   : "Discount Amount"}
//               </label>
//               <input
//                 type="text"
//                 className="cs-input"
//                 value={
//                   discountType === "Percentage"
//                     ? discountValue
//                     : discountFocused
//                     ? discountValue
//                     : discountValue === ""
//                     ? ""
//                     : formatINRNoDecimals(discountValue)
//                 }
//                 onFocus={() => setDiscountFocused(true)}
//                 onBlur={() => setDiscountFocused(false)}
//                 onChange={handleDiscountValueChange}
//               />
//             </div>

//             {/* Computed discount amount (₹) */}
//             <div className="cs-field">
//               <label className="cs-label">Discount Amount (₹)</label>
//               <input
//                 type="text"
//                 className="cs-input cs-input--currency"
//                 value={
//                   discountAmount && !Number.isNaN(discountAmount)
//                     ? formatINR(discountAmount)
//                     : ""
//                 }
//                 readOnly
//               />
//             </div>

//             {/* Net base value + effective rate */}
//             <div className="cs-field cs-field--full">
//               <label className="cs-label">Net Base Value</label>
//               <input
//                 type="text"
//                 className="cs-input cs-input--currency"
//                 value={netBaseValue ? formatINR(netBaseValue) : ""}
//                 readOnly
//               />
//               {effectiveBaseRate > 0 && baseAreaSqft && (
//                 <p className="cs-hint">
//                   Effective Rate After Discount: {formatINR(effectiveBaseRate)}{" "}
//                   / sq. ft. on {baseAreaSqft} sq. ft.
//                 </p>
//               )}
//             </div>
//           </div>
//         </SectionCard>

//         {/* ADDITIONAL CHARGES */}
//         <SectionCard title="Additional Charges">
//           <div className="cs-table">
//             <div className="cs-table-row cs-table-header">
//               <div>Charge Name</div>
//               <div>Type</div>
//               <div>Value</div>
//               <div>Amount</div>
//             </div>
//             {charges.map((row, index) => (
//               <div className="cs-table-row" key={index}>
//                 <div>
//                   <input
//                     type="text"
//                     className="cs-input"
//                     value={row.name}
//                     onChange={(e) =>
//                       handleChargesChange(index, "name", e.target.value)
//                     }
//                   />
//                 </div>
//                 <div>
//                   <select
//                     className="cs-select"
//                     value={row.type}
//                     onChange={(e) =>
//                       handleChargesChange(index, "type", e.target.value)
//                     }
//                   >
//                     <option>Fixed</option>
//                     <option>Percentage</option>
//                   </select>
//                 </div>
//                 <div>
//                   <input
//                     type="number"
//                     className="cs-input"
//                     value={row.value}
//                     onChange={(e) =>
//                       handleChargesChange(index, "value", e.target.value)
//                     }
//                   />
//                 </div>
//                 <div>
//                   <input
//                     type="text"
//                     className="cs-input cs-input--currency"
//                     value={
//                       chargeFocusIndex === index
//                         ? row.amount
//                         : row.amount === ""
//                         ? ""
//                         : formatINRNoDecimals(row.amount)
//                     }
//                     onFocus={() => setChargeFocusIndex(index)}
//                     onBlur={() => setChargeFocusIndex(null)}
//                     onChange={(e) =>
//                       handleChargeAmountChange(index, e.target.value)
//                     }
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//           <button
//             type="button"
//             className="cs-button cs-button-outline"
//             onClick={addCharge}
//           >
//             + Add New Charge
//           </button>

//           <div className="cs-summary-card">
//             <div className="cs-summary-row">
//               <span>Net Base Value</span>
//               <span className="cs-summary-amount">
//                 {formatINR(netBaseValue || 0)}
//               </span>
//             </div>
//             <div className="cs-summary-row">
//               <span>Additional Charges Total</span>
//               <span className="cs-summary-amount">
//                 {formatINR(additionalChargesTotal || 0)}
//               </span>
//             </div>
//             <div className="cs-summary-row">
//               <span>Statutory Charges</span>
//               <span className="cs-summary-amount">
//                 {formatINR(statutoryChargesTotal || 0)}
//               </span>
//             </div>
//             <div className="cs-summary-row">
//               <span>Amount Before Taxes &amp; Statutory</span>
//               <span className="cs-summary-amount">
//                 {formatINR(
//                   (amountBeforeTaxes || 0) + (statutoryChargesTotal || 0)
//                 )}
//               </span>
//             </div>
//             <div className="cs-summary-row cs-summary-row-final">
//               <span>Final Amount (Incl. Taxes)</span>
//               <span className="cs-summary-amount">
//                 {formatINR(finalAmount || 0)}
//               </span>
//             </div>
//           </div>
//         </SectionCard>

//         {/* TAXES & STATUTORY */}
//         <SectionCard title="Taxes & Statutory">
//           {/* Parking yes/no + dropdown (drives parkingCount) */}
//           <div className="cs-parking-top">
//             <span className="cs-label cs-parking-label">
//               Car Parking Required?
//             </span>
//             <div className="cs-parking-options">
//               <label className="cs-radio">
//                 <input
//                   type="radio"
//                   value="no"
//                   checked={!hasParking}
//                   onChange={() => {
//                     setHasParking(false);
//                     setParkingCount("0");
//                   }}
//                 />
//                 <span>No</span>
//               </label>
//               <label className="cs-radio">
//                 <input
//                   type="radio"
//                   value="yes"
//                   checked={hasParking}
//                   onChange={() => {
//                     setHasParking(true);
//                     if (!parkingCount || parkingCount === "0") {
//                       setParkingCount("1");
//                     }
//                   }}
//                 />
//                 <span>Yes</span>
//               </label>

//               {hasParking && (
//                 <select
//                   className="cs-select cs-parking-select"
//                   value={parkingCount}
//                   onChange={(e) => setParkingCount(e.target.value)}
//                 >
//                   <option value="">No. of Parking</option>
//                   {Array.from({ length: 10 }).map((_, idx) => (
//                     <option key={idx + 1} value={idx + 1}>
//                       {idx + 1}
//                     </option>
//                   ))}
//                 </select>
//               )}
//             </div>
//           </div>

//           <div className="cs-taxes-row">
//             <div className="cs-taxes-left">
//               <div className="cs-taxes-list">
//                 <label className="cs-checkbox">
//                   <input
//                     type="checkbox"
//                     checked={taxes.gst}
//                     onChange={() => handleTaxChange("gst")}
//                   />
//                   <span>
//                     GST ({template?.gst_percent || "–"}% on Amount Before Taxes
//                     &amp; Statutory)
//                   </span>
//                 </label>
//                 <label className="cs-checkbox">
//                   <input
//                     type="checkbox"
//                     checked={taxes.stampDuty}
//                     onChange={() => handleTaxChange("stampDuty")}
//                   />
//                   <span>
//                     Stamp Duty ({template?.stamp_duty_percent || "–"}% on Amount
//                     Before Taxes &amp; Statutory)
//                   </span>
//                 </label>
//                 <label className="cs-checkbox">
//                   <input
//                     type="checkbox"
//                     checked={taxes.registration}
//                     onChange={() => handleTaxChange("registration")}
//                   />
//                   <span>
//                     Registration Fees ({template?.registration_amount || "–"})
//                   </span>
//                 </label>
//                 <label className="cs-checkbox">
//                   <input
//                     type="checkbox"
//                     checked={taxes.legalFees}
//                     onChange={() => handleTaxChange("legalFees")}
//                   />
//                   <span>Legal Fees ({template?.legal_fee_amount || "–"})</span>
//                 </label>
//               </div>

//               {/* Statutory / Govt. type charges */}
//               <div className="cs-statutory-box">
//                 {/* <div className="cs-field cs-field-inline">
//                   <label className="cs-label">No. of Parking</label>
//                   <span className="cs-parking-count-display">
//                     {hasParking ? parkingCount || 0 : 0}
//                   </span>
//                 </div> */}

//                 <ul className="cs-bullet-list">
//                   {/* Car Parking */}
//                   <li className="cs-bullet-item">
//                     <div className="cs-bullet-line">
//                       <span className="cs-bullet-label">
//                         Car Parking Charges
//                       </span>
//                       <span className="cs-bullet-amount">
//                         {formatINR(parkingAmount || 0)}
//                       </span>
//                     </div>
//                     {project?.price_per_parking && (
//                       <div className="cs-bullet-hint">
//                         ({formatINR(project.price_per_parking)} ×{" "}
//                         {hasParking ? parkingCount || 0 : 0} parking)
//                       </div>
//                     )}
//                   </li>

//                   {/* Membership */}
//                   <li className="cs-bullet-item">
//                     <div className="cs-bullet-line">
//                       <span className="cs-bullet-label">
//                         Share Application / Membership Fees
//                       </span>
//                       <span className="cs-bullet-amount">
//                         {formatINR(membershipAmount || 0)}
//                       </span>
//                     </div>
//                     {template?.share_application_money_membership_fees && (
//                       <div className="cs-bullet-hint">
//                         (
//                         {formatINR(
//                           template.share_application_money_membership_fees || 0
//                         )}{" "}
//                         fixed)
//                       </div>
//                     )}
//                   </li>

//                   {/* Development */}
//                   <li className="cs-bullet-item">
//                     <div className="cs-bullet-line">
//                       <span className="cs-bullet-label">
//                         Development Charges
//                       </span>
//                       <span className="cs-bullet-amount">
//                         {formatINR(developmentChargesAmount || 0)}
//                       </span>
//                     </div>
//                     {template?.development_charges_psf && (
//                       <div className="cs-bullet-hint">
//                         ({template.development_charges_psf} × Carpet Area)
//                       </div>
//                     )}
//                   </li>

//                   {/* Electrical / Water / Other */}
//                   <li className="cs-bullet-item">
//                     <div className="cs-bullet-line">
//                       <span className="cs-bullet-label">
//                         Electrical / Water / Other
//                       </span>
//                       <span className="cs-bullet-amount">
//                         {formatINR(electricalChargesAmount || 0)}
//                       </span>
//                     </div>
//                     {template?.electrical_watern_n_all_charges && (
//                       <div className="cs-bullet-hint">
//                         (
//                         {formatINR(
//                           template.electrical_watern_n_all_charges || 0
//                         )}{" "}
//                         fixed)
//                       </div>
//                     )}
//                   </li>

//                   {/* Provisional Maintenance */}
//                   <li className="cs-bullet-item">
//                     <div className="cs-bullet-line">
//                       <span className="cs-bullet-label">
//                         Provisional Maintenance
//                       </span>
//                       <span className="cs-bullet-amount">
//                         {formatINR(provisionalMaintenanceAmount || 0)}
//                       </span>
//                     </div>
//                     {template?.provisional_maintenance_psf && (
//                       <div className="cs-bullet-hint">
//                         ({template.provisional_maintenance_psf} × Carpet Area)
//                       </div>
//                     )}
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             <div className="cs-taxes-total">
//               <div className="cs-summary-row">
//                 <span>Statutory Charges</span>
//                 <span className="cs-taxes-amount">
//                   {formatINR(statutoryChargesTotal || 0)}
//                 </span>
//               </div>
//               <span className="cs-taxes-label">Total Taxes</span>
//               <span className="cs-taxes-amount">
//                 {formatINR(totalTaxes || 0)}
//               </span>
//               <div className="cs-final-amount">
//                 Final Amount (Incl. Taxes &amp; Statutory):{" "}
//                 {formatINR(finalAmount || 0)}
//               </div>
//             </div>
//           </div>
//         </SectionCard>

//         {/* PAYMENT PLAN */}
//         <SectionCard title="Payment Plan">
//           {/* Master vs Custom toggle */}
//           <div className="cs-radio-group" style={{ marginBottom: 16 }}>
//             <label className="cs-radio">
//               <input
//                 type="radio"
//                 value="MASTER"
//                 checked={paymentPlanType === "MASTER"}
//                 onChange={() => setPaymentPlanType("MASTER")}
//               />
//               <span>Use Project Payment Plan</span>
//             </label>
//             <label className="cs-radio">
//               <input
//                 type="radio"
//                 value="CUSTOM"
//                 checked={paymentPlanType === "CUSTOM"}
//                 onChange={() => setPaymentPlanType("CUSTOM")}
//               />
//               <span>Make Your Own Plan</span>
//             </label>
//           </div>

//           {/* Plan dropdown only for MASTER mode */}
//           {paymentPlanType === "MASTER" && (
//             <div
//               className="cs-field cs-field--full"
//               style={{ marginBottom: 16 }}
//             >
//               <label className="cs-label">Select Payment Plan</label>
//               <select
//                 className="cs-select"
//                 value={selectedPlanId}
//                 onChange={handlePlanSelect}
//               >
//                 <option value="">-- Select Plan --</option>
//                 {paymentPlans.map((plan) => (
//                   <option key={plan.id} value={plan.id}>
//                     {plan.name} ({plan.code}) – {plan.total_percentage}%
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div className="cs-table">
//             <div className="cs-table-row cs-table-row--5 cs-table-header">
//               <div>Installment Name</div>
//               <div>Percentage</div>
//               <div>Amount</div>
//               <div>Due Date</div>
//               <div></div>
//             </div>

//             {planRows.map((row, index) => {
//               const pct = parseFloat(row.percentage) || 0;
//               const amount = finalAmount ? (finalAmount * pct) / 100 : 0;

//               return (
//                 <div className="cs-table-row cs-table-row--5" key={index}>
//                   <div>
//                     <input
//                       type="text"
//                       className="cs-input"
//                       value={row.name}
//                       onChange={(e) =>
//                         handlePlanRowChange(index, "name", e.target.value)
//                       }
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="number"
//                       className="cs-input"
//                       value={row.percentage}
//                       onChange={(e) =>
//                         handlePlanRowChange(index, "percentage", e.target.value)
//                       }
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       className="cs-input cs-input--currency"
//                       value={amount ? formatINR(amount) : ""}
//                       readOnly
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="date"
//                       className="cs-input"
//                       value={row.due_date}
//                       min={apiToday || undefined}
//                       onFocus={() => handleDueDateFocus(index)}
//                       onChange={(e) =>
//                         handlePlanRowChange(index, "due_date", e.target.value)
//                       }
//                     />
//                   </div>
//                   <div className="cs-table-cell-actions">
//                     <button
//                       type="button"
//                       className="cs-icon-button"
//                       onClick={() => removeInstallment(index)}
//                       aria-label="Remove installment"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {totalPercentage !== 100 && (
//             <div className="cs-total-percentage">
//               Total Percentage: {totalPercentage.toFixed(3)}% (should be 100%)
//             </div>
//           )}

//           <button
//             type="button"
//             className="cs-button cs-button-outline"
//             onClick={addInstallment}
//           >
//             + Add Installment
//           </button>
//         </SectionCard>

//         {/* TERMS & NOTES */}

//         <SectionCard title="Terms & Notes">
//           <div className="cs-field cs-field--full">
//             <div className="cs-tnc-preview">
//               <div className="cs-tnc-preview-title">Terms &amp; Conditions</div>

//               {termsList.length ? (
//                 <ol className="cs-tnc-list">
//                   {termsList.map((item, idx) => (
//                     <li key={idx}>{item}</li>
//                   ))}
//                 </ol>
//               ) : (
//                 <p className="cs-tnc-empty">No terms configured.</p>
//               )}
//             </div>
//           </div>
//         </SectionCard>

//         {/* ATTACHMENTS */}
//         <SectionCard title="Attachments">
//           <div className="cs-attachments-dropzone" onClick={handleBrowseClick}>
//             <div className="cs-attachments-icon">⬆️</div>
//             <p className="cs-attachments-text">Drag and drop files here, or</p>
//             <button
//               type="button"
//               className="cs-button cs-button-light"
//               onClick={handleBrowseClick}
//             >
//               Browse Files
//             </button>

//             <input
//               type="file"
//               multiple
//               ref={fileInputRef}
//               onChange={handleFilesChange}
//               style={{ display: "none" }}
//             />
//           </div>

//           {attachments.length > 0 && (
//             <ul className="cs-attachments-list">
//               {attachments.map((file, idx) => (
//                 <li key={idx}>{file.name}</li>
//               ))}
//             </ul>
//           )}

//           <label className="cs-checkbox cs-attachments-checkbox">
//             <input type="checkbox" defaultChecked />
//             <span>Include attachments in PDF</span>
//           </label>
//         </SectionCard>

//         {/* SAVE BUTTON */}
//         <div className="cs-actions">
//           <button
//             type="button"
//             className="cs-button cs-button-primary"
//             onClick={handleSave}
//             disabled={saving}
//           >
//             {saving ? "Saving..." : "Save Cost Sheet"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import "./CostSheetCreate.css";
import { formatINR } from "../../utils/number";

// Generic collapsible section with chevron
const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`cs-card ${open ? "cs-card-open" : "cs-card-closed"}`}>
      <button
        type="button"
        className="cs-card-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <h2 className="cs-section-title">{title}</h2>
        <span className={`cs-chevron ${open ? "cs-chevron-open" : ""}`} />
      </button>

      {open && <div className="cs-card-body">{children}</div>}
    </section>
  );
};

const CostSheetCreate = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initError, setInitError] = useState("");
  const [apiErrors, setApiErrors] = useState([]);

  // ----------- API data -----------
  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [offers, setOffers] = useState([]);

  const formatINRNoDecimals = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const num = Number(val);
    if (Number.isNaN(num)) return "";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  const [discountFocused, setDiscountFocused] = useState(false);

  const [towers, setTowers] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});

  const [apiToday, setApiToday] = useState("");
  const [validTillLimit, setValidTillLimit] = useState("");

  // ----------- Header form -----------
  const [quotationDate, setQuotationDate] = useState("");
  const [validTill, setValidTill] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [preparedBy, setPreparedBy] = useState("");

  // ----------- Attachments -----------
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // ----------- Customer & Unit section -----------
  const [customerName, setCustomerName] = useState("");
  const [customerContactPerson, setCustomerContactPerson] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [projectName, setProjectName] = useState("");
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");

  const [towerName, setTowerName] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [unitNo, setUnitNo] = useState("");

  // ----------- Base pricing -----------
  // ✅ FIXED: Support all area combinations
  const [areaBasis, setAreaBasis] = useState("RERA");
  // Options: RERA, CARPET, SALEABLE, BUILTUP, RERA+BALCONY, CARPET+BALCONY
  const [baseAreaSqft, setBaseAreaSqft] = useState("");
  const [baseRatePsf, setBaseRatePsf] = useState("");

  // Discount logic
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState("");

  const baseValue = useMemo(() => {
    const a = parseFloat(baseAreaSqft) || 0;
    const r = parseFloat(baseRatePsf) || 0;
    return a * r;
  }, [baseAreaSqft, baseRatePsf]);

  const { discountPercent, discountAmount, netBaseValue } = useMemo(() => {
    const bv = baseValue || 0;
    const rawVal = parseFloat(discountValue) || 0;

    if (!bv || !rawVal) {
      return {
        discountPercent: 0,
        discountAmount: 0,
        netBaseValue: bv,
      };
    }

    if (discountType === "Percentage") {
      const discAmt = (bv * rawVal) / 100;
      return {
        discountPercent: rawVal,
        discountAmount: discAmt,
        netBaseValue: bv - discAmt,
      };
    } else {
      const discAmt = rawVal;
      const pct = bv ? (discAmt * 100) / bv : 0;
      return {
        discountPercent: pct,
        discountAmount: discAmt,
        netBaseValue: bv - discAmt,
      };
    }
  }, [baseValue, discountType, discountValue]);

  const safeDiscountPercent =
    discountPercent !== null &&
    discountPercent !== undefined &&
    !Number.isNaN(discountPercent)
      ? Number(discountPercent.toFixed(2))
      : null;

  const safeDiscountAmount =
    discountAmount !== null &&
    discountAmount !== undefined &&
    !Number.isNaN(discountAmount)
      ? Number(discountAmount.toFixed(2))
      : null;

  // ----------- Payment plan -----------
  const [planRequired, setPlanRequired] = useState(true);
  const [paymentPlanType, setPaymentPlanType] = useState("MASTER");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planRows, setPlanRows] = useState([]);
  const [planError, setPlanError] = useState("");

  const handleDueDateFocus = (index) => {
    setPlanRows((rows) => {
      const copy = [...rows];
      const row = copy[index];

      if (!row || row.due_date) return rows;

      const prev = copy[index - 1];
      const fallback =
        (prev && prev.due_date) || quotationDate || apiToday || "";

      if (!fallback) return rows;

      copy[index] = { ...row, due_date: fallback };
      return copy;
    });
  };

  const totalPercentage = useMemo(
    () =>
      planRows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0),
    [planRows]
  );

  // ----------- Additional charges -----------
  const [charges, setCharges] = useState([
    { name: "Amenity Charges", type: "Fixed", value: "", amount: "" },
  ]);

  // Parking
  const [hasParking, setHasParking] = useState(false);
  const [parkingCount, setParkingCount] = useState("");
  const [parkingPrice, setParkingPrice] = useState("");
  const [parkingPriceFocused, setParkingPriceFocused] = useState(false);

  // Possession charges
  const [isPossessionCharges, setIsPossessionCharges] = useState(false);
  const [possessionGstPercent, setPossessionGstPercent] = useState(0);
  const [provisionalMaintenanceMonths, setProvisionalMaintenanceMonths] =
    useState(0);

  const additionalChargesTotal = useMemo(
    () => charges.reduce((sum, c) => sum + (parseFloat(c.amount || 0) || 0), 0),
    [charges]
  );

  const baseAreaNum = parseFloat(baseAreaSqft || 0) || 0;
  const effectiveBaseRate =
    baseAreaNum && netBaseValue ? netBaseValue / baseAreaNum : 0;

  // ========== COST CALCULATIONS ==========

  const { parkingAmount, stampAmount, gstAmount, mainCostTotal } =
    useMemo(() => {
      const pricePerParking = parseFloat(parkingPrice) || 0;
      const parkingCountNum = Number(parkingCount || 0) || 0;
      const parkingAmt = pricePerParking * parkingCountNum;

      const baseForTaxes =
        (netBaseValue || 0) + (additionalChargesTotal || 0) + parkingAmt;

      const stampPercent = template?.stamp_duty_percent
        ? parseFloat(template.stamp_duty_percent) || 0
        : 0;
      // ✅ Round to 2 decimal places
      const stampAmt =
        Math.round(((baseForTaxes * stampPercent) / 100) * 100) / 100;

      const gstPercent = template?.gst_percent
        ? parseFloat(template.gst_percent) || 0
        : 0;
      // ✅ Round to 2 decimal places
      const gstAmt =
        Math.round(((baseForTaxes * gstPercent) / 100) * 100) / 100;

      const mainTotal = baseForTaxes + stampAmt + gstAmt;

      return {
        parkingAmount: parkingAmt,
        stampAmount: stampAmt,
        gstAmount: gstAmt,
        mainCostTotal: mainTotal,
      };
    }, [
      netBaseValue,
      additionalChargesTotal,
      parkingPrice,
      parkingCount,
      template,
    ]);

  const {
    membershipAmount,
    legalComplianceAmount,
    developmentChargesAmount,
    electricalChargesAmount,
    provisionalMaintenanceAmount,
    possessionSubtotal,
    possessionGstAmount,
    possessionTotal,
  } = useMemo(() => {
    if (!isPossessionCharges) {
      return {
        membershipAmount: 0,
        legalComplianceAmount: 0,
        developmentChargesAmount: 0,
        electricalChargesAmount: 0,
        provisionalMaintenanceAmount: 0,
        possessionSubtotal: 0,
        possessionGstAmount: 0,
        possessionTotal: 0,
      };
    }

    const selectedInv =
      selectedInventoryId && inventoryMap[String(selectedInventoryId)]
        ? inventoryMap[String(selectedInventoryId)]
        : null;

    const carpetAreaSqft =
      parseFloat(
        (selectedInv && selectedInv.carpet_sqft) || baseAreaSqft || 0
      ) || 0;

    const membershipAmt =
      template && template.share_application_money_membership_fees
        ? Number(template.share_application_money_membership_fees)
        : 0;

    const legalAmt =
      template && template.legal_fee_amount
        ? Number(template.legal_fee_amount)
        : 0;

    const devRate =
      template && template.development_charges_psf
        ? Number(template.development_charges_psf)
        : 0;
    const devAmt = devRate * carpetAreaSqft;

    const elecAmt =
      template && template.electrical_watern_n_all_charges
        ? Number(template.electrical_watern_n_all_charges)
        : 0;

    const provRate =
      template && template.provisional_maintenance_psf
        ? Number(template.provisional_maintenance_psf)
        : 0;
    const provAmt = provRate * carpetAreaSqft;

    const subtotal = membershipAmt + legalAmt + devAmt + elecAmt + provAmt;

    // ✅ Round to 2 decimal places
    const gstAmt =
      Math.round(((subtotal * possessionGstPercent) / 100) * 100) / 100;

    const total = subtotal + gstAmt;

    return {
      membershipAmount: membershipAmt,
      legalComplianceAmount: legalAmt,
      developmentChargesAmount: devAmt,
      electricalChargesAmount: elecAmt,
      provisionalMaintenanceAmount: provAmt,
      possessionSubtotal: subtotal,
      possessionGstAmount: gstAmt,
      possessionTotal: total,
    };
  }, [
    isPossessionCharges,
    template,
    selectedInventoryId,
    inventoryMap,
    baseAreaSqft,
    possessionGstPercent,
  ]);

  const registrationAmount = useMemo(() => {
    return template && template.registration_amount
      ? parseFloat(template.registration_amount) || 0
      : 0;
  }, [template]);

  const finalAmount = useMemo(() => {
    return mainCostTotal + possessionTotal + registrationAmount;
  }, [mainCostTotal, possessionTotal, registrationAmount]);

  // ----------- Text sections -----------
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const termsList = useMemo(() => {
    if (!termsAndConditions) return [];
    return termsAndConditions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^\d+\.?\s*(.*)$/);
        return m && m[1] ? m[1] : line;
      });
  }, [termsAndConditions]);

  const handleDiscountValueChange = (e) => {
    const input = e.target.value;

    if (discountType === "Percentage") {
      setDiscountValue(input);
      return;
    }

    const raw = input.replace(/,/g, "");

    if (raw === "") {
      setDiscountValue("");
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) return;

    setDiscountValue(raw);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        const name = u?.username || u?.full_name || "";
        if (name) setPreparedBy(name);
      }
    } catch (e) {
      console.warn("Could not read user from localStorage", e);
    }
  }, []);

  // ==============================
  // Load init + sales lead + booking data
  // ==============================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setInitError("");

        const initRes = await api.get(`/costsheet/lead/${leadId}/init/`);
        const data = initRes.data;

        if (!data || !data.project || !data.project.id) {
          throw new Error(
            "Init API did not return a valid project for this lead."
          );
        }

        let salesFull = null;
        try {
          const salesRes = await api.get(
            `/sales/sales-leads/${leadId}/full-info/`
          );
          salesFull = salesRes.data;
        } catch (err) {
          console.warn(
            "Sales full-info failed, falling back to init lead data:",
            err?.response?.status,
            err?.response?.data || err
          );
        }

        setLead(data.lead);
        setProject(data.project);
        setTemplate(data.template);
        setPaymentPlans(data.payment_plans || []);
        setOffers(data.offers || []);

        setApiToday(data.today);
        setQuotationDate(data.today);
        setValidTill(data.valid_till);
        setValidTillLimit(data.valid_till);

        if (data.template) {
          setPlanRequired(data.template.is_plan_required !== false);
          setIsPossessionCharges(
            data.template.is_possessional_charges === true
          );
          setPossessionGstPercent(
            parseFloat(data.template.possessional_gst_percent) || 0
          );
          setProvisionalMaintenanceMonths(
            parseInt(data.template.provisional_maintenance_months) || 0
          );
          setTermsAndConditions(data.template.terms_and_conditions || "");
        }

        if (data.project && data.project.price_per_parking) {
          setParkingPrice(
            String(Math.round(Number(data.project.price_per_parking)))
          );
        }

        const leadFullName = salesFull?.full_name || data.lead.full_name || "";
        const leadMobile =
          salesFull?.mobile_number || data.lead.mobile_number || "";
        const leadEmail = salesFull?.email || data.lead.email || "";

        setCustomerName(leadFullName);
        setCustomerContactPerson(leadFullName);
        setCustomerPhone(leadMobile);
        setCustomerEmail(leadEmail);

        setProjectName(data.project.name || "");

        const projectRate =
          data.project.price_per_sqft != null
            ? String(Math.round(Number(data.project.price_per_sqft)))
            : "";

        setBaseRatePsf(projectRate);

        // Booking Setup
        let bookingData = null;
        try {
          const bookingRes = await api.get("/client/booking-setup/", {
            params: {
              project_id: data.project.id,
            },
          });
          bookingData = bookingRes.data || {};
        } catch (err) {
          console.error(
            "Booking setup failed:",
            err?.response?.status,
            err?.response?.data || err
          );
          throw err;
        }

        const towersFromApi = bookingData.towers || [];

        const isBalconyCarpetPricingFromBooking = !!(
          bookingData.project && bookingData.project.is_pricing_balcony_carpert
        );

        if (isBalconyCarpetPricingFromBooking) {
          setProject((prev) => ({
            ...(prev || data.project || {}),
            is_pricing_balcony_carpert: true,
          }));
        }

        let primaryInterestedUnitId = null;
        if (
          salesFull &&
          Array.isArray(salesFull.interested_unit_links) &&
          salesFull.interested_unit_links.length > 0
        ) {
          const primaryLink =
            salesFull.interested_unit_links.find((l) => l.is_primary) ||
            salesFull.interested_unit_links[0];
          primaryInterestedUnitId = primaryLink?.unit || null;
        }

        let defaultInventoryId = null;

        const towersList = towersFromApi
          .map((tower) => {
            const floors = (tower.floors || [])
              .map((floor) => {
                const inventories = (floor.units || [])
                  .filter((u) => !!u.inventory)
                  .map((u) => {
                    const inv = u.inventory;

                    const isBooked =
                      u.status === "BOOKED" ||
                      inv.availability_status === "BOOKED" ||
                      inv.unit_status === "BOOKED";

                    const isAvailable = inv.availability_status === "AVAILABLE";

                    if (
                      primaryInterestedUnitId &&
                      u.id === primaryInterestedUnitId &&
                      !defaultInventoryId
                    ) {
                      defaultInventoryId = inv.id;
                    }

                    return {
                      inventory_id: inv.id,
                      unit_id: u.id,

                      unit_no: u.unit_no,
                      configuration:
                        inv.configuration_name || inv.unit_type_name || "",

                      // ✅ FIXED: Store all area types
                      rera_area_sqft: inv.rera_area_sqft,
                      saleable_sqft: inv.saleable_sqft,
                      carpet_sqft: inv.carpet_sqft,
                      builtup_sqft: inv.builtup_sqft,
                      balcony_area_sqft: inv.balcony_area_sqft,

                      agreement_value: inv.agreement_value || u.agreement_value,
                      rate_psf: inv.rate_psf,
                      base_price_psf: inv.base_price_psf,
                      total_cost: inv.total_cost,

                      isBooked,
                      isAvailable,
                      unit_status: u.status,
                      inventory_status: inv.availability_status,
                    };
                  });

                return {
                  floor_id: floor.id,
                  floor_number: floor.number,
                  inventories,
                };
              })
              .filter((f) => (f.inventories || []).length > 0);

            return {
              tower_id: tower.id,
              tower_name: tower.name,
              floors,
            };
          })
          .filter((t) => (t.floors || []).length > 0);

        setTowers(towersList);

        const invMap = {};
        towersList.forEach((t) => {
          (t.floors || []).forEach((f) => {
            (f.inventories || []).forEach((inv) => {
              invMap[String(inv.inventory_id)] = {
                ...inv,
                tower_id: t.tower_id,
                tower_name: t.tower_name,
                floor_id: f.floor_id,
                floor_number: f.floor_number,
              };
            });
          });
        });
        setInventoryMap(invMap);

        // Auto-select if found
        if (defaultInventoryId) {
          const inv = invMap[String(defaultInventoryId)];
          if (inv) {
            setSelectedInventoryId(String(inv.inventory_id));
            setSelectedTowerId(String(inv.tower_id || ""));
            setTowerName(inv.tower_name || "");
            setSelectedFloorId(String(inv.floor_id || ""));
            setFloorNumber(inv.floor_number || "");
            setUnitNo(inv.unit_no || "");

            // ✅ FIXED: Default to RERA + BALCONY if balcony pricing enabled
            if (isBalconyCarpetPricingFromBooking) {
              const reraNum = Number(inv.rera_area_sqft || 0);
              const balconyNum = Number(inv.balcony_area_sqft || 0);
              const total = reraNum + balconyNum;
              setBaseAreaSqft(total ? String(total) : "");
              setAreaBasis("RERA+BALCONY");
            } else {
              const autoArea =
                inv.rera_area_sqft ||
                inv.saleable_sqft ||
                inv.carpet_sqft ||
                "";
              setBaseAreaSqft(autoArea || "");
              setAreaBasis(inv.rera_area_sqft ? "RERA" : "SALEABLE");
            }

            const autoRatePsfRaw =
              inv.base_price_psf ||
              inv.rate_psf ||
              data.project.price_per_sqft ||
              "";

            if (autoRatePsfRaw !== "") {
              const clean = String(Math.round(Number(autoRatePsfRaw)));
              setBaseRatePsf(clean);
            }
          }
        }

        if (bookingData.payment_plans) {
          setPaymentPlans(bookingData.payment_plans);
        }
      } catch (err) {
        console.error("❌ Cost sheet init failed:", err?.response || err);
        let message = "Failed to load cost sheet init data.";
        const resp = err?.response;
        if (resp?.data) {
          if (resp.data.detail) message = resp.data.detail;
          else if (typeof resp.data === "string") message = resp.data;
        } else if (err?.message) {
          message = err.message;
        }
        setInitError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      load();
    }
  }, [leadId]);

  // ==============================
  // Inventory handlers
  // ==============================
  const handleTowerChange = (e) => {
    const value = e.target.value;
    setSelectedTowerId(value);
    setSelectedFloorId("");
    setSelectedInventoryId("");
    setTowerName(
      towers.find((t) => String(t.tower_id) === value)?.tower_name || ""
    );
  };

  const handleFloorChange = (e) => {
    const value = e.target.value;
    setSelectedFloorId(value);
    setSelectedInventoryId("");
    const tower = towers.find((t) => String(t.tower_id) === selectedTowerId);
    const floor =
      tower?.floors.find((f) => String(f.floor_id) === value) || null;
    setFloorNumber(floor?.floor_number || "");
  };

  const handleInventoryChange = (e) => {
    const value = e.target.value;
    setSelectedInventoryId(value);

    const inv = inventoryMap[String(value)];
    if (!inv) return;

    setSelectedTowerId(String(inv.tower_id || ""));
    setTowerName(inv.tower_name || "");
    setSelectedFloorId(String(inv.floor_id || ""));
    setFloorNumber(inv.floor_number || "");
    setUnitNo(inv.unit_no || "");

    const isBalconyCarpetPricingLocal =
      project?.is_pricing_balcony_carpert === true;

    // ✅ FIXED: Set default area basis
    if (isBalconyCarpetPricingLocal) {
      setAreaBasis("RERA+BALCONY");
      const rera = Number(inv.rera_area_sqft || 0);
      const balcony = Number(inv.balcony_area_sqft || 0);
      setBaseAreaSqft(String(rera + balcony));
    } else {
      if (inv.rera_area_sqft) {
        setAreaBasis("RERA");
        setBaseAreaSqft(inv.rera_area_sqft);
      } else if (inv.saleable_sqft) {
        setAreaBasis("SALEABLE");
        setBaseAreaSqft(inv.saleable_sqft);
      } else {
        setAreaBasis("CARPET");
        setBaseAreaSqft(inv.carpet_sqft || "");
      }
    }

    const autoRatePsfRaw =
      inv.base_price_psf || inv.rate_psf || project?.price_per_sqft || "";
    if (autoRatePsfRaw !== "") {
      const clean = String(Math.round(Number(autoRatePsfRaw)));
      setBaseRatePsf(clean);
    }
  };

  // ✅ FIXED: Handle area basis change
  const handleAreaBasisChange = (e) => {
    const newBasis = e.target.value;
    setAreaBasis(newBasis);

    if (!selectedInventory) return;

    const inv = selectedInventory;
    const rera = Number(inv.rera_area_sqft || 0);
    const carpet = Number(inv.carpet_sqft || 0);
    const saleable = Number(inv.saleable_sqft || 0);
    const builtup = Number(inv.builtup_sqft || 0);
    const balcony = Number(inv.balcony_area_sqft || 0);

    let newArea = 0;
    switch (newBasis) {
      case "RERA":
        newArea = rera;
        break;
      case "CARPET":
        newArea = carpet;
        break;
      case "SALEABLE":
        newArea = saleable;
        break;
      case "BUILTUP":
        newArea = builtup;
        break;
      case "RERA+BALCONY":
        newArea = rera + balcony;
        break;
      case "CARPET+BALCONY":
        newArea = carpet + balcony;
        break;
      default:
        newArea = rera;
    }

    setBaseAreaSqft(newArea ? String(newArea) : "");
  };

  const selectedTower = towers.find(
    (t) => String(t.tower_id) === String(selectedTowerId)
  );
  const floors = selectedTower ? selectedTower.floors || [] : [];
  const selectedFloor = floors.find(
    (f) => String(f.floor_id) === String(selectedFloorId)
  );
  const inventories = selectedFloor ? selectedFloor.inventories || [] : [];

  const selectedInventory =
    selectedInventoryId && inventoryMap[String(selectedInventoryId)]
      ? inventoryMap[String(selectedInventoryId)]
      : null;

  const isBalconyCarpetPricing = project?.is_pricing_balcony_carpert === true;

  // ✅ FIXED: Calculate area based on selection
  const calculatedArea = useMemo(() => {
    if (!selectedInventory) return 0;

    const inv = selectedInventory;
    const rera = Number(inv.rera_area_sqft || 0);
    const carpet = Number(inv.carpet_sqft || 0);
    const saleable = Number(inv.saleable_sqft || 0);
    const builtup = Number(inv.builtup_sqft || 0);
    const balcony = Number(inv.balcony_area_sqft || 0);

    switch (areaBasis) {
      case "RERA":
        return rera;
      case "CARPET":
        return carpet;
      case "SALEABLE":
        return saleable;
      case "BUILTUP":
        return builtup;
      case "RERA+BALCONY":
        return rera + balcony;
      case "CARPET+BALCONY":
        return carpet + balcony;
      default:
        return rera;
    }
  }, [selectedInventory, areaBasis]);

  // ==============================
  // Payment plan handlers
  // ==============================
  const handlePlanSelect = (e) => {
    const value = e.target.value;
    setSelectedPlanId(value);
    setPlanError("");

    const plan = paymentPlans.find((p) => String(p.id) === String(value));
    if (!plan) {
      setPlanRows([]);
      return;
    }

    const rows = (plan.slabs || []).map((slab) => ({
      slab_id: slab.id,
      name: slab.name,
      percentage: slab.percentage,
      due_date: "",
    }));
    setPlanRows(rows);
  };

  const handlePlanRowChange = (index, field, value) => {
    setPlanError("");
    const updated = [...planRows];
    updated[index] = { ...updated[index], [field]: value };
    setPlanRows(updated);
  };

  const addInstallment = () => {
    setPlanRows((rows) => [
      ...rows,
      { slab_id: null, name: "", percentage: "", due_date: "" },
    ]);
  };

  const removeInstallment = (index) => {
    setPlanError("");
    setPlanRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleChargeAmountChange = (index, input) => {
    const raw = input.replace(/,/g, "");

    if (raw === "") {
      handleChargesChange(index, "amount", "");
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) return;

    handleChargesChange(index, "amount", raw);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(files);
  };

  const handleChargesChange = (index, field, value) => {
    const updated = [...charges];
    updated[index][field] = value;
    setCharges(updated);
  };

  const addCharge = () => {
    setCharges([
      ...charges,
      { name: "", type: "Fixed", value: "", amount: "" },
    ]);
  };

  const [chargeFocusIndex, setChargeFocusIndex] = useState(null);

  const handleQuotationDateChange = (e) => {
    const value = e.target.value;

    if (apiToday && value < apiToday) {
      toast.error("Quoted date cannot be before today.");
      setQuotationDate(apiToday);
      return;
    }

    if (validTill && value > validTill) {
      toast.error("Quoted date cannot be after Valid Until date.");
      setQuotationDate(validTill);
      return;
    }

    setQuotationDate(value);
  };

  const handleValidTillChange = (e) => {
    const value = e.target.value;

    if (apiToday && value < apiToday) {
      toast.error("Valid until cannot be before today.");
      setValidTill(apiToday);
      return;
    }

    if (validTillLimit && value > validTillLimit) {
      toast.error("Valid until cannot go beyond allowed validity.");
      setValidTill(validTillLimit);
      return;
    }

    if (quotationDate && value < quotationDate) {
      toast.error("Valid until cannot be before quoted date.");
      setValidTill(quotationDate);
      return;
    }

    setValidTill(value);
  };

  // ==============================
  // Save
  // ==============================
  const handleSave = async () => {
    setApiErrors([]);
    if (!lead || !project) {
      toast.error("Lead / project not loaded.");
      return;
    }
    if (!selectedInventoryId) {
      toast.error("Please select an inventory/unit.");
      return;
    }

    const selectedInv = inventoryMap[String(selectedInventoryId)];
    if (selectedInv && selectedInv.isBooked) {
      toast.error("This unit is already booked. Please choose another unit.");
      return;
    }

    if (quotationDate && validTill && quotationDate > validTill) {
      toast.error("Quote date cannot be after Valid Until date.");
      return;
    }

    if (
      planRequired &&
      planRows.length &&
      Math.round(totalPercentage * 1000) !== 100000
    ) {
      toast.error("Total payment plan percentage must be exactly 100%.");
      return;
    }

    const roundedFinalAmount =
      finalAmount !== null && finalAmount !== undefined
        ? Number(finalAmount.toFixed(2))
        : null;

    const customPaymentPlan =
      planRows.length > 0
        ? planRows.map((row) => {
            const pct = parseFloat(row.percentage || 0) || 0;
            return {
              name: row.name,
              percentage: row.percentage,
              amount:
                roundedFinalAmount && pct
                  ? ((roundedFinalAmount * pct) / 100).toFixed(2)
                  : null,
              due_date: row.due_date || null,
            };
          })
        : null;

    try {
      setSaving(true);

      const payload = {
        lead_id: lead.id,
        project_id: project.id,
        inventory_id: Number(selectedInventoryId),
        project_template_id: template ? template.project_template_id : null,

        date: quotationDate,
        valid_till: validTill,
        status,

        customer_name: customerName,
        customer_contact_person: customerContactPerson,
        customer_phone: customerPhone,
        customer_email: customerEmail,

        project_name: projectName,
        tower_name: towerName,
        floor_number: floorNumber,
        unit_no: unitNo,

        customer_snapshot: null,
        unit_snapshot: null,

        base_area_sqft: baseAreaSqft || null,
        base_rate_psf: baseRatePsf || null,
        base_value: baseValue || null,

        discount_percent: safeDiscountPercent,
        discount_amount: safeDiscountAmount,

        net_base_value: netBaseValue || null,

        payment_plan_type: planRequired ? paymentPlanType : null,
        payment_plan: planRequired && selectedPlanId ? selectedPlanId : null,
        custom_payment_plan: planRequired ? customPaymentPlan : null,

        gst_percent: template ? template.gst_percent : null,
        gst_amount: gstAmount ? Math.round(gstAmount * 100) / 100 : null,
        stamp_duty_percent: template ? template.stamp_duty_percent : null,
        stamp_duty_amount: stampAmount
          ? Math.round(stampAmount * 100) / 100
          : null,
        registration_amount: registrationAmount || null,
        legal_fee_amount: template?.legal_fee_amount || null,

        parking_count: hasParking ? Number(parkingCount) || 0 : 0,
        per_parking_price: hasParking ? parkingPrice || null : null,
        parking_amount: parkingAmount
          ? Math.round(parkingAmount * 100) / 100
          : null,

        share_application_money_membership_amount: isPossessionCharges
          ? membershipAmount || null
          : null,
        legal_compliance_charges_amount: isPossessionCharges
          ? legalComplianceAmount || null
          : null,
        development_charges_amount: isPossessionCharges
          ? developmentChargesAmount || null
          : null,
        electrical_water_piped_gas_charges_amount: isPossessionCharges
          ? electricalChargesAmount || null
          : null,
        provisional_maintenance_amount: isPossessionCharges
          ? provisionalMaintenanceAmount || null
          : null,
        possessional_gst_amount: isPossessionCharges
          ? possessionGstAmount
            ? Math.round(possessionGstAmount * 100) / 100
            : null
          : null,

        additional_charges_total: additionalChargesTotal || null,
        offers_total: null,
        net_payable_amount: roundedFinalAmount,

        terms_and_conditions: termsAndConditions,
        notes: "",

        additional_charges: [],
        applied_offers: [],
      };

      const res = await api.post("/costsheet/cost-sheets/all/", payload);

      toast.success("Cost Sheet created successfully.");
      const created = res?.data;
      const newId = created?.id;
      if (newId) {
        navigate(`/costsheet/${newId}`);
      }
    } catch (err) {
      console.error(err);

      const backendErrors = [];

      if (err.response && err.response.data) {
        const data = err.response.data;

        if (typeof data === "string") {
          backendErrors.push(data);
        } else if (typeof data === "object") {
          if (Array.isArray(data.__all__)) {
            backendErrors.push(...data.__all__);
          }
          if (Array.isArray(data.non_field_errors)) {
            backendErrors.push(...data.non_field_errors);
          }

          Object.keys(data).forEach((key) => {
            if (key === "__all__" || key === "non_field_errors") return;

            const value = data[key];
            if (Array.isArray(value)) {
              value.forEach((msg) => {
                backendErrors.push(`${key}: ${msg}`);
              });
            } else if (typeof value === "string") {
              backendErrors.push(`${key}: ${value}`);
            }
          });
        }
      }

      if (backendErrors.length) {
        setApiErrors(backendErrors);
        toast.error(backendErrors[0]);
      } else {
        toast.error("Failed to create cost sheet.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // RENDER
  // ==============================
  if (loading) {
    return <div className="cs-page">Loading...</div>;
  }

  if (initError) {
    return <div className="cs-page">Error: {initError}</div>;
  }

  return (
    <div className="cs-page">
      <div className="cs-page-inner">
        {/* QUOTATION HEADER */}
        <SectionCard title="Quotation Header">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Quote Date</label>
              <input
                type="date"
                className="cs-input"
                value={quotationDate}
                onChange={handleQuotationDateChange}
                min={apiToday || undefined}
                max={validTill || validTillLimit || undefined}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Valid Until</label>
              <input
                type="date"
                className="cs-input"
                value={validTill}
                onChange={handleValidTillChange}
                min={apiToday || undefined}
                max={validTillLimit || undefined}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Status</label>
              <select
                className="cs-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="cs-field cs-field--full">
              <label className="cs-label">Prepared By</label>
              <input
                type="text"
                className="cs-input"
                value={preparedBy}
                readOnly
                placeholder="Will be auto set from logged-in user"
              />
            </div>
          </div>
        </SectionCard>

        {/* CUSTOMER & UNIT DETAILS */}
        <SectionCard title="Customer & Unit Details">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Customer Name</label>
              <input
                type="text"
                className="cs-input"
                value={customerName}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Contact Person</label>
              <input
                type="text"
                className="cs-input"
                value={customerContactPerson}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Phone</label>
              <input
                type="text"
                className="cs-input"
                value={customerPhone}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Email</label>
              <input
                type="email"
                className="cs-input"
                value={customerEmail}
                readOnly
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Project</label>
              <input
                type="text"
                className="cs-input"
                value={projectName}
                readOnly
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Tower</label>
              <select
                className="cs-select"
                value={selectedTowerId}
                onChange={handleTowerChange}
              >
                <option value="">Select Tower</option>
                {towers.map((t) => (
                  <option key={t.tower_id} value={t.tower_id}>
                    {t.tower_name || `Tower ${t.tower_id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">Floor</label>
              <select
                className="cs-select"
                value={selectedFloorId}
                onChange={handleFloorChange}
              >
                <option value="">Select Floor</option>
                {floors.map((f) => (
                  <option key={f.floor_id} value={f.floor_id}>
                    {f.floor_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">Unit</label>
              <select
                className="cs-select"
                value={selectedInventoryId}
                onChange={handleInventoryChange}
              >
                <option value="">Select Unit</option>
                {inventories.map((inv) => {
                  const isBooked = inv.isBooked;
                  const isAvailable = inv.isAvailable;

                  return (
                    <option
                      key={inv.inventory_id}
                      value={inv.inventory_id}
                      disabled={!isAvailable}
                      style={isBooked ? { color: "red" } : undefined}
                    >
                      {inv.unit_no} ({inv.configuration})
                      {isBooked ? " - BOOKED" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* ✅ FIXED: BASE PRICING with dropdown for all area types */}
        <SectionCard title="Base Pricing">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Area Basis</label>
              <select
                className="cs-select"
                value={areaBasis}
                onChange={handleAreaBasisChange}
              >
                <option value="RERA">RERA Area</option>
                <option value="CARPET">Carpet Area</option>
                <option value="SALEABLE">Saleable Area</option>
                <option value="BUILTUP">Built-up Area</option>
                <option value="RERA+BALCONY">RERA + Balcony</option>
                <option value="CARPET+BALCONY">Carpet + Balcony</option>
              </select>
            </div>

            {/* Show individual areas if unit is selected */}
            {selectedInventory && (
              <>
                {selectedInventory.rera_area_sqft && (
                  <div className="cs-field">
                    <label className="cs-label">RERA Area (sq. ft.)</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={selectedInventory.rera_area_sqft}
                      readOnly
                    />
                  </div>
                )}

                {selectedInventory.carpet_sqft && (
                  <div className="cs-field">
                    <label className="cs-label">Carpet Area (sq. ft.)</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={selectedInventory.carpet_sqft}
                      readOnly
                    />
                  </div>
                )}


                {selectedInventory.balcony_area_sqft && (
                  <div className="cs-field">
                    <label className="cs-label">Balcony Area (sq. ft.)</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={selectedInventory.balcony_area_sqft}
                      readOnly
                    />
                  </div>
                )}
              </>
            )}

            <div className="cs-field">
              <label className="cs-label">Total Area (sq. ft.)</label>
              <input
                type="number"
                className="cs-input"
                value={baseAreaSqft}
                onChange={(e) => setBaseAreaSqft(e.target.value)}
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">
                Base Rate/sq. ft.
              </label>

              <input
                type="text"
                className="cs-input"
                value={
                  baseRatePsf === "" ? "" : formatINRNoDecimals(baseRatePsf)
                }
                onChange={(e) => {
                  const input = e.target.value;
                  const raw = input.replace(/,/g, "");

                  if (raw === "") {
                    setBaseRatePsf("");
                    return;
                  }

                  const num = Number(raw);
                  if (Number.isNaN(num)) return;

                  setBaseRatePsf(String(Math.round(num)));
                }}
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Agreement Value (Base Value)</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={baseValue ? formatINR(baseValue) : ""}
                readOnly
              />
            </div>

            {/* Discount Type */}
            <div className="cs-field">
              <label className="cs-label">Discount Type</label>
              <select
                className="cs-select"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Flat Amount</option>
              </select>
            </div>

            {/* Discount Input */}
            <div className="cs-field">
              <label className="cs-label">
                {discountType === "Percentage"
                  ? "Discount (%)"
                  : "Discount Amount"}
              </label>
              <input
                type="text"
                className="cs-input"
                value={
                  discountType === "Percentage"
                    ? discountValue
                    : discountFocused
                    ? discountValue
                    : discountValue === ""
                    ? ""
                    : formatINRNoDecimals(discountValue)
                }
                onFocus={() => setDiscountFocused(true)}
                onBlur={() => setDiscountFocused(false)}
                onChange={handleDiscountValueChange}
              />
            </div>

            {/* Computed discount amount (₹) */}
            <div className="cs-field">
              <label className="cs-label">Discount Amount (₹)</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={
                  discountAmount && !Number.isNaN(discountAmount)
                    ? formatINR(discountAmount)
                    : ""
                }
                readOnly
              />
            </div>

            {/* Net base value + effective rate */}
            <div className="cs-field cs-field--full">
              <label className="cs-label">Net Base Value</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={netBaseValue ? formatINR(netBaseValue) : ""}
                readOnly
              />
              {effectiveBaseRate > 0 && baseAreaSqft && (
                <p className="cs-hint">
                  Effective Rate After Discount: {formatINR(effectiveBaseRate)}{" "}
                  / sq. ft. on {baseAreaSqft} sq. ft.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ADDITIONAL CHARGES */}
        <SectionCard title="Additional Charges">
          <div className="cs-table">
            <div className="cs-table-row cs-table-header">
              <div>Charge Name</div>
              <div>Type</div>
              <div>Value</div>
              <div>Amount</div>
            </div>
            {charges.map((row, index) => (
              <div className="cs-table-row" key={index}>
                <div>
                  <input
                    type="text"
                    className="cs-input"
                    value={row.name}
                    onChange={(e) =>
                      handleChargesChange(index, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <select
                    className="cs-select"
                    value={row.type}
                    onChange={(e) =>
                      handleChargesChange(index, "type", e.target.value)
                    }
                  >
                    <option>Fixed</option>
                    <option>Percentage</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    className="cs-input"
                    value={row.value}
                    onChange={(e) =>
                      handleChargesChange(index, "value", e.target.value)
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="cs-input cs-input--currency"
                    value={
                      chargeFocusIndex === index
                        ? row.amount
                        : row.amount === ""
                        ? ""
                        : formatINRNoDecimals(row.amount)
                    }
                    onFocus={() => setChargeFocusIndex(index)}
                    onBlur={() => setChargeFocusIndex(null)}
                    onChange={(e) =>
                      handleChargeAmountChange(index, e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="cs-button cs-button-outline"
            onClick={addCharge}
          >
            + Add New Charge
          </button>
        </SectionCard>

        {/* COST BREAKDOWN */}
        <SectionCard title="Cost Breakdown">
          {/* Section 1: Main Cost */}
          <div className="cs-cost-section">
            <h3 className="cs-cost-section-title">Unit Cost Calculation</h3>

            <div className="cs-cost-breakdown">
              <div className="cs-cost-line">
                <span>Unit Cost after Discount</span>
                <span className="cs-cost-amount">
                  {formatINR(netBaseValue || 0)}
                </span>
              </div>

              <div className="cs-cost-line">
                <span>Additional Charges</span>
                <span className="cs-cost-amount">
                  {formatINR(additionalChargesTotal || 0)}
                </span>
              </div>

              {/* Parking */}
              <div className="cs-parking-section">
                <div className="cs-parking-header">
                  <span className="cs-label">Car Parking Required?</span>
                  <div className="cs-parking-controls">
                    <label className="cs-radio">
                      <input
                        type="radio"
                        value="no"
                        checked={!hasParking}
                        onChange={() => {
                          setHasParking(false);
                          setParkingCount("0");
                        }}
                      />
                      <span>No</span>
                    </label>
                    <label className="cs-radio">
                      <input
                        type="radio"
                        value="yes"
                        checked={hasParking}
                        onChange={() => {
                          setHasParking(true);
                          if (!parkingCount || parkingCount === "0") {
                            setParkingCount("1");
                          }
                        }}
                      />
                      <span>Yes</span>
                    </label>

                    {hasParking && (
                      <>
                        <select
                          className="cs-select cs-parking-count"
                          value={parkingCount}
                          onChange={(e) => setParkingCount(e.target.value)}
                        >
                          <option value="">Count</option>
                          {Array.from({ length: 10 }).map((_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              {idx + 1}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          className="cs-input cs-parking-price"
                          placeholder="Price per parking"
                          value={
                            parkingPriceFocused
                              ? parkingPrice
                              : parkingPrice === ""
                              ? ""
                              : formatINRNoDecimals(parkingPrice)
                          }
                          onFocus={() => setParkingPriceFocused(true)}
                          onBlur={() => setParkingPriceFocused(false)}
                          onChange={(e) => {
                            const input = e.target.value;
                            const raw = input.replace(/,/g, "");
                            if (raw === "") {
                              setParkingPrice("");
                              return;
                            }
                            const num = Number(raw);
                            if (!Number.isNaN(num)) {
                              setParkingPrice(String(Math.round(num)));
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="cs-cost-line">
                <span>Car Parking Amount</span>
                <span className="cs-cost-amount">
                  {formatINR(parkingAmount || 0)}
                </span>
              </div>

              <div className="cs-cost-line">
                <span>Stamp Duty ({template?.stamp_duty_percent || 0}%)</span>
                <span className="cs-cost-amount">
                  {formatINR(stampAmount || 0)}
                </span>
              </div>

              <div className="cs-cost-line">
                <span>GST ({template?.gst_percent || 0}%)</span>
                <span className="cs-cost-amount">
                  {formatINR(gstAmount || 0)}
                </span>
              </div>

              <div className="cs-cost-line cs-cost-subtotal">
                <span>Total Cost (1)</span>
                <span className="cs-cost-amount">
                  {formatINR(mainCostTotal || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Possession Charges */}
          {isPossessionCharges && (
            <div className="cs-cost-section cs-possession-section">
              <h3 className="cs-cost-section-title">
                Possession Related Charges
              </h3>

              <div className="cs-cost-breakdown">
                <div className="cs-cost-line">
                  <span>Share Application Money & Membership Fees</span>
                  <span className="cs-cost-amount">
                    {formatINR(membershipAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line">
                  <span>Legal & Compliance Charges</span>
                  <span className="cs-cost-amount">
                    {formatINR(legalComplianceAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line">
                  <span>
                    Development Charges @ Rs.{" "}
                    {template?.development_charges_psf || 0} PSF
                  </span>
                  <span className="cs-cost-amount">
                    {formatINR(developmentChargesAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line">
                  <span>Electrical, Water & Piped Gas Connection Charges</span>
                  <span className="cs-cost-amount">
                    {formatINR(electricalChargesAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line">
                  <span>
                    Provisional Maintenance for {provisionalMaintenanceMonths}{" "}
                    months @ Rs. {template?.provisional_maintenance_psf || 0}
                  </span>
                  <span className="cs-cost-amount">
                    {formatINR(provisionalMaintenanceAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line">
                  <span>
                    GST on Possession Charges ({possessionGstPercent}%)
                  </span>
                  <span className="cs-cost-amount">
                    {formatINR(possessionGstAmount || 0)}
                  </span>
                </div>

                <div className="cs-cost-line cs-cost-subtotal">
                  <span>Total Possession Related Charges (2)</span>
                  <span className="cs-cost-amount">
                    {formatINR(possessionTotal || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Registration */}
          <div className="cs-cost-section">
            <div className="cs-cost-breakdown">
              <div className="cs-cost-line">
                <span>Registration Amount</span>
                <span className="cs-cost-amount">
                  {formatINR(registrationAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="cs-cost-summary">
            <div className="cs-cost-summary-line">
              <span>Total Cost</span>
              <span className="cs-cost-amount">
                {formatINR(mainCostTotal || 0)}
              </span>
            </div>
            {isPossessionCharges && (
              <div className="cs-cost-summary-line">
                <span>Total Possession Related Charges</span>
                <span className="cs-cost-amount">
                  {formatINR(possessionTotal || 0)}
                </span>
              </div>
            )}
          </div>

          {/* Final Total */}
          <div className="cs-cost-final">
            <span>Grand Total</span>
            <span className="cs-cost-amount">
              {formatINR(finalAmount || 0)}
            </span>
          </div>
        </SectionCard>

        {/* PAYMENT PLAN */}
        {planRequired && (
          <SectionCard title="Payment Plan">
            <div className="cs-radio-group" style={{ marginBottom: 16 }}>
              <label className="cs-radio">
                <input
                  type="radio"
                  value="MASTER"
                  checked={paymentPlanType === "MASTER"}
                  onChange={() => setPaymentPlanType("MASTER")}
                />
                <span>Use Project Payment Plan</span>
              </label>
              <label className="cs-radio">
                <input
                  type="radio"
                  value="CUSTOM"
                  checked={paymentPlanType === "CUSTOM"}
                  onChange={() => setPaymentPlanType("CUSTOM")}
                />
                <span>Make Your Own Plan</span>
              </label>
            </div>

            {paymentPlanType === "MASTER" && (
              <div
                className="cs-field cs-field--full"
                style={{ marginBottom: 16 }}
              >
                <label className="cs-label">Select Payment Plan</label>
                <select
                  className="cs-select"
                  value={selectedPlanId}
                  onChange={handlePlanSelect}
                >
                  <option value="">-- Select Plan --</option>
                  {paymentPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code}) – {plan.total_percentage}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="cs-table">
              <div className="cs-table-row cs-table-row--5 cs-table-header">
                <div>Installment Name</div>
                <div>Percentage</div>
                <div>Amount</div>
                <div>Due Date</div>
                <div></div>
              </div>

              {planRows.map((row, index) => {
                const pct = parseFloat(row.percentage) || 0;
                const amount = finalAmount ? (finalAmount * pct) / 100 : 0;

                return (
                  <div className="cs-table-row cs-table-row--5" key={index}>
                    <div>
                      <input
                        type="text"
                        className="cs-input"
                        value={row.name}
                        onChange={(e) =>
                          handlePlanRowChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        className="cs-input"
                        value={row.percentage}
                        onChange={(e) =>
                          handlePlanRowChange(
                            index,
                            "percentage",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="cs-input cs-input--currency"
                        value={amount ? formatINR(amount) : ""}
                        readOnly
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        className="cs-input"
                        value={row.due_date}
                        min={apiToday || undefined}
                        onFocus={() => handleDueDateFocus(index)}
                        onChange={(e) =>
                          handlePlanRowChange(index, "due_date", e.target.value)
                        }
                      />
                    </div>
                    <div className="cs-table-cell-actions">
                      <button
                        type="button"
                        className="cs-icon-button"
                        onClick={() => removeInstallment(index)}
                        aria-label="Remove installment"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPercentage !== 100 && (
              <div className="cs-total-percentage">
                Total Percentage: {totalPercentage.toFixed(3)}% (should be 100%)
              </div>
            )}

            <button
              type="button"
              className="cs-button cs-button-outline"
              onClick={addInstallment}
            >
              + Add Installment
            </button>
          </SectionCard>
        )}

        {/* ATTACHMENTS */}
        <SectionCard title="Attachments">
          <div className="cs-attachments-dropzone" onClick={handleBrowseClick}>
            <div className="cs-attachments-icon">⬆️</div>
            <p className="cs-attachments-text">Drag and drop files here, or</p>
            <button
              type="button"
              className="cs-button cs-button-light"
              onClick={handleBrowseClick}
            >
              Browse Files
            </button>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFilesChange}
              style={{ display: "none" }}
            />
          </div>

          {attachments.length > 0 && (
            <ul className="cs-attachments-list">
              {attachments.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          )}

          <label className="cs-checkbox cs-attachments-checkbox">
            <input type="checkbox" defaultChecked />
            <span>Include attachments in PDF</span>
          </label>
        </SectionCard>

        {/* SAVE BUTTON */}
        <div className="cs-actions">
          <button
            type="button"
            className="cs-button cs-button-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Cost Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostSheetCreate;
