import React, { useMemo, useState } from "react";
import SearchBar from "../common/SearchBar";

import "../pages/PostSales/Financial/DemandNotes.css";
import "../pages/Booking/MyBookings.css";
import "../pages/PreSalesCRM/Leads/LeadsList.css";
import "../pages/PostSales/Financial/PaymentReceipts.css";

const toSentenceCase = (value) => {
  if (value === null || value === undefined) return value;
  const s = String(value).trim();
  if (!s) return s;
  // Handle multi-word strings by capitalizing first letter of each word
  return s
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function StaticCommsPage({
  title,
  columns = [],
  rows = [],
  minTableWidth = 900,
  actionLabel = "Static",
  showFilterButton = true,
  showAddButton = true,
  addLabel = "Add",
  onAdd = null,
  renderFilters = null,
  onFilterApply = null,
  onFilterClear = null,
}) {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);

  const filteredRows = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const blob = (columns || [])
        .map((c) => (c?.key ? row?.[c.key] : null))
        .filter((v) => v !== undefined && v !== null)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [rows, columns, search]);

  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container payment-receipts-page">
        <div className="list-header">
          <div className="list-header-left">
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search..."
              wrapperClassName="search-box"
            />
          </div>
          <div className="list-header-right dn-header-actions">
            {showFilterButton ? (
              <button
                type="button"
                className="filter-btn demand-filter-btn"
                onClick={() => setOpenFilter(true)}
                title="Filters"
              >
                <i className="fa fa-filter" style={{ marginRight: 6 }} />
                Filters
              </button>
            ) : null}

            {showAddButton ? (
              <button
                type="button"
                className="filter-btn"
                onClick={onAdd || undefined}
                title={`Add ${title}`}
              >
                <i className="fa fa-plus" style={{ marginRight: 6 }} />
                {addLabel}
              </button>
            ) : null}

            <button
              type="button"
              className="filter-btn demand-filter-btn"
              title={`${title} (Static)`}
            >
              {actionLabel}
            </button>
          </div>
        </div>

        <div className="booking-table-wrapper pr-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table
              className="booking-table dn-subtable"
              style={{ minWidth: minTableWidth }}
            >
              <thead>
                <tr>
                  {(columns || []).map((c) => (
                    <th key={c.key || c.label}>
                      {toSentenceCase(c.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr className="dn-row">
                    <td
                      colSpan={columns.length || 1}
                      className="booking-empty-row"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => (
                    <tr key={r.id ?? idx} className="dn-row">
                      {(columns || []).map((c) => (
                        <td key={c.key || c.label} className={c.className || ""}>
                          {c.render
                            ? c.render(r)
                            : toSentenceCase(r?.[c.key] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {openFilter ? (
          <div
            className="dn-modal-overlay"
            onMouseDown={() => setOpenFilter(false)}
          >
            <div
              className="dn-modal dn-modal-wide"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-header-left dn-modal-header-left-center">
                  <div className="dn-modal-title">Filters</div>
                </div>
                <button
                  className="dn-close-btn"
                  onClick={() => setOpenFilter(false)}
                >
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                {renderFilters ? (
                  renderFilters()
                ) : (
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    No filters available.
                  </div>
                )}
              </div>

              <div className="dn-modal-footer">
                {onFilterClear ? (
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={() => onFilterClear()}
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => setOpenFilter(false)}
                >
                  Cancel
                </button>
                <button
                  className="dn-btn dn-btn-primary"
                  onClick={() => {
                    if (onFilterApply) onFilterApply();
                    setOpenFilter(false);
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

