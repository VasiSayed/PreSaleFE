// RegistrationTimelineModal.jsx
import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "./RegistrationTimelineModal.css";
import { RegistrationAPI, BookingAPI } from "../../api/endpoints";

function fmtDateTime(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("en-IN");
  } catch {
    return dt;
  }
}

export default function RegistrationTimelineModal({
  open,
  onClose,
  booking,
  timeline,
  loading,
  onRefresh,
}) {
  const location = useLocation();

  // ✅ POST-SALES = VIEW ONLY MODE
  const isPostSales = useMemo(() => {
    const p = (location?.pathname || "").toLowerCase();
    return p.includes("/post-sales");
  }, [location?.pathname]);

  const readOnly = isPostSales;

  const [updatingStageId, setUpdatingStageId] = useState(null);
  const [shifting, setShifting] = useState(false);

  // Custom confirm popup (no alert/confirm/prompt)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // "stage" | "shift"
  const [confirmStage, setConfirmStage] = useState(null);
  const [confirmNote, setConfirmNote] = useState("");

  const stages = timeline?.stages || [];
  const history = timeline?.history || [];
  const current = timeline?.current_stage || null;

  const visitedStageIds = useMemo(() => {
    const s = new Set();
    for (const h of history) {
      if (h?.to_stage?.id) s.add(h.to_stage.id);
    }
    return s;
  }, [history]);

  const minOrder = useMemo(() => {
    if (!stages.length) return null;
    return Math.min(...stages.map((x) => Number(x.order || 0)));
  }, [stages]);

  const currentOrder = useMemo(() => {
    if (!current) return null;
    return Number(current.order || 0);
  }, [current]);

  // ✅ RULE (Pre-sales only):
  // - if no registration yet => allow only first stage(s) (min order)
  // - else allow ANY stage with order > currentOrder (skip forward OK)
  // - backward (<=) not allowed
  // - same stage not allowed
  const canClickStage = (s) => {
    if (readOnly) return false;

    const o = Number(s.order || 0);

    if (currentOrder === null) {
      if (minOrder === null) return false;
      return o === minOrder;
    }

    if (current && String(current.id) === String(s.id)) return false;
    return o > currentOrder;
  };

  const getStageClass = (s) => {
    const isCurrent = current && String(current.id) === String(s.id);
    if (isCurrent) return "stage stage-current"; // green
    if (visitedStageIds.has(s.id)) return "stage stage-done"; // blue
    return "stage stage-pending"; // gray
  };

  const openConfirmForStage = (s) => {
    if (!booking?.id) return;

    if (readOnly) {
      toast("Post-Sales: view only (no actions allowed).");
      return;
    }

    if (!canClickStage(s)) {
      toast.error(
        "Forward only: current se aage wale stages hi allowed (skip allowed)."
      );
      return;
    }

    setConfirmType("stage");
    setConfirmStage(s);
    setConfirmNote("");
    setConfirmOpen(true);
  };

  const openConfirmForShift = () => {
    if (!booking?.id) return;

    if (readOnly) {
      toast("Post-Sales: view only (no actions allowed).");
      return;
    }

    if (booking?.is_shifted) {
      toast("Already shifted");
      return;
    }

    setConfirmType("shift");
    setConfirmStage(null);
    setConfirmNote("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmType(null);
    setConfirmStage(null);
    setConfirmNote("");
  };

  const handleConfirmSubmit = async () => {
    if (readOnly) {
      toast("Post-Sales: view only (no actions allowed).");
      closeConfirm();
      return;
    }

    try {
      if (!booking?.id) return;

      // ✅ Stage change
      if (confirmType === "stage") {
        if (!confirmStage?.id) return;

        setUpdatingStageId(confirmStage.id);

        await RegistrationAPI.ensureStage({
          booking_id: booking.id,
          stage_id: confirmStage.id,
          note: confirmNote || "",
        });

        toast.success("Stage updated");
        closeConfirm();
        onRefresh?.();
        return;
      }

      // ✅ Shift booking
      if (confirmType === "shift") {
        setShifting(true);

        await BookingAPI.markShifted(booking.id, {
          note: confirmNote || "Shifted from registration modal",
        });

        toast.success("Booking shifted");
        closeConfirm();
        onRefresh?.();
        return;
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.stage_id ||
        err?.response?.data?.booking_id ||
        "Action failed";
      toast.error(msg);
    } finally {
      setUpdatingStageId(null);
      setShifting(false);
    }
  };

  if (!open) return null;

  const bookingLabel =
    booking?.booking_code || booking?.form_ref_no || booking?.id;

  return (
    <div className="reg-modal-overlay" onMouseDown={onClose}>
      <div className="reg-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <div>
            <div className="reg-title">Registration Timeline</div>
            <div className="reg-subtitle">
              Booking #{bookingLabel}{" "}
              {timeline?.registration_exists ? (
                <>
                  • Current: <b>{current?.name || "-"}</b>
                </>
              ) : (
                <>
                  • <b>No Registration yet</b>
                </>
              )}
              {readOnly && (
                <>
                  {" "}
                  • <b>View Only (Post-Sales)</b>
                </>
              )}
            </div>
          </div>

          <div className="reg-header-actions">
            {/* ✅ SHIFT: disable/hide action in Post-Sales */}
            {readOnly ? (
              <button
                type="button"
                className="reg-btn reg-btn-shift"
                disabled
                title="Post-Sales: view only"
              >
                {booking?.is_shifted ? "Shifted ✅" : "View Only"}
              </button>
            ) : (
              <button
                type="button"
                className="reg-btn reg-btn-shift"
                onClick={openConfirmForShift}
                disabled={shifting || !!booking?.is_shifted}
                title={booking?.is_shifted ? "Already shifted" : "Mark shifted"}
              >
                {booking?.is_shifted
                  ? "Shifted ✅"
                  : shifting
                  ? "Shifting..."
                  : "Shift"}
              </button>
            )}

            <button type="button" className="reg-btn" onClick={onClose}>
              ✖
            </button>
          </div>
        </div>

        <div className="reg-modal-body">
          {loading ? (
            <div className="reg-loading">Loading...</div>
          ) : !stages.length ? (
            <div className="reg-loading">
              No stages configured for this project.
            </div>
          ) : (
            <>
              {/* ✅ Horizontal stages */}
              <div className="stage-bar">
                {stages.map((s, idx) => {
                  const disabled = readOnly || !canClickStage(s);
                  const isUpdating = updatingStageId === s.id;

                  return (
                    <React.Fragment key={s.id}>
                      <div
                        className={
                          getStageClass(s) +
                          (disabled ? " stage-disabled" : " stage-clickable")
                        }
                        onClick={() =>
                          !disabled && !isUpdating && openConfirmForStage(s)
                        }
                        title={
                          readOnly
                            ? "Post-Sales: view only"
                            : disabled
                            ? "Not allowed (backward/same not allowed)"
                            : "Click to move to this stage"
                        }
                      >
                        <div className="stage-dot">{idx + 1}</div>
                        <div className="stage-name">{s.name}</div>
                        {isUpdating && (
                          <div className="stage-small">Updating…</div>
                        )}
                      </div>

                      {idx < stages.length - 1 && (
                        <div className="stage-line" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="reg-hint">
                {readOnly ? (
                  <>
                    Post-Sales view only: yaha se stage/shift update allowed
                    nahi hai.
                  </>
                ) : (
                  <>
                    Forward only: current stage se <b>aage</b> ke kisi bhi stage
                    pe ja sakte ho (skip allowed), lekin <b>peeche</b> nahi.
                  </>
                )}
              </div>

              {/* ✅ History */}
              <div className="reg-history">
                <div className="reg-history-title">History</div>

                {history.length === 0 ? (
                  <div className="reg-empty">No history yet.</div>
                ) : (
                  <table className="reg-history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>From</th>
                        <th>To</th>
                        <th>By</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td>{fmtDateTime(h.at)}</td>
                          <td>{h.from_stage?.name || "-"}</td>
                          <td>
                            <b>{h.to_stage?.name || "-"}</b>
                          </td>
                          <td>{h.changed_by || "-"}</td>
                          <td>{h.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ Confirm popup ONLY when not readOnly */}
      {!readOnly && confirmOpen && (
        <div className="reg-confirm-overlay" onMouseDown={closeConfirm}>
          <div
            className="reg-confirm-box"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="reg-confirm-title">
              {confirmType === "stage"
                ? `Move to: ${confirmStage?.name || ""}`
                : "Mark booking as Shifted?"}
            </div>

            <div className="reg-confirm-sub">
              {confirmType === "stage"
                ? "Forward only (skip allowed). This will create history."
                : "This will set is_shifted = true."}
            </div>

            <label className="reg-confirm-label">Note (optional)</label>
            <textarea
              className="reg-confirm-textarea"
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="Write a short note…"
              rows={3}
            />

            <div className="reg-confirm-actions">
              <button
                type="button"
                className="reg-confirm-btn reg-confirm-cancel"
                onClick={closeConfirm}
              >
                Cancel
              </button>

              <button
                type="button"
                className="reg-confirm-btn reg-confirm-ok"
                onClick={handleConfirmSubmit}
                disabled={shifting || !!updatingStageId}
              >
                {confirmType === "stage"
                  ? updatingStageId
                    ? "Updating..."
                    : "Update Stage"
                  : shifting
                  ? "Shifting..."
                  : "Shift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
