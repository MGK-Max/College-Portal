import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Users,
  ShieldAlert,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function TakeAttendanceView({ sessionParams, onBack, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [roster, setRoster] = useState([]);
  
  // Live Timer states
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Late Reason Report & Approval Modal (Prompt requirement: 5-minute late rule with acceptable reason granting present)
  const [lateModalStudent, setLateModalStudent] = useState(null);
  const [lateReasonText, setLateReasonText] = useState('College bus delayed due to traffic block');
  const [lateReasonAccepted, setLateReasonAccepted] = useState(true);

  // Late rule simulation toggle for effortless testing of both inside-window and outside-window behaviors
  const [testMode, setTestMode] = useState('NORMAL'); // 'NORMAL', 'SIMULATE_LATE'

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getClassSession({
        class_id: sessionParams.classId,
        subject_id: sessionParams.subjectId,
        date: sessionParams.date,
        period: sessionParams.period
      });
      setSessionData(data);
      setRoster(data.students);
      setSecondsRemaining(data.timePolicy.secondsRemaining);
      setIsWindowOpen(data.timePolicy.isWindowOpen);
    } catch (err) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionParams]);

  // Live countdown ticker
  useEffect(() => {
    if (!sessionData) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (testMode === 'SIMULATE_LATE') {
          setIsWindowOpen(false);
          return 0;
        }
        if (prev <= 1) {
          setIsWindowOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData, testMode]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Status handlers
  const handleStatusChange = (studentId, newStatus) => {
    // If student arrived after 5-minute window and trying to mark PRESENT, open Late Reason dialog
    if (newStatus === 'PRESENT' && (!isWindowOpen || testMode === 'SIMULATE_LATE')) {
      const targetStudent = roster.find(s => s.student_id === studentId);
      setLateModalStudent(targetStudent);
      setLateReasonText(targetStudent?.late_reason || 'Arrived after 5-minute late window. Reporting acceptable justification.');
      setLateReasonAccepted(true);
      return;
    }

    setRoster(prev => prev.map(st => {
      if (st.student_id === studentId) {
        return { ...st, current_status: newStatus };
      }
      return st;
    }));
  };

  // Confirm Late Reason & Approval
  const handleConfirmLateReason = () => {
    if (!lateModalStudent) return;
    setRoster(prev => prev.map(st => {
      if (st.student_id === lateModalStudent.student_id) {
        return {
          ...st,
          current_status: lateReasonAccepted ? 'PRESENT' : 'ABSENT',
          late_flag: 1,
          late_reason: lateReasonText,
          late_reason_accepted: lateReasonAccepted ? 1 : 0
        };
      }
      return st;
    }));
    setLateModalStudent(null);
  };

  // MARK ALL PRESENT
  const handleMarkAllPresent = () => {
    setRoster(prev => prev.map(st => {
      // Don't overwrite Approved OD
      if (st.is_auto_od) return st;
      return { ...st, current_status: 'PRESENT' };
    }));
  };

  // Summary counts
  const totalCount = roster.length;
  const presentCount = roster.filter(s => s.current_status === 'PRESENT').length;
  const absentCount = roster.filter(s => s.current_status === 'ABSENT').length;
  const odCount = roster.filter(s => s.current_status === 'OD').length;

  // Submit Attendance to Backend
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        class_id: sessionParams.classId,
        subject_id: sessionParams.subjectId,
        date: sessionParams.date,
        period: sessionParams.period,
        records: roster.map(s => ({
          student_id: s.student_id,
          status: s.current_status,
          late_flag: s.late_flag || (!isWindowOpen || testMode === 'SIMULATE_LATE' ? 1 : 0),
          late_reason: s.late_reason || (s.late_flag ? 'Late arrival recorded' : null),
          late_reason_accepted: s.late_reason_accepted ? 1 : 0
        })),
        simulated_minutes_late: testMode === 'SIMULATE_LATE' ? 8 : 0,
        bypass_late_rule: false
      };

      const res = await api.submitAttendance(payload);
      setSubmitResult(res);
      setShowConfirmModal(false);

      // Re-fetch to reflect permanently saved data and any backend-enforced late penalties
      await fetchSession();

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit attendance');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <Clock size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#dc143c' }} />
        <p style={{ fontWeight: 600 }}>Loading class roster and server time policy...</p>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc143c', fontWeight: 600, marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ padding: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626' }}>
          {error}
        </div>
      </div>
    );
  }

  const { sessionInfo, timePolicy } = sessionData;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Today's Classes
        </button>

        {/* Live Simulator for 5-Minute Late Rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
          <span style={{ fontWeight: 600, color: '#64748b' }}>Late Rule Simulator:</span>
          <button
            onClick={() => { setTestMode('NORMAL'); setIsWindowOpen(true); }}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: testMode === 'NORMAL' ? '#dcfce7' : '#f1f5f9',
              color: testMode === 'NORMAL' ? '#15803d' : '#64748b',
              border: testMode === 'NORMAL' ? '1px solid #86efac' : '1px solid transparent'
            }}
          >
            Inside Window (&lt; 5 min)
          </button>
          <button
            onClick={() => { setTestMode('SIMULATE_LATE'); setIsWindowOpen(false); }}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: testMode === 'SIMULATE_LATE' ? '#fee2e2' : '#f1f5f9',
              color: testMode === 'SIMULATE_LATE' ? '#b91c1c' : '#64748b',
              border: testMode === 'SIMULATE_LATE' ? '1px solid #fca5a5' : '1px solid transparent'
            }}
          >
            Simulate Late (&gt; 5 min)
          </button>
        </div>
      </div>

      {/* Main Attendance Card Header (Format of Prompt Requirement 38) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4c0519 0%, #991b1b 100%)',
          color: '#ffffff',
          padding: '1.5rem 2rem'
        }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fecdd3', fontWeight: 700, marginBottom: '0.25rem' }}>
            {sessionData.collegeName || 'KALAIGNARKARUANIDHI INSTITUTE OF TECHNOLOGY'}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            {sessionInfo.subject_name} ({sessionInfo.subject_code})
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 500 }}>
            <span>Year {sessionInfo.year_level} • {sessionInfo.department_name} • {sessionInfo.section_name}</span>
            <span>•</span>
            <span>Room: {sessionInfo.classroom || sessionInfo.room_no}</span>
            <span>•</span>
            <span>Period {sessionInfo.period} ({sessionInfo.start_time || '09:00'} - {sessionInfo.end_time || '10:00'})</span>
            <span>•</span>
            <span>Date: {new Date(sessionInfo.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>

          {/* Period In-Charge Staff Banner (Prompt: staff can poll attendance if they are incharge of that period) */}
          {sessionData.inchargeFaculty && (
            <div style={{
              marginTop: '0.85rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: sessionData.can_poll_attendance === false ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.15)',
              border: sessionData.can_poll_attendance === false ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="#ffffff" />
                <span>
                  <strong>Period In-Charge Staff:</strong> {sessionData.inchargeFaculty.faculty_name} ({sessionData.inchargeFaculty.faculty_code})
                </span>
              </div>
              <div>
                {sessionData.can_poll_attendance === false ? (
                  <span style={{ background: '#b91c1c', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                    ⚠️ Only this in-charge staff can poll attendance
                  </span>
                ) : (
                  <span style={{ background: '#15803d', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                    ✓ Authorized to poll attendance
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5-Minute Late Rule Banner & Countdown Timer */}
        <div style={{
          padding: '1.25rem 2rem',
          background: isWindowOpen ? '#f0fdf4' : '#fef2f2',
          borderBottom: `2px solid ${isWindowOpen ? '#86efac' : '#fca5a5'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: isWindowOpen ? '#dcfce7' : '#fee2e2',
              color: isWindowOpen ? '#16a34a' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isWindowOpen ? <Clock size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isWindowOpen ? '#15803d' : '#991b1b' }}>
                {isWindowOpen
                  ? `STRICT ${timePolicy.lateAllowanceMinutes}-MINUTE ATTENDANCE WINDOW ACTIVE`
                  : 'ATTENDANCE WINDOW CLOSED'}
              </div>
              <div style={{ fontSize: '0.78rem', color: isWindowOpen ? '#166534' : '#b91c1c', marginTop: '0.15rem' }}>
                {isWindowOpen ? (
                  <>
                    Class starts: <strong>{timePolicy.startTime} AM</strong> • Attendance closes: <strong>{timePolicy.closesAtTime}</strong>
                    <br />
                    <span>Rule: 9:00–9:05 → Present allowed • After 9:05 → Present NOT allowed (Server Enforced)</span>
                  </>
                ) : (
                  <span>Attendance window closed. Student arrived more than {timePolicy.lateAllowanceMinutes} minutes late and is marked Absent.</span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: isWindowOpen ? '#0f172a' : '#7f1d1d',
            color: '#ffffff',
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                {isWindowOpen ? 'Attendance Closes In' : 'Status'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '1px' }}>
                {isWindowOpen ? formatCountdown(secondsRemaining) : 'CLOSED'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Mark All Present */}
        <div style={{ padding: '1rem 2rem', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleMarkAllPresent}
              disabled={!isWindowOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                background: isWindowOpen ? '#16a34a' : '#94a3b8',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: isWindowOpen ? '0 2px 6px rgba(22, 163, 74, 0.3)' : 'none',
                cursor: isWindowOpen ? 'pointer' : 'not-allowed'
              }}
            >
              <Sparkles size={16} />
              MARK ALL PRESENT
            </button>

            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Instantly marks all eligible students Present. Individual toggles can still be adjusted.
            </span>
          </div>

          {/* Quick Counter Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ color: '#475569' }}>Total: {totalCount}</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ color: '#16a34a' }}>Present: {presentCount}</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ color: '#dc2626' }}>Absent: {absentCount}</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ color: '#d97706' }}>OD: {odCount}</span>
          </div>
        </div>

        {/* Student Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '150px' }}>Register No</th>
                <th>Student Name</th>
                <th style={{ width: '220px' }}>Special Status</th>
                <th style={{ width: '300px', textAlign: 'center' }}>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student, idx) => {
                const isPresent = student.current_status === 'PRESENT';
                const isAbsent = student.current_status === 'ABSENT';
                const isOD = student.current_status === 'OD';

                return (
                  <tr key={student.student_id}>
                    <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#991b1b' }}>
                      {student.register_no}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: '#475569'
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {student.is_auto_od ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          background: '#fef3c7',
                          color: '#b45309',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          ★ Approved OD: {student.od_event_name || 'Official Duty'}
                        </span>
                      ) : student.late_reason_accepted === 1 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          ✓ Late Justified: {student.late_reason}
                        </span>
                      ) : student.late_flag === 1 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          ⚠️ Late &gt; 5 min (Absent)
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Regular Class</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                        {/* PRESENT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.student_id, 'PRESENT')}
                          className={`btn-status btn-status-present ${isPresent ? 'active' : ''}`}
                          title={!isWindowOpen ? 'Late (> 5 min). Click to enter and accept late reason to grant Present.' : 'Mark Present'}
                        >
                          <CheckCircle2 size={14} />
                          PRESENT
                        </button>

                        {/* ABSENT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.student_id, 'ABSENT')}
                          className={`btn-status btn-status-absent ${isAbsent ? 'active' : ''}`}
                          title="Mark Absent"
                        >
                          <XCircle size={14} />
                          ABSENT
                        </button>

                        {/* OD BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.student_id, 'OD')}
                          className={`btn-status btn-status-od ${isOD ? 'active' : ''}`}
                          title="Mark On-Duty"
                        >
                          <AlertTriangle size={14} />
                          OD
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Submit Button */}
        <div style={{
          padding: '1.5rem 2rem',
          background: '#f8fafc',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Attendance Overview</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              Total: {totalCount} &nbsp;|&nbsp;
              <span style={{ color: '#16a34a' }}> Present: {presentCount}</span> &nbsp;|&nbsp;
              <span style={{ color: '#dc2626' }}> Absent: {absentCount}</span> &nbsp;|&nbsp;
              <span style={{ color: '#d97706' }}> OD: {odCount}</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={sessionData.can_poll_attendance === false || submitting}
            style={{
              padding: '0.85rem 2.25rem',
              borderRadius: '10px',
              background: sessionData.can_poll_attendance === false ? '#94a3b8' : '#dc143c',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: sessionData.can_poll_attendance === false ? 'none' : '0 4px 14px rgba(220, 20, 60, 0.4)',
              cursor: sessionData.can_poll_attendance === false ? 'not-allowed' : 'pointer',
              opacity: sessionData.can_poll_attendance === false ? 0.75 : 1
            }}
          >
            <Send size={18} />
            {sessionData.can_poll_attendance === false
              ? 'Only In-Charge Can Poll Attendance'
              : sessionData.isAlreadySubmitted
              ? 'Update Attendance Records'
              : 'Poll / Submit Attendance'}
          </button>
        </div>
      </div>

      {/* Submission Feedback Banner */}
      {submitResult && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: submitResult.isLateWindowExceeded ? '#fffbeb' : '#ecfdf5',
          border: `1px solid ${submitResult.isLateWindowExceeded ? '#fde68a' : '#a7f3d0'}`,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <CheckCircle2 size={24} color={submitResult.isLateWindowExceeded ? '#d97706' : '#059669'} />
          <div>
            <div style={{ fontWeight: 700, color: submitResult.isLateWindowExceeded ? '#b45309' : '#065f46' }}>
              {submitResult.message}
            </div>
            {submitResult.warningMessage && (
              <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.25rem' }}>
                ⚠️ {submitResult.warningMessage}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem' }}>
              Final Database Records: <strong>{submitResult.summary.present} Present</strong>, <strong>{submitResult.summary.absent} Absent</strong>, <strong>{submitResult.summary.od} OD</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Prompt Requirement 12) */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Attendance Submission
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to submit attendance? This will permanently save the records to the college database and log the audit trail.
            </p>

            <div style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              textAlign: 'center',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Present</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{presentCount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Absent</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>{absentCount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#d97706' }}>OD</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>{odCount}</div>
              </div>
            </div>

            {testMode === 'SIMULATE_LATE' && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                ⚠️ <strong>5-Minute Rule Alert:</strong> Submission simulated beyond allowed 5-minute late window. Any students marked Present will automatically be converted to ABSENT by the server!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submitting}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  background: '#dc143c',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(220, 20, 60, 0.3)'
                }}
              >
                {submitting ? 'Saving...' : 'CONFIRM & SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LATE REASON REPORT & FACULTY/MENTOR APPROVAL MODAL */}
      {lateModalStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Late Arrival &gt; 5 Minutes Report
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Student: <strong>{lateModalStudent.name}</strong> ({lateModalStudent.register_no})
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              <strong>Institutional Policy:</strong> If students are late after 5 minutes, they must report the reason. If the period faculty or mentor finds the reason acceptable, they can grant <strong>PRESENT</strong>.
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Reported Reason for Delay:
              </label>
              <textarea
                rows={3}
                value={lateReasonText}
                onChange={(e) => setLateReasonText(e.target.value)}
                placeholder="e.g. College bus delayed in traffic block / Medical infirmary emergency / Lab equipment issue"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{
              background: lateReasonAccepted ? '#f0fdf4' : '#fff5f5',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              border: lateReasonAccepted ? '1px solid #bbf7d0' : '1px solid #fecdd3',
              marginBottom: '1.25rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: lateReasonAccepted ? '#166534' : '#991b1b' }}>
                <input
                  type="checkbox"
                  checked={lateReasonAccepted}
                  onChange={(e) => setLateReasonAccepted(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                Reason is acceptable — Grant PRESENT to student
              </label>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', marginLeft: '1.75rem' }}>
                {lateReasonAccepted
                  ? '✓ Verified by Period Faculty / Mentor. Student will be recorded as PRESENT with late reason documented.'
                  : '⚠️ Reason rejected. Student will be marked ABSENT with a late penalty violation.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleConfirmLateReason}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: lateReasonAccepted ? '#16a34a' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {lateReasonAccepted ? 'Grant PRESENT' : 'Confirm ABSENT (Late)'}
              </button>
              <button
                type="button"
                onClick={() => setLateModalStudent(null)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
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
