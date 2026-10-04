import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  Check,
  X,
  Eye,
  Building,
  Plus,
  ShieldCheck,
  Briefcase,
  MapPin,
  Send,
  UserCheck,
  Building2,
  Award,
  Search
} from 'lucide-react';
import { api } from '../api';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import DepartmentHierarchyView from '../components/DepartmentHierarchyView';

export default function HodDashboardView({ user, currentView, onViewChange, onTakeAttendance, selectedDeptId, onSelectDeptId }) {
  const [loading, setLoading] = useState(true);
  const [hodStats, setHodStats] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [todayTimetable, setTodayTimetable] = useState([]);
  
  // Advanced HOD Data States
  const [yearIncharges, setYearIncharges] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [hackathonsList, setHackathonsList] = useState([]);
  const [presenceData, setPresenceData] = useState(null);
  const [deptPosts, setDeptPosts] = useState([]);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview'); 

  useEffect(() => {
    if (currentView === 'hod-departments') setActiveTab('departments');
    else if (currentView === 'hod-dashboard') setActiveTab('overview');
    else if (currentView === 'hod-take-attendance') {
      if (onTakeAttendance) {
        onTakeAttendance({
          classId: 1,
          subjectId: 1,
          date: new Date().toISOString().split('T')[0],
          period: 1
        });
      }
    }
    else if (currentView === 'hod-faculty') setActiveTab('faculty');
    else if (currentView === 'hod-students') setActiveTab('students');
    else if (currentView === 'hod-year-incharge') setActiveTab('year-incharge');
    else if (currentView === 'hod-classes') setActiveTab('classes');
    else if (currentView === 'hod-projects') setActiveTab('projects');
    else if (currentView === 'hod-hackathons') setActiveTab('hackathons');
    else if (currentView === 'hod-presence') setActiveTab('presence');
    else if (currentView === 'hod-timetable') setActiveTab('timetable');
    else if (currentView === 'hod-posts') setActiveTab('posts');
    else if (currentView === 'hod-od') setActiveTab('od');
    else if (currentView === 'hod-leaves') setActiveTab('leave');
  }, [currentView]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onViewChange) {
      const map = {
        departments: 'hod-departments',
        overview: 'hod-dashboard',
        faculty: 'hod-faculty',
        students: 'hod-students',
        'year-incharge': 'hod-year-incharge',
        classes: 'hod-classes',
        projects: 'hod-projects',
        hackathons: 'hod-hackathons',
        presence: 'hod-presence',
        timetable: 'hod-timetable',
        posts: 'hod-posts',
        od: 'hod-od',
        'low-att': 'hod-dashboard',
        leave: 'hod-leaves'
      };
      if (map[tabId]) onViewChange(map[tabId]);
    }
  }; 
  
  // Review modal/dialog
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(''); 
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modals / Form States
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', faculty_code: '', designation: 'Assistant Professor', phone: '', cabin_room: 'Faculty Cabin, Block A' });

  // Separate Edit Faculty Details State (Add Faculty is hidden when editing faculty details)
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState({ id: null, name: '', email: '', faculty_code: '', designation: 'Assistant Professor', phone: '', cabin_room: 'Faculty Cabin, Block A' });

  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', register_no: '', phone: '', year_level: 2, semester_num: 3, class_id: '' });

  // Edit Student Details State
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState({ id: null, name: '', email: '', phone: '', register_no: '', year_level: 2, semester_num: 3, class_id: '' });
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Add Hackathon Modal State
  const [showAddHackathonModal, setShowAddHackathonModal] = useState(false);
  const [newHackathon, setNewHackathon] = useState({ student_id: '', event_name: '', organizer: '', project_title: '', achievement: '1st Prize / Winner', cash_prize: '₹25,000', event_date: new Date().toISOString().split('T')[0] });

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({ year_level: 1, semester_num: 1, section_name: 'A', room_no: 'Room A201', mentor1_id: '', mentor2_id: '' });

  const [showAssignMentorsModal, setShowAssignMentorsModal] = useState(false);
  const [selectedClassToMentor, setSelectedClassToMentor] = useState(null);
  const [mentorSelection, setMentorSelection] = useState({ mentor1_id: '', mentor2_id: '' });

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', category: 'AI & Data Science', year_level: 3, faculty_guide_id: '', student_team: '', github_url: '', description: '' });

  const [newDeptPost, setNewDeptPost] = useState({ title: '', content: '', tag: 'Department Notice' });
  const [newLeave, setNewLeave] = useState({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const deptId = user?.department_id || user?.departmentId || 1;
      const [statsData, facData, stuData, odData, corrData, ttData, yrData, clsData, projData, presData, postsData, hackData] = await Promise.all([
        api.getHodStats(deptId),
        api.getFaculty(deptId),
        api.getStudents({ department_id: deptId }),
        api.getODRequests(),
        api.getCorrections(),
        api.getTodayTimetable(),
        api.getHodYearIncharges(deptId),
        api.getHodClasses(deptId),
        api.getProjects(deptId),
        api.getPresence(),
        api.getPosts(),
        api.getHackathons().catch(() => ({ hackathons: [] }))
      ]);

      setHodStats(statsData);
      setFacultyList(Array.isArray(facData) ? facData : (facData?.faculty || []));
      setStudentsList(Array.isArray(stuData) ? stuData : (stuData?.students || []));
      setOdRequests(Array.isArray(odData) ? odData : (odData?.requests || []));
      setCorrections(Array.isArray(corrData) ? corrData : (corrData?.corrections || []));
      setTodayTimetable(ttData?.classes || (Array.isArray(ttData) ? ttData : []));
      setYearIncharges(yrData?.yearLevels || yrData?.incharges || (Array.isArray(yrData) ? yrData : []));
      setClassesList(clsData?.classes || (Array.isArray(clsData) ? clsData : []));
      setProjectsList(projData?.projects || (Array.isArray(projData) ? projData : []));
      setHackathonsList(hackData?.hackathons || (Array.isArray(hackData) ? hackData : []));
      setPresenceData(presData);
      setDeptPosts(postsData?.departmentHodPosts || []);
    } catch (err) {
      console.error('Error loading HOD dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHodODDecision = async (decision) => {
    if (!actionItem) return;
    try {
      setError('');
      await api.approveOD(actionItem.id, decision, comments || `HOD ${decision.toLowerCase()}d.`);
      setMessage(`On-Duty application officially ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`);
      setActionItem(null);
      setComments('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to process HOD decision');
    }
  };

  const handleHodCorrectionDecision = async (decision) => {
    if (!actionItem) return;
    try {
      setError('');
      await api.approveCorrection(actionItem.id, decision, comments || `HOD ${decision.toLowerCase()}d.`);
      setMessage(`Attendance correction request ${decision === 'APPROVE' ? 'APPROVED and database updated' : 'rejected'}.`);
      setActionItem(null);
      setComments('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to process correction');
    }
  };

  // 1. Add Faculty (Only HOD can add faculty)
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createHodFaculty(newFaculty);
      setMessage(`Faculty ${newFaculty.name} (${newFaculty.faculty_code}) added successfully to department!`);
      setShowAddFacultyModal(false);
      setNewFaculty({ name: '', email: '', faculty_code: '', designation: 'Assistant Professor', phone: '', cabin_room: 'Faculty Cabin, Block A' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add faculty');
    }
  };

  // 1b. Edit Faculty Details (Only HOD can edit faculty details - Add Faculty is hidden here)
  const handleOpenEditFaculty = (fac) => {
    setEditingFaculty({
      id: fac.id,
      name: fac.name || '',
      email: fac.email || '',
      faculty_code: fac.faculty_code || '',
      designation: fac.designation || 'Assistant Professor',
      phone: fac.phone || '',
      cabin_room: fac.cabin_room || 'Faculty Cabin, Block A'
    });
    setShowAddFacultyModal(false); // Make sure Add Faculty modal is hidden
    setShowEditFacultyModal(true);
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.updateHodFaculty(editingFaculty.id, editingFaculty);
      setMessage(`Faculty ${editingFaculty.name} (${editingFaculty.faculty_code}) details updated successfully!`);
      setShowEditFacultyModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update faculty details');
    }
  };

  // 2. Set Year Incharge
  const handleAssignYearIncharge = async (year_level, faculty_id) => {
    try {
      setError('');
      await api.setHodYearIncharge({ year_level, faculty_id, room_no: `Year ${year_level} Incharge Office` });
      setMessage(`Year ${year_level} incharge assigned successfully!`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign year incharge');
    }
  };

  // 3. Add Class for Year
  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createHodClass(newClass);
      setMessage(`Class for Year ${newClass.year_level} Section ${newClass.section_name} created successfully with 2 mentors!`);
      setShowAddClassModal(false);
      setNewClass({ year_level: 1, semester_num: 1, section_name: 'A', room_no: 'Room A201', mentor1_id: '', mentor2_id: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add class');
    }
  };

  // 4. Assign 2 Mentors to Class
  const handleAssignMentors = async (e) => {
    e.preventDefault();
    if (!selectedClassToMentor) return;
    try {
      setError('');
      await api.assignClassMentors({
        class_id: selectedClassToMentor.id,
        mentor1_id: mentorSelection.mentor1_id,
        mentor2_id: mentorSelection.mentor2_id
      });
      setMessage(`2 Mentors successfully assigned to Year ${selectedClassToMentor.year_level} Section ${selectedClassToMentor.section_name}!`);
      setShowAssignMentorsModal(false);
      setSelectedClassToMentor(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign mentors');
    }
  };

  // 5. Add Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createProject(newProject);
      setMessage(`Project "${newProject.title}" successfully registered in department!`);
      setShowAddProjectModal(false);
      setNewProject({ title: '', category: 'AI & Data Science', year_level: 3, faculty_guide_id: '', student_team: '', github_url: '', description: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add project');
    }
  };

  // 6. Publish Department Post (Visible only to this department)
  const handleCreateDeptPost = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createPost({
        ...newDeptPost,
        scope: 'DEPARTMENT_ONLY'
      });
      setMessage('Department Announcement published! Only students & faculty in your department can see it.');
      setNewDeptPost({ title: '', content: '', tag: 'Department Notice' });
      const postsData = await api.getPosts();
      setDeptPosts(postsData.departmentHodPosts || []);
    } catch (err) {
      setError(err.message || 'Failed to publish post');
    }
  };

  // 7. HOD Leave Request
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.submitLeave(newLeave);
      setMessage('Leave request recorded! Dean and staff presence tracker updated.');
      setNewLeave({ leave_type: 'CASUAL', from_date: '', to_date: '', reason: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    }
  };

  // 8. Add Student to Department
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const deptId = user?.department_id || user?.departmentId || 1;
      await api.createStudent({
        ...newStudent,
        department_id: deptId,
        password: 'password123'
      });
      setMessage(`Student "${newStudent.name}" (${newStudent.register_no}) enrolled successfully in department!`);
      setShowAddStudentModal(false);
      setNewStudent({ name: '', email: '', register_no: '', phone: '', year_level: 2, semester_num: 3, class_id: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to enroll student');
    }
  };

  // 8b. Edit Student Details
  const handleOpenEditStudent = (st) => {
    setEditingStudent({
      id: st.id,
      name: st.name || '',
      email: st.email || '',
      phone: st.phone || '',
      register_no: st.register_no || '',
      year_level: st.year_level || 1,
      semester_num: st.semester_num || 1,
      class_id: st.class_id || ''
    });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.updateStudent(editingStudent.id, editingStudent);
      setMessage(`Student details for "${editingStudent.name}" updated successfully!`);
      setShowEditStudentModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update student details');
    }
  };

  // 9. Record Hackathon Achievement
  const handleAddHackathon = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createHackathon(newHackathon);
      setMessage(`Hackathon award for "${newHackathon.project_title}" verified and recorded!`);
      setShowAddHackathonModal(false);
      setNewHackathon({ student_id: '', event_name: '', organizer: '', project_title: '', achievement: '1st Prize / Winner', cash_prize: '₹25,000', event_date: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to record hackathon');
    }
  };

  // Export department report
  const handleExport = (format) => {
    const columns = [
      { header: 'Register No', key: 'register_no' },
      { header: 'Student Name', key: 'name' },
      { header: 'Section', key: 'section_name' },
      { header: 'Total Classes', key: 'totalClasses' },
      { header: 'Attended', key: 'attendedClasses' },
      { header: 'Attendance %', key: 'attendancePercentage' }
    ];

    const data = studentsList.map(s => ({
      register_no: s.register_no,
      name: s.name,
      section_name: s.section_name || 'A',
      totalClasses: s.totalClasses || 0,
      attendedClasses: s.attendedClasses || 0,
      attendancePercentage: `${s.attendancePercentage || 0}%`
    }));

    const title = `${hodStats?.department?.name || 'Department'} - Consolidated Student Attendance`;

    if (format === 'PDF') exportToPDF(columns, data, title, `${hodStats?.department?.code}_attendance.pdf`);
    else if (format === 'EXCEL') exportToExcel(columns, data, title, `${hodStats?.department?.code}_attendance.xlsx`);
    else exportToCSV(columns, data, `${hodStats?.department?.code}_attendance.csv`);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#dc143c' }} />
        <p>Loading Department Management console...</p>
      </div>
    );
  }

  const pendingHodODs = odRequests.filter(o => o.status === 'FACULTY_APPROVED' || o.status === 'PENDING');
  const pendingCorrections = corrections.filter(c => c.status === 'FACULTY_APPROVED' || c.status === 'PENDING');

  return (
    <div style={{ padding: '1.75rem 2rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* HOD Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4c0519 0%, #881337 50%, #dc143c 100%)',
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
            DEPARTMENT HEAD PORTAL • STRICT ACCESS CONTROL
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
            {hodStats?.department?.name} ({hodStats?.department?.code})
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#e0e7ff', marginTop: '0.25rem' }}>
            HOD: <strong>{user?.name}</strong> • Governed under Dean of Cluster • Faculty, Mentors, Year Incharges & Student Oversight
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => setShowAddFacultyModal(true)}
            style={{ padding: '0.6rem 1rem', background: '#ffffff', color: '#881337', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Faculty
          </button>
          <button
            onClick={() => setShowAddClassModal(true)}
            style={{ padding: '0.6rem 1rem', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Class Section
          </button>
          <button
            onClick={() => handleExport('PDF')}
            style={{ padding: '0.6rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <FileSpreadsheet size={15} /> PDF
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

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff1f2', color: '#dc143c' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Faculty</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{facultyList.length || hodStats?.facultyCount || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Students</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{studentsList.length || hodStats?.studentCount || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Classes (2 Mentors)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{classesList.length || 4}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Active Projects</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3730a3' }}>{projectsList.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Low Attendance (&lt;75%)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{hodStats?.lowAttendanceCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Tabs Menu Bar with Persistent 'Add Faculty' Action in All HOD Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        borderBottom: '2px solid var(--border)',
        marginBottom: '1.5rem',
        paddingBottom: '0.25rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', flex: 1, paddingBottom: '0.2rem' }}>
          {[
            { id: 'departments', label: "🏛️ Department Hierarchy & Classes", highlight: true },
            { id: 'overview', label: "Today's Lectures" },
            { id: 'faculty', label: `Faculty Roster (${facultyList.length})` },
            { id: 'students', label: `Student Roster (${studentsList.length})` },
            { id: 'year-incharge', label: "1st - 4th Yr Incharges" },
            { id: 'classes', label: "Classes & 2 Mentors" },
            { id: 'projects', label: `Projects (${projectsList.length})` },
            { id: 'hackathons', label: `Hackathons & Awards (${hackathonsList.length})` },
            { id: 'presence', label: "Real-Time Staff Presence" },
            { id: 'timetable', label: "Department Timetable" },
            { id: 'posts', label: "Dept Announcements" },
            { id: 'od', label: `OD Approvals (${pendingHodODs.length})` },
            { id: 'low-att', label: `Low Attendance (${hodStats?.lowAttendanceCount || 0})` },
            { id: 'leave', label: "Request Leave" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '0.75rem 1.15rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: activeTab === tab.id ? '#dc143c' : tab.highlight ? '#be123c' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #dc143c' : '2px solid transparent',
                background: activeTab === tab.id ? '#fff1f2' : tab.highlight ? '#fff5f6' : 'transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: tab.highlight && activeTab !== tab.id ? '1px dashed #f43f5e' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SHIFTED: ADD FACULTY TO MENU IN ALL HOD TABS */}
        <button
          id="hod-all-tabs-add-faculty-btn"
          onClick={() => setShowAddFacultyModal(true)}
          style={{
            padding: '0.65rem 1.15rem',
            background: 'linear-gradient(135deg, #dc143c 0%, #881337 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220, 20, 60, 0.35)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Add a new faculty member to this department (Available across all HOD tabs)"
        >
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      {/* TAB: 14 COLLEGE DEPARTMENTS DIRECTORY */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <DepartmentHierarchyView user={user} initialDeptId={selectedDeptId} onDeptChange={onSelectDeptId} />
        </div>
      )}

      {/* TAB: DEPARTMENT TIMETABLE */}
      {activeTab === 'timetable' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={22} color="#dc143c" /> Department Timetable & Daily Lecture Schedule
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Live academic timetable for {hodStats?.department?.name || 'Department'}. Tracks period slots, classroom rooms, and faculty subject assignments.
              </p>
            </div>
          </div>

          {todayTimetable.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No timetable entries scheduled for today.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Time Slot</th>
                    <th>Subject & Code</th>
                    <th>Faculty In-Charge</th>
                    <th>Class / Room</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTimetable.map(cls => (
                    <tr key={cls.timetable_id}>
                      <td style={{ fontWeight: 700 }}>Period {cls.period_num}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{cls.start_time} - {cls.end_time}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{cls.subject_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cls.subject_code}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cls.faculty_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#dc143c' }}>{cls.faculty_code}</div>
                      </td>
                      <td>
                        <div>Year {cls.year_level} - {cls.section_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room: {cls.classroom || cls.room_no}</div>
                      </td>
                      <td>
                        {cls.isAttendanceMarked ? (
                          <span className="badge badge-present" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={13} /> Recorded ({cls.attendance_records_count} Students)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-absent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={13} /> Pending Submission
                            </span>
                            {onTakeAttendance && (
                              <button
                                onClick={() => onTakeAttendance({
                                  classId: cls.class_id || 1,
                                  subjectId: cls.subject_id || 1,
                                  date: new Date().toISOString().split('T')[0],
                                  period: cls.period_num || 1
                                })}
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '6px',
                                  background: '#dc143c',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                Take Attendance →
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: OVERVIEW & TODAY'S CLASSES */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Today's Lectures in Department ({hodStats?.department?.name})
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Real-time monitoring of lecture delivery, assigned faculty, and attendance submission status.
            </p>

            {todayTimetable.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No lectures scheduled for today.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Time Slot</th>
                      <th>Subject & Code</th>
                      <th>Faculty In-Charge</th>
                      <th>Class / Room</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTimetable.map(cls => (
                      <tr key={cls.timetable_id}>
                        <td style={{ fontWeight: 700 }}>Period {cls.period_num}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{cls.start_time} - {cls.end_time}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{cls.subject_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cls.subject_code}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cls.faculty_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#dc143c' }}>{cls.faculty_code}</div>
                        </td>
                        <td>
                          <div>Year {cls.year_level} - {cls.section_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room: {cls.classroom || cls.room_no}</div>
                        </td>
                        <td>
                          {cls.isAttendanceMarked ? (
                            <span className="badge badge-present" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={13} /> Recorded ({cls.attendance_records_count} Students)
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span className="badge badge-absent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={13} /> Pending Submission
                              </span>
                              {onTakeAttendance && (
                                <button
                                  onClick={() => onTakeAttendance({
                                    classId: cls.class_id || 1,
                                    subjectId: cls.subject_id || 1,
                                    date: new Date().toISOString().split('T')[0],
                                    period: cls.period_num || 1
                                  })}
                                  style={{
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '6px',
                                    background: '#dc143c',
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Take Attendance →
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY ROSTER & ADD FACULTY */}
      {activeTab === 'faculty' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Faculty Members under {hodStats?.department?.name}
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Only HOD has authority to add faculty members and edit their details for this department.
              </p>
            </div>
            {/* Make Add Faculty button hidden when in Edit Faculty Details mode */}
            {!showEditFacultyModal && (
              <button
                onClick={() => setShowAddFacultyModal(true)}
                style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <Plus size={16} /> Add New Faculty
              </button>
            )}
          </div>

          {facultyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Users size={44} style={{ margin: '0 auto 0.75rem', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>No Faculty Appointed Yet</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                All previous demo records have been cleared. As the HOD, you can now manually add and manage your department's faculty members.
              </p>
              {!showEditFacultyModal && (
                <button
                  onClick={() => setShowAddFacultyModal(true)}
                  style={{ padding: '0.65rem 1.35rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={16} /> + Add First Faculty
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Faculty Code</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Cabin Room</th>
                    <th>Email & Phone</th>
                    <th>Mentoring Classes</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.map(fac => (
                    <tr key={fac.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{fac.faculty_code}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{fac.name}</td>
                      <td>{fac.designation}</td>
                      <td>{fac.cabin_room || 'Faculty Cabin, Block A'}</td>
                      <td>
                        <div>{fac.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fac.phone || 'N/A'}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                          {fac.mentoring_classes || 'None'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenEditFaculty(fac)}
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

      {/* TAB: STUDENT ROSTER & ENROLLMENT */}
      {activeTab === 'students' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={22} color="#dc143c" /> Student Roster & Enrollment under {hodStats?.department?.name}
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                HOD has full administrative authority to enroll students, edit details, track attendance metrics, and export consolidated records.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search student or roll..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem 0.55rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    width: '210px'
                  }}
                />
              </div>

              {!showEditStudentModal && (
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Enroll Student
                </button>
              )}

              <button
                onClick={() => handleExport('EXCEL')}
                style={{ padding: '0.6rem 0.9rem', background: '#15803d', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <FileSpreadsheet size={15} /> Excel
              </button>
            </div>
          </div>

          {studentsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <GraduationCap size={44} style={{ margin: '0 auto 0.75rem', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>No Students Enrolled Yet</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                All previous demo details have been removed. As HOD, you can enroll new students and assign them to specific class sections.
              </p>
              {!showEditStudentModal && (
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  style={{ padding: '0.65rem 1.35rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={16} /> + Enroll First Student
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
                  {studentsList
                    .filter(st => {
                      if (!studentSearchQuery) return true;
                      const q = studentSearchQuery.toLowerCase();
                      return (
                        (st.name && st.name.toLowerCase().includes(q)) ||
                        (st.register_no && st.register_no.toLowerCase().includes(q)) ||
                        (st.email && st.email.toLowerCase().includes(q))
                      );
                    })
                    .map(st => (
                      <tr key={st.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc143c' }}>{st.register_no}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                        <td>Year {st.year_level} - {st.section_name || 'A'}</td>
                        <td>
                          <div>{st.email}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.phone || 'N/A'}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{st.attendedClasses || st.attended || 0} / {st.totalClasses || st.total_classes || 0}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            background: (st.attendancePercentage ?? st.percentage ?? 0) >= 75 ? '#dcfce7' : '#fee2e2',
                            color: (st.attendancePercentage ?? st.percentage ?? 0) >= 75 ? '#166534' : '#dc2626'
                          }}>
                            {st.attendancePercentage ?? st.percentage ?? 0}%
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

      {/* TAB 3: 1st, 2nd, 3rd, 4th YEAR INCHARGES */}
      {activeTab === 'year-incharge' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              🎓 Year Incharge Coordinators (1st, 2nd, 3rd, 4th Year)
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Assign dedicated faculty coordinators for each academic year level to oversee student welfare, discipline, and timetable coordination.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4].map(yr => {
              const info = yearIncharges.find(y => y.year_level === yr);
              return (
                <div key={yr} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: '#fdfcfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#881337' }}>
                      {yr}{yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: info?.assigned ? '#dcfce7' : '#fee2e2', color: info?.assigned ? '#166534' : '#991b1b' }}>
                      {info?.assigned ? 'Coordinator Appointed' : 'Not Assigned'}
                    </span>
                  </div>

                  {info?.assigned ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{info.details.faculty_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Code: {info.details.faculty_code} • {info.details.designation}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '0.2rem', fontWeight: 600 }}>
                        Office: {info.details.room_no || `Year ${yr} Office`}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      No faculty coordinator currently appointed for this year.
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Assign / Reassign Faculty Incharge:
                    </label>
                    <select
                      defaultValue={info?.details?.faculty_id || ''}
                      onChange={(e) => {
                        if (e.target.value) handleAssignYearIncharge(yr, e.target.value);
                      }}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Choose Faculty Member --</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.faculty_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CLASSES & 2 MENTORS EACH */}
      {activeTab === 'classes' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                🏫 Department Classes & 2 Mentors Incharge
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                HOD can add number of classes/sections for each year. Every class has <strong>2 designated mentors</strong> incharge.
              </p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Add Class Section
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Class / Year Level</th>
                  <th>Section</th>
                  <th>Room No</th>
                  <th>Mentor 1 Incharge</th>
                  <th>Mentor 2 Incharge</th>
                  <th>Enrolled Students</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classesList.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      Year {cls.year_level} (Sem {cls.semester_num})
                    </td>
                    <td style={{ fontWeight: 700, color: '#881337' }}>Section {cls.section_name}</td>
                    <td>{cls.room_no}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: cls.mentor1_name ? '#059669' : '#dc2626' }}>
                        {cls.mentor1_name ? `1. ${cls.mentor1_name}` : 'Mentor 1 Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: cls.mentor2_name ? '#2563eb' : '#dc2626' }}>
                        {cls.mentor2_name ? `2. ${cls.mentor2_name}` : 'Mentor 2 Unassigned'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{cls.enrolled_count || 60} Students</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedClassToMentor(cls);
                          setMentorSelection({ mentor1_id: cls.mentor1_id || '', mentor2_id: cls.mentor2_id || '' });
                          setShowAssignMentorsModal(true);
                        }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Edit 2 Mentors
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PROJECTS */}
      {activeTab === 'projects' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                💡 Department Innovation & Capstone Projects
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                HOD has full authority to add and review student projects, assign faculty guides, and track progress.
              </p>
            </div>
            <button
              onClick={() => setShowAddProjectModal(true)}
              style={{ padding: '0.6rem 1.15rem', background: '#dc143c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Add New Project
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {projectsList.map(p => (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#fff1f2', color: '#991b1b' }}>
                    Year {p.year_level} • {p.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                    {p.status}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#0f172a' }}>{p.title}</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{p.description}</p>
                <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                  <div><strong>Faculty Guide:</strong> {p.guide_name || 'Prof. Guide'}</div>
                  <div style={{ marginTop: '0.2rem' }}><strong>Student Team:</strong> {p.student_team}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: HACKATHONS & AWARDS */}
      {activeTab === 'hackathons' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} color="#d97706" /> Student Hackathon Achievements & Awards
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                HOD and faculty can record student hackathons, awards, cash prizes, and organizer verification.
              </p>
            </div>
            <button
              onClick={() => setShowAddHackathonModal(true)}
              style={{ padding: '0.6rem 1.15rem', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Record Hackathon
            </button>
          </div>

          {hackathonsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#fffbeb', borderRadius: '12px', border: '1px dashed #fde68a' }}>
              <Award size={44} style={{ margin: '0 auto 0.75rem', color: '#d97706' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#78350f', marginBottom: '0.35rem' }}>No Hackathons Recorded Yet</h3>
              <p style={{ fontSize: '0.85rem', color: '#92400e', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                Record student achievements in national and international hackathons, coding contests, and symposiums.
              </p>
              <button
                onClick={() => setShowAddHackathonModal(true)}
                style={{ padding: '0.65rem 1.35rem', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> + Record First Hackathon
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {hackathonsList.map(h => (
                <div key={h.id} style={{ border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem', background: '#fffbeb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#d97706', color: '#fff' }}>
                      {h.achievement}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 700 }}>
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
                      <strong>Student:</strong> {h.student_name || 'Enrolled Student'} ({h.register_no || 'Roll'})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: REAL-TIME STAFF PRESENCE */}
      {activeTab === 'presence' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={22} color="#dc143c" /> Live Department Staff Presence Tracker
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Real-time locator displaying whether faculty are in <strong>Classroom Room [N]</strong> teaching their period lecture or in <strong>Faculty Staff Room (Block A)</strong>, or if on approved leave.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {(presenceData?.faculty || []).filter(f => f.department_id === user?.departmentId || f.department_code === hodStats?.department?.code).map(fac => {
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
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fac.faculty_code} • {fac.designation}</div>
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

      {/* TAB 7: DEPARTMENT ANNOUNCEMENTS (VISIBLE ONLY TO THIS DEPT) */}
      {activeTab === 'posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              📢 Publish Department Announcement
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Posts created here have scope <strong>DEPARTMENT_ONLY</strong>, meaning only students and faculty in <strong>{hodStats?.department?.name}</strong> can view them.
            </p>

            <form onSubmit={handleCreateDeptPost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Internal Assessment Schedule & Hall Allocations"
                  value={newDeptPost.title}
                  onChange={(e) => setNewDeptPost({ ...newDeptPost, title: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Tag
                </label>
                <select
                  value={newDeptPost.tag}
                  onChange={(e) => setNewDeptPost({ ...newDeptPost, tag: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="Department Notice">Department Notice</option>
                  <option value="Lab Schedule">Lab Schedule</option>
                  <option value="Project Review">Project Review</option>
                  <option value="Mentorship Session">Mentorship Session</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Notice Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Notice message for departmental faculty and students..."
                  value={newDeptPost.content}
                  onChange={(e) => setNewDeptPost({ ...newDeptPost, content: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{ padding: '0.75rem', borderRadius: '8px', background: '#dc143c', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Publish Department Notice
              </button>
            </form>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              Active Department Notices
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deptPosts.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No announcements published yet.</div>
              ) : (
                deptPosts.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#881337', color: '#fff', fontWeight: 700 }}>
                        {p.tag}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', color: '#0f172a' }}>{p.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>{p.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: HOD LEAVE REQUEST */}
      {activeTab === 'leave' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
            📝 HOD Leave Application Portal
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
            HOD leave requests are recorded and displayed in real-time on the campus presence locator as <strong>"On Leave: [Type]"</strong>.
          </p>

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
                <option value="ON_DUTY_ACADEMIC">University / Academic On-Duty</option>
                <option value="MEDICAL">Medical Leave</option>
                <option value="EARNED">Earned Leave</option>
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
                Reason & In-Charge Details
              </label>
              <textarea
                rows={3}
                placeholder="State purpose of leave and senior faculty officiating as in-charge..."
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
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

      {/* TAB: OD APPROVALS */}
      {activeTab === 'od' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
            On-Duty (OD) Final Approvals
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Event Name & Details</th>
                  <th>Date & Time</th>
                  <th>Faculty Verification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingHodODs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No pending OD applications for approval.</td></tr>
                ) : (
                  pendingHodODs.map(od => (
                    <tr key={od.id}>
                      <td style={{ fontWeight: 700 }}>{od.student_name} ({od.register_no})</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{od.event_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{od.reason} • {od.location}</div>
                      </td>
                      <td>{od.date} ({od.from_time} - {od.to_time})</td>
                      <td>
                        <span className="badge badge-present">{od.status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => { setActionItem(od); setActionType('OD'); }}
                          style={{ padding: '0.4rem 0.85rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Review & Decide
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: LOW ATTENDANCE */}
      {activeTab === 'low-att' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginBottom: '1.25rem' }}>
            ⚠️ Students with Attendance Below 75%
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Register No</th>
                  <th>Student Name</th>
                  <th>Year / Section</th>
                  <th>Total Classes</th>
                  <th>Attended (P + OD)</th>
                  <th>Current %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hodStats?.lowAttendanceStudents?.map(st => (
                  <tr key={st.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc2626' }}>{st.register_no}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                    <td>Year {st.year_level} - {st.section_name}</td>
                    <td style={{ fontWeight: 600 }}>{st.total_classes}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{st.attended}</td>
                    <td>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#dc2626' }}>
                        {st.percentage}%
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-absent">Exam Ineligible</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD FACULTY */}
      {showAddFacultyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Add Faculty to Department</h3>
              <button onClick={() => setShowAddFacultyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Faculty Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Meenakshi Sundaram"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Official Email</label>
                  <input
                    type="email"
                    placeholder="name@college.edu"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Faculty Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AD-FAC-09"
                    value={newFaculty.faculty_code}
                    onChange={(e) => setNewFaculty({ ...newFaculty, faculty_code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Designation</label>
                  <select
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Cabin Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Cabin 204, Block A"
                    value={newFaculty.cabin_room}
                    onChange={(e) => setNewFaculty({ ...newFaculty, cabin_room: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newFaculty.phone}
                  onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Faculty Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
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
      {/* MODAL 1B: EDIT FACULTY DETAILS (Only HOD can edit; Add Faculty is hidden) */}
      {/* ========================================================================= */}
      {showEditFacultyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc143c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  HOD DEPARTMENT EDITOR
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Edit Faculty Details
                </h3>
              </div>
              <button onClick={() => setShowEditFacultyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Full Faculty Name</label>
                <input
                  type="text"
                  value={editingFaculty.name}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Official Email</label>
                  <input
                    type="email"
                    value={editingFaculty.email}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Faculty Code</label>
                  <input
                    type="text"
                    value={editingFaculty.faculty_code}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, faculty_code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Designation</label>
                  <select
                    value={editingFaculty.designation}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Cabin Room</label>
                  <input
                    type="text"
                    value={editingFaculty.cabin_room}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, cabin_room: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={editingFaculty.phone}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Faculty Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditFacultyModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CLASS SECTION FOR YEAR */}
      {showAddClassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Add Class Section for Year</h3>
              <button onClick={() => setShowAddClassModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Year Level</label>
                  <select
                    value={newClass.year_level}
                    onChange={(e) => setNewClass({ ...newClass, year_level: Number(e.target.value), semester_num: Number(e.target.value) * 2 - 1 })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Section Name</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B, or C"
                    value={newClass.section_name}
                    onChange={(e) => setNewClass({ ...newClass, section_name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Classroom / Hall No</label>
                <input
                  type="text"
                  placeholder="e.g. Room A204 (Block A, 2nd Floor)"
                  value={newClass.room_no}
                  onChange={(e) => setNewClass({ ...newClass, room_no: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Mentor 1 Incharge</label>
                  <select
                    value={newClass.mentor1_id}
                    onChange={(e) => setNewClass({ ...newClass, mentor1_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Mentor 1 --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.faculty_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Mentor 2 Incharge</label>
                  <select
                    value={newClass.mentor2_id}
                    onChange={(e) => setNewClass({ ...newClass, mentor2_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Choose Mentor 2 --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.faculty_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Class with 2 Mentors
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT 2 MENTORS */}
      {showAssignMentorsModal && selectedClassToMentor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Assign 2 Mentors
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Year {selectedClassToMentor.year_level} - Section {selectedClassToMentor.section_name} ({selectedClassToMentor.room_no})
                </p>
              </div>
              <button onClick={() => setShowAssignMentorsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAssignMentors} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Mentor 1 Incharge</label>
                <select
                  value={mentorSelection.mentor1_id}
                  onChange={(e) => setMentorSelection({ ...mentorSelection, mentor1_id: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Mentor 1 --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.faculty_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Mentor 2 Incharge</label>
                <select
                  value={mentorSelection.mentor2_id}
                  onChange={(e) => setMentorSelection({ ...mentorSelection, mentor2_id: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Mentor 2 --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.faculty_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save 2 Mentors
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignMentorsModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD PROJECT */}
      {showAddProjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Add Department Project</h3>
              <button onClick={() => setShowAddProjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous Campus Navigation using Deep Learning"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. AI / IoT / Web3"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Year Level</label>
                  <select
                    value={newProject.year_level}
                    onChange={(e) => setNewProject({ ...newProject, year_level: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={1}>1st Year Mini-Project</option>
                    <option value={2}>2nd Year Mini-Project</option>
                    <option value={3}>3rd Year Pre-Capstone</option>
                    <option value={4}>4th Year Capstone</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Faculty Guide</label>
                <select
                  value={newProject.faculty_guide_id}
                  onChange={(e) => setNewProject({ ...newProject, faculty_guide_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Choose Faculty Guide --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.faculty_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Student Team Members</label>
                <input
                  type="text"
                  placeholder="e.g. Arun Kumar (AD301), K. Divya (AD305)"
                  value={newProject.student_team}
                  onChange={(e) => setNewProject({ ...newProject, student_team: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Brief Description</label>
                <textarea
                  rows={2}
                  placeholder="Project objectives and technical scope..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Register Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {showAddStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc143c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DEPARTMENT ENROLLMENT
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Enroll New Student to {hodStats?.department?.name || 'Department'}
                </h3>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Full Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Arun Kumar S"
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
                    placeholder="e.g. 711122104001"
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
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

      {/* MODAL: EDIT STUDENT DETAILS */}
      {showEditStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc143c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  HOD EDIT MODE
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

      {/* MODAL: RECORD HACKATHON */}
      {showAddHackathonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#78350f', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={20} color="#d97706" /> Record Student Hackathon Achievement
              </h3>
              <button onClick={() => setShowAddHackathonModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddHackathon} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Participating Student</label>
                <select
                  value={newHackathon.student_id}
                  onChange={(e) => setNewHackathon({ ...newHackathon, student_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.register_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Event / Hackathon Name</label>
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. AICTE / IIT Madras"
                    value={newHackathon.organizer}
                    onChange={(e) => setNewHackathon({ ...newHackathon, organizer: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Event Date</label>
                  <input
                    type="date"
                    value={newHackathon.event_date}
                    onChange={(e) => setNewHackathon({ ...newHackathon, event_date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Project Title Submitted</label>
                <input
                  type="text"
                  placeholder="e.g. AI-driven Smart Water Metering and Leakage Detection"
                  value={newHackathon.project_title}
                  onChange={(e) => setNewHackathon({ ...newHackathon, project_title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Achievement / Prize</label>
                  <select
                    value={newHackathon.achievement}
                    onChange={(e) => setNewHackathon({ ...newHackathon, achievement: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="1st Prize / Winner">1st Prize / Winner</option>
                    <option value="2nd Prize / Runner Up">2nd Prize / Runner Up</option>
                    <option value="3rd Prize">3rd Prize</option>
                    <option value="Special Jury Award">Special Jury Award</option>
                    <option value="Finalist">Finalist</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Cash Prize Won</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,00,000"
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
                  Save Hackathon Record
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

      {/* REVIEW ACTION MODAL (OD OR CORRECTION) */}
      {actionItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Final HOD Approval: {actionType === 'OD' ? 'On-Duty Application' : 'Attendance Correction'}
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Student: <strong>{actionItem.student_name}</strong> ({actionItem.register_no})
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Event / Reason:</strong> {actionItem.event_name || actionItem.reason}</div>
              <div style={{ marginTop: '0.25rem' }}><strong>Date:</strong> {actionItem.date}</div>
              {actionItem.faculty_comment && (
                <div style={{ marginTop: '0.25rem', color: '#059669' }}>
                  <strong>Faculty Mentor Verification:</strong> {actionItem.faculty_comment}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>HOD Decision Notes / Comments</label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional decision remarks..."
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => actionType === 'OD' ? handleHodODDecision('APPROVE') : handleHodCorrectionDecision('APPROVE')}
                style={{ flex: 1, padding: '0.75rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Approve (Grant OD / Present)
              </button>
              <button
                onClick={() => actionType === 'OD' ? handleHodODDecision('REJECT') : handleHodCorrectionDecision('REJECT')}
                style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Reject
              </button>
              <button
                onClick={() => setActionItem(null)}
                style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
