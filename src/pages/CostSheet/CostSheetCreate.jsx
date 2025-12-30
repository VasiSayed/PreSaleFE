
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../../api/axiosInstance";
// import { toast } from "react-hot-toast";
// import "./CostSheetCreate.css";
// import { formatINR } from "../../utils/number";

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
//   const { leadId } = useParams();
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

//   const [towers, setTowers] = useState([]);
//   const [inventoryMap, setInventoryMap] = useState({});

//   const [apiToday, setApiToday] = useState("");
//   const [validTillLimit, setValidTillLimit] = useState("");

//   // ----------- Header form -----------
//   const [quotationDate, setQuotationDate] = useState("");
//   const [validTill, setValidTill] = useState("");
//   const [status, setStatus] = useState("DRAFT");
//   const [preparedBy, setPreparedBy] = useState("");

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
//   // ✅ FIXED: Support all area combinations
//   const [areaBasis, setAreaBasis] = useState("RERA");
//   // Options: RERA, CARPET, SALEABLE, BUILTUP, RERA+BALCONY, CARPET+BALCONY
//   const [baseAreaSqft, setBaseAreaSqft] = useState("");
//   const [baseRatePsf, setBaseRatePsf] = useState("");

//   // Discount logic
//   const [discountType, setDiscountType] = useState("Fixed");
//   const [discountValue, setDiscountValue] = useState("");

//   const baseValue = useMemo(() => {
//     const a = parseFloat(baseAreaSqft) || 0;
//     const r = parseFloat(baseRatePsf) || 0;
//     return a * r;
//   }, [baseAreaSqft, baseRatePsf]);

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
//         discountPercent: rawVal,
//         discountAmount: discAmt,
//         netBaseValue: bv - discAmt,
//       };
//     } else {
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
//   const [planRequired, setPlanRequired] = useState(true);
//   const [paymentPlanType, setPaymentPlanType] = useState("MASTER");
//   const [selectedPlanId, setSelectedPlanId] = useState("");
//   const [planRows, setPlanRows] = useState([]);
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

//   // Parking
//   const [parkingRequired, setParkingRequired] = useState("NO"); // YES / NO
//   const [parkingCount, setParkingCount] = useState("");
//   const [parkingPrice, setParkingPrice] = useState("");
//   const [parkingPriceFocused, setParkingPriceFocused] = useState(false);

//   // Possession charges
//   const [isPossessionCharges, setIsPossessionCharges] = useState(false);
//   const [possessionGstPercent, setPossessionGstPercent] = useState(0);

//   // Tax checkboxes (to enable/disable taxes)
//   const [gstEnabled, setGstEnabled] = useState(true);
//   const [stampDutyEnabled, setStampDutyEnabled] = useState(true);
//   const [registrationEnabled, setRegistrationEnabled] = useState(true);
//   const [legalFeeEnabled, setLegalFeeEnabled] = useState(true);

//   const additionalChargesTotal = useMemo(
//     () => charges.reduce((sum, c) => sum + (parseFloat(c.amount || 0) || 0), 0),
//     [charges]
//   );

//   const baseAreaNum = parseFloat(baseAreaSqft || 0) || 0;
//   const effectiveBaseRate =
//     baseAreaNum && netBaseValue ? netBaseValue / baseAreaNum : 0;

//   // Helper function to strip formatting from amount
//   const stripAmount = (value) => {
//     return value.replace(/,/g, "").replace(/₹/g, "").trim();
//   };

//   // Calculate parking total when parking price or count changes
//   useEffect(() => {
//     if (parkingRequired !== "YES" || !parkingCount || !parkingPrice) {
//       return;
//     }

//     const amt = Number(stripAmount(parkingPrice)) || 0;
//     const count = Number(parkingCount) || 0;
//     // parkingAmount is calculated in the useMemo, so no need to set it here
//   }, [parkingPrice, parkingCount, parkingRequired]);

//   // ========== COST CALCULATIONS ==========
//   // ✅ Match BookingForm: Base for taxes = baseValue (before discount) + additional charges + parking
//   const agreementValue = baseValue; // Unit cost before discount (equivalent to BookingForm's agreementValue)

//   const { parkingAmount, stampAmount, gstAmount, mainCostTotal } =
//     useMemo(() => {
//       if (!template) {
//         return {
//           parkingAmount: 0,
//           stampAmount: 0,
//           gstAmount: 0,
//           mainCostTotal: 0,
//         };
//       }

//       const pricePerParking = parseFloat(parkingPrice) || 0;
//       const parkingCountNum = Number(parkingCount || 0) || 0;
//       const parkingAmt = pricePerParking * parkingCountNum;

//       // Base for GST and Stamp Duty: unit cost (before discount) + additional charges + parking total
//       const unitCost = Number(agreementValue || 0);
//       const additionalTotal = Number(additionalChargesTotal || 0);
//       const parkingTotalNumber = parkingRequired === "YES" ? parkingAmt : 0;
//       const baseForTaxes = unitCost + additionalTotal + parkingTotalNumber;

//       const gstPercent = Number(template.gst_percent) || 0;
//       const stampPercent = Number(template.stamp_duty_percent) || 0;

//       const calcGst = gstEnabled ? (baseForTaxes * gstPercent) / 100 : 0;
//       const calcStamp = stampDutyEnabled ? (baseForTaxes * stampPercent) / 100 : 0;

//       // ✅ Round to 2 decimal places
//       const stampAmt = Math.round(calcStamp * 100) / 100;
//       const gstAmt = Math.round(calcGst * 100) / 100;

//       // Total Cost (1) = unit cost + additional charges + parking + stamp duty + gst
//       const mainTotal =
//         unitCost + additionalTotal + parkingTotalNumber + stampAmt + gstAmt;

//       return {
//         parkingAmount: parkingAmt,
//         stampAmount: stampAmt,
//         gstAmount: gstAmt,
//         mainCostTotal: mainTotal,
//       };
//     }, [
//       agreementValue,
//       additionalChargesTotal,
//       parkingPrice,
//       parkingCount,
//       parkingRequired,
//       template,
//       gstEnabled,
//       stampDutyEnabled,
//     ]);

//   const {
//     membershipAmount,
//     legalComplianceAmount,
//     developmentChargesAmount,
//     electricalChargesAmount,
//     provisionalMaintenanceAmount,
//     possessionSubtotal,
//     possessionGstAmount,
//     possessionTotal,
//   } = useMemo(() => {
//     if (!isPossessionCharges) {
//       return {
//         membershipAmount: 0,
//         legalComplianceAmount: 0,
//         developmentChargesAmount: 0,
//         electricalChargesAmount: 0,
//         provisionalMaintenanceAmount: 0,
//         possessionSubtotal: 0,
//         possessionGstAmount: 0,
//         possessionTotal: 0,
//       };
//     }

//     const selectedInv =
//       selectedInventoryId && inventoryMap[String(selectedInventoryId)]
//         ? inventoryMap[String(selectedInventoryId)]
//         : null;

//     const carpetAreaSqft =
//       parseFloat(
//         (selectedInv && selectedInv.carpet_sqft) || baseAreaSqft || 0
//       ) || 0;

//     const membershipAmt =
//       template && template.share_application_money_membership_fees
//         ? Number(template.share_application_money_membership_fees)
//         : 0;

//     const legalAmt =
//       template && template.legal_fee_amount
//         ? (legalFeeEnabled ? Number(template.legal_fee_amount) : 0)
//         : 0;

//     const devRate =
//       template && template.development_charges_psf
//         ? Number(template.development_charges_psf)
//         : 0;
//     const devAmt = devRate * carpetAreaSqft;

//     const elecAmt =
//       template && template.electrical_watern_n_all_charges
//         ? Number(template.electrical_watern_n_all_charges)
//         : 0;

//     const provRate =
//       template && template.provisional_maintenance_psf
//         ? Number(template.provisional_maintenance_psf)
//         : 0;
//     const provMonths = template && template.provisional_maintenance_months
//       ? Number(template.provisional_maintenance_months)
//       : 0;
//     const provAmt = provRate * carpetAreaSqft * provMonths;

//     // Base for GST: Legal + Development + Electrical + Provisional Maintenance (Share Fee NOT included in GST base)
//     const baseForGst = legalAmt + devAmt + elecAmt + provAmt;
    
//     // GST on possession (18%) - applied on baseForGst (hardcoded as per BookingForm)
//     const gstAmt = Math.round(((baseForGst * 18) / 100) * 100) / 100;
    
//     // Total with GST (includes shareFee which is not in GST base)
//     const total = membershipAmt + baseForGst + gstAmt;

//     return {
//       membershipAmount: membershipAmt,
//       legalComplianceAmount: legalAmt,
//       developmentChargesAmount: devAmt,
//       electricalChargesAmount: elecAmt,
//       provisionalMaintenanceAmount: provAmt,
//       possessionSubtotal: baseForGst,
//       possessionGstAmount: gstAmt,
//       possessionTotal: total,
//     };
//   }, [
//     isPossessionCharges,
//     template,
//     selectedInventoryId,
//     inventoryMap,
//     baseAreaSqft,
//     possessionGstPercent,
//     legalFeeEnabled,
//   ]);

//   const registrationAmount = useMemo(() => {
//     if (!template) return 0;
//     const regAmount = Number(template.registration_amount) || 0;
//     return registrationEnabled ? regAmount : 0;
//   }, [template, registrationEnabled]);

//   // ✅ Match BookingForm: finalAmount = mainCostTotal (Total Cost 1)
//   const finalAmount = useMemo(() => {
//     return mainCostTotal;
//   }, [mainCostTotal]);

//   // ----------- Text sections -----------
//   const [termsAndConditions, setTermsAndConditions] = useState("");

//   const termsList = useMemo(() => {
//     if (!termsAndConditions) return [];
//     return termsAndConditions
//       .split(/\r?\n/)
//       .map((line) => line.trim())
//       .filter(Boolean)
//       .map((line) => {
//         const m = line.match(/^\d+\.?\s*(.*)$/);
//         return m && m[1] ? m[1] : line;
//       });
//   }, [termsAndConditions]);

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
//   // Load init + sales lead + booking data
//   // ==============================
//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         setInitError("");

//         const initRes = await api.get(`/costsheet/lead/${leadId}/init/`);
//         const data = initRes.data;

//         if (!data || !data.project || !data.project.id) {
//           throw new Error(
//             "Init API did not return a valid project for this lead."
//           );
//         }

//         let salesFull = null;
//         try {
//           const salesRes = await api.get(
//             `/sales/sales-leads/${leadId}/full-info/`
//           );
//           salesFull = salesRes.data;
//         } catch (err) {
//           console.warn(
//             "Sales full-info failed, falling back to init lead data:",
//             err?.response?.status,
//             err?.response?.data || err
//           );
//         }

//         setLead(data.lead);
//         setProject(data.project);
//         // Make template editable (similar to costTemplate in BookingForm)
//         if (data.template) {
//           setTemplate({
//             ...data.template,
//             gst_percent: data.template.gst_percent || 0,
//             stamp_duty_percent: data.template.stamp_duty_percent || 0,
//             provisional_maintenance_months: data.template.provisional_maintenance_months || 0,
//           });
//         } else {
//           setTemplate(data.template);
//         }
//         setPaymentPlans(data.payment_plans || []);
//         setOffers(data.offers || []);

//         setApiToday(data.today);
//         setQuotationDate(data.today);
//         setValidTill(data.valid_till);
//         setValidTillLimit(data.valid_till);

//         if (data.template) {
//           setPlanRequired(data.template.is_plan_required !== false);
//           setIsPossessionCharges(
//             data.template.is_possessional_charges === true
//           );
//           setPossessionGstPercent(
//             parseFloat(data.template.possessional_gst_percent) || 0
//           );
//           setTermsAndConditions(data.template.terms_and_conditions || "");
//         }

//         if (data.project && data.project.price_per_parking) {
//           setParkingPrice(
//             String(Math.round(Number(data.project.price_per_parking)))
//           );
//         }

//         const leadFullName = salesFull?.full_name || data.lead.full_name || "";
//         const leadMobile =
//           salesFull?.mobile_number || data.lead.mobile_number || "";
//         const leadEmail = salesFull?.email || data.lead.email || "";

//         setCustomerName(leadFullName);
//         setCustomerContactPerson(leadFullName);
//         setCustomerPhone(leadMobile);
//         setCustomerEmail(leadEmail);

//         setProjectName(data.project.name || "");

//         const projectRate =
//           data.project.price_per_sqft != null
//             ? String(Math.round(Number(data.project.price_per_sqft)))
//             : "";

//         setBaseRatePsf(projectRate);

//         // Booking Setup
//         let bookingData = null;
//         try {
//           const bookingRes = await api.get("/client/booking-setup/", {
//             params: {
//               project_id: data.project.id,
//             },
//           });
//           bookingData = bookingRes.data || {};
//         } catch (err) {
//           console.error(
//             "Booking setup failed:",
//             err?.response?.status,
//             err?.response?.data || err
//           );
//           throw err;
//         }

//         const towersFromApi = bookingData.towers || [];

//         const isBalconyCarpetPricingFromBooking = !!(
//           bookingData.project && bookingData.project.is_pricing_balcony_carpert
//         );

//         if (isBalconyCarpetPricingFromBooking) {
//           setProject((prev) => ({
//             ...(prev || data.project || {}),
//             is_pricing_balcony_carpert: true,
//           }));
//         }

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

//                     if (
//                       primaryInterestedUnitId &&
//                       u.id === primaryInterestedUnitId &&
//                       !defaultInventoryId
//                     ) {
//                       defaultInventoryId = inv.id;
//                     }

//                     return {
//                       inventory_id: inv.id,
//                       unit_id: u.id,

//                       unit_no: u.unit_no,
//                       configuration:
//                         inv.configuration_name || inv.unit_type_name || "",

//                       // ✅ FIXED: Store all area types
//                       rera_area_sqft: inv.rera_area_sqft,
//                       saleable_sqft: inv.saleable_sqft,
//                       carpet_sqft: inv.carpet_sqft,
//                       builtup_sqft: inv.builtup_sqft,
//                       balcony_area_sqft: inv.balcony_area_sqft,

//                       agreement_value: inv.agreement_value || u.agreement_value,
//                       rate_psf: inv.rate_psf,
//                       base_price_psf: inv.base_price_psf,
//                       total_cost: inv.total_cost,

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

//         // Auto-select if found
//         if (defaultInventoryId) {
//           const inv = invMap[String(defaultInventoryId)];
//           if (inv) {
//             setSelectedInventoryId(String(inv.inventory_id));
//             setSelectedTowerId(String(inv.tower_id || ""));
//             setTowerName(inv.tower_name || "");
//             setSelectedFloorId(String(inv.floor_id || ""));
//             setFloorNumber(inv.floor_number || "");
//             setUnitNo(inv.unit_no || "");

//             // ✅ FIXED: Default to RERA + BALCONY if balcony pricing enabled
//             if (isBalconyCarpetPricingFromBooking) {
//               const reraNum = Number(inv.rera_area_sqft || 0);
//               const balconyNum = Number(inv.balcony_area_sqft || 0);
//               const total = reraNum + balconyNum;
//               setBaseAreaSqft(total ? String(total) : "");
//               setAreaBasis("RERA+BALCONY");
//             } else {
//               const autoArea =
//                 inv.rera_area_sqft ||
//                 inv.saleable_sqft ||
//                 inv.carpet_sqft ||
//                 "";
//               setBaseAreaSqft(autoArea || "");
//               setAreaBasis(inv.rera_area_sqft ? "RERA" : "SALEABLE");
//             }

//             const autoRatePsfRaw =
//               inv.base_price_psf ||
//               inv.rate_psf ||
//               data.project.price_per_sqft ||
//               "";

//             if (autoRatePsfRaw !== "") {
//               const clean = String(Math.round(Number(autoRatePsfRaw)));
//               setBaseRatePsf(clean);
//             }
//           }
//         }

//         if (bookingData.payment_plans) {
//           setPaymentPlans(bookingData.payment_plans);
//         }
//       } catch (err) {
//         console.error("❌ Cost sheet init failed:", err?.response || err);
//         let message = "Failed to load cost sheet init data.";
//         const resp = err?.response;
//         if (resp?.data) {
//           if (resp.data.detail) message = resp.data.detail;
//           else if (typeof resp.data === "string") message = resp.data;
//         } else if (err?.message) {
//           message = err.message;
//         }
//         setInitError(message);
//         toast.error(message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (leadId) {
//       load();
//     }
//   }, [leadId]);

//   // ==============================
//   // Inventory handlers
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

//     const isBalconyCarpetPricingLocal =
//       project?.is_pricing_balcony_carpert === true;

//     // ✅ FIXED: Set default area basis
//     if (isBalconyCarpetPricingLocal) {
//       setAreaBasis("RERA+BALCONY");
//       const rera = Number(inv.rera_area_sqft || 0);
//       const balcony = Number(inv.balcony_area_sqft || 0);
//       setBaseAreaSqft(String(rera + balcony));
//     } else {
//       if (inv.rera_area_sqft) {
//         setAreaBasis("RERA");
//         setBaseAreaSqft(inv.rera_area_sqft);
//       } else if (inv.saleable_sqft) {
//         setAreaBasis("SALEABLE");
//         setBaseAreaSqft(inv.saleable_sqft);
//       } else {
//         setAreaBasis("CARPET");
//         setBaseAreaSqft(inv.carpet_sqft || "");
//       }
//     }

//     const autoRatePsfRaw =
//       inv.base_price_psf || inv.rate_psf || project?.price_per_sqft || "";
//     if (autoRatePsfRaw !== "") {
//       const clean = String(Math.round(Number(autoRatePsfRaw)));
//       setBaseRatePsf(clean);
//     }
//   };

//   // ✅ FIXED: Handle area basis change
//   const handleAreaBasisChange = (e) => {
//     const newBasis = e.target.value;
//     setAreaBasis(newBasis);

//     if (!selectedInventory) return;

//     const inv = selectedInventory;
//     const rera = Number(inv.rera_area_sqft || 0);
//     const carpet = Number(inv.carpet_sqft || 0);
//     const saleable = Number(inv.saleable_sqft || 0);
//     const builtup = Number(inv.builtup_sqft || 0);
//     const balcony = Number(inv.balcony_area_sqft || 0);

//     let newArea = 0;
//     switch (newBasis) {
//       case "RERA":
//         newArea = rera;
//         break;
//       case "CARPET":
//         newArea = carpet;
//         break;
//       case "SALEABLE":
//         newArea = saleable;
//         break;
//       case "BUILTUP":
//         newArea = builtup;
//         break;
//       case "RERA+BALCONY":
//         newArea = rera + balcony;
//         break;
//       case "CARPET+BALCONY":
//         newArea = carpet + balcony;
//         break;
//       default:
//         newArea = rera;
//     }

//     setBaseAreaSqft(newArea ? String(newArea) : "");
//   };

//   const selectedTower = towers.find(
//     (t) => String(t.tower_id) === String(selectedTowerId)
//   );
//   const floors = selectedTower ? selectedTower.floors || [] : [];
//   const selectedFloor = floors.find(
//     (f) => String(f.floor_id) === String(selectedFloorId)
//   );
//   const inventories = selectedFloor ? selectedFloor.inventories || [] : [];

//   const selectedInventory =
//     selectedInventoryId && inventoryMap[String(selectedInventoryId)]
//       ? inventoryMap[String(selectedInventoryId)]
//       : null;

//   const isBalconyCarpetPricing = project?.is_pricing_balcony_carpert === true;

//   // ✅ FIXED: Calculate area based on selection
//   const calculatedArea = useMemo(() => {
//     if (!selectedInventory) return 0;

//     const inv = selectedInventory;
//     const rera = Number(inv.rera_area_sqft || 0);
//     const carpet = Number(inv.carpet_sqft || 0);
//     const saleable = Number(inv.saleable_sqft || 0);
//     const builtup = Number(inv.builtup_sqft || 0);
//     const balcony = Number(inv.balcony_area_sqft || 0);

//     switch (areaBasis) {
//       case "RERA":
//         return rera;
//       case "CARPET":
//         return carpet;
//       case "SALEABLE":
//         return saleable;
//       case "BUILTUP":
//         return builtup;
//       case "RERA+BALCONY":
//         return rera + balcony;
//       case "CARPET+BALCONY":
//         return carpet + balcony;
//       default:
//         return rera;
//     }
//   }, [selectedInventory, areaBasis]);

//   // ==============================
//   // Payment plan handlers
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

//     handleChargesChange(index, "amount", raw);
//   };

//   const handleBrowseClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFilesChange = (e) => {
//     const files = Array.from(e.target.files || []);
//     setAttachments(files);
//   };

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

//   const [chargeFocusIndex, setChargeFocusIndex] = useState(null);

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
//   // Save
//   // ==============================
//   const handleSave = async () => {
//     setApiErrors([]);
//     if (!lead || !project) {
//       toast.error("Lead / project not loaded.");
//       return;
//     }
//     if (!selectedInventoryId) {
//       toast.error("Please select an inventory/unit.");
//       return;
//     }

//     const selectedInv = inventoryMap[String(selectedInventoryId)];
//     if (selectedInv && selectedInv.isBooked) {
//       toast.error("This unit is already booked. Please choose another unit.");
//       return;
//     }

//     if (quotationDate && validTill && quotationDate > validTill) {
//       toast.error("Quote date cannot be after Valid Until date.");
//       return;
//     }

//     if (
//       planRequired &&
//       planRows.length &&
//       Math.round(totalPercentage * 1000) !== 100000
//     ) {
//       toast.error("Total payment plan percentage must be exactly 100%.");
//       return;
//     }

//     const roundedFinalAmount =
//       finalAmount !== null && finalAmount !== undefined
//         ? Number(finalAmount.toFixed(2))
//         : null;

//     const customPaymentPlan =
//       planRows.length > 0
//         ? planRows.map((row) => {
//             const pct = parseFloat(row.percentage || 0) || 0;
//             return {
//               name: row.name,
//               percentage: row.percentage,
//               amount:
//                 roundedFinalAmount && pct
//                   ? ((roundedFinalAmount * pct) / 100).toFixed(2)
//                   : null,
//               due_date: row.due_date || null,
//             };
//           })
//         : null;

//     try {
//       setSaving(true);

//       const payload = {
//         lead_id: lead.id,
//         project_id: project.id,
//         inventory_id: Number(selectedInventoryId),
//         project_template_id: template ? template.project_template_id : null,

//         date: quotationDate,
//         valid_till: validTill,
//         status,
//         prepared_by: preparedBy || null,

//         customer_name: customerName,
//         customer_contact_person: customerContactPerson,
//         customer_phone: customerPhone,
//         customer_email: customerEmail,

//         project_name: projectName,
//         tower_name: towerName,
//         floor_number: floorNumber,
//         unit_no: unitNo,

//         customer_snapshot: null,
//         unit_snapshot: null,

//         base_area_sqft: baseAreaSqft || null,
//         base_rate_psf: baseRatePsf || null,
//         base_value: baseValue || null,

//         discount_percent: safeDiscountPercent,
//         discount_amount: safeDiscountAmount,

//         net_base_value: netBaseValue || null,

//         payment_plan_type: planRequired ? paymentPlanType : null,
//         payment_plan: planRequired && selectedPlanId ? selectedPlanId : null,
//         custom_payment_plan: planRequired ? customPaymentPlan : null,

//         gst_percent: template ? template.gst_percent : null,
//         gst_amount: gstAmount ? Math.round(gstAmount * 100) / 100 : null,
//         stamp_duty_percent: template ? template.stamp_duty_percent : null,
//         stamp_duty_amount: stampAmount
//           ? Math.round(stampAmount * 100) / 100
//           : null,
//         registration_amount: registrationAmount || null,
//         legal_fee_amount: template?.legal_fee_amount || null,

//         parking_count: parkingRequired === "YES" ? Number(parkingCount) || 0 : 0,
//         per_parking_price: parkingRequired === "YES" ? parkingPrice || null : null,
//         parking_amount: parkingAmount
//           ? Math.round(parkingAmount * 100) / 100
//           : null,

//         share_application_money_membership_amount: isPossessionCharges
//           ? membershipAmount || null
//           : null,
//         legal_compliance_charges_amount: isPossessionCharges
//           ? legalComplianceAmount || null
//           : null,
//         development_charges_amount: isPossessionCharges
//           ? developmentChargesAmount || null
//           : null,
//         electrical_water_piped_gas_charges_amount: isPossessionCharges
//           ? electricalChargesAmount || null
//           : null,
//         provisional_maintenance_amount: isPossessionCharges
//           ? provisionalMaintenanceAmount || null
//           : null,
//         possessional_gst_amount: isPossessionCharges
//           ? possessionGstAmount
//             ? Math.round(possessionGstAmount * 100) / 100
//             : null
//           : null,

//         additional_charges_total: additionalChargesTotal || null,
//         offers_total: null,
//         net_payable_amount: roundedFinalAmount,

//         terms_and_conditions: termsAndConditions,
//         notes: "",

//         additional_charges: [],
//         applied_offers: [],
//       };

//       const res = await api.post("/costsheet/cost-sheets/all/", payload);

//       toast.success("Cost Sheet created successfully.");
//       const created = res?.data;
//       const newId = created?.id;
//       if (newId) {
//         navigate(`/costsheet/${newId}`);
//       }
//     } catch (err) {
//       console.error(err);

//       const backendErrors = [];

//       if (err.response && err.response.data) {
//         const data = err.response.data;

//         if (typeof data === "string") {
//           backendErrors.push(data);
//         } else if (typeof data === "object") {
//           if (Array.isArray(data.__all__)) {
//             backendErrors.push(...data.__all__);
//           }
//           if (Array.isArray(data.non_field_errors)) {
//             backendErrors.push(...data.non_field_errors);
//           }

//           Object.keys(data).forEach((key) => {
//             if (key === "__all__" || key === "non_field_errors") return;

//             const value = data[key];
//             if (Array.isArray(value)) {
//               value.forEach((msg) => {
//                 backendErrors.push(`${key}: ${msg}`);
//               });
//             } else if (typeof value === "string") {
//               backendErrors.push(`${key}: ${value}`);
//             }
//           });
//         }
//       }

//       if (backendErrors.length) {
//         setApiErrors(backendErrors);
//         toast.error(backendErrors[0]);
//       } else {
//         toast.error("Failed to create cost sheet.");
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

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

//         {/* ✅ FIXED: BASE PRICING with dropdown for all area types */}
//         <SectionCard title="Base Pricing">
//           <div className="cs-grid-3">
//             <div className="cs-field">
//               <label className="cs-label">Area Basis</label>
//               <select
//                 className="cs-select"
//                 value={areaBasis}
//                 onChange={handleAreaBasisChange}
//               >
//                 <option value="RERA">RERA Area</option>
//                 <option value="CARPET">Carpet Area</option>
//                 <option value="SALEABLE">Saleable Area</option>
//                 <option value="BUILTUP">Built-up Area</option>
//                 <option value="RERA+BALCONY">RERA + Balcony</option>
//                 <option value="CARPET+BALCONY">Carpet + Balcony</option>
//               </select>
//             </div>

//             {/* Show individual areas if unit is selected */}
//             {selectedInventory && (
//               <>
//                 {selectedInventory.rera_area_sqft && (
//                   <div className="cs-field">
//                     <label className="cs-label">RERA Area (sq. ft.)</label>
//                     <input
//                       type="text"
//                       className="cs-input"
//                       value={selectedInventory.rera_area_sqft}
//                       readOnly
//                     />
//                   </div>
//                 )}

//                 {selectedInventory.carpet_sqft && (
//                   <div className="cs-field">
//                     <label className="cs-label">Carpet Area (sq. ft.)</label>
//                     <input
//                       type="text"
//                       className="cs-input"
//                       value={selectedInventory.carpet_sqft}
//                       readOnly
//                     />
//                   </div>
//                 )}


//                 {selectedInventory.balcony_area_sqft && (
//                   <div className="cs-field">
//                     <label className="cs-label">Balcony Area (sq. ft.)</label>
//                     <input
//                       type="text"
//                       className="cs-input"
//                       value={selectedInventory.balcony_area_sqft}
//                       readOnly
//                     />
//                   </div>
//                 )}
//               </>
//             )}

//             <div className="cs-field">
//               <label className="cs-label">Total Area (sq. ft.)</label>
//               <input
//                 type="number"
//                 className="cs-input"
//                 value={baseAreaSqft}
//                 onChange={(e) => setBaseAreaSqft(e.target.value)}
//               />
//             </div>

//             <div className="cs-field">
//               <label className="cs-label">
//                 Base Rate/sq. ft.
//               </label>

//               <input
//                 type="text"
//                 className="cs-input"
//                 value={
//                   baseRatePsf === "" ? "" : formatINRNoDecimals(baseRatePsf)
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

//         {/* TAX & CHARGES CONFIGURATION */}
//         {template && (
//           <SectionCard title="Tax & Charges Configuration">
//             <div className="cs-grid-3">
//               <div className="cs-field">
//                 <label className="cs-label">GST Percent (%)</label>
//                 <select
//                   className="cs-select"
//                   value={template.gst_percent || 0}
//                   onChange={(e) => {
//                     const currentValue = Number(template.gst_percent || 0);
//                     const newValue = Number(e.target.value);
//                     setTemplate((prev) => ({
//                       ...prev,
//                       gst_percent: newValue,
//                     }));
//                   }}
//                 >
//                   {(() => {
//                     const currentValue = Number(template.gst_percent || 0);
//                     const min = Math.max(0, currentValue - 3);
//                     const max = currentValue + 4;
//                     const options = [];
//                     for (let i = min; i <= max; i++) {
//                       options.push(
//                         <option key={i} value={i}>
//                           {i}%
//                         </option>
//                       );
//                     }
//                     return options;
//                   })()}
//                 </select>
//               </div>

//               <div className="cs-field">
//                 <label className="cs-label">Stamp Duty Percent (%)</label>
//                 <select
//                   className="cs-select"
//                   value={template.stamp_duty_percent || 0}
//                   onChange={(e) => {
//                     const newValue = Number(e.target.value);
//                     setTemplate((prev) => ({
//                       ...prev,
//                       stamp_duty_percent: newValue,
//                     }));
//                   }}
//                 >
//                   {(() => {
//                     const currentValue = Number(template.stamp_duty_percent || 0);
//                     const min = Math.max(0, currentValue - 3);
//                     const max = currentValue + 4;
//                     const options = [];
//                     for (let i = min; i <= max; i++) {
//                       options.push(
//                         <option key={i} value={i}>
//                           {i}%
//                         </option>
//                       );
//                     }
//                     return options;
//                   })()}
//                 </select>
//               </div>

//               <div className="cs-field">
//                 <label className="cs-label">Provisional Maintenance Months</label>
//                 <select
//                   className="cs-select"
//                   value={template.provisional_maintenance_months || 0}
//                   onChange={(e) => {
//                     const newValue = Number(e.target.value);
//                     setTemplate((prev) => ({
//                       ...prev,
//                       provisional_maintenance_months: newValue,
//                     }));
//                   }}
//                 >
//                   {(() => {
//                     const currentValue = Number(template.provisional_maintenance_months || 0);
//                     const min = Math.max(0, currentValue - 3);
//                     const max = currentValue + 4;
//                     const options = [];
//                     for (let i = min; i <= max; i++) {
//                       options.push(
//                         <option key={i} value={i}>
//                           {i} {i === 1 ? "month" : "months"}
//                         </option>
//                       );
//                     }
//                     return options;
//                   })()}
//                 </select>
//               </div>
//             </div>
//           </SectionCard>
//         )}

//         {/* PARKING SECTION */}
//         <SectionCard title="Parking">
//           <div className="cs-grid-3">
//             <div className="cs-field">
//               <label className="cs-label">Parking</label>
//               <select
//                 className="cs-select"
//                 value={parkingRequired}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   setParkingRequired(val);

//                   if (val === "NO") {
//                     setParkingCount("");
//                     setParkingPrice("");
//                   }
//                 }}
//               >
//                 <option value="NO">No</option>
//                 <option value="YES">Yes</option>
//               </select>
//             </div>

//             {/* No of Parking */}
//             {parkingRequired === "YES" && (
//               <div className="cs-field">
//                 <label className="cs-label">No. of Parking</label>
//                 <select
//                   className="cs-select"
//                   value={parkingCount}
//                   onChange={(e) => {
//                     setParkingCount(e.target.value);
//                   }}
//                 >
//                   <option value="">Select</option>
//                   {Array.from({ length: 10 }).map((_, i) => (
//                     <option key={i + 1} value={i + 1}>
//                       {i + 1}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {/* Parking Amount (Per Parking) */}
//             {parkingRequired === "YES" && parkingCount && (
//               <div className="cs-field">
//                 <label className="cs-label">Parking Amount (Per Parking)</label>
//                 <input
//                   type="text"
//                   className="cs-input"
//                   value={
//                     parkingPriceFocused
//                       ? parkingPrice
//                       : parkingPrice === ""
//                       ? ""
//                       : formatINRNoDecimals(parkingPrice)
//                   }
//                   onFocus={() => setParkingPriceFocused(true)}
//                   onBlur={() => setParkingPriceFocused(false)}
//                   onChange={(e) => {
//                     const input = e.target.value;
//                     const raw = stripAmount(input);
//                     if (raw === "") {
//                       setParkingPrice("");
//                       return;
//                     }
//                     const num = Number(raw);
//                     if (!Number.isNaN(num)) {
//                       setParkingPrice(String(Math.round(num)));
//                     }
//                   }}
//                   placeholder="Enter parking price"
//                 />
//                 {project?.price_per_parking && (
//                   <p className="cs-hint">
//                     Default: ₹{formatINRNoDecimals(project.price_per_parking)}
//                   </p>
//                 )}
//               </div>
//             )}

//             {/* Total Parking Amount */}
//             {parkingRequired === "YES" && parkingCount && parkingAmount > 0 && (
//               <div className="cs-field">
//                 <label className="cs-label">Total Parking Amount (₹)</label>
//                 <input
//                   type="text"
//                   className="cs-input cs-input--currency"
//                   value={formatINR(parkingAmount)}
//                   readOnly
//                 />
//               </div>
//             )}
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
//         </SectionCard>

//         {/* COST BREAKDOWN */}
//         <SectionCard title="Cost Breakdown">
//           {!template ? (
//             <div className="cs-subcard">
//               <p style={{ color: "#6b7280" }}>
//                 Cost breakdown will be available after selecting a unit and lead.
//               </p>
//             </div>
//           ) : (
//             <>
//               {/* ================== UNIT COST CALCULATION ================== */}
//               <div className="cost-breakdown-section cost-breakdown-unit">
//                 <div className="cost-breakdown-header">
//                   Unit Cost Calculation
//                 </div>

//                 <div className="cost-breakdown-row">
//                   <span>Unit Cost</span>
//                   <span>{formatINR(agreementValue || 0)}</span>
//                 </div>

//                 {additionalChargesTotal > 0 && (
//                   <div className="cost-breakdown-row">
//                     <span>Additional Charges</span>
//                     <span>{formatINR(additionalChargesTotal)}</span>
//                   </div>
//                 )}

//                 {/* Parking - Shown in Unit Cost section */}
//                 {parkingRequired === "YES" && parkingAmount > 0 && (
//                   <div className="cost-breakdown-row">
//                     <span>
//                       Parking ({parkingCount} × ₹
//                       {formatINR(parseFloat(parkingPrice) || 0)})
//                     </span>
//                     <span>{formatINR(parkingAmount)}</span>
//                   </div>
//                 )}

//                 {stampDutyEnabled && stampAmount > 0 && (
//                   <div className="cost-breakdown-row">
//                     <span>
//                       Stamp Duty ({template.stamp_duty_percent || 0}%)
//                     </span>
//                     <span>{formatINR(stampAmount)}</span>
//                   </div>
//                 )}

//                 {gstEnabled && gstAmount > 0 && (
//                   <div className="cost-breakdown-row">
//                     <span>GST ({template.gst_percent || 0}%)</span>
//                     <span>{formatINR(gstAmount)}</span>
//                   </div>
//                 )}

//                 <div className="cost-breakdown-row cost-breakdown-total">
//                   <span>Total Cost (1)</span>
//                   <span>
//                     {formatINR(
//                       Number(agreementValue || 0) +
//                         Number(additionalChargesTotal || 0) +
//                         (parkingRequired === "YES" ? Number(parkingAmount || 0) : 0) +
//                         Number(stampAmount || 0) +
//                         Number(gstAmount || 0)
//                     )}
//                   </span>
//                 </div>
//               </div>

//               {/* ================== POSSESSION RELATED CHARGES ================== */}
//               {isPossessionCharges && possessionTotal > 0 && (
//                 <div className="cost-breakdown-section cost-breakdown-possession">
//                   <div className="cost-breakdown-header">
//                     Possession Related Charges
//                   </div>

//                   {membershipAmount > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>
//                         Share Application Money & Membership Fees
//                       </span>
//                       <span>{formatINR(membershipAmount)}</span>
//                     </div>
//                   )}

//                   {legalFeeEnabled &&
//                     template.legal_fee_amount > 0 && (
//                       <div className="cost-breakdown-row">
//                         <span>Legal & Compliance Charges</span>
//                         <span>
//                           {formatINR(template.legal_fee_amount)}
//                         </span>
//                       </div>
//                     )}

//                   {developmentChargesAmount > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>
//                         Development Charges @ Rs.{" "}
//                         {formatINR(template?.development_charges_psf || 0)} PSF ×{" "}
//                         {formatINR(
//                           (selectedInventory && selectedInventory.carpet_sqft) || baseAreaSqft || 0
//                         )}{" "}
//                         sq. ft.
//                       </span>
//                       <span>
//                         {formatINR(developmentChargesAmount)}
//                       </span>
//                     </div>
//                   )}

//                   {electricalChargesAmount > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>
//                         Electrical, Water & Piped Gas Connection Charges
//                       </span>
//                       <span>
//                         {formatINR(electricalChargesAmount)}
//                       </span>
//                     </div>
//                   )}

//                   {Number(provisionalMaintenanceAmount || 0) > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>
//                         Provisional Maintenance for{" "}
//                         {template?.provisional_maintenance_months || 0} months @ Rs.{" "}
//                         {formatINR(template?.provisional_maintenance_psf || 0)}
//                       </span>
//                       <span>
//                         {formatINR(provisionalMaintenanceAmount || 0)}
//                       </span>
//                     </div>
//                   )}

//                   {possessionGstAmount > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>GST on Possession Charges (18%)</span>
//                       <span>
//                         {formatINR(possessionGstAmount)}
//                       </span>
//                     </div>
//                   )}

//                   <div className="cost-breakdown-row cost-breakdown-subtotal">
//                     <span>Total Possession Related Charges (2)</span>
//                     <span>
//                       {formatINR(possessionTotal)}
//                     </span>
//                   </div>
//                 </div>
//               )}

//               {/* ================== REGISTRATION ================== */}
//               {registrationEnabled &&
//                 template.registration_amount > 0 && (
//                   <div className="cost-breakdown-section">
//                     <div className="cost-breakdown-row">
//                       <span>Registration Amount</span>
//                       <span>
//                         {formatINR(template.registration_amount)}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//               {/* ================== SUMMARY ================== */}
//               <div className="cost-breakdown-section cost-breakdown-summary">
//                 <div className="cost-breakdown-row">
//                   <span>Total Cost</span>
//                   <span>{formatINR(finalAmount)}</span>
//                 </div>

//                 {isPossessionCharges &&
//                   possessionTotal > 0 && (
//                     <div className="cost-breakdown-row">
//                       <span>Total Possession Related Charges</span>
//                       <span>
//                         {formatINR(possessionTotal)}
//                       </span>
//                     </div>
//                   )}
//               </div>

//               {/* ================== GRAND TOTAL ================== */}
//               <div className="cost-breakdown-grand-total">
//                 <span>GRAND TOTAL</span>
//                 <span>
//                   {formatINR(
//                     Number(finalAmount || 0) +
//                       (isPossessionCharges ? possessionTotal : 0) +
//                       (registrationEnabled
//                         ? Number(template.registration_amount || 0)
//                         : 0)
//                   )}
//                 </span>
//               </div>

//               {/* Terms & Conditions */}
//               {termsList.length > 0 && (
//                 <div
//                   style={{
//                     marginTop: "24px",
//                     padding: "16px",
//                     background: "#f9fafb",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: "8px",
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontSize: "14px",
//                       fontWeight: "600",
//                       color: "#374151",
//                       marginBottom: "12px",
//                     }}
//                   >
//                     Terms & Conditions
//                   </div>
//                   <ol
//                     style={{
//                       margin: 0,
//                       paddingLeft: "20px",
//                       fontSize: "13px",
//                       color: "#4b5563",
//                       lineHeight: "1.6",
//                     }}
//                   >
//                     {termsList.map((t, idx) => (
//                       <li key={idx} style={{ marginBottom: "8px" }}>
//                         {t}
//                       </li>
//                     ))}
//                   </ol>
//                 </div>
//               )}
//             </>
//           )}
//         </SectionCard>

//         {/* PAYMENT PLAN */}
//         {planRequired && (
//           <SectionCard title="Payment Plan">
//             <div className="cs-radio-group" style={{ marginBottom: 16 }}>
//               <label className="cs-radio">
//                 <input
//                   type="radio"
//                   value="MASTER"
//                   checked={paymentPlanType === "MASTER"}
//                   onChange={() => setPaymentPlanType("MASTER")}
//                 />
//                 <span>Use Project Payment Plan</span>
//               </label>
//               <label className="cs-radio">
//                 <input
//                   type="radio"
//                   value="CUSTOM"
//                   checked={paymentPlanType === "CUSTOM"}
//                   onChange={() => setPaymentPlanType("CUSTOM")}
//                 />
//                 <span>Make Your Own Plan</span>
//               </label>
//             </div>

//             {paymentPlanType === "MASTER" && (
//               <div
//                 className="cs-field cs-field--full"
//                 style={{ marginBottom: 16 }}
//               >
//                 <label className="cs-label">Select Payment Plan</label>
//                 <select
//                   className="cs-select"
//                   value={selectedPlanId}
//                   onChange={handlePlanSelect}
//                 >
//                   <option value="">-- Select Plan --</option>
//                   {paymentPlans.map((plan) => (
//                     <option key={plan.id} value={plan.id}>
//                       {plan.name} ({plan.code}) – {plan.total_percentage}%
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             <div className="cs-table">
//               <div className="cs-table-row cs-table-row--5 cs-table-header">
//                 <div>Installment Name</div>
//                 <div>Percentage</div>
//                 <div>Amount</div>
//                 <div>Due Date</div>
//                 <div></div>
//               </div>

//               {planRows.map((row, index) => {
//                 const pct = parseFloat(row.percentage) || 0;
//                 const amount = finalAmount ? (finalAmount * pct) / 100 : 0;

//                 return (
//                   <div className="cs-table-row cs-table-row--5" key={index}>
//                     <div>
//                       <input
//                         type="text"
//                         className="cs-input"
//                         value={row.name}
//                         onChange={(e) =>
//                           handlePlanRowChange(index, "name", e.target.value)
//                         }
//                       />
//                     </div>
//                     <div>
//                       <input
//                         type="number"
//                         className="cs-input"
//                         value={row.percentage}
//                         onChange={(e) =>
//                           handlePlanRowChange(
//                             index,
//                             "percentage",
//                             e.target.value
//                           )
//                         }
//                       />
//                     </div>
//                     <div>
//                       <input
//                         type="text"
//                         className="cs-input cs-input--currency"
//                         value={amount ? formatINR(amount) : ""}
//                         readOnly
//                       />
//                     </div>
//                     <div>
//                       <input
//                         type="date"
//                         className="cs-input"
//                         value={row.due_date}
//                         min={apiToday || undefined}
//                         onFocus={() => handleDueDateFocus(index)}
//                         onChange={(e) =>
//                           handlePlanRowChange(index, "due_date", e.target.value)
//                         }
//                       />
//                     </div>
//                     <div className="cs-table-cell-actions">
//                       <button
//                         type="button"
//                         className="cs-icon-button"
//                         onClick={() => removeInstallment(index)}
//                         aria-label="Remove installment"
//                       >
//                         ×
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {totalPercentage !== 100 && (
//               <div className="cs-total-percentage">
//                 Total Percentage: {totalPercentage.toFixed(3)}% (should be 100%)
//               </div>
//             )}

//             <button
//               type="button"
//               className="cs-button cs-button-outline"
//               onClick={addInstallment}
//             >
//               + Add Installment
//             </button>
//           </SectionCard>
//         )}

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

// export default CostSheetCreate;


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
  const [parkingRequired, setParkingRequired] = useState("NO"); // YES / NO
  const [parkingCount, setParkingCount] = useState("");
  const [parkingPrice, setParkingPrice] = useState("");
  const [parkingPriceFocused, setParkingPriceFocused] = useState(false);

  // Possession charges
  const [isPossessionCharges, setIsPossessionCharges] = useState(false);
  const [possessionGstPercent, setPossessionGstPercent] = useState(0);

  // Tax checkboxes (to enable/disable taxes)
  const [gstEnabled, setGstEnabled] = useState(true);
  const [stampDutyEnabled, setStampDutyEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [legalFeeEnabled, setLegalFeeEnabled] = useState(true);

  // Editable possession charges fields
  const [developmentChargesPsf, setDevelopmentChargesPsf] = useState("500"); // Default 500
  const [provisionalMaintenanceMonths, setProvisionalMaintenanceMonths] = useState(6);

  const additionalChargesTotal = useMemo(
    () => charges.reduce((sum, c) => sum + (parseFloat(c.amount || 0) || 0), 0),
    [charges]
  );

  const baseAreaNum = parseFloat(baseAreaSqft || 0) || 0;
  const effectiveBaseRate =
    baseAreaNum && netBaseValue ? netBaseValue / baseAreaNum : 0;

  // Helper function to strip formatting from amount
  const stripAmount = (value) => {
    return value.replace(/,/g, "").replace(/₹/g, "").trim();
  };

  // Calculate parking total when parking price or count changes
  useEffect(() => {
    if (parkingRequired !== "YES" || !parkingCount || !parkingPrice) {
      return;
    }

    const amt = Number(stripAmount(parkingPrice)) || 0;
    const count = Number(parkingCount) || 0;
    // parkingAmount is calculated in the useMemo, so no need to set it here
  }, [parkingPrice, parkingCount, parkingRequired]);

  // Recalculate percentage-based charges when netBaseValue changes (after discount)
  useEffect(() => {
    setCharges((prevCharges) => {
      return prevCharges.map((charge) => {
        if (charge.type === "Percentage" && charge.value) {
          const chargeValue = parseFloat(charge.value || 0) || 0;
          if (chargeValue > 0 && netBaseValue > 0) {
            const calculatedAmount = (netBaseValue * chargeValue) / 100;
            return {
              ...charge,
              amount: String(Math.round(calculatedAmount)),
            };
          }
        }
        return charge;
      });
    });
  }, [netBaseValue]);

  // ========== COST CALCULATIONS ==========
  // Agreement Value = baseValue (before discount)
  const agreementValue = baseValue; // Unit cost before discount

  const { parkingAmount, stampAmount, gstAmount, mainCostTotal } =
    useMemo(() => {
      if (!template) {
        return {
          parkingAmount: 0,
          stampAmount: 0,
          gstAmount: 0,
          mainCostTotal: 0,
        };
      }

      const pricePerParking = parseFloat(parkingPrice) || 0;
      const parkingCountNum = Number(parkingCount || 0) || 0;
      const parkingAmt = pricePerParking * parkingCountNum;

      // Base for GST and Stamp Duty: net base value (after discount) + additional charges + parking total
      const unitCostAfterDiscount = Number(netBaseValue || 0); // Use netBaseValue (after discount)
      const additionalTotal = Number(additionalChargesTotal || 0);
      const parkingTotalNumber = parkingRequired === "YES" ? parkingAmt : 0;
      const baseForTaxes = unitCostAfterDiscount + additionalTotal + parkingTotalNumber;

      const gstPercent = Number(template.gst_percent) || 0;
      const stampPercent = Number(template.stamp_duty_percent) || 0;

      const calcGst = gstEnabled ? (baseForTaxes * gstPercent) / 100 : 0;
      const calcStamp = stampDutyEnabled ? (baseForTaxes * stampPercent) / 100 : 0;

      // ✅ Round to 2 decimal places
      const stampAmt = Math.round(calcStamp * 100) / 100;
      const gstAmt = Math.round(calcGst * 100) / 100;

      // Total Cost (1) = net base value (after discount) + additional charges + parking + stamp duty + gst
      const mainTotal =
        unitCostAfterDiscount + additionalTotal + parkingTotalNumber + stampAmt + gstAmt;

      return {
        parkingAmount: parkingAmt,
        stampAmount: stampAmt,
        gstAmount: gstAmt,
        mainCostTotal: mainTotal,
      };
    }, [
      netBaseValue, // Changed from agreementValue to netBaseValue
      additionalChargesTotal,
      parkingPrice,
      parkingCount,
      parkingRequired,
      template,
      gstEnabled,
      stampDutyEnabled,
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

    // const carpetAreaSqft =
    //   parseFloat(
    //     (selectedInv && selectedInv.carpet_sqft) || baseAreaSqft || 0
    //   ) || 0;
    // ✅ TOTAL AREA (used for Development & Maintenance)
    const totalAreaSqft = parseFloat(baseAreaSqft || 0) || 0;


    const membershipAmt =
      template && template.share_application_money_membership_fees
        ? Number(template.share_application_money_membership_fees)
        : 0;

    const legalAmt =
      template && template.legal_fee_amount
        ? (legalFeeEnabled ? Number(template.legal_fee_amount) : 0)
        : 0;

    // Development Charges @ PSF × total area (use editable value, minimum 1, default 500)
    const devRate = Math.max(1, Number(developmentChargesPsf || (template?.development_charges_psf || 500)));
    const devAmt = devRate * totalAreaSqft;


    const elecAmt =
      template && template.electrical_watern_n_all_charges
        ? Number(template.electrical_watern_n_all_charges)
        : 0;

    const provRate =
      template && template.provisional_maintenance_psf
        ? Number(template.provisional_maintenance_psf)
        : 0;
    // Provisional Maintenance @ PSF × total area × months (use editable value)
    const provMonths = Number(provisionalMaintenanceMonths || (template?.provisional_maintenance_months || 6));
    // const provAmt = provRate * carpetAreaSqft * provMonths;
    const provAmt = provRate * totalAreaSqft * provMonths;


    // Base for GST: Legal + Development + Electrical + Provisional Maintenance (Share Fee NOT included in GST base)
    const baseForGst = legalAmt + devAmt + elecAmt + provAmt;
    
    // GST on possession (18%) - applied on baseForGst (hardcoded as per BookingForm)
    const gstAmt = Math.round(((baseForGst * 18) / 100) * 100) / 100;
    
    // Total with GST (includes shareFee which is not in GST base)
    const total = membershipAmt + baseForGst + gstAmt;

    return {
      membershipAmount: membershipAmt,
      legalComplianceAmount: legalAmt,
      developmentChargesAmount: devAmt,
      electricalChargesAmount: elecAmt,
      provisionalMaintenanceAmount: provAmt,
      possessionSubtotal: baseForGst,
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
    legalFeeEnabled,
    developmentChargesPsf,
    provisionalMaintenanceMonths,
  ]);

  const registrationAmount = useMemo(() => {
    if (!template) return 0;
    const regAmount = Number(template.registration_amount) || 0;
    return registrationEnabled ? regAmount : 0;
  }, [template, registrationEnabled]);

  // ✅ Match BookingForm: finalAmount = mainCostTotal (Total Cost 1)
  const finalAmount = useMemo(() => {
    return mainCostTotal;
  }, [mainCostTotal]);

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
      // Allow decimal values for percentage (e.g., 10.5%)
      // Remove any non-numeric characters except decimal point
      const cleaned = input.replace(/[^0-9.]/g, "");
      // Prevent multiple decimal points
      const parts = cleaned.split(".");
      if (parts.length > 2) return; // Invalid format
      setDiscountValue(cleaned);
      return;
    }

    // For Fixed amount, remove formatting
    const raw = input.replace(/,/g, "").replace(/₹/g, "").trim();

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
        // Make template editable (similar to costTemplate in BookingForm)
        if (data.template) {
          setTemplate({
            ...data.template,
            gst_percent: data.template.gst_percent || 0,
            stamp_duty_percent: data.template.stamp_duty_percent || 0,
            provisional_maintenance_months: data.template.provisional_maintenance_months || 0,
          });

          // Initialize editable fields from template
          if (data.template.development_charges_psf) {
            setDevelopmentChargesPsf(String(data.template.development_charges_psf));
          } else {
            setDevelopmentChargesPsf("500"); // Default 500 if not provided
          }
          if (data.template.provisional_maintenance_months) {
            setProvisionalMaintenanceMonths(Number(data.template.provisional_maintenance_months) || 6);
          } else {
            setProvisionalMaintenanceMonths(6); // default
          }
        } else {
          setTemplate(data.template);
        }
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
    const raw = input.replace(/,/g, "").replace(/₹/g, "").trim();

    if (raw === "") {
      const updated = [...charges];
      updated[index].amount = "";
      setCharges(updated);
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) return;

    // Allow manual override of amount
    const updated = [...charges];
    updated[index].amount = raw;
    setCharges(updated);
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
    
    // Auto-calculate amount when type or value changes
    if (field === "type" || field === "value") {
      const charge = updated[index];
      const chargeValue = parseFloat(charge.value || 0) || 0;
      
      if (charge.type === "Fixed") {
        // For Fixed type, amount equals the value
        updated[index].amount = chargeValue > 0 ? String(chargeValue) : "";
      } else if (charge.type === "Percentage") {
        // For Percentage type, calculate based on netBaseValue (after discount)
        const calculatedAmount = netBaseValue > 0 && chargeValue > 0 
          ? (netBaseValue * chargeValue) / 100 
          : 0;
        updated[index].amount = calculatedAmount > 0 ? String(Math.round(calculatedAmount)) : "";
      }
    }
    
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
        prepared_by: preparedBy || null,

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

        parking_count: parkingRequired === "YES" ? Number(parkingCount) || 0 : 0,
        per_parking_price: parkingRequired === "YES" ? parkingPrice || null : null,
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

                {/* {selectedInventory.carpet_sqft && (
                  <div className="cs-field">
                    <label className="cs-label">Carpet Area (sq. ft.)</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={selectedInventory.carpet_sqft}
                      readOnly
                    />
                  </div>
                )} */}


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


              {/* <input
                type="number"
                className="cs-input"
                value={baseAreaSqft}
                onChange={(e) => setBaseAreaSqft(e.target.value)}
              /> */}

              <input
                  type="text"
                  className="cs-input"
                  value={calculatedArea ? calculatedArea.toFixed(2) : ""}
                  readOnly
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

        {/* TAX & CHARGES CONFIGURATION */}
        {template && (
          <SectionCard title="Tax & Charges">
            <div className="cs-grid-3">
              <div className="cs-field">
                <label className="cs-label">GST Percent (%)</label>
                <select
                  className="cs-select"
                  value={template.gst_percent || 0}
                  onChange={(e) => {
                    const currentValue = Number(template.gst_percent || 0);
                    const newValue = Number(e.target.value);
                    setTemplate((prev) => ({
                      ...prev,
                      gst_percent: newValue,
                    }));
                  }}
                >
                  {(() => {
                    const currentValue = Number(template.gst_percent || 0);
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

              <div className="cs-field">
                <label className="cs-label">Stamp Duty Percent (%)</label>
                <select
                  className="cs-select"
                  value={template.stamp_duty_percent || 0}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setTemplate((prev) => ({
                      ...prev,
                      stamp_duty_percent: newValue,
                    }));
                  }}
                >
                  {(() => {
                    const currentValue = Number(template.stamp_duty_percent || 0);
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

              <div className="cs-field">
                <label className="cs-label">Development Charges PSF (₹)</label>
                <input
                  type="number"
                  className="cs-input"
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

              <div className="cs-field">
                <label className="cs-label">Provisional Maintenance Months</label>
                <select
                  className="cs-select"
                  value={provisionalMaintenanceMonths || 6}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setProvisionalMaintenanceMonths(newValue);
                    // Also update template for consistency
                    setTemplate((prev) => ({
                      ...prev,
                      provisional_maintenance_months: newValue,
                    }));
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month} {month === 1 ? "month" : "months"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>
        )}

        {/* PARKING SECTION */}
        <SectionCard title="Parking">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Parking</label>
              <select
                className="cs-select"
                value={parkingRequired}
                onChange={(e) => {
                  const val = e.target.value;
                  setParkingRequired(val);

                  if (val === "NO") {
                    setParkingCount("");
                    setParkingPrice("");
                  }
                }}
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>

            {/* No of Parking */}
            {parkingRequired === "YES" && (
              <div className="cs-field">
                <label className="cs-label">No. of Parking</label>
                <select
                  className="cs-select"
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
              <div className="cs-field">
                <label className="cs-label">Parking Amount (Per Parking)</label>
                <input
                  type="text"
                  className="cs-input"
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
                    const raw = stripAmount(input);
                    if (raw === "") {
                      setParkingPrice("");
                      return;
                    }
                    const num = Number(raw);
                    if (!Number.isNaN(num)) {
                      setParkingPrice(String(Math.round(num)));
                    }
                  }}
                  placeholder="Enter parking price"
                />
                {project?.price_per_parking && (
                  <p className="cs-hint">
                    Default: ₹{formatINRNoDecimals(project.price_per_parking)}
                  </p>
                )}
              </div>
            )}

            {/* Total Parking Amount */}
            {parkingRequired === "YES" && parkingCount && parkingAmount > 0 && (
              <div className="cs-field">
                <label className="cs-label">Total Parking Amount (₹)</label>
                <input
                  type="text"
                  className="cs-input cs-input--currency"
                  value={formatINR(parkingAmount)}
                  readOnly
                />
              </div>
            )}
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
          {!template ? (
            <div className="cs-subcard">
              <p style={{ color: "#6b7280" }}>
                Cost breakdown will be available after selecting a unit and lead.
              </p>
            </div>
          ) : (
            <>
              {/* ================== UNIT COST CALCULATION ================== */}
              <div className="cost-breakdown-section cost-breakdown-unit">
                <div className="cost-breakdown-header">
                  Unit Cost Calculation
                </div>

                <div className="cost-breakdown-row">
                  <span>Agreement Value (Base Value)</span>
                  <span>{formatINR(agreementValue || 0)}</span>
                </div>

                {/* Show Discount if applied */}
                {discountAmount > 0 && (
                  <div className="cost-breakdown-row" style={{ color: "#dc2626" }}>
                    <span>Discount Amount (-)</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}

                <div className="cost-breakdown-row">
                  <span>Net Base Value (After Discount)</span>
                  <span>{formatINR(netBaseValue || 0)}</span>
                </div>

                {additionalChargesTotal > 0 && (
                  <div className="cost-breakdown-row">
                    <span>Additional Charges (+)</span>
                    <span>{formatINR(additionalChargesTotal)}</span>
                  </div>
                )}

                {/* Parking - Shown in Unit Cost section */}
                {parkingRequired === "YES" && parkingAmount > 0 && (
                  <div className="cost-breakdown-row">
                    <span>
                      Parking ({parkingCount} × ₹
                      {formatINR(parseFloat(parkingPrice) || 0)})
                    </span>
                    <span>{formatINR(parkingAmount)}</span>
                  </div>
                )}

                {stampDutyEnabled && stampAmount > 0 && (
                  <div className="cost-breakdown-row">
                    <span>
                      Stamp Duty ({template.stamp_duty_percent || 0}%)
                    </span>
                    <span>{formatINR(stampAmount)}</span>
                  </div>
                )}

                {gstEnabled && gstAmount > 0 && (
                  <div className="cost-breakdown-row">
                    <span>GST ({template.gst_percent || 0}%)</span>
                    <span>{formatINR(gstAmount)}</span>
                  </div>
                )}

                <div className="cost-breakdown-row cost-breakdown-total">
                  <span>Total Cost (1)</span>
                  <span>
                    {formatINR(mainCostTotal)}
                  </span>
                </div>
              </div>

              {/* ================== POSSESSION RELATED CHARGES ================== */}
              {isPossessionCharges && possessionTotal > 0 && (
                <div className="cost-breakdown-section cost-breakdown-possession">
                  <div className="cost-breakdown-header">
                    Possession Related Charges
                  </div>

                  {membershipAmount > 0 && (
                    <div className="cost-breakdown-row">
                      <span>
                        Share Application Money & Membership Fees
                      </span>
                      <span>{formatINR(membershipAmount)}</span>
                    </div>
                  )}

                  {legalFeeEnabled &&
                    template.legal_fee_amount > 0 && (
                      <div className="cost-breakdown-row">
                        <span>Legal & Compliance Charges</span>
                        <span>
                          {formatINR(template.legal_fee_amount)}
                        </span>
                      </div>
                    )}

                  {developmentChargesAmount > 0 && (
                    <div className="cost-breakdown-row">
                      <span>
                        Development Charges @ Rs.{" "}
                        <input
                          type="number"
                          value={developmentChargesPsf || template?.development_charges_psf || 500}
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
                        {/* PSF ×{" "}
                        {formatINR(
                          (selectedInventory && selectedInventory.carpet_sqft) || baseAreaSqft || 0
                        )}{" "}
                        sq. ft. */}

                        PSF × {formatINR(baseAreaSqft || 0)} sq. ft.

                      </span>
                      <span>
                        {formatINR(developmentChargesAmount)}
                      </span>
                    </div>
                  )}

                  {electricalChargesAmount > 0 && (
                    <div className="cost-breakdown-row">
                      <span>
                        Electrical, Water & Piped Gas Connection Charges
                      </span>
                      <span>
                        {formatINR(electricalChargesAmount)}
                      </span>
                    </div>
                  )}

                  {Number(provisionalMaintenanceAmount || 0) > 0 && (
                    <div className="cost-breakdown-row">
                      <span>
                        Provisional Maintenance for{" "}
                        <input
                          type="number"
                          value={provisionalMaintenanceMonths || template?.provisional_maintenance_months || 6}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 6;
                            setProvisionalMaintenanceMonths(val);
                            // Also update template for consistency
                            setTemplate((prev) => ({
                              ...prev,
                              provisional_maintenance_months: val,
                            }));
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
                        {formatINR(template?.provisional_maintenance_psf || 0)}
                      </span>
                      <span>
                        {formatINR(provisionalMaintenanceAmount || 0)}
                      </span>
                    </div>
                  )}

                  {possessionGstAmount > 0 && (
                    <div className="cost-breakdown-row">
                      <span>GST on Possession Charges (18%)</span>
                      <span>
                        {formatINR(possessionGstAmount)}
                      </span>
                    </div>
                  )}

                  <div className="cost-breakdown-row cost-breakdown-subtotal">
                    <span>Total Possession Related Charges (2)</span>
                    <span>
                      {formatINR(possessionTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* ================== REGISTRATION ================== */}
              {registrationEnabled &&
                template.registration_amount > 0 && (
                  <div className="cost-breakdown-section">
                    <div className="cost-breakdown-row">
                      <span>Registration Amount</span>
                      <span>
                        {formatINR(template.registration_amount)}
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

                {isPossessionCharges &&
                  possessionTotal > 0 && (
                    <div className="cost-breakdown-row">
                      <span>Total Possession Related Charges</span>
                      <span>
                        {formatINR(possessionTotal)}
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
                      (isPossessionCharges ? possessionTotal : 0) +
                      (registrationEnabled
                        ? Number(template.registration_amount || 0)
                        : 0)
                  )}
                </span>
              </div>

              {/* Terms & Conditions */}
              {/* {termsList.length > 0 && (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "16px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "12px",
                    }}
                  >
                    Terms & Conditions
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "13px",
                      color: "#4b5563",
                      lineHeight: "1.6",
                    }}
                  >
                    {termsList.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: "8px" }}>
                        {t}
                      </li>
                    ))}
                  </ol>
                </div>
              )} */}
            </>
          )}
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

