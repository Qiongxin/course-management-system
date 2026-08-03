import { useAuth } from './authContext';
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleChangePassword = () => {
    navigate("/update-password");
  }
  const handleUser = () => {
    navigate("/manage-user");
  }

  const handleGrading= () => {
    navigate("/grades");
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  }

  return (
    <div className="navbar">
      <nav>
        <Link to="/courses"><p>Course management system</p></Link>
        <div>
          <span className="user-info">Welcome, {user.firstName}!</span>
          {user.role === "admin" && <button onClick={handleUser}>
            Manage Users
          </button>}
          {(user.role === "admin" || user.role === "ta") && 
          <button onClick={handleGrading}>
            Grading
          </button>}
          <button onClick={handleChangePassword}>
            Update Password
          </button>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;