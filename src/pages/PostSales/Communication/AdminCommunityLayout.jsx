import React, { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";

const safeArr = (v) => (Array.isArray(v) ? v : []);

function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminCommunityLayout() {
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState(null);

  const [projectId, setProjectId] = useState(
    () => Number(localStorage.getItem("COMM_ADMIN_PROJECT_ID") || "") || "",
  );
  const [towerId, setTowerId] = useState(
    () => Number(localStorage.getItem("COMM_ADMIN_TOWER_ID") || "") || "",
  );
  const [floorId, setFloorId] = useState(
    () => Number(localStorage.getItem("COMM_ADMIN_FLOOR_ID") || "") || "",
  );
  const [unitId, setUnitId] = useState(
    () => Number(localStorage.getItem("COMM_ADMIN_UNIT_ID") || "") || "",
  );

  const [inventoryTree, setInventoryTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);

  const projects = safeArr(scope?.projects);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === Number(projectId)) || null;
  }, [projects, projectId]);

  const towersFromScope = safeArr(selectedProject?.towers);
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
    () => localStorage.setItem("COMM_ADMIN_PROJECT_ID", projectId || ""),
    [projectId],
  );
  useEffect(
    () => localStorage.setItem("COMM_ADMIN_TOWER_ID", towerId || ""),
    [towerId],
  );
  useEffect(
    () => localStorage.setItem("COMM_ADMIN_FLOOR_ID", floorId || ""),
    [floorId],
  );
  useEffect(
    () => localStorage.setItem("COMM_ADMIN_UNIT_ID", unitId || ""),
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

        const treeTowers = safeArr(res?.data?.towers);
        if (towerId && !treeTowers.some((t) => t.id === Number(towerId))) {
          setTowerId("");
          setFloorId("");
          setUnitId("");
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Community Admin</h2>
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
          <div style={{ fontSize: 18, fontWeight: 700 }}>Community Admin</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            Manage notices with audience targeting
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
              {(towersFromTree.length ? towersFromTree : towersFromScope).map(
                (t) => (
                  <option key={t.id} value={t.id}>
                    {toTitleCase(t.name)}
                  </option>
                ),
              )}
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

      {/* ✅ sub-tabs removed */}
      <div style={{ marginTop: 16 }}>
        <Outlet
          context={{
            scope,
            inventoryTree,
            projectId,
            towerId,
            floorId,
            unitId,
            setTowerId,
            setFloorId,
            setUnitId,
          }}
        />
      </div>
    </div>
  );
}
