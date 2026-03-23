import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, User, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <nav className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', marginBottom: '2rem', position: 'sticky', top: 0, zIndex: 1000 }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                        <Shield color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                        SCANNER<span style={{ color: 'var(--primary)' }}>.AI</span>
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user ? (
                        <>
                            <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none' }}>
                                <Activity size={18} /> Dashboard
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)' }}>
                                <User size={18} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.95rem', fontWeight: '500', marginRight: '1rem' }}>{user.fullname}</span>
                                <button onClick={handleLogout} className="btn btn-outline" title="Logout" style={{ padding: '0.5rem' }}>
                                    <LogOut size={18} color="var(--accent)" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {!isAuthPage && (
                                <>
                                    <Link to="/login" className="btn btn-outline">Log in</Link>
                                    <Link to="/register" className="btn btn-primary">Sign up</Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
