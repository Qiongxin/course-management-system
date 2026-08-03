import { useState } from "react";
import { useAuth } from "./authContext.jsx";
import Notice from "./noticeBox.jsx";

function Register() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setNoticeMsg("Register failed: Passwords do not match.");
      return;
    }
    const result = await register(firstName, lastName, email, password, role);

    if (!result.success) {
      setNoticeMsg("Register failed: " + result.error);
    } else {
      setNoticeMsg("Registration successful!");
    }
  };

  return (
    <div className="register">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      <div className="register-box">
        <h2>Create an Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="" disabled>Select Role</option>
            <option value="student">Student</option>
            <option value="ta">TA</option>
          </select>

          <button type="submit">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;