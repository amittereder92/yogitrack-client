import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const links = [
  { path: '/', label: 'Home' },
  { path: '/instructors', label: 'Instructors' },
  { path: '/customers', label: 'Customers' },
  { path: '/classes', label: 'Classes' },
  { path: '/packages', label: 'Packages' },
  { path: '/sales', label: 'Sales' },
  { path: '/attendance', label: 'Attendance' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Yoga'Hom</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
