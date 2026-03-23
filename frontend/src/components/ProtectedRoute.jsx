import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}
