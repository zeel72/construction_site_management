import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { FiPlus, FiMapPin, FiCalendar } from 'react-icons/fi';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    clientName: '',
    startDate: new Date().toISOString().split('T')[0],
    budget: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await api.get('/sites');
      setSites(res.data.data);
    } catch (error) {
      console.error('Failed to fetch sites', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      return toast.error('Site Name and Location are required');
    }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.budget) payload.budget = Number(payload.budget);

      await api.post('/sites', payload);
      toast.success('Construction Site created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', location: '', clientName: '', startDate: new Date().toISOString().split('T')[0], budget: '' });
      fetchSites();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to create site';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'on_hold': return 'warning';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>All Construction Sites</h2>
        <Button icon={<FiPlus />} onClick={() => setIsModalOpen(true)}>Add New Site</Button>
      </div>

      {sites.length === 0 ? (
        <Card className="flex-center" style={{ padding: '3rem' }}>
          <p className="text-muted">No sites found. Create your first project to get started.</p>
        </Card>
      ) : (
        <div className="grid-cols-3">
          {sites.map(site => (
            <Card key={site._id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/sites/${site._id}`)}>
              <div className="flex-between">
                <h3 style={{ fontSize: '1.125rem' }}>{site.name}</h3>
                <Badge variant={getStatusColor(site.status)}>{site.status.replace('_', ' ')}</Badge>
              </div>
              
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiMapPin /> {site.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCalendar /> Started: {new Date(site.startDate).toLocaleDateString()}
                </div>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <strong>Client:</strong> {site.clientName || 'N/A'}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Site"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSite} isLoading={submitting}>Create Site</Button>
          </>
        }
      >
        <form onSubmit={handleAddSite} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input label="Site Name" id="name" value={formData.name} onChange={handleInputChange} required />
          <Input label="Location (Address/City)" id="location" value={formData.location} onChange={handleInputChange} required />
          
          <div className="grid-cols-2">
            <Input label="Client Name" id="clientName" value={formData.clientName} onChange={handleInputChange} />
            <Input label="Estimated Budget (₹)" id="budget" type="number" min="0" value={formData.budget} onChange={handleInputChange} />
          </div>

          <Input label="Start Date" id="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required />
        </form>
      </Modal>
    </div>
  );
};

export default Sites;
