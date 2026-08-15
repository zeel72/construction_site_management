import React, { useState, useEffect } from 'react';
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

  // Modal State
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

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

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Supplier Name</th>
                <th style={{ padding: '1rem' }}>Contact</th>
                <th style={{ padding: '1rem' }}>GSTIN</th>
                <th style={{ padding: '1rem' }}>Total Billed</th>
                <th style={{ padding: '1rem' }}>Total Paid</th>
                <th style={{ padding: '1rem' }}>Balance Due</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {supplier.name}
                    {supplier.state && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{supplier.state}</div>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {supplier.contactPerson || 'N/A'}<br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supplier.phone}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{supplier.gstin || 'Unregistered'}</td>
                  <td style={{ padding: '1rem' }}>{formatCurrency(supplier.totalBilled || 0)}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)' }}>{formatCurrency(supplier.totalPaid || 0)}</td>
                  <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(supplier.balanceDue || 0)}</td>
                  <td style={{ padding: '1rem' }}>
                    <Badge variant={supplier.isActive ? 'success' : 'secondary'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(supplier)}>Edit</Button>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteSupplier(supplier._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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

    </div>
  );
};

export default Suppliers;
