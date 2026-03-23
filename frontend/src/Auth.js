import React from 'react';
import './App.css';

function AuthPage({ 
  authMode, 
  setAuthMode, 
  handleAuthSubmit, 
  authData, 
  handleAuthInput, 
  authErrors, 
  authLoading, 
  authMessage 
}) {
  return (
    <section className="workspace-grid single-focus auth-container">
      <article className="panel form-panel auth-panel rise-in" style={{ animationDelay: '300ms', maxWidth: '450px', margin: '0 auto' }}>
        <div className="panel-head">
          <h3>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h3>
          <span>{authMode === 'login' ? 'Access your organization dashboard' : 'Register for hall management'}</span>
        </div>

        <form onSubmit={handleAuthSubmit} noValidate>
          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input 
                id="fullName" 
                name="fullName" 
                type="text" 
                value={authData.fullName} 
                onChange={handleAuthInput} 
                placeholder="Juan Dela Cruz" 
              />
              {authErrors.fullName && <p className="field-error">{authErrors.fullName}</p>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">University Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              value={authData.email} 
              onChange={handleAuthInput} 
              placeholder="name@university.edu" 
            />
            {authErrors.email && <p className="field-error">{authErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              value={authData.password} 
              onChange={handleAuthInput} 
              placeholder="••••••••" 
            />
            {authErrors.password && <p className="field-error">{authErrors.password}</p>}
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                value={authData.confirmPassword} 
                onChange={handleAuthInput} 
                placeholder="••••••••" 
              />
              {authErrors.confirmPassword && <p className="field-error">{authErrors.confirmPassword}</p>}
            </div>
          )}

          <button 
            type="submit" 
            className={`solid-btn form-submit ${authLoading ? 'loading' : ''}`}
            disabled={authLoading}
          >
            {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Login' : 'Register'}
          </button>

          {authMessage && <p className="auth-status-message success-text">{authMessage}</p>}

          <div className="auth-toggle-footer">
            <p>
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                className="ghost-btn-link" 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? ' Register here' : ' Login here'}
              </button>
            </p>
          </div>
        </form>
      </article>
    </section>
  );
}

export default AuthPage;