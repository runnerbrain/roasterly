'use client';

import { useState, useEffect } from 'react';

export default function AlogUploadModal({ onClose, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Close on Escape when not loading
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isLoading]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleUpload = async () => {
    if (!files.length) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      
      const res = await fetch('/api/upload-alog', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload request failed');
      const data = await res.json();
      
      setResults(data.results || []);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to upload files.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inserted': return '#4ade80'; // green
      case 'updated': return '#9ca3af'; // gray
      case 'skipped': return '#facc15'; // yellow
      case 'error': return '#ef4444'; // red
      default: return 'var(--text)';
    }
  };

  return (
    <div className="modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={isLoading ? undefined : onClose} disabled={isLoading} aria-label="Close">
          ✕
        </button>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h2 className="modal-title">Upload .alog Files</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!results ? (
            <>
              <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  multiple
                  accept=".alog"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    console.log('files selected:', selected);
                    setFiles(selected);
                  }}
                  disabled={isLoading}
                  style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                />
              </div>

              {files.length > 0 && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Selected Files ({files.length})</h4>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {files.map((file, i) => (
                      <li key={i}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Upload Results</h4>
              <ul style={{ padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.map((r, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <span style={{ wordBreak: 'break-all', paddingRight: '12px' }}>{r.filename}</span>
                    <span style={{ fontWeight: 600, color: getStatusColor(r.status), textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={onClose} 
              disabled={isLoading}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              Cancel
            </button>
            {!results && (
              <button
                onClick={handleUpload} 
                disabled={isLoading || files.length === 0}
                style={{ padding: '8px 16px', background: '#c8702a', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 500, cursor: (isLoading || files.length === 0) ? 'not-allowed' : 'pointer', opacity: (isLoading || files.length === 0) ? 0.7 : 1 }}
              >
                {isLoading ? 'Uploading…' : 'Upload'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
