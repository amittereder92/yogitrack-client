import React, { useState, useEffect } from 'react';
import { instructorsAPI } from '../api';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', address: '',
    phone: '', email: '', preferredComm: 'email',
  });

  useEffect(() => { fetchInstructors(); }, []);

  async function fetchInstructors() {
    try {
      const res = await instructorsAPI.getAll();
      setInstructors(res.data.instructors);
    } catch {
      setError('Failed to load instructors.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ firstName: '', lastName: '', address: '', phone: '', email: '', preferredComm: 'email' });
    setShowModal(true);
  }

  function openEdit(inst) {
    setEditing(inst);
    setForm({
      firstName: inst.firstName, lastName: inst.lastName,
      address: inst.address || '', phone: inst.phone || '',
      email: inst.email || '', preferredComm: inst.preferredComm,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await instructorsAPI.update(editing.instructorId, form);
      } else {
        await instructorsAPI.create(form);
      }
      setShowModal(false);
      fetchInstructors();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Instructors</h1>
        <p>Manage your teaching team</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span>{instructors.length} instructor{instructors.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Instructor</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : instructors.length === 0 ? (
        <div className="empty-state">
          <h3>No instructors yet</h3>
          <p>Add your first instructor to get started.</p>
        </div>
      ) : (
        <div className="grid">
          {instructors.map(inst => (
            <div className="card" key={inst.instructorId}>
              <div className="card-id">{inst.instructorId}</div>
              <div className="card-title">{inst.firstName} {inst.lastName}</div>
              <div className="detail-row">
                <span className="detail-label">Comm</span>
                <span className={`badge ${inst.preferredComm === 'email' ? 'badge-sage' : 'badge-clay'}`}>
                  {inst.preferredComm}
                </span>
              </div>
              {inst.email && (
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span>{inst.email}</span>
                </div>
              )}
              {inst.phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span>{inst.phone}</span>
                </div>
              )}
              {inst.address && (
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span>{inst.address}</span>
                </div>
              )}
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => openEdit(inst)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Instructor' : 'Add Instructor'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Preferred Communication *</label>
                <select value={form.preferredComm} onChange={e => setForm({...form, preferredComm: e.target.value})}>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Instructor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
