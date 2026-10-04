import React, { useState, useEffect } from 'react';
import { Bell, Clock, LogOut, User, RefreshCw, Shield, BookOpen, GraduationCap, Award, Building2 } from 'lucide-react';
import { api } from '../api';

export default function Navbar({ currentUser, onLogout, onSwitchRole, notifications, onRefreshNotifications }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const demoRoles = [
    { role: 'SUPER_ADMIN', email: 'admin@college.edu', label: 'Administrator', icon: Shield, desc: 'Full Institutional Control' },
    { role: 'DEAN', email: 'dean@college.edu', label: 'Dean (Computing Cluster Head)', icon: Award, desc: 'Cluster Oversight & Pinpoint' },
    { role: 'HOD', email: 'hod.ad@college.edu', label: 'Department', icon: Building2, desc: '14 Autonomous Departments' },
    { role: 'FACULTY', email: 'faculty@college.edu', label: 'Faculty (Prof. Arunachalam)', icon: GraduationCap, desc: 'Faculty & Student Sections' },
    { role: 'STUDENT', email: 'student@college.edu', label: 'Student (Arun Kumar)', icon: User, desc: 'Leaves, Attendance & Presence' }
  ];

  return (
    <header className="topbar">
      {/* College Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #881337 0%, #dc143c 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.2rem',
          boxShadow: '0 2px 8px rgba(220, 20, 60, 0.3)'
        }}>
          K
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Kalaignarkaruanidhi Institute of Technology
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            College Attendance Management System (CAMS) • Session 2026-2027
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Live Synchronized Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f8fafc',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '0.82rem',
          color: '#334155'
        }}>
          <Clock size={15} color="#dc143c" />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontWeight: 500 }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* 1-Click Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              background: '#fff1f2',
              color: '#991b1b',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
            title="Switch Demo Role"
          >
            <RefreshCw size={14} />
            <span>Switch Role</span>
          </button>

          {showSwitchMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '120%',
              width: '280px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              padding: '0.6rem',
              zIndex: 100
            }}>
              <div style={{ padding: '0.4rem 0.6rem 0.6rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Instant Demo Account Switcher
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
                {demoRoles.map(item => {
                  const Icon = item.icon;
                  const isCurrent = currentUser?.role === item.role;
                  return (
                    <button
                      key={item.role}
                      onClick={() => {
                        setShowSwitchMenu(false);
                        onSwitchRole(item.email, 'password123');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        textAlign: 'left',
                        width: '100%',
                        background: isCurrent ? '#fff1f2' : 'transparent',
                        border: isCurrent ? '1px solid #fecdd3' : '1px solid transparent'
                      }}
                    >
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: isCurrent ? '#dc143c' : '#f1f5f9',
                        color: isCurrent ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.desc}
                        </div>
                      </div>
                      {isCurrent && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              position: 'relative',
              padding: '0.5rem',
              borderRadius: '8px',
              background: showNotifMenu ? '#f1f5f9' : 'transparent',
              color: '#475569'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #ffffff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '120%',
              width: '340px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              padding: '0.75rem',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Notifications</span>
                <button
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    onRefreshNotifications();
                  }}
                  style={{ fontSize: '0.75rem', color: '#dc143c', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: n.is_read ? '#f8fafc' : '#fff1f2',
                        borderLeft: `3px solid ${n.type === 'ALERT' ? '#dc2626' : n.type === 'SUCCESS' ? '#059669' : '#dc143c'}`
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.2rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #e2e8f0',
            background: '#e2e8f0'
          }}>
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={20} style={{ margin: '8px', color: '#64748b' }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {currentUser?.name || 'User'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#dc143c', fontWeight: 600, textTransform: 'uppercase' }}>
              {currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser?.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              color: '#dc2626',
              background: '#fef2f2',
              marginLeft: '0.5rem'
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
