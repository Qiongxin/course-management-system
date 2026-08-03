import './App.css';
import CourseApp from './components/courseApp.jsx';
import MemberApp from './components/memberApp.jsx';
import SignupApp from './components/signupApp.jsx';
import SlotApp from './components/slotApp.jsx';
import GradeApp from './components/gradeApp.jsx';
import About from './components/about.jsx';
import Login from './components/login.jsx';
import Register from './components/register.jsx';
import AuthRoute from './components/authRoute.jsx';
import Navbar from './components/navbar.jsx';
import ChangePassword from './components/changePassword.jsx';
import UpdatePassword from './components/updatePassword.jsx';
import StudentSlotApp from './components/studentSlotApp.jsx';
import ManageUser from './components/manageUser.jsx';
import { useState } from 'react';
import Notice from "./components/noticeBox.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [noticeMsg, setNoticeMsg] = useState("");

  return (
    <Router>
      <div className="App">
        <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />

        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/login" element={ <Login /> } />

          <Route path="/change-password" element={
            <AuthRoute>
              <ChangePassword />
            </AuthRoute>
            } 
          />

          <Route
            path="/update-password"
            element={
              <AuthRoute>
                <Navbar />
                <UpdatePassword />
              </AuthRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <AuthRoute role={["admin", "ta"]}>
                <Navbar />
                <CourseApp />
              </AuthRoute>
            }
          />
          <Route
            path="/manage-user"
            element={
              <AuthRoute role={["admin"]}>
                <Navbar />
                <ManageUser />
              </AuthRoute>
            }
          />

          <Route
            path="/members"
            element={
              <AuthRoute role={["admin", "ta"]}>
                <Navbar />
                <MemberApp />
              </AuthRoute>
            }
          />

          <Route
            path="/register"
            element={
              <AuthRoute role={["admin"]}>
                <Navbar />
                <Register />
              </AuthRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <AuthRoute role={["admin", "ta"]}>
                <Navbar />
                <SignupApp />
              </AuthRoute>
            }
          />

          <Route
            path="/slots"
            element={
              <AuthRoute role={["ta", "admin"]}>
                <Navbar />
                <SlotApp />
              </AuthRoute>
            }
          />

          <Route
            path="/student-slots"
            element={
              <AuthRoute role={["student"]}>
                <Navbar />
                <StudentSlotApp />
              </AuthRoute>
            }
          />

          <Route
            path="/grades"
            element={
              <AuthRoute role={["admin", "ta"]}>
                <Navbar />
                <GradeApp />
              </AuthRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
