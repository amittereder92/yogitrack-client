import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  { path: '/instructors', icon: '🧘', label: 'Instructors', desc: 'Manage your teaching team' },
  { path: '/customers', icon: '👤', label: 'Customers', desc: 'Track your student community' },
  { path: '/classes', icon: '📅', label: 'Classes', desc: 'Schedule and publish classes' },
  { path: '/packages', icon: '📦', label: 'Packages', desc: 'Create class packages & pricing' },
  { path: '/sales', icon: '💳', label: 'Sales', desc: 'Record and view transactions' },
  { path: '/attendance', icon: '✅', label: 'Attendance', desc: 'Check in students to classes' },
];

export default function Home() {
  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Studio Management</p>
          <h1 className="hero-title">Welcome to<br /><em>Yoga'Hom</em></h1>
          <p className="hero-subtitle">
            A calm, centered space to manage your studio — instructors, classes, customers, and more.
          </p>
        </div>
        <div className="hero-decoration">
          <div className="circle circle-1" />
          <div className="circle circle-2" />
          <span className="hero-icon">🌿</span>
        </div>
      </div>

      <div className="features-section">
        <div className="page">
          <p className="section-label">Quick Access</p>
          <div className="features-grid">
            {features.map(f => (
              <Link to={f.path} key={f.path} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <h3 className="feature-label">{f.label}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
