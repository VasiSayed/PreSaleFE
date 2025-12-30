import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./ChannelPartnerList.css";

export default function ChannelPartnerList() {
  const { user } = useAuth();
  const [channelPartners, setChannelPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCPs = async () => {
      try {
        setLoading(true);

        /* ================= ADMIN ================= */
        if (["ADMIN", "SUPER_ADMIN"].includes(user?.role)) {
          const res = await axiosInstance.get("/channel-partners/");
          setChannelPartners(res.data || []);
          return;
        }

        /* ============== SALES / MANAGER ============== */
        let page = 1;
        let hasNext = true;
        const cpMap = {};

        while (hasNext) {
          const res = await axiosInstance.get(
            "/sales/sales-leads/",
            { params: { page } }
          );

          const data = res.data;
          const results = Array.isArray(data)
            ? data
            : data?.results || [];

          results.forEach((lead) => {
            // ✅ Only Channel Partner leads
            if (lead.source_name !== "Channel Partner") return;

            const cpId =
              lead.channel_partner ||
              lead.channel_partner_name ||
              lead.mobile_number;

            if (!cpId) return;

            cpMap[cpId] = {
              id: cpId,
              company_name:
                lead.channel_partner_name || "Channel Partner",
              user_name:
                lead.channel_partner_detail?.user_name || "—",
              mobile_masked: lead.mobile_number || "—",
              onboarding_status:
                lead.channel_partner_detail?.onboarding_status ||
                "ACTIVE",
            };
          });

          hasNext = Array.isArray(data) ? false : !!data.next;
          page += 1;
        }

        setChannelPartners(Object.values(cpMap));
      } catch (err) {
        console.error("❌ Channel Partner load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCPs();
  }, [user?.role]);

  return (
    <div className="page-container">
      <h1 className="page-title">Channel Partners</h1>

      {loading && <p className="muted-text">Loading channel partners…</p>}

      {!loading && channelPartners.length === 0 && (
        <p className="muted-text">No channel partners found.</p>
      )}

      {!loading && channelPartners.length > 0 && (
        <div className="table-wrapper">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Company Name</th>
                <th>Channel Partner</th>
                <th>Mobile</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {channelPartners.map((cp, index) => (
                <tr key={cp.id || index}>
                  <td>{index + 1}</td>
                  <td>{cp.company_name}</td>
                  <td>{cp.user_name}</td>
                  <td>{cp.mobile_masked}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        cp.onboarding_status === "ACTIVE"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {cp.onboarding_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
