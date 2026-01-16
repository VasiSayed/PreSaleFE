import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Upload, Eye, X } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import "./ArchitectureCertificateHub.css";


const API_SCOPE = "/client/my-scope/";
const API_NESTED = "/client/payment-plans/nested/";
const uploadUrl = (slabId) =>
  `/client/payment-slabs/${slabId}/upload-architecture/`;

function fmtDT(v) {
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  } catch {
    return v;
  }
}

function StatusBadge({ status }) {
  const s = String(status || "pending").toLowerCase();
  const cls =
    s === "done"
      ? "ac-badge ac-success"
      : s === "cancelled"
      ? "ac-badge ac-danger"
      : "ac-badge ac-warning";
  return <span className={cls}>{s.toUpperCase()}</span>;
}



function YesNoBadge({ yes }) {
  return yes ? (
    <span className="ac-badge ac-success">YES</span>
  ) : (
    <span className="ac-badge ac-danger">NO</span>
  );
}

function previewLocalFile(file) {
  try {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    console.error(e);
    toast.error("Could not preview file.");
  }
}

export default function ArchitectureCertificates() {
  const [scopeLoading, setScopeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const [brand, setBrand] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [plans, setPlans] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [fileBySlab, setFileBySlab] = useState({}); // slabId -> File

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  
  const fetchScope = async () => {
    try {
      setScopeLoading(true);
      const res = await axiosInstance.get(API_SCOPE);
      const data = res?.data || {};
      const projs = data?.projects || [];

      setBrand(data?.brand || null);
      setProjects(projs);

      if (projs.length === 1) setSelectedProjectId(projs[0].id);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load scope/projects.");
    } finally {
      setScopeLoading(false);
    }
  };

  const fetchNested = async (projectId) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_NESTED, {
        params: { project_id: projectId },
      });
      const rows = res?.data?.results || [];
      setPlans(rows);

      const map = {};
      rows.forEach((p) => (map[p.id] = true));
      setExpanded(map);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load payment plans/slabs.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScope();
  }, []);

  useEffect(() => {
    if (selectedProjectId) fetchNested(selectedProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const handleUpload = async (slabId) => {
    const file = fileBySlab[slabId];
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    const fd = new FormData();
    fd.append("architecture_certificate", file);

    try {
      setUploadingId(slabId);
      await axiosInstance.post(uploadUrl(slabId), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Architecture certificate uploaded.");

      setFileBySlab((prev) => {
        const next = { ...prev };
        delete next[slabId];
        return next;
      });

      await fetchNested(selectedProjectId);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Upload failed. Check role/permission & try again.";
      toast.error(msg);
    } finally {
      setUploadingId(null);
    }
  };

  const clearSelected = (slabId) => {
    setFileBySlab((prev) => {
      const next = { ...prev };
      delete next[slabId];
      return next;
    });
  };

  return (
    <div className="ac-page">

      {!selectedProjectId && projects.length > 1 && (
        <div className="ac-empty">Select a project to view plans & slabs.</div>
      )}

      {selectedProjectId && loading && (
        <div className="ac-empty">Loading plans…</div>
      )}

      {selectedProjectId && !loading && plans.length === 0 && (
        <div className="ac-empty">No payment plans found for this project.</div>
      )}

      <div className="ac-list">
        {plans.map((plan) => {
          const slabs = plan.slabs || [];
          const open = !!expanded[plan.id];

          return (
            <div key={plan.id} className="ac-card">
              <div
                className="ac-card-head"
                onClick={() => setExpanded((p) => ({ ...p, [plan.id]: !open }))}
              >
                <div>
                  <div className="ac-plan-title">
                    {plan.code} — {plan.name}
                  </div>
                  {/* <div className="ac-plan-meta">
                    Total %: <b>{plan.total_percentage ?? "-"}</b> • Slabs:{" "}
                    <b>{slabs.length}</b>
                  </div> */}
                </div>
                <div className="ac-toggle">{open ? "Hide" : "Show"}</div>
              </div>

              {open && (
                <div className="ac-card-body">
                  <div className="ac-table-wrap">
                    <table className="ac-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Slab</th>
                          <th>%</th>
                          {/* <th>Days</th> */}
                          <th>Status</th>
                          <th>Uploaded?</th>
                          <th>Uploaded By</th>
                          <th>Uploaded At</th>
                          <th>Certificate</th>
                          <th>Cancelled Reason</th>
                          <th className="ac-upload-th">Upload</th>
                        </tr>
                      </thead>

                      <tbody>
                        {slabs.map((s) => {
                          const has = !!s.has_architecture_certificate;
                          const selected = fileBySlab[s.id];
                          const inputId = `ac-file-${s.id}`;

                          return (
                            <tr key={s.id}>
                              <td>{s.order_index}</td>

                              <td>
                                <div className="ac-slab-name">{s.name}</div>
                                <div className="ac-slab-sub">
                                  Slab ID:{" "}
                                  <span className="ac-mono">{s.id}</span>
                                </div>
                              </td>

                              <td>{s.percentage}</td>
                              {/* <td>{s.days ?? "-"}</td> */}

                              <td>
                                <StatusBadge status={s.status} />
                              </td>

                              <td>
                                <YesNoBadge yes={has} />
                              </td>

                              <td>{s.uploaded_by_name ?? "-"}</td>
                              <td>{fmtDT(s.uploaded_at)}</td>

                              <td>
                                {s.architecture_certificate ? (
                                  <a
                                    className="ac-link"
                                    href={s.architecture_certificate}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td>{s.cancelled_reason || "-"}</td>

                              {/* ✅ compact upload cell with SINGLE preview */}
                              <td className="ac-upload-cell">
                                <div className="ac-upload-actions">
                                  <button
                                    type="button"
                                    className="ac-icon-btn"
                                    title={
                                      selected
                                        ? "Preview selected file"
                                        : s.architecture_certificate
                                        ? "Preview uploaded certificate"
                                        : "No certificate to preview"
                                    }
                                    disabled={
                                      !selected && !s.architecture_certificate
                                    }
                                    onClick={() => {
                                      if (selected)
                                        return previewLocalFile(selected);
                                      if (s.architecture_certificate) {
                                        window.open(
                                          s.architecture_certificate,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }
                                    }}
                                  >
                                    <Eye size={16} />
                                  </button>

                                  {/* Pick file */}
                                  <label
                                    className="ac-icon-btn ac-icon-btn-solid"
                                    htmlFor={inputId}
                                    title="Choose file"
                                  >
                                    <Plus size={16} />
                                  </label>

                                  <input
                                    id={inputId}
                                    className="ac-file-hidden"
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      setFileBySlab((p) => ({
                                        ...p,
                                        [s.id]: f,
                                      }));
                                      e.target.value = "";
                                    }}
                                  />

                                  {/* Upload */}
                                  <button
                                    type="button"
                                    className="ac-icon-btn ac-icon-btn-solid"
                                    title={
                                      selected
                                        ? has
                                          ? "Replace certificate"
                                          : "Upload certificate"
                                        : "Select a file first"
                                    }
                                    disabled={!selected || uploadingId === s.id}
                                    onClick={() => handleUpload(s.id)}
                                  >
                                    <Upload size={16} />
                                  </button>

                                  {/* Clear */}
                                  <button
                                    type="button"
                                    className="ac-icon-btn"
                                    title="Clear selected file"
                                    disabled={!selected || uploadingId === s.id}
                                    onClick={() => clearSelected(s.id)}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                {selected?.name && (
                                  <div
                                    className="ac-selected-name"
                                    title={selected.name}
                                  >
                                    {selected.name}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {slabs.length === 0 && (
                          <tr>
                            <td colSpan={11} className="ac-empty-td">
                              No slabs in this plan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* <div className="ac-footnote">
                    Upload key:{" "}
                    <span className="ac-mono">architecture_certificate</span>
                  </div> */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
