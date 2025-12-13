import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SetupAPI } from "../../api/endpoints";
import api from "../../api/axiosInstance";
import "./InventoryCreate.css";
import { toast } from "react-hot-toast";

const InventoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [item, setItem] = useState({
    project: "",
    tower: "",
    floor: "",
    unit: "",
    unit_type: "",
    configuration: "",
    facing: "",
    unit_status: "",
    carpet_area: "",
    build_up_area: "",
    saleable_area: "",
    rera_area: "",
    block_minutes: "",
    block_days: "",
    agreement_value: "",
    development_charges: "",
    gst_input: "",
    gst_mode: "AMOUNT",
    gst_amount: "",
    stamp_duty_amount: "",
    registration_charges: "",
    legal_fee: "",
    total_cost: "",
    inventory_description: "",
    floor_plan_file: null,
    other_file: null,
    project_plan_file: null,
  });

  // Load setup-bundle + my-scope + inventory item
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [b, s, invRes] = await Promise.all([
          SetupAPI.getBundle(),
          SetupAPI.myScope({ include_units: true }),
          api.get(`client/inventory/${id}/`),
        ]);
        setBundle(b);
        setScope(s);

        // Populate form with inventory data
        const inv = invRes.data;
        console.log("Loaded inventory data:", inv); // Debug log
        
        // Convert numeric values to strings for form inputs, handle null/undefined
        const toFormValue = (val) => {
          if (val === null || val === undefined) return "";
          return String(val);
        };
        
        setItem({
          project: toFormValue(inv.project?.id || inv.project),
          tower: toFormValue(inv.tower?.id || inv.tower),
          floor: toFormValue(inv.floor?.id || inv.floor),
          unit: toFormValue(inv.unit?.id || inv.unit),
          unit_type: toFormValue(inv.unit_type?.id || inv.unit_type),
          configuration: toFormValue(inv.configuration?.id || inv.configuration),
          facing: toFormValue(inv.facing?.id || inv.facing),
          unit_status: inv.availability_status || inv.unit_status || "",
          carpet_area: toFormValue(inv.carpet_area),
          build_up_area: toFormValue(inv.build_up_area),
          saleable_area: toFormValue(inv.saleable_area),
          rera_area: toFormValue(inv.rera_area),
          block_minutes: toFormValue(inv.block_minutes),
          block_days: toFormValue(inv.block_days),
          agreement_value: toFormValue(inv.agreement_value),
          development_charges: toFormValue(inv.development_charges),
          gst_input: toFormValue(inv.gst_amount),
          gst_mode: "AMOUNT",
          gst_amount: toFormValue(inv.gst_amount),
          stamp_duty_amount: toFormValue(inv.stamp_duty_amount),
          registration_charges: toFormValue(inv.registration_charges),
          legal_fee: toFormValue(inv.legal_fee),
          total_cost: toFormValue(inv.total_cost),
          inventory_description: inv.description || "",
          floor_plan_file: null,
          other_file: null,
          project_plan_file: null,
        });
      } catch (e) {
        console.error("Failed to load inventory", e);
        setError("Failed to load inventory data.");
        toast.error("Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      load();
    }
  }, [id]);

  // Derived data
  const projects = useMemo(() => scope?.projects ?? [], [scope]);
  const unitTypes = bundle?.lookups?.unit_types ?? [];
  const unitConfigs = bundle?.lookups?.unit_configurations ?? [];
  const facings = bundle?.lookups?.facings ?? [];
  const unitStatuses =
    (bundle?.statuses?.unit ?? []).filter((u) =>
      ["AVAILABLE", "BLOCKED", "SOLD"].includes(u.code)
    ) ?? [];

  const getProjectPricePerSqft = (projectId) => {
    if (!projectId) return null;
    const p = projects.find((p) => String(p.id) === String(projectId));
    if (!p || p.price_per_sqft == null || p.price_per_sqft === "") return null;
    const n = Number(p.price_per_sqft);
    return Number.isNaN(n) ? null : n;
  };

  const getTowers = () => {
    const p = projects.find((p) => String(p.id) === String(item.project));
    return p?.towers ?? [];
  };

  const getFloors = () => {
    const towers = getTowers();
    const t = towers.find((t) => String(t.id) === String(item.tower));
    return t?.floors ?? [];
  };

  const getUnits = () => {
    const floors = getFloors();
    const f = floors.find((f) => String(f.id) === String(item.floor));
    return f?.units ?? [];
  };

  const autoFillAgreementValue = (next) => {
    const rate = getProjectPricePerSqft(next.project);
    const carpet = parseFloat(next.carpet_area);
    if (rate == null || Number.isNaN(carpet)) return;
    next.agreement_value = (carpet * rate).toFixed(2);
  };

  const recomputeGstAndTotal = (next) => {
    // Calculate GST amount based on mode
    let gstAmt = "";
    if (next.gst_input !== "" && next.gst_input != null) {
      const raw = parseFloat(next.gst_input);
      if (!Number.isNaN(raw)) {
        if (next.gst_mode === "PERCENT") {
          const base = parseFloat(next.agreement_value);
          if (!Number.isNaN(base) && base > 0) {
            gstAmt = ((base * raw) / 100).toFixed(2);
          }
        } else {
          gstAmt = raw.toFixed(2);
        }
      }
    }
    next.gst_amount = gstAmt;

    // Calculate total
    const moneyFields = [
      "agreement_value",
      "development_charges",
      "gst_amount",
      "stamp_duty_amount",
      "registration_charges",
      "legal_fee",
    ];
    let sum = 0;
    moneyFields.forEach((field) => {
      const v = parseFloat(next[field]);
      if (!Number.isNaN(v)) sum += v;
    });
    next.total_cost = sum ? sum.toFixed(2) : "";
  };

  const handleChange = (name, value) => {
    const next = { ...item, [name]: value };

    // Cascading resets
    if (name === "project") {
      next.tower = "";
      next.floor = "";
      next.unit = "";
    } else if (name === "tower") {
      next.floor = "";
      next.unit = "";
    } else if (name === "floor") {
      next.unit = "";
    }

    // Auto agreement_value
    if (name === "project" || name === "carpet_area") {
      autoFillAgreementValue(next);
    }

    // Recompute GST and total
    const moneyImpactFields = [
      "agreement_value",
      "development_charges",
      "stamp_duty_amount",
      "registration_charges",
      "legal_fee",
      "gst_input",
      "gst_mode",
    ];
    if (
      moneyImpactFields.includes(name) ||
      name === "project" ||
      name === "carpet_area"
    ) {
      recomputeGstAndTotal(next);
    }

    setItem(next);
  };

  const handleFileChange = (name, file) => {
    setItem((prev) => ({ ...prev, [name]: file }));
  };

  // Helper to convert form value to number or null
  const toNumberOrNull = (val) => {
    if (!val || val === "") return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    const docs = [];
    let docIdx = 0;

    if (item.floor_plan_file) {
      const key = `doc_${docIdx++}`;
      fd.append(key, item.floor_plan_file);
      docs.push({ doc_type: "FLOOR_PLAN", file_field: key });
    }
    if (item.project_plan_file) {
      const key = `doc_${docIdx++}`;
      fd.append(key, item.project_plan_file);
      docs.push({ doc_type: "PROJECT_PLAN", file_field: key });
    }
    if (item.other_file) {
      const key = `doc_${docIdx++}`;
      fd.append(key, item.other_file);
      docs.push({ doc_type: "OTHER", file_field: key });
    }

    // Build payload with proper type conversion
    const payload = {
      project: toNumberOrNull(item.project),
      tower: toNumberOrNull(item.tower),
      floor: toNumberOrNull(item.floor),
      unit: toNumberOrNull(item.unit),
      unit_type: toNumberOrNull(item.unit_type),
      configuration: toNumberOrNull(item.configuration),
      facing: toNumberOrNull(item.facing),
      availability_status: item.unit_status || "AVAILABLE",
      unit_status: item.unit_status || "AVAILABLE",
      carpet_area: toNumberOrNull(item.carpet_area),
      build_up_area: toNumberOrNull(item.build_up_area),
      saleable_area: toNumberOrNull(item.saleable_area),
      rera_area: toNumberOrNull(item.rera_area),
      block_minutes: toNumberOrNull(item.block_minutes),
      block_days: toNumberOrNull(item.block_days),
      agreement_value: toNumberOrNull(item.agreement_value),
      development_charges: toNumberOrNull(item.development_charges),
      gst_amount: toNumberOrNull(item.gst_amount),
      stamp_duty_amount: toNumberOrNull(item.stamp_duty_amount),
      registration_charges: toNumberOrNull(item.registration_charges),
      legal_fee: toNumberOrNull(item.legal_fee),
      total_cost: toNumberOrNull(item.total_cost),
      description: item.inventory_description || "",
    };

    // Only add documents if there are new files
    if (docs.length > 0) {
      payload.documents = docs;
    }

    // If there are files, use FormData, otherwise use JSON
    if (docs.length > 0) {
      fd.append("data", JSON.stringify(payload));
      try {
        await api.patch(`client/inventory/${id}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Inventory updated successfully ✅");
        navigate("/sales/inventory");
      } catch (err) {
        console.error("Inventory update failed", err);
        console.error("Error response:", err?.response?.data);
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update inventory. Please check the data.";
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    } else {
      // No files, send as JSON
      try {
        console.log("Sending update payload:", payload); // Debug log
        await api.patch(`client/inventory/${id}/`, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Inventory updated successfully ✅");
        navigate("/sales/inventory");
      } catch (err) {
        console.error("Inventory update failed", err);
        console.error("Error response:", err?.response?.data);
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update inventory. Please check the data.";
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    }
  };

  const renderSelect = (label, name, options, placeholder = "Select") => {
    const currentValue = String(item[name] || "");
    return (
      <div className="form-field">
        <label className="form-label">{label}</label>
        <select
          className="form-input"
          value={currentValue}
          onChange={(e) => handleChange(name, e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const optValue = String(opt.value ?? opt.id ?? "");
            return (
              <option key={optValue} value={optValue}>
                {opt.label ?? opt.name}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  const renderNumber = (label, name) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="number"
        value={item[name] || ""}
        onChange={(e) => handleChange(name, e.target.value)}
      />
    </div>
  );

  const renderTextarea = (label, name) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <textarea
        className="form-input"
        value={item[name]}
        onChange={(e) => handleChange(name, e.target.value)}
        rows={3}
      />
    </div>
  );

  const renderFile = (label, name) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="file"
        onChange={(e) => handleFileChange(name, e.target.files?.[0] || null)}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="inventory-page">
        <div style={{ padding: 24 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="setup-section">
        <div className="section-content">
          {error && <div className="error-banner">{error}</div>}

          <div className="project-form-container">
            <div className="form-header">
              <h3>Edit Inventory</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/sales/inventory")}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {renderSelect(
                  "Project",
                  "project",
                  projects.map((p) => ({ value: p.id, label: p.name }))
                )}

                {renderSelect(
                  "Tower",
                  "tower",
                  getTowers().map((t) => ({ value: t.id, label: t.name }))
                )}

                {renderSelect(
                  "Floor",
                  "floor",
                  getFloors().map((f) => ({ value: f.id, label: f.number }))
                )}

                {renderSelect(
                  "Unit",
                  "unit",
                  getUnits().map((u) => ({
                    value: u.id,
                    label: u.unit_no || `Unit #${u.id}`,
                  }))
                )}

                {renderSelect(
                  "Unit Type",
                  "unit_type",
                  unitTypes.map((u) => ({ value: u.id, label: u.name }))
                )}

                {renderSelect(
                  "Configuration",
                  "configuration",
                  unitConfigs.map((u) => ({ value: u.id, label: u.name }))
                )}

                {renderSelect(
                  "Facing",
                  "facing",
                  facings.map((f) => ({ value: f.id, label: f.name }))
                )}

                {renderSelect(
                  "Status",
                  "unit_status",
                  unitStatuses.map((u) => ({
                    value: u.code,
                    label: u.name || u.code,
                  }))
                )}

                {renderNumber("Carpet Area (sq.ft)", "carpet_area")}
                {renderNumber("Build-up Area (sq.ft)", "build_up_area")}
                {renderNumber("Saleable Area (sq.ft)", "saleable_area")}
                {renderNumber("RERA Area (sq.ft)", "rera_area")}
                {renderNumber("Block Minutes", "block_minutes")}
                {renderNumber("Block Days", "block_days")}

                {renderNumber("Agreement Value (₹)", "agreement_value")}
                {renderNumber("Development Charges (₹)", "development_charges")}

                <div className="form-field">
                  <label className="form-label">GST Mode</label>
                  <select
                    className="form-input"
                    value={item.gst_mode}
                    onChange={(e) => handleChange("gst_mode", e.target.value)}
                  >
                    <option value="AMOUNT">Amount (₹)</option>
                    <option value="PERCENT">Percent (%)</option>
                  </select>
                </div>

                {renderNumber(
                  item.gst_mode === "PERCENT"
                    ? "GST Input (%)"
                    : "GST Amount (₹)",
                  "gst_input"
                )}

                {renderNumber("Stamp Duty (₹)", "stamp_duty_amount")}
                {renderNumber("Registration Charges (₹)", "registration_charges")}
                {renderNumber("Legal Fee (₹)", "legal_fee")}
                {renderNumber("Total Cost (₹)", "total_cost")}

                {renderTextarea("Description", "inventory_description")}

                {renderFile("Floor Plan File", "floor_plan_file")}
                {renderFile("Project Plan File", "project_plan_file")}
                {renderFile("Other File", "other_file")}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/sales/inventory")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryEdit;

