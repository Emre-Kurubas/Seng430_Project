import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { specialties } from '../data/specialties';

const DomainSelector = ({ activeDomain, onDomainChange, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const primaryColor = activeDomain?.theme?.primary || '#6366f1';

    return (
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
            {/* Trigger Button */}
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', borderRadius: 16,
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                    color: isDarkMode ? '#fff' : '#000',
                    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 200
                }}
            >
                <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                    {activeDomain?.emoji || '🩺'}
                </span>
                <span style={{ flexGrow: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {activeDomain?.name || 'Select Specialty'}
                </span>
                <ChevronDown size={16} strokeWidth={2.5} style={{ opacity: 0.4, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>

            {/* Dropdown Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: 8,
                            width: 260,
                            padding: '6px',
                            background: isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                            borderRadius: 20,
                            boxShadow: isDarkMode ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.15)',
                            display: 'flex', flexDirection: 'column', gap: 2,
                            maxHeight: '60vh', overflowY: 'auto'
                        }}
                        className="no-scrollbar"
                    >
                        <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Specialties
                        </div>
                        {specialties.map(domain => {
                            const isActive = activeDomain?.id === domain.id;
                            return (
                                <button
                                    key={domain.id}
                                    onClick={() => { onDomainChange(domain); setIsOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        width: '100%', padding: '10px 12px', borderRadius: 14,
                                        border: 'none', background: isActive ? primaryColor : 'transparent',
                                        color: isActive ? '#fff' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                                        fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                                        textAlign: 'left', transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: '1.3rem', filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'grayscale(100%) opacity(70%)' }}>
                                            {domain.emoji}
                                        </span>
                                        <span>{domain.name}</span>
                                    </div>
                                    {isActive && <Check size={18} strokeWidth={3} color="#fff" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DomainSelector;
