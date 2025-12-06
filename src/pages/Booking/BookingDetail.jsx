// src/pages/Booking/BookingDetail.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { toTitleCase } from "../../utils/text";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./BookingDetail.css";


const formatAmount = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return `${value}%`;
  const trimmed = num.toFixed(2).replace(/\.00$/, "");
  return `${trimmed}%`;
};

const NA = "NA";

const niceStatus = (status) => {
  if (!status) return NA;
  return status
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const niceLabel = (text) => {
  if (!text) return NA;
  return text
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const isImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".avif")
  );
};

const formatDate = (value) => {
  if (!value) return NA;
  if (typeof value === "string" && value.includes("T")) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return value;
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    axiosInstance
      .get(`/book/bookings/${id}/`)
      .then((res) => {
        setBooking(res.data);
      })
      .catch((err) => {
        console.error("Failed to load booking detail", err);
        setError("Failed to load booking details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const header = useMemo(() => {
    if (!booking) {
      return {
        customer: "",
        project: "",
        property: "",
        code: "",
      };
    }

    const rawCustomer =
      booking.customer_name ||
      booking.primary_full_name ||
      booking.primary_name ||
      "NA";

    const customer = toTitleCase(rawCustomer);

    const projectName = booking.project || "";
    const towerName = booking.tower || "";
    const unitName = booking.unit || "";

    const projectDisplay = projectName ? toTitleCase(projectName) : "";

    // Property: Project / Tower - Unit
    const parts = [];
    if (projectDisplay) parts.push(projectDisplay);
    if (towerName) parts.push(towerName);
    if (unitName) parts.push(unitName);

    let property = "";
    if (parts.length > 0) {
      property = parts[0];
      if (parts[1]) property = `${property} / ${parts[1]}`;
      if (parts[2]) property = `${property} - ${parts[2]}`;
    }

    const code =
      booking.booking_code ||
      booking.form_ref_no ||
      (booking.id ? `#${booking.id}` : "");

    return {
      customer,
      project: projectDisplay,
      property,
      code,
    };
  }, [booking]);

  const handleDownload = async () => {
    if (!printRef.current) return;

    const element = printRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = 10;
    if (imgHeight < pageHeight - 20) {
      y = (pageHeight - imgHeight) / 2;
    }

    pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
    pdf.save(header.code ? `${header.code}.pdf` : "booking-summary.pdf");
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-card loading-card">
          <div className="booking-loading-text">Loading booking…</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <div className="booking-error-text">
            {error || "Booking not found or no data."}
          </div>
          <div className="booking-card-footer">
            <button
              type="button"
              className="booking-btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Custom payment plan ko normalize karo (string ya object dono handle)
  let customPlan = null;
  if (booking.custom_payment_plan) {
    if (typeof booking.custom_payment_plan === "string") {
      try {
        customPlan = JSON.parse(booking.custom_payment_plan);
      } catch (e) {
        console.error("Unable to parse custom_payment_plan JSON", e);
      }
    } else if (typeof booking.custom_payment_plan === "object") {
      customPlan = booking.custom_payment_plan;
    }
  }

  const amount =
    booking.amount || booking.agreement_value || booking.total_amount || 0;

  const email =
    booking.primary_email ||
    booking.primary_email_address ||
    booking.customer_email ||
    "";

  const mobile =
    booking.primary_mobile_masked ||
    booking.primary_mobile_number ||
    booking.customer_mobile ||
    "";

  const agreementDone = booking.agreement_done ? "Yes" : "No";
const bookingStatus = booking.status || NA;
const isDraft = bookingStatus === "DRAFT";
const isBooked = bookingStatus === "BOOKED";


  const areaSummary = (() => {
    const carpet = booking.carpet_sqft || booking.carpet_area_sqft;
    const balcony = booking.balcony_sqft;
    const parts = [];
    if (carpet) parts.push(`${carpet} Sq Ft (Carpet)`);
    if (balcony) parts.push(`${balcony} Sq Ft (Balcony)`);
    if (!parts.length) return "NA";
    return parts.join(" · ");
  })();

  const gstLabel =
    booking.gst_no || booking.gst_percent || booking.gst_percentage;

  const paymentPlan = booking.payment_plan || null;


const channelPartnerName =
  booking.channel_partner_name ||
  booking.channel_partner?.name ||
  (booking.channel_partner_id ? `ID #${booking.channel_partner_id}` : "NA");


  const createdByName = booking.created_by_name || "NA";
  const salesLeadName = booking.sales_lead_name || "NA";

  const brand = booking.client_brand || null;
  const reraNo =
    booking.project_rera_no || booking.rera_no || booking.project_rera || null;

  // 👇 fallback logo if brand logo missing
  const logoUrl =
    (brand && brand.logo) ||
    "https://via.placeholder.com/300x150/102a54/ffffff?text=LOGO";

  return (
    <div className="booking-page">
      <div className="booking-card" ref={printRef}>
        {/* WATERMARK - Infinite Repeating Pattern */}
        {isDraft && (
          <div className="booking-watermark-container">
            {[...Array(20)].map((_, index) => (
              <div key={index} className="booking-watermark draft-watermark">
                DRAFT
              </div>
            ))}
          </div>
        )}
        {isBooked && logoUrl && (
          <div className="booking-watermark-single">
            <img
              src={logoUrl}
              alt={brand?.company_name || "Company Logo"}
              className="booking-watermark-single-img"
            />
          </div>
        )}

        {/* HEADER */}
        <header className="booking-card-header">
          {/* LEFT: Brand + Project + Ref */}
          <div className="booking-header-left">
            <div className="booking-brand-row">
              {logoUrl && (
                <div className="booking-brand-logo-wrap">
                  <img
                    src={logoUrl}
                    alt={brand?.company_name || "Company Logo"}
                    className="booking-brand-logo"
                  />
                </div>
              )}

              <div className="booking-brand-text">
                <div className="booking-brand-name">
                  {brand?.company_name || "NA"}
                </div>
                <div className="booking-brand-sub">
                  {header.project || "PROJECT BOOKING SUMMARY"}
                </div>
                {reraNo && (
                  <div className="booking-brand-rera">RERA No.: {reraNo}</div>
                )}
              </div>
            </div>

            {header.code && (
              <div className="booking-header-code">Ref: {header.code}</div>
            )}
          </div>

          {/* RIGHT: Amount + Booking Date */}
          <div className="booking-header-right">
            <div className="booking-header-amount">
              <div className="booking-header-amount-label">Total Value</div>
              <div className="booking-header-amount-value">
                <span className="rupee-symbol">₹</span>
                <span>{formatAmount(amount)}</span>
              </div>
            </div>

            <div className="booking-header-meta">
              <div className="booking-header-meta-row">
                <span className="booking-header-label">Booking Date</span>
                <span className="booking-header-value">
                  {booking.booking_date || "NA"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="booking-card-body">
          {/* BOOKING & LEAD META */}
          <section className="booking-section">
            <div className="booking-section-title">Booking & Lead Details</div>
            <div className="booking-section-body booking-grid-3">
              <div className="booking-field">
                <span className="booking-field-label">Booking ID</span>
                <span className="booking-field-value">{booking.id}</span>
              </div>

              {booking.form_ref_no && (
                <div className="booking-field">
                  <span className="booking-field-label">
                    Form Reference No.
                  </span>
                  <span className="booking-field-value">
                    {booking.form_ref_no}
                  </span>
                </div>
              )}

              {booking.status_label && (
                <div className="booking-field">
                  <span className="booking-field-label">Status Label</span>
                  <span className="booking-field-value">
                    {booking.status_label}
                  </span>
                </div>
              )}

              <div className="booking-field">
                <span className="booking-field-label">Sales Lead</span>
                <span className="booking-field-value">
                  {toTitleCase(salesLeadName)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Created By</span>
                <span className="booking-field-value">
                  {toTitleCase(createdByName)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Channel Partner</span>
                <span className="booking-field-value">
                  {channelPartnerName}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Created At</span>
                <span className="booking-field-value">
                  {formatDate(booking.created_at)}
                </span>
              </div>
            </div>
          </section>

          {/* PERSONAL */}
          <section className="booking-section">
            <div className="booking-section-title">Personal Information</div>
            <div className="booking-section-body booking-grid-2">
              {booking.primary_title && (
                <div className="booking-field">
                  <span className="booking-field-label">Title</span>
                  <span className="booking-field-value">
                    {booking.primary_title}
                  </span>
                </div>
              )}

              <div className="booking-field">
                <span className="booking-field-label">Full Name</span>
                <span className="booking-field-value">
                  {header.customer || booking.primary_full_name || "NA"}
                </span>
              </div>

              {email && (
                <div className="booking-field">
                  <span className="booking-field-label">Email</span>
                  <span className="booking-field-value">{email}</span>
                </div>
              )}

              {mobile && (
                <div className="booking-field">
                  <span className="booking-field-label">Mobile Number</span>
                  <span className="booking-field-value">{mobile}</span>
                </div>
              )}

              {booking.email_2 && (
                <div className="booking-field">
                  <span className="booking-field-label">Secondary Email</span>
                  <span className="booking-field-value">{booking.email_2}</span>
                </div>
              )}

              {booking.phone_2 && (
                <div className="booking-field">
                  <span className="booking-field-label">Secondary Phone</span>
                  <span className="booking-field-value">{booking.phone_2}</span>
                </div>
              )}

              {booking.preferred_correspondence && (
                <div className="booking-field">
                  <span className="booking-field-label">
                    Preferred Correspondence
                  </span>
                  <span className="booking-field-value">
                    {niceLabel(booking.preferred_correspondence)}
                  </span>
                </div>
              )}

              {booking.residential_status && (
                <div className="booking-field">
                  <span className="booking-field-label">Resident Status</span>
                  <span className="booking-field-value">
                    {niceLabel(booking.residential_status)}
                  </span>
                </div>
              )}

              {booking.permanent_address && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">Permanent Address</span>
                  <span className="booking-field-value">
                    {booking.permanent_address}
                  </span>
                </div>
              )}

              {booking.correspondence_address && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">
                    Correspondence Address
                  </span>
                  <span className="booking-field-value">
                    {booking.correspondence_address}
                  </span>
                </div>
              )}

              {(booking.office_address || booking.office) && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">Office Address</span>
                  <span className="booking-field-value">
                    {booking.office_address || booking.office}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* FLAT INFO */}
          <section className="booking-section">
            <div className="booking-section-title">Flat Information</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Project</span>
                <div className="booking-field-value">
                  <div>{header.project || booking.project || "NA"}</div>
                  {reraNo && (
                    <div className="booking-field-subtle">
                      RERA No.: {reraNo}
                    </div>
                  )}
                </div>
              </div>

              {booking.tower && (
                <div className="booking-field">
                  <span className="booking-field-label">Tower</span>
                  <span className="booking-field-value">{booking.tower}</span>
                </div>
              )}

              {booking.floor && (
                <div className="booking-field">
                  <span className="booking-field-label">Floor</span>
                  <span className="booking-field-value">{booking.floor}</span>
                </div>
              )}

              {booking.unit && (
                <div className="booking-field">
                  <span className="booking-field-label">Flat Number</span>
                  <span className="booking-field-value">{booking.unit}</span>
                </div>
              )}

              {(booking.carpet_sqft || booking.carpet_area_sqft) && (
                <div className="booking-field">
                  <span className="booking-field-label">Carpet Area</span>
                  <span className="booking-field-value">
                    {booking.carpet_sqft || booking.carpet_area_sqft}
                  </span>
                </div>
              )}

              {booking.balcony_sqft && (
                <div className="booking-field">
                  <span className="booking-field-label">Balcony Area</span>
                  <span className="booking-field-value">
                    {booking.balcony_sqft}
                  </span>
                </div>
              )}

              {areaSummary !== "NA" && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">Area Details</span>
                  <span className="booking-field-value">{areaSummary}</span>
                </div>
              )}

              <div className="booking-field">
                <span className="booking-field-label">Agreement Value</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span>{" "}
                  {formatAmount(booking.agreement_value)}
                </span>
              </div>

              {booking.agreement_value_words && (
                <div className="booking-field">
                  <span className="booking-field-label">Amount In Words</span>
                  <span className="booking-field-value">
                    {booking.agreement_value_words}
                  </span>
                </div>
              )}

              <div className="booking-field">
                <span className="booking-field-label">Agreement Done</span>
                <span className="booking-field-value">{agreementDone}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Parking Required</span>
                <span className="booking-field-value">
                  {booking.parking_required ? "Yes" : "No"}
                </span>
              </div>

              {booking.parking_number && (
                <div className="booking-field">
                  <span className="booking-field-label">Parking Number</span>
                  <span className="booking-field-value">
                    {booking.parking_number}
                  </span>
                </div>
              )}

              {booking.parking_details && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">Parking Details</span>
                  <span className="booking-field-value">
                    {booking.parking_details}
                  </span>
                </div>
              )}

              {booking.gst_no && (
                <div className="booking-field">
                  <span className="booking-field-label">GST Number</span>
                  <span className="booking-field-value">{booking.gst_no}</span>
                </div>
              )}

              {gstLabel && (
                <div className="booking-field">
                  <span className="booking-field-label">GST Details</span>
                  <span className="booking-field-value">{gstLabel}</span>
                </div>
              )}
            </div>
          </section>

          {/* FINANCIAL */}
          <section className="booking-section">
            <div className="booking-section-title">Financial Details</div>
            <div className="booking-section-body booking-grid-2">
              {booking.booking_amount && (
                <div className="booking-field">
                  <span className="booking-field-label">Booking Amount</span>
                  <span className="booking-field-value">
                    <span className="rupee-symbol">₹</span>{" "}
                    {formatAmount(booking.booking_amount)}
                  </span>
                </div>
              )}

              {booking.other_charges && (
                <div className="booking-field">
                  <span className="booking-field-label">Other Charges</span>
                  <span className="booking-field-value">
                    <span className="rupee-symbol">₹</span>{" "}
                    {formatAmount(booking.other_charges)}
                  </span>
                </div>
              )}

              {booking.total_advance && (
                <div className="booking-field">
                  <span className="booking-field-label">Total Advance</span>
                  <span className="booking-field-value">
                    <span className="rupee-symbol">₹</span>{" "}
                    {formatAmount(booking.total_advance)}
                  </span>
                </div>
              )}

              {booking.total_cost && (
                <div className="booking-field">
                  <span className="booking-field-label">Total Cost</span>
                  <span className="booking-field-value">
                    <span className="rupee-symbol">₹</span>{" "}
                    {formatAmount(booking.total_cost)}
                  </span>
                </div>
              )}

              {booking.payment_plan_type && (
                <div className="booking-field">
                  <span className="booking-field-label">Payment Plan Type</span>
                  <span className="booking-field-value">
                    {niceLabel(booking.payment_plan_type)}
                  </span>
                </div>
              )}

              {customPlan && (
                <div className="booking-field booking-field-full">
                  <span className="booking-field-label">
                    Custom Payment Plan
                  </span>

                  <div className="booking-custom-plan">
                    <div className="booking-custom-plan-head">
                      <div>
                        <strong>Plan Name:&nbsp;</strong>
                        {customPlan.name || "NA"}
                      </div>
                      {customPlan.base_payment_plan_id && (
                        <div>
                          <strong>Base Plan ID:&nbsp;</strong>
                          {customPlan.base_payment_plan_id}
                        </div>
                      )}
                    </div>

                    {Array.isArray(customPlan.slabs) &&
                      customPlan.slabs.length > 0 && (
                        <table className="booking-custom-plan-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Milestone</th>
                              <th>Percentage</th>
                              {/* <th>Days</th>
                              <th>Due Date</th> */}
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customPlan.slabs.map((slab, index) => (
                              <tr key={slab.order_index || index}>
                                <td>{slab.order_index || index + 1}</td>
                                <td>{slab.name || "NA"}</td>
                                <td>{formatPercentage(slab.percentage)}</td>
                                <td>
                                    <span className="rupee-symbol">₹</span>
                                    {formatAmount(slab.amount || slab.value || slab.total || 0)}
                                  </td>
                                {/* <td>
                                  {slab.days !== null && slab.days !== undefined
                                    ? slab.days
                                    : "NA"}
                                </td>
                                <td>{slab.due_date || "NA"}</td> */}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                  </div>
                </div>
              )}

              <div className="booking-field">
                <span className="booking-field-label">Loan Required</span>
                <span className="booking-field-value">
                  {booking.loan_required ? "Yes" : "No"}
                </span>
              </div>

              {booking.loan_bank_name && (
                <div className="booking-field">
                  <span className="booking-field-label">Loan Bank Name</span>
                  <span className="booking-field-value">
                    {booking.loan_bank_name}
                  </span>
                </div>
              )}

              {booking.loan_amount_expected && (
                <div className="booking-field">
                  <span className="booking-field-label">
                    Loan Amount Expected
                  </span>
                  <span className="booking-field-value">
                    <span className="rupee-symbol">₹</span>{" "}
                    {formatAmount(booking.loan_amount_expected)}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* PAYMENT PLAN */}
          {(paymentPlan || booking.payment_plan_id) && (
            <section className="booking-section">
              <div className="booking-section-title">Payment Plan</div>
              <div className="booking-section-body booking-grid-2">
                {paymentPlan?.name && (
                  <div className="booking-field">
                    <span className="booking-field-label">Plan Name</span>
                    <span className="booking-field-value">
                      {paymentPlan.name}
                    </span>
                  </div>
                )}

                {(paymentPlan?.code || booking.payment_plan_id) && (
                  <div className="booking-field">
                    <span className="booking-field-label">Plan Code</span>
                    <span className="booking-field-value">
                      {paymentPlan?.code || booking.payment_plan_id}
                    </span>
                  </div>
                )}

                {paymentPlan?.project && (
                  <div className="booking-field">
                    <span className="booking-field-label">Plan Project</span>
                    <span className="booking-field-value">
                      {paymentPlan.project}
                    </span>
                  </div>
                )}

                {paymentPlan?.created_at && (
                  <div className="booking-field">
                    <span className="booking-field-label">Plan Created At</span>
                    <span className="booking-field-value">
                      {formatDate(paymentPlan.created_at)}
                    </span>
                  </div>
                )}

                {paymentPlan?.updated_at && (
                  <div className="booking-field">
                    <span className="booking-field-label">Plan Updated At</span>
                    <span className="booking-field-value">
                      {formatDate(paymentPlan.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* APPLICANTS */}
          {booking.applicants && booking.applicants.length > 0 && (
            <section className="booking-section">
              <div className="booking-section-title">Applicants</div>
              <div className="booking-section-body booking-applicants-grid">
                {booking.applicants.map((app) => {
                  const isPrimary = !!app.is_primary;
                  const hasPanDoc = app.pan_front || app.pan_back;
                  const hasAadharDoc = app.aadhar_front || app.aadhar_back;

                  return (
                    <div
                      className="booking-applicant-card"
                      key={app.id || app.sequence}
                    >
                      <div className="booking-applicant-header">
                        <div>
                          <div className="booking-applicant-name">
                            {toTitleCase(
                              `${app.title || ""} ${app.full_name || ""}`.trim()
                            ) || "NA"}
                          </div>
                          <div className="booking-applicant-subtitle">
                            Applicant #{app.sequence || "NA"}
                          </div>
                        </div>
                        <div className="booking-applicant-tags">
                          <span className="booking-chip applicant-chip">
                            {isPrimary ? "Primary Applicant" : "Co-Applicant"}
                          </span>
                          {app.relation && (
                            <span className="booking-chip applicant-chip">
                              {niceLabel(app.relation)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="booking-applicant-body">
                        {app.email && (
                          <div className="booking-field">
                            <span className="booking-field-label">Email</span>
                            <span className="booking-field-value">
                              {app.email}
                            </span>
                          </div>
                        )}
                        {app.mobile_number && (
                          <div className="booking-field">
                            <span className="booking-field-label">
                              Mobile Number
                            </span>
                            <span className="booking-field-value">
                              {app.mobile_number}
                            </span>
                          </div>
                        )}
                        {app.pan_no && (
                          <div className="booking-field">
                            <span className="booking-field-label">PAN</span>
                            <span className="booking-field-value">
                              {app.pan_no}
                            </span>
                          </div>
                        )}
                        {app.aadhar_no && (
                          <div className="booking-field">
                            <span className="booking-field-label">
                              Aadhar Number
                            </span>
                            <span className="booking-field-value">
                              {app.aadhar_no}
                            </span>
                          </div>
                        )}
                        {app.date_of_birth && (
                          <div className="booking-field">
                            <span className="booking-field-label">
                              Date Of Birth
                            </span>
                            <span className="booking-field-value">
                              {formatDate(app.date_of_birth)}
                            </span>
                          </div>
                        )}

                        {(hasPanDoc || hasAadharDoc) && (
                          <div className="booking-applicant-docs">
                            {hasPanDoc && (
                              <div className="booking-applicant-doc-group">
                                <span className="booking-field-label">
                                  PAN Docs
                                </span>
                                <div className="booking-doc-thumbs">
                                  {app.pan_front &&
                                    isImageUrl(app.pan_front) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.pan_front}
                                          alt="PAN Front"
                                        />
                                      </div>
                                    )}
                                  {app.pan_back && isImageUrl(app.pan_back) && (
                                    <div className="booking-doc-thumb">
                                      <img src={app.pan_back} alt="PAN Back" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasAadharDoc && (
                              <div className="booking-applicant-doc-group">
                                <span className="booking-field-label">
                                  Aadhar Docs
                                </span>
                                <div className="booking-doc-thumbs">
                                  {app.aadhar_front &&
                                    isImageUrl(app.aadhar_front) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.aadhar_front}
                                          alt="Aadhar Front"
                                        />
                                      </div>
                                    )}
                                  {app.aadhar_back &&
                                    isImageUrl(app.aadhar_back) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.aadhar_back}
                                          alt="Aadhar Back"
                                        />
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ATTACHMENTS */}
          {booking.attachments && booking.attachments.length > 0 && (
            <section className="booking-section">
              <div className="booking-section-title">Attachments</div>
              <div className="booking-section-body booking-attachments-list">
                {booking.attachments.map((att, idx) => {
                  const docNice = niceLabel(att.doc_type);
                  const typeUpper = (att.doc_type || "").toUpperCase();
                  const isPan = typeUpper === "PAN";
                  const isAadhar = typeUpper === "AADHAR";
                  const isPaymentProof = typeUpper === "PAYMENT_PROOF";
                  const showThumb = isImageUrl(att.file);

                  return (
                    <div className="booking-attachment-row" key={att.id || idx}>
                      <div className="booking-attachment-main">
                        <span className="booking-attachment-label">
                          {att.label || docNice || "NA"}
                        </span>

                        <span className="booking-attachment-type">
                          {docNice}
                        </span>

                        <div className="booking-attachment-tags">
                          {isPan && (
                            <span className="booking-chip small-chip">
                              Pan Document
                            </span>
                          )}
                          {isAadhar && (
                            <span className="booking-chip small-chip">
                              Aadhar Document
                            </span>
                          )}
                          {isPaymentProof && (
                            <span className="booking-chip small-chip">
                              Payment Proof
                            </span>
                          )}
                        </div>

                        {(isPaymentProof ||
                          att.payment_mode ||
                          att.payment_amount ||
                          att.payment_date ||
                          att.bank_name ||
                          att.payment_ref_no ||
                          att.remarks) && (
                          <div className="booking-attachment-meta">
                            {att.payment_mode && (
                              <div className="booking-attachment-meta-item">
                                <span>Mode</span>
                                <strong>{niceLabel(att.payment_mode)}</strong>
                              </div>
                            )}
                            {att.payment_ref_no && (
                              <div className="booking-attachment-meta-item">
                                <span>Ref No.</span>
                                <strong>{att.payment_ref_no}</strong>
                              </div>
                            )}
                            {att.bank_name && (
                              <div className="booking-attachment-meta-item">
                                <span>Bank</span>
                                <strong>{att.bank_name}</strong>
                              </div>
                            )}
                            {att.payment_amount && (
                              <div className="booking-attachment-meta-item">
                                <span>Amount</span>
                                <strong>
                                  <span className="rupee-symbol">₹</span>{" "}
                                  {formatAmount(att.payment_amount)}
                                </strong>
                              </div>
                            )}
                            {att.payment_date && (
                              <div className="booking-attachment-meta-item">
                                <span>Payment Date</span>
                                <strong>{formatDate(att.payment_date)}</strong>
                              </div>
                            )}
                            {att.remarks && (
                              <div className="booking-attachment-meta-item booking-attachment-meta-remarks">
                                <span>Remarks</span>
                                <strong>{att.remarks}</strong>
                              </div>
                            )}
                            {att.created_at && (
                              <div className="booking-attachment-meta-item">
                                <span>Uploaded At</span>
                                <strong>{formatDate(att.created_at)}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {showThumb && (
                        <div className="booking-attachment-preview">
                          <div className="booking-doc-thumb">
                            <img
                              src={att.file}
                              alt={att.label || att.doc_type || "Attachment"}
                            />
                          </div>
                        </div>
                      )}

                      <div className="booking-attachment-action">
                        <a
                          href={att.file}
                          target="_blank"
                          rel="noreferrer"
                          className="booking-btn-link"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(createdByName !== "NA" ||
            booking.created_by_signature ||
            booking.admin_name ||
            booking.admin_signature) && (
            <section className="booking-section booking-signature-section">
              <div className="booking-section-title">Signatures</div>
              <div className="booking-section-body booking-signature-grid">
                {/* Salesperson */}
                <div className="booking-signature-block">
                  <div className="booking-signature-label">Salesperson</div>

                  {booking.created_by_signature && (
                    <div className="booking-signature-img-wrap">
                      <img
                        src={booking.created_by_signature}
                        alt={createdByName || "Salesperson Signature"}
                        className="booking-signature-img"
                      />
                    </div>
                  )}

                  <div className="booking-signature-name">
                    {toTitleCase(createdByName)}
                  </div>
                </div>

                {/* Authorized Signatory / Admin */}
                <div className="booking-signature-block">
                  <div className="booking-signature-label">
                    Authorized Signatory
                  </div>

                  {booking.admin_signature && (
                    <div className="booking-signature-img-wrap">
                      <img
                        src={booking.admin_signature}
                        alt={booking.admin_name || "Authorized Signature"}
                        className="booking-signature-img"
                      />
                    </div>
                  )}

                  <div className="booking-signature-name">
                    {booking.admin_name || brand?.company_name || "NA"}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* BOOKING FORM PDF */}
          {booking.booking_form_pdf && (
            <section className="booking-section">
              <div className="booking-section-title">Generated Documents</div>
              <div className="booking-section-body">
                <a
                  href={booking.booking_form_pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="booking-btn-link"
                >
                  View Booking Form PDF
                </a>
              </div>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <footer className="booking-card-footer">
          <button
            type="button"
            className="booking-btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            type="button"
            className="booking-btn-primary"
            onClick={handleDownload}
          >
            Download Summary
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingDetail;