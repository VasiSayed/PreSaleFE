// src/pages/SiteVisit/SiteVisitStatusModal.jsx

import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-hot-toast";

const SiteVisitStatusModal = ({ id, currentStatus, onClose, onUpdated }) => {
  const [status, setStatus] = useState(currentStatus || "SCHEDULED");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Reason is mandatory for status update.");
      return;
    }

    try {
      setSubmitting(true);

      // 👇 payload backend ke serializer ke hisaab se
      const payload = {
        status,
        note: reason.trim(), // 🔹 'reason' -> 'note'
        timestamp: new Date().toISOString(), // 🔹 optional, backend me supported hai
      };

      // 👇 NAYA endpoint + PATCH method
      await axiosInstance.patch(
        `/sales/site-visits/${id}/update-status/`,
        payload
      );

      toast.success("Status updated.");
      onUpdated && onUpdated();
      onClose && onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sv-modal-overlay">
      <div className="sv-modal">
        <div className="sv-modal-header">
          <h3>Update Status</h3>
          <button
            className="sv-modal-close"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sv-modal-body">
          <label className="sv-label">Status</label>
          <select
            className="sv-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            {/* <option value="NO_SHOW">No Show</option>
            <option value="RESCHEDULED">Rescheduled</option> */}

          </select>

          <label className="sv-label">
            Reason <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            className="sv-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for this status change"
            disabled={submitting}
          />

          <div className="sv-modal-footer">
            <button
              type="button"
              className="sv-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sv-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteVisitStatusModal;
