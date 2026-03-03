import React, { useState, useEffect } from 'react';
import { attendanceAPI, instructorsAPI } from '../api';

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customerInput, setCustomerInput] = useState('');
  const [form, setForm] = useState({
    instructorId: '', classId: '', occurredAt: '',
    customerIds: [], allowNegative: false,
  });

  useEffect(() => {
  Promise.all([fetchAttendances(), fetchInstructors()]).finally(() => setLoading(false));
  }, []);

async function fetchAttendances() {
  try { const res = await attendanceAPI.getAll(); setAttendances(res.data.attendances); } catch {}
  }

async function fetchInstructors() {
  try { const res = await instructorsAPI.getAll(); setInstructors(res.data); } catch {}
  }

  async function handleInstructorChange(instructorId) {
    setForm(f => ({ ...f, instructorId, classId: '' }));
    setClasses([]);
    if (!instructorId) return;
    try {
      const res = await attendanceAPI.getClassesByInstructor(instructorId);
      setClasses(res.data);
    } catch (err) { setClasses([]); }
  }

  function addCustomer() {
    const id = customerInput.trim();
    if (id && !form.customerIds.includes(id)) {
      setForm(f => ({ ...f, customerIds: [...f.customerIds, id] }));
    }
    setCustomerInput('');
  }

  function removeCustomer(id) {
    setForm(f => ({ ...f, customerIds: f.customerIds.filter(c => c !== id) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await attendanceAPI.create(form);
      setSuccess(`Attendance recorded! ${res.data.updatedCustomers?.length || 0} student(s) checked in.`);
      if (res.data.warning) setError(res.data.warning);
      setShowModal(false);
      fetchAttendances();
    } catch (err) {
      const data = err.response?.data;
      if (data?.negativeBalanceCustomers) {
        setError(`${data.error} Re-submit with "Allow Negative Balance" checked.`);
      } else {
        setError(data?.error || 'Something went wrong.');
      }
    }
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Check in students to classes</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="toolbar">
        <span>{attendances.length} record{attendances.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={() => { setError(''); setSuccess(''); setShowModal(true); }}>+ Record Attendance</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : attendances.length === 0 ? (
        <div className="empty-state">
          <h3>No attendance records</h3>
          <p>Record your first class attendance.</p>
        </div>
      ) : (
        <div className="grid">
          {attendances.map(a => (
            <div className="card" key={a.attendanceId}>
              <div className="card-id">{a.attendanceId}</div>
              <div className="card-title">{new Date(a.occurredAt).toLocaleDateString()} at {new Date(a.occurredAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              <div className="detail-row">
                <span className="detail-label">Class</span>
                <span>{a.classId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Instructor</span>
                <span>{a.instructorId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Students</span>
                <span className="badge badge-sage">{a.customerIds?.length || 0}</span>
              </div>
              {a.warning && (
                <div className="detail-row">
                  <span style={{fontSize:'0.8rem', color:'var(--clay)'}}>{a.warning}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Record Attendance</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Instructor *</label>
                <select required value={form.instructorId} onChange={e => handleInstructorChange(e.target.value)}>
                  <option value="">Select instructor...</option>
                  {instructors.map(i => <option key={i.instructorId} value={i.instructorId}>{i.firstName} {i.lastName} ({i.instructorId})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Class *</label>
                <select required value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} disabled={!classes.length}>
                  <option value="">{classes.length ? 'Select class...' : 'Select instructor first'}</option>
                  {classes.map(c => <option key={c.classId} value={c.classId}>{DAYS[c.dayOfWeek]} {c.timeHHmm} — {c.classType} ({c.classId})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input required type="datetime-local" value={form.occurredAt} onChange={e => setForm({...form, occurredAt: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Add Customer IDs</label>
                <div style={{display:'flex', gap:'0.5rem'}}>
                  <input value={customerInput} onChange={e => setCustomerInput(e.target.value)} placeholder="e.g. C00001" onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addCustomer(); }}} />
                  <button type="button" className="btn btn-secondary" onClick={addCustomer}>Add</button>
                </div>
                {form.customerIds.length > 0 && (
                  <div style={{display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.6rem'}}>
                    {form.customerIds.map(id => (
                      <span key={id} className="badge badge-sage" style={{cursor:'pointer'}} onClick={() => removeCustomer(id)}>
                        {id} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem', flexDirection:'row', textTransform:'none', fontSize:'0.9rem'}}>
                  <input type="checkbox" checked={form.allowNegative} onChange={e => setForm({...form, allowNegative: e.target.checked})} style={{width:'auto'}} />
                  Allow negative class balance
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
