import React, { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import { GetDashboardSummary, getSchoolName } from '../../Server'

const quickActions = [
  { title: 'Add Teacher', description: 'Create teacher profiles and assign classes.', path: '/mainpage/teacher/addTeacher' },
  { title: 'Add Student', description: 'Register new students and manage admissions.', path: '/mainpage/student/addStudent' },
  { title: 'Fee Summary', description: 'Review dues, records, and payment status.', path: '/mainpage/billing' },
  { title: 'Class Details', description: 'Track sections, capacity, and class allocation.', path: '/mainpage/student/classDetails' }
]

const defaultSummary = {
  totalTeachers: 0,
  totalStudents: 0,
  pendingFees: 0,
  pendingFeeAmount: 0,
  upcomingEvents: 0,
  upcomingItems: [],
  agenda: []
}

const Dashboard = () => {
  const nav = useNavigate();
  const [summary, setSummary] = useState(defaultSummary);
  const schoolName = getSchoolName();

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await GetDashboardSummary();
      if (response && response.totalTeachers !== undefined) {
        setSummary(response);
      }
    };

    fetchSummary();
  }, []);

  const statCards = useMemo(() => [
    { label: 'Total Teachers', value: summary.totalTeachers, tone: 'blue' },
    { label: 'Active Students', value: summary.totalStudents, tone: 'green' },
    { label: 'Fee Dues', value: summary.pendingFees ?? 0, tone: 'amber' },
    { label: 'Events', value: summary.upcomingEvents ?? 0, tone: 'purple' }
  ], [summary]);

  return (
    <div className='dashboard-page'>
      <div className='dashboard-shell'>
        <header className='dashboard-header hero-header'>
          <div className='hero-copy'>
            <p className='dashboard-kicker'>School overview</p>
            <h1>Welcome to {schoolName} Admin Dashboard</h1>
            <p className='hero-subtitle'>Manage admissions, staff, fees, and daily school operations with a clear view of everything happening across campus.</p>
          </div>
        </header>

        <section className='stats-grid'>
          {statCards.map((item) => (
            <div key={item.label} className={`stat-card tone-${item.tone}`}>
              <div className='stat-top'>
                <span className='stat-label'>{item.label}</span>
              </div>
              <div className='stat-value'>{item.value}</div>
            </div>
          ))}
        </section>

        <section className='content-grid single-panel'>
          <div className='panel panel-main'>
            <div className='panel-header'>
              <h2>Quick actions</h2>
            </div>

            <div className='action-grid'>
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  className='action-card'
                  onClick={() => nav(action.path)}
                >
                  <div className='action-card-title'>{action.title}</div>
                  <div className='action-card-text'>{action.description}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard