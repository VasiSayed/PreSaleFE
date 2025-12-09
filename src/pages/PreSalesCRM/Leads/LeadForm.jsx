import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SetupAPI, LeadAPI, URLS } from "../../../api/endpoints";
import api from "../../../api/axiosInstance";
import "./LeadForm.css";

const FIELDS = [
  // Lead Information
  {
    section: "lead",
    name: "first_name",
    label: "First Name",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "last_name",
    label: "Last Name",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "email",
    label: "Email",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "mobile_number",
    label: "Mobile Number",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "tel_res",
    label: "Tel(Res)",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "tel_office",
    label: "Tel(Office)",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "project_id",
    label: "Project",
    type: "select",
    required: true,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "budget",
    label: "Budget",
    type: "number",
    required: false,
    span: 1,
    parse: "number",
  },
  {
    section: "lead",
    name: "annual_income",
    label: "Annual Income",
    type: "number",
    required: false,
    span: 1,
    parse: "number",
  },
  {
    section: "lead",
    name: "company",
    label: "Company",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "lead_classification_id",
    label: "Lead Classification",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_subclass_id",
    label: "Lead Subclass",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_source_id",
    label: "Lead Source",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_sub_source_id",
    label: "Lead Sub Source",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "status_id",
    label: "Status",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "sub_status_id",
    label: "Sub Status",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_owner_id",
    label: "Lead Owner",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "assign_to_id",
    label: "Assign To",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "purpose_id",
    label: "Purpose",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "offering_type",
    label: "Offering Type",
    type: "select",
    required: false,
    span: 1,
    parse: "identity",
    options: [],
  },

  // Address Information
  {
    section: "address",
    name: "flat_no",
    label: "Flat No/ Building",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "area",
    label: "Area",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "pin_code",
    label: "Pin Code",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "city",
    label: "City",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "state",
    label: "State",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "country",
    label: "Country",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },

  // Description Information
  {
    section: "description",
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    span: 3,
    parse: "identity",
  },
];

const buildInitialFormState = () => {
  const form = {};
  FIELDS.forEach((field) => {
    form[field.name] = field.type === "checkbox" ? false : "";
  });
  return form;
};

const normalizeScalarValue = (value, field) => {
  if (value === "" || value === undefined || value === null) return null;

  if (field.parse === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  if (field.parse === "date") return value || null;

  if (
    field.type === "select" &&
    typeof value === "string" &&
    /^\d+$/.test(value)
  ) {
    return Number(value);
  }

  return value;
};

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [form, setForm] = useState(buildInitialFormState);

  // collapsible groups
  const [openGroups, setOpenGroups] = useState({
    lead: true,
    address: true,
    description: true,
  });

  // dynamic data
  const [projects, setProjects] = useState([]);
  const [emailRequired, setEmailRequired] = useState(false);
  const [masters, setMasters] = useState(null);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);

  // Load projects on mount
  useEffect(() => {
    SetupAPI.myScope()
      .then((data) => {
        const list =
          data?.projects || data?.project_list || data?.results || [];
        setProjects(list);

        // If a project is already selected, re-evaluate email requirement
        if (form.project_id) {
          const project = list.find((p) => String(p.id) === String(form.project_id));
          setEmailRequired(!!project?.email_for_lead);
        }
      })
      .catch((err) => {
        console.error("Failed to load scope", err);
        alert("Failed to load project scope");
      });
  }, []);

  // Load existing lead data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setLoadingLead(true);
      LeadAPI.get(id)
        .then((data) => {
          // Map backend data to form
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            mobile_number: data.mobile_number || "",
            tel_res: data.tel_res || "",
            tel_office: data.tel_office || "",
            project_id: data.project_lead?.project?.id || data.project_id || "",
            budget: data.budget || "",
            annual_income: data.annual_income || "",
            company: data.company || "",
            lead_classification_id: data.classification?.id || "",
            lead_subclass_id: data.sub_classification?.id || "",
            lead_source_id: data.source?.id || "",
            lead_sub_source_id: data.sub_source?.id || "",
            status_id: data.status?.id || "",
            sub_status_id: data.sub_status?.id || "",
            lead_owner_id: data.current_owner?.id || "",
            assign_to_id: data.assign_to?.id || "",
            purpose_id: data.purpose?.id || "",
            offering_type: data.offering_types?.[0]?.id || "",
            flat_no: data.address?.flat_or_building || "",
            area: data.address?.area || "",
            pin_code: data.address?.pincode || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            country: data.address?.country || "",
            description: data.address?.description || "",
          });
        })
        .catch((err) => {
          console.error("Failed to load lead", err);
          alert("Failed to load lead data");
        })
        .finally(() => setLoadingLead(false));
    }
  }, [isEditMode, id]);

  // Load lead masters when project changes
  useEffect(() => {
    if (!form.project_id) {
      setMasters(null);
      setEmailRequired(false);
      return;
    }

    // Toggle email required based on selected project's flag
    const selectedProj = projects.find(
      (p) => String(p.id) === String(form.project_id)
    );
    setEmailRequired(!!selectedProj?.email_for_lead);

    setLoadingMasters(true);
    api
      .get(URLS.leadMasters, {
        params: { project_id: form.project_id },
      })
      .then((res) => {
        setMasters(res.data);
      })
      .catch((err) => {
        console.error("Failed to load lead masters", err);
        alert("Failed to load lead masters");
      })
      .finally(() => setLoadingMasters(false));
  }, [form.project_id]);

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getOptionsForField = (field) => {
    const toOptions = (items) =>
      (items || []).map((item) => ({
        value: item.id,
        label: item.name || item.label || item.title || `#${item.id}`,
      }));

    if (field.name === "project_id") {
      return (projects || []).map((p) => ({
        value: p.id,
        label: p.name || p.project_name || p.title || `Project #${p.id}`,
      }));
    }

    if (!masters) {
      if (field.options && field.options.length) return field.options;
      return [];
    }

    switch (field.name) {
      case "lead_classification_id":
        return toOptions(masters.classifications);

      case "lead_subclass_id": {
        const selectedId = form.lead_classification_id
          ? String(form.lead_classification_id)
          : null;
        const root = (masters.classifications || []).find(
          (c) => String(c.id) === selectedId
        );
        return toOptions(root?.children || root?.subclasses);
      }

      case "lead_source_id":
        return toOptions(masters.sources);

      case "lead_sub_source_id": {
        const selectedId = form.lead_source_id
          ? String(form.lead_source_id)
          : null;
        const root = (masters.sources || []).find(
          (s) => String(s.id) === selectedId
        );
        return toOptions(root?.children || root?.sub_sources);
      }

      case "status_id":
        return toOptions(masters.statuses);

      case "sub_status_id": {
        const selectedId = form.status_id ? String(form.status_id) : null;
        const st = (masters.statuses || []).find(
          (s) => String(s.id) === selectedId
        );
        return toOptions(st?.sub_statuses);
      }

      case "purpose_id":
        return toOptions(masters.purposes);

      case "offering_type":
        return toOptions(masters.offering_types);

      case "lead_owner_id":
      case "assign_to_id":
        return (masters.assign_users || []).map((u) => ({
          value: u.id,
          label: u.name || u.username,
        }));

      default:
        return field.options || [];
    }
  };

  const buildRowsForSection = (sectionName) => {
    const fields = FIELDS.filter((f) => f.section === sectionName);
    const rows = [];
    let currentRow = [];
    let currentSpan = 0;

    fields.forEach((field) => {
      const span = field.span || 1;
      if (currentSpan + span > 3) {
        rows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
      currentRow.push(field);
      currentSpan += span;
    });

    if (currentRow.length) rows.push(currentRow);
    return rows;
  };

  const validateRequired = () => {
    const missing = [];

    FIELDS.forEach((field) => {
      if (!field.required) return;
      if (field.name === "email" && !emailRequired) return; // email optional unless project demands
      const v = form[field.name];
      if (v === "" || v === null || v === undefined) {
        missing.push(field.label);
      }
    });

    if (missing.length) {
      alert(`Please fill required fields: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = {};
    FIELDS.forEach((field) => {
      const raw = form[field.name];
      payload[field.name] = normalizeScalarValue(raw, field);
    });
    return payload;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequired()) return;

    const normalized = buildPayload();

    if (!normalized.project_id) {
      alert("Please select a project");
      return;
    }

    // If email is mandatory for this project, enforce presence
    if (emailRequired) {
      const email = (normalized.email || "").trim();
      if (!email) {
        alert("Email is required for this project.");
        return;
      }
    }

    const projectLeadId =
      masters?.project_lead_id ||
      masters?.project_lead?.id ||
      normalized.project_id;

    const leadPayload = {
      project_lead: projectLeadId,
      email: normalized.email,
      mobile_number: normalized.mobile_number,
      tel_res: normalized.tel_res,
      tel_office: normalized.tel_office,
      company: normalized.company,
      budget: normalized.budget,
      annual_income: normalized.annual_income,
      classification: normalized.lead_classification_id,
      sub_classification: normalized.lead_subclass_id,
      source: normalized.lead_source_id,
      sub_source: normalized.lead_sub_source_id,
      status: normalized.status_id,
      sub_status: normalized.sub_status_id,
      purpose: normalized.purpose_id,
      current_owner: normalized.lead_owner_id || null,
      assign_to: normalized.assign_to_id || null,
      offering_types:
        normalized.offering_type != null && normalized.offering_type !== ""
          ? [normalized.offering_type]
          : [],
      address: {
        flat_or_building: normalized.flat_no || "",
        area: normalized.area || "",
        pincode: normalized.pin_code || "",
        city: normalized.city || "",
        state: normalized.state || "",
        country: normalized.country || "",
        description: normalized.description || "",
      },
    };

    const body = {
      lead: leadPayload,
      first_update: {
        title: "Lead created",
        info: `${normalized.first_name || ""} ${
          normalized.last_name || ""
        }`.trim(),
      },
    };

    try {
      // If email verification is required for this project, trigger email OTP start
      if (emailRequired) {
        try {
          await api.post("/sales/sales-leads/email-otp/start/", {
            email: normalized.email,
          });
        } catch (otpErr) {
          console.error("Failed to start email verification", otpErr);
          const data = otpErr?.response?.data;
          const msg =
            (data && data.detail) ||
            (typeof data === "string" ? data : null) ||
            "Failed to start email verification.";
          alert(msg);
          return;
        }
      }

      if (isEditMode) {
        await LeadAPI.update(id, leadPayload);
        alert("Lead updated successfully!");
      } else {
        await LeadAPI.createBundle(body);
        alert("Lead created successfully!");
      }

      navigate("/leads");
    } catch (err) {
      console.error("Failed to save lead", err);

      let msg = "Failed to save lead. Please check the data.";

      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.lead && typeof data.lead === "object") {
          const firstKey = Object.keys(data.lead)[0];
          const firstVal = data.lead[firstKey];
          msg = Array.isArray(firstVal) ? firstVal.join(" ") : String(firstVal);
        }
      }

      alert(msg);
    }
  };

  const handleCancel = () => {
    navigate("/leads");
  };

  const renderField = (field) => {
    const id = `lead_form_${field.name}`;
    const disabled = false;
    const baseInputClass =
      "field-input" + (disabled ? " field-input-disabled" : "");
    const label = (
      <label htmlFor={id} className="field-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
    );

    if (field.type === "textarea") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <textarea
            id={id}
            className="field-textarea"
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
            rows={4}
          />
        </div>
      );
    }

    if (field.type === "select") {
      const options = getOptionsForField(field);
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <select
            id={id}
            className={baseInputClass}
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={
              disabled ||
              (field.name !== "project_id" && !masters && loadingMasters)
            }
          >
            <option value="">
              {field.name === "project_id"
                ? "Select project"
                : loadingMasters
                ? "Loading..."
                : "Select"}
            </option>
            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div
        key={field.name}
        className={field.span === 3 ? "form-field-full" : "form-field"}
      >
        {label}
        <input
          id={id}
          className={baseInputClass}
          type={field.type === "number" ? "number" : field.type || "text"}
          value={form[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  };

  const renderSectionGroup = (groupKey, title) => {
    const rows = buildRowsForSection(groupKey);
    if (!rows.length) return null;

    const open = openGroups[groupKey];

    return (
      <div className="form-section">
        <button
          type="button"
          className="section-header"
          onClick={() => toggleGroup(groupKey)}
        >
          <h3 className="section-title">{title}</h3>
          <svg
            className={`chevron-icon ${open ? "rotated" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className="section-content">
            {rows.map((row, idx) => (
              <div key={`${groupKey}_${idx}`} className="form-grid">
                {row.map((field) => renderField(field))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loadingLead) {
    return (
      <div className="lead-form-page">
        <div className="loading-state">Loading lead data...</div>
      </div>
    );
  }

  return (
    <div className="lead-form-page">
      <div className="lead-form-container">
        <div className="form-header">
          <h2>{isEditMode ? "Edit Lead" : "Create New Lead"}</h2>
        </div>

        <form onSubmit={onSubmit} className="lead-form">
          {renderSectionGroup("lead", "")}
          {renderSectionGroup("address", "Address Information")}
          {renderSectionGroup("description", "Description Information")}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>

            <button type="submit" className="btn-submit">
              {isEditMode ? "Update Lead" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
