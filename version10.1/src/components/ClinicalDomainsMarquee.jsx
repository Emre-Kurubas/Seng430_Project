import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, HeartPulse, Brain, Microscope, Dna, Activity } from 'lucide-react';

const domains = [
  { img: '/marquee_cartoon_brain_1776556576131.png', title: 'Neurology', icon: Brain, color: '#ec4899' },
  { img: '/marquee_cartoon_dna_1776556593999.png', title: 'Genomics', icon: Dna, color: '#10b981' },
  { img: '/marquee_cartoon_brain_1776556576131.png', title: 'Cardiology', icon: HeartPulse, color: '#ef4444' },
  { img: '/marquee_cartoon_dna_1776556593999.png', title: 'Pathology', icon: Microscope, color: '#3b82f6' },
  { img: '/marquee_cartoon_brain_1776556576131.png', title: 'Emergency', icon: Activity, color: '#f59e0b' },
  { img: '/marquee_cartoon_dna_1776556593999.png', title: 'Psychiatry', icon: Brain, color: '#8b5cf6' },
];

export default function ClinicalDomainsMarquee() {
  return (
    <section className="domains-marquee-section">
      <motion.div 
        className="marquee-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2>TRAIN MODELS ACROSS 20+ CLINICAL DOMAINS</h2>
        <p>Explore specialized datasets designed to teach ML concepts using real-world medical data.</p>
      </motion.div>

      <div className="marquee-container">
        {/* We use two identical tracks to create an infinite loop effect */}
        <div className="marquee-track">
          {domains.map((domain, i) => (
            <div key={`track1-${i}`} className="marquee-item">
              <img src={domain.img} alt={domain.title} className="film-strip-bg" />
              <div className="glass-card-body">
                <div className="card-icon-wrapper" style={{ backgroundColor: `${domain.color}20`, color: domain.color }}>
                  <domain.icon size={26} />
                </div>
                <div className="glass-card-text">
                  <h3>{domain.title}</h3>
                  <p className="card-metrics">1.2M Records</p>
                </div>
              </div>
            </div>
          ))}
          {/* Duplicate for seamless infinite scrolling */}
          {domains.map((domain, i) => (
            <div key={`track2-${i}`} className="marquee-item">
              <img src={domain.img} alt={domain.title} className="film-strip-bg" />
              <div className="glass-card-body">
                <div className="card-icon-wrapper" style={{ backgroundColor: `${domain.color}20`, color: domain.color }}>
                  <domain.icon size={26} />
                </div>
                <div className="glass-card-text">
                  <h3>{domain.title}</h3>
                  <p className="card-metrics">1.2M Records</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
