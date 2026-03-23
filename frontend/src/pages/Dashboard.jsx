import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getScans, deleteScan } from '../api';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronRight, Activity, Clock, ShieldAlert } from 'lucide-react';

const Dashboard = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        try {
            const data = await getScans();
            setScans(data);
        } catch (error) {
            console.error('Failed to fetch scans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this scan report?')) {
            try {
                await deleteScan(id);
                setScans(scans.filter(scan => scan.id !== id));
            } catch (error) {
                console.error('Failed to delete scan', error);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'var(--success)';
            case 'IN_PROGRESS': return 'var(--warning)';
            case 'FAILED': return 'var(--accent)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your web application security scans</p>
                </div>
                <Link to="/new-scan" className="btn btn-primary">
                    <Plus size={18} /> New Scan
                </Link>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                    <Activity className="animate-fade-in" size={40} color="var(--primary)" style={{ animationDuration: '1s', animationIterationCount: 'infinite' }} />
                </div>
            ) : scans.length === 0 ? (
                <motion.div
                    className="glass-panel"
                    style={{ padding: '4rem 2rem', textAlign: 'center' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                        <ShieldAlert size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No scans yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                        You haven't run any security scans on your applications. Start your first scan to discover potential vulnerabilities.
                    </p>
                    <Link to="/new-scan" className="btn btn-primary">
                        Start First Scan
                    </Link>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {scans.map((scan, index) => (
                        <motion.div
                            key={scan.id}
                            className="glass-panel"
                            style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px' }}>
                                    <Activity size={24} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{scan.url}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={14} /> {new Date(scan.date).toLocaleDateString()}
                                        </span>
                                        <span style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                                            {scan.scan_type}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(scan.status) }}></span>
                                            {scan.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => handleDelete(scan.id)}
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem', border: 'none', color: 'var(--text-muted)' }}
                                    title="Delete Scan"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <Link to={`/scan/${scan.id}`} className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
                                    View Report <ChevronRight size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
