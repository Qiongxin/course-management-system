import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./authContext";
import Notice from "./noticeBox";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const email = user?.email;
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      return setNoticeMsg("Passwords do not match");
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword: newPass }),
    });
    const data = await res.json();

    if (!res.ok) return setNoticeMsg(data.error);

    setNoticeMsg("Password changed! Logging out...");

    setTimeout(() => {
      logout();
      navigate("/login", { replace: true });
    }, 1500);
  };

  return (
    <div className="change-password">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      <h2>Change Your Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          required
        />
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
};

export default ChangePassword;
