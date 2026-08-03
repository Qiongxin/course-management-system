import { useAuth } from './authContext';
import { Navigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const AuthRoute = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/" replace />;

  if (user?.firstLogin && !location.pathname.startsWith("/change-password")) {
    return <Navigate to="/change-password" replace />;
  }

  if (role && !role.includes(user.role)) {
    const defaultPaths = {
      student: "/student-slots",
      ta: "/slots",
      admin: "/courses",
    };
    const redirectPath = defaultPaths[user.role] || "/slots";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default AuthRoute;