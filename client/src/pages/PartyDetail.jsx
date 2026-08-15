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
import { FiArrowLeft, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';

const PartyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ party: null, transactions: [], balance: 0, totalAccruedInterest: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnType, setTxnType] = useState('get'); // 'get' or 'give'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/parties/${id}`);
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch ledger details', error);
      toast.error('Failed to load ledger details');
      navigate('/parties');
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
      await api.post(`/parties/${id}/transactions`, {
        ...formData,
        type: txnType
      });
      toast.success('Transaction added successfully');
      setIsModalOpen(false);
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchData(); // Refetch to recalculate interest and balance
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Delete this transaction? This will recalculate all interest and balances.')) return;
    try {
      await api.delete(`/parties/${id}/transactions/${txnId}`);
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  if (loading) return <Spinner />;
  if (!data.party) return null;

  const { party, transactions, balance, totalAccruedInterest } = data;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/parties')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-main)' }}>
          <FiArrowLeft />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{party.name}</h2>
          {party.phone && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{party.phone}</span>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Badge variant="secondary" style={{ textTransform: 'capitalize' }}>{party.partyType}</Badge>
          {party.isInterestActive && (
            <Badge variant="primary">{party.interestRate}% {party.interestType} interest</Badge>
          )}
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <Card style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Net Balance</h3>
          <h1 style={{ marginTop: '0.5rem', color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(balance)} {balance > 0 ? " (You'll Get)" : balance < 0 ? " (You'll Give)" : ""}
          </h1>
          {party.isInterestActive && totalAccruedInterest > 0 && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Includes {formatCurrency(totalAccruedInterest)} total accrued interest
            </p>
          )}
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button 
              style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => { setTxnType('give'); setIsModalOpen(true); }}
            >
              <FiMinus style={{ marginRight: '0.5rem' }} /> You Gave (Red)
            </Button>
            <Button 
              style={{ flex: 1, backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
              onClick={() => { setTxnType('get'); setIsModalOpen(true); }}
            >
              <FiPlus style={{ marginRight: '0.5rem' }} /> You Got (Green)
            </Button>
          </div>
        </Card>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date & Details</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>You Gave (-)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>You Got (+)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Running Balance</th>
                <th style={{ padding: '1rem', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={txn._id || `virtual-${index}`} style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: txn.isVirtualInterest ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent'
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>
                      {new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {txn.description && (
                      <div style={{ fontSize: '0.875rem', color: txn.isVirtualInterest ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                        {txn.isVirtualInterest && '⏳ '} {txn.description}
                      </div>
                    )}
                  </td>
                  
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--danger)' }}>
                    {txn.type === 'give' ? formatCurrency(txn.amount) : ''}
                  </td>
                  
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)' }}>
                    {txn.type === 'get' ? formatCurrency(txn.amount) : ''}
                  </td>
                  
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: txn.runningBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatCurrency(txn.runningBalance)} {txn.runningBalance > 0 ? 'Dr' : txn.runningBalance < 0 ? 'Cr' : ''}
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {!txn.isVirtualInterest && (
                      <button 
                        onClick={() => handleDeleteTransaction(txn._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete Transaction"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions yet.
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
        title={txnType === 'give' ? "You Gave ₹ (Red Entry)" : "You Got ₹ (Green Entry)"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddTransaction} 
              isLoading={submitting}
              style={{ backgroundColor: txnType === 'give' ? 'var(--danger)' : 'var(--success)', borderColor: txnType === 'give' ? 'var(--danger)' : 'var(--success)' }}
            >
              Save Entry
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
            style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
          />
          <Input label="Date" id="date" type="date" value={formData.date} onChange={handleInputChange} required />
          <Input label="Details / Remarks (Optional)" id="description" value={formData.description} onChange={handleInputChange} />
        </form>
      </Modal>

    </div>
  );
};

export default PartyDetail;
