import { useState } from "react";
import { PaymentAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function PaymentPlanForm({ projects, onSuccess }) {
  const [paymentPlanForm, setPaymentPlanForm] = useState({
    code: "",
    name: "",
    project: "",
  });

  const [paymentSlabs, setPaymentSlabs] = useState([
    { name: "", percentage: "" },
  ]);

  const updatePaymentPlanForm = (key, val) =>
    setPaymentPlanForm((f) => ({ ...f, [key]: val }));

  const addPaymentSlab = () => {
    setPaymentSlabs((s) => [...s, { name: "", percentage: "" }]);
  };

  const delPaymentSlab = (idx) => {
    if (paymentSlabs.length <= 1) return;
    setPaymentSlabs((s) => s.filter((_, i) => i !== idx));
  };

  const updatePaymentSlab = (idx, key, val) => {
    setPaymentSlabs((slabs) =>
      slabs.map((slab, i) => (i === idx ? { ...slab, [key]: val } : slab))
    );
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentPlanForm.code || !paymentPlanForm.name || !paymentPlanForm.project) {
      alert("Plan ID, Plan Name and Project are required");
      return;
    }

    // Validate percentage sum ≤ 100%
    const sum = paymentSlabs.reduce(
      (acc, s) => acc + (s.percentage ? Number(s.percentage) : 0),
      0
    );
    
    if (sum > 100.0001) {
      alert("Total percentage cannot exceed 100%");
      return;
    }

    try {
      // Step 1: Create Payment Plan
      const plan = await PaymentAPI.createPlan({
        code: paymentPlanForm.code,
        name: paymentPlanForm.name,
        project: Number(paymentPlanForm.project),
      });

      // Step 2: Create each Slab separately
      for (let i = 0; i < paymentSlabs.length; i++) {
        const s = paymentSlabs[i];
        if (!s.name || !s.percentage) continue;

        await PaymentAPI.createSlab({
          plan: plan.id,
          orderindex: i + 1,
          name: s.name,
          percentage: Number(s.percentage),
        });
      }

      alert("Payment plan saved successfully!");
      
      setPaymentPlanForm({
        code: "",
        name: "",
        project: "",
      });
      setPaymentSlabs([{ name: "", percentage: "" }]);
      
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save payment plan");
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Add Payment Plan</h3>
        <button type="button" className="btn-import">
          <span className="import-icon">📄</span>
          IMPORT EXCEL
        </button>
      </div>

      <form onSubmit={handleSavePayment} className="project-form">
        {/* Row 1: Payment Plan ID, Plan Name, Project */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Payment Plan ID <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={paymentPlanForm.code}
              onChange={(e) => updatePaymentPlanForm("code", e.target.value)}
              placeholder="e.g., PPL001"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              Payment Plan Name <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={paymentPlanForm.name}
              onChange={(e) => updatePaymentPlanForm("name", e.target.value)}
              placeholder="Enter plan name"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              Select Project <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={paymentPlanForm.project}
              onChange={(e) => updatePaymentPlanForm("project", e.target.value)}
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
        </div>

        {/* Payment Slabs Section */}
        <div className="form-section-divider">
          <h3 className="form-section-title">Slabs</h3>
        </div>

        {paymentSlabs.map((slab, idx) => (
          <div key={idx} className="slab-row">
            <input
              className="field-input"
              placeholder="Name"
              value={slab.name}
              onChange={(e) => updatePaymentSlab(idx, "name", e.target.value)}
            />
            <input
              className="field-input"
              type="number"
              placeholder="Percentage"
              value={slab.percentage}
              onChange={(e) =>
                updatePaymentSlab(idx, "percentage", e.target.value)
              }
              step="0.01"
              min="0"
              max="100"
            />
            {paymentSlabs.length > 1 && (
              <button
                type="button"
                className="btn-danger-small"
                onClick={() => delPaymentSlab(idx)}
                title="Remove Slab"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="form-actions-split">
          <button type="button" className="btn-secondary" onClick={addPaymentSlab}>
            ADD SLAB
          </button>
          <button type="submit" className="btn-add-project">
            ADD
          </button>
        </div>
      </form>
    </div>
  );
}
