import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
    const [facultyData, setFacultyData] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [departmentName,setDepartmentName]= useState('');
    const [newFacultyName, setNewFacultyName] = useState('');
const [newFacultyDesignation, setNewFacultyDesignation] = useState('');
const [newFacultyLeaves, setNewFacultyLeaves] = useState('');
const [fromDateRange, setFromDateRange] = useState('');
const [toDateRange, setToDateRange] = useState('');
const [deleteFacultyName, setdeleteFacultyName] = useState('');


    const navigate = useNavigate();

    const url = 'http://localhost:3000';

    const designationPriority = {
        Professor: 1,
        "Associate Professor": 2,
        "Assistant Professor": 3,
        Clerk: 4,
        "Lab Technician": 5,
        "Lab Attendant": 6,
        Attendant: 7,
    };

    useEffect(() => {
        loadTableData();
        loadDepartmentName();
    }, []);
    const loadDepartmentName = async () => {
        setDepartmentName(await localStorage.getItem("departmentName"));
    }
    const loadTableData = async () => {
        try {
            const response = await fetch(`${url}/leave_mgmt/get-leaves`, {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();

            if (!Array.isArray(data)) {
                setError('Invalid data format received.');
                return;
            }

            data.sort((a, b) => {
                const designationComparison = designationPriority[a.designation] - designationPriority[b.designation];
                if (designationComparison === 0) {
                    return removePrefixes(a.faculty_name).localeCompare(removePrefixes(b.faculty_name));
                }
                return designationComparison;
            });

            setFacultyData(data);
            setError('');
        } catch (err) {
            setError(`Error fetching data: ${err.message}`);
        }
    };

    const removePrefixes = (name) => name.replace(/^(Er\.|Dr\.|Mr\.|Ms\.|Prof\.|S\.?)\s*/i, "").trim();

    const handleAddLeaveClick = (id) => {
        setExpandedRowId(expandedRowId === id ? null : id);
    };

    const handleDetailsClick = (id) => {
        navigate(`/leave-details/${id}`);
    };

    const handleUpdateLeaveClick = async (id, category, fromDate, toDate, option = {}) => {
        console.log(category);
        if (!category) {
            setError('Please select a leave category.');
            return;
        }
        
        if (category === 'granted_leaves') {
            if (!option || isNaN(option) || Number(option) <= 0) {
                setError('Please enter a valid number of granted leaves.');
                return;
            }
        } else {
            if (!fromDate) {
                setError('Please select From date.');
                return;
            }
        
            if (
                category !== 'short_leaves' &&
                category !== 'half_day_leaves' &&
                (!toDate || new Date(fromDate) > new Date(toDate))
            ) {
                setError('Invalid date range.');
                return;
            }
        }
    
        const leaveDates = category === 'short_leaves' || category === 'half_day_leaves'
            ? fromDate
            : [fromDate, toDate];
    
        const leave_categoryArr = category === 'granted_leaves' ? [category, option] : [category, option];
    
        try {
            const response = await fetch(`${url}/leave_mgmt/add-leave`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faculty_id: id,
                    leave_categoryArr,
                    leave_date: leaveDates,
                }),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                setSuccess('Leave added successfully!');
                setError('');
                setExpandedRowId(null);
                loadTableData();
            } else {
                throw new Error(result.error || 'Failed to add leave');
            }
        } catch (err) {
            setError(`Failed to update leave: ${err.message}`);
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
    const handleTodaysReportClick = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${url}/leave_mgmt/pdf/todays-report`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to fetch PDF');
            }
    
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (err) {
            console.error("Failed to fetch today's report:", err);
            alert(err.message);
        }
    };
    

    const handleSearchInputChange = async (e) => {
        setdeleteFacultyName(e.target.value.trim());
        const searchQuery = e.target.value.trim();
        if (!searchQuery) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(`${url}/leave_mgmt/faculty-suggestions?search=${searchQuery}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            setSuggestions(data);
        } catch (err) {
            console.error('Suggestion error:', err);
        }
    };
    const handleAddFaculty = async () => {
        if (!newFacultyName || !newFacultyDesignation || !newFacultyLeaves) {
            setError('Please fill all fields for adding faculty.');
            return;
        }
    
        try {
            const res = await fetch(`${url}/leave_mgmt/add-faculty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    faculty_name: newFacultyName,
                    designation: newFacultyDesignation,
                    granted_leaves: Number(newFacultyLeaves),
                }),
            });
    
            const result = await res.json();
            if (res.ok) {
                setSuccess('Faculty added successfully!');
                setError('');
                setNewFacultyName('');
                setNewFacultyDesignation('');
                setNewFacultyLeaves('');
                loadTableData(); // reload the table
            } else {
                throw new Error(result.error || 'Failed to add faculty.');
            }
        } catch (err) {
            setError(err.message);
        }
    };
    const handleSuggestionClick = (faculty) => {
        setSelectedFacultyId(faculty.id); // Set selected faculty ID
        setdeleteFacultyName(faculty.display); // Update input field with selected faculty name
        setSuggestions([]); // Clear the suggestions list
    };
    

    const handleFacultyDelete = async () => {
        if (!selectedFacultyId) return;
        if (!window.confirm('Delete this faculty and all records?')) return;

        try {
            const res = await fetch(`${url}/leave_mgmt/delete-faculty/${selectedFacultyId}`, {
                credentials: 'include',
                method: 'DELETE',
            });

            const result = await res.json();

            if (result.success) {
                alert('Faculty deleted successfully.');
                setSelectedFacultyId(null);
                loadTableData();
            } else {
                alert(result.error || 'Failed to delete faculty.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div>
            <header className="header">
                <div className="headLeft">
                    <img src="./public/images/logo.png" alt="Logo" />
                </div>
                <div className="headData">
                    <h1>Guru Nanak Dev Engineering College, Ludhiana</h1>
                    <h2 className="heading--department-name">Department of {departmentName}</h2>
                    <h3>Faculty Leave Management</h3>
                </div>
                <div className="headRight">
                    <button className="btn--todays-report" onClick={handleTodaysReportClick}>Today's Report</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main>
                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}

                <section id="data">
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Serial</th>
                                <th>Faculty Name</th>
                                <th>Designation</th>
                                <th>Short</th>
                                <th>Half Day</th>
                                <th>Casual</th>
                                <th>Academic</th>
                                <th>Medical</th>
                                <th>Compensatory</th>
                                <th>Earned</th>
                                <th>W/O Pay</th>
                                <th>Remaining</th>
                                <th>Granted</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facultyData.map((row, index) => {
                                const isExpanded = expandedRowId === row.id;
                                return (
                                    <React.Fragment key={row.id}>
                                        <tr>
                                            <td>{index + 1}</td>
                                            <td>{row.faculty_name}</td>
                                            <td>{row.designation}</td>
                                            <td>{row.short_leaves || 0}</td>
                                            <td>{row.half_day_leaves || 0}</td>
                                            <td>{row.casual_leaves || 0}</td>
                                            <td>{row.academic_leaves || 0}</td>
                                            <td>{row.medical_leaves || 0}</td>
                                            <td>{row.compensatory_leaves || 0}</td>
                                            <td>{row.earned_leaves || 0}</td>
                                            <td>{row.without_payment_leaves || 0}</td>
                                            <td>{row.remaining_leaves || 0}</td>
                                            <td>{row.granted_leaves || 0}</td>
                                            <td>{parseFloat(row.total_leaves).toFixed(2)}</td>
                                            <td>
                                                <button onClick={() => handleAddLeaveClick(row.id)}>Add Leave</button>
                                                <button onClick={() => handleDetailsClick(row.id)}>Details</button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="leave-options-row">
                                            <td colSpan="15">
                                              <div className="addLeaveOptions">
                                                <label>
                                                  Category:
                                                  <select
                                                    onChange={(e) => {
                                                      const updated = [...facultyData];
                                                      updated[index].selectedCategory = e.target.value;
                                                      setFacultyData(updated);
                                                    }}
                                                    value={row.selectedCategory || ''}
                                                  >
                                                    <option value="">Select</option>
                                                    <option value="short_leaves">Short</option>
                                                    <option value="half_day_leaves">Half Day</option>
                                                    <option value="casual_leaves">Casual</option>
                                                    <option value="academic_leaves">Academic</option>
                                                    <option value="medical_leaves">Medical</option>
                                                    <option value="compensatory_leaves">Compensatory</option>
                                                    <option value="earned_leaves">Earned</option>
                                                    <option value="without_payment_leaves">Without Pay</option>
                                                    <option value="granted_leaves">Granted</option>
                                                  </select>
                                                </label>
                                          
                                                {row.selectedCategory === 'granted_leaves' ? (
                                                  <label>
                                                    Add Leaves:
                                                    <input
                                                      type="number"
                                                      value={row.grantValue || ''}
                                                      onChange={(e) => {
                                                        const updated = [...facultyData];
                                                        updated[index].grantValue = e.target.value;
                                                        setFacultyData(updated);
                                                      }}
                                                    />
                                                  </label>
                                                ) : (
                                                  <>
                                                    <label>
                                                      From:
                                                      <input
                                                        type="date"
                                                        value={row.fromDate || ''}
                                                        onChange={(e) => {
                                                          const updated = [...facultyData];
                                                          updated[index].fromDate = e.target.value;
                                                          setFacultyData(updated);
                                                        }}
                                                      />
                                                    </label>
                                                    {!['short_leaves', 'half_day_leaves'].includes(row.selectedCategory) && (
                                                      <label>
                                                        To:
                                                        <input
                                                          type="date"
                                                          value={row.toDate || ''}
                                                          onChange={(e) => {
                                                            const updated = [...facultyData];
                                                            updated[index].toDate = e.target.value;
                                                            setFacultyData(updated);
                                                          }}
                                                        />
                                                      </label>
                                                    )}
                                                    {row.selectedCategory === 'short_leaves' && (
                                                      <>
                                                        <label>
                                                          From Time:
                                                          <input
                                                            type="time"
                                                            value={row.fromTime || ''}
                                                            onChange={(e) => {
                                                              const updated = [...facultyData];
                                                              updated[index].fromTime = e.target.value;
                                                              setFacultyData(updated);
                                                            }}
                                                          />
                                                        </label>
                                                        <label>
                                                          To Time:
                                                          <input
                                                            type="time"
                                                            value={row.toTime || ''}
                                                            onChange={(e) => {
                                                              const updated = [...facultyData];
                                                              updated[index].toTime = e.target.value;
                                                              setFacultyData(updated);
                                                            }}
                                                          />
                                                        </label>
                                                      </>
                                                    )}
                                                    {row.selectedCategory === 'half_day_leaves' && (
                                                      <label>
                                                        Type:
                                                        <select
                                                          value={row.halfDayType || ''}
                                                          onChange={(e) => {
                                                            const updated = [...facultyData];
                                                            updated[index].halfDayType = e.target.value;
                                                            setFacultyData(updated);
                                                          }}
                                                        >
                                                          <option value="">Select</option>
                                                          <option value="before_noon">Before Noon</option>
                                                          <option value="after_noon">After Noon</option>
                                                        </select>
                                                      </label>
                                                    )}
                                                  </>
                                                )}
                                          
                                                <button
                                                  onClick={() => {
                                                    const option =
                                                      row.selectedCategory === 'short_leaves'
                                                        ? { fromTime: row.fromTime, toTime: row.toTime }
                                                        : row.selectedCategory === 'half_day_leaves'
                                                        ? row.halfDayType
                                                        : row.selectedCategory === 'granted_leaves'
                                                        ? row.grantValue
                                                        : {};
                                          
                                                    handleUpdateLeaveClick(
                                                      row.id,
                                                      row.selectedCategory,
                                                      row.fromDate,
                                                      row.toDate,
                                                      option
                                                    );
                                                  }}
                                                >
                                                  Update
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                          
                                        
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </section>

                <section className="add-delete-generate">
  <div id="add_faculty">
    <div className="addFacultyData">
      <div id="userInputData">
        <input
          type="text"
          placeholder="Enter Faculty Name"
          value={newFacultyName}
          onChange={(e) => setNewFacultyName(e.target.value)}
        />
        <select
          value={newFacultyDesignation}
          onChange={(e) => setNewFacultyDesignation(e.target.value)}
        >
          <option value="" disabled>Select Designation</option>
          <option value="Professor">Professor</option>
          <option value="Associate Professor">Associate Professor</option>
          <option value="Assistant Professor">Assistant Professor</option>
          <option value="Clerk">Clerk</option>
          <option value="Lab Technician">Lab Technician</option>
          <option value="Lab Attendant">Lab Attendant</option>
          <option value="Attendant">Attendant</option>
        </select>
        <input
          type="number"
          placeholder="Enter Granted Leaves"
          value={newFacultyLeaves}
          onChange={(e) => setNewFacultyLeaves(e.target.value)}
        />
      </div>
      <button onClick={handleAddFaculty}>Add Faculty</button>
    </div>

    <div className="facultySearch-delete search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search faculty (e.g., John Doe (Professor))"
        value={deleteFacultyName}
        onChange={handleSearchInputChange}
      />
      <div className="suggestions">
        <ul>
          {suggestions.map((s) => (
            <li key={s.id} onClick={() => handleSuggestionClick(s)}>
              {s.display}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={handleFacultyDelete} disabled={!selectedFacultyId}>
        Delete
      </button>
    </div>
  </div>

  <div className="generateReport">
    <div className="date">
      <p className="select-range">Select Range :</p>
      <label className="insidelabel">From: </label>
      <input
        type="date"
        className="addleave-date from-date"
        value={fromDateRange}
        onChange={(e) => setFromDateRange(e.target.value)}
      />
      <label className="insidelabel">To:</label>
      <input
        type="date"
        className="addleave-date to-date"
        value={toDateRange}
        onChange={(e) => setToDateRange(e.target.value)}
      />
    </div>
    <button
      className="generate-report"
      onClick={async () => {
        if (!fromDateRange || !toDateRange) {
          alert('Please select both From and To dates.');
          return;
        }

        try {
          const res = await fetch(
            `${url}/leave_mgmt/pdf/all?fromDate=${fromDateRange}&toDate=${toDateRange}`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error);
          }
          const blob = await res.blob();
          const urlBlob = URL.createObjectURL(blob);
          window.open(urlBlob, '_blank');
        } catch (err) {
          alert(`Report generation failed: ${err.message}`);
        }
      }}
    >
      Generate Report
    </button>
  </div>
</section>

            </main>
        </div>
    );
};

export default Dashboard;
