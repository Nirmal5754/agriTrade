import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ role, children }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
 