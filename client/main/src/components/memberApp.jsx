import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import Notice from "./noticeBox.jsx";
import { useLocation } from "react-router-dom";
import useConfirm from "../utils/useConfirm.js";

const MemberApp = () => {
  const { authFetch } = useAuth();
  const [memberList, setMemberList] = useState([]);
  const [members, setMembers] = useState([{
    email: '',
    firstName: '',
    lastName: ''
  }]);
   const [noticeMsg, setNoticeMsg] = useState("");
  
  const [searchForm, setSearchForm] = useState({
    searchTermCode: '',
    searchSection: '1',
    searchRole: ''
  });
  const location = useLocation();
  const [termCode, setTermCode] = useState('');
  const [section, setSection] = useState('');
  const { confirm, ConfirmComponent } = useConfirm();
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    if (location.state) {
      setTermCode(location.state.termCode);
      setSection(location.state.section);
    }
  }, [location.state]);

  const getMembers = useCallback(async () => {
    try {
      const data = {
        termCode: termCode || searchForm.searchTermCode,
        section: section || searchForm.searchSection
      };
      
      const response = await authFetch('/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      setMemberList(result);
    } catch (error) {
      console.error('Failed to get members:', error);
    }
  }, [termCode, section, searchForm.searchSection, searchForm.searchTermCode, authFetch]);

  useEffect(() => {
    getMembers();
  }, [getMembers]);

  const addMoreMember = () => {
    setMembers(prev => [...prev, {
      email: '',
      firstName: '',
      lastName: ''
    }]);
  };

  const updateMemberField = (index, field, value) => {
    setMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const handleMemberSubmit = (e) => {
    e.preventDefault();
    addMember();
  };

  const addMember = async () => {
    for (const m of members) {
      if (!isValidEmail(m.email)) {
        setNoticeMsg(`Invalid email format: ${m.email}`);
        return;
      }
    }
    try {
      const response = await authFetch("/addMember", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          termCode, 
          section, 
          members 
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.success === false) {
        const errMsg = result.error || "Failed to add members";
        setNoticeMsg(errMsg);
        return;
      }

      const addedCount = result.addedCount ?? result.added ?? 0;
      const ignoredList = result.ignored ?? result.ignoredIds ?? [];

      setNoticeMsg(`Added ${addedCount} members. Ignored: ${ignoredList.length ? ignoredList.join(", ") : "None"}`);
      getMembers();
    } catch (error) {
      console.error('Fail:', error);
      setNoticeMsg("Fail to submit, please try again");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchMember();
  };

  const searchMember = async () => {
    try {
      const data = {
        termCode: searchForm.searchTermCode,
        section: searchForm.searchSection,
        role: searchForm.searchRole
      };
      
      const response = await authFetch('/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      setMemberList(result);
    } catch (error) {
      console.error('Search failed:', error);
      setNoticeMsg("Search failed, please try again");
    }
  };

  const deleteMember = async (member) => {
    try {
      const response = await authFetch("/deleteMember", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          termCode: member.termCode,
          section: member.section,
          userId: member.userId
        })
      });
      
      if (!response.ok) throw new Error("Failed to delete member");
      
      await response.json();
      setNoticeMsg("Deleted successfully!");
      getMembers();
    } catch (err) {
      setNoticeMsg(err.message);
    }
  };

  const updateSearchField = (field, value) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) { setNoticeMsg("Please select a CSV file."); return; }

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("termCode", termCode);
    formData.append("section", section);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/addMemberCSV", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setNoticeMsg(result.error || "Failed to upload CSV");
        return;
      }

      setNoticeMsg(`Added: ${result.addedCount}, Ignored: ${result.ignored.join(", ") || "None"}`);
      getMembers();

    } catch (err) {
      console.error(err);
      setNoticeMsg("Error uploading CSV");
    }
  };

  return (
    <div>
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      {ConfirmComponent}
        <form id="members-form" onSubmit={handleMemberSubmit}>
        <p>Add members</p>
        
        {members.map((member, index) => (
          <div key={index} className="forms-style member">
            <label htmlFor={`email-${index}`}>Email</label>
            <input 
              type="email" 
              id={`email-${index}`}
              maxLength="100"
              required
              value={member.email}
              onChange={(e) => updateMemberField(index, 'email', e.target.value)}
            />
            
            <label htmlFor={`firstName-${index}`}>First name</label>
            <input 
              type="text" 
              id={`firstName-${index}`}
              maxLength="200"
              required
              value={member.firstName}
              onChange={(e) => updateMemberField(index, 'firstName', e.target.value)}
            />
            
            <label htmlFor={`lastName-${index}`}>Last name</label>
            <input 
              type="text" 
              id={`lastName-${index}`}
              maxLength="200"
              required
              value={member.lastName}
              onChange={(e) => updateMemberField(index, 'lastName', e.target.value)}
            />
          </div>
        ))}
        
        <button type="button" onClick={addMoreMember}>Add more member</button>
        <button type="submit">Submit</button>

      </form>
      <div className="csv-file">
        <p>Upload members</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCSVUpload();
          }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            required
          />

          <button type="submit">Upload CSV file</button>
        </form>
      </div>

      <div className="form-style">
        <p>Search member list</p>
        
        <form id="member-search-form" onSubmit={handleSearchSubmit}>
          <div className="search-style">
            <label htmlFor="searchTermCode">Term code</label>
            <input 
              type="number" 
              id="searchTermCode"
              min="1" 
              max="9999" 
              required
              value={searchForm.searchTermCode}
              onChange={(e) => updateSearchField('searchTermCode', e.target.value)}
            />
            
            <label htmlFor="searchSection">Section</label>
            <input 
              type="number" 
              id="searchSection"
              value={searchForm.searchSection}
              min="1" 
              max="99"
              onChange={(e) => updateSearchField('searchSection', e.target.value)}
            />
            
            <label htmlFor="searchRole">Role</label>
            <input 
              type="text" 
              id="searchRole"
              maxLength="100"
              value={searchForm.searchRole}
              onChange={(e) => updateSearchField('searchRole', e.target.value)}
            />
          </div>
          <button type="submit">Search</button>
        </form>
        
        <p>Member list</p>
        <table id="member-list">
          <thead>
            <tr>
              <th>Term code</th>
              <th>Section</th>
              <th>email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {memberList.map((member, index) => (
              <tr key={index}>
                <td>{member.termCode}</td>
                <td>{member.section}</td>
                <td>{member.email}</td>
                <td>{member.firstName}</td>
                <td>{member.lastName}</td>
                <td>{member.role}</td>
                <td>
                  <button onClick={ async () => {
                    const ok = await confirm('Are you sure to delete the member?')
                      if (ok) {
                        deleteMember(member);
                  }}}>
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

export default MemberApp;