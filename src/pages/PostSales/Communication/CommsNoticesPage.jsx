import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { Eye, Plus, X, Filter, Users, Building2, User, ChevronDown, Check, Search, Upload, Paperclip, Grid3x3, List, Download } from "lucide-react";
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

// MultiSelect Component (same as Events page)
const MultiSelect = ({ 
  label, 
  options = [], 
  selectedValues = [], 
  onSelectionChange, 
  onApply,
  disabled = false,
  placeholder = "Select...",
  getOptionLabel = (opt) => opt.name || opt.label || String(opt),
  getOptionValue = (opt) => opt.id || opt.value,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tempSelected, setTempSelected] = React.useState(selectedValues);
  const dropdownRef = React.useRef(null);
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    setTempSelected(selectedValues);
  }, [selectedValues]);

  React.useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "unset";
      return;
    }
    
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleToggle = (value) => {
    if (tempSelected.includes(value)) {
      setTempSelected(tempSelected.filter((v) => v !== value));
    } else {
      setTempSelected([...tempSelected, value]);
    }
  };

  const handleSelectAll = () => {
    const filteredOptions = filteredOptionsList;
    if (filteredOptions.every(opt => tempSelected.includes(getOptionValue(opt)))) {
      setTempSelected(tempSelected.filter(v => !filteredOptions.some(opt => getOptionValue(opt) === v)));
    } else {
      const newSelections = [...new Set([...tempSelected, ...filteredOptions.map(opt => getOptionValue(opt))])];
      setTempSelected(newSelections);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply(tempSelected);
    } else if (onSelectionChange) {
      onSelectionChange(tempSelected);
    }
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
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const label = getOptionLabel(opt).toLowerCase();
      return label.includes(query);
    });
  }, [options, searchQuery, getOptionLabel]);

  const selectedCount = selectedValues.length;
  const displayText = selectedCount === 0 
    ? placeholder 
    : `${selectedCount} selected`;

  const filteredSelectedCount = filteredOptionsList.filter(opt => 
    tempSelected.includes(getOptionValue(opt))
  ).length;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm text-muted-foreground mb-1.5">
          {label}
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm hover:border-primary transition-colors flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={selectedCount === 0 ? "text-muted-foreground" : ""}>
            {displayText}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && !disabled && (
        <div className="dn-modal-overlay" onMouseDown={handleCancel} style={{ alignItems: 'flex-start', paddingTop: '100px' }}>
          {/* Modal - Positioned below button */}
          <div 
            ref={modalRef}
            className="dn-modal dn-modal-sm"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">{label}</div>
              </div>
              <button
                type="button"
                className="dn-close-btn"
                onClick={handleCancel}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            {/* Search Bar */}
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

            {/* Select All */}
            {filteredOptionsList.length > 0 && (
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded flex items-center gap-2"
                  style={{ 
                    width: "100%", 
                    textAlign: "left", 
                    padding: "8px 12px", 
                    fontSize: "14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px"
                  }}
                >
                  <div className={`w-4 h-4 border border-border rounded flex items-center justify-center ${
                    filteredSelectedCount === filteredOptionsList.length
                      ? "bg-primary border-primary" 
                      : ""
                  }`}>
                    {filteredSelectedCount === filteredOptionsList.length && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {filteredSelectedCount === filteredOptionsList.length
                      ? "Deselect All" 
                      : "Select All"}
                  </span>
                </button>
              </div>
            )}

            {/* Options List */}
            <div className="dn-modal-body" style={{ padding: "18px", maxHeight: "400px", overflowY: "auto" }}>
              {filteredOptionsList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground" style={{ textAlign: "center", padding: "32px 0", fontSize: "14px", color: "#6b7280" }}>
                  No options found
                </div>
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
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: "14px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <div className={`w-4 h-4 border border-border rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary border-primary" : ""
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1">{getOptionLabel(option)}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="dn-modal-footer">
              <button
                type="button"
                className="dn-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dn-btn dn-btn-primary"
                onClick={handleApply}
              >
                Apply ({tempSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const defaultForm = {
  project: "",
  title: "",
  body: "",
  template: "",
  template_context: {},
  priority: "NORMAL",
  publish_at: "",
  expires_at: "",
  is_pinned: false,
  requires_ack: false,
  is_active: true,
  audience_targets: [],
};

export default function CommsNoticesPage() {
  const location = useLocation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noticeForm, setNoticeForm] = useState(defaultForm);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Audience target selection states
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [tempSelectedTowers, setTempSelectedTowers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedProjectData, setSelectedProjectData] = useState(null);

  // File attachments
  const [attachments, setAttachments] = useState([]);
  const [attachmentNames, setAttachmentNames] = useState([]);

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterPinned, setFilterPinned] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  
  // View state
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
    fetchProjects();
    fetchTemplates();
    fetchTemplateVariables();
  }, []);

  useEffect(() => {
    setShowForm(false);
    setNoticeForm(defaultForm);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setAttachments([]);
    setAttachmentNames([]);
    setSelectedTemplate(null);
  }, [location.pathname]);

  useEffect(() => {
    if (noticeForm.project) {
      fetchCustomersForProject(noticeForm.project);
      fetchProjectData(noticeForm.project);
    } else {
      setSelectedProjectData(null);
      setCustomers([]);
    }
  }, [noticeForm.project, projects]);

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("client/my-scope/");
      if (response.data?.projects) {
        setProjects(response.data.projects);
      } else {
        // Fallback to direct projects endpoint
        const fallbackResponse = await axiosInstance.get("clientsetup/projects/");
        if (fallbackResponse.data?.results) {
          setProjects(fallbackResponse.data.results);
        } else if (Array.isArray(fallbackResponse.data)) {
          setProjects(fallbackResponse.data);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const fetchProjectData = async (projectId) => {
    try {
      // Try to get project from projects list first (if it has towers)
      const projectFromList = projects.find((p) => p.id === Number(projectId));
      if (projectFromList?.towers) {
        setSelectedProjectData(projectFromList);
        return;
      }
      
      // Fallback: fetch project details
      const response = await axiosInstance.get(`clientsetup/projects/${projectId}/`);
      const projectData = response.data;
      
      // Fetch towers separately if not included
      if (!projectData.towers) {
        try {
          const towersResponse = await axiosInstance.get("clientsetup/towers/", {
            params: { project_id: projectId },
          });
          const towers = towersResponse.data?.results || towersResponse.data || [];
          projectData.towers = towers;
        } catch (towerError) {
          console.error("Error fetching towers:", towerError);
          projectData.towers = [];
        }
      }
      
      setSelectedProjectData(projectData);
    } catch (error) {
      console.error("Error fetching project data:", error);
      setSelectedProjectData(null);
    }
  };

  const fetchCustomersForProject = async (projectId) => {
    setLoadingCustomers(true);
    try {
      const response = await axiosInstance.get(
        `financial/demand-notes/project-customers/?project_id=${projectId}&only_names_unit=1&page_size=100`
      );
      if (response.data?.results) {
        setCustomers(response.data.results);
      } else if (Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get("community/message-templates/");
      if (response.data?.results) {
        setTemplates(response.data.results);
      } else if (Array.isArray(response.data)) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchTemplateVariables = async () => {
    try {
      const response = await axiosInstance.get("community/template-variables/");
      let vars = [];
      if (Array.isArray(response.data)) {
        vars = response.data;
      } else if (response.data?.results) {
        vars = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        vars = response.data.data;
      }
      setTemplateVariables(vars.filter((v) => v.is_active));
    } catch (error) {
      console.error("Error fetching template variables:", error);
    }
  };

  const buildListParams = () => {
    const params = {};
    if (filterProject) params.project_id = filterProject;
    if (filterStatus) params.status = filterStatus;
    if (filterActive !== "") params.active = filterActive === "true";
    if (filterPriority) params.priority = filterPriority;
    if (filterPinned !== "") params.pinned = filterPinned === "true";
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;
    if (search.trim()) params.search = search.trim();
    return params;
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("community/notices/", {
        params: buildListParams(),
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setNotices(data);
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to load notices");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle template selection
    if (name === "template") {
      const template = templates.find((t) => t.id === Number(value));
      setSelectedTemplate(template || null);
      setNoticeForm((prev) => ({
        ...prev,
        template: value,
        template_context: {}, // Reset template context when template changes
      }));
      return;
    }
    
    // Handle template context fields
    if (name.startsWith("template_context_")) {
      const contextKey = name.replace("template_context_", "");
      setNoticeForm((prev) => ({
        ...prev,
        template_context: {
          ...prev.template_context,
          [contextKey]: value,
        },
      }));
      return;
    }
    
    // If publish date changes, update expires date min
    if (name === "publish_at" && value) {
      setNoticeForm((prev) => ({
        ...prev,
        [name]: value,
        // Set expires date to publish date if expires date is before publish date
        expires_at: prev.expires_at && prev.expires_at < value ? value : prev.expires_at,
      }));
      return;
    }
    
    setNoticeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newAttachments = [...attachments, ...files];
    const newNames = [...attachmentNames, ...files.map(() => "")];
    
    setAttachments(newAttachments);
    setAttachmentNames(newNames);
    e.target.value = ""; // Reset input
  };

  const handleAttachmentNameChange = (index, name) => {
    const newNames = [...attachmentNames];
    newNames[index] = name;
    setAttachmentNames(newNames);
  };

  const handleRemoveFile = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setAttachmentNames(attachmentNames.filter((_, i) => i !== index));
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    // Convert local datetime to ISO string
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  };

  const addAudienceTarget = (targetKind, targetId = null, includeChildren = false) => {
    // Check for duplicates
    const isDuplicate = noticeForm.audience_targets.some((target) => {
      if (target.target_kind !== targetKind) return false;
      if (targetKind === "ALL") return true;
      if (targetKind === "TOWER" && target.tower === targetId) return true;
      if (targetKind === "USER" && target.user === targetId) return true;
      return false;
    });

    if (isDuplicate) {
      toast.error("This target is already selected");
      return;
    }

    const newTarget = { target_kind: targetKind };
    if (targetKind === "TOWER" && targetId) {
      newTarget.tower = targetId;
      newTarget.include_children = includeChildren;
    } else if (targetKind === "USER" && targetId) {
      newTarget.user = targetId;
    }

    setNoticeForm((prev) => ({
      ...prev,
      audience_targets: [...prev.audience_targets, newTarget],
    }));
  };

  const addMultipleAudienceTargets = (targetKind, targetIds, includeChildren = false) => {
    const newTargets = [];
    targetIds.forEach((targetId) => {
      const isDuplicate = noticeForm.audience_targets.some((target) => {
        if (target.target_kind !== targetKind) return false;
        if (targetKind === "TOWER" && target.tower === targetId) return true;
        if (targetKind === "USER" && target.user === targetId) return true;
        return false;
      });

      if (!isDuplicate) {
        const newTarget = { target_kind: targetKind };
        if (targetKind === "TOWER" && targetId) {
          newTarget.tower = targetId;
          newTarget.include_children = includeChildren;
        } else if (targetKind === "USER" && targetId) {
          newTarget.user = targetId;
        }
        newTargets.push(newTarget);
      }
    });

    if (newTargets.length > 0) {
      setNoticeForm((prev) => ({
        ...prev,
        audience_targets: [...prev.audience_targets, ...newTargets],
      }));
    }
  };

  const removeAudienceTarget = (index) => {
    setNoticeForm((prev) => ({
      ...prev,
      audience_targets: prev.audience_targets.filter((_, i) => i !== index),
    }));
  };

  const handleCreateNotice = async () => {
    setSubmitting(true);
    try {
      // Validate required fields
      if (!noticeForm.project) {
        toast.error("Project is required");
        setSubmitting(false);
        return;
      }

      if (!noticeForm.title.trim()) {
        toast.error("Title is required");
        setSubmitting(false);
        return;
      }

      if (!noticeForm.body.trim() && !noticeForm.template) {
        toast.error("Body or Template is required");
        setSubmitting(false);
        return;
      }

      if (noticeForm.audience_targets.length === 0) {
        toast.error("At least one audience target is required");
        setSubmitting(false);
        return;
      }

      const payload = {
        project: Number(noticeForm.project),
        title: noticeForm.title.trim(),
        body: noticeForm.body.trim() || "",
        priority: noticeForm.priority || "NORMAL",
        publish_at: noticeForm.publish_at ? formatDateTime(noticeForm.publish_at) : null,
        expires_at: noticeForm.expires_at ? formatDateTime(noticeForm.expires_at) : null,
        is_pinned: noticeForm.is_pinned || false,
        requires_ack: noticeForm.requires_ack || false,
        is_active: noticeForm.is_active,
        audience_targets: noticeForm.audience_targets,
      };

      // Add template if selected
      if (noticeForm.template) {
        payload.template = Number(noticeForm.template);
        payload.template_context = Object.keys(noticeForm.template_context).length > 0 
          ? noticeForm.template_context 
          : {};
      }

      // Check if we have attachments - use FormData if yes, JSON if no
      if (attachments.length > 0) {
        const formData = new FormData();
        
        // Add all text fields
        formData.append("project", payload.project);
        formData.append("title", payload.title);
        formData.append("body", payload.body);
        formData.append("priority", payload.priority);
        if (payload.publish_at) formData.append("publish_at", payload.publish_at);
        if (payload.expires_at) formData.append("expires_at", payload.expires_at);
        formData.append("is_pinned", payload.is_pinned);
        formData.append("requires_ack", payload.requires_ack);
        formData.append("is_active", payload.is_active);
        
        if (payload.template) {
          formData.append("template", payload.template);
          formData.append("template_context", JSON.stringify(payload.template_context));
        }
        
        formData.append("audience_targets", JSON.stringify(payload.audience_targets));
        
        // Add attachments (multiple files with same key)
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
        
        // Add attachment names
        attachmentNames.forEach((name) => {
          formData.append("attachment_names", name || "");
        });
        
        await axiosInstance.post("community/notices/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // No attachments - use JSON
        await axiosInstance.post("community/notices/", payload);
      }

      toast.success("Notice created successfully");
      setNoticeForm(defaultForm);
      setTempSelectedUsers([]);
      setTempSelectedTowers([]);
      setAttachments([]);
      setAttachmentNames([]);
      setSelectedTemplate(null);
      setShowForm(false);
      fetchNotices();
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to create notice"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAdd = () => {
    setNoticeForm(defaultForm);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setAttachments([]);
    setAttachmentNames([]);
    setSelectedTemplate(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setNoticeForm(defaultForm);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setAttachments([]);
    setAttachmentNames([]);
    setSelectedTemplate(null);
    setShowForm(false);
  };

  const handleApplyFilters = () => {
    fetchNotices();
    setOpenFilter(false);
  };

  const handleResetFilters = () => {
    setFilterProject("");
    setFilterStatus("");
    setFilterActive("");
    setFilterPriority("");
    setFilterPinned("");
    setFilterDateFrom("");
    setFilterDateTo("");
    fetchNotices();
    setOpenFilter(false);
  };

  const filteredNotices = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return notices;

    return notices.filter((n) => {
      const blob = [n.title, n.body || n.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [notices, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search notices..."
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
                <i className="fa fa-filter" style={{ marginRight: 6 }} />
                Filters
              </button>

              {/* View Toggle */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center", marginRight: "8px" }}>
                <button
                  type="button"
                  className={`filter-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                  style={{ 
                    padding: "6px 10px",
                    background: viewMode === "list" ? "#19376d" : "transparent",
                    color: viewMode === "list" ? "#fff" : "#374151",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`filter-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  style={{ 
                    padding: "6px 10px",
                    background: viewMode === "grid" ? "#19376d" : "transparent",
                    color: viewMode === "grid" ? "#fff" : "#374151",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                className="filter-btn"
                onClick={handleStartAdd}
                title="Add Notice"
              >
                Add Notice
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
                      label="Priority"
                      name="filterPriority"
                      type="select"
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        { value: "LOW", label: "Low" },
                        { value: "NORMAL", label: "Normal" },
                        { value: "HIGH", label: "High" },
                        { value: "URGENT", label: "Urgent" },
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
                      label="Date From"
                      name="filterDateFrom"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                    <FormInput
                      label="Date To"
                      name="filterDateTo"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </FormGrid>
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </button>
                  <button
                    className="dn-btn dn-btn-primary"
                    onClick={handleApplyFilters}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notices List */}
          {loading ? (
            <div className="booking-list-body">
              <div className="booking-list-message">Loading notices...</div>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="booking-list-body">
              <div className="booking-list-message">No notices found.</div>
            </div>
          ) : viewMode === "list" ? (
            <div className="booking-list-body">
              <div className="booking-table-wrapper">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Actions</th>
                      <th>Title</th>
                      <th>Body</th>
                      <th>Project</th>
                      <th>Priority</th>
                      <th>Active</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotices.map((notice) => (
                      <tr key={notice.id} className="dn-row">
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNotice(notice);
                              setViewModalOpen(true);
                            }}
                            className="dn-btn dn-btn-light"
                            style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="dn-wrap">{toTitleCase(notice.title || "-")}</td>
                        <td className="dn-wrap">{toTitleCase(notice.body || notice.message || "-")}</td>
                        <td>{notice.project_name || notice.project || "-"}</td>
                        <td>{toTitleCase(notice.priority || "-")}</td>
                        <td>{notice.is_active ? "Yes" : "No"}</td>
                        <td>
                          {notice.created_at
                            ? new Date(notice.created_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="booking-list-body">
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                gap: "16px",
                padding: "16px"
              }}>
                {filteredNotices.map((notice) => (
                  <div
                    key={notice.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onClick={() => {
                      setSelectedNotice(notice);
                      setViewModalOpen(true);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: "16px", 
                          fontWeight: 600, 
                          color: "#111827",
                          marginBottom: "4px"
                        }}>
                          {toTitleCase(notice.title || "-")}
                        </h3>
                        <div style={{ 
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: notice.priority === "URGENT" ? "#fee2e2" : 
                                     notice.priority === "HIGH" ? "#fef3c7" :
                                     notice.priority === "NORMAL" ? "#dbeafe" : "#f3f4f6",
                          color: notice.priority === "URGENT" ? "#991b1b" :
                                 notice.priority === "HIGH" ? "#92400e" :
                                 notice.priority === "NORMAL" ? "#1e40af" : "#374151"
                        }}>
                          {toTitleCase(notice.priority || "NORMAL")}
                        </div>
                      </div>
                      {notice.is_pinned && (
                        <div style={{ 
                          padding: "4px",
                          background: "#fef3c7",
                          borderRadius: "4px"
                        }} title="Pinned">
                          📌
                        </div>
                      )}
                    </div>
                    
                    <p style={{ 
                      fontSize: "13px", 
                      color: "#6b7280",
                      marginBottom: "12px",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {notice.body || notice.message || "-"}
                    </p>
                    
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#9ca3af",
                      marginBottom: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}>
                      <div><strong>Project:</strong> {notice.project_name || notice.project || "-"}</div>
                      <div><strong>Created:</strong> {notice.created_at ? new Date(notice.created_at).toLocaleString("en-IN") : "-"}</div>
                      {notice.publish_at && (
                        <div><strong>Publish:</strong> {new Date(notice.publish_at).toLocaleString("en-IN")}</div>
                      )}
                      {notice.expires_at && (
                        <div><strong>Expires:</strong> {new Date(notice.expires_at).toLocaleString("en-IN")}</div>
                      )}
                    </div>

                    {notice.attachments && notice.attachments.length > 0 && (
                      <div style={{ 
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #e5e7eb"
                      }}>
                        <div style={{ 
                          fontSize: "12px", 
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <Paperclip className="w-4 h-4" />
                          Attachments ({notice.attachments.length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {notice.attachments.slice(0, 3).map((att, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                background: "#f3f4f6",
                                borderRadius: "4px",
                                color: "#374151"
                              }}
                            >
                              {att.name || `File ${idx + 1}`}
                            </div>
                          ))}
                          {notice.attachments.length > 3 && (
                            <div style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              background: "#f3f4f6",
                              borderRadius: "4px",
                              color: "#374151"
                            }}>
                              +{notice.attachments.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ 
                        fontSize: "12px",
                        color: notice.is_active ? "#16a34a" : "#dc2626",
                        fontWeight: 500
                      }}>
                        {notice.is_active ? "● Active" : "● Inactive"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotice(notice);
                          setViewModalOpen(true);
                        }}
                        className="dn-btn dn-btn-light"
                        style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Modal */}
          {viewModalOpen && selectedNotice && (
            <div
              className="dn-modal-overlay"
              onMouseDown={() => setViewModalOpen(false)}
            >
              <div
                className="dn-modal dn-modal-wide"
                onMouseDown={(e) => e.stopPropagation()}
                style={{ maxWidth: "800px" }}
              >
                <div className="dn-modal-header">
                  <div className="dn-modal-header-left dn-modal-header-left-center">
                    <div className="dn-modal-title">Notice Details</div>
                  </div>
                  <button
                    className="dn-close-btn"
                    onClick={() => setViewModalOpen(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="dn-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Title */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                        Title
                      </label>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                        {toTitleCase(selectedNotice.title || "-")}
                      </div>
                    </div>

                    {/* Priority & Status */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                          Priority
                        </label>
                        <div style={{ 
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: selectedNotice.priority === "URGENT" ? "#fee2e2" : 
                                     selectedNotice.priority === "HIGH" ? "#fef3c7" :
                                     selectedNotice.priority === "NORMAL" ? "#dbeafe" : "#f3f4f6",
                          color: selectedNotice.priority === "URGENT" ? "#991b1b" :
                                 selectedNotice.priority === "HIGH" ? "#92400e" :
                                 selectedNotice.priority === "NORMAL" ? "#1e40af" : "#374151"
                        }}>
                          {toTitleCase(selectedNotice.priority || "NORMAL")}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                          Status
                        </label>
                        <div style={{ 
                          fontSize: "14px",
                          color: selectedNotice.is_active ? "#16a34a" : "#dc2626",
                          fontWeight: 500
                        }}>
                          {selectedNotice.is_active ? "Active" : "Inactive"}
                        </div>
                      </div>
                      {selectedNotice.is_pinned && (
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                            Pinned
                          </label>
                          <div style={{ fontSize: "14px", color: "#374151" }}>Yes</div>
                        </div>
                      )}
                    </div>

                    {/* Project */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                        Project
                      </label>
                      <div style={{ fontSize: "14px", color: "#111827" }}>
                        {selectedNotice.project_name || selectedNotice.project || "-"}
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                        Body
                      </label>
                      <div style={{ 
                        fontSize: "14px", 
                        color: "#374151",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap"
                      }}>
                        {selectedNotice.body || selectedNotice.message || "-"}
                      </div>
                    </div>

                    {/* Template */}
                    {selectedNotice.template_name && (
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                          Template
                        </label>
                        <div style={{ fontSize: "14px", color: "#111827" }}>
                          {selectedNotice.template_name}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                      {selectedNotice.publish_at && (
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                            Publish At
                          </label>
                          <div style={{ fontSize: "14px", color: "#111827" }}>
                            {new Date(selectedNotice.publish_at).toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                      {selectedNotice.expires_at && (
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                            Expires At
                          </label>
                          <div style={{ fontSize: "14px", color: "#111827" }}>
                            {new Date(selectedNotice.expires_at).toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px", display: "block" }}>
                          Created At
                        </label>
                        <div style={{ fontSize: "14px", color: "#111827" }}>
                          {selectedNotice.created_at ? new Date(selectedNotice.created_at).toLocaleString("en-IN") : "-"}
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "8px", display: "block" }}>
                          Attachments ({selectedNotice.attachments.length})
                        </label>
                        <div style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          padding: "12px",
                          background: "#f9fafb"
                        }}>
                          {selectedNotice.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                background: "#fff",
                                borderRadius: "4px",
                                border: "1px solid #e5e7eb"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                <Paperclip className="w-4 h-4" style={{ color: "#6b7280" }} />
                                <span style={{ fontSize: "14px", color: "#111827" }}>
                                  {att.name || `Attachment ${idx + 1}`}
                                </span>
                              </div>
                              {att.file_url && (
                                <a
                                  href={att.file_url.startsWith("http") ? att.file_url : `https://api.presale.myciti.life${att.file_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 8px",
                                    background: "#19376d",
                                    color: "#fff",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    textDecoration: "none",
                                    cursor: "pointer"
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
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-primary"
                    onClick={() => setViewModalOpen(false)}
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
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Create Notice
                </h3>
              </div>

              <FormGrid columns={3}>
                <FormInput
                  label="Project"
                  name="project"
                  type="select"
                  value={noticeForm.project}
                  onChange={handleChange}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
                <FormInput
                  label="Title"
                  name="title"
                  value={noticeForm.title}
                  onChange={handleChange}
                  placeholder="Enter notice title"
                  required
                />
                <FormInput
                  label="Priority"
                  name="priority"
                  type="select"
                  value={noticeForm.priority}
                  onChange={handleChange}
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "NORMAL", label: "Normal" },
                    { value: "HIGH", label: "High" },
                    { value: "URGENT", label: "Urgent" },
                  ]}
                />
                <FormInput
                  label="Template (Optional)"
                  name="template"
                  type="select"
                  value={noticeForm.template}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "No Template" },
                    ...templates.map((t) => ({
                      value: t.id,
                      label: t.name,
                    })),
                  ]}
                />
                <FormInput
                  label="Publish At"
                  name="publish_at"
                  type="datetime-local"
                  value={noticeForm.publish_at}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <FormInput
                  label="Expires At"
                  name="expires_at"
                  type="datetime-local"
                  value={noticeForm.expires_at}
                  onChange={handleChange}
                  min={noticeForm.publish_at || new Date().toISOString().slice(0, 16)}
                />
                <FormInput
                  label="Body"
                  name="body"
                  type="textarea"
                  rows={4}
                  value={noticeForm.body}
                  onChange={handleChange}
                  placeholder="Enter notice body (fallback if no template)"
                  className="col-span-3"
                />
                
                {/* Template Context Fields */}
                {selectedTemplate && templateVariables.length > 0 && (
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Template Context Variables
                    </label>
                    <FormGrid columns={3}>
                      {templateVariables.map((variable) => (
                        <FormInput
                          key={variable.id}
                          label={variable.name || variable.key}
                          name={`template_context_${variable.key}`}
                          value={noticeForm.template_context[variable.key] || ""}
                          onChange={handleChange}
                          placeholder={`Enter ${variable.name || variable.key}`}
                        />
                      ))}
                    </FormGrid>
                  </div>
                )}

                {/* Toggles - Active, Pinned, Requires Acknowledgement */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Active
                  </label>
                  <div className="flex items-center h-11">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <label className="dn-switch">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={noticeForm.is_active}
                          onChange={handleChange}
                        />
                        <span className="dn-slider"></span>
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {noticeForm.is_active ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Pinned
                  </label>
                  <div className="flex items-center h-11">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <label className="dn-switch">
                        <input
                          type="checkbox"
                          name="is_pinned"
                          checked={noticeForm.is_pinned}
                          onChange={handleChange}
                        />
                        <span className="dn-slider"></span>
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {noticeForm.is_pinned ? "Pinned" : "Not Pinned"}
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Requires Acknowledgement
                  </label>
                  <div className="flex items-center h-11">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <label className="dn-switch">
                        <input
                          type="checkbox"
                          name="requires_ack"
                          checked={noticeForm.requires_ack}
                          onChange={handleChange}
                        />
                        <span className="dn-slider"></span>
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {noticeForm.requires_ack ? "Required" : "Not Required"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* File Attachments - Full Width Below */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Attachments
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload files or drag and drop
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border border-border"
                          >
                            <Paperclip className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <input
                                type="text"
                                value={attachmentNames[index] || file.name}
                                onChange={(e) =>
                                  handleAttachmentNameChange(index, e.target.value)
                                }
                                placeholder="File name"
                                className="w-full h-9 rounded border border-border bg-transparent px-2 text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="p-1 hover:bg-error/10 rounded text-error"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </FormGrid>

              {/* Audience Targets Section */}
              {noticeForm.project && (
                <div className="bg-card border border-border rounded-xl p-6 mt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">
                      Audience Targets
                    </h3>
                    {noticeForm.audience_targets.length > 0 && (
                      <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                        {noticeForm.audience_targets.length} target(s) selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-6">
                    {/* Add Targets Section */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Select Audience Targets
                      </label>
                      <FormGrid columns={3}>
                        {/* Add ALL */}
                        <div>
                          <label className="block text-sm text-muted-foreground mb-1.5">
                            All (Project)
                          </label>
                          <button
                            type="button"
                            onClick={() => addAudienceTarget("ALL")}
                            className={`w-full flex items-center justify-center gap-2 h-11 rounded-lg border transition-colors ${
                              noticeForm.audience_targets.some((t) => t.target_kind === "ALL")
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-accent/30 border-border hover:bg-accent/50"
                            }`}
                            disabled={noticeForm.audience_targets.some(
                              (t) => t.target_kind === "ALL"
                            )}
                          >
                            <Building2 className="w-4 h-4" />
                            <span className="text-sm font-medium">All (Project)</span>
                          </button>
                        </div>

                        {/* Add Users */}
                        <MultiSelect
                          label="Add User(s)"
                          placeholder="Users"
                          options={customers.filter((c) => !noticeForm.audience_targets.some((t) => t.target_kind === "USER" && t.user === c.customer_id))}
                          selectedValues={tempSelectedUsers}
                          onApply={(values) => {
                            if (values.length > 0) {
                              addMultipleAudienceTargets("USER", values);
                              setTempSelectedUsers([]);
                            }
                          }}
                          disabled={loadingCustomers || customers.length === 0}
                          getOptionLabel={(c) => `${toTitleCase(c.customer_name)} - Unit ${c.unit?.label}`}
                          getOptionValue={(c) => c.customer_id}
                        />

                        {/* Add Tower */}
                        <MultiSelect
                          label="Add Tower(s)"
                          placeholder="Towers"
                          options={selectedProjectData?.towers?.filter((t) => !noticeForm.audience_targets.some((target) => target.target_kind === "TOWER" && target.tower === t.id)) || []}
                          selectedValues={tempSelectedTowers}
                          onApply={(values) => {
                            if (values.length > 0) {
                              // For towers, include_children defaults to true
                              addMultipleAudienceTargets("TOWER", values, true);
                              setTempSelectedTowers([]);
                            }
                          }}
                          disabled={!selectedProjectData?.towers?.length}
                          getOptionLabel={(t) => toTitleCase(t.name)}
                          getOptionValue={(t) => t.id}
                        />
                      </FormGrid>
                    </div>

                    {/* Selected Targets */}
                    {noticeForm.audience_targets.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Selected Targets
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-accent/20">
                          {noticeForm.audience_targets.map((target, idx) => {
                            let label = "";
                            let icon = null;
                            if (target.target_kind === "ALL") {
                              label = "All (Project)";
                              icon = <Building2 className="w-4 h-4" />;
                            } else if (target.target_kind === "USER" && target.user) {
                              const customer = customers.find(
                                (c) => c.customer_id === target.user
                              );
                              label = customer?.customer_name || `User ID: ${target.user}`;
                              icon = <User className="w-4 h-4" />;
                            } else if (target.target_kind === "TOWER" && target.tower) {
                              const tower = selectedProjectData?.towers?.find(
                                (t) => t.id === target.tower
                              );
                              label = tower?.name || `Tower ID: ${target.tower}`;
                              if (target.include_children) {
                                label += " (with children)";
                              }
                              icon = <Building2 className="w-4 h-4" />;
                            }

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-accent rounded"
                              >
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <span className="text-sm text-foreground">
                                    {toTitleCase(target.target_kind)} - {label}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAudienceTarget(idx)}
                                  className="p-1 hover:bg-error/10 rounded text-error"
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
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors border border-border"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  onClick={handleCreateNotice}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Notice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
