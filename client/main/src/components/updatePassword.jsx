import { useState } from "react";
import { useAuth } from "./authContext";
import Notice from "./noticeBox";

const UpdatePassword = () => {
  const { user } = useAuth();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPass !== confirmPass) {
      return setNoticeMsg("New passwords do not match");
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/update-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        oldPassword: oldPass,
        newPassword: newPass
      })
    });

    const data = await res.json();

    if (!data.success) {
      return setNoticeMsg(data.error || "Password update failed");
    }

    setNoticeMsg("Password updated successfully!");
  };

  return (
    <div className="change-password">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />

      <h2>Update Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Current password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          required
        />

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

export default UpdatePassword;
