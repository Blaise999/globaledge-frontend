import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getUserToken } from "../utils/api";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const token = getUserToken();
  const location = useLocation();

  // Require BOTH a user object and a stored token every time
  if (!user || !token) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
