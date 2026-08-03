import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import Notice from "./noticeBox.jsx";
import useConfirm from "../utils/useConfirm.js";
import { useLocation, useNavigate } from "react-router-dom";

const SignupApp = () => {
  const { authFetch } = useAuth();
  const [signupList, setSignupList] = useState([]);
  const [formData, setFormData] = useState({
    termCode: '',
    section: '1',
    assignmentName: '',
    notBefore: '',
    notAfter: ''
  });
  const [searchData, setSearchData] = useState({
    searchSignupTermCode: '',
    searchSignupSection: '1'
  });
  const [noticeMsg, setNoticeMsg] = useState("");
  const { confirm, ConfirmComponent } = useConfirm();
  const location = useLocation();
  const [termCode, setTermCode] = useState('');
  const [section, setSection] = useState('');
  const [courseName, setCourseName] = useState('');
  const navigate = useNavigate();

  const getSignupSheet = useCallback(async () => {
    try {
      const data = {
        termCode: termCode || searchData.searchSignupTermCode,
        section: section || searchData.searchSignupSection
      };
      
      const response = await authFetch('/signupSheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      setSignupList(result);
    } catch (error) {
      console.error('Failed to load signup sheets:', error);
      setNoticeMsg('Failed to load signup sheets');
    }
  }, [authFetch, termCode, section, searchData]);

  useEffect(() => {
    if (location.state) {
      setTermCode(location.state.termCode);
      setSection(location.state.section);
      setCourseName(location.state.courseName);
    }
    getSignupSheet();
  }, [location.state, getSignupSheet]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSignup = async (e) => {
    e.preventDefault();
    
    const data = {
      termCode,
      section,
      courseName,
      assignmentName: formData.assignmentName,
      notBefore: formData.notBefore,
      notAfter: formData.notAfter,
      signupID: Number(`${Date.now()}${Math.floor(Math.random() * 100)}`)
    };

    try {
      const response = await authFetch("/addSignup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Success:', result);
        setNoticeMsg("Submit successfully!");
        setFormData({
          termCode: '',
          section: '1',
          assignmentName: '',
          notBefore: '',
          notAfter: ''
        });
        getSignupSheet();
      } else {
        setNoticeMsg(result.error);
      }
    } catch (error) {
      console.error('Fail:', error);
      setNoticeMsg("Failed to submit, please try again");
    }
  };

  const searchSignup = (e) => {
    e.preventDefault();
    getSignupSheet({
      termCode: searchData.searchSignupTermCode,
      section: searchData.searchSignupSection
    });
  };

  const deleteSignup = async (signupID) => {
    const ok = await confirm('Are you sure you want to delete this signup sheet?');
    if (!ok) return;
    try {
      const response = await authFetch(`/deleteSignup/${signupID}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setNoticeMsg(result.error || "Failed to delete signup sheet");
        return;
      }
      setNoticeMsg("Deleted successfully!");
      getSignupSheet();
    } catch (err) {
      setNoticeMsg(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      {ConfirmComponent}
      <form id="signup-form" onSubmit={addSignup}>
        <p>Add a sign-up sheet</p>
        <div className="forms-style">
          <label htmlFor="assignmentName">Assignment name</label>
          <input 
            type="text" 
            id="assignmentName"
            maxLength="100"
            required
            value={formData.assignmentName}
            onChange={(e) => handleFormChange('assignmentName', e.target.value)}
          />
          
          <label htmlFor="notBefore">Not-before</label>
          <input 
            type="datetime-local" 
            id="notBefore"
            value={formData.notBefore}
            onChange={(e) => handleFormChange('notBefore', e.target.value)}
          />
          
          <label htmlFor="notAfter">Not-after</label>
          <input 
            type="datetime-local" 
            id="notAfter"
            value={formData.notAfter}
            onChange={(e) => handleFormChange('notAfter', e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      <div className="form-style">
        <form id="signup-search-form" onSubmit={searchSignup}>
          <p>Search signup sheet</p>
          <div className="search-style">
            <label htmlFor="searchSignupTermCode">Term code</label>
            <input 
              type="number" 
              id="searchSignupTermCode"
              min="1" 
              max="9999" 
              required
              value={searchData.searchSignupTermCode}
              onChange={(e) => handleSearchChange('searchSignupTermCode', e.target.value)}
            />
            
            <label htmlFor="searchSignupSection">Section</label>
            <input 
              type="number" 
              id="searchSignupSection"
              value={searchData.searchSignupSection}
              min="1" 
              max="99"
              onChange={(e) => handleSearchChange('searchSignupSection', e.target.value)}
            />
          </div>
          <button type="submit">Search</button>
        </form>
        
        <p>Signup list</p>
        
        <table id="signup-list">
          <thead>
            <tr>
              <th>Term code</th>
              <th>Section</th>
              <th>Assignment name</th>
              <th>Not-before</th>
              <th>Not-after</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {signupList.map((signup, index) => (
              <tr key={index}>
                <td>{signup.termCode}</td>
                <td>{signup.section}</td>
                <td>{signup.assignmentName}</td>
                <td>{formatDate(signup.notBefore)}</td>
                <td>{formatDate(signup.notAfter)}</td>
                <td>
                  <button onClick={() => navigate("/slots", { state: signup})}>
                    Add slots
                  </button>
                  <button onClick={() => deleteSignup(signup.signupID)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SignupApp;