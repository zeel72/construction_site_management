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
  
  // Add/Edit Labour Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skill: 'helper',
    dailyWage: ''
  });

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payLabourId, setPayLabourId] = useState(null);
  const [payLabourName, setPayLabourName] = useState('');
  const [payData, setPayData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    notes: ''
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

  // Payment Handlers
  const openPayModal = (labour) => {
    setPayLabourId(labour._id);
    setPayLabourName(labour.name);
    setPayData({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', notes: '' });
    setIsPayModalOpen(true);
  };

  const handlePayInputChange = (e) => {
    setPayData({ ...payData, [e.target.id]: e.target.value });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payData.amount || payData.amount <= 0) return toast.error('Enter a valid amount');

    setPaySubmitting(true);
    try {
      await api.post(`/sites/${siteId}/payments`, {
        type: 'labour',
        referenceId: payLabourId,
        referenceName: payLabourName,
        amount: Number(payData.amount),
        paymentDate: payData.paymentDate,
        paymentMode: payData.paymentMode,
        notes: payData.notes
      });
      toast.success('Payment recorded successfully');
      setIsPayModalOpen(false);
      fetchLabours(); // Refresh to update totals
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  // Summary
  const totalEarned = labours.reduce((sum, l) => sum + (l.totalEarned || 0), 0);
  const totalPaid = labours.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
  const totalDue = labours.reduce((sum, l) => sum + (l.balanceDue || 0), 0);

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

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Earned</p>
          <h2 style={{ color: 'var(--text-main)' }}>{formatCurrency(totalEarned)}</h2>
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
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Skill</th>
                <th style={{ padding: '1rem' }}>Daily Wage</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Earned</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Paid</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Balance Due</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {labours.map(labour => (
                <tr key={labour._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {labour.name}
                    {labour.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{labour.phone}</div>}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    <Badge variant="secondary">{labour.skill || 'Helper'}</Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>{formatCurrency(labour.dailyWage)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(labour.totalEarned || 0)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(labour.totalPaid || 0)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: (labour.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                    {formatCurrency(labour.balanceDue || 0)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--success)', fontSize: '0.75rem' }} onClick={() => openPayModal(labour)}>₹ Pay</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(labour)}>Edit</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteLabour(labour._id)}>Del</Button>
                    </div>
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

      {/* Add/Edit Labour Modal */}
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

      {/* Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`💰 Pay ${payLabourName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddPayment} 
              isLoading={paySubmitting}
              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input 
            label="Amount (₹)" 
            id="amount" 
            type="number" 
            min="1" 
            value={payData.amount} 
            onChange={handlePayInputChange} 
            required 
          />
          <Input label="Payment Date" id="paymentDate" type="date" value={payData.paymentDate} onChange={handlePayInputChange} required />
          <Input label="Payment Mode" id="paymentMode" type="select" value={payData.paymentMode} onChange={handlePayInputChange}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </Input>
          <Input label="Notes (Optional)" id="notes" value={payData.notes} onChange={handlePayInputChange} />
        </form>
      </Modal>
    </div>
  );
};

export default Labours;
