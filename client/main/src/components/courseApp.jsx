import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import Notice from "./noticeBox.jsx";
import useConfirm from "../utils/useConfirm.js";
import { useNavigate } from "react-router-dom";

const CourseApp = () => {
  const { authFetch } = useAuth();
  const [courseList, setCourseList] = useState([]);
  const [formData, setFormData] = useState({
    termCode: '',
    courseName: '',
    section: '1'
  });
  const [noticeMsg, setNoticeMsg] = useState("");
  const { confirm, ConfirmComponent } = useConfirm();
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const getCourses = useCallback(() => {
    authFetch('/courses')
      .then(res => res.json())
      .then(data => {
        setCourseList(data);
      })
      .catch(error => {
        console.error('Failed to load the course list:', error);
      });
    }, [authFetch]);

  useEffect(() => {
    getCourses();
  }, [getCourses]);


  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const addCourse = (e) => {
    e.preventDefault();

    if (!formData.termCode || !formData.courseName) {
      setNoticeMsg("Term code and course name in course are required!");
      return;
    }

    const data = {
      termCode: formData.termCode,
      courseName: formData.courseName,
      section: formData.section
    };

    authFetch("/addCourse", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Success:', data);
          setNoticeMsg("Submit successfully!");
          getCourses();
          setFormData({
            termCode: '',
            courseName: '',
            section: '1'
          });
        } else {
          setNoticeMsg(data.error);
        }
      })
      .catch(error => {
        console.error('Fail:', error);
        setNoticeMsg("Fail to submit, please try again");
      });
  };

  const editCourse = (courseId, updatedData) => {
    authFetch(`/courses/${courseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        setNoticeMsg("Update failed: " + data.error);
      } else {
        setNoticeMsg(data.message || "Updated successfully!");
        getCourses();
      }
    })
    .catch(err => setNoticeMsg("Update failed: " + err.message));
  };

  const deleteCourse = (courseId) => {
    authFetch(`/deleteCourse/${courseId}`, { method: "DELETE" })
      .then(async (res) => {
      const data = await res.json();

      if (!data.success) {
        setNoticeMsg("Delete failed: " + (data.error || "Unknown error"));
      } else {
        setNoticeMsg("Deleted successfully!");
        getCourses();
      }
      return data;
    })
    .catch(err => {
      if (!err.message) return;
      setNoticeMsg(err.message);
    });
  };

  return (
    <div>
      <Notice message={noticeMsg} onClose={() => setNoticeMsg("")} />
      {ConfirmComponent}
      <form id="course-form" onSubmit={addCourse}>
        <p>Add a course</p>
        <div className="forms-style">
          <label htmlFor="termCode">Term code</label>
          <input
            type="number"
            id="termCode"
            value={formData.termCode}
            onChange={handleInputChange}
            min="1"
            max="9999"
            required
          />

          <label htmlFor="courseName">Course name</label>
          <input
            type="text"
            id="courseName"
            value={formData.courseName}
            onChange={handleInputChange}
            maxLength="100"
            required
          />

          <label htmlFor="section">Section</label>
          <input
            type="number"
            id="section"
            value={formData.section}
            onChange={handleInputChange}
            min="1"
            max="99"
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      <p>Course list</p>
      <table>
        <thead>
          <tr>
            <th>Term Code</th>
            <th>Course Name</th>
            <th>Section</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courseList.map((course) => (
            <tr key={course.courseId}>
              <td>{course.termCode}</td>
              <td>{course.courseName}</td>
              <td>{course.section}</td>
              <td>
                <button onClick={() => navigate("/members", { state: course})}>
                  Show member
                </button>
                <button onClick={() => navigate("/signup", { state: course})}>
                  Add sign-up
                </button>
                <button onClick={() => {
                  setEditingCourse(course); 
                  setShowEditModal(true);
                }}>
                  Edit
                </button>
                <button onClick={ async () => {
                  const ok = await confirm('Are you sure to delete the course?')
                  if (ok) {
                    deleteCourse(course.courseId);
                  }
                }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showEditModal && editingCourse && (
        <div className="edit">
          <div className="edit-box">

            <h2>Edit Course</h2>

            <label>
              Course Name
              <input
                type="text"
                value={editingCourse.courseName}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    courseName: e.target.value
                  })
                }
              />
            </label>

            <label>
              Term Code
              <input
                type="text"
                value={editingCourse.termCode}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    termCode: e.target.value
                  })
                }
              />
            </label>

            <label>
              Section
              <input
                type="text"
                value={editingCourse.section}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    section: e.target.value
                  })
                }
              />
            </label>

            <div className="edit-buttons">
              <button
                onClick={() => {
                  editCourse(editingCourse.courseId, editingCourse);
                  setShowEditModal(false);
                }}
              >
                Confirm
              </button>

              <button onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CourseApp;