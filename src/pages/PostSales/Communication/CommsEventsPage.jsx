import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { Eye, Plus, Calendar, X, Edit, Trash2, Filter, Users, Building2, User, ChevronDown, Check, Upload, Paperclip, Search } from "lucide-react";
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
      ) : type === "datetime-local" ? (
        <input
          name={name}
          type="datetime-local"
          value={value}
          onChange={onChange}
          min={min}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
        />
      )}
    </div>
  );
};

const Button = ({ variant = "primary", leftIcon, children, ...props }) => {
  const className =
    variant === "outline"
      ? "dn-btn dn-btn-light"
      : "dn-btn dn-btn-primary";
  return (
    <button type="button" className={className} {...props}>
      {leftIcon ? <span style={{ marginRight: 8 }}>{leftIcon}</span> : null}
      {children}
    </button>
  );
};

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
      // Deselect all filtered
      setTempSelected(tempSelected.filter(v => !filteredOptions.some(opt => getOptionValue(opt) === v)));
    } else {
      // Select all filtered
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
  event_type: "",
  title: "",
  description: "",
  starts_at: "",
  ends_at: "",
  location_text: "",
  requires_rsvp: false,
  requires_checkin: false,
  template: "",
  template_context: { lang: "en" },
  audience_targets: [],
};

export default function CommsEventsPage() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState(defaultForm);
  const [projects, setProjects] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [tempSelectedGroups, setTempSelectedGroups] = useState([]);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [tempSelectedTowers, setTempSelectedTowers] = useState([]);
  const [tempSelectedUnits, setTempSelectedUnits] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [attachmentNames, setAttachmentNames] = useState([]);
  const [replaceAttachments, setReplaceAttachments] = useState(false);

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTower, setFilterTower] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [includeGlobal, setIncludeGlobal] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchProjects();
    fetchEventTypes();
    fetchTemplates();
  }, []);

  // Reset form when navigating to this page
  useEffect(() => {
    setShowForm(false);
    setEditingEvent(null);
    setViewingEvent(null);
    setEventForm(defaultForm);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
  }, [location.pathname]);

  // Auto-select project if only one is available
  useEffect(() => {
    if (showForm && projects.length === 1 && !eventForm.project) {
      setEventForm((prev) => ({
        ...prev,
        project: projects[0].id.toString(),
      }));
      fetchEventTypesForProject(projects[0].id);
    }
  }, [projects, showForm, eventForm.project]);

  // Fetch groups and customers when project is selected
  useEffect(() => {
    if (eventForm.project && showForm) {
      fetchGroupsForProject(Number(eventForm.project));
      fetchCustomersForProject(Number(eventForm.project));
      const projectData = projects.find((p) => p.id === Number(eventForm.project));
      setSelectedProjectData(projectData);
    } else {
      setGroups([]);
      setCustomers([]);
      setSelectedProjectData(null);
    }
    // Clear temporary selections when project changes
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
  }, [eventForm.project, showForm, projects]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.append("project_id", filterProject);
      if (filterStatus) params.append("status", filterStatus);
      if (filterDateFrom) params.append("date_from", filterDateFrom);
      if (filterDateTo) params.append("date_to", filterDateTo);
      if (filterTower) params.append("tower_id", filterTower);
      if (filterUser) params.append("user_id", filterUser);
      if (filterGroup) params.append("group_id", filterGroup);
      if (!includeGlobal) params.append("include_global", "0");

      const response = await axiosInstance.get(
        `community/events/?${params.toString()}`
      );
      if (response.data?.results) {
        setEvents(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("client/my-scope/");
      if (response.data?.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await axiosInstance.get("community/event-types/");
      if (response.data?.results) {
        setEventTypes(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEventTypes(response.data);
      }
    } catch (error) {
      console.error("Error fetching event types:", error);
    }
  };

  const fetchEventTypesForProject = async (projectId) => {
    try {
      const response = await axiosInstance.get(
        `community/event-types/?project_id=${projectId}`
      );
      if (response.data?.results) {
        setEventTypes(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEventTypes(response.data);
      }
    } catch (error) {
      console.error("Error fetching event types:", error);
    }
  };

  const fetchGroupsForProject = async (projectId) => {
    setLoadingGroups(true);
    try {
      const response = await axiosInstance.get(
        `community/groups/?project_id=${projectId}`
      );
      if (response.data?.results) {
        setGroups(response.data.results);
      } else if (Array.isArray(response.data)) {
        setGroups(response.data);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If start date changes, update end date min
    if (name === "starts_at" && value) {
      setEventForm((prev) => ({
        ...prev,
        [name]: value,
        // Set end date min to start date if end date is before start date
        ends_at: prev.ends_at && prev.ends_at < value ? value : prev.ends_at,
      }));
    } else {
      setEventForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const addMultipleAudienceTargets = (targetKind, targetIds, exclude = false) => {
    // Add multiple targets at once
    const newTargets = [];
    targetIds.forEach((targetId) => {
      // Check for duplicates
      const isDuplicate = eventForm.audience_targets.some((target) => {
        if (target.target_kind !== targetKind) return false;
        if (targetKind === "GROUP" && target.group === targetId) return true;
        if (targetKind === "USER" && target.user === targetId) return true;
        if (targetKind === "TOWER" && target.tower === targetId) return true;
        if (targetKind === "UNIT" && target.unit === targetId) return true;
        return false;
      });

      if (!isDuplicate) {
        const newTarget = { target_kind: targetKind };
        if (targetKind === "GROUP" && targetId) {
          newTarget.group = targetId;
        } else if (targetKind === "USER" && targetId) {
          newTarget.user = targetId;
        } else if (targetKind === "TOWER" && targetId) {
          newTarget.tower = targetId;
        } else if (targetKind === "UNIT" && targetId) {
          newTarget.unit = targetId;
        }
        if (exclude) {
          newTarget.exclude = true;
        }
        newTargets.push(newTarget);
      }
    });

    if (newTargets.length > 0) {
      setEventForm((prev) => ({
        ...prev,
        audience_targets: [...prev.audience_targets, ...newTargets],
      }));
    }
  };

  const addAudienceTarget = (targetKind, targetId = null, exclude = false) => {
    // Validate that required IDs are provided for specific target kinds
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

    // Check for duplicates
    const isDuplicate = eventForm.audience_targets.some((target) => {
      if (target.target_kind !== targetKind) return false;
      
      if (targetKind === "ALL") return true; // Only one ALL allowed
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
    if (targetKind === "GROUP" && targetId) {
      newTarget.group = targetId;
    } else if (targetKind === "USER" && targetId) {
      newTarget.user = targetId;
    } else if (targetKind === "TOWER" && targetId) {
      newTarget.tower = targetId;
    } else if (targetKind === "UNIT" && targetId) {
      newTarget.unit = targetId;
    }
    if (exclude) {
      newTarget.exclude = true;
    }

    setEventForm((prev) => ({
      ...prev,
      audience_targets: [...prev.audience_targets, newTarget],
    }));
  };

  const removeAudienceTarget = (index) => {
    setEventForm((prev) => ({
      ...prev,
      audience_targets: prev.audience_targets.filter((_, i) => i !== index),
    }));
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleTowerToggle = (towerId) => {
    setSelectedTowers((prev) => {
      if (prev.includes(towerId)) {
        return prev.filter((id) => id !== towerId);
      } else {
        return [...prev, towerId];
      }
    });
  };

  const handleUnitToggle = (unitId) => {
    setSelectedUnits((prev) => {
      if (prev.includes(unitId)) {
        return prev.filter((id) => id !== unitId);
      } else {
        return [...prev, unitId];
      }
    });
  };

  const handleAddSelectedGroups = () => {
    selectedGroups.forEach((groupId) => {
      addAudienceTarget("GROUP", groupId);
    });
    setSelectedGroups([]);
  };

  const handleAddSelectedUsers = () => {
    selectedUsers.forEach((userId) => {
      addAudienceTarget("USER", userId);
    });
    setSelectedUsers([]);
  };

  const handleAddSelectedTowers = () => {
    selectedTowers.forEach((towerId) => {
      addAudienceTarget("TOWER", towerId);
    });
    setSelectedTowers([]);
  };

  const handleAddSelectedUnits = () => {
    selectedUnits.forEach((unitId) => {
      addAudienceTarget("UNIT", unitId, true);
    });
    setSelectedUnits([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      // Initialize names for new files
      const newNames = files.map((file) => file.name);
      setAttachmentNames((prev) => [...prev, ...newNames]);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentNameChange = (index, name) => {
    const newNames = [...attachmentNames];
    newNames[index] = name;
    setAttachmentNames(newNames);
  };

  const handleCreateEvent = async () => {
    setSubmitting(true);
    try {
      // Format datetime to ISO 8601 format
      const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return "";
        // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to ISO 8601
        const date = new Date(dateTimeStr);
        // Get timezone offset and format
        const offset = -date.getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const hours = Math.floor(Math.abs(offset) / 60)
          .toString()
          .padStart(2, "0");
        const minutes = (Math.abs(offset) % 60).toString().padStart(2, "0");
        return `${date.toISOString().slice(0, 19)}${sign}${hours}:${minutes}`;
      };

      // Validate required fields
      if (!eventForm.project) {
        toast.error("Project is required");
        setSubmitting(false);
        return;
      }

      if (!eventForm.starts_at) {
        toast.error("Start date is required");
        setSubmitting(false);
        return;
      }

      // Filter and validate audience targets
      const validAudienceTargets = (eventForm.audience_targets || []).filter((target) => {
        if (target.target_kind === "GROUP" && !target.group) {
          return false;
        }
        if (target.target_kind === "USER" && !target.user) {
          return false;
        }
        if (target.target_kind === "TOWER" && !target.tower) {
          return false;
        }
        if (target.target_kind === "UNIT" && !target.unit) {
          return false;
        }
        return true;
      });

      const payload = {
        project: Number(eventForm.project),
        event_type: eventForm.event_type ? Number(eventForm.event_type) : undefined,
        title: eventForm.title,
        description: eventForm.description || "",
        start_at: formatDateTime(eventForm.starts_at),
        ends_at: formatDateTime(eventForm.ends_at),
        location_text: eventForm.location_text || "",
        requires_rsvp: eventForm.requires_rsvp,
        requires_checkin: eventForm.requires_checkin,
      };

      if (eventForm.template) {
        payload.template = Number(eventForm.template);
        payload.template_context = eventForm.template_context;
      }

      if (validAudienceTargets.length > 0) {
        payload.audience_targets = validAudienceTargets;
      }

      // Check if we have attachments - use FormData if yes, JSON if no
      if (attachments.length > 0) {
        const formData = new FormData();
        
        // Add all text fields
        formData.append("project", payload.project);
        if (payload.event_type) formData.append("event_type", payload.event_type);
        formData.append("title", payload.title);
        formData.append("description", payload.description || "");
        formData.append("start_at", payload.start_at);
        formData.append("ends_at", payload.ends_at);
        formData.append("location_text", payload.location_text || "");
        formData.append("requires_rsvp", payload.requires_rsvp);
        formData.append("requires_checkin", payload.requires_checkin);
        formData.append("is_cancelled", false);
        formData.append("replace_attachments", replaceAttachments);
        
        if (payload.template) {
          formData.append("template", payload.template);
          formData.append("template_context", JSON.stringify(payload.template_context));
        }
        
        if (validAudienceTargets.length > 0) {
          formData.append("audience_targets", JSON.stringify(validAudienceTargets));
        }
        
        // Add attachments (multiple files with same key)
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
        
        // Add attachment names
        attachmentNames.forEach((name) => {
          formData.append("attachment_names", name);
        });
        
        if (editingEvent) {
          // Update event
          await axiosInstance.patch(`community/events/${editingEvent.id}/`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          toast.success("Event updated successfully");
        } else {
          // Create event
          await axiosInstance.post("community/events/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          toast.success("Event created successfully");
        }
      } else {
        // No attachments - use JSON
        if (editingEvent) {
          // Update event
          await axiosInstance.patch(`community/events/${editingEvent.id}/`, payload);
          toast.success("Event updated successfully");
        } else {
          // Create event
          await axiosInstance.post("community/events/", payload);
          toast.success("Event created successfully");
        }
      }
      
      setEventForm(defaultForm);
      setAttachments([]);
      setAttachmentNames([]);
      setReplaceAttachments(false);
      setEditingEvent(null);
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          `Failed to ${editingEvent ? "update" : "create"} event`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewEvent = (event) => {
    setViewingEvent(event);
    setShowForm(true);
  };

  const handleStartAdd = () => {
    setEventForm(defaultForm);
    setEditingEvent(null);
    setViewingEvent(null);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEventForm(defaultForm);
    setEditingEvent(null);
    setViewingEvent(null);
    setTempSelectedGroups([]);
    setTempSelectedUsers([]);
    setTempSelectedTowers([]);
    setTempSelectedUnits([]);
    setAttachments([]);
    setAttachmentNames([]);
    setReplaceAttachments(false);
    setShowForm(false);
  };

  const handleApplyFilters = () => {
    fetchEvents();
    setOpenFilter(false);
  };

  const handleResetFilters = () => {
    setFilterProject("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTower("");
    setFilterUser("");
    setFilterGroup("");
    setIncludeGlobal(true);
    fetchEvents();
    setOpenFilter(false);
  };

  const columns = useMemo(
    () => [
      {
        key: "actions",
        header: "Actions",
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleViewEvent(row)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title="View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
      { key: "title", header: "Title", className: "dn-wrap" },
      {
        key: "event_type",
        header: "Event Type",
        render: (value) => {
          const type = eventTypes.find((t) => t.id === value);
          return toTitleCase(type?.name || `Type ${value}`);
        },
      },
      {
        key: "starts_at",
        header: "Start At",
        render: (value) =>
          value ? new Date(value).toLocaleString("en-IN") : "-",
      },
      {
        key: "ends_at",
        header: "End At",
        render: (value) =>
          value ? new Date(value).toLocaleString("en-IN") : "-",
      },
      { key: "location_text", header: "Location", className: "dn-wrap" },
      {
        key: "requires_rsvp",
        header: "Requires RSVP",
        render: (value) => (value ? "Yes" : "No"),
      },
      {
        key: "is_cancelled",
        header: "Status",
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              value
                ? "bg-error-light text-error"
                : "bg-success-light text-success"
            }`}
          >
            {toTitleCase(value ? "Cancelled" : "Active")}
          </span>
        ),
      },
      { key: "created_at", header: "Created On" },
    ],
    [eventTypes]
  );

  const filteredEvents = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return events;

    return events.filter((e) => {
      const blob = [e.title, e.description, e.location_text]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [events, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search events..."
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

              <button
                type="button"
                className="filter-btn"
                onClick={handleStartAdd}
                title="Add Event"
              >
                Add Event
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Events (Static)"
              >
                Static
              </button>
            </div>
          </div>

          <div className="booking-table-wrapper pr-table-wrap">
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                Loading...
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  className="booking-table dn-subtable"
                  style={{ minWidth: 1000, width: "100%" }}
                >
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key || col.header}>
                          {toTitleCase(col.header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((row, idx) => (
                        <tr key={row.id ?? idx} className="dn-row">
                          {columns.map((col) => (
                            <td key={col.key || col.header}>
                              {col.render
                                ? col.render(row[col.key], row)
                                : col.key === "created_at"
                                ? row[col.key]
                                  ? new Date(row[col.key]).toLocaleString(
                                      "en-IN"
                                    )
                                  : "-"
                                : toTitleCase(row[col.key] ?? "-")}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {openFilter ? (
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
                  <FormGrid columns={2}>
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
                        { value: "future", label: "Future" },
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
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
                    <FormInput
                      label="Tower ID"
                      name="filterTower"
                      type="number"
                      value={filterTower}
                      onChange={(e) => setFilterTower(e.target.value)}
                      placeholder="Enter tower ID"
                    />
                    <FormInput
                      label="User ID"
                      name="filterUser"
                      type="number"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      placeholder="Enter user ID"
                    />
                    <FormInput
                      label="Group ID"
                      name="filterGroup"
                      type="number"
                      value={filterGroup}
                      onChange={(e) => setFilterGroup(e.target.value)}
                      placeholder="Enter group ID"
                    />
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeGlobal}
                          onChange={(e) => setIncludeGlobal(e.target.checked)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-muted-foreground">
                          Include Global Events
                        </span>
                      </label>
                    </div>
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
          ) : null}
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    {viewingEvent ? "View Event" : editingEvent ? "Edit Event" : "Create Event"}
                  </h3>
                </div>
                {viewingEvent ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Title
                      </label>
                      <p className="text-sm text-foreground">
                        {toTitleCase(viewingEvent.title || "-")}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Description
                      </label>
                      <p className="text-sm text-foreground">
                        {toTitleCase(viewingEvent.description || "-")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Start At
                        </label>
                        <p className="text-sm text-foreground">
                          {viewingEvent.starts_at
                            ? new Date(viewingEvent.starts_at).toLocaleString(
                                "en-IN"
                              )
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          End At
                        </label>
                        <p className="text-sm text-foreground">
                          {viewingEvent.ends_at
                            ? new Date(viewingEvent.ends_at).toLocaleString(
                                "en-IN"
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Location
                      </label>
                      <p className="text-sm text-foreground">
                        {toTitleCase(viewingEvent.location_text || "-")}
                      </p>
                    </div>
                    {viewingEvent.audience_targets &&
                      viewingEvent.audience_targets.length > 0 && (
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">
                            Audience Targets
                          </label>
                          <div className="space-y-1">
                            {viewingEvent.audience_targets.map((target, idx) => {
                              let label = "";
                              if (target.target_kind === "ALL") {
                                label = "All (Project)";
                              } else if (target.target_kind === "GROUP" && target.group) {
                                label = `Group ID: ${target.group}`;
                              } else if (target.target_kind === "USER" && target.user) {
                                label = `User ID: ${target.user}`;
                              } else if (target.target_kind === "TOWER" && target.tower) {
                                label = `Tower ID: ${target.tower}`;
                              } else if (target.target_kind === "UNIT" && target.unit) {
                                label = `Unit ID: ${target.unit}`;
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`text-sm text-foreground p-2 rounded ${
                                    target.exclude ? "bg-error-light" : "bg-accent"
                                  }`}
                                >
                                  {target.exclude ? (
                                    <span style={{ color: "#dc2626" }}>
                                      Exclude: {toTitleCase(target.target_kind)} - {label}
                                    </span>
                                  ) : (
                                    <span>
                                      {toTitleCase(target.target_kind)} - {label}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={handleCancel}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FormGrid columns={2}>
                      <FormInput
                        label="Project"
                        name="project"
                        type="select"
                        value={eventForm.project}
                        onChange={handleChange}
                        options={projects.map((p) => ({
                          value: p.id,
                          label: p.name,
                        }))}
                        required
                      />
                      <FormInput
                        label="Event Type"
                        name="event_type"
                        type="select"
                        value={eventForm.event_type}
                        onChange={handleChange}
                        options={eventTypes.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        required
                      />
                      <FormInput
                        label="Title"
                        name="title"
                        value={eventForm.title}
                        onChange={handleChange}
                        placeholder="Enter event title"
                        required
                      />
                      <FormInput
                        label="Location"
                        name="location_text"
                        value={eventForm.location_text}
                        onChange={handleChange}
                        placeholder="Enter location"
                      />
                      <FormInput
                        label="Start At"
                        name="starts_at"
                        type="datetime-local"
                        value={eventForm.starts_at}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <FormInput
                        label="End At"
                        name="ends_at"
                        type="datetime-local"
                        value={eventForm.ends_at}
                        onChange={handleChange}
                        required
                        min={eventForm.starts_at || new Date().toISOString().slice(0, 16)}
                      />
                      <FormInput
                        label="Template"
                        name="template"
                        type="select"
                        value={eventForm.template}
                        onChange={handleChange}
                        options={templates.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                      />
                      <div></div>
                      <FormInput
                        label="Description"
                        name="description"
                        type="textarea"
                        rows={3}
                        value={eventForm.description}
                        onChange={handleChange}
                        placeholder="Enter event description"
                        className="col-span-2"
                      />
                      {/* RSVP and Check-in Toggles - Same Line */}
                      <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                          {/* RSVP Toggle */}
                          <div className="flex items-center justify-between p-3 bg-accent/30 border border-border">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Requires RSVP
                              </label>
                            </div>
                            <label
                              style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                name="requires_rsvp"
                                checked={eventForm.requires_rsvp}
                                onChange={handleChange}
                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                              />
                              <div
                                style={{
                                  width: 44,
                                  height: 24,
                                  backgroundColor: eventForm.requires_rsvp ? "#3b82f6" : "#e5e7eb",
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
                                    left: eventForm.requires_rsvp ? 22 : 2,
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

                          {/* Requires Check-in Toggle */}
                          <div className="flex items-center justify-between p-3 bg-accent/30 border border-border">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Requires Check-in
                              </label>
                            </div>
                            <label
                              style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                name="requires_checkin"
                                checked={eventForm.requires_checkin}
                                onChange={handleChange}
                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                              />
                              <div
                                style={{
                                  width: 44,
                                  height: 24,
                                  backgroundColor: eventForm.requires_checkin ? "#3b82f6" : "#e5e7eb",
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
                                    left: eventForm.requires_checkin ? 22 : 2,
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

                    {/* File Attachments Section */}
                    <div className="bg-card border border-border rounded-xl p-6 mt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Paperclip className="w-5 h-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">
                          Attachments
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {/* File Input */}
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

                        {/* Replace Attachments Toggle (only for edit mode) */}
                        {editingEvent && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="replace_attachments"
                              checked={replaceAttachments}
                              onChange={(e) => setReplaceAttachments(e.target.checked)}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="replace_attachments" className="text-sm text-muted-foreground cursor-pointer">
                              Replace all existing attachments
                            </label>
                          </div>
                        )}

                        {/* File List */}
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

                    {/* Audience Targets Section */}
                    {eventForm.project && (
                      <div className="bg-card border border-border rounded-xl p-6 mt-6">
                        <div className="flex items-center gap-3 mb-6">
                          <Users className="w-5 h-5 text-primary" />
                          <h3 className="text-base font-semibold text-foreground">
                            Audience Targets
                          </h3>
                          {eventForm.audience_targets.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                              {eventForm.audience_targets.length} target(s) selected
                            </span>
                          )}
                        </div>
                        <div className="space-y-6">
                          {/* Add Targets Section */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-3">
                              Select Audience Targets
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Add ALL */}
                              <button
                                type="button"
                                onClick={() => addAudienceTarget("ALL")}
                                className={`flex items-center justify-center gap-2 h-11 rounded-lg border transition-colors ${
                                  eventForm.audience_targets.some((t) => t.target_kind === "ALL")
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-accent/30 border-border hover:bg-accent/50"
                                }`}
                                disabled={eventForm.audience_targets.some(
                                  (t) => t.target_kind === "ALL"
                                )}
                              >
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm font-medium">All (Project)</span>
                              </button>

                              {/* Add Groups */}
                              <MultiSelect
                                label="Add Group(s)"
                                placeholder="Groups"
                                options={groups.filter((g) => !eventForm.audience_targets.some((t) => t.target_kind === "GROUP" && t.group === g.id))}
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

                              {/* Add Users */}
                              <MultiSelect
                                label="Add User(s)"
                                placeholder="Users"
                                options={customers.filter((c) => !eventForm.audience_targets.some((t) => t.target_kind === "USER" && t.user === c.customer_id))}
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
                                options={selectedProjectData?.towers?.filter((t) => !eventForm.audience_targets.some((target) => target.target_kind === "TOWER" && target.tower === t.id)) || []}
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

                              {/* Add Unit (Exclude) */}
                              <div className="col-span-2">
                                <MultiSelect
                                  label="Exclude Unit(s)"
                                  placeholder="Units"
                                  options={customers.filter((c) => c.unit?.id && !eventForm.audience_targets.some((t) => t.target_kind === "UNIT" && t.unit === c.unit?.id))}
                                  selectedValues={tempSelectedUnits}
                                  onApply={(values) => {
                                    if (values.length > 0) {
                                      addMultipleAudienceTargets("UNIT", values, true);
                                      setTempSelectedUnits([]);
                                    }
                                  }}
                                  disabled={loadingCustomers || customers.length === 0}
                                  getOptionLabel={(c) => `${c.unit?.label} - ${toTitleCase(c.customer_name)}`}
                                  getOptionValue={(c) => c.unit?.id}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Selected Targets */}
                          {eventForm.audience_targets.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-3">
                                Selected Targets
                              </label>
                              <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-accent/20">
                                {eventForm.audience_targets.map((target, idx) => {
                                  let label = "";
                                  let icon = null;
                                  if (target.target_kind === "ALL") {
                                    label = "All (Project)";
                                    icon = <Building2 className="w-4 h-4" />;
                                  } else if (target.target_kind === "GROUP" && target.group) {
                                    const group = groups.find((g) => g.id === target.group);
                                    label = group?.name || `Group ID: ${target.group}`;
                                    icon = <Users className="w-4 h-4" />;
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
                                    icon = <Building2 className="w-4 h-4" />;
                                  } else if (target.target_kind === "UNIT" && target.unit) {
                                    const customer = customers.find(
                                      (c) => c.unit?.id === target.unit
                                    );
                                    label = customer?.unit?.label || `Unit ID: ${target.unit}`;
                                    icon = <Building2 className="w-4 h-4" />;
                                  }

                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        target.exclude
                                          ? "bg-error-light/50 border-error"
                                          : "bg-card border-border"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {icon}
                                        <div className="flex flex-col">
                                          <span className={`text-sm font-medium ${
                                            target.exclude ? "text-error" : "text-foreground"
                                          }`}>
                                            {target.exclude && (
                                              <span className="font-bold mr-1">EXCLUDE:</span>
                                            )}
                                            {toTitleCase(target.target_kind)}
                                          </span>
                                          <span className={`text-xs ${
                                            target.exclude ? "text-error/70" : "text-muted-foreground"
                                          }`}>
                                            {toTitleCase(label)}
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
                      <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCreateEvent}
                        disabled={submitting}
                      >
                        {submitting 
                          ? (editingEvent ? "Updating..." : "Creating...") 
                          : (editingEvent ? "Update Event" : "Create Event")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
