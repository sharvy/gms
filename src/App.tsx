import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import Vehicles from "./components/Vehicles";
import Jobs from "./components/Jobs";
import Mechanics from "./components/Mechanics";
// import Parts from "./components/Parts";
import ServiceScheduling from "./components/ServiceScheduling";
import Services from "./components/Services";
function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/mechanics" element={<Mechanics />} />
            <Route path="/services" element={<Services />} />
            {/* <Route path="/parts" element={<Parts />} /> */}
            <Route path="/schedule" element={<ServiceScheduling />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
