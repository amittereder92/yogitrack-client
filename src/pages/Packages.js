import React, { useState, useEffect } from 'react';
import { packagesAPI } from '../api';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    packageName: '', packageCategory: 'General', numberOfClasses: '1',
    classType: 'General', startDate: '', endDate: '', price: '',
  });

  useEffect(() => { fetchPackages(); }, []);

  async function fetchPackages() {
    try {
      const res = await packagesAPI.getAll();
      setPackages(res.data.packages);
    } catch { setError('Failed to load packages.'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await packagesAPI.create({ ...form, price: Number(form.price) });
      setShowModal(false);
      setForm({ packageName: '', packageCategory: 'General', numberOfClasses: '1', classType: 'General', startDate: '', endDate: '', price: '' });
      fetchPackages();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Packages</h1>
        <p>Create class packages & pricing</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <span>{packages.length} package{packages.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Package</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <h3>No packages yet</h3>
          <p>Create your first class package.</p>
        </div>
      ) : (
        <div className="grid">
          {packages.map(p => (
            <div className="card" key={p.packageId}>
              <div className="card-id">{p.packageId}</div>
              <div className="card-title">{p.packageName}</div>
              <div className="detail-row">
                <span className="detail-label">Price</span>
                <span style={{fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem'}}>${p.price}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Classes</span>
                <span className="badge badge-sage">{p.numberOfClasses}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category</span>
                <span className={`badge ${p.packageCategory === 'General' ? 'badge-stone' : 'badge-clay'}`}>{p.packageCategory}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span>{p.classType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Valid</span>
                <span>{new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Package</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Package Name *</label>
                <input required value={form.packageName} onChange={e => setForm({...form, packageName: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.packageCategory} onChange={e => setForm({...form, packageCategory: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Class Type *</label>
                  <select value={form.classType} onChange={e => setForm({...form, classType: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Classes *</label>
                  <select value={form.numberOfClasses} onChange={e => setForm({...form, numberOfClasses: e.target.value})}>
                    <option value="1">1</option>
                    <option value="4">4</option>
                    <option value="10">10</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
