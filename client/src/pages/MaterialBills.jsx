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
import AttachmentSection from '../components/common/AttachmentSection';
import Materials from './Materials';

const MaterialBills = () => {
  const { siteId } = useParams();
  const [activeTab, setActiveTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBillId, setEditBillId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    billNumber: '',
    supplierId: '',
    billDate: new Date().toISOString().split('T')[0],
    itemName: '',
    quantity: '',
    unit: 'bags',
    totalAmount: '',
    paidAmount: '',
    gstRate: '18',
    isInterState: false
  });

  useEffect(() => {
    fetchBills();
    fetchSuppliers();
  }, [siteId]);

  const fetchBills = async () => {
    try {
      const res = await api.get(`/sites/${siteId}/material-bills`);
      setBills(res.data.data);
    } catch (error) {
      console.error('Failed to fetch bills', error);
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
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.id]: value });
  };

  const handleEditClick = (bill) => {
    setIsEditMode(true);
    setEditBillId(bill._id);
    
    // Extract first item if exists
    const item = bill.items && bill.items.length > 0 ? bill.items[0] : {};

    setFormData({
      billNumber: bill.billNumber,
      supplierId: bill.supplierId,
      billDate: new Date(bill.billDate).toISOString().split('T')[0],
      itemName: item.name || '',
      quantity: item.quantity || '',
      unit: item.unit || 'bags',
      totalAmount: (item.quantity && item.ratePerUnit) ? (item.quantity * item.ratePerUnit).toFixed(2) : '',
      paidAmount: bill.paidAmount || '',
      gstRate: item.gstRate ? item.gstRate.toString() : '18',
      isInterState: bill.gstBreakup ? bill.gstBreakup.isInterState : false
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditBillId(null);
    setFormData({
      billNumber: '',
      supplierId: '',
      billDate: new Date().toISOString().split('T')[0],
      itemName: '',
      quantity: '',
      unit: 'bags',
      totalAmount: '',
      paidAmount: '',
      gstRate: '18',
      isInterState: false
    });
    setIsModalOpen(true);
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!formData.billNumber || !formData.supplierId || !formData.itemName || !formData.quantity || !formData.totalAmount) {
      return toast.error('Please fill in all required fields');
    }

    setSubmitting(true);
    try {
      const rate = Number(formData.totalAmount) / Number(formData.quantity);
      
      const payload = {
        billNumber: formData.billNumber,
        supplierId: formData.supplierId,
        billDate: formData.billDate,
        gstBreakup: { isInterState: formData.isInterState },
        items: [
          {
            name: formData.itemName,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            ratePerUnit: rate,
            gstRate: Number(formData.gstRate)
          }
        ],
        paidAmount: Number(formData.paidAmount || 0)
      };

      if (isEditMode) {
        await api.put(`/sites/${siteId}/material-bills/${editBillId}`, payload);
        toast.success('Bill updated successfully');
      } else {
        await api.post(`/sites/${siteId}/material-bills`, payload);
        toast.success('Bill added successfully');
      }
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        ...formData,
        billNumber: '',
        itemName: '',
        quantity: '',
        totalAmount: '',
        paidAmount: ''
      });
      fetchBills();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to add bill';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('bills')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bills' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'bills' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'bills' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Supplier Bills (Invoices)
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'inventory' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'inventory' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Inventory Items (Direct)
        </button>
      </div>

      {activeTab === 'inventory' && <Materials />}

      {activeTab === 'bills' && (
        <>
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <h2>Material Bills (GST)</h2>
            <Button onClick={openAddModal}>Add New Bill</Button>
          </div>

          <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Bill No.</th>
                <th style={{ padding: '1rem' }}>Supplier</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>GST %</th>
                <th style={{ padding: '1rem' }}>Total Amount</th>
                <th style={{ padding: '1rem' }}>Due</th>
                <th style={{ padding: '1rem' }}>Paid</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} className="hover-row">
                  <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--primary-color)' }}>{bill.billNumber}</td>
                  <td style={{ padding: '1rem' }}>
                    {bill.supplierName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {bill.supplierGstin || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>{bill.items && bill.items[0] ? bill.items[0].gstRate + '%' : 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    {formatCurrency(bill.finalAmount)}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Taxable: {formatCurrency(bill.taxableAmount)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--danger)' }}>{formatCurrency(bill.balanceAmount || bill.finalAmount - bill.paidAmount)}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)' }}>{formatCurrency(bill.paidAmount)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <AttachmentSection entityType="bill" entityId={bill._id} compact />
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(bill)}>Edit</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No material bills found for this site.
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
        title={isEditMode ? "Edit Material Bill" : "Add Material Bill"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBill} isLoading={submitting}>{isEditMode ? "Save Changes" : "Create Bill"}</Button>
          </>
        }
      >
        <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="grid-cols-2">
            <Input label="Bill Number" id="billNumber" value={formData.billNumber} onChange={handleInputChange} required />
            <Input label="Bill Date" id="billDate" type="date" value={formData.billDate} onChange={handleInputChange} required />
          </div>

          <Input label="Supplier" id="supplierId" type="select" value={formData.supplierId} onChange={handleInputChange} required>
            <option value="">Select Supplier...</option>
            {suppliers.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.state})</option>
            ))}
          </Input>
          
          <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isInterState" checked={formData.isInterState} onChange={handleInputChange} />
            <label htmlFor="isInterState" style={{ fontSize: '0.875rem' }}>Inter-state supply (Applies IGST instead of CGST/SGST)</label>
          </div>

          <h4 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--primary-color)' }}>Item Details</h4>
          
          <Input label="Item Name" id="itemName" value={formData.itemName} onChange={handleInputChange} required />
          
          <div className="grid-cols-2">
            <Input label="Quantity" id="quantity" type="number" min="0.1" step="0.1" value={formData.quantity} onChange={handleInputChange} required />
            <Input label="Unit" id="unit" type="select" value={formData.unit} onChange={handleInputChange}>
              <option value="bags">Bags</option>
              <option value="tons">Tons</option>
              <option value="kg">Kg</option>
              <option value="liters">Liters</option>
              <option value="pieces">Pieces</option>
              <option value="cft">Cft (Cubic Feet)</option>
            </Input>
          </div>

          <div className="grid-cols-2">
            <Input label="Total Amount (₹)" id="totalAmount" type="number" min="0" step="0.01" value={formData.totalAmount} onChange={handleInputChange} required />
            <Input label="Paid Amount (₹) (Optional)" id="paidAmount" type="number" min="0" step="0.01" value={formData.paidAmount} onChange={handleInputChange} />
          </div>
          <div className="grid-cols-2">
            <Input label="GST Rate (%)" id="gstRate" type="select" value={formData.gstRate} onChange={handleInputChange}>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </Input>
          </div>
        </form>
      </Modal>
      
      </>
      )}

      <style>{`
        .hover-row:hover { background-color: var(--primary-light); }
      `}</style>
    </div>
  );
};

export default MaterialBills;
