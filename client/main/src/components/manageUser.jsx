import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./authContext.jsx";
import Notice from "./noticeBox.jsx";
import { Link } from 'react-router-dom';

const ManageUser = () => {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [noticeMsg, setNoticeMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch("/getUsers");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setNoticeMsg("Failed to load users");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Error loading users");
    }
  }, [authFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addTA = async (user) => {
  try {
    const res = await authFetch(`/addTA`, {
      method: "POST",
      body: JSON.stringify({ userId: user.userId})
    });
    const data = await res.json();
    if (data.success) {
      setNoticeMsg(`${user.email} is now a TA`);
      fetchUsers();
    } else {
      setNoticeMsg(data.error || "Failed to add TA");
    }
  } catch (err) {
    console.error(err);
    setNoticeMsg("Error adding TA");
  }
};

  const removeTA = async (user) => {
    try {
      const res = await authFetch(`/removeTA`, {
        method: "POST",
        body: JSON.stringify({ userId: user.userId })
      });
      const data = await res.json();
      if (data.success) {
        setNoticeMsg(`${user.name} is no longer a TA`);
        fetchUsers();
      } else {
        setNoticeMsg(data.error || "Failed to remove TA");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Error removing TA");
    }
  };


  const resetPassword = async (user) => {
    const tempPassword = "password";

    try {
      const res = await authFetch(`/resetUserPassword`, {
        method: "POST",
        body: JSON.stringify({ userId: user.userId, newPassword: tempPassword })
      });
      const data = await res.json();
      if (data.success) {
        setNoticeMsg(
          "Password reset."
        );
      } else {
        setNoticeMsg(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Error resetting password");
    }
  };

  return (
    <div className="form-style">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />

      <h2>User List</h2>
      <Link to="/register"><button>Register</button></Link>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>TA Action</th>
            <th>Password Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => {
            if (user.role === "admin") return null;
            return (
            <tr key={user.userId}>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.role === "ta" ? (
                  <button onClick={() => removeTA(user)}>Remove from TA</button>
                ) : (
                  <button onClick={() => addTA(user)}>Add as TA</button>
                )}
              </td>
              <td>
                <button onClick={() => resetPassword(user)}>Reset Password</button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUser;
