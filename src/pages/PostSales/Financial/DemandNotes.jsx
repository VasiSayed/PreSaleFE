import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import SearchBar from "../../../common/SearchBar";

import "./DemandNotes.css";
import "../../Booking/MyBookings.css";
import "../../PreSalesCRM/Leads/LeadsList.css";

/* ---------------- helpers ---------------- */
function toTitleCase(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function nicePayLabel(v) {
  if (!v) return "-";
  const s = String(v);
  if (s === s.toUpperCase() && s.length <= 10) return s;
  return toTitleCase(s);
}

function safeNumber(n, fallback = 0) {
  if (typeof n === "number" && !Number.isNaN(n)) return n;
  const parsed = Number(n);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function fmtINR(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = safeNumber(value, null);
  if (num === null) return value;
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleDateString("en-IN");
  } catch {
    return dt;
  }
}

function fmtDateTime(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString("en-IN");
  } catch {
    return dt;
  }
}

function fileNameFromPath(p) {
  if (!p) return "file";
  try {
    const clean = String(p).split("?")[0];
    return clean.split("/").filter(Boolean).pop() || "file";
  } catch {
    return "file";
  }
}

function absApiUrl(path, axiosInstance) {
  if (!path) return "";
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;

  const base = axiosInstance?.defaults?.baseURL || "";
  try {
    const u = new URL(base);
    return `${u.origin}${s}`;
  } catch {
    return s;
  }
}

function normalizeStatus(s) {
  if (!s) return "-";
  return String(s)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeMoneyInput(v) {
  let s = String(v ?? "");
  s = s.replace(/[₹,\s]/g, "");
  s = s.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  return s;
}

function formatMoneyINR(v) {
  const s = sanitizeMoneyInput(v);
  if (!s) return "";
  const parts = s.split(".");
  const intPart = parts[0] || "0";
  const decPart = parts[1];

  const intNum = Number(intPart);
  const formattedInt = Number.isNaN(intNum)
    ? intPart
    : intNum.toLocaleString("en-IN");

  if (decPart === undefined) return formattedInt;
  return `${formattedInt}.${decPart}`;
}

function statusPillStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return { backgroundColor: "#dcfce7", color: "#166534" };
  if (s === "overdue") return { backgroundColor: "#fee2e2", color: "#991b1b" };
  if (s === "draft") return { backgroundColor: "#fef3c7", color: "#92400e" };
  if (s.includes("partial"))
    return { backgroundColor: "#e0f2fe", color: "#075985" };
  return { backgroundColor: "#f3f4f6", color: "#374151" };
}

/* ---------- field helpers (naming convention) ---------- */
// ✅ Total Payable -> prefer net_payable, fallback total
function getTotalPayable(n) {
  return n?.net_payable ?? n?.total ?? "0";
}

// ✅ Total Paid -> prefer total_paid, fallback paid_total
function getTotalPaid(n) {
  return n?.total_paid ?? n?.paid_total ?? "0";
}

// ✅ Total Due -> prefer total_due, fallback due_total
function getTotalDue(n) {
  return n?.total_due ?? n?.due_total ?? "0";
}

// ✅ "Advance Paid" -> show credit_generated (as you asked)
function getAdvancePaid(n) {
  // credit_generated sometimes string -> fmtINR handles
  return n?.credit_generated ?? "0";
}

const BASE_FIN = "/financial";

export default function DemandNotes() {
  /* ---------------- list state ---------------- */
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* ---------------- my-scope state (Project/Tower/Floor/Unit) ---------------- */
  const [scopeLoading, setScopeLoading] = useState(true);
  const [scopeErr, setScopeErr] = useState("");
  const [scope, setScope] = useState(null);

  const [projectId, setProjectId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [unitId, setUnitId] = useState("");

  /* ---------------- extra filters ---------------- */
  const [status, setStatus] = useState("");
  const [important, setImportant] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  /* ---------------- create modal ---------------- */
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [treeLoading, setTreeLoading] = useState(false);
  const [treeErr, setTreeErr] = useState("");
  const [tree, setTree] = useState(null);

  const [totalTouched, setTotalTouched] = useState(false);

  const [milestone, setMilestone] = useState("");
  const [createTowerId, setCreateTowerId] = useState("");
  const [createFloorId, setCreateFloorId] = useState("");
  const [createUnitId, setCreateUnitId] = useState("");

  const [createBookingId, setCreateBookingId] = useState(null);
  const [principal, setPrincipal] = useState("");
  const [gst, setGst] = useState("0");
  const [tax, setTax] = useState("0");
  const [demand, setDemand] = useState("");
  const [total, setTotal] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [createStatus, setCreateStatus] = useState("Pending");
  const [createImportant, setCreateImportant] = useState(false);

  /* ---------------- installments modal ---------------- */
  const [instOpen, setInstOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [instLoading, setInstLoading] = useState(false);
  const [installments, setInstallments] = useState([]);

  const [instSearch, setInstSearch] = useState("");

  const [addInstOpen, setAddInstOpen] = useState(false);
  const [instAmount, setInstAmount] = useState("");
  const [instPaymentType, setInstPaymentType] = useState("UPI");
  const [instPaymentRef, setInstPaymentRef] = useState("");
  const [instNote, setInstNote] = useState("");
  const [instReceiptDate, setInstReceiptDate] = useState("");
  const [instFiles, setInstFiles] = useState([]);
  const [instCreating, setInstCreating] = useState(false);

  // ✅ issue button loading by note id
  const [issuingId, setIssuingId] = useState(null);

  const onPickInstFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setInstFiles((prev) => {
      const map = new Map();
      [...prev, ...files].forEach((f) => {
        const key = `${f.name}_${f.size}_${f.lastModified}`;
        if (!map.has(key)) map.set(key, f);
      });
      return Array.from(map.values());
    });

    e.target.value = "";
  };

  const removeInstFile = (idx) =>
    setInstFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearInstFiles = () => setInstFiles([]);

  /* ---------------- load my-scope ---------------- */
  useEffect(() => {
    let mounted = true;

    async function loadScope() {
      setScopeLoading(true);
      setScopeErr("");
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        if (!mounted) return;
        setScope(res?.data || null);

        const projects = res?.data?.projects || [];
        if (projects.length === 1) setProjectId(String(projects[0].id));
      } catch (e) {
        console.error("my-scope failed", e);
        if (!mounted) return;
        setScopeErr("Failed to load scope (projects).");
      } finally {
        if (mounted) setScopeLoading(false);
      }
    }

    loadScope();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- derived: selected project/tower/floor from scope ---------------- */
  const scopeProjects = useMemo(() => scope?.projects || [], [scope]);

  const selectedProject = useMemo(() => {
    return (
      scopeProjects.find((p) => String(p.id) === String(projectId)) || null
    );
  }, [scopeProjects, projectId]);

  const scopeTowers = useMemo(
    () => selectedProject?.towers || [],
    [selectedProject]
  );

  const selectedTower = useMemo(() => {
    return scopeTowers.find((t) => String(t.id) === String(towerId)) || null;
  }, [scopeTowers, towerId]);

  const scopeFloors = useMemo(
    () => selectedTower?.floors || [],
    [selectedTower]
  );

  /* reset dependent dropdowns when parent changes */
  useEffect(() => {
    setTowerId("");
    setFloorId("");
    setUnitId("");
  }, [projectId]);

  useEffect(() => {
    setFloorId("");
    setUnitId("");
  }, [towerId]);

  useEffect(() => {
    setUnitId("");
  }, [floorId]);

  /* ---------------- load demand notes list ---------------- */
  const buildListParams = () => {
    const params = {};
    if (projectId) params.project_id = projectId;
    if (towerId) params.tower_id = towerId;
    if (unitId) params.unit_id = unitId;
    if (status) params.status = status;
    if (important !== "") params.important = important;
    if (dueFrom) params.due_date_from = dueFrom;
    if (dueTo) params.due_date_to = dueTo;
    if (createdFrom) params.created_from = createdFrom;
    if (createdTo) params.created_to = createdTo;
    if (search.trim()) params.search = search.trim();
    if (ordering) params.ordering = ordering;
    return params;
  };

  const fetchNotes = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axiosInstance.get(`${BASE_FIN}/demand-notes/`, {
        params: buildListParams(),
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setNotes(data || []);
    } catch (e) {
      console.error("demand notes list failed", e);
      setErr("Failed to load demand notes.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    towerId,
    unitId,
    status,
    important,
    dueFrom,
    dueTo,
    createdFrom,
    createdTo,
    ordering,
  ]);

  // client-side filter
  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notes;

    return notes.filter((n) => {
      const blob = [
        n.demand_id,
        n.milestone,
        n.booking_label,
        n.customer_name,
        n.project_name,
        n.tower_name,
        n.unit_no,
        n.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(term);
    });
  }, [notes, search]);

  const rangeLabel =
    notes.length === 0
      ? "0 of 0"
      : `1-${filteredNotes.length} of ${notes.length}`;

  /* ---------------- bulk mark overdue ---------------- */
  const markOverdue = async () => {
    try {
      const res = await axiosInstance.post(
        `${BASE_FIN}/demand-notes/mark-overdue/`,
        null,
        { params: projectId ? { project_id: projectId } : {} }
      );
      toast.success(`Updated: ${res?.data?.updated ?? 0}`);
      fetchNotes();
    } catch (e) {
      console.error("mark overdue failed", e);
      toast.error("Failed to mark overdue");
    }
  };

  /* ---------------- ✅ ISSUE DEMAND NOTE (Draft -> Pending) ---------------- */
  const issueDemandNote = async (note) => {
    if (!note?.id) return;

    setIssuingId(note.id);
    try {
      const res = await axiosInstance.post(
        `${BASE_FIN}/demand-notes/${note.id}/issue/`
      );
      const updated = res?.data;

      setNotes((prev) =>
        prev.map((x) => (x.id === note.id ? { ...x, ...updated } : x))
      );

      if (activeNote?.id === note.id) {
        setActiveNote((p) => ({ ...(p || {}), ...(updated || {}) }));
      }

      toast.success("Demand Note issued (Draft → Pending)");
    } catch (e) {
      console.error("issue demand note failed", e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Failed to issue demand note";
      toast.error(msg);
    } finally {
      setIssuingId(null);
    }
  };

  /* ---------------- create modal: load shifted+booked tree ---------------- */
  const loadShiftedBookedTree = async (pid) => {
    if (!pid) return;
    setTreeLoading(true);
    setTreeErr("");
    try {
      const res = await axiosInstance.get(
        "/client/inventory/shifted-booked-tree/",
        {
          params: { project_id: pid },
        }
      );
      setTree(res?.data || null);
    } catch (e) {
      console.error("shifted booked tree failed", e);
      setTreeErr("Failed to load shifted+booked inventory tree.");
      setTree(null);
    } finally {
      setTreeLoading(false);
    }
  };

  const openCreate = async () => {
    if (!projectId) {
      toast.error("Please select Project first");
      return;
    }
    setCreateOpen(true);

    setMilestone("");
    setCreateTowerId("");
    setCreateFloorId("");
    setCreateUnitId("");
    setCreateBookingId(null);

    setPrincipal("");
    setGst("0");
    setTax("0");
    setDemand("");
    setTotal("");
    setTotalTouched(false);

    setDueDate("");

    setCreateStatus("Pending");
    setCreateImportant(false);

    await loadShiftedBookedTree(projectId);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setTree(null);
    setTreeErr("");
  };

  const treeTowers = useMemo(() => tree?.towers || [], [tree]);

  const createTowerObj = useMemo(() => {
    return (
      treeTowers.find((t) => String(t.id) === String(createTowerId)) || null
    );
  }, [treeTowers, createTowerId]);

  const treeFloors = useMemo(
    () => createTowerObj?.floors || [],
    [createTowerObj]
  );

  const createFloorObj = useMemo(() => {
    return (
      treeFloors.find((f) => String(f.id) === String(createFloorId)) || null
    );
  }, [treeFloors, createFloorId]);

  const treeUnits = useMemo(
    () => createFloorObj?.units || [],
    [createFloorObj]
  );

  useEffect(() => {
    if (!createOpen) return;
    if (treeTowers.length === 1) setCreateTowerId(String(treeTowers[0].id));
  }, [createOpen, treeTowers]);

  useEffect(() => {
    if (!createOpen) return;
    if (createTowerObj && treeFloors.length === 1)
      setCreateFloorId(String(treeFloors[0].id));
  }, [createOpen, createTowerObj, treeFloors]);

  useEffect(() => {
    if (!createOpen) return;
    if (createFloorObj && treeUnits.length === 1)
      setCreateUnitId(String(treeUnits[0].id));
  }, [createOpen, createFloorObj, treeUnits]);

  useEffect(() => {
    if (!createOpen) return;

    const unitObj = treeUnits.find(
      (u) => String(u.id) === String(createUnitId)
    );
    if (!unitObj) {
      setCreateBookingId(null);
      setPrincipal("");
      setDemand("");
      setTotal("");
      setTotalTouched(false);
      return;
    }

    const bookingIdAuto =
      unitObj?.booking?.id || unitObj?.booking_id || unitObj?.booking || null;
    setCreateBookingId(bookingIdAuto);

    const finalAmount =
      unitObj?.inventory?.final_amount ??
      unitObj?.inventory?.total_cost ??
      unitObj?.inventory?.agreement_value ??
      "";

    const p = finalAmount !== "" ? String(finalAmount) : "";
    setPrincipal(p);

    setDemand((prev) => (prev === "" ? p : prev));
    setTotalTouched(false);
  }, [createOpen, createUnitId, treeUnits]);

  const computeTotal = (demandVal, gstVal, taxVal) => {
    const d = safeNumber(demandVal, 0);
    const g = safeNumber(gstVal, 0);
    const t = safeNumber(taxVal, 0);
    return (d + g + t).toFixed(2);
  };

  useEffect(() => {
    if (!createOpen) return;
    if (totalTouched) return;
    const newTotal = computeTotal(demand || 0, gst || 0, tax || 0);
    setTotal(newTotal);
  }, [createOpen, demand, gst, tax, totalTouched]);

  useEffect(() => {
    if (!createOpen) return;
    if (principal !== "" && (demand === "" || demand === null))
      setDemand(String(principal));
  }, [createOpen, principal]); // eslint-disable-line

  const handleCreateSubmit = async () => {
    if (!projectId) return toast.error("Project is required");
    if (!milestone.trim()) return toast.error("Milestone is required");
    if (!createUnitId) return toast.error("Unit is required");
    if (!createBookingId)
      return toast.error("Booking not found for selected unit");
    if (!demand || Number(demand) <= 0)
      return toast.error("Demand must be > 0");
    if (!dueDate) return toast.error("Due date is required");

    try {
      setCreating(true);

      const payload = {
        milestone: milestone.trim(),
        booking: createBookingId,
        principal: String(principal || demand || 0),
        gst: String(gst || 0),
        tax: String(tax || 0),
        demand: String(demand || 0),
        total: String(total || computeTotal(demand, gst, tax)),
        due_date: dueDate,
        status: createStatus,
        important: !!createImportant,
      };

      await axiosInstance.post(`${BASE_FIN}/demand-notes/`, payload);
      toast.success("Demand note created");
      closeCreate();
      fetchNotes();
    } catch (e) {
      console.error("create demand note failed", e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        "Failed to create demand note";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  /* ---------------- installments modal ---------------- */
  const fetchInstallments = async (noteId) => {
    if (!noteId) return;
    setInstLoading(true);
    try {
      const res = await axiosInstance.get(
        `${BASE_FIN}/demand-notes/${noteId}/installments/`
      );
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setInstallments(data || []);
    } catch (e) {
      console.error("installments load failed", e);
      toast.error("Failed to load installments");
      setInstallments([]);
    } finally {
      setInstLoading(false);
    }
  };

  const openInstallments = async (note) => {
    setActiveNote(note);
    setInstOpen(true);
    setInstSearch("");
    setInstallments([]);
    await fetchInstallments(note?.id);
  };

  const closeInstallments = () => {
    setInstOpen(false);
    setActiveNote(null);
    setInstallments([]);
    setInstSearch("");
    setAddInstOpen(false);
  };

  const filteredInstallments = useMemo(() => {
    const term = instSearch.trim().toLowerCase();
    if (!term) return installments;

    return installments.filter((x) => {
      const blob = [
        x.id,
        x.receipt_no,
        x.receipt_date,
        x.receipt_amount,
        x.payment_type,
        x.payment_mode,
        x.utr,
        x.cheque_no,
        x.bank_name,
        x.ifsc_code,
        x.notes,
        x.created_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(term);
    });
  }, [installments, instSearch]);

  const openAddInstallment = () => {
    if (!activeNote?.id) return;

    // ✅ if Due is 0, don't allow add installment
    const dueNum = safeNumber(getTotalDue(activeNote), 0);
    if (dueNum <= 0) {
      toast.error("No due remaining for this Demand Note.");
      return;
    }

    // ✅ default amount = remaining due
    setInstAmount(String(dueNum));
    setInstPaymentType("UPI");
    setInstPaymentRef("");
    setInstNote("");
    setInstReceiptDate("");
    clearInstFiles();
    setAddInstOpen(true);
  };

  const closeAddInstallment = () => setAddInstOpen(false);

  const createInstallment = async () => {
    if (!activeNote?.id) return;

    const dueNum = safeNumber(getTotalDue(activeNote), 0);
    if (dueNum <= 0)
      return toast.error("No due remaining for this Demand Note.");

    if (!instAmount || Number(instAmount) <= 0)
      return toast.error("Amount must be > 0");

    // ✅ optional: prevent overpay
    if (Number(instAmount) > dueNum) {
      return toast.error(
        `Amount cannot exceed remaining due (${fmtINR(dueNum)})`
      );
    }

    try {
      setInstCreating(true);

      const url = `${BASE_FIN}/demand-notes/${activeNote.id}/installments/`;

      if (instFiles && instFiles.length > 0) {
        const fd = new FormData();
        fd.append("amount", String(instAmount));
        if (instPaymentType) fd.append("payment_type", instPaymentType);
        if (instPaymentRef) fd.append("payment_ref", instPaymentRef);
        if (instNote) fd.append("note", instNote);
        if (instReceiptDate) fd.append("receipt_date", instReceiptDate);

        instFiles.forEach((f) => fd.append("attachments", f));

        const res = await axiosInstance.post(url, fd);

        toast.success("Installment added");
        await fetchInstallments(activeNote.id);
        await fetchNotes();

        if (res?.data?.demand_note) {
          setActiveNote((prev) => ({
            ...(prev || {}),
            ...res.data.demand_note,
          }));
        }

        closeAddInstallment();
        return;
      }

      const payload = {
        amount: String(instAmount),
        payment_type: instPaymentType || null,
        payment_ref: instPaymentRef || null,
        note: instNote || null,
        receipt_date: instReceiptDate || null,
      };

      const res = await axiosInstance.post(url, payload);

      toast.success("Installment added");
      await fetchInstallments(activeNote.id);
      await fetchNotes();

      if (res?.data?.demand_note) {
        setActiveNote((prev) => ({ ...(prev || {}), ...res.data.demand_note }));
      }

      closeAddInstallment();
    } catch (e) {
      console.error("installment create failed", e);
      const data = e?.response?.data || {};
      const msg =
        data?.detail ||
        (Array.isArray(data?.amount) ? data.amount[0] : data?.amount) ||
        "Failed to create installment";
      toast.error(msg);
    } finally {
      setInstCreating(false);
    }
  };

  const setStatusManual = async (noteId, newStatus) => {
    try {
      await axiosInstance.patch(
        `${BASE_FIN}/demand-notes/${noteId}/set-status/`,
        {
          status: newStatus,
        }
      );
      toast.success("Status updated");
      fetchNotes();
      if (activeNote?.id === noteId)
        setActiveNote((p) => ({ ...(p || {}), status: newStatus }));
    } catch (e) {
      console.error("set status failed", e);
      toast.error("Failed to update status");
    }
  };

  /* ---------------- render ---------------- */
  const projectOptions = scopeProjects || [];

  return (
    <div className="demand-notes-page">
      <div className="my-bookings-container">
        <div className="list-header">
          <div className="list-header-left">
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search by Demand ID, milestone, booking, customer..."
              wrapperClassName="search-box"
            />
          </div>

          <div className="list-header-right dn-header-actions">
            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={() => setShowFilters((s) => !s)}
              title="Filters"
            >
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              Filters
            </button>

            <button type="button" className="filter-btn" onClick={openCreate}>
              <i className="fa fa-plus" style={{ marginRight: 6 }} />
              Add Demand Note
            </button>

            <button
              type="button"
              className="filter-btn demand-filter-btn"
              onClick={markOverdue}
              title="Mark eligible notes as overdue"
            >
              Mark Overdue
            </button>
          </div>
        </div>

        {/* -------- scope row -------- */}
        <div className="dn-scope-row">
          <div className="dn-field">
            <label>Project</label>
            <select
              className="dn-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={scopeLoading || projectOptions.length === 1}
            >
              <option value="">
                {scopeLoading ? "Loading..." : "Select Project"}
              </option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {toTitleCase(p.name)}
                </option>
              ))}
            </select>
            {scopeErr && <div className="dn-error">{scopeErr}</div>}
          </div>

          <div className="dn-field">
            <label>Tower</label>
            <select
              className="dn-select"
              value={towerId}
              onChange={(e) => setTowerId(e.target.value)}
              disabled={!projectId}
            >
              <option value="">All Towers</option>
              {scopeTowers.map((t) => (
                <option key={t.id} value={t.id}>
                  {toTitleCase(t.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="dn-field">
            <label>Floor</label>
            <select
              className="dn-select"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              disabled={!towerId}
            >
              <option value="">All Floors</option>
              {scopeFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {toTitleCase(String(f.number))}
                </option>
              ))}
            </select>
          </div>

          <div className="dn-field">
            <label>Unit</label>
            <input
              className="dn-input"
              placeholder="Unit ID (optional)"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              disabled={!projectId}
            />
          </div>
        </div>

        {/* -------- filter panel -------- */}
        {showFilters && (
          <div className="dn-filters">
            <div className="dn-filters-grid">
              <div className="dn-field">
                <label>Status</label>
                <select
                  className="dn-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Draft">Draft</option>
                  <option value="Partial Paid">Partial Paid</option>
                </select>
              </div>

              <div className="dn-field">
                <label>Important</label>
                <select
                  className="dn-select"
                  value={important}
                  onChange={(e) => setImportant(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="1">Important</option>
                  <option value="0">Not Important</option>
                </select>
              </div>

              <div className="dn-field">
                <label>Due Date From</label>
                <input
                  className="dn-input"
                  type="date"
                  value={dueFrom}
                  onChange={(e) => setDueFrom(e.target.value)}
                />
              </div>

              <div className="dn-field">
                <label>Due Date To</label>
                <input
                  className="dn-input"
                  type="date"
                  value={dueTo}
                  onChange={(e) => setDueTo(e.target.value)}
                />
              </div>

              <div className="dn-field">
                <label>Created From</label>
                <input
                  className="dn-input"
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                />
              </div>

              <div className="dn-field">
                <label>Created To</label>
                <input
                  className="dn-input"
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                />
              </div>

              <div className="dn-field dn-span-2">
                <label>Ordering</label>
                <select
                  className="dn-select"
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                >
                  <option value="-created_at">Newest</option>
                  <option value="created_at">Oldest</option>
                  <option value="due_date">Due Date (Asc)</option>
                  <option value="-due_date">Due Date (Desc)</option>
                  <option value="total">Total (Asc)</option>
                  <option value="-total">Total (Desc)</option>
                  <option value="status">Status (Asc)</option>
                  <option value="-status">Status (Desc)</option>
                </select>
              </div>
            </div>

            <div className="dn-filters-actions">
              <button
                type="button"
                className="dn-btn dn-btn-light"
                onClick={() => {
                  setStatus("");
                  setImportant("");
                  setDueFrom("");
                  setDueTo("");
                  setCreatedFrom("");
                  setCreatedTo("");
                  setOrdering("-created_at");
                }}
              >
                Clear
              </button>

              <button type="button" className="dn-btn" onClick={fetchNotes}>
                Apply
              </button>
            </div>
          </div>
        )}

        {/* -------- table -------- */}
        {loading ? (
          <div className="booking-list-body">
            <div className="booking-list-message">Loading demand notes...</div>
          </div>
        ) : err ? (
          <div className="booking-list-body">
            <div className="booking-list-message booking-error">{err}</div>
          </div>
        ) : (
          <div className="booking-list-body">
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Action</th>
                    <th>Demand ID</th>
                    <th>Milestone</th>
                    <th>Booking</th>
                    <th>Customer</th>

                    {/* ✅ Naming convention changes */}
                    <th>Total Payable</th>
                    <th>Total Paid</th>
                    <th>Advance Paid</th>
                    <th>Total Due</th>

                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ width: 90 }}>Important</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredNotes.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="booking-empty-row">
                        No demand notes found.
                      </td>
                    </tr>
                  ) : (
                    filteredNotes.map((n) => {
                      const isDraft =
                        String(n.status || "").toLowerCase() === "draft";
                      const isIssuing = issuingId === n.id;

                      return (
                        <tr key={n.id} className="dn-row">
                          <td className="booking-actions-cell">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="View installments"
                              onClick={() => openInstallments(n)}
                            >
                              📑
                            </button>

                            {isDraft && (
                              <button
                                type="button"
                                className="booking-icon-btn"
                                title="Issue (Draft → Pending)"
                                onClick={() => issueDemandNote(n)}
                                disabled={isIssuing}
                                style={
                                  isIssuing
                                    ? { opacity: 0.6, cursor: "not-allowed" }
                                    : undefined
                                }
                              >
                                {isIssuing ? "⏳" : "📤"}
                              </button>
                            )}

                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Mark Paid"
                              onClick={() => setStatusManual(n.id, "Paid")}
                            >
                              ✅
                            </button>
                          </td>

                          <td>{n.demand_id || `DN-${n.id}`}</td>
                          <td>{toTitleCase(n.milestone || "-")}</td>
                          <td>{n.booking_label || n.booking || "-"}</td>
                          <td>{toTitleCase(n.customer_name || "-")}</td>

                          {/* ✅ Naming convention changes */}
                          <td className="dn-money">
                            {fmtINR(getTotalPayable(n))}
                          </td>
                          <td className="dn-money">
                            {fmtINR(getTotalPaid(n))}
                          </td>
                          <td className="dn-money">
                            {fmtINR(getAdvancePaid(n))}
                          </td>
                          <td className="dn-money">{fmtINR(getTotalDue(n))}</td>

                          <td>{fmtDate(n.due_date)}</td>
                          <td>
                            <span
                              className="booking-status-pill"
                              style={statusPillStyle(n.status)}
                            >
                              {normalizeStatus(n.status)}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={
                                n.important ? "dn-star" : "dn-star dn-star-off"
                              }
                            >
                              ★
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-info">{rangeLabel}</div>
          </div>
        )}
      </div>

      {/* ================== CREATE MODAL ================== */}
      {createOpen && (
        <div className="dn-modal-overlay" onMouseDown={closeCreate}>
          <div className="dn-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">Create Demand Note</div>
              </div>

              <button
                className="dn-close-btn"
                onClick={closeCreate}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="dn-modal-body">
              {treeErr && <div className="dn-error dn-mb">{treeErr}</div>}
              {treeLoading ? (
                <div className="dn-loading">Loading units...</div>
              ) : (
                <>
                  <div className="dn-grid">
                    <div className="dn-field">
                      <label>Milestone</label>
                      <input
                        className="dn-input"
                        value={milestone}
                        onChange={(e) => setMilestone(e.target.value)}
                        onBlur={() => setMilestone((v) => toTitleCase(v))}
                        placeholder="Slab 1 / Plinth / etc"
                      />
                    </div>

                    <div className="dn-field">
                      <label>Tower</label>
                      <select
                        className="dn-select"
                        value={createTowerId}
                        onChange={(e) => {
                          setCreateTowerId(e.target.value);
                          setCreateFloorId("");
                          setCreateUnitId("");
                        }}
                      >
                        <option value="">Select Tower</option>
                        {treeTowers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {toTitleCase(t.name)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="dn-field">
                      <label>Floor</label>
                      <select
                        className="dn-select"
                        value={createFloorId}
                        onChange={(e) => {
                          setCreateFloorId(e.target.value);
                          setCreateUnitId("");
                        }}
                        disabled={!createTowerId}
                      >
                        <option value="">Select Floor</option>
                        {treeFloors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {toTitleCase(String(f.number))}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="dn-field">
                      <label>Unit</label>
                      <select
                        className="dn-select"
                        value={createUnitId}
                        onChange={(e) => setCreateUnitId(e.target.value)}
                        disabled={!createFloorId}
                      >
                        <option value="">Select Unit</option>
                        {treeUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {toTitleCase(u.unit_no || u.name || `Unit ${u.id}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="dn-field">
                      <label>Due Date</label>
                      <input
                        className="dn-input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>

                    <div className="dn-field">
                      <label>Status</label>
                      <select className="dn-select" value="Pending" disabled>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="dn-field">
                      <label>Principal</label>
                      <div className="dn-money-wrap">
                        <span className="dn-rupee">₹</span>
                        <input
                          className="dn-input"
                          value={formatMoneyINR(principal)}
                          onChange={(e) =>
                            setPrincipal(sanitizeMoneyInput(e.target.value))
                          }
                          placeholder="Auto from final_amount (editable)"
                        />
                      </div>
                    </div>

                    <div className="dn-field">
                      <label>Gst</label>
                      <div className="dn-money-wrap">
                        <span className="dn-rupee">₹</span>
                        <input
                          className="dn-input"
                          value={formatMoneyINR(gst)}
                          onChange={(e) =>
                            setGst(sanitizeMoneyInput(e.target.value))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="dn-field">
                      <label>Tax</label>
                      <div className="dn-money-wrap">
                        <span className="dn-rupee">₹</span>
                        <input
                          className="dn-input"
                          value={formatMoneyINR(tax)}
                          onChange={(e) =>
                            setTax(sanitizeMoneyInput(e.target.value))
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="dn-field">
                      <label>Demand</label>
                      <div className="dn-money-wrap">
                        <span className="dn-rupee">₹</span>
                        <input
                          className="dn-input"
                          value={formatMoneyINR(demand)}
                          onChange={(e) =>
                            setDemand(sanitizeMoneyInput(e.target.value))
                          }
                          placeholder="Defaults = principal"
                        />
                      </div>
                    </div>

                    <div className="dn-field">
                      <label>Total Payable</label>
                      <div className="dn-money-wrap">
                        <span className="dn-rupee">₹</span>
                        <input
                          className="dn-input"
                          value={formatMoneyINR(total)}
                          onChange={(e) => {
                            setTotalTouched(true);
                            setTotal(sanitizeMoneyInput(e.target.value));
                          }}
                          placeholder="Auto (editable)"
                        />
                      </div>
                    </div>

                    <div className="dn-field dn-toggle-field">
                      <label>Important</label>
                      <label className="dn-switch">
                        <input
                          type="checkbox"
                          checked={createImportant}
                          onChange={(e) => setCreateImportant(e.target.checked)}
                        />
                        <span className="dn-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="dn-modal-footer">
                    <button
                      type="button"
                      className="dn-btn"
                      onClick={closeCreate}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="dn-btn dn-btn-primary"
                      onClick={handleCreateSubmit}
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================== INSTALLMENTS MODAL ================== */}
      {instOpen && (
        <div className="dn-modal-overlay" onMouseDown={closeInstallments}>
          <div
            className="dn-modal dn-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div>
                <div className="dn-modal-title">
                  Demand Note Installments —{" "}
                  {activeNote?.demand_id || `DN-${activeNote?.id}`}
                </div>
                <div className="dn-modal-sub">
                  Status: <b>{normalizeStatus(activeNote?.status)}</b> • Total
                  Payable: <b>{fmtINR(getTotalPayable(activeNote))}</b> • Total
                  Paid: <b>{fmtINR(getTotalPaid(activeNote))}</b> • Advance
                  Paid: <b>{fmtINR(getAdvancePaid(activeNote))}</b> • Total Due:{" "}
                  <b>{fmtINR(getTotalDue(activeNote))}</b>
                </div>
              </div>
              <button
                className="dn-close-btn"
                onClick={closeInstallments}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="dn-modal-body">
              <div className="dn-inst-toolbar">
                <div className="dn-inst-toolbar-left">
                  <SearchBar
                    value={instSearch}
                    onChange={(v) => setInstSearch(v)}
                    placeholder="Search installments by Receipt No, Ref, Note, Amount..."
                    wrapperClassName="dn-inst-search"
                  />
                </div>

                <div className="dn-inst-toolbar-right">
                  <button
                    type="button"
                    className="dn-btn dn-btn-primary"
                    onClick={openAddInstallment}
                  >
                    + Add Installment
                  </button>
                </div>
              </div>

              <div className="dn-status-row">
                <div className="dn-status-right">
                  <button
                    type="button"
                    className="dn-btn dn-btn-light"
                    onClick={() => setStatusManual(activeNote?.id, "Pending")}
                  >
                    Set Pending
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-light"
                    onClick={() => setStatusManual(activeNote?.id, "Overdue")}
                  >
                    Set Overdue
                  </button>
                  <button
                    type="button"
                    className="dn-btn dn-btn-light"
                    onClick={() => setStatusManual(activeNote?.id, "Paid")}
                  >
                    Set Paid
                  </button>
                </div>
              </div>

              {instLoading ? (
                <div className="dn-loading">Loading installments...</div>
              ) : (
                <div className="dn-table-wrap">
                  <table className="booking-table dn-subtable">
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th style={{ width: 190 }}>Receipt No</th>
                        <th style={{ width: 120 }}>Date</th>
                        <th style={{ width: 160 }}>Amount</th>
                        <th style={{ width: 120 }}>Type</th>
                        <th>Ref (UTR/Cheque)</th>
                        <th style={{ width: 260 }}>Note</th>
                        <th style={{ width: 260 }}>Attachments</th>
                        <th style={{ width: 210 }}>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstallments.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="booking-empty-row">
                            No installments found.
                          </td>
                        </tr>
                      ) : (
                        filteredInstallments.map((x) => (
                          <tr key={x.id}>
                            <td>{x.id}</td>
                            <td className="dn-mono">{x.receipt_no || "-"}</td>
                            <td>{fmtDate(x.receipt_date)}</td>
                            <td className="dn-money">
                              {fmtINR(x.receipt_amount)}
                            </td>
                            <td>
                              {nicePayLabel(x.payment_type || x.payment_mode)}
                            </td>
                            <td className="dn-mono">
                              {x.utr || x.cheque_no || "-"}
                            </td>
                            <td className="dn-wrap">{x.notes || "-"}</td>

                            <td>
                              {Array.isArray(x.attachments) &&
                              x.attachments.length > 0 ? (
                                <div className="dn-att-list">
                                  {x.attachments.map((a) => {
                                    const href = absApiUrl(
                                      a.file,
                                      axiosInstance
                                    );
                                    return (
                                      <a
                                        key={a.id}
                                        className="dn-att-link"
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={fileNameFromPath(a.file)}
                                      >
                                        📎 {fileNameFromPath(a.file)}
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span
                                  style={{ color: "#6b7280", fontSize: 12 }}
                                >
                                  —
                                </span>
                              )}
                            </td>

                            <td>{fmtDateTime(x.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="dn-inst-count">
                    Showing <b>{filteredInstallments.length}</b> of{" "}
                    <b>{installments.length}</b>
                  </div>
                </div>
              )}
            </div>

            <div className="dn-modal-footer">
              <button
                type="button"
                className="dn-btn"
                onClick={closeInstallments}
              >
                Close
              </button>
            </div>

            {/* ================== ADD INSTALLMENT MODAL ================== */}
            {addInstOpen && (
              <div
                className="dn-modal-overlay dn-suboverlay"
                onMouseDown={closeAddInstallment}
              >
                <div
                  className="dn-modal dn-modal-sm"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="dn-modal-header">
                    <div>
                      <div className="dn-modal-title">Add Installment</div>
                      <div className="dn-modal-sub">
                        Receipt No will be auto-generated • Demand Note:{" "}
                        <b>{activeNote?.demand_id || `DN-${activeNote?.id}`}</b>
                      </div>
                    </div>
                    <button
                      className="dn-close-btn"
                      onClick={closeAddInstallment}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="dn-modal-body">
                    <div className="dn-addinst-grid">
                      <div className="dn-field">
                        <label>Amount</label>
                        <div className="dn-money-wrap">
                          <span className="dn-rupee">₹</span>
                          <input
                            className="dn-input"
                            value={formatMoneyINR(instAmount)}
                            onChange={(e) =>
                              setInstAmount(sanitizeMoneyInput(e.target.value))
                            }
                            placeholder="100000.00"
                          />
                        </div>
                      </div>

                      <div className="dn-field">
                        <label>Payment Type</label>
                        <select
                          className="dn-select"
                          value={instPaymentType}
                          onChange={(e) => setInstPaymentType(e.target.value)}
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>

                      <div className="dn-field dn-span-2">
                        <label>Payment Ref (UTR/Cheque/Txn)</label>
                        <input
                          className="dn-input"
                          value={instPaymentRef}
                          onChange={(e) => setInstPaymentRef(e.target.value)}
                          placeholder="UTR123 / Cheque No / Txn Id"
                        />
                      </div>

                      <div className="dn-field dn-span-2">
                        <label>Note</label>
                        <input
                          className="dn-input"
                          value={instNote}
                          onChange={(e) => setInstNote(e.target.value)}
                          onBlur={() => setInstNote((v) => toTitleCase(v))}
                          placeholder="Part payment / remarks..."
                        />
                      </div>

                      <div className="dn-field">
                        <label>Receipt Date (Optional)</label>
                        <input
                          className="dn-input"
                          type="date"
                          value={instReceiptDate}
                          onChange={(e) => setInstReceiptDate(e.target.value)}
                        />
                      </div>

                      <div className="dn-field dn-span-2">
                        <label>Attachments (Multiple)</label>

                        <input
                          className="dn-file-input"
                          type="file"
                          multiple
                          onChange={onPickInstFiles}
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                        />

                        {instFiles.length > 0 && (
                          <div className="dn-file-list">
                            {instFiles.map((f, idx) => (
                              <div
                                key={`${f.name}_${f.size}_${idx}`}
                                className="dn-file-chip"
                              >
                                <span className="dn-file-name" title={f.name}>
                                  {f.name}
                                </span>
                                <button
                                  type="button"
                                  className="dn-file-remove"
                                  onClick={() => removeInstFile(idx)}
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dn-modal-footer">
                    <button
                      type="button"
                      className="dn-btn dn-btn-light"
                      onClick={closeAddInstallment}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="dn-btn dn-btn-primary"
                      onClick={createInstallment}
                      disabled={instCreating}
                    >
                      {instCreating ? "Saving..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* ================== END ADD MODAL ================== */}
          </div>
        </div>
      )}
    </div>
  );
}
