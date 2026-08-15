import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Add/Edit Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    state: ''
  });

  // Quick Transaction Modal
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnSubmitting, setTxnSubmitting] = useState(false);
  const [txnSupplierId, setTxnSupplierId] = useState(null);
  const [txnSupplierName, setTxnSupplierName] = useState('');
  const [txnData, setTxnData] = useState({
    type: 'billed',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.state) {
      return toast.error('Company Name, Phone, and State are required');
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier added successfully');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', state: '' });
      fetchSuppliers();
    } catch (error) {
      const msg = error.response?.data?.error || (editingId ? 'Failed to update supplier' : 'Failed to add supplier');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      address: supplier.address || '',
      state: supplier.state || ''
    });
    setEditingId(supplier._id);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier', error);
      toast.error('Failed to delete supplier');
    }
  };

  // Quick Transaction Handlers
  const openTxnModal = (supplier, type) => {
    setTxnSupplierId(supplier._id);
    setTxnSupplierName(supplier.name);
    setTxnData({ type, amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    setIsTxnModalOpen(true);
  };

  const handleTxnInputChange = (e) => {
    setTxnData({ ...txnData, [e.target.id]: e.target.value });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txnData.amount || txnData.amount <= 0) return toast.error('Enter a valid amount');

    setTxnSubmitting(true);
    try {
      await api.post(`/suppliers/${txnSupplierId}/transactions`, txnData);
      toast.success(txnData.type === 'billed' ? 'Bill recorded' : 'Payment recorded');
      setIsTxnModalOpen(false);
      fetchSuppliers(); // Refresh to update totals
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add transaction');
    } finally {
      setTxnSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  // Calculate summary
  const totalBilled = suppliers.reduce((sum, s) => sum + (s.totalBilled || 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalDue = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Material Suppliers</h2>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', state: '' });
          setIsModalOpen(true);
        }}>Add Supplier</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Billed</p>
          <h2 style={{ color: 'var(--text-main)' }}>{formatCurrency(totalBilled)}</h2>
        </Card>
        <Card style={{ borderTop: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Paid</p>
          <h2 style={{ color: 'var(--success)' }}>{formatCurrency(totalPaid)}</h2>
        </Card>
        <Card style={{ borderTop: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Balance Due</p>
          <h2 style={{ color: 'var(--danger)' }}>{formatCurrency(totalDue)}</h2>
        </Card>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Supplier Name</th>
                <th style={{ padding: '1rem' }}>Contact</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Billed</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Paid</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Balance Due</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td 
                    style={{ padding: '1rem', fontWeight: '500', cursor: 'pointer' }}
                    onClick={() => navigate(`/suppliers/${supplier._id}`)}
                  >
                    <span style={{ color: 'var(--primary-color)' }}>{supplier.name}</span>
                    {supplier.state && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{supplier.state}</div>}
                    {supplier.gstin && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {supplier.gstin}</div>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {supplier.phone}
                    {supplier.contactPerson && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{supplier.contactPerson}</div>}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(supplier.totalBilled || 0)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(supplier.totalPaid || 0)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(supplier.balanceDue || 0)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)', fontSize: '0.75rem' }} onClick={() => openTxnModal(supplier, 'billed')}>+ Bill</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--success)', fontSize: '0.75rem' }} onClick={() => openTxnModal(supplier, 'paid')}>+ Pay</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(supplier)}>Edit</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteSupplier(supplier._id)}>Del</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Supplier" : "Add New Supplier"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier} isLoading={submitting}>
              {editingId ? "Save Changes" : "Save Supplier"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input label="Company/Supplier Name" id="name" value={formData.name} onChange={handleInputChange} required />
          
          <div className="grid-cols-2">
            <Input label="Contact Person" id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
            <Input label="Phone Number" id="phone" value={formData.phone} onChange={handleInputChange} required />
          </div>

          <div className="grid-cols-2">
            <Input label="Email (Optional)" id="email" type="email" value={formData.email} onChange={handleInputChange} />
            <Input label="GSTIN (Optional)" id="gstin" value={formData.gstin} onChange={handleInputChange} />
          </div>

          <Input label="Address" id="address" value={formData.address} onChange={handleInputChange} />
          <Input label="State (Required for GST Calc)" id="state" value={formData.state} onChange={handleInputChange} placeholder="e.g. Maharashtra" required />
        </form>
      </Modal>

      {/* Quick Transaction Modal */}
      <Modal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        title={`${txnData.type === 'billed' ? '📄 Record Bill' : '💰 Record Payment'} — ${txnSupplierName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTxnModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddTransaction} 
              isLoading={txnSubmitting}
              style={{ backgroundColor: txnData.type === 'billed' ? 'var(--primary-color)' : 'var(--success)', borderColor: txnData.type === 'billed' ? 'var(--primary-color)' : 'var(--success)' }}
            >
              {txnData.type === 'billed' ? 'Save Bill' : 'Save Payment'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input 
            label="Amount (₹)" 
            id="amount" 
            type="number" 
            min="1" 
            value={txnData.amount} 
            onChange={handleTxnInputChange} 
            required 
          />
          <Input label="Date" id="date" type="date" value={txnData.date} onChange={handleTxnInputChange} required />
          <Input label="Description / Invoice No. (Optional)" id="description" value={txnData.description} onChange={handleTxnInputChange} />
        </form>
      </Modal>

    </div>
  );
};

export default Suppliers;
