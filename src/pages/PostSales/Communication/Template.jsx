import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import {
  Upload,
  X,
  Smartphone,
  Monitor,
  Eye,
  Plus,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import SearchBar from "../../../common/SearchBar";
import "./Template.css";
import "../../PostSales/Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";
import "../../PostSales/Financial/PaymentReceipts.css";

const toTitleCase = (value) => {
  if (value === null || value === undefined) return value;
  const s = String(value).trim();
  if (!s) return s;
  // Handle multi-word strings by capitalizing first letter of each word
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

const DataTable = ({ columns = [], data = [] }) => (
  <div style={{ overflowX: "auto" }}>
    <table
      className="booking-table dn-subtable"
      style={{ minWidth: 800, width: "100%" }}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key || col.header}>{toTitleCase(col.header)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length || 1} className="booking-empty-row">
              No records found.
            </td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr key={row.id ?? idx}>
              {columns.map((col) => (
                <td key={col.key || col.header}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : toTitleCase(row[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const defaultForm = {
  name: "",
  description: "",
  categories: [],
  send_via: [],
  subject: "",
  body: "",
  header_image: null,
  background_image: null,
  is_active: true,
};

const TemplateSections = () => {
  const location = useLocation();
  const [previewDevice, setPreviewDevice] = useState("mobile");
  const [templateForm, setTemplateForm] = useState(defaultForm);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // API data
  const [templateVariables, setTemplateVariables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]); // For creation form
  const [showMapProjects, setShowMapProjects] = useState(false);
  const [mappingTemplateId, setMappingTemplateId] = useState(null);
  const [mappedProjects, setMappedProjects] = useState([]);
  const [projectMappingStatus, setProjectMappingStatus] = useState({}); // { projectId: { isEnabled: boolean, isMapped: boolean } }

  useEffect(() => {
    fetchTemplates();
    fetchTemplateVariables();
    fetchCategories();
    fetchProjects();
  }, []);

  // Reset form when navigating to this page
  useEffect(() => {
    setShowForm(false);
    setTemplateForm(defaultForm);
    setSelectedProjects([]);
    setShowMapProjects(false);
    setMappingTemplateId(null);
  }, [location.pathname]);

  // Auto-select category if only one is available
  useEffect(() => {
    if (showForm && categories.length === 1 && templateForm.categories.length === 0) {
      setTemplateForm((prev) => ({
        ...prev,
        categories: [categories[0].id],
      }));
    }
  }, [categories, showForm, templateForm.categories.length]);

  // Auto-fetch mapped projects when modal opens
  useEffect(() => {
    if (showMapProjects && mappingTemplateId && projects.length > 0) {
      fetchMappedProjects(mappingTemplateId);
    }
  }, [showMapProjects, mappingTemplateId, projects.length]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("community/message-templates/");
      if (response.data?.results) {
        setTemplates(response.data.results);
      } else if (Array.isArray(response.data)) {
        setTemplates(response.data);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
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

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("community/template-categories/");
      let cats = [];
      if (Array.isArray(response.data)) {
        cats = response.data;
      } else if (response.data?.results) {
        cats = response.data.results;
      }
      setCategories(cats.filter((c) => c.is_active));
    } catch (error) {
      console.error("Error fetching categories:", error);
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

  const fetchMappedProjects = async (templateId) => {
    try {
      const response = await axiosInstance.get(
        `community/message-templates/${templateId}/projects/`
      );
      if (response.data?.data) {
        setMappedProjects(response.data.data);
        
        // Create a mapping status object for all projects
        const statusMap = {};
        projects.forEach((project) => {
          const mapped = response.data.data.find((m) => m.project_id === project.id);
          statusMap[project.id] = {
            isEnabled: mapped?.is_enabled || false,
            isMapped: !!mapped,
          };
        });
        setProjectMappingStatus(statusMap);
        
        // Set selected projects to all mapped project IDs (regardless of enabled status)
        setSelectedProjects(response.data.data.map((p) => p.project_id));
      } else {
        // No mapped projects, initialize all as disabled
        const statusMap = {};
        projects.forEach((project) => {
          statusMap[project.id] = {
            isEnabled: false,
            isMapped: false,
          };
        });
        setProjectMappingStatus(statusMap);
        setSelectedProjects([]);
      }
    } catch (error) {
      console.error("Error fetching mapped projects:", error);
      toast.error("Failed to load mapped projects");
      // Initialize all projects as disabled on error
      const statusMap = {};
      projects.forEach((project) => {
        statusMap[project.id] = {
          isEnabled: false,
          isMapped: false,
        };
      });
      setProjectMappingStatus(statusMap);
      setSelectedProjects([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "categories" || name === "send_via") {
      // Handle multi-select
      const selectedOptions = Array.from(e.target.selectedOptions, (opt) =>
        name === "categories" ? Number(opt.value) : opt.value
      );
      setTemplateForm((prev) => ({ ...prev, [name]: selectedOptions }));
    } else {
      setTemplateForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "header") {
      setTemplateForm((prev) => ({ ...prev, header_image: file }));
    } else if (type === "background") {
      setTemplateForm((prev) => ({ ...prev, background_image: file }));
    }
  };

  const removeImage = (type) => {
    if (type === "header") {
      setTemplateForm((prev) => ({ ...prev, header_image: null }));
    } else if (type === "background") {
      setTemplateForm((prev) => ({ ...prev, background_image: null }));
    }
  };

  // Replace {{variable}} with variable IDs
  const replaceVariablesWithIds = (text) => {
    if (!text || !templateVariables.length) return text;
    
    let result = text;
    templateVariables.forEach((variable) => {
      const pattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, "g");
      result = result.replace(pattern, `{{${variable.id}}}`);
    });
    
    return result;
  };

  const insertMergeTag = (variable) => {
    const tag = `{{${variable.key}}}`;
    setTemplateForm((prev) => ({
      ...prev,
      body: `${prev.body}${tag}`,
    }));
  };

  const renderPreviewContent = () => {
    let content = templateForm.body || "Your message will appear here...";
    // Replace variables with sample values for preview
    templateVariables.forEach((variable) => {
      // Handle both {{key}} and {{id}} formats
      const keyPattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, "g");
      const idPattern = new RegExp(`\\{\\{${variable.id}\\}\\}`, "g");
      const sampleValue = variable.sample_value || variable.key;
      content = content.replace(keyPattern, sampleValue);
      content = content.replace(idPattern, sampleValue);
    });
    return content;
  };

  const renderPreviewSubject = () => {
    let subject = templateForm.subject || "";
    templateVariables.forEach((variable) => {
      const keyPattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, "g");
      const idPattern = new RegExp(`\\{\\{${variable.id}\\}\\}`, "g");
      const sampleValue = variable.sample_value || variable.key;
      subject = subject.replace(keyPattern, sampleValue);
      subject = subject.replace(idPattern, sampleValue);
    });
    return subject;
  };

  const handleCreateTemplate = async () => {
    setSubmitting(true);
    try {
      const hasImages = templateForm.header_image || templateForm.background_image;
      const shouldMapProjects = selectedProjects.length > 0;

      // If images are present, use regular creation API (FormData required)
      // Then map projects separately if needed
      if (hasImages) {
        const formDataToSend = new FormData();
        
        formDataToSend.append("name", templateForm.name);
        formDataToSend.append("description", templateForm.description || "");
        formDataToSend.append("subject", replaceVariablesWithIds(templateForm.subject || ""));
        formDataToSend.append("body", replaceVariablesWithIds(templateForm.body || ""));
        formDataToSend.append("is_active", templateForm.is_active);
        
        // Append categories as array
        templateForm.categories.forEach((catId) => {
          formDataToSend.append("categories", catId);
        });
        
        // Append send_via as JSON string (backend expects JSON)
        formDataToSend.append("send_via", JSON.stringify(templateForm.send_via));
        
        // Append images
        if (templateForm.header_image) {
          formDataToSend.append("header_image", templateForm.header_image);
        }
        if (templateForm.background_image) {
          formDataToSend.append("background_image", templateForm.background_image);
        }

        const response = await axiosInstance.post(
          "community/message-templates/",
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const templateId = response.data?.id;

        // Map projects if enabled
        if (shouldMapProjects && templateId) {
          try {
            await axiosInstance.post(
              `community/message-templates/${templateId}/map-projects/`,
              {
                project_ids: selectedProjects,
                is_enabled: true,
                overrides: {},
              }
            );
            toast.success(
              `Template created and mapped to ${selectedProjects.length} project(s) successfully`
            );
          } catch (mapError) {
            console.error("Error mapping projects:", mapError);
            toast.success("Template created successfully, but project mapping failed");
          }
        } else {
          toast.success("Template created successfully");
        }
      } 
      // If no images and mapping enabled, use bulk API
      else if (shouldMapProjects) {
        const templatePayload = {
          name: templateForm.name,
          description: templateForm.description || "",
          subject: replaceVariablesWithIds(templateForm.subject || ""),
          body: replaceVariablesWithIds(templateForm.body || ""),
          send_via: templateForm.send_via,
          categories: templateForm.categories,
          is_active: templateForm.is_active,
          map_enabled: true,
          project_ids: selectedProjects,
          overrides: {},
        };

        const response = await axiosInstance.post(
          "community/message-templates/bulk/",
          {
            templates: [templatePayload],
          }
        );

        if (response.data?.success) {
          const result = response.data.data?.results?.[0];
          if (result?.ok) {
            toast.success(
              `Template created and mapped to ${result.mappings?.length || 0} project(s) successfully`
            );
          } else {
            toast.success("Template created successfully");
          }
        } else {
          toast.success("Template created successfully");
        }
      } 
      // Regular single template creation (no mapping, no images)
      else {
        const formDataToSend = new FormData();
        
        formDataToSend.append("name", templateForm.name);
        formDataToSend.append("description", templateForm.description || "");
        formDataToSend.append("subject", replaceVariablesWithIds(templateForm.subject || ""));
        formDataToSend.append("body", replaceVariablesWithIds(templateForm.body || ""));
        formDataToSend.append("is_active", templateForm.is_active);
        
        // Append categories as array
        templateForm.categories.forEach((catId) => {
          formDataToSend.append("categories", catId);
        });
        
        // Append send_via as JSON string (backend expects JSON)
        formDataToSend.append("send_via", JSON.stringify(templateForm.send_via));

        await axiosInstance.post(
          "community/message-templates/",
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Template created successfully");
      }

      setTemplateForm(defaultForm);
      setSelectedProjects([]);
      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to create template"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMapProjects = async () => {
    if (!mappingTemplateId) {
      toast.error("Template ID is missing");
      return;
    }

    // Get all project IDs that are enabled
    const enabledProjectIds = Object.keys(projectMappingStatus)
      .filter((projectId) => projectMappingStatus[projectId]?.isEnabled)
      .map((id) => Number(id));

    if (enabledProjectIds.length === 0) {
      toast.error("Please enable at least one project");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post(
        `community/message-templates/${mappingTemplateId}/map-projects/`,
        {
          project_ids: enabledProjectIds,
          is_enabled: true,
          overrides: {},
        }
      );
      toast.success(`Projects mapped successfully (${enabledProjectIds.length} project(s))`);
      setShowMapProjects(false);
      setMappingTemplateId(null);
      setProjectMappingStatus({});
      setSelectedProjects([]);
      fetchTemplates(); // Refresh the templates list
    } catch (error) {
      console.error("Error mapping projects:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to map projects"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Replace {{id}} with {{key}} for editing (reverse of replaceVariablesWithIds)
  const replaceIdsWithKeys = (text) => {
    if (!text || !templateVariables.length) return text;
    
    let result = text;
    templateVariables.forEach((variable) => {
      const idPattern = new RegExp(`\\{\\{${variable.id}\\}\\}`, "g");
      result = result.replace(idPattern, `{{${variable.key}}}`);
    });
    
    return result;
  };

  const handleViewTemplate = (template) => {
    setTemplateForm({
      name: template.name || "",
      description: template.description || "",
      categories: template.categories || [],
      send_via: template.send_via || [],
      subject: replaceIdsWithKeys(template.subject || ""),
      body: replaceIdsWithKeys(template.body || ""),
      header_image: template.header_image || null,
      background_image: template.background_image || null,
      is_active: template.is_active !== undefined ? template.is_active : true,
    });
    setShowForm(true);
  };

  const handleOpenMapProjects = (templateId) => {
    setMappingTemplateId(templateId);
    setShowMapProjects(true);
    // Fetch mapped projects will be called automatically via useEffect when modal opens
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
              onClick={() => handleViewTemplate(row)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 12px" }}
            >
              <Eye className="w-4 h-4" style={{ marginRight: 4 }} />
              View
            </button>
            <button
              type="button"
              onClick={() => handleOpenMapProjects(row.id)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 12px" }}
            >
              Map Projects
            </button>
          </div>
        ),
      },
      { key: "name", header: "Template Name" },
      { key: "description", header: "Description", className: "dn-wrap" },
      {
        key: "categories",
        header: "Categories",
        render: (value) => {
          if (!value || !Array.isArray(value)) return "-";
          const categoryNames = value
            .map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              return cat ? cat.name : `Category ${catId}`;
            })
            .join(", ");
          return toTitleCase(categoryNames || "-");
        },
      },
      {
        key: "send_via",
        header: "Send Via",
        render: (value) => {
          if (!value || !Array.isArray(value)) return "-";
          return toTitleCase(value.join(", "));
        },
      },
      {
        key: "is_active",
        header: "Status",
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              value
                ? "bg-success-light text-success"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {toTitleCase(value ? "Active" : "Inactive")}
          </span>
        ),
      },
      { key: "created_at", header: "Created On" },
    ],
    [categories]
  );

  const handleStartAdd = () => {
    setTemplateForm(defaultForm);
    setSelectedProjects([]);
    setShowForm(true);
  };

  const handleCancel = () => {
    setTemplateForm(defaultForm);
    setShowForm(false);
    setShowMapProjects(false);
    setMappingTemplateId(null);
    setSelectedProjects([]);
    setMapEnabled(false);
  };

  const filteredTemplates = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return templates;

    return templates.filter((t) => {
      const blob = [
        t.name,
        t.description,
        t.subject,
        t.body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [templates, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search templates..."
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
                title="Add Template"
              >
                Add Template
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Templates (Static)"
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
                  style={{ minWidth: 900, width: "100%" }}
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
                    {filteredTemplates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((row, idx) => (
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
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    No filters available.
                  </div>
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={() => setOpenFilter(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="dn-btn dn-btn-primary"
                    onClick={() => setOpenFilter(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="template-form-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Template Details
                </h3>
              </div>
              <FormGrid columns={2}>
                <FormInput
                  label="Template Name"
                  name="name"
                  value={templateForm.name}
                  onChange={handleChange}
                  placeholder="Welcome Email"
                  required
                />
                <FormInput
                  label="Description"
                  name="description"
                  value={templateForm.description}
                  onChange={handleChange}
                  placeholder="Template description"
                />
                <div className="col-span-2">
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Categories *
                  </label>
                  <div className="w-full min-h-11 rounded-lg border border-border bg-transparent px-3 py-2 max-h-40 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No categories available. Please create categories first.
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={templateForm.categories.includes(cat.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  categories: [...prev.categories, cat.id],
                                }));
                              } else {
                                setTemplateForm((prev) => ({
                                  ...prev,
                                  categories: prev.categories.filter(
                                    (id) => id !== cat.id
                                  ),
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="text-sm text-foreground">
                            {toTitleCase(cat.name)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Send Via *
                  </label>
                  <div className="w-full min-h-11 rounded-lg border border-border bg-transparent px-3 py-2 max-h-40 overflow-y-auto">
                    {[
                      { value: "WHATSAPP", label: "WhatsApp" },
                      { value: "EMAIL", label: "Email" },
                      { value: "NOTIFICATION", label: "Notification" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={templateForm.send_via.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTemplateForm((prev) => ({
                                ...prev,
                                send_via: [...prev.send_via, option.value],
                              }));
                            } else {
                              setTemplateForm((prev) => ({
                                ...prev,
                                send_via: prev.send_via.filter(
                                  (v) => v !== option.value
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">
                          {toTitleCase(option.label)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={templateForm.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      Is Active
                    </span>
                  </label>
                </div>
              </FormGrid>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Content
                </h3>
              </div>
              <div className="space-y-4">
                <FormInput
                  label="Subject Line"
                  name="subject"
                  value={templateForm.subject}
                  onChange={handleChange}
                  placeholder="Enter email subject"
                />
                <FormInput
                  label="Message Body"
                  name="body"
                  type="textarea"
                  rows={6}
                  value={templateForm.body}
                  onChange={handleChange}
                  placeholder="Write your message here. Use {{variable_key}} for variables."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Character Count</span>
                  <span>{templateForm.body.length} chars</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Media
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Header Image
                  </label>
                  {templateForm.header_image ? (
                    <div className="relative">
                      <img
                        src={
                          typeof templateForm.header_image === "string"
                            ? templateForm.header_image
                            : URL.createObjectURL(templateForm.header_image)
                        }
                        alt="Header"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage("header")}
                        className="absolute top-2 right-2 bg-error text-white p-1.5 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload header image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "header")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Background Image
                  </label>
                  {templateForm.background_image ? (
                    <div className="relative">
                      <img
                        src={
                          typeof templateForm.background_image === "string"
                            ? templateForm.background_image
                            : URL.createObjectURL(templateForm.background_image)
                        }
                        alt="Background"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage("background")}
                        className="absolute top-2 right-2 bg-error text-white p-1.5 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload background image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "background")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Personalization
                </h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Available Merge Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {templateVariables.map((variable) => (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => insertMergeTag(variable)}
                      className="px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                      title={`${variable.label} ({{${variable.key}}})`}
                    >
                      {variable.label || variable.key}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click any tag to insert it into your message body. Tags will be inserted as {`{{variable_key}}`} format.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Project Mapping
                </h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Toggle projects to map this template to:
                </p>
                <div className="w-full min-h-11 rounded-lg border border-border bg-transparent px-3 py-2 max-h-64 overflow-y-auto">
                  {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No projects available.
                    </p>
                  ) : (
                    projects.map((project) => {
                      const isSelected = selectedProjects.includes(project.id);
                      return (
                        <div
                          key={project.id}
                          className="flex items-center justify-between py-2 hover:bg-accent/50 rounded cursor-pointer border-b border-border last:border-b-0"
                        >
                          <span className="text-sm text-foreground flex-1">
                            {toTitleCase(project.name)}
                          </span>
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
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProjects((prev) => [
                                    ...prev,
                                    project.id,
                                  ]);
                                } else {
                                  setSelectedProjects((prev) =>
                                    prev.filter((id) => id !== project.id)
                                  );
                                }
                              }}
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                            />
                            <div
                              style={{
                                width: 44,
                                height: 24,
                                backgroundColor: isSelected ? "#3b82f6" : "#e5e7eb",
                                borderRadius: 12,
                                position: "relative",
                                transition: "background-color 0.2s",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 2,
                                  left: isSelected ? 22 : 2,
                                  width: 20,
                                  height: 20,
                                  backgroundColor: "#fff",
                                  borderRadius: "50%",
                                  transition: "left 0.2s",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedProjects.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedProjects.length} project(s) enabled
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleCreateTemplate}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Save Template"}
              </Button>
            </div>
          </div>

          <div className="template-preview-sticky">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Live Preview
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`template-device-btn ${
                      previewDevice === "mobile" ? "active" : ""
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`template-device-btn ${
                      previewDevice === "desktop" ? "active" : ""
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className={`mx-auto w-full transition-all ${
                  previewDevice === "mobile"
                    ? "max-w-[280px]"
                    : "max-w-[520px]"
                }`}
              >
                <div
                  className={`border-8 border-slate-900 shadow-2xl overflow-hidden ${
                    previewDevice === "mobile" ? "rounded-3xl" : "rounded-2xl"
                  }`}
                >
                  {previewDevice === "mobile" && (
                    <div className="bg-slate-900 h-6 flex items-center justify-center">
                      <div className="bg-black w-20 h-3 rounded-full" />
                    </div>
                  )}
                  {previewDevice === "desktop" && (
                    <div className="bg-slate-900 h-7 flex items-center gap-2 px-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-error" />
                      <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                      <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    </div>
                  )}

                  <div
                    className={`bg-white overflow-y-auto ${
                      previewDevice === "mobile" ? "h-[500px]" : "h-[420px]"
                    }`}
                  >
                    {templateForm.header_image && (
                      <img
                        src={
                          typeof templateForm.header_image === "string"
                            ? templateForm.header_image
                            : URL.createObjectURL(templateForm.header_image)
                        }
                        alt="Header"
                        className="w-full h-32 object-cover"
                      />
                    )}

                    <div className="p-4 space-y-3">
                      {templateForm.subject && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Subject
                          </div>
                          <div className="font-semibold text-sm text-foreground">
                            {renderPreviewSubject()}
                          </div>
                        </div>
                      )}

                      {templateForm.subject && (
                        <div className="border-t border-border my-3" />
                      )}

                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {renderPreviewContent()}
                      </div>

                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          {"\u00A9"} 2026 {templateForm.name || "Your Company"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {previewDevice === "mobile" && (
                    <div className="bg-slate-900 h-1.5" />
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Updates in real time
              </p>
            </div>
          </div>
        </div>
      )}

      {showMapProjects ? (
        <div
          className="dn-modal-overlay"
          onMouseDown={() => {
            setShowMapProjects(false);
            setMappingTemplateId(null);
            setSelectedProjects([]);
            setProjectMappingStatus({});
          }}
        >
          <div
            className="dn-modal dn-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">Map Projects</div>
              </div>
              <button
                className="dn-close-btn"
                onClick={() => {
                  setShowMapProjects(false);
                  setMappingTemplateId(null);
                  setSelectedProjects([]);
                  setProjectMappingStatus({});
                }}
              >
                ×
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Map Projects (Toggle to enable/disable)
                  </label>
                  <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-3">
                    {projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No projects available.
                      </p>
                    ) : (
                      projects.map((project) => {
                        const status = projectMappingStatus[project.id] || {
                          isEnabled: false,
                          isMapped: false,
                        };
                        return (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 hover:bg-accent/50 rounded cursor-pointer border-b border-border last:border-b-0"
                          >
                            <span className="text-sm text-foreground flex-1">
                              {toTitleCase(project.name)}
                            </span>
                            <div className="flex items-center gap-3">
                              {status.isMapped && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    status.isEnabled
                                      ? "bg-success-light text-success"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {status.isEnabled ? "Enabled" : "Disabled"}
                                </span>
                              )}
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
                                  checked={status.isEnabled}
                                  onChange={(e) => {
                                    setProjectMappingStatus((prev) => ({
                                      ...prev,
                                      [project.id]: {
                                        isEnabled: e.target.checked,
                                        isMapped: e.target.checked || status.isMapped,
                                      },
                                    }));
                                    // Update selected projects list
                                    if (e.target.checked) {
                                      if (!selectedProjects.includes(project.id)) {
                                        setSelectedProjects((prev) => [
                                          ...prev,
                                          project.id,
                                        ]);
                                      }
                                    }
                                  }}
                                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                                />
                                <div
                                  style={{
                                    width: 44,
                                    height: 24,
                                    backgroundColor: status.isEnabled ? "#3b82f6" : "#e5e7eb",
                                    borderRadius: 12,
                                    position: "relative",
                                    transition: "background-color 0.2s",
                                    cursor: "pointer",
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 2,
                                      left: status.isEnabled ? 22 : 2,
                                      width: 20,
                                      height: 20,
                                      backgroundColor: "#fff",
                                      borderRadius: "50%",
                                      transition: "left 0.2s",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                    }}
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {Object.values(projectMappingStatus).filter((s) => s.isEnabled).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {Object.values(projectMappingStatus).filter((s) => s.isEnabled).length} project(s) enabled
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={() => {
                  setShowMapProjects(false);
                  setMappingTemplateId(null);
                  setSelectedProjects([]);
                  setProjectMappingStatus({});
                }}
              >
                Cancel
              </button>
              <button
                className="dn-btn dn-btn-primary"
                onClick={handleMapProjects}
                disabled={
                  submitting ||
                  Object.values(projectMappingStatus).filter((s) => s.isEnabled).length === 0
                }
              >
                {submitting ? "Updating..." : "Update Mapping"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TemplateSections;

