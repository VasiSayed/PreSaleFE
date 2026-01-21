// src/pages/InventoryUnitDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./InventoryUnitDetail.css";

/* ---------------- helpers ---------------- */
const safeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getStoredUser = () => {
  const keys = ["user", "USER", "auth_user", "authUser", "profile"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") return obj;
    } catch {}
  }
  return null;
};

const upper = (v) => (v == null ? "" : String(v).trim().toUpperCase());

const canManageHold = (me, hold) => {
  const role = upper(me?.role);
  if (["ADMIN", "FULL_CONTROL", "SUPER_ADMIN"].includes(role)) return true;
  if (me?.id && hold?.requested_by?.id && me.id === hold.requested_by.id)
    return true;
  return false;
};

const formatNumber = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

const formatDateTime = (v) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("en-IN");
  } catch {
    return v;
  }
};

/* ---------------- modal ---------------- */
function LeadHoldModal({ open, onClose, projectId, inventoryId, onSuccess }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadErr, setLeadErr] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  const [blockedUntil, setBlockedUntil] = useState(""); // datetime-local
  const [tokenAmount, setTokenAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setQ("");
    setPage(1);
    setLeads([]);
    setSelectedLead(null);
    setLeadErr("");
    setSubmitErr("");
    setTokenAmount("");
    setPaymentMethod("UPI");
    setPaymentRef("");
    setNotes("");

    // default blocked_until: now + 2 days
    try {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const pad = (n) => String(n).padStart(2, "0");
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setBlockedUntil(local);
    } catch {
      setBlockedUntil("");
    }
  }, [open]);

  const fetchLeads = (opts = {}) => {
    if (!projectId) {
      setLeadErr("project_id missing. Open this page with ?project_id=...");
      return;
    }

    setLeadLoading(true);
    setLeadErr("");

    api
      .get("/sales/sales-leads/", {
        params: {
          page: opts.page ?? page,
          project: projectId,
          search: opts.q ?? q,
        },
      })
      .then((res) => setLeads(safeList(res.data)))
      .catch((err) => {
        console.error("Failed to load leads", err);
        setLeadErr("Failed to load leads.");
      })
      .finally(() => setLeadLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchLeads({ q, page: 1 });
      setPage(1);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    fetchLeads({ page, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, open]);

  const submitBlock = async () => {
    setSubmitErr("");

    if (!inventoryId) return setSubmitErr("Missing inventory id.");
    if (!selectedLead?.id) return setSubmitErr("Please select a lead.");
    if (!blockedUntil)
      return setSubmitErr("Please select Block Till date/time.");

    let blockedISO = null;
    try {
      blockedISO = new Date(blockedUntil).toISOString();
    } catch {
      blockedISO = blockedUntil;
    }

    const payload = {
      inventory: inventoryId,
      lead: selectedLead.id,
      blocked_until: blockedISO,
      payment_method: paymentMethod || null,
      payment_ref: paymentRef || "",
      notes: notes || "",
    };

    if (tokenAmount !== "" && tokenAmount != null) {
      const n = Number(tokenAmount);
      if (!Number.isNaN(n)) payload.token_amount = String(n);
    }

    setSubmitting(true);
    try {
      await api.post("/client/inventory/holds/", payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Block failed", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.inventory ||
        err?.response?.data?.lead ||
        "Failed to block inventory.";
      setSubmitErr(
        typeof msg === "string" ? msg : "Failed to block inventory.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="iu-modal-overlay" onMouseDown={onClose}>
      <div className="iu-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="iu-modal-head">
          <div>
            <div className="iu-modal-title">Block Inventory (HOLD)</div>
            <div className="iu-modal-sub">
              Only HOLD blocks can be Unblocked from here.
            </div>
          </div>
          <button className="iu-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="iu-modal-body">
          {/* Lead search */}
          <div className="iu-modal-section">
            <div className="iu-field-row">
              <div className="iu-field">
                <div className="iu-label">Search Lead</div>
                <input
                  className="iu-input"
                  placeholder="Search by name / phone / email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="iu-field iu-field-sm">
                <div className="iu-label">Page</div>
                <div className="iu-pager">
                  <button
                    type="button"
                    className="iu-btn iu-btn-ghost"
                    disabled={page <= 1 || leadLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="iu-page-pill">{page}</div>
                  <button
                    type="button"
                    className="iu-btn iu-btn-ghost"
                    disabled={leadLoading || leads.length === 0}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {leadErr && <div className="iu-error">{leadErr}</div>}

            <div className="iu-lead-list">
              {leadLoading ? (
                <div className="iu-muted">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="iu-muted">No leads found.</div>
              ) : (
                leads.map((l) => {
                  const name =
                    [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                    l.name ||
                    `Lead #${l.id}`;
                  const phone = l.mobile_number || l.phone_number || "";
                  const email = l.email || "";
                  const isActive = selectedLead?.id === l.id;

                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`iu-lead-item ${isActive ? "active" : ""}`}
                      onClick={() =>
                        setSelectedLead({ id: l.id, name, phone, email })
                      }
                    >
                      <div className="iu-lead-main">
                        <div className="iu-lead-name">{name}</div>
                        <div className="iu-lead-sub">
                          {phone && <span>{phone}</span>}
                          {phone && email && <span>•</span>}
                          {email && <span>{email}</span>}
                        </div>
                      </div>
                      <div className="iu-lead-id">#{l.id}</div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedLead && (
              <div className="iu-selected">
                Selected: <b>{selectedLead.name}</b>{" "}
                {selectedLead.phone ? `(${selectedLead.phone})` : ""}
              </div>
            )}
          </div>

          {/* Hold fields */}
          <div className="iu-modal-section">
            <div className="iu-field-row">
              <div className="iu-field">
                <div className="iu-label">Block Till</div>
                <input
                  className="iu-input"
                  type="datetime-local"
                  value={blockedUntil}
                  onChange={(e) => setBlockedUntil(e.target.value)}
                />
              </div>

              <div className="iu-field">
                <div className="iu-label">Token Amount (optional)</div>
                <input
                  className="iu-input"
                  type="number"
                  placeholder="e.g. 50000"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="iu-field-row">
              <div className="iu-field">
                <div className="iu-label">Payment Method</div>
                <select
                  className="iu-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="iu-field">
                <div className="iu-label">Payment Ref (optional)</div>
                <input
                  className="iu-input"
                  placeholder="Cheque no / UTR / Txn ID"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
            </div>

            <div className="iu-field">
              <div className="iu-label">Notes (optional)</div>
              <textarea
                className="iu-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any note..."
              />
            </div>

            {submitErr && <div className="iu-error">{submitErr}</div>}
          </div>
        </div>

        <div className="iu-modal-actions">
          <button
            type="button"
            className="iu-btn iu-btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="iu-btn iu-btn-primary"
            onClick={submitBlock}
            disabled={submitting}
          >
            {submitting ? "Blocking..." : "Block (Hold)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoldInfoModal({ open, onClose, hold }) {
  if (!open || !hold) return null;

  return (
    <div className="iu-modal-overlay" onMouseDown={onClose}>
      <div
        className="iu-modal iu-modal-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="iu-modal-head">
          <div>
            <div className="iu-modal-title">Hold Details</div>
            <div className="iu-modal-sub">This unit is blocked under HOLD.</div>
          </div>
          <button className="iu-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="iu-modal-section">
          <div className="iu-kv-grid">
            <div className="iu-kv">
              <div className="iu-k">Blocked Till</div>
              <div className="iu-v">{formatDateTime(hold?.blocked_until)}</div>
            </div>

            <div className="iu-kv">
              <div className="iu-k">Blocked By</div>
              <div className="iu-v">{hold?.requested_by?.name || "-"}</div>
            </div>

            <div className="iu-kv">
              <div className="iu-k">Lead</div>
              <div className="iu-v">
                {hold?.lead_id ? `#${hold.lead_id}` : "-"}
              </div>
            </div>

            <div className="iu-kv">
              <div className="iu-k">Token</div>
              <div className="iu-v">
                {hold?.token_amount != null
                  ? `₹ ${formatNumber(hold.token_amount)}`
                  : "-"}
              </div>
            </div>

            <div className="iu-kv">
              <div className="iu-k">Payment</div>
              <div className="iu-v">
                {hold?.payment_method || "-"}
                {hold?.payment_ref ? ` • ${hold.payment_ref}` : ""}
              </div>
            </div>

            <div className="iu-kv">
              <div className="iu-k">Status</div>
              <div className="iu-v">
                <span className="iu-pill iu-pill-warn">ACTIVE HOLD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="iu-modal-actions">
          <button
            type="button"
            className="iu-btn iu-btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- main page ---------------- */
const InventoryUnitDetail = () => {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdFromQS = searchParams.get("project_id");

  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
const [holdInfoOpen, setHoldInfoOpen] = useState(false);

  const me = useMemo(() => getStoredUser(), []);

  const loadDetail = () => {
    if (!unitId) return;

    setLoading(true);
    setError("");

    api
      .get("/client/inventory/by-unit/", {
        params: { unit_id: unitId },
      })
      .then((res) => setInv(res.data))
      .catch((err) => {
        console.error("Failed to load inventory detail", err);
        setError("Failed to load inventory detail.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const handleBack = () => {
    if (projectIdFromQS) navigate(`/inventory-planning/`);
    else navigate(-1);
  };

  const effectiveProjectId =
    projectIdFromQS || inv?.project_id || inv?.project?.id;

  const hold = inv?.hold || inv?.inventory?.hold;
  const holdActive = !!hold?.active;
  const holdId = hold?.id;

  const canManage = canManageHold(me, hold);

  const doRelease = async () => {
    if (!holdId) return;
    if (!window.confirm("Unblock this HOLD?")) return;

    setActionBusy(true);
    setActionErr("");
    try {
      await api.post(`/client/inventory/holds/${holdId}/release/`, {
        reason: "Manual unblock",
      });
      loadDetail();
    } catch (err) {
      console.error("Unblock failed", err);
      setActionErr(err?.response?.data?.detail || "Failed to unblock.");
    } finally {
      setActionBusy(false);
    }
  };

  const doMarkBooked = async () => {
    if (!holdId) return;
    if (!window.confirm("Mark BOOKED from this HOLD?")) return;

    setActionBusy(true);
    setActionErr("");
    try {
      await api.post(`/client/inventory/holds/${holdId}/mark-booked/`, {
        reason: "Marked booked from unit detail",
      });
      loadDetail();
    } catch (err) {
      console.error("Mark booked failed", err);
      setActionErr(err?.response?.data?.detail || "Failed to mark booked.");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading)
    return <div className="inventory-detail-page">Loading unit details...</div>;
  if (error)
    return <div className="inventory-detail-page error-text">{error}</div>;
  if (!inv)
    return (
      <div className="inventory-detail-page">
        <div>No inventory details found.</div>
      </div>
    );

  const {
    id: inventory_id,

    project_name,
    tower_name,
    floor_number,
    unit_no,
    unit_type_name,
    configuration_name,
    facing_name,

    balcony_area_sqft,
    carpet_sqft,
    builtup_sqft,
    rera_area_sqft,
    saleable_sqft,
    other_area_sqft,
    loft_area_sqft,

    base_price_psf,
    rate_psf,
    agreement_value,
    gst_amount,
    development_infra_charge,
    stamp_duty_amount,
    registration_charges,
    legal_fee,
    total_cost,

    core_base_price_psf,
    approved_limit_price_psf,
    customer_base_price_psf,

    unit_status,
    unit_status_label,
    status,
    status_label,
    availability_status,
    availability_status_label,

    block_period_days,
    registration_number,
    description,
    photo,
    created_at,
    updated_at,
    documents = [],
    status_history = [],
  } = inv;

  const getDocDisplayName = (doc) => {
    if (doc.original_name) return doc.original_name;
    if (doc.file) {
      try {
        const withoutQuery = doc.file.split("?")[0];
        const lastPart = withoutQuery.split("/").pop();
        return lastPart || "Document";
      } catch {
        return "Document";
      }
    }
    return "Document";
  };

  // ✅ button rules:
  // - Block button ONLY when AVAILABLE and no active hold
  // - Unblock/MarkBooked ONLY when holdActive === true
  const showBlockBtn = availability_status === "AVAILABLE" && !holdActive;
  const showHoldActions = holdActive && holdId;

  // system blocked = blocked but not hold-active (booking/system/other)
  const isBlockedButNotHold = availability_status === "BLOCKED" && !holdActive;

  return (
    <div className="inventory-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button type="button" className="back-button" onClick={handleBack}>
          ⟵ Back to Inventory Plan
        </button>

        <div className="header-content">
          <div className="header-title-section">
            <h1 className="detail-title">
              Unit {unit_no || unitId} – {project_name || "Project"}
            </h1>
            <div className="detail-breadcrumb">
              {project_name && <span>{project_name}</span>}
              {tower_name && <span>› {tower_name}</span>}
              {floor_number && <span>› Floor {floor_number}</span>}
              {unit_no && <span>› Unit {unit_no}</span>}
            </div>

            {/* HOLD inline
            {holdActive && (
              <div className="iu-hold-inline">
                <span className="iu-pill iu-pill-warn">HOLD</span>
                <span>
                  Till <b>{formatDateTime(hold?.blocked_until)}</b>
                </span>
                {hold?.requested_by?.name && (
                  <span>
                    • By <b>{hold.requested_by.name}</b>
                  </span>
                )}
                {hold?.lead_id && <span> • Lead #{hold.lead_id}</span>}
              </div>
            )} */}

            {/* System Block inline */}
            {isBlockedButNotHold && (
              <div className="iu-hold-inline">
                <span className="iu-pill iu-pill-gray">BLOCKED</span>
                <span className="iu-muted">
                  This is not a HOLD block, so it can’t be unblocked from here.
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="iu-actions">
            {showBlockBtn && (
              <button
                type="button"
                className="iu-btn iu-btn-primary iu-btn-blockhold"
                onClick={() => {
                  setActionErr("");
                  setModalOpen(true);
                }}
              >
                Block (Hold)
              </button>
            )}

            {showHoldActions && (
              <>
                <button
                  type="button"
                  className="iu-btn iu-btn-hold"
                  onClick={() => setHoldInfoOpen(true)}
                >
                  On Hold
                </button>

                <button
                  type="button"
                  className="iu-btn iu-btn-ghost"
                  onClick={doMarkBooked}
                  disabled={!canManage || actionBusy}
                  title={!canManage ? "Not allowed" : "Mark BOOKED"}
                >
                  Mark Booked
                </button>

                <button
                  type="button"
                  className="iu-btn iu-btn-danger"
                  onClick={doRelease}
                  disabled={!canManage || actionBusy}
                  title={!canManage ? "Not allowed" : "Unblock HOLD"}
                >
                  Unblock
                </button>
              </>
            )}
          </div>
        </div>

        {actionErr && (
          <div className="iu-error iu-error-inline">{actionErr}</div>
        )}
      </div>

      {/* Top row */}
      <div className="detail-top-row">
        <div className="card overview-card">
          <div className="card-title">Unit Overview</div>
          <div className="card-grid-2">
            {project_name && (
              <div>
                <div className="field-label">Project</div>
                <div className="field-value">{project_name}</div>
              </div>
            )}
            {tower_name && (
              <div>
                <div className="field-label">Tower</div>
                <div className="field-value">{tower_name}</div>
              </div>
            )}
            {floor_number != null && floor_number !== "" && (
              <div>
                <div className="field-label">Floor</div>
                <div className="field-value">{floor_number}</div>
              </div>
            )}
            {(unit_no || unitId) && (
              <div>
                <div className="field-label">Unit No.</div>
                <div className="field-value">{unit_no || unitId}</div>
              </div>
            )}
            {unit_type_name && (
              <div>
                <div className="field-label">Unit Type</div>
                <div className="field-value">{unit_type_name}</div>
              </div>
            )}
            {configuration_name && (
              <div>
                <div className="field-label">Configuration</div>
                <div className="field-value">{configuration_name}</div>
              </div>
            )}
            {facing_name && (
              <div>
                <div className="field-label">Facing</div>
                <div className="field-value">{facing_name}</div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`card status-card status-card-${availability_status || "default"}`}
        >
          <div className="card-title">Status</div>

          <div className="status-primary-badge">
            <div className="status-primary-label">Availability Status</div>
            <div
              className={`status-primary-value status-${availability_status || "default"}`}
            >
              <span className="status-icon">
                {availability_status === "AVAILABLE" && "✓"}
                {availability_status === "BOOKED" && "✕"}
                {availability_status === "BLOCKED" && "⚠"}
              </span>
              <span className="status-text">
                {availability_status_label || availability_status || "Unknown"}
              </span>
            </div>
          </div>

          {/* HOLD info */}
          {holdActive && (
            <div className="iu-hold-summary">
              <div className="iu-hold-mini">
                <span className="iu-pill iu-pill-warn">HOLD</span>
                <span className="iu-muted">Till</span>
                <b>{formatDateTime(hold?.blocked_until)}</b>
                {hold?.lead_id ? (
                  <span className="iu-pill iu-pill-gray">
                    Lead #{hold.lead_id}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                className="iu-btn iu-btn-ghost iu-btn-sm"
                onClick={() => setHoldInfoOpen(true)}
              >
                View details
              </button>
            </div>
          )}


          {(status || status_label || unit_status || unit_status_label) && (
            <div className="status-secondary-group">
              {(status || status_label) && (
                <div className="status-row">
                  <span className="badge-label">Inventory</span>
                  <span className="badge badge-soft">
                    {status_label || status}
                  </span>
                </div>
              )}

              {(unit_status || unit_status_label) && (
                <div className="status-row">
                  <span className="badge-label">Unit Status</span>
                  <span className="badge badge-soft">
                    {unit_status_label || unit_status}
                  </span>
                </div>
              )}
            </div>
          )}

          {(block_period_days != null || registration_number) && (
            <div className="meta-row">
              {block_period_days != null && (
                <div>
                  <div className="field-label">Block Period (days)</div>
                  <div className="field-value">{block_period_days}</div>
                </div>
              )}
              {registration_number && (
                <div>
                  <div className="field-label">Registration No.</div>
                  <div className="field-value">{registration_number}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle row */}
      <div className="detail-middle-row">
        <div className="card">
          <div className="card-title">Areas (sq.ft)</div>
          <div className="card-grid-2">
            {balcony_area_sqft != null && (
              <div>
                <div className="field-label">Balcony</div>
                <div className="field-value">
                  {formatNumber(balcony_area_sqft)}
                </div>
              </div>
            )}
            {carpet_sqft != null && (
              <div>
                <div className="field-label">Carpet</div>
                <div className="field-value">{formatNumber(carpet_sqft)}</div>
              </div>
            )}
            {builtup_sqft != null && (
              <div>
                <div className="field-label">Built-up</div>
                <div className="field-value">{formatNumber(builtup_sqft)}</div>
              </div>
            )}
            {rera_area_sqft != null && (
              <div>
                <div className="field-label">RERA Area</div>
                <div className="field-value">
                  {formatNumber(rera_area_sqft)}
                </div>
              </div>
            )}
            {saleable_sqft != null && (
              <div>
                <div className="field-label">Saleable</div>
                <div className="field-value">{formatNumber(saleable_sqft)}</div>
              </div>
            )}
            {other_area_sqft != null && (
              <div>
                <div className="field-label">Other Area</div>
                <div className="field-value">
                  {formatNumber(other_area_sqft)}
                </div>
              </div>
            )}
            {loft_area_sqft != null && (
              <div>
                <div className="field-label">Loft Area</div>
                <div className="field-value">
                  {formatNumber(loft_area_sqft)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Pricing</div>
          <div className="card-grid-2">
            {base_price_psf != null && (
              <div>
                <div className="field-label">Base Price / sq.ft</div>
                <div className="field-value">
                  ₹ {formatNumber(base_price_psf)}
                </div>
              </div>
            )}
            {rate_psf != null && (
              <div>
                <div className="field-label">Rate / sq.ft</div>
                <div className="field-value">₹ {formatNumber(rate_psf)}</div>
              </div>
            )}
            {core_base_price_psf != null && (
              <div>
                <div className="field-label">Core Base Price (psf)</div>
                <div className="field-value">
                  ₹ {formatNumber(core_base_price_psf)}
                </div>
              </div>
            )}
            {approved_limit_price_psf != null && (
              <div>
                <div className="field-label">Approved Limit Price (psf)</div>
                <div className="field-value">
                  ₹ {formatNumber(approved_limit_price_psf)}
                </div>
              </div>
            )}
            {customer_base_price_psf != null && (
              <div>
                <div className="field-label">Customer Base Price (psf)</div>
                <div className="field-value">
                  ₹ {formatNumber(customer_base_price_psf)}
                </div>
              </div>
            )}
            {agreement_value != null && (
              <div>
                <div className="field-label">Agreement Value</div>
                <div className="field-value">
                  ₹ {formatNumber(agreement_value)}
                </div>
              </div>
            )}
            {gst_amount != null && (
              <div>
                <div className="field-label">GST Amount</div>
                <div className="field-value">₹ {formatNumber(gst_amount)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Charges & Total</div>
          <div className="card-grid-2">
            {development_infra_charge != null && (
              <div>
                <div className="field-label">Dev / Infra Charge</div>
                <div className="field-value">
                  ₹ {formatNumber(development_infra_charge)}
                </div>
              </div>
            )}
            {stamp_duty_amount != null && (
              <div>
                <div className="field-label">Stamp Duty</div>
                <div className="field-value">
                  ₹ {formatNumber(stamp_duty_amount)}
                </div>
              </div>
            )}
            {registration_charges != null && (
              <div>
                <div className="field-label">Registration Charges</div>
                <div className="field-value">
                  ₹ {formatNumber(registration_charges)}
                </div>
              </div>
            )}
            {legal_fee != null && (
              <div>
                <div className="field-label">Legal Fee</div>
                <div className="field-value">₹ {formatNumber(legal_fee)}</div>
              </div>
            )}
          </div>

          {total_cost != null && (
            <div className="total-row">
              <div className="field-label">Total Cost</div>
              <div className="total-value">₹ {formatNumber(total_cost)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Status History (Admin-only from backend; others get []) */}
      {Array.isArray(status_history) && status_history.length > 0 && (
        <div className="card">
          <div className="card-title">Status History</div>
          <div className="iu-history">
            {status_history.map((h) => (
              <div className="iu-history-item" key={h.id}>
                <div className="iu-history-left">
                  <div className="iu-history-time">
                    {formatDateTime(h.created_at)}
                  </div>
                  <div className="iu-history-by">
                    {h?.changed_by?.name ? `By ${h.changed_by.name}` : "—"}
                    {h?.changed_by?.role ? ` (${h.changed_by.role})` : ""}
                  </div>
                </div>
                <div className="iu-history-mid">
                  <span className="iu-chip">{h.old_availability}</span>
                  <span className="iu-arrow">→</span>
                  <span className="iu-chip iu-chip-strong">
                    {h.new_availability}
                  </span>
                </div>
                <div className="iu-history-reason">{h.reason || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description + meta + photo */}
      {(description || created_at || updated_at || photo) && (
        <div className="detail-bottom-row">
          {description && (
            <div className="card">
              <div className="card-title">Description</div>
              <div className="field-value description-text">{description}</div>
            </div>
          )}

          {(created_at || updated_at) && (
            <div className="card">
              <div className="card-title">Meta</div>
              <div className="card-grid-2">
                {created_at && (
                  <div>
                    <div className="field-label">Created At</div>
                    <div className="field-value">
                      {formatDateTime(created_at)}
                    </div>
                  </div>
                )}
                {updated_at && (
                  <div>
                    <div className="field-label">Updated At</div>
                    <div className="field-value">
                      {formatDateTime(updated_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {photo && (
            <div className="card">
              <div className="card-title">Photo</div>
              <div className="photo-wrapper">
                <img src={photo} alt="Unit" className="unit-photo" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      <div className="card documents-card">
        <div className="card-title">Documents</div>
        {documents.length === 0 ? (
          <div className="field-value">No documents uploaded.</div>
        ) : (
          <div className="docs-list">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file}
                target="_blank"
                rel="noreferrer"
                className="doc-item"
              >
                <div className="doc-icon-circle">📄</div>
                <div className="doc-text">
                  <div className="doc-type">
                    {doc.doc_type_label || "Document"}
                  </div>
                  <div className="doc-file">{getDocDisplayName(doc)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

<HoldInfoModal
  open={holdInfoOpen}
  onClose={() => setHoldInfoOpen(false)}
  hold={hold}
/>


      {/* Block Modal */}
      <LeadHoldModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={effectiveProjectId}
        inventoryId={inventory_id}
        onSuccess={loadDetail}
      />
    </div>
  );
};

export default InventoryUnitDetail;
