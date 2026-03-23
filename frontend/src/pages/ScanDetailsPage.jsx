import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScanDetails } from '../api';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Activity, Server, Clock } from 'lucide-react';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const ScanDetailsPage = () => {
    const { id } = useParams();
    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const data = await getScanDetails(id);
            setScan(data);
        } catch (err) {
            setError('Failed to load scan details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <Activity className="animate-fade-in" size={40} color="var(--primary)" style={{ animationDuration: '1s', animationIterationCount: 'infinite' }} />
            </div>
        );
    }

    if (error || !scan) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '1rem' }}>{error || 'Scan not found'}</div>
                <Link to="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
            </div>
        );
    }

    const vulnerabilities = scan.vulnerabilities || [];
    const xssCount = vulnerabilities.filter(v => v.type === 'XSS').length;
    const sqliCount = vulnerabilities.filter(v => v.type === 'SQLi').length;
    const totalVulns = vulnerabilities.length;

    // Chart Data
    const doughnutData = {
        labels: ['XSS', 'SQL Injection'],
        datasets: [
            {
                data: [xssCount, sqliCount],
                backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(244, 63, 94, 0.8)'],
                borderColor: ['var(--primary)', 'var(--accent)'],
                borderWidth: 1,
            },
        ],
    };

    // Extract average AI scores from vulnerabilities if any
    let avgProbability = 0;
    if (vulnerabilities.length > 0) {
        avgProbability = vulnerabilities.reduce((acc, v) => acc + (v.result?.ai_score || 0), 0) / vulnerabilities.length;
    }

    return (
        <div className="container">
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', transition: 'color 0.2s' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', wordBreak: 'break-all' }}>{scan.scan.url}</h1>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} /> Scanned on {new Date(scan.scan.date).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} /> Strategy: {scan.scan.scan_type}
                        </span>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: scan.scan.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)' }}>
                        {scan.scan.status.replace('_', ' ')}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Summary Card */}
                <motion.div className="glass-panel" style={{ padding: '2rem' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary)" /> Executed AI Analysis
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Vulnerabilities Found</span>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: totalVulns > 0 ? 'var(--accent)' : 'var(--success)' }}>{totalVulns}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Avg AI Confidence Score</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>{avgProbability.toFixed(1)}%</span>
                    </div>

                    {totalVulns === 0 && scan.scan.status === 'COMPLETED' && (
                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={20} />
                            <span>No major vulnerabilities detected by the engine.</span>
                        </div>
                    )}
                </motion.div>

                {/* Visualizer Card */}
                {totalVulns > 0 && (
                    <motion.div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                        <h3 style={{ marginBottom: '1rem', width: '100%' }}>Distribution</h3>
                        <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } } } }} />
                        </div>
                    </motion.div>
                )}
            </div>

            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle color="var(--warning)" /> Detailed Findings
            </h2>

            {vulnerabilities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vulnerabilities.map((vuln, index) => (
                        <motion.div
                            key={vuln.id || index}
                            className="glass-panel"
                            style={{ padding: '1.5rem', borderLeft: `4px solid ${vuln.type === 'SQLi' ? 'var(--accent)' : 'var(--primary)'}` }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (index * 0.05) }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        {vuln.type}
                                    </span>
                                    <p style={{ margin: 0, fontSize: '1.1rem', wordBreak: 'break-all' }}><strong>URL:</strong> {scan.scan.url}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: (vuln.result?.ai_score || 0) > 80 ? 'var(--accent)' : 'var(--warning)' }}>
                                        {(vuln.result?.ai_score || 0).toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            {vuln.parameter && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vulnerable Parameter:</span> <code style={{ background: 'var(--bg-base)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{vuln.parameter}</code>
                                </div>
                            )}

                            <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', overflowX: 'auto' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Injected Payload:</div>
                                <pre style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>{vuln.payload_used}</pre>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {scan.scan.status === 'COMPLETED' ? 'No vulnerabilities found. The application appears secure against the tested payloads.' : 'Scan is still running or no results available yet.'}
                </div>
            )}

        </div>
    );
};

export default ScanDetailsPage;
