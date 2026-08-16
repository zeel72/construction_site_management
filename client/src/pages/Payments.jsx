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
import { generateFinancialReportPDF } from '../utils/generateReportPDF';
import { FiDownload } from 'react-icons/fi';

const Payments = () => {
  const { siteId } = useParams();
  const [payments, setPayments] = useState([]);
  const [labours, setLabours] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'labour',
    referenceId: '',
    amount: '',
    paymentMode: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPayments();
    fetchReferences();
  }, [siteId]);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/sites/${siteId}/payments`);
      setPayments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferences = async () => {
    try {
      const [laboursRes, suppliersRes] = await Promise.all([
        api.get(`/sites/${siteId}/labours`),
        api.get('/suppliers')
      ]);
      setLabours(laboursRes.data.data);
      setSuppliers(suppliersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch references', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!formData.referenceId || !formData.amount) {
      return toast.error('Please fill in required fields');
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      };

      await api.post(`/sites/${siteId}/payments`, payload);
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      setFormData({ ...formData, referenceId: '', amount: '', transactionId: '' });
      fetchPayments();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to record payment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      // Get the site name
      const siteRes = await api.get(`/sites/${siteId}`);
      const siteName = siteRes.data.data.name;

      // Get the report data
      const reportRes = await api.get(`/sites/${siteId}/reports/financial`);
      
      // Generate the PDF
      generateFinancialReportPDF(reportRes.data.data, siteName);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Failed to generate report', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Payment Records</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button 
            variant="secondary" 
            onClick={handleDownloadReport} 
            isLoading={generatingReport}
            style={{ borderColor: 'var(--border-color)', background: 'white' }}
          >
            <FiDownload style={{ marginRight: '0.5rem' }} /> Site Report (PDF)
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Record Payment</Button>
        </div>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Paid To</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Mode</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    <Badge variant={payment.type === 'labour' ? 'warning' : 'info'}>
                      {payment.type}
                    </Badge>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{payment.referenceName || 'Unknown'}</td>
                  <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    {payment.paymentMode.replace('_', ' ')}
                    {payment.transactionId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Txn: {payment.transactionId}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No payment records found.
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
        title="Record New Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} isLoading={submitting}>Save Payment</Button>
          </>
        }
      >
        <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          
          <Input label="Payment Type" id="type" type="select" value={formData.type} onChange={handleInputChange}>
            <option value="labour">Labourer Wage</option>
            <option value="material">Material Supplier</option>
          </Input>

          <Input label={`Select ${formData.type === 'labour' ? 'Labourer' : 'Supplier'}`} id="referenceId" type="select" value={formData.referenceId} onChange={handleInputChange} required>
            <option value="">Select...</option>
            {formData.type === 'labour' 
              ? labours.map(l => <option key={l._id} value={l._id}>{l.name} - Bal: {formatCurrency(l.balanceDue || 0)}</option>)
              : suppliers.map(s => <option key={s._id} value={s._id}>{s.name} - Bal: {formatCurrency(s.balanceDue || 0)}</option>)
            }
          </Input>

          <div className="grid-cols-2">
            <Input label="Amount (₹)" id="amount" type="number" min="1" value={formData.amount} onChange={handleInputChange} required />
            <Input label="Payment Date" id="paymentDate" type="date" value={formData.paymentDate} onChange={handleInputChange} required />
          </div>

          <div className="grid-cols-2">
            <Input label="Payment Mode" id="paymentMode" type="select" value={formData.paymentMode} onChange={handleInputChange}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </Input>
            <Input label="Transaction ID (Optional)" id="transactionId" value={formData.transactionId} onChange={handleInputChange} disabled={formData.paymentMode === 'cash'} />
          </div>

        </form>
      </Modal>

    </div>
  );
};

export default Payments;
