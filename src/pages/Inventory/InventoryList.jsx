import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./InventoryList.css";

const PAGE_SIZE = 10;

export default function InventoryList() {
  const navigate = useNavigate();

  // --- Scope (projects/towers/floors/units) ---
  const [scopeLoading, setScopeLoading] = useState(true);
  const [scopeError, setScopeError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const [towerMap, setTowerMap] = useState({});
  const [unitMap, setUnitMap] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // --- Inventory list ---
  const [rows, setRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // ------------------ LOAD SCOPE ON MOUNT ------------------
  useEffect(() => {
    const fetchScope = async () => {
      setScopeLoading(true);
      setScopeError(null);
      try {
        const r = await axiosInstance.get("client/my-scope/", {
          params: { include_units: "true" },
        });
        const data = r.data || {};
        const projList = data.projects || [];
        setProjects(projList);

        const pMap = {};
        const tMap = {};
        const uMap = {};

        projList.forEach((p) => {
          pMap[p.id] = p;
          (p.towers || []).forEach((t) => {
            tMap[t.id] = { ...t, project_id: p.id };
            (t.floors || []).forEach((f) => {
              (f.units || []).forEach((u) => {
                uMap[u.id] = {
                  ...u,
                  floor_id: f.id,
                  tower_id: t.id,
                  project_id: p.id,
                };
              });
            });
          });
        });

        setProjectMap(pMap);
        setTowerMap(tMap);
        setUnitMap(uMap);

        // auto-select first project
        if (projList.length) {
          const firstId = projList[0].id;
          setSelectedProjectId(firstId);
        }
      } catch (e) {
        console.error(e);
        setScopeError("Failed to load project scope.");
      } finally {
        setScopeLoading(false);
      }
    };

    fetchScope();
  }, []);

  // ------------------ LOAD INVENTORY WHEN PROJECT CHANGES ------------------
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchInventory = async () => {
      setRowsLoading(true);
      try {
        const r = await axiosInstance.get("client/inventory/", {
          params: { project_id: selectedProjectId },
        });
        const data = r.data;
        const items = Array.isArray(data) ? data : data.results ?? [];
        setRows(items);
        setPage(1);
      } catch (e) {
        console.error(e);
      } finally {
        setRowsLoading(false);
      }
    };

    fetchInventory();
  }, [selectedProjectId]);

  // ------------------ DERIVED DATA: SEARCH + PAGINATION ------------------
  const filteredRows = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.toLowerCase();

    return rows.filter((inv) => {
      const projectName = (projectMap[inv.project]?.name || "").toLowerCase();
      const towerName = (towerMap[inv.tower]?.name || "").toLowerCase();
      const unitNo = (
        unitMap[inv.unit]?.unit_no || String(inv.unit || "")
      ).toLowerCase();
      const configLabel = (
        inv.configuration_name ||
        inv.configuration_label ||
        ""
      ).toLowerCase();

      return (
        projectName.includes(qq) ||
        towerName.includes(qq) ||
        unitNo.includes(qq) ||
        configLabel.includes(qq)
      );
    });
  }, [rows, q, projectMap, towerMap, unitMap]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE) || 1
  );

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const fromIndex = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toIndex = Math.min(page * PAGE_SIZE, filteredRows.length);

  // ------------------ HANDLERS ------------------
  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    setPage(1);
  };

  const handleSearchKey = (e) => {
    if (e.key === "Enter") {
      setPage(1);
    }
  };

  // ------------------ RENDER ------------------
  return (
    <div className="inventory-page">
      {/* Top toolbar: search + Add */}
      <div className="inventory-toolbar">
        <div className="search-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <input
            className="search-input"
            placeholder="Search inventory…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleSearchKey}
          />
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/sales/inventory/new")}
        >
          Add
        </button>
      </div>

      {/* Project chips (from my-scope) */}
      <div className="scope-projects">
        {scopeLoading ? (
          <span className="scope-hint">Loading projects…</span>
        ) : scopeError ? (
          <span className="scope-error">{scopeError}</span>
        ) : projects.length ? (
          projects.map((p) => (
            <button
              key={p.id}
              className={
                selectedProjectId === p.id ? "scope-chip active" : "scope-chip"
              }
              onClick={() => handleSelectProject(p.id)}
            >
              {p.name}
            </button>
          ))
        ) : (
          <span className="scope-hint">No projects in scope.</span>
        )}
      </div>

      {/* Pagination text (top-right) */}
      <div className="pagination-hint">
        {filteredRows.length
          ? `${fromIndex}-${toIndex} of ${filteredRows.length}`
          : "0 of 0"}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Action</th>
              <th>Project Name</th>
              <th>Tower Name</th>
              <th>Unit Number</th>
              <th>Unit Configuration</th>
              <th>Attachments</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rowsLoading ? (
              <tr>
                <td colSpan={7}>Loading inventory…</td>
              </tr>
            ) : pagedRows.length ? (
              pagedRows.map((inv) => {
                const projectName = projectMap[inv.project]?.name || "-";
                const towerName = towerMap[inv.tower]?.name || "-";
                const unitInfo = unitMap[inv.unit];
                const unitNumber = unitInfo?.unit_no || inv.unit || "-";
                const configLabel =
                  inv.configuration_name || inv.configuration_label || "-";
                const hasDocs =
                  Array.isArray(inv.documents) && inv.documents.length > 0;
                const statusLabel =
                  inv.availability_status_display ||
                  inv.availability_status ||
                  "-";

                return (
                  <tr key={inv.id}>
                    <td className="row-actions">
                      <button
                        title="Edit"
                        className="icon-btn"
                        onClick={() =>
                          navigate(`/sales/inventory/${inv.id}/edit`)
                        }
                      >
                        ✏️
                      </button>
                      <button
                        title="Delete"
                        className="icon-btn"
                        onClick={() =>
                          window.alert("TODO: hook delete API for id " + inv.id)
                        }
                      >
                        🗑️
                      </button>
                      <button
                        title="View"
                        className="icon-btn"
                        onClick={() => navigate(`/inventory/unit/${inv.id}`)}
                      >
                        👁️
                      </button>
                    </td>
                    <td>{projectName}</td>
                    <td>{towerName}</td>
                    <td>{unitNumber}</td>
                    <td>{configLabel}</td>
                    <td className="attachments-cell">
                      {hasDocs ? <span className="pdf-chip">PDF</span> : "-"}
                    </td>
                    <td>{statusLabel}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>No inventory found for this project.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pager buttons */}
      <div className="pager">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ‹
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          ›
        </button>
      </div>
    </div>
  );
}