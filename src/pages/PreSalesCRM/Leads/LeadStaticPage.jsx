import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import api, { BASE_URL } from "../../../api/axiosInstance";
import { toast } from "react-hot-toast";
import PaymentLeadCreateModal from "../../../components/Payments/PaymentLeadCreateModal"
import { formatINR } from "../../../utils/number";
import { toTitleCase } from "../../../utils/text";

import "./LeadStaticPage.css";

// helper for datetime-local default
const nowForInput = () => new Date().toISOString().slice(0, 16);

const LeadStaticPage = () => {
  const [stageHistoryModalOpen, setStageHistoryModalOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [stageChangeNote, setStageChangeNote] = useState("");
  const [updateStatusOptions, setUpdateStatusOptions] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { id: leadIdFromPath } = useParams();
  const leadId = searchParams.get("lead_id") || leadIdFromPath || null;

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const projectId = lead?.project || null;
  // ---- lookups from /client/setup-bundle/ ----
  const [lookups, setLookups] = useState(null);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [leadDocuments, setLeadDocuments] = useState(null);
  // ---- CP dropdown ----
  const [cpOptions, setCpOptions] = useState([]);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpSelected, setCpSelected] = useState("");


  // ---- right-side tabs ----
  const [activeTab, setActiveTab] = useState("activity");

  // ---- activity (updates) ----
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    update_type: "FOLLOW_UP",
    title: "",
    info: "",
    event_date: nowForInput(),
  });
  const [savingActivity, setSavingActivity] = useState(false);

  // ---- right-side documents ----
  const fileInputRef = useRef(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [leadDocs, setLeadDocs] = useState(null);
  // ---- stage change modal ----
  const [stageModal, setStageModal] = useState({
    open: false,
    stage: null,
  });
  const [savingStage, setSavingStage] = useState(false);

  const [leadStatusModalOpen, setLeadStatusModalOpen] = useState(false);
  const [leadStatusForm, setLeadStatusForm] = useState({
    status: "",
    sub_status: "",
    comment: "",
  });

  const handlePaymentsClick = () => {
    setPaymentModalOpen(true);
  };

  // ---- collapsible sections ----
  const [collapsedSections, setCollapsedSections] = useState({
    cp: false,
    proposal: false,
    interested: false,
    additional: false,
    professional: false,
    address: false,
  });

  const [cpInfoForm, setCpInfoForm] = useState({
    referral_code: "",
  });

  // ---- Lead status change ----
  const [statusForm, setStatusForm] = useState({
    status: "",
    sub_status: "",
    comment: "",
  });
  const [savingLeadStatus, setSavingLeadStatus] = useState(false);

  const [personalForm, setPersonalForm] = useState({
    date_of_birth: "",
    date_of_anniversary: "",
    already_part_of_family: false,
    secondary_email: "",
    alternate_mobile: "",
    alternate_tel_res: "",
    alternate_tel_off: "",
    visiting_on_behalf: "",
    current_residence_ownership: "",
    current_residence_type: "",
    family_size: "",
    possession_desired_in: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    occupation: "",
    organization_name: "",
    office_location: "",
    office_pincode: "",
    designation: "",
  });

  const subStatusName = lead?.sub_status_name || "";

  const [addressForm, setAddressForm] = useState({
    flat_or_building: "",
    area: "",
    pincode: "",
    city: "",
    state: "",
    country: "",
  });

  const [proposalFiles, setProposalFiles] = useState([]);
  const [savingExtra, setSavingExtra] = useState(false);

  // ---- Pincode lookup loading states ----
  const [loadingAddressPincode, setLoadingAddressPincode] = useState(false);
  const [loadingOfficePincode, setLoadingOfficePincode] = useState(false);

  // Refs to track initial pincode values (to prevent API call on mount/prefill)
  const initialAddressPincodeRef = useRef(null);
  const initialOfficePincodeRef = useRef(null);

  // ---- Lead Information inline edit ----
  const [leadInfoForm, setLeadInfoForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    budget: "",
    annual_income: "",
    purpose:"",
  });
  const [leadInfoEdit, setLeadInfoEdit] = useState(false);
  const [savingLeadInfo, setSavingLeadInfo] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  // ---- Interested Inventory (InterestedLeadUnit) ----
  const [interestedUnits, setInterestedUnits] = useState([]);
  const [interestedModalOpen, setInterestedModalOpen] = useState(false);

  const [inventoryTree, setInventoryTree] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedUnitInfo, setSelectedUnitInfo] = useState(null);
  const [selectedUnitInfoLoading, setSelectedUnitInfoLoading] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL"); // ALL | AVAILABLE | BOOKED
  const [selectedUnitStatus, setSelectedUnitStatus] = useState(null);

  const [interestedSaving, setInterestedSaving] = useState(false);
  const [interestedSearch, setInterestedSearch] = useState("");

  const [loadingInterested, setLoadingInterested] = useState(false);
  const [removingInterestedId, setRemovingInterestedId] = useState(null);

  // ---- Email logs + send ----
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineType, setTimelineType] = useState(""); // optional filter
  const [timelineQuery, setTimelineQuery] = useState(""); // optional search

  const [emailForm, setEmailForm] = useState({
    subject: "",
    body: "",
    cc: "",
    bcc: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailView, setEmailView] = useState("compose");

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentForm, setCommentForm] = useState({
    text: "",
    stage_at_time: "",
  });


  useEffect(() => {
    if (activeTab !== "logs" || !leadId) return;

    setLoadingTimeline(true);
    api
      .get(`/sales/sales-leads/${leadId}/timeline/`, {
        params: {
          page: 1,
          page_size: 25,
          ...(timelineType ? { types: timelineType } : {}),
          ...(timelineQuery ? { q: timelineQuery } : {}),
        },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setTimelineLogs(items);
      })
      .catch((err) => {
        console.error("Failed to load timeline", err);
        toast.error("Failed to load logs");
      })
      .finally(() => setLoadingTimeline(false));
  }, [activeTab, leadId, timelineType, timelineQuery]);



  useEffect(() => {
    if (activeTab !== "comment" || !leadId) return;

    setLoadingComments(true);
    api
      .get("/sales/lead-comments/", {
        params: { sales_lead: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setComments(items);
      })
      .catch((err) => {
        console.error("Failed to load comments", err);
        toast.error("Failed to load comments");
      })
      .finally(() => setLoadingComments(false));
  }, [activeTab, leadId]);

  // 9) When comment tab opens, default stage to latest stage_history
  useEffect(() => {
    if (activeTab !== "comment") return;

    // compute latest stage from lead.stage_history
    let defaultStageId = "";

    if (
      lead &&
      Array.isArray(lead.stage_history) &&
      lead.stage_history.length
    ) {
      const sorted = [...lead.stage_history].sort((a, b) => {
        const aKey = a.event_date || a.created_at || "";
        const bKey = b.event_date || b.created_at || "";

        if (aKey < bKey) return -1;
        if (aKey > bKey) return 1;
        return (a.id || 0) - (b.id || 0);
      });

      const latest = sorted[sorted.length - 1];
      defaultStageId = latest.stage || "";
    }

    setCommentForm((prev) => ({
      ...prev,
      // agar pehle se selected hai toh same rehne do, warna latest stage lagao
      stage_at_time: prev.stage_at_time || defaultStageId,
    }));
  }, [activeTab, lead]);

  // 1) Fetch lead detail
  useEffect(() => {
    if (!leadId) {
      setError("Lead id missing in URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    api
      .get(`/sales/sales-leads/${leadId}/`, {
        params: { include_all_stage: true },
      })
      .then((res) => setLead(res.data))
      .catch((err) => {
        console.error("Failed to load lead", err);
        setError("Failed to load lead details.");
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  // 2) When lead is known, load setup-bundle lookups
  useEffect(() => {
    if (!lead || !lead.project) return;

    setLoadingLookups(true);
    api
      .get("/client/setup-bundle/", {
        params: { project_id: lead.project, lead_id: lead.id },
      })
      .then((res) => {
        const data = res.data || {};
        const lk = data.lookups || {};

        setLookups(lk);
        setLeadDocs(data.lead_documents || null);

        // 🔹 yaha se activity ke statuses nikaalo
        const rawStatuses = lk.lead_update_statuses || []; // <== IMPORTANT
        const filtered = rawStatuses.filter(
          (s) => !s.project_id || s.project_id === lead.project
        );

        setUpdateStatusOptions(filtered); // [{id, code, label, project_id}, ...]
      })
      .catch((err) => {
        console.error("Failed to load setup bundle", err);
      })
      .finally(() => setLoadingLookups(false));
  }, [lead]);

  // 3) Prefill extra-info + lead-info forms once lead is loaded
  useEffect(() => {
    if (!lead) return;

    const a = lead.address || {};
    const initialAddressPincode = a.pincode || "";
    initialAddressPincodeRef.current = initialAddressPincode;
    setAddressForm({
      flat_or_building: a.flat_or_building || "",
      area: a.area || "",
      pincode: initialAddressPincode,
      city: a.city || "",
      state: a.state || "",
      country: a.country || "",
    });

    const cp = lead.cp_info || {};
    setCpInfoForm({
      referral_code: lead.cp_referral_code || cp.referral_code || "",
    });

    const p = lead.personal_info || {};
    setPersonalForm({
      date_of_birth: p.date_of_birth || "",
      date_of_anniversary: p.date_of_anniversary || "",
      already_part_of_family: !!p.already_part_of_family,
      secondary_email: p.secondary_email || "",
      alternate_mobile: p.alternate_mobile || "",
      alternate_tel_res: p.alternate_tel_res || "",
      alternate_tel_off: p.alternate_tel_off || "",
      visiting_on_behalf:
        (p.visiting_on_behalf && p.visiting_on_behalf.id) ||
        p.visiting_on_behalf ||
        "",
      current_residence_ownership:
        (p.current_residence_ownership && p.current_residence_ownership.id) ||
        p.current_residence_ownership ||
        "",
      current_residence_type: p.current_residence_type || "",
      family_size: (p.family_size && p.family_size.id) || p.family_size || "",
      possession_desired_in:
        (p.possession_desired_in && p.possession_desired_in.id) ||
        p.possession_desired_in ||
        "",
      facebook: p.facebook || "",
      twitter: p.twitter || "",
      linkedin: p.linkedin || "",
    });

    const pr = lead.professional_info || {};
    const initialOfficePincode = pr.office_pincode || "";
    initialOfficePincodeRef.current = initialOfficePincode;
    setProfessionalForm({
      occupation: (pr.occupation && pr.occupation.id) || pr.occupation || "",
      organization_name: pr.organization_name || "",
      office_location: pr.office_location || "",
      office_pincode: initialOfficePincode,
      designation:
        (pr.designation && pr.designation.id) || pr.designation || "",
    });

    setCpSelected(lead.channel_partner || "");

    setLeadInfoForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company: lead.company || "",
      budget: lead.budget ?? "",
      annual_income: lead.annual_income ?? "",
      purpose: lead.purpose || "",
    });
  }, [lead]);

  // Pincode lookup for Address Information (only when user changes pincode, not on mount)
  useEffect(() => {
    const pincodeDigits = (addressForm.pincode || "").replace(/\D/g, "");
    const initialPincode = initialAddressPincodeRef.current || "";

    // Skip API call if this is the initial prefill or if pincode hasn't changed
    if (!pincodeDigits || pincodeDigits === initialPincode) {
      return;
    }

    if (pincodeDigits.length === 6) {
      setLoadingAddressPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
        .then((response) => response.json())
        .then((dataArray) => {
          if (
            dataArray &&
            dataArray.length > 0 &&
            dataArray[0].Status === "Success" &&
            dataArray[0].PostOffice &&
            dataArray[0].PostOffice.length > 0
          ) {
            const postOffice = dataArray[0].PostOffice[0];
            // Override existing data with API response
            setAddressForm((prev) => ({
              ...prev,
              city: postOffice.District || "",
              state: postOffice.State || "",
              country: postOffice.Country || "",
              area: postOffice.Name || "",
            }));
            // Update ref so subsequent changes can trigger API
            initialAddressPincodeRef.current = pincodeDigits;
          } else {
            toast.error("Pincode lookup failed. Please enter details manually.", {
              duration: 2000,
            });
            // Update ref even on failure to prevent re-triggering
            initialAddressPincodeRef.current = pincodeDigits;
          }
        })
        .catch((err) => {
          console.error("Pincode lookup failed", err);
          toast.error("Pincode lookup failed. Please enter details manually.", {
            duration: 2000,
          });
          // Update ref even on error to prevent re-triggering
          initialAddressPincodeRef.current = pincodeDigits;
        })
        .finally(() => setLoadingAddressPincode(false));
    } else {
      setLoadingAddressPincode(false);
    }
  }, [addressForm.pincode]);

  // Pincode lookup for Professional Information (Office Address) (only when user changes pincode, not on mount)
  useEffect(() => {
    const pincodeDigits = (professionalForm.office_pincode || "").replace(/\D/g, "");
    const initialPincode = initialOfficePincodeRef.current || "";

    // Skip API call if this is the initial prefill or if pincode hasn't changed
    if (!pincodeDigits || pincodeDigits === initialPincode) {
      return;
    }

    if (pincodeDigits.length === 6) {
      setLoadingOfficePincode(true);
      fetch(`https://api.postalpincode.in/pincode/${pincodeDigits}`)
        .then((response) => response.json())
        .then((dataArray) => {
          if (
            dataArray &&
            dataArray.length > 0 &&
            dataArray[0].Status === "Success" &&
            dataArray[0].PostOffice &&
            dataArray[0].PostOffice.length > 0
          ) {
            const postOffice = dataArray[0].PostOffice[0];
            // Override existing data with API response
            setProfessionalForm((prev) => ({
              ...prev,
              office_location: postOffice.Name || "",
            }));
            // Update ref so subsequent changes can trigger API
            initialOfficePincodeRef.current = pincodeDigits;
          } else {
            toast.error("Pincode lookup failed. Please enter details manually.", {
              duration: 2000,
            });
            // Update ref even on failure to prevent re-triggering
            initialOfficePincodeRef.current = pincodeDigits;
          }
        })
        .catch((err) => {
          console.error("Pincode lookup failed", err);
          toast.error("Pincode lookup failed. Please enter details manually.", {
            duration: 2000,
          });
          // Update ref even on error to prevent re-triggering
          initialOfficePincodeRef.current = pincodeDigits;
        })
        .finally(() => setLoadingOfficePincode(false));
    } else {
      setLoadingOfficePincode(false);
    }
  }, [professionalForm.office_pincode]);
  const formatUpdateType = (val) => {
    if (!val) return "-";
    return val
      .toString()
      .toLowerCase()
      .split(/[\s_]+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  const getUpdateStatusLabel = (update) => {
    if (!update) return "No status";

    // 1) Direct label from backend (preferred)
    if (update.activity_status_label) return toTitleCase(update.activity_status_label);
    if (update.activity_status_name) return toTitleCase(update.activity_status_name);

    // 2) Latest from history (by event_date / created_at / id)
    if (Array.isArray(update.status_history) && update.status_history.length) {
      const latest = update.status_history.reduce((latest, item) => {
        const latestKey = latest.event_date || latest.created_at || "";
        const itemKey = item.event_date || item.created_at || "";

        if (itemKey > latestKey) return item;
        if (itemKey < latestKey) return latest;

        // tie-breaker: higher id is newer
        return (item.id || 0) > (latest.id || 0) ? item : latest;
      }, update.status_history[0]);

      if (latest.new_status_label) return toTitleCase(latest.new_status_label);

      // fallback: use id → lookup
      if (latest.new_status && updateStatusOptions.length) {
        const st = updateStatusOptions.find((s) => s.id === latest.new_status);
        if (st) return toTitleCase(st.label || st.code || `#${st.id}`);
      }
    }

    // 3) Fallback: use current activity_status id with lookup
    if (update.activity_status && updateStatusOptions.length) {
      const st = updateStatusOptions.find(
        (s) => s.id === update.activity_status
      );
      if (st) return toTitleCase(st.label || st.code || `#${st.id}`);
    }

    return "Pending";
  };

  const handleCommentChange = (field, value) => {
    setCommentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitComment = async () => {
    if (!lead) return;
    if (!commentForm.text.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setSavingComment(true);
    try {
      const payload = {
        sales_lead: lead.id,
        text: commentForm.text.trim(),
        stage_at_time: commentForm.stage_at_time || activeStageId || null,
      };

      const res = await api.post("/sales/lead-comments/", payload);
      const newComment = res.data;

      setComments((prev) => [newComment, ...(prev || [])]);

      setCommentForm({
        text: "",
        stage_at_time: newComment.stage_at_time || activeStageId || "",
      });

      toast.success("Comment added");
    } catch (err) {
      console.error("Failed to save comment", err);
      toast.error("Failed to save comment");
    } finally {
      setSavingComment(false);
    }
  };
  const openActivityStatusModal = (update) => {
    if (!update) return;
    setActivityStatusModal({
      open: true,
      update,
      status: update.activity_status || "",
      comment: "",
    });
  };

  const handleCloseActivityStatusModal = () => {
    if (savingActivityStatus) return;
    setActivityStatusModal({
      open: false,
      update: null,
      status: "",
      comment: "",
    });
  };

  const handleSaveActivityStatus = async () => {
    const u = activityStatusModal.update;
    if (!u) return;

    if (!activityStatusModal.status) {
      toast.error("Please select a status for this activity.");
      return;
    }

    // ✅ Comment compulsory
    if (!activityStatusModal.comment || !activityStatusModal.comment.trim()) {
      toast.error("Please enter a comment for this activity status change.");
      return;
    }

    setSavingActivityStatus(true);
    try {
      const payload = {
        activity_status: Number(activityStatusModal.status),
        comment: activityStatusModal.comment.trim(),
      };

      const res = await api.post(
        `/sales/sales-lead-updates/${u.id}/change-status/`,
        payload
      );
      const updated = res.data;

      setLead((prev) => ({
        ...prev,
        updates: (prev?.updates || []).map((x) =>
          x.id === updated.id ? updated : x
        ),
      }));

      toast.success("Activity status updated");
      handleCloseActivityStatusModal();
    } catch (err) {
      console.error("Failed to update activity status", err);
      toast.error("Failed to update activity status");
    } finally {
      setSavingActivityStatus(false);
    }
  };


  // 4) Load channel partners by source
  useEffect(() => {
    if (!lead || !lead.source) return;

    setCpLoading(true);
    api
      .get(`/channel/partners/by-source/${lead.source}/`)
      .then((res) => {
        const data = res.data || {};
        const results = Array.isArray(data.results) ? data.results : data;
        setCpOptions(results || []);
      })
      .catch((err) => {
        console.error("Failed to load channel partners by source", err);
        setCpOptions([]);
      })
      .finally(() => setCpLoading(false));
  }, [lead]);

  // 5) Load interested units
  useEffect(() => {
    if (!leadId) return;

    setLoadingInterested(true);
    api
      .get("/sales/interested-units/", {
        params: { sales_lead: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setInterestedUnits(items);
      })
      .catch((err) => {
        console.error("Failed to load interested units", err);
      })
      .finally(() => setLoadingInterested(false));
  }, [leadId]);

  // 6) Load available units when interested section is opened

  useEffect(() => {
    if (!interestedModalOpen || !projectId) return;

    const loadInventoryTree = async () => {
      setInventoryLoading(true);
      try {
        const res = await api.get("/client/inventory/tree/", {
          params: { project_id: projectId },
        });

        const payload = res.data || {};
        // 👇 API se towers array aa raha hai
        const towers = Array.isArray(payload.towers) ? payload.towers : [];
        setInventoryTree(towers);
      } catch (err) {
        console.error("Error loading inventory tree", err);
      } finally {
        setInventoryLoading(false);
      }
    };

    loadInventoryTree();
  }, [interestedModalOpen, projectId]);

  const handleSelectUnit = async (unit) => {
    if (!unit?.id) return;

    // 👇 status store karo so we know if it is AVAILABLE / BOOKED
    const status =
      unit?.inventory?.availability_status ||
      unit?.inventory?.unit_status ||
      null;
    setSelectedUnitStatus(status);

    setSelectedUnitId(unit.id);
    setSelectedUnitInfo(null);
    setSelectedUnitInfoLoading(true);

    try {
      const res = await api.get("/client/inventory/by-unit/", {
        params: { unit_id: unit.id },
      });
      setSelectedUnitInfo(res.data);
    } catch (err) {
      console.error("Error loading unit details", err);
    } finally {
      setSelectedUnitInfoLoading(false);
    }
  };

  // 7) Load email logs when Email tab active
  useEffect(() => {
    if (activeTab !== "email" || !leadId) return;

    setLoadingEmailLogs(true);
    api
      .get("/sales/email-logs/", {
        params: { sales_lead_id: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setEmailLogs(items);
      })
      .catch((err) => {
        console.error("Failed to load email logs", err);
        toast.error("Failed to load email logs");
      })
      .finally(() => setLoadingEmailLogs(false));
  }, [activeTab, leadId]);

  // ====================== DERIVED DATA ======================

  const leadStatusOptions = React.useMemo(() => {
    if (!lookups?.lead_statuses || !lead?.project) return [];
    return lookups.lead_statuses
      .filter((s) => s.project_id === lead.project)
      .map((s) => ({ value: s.id, label: toTitleCase(s.name || "") }));
  }, [lookups, lead]);

  const leadSubStatusOptions = React.useMemo(() => {
    if (!lookups?.lead_sub_statuses || !leadStatusForm.status) return [];
    return lookups.lead_sub_statuses
      .filter((ss) => ss.status_id === leadStatusForm.status)
      .map((ss) => ({ value: ss.id, label: toTitleCase(ss.name || "") }));
  }, [lookups, leadStatusForm.status]);

  const handleStatusFormChange = (field, value) => {
    setStatusForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "status" ? { sub_status: "" } : {}),
    }));
  };

  const handleLeadStatusSave = async () => {
    if (!lead) return;
    if (!statusForm.status) {
      toast.error("Please select a status.");
      return;
    }

    setSavingLeadStatus(true);
    try {
      const payload = {
        status_id: statusForm.status,
        sub_status_id: statusForm.sub_status || null,
        comment: statusForm.comment || "",
      };

      const res = await api.post(
        `/sales/sales-leads/${lead.id}/change-status/`,
        payload
      );

      setLead((prev) => ({
        ...prev,
        status: statusForm.status,
        sub_status: statusForm.sub_status || null,
        status_name: res.data?.status || prev.status_name,
        sub_status_name: res.data?.sub_status || prev.sub_status_name,
      }));

      toast.success("Lead status updated");
    } catch (err) {
      console.error("Failed to update lead status", err);
      toast.error("Failed to update lead status");
    } finally {
      setSavingLeadStatus(false);
    }
  };
  const rawFullName =
    lead?.full_name ||
    [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") ||
    lead?.name ||
    "";

  const displayFullName = toTitleCase(rawFullName) || "Lead Name";

  const rawStatusName =
    lead?.status_name || lead?.status_display || lead?.status || "";

  const displayStatusName = rawStatusName
    ? toTitleCase(rawStatusName.replace(/_/g, " "))
    : "-";

  const statusName = rawStatusName
    ? rawStatusName
        .toString()
        .toLowerCase()
        .split(/[\s_-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";
  const ownerName = lead?.current_owner_name || "-";
  const mobile = lead?.mobile_number || "-";
  const email = lead?.email || "-";

  // raw name from API (can be CLOSED_WON, closed_won, etc.)

  const stages = lead?.lead_stages || [];
  const stageHistory = lead?.stage_history || [];
  const updates = lead?.updates || [];
  // const [updateStatusOptions, setUpdateStatusOptions] = useState([]);

  const sortedStageHistory = React.useMemo(() => {
    if (!stageHistory || !stageHistory.length) return [];

    const copy = [...stageHistory];
    copy.sort((a, b) => {
      const aKey = a.event_date || a.created_at || "";
      const bKey = b.event_date || b.created_at || "";

      // latest first
      if (aKey < bKey) return 1;
      if (aKey > bKey) return -1;
      return (b.id || 0) - (a.id || 0);
    });

    return copy;
  }, [stageHistory]);

  const [activityStatusModal, setActivityStatusModal] = useState({
    open: false,
    update: null,
    status: "",
    comment: "",
  });
  const [savingActivityStatus, setSavingActivityStatus] = useState(false);

  // ==== Activity Filtered List ====
  const filteredUpdates =
    activityFilter === ""
      ? updates
      : updates.filter((u) => u.update_type === activityFilter);

  const documents = lead?.documents || [];
  const inventoryDocs = lead?.project_inventory_docs || [];

  const isSelectedAvailable =
    selectedUnitStatus === "AVAILABLE" ||
    selectedUnitInfo?.availability_status === "AVAILABLE" ||
    selectedUnitInfo?.inventory?.availability_status === "AVAILABLE";

  const bookingId = leadDocs?.booking?.id || null;
  const quotationId = leadDocs?.quotation?.id || null;

  const bookingGeneratePdfUrl = bookingId
    ? `${BASE_URL}book/bookings/${bookingId}/generate-pdf/`
    : null;

  const quotationGeneratePdfUrl = quotationId
    ? `${BASE_URL}costsheet/cost-sheets/${quotationId}/generate-pdf/`
    : null;

  const handleViewQuotation = () => {
    if (!quotationId) {
      toast.error("Quotation not created yet");
      return;
    }
    navigate(`/costsheet/${quotationId}`);
  };

  const handleViewBooking = () => {
    if (!bookingId) {
      toast.error("Booking not created yet");
      return;
    }
    navigate(`/booking/${bookingId}`);
  };

  const channelPartner = lead?.channel_partner_detail || null;
  const channelPartnerLabel = lead?.channel_partner_name || "-";

  let activeStageId = null;
  if (stageHistory.length > 0) {
    const sorted = [...stageHistory].sort((a, b) => {
      const aKey = a.event_date || a.created_at || "";
      const bKey = b.event_date || b.created_at || "";
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return (a.id || 0) - (b.id || 0);
    });
    activeStageId = sorted[sorted.length - 1].stage;
  }

  const activeStageOrder =
    activeStageId && stages.length
      ? stages.find((s) => s.id === activeStageId)?.order ?? null
      : null;

  // Get current stage name for display
  const currentStageName = activeStageId && stages.length
    ? toTitleCase(String(stages.find((s) => s.id === activeStageId)?.name || "").replace(/_/g, " "))
    : "-";

  const toIntOrNull = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  const lookupOptions = (key) => {
    if (!lookups || !lookups[key]) return [];
    return lookups[key].map((item) => ({
      value: item.id,
      label: toTitleCase(item.name || item.code || `#${item.id}`),
    }));
  };

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ====================== HANDLERS ======================

  const handleActivityChange = (field, value) => {
    setActivityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateActivity = async () => {
    if (!lead) return;

    if (!activityForm.update_type) {
      toast.error("Please select activity type");
      return;
    }

    // ✅ Things to do / remarks is now mandatory
    // if (!activityForm.info || !activityForm.info.trim()) {
    //   toast.error("Please fill Things to do / remarks.");
    //   return;
    // }

    setSavingActivity(true);
    try {
      const payload = {
        sales_lead: lead.id,
        update_type: activityForm.update_type,
        title: activityForm.title || "Activity",
        info: activityForm.info || "",
        event_date: activityForm.event_date || null,
      };

      const res = await api.post("/sales/sales-lead-updates/", payload);
      const newUpdate = res.data;

      setLead((prev) => ({
        ...prev,
        updates: [newUpdate, ...(prev?.updates || [])],
      }));

      setActivityForm({
        update_type: "FOLLOW_UP",
        title: "",
        info: "",
        event_date: nowForInput(),
      });
      setShowActivityForm(false);
      toast.success("Activity saved");
    } catch (err) {
      console.error("Failed to create update", err);
      toast.error("Failed to save activity");
    } finally {
      setSavingActivity(false);
    }
  };


  const handleAddDocClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setDocTitle(baseName);
    setDocModalOpen(true);

    e.target.value = "";
  };

  const handleSaveInterested = async () => {
    if (!lead || !selectedUnitId) return;

    const existing = interestedUnits[0]; // sirf ek interested unit allowed
    setInterestedSaving(true);

    try {
      // 1) Purana interested hatado (agar hai)
      if (existing && existing.id) {
        await api.delete(`/sales/interested-units/${existing.id}/`);
      }

      // 2) Naya interested unit create karo
      const res = await api.post("/sales/interested-units/", {
        sales_lead: lead.id,
        unit: selectedUnitId, // 👈 yahi tumhara original field hai
      });

      const newRecord = res.data;
      setInterestedUnits([newRecord]);
      setInterestedModalOpen(false);
      toast.success("Interested unit updated");
    } catch (err) {
      console.error("Saving interested unit failed", err);
      toast.error("Failed to save interested unit");
    } finally {
      setInterestedSaving(false);
    }
  };

  const handleCancelUploadDoc = () => {
    if (uploadingDoc) return;
    setDocModalOpen(false);
    setPendingFile(null);
    setDocTitle("");
  };

  const handleConfirmUploadDoc = async () => {
    if (!pendingFile || !leadId) return;

    const formData = new FormData();
    formData.append("sales_lead", leadId);
    formData.append("title", docTitle || pendingFile.name);
    formData.append("file", pendingFile);

    setUploadingDoc(true);
    try {
      const res = await api.post("/sales/sales-lead-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newDoc = res.data;
      setLead((prev) => ({
        ...prev,
        documents: [...(prev?.documents || []), newDoc],
      }));
      setDocModalOpen(false);
      setPendingFile(null);
      setDocTitle("");
      toast.success("Document uploaded");
    } catch (err) {
      console.error("Failed to upload document", err);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocClick = (doc) => {
    if (!doc || !doc.file_url) return;
    window.open(doc.file_url, "_blank", "noopener,noreferrer");
  };

  const handleInventoryClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/inventory-planning/?project_id=${projectId}`);
  };

  const handleOpenLeadStatusModal = () => {
    if (!lead) return;
    setLeadStatusForm({
      status: lead.status || "",
      sub_status: lead.sub_status || "",
      comment: "",
    });
    setLeadStatusModalOpen(true);
  };

  const handleSaveLeadStatus = async () => {
    if (!lead) return;
    if (!leadStatusForm.status) {
      toast.error("Please select a status.");
      return;
    }

    // ✅ Note / remark mandatory
    if (!leadStatusForm.comment || !leadStatusForm.comment.trim()) {
      toast.error("Please write a note / remark for this status change.");
      return;
    }

    setSavingLeadStatus(true);
    try {
      const payload = {
        status_id: Number(leadStatusForm.status),
        ...(leadStatusForm.sub_status
          ? { sub_status_id: Number(leadStatusForm.sub_status) }
          : {}),
        comment: leadStatusForm.comment.trim(),
      };

      await api.post(`/sales/sales-leads/${lead.id}/change-status/`, payload);

      const resLead = await api.get(`/sales/sales-leads/${lead.id}/`, {
        params: { include_all_stage: true },
      });
      setLead(resLead.data);

      toast.success("Lead status updated");
      setLeadStatusModalOpen(false);
    } catch (err) {
      console.error("Failed to update lead status", err);
      toast.error("Failed to update lead status");
    } finally {
      setSavingLeadStatus(false);
    }
  };


  const handleBookFlatClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/booking/form/?project_id=${projectId}&lead_id=${lead.id}`);
  };

  const handleQuotationClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/cost-sheets/new/${lead.id}`);
  };

  const handleSiteVisitClick = () => {
    if (!lead) return;
    const projectId = lead.project;

    if (!projectId) {
      toast.error("Project is not linked for this lead.");
      return;
    }

    navigate(
      `/sales/lead/site-visit/create?lead_id=${lead.id}&project_id=${projectId}`
    );
  };

  const handleStageClick = (stage, canMoveForwardOnly = true) => {
    if (!lead) return;
    if (activeStageId && stage.id === activeStageId) return;

    // prevent moving backward
    if (
      canMoveForwardOnly &&
      activeStageOrder != null &&
      stage.order <= activeStageOrder
    ) {
      toast.error("Cannot move back to a previous stage.");
      return;
    }

    setStageModal({
      open: true,
      stage,
    });
    setStageChangeNote(""); // 🔹 har baar fresh note
  };

  const handleStageDropdownChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    const stageId = Number(value);
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;

    if (activeStageId && stageId === activeStageId) return;

    if (activeStageOrder != null && stage.order <= activeStageOrder) {
      toast.error("Cannot move back to a previous stage.");
      return;
    }

    handleStageClick(stage, true); // same modal / same flow
  };

  const handleCancelStageChange = () => {
    if (savingStage) return;
    setStageModal({ open: false, stage: null });
    setStageChangeNote("");
  };

  const handleConfirmStageChange = async () => {
    if (!lead || !stageModal.stage) return;

    if (!stageChangeNote.trim()) {
      
      toast.error("Please enter a note for this stage change.");
      return;
    }

    setSavingStage(true);
    try {
      const payload = {
        sales_lead: lead.id,
        stage: stageModal.stage.id,
        status: lead.status || null,
        sub_status: lead.sub_status || null,
        event_date: new Date().toISOString(),
        notes: stageChangeNote.trim(), // 🔹 ab empty nahi
      };

      setStatusForm((prev) => ({
        ...prev,
        status: lead.status || "",
        sub_status: lead.sub_status || "",
      }));

      const res = await api.post("/sales/sales-lead-stages/", payload);
      const newHistory = res.data;

      setLead((prev) => ({
        ...prev,
        stage_history: [...(prev?.stage_history || []), newHistory],
      }));
      toast.success("Lead stage updated");
    } catch (err) {
      console.error("Failed to change stage", err);
      toast.error("Failed to change stage");
    } finally {
      setSavingStage(false);
      setStageModal({ open: false, stage: null });
      setStageChangeNote("");
    }
  };

  const handleLeadInfoChange = (field, value) => {
    setLeadInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLeadInfoSave = async () => {
    if (!lead) return;

    setSavingLeadInfo(true);
    try {
      const payload = {
        first_name: leadInfoForm.first_name || null,
        last_name: leadInfoForm.last_name || null,
        company: leadInfoForm.company || "",
        budget: leadInfoForm.budget === "" ? null : Number(leadInfoForm.budget),
        annual_income:
          leadInfoForm.annual_income === ""
            ? null
            : Number(leadInfoForm.annual_income),
             purpose: leadInfoForm.purpose || null,
      };

      const res = await api.patch(`/sales/sales-leads/${lead.id}/`, payload);
      setLead(res.data);
      setLeadInfoEdit(false);
      toast.success("Lead information updated");
    } catch (err) {
      console.error("Failed to update lead info", err);
      toast.error("Failed to update lead information");
    } finally {
      setSavingLeadInfo(false);
    }
  };

  const handleLeadInfoCancel = () => {
    if (!lead) return;
    setLeadInfoForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company: lead.company || "",
      budget: lead.budget ?? "",
      annual_income: lead.annual_income ?? "",
    });
    setLeadInfoEdit(false);
  };

  const handleExtraSubmit = async () => {
    if (!lead) return;

    setSavingExtra(true);
    try {
      if (cpSelected !== (lead.channel_partner || "")) {
        try {
          const patchRes = await api.patch(`/sales/sales-leads/${lead.id}/`, {
            channel_partner: cpSelected || null,
          });
          setLead(patchRes.data);
        } catch (err) {
          console.error("Failed to update channel partner", err);
        }
      }

      const payload = {
        sales_lead_id: lead.id,
        address: {
          flat_or_building: addressForm.flat_or_building || "",
          area: addressForm.area || "",
          pincode: addressForm.pincode || "",
          city: addressForm.city || "",
          state: addressForm.state || "",
          country: addressForm.country || "",
        },
        cp_info: {
          referral_code: cpInfoForm.referral_code || "",
        },
        personal_info: {
          date_of_birth: personalForm.date_of_birth || null,
          date_of_anniversary: personalForm.date_of_anniversary || null,
          already_part_of_family: personalForm.already_part_of_family,
          secondary_email: personalForm.secondary_email || "",
          alternate_mobile: personalForm.alternate_mobile || "",
          alternate_tel_res: personalForm.alternate_tel_res || "",
          alternate_tel_off: personalForm.alternate_tel_off || "",
          visiting_on_behalf: toIntOrNull(personalForm.visiting_on_behalf),
          current_residence_ownership: toIntOrNull(
            personalForm.current_residence_ownership
          ),
          current_residence_type: personalForm.current_residence_type || "",
          family_size: toIntOrNull(personalForm.family_size),
          possession_desired_in: toIntOrNull(
            personalForm.possession_desired_in
          ),
          facebook: personalForm.facebook || "",
          twitter: personalForm.twitter || "",
          linkedin: personalForm.linkedin || "",
        },
        professional_info: {
          occupation: toIntOrNull(professionalForm.occupation),
          organization_name: professionalForm.organization_name || "",
          office_location: professionalForm.office_location || "",
          office_pincode: professionalForm.office_pincode || "",
          designation: toIntOrNull(professionalForm.designation),
        },
      };

      let res;
      if (proposalFiles.length > 0) {
        const formData = new FormData();
        formData.append("sales_lead_id", String(lead.id));
        formData.append("address", JSON.stringify(payload.address));
        formData.append("cp_info", JSON.stringify(payload.cp_info));
        formData.append("personal_info", JSON.stringify(payload.personal_info));
        formData.append(
          "professional_info",
          JSON.stringify(payload.professional_info)
        );
        proposalFiles.forEach((f) => {
          formData.append("proposal_files", f);
        });

        res = await api.post("/sales/sales-leads/extra-info/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/sales/sales-leads/extra-info/", payload);
      }

      const extra = res.data || {};
      setLead((prev) => ({
        ...prev,
        address: extra.address || prev.address,
        cp_info: extra.cp_info || prev.cp_info,
        personal_info: extra.personal_info || prev.personal_info,
        professional_info: extra.professional_info || prev.professional_info,
        proposal_documents: extra.proposal_documents || prev.proposal_documents,
      }));
      setProposalFiles([]);
      toast.success("Details saved successfully");
    } catch (err) {
      console.error("Failed to save extra info", err);
      toast.error("Failed to save additional details");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleRemoveInterested = async (id) => {
    if (!window.confirm("Remove this interested unit from the lead?")) return;

    setRemovingInterestedId(id);
    try {
      await api.delete(`/sales/interested-units/${id}/`);
      setInterestedUnits((prev) => prev.filter((i) => i.id !== id));
      toast.success("Interested unit removed");
    } catch (err) {
      console.error("Failed to remove interested unit", err);
      toast.error("Failed to remove interested unit");
    } finally {
      setRemovingInterestedId(null);
    }
  };

  const handleSaveInterestedUnits = async () => {
    if (!lead) return;
    if (!selectedUnitIds.length) {
      toast.error("Please select at least one unit.");
      return;
    }

    setAddingInterested(true);
    try {
      const payloads = selectedUnitIds.map((unitId) => ({
        sales_lead: lead.id,
        unit: unitId,
      }));

      const responses = await Promise.all(
        payloads.map((p) => api.post("/sales/interested-units/", p))
      );

      const createdItems = responses.map((r) => r.data);
      setInterestedUnits((prev) => [...createdItems, ...prev]);
      setSelectedUnitIds([]);

      toast.success("Interested units added");
    } catch (err) {
      console.error("Failed to add interested units", err);
      toast.error("Failed to add one or more interested units.");
    } finally {
      setAddingInterested(false);
    }
  };

  const handleEmailFormChange = (field, value) => {
    setEmailForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    if (!lead) return;
    if (!emailForm.subject.trim() && !emailForm.body.trim()) {
      toast.error("Subject or body is required.");
      return;
    }

    setSendingEmail(true);
    try {
      const payload = {
        sales_lead_id: lead.id,
        subject: emailForm.subject || "(no subject)",
        body: emailForm.body || "",
        email_type: "FOLLOWUP",
        cc: emailForm.cc
          ? emailForm.cc
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
        bcc: emailForm.bcc
          ? emailForm.bcc
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      };

      const res = await api.post("/sales/email-logs/send/", payload);
      const newLog = res.data;

      setEmailLogs((prev) => [newLog, ...(prev || [])]);
      setEmailForm({
        subject: "",
        body: "",
        cc: "",
        bcc: "",
      });
      toast.success("Email sent and logged");
    } catch (err) {
      console.error("Failed to send email", err);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <div className="lead-page">Loading lead...</div>;
  }

  if (error) {
    return (
      <div className="lead-page">
        <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="lead-page">
        <div>No lead data found.</div>
      </div>
    );
  }

  // -------- MAIN RENDER --------
  return (
    <div className="lead-page">
      {/* ===== HEADER (same layout as CRM) ===== */}
      <div className="lead-header">
        {/* LEFT: Lead name + basic info */}
        <div className="lead-header-left">
          {/* Top bar: customer name in compact field style */}
          <div className="lead-title-bar">
            <div className="field-compact">
              <label>Customer Name:</label>
              <input type="text" value={displayFullName} readOnly />
            </div>

            <div className="field-compact">
              <label>Lead Status:</label>
              <input type="text" value={currentStageName} readOnly />
            </div>
          </div>

          <div className="lead-header-grid">
            <div className="field-compact">
              <label>Lead Owner:</label>
              <input
                type="text"
                value={toTitleCase(lead?.current_owner_name || lead?.owner || "")}
                readOnly
              />
            </div>

            <div className="field-compact">
              <label>Mobile:</label>
              <input
                type="text"
                value={lead?.mobile_number || lead?.phone || ""}
                readOnly
              />
            </div>

            <div className="field-compact">
              <label>Email:</label>
              <input type="text" value={lead?.email || ""} readOnly />
            </div>

            <div className="field-compact">
              <label>Classification:</label>
              <input
                type="text"
                value={displayStatusName}
                readOnly
                onClick={handleOpenLeadStatusModal}
                className="readonly-clickable"
              />
            </div>

           
          </div>

        </div>

        {/* RIGHT: Action buttons (Inventory / Book Flat / Payments / etc.) */}
        <div className="lead-header-right">
          <div className="action-row-top">
            <button
              type="button"
              className="card-btn"
              onClick={handleInventoryClick}
            >
              Inventory
            </button>

            <button
              type="button"
              className="card-btn"
              onClick={handleBookFlatClick}
            >
              Book Flat
            </button>

            <button
              type="button"
              className="card-btn"
              onClick={handlePaymentsClick}
            >
              Payments
            </button>

            {/* <button
              type="button"
              className="card-btn"
              onClick={handleQuotationClick}
            >
              Payment Link
            </button> */}
          </div>

          <div className="action-row-bottom">
            <button
              type="button"
              className="card-btn small"
              onClick={handleQuotationClick}
            >
              Quotation
            </button>

            <button
              type="button"
              className="card-btn small"
              onClick={handleSiteVisitClick}
            >
              Site Visit
            </button>

            <button
              type="button"
              className="card-btn small"
              onClick={handleQuotationClick}
            >
              Send Feedback
            </button>
          </div>
        </div>
      </div>

      {/* ===== STAGE BAR – same as before ===== */}
      <div className="lead-stages">
        {stages.length === 0 && (
          <div className="stage-item">
            <span className="stage-label">No stages configured</span>
          </div>
        )}
        {(() => {
          // Create a Set of all stage IDs that appear in stage_history
          const stagesInHistory = new Set(
            stageHistory.map((h) => h.stage).filter(Boolean)
          );

          const firstOrder = stages.length
            ? Math.min(...stages.map((s) => s.order ?? 0))
            : null;

          // Get first entry in stage_history (earliest, sorted by date)
          const firstHistoryEntry = stageHistory.length > 0
            ? [...stageHistory].sort((a, b) => {
                const aKey = a.event_date || a.created_at || "";
                const bKey = b.event_date || b.created_at || "";
                if (aKey < bKey) return -1;
                if (aKey > bKey) return 1;
                return (a.id || 0) - (b.id || 0);
              })[0]
            : null;
          const firstHistoryStageId = firstHistoryEntry?.stage || null;

          return stages.map((stage, idx) => {
            let extraClass = "";
            let stageColor = ""; // For inline style

            const isFirstStage = firstOrder != null && stage.order === firstOrder;

            // Color logic based on stage_history
            // First order stage: always BLUE if in history, else grey
            if (isFirstStage) {
              if (stagesInHistory.has(stage.id)) {
                // First stage in history = always BLUE
                extraClass = "stage-done";
                stageColor = "#3b82f6"; // blue-500
              } else {
                // First stage not in history = GREY
                extraClass = "stage-pending";
                stageColor = "#9ca3af"; // gray-400
              }
            } else if (stage.id === activeStageId) {
              // Current stage (latest in history) = GREEN
              extraClass = "stage-current";
              stageColor = "#16a34a"; // green-600
            } else if (stagesInHistory.has(stage.id)) {
              // In history but not current = BLUE
              extraClass = "stage-done";
              stageColor = "#3b82f6"; // blue-500
            } else {
              // Not in history = GREY
              extraClass = "stage-pending";
              stageColor = "#9ca3af"; // gray-400
            }

            const canMoveForwardOnly =
              activeStageOrder == null || stage.order > activeStageOrder;

            return (
              <div
                key={stage.id}
                className={`stage-item ${extraClass}`}
                onClick={() => {
                  if (!canMoveForwardOnly) return; // Prevent click on previous stages
                  handleStageClick(stage, canMoveForwardOnly);
                }}
                style={{
                  cursor: canMoveForwardOnly ? "pointer" : "not-allowed",
                  // Apply color to stage dot
                  "--stage-color": stageColor,
                }}
              >
                <span
                  className="stage-dot"
                  style={{
                    backgroundColor: stageColor,
                    borderColor: stageColor,
                  }}
                />
                <span className="stage-label">
                  {toTitleCase(String(stage.name || "").replace(/_/g, " "))}
                </span>
              </div>
            );
          });
        })()}
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="content-split">
        {/* LEFT – Lead Information */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span>Lead Information</span>
            {!leadInfoEdit ? (
              <button
                className="link-btn"
                type="button"
                onClick={() => setLeadInfoEdit(true)}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-primary small"
                  type="button"
                  onClick={handleLeadInfoSave}
                  disabled={savingLeadInfo}
                >
                  {savingLeadInfo ? "Saving..." : "Save"}
                </button>
                <button
                  className="btn-secondary small"
                  type="button"
                  onClick={handleLeadInfoCancel}
                  disabled={savingLeadInfo}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="panel-body">
            <div className="field-compact">
              <label>First Name:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.first_name}
                  onChange={(e) =>
                    handleLeadInfoChange("first_name", e.target.value)
                  }
                />
              ) : (
                <input value={toTitleCase(lead.first_name || "")} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Last Name:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.last_name}
                  onChange={(e) =>
                    handleLeadInfoChange("last_name", e.target.value)
                  }
                />
              ) : (
                <input value={toTitleCase(lead.last_name || "")} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Company:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.company}
                  onChange={(e) =>
                    handleLeadInfoChange("company", e.target.value)
                  }
                />
              ) : (
                <input value={toTitleCase(lead.company || "")} readOnly />
              )}
            </div>
            <div className="field-compact">
              {/* <label>Budget:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.budget}
                  onChange={(e) =>
                    handleLeadInfoChange("budget", e.target.value)
                  }
                />
              ) : (
                <input
                  value={
                    lead.budget != null && lead.budget !== ""
                      ? formatINR(lead.budget)
                      : ""
                  }
                  readOnly
                />
              )} */}

              <label>Budget:</label>
              {leadInfoEdit ? (
                <select
                  value={leadInfoForm.budget}
                  onChange={(e) =>
                    handleLeadInfoChange("budget", e.target.value)
                  }
                >
                  <option value="">Select budget</option>
                  <option value="19000000">Below 2 Cr</option>
                  <option value="23000000">2 to 2.5 Cr</option>
                  <option value="30000000">2.5 to 3 Cr</option>
                  <option value="49000000">3 to 4 Cr</option>
                  <option value="50000000">4 to 5 Cr</option>
                  <option value="56000000">5Cr and above</option>

                  
                </select>
              ) : (
                <input
                  value={
                    lead.budget != null && lead.budget !== ""
                      ? formatINR(lead.budget)
                      : ""
                  }
                  readOnly
                />
              )}

            </div>

            <div className="field-compact">
              <label>Annual Income:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.annual_income}
                  onChange={(e) =>
                    handleLeadInfoChange("annual_income", e.target.value)
                  }
                />
              ) : (
                <input
                  value={
                    lead.annual_income != null && lead.annual_income !== ""
                      ? formatINR(lead.annual_income)
                      : ""
                  }
                  readOnly
                />
              )}
            </div>

            <div className="field-compact">
              <label>Project:</label>
              <input value={toTitleCase(lead.project_name || `#${lead.project}`)} readOnly />
            </div>
            {/* <div className="field-compact">
              <label>Purpose:</label>
              <input value={toTitleCase(lead.purpose_name || "")} readOnly />
            </div> */}

            <div className="field-compact">
                      <label>Purpose:</label>

                      {leadInfoEdit ? (
                        <select
                          value={leadInfoForm.purpose || ""}
                          onChange={(e) =>
                            handleLeadInfoChange("purpose", e.target.value)
                          }
                        >
                          <option value="">Select purpose</option>
                          <option value="2">Investment</option>
                          <option value="5">Second Home</option>
                          <option value="6">Self Use</option>
                        </select>
                      ) : (
                        <input
                          value={toTitleCase(lead.purpose_name || "")}
                          readOnly
                        />
                      )}
                    </div>



          </div>
        </div>

        {/* RIGHT – Activity / Email / Documents */}
        <div className="panel panel-right">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "activity" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>
            <button
              className={`tab ${activeTab === "comment" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("comment")}
            >
              Comment
            </button>
            <button
              className={`tab ${activeTab === "logs" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("logs")}
            >
              Logs
            </button>
            <button
              className={`tab ${activeTab === "email" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("email")}
            >
              Email
            </button>
            <button className="tab" type="button" onClick={handleBookFlatClick}>
              Booking
            </button>
            {/* <button
              className={`tab ${activeTab === "email" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("email")}
            >
              Email
            </button> */}
            <button className="tab tab-locked" type="button">
              SMS <span className="lock-icon">🔒</span>
            </button>
            <button className="tab tab-locked" type="button">
              Zoom <span className="lock-icon">🔒</span>
            </button>
          </div>

          {activeTab === "activity" && (
            <div className="activity-wrapper">
              {/* Filter */}
              <div className="activity-filter">
                <label className="filter-label">Filter by Activity Type</label>
                <select
                  className="filter-select"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="NOTE">Note</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="STATUS_CHANGE">Status Change</option>
                  <option value="CALL">Call</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Add Activity Button */}
              {!showActivityForm && (
                <div
                  className="activity-row add-activity"
                  onClick={() => {
                    setShowActivityForm(true);
                    setActivityForm({
                      update_type: "FOLLOW_UP",
                      title: "",
                      info: "",
                      event_date: nowForInput(),
                    });
                  }}
                >
                  <div className="activity-icon plus">+</div>
                  <div className="activity-strip">
                    <div className="strip-title">Add a new activity</div>
                    <div className="strip-sub">
                      Plan your next action in the deal to never forget about
                      the customer
                    </div>
                  </div>
                </div>
              )}

              {/* Create Activity Form */}
              {showActivityForm && (
                <div className="activity-form-card">
                  <div className="field-full">
                    <label>Activity Type</label>
                    <select
                      value={activityForm.update_type || ""}
                      onChange={(e) =>
                        handleActivityChange("update_type", e.target.value)
                      }
                    >
                      <option value="">Select type</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="REMINDER">Reminder</option>
                      <option value="NOTE">Note</option>
                      <option value="WHATSAPP">WhatsApp Message</option>
                      <option value="EMAIL">Email</option>
                      <option value="STATUS_CHANGE">Status Change</option>
                      <option value="CALL">Call Log</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="field-full">
                    <label>Things to do</label>  
                    <input
                      className="input-plain"
                      value={activityForm.title}
                      onChange={(e) =>
                        handleActivityChange("title", e.target.value)
                      }
                    />
                  </div>

                   

                  {/* <div className="field-full">
                    <label>Things to do</label>
                    <textarea
                      className="input-plain tall"
                      value={activityForm.info}
                      onChange={(e) =>
                        handleActivityChange("info", e.target.value)
                      }
                    />
                  </div> */}

                  <div className="field-full">
                    <label>Date</label>
                    <input
                      type="datetime-local"
                      className="input-plain"
                      value={activityForm.event_date}
                      onChange={(e) =>
                        handleActivityChange("event_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="activity-buttons">
                    <button
                      className="btn-primary"
                      onClick={handleCreateActivity}
                      disabled={savingActivity}
                    >
                      {savingActivity ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowActivityForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Filtered Activity List */}
              <div className="activity-list">
                {filteredUpdates.length === 0 ? (
                  <div className="no-activity">
                    <div className="activity-icon info">i</div>
                    <div className="activity-strip">
                      <div className="strip-title">No activities found.</div>
                    </div>
                  </div>
                ) : (
                  filteredUpdates.map((u) => {
                    const body = u.remarks || u.info || "";
                    const when = u.event_date || u.created_at || null;
                    const statusLabel = getUpdateStatusLabel(u);

                    return (
                      <div key={u.id} className="activity-row">
                        <div className="activity-icon info">i</div>
                        <div className="activity-strip">
                          <div className="strip-title">
                            {toTitleCase(u.title || "(No title)")}
                          </div>

                          {body && <div className="strip-sub">{toTitleCase(body)}</div>}

                          <div className="strip-sub small">
                            {formatUpdateType(u.update_type)}
                            {u.created_by_name && ` • ${toTitleCase(u.created_by_name)}`}
                            {when &&
                              ` • ${new Date(when).toLocaleString("en-GB")}`}
                          </div>

                          {/* 🔹 Activity status pill + change option */}
                          <div className="activity-status-row">
                            <span className="activity-status-label">
                              Activity Status:
                            </span>
                            <button
                              type="button"
                              className="activity-status-pill"
                              onClick={() => openActivityStatusModal(u)}
                            >
                              {statusLabel}
                            </button>
                          </div>

                          {/* 🔹 Status history timeline */}
                          {Array.isArray(u.status_history) &&
                            u.status_history.length > 0 && (
                              <div className="activity-status-history">
                                {u.status_history.map((sh) => (
                                  <div key={sh.id} className="status-log-line">
                                    <div className="status-log-badge">
                                      {toTitleCase(sh.old_status_label || "-")} →{" "}
                                      {toTitleCase(sh.new_status_label || "-")}
                                    </div>
                                    <div className="status-log-meta">
                                      {toTitleCase(sh.changed_by_name || "Staff")}
                                      {sh.event_date &&
                                        ` • ${new Date(
                                          sh.event_date
                                        ).toLocaleString("en-GB")}`}
                                    </div>
                                    {sh.comment && (
                                      <div className="status-log-comment">
                                        {toTitleCase(sh.comment)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "comment" && (
            <div className="comment-wrapper">
              <div className="comment-form">
                <div className="comment-form-row">
                  <div className="field-full">
                    <label>Stage at time of comment</label>
                    <select
                      value={commentForm.stage_at_time || ""}
                      onChange={(e) =>
                        handleCommentChange("stage_at_time", e.target.value)
                      }
                    >
                      <option value="">
                        {stages.length ? "Current stage (default)" : "Select"}
                      </option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.order}. {toTitleCase(String(s.name || "").replace(/_/g, " "))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field-full">
                  <label>Comment (required)</label>
                  <textarea
                    className="input-plain tall"
                    placeholder="Add a comment / remark for this lead"
                    value={commentForm.text}
                    onChange={(e) =>
                      handleCommentChange("text", e.target.value)
                    }
                  />
                </div>

                <div className="comment-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmitComment}
                    disabled={savingComment}
                  >
                    {savingComment ? "Saving..." : "Add Comment"}
                  </button>
                </div>
              </div>

              <div className="comment-list">
                {loadingComments ? (
                  <div className="empty-state small">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="empty-state small">
                    No comments added yet.
                  </div>
                ) : (
                  comments.map((c) => (
                      <div key={c.id} className="comment-item">
                      <div className="comment-meta">
                        <span className="comment-author">
                          {toTitleCase(c.created_by_name || "Staff")}
                        </span>

                        {c.stage_at_time_name && (
                          <span className="comment-stage-pill">
                            {toTitleCase(c.stage_at_time_name)}
                          </span>
                        )}

                        {c.created_at && (
                          <span className="comment-time">
                            {new Date(c.created_at).toLocaleString("en-GB")}
                          </span>
                        )}
                      </div>

                      <div className="comment-text">{toTitleCase(c.text)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="email-wrapper">
              <div className="email-toggle-row">
                <button
                  type="button"
                  className={`email-toggle-btn ${
                    emailView === "compose" ? "active" : ""
                  }`}
                  onClick={() => setEmailView("compose")}
                >
                  Compose
                </button>
                <button
                  type="button"
                  className={`email-toggle-btn ${
                    emailView === "history" ? "active" : ""
                  }`}
                  onClick={() => setEmailView("history")}
                >
                  History
                </button>
              </div>

              {emailView === "compose" && (
                <div className="email-form">
                  <div className="field-full">
                    <label>To</label>
                    <input value={email || "-"} readOnly />
                  </div>
                  <div className="field-full">
                    <label>Subject</label>
                    <input
                      value={emailForm.subject}
                      onChange={(e) =>
                        handleEmailFormChange("subject", e.target.value)
                      }
                    />
                  </div>
                  <div className="field-full">
                    <label>Body</label>
                    <textarea
                      className="input-plain tall email-body"
                      value={emailForm.body}
                      onChange={(e) =>
                        handleEmailFormChange("body", e.target.value)
                      }
                    />
                  </div>

                  <div className="email-cc-row">
                    <div className="field-full">
                      <label>CC</label>
                      <input
                        placeholder="cc1@example.com, cc2@example.com"
                        value={emailForm.cc}
                        onChange={(e) =>
                          handleEmailFormChange("cc", e.target.value)
                        }
                      />
                    </div>
                    <div className="field-full">
                      <label>BCC</label>
                      <input
                        placeholder="bcc1@example.com, bcc2@example.com"
                        value={emailForm.bcc}
                        onChange={(e) =>
                          handleEmailFormChange("bcc", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="email-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              )}

              {emailView === "history" && (
                <div className="email-history">
                  {loadingEmailLogs ? (
                    <div className="email-logs-empty">Loading logs...</div>
                  ) : emailLogs.length === 0 ? (
                    <div className="email-logs-empty">
                      No emails sent yet for this lead.
                    </div>
                  ) : (
                    <div className="email-logs-list">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="email-log-item">
                          <div className="email-log-header">
                            <span className="email-log-subject">
                              {toTitleCase(log.subject || "(no subject)")}
                            </span>
                            {log.email_type && (
                              <span className="email-log-chip">
                                {toTitleCase(log.email_type)}
                              </span>
                            )}
                          </div>

                          {log.body && (
                            <div className="email-log-body">
                              {log.body.length > 120
                                ? toTitleCase(log.body.slice(0, 120) + "…")
                                : toTitleCase(log.body)}
                            </div>
                          )}

                          <div className="email-log-meta">
                            {log.created_at &&
                              new Date(log.created_at).toLocaleString("en-GB")}
                            {log.sent_by_name ? ` • ${toTitleCase(log.sent_by_name)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "logs" && (
            <div className="logs-wrapper">
              {/* Filters row (simple) */}
              <div className="activity-filter">
                <label className="filter-label">Filter by type</label>
                <select
                  className="filter-select"
                  value={timelineType}
                  onChange={(e) => setTimelineType(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="BOOKING">Booking</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="SITE_VISIT">Site Visit</option>
                  <option value="LEAD_CHANGE">Lead Change</option>
                  <option value="EMAIL">Email</option>
                  <option value="COMMENT">Comment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="activity-filter" style={{ marginTop: 8 }}>
                <label className="filter-label">Search</label>
                <input
                  className="filter-select"
                  placeholder="Search in logs (e.g. booking, payment)..."
                  value={timelineQuery}
                  onChange={(e) => setTimelineQuery(e.target.value)}
                />
              </div>

              {loadingTimeline ? (
                <div className="empty-state small">Loading logs...</div>
              ) : timelineLogs.length === 0 ? (
                <div className="empty-state small">
                  No logs found for this lead.
                </div>
              ) : (
                <div className="activity-list">
                  {timelineLogs.map((log) => {
                    const typeRaw =
                      log.type || log.event_type || log.timeline_type || "";
                    const typeLabel = formatUpdateType(typeRaw);
                    const desc =
                      log.description || log.message || log.info || "";
                    const who =
                      log.created_by_name ||
                      log.user_name ||
                      log.actor_name ||
                      log.owner_name ||
                      "";
                    const when =
                      log.event_date || log.created_at || log.timestamp || null;

                    const title =
                      log.title ||
                      log.headline ||
                      log.ref_label ||
                      typeLabel ||
                      "Log entry";

                    return (
                      <div
                        key={log.id || `${typeRaw}-${when}`}
                        className="activity-row"
                      >
                        <div className="activity-icon info">🧾</div>
                        <div className="activity-strip">
                          <div className="strip-title">{toTitleCase(title)}</div>

                          {desc && <div className="strip-sub">{toTitleCase(desc)}</div>}

                          <div className="strip-sub small">
                            {typeLabel && `${typeLabel} • `}
                            {who && `${toTitleCase(who)} • `}
                            {when && new Date(when).toLocaleString("en-GB")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="documents-wrapper">
            <div className="documents-header">
              <span>Documents</span>
            </div>
            <div className="documents-body">
              {inventoryDocs.length > 0 && (
                <>
                  <div className="documents-subtitle">Project Documents</div>
                  <div className="documents-row">
                    {inventoryDocs.map((doc) => {
                      const label =
                        (doc.original_name && doc.original_name.trim()) ||
                        doc.doc_type ||
                        "Document";

                      return (
                        <div
                          key={`inv-${doc.id}`}
                          className="doc-card"
                          onClick={() => handleDocClick(doc)}
                          style={{
                            cursor: doc.file_url ? "pointer" : "default",
                          }}
                        >
                          <div className="doc-icon" />
                          <div className="doc-label">{toTitleCase(label)}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="documents-subtitle">Lead Documents</div>
              <div className="documents-row">
                    {documents.map((doc) => {
                  const label =
                    doc.title && doc.title.trim()
                      ? doc.title.trim()
                      : "Untitled";

                  return (
                    <div
                      key={doc.id}
                      className="doc-card"
                      onClick={() => handleDocClick(doc)}
                      style={{ cursor: doc.file_url ? "pointer" : "default" }}
                    >
                      <div className="doc-icon" />
                      <div className="doc-label">{toTitleCase(label)}</div>
                    </div>
                  );
                })}

                <button
                  className="doc-card add-doc"
                  onClick={handleAddDocClick}
                  type="button"
                  disabled={uploadingDoc}
                >
                  <span className="add-symbol">{uploadingDoc ? "…" : "+"}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CP Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("cp")}
          style={{ cursor: "pointer" }}
        >
          <span>CP Information</span>
          <span className="chevron">{collapsedSections.cp ? "▼" : "▲"}</span>
        </div>
        {!collapsedSections.cp && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Referral Code</label>
                <input
                  value={
                    cpInfoForm.referral_code || lead.cp_referral_code || ""
                  }
                  readOnly
                />
              </div>

              <div className="field-full">
                <label>Channel Partner</label>
                <input
                  value={toTitleCase(
                    (channelPartner &&
                      (channelPartner.user_name ||
                        channelPartner.company_name)) ||
                    channelPartnerLabel || ""
                  )}
                  readOnly
                />
              </div>
            </div>

            <div className="column">
              {channelPartner ? (
                <>
                  <div className="field-full">
                    <label>CP Name / Company</label>
                    <input
                      value={toTitleCase(
                        channelPartner.company_name ||
                        channelPartner.user_name ||
                        channelPartnerLabel || ""
                      )}
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Mobile</label>
                    <input
                      value={channelPartner.mobile_masked || "-"}
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Email</label>
                    <input
                      value={channelPartner.email_masked || "-"}
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Status</label>
                    <input value={toTitleCase(channelPartner.status || "-")} readOnly />
                  </div>
                  <div className="field-full">
                    <label>Onboarding Status</label>
                    <input
                      value={toTitleCase(channelPartner.onboarding_status || "-")}
                      readOnly
                    />
                  </div>
                </>
              ) : (
                <div className="field-full">
                  <label>Channel Partner Details</label>
                  <input value="Not linked" readOnly />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Proposal Form */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("proposal")}
          style={{ cursor: "pointer" }}
        >
          <span>Proposal Form</span>
          <span className="chevron">
            {collapsedSections.proposal ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.proposal && (
          <div className="section-body">
            {/* View PDFs only */}
            <div className="proposal-files">
              {quotationId && (
                <div className="proposal-file-group">
                  <div className="proposal-file-title">Quotation</div>
                  <button
                    type="button"
                    className="btn-primary proposal-view-btn"
                    onClick={handleViewQuotation}
                  >
                    View Quotation
                  </button>
                </div>
              )}

              {bookingId && (
                <div className="proposal-file-group">
                  <div className="proposal-file-title">Booking</div>
                  <button
                    type="button"
                    className="btn-primary proposal-view-btn"
                    onClick={handleViewBooking}
                  >
                    View Booking
                  </button>
                </div>
              )}
            </div>

            {/* Upload extra proposal docs – hide if booking or quotation already present */}
            {!bookingId && !quotationId && (
              <div className="proposal-attachment">
                <label>Attachment:</label>
                <div className="proposal-upload-row">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setProposalFiles(files);
                    }}
                  />
                  {proposalFiles.length > 0 && (
                    <div className="proposal-file-list">
                      {proposalFiles.map((f) => (
                        <div key={f.name} className="proposal-file-item">
                          {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interested Inventory */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("interested")}
          style={{ cursor: "pointer" }}
        >
          <span>Interested Inventory</span>
          <span className="chevron">
            {collapsedSections.interested ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.interested && (
          <div className="section-body">
            {loadingInterested ? (
              <div className="empty-state">Loading interested units...</div>
            ) : (
              <>
                <div className="interested-units-section">
                  <div className="interested-header">
                    <h4>Current Interested Units</h4>
                  </div>
                  {interestedUnits.length === 0 ? (
                    <div className="empty-state">
                      No interested units linked yet.
                    </div>
                  ) : (
                    <div className="interested-list">
                      {interestedUnits.map((iu) => (
                        <div key={iu.id} className="interested-item">
                            <div className="interested-info">
                            <div className="interested-label">
                              {toTitleCase(iu.unit_label || `Unit #${iu.unit}`)}
                            </div>
                            <div className="interested-meta">
                              {toTitleCase(iu.project_name || `Project #${iu.project_id}`)} •{" "}
                              {iu.created_at
                                ? new Date(iu.created_at).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "-"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemoveInterested(iu.id)}
                            disabled={removingInterestedId === iu.id}
                          >
                            {removingInterestedId === iu.id ? "..." : "×"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="interested-units-section">
                  <div className="interested-header">
                    <h4>Interested Unit</h4>
                    <button
                      type="button"
                      className="btn-primary small"
                      onClick={() => {
                        setInterestedSearch("");
                        setSelectedUnitId(null);
                        setSelectedUnitInfo(null);
                        setInterestedModalOpen(true);
                      }}
                    >
                      + Add Interested Unit
                    </button>
                  </div>

                  {interestedUnits.length === 0 ? (
                    <div className="empty-state small">
                      No interested unit selected yet.
                    </div>
                  ) : (
                    <div className="interested-list">
                      {interestedUnits.map((u) => (
                        <div key={u.id} className="interested-item">
                          <div className="interested-info">
                            <div className="interested-label">
                              {toTitleCase(u.label || u.inventory_name || "")}
                            </div>
                            <div className="interested-meta">
                              {toTitleCase(u.tower_name || "")} • {toTitleCase(u.floor_name || "")} • {toTitleCase(u.unit_no || "")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("additional")}
          style={{ cursor: "pointer" }}
        >
          <span>Additional Information</span>
          <span className="chevron">
            {collapsedSections.additional ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.additional && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Date of Anniversary</label>
                <input
                  type="date"
                  value={personalForm.date_of_anniversary}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      date_of_anniversary: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full checkbox-inline">
                <label>Already a part of the family?</label>
                <input
                  type="checkbox"
                  checked={personalForm.already_part_of_family}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      already_part_of_family: e.target.checked,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Project Name</label>
                <input value={toTitleCase(lead.project_name || "")} readOnly />
              </div>

              <div className="field-full">
                <label>Visiting On Behalf</label>
                <select
                  value={personalForm.visiting_on_behalf || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      visiting_on_behalf: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("visiting_half").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Current Residence Ownership</label>
                <select
                  value={personalForm.current_residence_ownership || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      current_residence_ownership: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("residency_ownerships").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Current Residence type</label>
                <input
                  value={personalForm.current_residence_type}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      current_residence_type: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-full">
                <label>Family Size</label>
                <select
                  value={personalForm.family_size || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      family_size: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("family_sizes").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Possession desired in</label>
                <select
                  value={personalForm.possession_desired_in || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      possession_desired_in: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("possession_designed").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="column">
              <div className="field-full">
                <label>Secondary Email</label>
                <input
                  value={personalForm.secondary_email}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      secondary_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Mobile</label>
                <input
                  value={personalForm.alternate_mobile}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_mobile: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Tel (Res)</label>
                <input
                  value={personalForm.alternate_tel_res}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_tel_res: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Tel (Off)</label>
                <input
                  value={personalForm.alternate_tel_off}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_tel_off: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Facebook</label>
                <input
                  value={personalForm.facebook}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      facebook: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Twitter</label>
                <input
                  value={personalForm.twitter}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      twitter: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Linkedin</label>
                <input
                  value={personalForm.linkedin}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("professional")}
          style={{ cursor: "pointer" }}
        >
          <span>Professional Information</span>
          <span className="chevron">
            {collapsedSections.professional ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.professional && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Occupation</label>
                <select
                  value={professionalForm.occupation || ""}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      occupation: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("occupations").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-full">
                <label>Name of the Organization</label>
                <input
                  value={professionalForm.organization_name}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      organization_name: e.target.value,
                    }))
                  }
                  placeholder={professionalForm.organization_name ? toTitleCase(professionalForm.organization_name) : ""}
                />
              </div>
              <div className="field-full">
                <label>Designation</label>
                <select
                  value={professionalForm.designation || ""}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      designation: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("designations").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="column">
              <div className="field-full">
                <label>Office Location</label>
                <input
                  value={professionalForm.office_location}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      office_location: e.target.value,
                    }))
                  }
                  placeholder={professionalForm.office_location ? toTitleCase(professionalForm.office_location) : "Auto-filled from pincode"}
                />
              </div>
              <div className="field-full">
                <label>
                  Pin Code
                  {loadingOfficePincode && (
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
                      (Looking up...)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={professionalForm.office_pincode}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      office_pincode: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Enter 6-digit pincode"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("address")}
          style={{ cursor: "pointer" }}
        >
          <span>Address Information</span>
          <span className="chevron">
            {collapsedSections.address ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.address && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Flat no. / Building</label>
                <input
                  value={addressForm.flat_or_building}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      flat_or_building: e.target.value,
                    }))
                  }
                  placeholder={addressForm.flat_or_building ? toTitleCase(addressForm.flat_or_building) : ""}
                />
              </div>
              <div className="field-full">
                <label>Area</label>
                <input
                  value={addressForm.area}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      area: e.target.value,
                    }))
                  }
                  placeholder={addressForm.area ? toTitleCase(addressForm.area) : "Auto-filled from pincode"}
                />
              </div>
              <div className="field-full">
                <label>
                  Pin Code
                  {loadingAddressPincode && (
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
                      (Looking up...)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={addressForm.pincode}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      pincode: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Enter 6-digit pincode"
                />
              </div>
              <div className="field-full">
                <label>City</label>
                <input
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder={addressForm.city ? toTitleCase(addressForm.city) : "Auto-filled from pincode"}
                />
              </div>
            </div>
            <div className="column">
              <div className="field-full">
                <label>State</label>
                <input
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder={addressForm.state ? toTitleCase(addressForm.state) : "Auto-filled from pincode"}
                />
              </div>
              <div className="field-full">
                <label>Country</label>
                <input
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder={addressForm.country ? toTitleCase(addressForm.country) : "Auto-filled from pincode"}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="footer-buttons">
        <button
          className="btn-secondary big"
          type="button"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
        <button
          className="btn-primary big"
          type="button"
          onClick={handleExtraSubmit}
          disabled={savingExtra}
        >
          {savingExtra ? "Saving..." : "Submit"}
        </button>
      </div>

      {/* Stage change modal */}
      {stageModal.open && stageModal.stage && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">
              Move to "{stageModal.stage.name}"
            </div>
            <div className="modal-body">
              <div>
                Are you sure you want to move this lead to{" "}
                <strong>{stageModal.stage.name}</strong>
              </div>

              <div className="field-full" style={{ marginTop: 12 }}>
                <label>Note (required)</label>
                <textarea
                  className="input-plain tall"
                  value={stageChangeNote}
                  onChange={(e) => setStageChangeNote(e.target.value)}
                  placeholder="Reason / context for this stage change"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCancelStageChange}
                disabled={savingStage}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleConfirmStageChange}
                disabled={savingStage}
              >
                {savingStage ? "Updating..." : "Yes, move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {leadStatusModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Change Lead Status</div>
            <div className="modal-body">
              {/* STATUS SELECT */}
              <div className="field-full">
                <label>Status</label>
                <select
                  value={leadStatusForm.status || ""}
                  onChange={(e) =>
                    setLeadStatusForm((prev) => ({
                      ...prev,
                      status: e.target.value ? Number(e.target.value) : "",
                      // status change hote hi purana sub_status clear karo
                      sub_status: "",
                    }))
                  }
                >
                  <option value="">Select status</option>
                  {leadStatusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUB STATUS SELECT – sirf ek rakho, duplicate waala hata do */}
              <div className="field-full">
                <label>Sub Status</label>
                <select
                  value={leadStatusForm.sub_status || ""}
                  onChange={(e) =>
                    setLeadStatusForm((prev) => ({
                      ...prev,
                      sub_status: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                  disabled={!leadStatusForm.status}
                >
                  <option value="">
                    {leadStatusForm.status
                      ? "Select sub status"
                      : "Select status first"}
                  </option>
                  {leadSubStatusOptions.map((ss) => (
                    <option key={ss.value} value={ss.value}>
                      {ss.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Note (required)</label>
                <textarea
                  className="input-plain tall"
                  placeholder="Write a note for this status change"
                  value={leadStatusForm.comment}
                  onChange={(e) =>
                    setLeadStatusForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setLeadStatusModalOpen(false)}
                disabled={savingLeadStatus}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleSaveLeadStatus}
                disabled={savingLeadStatus || !leadStatusForm.status}
              >
                {savingLeadStatus ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document title modal */}
      {docModalOpen && pendingFile && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Add Document</div>
            <div className="modal-body">
              <div className="field-full">
                <label>Document Title</label>
                <input
                  className="input-plain"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>
              <div className="field-full" style={{ marginTop: 8 }}>
                <small>File: {pendingFile.name}</small>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCancelUploadDoc}
                disabled={uploadingDoc}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleConfirmUploadDoc}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activityStatusModal.open && activityStatusModal.update && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Change Activity Status</div>
            <div className="modal-body">
              <div className="field-full">
                <label>Activity</label>
                <div className="modal-activity-title">
                  {toTitleCase(activityStatusModal.update.title || "(No title)")}
                </div>
              </div>

              <div className="field-full">
                <label>Status</label>
                <select
                  value={activityStatusModal.status || ""}
                  onChange={(e) =>
                    setActivityStatusModal((prev) => ({
                      ...prev,
                      status: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                >
                  <option value="">Select status</option>
                  {updateStatusOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {toTitleCase(s.label || s.code || "")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Comment</label>
                <textarea
                  className="input-plain tall"
                  placeholder="Add a note for this activity status change"
                  value={activityStatusModal.comment}
                  onChange={(e) =>
                    setActivityStatusModal((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCloseActivityStatusModal}
                disabled={savingActivityStatus}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleSaveActivityStatus}
                disabled={savingActivityStatus || !activityStatusModal.status}
              >
                {savingActivityStatus ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stageHistoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal stage-history-modal">
            <div className="modal-title">Stage History</div>

            <div className="modal-body stage-history-modal-body">
              {sortedStageHistory.length === 0 ? (
                <div className="empty-state small">No stage changes yet.</div>
              ) : (
                <ul className="stage-history-list">
                  {sortedStageHistory.map((h) => {
                    const st = stages.find((s) => s.id === h.stage);
                    const label =
                      (st &&
                        (st.order ? `${st.order}. ${st.name}` : st.name)) ||
                      h.stage_name ||
                      `Stage #${h.stage}`;

                    const eventTime = h.event_date || null;
                    const createdTime = h.created_at || null;
                    const author =
                      h.created_by_name || h.changed_by_name || "Staff";

                    return (
                      <li key={h.id} className="stage-history-item">
                        {/* top row: stage + chips + dates */}
                        <div className="stage-history-header-row">
                          <div className="stage-history-left">
                            <div className="stage-history-stage">{toTitleCase(label)}</div>

                            <div className="stage-history-chips">
                              {h.status_name && (
                                <span className="stage-history-chip stage-status-chip">
                                  {toTitleCase(
                                    h.status_name.replace(/_/g, " ")
                                  )}
                                </span>
                              )}

                              {h.sub_status_name && (
                                <span className="stage-history-chip stage-substatus-chip">
                                  {toTitleCase(
                                    h.sub_status_name.replace(/_/g, " ")
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="stage-history-dates">
                            {eventTime && (
                              <div className="stage-history-date">
                                Event:&nbsp;
                                {new Date(eventTime).toLocaleString("en-GB")}
                              </div>
                            )}
                            {createdTime && (
                              <div className="stage-history-date">
                                Created:&nbsp;
                                {new Date(createdTime).toLocaleString("en-GB")}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* meta row */}
                        <div className="stage-history-meta">
                          <span className="stage-history-author">{toTitleCase(author)}</span>
                          {h.id && <span> • ID: {h.id}</span>}
                        </div>

                        {/* notes */}
                        {h.notes && (
                          <div className="stage-history-notes">{toTitleCase(h.notes)}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStageHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {interestedModalOpen && (
        <div className="modal-backdrop">
          <div className="modal interested-modal">
            <div className="modal-title">Select Interested Unit</div>

            <div className="modal-body interested-modal-body">
              {/* 🔎 Search row */}
              <div className="interested-search-row">
                <input
                  type="text"
                  className="input-plain interested-search-input"
                  placeholder="Search by unit / tower / floor…"
                  value={interestedSearch}
                  onChange={(e) => setInterestedSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary small"
                  disabled={inventoryLoading}
                >
                  Search
                </button>
              </div>

              {/* 🎛 Availability filter */}
              <div className="interested-filter-row">
                <label>Availability</label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="ALL">All Units</option>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="BOOKED">Booked / Blocked</option>
                </select>
              </div>

              {/* 🌳 Tree + ℹ️ Detail layout */}
              {inventoryLoading ? (
                <div className="empty-state small">Loading inventory…</div>
              ) : inventoryTree.length === 0 ? (
                <div className="empty-state small">
                  No inventory found for this project.
                </div>
              ) : (
                <div className="inventory-modal-layout">
                  {/* LEFT: tower / floor / units */}
                  <div className="inventory-tree">
                    {inventoryTree.map((tower) => (
                      <div key={tower.id} className="inventory-tower">
                        <div className="inventory-tower-title">
                          {toTitleCase(
                            tower.name ||
                            tower.tower_name ||
                            `Tower #${tower.id}`
                          )}
                        </div>

                        {(tower.floors || tower.children || []).map((floor) => (
                          <div key={floor.id} className="inventory-floor">
                            <div className="inventory-floor-title">
                              {toTitleCase(
                                floor.name ||
                                floor.floor_name ||
                                (floor.number
                                  ? `Floor ${floor.number}`
                                  : `Floor #${floor.id}`)
                              )}
                            </div>

                            <div className="inventory-units-row">
                              {(floor.units || floor.children || []).map(
                                (unit) => {
                                  const inv = unit.inventory;
                                  const status =
                                    inv?.availability_status ||
                                    inv?.unit_status ||
                                    "UNKNOWN";
                                  const isAvailable = status === "AVAILABLE";

                                  // 🎛 Filter apply karo
                                  if (
                                    availabilityFilter === "AVAILABLE" &&
                                    !isAvailable
                                  ) {
                                    return null;
                                  }
                                  if (
                                    availabilityFilter === "BOOKED" &&
                                    isAvailable
                                  ) {
                                    return null;
                                  }

                                  const label = toTitleCase(
                                    unit.label ||
                                    unit.unit_no ||
                                    unit.inventory_name ||
                                    `Unit #${unit.id}`
                                  );

                                  // 🔍 local search (text + tower + floor)
                                  const combined = (
                                    `${label} ` +
                                    `${tower.name || tower.tower_name || ""} ` +
                                    `${
                                      floor.name ||
                                      floor.floor_name ||
                                      floor.number ||
                                      ""
                                    }`
                                  )
                                    .toLowerCase()
                                    .trim();

                                  if (
                                    interestedSearch &&
                                    !combined.includes(
                                      interestedSearch.toLowerCase().trim()
                                    )
                                  ) {
                                    return null;
                                  }

                                  const active = selectedUnitId === unit.id;

                                  const pillClasses =
                                    "inventory-unit-pill" +
                                    (active
                                      ? " inventory-unit-pill-active"
                                      : "") +
                                    (!isAvailable
                                      ? " inventory-unit-pill-unavailable"
                                      : "");

                                  return (
                                    <button
                                      key={unit.id}
                                      type="button"
                                      className={pillClasses}
                                      onClick={() => handleSelectUnit(unit)}
                                    >
                                      <span className="inventory-unit-pill-main">
                                        {label}
                                      </span>
                                      {!isAvailable && (
                                        <span className="inventory-unit-pill-tag">
                                          {toTitleCase(status === "BOOKED"
                                            ? "Booked"
                                            : status || "")}
                                        </span>
                                      )}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* RIGHT: selected unit detail */}
                  <div className="inventory-detail">
                    {selectedUnitInfoLoading ? (
                      <div className="empty-state small">
                        Loading unit details…
                      </div>
                    ) : !selectedUnitId ? (
                      <div className="empty-state small">
                        Select a unit from the left to see details.
                      </div>
                    ) : selectedUnitInfo ? (
                      <div className="unit-detail-card">
                        <div className="unit-detail-title">
                          {toTitleCase(
                            selectedUnitInfo.unit_label ||
                            selectedUnitInfo.unit_no ||
                            `Unit #${selectedUnitId}`
                          )}
                        </div>

                        <div className="unit-detail-row">
                          <span>Project</span>
                          <strong>
                            {toTitleCase(
                              selectedUnitInfo.project_name ||
                              selectedUnitInfo.project?.name ||
                              "-"
                            )}
                          </strong>
                        </div>

                        <div className="unit-detail-row">
                          <span>Tower</span>
                          <strong>
                            {toTitleCase(
                              selectedUnitInfo.tower_name ||
                              selectedUnitInfo.tower?.name ||
                              "-"
                            )}
                          </strong>
                        </div>

                        <div className="unit-detail-row">
                          <span>Floor</span>
                          <strong>
                            {toTitleCase(
                              selectedUnitInfo.floor_name ||
                              selectedUnitInfo.floor?.number ||
                              "-"
                            )}
                          </strong>
                        </div>

                        <div className="unit-detail-row">
                          <span>Agreement Value</span>
                          <strong>
                            {selectedUnitInfo.agreement_value != null
                              ? formatINR(selectedUnitInfo.agreement_value)
                              : "-"}
                          </strong>
                        </div>

                        <div className="unit-detail-row">
                          <span>Total Cost</span>
                          <strong>
                            {selectedUnitInfo.total_cost != null
                              ? formatINR(selectedUnitInfo.total_cost)
                              : "-"}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state small">
                        No details found for this unit.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedUnitId && !isSelectedAvailable && (
                <div className="inventory-note">
                  This unit is <strong>not available</strong>. Please select an{" "}
                  <strong>AVAILABLE</strong> unit to assign.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary small"
                onClick={() => setInterestedModalOpen(false)}
                disabled={interestedSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary small"
                onClick={handleSaveInterested}
                disabled={
                  !selectedUnitId || !isSelectedAvailable || interestedSaving
                }
              >
                {interestedSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {paymentModalOpen && (
        <PaymentLeadCreateModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          // leadId ka source: agar useParams se aa raha hai to directly use karo
          // const { leadId } = useParams();
          leadId={parseInt(leadId, 10)}
          defaultPaymentType="EOI"
          onCreated={() => {
            // yahan agar tum payments list dikhate ho to refresh call kar sakte ho
            // example:
            // fetchPayments();
          }}
        />
      )}
    </div>
  );
};

export default LeadStaticPage;
