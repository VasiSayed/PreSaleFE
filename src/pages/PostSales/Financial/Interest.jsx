import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";

import "./DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";
import "./Interest.css";

/**
 * LIST: financial/demand-notes/  (only_due_date=true)
 * APPLY: financial/demand-notes/manual-interest/
 */

const API_DN_LIST = "financial/demand-notes/";
const API_APPLY_INTEREST = "financial/demand-notes/manual-interest/";

const DEFAULT_PAGE_SIZE = 30;

const REASON_CODES = [
  { value: "MANUAL_INTEREST", label: "Manual Interest" },
  { value: "MANUAL_INTEREST_AMOUNT", label: "Manual Interest (Amount)" },
  { value: "OVERDUE_INTEREST", label: "Overdue Interest" },
  { value: "MANUAL_WAIVE_OFF", label: "Manual Waive Off" },
  { value: "SETTLEMENT", label: "Settlement" },
  { value: "DISCOUNT_ADJUSTMENT", label: "Discount / Adjustment" },
  { value: "OTHER", label: "Other (Custom)" },
];

const INR = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const money = (v) => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "-";
  return `₹ ${INR.format(n)}`;
};

const safeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const normalizePaginated = (data) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: data?.results || [],
    count: data?.count ?? (data?.results?.length || 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
};

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

function normalizePercent(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

function normalizeAmount(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

export default function Interest() {
  // ✅ project id from localStorage
  const projectId =
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("active_project_id") ||
    "";

  // -------------------------
  // List State
  // -------------------------
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // -------------------------
  // Outside: Search only
  // -------------------------
  const [search, setSearch] = useState("");

  // -------------------------
  // Modal Filters
  // -------------------------
  const [openFilter, setOpenFilter] = useState(false);

  const [status, setStatus] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [ordering, setOrdering] = useState("");

  // -------------------------
  // Selection
  // -------------------------
  const [selected, setSelected] = useState(() => new Set());

  const selectedIds = useMemo(
    () =>
      Array.from(selected)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x)),
    [selected]
  );
  const selectedCount = selectedIds.length;

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const allVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    return visibleIds.every((id) => selected.has(id));
  }, [visibleIds, selected]);

  const someVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    return visibleIds.some((id) => selected.has(id));
  }, [visibleIds, selected]);

  // -------------------------
  // Apply Interest Modal
  // -------------------------
  const [openInterest, setOpenInterest] = useState(false);

  // ✅ apply mode
  const [applyMode, setApplyMode] = useState("PERCENT"); // PERCENT | AMOUNT

  // percent inputs
  const [quickPercent, setQuickPercent] = useState("");
  const [customPercent, setCustomPercent] = useState("");

  // amount input
  const [amount, setAmount] = useState("");

  // waive toggle
  const [waiveoff, setWaiveoff] = useState(false);

  // reason_code
  const [reasonPreset, setReasonPreset] = useState("MANUAL_INTEREST");
  const [reasonCustom, setReasonCustom] = useState("");

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectivePercent = useMemo(() => {
    const base = quickPercent !== "" ? quickPercent : customPercent;
    return normalizePercent(base);
  }, [quickPercent, customPercent]);

  const effectiveAmount = useMemo(() => normalizeAmount(amount), [amount]);

  const effectiveReasonCode = useMemo(() => {
    if (reasonPreset === "OTHER") return (reasonCustom || "").trim();
    return reasonPreset;
  }, [reasonPreset, reasonCustom]);

  // -------------------------
  // Build params
  // -------------------------
  const buildParams = () => {
    const p = {};
    p.page_size = DEFAULT_PAGE_SIZE;

    if (projectId) p.project_id = projectId;
    p.only_due_date = true;

    if (search.trim()) p.search = search.trim();

    if (status) p.status = status;
    if (dueFrom) p.due_date_from = dueFrom;
    if (dueTo) p.due_date_to = dueTo;
    if (ordering) p.ordering = ordering;

    return p;
  };

  // -------------------------
  // Fetch list
  // -------------------------
  const fetchList = async (urlOrNull = null) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (!projectId) {
        setRows([]);
        setCount(0);
        setNextUrl(null);
        setPrevUrl(null);
        return;
      }

      const res = urlOrNull
        ? await axiosInstance.get(urlOrNull)
        : await axiosInstance.get(API_DN_LIST, { params: buildParams() });

      const norm = normalizePaginated(res.data);

      const list = safeList(norm);
      setRows(list);
      setCount(norm.count || list.length || 0);
      setNextUrl(norm.next || null);
      setPrevUrl(norm.previous || null);
    } catch (e) {
      console.error("Interest list error:", e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load demand notes.";
      setError(String(msg));
      setRows([]);
      setCount(0);
      setNextUrl(null);
      setPrevUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Actions
  // -------------------------
  const applyFilters = () => fetchList();

  const resetAll = () => {
    setSearch("");
    setStatus("");
    setDueFrom("");
    setDueTo("");
    setOrdering("");

    setSelected(new Set());
    fetchList();
  };

  // -------------------------
  // Selection handlers
  // -------------------------
  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) visibleIds.forEach((id) => next.add(id));
      else visibleIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  // -------------------------
  // Interest modal handlers
  // -------------------------
  const openInterestModal = () => {
    if (!selectedCount) return;

    setApplyMode("PERCENT");
    setQuickPercent("");
    setCustomPercent("");
    setAmount("");

    setWaiveoff(false);

    setReasonPreset("MANUAL_INTEREST");
    setReasonCustom("");

    setNote("");
    setOpenInterest(true);
  };

  const closeInterestModal = () => {
    if (submitting) return;
    setOpenInterest(false);
  };

  const validateBeforeSubmit = () => {
    if (!projectId) return "Project not selected.";
    if (!selectedCount) return "Select at least 1 demand note.";

    if (!effectiveReasonCode) return "Select a reason code (or enter custom).";

    if (applyMode === "PERCENT") {
      if (!effectivePercent || Number(effectivePercent) <= 0) {
        return "Enter a valid percent (>0).";
      }
    } else {
      if (!effectiveAmount || Number(effectiveAmount) <= 0) {
        return "Enter a valid amount (>0).";
      }
    }
    return "";
  };

  const submitManualInterest = async () => {
    setError("");
    setSuccessMsg("");

    const v = validateBeforeSubmit();
    if (v) {
      setError(v);
      return;
    }

    const payload = {
      demand_note_ids: selectedIds,
      waiveoff: Boolean(waiveoff),
      note: String(note || ""),
      reason_code: effectiveReasonCode,
    };

    // ✅ only one of them
    if (applyMode === "PERCENT") {
      payload.interest_percent = effectivePercent;
    } else {
      payload.amount = effectiveAmount;
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post(API_APPLY_INTEREST, payload);

      const applied = Number(res?.data?.applied_count ?? 0);
      const skipped = Number(res?.data?.skipped_count ?? 0);

      setOpenInterest(false);
      setSelected(new Set());
      setSuccessMsg(
        `${waiveoff ? "Waive-off" : "Interest"} applied. Applied: ${applied}${
          skipped ? `, Skipped: ${skipped}` : ""
        }.`
      );

      fetchList();
    } catch (e) {
      console.error("Manual interest error:", e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to apply interest.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // keep reason default in sync when toggle waiveoff
  useEffect(() => {
    setReasonPreset(waiveoff ? "MANUAL_WAIVE_OFF" : "MANUAL_INTEREST");
    setReasonCustom("");
  }, [waiveoff]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container interest-page">
        {/* ✅ ONE LINE BAR: Search (25%) + Right actions */}
        <div className="dn-filters interest-topbar">
          {/* LEFT: Search (25% width) */}
          <div className="interest-search-col">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="demand id / booking / customer / milestone / status"
              wrapperClassName="interest-searchbar"
            />
          </div>

          {/* RIGHT: Apply Interest + Reset + Filters + Apply */}
          <div className="interest-actions">
            <button
              type="button"
              className="dn-btn dn-btn-primary interest-apply-interest-btn"
              onClick={openInterestModal}
              disabled={!selectedCount || loading}
              title={!selectedCount ? "Select at least 1 DN" : "Apply interest"}
            >
              APPLY
            </button>

            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={resetAll}
              disabled={loading}
            >
              Reset
            </button>

            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={() => setOpenFilter(true)}
              title="Filters"
            >
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              Filters
            </button>

            <button
              type="button"
              className="filter-btn"
              onClick={applyFilters}
              disabled={loading}
            >
              Apply
            </button>

            <div className="interest-selected-inline">
              Selected: <b>{selectedCount}</b>
            </div>
          </div>
        </div>

        {/* Messages */}
        {loading ? <div className="dn-loading">Loading...</div> : null}
        {error ? <div className="dn-error dn-mb">{error}</div> : null}
        {successMsg ? (
          <div className="dn-help dn-mb" style={{ color: "#065f46" }}>
            {successMsg}
          </div>
        ) : null}

        {/* Table */}
        <div className="booking-table-wrapper interest-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table
              className="booking-table dn-subtable"
              style={{ minWidth: 1400 }}
            >
              <thead>
                <tr>
                  <th style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            !allVisibleSelected && someVisibleSelected;
                      }}
                      onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    />
                  </th>
                  <th>Demand ID</th>
                  <th>Customer</th>
                  <th>Booking</th>
                  <th>Milestone</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Due</th>
                  <th>Interest</th>
                  <th>PDF</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr className="dn-row">
                    <td colSpan={11} className="booking-empty-row">
                      No demand notes found.
                    </td>
                  </tr>
                ) : (
                  rows.map((dn) => {
                    const id = dn.id;
                    const pdf = absApiUrl(dn.pdf_url, axiosInstance);
                    const isPaid = String(dn.status || "")
                      .toLowerCase()
                      .includes("paid");

                    return (
                      <tr key={id} className="dn-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => toggleRow(id)}
                          />
                        </td>

                        <td className="dn-mono">{dn.demand_id || "-"}</td>
                        <td className="dn-wrap">{dn.customer_name || "-"}</td>
                        <td className="dn-mono">{dn.booking_label || "-"}</td>
                        <td className="dn-wrap">{dn.milestone || "-"}</td>
                        <td>{dn.due_date || "-"}</td>

                        <td>
                          <span
                            className={
                              isPaid
                                ? "dn-due-pill dn-due-pill-paid"
                                : "dn-due-pill"
                            }
                          >
                            {dn.status || "-"}
                          </span>
                        </td>

                        <td className="dn-money">{money(dn.total)}</td>
                        <td className="dn-money">
                          {money(dn.due_total ?? dn.total_due)}
                        </td>
                        <td className="dn-money">{money(dn.interest)}</td>

                        <td>
                          {pdf ? (
                            <button
                              type="button"
                              className="dn-btn dn-btn-light"
                              onClick={() => window.open(pdf, "_blank")}
                            >
                              Open
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination: Prev/Next only */}
          {nextUrl || prevUrl ? (
            <div className="interest-pagination">
              <button
                className="dn-btn dn-btn-light"
                disabled={!prevUrl || loading}
                onClick={() => fetchList(prevUrl)}
              >
                Prev
              </button>

              <div className="dn-help">
                Total Records: <b>{count}</b>
              </div>

              <button
                className="dn-btn dn-btn-light"
                disabled={!nextUrl || loading}
                onClick={() => fetchList(nextUrl)}
              >
                Next
              </button>
            </div>
          ) : (
            <div className="dn-help" style={{ marginTop: 10 }}>
              Total Records: <b>{count}</b>
            </div>
          )}
        </div>

        {/* ---------------- FILTER MODAL ---------------- */}
        {openFilter ? (
          <div
            className="dn-modal-overlay"
            onMouseDown={() => setOpenFilter(false)}
          >
            <div
              className="dn-modal dn-modal-sm"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">Filters</div>
                  <div className="dn-modal-sub">
                    (only_due_date=true) | Project: <b>{projectId || "-"}</b>
                  </div>
                </div>

                <button
                  className="dn-close-btn"
                  onClick={() => setOpenFilter(false)}
                >
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                <div className="dn-grid">
                  <div className="dn-field">
                    <label>Status</label>
                    <select
                      className="dn-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Paid">Paid</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Due From</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={dueFrom}
                      onChange={(e) => setDueFrom(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Due To</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={dueTo}
                      onChange={(e) => setDueTo(e.target.value)}
                    />
                  </div>

                  <div className="dn-field dn-span-3">
                    <label>Ordering</label>
                    <select
                      className="dn-select"
                      value={ordering}
                      onChange={(e) => setOrdering(e.target.value)}
                    >
                      <option value="">Default</option>
                      <option value="due_date">Due Date ASC</option>
                      <option value="-due_date">Due Date DESC</option>
                      <option value="-created_at">Created DESC</option>
                      <option value="created_at">Created ASC</option>
                      <option value="-total">Total DESC</option>
                      <option value="total">Total ASC</option>
                      <option value="-due_total">Due DESC</option>
                      <option value="due_total">Due ASC</option>
                    </select>
                    <div className="dn-help">
                      Note: ordering fields depend on backend support.
                    </div>
                  </div>
                </div>
              </div>

              <div className="dn-modal-footer">
                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => setOpenFilter(false)}
                >
                  Cancel
                </button>

                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => {
                    setStatus("");
                    setDueFrom("");
                    setDueTo("");
                    setOrdering("");
                  }}
                >
                  Reset Modal
                </button>

                <button
                  className="dn-btn dn-btn-primary"
                  onClick={() => {
                    setOpenFilter(false);
                    fetchList();
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ---------------- APPLY INTEREST MODAL ---------------- */}
        {openInterest ? (
          <div
            className="dn-modal-overlay dn-suboverlay"
            onMouseDown={closeInterestModal}
          >
            <div
              className="dn-modal dn-modal-sm"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">
                    Apply Interest / Waive Off
                  </div>
                  <div className="dn-modal-sub">
                    Selected records: <b>{selectedCount}</b>
                  </div>
                </div>

                <button className="dn-close-btn" onClick={closeInterestModal}>
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                {/* action */}
                <div className="dn-field dn-mb">
                  <label>Action</label>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <label className="dn-switch">
                      <input
                        type="checkbox"
                        checked={waiveoff}
                        onChange={(e) => setWaiveoff(e.target.checked)}
                      />
                      <span className="dn-slider" />
                    </label>
                    <div className="dn-help" style={{ marginTop: 0 }}>
                      {waiveoff ? <b>Waive Off</b> : <b>Charge</b>}
                    </div>
                  </div>
                </div>

                {/* mode */}
                <div className="dn-field dn-mb">
                  <label>Apply Mode</label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="dn-btn dn-btn-light"
                      onClick={() => setApplyMode("PERCENT")}
                      style={{
                        border:
                          applyMode === "PERCENT"
                            ? "2px solid #102a54"
                            : undefined,
                      }}
                    >
                      Percent
                    </button>
                    <button
                      type="button"
                      className="dn-btn dn-btn-light"
                      onClick={() => setApplyMode("AMOUNT")}
                      style={{
                        border:
                          applyMode === "AMOUNT"
                            ? "2px solid #102a54"
                            : undefined,
                      }}
                    >
                      Amount
                    </button>
                  </div>
                  <div className="dn-help">
                    Send only one: <b>interest_percent</b> OR <b>amount</b>
                  </div>
                </div>

                {/* percent */}
                {applyMode === "PERCENT" ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {["2", "5", "10"].map((p) => (
                        <button
                          key={p}
                          className="dn-btn dn-btn-light"
                          onClick={() => {
                            setQuickPercent(p);
                            setCustomPercent("");
                          }}
                          style={{
                            border:
                              quickPercent === p
                                ? "2px solid #102a54"
                                : undefined,
                          }}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>

                    <div className="dn-field dn-mb">
                      <label>Percent (custom)</label>
                      <input
                        className="dn-input"
                        placeholder="e.g. 2.50"
                        value={customPercent}
                        onChange={(e) => {
                          setQuickPercent("");
                          setCustomPercent(e.target.value);
                        }}
                      />
                      <div className="dn-help">
                        interest_percent: <b>{effectivePercent || "-"}</b>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="dn-field dn-mb">
                    <label>Amount (₹)</label>
                    <input
                      className="dn-input"
                      placeholder="e.g. 5000.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="dn-help">
                      amount: <b>{effectiveAmount || "-"}</b>
                    </div>
                  </div>
                )}

                {/* reason_code */}
                <div className="dn-field dn-mb">
                  <label>Reason Code</label>
                  <select
                    className="dn-select"
                    value={reasonPreset}
                    onChange={(e) => setReasonPreset(e.target.value)}
                  >
                    {REASON_CODES.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>

                  {reasonPreset === "OTHER" ? (
                    <div style={{ marginTop: 8 }}>
                      <input
                        className="dn-input"
                        placeholder="Enter custom reason_code (e.g. CUSTOMER_DISCOUNT)"
                        value={reasonCustom}
                        onChange={(e) => setReasonCustom(e.target.value)}
                      />
                      <div className="dn-help">
                        reason_code: <b>{effectiveReasonCode || "-"}</b>
                      </div>
                    </div>
                  ) : (
                    <div className="dn-help">
                      reason_code: <b>{effectiveReasonCode}</b>
                    </div>
                  )}
                </div>

                {/* note */}
                <div className="dn-field">
                  <label>Note (optional)</label>
                  <input
                    className="dn-input"
                    placeholder="manual interest / waive off note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="dn-modal-footer">
                <button
                  className="dn-btn dn-btn-light"
                  onClick={closeInterestModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  className="dn-btn dn-btn-primary"
                  onClick={submitManualInterest}
                  disabled={submitting}
                >
                  {submitting ? "APPLYING..." : "APPLY & SAVE"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
