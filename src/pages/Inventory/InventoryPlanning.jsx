// src/pages/Inventory/InventoryPlanning.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./InventoryPlanning.css";

const AVAILABILITY_CLASS = {
  AVAILABLE: "status-available",
  BOOKED: "status-booked",
  BLOCKED: "status-blocked",
};

const STATUS_LABEL = {
  AVAILABLE: "Available",
  BLOCKED: "Block",
  BOOKED: "Sold Out",
};

const FILTER_LABEL = {
  ALL: "All",
  AVAILABLE: "Available",
  BLOCKED: "Block",
  BOOKED: "Sold Out",
};

const InventoryPlanning = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedTowers, setExpandedTowers] = useState(new Set());

  const projectIdFromUrl = searchParams.get("project_id");
  const initialProjectId =
    projectIdFromUrl ||
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID") ||
    "";

  // ---------- load projects (my-scope) ----------
  useEffect(() => {
    api
      .get("/client/my-scope/")
      .then((res) => {
        const data = res.data || {};
        const list = data.projects || data.project_list || data.results || [];

        setProjects(list);

        if (!selectedProjectId) {
          const fallbackId =
            initialProjectId || (list.length ? String(list[0].id) : "");
          if (fallbackId) setSelectedProjectId(fallbackId);
        }
      })
      .catch((err) => {
        console.error("Failed to load project scope", err);
        setProjects([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- load inventory tree for selected project ----------
  useEffect(() => {
    if (!selectedProjectId) {
      setTree(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    localStorage.setItem("ACTIVE_PROJECT_ID", String(selectedProjectId));
    localStorage.setItem("PROJECT_ID", String(selectedProjectId));

    api
      .get("/client/inventory/tree/", {
        params: { project_id: selectedProjectId },
      })
      .then((res) => {
        setTree(res.data || null);
      })
      .catch((err) => {
        console.error("Failed to load inventory tree", err);
        setTree(null);
        setError("Failed to load inventory data.");
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  // ---------- helpers ----------

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value || "");
  };

  const handleProjectReset = () => {
    if (projects.length) {
      setSelectedProjectId(String(projects[0].id));
    } else {
      setSelectedProjectId("");
    }
  };

  const handleUnitClick = (unitId) => {
    if (selectedProjectId) {
      navigate(`/inventory/unit/${unitId}?project_id=${selectedProjectId}`);
    } else {
      navigate(`/inventory/unit/${unitId}`);
    }
  };

  const toggleTowerExpansion = (towerId) => {
    setExpandedTowers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(towerId)) {
        newSet.delete(towerId);
      } else {
        newSet.add(towerId);
      }
      return newSet;
    });
  };

  const isTowerExpanded = (towerId) => expandedTowers.has(towerId);

  const getUnitStatusClass = (unit) => {
    const inv = unit.inventory;
    if (!inv) return "status-unknown";
    return AVAILABILITY_CLASS[inv.availability_status] || "status-unknown";
  };

  const getStatusLabelFromCode = (code) => {
    if (!code) return "No Inv";
    return STATUS_LABEL[code] || code;
  };

  const applyFilter = (units = [], filter = "ALL") => {
    if (filter === "ALL") return units;
    return units.filter((u) => u.inventory?.availability_status === filter);
  };

  const computeCountsForUnits = (units = []) => {
    const counts = { available: 0, blocked: 0, booked: 0 };
    units.forEach((u) => {
      const st = u.inventory?.availability_status;
      if (st === "AVAILABLE") counts.available += 1;
      else if (st === "BLOCKED") counts.blocked += 1;
      else if (st === "BOOKED") counts.booked += 1;
    });
    return counts;
  };

  // tower totals (always total, not filtered)
  const computeTowerCounts = (tower) => {
    const allUnits = [];
    (tower.floors || []).forEach((f) => {
      (f.units || []).forEach((u) => allUnits.push(u));
    });
    return computeCountsForUnits(allUnits);
  };

  // project totals (for top summary bar)
  const computeProjectCounts = (treeObj) => {
    const counts = { available: 0, blocked: 0, booked: 0 };
    if (!treeObj) return counts;

    (treeObj.towers || []).forEach((tower) => {
      (tower.floors || []).forEach((floor) => {
        (floor.units || []).forEach((u) => {
          const st = u.inventory?.availability_status;
          if (st === "AVAILABLE") counts.available += 1;
          else if (st === "BLOCKED") counts.blocked += 1;
          else if (st === "BOOKED") counts.booked += 1;
        });
      });
    });

    return counts;
  };

  const getTowerBadge = (tower) => {
    if (!tower?.name) return "#";
    return tower.name.charAt(0).toUpperCase();
  };

  const getFloorLabel = (floor) =>
    floor.name || floor.label || floor.number || `Floor ${floor.id}`;

  // non-numeric floors first, then numeric (G, Stilt, etc.)
  const sortedFloors = (tower) => {
    const floors = tower?.floors || [];
    return [...floors].sort((a, b) => {
      const aStr = String(a.number ?? a.name ?? "");
      const bStr = String(b.number ?? b.name ?? "");

      const aNum = Number(aStr);
      const bNum = Number(bStr);

      const aIsNum = !Number.isNaN(aNum);
      const bIsNum = !Number.isNaN(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      if (!aIsNum && !bIsNum) return aStr.localeCompare(bStr);
      if (!aIsNum && bIsNum) return -1;
      if (aIsNum && !bIsNum) return 1;
      return 0;
    });
  };

  const projectCounts = tree ? computeProjectCounts(tree) : null;

  // ---------- render ----------

  return (
    <div className="inventory-page">
      <div className="inventory-top-strip" />

      {/* toolbar */}
      <div className="inventory-toolbar">
        <select
          className="project-select"
          value={selectedProjectId || ""}
          onChange={handleProjectChange}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.project_name || `Project #${p.id}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-primary"
          onClick={() =>
            selectedProjectId && setSelectedProjectId(selectedProjectId)
          }
        >
          Submit
        </button>

        <button
          type="button"
          className="toolbar-btn toolbar-btn-secondary"
          onClick={handleProjectReset}
        >
          Reset
        </button>
      </div>

      {/* compact project summary bar with filter */}
      {!loading && !error && tree && projectCounts && (
        <div className="project-summary-bar">
          <button
            type="button"
            className={
              "project-name-block" +
              (statusFilter === "ALL" ? " project-filter-active" : "")
            }
            onClick={() => setStatusFilter("ALL")}
          >
            {tree.project?.name || "Project"}
          </button>

          <div className="project-summary-row">
            <button
              type="button"
              className={
                "project-summary-item-btn" +
                (statusFilter === "AVAILABLE" ? " project-filter-active" : "")
              }
              onClick={() => setStatusFilter("AVAILABLE")}
            >
              <div className="summary-label">Available</div>
              <div className="summary-count summary-count-available">
                {projectCounts.available}
              </div>
            </button>

            <button
              type="button"
              className={
                "project-summary-item-btn" +
                (statusFilter === "BLOCKED" ? " project-filter-active" : "")
              }
              onClick={() => setStatusFilter("BLOCKED")}
            >
              <div className="summary-label">Block</div>
              <div className="summary-count summary-count-blocked">
                {projectCounts.blocked}
              </div>
            </button>

            <button
              type="button"
              className={
                "project-summary-item-btn" +
                (statusFilter === "BOOKED" ? " project-filter-active" : "")
              }
              onClick={() => setStatusFilter("BOOKED")}
            >
              <div className="summary-label">Sold Out</div>
              <div className="summary-count summary-count-booked">
                {projectCounts.booked}
              </div>
            </button>
          </div>
        </div>
      )}

      {loading && <div className="inventory-loading">Loading inventory...</div>}

      {!loading && error && <div className="inventory-error">{error}</div>}

      {!loading && !error && !tree && (
        <div className="inventory-empty">
          Select a project to view inventory.
        </div>
      )}

      {!loading && !error && tree && (
        <div className="towers-list">
          {tree.towers && tree.towers.length ? (
            tree.towers.map((tower) => {
              const towerCounts = computeTowerCounts(tower);
              const floors = sortedFloors(tower);

              const isExpanded = isTowerExpanded(tower.id);

              return (
                <div key={tower.id} className="tower-card-planning">
                  {/* tower header (still total counts) */}
                  <div
                    className="tower-card-header"
                    onClick={() => toggleTowerExpansion(tower.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTowerExpansion(tower.id);
                      }
                    }}
                  >
                    <div className="tower-badge">{getTowerBadge(tower)}</div>

                    <div className="tower-summary-row">
                      <div className="tower-summary-item">
                        <div className="summary-label">Available</div>
                        <div className="summary-count summary-count-available">
                          {towerCounts.available}
                        </div>
                      </div>
                      <div className="tower-summary-item">
                        <div className="summary-label">Block</div>
                        <div className="summary-count summary-count-blocked">
                          {towerCounts.blocked}
                        </div>
                      </div>
                      <div className="tower-summary-item">
                        <div className="summary-label">Sold Out</div>
                        <div className="summary-count summary-count-booked">
                          {towerCounts.booked}
                        </div>
                      </div>
                    </div>

                    <div className={`tower-chevron ${isExpanded ? "chevron-open" : "chevron-closed"}`}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* floors */}
                  {isExpanded && (
                    <div className="tower-card-body">
                    <div className="tower-section-heading">
                      Floor &amp; Room
                    </div>

                    {floors.length ? (
                      floors.map((floor) => {
                        const allUnits = floor.units || [];
                        const filteredUnits = applyFilter(
                          allUnits,
                          statusFilter
                        );

                        // hide floor when filter active and no units
                        if (
                          statusFilter !== "ALL" &&
                          filteredUnits.length === 0
                        ) {
                          return null;
                        }

                        const fCounts = computeCountsForUnits(filteredUnits);
                        const floorLabel = getFloorLabel(floor);

                        return (
                          <div key={floor.id} className="tower-floor-block">
                            {/* floor summary row */}
                            <div className="floor-summary-bar">
                              <div className="floor-badge">{floorLabel}</div>

                              <div className="floor-summary-row">
                                <div className="floor-summary-item">
                                  <div className="summary-label">Available</div>
                                  <div className="summary-count summary-count-available">
                                    {fCounts.available}
                                  </div>
                                </div>
                                <div className="floor-summary-item">
                                  <div className="summary-label">Block</div>
                                  <div className="summary-count summary-count-blocked">
                                    {fCounts.blocked}
                                  </div>
                                </div>
                                <div className="floor-summary-item">
                                  <div className="summary-label">Sold Out</div>
                                  <div className="summary-count summary-count-booked">
                                    {fCounts.booked}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* units */}
                            <div className="tower-floor-units">
                              {filteredUnits && filteredUnits.length ? (
                                filteredUnits.map((unit) => {
                                  const inv = unit.inventory;
                                  const statusCls = getUnitStatusClass(unit);
                                  const statusText = inv
                                    ? getStatusLabelFromCode(
                                        inv.availability_status
                                      )
                                    : "No Inv";

                                  return (
                                    <div
                                      key={unit.id}
                                      className={`unit-card ${statusCls} ${
                                        inv ? "unit-card-has-inventory" : ""
                                      }`}
                                      onClick={() => handleUnitClick(unit.id)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUnitClick(unit.id);
                                        }
                                      }}
                                    >
                                      <div className="unit-card-no">
                                        {unit.unit_no || `Unit ${unit.id}`}
                                      </div>
                                      <div className="unit-card-status-pill">
                                        {statusText}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="empty-text">
                                  No units matching selected filter.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-text">
                        No floors found for this tower.
                      </div>
                    )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="inventory-empty">
              No towers found for this project.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPlanning;
