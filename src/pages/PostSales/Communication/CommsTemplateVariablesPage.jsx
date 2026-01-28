import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
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

const defaultForm = {
  key: "",
  label: "",
  sample_value: "",
  is_active: true,
};

const TemplateVariablesPage = () => {
  const location = useLocation();
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "true", "false"
  const [openFilter, setOpenFilter] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    fetchVariables();
  }, [activeFilter]);

  useEffect(() => {
    if (showForm) {
      fetchKeys();
    }
  }, [showForm]);

  // Reset form when navigating to this page
  useEffect(() => {
    setShowForm(false);
    setFormData(defaultForm);
  }, [location.pathname]);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const response = await axiosInstance.get(
        "community/template-variables/keys/"
      );
      // Handle response format: {success: true, data: []}
      if (response.data?.data && Array.isArray(response.data.data)) {
        setKeys(response.data.data);
      } else if (Array.isArray(response.data)) {
        setKeys(response.data);
      } else {
        setKeys([]);
      }
    } catch (error) {
      console.error("Error fetching keys:", error);
      toast.error("Failed to load variable keys");
      setKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchVariables = async () => {
    setLoading(true);
    try {
      let url = "community/template-variables/";
      if (activeFilter !== "all") {
        url += `?active=${activeFilter}`;
      }

      const response = await axiosInstance.get(url);
      // Handle both array response and paginated response
      if (Array.isArray(response.data)) {
        setVariables(response.data);
      } else if (response.data?.results) {
        setVariables(response.data.results);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setVariables(response.data.data);
      } else {
        setVariables([]);
      }
    } catch (error) {
      console.error("Error fetching variables:", error);
      toast.error("Failed to load template variables");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      
      // Auto-populate label when key is selected
      if (name === "key" && value) {
        const selectedKeyObj = keys.find((k) => k.key === value);
        if (selectedKeyObj && !prev.label) {
          updated.label = selectedKeyObj.label;
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        key: formData.key,
        label: formData.label,
        sample_value: formData.sample_value,
        is_active: formData.is_active,
      };

      await axiosInstance.post("community/template-variables/", payload);
      toast.success("Template variable created successfully");
      setFormData(defaultForm);
      setShowForm(false);
      fetchVariables();
    } catch (error) {
      console.error("Error creating variable:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to create template variable"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(defaultForm);
    setShowForm(false);
  };

  const handleStartAdd = () => {
    setFormData(defaultForm);
    setShowForm(true);
  };

  const handleToggleActive = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await axiosInstance.patch(`community/template-variables/${id}/`, {
        is_active: !currentStatus,
      });
      toast.success(
        `Variable ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      fetchVariables();
    } catch (error) {
      console.error("Error toggling variable:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to update variable"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleFilterApply = () => {
    fetchVariables();
    setOpenFilter(false);
  };

  const handleFilterClear = () => {
    setActiveFilter("all");
    setOpenFilter(false);
  };

  const filteredVariables = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return variables;

    return variables.filter((varItem) => {
      const blob = [varItem.key, varItem.label, varItem.sample_value]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [variables, search]);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        header: "Actions",
        render: (_, row) => (
          <button
            type="button"
            onClick={() => handleToggleActive(row.id, row.is_active)}
            disabled={togglingId === row.id}
            className="dn-btn dn-btn-light"
            style={{ fontSize: 12, padding: "4px 12px" }}
          >
            {togglingId === row.id
              ? "Updating..."
              : row.is_active
              ? "Deactivate"
              : "Activate"}
          </button>
        ),
      },
      { key: "key", header: "Key" },
      { key: "label", header: "Label" },
      { key: "sample_value", header: "Sample Value" },
      {
        key: "is_active",
        header: "Status",
        render: (value, row) => (
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
    ],
    [togglingId]
  );

  return (
    <div className="demand-notes-page comms-template">
      {!showForm ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search variables..."
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
                title="Add Template Variable"
                disabled={loading}
              >
                Add Template Variable
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Template Variables"
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
                    {filteredVariables.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredVariables.map((row, idx) => (
                        <tr key={row.id ?? idx} className="dn-row">
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
                  <div className="dn-grid">
                    <div className="dn-field">
                      <label>Status</label>
                      <select
                        className="dn-select"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="dn-modal-footer">
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={handleFilterClear}
                  >
                    Clear
                  </button>
                  <button
                    className="dn-btn dn-btn-light"
                    onClick={() => setOpenFilter(false)}
                  >
                    Cancel
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
          ) : null}
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-base font-semibold text-foreground">
                  Template Variable Details
                </h3>
              </div>
              <form onSubmit={handleSubmit}>
                <FormGrid columns={2}>
                  <FormInput
                    label="Key"
                    name="key"
                    type="select"
                    value={formData.key}
                    onChange={handleChange}
                    placeholder="Select a key..."
                    required
                    options={[
                      { value: "", label: "Select a key..." },
                      ...keys.map((keyObj) => ({
                        value: keyObj.key,
                        label: keyObj.label || keyObj.key,
                      })),
                    ]}
                  />
                  <FormInput
                    label="Label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    placeholder="e.g., Booking ID"
                    required
                  />
                  <FormInput
                    label="Sample Value"
                    name="sample_value"
                    value={formData.sample_value}
                    onChange={handleChange}
                    placeholder="e.g., BK-10023"
                    className="col-span-2"
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
                    disabled={submitting || loadingKeys}
                  >
                    {submitting ? "Creating..." : "Create Variable"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateVariablesPage;

