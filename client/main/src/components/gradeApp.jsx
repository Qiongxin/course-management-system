import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./authContext";
import Notice from "./noticeBox.jsx";

const GradeApp = () => {
  const { authFetch, user } = useAuth();
  const [noticeMsg, setNoticeMsg] = useState("");
  const [slots, setSlots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    grade: "",
    bonus: "",
    penalty: "",
    comment: ""
  });
  const [history, setHistory] = useState([]);

  const fetchCurrentSlots = useCallback(async () => {
    try {
      const res = await authFetch("/allSlots");
      const data = await res.json();
      if (data.success && data.slots.length > 0) {
        const sortedSlots = data.slots.sort((a, b) => Number(a.start) - Number(b.start));
        setSlots(sortedSlots);

        const now = Date.now();
        let idx = sortedSlots.findIndex(s => {
          const start = Number(s.start);
          const end = start + Number(s.slotDuration) * 60 * 1000;
          return now >= start && now <= end;
        });

        if (idx === -1) {
          idx = sortedSlots.reduce((closestIndex, s, i) => {
            const diff = Math.abs(Number(s.start) - now);
            if (closestIndex === -1 || diff < Math.abs(Number(sortedSlots[closestIndex].start) - now)) {
              return i;
            }
            return closestIndex;
          }, -1);
        }

        setCurrentIndex(idx);
      } else {
        setNoticeMsg("No slots available for grading");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to fetch slots");
    }
  }, [authFetch]);

  useEffect(() => {
    fetchCurrentSlots();
  }, [fetchCurrentSlots]);

  const currentSlot = slots[currentIndex] || null;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < slots.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const openModal = (member) => {
    setSelectedMember(member);
    setGradeForm({
      grade: member.grade || "",
      bonus: member.bonus || "",
      penalty: member.penalty || "",
      comment: member.comment || ""
    });
    fetchHistory(member);
    setShowModal(true);
  };

  const fetchHistory = async (member) => {
    try {
      const res = await authFetch(`/gradeHistory/${currentSlot.signupID}/${member.userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  };

  const handleGradeChange = (field, value) => {
    setGradeForm(prev => ({ ...prev, [field]: value }));
  };

  const submitGrade = async () => {
    if (!gradeForm.comment.trim()) {
      setNoticeMsg("You must enter a comment");
      return;
    }

    try {
      const res = await authFetch("/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signupID: currentSlot.signupID,
          userId: selectedMember.userId,
          grade: Number(gradeForm.grade),
          bonus: Number(gradeForm.bonus),
          penalty: Number(gradeForm.penalty),
          comment: gradeForm.comment,
          gradedBy: user.email
        })
      });
      const data = await res.json();
      if (data.success) {
        setNoticeMsg("Grade saved successfully!");
        fetchCurrentSlots();
        setShowModal(false);
      } else {
        setNoticeMsg(data.error || "Failed to save grade");
      }
    } catch (err) {
      console.error(err);
      setNoticeMsg("Failed to save grade");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(Number(timestamp)).toLocaleString();
  };

  return (
    <div id="grade-form" className="form-style">
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />

      <h2>Grading</h2>
      {currentSlot ? (
        <div>
          <p>Slot Start Time: {formatTime(currentSlot.start)}</p>
          <button onClick={handlePrev} disabled={currentIndex === 0}>Prev Slot</button>
          <button onClick={handleNext} disabled={currentIndex === slots.length - 1}>Next Slot</button>

          <table>
            <thead>
              <tr>
                <th>Member Email</th>
                <th>Grade</th>
                <th>Bonus</th>
                <th>Penalty</th>
                <th>TA</th>
                <th>Graded Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentSlot.members.map(m => (
                <tr key={m.userId}>
                  <td>{m.email}</td>
                  <td>{m.grade ?? ""}</td>
                  <td>{m.bonus ?? ""}</td>
                  <td>{m.penalty ?? ""}</td>
                  <td>{m.gradedBy ?? ""}</td>
                  <td>{m.gradedTime ? formatTime(m.gradedTime) : ""}</td>
                  <td><button onClick={() => openModal(m)}>Grade</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No slot available</p>
      )}

      {showModal && selectedMember && (
        <div className="edit">
          <div className="edit-box">
            <h3>Grading {selectedMember.email}</h3>
            <label>
              Grade:
              <input
                type="number"
                value={gradeForm.grade}
                onChange={(e) => handleGradeChange("grade", e.target.value)}
              />
            </label>
            <label>
              Bonus:
              <input
                type="number"
                value={gradeForm.bonus}
                onChange={(e) => handleGradeChange("bonus", e.target.value)}
              />
            </label>
            <label>
              Penalty:
              <input
                type="number"
                value={gradeForm.penalty}
                onChange={(e) => handleGradeChange("penalty", e.target.value)}
              />
            </label>
            <label>
              Comment:
              <input
                type="text"
                value={gradeForm.comment}
                required
                onChange={(e) => handleGradeChange("comment", e.target.value)}
              />
            </label>

            <div className="edit-buttons">
              <button onClick={submitGrade}>Submit</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>

            <h3 className="grade-history">Grade History</h3>
            <ul>
              {history.map((h, idx) => (
                <li key={idx}>
                  {formatTime(h.gradedTime)}, {h.gradedBy}, Grade: {h.grade}, Bonus: {h.bonus}, Penalty: {h.penalty}, Comment: {h.comment}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeApp;