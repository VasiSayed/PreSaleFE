import React, { useMemo, useState } from "react";
import StaticCommsPage from "../../../components/StaticCommsPage";

export default function CommsSurveysPage() {
  const [status, setStatus] = useState("");
  const [anonymous, setAnonymous] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const columns = [
    { key: "title", label: "Title", className: "dn-wrap" },
    { key: "is_anonymous", label: "Is Anonymous" },
    { key: "created_at", label: "Created On" },
    { key: "status", label: "Status" },
  ];

  const rows = [
    {
      title: "Annual Facilities Feedback",
      is_anonymous: "Yes",
      created_at: "2026-01-05",
      status: "Open",
    },
    {
      title: "Security Services Review",
      is_anonymous: "No",
      created_at: "2026-01-20",
      status: "Closed",
    },
  ];

  const filteredRows = useMemo(() => {
    const from = createdFrom ? new Date(createdFrom) : null;
    const to = createdTo ? new Date(createdTo) : null;

    return rows.filter((r) => {
      if (status && String(r.status) !== status) return false;
      if (anonymous && String(r.is_anonymous) !== anonymous) return false;

      if (from || to) {
        const d = r.created_at ? new Date(r.created_at) : null;
        if (!d || Number.isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }

      return true;
    });
  }, [rows, status, anonymous, createdFrom, createdTo]);

  return (
    <StaticCommsPage
      title="Surveys"
      columns={columns}
      rows={filteredRows}
      renderFilters={() => (
        <div className="dn-grid">
          <div className="dn-field">
            <label>Status</label>
            <select
              className="dn-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="dn-field">
            <label>Anonymous</label>
            <select
              className="dn-select"
              value={anonymous}
              onChange={(e) => setAnonymous(e.target.value)}
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
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
      )}
      onFilterClear={() => {
        setStatus("");
        setAnonymous("");
        setCreatedFrom("");
        setCreatedTo("");
      }}
    />
  );
}
