import React, { useEffect, useMemo, useState } from "react";
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
  name: "",
  description: "",
  order: "",
  is_active: true,
};

const TemplateCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        "community/template-categories/"
      );
      // Handle both array response and paginated response
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response.data?.results) {
        setCategories(response.data.results);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load template categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        order: formData.order ? Number(formData.order) : 0,
        is_active: formData.is_active,
      };

      await axiosInstance.post("community/template-categories/", payload);
      toast.success("Template category created successfully");
      setFormData(defaultForm);
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to create template category"
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

  const filteredCategories = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((cat) => {
      const blob = [cat.name, cat.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [categories, search]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Name" },
      { key: "description", header: "Description", className: "dn-wrap" },
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
    []
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
                placeholder="Search categories..."
                wrapperClassName="search-box"
              />
            </div>
            <div className="list-header-right dn-header-actions">
              <button
                type="button"
                className="filter-btn"
                onClick={handleStartAdd}
                title="Add Template Category"
                disabled={loading}
              >
                Add Template Category
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Template Categories"
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
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((row, idx) => (
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
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-base font-semibold text-foreground">
                  Template Category Details
                </h3>
              </div>
              <form onSubmit={handleSubmit}>
                <FormGrid columns={2}>
                  <FormInput
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter category name"
                    required
                  />
                  <FormInput
                    label="Order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="Enter display order"
                  />
                  <FormInput
                    label="Description"
                    name="description"
                    type="textarea"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter category description"
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
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Category"}
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

export default TemplateCategoriesPage;

