import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  Plus,
  X,
  Filter,
  Pin,
  PinOff,
  Search,
  Download,
  Users,
  Building2,
  User,
  ChevronDown,
  Check,
  Power,
  PowerOff,
  Paperclip,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";

import "../../PostSales/Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";
import "../../PostSales/Financial/PaymentReceipts.css";
import "./Template.css";

const toTitleCase = (value) => {
  if (value === null || value === undefined) return value;
  const s = String(value).trim();
  if (!s) return s;
  return s
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const FormGrid = ({ columns = 2, children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: 16,
    }}
  >
    {children}
  </div>
);

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  options = [],
  placeholder,
  className = "",
  rows = 4,
  required,
  min,
}) => {
  return (
    <div className={className}>
      <label className="block text-sm text-muted-foreground mb-1.5">
        {toTitleCase(label)} {required ? "*" : ""}
      </label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {toTitleCase(opt.label)}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
        />
      )}
    </div>
  );
};

const MultiSelect = ({
  label,
  options = [],
  selectedValues = [],
  onApply,
  disabled = false,
  placeholder = "Select...",
  getOptionLabel = (opt) => opt.name || opt.label || String(opt),
  getOptionValue = (opt) => opt.id ?? opt.value,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tempSelected, setTempSelected] = React.useState(selectedValues);

  React.useEffect(() => {
    setTempSelected(selectedValues);
  }, [selectedValues]);

  React.useEffect(() => {
    if (!isOpen) document.body.style.overflow = "unset";
    else document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleToggle = (value) => {
    if (tempSelected.includes(value)) {
      setTempSelected(tempSelected.filter((v) => v !== value));
    } else {
      setTempSelected([...tempSelected, value]);
    }
  };

  const handleSelectAll = () => {
    const filtered = filteredOptionsList;
    if (filtered.every((opt) => tempSelected.includes(getOptionValue(opt)))) {
      setTempSelected(tempSelected.filter((v) => !filtered.some((opt) => getOptionValue(opt) === v)));
    } else {
      setTempSelected([...new Set([...tempSelected, ...filtered.map((opt) => getOptionValue(opt))])]);
    }
  };

  const handleApply = () => {
    if (onApply) onApply(tempSelected);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCancel = () => {
    setTempSelected(selectedValues);
    setIsOpen(false);
    setSearchQuery("");
  };

  const filteredOptionsList = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => getOptionLabel(opt).toLowerCase().includes(q));
  }, [options, searchQuery, getOptionLabel]);

  const selectedCount = selectedValues.length;
  const displayText = selectedCount === 0 ? placeholder : `${selectedCount} selected`;
  const filteredSelectedCount = filteredOptionsList.filter((opt) =>
    tempSelected.includes(getOptionValue(opt))
  ).length;

  return (
    <>
      <div className="relative">
        <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm hover:border-primary transition-colors flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={selectedCount === 0 ? "text-muted-foreground" : ""}>{displayText}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isOpen && !disabled && (
        <div className="dn-modal-overlay" onMouseDown={handleCancel} style={{ alignItems: "flex-start", paddingTop: "100px" }}>
          <div className="dn-modal dn-modal-sm" onMouseDown={(e) => e.stopPropagation()}>
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">{label}</div>
              </div>
              <button type="button" className="dn-close-btn" onClick={handleCancel} title="Close">×</button>
            </div>
            <div className="dn-modal-body" style={{ padding: "18px", paddingBottom: "12px" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dn-input"
                  style={{ paddingLeft: "36px" }}
                  autoFocus
                />
              </div>
            </div>
            {filteredOptionsList.length > 0 && (
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded flex items-center gap-2"
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "14px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px" }}
                >
                  <div className={`w-4 h-4 border border-border rounded flex items-center justify-center ${filteredSelectedCount === filteredOptionsList.length ? "bg-primary border-primary" : ""}`}>
                    {filteredSelectedCount === filteredOptionsList.length && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">
                    {filteredSelectedCount === filteredOptionsList.length ? "Deselect All" : "Select All"}
                  </span>
                </button>
              </div>
            )}
            <div className="dn-modal-body" style={{ padding: "18px", maxHeight: "400px", overflowY: "auto" }}>
              {filteredOptionsList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground" style={{ fontSize: "14px", color: "#6b7280" }}>No options found</div>
              ) : (
                filteredOptionsList.map((option) => {
                  const value = getOptionValue(option);
                  const isSelected = tempSelected.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleToggle(value)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent rounded flex items-center gap-3 transition-colors"
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", fontSize: "14px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "12px" }}
                    >
                      <div className={`w-4 h-4 border border-border rounded flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary border-primary" : ""}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1">{getOptionLabel(option)}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="dn-modal-footer">
              <button type="button" className="dn-btn" onClick={handleCancel}>Cancel</button>
              <button type="button" className="dn-btn dn-btn-primary" onClick={handleApply}>Apply ({tempSelected.length})</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const defaultForm = {
  project: "",
  template: "",
  template_context: {},
  title: "",
  body: "",
  publish_at: "",
  expires_at: "",
  is_pinned: false,
  is_active: true,
  audience_targets: [],
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return null;
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function CommsBroadcastPage() {
  const location = useLocation();

  // list state
  const [broadcasts, setBroadcasts] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterActive, setFilterActive] = useState("true"); // default is_active=true
  const [filterPinned, setFilterPinned] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");

  // reference data
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);

  // detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState(defaultForm);
  const [templateContextJson, setTemplateContextJson] = useState("{}");
  const [attachments, setAttachments] = useState([]);
  const [attachmentNames, setAttachmentNames] = useState([]);
  const [replaceAttachments, setReplaceAttachments] = useState(false);
  // audience (like CommsEventsPage)
  const [groups, setGroups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [tempSelectedGroups, setTempSelectedGroups] = useState([]);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [tempSelectedTowers, setTempSelectedTowers] = useState([]);
  const [tempSelectedUnits, setTempSelectedUnits] = useState([]);

  // ---------- helpers ----------
  const buildListParams = () => {
    const params = {};
    if (filterProject) params.project_id = filterProject;
    if (filterStatus) params.status = filterStatus;
    if (filterActive !== "")
      params.is_active = filterActive; // "true"/"false" string as required
    if (filterPinned !== "") params.pinned = filterPinned;
    if (filterTemplate) params.template_id = filterTemplate;
    if (search.trim()) params.search = search.trim();
    return params;
  };

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("client/my-scope/");
      if (response.data?.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get("community/message-templates/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchGroupsForProject = async (projectId) => {
    if (!projectId) {
      setGroups([]);
      return;
    }
    setLoadingGroups(true);
    try {
      const response = await axiosInstance.get("community/groups/", {
        params: { project_id: projectId },
      });
      const data = response.data?.results ?? response.data ?? [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchCustomersForProject = async (projectId) => {
    if (!projectId) {
      setCustomers([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const response = await axiosInstance.get(
        "financial/demand-notes/project-customers/",
        { params: { project_id: projectId, only_names_unit: 1, page_size: 100 } }
      );
      const data = response.data?.results ?? response.data ?? [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchBroadcasts = async (url) => {
    setLoading(true);
    try {
      let response;
      if (url) {
        // next/previous absolute URL
        response = await axiosInstance.get(url);
      } else {
        response = await axiosInstance.get("community/broadcasts/", {
          params: buildListParams(),
        });
      }
      const data = response.data || {};
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : [];
      setBroadcasts(results);
      setCount(data.count ?? results.length ?? 0);
      setNextUrl(data.next ?? null);
      setPrevUrl(data.previous ?? null);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      toast.error("Failed to load broadcasts");
      setBroadcasts([]);
      setCount(0);
      setNextUrl(null);
      setPrevUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterProject("");
    setFilterStatus("");
    setFilterActive("true");
    setFilterPinned("");
    setFilterTemplate("");
    setSearch("");
    fetchBroadcasts();
  };

  const handleFilterApply = () => {
    fetchBroadcasts();
    setOpenFilter(false);
  };

  // ---------- detail ----------
  const openDetail = async (item) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await axiosInstance.get(
        `community/broadcasts/${item.id}/`,
      );
      setDetailItem(response.data);
    } catch (error) {
      console.error("Error loading broadcast detail:", error);
      toast.error("Failed to load broadcast detail");
      setDetailItem(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  // ---------- quick actions (optimistic) ----------
  const updateRowLocally = (id, patch) => {
    setBroadcasts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const handleTogglePin = async (item) => {
    const original = item.is_pinned;
    const newVal = !original;
    updateRowLocally(item.id, { is_pinned: newVal });
    try {
      await axiosInstance.patch(`community/broadcasts/${item.id}/`, {
        is_pinned: newVal,
      });
      toast.success(newVal ? "Pinned" : "Unpinned");
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      toast.error("Failed to update pin");
      // rollback
      updateRowLocally(item.id, { is_pinned: original });
      fetchBroadcasts();
    }
  };

  const handleToggleActive = async (item) => {
    const original = !!item.is_active;
    const newVal = !original;
    updateRowLocally(item.id, { is_active: newVal });
    try {
      await axiosInstance.patch(`community/broadcasts/${item.id}/`, {
        is_active: newVal,
      });
      toast.success(newVal ? "Activated" : "Deactivated");
    } catch (error) {
      console.error("Failed to toggle active:", error);
      toast.error("Failed to update status");
      updateRowLocally(item.id, { is_active: original });
      fetchBroadcasts();
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Delete broadcast "${item.title || ""}"? This action cannot be undone.`,
    );
    if (!ok) return;
    try {
      await axiosInstance.delete(`community/broadcasts/${item.id}/`);
      toast.success("Broadcast deleted");
      fetchBroadcasts();
    } catch (error) {
      console.error("Failed to delete broadcast:", error);
      toast.error("Failed to delete broadcast");
    }
  };

  // ---------- form helpers ----------
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "template") {
      setBroadcastForm((prev) => ({
        ...prev,
        template: value,
      }));
      return;
    }
    if (name === "publish_at") {
      setBroadcastForm((prev) => ({
        ...prev,
        publish_at: value,
        expires_at:
          prev.expires_at && prev.expires_at < value
            ? value
            : prev.expires_at,
      }));
      return;
    }
    setBroadcastForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      setAttachmentNames((prev) => [...prev, ...files.map((f) => f.name)]);
    }
    e.target.value = "";
  };

  const handleAttachmentNameChange = (index, name) => {
    setAttachmentNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  };

  const handleRemoveFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentNames((prev) => prev.filter((_, i) => i !== index));
  };

  const addAudienceTarget = (targetKind, targetId = null, exclude = false) => {
    if (targetKind === "GROUP" && !targetId) {
      toast.error("Please select a group");
      return;
    }
    if (targetKind === "USER" && !targetId) {
      toast.error("Please select a user");
      return;
    }
    if (targetKind === "TOWER" && !targetId) {
      toast.error("Please select a tower");
      return;
    }
    if (targetKind === "UNIT" && !targetId) {
      toast.error("Please select a unit");
      return;
    }
    const isDuplicate = (broadcastForm.audience_targets || []).some((target) => {
      if (target.target_kind !== targetKind) return false;
      if (targetKind === "ALL" || targetKind === "PROJECT") return true;
      if (targetKind === "GROUP" && target.group === targetId) return true;
      if (targetKind === "USER" && target.user === targetId) return true;
      if (targetKind === "TOWER" && target.tower === targetId) return true;
      if (targetKind === "UNIT" && target.unit === targetId) return true;
      return false;
    });
    if (isDuplicate) {
      toast.error("This target is already selected");
      return;
    }
    const newTarget = { target_kind: targetKind };
    if (targetKind === "GROUP" && targetId) newTarget.group = targetId;
    else if (targetKind === "USER" && targetId) newTarget.user = targetId;
    else if (targetKind === "TOWER" && targetId) newTarget.tower = targetId;
    else if (targetKind === "UNIT" && targetId) {
      newTarget.unit = targetId;
      if (exclude) newTarget.exclude = true;
    }
    setBroadcastForm((prev) => ({
      ...prev,
      audience_targets: [...(prev.audience_targets || []), newTarget],
    }));
  };

  const addMultipleAudienceTargets = (targetKind, targetIds, exclude = false) => {
    const newTargets = [];
    (targetIds || []).forEach((targetId) => {
      const isDuplicate = (broadcastForm.audience_targets || []).some((target) => {
        if (target.target_kind !== targetKind) return false;
        if (targetKind === "GROUP" && target.group === targetId) return true;
        if (targetKind === "USER" && target.user === targetId) return true;
        if (targetKind === "TOWER" && target.tower === targetId) return true;
        if (targetKind === "UNIT" && target.unit === targetId) return true;
        return false;
      });
      if (!isDuplicate) {
        const newTarget = { target_kind: targetKind };
        if (targetKind === "GROUP" && targetId) newTarget.group = targetId;
        else if (targetKind === "USER" && targetId) newTarget.user = targetId;
        else if (targetKind === "TOWER" && targetId) newTarget.tower = targetId;
        else if (targetKind === "UNIT" && targetId) {
          newTarget.unit = targetId;
          if (exclude) newTarget.exclude = true;
        }
        newTargets.push(newTarget);
      }
    });
    if (newTargets.length > 0) {
      setBroadcastForm((prev) => ({
        ...prev,
        audience_targets: [...(prev.audience_targets || []), ...newTargets],
      }));
    }
  };

  const removeAudienceTarget = (index) => {
    setBroadcastForm((prev) => ({
      ...prev,
      audience_targets: (prev.audience_targets || []).filter((_, i) => i !== index),
    }));
  };

  const parseTemplateContext = () => {
    const raw = templateContextJson.trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
      throw new Error("template_context must be an object");
    } catch (err) {
      toast.error(
        err?.message || "Invalid template_context JSON. Please fix and retry.",
      );
      throw err;
    }
  };

  const buildPayload = () => {
    if (!broadcastForm.project) {
      throw new Error("Project is required");
    }
    if (!broadcastForm.title.trim()) {
      throw new Error("Title is required");
    }
    if (!broadcastForm.body.trim() && !broadcastForm.template) {
      throw new Error("Body or Template is required");
    }

    const audience_targets = (broadcastForm.audience_targets || []).filter((t) => {
      if (t.target_kind === "GROUP" && !t.group) return false;
      if (t.target_kind === "USER" && !t.user) return false;
      if (t.target_kind === "TOWER" && !t.tower) return false;
      if (t.target_kind === "UNIT" && !t.unit) return false;
      return true;
    });
    if (!audience_targets.length) {
      throw new Error("At least one audience target is required");
    }

    const template_context = parseTemplateContext();

    const payload = {
      project: Number(broadcastForm.project),
      title: broadcastForm.title.trim(),
      body: broadcastForm.body.trim(),
      is_pinned: !!broadcastForm.is_pinned,
      is_active: !!broadcastForm.is_active,
      publish_at: broadcastForm.publish_at
        ? formatDateTime(broadcastForm.publish_at)
        : null,
      expires_at: broadcastForm.expires_at
        ? formatDateTime(broadcastForm.expires_at)
        : null,
      audience_targets,
    };

    if (broadcastForm.template) {
      payload.template = Number(broadcastForm.template);
      payload.template_context = template_context;
    }

    return payload;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const isEdit = !!editing;
      const hasFiles = attachments.length > 0;

      if (hasFiles) {
        const fd = new FormData();
        fd.append("project", payload.project);
        fd.append("title", payload.title);
        fd.append("body", payload.body);
        if (payload.publish_at) fd.append("publish_at", payload.publish_at);
        if (payload.expires_at) fd.append("expires_at", payload.expires_at);
        fd.append("is_pinned", payload.is_pinned);
        fd.append("is_active", payload.is_active);
        if (payload.template) {
          fd.append("template", payload.template);
          fd.append("template_context", JSON.stringify(payload.template_context));
        }
        fd.append("audience_targets", JSON.stringify(payload.audience_targets));
        attachments.forEach((file) => {
          fd.append("attachments", file);
        });
        attachmentNames.forEach((name) => {
          fd.append("attachment_names", name || "");
        });

        if (isEdit) {
          await axiosInstance.patch(
            `community/broadcasts/${editing.id}/`,
            fd,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        } else {
          await axiosInstance.post("community/broadcasts/", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        if (isEdit) {
          await axiosInstance.put(
            `community/broadcasts/${editing.id}/`,
            payload,
          );
        } else {
          await axiosInstance.post("community/broadcasts/", payload);
        }
      }

      toast.success(isEdit ? "Broadcast updated" : "Broadcast created");
      setShowForm(false);
      setEditing(null);
      setBroadcastForm(defaultForm);
      setTemplateContextJson("{}");
      setAttachments([]);
      setAttachmentNames([]);
      setReplaceAttachments(false);
      setTempSelectedGroups([]);
      setTempSelectedUsers([]);
      setTempSelectedTowers([]);
      setTempSelectedUnits([]);
      fetchBroadcasts();
    } catch (error) {
      console.error("Failed to save broadcast:", error);
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to save broadcast";
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setBroadcastForm(defaultForm);
    setTemplateContextJson("{}");
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
    setShowForm(true);
  };

  const startEdit = async (item) => {
    setEditing(item);
    setShowForm(true);
    setSubmitting(false);
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    try {
      const response = await axiosInstance.get(
        `community/broadcasts/${item.id}/`,
      );
      const data = response.data;
      setBroadcastForm({
        project: data.project_id || data.project || "",
        template: data.template_id || data.template || "",
        template_context: data.template_context || {},
        title: data.title || "",
        body: data.body || "",
        publish_at: data.publish_at
          ? data.publish_at.slice(0, 16)
          : "",
        expires_at: data.expires_at
          ? data.expires_at.slice(0, 16)
          : "",
        is_pinned: !!data.is_pinned,
        is_active: !!data.is_active,
        audience_targets: data.audience_targets || [],
      });
      setTemplateContextJson(
        JSON.stringify(data.template_context || {}, null, 2),
      );
    } catch (error) {
      console.error("Failed to load broadcast for edit:", error);
      toast.error("Failed to load broadcast for editing");
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setBroadcastForm(defaultForm);
    setTemplateContextJson("{}");
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
  };

  // When project changes in form, load groups + customers and project data
  useEffect(() => {
    if (broadcastForm.project && showForm) {
      fetchGroupsForProject(Number(broadcastForm.project));
      fetchCustomersForProject(Number(broadcastForm.project));
      const projectData = projects.find((p) => p.id === Number(broadcastForm.project));
      setSelectedProjectData(projectData ?? null);
    } else {
      setGroups([]);
      setCustomers([]);
      setSelectedProjectData(null);
    }
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastForm.project, showForm, projects]);

  // ---------- effects ----------
  useEffect(() => {
    fetchProjects();
    fetchTemplates();
    // default initial load with is_active=true
    fetchBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reset form when route changes
    setShowForm(false);
    setEditing(null);
    setBroadcastForm(defaultForm);
    setTemplateContextJson("{}");
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
  }, [location.pathname]);

  const filteredBroadcasts = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return broadcasts;
    return broadcasts.filter((b) => {
      const blob = [
        b.title,
        b.body,
        b.template_name,
        b.project_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [broadcasts, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search broadcasts..."
                wrapperClassName="search-box"
              />
            </div>
            <div className="list-header-right dn-header-actions">
              <button
                type="button"
                className="filter-btn demand-filter-btn"
                onClick={() => setOpenFilter(true)}
                title="Filters"
              >
                <Filter className="w-4 h-4" style={{ marginRight: 6 }} />
                Filters
              </button>
              <button
                type="button"
                className="filter-btn demand-filter-btn"
                onClick={resetFilters}
                title="Reset filters"
              >
                Reset
              </button>
              <button
                type="button"
                className="filter-btn"
                onClick={startCreate}
                title="Add Broadcast"
              >
                <Plus className="w-4 h-4" style={{ marginRight: 6 }} />
                Add Broadcast
              </button>
            </div>
          </div>

          {/* Filter Modal */}
          {openFilter && (
            <div
              className="dn-modal-overlay"
              onMouseDown={() => setOpenFilter(false)}
            >
              <div
                className="dn-modal dn-modal-wide"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="dn-modal-header">
                  <div className="dn-modal-header-left dn-modal-header-left-center">
                    <div className="dn-modal-title">Filters</div>
                  </div>
                  <button
                    className="dn-close-btn"
                    onClick={() => setOpenFilter(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="dn-modal-body">
                  <FormGrid columns={3}>
                    <FormInput
                      label="Project"
                      name="filterProject"
                      type="select"
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      options={projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                    />
                    <FormInput
                      label="Status"
                      name="filterStatus"
                      type="select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        { value: "live", label: "Live" },
                        { value: "scheduled", label: "Scheduled" },
                        { value: "expired", label: "Expired" },
                      ]}
                    />
                    <FormInput
                      label="Active"
                      name="filterActive"
                      type="select"
                      value={filterActive}
                      onChange={(e) => setFilterActive(e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        { value: "true", label: "Active" },
                        { value: "false", label: "Inactive" },
                      ]}
                    />
                    <FormInput
                      label="Pinned"
                      name="filterPinned"
                      type="select"
                      value={filterPinned}
                      onChange={(e) => setFilterPinned(e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        { value: "true", label: "Pinned" },
                        { value: "false", label: "Not Pinned" },
                      ]}
                    />
                    <FormInput
                      label="Template"
                      name="filterTemplate"
                      type="select"
                      value={filterTemplate}
                      onChange={(e) => setFilterTemplate(e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        ...templates.map((t) => ({
                          value: t.id,
                          label: t.name,
                        })),
                      ]}
                    />
                  </FormGrid>
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                  <button
                    className="dn-btn dn-btn-primary"
                    onClick={handleFilterApply}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="booking-list-body">
              <div className="booking-list-message">Loading broadcasts...</div>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="booking-list-body">
              <div className="booking-list-message">No broadcasts found.</div>
            </div>
          ) : (
            <div className="booking-list-body">
              <div className="booking-table-wrapper">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Actions</th>
                      <th>Title</th>
                      <th>Template</th>
                      <th>Publish At</th>
                      <th>Expires At</th>
                      <th>Pinned</th>
                      <th>Active</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBroadcasts.map((b) => (
                      <tr key={b.id} className="dn-row">
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openDetail(b)}
                              className="dn-btn dn-btn-light"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                minWidth: "auto",
                              }}
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(b)}
                              className="dn-btn dn-btn-light"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                minWidth: "auto",
                              }}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePin(b)}
                              className="dn-btn dn-btn-light"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                minWidth: "auto",
                              }}
                              title={b.is_pinned ? "Unpin" : "Pin"}
                            >
                              {b.is_pinned ? (
                                <PinOff className="w-3.5 h-3.5" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(b)}
                              className="dn-btn dn-btn-light"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                minWidth: "auto",
                                color: b.is_active ? "#16a34a" : "#9ca3af",
                              }}
                              title={b.is_active ? "Deactivate" : "Activate"}
                            >
                              {b.is_active ? (
                                <Power className="w-3.5 h-3.5" />
                              ) : (
                                <PowerOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(b)}
                              className="dn-btn dn-btn-light"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                minWidth: "auto",
                                color: "#b91c1c",
                              }}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="dn-wrap">{b.title || "-"}</td>
                        <td>{b.template_name || "-"}</td>
                        <td>
                          {b.publish_at
                            ? new Date(b.publish_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                        <td>
                          {b.expires_at
                            ? new Date(b.expires_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                        <td>{b.is_pinned ? "Yes" : "No"}</td>
                        <td>{b.is_active ? "Yes" : "No"}</td>
                        <td>
                          {b.created_at
                            ? new Date(b.created_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pr-pagination">
                <button
                  className="dn-btn dn-btn-light"
                  disabled={!prevUrl || loading}
                  onClick={() => fetchBroadcasts(prevUrl)}
                >
                  Prev
                </button>
                <div style={{ padding: "0 8px", fontSize: 12 }}>
                  Total: {count}
                </div>
                <button
                  className="dn-btn dn-btn-light"
                  disabled={!nextUrl || loading}
                  onClick={() => fetchBroadcasts(nextUrl)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {detailOpen && (
            <div
              className="dn-modal-overlay"
              onMouseDown={closeDetail}
            >
              <div
                className="dn-modal dn-modal-wide"
                onMouseDown={(e) => e.stopPropagation()}
                style={{ maxWidth: "900px" }}
              >
                <div className="dn-modal-header">
                  <div className="dn-modal-header-left dn-modal-header-left-center">
                    <div className="dn-modal-title">Broadcast Details</div>
                  </div>
                  <button className="dn-close-btn" onClick={closeDetail}>
                    ×
                  </button>
                </div>

                <div
                  className="dn-modal-body"
                  style={{ maxHeight: "70vh", overflowY: "auto" }}
                >
                  {detailLoading || !detailItem ? (
                    <div>Loading...</div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7280",
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Title
                        </label>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {detailItem.title || "-"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 12,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6b7280",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Status
                          </label>
                          <div
                            style={{
                              fontSize: 14,
                              color: detailItem.is_active
                                ? "#16a34a"
                                : "#dc2626",
                              fontWeight: 500,
                            }}
                          >
                            {detailItem.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6b7280",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Pinned
                          </label>
                          <div style={{ fontSize: 14, color: "#111827" }}>
                            {detailItem.is_pinned ? "Yes" : "No"}
                          </div>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6b7280",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Template
                          </label>
                          <div style={{ fontSize: 14, color: "#111827" }}>
                            {detailItem.template_name || "-"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7280",
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Body
                        </label>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#374151",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {detailItem.body || "-"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 12,
                        }}
                      >
                        {detailItem.publish_at && (
                          <div>
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6b7280",
                                marginBottom: 4,
                                display: "block",
                              }}
                            >
                              Publish At
                            </label>
                            <div
                              style={{ fontSize: 14, color: "#111827" }}
                            >
                              {new Date(
                                detailItem.publish_at,
                              ).toLocaleString("en-IN")}
                            </div>
                          </div>
                        )}
                        {detailItem.expires_at && (
                          <div>
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6b7280",
                                marginBottom: 4,
                                display: "block",
                              }}
                            >
                              Expires At
                            </label>
                            <div
                              style={{ fontSize: 14, color: "#111827" }}
                            >
                              {new Date(
                                detailItem.expires_at,
                              ).toLocaleString("en-IN")}
                            </div>
                          </div>
                        )}
                        <div>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6b7280",
                              marginBottom: 4,
                              display: "block",
                            }}
                          >
                            Created At
                          </label>
                          <div
                            style={{ fontSize: 14, color: "#111827" }}
                          >
                            {detailItem.created_at
                              ? new Date(
                                  detailItem.created_at,
                                ).toLocaleString("en-IN")
                              : "-"}
                          </div>
                        </div>
                      </div>

                      {/* Audience Targets */}
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7280",
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Audience Targets (raw)
                        </label>
                        <pre
                          style={{
                            background: "#f9fafb",
                            padding: 12,
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                            fontSize: 12,
                            overflowX: "auto",
                          }}
                        >
                          {JSON.stringify(
                            detailItem.audience_targets || [],
                            null,
                            2,
                          )}
                        </pre>
                      </div>

                      {/* Attachments */}
                      {detailItem.attachments &&
                        detailItem.attachments.length > 0 && (
                          <div>
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6b7280",
                                marginBottom: 8,
                                display: "block",
                              }}
                            >
                              Attachments ({detailItem.attachments.length})
                            </label>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                border: "1px solid #e5e7eb",
                                borderRadius: 6,
                                padding: 12,
                                background: "#f9fafb",
                              }}
                            >
                              {detailItem.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 12px",
                                    background: "#fff",
                                    borderRadius: 4,
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 14,
                                      color: "#111827",
                                    }}
                                  >
                                    {att.name || `Attachment ${idx + 1}`}
                                  </div>
                                  {att.file_url && (
                                    <a
                                      href={
                                        att.file_url.startsWith("http")
                                          ? att.file_url
                                          : `https://api.presale.myciti.life${att.file_url}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "4px 8px",
                                        background: "#19376d",
                                        color: "#fff",
                                        borderRadius: 4,
                                        fontSize: 12,
                                        textDecoration: "none",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Download
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-primary"
                    onClick={closeDetail}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {editing ? "Edit Broadcast" : "Create Broadcast"}
                </h3>
              </div>

              <FormGrid columns={2}>
                <FormInput
                  label="Project"
                  name="project"
                  type="select"
                  value={broadcastForm.project}
                  onChange={handleFormChange}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
                <FormInput
                  label="Title"
                  name="title"
                  value={broadcastForm.title}
                  onChange={handleFormChange}
                  placeholder="Enter broadcast title"
                  required
                />
                <FormInput
                  label="Template (optional)"
                  name="template"
                  type="select"
                  value={broadcastForm.template}
                  onChange={handleFormChange}
                  options={[
                    { value: "", label: "No Template" },
                    ...templates.map((t) => ({
                      value: t.id,
                      label: t.name,
                    })),
                  ]}
                />
                <div />
                <FormInput
                  label="Publish At"
                  name="publish_at"
                  type="datetime-local"
                  value={broadcastForm.publish_at}
                  onChange={handleFormChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <FormInput
                  label="Expires At"
                  name="expires_at"
                  type="datetime-local"
                  value={broadcastForm.expires_at}
                  onChange={handleFormChange}
                  min={
                    broadcastForm.publish_at ||
                    new Date().toISOString().slice(0, 16)
                  }
                />
                <FormInput
                  label="Body"
                  name="body"
                  type="textarea"
                  rows={4}
                  value={broadcastForm.body}
                  onChange={handleFormChange}
                  placeholder="Message body (optional if template is used)"
                  className="col-span-2"
                />
                {/* Active / Pinned toggles - same line as Events */}
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-accent/30 border border-border">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Active
                        </label>
                      </div>
                      <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={broadcastForm.is_active}
                          onChange={handleFormChange}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                        <div
                          style={{
                            width: 44,
                            height: 24,
                            backgroundColor: broadcastForm.is_active ? "#3b82f6" : "#e5e7eb",
                            borderRadius: 0,
                            position: "relative",
                            transition: "background-color 0.2s",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 2,
                              left: broadcastForm.is_active ? 22 : 2,
                              width: 20,
                              height: 20,
                              backgroundColor: "#fff",
                              borderRadius: 0,
                              transition: "left 0.2s",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                          />
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent/30 border border-border">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Pinned
                        </label>
                      </div>
                      <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="is_pinned"
                          checked={broadcastForm.is_pinned}
                          onChange={handleFormChange}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                        <div
                          style={{
                            width: 44,
                            height: 24,
                            backgroundColor: broadcastForm.is_pinned ? "#3b82f6" : "#e5e7eb",
                            borderRadius: 0,
                            position: "relative",
                            transition: "background-color 0.2s",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 2,
                              left: broadcastForm.is_pinned ? 22 : 2,
                              width: 20,
                              height: 20,
                              backgroundColor: "#fff",
                              borderRadius: 0,
                              transition: "left 0.2s",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </FormGrid>

              {/* File Attachments Section - same as CommsEventsPage, first then Audience below */}
              <div className="bg-card border border-border rounded-xl p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Paperclip className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Attachments
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Upload Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                  {editing && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="replace_attachments_broadcast"
                        checked={replaceAttachments}
                        onChange={(e) => setReplaceAttachments(e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <label htmlFor="replace_attachments_broadcast" className="text-sm text-muted-foreground cursor-pointer">
                        Replace all existing attachments
                      </label>
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Selected Files ({attachments.length})
                      </label>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-accent/30 border border-border rounded-lg"
                        >
                          <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={attachmentNames[index] || file.name}
                              onChange={(e) => handleAttachmentNameChange(index, e.target.value)}
                              placeholder="Enter file name"
                              className="w-full h-9 rounded border border-border bg-transparent px-2 text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 hover:bg-error/10 rounded text-error"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Audience Targets Section - same structure and CSS as CommsEventsPage */}
              {broadcastForm.project && (
                <div className="bg-card border border-border rounded-xl p-6 mt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">
                      Audience Targets
                    </h3>
                    {(broadcastForm.audience_targets || []).length > 0 && (
                      <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                        {(broadcastForm.audience_targets || []).length} target(s) selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Select Audience Targets
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => addAudienceTarget("ALL")}
                          className={`flex items-center justify-center gap-2 h-11 rounded-lg border transition-colors ${
                            (broadcastForm.audience_targets || []).some((t) => t.target_kind === "ALL")
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-accent/30 border-border hover:bg-accent/50"
                          }`}
                          disabled={(broadcastForm.audience_targets || []).some((t) => t.target_kind === "ALL")}
                        >
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm font-medium">All (Project)</span>
                        </button>

                        <MultiSelect
                          label="Add Group(s)"
                          placeholder="Groups"
                          options={groups.filter((g) => !(broadcastForm.audience_targets || []).some((t) => t.target_kind === "GROUP" && t.group === g.id))}
                          selectedValues={tempSelectedGroups}
                          onApply={(values) => {
                            if (values.length > 0) {
                              addMultipleAudienceTargets("GROUP", values);
                              setTempSelectedGroups([]);
                            }
                          }}
                          disabled={loadingGroups || groups.length === 0}
                          getOptionLabel={(g) => toTitleCase(g.name)}
                          getOptionValue={(g) => g.id}
                        />

                        <MultiSelect
                          label="Add User(s)"
                          placeholder="Users"
                          options={customers.filter((c) => !(broadcastForm.audience_targets || []).some((t) => t.target_kind === "USER" && t.user === (c.customer_id ?? c.id)))}
                          selectedValues={tempSelectedUsers}
                          onApply={(values) => {
                            if (values.length > 0) {
                              addMultipleAudienceTargets("USER", values);
                              setTempSelectedUsers([]);
                            }
                          }}
                          disabled={loadingCustomers || customers.length === 0}
                          getOptionLabel={(c) => `${toTitleCase(c.customer_name || c.name || "User")} - Unit ${c.unit?.label || "-"}`}
                          getOptionValue={(c) => c.customer_id ?? c.id}
                        />

                        <MultiSelect
                          label="Add Tower(s)"
                          placeholder="Towers"
                          options={(selectedProjectData?.towers || []).filter((t) => !(broadcastForm.audience_targets || []).some((target) => target.target_kind === "TOWER" && target.tower === t.id))}
                          selectedValues={tempSelectedTowers}
                          onApply={(values) => {
                            if (values.length > 0) {
                              addMultipleAudienceTargets("TOWER", values);
                              setTempSelectedTowers([]);
                            }
                          }}
                          disabled={!selectedProjectData?.towers?.length}
                          getOptionLabel={(t) => toTitleCase(t.name)}
                          getOptionValue={(t) => t.id}
                        />

                        <div className="col-span-2">
                          <MultiSelect
                            label="Exclude Unit(s)"
                            placeholder="Units"
                            options={customers.filter((c) => c.unit?.id && !(broadcastForm.audience_targets || []).some((t) => t.target_kind === "UNIT" && t.unit === c.unit?.id))}
                            selectedValues={tempSelectedUnits}
                            onApply={(values) => {
                              if (values.length > 0) {
                                addMultipleAudienceTargets("UNIT", values, true);
                                setTempSelectedUnits([]);
                              }
                            }}
                            disabled={loadingCustomers || customers.length === 0}
                            getOptionLabel={(c) => `${c.unit?.label || "Unit"} - ${toTitleCase(c.customer_name || c.name || "")}`}
                            getOptionValue={(c) => c.unit?.id}
                          />
                        </div>
                      </div>
                    </div>

                    {(broadcastForm.audience_targets || []).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Selected Targets
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-accent/20">
                          {(broadcastForm.audience_targets || []).map((target, idx) => {
                            let targetLabel = "";
                            let icon = null;
                            if (target.target_kind === "ALL") {
                              targetLabel = "All (Project)";
                              icon = <Building2 className="w-4 h-4" />;
                            } else if (target.target_kind === "GROUP" && target.group) {
                              const group = groups.find((g) => g.id === target.group);
                              targetLabel = group?.name || `Group ID: ${target.group}`;
                              icon = <Users className="w-4 h-4" />;
                            } else if (target.target_kind === "USER" && target.user) {
                              const customer = customers.find((c) => (c.customer_id ?? c.id) === target.user);
                              targetLabel = customer?.customer_name || customer?.name || `User ID: ${target.user}`;
                              icon = <User className="w-4 h-4" />;
                            } else if (target.target_kind === "TOWER" && target.tower) {
                              const tower = (selectedProjectData?.towers || []).find((t) => t.id === target.tower);
                              targetLabel = tower?.name || `Tower ID: ${target.tower}`;
                              icon = <Building2 className="w-4 h-4" />;
                            } else if (target.target_kind === "UNIT" && target.unit) {
                              const customer = customers.find((c) => c.unit?.id === target.unit);
                              targetLabel = customer?.unit?.label || `Unit ID: ${target.unit}`;
                              icon = <Building2 className="w-4 h-4" />;
                            }
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  target.exclude ? "bg-error-light/50 border-error" : "bg-card border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${target.exclude ? "text-error" : "text-foreground"}`}>
                                      {target.exclude && <span className="font-bold mr-1">EXCLUDE:</span>}
                                      {toTitleCase(target.target_kind)}
                                    </span>
                                    <span className={`text-xs ${target.exclude ? "text-error/70" : "text-muted-foreground"}`}>
                                      {toTitleCase(targetLabel)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAudienceTarget(idx)}
                                  className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="dn-btn dn-btn-light"
                  onClick={handleCancelForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dn-btn dn-btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (editing ? "Updating..." : "Creating...") : (editing ? "Update Broadcast" : "Create Broadcast")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
