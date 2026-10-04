import React, { useState, useEffect } from 'react';
import {
  Shield,
  BookOpen,
  GraduationCap,
  Award,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  ChevronLeft,
  Search,
  UserCheck
} from 'lucide-react';
import { api } from '../api';

export default function LoginView({ onLogin, error: propError, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const demoAccounts = [
    {
      role: 'SUPER_ADMIN',
      label: 'Administrator',
      email: 'admin@college.edu',
      name: 'Dr. Alexander Bennett',
      tag: 'Full Authority',
      tagColor: '#dc143c',
      icon: Shield,
      desc: 'Institutional control, clusters, departments, dean & audit oversight'
    },
    {
      role: 'DEAN',
      label: 'Dean of Computing Cluster',
      email: 'dean@college.edu',
      name: 'Dr. K. R. Shanmugam',
      tag: 'Cluster Head',
      tagColor: '#b91c1c',
      icon: Shield,
      desc: 'Oversees Computer Science cluster, pinpoints department deep-dives'
    },
    {
      role: 'HOD',
      label: 'Department',
      email: 'hod.ad@college.edu',
      name: 'Department Portal (14 Departments)',
      tag: '14 Depts',
      tagColor: '#dc143c',
      icon: BookOpen,
      desc: 'Browse and authenticate into all 14 departments: AI, CSE, IT, Cyber, ECE, Mech...'
    },
    {
      role: 'FACULTY',
      label: 'Faculty',
      email: 'faculty@college.edu',
      name: 'Faculty in 14 Departments',
      tag: '14 Depts',
      tagColor: '#dc143c',
      icon: GraduationCap,
      desc: 'Browse 14 departments, view faculty in each department & authenticate instantly'
    },
    {
      role: 'STUDENT',
      label: 'Student Portal',
      email: 'student@college.edu',
      name: 'Arun Kumar (Reg: AD301)',
      tag: 'Track & Leaves',
      tagColor: '#d97706',
      icon: Award,
      desc: 'Subject % breakdown, report late reasons, request leaves, view posts'
    }
  ];

  const fallbackDepartments = [
    { id: 1, code: 'AD', name: 'AI & Data Science', email: 'hod.ad@college.edu', category: 'Cluster', hod: 'Dr. Rajesh Sharma', faculty_count: 8 },
    { id: 2, code: 'CS', name: 'Computer Science & Engineering', email: 'hod.cse@college.edu', category: 'Cluster', hod: 'Dr. Priya Ananth', faculty_count: 8 },
    { id: 3, code: 'IT', name: 'Information Technology', email: 'hod.it@college.edu', category: 'Cluster', hod: 'Dr. Muruganandam K', faculty_count: 8 },
    { id: 4, code: 'CB', name: 'CS & Business Systems', email: 'hod.csbs@college.edu', category: 'Cluster', hod: 'Dr. Savitha Raman', faculty_count: 8 },
    { id: 5, code: 'AL', name: 'AI & Machine Learning', email: 'hod.aiml@college.edu', category: 'Cluster', hod: 'Dr. Anand Kumar', faculty_count: 8 },
    { id: 6, code: 'CY', name: 'Cyber Security', email: 'hod.cyber@college.edu', category: 'Cluster', hod: 'Dr. Vikramaditya Sen', faculty_count: 8 },
    { id: 7, code: 'EC', name: 'Electronics & Communication', email: 'hod.ece@college.edu', category: 'Core', hod: 'Dr. Suresh Balan', faculty_count: 8 },
    { id: 8, code: 'EE', name: 'Electrical & Electronics', email: 'hod.eee@college.edu', category: 'Core', hod: 'Dr. Chandrasekhar V', faculty_count: 8 },
    { id: 9, code: 'ME', name: 'Mechanical Engineering', email: 'hod.mech@college.edu', category: 'Core', hod: 'Dr. Balasubramanian G', faculty_count: 8 },
    { id: 10, code: 'CE', name: 'Civil Engineering', email: 'hod.civil@college.edu', category: 'Core', hod: 'Dr. Kavitha S', faculty_count: 8 },
    { id: 11, code: 'BM', name: 'Biomedical Engineering', email: 'hod.bme@college.edu', category: 'Core', hod: 'Dr. Arvind Swaminathan', faculty_count: 8 },
    { id: 12, code: 'BT', name: 'Biotechnology', email: 'hod.biotech@college.edu', category: 'Core', hod: 'Dr. Sharmila Devi', faculty_count: 8 },
    { id: 13, code: 'AG', name: 'Agricultural Engineering', email: 'hod.agri@college.edu', category: 'Core', hod: 'Dr. Ramalingam P', faculty_count: 8 },
    { id: 14, code: 'MC', name: 'Mechatronics Engineering', email: 'hod.mct@college.edu', category: 'Core', hod: 'Dr. Sivakumar K', faculty_count: 8 }
  ];

  const [departmentsData, setDepartmentsData] = useState([]);
  const [facultyByDept, setFacultyByDept] = useState({});

  // Chooser Modals
  const [showDeptChooser, setShowDeptChooser] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  const [showFacultyChooser, setShowFacultyChooser] = useState(false);
  const [facultyDeptSelected, setFacultyDeptSelected] = useState(null);
  const [facultyDeptSearch, setFacultyDeptSearch] = useState('');
  const [facultyMemberSearch, setFacultyMemberSearch] = useState('');

  // Fetch dynamic departments and faculty accounts
  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        const res = await api.getDemoAccounts();
        if (res.departments && res.departments.length > 0) {
          setDepartmentsData(res.departments);
        }
        if (res.facultyByDept) {
          setFacultyByDept(res.facultyByDept);
        }
      } catch (err) {
        console.error('Error fetching demo accounts:', err);
      }
    };
    fetchDemoData();
  }, []);

  const displayDepts = departmentsData.length > 0 ? departmentsData : fallbackDepartments;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    setLocalError('');
    onLogin(email, password);
  };

  const handleDemoClick = (accountEmail, targetView = null, targetDeptId = null) => {
    setEmail(accountEmail);
    setPassword('password123');
    onLogin(accountEmail, 'password123', targetView, targetDeptId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, #4c0519 0%, #1e293b 90%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      color: '#f8fafc'
    }}>
      <div style={{ maxWidth: '1040px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #dc143c, #991b1b)',
            color: '#fff',
            fontSize: '1.8rem',
            fontWeight: 800,
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(220, 20, 60, 0.4)'
          }}>
            K
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Kalaignarkaruanidhi Institute of Technology
          </h1>
          <p style={{ color: '#fecdd3', fontSize: '1rem', marginTop: '0.4rem' }}>
            College Attendance Management System (CAMS) • Production Portal
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '2rem',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}>
          {/* Left: Traditional Login Form */}
          <div style={{ padding: '2.5rem 2rem', color: '#0f172a', background: '#ffffff' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Sign In to Your Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Select a role or enter your institutional credentials.
            </p>

            {(propError || localError) && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {propError || localError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Institutional Email / User ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. faculty@college.edu"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#dc143c',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(220, 20, 60, 0.3)'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px', background: '#fff1f2', border: '1px solid #fecdd3', fontSize: '0.75rem', color: '#881337' }}>
              <strong>Demo Password for all accounts:</strong> <code>password123</code>
            </div>
          </div>

          {/* Right: Instant 1-Click Demo Logins */}
          <div style={{ padding: '2.5rem 2rem', background: '#faf5f6', borderLeft: '1px solid #fecdd3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#881337' }}>
                  Instant Role Logins
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Click any profile below to authenticate immediately into that portal.
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#fff1f2', color: '#be123c', fontWeight: 700, border: '1px solid #fecdd3' }}>
                1-Click Access
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {demoAccounts.map(acc => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    onClick={() => {
                      if (acc.role === 'HOD') {
                        setShowDeptChooser(true);
                      } else if (acc.role === 'FACULTY') {
                        setShowFacultyChooser(true);
                        setFacultyDeptSelected(null);
                      } else {
                        handleDemoClick(acc.email);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.5px solid #fecdd3',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = acc.tagColor;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 20, 60, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#fecdd3';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#fff1f2',
                      color: acc.tagColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                          {acc.label}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: '#fff1f2',
                          color: acc.tagColor,
                          border: '1px solid #fecdd3'
                        }}>
                          {acc.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.desc}
                      </div>
                    </div>

                    <ArrowRight size={16} color="#94a3b8" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          14 DEPARTMENTS (HOD) SELECTION MODAL
          ======================================================== */}
      {showDeptChooser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '680px', padding: '1.75rem', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'var(--red-mist)', color: 'var(--red-ruby)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <Building2 size={13} />
                  <span>College Departments Portal</span>
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Departments in College: {displayDepts.length} Departments
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Select any department to immediately authenticate into its HOD portal and open that department page.
                </p>
              </div>
              <button
                onClick={() => setShowDeptChooser(false)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>


            {/* Department Search */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <Search size={15} color="var(--red-ruby)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Or filter departments by name or code..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#faf5f6'
                }}
              />
            </div>

            {/* 14 Departments Grid */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.3rem', maxHeight: '380px' }}>
              {displayDepts
                .filter(d => (d.name || '').toLowerCase().includes(deptSearch.toLowerCase()) || (d.code || '').toLowerCase().includes(deptSearch.toLowerCase()))
                .map(d => (
                  <div
                    key={d.id || d.code}
                    onClick={() => {
                      setShowDeptChooser(false);
                      handleDemoClick(d.email || d.hod_email, 'hod-departments', d.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--red-ruby)';
                      e.currentTarget.style.background = 'var(--red-mist)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--red-ruby) 0%, var(--red-burgundy) 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.88rem'
                      }}>
                        {d.code}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          HOD: <strong style={{ color: '#334155' }}>{d.hod || d.hod_name}</strong> • {d.email || d.hod_email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: (d.category === 'Cluster' || d.category === 'CLUSTER') ? '#fff1f2' : '#f1f5f9',
                        color: (d.category === 'Cluster' || d.category === 'CLUSTER') ? '#be123c' : '#475569',
                        border: '1px solid ' + ((d.category === 'Cluster' || d.category === 'CLUSTER') ? '#fecdd3' : '#cbd5e1')
                      }}>
                        {d.category === 'CLUSTER' ? 'Cluster' : d.category === 'NON_CLUSTER' ? 'Core' : d.category}
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--red-ruby)'
                      }}>
                        Sign In as HOD →
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FACULTY CHOOSER MODAL (DEPARTMENTS -> FACULTY IN DEPT)
          ======================================================== */}
      {showFacultyChooser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '720px', padding: '1.75rem', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'var(--red-mist)', color: 'var(--red-ruby)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <GraduationCap size={14} />
                  <span>Faculty Directory • 1-Click Authenticate</span>
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Departments in College: {displayDepts.length} Departments
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  {facultyDeptSelected
                    ? `Showing faculty members in ${facultyDeptSelected.name}. Click any faculty to authenticate directly into their portal.`
                    : 'Click any department below to view all faculty members in that department and sign in.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFacultyChooser(false);
                  setFacultyDeptSelected(null);
                }}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.85rem' }}
              >
                ✕ Close
              </button>
            </div>

            {/* VIEW 1: LIST OF 14 DEPARTMENTS */}
            {!facultyDeptSelected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                {/* Filter Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="var(--red-ruby)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search department by name or code..."
                    value={facultyDeptSearch}
                    onChange={(e) => setFacultyDeptSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#faf5f6'
                    }}
                  />
                </div>

                {/* 14 Departments Grid */}
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.3rem', maxHeight: '380px' }}>
                  {displayDepts
                    .filter(d => (d.name || '').toLowerCase().includes(facultyDeptSearch.toLowerCase()) || (d.code || '').toLowerCase().includes(facultyDeptSearch.toLowerCase()))
                    .map(d => {
                      const count = (facultyByDept[d.id] || []).length || d.faculty_count || 8;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setFacultyDeptSelected(d)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            background: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--red-ruby)';
                            e.currentTarget.style.background = 'var(--red-mist)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, var(--red-ruby) 0%, var(--red-burgundy) 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}>
                              {d.code}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {d.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Department Code: <strong style={{ color: '#334155' }}>{d.code}</strong> • {count} Faculty Members
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.55rem',
                              borderRadius: '999px',
                              background: '#fff1f2',
                              color: 'var(--red-ruby)',
                              border: '1px solid var(--red-pastel)'
                            }}>
                              {count} Faculty
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: 'var(--red-ruby)'
                            }}>
                              View Faculty →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              /* VIEW 2: FACULTY LIST FOR SELECTED DEPARTMENT */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Back bar with Department Details & Switcher */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #fff1f2 0%, #fffafa 100%)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--red-pastel)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => setFacultyDeptSelected(null)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '6px',
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        color: 'var(--red-burgundy)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {facultyDeptSelected.name} ({facultyDeptSelected.code})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Showing faculty in this department. Click any faculty member to sign in.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Faculty */}
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="var(--red-ruby)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder={`Filter faculty in ${facultyDeptSelected.name}...`}
                    value={facultyMemberSearch}
                    onChange={(e) => setFacultyMemberSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#faf5f6'
                    }}
                  />
                </div>

                {/* Faculty Members List */}
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.3rem', maxHeight: '380px' }}>
                  {(facultyByDept[facultyDeptSelected.id] || [])
                    .filter(f => (f.name || '').toLowerCase().includes(facultyMemberSearch.toLowerCase()) ||
                                 (f.designation || '').toLowerCase().includes(facultyMemberSearch.toLowerCase()) ||
                                 (f.faculty_code || '').toLowerCase().includes(facultyMemberSearch.toLowerCase()))
                    .map(fac => (
                      <div
                        key={fac.id || fac.faculty_code}
                        onClick={() => {
                          setShowFacultyChooser(false);
                          handleDemoClick(fac.email, 'faculty-departments', facultyDeptSelected.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          background: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--red-ruby)';
                          e.currentTarget.style.background = 'var(--red-mist)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background = '#ffffff';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#fff1f2',
                            color: 'var(--red-ruby)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <UserCheck size={20} />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {fac.name}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {fac.faculty_code}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              <strong style={{ color: 'var(--red-burgundy)' }}>{fac.designation}</strong> • {fac.cabin_room || 'Faculty Cabin'} • {fac.email}
                            </div>
                          </div>
                        </div>

                        <button
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'var(--red-ruby)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 8px rgba(220, 20, 60, 0.25)'
                          }}
                        >
                          <span>Sign In</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}

                  {(facultyByDept[facultyDeptSelected.id] || []).length === 0 && (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#fafafa', borderRadius: '10px' }}>
                      <GraduationCap size={32} color="var(--red-ruby)" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        Default Faculty for {facultyDeptSelected.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', marginBottom: '1rem' }}>
                        Authenticate as the primary faculty member of this department.
                      </div>
                      <button
                        onClick={() => {
                          setShowFacultyChooser(false);
                          handleDemoClick('faculty@college.edu', 'faculty-departments', facultyDeptSelected.id);
                        }}
                        style={{
                          padding: '0.55rem 1.25rem',
                          borderRadius: '8px',
                          background: 'var(--red-ruby)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Sign In as {facultyDeptSelected.code} Faculty →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
