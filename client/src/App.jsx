import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import AdminDashboardView from './views/AdminDashboardView';
import DeanDashboardView from './views/DeanDashboardView';
import HodDashboardView from './views/HodDashboardView';
import FacultyDashboardView from './views/FacultyDashboardView';
import StudentDashboardView from './views/StudentDashboardView';
import TakeAttendanceView from './views/TakeAttendanceView';
import { api } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ odApprovals: 0, odVerifications: 0 });
  const [selectedDeptId, setSelectedDeptId] = useState(null);

  // Initial check on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cams_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setCurrentUser(data.user);
        if (data.user?.department_id) {
          setSelectedDeptId(data.user.department_id);
        }
        setDefaultViewForRole(data.user.role);
        fetchNotifications();
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('cams_token');
        localStorage.removeItem('cams_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setDefaultViewForRole = (role) => {
    if (role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR') setCurrentView('admin-dashboard');
    else if (role === 'DEAN') setCurrentView('dean-dashboard');
    else if (role === 'HOD') setCurrentView('hod-dashboard');
    else if (role === 'FACULTY') setCurrentView('faculty-dashboard');
    else setCurrentView('student-dashboard');
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (e) {
      // ignore
    }
  };

  const handleLogin = async (email, password, targetView = null, targetDeptId = null) => {
    try {
      setLoading(true);
      setLoginError('');
      const data = await api.login(email, password);
      localStorage.setItem('cams_token', data.token);
      localStorage.setItem('cams_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      if (targetDeptId) {
        setSelectedDeptId(targetDeptId);
      } else if (data.user?.department_id) {
        setSelectedDeptId(data.user.department_id);
      }
      if (targetView) {
        setCurrentView(targetView);
      } else {
        setDefaultViewForRole(data.user.role);
      }
      fetchNotifications();
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cams_token');
    localStorage.removeItem('cams_user');
    setCurrentUser(null);
    setAttendanceSession(null);
    setCurrentView('login');
  };

  // 1-Click Role Switcher
  const handleSwitchRole = async (email, password) => {
    await handleLogin(email, password);
  };

  // Launch Take Attendance Screen
  const handleStartAttendance = (params) => {
    setAttendanceSession(params);
    setCurrentView('take-attendance');
  };

  if (loading && !currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#ffffff'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: '#dc143c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 800,
          marginBottom: '1rem',
          boxShadow: '0 4px 16px rgba(220, 20, 60, 0.4)'
        }}>
          K
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          College Attendance Management System
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
          Initializing session & validating cryptographic tokens...
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        error={loginError}
        loading={loading}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Dynamic Role-Based Sidebar */}
      <Sidebar
        user={currentUser}
        currentView={currentView}
        onViewChange={(viewId) => {
          if (viewId === 'faculty-take-attendance' || viewId === 'hod-take-attendance') {
            // Open default active class session for today
            setAttendanceSession({
              classId: 1, // II AI & DS Section A
              subjectId: 1, // Java Programming
              date: new Date().toISOString().split('T')[0],
              period: 1
            });
            setCurrentView('take-attendance');
          } else {
            setAttendanceSession(null);
            setCurrentView(viewId);
          }
        }}
        pendingCounts={pendingCounts}
      />

      {/* Main Workspace */}
      <div className="main-content">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          notifications={notifications}
          onRefreshNotifications={fetchNotifications}
        />

        <main style={{ flex: 1, paddingBottom: '3rem' }}>
          {/* SPECIAL VIEW: Flagship Take Attendance Screen */}
          {currentView === 'take-attendance' && attendanceSession ? (
            <TakeAttendanceView
              sessionParams={attendanceSession}
              onBack={() => {
                setAttendanceSession(null);
                setCurrentView(currentUser.role === 'SUPER_ADMIN' ? 'admin-dashboard' : currentUser.role === 'HOD' ? 'hod-dashboard' : 'faculty-dashboard');
              }}
              onSuccess={() => {
                fetchNotifications();
              }}
            />
          ) : (
            <>
              {/* ADMINISTRATOR / SUPER ADMIN VIEWS */}
              {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMINISTRATOR') && (
                <AdminDashboardView
                  user={currentUser}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                  onTakeAttendance={handleStartAttendance}
                  selectedDeptId={selectedDeptId}
                  onSelectDeptId={setSelectedDeptId}
                />
              )}

              {/* DEAN VIEWS */}
              {currentUser.role === 'DEAN' && (
                <DeanDashboardView
                  user={currentUser}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              )}

              {/* HOD VIEWS */}
              {currentUser.role === 'HOD' && (
                <HodDashboardView
                  user={currentUser}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                  onTakeAttendance={handleStartAttendance}
                  selectedDeptId={selectedDeptId}
                  onSelectDeptId={setSelectedDeptId}
                />
              )}

              {/* FACULTY VIEWS */}
              {currentUser.role === 'FACULTY' && (
                <FacultyDashboardView
                  user={currentUser}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                  onTakeAttendance={handleStartAttendance}
                  selectedDeptId={selectedDeptId}
                  onSelectDeptId={setSelectedDeptId}
                />
              )}

              {/* STUDENT VIEWS */}
              {currentUser.role === 'STUDENT' && (
                <StudentDashboardView
                  user={currentUser}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
