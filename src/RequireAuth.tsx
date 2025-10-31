import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user)
    return <Navigate to="/signin" replace state={{ from: location }} />;
  return <>{children}</>;
};

export default RequireAuth;
