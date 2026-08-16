import { Navigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";

export default function IndexRoute() {
  const { user } = useAuth();
  return <Navigate to={user ? "/filmes" : "/login"} replace />;
}
