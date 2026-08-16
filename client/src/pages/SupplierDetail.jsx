import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import AttachmentSection from '../components/common/AttachmentSection';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnType, setTxnType] = useState('billed');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const res = await api.get(`/suppliers/${id}`);
      setSupplier(res.data.data);
    } catch (error) {
      console.error('Failed to fetch supplier details', error);
      toast.error('Failed to load supplier details');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return toast.error('Enter a valid amount');

    setSubmitting(true);
    try {
      await api.post(`/suppliers/${id}/transactions`, {
        ...formData,
        type: txnType
      });
      toast.success(txnType === 'billed' ? 'Bill recorded' : 'Payment recorded');
      setIsModalOpen(false);
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchSupplier();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/suppliers/${id}/transactions/${txnId}`);
      toast.success('Transaction deleted');
      fetchSupplier();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  if (loading) return <Spinner />;
  if (!supplier) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/suppliers')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-main)' }}>
          <FiArrowLeft />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{supplier.name}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {supplier.phone} {supplier.state && `• ${supplier.state}`} {supplier.gstin && `• GSTIN: ${supplier.gstin}`}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <Card style={{ textAlign: 'center', borderTop: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Total Billed</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--text-main)' }}>{formatCurrency(supplier.totalBilled)}</h2>
        </Card>
        <Card style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Total Paid</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--success)' }}>{formatCurrency(supplier.totalPaid)}</h2>
        </Card>
        <Card style={{ textAlign: 'center', borderTop: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Balance Due</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--danger)' }}>{formatCurrency(supplier.balanceDue)}</h2>
        </Card>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Button 
          style={{ flex: 1, backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
          onClick={() => { setTxnType('billed'); setIsModalOpen(true); }}
        >
          📄 Add Bill
        </Button>
        <Button 
          style={{ flex: 1, backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
          onClick={() => { setTxnType('paid'); setIsModalOpen(true); }}
        >
          💰 Record Payment
        </Button>
      </div>

      {/* Transaction History */}
      <h3 style={{ marginBottom: '1rem' }}>Transaction History</h3>
      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Billed</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Paid</th>
                <th style={{ padding: '1rem', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {supplier.transactions && supplier.transactions.map(txn => (
                <tr key={txn._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    {new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {txn.description || '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)', fontWeight: txn.type === 'billed' ? '600' : 'normal' }}>
                    {txn.type === 'billed' ? formatCurrency(txn.amount) : ''}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)', fontWeight: txn.type === 'paid' ? '600' : 'normal' }}>
                    {txn.type === 'paid' ? formatCurrency(txn.amount) : ''}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDeleteTransaction(txn._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {(!supplier.transactions || supplier.transactions.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions yet. Add a bill or record a payment above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Attachments Section */}
      {supplier && <AttachmentSection entityType="supplier" entityId={supplier._id} />}

      {/* Transaction Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={txnType === 'billed' ? `📄 Record Bill — ${supplier.name}` : `💰 Record Payment — ${supplier.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddTransaction} 
              isLoading={submitting}
              style={{ backgroundColor: txnType === 'billed' ? 'var(--primary-color)' : 'var(--success)', borderColor: txnType === 'billed' ? 'var(--primary-color)' : 'var(--success)' }}
            >
              {txnType === 'billed' ? 'Save Bill' : 'Save Payment'}
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
            value={formData.amount} 
            onChange={handleInputChange} 
            required 
          />
          <Input label="Date" id="date" type="date" value={formData.date} onChange={handleInputChange} required />
          <Input label="Description / Invoice No. (Optional)" id="description" value={formData.description} onChange={handleInputChange} />
        </form>
      </Modal>
    </div>
  );
};

export default SupplierDetail;
