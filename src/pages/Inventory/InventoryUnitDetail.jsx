// src/pages/InventoryUnitDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./InventoryUnitDetail.css";

const InventoryUnitDetail = () => {
  const { unitId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectId = searchParams.get("project_id");

  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      return new Date(v).toLocaleString();
    } catch {
      return v;
    }
  };

  useEffect(() => {
    if (!unitId) return;

    setLoading(true);
    setError("");

    api
      .get("/client/inventory/by-unit/", {
        params: { unit_id: unitId },
      })
      .then((res) => {
        setInv(res.data);
      })
      .catch((err) => {
        console.error("Failed to load inventory detail", err);
        setError("Failed to load inventory detail.");
      })
      .finally(() => setLoading(false));
  }, [unitId]);

  const handleBack = () => {
    if (projectId) {
      navigate(`/inventory-planning/`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return <div className="inventory-detail-page">Loading unit details...</div>;
  }

  if (error) {
    return <div className="inventory-detail-page error-text">{error}</div>;
  }

  if (!inv) {
    return (
      <div className="inventory-detail-page">
        <div>No inventory details found.</div>
      </div>
    );
  }

  const {
    project_name,
    tower_name,
    floor_number,
    unit_no,
    unit_type_name,
    configuration_name,
    facing_name,

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



  return (
    <div className="inventory-detail-page">
      {/* Header + breadcrumb */}
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
          </div>
          {/* <div className={`header-status-badge status-${availability_status || "default"}`}>
            <span className="header-status-icon">
              {availability_status === "AVAILABLE" && "✓"}
              {availability_status === "BOOKED" && "✕"}
              {availability_status === "BLOCKED" && "⚠"}
            </span>
            <span className="header-status-text">
              {availability_status_label || availability_status || "Unknown"}
            </span>
          </div> */}
        </div>
      </div>

      {/* Top summary row */}
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

        <div className={`card status-card status-card-${availability_status || "default"}`}>
          <div className="card-title">Status</div>

          <div className="status-primary-badge">
            <div className="status-primary-label">Availability Status</div>
            <div className={`status-primary-value status-${availability_status || "default"}`}>
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

      {/* Middle: Areas + Pricing + Charges */}
      <div className="detail-middle-row">
        {(carpet_sqft != null || builtup_sqft != null || rera_area_sqft != null || saleable_sqft != null || other_area_sqft != null || loft_area_sqft != null) && (
          <div className="card">
            <div className="card-title">Areas (sq.ft)</div>
            <div className="card-grid-2">
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
                  <div className="field-value">{formatNumber(rera_area_sqft)}</div>
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
                  <div className="field-value">{formatNumber(other_area_sqft)}</div>
                </div>
              )}
              {loft_area_sqft != null && (
                <div>
                  <div className="field-label">Loft Area</div>
                  <div className="field-value">{formatNumber(loft_area_sqft)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {(base_price_psf != null || rate_psf != null || agreement_value != null || gst_amount != null) && (
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
        )}

        {(development_infra_charge != null || stamp_duty_amount != null || registration_charges != null || legal_fee != null || total_cost != null) && (
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
        )}
      </div>

      {/* Description + meta + photo */}
      {(description || created_at || updated_at || photo) && (
        <div className="detail-bottom-row">
          {description && (
            <div className="card">
              <div className="card-title">Description</div>
              <div className="field-value description-text">
                {description}
              </div>
            </div>
          )}

          {(created_at || updated_at) && (
            <div className="card">
              <div className="card-title">Meta</div>
              <div className="card-grid-2">
                {created_at && (
                  <div>
                    <div className="field-label">Created At</div>
                    <div className="field-value">{formatDateTime(created_at)}</div>
                  </div>
                )}
                {updated_at && (
                  <div>
                    <div className="field-label">Updated At</div>
                    <div className="field-value">{formatDateTime(updated_at)}</div>
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
    </div>
  );
};

export default InventoryUnitDetail;
