import React, { useState, useEffect } from 'react';
import {
  Award,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  PlusCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  MapPin,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import { api } from '../api';

export default function StudentDashboardView({ user, currentView, onViewChange }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timetableData, setTimetableData] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [odList, setOdList] = useState([]);
  const [lateReportsList, setLateReportsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentTab, setStudentTab] = useState('overview');

  useEffect(() => {
    if (currentView === 'student-dashboard') setStudentTab('overview');
    else if (currentView === 'student-od') setStudentTab('od');
    else if (currentView === 'student-leaves') setStudentTab('leaves');
    else if (currentView === 'student-late-report') setStudentTab('late-report');
    else if (currentView === 'student-projects') setStudentTab('projects');
    else if (currentView === 'student-timetable') setStudentTab('timetable');
  }, [currentView]);

  const handleTabChange = (tabId) => {
    setStudentTab(tabId);
    if (onViewChange) {
      const map = {
        overview: 'student-dashboard',
        od: 'student-od',
        leaves: 'student-leaves',
        'late-report': 'student-late-report',
        projects: 'student-projects',
        timetable: 'student-timetable'
      };
      if (map[tabId]) onViewChange(map[tabId]);
    }
  };
  
  // Modals
  const [showODModal, setShowODModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [showPostProjectModal, setShowPostProjectModal] = useState(false);
  const [selectedSubjectHistory, setSelectedSubjectHistory] = useState(null);

  // Forms
  const [odForm, setOdForm] = useState({
    event_name: '',
    reason: '',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    from_time: '09:00',
    to_time: '17:00',
    document_url: ''
  });

  const [corrForm, setCorrForm] = useState({
    date: new Date().toISOString().split('T')[0],
    subject_id: '',
    current_status: 'ABSENT',
    requested_status: 'PRESENT',
    reason: '',
    document_url: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'CASUAL',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [lateForm, setLateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    period: 1,
    late_reason: '',
    faculty_id: ''
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Mini Project',
    year_level: 2,
    faculty_guide_id: '',
    student_team: '',
    github_url: '',
    description: ''
  });
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, tt, lv, ods, lates, projs, facs] = await Promise.all([
        api.getStudentDashboardStats(),
        api.getTodayTimetable(),
        api.getLeaves('my').catch(() => ({ leaves: [] })),
        api.getODRequests().catch(() => []),
        api.getStudentLateReports().catch(() => []),
        api.getProjects().catch(() => ({ projects: [] })),
        api.getFaculty().catch(() => [])
      ]);

      setDashboardData(dash);
      setTimetableData(tt.classes || []);
      setLeaveList(lv.leaves || []);
      setOdList(ods || []);
      setLateReportsList(lates || []);
      setProjectsList(projs.projects || []);
      setFacultyList(facs || []);

      if (dash?.student) {
        setProjectForm(prev => ({
          ...prev,
          year_level: dash.student.year_level || 2,
          student_team: `${dash.student.name} (${dash.student.register_no})`
        }));
      }

      if (dash.subjectBreakdown.length > 0 && !corrForm.subject_id) {
        setCorrForm(prev => ({ ...prev, subject_id: String(dash.subjectBreakdown[0].subject_id) }));
      }
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyOD = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.applyOD(odForm);
      setMessage('On-Duty application submitted successfully! It is now pending faculty verification.');
      setShowODModal(false);
      setOdForm({
        event_name: '',
        reason: '',
        location: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        from_time: '09:00',
        to_time: '17:00',
        document_url: ''
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit OD application');
    }
  };

  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.applyCorrection(corrForm);
      setMessage('Attendance correction request submitted for verification.');
      setShowCorrectionModal(false);
      setCorrForm(prev => ({ ...prev, reason: '', document_url: '' }));
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit correction request');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.submitLeave(leaveForm);
      setMessage('Leave request submitted successfully. Recorded under your profile.');
      setShowLeaveModal(false);
      setLeaveForm({
        leave_type: 'CASUAL',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    }
  };

  const handleReportLate = async (e) => {
    e.preventDefault();
    if (!lateForm.late_reason.trim()) {
      setError('Please provide your reason for arriving late');
      return;
    }
    try {
      setError('');
      const studentId = dashboardData?.student?.id;
      const classId = dashboardData?.student?.class_id || 1;
      const selectedPeriod = Number(lateForm.period);

      // Find staff in charge for that period from today's timetable
      const periodSlot = timetableData.find(t => t.period_num === selectedPeriod);
      const facultyId = lateForm.faculty_id || periodSlot?.faculty_id;

      const res = await api.reportLateReason({
        student_id: studentId,
        class_id: classId,
        date: lateForm.date,
        period: selectedPeriod,
        faculty_id: facultyId,
        late_reason: lateForm.late_reason
      });

      setMessage(res.message || `Late reason sent to staff in charge of Period ${selectedPeriod} for attendance review.`);
      setShowLateModal(false);
      setLateForm({
        date: new Date().toISOString().split('T')[0],
        period: 1,
        late_reason: '',
        faculty_id: ''
      });
      const lates = await api.getStudentLateReports().catch(() => []);
      setLateReportsList(lates || []);
      await loadData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit late arrival reason');
    }
  };

  const handlePostProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      setError('Please provide a project title');
      return;
    }
    try {
      setProjectSubmitting(true);
      setError('');
      await api.createProject({
        ...projectForm,
        year_level: Number(projectForm.year_level) || dashboardData?.student?.year_level || 2,
        department_id: dashboardData?.student?.department_id || 1,
        student_team: projectForm.student_team.trim() || dashboardData?.student?.name || user?.name
      });
      setMessage('Project posted successfully to your student projects tab!');
      setShowPostProjectModal(false);
      setProjectForm({
        title: '',
        category: 'Mini Project',
        year_level: dashboardData?.student?.year_level || 2,
        faculty_guide_id: '',
        student_team: dashboardData?.student ? `${dashboardData.student.name} (${dashboardData.student.register_no})` : '',
        github_url: '',
        description: ''
      });
      const projs = await api.getProjects().catch(() => ({ projects: [] }));
      setProjectsList(projs.projects || []);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to post project');
    } finally {
      setProjectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#dc143c' }} />
        <p>Loading your academic profile and attendance records...</p>
      </div>
    );
  }

  const { student, overall, subjectBreakdown, recentAttendance, recentOD } = dashboardData;

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Student Welcome Banner (Prompt Requirement 20) */}
      <div style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #991b1b 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fecdd3', fontWeight: 700 }}>
            STUDENT PORTAL • {student?.department_name}
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
            WELCOME, {student?.name?.toUpperCase()}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.35rem', fontSize: '0.88rem', color: '#e2e8f0' }}>
            <span><strong>Register No:</strong> {student?.register_no}</span>
            <span>•</span>
            <span>Year {student?.year_level} / Sem {student?.semester_num} - {student?.section_name}</span>
            <span>•</span>
            <span>Room: {student?.room_no}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowLeaveModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              background: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)'
            }}
          >
            <Calendar size={15} />
            REQUEST LEAVE
          </button>

          <button
            onClick={() => setShowLateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              background: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
            }}
          >
            <Clock size={15} />
            REPORT LATE ARRIVAL
          </button>

          <button
            onClick={() => setShowODModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              background: '#d97706',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
            }}
          >
            <PlusCircle size={15} />
            APPLY OD
          </button>

          <button
            onClick={() => setShowCorrectionModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            <FileCheck2 size={15} />
            Correction
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✓ {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', marginBottom: '1.5rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Student View Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Attendance & Schedule' },
          { id: 'timetable', label: 'Class Timetable' },
          { id: 'presence', label: 'Campus Presence Tracker' },
          { id: 'hackathons', label: 'My Hackathons & Projects' },
          { id: 'posts', label: 'Announcements & News' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: studentTab === tab.id ? 'var(--red-ruby)' : '#64748b',
              borderBottom: studentTab === tab.id ? '2px solid var(--red-ruby)' : '2px solid transparent',
              background: studentTab === tab.id ? 'var(--red-mist)' : 'none',
              borderRadius: '8px 8px 0 0',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {studentTab === 'overview' && (
        <>
      {/* LOW ATTENDANCE WARNING BANNER (Prompt Requirement 23) */}
      {overall.isLowAttendance && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}>
          <AlertTriangle size={32} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>
              WARNING: Your attendance is below the required {overall.minRequired}%.
            </div>
            <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.2rem' }}>
              Your current attendance stands at <strong>{overall.percentage}%</strong>. As per university regulations, students below {overall.minRequired}% are ineligible for semester end examinations. Please meet your faculty advisor.
            </div>
          </div>
        </div>
      )}

      {/* OVERALL ATTENDANCE SUMMARY (Prompt Requirement 19, 20) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Attendance Percentage Dial */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Attendance
          </div>

          <div style={{
            margin: '1.25rem 0',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: overall.percentage >= overall.minRequired
              ? 'conic-gradient(#16a34a 0% ' + overall.percentage + '%, #e2e8f0 ' + overall.percentage + '% 100%)'
              : 'conic-gradient(#dc2626 0% ' + overall.percentage + '%, #e2e8f0 ' + overall.percentage + '% 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '104px',
              height: '104px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: overall.percentage >= overall.minRequired ? '#16a34a' : '#dc2626' }}>
                {overall.percentage}%
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>CUMULATIVE</span>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#475569' }}>
            Formula: <code>(Present + Approved OD) / Total × 100</code>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fff1f2', color: '#dc143c' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Classes</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{overall.totalClasses}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Present</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{overall.present}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <XCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>Absent</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{overall.absent}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>Approved OD</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{overall.od}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S TIMETABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          Today's Timetable & Schedule
        </h2>

        {timetableData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>No lectures scheduled for today.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {timetableData.map(cls => (
              <div key={cls.timetable_id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#dc143c', marginBottom: '0.35rem' }}>
                  <span>Period {cls.period_num}</span>
                  <span>{cls.start_time} - {cls.end_time}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{cls.subject_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Prof. {cls.faculty_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem', fontWeight: 600 }}>Room: {cls.classroom}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBJECT-WISE ATTENDANCE (Prompt Requirement 21) */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Subject-wise Attendance Breakdown
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Click on any subject to inspect detailed lecture attendance logs.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Credits</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center', color: '#16a34a' }}>Present</th>
                <th style={{ textAlign: 'center', color: '#dc2626' }}>Absent</th>
                <th style={{ textAlign: 'center', color: '#d97706' }}>OD</th>
                <th style={{ width: '180px' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {subjectBreakdown.map(sub => {
                const isBelowMin = sub.percentage < overall.minRequired && sub.total > 0;
                return (
                  <tr
                    key={sub.subject_id}
                    onClick={() => setSelectedSubjectHistory(sub)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {sub.subject_name}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#dc143c' }}>
                      {sub.subject_code}
                    </td>
                    <td>{sub.credits}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{sub.total}</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{sub.present}</td>
                    <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{sub.absent}</td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 700 }}>{sub.od}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(100, sub.percentage)}%`,
                              background: isBelowMin ? '#dc2626' : '#16a34a'
                            }}
                          />
                        </div>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: isBelowMin ? '#dc2626' : '#16a34a',
                          width: '45px',
                          textAlign: 'right'
                        }}>
                          {sub.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ATTENDANCE HISTORY & RECENT OD REQUESTS */}
      {/* ATTENDANCE HISTORY, OD REQUESTS & LEAVES TRACKER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Recent Attendance (Prompt Requirement 22) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Recent Lecture History
          </h3>

          <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
            {recentAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No attendance records found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentAttendance.map(att => (
                  <div key={att.id} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{att.subject_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {att.date} • Period {att.period} • Prof. {att.faculty_name}
                        </div>
                      </div>

                      <span className={`badge ${att.status === 'PRESENT' ? 'badge-present' : att.status === 'ABSENT' ? 'badge-absent' : 'badge-od'}`}>
                        {att.status}
                      </span>
                    </div>

                    {att.status === 'ABSENT' && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Arrived late or missed?</span>
                        <button
                          onClick={() => {
                            setLateForm({
                              date: att.date,
                              period: att.period,
                              late_reason: ''
                            });
                            setShowLateModal(true);
                          }}
                          style={{ fontSize: '0.72rem', color: '#dc143c', fontWeight: 700, background: '#fff1f2', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #fecdd3' }}
                        >
                          Report Reason
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* OD Application Status Tracker (Prompt Requirement 16, 17) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              On-Duty (OD) Tracker
            </h3>
            <button
              onClick={() => setShowODModal(true)}
              style={{ fontSize: '0.78rem', color: '#dc143c', fontWeight: 700 }}
            >
              + Apply OD
            </button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
            {recentOD.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No OD applications yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentOD.map(od => (
                  <div key={od.id} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{od.event_name}</div>
                      <span className={`badge ${
                        od.status === 'HOD_APPROVED' ? 'badge-present' :
                        od.status === 'PENDING' ? 'badge-pending' :
                        od.status === 'FACULTY_APPROVED' ? 'badge-od' : 'badge-absent'
                      }`}>
                        {od.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Date: {od.date} ({od.from_time} - {od.to_time})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.2rem' }}>
                      {od.reason}
                    </div>

                    {/* Multi-tier timeline indicator */}
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#64748b' }}>
                      <span style={{ fontWeight: 600 }}>Workflow:</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Applied</span>
                      <span>→</span>
                      <span style={{ color: od.status !== 'PENDING' ? '#059669' : '#94a3b8', fontWeight: 600 }}>Faculty</span>
                      <span>→</span>
                      <span style={{ color: od.status === 'HOD_APPROVED' ? '#059669' : '#94a3b8', fontWeight: 600 }}>HOD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Leaves Status Tracker */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              My Leaves Tracker
            </h3>
            <button
              onClick={() => setShowLeaveModal(true)}
              style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}
            >
              + Request Leave
            </button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
            {leaveList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No leave applications recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaveList.map(lv => (
                  <div key={lv.id} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                          {lv.leave_type} LEAVE
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.15rem' }}>
                          {lv.from_date} to {lv.to_date}
                        </div>
                      </div>
                      <span className="badge badge-present">
                        {lv.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.35rem' }}>
                      {lv.reason}
                    </div>

                    <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                      Verified by: <span style={{ color: '#059669' }}>{lv.approved_by || 'Faculty Mentor'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* TAB 2: FULL TIMETABLE */}
      {studentTab === 'timetable' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={22} color="var(--red-ruby)" /> Weekly Class Timetable & Schedule
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Full schedule of lectures for your current semester ({student?.department_name} - Year {student?.year_level} / Sem {student?.semester_num}).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {timetableData.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', gridColumn: '1 / -1' }}>
                No classes scheduled for today.
              </div>
            ) : (
              timetableData.map(cls => (
                <div key={cls.timetable_id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--red-ruby)', marginBottom: '0.35rem' }}>
                    <span>Period {cls.period_num}</span>
                    <span>{cls.start_time} - {cls.end_time}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{cls.subject_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>Prof. {cls.faculty_name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.5rem', fontWeight: 600 }}>Classroom: {cls.classroom}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS PRESENCE LOCATOR */}
      {studentTab === 'presence' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="var(--red-ruby)" /> Real-Time Faculty & Mentor Presence Locator
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Find where your professors, mentors, and HOD are right now (in lecture classrooms vs department cabins vs on approved leave).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {(presenceData?.faculty || []).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', gridColumn: '1 / -1' }}>
                Loading live staff presence data...
              </div>
            ) : (
              (presenceData?.faculty || []).map(fac => {
                const isOnLeave = fac.status === 'ON_LEAVE';
                return (
                  <div key={fac.faculty_id} style={{
                    padding: '1.15rem',
                    borderRadius: '12px',
                    border: isOnLeave ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                    background: isOnLeave ? '#fff5f5' : '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{fac.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{fac.designation} • {fac.department_code}</div>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isOnLeave ? 'var(--red-ruby)' : '#16a34a',
                        color: '#fff'
                      }}>
                        {fac.statusLabel || (isOnLeave ? 'ON LEAVE' : 'PRESENT')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <MapPin size={15} color={isOnLeave ? 'var(--red-ruby)' : '#16a34a'} />
                      {fac.location}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HACKATHONS & PROJECTS */}
      {studentTab === 'hackathons' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} color="var(--red-ruby)" /> Student Hackathons, Competitions & Honors
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Official records of national hackathons, technical paper presentations, and prize awards endorsed by faculty advisors.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {hackathonsList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', gridColumn: '1 / -1' }}>
                No hackathon participation records found.
              </div>
            ) : (
              hackathonsList.map(h => (
                <div key={h.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--red-mist)', color: 'var(--red-ruby)' }}>
                      {h.achievement}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                      {h.cash_prize || 'Certificate of Merit'}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>{h.project_title || h.event_name}</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>Organizer: {h.organizer} • Date: {h.event_date}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS ANNOUNCEMENTS & NEWS */}
      {studentTab === 'posts' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={22} color="var(--red-ruby)" /> Announcements, Directives & Notices
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Official notices broadcast by College Administration, Cluster Dean, and Department HOD.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {postsList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                No campus directives or announcements published at this time.
              </div>
            ) : (
              postsList.map((p, idx) => (
                <div key={p.id || idx} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.35rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--red-mist)', color: 'var(--red-ruby)' }}>
                      {p.tag || p.scope || 'Institutional Notice'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>{p.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>{p.content}</p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    Issued by: {p.author_name || 'College Authority'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPLY FOR OD MODAL (Prompt Requirement 16) */}
      {showODModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              On-Duty (OD) Application Form
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Submit official participation request for academic, sports, or technical events.
            </p>

            <form onSubmit={handleApplyOD} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Event / Competition Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon Regional Finals"
                  value={odForm.event_name}
                  onChange={(e) => setOdForm({ ...odForm, event_name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={odForm.date}
                    onChange={(e) => setOdForm({ ...odForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    From Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={odForm.from_time}
                    onChange={(e) => setOdForm({ ...odForm, from_time: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    To Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={odForm.to_time}
                    onChange={(e) => setOdForm({ ...odForm, to_time: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Event Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anna University Campus Auditorium, Chennai"
                  value={odForm.location}
                  onChange={(e) => setOdForm({ ...odForm, location: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Reason for OD *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Selected as team lead representing college"
                  value={odForm.reason}
                  onChange={(e) => setOdForm({ ...odForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Supporting Document URL / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://example.com/docs/invitation_letter.pdf"
                  value={odForm.document_url}
                  onChange={(e) => setOdForm({ ...odForm, document_url: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowODModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#d97706', color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)' }}
                >
                  APPLY FOR OD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDANCE CORRECTION MODAL (Prompt Requirement 30) */}
      {showCorrectionModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Attendance Correction Request
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Dispute attendance marked incorrectly due to biometric glitch or lab session overlap.
            </p>

            <form onSubmit={handleApplyCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Subject *
                </label>
                <select
                  required
                  value={corrForm.subject_id}
                  onChange={(e) => setCorrForm({ ...corrForm, subject_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {subjectBreakdown.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_name} ({s.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Date of Lecture *
                  </label>
                  <input
                    type="date"
                    required
                    value={corrForm.date}
                    onChange={(e) => setCorrForm({ ...corrForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Requested Status *
                  </label>
                  <select
                    value={corrForm.requested_status}
                    onChange={(e) => setCorrForm({ ...corrForm, requested_status: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="OD">OD</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Reason for Correction *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the attendance was marked incorrectly..."
                  value={corrForm.reason}
                  onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Supporting Document Proof URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab sign-in sheet proof"
                  value={corrForm.document_url}
                  onChange={(e) => setCorrForm({ ...corrForm, document_url: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#dc143c', color: '#fff', fontWeight: 700 }}
                >
                  Submit Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY FOR LEAVE MODAL (Prompt Requirement: students, faculty, hod, dean can request leave) */}
      {showLeaveModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem', maxWidth: '520px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Student Leave Application
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Submit a formal leave request. Approved leaves are recorded in the college attendance and presence portal.
            </p>

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Leave Type *
                </label>
                <select
                  required
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="CASUAL">Casual Leave (Personal / Family)</option>
                  <option value="MEDICAL">Medical Leave (Sick / Health)</option>
                  <option value="DUTY">Academic / Co-Curricular Duty</option>
                  <option value="OTHER">Special Permission</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.from_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.to_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail your reason for absence..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#059669', color: '#fff', fontWeight: 700 }}
                >
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT LATE ARRIVAL REASON MODAL (Prompt: if student are late after 5 minutes they report reason) */}
      {showLateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem', maxWidth: '520px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Report Late Arrival Reason
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              As per college policy, arriving &gt;5 minutes late marks you absent unless your justifiable explanation is accepted by your period faculty or class mentor.
            </p>

            <form onSubmit={handleReportLate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Lecture Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={lateForm.date}
                    onChange={(e) => setLateForm({ ...lateForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Period (1 - 8) *
                  </label>
                  <select
                    value={lateForm.period}
                    onChange={(e) => setLateForm({ ...lateForm, period: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Reason for Late Arrival *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. College bus delayed due to traffic breakdown on highway / Attended principal office call..."
                  value={lateForm.late_reason}
                  onChange={(e) => setLateForm({ ...lateForm, late_reason: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ padding: '0.75rem', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', fontSize: '0.78rem', color: '#9f1239' }}>
                ℹ️ Once submitted, your period faculty or class mentor will review the reason in their attendance portal. If acceptable, they will convert your status to <strong>PRESENT</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLateModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#dc2626', color: '#fff', fontWeight: 700 }}
                >
                  Submit Late Explanation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
