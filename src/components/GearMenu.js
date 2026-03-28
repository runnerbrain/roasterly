'use client';

import { useState, useRef, useEffect } from 'react';

export default function GearMenu({ onAddBeans, onUploadRoasts }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Menu"
        title="Menu"
      >
        ⚙️
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: '150px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onAddBeans();
            }}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'background 0.2s',
              borderBottom: '1px solid var(--border)'
            }}
            onMouseOver={(e) => (e.target.style.background = 'var(--card-bg)')}
            onMouseOut={(e) => (e.target.style.background = 'transparent')}
          >
            + Add Beans
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onUploadRoasts();
            }}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.target.style.background = 'var(--card-bg)')}
            onMouseOut={(e) => (e.target.style.background = 'transparent')}
          >
            ↑ Upload Roasts
          </button>
        </div>
      )}
    </div>
  );
}
