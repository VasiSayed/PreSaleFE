import { useState } from "react";
import { BankAPI } from "../../../api/endpoints";
import axiosInstance from "../../../api/axiosInstance";

export default function BankForm({ setup, projects, onSuccess }) {
  const [activeTab, setActiveTab] = useState("customer"); // customer or project
  
  const [bankForm, setBankForm] = useState({
    // Bank master
    bankcode: "",
    bankname: "",
    banktype: "",
    bankcategory: "",
    
    // Branch
    branchname: "",
    branchcode: "",
    ifsc: "",
    micr: "",
    address: "",
    contactname: "",
    contactphone: "",
    contactemail: "",
    
    // Project link
    project: "",
    apfnumber: "",
    projectbankstatus: "ACTIVE",
    productIds: [],
  });

  const updateBankForm = (key, val) =>
    setBankForm((f) => ({ ...f, [key]: val }));

  const toggleProduct = (productId) => {
    setBankForm((b) => {
      const exists = b.productIds.includes(productId);
      return {
        ...b,
        productIds: exists
          ? b.productIds.filter((x) => x !== productId)
          : [...b.productIds, productId],
      };
    });
  };

  const handleSaveBankAll = async (e) => {
    e.preventDefault();
    
    if (!bankForm.project || !bankForm.bankcode || !bankForm.bankname) {
      alert("Project, Bank ID, and Bank Name are required");
      return;
    }

    const payload = {
  bank: {
    code: bankForm.bankcode,
    name: bankForm.bankname,
    bank_type: bankForm.banktype ? Number(bankForm.banktype) : null,      // ← FIXED: bank_type
    bank_category: bankForm.bankcategory ? Number(bankForm.bankcategory) : null,  // ← FIXED: bank_category
  },
  branch: {
    branch_name: bankForm.branchname || "",     // ← FIXED: branch_name
    branch_code: bankForm.branchcode || "",     // ← FIXED: branch_code
    ifsc: bankForm.ifsc || "",
    micr: bankForm.micr || "",
    address: bankForm.address || "",
    contact_name: bankForm.contactname || "",   // ← FIXED: contact_name
    contact_phone: bankForm.contactphone || "", // ← FIXED: contact_phone
    contact_email: bankForm.contactemail || "", // ← FIXED: contact_email
  },
  project_link: {                               // ← FIXED: project_link (not projectlink)
    project: Number(bankForm.project),
    apf_number: bankForm.apfnumber || "",       // ← FIXED: apf_number
    status: bankForm.projectbankstatus || "ACTIVE",
    product_ids: bankForm.productIds,           // ← FIXED: product_ids
  },
};

    try {
      await BankAPI.createAll(payload);
      alert("Bank, Branch & Project Link created successfully!");
      
      setBankForm({
        bankcode: "",
        bankname: "",
        banktype: "",
        bankcategory: "",
        branchname: "",
        branchcode: "",
        ifsc: "",
        micr: "",
        address: "",
        contactname: "",
        contactphone: "",
        contactemail: "",
        project: "",
        apfnumber: "",
        projectbankstatus: "ACTIVE",
        productIds: [],
      });
      
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save bank");
    }
  };

const loanProducts = setup?.lookups?.loan_products || [];


  return (
    <div className="project-form-container">
      <div className="form-header">
        <h3>Add Bank</h3>
        <button type="button" className="btn-import">
          <span className="import-icon">📄</span>
          IMPORT EXCEL
        </button>
      </div>

      <form onSubmit={handleSaveBankAll} className="project-form">
        {/* Bank Master Section */}
        <div className="form-section-divider">
          <h3 className="form-section-title">Bank Master</h3>
        </div>

        {/* Row 1: Project, Bank ID, Bank Type */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              Project <span className="required">*</span>
            </label>
            <select
              className="field-input"
              value={bankForm.project}
              onChange={(e) => updateBankForm("project", e.target.value)}
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              Bank ID <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={bankForm.bankcode}
              onChange={(e) => updateBankForm("bankcode", e.target.value)}
              placeholder="e.g., BNK001"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Bank Type</label>
            <select
              className="field-input"
              value={bankForm.banktype}
              onChange={(e) => updateBankForm("banktype", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.bank_types?.map((x) => (

                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Bank Category, Bank Name, Branch Name */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Bank Category</label>
            <select
              className="field-input"
              value={bankForm.bankcategory}
              onChange={(e) => updateBankForm("bankcategory", e.target.value)}
            >
              <option value="">Select</option>
              {setup?.lookups?.bank_categories?.map((x) => (

                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">
              Bank Name <span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={bankForm.bankname}
              onChange={(e) => updateBankForm("bankname", e.target.value)}
              placeholder="Enter bank name"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">Branch Name</label>
            <input
              className="field-input"
              value={bankForm.branchname}
              onChange={(e) => updateBankForm("branchname", e.target.value)}
              placeholder="Enter branch name"
            />
          </div>
        </div>

        {/* Branch Details Section */}
        <div className="form-section-divider">
          <h3 className="form-section-title">Branch Details</h3>
        </div>

        {/* Row 3: Branch Code, IFSC Code, MICR Code */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Branch Code</label>
            <input
              className="field-input"
              value={bankForm.branchcode}
              onChange={(e) => updateBankForm("branchcode", e.target.value)}
              placeholder="Enter branch code"
            />
          </div>

          <div className="form-field">
            <label className="field-label">IFSC Code</label>
            <input
              className="field-input"
              value={bankForm.ifsc}
              onChange={(e) => updateBankForm("ifsc", e.target.value)}
              placeholder="Enter IFSC code"
            />
          </div>

          <div className="form-field">
            <label className="field-label">MICR Code</label>
            <input
              className="field-input"
              value={bankForm.micr}
              onChange={(e) => updateBankForm("micr", e.target.value)}
              placeholder="Enter MICR code"
            />
          </div>
        </div>

        {/* Row 4: Contact Person, Contact Phone, Contact Email */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Contact Person</label>
            <input
              className="field-input"
              value={bankForm.contactname}
              onChange={(e) => updateBankForm("contactname", e.target.value)}
              placeholder="Enter contact name"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Contact Phone</label>
            <input
              className="field-input"
              type="tel"
              value={bankForm.contactphone}
              onChange={(e) => updateBankForm("contactphone", e.target.value)}
              placeholder="Enter phone"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Contact Email</label>
            <input
              className="field-input"
              type="email"
              value={bankForm.contactemail}
              onChange={(e) => updateBankForm("contactemail", e.target.value)}
              placeholder="Enter email"
            />
          </div>
        </div>

        {/* Address */}
        <div className="form-field-full">
          <label className="field-label">Address</label>
          <textarea
            className="field-textarea"
            rows={2}
            value={bankForm.address}
            onChange={(e) => updateBankForm("address", e.target.value)}
            placeholder="Enter address"
          />
        </div>

        {/* Project Link Section with Tabs */}
        <div className="form-section-divider">
          <h3 className="form-section-title">Project Link Details</h3>
        </div>

        {/* Tabs */}
        <div className="loan-tabs">
          <button
            type="button"
            className={`loan-tab ${activeTab === "customer" ? "active" : ""}`}
            onClick={() => setActiveTab("customer")}
          >
            CUSTOMER LOAN DETAILS
          </button>
          <button
            type="button"
            className={`loan-tab ${activeTab === "project" ? "active" : ""}`}
            onClick={() => setActiveTab("project")}
          >
            PROJECT LOAN DETAILS
          </button>
        </div>

        {/* Customer Loan Details Tab */}
        {activeTab === "customer" && (
          <div className="tab-content">
            <div className="form-field">
              <label className="field-label">APF Number</label>
              <input
                className="field-input"
                value={bankForm.apfnumber}
                onChange={(e) => updateBankForm("apfnumber", e.target.value)}
                placeholder="Enter APF number"
              />
            </div>

            <div className="form-field-full">
              <label className="field-label">Loan Products Available</label>
              <div className="checkbox-grid-inline">
                {loanProducts.map((lp) => (
                  <label className="checkbox-label-inline" key={lp.id}>
                    <input
                      type="checkbox"
                      checked={bankForm.productIds.includes(lp.id)}
                      onChange={() => toggleProduct(lp.id)}
                    />
                    <span>{lp.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project Loan Details Tab */}
        {activeTab === "project" && (
          <div className="tab-content">
            <div className="form-field">
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={bankForm.projectbankstatus}
                onChange={(e) => updateBankForm("projectbankstatus", e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            {/* Add more project-specific fields here if needed */}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions-right">
          <button type="submit" className="btn-add-project">
            SAVE
          </button>
        </div>
      </form>
    </div>
  );
}
