import React, { useState, useEffect, useMemo } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { SetupAPI, URLS } from "../../../api/endpoints";
import api from "../../../api/axiosInstance";
import { showToast } from "../../../utils/toast";
import "./SaleAddLead.css";

function extractCityAndLocalityFromPostOffices(postOffices = []) {
  if (!Array.isArray(postOffices) || postOffices.length === 0) {
    return { city: "", locality: "" };
  }

  const city = postOffices[0]?.District || "";

  // 1️⃣ Block priority ONLY if meaningful (not NA) + East/West
  for (const po of postOffices) {
    if (po.Block && po.Block !== "NA") {
      const block = po.Block.toLowerCase();

      if (block.includes("east") || block.includes("west")) {
        return {
          city,
          locality: po.Block, // ✅ Malad West, Andheri East
        };
      }
    }
  }

  // 2️⃣ If Block is NA or useless → use Name (current location)
  for (const po of postOffices) {
    if (po.Name && po.Name !== "NA") {
      return {
        city,
        locality: po.Name, // ✅ Sakinaka, Orlem, Liberty Garden
      };
    }
  }

  // 3️⃣ Final fallback (very rare)
  return { city, locality: "" };
}
function extractLocalityOptions(postOffices = []) {
  const set = new Set();

  postOffices.forEach((po) => {
    // Block preferred if valid
    if (po.Block && po.Block !== "NA") {
      set.add(po.Block);
    }

    // Name always useful
    if (po.Name && po.Name !== "NA") {
      set.add(po.Name);
    }
  });

  return Array.from(set); // unique list
}


const SECTION_KEY = "lead_setup";

// Budget slabs (2 Cr to 7 Cr)
const BUDGET_OPTIONS = [
  { value: 20000000, label: "below 2 Cr" },
  { value: 22500000, label: "2 Cr – 2.5 Cr" },
  { value: 30000000, label: "2.5 Cr – 3 Cr" },
  { value: 32500000, label: "3 Cr – 4 Cr" },
  { value: 40000000, label: "4 Cr – 5 Cr" },
  { value: 42500000, label: "5 Cr and Above" },
];

const formatIndianNumber = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 3) return digits;

  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const restWithCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${restWithCommas},${last3}`;
};

// Helper: Convert text to title case (first letter of every word capitalized)
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  // Split by spaces and capitalize first letter of each word
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// CP Mode
const CP_MODE = {
  REGISTERED: "REGISTERED",
  UNREGISTERED: "UNREGISTERED",
};

// Field config
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
    required: true,
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
    name: "budget",
    label: "Budget",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: BUDGET_OPTIONS,
  },
  {
    section: "lead",
    name: "annual_income",
    label: "Annual Income",
    type: "text",
    required: false,
    span: 1,
    parse: "number",
    placeholder: "e.g., 15,00,000",
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
    label: "Classification",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
    hiddenWhen: (form, { masters }) => isWalkInSource(form, masters),
  },
  {
    section: "lead",
    name: "lead_subclass_id",
    label: "Sub Classification",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
    hiddenWhen: (form, { masters }) => isWalkInSource(form, masters),
  },
  // Normal lead CP type (shown when source selected and NOT walk-in)
  {
    section: "lead",
    name: "normal_cp_type",
    label: "Channel Partner Type",
    type: "cp_type",
    required: false,
    span: 1,
    parse: "identity",
    hiddenWhen: (form, { masters }) => isWalkInSource(form, masters) || !form.lead_source_id,
  },
  {
    section: "lead",
    name: "normal_cp_search",
    label: "Channel Partner",
    type: "cp_search",
    required: false,
    span: 3,
    parse: "identity",
    hiddenWhen: (form, { masters }) => isWalkInSource(form, masters) || !form.lead_source_id,
  },

  // Walk-in CP type (shown ONLY when source name starts with "walk")
  {
    section: "lead",
    name: "walkin_cp_type",
    label: "Channel Partner Type",
    type: "cp_type",
    required: false,
    span: 1,
    parse: "identity",
    hiddenWhen: (form, { masters }) => !isWalkInSource(form, masters),
  },
  {
    section: "lead",
    name: "walkin_cp_search",
    label: "Channel Partner",
    type: "cp_search",
    required: false,
    span: 3,
    parse: "identity",
    hiddenWhen: (form, { masters }) => !isWalkInSource(form, masters),
  },

  {
    section: "lead",
    name: "status_id",
    label: "Categorization",
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
    label: "Assign To (User)",
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
  // {
  //   section: "address",
  //   name: "area",
  //   label: "Area",
  //   type: "text",
  //   required: false,
  //   span: 1,
  //   parse: "identity",
  // },
  {
  section: "address",
  name: "area",
  label: "Area / Locality",
  type: "select",
  required: false,
  span: 1,
  parse: "identity",
  optionsFrom: "localityOptions", // custom
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

// ---------- helpers ----------

const ROUND_ROBIN_VALUE = "__ROUND_ROBIN__";

const buildInitialFormState = () => {
  const form = {};
  FIELDS.forEach((field) => {
    if (field.type === "checkbox" || field.type === "toggle") {
      form[field.name] = false;
    } else {
      form[field.name] = "";
    }
  });
  form.round_robin = false;
  return form;
};

// Helper to check if source is walk-in based on for_walkin property or source name
const isWalkInSource = (form, masters) => {
  if (!form.lead_source_id || !masters?.sources) return false;
  const source = masters.sources.find(
    (s) => String(s.id) === String(form.lead_source_id)
  );
  if (!source) return false;
  
  // First check for_walkin property (future-proof)
  if (source.for_walkin === true) return true;
  if (source.for_walkin === false) return false;
  
  // Fallback: check if name starts with "walk" (backward compatibility)
  const sourceName = (source.name || source.label || "").toLowerCase();
  return sourceName.startsWith("walk");
};

const evaluateExpression = (expr, { form, setup, scope }) => {
  if (!expr || typeof expr !== "string") return false;

  // Convert any "true"/"false" strings to real booleans
  const normalizedForm = JSON.parse(JSON.stringify(form), (key, value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  });

  try {
    const fn = new Function("form", "setup", "scope", `return (${expr});`);
    return !!fn(normalizedForm, setup, scope);
  } catch (err) {
    console.error("Expression error:", expr, err);
    return false;
  }
};

const resolvePathFromSetup = (setup, path) => {
  if (!path || !setup) return undefined;
  const keys = path.split(".").filter(Boolean);
  let current = setup;
  for (const k of keys) {
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
};

const normalizeScalarValue = (value, field) => {
  if (value === "" || value === undefined || value === null) return null;

  if (field.parse === "number") {
    if (field.name === "annual_income" && typeof value === "string") {
      const cleaned = value.replace(/,/g, "");
      const n = Number(cleaned);
      return Number.isNaN(n) ? null : n;
    }
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

// =================== MAIN COMPONENT ===================

const SaleAddLead = ({ handleLeadSubmit, leadId: propLeadId }) => {
  // ⭐ NEW prop leadId
  const [searchParams] = useSearchParams(); // ⭐ NEW
  const { leadId: paramLeadId } = useParams();
  const [form, setForm] = useState(buildInitialFormState);

  // Email OTP
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Modal + pending body for save (create mode)
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingSaveBody, setPendingSaveBody] = useState(null);

  // Collapsible groups
  const [openGroups, setOpenGroups] = useState({
    lead: true,
    address: true,
    description: true,
  });
  const [localityOptions, setLocalityOptions] = useState([]);

  const [projects, setProjects] = useState([]);
  const [emailRequired, setEmailRequired] = useState(false);
  const [masters, setMasters] = useState(null);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // ⭐ NEW: editing support
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const isEditing = !!editingLeadId;

  // CP search
  const [cpSearch, setCpSearch] = useState("");
  const [channelPartners, setChannelPartners] = useState([]);
  const [loadingCP, setLoadingCP] = useState(false);

  // Normal lead CP (non-walk-in)
  const [normalCpSearch, setNormalCpSearch] = useState("");
  const [normalSelectedCpId, setNormalSelectedCpId] = useState("");
  const [normalCpType, setNormalCpType] = useState(CP_MODE.REGISTERED);

  // Walk-in CP mode
  const [cpMode, setCpMode] = useState(CP_MODE.REGISTERED);
  const [selectedCpId, setSelectedCpId] = useState("");

  // Quick CP create
  const [showQuickCpModal, setShowQuickCpModal] = useState(false);
  const [quickCpForm, setQuickCpForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    company_name: "",
    pan_number: "",
    rera_number: "",
    partner_tier_id: "",
  });
  const [quickCpOtpSending, setQuickCpOtpSending] = useState(false);
  const [quickCpOtpVerifying, setQuickCpOtpVerifying] = useState(false);
  const [quickCpOtpCode, setQuickCpOtpCode] = useState("");
  const [quickCpEmailVerified, setQuickCpEmailVerified] = useState(false);

  // Partner tiers for quick CP
  const [partnerTiers, setPartnerTiers] = useState([]);

  // Phone lookup for duplicate detection
  const [lookupResult, setLookupResult] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Pincode lookup
  const [loadingPincode, setLoadingPincode] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // -------- determine if we are editing (from prop or URL) -------- ⭐ NEW
  useEffect(() => {
    const urlLeadId =
      searchParams.get("lead_id") ||
      searchParams.get("lead") ||
      searchParams.get("id");

    const rawId = propLeadId || paramLeadId || urlLeadId; // ⭐ param first
    if (rawId) {
      setEditingLeadId(Number(rawId));
    } else {
      setEditingLeadId(null);
    }
  }, [propLeadId, paramLeadId, searchParams]);

  // -------- scope (projects) --------
  useEffect(() => {
    SetupAPI.myScope()
      .then((data) => {
        const list =
          data?.projects || data?.project_list || data?.results || [];
        setProjects(list);

        // Auto-select if only 1 project (create mode only)
        if (list.length === 1 && !isEditing) {
          setForm((prev) => ({ ...prev, project_id: list[0].id }));
          setEmailRequired(!!list[0]?.email_for_lead);
        }

        // If a project already selected, refresh email requirement
        if (form.project_id) {
          const proj = list.find(
            (p) => String(p.id) === String(form.project_id)
          );
          setEmailRequired(!!proj?.email_for_lead);
        }
      })
      .catch((err) => {
        console.error("Failed to load scope", err);
        showToast("Failed to load project scope", "error");
      });
  }, [isEditing]);

  // -------- Phone lookup (10 digits + project) --------
  useEffect(() => {
    // Skip lookup in edit mode
    if (isEditing) {
      setLookupResult(null);
      return;
    }

    const digits = (form.mobile_number || "").replace(/\D/g, "");

    // New lookup start -> close modal
    setShowLookupModal(false);

    if (digits.length === 10 && form.project_id) {
      setCheckingPhone(true);
      api
        .get("/sales/sales-leads/lookup-by-phone/", {
          params: {
            phone: digits,
            project_id: form.project_id,
          },
        })
        .then((res) => {
          setLookupResult(res.data || null);
        })
        .catch((err) => {
          console.error("phone lookup failed", err);
          setLookupResult(null);
        })
        .finally(() => setCheckingPhone(false));
    } else {
      setLookupResult(null);
    }
  }, [form.mobile_number, form.project_id, isEditing]);

  // -------- Pincode lookup (6 digits) --------
  // useEffect(() => {
  //   const pincodeDigits = (form.pin_code || "").replace(/\D/g, "");

  //   if (pincodeDigits.length === 6) {
  //     setLoadingPincode(true);
  //     fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
  //       .then((res) => res.json())
  //       .then((dataArray) => {
  //         // Response is an array: [{"Message":"...","Status":"Success","PostOffice":[...]}]
  //         const response = dataArray?.[0];
  //         if (response?.Status === "Success" && response?.PostOffice?.length > 0) {
  //           const postOffice = response.PostOffice[0]; // Use first post office
  //           setForm((prev) => ({
  //             ...prev,
  //             city: postOffice.District || prev.city,
  //             state: postOffice.State || prev.state,
  //             country: postOffice.Country || prev.country,
  //             area: postOffice.Name || prev.area,
  //           }));
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("pincode lookup failed", err);
  //         // Silent fail - manual entry still available
  //       })
  //       .finally(() => setLoadingPincode(false));
  //   }
  // }, [form.pin_code]);

  useEffect(() => {
  const pincodeDigits = (form.pin_code || "").replace(/\D/g, "");

  if (pincodeDigits.length === 6) {
    setLoadingPincode(true);

    fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
      .then((res) => res.json())
      .then((dataArray) => {
        const response = dataArray?.[0];

        if (
          response?.Status === "Success" &&
          Array.isArray(response.PostOffice)
        ) {
          const postOffices = response.PostOffice;

          // ✅ Use YOUR function
          const { city, locality } =
            extractCityAndLocalityFromPostOffices(postOffices);

          // ✅ Dropdown options
          const options = extractLocalityOptions(postOffices);

          setLocalityOptions(options);

          setForm((prev) => ({
            ...prev,
            city: city || prev.city,
            area: locality || prev.area,
            state: postOffices[0]?.State || prev.state,
            country: postOffices[0]?.Country || prev.country,
          }));
        }
      })
      .catch((err) => {
        console.error("Pincode lookup failed", err);
      })
      .finally(() => setLoadingPincode(false));
  }
}, [form.pin_code]);


  // -------- masters (classification, source, status, etc.) --------
  useEffect(() => {
    if (!form.project_id) {
      setMasters(null);
      setEmailRequired(false);
      return;
    }
    const proj = projects.find((p) => String(p.id) === String(form.project_id));
    setEmailRequired(!!proj?.email_for_lead);
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
        showToast("Failed to load lead masters", "error");
      })
      .finally(() => setLoadingMasters(false));

    // Load partner tiers for quick CP
    api
      .get("/channel/partner-tiers/")
      .then((res) => {
        const list = res.data?.results || res.data || [];
        setPartnerTiers(list);
      })
      .catch((err) => {
        console.error("Failed to load partner tiers", err);
      });
  }, [form.project_id]);

  // -------- EDIT MODE: fetch lead details and prefill form -------- ⭐ NEW
  useEffect(() => {
    if (!editingLeadId) return;

    setLoadingLead(true);
    api
      .get(`/sales/sales-leads/${editingLeadId}/`, {
        params: { include_all_stage: true },
      })
      .then((res) => {
        const lead = res.data || {};

        const next = buildInitialFormState();
        next.first_name = lead.first_name || "";
        next.last_name = lead.last_name || "";
        next.email = lead.email || "";
        next.mobile_number = lead.mobile_number || "";
        next.tel_res = lead.tel_res || "";
        next.tel_office = lead.tel_office || "";
        next.project_id = lead.project || "";
        next.company = lead.company || "";
        next.budget = lead.budget || "";
        if (lead.annual_income !== null && lead.annual_income !== undefined) {
          next.annual_income = formatIndianNumber(lead.annual_income);
        } else {
          next.annual_income = "";
        }

        next.lead_classification_id = lead.classification || "";
        next.lead_subclass_id = lead.sub_classification || "";
        next.lead_source_id = lead.source || "";
        next.lead_sub_source_id = lead.sub_source || "";
        next.status_id = lead.status || "";
        next.sub_status_id = lead.sub_status || "";
        next.purpose_id = lead.purpose || "";
        next.lead_owner_id = lead.current_owner || "";
        next.assign_to_id = lead.assign_to || "";

        if (Array.isArray(lead.offering_types) && lead.offering_types.length) {
          next.offering_type = lead.offering_types[0];
        }

        if (lead.address) {
          next.flat_no = lead.address.flat_or_building || "";
          next.area = lead.address.area || "";
          next.pin_code = lead.address.pincode || "";
          next.city = lead.address.city || "";
          next.state = lead.address.state || "";
          next.country = lead.address.country || "";
          next.description = lead.address.description || "";
        }

        setForm(next);

        // Prefill CP selection - use isWalkInSource to determine if it's a walk-in
        // We need to wait for masters to load, so we'll use lead.walking as fallback
        // but prefer checking source name if available
        const isWalkIn = lead.walking || (next.lead_source_id && masters?.sources 
          ? isWalkInSource(next, masters) 
          : false);
        
        if (isWalkIn) {
          setCpMode(
            lead.unknown_channel_partner
              ? CP_MODE.UNREGISTERED
              : CP_MODE.REGISTERED
          );
          if (lead.channel_partner) {
            setSelectedCpId(String(lead.channel_partner));
            setCpSearch(lead.channel_partner_name || "");
          } else {
            setSelectedCpId("");
            setCpSearch("");
          }
          setNormalSelectedCpId("");
          setNormalCpSearch("");
        } else {
          setNormalCpType(
            lead.unknown_channel_partner
              ? CP_MODE.UNREGISTERED
              : CP_MODE.REGISTERED
          );
          if (lead.channel_partner) {
            setNormalSelectedCpId(String(lead.channel_partner));
            setNormalCpSearch(lead.channel_partner_name || "");
          } else {
            setNormalSelectedCpId("");
            setNormalCpSearch("");
          }
          setSelectedCpId("");
          setCpSearch("");
        }

        // Existing email ko verified maan lo (jab tak change nahi karta)
        setEmailVerified(true);
        setEmailOtpCode("");
      })
      .catch((err) => {
        console.error("Failed to load lead details", err);
        showToast("Failed to load lead details", "error");
      })
      .finally(() => setLoadingLead(false));
  }, [editingLeadId]);

  // ------- CP logic: walk-in vs normal -------
  useEffect(() => {
    if (!form.project_id) {
      setChannelPartners([]);
      return;
    }

    const isWalkIn = isWalkInSource(form, { masters });

    // Walk-in mode
    if (isWalkIn) {
      if (cpMode === CP_MODE.REGISTERED) {
        setLoadingCP(true);
        api
          .get("/channel/partners/by-project/", {
            params: { project_id: form.project_id },
          })
          .then((res) => {
            const list = res.data?.results || res.data || [];
            setChannelPartners(list);
          })
          .catch((err) => {
            console.error("Failed to load project CPs", err);
            setChannelPartners([]);
            showToast("Failed to load channel partners", "error");
          })
          .finally(() => setLoadingCP(false));
      } else {
        setChannelPartners([]);
      }
      return;
    }

    // Normal lead mode (not walk-in)
    const sourceId = form.lead_source_id;
    if (!sourceId) {
      setChannelPartners([]);
      return;
    }

    setLoadingCP(true);

    const params = { project_id: form.project_id };
    if (form.lead_sub_source_id) {
      params.source_id = form.lead_sub_source_id;
    } else {
      params.source_id = sourceId;
    }

    api
      .get("/channel/partners/by-project/", { params })
      .then((res) => {
        const list = res.data?.results || res.data || [];
        setChannelPartners(list);

        // Fallback: if sub-source returns empty, try main source
        if (list.length === 0 && form.lead_sub_source_id) {
          return api.get("/channel/partners/by-project/", {
            params: { project_id: form.project_id, source_id: sourceId },
          });
        }
        return null;
      })
      .then((fallbackRes) => {
        if (fallbackRes) {
          const list = fallbackRes.data?.results || fallbackRes.data || [];
          setChannelPartners(list);
        }
      })
      .catch((err) => {
        console.error("Failed to load channel partners", err);
        setChannelPartners([]);
        showToast("Failed to load channel partners", "error");
      })
      .finally(() => setLoadingCP(false));
  }, [
    form.project_id,
    masters,
    cpMode,
    form.lead_source_id,
    form.lead_sub_source_id,
  ]);

  // -------- Computed values for duplicate lead detection --------
  const existingProjectLead = useMemo(() => {
    if (!lookupResult?.present || !form.project_id) return null;
    const pid = Number(form.project_id);
    const leads = lookupResult.leads || [];
    return leads.find((lead) => Number(lead.project) === pid) || null;
  }, [lookupResult, form.project_id]);

  const hasExistingLeadInProject = !!existingProjectLead;

  const leadsForPhone = useMemo(
    () => lookupResult?.leads || [],
    [lookupResult]
  );

  const hasLeadsInOtherProjects = useMemo(
    () =>
      leadsForPhone.some(
        (lead) => String(lead.project) !== String(form.project_id)
      ),
    [leadsForPhone, form.project_id]
  );

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleChange = (name, value) => {
    setForm((prev) => {
      // ✅ 1) Annual income ke liye comma formatting
      let newValue = value;
      if (name === "annual_income") {
        const digits = String(value || "").replace(/\D/g, "");
        newValue = digits ? formatIndianNumber(digits) : "";
      }

      // ✅ 2) Mobile number and Tel fields: Only allow digits
      if (name === "mobile_number" || name === "tel_res" || name === "tel_office") {
        const digits = String(value || "").replace(/\D/g, "");
        newValue = digits;
      }

      // ✅ Auto-format text fields to Title Case (except mobile_number, tel_res, tel_office, pin_code, annual_income)
      const textFieldsToFormat = [
        "first_name",
        "last_name",
        "email",
        "company",
        "flat_no",
        "area",
        "city",
        "state",
        "country",
        "description",
      ];
      if (textFieldsToFormat.includes(name) && typeof newValue === "string" && newValue.trim()) {
        newValue = toTitleCase(newValue);
      }

      // ✅ 2) Form ka naya object ek hi baar banao
      const next = { ...prev, [name]: newValue };

      // ✅ 3) Email change => OTP reset
      if (name === "email") {
        setEmailVerified(false);
        setEmailOtpCode("");
      }

      // ✅ 4) When main source changes: reset sub-source
      if (name === "lead_source_id") {
        next.lead_sub_source_id = "";
        setSelectedCpId("");
        setCpSearch("");
        setNormalCpSearch("");
        setNormalSelectedCpId("");
      }

      if (name === "lead_sub_source_id") {
        setSelectedCpId("");
        setCpSearch("");
        setNormalCpSearch("");
        setNormalSelectedCpId("");
      }

      // ✅ 6) assign_to → round robin state (create mode only)
      if (name === "assign_to_id") {
        if (newValue === ROUND_ROBIN_VALUE) {
          next.round_robin = true;
        } else {
          next.round_robin = false;
        }
      }

      return next;
    });
  };

  // Validation functions
  const validateMobileNumber = (value) => {
    if (!value || value.trim() === "") return null; // Empty is handled by required validation
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 10) {
      return "Mobile number must be exactly 10 digits";
    }
    return null;
  };

  const validateTelField = (value) => {
    if (!value || value.trim() === "") return null; // Optional field
    const digits = value.replace(/\D/g, "");
    // Tel fields should be between 6-15 digits (landline or mobile format)
    if (digits.length < 6 || digits.length > 15) {
      return "Phone number must be between 6-15 digits";
    }
    return null;
  };

  // Handle blur event to format fields to Title Case and validate
  const handleBlur = (name, value) => {
    // Format all text fields to Title Case except mobile_number, tel_res, tel_office, pin_code, annual_income (which should stay as is)
    const textFields = [
      "first_name",
      "last_name",
      "email",
      "company",
      "flat_no",
      "area",
      "city",
      "state",
      "country",
      "description",
    ];
    if (textFields.includes(name) && value) {
      setForm((prev) => ({
        ...prev,
        [name]: toTitleCase(value),
      }));
    }

    // Validate phone fields
    let error = null;
    if (name === "mobile_number") {
      error = validateMobileNumber(value);
    } else if (name === "tel_res" || name === "tel_office") {
      error = validateTelField(value);
    }

    // Update field errors
    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSendEmailOtp = async () => {
    const email = (form.email || "").trim();
    if (!email) {
      showToast("Please enter email first.", "error");
      return;
    }

    setEmailVerified(false);
    setEmailOtpCode("");
    setEmailOtpSending(true);

    try {
      await api.post("/sales/sales-leads/email-otp/start/", { email });
      showToast("OTP sent to email.", "success");
    } catch (err) {
      console.error("Failed to send email OTP", err);
      let msg = "Failed to send OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      if (data?.email)
        msg = Array.isArray(data.email)
          ? data.email.join(" ")
          : String(data.email);
      showToast(msg, "error");
    } finally {
      setEmailOtpSending(false);
    }
  };

  const saveLead = async (body) => {
    try {
      const res = await api.post(URLS.salesLeadBundleCreate, body);
      console.log("✅ Lead create success", res.data);

      showToast("Lead saved successfully", "success");

      if (typeof handleLeadSubmit === "function") {
        handleLeadSubmit(res.data);
      }

      setForm(buildInitialFormState());
      setMasters(null);
      setChannelPartners([]);
      setEmailVerified(false);
      setEmailOtpCode("");
      setCpMode(CP_MODE.REGISTERED);
      setSelectedCpId("");
      setCpSearch("");
      setNormalCpSearch("");
      setNormalSelectedCpId("");
      setNormalCpType(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to save lead", err);

      let msg = "Failed to save lead. Please check the data.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.lead && typeof data.lead === "object") {
          const firstKey = Object.keys(data.lead)[0];
          const firstVal = data.lead[firstKey];
          msg = Array.isArray(firstVal) ? firstVal.join(" ") : String(firstVal);
        }
      }

      showToast(msg, "error");
      throw err;
    }
  };

  // ⭐ NEW: update existing lead + address
  const updateLead = async (id, leadPayload, addressPayload) => {
    try {
      await api.patch(`/sales/sales-leads/${id}/`, leadPayload);
      await api.patch(`/sales/sales-leads/${id}/address/`, addressPayload);

      showToast("Lead updated successfully", "success");
      // Navigate("/leads");
      if (typeof handleLeadSubmit === "function") {
        handleLeadSubmit({ id });
      }
    } catch (err) {
      console.error("Failed to update lead", err);
      let msg = "Failed to update lead. Please check the data.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
      throw err;
    }
  };

  const handleVerifyOtpAndSave = async () => {
    const email = (form.email || "").trim();
    const otp = (emailOtpCode || "").trim();

    if (!email) {
      showToast("Please enter email first.", "error");
      return;
    }
    if (!otp) {
      showToast("Please enter OTP.", "error");
      return;
    }

    setEmailOtpVerifying(true);
    try {
      const res = await api.post("/sales/sales-leads/email-otp/verify/", {
        email,
        otp,
      });

      showToast(res.data?.detail || "Email verified.", "success");
      setEmailVerified(true);

      if (pendingSaveBody) {
        await saveLead(pendingSaveBody);
        setPendingSaveBody(null);
        setShowEmailOtpModal(false);
      } else {
        setShowEmailOtpModal(false);
      }
    } catch (err) {
      console.error("Failed to verify email OTP", err);
      setEmailVerified(false);
      let msg = "Failed to verify OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  // Quick CP OTP
  const handleSendQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }

    setQuickCpEmailVerified(false);
    setQuickCpOtpCode("");
    setQuickCpOtpSending(true);

    try {
      await api.post("/sales/sales-leads/email-otp/start/", { email });
      showToast("OTP sent to CP email.", "success");
    } catch (err) {
      console.error("Failed to send quick CP OTP", err);
      let msg = "Failed to send OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpSending(false);
    }
  };

  const handleVerifyQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    const otp = (quickCpOtpCode || "").trim();

    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }
    if (!otp) {
      showToast("Please enter OTP.", "error");
      return;
    }

    setQuickCpOtpVerifying(true);
    try {
      await api.post("/sales/sales-leads/email-otp/verify/", { email, otp });
      showToast("CP email verified.", "success");
      setQuickCpEmailVerified(true);
    } catch (err) {
      console.error("Failed to verify quick CP OTP", err);
      setQuickCpEmailVerified(false);
      let msg = "Failed to verify OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpVerifying(false);
    }
  };

  const handleQuickCpCreate = async () => {
    if (!quickCpEmailVerified) {
      showToast("Please verify CP email first.", "error");
      return;
    }

    if (
      !quickCpForm.name ||
      !quickCpForm.email ||
      !quickCpForm.partner_tier_id
    ) {
      showToast("Name, Email, and Partner Tier are required.", "error");
      return;
    }

    try {
      const body = {
        name: quickCpForm.name,
        email: quickCpForm.email,
        mobile_number: quickCpForm.mobile_number || "",
        company_name: quickCpForm.company_name || "",
        pan_number: quickCpForm.pan_number || "",
        rera_number: quickCpForm.rera_number || "",
        partner_tier_id: quickCpForm.partner_tier_id,
        project_id: form.project_id,
      };

      const res = await api.post("/channel/partners/quick-create/", body);
      showToast("Channel Partner created successfully.", "success");

      const newCp = res.data;

      // Reload project CPs
      const reloadRes = await api.get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      });
      const list = reloadRes.data?.results || reloadRes.data || [];
      setChannelPartners(list);

      // Auto-select newly created CP
      setSelectedCpId(newCp.id);

      // Close modal
      setShowQuickCpModal(false);
      setQuickCpForm({
        name: "",
        email: "",
        mobile_number: "",
        company_name: "",
        pan_number: "",
        rera_number: "",
        partner_tier_id: "",
      });
      setQuickCpOtpCode("");
      setQuickCpEmailVerified(false);
    } catch (err) {
      console.error("Failed to create quick CP", err);
      let msg = "Failed to create Channel Partner.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    }
  };

  const isFieldHidden = (field) =>
    typeof field.hiddenWhen === "function"
      ? field.hiddenWhen(form, { masters, projects })
      : false;

  const isFieldDisabled = (field) =>
    evaluateExpression(field.disabledWhen, {
      form,
      setup: { masters, projects },
      scope: null,
    });

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
    if (field.name === "area") {
    return localityOptions.map((loc) => ({
      value: loc,
      label: loc,
    }));
  }


    if (field.name === "budget") {
      return BUDGET_OPTIONS;
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

      case "lead_source_id": {
        // Show all sources including walk-in sources
        return toOptions(masters.sources);
      }

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
        return (masters.assign_users || []).map((u) => ({
          value: u.id,
          label: u.name || u.username,
        }));

      case "assign_to_id": {
        const userOptions = (masters.assign_users || []).map((u) => ({
          value: u.id,
          label: u.name || u.username,
        }));
        // Edit mode me Round Robin mat dikhana (sirf create ke liye) ⭐ NEW
        if (isEditing) {
          return userOptions;
        }
        return [
          { value: ROUND_ROBIN_VALUE, label: "Round Robin" },
          ...userOptions,
        ];
      }

      default: {
        if (field.options && field.options.length) return field.options;

        if (field.optionsFrom) {
          const src = resolvePathFromSetup(
            { masters, projects },
            field.optionsFrom
          );
          if (Array.isArray(src)) {
            const valueKey = field.valueKey || "id";
            const labelKey = field.labelKey || "name";
            return src.map((item) => ({
              value: item[valueKey],
              label: item[labelKey],
            }));
          }
        }
        return [];
      }
    }
  };

  const buildRowsForSection = (sectionName) => {
    const fields = FIELDS.filter((f) => f.section === sectionName);
    const rows = [];
    let currentRow = [];
    let currentSpan = 0;

    fields.forEach((field) => {
      if (isFieldHidden(field)) return;

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
    const validationErrors = {};

    FIELDS.forEach((field) => {
      if (!field.required || isFieldHidden(field)) return;
      if (field.name === "email" && !emailRequired) return;
      const v = form[field.name];
      if (v === "" || v === null || v === undefined) {
        missing.push(field.label);
      }
    });

    const isWalkIn = isWalkInSource(form, { masters });
    
    // Walk-in CP validation
    if (isWalkIn && cpMode === CP_MODE.REGISTERED && !selectedCpId) {
      missing.push("Channel Partner (Registered)");
    }

    if (
      !isWalkIn &&
      normalCpType === CP_MODE.REGISTERED &&
      !normalSelectedCpId
    ) {
      // optional: if you want to force CP for non-walk-in
      // missing.push("Channel Partner (Registered)");
    }

    // Validate mobile number
    if (form.mobile_number) {
      const mobileError = validateMobileNumber(form.mobile_number);
      if (mobileError) {
        validationErrors.mobile_number = mobileError;
      }
    }

    // Validate tel fields
    if (form.tel_res) {
      const telResError = validateTelField(form.tel_res);
      if (telResError) {
        validationErrors.tel_res = telResError;
      }
    }

    if (form.tel_office) {
      const telOfficeError = validateTelField(form.tel_office);
      if (telOfficeError) {
        validationErrors.tel_office = telOfficeError;
      }
    }

    // Update field errors
    setFieldErrors(validationErrors);

    // Duplicate lead validation (create mode only)
    if (!isEditing && hasExistingLeadInProject) {
      showToast(
        "This customer is already part of this project. Please edit the existing lead instead.",
        "error"
      );
      return false;
    }

    if (missing.length) {
      window.alert("Please fill required fields:\n" + missing.join("\n"));
      return false;
    }

    if (Object.keys(validationErrors).length > 0) {
      showToast("Please fix validation errors in the form", "error");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const payload = {};
    FIELDS.forEach((field) => {
      if (isFieldHidden(field)) return;
      const raw = form[field.name];
      payload[field.name] = normalizeScalarValue(raw, field);
    });
    return payload;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequired()) return;

    const normalized = buildPayload();
    const isRoundRobin = normalized.assign_to_id === ROUND_ROBIN_VALUE;
    const nowEditing = !!editingLeadId;

    if (!normalized.project_id) {
      showToast("Please select a project", "error");
      return;
    }

    // Address payload (for both create & update)
    const addressPayload = {
      flat_or_building: normalized.flat_no || "",
      area: normalized.area || "",
      pincode: normalized.pin_code || "",
      city: normalized.city || "",
      state: normalized.state || "",
      country: normalized.country || "",
      description: normalized.description || "",
    };

    // Core lead payload (shared) – WITHOUT address / round_robin
    const leadPayload = {
      project: normalized.project_id,
      first_name: normalized.first_name || null,
      last_name: normalized.last_name || null,

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

      walking: isWalkInSource(form, { masters }),

      offering_types:
        normalized.offering_type != null && normalized.offering_type !== ""
          ? [normalized.offering_type]
          : [],
    };

    const isWalkIn = isWalkInSource(form, { masters });

    // Walk-in CP logic
    if (isWalkIn) {
      if (cpMode === CP_MODE.REGISTERED && selectedCpId) {
        leadPayload.channel_partner = selectedCpId;
        leadPayload.unknown_channel_partner = "";
      } else {
        leadPayload.channel_partner = null;
        leadPayload.unknown_channel_partner = "";
      }
    } else {
      // Normal lead: use normalSelectedCpId if source selected
      if (normalSelectedCpId) {
        leadPayload.channel_partner = normalSelectedCpId;
        leadPayload.unknown_channel_partner = "";
      } else {
        leadPayload.channel_partner = null;
        leadPayload.unknown_channel_partner = "";
      }
    }

    if (
      !isRoundRobin &&
      normalized.assign_to_id != null &&
      normalized.assign_to_id !== ""
    ) {
      leadPayload.assign_to = normalized.assign_to_id;
    }

    if (!nowEditing) {
      // -------- CREATE FLOW (bundle-create) --------
      const createLeadPayload = {
        ...leadPayload,
        round_robin: isRoundRobin,
        address: addressPayload,
      };

      const body = {
        lead: createLeadPayload,
        first_update: {
          title: "Lead created",
          info: `${normalized.first_name || ""} ${
            normalized.last_name || ""
          }`.trim(),
        },
      };

      // Email OTP check (only for create)
      if (emailRequired && normalized.email && !emailVerified) {
        setPendingSaveBody(body);
        setShowEmailOtpModal(true);
        setEmailOtpCode("");
        handleSendEmailOtp();
        return;
      }

      await saveLead(body);
    } else {
      // -------- UPDATE FLOW --------
      await updateLead(editingLeadId, leadPayload, addressPayload);
    }
  };

  const handleCancel = () => {
    setForm(buildInitialFormState());
    setMasters(null);
    setChannelPartners([]);
    setEmailVerified(false);
    setEmailOtpCode("");
    setCpMode(CP_MODE.REGISTERED);
    setSelectedCpId("");
    setCpSearch("");
    setNormalCpSearch("");
    setNormalSelectedCpId("");
    setNormalCpType(CP_MODE.REGISTERED);
  };

  const renderField = (field) => {
    const id = `${SECTION_KEY}_${field.name}`;
    const disabledExpr = isFieldDisabled(field);

    const extraDisabled =
      loadingLead || // ⭐ NEW: disable while loading existing lead
      (field.name !== "project_id" && !masters && loadingMasters) ||
      (field.name === "channel_partner_id" && loadingCP);

    const disabled = disabledExpr || extraDisabled;

    const baseInputClass =
      "form-input" + (disabled ? " form-input-disabled" : "");
    const label = (
      <label htmlFor={id} className="form-label">
        {field.label}
        {((field.name === "email" && emailRequired) ||
          (field.name !== "email" && field.required)) && (
          <span className="required">*</span>
        )}
      </label>
    );

    if (field.type === "toggle") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label className="form-label">{field.label}</label>
          <div className="toggle-container">
            <div
              className={`toggle ${form[field.name] ? "on" : "off"}`}
              onClick={() => handleChange(field.name, !form[field.name])}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>
      );
    }

    // CP Type dropdown (for normal leads)
    if (field.type === "cp_type") {
      // Determine which CP type to use based on source name
      const isWalkIn = isWalkInSource(form, { masters });
      const currentCpType = isWalkIn ? cpMode : normalCpType;
      const setCpTypeFunc = isWalkIn ? setCpMode : setNormalCpType;

      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          <select
            className="form-input"
            value={currentCpType}
            onChange={(e) => {
              setCpTypeFunc(e.target.value);
              setSelectedCpId("");
              setCpSearch("");
              setNormalSelectedCpId("");
              setNormalCpSearch("");
            }}
          >
            <option value={CP_MODE.REGISTERED}>Registered</option>
            <option value={CP_MODE.UNREGISTERED}>Unregistered</option>
          </select>
        </div>
      );
    }

    // CP Search field type (for both walk-in and normal leads)
    if (field.type === "cp_search") {
      // Determine which mode we're in based on source name
      const isWalkIn = isWalkInSource(form, { masters });
      const currentCpType = isWalkIn ? cpMode : normalCpType;
      const currentSearch = isWalkIn ? cpSearch : normalCpSearch;
      const setCurrentSearch = isWalkIn ? setCpSearch : setNormalCpSearch;
      const currentSelectedId = isWalkIn ? selectedCpId : normalSelectedCpId;
      const setCurrentSelectedId = isWalkIn
        ? setSelectedCpId
        : setNormalSelectedCpId;

      // If unregistered, show create button
      if (currentCpType === CP_MODE.UNREGISTERED) {
        return (
          <div
            key={field.name}
            className={field.span === 3 ? "form-field-full" : "form-field"}
          >
            <label className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowQuickCpModal(true)}
              style={{ width: "auto" }}
            >
              + Create New Channel Partner
            </button>
          </div>
        );
      }

      // Registered mode - show search + dropdown
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label className="form-label">
            {field.label} (Type to search)
            {field.required && <span className="required">*</span>}
          </label>
          <div className="searchable-select">
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, company, email..."
              value={currentSearch}
              onChange={(e) => {
                setCurrentSearch(e.target.value);
                if (currentSelectedId && e.target.value) {
                  setCurrentSelectedId("");
                }
              }}
              disabled={loadingCP}
            />
            {(() => {
              const filteredCPs = channelPartners.filter((cp) => {
                if (!currentSearch) return false; // Only show when user is typing
                const term = currentSearch.toLowerCase();
                const fullName =
                  cp.full_name ||
                  cp.user?.full_name ||
                  [
                    cp.first_name || cp.user?.first_name,
                    cp.last_name || cp.user?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ");
                const companyName = cp.company_name || "";
                const email = cp.email || cp.user?.email || "";
                const searchString =
                  `${fullName} ${companyName} ${email}`.toLowerCase();
                return searchString.includes(term);
              });

              // Only show dropdown if there are filtered results or user is searching
              if (!currentSearch && filteredCPs.length === 0) {
                return null;
              }

              return (
                <select
                  className="form-input cp-search-dropdown"
                  style={{ marginTop: "8px" }}
                  value={currentSelectedId}
                  onChange={(e) => {
                    setCurrentSelectedId(e.target.value);
                    if (e.target.value) {
                      const selected = channelPartners.find(
                        (cp) => cp.id === parseInt(e.target.value, 10)
                      );
                      if (selected) {
                        const fullName =
                          selected.full_name ||
                          selected.user?.full_name ||
                          [
                            selected.first_name || selected.user?.first_name,
                            selected.last_name || selected.user?.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ");
                        const mainLabel =
                          fullName ||
                          selected.company_name ||
                          selected.email ||
                          selected.user?.email ||
                          `CP #${selected.id}`;
                        setCurrentSearch(mainLabel);
                      }
                    }
                  }}
                  disabled={loadingCP}
                  size={Math.min(filteredCPs.length + 1, 6)}
                >
                  <option value="">
                    {loadingCP
                      ? "Loading..."
                      : currentSearch && filteredCPs.length === 0
                      ? "— No results found —"
                      : currentSearch
                      ? "— Select from filtered results —"
                      : "— Start typing to search —"}
                  </option>
                  {filteredCPs.map((cp) => {
                    const fullName =
                      cp.full_name ||
                      cp.user?.full_name ||
                      [
                        cp.first_name || cp.user?.first_name,
                        cp.last_name || cp.user?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");
                    const mainLabel =
                      fullName ||
                      cp.company_name ||
                      cp.email ||
                      cp.user?.email ||
                      `CP #${cp.id}`;
                    const extra =
                      cp.company_name && fullName ? ` (${cp.company_name})` : "";
                    return (
                      <option key={cp.id} value={cp.id}>
                        {mainLabel}
                        {extra}
                      </option>
                    );
                  })}
                </select>
              );
            })()}
          </div>
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label className="form-label checkbox-label">
            <input
              id={id}
              type="checkbox"
              checked={!!form[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={disabled}
              style={{ marginRight: "8px" }}
            />
            {field.label}
          </label>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <textarea
            id={id}
            className="form-textarea"
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={(e) => handleBlur(field.name, e.target.value)}
            disabled={disabled}
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
            disabled={disabled}
          >
            <option value="">
              {field.name === "project_id"
                ? "Select project"
                : loadingMasters && field.name !== "project_id"
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

    // Special handling for mobile_number field with duplicate detection
    if (field.name === "mobile_number") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <input
            id={id}
            className={baseInputClass + (fieldErrors[field.name] ? " form-input-error" : "")}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form[field.name] || ""}
            onChange={(e) => {
              handleChange(field.name, e.target.value);
              // Clear error on change
              if (fieldErrors[field.name]) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.name];
                  return next;
                });
              }
            }}
            onBlur={(e) => handleBlur(field.name, e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder || "10 digit mobile number"}
            maxLength={10}
          />
          {fieldErrors[field.name] && (
            <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
              {fieldErrors[field.name]}
            </div>
          )}
        </div>
      );
    }

    // Add class for tel fields to prevent height increase
    const isTelField = field.name === "tel_res" || field.name === "tel_office";
    const isPincodeField = field.name === "pin_code";
    
    // Special handling for pin_code field
    if (isPincodeField) {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label htmlFor={id} className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
            {loadingPincode && (
              <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4, fontWeight: "normal" }}>
                (Looking up...)
              </span>
            )}
          </label>
          <input
            id={id}
            className={baseInputClass + (fieldErrors[field.name] ? " form-input-error" : "")}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form[field.name] || ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              handleChange(field.name, digits);
              // Clear error on change
              if (fieldErrors[field.name]) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.name];
                  return next;
                });
              }
            }}
            onBlur={(e) => handleBlur(field.name, e.target.value)}
            disabled={disabled}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
          />
          {fieldErrors[field.name] && (
            <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
              {fieldErrors[field.name]}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div
        key={field.name}
        className={
          field.span === 3
            ? "form-field-full"
            : isTelField
            ? "form-field form-field-tel"
            : "form-field"
        }
      >
        {label}
        <input
          id={id}
          className={baseInputClass + (fieldErrors[field.name] ? " form-input-error" : "")}
          type={isTelField ? "text" : (field.type === "number" ? "number" : field.type || "text")}
          inputMode={isTelField ? "numeric" : undefined}
          pattern={isTelField ? "[0-9]*" : undefined}
          value={form[field.name] || ""}
          onChange={(e) => {
            handleChange(field.name, e.target.value);
            // Clear error on change
            if (fieldErrors[field.name]) {
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field.name];
                return next;
              });
            }
          }}
          onBlur={(e) => handleBlur(field.name, e.target.value)}
          disabled={disabled}
          placeholder={
            isTelField
              ? "6-15 digits"
              : field.name === "city" || field.name === "state" || field.name === "country" || field.name === "area"
              ? "Auto-filled from pincode"
              : field.placeholder || ""
          }
          maxLength={isTelField ? 15 : undefined}
        />
        {fieldErrors[field.name] && (
          <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
            {fieldErrors[field.name]}
          </div>
        )}
      </div>
    );
  };

  const renderSectionGroup = (groupKey, title) => {
    const rows = buildRowsForSection(groupKey);
    if (!rows.length && groupKey !== "lead") return null;

    const open = openGroups[groupKey];

    return (
      <div style={{ marginBottom: "12px" }}>
        <button
          type="button"
          className="section-header"
          onClick={() => toggleGroup(groupKey)}
        >
          <div className="section-title">{title}</div>
          <div className={`chevron-icon ${open ? "open" : ""}`}>⌄</div>
        </button>

        {open && (
          <div style={{ marginTop: "10px" }}>
            {rows.map((row, idx) => {
              const totalSpan = row.reduce((sum, f) => sum + (f.span || 1), 0);
              const rowClass =
                totalSpan === 2 && row.length <= 2 ? "form-row-2" : "form-row";

              return (
                <div key={`${groupKey}_${idx}`} className={rowClass}>
                  {row.map((field) => renderField(field))}
                </div>
              );
            })}

            {/* Email info for lead group */}
            {groupKey === "lead" && emailRequired && (
              <div className="form-row">
                <div className="form-field-full">
                  <span
                    style={{
                      fontSize: 13,
                      color: form.email
                        ? emailVerified
                          ? "#16a34a"
                          : "#ef4444"
                        : "#ef4444",
                    }}
                  >
                    {form.email
                      ? isEditing
                        ? // Edit mode text
                          emailVerified
                          ? "Email already verified."
                          : "If you change email, please verify with OTP."
                        : // Create mode text
                        emailVerified
                        ? "Email verified via OTP."
                        : "On Submit, an OTP will be sent to this email. Verification is required to save the lead."
                      : "Email is required. Please enter a valid email address."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="setup-section" id={SECTION_KEY}>
      <div className="section-content">
        {isEditing && (
          <div style={{ marginBottom: "10px", fontSize: 13, color: "#555" }}>
            Editing Lead #{editingLeadId}
            {loadingLead && " – Loading details..."}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Duplicate detection alerts - shown at top to avoid affecting field layout */}
          {!isEditing && (checkingPhone || lookupResult) && (
            <div style={{ marginBottom: "16px" }}>
              {(checkingPhone || lookupResult?.present) && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "6px",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fbbf24",
                    fontSize: "14px",
                    marginBottom: lookupResult?.present && existingProjectLead ? "8px" : "0",
                  }}
                >
                  {checkingPhone ? (
                    <span>Checking existing records…</span>
                  ) : lookupResult?.present ? (
                    <>
                      <span>
                        Lead / opportunity already exists for this mobile. Leads:{" "}
                        {lookupResult.lead_count || 0}, Opportunities:{" "}
                        {lookupResult.opportunity_count || 0}.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLookupModal(true)}
                        style={{
                          marginLeft: "8px",
                          color: "#1d4ed8",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        View more
                      </button>
                    </>
                  ) : null}
                </div>
              )}

              {!checkingPhone &&
                lookupResult?.present &&
                existingProjectLead && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "6px",
                      backgroundColor: "#fee2e2",
                      border: "1px solid #ef4444",
                      fontSize: "14px",
                      color: "#991b1b",
                      marginBottom: "8px",
                    }}
                  >
                    This customer is already registered in this project. Please edit
                    the existing lead instead.
                  </div>
                )}

              {!checkingPhone &&
                !hasExistingLeadInProject &&
                lookupResult?.present &&
                lookupResult.leads?.length > 0 && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "6px",
                      backgroundColor: "#dbeafe",
                      border: "1px solid #3b82f6",
                      fontSize: "14px",
                      color: "#1e40af",
                    }}
                  >
                    This customer already exists in another project. You can copy
                    their data if needed.
                  </div>
                )}
            </div>
          )}

          {renderSectionGroup("lead", "Lead Information")}
          {renderSectionGroup("address", "Address Information")}
          {renderSectionGroup("description", "Description Information")}

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
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={loadingLead}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loadingLead || (!isEditing && hasExistingLeadInProject)}
                >
                  {isEditing ? "Update Lead" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Email OTP Modal (CREATE mode only) */}
      {!isEditing && showEmailOtpModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Verify Email</h3>
            <p className="modal-text">
              We have sent an OTP to <strong>{form.email}</strong>. Please enter
              it below to verify the email and save the lead.
            </p>

            <div className="modal-otp-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSendEmailOtp}
                disabled={emailOtpSending}
              >
                {emailOtpSending ? "Resending..." : "Resend OTP"}
              </button>

              <input
                type="text"
                className="form-input"
                style={{ maxWidth: "140px" }}
                placeholder="Enter OTP"
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowEmailOtpModal(false);
                  setPendingSaveBody(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleVerifyOtpAndSave}
                disabled={emailOtpVerifying}
              >
                {emailOtpVerifying ? "Verifying..." : "Verify & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick CP Create Modal */}
      {showQuickCpModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3 className="modal-title">Create New Channel Partner</h3>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    name: e.target.value ? toTitleCase(e.target.value) : "",
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Email<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={quickCpForm.email}
                  onChange={(e) => {
                    setQuickCpForm((prev) => ({
                      ...prev,
                      email: e.target.value ? toTitleCase(e.target.value) : "",
                    }));
                    setQuickCpEmailVerified(false);
                    setQuickCpOtpCode("");
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSendQuickCpOtp}
                  disabled={quickCpOtpSending}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpSending ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                OTP<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter OTP"
                  value={quickCpOtpCode}
                  onChange={(e) => setQuickCpOtpCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleVerifyQuickCpOtp}
                  disabled={quickCpOtpVerifying}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
              {quickCpEmailVerified && (
                <span style={{ fontSize: 12, color: "#16a34a" }}>
                  ✓ Email verified
                </span>
              )}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Partner Tier<span className="required">*</span>
              </label>
              <select
                className="form-input"
                value={quickCpForm.partner_tier_id}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    partner_tier_id: e.target.value,
                  }))
                }
              >
                <option value="">Select Partner Tier</option>
                {partnerTiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name || tier.title || `Tier #${tier.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.mobile_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    mobile_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.company_name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    company_name: e.target.value ? toTitleCase(e.target.value) : "",
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.pan_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    pan_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">RERA Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.rera_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    rera_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowQuickCpModal(false);
                  setQuickCpForm({
                    name: "",
                    email: "",
                    mobile_number: "",
                    company_name: "",
                    pan_number: "",
                    rera_number: "",
                    partner_tier_id: "",
                  });
                  setQuickCpOtpCode("");
                  setQuickCpEmailVerified(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleQuickCpCreate}
              >
                Create CP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing lead details modal */}
      {showLookupModal && lookupResult?.present && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "800px" }}>
            <h3 className="modal-title">Existing Lead Details</h3>

            {leadsForPhone.length === 0 ? (
              <div className="onsite-helper">No lead details available.</div>
            ) : (
              leadsForPhone.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    #{lead.id} –{" "}
                    {lead.full_name ||
                      `${lead.first_name || ""} ${lead.last_name || ""}`.trim()}
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Project:</strong> {lead.project} &nbsp;|&nbsp;
                    <strong>Phone:</strong> {lead.mobile_number} &nbsp;|&nbsp;
                    <strong>Email:</strong> {lead.email || "-"}
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Status:</strong> {lead.status_name || "-"}{" "}
                    &nbsp;|&nbsp;
                    <strong>Purpose:</strong> {lead.purpose_name || "-"}
                  </div>

                  {lead.address && (
                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      <strong>Address:</strong>{" "}
                      {[
                        lead.address.flat_or_building,
                        lead.address.area,
                        lead.address.city,
                        lead.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}

                  {lead.last_update ? (
                    <div
                      style={{
                        fontSize: 13,
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        marginTop: 4,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        Last Update ({lead.last_update.type}):
                      </div>
                      <div>{lead.last_update.title || "-"}</div>
                      <div style={{ marginTop: 2 }}>
                        <strong>On:</strong>{" "}
                        {lead.last_update.event_date
                          ? lead.last_update.event_date
                              .slice(0, 16)
                              .replace("T", " ")
                          : "-"}
                        {"  "} | <strong>By:</strong>{" "}
                        {lead.last_update.created_by || "-"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      No updates recorded yet.
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowLookupModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleAddLead;
