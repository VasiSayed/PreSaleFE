// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import axiosInstance from "../../../api/axiosInstance";
// import "./DemandNotes.css";

// function absApiUrl(path, axiosInstance) {
//   if (!path) return "";
//   const s = String(path);
//   if (/^https?:\/\//i.test(s)) return s;

//   const base = axiosInstance?.defaults?.baseURL || "";
//   try {
//     const u = new URL(base);
//     return `${u.origin}${s}`;
//   } catch {
//     return s;
//   }
// }

// function inr(v) {
//   if (v === null || v === undefined || v === "") return "-";
//   const n = Number(v);
//   if (Number.isNaN(n)) return String(v);
//   return n.toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// function pick(obj, keys, fallback = null) {
//   for (const k of keys) {
//     if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
//   }
//   return fallback;
// }

// export default function DemandNoteDetail() {
//   const { dnId } = useParams();
//   const nav = useNavigate();

//   const canLoad = useMemo(() => !!dnId, [dnId]);

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   const [dn, setDn] = useState(null);
//   const [dnLog, setDnLog] = useState(null);

//   const [newStatus, setNewStatus] = useState("");

//   // installment form
//   const [instAmount, setInstAmount] = useState("");
//   const [instDate, setInstDate] = useState("");
//   const [instType, setInstType] = useState("");
//   const [instRef, setInstRef] = useState("");
//   const [instNote, setInstNote] = useState("");
//   const [instFiles, setInstFiles] = useState([]);

//   // interest form
//   const [intType, setIntType] = useState("Charge");
//   const [intAmount, setIntAmount] = useState("");
//   const [intNote, setIntNote] = useState("");
//   const [intReason, setIntReason] = useState("MANUAL_INTEREST");

//   const load = async () => {
//     if (!canLoad) return;
//     setLoading(true);
//     setErr("");

//     const controller = new AbortController();
//     try {
//       const detailRes = await axiosInstance.get(
//         `financial/demand-notes/${dnId}/`,
//         {
//           signal: controller.signal,
//         }
//       );
//       const detail = detailRes.data;
//       setDn(detail);
//       setNewStatus(detail?.status || "");

//       // optional log
//       try {
//         const logRes = await axiosInstance.get(
//           `financial/demand-notes/${dnId}/log/`,
//           {
//             signal: controller.signal,
//           }
//         );
//         setDnLog(logRes.data);
//       } catch {
//         setDnLog(null);
//       }
//     } catch (e) {
//       if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
//         setErr(e?.response?.data?.detail || e?.message || "Failed");
//       }
//     } finally {
//       setLoading(false);
//     }

//     return () => controller.abort();
//   };

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [dnId]);

//   const doIssue = async () => {
//     setErr("");
//     try {
//       await axiosInstance.post(`financial/demand-notes/${dnId}/issue/`);
//       await load();
//       alert("Issued ✅");
//     } catch (e) {
//       setErr(e?.response?.data?.detail || e?.message || "Issue failed");
//     }
//   };

//   const doSetStatus = async () => {
//     setErr("");
//     try {
//       await axiosInstance.patch(`financial/demand-notes/${dnId}/set-status/`, {
//         status: newStatus,
//       });
//       await load();
//       alert("Status updated ✅");
//     } catch (e) {
//       setErr(e?.response?.data?.detail || e?.message || "Status update failed");
//     }
//   };

//   const doAddInstallment = async () => {
//     setErr("");
//     if (!instAmount) {
//       setErr("receipt_amount is required");
//       return;
//     }
//     try {
//       const fd = new FormData();
//       fd.append("receipt_amount", instAmount);
//       if (instDate) fd.append("receipt_date", instDate);
//       if (instType) fd.append("payment_type", instType);
//       if (instRef) fd.append("payment_ref", instRef);
//       if (instNote) fd.append("note", instNote);
//       (instFiles || []).forEach((f) => fd.append("attachments", f));

//       await axiosInstance.post(
//         `financial/demand-notes/${dnId}/installments/`,
//         fd,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       setInstAmount("");
//       setInstDate("");
//       setInstType("");
//       setInstRef("");
//       setInstNote("");
//       setInstFiles([]);
//       await load();
//       alert("Installment added ✅");
//     } catch (e) {
//       setErr(
//         e?.response?.data?.detail || e?.message || "Add installment failed"
//       );
//     }
//   };

//   const doAddInterest = async () => {
//     setErr("");
//     if (!intAmount) {
//       setErr("Interest amount is required");
//       return;
//     }
//     try {
//       await axiosInstance.post("financial/interest-entries/", {
//         demand_note: Number(dnId),
//         entry_type: intType,
//         amount: String(intAmount),
//         note: intNote || "",
//         reason_code: intReason || "MANUAL_INTEREST",
//       });
//       setIntAmount("");
//       setIntNote("");
//       await load();
//       alert("Interest entry added ✅");
//     } catch (e) {
//       setErr(e?.response?.data?.detail || e?.message || "Add interest failed");
//     }
//   };

//   const detailTitle = pick(dn, ["demand_id"], `DN #${dnId}`);
//   const status = pick(dn, ["status"], "-");
//   const total = pick(dn, ["total", "net_payable"], null);
//   const paid = pick(dn, ["paid_total", "total_paid"], null);
//   const due = pick(dn, ["due_total", "total_due"], null);
//   const dueDate = pick(dn, ["due_date"], null);
//   const milestone = pick(dn, ["milestone"], null);

//   const installments =
//     pick(
//       dn,
//       ["installments", "demand_note_installments", "installment_list"],
//       []
//     ) || [];
//   const interests =
//     pick(dn, ["interest_entries", "interests"], []) ||
//     pick(dnLog, ["interest_entries"], []) ||
//     [];

//   const logTimeline = pick(dnLog, ["timeline"], []) || [];
//   const logSummary = pick(dnLog, ["summary"], null);

//   return (
//     <div className="demand-notes-page">
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           gap: 10,
//           alignItems: "center",
//           flexWrap: "wrap",
//         }}
//       >
//         <div>
//           <div
//             style={{
//               display: "flex",
//               gap: 10,
//               alignItems: "center",
//               flexWrap: "wrap",
//             }}
//           >
//             <button className="dn-btn dn-btn-light" onClick={() => nav(-1)}>
//               ← Back
//             </button>
//             <div
//               style={{ fontSize: 18, fontWeight: 800, color: "var(--dn-text)" }}
//             >
//               {detailTitle}
//             </div>
//           </div>
//           <div style={{ fontSize: 12, color: "var(--dn-muted)" }}>
//             Demand Note Detail • ID: {dnId}
//           </div>
//         </div>

//         <div
//           className="dn-header-actions"
//           style={{ display: "flex", alignItems: "center" }}
//         >
//           <button
//             className="dn-btn dn-btn-primary"
//             onClick={doIssue}
//             disabled={loading}
//           >
//             Issue DN
//           </button>
//         </div>
//       </div>

//       {err ? <div className="dn-error">{err}</div> : null}
//       {loading ? <div className="dn-loading">Loading...</div> : null}

//       <div className="dn-filters">
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
//             gap: 10,
//           }}
//         >
//           <div className="dn-field">
//             <label>status</label>
//             <input className="dn-input" value={status} readOnly />
//           </div>
//           <div className="dn-field">
//             <label>due date</label>
//             <input className="dn-input" value={dueDate || "-"} readOnly />
//           </div>
//           <div className="dn-field">
//             <label>milestone</label>
//             <input className="dn-input" value={milestone || "-"} readOnly />
//           </div>
//           <div className="dn-field">
//             <label>amounts</label>
//             <div className="dn-due-inline">
//               <span className="dn-money">
//                 <b>Total:</b> ₹ {inr(total)}
//               </span>
//               <span className="dn-money">
//                 <b>Paid:</b> ₹ {inr(paid)}
//               </span>
//               <span className="dn-money">
//                 <b>Due:</b> ₹ {inr(due)}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="dn-filters-grid" style={{ marginTop: 10 }}>
//           <div className="dn-field">
//             <label>set status</label>
//             <select
//               className="dn-select"
//               value={newStatus}
//               onChange={(e) => setNewStatus(e.target.value)}
//             >
//               <option value="">Select</option>
//               <option value="Draft">Draft</option>
//               <option value="Pending">Pending</option>
//               <option value="Overdue">Overdue</option>
//               <option value="Paid">Paid</option>
//             </select>
//           </div>
//         </div>

//         <div className="dn-filters-actions">
//           <button
//             className="dn-btn dn-btn-light"
//             onClick={load}
//             disabled={loading}
//           >
//             Refresh
//           </button>
//           <button
//             className="dn-btn dn-btn-primary"
//             onClick={doSetStatus}
//             disabled={loading || !newStatus}
//           >
//             Update Status
//           </button>
//         </div>
//       </div>

//       {logSummary ? (
//         <div className="dn-hint">
//           <div
//             style={{
//               display: "flex",
//               gap: 14,
//               flexWrap: "wrap",
//               alignItems: "center",
//             }}
//           >
//             <div>
//               <b>Charged:</b> ₹ {inr(logSummary.charged_interest)}
//             </div>
//             <div>
//               <b>Waived:</b> ₹ {inr(logSummary.waived_interest)}
//             </div>
//             <div>
//               <b>Net:</b> ₹ {inr(logSummary.net_interest)}
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {/* Installments */}
//       <div className="dn-filters">
//         <div
//           style={{
//             fontSize: 16,
//             fontWeight: 800,
//             color: "var(--dn-text)",
//             marginBottom: 8,
//           }}
//         >
//           Installments
//         </div>

//         <div className="dn-table-wrap">
//           <table
//             className="dn-subtable"
//             style={{ width: "100%", borderCollapse: "collapse" }}
//           >
//             <thead>
//               <tr
//                 style={{
//                   borderBottom: "1px solid var(--dn-border)",
//                   textAlign: "left",
//                 }}
//               >
//                 <th>Date</th>
//                 <th>Amount</th>
//                 <th>Type</th>
//                 <th>Ref</th>
//                 <th>Note</th>
//                 <th>Attachments</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(installments || []).map((it, idx) => {
//                 const atts = pick(it, ["attachments"], []) || [];
//                 return (
//                   <tr
//                     key={idx}
//                     className="dn-row"
//                     style={{ borderBottom: "1px solid var(--dn-border)" }}
//                   >
//                     <td>
//                       {pick(it, ["receipt_date", "date", "paid_at"], "-")}
//                     </td>
//                     <td className="dn-money">
//                       ₹ {inr(pick(it, ["receipt_amount", "amount"], "-"))}
//                     </td>
//                     <td>{pick(it, ["payment_type"], "-")}</td>
//                     <td className="dn-mono dn-wrap">
//                       {pick(it, ["payment_ref", "utr", "reference"], "-")}
//                     </td>
//                     <td className="dn-wrap">{pick(it, ["note"], "-")}</td>
//                     <td>
//                       <div className="dn-att-list">
//                         {(atts || []).map((a, j) => {
//                           const href = absApiUrl(
//                             a?.url || a?.file || a,
//                             axiosInstance
//                           );
//                           const label = a?.name || a?.filename || "file";
//                           return (
//                             <a
//                               key={j}
//                               className="dn-att-link"
//                               href={href}
//                               target="_blank"
//                               rel="noreferrer"
//                             >
//                               {label}
//                             </a>
//                           );
//                         })}
//                         {(atts || []).length === 0 ? (
//                           <span
//                             style={{ color: "var(--dn-muted)", fontSize: 12 }}
//                           >
//                             -
//                           </span>
//                         ) : null}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {(installments || []).length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     style={{ padding: 12, color: "var(--dn-muted)" }}
//                   >
//                     No installments yet.
//                   </td>
//                 </tr>
//               ) : null}
//             </tbody>
//           </table>
//         </div>

//         {/* Add installment */}
//         <div
//           style={{
//             marginTop: 12,
//             fontSize: 14,
//             fontWeight: 800,
//             color: "var(--dn-text)",
//           }}
//         >
//           Add Installment
//         </div>

//         <div className="dn-addinst-grid" style={{ marginTop: 10 }}>
//           <div className="dn-field">
//             <label>receipt amount</label>
//             <div className="dn-money-wrap">
//               <span className="dn-rupee">₹</span>
//               <input
//                 className="dn-input"
//                 value={instAmount}
//                 onChange={(e) => setInstAmount(e.target.value)}
//                 placeholder="5000.00"
//               />
//             </div>
//           </div>

//           <div className="dn-field">
//             <label>receipt date</label>
//             <input
//               className="dn-input"
//               type="date"
//               value={instDate}
//               onChange={(e) => setInstDate(e.target.value)}
//             />
//           </div>

//           <div className="dn-field">
//             <label>payment type</label>
//             <input
//               className="dn-input"
//               value={instType}
//               onChange={(e) => setInstType(e.target.value)}
//               placeholder="UPI / CASH / NEFT"
//             />
//           </div>

//           <div className="dn-field">
//             <label>payment ref</label>
//             <input
//               className="dn-input"
//               value={instRef}
//               onChange={(e) => setInstRef(e.target.value)}
//               placeholder="UTR / Ref"
//             />
//           </div>

//           <div className="dn-field" style={{ gridColumn: "span 2" }}>
//             <label>note</label>
//             <input
//               className="dn-input"
//               value={instNote}
//               onChange={(e) => setInstNote(e.target.value)}
//               placeholder="optional note"
//             />
//           </div>

//           <div className="dn-field" style={{ gridColumn: "span 2" }}>
//             <label>attachments</label>
//             <input
//               className="dn-file-input dn-file"
//               type="file"
//               multiple
//               onChange={(e) => setInstFiles(Array.from(e.target.files || []))}
//             />

//             {(instFiles || []).length ? (
//               <div className="dn-file-list">
//                 {instFiles.map((f, i) => (
//                   <span className="dn-file-chip" key={i}>
//                     <span className="dn-file-name">{f.name}</span>
//                     <button
//                       className="dn-file-remove"
//                       onClick={() =>
//                         setInstFiles(instFiles.filter((_, x) => x !== i))
//                       }
//                     >
//                       ×
//                     </button>
//                   </span>
//                 ))}
//               </div>
//             ) : null}
//           </div>
//         </div>

//         <div className="dn-filters-actions">
//           <button
//             className="dn-btn dn-btn-primary"
//             onClick={doAddInstallment}
//             disabled={loading}
//           >
//             Add Installment
//           </button>
//         </div>
//       </div>

//       {/* Interest */}
//       <div className="dn-filters">
//         <div
//           style={{
//             fontSize: 16,
//             fontWeight: 800,
//             color: "var(--dn-text)",
//             marginBottom: 8,
//           }}
//         >
//           Interest
//         </div>

//         <div className="dn-table-wrap">
//           <table
//             className="dn-subtable"
//             style={{ width: "100%", borderCollapse: "collapse" }}
//           >
//             <thead>
//               <tr
//                 style={{
//                   borderBottom: "1px solid var(--dn-border)",
//                   textAlign: "left",
//                 }}
//               >
//                 <th>Type</th>
//                 <th>Amount</th>
//                 <th>Reason</th>
//                 <th>Note</th>
//                 <th>Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(interests || []).map((it, idx) => (
//                 <tr
//                   key={idx}
//                   className="dn-row"
//                   style={{ borderBottom: "1px solid var(--dn-border)" }}
//                 >
//                   <td>{pick(it, ["entry_type", "type"], "-")}</td>
//                   <td className="dn-money">
//                     ₹ {inr(pick(it, ["amount"], "-"))}
//                   </td>
//                   <td className="dn-mono dn-wrap">
//                     {pick(it, ["reason_code"], "-")}
//                   </td>
//                   <td className="dn-wrap">{pick(it, ["note"], "-")}</td>
//                   <td>{pick(it, ["created_at", "ts", "date"], "-")}</td>
//                 </tr>
//               ))}
//               {(interests || []).length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={5}
//                     style={{ padding: 12, color: "var(--dn-muted)" }}
//                   >
//                     No interest entries.
//                   </td>
//                 </tr>
//               ) : null}
//             </tbody>
//           </table>
//         </div>

//         <div
//           style={{
//             marginTop: 12,
//             fontSize: 14,
//             fontWeight: 800,
//             color: "var(--dn-text)",
//           }}
//         >
//           Add Interest Entry
//         </div>

//         <div className="dn-addinst-grid" style={{ marginTop: 10 }}>
//           <div className="dn-field">
//             <label>entry type</label>
//             <select
//               className="dn-select"
//               value={intType}
//               onChange={(e) => setIntType(e.target.value)}
//             >
//               <option value="Charge">Charge</option>
//               <option value="Waive">Waive</option>
//             </select>
//           </div>

//           <div className="dn-field">
//             <label>amount</label>
//             <div className="dn-money-wrap">
//               <span className="dn-rupee">₹</span>
//               <input
//                 className="dn-input"
//                 value={intAmount}
//                 onChange={(e) => setIntAmount(e.target.value)}
//                 placeholder="500.00"
//               />
//             </div>
//           </div>

//           <div className="dn-field">
//             <label>reason code</label>
//             <input
//               className="dn-input"
//               value={intReason}
//               onChange={(e) => setIntReason(e.target.value)}
//               placeholder="MANUAL_INTEREST"
//             />
//           </div>

//           <div className="dn-field" style={{ gridColumn: "span 2" }}>
//             <label>note</label>
//             <input
//               className="dn-input"
//               value={intNote}
//               onChange={(e) => setIntNote(e.target.value)}
//               placeholder="optional note"
//             />
//           </div>
//         </div>

//         <div className="dn-filters-actions">
//           <button
//             className="dn-btn dn-btn-primary"
//             onClick={doAddInterest}
//             disabled={loading}
//           >
//             Add Interest
//           </button>
//         </div>
//       </div>

//       {/* DN Log */}
//       <div className="dn-filters">
//         <div
//           style={{
//             fontSize: 16,
//             fontWeight: 800,
//             color: "var(--dn-text)",
//             marginBottom: 8,
//           }}
//         >
//           DN Timeline / Log
//         </div>

//         {logTimeline?.length ? (
//           <div style={{ display: "grid", gap: 10 }}>
//             {logTimeline.map((ev, idx) => (
//               <div
//                 key={idx}
//                 style={{
//                   border: "1px solid var(--dn-border)",
//                   borderRadius: 12,
//                   padding: 12,
//                   background: "var(--dn-white)",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     gap: 10,
//                     flexWrap: "wrap",
//                   }}
//                 >
//                   <div style={{ fontWeight: 800, color: "var(--dn-text)" }}>
//                     {ev.title || ev.type || "Event"}
//                   </div>
//                   <div className="dn-mono" style={{ color: "var(--dn-muted)" }}>
//                     {pick(ev, ["ts"], "-")}
//                   </div>
//                 </div>

//                 {ev.meta ? (
//                   <div
//                     style={{
//                       marginTop: 8,
//                       fontSize: 12,
//                       color: "var(--dn-label)",
//                     }}
//                   >
//                     <pre
//                       className="dn-mono"
//                       style={{ whiteSpace: "pre-wrap", margin: 0 }}
//                     >
//                       {JSON.stringify(ev.meta, null, 2)}
//                     </pre>
//                   </div>
//                 ) : null}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div style={{ padding: 12, color: "var(--dn-muted)" }}>
//             No log available (or endpoint not enabled).
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";
import "./DemandNotes.css";

/* ---------------- helpers ---------------- */
function safeNumber(n, fallback = 0) {
  if (typeof n === "number" && !Number.isNaN(n)) return n;
  const parsed = Number(n);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function fmtINR(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = safeNumber(value, null);
  if (num === null) return String(value);
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleDateString("en-IN");
  } catch {
    return String(dt);
  }
}

function fmtDateTime(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("en-IN");
  } catch {
    return String(dt);
  }
}

function normalizeStatus(s) {
  if (!s) return "-";
  return String(s)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusPillStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return { backgroundColor: "#dcfce7", color: "#166534" };
  if (s === "overdue") return { backgroundColor: "#fee2e2", color: "#991b1b" };
  if (s === "draft") return { backgroundColor: "#fef3c7", color: "#92400e" };
  if (s.includes("partial"))
    return { backgroundColor: "#e0f2fe", color: "#075985" };
  return { backgroundColor: "#f3f4f6", color: "#374151" };
}

function fileNameFromPath(p) {
  if (!p) return "file";
  try {
    const clean = String(p).split("?")[0];
    return clean.split("/").filter(Boolean).pop() || "file";
  } catch {
    return "file";
  }
}

function absApiUrl(path, axiosInstance) {
  if (!path) return "";
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;

  const base = axiosInstance?.defaults?.baseURL || "";
  try {
    const u = new URL(base);
    return `${u.origin}${s}`;
  } catch {
    return s;
  }
}

function pick(obj, keys, fallback = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function sanitizeMoneyInput(v) {
  let s = String(v ?? "");
  s = s.replace(/[₹,\s]/g, "");
  s = s.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  return s;
}

function formatMoneyINR(v) {
  const s = sanitizeMoneyInput(v);
  if (!s) return "";
  const parts = s.split(".");
  const intPart = parts[0] || "0";
  const decPart = parts[1];

  const intNum = Number(intPart);
  const formattedInt = Number.isNaN(intNum)
    ? intPart
    : intNum.toLocaleString("en-IN");

  if (decPart === undefined) return formattedInt;
  return `${formattedInt}.${decPart}`;
}

/* ---------- naming convention helpers ---------- */
function getTotalPayable(n) {
  return n?.net_payable ?? n?.total ?? "0";
}
function getTotalPaid(n) {
  return n?.total_paid ?? n?.paid_total ?? "0";
}
function getTotalDue(n) {
  return n?.total_due ?? n?.due_total ?? "0";
}
function getAdvancePaid(n) {
  return n?.credit_generated ?? "0";
}

const BASE_FIN = "/financial";

export default function DemandNoteDetail() {
  const { dnId } = useParams();
  const nav = useNavigate();

  const canLoad = useMemo(() => !!dnId, [dnId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [dn, setDn] = useState(null);
  const [dnLog, setDnLog] = useState(null);

  const [newStatus, setNewStatus] = useState("");

  // search
  const [instSearch, setInstSearch] = useState("");
  const [intSearch, setIntSearch] = useState("");

  // modals
  const [addInstOpen, setAddInstOpen] = useState(false);
  const [addIntOpen, setAddIntOpen] = useState(false);

  // installment form (modal)
  const [instAmount, setInstAmount] = useState("");
  const [instReceiptDate, setInstReceiptDate] = useState("");
  const [instPaymentType, setInstPaymentType] = useState("UPI");
  const [instPaymentRef, setInstPaymentRef] = useState("");
  const [instNote, setInstNote] = useState("");
  const [instFiles, setInstFiles] = useState([]);
  const [instSaving, setInstSaving] = useState(false);

  // interest form (modal)
  const [intType, setIntType] = useState("Charge");
  const [intAmount, setIntAmount] = useState("");
  const [intReason, setIntReason] = useState("MANUAL_INTEREST");
  const [intNote, setIntNote] = useState("");
  const [intSaving, setIntSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setErr("");

    try {
      const detailRes = await axiosInstance.get(
        `${BASE_FIN}/demand-notes/${dnId}/`
      );
      const detail = detailRes.data;
      setDn(detail);
      setNewStatus(detail?.status || "");

      // optional log
      try {
        const logRes = await axiosInstance.get(
          `${BASE_FIN}/demand-notes/${dnId}/log/`
        );
        setDnLog(logRes.data);
      } catch {
        setDnLog(null);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load demand note";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [canLoad, dnId]);

  useEffect(() => {
    load();
  }, [load]);

  const doIssue = async () => {
    setErr("");
    try {
      await axiosInstance.post(`${BASE_FIN}/demand-notes/${dnId}/issue/`);
      toast.success("Demand Note issued ✅");
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Issue failed";
      setErr(msg);
      toast.error(msg);
    }
  };

  const doSetStatus = async () => {
    if (!newStatus) return;
    setErr("");
    try {
      await axiosInstance.patch(
        `${BASE_FIN}/demand-notes/${dnId}/set-status/`,
        { status: newStatus }
      );
      toast.success("Status updated ✅");
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Status update failed";
      setErr(msg);
      toast.error(msg);
    }
  };

  /* ---------------- Installments ---------------- */
  const installments =
    pick(
      dn,
      ["installments", "demand_note_installments", "installment_list"],
      []
    ) || [];

  const filteredInstallments = useMemo(() => {
    const term = instSearch.trim().toLowerCase();
    if (!term) return installments;

    return installments.filter((x) => {
      const blob = [
        x.id,
        x.receipt_no,
        x.receipt_date,
        x.receipt_amount,
        x.payment_type,
        x.payment_mode,
        x.payment_ref,
        x.utr,
        x.cheque_no,
        x.notes,
        x.note,
        x.created_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [installments, instSearch]);

  const openAddInstallment = () => {
    const dueNum = safeNumber(getTotalDue(dn), 0);
    if (dueNum <= 0) {
      toast.error("No due remaining for this Demand Note.");
      return;
    }

    setInstAmount(String(dueNum));
    setInstReceiptDate("");
    setInstPaymentType("UPI");
    setInstPaymentRef("");
    setInstNote("");
    setInstFiles([]);
    setAddInstOpen(true);
  };

  const closeAddInstallment = () => setAddInstOpen(false);

  const onPickInstFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setInstFiles((prev) => {
      const map = new Map();
      [...prev, ...files].forEach((f) => {
        const key = `${f.name}_${f.size}_${f.lastModified}`;
        if (!map.has(key)) map.set(key, f);
      });
      return Array.from(map.values());
    });

    e.target.value = "";
  };

  const removeInstFile = (idx) =>
    setInstFiles((prev) => prev.filter((_, i) => i !== idx));

  const doAddInstallment = async () => {
    const dueNum = safeNumber(getTotalDue(dn), 0);
    if (dueNum <= 0) return toast.error("No due remaining.");
    if (!instAmount || Number(instAmount) <= 0)
      return toast.error("Amount must be > 0");
    if (Number(instAmount) > dueNum)
      return toast.error(
        `Amount cannot exceed remaining due (${fmtINR(dueNum)})`
      );

    setErr("");
    setInstSaving(true);
    try {
      const url = `${BASE_FIN}/demand-notes/${dnId}/installments/`;

      // with files => multipart
      if (instFiles.length > 0) {
        const fd = new FormData();
        fd.append("amount", String(instAmount));
        if (instPaymentType) fd.append("payment_type", instPaymentType);
        if (instPaymentRef) fd.append("payment_ref", instPaymentRef);
        if (instNote) fd.append("note", instNote);
        if (instReceiptDate) fd.append("receipt_date", instReceiptDate);
        instFiles.forEach((f) => fd.append("attachments", f));

        await axiosInstance.post(url, fd);
      } else {
        await axiosInstance.post(url, {
          amount: String(instAmount),
          payment_type: instPaymentType || null,
          payment_ref: instPaymentRef || null,
          note: instNote || null,
          receipt_date: instReceiptDate || null,
        });
      }

      toast.success("Installment added ✅");
      closeAddInstallment();
      await load();
    } catch (e) {
      const data = e?.response?.data || {};
      const msg =
        data?.detail ||
        data?.error ||
        (Array.isArray(data?.amount) ? data.amount[0] : data?.amount) ||
        e?.message ||
        "Add installment failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setInstSaving(false);
    }
  };

  /* ---------------- Interest ---------------- */
  const interests =
    pick(dn, ["interest_entries", "interests"], []) ||
    pick(dnLog, ["interest_entries"], []) ||
    [];

  const filteredInterests = useMemo(() => {
    const term = intSearch.trim().toLowerCase();
    if (!term) return interests;

    return interests.filter((x) => {
      const blob = [
        x.id,
        x.entry_type,
        x.type,
        x.amount,
        x.reason_code,
        x.note,
        x.created_at,
        x.ts,
        x.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [interests, intSearch]);

  const openAddInterest = () => {
    setIntType("Charge");
    setIntAmount("");
    setIntReason("MANUAL_INTEREST");
    setIntNote("");
    setAddIntOpen(true);
  };

  const closeAddInterest = () => setAddIntOpen(false);

  const doAddInterest = async () => {
    if (!intAmount || Number(intAmount) <= 0)
      return toast.error("Interest amount is required");

    setErr("");
    setIntSaving(true);
    try {
      await axiosInstance.post(`${BASE_FIN}/interest-entries/`, {
        demand_note: Number(dnId),
        entry_type: intType,
        amount: String(intAmount),
        note: intNote || "",
        reason_code: intReason || "MANUAL_INTEREST",
      });

      toast.success("Interest entry added ✅");
      closeAddInterest();
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Add interest failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setIntSaving(false);
    }
  };

  /* ---------------- Log / Timeline ---------------- */
  const logTimeline = pick(dnLog, ["timeline"], []) || [];
  const logSummary = pick(dnLog, ["summary"], null);

  /* ---------------- derived display fields ---------------- */
  const detailTitle = pick(dn, ["demand_id"], `DN-${dnId}`);
  const status = pick(dn, ["status"], "-");
  const dueDate = pick(dn, ["due_date"], null);
  const milestone = pick(dn, ["milestone"], null);
  const isDraft = String(status || "").toLowerCase() === "draft";

  return (
    <div className="demand-notes-page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="dn-btn dn-btn-light" onClick={() => nav(-1)}>
              ← Back
            </button>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
              {detailTitle}
            </div>
            <span
              className="booking-status-pill"
              style={{
                ...statusPillStyle(status),
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {normalizeStatus(status)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Demand Note Detail • ID: {dnId}
          </div>
        </div>

        <div className="dn-header-actions" style={{ display: "flex" }}>
          <button
            className="dn-btn dn-btn-light"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {isDraft && (
            <button
              className="dn-btn dn-btn-primary"
              onClick={doIssue}
              disabled={loading}
            >
              Issue DN
            </button>
          )}
        </div>
      </div>

      {err ? <div className="dn-error">{err}</div> : null}
      {loading ? <div className="dn-loading">Loading...</div> : null}

      {/* Summary + Status Update */}
      <div className="dn-filters">
        <div
          className="dn-grid"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          <div className="dn-field">
            <label>Due Date</label>
            <input className="dn-input" value={fmtDate(dueDate)} readOnly />
          </div>

          <div className="dn-field">
            <label>Milestone</label>
            <input className="dn-input" value={milestone || "-"} readOnly />
          </div>

          <div className="dn-field">
            <label>Total Payable</label>
            <input
              className="dn-input"
              value={fmtINR(getTotalPayable(dn))}
              readOnly
            />
          </div>

          <div className="dn-field">
            <label>Amounts</label>
            <div className="dn-due-inline">
              <span className="dn-money">
                <b>Paid:</b> {fmtINR(getTotalPaid(dn))}
              </span>
              <span className="dn-money">
                <b>Advance:</b> {fmtINR(getAdvancePaid(dn))}
              </span>
              <span className="dn-money">
                <b>Due:</b> {fmtINR(getTotalDue(dn))}
              </span>
            </div>
          </div>
        </div>

        <div className="dn-filters-grid" style={{ marginTop: 10 }}>
          <div className="dn-field">
            <label>Set Status</label>
            <select
              className="dn-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Select</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
              <option value="Partial Paid">Partial Paid</option>
            </select>
          </div>
        </div>

        <div className="dn-filters-actions">
          <button
            className="dn-btn dn-btn-primary"
            onClick={doSetStatus}
            disabled={loading || !newStatus}
          >
            Update Status
          </button>
        </div>
      </div>

      {/* Interest summary hint */}
      {logSummary ? (
        <div className="dn-hint" style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <b>Charged:</b> {fmtINR(logSummary.charged_interest)}
            </div>
            <div>
              <b>Waived:</b> {fmtINR(logSummary.waived_interest)}
            </div>
            <div>
              <b>Net:</b> {fmtINR(logSummary.net_interest)}
            </div>
          </div>
        </div>
      ) : null}

      {/* Installments */}
      <div className="dn-filters">
        <div className="dn-inst-toolbar">
          <div className="dn-inst-toolbar-left">
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Installments
            </div>
            <SearchBar
              value={instSearch}
              onChange={(v) => setInstSearch(v)}
              placeholder="Search installments by receipt, ref, note, amount..."
              wrapperClassName="dn-inst-search"
            />
          </div>

          <div className="dn-inst-toolbar-right">
            <button
              className="dn-btn dn-btn-primary"
              onClick={openAddInstallment}
              disabled={loading}
            >
              + Add Installment
            </button>
          </div>
        </div>

        <div className="dn-table-wrap">
          <table
            className="booking-table dn-subtable"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th style={{ width: 160 }}>Receipt No</th>
                <th style={{ width: 120 }}>Date</th>
                <th style={{ width: 160 }}>Amount</th>
                <th style={{ width: 140 }}>Type</th>
                <th>Ref (UTR/Cheque)</th>
                <th style={{ width: 260 }}>Note</th>
                <th style={{ width: 260 }}>Attachments</th>
                <th style={{ width: 200 }}>Created</th>
              </tr>
            </thead>

            <tbody>
              {filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="booking-empty-row">
                    No installments found.
                  </td>
                </tr>
              ) : (
                filteredInstallments.map((x) => {
                  const atts = Array.isArray(x.attachments)
                    ? x.attachments
                    : [];
                  return (
                    <tr key={x.id} className="dn-row">
                      <td>{x.id}</td>
                      <td className="dn-mono">{x.receipt_no || "-"}</td>
                      <td>{fmtDate(x.receipt_date)}</td>
                      <td className="dn-money">
                        {fmtINR(x.receipt_amount ?? x.amount)}
                      </td>
                      <td>{x.payment_type || x.payment_mode || "-"}</td>
                      <td className="dn-mono dn-wrap">
                        {x.payment_ref || x.utr || x.cheque_no || "-"}
                      </td>
                      <td className="dn-wrap">{x.notes || x.note || "-"}</td>
                      <td>
                        {atts.length > 0 ? (
                          <div className="dn-att-list">
                            {atts.map((a) => {
                              const href = absApiUrl(
                                a?.file || a?.url || a,
                                axiosInstance
                              );
                              const label = fileNameFromPath(
                                a?.file || a?.url || a
                              );
                              return (
                                <a
                                  key={a?.id || href}
                                  className="dn-att-link"
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={label}
                                >
                                  📎 {label}
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280", fontSize: 12 }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>{fmtDateTime(x.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="dn-inst-count">
            Showing <b>{filteredInstallments.length}</b> of{" "}
            <b>{installments.length}</b>
          </div>
        </div>
      </div>

      {/* Interest */}
      <div className="dn-filters">
        <div className="dn-inst-toolbar">
          <div className="dn-inst-toolbar-left">
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Interest
            </div>
            <SearchBar
              value={intSearch}
              onChange={(v) => setIntSearch(v)}
              placeholder="Search interest by type, reason, note, amount..."
              wrapperClassName="dn-inst-search"
            />
          </div>

          <div className="dn-inst-toolbar-right">
            <button
              className="dn-btn dn-btn-primary"
              onClick={openAddInterest}
              disabled={loading}
            >
              + Add Interest
            </button>
          </div>
        </div>

        <div className="dn-table-wrap">
          <table
            className="booking-table dn-subtable"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th style={{ width: 140 }}>Type</th>
                <th style={{ width: 160 }}>Amount</th>
                <th style={{ width: 220 }}>Reason</th>
                <th>Note</th>
                <th style={{ width: 210 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="booking-empty-row">
                    No interest entries.
                  </td>
                </tr>
              ) : (
                filteredInterests.map((it, idx) => (
                  <tr key={it?.id || idx} className="dn-row">
                    <td>{pick(it, ["entry_type", "type"], "-")}</td>
                    <td className="dn-money">
                      {fmtINR(pick(it, ["amount"], "-"))}
                    </td>
                    <td className="dn-mono dn-wrap">
                      {pick(it, ["reason_code"], "-")}
                    </td>
                    <td className="dn-wrap">{pick(it, ["note"], "-")}</td>
                    <td>
                      {fmtDateTime(pick(it, ["created_at", "ts", "date"], "-"))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DN Timeline / Log */}
      <div className="dn-filters">
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 10,
          }}
        >
          DN Timeline / Log
        </div>

        {logTimeline?.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {logTimeline.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {ev.title || ev.type || "Event"}
                  </div>
                  <div className="dn-mono" style={{ color: "#6b7280" }}>
                    {pick(ev, ["ts"], "-")}
                  </div>
                </div>

                {ev.meta ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                    <pre
                      className="dn-mono"
                      style={{ whiteSpace: "pre-wrap", margin: 0 }}
                    >
                      {JSON.stringify(ev.meta, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 12, color: "#6b7280" }}>
            No log available (or endpoint not enabled).
          </div>
        )}
      </div>

      {/* ================== ADD INSTALLMENT MODAL ================== */}
      {addInstOpen && (
        <div className="dn-modal-overlay" onMouseDown={closeAddInstallment}>
          <div
            className="dn-modal dn-modal-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div>
                <div className="dn-modal-title">Add Installment</div>
                <div className="dn-modal-sub">
                  Demand Note: <b>{detailTitle}</b> • Due:{" "}
                  <b>{fmtINR(getTotalDue(dn))}</b>
                </div>
              </div>
              <button
                className="dn-close-btn"
                onClick={closeAddInstallment}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="dn-addinst-grid">
                <div className="dn-field">
                  <label>Amount</label>
                  <div className="dn-money-wrap">
                    <span className="dn-rupee">₹</span>
                    <input
                      className="dn-input"
                      value={formatMoneyINR(instAmount)}
                      onChange={(e) =>
                        setInstAmount(sanitizeMoneyInput(e.target.value))
                      }
                      placeholder="100000.00"
                    />
                  </div>
                </div>

                <div className="dn-field">
                  <label>Receipt Date (Optional)</label>
                  <input
                    className="dn-input"
                    type="date"
                    value={instReceiptDate}
                    onChange={(e) => setInstReceiptDate(e.target.value)}
                  />
                </div>

                <div className="dn-field">
                  <label>Payment Type</label>
                  <select
                    className="dn-select"
                    value={instPaymentType}
                    onChange={(e) => setInstPaymentType(e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div className="dn-field">
                  <label>Payment Ref (UTR/Cheque/Txn)</label>
                  <input
                    className="dn-input"
                    value={instPaymentRef}
                    onChange={(e) => setInstPaymentRef(e.target.value)}
                    placeholder="UTR123 / Cheque No / Txn Id"
                  />
                </div>

                <div className="dn-field dn-span-2">
                  <label>Note</label>
                  <input
                    className="dn-input"
                    value={instNote}
                    onChange={(e) => setInstNote(e.target.value)}
                    placeholder="Part payment / remarks..."
                  />
                </div>

                <div className="dn-field dn-span-2">
                  <label>Attachments (Multiple)</label>
                  <input
                    className="dn-file-input"
                    type="file"
                    multiple
                    onChange={onPickInstFiles}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  />

                  {instFiles.length > 0 && (
                    <div className="dn-file-list">
                      {instFiles.map((f, idx) => (
                        <div
                          key={`${f.name}_${f.size}_${idx}`}
                          className="dn-file-chip"
                        >
                          <span className="dn-file-name" title={f.name}>
                            {f.name}
                          </span>
                          <button
                            type="button"
                            className="dn-file-remove"
                            onClick={() => removeInstFile(idx)}
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={closeAddInstallment}
                disabled={instSaving}
              >
                Cancel
              </button>
              <button
                className="dn-btn dn-btn-primary"
                onClick={doAddInstallment}
                disabled={instSaving}
              >
                {instSaving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== ADD INTEREST MODAL ================== */}
      {addIntOpen && (
        <div className="dn-modal-overlay" onMouseDown={closeAddInterest}>
          <div
            className="dn-modal dn-modal-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div>
                <div className="dn-modal-title">Add Interest Entry</div>
                <div className="dn-modal-sub">
                  Demand Note: <b>{detailTitle}</b>
                </div>
              </div>
              <button
                className="dn-close-btn"
                onClick={closeAddInterest}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="dn-addinst-grid">
                <div className="dn-field">
                  <label>Entry Type</label>
                  <select
                    className="dn-select"
                    value={intType}
                    onChange={(e) => setIntType(e.target.value)}
                  >
                    <option value="Charge">Charge</option>
                    <option value="Waive">Waive</option>
                  </select>
                </div>

                <div className="dn-field">
                  <label>Amount</label>
                  <div className="dn-money-wrap">
                    <span className="dn-rupee">₹</span>
                    <input
                      className="dn-input"
                      value={formatMoneyINR(intAmount)}
                      onChange={(e) =>
                        setIntAmount(sanitizeMoneyInput(e.target.value))
                      }
                      placeholder="500.00"
                    />
                  </div>
                </div>

                <div className="dn-field dn-span-2">
                  <label>Reason Code</label>
                  <input
                    className="dn-input"
                    value={intReason}
                    onChange={(e) => setIntReason(e.target.value)}
                    placeholder="MANUAL_INTEREST"
                  />
                </div>

                <div className="dn-field dn-span-2">
                  <label>Note</label>
                  <input
                    className="dn-input"
                    value={intNote}
                    onChange={(e) => setIntNote(e.target.value)}
                    placeholder="optional note"
                  />
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={closeAddInterest}
                disabled={intSaving}
              >
                Cancel
              </button>
              <button
                className="dn-btn dn-btn-primary"
                onClick={doAddInterest}
                disabled={intSaving}
              >
                {intSaving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
