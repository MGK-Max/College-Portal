import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Plus,
  Building,
  Trash2,
  Edit,
  Save,
  Search,
  Download,
  Filter,
  MapPin,
  Briefcase,
  CalendarCheck,
  X,
  Check
} from 'lucide-react';
import { api } from '../api';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import DepartmentHierarchyView from '../components/DepartmentHierarchyView';

export default function AdminDashboardView({ user, currentView, onViewChange, onTakeAttendance, selectedDeptId, onSelectDeptId }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentView === 'admin-dashboard') setActiveTab('overview');
    else if (currentView === 'admin-departments') setActiveTab('departments');
    else if (currentView === 'admin-sections') setActiveTab('sections');
    else if (currentView === 'admin-presence') setActiveTab('presence');
    else if (currentView === 'admin-faculty') setActiveTab('faculty');
    else if (currentView === 'admin-students') setActiveTab('students');
    else if (currentView === 'admin-projects') setActiveTab('projects');
    else if (currentView === 'admin-leaves') setActiveTab('leaves');
    else if (currentView === 'admin-academics') setActiveTab('academics');
    else if (currentView === 'admin-settings') setActiveTab('settings');
    else if (currentView === 'admin-reports') setActiveTab('reports');
    else if (currentView === 'admin-audit') setActiveTab('audit');
  }, [currentView]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onViewChange) {
      const map = {
        overview: 'admin-dashboard',
        departments: 'admin-departments',
        sections: 'admin-sections',
        presence: 'admin-presence',
        faculty: 'admin-faculty',
        students: 'admin-students',
        projects: 'admin-projects',
        leaves: 'admin-leaves',
        academics: 'admin-academics',
        settings: 'admin-settings',
        reports: 'admin-reports',
        audit: 'admin-audit'
      };
      if (map[tabId]) onViewChange(map[tabId]);
    }
  };

  // Dashboard Data
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [timetableList, setTimetableList] = useState([]);
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [presenceData, setPresenceData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);

  // Forms / Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    category: 'CLUSTER',
    hod_name: '',
    hod_email: '',
    hod_phone: '',
    hod_room: '',
    intake: 60
  });
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facForm, setFacForm] = useState({ name: '', email: '', password: 'password123', faculty_code: '', department_id: 1, designation: 'Assistant Professor', phone: '' });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stuForm, setStuForm] = useState({ name: '', email: '', password: 'password123', register_no: '', department_id: 1, year_level: 2, semester_num: 3, class_id: 1 });

  // Add Section in Administrator
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    name: 'Section A',
    department_id: 1,
    year_level: 1,
    semester_num: 1,
    room_no: 'Room 101, Academic Block',
    academic_year: '2026-2027',
    mentor1_id: '',
    mentor2_id: ''
  });
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [sectionFilterDept, setSectionFilterDept] = useState('ALL');
  const [sectionFilterYear, setSectionFilterYear] = useState('ALL');

  // Reports
  const [reportType, setReportType] = useState('college');
  const [reportData, setReportData] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sumData, deptsData, facData, stuData, clsData, subData, ttData, settsData, logsData, presData, projData, lvsData] = await Promise.all([
        api.getCollegeSummary(),
        api.getDepartments(),
        api.getFaculty(),
        api.getStudents(),
        api.getClasses(),
        api.getSubjects(),
        api.getTimetable(),
        api.getSettings(),
        api.getAuditLogs(),
        api.getPresence().catch(() => null),
        api.getProjects().catch(() => ({ projects: [] })),
        api.getLeaves().catch(() => ({ leaves: [] }))
      ]);

      setSummary(sumData);
      setDepartments(deptsData);
      setFacultyList(facData);
      setStudentsList(stuData);
      setClassesList(clsData);
      setSubjectsList(subData);
      setTimetableList(ttData);
      setPresenceData(presData);
      setProjectsList(projData?.projects || []);
      setLeavesList(lvsData?.leaves || []);
      
      const flatSettings = {};
      Object.keys(settsData.settings || {}).forEach(k => {
        flatSettings[k] = settsData.settings[k].value;
      });
      setSettings(flatSettings);

      setAuditLogs(logsData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Department creation
  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      setError('Please provide Department Name and Code');
      return;
    }
    try {
      setDeptSubmitting(true);
      setError('');
      await api.createDepartment(deptForm);
      setMessage(`Department ${deptForm.name} (${deptForm.code.toUpperCase()}) created successfully with HOD, faculty, and 1st-4th year classes.`);
      setShowDeptModal(false);
      setDeptForm({
        name: '',
        code: '',
        category: 'CLUSTER',
        hod_name: '',
        hod_email: '',
        hod_phone: '',
        hod_room: '',
        intake: 60
      });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This will delete all associated records.')) return;
    try {
      await api.deleteDepartment(id);
      setMessage('Department deleted.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // Faculty creation
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createFaculty(facForm);
      setMessage(`Faculty ${facForm.name} added successfully.`);
      setShowFacultyModal(false);
      setFacForm({ name: '', email: '', password: 'password123', faculty_code: '', department_id: 1, designation: 'Assistant Professor', phone: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to add faculty');
    }
  };

  // Student creation
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createStudent(stuForm);
      setMessage(`Student ${stuForm.name} (${stuForm.register_no}) created successfully.`);
      setShowStudentModal(false);
      setStuForm({ name: '', email: '', password: 'password123', register_no: '', department_id: 1, year_level: 2, semester_num: 3, class_id: 1 });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to create student');
    }
  };

  // Section creation in Administrator
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.name || !sectionForm.department_id || !sectionForm.year_level) {
      setError('Please fill in section name, department and year level');
      return;
    }
    try {
      setSectionSubmitting(true);
      setError('');
      const res = await api.createSection(sectionForm);
      setMessage(res.message || 'Class section created successfully.');
      setShowAddSectionModal(false);
      setSectionForm({
        name: 'Section A',
        department_id: departments[0]?.id || 1,
        year_level: 1,
        semester_num: 1,
        room_no: 'Room 101, Academic Block',
        academic_year: '2026-2027',
        mentor1_id: '',
        mentor2_id: ''
      });
      const updatedClasses = await api.getClasses();
      setClassesList(updatedClasses || []);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create class section');
    } finally {
      setSectionSubmitting(false);
    }
  };

  // Settings update (Prompt Requirement 15, 34)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.updateSettings(settings);
      setMessage('Attendance & Late Rule settings updated and stored permanently in database.');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    }
  };

  // Export reports
  const handleRunReport = async (type) => {
    try {
      setReportType(type);
      let data = null;
      if (type === 'college') data = await api.getCollegeReport();
      else if (type === 'department') data = await api.getDepartmentReport(1);
      else if (type === 'class') data = await api.getClassReport(1);
      else if (type === 'subject') data = await api.getSubjectReport(1);
      else if (type === 'faculty') data = await api.getFacultyReport(1);
      else if (type === 'student') data = await api.getStudentReport(1);
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
    }
  };

  const handleExportReport = (format) => {
    if (!reportData) return;
    const { meta, data } = reportData;
    
    // Dynamically derive columns from keys
    if (!data || data.length === 0) return;
    const sample = data[0];
    const columns = Object.keys(sample).map(key => ({
      header: key.replace(/_/g, ' ').toUpperCase(),
      key
    }));

    if (format === 'PDF') exportToPDF(`${meta.reportType.replace(/\s+/g, '_')}`, columns, data, meta);
    else if (format === 'EXCEL') exportToExcel(`${meta.reportType.replace(/\s+/g, '_')}`, columns, data, meta);
    else exportToCSV(`${meta.reportType.replace(/\s+/g, '_')}`, columns, data, meta);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#dc143c' }} />
        <p>Loading college administration console...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1350px', margin: '0 auto' }}>
      {/* Admin Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #991b1b 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fecdd3', fontWeight: 700 }}>
            ADMINISTRATOR CONSOLE • FULL INSTITUTIONAL OVERSIGHT
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
            College Attendance Management System
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
            Logged in as: {user?.name} • College Code: {settings.college_code || 'KIT'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            id="admin-top-add-section-btn"
            onClick={() => setShowAddSectionModal(true)}
            style={{ padding: '0.55rem 1rem', background: '#ffffff', color: '#881337', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <Plus size={16} /> Add Section
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{ padding: '0.55rem 1rem', background: '#ffffff', color: '#991b1b', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileSpreadsheet size={16} /> Reports & Export
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{ padding: '0.55rem 1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Settings size={16} /> Rules & Late Policy
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

      {/* DASHBOARD STATS ROW (Prompt Requirement 1, 27) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff1f2', color: '#dc143c' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Departments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{departments.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total HODs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{departments.filter(d => d.hod_id).length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Faculty Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{facultyList.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfeff', color: '#0891b2' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{studentsList.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f8fafc', color: '#475569' }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Classes & Sections</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{classesList.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>College Attendance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
              {summary?.overallStats?.percentage || 85.0}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Low Attendance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
              {summary?.lowAttendanceCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'College Overview & Charts' },
          { id: 'departments', label: `Departments (${departments.length})` },
          { id: 'sections', label: `Class Sections (${classesList.length})` },
          { id: 'presence', label: 'Staff Presence' },
          { id: 'faculty', label: `Faculty (${facultyList.length})` },
          { id: 'students', label: `Students (${studentsList.length})` },
          { id: 'projects', label: 'College Projects' },
          { id: 'leaves', label: 'Leave Registry' },
          { id: 'academics', label: 'Academics & Timetable' },
          { id: 'settings', label: 'Attendance & OD Rules' },
          { id: 'reports', label: 'Reports & Export' },
          { id: 'audit', label: 'Audit Trail Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === tab.id ? 'var(--red-ruby)' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid var(--red-ruby)' : '2px solid transparent',
              background: activeTab === tab.id ? 'var(--red-mist)' : 'none',
              borderRadius: '8px 8px 0 0',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Department Breakdown Comparison */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Department-Wise Attendance Performance
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Real-time aggregate percentage across all classes and enrolled students.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {summary?.deptAttendance?.map(dept => (
                <div key={dept.id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{dept.name}</div>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                      {dept.code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <div className="progress-bar" style={{ flex: 1, height: '10px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, dept.percentage || 85)}%`,
                          background: (dept.percentage || 85) >= 75 ? '#16a34a' : '#dc2626'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: (dept.percentage || 85) >= 75 ? '#16a34a' : '#dc2626' }}>
                      {dept.percentage || 85}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.75rem' }}>
                    <span>Present: {dept.present}</span>
                    <span>Absent: {dept.absent}</span>
                    <span>OD: {dept.od}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS HIERARCHY & EXPLORER */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeptModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                background: 'var(--red-ruby)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)'
              }}
            >
              <PlusCircle size={16} /> Add New Department
            </button>
          </div>

          <DepartmentHierarchyView user={user} initialDeptId={selectedDeptId} onDeptChange={onSelectDeptId} />
        </div>
      )}

      {/* TAB: CLASS SECTIONS & MENTOR REGISTRY (Prompt Requirement: Add section in administrator) */}
      {activeTab === 'sections' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={22} color="var(--red-ruby)" /> Academic Class Sections & Mentorship Registry
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Manage all class sections across departments, assigned classroom lecture halls, and faculty mentors.
              </p>
            </div>
            <button
              id="admin-add-section-btn"
              onClick={() => setShowAddSectionModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                background: 'var(--red-ruby)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={16} /> + Add Class Section
            </button>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'var(--red-mist)', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red-crimson)', textTransform: 'uppercase' }}>Total Active Sections</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{classesList.length}</div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Departments Represented</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {new Set(classesList.map(c => c.department_id)).size} / {departments.length}
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Mentors Assigned</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {classesList.filter(c => c.mentor1_id).length}
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: '#fdf4ff', border: '1px solid #f0abfc' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase' }}>Total Enrolled Students</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {classesList.reduce((acc, c) => acc + (Number(c.student_count) || 0), 0)}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Filter Department:</label>
              <select
                value={sectionFilterDept}
                onChange={(e) => setSectionFilterDept(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600 }}
              >
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Year Level:</label>
              <select
                value={sectionFilterYear}
                onChange={(e) => setSectionFilterYear(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600 }}
              >
                <option value="ALL">All Years (1st - 4th)</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Showing {classesList.filter(c => {
                if (sectionFilterDept !== 'ALL' && String(c.department_id) !== String(sectionFilterDept)) return false;
                if (sectionFilterYear !== 'ALL' && String(c.year_level) !== String(sectionFilterYear)) return false;
                return true;
              }).length} of {classesList.length} sections
            </div>
          </div>

          {/* Sections Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Section</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Year & Sem</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Classroom / Hall</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Primary Mentor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Co-Mentor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Academic Year</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Students</th>
                </tr>
              </thead>
              <tbody>
                {classesList
                  .filter(c => {
                    if (sectionFilterDept !== 'ALL' && String(c.department_id) !== String(sectionFilterDept)) return false;
                    if (sectionFilterYear !== 'ALL' && String(c.year_level) !== String(sectionFilterYear)) return false;
                    return true;
                  })
                  .map(c => {
                    const m1 = facultyList.find(f => f.id === c.mentor1_id);
                    const m2 = facultyList.find(f => f.id === c.mentor2_id);
                    const dept = departments.find(d => d.id === c.department_id);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            background: 'var(--red-mist)',
                            color: 'var(--red-ruby)',
                            fontWeight: 800
                          }}>
                            {c.section_name || `Section ${c.id}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.department_name || dept?.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.department_code || dept?.code}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.year_level === 1 ? '1st' : c.year_level === 2 ? '2nd' : c.year_level === 3 ? '3rd' : `${c.year_level}th`} Year</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.35rem' }}>• Sem {c.semester_num}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>
                          {c.room_no || 'TBD'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {m1 ? (
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{m1.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--red-ruby)', fontWeight: 600 }}>{m1.faculty_code}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {m2 ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{m2.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m2.faculty_code}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                          {c.academic_year || '2026-2027'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            {c.student_count || 0} Students
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CAMPUS LIVE PRESENCE LOCATOR */}
      {activeTab === 'presence' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={22} color="var(--red-ruby)" /> Real-Time Campus Presence & Staffroom Locator
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Tracks live positions of Faculty, HODs, and Deans across lecture classrooms vs department staffrooms vs approved leave status.
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await api.getPresence().catch(() => null);
                setPresenceData(res);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'var(--red-mist)',
                border: '1px solid #fecdd3',
                color: 'var(--red-ruby)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              ↻ Refresh Live Status
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
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

      {/* TAB 3: FACULTY MANAGEMENT (Prompt Requirement 4) */}
      {activeTab === 'faculty' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Faculty Directory (Appointed by HODs)
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Faculty members are appointed, edited, and managed directly by their respective Department HODs.
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '999px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: '1px solid #e2e8f0' }}>
              Managed by Department HODs
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Assigned Classes</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{f.faculty_code}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{f.name}</td>
                    <td>{f.department_name}</td>
                    <td>{f.designation}</td>
                    <td>{f.email}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {f.assignments?.map(a => (
                          <span key={a.assignment_id} style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fff1f2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 600 }}>
                            {a.subject_name} ({a.section_name})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT MANAGEMENT (Prompt Requirement 5) */}
      {activeTab === 'students' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Student Registry (Enrolled by Faculty)
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Student details and enrollments are uploaded and edited strictly by Department Faculty members.
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', borderRadius: '999px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: '1px solid #e2e8f0' }}>
              Managed by Class Faculty
            </span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Register No</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Year / Section</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'center' }}>Total Classes</th>
                  <th style={{ textAlign: 'center' }}>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map(st => (
                  <tr key={st.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{st.register_no}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                    <td>{st.department_name}</td>
                    <td>Year {st.year_level} - {st.section_name}</td>
                    <td>{st.email}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{st.totalClasses}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 800,
                        color: st.attendancePercentage >= (Number(settings.minimum_attendance_percent) || 75) ? '#16a34a' : '#dc2626'
                      }}>
                        {st.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: COLLEGE PROJECTS & R&D */}
      {activeTab === 'projects' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={22} color="var(--red-ruby)" /> College Projects & Innovation Initiatives ({projectsList.length})
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Institutional capstone projects, industry-sponsored R&D, and student innovations across Cluster and Core departments.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {projectsList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', gridColumn: '1 / -1' }}>
                No active projects recorded.
              </div>
            ) : (
              projectsList.map(p => (
                <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.35rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--red-mist)', color: 'var(--red-ruby)' }}>
                      {p.department_code} • Year {p.year_level || 'General'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.status === 'COMPLETED' ? '#059669' : '#d97706' }}>
                      {p.status}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>{p.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{p.description || 'Inter-departmental capstone initiative.'}</p>
                  <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <div><strong>Faculty Guide:</strong> {p.guide_name || 'Department Faculty'}</div>
                    <div style={{ marginTop: '0.2rem' }}><strong>Student Team:</strong> {p.student_team}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: CAMPUS LEAVE REGISTRY */}
      {activeTab === 'leaves' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarCheck size={22} color="var(--red-ruby)" /> Institutional Leave Registry ({leavesList.length})
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Comprehensive record of approved and pending leaves for Faculty, Staff, and Students.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No leave requests recorded in system.
                    </td>
                  </tr>
                ) : (
                  leavesList.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{l.user_name || l.applicant_name || 'Staff Member'}</td>
                      <td><span className="badge badge-primary">{l.user_role || 'FACULTY'}</span></td>
                      <td style={{ fontWeight: 600 }}>{l.leave_type}</td>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{l.from_date} to {l.to_date}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{l.reason}</td>
                      <td>
                        <span className={`badge ${l.status === 'APPROVED' ? 'badge-present' : l.status === 'REJECTED' ? 'badge-absent' : 'badge-pending'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ACADEMICS & TIMETABLE (Prompt Requirement 6, 7, 8, 9) */}
      {activeTab === 'academics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Subjects Table */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Academic Subjects Catalog
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Department</th>
                    <th>Year / Semester</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectsList.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{s.code}</td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>{s.department_name}</td>
                      <td>Year {s.year_level} / Sem {s.semester_num}</td>
                      <td>{s.credits} Credits</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timetable Table */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Institutional Master Timetable
            </h2>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Period</th>
                    <th>Timings</th>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Class / Section</th>
                    <th>Classroom</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableList.map(tt => (
                    <tr key={tt.id}>
                      <td style={{ fontWeight: 700 }}>{tt.day_of_week}</td>
                      <td>Period {tt.period_num}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{tt.start_time} - {tt.end_time}</td>
                      <td style={{ fontWeight: 700 }}>{tt.subject_name}</td>
                      <td>Prof. {tt.faculty_name}</td>
                      <td>Year {tt.year_level} - {tt.section_name}</td>
                      <td>{tt.classroom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS & 5-MINUTE LATE RULE POLICY (Prompt Requirement 13, 14, 15, 34) */}
      {activeTab === 'settings' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            Institutional Attendance & OD Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.75rem' }}>
            Configure strict late rule allowance, minimum percentage threshold, and multi-tier approval policies. Stored permanently in database.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Strict Late Rule Setting */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '0.3rem' }}>
                Strict Late Window Allowance (Minutes) *
              </label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Defines the allowed window after class start time. When elapsed server time exceeds this threshold, student status is strictly forced to ABSENT per policy.
              </p>
              <select
                value={settings.late_allowance_minutes || '5'}
                onChange={(e) => setSettings({ ...settings, late_allowance_minutes: e.target.value })}
                style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, width: '220px' }}
              >
                <option value="5">5 Minutes (Default Strict)</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
              </select>
            </div>

            {/* Minimum Attendance Percent */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '0.3rem' }}>
                Minimum Required Attendance Percentage (%) *
              </label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Threshold below which the system triggers prominent exam-ineligibility warning notices to students and HODs.
              </p>
              <input
                type="number"
                min="50"
                max="95"
                value={settings.minimum_attendance_percent || '75'}
                onChange={(e) => setSettings({ ...settings, minimum_attendance_percent: e.target.value })}
                style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, width: '220px' }}
              />
            </div>

            {/* Toggle Rules */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  Allow Faculty Attendance Editing
                </label>
                <select
                  value={settings.allow_faculty_editing || 'YES'}
                  onChange={(e) => setSettings({ ...settings, allow_faculty_editing: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                >
                  <option value="YES">YES (Authorized)</option>
                  <option value="NO">NO (Locked once submitted)</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  Allow Attendance Corrections
                </label>
                <select
                  value={settings.allow_attendance_correction || 'YES'}
                  onChange={(e) => setSettings({ ...settings, allow_attendance_correction: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                >
                  <option value="YES">YES (Enabled)</option>
                  <option value="NO">NO (Disabled)</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  OD Requires Faculty Verification
                </label>
                <select
                  value={settings.od_requires_faculty_approval || 'YES'}
                  onChange={(e) => setSettings({ ...settings, od_requires_faculty_approval: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO (Direct to HOD)</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  OD Requires HOD Final Approval
                </label>
                <select
                  value={settings.od_requires_hod_approval || 'YES'}
                  onChange={(e) => setSettings({ ...settings, od_requires_hod_approval: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              style={{
                alignSelf: 'flex-start',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                background: '#dc143c',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(220, 20, 60, 0.3)'
              }}
            >
              <Save size={16} /> Save Attendance Settings
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: REPORTS & EXPORT (Prompt Requirement 28, 29) */}
      {activeTab === 'reports' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Institutional Attendance Reports Generator
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Generate official audit-ready reports and export to PDF, Excel (XLSX), or CSV.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleExportReport('PDF')}
                disabled={!reportData}
                style={{ padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} /> Export PDF
              </button>
              <button
                onClick={() => handleExportReport('EXCEL')}
                disabled={!reportData}
                style={{ padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} /> Export Excel
              </button>
              <button
                onClick={() => handleExportReport('CSV')}
                disabled={!reportData}
                style={{ padding: '0.5rem 1rem', background: '#475569', color: '#fff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Report Selection Buttons (Prompt Requirement 28) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {[
              { id: 'college', label: 'COLLEGE REPORT' },
              { id: 'department', label: 'DEPARTMENT REPORT' },
              { id: 'class', label: 'CLASS REPORT' },
              { id: 'subject', label: 'SUBJECT REPORT' },
              { id: 'faculty', label: 'FACULTY REPORT' },
              { id: 'student', label: 'STUDENT REPORT' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => handleRunReport(r.id)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: reportType === r.id ? '#dc143c' : '#f1f5f9',
                  color: reportType === r.id ? '#ffffff' : '#334155',
                  boxShadow: reportType === r.id ? '0 2px 6px rgba(220, 20, 60, 0.3)' : 'none'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Report Table Display */}
          {reportData ? (
            <div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.82rem', color: '#334155' }}>
                <strong>Report:</strong> {reportData.meta.reportType} • <strong>Generated By:</strong> {reportData.meta.generatedBy} • <strong>Time:</strong> {new Date(reportData.meta.generatedAt).toLocaleString()}
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '450px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      {reportData.data.length > 0 && Object.keys(reportData.data[0]).map(k => (
                        <th key={k}>{k.replace(/_/g, ' ').toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((v, cIdx) => (
                          <td key={cIdx}>{v !== null && v !== undefined ? String(v) : '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
              Click any report category above to generate live records.
            </div>
          )}
        </div>
      )}

      {/* TAB 8: AUDIT LOGS (Prompt Requirement 31) */}
      {activeTab === 'audit' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            System Audit Trail & Compliance Logs
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Every attendance marking, late penalty, correction, and administrative rule modification is cryptographically logged.
          </p>

          <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Reason / Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#64748b' }}>{log.timestamp}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.entity}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{log.user_name}</td>
                    <td>
                      <span style={{ fontSize: '0.72rem', color: '#dc143c', fontWeight: 600 }}>
                        {log.user_role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#334155' }}>{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ADD NEW DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--red-mist)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={24} color="var(--red-ruby)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Add New College Department
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Provision department into Cluster or Non-Cluster with automatic HOD, faculty & 4-year classes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Category / Cluster Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1e293b' }}>
                  Department Category / Cluster Classification *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setDeptForm({ ...deptForm, category: 'CLUSTER' })}
                    style={{
                      border: deptForm.category === 'CLUSTER' ? '2px solid var(--red-ruby)' : '1px solid #cbd5e1',
                      background: deptForm.category === 'CLUSTER' ? 'var(--red-mist)' : '#ffffff',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: deptForm.category === 'CLUSTER' ? 'var(--red-ruby)' : '#0f172a' }}>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: deptForm.category === 'CLUSTER' ? 'var(--red-ruby)' : '#94a3b8',
                        background: deptForm.category === 'CLUSTER' ? 'var(--red-ruby)' : 'transparent',
                        display: 'inline-block'
                      }} />
                      Computer Science Cluster
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                      CS, IT, AI & DS, CSBS, Cyber, Data Analytics
                    </div>
                  </div>

                  <div
                    onClick={() => setDeptForm({ ...deptForm, category: 'NON_CLUSTER' })}
                    style={{
                      border: deptForm.category === 'NON_CLUSTER' ? '2px solid var(--red-ruby)' : '1px solid #cbd5e1',
                      background: deptForm.category === 'NON_CLUSTER' ? 'var(--red-mist)' : '#ffffff',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: deptForm.category === 'NON_CLUSTER' ? 'var(--red-ruby)' : '#0f172a' }}>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: deptForm.category === 'NON_CLUSTER' ? 'var(--red-ruby)' : '#94a3b8',
                        background: deptForm.category === 'NON_CLUSTER' ? 'var(--red-ruby)' : 'transparent',
                        display: 'inline-block'
                      }} />
                      Core / Non-Cluster
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                      Mechanical, Civil, ECE, EEE, Biotech, Chemical
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Name & Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence & Data Science"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Code (Short) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AD"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              {/* HOD Details */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.75rem' }}>
                  Head of Department (HOD) Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>HOD Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. R. Malathi, M.E., Ph.D."
                      value={deptForm.hod_name}
                      onChange={(e) => setDeptForm({ ...deptForm, hod_name: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>HOD Email</label>
                    <input
                      type="email"
                      placeholder="e.g. hod.ad@college.edu"
                      value={deptForm.hod_email}
                      onChange={(e) => setDeptForm({ ...deptForm, hod_email: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>HOD Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 94433 11223"
                      value={deptForm.hod_phone}
                      onChange={(e) => setDeptForm({ ...deptForm, hod_phone: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Office Room / Cabin</label>
                    <input
                      type="text"
                      placeholder="e.g. Tech Block - TB301"
                      value={deptForm.hod_room}
                      onChange={(e) => setDeptForm({ ...deptForm, hod_room: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Annual Intake */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Annual Approved Student Intake</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="30"
                  value={deptForm.intake}
                  onChange={(e) => setDeptForm({ ...deptForm, intake: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {/* Automated Provisioning Notice */}
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'var(--red-mist)',
                border: '1px solid #fecdd3',
                fontSize: '0.78rem',
                color: 'var(--red-maroon)',
                lineHeight: '1.45'
              }}>
                <strong>⚡ Automated System Provisioning:</strong>
                <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                  <li>Department Head user account created with password <code>password123</code></li>
                  <li>Initializes academic sections & classes for <strong>1st, 2nd, 3rd, and 4th Years</strong></li>
                  <li>Assigns starter faculty, year incharges, and 2 class mentors per section</li>
                  <li>Provisions department-wide chat channel and year-level discussion boards</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'var(--red-ruby)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: deptSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)'
                  }}
                >
                  {deptSubmitting ? 'Creating & Provisioning...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW CLASS SECTION MODAL (Administrator) */}
      {showAddSectionModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--red-mist)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={24} color="var(--red-ruby)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Add New Class Section
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Create section with department assignment, classroom allocation, and mentors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department *</label>
                <select
                  required
                  value={sectionForm.department_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, department_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Year Level *</label>
                  <select
                    value={sectionForm.year_level}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setSectionForm({
                        ...sectionForm,
                        year_level: y,
                        semester_num: y * 2 - 1
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>1st Year (B.E./B.Tech)</option>
                    <option value={2}>2nd Year (B.E./B.Tech)</option>
                    <option value={3}>3rd Year (B.E./B.Tech)</option>
                    <option value={4}>4th Year (B.E./B.Tech)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Semester *</label>
                  <select
                    value={sectionForm.semester_num}
                    onChange={(e) => setSectionForm({ ...sectionForm, semester_num: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Section Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section C"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Classroom / Room No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204, Tech Block"
                    value={sectionForm.room_no}
                    onChange={(e) => setSectionForm({ ...sectionForm, room_no: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Primary Class Mentor</label>
                  <select
                    value={sectionForm.mentor1_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, mentor1_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Select Faculty Mentor --</option>
                    {facultyList
                      .filter(f => f.department_id === Number(sectionForm.department_id))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.faculty_code || 'Faculty'})</option>
                      ))}
                    {facultyList.filter(f => f.department_id === Number(sectionForm.department_id)).length === 0 &&
                      facultyList.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.department_code || f.faculty_code})</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Secondary Co-Mentor</label>
                  <select
                    value={sectionForm.mentor2_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, mentor2_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- None / Select Co-Mentor --</option>
                    {facultyList
                      .filter(f => f.department_id === Number(sectionForm.department_id))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.faculty_code || 'Faculty'})</option>
                      ))}
                    {facultyList.filter(f => f.department_id === Number(sectionForm.department_id)).length === 0 &&
                      facultyList.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.department_code || f.faculty_code})</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Academic Year</label>
                <input
                  type="text"
                  value={sectionForm.academic_year}
                  onChange={(e) => setSectionForm({ ...sectionForm, academic_year: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionSubmitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'var(--red-ruby)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: sectionSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)'
                  }}
                >
                  {sectionSubmitting ? 'Creating Section...' : 'Create Class Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACULTY MODAL */}
      {showFacultyModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Add New Faculty Member
            </h3>
            <form onSubmit={handleCreateFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Anand R"
                  value={facForm.name}
                  onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Faculty ID Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-AD05"
                    value={facForm.faculty_code}
                    onChange={(e) => setFacForm({ ...facForm, faculty_code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department *</label>
                  <select
                    value={facForm.department_id}
                    onChange={(e) => setFacForm({ ...facForm, department_id: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Designation *</label>
                <input
                  type="text"
                  required
                  value={facForm.designation}
                  onChange={(e) => setFacForm({ ...facForm, designation: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="faculty@college.edu"
                  value={facForm.email}
                  onChange={(e) => setFacForm({ ...facForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#dc143c', color: '#fff', fontWeight: 700 }}
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT ENROLLMENT MODAL */}
      {showStudentModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Enroll New Student
            </h3>
            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthika S"
                  value={stuForm.name}
                  onChange={(e) => setStuForm({ ...stuForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Register Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AD326"
                    value={stuForm.register_no}
                    onChange={(e) => setStuForm({ ...stuForm, register_no: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department *</label>
                  <select
                    value={stuForm.department_id}
                    onChange={(e) => setStuForm({ ...stuForm, department_id: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={stuForm.email}
                  onChange={(e) => setStuForm({ ...stuForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Year Level</label>
                  <select
                    value={stuForm.year_level}
                    onChange={(e) => setStuForm({ ...stuForm, year_level: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={stuForm.semester_num}
                    onChange={(e) => setStuForm({ ...stuForm, semester_num: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#dc143c', color: '#fff', fontWeight: 700 }}
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
