import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const [activeAccordion, setActiveAccordion] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Scroll visibility observer for sections
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(".finix-fade-section");
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) {
          section.classList.add("finix-visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroBullets = [
    {
      title: "End-to-end encryption",
      desc: "Every direct message, voice note, and file is encrypted using modern protocols. Only you and your recipient can read them.",
      icon: "🔒",
    },
    {
      title: "Free voice & video calls",
      desc: "Low-latency HD audio and video calling powered by WebRTC. Seamless one-on-one and group communication without limits.",
      icon: "📞",
    },
    {
      title: "Unlimited group chats",
      desc: "Create dynamic channels for your team, friends, or community with admin controls, media reels, and pinned messages.",
      icon: "👥",
    },
    {
      title: "24/7 sync across devices",
      desc: "Instant cloud synchronization via WebSockets. Pick up exactly where you left off on desktop, tablet, or mobile.",
      icon: "⚡",
    },
  ];

  const testimonials = [
    {
      name: "Alex Rivera",
      handle: "@alexrivera_dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      role: "Lead Fullstack Engineer",
      text: "Switching to Chatify cut our team communication lag to zero. The built-in AI assistant and real-time voice notes are absolute game changers.",
    },
    {
      name: "Sarah Chen",
      handle: "@sarahc_design",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      role: "Product Designer",
      text: "Chatify's UI is so clean and snappy. It feels like what modern messaging should be — fast, clutter-free, and beautifully crafted.",
    },
    {
      name: "Marcus Vance",
      handle: "@marcus_vance",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      role: "Founder & Creator",
      text: "Our entire remote team moved to Chatify for group calls and daily standup threads. Encryption plus instant translation made global collaboration effortless.",
    },
  ];

  return (
    <div className="finix-landing-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,600;1,6..72,700&display=swap');

        :root {
          --fn-bg-gradient: radial-gradient(120% 120% at 50% 0%, #ffffff 0%, #f6f8fb 50%, #edf2f7 100%);
          --fn-card-bg: #ffffff;
          --fn-card-border: rgba(226, 232, 240, 0.8);
          --fn-text-primary: #090d16;
          --fn-text-secondary: #475569;
          --fn-text-muted: #94a3b8;
          --fn-accent: #10b981;
          --fn-accent-glow: rgba(16, 185, 129, 0.25);
          --fn-dark-btn: #090d16;
          --fn-dark-btn-hover: #1e293b;
          --fn-font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          --fn-font-serif: 'Newsreader', Georgia, serif;
          --fn-shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.04);
          --fn-shadow-md: 0 12px 32px rgba(15, 23, 42, 0.08);
          --fn-shadow-lg: 0 24px 64px -12px rgba(15, 23, 42, 0.14);
          --fn-shadow-float: 0 30px 60px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0,0,0,0.05);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .finix-landing-wrapper {
          font-family: var(--fn-font-main);
          background: var(--fn-bg-gradient);
          color: var(--fn-text-primary);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          letter-spacing: -0.01em;
        }

        /* Ambient diagonal light sweep */
        .finix-landing-wrapper::before {
          content: '';
          position: fixed;
          top: -30%;
          left: -10%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle at 75% 20%, rgba(240, 249, 255, 0.7) 0%, transparent 60%),
                      radial-gradient(circle at 20% 80%, rgba(236, 253, 245, 0.5) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        /* Stylistic accent serif word */
        .fn-italic {
          font-family: var(--fn-font-serif);
          font-style: italic;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: #0f172a;
        }

        /* ─── NAVBAR ─── */
        .fn-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          transition: all 0.3s ease;
        }

        .fn-nav-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fn-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
        }

        .fn-logo-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #090d16 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .fn-logo-mark svg {
          width: 20px;
          height: 20px;
          stroke: #10b981;
        }

        .fn-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: var(--fn-text-primary);
          letter-spacing: -0.03em;
        }

        .fn-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        .fn-nav-link {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--fn-text-secondary);
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }

        .fn-nav-link:hover {
          color: var(--fn-text-primary);
        }

        .fn-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fn-store-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid rgba(203, 213, 225, 0.8);
          font-size: 12px;
          font-weight: 600;
          color: var(--fn-text-primary);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }

        .fn-store-badge:hover {
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .fn-btn-ghost {
          background: transparent;
          border: none;
          padding: 8px 16px;
          font-size: 14.5px;
          font-weight: 600;
          color: var(--fn-text-primary);
          cursor: pointer;
          border-radius: 9999px;
          transition: all 0.2s;
        }

        .fn-btn-ghost:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .fn-btn-pill-dark {
          background: var(--fn-dark-btn);
          color: #ffffff;
          border: none;
          padding: 10px 22px;
          font-size: 14.5px;
          font-weight: 700;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(9, 13, 22, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .fn-btn-pill-dark:hover {
          background: var(--fn-dark-btn-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(9, 13, 22, 0.3);
        }

        /* ─── SECTION COMMON ─── */
        .finix-fade-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
        }

        .finix-fade-section.finix-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fn-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .fn-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 5px 14px;
          border-radius: 9999px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        /* ─── 1. HERO SECTION ─── */
        .fn-hero-section {
          padding: 70px 0 100px;
        }

        .fn-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 50px;
          align-items: center;
        }

        .fn-hero-headline {
          font-size: 3.75rem;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.035em;
          color: var(--fn-text-primary);
          margin-bottom: 24px;
        }

        .fn-hero-subhead {
          font-size: 1.15rem;
          line-height: 1.6;
          color: var(--fn-text-secondary);
          max-width: 520px;
          margin-bottom: 36px;
        }

        /* Expandable Accordion */
        .fn-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 520px;
          margin-bottom: 36px;
        }

        .fn-accordion-item {
          background: #ffffff;
          border: 1px solid var(--fn-card-border);
          border-radius: 16px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: var(--fn-shadow-sm);
        }

        .fn-accordion-item:hover, .fn-accordion-item.active {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .fn-accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fn-accordion-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15.5px;
          font-weight: 700;
          color: var(--fn-text-primary);
        }

        .fn-accordion-icon-box {
          font-size: 18px;
        }

        .fn-accordion-chevron {
          width: 20px;
          height: 20px;
          transition: transform 0.25s ease;
          color: var(--fn-text-muted);
        }

        .fn-accordion-item.active .fn-accordion-chevron {
          transform: rotate(90deg);
          color: var(--fn-accent);
        }

        .fn-accordion-body {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--fn-text-secondary);
          animation: fnFadeIn 0.3s ease;
        }

        @keyframes fnFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Right Column: Floating Phone Mockup */
        .fn-hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .fn-phone-mockup {
          width: 320px;
          height: 600px;
          background: #090d16;
          border-radius: 46px;
          padding: 12px;
          box-shadow: var(--fn-shadow-float);
          position: relative;
          animation: fnFloat 6s ease-in-out infinite;
          border: 4px solid #1e293b;
        }

        @keyframes fnFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }

        .fn-phone-screen {
          width: 100%;
          height: 100%;
          background: #0b0f19;
          border-radius: 36px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .fn-phone-notch {
          width: 110px;
          height: 22px;
          background: #000;
          border-radius: 0 0 14px 14px;
          margin: 0 auto;
        }

        .fn-phone-chat-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 24, 39, 0.8);
        }

        .fn-phone-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
        }

        .fn-phone-chat-body {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: flex-end;
        }

        .fn-mock-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 12.5px;
          line-height: 1.4;
          max-width: 82%;
        }

        .fn-mock-bubble.in {
          background: #1f2937;
          color: #f8fafc;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .fn-mock-bubble.out {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .fn-mock-typing {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          background: #1f2937;
          border-radius: 14px;
          align-self: flex-start;
          width: fit-content;
        }

        .fn-mock-typing span {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: fnDotPulse 1.4s infinite ease-in-out both;
        }

        .fn-mock-typing span:nth-child(1) { animation-delay: -0.32s; }
        .fn-mock-typing span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes fnDotPulse {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Floating 3D Reaction & Notification cards */
        .fn-floating-reaction {
          position: absolute;
          top: 18%;
          right: -24px;
          background: #ffffff;
          padding: 10px 16px;
          border-radius: 20px;
          box-shadow: 0 16px 36px rgba(0,0,0,0.15);
          font-size: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fnFloatReverse 5s ease-in-out infinite;
          border: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 5;
        }

        .fn-floating-reaction-badge {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }

        .fn-floating-notif {
          position: absolute;
          bottom: 12%;
          left: -32px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          padding: 12px 18px;
          border-radius: 18px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(226, 232, 240, 0.9);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 5;
          animation: fnFloat 7s ease-in-out infinite;
          max-width: 240px;
        }

        .fn-notif-icon {
          width: 36px;
          height: 36px;
          background: rgba(16, 185, 129, 0.12);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .fn-notif-title {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--fn-text-primary);
        }

        .fn-notif-sub {
          font-size: 11px;
          color: var(--fn-text-muted);
        }

        @keyframes fnFloatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }

        /* ─── 2. SECTION: MESSAGING WITHOUT BORDERS ─── */
        .fn-globe-section {
          padding: 100px 0;
          background: #ffffff;
          border-top: 1px solid var(--fn-card-border);
          border-bottom: 1px solid var(--fn-card-border);
        }

        .fn-globe-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .fn-globe-visual-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 420px;
        }

        .fn-3d-globe-sphere {
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #1e293b 0%, #090d16 80%);
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.25), inset 0 0 40px rgba(16, 185, 129, 0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .fn-globe-ring {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          border: 1px dashed rgba(16, 185, 129, 0.4);
          animation: fnSpin 24s linear infinite;
        }

        @keyframes fnSpin {
          100% { transform: rotate(360deg); }
        }

        .fn-globe-pulse-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 12px #10b981;
        }

        .fn-globe-headline {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: var(--fn-text-primary);
          margin-bottom: 20px;
        }

        .fn-globe-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 36px;
        }

        .fn-stat-item {
          display: flex;
          flex-direction: column;
        }

        .fn-stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--fn-text-primary);
          letter-spacing: -0.03em;
        }

        .fn-stat-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--fn-text-muted);
          margin-top: 4px;
        }

        /* ─── 3. SECTION: CONVERSATIONS WITHOUT DELAYS ─── */
        .fn-delays-section {
          padding: 120px 0;
        }

        .fn-delays-top {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 60px;
        }

        .fn-delays-headline {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: var(--fn-text-primary);
          margin-bottom: 16px;
        }

        .fn-cards-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .fn-feature-card {
          background: #ffffff;
          border: 1px solid var(--fn-card-border);
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: var(--fn-shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .fn-feature-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--fn-shadow-lg);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .fn-feature-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 22px;
        }

        .fn-feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--fn-text-primary);
          margin-bottom: 10px;
        }

        .fn-feature-desc {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--fn-text-secondary);
        }

        /* ─── 4. SECTION: JOIN CHATIFY IN MINUTES ─── */
        .fn-join-section {
          padding: 100px 0;
          background: #ffffff;
          border-top: 1px solid var(--fn-card-border);
          border-bottom: 1px solid var(--fn-card-border);
        }

        .fn-join-grid {
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 60px;
          align-items: center;
        }

        .fn-join-headline {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: var(--fn-text-primary);
          margin-bottom: 32px;
        }

        .fn-step-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 36px;
        }

        .fn-step-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .fn-step-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--fn-dark-btn);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .fn-step-heading {
          font-size: 16px;
          font-weight: 700;
          color: var(--fn-text-primary);
          margin-bottom: 4px;
        }

        .fn-step-desc {
          font-size: 14px;
          color: var(--fn-text-secondary);
          line-height: 1.5;
        }

        /* Plans dark card panel */
        .fn-plan-card-dark {
          background: #090d16;
          color: #ffffff;
          border-radius: 28px;
          padding: 36px 32px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
          position: relative;
        }

        .fn-plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .fn-plan-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .fn-plan-price {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .fn-plan-price span {
          font-size: 15px;
          font-weight: 500;
          color: #94a3b8;
        }

        .fn-plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 24px 0 32px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .fn-plan-features li {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fn-plan-features li span {
          color: #10b981;
          font-weight: bold;
        }

        .fn-plan-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fn-plan-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        /* ─── 5. SECTION: TESTIMONIALS ─── */
        .fn-reviews-section {
          padding: 120px 0;
        }

        .fn-reviews-top {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 50px;
        }

        .fn-reviews-headline {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--fn-text-primary);
        }

        .fn-reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .fn-tweet-card {
          background: #ffffff;
          border: 1px solid var(--fn-card-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--fn-shadow-sm);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
        }

        .fn-tweet-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--fn-shadow-md);
        }

        .fn-tweet-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .fn-tweet-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        .fn-tweet-name {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--fn-text-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .fn-tweet-handle {
          font-size: 12.5px;
          color: var(--fn-text-muted);
        }

        .fn-tweet-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--fn-text-secondary);
        }

        .fn-reviews-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .fn-avatar-stack {
          display: flex;
          margin-right: -8px;
        }

        .fn-avatar-stack img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          margin-left: -8px;
        }

        /* ─── 6. FINAL CTA SECTION ─── */
        .fn-cta-section {
          padding: 100px 0 120px;
          position: relative;
        }

        .fn-cta-card {
          background: radial-gradient(100% 100% at 50% 0%, #1e293b 0%, #090d16 100%);
          border-radius: 36px;
          padding: 70px 48px;
          color: #ffffff;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: var(--fn-shadow-float);
        }

        .fn-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%);
          pointer-events: none;
        }

        .fn-cta-headline {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.035em;
          margin-bottom: 20px;
        }

        .fn-cta-subhead {
          font-size: 1.15rem;
          color: #94a3b8;
          max-width: 540px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }

        .fn-btn-cta-light {
          background: #ffffff;
          color: #090d16;
          border: none;
          padding: 14px 36px;
          font-size: 16px;
          font-weight: 800;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .fn-btn-cta-light:hover {
          background: #f1f5f9;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(255, 255, 255, 0.3);
        }

        /* ─── FOOTER ─── */
        .fn-footer {
          border-top: 1px solid var(--fn-card-border);
          padding: 40px 0;
          background: #ffffff;
          font-size: 13.5px;
          color: var(--fn-text-muted);
        }

        .fn-footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .fn-hero-headline, .fn-globe-headline, .fn-delays-headline, .fn-join-headline, .fn-cta-headline {
            font-size: 2.75rem;
          }
          .fn-hero-grid, .fn-globe-grid, .fn-join-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .fn-cards-row, .fn-reviews-grid {
            grid-template-columns: 1fr;
          }
          .fn-nav-links {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .fn-hero-headline, .fn-globe-headline, .fn-delays-headline, .fn-join-headline, .fn-cta-headline {
            font-size: 2.25rem;
          }
          .fn-store-badge {
            display: none;
          }
          .fn-phone-mockup {
            width: 280px;
            height: 520px;
          }
          .fn-globe-stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="fn-navbar">
        <div className="fn-nav-container">
          <div className="fn-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="fn-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <span className="fn-logo-text">Chatify</span>
          </div>

          <ul className="fn-nav-links">
            <li><a href="#features" className="fn-nav-link">Features</a></li>
            <li><a href="#solutions" className="fn-nav-link">Solutions</a></li>
            <li><a href="#plans" className="fn-nav-link">Pricing</a></li>
            <li><span className="fn-nav-link" onClick={() => navigate("/about")}>About</span></li>
            <li><span className="fn-nav-link" onClick={() => navigate("/help")}>Help</span></li>
          </ul>

          <div className="fn-nav-actions">
            <div className="fn-store-badge" title="Download for iOS">
              <span></span>
              <span>App Store</span>
            </div>
            <div className="fn-store-badge" title="Download for Android">
              <span>▶</span>
              <span>Google Play</span>
            </div>
            <button type="button" className="fn-btn-ghost" onClick={() => navigate("/login")}>
              Log In
            </button>
            <button type="button" className="fn-btn-pill-dark" onClick={() => navigate("/register")}>
              Sign Up →
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SECTION 1: HERO ─── */}
      <section className="fn-hero-section finix-fade-section">
        <div className="fn-container">
          <div className="fn-hero-grid">
            {/* Left Column */}
            <div>
              <div className="fn-badge-pill">✨ Next-Gen Realtime Messaging</div>
              <h1 className="fn-hero-headline">
                Chat anytime,<br />
                <span className="fn-italic">anywhere</span> with ease
              </h1>
              <p className="fn-hero-subhead">
                Chatify connects friends, communities, and global teams with instant encrypted messaging, crystal-clear voice calls, and an intelligent Gemini AI assistant.
              </p>

              {/* Accordion Bullets */}
              <div className="fn-accordion-list">
                {heroBullets.map((bullet, idx) => {
                  const isOpen = activeAccordion === idx;
                  return (
                    <div
                      key={idx}
                      className={`fn-accordion-item ${isOpen ? "active" : ""}`}
                      onClick={() => setActiveAccordion(isOpen ? -1 : idx)}
                    >
                      <div className="fn-accordion-header">
                        <div className="fn-accordion-title-group">
                          <span className="fn-accordion-icon-box">{bullet.icon}</span>
                          <span>{bullet.title}</span>
                        </div>
                        <svg className="fn-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                      {isOpen && <p className="fn-accordion-body">{bullet.desc}</p>}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="fn-btn-pill-dark"
                style={{ padding: "14px 32px", fontSize: "16px" }}
                onClick={() => navigate("/register")}
              >
                Get Started Free →
              </button>
            </div>

            {/* Right Column: Floating 3D Phone Mockup */}
            <div className="fn-hero-visual">
              {/* Floating Reaction Bubble */}
              <div className="fn-floating-reaction">
                <span>❤️</span>
                <span className="fn-floating-reaction-badge">12 reactions</span>
              </div>

              {/* Floating Notification */}
              <div className="fn-floating-notif">
                <div className="fn-notif-icon">🤖</div>
                <div>
                  <div className="fn-notif-title">Chatify AI Assistant</div>
                  <div className="fn-notif-sub">"I translated the note to Telugu!"</div>
                </div>
              </div>

              {/* Phone Frame */}
              <div className="fn-phone-mockup">
                <div className="fn-phone-screen">
                  <div className="fn-phone-notch" />
                  <div className="fn-phone-chat-header">
                    <div className="fn-phone-avatar">C</div>
                    <div>
                      <div style={{ color: "#fff", fontSize: "13px", fontWeight: "700" }}>Pro Team Channel</div>
                      <div style={{ color: "#22c55e", fontSize: "11px" }}>● 8 members active</div>
                    </div>
                  </div>

                  <div className="fn-phone-chat-body">
                    <div className="fn-mock-bubble in">
                      Hey team! The new real-time WebSocket update is live 🚀
                    </div>
                    <div className="fn-mock-bubble out">
                      Awesome! Voice notes and AI translations are super smooth.
                    </div>
                    <div className="fn-mock-bubble in">
                      Check out the live analytics dashboard.
                    </div>
                    <div className="fn-mock-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: MESSAGING WITHOUT BORDERS ─── */}
      <section className="fn-globe-section finix-fade-section" id="solutions">
        <div className="fn-container">
          <div className="fn-globe-grid">
            {/* 3D Globe Visual */}
            <div className="fn-globe-visual-box">
              <div className="fn-3d-globe-sphere">
                <div className="fn-globe-ring" />
                <div className="fn-globe-pulse-dot" style={{ top: "35%", left: "45%" }} />
                <div className="fn-globe-pulse-dot" style={{ top: "60%", left: "65%" }} />
                <div className="fn-globe-pulse-dot" style={{ top: "25%", left: "70%" }} />
                <span style={{ fontSize: "64px", opacity: 0.85 }}>🌐</span>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="fn-badge-pill">🌍 Global Architecture</div>
              <h2 className="fn-globe-headline">
                Messaging without<br />
                <span className="fn-italic">borders</span>
              </h2>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "var(--fn-text-secondary)" }}>
                Whether you are texting a teammate across the hall or initiating an encrypted video call across continents, Chatify delivers sub-millisecond real-time synchronization with zero packet loss.
              </p>

              <div className="fn-globe-stats-grid">
                <div className="fn-stat-item">
                  <span className="fn-stat-number">150+</span>
                  <span className="fn-stat-label">Countries Active</span>
                </div>
                <div className="fn-stat-item">
                  <span className="fn-stat-number">&lt; 20ms</span>
                  <span className="fn-stat-label">Delivery Latency</span>
                </div>
                <div className="fn-stat-item">
                  <span className="fn-stat-number">99.99%</span>
                  <span className="fn-stat-label">Uptime Reliability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: CONVERSATIONS WITHOUT DELAYS ─── */}
      <section className="fn-delays-section finix-fade-section" id="features">
        <div className="fn-container">
          <div className="fn-delays-top">
            <div className="fn-badge-pill">⚡ Lightning Fast</div>
            <h2 className="fn-delays-headline">
              Conversations without<br />
              <span className="fn-italic">delays</span>
            </h2>
            <p style={{ fontSize: "1.1rem", color: "var(--fn-text-secondary)" }}>
              Engineered with modern WebSockets, WebRTC streams, and instant push alerts.
            </p>
          </div>

          <div className="fn-cards-row">
            <div className="fn-feature-card">
              <div className="fn-feature-icon-box">⚡</div>
              <h3 className="fn-feature-title">Instant Delivery</h3>
              <p className="fn-feature-desc">
                Sub-millisecond socket message dispatching with real-time double-check read receipts and typing indicators.
              </p>
            </div>

            <div className="fn-feature-card">
              <div className="fn-feature-icon-box">📹</div>
              <h3 className="fn-feature-title">Group Calls up to 50</h3>
              <p className="fn-feature-desc">
                Crystal-clear HD voice and video conferencing with dynamic grid switching and screen sharing capabilities.
              </p>
            </div>

            <div className="fn-feature-card">
              <div className="fn-feature-icon-box">🔄</div>
              <h3 className="fn-feature-title">Cross-Platform Sync</h3>
              <p className="fn-feature-desc">
                Seamless real-time synchronization between web browsers, iOS, Android, and desktop devices without missing a beat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: JOIN CHATIFY IN MINUTES ─── */}
      <section className="fn-join-section finix-fade-section" id="plans">
        <div className="fn-container">
          <div className="fn-join-grid">
            <div>
              <div className="fn-badge-pill">🚀 Simple Setup</div>
              <h2 className="fn-join-headline">
                Join Chatify and<br />
                <span className="fn-italic">simplify</span> your conversations
              </h2>

              <div className="fn-step-list">
                <div className="fn-step-item">
                  <div className="fn-step-num">1</div>
                  <div>
                    <h4 className="fn-step-heading">Open in Browser or Install App</h4>
                    <p className="fn-step-desc">Access Chatify directly on the web or download our lightweight native mobile app.</p>
                  </div>
                </div>

                <div className="fn-step-item">
                  <div className="fn-step-num">2</div>
                  <div>
                    <h4 className="fn-step-heading">Create an Account in 30 Seconds</h4>
                    <p className="fn-step-desc">Sign up instantly with your Google account or secure email OTP verification.</p>
                  </div>
                </div>

                <div className="fn-step-item">
                  <div className="fn-step-num">3</div>
                  <div>
                    <h4 className="fn-step-heading">Start Chatting & Inviting Friends</h4>
                    <p className="fn-step-desc">Add contacts, create group channels, and ask Gemini AI for instant coding or writing help.</p>
                  </div>
                </div>
              </div>

              <button type="button" className="fn-btn-pill-dark" onClick={() => navigate("/register")}>
                Start Now — It's Free →
              </button>
            </div>

            {/* Right: Pricing Card */}
            <div>
              <div className="fn-plan-card-dark">
                <div className="fn-plan-header">
                  <span style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "#34d399" }}>
                    Pro Workspace
                  </span>
                  <span className="fn-plan-badge">Most Popular</span>
                </div>

                <div className="fn-plan-price">
                  $0 <span>/ forever free tier</span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "13.5px" }}>
                  Unlimited direct messaging, high-quality audio & video calling, and full AI Assistant access included.
                </p>

                <ul className="fn-plan-features">
                  <li><span>✓</span> Unlimited 1-on-1 and Group chats</li>
                  <li><span>✓</span> Built-in Gemini AI Assistant with Voice & File uploads</li>
                  <li><span>✓</span> End-to-end message encryption & real-time translation</li>
                  <li><span>✓</span> Multi-device cloud sync with zero ads</li>
                </ul>

                <button type="button" className="fn-plan-btn" onClick={() => navigate("/register")}>
                  Open Free Account →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: TESTIMONIALS ─── */}
      <section className="fn-reviews-section finix-fade-section">
        <div className="fn-container">
          <div className="fn-reviews-top">
            <div className="fn-badge-pill">💬 Wall of Love</div>
            <h2 className="fn-reviews-headline">
              Loved by creators &<br />
              <span className="fn-italic">fast-moving</span> teams
            </h2>
          </div>

          <div className="fn-reviews-grid">
            {testimonials.map((t, idx) => (
              <div key={idx} className="fn-tweet-card">
                <div>
                  <div className="fn-tweet-header">
                    <img src={t.avatar} alt={t.name} className="fn-tweet-avatar" />
                    <div>
                      <div className="fn-tweet-name">
                        {t.name}
                        <span style={{ color: "#3b82f6", fontSize: "13px" }}>✓</span>
                      </div>
                      <div className="fn-tweet-handle">{t.handle} • {t.role}</div>
                    </div>
                  </div>
                  <p className="fn-tweet-text">"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="fn-reviews-footer">
            <div className="fn-avatar-stack">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User" />
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--fn-text-secondary)" }}>
              Join 50,000+ people chatting effortlessly on Chatify.
            </span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: FINAL CTA ─── */}
      <section className="fn-cta-section finix-fade-section">
        <div className="fn-container">
          <div className="fn-cta-card">
            <h2 className="fn-cta-headline">
              Chatify — the free way to talk<br />
              <span className="fn-italic" style={{ color: "#34d399" }}>you'll love</span>
            </h2>
            <p className="fn-cta-subhead">
              Connect instantly with friends, family, and teams. Experience the future of private, AI-powered real-time communication.
            </p>
            <button
              type="button"
              className="fn-btn-cta-light"
              onClick={() => navigate("/register")}
            >
              Start Chatting Free →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="fn-footer">
        <div className="fn-container">
          <div className="fn-footer-content">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "800", color: "#090d16" }}>Chatify</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/privacy")}>Privacy</span>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/about")}>About</span>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/help")}>Help & Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;