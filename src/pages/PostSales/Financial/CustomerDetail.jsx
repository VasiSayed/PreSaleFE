import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import "./v2.css";

/* =========================================================
   Demand Notes Customer Timeline (Idea 3 + Idea 2)
   - Left: DN accordions (grouped by dn_id / demand_id)
   - Right: Sticky "Current Snapshot" for selected DN
   - Click timeline card => highlights + shows Event Detail (optional) + snapshot
   - Works even if ONLY timeline API is available
========================================================= */

/* ---------------- helpers ---------------- */

function toTitleCase(text) {
  if (text === null || text === undefined) return "";
  const s = String(text).trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function inr(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numComma(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v ?? "-";
  return n.toLocaleString("en-IN");
}

function formatDDMMMYYYY(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

function formatDDMMMYYYY_HHMM(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const date = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${date} • ${time}`;
  } catch {
    return String(dateStr);
  }
}

function safeStr(v) {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

function pick(obj, keys) {
  for (const k of keys) {
    if (!obj) continue;
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function normalizeType(t) {
  return String(t || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function statusPillStyle(statusRaw) {
  const s = normalizeType(statusRaw);
  // As per spec
  if (s === "OVERDUE") {
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
    };
  }
  if (s === "PAID") {
    return {
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      color: "#065f46",
    };
  }
  if (s === "PENDING") {
    return {
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      color: "#374151",
    };
  }
  // Draft / default
  return {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  };
}

function iconForType(typeRaw) {
  const t = normalizeType(typeRaw);
  if (t.includes("CREATED")) return "🧾";
  if (t.includes("ISSUED")) return "📤";
  if (
    t.includes("INSTALLMENT") ||
    t.includes("RECEIVED") ||
    t.includes("PAYMENT")
  )
    return "💳";
  if (t.includes("INTEREST") && t.includes("WAIV")) return "🧹";
  if (t.includes("INTEREST")) return "➕";
  return "🕒";
}

/* ---------------- pagination (if you still want) ---------------- */

function Pagination({ page, pageSize, count, onPage }) {
  const total = Math.max(1, Math.ceil((count || 0) / (pageSize || 20)));
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        marginTop: 12,
        flexWrap: "wrap",
      }}
    >
      <button
        className="dn-btn dn-btn-light"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </button>

      <div style={{ fontSize: 12, color: "var(--dn-muted)" }}>
        Page <b>{page}</b> / {total} • Total <b>{count || 0}</b>
      </div>

      <button
        className="dn-btn dn-btn-light"
        disabled={page >= total}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

/* ---------------- stored scope ---------------- */

const SCOPE_KEY = "DN_SCOPE_V2";
function readStoredScope() {
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* =========================================================
   Snapshot derivation
========================================================= */

function snapshotFromDnList(dnRow) {
  if (!dnRow) return null;

  return {
    dn_id: dnRow.id ?? null,
    demand_id: dnRow.demand_id ?? dnRow.demandId ?? null,
    milestone: dnRow.milestone ?? null,
    status: dnRow.status ?? null,
    due_date: dnRow.due_date ?? null,

    principal: pick(dnRow, [
      "principal",
      "demand",
      "base_total",
      "principal_amount",
    ]),
    interest_total: pick(dnRow, ["interest_total", "interest", "interest_sum"]),
    total: pick(dnRow, ["total", "net_payable", "demand_total"]),
    paid_total: pick(dnRow, ["paid_total", "total_paid", "paid_sum"]),
    due_total: pick(dnRow, ["due_total", "total_due", "due_sum"]),
  };
}

function snapshotFromEvents(group) {
  if (!group?.events?.length) return null;

  // latest-first already
  const snap = {
    dn_id: group.dn_id ?? null,
    demand_id: group.demand_id ?? null,
    milestone: null,
    status: null,
    due_date: null,
    principal: null,
    interest_total: null,
    total: null,
    paid_total: null,
    due_total: null,
  };

  for (const ev of group.events) {
    const meta = ev?.meta || {};
    // merge only missing keys
    if (!snap.milestone)
      snap.milestone = pick(meta, ["milestone", "stage", "name", "title"]);
    if (!snap.status) snap.status = pick(meta, ["status"]);
    if (!snap.due_date) snap.due_date = pick(meta, ["due_date", "dueDate"]);

    if (!snap.principal)
      snap.principal = pick(meta, [
        "principal",
        "demand",
        "base_total",
        "principal_amount",
      ]);

    if (!snap.interest_total)
      snap.interest_total = pick(meta, [
        "interest_total",
        "interest",
        "interest_sum",
      ]);

    if (!snap.total)
      snap.total = pick(meta, ["total", "net_payable", "demand_total"]);

    if (!snap.paid_total)
      snap.paid_total = pick(meta, ["paid_total", "paid_sum", "total_paid"]);

    if (!snap.due_total)
      snap.due_total = pick(meta, ["due_total", "due_sum", "total_due"]);

    // if enough filled, break early
    const filled =
      (snap.milestone ? 1 : 0) +
      (snap.status ? 1 : 0) +
      (snap.due_date ? 1 : 0) +
      (snap.principal ? 1 : 0) +
      (snap.total ? 1 : 0) +
      (snap.due_total ? 1 : 0);
    if (filled >= 6) break;
  }

  return snap;
}

function mergeSnapshots(preferred, fallback) {
  if (!preferred && !fallback) return null;
  if (preferred && !fallback) return preferred;
  if (!preferred && fallback) return fallback;

  // preferred values win; fill missing from fallback
  const out = { ...fallback, ...preferred };
  Object.keys(out).forEach((k) => {
    if (out[k] === null || out[k] === undefined || out[k] === "") {
      out[k] = fallback?.[k] ?? preferred?.[k] ?? null;
    }
  });
  return out;
}

/* =========================================================
   UI pieces
========================================================= */

function StatusPill({ status }) {
  const label = toTitleCase(status || "-");
  const style = statusPillStyle(status);
  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label || "-"}
    </span>
  );
}

function TimelineCard({ ev, active, onClick }) {
  const meta = ev?.meta || {};
  const t = normalizeType(ev?.type);
  const title = toTitleCase(ev?.title || ev?.type || "Event");
  const when = formatDDMMMYYYY_HHMM(ev?.ts);

  // compact lines based on type
  const lines = [];
  if (t.includes("DN_CREATED") || t.includes("CREATED")) {
    lines.push(["Milestone", toTitleCase(pick(meta, ["milestone"]) || "-")]);
    const principal = pick(meta, [
      "principal",
      "demand",
      "base_total",
      "principal_amount",
    ]);
    lines.push([
      "Principal",
      principal !== undefined ? `₹ ${inr(principal)}` : "-",
    ]);
    lines.push(["Due Date", formatDDMMMYYYY(pick(meta, ["due_date"]) || "-")]);
    lines.push(["Status", toTitleCase(pick(meta, ["status"]) || "-")]);
  } else if (t.includes("DN_ISSUED") || t.includes("ISSUED")) {
    lines.push([
      "Issued By",
      safeStr(pick(meta, ["issued_by", "issued_by_name", "by", "user"])),
    ]);
    lines.push(["Status", toTitleCase(pick(meta, ["status"]) || "-")]);
    const tot = pick(meta, ["total"]);
    const due = pick(meta, ["due_total", "due_sum"]);
    if (tot !== undefined || due !== undefined) {
      lines.push([
        "Total / Due",
        `${tot !== undefined ? `₹ ${inr(tot)}` : "-"} / ${
          due !== undefined ? `₹ ${inr(due)}` : "-"
        }`,
      ]);
    }
  } else if (t.includes("INTEREST") && t.includes("WAIV")) {
    const amt = pick(meta, ["amount", "interest_amount", "delta"]);
    lines.push(["Interest Waived", amt !== undefined ? `₹ ${inr(amt)}` : "-"]);
    lines.push(["By", safeStr(pick(meta, ["by", "user", "approved_by"]))]);
    lines.push([
      "Reason",
      safeStr(pick(meta, ["reason_code", "reason", "note"])),
    ]);
    const newTot = pick(meta, ["total"]);
    const newDue = pick(meta, ["due_total"]);
    if (newTot !== undefined) lines.push(["New Total", `₹ ${inr(newTot)}`]);
    if (newDue !== undefined) lines.push(["Current Due", `₹ ${inr(newDue)}`]);
  } else if (t.includes("INTEREST")) {
    const amt = pick(meta, ["amount", "interest_amount", "delta"]);
    lines.push(["Interest Added", amt !== undefined ? `₹ ${inr(amt)}` : "-"]);
    lines.push(["By", safeStr(pick(meta, ["by", "user"]))]);
    lines.push([
      "Reason",
      safeStr(pick(meta, ["reason_code", "reason", "note"])),
    ]);
    const newTot = pick(meta, ["total"]);
    const newDue = pick(meta, ["due_total"]);
    if (newTot !== undefined) lines.push(["New Total", `₹ ${inr(newTot)}`]);
    if (newDue !== undefined) lines.push(["Current Due", `₹ ${inr(newDue)}`]);
  } else if (
    t.includes("INSTALLMENT") ||
    t.includes("RECEIVED") ||
    t.includes("PAYMENT")
  ) {
    const amt = pick(meta, ["receipt_amount", "amount", "paid_amount"]);
    lines.push(["Receipt", amt !== undefined ? `₹ ${inr(amt)}` : "-"]);
    lines.push(["Mode", safeStr(pick(meta, ["mode", "payment_mode"]))]);
    lines.push(["UTR", safeStr(pick(meta, ["utr", "reference", "txn_id"]))]);
    lines.push([
      "Receipt Date",
      formatDDMMMYYYY(pick(meta, ["receipt_date"]) || "-"),
    ]);
  } else {
    // generic: show up to 3 meta keys
    const keys = Object.keys(meta || {});
    for (const k of keys.slice(0, 3)) {
      const label = toTitleCase(k.replace(/_/g, " "));
      let v = meta[k];
      if (typeof v === "number") v = numComma(v);
      if (typeof v === "object") v = JSON.stringify(v);
      lines.push([label, safeStr(v)]);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="ct-card"
      style={{
        width: "100%",
        textAlign: "left",
        border: active
          ? "1px solid var(--dn-primary)"
          : "1px solid var(--dn-border)",
        background: "var(--dn-white)",
        borderRadius: 12,
        padding: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>
          {iconForType(ev?.type)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "baseline",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--dn-label)",
              }}
            >
              {title}
            </div>
            <div
              className="dn-mono"
              style={{ fontSize: 12, color: "var(--dn-muted)" }}
            >
              {when}
            </div>
          </div>

          {lines.length ? (
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {lines.slice(0, 5).map(([k, v], idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", gap: 8, fontSize: 12 }}
                >
                  <div
                    style={{
                      width: 110,
                      color: "var(--dn-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {toTitleCase(k)}
                  </div>
                  <div style={{ color: "var(--dn-label)" }}>{v}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function SnapshotPanel({
  snapshot,
  selectedEvent,
  onClearEvent,
  onOpenDn,
  onCopyDemandId,
}) {
  const status = snapshot?.status || "-";
  const demandId = snapshot?.demand_id || "-";

  return (
    <div className="ct-snapshot">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{ fontSize: 14, fontWeight: 900, color: "var(--dn-label)" }}
        >
          Current Snapshot
        </div>
        <StatusPill status={status} />
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "var(--dn-muted)",
          fontWeight: 700,
        }}
      >
        Demand Id:{" "}
        <span style={{ color: "var(--dn-label)" }}>{safeStr(demandId)}</span>
      </div>

      {/* Optional event detail */}
      {selectedEvent ? (
        <div
          style={{
            marginTop: 12,
            border: "1px solid var(--dn-border)",
            background: "var(--dn-bg)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: "var(--dn-label)",
              }}
            >
              Event Detail
            </div>
            <button className="dn-btn dn-btn-light" onClick={onClearEvent}>
              Clear
            </button>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 800,
              color: "var(--dn-label)",
            }}
          >
            {toTitleCase(selectedEvent.title || selectedEvent.type || "Event")}
          </div>
          <div
            className="dn-mono"
            style={{ marginTop: 4, fontSize: 12, color: "var(--dn-muted)" }}
          >
            {formatDDMMMYYYY_HHMM(selectedEvent.ts)}
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {Object.entries(selectedEvent.meta || {})
              .slice(0, 8)
              .map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, fontSize: 12 }}>
                  <div
                    style={{
                      width: 120,
                      color: "var(--dn-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {toTitleCase(k.replace(/_/g, " "))}
                  </div>
                  <div style={{ color: "var(--dn-label)" }}>
                    {typeof v === "number" ? numComma(v) : safeStr(v)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* Snapshot grid */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div className="ct-snap-item">
          <div className="ct-snap-label">Principal</div>
          <div className="ct-snap-value">
            ₹ {snapshot?.principal != null ? inr(snapshot.principal) : "-"}
          </div>
        </div>

        <div className="ct-snap-item">
          <div className="ct-snap-label">Interest</div>
          <div className="ct-snap-value">
            ₹{" "}
            {snapshot?.interest_total != null
              ? inr(snapshot.interest_total)
              : "-"}
          </div>
        </div>

        <div className="ct-snap-item">
          <div className="ct-snap-label">Total</div>
          <div className="ct-snap-value">
            ₹ {snapshot?.total != null ? inr(snapshot.total) : "-"}
          </div>
        </div>

        <div className="ct-snap-item">
          <div className="ct-snap-label">Paid</div>
          <div className="ct-snap-value">
            ₹ {snapshot?.paid_total != null ? inr(snapshot.paid_total) : "-"}
          </div>
        </div>

        <div className="ct-snap-item">
          <div className="ct-snap-label">Due</div>
          <div className="ct-snap-value">
            ₹ {snapshot?.due_total != null ? inr(snapshot.due_total) : "-"}
          </div>
        </div>

        <div className="ct-snap-item">
          <div className="ct-snap-label">Due Date</div>
          <div className="ct-snap-value">
            {snapshot?.due_date ? formatDDMMMYYYY(snapshot.due_date) : "-"}
          </div>
        </div>
      </div>

      {/* Milestone */}
      <div style={{ marginTop: 12, fontSize: 12, color: "var(--dn-muted)" }}>
        Milestone:{" "}
        <span style={{ color: "var(--dn-label)", fontWeight: 800 }}>
          {snapshot?.milestone ? toTitleCase(snapshot.milestone) : "-"}
        </span>
      </div>

      {/* Actions */}
      <div
        style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <button
          className="dn-btn dn-btn-primary"
          onClick={onOpenDn}
          disabled={!snapshot?.dn_id}
        >
          Open Dn
        </button>
        <button
          className="dn-btn dn-btn-light"
          onClick={onCopyDemandId}
          disabled={!snapshot?.demand_id}
        >
          Copy Demand Id
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */

export default function CustomerTimelinePage() {
  const { customerId } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const passedCustomer = loc.state?.customer || null;

  // scope from localStorage
  const stored = useMemo(() => readStoredScope(), []);
  const [projectId, setProjectId] = useState(stored?.projectId || "");
  const [towerId, setTowerId] = useState(stored?.towerId || "");
  const [floorId, setFloorId] = useState(stored?.floorId || "");
  const [unitId, setUnitId] = useState(stored?.unitId || "");

  // my-scope (for project dropdown)
  const [myScope, setMyScope] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(false);

  const projects = myScope?.projects || [];
  const selectedProject =
    projects.find((p) => String(p.id) === String(projectId)) || null;

  // timeline data
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [timelineResp, setTimelineResp] = useState({
    results: [],
    meta: null,
    count: 0,
  });

  // optional DN list data
  const [dnListById, setDnListById] = useState(new Map());
  const [dnListByDemandId, setDnListByDemandId] = useState(new Map());

  // selection
  const [openKeys, setOpenKeys] = useState(() => new Set()); // multi-open
  const [selectedKey, setSelectedKey] = useState(null); // group key
  const [selectedEvent, setSelectedEvent] = useState(null);

  // pagination (timeline)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const canLoad = useMemo(
    () => !!String(projectId || "").trim() && !!customerId,
    [projectId, customerId]
  );

  const loadMyScope = async () => {
    setScopeLoading(true);
    try {
      const { data } = await axiosInstance.get("client/my-scope/");
      setMyScope(data || null);
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    loadMyScope();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-select project if only 1
  useEffect(() => {
    if (projectId) return;
    if (!myScope) return;
    if (projects.length === 1) setProjectId(String(projects[0].id));
  }, [myScope, projects, projectId]);

  const loadData = async () => {
    if (!canLoad) return;

    setLoading(true);
    setErr("");

    const controller = new AbortController();
    try {
      // fetch timeline + dn list in parallel (dn list is optional)
      const timelineReq = axiosInstance.get(
        `financial/demand-notes/project-customers/${customerId}/timeline/`,
        {
          params: {
            project_id: projectId,
            page,
            page_size: pageSize,
            tower_id: towerId || undefined,
            floor_id: floorId || undefined,
            unit_id: unitId || undefined,
          },
          signal: controller.signal,
        }
      );

      const dnListReq = axiosInstance.get(
        `financial/demand-notes/project-customers/${customerId}/demand-notes/`,
        {
          params: {
            project_id: projectId,
            page: 1,
            page_size: 200, // just for header/snapshot richness
            tower_id: towerId || undefined,
            floor_id: floorId || undefined,
            unit_id: unitId || undefined,
          },
          signal: controller.signal,
        }
      );

      const [timelineRes, dnListRes] = await Promise.allSettled([
        timelineReq,
        dnListReq,
      ]);

      if (timelineRes.status === "fulfilled") {
        setTimelineResp(
          timelineRes.value.data || { results: [], meta: null, count: 0 }
        );
      } else {
        throw timelineRes.reason;
      }

      if (dnListRes.status === "fulfilled") {
        const rows = dnListRes.value.data?.results || [];
        const byId = new Map();
        const byDemand = new Map();
        rows.forEach((r) => {
          if (r?.id != null) byId.set(String(r.id), r);
          if (r?.demand_id) byDemand.set(String(r.demand_id), r);
        });
        setDnListById(byId);
        setDnListByDemandId(byDemand);
      } else {
        // optional => ignore
        setDnListById(new Map());
        setDnListByDemandId(new Map());
      }
    } catch (e) {
      if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
        setErr(e?.response?.data?.detail || e?.message || "Failed");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  // load timeline + dn list
  useEffect(() => {
    if (!canLoad) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, page, pageSize, towerId, floorId, unitId]);

  /* ---------------- group timeline events ---------------- */

  const grouped = useMemo(() => {
    const results = Array.isArray(timelineResp?.results)
      ? timelineResp.results
      : [];

    const map = new Map(); // key -> group
    results.forEach((ev, idx) => {
      const dnId = ev?.dn_id != null ? String(ev.dn_id) : "";
      const demandId = ev?.demand_id != null ? String(ev.demand_id) : "";
      const key = dnId || demandId || `unknown_${idx}`;

      const g = map.get(key) || {
        key,
        dn_id: dnId || null,
        demand_id: demandId || null,
        events: [],
      };

      g.events.push(ev);
      // keep best ids
      if (!g.dn_id && dnId) g.dn_id = dnId;
      if (!g.demand_id && demandId) g.demand_id = demandId;

      map.set(key, g);
    });

    // sort events desc by ts
    const groups = Array.from(map.values()).map((g) => {
      const sorted = [...g.events].sort((a, b) => {
        const ta = new Date(a?.ts || 0).getTime();
        const tb = new Date(b?.ts || 0).getTime();
        return tb - ta;
      });
      return { ...g, events: sorted };
    });

    // sort groups by latest event time desc
    groups.sort((a, b) => {
      const ta = new Date(a?.events?.[0]?.ts || 0).getTime();
      const tb = new Date(b?.events?.[0]?.ts || 0).getTime();
      return tb - ta;
    });

    return groups;
  }, [timelineResp]);

  /* ---------------- select default DN ---------------- */

  const didInitSelect = useRef(false);
  useEffect(() => {
    if (didInitSelect.current) return;
    if (!grouped?.length) return;

    didInitSelect.current = true;

    const first = grouped[0];
    const autoKey = first?.key || null;

    if (autoKey) {
      setSelectedKey(autoKey);

      // open: if only 1, open it. else open the most recent one.
      setOpenKeys((prev) => {
        const next = new Set(prev);
        next.add(autoKey);
        return next;
      });
    }
  }, [grouped]);

  const selectedGroup = useMemo(() => {
    return grouped.find((g) => g.key === selectedKey) || grouped[0] || null;
  }, [grouped, selectedKey]);

  /* ---------------- snapshot per DN (preferred DN list, else events) ---------------- */

  const getGroupSnapshot = (g) => {
    if (!g) return null;

    let preferred = null;
    if (g.dn_id && dnListById.has(String(g.dn_id))) {
      preferred = snapshotFromDnList(dnListById.get(String(g.dn_id)));
    } else if (g.demand_id && dnListByDemandId.has(String(g.demand_id))) {
      preferred = snapshotFromDnList(dnListByDemandId.get(String(g.demand_id)));
    }

    const fallback = snapshotFromEvents(g);

    const merged = mergeSnapshots(preferred, fallback);
    if (merged) {
      // ensure demand id / dn id exist
      if (!merged.dn_id && g.dn_id) merged.dn_id = g.dn_id;
      if (!merged.demand_id && g.demand_id) merged.demand_id = g.demand_id;
    }
    return merged;
  };

  const selectedSnapshot = useMemo(
    () => getGroupSnapshot(selectedGroup),
    [selectedGroup, dnListById, dnListByDemandId]
  );

  /* ---------------- actions ---------------- */

  const onSelectGroup = (key) => {
    setSelectedKey(key);
    setSelectedEvent(null);
  };

  const toggleOpen = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openDnDetail = () => {
    const dnId = selectedSnapshot?.dn_id || selectedGroup?.dn_id;
    if (!dnId) return;
    nav(`/post-sales/financial/customer-demand-notes/dn/${dnId}`, {
      state: { customer: passedCustomer, dnSummary: selectedSnapshot },
    });
  };

  const copyDemandId = async () => {
    const id = selectedSnapshot?.demand_id || selectedGroup?.demand_id;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(String(id));
    } catch {
      // ignore
    }
  };

  /* ---------------- UI text ---------------- */

  const customerName = toTitleCase(passedCustomer?.customer_name || "Customer");
  const projectName = toTitleCase(selectedProject?.name || "");

  /* ---------------- render ---------------- */

  return (
    <div className="demand-notes-page">
      {/* self-contained styles for accordion + sticky panel + neutral widgets */}
      <style>{`
        .ct-topbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          padding:12px;
          background:var(--dn-bg);
          border:1px solid var(--dn-border);
          border-radius:12px;
        }
        .ct-topbar-left{
          display:flex; align-items:center; gap:10px; flex:1; min-width:280px;
        }
        .ct-topbar-right{
          display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end;
        }
        .ct-title{
          display:flex; flex-direction:column; line-height:1.1;
          padding: 0 6px;
        }
        .ct-title-main{
          font-size:14px; font-weight:900; color:var(--dn-label);
          white-space:nowrap;
        }
        .ct-title-sub{
          font-size:12px; color:var(--dn-muted);
          white-space:nowrap;
        }

        .ct-layout{
          margin-top:12px;
          display:grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap:16px;
          align-items:start;
        }
        .ct-left{ min-width:0; }
        .ct-right{ min-width:0; position: sticky; top: 16px; align-self: start; }

        @media (max-width: 980px){
          .ct-layout{ grid-template-columns: 1fr; }
          .ct-right{ position: static; top: auto; }
        }

        .ct-accordion{
          background: var(--dn-white);
          border: 1px solid var(--dn-border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .ct-acc-header{
          width: 100%;
          border: none;
          background: var(--dn-white);
          padding: 12px 14px;
          cursor: pointer;
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 12px;
          text-align:left;
        }
        .ct-acc-header:hover{
          background: var(--dn-bg);
        }

        .ct-acc-header-left{
          display:flex;
          flex-direction:column;
          gap:6px;
          min-width:0;
          flex:1;
        }
        .ct-acc-row1{
          display:flex;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        }
        .ct-demand-id{
          font-size:14px;
          font-weight:900;
          color: var(--dn-label);
        }
        .ct-acc-row2{
          display:flex;
          gap: 12px;
          flex-wrap:wrap;
          font-size:12px;
          color: var(--dn-muted);
          font-weight:700;
        }
        .ct-acc-row3{
          font-size:12px;
          color: var(--dn-muted);
        }

        .ct-caret{
          color: var(--dn-muted);
          font-size: 18px;
          line-height: 1;
          padding-top: 2px;
        }

        .ct-acc-body{
          padding: 12px 14px 14px;
          border-top: 1px solid var(--dn-border);
          background: var(--dn-white);
          display:grid;
          gap:10px;
        }

        .ct-snapshot{
          background: var(--dn-white);
          border: 1px solid var(--dn-border);
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 10px 22px rgba(0,0,0,0.06);
        }

        .ct-snap-item{
          border: 1px solid var(--dn-border);
          background: var(--dn-bg);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .ct-snap-label{
          font-size: 12px;
          font-weight: 800;
          color: var(--dn-muted);
        }
        .ct-snap-value{
          margin-top: 6px;
          font-size: 14px;
          font-weight: 900;
          color: var(--dn-label); /* keep same as timeline, not dark */
          white-space: nowrap;
        }
      `}</style>

      {/* Top bar */}
      <div className="ct-topbar">
        <div className="ct-topbar-left">
          <button className="dn-btn dn-btn-light" onClick={() => nav(-1)}>
            Back
          </button>

          {/* Project picker if multiple */}
          {projects.length > 1 ? (
            <select
              className="dn-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ width: 260 }}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {toTitleCase(p.name)}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="ct-topbar-right">
          <div className="ct-title">
            <div className="ct-title-main">
              {customerName}
              {projectName ? (
                <span style={{ color: "var(--dn-muted)", fontWeight: 800 }}>
                  {" "}
                  • {projectName}
                </span>
              ) : null}
            </div>
            <div className="ct-title-sub">
              Total Dn: {numComma(grouped.length)} • Timeline:{" "}
              {numComma(timelineResp?.results?.length || 0)}
            </div>
          </div>

          <button
            className="dn-btn dn-btn-light demand-filter-btn"
            onClick={() => {
              // quick scope reset helper (optional)
              setTowerId("");
              setFloorId("");
              setUnitId("");
            }}
            disabled={scopeLoading}
            title="Reset tower/floor/unit filters (optional)"
          >
            Reset Scope
          </button>

          <button
            className="dn-btn dn-btn-primary"
            onClick={() => loadData()}
            disabled={!canLoad || loading || scopeLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? <div className="dn-error">{err}</div> : null}
      {loading ? <div className="dn-loading">Loading...</div> : null}

      {/* Main layout */}
      <div className="ct-layout">
        {/* LEFT: accordions */}
        <div className="ct-left">
          {!canLoad && !scopeLoading ? (
            <div className="dn-hint">Select Project to Load Timeline.</div>
          ) : null}

          {canLoad && grouped.length === 0 && !loading ? (
            <div className="dn-hint">No Demand Notes Timeline Found.</div>
          ) : null}

          {grouped.map((g) => {
            const isOpen = openKeys.has(g.key);
            const isSelected = selectedKey === g.key;
            const snap = getGroupSnapshot(g);

            const demandId = snap?.demand_id || g.demand_id || "-";
            const status = snap?.status || "-";
            const due =
              snap?.due_total != null ? `₹ ${inr(snap.due_total)}` : "-";
            const dueDate = snap?.due_date
              ? formatDDMMMYYYY(snap.due_date)
              : "-";
            const milestone = snap?.milestone
              ? toTitleCase(snap.milestone)
              : "-";

            return (
              <div key={g.key} className="ct-accordion">
                <button
                  type="button"
                  className="ct-acc-header"
                  onClick={() => {
                    toggleOpen(g.key);
                    onSelectGroup(g.key);
                  }}
                  style={{
                    outline: "none",
                    boxShadow: isSelected
                      ? "inset 0 0 0 1px var(--dn-primary)"
                      : "none",
                  }}
                >
                  <div className="ct-acc-header-left">
                    <div className="ct-acc-row1">
                      <div className="ct-demand-id">{safeStr(demandId)}</div>
                      <StatusPill status={status} />
                    </div>

                    <div className="ct-acc-row2">
                      <div>
                        Due:{" "}
                        <span style={{ color: "var(--dn-label)" }}>{due}</span>
                      </div>
                      <div>
                        Due Date:{" "}
                        <span style={{ color: "var(--dn-label)" }}>
                          {dueDate}
                        </span>
                      </div>
                      <div>
                        Events:{" "}
                        <span style={{ color: "var(--dn-label)" }}>
                          {numComma(g.events.length)}
                        </span>
                      </div>
                    </div>

                    <div className="ct-acc-row3">
                      {milestone !== "-"
                        ? `Milestone: ${milestone}`
                        : "Milestone: -"}
                    </div>
                  </div>

                  <div className="ct-caret">{isOpen ? "▾" : "▸"}</div>
                </button>

                {isOpen ? (
                  <div className="ct-acc-body">
                    {g.events.map((ev, idx) => {
                      const active =
                        selectedEvent?.ts === ev?.ts &&
                        selectedEvent?.type === ev?.type &&
                        String(selectedEvent?.dn_id || "") ===
                          String(ev?.dn_id || "");

                      return (
                        <TimelineCard
                          key={`${g.key}_${idx}_${ev?.ts || ""}`}
                          ev={ev}
                          active={active}
                          onClick={() => {
                            onSelectGroup(g.key);
                            setSelectedEvent(ev);
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* If you want pagination for timeline api */}
          {canLoad &&
          (timelineResp?.count != null || timelineResp?.meta?.count != null) ? (
            <Pagination
              page={page}
              pageSize={pageSize}
              count={timelineResp?.count || timelineResp?.meta?.count || 0}
              onPage={(p) => setPage(p)}
            />
          ) : null}
        </div>

        {/* RIGHT: sticky snapshot */}
        <div className="ct-right">
          <SnapshotPanel
            snapshot={selectedSnapshot}
            selectedEvent={selectedEvent}
            onClearEvent={() => setSelectedEvent(null)}
            onOpenDn={openDnDetail}
            onCopyDemandId={copyDemandId}
          />
        </div>
      </div>
    </div>
  );
}
