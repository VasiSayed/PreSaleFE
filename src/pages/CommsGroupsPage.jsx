import React, { useMemo, useState } from "react";
import CommsCrudPage from "../components/CommsCrudPage";
import { EP, toTitleCase, fmtDT } from "../components/commsUtils";

import axiosInstance from "../api/axiosInstance";
import {
  safeList,
  flattenTowers,
  flattenFloors,
  flattenUnits,
} from "../components/commsUtils";

const DN_CUSTOMERS_API = "/financial/demand-notes/customers/";

/* ---------------- Searchable Multi Pick (checkbox + row click both works) ---------------- */
function SearchableMultiPick({
  label,
  loading,
  items,
  getKey,
  getLabel,
  selectedKeys,
  onToggleKey,
  searchValue,
  onSearchChange,
  height = 240,
}) {
  const filtered = useMemo(() => {
    const q = String(searchValue || "")
      .trim()
      .toLowerCase();
    if (!q) return items || [];
    return (items || []).filter((it) => getLabel(it).toLowerCase().includes(q));
  }, [items, searchValue, getLabel]);

  return (
    <div
      className="dn-field"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <label>{label}</label>

      <input
        className="dn-input"
        placeholder="Search..."
        value={searchValue || ""}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <div
        className="dn-input"
        style={{
          padding: 8,
          height,
          overflow: "auto",
          background: "#fff",
          borderRadius: 12,
        }}
      >
        {loading ? <div style={{ padding: 8 }}>Loading...</div> : null}
        {!loading && filtered.length === 0 ? (
          <div style={{ padding: 8, opacity: 0.7 }}>No results</div>
        ) : null}

        {(filtered || []).map((it) => {
          const k = String(getKey(it));
          const checked = selectedKeys.includes(k);

          return (
            <div
              key={k}
              onClick={() => onToggleKey(k)} // ✅ row click toggles
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "8px 8px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                userSelect: "none",
                borderRadius: 10,
              }}
              title="Click to select"
            >
              {/* ✅ checkbox click toggles (FIX) */}
              <input
                type="checkbox"
                checked={checked}
                onClick={(e) => e.stopPropagation()} // prevent row double toggle
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleKey(k);
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>
                  {getLabel(it)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupsMembersEditor({ scope, form, setField, formProjectId }) {
  const [custLoading, setCustLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // ✅ Filters popup modal state
  const [mfOpen, setMfOpen] = useState(false);

  // filter states (stored in form so they persist while editing)
  const memberTowerId = form.member_filter_tower_id || "";
  const memberFloorId = form.member_filter_floor_id || "";
  const memberUnitId = form.member_filter_unit_id || "";
  const onlyWithDn = !!form.member_only_with_dn;
  const emailContains = form.member_email_contains || "";
  const emailExact = form.member_email_exact || "";

  // UI search (customers list)
  const uiSearch = form.member_ui_search || "";

  const members = Array.isArray(form.members) ? form.members : [];
  const selectedKeys = members.map((m) => String(m.user)).filter(Boolean);

  const towers = useMemo(
    () => flattenTowers(scope, formProjectId),
    [scope, formProjectId],
  );
  const floors = useMemo(
    () => flattenFloors(scope, formProjectId, memberTowerId),
    [scope, formProjectId, memberTowerId],
  );
  const units = useMemo(
    () => flattenUnits(scope, formProjectId, memberTowerId, memberFloorId),
    [scope, formProjectId, memberTowerId, memberFloorId],
  );

  // ✅ robust uid extraction
  const extractUserId = (c) => {
    if (!c) return null;
    if (typeof c.user === "number") return c.user;
    if (c.user && typeof c.user === "object") {
      const v = c.user.id ?? c.user.user_id ?? c.user.pk;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    const candidates = [
      c.user_id,
      c.userId,
      c.customer_user_id,
      c.customerUserId,
      c.account_user_id,
      c.accountUserId,
      c.owner_user_id,
    ];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };

  const customerLabel = (c) => {
    const email = c?.email || c?.user_email || c?.username || "";
    const name = c?.full_name || c?.name || c?.customer_name || "";
    const uid = c?.__uid ?? extractUserId(c);
    return name ? `${name} • ${email}` : email || `User #${uid || "-"}`;
  };

  const fetchCustomers = async () => {
    if (!formProjectId) {
      setCustomers([]);
      return;
    }
    setCustLoading(true);
    try {
      const params = {
        page_size: 50,
        project_id: Number(formProjectId),
        project_ids: String(formProjectId),
      };

      if (memberTowerId) params.tower_ids = String(memberTowerId);
      if (memberUnitId) params.unit_ids = String(memberUnitId);

      if (String(emailExact || "").trim())
        params.email_exact = String(emailExact).trim();
      else if (String(emailContains || "").trim())
        params.email = String(emailContains).trim();

      if (onlyWithDn) params.only_with_dn = true;

      const res = await axiosInstance.get(DN_CUSTOMERS_API, { params });
      const list = safeList(res.data).map((c) => ({
        ...c,
        __uid: extractUserId(c),
      }));

      setCustomers(list.filter((c) => Number.isFinite(Number(c.__uid))));
    } catch {
      setCustomers([]);
    } finally {
      setCustLoading(false);
    }
  };

  // ✅ auto refresh customers when filters change
  React.useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formProjectId,
    memberTowerId,
    memberUnitId,
    emailContains,
    emailExact,
    onlyWithDn,
  ]);

  const toggleMember = (keyStr) => {
    const uid = Number(keyStr);
    if (!Number.isFinite(uid)) return;

    const exists = members.find((m) => Number(m.user) === uid);
    if (exists) {
      setField(
        "members",
        members.filter((m) => Number(m.user) !== uid),
      );
      return;
    }

    const cust = customers.find((c) => Number(c.__uid) === uid);
    setField("members", [
      ...members,
      {
        user: uid,
        role: "MEMBER",
        label: cust ? customerLabel(cust) : `User #${uid}`,
      },
    ]);
  };

  const setMemberRole = (uid, role) => {
    setField(
      "members",
      members.map((m) => (Number(m.user) === Number(uid) ? { ...m, role } : m)),
    );
  };

  const clearSelected = () => setField("members", []);

  const clearMemberFilters = () => {
    setField("member_filter_tower_id", "");
    setField("member_filter_floor_id", "");
    setField("member_filter_unit_id", "");
    setField("member_email_contains", "");
    setField("member_email_exact", "");
    setField("member_only_with_dn", false);
  };

  const filtersSummary = () => {
    const parts = [];
    if (memberTowerId) parts.push(`Tower: ${memberTowerId}`);
    if (memberUnitId) parts.push(`Unit: ${memberUnitId}`);
    if (emailExact) parts.push(`Email exact`);
    else if (emailContains) parts.push(`Email contains`);
    if (onlyWithDn) parts.push(`Only with DN`);
    return parts.length ? parts.join(" • ") : "No filters";
  };

  return (
    <>
      {/* Header bar */}
      <div className="dn-field dn-span-3" style={{ marginTop: 8 }}>
        <div
          className="dn-input"
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900 }}>
            Members{" "}
            <span style={{ fontWeight: 700, opacity: 0.7 }}>
              ({members.length})
            </span>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              {filtersSummary()}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {/* ✅ FILTERS opens POPUP MODAL */}
            <button
              type="button"
              className="dn-btn dn-btn-light"
              onClick={() => setMfOpen(true)}
              title="Member Filters"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <i className="fa fa-filter" />
              Filters
            </button>

            <button
              type="button"
              className="dn-btn dn-btn-light"
              onClick={fetchCustomers}
              disabled={custLoading}
            >
              <i className="fa fa-refresh" style={{ marginRight: 6 }} />
              Refresh
            </button>

            <button
              type="button"
              className="dn-btn dn-btn-light"
              onClick={clearSelected}
              disabled={members.length === 0}
            >
              Clear Selected
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MAIN MEMBERS UI — 3 per line: Customers / Selected / Summary */}
      <SearchableMultiPick
        label="Customers"
        loading={custLoading}
        items={customers}
        getKey={(c) => c.__uid}
        getLabel={(c) => customerLabel(c)}
        selectedKeys={selectedKeys}
        onToggleKey={toggleMember}
        searchValue={uiSearch}
        onSearchChange={(v) => setField("member_ui_search", v)}
        height={260}
      />

      <div className="dn-field">
        <label>Selected Members</label>
        <div
          className="dn-input"
          style={{
            padding: 10,
            background: "#fff",
            borderRadius: 12,
            height: 300,
            overflow: "auto",
          }}
        >
          {members.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No members selected.</div>
          ) : (
            members.map((m) => (
              <div
                key={String(m.user)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div className="dn-wrap" style={{ fontWeight: 800 }}>
                  {m.label || `User #${m.user}`}
                </div>

                <select
                  className="dn-select"
                  value={m.role || "MEMBER"}
                  onChange={(e) => setMemberRole(m.user, e.target.value)}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="MOD">MOD</option>
                  <option value="OWNER">OWNER</option>
                </select>

                <button
                  type="button"
                  className="dn-btn dn-btn-light"
                  onClick={() => toggleMember(String(m.user))}
                  style={{ gridColumn: "1 / span 2" }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dn-field">
        <label>Summary</label>
        <div
          className="dn-input"
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 12,
            height: 300,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            Selected: {members.length}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            ✅ Checkbox ya row click se select/unselect. <br />✅ Filters popup
            se apply.
          </div>

          <button
            type="button"
            className="dn-btn dn-btn-light"
            onClick={() => {
              setField(
                "members",
                members.map((m) => ({ ...m, role: "MEMBER" })),
              );
            }}
            disabled={members.length === 0}
          >
            Set All Role = MEMBER
          </button>
        </div>
      </div>

      {/* ✅ FILTER POPUP MODAL */}
      {mfOpen ? (
        <div
          className="dn-modal-overlay"
          onMouseDown={(e) => {
            e.stopPropagation(); // ✅ parent modal close prevent
            setMfOpen(false);
          }}
          style={{ zIndex: 9999999 }}
        >
          <div
            className="dn-modal dn-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: 950 }}
          >
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">Member Filters</div>
              </div>
              <button className="dn-close-btn" onClick={() => setMfOpen(false)}>
                ×
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="dn-grid">
                {/* ✅ Row 1: Tower / Floor / Unit */}
                <div className="dn-field">
                  <label>Member Tower</label>
                  <select
                    className="dn-select"
                    value={memberTowerId}
                    onChange={(e) => {
                      setField("member_filter_tower_id", e.target.value);
                      setField("member_filter_floor_id", "");
                      setField("member_filter_unit_id", "");
                    }}
                    disabled={!formProjectId}
                  >
                    <option value="">
                      {!formProjectId ? "Select project first" : "All"}
                    </option>
                    {towers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {toTitleCase(t.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dn-field">
                  <label>Member Floor</label>
                  <select
                    className="dn-select"
                    value={memberFloorId}
                    onChange={(e) => {
                      setField("member_filter_floor_id", e.target.value);
                      setField("member_filter_unit_id", "");
                    }}
                    disabled={!memberTowerId}
                  >
                    <option value="">
                      {!memberTowerId ? "Pick tower first" : "All"}
                    </option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        Floor {f.number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dn-field">
                  <label>Member Unit</label>
                  <select
                    className="dn-select"
                    value={memberUnitId}
                    onChange={(e) =>
                      setField("member_filter_unit_id", e.target.value)
                    }
                    disabled={!memberFloorId}
                  >
                    <option value="">
                      {!memberFloorId ? "Pick floor first" : "All"}
                    </option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_no} ({u.status || "-"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ Row 2: Email contains / Email exact / Only DN */}
                <div className="dn-field">
                  <label>Email contains</label>
                  <input
                    className="dn-input"
                    placeholder="gmail.com"
                    value={emailContains}
                    onChange={(e) => {
                      setField("member_email_contains", e.target.value);
                      setField("member_email_exact", "");
                    }}
                  />
                </div>

                <div className="dn-field">
                  <label>Email exact</label>
                  <input
                    className="dn-input"
                    placeholder="abc@xyz.com"
                    value={emailExact}
                    onChange={(e) => {
                      setField("member_email_exact", e.target.value);
                      if (e.target.value) setField("member_email_contains", "");
                    }}
                  />
                </div>

                <div
                  className="dn-field"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <label style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={onlyWithDn}
                      onChange={(e) =>
                        setField("member_only_with_dn", e.target.checked)
                      }
                      style={{ marginRight: 8 }}
                    />
                    Only customers having DN
                  </label>
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={() => setMfOpen(false)}
              >
                Cancel
              </button>

              <button
                className="dn-btn dn-btn-light"
                onClick={() => {
                  clearMemberFilters();
                  fetchCustomers();
                }}
              >
                Clear
              </button>

              <button
                className="dn-btn dn-btn-primary"
                onClick={() => {
                  fetchCustomers();
                  setMfOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


export default function CommsGroupsPage() {
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [membersList, setMembersList] = useState([]);
  const [membersTitle, setMembersTitle] = useState("");

  const closeMembers = () => setMembersOpen(false);

  const openMembers = async (groupRow) => {
    setMembersOpen(true);
    setMembersLoading(true);
    setMembersError("");
    setMembersList([]);
    setMembersTitle(toTitleCase(groupRow?.name || "Members"));

    try {
      const res = await axiosInstance.get(
        `/communications/groups/${groupRow.id}/`,
        {
          params: groupRow?.project
            ? { project_id: groupRow.project }
            : undefined,
        },
      );

      const data = res?.data || {};
      const list =
        data.members ||
        data.group_members ||
        data.memberships ||
        data.results ||
        [];

      if (!Array.isArray(list)) setMembersError("Members not returned by API.");
      else setMembersList(list);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load members.";
      setMembersError(String(msg));
    } finally {
      setMembersLoading(false);
    }
  };

  return (
    <>
      <CommsCrudPage
        pageTitle="Groups"
        endpoint={EP.groups}
        orderingOptions={[
          { value: "-created_at", label: "Created DESC" },
          { value: "created_at", label: "Created ASC" },
          { value: "name", label: "Name ASC" },
          { value: "-name", label: "Name DESC" },
        ]}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (r) => toTitleCase(r?.name || "-"),
            className: "dn-wrap",
          },
          { key: "visibility", label: "Visibility" },
          { key: "join_policy", label: "Join Policy" },
          {
            key: "members",
            label: "Members",
            render: (r) => {
              const n =
                r?.members_count ??
                r?.member_count ??
                (Array.isArray(r?.members) ? r.members.length : null);

              return (
                <button
                  className="dn-btn dn-btn-light"
                  onClick={() => openMembers(r)}
                >
                  View{n != null ? ` (${n})` : ""}
                </button>
              );
            },
          },
          {
            key: "created_at",
            label: "Created",
            render: (r) => fmtDT(r?.created_at),
          },
        ]}
        /* ✅ ALL 3-per-line: name + visibility + join_policy in row 1, description in row 2 column 1 */
        formFields={[
          { name: "name", label: "Name" },
          {
            name: "visibility",
            label: "Visibility",
            type: "select",
            options: [
              { value: "PUBLIC", label: "PUBLIC" },
              { value: "PRIVATE", label: "PRIVATE" },
              { value: "SECRET", label: "SECRET" },
            ],
          },
          {
            name: "join_policy",
            label: "Join Policy",
            type: "select",
            options: [
              { value: "OPEN", label: "OPEN" },
              { value: "REQUEST", label: "REQUEST" },
              { value: "INVITE", label: "INVITE" },
            ],
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            rows: 3,
          },
        ]}
        withAudience={false}
        renderFormExtra={({ scope, form, setField, formProjectId }) => (
          <GroupsMembersEditor
            scope={scope}
            form={form}
            setField={setField}
            formProjectId={formProjectId}
          />
        )}
        createRequest={async ({ payload, formProjectId }) => {
          await axiosInstance.post(
            "/communications/groups/upsert-with-members/",
            payload,
            {
              params: { project_id: formProjectId },
            },
          );
        }}
        updateRequest={async ({ payload, formProjectId }) => {
          await axiosInstance.post(
            "/communications/groups/upsert-with-members/",
            payload,
            {
              params: { project_id: formProjectId },
            },
          );
        }}
        hydrateEditingForm={async ({ item }) => {
          try {
            const res = await axiosInstance.get(
              `/communications/groups/${item.id}/`,
            );
            const data = res?.data || {};
            const list = Array.isArray(data.members) ? data.members : [];
            const normalized = list
              .map((m) => ({
                user: m?.user || m?.user_id || m?.id,
                role: m?.role || "MEMBER",
                label:
                  m?.full_name ||
                  m?.name ||
                  m?.email ||
                  m?.username ||
                  (m?.user ? `User #${m.user}` : ""),
              }))
              .filter((x) => Number.isFinite(Number(x.user)));
            return { members: normalized };
          } catch {
            return {};
          }
        }}
        /* ✅ remove include_creator_as_owner completely (not sent) */
        buildCreatePayload={({ form }) => ({
          name: form.name || "",
          description: form.description || "",
          visibility: form.visibility || "PRIVATE",
          join_policy: form.join_policy || "REQUEST",
          members: (Array.isArray(form.members) ? form.members : []).map(
            (m) => ({
              user: Number(m.user),
              role: m.role || "MEMBER",
            }),
          ),
        })}
        buildUpdatePayload={({ form }) => ({
          name: form.name || "",
          description: form.description || "",
          visibility: form.visibility || "PRIVATE",
          join_policy: form.join_policy || "REQUEST",
          members: (Array.isArray(form.members) ? form.members : []).map(
            (m) => ({
              user: Number(m.user),
              role: m.role || "MEMBER",
            }),
          ),
        })}
      />

      {membersOpen ? (
        <div className="dn-modal-overlay" onMouseDown={closeMembers}>
          <div
            className="dn-modal dn-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">{membersTitle}</div>
              </div>
              <button className="dn-close-btn" onClick={closeMembers}>
                ×
              </button>
            </div>

            <div className="dn-modal-body">
              {membersLoading ? (
                <div className="dn-loading">Loading...</div>
              ) : null}
              {membersError ? (
                <div className="dn-error dn-mb">{membersError}</div>
              ) : null}

              {!membersLoading && !membersError ? (
                <div
                  className="dn-input"
                  style={{ background: "#fff", padding: 10, borderRadius: 12 }}
                >
                  {membersList.length === 0 ? (
                    <div style={{ opacity: 0.7 }}>No members returned.</div>
                  ) : (
                    membersList.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 160px",
                          gap: 10,
                          padding: "10px 0",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div className="dn-wrap">
                          {m?.full_name ||
                            m?.name ||
                            m?.email ||
                            m?.username ||
                            `User ${m?.user || m?.id || "-"}`}
                        </div>
                        <div style={{ fontWeight: 900 }}>{m?.role || "-"}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="dn-modal-footer">
              <button className="dn-btn dn-btn-light" onClick={closeMembers}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
