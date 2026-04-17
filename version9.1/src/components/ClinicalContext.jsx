import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
const { ArrowRight, Database, Target, Stethoscope, AlertTriangle, BookOpen, Microscope } = LucideIcons;

const card = (delay) => ({
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
});

const ClinicalContext = ({ domain, isDarkMode, onNext }) => {
    if (!domain) return null;
    const DomainIcon = LucideIcons[domain.icon || 'Activity'] || LucideIcons.Activity;

    const primary = domain.theme?.primary || 'var(--ios-blue)';
    const secondary = domain.theme?.secondary || '#005fe6';

    return (
        <div style={{ paddingTop: 4, paddingBottom: 20 }}>

            {/* ── Hero Banner ── */}
            <motion.div
                {...card(0.05)}
                style={{
                    background: `linear-gradient(135deg, ${primary}12, ${secondary}08)`,
                    border: `1px solid ${primary}20`,
                    borderRadius: 28,
                    padding: '28px 36px',
                    marginBottom: 12,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute', top: -40, right: -40,
                    width: 200, height: 200, borderRadius: '50%',
                    background: `${primary}08`,
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                    >
                        <div style={{
                            width: 80, height: 80, borderRadius: 22,
                            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 12px 32px ${primary}35`,
                            position: 'relative',
                        }}>
                            <DomainIcon size={38} color="white" strokeWidth={1.5} />
                            <motion.div
                                animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -5,
                                    borderRadius: 27,
                                    border: `2px solid ${primary}`,
                                }}
                            />
                        </div>
                    </motion.div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: '1.6rem' }}>{domain.emoji}</span>
                            <h1 style={{
                                margin: 0, fontSize: '1.8rem', fontWeight: 800,
                                letterSpacing: '-0.03em',
                                background: `linear-gradient(135deg, var(--text-main) 40%, ${primary})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                {domain.name}
                            </h1>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-sec)', lineHeight: 1.5, maxWidth: 540 }}>
                            {domain.description}
                        </p>
                    </div>
                </div>
            </motion.div>



            {/* ── Two-Column: Why it Matters + Clinical Boundary ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <motion.div className="ios-card" {...card(0.3)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: `${primary}12`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <BookOpen size={16} style={{ color: primary }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Why it Matters</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text-sec)', margin: 0 }}>
                        {domain.whyMatters}
                    </p>
                </motion.div>

                <motion.div
                    className="ios-card"
                    {...card(0.35)}
                    style={{ borderLeft: '3px solid var(--ios-orange)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'rgba(255,149,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <AlertTriangle size={16} style={{ color: 'var(--ios-orange)' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ios-orange)' }}>Clinical Boundary</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text-sec)', margin: 0 }}>
                        This tool cannot replace clinical judgment. It acts as a supportive warning system for high-risk patterns. You make the final decision.
                    </p>
                </motion.div>
            </div>

            {/* ── Top Clinical Features ── */}
            {domain.topFeaturesClinical && domain.topFeaturesClinical.length > 0 && (
                <motion.div className="ios-card" {...card(0.4)} style={{ marginBottom: 20, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: `${primary}12`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Microscope size={16} style={{ color: primary }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Key Clinical Features</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {domain.topFeaturesClinical.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.45 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    display: 'flex', gap: 14, alignItems: 'flex-start',
                                    padding: '14px 16px',
                                    background: 'var(--bg-card-secondary)',
                                    borderRadius: 14,
                                }}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                    background: `${primary}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 800, color: primary,
                                }}>
                                    {i + 1}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{f.feature}</span>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-sec)' }}>
                                        {f.justification}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ── CTA — Inline, no floating feel ── */}
            <motion.div {...card(0.55)} style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '14px 36px',
                        fontSize: '0.9rem', fontWeight: 600,
                        borderRadius: 999,
                        border: 'none', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                        color: '#fff',
                        boxShadow: `0 6px 24px ${primary}30`,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Begin Exploration
                    <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ClinicalContext;
