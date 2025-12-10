import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitEdit.css";
import { toast } from "react-hot-toast";

const SiteVisitEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // COMPLETE FORM SHAPE
  const [form, setForm] = useState({
    lead: "",
    lead_name: "",
    lead_mobile: "",

    project: "",
    project_name: "",

    inventory_unit_no: "",
    inventory_tower: "",
    inventory_floor: "",

    member_name: "",
    member_mobile: "",

    status: "",
    created_at: "",

    scheduled_at: "",
    notes: "",
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Load ONLY SITE VISIT (no leads, no projects API hit)
  const loadData = async () => {
    try {
      setLoading(true);

      const visitRes = await axiosInstance.get(`/sales/site-visits/${id}/`);

      const v = visitRes.data;

      setForm({
        lead: v.lead?.id || "",
        lead_name: v.lead?.full_name || "",
        lead_mobile: v.lead?.mobile_number || "",

        project: v.project?.id || "",
        project_name: v.project?.name || "",

        inventory_unit_no: v.inventory?.unit_no || "",
        inventory_tower: v.inventory?.tower_name || "",
        inventory_floor: v.inventory?.floor_number || "",

        member_name: v.member_name || "",
        member_mobile: v.member_mobile_number || "",

        status: v.status || "",
        created_at: v.created_at?.split("T")[0] || "",

        scheduled_at: v.scheduled_at ? v.scheduled_at.slice(0, 16) : "",
        notes: v.notes || "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load site visit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.patch(`/sales/site-visits/${id}/`, {
        scheduled_at: form.scheduled_at,
        notes: form.notes,
      });

      toast.success("Visit updated!");
      navigate("/sales/lead/site-visit");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update visit");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div className="sv-page">
      <div className="sv-section">
        <div className="sv-section-header">➤ Edit Site Visit</div>

        <div className="sv-section-body">
          {/* Lead + Contact */}
          <div className="sv-display-row">
            <div className="sv-display-item">
              <label>Lead Name</label>
              <div className="sv-display-value">{form.lead_name}</div>
            </div>

            <div className="sv-display-item">
              <label>Lead Mobile</label>
              <div className="sv-display-value">{form.lead_mobile}</div>
            </div>
          </div>

          {/* Project + Inventory */}
          <div className="sv-display-row">
            <div className="sv-display-item">
              <label>Project</label>
              <div className="sv-display-value">{form.project_name}</div>
            </div>

            <div className="sv-display-item">
              <label>Unit</label>
              <div className="sv-display-value">
                {form.inventory_unit_no} ({form.inventory_tower} – Floor{" "}
                {form.inventory_floor})
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="sv-display-row">
            <div className="sv-display-item">
              <label>Member Name</label>
              <div className="sv-display-value">{form.member_name}</div>
            </div>

            <div className="sv-display-item">
              <label>Member Mobile</label>
              <div className="sv-display-value">{form.member_mobile}</div>
            </div>
          </div>

          {/* Status */}
          <div className="sv-display-row">
            <div className="sv-display-item">
              <label>Status</label>
              <div className={`sv-status ${form.status?.toLowerCase()}`}>
                {form.status}
              </div>
            </div>

            <div className="sv-display-item">
              <label>Created At</label>
              <div className="sv-display-value">{form.created_at}</div>
            </div>
          </div>

          <hr className="sv-divider" />

          {/* Editable Scheduled Date */}
          {/* <div className="sv-row">
            <div className="sv-field-full">
              <label className="sv-label">Reschedule Visit (Date & Time)</label>
              <input
                type="datetime-local"
                className="sv-input"
                value={form.scheduled_at}
                onChange={(e) => handleChange("scheduled_at", e.target.value)}
              />
            </div>
          </div> */}
        </div>
      </div>

      {/* Footer */}
      <div className="sv-footer">
        <button className="sv-btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button className="sv-btn-primary" onClick={handleSubmit}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SiteVisitEdit;
