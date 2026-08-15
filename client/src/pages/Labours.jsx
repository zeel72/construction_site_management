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

const Labours = () => {
  const { siteId } = useParams();
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skill: 'helper',
    dailyWage: ''
  });

  useEffect(() => {
    fetchLabours();
  }, [siteId]);

  const fetchLabours = async () => {
    try {
      const res = await api.get(`/sites/${siteId}/labours`);
      setLabours(res.data.data);
    } catch (error) {
      console.error('Failed to fetch labours', error);
      toast.error('Failed to fetch labours');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddLabour = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dailyWage) {
      return toast.error('Name and Daily Wage are required');
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        skill: formData.skill,
        dailyWage: Number(formData.dailyWage)
      };
      
      if (formData.phone.trim() !== '') {
        payload.phone = formData.phone.trim();
      }

      if (editingId) {
        await api.put(`/sites/${siteId}/labours/${editingId}`, payload);
        toast.success('Labour updated successfully');
      } else {
        await api.post(`/sites/${siteId}/labours`, payload);
        toast.success('Labour added successfully');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', skill: 'helper', dailyWage: '' });
      fetchLabours();
    } catch (error) {
      const msg = error.response?.data?.error || (editingId ? 'Failed to update labour' : 'Failed to add labour');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (labour) => {
    setFormData({
      name: labour.name,
      phone: labour.phone || '',
      skill: labour.skill || 'helper',
      dailyWage: labour.dailyWage
    });
    setEditingId(labour._id);
    setIsModalOpen(true);
  };

  const handleDeleteLabour = async (id) => {
    if (!window.confirm('Are you sure you want to delete this labourer?')) return;
    try {
      await api.delete(`/sites/${siteId}/labours/${id}`);
      toast.success('Labour deleted successfully');
      fetchLabours();
    } catch (error) {
      console.error('Failed to delete labour', error);
      toast.error('Failed to delete labour');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Labour Management</h2>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', phone: '', skill: 'helper', dailyWage: '' });
          setIsModalOpen(true);
        }}>Add Labour</Button>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Skill</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Daily Wage</th>
                <th style={{ padding: '1rem' }}>Total Earned</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {labours.map(labour => (
                <tr key={labour._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{labour.name}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{labour.skill || 'Helper'}</td>
                  <td style={{ padding: '1rem' }}>{labour.phone || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>{formatCurrency(labour.dailyWage)}</td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--success)' }}>
                    {formatCurrency(labour.totalEarned || 0)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Badge variant={labour.isActive ? 'success' : 'secondary'}>
                      {labour.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(labour)}>Edit</Button>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteLabour(labour._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {labours.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No labours found for this site.
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
        title={editingId ? "Edit Labour" : "Add New Labour"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLabour} isLoading={submitting}>
              {editingId ? "Save Changes" : "Save Labour"}
            </Button>
          </>
        }
      >
        <form id="add-labour-form" onSubmit={handleAddLabour} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input label="Full Name" id="name" value={formData.name} onChange={handleInputChange} required />
          <Input label="Phone Number" id="phone" value={formData.phone} onChange={handleInputChange} />
          
          <div className="grid-cols-2">
            <Input label="Skill" id="skill" type="select" value={formData.skill} onChange={handleInputChange}>
              <option value="helper">Helper</option>
              <option value="mason">Mason</option>
              <option value="carpenter">Carpenter</option>
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="painter">Painter</option>
              <option value="other">Other</option>
            </Input>
            <Input label="Daily Wage (₹)" id="dailyWage" type="number" min="0" value={formData.dailyWage} onChange={handleInputChange} required />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Labours;
