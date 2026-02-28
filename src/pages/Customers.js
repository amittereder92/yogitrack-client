import React, { useState, useEffect } from 'react';
import { customersAPI } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', address: '',
    phone: '', email: '', preferredComm: 'email',
  });

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    try {
      const res = await customersAPI.getAll();
      setCustomers(res.data.customers);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({ firstName: '', lastName: '', address: '', phone: '', email: '', preferredComm: 'email' });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      firstName: c.firstName, lastName: c.lastName,
      address: c.address || '', phone: c.phone || '',
      email: c.email || '', preferredComm: c.preferredComm,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await customersAPI.update(editing.customerId, form);
      } else {
        await customersAPI.create(form);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Customers</h1>
        <p>Track your student community</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span>{customers.length} customer{customers.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <h3>No customers yet</h3>
          <p>Add your first student to get started.</p>
        </div>
      ) : (
        <div className="grid">
          {customers.map(c => (
            <div className="card" key={c.customerId}>
              <div className="card-id">{c.customerId}</div>
              <div className="card-title">{c.firstName} {c.lastName}</div>
              <div className="detail-row">
                <span className="detail-label">Balance</span>
                <span className={`badge ${c.classBalance > 0 ? 'badge-sage' : c.classBalance === 0 ? 'badge-stone' : 'badge-clay'}`}>
                  {c.classBalance} classes
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Comm</span>
                <span className={`badge ${c.preferredComm === 'email' ? 'badge-sage' : 'badge-clay'}`}>
                  {c.preferredComm}
                </span>
              </div>
              {c.email && (
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span>{c.email}</span>
                </div>
              )}
              {c.phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span>{c.phone}</span>
                </div>
              )}
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => openEdit(c)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2>
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
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
