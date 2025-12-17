// src/pages/CreateUserWithProjectAccess.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../api/axiosInstance";

const BRAND_KEY = "BRAND_THEME";
const PROJECTS_KEY = "AUTHORIZE_PROJECTS";
const REGISTER_URL = "accounts/register-with-project/";

const USER_KEYS = [
  "user",
  "USER",
  "USER_DATA",
  "USER_DETAILS",
  "userData",
  "user_details",
  "persist:root",
];

function safeParseJSON(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function looksLikeHtml(s) {
  if (!s) return false;
  const t = String(s).trim();
  return (
    t.startsWith("<!DOCTYPE") ||
    t.startsWith("<html") ||
    t.includes("<body") ||
    t.includes("</html>") ||
    /<[^>]+>/.test(t)
  );
}

function getNiceErrorMessage(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (!err?.response) {
    return "Network error. Please check internet / server.";
  }

  if (status === 401)
    return "Session expired / Unauthorized. Please login again.";
  if (status === 403) return "You do not have permission to create users.";
  if (status === 404)
    return "API not found (404). Please check endpoint/REGISTER_URL.";
  if (status >= 500) return "Server error. Please try again.";

  if (typeof data === "string") {
    if (looksLikeHtml(data))
      return "Request failed. Please check API URL or server logs.";
    return data;
  }

  if (Array.isArray(data)) {
    const msg = data.filter(Boolean).join(" ");
    return msg || "Invalid request.";
  }

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") {
      if (looksLikeHtml(data.detail))
        return "Request failed. Please check API URL or server logs.";
      return data.detail;
    }

    const entries = Object.entries(data);
    for (const [field, value] of entries) {
      if (Array.isArray(value) && value.length) return `${field}: ${value[0]}`;
      if (typeof value === "string") return `${field}: ${value}`;
    }
    return "Invalid request.";
  }

  return "Request failed.";
}

function getCurrentUserFromLS() {
  for (const k of USER_KEYS) {
    const raw = localStorage.getItem(k);
    const parsed = safeParseJSON(raw);
    if (!parsed) continue;

    if (k === "persist:root") {
      const candidates = ["user", "auth", "accounts", "userSlice"];
      for (const c of candidates) {
        const sliceRaw = parsed?.[c];
        const slice =
          typeof sliceRaw === "string" ? safeParseJSON(sliceRaw) : sliceRaw;
        const u = slice?.id
          ? slice
          : slice?.user?.id
          ? slice.user
          : slice?.data?.id
          ? slice.data
          : null;
        if (u?.id) return u;
      }
      continue;
    }

    const candidate = parsed?.id
      ? parsed
      : parsed?.user?.id
      ? parsed.user
      : parsed?.data?.id
      ? parsed.data
      : null;
    if (candidate?.id) return candidate;
  }
  return null;
}

function Switch({ checked, onChange, disabled, theme }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${
          checked ? theme.accent_color : "rgba(0,0,0,0.22)"
        }`,
        background: checked ? theme.accent_color : "rgba(0,0,0,0.08)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        padding: 0,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 1.5,
          left: checked ? 22 : 2,
          transition: "left 150ms ease",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

export default function CreateUserWithProjectAccess() {
  const [brand, setBrand] = useState(null);
  const [authorizedProjects, setAuthorizedProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "SALES", // default
    can_view: true,
    can_edit: false,
    project_ids: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const theme = useMemo(() => {
    const fallback = {
      company_name: "Company",
      logo: "",
      font_family: "Inter",
      base_font_size: 14,
      background_color: "#f3f4f6",
      heading_color: "#111827",
      primary_color: "#102a54",
      secondary_color: "#FFFFFF",
      accent_color: "#2563EB",
      button_primary_bg: "#102A54",
      button_primary_text: "#FFFFFF",
    };
    return { ...fallback, ...(brand || {}) };
  }, [brand]);

  useEffect(() => {
    setBrand(safeParseJSON(localStorage.getItem(BRAND_KEY)));
    const p = safeParseJSON(localStorage.getItem(PROJECTS_KEY));
    const list = Array.isArray(p) ? p : [];
    const map = new Map();
    list.forEach((x) => {
      const id = toInt(x?.id);
      if (id) map.set(id, { id, name: x?.name || `Project #${id}` });
    });
    setAuthorizedProjects(Array.from(map.values()));
    setCurrentUser(getCurrentUserFromLS());
  }, []);

  const isAdminUser = currentUser?.role === "ADMIN"&& !currentUser?.is_staff;

  function updateField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleProject(id, isOn) {
    setForm((p) => {
      const curr = new Set(p.project_ids || []);
      if (isOn) curr.add(id);
      else curr.delete(id);
      return { ...p, project_ids: Array.from(curr) };
    });
  }

  function selectAllProjects() {
    setForm((p) => ({
      ...p,
      project_ids: authorizedProjects.map((x) => x.id),
    }));
  }

  function clearAllProjects() {
    setForm((p) => ({ ...p, project_ids: [] }));
  }

  function getAutoAdminId() {
    if (isAdminUser && currentUser?.id) return currentUser.id;
    if (currentUser?.admin_id) return currentUser.admin_id;
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setCreated(null);

    if (!currentUser?.id) return toast.error("Not logged in.");
    if (!form.username.trim()) return toast.error("Username required");
    if (!form.password || form.password.length < 6)
      return toast.error("Password min 6 chars");
    if (!form.email.trim()) return toast.error("Email required");
    if (!form.project_ids?.length)
      return toast.error("Select at least one project");

    const payload = {
      username: form.username.trim(),
      password: form.password,
      first_name: form.first_name?.trim() || "",
      last_name: form.last_name?.trim() || "",
      email: form.email.trim(),
      project_ids: form.project_ids,
      can_view: !!form.can_view,
      can_edit: !!form.can_edit,
    };

    // Only send role if not default (SALES)
    if (form.role && form.role !== "SALES") {
      payload.role = form.role;
    }

    const adminId = getAutoAdminId();
    if (adminId) payload.admin_id = adminId;

    try {
      setSubmitting(true);
      const res = await axiosInstance.post(REGISTER_URL, payload);
      setCreated(res.data);
      toast.success("User created successfully ✅");
      setForm((p) => ({ ...p, username: "", password: "", email: "", first_name: "", last_name: "" }));
    } catch (err) {
      toast.error(getNiceErrorMessage(err));
      console.error("Create user failed:", err?.response?.status, err?.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  }

  const containerStyle = {
    minHeight: "100vh",
    background: theme.background_color,
    fontFamily: theme.font_family || "Inter",
    fontSize: (theme.base_font_size || 14) + "px",
    color: theme.heading_color,
    padding: "24px",
  };

  const cardStyle = {
    maxWidth: "100%",
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    border: `1px solid rgba(0,0,0,0.08)`,
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
    overflow: "hidden",
  };

  const buttonStyle = {
    background: theme.button_primary_bg,
    color: theme.button_primary_text,
    border: `1px solid ${theme.primary_color}`,
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    outline: "none",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.9,
    marginBottom: 6,
  };

  const smallBtnStyle = {
    borderRadius: 12,
    padding: "8px 10px",
    fontWeight: 900,
    border: `1px solid rgba(0,0,0,0.14)`,
    background: "#fff",
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1,
  };

  return (
    <div style={containerStyle}>
      <ToastContainer position="top-right" />
      <div style={cardStyle}>
        <div style={{ padding: 20 }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={labelStyle}>Username *</div>
                <input style={inputStyle} value={form.username} onChange={(e) => updateField("username", e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Password *</div>
                <input style={inputStyle} type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>First Name</div>
                <input style={inputStyle} value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Last Name</div>
                <input style={inputStyle} value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Email *</div>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div />
            </div>

            {/* Role Selector - Now includes MANAGER & FULL_CONTROL */}
            <div style={{ marginTop: 16 }}>
              <div style={labelStyle}>Role</div>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
              >
                <option value="SALES">Sales Person (Default)</option>
                <option value="MANAGER">Manager</option>
                <option value="FULL_CONTROL">Full Control (Like Admin)</option>
                <option value="RECEPTION">Reception</option>
                <option value="CHANNEL_PARTNER">Channel Partner</option>
                <option value="CALLING_TEAM">Calling Team</option>
                <option value="KYC_TEAM">KYC Team</option>
              </select>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Full Control has same permissions as Admin (view/edit all team data)
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: theme.primary_color }}>
                Project Access *{" "}
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  ({form.project_ids?.length || 0} selected)
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" style={smallBtnStyle} onClick={selectAllProjects} disabled={submitting || authorizedProjects.length === 0}>
                  Select All
                </button>
                <button type="button" style={smallBtnStyle} onClick={clearAllProjects} disabled={submitting || (form.project_ids?.length || 0) === 0}>
                  Clear
                </button>
              </div>
            </div>

            {authorizedProjects.length === 0 ? (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.04)", fontWeight: 700 }}>
                No projects found in <b>localStorage.{PROJECTS_KEY}</b>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {authorizedProjects.map((p) => {
                  const checked = (form.project_ids || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: checked ? "rgba(37,99,235,0.06)" : "#fff",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900 }}>{p.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>Project ID: {p.id}</div>
                      </div>
                      <Switch checked={checked} onChange={(on) => toggleProject(p.id, on)} disabled={submitting} theme={theme} />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 800 }}>Can View</div>
                <Switch checked={form.can_view} onChange={(v) => updateField("can_view", v)} disabled={submitting} theme={theme} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 800 }}>Can Edit</div>
                <Switch checked={form.can_edit} onChange={(v) => updateField("can_edit", v)} disabled={submitting} theme={theme} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="submit" style={buttonStyle} disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>

          {created && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 900, color: theme.primary_color, marginBottom: 8 }}>
                User Created Successfully
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 14,
                  background: "#0b1220",
                  color: "#e5e7eb",
                  borderRadius: 12,
                  overflow: "auto",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(created, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}