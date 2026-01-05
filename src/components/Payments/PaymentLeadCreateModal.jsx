// src/components/Payments/PaymentLeadCreateModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import { createPaymentLead } from "../../api/paymentLead";
import { showToast } from "../../utils/toast";
import "./PaymentLeadCreateModal.css";

const PAYMENT_TYPES = [
  { value: "EOI", label: "EOI" },
  { value: "BOOKING", label: "Booking" },
];

const PAYMENT_METHODS = [
  { value: "ONLINE", label: "Online" },
  { value: "POS", label: "POS" },
  { value: "DRAFT_CHEQUE", label: "Draft / Cheque" },
  { value: "NEFT_RTGS", label: "NEFT / RTGS" },
];

const ONLINE_POS_MODES = [
  { value: "UPI", label: "UPI" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "WALLET", label: "Wallet" },
];

// ------- Helper: INR formatter -------
function formatINR(value) {
  if (!value) return "";

  // allow only digits + dot
  let cleaned = value.toString().replace(/[^0-9.]/g, "");

  // ensure only one dot
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  const [intPart, decimalPart] = cleaned.split(".");
  const intDigits = intPart.replace(/\D/g, "");
  if (!intDigits) return "";

  // last 3 digits
  const lastThree = intDigits.slice(-3);
  let rest = intDigits.slice(0, -3);

  if (rest !== "") {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  }

  let result = rest ? `${rest},${lastThree}` : lastThree;

  if (decimalPart !== undefined && decimalPart !== "") {
    // max 2 decimal places
    const dec = decimalPart.replace(/\D/g, "").slice(0, 2);
    if (dec) result += `.${dec}`;
  }

  return result;
}

export default function PaymentLeadCreateModal({
  isOpen,
  onClose,
  leadId,
  bookingId = null,
  defaultPaymentType = "EOI",
  onCreated,
}) {
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    payment_type: defaultPaymentType,
    payment_method: "",
    amount: "",
    payment_mode: "",
    transaction_no: "",
    cheque_number: "",
    cheque_date: "",
    bank_name: "",
    ifsc_code: "",
    branch_name: "",
    neft_rtgs_ref_no: "",
    notes: "",
  });

  const [posSlipFile, setPosSlipFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  // Modal open hone pe reset
  useEffect(() => {
    if (isOpen) {
      setForm({
        payment_type: defaultPaymentType,
        payment_method: "",
        amount: "",
        payment_mode: "",
        transaction_no: "",
        cheque_number: "",
        cheque_date: "",
        bank_name: "",
        ifsc_code: "",
        branch_name: "",
        neft_rtgs_ref_no: "",
        notes: "",
      });
      setPosSlipFile(null);
      setChequeFile(null);
    }
  }, [isOpen, defaultPaymentType]);

  const currentMethod = useMemo(
    () => form.payment_method,
    [form.payment_method]
  );

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ------- INR Amount change handler -------
  const handleAmountChange = (e) => {
    const raw = e.target.value || "";
    const withoutCommas = raw.replace(/,/g, "");
    const formatted = formatINR(withoutCommas);
    setForm((prev) => ({
      ...prev,
      amount: formatted,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leadId) {
      showToast("error", "Lead is required for payment.");
      return;
    }

    if (!form.payment_type) {
      showToast("error", "Please select Payment Type.");
      return;
    }

    if (!form.payment_method) {
      showToast("error", "Please select Payment Method.");
      return;
    }

    const numericAmountStr = (form.amount || "").toString().replace(/,/g, "");
    if (!numericAmountStr) {
      showToast("error", "Amount is required.");
      return;
    }
    if (isNaN(Number(numericAmountStr))) {
      showToast("error", "Invalid amount.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        lead: leadId,
        payment_type: form.payment_type,
        payment_method: form.payment_method,
        amount: numericAmountStr, // backend ko plain number milega
        notes: form.notes,
      };

      // Add booking ID if provided
      if (bookingId) {
        payload.booking = bookingId;
      }

      // ONLINE / POS
      if (currentMethod === "ONLINE" || currentMethod === "POS") {
        payload.payment_mode = form.payment_mode || "";
        payload.transaction_no = form.transaction_no || "";
      }

      if (currentMethod === "POS" && posSlipFile) {
        payload.pos_slip_image = posSlipFile;
      }

      // DRAFT / CHEQUE
      if (currentMethod === "DRAFT_CHEQUE") {
        payload.cheque_number = form.cheque_number || "";
        payload.cheque_date = form.cheque_date || "";
        payload.bank_name = form.bank_name || "";
        payload.ifsc_code = form.ifsc_code || "";
        payload.branch_name = form.branch_name || "";
        if (chequeFile) {
          payload.cheque_image = chequeFile;
        }
      }

      // NEFT / RTGS
      if (currentMethod === "NEFT_RTGS") {
        payload.neft_rtgs_ref_no = form.neft_rtgs_ref_no || "";
      }

      const created = await createPaymentLead(payload);

      showToast("success", "Payment created successfully.");
      if (onCreated) onCreated(created);
      onClose();
    } catch (error) {
      console.error("Failed to create payment:", error);

      let message = "Failed to create payment.";
      const data = error?.response?.data;

      if (data) {
        if (typeof data === "string") {
          message = data;
        } else if (data.detail) {
          message = data.detail;
        } else {
          const parts = [];
          Object.entries(data).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              parts.push(`${field}: ${errors.join(", ")}`);
            } else {
              parts.push(`${field}: ${errors}`);
            }
          });
          if (parts.length) {
            message = parts.join(" | ");
          }
        }
      }

      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderMethodFields = () => {
    if (!currentMethod) return null;

    if (currentMethod === "ONLINE") {
      return (
        <>
          {/* Payment Mode */}
          <div className="form-group">
            <label>Payment Mode</label>
            <select
              name="payment_mode"
              value={form.payment_mode}
              onChange={handleChange}
            >
              <option value="">Select</option>
              {ONLINE_POS_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction No */}
          <div className="form-group">
            <label>
              Transaction No. <span className="required">*</span>
            </label>
            <input
              type="text"
              name="transaction_no"
              value={form.transaction_no}
              onChange={handleChange}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "POS") {
      return (
        <>
          {/* Payment Mode */}
          <div className="form-group">
            <label>Payment Mode</label>
            <select
              name="payment_mode"
              value={form.payment_mode}
              onChange={handleChange}
            >
              <option value="">Select</option>
              {ONLINE_POS_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction No */}
          <div className="form-group">
            <label>
              Transaction No. <span className="required">*</span>
            </label>
            <input
              type="text"
              name="transaction_no"
              value={form.transaction_no}
              onChange={handleChange}
            />
          </div>

          {/* POS Slip Image */}
          <div className="form-group">
            <label>Image Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPosSlipFile(file);
              }}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "DRAFT_CHEQUE") {
      return (
        <>
          <div className="form-group">
            <label>
              Cheque Number <span className="required">*</span>
            </label>
            <input
              type="text"
              name="cheque_number"
              value={form.cheque_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Cheque Date <span className="required">*</span>
            </label>
            <input
              type="date"
              name="cheque_date"
              value={form.cheque_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Bank Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              IFSC Code <span className="required">*</span>
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={form.ifsc_code}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Branch Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="branch_name"
              value={form.branch_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Cheque Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setChequeFile(file);
              }}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "NEFT_RTGS") {
      return (
        <div className="form-group">
          <label>
            NEFT / RTGS Ref.No <span className="required">*</span>
          </label>
          <input
            type="text"
            name="neft_rtgs_ref_no"
            value={form.neft_rtgs_ref_no}
            onChange={handleChange}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h3>Add Payment (Pre-Sale)</h3>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-modal-body">
          {/* Payment Type */}
          <div className="form-group">
            <label>
              Payment Type <span className="required">*</span>
            </label>
            <div className="pill-group">
              {PAYMENT_TYPES.map((pt) => {
                const active = form.payment_type === pt.value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    className={
                      "pill-option-btn" +
                      (active ? " pill-option-btn-active" : "")
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_type: pt.value,
                      }))
                    }
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label>
              Payment Method <span className="required">*</span>
            </label>
            <div className="pill-group pill-group-wrap">
              {PAYMENT_METHODS.map((pm) => {
                const active = form.payment_method === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    className={
                      "pill-option-btn" +
                      (active ? " pill-option-btn-active" : "")
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_method: pm.value,
                      }))
                    }
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>
              Amount <span className="required">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">₹</span>
              <input
                type="text"
                name="amount"
                value={form.amount}
                onChange={handleAmountChange}
                placeholder="0"
              />
            </div>
          </div>

          {/* Method-specific fields */}
          {renderMethodFields()}

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="payment-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
