import React, { useState, useEffect } from 'react';
import { classesAPI, instructorsAPI } from '../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    instructorId: '', dayOfWeek: '1', timeHHmm: '09:00',
    classType: 'General', payRate: '', isPublished: false,
  });

  useEffect(() => {
    Promise.all([fetchClasses(), fetchInstructors()]).finally(() => setLoading(false));
  }, []);

  async function fetchClasses() {
    try {
      const res = await classesAPI.getAll();
      setClasses(res.data.classes);
    } catch { setError('Failed to load classes.'); }
  }

  async function fetchInstructors() {
    try {
      const res = await instructorsAPI.getAll();
      setInstructors(res.data.instructors);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await classesAPI.create({ ...form, dayOfWeek: Number(form.dayOfWeek), payRate: Number(form.payRate) });
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Class Schedule</h1>
        <p>Manage your weekly classes</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span>{classes.length} class{classes.length !== 1 ? 'es' : ''}</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Class</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <h3>No classes scheduled</h3>
          <p>Add your first class to the schedule.</p>
        </div>
      ) : (
        <div className="grid">
          {classes.map(c => (
            <div className="card" key={c.classId}>
              <div className="card-id">{c.classId}</div>
              <div className="card-title">{DAYS[c.dayOfWeek]} at {c.timeHHmm}</div>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className={`badge ${c.classType === 'General' ? 'badge-sage' : 'badge-clay'}`}>{c.classType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`badge ${c.isPublished ? 'badge-sage' : 'badge-stone'}`}>
                  {c.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Instructor</span>
                <span>{c.instructorId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pay Rate</span>
                <span>${c.payRate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Class</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Instructor *</label>
                <select required value={form.instructorId} onChange={e => setForm({...form, instructorId: e.target.value})}>
                  <option value="">Select instructor...</option>
                  {instructors.map(i => (
                    <option key={i.instructorId} value={i.instructorId}>
                      {i.firstName} {i.lastName} ({i.instructorId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Day of Week *</label>
                  <select value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: e.target.value})}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input type="time" value={form.timeHHmm} onChange={e => setForm({...form, timeHHmm: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class Type *</label>
                  <select value={form.classType} onChange={e => setForm({...form, classType: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pay Rate ($) *</label>
                  <input required type="number" min="0" value={form.payRate} onChange={e => setForm({...form, payRate: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem', flexDirection:'row', textTransform:'none', fontSize:'0.9rem'}}>
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} style={{width:'auto'}} />
                  Publish this class (visible for attendance)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
