import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Instructors from './pages/Instructors';
import Customers from './pages/Customers';
import Classes from './pages/Classes';
import Packages from './pages/Packages';
import Sales from './pages/Sales';
import Attendance from './pages/Attendance';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
