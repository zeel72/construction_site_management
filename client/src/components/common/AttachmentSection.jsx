import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/api';
import Button from './Button';
import Modal from './Modal';
import { FiPaperclip, FiTrash2, FiDownload, FiImage, FiFile } from 'react-icons/fi';

const AttachmentSection = ({ entityType, entityId, compact = false }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (entityId) fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attachments?entityType=${entityType}&entityId=${entityId}`);
      setAttachments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch attachments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    setUploading(true);
    try {
      await api.post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('File uploaded successfully');
      fetchAttachments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/attachments/${id}`);
      toast.success('Attachment deleted');
      fetchAttachments();
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  const handlePreview = (attachment) => {
    const baseUrl = api.defaults.baseURL || '';
    const url = `${baseUrl}/attachments/${attachment._id}/file`;
    
    if (attachment.fileType.startsWith('image/')) {
      setPreviewType('image');
      setPreviewUrl(url);
    } else {
      // For PDFs and other files, open in new tab
      window.open(url, '_blank');
      return;
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Compact mode: just a button with count badge
  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: attachments.length > 0 ? 'var(--primary-color)' : 'var(--text-muted)',
          }}
          title="Attachments"
        >
          <FiPaperclip />
          {attachments.length > 0 && <span>{attachments.length}</span>}
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setPreviewUrl(null); }}
          title="📎 Attachments"
          footer={
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setPreviewUrl(null); }}>Close</Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Upload Button */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploading}
              >
                <FiPaperclip style={{ marginRight: '0.25rem' }} /> Upload File
              </Button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Max 5MB • JPG, PNG, PDF
              </span>
            </div>

            {/* Preview */}
            {previewUrl && previewType === 'image' && (
              <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-sm)' }}
                />
                <button
                  onClick={() => setPreviewUrl(null)}
                  style={{ display: 'block', margin: '0.5rem auto 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Close Preview
                </button>
              </div>
            )}

            {/* File List */}
            {attachments.length === 0 && !loading && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No files attached yet.
              </p>
            )}

            {attachments.map((att) => (
              <div
                key={att._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '1.25rem', color: att.fileType.startsWith('image/') ? 'var(--primary-color)' : 'var(--danger)' }}>
                  {att.fileType.startsWith('image/') ? <FiImage /> : <FiFile />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.fileName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <button
                  onClick={() => handlePreview(att)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0.25rem' }}
                  title="View / Download"
                >
                  <FiDownload />
                </button>
                <button
                  onClick={() => handleDelete(att._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </Modal>
      </>
    );
  }

  // Full mode: inline section
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>📎 Attachments</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
          >
            <FiPaperclip style={{ marginRight: '0.25rem' }} /> Upload File
          </Button>
        </div>
      </div>

      {attachments.length === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
          No files attached. Click "Upload File" to add invoices, photos, or documents.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {attachments.map((att) => (
          <div
            key={att._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '1.25rem', color: att.fileType.startsWith('image/') ? 'var(--primary-color)' : 'var(--danger)' }}>
              {att.fileType.startsWith('image/') ? <FiImage /> : <FiFile />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.fileName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <button
              onClick={() => handlePreview(att)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '0.25rem' }}
              title="View / Download"
            >
              <FiDownload />
            </button>
            <button
              onClick={() => handleDelete(att._id)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
              title="Delete"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentSection;
