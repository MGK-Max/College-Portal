const API_BASE = (typeof window !== 'undefined' && window.location.port === '5000') ? '/api' : 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cams_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('cams_token');
    localStorage.removeItem('cams_user');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Departments
  getDepartments: () => request('/departments'),
  getDepartment: (id) => request(`/departments/${id}`),
  createDepartment: (data) => request('/departments', { method: 'POST', body: data }),
  updateDepartment: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: data }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  getDepartmentChats: (deptId, yearLevel) => request(`/departments/${deptId}/chats${yearLevel !== undefined ? `?year_level=${yearLevel}` : ''}`),
  sendDepartmentChat: (deptId, data) => request(`/departments/${deptId}/chats`, { method: 'POST', body: data }),

  // HOD
  getHods: () => request('/hod'),
  assignHod: (data) => request('/hod', { method: 'POST', body: data }),
  getHodStats: (deptId) => request(`/hod/dashboard-stats${deptId ? `?department_id=${deptId}` : ''}`),

  // Faculty
  getFaculty: (deptId) => request(`/faculty${deptId ? `?department_id=${deptId}` : ''}`),
  createFaculty: (data) => request('/faculty', { method: 'POST', body: data }),
  updateFaculty: (id, data) => request(`/faculty/${id}`, { method: 'PUT', body: data }),
  deleteFaculty: (id) => request(`/faculty/${id}`, { method: 'DELETE' }),
  getFacultyStats: (facId) => request(`/faculty/dashboard-stats${facId ? `?faculty_id=${facId}` : ''}`),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: data }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: data }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getStudentDashboardStats: () => request('/students/me/dashboard-stats'),

  // Academics
  getAcademicYears: () => request('/academics/academic-years'),
  getSections: (deptId) => request(`/academics/sections${deptId ? `?department_id=${deptId}` : ''}`),
  createSection: (data) => request('/academics/sections', { method: 'POST', body: data }),
  getClasses: (deptId) => request(`/academics/classes${deptId ? `?department_id=${deptId}` : ''}`),
  createClass: (data) => request('/academics/classes', { method: 'POST', body: data }),
  getSubjects: (deptId) => request(`/academics/subjects${deptId ? `?department_id=${deptId}` : ''}`),
  createSubject: (data) => request('/academics/subjects', { method: 'POST', body: data }),
  getFacultySubjects: () => request('/academics/faculty-subjects'),
  assignFacultySubject: (data) => request('/academics/assign-faculty-subject', { method: 'POST', body: data }),

  // Timetable
  getTimetable: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/timetable${query ? `?${query}` : ''}`);
  },
  getTodayTimetable: () => request('/timetable/today'),
  createTimetable: (data) => request('/timetable', { method: 'POST', body: data }),

  // Attendance
  getClassSession: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/class-session?${query}`);
  },
  submitAttendance: (data) => request('/attendance/submit', { method: 'POST', body: data }),
  getStudentAttendance: (id) => request(`/attendance/student/${id}`),
  getCollegeSummary: () => request('/attendance/college-summary'),

  // On-Duty (OD)
  getODRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/od${query ? `?${query}` : ''}`);
  },
  applyOD: (data) => request('/od', { method: 'POST', body: data }),
  verifyOD: (id, decision, comments) => request(`/od/${id}/verify`, { method: 'PUT', body: { decision, comments } }),
  approveOD: (id, decision, comments) => request(`/od/${id}/approve`, { method: 'PUT', body: { decision, comments } }),

  // Corrections
  getCorrections: () => request('/corrections'),
  applyCorrection: (data) => request('/corrections', { method: 'POST', body: data }),
  verifyCorrection: (id, decision, comments) => request(`/corrections/${id}/verify`, { method: 'PUT', body: { decision, comments } }),
  approveCorrection: (id, decision, comments) => request(`/corrections/${id}/approve`, { method: 'PUT', body: { decision, comments } }),

  // Reports
  getCollegeReport: () => request('/reports/college'),
  getDepartmentReport: (deptId) => request(`/reports/department${deptId ? `?department_id=${deptId}` : ''}`),
  getClassReport: (classId) => request(`/reports/class${classId ? `?class_id=${classId}` : ''}`),
  getSubjectReport: (subjectId) => request(`/reports/subject${subjectId ? `?subject_id=${subjectId}` : ''}`),
  getFacultyReport: (facId) => request(`/reports/faculty${facId ? `?faculty_id=${facId}` : ''}`),
  getStudentReport: (studentId) => request(`/reports/student${studentId ? `?student_id=${studentId}` : ''}`),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', { method: 'PUT', body: { settings } }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Dean (Cluster Head oversight)
  getDeanOverview: () => request('/dean/overview'),
  getDeanPinpoint: (deptId) => request(`/dean/pinpoint/${deptId}`),

  // Projects (HOD & Faculty)
  getProjects: (deptId) => request(`/projects${deptId ? `?department_id=${deptId}` : ''}`),
  createProject: (data) => request('/projects', { method: 'POST', body: data }),
  updateProjectStatus: (id, status) => request(`/projects/${id}/status`, { method: 'PUT', body: { status } }),

  // Hackathons (Student achievements recorded by faculty)
  getHackathons: () => request('/hackathons'),
  createHackathon: (data) => request('/hackathons', { method: 'POST', body: data }),

  // Leaves (Student, Faculty, HOD, Dean)
  getLeaves: (scope) => request(`/leaves${scope ? `?scope=${scope}` : ''}`),
  submitLeave: (data) => request('/leaves', { method: 'POST', body: data }),

  // Posts / Announcements (4 Streams: College Public, Dean Cluster, Dept HOD, Dept News)
  getPosts: () => request('/posts'),
  createPost: (data) => request('/posts', { method: 'POST', body: data }),

  // Real-time Presence Locator
  getPresence: () => request('/presence'),

  // HOD Management
  getHodFaculty: (deptId) => request(`/hod/faculty${deptId ? `?department_id=${deptId}` : ''}`),
  createHodFaculty: (data) => request('/hod/faculty', { method: 'POST', body: data }),
  updateHodFaculty: (id, data) => request(`/hod/faculty/${id}`, { method: 'PUT', body: data }),
  getHodYearIncharges: (deptId) => request(`/hod/year-incharge${deptId ? `?department_id=${deptId}` : ''}`),
  setHodYearIncharge: (data) => request('/hod/year-incharge', { method: 'POST', body: data }),
  getHodClasses: (deptId) => request(`/hod/classes${deptId ? `?department_id=${deptId}` : ''}`),
  createHodClass: (data) => request('/hod/classes', { method: 'POST', body: data }),
  assignClassMentors: (data) => request('/hod/assign-class', { method: 'POST', body: data }),

  // Timetable Arrange
  updateTimetable: (id, data) => request(`/timetable/${id}`, { method: 'PUT', body: data }),
  deleteTimetable: (id) => request(`/timetable/${id}`, { method: 'DELETE' }),

  // 5-Minute Late Rule Verification
  reportLateReason: (data) => request('/attendance/report-late', { method: 'POST', body: data }),
  getStudentLateReports: () => request('/attendance/student-late-reports'),
  approveLateReason: (data) => request('/attendance/approve-late', { method: 'POST', body: data })
};
