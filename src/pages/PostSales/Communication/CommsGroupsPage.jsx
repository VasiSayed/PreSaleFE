import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { Eye, Plus, Users, X, Edit, Trash2, UserPlus } from "lucide-react";
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
  project_id: "",
  name: "",
  description: "",
  visibility: "PRIVATE",
  join_policy: "REQUEST",
  is_active: true,
  add_members: [],
};

export default function CommsGroupsPage() {
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [groupForm, setGroupForm] = useState(defaultForm);
  const [projects, setProjects] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMembers, setNewMembers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  useEffect(() => {
    fetchGroups();
    fetchProjects();
  }, []);

  // Reset form when navigating to this page
  useEffect(() => {
    setShowForm(false);
    setEditingGroup(null);
    setShowMembers(false);
    setGroupForm(defaultForm);
  }, [location.pathname]);

  // Auto-select project if only one is available
  useEffect(() => {
    if (showForm && projects.length === 1 && !groupForm.project_id) {
      setGroupForm((prev) => ({
        ...prev,
        project_id: projects[0].id.toString(),
      }));
    }
  }, [projects, showForm, groupForm.project_id]);

  // Fetch customers when project is selected
  useEffect(() => {
    if (groupForm.project_id && showForm && !editingGroup) {
      fetchCustomers(groupForm.project_id);
    } else {
      setCustomers([]);
      setSelectedCustomers([]);
    }
  }, [groupForm.project_id, showForm, editingGroup]);

  // Refetch customers when tower/floor/unit filters change (not search - that's local)
  useEffect(() => {
    if (groupForm.project_id && showForm && !editingGroup) {
      fetchCustomers(groupForm.project_id);
    }
  }, [selectedTower, selectedFloor, selectedUnit]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("community/groups/");
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

  const fetchMembers = async (groupId) => {
    try {
      const response = await axiosInstance.get(
        `community/groups/${groupId}/members/`
      );
      if (response.data?.results) {
        setMembers(response.data.results);
      } else if (Array.isArray(response.data)) {
        setMembers(response.data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  };

  const fetchCustomers = async (projectId, page = 1) => {
    if (!projectId) return;
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        only_names_unit: "1",
        page: page.toString(),
        page_size: "100",
      });
      if (customerSearch) {
        params.append("search", customerSearch);
      }
      if (selectedTower) {
        params.append("tower_id", selectedTower);
      }
      if (selectedFloor) {
        params.append("floor_id", selectedFloor);
      }
      if (selectedUnit) {
        params.append("unit_id", selectedUnit);
      }

      const response = await axiosInstance.get(
        `financial/demand-notes/project-customers/?${params.toString()}`
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGroupForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Reset filters when project changes
    if (name === "project_id") {
      setSelectedTower("");
      setSelectedFloor("");
      setSelectedUnit("");
      setCustomerSearch("");
      setSelectedCustomers([]);
    }
  };

  // Get unique towers, floors, units from customers
  const uniqueTowers = useMemo(() => {
    const towers = new Map();
    customers.forEach((c) => {
      if (c.tower?.id) {
        towers.set(c.tower.id, c.tower.name);
      }
    });
    return Array.from(towers.entries()).map(([id, name]) => ({ id, name }));
  }, [customers]);

  const uniqueFloors = useMemo(() => {
    const floors = new Map();
    customers.forEach((c) => {
      if (c.floor?.id && (!selectedTower || c.tower?.id === Number(selectedTower))) {
        floors.set(c.floor.id, c.floor.label);
      }
    });
    return Array.from(floors.entries()).map(([id, label]) => ({ id, label }));
  }, [customers, selectedTower]);

  const uniqueUnits = useMemo(() => {
    const units = new Map();
    customers.forEach((c) => {
      if (c.unit?.id && (!selectedTower || c.tower?.id === Number(selectedTower)) && (!selectedFloor || c.floor?.id === Number(selectedFloor))) {
        units.set(c.unit.id, c.unit.label);
      }
    });
    return Array.from(units.entries()).map(([id, label]) => ({ id, label }));
  }, [customers, selectedTower, selectedFloor]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedTower && c.tower?.id !== Number(selectedTower)) return false;
      if (selectedFloor && c.floor?.id !== Number(selectedFloor)) return false;
      if (selectedUnit && c.unit?.id !== Number(selectedUnit)) return false;
      if (customerSearch) {
        const search = customerSearch.toLowerCase();
        return (
          c.customer_name?.toLowerCase().includes(search) ||
          c.unit?.label?.toLowerCase().includes(search) ||
          c.tower?.name?.toLowerCase().includes(search) ||
          c.floor?.label?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [customers, selectedTower, selectedFloor, selectedUnit, customerSearch]);

  const handleCreateGroup = async () => {
    setSubmitting(true);
    try {
      const payload = {
        project_id: Number(groupForm.project_id),
        name: groupForm.name,
        description: groupForm.description || "",
        visibility: groupForm.visibility,
        join_policy: groupForm.join_policy,
        is_active: groupForm.is_active,
      };

      // Add selected customers as members
      if (selectedCustomers.length > 0) {
        payload.add_members = selectedCustomers.map((customerId) => ({
          user_id: customerId,
          role: "MEMBER",
        }));
      }

      await axiosInstance.post("community/groups/", payload);
      toast.success("Group created successfully");
      setGroupForm(defaultForm);
      setSelectedCustomers([]);
      setShowForm(false);
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to create group"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`community/groups/${editingGroup.id}/`, {
        name: groupForm.name,
        description: groupForm.description || "",
        visibility: groupForm.visibility,
        join_policy: groupForm.join_policy,
        is_active: groupForm.is_active,
      });
      toast.success("Group updated successfully");
      setGroupForm(defaultForm);
      setEditingGroup(null);
      setShowForm(false);
      fetchGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to update group"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }
    try {
      await axiosInstance.delete(`community/groups/${groupId}/`);
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to delete group"
      );
    }
  };

  const handleViewGroup = (group) => {
    setGroupForm({
      project_id: group.project_id || "",
      name: group.name || "",
      description: group.description || "",
      visibility: group.visibility || "PRIVATE",
      join_policy: group.join_policy || "REQUEST",
      is_active: group.is_active !== undefined ? group.is_active : true,
      add_members: [],
    });
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEditGroup = (group) => {
    setGroupForm({
      project_id: group.project_id || "",
      name: group.name || "",
      description: group.description || "",
      visibility: group.visibility || "PRIVATE",
      join_policy: group.join_policy || "REQUEST",
      is_active: group.is_active !== undefined ? group.is_active : true,
      add_members: [],
    });
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleOpenMembers = (groupId) => {
    setSelectedGroupId(groupId);
    setShowMembers(true);
    fetchMembers(groupId);
  };

  const handleAddMembers = async () => {
    if (!selectedGroupId || newMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `community/groups/${selectedGroupId}/add-members/`,
        {
          members: newMembers,
        }
      );
      toast.success("Members added successfully");
      setNewMembers([]);
      fetchMembers(selectedGroupId);
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to add members"
      );
    } finally {
      setSubmitting(false);
    }
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
              onClick={() => handleViewGroup(row)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title="View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleEditGroup(row)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenMembers(row.id)}
              className="dn-btn dn-btn-light"
              style={{ fontSize: 12, padding: "4px 8px", minWidth: "auto" }}
              title="Members"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteGroup(row.id)}
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
      {
        key: "project_id",
        header: "Project",
        render: (value) => {
          const project = projects.find((p) => p.id === value);
          return toTitleCase(project?.name || `Project ${value}`);
        },
      },
      {
        key: "visibility",
        header: "Visibility",
        render: (value) => toTitleCase(value || "-"),
      },
      {
        key: "join_policy",
        header: "Join Policy",
        render: (value) => toTitleCase(value || "-"),
      },
      { key: "description", header: "Description", className: "dn-wrap" },
      {
        key: "members_count",
        header: "Members",
        render: (value) => value || 0,
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
    [projects]
  );

  const handleStartAdd = () => {
    setGroupForm(defaultForm);
    setEditingGroup(null);
    setSelectedCustomers([]);
    setCustomerSearch("");
    setSelectedTower("");
    setSelectedFloor("");
    setSelectedUnit("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setGroupForm(defaultForm);
    setEditingGroup(null);
    setShowForm(false);
    setShowMembers(false);
    setSelectedGroupId(null);
    setNewMembers([]);
    setSelectedCustomers([]);
    setCustomerSearch("");
    setSelectedTower("");
    setSelectedFloor("");
    setSelectedUnit("");
  };

  const filteredGroups = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return groups;

    return groups.filter((g) => {
      const blob = [g.name, g.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [groups, search]);

  return (
    <div className="demand-notes-page comms-template">
      {!showForm && !showMembers ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search groups..."
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
                title="Add Group"
              >
                Add Group
              </button>

              <button
                type="button"
                className="filter-btn demand-filter-btn"
                title="Groups (Static)"
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
                    {filteredGroups.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length || 1}
                          className="booking-empty-row"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((row, idx) => (
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
      ) : showMembers ? (
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <h2>Group Members</h2>
            </div>
            <div className="list-header-right dn-header-actions">
              <button
                type="button"
                className="filter-btn"
                onClick={handleCancel}
              >
                Back
              </button>
            </div>
          </div>

          <div className="booking-table-wrapper pr-table-wrap">
            <div style={{ overflowX: "auto" }}>
              <table
                className="booking-table dn-subtable"
                style={{ minWidth: 600, width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined At</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="booking-empty-row">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="dn-row">
                        <td>{toTitleCase(member.name || "-")}</td>
                        <td>{member.email || "-"}</td>
                        <td>{toTitleCase(member.role || "-")}</td>
                        <td>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              member.is_active
                                ? "bg-success-light text-success"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {toTitleCase(member.is_active ? "Active" : "Inactive")}
                          </span>
                        </td>
                        <td>
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {editingGroup ? "Edit Group" : "Create Group"}
                </h3>
              </div>
              <FormGrid columns={2}>
                <FormInput
                  label="Project"
                  name="project_id"
                  type="select"
                  value={groupForm.project_id}
                  onChange={handleChange}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
                <FormInput
                  label="Group Name"
                  name="name"
                  value={groupForm.name}
                  onChange={handleChange}
                  placeholder="Enter group name"
                  required
                />
                <FormInput
                  label="Description"
                  name="description"
                  type="textarea"
                  rows={3}
                  value={groupForm.description}
                  onChange={handleChange}
                  placeholder="Enter group description"
                  className="col-span-2"
                />
                <FormInput
                  label="Visibility"
                  name="visibility"
                  type="select"
                  value={groupForm.visibility}
                  onChange={handleChange}
                  options={[
                    { value: "PUBLIC", label: "Public" },
                    { value: "PRIVATE", label: "Private" },
                  ]}
                  required
                />
                <FormInput
                  label="Join Policy"
                  name="join_policy"
                  type="select"
                  value={groupForm.join_policy}
                  onChange={handleChange}
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "REQUEST", label: "Request" },
                    { value: "INVITE", label: "Invite" },
                  ]}
                  required
                />
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={groupForm.is_active}
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

            {!editingGroup && groupForm.project_id && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Add Members
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">
                        Search
                      </label>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search by name, unit..."
                        className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">
                        Tower
                      </label>
                      <select
                        value={selectedTower}
                        onChange={(e) => {
                          setSelectedTower(e.target.value);
                          setSelectedFloor("");
                          setSelectedUnit("");
                        }}
                        className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
                      >
                        <option value="">All Towers</option>
                        {uniqueTowers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {toTitleCase(t.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">
                        Floor
                      </label>
                      <select
                        value={selectedFloor}
                        onChange={(e) => {
                          setSelectedFloor(e.target.value);
                          setSelectedUnit("");
                        }}
                        className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
                        disabled={!selectedTower}
                      >
                        <option value="">All Floors</option>
                        {uniqueFloors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {toTitleCase(f.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">
                        Unit
                      </label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full h-11 rounded-lg border border-border bg-transparent px-3 text-sm"
                        disabled={!selectedFloor}
                      >
                        <option value="">All Units</option>
                        {uniqueUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {toTitleCase(u.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="w-full min-h-11 rounded-lg border border-border bg-transparent px-3 py-2 max-h-96 overflow-y-auto">
                    {loadingCustomers ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Loading customers...
                      </p>
                    ) : filteredCustomers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No customers found.
                      </p>
                    ) : (
                      filteredCustomers.map((customer) => {
                        const isSelected = selectedCustomers.includes(
                          customer.customer_id
                        );
                        return (
                          <label
                            key={`${customer.customer_id}-${customer.unit?.id}`}
                            className="flex items-center gap-2 py-2 hover:bg-accent/50 rounded cursor-pointer border-b border-border last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers((prev) => [
                                    ...prev,
                                    customer.customer_id,
                                  ]);
                                } else {
                                  setSelectedCustomers((prev) =>
                                    prev.filter(
                                      (id) => id !== customer.customer_id
                                    )
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-border"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-foreground font-medium">
                                {toTitleCase(customer.customer_name)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {customer.tower?.name && `Tower ${customer.tower.name}`}
                                {customer.floor?.label && `, Floor ${customer.floor.label}`}
                                {customer.unit?.label && `, Unit ${customer.unit.label}`}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {selectedCustomers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCustomers.length} member(s) selected
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={submitting}
              >
                {submitting
                  ? editingGroup
                    ? "Updating..."
                    : "Creating..."
                  : editingGroup
                  ? "Update Group"
                  : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
