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

const Parties = () => {
  const [parties, setParties] = useState([]);
  const [summary, setSummary] = useState({ totalYoullGet: 0, totalYoullGive: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPartyId, setEditPartyId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    partyType: 'customer',
    isInterestActive: false,
    interestRate: 0,
    interestType: 'monthly',
    openingBalance: '',
    openingBalanceType: 'give'
  });

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const res = await api.get('/parties');
      setParties(res.data.data);
      setSummary(res.data.summary);
    } catch (error) {
      console.error('Failed to fetch parties', error);
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({ ...formData, [id]: type === 'checkbox' ? checked : value });
  };

  const handleSaveParty = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');

    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/parties/${editPartyId}`, formData);
        toast.success('Ledger updated successfully');
      } else {
        await api.post('/parties', formData);
        toast.success('Ledger added successfully');
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        partyType: 'customer',
        isInterestActive: false,
        interestRate: 0,
        interestType: 'monthly',
        openingBalance: '',
        openingBalanceType: 'give'
      });
      fetchParties();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save ledger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (e, party) => {
    e.stopPropagation(); // prevent row click
    setIsEditMode(true);
    setEditPartyId(party._id);
    setFormData({
      name: party.name || '',
      phone: party.phone || '',
      partyType: party.partyType || 'customer',
      isInterestActive: party.isInterestActive || false,
      interestRate: party.interestRate || 0,
      interestType: party.interestType || 'monthly',
      openingBalance: '', // Do not edit opening balance directly from here to prevent double-entry issues
      openingBalanceType: 'give'
    });
    setIsModalOpen(true);
  };
  
  const handleAddClick = () => {
    setIsEditMode(false);
    setEditPartyId(null);
    setFormData({
      name: '',
      phone: '',
      partyType: 'customer',
      isInterestActive: false,
      interestRate: 0,
      interestType: 'monthly',
      openingBalance: '',
      openingBalanceType: 'give'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (e, partyId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this ledger? All transactions will be deleted as well.')) {
      try {
        await api.delete(`/parties/${partyId}`);
        toast.success('Ledger deleted successfully');
        fetchParties();
      } catch (error) {
        toast.error('Failed to delete ledger');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Ledger (Khatabook)</h2>
        <Button onClick={handleAddClick}>+ Add Ledger</Button>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <Card style={{ borderTop: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You'll Get</p>
          <h2 style={{ color: 'var(--success)' }}>{formatCurrency(summary.totalYoullGet)}</h2>
        </Card>
        <Card style={{ borderTop: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You'll Give</p>
          <h2 style={{ color: 'var(--danger)' }}>{formatCurrency(summary.totalYoullGive)}</h2>
        </Card>
        <Card style={{ borderTop: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Net Balance</p>
          <h2 style={{ color: summary.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(summary.netBalance)} {summary.netBalance >= 0 ? 'Dr' : 'Cr'}
          </h2>
        </Card>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Type & Details</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>You'll Get</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>You'll Give</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties.map(party => (
                <tr 
                  key={party._id} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => navigate(`/parties/${party._id}`)}
                  className="hover-row"
                >
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {party.name}
                    {party.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{party.phone}</div>}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    <Badge variant="secondary">{party.partyType}</Badge>
                    {party.isInterestActive && (
                      <Badge variant="primary" style={{ marginLeft: '0.5rem' }}>
                        {party.interestRate}% {party.interestType}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)' }}>
                    {party.balance > 0 ? (
                      <div>
                        <div style={{ fontWeight: '600' }}>{formatCurrency(party.balance)}</div>
                        {party.accruedInterest > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            + {formatCurrency(party.accruedInterest)} Interest
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--danger)' }}>
                    {party.balance < 0 ? (
                      <div>
                        <div style={{ fontWeight: '600' }}>{formatCurrency(party.balance)}</div>
                        {party.accruedInterest < 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            + {formatCurrency(Math.abs(party.accruedInterest))} Interest
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, party)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={(e) => handleDeleteClick(e, party._id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {parties.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No ledgers added yet. Click "+ Add Ledger" to start.
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
        title={isEditMode ? "Edit Ledger" : "Add Ledger"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveParty} isLoading={submitting}>{isEditMode ? "Save Changes" : "Save Ledger"}</Button>
          </>
        }
      >
        <form onSubmit={handleSaveParty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Name" id="name" value={formData.name} onChange={handleInputChange} required />
          <Input label="Phone (Optional)" id="phone" value={formData.phone} onChange={handleInputChange} />
          <Input label="Type" id="partyType" type="select" value={formData.partyType} onChange={handleInputChange}>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="lender">Lender (Takes Interest)</option>
            <option value="borrower">Borrower (Pays Interest)</option>
            <option value="other">Other</option>
          </Input>
          
          {!isEditMode && (
            <div className="grid-cols-2">
              <Input label="Opening Balance (₹) (Optional)" id="openingBalance" type="number" step="0.01" min="0" value={formData.openingBalance} onChange={handleInputChange} />
              <Input label="Balance Type" id="openingBalanceType" type="select" value={formData.openingBalanceType} onChange={handleInputChange}>
                <option value="give">I Owe Them (You'll Give)</option>
                <option value="get">They Owe Me (You'll Get)</option>
              </Input>
            </div>
          )}
          
          <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" id="isInterestActive" checked={formData.isInterestActive} onChange={handleInputChange} />
              Enable Automatic Interest Calculation
            </label>
            
            {formData.isInterestActive && (
              <div className="grid-cols-2" style={{ marginTop: '1rem' }}>
                <Input label="Interest Rate (%)" id="interestRate" type="number" step="0.1" value={formData.interestRate} onChange={handleInputChange} />
                <Input label="Rate Type" id="interestType" type="select" value={formData.interestType} onChange={handleInputChange}>
                  <option value="monthly">Per Month</option>
                  <option value="yearly">Per Year</option>
                </Input>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <style>{`
        .hover-row:hover {
          background-color: var(--primary-light);
        }
      `}</style>
    </div>
  );
};

export default Parties;
