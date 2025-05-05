import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Assuming React Router
import './leaveDetails.css';

const LeaveDetails = () => {
  const { facultyId } = useParams(); // Assumes route like /leave-details/:facultyId
  const navigate = useNavigate();

  const [faculty, setFaculty] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const url = 'http://localhost:3000';


  useEffect(() => {
    const today = new Date();
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(today.getDate() - 35);
    setFromDate(thirtyFiveDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (facultyId) {
      loadLeaveDetails();
    }
  }, [facultyId]);

  const loadLeaveDetails = async () => {
    try {
      const response = await fetch(`${url}/leave_mgmt/leave-details-data/${facultyId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (!data.faculty || !data.leaves) {
        throw new Error('Invalid data received from the server.');
      }

      setFaculty(data.faculty);
      setLeaves(data.leaves);
    } catch (err) {
      console.error('Error loading leave details:', err);
      alert('Failed to load leave details. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
        const response = await fetch(`${url}/leave_mgmt/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);
        navigate("/login");
    } catch (err) {
        alert('Logout failed. Please try again.');
    }
};

  const generatePDF = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${url}/leave_mgmt/pdf?facultyId=${facultyId}&fromDate=${fromDate}&toDate=${toDate}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });


      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leaveId) => {
    const confirmed = window.confirm('This action will permanently delete the leave.');
    if (!confirmed) return;

    try {
      const res = await fetch(`${url}/leave_mgmt/delete-leave/${leaveId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete leave record');
      alert('Leave record deleted successfully!');
      loadLeaveDetails(); // Reload to update UI
    } catch (err) {
      console.error('Error deleting leave:', err);
      alert('Failed to delete leave. Please try again.');
    }
  };

  const formatCategory = (leave) => {
    let category = leave.leave_category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\bCasual Leaves\b/i, 'Full Day Leave')
      .replace(/\bMedical Leaves\b/i, 'Medical/Maternity Leave');

    if (leave.short_leave_from || leave.half_leave_type) {
      const detail = leave.half_leave_type
        ? leave.half_leave_type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
        : `${leave.short_leave_from} to ${leave.short_leave_to}`;
      category += ` (${detail})`;
    }

    return category;
  };

  return (
    <div className="leaveDetailsContainer">
      <div className="leaveHeader">
        <div className="leaveHeadleft">
          <img src="/images/logo.png" alt="College Logo" />
        </div>
        <div className="leaveHeadData">
          <h2>
            Leave Details for <span>{faculty.faculty_name}</span> (<span>{faculty.designation}</span>)
          </h2>
        </div>
        <div className="leaveHeadRight">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {loading && (
        <div className="message-box">
          <p className="message">Loading PDF...</p>
        </div>
      )}

      <div className="generatingReport">
        <div className="date">
          <p className="select-range">Select Range :</p>
          <label className="insidelabel">From:</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <label className="insidelabel">To:</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div>
          <button id="report" onClick={generatePDF}>
            Generate Report
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Leave Category</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>
                No leave records found
              </td>
            </tr>
          ) : (
            leaves.map((leave) => (
              <tr key={leave.id}>
                <td>{formatCategory(leave)}</td>
                <td>{leave.formatted_date}</td>
                <td>
                  <button className="btn--delete-leave" onClick={() => handleDelete(leave.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 className="total">
        Total Leaves: <span>{faculty.total_leaves || 0}</span>
      </h3>
      <a className="back-btn" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </a>

    </div>
  );
};

export default LeaveDetails;
