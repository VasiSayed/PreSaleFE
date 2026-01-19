import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";
import PaymentLeadCreateModal from "../../../components/Payments/PaymentLeadCreateModal";
import RegistrationTimelineModal from "../../../components/Registration/RegistrationTimelineModal";
import { RegistrationAPI } from "../../../api/endpoints";

import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";

// Helper: Convert text to title case
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ✅ small helper: copy to clipboard
async function copyText(text) {
  try {
    if (!text) return;
    await navigator.clipboard.writeText(String(text));
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

const RegisteredBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // upload related
  const fileInputRef = useRef(null);
  const [uploadBookingId, setUploadBookingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  // payment related
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingLeadId, setSelectedBookingLeadId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // registration modal
  const [regOpen, setRegOpen] = useState(false);
  const [regBooking, setRegBooking] = useState(null);
  const [regTimeline, setRegTimeline] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  // ✅ CRM credentials modal
  const [crmOpen, setCrmOpen] = useState(false);
  const [crmInfo, setCrmInfo] = useState(null); // { bookingId, customerId, username, email, tempPassword, note }
  const [crmResetLoading, setCrmResetLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ ONLY SHIFTED BOOKINGS
  useEffect(() => {
    setLoading(true);
    setError("");

    axiosInstance
      .get("/book/bookings/shifted/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setBookings(data || []);
      })
      .catch((err) => {
        console.error("Failed to load shifted bookings", err);
        setError("Failed to load shifted bookings. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddClick = () => {
    navigate("/booking/form");
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        // no API search needed
      }, 300),
    []
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("en-IN");
  };

  const getStatusLabel = (status) => {
    if (!status) return "-";
    return status
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status) => {
    if (!status) return {};
    const statusLower = status.toString().toLowerCase().replace(/_/g, "");

    if (statusLower === "booked" || statusLower === "confirmed") {
      return { backgroundColor: "#dcfce7", color: "#166534" };
    } else if (statusLower === "draft") {
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    } else if (
      statusLower === "cancelled" ||
      statusLower === "canceled" ||
      statusLower === "rejected"
    ) {
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    }

    return { backgroundColor: "#f3f4f6", color: "#374151" };
  };

  // ✅ Registration pill style
  const getRegPill = (isDone) => {
    if (isDone) return { backgroundColor: "#dcfce7", color: "#166534" }; // green
    return { backgroundColor: "#fee2e2", color: "#991b1b" }; // red
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) => {
      const regText =
        b.is_registration_done === true
          ? "done"
          : b.is_registration_done === false
          ? "not done"
          : "";

      const text = [
        b.booking_code,
        b.form_ref_no,
        b.customer_name,
        b.primary_full_name,
        b.project_name,
        b.project,
        b.unit_no,
        b.unit,
        b.tower_name,
        b.status,
        regText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [bookings, search]);

  const rangeLabel =
    bookings.length === 0
      ? "0 of 0"
      : `1-${filtered.length} of ${bookings.length}`;

  // ✅ Open CRM modal from API payload
  const openCrmModal = (bookingId, payload) => {
    const p = payload || {};
    setCrmInfo({
      bookingId,
      customerId: p.customer_id ?? null,
      username: p.customer_username ?? "",
      email: p.customer_email ?? "",
      tempPassword: p.customer_temp_password ?? null,
      note: p.note ?? "",
    });
    setCrmOpen(true);
  };

  // ✅ Enable CRM -> then show popup modal
  const handleEnableCRM = async (booking) => {
    const bookingId = booking?.id;
    if (!bookingId) return;

    try {
      toast.loading("Enabling CRM...", { id: `crm-${bookingId}` });

      const res = await axiosInstance.post(
        `/book/bookings/${bookingId}/create-customer/`
      );
      const payload = res?.data || {};
      const customerId = payload?.customer_id ?? null;

      // ✅ update list row locally (no need refetch)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, lead_customer_linked: true, lead_customer_id: customerId }
            : b
        )
      );

      toast.success("CRM Enabled", { id: `crm-${bookingId}` });

      // ✅ show modal with credentials
      openCrmModal(bookingId, payload);
    } catch (err) {
      console.error("Enable CRM failed", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to enable CRM";
      toast.error(msg, { id: `crm-${bookingId}` });
    }
  };

  // ✅ Reset password from modal
  const handleResetCustomerPassword = async () => {
    const bookingId = crmInfo?.bookingId;
    if (!bookingId) return;

    try {
      setCrmResetLoading(true);
      toast.loading("Resetting password...", { id: `crmreset-${bookingId}` });

      const res = await axiosInstance.post(
        `/book/bookings/${bookingId}/reset-customer-password/`
      );
      const payload = res?.data || {};

      setCrmInfo((prev) => ({
        ...(prev || {}),
        tempPassword: payload.customer_temp_password ?? null,
        username: payload.customer_username ?? prev?.username ?? "",
        email: payload.customer_email ?? prev?.email ?? "",
        note: payload.note ?? prev?.note ?? "",
      }));

      toast.success("Password reset done", { id: `crmreset-${bookingId}` });
    } catch (err) {
      console.error("Reset password failed", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to reset password";
      toast.error(msg);
    } finally {
      setCrmResetLoading(false);
    }
  };

  const closeCrmModal = () => {
    setCrmOpen(false);
    setCrmInfo(null);
  };

  // upload icon click
  const handleUploadClick = (bookingId) => {
    setUploadBookingId(bookingId);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // payment click
  const handlePaymentClick = (booking) => {
    const leadId =
      booking.sales_id ||
      booking.sales_lead ||
      booking.lead_id ||
      booking.lead ||
      null;

    if (leadId) {
      setSelectedBookingLeadId(leadId);
      setSelectedBookingId(booking.id);
      setPaymentModalOpen(true);
    }
  };

  // file selected
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !uploadBookingId) return;

    setUploadingId(uploadBookingId);

    const formData = new FormData();
    formData.append("signed_booking_file", file);

    try {
      const res = await axiosInstance.post(
        `/book/bookings/${uploadBookingId}/upload-signed-form/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data;
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
    } catch (err) {
      console.error("Failed to upload signed form", err);
      setError("Failed to upload signed form. Please try again.");
    } finally {
      setUploadingId(null);
      setUploadBookingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Registration timeline modal handlers
  const fetchRegTimeline = async (bookingObj) => {
    try {
      setRegLoading(true);
      const data = await RegistrationAPI.timelineByBooking(bookingObj.id);
      setRegTimeline(data);
    } catch (err) {
      console.error("Failed to load registration timeline", err);
      toast.error("Failed to load registration timeline");
      setRegTimeline(null);
    } finally {
      setRegLoading(false);
    }
  };

  const openRegModal = (bookingObj) => {
    setRegBooking(bookingObj);
    setRegOpen(true);
    fetchRegTimeline(bookingObj);
  };

  const closeRegModal = () => {
    setRegOpen(false);
    setRegBooking(null);
    setRegTimeline(null);
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        {/* hidden file input for uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="list-header">
          <div className="list-header-left">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by customer, project, unit, status..."
              wrapperClassName="search-box"
            />
          </div>

          <div className="list-header-right">
            <button
              type="button"
              className="filter-btn"
              onClick={handleAddClick}
            >
              <i className="fa fa-plus" style={{ marginRight: "6px" }} />
              New Booking
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="booking-list-body">
            <div className="booking-list-message">Loading bookings...</div>
          </div>
        ) : error ? (
          <div className="booking-list-body">
            <div className="booking-list-message booking-error">{error}</div>
          </div>
        ) : (
          <div className="booking-list-body">
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Action</th>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Project</th>
                    <th>Unit</th>
                    <th>Advance Amount</th>
                    <th>Signed Form</th>
                    <th>CRM</th>
                    <th>Registration</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="booking-empty-row">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const bookingId = b.booking_code || b.form_ref_no || b.id;

                      const unitLabel =
                        b.unit_no ||
                        (b.unit && b.unit.unit_no) ||
                        (b.unit && b.unit.name) ||
                        b.unit ||
                        "-";

                      const isUploading = uploadingId === b.id;
                      const regDone = !!b.is_registration_done;

                      return (
                        <tr key={b.id}>
                          <td className="booking-actions-cell">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Edit booking"
                              onClick={() =>
                                navigate(`/booking/form?booking_id=${b.id}`)
                              }
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="View details"
                              onClick={() => navigate(`/booking/${b.id}`)}
                            >
                              👁
                            </button>

                            {/* ✅ Registration modal */}
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Registration stages & history"
                              onClick={() => openRegModal(b)}
                            >
                              🧭
                            </button>

                            {/* ✅ Payment button */}
                            {(b.sales_id ||
                              b.sales_lead ||
                              b.lead_id ||
                              b.lead) && (
                              <button
                                type="button"
                                className="booking-icon-btn"
                                title="Make payment"
                                onClick={() => handlePaymentClick(b)}
                              >
                                💳
                              </button>
                            )}
                          </td>

                          <td>{bookingId}</td>

                          <td>
                            {b.primary_full_name
                              ? toTitleCase(b.primary_full_name)
                              : "-"}
                          </td>

                          <td>
                            {b.project_name || b.project
                              ? toTitleCase(b.project_name || b.project)
                              : "-"}
                          </td>

                          <td>
                            {unitLabel !== "-" ? toTitleCase(unitLabel) : "-"}
                          </td>

                          <td className="booking-amount-cell">
                            {b.total_advance != null &&
                            b.total_advance !== "" ? (
                              <>
                                <span className="rupee-symbol">₹</span>{" "}
                                {formatAmount(b.total_advance)}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Signed form */}
                          <td className="booking-actions-cell">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title={
                                isUploading
                                  ? "Uploading..."
                                  : "Upload signed booking form"
                              }
                              onClick={() => handleUploadClick(b.id)}
                              disabled={isUploading}
                            >
                              {isUploading ? "⏳" : "📤"}
                            </button>

                            {b.signed_booking_file_url && (
                              <a
                                href={b.signed_booking_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="booking-icon-btn booking-link-btn"
                                title="View signed form"
                              >
                                📄
                              </a>
                            )}
                          </td>

                          {/* ✅ CRM column */}
                          <td>
                            {b.lead_customer_linked ? (
                              <span
                                className="booking-status-pill"
                                style={{
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                }}
                                title={`Customer ID: ${
                                  b.lead_customer_id || "-"
                                }`}
                              >
                                CRM Enabled
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="filter-btn"
                                style={{ padding: "6px 10px" }}
                                onClick={() => handleEnableCRM(b)}
                                title="Create/Link customer for this booking lead"
                              >
                                Enable CRM
                              </button>
                            )}
                          </td>

                          {/* ✅ Registration Done / Not Done */}
                          <td>
                            <span
                              className="booking-status-pill"
                              style={getRegPill(regDone)}
                              title="is_registration_done"
                            >
                              {regDone ? "Done" : "Not Done"}
                            </span>
                          </td>

                          <td>
                            <span
                              className="booking-status-pill"
                              style={getStatusColor(b.status)}
                            >
                              {getStatusLabel(b.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Info */}
        <div className="pagination-info">{rangeLabel}</div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedBookingLeadId && (
        <PaymentLeadCreateModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBookingLeadId(null);
            setSelectedBookingId(null);
          }}
          leadId={parseInt(selectedBookingLeadId, 10)}
          bookingId={selectedBookingId ? parseInt(selectedBookingId, 10) : null}
          defaultPaymentType="BOOKING"
          onCreated={() => {}}
        />
      )}

      {/* Registration Timeline Modal */}
      <RegistrationTimelineModal
        open={regOpen}
        onClose={closeRegModal}
        booking={regBooking}
        timeline={regTimeline}
        loading={regLoading}
        onRefresh={() => regBooking && fetchRegTimeline(regBooking)}
      />

      {/* ✅ CRM Credentials Modal */}
      {crmOpen && crmInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={closeCrmModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 18px 50px rgba(0,0,0,0.20)",
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Linked CRM</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  Booking #{crmInfo.bookingId} • Customer #
                  {crmInfo.customerId || "-"}
                </div>
              </div>
              <button
                type="button"
                className="booking-icon-btn"
                title="Close"
                onClick={closeCrmModal}
              >
                ✖
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {/* Username */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>Username</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {crmInfo.username || "-"}
                  </div>
                  <button
                    type="button"
                    className="filter-btn"
                    style={{ padding: "6px 10px" }}
                    onClick={() => copyText(crmInfo.username)}
                    disabled={!crmInfo.username}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Email */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>Email</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{crmInfo.email || "-"}</div>
                  <button
                    type="button"
                    className="filter-btn"
                    style={{ padding: "6px 10px" }}
                    onClick={() => copyText(crmInfo.email)}
                    disabled={!crmInfo.email}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Password / Reset */}
              {crmInfo.tempPassword ? (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Temp Password (one-time)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {crmInfo.tempPassword}
                    </div>
                    <button
                      type="button"
                      className="filter-btn"
                      style={{ padding: "6px 10px" }}
                      onClick={() => copyText(crmInfo.tempPassword)}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#b45309" }}>
                    Ask customer to change password after login.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Password not available (existing customer)
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={handleResetCustomerPassword}
                      disabled={crmResetLoading}
                      style={{ padding: "8px 12px" }}
                    >
                      {crmResetLoading ? "Resetting..." : "Reset Password"}
                    </button>

                    <button
                      type="button"
                      className="filter-btn"
                      onClick={closeCrmModal}
                      style={{ padding: "8px 12px", background: "#f3f4f6" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {crmInfo.note ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {crmInfo.note}
                </div>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                className="filter-btn"
                style={{ padding: "8px 12px", background: "#f3f4f6" }}
                onClick={closeCrmModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredBookings;
