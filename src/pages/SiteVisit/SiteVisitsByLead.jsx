import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitList.css";

export default function SiteVisitsByLead() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadInfo, setLeadInfo] = useState(null);

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/sales/site-visits/by-lead/${leadId}/`
      );
      const rows = res.data || [];
      setVisits(rows);

      if (rows.length > 0) {
        const firstVisit = rows[0];
        setLeadInfo({
          name: firstVisit.member_name || firstVisit.lead?.full_name,
          mobile:
            firstVisit.member_mobile_number || firstVisit.lead?.mobile_number,
          project: firstVisit.project?.name,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDT = (v) => {
    if (!v) return "-";
    return new Date(v).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "#3b82f6";
      case "RESCHEDULED":
        return "#6366f1"; // rescheduled = blue/violet
      case "COMPLETED":
        return "#059669";
      case "CANCELLED":
        return "#dc2626";
      case "NO_SHOW":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  // Unit display logic
  const formatUnit = (visit) => {
    if (visit.inventory) {
      return `${visit.inventory.tower_name} / ${visit.inventory.floor_number} / ${visit.inventory.unit_no}`;
    }
    if (visit.unit_config) {
      return visit.unit_config.name || visit.unit_config.code || "NA";
    }
    return "NA";
  };

  // Remarks display (truncate + tooltip)
  const renderRemark = (remark) => {
    if (!remark) {
      return <span className="remark-empty">No remarks yet</span>;
    }

    const text =
      remark.length > 120 ? remark.slice(0, 120).trim() + "…" : remark;

    return (
      <span className="latest-remark" title={remark}>
        {text}
      </span>
    );
  };

  return (
    <div className="projects-page">
      {/* Header + Back Button */}
      <div className="visit-header">
        <h1 className="visit-title">📋 Visit History</h1>

        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <p className="visit-subtitle">
        All site visits for this lead
        {leadInfo && (
          <>
            {" "}
            – <strong>{leadInfo.name}</strong> ({leadInfo.mobile}) –{" "}
            {leadInfo.project}
          </>
        )}
      </p>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Actions</th>
              <th>Visit Date</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Reschedules</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7} // 6 -> 7 (new column)
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div className="loading-spinner"></div>
                  <div style={{ marginTop: "12px", color: "#6b7280" }}>
                    Loading visits...
                  </div>
                </td>
              </tr>
            ) : visits.length ? (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="row-actions">
                    <button
                      className="icon-btn icon-btn-view"
                      title="View Details"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/${visit.id}`)
                      }
                    >
                      <i className="fa fa-eye" />
                    </button>
                    {/* <button
                      className="icon-btn icon-btn-edit"
                      title="Edit"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/${visit.id}/edit`)
                      }
                    >
                      <i className="fa fa-edit" />
                    </button> */}
                  </td>

                  <td>{formatDT(visit.scheduled_at)}</td>
                  <td>{visit.project?.name || "NA"}</td>
                  <td>{formatUnit(visit)}</td>

                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(visit.status)}20`,
                        color: getStatusColor(visit.status),
                      }}
                    >
                      {visit.status}
                    </span>
                  </td>

                  <td>
                    {visit.reschedule_count > 0 ? (
                      <button
                        className="link-button"
                        type="button"
                        onClick={() =>
                          navigate(`/sales/lead/site-visit/${visit.id}`)
                        }
                      >
                        {visit.reschedule_count} time
                        {visit.reschedule_count > 1 ? "s" : ""}
                      </button>
                    ) : (
                      <span>0</span>
                    )}
                  </td>

                  {/* NEW: Remarks */}
                  <td>{renderRemark(visit.remarks)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7} // 6 -> 7
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    📭
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    No visits found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
