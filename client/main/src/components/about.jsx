import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (user) {
      navigate("/courses", { replace: true });
    }
  }, [user, navigate]);

  const handleSearch = async () => {

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/public/signupSheets?course=${query}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const toggleExpand = async (signupID) => {
    if (Array.isArray(expanded[signupID])) {
      setExpanded(prev => ({ ...prev, [signupID]: null }));
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/public/slots/${signupID}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.slots)) {
        setExpanded(prev => ({
          ...prev,
          [signupID]: data.slots
        }));
      } else {
        setExpanded(prev => ({ ...prev, [signupID]: [] }));
      }
    } catch (err) {
      console.error(err);
      setExpanded(prev => ({ ...prev, [signupID]: [] }));
    }
  };

  return (
    <div className='about'>
      <h1>Course management system</h1>
      <p className='overview'>
        The application allows TAs to open sign-up slots for a course and enter grades,
        and it allows students to reserve a slot and view their grades.
      </p>

      <Link to="/login">
        <button>Sign in to get more access</button>
      </Link>

      <div className='line'></div>

      <h2>Search Sign-up Sheets</h2>
      <input
        type="text"
        placeholder="Enter course name or term code"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <div className="results">
        {results.length === 0 && <p>No results</p>}

        {results.map(sheet => (
          <div key={sheet.signupID}>
            <div
              className="sheet-header"
              onClick={() => toggleExpand(sheet.signupID)}
            >
              {sheet.courseName} - Term code {sheet.termCode} - Section {sheet.section}
            </div>
            {expanded[sheet.signupID] && (
              <div>
                {expanded[sheet.signupID].map(slot => (
                  <div key={slot.slotID} className="slot-item">
                    <p>Date and time: {new Date(slot.start).toLocaleString()}</p>
                    <p>Capacity: {slot.maxMembers}</p>
                    <p>Number of Sign-ups: {slot.members?.length || 0}</p>
                    <div className='line'></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;