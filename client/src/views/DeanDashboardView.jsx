import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Briefcase, Award, MapPin, 
  Search, Plus, Eye, Send, CheckCircle2, AlertCircle, FileText,
  Calendar, Layers, Clock, Shield, Sparkles, Filter
} from 'lucide-react';
import { api } from '../api';

export default function DeanDashboardView({ user, currentView, onViewChange }) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentView === 'dean-dashboard') setActiveTab('overview');
    else if (currentView === 'dean-pinpoint') setActiveTab('pinpoint');
    else if (currentView === 'dean-presence') setActiveTab('presence');
    else if (currentView === 'dean-projects') setActiveTab('projects');
    else if (currentView === 'dean-posts') setActiveTab('post-directive');
    else if (currentView === 'dean-leaves') setActiveTab('leave');
  }, [currentView]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onViewChange) {
      const map = {
        overview: 'dean-dashboard',
        pinpoint: 'dean-pinpoint',
        presence: 'dean-presence',
        projects: 'dean-projects',
        'post-directive': 'dean-posts',
        leave: 'dean-leaves'
      };
      if (map[tabId]) onViewChange(map[tabId]);
    }
  };

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [pinpointData, setPinpointData] = useState(null);
  const [pinpointLoading, setPinpointLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [presenceData, setPresenceData] = useState(null);
  const [posts, setPosts] = useState([]);
  
  // Post modal / form state
  const [newPost, setNewPost] = useState({ title: '', content: '', scope: 'DEAN_CLUSTER', tag: 'Academic Directive' });
  const [postMsg, setPostMsg] = useState('');

  // Leave modal state
  const [newLeave, setNewLeave] = useState({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });
  const [leaveMsg, setLeaveMsg] = useState('');

  useEffect(() => {
    loadDeanData();
  }, []);

  const loadDeanData = async () => {
    try {
      setLoading(true);
      const data = await api.getDeanOverview();
      setOverview(data);
      if (data.departments && data.departments.length > 0) {
        setSelectedDeptId(data.departments[0].id);
        loadPinpoint(data.departments[0].id);
      }

      const projRes = await api.getProjects();
      setProjects(projRes.projects || []);

      const presRes = await api.getPresence();
      setPresenceData(presRes);

      const postsRes = await api.getPosts();
      setPosts(postsRes.deanPosts || []);
    } catch (err) {
      console.error('Failed to load dean data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPinpoint = async (deptId) => {
    try {
      setPinpointLoading(true);
      const res = await api.getDeanPinpoint(deptId);
      setPinpointData(res);
    } catch (err) {
      console.error('Failed to pinpoint department:', err);
    } finally {
      setPinpointLoading(false);
    }
  };

  const handleSelectDept = (deptId) => {
    setSelectedDeptId(deptId);
    loadPinpoint(deptId);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    try {
      await api.createPost(newPost);
      setPostMsg('Directive published successfully across cluster departments!');
      setNewPost({ title: '', content: '', scope: 'DEAN_CLUSTER', tag: 'Academic Directive' });
      const postsRes = await api.getPosts();
      setPosts(postsRes.deanPosts || []);
      setTimeout(() => setPostMsg(''), 4000);
    } catch (err) {
      setPostMsg('Error publishing post: ' + err.message);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.from_date || !newLeave.to_date || !newLeave.reason) return;
    try {
      await api.submitLeave(newLeave);
      setLeaveMsg('Leave request recorded and forwarded to Administrator!');
      setNewLeave({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });
      setTimeout(() => setLeaveMsg(''), 4000);
      loadDeanData();
    } catch (err) {
      setLeaveMsg('Error requesting leave: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #fecdd3', borderTopColor: '#dc143c', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ color: '#0f172a' }}>Loading Cluster Directorate Console...</h3>
        <p style={{ fontSize: '0.85rem' }}>Aggregating multi-department analytics, faculty rosters & R&D projects</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner: Dean Office */}
      <div style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #881337 50%, #dc143c 100%)',
        borderRadius: '16px',
        padding: '2rem 2.25rem',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(136, 19, 55, 0.25)',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            <Shield size={14} /> Cluster Directorate • Highest Academic Authority Above HOD
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            {overview?.dean?.title || 'Dean of Computing & Applied Sciences'}
          </h1>
          <p style={{ color: '#fecdd3', fontSize: '0.95rem', margin: 0, maxWidth: '720px' }}>
            Incumbent: <strong style={{ color: '#ffffff' }}>{overview?.dean?.name || user?.name}</strong> • Office: {overview?.dean?.officeRoom || 'Dean Suite A-101'} • Authority Scope: <strong>Computer Science Cluster & Inter-disciplinary Labs</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('pinpoint')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#881337',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Search size={18} /> Pinpoint Department
          </button>
          <button
            onClick={() => setActiveTab('post-directive')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Send size={18} /> Issue Directive
          </button>
        </div>
      </div>

      {/* Quick Cluster KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Cluster Departments</span>
            <Building2 size={20} color="#dc143c" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {overview?.stats?.clusterDeptCount || 0} <span style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}>Active</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            + {overview?.stats?.nonClusterDeptCount || 0} Non-Cluster Departments under observation
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Faculty Overseen</span>
            <Users size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {overview?.stats?.totalFaculty || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Across all cluster labs and lecture halls
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Cluster Student Roster</span>
            <GraduationCap size={20} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {overview?.stats?.totalStudents || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Across {overview?.stats?.totalClasses || 0} scheduled classes & sections
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Cluster Attendance Rate</span>
            <CheckCircle2 size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '0.5rem' }}>
            {overview?.stats?.overallAttendance || 92}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Strict 5-minute clock enforcement active
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'overview', label: 'Cluster vs Non-Cluster Overview', icon: Layers },
          { id: 'pinpoint', label: 'Pinpoint Department Deep-Dive', icon: Search },
          { id: 'projects', label: 'R&D Projects & Innovation', icon: Briefcase },
          { id: 'presence', label: 'Live Campus Presence Locator', icon: MapPin },
          { id: 'post-directive', label: 'Dean Directives & Posts', icon: Send },
          { id: 'leave', label: 'Dean Leave Portal', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                border: 'none',
                background: isActive ? '#fff1f2' : 'transparent',
                color: isActive ? '#dc143c' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #dc143c' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLUSTER OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cluster Departments Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#dc143c', color: '#fff', fontSize: '0.7rem' }}>CLUSTER</span>
                  Computer Science Cluster Departments (Dean Jurisdiction)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Departments under Dr. K. R. Shanmugam's direct governance with unified curricula, labs, and hackathon incubation.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Department Name & Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Department HOD</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Count</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Enrolled Students</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Classes & Sections</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview?.departments || []).filter(d => d.category === 'CLUSTER').map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#dc143c', fontWeight: 600 }}>Code: {d.code} • Computer Science Cluster</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{d.hod_name || 'HOD Appointed'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.hod_email || 'hod@college.edu'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{d.faculty_count || 12} Faculty</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{d.student_count || 120} Students</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{d.class_count || 4} Classes (2 Mentors Each)</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          onClick={() => {
                            handleSelectDept(d.id);
                            setActiveTab('pinpoint');
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            background: '#dc143c',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Search size={14} /> Pinpoint Deep-Dive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Non-Cluster Departments Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#475569', color: '#fff', fontSize: '0.7rem' }}>NON-CLUSTER</span>
                Non-Computer Science Departments
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Core engineering and science disciplines (ECE, Mechanical, Civil, etc.) with collaborative inter-cluster reporting.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Department Name & Code</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Department HOD</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Faculty Count</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Enrolled Students</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Classes</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview?.departments || []).filter(d => d.category === 'NON_CLUSTER').map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {d.code} • Non-Cluster</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>{d.hod_name || 'Assigned HOD'}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{d.faculty_count || 10} Faculty</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{d.student_count || 100} Students</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{d.class_count || 3} Classes</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          onClick={() => {
                            handleSelectDept(d.id);
                            setActiveTab('pinpoint');
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            background: '#334155',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Search size={14} /> Pinpoint Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PINPOINT DEPARTMENT DEEP-DIVE */}
      {activeTab === 'pinpoint' && (
        <div>
          {/* Department Picker Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#dc143c" /> Select Department to Pinpoint:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(overview?.departments || []).map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDept(dept.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    border: selectedDeptId === dept.id ? '2px solid #dc143c' : '1px solid #cbd5e1',
                    background: selectedDeptId === dept.id ? '#fff1f2' : '#ffffff',
                    color: selectedDeptId === dept.id ? '#991b1b' : '#334155',
                    fontWeight: selectedDeptId === dept.id ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {dept.name} ({dept.code})
                </button>
              ))}
            </div>
          </div>

          {pinpointLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Pinpointing department telemetry...</div>
          ) : pinpointData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Department Header Profile */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                      {pinpointData.department?.name}
                    </h2>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: pinpointData.department?.category === 'CLUSTER' ? '#dc143c' : '#475569', color: '#fff' }}>
                      {pinpointData.department?.category === 'CLUSTER' ? 'Computer Science Cluster' : 'Non-Cluster'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    Department Code: <strong>{pinpointData.department?.code}</strong> • Dean Jurisdiction Oversight
                  </p>
                </div>

                {pinpointData.hod && (
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Head of Department (HOD)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{pinpointData.hod.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#dc143c' }}>{pinpointData.hod.email} • {pinpointData.hod.phone || 'Intercom #402'}</div>
                  </div>
                )}
              </div>

              {/* Year Incharges (1st, 2nd, 3rd, 4th Year) */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    🎓 Year Incharges (1st, 2nd, 3rd, 4th Year Coordinators)
                  </h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
                  {[1, 2, 3, 4].map(yr => {
                    const incharge = (pinpointData.yearIncharges || []).find(yi => yi.year_level === yr);
                    return (
                      <div key={yr} style={{ padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: incharge ? '#fdf2f8' : '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#831843', fontSize: '0.85rem' }}>
                            {yr}{yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year Incharge
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: incharge ? '#059669' : '#94a3b8', color: '#fff', fontWeight: 600 }}>
                            {incharge ? 'Appointed' : 'Not Assigned'}
                          </span>
                        </div>
                        {incharge ? (
                          <>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{incharge.faculty_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {incharge.faculty_code} • {incharge.room_no || 'Incharge Cabin'}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>HOD can assign year incharge</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Classes with 2 Mentors */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    🏫 Department Classes & 2 Mentors Incharge Each
                  </h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Class / Section</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Room No</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Mentor 1 Incharge</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Mentor 2 Incharge</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pinpointData.classes || []).map(cls => (
                        <tr key={cls.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                            Year {cls.year_level} • Section {cls.section_name} (Sem {cls.semester_num})
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>Room {cls.room_no}</td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ fontWeight: 600, color: '#059669' }}>
                              {cls.mentor1_name ? `1. ${cls.mentor1_name}` : 'Mentor 1 Unassigned'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ fontWeight: 600, color: '#2563eb' }}>
                              {cls.mentor2_name ? `2. ${cls.mentor2_name}` : 'Mentor 2 Unassigned'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>{cls.enrolled_count || 60} Students</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Projects */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    🚀 Department Innovation & Capstone Projects
                  </h4>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  {(pinpointData.projects || []).length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No projects registered under this department yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                      {pinpointData.projects.map(p => (
                        <div key={p.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{p.title}</span>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontSize: '0.7rem', fontWeight: 700 }}>
                              {p.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.35rem' }}>
                            Category: <strong>{p.category}</strong> • Year {p.year_level}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                            Faculty Guide: <strong>{p.guide_name || 'Department Faculty'}</strong>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                            Team: {p.student_team}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: CLUSTER PROJECTS */}
      {activeTab === 'projects' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                💡 Cluster R&D, Hackathons & Innovation Projects
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Comprehensive tracker of all capstone and research projects across computer science cluster departments.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {projects.map(p => (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#fcfcfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fff1f2', color: '#991b1b' }}>
                    {p.department_code} • Year {p.year_level}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.status === 'COMPLETED' ? '#059669' : '#d97706' }}>
                    {p.status}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#0f172a' }}>{p.title}</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{p.description || 'AI/ML inter-departmental capstone initiative.'}</p>
                <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                  <div><strong>Guide:</strong> {p.guide_name || 'Prof. Guide'}</div>
                  <div style={{ marginTop: '0.2rem' }}><strong>Team:</strong> {p.student_team}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CAMPUS PRESENCE LOCATOR */}
      {activeTab === 'presence' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#dc143c" /> Real-Time Campus Presence & Timetable Locator
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Tracks whether Faculty, HODs, and Deans are <strong>On Leave</strong> (approved leave types) or <strong>Present</strong> (classroom room number & lecture slot vs department staffroom / cabin).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {(presenceData?.faculty || []).map(fac => {
              const isOnLeave = fac.status === 'ON_LEAVE';
              return (
                <div key={fac.faculty_id} style={{
                  padding: '1.1rem',
                  borderRadius: '10px',
                  border: isOnLeave ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                  background: isOnLeave ? '#fff5f5' : '#f0fdf4'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{fac.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fac.designation} • {fac.department_code}</div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: isOnLeave ? '#dc2626' : '#16a34a',
                      color: '#fff'
                    }}>
                      {fac.statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} color={isOnLeave ? '#dc2626' : '#16a34a'} />
                    {fac.location}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: DEAN DIRECTIVES & POSTS */}
      {activeTab === 'post-directive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Post Composer */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              📢 Publish Cluster Directive
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Directives published here will appear in the <strong>Dean Directives</strong> stream for all faculty and HODs under your cluster.
            </p>

            {postMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {postMsg}
              </div>
            )}

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Directive Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory Mid-Term Attendance Audit & Project Review"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category Tag
                </label>
                <select
                  value={newPost.tag}
                  onChange={(e) => setNewPost({ ...newPost, tag: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="Academic Directive">Academic Directive</option>
                  <option value="Attendance Policy">Attendance Policy</option>
                  <option value="Hackathon Notification">Hackathon Notification</option>
                  <option value="Lab & Equipment">Lab & Equipment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Directive Content / Notice Body
                </label>
                <textarea
                  rows={5}
                  placeholder="Detail instructions for HODs, faculty mentors, and students..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#dc143c',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Publish Cluster Directive
              </button>
            </form>
          </div>

          {/* Active Dean Directives List */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              Recent Dean Directives & Circulars
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map(p => (
                <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#dc143c', color: '#fff', fontWeight: 700 }}>
                      {p.tag}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', color: '#0f172a' }}>{p.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>{p.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DEAN LEAVE REQUEST */}
      {activeTab === 'leave' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
            📝 Dean Leave Application Portal
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
            When approved, the system updates the campus presence locator across all department screens to show: <strong>"On Leave: [Type]"</strong>.
          </p>

          {leaveMsg && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {leaveMsg}
            </div>
          )}

          <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Leave Type
              </label>
              <select
                value={newLeave.leave_type}
                onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="CASUAL">Casual Leave (CL)</option>
                <option value="ON_DUTY_GOVT">Academic / Government Committee OD</option>
                <option value="MEDICAL">Medical Leave</option>
                <option value="CONFERENCE">National / International Conference</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={newLeave.from_date}
                  onChange={(e) => setNewLeave({ ...newLeave, from_date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={newLeave.to_date}
                  onChange={(e) => setNewLeave({ ...newLeave, to_date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Reason & Official Justification
              </label>
              <textarea
                rows={3}
                placeholder="State reason for absence and officiating senior faculty/HOD in-charge..."
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: '#dc143c',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Submit Leave Request
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
