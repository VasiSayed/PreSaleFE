import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";

const safeArr = (v) => (Array.isArray(v) ? v : []);

function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function decodeJWT(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isAdminUser() {
  const t = localStorage.getItem("ACCESS_TOKEN") || "";
  const p = decodeJWT(t) || {};
  const role = String(
    p.role || p.user_role || p.userRole || p.user_type || p.userType || "",
  ).toUpperCase();

  return Boolean(
    p.is_superuser ||
    p.isSuperuser ||
    p.is_staff ||
    p.isStaff ||
    role === "ADMIN",
  );
}

export default function CommunityLayout() {
  // ✅ ADMIN => direct admin notices (sub-tabs gone)
  const admin = useMemo(() => isAdminUser(), []);
  if (admin) {
    return <Navigate to="/post-sales/communication/admin/notices" replace />;
  }

  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState(null);

  const [projectId, setProjectId] = useState(
    () => Number(localStorage.getItem("COMM_CLIENT_PROJECT_ID") || "") || "",
  );
  const [towerId, setTowerId] = useState(
    () => Number(localStorage.getItem("COMM_CLIENT_TOWER_ID") || "") || "",
  );
  const [floorId, setFloorId] = useState(
    () => Number(localStorage.getItem("COMM_CLIENT_FLOOR_ID") || "") || "",
  );
  const [unitId, setUnitId] = useState(
    () => Number(localStorage.getItem("COMM_CLIENT_UNIT_ID") || "") || "",
  );

  const [inventoryTree, setInventoryTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);

  const projects = safeArr(scope?.projects);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === Number(projectId)) || null;
  }, [projects, projectId]);

  const towersFromTree = safeArr(inventoryTree?.towers);

  const floorsFromTree = useMemo(() => {
    const tw = towersFromTree.find((t) => t.id === Number(towerId));
    return safeArr(tw?.floors);
  }, [towersFromTree, towerId]);

  const unitsFromTree = useMemo(() => {
    const fl = floorsFromTree.find((f) => f.id === Number(floorId));
    return safeArr(fl?.units);
  }, [floorsFromTree, floorId]);

  // my-scope
  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        if (!alive) return;
        setScope(res?.data || null);

        const firstProjectId = safeArr(res?.data?.projects)?.[0]?.id;
        if (!projectId && firstProjectId) setProjectId(firstProjectId);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Failed to load my-scope");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(
    () => localStorage.setItem("COMM_CLIENT_PROJECT_ID", projectId || ""),
    [projectId],
  );
  useEffect(
    () => localStorage.setItem("COMM_CLIENT_TOWER_ID", towerId || ""),
    [towerId],
  );
  useEffect(
    () => localStorage.setItem("COMM_CLIENT_FLOOR_ID", floorId || ""),
    [floorId],
  );
  useEffect(
    () => localStorage.setItem("COMM_CLIENT_UNIT_ID", unitId || ""),
    [unitId],
  );

  // inventory tree
  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    async function run() {
      setTreeLoading(true);
      try {
        const res = await axiosInstance.get(
          `/client/inventory/tree/?project_id=${projectId}`,
        );
        if (!alive) return;
        setInventoryTree(res?.data || null);
      } catch (e) {
        toast.error(
          e?.response?.data?.detail || "Failed to load inventory tree",
        );
        setInventoryTree(null);
      } finally {
        if (alive) setTreeLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId]);

  const tabs = [
    { to: "", label: "Notices" },
    { to: "events", label: "Events" },
    { to: "forums", label: "Forums" },
    { to: "polls", label: "Polls" },
    { to: "surveys", label: "Surveys" },
  ];

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Community</div>
        <div>Loading scope...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Community</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            Project feed (audience filtering happens automatically)
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: 12 }}>
            Project
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(Number(e.target.value) || "");
                setTowerId("");
                setFloorId("");
                setUnitId("");
              }}
              style={{ marginLeft: 8, padding: 6 }}
            >
              <option value="">Select</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {toTitleCase(p.name)}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12 }}>
            Tower
            <select
              value={towerId}
              onChange={(e) => {
                setTowerId(Number(e.target.value) || "");
                setFloorId("");
                setUnitId("");
              }}
              style={{ marginLeft: 8, padding: 6 }}
              disabled={!projectId}
            >
              <option value="">All</option>
              {towersFromTree.map((t) => (
                <option key={t.id} value={t.id}>
                  {toTitleCase(t.name)}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12 }}>
            Floor
            <select
              value={floorId}
              onChange={(e) => {
                setFloorId(Number(e.target.value) || "");
                setUnitId("");
              }}
              style={{ marginLeft: 8, padding: 6 }}
              disabled={!towerId}
            >
              <option value="">All</option>
              {floorsFromTree.map((f) => (
                <option key={f.id} value={f.id}>
                  Floor {f.number}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12 }}>
            Unit
            <select
              value={unitId}
              onChange={(e) => setUnitId(Number(e.target.value) || "")}
              style={{ marginLeft: 8, padding: 6 }}
              disabled={!floorId}
            >
              <option value="">All</option>
              {unitsFromTree.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_no}
                </option>
              ))}
            </select>
          </label>

          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {treeLoading ? "Loading units..." : ""}
          </div>
        </div>
      </div>

      <div
        style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === ""}
            className={({ isActive }) =>
              cls("comm-tab", isActive ? "active" : "")
            }
            style={({ isActive }) => ({
              textDecoration: "none",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              background: isActive ? "rgba(15,98,254,0.10)" : "white",
              color: "inherit",
              fontSize: 13,
              fontWeight: 700,
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Outlet
          context={{
            scope,
            inventoryTree,
            projectId,
            towerId,
            floorId,
            unitId,
          }}
        />
      </div>
    </div>
  );
}
