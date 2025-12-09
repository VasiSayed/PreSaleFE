import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    signature: null,
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // signature file
  const [signatureFile, setSignatureFile] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/accounts/users/me/");
      setProfile(res.data);
      setOriginalProfile(res.data);
    } catch (err) {
      console.error("GET /accounts/users/me/ failed", err);
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // If signature exists → use FormData
      const formData = new FormData();
      formData.append("first_name", profile.first_name || "");
      formData.append("last_name", profile.last_name || "");
      formData.append("email", profile.email || "");

      if (signatureFile) {
        formData.append("signature", signatureFile);
      }

      await axiosInstance.patch("/accounts/users/me/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Profile updated successfully.");
      await loadProfile();
      setEditing(false);
      setSignatureFile(null);
    } catch (err) {
      console.error("PATCH /accounts/users/me/ failed", err);
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setProfile(originalProfile || profile);
    setEditing(false);
    setError("");
    setSuccess("");
    setSignatureFile(null);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center" style={{ padding: 40 }}>
        Loading profile...
      </div>
    );
  }

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const InfoRow = ({ label, value }) => (
    <div style={styles.row}>
      <div style={styles.rowLabel}>{label}</div>
      <div style={styles.rowValue}>{value || "—"}</div>
    </div>
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>My Profile</h2>
            <p style={styles.subtitle}>
              Manage the information associated with your account.
            </p>
          </div>
          {!editing && (
            <button style={styles.editButton} onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>

        {(error || success) && (
          <div
            style={{
              ...styles.alert,
              ...(error ? styles.alertError : styles.alertSuccess),
            }}
          >
            {error || success}
          </div>
        )}

        {/* ===== VIEW MODE ===== */}
        {!editing && (
          <>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Account details</h3>

              <InfoRow label="Username" value={profile.username} />
              <InfoRow label="Role" value={profile.role} />
              <InfoRow label="Admin" value={profile.admin} />
              <InfoRow label="Created By" value={profile.created_by} />
              <InfoRow
                label="Active"
                value={profile.is_active ? "Active" : "Inactive"}
              />
              <InfoRow
                label="Date Joined"
                value={profile.date_joined?.split("T")[0]}
              />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal information</h3>
              <InfoRow label="First name" value={profile.first_name} />
              <InfoRow label="Last name" value={profile.last_name} />
              <InfoRow label="Email" value={profile.email} />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Signature</h3>
              {profile.signature ? (
                <img
                  src={profile.signature}
                  alt="signature"
                  style={{ width: 180, height: "auto", borderRadius: 4 }}
                />
              ) : (
                <div style={styles.rowValue}>No signature uploaded</div>
              )}
            </div>
          </>
        )}

        {/* ===== EDIT MODE ===== */}
        {editing && (
          <>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Account details</h3>
              <div style={styles.row}>
                <label style={styles.label}>Username</label>
                <input
                  disabled
                  value={profile.username}
                  style={styles.inputDisabled}
                />
              </div>
              <div style={styles.row}>
                <label style={styles.label}>Role</label>
                <input
                  disabled
                  value={profile.role}
                  style={styles.inputDisabled}
                />
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal information</h3>

              <div style={styles.row}>
                <label style={styles.label}>First name</label>
                <input
                  value={profile.first_name || ""}
                  style={styles.input}
                  onChange={handleChange("first_name")}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Last name</label>
                <input
                  value={profile.last_name || ""}
                  style={styles.input}
                  onChange={handleChange("last_name")}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={profile.email || ""}
                  style={styles.input}
                  onChange={handleChange("email")}
                />
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Signature</h3>

              {profile.signature && !signatureFile && (
                <>
                  <img
                    src={profile.signature}
                    alt="signature"
                    style={{ width: 180, height: "auto", borderRadius: 4 }}
                  />
                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={() => {
                      setProfile({ ...profile, signature: null });
                    }}
                  >
                    Remove Signature
                  </button>
                </>
              )}

              {(!profile.signature || signatureFile) && (
                <div style={styles.row}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSignatureFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <button
                style={{
                  ...styles.buttonPrimary,
                  ...(saving ? styles.buttonDisabled : {}),
                }}
                disabled={saving}
                onClick={saveProfile}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                style={styles.buttonSecondary}
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "#f4f6fb",
    padding: "40px 16px",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: 560,
    margin: "0 auto",
    padding: 24,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 0,
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginTop: 16,
    marginBottom: 12,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 14,
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: "#111827",
    padding: "7px 0",
    borderBottom: "1px dashed #e5e7eb",
  },
  label: {
    display: "block",
    marginBottom: 4,
    fontSize: 13,
    fontWeight: 500,
    color: "#4b5563",
  },
  input: {
    width: "100%",
    padding: "9px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
  },
  inputDisabled: {
    width: "100%",
    padding: "9px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 14,
    background: "#f9fafb",
    color: "#6b7280",
  },
  actions: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  buttonPrimary: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    background: "#102a54",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonSecondary: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "default",
  },
  editButton: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  alert: {
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 13,
    marginTop: 8,
  },
  alertError: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  alertSuccess: {
    background: "#ecfdf3",
    color: "#15803d",
    border: "1px solid #bbf7d0",
  },
};
