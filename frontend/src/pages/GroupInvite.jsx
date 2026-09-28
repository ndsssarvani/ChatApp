import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import conversationService from '../services/conversationService';

const GroupInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'invalid' | 'expired' | 'disabled' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setErrorStatus('invalid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorStatus(null);
        const res = await conversationService.getInviteInfo(token);
        if (res.success) {
          if (res.isExpired) {
            setErrorStatus('expired');
            setInviteData(res.group || null);
          } else if (res.isEnabled === false) {
            setErrorStatus('disabled');
            setInviteData(res.group || null);
          } else {
            setInviteData(res.group);
            setAlreadyMember(!!res.isMember);
          }
        } else {
          setErrorStatus('invalid');
          setErrorMessage(res.message || t('invalidInvite'));
        }
      } catch (err) {
        console.error('Failed to load invite:', err);
        const backendMsg = err.response?.data?.message;
        if (err.response?.status === 404) {
          setErrorStatus('invalid');
          setErrorMessage(backendMsg || t('invalidInvite'));
        } else if (backendMsg && backendMsg.includes('expired')) {
          setErrorStatus('expired');
          setErrorMessage(backendMsg);
        } else if (backendMsg && (backendMsg.includes('inactive') || backendMsg.includes('no longer active'))) {
          setErrorStatus('disabled');
          setErrorMessage(backendMsg);
        } else {
          setErrorStatus('invalid');
          setErrorMessage(backendMsg || t('invalidInvite'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, currentUser, t]);

  const handleJoin = async () => {
    if (!currentUser) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    try {
      setJoining(true);
      const res = await conversationService.joinGroupByInvite(token);
      if (res.success) {
        setJoinedSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      const msg = err.response?.data?.message || 'Failed to join group';
      if (err.response?.data?.alreadyMember) {
        setAlreadyMember(true);
      } else {
        alert(msg);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleOpenGroup = () => {
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1f242d 100%)',
        padding: '24px 16px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        color: '#f0f6fc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(22, 27, 34, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(224, 82, 28, 0.15)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .invite-btn-primary {
            width: 100%;
            padding: 13px 20px;
            background: linear-gradient(135deg, #e0521c 0%, #f97316 100%);
            color: #ffffff;
            border: none;
            border-radius: '14px';
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 14px rgba(224, 82, 28, 0.4);
          }
          .invite-btn-primary:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(224, 82, 28, 0.5);
          }
          .invite-btn-secondary {
            width: 100%;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.08);
            color: #e6edf3;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 14px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .invite-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.14);
          }
        `}</style>

        {/* Logo / Brand Header */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e0521c, #ff7a45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(224, 82, 28, 0.4)',
            }}
          >
            💬
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            Chat<span style={{ color: '#ff7a45' }}>ify</span>
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '30px 0' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255, 255, 255, 0.15)',
                borderTopColor: '#e0521c',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>Loading group details...</p>
          </div>
        )}

        {/* Invalid / Non-existent Link */}
        {!loading && errorStatus === 'invalid' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 18px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#f85149' }}>
              {t('invalidInvite')}
            </h2>
            <p style={{ fontSize: '14px', color: '#8b949e', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              {errorMessage || 'This group invite link is invalid or has been revoked by the group admin.'}
            </p>
            <button
              type="button"
              className="invite-btn-primary"
              style={{ borderRadius: '14px' }}
              onClick={() => navigate(currentUser ? '/dashboard' : '/')}
            >
              {currentUser ? t('dashboard') : 'Go to Home'}
            </button>
          </div>
        )}

        {/* Expired Link */}
        {!loading && errorStatus === 'expired' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 18px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              ⏳
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#f59e0b' }}>
              {t('expiredInvite')}
            </h2>
            <p style={{ fontSize: '14px', color: '#8b949e', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              This invitation link is no longer valid because it has expired. Ask the group admin for a new link.
            </p>
            <button
              type="button"
              className="invite-btn-primary"
              style={{ borderRadius: '14px' }}
              onClick={() => navigate(currentUser ? '/dashboard' : '/')}
            >
              {currentUser ? t('dashboard') : 'Go to Home'}
            </button>
          </div>
        )}

        {/* Disabled / Inactive Link */}
        {!loading && errorStatus === 'disabled' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(107, 114, 128, 0.2)',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 18px',
                border: '1px solid rgba(107, 114, 128, 0.3)',
              }}
            >
              🔒
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#e6edf3' }}>
              {t('inviteRevoked')}
            </h2>
            <p style={{ fontSize: '14px', color: '#8b949e', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              This invitation link is no longer active. Please contact the group administrator to request access.
            </p>
            <button
              type="button"
              className="invite-btn-primary"
              style={{ borderRadius: '14px' }}
              onClick={() => navigate(currentUser ? '/dashboard' : '/')}
            >
              {currentUser ? t('dashboard') : 'Go to Home'}
            </button>
          </div>
        )}

        {/* Active Invite: Group Info and Actions */}
        {!loading && !errorStatus && inviteData && (
          <div>
            {/* Group Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <img
                src={inviteData.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(inviteData.groupName || 'group')}`}
                alt={inviteData.groupName}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  objectFit: 'cover',
                  border: '3px solid rgba(224, 82, 28, 0.4)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  background: '#e0521c',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '2px solid #161b22',
                }}
              >
                👥
              </span>
            </div>

            {/* Invited Subtitle */}
            <div style={{ fontSize: '13px', color: '#ff7a45', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              {alreadyMember ? t('alreadyMember') : t('youreInvited')}
            </div>

            {/* Group Name */}
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff', wordBreak: 'break-word' }}>
              {inviteData.groupName}
            </h2>

            {/* Group Description */}
            {inviteData.groupDescription && (
              <p style={{ fontSize: '14px', color: '#8b949e', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {inviteData.groupDescription}
              </p>
            )}

            {/* Member Count Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#c9d1d9',
                fontWeight: 600,
                marginBottom: '28px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span>👥</span>
              <span>{inviteData.memberCount || 1} {t('members')}</span>
            </div>

            {/* Action Buttons based on Auth & Membership state */}
            {currentUser ? (
              alreadyMember ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="invite-btn-primary"
                    style={{ borderRadius: '14px' }}
                    onClick={handleOpenGroup}
                  >
                    💬 {t('openGroup')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    className="invite-btn-primary"
                    style={{ borderRadius: '14px' }}
                    onClick={handleJoin}
                    disabled={joining || joinedSuccess}
                  >
                    {joining ? (
                      <>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite',
                          }}
                        />
                        Joining...
                      </>
                    ) : joinedSuccess ? (
                      '✓ Joined! Redirecting...'
                    ) : (
                      `✨ ${t('joinGroup')}`
                    )}
                  </button>
                  <button
                    type="button"
                    className="invite-btn-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    {t('cancel')}
                  </button>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="invite-btn-primary"
                  style={{ borderRadius: '14px' }}
                  onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                >
                  🔑 {t('loginToJoin')}
                </button>
                <button
                  type="button"
                  className="invite-btn-secondary"
                  onClick={() => navigate(`/register?redirect=/invite/${token}`)}
                >
                  📝 {t('registerToJoin')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInvite;
