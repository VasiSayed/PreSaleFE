// // src/pages/CostSheet/QuotationPreview.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { useParams } from "react-router-dom";
// import axiosInstance from "../../api/axiosInstance";
// import "./QuotationPreview.css";

// function fmt(val) {
//   if (val === null || val === undefined || val === "") return "-";
//   const num = Number(val);
//   if (Number.isNaN(num)) return String(val);
//   return num.toLocaleString("en-IN", {
//     maximumFractionDigits: 2,
//     minimumFractionDigits: 0,
//   });
// }

// const QuotationPreview = () => {
//   const { id } = useParams();
//   const [qdata, setQdata] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // ============ LOAD QUOTATION ============
//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const res = await axiosInstance.get(
//           `/costsheet/cost-sheets/${id}/deep/`
//         );
//         setQdata(res.data);
//       } catch (e) {
//         console.error("Failed to load quotation", e);
//         setError("Failed to load quotation details.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) load();
//   }, [id]);

//   // ============ PAYMENT ROWS ============
//   const paymentRows = useMemo(() => {
//     if (!qdata) return [];

//     const netPayable =
//       qdata.net_payable_amount != null ? Number(qdata.net_payable_amount) : 0;

//     // ✅ Always prefer custom_payment_plan
//     if (
//       Array.isArray(qdata.custom_payment_plan) &&
//       qdata.custom_payment_plan.length > 0
//     ) {
//       return qdata.custom_payment_plan.map((row, idx) => {
//         const pct = Number(row.percentage || 0) || 0;
//         const amount =
//           row.amount != null && row.amount !== ""
//             ? Number(row.amount)
//             : netPayable
//             ? (netPayable * pct) / 100
//             : 0;

//         return {
//           key: idx,
//           name: row.name,
//           percentage: pct,
//           amount,
//           due: row.due_date || "-",
//         };
//       });
//     }

//     return [];
//   }, [qdata]);

//   if (loading) {
//     return (
//       <div className="qp-page">
//         <div className="qp-inner qp-inner-loading">Loading…</div>
//       </div>
//     );
//   }

//   if (error || !qdata) {
//     return (
//       <div className="qp-page">
//         <div className="qp-inner qp-inner-loading">
//           {error || "Quotation not found."}
//         </div>
//       </div>
//     );
//   }

//   // ============ DESTRUCTURE DATA ============
//   const {
//     quotation_no,
//     date,
//     valid_till,
//     prepared_by_name,
//     prepared_by_username,

//     customer_name,
//     customer_contact_person,
//     customer_phone,
//     customer_email,

//     project_name,
//     tower_name,
//     floor_number,
//     unit_no,

//     base_area_sqft,
//     base_rate_psf,
//     base_value,
//     discount_amount,
//     net_base_value,

//     additional_charges_total,
//     additional_charges_detail,

//     gst_percent,
//     gst_amount,
//     stamp_duty_percent,
//     stamp_duty_amount,
//     registration_amount,
//     legal_fee_amount,

//     parking_count,
//     per_parking_price,
//     parking_amount,

//     share_application_money_membership_amount,
//     legal_compliance_charges_amount,
//     development_charges_amount,
//     electrical_water_piped_gas_charges_amount,
//     provisional_maintenance_amount,
//     possessional_gst_amount,

//     net_payable_amount,

//     payment_plan_detail,

//     template: tpl,
//   } = qdata;

//   const charges = Array.isArray(additional_charges_detail)
//     ? additional_charges_detail
//     : [];

//   const preparedDisplay = prepared_by_name || prepared_by_username || "-";

//   const template = tpl || {};

//   // ============ CALCULATIONS ============

//   // Net base value
//   const nbv = Number(net_base_value || 0) || 0;
//   const addTotal = Number(additional_charges_total || 0) || 0;

//   // Parking
//   const parkingAmt = Number(parking_amount || 0) || 0;
//   const parkingCountNum = Number(parking_count || 0) || 0;
//   const perParkingPrice = Number(per_parking_price || 0) || 0;

//   // Base for taxes = nbv + additional + parking
//   const baseForTaxes = nbv + addTotal + parkingAmt;

//   // Stamp & GST
//   const stampAmt = Number(stamp_duty_amount || 0) || 0;
//   const gstAmt = Number(gst_amount || 0) || 0;

//   // Main Cost Total (1)
//   const mainCostTotal = baseForTaxes + stampAmt + gstAmt;

//   // Possession charges
//   const isPossessionCharges =
//     share_application_money_membership_amount != null ||
//     legal_compliance_charges_amount != null ||
//     development_charges_amount != null ||
//     electrical_water_piped_gas_charges_amount != null ||
//     provisional_maintenance_amount != null ||
//     possessional_gst_amount != null;

//   const membershipAmt =
//     Number(share_application_money_membership_amount || 0) || 0;
//   const legalComplianceAmt = Number(legal_compliance_charges_amount || 0) || 0;
//   const devChargesAmt = Number(development_charges_amount || 0) || 0;
//   const electricalAmt =
//     Number(electrical_water_piped_gas_charges_amount || 0) || 0;
//   const provisionalMaintenanceAmt =
//     Number(provisional_maintenance_amount || 0) || 0;
//   const possessionGstAmt = Number(possessional_gst_amount || 0) || 0;

//   const possessionSubtotal =
//     membershipAmt +
//     legalComplianceAmt +
//     devChargesAmt +
//     electricalAmt +
//     provisionalMaintenanceAmt;

//   const possessionTotal = possessionSubtotal + possessionGstAmt;

//   // Registration
//   const registrationAmt = Number(registration_amount || 0) || 0;

//   // Final total
//   const finalAmount = mainCostTotal + possessionTotal + registrationAmt;

//   // Get template values for display
//   const devPsf = template.development_charges_psf
//     ? Number(template.development_charges_psf)
//     : 0;
//   const provisionalPsf = template.provisional_maintenance_psf
//     ? Number(template.provisional_maintenance_psf)
//     : 0;
//   const provisionalMonths = template.provisional_maintenance_months || 0;

//   // ============ DOWNLOAD / PRINT HANDLER ============
//   const handleDownloadPDF = () => {
//     window.print();
//   };

//   // Check if payment plan exists
//   const hasPaymentPlan = paymentRows.length > 0;

//   return (
//     <div className="qp-page">
//       <div className="qp-inner">
//         {/* ============= HEADER (hide in print) ============= */}
//         <section className="qp-section qp-section-header qp-print-hide">
//           <div className="qp-header-top">
//             <h1 className="qp-title">Quotation Details</h1>

//             <button
//               type="button"
//               className="qp-download-btn"
//               onClick={handleDownloadPDF}
//             >
//               Download PDF
//             </button>
//           </div>

//           <div className="qp-header-row">
//             <div className="qp-header-left">
//               <div className="qp-meta-line">
//                 <span className="qp-meta-label">Quote ID:&nbsp;</span>
//                 <span className="qp-meta-value">
//                   {quotation_no || `#${qdata.id}`}
//                 </span>
//               </div>
//               <div className="qp-meta-line">
//                 <span className="qp-meta-label">Date:&nbsp;</span>
//                 <span className="qp-meta-value">{date || "-"}</span>
//               </div>
//               <div className="qp-meta-line">
//                 <span className="qp-meta-label">Valid Until:&nbsp;</span>
//                 <span className="qp-meta-value">{valid_till || "-"}</span>
//               </div>
//             </div>

//             <div className="qp-header-right">
//               <span className="qp-meta-label">Prepared By:&nbsp;</span>
//               <span className="qp-meta-value">
//                 {preparedDisplay !== "-"
//                   ? `Sales Executive: ${preparedDisplay}`
//                   : "-"}
//               </span>
//             </div>
//           </div>
//         </section>

//         {/* ============= CUSTOMER & UNIT (hide in print) ============= */}
//         <section className="qp-section qp-print-hide">
//           <h2 className="qp-section-title">Customer &amp; Unit</h2>

//           <div className="qp-panel qp-panel-soft">
//             <div className="qp-cust-name">
//               {customer_name || customer_contact_person || "-"}
//             </div>
//             <div className="qp-cust-address">
//               {customer_phone || customer_email
//                 ? `${customer_phone || ""}${
//                     customer_phone && customer_email ? " • " : ""
//                   }${customer_email || ""}`
//                 : "Contact details not available"}
//             </div>

//             <div className="qp-cust-grid">
//               <div className="qp-cust-col">
//                 <div className="qp-label-value">
//                   <span className="qp-label">Project:&nbsp;</span>
//                   <span className="qp-value">{project_name || "-"}</span>
//                 </div>
//                 <div className="qp-label-value">
//                   <span className="qp-label">Unit No:&nbsp;</span>
//                   <span className="qp-value">{unit_no || "-"}</span>
//                 </div>
//                 <div className="qp-label-value">
//                   <span className="qp-label">Base Area:&nbsp;</span>
//                   <span className="qp-value">
//                     {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
//                   </span>
//                 </div>
//               </div>

//               <div className="qp-cust-col qp-cust-col-right">
//                 <div className="qp-label-value">
//                   <span className="qp-label">Tower:&nbsp;</span>
//                   <span className="qp-value">{tower_name || "-"}</span>
//                 </div>
//                 <div className="qp-label-value">
//                   <span className="qp-label">Floor:&nbsp;</span>
//                   <span className="qp-value">{floor_number || "-"}</span>
//                 </div>
//                 <div className="qp-label-value">
//                   <span className="qp-label">Carpet Area:&nbsp;</span>
//                   <span className="qp-value">
//                     {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ============= COST BREAKDOWN (NEW FORMAT) ============= */}
//         <section className="qp-section">
//           <h2 className="qp-section-title">Cost Breakdown</h2>

//           {/* Section 1: Main Cost */}
//           <div className="qp-cost-section">
//             <h3 className="qp-cost-section-title">Unit Cost Calculation</h3>

//             <div className="qp-cost-breakdown">
//               <div className="qp-cost-line">
//                 <span>Unit Cost after Discount</span>
//                 <span className="qp-cost-amount">{fmt(nbv)}</span>
//               </div>

//               <div className="qp-cost-line">
//                 <span>Additional Charges</span>
//                 <span className="qp-cost-amount">{fmt(addTotal)}</span>
//               </div>

//               {parkingCountNum > 0 && (
//                 <div className="qp-cost-line">
//                   <span>
//                     Car Parking Amount ({parkingCountNum} × ₹
//                     {fmt(perParkingPrice)})
//                   </span>
//                   <span className="qp-cost-amount">{fmt(parkingAmt)}</span>
//                 </div>
//               )}

//               <div className="qp-cost-line">
//                 <span>Stamp Duty ({stamp_duty_percent || 0}%)</span>
//                 <span className="qp-cost-amount">{fmt(stampAmt)}</span>
//               </div>

//               <div className="qp-cost-line">
//                 <span>GST ({gst_percent || 0}%)</span>
//                 <span className="qp-cost-amount">{fmt(gstAmt)}</span>
//               </div>

//               <div className="qp-cost-line qp-cost-subtotal">
//                 <span>Total Cost (1)</span>
//                 <span className="qp-cost-amount">{fmt(mainCostTotal)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Section 2: Possession Charges (if enabled) */}
//           {isPossessionCharges && (
//             <div className="qp-cost-section qp-possession-section">
//               <h3 className="qp-cost-section-title">
//                 Possession Related Charges
//               </h3>

//               <div className="qp-cost-breakdown">
//                 {membershipAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>Share Application Money & Membership Fees</span>
//                     <span className="qp-cost-amount">{fmt(membershipAmt)}</span>
//                   </div>
//                 )}

//                 {legalComplianceAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>Legal & Compliance Charges</span>
//                     <span className="qp-cost-amount">
//                       {fmt(legalComplianceAmt)}
//                     </span>
//                   </div>
//                 )}

//                 {devChargesAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>Development Charges @ Rs. {fmt(devPsf)} PSF</span>
//                     <span className="qp-cost-amount">{fmt(devChargesAmt)}</span>
//                   </div>
//                 )}

//                 {electricalAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>
//                       Electrical, Water & Piped Gas Connection Charges
//                     </span>
//                     <span className="qp-cost-amount">{fmt(electricalAmt)}</span>
//                   </div>
//                 )}

//                 {provisionalMaintenanceAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>
//                       Provisional Maintenance for {provisionalMonths} months @
//                       Rs. {fmt(provisionalPsf)}
//                     </span>
//                     <span className="qp-cost-amount">
//                       {fmt(provisionalMaintenanceAmt)}
//                     </span>
//                   </div>
//                 )}

//                 {possessionGstAmt > 0 && (
//                   <div className="qp-cost-line">
//                     <span>
//                       GST on Possession Charges (
//                       {template.possessional_gst_percent || 18}%)
//                     </span>
//                     <span className="qp-cost-amount">
//                       {fmt(possessionGstAmt)}
//                     </span>
//                   </div>
//                 )}

//                 <div className="qp-cost-line qp-cost-subtotal">
//                   <span>Total Possession Related Charges (2)</span>
//                   <span className="qp-cost-amount">{fmt(possessionTotal)}</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Section 3: Registration */}
//           <div className="qp-cost-section">
//             <div className="qp-cost-breakdown">
//               <div className="qp-cost-line">
//                 <span>Registration Amount</span>
//                 <span className="qp-cost-amount">{fmt(registrationAmt)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Summary before Grand Total */}
//           <div className="qp-cost-summary">
//             <div className="qp-cost-summary-line">
//               <span>Total Cost</span>
//               <span className="qp-cost-amount">{fmt(mainCostTotal)}</span>
//             </div>
//             {isPossessionCharges && (
//               <div className="qp-cost-summary-line">
//                 <span>Total Possession Related Charges</span>
//                 <span className="qp-cost-amount">{fmt(possessionTotal)}</span>
//               </div>
//             )}
//           </div>

//           {/* Final Total */}
//           <div className="qp-cost-final">
//             <span>Grand Total</span>
//             <span className="qp-cost-amount">{fmt(finalAmount)}</span>
//           </div>
//         </section>

//         {/* ============= PAYMENT PLAN SCHEDULE (conditional) ============= */}
//         {hasPaymentPlan && (
//           <section className="qp-section">
//             <h2 className="qp-section-title">Payment Plan Schedule</h2>

//             {payment_plan_detail && (
//               <div className="qp-plan-meta">
//                 Payment Plan:&nbsp;
//                 <strong>
//                   {payment_plan_detail.name} ({payment_plan_detail.code})
//                 </strong>
//               </div>
//             )}

//             <div className="qp-panel">
//               <table className="qp-table">
//                 <thead>
//                   <tr>
//                     <th>Milestone</th>
//                     <th className="qp-align-right">Percentage</th>
//                     <th className="qp-align-right">Amount (INR)</th>
//                     <th className="qp-align-right">Due Date</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {paymentRows.map((row) => (
//                     <tr key={row.key}>
//                       <td>{row.name}</td>
//                       <td className="qp-align-right">
//                         {row.percentage != null ? `${row.percentage}%` : "-"}
//                       </td>
//                       <td className="qp-align-right">{fmt(row.amount)}</td>
//                       <td className="qp-align-right">{row.due}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuotationPreview;

// src/pages/CostSheet/QuotationPreview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./QuotationPreview.css";

function fmt(val) {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

const QuotationPreview = () => {
  const { id } = useParams();
  const [qdata, setQdata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============ LOAD QUOTATION ============
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axiosInstance.get(
          `/costsheet/cost-sheets/${id}/deep/`
        );
        setQdata(res.data);
      } catch (e) {
        console.error("Failed to load quotation", e);
        setError("Failed to load quotation details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  // ============ PAYMENT ROWS ============
  const paymentRows = useMemo(() => {
    if (!qdata) return [];

    const netPayable =
      qdata.net_payable_amount != null ? Number(qdata.net_payable_amount) : 0;

    if (
      Array.isArray(qdata.custom_payment_plan) &&
      qdata.custom_payment_plan.length > 0
    ) {
      return qdata.custom_payment_plan.map((row, idx) => {
        const pct = Number(row.percentage || 0) || 0;
        const amount =
          row.amount != null && row.amount !== ""
            ? Number(row.amount)
            : netPayable
            ? (netPayable * pct) / 100
            : 0;

        return {
          key: idx,
          name: row.name,
          percentage: pct,
          amount,
          due: row.due_date || "-",
        };
      });
    }

    return [];
  }, [qdata]);

  if (loading) {
    return (
      <div className="qp-page">
        <div className="qp-inner qp-inner-loading">Loading…</div>
      </div>
    );
  }

  if (error || !qdata) {
    return (
      <div className="qp-page">
        <div className="qp-inner qp-inner-loading">
          {error || "Quotation not found."}
        </div>
      </div>
    );
  }

  // ============ DESTRUCTURE DATA ============
  const {
    quotation_no,
    date,
    valid_till,
    prepared_by_name,
    prepared_by_username,

    customer_name,
    customer_contact_person,
    customer_phone,
    customer_email,

    project_name,
    tower_name,
    floor_number,
    unit_no,

    base_area_sqft,
    base_rate_psf,
    base_value,
    discount_amount,
    net_base_value,

    additional_charges_total,
    additional_charges_detail,

    gst_percent,
    gst_amount,
    stamp_duty_percent,
    stamp_duty_amount,
    registration_amount,
    legal_fee_amount,

    parking_count,
    per_parking_price,
    parking_amount,

    share_application_money_membership_amount,
    legal_compliance_charges_amount,
    development_charges_amount,
    electrical_water_piped_gas_charges_amount,
    provisional_maintenance_amount,
    possessional_gst_amount,

    net_payable_amount,

    payment_plan_detail,

    template: tpl,
  } = qdata;

  const charges = Array.isArray(additional_charges_detail)
    ? additional_charges_detail
    : [];

  const preparedDisplay = prepared_by_name || prepared_by_username || "-";

  const template = tpl || {};

  // ============ CALCULATIONS ============

  const nbv = Number(net_base_value || 0) || 0;
  const addTotal = Number(additional_charges_total || 0) || 0;

  const parkingAmt = Number(parking_amount || 0) || 0;
  const parkingCountNum = Number(parking_count || 0) || 0;
  const perParkingPrice = Number(per_parking_price || 0) || 0;

  const baseForTaxes = nbv + addTotal + parkingAmt;

  const stampAmt = Number(stamp_duty_amount || 0) || 0;
  const gstAmt = Number(gst_amount || 0) || 0;

  const mainCostTotal = baseForTaxes + stampAmt + gstAmt;

  const isPossessionCharges =
    share_application_money_membership_amount != null ||
    legal_compliance_charges_amount != null ||
    development_charges_amount != null ||
    electrical_water_piped_gas_charges_amount != null ||
    provisional_maintenance_amount != null ||
    possessional_gst_amount != null;

  const membershipAmt =
    Number(share_application_money_membership_amount || 0) || 0;
  const legalComplianceAmt = Number(legal_compliance_charges_amount || 0) || 0;
  const devChargesAmt = Number(development_charges_amount || 0) || 0;
  const electricalAmt =
    Number(electrical_water_piped_gas_charges_amount || 0) || 0;
  const provisionalMaintenanceAmt =
    Number(provisional_maintenance_amount || 0) || 0;
  const possessionGstAmt = Number(possessional_gst_amount || 0) || 0;

  const possessionSubtotal =
    membershipAmt +
    legalComplianceAmt +
    devChargesAmt +
    electricalAmt +
    provisionalMaintenanceAmt;

  const possessionTotal = possessionSubtotal + possessionGstAmt;

  const registrationAmt = Number(registration_amount || 0) || 0;

  const finalAmount = mainCostTotal + possessionTotal + registrationAmt;

  const devPsf = template.development_charges_psf
    ? Number(template.development_charges_psf)
    : 0;
  const provisionalPsf = template.provisional_maintenance_psf
    ? Number(template.provisional_maintenance_psf)
    : 0;
  const provisionalMonths = template.provisional_maintenance_months || 0;

  const carpetArea = base_area_sqft ? Number(base_area_sqft) : 0;
  const perSqftPrice = carpetArea && nbv ? (nbv / carpetArea).toFixed(2) : 0;

  // ============ DOWNLOAD / PRINT HANDLER ============
  const handleDownloadPDF = () => {
    window.print();
  };

  const hasPaymentPlan = paymentRows.length > 0;

  return (
    <div className="qp-page">
      <div className="qp-inner">
        {/* ============= HEADER (hide in print) ============= */}
        <section className="qp-section qp-section-header qp-print-hide">
          <div className="qp-header-top">
            <h1 className="qp-title">Quotation Details</h1>

            <button
              type="button"
              className="qp-download-btn"
              onClick={handleDownloadPDF}
            >
              Download PDF
            </button>
          </div>

          <div className="qp-header-row">
            <div className="qp-header-left">
              <div className="qp-meta-line">
                <span className="qp-meta-label">Quote ID:&nbsp;</span>
                <span className="qp-meta-value">
                  {quotation_no || `#${qdata.id}`}
                </span>
              </div>
              <div className="qp-meta-line">
                <span className="qp-meta-label">Date:&nbsp;</span>
                <span className="qp-meta-value">{date || "-"}</span>
              </div>
              <div className="qp-meta-line">
                <span className="qp-meta-label">Valid Until:&nbsp;</span>
                <span className="qp-meta-value">{valid_till || "-"}</span>
              </div>
            </div>

            <div className="qp-header-right">
              <span className="qp-meta-label">Prepared By:&nbsp;</span>
              <span className="qp-meta-value">
                {preparedDisplay !== "-"
                  ? `Sales Executive: ${preparedDisplay}`
                  : "-"}
              </span>
            </div>
          </div>
        </section>

        {/* ============= CUSTOMER & UNIT (hide in print) ============= */}
        <section className="qp-section qp-print-hide">
          <h2 className="qp-section-title">Customer &amp; Unit</h2>

          <div className="qp-panel qp-panel-soft">
            <div className="qp-cust-name">
              {customer_name || customer_contact_person || "-"}
            </div>
            <div className="qp-cust-address">
              {customer_phone || customer_email
                ? `${customer_phone || ""}${
                    customer_phone && customer_email ? " • " : ""
                  }${customer_email || ""}`
                : "Contact details not available"}
            </div>

            <div className="qp-cust-grid">
              <div className="qp-cust-col">
                <div className="qp-label-value">
                  <span className="qp-label">Project:&nbsp;</span>
                  <span className="qp-value">{project_name || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Unit No:&nbsp;</span>
                  <span className="qp-value">{unit_no || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Base Area:&nbsp;</span>
                  <span className="qp-value">
                    {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
                  </span>
                </div>
              </div>

              <div className="qp-cust-col qp-cust-col-right">
                <div className="qp-label-value">
                  <span className="qp-label">Tower:&nbsp;</span>
                  <span className="qp-value">{tower_name || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Floor:&nbsp;</span>
                  <span className="qp-value">{floor_number || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Carpet Area:&nbsp;</span>
                  <span className="qp-value">
                    {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============= UNIT NUMBER (show only in print) ============= */}
        <section className="qp-section qp-print-only qp-unit-print-header">
          <div className="qp-unit-number">Unit No: {unit_no || "-"}</div>
        </section>

        {/* ============= COST BREAKDOWN ============= */}
        <section className="qp-section">
          <h2 className="qp-section-title">Cost Breakdown</h2>

          {/* Section 1: Main Cost */}
          <div className="qp-cost-section">
            <h3 className="qp-cost-section-title">Unit Cost Calculation</h3>

            <div className="qp-cost-breakdown">
              <div className="qp-cost-line">
                <span>Unit Cost</span>
                <span className="qp-cost-amount">{fmt(nbv)}</span>
              </div>

              {addTotal > 0 && (
                <div className="qp-cost-line">
                  <span>Additional Charges</span>
                  <span className="qp-cost-amount">{fmt(addTotal)}</span>
                </div>
              )}

              {parkingCountNum > 0 && (
                <div className="qp-cost-line">
                  <span>
                    Car Parking Amount ({parkingCountNum} × ₹
                    {fmt(perParkingPrice)})
                  </span>
                  <span className="qp-cost-amount">{fmt(parkingAmt)}</span>
                </div>
              )}

              <div className="qp-cost-line">
                <span>Stamp Duty ({stamp_duty_percent || 0}%)</span>
                <span className="qp-cost-amount">{fmt(stampAmt)}</span>
              </div>

              <div className="qp-cost-line">
                <span>GST ({gst_percent || 0}%)</span>
                <span className="qp-cost-amount">{fmt(gstAmt)}</span>
              </div>

              <div className="qp-cost-line qp-cost-subtotal">
                <span>Total Cost (1)</span>
                <span className="qp-cost-amount">{fmt(mainCostTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Possession Charges (if enabled) */}
          {isPossessionCharges && (
            <div className="qp-cost-section qp-possession-section">
              <h3 className="qp-cost-section-title">
                Possession Related Charges
              </h3>

              <div className="qp-cost-breakdown">
                {membershipAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>Share Application Money & Membership Fees</span>
                    <span className="qp-cost-amount">{fmt(membershipAmt)}</span>
                  </div>
                )}

                {legalComplianceAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>Legal & Compliance Charges</span>
                    <span className="qp-cost-amount">
                      {fmt(legalComplianceAmt)}
                    </span>
                  </div>
                )}

                {devChargesAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>Development Charges @ Rs. {fmt(devPsf)} PSF</span>
                    <span className="qp-cost-amount">{fmt(devChargesAmt)}</span>
                  </div>
                )}

                {electricalAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>
                      Electrical, Water & Piped Gas Connection Charges
                    </span>
                    <span className="qp-cost-amount">{fmt(electricalAmt)}</span>
                  </div>
                )}

                {provisionalMaintenanceAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>
                      Provisional Maintenance for {provisionalMonths} months @
                      Rs. {fmt(provisionalPsf)}
                    </span>
                    <span className="qp-cost-amount">
                      {fmt(provisionalMaintenanceAmt)}
                    </span>
                  </div>
                )}

                {possessionGstAmt > 0 && (
                  <div className="qp-cost-line">
                    <span>
                      GST on Possession Charges (
                      {template.possessional_gst_percent || 18}%)
                    </span>
                    <span className="qp-cost-amount">
                      {fmt(possessionGstAmt)}
                    </span>
                  </div>
                )}

                <div className="qp-cost-line qp-cost-subtotal">
                  <span>Total Possession Related Charges (2)</span>
                  <span className="qp-cost-amount">{fmt(possessionTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Registration */}
          <div className="qp-cost-section">
            <div className="qp-cost-breakdown">
              <div className="qp-cost-line">
                <span>Registration Amount</span>
                <span className="qp-cost-amount">{fmt(registrationAmt)}</span>
              </div>
            </div>
          </div>

          {/* Summary before Grand Total */}
          <div className="qp-cost-summary">
            <div className="qp-cost-summary-line">
              <span>Total Cost</span>
              <span className="qp-cost-amount">{fmt(mainCostTotal)}</span>
            </div>
            {isPossessionCharges && (
              <div className="qp-cost-summary-line">
                <span>Total Possession Related Charges</span>
                <span className="qp-cost-amount">{fmt(possessionTotal)}</span>
              </div>
            )}
          </div>

          {/* Final Total */}
          <div className="qp-cost-final">
            <span>Grand Total</span>
            <span className="qp-cost-amount">{fmt(finalAmount)}</span>
          </div>
        </section>

        {/* ============= PAYMENT PLAN SCHEDULE (hide in print) ============= */}
        {hasPaymentPlan && (
          <section className="qp-section qp-print-hide">
            <h2 className="qp-section-title">Payment Plan Schedule</h2>

            {payment_plan_detail && (
              <div className="qp-plan-meta">
                Payment Plan:&nbsp;
                <strong>
                  {payment_plan_detail.name} ({payment_plan_detail.code})
                </strong>
              </div>
            )}

            <div className="qp-panel">
              <table className="qp-table">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th className="qp-align-right">Percentage</th>
                    <th className="qp-align-right">Amount (INR)</th>
                    <th className="qp-align-right">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.name}</td>
                      <td className="qp-align-right">
                        {row.percentage != null ? `${row.percentage}%` : "-"}
                      </td>
                      <td className="qp-align-right">{fmt(row.amount)}</td>
                      <td className="qp-align-right">{row.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default QuotationPreview;