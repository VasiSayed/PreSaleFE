import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./LeadDetails.css";

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const stages = [
    "New Lead",
    "Stage 2",
    "Stage 3",
    "Stage 4",
    "Stage 5",
    "Stage 6",
    "Stage 7",
    "Won",
  ];

  return (
    <div className="lead-page">
      {/* ---------------- TOP HEADER ---------------- */}
      <div className="lead-header">
        <div className="lead-header-left">
          <div className="lead-title">ANURAG SHARMA</div>

          <div className="lead-header-grid">
            <div className="field-compact">
              <label>Lead Owner:</label>
              <input defaultValue="Pratik Bedekar" readOnly />
            </div>
            <div className="field-compact">
              <label>Mobile:</label>
              <input defaultValue="90xxxxxx98" readOnly />
            </div>
            <div className="field-compact">
              <label>Email:</label>
              <input defaultValue="anxxxxxxxx.com" readOnly />
            </div>
            <div className="field-compact">
              <label>Lead Status:</label>
              <input defaultValue="Fresh" readOnly />
            </div>
          </div>
        </div>

        <div className="lead-header-right">
          <div className="action-row-top">
            <button className="card-btn">Inventory</button>
            <button className="card-btn active">Book Flat</button>
            <button className="card-btn">Payments</button>
            <button className="card-btn">Payment Link</button>
          </div>
          <div className="action-row-bottom">
            <button className="card-btn small">Send Feedback</button>
            <button className="card-btn small">Save</button>
          </div>
        </div>
      </div>

      {/* ---------------- STAGE BAR ---------------- */}
      <div className="lead-stages">
        {stages.map((stage, idx) => (
          <div
            key={stage}
            className={`stage-item ${
              idx === stages.length - 1 ? "stage-active" : ""
            }`}
          >
            <span className="stage-dot" />
            <span className="stage-label">{stage}</span>
          </div>
        ))}
      </div>

      {/* ---------------- MAIN CONTENT SPLIT ---------------- */}
      <div className="content-split">
        {/* LEFT – Lead Information box */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span>Lead Information</span>
            <button className="link-btn">Edit</button>
          </div>
          <div className="panel-body blank-area" />
        </div>

        {/* RIGHT – Activity / Documents */}
        <div className="panel panel-right">
          {/* Tabs */}
          <div className="tabs">
            <button className="tab active">Activity</button>
            <button className="tab">Comment</button>
            <button className="tab">Booking</button>
            <button className="tab">SMS</button>
            <button className="tab">Email</button>
            <button className="tab">Zoom</button>
          </div>

          {/* Activity form */}
          <div className="activity-wrapper">
            <div className="activity-row">
              <div className="activity-icon bubble" />
              <div className="activity-card">
                <div className="field-full">
                  <label>Contact Customer</label>
                  <input className="input-plain" readOnly />
                </div>
                <div className="field-full">
                  <label>Things to do</label>
                  <textarea className="input-plain tall" readOnly />
                </div>

                <div className="activity-footer">
                  <div className="date-pill">
                    Mon, November 17, 15:00
                    <span className="bell">🔔</span>
                  </div>
                  <button className="dropdown-btn">Actions ▾</button>
                </div>

                <div className="activity-buttons">
                  <button className="btn-primary">Save</button>
                  <button className="btn-secondary">Cancel</button>
                </div>
              </div>
            </div>

            {/* Add new activity */}
            <div className="activity-row gap-top">
              <div className="activity-icon plus">+</div>
              <div className="activity-strip">
                <div className="strip-title">Add a new activity</div>
                <div className="strip-sub">
                  Plan your next action in the deal to never forget about the
                  customer
                </div>
              </div>
            </div>

            {/* Existing activity */}
            <div className="activity-row">
              <div className="activity-icon info">i</div>
              <div className="activity-strip">
                <div className="strip-title">Activity1</div>
                <div className="strip-sub">
                  Plan your next action in the deal to never forget about the
                  customer
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="documents-wrapper">
            <div className="documents-header">
              <span>Documents</span>
              <button className="link-btn">Edit</button>
            </div>
            <div className="documents-body">
              <div className="documents-row">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="doc-card">
                    <div className="doc-icon" />
                    <div className="doc-label">Document {n}</div>
                  </div>
                ))}

                <button className="doc-card add-doc">
                  <span className="add-symbol">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTIONS ================= */}

      {/* CP Info */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>CP Information</span>
          <button className="icon-round">+</button>
        </div>
        <div className="section-body">
          <div className="field-inline">
            <label>Referral Code:</label>
            <input />
          </div>
        </div>
      </div>

      {/* Proposal Form */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Proposal Form</span>
          <button className="icon-round">+</button>
        </div>
        <div className="section-body">
          <label className="attach-label">Attachment:</label>
          <div className="attachment-box">
            <span className="add-symbol">+</span>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Additional Information</span>
          <button className="icon-round">+</button>
        </div>
        <div className="section-body section-grid">
          {/* left column */}
          <div className="column">
            <div className="field-full">
              <label>Date of Birth</label>
              <input />
            </div>
            <div className="field-full">
              <label>Date of Anniversary</label>
              <input />
            </div>
            <div className="field-full">
              <label>Already a part of the family?</label>
              <div className="inline-radio">
                <input type="radio" /> <span>Yes</span>
              </div>
            </div>
            <div className="field-full">
              <label>Project Name</label>
              <input />
            </div>
            <div className="field-full">
              <label>Visiting On Behalf</label>
              <select>
                <option>Select</option>
              </select>
            </div>
            <div className="field-full">
              <label>Current Residence Ownership</label>
              <select>
                <option>Select</option>
              </select>
            </div>
            <div className="field-full">
              <label>Current Residence type</label>
              <select>
                <option>Select</option>
              </select>
            </div>
            <div className="field-full">
              <label>Family Size</label>
              <select>
                <option>Select</option>
              </select>
            </div>
            <div className="field-full">
              <label>Possession desired in</label>
              <select>
                <option>Select</option>
              </select>
            </div>
          </div>

          {/* right column */}
          <div className="column">
            <div className="field-full">
              <label>Secondary Email</label>
              <input />
            </div>
            <div className="field-full">
              <label>Alternate Mobile</label>
              <input />
            </div>
            <div className="field-full">
              <label>Alternate Tel (Res)</label>
              <input />
            </div>
            <div className="field-full">
              <label>Alternate Tel (Off)</label>
              <input />
            </div>
            <div className="field-full">
              <label>Facebook</label>
              <input />
            </div>
            <div className="field-full">
              <label>Twitter</label>
              <input />
            </div>
            <div className="field-full">
              <label>LinkedIn</label>
              <input />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Professional Information</span>
          <button className="icon-round">+</button>
        </div>
        <div className="section-body section-grid">
          <div className="column">
            <div className="field-full">
              <label>Occupation</label>
              <select>
                <option>Select</option>
              </select>
            </div>
            <div className="field-full">
              <label>Name of the Organization</label>
              <input />
            </div>
            <div className="field-full">
              <label>Designation</label>
              <select>
                <option>Select</option>
              </select>
            </div>
          </div>
          <div className="column">
            <div className="field-full">
              <label>Office Location</label>
              <input />
            </div>
            <div className="field-full">
              <label>Pin Code</label>
              <input />
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Address Information</span>
          <button className="icon-round">+</button>
        </div>
        <div className="section-body section-grid">
          <div className="column">
            <div className="field-full">
              <label>Flat no. / Building</label>
              <input defaultValue="Guwahati" />
            </div>
            <div className="field-full">
              <label>Area</label>
              <input />
            </div>
            <div className="field-full">
              <label>Pin Code</label>
              <input defaultValue="781003" />
            </div>
            <div className="field-full">
              <label>City</label>
              <input defaultValue="Kamrup" />
            </div>
          </div>
          <div className="column">
            <div className="field-full">
              <label>State</label>
              <input defaultValue="Assam" />
            </div>
            <div className="field-full">
              <label>Country</label>
              <input defaultValue="India" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="footer-buttons">
        <button className="btn-secondary big" onClick={() => navigate("/leads")}>
          Cancel
        </button>
        <button className="btn-primary big">Submit</button>
      </div>
    </div>
  );
}