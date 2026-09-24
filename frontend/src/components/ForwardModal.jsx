import React, { useState } from 'react';
import messageService from '../services/messageService';

const ForwardModal = ({ message, conversations, onClose, onForwardSuccess }) => {
  const [selectedConvId, setSelectedConvId] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    const name = c.isGroup ? c.groupName : c.participants?.[0]?.name || 'Chat';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleForward = async () => {
    if (!selectedConvId || !message?._id || forwarding) return;
    setForwarding(true);
    try {
      const res = await messageService.forwardMessage(selectedConvId, message._id);
      if (res.success) {
        if (onForwardSuccess) onForwardSuccess(selectedConvId, res.message);
        onClose();
      }
    } catch (err) {
      console.error('Error forwarding message:', err);
      alert('Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Forward Message</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="forward-message-preview">
            <div className="forward-preview-sender">From: {message.sender?.name || 'User'}</div>
            <div className="forward-preview-text">
              {message.text || (message.attachments?.length ? '📎 Attachment' : 'Message')}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search chat or group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="forward-conversations-list">
            {filtered.map((conv) => {
              const name = conv.isGroup
                ? conv.groupName
                : conv.participants?.[0]?.name || 'Direct Chat';
              const isSelected = selectedConvId === conv._id;

              return (
                <div
                  key={conv._id}
                  className={`forward-conv-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConvId(conv._id)}
                >
                  <div className="forward-conv-name">{name}</div>
                  <div className="forward-check-box">{isSelected && '✓'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleForward}
            disabled={!selectedConvId || forwarding}
          >
            {forwarding ? 'Forwarding...' : 'Forward'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
