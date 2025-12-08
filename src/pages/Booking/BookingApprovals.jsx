// src/pages/Bookings/BookingApprovals.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BookingAPI, PaymentLeadAPI } from "../../api/endpoints";
import "./BookingApprovals.css";

// ----- Helpers -----
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toSentenceCase = (value) => {
  if (!value) return "-";
  const str = String(value).replace(/_/g, " ").toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function BookingApprovals() {
  const [activeTab, setActiveTab] = useState("BOOKING"); // "BOOKING" | "PAYMENT"

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState("");
  const [kycOnly, setKycOnly] = useState(false); // BOOKING tab only
  const [search, setSearch] = useState("");

  const [projects, setProjects] = useState([]);

  // detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState(null); // "BOOKING" | "PAYMENT"
  const [detailItem, setDetailItem] = useState(null);

  // ---------- Load projects from MY_SCOPE ----------
  useEffect(() => {
    const raw = localStorage.getItem("MY_SCOPE");
    if (!raw) return;

    try {
      const scope = JSON.parse(raw);
      let projList = [];

      if (Array.isArray(scope.projects)) {
        projList = scope.projects;
      } else if (Array.isArray(scope.project_scope)) {
        projList = scope.project_scope;
      } else if (Array.isArray(scope.project_list)) {
        projList = scope.project_list;
      }

      setProjects(projList || []);

      if (projList && projList.length === 1) {
        setProjectId(String(projList[0].id));
      }
    } catch (err) {
      console.error("Failed to parse MY_SCOPE", err);
    }
  }, []);

  // ---------- Fetch BOOKING pending approvals ----------
  const fetchPendingBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (kycOnly) params.kyc_only = "1";

      const data = await BookingAPI.listPending(params);
      const list = Array.isArray(data) ? data : data.results ?? [];
      setRows(list);
    } catch (err) {
      console.error("Failed to load pending booking approvals", err);
      setError(
        err?.response?.data?.detail ||
          "Failed to load pending bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, kycOnly]);

  // ---------- Fetch PAYMENT pending approvals ----------
  const fetchPendingPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (projectId) params.project_id = projectId;

      const data = await PaymentLeadAPI.listPending(params);
      const list = Array.isArray(data) ? data : data.results ?? [];
      setRows(list);
    } catch (err) {
      console.error("Failed to load pending payments", err);
      setError(
        err?.response?.data?.detail ||
          "Failed to load pending payments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ---------- Trigger fetch on tab / filters ----------
  useEffect(() => {
    if (activeTab === "BOOKING") {
      fetchPendingBookings();
    } else {
      fetchPendingPayments();
    }
  }, [activeTab, fetchPendingBookings, fetchPendingPayments]);

  // ---------- Client-side search filter ----------
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      if (activeTab === "BOOKING") {
        const b = item;
        const bookingCode =
          b.booking_code || b.code || b.form_ref_no || `B-${b.id}`;
        const leadName =
          b.sales_lead_name ||
          b.lead_name ||
          [b.first_name, b.last_name].filter(Boolean).join(" ") ||
          b.primary_full_name ||
          "";
        const mobile =
          b.primary_mobile_number ||
          b.mobile_number ||
          b.lead_mobile ||
          b.primary_contact ||
          "";
        const projectName =
          b.project || b.project_name || b.project?.name || "";
        const unitLabel =
          b.unit || b.unit_label || b.unit_no || b.unit?.unit_no || "";
        const haystack = [bookingCode, leadName, mobile, projectName, unitLabel]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      } else {
        const p = item;
        const paymentId = `P-${p.id}`;
        const leadName =
          p.lead_name ||
          p.lead_full_name ||
          p.lead?.full_name ||
          [p.lead?.first_name, p.lead?.last_name].filter(Boolean).join(" ") ||
          "";
        const mobile =
          p.lead_mobile ||
          p.lead?.mobile_number ||
          p.lead?.primary_mobile_number ||
          "";
        const projectName = p.project_name || p.project?.name || "";
        const amount = String(p.amount || "");
        const method = p.payment_method || "";
        const type = p.payment_type || "";

        const haystack = [
          paymentId,
          leadName,
          mobile,
          projectName,
          amount,
          method,
          type,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }
    });
  }, [rows, search, activeTab]);

  // ---------- Actions: BOOKING ----------
  const handleConfirmBooking = async (booking) => {
    if (
      !window.confirm(
        `Confirm booking #${booking.id || booking.booking_code || ""}?`
      )
    ) {
      return;
    }

    const reason = window.prompt(
      "Optional note / reason for confirmation:",
      ""
    );

    try {
      await BookingAPI.confirm(booking.id, { reason });
      await fetchPendingBookings();
      alert("Booking confirmed successfully.");
      setDetailOpen(false);
    } catch (err) {
      console.error("Confirm booking failed", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to confirm booking. Please check KYC / permissions.";
      alert(msg);
    }
  };

  const handleRejectBooking = async (booking) => {
    let reason = window.prompt(
      "Reason for rejection (required):",
      booking.cancelled_reason || ""
    );

    if (reason === null) return;

    reason = (reason || "").trim();
    if (!reason) {
      const proceed = window.confirm(
        "No reason provided. Reject without reason?"
      );
      if (!proceed) return;
    }

    try {
      await BookingAPI.reject(booking.id, { reason });
      await fetchPendingBookings();
      alert("Booking rejected and unit/inventory released.");
      setDetailOpen(false);
    } catch (err) {
      console.error("Reject booking failed", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to reject booking. Please try again.";
      alert(msg);
    }
  };

  // ---------- Actions: PAYMENT ----------
  const handleApprovePayment = async (payment) => {
    if (
      !window.confirm(
        `Approve payment #${payment.id} for amount ${formatCurrency(
          payment.amount
        )}?`
      )
    ) {
      return;
    }

    const reason = window.prompt("Optional note / reason for approval:", "");

    try {
      await PaymentLeadAPI.approve(payment.id, { reason });
      await fetchPendingPayments();
      alert("Payment approved successfully.");
      setDetailOpen(false);
    } catch (err) {
      console.error("Approve payment failed", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to approve payment. Please try again.";
      alert(msg);
    }
  };

  const handleRejectPayment = async (payment) => {
    let reason = window.prompt(
      "Reason for rejecting payment (required):",
      payment.notes || ""
    );

    if (reason === null) return;

    reason = (reason || "").trim();
    if (!reason) {
      const proceed = window.confirm(
        "No reason provided. Reject without reason?"
      );
      if (!proceed) return;
    }

    let finalStatus = window.prompt(
      "Final status (FAILED / REFUNDED). Leave empty for FAILED:",
      "FAILED"
    );
    finalStatus = (finalStatus || "FAILED").toUpperCase();

    try {
      await PaymentLeadAPI.reject(payment.id, {
        reason,
        final_status: finalStatus,
      });
      await fetchPendingPayments();
      alert("Payment rejected.");
      setDetailOpen(false);
    } catch (err) {
      console.error("Reject payment failed", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to reject payment. Please try again.";
      alert(msg);
    }
  };

  // ---------- Helpers ----------
  const getBookingKycStatusLabel = (b) => {
    const raw =
      b.kyc_status ||
      b.kyc_status_label ||
      b.kyc_status_display ||
      b.kyc_request?.status_display ||
      b.kyc_request?.status ||
      "-";
    return toSentenceCase(raw);
  };

  const openBookingDetails = (booking) => {
    setDetailType("BOOKING");
    setDetailItem(booking);
    setDetailOpen(true);
  };

  const openPaymentDetails = (payment) => {
    setDetailType("PAYMENT");
    setDetailItem(payment);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
    setDetailType(null);
  };

  const headerTitle =
    activeTab === "BOOKING"
      ? "Pending Booking Approvals"
      : "Pending Payment Approvals";

  return (
    <div
      className="booking-approvals-page"
      style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}
    >
      <div className="booking-approvals-container">
        {/* Header + Tabs */}
        <div className="ba-header">
          <div>
            <h2 style={{ color: "#102a54", marginBottom: 4 }}>{headerTitle}</h2>
            <p style={{ fontSize: 13, color: "#555" }}>
              {activeTab === "BOOKING" ? (
                <>
                  Only <strong>DRAFT</strong> bookings are shown here. You can
                  view full details and then confirm or reject them.
                </>
              ) : (
                <>
                  PENDING payments for your projects. You can view details and
                  then approve or reject.
                </>
              )}
            </p>
          </div>

          <div className="ba-header-right">
            {/* Tabs */}
            <div className="ba-tabs">
              <button
                type="button"
                className={
                  activeTab === "BOOKING" ? "ba-tab ba-tab-active" : "ba-tab"
                }
                onClick={() => setActiveTab("BOOKING")}
              >
                Bookings
              </button>
              <button
                type="button"
                className={
                  activeTab === "PAYMENT" ? "ba-tab ba-tab-active" : "ba-tab"
                }
                onClick={() => setActiveTab("PAYMENT")}
              >
                Payments
              </button>
            </div>

            <button
              type="button"
              className="ba-refresh-btn"
              onClick={
                activeTab === "BOOKING"
                  ? fetchPendingBookings
                  : fetchPendingPayments
              }
            >
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-filters">
          <div className="ba-filter-item">
            <label>Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">All projects in my scope</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "BOOKING" && (
            <div className="ba-filter-item ba-checkbox">
              {/* <label>
                <input
                  type="checkbox"
                  checked={kycOnly}
                  onChange={(e) => setKycOnly(e.target.checked)}
                />{" "}
                KYC linked only
              </label> */}
            </div>
          )}

          <div className="ba-filter-item ba-search">
            <label>Search</label>
            <input
              type="text"
              placeholder={
                activeTab === "BOOKING"
                  ? "Lead, mobile, booking code, unit..."
                  : "Lead, mobile, project, amount..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Error state */}
        {error && <div className="ba-error">{error}</div>}

        {/* Table */}
        <div className="ba-table-wrapper">
          {loading ? (
            <div className="ba-loading">
              {activeTab === "BOOKING"
                ? "Loading pending bookings..."
                : "Loading pending payments..."}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="ba-empty">
              {activeTab === "BOOKING"
                ? "No pending booking approvals found for selected filters."
                : "No pending payments found for selected filters."}
            </div>
          ) : activeTab === "BOOKING" ? (
            // ---------- BOOKING TABLE ----------
            <table className="ba-table">
              <thead>
                <tr>
                  <th style={{ width: "150px" }}>Actions</th>
                  <th>Booking</th>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Project / Unit</th>
                  <th>Agreement Value</th>
                  <th>Booking Amount</th>
                  <th>Total Advance</th>
                  {/* <th>KYC Status</th> */}
                  <th>Status</th>
                  <th>Created At</th>
                </tr>

                
              </thead>
              <tbody>
                {filteredRows.map((b) => {
                  const bookingCode =
                    b.form_ref_no || b.booking_code || b.code || `B-${b.id}`;
                  const leadName =
                    b.sales_lead_name ||
                    b.lead_name ||
                    b.primary_full_name ||
                    [b.first_name, b.last_name].filter(Boolean).join(" ") ||
                    "-";
                  const contact =
                    b.primary_mobile_number ||
                    b.mobile_number ||
                    b.lead_mobile ||
                    b.primary_contact ||
                    "-";
                  const email =
                    b.primary_email || b.email || b.applicant_email || "";
                  const projectLabel =
                    b.project || b.project_name || b.project?.name || "-";
                  const unitLabel =
                    b.unit ||
                    b.unit_label ||
                    b.unit_no ||
                    b.unit?.unit_no ||
                    "";
                  const projUnit = unitLabel
                    ? `${projectLabel} – ${unitLabel}`
                    : projectLabel;

                  const agreementValue = formatCurrency(b.agreement_value);
                  const bookingAmount = formatCurrency(b.booking_amount);
                  const totalAdvance = formatCurrency(b.total_advance);
                  const statusLabel = toSentenceCase(
                    b.status_label || b.status
                  );
                  const kycStatus = getBookingKycStatusLabel(b);
                  const createdAt = b.created_at_display || b.created_at || "";

                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="ba-actions">
                          <button
                            type="button"
                            className="ba-btn ba-btn-view"
                            onClick={() => openBookingDetails(b)}
                          >
                            👁 View
                          </button>
                          <button
                            type="button"
                            className="ba-btn ba-btn-confirm"
                            onClick={() => handleConfirmBooking(b)}
                          >
                            ✅ Confirm
                          </button>
                          <button
                            type="button"
                            className="ba-btn ba-btn-reject"
                            onClick={() => handleRejectBooking(b)}
                          >
                            ✖ Reject
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{bookingCode}</div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{leadName}</div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{contact}</div>
                        {email && <div className="ba-cell-sub">{email}</div>}
                      </td>
                      <td>
                        <div className="ba-cell-main">{projUnit}</div>
                      </td>
                      <td>{agreementValue}</td>
                      <td>{bookingAmount}</td>
                      <td>{totalAdvance}</td>
                      {/* <td>
                        <span className="ba-kyc-chip">{kycStatus}</span>
                      </td> */}
                      <td>{statusLabel}</td>
                      <td>{createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // ---------- PAYMENT TABLE ----------
            <table className="ba-table">
              <thead>
                <tr>
                  <th style={{ width: "150px" }}>Actions</th>
                  <th>Payment</th>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Project</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((p) => {
                  const paymentCode = `P-${p.id}`;
                  const leadName =
                    p.lead_name ||
                    p.lead_full_name ||
                    p.lead?.full_name ||
                    [p.lead?.first_name, p.lead?.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "-";
                  const contact =
                    p.lead_mobile ||
                    p.lead?.mobile_number ||
                    p.lead?.primary_mobile_number ||
                    "-";
                  const email =
                    p.lead_email ||
                    p.lead?.email ||
                    p.lead?.primary_email ||
                    "";
                  const projectLabel = p.project_name || p.project?.name || "-";
                  const amountLabel = formatCurrency(p.amount);
                  const typeLabel = toSentenceCase(p.payment_type);
                  const methodLabel = toSentenceCase(p.payment_method);
                  const statusLabel = toSentenceCase(p.status);
                  const paymentDate = p.payment_date || "";

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="ba-actions">
                          <button
                            type="button"
                            className="ba-btn ba-btn-view"
                            onClick={() => openPaymentDetails(p)}
                          >
                            👁 View
                          </button>
                          <button
                            type="button"
                            className="ba-btn ba-btn-confirm"
                            onClick={() => handleApprovePayment(p)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            type="button"
                            className="ba-btn ba-btn-reject"
                            onClick={() => handleRejectPayment(p)}
                          >
                            ✖ Reject
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{paymentCode}</div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{leadName}</div>
                      </td>
                      <td>
                        <div className="ba-cell-main">{contact}</div>
                        {email && <div className="ba-cell-sub">{email}</div>}
                      </td>
                      <td>
                        <div className="ba-cell-main">{projectLabel}</div>
                      </td>
                      <td>{amountLabel}</td>
                      <td>{typeLabel}</td>
                      <td>{methodLabel}</td>
                      <td>{statusLabel}</td>
                      <td>{paymentDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* -------- Detail Modal -------- */}
      {detailOpen && detailItem && (
        <div className="ba-detail-overlay">
          <div className="ba-detail-modal">
            <div className="ba-detail-header">
              <h3 style={{ color: "#102a54" }}>
                {detailType === "BOOKING"
                  ? "Booking Details"
                  : "Payment Details"}
              </h3>

              <div className="ba-detail-header-actions">
                {detailType === "BOOKING" && (
                  <>
                    <button
                      type="button"
                      className="ba-btn ba-btn-confirm"
                      onClick={() => handleConfirmBooking(detailItem)}
                    >
                      ✅ Confirm
                    </button>
                    <button
                      type="button"
                      className="ba-btn ba-btn-reject"
                      onClick={() => handleRejectBooking(detailItem)}
                    >
                      ✖ Reject
                    </button>
                  </>
                )}
                {detailType === "PAYMENT" && (
                  <>
                    <button
                      type="button"
                      className="ba-btn ba-btn-confirm"
                      onClick={() => handleApprovePayment(detailItem)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      type="button"
                      className="ba-btn ba-btn-reject"
                      onClick={() => handleRejectPayment(detailItem)}
                    >
                      ✖ Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="ba-detail-close"
                  onClick={closeDetail}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="ba-detail-body">
              {detailType === "BOOKING" ? (
                <BookingDetailView booking={detailItem} />
              ) : (
                <PaymentDetailView payment={detailItem} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Detail components ---------- */

function BookingDetailView({ booking }) {
  const bookingCode =
    booking.form_ref_no ||
    booking.booking_code ||
    booking.code ||
    `B-${booking.id}`;
  const projectLabel =
    booking.project || booking.project_name || booking.project?.name || "-";
  const towerLabel = booking.tower || "-";
  const floorLabel = booking.floor || "-";
  const unitLabel =
    booking.unit || booking.unit_label || booking.unit_no || "-";

  const agreementValue = formatCurrency(booking.agreement_value);
  const bookingAmount = formatCurrency(booking.booking_amount);
  const otherCharges = formatCurrency(booking.other_charges);
  const totalAdvance = formatCurrency(booking.total_advance);

  const kycStatus =
    booking.kyc_status ||
    booking.kyc_status_label ||
    booking.kyc_status_display;
  const statusLabel = booking.status_label || booking.status;

  return (
    <div className="ba-detail-content">
      {/* Basic Info */}
      <section className="ba-detail-section">
        <h4>Basic Info</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Booking Ref</label>
            <div>{bookingCode}</div>
          </div>
          <div>
            <label>Project</label>
            <div>{projectLabel}</div>
          </div>
          <div>
            <label>Tower</label>
            <div>{towerLabel}</div>
          </div>
          <div>
            <label>Floor</label>
            <div>{floorLabel}</div>
          </div>
          <div>
            <label>Unit</label>
            <div>{unitLabel}</div>
          </div>
          <div>
            <label>Booking Date</label>
            <div>{booking.booking_date || "-"}</div>
          </div>
          <div>
            <label>Status</label>
            <div>{toSentenceCase(statusLabel)}</div>
          </div>
          {/* <div>
            <label>KYC Status</label>
            <div>{toSentenceCase(kycStatus)}</div>
          </div> */}
        </div>
      </section>

      {/* Primary Applicant */}
      <section className="ba-detail-section">
        <h4>Primary Applicant</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Full Name</label>
            <div>{booking.primary_full_name || "-"}</div>
          </div>
          <div>
            <label>Title</label>
            <div>{booking.primary_title || "-"}</div>
          </div>
          <div>
            <label>Email</label>
            <div>{booking.primary_email || "-"}</div>
          </div>
          <div>
            <label>Mobile</label>
            <div>{booking.primary_mobile_number || "-"}</div>
          </div>
          <div>
            <label>Residential Status</label>
            <div>{toSentenceCase(booking.residential_status)}</div>
          </div>
          <div>
            <label>Preferred Correspondence</label>
            <div>{toSentenceCase(booking.preferred_correspondence)}</div>
          </div>
        </div>
      </section>

      {/* Financials */}
      <section className="ba-detail-section">
        <h4>Financials</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Agreement Value</label>
            <div>{agreementValue}</div>
          </div>
          <div>
            <label>Booking Amount</label>
            <div>{bookingAmount}</div>
          </div>
          <div>
            <label>Other Charges</label>
            <div>{otherCharges}</div>
          </div>
          <div>
            <label>Total Advance</label>
            <div>{totalAdvance}</div>
          </div>
          <div>
            <label>Loan Required</label>
            <div>{booking.loan_required ? "Yes" : "No"}</div>
          </div>
          <div>
            <label>Loan Bank</label>
            <div>{booking.loan_bank_name || "-"}</div>
          </div>
        </div>
      </section>

      {/* Addresses */}
      <section className="ba-detail-section">
        <h4>Address</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Permanent Address</label>
            <div>{booking.permanent_address || "-"}</div>
          </div>
          <div>
            <label>Correspondence Address</label>
            <div>{booking.correspondence_address || "-"}</div>
          </div>
          <div>
            <label>Preferred</label>
            <div>{toSentenceCase(booking.preferred_correspondence)}</div>
          </div>
        </div>
      </section>

      {/* Applicants List */}
      {Array.isArray(booking.applicants) && booking.applicants.length > 0 && (
        <section className="ba-detail-section">
          <h4>All Applicants</h4>
          <div className="ba-applicants-list">
            {booking.applicants.map((app) => (
              <div key={app.id} className="ba-applicant-card">
                <div className="ba-applicant-header">
                  <strong>
                    {app.is_primary ? "Primary" : "Co-applicant"} –{" "}
                    {app.full_name || "-"}
                  </strong>
                </div>
                <div className="ba-detail-grid small">
                  <div>
                    <label>Email</label>
                    <div>{app.email || "-"}</div>
                  </div>
                  <div>
                    <label>Mobile</label>
                    <div>{app.mobile_number || "-"}</div>
                  </div>
                  <div>
                    <label>PAN</label>
                    <div>{app.pan_no || "-"}</div>
                  </div>
                  <div>
                    <label>Aadhar</label>
                    <div>{app.aadhar_no || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PaymentDetailView({ payment }) {
  const paymentCode = `P-${payment.id}`;
  const amountLabel = formatCurrency(payment.amount);
  const typeLabel = toSentenceCase(payment.payment_type);
  const methodLabel = toSentenceCase(payment.payment_method);
  const statusLabel = toSentenceCase(payment.status);

  const projectLabel = payment.project_name || payment.project?.name || "-";
  const leadName =
    payment.lead_name ||
    payment.lead_full_name ||
    payment.lead?.full_name ||
    [payment.lead?.first_name, payment.lead?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "-";
  const mobile =
    payment.lead_mobile ||
    payment.lead?.mobile_number ||
    payment.lead?.primary_mobile_number ||
    "-";
  const email =
    payment.lead_email ||
    payment.lead?.email ||
    payment.lead?.primary_email ||
    "-";

  return (
    <div className="ba-detail-content">
      {/* Summary */}
      <section className="ba-detail-section">
        <h4>Payment Summary</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Payment Ref</label>
            <div>{paymentCode}</div>
          </div>
          <div>
            <label>Project</label>
            <div>{projectLabel}</div>
          </div>
          <div>
            <label>Amount</label>
            <div>{amountLabel}</div>
          </div>
          <div>
            <label>Type</label>
            <div>{typeLabel}</div>
          </div>
          <div>
            <label>Method</label>
            <div>{methodLabel}</div>
          </div>
          <div>
            <label>Status</label>
            <div>{statusLabel}</div>
          </div>
          <div>
            <label>Payment Date</label>
            <div>{payment.payment_date || "-"}</div>
          </div>
        </div>
      </section>

      {/* Lead Info */}
      <section className="ba-detail-section">
        <h4>Lead Info</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Lead Name</label>
            <div>{leadName}</div>
          </div>
          <div>
            <label>Mobile</label>
            <div>{mobile}</div>
          </div>
          <div>
            <label>Email</label>
            <div>{email}</div>
          </div>
        </div>
      </section>

      {/* Method-specific details */}
      <section className="ba-detail-section">
        <h4>Channel Info</h4>
        <div className="ba-detail-grid">
          <div>
            <label>Payment Mode</label>
            <div>{payment.payment_mode || "-"}</div>
          </div>
          <div>
            <label>Transaction No</label>
            <div>{payment.transaction_no || "-"}</div>
          </div>
          <div>
            <label>Cheque Number</label>
            <div>{payment.cheque_number || "-"}</div>
          </div>
          <div>
            <label>NEFT / RTGS Ref</label>
            <div>{payment.neft_rtgs_ref_no || "-"}</div>
          </div>
          <div>
            <label>Bank Name</label>
            <div>{payment.bank_name || "-"}</div>
          </div>
          <div>
            <label>IFSC</label>
            <div>{payment.ifsc_code || "-"}</div>
          </div>
        </div>
      </section>

      {/* Notes */}
      {payment.notes && (
        <section className="ba-detail-section">
          <h4>Notes</h4>
          <div className="ba-notes-block">{payment.notes}</div>
        </section>
      )}
    </div>
  );
}
