import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  ClipboardList,
  AlertCircle,
  MapPin,
  Briefcase,
  Award,
  PlusCircle,
  Clock
} from 'lucide-react';

export default function Sidebar({ user, currentView, onViewChange, pendingCounts = {} }) {
  const role = user?.role || 'STUDENT';

  const adminNav = [
    { id: 'admin-dashboard', label: 'Institutional Dashboard', icon: LayoutDashboard },
    { id: 'admin-departments', label: 'Cluster & Departments', icon: Building2 },
    { id: 'admin-sections', label: 'Class Sections & Add', icon: Building2, highlight: true },
    { id: 'admin-presence', label: 'Live Presence Locator', icon: MapPin },
    { id: 'admin-faculty', label: 'Faculty Management', icon: Users },
    { id: 'admin-students', label: 'Student Management', icon: GraduationCap },
    { id: 'admin-projects', label: 'College Projects', icon: Briefcase },
    { id: 'admin-leaves', label: 'Campus Leave Registry', icon: CalendarCheck },
    { id: 'admin-academics', label: 'Academics & Timetable', icon: CalendarDays },
    { id: 'admin-settings', label: 'Attendance & Late Rules', icon: Settings },
    { id: 'admin-reports', label: 'Reports & Analytics', icon: FileSpreadsheet },
    { id: 'admin-audit', label: 'Audit Logs', icon: ShieldCheck }
  ];

  const deanNav = [
    { id: 'dean-dashboard', label: 'Cluster Directorate', icon: LayoutDashboard },
    { id: 'dean-pinpoint', label: 'Pinpoint Departments', icon: Building2 },
    { id: 'dean-presence', label: 'Live Presence Locator', icon: MapPin },
    { id: 'dean-projects', label: 'Cluster R&D & Projects', icon: Briefcase },
    { id: 'dean-posts', label: 'Directives & Announcements', icon: ClipboardList },
    { id: 'dean-leaves', label: 'Cluster Leaves & My Leave', icon: CalendarCheck }
  ];

  const hodNav = [
    { id: 'hod-departments', label: 'Department Hierarchy & Classes', icon: Building2, highlight: true },
    { id: 'hod-dashboard', label: 'Department Overview', icon: LayoutDashboard },
    { id: 'hod-take-attendance', label: 'Take Attendance (Live)', icon: CalendarCheck, highlight: true },
    { id: 'hod-faculty', label: 'Faculty & Add Staff', icon: Users },
    { id: 'hod-students', label: 'Student Roster & Add', icon: GraduationCap },
    { id: 'hod-year-incharge', label: '1st - 4th Yr Incharges', icon: ShieldCheck },
    { id: 'hod-classes', label: 'Classes & 2 Mentors', icon: Building2 },
    { id: 'hod-projects', label: 'Department Projects', icon: Briefcase },
    { id: 'hod-hackathons', label: 'Hackathons & Awards', icon: Award },
    { id: 'hod-presence', label: 'Live Staff Presence', icon: MapPin },
    { id: 'hod-timetable', label: 'Department Timetable', icon: CalendarDays },
    { id: 'hod-posts', label: 'Dept Announcements', icon: ClipboardList },
    { id: 'hod-od', label: 'OD Approvals', icon: CheckCircle2, badge: pendingCounts.odApprovals },
    { id: 'hod-leaves', label: 'Leave Requests', icon: CalendarCheck }
  ];

  const facultyNav = [
    // DEPARTMENT SECTION
    { id: 'faculty-departments', label: 'Department Hierarchy & Classes', icon: Building2, highlight: true },
    { id: 'faculty-year-incharge', label: 'Department Year Incharges', icon: ShieldCheck },
    { id: 'faculty-dept-projects', label: 'Department Projects & R&D', icon: Briefcase },
    // FACULTY SECTION
    { id: 'faculty-dashboard', label: 'Faculty Section: Overview', icon: LayoutDashboard },
    { id: 'faculty-timetable', label: 'Faculty Section: My Timetable', icon: CalendarDays },
    { id: 'faculty-presence', label: 'Faculty Section: Staffroom/Presence', icon: MapPin },
    { id: 'faculty-leaves', label: 'Faculty Section: My Leaves', icon: CalendarCheck },
    // STUDENT SECTION
    { id: 'faculty-take-attendance', label: 'Student Section: Take Attendance', icon: CalendarCheck, highlight: true },
    { id: 'faculty-students', label: 'Student Section: Roster & Add', icon: GraduationCap },
    { id: 'faculty-hackathons', label: 'Student Section: Hackathons', icon: Award },
    { id: 'faculty-mentors', label: 'Student Section: Class Mentors', icon: Users },
    // POSTS
    { id: 'faculty-posts', label: 'College, Dean & Dept Posts', icon: ClipboardList }
  ];

  const studentNav = [
    { id: 'student-dashboard', label: 'Dashboard & Attendance', icon: LayoutDashboard },
    { id: 'student-od', label: 'Apply OD (On-Duty)', icon: PlusCircle, highlight: true },
    { id: 'student-leaves', label: 'Reason for Leave', icon: CalendarCheck },
    { id: 'student-late-report', label: 'Report Late to Class', icon: Clock, highlight: true },
    { id: 'student-projects', label: 'My Projects', icon: Briefcase, highlight: true },
    { id: 'student-timetable', label: 'Class Timetable', icon: CalendarDays }
  ];

  let navItems = [];
  if (role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR') navItems = adminNav;
  else if (role === 'DEAN') navItems = deanNav;
  else if (role === 'HOD') navItems = hodNav;
  else if (role === 'FACULTY') navItems = facultyNav;
  else navItems = studentNav;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.4)'
          }}>
            K
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
              CAMS PORTAL
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fda4af' }}>
              KIT Autonomous
            </div>
          </div>
        </div>

        {/* User Scope Badge */}
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#fecdd3', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Profile
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 500 }}>
            {user?.role === 'SUPER_ADMIN' && 'Super Administrator'}
            {user?.role === 'HOD' && `HOD • ${user?.department_code || 'Dept'}`}
            {user?.role === 'FACULTY' && `Faculty • ${user?.faculty_code || 'Dept'}`}
            {user?.role === 'STUDENT' && `Roll: ${user?.register_no || 'Student'}`}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
        <div style={{ padding: '0 0.5rem 0.4rem', fontSize: '0.68rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Menu
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                width: '100%',
                background: isActive
                  ? '#e11d48'
                  : item.highlight
                  ? 'rgba(225, 29, 72, 0.22)'
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : item.highlight
                  ? '#ffffff'
                  : '#fecdd3',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                textAlign: 'left',
                border: item.highlight && !isActive ? '1px dashed #f43f5e' : '1px solid transparent',
                boxShadow: isActive ? '0 2px 8px rgba(225, 29, 72, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#ffffff' : item.highlight ? '#ffffff' : '#fda4af'} />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: '#ff2d55',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(255, 45, 85, 0.4)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.72rem', color: '#fda4af', textAlign: 'center' }}>
        <span style={{ color: '#ffffff', fontWeight: 600 }}>College Attendance v2.4</span>
        <div style={{ color: '#fecdd3', marginTop: '0.2rem' }}>Strict 5-Min Server Clock Policy</div>
      </div>
    </aside>
  );
}
