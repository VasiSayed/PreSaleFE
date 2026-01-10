import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import "../PreSalesCRM/Leads/SaleAddLead.css";

function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getUserFromLocalStorage() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const upper = (v) => (v == null ? "" : String(v).trim().toUpperCase());


const LEAD_SOURCES = [
  { value: "DIGITAL", label: "Digital" },
  { value: "DIRECT", label: "Direct / Walk-In" },
  { value: "CHANNER_PARTNER", label: "Channel Partner" },
];

const SUB_SOURCE_MAP = {
  DIGITAL: [
    { value: "Meta / Facebook Ads", label: "Facebook Ads" },
    { value: "Google Ads", label: "Google Ads" },
    { value: "Website Form", label: "Website Form" },
    { value: "WhatsApp", label: "WhatsApp" },
  ],
  DIRECT: [
    { value: "Pole Hoarding", label: "Pole Hoarding" },
    { value: "Passing By", label: "Passing by" },
    { value: "Digital Influence", label: "Digital" },
    { value: "Referral", label: "Referral" },
    { value: "SMS Blast", label: "SMS Blast" },
    { value: "Paper Insert / News Paper Ad", label: "Paper Insert / Newspaper Ad" },
    { value: "Voice Call", label: "Voice Call" },
  ],
  CHANNER_PARTNER: [
    { value: "CP Walk-In", label: "CP Walk-In" },
    { value: "CP Telecalling", label: "CP Telecalling" },
  ],
};

function getScopeFromLocalStorage() {
  try {
    const raw = localStorage.getItem("MY_SCOPE");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const LeadOpportunityCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const scope = useMemo(() => getScopeFromLocalStorage(), []);
  const projects = scope?.projects || [];


    const currentUser = useMemo(() => getUserFromLocalStorage(), []);

    const canEditOwner = useMemo(() => {
      const role = upper(currentUser?.role);
      const custom =
        typeof currentUser?.custom_role === "string"
          ? upper(currentUser.custom_role)
          : "";

      // Admin / Superuser -> always allow
      if (currentUser?.is_superuser || role === "ADMIN") return true;

      // Sales -> only allow if Sales Executive
      if (role === "SALES") return custom === "SALES EXECUTIVE";

      // Others -> allow (change if you want stricter)
      return true;
    }, [currentUser]);

  const ownerDisabled = isEdit && !canEditOwner;

  const [form, setForm] = useState({
    project_id: projects[0]?.id || "",
    source_system: "DIGITAL",
    source_name: "",
    full_name: "",
    email: "",
    mobile_number: "",
    owner_id: "",
    remark: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const [existingRawPayload, setExistingRawPayload] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "source_system" ? { source_name: "" } : {}),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if ((name === "full_name" || name === "remark") && value) {
      setForm((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    }
  };

  // ✅ Prefill for Edit
  useEffect(() => {
    if (!isEdit) return;

    const loadOne = async () => {
      setPrefillLoading(true);
      try {
        const res = await axiosInstance.get(`/sales/lead-opportunities/${id}/`);
        const o = res.data || {};

        const projId =
          o.project_id ||
          (typeof o.project === "number" ? o.project : "") ||
          o.project?.id ||
          "";

        const ownerId =
          o.owner_id ||
          (typeof o.owner === "number" ? o.owner : "") ||
          o.owner?.id ||
          "";

        const raw = o.raw_payload || {};
        const remark = raw?.remark || "";

        setExistingRawPayload(raw);

        setForm((prev) => ({
          ...prev,
          project_id: projId ? String(projId) : prev.project_id,
          source_system: o.source_system || prev.source_system,
          source_name: o.source_name || "",
          full_name: o.full_name || "",
          email: o.email || "",
          mobile_number: o.mobile_number || "",
          owner_id: ownerId ? String(ownerId) : "",
          remark: remark || "",
        }));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load opportunity for edit.");
        navigate("/sales/opportunities");
      } finally {
        setPrefillLoading(false);
      }
    };

    loadOne();
  }, [isEdit, id, navigate]);

  // ✅ Load assignable users when project changes
  useEffect(() => {
    if (!form.project_id) return;

    axiosInstance
      .get("/accounts/assignable-users/", {
        params: { project_id: form.project_id },
      })
      .then((res) => setAssignableUsers(res.data?.results ?? res.data ?? []))
      .catch((err) => console.error("User load failed", err));
  }, [form.project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.project_id || !form.full_name || !form.mobile_number || !form.source_name) {
      toast.error("Please fill all required fields including Sub Source.");
      return;
    }

    setSubmitting(true);
    try {
const cleanedRaw = { ...(existingRawPayload || {}) };
delete cleanedRaw.owner_id; 

const payload = {
  project_id: Number(form.project_id),
  source_system: form.source_system || "CALLING",
  source_name: form.source_name || "",
  full_name: form.full_name || "",
  email: form.email || "",
  mobile_number: form.mobile_number || "",
  owner_id: form.owner_id ? Number(form.owner_id) : null,
  raw_payload: {
    ...cleanedRaw,
    ...(form.remark ? { remark: form.remark } : {}),
  },
};


      if (isEdit) {
        await axiosInstance.patch(`/sales/lead-opportunities/${id}/`, payload);
        toast.success("Opportunity updated successfully!");
        navigate("/sales/opportunities");
      } else {
        await axiosInstance.post("/sales/lead-opportunities/", payload);
        toast.success("Opportunity created successfully!");

        setExistingRawPayload({});
        setForm((prev) => ({
          ...prev,
          full_name: "",
          email: "",
          mobile_number: "",
          remark: "",
          source_name: "",
          owner_id: "",
        }));
        navigate("/sales/opportunities");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ if source_system is META etc, show it in dropdown too
  const sourceOptions = useMemo(() => {
    const set = new Map(LEAD_SOURCES.map((x) => [x.value, x.label]));
    if (form.source_system && !set.has(form.source_system)) {
      set.set(form.source_system, form.source_system); // e.g. META
    }
    return Array.from(set.entries()).map(([value, label]) => ({ value, label }));
  }, [form.source_system]);

  const hasSubSourceDropdown = Boolean(SUB_SOURCE_MAP[form.source_system]);

  return (
    <div className="setup-section">
      <div className="section-content">
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 8,
          }}
        >
          {isEdit ? "Edit Lead Opportunity" : "New Lead Opportunity"}{" "}
          {scope?.brand?.company_name
            ? `– ${toTitleCase(scope.brand.company_name)}`
            : ""}
        </h2>

        {prefillLoading ? (
          <div style={{ padding: 16, color: "#6b7280" }}>
            Loading opportunity...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                      {toTitleCase(p.name || p.display_name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Lead Source <span className="required">*</span>
                </label>
                <select
                  name="source_system"
                  value={form.source_system}
                  onChange={handleChange}
                  className="form-input"
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Sub Source / Campaign <span className="required">*</span>
                </label>

                {hasSubSourceDropdown ? (
                  <select
                    name="source_name"
                    value={form.source_name}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Sub Source</option>
                    {(SUB_SOURCE_MAP[form.source_system] || []).map((sub) => (
                      <option key={sub.value} value={sub.value}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="source_name"
                    value={form.source_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-input"
                    placeholder="Enter source name"
                  />
                )}
              </div>
            </div>

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
                  onBlur={handleBlur}
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Owner / Assign To</label>
                <select
                  name="owner_id"
                  value={form.owner_id}
                  onChange={handleChange}
                  disabled={ownerDisabled}
                  title={
                    ownerDisabled
                      ? "Only Sales Executive/Admin can change Owner (Edit only)"
                      : ""
                  }
                  className="form-input"
                >
                  <option value="">Select User</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {toTitleCase(u.display_name)} {u.role && `(${u.role})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field-full">
                <label className="form-label">Remark</label>
                <textarea
                  name="remark"
                  value={form.remark}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting
                  ? "Saving..."
                  : isEdit
                  ? "Update Opportunity"
                  : "Create Opportunity"}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/sales/opportunities")}
                style={{ marginLeft: 10 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeadOpportunityCreate;
