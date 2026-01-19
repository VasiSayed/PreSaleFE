// src/pages/PostSales/Communication/admin/components/useMyScope.js
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { API_SCOPE, SCOPE_PARAMS } from "./commsUtils";

export default function useMyScope() {
  const [scope, setScope] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");

  const fetchScope = async () => {
    setScopeLoading(true);
    setScopeError("");
    try {
      const res = await axiosInstance.get(API_SCOPE, { params: SCOPE_PARAMS });
      setScope(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail || e?.message || "Failed to load scope.";
      setScopeError(String(msg));
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    fetchScope();
  }, []);

  return { scope, scopeLoading, scopeError, refetchScope: fetchScope };
}
