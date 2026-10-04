import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  MessageSquare,
  Send,
  UserCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Search,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function DepartmentHierarchyView({ user, initialDeptId, onDeptChange }) {
  const isHodOrFaculty = user?.role === 'HOD' || user?.role === 'FACULTY';
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState(initialDeptId || user?.department_id || null);
  const [deptDetails, setDeptDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL', 'CLUSTER', 'NON_CLUSTER'
  const [showDeptList, setShowDeptList] = useState(true);

  // Active sub-tab in selected department: 'years', 'faculty', 'dept-chat'
  const [deptTab, setDeptTab] = useState('years');
  const [selectedYear, setSelectedYear] = useState(2); // 1, 2, 3, 4
  const [yearViewMode, setYearViewMode] = useState('classes'); // 'classes', 'chat'

  // Chat states
  const [deptChats, setDeptChats] = useState([]);
  const [deptChatInput, setDeptChatInput] = useState('');
  const [sendingDeptChat, setSendingDeptChat] = useState(false);

  const [yearChats, setYearChats] = useState([]);
  const [yearChatInput, setYearChatInput] = useState('');
  const [sendingYearChat, setSendingYearChat] = useState(false);

  // 1. Load All 14 Departments
  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (initialDeptId && Number(initialDeptId) !== Number(selectedDeptId) && departments.length > 0) {
      handleSelectDepartment(Number(initialDeptId));
    }
  }, [initialDeptId]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data || []);
      if (data && data.length > 0) {
        // Prioritize: 1) initialDeptId, 2) user's own department_id, 3) first department
        const targetId = initialDeptId || user?.department_id || data[0].id;
        const targetDept = data.find(d => Number(d.id) === Number(targetId)) || data[0];
        setSelectedDeptId(targetDept.id);
        loadDepartmentDetails(targetDept.id);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Selected Department Deep Dive
  const loadDepartmentDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const details = await api.getDepartment(id);
      setDeptDetails(details);
      // Load chats
      loadDeptChats(id);
      loadYearChats(id, selectedYear);
    } catch (err) {
      console.error('Failed to load department details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectDepartment = (deptId) => {
    const id = Number(deptId);
    setSelectedDeptId(id);
    loadDepartmentDetails(id);
    if (onDeptChange) onDeptChange(id);
    setTimeout(() => {
      const el = document.getElementById('selected-dept-deep-dive');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // 3. Chat Fetchers
  const loadDeptChats = async (deptId) => {
    try {
      const res = await api.getDepartmentChats(deptId);
      setDeptChats(res || []);
    } catch (e) {
      console.error('Failed to load department chats:', e);
    }
  };

  const loadYearChats = async (deptId, yearLevel) => {
    try {
      const res = await api.getDepartmentChats(deptId, yearLevel);
      setYearChats(res || []);
    } catch (e) {
      console.error('Failed to load year chats:', e);
    }
  };

  // When selected year changes, load its chat
  useEffect(() => {
    if (selectedDeptId) {
      loadYearChats(selectedDeptId, selectedYear);
    }
  }, [selectedDeptId, selectedYear]);

  // 4. Send Chat Messages
  const handleSendDeptChat = async (e) => {
    e.preventDefault();
    if (!deptChatInput.trim() || !selectedDeptId) return;

    try {
      setSendingDeptChat(true);
      const newMsg = await api.sendDepartmentChat(selectedDeptId, {
        year_level: null,
        message: deptChatInput.trim()
      });
      setDeptChats(prev => [...prev, newMsg]);
      setDeptChatInput('');
    } catch (err) {
      console.error('Failed to post dept chat:', err);
    } finally {
      setSendingDeptChat(false);
    }
  };

  const handleSendYearChat = async (e) => {
    e.preventDefault();
    if (!yearChatInput.trim() || !selectedDeptId) return;

    try {
      setSendingYearChat(true);
      const newMsg = await api.sendDepartmentChat(selectedDeptId, {
        year_level: selectedYear,
        message: yearChatInput.trim()
      });
      setYearChats(prev => [...prev, newMsg]);
      setYearChatInput('');
    } catch (err) {
      console.error('Failed to post year chat:', err);
    } finally {
      setSendingYearChat(false);
    }
  };

  // Filtered department list
  const filteredDepartments = departments.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedDept = departments.find(d => d.id === selectedDeptId) || deptDetails;

  // Filter classes by selected year
  const yearClasses = (deptDetails?.classes || []).filter(c => c.year_level === selectedYear);
  const currentYearIncharge = (deptDetails?.year_incharges || []).find(yi => yi.year_level === selectedYear);

  if (loading && departments.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--red-ruby)', fontWeight: 700, fontSize: '1.1rem' }}>
          Loading 14 College Departments...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ========================================================
          1. TOP STAT BANNER: TOTAL DEPARTMENTS IN THE COLLEGE (14)
             (Hidden once department is selected in Faculty and HOD portals)
          ======================================================== */}
      {(!isHodOrFaculty || !selectedDept) && (
        <div style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #200208 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        boxShadow: '0 8px 24px rgba(76, 5, 25, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#fecdd3', marginBottom: '0.75rem' }}>
              <Building2 size={14} color="#f43f5e" />
              <span>Institutional Academic Structure</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Departments in College: <span style={{ color: '#ff2d55', textShadow: '0 0 16px rgba(255, 45, 85, 0.6)' }}>{departments.length || 14} Departments</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#fda4af', marginTop: '0.4rem', maxWidth: '680px', lineHeight: 1.5 }}>
              Kalaignarkaruanidhi Institute of Technology operates with 14 autonomous engineering departments across Computer Science Clusters and Core Disciplines.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '12px', padding: '0.85rem 1.25rem', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{departments.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#fecdd3', fontWeight: 600, textTransform: 'uppercase' }}>Departments</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '12px', padding: '0.85rem 1.25rem', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                {departments.filter(d => d.category === 'CLUSTER').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fecdd3', fontWeight: 600, textTransform: 'uppercase' }}>CS Cluster</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '12px', padding: '0.85rem 1.25rem', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                {departments.filter(d => d.category === 'NON_CLUSTER').length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fecdd3', fontWeight: 600, textTransform: 'uppercase' }}>Core Depts</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            DEPARTMENT SELECTING OPTION MENU (Hidden once department is selected in Faculty and HOD views)
            ======================================================== */}
        {!isHodOrFaculty && !selectedDept && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1.1rem 1.4rem',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <label htmlFor="department-select-menu" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="#fda4af" />
                <span>Select Department:</span>
              </label>
              <span style={{ fontSize: '0.78rem', color: '#fecdd3', fontWeight: 700, background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                {departments.length} Autonomous Departments
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                id="department-select-menu"
                value={selectedDeptId || ''}
                onChange={(e) => handleSelectDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.1rem',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)'
                }}
              >
                <option value="" disabled>-- Select a department to switch to its page --</option>
                {departments.map((dept, idx) => (
                  <option key={dept.id} value={dept.id}>
                    {idx + 1}. {dept.name} ({dept.code}) — {dept.category === 'CLUSTER' ? 'Computer Science Cluster' : 'Core Engineering'} • {dept.faculty_count || 8} Faculty
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Toggle List Bar (Hidden in HOD and Faculty view once department is selected) */}
        {!isHodOrFaculty && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => setShowDeptList(!showDeptList)}
              style={{
                background: showDeptList ? '#e11d48' : 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '0.55rem 1.1rem',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: showDeptList ? '0 2px 10px rgba(225, 29, 72, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Building2 size={16} />
              <span>{showDeptList ? 'Hide Departments Grid' : 'Browse All 14 Departments'}</span>
            </button>

            <span style={{ fontSize: '0.78rem', color: '#fda4af' }}>
              Currently viewing: <strong style={{ color: '#ffffff' }}>{selectedDept?.name} ({selectedDept?.code})</strong>
            </span>
          </div>
        )}
      </div>
      )}

      {/* ========================================================
          2. LIST OF 14 DEPARTMENTS (Only shown when browsing in Admin/Dean mode)
          ======================================================== */}
      {!isHodOrFaculty && showDeptList && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Controls: Search and Cluster Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
              <Search size={16} color="var(--red-ruby)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by code or department name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#faf5f6'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { id: 'ALL', label: `All (${departments.length})` },
                { id: 'CLUSTER', label: 'Cluster' },
                { id: 'NON_CLUSTER', label: 'Core / Non-Cluster' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: filterCategory === f.id ? 'var(--red-ruby)' : 'var(--red-mist)',
                    color: filterCategory === f.id ? '#ffffff' : 'var(--red-burgundy)',
                    border: '1px solid ' + (filterCategory === f.id ? 'var(--red-ruby)' : 'var(--border)')
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 14 Departments Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.9rem'
          }}>
            {filteredDepartments.map((dept, idx) => {
              const isSelected = selectedDeptId === dept.id;
              return (
                <div
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--red-ruby-vivid)' : '1px solid var(--border)',
                    background: isSelected ? 'linear-gradient(135deg, #fff5f6 0%, #ffffff 100%)' : '#ffffff',
                    boxShadow: isSelected ? '0 4px 14px rgba(225, 29, 72, 0.2)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'var(--red-ruby-vivid)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      textTransform: 'uppercase'
                    }}>
                      Active
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--red-ruby-vivid)' : 'var(--red-mist)',
                      color: isSelected ? '#ffffff' : 'var(--red-burgundy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}>
                      {dept.code}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dept.name}
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: dept.category === 'CLUSTER' ? 'var(--red-ruby)' : '#64748b'
                      }}>
                        {dept.category === 'CLUSTER' ? 'Computer Science Cluster' : 'Core Engineering'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span>HOD: <strong style={{ color: 'var(--text-main)' }}>{dept.hod_name ? dept.hod_name.split(' ')[1] || dept.hod_name.split(' ')[0] : 'Appointed'}</strong></span>
                    <span><strong style={{ color: 'var(--red-ruby)' }}>{dept.faculty_count || 8}</strong> Faculty</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          3. SELECTED DEPARTMENT DEEP DIVE (HOD, Faculty, Years, Chat)
          ======================================================== */}
      {selectedDept && (
        <div
          id="selected-dept-deep-dive"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}
        >
          {/* Header Bar of Selected Department */}
          <div style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #fffafa 100%)',
            padding: '1.25rem 1.75rem',
            borderBottom: '1.5px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--red-burgundy) 0%, var(--red-ruby-vivid) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
              }}>
                {selectedDept.code}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {selectedDept.name}
                  </h2>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: selectedDept.category === 'CLUSTER' ? 'var(--red-mist)' : '#f1f5f9',
                    color: selectedDept.category === 'CLUSTER' ? 'var(--red-ruby)' : '#475569',
                    border: '1px solid ' + (selectedDept.category === 'CLUSTER' ? 'var(--red-pastel)' : '#cbd5e1')
                  }}>
                    {selectedDept.category === 'CLUSTER' ? 'Cluster Department' : 'Core Department'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Department ID: #{selectedDept.id} • 4 Academic Years • Complete Mentorship & Attendance Registry
                </div>
              </div>
            </div>

            {/* Department Level Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setDeptTab('years')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: deptTab === 'years' ? 'var(--red-ruby)' : 'transparent',
                  color: deptTab === 'years' ? '#ffffff' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <GraduationCap size={16} />
                <span>Academic Years (1st - 4th)</span>
              </button>

              <button
                onClick={() => setDeptTab('faculty')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: deptTab === 'faculty' ? 'var(--red-ruby)' : 'transparent',
                  color: deptTab === 'faculty' ? '#ffffff' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={16} />
                <span>Faculty ({deptDetails?.faculty_count || selectedDept.faculty_count || 8})</span>
              </button>

              <button
                onClick={() => setDeptTab('dept-chat')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: deptTab === 'dept-chat' ? 'var(--red-ruby)' : 'transparent',
                  color: deptTab === 'dept-chat' ? '#ffffff' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={16} />
                <span>Department Chat</span>
                {deptChats.length > 0 && (
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: deptTab === 'dept-chat' ? '#ffffff' : 'var(--red-cherry-glow)',
                    color: deptTab === 'dept-chat' ? 'var(--red-ruby)' : '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}>
                    {deptChats.length}
                  </span>
                )}
              </button>
            </div>
            </div>
          </div>

          <div style={{ padding: '1.75rem' }}>
            {/* ========================================================
                HOD DETAILS CARD & OVERVIEW STATS (Always visible)
                ======================================================== */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              {/* Card 1: HOD Details */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={deptDetails?.hod_avatar || selectedDept?.hod_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt="HOD"
                    style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', border: '2px solid var(--red-pastel)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    background: '#16a34a',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid #ffffff'
                  }} title="Active Head of Department" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'var(--red-mist)', color: 'var(--red-ruby)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    <UserCheck size={12} /> Head of Department
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {deptDetails?.hod_name || selectedDept?.hod_name || 'Dr. Department Head'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={12} color="var(--red-ruby)" /> {deptDetails?.hod_email || selectedDept?.hod_email || 'hod@college.edu'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={12} color="var(--red-ruby)" /> {deptDetails?.hod_phone || selectedDept?.hod_phone || '+91 98401 22000'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--red-burgundy)', fontWeight: 600 }}>
                      <MapPin size={12} /> Block Office: {selectedDept?.code} HOD Secretariat
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Faculty Count & Teaching Staff Overview */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Faculty Strength
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--red-ruby-vivid)', lineHeight: 1.1, marginTop: '0.25rem' }}>
                    {deptDetails?.faculty_count || selectedDept?.faculty_count || 8} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Professors</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem', margin: 0 }}>
                    100% faculty allocated to Year Incharges and Class Mentorship roles.
                  </p>
                </div>

                <button
                  onClick={() => setDeptTab('faculty')}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--red-mist)',
                    color: 'var(--red-ruby)',
                    border: '1px solid var(--red-pastel)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>View All Faculty</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* ========================================================
                TAB 1: ACADEMIC YEARS (1st, 2nd, 3rd, 4th Year Columns)
                ======================================================== */}
            {deptTab === 'years' && (
              <div>
                {/* 4 Year Columns / Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {[
                    { yr: 1, label: '1st Year', sem: 'Sem 1 & 2', badge: 'Freshmen' },
                    { yr: 2, label: '2nd Year', sem: 'Sem 3 & 4', badge: 'Sophomore' },
                    { yr: 3, label: '3rd Year', sem: 'Sem 5 & 6', badge: 'Junior Pre-Final' },
                    { yr: 4, label: '4th Year', sem: 'Sem 7 & 8', badge: 'Senior Final Yr' }
                  ].map(item => {
                    const isSelectedYear = selectedYear === item.yr;
                    const incharge = (deptDetails?.year_incharges || []).find(yi => yi.year_level === item.yr);
                    const classesCount = (deptDetails?.classes || []).filter(c => c.year_level === item.yr).length;

                    return (
                      <div
                        key={item.yr}
                        onClick={() => setSelectedYear(item.yr)}
                        style={{
                          padding: '1.1rem 1.25rem',
                          borderRadius: '12px',
                          border: isSelectedYear ? '2px solid var(--red-ruby-vivid)' : '1px solid var(--border)',
                          background: isSelectedYear ? 'linear-gradient(135deg, #4c0519 0%, #70091e 100%)' : '#ffffff',
                          color: isSelectedYear ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: isSelectedYear ? '0 6px 18px rgba(76, 5, 25, 0.25)' : 'var(--shadow-sm)',
                          transition: 'all 0.18s ease',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: isSelectedYear ? '#fda4af' : 'var(--red-ruby)' }}>
                            {item.badge}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: isSelectedYear ? '#fecdd3' : '#64748b' }}>
                            {item.sem}
                          </span>
                        </div>

                        <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '0.4rem' }}>
                          {item.label}
                        </div>

                        <div style={{ fontSize: '0.76rem', color: isSelectedYear ? '#ffe4e6' : '#64748b', borderTop: isSelectedYear ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border)', paddingTop: '0.45rem', marginTop: '0.3rem' }}>
                          <div>Classes: <strong style={{ color: isSelectedYear ? '#ffffff' : 'var(--red-burgundy)' }}>{classesCount || (item.yr === 2 || item.yr === 3 ? 2 : 1)} Sections</strong></div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Incharge: <strong>{incharge ? incharge.faculty_name.split(' ')[1] || incharge.faculty_name : 'Prof. Assigned'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-header of selected Year: Toggle Classes vs Year Chat */}
                <div style={{
                  background: '#faf5f6',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--red-ruby)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      Y{selectedYear}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {selectedYear === 1 ? '1st' : selectedYear === 2 ? '2nd' : selectedYear === 3 ? '3rd' : '4th'} Year Academic Registry & Classes
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Year Incharge: <strong style={{ color: 'var(--red-burgundy)' }}>{currentYearIncharge?.faculty_name || 'Prof. Year Coordinator'}</strong> ({currentYearIncharge?.room_no || 'Year Office'})
                      </span>
                    </div>
                  </div>

                  {/* Toggle between Classes and Year Chat */}
                  <div style={{ display: 'flex', gap: '0.4rem', background: '#ffffff', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setYearViewMode('classes')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: yearViewMode === 'classes' ? 'var(--red-ruby)' : 'transparent',
                        color: yearViewMode === 'classes' ? '#ffffff' : '#64748b'
                      }}
                    >
                      Class Details ({yearClasses.length || 2})
                    </button>
                    <button
                      onClick={() => setYearViewMode('chat')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: yearViewMode === 'chat' ? 'var(--red-ruby)' : 'transparent',
                        color: yearViewMode === 'chat' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{selectedYear}{selectedYear === 1 ? 'st' : selectedYear === 2 ? 'nd' : selectedYear === 3 ? 'rd' : 'th'} Year Chat</span>
                      {yearChats.length > 0 && (
                        <span style={{ padding: '0.05rem 0.35rem', borderRadius: '999px', background: 'var(--red-cherry-glow)', color: '#fff', fontSize: '0.65rem' }}>
                          {yearChats.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* VIEW A: Classes in this Year */}
                {yearViewMode === 'classes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {yearClasses.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Classes loading for Year {selectedYear}...</div>
                      </div>
                    ) : (
                      yearClasses.map(cls => (
                        <div
                          key={cls.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            border: '1.5px solid var(--border)',
                            padding: '1.25rem 1.5rem',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  background: 'var(--red-mist)',
                                  color: 'var(--red-ruby)',
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}>
                                  {cls.section_name}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {selectedDept.name} • Year {cls.year_level} (Sem {cls.semester_num})
                                </h4>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  • Classroom: <strong style={{ color: 'var(--text-main)' }}>{cls.room_no}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Performance Standing Badge */}
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '999px',
                              background: '#ecfdf5',
                              color: '#15803d',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              border: '1px solid #bbf7d0'
                            }}>
                              <CheckCircle2 size={13} />
                              <span>Standing: {cls.standing}</span>
                            </div>
                          </div>

                          {/* Grid of Class Incharges & Metrics */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Incharge / Mentors */}
                            <div style={{ background: '#faf5f6', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--red-ruby)', textTransform: 'uppercase' }}>
                                Class Faculty Incharges
                              </div>
                              <div style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  1. {cls.mentor1_name || 'Prof. Arunachalam S'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {cls.mentor1_email || 'mentor1@college.edu'}
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                                  2. {cls.mentor2_name || 'Dr. Meenakshi Sundaram'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {cls.mentor2_email || 'mentor2@college.edu'}
                                </div>
                              </div>
                            </div>

                            {/* Student Count */}
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                Enrolled Students
                              </div>
                              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 }}>
                                {cls.student_count || 64} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Students</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                                100% registered for 2026-2027
                              </div>
                            </div>

                            {/* Class Attendance Performance */}
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                <span style={{ color: '#64748b' }}>Attendance Rate</span>
                                <span style={{ color: 'var(--red-ruby)' }}>{cls.attendance_pct}%</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', marginTop: '0.4rem', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${cls.attendance_pct}%`, background: 'linear-gradient(90deg, #be123c 0%, #e11d48 100%)', borderRadius: '999px' }} />
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
                                Threshold: Strictly &gt; 75% for exam hall pass
                              </div>
                            </div>

                            {/* Academic Performance */}
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                <span style={{ color: '#64748b' }}>Exam Pass Rate</span>
                                <span style={{ color: '#16a34a' }}>{cls.pass_rate}%</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', marginTop: '0.4rem', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${cls.pass_rate}%`, background: '#16a34a', borderRadius: '999px' }} />
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
                                Avg Internal Score: <strong>{cls.avg_internal} / 100</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* VIEW B: Year Chat Tab */}
                {yearViewMode === 'chat' && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1.5px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '380px'
                  }}>
                    {/* Chat Header */}
                    <div style={{ padding: '0.85rem 1.25rem', background: '#faf5f6', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={16} color="var(--red-ruby)" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {selectedYear}{selectedYear === 1 ? 'st' : selectedYear === 2 ? 'nd' : selectedYear === 3 ? 'rd' : 'th'} Year Discussion & Incharge Channel
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Messages are visible to {selectedYear} Year faculty and students
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', background: '#ffffff' }}>
                      {yearChats.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No messages yet in this Year Channel. Post an announcement or inquiry below.
                        </div>
                      ) : (
                        yearChats.map((msg, i) => (
                          <div
                            key={msg.id || i}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              maxWidth: '80%',
                              alignSelf: msg.user_id === user?.id ? 'flex-end' : 'flex-start',
                              background: msg.user_id === user?.id ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : '#faf7f7',
                              border: msg.user_id === user?.id ? '1px solid var(--red-pastel)' : '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '0.75rem 1rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                {msg.user_name}
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                background: msg.user_role === 'HOD' ? 'var(--red-ruby)' : msg.user_role === 'YEAR_INCHARGE' ? '#70091e' : msg.user_role === 'FACULTY' ? 'var(--red-mist)' : '#e2e8f0',
                                color: (msg.user_role === 'HOD' || msg.user_role === 'YEAR_INCHARGE') ? '#ffffff' : 'var(--text-main)',
                                fontWeight: 700
                              }}>
                                {msg.user_role}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                              {msg.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendYearChat} style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', background: '#faf5f6', display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder={`Post announcement or message to Year ${selectedYear}...`}
                        value={yearChatInput}
                        onChange={(e) => setYearChatInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border)',
                          fontSize: '0.85rem',
                          outline: 'none',
                          background: '#ffffff'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingYearChat || !yearChatInput.trim()}
                        style={{
                          background: 'var(--red-ruby)',
                          color: '#ffffff',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: yearChatInput.trim() ? 'pointer' : 'not-allowed',
                          opacity: yearChatInput.trim() ? 1 : 0.6
                        }}
                      >
                        <Send size={15} />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                TAB 2: FULL FACULTY DIRECTORY
                ======================================================== */}
            {deptTab === 'faculty' && (
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                  Faculty Directory • {selectedDept.name} ({deptDetails?.faculty?.length || 8} Members)
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Faculty Name</th>
                        <th>Designation</th>
                        <th>Official Email</th>
                        <th>Phone</th>
                        <th>Cabin Office</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deptDetails?.faculty || []).map((fac) => (
                        <tr key={fac.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--red-ruby)' }}>
                            {fac.faculty_code}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {fac.name}
                          </td>
                          <td>
                            <span style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--red-mist)', color: 'var(--red-ruby)', border: '1px solid var(--red-pastel)' }}>
                              {fac.designation}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {fac.email}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {fac.phone || 'Available on campus'}
                          </td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {fac.cabin_room || 'Faculty Wing Block A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 3: DEPARTMENT CHAT TAB (Department-Wide)
                ======================================================== */}
            {deptTab === 'dept-chat' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '440px'
              }}>
                <div style={{ padding: '1rem 1.5rem', background: '#faf5f6', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="var(--red-ruby)" />
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Official {selectedDept.name} ({selectedDept.code}) Department Board
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Department-wide official circulars, symposium notices, and academic messages
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'var(--red-ruby)', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                    Official Channel
                  </span>
                </div>

                {/* Message Stream */}
                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '420px', background: '#ffffff' }}>
                  {deptChats.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No messages posted in this department yet. Be the first to start the discussion!
                    </div>
                  ) : (
                    deptChats.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          maxWidth: '75%',
                          alignSelf: msg.user_id === user?.id ? 'flex-end' : 'flex-start',
                          background: msg.user_id === user?.id ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : '#faf7f7',
                          border: msg.user_id === user?.id ? '1px solid var(--red-pastel)' : '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '0.85rem 1.1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            {msg.user_name}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            background: msg.user_role === 'HOD' ? 'var(--red-ruby)' : 'var(--red-mist)',
                            color: msg.user_role === 'HOD' ? '#ffffff' : 'var(--red-burgundy)',
                            fontWeight: 800
                          }}>
                            {msg.user_role}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 'auto' }}>
                            {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Field */}
                <form onSubmit={handleSendDeptChat} style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', background: '#faf5f6', display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder={`Post announcement to all ${selectedDept.name} faculty & students...`}
                    value={deptChatInput}
                    onChange={(e) => setDeptChatInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingDeptChat || !deptChatInput.trim()}
                    style={{
                      background: 'linear-gradient(135deg, var(--red-ruby) 0%, var(--red-ruby-vivid) 100%)',
                      color: '#ffffff',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: deptChatInput.trim() ? 'pointer' : 'not-allowed',
                      opacity: deptChatInput.trim() ? 1 : 0.6
                    }}
                  >
                    <Send size={15} />
                    <span>Send Notice</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
