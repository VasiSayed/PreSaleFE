import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";

import "../Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";

const API_NOTICES = "/communications/notices/";

function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// dd-mm-yyyy (works for date-only + datetime)
function fmtDMY(v) {
  if (!v) return "-";
  const s = String(v);

  // date-only: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}-${m}-${y}`;
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear());
  return `${dd}-${mm}-${yy}`;
}

function safeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function toIsoStart(dateStr) {
  if (!dateStr) return null;
  // backend accepts datetime usually
  return `${dateStr}T00:00:00Z`;
}

export function AdminNotices() {
  const ctx = useOutletContext() || {};
  const { projectId, towerId, floorId, unitId } = ctx;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // create modal
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [publishDate, setPublishDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [saving, setSaving] = useState(false);

  const params = useMemo(() => {
    const p = {};
    if (projectId) p.project_id = projectId;
    if (towerId) p.tower_id = towerId;
    if (floorId) p.floor_id = floorId;
    if (unitId) p.unit_id = unitId;
    p.ordering = "-created_at";
    return p;
  }, [projectId, towerId, floorId, unitId]);

  const fetchNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(API_NOTICES, { params });
      setRows(safeList(res.data));
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load notices.";
      setError(String(msg));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const buildAudience = () => {
    // ✅ simple targeting by selected filters
    if (unitId) return { unit_ids: [Number(unitId)] };
    if (floorId) return { floor_ids: [Number(floorId)] };
    if (towerId) return { tower_ids: [Number(towerId)] };
    return { all: true };
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setPriority("NORMAL");
    setPublishDate("");
    setExpiresDate("");
    setRequiresAck(false);
  };

  const createNotice = async () => {
    if (!projectId) {
      toast.error("Please select Project first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!body.trim()) {
      toast.error("Body is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project: Number(projectId),
        title: toTitleCase(title.trim()),
        body: body.trim(),
        priority,
        publish_at: publishDate ? toIsoStart(publishDate) : null,
        expires_at: expiresDate ? toIsoStart(expiresDate) : null,
        requires_ack: Boolean(requiresAck),
        audience: buildAudience(),
      };

      await axiosInstance.post(API_NOTICES, payload);
      toast.success("Notice created");
      setOpen(false);
      resetForm();
      fetchNotices();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to create notice.";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container">
        {/* Header actions (DemandNotes style) */}
        <div className="list-header">
          <div className="list-header-left">
            <div style={{ fontWeight: 800, fontSize: 18 }}>Notices</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Audience: Project {projectId || "All"} | Tower {towerId || "All"}{" "}
              | Floor {floorId || "All"} | Unit {unitId || "All"}
            </div>
          </div>

          <div className="list-header-right dn-header-actions">
            <button
              className="filter-btn demand-filter-btn"
              onClick={fetchNotices}
              disabled={loading}
            >
              Refresh
            </button>

            <button
              className="filter-btn"
              onClick={() => setOpen(true)}
              disabled={!projectId}
            >
              + Add Notice
            </button>
          </div>
        </div>

        {loading ? <div className="dn-loading">Loading...</div> : null}
        {error ? <div className="dn-error dn-mb">{error}</div> : null}

        <div className="booking-table-wrapper">
          <div style={{ overflowX: "auto" }}>
            <table
              className="booking-table dn-subtable"
              style={{ minWidth: 1100 }}
            >
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Publish</th>
                  <th>Expires</th>
                  <th>Ack Required</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr className="dn-row">
                    <td colSpan={6} className="booking-empty-row">
                      No notices found.
                    </td>
                  </tr>
                ) : (
                  rows.map((n) => (
                    <tr key={n.id} className="dn-row">
                      <td className="dn-wrap">{toTitleCase(n.title || "-")}</td>
                      <td>{toTitleCase(String(n.priority || "-"))}</td>
                      <td>{fmtDMY(n.publish_at || n.publish_date)}</td>
                      <td>{fmtDMY(n.expires_at || n.expiry_date)}</td>
                      <td>{n.requires_ack ? "Yes" : "No"}</td>
                      <td>{fmtDMY(n.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {open ? (
          <div className="dn-modal-overlay" onMouseDown={() => setOpen(false)}>
            <div
              className="dn-modal dn-modal-wide"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="dn-modal-header">
                <div className="dn-modal-title">Add Notice</div>
                <button className="dn-close-btn" onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>

              <div className="dn-modal-body">
                <div className="dn-grid">
                  <div className="dn-field dn-span-3">
                    <label>Title</label>
                    <input
                      className="dn-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Water Shutdown"
                    />
                  </div>

                  <div className="dn-field dn-span-3">
                    <label>Body</label>
                    <textarea
                      className="dn-input"
                      style={{ minHeight: 110 }}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Details..."
                    />
                  </div>

                  <div className="dn-field">
                    <label>Priority</label>
                    <select
                      className="dn-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="dn-field">
                    <label>Publish Date</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Expires Date</label>
                    <input
                      className="dn-input"
                      type="date"
                      value={expiresDate}
                      onChange={(e) => setExpiresDate(e.target.value)}
                    />
                  </div>

                  <div className="dn-field">
                    <label>Ack Required</label>
                    <select
                      className="dn-select"
                      value={requiresAck ? "1" : "0"}
                      onChange={(e) => setRequiresAck(e.target.value === "1")}
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div className="dn-field dn-span-3">
                    <label>Audience (Auto From Filters)</label>
                    <div className="dn-input" style={{ background: "#f7f7f7" }}>
                      Project {projectId || "All"} | Tower {towerId || "All"} |
                      Floor {floorId || "All"} | Unit {unitId || "All"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dn-modal-footer">
                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="dn-btn dn-btn-light"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Reset
                </button>

                <button
                  className="dn-btn dn-btn-primary"
                  onClick={createNotice}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
