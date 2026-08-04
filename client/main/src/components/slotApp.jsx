import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import Notice from "./noticeBox.jsx";
import useConfirm from "../utils/useConfirm.js";
import { useLocation } from "react-router-dom";

const SlotApp = () => {
  const { authFetch } = useAuth();
  const [slotList, setSlotList] = useState([]);
  const [selectedSlotID, setSelectedSlotID] = useState(null);
  const { confirm, ConfirmComponent } = useConfirm();
  
  const [slotForm, setSlotForm] = useState({
    signupID: '',
    start: null,
    slotDuration: '',
    numSlots: '',
    maxMembers: ''
  });
  
  const [slotEditForm, setSlotEditForm] = useState({
    start: null,
    slotDuration: '',
    maxMembers: ''
  });
  
  const [searchData, setSearchData] = useState({
    searchSignupID: ''
  });
  const [noticeMsg, setNoticeMsg] = useState("");
  const location = useLocation();
  const [signUp, setSignUp] = useState(null);
  const [signUpID, setSignUpID] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);


  const getSlots = useCallback(async () => {
    if (!signUpID) return;
    try {
      const response = await authFetch(`/slots/${signUpID}`);
      const result = await response.json();
      if (result.success) {
        setSlotList(result.slots);
      } else {
        setSlotList([]);
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to load slots for this signup sheet");
    }
  }, [authFetch, signUpID]);

  useEffect(() => {
    if (location.state) {
      setSignUp(location.state);
      if (location.state.signupID) {
        setSignUpID(location.state.signupID);
      }
      setSlotForm(prev => ({
        ...prev,
        signupID: location.state.signupID || prev.signupID,
        start: location.state.notBefore ? new Date(location.state.notBefore).getTime() : prev.start
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (signUpID) getSlots();
  }, [signUpID, getSlots]);

  const handleSlotFormChange = (field, value) => {
    if (field === 'start') {
      setSlotForm(prev => ({
        ...prev,
        start: value ? new Date(value).getTime() : null
      }));
    } else {
      setSlotForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSlotEditFormChange = (field, value) => {
    if (field === 'start') {
      setSlotEditForm(prev => ({
        ...prev,
        start: value ? new Date(value).getTime() : null
      }));
    } else {
      setSlotEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSlot = async (e) => {
    e.preventDefault();
    const targetSignupID = Number(signUp?.signupID || slotForm.signupID);
    if (!targetSignupID) {
      setNoticeMsg("No signup sheet selected");
      return;
    }

    const data = {
      signupID: targetSignupID,
      start: slotForm.start,
      slotDuration: Number(slotForm.slotDuration),
      numSlots: Number(slotForm.numSlots),
      maxMembers: Number(slotForm.maxMembers)
    };

    for (let i = 0; i < data.numSlots; i++) {
      const slotStart = data.start + i * data.slotDuration * 60 * 1000;
      const slotEnd = slotStart + data.slotDuration * 60 * 1000;
      const overlap = slotList.some(s => {
        if (s.signupID !== data.signupID) return false;
        const sStart = Number(s.start);
        const sEnd = sStart + Number(s.slotDuration) * 60 * 1000;
        return Math.max(sStart, slotStart) < Math.min(sEnd, slotEnd);
      });
      if (overlap) {
        setNoticeMsg("Cannot add slot: time overlaps with existing slot.");
        return;
      }
    }

    try {
      const response = await authFetch("/addSlots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setNoticeMsg("Slots added successfully!");
        setSlotForm(prev => ({ ...prev, start: null, slotDuration: '', numSlots: '', maxMembers: '' }));
        getSlots();
      } else {
        setNoticeMsg(result.error || "Submit failed");
      }
    } catch (error) {
      console.error(error);
      setNoticeMsg("Submit failed, please try again");
    }
  };

  const searchSlot = async (e) => {
    e?.preventDefault();

    const signupID = Number(searchData.searchSignupID);
    if (isNaN(signupID)) {
      setNoticeMsg("Please enter a valid number Signup ID");
      return;
    }

    try {
      const response = await authFetch(`/slots/${signupID}`);
      const result = await response.json();
      
      if (!result.success) {
        setNoticeMsg("No related time slots found");
        setSlotList([]);
        return;
      }
      
      setSlotList(result.slots);
    } catch (error) {
      console.error(error);
      setNoticeMsg("Failed to get time slots");
    }
  };

  const editSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotID) {
      setNoticeMsg("Please select a time slot to edit first");
      return;
    }

    const newStart = slotEditForm.start;
    const newDuration = Number(slotEditForm.slotDuration);
    const newMax = Number(slotEditForm.maxMembers);

    const overlap = slotList.some(s => {
      if (s.slotID === selectedSlotID) return false;
      if (s.signupID !== (signUp?.signupID || slotForm.signupID)) return false;
      const sStart = Number(s.start);
      const sEnd = sStart + Number(s.slotDuration) * 60 * 1000;
      const newEnd = newStart + newDuration * 60 * 1000;
      return Math.max(sStart, newStart) < Math.min(sEnd, newEnd);
    });

    if (overlap) {
      setNoticeMsg("Cannot edit slot: time overlaps with another slot.");
      return;
    }

    const slot = slotList.find(s => s.slotID === selectedSlotID);
    if (!slot) {
      setNoticeMsg("Slot not found");
      return;
    }
    if ((slot.members?.length || 0) > newMax) {
      setNoticeMsg(`Cannot set max members to ${newMax}. Already ${slot.members.length} members signed up.`);
      return;
    }

    try {
      const response = await authFetch(`/slot/${selectedSlotID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: newStart,
          slotDuration: newDuration,
          maxMembers: newMax
        })
      });
      const result = await response.json();
      if (result.success) {
        setNoticeMsg("Slot edited successfully!");
        setSelectedSlotID(null);
        setShowEditModal(false);
        getSlots();
      } else {
        setNoticeMsg(result.error || "Edit failed");
      }
    } catch (error) {
      console.error(error);
      setNoticeMsg("Edit failed");
    }
  };

  const deleteSlot = async (slotID) => {
    const slot = slotList.find(s => s.slotID === slotID);
    if (slot?.members?.length > 0) {
      setNoticeMsg(`Cannot delete slot. ${slot.members.length} member(s) already signed up.`);
      return;
    }

    const ok = await confirm('Are you sure you want to delete this time slot?');
    if (!ok) return;

    try {
      const response = await authFetch(`/deleteSlot/${slotID}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setNoticeMsg("Delete successful!");
        getSlots();
      } else {
        setNoticeMsg(result.error || "Delete failed");
      }
    } catch (error) {
      setNoticeMsg(error.message || "Delete failed");
    }
  };

  const setupEditForm = (slot) => {
    setSelectedSlotID(slot.slotID);
    setSlotEditForm({
      start: Number(slot.start),
      slotDuration: slot.slotDuration || '',
      maxMembers: slot.maxMembers || ''
    });
    setShowEditModal(true);
  };


  const formatMembers = (members) => {
    if (!members || members.length === 0) return '';
    return members.map(m => m.userId ?? m.memberID ?? '').join(", ");
  };

  const handleSaveSlotEdit = async () => {
    await editSlot({ preventDefault: () => {} });
  };

  const toLocalInputFormat = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60 * 1000);
    return local.toISOString().slice(0,16);
  };

  return (
    <div>
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      {ConfirmComponent}

      <form id="slot-form" onSubmit={addSlot}>
        <p>Add slots</p>
        <div className="forms-style">
          <label htmlFor="signupID">Signup ID</label>
          <input 
            type="text" 
            id="signupID"
            required
            value={slotForm.signupID}
            onChange={(e) => handleSlotFormChange('signupID', e.target.value)}
          />
          
          <label htmlFor="start">Start</label>
          <input 
            type="datetime-local" 
            id="start"
            required
            value={toLocalInputFormat(slotForm.start)}
            onChange={(e) => handleSlotFormChange('start', e.target.value)}
          />
          
          <label htmlFor="slotDuration">Slot duration</label>
          <input 
            type="number" 
            id="slotDuration"
            min="1" 
            max="240" 
            required
            value={slotForm.slotDuration}
            onChange={(e) => handleSlotFormChange('slotDuration', e.target.value)}
          />
          
          <label htmlFor="numSlots">Num slots</label>
          <input 
            type="number" 
            id="numSlots"
            min="1" 
            max="99" 
            required
            value={slotForm.numSlots}
            onChange={(e) => handleSlotFormChange('numSlots', e.target.value)}
          />
          
          <label htmlFor="maxMembers">Max members</label>
          <input 
            type="number" 
            id="maxMembers"
            min="1" 
            max="99" 
            required
            value={slotForm.maxMembers}
            onChange={(e) => handleSlotFormChange('maxMembers', e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      <div className="form-style">
        <p>Search slot</p>
        <form id="slot-search-form" onSubmit={searchSlot}>
          <div className="search-style">
            <label htmlFor="searchSignupID">Signup ID</label>
            <input 
              type="text" 
              id="searchSignupID"
              required
              value={searchData.searchSignupID}
              onChange={(e) => handleSearchChange('searchSignupID', e.target.value)}
            />
          </div>
          <button type="submit">Search</button>
        </form>

        <p>Slot list</p>
        <table id="slot-list">
          <thead>
            <tr>
              <th>Signup ID</th>
              <th>Start</th>
              <th>Slot duration</th>
              <th>Max members</th>
              <th>Slot ID</th>
              <th>Members</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slotList.map((slot, index) => (
              <tr key={index}>
                <td>{slot.signupID}</td>
                <td>{toLocalInputFormat(slot.start)}</td>
                <td>{slot.slotDuration}</td>
                <td>{slot.maxMembers}</td>
                <td>{slot.slotID}</td>
                <td>{formatMembers(slot.members)}</td>
                <td>
                  <button onClick={() => setupEditForm(slot)}>Edit</button>
                </td>
                <td>
                  <button onClick={() => deleteSlot(slot.slotID)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <div className="edit">
          <div className="edit-box">
            <h3>Edit Slot</h3>

            <label>
              Start Time:
              <input
                type="datetime-local"
                value={toLocalInputFormat(slotEditForm.start)}
                onChange={(e) => handleSlotEditFormChange('start', e.target.value)}
              />
            </label>

            <label>
              Slot Duration (minutes):
              <input
                type="number"
                value={slotEditForm.slotDuration}
                onChange={(e) => handleSlotEditFormChange('slotDuration', e.target.value)}
              />
            </label>

            <label>
              Max Members:
              <input
                type="number"
                value={slotEditForm.maxMembers}
                onChange={(e) => handleSlotEditFormChange('maxMembers', e.target.value)}
              />
            </label>

            <div className="edit-buttons">
              <button onClick={handleSaveSlotEdit}>Save</button>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotApp;