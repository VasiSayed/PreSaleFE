// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/endpoints";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(() => localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(() => localStorage.getItem("refresh"));

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // 🆕 brand/theme state – read from localStorage on load
  const [brand, setBrand] = useState(() => {
    const stored = localStorage.getItem("BRAND_THEME");
    return stored ? JSON.parse(stored) : null;
  });

  // 🆕 authorised projects (payload from /login)
  const [authorizedProjects, setAuthorizedProjects] = useState(() => {
    const stored = localStorage.getItem("AUTHORIZE_PROJECTS");
    return stored ? JSON.parse(stored) : [];
  });

  const navigate = useNavigate();
  const isAuthed = !!access;

  const safeRole = user?.role || "";

  // 🔹 my-scope fetcher (same as before)
  const fetchAndStoreScope = async () => {
    try {
      const res = await axiosInstance.get("/client/my-scope/");
      const scope = res.data;
      localStorage.setItem("MY_SCOPE", JSON.stringify(scope));
      return scope;
    } catch (err) {
      console.error("Failed to fetch MY_SCOPE", err);
      return null;
    }
  };

  // 🔹 Helper: handle projects + ACTIVE_PROJECT
  const applyProjectsFromLogin = (projects) => {
    if (!Array.isArray(projects)) {
      // nothing to store
      localStorage.removeItem("AUTHORIZE_PROJECTS");
      setAuthorizedProjects([]);
      return;
    }

    // Store raw list
    localStorage.setItem("AUTHORIZE_PROJECTS", JSON.stringify(projects));
    setAuthorizedProjects(projects);

    const projectIds = projects.map((p) => String(p.id));
    const storedActiveId = localStorage.getItem("ACTIVE_PROJECT_ID") || null;

    // Check if stored active is still valid in new list
    let activeId = null;
    if (storedActiveId && projectIds.includes(storedActiveId)) {
      activeId = storedActiveId;
    }

    if (!activeId) {
      // No valid previous active
      if (projects.length === 1) {
        // ✅ single project → auto active
        activeId = String(projects[0].id);
        const activeName = projects[0].name || "";

        localStorage.setItem("ACTIVE_PROJECT_ID", activeId);
        localStorage.setItem("ACTIVE_PROJECT_NAME", activeName);
        // backward compatibility
        localStorage.setItem("PROJECT_ID", activeId);
      } else {
        // multiple projects and no valid old active → user will choose
        localStorage.removeItem("ACTIVE_PROJECT_ID");
        localStorage.removeItem("ACTIVE_PROJECT_NAME");
        localStorage.removeItem("PROJECT_ID");
      }
    } else {
      // Old active id still valid → keep it
      const activeProject = projects.find(
        (p) => String(p.id) === String(activeId)
      );
      const activeName = activeProject?.name || "";

      localStorage.setItem("ACTIVE_PROJECT_ID", activeId);
      localStorage.setItem("ACTIVE_PROJECT_NAME", activeName);
      localStorage.setItem("PROJECT_ID", activeId);
    }
  };

  // 🔹 Common helper: apply tokens + user (+ brand + projects)
  const applyAuthResponse = (data) => {
    const a = data?.access;
    const r = data?.refresh;
    const u = data?.user;
    const b = data?.brand ?? null;
    const projects = data?.projects ?? null; // 🆕

    if (!a || !r) {
      throw new Error("Invalid credentials or token payload");
    }

    // Store tokens
    localStorage.setItem("access", a);
    localStorage.setItem("refresh", r);
    setAccess(a);
    setRefresh(r);

    // Store user data
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }

    // 🆕 Store brand theme (if backend sent it)
    if (b) {
      localStorage.setItem("BRAND_THEME", JSON.stringify(b));
      setBrand(b);
    }

    // 🆕 Store authorised projects + decide ACTIVE_PROJECT
    if (projects) {
      applyProjectsFromLogin(projects);
    }

    // 🔹 Fetch & store scope (projects, roles, etc.) in background
    fetchAndStoreScope();

    return data;
  };

  // 🔹 Normal username/password login
  const login = async ({ username, password }) => {
    const data = await AuthAPI.login(username, password);
    return applyAuthResponse(data);
  };

  // 🔹 OTP login (email + OTP -> tokens)
  const loginWithOtp = async ({ email, otp }) => {
    const data = await AuthAPI.loginWithOtp(email, otp);
    return applyAuthResponse(data);
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // Clear stored user + scope
    localStorage.removeItem("user");
    localStorage.removeItem("MY_SCOPE");

    // ⚠️ IMPORTANT:
    // - DO NOT remove BRAND_THEME (login page theme)
    // - DO NOT remove ACTIVE_PROJECT_ID / ACTIVE_PROJECT_NAME
    // so user ka last active project + theme logout ke baad bhi dikh sakte hain

    // But authorised_projects is per-session → clear it
    localStorage.removeItem("AUTHORIZE_PROJECTS");

    setUser(null);
    setAccess(null);
    setRefresh(null);
    setAuthorizedProjects([]);

    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({
      access,
      refresh,
      user,
      brand,
      role:safeRole,
      authorizedProjects, // 🆕 expose this
      isAuthed,
      login,
      loginWithOtp,
      logout,
    }),
    [access, refresh, user, brand, authorizedProjects, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
