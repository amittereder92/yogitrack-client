import React, { useState, useEffect } from 'react';
import { salesAPI, customersAPI, packagesAPI } from '../api';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerId: '', packageId: '', amountPaid: '',
    paymentMode: 'cash', paidAt: '', validityStart: '', validityEnd: '',
  });

  useEffect(() => {
    Promise.all([fetchSales(), fetchCustomers(), fetchPackages()]).finally(() => setLoading(false));
  }, []);

  async function fetchSales() {
  try { const res = await salesAPI.getAll(); setSales(res.data.sales); } catch {}
  }
  async function fetchCustomers() {
    try { const res = await customersAPI.getAll(); setCustomers(res.data); } catch {}
  }
  async function fetchPackages() {
    try { const res = await packagesAPI.getAll(); setPackages(res.data); } catch {}
  }

  function handlePackageChange(packageId) {
    const pkg = packages.find(p => p.packageId === packageId);
    setForm(f => ({ ...f, packageId, amountPaid: pkg ? String(pkg.price) : '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await salesAPI.create({ ...form, amountPaid: Number(form.amountPaid) });
      setSuccess(`Sale recorded! New class balance: ${res.data.newClassBalance}`);
      setShowModal(false);
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sales</h1>
        <p>Record and view transactions</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="toolbar">
        <span>{sales.length} sale{sales.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={() => { setError(''); setSuccess(''); setShowModal(true); }}>+ Record Sale</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="empty-state">
          <h3>No sales yet</h3>
          <p>Record your first sale to get started.</p>
        </div>
      ) : (
        <div className="grid">
          {sales.map(s => (
            <div className="card" key={s.saleId}>
              <div className="card-id">{s.saleId}</div>
              <div className="card-title" style={{fontFamily:'Cormorant Garamond, serif', fontSize:'1.5rem'}}>${s.amountPaid}</div>
              <div className="detail-row">
                <span className="detail-label">Customer</span>
                <span>{s.customerId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Package</span>
                <span>{s.packageId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment</span>
                <span className="badge badge-sage">{s.paymentMode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span>{new Date(s.paidAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Valid</span>
                <span>{new Date(s.validityStart).toLocaleDateString()} – {new Date(s.validityEnd).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Record Sale</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer *</label>
                <select required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.firstName} {c.lastName} ({c.customerId})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Package *</label>
                <select required value={form.packageId} onChange={e => handlePackageChange(e.target.value)}>
                  <option value="">Select package...</option>
                  {packages.map(p => <option key={p.packageId} value={p.packageId}>{p.packageName} — ${p.price} ({p.packageId})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount Paid ($) *</label>
                  <input required type="number" min="0" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Payment Mode *</label>
                  <select value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Payment Date *</label>
                <input required type="datetime-local" value={form.paidAt} onChange={e => setForm({...form, paidAt: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Validity Start *</label>
                  <input required type="date" value={form.validityStart} onChange={e => setForm({...form, validityStart: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Validity End *</label>
                  <input required type="date" value={form.validityEnd} onChange={e => setForm({...form, validityEnd: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
