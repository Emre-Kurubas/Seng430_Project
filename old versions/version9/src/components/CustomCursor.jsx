import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = ({ color = '#ccff00' }) => {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const [isPointer, setIsPointer] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const ringRef = useRef({ x: -100, y: -100 });
    const rafRef = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            setPos({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            const target = e.target;
            const isClickable = (
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'TEXTAREA' ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                window.getComputedStyle(target).cursor === 'pointer'
            );
            setIsPointer(isClickable);
        };

        const onDown = () => setIsPressed(true);
        const onUp = () => setIsPressed(false);
        const onLeave = () => setIsVisible(false);
        const onEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
        document.addEventListener('mouseleave', onLeave);
        document.addEventListener('mouseenter', onEnter);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup', onUp);
            document.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('mouseenter', onEnter);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Smooth trailing ring via rAF
    useEffect(() => {
        const lerp = (a, b, t) => a + (b - a) * t;
        const animate = () => {
            ringRef.current.x = lerp(ringRef.current.x, pos.x, 0.15);
            ringRef.current.y = lerp(ringRef.current.y, pos.y, 0.15);

            const ring = document.getElementById('cursor-ring');
            if (ring) {
                ring.style.left = `${ringRef.current.x}px`;
                ring.style.top = `${ringRef.current.y}px`;
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [pos]);

    if (!isVisible) return null;

    return (
        <>
            {/* Outer trailing ring */}
            <div
                id="cursor-ring"
                style={{
                    position: 'fixed',
                    top: -100,
                    left: -100,
                    width: isPointer ? 48 : 36,
                    height: isPointer ? 48 : 36,
                    borderRadius: '50%',
                    border: `1.5px solid ${color}`,
                    opacity: isPressed ? 0.3 : 0.5,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    transition: 'width 0.3s ease, height 0.3s ease, opacity 0.2s ease, border-color 0.3s ease',
                    mixBlendMode: 'difference',
                }}
            />

            {/* Inner dot */}
            <motion.div
                animate={{
                    x: pos.x,
                    y: pos.y,
                    scale: isPressed ? 0.6 : (isPointer ? 1.5 : 1),
                }}
                transition={{
                    type: 'spring',
                    stiffness: 800,
                    damping: 35,
                    mass: 0.3,
                }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 12px ${color}80, 0 0 4px ${color}`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    mixBlendMode: 'difference',
                }}
            />
        </>
    );
};

export default CustomCursor;
