// src/pages/Profile.jsx (or wherever you keep it)
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { brand } = useAuth() || {};

  // ---------- THEME : MERGE BRAND_THEME + FALLBACKS ----------
  const theme = useMemo(() => {
    let storedTheme = null;
    try {
      const stored = localStorage.getItem("BRAND_THEME");
      if (stored) {
        storedTheme = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse BRAND_THEME from localStorage", e);
    }

    const base = storedTheme || brand || {};

    return {
      background: base.background_color || "#f4f6fb",
      cardBg: base.secondary_color || "#ffffff",
      primary: base.button_primary_bg || base.primary_color || "#102a54",
      primaryText: base.button_primary_text || "#ffffff",
      heading: base.heading_color || "#111827",
      accent: base.accent_color || "#2563EB",
      font:
        base.font_family ||
        "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      baseFontSize: base.base_font_size || 14,
    };
  }, [brand]);

  // ---------- STATE ----------
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    signature: null,
    admin: null,
    created_by: null,
    is_active: true,
    date_joined: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);

  // 🔹 Authorized projects + active project
  const [authorizedProjects, setAuthorizedProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(
    () => localStorage.getItem("ACTIVE_PROJECT_ID") || ""
  );

  // ---------- STYLES (BASED ON THEME) ----------
  const styles = useMemo(
    () => ({
      pageWrapper: {
        minHeight: "100vh",
        background: theme.background,
        padding: "40px 16px",
        boxSizing: "border-box",
        fontFamily: theme.font,
        fontSize: theme.baseFontSize,
      },
      card: {
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
        borderRadius: 16,
        background: theme.cardBg,
        boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
      },
      header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
      },
      titleBlock: {
        display: "flex",
        alignItems: "center",
        gap: 12,
      },
      avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: "999px",
        background: theme.primary,
        color: theme.primaryText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: 18,
      },
      title: {
        margin: 0,
        fontSize: 22,
        fontWeight: 600,
        color: theme.heading,
      },
      subtitle: {
        marginTop: 2,
        marginBottom: 0,
        fontSize: 13,
        color: "#6b7280",
      },
      section: {
        marginTop: 18,
        marginBottom: 12,
        borderTop: "1px solid #e5e7eb",
        paddingTop: 14,
      },
      sectionTitleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      },
      sectionTitle: {
        margin: 0,
        fontSize: 13,
        fontWeight: 600,
        color: theme.heading,
        textTransform: "uppercase",
        letterSpacing: 0.7,
      },
      sectionTag: {
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        background: "rgba(37, 99, 235, 0.06)",
        color: theme.accent,
      },
      row: {
        display: "flex",
        flexDirection: "column",
        marginBottom: 10,
      },
      rowLabel: {
        fontSize: 12,
        fontWeight: 500,
        color: "#4b5563",
        marginBottom: 2,
      },
      rowValue: {
        fontSize: 14,
        color: "#111827",
        padding: "6px 0",
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
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
      },
      inputDisabled: {
        width: "100%",
        padding: "9px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 14,
        background: "#f9fafb",
        color: "#6b7280",
      },
      actions: {
        marginTop: 18,
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
      },
      buttonPrimary: {
        padding: "9px 18px",
        borderRadius: 999,
        border: "none",
        background: theme.primary,
        color: theme.primaryText,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
      },
      buttonSecondary: {
        padding: "9px 16px",
        borderRadius: 999,
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
      badge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        background: "rgba(16, 42, 84, 0.06)",
        color: theme.primary,
      },
      tagSmall: {
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 999,
        background: "#f3f4f6",
        color: "#4b5563",
        marginLeft: 6,
      },
      signatureBox: {
        padding: 8,
        borderRadius: 8,
        border: "1px dashed #d1d5db",
        background: "#f9fafb",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      },
      projectRadioRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        fontSize: 14,
        color: "#111827",
        cursor: "pointer",
      },
      projectHint: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 8,
      },
    }),
    [theme]
  );

  // ---------- HELPERS ----------
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
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

      const formData = new FormData();
      formData.append("first_name", profile.first_name || "");
      formData.append("last_name", profile.last_name || "");
      formData.append("email", profile.email || "");

      if (signatureFile) {
        formData.append("signature", signatureFile);
      } else if (profile.signature === null) {
        // If user removed signature, send explicit null
        formData.append("signature", "");
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

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const InfoRow = ({ label, value }) => (
    <div style={styles.row}>
      <div style={styles.rowLabel}>{label}</div>
      <div style={styles.rowValue}>{value || "—"}</div>
    </div>
  );

  const initials = (() => {
    const fn = (profile.first_name || "").trim();
    const ln = (profile.last_name || "").trim();
    const a = fn ? fn[0] : "";
    const b = ln ? ln[0] : "";
    const fallback = (profile.username || "").charAt(0);
    return (a + b || fallback || "?").toUpperCase();
  })();

  // ---------- LOAD PROFILE + AUTHORISED PROJECTS ----------
  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("AUTHORIZE_PROJECTS");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          setAuthorizedProjects(list);
        }
      }
    } catch (err) {
      console.error("Failed to parse AUTHORIZE_PROJECTS", err);
    }
  }, []);

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: 40, fontSize: 14 }}>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        {/* ---------- HEADER ---------- */}
        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <div style={styles.avatarCircle}>{initials}</div>
            <div>
              <h2 style={styles.title}>My Profile</h2>
              <p style={styles.subtitle}>
                Manage your personal details, signature and active project.
              </p>
            </div>
          </div>
          {!editing && (
            <button style={styles.editButton} onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>

        {/* ALERTS */}
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

        {/* ================== VIEW MODE ================== */}
        {!editing && (
          <>
            {/* Account Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Account Details</h3>
                <span style={styles.sectionTag}>Account</span>
              </div>

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

            {/* Personal Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Personal Information</h3>
                <span style={styles.sectionTag}>Profile</span>
              </div>
              <InfoRow label="First name" value={profile.first_name} />
              <InfoRow label="Last name" value={profile.last_name} />
              <InfoRow label="Email" value={profile.email} />
            </div>

            {/* Authorized Projects (view) */}
            {authorizedProjects.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitleRow}>
                  <h3 style={styles.sectionTitle}>Authorized Projects</h3>
                  <span style={styles.sectionTag}>Access</span>
                </div>

                {authorizedProjects.length === 1 ? (
                  <InfoRow
                    label="Active Project"
                    value={
                      authorizedProjects[0].name ||
                      `#${authorizedProjects[0].id}`
                    }
                  />
                ) : (
                  <>
                    <div style={styles.projectHint}>
                      You have access to multiple projects. The active project
                      will be used for dashboards & filters.
                    </div>
                    {authorizedProjects.map((p) => (
                      <div key={p.id} style={styles.row}>
                        <div style={styles.rowValue}>
                          {String(p.id) === String(activeProjectId)
                            ? "⭐ "
                            : ""}
                          {p.name || `Project #${p.id}`}
                        </div>
                      </div>
                    ))}
                    {!activeProjectId && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#b91c1c",
                          marginTop: 6,
                        }}
                      >
                        No active project selected. Open Edit and choose one.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Signature Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Signature</h3>
                <span style={styles.sectionTag}>KYC & Forms</span>
              </div>
              {profile.signature ? (
                <div style={styles.signatureBox}>
                  <img
                    src={profile.signature}
                    alt="signature"
                    style={{ width: 180, height: "auto", borderRadius: 4 }}
                  />
                </div>
              ) : (
                <div style={styles.rowValue}>No signature uploaded</div>
              )}
            </div>
          </>
        )}

        {/* ================== EDIT MODE ================== */}
        {editing && (
          <>
            {/* Account (read-only fields) */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Account Details</h3>
                <span style={styles.sectionTag}>Account</span>
              </div>

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

            {/* Personal info (editable) */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Personal Information</h3>
                <span style={styles.sectionTag}>Profile</span>
              </div>

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

            {/* Active Project selection */}
            {authorizedProjects.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitleRow}>
                  <h3 style={styles.sectionTitle}>Active Project</h3>
                  <span style={styles.sectionTag}>Access</span>
                </div>

                {authorizedProjects.length === 1 ? (
                  <div style={styles.row}>
                    <div style={styles.rowLabel}>Active Project</div>
                    <div style={styles.rowValue}>
                      {authorizedProjects[0].name ||
                        `#${authorizedProjects[0].id}`}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={styles.projectHint}>
                      Choose which project should be active for you. This will
                      control default filters in dashboards and forms.
                    </div>
                    {authorizedProjects.map((p) => (
                      <label
                        key={p.id}
                        style={{
                          ...styles.projectRadioRow,
                          color:
                            String(activeProjectId) === String(p.id)
                              ? theme.primary
                              : "#111827",
                        }}
                      >
                        <input
                          type="radio"
                          name="active_project"
                          value={p.id}
                          checked={String(activeProjectId) === String(p.id)}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setActiveProjectId(newId);

                            const proj = authorizedProjects.find(
                              (x) => String(x.id) === String(newId)
                            );
                            const name = proj?.name || "";

                            // persist selection in localStorage
                            localStorage.setItem(
                              "ACTIVE_PROJECT_ID",
                              String(newId)
                            );
                            localStorage.setItem("ACTIVE_PROJECT_NAME", name);
                            localStorage.setItem("PROJECT_ID", String(newId));
                          }}
                        />
                        <span>
                          {p.name || `Project #${p.id}`}
                          {String(activeProjectId) === String(p.id) && (
                            <span style={styles.tagSmall}>Active</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Signature edit */}
            <div style={styles.section}>
              <div style={styles.sectionTitleRow}>
                <h3 style={styles.sectionTitle}>Signature</h3>
                <span style={styles.sectionTag}>KYC & Forms</span>
              </div>

              {profile.signature && !signatureFile && (
                <>
                  <div style={styles.signatureBox}>
                    <img
                      src={profile.signature}
                      alt="signature"
                      style={{ width: 180, height: "auto", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      style={styles.buttonSecondary}
                      onClick={() => {
                        setProfile({ ...profile, signature: null });
                      }}
                    >
                      Remove Signature
                    </button>
                  </div>
                </>
              )}

              {(!profile.signature || signatureFile) && (
                <div style={{ ...styles.row, marginTop: 8 }}>
                  <label style={styles.label}>Upload new signature</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSignatureFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
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
