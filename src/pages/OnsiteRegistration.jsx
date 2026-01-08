import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance"; // adjust path if needed
import { showToast } from "../utils/toast";
import "./OnsiteRegistration.css";

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

const SCOPE_URL = "/client/my-scope/";
const ONSITE_API = "/sales/onsite-registration/";
const LEAD_MASTERS_API = "/leadManagement/v2/leads/masters/";

// CP Mode
const CP_MODE = {
  REGISTERED: "REGISTERED",
  UNREGISTERED: "UNREGISTERED",
};

// enums (must match backend TextChoices)
const NATIONALITY_OPTIONS = [
  { value: "INDIAN", label: "Indian" },
  { value: "NRI", label: "NRI" },
  { value: "OTHER", label: "Others" },
];

const AGE_GROUP_OPTIONS = [
  { value: "20_25", label: "20-25" },
  { value: "26_35", label: "26-35" },
  { value: "36_45", label: "36-45" },
  { value: "46_60", label: "46-60" },
  { value: "GT60", label: ">60" },
];

// Budget slabs (start from 1 Cr)
const BUDGET_OPTIONS = [
  { value: 10000000, label: " below 2 cr" },
  { value: 15000000, label: "2 to 2.5 cr" },
  { value: 20000000, label: "2.5 to 3 cr" },
  { value: 25000000, label: "3-4 cr" },
  { value: 30000000, label: "4-5 cr" },
  { value: 35000000, label: "5cr and above" },
];

const initialForm = {
  project_id: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  email: "",

  nationality: "",
  age_group: "",

  unit_configuration_id: "",
  budget: "",

  // Source / Sub-source / Purpose
  source_id: "",
  sub_source_id: "",
  purpose_id: "",

  // Residential address
  residential_address: "",
  residence_city: "",
  residence_locality: "",
  residence_pincode: "",

  // CP
  channel_partner_id: "",
};

export default function OnsiteRegistration() {
  const [form, setForm] = useState(initialForm);

  const [scopeLoading, setScopeLoading] = useState(true);
  const [projects, setProjects] = useState([]);
const successModalTimerRef = useRef(null);
  const navigate = useNavigate();

const [quickCpLoadingPincode, setQuickCpLoadingPincode] = useState(false);
const [quickCpLocalityOptions, setQuickCpLocalityOptions] = useState([]);

const handleQuickCpAddressChange = (field, value) => {
  setQuickCpForm((prev) => ({
    ...prev,
    address: {
      ...(prev.address || {}),
      [field]: value,
    },
  }));
};

  // masters for project
  const [mastersLoading, setMastersLoading] = useState(false);
  const [unitConfigs, setUnitConfigs] = useState([]);
  const [sourcesTree, setSourcesTree] = useState([]);
  const [purposes, setPurposes] = useState([]);

  const [cpLoading, setCpLoading] = useState(false);
  const [channelPartners, setChannelPartners] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [localityOptions, setLocalityOptions] = useState([]);

  const [lookupResult, setLookupResult] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [brandLogo, setBrandLogo] = useState("");
  const [companyName, setCompanyName] = useState("");
  // ---------- Owner / Assign To ----------
  //const [assignableUsers, setAssignableUsers] = useState([]);

  const [ownerId, setOwnerId] = useState("");
  const [masters, setMasters] = useState(null);

  // Pincode lookup
  const [loadingPincode, setLoadingPincode] = useState(false);

  // ---------- CP state (REGISTERED vs UNREGISTERED) ----------
  const [cpMode, setCpMode] = useState(CP_MODE.REGISTERED);

  const existingProjectLead = useMemo(() => {
    if (!lookupResult?.present || !form.project_id) return null;
    const pid = Number(form.project_id);
    const leads = lookupResult.leads || [];
    return leads.find((lead) => Number(lead.project) === pid) || null;
  }, [lookupResult, form.project_id]);

  // Quick CP create modal + form
  const [showQuickCpModal, setShowQuickCpModal] = useState(false);
const [quickCpForm, setQuickCpForm] = useState({
  name: "",
  email: "",
  mobile_number: "",
  company_name: "",
  pan_number: "",
  rera_number: "",
  partner_tier_id: "",
  address: {
    line1: "",
    line2: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
});

  const [quickCpOtpSending, setQuickCpOtpSending] = useState(false);
  const [quickCpOtpVerifying, setQuickCpOtpVerifying] = useState(false);
  const [quickCpOtpCode, setQuickCpOtpCode] = useState("");
  const [quickCpEmailVerified, setQuickCpEmailVerified] = useState(false);
  const [partnerTiers, setPartnerTiers] = useState([]);


  useEffect(() => {
    return () => {
      if (successModalTimerRef.current) {
        clearTimeout(successModalTimerRef.current);
      }
    };
  }, []);


  const assignableUsers = useMemo(() => {
    return masters?.assign_users || [];
  }, [masters]);

  // ---------- Phone lookup (10 digits + project) ----------
  useEffect(() => {
    const digits = (form.mobile_number || "").replace(/\D/g, "");

    // naya lookup start -> close modal
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
  }, [form.mobile_number, form.project_id]);

  // ---------- Pincode lookup (6 digits) ----------

  useEffect(() => {
    const pincode = (form.residence_pincode || "").replace(/\D/g, "");

    // 🔴 Reset auto fields when pincode incomplete
    if (pincode.length < 6) {
      setForm((prev) => ({
        ...prev,
        residence_city: "",
        residence_locality: "",
      }));
      return;
    }

    if (pincode.length !== 6) return;

    setLoadingPincode(true);

    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then((res) => res.json())
      .then((dataArray) => {
        const response = dataArray?.[0];

        if (
          response?.Status === "Success" &&
          Array.isArray(response.PostOffice) &&
          response.PostOffice.length > 0
        ) {
          const postOffices = response.PostOffice;

          // 1️⃣ city + best locality (auto select)
          const { city, locality } =
            extractCityAndLocalityFromPostOffices(postOffices);

          // 2️⃣ dropdown options
          const options = extractLocalityOptions(postOffices);

          setLocalityOptions(options);

          setForm((prev) => ({
            ...prev,
            residence_city: city,
            residence_locality: locality || "", // safe
          }));
        }
      })
      .catch((err) => {
        console.error("pincode lookup failed", err);
      })
      .finally(() => setLoadingPincode(false));
  }, [form.residence_pincode]);


  useEffect(() => {
    const pincode = (quickCpForm.address?.pincode || "").replace(/\D/g, "");

    // reset when incomplete
    if (pincode.length < 6) {
      setQuickCpLocalityOptions([]);
      setQuickCpForm((prev) => ({
        ...prev,
        address: {
          ...(prev.address || {}),
          city: "",
          state: "",
          area: "",
        },
      }));
      return;
    }

    if (pincode.length !== 6) return;

    setQuickCpLoadingPincode(true);

    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then((res) => res.json())
      .then((dataArray) => {
        const response = dataArray?.[0];

        if (
          response?.Status === "Success" &&
          Array.isArray(response.PostOffice) &&
          response.PostOffice.length > 0
        ) {
          const postOffices = response.PostOffice;

          const { city, locality } =
            extractCityAndLocalityFromPostOffices(postOffices);

          const state = postOffices?.[0]?.State || "";
          const options = extractLocalityOptions(postOffices);

          setQuickCpLocalityOptions(options);

          setQuickCpForm((prev) => ({
            ...prev,
            address: {
              ...(prev.address || {}),
              pincode,
              city: city || "",
              state: state || "",
              area: locality || prev.address?.area || "",
            },
          }));
        }
      })
      .catch((err) => console.error("Quick CP pincode lookup failed", err))
      .finally(() => setQuickCpLoadingPincode(false));
  }, [quickCpForm.address?.pincode]);


  // useEffect(() => {
  //   const pincodeDigits = (form.residence_pincode || "").replace(/\D/g, "");

  //   if (pincodeDigits.length === 6) {
  //     setLoadingPincode(true);
  //     fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
  //       .then((res) => res.json())
  //       .then((dataArray) => {
  //         // Response is an array: [{"Message":"...","Status":"Success","PostOffice":[...]}]
  //         const response = dataArray?.[0];
  //         if (
  //           response?.Status === "Success" &&
  //           response?.PostOffice?.length > 0
  //         ) {
  //           const postOffice = response.PostOffice[0]; // Use first post office
  //           setForm((prev) => ({
  //             ...prev,
  //             residence_city: postOffice.District || prev.residence_city,
  //             residence_locality: postOffice.Name || prev.residence_locality,
  //           }));
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("pincode lookup failed", err);
  //         // Silent fail - manual entry still available
  //       })
  //       .finally(() => setLoadingPincode(false));
  //   }
  // }, [form.residence_pincode]);

  //   // ---------- Load assignable users for project ----------
  // useEffect(() => {
  //   if (!form.project_id) {
  //     setAssignableUsers([]);
  //     return;
  //   }

  //   api
  //     .get("/accounts/assignable-users/", {
  //       params: { project_id: form.project_id },
  //     })
  //     .then((res) => {
  //       setAssignableUsers(res.data?.results ?? res.data ?? []);
  //     })
  //     .catch((err) => {
  //       console.error("Failed to load assignable users", err);
  //     });
  // }, [form.project_id]);

  // ---------- Load scope with projects (MY_SCOPE) ----------
  useEffect(() => {
    setScopeLoading(true);
    api
      .get(SCOPE_URL, { params: { include_units: true, unit_type: true } })
      .then((res) => {
        const data = res.data || {};
        const list = data.projects || data.project_list || data.results || [];
        setProjects(list);

        if (data.brand) {
          if (data.brand.logo_url) {
            setBrandLogo(data.brand.logo_url);
          }
          if (data.brand.company_name) {
            setCompanyName(data.brand.company_name);
          }
        }

        // auto-select project if only one
        if (list.length === 1) {
          setForm((prev) => ({ ...prev, project_id: String(list[0].id) }));
        }
      })
      .catch((err) => {
        console.error("Failed to load project scope", err);
        showToast("Failed to load project scope", "error");
      })
      .finally(() => setScopeLoading(false));
  }, []);

  // ---------- Load lead masters for selected project ----------
  useEffect(() => {
    if (!form.project_id) {
      setUnitConfigs([]);
      setSourcesTree([]);
      setPurposes([]);
      return;
    }

    setMastersLoading(true);
    api
      .get(LEAD_MASTERS_API, { params: { project_id: form.project_id } })
      .then((res) => {
        const data = res.data || {};
        setMasters(data);
        setUnitConfigs(data.unit_configurations || data.unit_configs || []);
        setSourcesTree(data.sources || []);
        setPurposes(data.purposes || []);
      })
      .catch((err) => {
        console.error("Failed to load lead masters", err);
        showToast("Failed to load project lead masters", "error");
        setUnitConfigs([]);
        setSourcesTree([]);
        setPurposes([]);
      })
      .finally(() => setMastersLoading(false));
  }, [form.project_id]);

  // ---------- Load partner tiers for Quick CP when project selected ----------
  useEffect(() => {
    if (!form.project_id) {
      setPartnerTiers([]);
      return;
    }

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

  const selectedProject = useMemo(
    () =>
      projects.find((p) => String(p.id) === String(form.project_id)) || null,
    [projects, form.project_id]
  );

  const selectedSource = useMemo(
    () =>
      sourcesTree.find((s) => String(s.id) === String(form.source_id)) || null,
    [sourcesTree, form.source_id]
  );

  const subSourceOptions = useMemo(
    () => selectedSource?.children || [],
    [selectedSource]
  );

  const leadsForPhone = useMemo(
    () => lookupResult?.leads || [],
    [lookupResult]
  );

  const existingLeadInCurrentProject = useMemo(
    () =>
      leadsForPhone.find(
        (lead) => String(lead.project) === String(form.project_id)
      ) || null,
    [leadsForPhone, form.project_id]
  );

  const hasExistingLeadInProject = !!existingLeadInCurrentProject;

  const hasLeadsInOtherProjects = useMemo(
    () =>
      leadsForPhone.some(
        (lead) => String(lead.project) !== String(form.project_id)
      ),
    [leadsForPhone, form.project_id]
  );

  // 👉 Source pe for_cp true ho toh hi CP flows
  const isCpSource = useMemo(
    () => !!(selectedSource && selectedSource.for_cp),
    [selectedSource]
  );

  // ---------- Load CPs when needed (source.for_cp === true) ----------
  useEffect(() => {
    if (!form.project_id || !isCpSource) {
      setChannelPartners([]);
      return;
    }

    if (cpMode !== CP_MODE.REGISTERED) {
      setChannelPartners([]);
      return;
    }

    setCpLoading(true);
    api
      .get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      })
      .then((res) => {
        const data = res.data || {};
        const list = data.results || data || [];
        setChannelPartners(list);
      })
      .catch((err) => {
        console.error("Failed to load channel partners", err);
        showToast("Failed to load channel partners", "error");
      })
      .finally(() => setCpLoading(false));
  }, [form.project_id, isCpSource, cpMode]);

  // ---------- helpers ----------
  const handleChange = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "project_id") {
        // project change => reset project-specific stuff
        next.unit_configuration_id = "";
        next.budget = "";
        next.source_id = "";
        next.sub_source_id = "";
        next.purpose_id = "";
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);
        setOwnerId("");
      }

      if (name === "source_id") {
        next.sub_source_id = "";
        // source change -> CP UI auto based on for_cp, so no manual toggle required
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);
      }

      return next;
    });
  };

  const validate = () => {
    const missing = [];

    if (!form.project_id) missing.push("Project");
    if (!form.first_name.trim()) missing.push("First Name");
    if (!form.last_name.trim()) missing.push("Last Name");
    if (!form.mobile_number.trim()) missing.push("Mobile Number");
    // email is optional now
    if (!form.unit_configuration_id) missing.push("Configuration (2/3/4 BHK)");

    // 👉 Agar source CP-type hai, toh Channel Partner required
    if (isCpSource && !form.channel_partner_id) {
      missing.push("Channel Partner");
    }

    if (missing.length) {
      showToast("Please fill required fields:\n" + missing.join("\n"), "error");
      return false;
    }

    return true;
  };

  const buildOnsitePayload = () => {
    return {
      project_id: Number(form.project_id),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim() || "",
      // owner_id: ownerId ? Number(ownerId) : null,
      assign_to: ownerId ? Number(ownerId) : null,

      nationality: form.nationality || null,
      age_group: form.age_group || null,

      unit_configuration_id: form.unit_configuration_id
        ? Number(form.unit_configuration_id)
        : null,

      budget: form.budget ? Number(form.budget) : null,

      source_id: form.source_id ? Number(form.source_id) : null,
      sub_source_id: form.sub_source_id ? Number(form.sub_source_id) : null,
      purpose_id: form.purpose_id ? Number(form.purpose_id) : null,

      residential_address: form.residential_address.trim(),
      residence_city: form.residence_city.trim(),
      residence_locality: form.residence_locality.trim(),
      residence_pincode: form.residence_pincode.trim(),

      // 👉 Backend expects this: true only when source.for_cp
      has_channel_partner: !!isCpSource,
      channel_partner_id:
        isCpSource && form.channel_partner_id
          ? Number(form.channel_partner_id)
          : null,

      // backend still expects this, so always send true
      terms_accepted: true,
    };
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successLeadId, setSuccessLeadId] = useState(null);
  const [successLeadName, setSuccessLeadName] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
      if (successModalTimerRef.current) {
        clearTimeout(successModalTimerRef.current);
      }

    if (submitting) return;
    if (!validate()) return;

    if (hasExistingLeadInProject) {
      showToast(
        "This customer is already part of this project. Please schedule a site visit instead.",
        "error"
      );
      return;
    }

    const payload = buildOnsitePayload();

    setSubmitting(true);
    try {
      const res = await api.post(ONSITE_API, payload);
      console.log("Onsite registration success:", res.data);
      showToast("Onsite registration created successfully.", "success");

      // 🎯 take lead id from response
      const newLeadId = res?.data?.lead?.id || null;

      // Try to get name from response, fallback to form
      const fn = res?.data?.lead?.first_name || form.first_name;
      const ln = res?.data?.lead?.last_name || form.last_name;
      const fullName = `${fn || ""} ${ln || ""}`.trim() || "Customer";

      setSuccessLeadId(newLeadId);
      setSuccessLeadName(fullName);
      // if any previous timer exists, clear it
      if (successModalTimerRef.current) {
        clearTimeout(successModalTimerRef.current);
      }

      // ✅ show modal AFTER 4 seconds
      successModalTimerRef.current = setTimeout(() => {
        setShowSuccessModal(true);
      }, 5000);

      setForm(initialForm);
      setLookupResult(null);
      setCpMode(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to create onsite registration", err);
      let msg = "Failed to create onsite registration.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSiteVisit = async () => {
    if (!hasExistingLeadInProject || !existingLeadInCurrentProject) {
      showToast(
        "No existing lead in this project to schedule a visit.",
        "error"
      );
      return;
    }
    if (!form.unit_configuration_id) {
      showToast(
        "Please select a configuration before scheduling a visit.",
        "error"
      );
      return;
    }

    const digits = (form.mobile_number || "").replace(/\D/g, "");

    const memberName =
      existingLeadInCurrentProject.full_name ||
      `${existingLeadInCurrentProject.first_name || ""} ${
        existingLeadInCurrentProject.last_name || ""
      }`.trim() ||
      `${form.first_name} ${form.last_name}`.trim() ||
      digits;

    const payload = {
      lead_id: existingLeadInCurrentProject.id,
      project_id: Number(form.project_id),
      unit_config_id: Number(form.unit_configuration_id),
      inventory_id: null,
      scheduled_at: new Date().toISOString(), // auto current date-time
      member_name: memberName,
      member_mobile_number: digits,
      notes: "NEW",
    };

    try {
      await api.post("/sales/site-visits/", payload);
      showToast("Site visit scheduled successfully.", "success");
    } catch (err) {
      console.error("Failed to schedule site visit", err);
      let msg = "Failed to schedule site visit.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    }
  };

  const handleCopyAndCreate = async () => {
    if (submitting) return;
    if (!validate()) return;

    if (!hasLeadsInOtherProjects || !leadsForPhone.length) {
      showToast("No other project lead found to copy data from.", "error");
      return;
    }

    const fromLead = leadsForPhone[0];
    const payload = buildOnsitePayload();

    setSubmitting(true);
    try {
      const res = await api.post(ONSITE_API, payload);
      const newLeadId = res?.data?.lead?.id;

      if (newLeadId && fromLead?.id) {
        await api.post("/sales/sales-leads/copy-missing/", {
          from_lead_id: fromLead.id,
          to_lead_id: newLeadId,
        });
      }

      showToast(
        "Lead created in this project and data copied from existing lead.",
        "success"
      );
      setForm(initialForm);
      setLookupResult(null);
      setCpMode(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to copy data & create lead", err);
      let msg = "Failed to copy data & create lead.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Quick CP: OTP send/verify + create ----------
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
  const filteredAssignableUsers = useMemo(() => {
    return assignableUsers.filter(
      (u) => u.role === "SALES" || u.role === "MANAGER"
    );
  }, [assignableUsers]);

const handleQuickCpCreate = async () => {
  if (!quickCpEmailVerified) {
    showToast("Please verify CP email first.", "error");
    return;
  }

  const addr = quickCpForm.address || {};
  const cleanedAddress = {
    line1: (addr.line1 || "").trim(),
    line2: (addr.line2 || "").trim(),
    area: (addr.area || "").trim(),
    landmark: (addr.landmark || "").trim(),
    city: (addr.city || "").trim(),
    state: (addr.state || "").trim(),
    pincode: (addr.pincode || "").replace(/\D/g, "").slice(0, 6),
    country: (addr.country || "India").trim(),
  };

  // ✅ required fields
  if (!quickCpForm.name || !quickCpForm.email || !quickCpForm.partner_tier_id) {
    showToast("Name, Email, and Partner Tier are required.", "error");
    return;
  }
  if (!cleanedAddress.line1 || cleanedAddress.pincode.length !== 6) {
    showToast(
      "Company address Line 1 and valid 6-digit pincode are required.",
      "error"
    );
    return;
  }

  try {
    const body = {
      name: (quickCpForm.name || "").trim(),
      email: (quickCpForm.email || "").trim(),
      mobile_number: (quickCpForm.mobile_number || "").trim(),
      company_name: (quickCpForm.company_name || "").trim(),
      pan_number: (quickCpForm.pan_number || "").trim(),
      rera_number: (quickCpForm.rera_number || "").trim(),
      partner_tier_id: Number(quickCpForm.partner_tier_id),
      project_id: Number(form.project_id),

      // ✅ address JSON as required by backend
      address: cleanedAddress,
    };

    // optional source_id (best: sub_source else source)
    if (form.sub_source_id || form.source_id) {
      body.source_id = Number(form.sub_source_id || form.source_id);
    }

    const res = await api.post("/channel/partners/quick-create/", body);
    showToast("Channel Partner created successfully.", "success");

    const newCp = res.data;

    // Reload CPs
    const reloadRes = await api.get("/channel/partners/by-project/", {
      params: { project_id: form.project_id },
    });
    const list = reloadRes.data?.results || reloadRes.data || [];
    setChannelPartners(list);

    // Auto-select new CP
    setForm((prev) => ({
      ...prev,
      channel_partner_id: String(newCp.id),
    }));
    setCpMode(CP_MODE.REGISTERED);

    // Close + reset
    setShowQuickCpModal(false);
    setQuickCpForm({
      name: "",
      email: "",
      mobile_number: "",
      company_name: "",
      pan_number: "",
      rera_number: "",
      partner_tier_id: "",
      address: {
        line1: "",
        line2: "",
        area: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      },
    });
    setQuickCpLocalityOptions([]);
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


  // ---------- render ----------
  return (
    <div
      className="onsite-page"
      style={{ "--brand-logo": `url(${brandLogo})` }}
    >
      <div className="onsite-card">
        <div className="onsite-header">
          <div className="onsite-header-left">
            {/* <button
              type="button"
              className="onsite-back-btn"
              onClick={() => window.history.back()}
            >
              ←
            </button> */}

            {brandLogo && (
              <div className="onsite-logo-wrap">
                <img src={brandLogo} alt="Brand Logo" className="onsite-logo" />
              </div>
            )}
          </div>

          <div className="onsite-header-right">
            {selectedProject && (
              <>
                <h2 className="onsite-project-name">
                  {selectedProject.name ||
                    selectedProject.project_name ||
                    "Project Name"}
                </h2>
                {selectedProject.rera_number && (
                  <p className="onsite-rera-number">
                    RERA: {selectedProject.rera_number}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add title section after header */}
        <div className="onsite-title-section">
          {/* <button
              type="button"
              className="onsite-back-btn"
              onClick={() => window.history.back()}
            >
              ←
            </button> */}
          <h1 className="onsite-title">Customer Registration Form</h1>
        </div>

        <form className="onsite-body" onSubmit={handleSubmit} noValidate>
          {/* Project (Full Width - Outside Grid) */}
          <div className="onsite-field">
            <label className="onsite-label">
              Project <span className="onsite-required">*</span>
            </label>
            <select
              className="onsite-input"
              value={form.project_id}
              onChange={(e) => handleChange("project_id", e.target.value)}
              disabled={scopeLoading}
            >
              <option value="">
                {scopeLoading ? "Loading..." : "Select Project"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* First / Last / Mobile */}
          <div className="onsite-row-3 onsite-row-tight">
            {/* First Name */}
            <div className="onsite-field">
              <label className="onsite-label">
                First Name <span className="onsite-required">*</span>
              </label>
              <input
                className="onsite-input"
                type="text"
                placeholder="Enter First Name"
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="onsite-field">
              <label className="onsite-label">
                Last Name <span className="onsite-required">*</span>
              </label>
              <input
                className="onsite-input"
                type="text"
                placeholder="Enter Last Name"
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">
                Mobile Number <span className="onsite-required">*</span>
              </label>

              <input
                className="onsite-input"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter Mobile Number"
                value={form.mobile_number}
                onChange={(e) =>
                  handleChange(
                    "mobile_number",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                autoComplete="off"
              />

              {/* show banner ONLY when there are exactly 10 digits AND we are checking OR have a non-empty result */}
              {form.mobile_number.replace(/\D/g, "").length === 10 &&
                (checkingPhone ||
                  (lookupResult && Object.keys(lookupResult).length > 0)) && (
                  <div className="onsite-lookup-banner">
                    {checkingPhone ? (
                      <span>Checking existing records…</span>
                    ) : lookupResult?.present ? (
                      <>
                        <span>
                          Lead / opportunity already exists for this mobile.
                          Leads: {lookupResult.lead_count || 0}, Opportunities:{" "}
                          {lookupResult.opportunity_count || 0}.
                        </span>
                        <button
                          type="button"
                          className="onsite-lookup-more-btn"
                          onClick={() => setShowLookupModal(true)}
                        >
                          View more
                        </button>
                      </>
                    ) : null}
                  </div>
                )}

              {/* helper/message blocks: show ONLY when phone exactly 10 digits */}
              {/* {form.mobile_number.replace(/\D/g, "").length === 10 &&
    !checkingPhone &&
    lookupResult &&
    !lookupResult.present && (
      <div className="onsite-helper">
        No existing lead found. New lead will be created.
      </div>
  )} */}

              {form.mobile_number.replace(/\D/g, "").length === 10 &&
                !checkingPhone &&
                lookupResult?.present &&
                existingProjectLead && (
                  <div className="onsite-helper-warning">
                    This customer is already registered in this project.{" "}
                    <button
                      type="button"
                      className="onsite-link-btn"
                      onClick={() =>
                        navigate(`/leads/${existingProjectLead.id}/`)
                      }
                    >
                      View lead
                    </button>{" "}
                    or schedule a new site visit instead of creating a new lead.
                  </div>
                )}

              {form.mobile_number.replace(/\D/g, "").length === 10 &&
                !checkingPhone &&
                !hasExistingLeadInProject &&
                lookupResult?.present &&
                lookupResult.leads?.length > 0 && (
                  <div className="onsite-helper">
                    This customer already exists in another project. You can
                    copy their data into this project.
                  </div>
                )}
            </div>
          </div>

          {/* Email / Nationality / Age */}
          <div className="onsite-row-3 onsite-row-tight">
            <div className="onsite-field">
              <label className="onsite-label">Email</label>
              <input
                className="onsite-input"
                type="email"
                placeholder="Enter Email (optional)"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Nationality</label>
              <select
                className="onsite-input"
                value={form.nationality}
                onChange={(e) => handleChange("nationality", e.target.value)}
              >
                <option value="">Select Nationality</option>
                {NATIONALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Age (in years)</label>
              <select
                className="onsite-input"
                value={form.age_group}
                onChange={(e) => handleChange("age_group", e.target.value)}
              >
                <option value="">Select Age</option>
                {AGE_GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Owner / Assign To */}
            {/* Owner / Assign To */}
            <div className="onsite-field">
              <label className="onsite-label">Owner / Assign To</label>

              <select
                className="onsite-input"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={!form.project_id}
              >
                <option value="">Select Owner</option>

                {filteredAssignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.full_name || u.username}
                    {u.role ? ` (${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Residential Address */}
          <div className="onsite-field">
            <label className="onsite-label">Residential Address</label>
            <textarea
              className="onsite-input"
              rows={2}
              placeholder="Flat / building, street..."
              value={form.residential_address}
              onChange={(e) =>
                handleChange("residential_address", e.target.value)
              }
            />
          </div>

          {/* Pin Code / City / Locality */}
          <div className="onsite-row-3 onsite-row-tight">
            <div className="onsite-field">
              <label className="onsite-label">
                Pin Code
                {loadingPincode && (
                  <span
                    style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}
                  >
                    (Looking up...)
                  </span>
                )}
              </label>
              <input
                className="onsite-input"
                type="text"
                maxLength={6}
                value={form.residence_pincode}
                onChange={(e) =>
                  handleChange(
                    "residence_pincode",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="Enter 6-digit pincode"
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Residence City</label>
              <input
                className="onsite-input"
                type="text"
                value={form.residence_city}
                onChange={(e) => handleChange("residence_city", e.target.value)}
                placeholder="Auto-filled from pincode"
              />
            </div>

            <div className="onsite-field">
              <label className="onsite-label">Locality</label>
              <select
                className="onsite-input"
                value={form.residence_locality}
                onChange={(e) =>
                  handleChange("residence_locality", e.target.value)
                }
              >
                <option value="">Select Locality</option>

                {localityOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuration / Budget / Source */}
          <div className="onsite-row-3 onsite-row-tight">
            {/* Configuration */}
            <div className="onsite-field">
              <label className="onsite-label">
                Configuration <span className="onsite-required">*</span>
              </label>
              {mastersLoading ? (
                <div className="onsite-helper">Loading configurations...</div>
              ) : unitConfigs.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No configurations configured for this project."
                    : "Select a project to see configurations."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.unit_configuration_id}
                  onChange={(e) =>
                    handleChange("unit_configuration_id", e.target.value)
                  }
                >
                  <option value="">Select Configuration</option>
                  {unitConfigs.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.name ||
                        cfg.label ||
                        cfg.configuration ||
                        `Config #${cfg.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Budget */}
            <div className="onsite-field">
              <label className="onsite-label">Budget (Min)</label>
              <select
                className="onsite-input"
                value={form.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
              >
                <option value="">Select Budget</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Source of Visit */}
            <div className="onsite-field">
              <label className="onsite-label">Source of Visit</label>
              {mastersLoading ? (
                <div className="onsite-helper">Loading sources...</div>
              ) : sourcesTree.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No sources configured."
                    : "Select a project to see sources."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.source_id}
                  onChange={(e) => handleChange("source_id", e.target.value)}
                >
                  <option value="">Select Source</option>
                  {sourcesTree.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sub Source / Purpose */}
          {subSourceOptions.length > 0 && (
            <div className="onsite-field onsite-row-tight">
              <label className="onsite-label">Sub Source</label>
              <select
                className="onsite-input"
                value={form.sub_source_id}
                onChange={(e) => handleChange("sub_source_id", e.target.value)}
              >
                <option value="">Select Sub Source</option>
                {subSourceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Purpose + CP Type + CP in one row */}
          {isCpSource ? (
            <div className="onsite-row-3 onsite-row-tight">
              {/* Purpose */}
              <div className="onsite-field">
                <label className="onsite-label">Purpose</label>
                {purposes.length === 0 ? (
                  <div className="onsite-helper">
                    {selectedProject
                      ? "No purposes configured."
                      : "Select a project to see purposes."}
                  </div>
                ) : (
                  <select
                    className="onsite-input"
                    value={form.purpose_id}
                    onChange={(e) => handleChange("purpose_id", e.target.value)}
                  >
                    <option value="">Select Purpose</option>
                    {purposes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Channel Partner Type */}
              <div className="onsite-field">
                <label className="onsite-label">Channel Partner Type</label>
                <select
                  className="onsite-input"
                  value={cpMode}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    setCpMode(nextMode);
                    setForm((prev) => ({
                      ...prev,
                      channel_partner_id: "",
                    }));
                  }}
                >
                  <option value={CP_MODE.REGISTERED}>Registered</option>
                  <option value={CP_MODE.UNREGISTERED}>Unregistered</option>
                </select>
              </div>

              {/* Channel Partner */}
              <div className="onsite-field">
                <label className="onsite-label">
                  Channel Partner <span className="onsite-required">*</span>
                </label>

                {cpMode === CP_MODE.REGISTERED ? (
                  <select
                    className="onsite-input"
                    value={form.channel_partner_id}
                    onChange={(e) =>
                      handleChange("channel_partner_id", e.target.value)
                    }
                    disabled={cpLoading}
                  >
                    <option value="">
                      {cpLoading ? "Loading..." : "Select Channel Partner"}
                    </option>
                    {channelPartners.map((cp) => {
                      const fullName =
                        cp.full_name ||
                        cp.name ||
                        [cp.first_name, cp.last_name].filter(Boolean).join(" ");
                      const label =
                        fullName ||
                        cp.company_name ||
                        cp.email ||
                        `CP #${cp.id}`;
                      return (
                        <option key={cp.id} value={cp.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowQuickCpModal(true)}
                    style={{ padding: "10px 16px", borderRadius: 8 }}
                  >
                    + Create New Channel Partner
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Non-CP sources ke liye Purpose simple dropdown hi rahega */
            <div className="onsite-field onsite-row-tight">
              <label className="onsite-label">Purpose</label>
              {purposes.length === 0 ? (
                <div className="onsite-helper">
                  {selectedProject
                    ? "No purposes configured."
                    : "Select a project to see purposes."}
                </div>
              ) : (
                <select
                  className="onsite-input"
                  value={form.purpose_id}
                  onChange={(e) => handleChange("purpose_id", e.target.value)}
                >
                  <option value="">Select Purpose</option>
                  {purposes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="onsite-footer">
            <button
              type="submit"
              className="onsite-submit-btn"
              disabled={submitting || !!existingProjectLead}
            >
              {submitting ? "Creating..." : "CREATE"}
            </button>

            {hasExistingLeadInProject && (
              <button
                type="button"
                className="onsite-submit-btn onsite-submit-btn-secondary"
                onClick={handleScheduleSiteVisit}
                disabled={submitting}
                style={{ marginLeft: 8 }}
              >
                Schedule Site Visit
              </button>
            )}

            {!hasExistingLeadInProject && hasLeadsInOtherProjects && (
              <button
                type="button"
                className="onsite-submit-btn onsite-submit-btn-secondary"
                onClick={handleCopyAndCreate}
                disabled={submitting}
                style={{ marginLeft: 8 }}
              >
                Copy Data & Create
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Quick CP Create Modal */}
      {showQuickCpModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "720px" }}>
            <h3 className="modal-title">Create New Channel Partner</h3>

            {/* Name (full width) */}
            <div className="qp-span-2" style={{ marginBottom: 12 }}>
              <label className="form-label">
                Name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Email + Send OTP (full width) */}
            <div className="qp-span-2" style={{ marginBottom: 12 }}>
              <label className="form-label">
                Email<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={quickCpForm.email}
                  onChange={(e) => {
                    setQuickCpForm((prev) => ({
                      ...prev,
                      email: e.target.value,
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

            {/* OTP + Verify (full width) */}
            <div className="qp-span-2" style={{ marginBottom: 12 }}>
              <label className="form-label">
                OTP<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
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
                <div style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>
                  ✓ Email verified
                </div>
              )}
            </div>

            {/* Two-column grid for remaining fields */}
            <div className="qp-grid" style={{ marginTop: 8 }}>
              {/* Partner Tier */}
              <div>
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

              {/* Mobile */}
              <div>
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

              {/* Company Name */}
              <div>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.company_name}
                  onChange={(e) =>
                    setQuickCpForm((prev) => ({
                      ...prev,
                      company_name: e.target.value,
                    }))
                  }
                />
              </div>

              {/* PAN */}
              <div>
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

              {/* RERA */}
              <div>
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

              {/* empty cell to keep 2-col symmetry (optional) */}
              <div />
            </div>

            <div className="qp-divider" />

            <div className="form-label">
              Company Address <span className="required">*</span>
              {quickCpLoadingPincode && (
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
                  (Looking up...)
                </span>
              )}
            </div>

            <div className="qp-grid">
              {/* Pincode */}
              <div>
                <label className="form-label">
                  Pincode <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={6}
                  value={quickCpForm.address?.pincode || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                />
              </div>

              {/* City */}
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.city || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange("city", e.target.value)
                  }
                />
              </div>

              {/* State */}
              <div>
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.state || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange("state", e.target.value)
                  }
                />
              </div>

              {/* Area / Locality */}
              <div>
                <label className="form-label">Area / Locality</label>
                {quickCpLocalityOptions.length > 0 ? (
                  <select
                    className="form-input"
                    value={quickCpForm.address?.area || ""}
                    onChange={(e) =>
                      handleQuickCpAddressChange("area", e.target.value)
                    }
                  >
                    <option value="">Select Locality</option>
                    {quickCpLocalityOptions.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={quickCpForm.address?.area || ""}
                    onChange={(e) =>
                      handleQuickCpAddressChange("area", e.target.value)
                    }
                  />
                )}
              </div>

              {/* Landmark */}
              <div>
                <label className="form-label">Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.landmark || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange("landmark", e.target.value)
                  }
                />
              </div>

              {/* Country */}
              <div>
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.country || "India"}
                  onChange={(e) =>
                    handleQuickCpAddressChange("country", e.target.value)
                  }
                />
              </div>

              {/* Address Line 1 (full width) */}
              <div className="qp-span-2">
                <label className="form-label">
                  Address Line 1 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.line1 || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange("line1", e.target.value)
                  }
                />
              </div>

              {/* Address Line 2 (full width) */}
              <div className="qp-span-2">
                <label className="form-label">Address Line 2</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickCpForm.address?.line2 || ""}
                  onChange={(e) =>
                    handleQuickCpAddressChange("line2", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions" style={{ marginTop: 14 }}>
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
                    address: {
                      line1: "",
                      line2: "",
                      area: "",
                      landmark: "",
                      city: "",
                      state: "",
                      pincode: "",
                      country: "India",
                    },
                  });
                  setQuickCpLocalityOptions([]);
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

      {/* Success modal after creating onsite registration */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{
              maxWidth: "520px",
              textAlign: "center",
              padding: "24px 32px",
              lineHeight: 1.6,
            }}
          >
            <h3
              className="modal-title"
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "18px",
                color: "#102a54",
              }}
            >
              Thank you!
            </h3>

            <p style={{ fontSize: 15, color: "#4b5563", marginBottom: 12 }}>
              Dear {successLeadName || "Customer"},
            </p>

            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
              Thank you for taking the time to fill out our registration form
              and for trusting us with your personal details. We truly
              appreciate it.
            </p>

            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 18 }}>
              Please rest assured that your information is safe with us. We
              respect your privacy, and you will never receive unnecessary calls
              or messages from our side — whether or not you decide to purchase
              a property with us.
            </p>

            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
              Warm Regards,
            </p>

            <p style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>
              Team Shree Ram Krushna Developers
            </p>

            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (successLeadId) {
                    navigate(`/leads/${successLeadId}/`);
                  }
                }}
              >
                DONE
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
}
