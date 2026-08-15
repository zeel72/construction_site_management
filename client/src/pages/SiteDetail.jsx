import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/api';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { FiUsers, FiBox, FiFileText, FiDollarSign } from 'react-icons/fi';

const SiteDetail = () => {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteData();
  }, [siteId]);

  const fetchSiteData = async () => {
    try {
      const [siteRes, summaryRes] = await Promise.all([
        api.get(`/sites/${siteId}`),
        api.get(`/sites/${siteId}/dashboard/summary`)
      ]);
      setSite(siteRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Failed to fetch site details', error);
      toast.error('Failed to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (loading) return <Spinner />;
  if (!site) return <div>Site not found</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {site.name}
          <Badge variant={site.status === 'active' ? 'success' : 'secondary'}>
            {site.status.replace('_', ' ')}
          </Badge>
        </h2>
        <p className="text-muted">{site.location}</p>
      </div>

      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <Card className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <FiUsers size={24} color="var(--primary-color)" />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.activeLaboursCount}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Active Labours</div>
        </Card>
        
        <Card className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <FiDollarSign size={24} color="var(--warning)" />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(summary.totalLabourCost)}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Labour Cost</div>
        </Card>

        <Card className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <FiBox size={24} color="var(--info)" />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(summary.totalMaterialCost)}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Material Cost</div>
        </Card>

        <Card className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <FiFileText size={24} color="var(--success)" />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(summary.totalPaymentsMade)}</div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Payments Made</div>
        </Card>
      </div>
      
      <Card>
        <h3>Project Details</h3>
        <div className="grid-cols-2" style={{ marginTop: '1rem' }}>
          <div>
            <strong>Client:</strong> {site.clientName || 'N/A'}<br/>
            <strong>Start Date:</strong> {new Date(site.startDate).toLocaleDateString()}<br/>
            <strong>Expected End:</strong> {site.expectedEndDate ? new Date(site.expectedEndDate).toLocaleDateString() : 'N/A'}<br/>
          </div>
          <div>
            <strong>Budget:</strong> {site.totalBudget ? formatCurrency(site.totalBudget) : 'N/A'}<br/>
            <strong>Outstanding Balance:</strong> <span style={{ color: summary.totalOutstanding > 0 ? 'var(--danger)' : 'inherit' }}>{formatCurrency(summary.totalOutstanding)}</span><br/>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SiteDetail;
