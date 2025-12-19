import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import "../PreSalesCRM/Leads/SaleAddLead.css";

// Helper: Convert text to Title Case
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Data from your Image: Sources and their specific Sub-Sources
const LEAD_SOURCES = [
  { value: "DIGITAL", label: "Digital" },
  { value: "DIRECT", label: "Direct (Walk-In)" },
  { value: "CHANNEL_PARTNER", label: "Channel Partner" },
];

const SUB_SOURCE_MAP = {
  DIGITAL: [
    { value: "FACEBOOK_ADS", label: "Facebook Ads" },
    { value: "GOOGLE_ADS", label: "Google Ads" },
    { value: "WEBSITE", label: "Website Form" },
    { value: "WHATSAPP", label: "WhatsApp" },
  ],
  DIRECT: [
    { value: "POLE_HOARDING", label: "Pole Hoarding" },
    { value: "PASSING_BY", label: "Passing by" },
    { value: "DIGITAL_INFLUENCE", label: "Digital" },
    { value: "REFERRAL", label: "Referral" },
    { value: "SMS_BLAST", label: "SMS Blast" },
    { value: "PAPER_INSERT", label: "Paper Insert / News Paper Ad" },
    { value: "VOICE_CALL", label: "Voice Call" },
  ],
  CHANNEL_PARTNER: [
    { value: "CP_WALK_IN", label: "CP Walk-In" },
    { value: "CP_TELECALLING", label: "CP Telecalling" },
  ],
};

function getScopeFromLocalStorage() {
  try {
    const raw = localStorage.getItem("MY_SCOPE");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

const LeadOpportunityCreate = () => {
  const scope = useMemo(() => getScopeFromLocalStorage(), []);
  const projects = scope?.projects || [];

  const [form, setForm] = useState({
    project_id: projects[0]?.id || "",
    source_system: "DIGITAL", // Default to Digital
    source_name: "",          // This will be the Sub-Source
    full_name: "",
    email: "",
    mobile_number: "",
    owner_id: "",
    remark: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [phoneLookup, setPhoneLookup] = useState({ loading: false, data: null, error: null });

  const duplicatePresent = !!phoneLookup.data?.present;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Reset sub-source if lead source changes
      ...(name === "source_system" ? { source_name: "" } : {}),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if ((name === "email" || name === "full_name" || name === "remark") && value) {
      setForm((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    }
  };

  // Load assignable users
  useEffect(() => {
    if (!form.project_id) return;
    axiosInstance.get("/accounts/assignable-users/", { params: { project_id: form.project_id } })
      .then(res => setAssignableUsers(res.data?.results ?? res.data ?? []))
      .catch(err => console.error("User load failed", err));
  }, [form.project_id]);

  // Phone lookup logic (Debounced)
  useEffect(() => {
    const phone = (form.mobile_number || "").replace(/\D/g, "");
    if (phone.length !== 10 || !form.project_id) {
      setPhoneLookup({ loading: false, data: null, error: null });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setPhoneLookup(p => ({ ...p, loading: true }));
      try {
        const res = await axiosInstance.get("/sales/sales-leads/lookup-by-phone/", {
          params: { phone, project_id: form.project_id },
        });
        setPhoneLookup({ loading: false, data: res.data, error: null });
        if (res.data?.present) toast.error("Lead already exists for this phone.");
      } catch (err) {
        setPhoneLookup({ loading: false, data: null, error: "Lookup failed" });
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [form.mobile_number, form.project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.full_name || !form.mobile_number || !form.source_name) {
      toast.error("Please fill all required fields including Sub Source.");
      return;
    }
    if (duplicatePresent) return;

    setSubmitting(true);
    try {
      await axiosInstance.post("/sales/lead-opportunities/", {
        ...form,
        project_id: Number(form.project_id),
        owner_id: form.owner_id ? Number(form.owner_id) : null,
        raw_payload: form.remark ? { remark: form.remark } : {},
      });
      toast.success("Opportunity created successfully!");
      setForm(prev => ({ ...prev, full_name: "", email: "", mobile_number: "", remark: "", source_name: "" }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="setup-section">
      <div className="section-content">
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
          New Lead Opportunity {scope?.brand?.company_name ? `– ${toTitleCase(scope.brand.company_name)}` : ""}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            {/* Project Selection */}
            <div className="form-field">
              <label className="form-label">Project <span className="required">*</span></label>
              <select name="project_id" value={form.project_id} onChange={handleChange} className="form-input">
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{toTitleCase(p.name || p.display_name)}</option>)}
              </select>
            </div>

            {/* Main Lead Source */}
            <div className="form-field">
              <label className="form-label">Lead Source <span className="required">*</span></label>
              <select name="source_system" value={form.source_system} onChange={handleChange} className="form-input">
                {LEAD_SOURCES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Dynamic Sub Source (Based on Image Scenarios) */}
            <div className="form-field">
              <label className="form-label">Sub Source / Campaign <span className="required">*</span></label>
              <select name="source_name" value={form.source_name} onChange={handleChange} className="form-input">
                <option value="">Select Sub Source</option>
                {(SUB_SOURCE_MAP[form.source_system] || []).map(sub => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange} onBlur={handleBlur} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-field">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input type="tel" name="mobile_number" value={form.mobile_number} onChange={handleChange} placeholder="10 digit phone" className="form-input" />
              {duplicatePresent && <p style={{ fontSize: "11px", color: "#b91c1c" }}>Duplicate lead found.</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Owner / Assign To</label>
              <select name="owner_id" value={form.owner_id} onChange={handleChange} className="form-input">
                <option value="">Select User</option>
                {assignableUsers.map(u => (
                  <option key={u.id} value={u.id}>{toTitleCase(u.display_name)} {u.role && `(${u.role})`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field-full">
              <label className="form-label">Remark</label>
              <textarea name="remark" value={form.remark} onChange={handleChange} rows={3} className="form-textarea" />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button type="submit" disabled={submitting || duplicatePresent} className="btn-primary">
              {submitting ? "Saving..." : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadOpportunityCreate;
