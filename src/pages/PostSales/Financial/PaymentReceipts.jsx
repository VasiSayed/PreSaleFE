import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

import "./DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";
import "./PaymentReceipts.css";

const API_SCOPE = "/client/my-scope/";
const API_DEMAND_NOTES = "/financial/demand-notes/";
const API_BOOKINGS = "/book/bookings/shifted/";
const API_REPORT = "/financial/demand-note-installments/report/";

const DEFAULT_PAGE_SIZE = 30;

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
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
      total_receipt_amount: "0.00",
    };
  }
  return {
    results: data?.results || [],
    count: data?.count ?? (data?.results?.length || 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    total_receipt_amount: data?.total_receipt_amount ?? "0.00",
  };
};

function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function PaymentReceipts() {
  // -------------------------
  // Scope (my-scope)
  // -------------------------
  const [scope, setScope] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");

  // moved to modal, but state remains here
  const [projectId, setProjectId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [floorId, setFloorId] = useState("");

  const selectedProject = useMemo(() => {
    const pid = Number(projectId);
    return scope?.projects?.find((p) => p.id === pid) || null;
  }, [scope, projectId]);

  const selectedTower = useMemo(() => {
    const tid = Number(towerId);
    return selectedProject?.towers?.find((t) => t.id === tid) || null;
  }, [selectedProject, towerId]);

  const towers = selectedProject?.towers || [];
  const floors = selectedTower?.floors || [];

  // -------------------------
  // Report List
  // -------------------------
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [totalReceiptAmount, setTotalReceiptAmount] = useState("0.00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------
  // Outside (ONLY Search + Ordering)
  // -------------------------
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");

  // -------------------------
  // Modal Filters (ALL other filters)
  // -------------------------
  const [openFilter, setOpenFilter] = useState(false);

  const [status, setStatus] = useState("");
  const [receiptFrom, setReceiptFrom] = useState("");
  const [receiptTo, setReceiptTo] = useState("");

  const [important, setImportant] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const [receiptNo, setReceiptNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [bookingId, setBookingId] = useState("");
  const [demandNoteId, setDemandNoteId] = useState("");

  // dropdown data (modal-open only)
  const [dnLoading, setDnLoading] = useState(false);
  const [demandNotes, setDemandNotes] = useState([]);

  const [bkLoading, setBkLoading] = useState(false);
  const [bookings, setBookings] = useState([]);

  // -------------------------
  // Build params
  // -------------------------
  const buildParams = () => {
    const p = {};

    // ✅ default page_size = 30 (page size UI removed)
    p.page_size = DEFAULT_PAGE_SIZE;

    // scope (now in modal)
    if (projectId) p.project_id = projectId;
    if (towerId) p.tower_id = towerId;
    if (floorId) p.floor_id = floorId;

    // outside
    if (search.trim()) p.search = search.trim();
    if (ordering) p.ordering = ordering;

    // modal
    if (status) p.status = status;
    if (receiptFrom) p.receipt_date_from = receiptFrom;
    if (receiptTo) p.receipt_date_to = receiptTo;

    if (important === "1" || important === "0") p.important = important;
    if (dueFrom) p.due_date_from = dueFrom;
    if (dueTo) p.due_date_to = dueTo;

    if (createdFrom) p.created_from = createdFrom;
    if (createdTo) p.created_to = createdTo;

    if (createdBy.trim()) p.created_by = createdBy.trim();

    if (receiptNo.trim()) p.receipt_no = receiptNo.trim();
    if (paymentMode) p.payment_mode = paymentMode;
    if (paymentStatus) p.payment_status = paymentStatus;

    if (bookingId) p.booking_id = bookingId;
    if (demandNoteId) p.demand_note_id = demandNoteId;

    return p;
  };

  // -------------------------
  // Fetchers
  // -------------------------
  const fetchScope = async () => {
    setScopeLoading(true);
    setScopeError("");
    try {
      const res = await axiosInstance.get(API_SCOPE);
      setScope(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail || e?.message || "Failed to load scope.";
      setScopeError(String(msg));
    } finally {
      setScopeLoading(false);
    }
  };

  const fetchReport = async (urlOrNull = null) => {
    setLoading(true);
    setError("");
    try {
      const res = urlOrNull
        ? await axiosInstance.get(urlOrNull)
        : await axiosInstance.get(API_REPORT, { params: buildParams() });

      const norm = normalizePaginated(res.data);
      setRows(norm.results || []);
      setCount(norm.count || 0);
      setNextUrl(norm.next || null);
      setPrevUrl(norm.previous || null);
      setTotalReceiptAmount(norm.total_receipt_amount || "0.00");
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load receipts.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // mount
  useEffect(() => {
    fetchScope();
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Modal lazy load (only when opened)
  // -------------------------
  const loadDemandNotes = async () => {
    if (!projectId) {
      setDemandNotes([]);
      return;
    }
    setDnLoading(true);
    try {
      const res = await axiosInstance.get(API_DEMAND_NOTES, {
        params: { project_id: projectId, ordering: "-created_at" },
      });
      setDemandNotes(safeList(res.data));
    } catch {
      setDemandNotes([]);
    } finally {
      setDnLoading(false);
    }
  };

  const loadBookings = async () => {
    setBkLoading(true);
    try {
      const res = await axiosInstance.get(API_BOOKINGS);
      setBookings(safeList(res.data));
    } catch {
      setBookings([]);
    } finally {
      setBkLoading(false);
    }
  };

  useEffect(() => {
    if (!openFilter) return;
    loadBookings();
    loadDemandNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFilter]);

  useEffect(() => {
    if (!openFilter) return;

    // reset dependent dropdowns
    setTowerId("");
    setFloorId("");
    setDemandNoteId("");

    loadDemandNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!openFilter) return;
    setFloorId("");
  }, [towerId, openFilter]);

  // -------------------------
  // Actions
  // -------------------------
  const applyFilters = () => fetchReport();

  const resetAll = () => {
    // outside
    setSearch("");
    setOrdering("");

    // modal scope
    setProjectId("");
    setTowerId("");
    setFloorId("");

    // modal quick
    setStatus("");
    setReceiptFrom("");
    setReceiptTo("");

    // modal extra
    setImportant("");
    setDueFrom("");
    setDueTo("");
    setCreatedFrom("");
    setCreatedTo("");
    setCreatedBy("");

    setReceiptNo("");
    setPaymentMode("");
    setPaymentStatus("");

    setBookingId("");
    setDemandNoteId("");

    fetchReport();
  };

  const closeModal = () => setOpenFilter(false);

  const demandNoteOptionLabel = (dn) => {
    if (!dn) return "-";
    const a = dn.demand_id || "-";
    const b = dn.milestone || "-";
    const c = dn.due_date || "-";
    const d = dn.status || "-";
    return `${a} • ${b} • Due: ${c} • ${d}`;
  };

  const bookingOptionLabel = (b) => {
    if (!b) return "-";
    const code =
      b.booking_label ||
      b.booking_code ||
      b.form_ref_no ||
      b.code ||
      b.id ||
      "-";
    const name =
      b.primary_full_name || b.customer_name || b.full_name || b.name || "";
    return name ? `${code} • ${name}` : String(code);
  };

  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container payment-receipts-page">
        {/* ✅ ONLY ONE place: Reset + Filters + Apply */}
        <div className="list-header">
          <div className="list-header-left" />
          <div className="list-header-right dn-header-actions">
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
          </div>
        </div>

        {/* ✅ Outside ONLY: Search + Ordering */}
        <div className="dn-filters pr-outside-bar">
          <div className="dn-filters-grid pr-outside-grid">
            <div className="dn-field">
              <label>Search</label>
              <input
                className="dn-input"
                placeholder="receipt / utr / demand id / milestone / customer / booking"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dn-field">
              <label>Ordering</label>
              <select
                className="dn-select"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
              >
                <option value="">Default (Due Date ASC)</option>
                <option value="demand_note__due_date">Due Date ASC</option>
                <option value="-demand_note__due_date">Due Date DESC</option>
                <option value="receipt_date">Receipt Date ASC</option>
                <option value="-receipt_date">Receipt Date DESC</option>
                <option value="-created_at">Created DESC</option>
                <option value="created_at">Created ASC</option>
                <option value="-receipt_amount">Amount DESC</option>
                <option value="receipt_amount">Amount ASC</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="dn-kpi-row">
          <div className="dn-kpi-card">
            <div className="dn-kpi-title">Total Receipts (Filtered)</div>
            <div className="dn-kpi-value dn-money">
              {money(totalReceiptAmount)}
            </div>
          </div>

          <div className="dn-kpi-card">
            <div className="dn-kpi-title">Total Records</div>
            <div className="dn-kpi-value">{count}</div>
          </div>
        </div>

        {loading ? <div className="dn-loading">Loading...</div> : null}
        {error ? <div className="dn-error dn-mb">{error}</div> : null}

        {/* Table */}
        <div className="booking-table-wrapper pr-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table
              className="booking-table dn-subtable"
              style={{ minWidth: 1300 }}
            >
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Receipt Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>UTR</th>

                  <th>Demand</th>
                  <th>Milestone</th>
                  <th>Due Date</th>
                  <th>DN Status</th>

                  <th>Customer</th>
                  <th>Booking</th>

                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>PDF</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr className="dn-row">
                    <td colSpan={15} className="booking-empty-row">
                      No receipts found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const dn = r?.demand_note || null;
                    const pdf = dn?.pdf_url || r?.pdf_url;

                    return (
                      <tr key={r.id} className="dn-row">
                        <td className="dn-mono">{r.receipt_no || "-"}</td>
                        <td>{r.receipt_date || "-"}</td>
                        <td className="dn-money">{money(r.receipt_amount)}</td>
                        <td>{r.payment_mode || "-"}</td>
                        <td className="dn-wrap">{r.utr || "-"}</td>

                        <td className="dn-mono">{dn?.demand_id || "-"}</td>
                        <td className="dn-wrap">{dn?.milestone || "-"}</td>
                        <td>{dn?.due_date || "-"}</td>
                        <td>{dn?.status || "-"}</td>

                        <td className="dn-wrap">{dn?.customer_name || "-"}</td>
                        <td className="dn-mono">{dn?.booking_label || "-"}</td>

                        <td className="dn-money">{money(dn?.total)}</td>
                        <td className="dn-money">
                          {money(dn?.paid_total || dn?.total_paid)}
                        </td>
                        <td className="dn-money">
                          {money(dn?.due_total || dn?.total_due)}
                        </td>

                        <td>
                          {pdf ? (
                            <button
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

          {/* Pagination */}
          <div className="pr-pagination">
            <button
              className="dn-btn dn-btn-light"
              disabled={!prevUrl || loading}
              onClick={() => fetchReport(prevUrl)}
            >
              Prev
            </button>
            <button
              className="dn-btn dn-btn-light"
              disabled={!nextUrl || loading}
              onClick={() => fetchReport(nextUrl)}
            >
              Next
            </button>
          </div>
        </div>

        {/* ✅ Filters Modal (Project/Tower/Floor + Status + Receipt From/To + all extras) */}
        {openFilter ? (
          <div className="dn-modal-overlay" onMouseDown={closeModal}>
            <div
              className="dn-modal dn-modal-wide"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">Filters</div>
                </div>
                <button className="dn-close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                <div className="dn-grid">
                  {/* ✅ scope in modal */}
                  <div className="dn-field">
                    <label>Project</label>
                    <select
                      className="dn-select"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      disabled={scopeLoading}
                    >
                      <option value="">
                        {scopeLoading ? "Loading..." : "All Projects"}
                      </option>
                      {(scope?.projects || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {toTitleCase(p.name)}
                        </option>
                      ))}
                    </select>
                    {scopeError ? (
                      <div className="dn-error">{scopeError}</div>
                    ) : null}
                  </div>

                  <div className="dn-field">
                    <label>Tower</label>
                    <select
                      className="dn-select"
                      value={towerId}
                      onChange={(e) => setTowerId(e.target.value)}
                      disabled={!projectId}
                    >
                      <option value="">
                        {!projectId ? "Select project first" : "All Towers"}
                      </option>
                      {towers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {toTitleCase(t.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Floor</label>
                    <select
                      className="dn-select"
                      value={floorId}
                      onChange={(e) => setFloorId(e.target.value)}
                      disabled={!towerId}
                    >
                      <option value="">
                        {!towerId ? "Select tower first" : "All Floors"}
                      </option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {toTitleCase(String(f.number))}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ✅ status + receipt dates in modal */}
                  <div className="dn-field">
                    <label>Status</label>
                    <select
                      className="dn-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Receipt From</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={receiptFrom}
                      onChange={(e) => setReceiptFrom(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Receipt To</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={receiptTo}
                      onChange={(e) => setReceiptTo(e.target.value)}
                    />
                  </div>

                  {/* existing extra filters */}
                  <div className="dn-field dn-span-3">
                    <label>Demand Note</label>
                    <select
                      className="dn-select"
                      value={demandNoteId}
                      onChange={(e) => setDemandNoteId(e.target.value)}
                      disabled={!projectId || dnLoading}
                    >
                      <option value="">
                        {!projectId
                          ? "Select Project first"
                          : dnLoading
                          ? "Loading demand notes..."
                          : "All Demand Notes"}
                      </option>
                      {demandNotes.map((dn) => (
                        <option key={dn.id} value={dn.id}>
                          {demandNoteOptionLabel(dn)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dn-field dn-span-3">
                    <label>Booking (Booked)</label>
                    <select
                      className="dn-select"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      disabled={bkLoading}
                    >
                      <option value="">
                        {bkLoading ? "Loading bookings..." : "All Bookings"}
                      </option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {bookingOptionLabel(b)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Important</label>
                    <select
                      className="dn-select"
                      value={important}
                      onChange={(e) => setImportant(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="1">Important Only</option>
                      <option value="0">Not Important</option>
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Created By</label>
                    <input
                      className="dn-input"
                      placeholder="me"
                      value={createdBy}
                      onChange={(e) => setCreatedBy(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Receipt No</label>
                    <input
                      className="dn-input"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Payment Mode</label>
                    <select
                      className="dn-select"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Wallet">Wallet</option>
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Payment Status</label>
                    <input
                      className="dn-input"
                      placeholder="Success / Failed / Pending"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    />
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

                  <div className="dn-field">
                    <label>Created From</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Created To</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={createdTo}
                      onChange={(e) => setCreatedTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="dn-modal-footer">
                <button className="dn-btn dn-btn-light" onClick={closeModal}>
                  Cancel
                </button>

                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => {
                    setProjectId("");
                    setTowerId("");
                    setFloorId("");

                    setStatus("");
                    setReceiptFrom("");
                    setReceiptTo("");

                    setImportant("");
                    setDueFrom("");
                    setDueTo("");
                    setCreatedFrom("");
                    setCreatedTo("");
                    setCreatedBy("");

                    setReceiptNo("");
                    setPaymentMode("");
                    setPaymentStatus("");

                    setBookingId("");
                    setDemandNoteId("");
                  }}
                >
                  Reset Modal
                </button>

                <button
                  className="dn-btn dn-btn-primary"
                  onClick={() => {
                    closeModal();
                    fetchReport();
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
