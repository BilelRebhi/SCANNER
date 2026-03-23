import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { startScan } from '../api';
import { motion } from 'framer-motion';
import { Search, Globe, Shield, ArrowLeft } from 'lucide-react';

const NewScanPage = () => {
    const [url, setUrl] = useState('');
    const [scanType, setScanType] = useState('BOTH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            setError('Please enter a valid URL (e.g., http://example.com)');
            return;
        }

        setLoading(true);
        try {
            await startScan(url, scanType);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to start scan. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>

            <motion.div
                className="glass-panel"
                style={{ padding: '3rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Configure New Scan</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Set up the target and parameters for the AI security analysis.</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', borderLeft: '4px solid var(--accent)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', color: '#f8fafc' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" htmlFor="url" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                            Target Application URL
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Globe size={20} />
                            </div>
                            <input
                                type="url"
                                id="url"
                                className="form-control"
                                placeholder="http://testphp.vulnweb.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                style={{ paddingLeft: '3rem', paddingTop: '1rem', paddingBottom: '1rem', fontSize: '1.1rem' }}
                            />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Requires HTTP or HTTPS protocol. Please ensure you have permission to scan this target.
                        </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '3rem' }}>
                        <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                            Vulnerability Scan Type
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                            <label style={{ cursor: 'pointer' }}>
                                <input type="radio" name="scanType" value="XSS" checked={scanType === 'XSS'} onChange={() => setScanType('XSS')} style={{ display: 'none' }} />
                                <div className="glass-panel" style={{ padding: '1.5rem', border: scanType === 'XSS' ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: scanType === 'XSS' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-surface)' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Cross-Site Scripting (XSS)</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Detects malicious script injection points.</p>
                                </div>
                            </label>

                            <label style={{ cursor: 'pointer' }}>
                                <input type="radio" name="scanType" value="SQLi" checked={scanType === 'SQLi'} onChange={() => setScanType('SQLi')} style={{ display: 'none' }} />
                                <div className="glass-panel" style={{ padding: '1.5rem', border: scanType === 'SQLi' ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: scanType === 'SQLi' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-surface)' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>SQL Injection (SQLi)</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Detects database manipulation vulnerabilities.</p>
                                </div>
                            </label>

                            <label style={{ cursor: 'pointer' }}>
                                <input type="radio" name="scanType" value="BOTH" checked={scanType === 'BOTH'} onChange={() => setScanType('BOTH')} style={{ display: 'none' }} />
                                <div className="glass-panel" style={{ padding: '1.5rem', border: scanType === 'BOTH' ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: scanType === 'BOTH' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-surface)' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Comprehensive (Both)</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Runs all available vulnerability checks.</p>
                                </div>
                            </label>

                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
                        {loading ? 'Initializing Scan Engine...' : <><Search size={20} /> Launch AI Analyzer</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default NewScanPage;
