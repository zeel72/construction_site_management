import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Attendance = () => {
  const { siteId } = useParams();
  const [labours, setLabours] = useState([]);
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [siteId, date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all active labours for this site
      const laboursRes = await api.get(`/sites/${siteId}/labours`);
      const activeLabours = laboursRes.data.data.filter(l => l.isActive);
      setLabours(activeLabours);

      // Fetch attendance for selected date
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRes = await api.get(`/sites/${siteId}/attendance?date=${dateStr}`);
      
      // Map existing attendance to state
      const existingData = {};
      attendanceRes.data.data.forEach(record => {
        existingData[record.labourId._id] = {
          status: record.status,
          overtimeHours: record.overtimeHours
        };
      });
      
      // Pre-fill missing labours with 'present' as default to speed up data entry
      activeLabours.forEach(l => {
        if (!existingData[l._id]) {
          existingData[l._id] = { status: 'present', overtimeHours: 0 };
        }
      });
      
      setAttendanceData(existingData);
    } catch (error) {
      console.error('Failed to fetch attendance data', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (labourId, status) => {
    setAttendanceData({
      ...attendanceData,
      [labourId]: { ...attendanceData[labourId], status }
    });
  };

  const handleOvertimeChange = (labourId, hours) => {
    setAttendanceData({
      ...attendanceData,
      [labourId]: { ...attendanceData[labourId], overtimeHours: Number(hours) }
    });
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.keys(attendanceData).map(labourId => ({
        labourId,
        date: date.toISOString(),
        status: attendanceData[labourId].status,
        overtimeHours: attendanceData[labourId].overtimeHours
      }));

      await api.post(`/sites/${siteId}/attendance`, { records });
      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Daily Attendance</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ zIndex: 10 }}>
            <DatePicker 
              selected={date} 
              onChange={(d) => setDate(d)} 
              dateFormat="dd MMM yyyy"
              className="input-field"
              maxDate={new Date()}
            />
          </div>
          <Button onClick={saveAttendance} isLoading={saving}>Save Attendance</Button>
        </div>
      </div>

      <Card noPadding>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-main)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Skill</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Overtime (Hrs)</th>
              </tr>
            </thead>
            <tbody>
              {labours.map(labour => (
                <tr key={labour._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{labour.name}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{labour.skill}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['present', 'half_day', 'absent'].map(status => (
                        <Button 
                          key={status}
                          size="sm" 
                          variant={attendanceData[labour._id]?.status === status ? 'primary' : 'secondary'}
                          onClick={() => handleStatusChange(labour._id, status)}
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Input 
                      type="number" 
                      min="0" 
                      max="12" 
                      value={attendanceData[labour._id]?.overtimeHours || 0}
                      onChange={(e) => handleOvertimeChange(labour._id, e.target.value)}
                      style={{ width: '80px', marginBottom: 0 }}
                      disabled={attendanceData[labour._id]?.status === 'absent'}
                    />
                  </td>
                </tr>
              ))}
              {labours.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No active labours found. Add labours first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
