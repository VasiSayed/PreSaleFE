// import { useState, useEffect } from "react";
// import { LeadSetupAPI, SetupAPI } from "../../../api/endpoints";

// export function useLeadSetupData() {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [setup, setSetup] = useState(null);
//   const [leadSetup, setLeadSetup] = useState({
//     classifications: [],
//     sources: [],
//     stages: [],
//     purposes: [],
//     statuses: [],
//     offering_types: [],
//   });
//   const [projects, setProjects] = useState([]);
//   const [units, setUnits] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState(null);

//   const [users, setUsers] = useState([]);

//   const loadData = async (projectId = null) => {
//     setLoading(true);
//     setError(null);

//     try {
//       // Fetch setup bundle (for lookups like unit_types, facings, etc.)
//       console.log("🔍 Fetching setup bundle...");
//       const setupBundle = await SetupAPI.getBundle();
//       console.log("✅ Setup Bundle received:", setupBundle);
//       console.log("📦 Unit Types:", setupBundle?.lookups?.unit_types);
//       setSetup(setupBundle);

//       // Extract users from setup bundle
//       const fetchedUsers = setupBundle?.users?.items || [];
//       console.log("👥 Users extracted:", fetchedUsers);
//       setUsers(fetchedUsers);

//       // Fetch projects
//       console.log("🔍 Fetching projects...");
//       const scopeData = await SetupAPI.myScope({ include_units: true });
//       console.log("✅ Scope Data received:", scopeData);
//       const fetchedProjects = scopeData.projects || [];
//       console.log("📋 Projects:", fetchedProjects);
//       setProjects(fetchedProjects);

//       // Determine which project to use for masters
//       const projectIdToUse = projectId || fetchedProjects[0]?.id;

//       if (!projectIdToUse) {
//         throw new Error("No projects available");
//       }

//       console.log("🎯 Using project ID for masters:", projectIdToUse);
//       setSelectedProjectId(projectIdToUse);

//       // Fetch lead masters for that project
//       console.log("🔍 Fetching lead masters...");
//       const mastersData = await LeadSetupAPI.getMasters({
//         project_id: projectIdToUse,
//       });
//       console.log("✅ Lead Masters received:", mastersData);
//       console.log("🏢 Offering Types:", mastersData?.offering_types);
//       setLeadSetup(mastersData);

//       // Extract all units from all projects
//       const allUnits = [];
//       fetchedProjects.forEach((project) => {
//         project.towers?.forEach((tower) => {
//           tower.floors?.forEach((floor) => {
//             floor.units?.forEach((unit) => {
//               allUnits.push({ ...unit, project: project.id });
//             });
//           });
//         });
//       });
//       console.log("📍 Total units extracted:", allUnits.length);
//       setUnits(allUnits);
//     } catch (err) {
//       console.error("❌ Error loading lead setup data:", err);
//       setError(err.message || "Failed to load data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const reload = (projectId = null) => {
//     loadData(projectId);
//   };

//   return {
//     setup,
//     leadSetup,
//     projects,
//     units,
//     users,
//     selectedProjectId,
//     loading,
//     error,
//     reload,
//   };
// }


// // src/pages/LeadSetup/hooks/useLeadSetupData.js
// import { useEffect, useState } from "react";
// import { LeadSetupAPI, SetupAPI } from "../../../api/endpoints";

// const EMPTY_LEAD_SETUP = {
//   classifications: [],
//   sources: [],
//   stages: [],
//   purposes: [],
//   statuses: [],
//   offering_types: [],
// };

// export function useLeadSetupData() {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [setup, setSetup] = useState(null);          // setup bundle
//   const [leadSetup, setLeadSetup] = useState(EMPTY_LEAD_SETUP); // masters
//   const [leadScope, setLeadScope] = useState(null);  // my-scope payload

//   const [projects, setProjects] = useState([]);
//   const [units, setUnits] = useState([]);
//   const [users, setUsers] = useState([]);

//   const [selectedProjectId, setSelectedProjectId] = useState(null);

//   // Optional: staff-related controls (if you need admin filter)
//   const [isStaff, setIsStaff] = useState(false);
//   const [adminIdForScope, setAdminIdForScope] = useState("");

//   // ---------------------------
//   // 1) Load setup bundle + scope (projects, units, users)
//   // ---------------------------
//   const loadSetupAndScope = async (options = {}) => {
//     const { projectId: projectIdArg = null, adminId = null } = options;

//     setLoading(true);
//     setError(null);

//     try {
//       // 1) Setup bundle (lookups + current user + users list, etc.)
//       const setupBundle = await SetupAPI.getBundle();
//       setSetup(setupBundle);

//       const fetchedUsers = setupBundle?.users?.items || [];
//       setUsers(fetchedUsers);

//       const currentUser = setupBundle?.current_user;
//       if (currentUser) {
//         setIsStaff(!!(currentUser.is_staff || currentUser.role === "STAFF"));
//       }

//       // 2) Role-aware scope (projects + towers + floors + units)
//       const scopeParams = { include_units: true };
//       if (adminId) {
//         scopeParams.admin_id = adminId;
//       }

//       const scopeData = await SetupAPI.myScope(scopeParams);
//       setLeadScope(scopeData);

//       const fetchedProjects = scopeData.projects || [];
//       setProjects(fetchedProjects);

//       // Flatten all units from all projects
//       const allUnits = [];
//       fetchedProjects.forEach((project) => {
//         (project.towers || []).forEach((tower) => {
//           (tower.floors || []).forEach((floor) => {
//             (floor.units || []).forEach((unit) => {
//               allUnits.push({
//                 ...unit,
//                 project: project.id,
//                 project_name: project.name,
//                 tower_name: tower.name,
//                 floor_number: floor.number,
//               });
//             });
//           });
//         });
//       });
//       setUnits(allUnits);

//       // Decide which project to use as selected
//       let projectIdToUse = projectIdArg;

//       if (!projectIdToUse) {
//         // if previously selected project still exists, keep it
//         if (
//           selectedProjectId &&
//           fetchedProjects.some((p) => String(p.id) === String(selectedProjectId))
//         ) {
//           projectIdToUse = selectedProjectId;
//         } else {
//           projectIdToUse = fetchedProjects[0]?.id || null;
//         }
//       }

//       setSelectedProjectId(projectIdToUse || null);
//     } catch (err) {
//       console.error("❌ Error loading setup/scope:", err);
//       setError(err.message || "Failed to load setup/scope");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------------------
//   // 2) Load masters (classifications, sources, stages...) for a project
//   // ---------------------------
//   const loadMastersForProject = async (projectId) => {
//     if (!projectId) {
//       setLeadSetup(EMPTY_LEAD_SETUP);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const mastersData = await LeadSetupAPI.getMasters({
//         project_id: projectId,
//       });
//       setLeadSetup(mastersData || EMPTY_LEAD_SETUP);
//     } catch (err) {
//       console.error("❌ Error loading lead masters:", err);
//       setError(err.message || "Failed to load lead masters");
//       setLeadSetup(EMPTY_LEAD_SETUP);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------------------
//   // 3) Initial load: setup + scope, then masters for default project
//   // ---------------------------
//   useEffect(() => {
//     loadSetupAndScope();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ---------------------------
//   // 4) When selectedProjectId changes, fetch masters for that project
//   // ---------------------------
//   useEffect(() => {
//     if (!selectedProjectId) return;
//     loadMastersForProject(selectedProjectId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedProjectId]);

//   // ---------------------------
//   // 5) Staff: reload scope for a different admin
//   // ---------------------------
//   const handleLoadScopeForAdmin = async () => {
//     if (!adminIdForScope) return;
//     await loadSetupAndScope({
//       projectId: selectedProjectId,
//       adminId: adminIdForScope,
//     });
//   };

//   // ---------------------------
//   // 6) Public API from hook
//   // ---------------------------
//   const reload = (projectId = selectedProjectId) => {
//     // full reload: setup + scope + masters
//     loadSetupAndScope({ projectId });
//   };

//   return {
//     setup,
//     leadSetup,
//     leadScope,
//     projects,
//     units,
//     users,

//     selectedProjectId,
//     setSelectedProjectId,     // call this when user changes project in dropdown

//     loading,
//     error,

//     isStaff,
//     adminIdForScope,
//     setAdminIdForScope,
//     handleLoadScopeForAdmin,

//     reload,
//     loadMastersForProject,    // optional direct call if you want
//   };
// }


// src/pages/LeadSetup/hooks/useLeadSetupData.js
import { useState, useEffect } from "react";
import { LeadSetupAPI, SetupAPI } from "../../../api/endpoints";

/**
 * Lead setup ka saara data yahin se aaega:
 * - setupBundle (unit types, facings, users, etc.)
 * - scope (projects + towers + floors + units)
 * - masters (classifications, sources, stages, purposes, statuses, offering_types)
 * - activeProjectId => jiske liye masters load karne hai
 */
export function useLeadSetupData(initialProjectId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [setup, setSetup] = useState(null);
  const [leadSetup, setLeadSetup] = useState({
    classifications: [],
    sources: [],
    stages: [],
    purposes: [],
    statuses: [],
    offering_types: [],
  });

  const [leadScope, setLeadScope] = useState(null);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [isStaff, setIsStaff] = useState(false);

  const [adminIdForScope, setAdminIdForScope] = useState("");
  const [activeProjectId, setActiveProjectId] = useState(
    initialProjectId || ""
  );

  // ---- Helpers ----

  const extractUnitsFromScope = (scope) => {
    const allUnits = [];
    const projList = scope?.projects || scope?.results || [];

    projList.forEach((project) => {
      (project.towers || []).forEach((tower) => {
        (tower.floors || []).forEach((floor) => {
          (floor.units || []).forEach((unit) => {
            allUnits.push({
              ...unit,
              project: project.id,
              project_id: project.id,
              project_name: project.name || project.project_name,
              tower_id: tower.id,
              floor_id: floor.id,
            });
          });
        });
      });
    });

    return { projList, allUnits };
  };

  const loadScope = async (opts = {}) => {
    const params = { include_units: true };
    if (opts.adminId) {
      params.admin_id = opts.adminId;
    }
    const scopeData = await SetupAPI.myScope(params);
    setLeadScope(scopeData);

    const { projList, allUnits } = extractUnitsFromScope(scopeData);
    setProjects(projList);
    setUnits(allUnits);

    return projList;
  };

  const loadMasters = async (projectId) => {
    if (!projectId) {
      setLeadSetup({
        classifications: [],
        sources: [],
        stages: [],
        purposes: [],
        statuses: [],
        offering_types: [],
      });
      return;
    }

    const mastersData = await LeadSetupAPI.getMasters({
      project_id: projectId,
    });
    setLeadSetup(mastersData);
  };

  // ---- Initial load (bundle + scope + default project) ----
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Setup bundle (users, lookups)
        const setupBundle = await SetupAPI.getBundle();
        setSetup(setupBundle);

        const staffFlag =
          !!setupBundle?.current_user?.is_staff ||
          !!setupBundle?.user?.is_staff ||
          !!setupBundle?.is_staff;
        setIsStaff(staffFlag);

        const usersList =
          setupBundle?.users?.items ||
          setupBundle?.users ||
          setupBundle?.user_list ||
          [];
        setUsers(usersList);

        // 2) Scope (projects + units)
        const projList = await loadScope({ adminId: null });

        // 3) Kounsa project use karna masters ke liye
        let projectIdToUse = initialProjectId || activeProjectId;
        if (!projectIdToUse && projList.length) {
          projectIdToUse = String(projList[0].id);
        }

        if (projectIdToUse) {
          setActiveProjectId(String(projectIdToUse));
          // loadMasters effect activeProjectId change pe chalega
        } else {
          setLeadSetup({
            classifications: [],
            sources: [],
            stages: [],
            purposes: [],
            statuses: [],
            offering_types: [],
          });
        }
      } catch (err) {
        console.error("Error loading lead setup data:", err);
        setError(
          err?.response?.data?.detail ||
            err.message ||
            "Failed to load lead setup data"
        );
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Jab bhi activeProjectId badlega, masters reload karo ----
  useEffect(() => {
    if (!activeProjectId) return;

    const fetchMasters = async () => {
      try {
        await loadMasters(activeProjectId);
      } catch (err) {
        console.error("Error reloading masters for project:", err);
        setError(
          err?.response?.data?.detail ||
            err.message ||
            "Failed to load lead masters"
        );
      }
    };

    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // Staff ke liye: admin_id ke hisaab se scope reload
  const handleLoadScopeForAdmin = async () => {
    try {
      const adminId = adminIdForScope.trim();
      const projList = await loadScope({
        adminId: adminId || null,
      });

      // try to keep same project if still available
      if (activeProjectId) {
        const stillExists = projList.some(
          (p) => String(p.id) === String(activeProjectId)
        );
        if (!stillExists && projList.length) {
          setActiveProjectId(String(projList[0].id));
        }
      } else if (projList.length) {
        setActiveProjectId(String(projList[0].id));
      }
    } catch (err) {
      console.error("Error loading scope for admin:", err);
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to load scope for selected admin"
      );
    }
  };

  // Forms me onSuccess={reload} call karoge => sirf masters reload honge
  const reload = async (projectIdOverride) => {
    const projectId = projectIdOverride || activeProjectId;
    try {
      await loadMasters(projectId);
    } catch (err) {
      console.error("Error reloading lead masters:", err);
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to reload data"
      );
    }
  };

  return {
    setup,
    leadSetup,
    leadScope,
    loading,
    error,
    isStaff,
    adminIdForScope,
    setAdminIdForScope,
    handleLoadScopeForAdmin,
    reload,
    projects,
    units,
    users,
    activeProjectId,
    setActiveProjectId,
  };
}
