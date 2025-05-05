import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard"; // new Dashboard
import LeaveDetails from './LeaveDetails';


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect to /login automatically */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leave-details/:facultyId" element={<LeaveDetails />} />

        
      </Routes>
    </Router>
  );
};

export default App;
