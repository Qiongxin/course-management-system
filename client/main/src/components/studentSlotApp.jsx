import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./authContext.jsx";
import Notice from "./noticeBox.jsx";

const StudentSlotApp = () => {
  const { authFetch, user } = useAuth();
  const [noticeMsg, setNoticeMsg] = useState("");
  const [allSlots, setAllSlots] = useState([]);
  const [showMySlots, setShowMySlots] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await authFetch("/studentSlots");
      const data = await res.json();
      if (data.success) {
        setAllSlots(data.slots);
      } else {
        setNoticeMsg("No slots available");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to fetch slots");
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const signUpSlot = async (slot) => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (slot.members.some(m => m.userId === user.userId)) {
      setNoticeMsg("You have already signed up for this slot");
      return;
    }
    if (Number(slot.start) - now < oneHour) {
      setNoticeMsg("Slot must be at least one hour ahead to sign up");
      return;
    }
    if (slot.members.length >= slot.maxMembers) {
      setNoticeMsg("Slot is full");
      return;
    }

    try {
      const res = await authFetch(`/signUpSlot/${slot.slotID}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNoticeMsg("Signed up successfully!");
        fetchSlots();
      } else {
        setNoticeMsg(data.error || "Failed to sign up");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to sign up");
    }
  };

  const leaveSlot = async (slot) => {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    if (!slot.members.some(m => m.userId === user.userId)) {
      setNoticeMsg("You are not signed up for this slot");
      return;
    }
    if (Number(slot.start) - now < twoHours) {
      setNoticeMsg("Cannot leave slot less than 2 hours away");
      return;
    }

    try {
      const res = await authFetch(`/leaveSlot/${slot.slotID}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNoticeMsg("Left the slot successfully!");
        fetchSlots();
      } else {
        setNoticeMsg(data.error || "Failed to leave slot");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to leave slot");
    }
  };

  const viewGrade = (slot) => {
    const member = slot.members.find(m => m.userId === user.userId);
    if (!member || member.grade == null) return;
    setNoticeMsg(<>
      Grade: {member.grade}<br />
      Bonus: {member.bonus ?? 0}<br />
      Penalty: {member.penalty ?? 0}<br />
      Comment: {member.comment ?? ""}
    </>);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp)).toLocaleString();
  };

  const displayedSlots = showMySlots
    ? allSlots.filter(slot => slot.members.some(m => m.userId === user.userId))
    : allSlots;

  return (
    <div id="slot-signup-form" className="form-style">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />

      <h2>Slot list</h2>
      
      <div className="button-group">
        <button onClick={() => setShowMySlots(false)}>All Slots</button>
        <button onClick={() => setShowMySlots(true)}>My Slots</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Assignment name</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayedSlots.map((slot) => {
            const start = Number(slot.start);
            const end = start + Number(slot.slotDuration) * 60 * 1000;
            const member = slot.members.find(m => m.userId === user.userId);
            const isSignedUp = !!member;
            const hasGrade = isSignedUp && member.grade != null;

            return (
              <tr key={`${slot.slotID}-${slot.start}`}>
                <td>{slot.courseName}</td>
                <td>{slot.assignmentName}</td>
                <td>{formatTime(start)}</td>
                <td>{formatTime(end)}</td>
                <td>
                  {hasGrade ? (
                    <button onClick={() => viewGrade(slot)}>View Grade</button>
                  ) : isSignedUp ? (
                    <button onClick={() => leaveSlot(slot)}>Leave</button>
                  ) : (
                    <button onClick={() => signUpSlot(slot)}>Sign Up</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSlotApp;