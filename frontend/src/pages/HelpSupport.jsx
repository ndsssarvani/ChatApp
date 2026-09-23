import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supportService from '../services/supportService';
import { useAuth } from '../context/AuthContext';

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await supportService.getFaqs();
        if (res.success) setFaqs(res.faqs);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    loadFaqs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await supportService.createTicket(formData);
      if (res.success) {
        setSuccessMsg('Your support ticket has been submitted. Our team will get back to you shortly.');
        setFormData({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
      }
    } catch (err) {
      alert('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '750px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-tertiary, #f1f3f5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>❓ Help & Support</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* FAQs Section */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  borderRadius: '12px',
                  background: 'var(--bg-secondary, #f8f9fa)',
                  border: '1px solid var(--border-color, #dee2e6)',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '18px', color: '#22c55e' }}>{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Form */}
      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--border-color, #dee2e6)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Contact Support Team</h2>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px 0' }}>
          Need assistance or found a bug? Send us a message and our support specialists will assist you.
        </p>

        {successMsg && (
          <div style={{
            padding: '12px 16px',
            background: '#dcfce7',
            color: '#15803d',
            borderRadius: '10px',
            marginBottom: '16px',
            fontWeight: 500,
            fontSize: '13px',
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Question about group chats"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Message</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your question or issue in detail..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 24px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HelpSupport;