import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
  ArrowRight,
  BookOpen,
  Plus,
  Award,
  MapPin,
  Send,
  Shield,
  Search,
  Check,
  X,
  Layers,
  GraduationCap,
  Building2,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { api } from '../api';
import DepartmentHierarchyView from '../components/DepartmentHierarchyView';

export default function FacultyDashboardView({ user, currentView, onViewChange, onTakeAttendance, selectedDeptId, onSelectDeptId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingODs, setPendingODs] = useState([]);
  
  // Section Navigation: 'DEPARTMENT_SECTION' vs 'FACULTY_SECTION' vs 'STUDENT_SECTION' vs 'POSTS_SECTION'
  const [mainSection, setMainSection] = useState('FACULTY_SECTION');
  const [subTab, setSubTab] = useState('classes'); 
  // DEPARTMENT_SECTION: 'departments', 'year-incharge', 'dept-projects'
  // FACULTY_SECTION: 'classes', 'timetable', 'presence', 'leaves'
  // STUDENT_SECTION: 'students', 'add-student', 'hackathons', 'late-approvals', 'od'
  // POSTS_SECTION: 'all-posts'

  useEffect(() => {
    if (currentView === 'faculty-departments') {
      setMainSection('DEPARTMENT_SECTION');
      setSubTab('departments');
    } else if (currentView === 'faculty-year-incharge') {
      setMainSection('DEPARTMENT_SECTION');
      setSubTab('year-incharge');
    } else if (currentView === 'faculty-dept-projects') {
      setMainSection('DEPARTMENT_SECTION');
      setSubTab('dept-projects');
    } else if (currentView === 'faculty-dashboard') {
      setMainSection('FACULTY_SECTION');
      setSubTab('classes');
    } else if (currentView === 'faculty-timetable') {
      setMainSection('FACULTY_SECTION');
      setSubTab('timetable');
    } else if (currentView === 'faculty-presence') {
      setMainSection('FACULTY_SECTION');
      setSubTab('presence');
    } else if (currentView === 'faculty-leaves') {
      setMainSection('FACULTY_SECTION');
      setSubTab('leaves');
    } else if (currentView === 'faculty-students') {
      setMainSection('STUDENT_SECTION');
      setSubTab('students');
    } else if (currentView === 'faculty-hackathons') {
      setMainSection('STUDENT_SECTION');
      setSubTab('hackathons');
    } else if (currentView === 'faculty-mentors') {
      setMainSection('STUDENT_SECTION');
      setSubTab('students');
    } else if (currentView === 'faculty-posts') {
      setMainSection('POSTS_SECTION');
      setSubTab('all-posts');
    }
  }, [currentView]);

  // Data States
  const [students, setStudents] = useState([]);
  const [fullTimetable, setFullTimetable] = useState([]);
  const [presenceData, setPresenceData] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [postsStreams, setPostsStreams] = useState({ collegePublic: [], deanPosts: [], departmentHodPosts: [], departmentNews: [] });
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [yearIncharges, setYearIncharges] = useState([]);
  const [deptProjects, setDeptProjects] = useState([]);

  // Modals & Forms
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', register_no: '', phone: '', year_level: 2, semester_num: 3, class_id: '' });

  // Separate Edit Student Details State (Add Student is hidden when editing student details)
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState({ id: null, name: '', email: '', phone: '', register_no: '', year_level: 2, semester_num: 3, class_id: '' });

  const [showAddHackathonModal, setShowAddHackathonModal] = useState(false);
  const [newHackathon, setNewHackathon] = useState({ student_id: '', event_name: '', organizer: '', project_title: '', achievement: '1st Prize / Winner', cash_prize: '₹25,000', event_date: new Date().toISOString().split('T')[0] });

  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 'Monday', period_num: 1, start_time: '09:00', end_time: '09:50', subject_id: '', class_id: '', classroom: 'Room A204' });

  const [newLeave, setNewLeave] = useState({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });
  const [lateApprovalAction, setLateApprovalAction] = useState({ student_id: '', class_id: '', date: '', period: '', accepted: true, remarks: '' });

  const [verifyingId, setVerifyingId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const deptId = user?.department_id || user?.departmentId || 1;
      const [statsData, todayData, odsData, stuData, ttData, presData, hackData, postsData, classesData, subjectsData, yrData, projData] = await Promise.all([
        api.getFacultyStats(),
        api.getTodayTimetable(),
        api.getODRequests({ status: 'PENDING' }),
        api.getStudents(),
        api.getTimetable(),
        api.getPresence(),
        api.getHackathons(),
        api.getPosts(),
        api.getClasses(),
        api.getSubjects(),
        api.getHodYearIncharges(deptId).catch(() => []),
        api.getProjects(deptId).catch(() => ({ projects: [] }))
      ]);

      setStats(statsData);
      setTodayClasses(todayData.classes || []);
      setPendingODs(odsData || []);
      setStudents(stuData || []);
      setFullTimetable(ttData || []);
      setPresenceData(presData);
      setHackathons(hackData.hackathons || []);
      setPostsStreams(postsData);
      setClassesList(classesData.classes || []);
      setSubjectsList(subjectsData.subjects || []);
      setYearIncharges(yrData?.yearLevels || yrData?.incharges || (Array.isArray(yrData) ? yrData : []));
      setDeptProjects(projData?.projects || (Array.isArray(projData) ? projData : []));
    } catch (err) {
      console.error('Error loading faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyOD = async (odId, decision) => {
    try {
      setActionError('');
      await api.verifyOD(odId, decision, commentText || 'Verified by class faculty.');
      setActionSuccess(`OD request ${decision === 'APPROVE' ? 'verified and sent to HOD' : 'rejected'}.`);
      setVerifyingId(null);
      setCommentText('');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to process OD verification');
    }
  };

  // 1. Add Student (Only Faculty can add student details)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setActionError('');
      await api.createStudent({
        ...newStudent,
        department_id: user?.departmentId || 1
      });
      setActionSuccess(`Student ${newStudent.name} (${newStudent.register_no}) enrolled successfully!`);
      setShowAddStudentModal(false);
      setNewStudent({ name: '', email: '', register_no: '', phone: '', year_level: 2, semester_num: 3, class_id: '' });
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to enroll student');
    }
  };

  // 1b. Edit Student Details (Only Faculty can edit student details - Add Student is hidden here)
  const handleOpenEditStudent = (st) => {
    setEditingStudent({
      id: st.id,
      name: st.name || '',
      email: st.email || '',
      phone: st.phone || '',
      register_no: st.register_no || '',
      year_level: st.year_level || 2,
      semester_num: st.semester_num || 3,
      class_id: st.class_id ? String(st.class_id) : ''
    });
    setShowAddStudentModal(false); // Make sure Add Student modal is hidden
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setActionError('');
      await api.updateStudent(editingStudent.id, editingStudent);
      setActionSuccess(`Student ${editingStudent.name} (${editingStudent.register_no}) details updated successfully!`);
      setShowEditStudentModal(false);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update student details');
    }
  };

  // 2. Record Hackathon
  const handleRecordHackathon = async (e) => {
    e.preventDefault();
    try {
      setActionError('');
      await api.createHackathon(newHackathon);
      setActionSuccess(`Hackathon award for "${newHackathon.project_title}" successfully verified and recorded!`);
      setShowAddHackathonModal(false);
      setNewHackathon({ student_id: '', event_name: '', organizer: '', project_title: '', achievement: '1st Prize / Winner', cash_prize: '₹25,000', event_date: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to record hackathon');
    }
  };

  // 3. Arrange Staff Timetable
  const handleAddTimetableSlot = async (e) => {
    e.preventDefault();
    try {
      setActionError('');
      await api.createTimetable({
        ...newSlot,
        faculty_id: user?.facultyId
      });
      setActionSuccess(`Class timetable slot added for ${newSlot.day_of_week} Period ${newSlot.period_num}!`);
      setShowAddTimetableModal(false);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to add timetable entry');
    }
  };

  // 4. Request Faculty Leave
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      setActionError('');
      await api.submitLeave(newLeave);
      setActionSuccess('Faculty leave request recorded! Real-time campus presence updated.');
      setNewLeave({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to request leave');
    }
  };

  // 5. Accept Late Student Reason (After 5 Minutes)
  const handleApproveLateReason = async (studentId, classId, date, period, accepted) => {
    try {
      setActionError('');
      const res = await api.approveLateReason({
        student_id: studentId,
        class_id: classId,
        date,
        period,
        accepted,
        remarks: accepted ? 'Late reason accepted by Period Faculty / Mentor. Granted PRESENT.' : 'Rejected late reason.'
      });
      setActionSuccess(res.message);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to approve late reason');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#dc143c' }} />
        <p>Loading faculty portal & class schedule...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Faculty Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #dc143c 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fecdd3', fontWeight: 700 }}>
            FACULTY PORTAL • {user?.department_name || 'Department of AI & DS'}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0' }}>
            Prof. {user?.name}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#fecdd3', margin: 0 }}>
            {user?.designation} • ID: <strong>{user?.faculty_code || 'FAC-AD01'}</strong> • Access Scoped to: <strong>Faculty Section & Student Section</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => {
              setMainSection('STUDENT_SECTION');
              setShowAddStudentModal(true);
            }}
            style={{ padding: '0.6rem 1.15rem', background: '#ffffff', color: '#881337', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Plus size={16} /> Enroll Student
          </button>
          <button
            onClick={() => {
              setMainSection('STUDENT_SECTION');
              setShowAddHackathonModal(true);
            }}
            style={{ padding: '0.6rem 1.15rem', background: '#fef08a', color: '#854d0e', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Award size={16} /> Record Hackathon
          </button>
          <button
            onClick={() => {
              setMainSection('FACULTY_SECTION');
              setShowAddTimetableModal(true);
            }}
            style={{ padding: '0.6rem 1.15rem', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Calendar size={16} /> Arrange Timetable
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', marginBottom: '1.25rem', fontWeight: 600 }}>
          ✓ {actionSuccess}
        </div>
      )}

      {actionError && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', marginBottom: '1.25rem', fontWeight: 600 }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* TOP-LEVEL MANDATORY SECTION SWITCHER: FACULTY SECTION vs STUDENT SECTION vs POSTS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <button
          onClick={() => {
            setMainSection('FACULTY_SECTION');
            setSubTab('classes');
          }}
          style={{
            flex: 1,
            padding: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'FACULTY_SECTION' ? '#dc143c' : 'transparent',
            color: mainSection === 'FACULTY_SECTION' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={18} /> FACULTY SECTION (My Timetable, Presence & Leave)
        </button>

        <button
          onClick={() => {
            setMainSection('STUDENT_SECTION');
            setSubTab('students');
          }}
          style={{
            flex: 1,
            padding: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'STUDENT_SECTION' ? '#dc143c' : 'transparent',
            color: mainSection === 'STUDENT_SECTION' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <GraduationCap size={18} /> STUDENT SECTION (Roster, Hackathons, 2 Mentors & Attendance)
        </button>

        <button
          onClick={() => {
            setMainSection('POSTS_SECTION');
          }}
          style={{
            flex: 1,
            padding: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'POSTS_SECTION' ? '#dc143c' : 'transparent',
            color: mainSection === 'POSTS_SECTION' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Send size={18} /> POSTS & CIRCULARS (Dean, HOD, College & News)
        </button>

        <button
          onClick={() => {
            setMainSection('DEPARTMENT_SECTION');
            setSubTab('departments');
          }}
          style={{
            flex: 1,
            padding: '0.85rem',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'DEPARTMENT_SECTION' ? '#dc143c' : 'transparent',
            color: mainSection === 'DEPARTMENT_SECTION' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={18} /> DEPARTMENT SECTION (Department Hierarchy, Incharges & R&D)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 0. DEPARTMENT SECTION (Department Hierarchy, Incharges & Projects) */}
      {/* ========================================================================= */}
      {mainSection === 'DEPARTMENT_SECTION' && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'departments', label: '🏛️ Department Hierarchy & Classes', icon: Building2, highlight: true },
              { id: 'year-incharge', label: '1st - 4th Yr Incharges', icon: ShieldCheck },
              { id: 'dept-projects', label: `Department Projects & R&D (${deptProjects.length})`, icon: Briefcase }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.7rem 1.25rem',
                    border: 'none',
                    background: subTab === tab.id ? '#fff1f2' : tab.highlight ? '#fff5f6' : 'transparent',
                    color: subTab === tab.id ? '#dc143c' : tab.highlight ? '#be123c' : '#64748b',
                    fontWeight: subTab === tab.id ? 700 : 500,
                    fontSize: '0.85rem',
                    borderBottom: subTab === tab.id ? '2px solid #dc143c' : '2px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {subTab === 'departments' && (
            <DepartmentHierarchyView user={user} initialDeptId={selectedDeptId} onDeptChange={onSelectDeptId} />
          )}

          {subTab === 'year-incharge' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} color="#dc143c" /> Academic Year In-Charges (1st to 4th Year)
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Year coordinators overseeing student welfare, academic discipline, and timetable coordination across all four batches.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3, 4].map(yr => {
                  const incharge = yearIncharges.find(yi => yi.year_level === yr);
                  return (
                    <div key={yr} style={{ padding: '1.25rem', borderRadius: '12px', border: '1.5px solid var(--border)', background: incharge ? 'linear-gradient(135deg, #fff5f6 0%, #ffffff 100%)' : '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc143c', textTransform: 'uppercase' }}>Year {yr}</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: incharge ? '#dcfce7' : '#f1f5f9', color: incharge ? '#166534' : '#64748b', fontWeight: 700 }}>
                          {incharge ? 'Coordinator Active' : 'Unassigned'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {incharge?.faculty_name || 'Year Coordinator'}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>Code: <strong style={{ color: '#0f172a' }}>{incharge?.faculty_code || `FAC-Y${yr}`}</strong></span>
                        <span>Email: {incharge?.faculty_email || 'faculty@college.edu'}</span>
                        <span>Office: {incharge?.room_no || 'Cabin A-102'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subTab === 'dept-projects' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={22} color="#dc143c" /> Department Projects & Innovation R&D
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Student capstone, mini-projects, and patent/paper submissions under faculty mentorship.
                  </p>
                </div>
              </div>

              {deptProjects.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No projects recorded yet for this department.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {deptProjects.map(proj => (
                    <div key={proj.id} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: '#fff1f2', color: '#dc143c', fontWeight: 700 }}>
                          {proj.category}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Year {proj.year_level}</span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                        {proj.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 0.75rem 0' }}>
                        {proj.description || 'Innovative college project led by student team.'}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#475569', borderTop: '1px solid var(--border)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Team: <strong>{proj.student_team}</strong></span>
                        <span>Guide: <strong>{proj.guide_name || 'Prof. Faculty'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FACULTY SECTION */}
      {/* ========================================================================= */}
      {mainSection === 'FACULTY_SECTION' && (
        <div>
          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            {[
              { id: 'classes', label: "Today's Teaching Schedule & Mark Attendance" },
              { id: 'timetable', label: 'Arrange / Edit My Timetable' },
              { id: 'presence', label: 'Staff Room & Campus Presence' },
              { id: 'leaves', label: 'My Leave Requests' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  padding: '0.7rem 1.25rem',
                  border: 'none',
                  background: subTab === tab.id ? '#fff1f2' : 'transparent',
                  color: subTab === tab.id ? '#dc143c' : '#64748b',
                  fontWeight: subTab === tab.id ? 700 : 500,
                  fontSize: '0.85rem',
                  borderBottom: subTab === tab.id ? '2px solid #dc143c' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Tab 1: Today's Teaching Schedule */}
          {subTab === 'classes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Quick Banner: 14 College Departments Explorer */}
              <div style={{
                background: 'linear-gradient(135deg, #4c0519 0%, #881337 60%, #dc143c 100%)',
                color: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(220, 20, 60, 0.25)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <Building2 size={13} /> College Academic Structure
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    14 Academic Departments in College
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#fecdd3' }}>
                    Explore all 14 college departments, HOD details, faculty rosters, 1st - 4th year class performances, and live department chats.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMainSection('DEPARTMENT_SECTION');
                    setSubTab('departments');
                  }}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    background: '#ffffff',
                    color: '#dc143c',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Browse 14 Departments Directory →
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Today's Teaching Lectures
                    </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Click <strong>"Mark Attendance"</strong> to open the live roll call with 5-minute clock and late reason acceptance.
                  </p>
                </div>
              </div>

              {todayClasses.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No classes scheduled for you today. You can arrange new timetable slots in the next tab.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {todayClasses.map(cls => (
                    <div
                      key={cls.timetable_id}
                      style={{
                        border: cls.isAttendanceMarked ? '1px solid #e2e8f0' : '2px solid #dc143c',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        background: '#ffffff',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fff1f2', color: '#991b1b' }}>
                            Period {cls.period_num} • {cls.start_time} - {cls.end_time}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                            Room {cls.classroom || cls.room_no}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {cls.subject_name}
                        </h3>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#64748b' }}>
                          Code: {cls.subject_code} • Year {cls.year_level} - {cls.section_name} ({cls.enrolled_students_count || 60} Students)
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {cls.isAttendanceMarked ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
                            <CheckCircle size={16} /> Recorded
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#dc143c', fontSize: '0.82rem', fontWeight: 700 }}>
                            <Clock size={16} /> Ready to Mark
                          </span>
                        )}

                        <button
                          onClick={() => onTakeAttendance({
                            classId: cls.class_id,
                            subjectId: cls.subject_id,
                            date: cls.todayDate,
                            period: cls.period_num
                          })}
                          style={{
                            padding: '0.55rem 1.15rem',
                            borderRadius: '8px',
                            background: '#dc143c',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                          }}
                        >
                          <CalendarCheck size={16} /> {cls.isAttendanceMarked ? 'Update Attendance' : 'Mark Attendance'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          )}

          {/* Sub Tab 2: Arrange / Edit Timetable */}
          {subTab === 'timetable' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Arrange & Create Staff Timetable
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Each staff member can configure and create their own timetable according to their assigned classes.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTimetableModal(true)}
                  style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Add Timetable Slot
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Day of Week</th>
                      <th>Period</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Class & Section</th>
                      <th>Classroom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullTimetable.filter(t => t.faculty_id === user?.facultyId).map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{t.day_of_week}</td>
                        <td style={{ fontWeight: 700, color: '#dc143c' }}>Period {t.period_num}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.start_time} - {t.end_time}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{t.subject_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.subject_code}</div>
                        </td>
                        <td>Year {t.year_level} - {t.section_name}</td>
                        <td style={{ fontWeight: 600 }}>{t.classroom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab 3: Staffroom & Presence */}
          {subTab === 'presence' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={22} color="#dc143c" /> Real-Time Staff Room & Campus Presence
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Live portal displaying where staff are located right now according to their class timetable or department staffroom cabin.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fac.faculty_code} • {fac.department_code}</div>
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

          {/* Sub Tab 4: Faculty Leave Requests */}
          {subTab === 'leaves' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                📝 Faculty Leave Application
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
                When submitted, your presence status will automatically show <strong>"On Leave: [Type]"</strong> for HOD and students.
              </p>

              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Leave Type</label>
                  <select
                    value={newLeave.leave_type}
                    onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="CASUAL">Casual Leave (CL)</option>
                    <option value="MEDICAL">Medical Leave</option>
                    <option value="ON_DUTY_VALUATION">Anna University Valuation / External OD</option>
                    <option value="COMPENSATORY">Compensatory Off</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>From Date</label>
                    <input
                      type="date"
                      value={newLeave.from_date}
                      onChange={(e) => setNewLeave({ ...newLeave, from_date: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>To Date</label>
                    <input
                      type="date"
                      value={newLeave.to_date}
                      onChange={(e) => setNewLeave({ ...newLeave, to_date: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Reason & Alternate Class Handling Faculty</label>
                  <textarea
                    rows={3}
                    placeholder="Specify reason and which colleague is taking over your scheduled lectures..."
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{ padding: '0.75rem', borderRadius: '8px', background: '#dc143c', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Submit Leave Request
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STUDENT SECTION */}
      {/* ========================================================================= */}
      {mainSection === 'STUDENT_SECTION' && (
        <div>
          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'students', label: `Student Roster (${students.length})` },
              { id: 'hackathons', label: `Student Hackathons (${hackathons.length})` },
              { id: 'mentors', label: 'Class 2 Mentors List' },
              { id: 'od', label: `OD Verifications (${pendingODs.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  padding: '0.7rem 1.25rem',
                  border: 'none',
                  background: subTab === tab.id ? '#fff1f2' : 'transparent',
                  color: subTab === tab.id ? '#dc143c' : '#64748b',
                  fontWeight: subTab === tab.id ? 700 : 500,
                  fontSize: '0.85rem',
                  borderBottom: subTab === tab.id ? '2px solid #dc143c' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Tab 1: Student Roster */}
          {subTab === 'students' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Enrolled Students in Department
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Only faculty can add new students and edit their details manually. All student records are uploaded manually.
                  </p>
                </div>
                {/* Make Add Student button hidden when in Edit Student Details mode */}
                {!showEditStudentModal && (
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Add Student Details
                  </button>
                )}
              </div>

              {students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Users size={44} style={{ margin: '0 auto 0.75rem', color: '#94a3b8' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>No Students Enrolled Yet</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                    All previous demo details have been removed. Only faculty members have permission to manually enroll and edit student details for this department.
                  </p>
                  {!showEditStudentModal && (
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      style={{ padding: '0.65rem 1.35rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={16} /> + Add First Student
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Register No</th>
                        <th>Student Name</th>
                        <th>Year / Section</th>
                        <th>Email & Phone</th>
                        <th>Attended / Total</th>
                        <th>Attendance %</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(st => (
                        <tr key={st.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{st.register_no}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                          <td>Year {st.year_level} - {st.section_name || 'A'}</td>
                          <td>
                            <div>{st.email}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.phone || 'N/A'}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{st.attendedClasses || 0} / {st.totalClasses || 0}</td>
                          <td>
                            <span style={{ fontWeight: 800, color: st.attendancePercentage >= 75 ? '#059669' : '#dc2626' }}>
                              {st.attendancePercentage}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenEditStudent(st)}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: '6px',
                                border: '1px solid #dc143c',
                                background: '#fff1f2',
                                color: '#9f1239',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              Edit Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab 2: Hackathons */}
          {subTab === 'hackathons' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={22} color="#d97706" /> Student Hackathon Achievements & Awards
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Faculty can add student hackathons, awards, cash prizes, and organizer verification.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddHackathonModal(true)}
                  style={{ padding: '0.6rem 1.15rem', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Record Hackathon
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {hackathons.map(h => (
                  <div key={h.id} style={{ border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem', background: '#fffbeb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#d97706', color: '#fff' }}>
                        {h.achievement}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>
                        {h.cash_prize}
                      </span>
                    </div>

                    <h3 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#78350f' }}>
                      {h.event_name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#92400e', marginBottom: '0.5rem' }}>
                      Organizer: <strong>{h.organizer}</strong> • Date: {h.event_date}
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '0.82rem' }}>
                      <div><strong>Project:</strong> {h.project_title}</div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <strong>Student:</strong> {h.student_name} ({h.register_no})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab 3: Class Mentors */}
          {subTab === 'mentors' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Class Mentors In-Charge (2 Mentors Per Class)
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Each class section has <strong>Mentor 1 and Mentor 2</strong> responsible for tracking attendance, late justifications, and OD verification.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Class & Section</th>
                      <th>Room No</th>
                      <th>Mentor 1 Incharge</th>
                      <th>Mentor 2 Incharge</th>
                      <th>Enrolled Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classesList.map(cls => (
                      <tr key={cls.id}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          Year {cls.year_level} - Section {cls.section_name}
                        </td>
                        <td>{cls.room_no}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#059669' }}>
                            {cls.mentor1_name ? `1. ${cls.mentor1_name}` : 'Mentor 1'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>
                            {cls.mentor2_name ? `2. ${cls.mentor2_name}` : 'Mentor 2'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{cls.enrolled_count || 60} Students</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab 4: OD Verification Queue */}
          {subTab === 'od' && (
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
                Pending Student On-Duty (OD) Verification Queue
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Event Details</th>
                      <th>Date & Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingODs.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No pending OD applications for verification.</td></tr>
                    ) : (
                      pendingODs.map(od => (
                        <tr key={od.id}>
                          <td style={{ fontWeight: 700 }}>{od.student_name} ({od.register_no})</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{od.event_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{od.reason} • {od.location}</div>
                          </td>
                          <td>{od.date} ({od.from_time} - {od.to_time})</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleVerifyOD(od.id, 'APPROVE')}
                                style={{ padding: '0.4rem 0.75rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Verify & Forward
                              </button>
                              <button
                                onClick={() => handleVerifyOD(od.id, 'REJECT')}
                                style={{ padding: '0.4rem 0.75rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. POSTS & CIRCULARS (4 Streams: Dean, Dept HOD, College Public, Dept News) */}
      {/* ========================================================================= */}
      {mainSection === 'POSTS_SECTION' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Stream 1: Dean Directives */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #fecdd3', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#dc143c', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                DEAN DIRECTIVES
              </span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Cluster Dean Orders</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(postsStreams.deanPosts || []).length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No recent Dean directives.</div>
              ) : (
                postsStreams.deanPosts.map(p => (
                  <div key={p.id} style={{ border: '1px solid #fee2e2', borderRadius: '8px', padding: '1rem', background: '#fff5f5' }}>
                    <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>{p.tag} • By {p.author_name}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '0.25rem 0' }}>{p.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{p.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 2: Department HOD Notices */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e0e7ff', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#3730a3', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                OUR DEPT HOD
              </span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Department Notices</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(postsStreams.departmentHodPosts || []).length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No department-only notices.</div>
              ) : (
                postsStreams.departmentHodPosts.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e0e7ff', borderRadius: '8px', padding: '1rem', background: '#f5f3ff' }}>
                    <div style={{ fontSize: '0.72rem', color: '#3730a3', fontWeight: 700 }}>{p.tag} • By HOD {p.author_name}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '0.25rem 0' }}>{p.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{p.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 3: College Public Posts */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #bbf7d0', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                PUBLIC CIRCULARS
              </span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>College Public Notices</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(postsStreams.collegePublic || []).length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No public circulars.</div>
              ) : (
                postsStreams.collegePublic.map(p => (
                  <div key={p.id} style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', background: '#f0fdf4' }}>
                    <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>{p.tag} • College Administration</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '0.25rem 0' }}>{p.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{p.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 4: Other Department News */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #fed7aa', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#ea580c', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                OTHER DEPTS
              </span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Campus Department News</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(postsStreams.departmentNews || []).length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No news from other departments.</div>
              ) : (
                postsStreams.departmentNews.map(p => (
                  <div key={p.id} style={{ border: '1px solid #fed7aa', borderRadius: '8px', padding: '1rem', background: '#fff7ed' }}>
                    <div style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 700 }}>{p.department_name || 'Other Department'} • {p.tag}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '0.25rem 0' }}>{p.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>{p.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD STUDENT DETAILS */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Enroll Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Full Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. S. Karthikeyan"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AD320"
                    value={newStudent.register_no}
                    onChange={(e) => setNewStudent({ ...newStudent, register_no: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Student Email</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Year Level</label>
                  <select
                    value={newStudent.year_level}
                    onChange={(e) => setNewStudent({ ...newStudent, year_level: Number(e.target.value), semester_num: Number(e.target.value) * 2 - 1 })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Assign Class Section</label>
                  <select
                    value={newStudent.class_id}
                    onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Class --</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>Year {c.year_level} - Sec {c.section_name} ({c.room_no})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enroll Student
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1B: EDIT STUDENT DETAILS (Only faculty can edit; Add Student is hidden) */}
      {/* ========================================================================= */}
      {showEditStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc143c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FACULTY EDIT MODE
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Edit Student Details
                </h3>
              </div>
              <button onClick={() => setShowEditStudentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Full Student Name</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Register Number</label>
                  <input
                    type="text"
                    value={editingStudent.register_no}
                    onChange={(e) => setEditingStudent({ ...editingStudent, register_no: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Student Email</label>
                  <input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Academic Year Level</label>
                  <select
                    value={editingStudent.year_level}
                    onChange={(e) => setEditingStudent({ ...editingStudent, year_level: Number(e.target.value), semester_num: Number(e.target.value) * 2 - 1 })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Assigned Class Section</label>
                  <select
                    value={editingStudent.class_id}
                    onChange={(e) => setEditingStudent({ ...editingStudent, class_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Class --</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>Year {c.year_level} - Sec {c.section_name} ({c.room_no})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Student Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD HACKATHON */}
      {/* ========================================================================= */}
      {showAddHackathonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#78350f' }}>Record Student Hackathon Achievement</h3>
              <button onClick={() => setShowAddHackathonModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordHackathon} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Participating Student</label>
                <select
                  value={newHackathon.student_id}
                  onChange={(e) => setNewHackathon({ ...newHackathon, student_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.register_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. Smart India Hackathon (SIH 2026)"
                  value={newHackathon.event_name}
                  onChange={(e) => setNewHackathon({ ...newHackathon, event_name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Organizer Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Madras / AICTE"
                    value={newHackathon.organizer}
                    onChange={(e) => setNewHackathon({ ...newHackathon, organizer: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Award / Achievement</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Place / Runner-up"
                    value={newHackathon.achievement}
                    onChange={(e) => setNewHackathon({ ...newHackathon, achievement: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Crop Disease Diagnoser"
                    value={newHackathon.project_title}
                    onChange={(e) => setNewHackathon({ ...newHackathon, project_title: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Cash Prize (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000"
                    value={newHackathon.cash_prize}
                    onChange={(e) => setNewHackathon({ ...newHackathon, cash_prize: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Verify & Save Achievement
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHackathonModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ARRANGE TIMETABLE SLOT */}
      {/* ========================================================================= */}
      {showAddTimetableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Create Staff Timetable Slot</h3>
              <button onClick={() => setShowAddTimetableModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddTimetableSlot} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Day of Week</label>
                  <select
                    value={newSlot.day_of_week}
                    onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Period Number</label>
                  <select
                    value={newSlot.period_num}
                    onChange={(e) => setNewSlot({ ...newSlot, period_num: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Start Time</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>End Time</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Subject</label>
                <select
                  value={newSlot.subject_id}
                  onChange={(e) => setNewSlot({ ...newSlot, subject_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Class Section</label>
                  <select
                    value={newSlot.class_id}
                    onChange={(e) => setNewSlot({ ...newSlot, class_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>Year {c.year_level} - Sec {c.section_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Classroom</label>
                  <input
                    type="text"
                    placeholder="e.g. Room A204"
                    value={newSlot.classroom}
                    onChange={(e) => setNewSlot({ ...newSlot, classroom: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save to My Timetable
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTimetableModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
