// src/pages/Setup/ProjectSetupDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./ProjectSetupDetail.css"; // optional, create later
import { toast } from "react-hot-toast";

const ProjectSetupDetail = () => {
  const { projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [milestonePlans, setMilestonePlans] = useState([]);
  const [milestoneSlabs, setMilestoneSlabs] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [paymentSlabs, setPaymentSlabs] = useState([]);
  const [projectBanks, setProjectBanks] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        projectRes,
        towersRes,
        floorsRes,
        unitsRes,
        msPlansRes,
        msSlabsRes,
        payPlansRes,
        paySlabsRes,
        projectBanksRes,
      ] = await Promise.all([
        axiosInstance.get(`/client/projects/${projectId}/`),
        axiosInstance.get(`/client/towers/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/floors/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/units/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/milestone-plans/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/milestone-slabs/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/payment-plans/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/payment-slabs/`, {
          params: { project_id: projectId },
        }),
        axiosInstance.get(`/client/project-banks/`, {
          params: { project_id: projectId },
        }),
      ]);

      setProject(projectRes.data);
      setTowers(towersRes.data.results || towersRes.data);
      setFloors(floorsRes.data.results || floorsRes.data);
      setUnits(unitsRes.data.results || unitsRes.data);
      setMilestonePlans(msPlansRes.data.results || msPlansRes.data);
      setMilestoneSlabs(msSlabsRes.data.results || msSlabsRes.data);
      setProjectBanks(projectBanksRes.data.results || projectBanksRes.data);

      const paymentPlansData = payPlansRes.data.results || payPlansRes.data || [];
      const paymentSlabsData = paySlabsRes.data.results || paySlabsRes.data || [];

      // normalize payment plans (attach slabs properly)
      const normalizedPaymentPlans = paymentPlansData.map((plan) => ({
        ...plan,
        slabs:
          Array.isArray(plan.slabs) && plan.slabs.length
            ? plan.slabs
            : paymentSlabsData.filter(
                (s) => String(s.plan) === String(plan.id)
              ),
      }));

      setPaymentPlans(normalizedPaymentPlans);
      setPaymentSlabs(paymentSlabsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load project setup data.");
    } finally {
      setLoading(false);
    }
  };

  // ========= Project =========

  const handleProjectChange = (field, value) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

const saveProject = async () => {
  if (!project) return;
  setSaving(true);
  setError("");
  try {
    const payload = {
      name: project.name,
      location: project.location,
      developer: project.developer,
      rera_no: project.rera_no,
      start_date: project.start_date,
      end_date: project.end_date,
      possession_date: project.possession_date,
      project_type: project.project_type,
      status: project.status,
      approval_status: project.approval_status,
      notes: project.notes,
      price_per_sqft: project.price_per_sqft,
    };
    const res = await axiosInstance.patch(
      `/client/projects/${projectId}/`,
      payload
    );
    setProject(res.data);
    toast.success("Project updated successfully");
  } catch (err) {
    console.error(err);
    setError("Failed to save project.");
    toast.error("Failed to save project");
  } finally {
    setSaving(false);
  }
};


  // ========= Towers =========

  const handleTowerChange = (id, field, value) => {
    setTowers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

const saveTower = async (tower) => {
  try {
    const payload = {
      name: tower.name,
      tower_type: tower.tower_type,
      total_floors: tower.total_floors,
      status: tower.status,
      notes: tower.notes,
      project: tower.project,
    };
    const res = await axiosInstance.patch(
      `/client/towers/${tower.id}/`,
      payload
    );
    setTowers((prev) => prev.map((t) => (t.id === tower.id ? res.data : t)));
    toast.success(`Tower ${tower.name || tower.id} updated`);
  } catch (err) {
    console.error(err);
    setError(`Failed to save tower ${tower.id}.`);
    toast.error("Failed to save tower");
  }
};


  // ========= Milestone Plans =========

  const handleMilestonePlanChange = (id, field, value) => {
    setMilestonePlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

const saveMilestonePlan = async (plan) => {
  try {
    const payload = {
      name: plan.name,
      start_date: plan.start_date,
      end_date: plan.end_date,
      calc_mode: plan.calc_mode,
      amount: plan.amount ? Number(plan.amount) : null,
      enable_pg_integration: plan.enable_pg_integration,
      status: plan.status,
      notes: plan.notes,
      project: plan.project,
      tower: plan.tower,
      responsible_user: plan.responsible_user,
      verified_by: plan.verified_by,
      verified_date: plan.verified_date,
    };
    const res = await axiosInstance.patch(
      `/client/milestone-plans/${plan.id}/`,
      payload
    );
    setMilestonePlans((prev) =>
      prev.map((p) => (p.id === plan.id ? res.data : p))
    );
    toast.success(`Milestone plan "${plan.name}" updated`);
  } catch (err) {
    console.error(err);
    setError(`Failed to save milestone plan ${plan.id}.`);
    toast.error("Failed to save milestone plan");
  }
};

  // ========= Milestone Slabs =========

  const handleMilestoneSlabChange = (id, field, value) => {
    setMilestoneSlabs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const saveMilestoneSlab = async (slab) => {
    try {
      const payload = {
        plan: slab.plan,
        orderindex: slab.orderindex,
        name: slab.name,
        percentage: slab.percentage ? Number(slab.percentage) : null,
        amount: slab.amount ? Number(slab.amount) : null,
        remarks: slab.remarks || "",
      };
      const res = await axiosInstance.patch(
        `/client/milestone-slabs/${slab.id}/`,
        payload
      );
      setMilestoneSlabs((prev) =>
        prev.map((s) => (s.id === slab.id ? res.data : s))
      );
      toast.success(`Milestone slab "${slab.name}" updated`);
    } catch (err) {
      console.error(err);
      setError(`Failed to save milestone slab ${slab.id}.`);
      toast.error("Failed to save milestone slab");
    }
  };


  // ========= Payment Plans & Slabs =========

    const handlePaymentPlanChange = (id, field, value) => {
      setPaymentPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    };

    const savePaymentPlan = async (plan) => {
      try {
        const payload = {
          code: plan.code,
          name: plan.name,
          project: plan.project,
        };
        const res = await axiosInstance.patch(
          `/client/payment-plans/${plan.id}/`,
          payload
        );
        setPaymentPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? res.data : p))
        );
        toast.success(`Payment plan "${plan.code}" updated`);
      } catch (err) {
        console.error(err);
        setError(`Failed to save payment plan ${plan.id}.`);
        toast.error("Failed to save payment plan");
      }
    };

    // CORRECTED: This function now updates the nested slabs within the paymentPlans state
    const handlePaymentSlabChange = (slabId, field, value) => {
      // 1. Update global paymentSlabs state
      setPaymentSlabs((prevSlabs) =>
        prevSlabs.map((s) => (s.id === slabId ? { ...s, [field]: value } : s))
      );

      // 2. Update nested slabs in paymentPlans state (for immediate UI refresh)
      setPaymentPlans((prevPlans) =>
        prevPlans.map((plan) => ({
          ...plan,
          slabs: plan.slabs.map((slab) =>
            slab.id === slabId ? { ...slab, [field]: value } : slab
          ),
        }))
      );
    };

    const savePaymentSlab = async (slab) => {
          try {
            const payload = {
              plan: slab.plan,
              order_index: slab.order_index,
              name: slab.name,
              // CORRECTED: Ensure percentage is correctly parsed as a number
              percentage: slab.percentage ? Number(slab.percentage) : null,
            };

            const res = await axiosInstance.patch(
              `/client/payment-slabs/${slab.id}/`,
              payload
            );

            // Update the global paymentSlabs state with the response data
            setPaymentSlabs((prev) =>
              prev.map((s) => (s.id === slab.id ? res.data : s))
            );

            // Update the nested slabs in paymentPlans state for immediate UI refresh
            setPaymentPlans((prev) =>
              prev.map((p) =>
                // The slab's 'plan' property holds the parent plan ID
                String(p.id) === String(slab.plan)
                  ? {
                      ...p,
                      slabs: p.slabs.map((s) =>
                        s.id === slab.id ? res.data : s
                      ),
                    }
                  : p
              )
            );

            toast.success("Payment slab updated");
          } catch (err) {
            console.error(err);
            toast.error("Failed to save payment slab");
          }
        };


  // ========= Project Banks =========

  const handleProjectBankChange = (id, field, value) => {
    setProjectBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

const saveProjectBank = async (bank) => {
  try {
    const payload = {
      project: bank.project,
      bank_branch: bank.bank_branch,
      apf_number: bank.apf_number,
      status: bank.status,
    };
    const res = await axiosInstance.patch(
      `/client/project-banks/${bank.id}/`,
      payload
    );
    setProjectBanks((prev) =>
      prev.map((b) => (b.id === bank.id ? res.data : b))
    );
    toast.success("Project bank updated");
  } catch (err) {
    console.error(err);
    setError(`Failed to save project bank ${bank.id}.`);
    toast.error("Failed to save project bank");
  }
};


  // ========= Render =========

  if (loading) {
    return <div className="psd-page">Loading project setup...</div>;
  }

  if (error) {
    return (
      <div className="psd-page">
        <div className="psd-error">{error}</div>
        <button onClick={fetchAll}>Retry</button>
      </div>
    );
  }

  if (!project) {
    return <div className="psd-page">Project not found.</div>;
  }

  return (
    <div className="psd-page">
      <header className="psd-header">
        <div>
          <h1>{project.name}</h1>
          <p>
            Status: {project.status} | Approval:{" "}
            {project.approval_status}
          </p>
        </div>
        <div className="psd-header-right">
          <div>Total Inventory: {project.total_inventory}</div>
          <button onClick={fetchAll} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {/* PROJECT SECTION */}
      <section className="psd-section">
        <h2>Project Details</h2>
        <div className="psd-form-grid">
          <label>
            Name
            <input
              type="text"
              value={project.name || ""}
              onChange={(e) => handleProjectChange("name", e.target.value)}
            />
          </label>
          <label>
            Location
            <input
              type="text"
              value={project.location || ""}
              onChange={(e) => handleProjectChange("location", e.target.value)}
            />
          </label>
          <label>
            Developer
            <input
              type="text"
              value={project.developer || ""}
              onChange={(e) => handleProjectChange("developer", e.target.value)}
            />
          </label>
          <label>
            RERA No
            <input
              type="text"
              value={project.rera_no || ""}
              onChange={(e) => handleProjectChange("rera_no", e.target.value)}
            />
          </label>
          <label>
            Price / Sq.ft
            <input
              type="number"
              value={project.price_per_sqft || ""}
              onChange={(e) =>
                handleProjectChange("price_per_sqft", e.target.value)
              }
            />
          </label>
          <label>
            Notes
            <textarea
              rows={2}
              value={project.notes || ""}
              onChange={(e) => handleProjectChange("notes", e.target.value)}
            />
          </label>
        </div>
        <button onClick={saveProject} disabled={saving}>
          {saving ? "Saving..." : "Save Project"}
        </button>
      </section>

      {/* TOWERS SECTION */}
      <section className="psd-section">
        <h2>Towers</h2>
        <table className="psd-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Total Floors</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {towers.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <input
                    value={t.name || ""}
                    onChange={(e) =>
                      handleTowerChange(t.id, "name", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={t.total_floors || ""}
                    onChange={(e) =>
                      handleTowerChange(t.id, "total_floors", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={t.status || ""}
                    onChange={(e) =>
                      handleTowerChange(t.id, "status", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={t.notes || ""}
                    onChange={(e) =>
                      handleTowerChange(t.id, "notes", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button onClick={() => saveTower(t)}>Save</button>
                </td>
              </tr>
            ))}
            {towers.length === 0 && (
              <tr>
                <td colSpan="6">No towers found for this project.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* MILESTONE PLANS SECTION */}
      <section className="psd-section">
        <h2>Milestone Plans</h2>
        {milestonePlans.length === 0 ? (
          <div>No milestone plans found.</div>
        ) : (
          milestonePlans.map((p) => {
            // Prefer slabs returned inline with the plan; fall back to global list
            const planSlabs =
              (Array.isArray(p.slabs) && p.slabs.length > 0
                ? p.slabs
                : milestoneSlabs
              ).filter((s) => s.plan === p.id || String(s.plan) === String(p.id) || !s.plan);
            return (
              <div key={p.id} style={{ marginBottom: "32px" }}>
                <table className="psd-table" style={{ marginBottom: "16px" }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Calc Mode</th>
                      <th>Amount</th>
                      <th>Notes</th>
                      <th>Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{p.id}</td>
                      <td>
                        <input
                          value={p.name || ""}
                          onChange={(e) =>
                            handleMilestonePlanChange(p.id, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={p.status || ""}
                          onChange={(e) =>
                            handleMilestonePlanChange(p.id, "status", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={p.calc_mode || "AMOUNT"}
                          onChange={(e) =>
                            handleMilestonePlanChange(
                              p.id,
                              "calc_mode",
                              e.target.value
                            )
                          }
                        >
                          <option value="AMOUNT">Amount</option>
                          <option value="PERCENTAGE">Percentage</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={p.amount || ""}
                          onChange={(e) =>
                            handleMilestonePlanChange(p.id, "amount", e.target.value)
                          }
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          value={p.notes || ""}
                          onChange={(e) =>
                            handleMilestonePlanChange(p.id, "notes", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button onClick={() => saveMilestonePlan(p)}>Save</button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Milestone Slabs for this Plan */}
                <div style={{ marginLeft: "24px", marginTop: "16px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
                    Milestone Slabs for Plan: {p.name}
                  </h3>
                  {planSlabs.length > 0 ? (
                    <table className="psd-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Order</th>
                          <th>Name</th>
                          <th>Percentage</th>
                          <th>Amount</th>
                          <th>Remarks</th>
                          <th>Save</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planSlabs.map((slab) => (
                          <tr key={slab.id}>
                            <td>{slab.id}</td>
                            <td>{slab.order_index ?? slab.orderindex ?? "-"}</td>
                            <td>
                              <input
                                value={slab.name || ""}
                                onChange={(e) =>
                                  handleMilestoneSlabChange(slab.id, "name", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={slab.percentage || ""}
                                onChange={(e) =>
                                  handleMilestoneSlabChange(
                                    slab.id,
                                    "percentage",
                                    e.target.value
                                  )
                                }
                                step="0.01"
                                disabled={p.calc_mode === "AMOUNT"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={slab.amount || ""}
                                onChange={(e) =>
                                  handleMilestoneSlabChange(
                                    slab.id,
                                    "amount",
                                    e.target.value
                                  )
                                }
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                value={slab.remarks || ""}
                                onChange={(e) =>
                                  handleMilestoneSlabChange(
                                    slab.id,
                                    "remarks",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <button onClick={() => saveMilestoneSlab(slab)}>
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: "12px", color: "#666" }}>
                      No milestone slabs found for this plan.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* PAYMENT PLANS SECTION */}
<section className="psd-section">
  <h2>Payment Plans</h2>

  {paymentPlans.length === 0 && <div>No payment plans found</div>}

  {paymentPlans.map((plan) => (
    <div key={plan.id} style={{ marginBottom: 32 }}>
      {/* -------- Payment Plan -------- */}
      <table className="psd-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Name</th>
            <th>Total %</th>
            <th>Save</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{plan.id}</td>
            <td>
              <input
                value={plan.code || ""}
                onChange={(e) =>
                  handlePaymentPlanChange(plan.id, "code", e.target.value)
                }
              />
            </td>
            <td>
              <input
                value={plan.name || ""}
                onChange={(e) =>
                  handlePaymentPlanChange(plan.id, "name", e.target.value)
                }
              />
            </td>
            <td>{plan.total_percentage ?? "-"}</td>
            <td>
              <button onClick={() => savePaymentPlan(plan)}>Save</button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* -------- Payment Slabs -------- */}
      <div style={{ marginLeft: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>
          Payment Slabs
        </h3>

        {plan.slabs && plan.slabs.length ? (
          <table className="psd-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Order</th>
                <th>Name</th>
                <th>Percentage</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {plan.slabs.map((slab) => (
                <tr key={slab.id}>
                  <td>{slab.id}</td>
                  <td>{slab.order_index}</td>
                  <td>
                    <input
                      value={slab.name || ""}
                      onChange={(e) =>
                        handlePaymentSlabChange(
                          slab.id,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={slab.percentage || ""}
                      onChange={(e) =>
                        handlePaymentSlabChange(
                          slab.id,
                          "percentage",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => savePaymentSlab(slab)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#777" }}>No slabs</div>
        )}
      </div>
    </div>
  ))}
</section>


      {/* PROJECT BANKS SECTION */}
      <section className="psd-section">
        <h2>Project Banks</h2>
        <table className="psd-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bank Branch</th>
              <th>APF Number</th>
              <th>Status</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {projectBanks.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>
                  {/* assuming backend returns nested bank_branch object */}
                  {b.bank_branch?.bank?.name} / {b.bank_branch?.branch_name}
                </td>
                <td>
                  <input
                    value={b.apf_number || ""}
                    onChange={(e) =>
                      handleProjectBankChange(
                        b.id,
                        "apf_number",
                        e.target.value
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={b.status || ""}
                    onChange={(e) =>
                      handleProjectBankChange(b.id, "status", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button onClick={() => saveProjectBank(b)}>Save</button>
                </td>
              </tr>
            ))}
            {projectBanks.length === 0 && (
              <tr>
                <td colSpan="5">No project banks configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* you already have floors, units, slabs in state;
          you can add similar sections later */}
    </div>
  );
};

export default ProjectSetupDetail;