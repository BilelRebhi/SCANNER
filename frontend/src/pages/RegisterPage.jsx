import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register(fullname, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)' }}>
            <motion.div
                className="glass-panel"
                style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Start scanning your applications today</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', borderLeft: '4px solid var(--accent)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#f8fafc' }}>
                        <AlertCircle color="var(--accent)" size={20} />
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="fullname">Full Name</label>
                        <input
                            type="text"
                            id="fullname"
                            className="form-control"
                            placeholder="John Doe"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : <><UserPlus size={18} /> Sign Up</>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Log in here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
