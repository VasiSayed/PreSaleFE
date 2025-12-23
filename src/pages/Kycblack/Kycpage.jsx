// // src/pages/KYC/KYCTeamRequests.jsx
// import React, { useEffect, useState } from "react";
// import api from "../../api/axiosInstance";
// import PaymentReceiptModal from "../../components/Payments/PaymentLeadCreateModalKYC";

// export default function KYCTeamRequests() {
//   const [kycList, setKycList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [selectedRecordForPayment, setSelectedRecordForPayment] =
//     useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   async function getData() {
//     try {
//       setLoading(true);
//       const res = await api.get("/book/kyc-requests/kyc-team/");
//       console.log("[KYC LIST] response:", res.data);
//       setKycList(res.data || []);
//     } catch (err) {
//       console.error("[KYC LIST] ERROR:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     getData();
//   }, []);

//   function handleAddPaymentClick(item, e) {
//     e.stopPropagation();
//     console.log("[OPEN MODAL] selected record:", item);
//     setSelectedRecordForPayment(item);
//     setShowPaymentModal(true);
//   }

//   function closePaymentModal() {
//     setShowPaymentModal(false);
//     setSelectedRecordForPayment(null);
//   }

//   function handlePaymentCreated(createdPayment) {
//     console.log("[KYC PAYMENT CREATED] from modal:", createdPayment);
//     getData();
//   }

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2 style={{ marginBottom: "8px" }}>KYC Requests</h2>

//       {loading && <p>Loading...</p>}

//       {!loading && (
//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "collapse",
//             border: "1px solid #ddd",
//           }}
//         >
//           <thead>
//             <tr style={{ backgroundColor: "#f5f5f5" }}>
//               <th style={th}>ID</th>
//               <th style={th}>Unit</th>
//               <th style={th}>Project</th>
//               <th style={th}>Amount</th>
//               <th style={th}>Paid</th>
//               <th style={th}>Status</th>
//               <th style={th}>Action</th>
//             </tr>
//           </thead>

//           <tbody>
//             {kycList.map((item) => (
//               <tr key={item.id} style={{ cursor: "default" }}>
//                 <td style={td}>{item.id}</td>
//                 <td style={td}>{item.unit_no}</td>
//                 <td style={td}>{item.project_name}</td>
//                 <td style={td}>{item.amount}</td>
//                 <td style={td}>{item.paid_amount}</td>
//                 <td style={td}>{item.status}</td>

//                 <td style={td}>
//                   <button
//                     onClick={(e) => handleAddPaymentClick(item, e)}
//                     style={btn}
//                   >
//                     Add Payment
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* Payment Modal */}
//       {showPaymentModal && selectedRecordForPayment && (
//         <PaymentReceiptModal
//           isOpen={showPaymentModal}
//           onClose={closePaymentModal}
//           isKycPayment={true}
//           bookingId={selectedRecordForPayment.booking_id}
//           kycRequestId={selectedRecordForPayment.id}
//           onCreated={handlePaymentCreated}
//         />
//       )}
//     </div>
//   );
// }

// const th = {
//   padding: "8px",
//   border: "1px solid #ddd",
// };

// const td = {
//   padding: "8px",
//   border: "1px solid #ddd",
// };

// const btn = {
//   padding: "4px 12px",
//   borderRadius: "4px",
//   backgroundColor: "#19376d",
//   color: "#fff",
//   border: "none",
//   cursor: "pointer",
//   fontSize: "12px",
// };

// src/pages/Kycblack/Kycpage.jsx



// import React, { useEffect, useState } from "react";
// import api from "../../api/axiosInstance";
// import PaymentKycModal from "../../components/Payments/PaymentLeadCreateModalKYC";
// import "./Kycpage.css";

// function toNumber(val) {
//   const n = parseFloat(val);
//   return Number.isNaN(n) ? 0 : n;
// }

// function fmtINR(val) {
//   const n = toNumber(val);
//   return n.toLocaleString("en-IN", {
//     maximumFractionDigits: 2,
//     minimumFractionDigits: 0,
//   });
// }

// export default function KYCTeamRequests() {
//   const [kycList, setKycList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   async function getData() {
//     try {
//       setLoading(true);
//       const res = await api.get("/book/kyc-requests/kyc-team/");
//       setKycList(res.data || []);
//     } catch (err) {
//       console.error("KYC list fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     getData();
//   }, []);

//   function handleAddPaymentClick(item, e) {
//     e.stopPropagation();
//     setSelectedRecord(item);
//     setShowPaymentModal(true);
//   }

//   function closePaymentModal() {
//     setShowPaymentModal(false);
//     setSelectedRecord(null);
//   }

//   function handlePaymentCreated(createdPayment) {
//     console.log("✅ KYC payment created:", createdPayment);
//     getData();
//   }

//   return (
//     <div className="kyc-page">
//       <div className="kyc-page-inner">
//         <div className="kyc-header-row">
//           <h2 className="kyc-title">KYC Requests</h2>
//           <span className="kyc-subtitle">
//             Manage KYC payments against booking requests
//           </span>
//         </div>

//         <div className="kyc-card">
//           {loading ? (
//             <div className="kyc-loading">Loading KYC requests...</div>
//           ) : kycList.length === 0 ? (
//             <div className="kyc-empty">No KYC requests found.</div>
//           ) : (
//             <div className="kyc-table-wrapper">
//               <table className="kyc-table">
//                 <thead>
//                   <tr>
//                     <th className="kyc-head-cell">ID</th>
//                     <th className="kyc-head-cell">Unit</th>
//                     <th className="kyc-head-cell">Project</th>
//                     <th className="kyc-head-cell kyc-right">Total Amount</th>
//                     <th className="kyc-head-cell kyc-right">Paid</th>
//                     <th className="kyc-head-cell kyc-right">Pending</th>
//                     <th className="kyc-head-cell">Status</th>
//                     <th className="kyc-head-cell kyc-center">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {kycList.map((item) => {
//                     const total = toNumber(item.amount);
//                     const paid = toNumber(item.paid_amount);
//                     const pending = Math.max(total - paid, 0);
//                     const isFullyPaid =
//                       pending <= 0 || Boolean(item.is_fully_paid);

//                     return (
//                       <tr key={item.id} className="kyc-row">
//                         <td className="kyc-cell">{item.id}</td>
//                         <td className="kyc-cell">
//                           {item.unit_no || "-"}
//                         </td>
//                         <td className="kyc-cell">{item.project_name}</td>

//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(item.amount)}
//                         </td>
//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(item.paid_amount)}
//                         </td>
//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(pending)}
//                         </td>

//                         <td className="kyc-cell">
//                           <span
//                             className={`kyc-status-badge kyc-status-${(
//                               item.status || ""
//                             ).toLowerCase()}`}
//                           >
//                             {item.status}
//                           </span>
//                         </td>

//                         <td className="kyc-cell kyc-center">
//                           <button
//                             className="kyc-btn"
//                             disabled={isFullyPaid}
//                             onClick={(e) => handleAddPaymentClick(item, e)}
//                             title={
//                               isFullyPaid
//                                 ? "Fully paid – no more payments allowed"
//                                 : "Add payment for this KYC request"
//                             }
//                           >
//                             {isFullyPaid ? "Fully Paid" : "Add Payment"}
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Payment Modal */}
//       {showPaymentModal && selectedRecord && (() => {
//         const total = toNumber(selectedRecord.amount);
//         const paid = toNumber(selectedRecord.paid_amount);
//         const pending = Math.max(total - paid, 0);

//         return (
//           <PaymentKycModal
//             isOpen={showPaymentModal}
//             onClose={closePaymentModal}
//             isKycPayment={true}
//             bookingId={selectedRecord.booking_id}
//             kycRequestId={selectedRecord.id}
//             maxAmount={pending}           // 🔴 pending amount limit
//             onCreated={handlePaymentCreated}
//           />
//         );
//       })()}
//     </div>
//   );
// }


// import React, { useEffect, useState } from "react";
// import api from "../../api/axiosInstance";
// import PaymentKycModal from "../../components/Payments/PaymentLeadCreateModalKYC";
// import "./Kycpage.css";

// function toNumber(val) {
//   const n = parseFloat(val);
//   return Number.isNaN(n) ? 0 : n;
// }

// function fmtINR(val) {
//   const n = toNumber(val);
//   return n.toLocaleString("en-IN", {
//     maximumFractionDigits: 2,
//     minimumFractionDigits: 0,
//   });
// }

// export default function KYCTeamRequests() {
//   const [kycList, setKycList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   async function getData() {
//     try {
//       setLoading(true);
//       const res = await api.get("/book/kyc-requests/kyc-team/");
//       setKycList(res.data || []);
//     } catch (err) {
//       console.error("KYC list fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     getData();
//   }, []);

//   function handleAddPaymentClick(item, e) {
//     e.stopPropagation();
//     setSelectedRecord(item);
//     setShowPaymentModal(true);
//   }

//   function closePaymentModal() {
//     setShowPaymentModal(false);
//     setSelectedRecord(null);
//   }

//   function handlePaymentCreated(createdPayment) {
//     console.log("✅ KYC payment created:", createdPayment);
//     getData(); // refresh list
//   }

//   return (
//     <div className="kyc-page">
//       <div className="kyc-page-inner">
//         <div className="kyc-header-row">
//           <h2 className="kyc-title">KYC Requests</h2>
//           <span className="kyc-subtitle">
//             Manage KYC payments against booking requests
//           </span>
//         </div>

//         <div className="kyc-card">
//           {loading ? (
//             <div className="kyc-loading">Loading KYC requests...</div>
//           ) : kycList.length === 0 ? (
//             <div className="kyc-empty">No KYC requests found.</div>
//           ) : (
//             <div className="kyc-table-wrapper">
//               <table className="kyc-table">
//                 <thead>
//                   <tr>
//                     <th className="kyc-head-cell">ID</th>
//                     <th className="kyc-head-cell">Unit</th>
//                     <th className="kyc-head-cell">Project</th>
//                     <th className="kyc-head-cell kyc-right">Total Amount</th>
//                     <th className="kyc-head-cell kyc-right">Paid</th>
//                     <th className="kyc-head-cell kyc-right">Pending</th>
//                     <th className="kyc-head-cell">Status</th>
//                     <th className="kyc-head-cell kyc-center">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {kycList.map((item) => {
//                     const total = toNumber(item.amount);
//                     const paid = toNumber(item.paid_amount);
//                     const pending = Math.max(total - paid, 0);

//                     const isFullyPaid = paid >= total;

//                     // ✅ AUTO STATUS LOGIC
//                     const effectiveStatus = isFullyPaid
//                       ? "APPROVED"
//                       : item.status || "PENDING";

//                     return (
//                       <tr key={item.id} className="kyc-row">
//                         <td className="kyc-cell">{item.id}</td>

//                         <td className="kyc-cell">
//                           {item.unit_no || "-"}
//                         </td>

//                         <td className="kyc-cell">
//                           {item.project_name || "-"}
//                         </td>

//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(total)}
//                         </td>

//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(paid)}
//                         </td>

//                         <td className="kyc-cell kyc-right kyc-amount">
//                           ₹ {fmtINR(pending)}
//                         </td>

//                         <td className="kyc-cell">
//                           <span
//                             className={`kyc-status-badge kyc-status-${effectiveStatus.toLowerCase()}`}
//                           >
//                             {effectiveStatus}
//                           </span>
//                         </td>

//                         <td className="kyc-cell kyc-center">
//                           <button
//                             className="kyc-btn"
//                             disabled={isFullyPaid}
//                             onClick={(e) => handleAddPaymentClick(item, e)}
//                             title={
//                               isFullyPaid
//                                 ? "Fully paid – no more payments allowed"
//                                 : "Add payment for this KYC request"
//                             }
//                           >
//                             {isFullyPaid ? "Fully Paid" : "Add Payment"}
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Payment Modal */}
//       {showPaymentModal && selectedRecord && (() => {
//         const total = toNumber(selectedRecord.amount);
//         const paid = toNumber(selectedRecord.paid_amount);
//         const pending = Math.max(total - paid, 0);

//         return (
//           <PaymentKycModal
//             isOpen={showPaymentModal}
//             onClose={closePaymentModal}
//             isKycPayment={true}
//             bookingId={selectedRecord.booking_id}
//             kycRequestId={selectedRecord.id}
//             maxAmount={pending}
//             onCreated={handlePaymentCreated}
//           />
//         );
//       })()}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import PaymentKycModal from "../../components/Payments/PaymentLeadCreateModalKYC";
import "./Kycpage.css";

function toNumber(val) {
  const n = parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
}

function fmtINR(val) {
  const n = toNumber(val);
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export default function KYCTeamRequests() {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  async function getData() {
    try {
      setLoading(true);
      const res = await api.get("/book/kyc-requests/kyc-team/");
      setKycList(res.data || []);
    } catch (err) {
      console.error("KYC list fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  function handleAddPaymentClick(item, e) {
    e.stopPropagation();
    setSelectedRecord(item);
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedRecord(null);
  }

  function handlePaymentCreated() {
    getData();
  }

  async function handleApproveKyc(item) {
    try {
      setApprovingId(item.id);
      await api.post(`/book/kyc-requests/${item.id}/approve/`);
      await getData();
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          "Failed to approve KYC"
      );
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="kyc-page">
      <div className="kyc-page-inner">
        <div className="kyc-header-row">
          <h2 className="kyc-title">KYC Requests</h2>
          <span className="kyc-subtitle">
            Manage KYC payments against booking requests
          </span>
        </div>

        <div className="kyc-card">
          {loading ? (
            <div className="kyc-loading">Loading KYC requests...</div>
          ) : kycList.length === 0 ? (
            <div className="kyc-empty">No KYC requests found.</div>
          ) : (
            <div className="kyc-table-wrapper">
              <table className="kyc-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Unit</th>
                    <th>Project</th>
                    <th className="kyc-right">Total</th>
                    <th className="kyc-right">Paid</th>
                    <th className="kyc-right">Pending</th>
                    <th>Status</th>
                    <th className="kyc-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {kycList.map((item) => {
                    const total = toNumber(item.amount);
                    const paid = toNumber(item.paid_amount);
                    const pending = Math.max(total - paid, 0);

                    const isFullyPaid = paid >= total;
                    const status = item.status || "PENDING";

                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.unit_no || "-"}</td>
                        <td>{item.project_name || "-"}</td>

                        <td className="kyc-right">₹ {fmtINR(total)}</td>
                        <td className="kyc-right">₹ {fmtINR(paid)}</td>
                        <td className="kyc-right">₹ {fmtINR(pending)}</td>

                        <td>
                          <span
                            className={`kyc-status-badge kyc-status-${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="kyc-center">
                          {/* ADD PAYMENT */}
                          {status === "PENDING" && !isFullyPaid && (
                            <button
                              className="kyc-btn"
                              onClick={(e) =>
                                handleAddPaymentClick(item, e)
                              }
                            >
                              Add Payment
                            </button>
                          )}

                          {/* APPROVE KYC */}
                          {status === "PENDING" && isFullyPaid && (
                            <button
                              className="kyc-btn approve"
                              disabled={approvingId === item.id}
                              onClick={() => handleApproveKyc(item)}
                            >
                              {approvingId === item.id
                                ? "Approving..."
                                : "Approve KYC"}
                            </button>
                          )}

                          {/* APPROVED */}
                          {status === "APPROVED" && (
                            <span className="kyc-approved-text">
                              Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRecord && (
        <PaymentKycModal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          isKycPayment
          bookingId={selectedRecord.booking_id}
          kycRequestId={selectedRecord.id}
          maxAmount={Math.max(
            toNumber(selectedRecord.amount) -
              toNumber(selectedRecord.paid_amount),
            0
          )}
          onCreated={handlePaymentCreated}
        />
      )}
    </div>
  );
}
