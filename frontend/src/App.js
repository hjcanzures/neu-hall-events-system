import { useEffect ,useMemo, useState } from 'react';
import './App.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HALLS = ['University Hall', 'Multipurpose Hall PSB'];
const ORGANIZATIONS = ['Paradigm', 'ACSS', 'SITES'];
const ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'admin', 'calendar'],
  Staff: ['dashboard', 'calendar'],
  'Student Org': ['dashboard', 'request', 'calendar'],
};

const INITIAL_REQUESTS = [
  {
    id: 'REQ-4021',
    eventName: 'Leadership Summit',
    organization: 'CCS',
    hall: 'University Hall',
    date: '2026-03-24',
    startTime: '09:00',
    endTime: '13:00',
    attendees: 180,
    status: 'Approved',
    priority: 'High',
  },
  {
    id: 'REQ-4022',
    eventName: 'Innovation Fair',
    organization: 'SITES',
    hall: 'Multipurpose Hall PSB',
    date: '2026-03-28',
    startTime: '11:00',
    endTime: '16:00',
    attendees: 140,
    status: 'Pending',
    priority: 'Medium',
  },
  {
    id: 'REQ-4023',
    eventName: 'Campus Mixer',
    organization: 'Paradigm',
    hall: 'University Hall',
    date: '2026-04-02',
    startTime: '15:00',
    endTime: '19:00',
    attendees: 220,
    status: 'Pending',
    priority: 'High',
  },
  {
    id: 'REQ-4024',
    eventName: 'Choir Rehearsal',
    organization: 'ACSS',
    hall: 'Multipurpose Hall PSB',
    date: '2026-03-25',
    startTime: '13:00',
    endTime: '16:00',
    attendees: 80,
    status: 'Rejected',
    priority: 'Low',
  },
];

function buildStatusClass(status) {
  return status.toLowerCase().replace(' ', '-');
}

function toMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(':')) {
    return 0;
  }
  const [h, m] = timeValue.split(':');
  return Number(h) * 60 + Number(m);
}

function hasTimeConflict(existingRequest, candidateRequest) {
  if (
    existingRequest.hall !== candidateRequest.hall ||
    existingRequest.date !== candidateRequest.date ||
    existingRequest.status === 'Rejected'
  ) {
    return false;
  }

  const existingStart = toMinutes(existingRequest.startTime);
  const existingEnd = toMinutes(existingRequest.endTime);
  const candidateStart = toMinutes(candidateRequest.startTime);
  const candidateEnd = toMinutes(candidateRequest.endTime);
  return candidateStart < existingEnd && candidateEnd > existingStart;
}

function getPriorityFromAttendees(attendees) {
  if (attendees >= 180) {
    return 'High';
  }
  if (attendees >= 80) {
    return 'Medium';
  }
  return 'Low';
}

function formatDisplayDate(rawDate) {
  if (!rawDate) {
    return 'No date';
  }
  return new Date(rawDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function inferUserProfileFromEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  const localPart = normalized.split('@')[0] || '';

  if (localPart.includes('admin')) {
    return { role: 'Admin', organization: '' };
  }

  if (localPart.includes('staff')) {
    return { role: 'Staff', organization: '' };
  }

  if (localPart.includes('acss')) {
    return { role: 'Student Org', organization: 'ACSS' };
  }

  if (localPart.includes('paradigm')) {
    return { role: 'Student Org', organization: 'Paradigm' };
  }

  return { role: 'Student Org', organization: 'SITES' };
}

function App() {
  const [activeView, setActiveView] = useState('auth');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    isAuthenticated: false,
    role: 'Student Org',
    organization: 'SITES',
    name: 'Guest',
  });
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [adminFilter, setAdminFilter] = useState('Pending');
  const [dashboardStatus, setDashboardStatus] = useState('all');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authErrors, setAuthErrors] = useState({});
  const [authData, setAuthData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState([
    { id: 'N-1', 
      message: 'Welcome to the NEU Hall Events Management System.', 
      type: 'info',
      exiting: false},
  ]);
  const [formData, setFormData] = useState({
    eventName: '',
    organization: '',
    hall: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [savedDraft, setSavedDraft] = useState('');

  useEffect(() => {
  // This looks for the initial 'N-1' welcome message
  const timer = setTimeout(() => {
    triggerClose('N-1');
  }, 4000);

  return () => clearTimeout(timer);
}, []);

  const currentRole = currentUser.role;
  const permittedViews = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS['Student Org'];
  const canAccess = (view) => {
    if (view === 'dashboard') {
      return true;
    }
    return currentUser.isAuthenticated && permittedViews.includes(view);
  };

  const dashboardBaseRequests = useMemo(() => {
    if (currentRole === 'Student Org' && currentUser.organization) {
      return requests.filter((request) => request.organization === currentUser.organization);
    }
    return requests;
  }, [currentRole, currentUser.organization, requests]);

  const dashboardStats = useMemo(() => {
    const total = dashboardBaseRequests.length;
    const approved = dashboardBaseRequests.filter((request) => request.status === 'Approved').length;
    const pending = dashboardBaseRequests.filter((request) => request.status === 'Pending').length;
    const rejected = dashboardBaseRequests.filter((request) => request.status === 'Rejected').length;
    const hallsInUse = new Set(
      dashboardBaseRequests
        .filter((request) => request.status === 'Approved')
        .map((request) => request.hall)
    ).size;

    const firstLabel = currentRole === 'Student Org' ? 'My Requests' : 'Total Requests';

    return [
      { label: firstLabel, value: String(total) },
      { label: 'Approved', value: String(approved) },
      { label: 'Pending Review', value: String(pending) },
      { label: 'Rejected', value: String(rejected) },
      { label: 'Halls Active', value: String(hallsInUse) },
    ];
  }, [currentRole, dashboardBaseRequests]);

  const filteredRequests = useMemo(() => {
    return dashboardBaseRequests.filter((request) => {
      const matchesStatus = dashboardStatus === 'all' || request.status === dashboardStatus;
      const query = dashboardSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        request.eventName.toLowerCase().includes(query) ||
        request.organization.toLowerCase().includes(query) ||
        request.hall.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [dashboardBaseRequests, dashboardSearch, dashboardStatus]);

  const featuredEvents = useMemo(
    () =>
      [...dashboardBaseRequests]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 6),
    [dashboardBaseRequests]
  );

  const adminQueue = useMemo(
    () => requests.filter((request) => adminFilter === 'All' || request.status === adminFilter),
    [adminFilter, requests]
  );

  const availabilityRows = useMemo(() => {
    const approved = requests.filter((request) => request.status === 'Approved');
    return HALLS.map((hall) => ({
      hall,
      usageByDay: DAY_LABELS.map((dayName, dayIndex) => {
        const dayCount = approved.filter((reservation) => {
          const dateObject = new Date(reservation.date + 'T00:00:00');
          return reservation.hall === hall && dateObject.getDay() === dayIndex;
        }).length;
        return { dayName, dayCount, statusLabel: dayCount > 0 ? 'Busy' : 'Available' };
      }),
    }));
  }, [requests]);

  function triggerClose(id) {
  // 1. Mark the specific notification as 'exiting'
  setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
  );

  // 2. Wait 400ms (matching your CSS animation time) then remove it
  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 400);
}

  function pushNotification(message, type) {
  const id = 'N-' + Date.now(); // Better unique ID
  const newNote = { id, message, type };

  setNotifications((prev) => [newNote, ...prev]);

  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 3000);
  
}

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleAuthInput(event) {
    const { name, value } = event.target;
    setAuthData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    const errors = {};
    if (!formData.eventName.trim()) {
      errors.eventName = 'Event title is required.';
    }
    if (!formData.organization.trim()) {
      errors.organization = 'Organization is required.';
    }
    if (!formData.hall.trim()) {
      errors.hall = 'Please select a hall.';
    }
    if (!formData.date) {
      errors.date = 'Please set the preferred date.';
    }
    if (!formData.startTime || !formData.endTime) {
      errors.time = 'Start and end time are required.';
    } else if (toMinutes(formData.startTime) >= toMinutes(formData.endTime)) {
      errors.time = 'End time must be after the start time.';
    }

    const attendeeValue = Number(formData.attendees);
    if (!formData.attendees || Number.isNaN(attendeeValue) || attendeeValue < 20) {
      errors.attendees = 'Attendees should be at least 20 for hall reservations.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleDraftSave(event) {
    event.preventDefault();
    if (!canAccess('request')) {
      pushNotification('You are not authorized to submit hall requests.', 'error');
      return;
    }

    if (!validateForm()) {
      setSavedDraft('');
      pushNotification('Reservation form has validation errors. Please review the highlighted fields.', 'error');
      return;
    }

    const draftRequest = {
      id: 'REQ-' + String(5000 + requests.length + 1),
      eventName: formData.eventName.trim(),
      organization: currentRole === 'Student Org' ? currentUser.organization : formData.organization.trim(),
      hall: formData.hall,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      attendees: Number(formData.attendees),
      status: 'Pending',
      priority: getPriorityFromAttendees(Number(formData.attendees)),
    };

    const conflict = requests.some((existing) => hasTimeConflict(existing, draftRequest));
    if (conflict) {
      setSavedDraft('');
      setFormErrors((previous) => ({ ...previous, time: 'Time conflict detected for this hall. Choose another slot.' }));
      pushNotification('Request blocked due to schedule conflict detection.', 'error');
      return;
    }

    setRequests((previous) => [draftRequest, ...previous]);
    setSavedDraft('Request saved as ' + draftRequest.id + ' and sent for admin review.');
    pushNotification(draftRequest.id + ' created and submitted to approval queue.', 'success');
    setFormErrors({});
    setFormData({ eventName: '', organization: '', hall: '', date: '', startTime: '', endTime: '', attendees: '' });
  }

  function validateAuth() {
    const errors = {};
    const emailValid = authData.email.includes('@') && authData.email.includes('.');

    if (authMode === 'register' && !authData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    if (!emailValid) {
      errors.email = 'Please enter a valid university email.';
    }
    if (!authData.password || authData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (authMode === 'register' && authData.password !== authData.confirmPassword) {
      errors.confirmPassword = 'Password confirmation does not match.';
    }

    setAuthErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    if (!validateAuth()) {
      setAuthMessage('');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');
    setTimeout(() => {
      setAuthLoading(false);
      const resolvedProfile = inferUserProfileFromEmail(authData.email);

      setCurrentUser({
        isAuthenticated: true,
        role: resolvedProfile.role,
        organization: resolvedProfile.organization,
        name: authData.fullName.trim() || authData.email.split('@')[0] || resolvedProfile.role,
      });

      if (resolvedProfile.role === 'Student Org') {
        setFormData((previous) => ({ ...previous, organization: resolvedProfile.organization }));
      }

      if (authMode === 'login') {
        setAuthMessage(`Welcome back. Signed in as ${resolvedProfile.role}.`);
      } else {
        setAuthMessage(`Registration submitted. Signed in as ${resolvedProfile.role}.`);
        pushNotification('Registration UX validated with inline feedback.', 'success');
      }
      setActiveView('dashboard');
      pushNotification(`Welcome, ${resolvedProfile.role}!`, 'success');
    }, 700);
  }

  function handleDecision(requestId, nextStatus) {
    if (!canAccess('admin')) {
      pushNotification('You are not authorized to manage approval decisions.', 'error');
      return;
    }
    setRequests((previous) => previous.map((request) => (request.id === requestId ? { ...request, status: nextStatus } : request)));
    pushNotification(requestId + ' marked as ' + nextStatus + '.', nextStatus === 'Approved' ? 'success' : 'info');
  }

  function switchView(view) {
    if (!currentUser.isAuthenticated && view !== 'auth') {
    pushNotification('Please login to access this feature.', 'error');
    
    setActiveView('auth');
    return;
  }

  // --- Existing logic for authenticated users ---
  if (view !== 'auth' && !canAccess(view)) {
    pushNotification(`Access denied: ${currentRole} cannot open ${view}.`, 'error');
    return;
  }

  setIsSubmitting(true);
  setMobileNavOpen(false);
  setTimeout(() => {
    setActiveView(view);
    setIsSubmitting(false);
  }, 220);
  }

  return (
    <div className="app-shell">
      <div className="ambient-glow" aria-hidden="true" />

      <header className="top-nav">
        <div>
          <p className="nav-label">NEU Hall Events Management System</p>
          <h1>Campus Events Operations Center</h1>
          {currentUser.isAuthenticated ? (
            <p className="active-role">Signed in as {currentUser.role}{currentUser.organization ? ` - ${currentUser.organization}` : ''}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileNavOpen((previous) => !previous)}
          aria-label="Toggle quick actions"
          aria-expanded={mobileNavOpen}
        >
          Menu
        </button>
        <nav className={mobileNavOpen ? 'nav-actions open' : 'nav-actions'} aria-label="quick actions">
          {!currentUser.isAuthenticated ? (
            <button className="ghost-btn" type="button" onClick={() => switchView('auth')}>Login</button>
          ) : (
            <button
              className="ghost-btn-danger"
              type="button"
              onClick={() => {
                setCurrentUser({ isAuthenticated: false, 
                                 role: 'Student Org', 
                                 organization: 'SITES', 
                                 name: 'Guest' });

                setAuthMessage(''); 
                setAuthData({ fullName: '', email: '', password: '', confirmPassword: '' });                
                setActiveView('auth');
                pushNotification('You have been logged out.', 'info');
              }}
            >
              Logout
            </button>
          )}
          {canAccess('request') ? (
            <button className="solid-btn" type="button" onClick={() => switchView('request')}>Create Request</button>
          ) : null}
        </nav>
      </header>

      <main className="content-wrap">
        {!currentUser.isAuthenticated && (
        <section className="hero-card rise-in">
          <p className="eyebrow">Live Event Management</p>
          <h2>Plan, request, approve, and monitor hall events from one unified workflow.</h2>
          <p className="hero-copy">
            Built for student organizations to keep requests moving with clear status, quick decisions,
            and reliable hall availability visibility.
          </p>
          <div className="hero-chips">
            <span>Fast request drafting</span>
            <span>Real-time approval queue</span>
            <span>Availability-first scheduling</span>
          </div>
        </section>
        )}

        {currentUser.isAuthenticated && (
          <section className="stats-grid">
            {dashboardStats.map((stat, index) => (
              <article 
                className="stat-card rise-in" 
                style={{ animationDelay: index * 90 + 'ms' }} 
                key={stat.label}
              >
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
              </article>
            ))}
          </section>
        )}

        <section className="view-switcher rise-in" style={{ animationDelay: '250ms' }}>
          {canAccess('dashboard') ? (
            <button type="button" className={activeView === 'dashboard' ? 'switch-pill active' : 'switch-pill'} onClick={() => switchView('dashboard')}>Dashboard</button>
          ) : null}
          {canAccess('admin') ? (
            <button type="button" className={activeView === 'admin' ? 'switch-pill active' : 'switch-pill'} onClick={() => switchView('admin')}>Admin Queue</button>
          ) : null}
          {canAccess('calendar') ? (
            <button type="button" className={activeView === 'calendar' ? 'switch-pill active' : 'switch-pill'} onClick={() => switchView('calendar')}>Calendar</button>
          ) : null}
        </section>

        {isSubmitting ? (
          <section className="loading-panel rise-in" style={{ animationDelay: '320ms' }}>
            <p>Loading workspace module...</p>
            <div className="skeleton-grid" aria-hidden="true">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          </section>
        ) : null}

        {activeView === 'dashboard' && !isSubmitting ? (
          <>
            <section className="panel-grid">
              <article className="panel rise-in" style={{ animationDelay: '320ms' }}>
                <div className="panel-head">
                  <h3>Upcoming Events</h3>
                  <span>{featuredEvents.length} scheduled</span>
                </div>
                <ul className="task-list">
                  {featuredEvents.length === 0 ? (
                    <li className="empty-state">
                      <p>No upcoming events yet. Create the first reservation request to populate this list.</p>
                    </li>
                  ) : featuredEvents.map((event) => (
                    <li key={event.id} className="task-row compact">
                      <div className="task-main">
                        <p className="task-id">{event.id}</p>
                        <h4>{event.eventName}</h4>
                        <p>{event.organization}</p>
                      </div>
                      <div className="task-meta">
                        <span>{event.hall}</span>
                        <span>{formatDisplayDate(event.date)}</span>
                        <span>{event.startTime} - {event.endTime}</span>
                        <strong className={'status-pill ' + buildStatusClass(event.status)}>{event.status}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="workspace-grid">
              <article className="panel task-panel rise-in" style={{ animationDelay: '500ms' }}>
                <div className="panel-head">
                  <h3>Request Tracker</h3>
                  <span>{filteredRequests.length} visible</span>
                </div>
                <div className="task-controls">
                  <input
                    type="search"
                    value={dashboardSearch}
                    onChange={(event) => setDashboardSearch(event.target.value)}
                    placeholder="Search by event, org, hall, or request ID"
                    aria-label="Search requests"
                  />
                  <select
                    value={dashboardStatus}
                    onChange={(event) => setDashboardStatus(event.target.value)}
                    aria-label="Filter by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <ul className="task-list">
                  {filteredRequests.length === 0 ? (
                    <li className="empty-state">
                      <p>No requests match your current filters. Try a different status or search term.</p>
                    </li>
                  ) : filteredRequests.map((request) => (
                    <li key={request.id} className="task-row">
                      <div className="task-main">
                        <p className="task-id">{request.id}</p>
                        <h4>{request.eventName}</h4>
                        <p>{request.organization}</p>
                      </div>
                      <div className="task-meta">
                        <span>{request.hall}</span>
                        <span>{formatDisplayDate(request.date)}</span>
                        <span>{request.attendees} attendees</span>
                        <strong className={'status-pill ' + buildStatusClass(request.status)}>{request.status}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              {currentUser.role !== 'Admin' && (
              <article className="panel notice-panel rise-in" style={{ animationDelay: '580ms' }}>
                <div className="panel-head">
                  <h3>Service Tips</h3>
                  <span>Better booking success</span>
                </div>
                <ul className="notice-list">
                  <li className="notice info"><p>Submit requests at least 7 days before event date.</p></li>
                  <li className="notice info"><p>Set attendee count accurately for hall matching.</p></li>
                  <li className="notice info"><p>Use calendar view before choosing your preferred slot.</p></li>
                </ul>
              </article>)}
            </section>
          </>
        ) : null}

        {activeView === 'request' && !isSubmitting && canAccess('request') ? (
          <section className="workspace-grid">
            <article className="panel form-panel rise-in" style={{ animationDelay: '500ms' }}>
              <div className="panel-head">
                <h3>Event Request and Hall Reservation</h3>
                <span>Validated request flow</span>
              </div>

              <form onSubmit={handleDraftSave} noValidate>
                <label htmlFor="eventName">Event Name</label>
                <input id="eventName" name="eventName" value={formData.eventName} onChange={handleInputChange} placeholder="Example: Student Leadership Congress" />
                {formErrors.eventName ? <p className="field-error">{formErrors.eventName}</p> : null}

                <label htmlFor="organization">Organization</label>
                <select
                  id="organization"
                  name="organization"
                  value={currentRole === 'Student Org' ? currentUser.organization : formData.organization}
                  onChange={handleInputChange}
                  disabled={currentRole === 'Student Org' && currentUser.isAuthenticated}
                >
                  <option value="">Select organization</option>
                  {ORGANIZATIONS.map((organization) => (
                    <option key={organization} value={organization}>{organization}</option>
                  ))}
                </select>
                {formErrors.organization ? <p className="field-error">{formErrors.organization}</p> : null}

                <label htmlFor="hall">Preferred Hall</label>
                <select id="hall" name="hall" value={formData.hall} onChange={handleInputChange}>
                  <option value="">Select hall</option>
                  {HALLS.map((hallOption) => (
                    <option key={hallOption} value={hallOption}>{hallOption}</option>
                  ))}
                </select>
                {formErrors.hall ? <p className="field-error">{formErrors.hall}</p> : null}

                <div className="inline-grid">
                  <div>
                    <label htmlFor="date">Preferred Date</label>
                    <input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                    {formErrors.date ? <p className="field-error">{formErrors.date}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="attendees">Estimated Attendees</label>
                    <input id="attendees" name="attendees" type="number" min="20" value={formData.attendees} onChange={handleInputChange} placeholder="Minimum 20" />
                    {formErrors.attendees ? <p className="field-error">{formErrors.attendees}</p> : null}
                  </div>
                </div>

                <div className="inline-grid">
                  <div>
                    <label htmlFor="startTime">Start Time</label>
                    <input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label htmlFor="endTime">End Time</label>
                    <input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleInputChange} />
                  </div>
                </div>
                {formErrors.time ? <p className="field-error">{formErrors.time}</p> : null}

                <button type="submit" className="solid-btn form-submit">Submit for Approval</button>
                <p className="draft-message" aria-live="polite">{savedDraft}</p>
              </form>
            </article>

            <article className="panel notice-panel rise-in" style={{ animationDelay: '560ms' }}>
              <div className="panel-head">
                <h3>Queue Preview</h3>
                <span>{requests.length} total requests</span>
              </div>
              <ul className="task-list">
                {requests.length === 0 ? (
                  <li className="empty-state">
                    <p>No requests in queue yet. Submitted requests will appear here immediately.</p>
                  </li>
                ) : requests.slice(0, 6).map((request) => (
                  <li key={request.id} className="task-row compact">
                    <div className="task-main">
                      <p className="task-id">{request.id}</p>
                      <h4>{request.eventName}</h4>
                      <p>{request.hall} - {formatDisplayDate(request.date)}</p>
                    </div>
                    <div className="task-meta">
                      <span>{request.startTime} - {request.endTime}</span>
                      <strong className={'status-pill ' + buildStatusClass(request.status)}>{request.status}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeView === 'admin' && !isSubmitting && canAccess('admin') ? (
          <section className="workspace-grid single-focus">
            <article className="panel task-panel rise-in" style={{ animationDelay: '500ms' }}>
              <div className="panel-head">
                <h3>Admin Approval Desk</h3>
                <span>Fast decision workflow</span>
              </div>

              <div className="task-controls">
                <select value={adminFilter} onChange={(event) => setAdminFilter(event.target.value)}>
                  <option value="Pending">Pending only</option>
                  <option value="Approved">Approved only</option>
                  <option value="Rejected">Rejected only</option>
                  <option value="All">All statuses</option>
                </select>
              </div>

              <ul className="task-list">
                {adminQueue.length === 0 ? (
                  <li className="empty-state">
                    <p>No requests in this admin view. Switch the status filter to see other requests.</p>
                  </li>
                ) : adminQueue.map((request) => (
                  <li key={request.id} className="task-row admin">
                    <div className="task-main">
                      <p className="task-id">{request.id}</p>
                      <h4>{request.eventName}</h4>
                      <p>{request.organization}</p>
                      <p>{request.hall} - {formatDisplayDate(request.date)} ({request.startTime} to {request.endTime})</p>
                    </div>
                    <div className="task-meta">
                      <span>{request.attendees} attendees</span>
                      <span>Priority: {request.priority}</span>
                      <strong className={'status-pill ' + buildStatusClass(request.status)}>{request.status}</strong>
                      {request.status === 'Pending' ? (
                        <div className="admin-actions">
                          <button type="button" className="solid-btn" onClick={() => handleDecision(request.id, 'Approved')}>Approve</button>
                          <button type="button" className="ghost-btn alt" onClick={() => handleDecision(request.id, 'Rejected')}>Reject</button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {activeView === 'calendar' && !isSubmitting && canAccess('calendar') ? (
          <section className="workspace-grid single-focus">
            <article className="panel calendar-panel rise-in" style={{ animationDelay: '500ms' }}>
              <div className="panel-head">
                <h3>Hall Availability Calendar</h3>
                <span>Weekly occupancy map</span>
              </div>
              <div className="calendar-grid">
                <div className="calendar-head" />
                {DAY_LABELS.map((dayLabel) => (
                  <div key={dayLabel} className="calendar-head">{dayLabel}</div>
                ))}

                {availabilityRows.map((row) => (
                  <div key={row.hall} className="calendar-row">
                    <div className="hall-label">{row.hall}</div>
                    {row.usageByDay.map((slot) => (
                      <div key={row.hall + '-' + slot.dayName} className={slot.dayCount > 0 ? 'slot busy' : 'slot available'}>
                        <p>{slot.statusLabel}</p>
                        <span>{slot.dayCount > 0 ? slot.dayCount + ' event(s)' : 'Open'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {activeView === 'auth' && !isSubmitting ? (
          <section className="workspace-grid single-focus">
            <article className="panel auth-panel rise-in" style={{ animationDelay: '500ms' }}>
              <div className="panel-head">
                <h3>Authentication</h3>
                <span>Secure user access</span>
              </div>

              <div className="view-switcher auth-tabs">
                <button type="button" className={authMode === 'login' ? 'switch-pill active' : 'switch-pill'} onClick={() => setAuthMode('login')}>Login</button>
                <button type="button" className={authMode === 'register' ? 'switch-pill active' : 'switch-pill'} onClick={() => setAuthMode('register')}>Register</button>
              </div>

              <form onSubmit={handleAuthSubmit} noValidate>
                {authMode === 'register' ? (
                  <>
                    <label htmlFor="fullName">Full Name</label>
                    <input id="fullName" name="fullName" value={authData.fullName} onChange={handleAuthInput} placeholder="Example: Juan Dela Cruz" />
                    {authErrors.fullName ? <p className="field-error">{authErrors.fullName}</p> : null}
                  </>
                ) : null}

                <label htmlFor="email">University Email</label>
                <input id="email" name="email" type="email" value={authData.email} onChange={handleAuthInput} placeholder="name@neu.edu.ph" />
                {authErrors.email ? <p className="field-error">{authErrors.email}</p> : null}

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={authData.password} onChange={handleAuthInput} placeholder="Minimum 8 characters" />
                {authErrors.password ? <p className="field-error">{authErrors.password}</p> : null}

                {authMode === 'register' ? (
                  <>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" value={authData.confirmPassword} onChange={handleAuthInput} placeholder="Re-enter password" />
                    {authErrors.confirmPassword ? <p className="field-error">{authErrors.confirmPassword}</p> : null}
                  </>
                ) : null}

                <button type="submit" className="solid-btn form-submit" disabled={authLoading}>
                  {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <p className="draft-message" aria-live="polite">{authMessage}</p>
              </form>
            </article>
          </section>
        ) : null}

        {!isSubmitting && activeView !== 'auth' && !canAccess(activeView) ? (
          <section className="workspace-grid single-focus">
            <article className="panel unauthorized-panel rise-in">
              <h3>Access Restricted</h3>
              <p>
                Your current role does not have permission to open this module. Switch role in Login to continue.
              </p>
              <button type="button" className="solid-btn" onClick={() => switchView('auth')}>Go to Login</button>
            </article>
          </section>
        ) : null}
      </main>
      <div className="toast-container">
  {notifications.map((entry) => (
    <div 
      key={entry.id} 
      /* This dynamically adds the 'exiting' class for the smooth slide-out */
      className={`toast-banner ${entry.type} ${entry.exiting ? 'exiting' : ''}`}
    >
      <div className="toast-content">
        <span className="toast-icon">
          {entry.type === 'success' ? '✓' : entry.type === 'error' ? '✕' : 'ℹ'}
        </span>
        <p>{entry.message}</p>
      </div>
      
      {/* Manually clicking the 'X' now also triggers the smooth exit */}
      <button 
        type="button"
        className="toast-close" 
        onClick={() => triggerClose(entry.id)}
      >
        ×
      </button>
    </div>
  ))}
</div>
    </div>
    
  );
}

export default App;
