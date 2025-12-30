import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChannelAPI ,ChannelAPII} from "../../api/endpoints"; // adjust path if needed
import "./ChannelPartnerList.css";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function ChannelPartnerList() {
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]); // flattened [ { projectName, partnerName, ... } ]
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setPage(1);
        setQ(val);
      }, 350),
    []
  );

  // const loadPartners = async () => {
  //   setLoading(true);
  //   try {
  //     const data = await ChannelAPI.listAdminPartners();
  //     // data = { admin_id, projects: [...] }

  //     const flat = (data.projects || []).flatMap((project) =>
  //       (project.channel_partners || []).map((cp) => ({
  //         id: cp.id,
  //         partnerName: cp.user_name,
  //         mobile: cp.mobile_number,
  //         sourceName: cp.source_name,
  //         status: cp.status,
  //         onboardingStatus: cp.onboarding_status,
  //         projectName: project.name,
  //         projectStatus: project.status,
  //         projectApprovalStatus: project.approval_status,
  //       }))
  //     );

  //     setPartners(flat);
  //   } catch (err) {
  //     console.error("Error loading admin project channel partners:", err);
  //     setPartners([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  
 const loadPartners = async () => {
  setLoading(true);
  try {
    // 1️⃣ Fetch both APIs
    const [projectRes, dashboardRes] = await Promise.all([
      ChannelAPII.listAdminProjectPartners(),
      ChannelAPII.getAdminDashboard(),
    ]);

    const projects = projectRes?.projects || [];

    const cpSummary =
      dashboardRes?.data?.channel_partners?.cp_summary || [];

    // 2️⃣ Convert CP summary into map
    const cpMap = {};
    cpSummary.forEach((cp) => {
      cpMap[cp.cp_id] = cp;
    });

    // 3️⃣ Build frontend list (merge)
    const flat = [];

    projects.forEach((project) => {
      Object.values(cpMap).forEach((cp) => {
        flat.push({
          id: cp.cp_id,
          partnerName: cp.name,
          mobile: "-",
          sourceName: "Channel Partner",

          projectName: project.name,
          projectStatus: project.status,
          projectApprovalStatus: project.approval_status,

         
          status: "ACTIVE",

          leadsCount: cp.leads_count ?? 0,
          bookingsCount: cp.bookings_count ?? 0,
          bookedValue: cp.booked_value ?? 0,
        });
      });
    });

    setPartners(flat);
  } catch (err) {
    console.error("Failed to load channel partners", err);
    setPartners([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPartners();
  }, []);

  // Client-side search
  const filteredData = useMemo(() => {
    const query = q.toLowerCase();
    return partners.filter((p) => {
      return (
        (p.partnerName || "").toLowerCase().includes(query) ||
        (p.projectName || "").toLowerCase().includes(query) ||
        (p.mobile || "").includes(q) ||
        (p.sourceName || "").toLowerCase().includes(query)
      );
    });
  }, [partners, q]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this partner?")) {
      console.log("Delete partner:", id);
      alert("Delete functionality coming soon!");
    }
  };

  const handleAdd = () => {
    navigate("/channel-partner-setup?open=identity");
  };

  const getStatusBadgeClass = (status) =>
    status === "ACTIVE" ? "badge-active" : "badge-inactive";

  return (
    <div className="partner-list-page">
      <div className="partner-list-container">
        {/* Header */}
        <div className="list-header">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by partner, project, mobile, source..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <button className="btn-add" onClick={handleAdd}>
              Add Partner
            </button>
          </div>

          <div className="pagination-info">
            {filteredData.length > 0 ? (
              <>
                {filteredData.length === 0
                  ? "No results"
                  : `${startIndex + 1}-${Math.min(
                      endIndex,
                      filteredData.length
                    )} of ${filteredData.length}`}
              </>
            ) : (
              "No results"
            )}
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ❮
            </button>
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ❯
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {/* <th style={{ width: "120px" }}>Actions</th> */}
                  <th>Project</th>
                  <th>Partner</th>
                  {/* <th>Mobile</th> */}
                  <th>Source</th>
                  <th>Project Status</th>
                  <th>Approval</th>
                 
                  <th>Partner Status</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((row) => (
                    <tr key={`${row.projectName}-${row.id}`}>
                      {/* <td className="row-actions">
                        <button
                          title="View"
                          className="action-btn view-btn"
                          onClick={() =>
                            alert("View functionality coming soon!")
                          }
                        >
                          👁️
                        </button>
                        <button
                          title="Edit"
                          className="action-btn edit-btn"
                          onClick={() =>
                            navigate(
                              `/channel-partner-setup?open=identity&partner_id=${row.id}`
                            )
                          }
                        >
                          ✏️
                        </button>
                        <button
                          title="Delete"
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(row.id)}
                        >
                          🗑️
                        </button> */}
                      
                      <td>{row.projectName}</td>
                      <td className="partner-name">{row.partnerName}</td>
                      {/* <td>{row.mobile}</td> */}
                      <td>{row.sourceName}</td>
                      <td>{row.projectStatus}</td>
                      <td>{row.projectApprovalStatus}</td>
                      
                      <td>
                        <span
                          className={`status-badge ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      No channel partners found for your projects
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
