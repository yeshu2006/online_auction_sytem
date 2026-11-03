import { useState } from 'react';
import { ArrowUpRight, Gavel, Heart, Menu, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };
  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="BidAura home">
          <span className="brand-mark"><Gavel size={19} strokeWidth={1.7} /></span>
          <span className="brand-copy">
            <span className="brand-name">bid<span>aura</span></span>
            <span className="brand-subtitle">THE ART OF THE FIND</span>
          </span>
        </Link>

        <div className={`nav-links${menuOpen ? ' is-open' : ''}`}>
          <NavLink className={navClass} to="/" end onClick={closeMenu}>Discover</NavLink>
          <Link className="nav-link" to="/#explore" onClick={closeMenu}>Auctions <span className="nav-live-indicator" /></Link>
          <Link className="nav-link" to="/#categories" onClick={closeMenu}>Categories</Link>
          <Link className="nav-link" to={user ? '/dashboard' : '/register'} onClick={closeMenu}>Sell an item</Link>
          {user && <NavLink className={navClass} to="/dashboard" onClick={closeMenu}>My collection</NavLink>}
          {user?.role === 'admin' && <NavLink className={navClass} to="/admin" onClick={closeMenu}>Admin</NavLink>}
          {!user && <NavLink className={navClass} to="/login" onClick={closeMenu}>Sign in</NavLink>}
        </div>

        <div className="nav-actions">
          <Link className="nav-watchlist" to={user ? '/dashboard' : '/login'} aria-label="Your watchlist" onClick={closeMenu}><Heart size={17} /></Link>
          {user ? (
            <>
              <Link className="nav-user" to="/profile" onClick={closeMenu} aria-label={`View profile for ${user.name}`}>
                <span className="avatar-small">{user.avatar
                  ? <img src={user.avatar} alt="" />
                  : (user.name?.trim()?.[0] || 'M').toUpperCase()}
                </span>
                <span>{user.name?.split(' ')[0]}</span>
              </Link>
              <button className="nav-logout" type="button" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <Link className="nav-join" to="/register">
              <span className="nav-join-full">Start collecting</span>
              <span className="nav-join-short">Join</span>
              <ArrowUpRight size={14} />
            </Link>
          )}
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
