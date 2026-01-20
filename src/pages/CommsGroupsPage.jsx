// CommsGroupsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import CommsCrudPage from "../components/CommsCrudPage";
import {
  EP,
  toTitleCase,
  fmtDT,
  safeList,
  flattenTowers,
  flattenFloors,
  flattenUnits,
} from "../components/commsUtils";

/* ---------------- customers api ---------------- */
const DN_CUSTOMERS_API = "/financial/demand-notes/customers/";

/* ---------------- group members api (by group) ---------------- */
const GROUP_MEMBERS_BY_GROUP_API = "/communications/group-members/by-group/";

/* ---------------- tiny modal (uses your existing dn-modal css) ---------------- */
function DnModal({ open, title, onClose, wide, children, footer }) {
  if (!open) return null;

  return (
    <div className="dn-modal-overlay" onMouseDown={onClose}>
      <div
        className={`dn-modal ${wide ? "dn-modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dn-modal-header">
          <div className="dn-modal-header-left dn-modal-header-left-center">
            <div className="dn-modal-title">{title}</div>
          </div>
          <button className="dn-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dn-modal-body">{children}</div>

        {footer ? <div className="dn-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------- small ui: searchable multi select ---------------- */
function SearchableMultiPick({
  label,
  hint,
  loading,
  items,
  getKey,
  getLabel,
  selectedKeys,
  onToggleKey,
  searchValue,
  onSearchChange,
  rightSlot,
}) {
  const filtered = useMemo(() => {
    const q = String(searchValue || "")
      .trim()
      .toLowerCase();
    if (!q) return items || [];
    return (items || []).filter((it) =>
      String(getLabel(it) || "")
        .toLowerCase()
        .includes(q),
    );
  }, [items, searchValue, getLabel]);

  return (
    <div className="dn-field dn-span-3">
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span>{label}</span>
        {rightSlot ? <span>{rightSlot}</span> : null}
      </label>

      {hint ? (
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
          {hint}
        </div>
      ) : null}

      <input
        className="dn-input"
        placeholder="Search customer..."
        value={searchValue || ""}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <div
        className="dn-input"
        style={{
          padding: 8,
          height: 260,
          overflow: "auto",
          background: "#fff",
          borderRadius: 12,
        }}
      >
        {loading ? <div style={{ padding: 8 }}>Loading...</div> : null}
        {!loading && filtered.length === 0 ? (
          <div style={{ padding: 8, opacity: 0.7 }}>No results</div>
        ) : null}

        {(filtered || []).map((it, idx) => {
          const kRaw = getKey(it);
          const k =
            kRaw === null || kRaw === undefined ? "" : String(kRaw).trim();
          const disabled =
            !k || k === "undefined" || k === "null" || k === "NaN";
          const checked = !disabled && selectedKeys.includes(k);

          return (
            <div
              key={`${k || "x"}-${idx}`}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "8px 8px",
                borderBottom: "1px solid #f1f5f9",
                borderRadius: 10,
                opacity: disabled ? 0.55 : 1,
              }}
              title={disabled ? "Not selectable (missing customer_id)" : ""}
            >
              {/* ✅ ONLY checkbox toggles */}
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  if (disabled) return;
                  onToggleKey(k);
                }}
                style={{ cursor: disabled ? "not-allowed" : "pointer" }}
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

/* ---------------- members editor (fetch customers based on filters) ---------------- */
function GroupsMembersEditor({ scope, form, setField, formProjectId }) {
  const [custLoading, setCustLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // filters modal
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  // UI state (saved in form)
  const memberTowerId = form.member_filter_tower_id || "";
  const memberFloorId = form.member_filter_floor_id || "";
  const memberUnitId = form.member_filter_unit_id || "";

  const onlyWithDn = !!form.member_only_with_dn;
  const emailContains = form.member_email_contains || "";
  const emailExact = form.member_email_exact || "";
  const uiSearch = form.member_ui_search || "";

  const members = Array.isArray(form.members) ? form.members : [];
  const selectedKeys = members
    .map((m) => String(m.user))
    .filter((x) => x && x !== "undefined");

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

  // ✅ YOUR API returns: { customer_id, customer_name, email ... }
  const toNum = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const extractSelectableId = (c) => {
    if (!c) return null;
    const cid = toNum(c.customer_id ?? c.customerId);
    if (cid !== null) return cid;
    const id1 = toNum(c.user_id ?? c.userId);
    if (id1 !== null) return id1;
    const id2 = toNum(c.id);
    if (id2 !== null) return id2;
    return null;
  };

  const customerLabel = (c) => {
    const name = c?.customer_name || c?.full_name || c?.name || "";
    const email = c?.email || c?.user_email || c?.username || "";
    const head = name ? `${name} • ${email}` : email || "-";
    return head || "-";
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
      if (memberFloorId) params.floor_ids = String(memberFloorId);
      if (memberUnitId) params.unit_ids = String(memberUnitId);

      if (String(emailExact || "").trim()) {
        params.email_exact = String(emailExact).trim();
      } else if (String(emailContains || "").trim()) {
        params.email = String(emailContains).trim();
      }

      if (onlyWithDn) params.only_with_dn = true;

      const res = await axiosInstance.get(DN_CUSTOMERS_API, { params });

      const raw = res?.data?.results ?? res?.data ?? [];
      const arr = Array.isArray(raw) ? raw : safeList(raw);

      const list = (arr || [])
        .map((c) => {
          const uid = extractSelectableId(c);
          return { ...c, __uid: uid };
        })
        .filter((c) => Number.isFinite(Number(c.__uid)));

      setCustomers(list);
    } catch {
      setCustomers([]);
    } finally {
      setCustLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formProjectId,
    memberTowerId,
    memberFloorId,
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
        label: cust ? customerLabel(cust) : `Customer #${uid}`,
      },
    ]);
  };

  const setMemberRole = (uid, role) => {
    setField(
      "members",
      members.map((m) => (Number(m.user) === Number(uid) ? { ...m, role } : m)),
    );
  };

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
    if (memberFloorId) parts.push(`Floor: ${memberFloorId}`);
    if (memberUnitId) parts.push(`Unit: ${memberUnitId}`);
    if (emailExact) parts.push(`Email exact`);
    else if (emailContains) parts.push(`Email contains`);
    if (onlyWithDn) parts.push(`Only with DN`);
    return parts.length ? parts.join(" • ") : "No member filters";
  };

  return (
    <div
      className="dn-field dn-span-3"
      style={{ borderTop: "1px solid #eef2f7", paddingTop: 12 }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 14 }}>Members</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="dn-btn dn-btn-light"
            onClick={() => setFiltersModalOpen(true)}
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
            title="Refresh Customers"
          >
            <i className="fa fa-refresh" style={{ marginRight: 6 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* compact summary */}
      <div
        className="dn-input"
        style={{
          background: "#fff",
          padding: "10px 12px",
          borderRadius: 12,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85 }} className="dn-wrap">
          <i className="fa fa-info-circle" style={{ marginRight: 6 }} />
          {filtersSummary()}
        </div>

        <div style={{ fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>
          Selected: <b>{members.length}</b>
        </div>
      </div>

      <div className="dn-grid">
        {/* picker */}
        <SearchableMultiPick
          label="Select Members (searchable)"
          hint="Project/Tower/Unit/email change hote hi customers load hote hai."
          loading={custLoading}
          items={customers}
          getKey={(c) => c.__uid}
          getLabel={(c) => customerLabel(c)}
          selectedKeys={selectedKeys}
          onToggleKey={toggleMember}
          searchValue={uiSearch}
          onSearchChange={(v) => setField("member_ui_search", v)}
          rightSlot={
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              {custLoading ? "Loading..." : `${customers.length} customers`}
            </span>
          }
        />

        {/* selected list with roles */}
        <div className="dn-field dn-span-3">
          <label>Selected Members + Role</label>
          <div
            className="dn-input"
            style={{ padding: 10, background: "#fff", borderRadius: 12 }}
          >
            {members.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No members selected.</div>
            ) : (
              members.map((m) => (
                <div
                  key={String(m.user)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 90px",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div className="dn-wrap" style={{ fontWeight: 800 }}>
                    {m.label || `Customer #${m.user}`}
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
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filters modal */}
      <DnModal
        open={filtersModalOpen}
        title="Member Filters"
        onClose={() => setFiltersModalOpen(false)}
        wide
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              type="button"
              className="dn-btn dn-btn-light"
              onClick={clearMemberFilters}
              title="Clear member filters"
            >
              Clear
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="dn-btn dn-btn-light"
                onClick={fetchCustomers}
                disabled={custLoading}
                title="Refresh Customers"
              >
                <i className="fa fa-refresh" style={{ marginRight: 6 }} />
                Refresh
              </button>

              <button
                type="button"
                className="dn-btn"
                onClick={() => setFiltersModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        }
      >
        {/* Row 1 */}
        <div className="dn-grid" style={{ marginTop: 0 }}>
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
        </div>

        {/* Row 2 */}
        <div className="dn-grid" style={{ marginTop: 0 }}>
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

        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          <i className="fa fa-info-circle" style={{ marginRight: 6 }} />
          Filters change hote hi customers auto-load hote hai.
        </div>
      </DnModal>
    </div>
  );
}

/* ---------------- MAIN PAGE ---------------- */
export default function CommsGroupsPage() {
  // members modal (view)
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [membersList, setMembersList] = useState([]);
  const [membersTitle, setMembersTitle] = useState("");
  const [membersCount, setMembersCount] = useState(0);
  const [membersGroup, setMembersGroup] = useState(null);

  const closeMembers = () => setMembersOpen(false);

  const pickRowProjectId = (r) =>
    r?.project_id ?? r?.projectId ?? r?.project ?? r?.project?.id ?? null;

  // ✅ user object from API: m.user = {id, username, first_name, last_name, email, role}
  const pickUserObj = (m) => (m && typeof m.user === "object" ? m.user : null);

  const memberUserInfo = (m) => {
    const u = pickUserObj(m);
    const uid = u?.id ?? m?.user ?? m?.user_id ?? "-";

    const fullName = [u?.first_name, u?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const email = u?.email || "";
    const username = u?.username || "";

    const head = fullName
      ? `${fullName}${email ? ` • ${email}` : ""}`
      : email || username || `User #${uid}`;

    const sub = username && !head.includes(username) ? username : "";
    return {
      uid,
      head,
      sub,
      userRole: u?.role || "-",
      memberRole: m?.role || "-",
      active: !!m?.is_active,
      joinedAt: m?.joined_at,
    };
  };

  // ✅ View members using /group-members/by-group/
  const openMembers = async (groupRow) => {
    setMembersOpen(true);
    setMembersLoading(true);
    setMembersError("");
    setMembersList([]);
    setMembersCount(0);
    setMembersGroup(null);
    setMembersTitle(toTitleCase(groupRow?.name || "Members"));

    const projectId = pickRowProjectId(groupRow);
    const groupId = groupRow?.id;

    if (!projectId || !groupId) {
      setMembersError("Missing project_id or group_id for this row.");
      setMembersLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.get(GROUP_MEMBERS_BY_GROUP_API, {
        params: { project_id: Number(projectId), group_id: Number(groupId) },
      });

      const data = res?.data || {};
      const group = data?.group || null;
      const list = Array.isArray(data?.results) ? data.results : [];

      setMembersGroup(group);
      setMembersTitle(toTitleCase(group?.name || groupRow?.name || "Members"));
      setMembersCount(Number(data?.count ?? list.length ?? 0));
      setMembersList(list);
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

  // ✅ tries to open edit via ctx; if not present, let row-click handle it
  const tryOpenEditFromCtx = (ctx, row) => {
    const fn =
      ctx?.openEdit ||
      ctx?.editRow ||
      ctx?.onEditRow ||
      ctx?.handleEdit ||
      ctx?.startEdit ||
      ctx?.setEditingItem ||
      ctx?.setEditItem;

    if (typeof fn === "function") {
      fn(row);
      return true;
    }
    return false;
  };

  const Meta = ({ label, value }) => (
    <div
      style={{
        minWidth: 120,
        flex: "1 1 140px",
        background: "#fff",
        border: "1px solid #eef2f7",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 900, marginTop: 2 }}>{value ?? "-"}</div>
    </div>
  );

  const StatusPill = ({ active }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid #eef2f7",
        background: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

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
          // ✅ ONE COLUMN ONLY: Actions (View + Edit)
          {
            key: "_actions",
            label: "Actions",
            render: (r, ctx) => (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* IMPORTANT: stopPropagation so row-click edit doesn't open when clicking View */}
                <button
                  className="dn-btn dn-btn-light"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMembers(r);
                  }}
                  title="View group members"
                >
                  View
                </button>

                {/* For Edit:
                    - if ctx has handler -> stopPropagation and call it
                    - else let it bubble so CommsCrudPage row-click opens edit (your current behavior)
                */}
                <button
                  className="dn-btn"
                  type="button"
                  onClick={(e) => {
                    const ok = tryOpenEditFromCtx(ctx, r);
                    if (ok) e.stopPropagation();
                  }}
                  title="Edit group"
                >
                  Edit
                </button>
              </div>
            ),
          },
          {
            key: "name",
            label: "Name",
            render: (r) => toTitleCase(r?.name || "-"),
            className: "dn-wrap",
          },
          { key: "visibility", label: "Visibility" },
          { key: "join_policy", label: "Join Policy" },
          {
            key: "created_at",
            label: "Created",
            render: (r) => fmtDT(r?.created_at),
          },
        ]}
        formFields={[
          { name: "name", label: "Name", span3: true },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            span3: true,
          },
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
        buildCreatePayload={({ form }) => ({
          name: form.name || "",
          description: form.description || "",
          visibility: form.visibility || "PRIVATE",
          join_policy: form.join_policy || "REQUEST",
          include_creator_as_owner: false,
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
          include_creator_as_owner: false,
          members: (Array.isArray(form.members) ? form.members : []).map(
            (m) => ({
              user: Number(m.user),
              role: m.role || "MEMBER",
            }),
          ),
        })}
      />

      {/* ✅ Members modal (clean layout, no weird grey rows, and no edit opening on View click) */}
      <DnModal
        open={membersOpen}
        title={`${membersTitle}${membersCount ? ` (${membersCount})` : ""}`}
        onClose={closeMembers}
        wide
        footer={
          <button className="dn-btn dn-btn-light" onClick={closeMembers}>
            Close
          </button>
        }
      >
        {membersLoading ? <div className="dn-loading">Loading...</div> : null}
        {membersError ? (
          <div className="dn-error dn-mb">{membersError}</div>
        ) : null}

        {!membersLoading && !membersError ? (
          <>
            {/* Group meta */}
            {membersGroup ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <Meta label="Group ID" value={membersGroup?.id} />
                <Meta label="Project ID" value={membersGroup?.project_id} />
                <Meta label="Visibility" value={membersGroup?.visibility} />
                <Meta label="Join Policy" value={membersGroup?.join_policy} />
              </div>
            ) : null}

            {/* Members table */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {membersList.length === 0 ? (
                <div style={{ padding: 12, opacity: 0.75 }}>
                  No members returned.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>USER</th>
                      <th style={thStyle}>USER ROLE</th>
                      <th style={thStyle}>MEMBER ROLE</th>
                      <th style={thStyle}>STATUS</th>
                      <th style={thStyle}>JOINED AT</th>
                    </tr>
                  </thead>

                  <tbody>
                    {membersList.map((m) => {
                      const info = memberUserInfo(m);
                      return (
                        <tr
                          key={String(
                            m?.id ?? `${info.uid}-${info.joinedAt ?? ""}`,
                          )}
                        >
                          <td style={tdStyle}>
                            <div
                              className="dn-wrap"
                              style={{ fontWeight: 900 }}
                            >
                              {info.head}
                            </div>
                            {info.sub ? (
                              <div style={{ fontSize: 12, opacity: 0.7 }}>
                                {info.sub}
                              </div>
                            ) : null}
                          </td>

                          <td style={tdStyleStrong}>{info.userRole}</td>
                          <td style={tdStyleStrong}>{info.memberRole}</td>
                          <td style={tdStyle}>
                            <StatusPill active={info.active} />
                          </td>
                          <td style={tdStyle}>{fmtDT(info.joinedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
      </DnModal>
    </>
  );
}

/* ---------------- table styles ---------------- */
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 900,
  opacity: 0.75,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  borderBottom: "1px solid #eef2f7",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};

const tdStyleStrong = {
  ...tdStyle,
  fontWeight: 900,
  whiteSpace: "nowrap",
};
