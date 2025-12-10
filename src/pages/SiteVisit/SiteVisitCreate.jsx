import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { SetupAPI } from "../../api/endpoints";
import "./SiteVisitCreate.css";
import { toast } from "react-hot-toast";

// Helper: Convert text to title case (first letter of every word capitalized)
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  // Split by spaces and capitalize first letter of each word
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function SiteVisitCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const leadId = params.get("lead_id");
  const projectId = params.get("project_id");

  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);
  const [leadsList, setLeadsList] = useState([]); // For dropdown when no lead_id
  const [leadSearch, setLeadSearch] = useState(""); // For searchable lead dropdown
  const [selectedLeadId, setSelectedLeadId] = useState(""); // Selected lead ID
  const [projectsList, setProjectsList] = useState([]); // Projects list for dropdown

  const [availableUnits, setAvailableUnits] = useState([]);
  const [unitConfigs, setUnitConfigs] = useState([]);

  const [towers, setTowers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);

  const [form, setForm] = useState({
    lead: "",
    project: "",
    unit_config: "",
    tower: "",
    floor: "",
    inventory: "",
    scheduled_at: "",
    member_name: "",
    member_mobile_number: "",
    notes: "",
  });

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  // LOAD LEAD (also contains project) - when lead_id provided in URL
  useEffect(() => {
    if (!leadId) return;

    api
      .get(`/sales/sales-leads/${leadId}/`)
      .then((res) => {
        setLead(res.data);

        setForm((f) => ({
          ...f,
          lead: leadId,
          project: res.data.project, // take project from lead
        }));

        setProject({
          id: res.data.project,
          name: res.data.project_name,
        });
      })
      .catch(() => toast.error("Failed to load lead details"));
  }, [leadId]);

  // LOAD LEADS LIST (when no lead_id provided - for dropdown)
  useEffect(() => {
    if (leadId) return; // Skip if lead_id is provided

    api
      .get("/sales/sales-leads/", { params: { page_size: 1000 } })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || [];
        setLeadsList(items);
      })
      .catch(() => {
        // Silent fail - dropdown will be empty
        console.error("Failed to load leads list");
      });
  }, [leadId]);

  // LOAD PROJECTS LIST (for project dropdown)
  useEffect(() => {
    SetupAPI.myScope()
      .then((data) => {
        const list = data?.projects || data?.project_list || data?.results || [];
        const scopeProjects = list.map((p) => ({
          id: p.id,
          name: p.name || p.project_name || `Project #${p.id}`,
        }));
        setProjectsList(scopeProjects.filter((p) => p.id));
      })
      .catch(() => {
        console.error("Failed to load projects");
      });
  }, []);

  // LOAD LEAD WHEN SELECTED FROM SEARCHABLE DROPDOWN
  useEffect(() => {
    if (leadId || !selectedLeadId) return; // Skip if lead_id from URL or no lead selected

    api
      .get(`/sales/sales-leads/${selectedLeadId}/`)
      .then((res) => {
        setLead(res.data);

        setForm((f) => ({
          ...f,
          lead: selectedLeadId,
          project: res.data.project || "", // take project from lead
        }));

        // Set project from lead
        if (res.data.project) {
          const proj = projectsList.find((p) => String(p.id) === String(res.data.project));
          if (proj) {
            setProject({
              id: proj.id,
              name: proj.name,
            });
          }
        }
      })
      .catch(() => toast.error("Failed to load lead details"));
  }, [selectedLeadId, leadId, projectsList]);


  // LOAD AVAILABLE INVENTORY
  useEffect(() => {
    // Use projectId from URL or project from form (which comes from lead)
    const currentProjectId = projectId || form.project;
    if (!currentProjectId) return;

    api
      .get(`/client/projects/${currentProjectId}/available-units/`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setAvailableUnits(data);

        const uniqueTowers = [...new Set(data.map((u) => u.tower))].map(
          (towerId) => {
            const row = data.find((u) => u.tower === towerId);
            return { id: towerId, name: row?.tower_name };
          }
        );

        setTowers(uniqueTowers);
      })
      .catch(() => toast.error("Failed to load units"));
  }, [projectId, form.project]);

  // LOAD UNIT CONFIGURATION
  useEffect(() => {
    api
      .get("/setup/unit-configurations/")
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setUnitConfigs(items);
      })
      .catch(() => toast.error("Failed to load unit configurations"));
  }, []);

  // WHEN TOWER SELECTED → SHOW FLOORS
  useEffect(() => {
    if (!form.tower) {
      setFloors([]);
      setUnits([]);
      return;
    }

    const f = availableUnits
      .filter((u) => u.tower === Number(form.tower))
      .map((u) => ({
        id: u.floor,
        name: u.floor_number,
      }));

    const uniqueFloors = [];
    const seen = new Set();
    f.forEach((x) => {
      if (!seen.has(x.id)) {
        seen.add(x.id);
        uniqueFloors.push(x);
      }
    });

    setFloors(uniqueFloors);
  }, [form.tower, availableUnits]);

  // WHEN FLOOR SELECTED → SHOW UNITS
  useEffect(() => {
    if (!form.floor) {
      setUnits([]);
      return;
    }

    const items = availableUnits.filter(
      (u) => u.tower === Number(form.tower) && u.floor === Number(form.floor)
    );

    setUnits(items);
  }, [form.floor, form.tower, availableUnits]);

  // SUBMIT
  const handleSubmit = async () => {
    const leadIdToUse = leadId || selectedLeadId || form.lead;
    if (!leadIdToUse || !form.project || !form.scheduled_at) {
      toast.error("Required fields missing");
      return;
    }

    try {
      await api.post("/sales/site-visits/", {
        lead_id: Number(leadIdToUse),
        project_id: Number(form.project),
        unit_config_id: form.unit_config ? Number(form.unit_config) : null,
        inventory_id: form.inventory ? Number(form.inventory) : null,
        scheduled_at: form.scheduled_at,
        member_name: form.member_name ? toTitleCase(form.member_name) : "",
        member_mobile_number: form.member_mobile_number,
        notes: form.notes ? toTitleCase(form.notes) : "",
      });
      toast.success("Site Visit Scheduled");
      navigate(`/sales/lead/site-visit?lead_id=${leadIdToUse}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create site visit");
    }
  };

  return (
    <div className="sv-container">
      {/* HEADER */}
      <div className="sv-header-grey">
        <span className="sv-header-title">Schedule A Site Visit</span>
      </div>

      {/* FORM */}
      <div className="sv-section">
        {/* Lead + Project + Unit Config */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Lead (Type to search)</label>
            {leadId ? (
              // When lead_id provided from URL (from LeadsList) - read-only
              <input
                className="form-input"
                value={toTitleCase(lead?.full_name || lead?.lead_name || [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || "")}
                readOnly
              />
            ) : (
              // When no lead_id (from SiteVisitList) - show searchable dropdown
              <div className="searchable-select">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, email, mobile..."
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    if (selectedLeadId && e.target.value) {
                      setSelectedLeadId("");
                      setForm((f) => ({ ...f, lead: "", project: "" }));
                      setProject(null);
                    }
                  }}
                />
                {(() => {
                  const filteredLeads = leadsList.filter((l) => {
                    if (!leadSearch) return false; // Only show when user is typing
                    const term = leadSearch.toLowerCase();
                    const leadName = toTitleCase(
                      l.lead_name ||
                        [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                        l.full_name ||
                        ""
                    );
                    const email = (l.email || "").toLowerCase();
                    const mobile = (l.mobile_number || "").toLowerCase();
                    const searchString = `${leadName} ${email} ${mobile}`.toLowerCase();
                    return searchString.includes(term);
                  });

                  if (!leadSearch && filteredLeads.length === 0) {
                    return null;
                  }

                  return (
                    <select
                      className="form-input cp-search-dropdown"
                      style={{ marginTop: "8px" }}
                      value={selectedLeadId}
                      onChange={(e) => {
                        setSelectedLeadId(e.target.value);
                        if (e.target.value) {
                          const selected = leadsList.find(
                            (l) => l.id === parseInt(e.target.value, 10)
                          );
                          if (selected) {
                            const leadName = toTitleCase(
                              selected.lead_name ||
                                [selected.first_name, selected.last_name]
                                  .filter(Boolean)
                                  .join(" ") ||
                                selected.full_name ||
                                `Lead #${selected.id}`
                            );
                            setLeadSearch(leadName);
                            handleChange("lead", e.target.value);
                          }
                        }
                      }}
                      size={Math.min(filteredLeads.length + 1, 6)}
                    >
                      <option value="">
                        {leadSearch && filteredLeads.length === 0
                          ? "— No results found —"
                          : leadSearch
                          ? "— Select from filtered results —"
                          : "— Start typing to search —"}
                      </option>
                      {filteredLeads.map((l) => {
                        const leadName = toTitleCase(
                          l.lead_name ||
                            [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                            l.full_name ||
                            `Lead #${l.id}`
                        );
                        return (
                          <option key={l.id} value={l.id}>
                            {leadName}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Project</label>
            {leadId || selectedLeadId ? (
              // When lead is selected - show project from lead (read-only)
              <input
                className="form-input"
                value={toTitleCase(project?.name || "")}
                readOnly
              />
            ) : (
              // When no lead selected - show project dropdown
              <select
                className="form-input"
                value={form.project}
                onChange={(e) => {
                  handleChange("project", e.target.value);
                  const proj = projectsList.find((p) => String(p.id) === String(e.target.value));
                  if (proj) {
                    setProject({
                      id: proj.id,
                      name: proj.name,
                    });
                  }
                }}
              >
                <option value="">Select Project</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {toTitleCase(p.name || "")}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Unit Configuration</label>
            <select
              className="form-input"
              value={form.unit_config}
              onChange={(e) => handleChange("unit_config", e.target.value)}
            >
              <option value="">Select</option>
              {unitConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {toTitleCase(c.name || "")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tower / Floor / Unit */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Tower</label>
            <select
              className="form-input"
              value={form.tower}
              onChange={(e) => handleChange("tower", e.target.value)}
            >
              <option value="">Select Tower</option>
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {toTitleCase(t.name || "")}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Floor</label>
            <select
              className="form-input"
              value={form.floor}
              onChange={(e) => handleChange("floor", e.target.value)}
            >
              <option value="">Select Floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Unit</label>
            <select
              className="form-input"
              value={form.inventory}
              onChange={(e) => handleChange("inventory", e.target.value)}
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_no || `Unit #${u.unit}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visitor */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Visitor Name</label>
            <input
              className="form-input"
              value={form.member_name}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("member_name", value ? toTitleCase(value) : value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  handleChange("member_name", toTitleCase(e.target.value));
                }
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              value={form.member_mobile_number}
              onChange={(e) =>
                handleChange("member_mobile_number", e.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label className="form-label">Visit Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.scheduled_at}
              onChange={(e) => handleChange("scheduled_at", e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-row">
          <div className="form-field-full">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.notes}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("notes", value ? toTitleCase(value) : value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  handleChange("notes", toTitleCase(e.target.value));
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sv-footer">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSubmit}>
          Create Visit
        </button>
      </div>
    </div>
  );
}

