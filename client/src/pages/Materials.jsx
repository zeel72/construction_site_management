import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

const Materials = () => {
  const { siteId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'cement',
    supplierId: '',
    quantity: '',
    unit: 'bags',
    totalAmount: '',
    invoiceNumber: '',
    receivedDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, [siteId]);

  const fetchMaterials = async () => {
    try {
      const res = await api.get(`/sites/${siteId}/materials`);
      setMaterials(res.data.data);
    } catch (error) {
      console.error('Failed to fetch materials', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.totalAmount) {
      return toast.error('Please fill in all required fields (Name, Quantity, Amount)');
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        totalAmount: Number(formData.totalAmount),
        ratePerUnit: Number((formData.totalAmount / formData.quantity).toFixed(2))
      };
      
      if (!payload.supplierId) {
        delete payload.supplierId;
      }

      if (editingId) {
        await api.put(`/sites/${siteId}/materials/${editingId}`, payload);
        toast.success('Material updated successfully');
      } else {
        await api.post(`/sites/${siteId}/materials`, payload);
        toast.success('Material added successfully');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', category: 'cement', supplierId: '', quantity: '', unit: 'bags', totalAmount: '', invoiceNumber: '', receivedDate: new Date().toISOString().split('T')[0] });
      fetchMaterials();
    } catch (error) {
      const msg = error.response?.data?.error || (editingId ? 'Failed to update material' : 'Failed to add material');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (mat) => {
    setFormData({
      name: mat.name,
      category: mat.category || 'cement',
      supplierId: mat.supplierId ? mat.supplierId._id || mat.supplierId : '',
      quantity: mat.quantity,
      unit: mat.unit || 'bags',
      totalAmount: mat.totalAmount,
      invoiceNumber: mat.invoiceNumber || '',
      receivedDate: new Date(mat.receivedDate).toISOString().split('T')[0]
    });
    setEditingId(mat._id);
    setIsModalOpen(true);
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material entry?')) return;
    try {
      await api.delete(`/sites/${siteId}/materials/${id}`);
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material', error);
      toast.error('Failed to delete material');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Material Inventory</h2>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', category: 'cement', supplierId: '', quantity: '', unit: 'bags', totalAmount: '', invoiceNumber: '', receivedDate: new Date().toISOString().split('T')[0] });
          setIsModalOpen(true);
        }}>Add Material</Button>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Supplier</th>
                <th style={{ padding: '1rem' }}>Qty</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Received On</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(mat => (
                <tr key={mat._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {mat.name}
                    {mat.invoiceNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Bill: {mat.invoiceNumber}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    <Badge variant="secondary">{mat.category || 'Other'}</Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>{mat.supplierName || (mat.supplierId && mat.supplierId.name) || 'Unknown'}</td>
                  <td style={{ padding: '1rem' }}>{mat.quantity} {mat.unit}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)' }}>{formatCurrency(mat.totalAmount)}</td>
                  <td style={{ padding: '1rem' }}>{new Date(mat.receivedDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(mat)}>Edit</Button>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteMaterial(mat._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No materials found for this site.
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
        title={editingId ? "Edit Material Entry" : "Add Direct Material Entry"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMaterial} isLoading={submitting}>
              {editingId ? "Save Changes" : "Save Entry"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input label="Material Name" id="name" value={formData.name} onChange={handleInputChange} required />
          
          <div className="grid-cols-2">
            <Input label="Category" id="category" type="select" value={formData.category} onChange={handleInputChange}>
              <option value="cement">Cement</option>
              <option value="steel">Steel/TMT</option>
              <option value="sand">Sand</option>
              <option value="aggregate">Aggregate</option>
              <option value="bricks">Bricks/Blocks</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="other">Other</option>
            </Input>
            <Input label="Supplier (Optional)" id="supplierId" type="select" value={formData.supplierId} onChange={handleInputChange}>
              <option value="">No Supplier (Cash/Direct)</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </Input>
          </div>

          <div className="grid-cols-2">
            <Input label="Quantity" id="quantity" type="number" min="0.1" step="0.1" value={formData.quantity} onChange={handleInputChange} required />
            <Input label="Unit" id="unit" type="select" value={formData.unit} onChange={handleInputChange}>
              <option value="bags">Bags</option>
              <option value="tons">Tons</option>
              <option value="kg">Kg</option>
              <option value="liters">Liters</option>
              <option value="pieces">Pieces</option>
              <option value="cft">Cft</option>
              <option value="sqft">Sq.Ft</option>
            </Input>
          </div>

          <div className="grid-cols-2">
            <Input label="Total Amount (₹)" id="totalAmount" type="number" min="1" value={formData.totalAmount} onChange={handleInputChange} required />
            <Input label="Invoice Number (Optional)" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} />
          </div>

          <Input label="Received Date" id="receivedDate" type="date" value={formData.receivedDate} onChange={handleInputChange} required />
        </form>
      </Modal>

    </div>
  );
};

export default Materials;
