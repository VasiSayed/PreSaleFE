import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { Eye, Plus, Calendar, X, Edit, Trash2 } from "lucide-react";
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

const defaultForm = {
  project: "",
  name: "",
  slug: "",
  order: 0,
  is_active: true,
};

export default function CommsEventTypesPage() {
  const location = useLocation();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [projects, setProjects] = useState([]);
  const [editingEventType, setEditingEventType] = useState(null);
  const [filterProject, setFilterProject] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchEventTypes();
    fetchProjects();
  }, []);

  // Reset form when navigating to this page
  useEffect(() => {
    setShowForm(false);
    setEditingEventType(null);
    setFormData(defaultForm);
  }, [location.pathname]);

  // Auto-select project if only one is available
  useEffect(() => {
    if (showForm && projects.length === 1 && !formData.project) {
      setFormData((prev) => ({
        ...prev,
        project: projects[0].id.toString(),
      }));
    }
  }, [projects, showForm, formData.project]);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) {
        params.append("project_id", filterProject);
      }
      if (activeFilter === "active") {
        params.append("active", "true");
      } else if (activeFilter === "inactive") {
        params.append("active", "false");
      }

      const response = await axiosInstance.get(
        `community/event-types/?${params.toString()}`
      );
      if (response.data?.results) {
        setEventTypes(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEventTypes(response.data);
      } else {
        setEventTypes([]);
      }
    } catch (error) {
      console.error("Error fetching event types:", error);
      toast.error("Failed to load event types");
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        project: Number(formData.project),
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        order: formData.order || 0,
        is_active: formData.is_active,
      };

      if (editingEventType) {
        await axiosInstance.patch(
          `community/event-types/${editingEventType.id}/`,
          payload
        );
        toast.success("Event type updated successfully");
      } else {
        await axiosInstance.post("community/event-types/", payload);
        toast.success("Event type created successfully");
      }

      setFormData(defaultForm);
      setEditingEventType(null);
      setShowForm(false);
      fetchEventTypes();
    } catch (error) {
      console.error("Error saving event type:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to save event type"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await axiosInstance.patch(`community/event-types/${id}/`, {
        is_active: !currentStatus,
      });
      toast.success(
        `Event type ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      fetchEventTypes();
    } catch (error) {
      console.error("Error toggling event type:", error);
      toast.error("Failed to update event type");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event type?")) {
      return;
    }
    try {
      await axiosInstance.delete(`community/event-types/${id}/`);
      toast.success("Event type deleted successfully");
      fetchEventTypes();
    } catch (error) {
      console.error("Error deleting event type:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to delete event type"
      );
    }
  };

  const handleEdit = (eventType) => {
    setFormData({
      project: eventType.project?.toString() || "",
      name: eventType.name || "",
      slug: eventType.slug || "",
      order: eventType.order || 0,
      is_active: eventType.is_active !== undefined ? eventType.is_active : true,
    });
    setEditingEventType(eventType);
    setShowForm(true);
  };

  const handleStartAdd = () => {
    setFormData(defaultForm);
    setEditingEventType(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData(defaultForm);
    setEditingEventType(null);
    setShowForm(false);
  };

  const handleApplyFilters = () => {
    fetchEventTypes();
    setOpenFilter(false);
  };

  const handleResetFilters = () => {
    setFilterProject("");
    setActiveFilter("all");
    fetchEventTypes();
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
              onClick={() => handleEdit(row)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleActive(row.id, row.is_active)}
              disabled={togglingId === row.id}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title={row.is_active ? "Deactivate" : "Activate"}
            >
              {togglingId === row.id ? (
                "..."
              ) : row.is_active ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto", color: "#dc2626" }}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
      { key: "name", header: "Name" },
      { key: "slug", header: "Slug", className: "dn-mono" },
      {
        key: "project",
        header: "Project",
        render: (value) => {
          const project = projects.find((p) => p.id === value);
          return toTitleCase(project?.name || `Project ${value}`);
        },
      },
      { key: "order", header: "Order" },
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
    [projects, togglingId]
  );

  const filteredEventTypes = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return eventTypes;

    return eventTypes.filter((et) => {
      const blob = [et.name, et.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [eventTypes, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search event types..."
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
                title="Add Event Type"
              >
                Add Event Type
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Event Types (Static)"
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
                  style={{ minWidth: 800, width: "100%" }}
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
                    {filteredEventTypes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredEventTypes.map((row, idx) => (
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
                      name="activeFilter"
                      type="select"
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      options={[
                        { value: "all", label: "All" },
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
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
          ) : null}
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {editingEventType ? "Edit Event Type" : "Create Event Type"}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <FormGrid columns={2}>
                <FormInput
                  label="Project"
                  name="project"
                  type="select"
                  value={formData.project}
                  onChange={handleChange}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
                <FormInput
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Maintenance"
                  required
                />
                <FormInput
                  label="Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g., maintenance"
                  className="col-span-2"
                  required
                />
                <FormInput
                  label="Order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="0"
                />
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      Is Active
                    </span>
                  </label>
                </div>
              </FormGrid>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting
                    ? editingEventType
                      ? "Updating..."
                      : "Creating..."
                    : editingEventType
                    ? "Update Event Type"
                    : "Create Event Type"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
