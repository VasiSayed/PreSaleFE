import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LeadSetupAPI,
  AdditionalInfoAPI,
  LeadStageAPI,
  SetupAPI,
} from "../../api/endpoints";
import "./LeadProjectsList.css";

export default function LeadProjectsList() {
  const navigate = useNavigate();

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data on mount and when project changes
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = selectedProject ? { project_id: selectedProject } : {};

      // FIRST: Fetch projects to build project name map
      let projectMap = new Map();
      try {
        const scopeData = await SetupAPI.myScope({ include_units: false });
        const fetchedProjects = scopeData.projects || [];

        fetchedProjects.forEach((project) => {
          projectMap.set(
            project.id,
            project.name || project.project_name || `Project #${project.id}`
          );
        });

        setProjects(
          fetchedProjects.map((p) => ({
            id: p.id,
            name: p.name || p.project_name,
          }))
        );
      } catch (err) {
        console.error("Error loading projects:", err);
      }

      // THEN: Fetch all data in parallel
      const [
        classificationsData,
        sourcesData,
        stagesData,
        visitingHalfData,
        familySizeData,
        residencyOwnershipData,
        possessionDesignedData,
        occupationsData,
        designationsData,
      ] = await Promise.all([
        LeadSetupAPI.getClassifications(params).catch(() => []),
        LeadSetupAPI.getSources(params).catch(() => []),
        LeadStageAPI.getStages(params).catch(() => []),
        AdditionalInfoAPI.getVisitingHalf(params).catch(() => []),
        AdditionalInfoAPI.getFamilySize(params).catch(() => []),
        AdditionalInfoAPI.getResidencyOwnership(params).catch(() => []),
        AdditionalInfoAPI.getPossessionDesigned(params).catch(() => []),
        AdditionalInfoAPI.getOccupations(params).catch(() => []),
        AdditionalInfoAPI.getDesignations(params).catch(() => []),
      ]);

      // Helper to get project name from map
      const getProjectNameFromMap = (projectId) => {
        if (!projectId) return "-";
        return projectMap.get(projectId) || `Project #${projectId}`;
      };

      // Normalize data structure (ONLY ONE VERSION)
      const normalizeData = (data, source, type) => {
        const items = Array.isArray(data) ? data : data.results || [];
        return items.map((item) => ({
          id: item.id,
          name: item.name,
          projectName:
            item.project_name || getProjectNameFromMap(item.project) || "-",
          projectId: item.project,
          source: source,
          type: type,
          createdBy: item.created_by || item.creator || "-",
          createdDate: item.created_at || item.created_date || "-",
          rawData: item,
        }));
      };

      // Combine all data
      const combined = [
        ...normalizeData(
          classificationsData,
          "Lead Classification",
          "Classification"
        ),
        ...normalizeData(sourcesData, "Lead Source", "Source"),
        ...normalizeData(stagesData, "Lead Stage", "Stage"),
        ...normalizeData(
          visitingHalfData,
          "Additional Info",
          "Visiting on behalf"
        ),
        ...normalizeData(
          familySizeData,
          "Additional Info",
          "Current Residence Type"
        ),
        ...normalizeData(
          residencyOwnershipData,
          "Additional Info",
          "Residence Ownership"
        ),
        ...normalizeData(
          possessionDesignedData,
          "Additional Info",
          "Possession Desired"
        ),
        ...normalizeData(occupationsData, "Additional Info", "Occupation"),
        ...normalizeData(designationsData, "Additional Info", "Designation"),
      ];

      // Sort by created date (newest first)
      combined.sort((a, b) => {
        if (!a.createdDate || !b.createdDate) return 0;
        return new Date(b.createdDate) - new Date(a.createdDate);
      });

      setAllData(combined);
    } catch (err) {
      console.error("Error loading lead setup data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search
  const filteredData = allData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      // Route to appropriate delete API
      if (item.source === "Lead Classification") {
        await LeadSetupAPI.deleteClassification(item.id);
      } else if (item.source === "Lead Source") {
        await LeadSetupAPI.deleteSource(item.id);
      } else if (item.source === "Lead Stage") {
        await LeadStageAPI.deleteStage(item.id);
      } else if (item.type === "Visiting on behalf") {
        await AdditionalInfoAPI.deleteVisitingHalf(item.id);
      } else if (item.type === "Current Residence Type") {
        await AdditionalInfoAPI.deleteFamilySize(item.id);
      } else if (item.type === "Residence Ownership") {
        await AdditionalInfoAPI.deleteResidencyOwnership(item.id);
      } else if (item.type === "Possession Desired") {
        await AdditionalInfoAPI.deletePossessionDesigned(item.id);
      } else if (item.type === "Occupation") {
        await AdditionalInfoAPI.deleteOccupation(item.id);
      } else if (item.type === "Designation") {
        await AdditionalInfoAPI.deleteDesignation(item.id);
      }

      alert("Item deleted successfully!");
      loadAllData(); // Reload
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item");
    }
  };

  const handleEdit = (item) => {
    // Route to appropriate form based on source
    if (item.source === "Lead Classification") {
      navigate("/lead-setup?open=classification");
    } else if (item.source === "Lead Source") {
      navigate("/lead-setup?open=source");
    } else if (item.source === "Lead Stage") {
      navigate("/lead-setup?open=stages");
    } else if (item.source === "Additional Info") {
      navigate("/lead-setup?open=additionalInfo");
    } else {
      navigate("/lead-setup");
    }
  };

  const handleView = (item) => {
    alert(
      `View details:\n\nName: ${item.name}\nProject: ${
        item.projectName
      }\nSource: ${item.source}\nType: ${item.type}\nCreated By: ${
        item.createdBy
      }\nCreated Date: ${formatDate(item.createdDate)}`
    );
  };

  const handleAdd = () => {
    navigate("/lead-setup?open=classification");
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
    } catch {
      return dateString;
    }
  };

  return (
    <div className="projects-list-page">
      <div className="projects-list-container">
        {/* Header */}
        <div className="list-header">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-add" onClick={handleAdd}>
              Add
            </button>
          </div>

          <div className="pagination-info">
            {filteredData.length > 0 ? (
              <>
                {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of{" "}
                {filteredData.length}
              </>
            ) : (
              "No results"
            )}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ❮
            </button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              ❯
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
            >
              Loading...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Action</th>
                  <th>Project Name</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={`${item.source}-${item.id}-${index}`}>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(item)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleView(item)}
                            title="View"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                      <td>{item.projectName}</td>
                      <td>{item.source}</td>
                      <td>{item.type}</td>
                      <td>{item.createdBy}</td>
                      <td>{formatDate(item.createdDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#6b7280",
                      }}
                    >
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
