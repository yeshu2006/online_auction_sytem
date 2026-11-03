import { useState } from 'react';
import { ArrowLeft, Gavel } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const AuthPage = ({ isRegister = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const path = isRegister ? 'register' : 'login';
      const payload = isRegister ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password };
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/${path}`, payload);
      login(data, data.token);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not complete your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-art" aria-label="About BidAura">
        <Link className="brand" to="/" aria-label="Back to BidAura home">
          <span className="brand-mark"><Gavel size={19} strokeWidth={1.5} /></span>
          <span className="brand-copy">
            <span className="brand-name">bid<span>aura</span></span>
            <span className="brand-subtitle">THE ART OF THE FIND</span>
          </span>
        </Link>
        <div className="auth-art-quote">
          <div className="eyebrow">Objects with a past. Collectors with a point of view.</div>
          <h1>A good piece<br />finds its <em style={{ color: 'var(--gold)' }}>person.</em></h1>
          <p>Step into a considered auction room for fine watches and objects worth keeping close.</p>
        </div>
        <div className="auth-art-foot">EST. FOR THE CURIOUS &nbsp;·&nbsp; SEASON 01</div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form">
          <Link className="arrow-link" to="/" style={{ marginBottom: 26 }}><ArrowLeft size={15} /> Back to BidAura</Link>
          <div className="eyebrow">{isRegister ? 'Your next great find awaits' : 'Welcome back'}</div>
          <h2>{isRegister ? 'Join the community.' : 'Good to see you.'}</h2>
          <p>{isRegister
            ? 'Create your account to follow the room, bid on exceptional lots, and present pieces of your own.'
            : 'Sign in to follow your lots, manage your collection, and take your place in the room.'}</p>

          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="form-stack" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="form-label">
                Your name
                <input className="clean-input" type="text" autoComplete="name" value={name}
                  onChange={event => setName(event.target.value)} placeholder="e.g. Alex Morgan" required />
              </label>
            )}
            <label className="form-label">
              Email address
              <input className="clean-input" type="email" autoComplete="email" value={email}
                onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
            <label className="form-label">
              Password
              <input className="clean-input" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password} onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password" required />
            </label>
            <button className="btn-primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 4 }}>
              {submitting ? 'One moment…' : isRegister ? 'Create your account' : 'Sign in to your account'}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? 'Already collecting with us?' : 'New to BidAura?'}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Login = () => <AuthPage />;
export const Register = () => <AuthPage isRegister />;
