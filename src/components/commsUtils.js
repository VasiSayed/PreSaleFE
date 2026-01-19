// src/pages/PostSales/Communication/admin/components/commsUtils.js

export const DEFAULT_PAGE_SIZE = 30;

export const API_SCOPE = "/client/my-scope/";
export const SCOPE_PARAMS = { include_units: true };

export const EP = {
  groups: "/communications/groups/",
  eventTypes: "/communications/event-types/",
  events: "/communications/events/",
  notices: "/communications/notices/",
  polls: "/communications/polls/",
  surveys: "/communications/surveys/",
  forumCategories: "/communications/forum-categories/",
  forumPosts: "/communications/forum-posts/",
};

export const safeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export const normalizePaginated = (data) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  return {
    results: data?.results || [],
    count: data?.count ?? (data?.results?.length || 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
};

export const toTitleCase = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

export const fmtDT = (v) => {
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(v);
  }
};

/* ---------------- auth/role (localStorage) ---------------- */
export function getStoredUser() {
  const keys = [
    "user",
    "USER",
    "current_user",
    "CURRENT_USER",
    "user_data",
    "USER_DATA",
  ];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

export function isAdminUser(u) {
  if (!u) return false;
  if (u.role === "ADMIN") return true;
  if (u.is_superuser) return true;
  if (u.is_staff) return true;
  return false;
}

/* ---------------- scope flatteners ---------------- */
export function flattenTowers(scope, projectId) {
  const pid = Number(projectId);
  const p = (scope?.projects || []).find((x) => x.id === pid);
  return p?.towers || [];
}

export function flattenFloors(scope, projectId, towerId) {
  const towers = flattenTowers(scope, projectId);
  const tid = Number(towerId);
  const t = towers.find((x) => x.id === tid);
  return t?.floors || [];
}

export function flattenUnits(scope, projectId, towerId, floorId) {
  const floors = flattenFloors(scope, projectId, towerId);
  const fid = Number(floorId);
  const f = floors.find((x) => x.id === fid);
  return f?.units || [];
}

export function flattenAllUnitsForProject(scope, projectId) {
  const pid = Number(projectId);
  const p = (scope?.projects || []).find((x) => x.id === pid);
  const out = [];
  (p?.towers || []).forEach((t) => {
    (t?.floors || []).forEach((f) => {
      (f?.units || []).forEach((u) => {
        out.push({
          ...u,
          __label: `${t.name} • Floor ${f.number} • Unit ${u.unit_no} (${u.status || "-"})`,
        });
      });
    });
  });
  return out;
}

/* ---------------- audience builder ---------------- */
export function buildAudiencePayload(aud) {
  const parseIds = (txt) =>
    String(txt || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

  const pickNums = (arr) =>
    (arr || []).map((x) => Number(x)).filter((n) => Number.isFinite(n));

  const out = { all: !!aud?.all };

  const userIds = parseIds(aud?.user_ids_text);
  const groupIds = pickNums(aud?.group_ids);
  const towerIds = pickNums(aud?.tower_ids);
  const floorIds = pickNums(aud?.floor_ids);
  const excludeUnits = pickNums(aud?.exclude_unit_ids);

  if (userIds.length) out.user_ids = userIds;
  if (groupIds.length) out.group_ids = groupIds;
  if (towerIds.length) out.tower_ids = towerIds;
  if (floorIds.length) out.floor_ids = floorIds;
  if (excludeUnits.length) out.exclude_unit_ids = excludeUnits;

  return out;
}
