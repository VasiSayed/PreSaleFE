import { useEffect, useState } from "react";
import { SetupAPI } from "../../../api/endpoints";

export function useSetupData() {
  const [setup, setSetup] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminIdForScope, setAdminIdForScope] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const setupData = await SetupAPI.getBundle();
      setSetup(setupData);

      const scopeData = await SetupAPI.myScope();
      setScope(scopeData);
    } catch (err) {
      console.error("Failed to load setup data:", err);
      setError("Failed to load setup data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadScopeForAdmin = async () => {
    if (!adminIdForScope) {
      alert("Please enter an Admin ID");
      return;
    }

    setLoading(true);
    try {
      const scopeData = await SetupAPI.myScope({ adminid: adminIdForScope });
      setScope(scopeData);
    } catch (err) {
      console.error("Failed to load admin scope:", err);
      alert("Failed to load scope for admin");
    } finally {
      setLoading(false);
    }
  };

  // Derived data
  const projects = scope?.projects || [];
  const users = setup?.users?.items || []; // ← FIXED: backend returns users.items
  const isStaff = setup?.user?.is_staff || false; // ← FIXED: check user.is_staff

  // Build cascading data
  const towersByProject = {};
  const floorsByTower = {};

  projects.forEach((p) => {
    towersByProject[p.id] = p.towers || [];
    (p.towers || []).forEach((t) => {
      floorsByTower[t.id] = t.floors || [];
    });
  });

  return {
    setup,
    scope,
    loading,
    error,
    isStaff,
    adminIdForScope,
    setAdminIdForScope,
    handleLoadScopeForAdmin,
    reload: loadAll,
    projects,
    towersByProject,
    floorsByTower,
    users,
  };
}
