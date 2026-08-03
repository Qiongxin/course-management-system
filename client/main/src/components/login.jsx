import { useState } from 'react';
import { useAuth } from './authContext';
import Notice from "./noticeBox.jsx";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [noticeMsg, setNoticeMsg] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setNoticeMsg("Login failed: " + result.error);
    } else {
      if (user?.firstLogin) {
        navigate("/change-password", {
          state: { email }
        });
      } else {
        setNoticeMsg("Login successful!");
        setTimeout(() => {
          navigate("/courses");
        }, 1500);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className='login'>
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      <h1>Course management system</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <p>Login</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='input'
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="submit"
          style={{
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>


      <p>Admin: admin@email.com / password</p>
    </div>
  );
};

export default Login;