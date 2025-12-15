import { useState, useEffect } from "react";
import { MilestoneAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function MilestonePlanForm({
  setup,
  projects,
  users,
  isOpen,
  onSuccess,
}) {
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    project: "",
    tower: "",
    startdate: "",
    enddate: "",
    responsibleuser: "",
    amount: "",
    calcmode: "AMOUNT",
    enablepgintegration: false,
    verifiedby: "",
    verifieddate: "",
    status: "DRAFT",
    notes: "",
  });

  const [milestoneSlabs, setMilestoneSlabs] = useState([
    { name: "", percentage: "", amount: "", remarks: "" },
  ]);

  const [milestonePlans, setMilestonePlans] = useState([]);

  const updateMilestoneForm = (key, val) =>
    setMilestoneForm((f) => ({ ...f, [key]: val }));

  const addMilestoneSlab = () => {
    setMilestoneSlabs((s) => [
      ...s,
      { name: "", percentage: "", amount: "", remarks: "" },
    ]);
  };

  const delMilestoneSlab = (idx) => {
    if (milestoneSlabs.length <= 1) return;
    setMilestoneSlabs((s) => s.filter((_, i) => i !== idx));
  };

  const updateMilestoneSlab = (idx, key, val) => {
    setMilestoneSlabs((slabs) =>
      slabs.map((slab, i) => (i === idx ? { ...slab, [key]: val } : slab))
    );
  };

  const loadMilestonePlans = async () => {
    if (!isOpen) return;
    try {
      const data = await MilestoneAPI.list();
      const items = Array.isArray(data) ? data : data.results || [];
      setMilestonePlans(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMilestonePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSaveMilestone = async (e) => {
    e.preventDefault();

    if (
      !milestoneForm.name ||
      !milestoneForm.project ||
      !milestoneForm.responsibleuser
    ) {
      alert("Milestone Name, Project, and Responsible User are required");
      return;
    }

    const usingPct = milestoneForm.calcmode === "PERCENTAGE";

    // Validate percentage sum
    if (usingPct) {
      const sum = milestoneSlabs.reduce(
        (acc, s) => acc + (s.percentage ? Number(s.percentage) : 0),
        0
      );
      if (sum > 100.0001) {
        alert("Total percentage cannot exceed 100%");
        return;
      }
    }

    try {
      // Prepare slabs array
      const slabs = milestoneSlabs
        .filter((s) => s.name) // Only include slabs with names
        .map((s, idx) => {
          const slab = {
            name: s.name,
            remarks: s.remarks || "",
          };

          if (usingPct) {
            if (s.percentage) {
              slab.percentage = Number(s.percentage);
            }
          } else {
            if (s.amount) {
              slab.amount = Number(s.amount);
            }
          }

          return slab;
        })
        .filter((s) => usingPct ? s.percentage !== undefined : s.amount !== undefined); // Filter out incomplete slabs

      // Prepare bulk create payload with nested slabs
      const bulkPayload = [
        {
          name: milestoneForm.name,
          project: Number(milestoneForm.project),
          tower: milestoneForm.tower ? Number(milestoneForm.tower) : null,
          start_date: milestoneForm.startdate || null,
          end_date: milestoneForm.enddate || null,
          responsible_user: Number(milestoneForm.responsibleuser),
          calc_mode: milestoneForm.calcmode,
          amount: usingPct ? null : Number(milestoneForm.amount || 0),
          enable_pg_integration: !!milestoneForm.enablepgintegration,
          verified_by: milestoneForm.verifiedby
            ? Number(milestoneForm.verifiedby)
            : null,
          verified_date: milestoneForm.verifieddate || null,
          status: milestoneForm.status || "DRAFT",
          notes: milestoneForm.notes || "",
          slabs: slabs,
        },
      ];

      // Create milestone plan with slabs in one API call
      await MilestoneAPI.bulkCreate(bulkPayload);

      alert("Milestone plan saved successfully!");

      setMilestoneForm({
        name: "",
        project: "",
        tower: "",
        startdate: "",
        enddate: "",
        responsibleuser: "",
        amount: "",
        calcmode: "PERCENTAGE",
        enablepgintegration: false,
        verifiedby: "",
        verifieddate: "",
        status: "DRAFT",
        notes: "",
      });
      setMilestoneSlabs([
        { name: "", percentage: "", amount: "", remarks: "" },
      ]);

      await loadMilestonePlans();
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save milestone");
    }
  };

  // Get towers for selected project
  const towersForMilestone =
    projects.find((p) => String(p.id) === String(milestoneForm.project))
      ?.towers || [];

  return (
    <div className="milestone-container">
      {/* Existing Milestone Plans Table */}
      {milestonePlans.length > 0 && (
        <div className="existing-plans">
          <h3 className="existing-plans-title">Existing Milestone Plans</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Project</th>
                  <th>Tower</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {milestonePlans.map((mp) => (
                  <tr key={mp.id}>
                    <td>{mp.id}</td>
                    <td>{mp.name}</td>
                    <td>{mp.projectname || mp.project}</td>
                    <td>{mp.towername || mp.tower || "-"}</td>
                    <td>{mp.calcmode}</td>
                    <td>{mp.amount ?? "-"}</td>
                    <td>
                      <span
                        className={`status-badge status-${mp.status?.toLowerCase()}`}
                      >
                        {mp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Milestone Plan Form */}
      <div
        className="project-form-container"
        style={{ marginTop: milestonePlans.length > 0 ? "24px" : "0" }}
      >
        <div className="form-header">
          <h3>Create Milestone Plan</h3>
          <button type="button" className="btn-import">
            <span className="import-icon">📄</span>
            IMPORT EXCEL
          </button>
        </div>

        <form onSubmit={handleSaveMilestone} className="project-form">
          {/* Row 1: Milestone Name, Project, Tower */}
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">
                Milestone Name <span className="required">*</span>
              </label>
              <input
                className="field-input"
                value={milestoneForm.name}
                onChange={(e) => updateMilestoneForm("name", e.target.value)}
                placeholder="Enter milestone name"
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Select Project <span className="required">*</span>
              </label>
              <select
                className="field-input"
                value={milestoneForm.project}
                onChange={(e) => {
                  updateMilestoneForm("project", e.target.value);
                  updateMilestoneForm("tower", "");
                }}
                required
              >
                <option value="">Select</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="field-label">Select Tower</label>
              <select
                className="field-input"
                value={milestoneForm.tower}
                onChange={(e) => updateMilestoneForm("tower", e.target.value)}
                disabled={!milestoneForm.project}
              >
                <option value="">All Towers</option>
                {towersForMilestone.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Start Date, End Date, Responsible User */}
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">Start Date</label>
              <input
                className="field-input"
                type="date"
                value={milestoneForm.startdate}
                onChange={(e) =>
                  updateMilestoneForm("startdate", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label className="field-label">End Date</label>
              <input
                className="field-input"
                type="date"
                value={milestoneForm.enddate}
                onChange={(e) => updateMilestoneForm("enddate", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Responsible User <span className="required">*</span>
              </label>
              <select
                className="field-input"
                value={milestoneForm.responsibleuser}
                onChange={(e) =>
                  updateMilestoneForm("responsibleuser", e.target.value)
                }
                required
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Calc Mode, Total Amount (conditional), Status */}
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">Calculation Mode</label>
              <select
                className="field-input"
                value={milestoneForm.calcmode}
                onChange={(e) =>
                  updateMilestoneForm("calcmode", e.target.value)
                }
              >
                <option value="AMOUNT">Amount</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>

            {milestoneForm.calcmode === "AMOUNT" && (
              <div className="form-field">
                <label className="field-label">Total Amount</label>
                <input
                  className="field-input"
                  type="number"
                  value={milestoneForm.amount}
                  onChange={(e) =>
                    updateMilestoneForm("amount", e.target.value)
                  }
                  placeholder="Enter total amount"
                  step="0.01"
                />
              </div>
            )}

            <div className="form-field">
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={milestoneForm.status}
                onChange={(e) => updateMilestoneForm("status", e.target.value)}
              >
                {setup?.statuses?.milestone_plan?.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Verified By, Verified Date */}
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">Verified By</label>
              <select
                className="field-input"
                value={milestoneForm.verifiedby}
                onChange={(e) =>
                  updateMilestoneForm("verifiedby", e.target.value)
                }
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="field-label">Verified Date</label>
              <input
                className="field-input"
                type="date"
                value={milestoneForm.verifieddate}
                onChange={(e) =>
                  updateMilestoneForm("verifieddate", e.target.value)
                }
              />
            </div>
          </div>

          {/* Payment Gateway Integration Checkbox */}
          <div className="checkbox-wrapper">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!milestoneForm.enablepgintegration}
                onChange={(e) =>
                  updateMilestoneForm("enablepgintegration", e.target.checked)
                }
              />
              <span>Enable Payment Gateway Integration</span>
            </label>
          </div>

          {/* Milestone Slabs Section */}
          <div className="form-section-divider">
            <h3 className="form-section-title">Milestone Slabs</h3>
          </div>

          {milestoneSlabs.map((slab, idx) => (
            <div key={idx} className="slab-row">
              <input
                className="field-input"
                placeholder="Name"
                value={slab.name}
                onChange={(e) =>
                  updateMilestoneSlab(idx, "name", e.target.value)
                }
              />
              <input
                className="field-input"
                type="number"
                placeholder="Percentage"
                value={slab.percentage}
                onChange={(e) =>
                  updateMilestoneSlab(idx, "percentage", e.target.value)
                }
                disabled={milestoneForm.calcmode === "AMOUNT"}
                step="0.01"
              />
              {/* <input
                className="field-input"
                type="number"
                placeholder="Amountededededed"
                value={slab.amount}
                onChange={(e) =>
                  updateMilestoneSlab(idx, "amount", e.target.value)
                }
                step="0.01"
              /> */}
              <input
                className="field-input"
                placeholder="Remarks"
                value={slab.remarks}
                onChange={(e) =>
                  updateMilestoneSlab(idx, "remarks", e.target.value)
                }
              />
              {milestoneSlabs.length > 1 && (
                <button
                  type="button"
                  className="btn-danger-small"
                  onClick={() => delMilestoneSlab(idx)}
                  title="Remove Slab"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Row: Notes (full width) */}
          <div className="form-field-full">
            <label className="field-label">Notes</label>
            <textarea
              className="field-textarea"
              rows={3}
              value={milestoneForm.notes}
              onChange={(e) => updateMilestoneForm("notes", e.target.value)}
              placeholder="Add notes"
            />
          </div>

          {/* Actions */}
          <div className="form-actions-split">
            <button
              type="button"
              className="btn-secondary"
              onClick={addMilestoneSlab}
            >
              Add Slab
            </button>
            <button type="submit" className="btn-add-project">
              SAVE MILESTONE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
