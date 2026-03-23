import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Search, Activity, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div
        className="glass-panel"
        style={{ padding: '2rem', flex: 1, minWidth: '250px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>{description}</p>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4rem 0 6rem' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <Zap size={14} fill="currentColor" /> AI-Powered Vulnerability Scanner v1.0
                    </div>

                    <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
                        Secure Your Web Apps With <span className="text-gradient">Intelligent</span> Scanning
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                        Leverage Machine Learning to actively detect XSS, SQL Injection and other vulnerabilities with drastically reduced false positives.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Start Scanning Free <ChevronRight size={20} />
                        </Link>
                        <Link to="/login" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'var(--bg-surface)' }}>
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                <FeatureCard
                    icon={<Search size={24} />}
                    title="Active Target Crawling"
                    description="Automatically navigates your web application, discovering hidden endpoints and input vectors for comprehensive coverage."
                    delay={0.2}
                />
                <FeatureCard
                    icon={<Shield size={24} />}
                    title="Machine Learning Engine"
                    description="Scikit-Learn Random Forest models accurately classify server responses, eliminating the noise of traditional scanners."
                    delay={0.4}
                />
                <FeatureCard
                    icon={<Activity size={24} />}
                    title="Detailed Actionable Reports"
                    description="Get clear visualizations of security scores, vulnerability counts, and exact mitigation steps for your development team."
                    delay={0.6}
                />
            </div>
        </div>
    );
};

export default LandingPage;
