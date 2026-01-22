import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

const ProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem("access");

  if (!token) {
    toast.error("Please login");
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // user is logged in
  return <Outlet />;
};

export default ProtectedRoute;
