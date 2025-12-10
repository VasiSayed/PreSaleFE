// src/pages/LeadOpportunityCreate.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import "../PreSalesCRM/Leads/SaleAddLead.css";

const SOURCE_SYSTEM_OPTIONS = [
  { value: "CALLING", label: "Calling Data Upload" },
  { value: "WEB_FORM", label: "Website Form" },
  { value: "PORTAL", label: "Property Portal" },
  { value: "META", label: "Meta / Facebook Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "GOOGLE_SHEET", label: "Google Sheet" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "CHATBOT", label: "Chatbot" },
  { value: "OTHER", label: "Other / Manual" },
];

function getScopeFromLocalStorage() {
  try {
    const raw = localStorage.getItem("MY_SCOPE");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse MY_SCOPE:", err);
    return {};
  }
}

const LeadOpportunityCreate = () => {
  const scope = useMemo(() => getScopeFromLocalStorage(), []);
  const projects = scope?.projects || [];

  const [form, setForm] = useState({
    project_id: projects[0]?.id || "",
    source_system: "CALLING",
    source_name: "",
    full_name: "",
    email: "",
    mobile_number: "",
    owner_id: "", // assignable user id
    remark: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // assignable users for selected project
  const [assignableUsers, setAssignableUsers] = useState([]);

  // phone lookup state
  const [phoneLookup, setPhoneLookup] = useState({
    loading: false,
    data: null,
    error: null,
  });

  const duplicatePresent = !!phoneLookup.data?.present;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getProjectLabel = (p) =>
    p.name || p.project_name || p.display_name || `Project #${p.id}`;

  // -------------------------------
  // Load assignable users by project
  // -------------------------------
  useEffect(() => {
    if (!form.project_id) {
      setAssignableUsers([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/accounts/assignable-users/", {
          params: { project_id: form.project_id },
          signal: controller.signal,
        });

        if (cancelled) return;
        // Backend can return {results:[]} or [] directly. Handle both.
        const data = res.data?.results ?? res.data ?? [];
        setAssignableUsers(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load assignable users:", err);
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [form.project_id]);

  // -------------------------------
  // Phone lookup when 10 digits
  // -------------------------------
  useEffect(() => {
    const phone = (form.mobile_number || "").replace(/\D/g, "");

    // reset if not exactly 10 digits or no project selected
    if (phone.length !== 10 || !form.project_id) {
      setPhoneLookup({ loading: false, data: null, error: null });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const lookup = async () => {
      setPhoneLookup((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await axiosInstance.get(
          "/sales/sales-leads/lookup-by-phone/",
          {
            params: {
              phone,
              project_id: form.project_id,
            },
            signal: controller.signal,
          }
        );

        if (cancelled) return;

        setPhoneLookup({
          loading: false,
          data: res.data,
          error: null,
        });

        if (res.data?.present) {
          const lead = res.data.leads?.[0];
          const name = lead?.full_name || lead?.first_name || "";
          toast.error(
            name
              ? `Lead already exists for ${name} (${phone}).`
              : `Lead already exists for this phone (${phone}).`
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Phone lookup failed:", err);
        setPhoneLookup({
          loading: false,
          data: null,
          error: "Lookup failed",
        });
      }
    };

    // small debounce so we don't spam API while typing
    const timeoutId = setTimeout(lookup, 400);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [form.mobile_number, form.project_id]);

  // -------------------------------
  // Submit handler
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.project_id) {
      toast.error("Please select a project.");
      return;
    }
    if (!form.full_name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!form.mobile_number.trim()) {
      toast.error("Mobile number is required.");
      return;
    }

    // prevent creating if lookup says a lead is already present
    if (duplicatePresent) {
      toast.error("Lead already exists for this phone in this project.");
      return;
    }

    const payload = {
      project_id: Number(form.project_id),
      source_system: form.source_system || "CALLING",
      source_name: form.source_name || "",
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      mobile_number: form.mobile_number.trim(),
      owner_id: form.owner_id ? Number(form.owner_id) : null,
      raw_payload: form.remark ? { remark: form.remark } : {},
    };

    setSubmitting(true);
    try {
      const res = await axiosInstance.post(
        "/sales/lead-opportunities/",
        payload
      );
      toast.success(`Opportunity created (ID: ${res.data.id})`);

      // reset only some fields, keep project & source_system
      setForm((prev) => ({
        ...prev,
        source_name: "",
        full_name: "",
        email: "",
        mobile_number: "",
        owner_id: "",
        remark: "",
      }));
      setPhoneLookup({ loading: false, data: null, error: null });
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        "Failed to create opportunity. Please check the form.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="setup-section">
      <div className="section-content">
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", marginBottom: "8px" }}>
          New Lead Opportunity{" "}
          {scope?.brand?.company_name ? `– ${scope.brand.company_name}` : ""}
        </h2>
        <p style={{ marginBottom: "16px", fontSize: "13px", color: "#4b5563" }}>
          Create a manual lead opportunity for a project. We auto-check if the
          phone already exists for this project.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Project, Source System, Source Name */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                Project <span className="required">*</span>
              </label>
              <select
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getProjectLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Source System</label>
              <select
                name="source_system"
                value={form.source_system}
                onChange={handleChange}
                className="form-input"
              >
                {SOURCE_SYSTEM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Source Name / Campaign</label>
              <input
                type="text"
                name="source_name"
                value={form.source_name}
                onChange={handleChange}
                placeholder="e.g. Calling Sheet Jan 2025"
                className="form-input"
              />
            </div>
          </div>

          {/* Row 2: Full Name, Email, Mobile Number */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Mobile Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                placeholder="10 digit phone"
                className="form-input"
              />
              {phoneLookup.loading && (
                <p style={{ fontSize: "11px", marginTop: "4px", color: "#6b7280" }}>
                  Checking existing leads...
                </p>
              )}
              {duplicatePresent && (
                <p style={{ fontSize: "11px", marginTop: "4px", color: "#b91c1c" }}>
                  Lead already exists for this phone in this project.
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Owner / Assign To */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                Owner / Assign To (optional)
              </label>
              <select
                name="owner_id"
                value={form.owner_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || `User #${u.id}`}{" "}
                    {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remark */}
          <div className="form-row">
            <div className="form-field-full">
              <label className="form-label">Remark (optional)</label>
              <textarea
                name="remark"
                value={form.remark}
                onChange={handleChange}
                rows={3}
                className="form-textarea"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="form-row">
            <div className="form-field-full">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "40px",
                  marginTop: "40px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={submitting || duplicatePresent}
                  className="btn-primary"
                >
                  {duplicatePresent
                    ? "Existing Lead Found"
                    : submitting
                    ? "Saving..."
                    : "Create Opportunity"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadOpportunityCreate;
