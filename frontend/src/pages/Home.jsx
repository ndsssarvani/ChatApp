import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-copilot");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorHovered, setCursorHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Typewriter animated phrases for luxury hero
  const phrases = [
    "Team Messaging",
    "AI Intelligence",
    "Encrypted Threads",
    "Global Channels",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Demo messages state for interactive platform
  const [demoMessages, setDemoMessages] = useState([
    {
      id: 1,
      sender: "Sarah Jenkins",
      role: "Design Lead",
      text: "Hey team! The new Chatify 2.0 component system and fluid animations are ready for production. 🚀",
      time: "10:42 AM",
      avatar: "👩‍🎨",
      isMe: false,
      reactions: ["🔥 4", "❤️ 2"],
    },
    {
      id: 2,
      sender: "Chatify AI Copilot",
      role: "Neural Assistant",
      text: "⚡ I analyzed your sprint backlog: 14 PRs merged with 0 regressions. Edge WebSocket latency is steady at 8.4ms. Would you like me to draft release notes?",
      time: "10:43 AM",
      avatar: "🤖",
      isMe: false,
      reactions: ["🤖 6", "⚡ 4"],
      isAi: true,
    },
    {
      id: 3,
      sender: "Alex Rivera",
      role: "Tech Lead",
      text: "Yes please @Chatify AI! Also generate the changelog summary for our staging deployment.",
      time: "10:44 AM",
      avatar: "👨‍💻",
      isMe: false,
      reactions: ["🙌 3"],
    },
    {
      id: 4,
      sender: "You",
      role: "Product Lead",
      text: "Incredible speed! Chatify team chat + AI assistant in one view is a game changer. 🎉",
      time: "10:45 AM",
      avatar: "⚡",
      isMe: true,
      reactions: ["🚀 8"],
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statCount, setStatCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const canvasRef = useRef(null);

  // Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0;
      setScrollProgress(scroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Counter animation on load
  useEffect(() => {
    let start = 0;
    const end = 1000000;
    const duration = 1800;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setStatCount(end);
        clearInterval(timer);
      } else {
        setStatCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  // Typewriter Loop
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const speed = isDeleting ? 45 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < currentPhrase.length) {
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  // Mouse Parallax & Custom Cursor Tracking
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    setCursorPos({ x: clientX, y: clientY });

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (clientX - centerX) / 45,
      y: (clientY - centerY) / 45,
    });
  };

  // Ambient Canvas Particle Field & Constellation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 42 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.4 ? "rgba(216, 182, 106, 0.45)" : "rgba(245, 239, 228, 0.2)",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles with delicate gold drafting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(216, 182, 106, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(216, 182, 106, 0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const triggerReaction = (emoji) => {
    const newHeart = {
      id: Date.now() + Math.random(),
      emoji,
      x: cursorPos.x + (Math.random() * 40 - 20),
      y: cursorPos.y + (Math.random() * 20 - 10),
    };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const handleSendDemoMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "You",
      role: "Product Lead",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatar: "⚡",
      isMe: true,
      reactions: ["👍 1"],
    };

    setDemoMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setIsTyping(true);
    triggerReaction(activeTab === "ai-copilot" ? "🤖" : "💬");

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      if (activeTab === "ai-copilot") {
        const aiReplies = [
          "🤖 Chatify AI Copilot: I analyzed this query. Generated a context summary and synced action items across your team channels. ✨",
          "🤖 Chatify AI: Real-time code review & sentiment analysis completed. Zero security vulnerabilities found. 🛡️",
          "🤖 Chatify AI: Stored in team memory vault. Automated daily standup notes compiled! 🚀",
        ];
        replyText = aiReplies[Math.floor(Math.random() * aiReplies.length)];
      } else {
        const teamReplies = [
          "Chatify LiveSync confirmed! End-to-end encrypted packet delivered in 8ms. ⚡",
          "Got it! Message dispatched across all connected team devices instantly. 🚀",
          "Instant delivery acknowledged by all active workspace members. ✨",
        ];
        replyText = teamReplies[Math.floor(Math.random() * teamReplies.length)];
      }

      setDemoMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: activeTab === "ai-copilot" ? "Chatify AI Copilot" : "Sarah Jenkins",
          role: activeTab === "ai-copilot" ? "Neural Assistant" : "Design Lead",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          avatar: activeTab === "ai-copilot" ? "🤖" : "👩‍🎨",
          isMe: false,
          isAi: activeTab === "ai-copilot",
          reactions: ["❤️ 4", "⚡ 3"],
        },
      ]);
    }, 1000);
  };

  const steps = [
    {
      num: "01",
      title: "Team & AI Workspaces",
      desc: "Spin up isolated channels, collaborative team DMs, and persistent AI Copilot threads with zero server setup.",
      tag: "Setup in 30s",
      icon: "⚡",
    },
    {
      num: "02",
      title: "Invite Colleagues & AI Agents",
      desc: "Connect team members with magic links. Trigger AI summaries, automated standups, and smart translation in any thread.",
      tag: "Zero Friction",
      icon: "🤖",
    },
    {
      num: "03",
      title: "Real-Time Encrypted Flow",
      desc: "Share high-resolution media, voice memos, and code with sub-11ms WebSocket delivery and end-to-end encryption.",
      tag: "Live & Protected",
      icon: "🛡️",
    },
  ];

  const marqueeTrack1 = [
    { icon: "⚡", title: "Sub-11ms Latency", desc: "Edge WebSocket message delivery", tag: "Ultra Fast" },
    { icon: "🤖", title: "Chatify Copilot 4.5", desc: "Instant AI thread summaries & action items", tag: "AI Powered" },
    { icon: "🔒", title: "Zero-Knowledge E2EE", desc: "256-bit military encryption keys", tag: "Protected" },
    { icon: "🎙️", title: "HD Spatial Audio", desc: "Noise-cancelled voice & video rooms", tag: "Pro Audio" },
    { icon: "🌐", title: "50+ Real-Time Languages", desc: "Neural auto-translation across chats", tag: "Global" },
    { icon: "📁", title: "4K Media Engine", desc: "Drag & drop streaming zero compression", tag: "Instant" },
    { icon: "📌", title: "Smart Pins & Threads", desc: "Zero clutter, organized topic channels", tag: "Productive" },
    { icon: "✨", title: "Ephemeral Channels", desc: "Confidential self-destructing chats", tag: "Privacy" },
  ];

  const marqueeTrack2 = [
    { icon: "⭐", title: "4.9 / 5 Rating", desc: "Loved by 70,000+ modern teams", tag: "Top Rated" },
    { icon: "🚀", title: "1-Click Magic Link", desc: "Instant zero-friction teammate onboarding", tag: "Seamless" },
    { icon: "📊", title: "Sentiment Radar", desc: "Live team pulse & engagement telemetry", tag: "Analytics" },
    { icon: "🛡️", title: "SOC-2 & GDPR Certified", desc: "Enterprise-grade data security", tag: "Compliant" },
    { icon: "🔔", title: "AI Focus Shield", desc: "Smart urgency detection & noise filter", tag: "Smart Alerts" },
    { icon: "🎨", title: "Adaptive UI Themes", desc: "Fluid light to obsidian dark mode", tag: "Customizable" },
    { icon: "👥", title: "Unlimited Scalability", desc: "From 5 to 50,000 concurrent members", tag: "Enterprise" },
    { icon: "🔥", title: "Live Typing Waves", desc: "Real-time collaborative draft view", tag: "Live" },
  ];

  return (
    <div className="cf-app-root" onMouseMove={handleMouseMove}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* ---------- GLOBAL RESET & LUXURY CINEMATIC BASE ---------- */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          width: 100%;
          min-height: 100%;
          background: #120D08;
          color: #F5EFE4;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .cf-app-root {
          width: 100%;
          min-height: 100vh;
          background: #120D08;
          color: #F5EFE4;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* Top Golden Scroll Progress Bar */
        .cf-scroll-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #C9A45C, #D8B66A, #E0C27A);
          z-index: 9999;
          box-shadow: 0 0 12px rgba(216, 182, 106, 0.7);
          transition: width 0.1s ease-out;
        }

        /* Custom Floating Cursor Ring */
        .cf-custom-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid rgba(216, 182, 106, 0.45);
          background: rgba(216, 182, 106, 0.05);
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
          display: none;
        }
        @media (hover: hover) and (pointer: fine) {
          .cf-custom-cursor { display: block; }
        }
        .cf-custom-cursor.hovered {
          width: 56px;
          height: 56px;
          border-color: #D8B66A;
          background: rgba(216, 182, 106, 0.15);
        }

        /* Ambient floating blurred backdrop orbs - Luxury Espresso & Gold */
        .cf-ambient-orb-1 {
          position: absolute;
          top: 60px;
          left: -100px;
          width: 580px;
          height: 580px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201, 164, 92, 0.16) 0%, rgba(36, 23, 13, 0.4) 50%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: floatOrb 16s ease-in-out infinite alternate;
        }

        .cf-ambient-orb-2 {
          position: absolute;
          top: 300px;
          right: -80px;
          width: 620px;
          height: 620px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(216, 182, 106, 0.12) 0%, rgba(43, 27, 13, 0.4) 50%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: floatOrb2 18s ease-in-out infinite alternate;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.12); }
          100% { transform: translate(20px, 80px) scale(0.96); }
        }

        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 60px) scale(1.1); }
          100% { transform: translate(-20px, -40px) scale(0.95); }
        }

        /* Container */
        .cf-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }

        /* ---------- 1. ELEGANT NAVBAR ---------- */
        .cf-navbar {
          position: sticky;
          top: 0;
          width: 100%;
          z-index: 1000;
          background: rgba(18, 13, 8, 0.78);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(212, 174, 96, 0.16);
          transition: all 0.3s ease;
        }

        .cf-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 76px;
          gap: 20px;
        }

        .cf-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: #F5EFE4;
          text-decoration: none;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }

        .cf-logo-icon-svg {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #24170D 0%, #1A120B 100%);
          border: 1px solid rgba(212, 174, 96, 0.35);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .cf-nav-menu {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        .cf-nav-menu a {
          color: #E8E1D6;
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          transition: color 0.25s ease;
          position: relative;
        }

        .cf-nav-menu a:hover {
          color: #D8B66A;
        }

        .cf-nav-menu a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #D8B66A;
          transition: width 0.25s ease;
        }

        .cf-nav-menu a:hover::after {
          width: 100%;
        }

        .cf-nav-ai-pill {
          background: rgba(216, 182, 106, 0.12) !important;
          border: 1px solid rgba(216, 182, 106, 0.35) !important;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          color: #D8B66A !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s ease !important;
        }

        .cf-nav-ai-pill:hover {
          background: rgba(216, 182, 106, 0.22) !important;
          border-color: #D8B66A !important;
          transform: translateY(-1px);
        }

        .cf-nav-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .cf-btn-login-nav {
          color: #F5EFE4;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1px solid rgba(212, 174, 96, 0.25);
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.25s ease;
        }

        .cf-btn-login-nav:hover {
          background: rgba(212, 174, 96, 0.12);
          border-color: #D8B66A;
          color: #D8B66A;
        }

        .cf-btn-signup-nav {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: 999px;
          box-shadow: 0 4px 16px rgba(216, 182, 106, 0.3);
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .cf-btn-signup-nav:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(216, 182, 106, 0.45);
          filter: brightness(1.06);
        }

        .cf-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
          padding: 6px;
        }

        .cf-hamburger span {
          width: 22px;
          height: 2px;
          background: #F5EFE4;
          border-radius: 2px;
        }

        /* Mobile Slide Drawer */
        .cf-mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: #1A120B;
          z-index: 2000;
          padding: 30px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cf-mobile-menu.active {
          transform: translateX(0);
        }

        /* ---------- 2. CINEMATIC HERO SECTION ---------- */
        .cf-hero {
          position: relative;
          padding: 60px 0 80px;
          min-height: calc(100vh - 76px);
          display: flex;
          align-items: center;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 20%, #24170D 0%, #1A120B 45%, #120D08 100%);
        }

        .cf-hero-particle-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .cf-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 48px;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        /* Left Hero Content */
        .cf-hero-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .cf-trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(216, 182, 106, 0.08);
          border: 1px solid rgba(216, 182, 106, 0.25);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13px;
          color: #E8E1D6;
          margin-bottom: 24px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .cf-trial-badge:hover {
          background: rgba(216, 182, 106, 0.16);
          border-color: #D8B66A;
        }

        .cf-trial-badge b {
          color: #D8B66A;
        }

        .cf-trial-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #D8B66A;
          color: #120D08;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .cf-hero-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 5.2vw, 68px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #F5EFE4;
          margin-bottom: 22px;
          max-width: 640px;
        }

        .cf-headline-accent {
          display: block;
          background: linear-gradient(135deg, #F5EFE4 0%, #D8B66A 50%, #C9A45C 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }

        .cf-typewriter-text {
          color: #D8B66A;
          display: inline;
        }

        .cf-typewriter-cursor {
          display: inline-block;
          width: 3.5px;
          height: 0.85em;
          background: #D8B66A;
          margin-left: 6px;
          vertical-align: middle;
          animation: cursorBlink 0.9s infinite;
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .cf-hero-desc {
          font-size: 16.5px;
          line-height: 1.65;
          color: #AFA69A;
          margin-bottom: 32px;
          max-width: 520px;
        }

        .cf-hero-cta-group {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }

        .cf-btn-primary-hero {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          border: none;
          border-radius: 999px;
          padding: 16px 36px;
          font-size: 15.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(216, 182, 106, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cf-btn-primary-hero:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 36px rgba(216, 182, 106, 0.45);
          filter: brightness(1.06);
        }

        .cf-demo-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15.5px;
          font-weight: 600;
          color: #F5EFE4;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(212, 174, 96, 0.25);
          cursor: pointer;
          padding: 14px 24px;
          border-radius: 999px;
          transition: all 0.25s ease;
        }

        .cf-demo-trigger span.circ {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(216, 182, 106, 0.2);
          color: #D8B66A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: all 0.25s ease;
        }

        .cf-demo-trigger:hover {
          background: rgba(216, 182, 106, 0.12);
          border-color: #D8B66A;
        }

        .cf-demo-trigger:hover span.circ {
          background: #D8B66A;
          color: #120D08;
          transform: scale(1.1);
        }

        /* Hero Stat Box */
        .cf-hero-stats-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(36, 23, 13, 0.6);
          border: 1px solid rgba(212, 174, 96, 0.2);
          border-radius: 14px;
          backdrop-filter: blur(12px);
          max-width: 480px;
        }

        .cf-stat-big-num {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #D8B66A;
          line-height: 1;
          white-space: nowrap;
        }

        .cf-stat-description {
          font-size: 12.5px;
          color: #AFA69A;
          line-height: 1.4;
        }

        /* ---------- 3. REALISTIC CHATAPP PRODUCT SHOWCASE (RIGHT COLUMN) ---------- */
        .cf-hero-right {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .cf-product-frame {
          width: 100%;
          max-width: 620px;
          background: #1A120B;
          border-radius: 18px;
          border: 1px solid rgba(212, 174, 96, 0.25);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(216, 182, 106, 0.12);
          overflow: hidden;
          position: relative;
          animation: floatProduct 6s ease-in-out infinite alternate;
        }

        @keyframes floatProduct {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-10px); }
        }

        /* Browser/App Window Header */
        .cf-frame-header {
          height: 42px;
          background: #24170D;
          border-bottom: 1px solid rgba(212, 174, 96, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .cf-frame-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cf-frame-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .cf-frame-title {
          font-size: 12px;
          font-weight: 600;
          color: #AFA69A;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cf-frame-latency {
          font-size: 11px;
          color: #10b981;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.12);
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        /* App Mockup Layout */
        .cf-frame-body {
          display: grid;
          grid-template-columns: 190px 1fr;
          height: 420px;
          background: #140E09;
        }

        /* Sidebar in Mockup */
        .cf-mock-sidebar {
          background: #1A120B;
          border-right: 1px solid rgba(212, 174, 96, 0.12);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cf-mock-user-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(212, 174, 96, 0.15);
        }

        .cf-mock-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D8B66A, #C9A45C);
          color: #120D08;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .cf-mock-user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .cf-mock-user-name {
          font-size: 12px;
          font-weight: 700;
          color: #F5EFE4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cf-mock-user-status {
          font-size: 10px;
          color: #10b981;
        }

        .cf-mock-section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #AFA69A;
          letter-spacing: 0.05em;
          padding: 0 4px;
        }

        .cf-mock-channels {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cf-mock-channel-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: #E8E1D6;
          background: transparent;
          cursor: pointer;
        }

        .cf-mock-channel-item.active {
          background: rgba(216, 182, 106, 0.15);
          color: #D8B66A;
          font-weight: 600;
          border: 1px solid rgba(216, 182, 106, 0.3);
        }

        .cf-mock-badge {
          font-size: 10px;
          background: #D8B66A;
          color: #120D08;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }

        /* Mockup Main Chat Area */
        .cf-mock-chat-main {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #120D08;
          padding: 14px;
        }

        .cf-mock-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(212, 174, 96, 0.12);
        }

        .cf-mock-chat-title {
          font-size: 13px;
          font-weight: 700;
          color: #F5EFE4;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cf-mock-e2e-pill {
          font-size: 10.5px;
          color: #D8B66A;
          background: rgba(216, 182, 106, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(216, 182, 106, 0.2);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Mock Messages Feed */
        .cf-mock-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 10px 0;
          overflow: hidden;
        }

        .cf-mock-msg-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .cf-mock-msg-bubble {
          max-width: 86%;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 12px;
          line-height: 1.45;
        }

        .cf-mock-msg-bubble.peer {
          background: #1E150D;
          border: 1px solid rgba(212, 174, 96, 0.15);
          color: #F5EFE4;
        }

        .cf-mock-msg-bubble.ai {
          background: rgba(216, 182, 106, 0.1);
          border: 1px solid rgba(216, 182, 106, 0.35);
          color: #F5EFE4;
        }

        .cf-mock-msg-bubble.me {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          font-weight: 600;
          margin-left: auto;
        }

        .cf-mock-msg-author {
          font-size: 10.5px;
          font-weight: 700;
          color: #D8B66A;
          margin-bottom: 2px;
        }

        .cf-mock-msg-author.ai {
          color: #E0C27A;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Mock Input Box */
        .cf-mock-input-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.25);
          border-radius: 10px;
          padding: 6px 12px;
        }

        .cf-mock-placeholder {
          font-size: 12px;
          color: #AFA69A;
          flex: 1;
        }

        .cf-mock-send-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #D8B66A;
          color: #120D08;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        /* Floating Overlap Badges */
        .cf-float-badge-1 {
          position: absolute;
          top: -16px;
          right: 20px;
          background: rgba(36, 23, 13, 0.9);
          border: 1px solid rgba(216, 182, 106, 0.4);
          backdrop-filter: blur(10px);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #D8B66A;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 10;
        }

        .cf-float-badge-2 {
          position: absolute;
          bottom: -16px;
          left: 20px;
          background: rgba(36, 23, 13, 0.9);
          border: 1px solid rgba(216, 182, 106, 0.4);
          backdrop-filter: blur(10px);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #F5EFE4;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 10;
        }

        /* ---------- 4. MARQUEE TICKER ---------- */
        .cf-hero-marquee-wrapper {
          width: 100%;
          margin: 60px 0 0;
          overflow: hidden;
          position: relative;
        }

        .cf-marquee-track-container {
          display: flex;
          overflow: hidden;
          user-select: none;
          gap: 16px;
          margin-bottom: 16px;
        }

        .cf-marquee-track {
          display: flex;
          flex-shrink: 0;
          gap: 16px;
          animation: marqueeScroll 32s linear infinite;
        }

        .cf-marquee-track.track-right {
          animation: marqueeScrollRight 34s linear infinite;
        }

        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes marqueeScrollRight {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }

        .cf-marquee-badge-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(36, 23, 13, 0.6);
          border: 1px solid rgba(212, 174, 96, 0.18);
          border-radius: 12px;
          padding: 10px 18px;
          white-space: nowrap;
          backdrop-filter: blur(8px);
        }

        .cf-marquee-badge-icon {
          font-size: 20px;
        }

        .cf-marquee-badge-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cf-marquee-badge-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #F5EFE4;
        }

        .cf-marquee-badge-tag {
          font-size: 10.5px;
          background: rgba(216, 182, 106, 0.15);
          color: #D8B66A;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .cf-marquee-badge-desc {
          font-size: 11.5px;
          color: #AFA69A;
        }

        /* ---------- 5. SECTION HEADINGS & COMMON STYLES ---------- */
        .cf-section {
          padding: 90px 0;
          position: relative;
          border-top: 1px solid rgba(212, 174, 96, 0.12);
        }

        .cf-tag-kicker {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #D8B66A;
          margin-bottom: 10px;
        }

        .cf-sec-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: 48px;
        }

        .cf-sec-main-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3.8vw, 48px);
          font-weight: 700;
          color: #F5EFE4;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        .cf-sec-lead-text {
          font-size: 15.5px;
          line-height: 1.6;
          color: #AFA69A;
          max-width: 480px;
        }

        /* ---------- 6. INTERACTIVE LIVE PLATFORM DEMO ---------- */
        .cf-live-workspace {
          display: grid;
          grid-template-columns: 260px 1fr;
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.22);
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          min-height: 480px;
        }

        .cf-workspace-sidebar {
          background: #160F09;
          border-right: 1px solid rgba(212, 174, 96, 0.12);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cf-ws-title {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #D8B66A;
          letter-spacing: 0.06em;
        }

        .cf-channel-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cf-channel-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid transparent;
          color: #E8E1D6;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .cf-channel-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .cf-channel-item.active {
          background: rgba(216, 182, 106, 0.15);
          border-color: rgba(216, 182, 106, 0.35);
          color: #D8B66A;
          font-weight: 700;
        }

        .cf-workspace-chat {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #120D08;
          padding: 24px;
        }

        .cf-ws-chat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(212, 174, 96, 0.12);
        }

        .cf-ws-chat-title b {
          font-size: 16px;
          color: #F5EFE4;
          display: block;
        }

        .cf-ws-chat-title span {
          font-size: 12px;
          color: #10b981;
        }

        .cf-ws-chat-messages {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 0;
          overflow-y: auto;
          max-height: 320px;
        }

        .cf-chat-bubble-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .cf-chat-bubble-row.me {
          flex-direction: row-reverse;
        }

        .cf-chat-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #24170D;
          border: 1px solid rgba(212, 174, 96, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .cf-chat-bubble-body {
          max-width: 80%;
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.15);
          border-radius: 14px;
          padding: 12px 16px;
        }

        .cf-chat-bubble-body.is-ai-bubble {
          background: rgba(216, 182, 106, 0.08);
          border-color: rgba(216, 182, 106, 0.3);
        }

        .cf-chat-bubble-row.me .cf-chat-bubble-body {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          border: none;
        }

        .cf-chat-meta {
          font-size: 11.5px;
          color: #D8B66A;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .cf-chat-bubble-row.me .cf-chat-meta {
          color: #3D2908;
        }

        .cf-chat-text {
          font-size: 13.5px;
          line-height: 1.5;
        }

        .cf-reactions-tray {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }

        .cf-reaction-tag {
          font-size: 11.5px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(212, 174, 96, 0.2);
          border-radius: 6px;
          padding: 2px 6px;
          cursor: pointer;
        }

        .cf-typing-bar {
          font-size: 12px;
          color: #D8B66A;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }

        .cf-ws-chat-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.25);
          border-radius: 12px;
          padding: 6px 8px 6px 16px;
        }

        .cf-ws-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #F5EFE4;
          font-size: 14px;
          outline: none;
        }

        .cf-ws-input::placeholder {
          color: #AFA69A;
        }

        .cf-ws-send-btn {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          font-weight: 800;
          font-size: 13px;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cf-ws-send-btn:hover {
          filter: brightness(1.1);
        }

        /* ---------- 7. FEATURE PILLARS ---------- */
        .cf-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .cf-pillar-box {
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.18);
          border-radius: 16px;
          padding: 32px 28px;
          transition: all 0.3s ease;
          position: relative;
        }

        .cf-pillar-box:hover {
          transform: translateY(-4px);
          border-color: rgba(216, 182, 106, 0.45);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .cf-pillar-badge-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(216, 182, 106, 0.12);
          border: 1px solid rgba(216, 182, 106, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #D8B66A;
          margin-bottom: 20px;
        }

        .cf-pillar-box h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #F5EFE4;
          margin-bottom: 10px;
        }

        .cf-pillar-box p {
          font-size: 14px;
          line-height: 1.6;
          color: #AFA69A;
        }

        /* ---------- 8. HOW IT WORKS & SECURITY ---------- */
        .cf-steps-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }

        .cf-step-card {
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.18);
          border-radius: 16px;
          padding: 32px 28px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cf-step-card.active, .cf-step-card:hover {
          border-color: #D8B66A;
          background: rgba(36, 23, 13, 0.8);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .cf-step-number {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: #D8B66A;
          margin-bottom: 12px;
        }

        .cf-step-pill-tag {
          font-size: 11px;
          background: rgba(216, 182, 106, 0.15);
          color: #D8B66A;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 12px;
        }

        .cf-step-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #F5EFE4;
          margin-bottom: 8px;
        }

        .cf-step-card p {
          font-size: 14px;
          line-height: 1.55;
          color: #AFA69A;
        }

        /* Dark Spec Security Card */
        .cf-dark-spec-card {
          background: linear-gradient(135deg, #24170D 0%, #1A120B 100%);
          border: 1px solid rgba(212, 174, 96, 0.3);
          border-radius: 20px;
          padding: 48px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 48px;
          align-items: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .cf-dark-spec-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #F5EFE4;
          margin-bottom: 14px;
        }

        .cf-dark-spec-card p {
          font-size: 15px;
          line-height: 1.65;
          color: #AFA69A;
          margin-bottom: 24px;
        }

        .cf-dark-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .cf-metric-tile {
          background: rgba(18, 13, 8, 0.6);
          border: 1px solid rgba(212, 174, 96, 0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .cf-metric-big {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #D8B66A;
          margin-bottom: 4px;
        }

        .cf-metric-sub {
          font-size: 12.5px;
          color: #AFA69A;
        }

        /* ---------- 9. REVIEWS / TESTIMONIALS ---------- */
        .cf-reviews-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }

        .cf-review-card {
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.18);
          border-radius: 18px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
          transition: all 0.3s ease;
        }

        .cf-review-card:hover {
          border-color: #D8B66A;
          transform: translateY(-3px);
        }

        .cf-review-stars {
          color: #D8B66A;
          font-size: 16px;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }

        .cf-review-quote {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          line-height: 1.6;
          color: #F5EFE4;
          font-style: italic;
        }

        .cf-reviewer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(212, 174, 96, 0.12);
        }

        .cf-reviewer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #24170D;
          border: 1px solid rgba(212, 174, 96, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .cf-reviewer-meta b {
          font-size: 14.5px;
          color: #F5EFE4;
          display: block;
        }

        .cf-reviewer-meta span {
          font-size: 12px;
          color: #AFA69A;
        }

        /* ---------- 10. FINAL LUXURY CTA BANNER ---------- */
        .cf-cta-section {
          padding: 100px 0;
          background: radial-gradient(circle at 50% 50%, #2B1B0D 0%, #1A120B 60%, #120D08 100%);
          text-align: center;
          border-top: 1px solid rgba(212, 174, 96, 0.2);
        }

        .cf-cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(34px, 4vw, 52px);
          font-weight: 700;
          color: #F5EFE4;
          margin-bottom: 16px;
        }

        .cf-cta-subtext {
          font-size: 16.5px;
          color: #AFA69A;
          max-width: 580px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }

        .cf-cta-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .cf-btn-cta-white {
          background: linear-gradient(135deg, #D8B66A 0%, #C9A45C 100%);
          color: #120D08;
          font-size: 15.5px;
          font-weight: 700;
          text-decoration: none;
          padding: 16px 36px;
          border-radius: 999px;
          box-shadow: 0 10px 28px rgba(216, 182, 106, 0.35);
          transition: all 0.3s ease;
        }

        .cf-btn-cta-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(216, 182, 106, 0.5);
          filter: brightness(1.08);
        }

        .cf-btn-cta-outline {
          background: transparent;
          color: #F5EFE4;
          border: 1px solid rgba(212, 174, 96, 0.35);
          font-size: 15.5px;
          font-weight: 600;
          text-decoration: none;
          padding: 15px 32px;
          border-radius: 999px;
          transition: all 0.25s ease;
        }

        .cf-btn-cta-outline:hover {
          background: rgba(216, 182, 106, 0.12);
          border-color: #D8B66A;
        }

        /* ---------- 11. FOOTER ---------- */
        .cf-site-footer {
          background: #0E0A06;
          border-top: 1px solid rgba(212, 174, 96, 0.12);
          padding: 80px 0 40px;
        }

        .cf-footer-cols {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 60px;
        }

        .cf-footer-brand-info p {
          font-size: 13.5px;
          color: #AFA69A;
          line-height: 1.65;
          margin-top: 16px;
          max-width: 320px;
        }

        .cf-footer-col h5 {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #D8B66A;
          margin-bottom: 20px;
        }

        .cf-footer-col ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cf-footer-col a {
          color: #AFA69A;
          text-decoration: none;
          font-size: 13.5px;
          transition: color 0.2s ease;
        }

        .cf-footer-col a:hover {
          color: #F5EFE4;
        }

        .cf-footer-base-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 32px;
          border-top: 1px solid rgba(212, 174, 96, 0.1);
          font-size: 12.5px;
          color: #AFA69A;
        }

        /* ---------- 12. MODAL & FLOATING REACTIONS ---------- */
        .cf-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .cf-modal-window {
          background: #1A120B;
          border: 1px solid rgba(212, 174, 96, 0.3);
          border-radius: 20px;
          padding: 40px;
          max-width: 540px;
          width: 100%;
          position: relative;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
        }

        .cf-modal-x {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          font-size: 22px;
          color: #AFA69A;
          cursor: pointer;
        }

        .cf-modal-x:hover {
          color: #F5EFE4;
        }

        .cf-floating-heart {
          position: fixed;
          font-size: 24px;
          pointer-events: none;
          z-index: 9999;
          animation: floatUpFade 1.2s forwards ease-out;
        }

        @keyframes floatUpFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.4);
          }
        }

        /* ---------- 13. RESPONSIVENESS ---------- */
        @media (max-width: 1024px) {
          .cf-hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .cf-pillars-grid, .cf-steps-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .cf-dark-spec-card {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 36px;
          }

          .cf-footer-cols {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .cf-nav-menu, .cf-btn-login-nav, .cf-btn-signup-nav {
            display: none;
          }

          .cf-hamburger {
            display: flex;
          }

          .cf-pillars-grid, .cf-steps-row, .cf-reviews-grid {
            grid-template-columns: 1fr;
          }

          .cf-live-workspace {
            grid-template-columns: 1fr;
          }

          .cf-workspace-sidebar {
            border-right: none;
            border-bottom: 1px solid rgba(212, 174, 96, 0.12);
          }

          .cf-footer-cols {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .cf-footer-base-row {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .cf-frame-body {
            grid-template-columns: 1fr;
          }

          .cf-mock-sidebar {
            display: none;
          }

          .cf-sec-heading-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* Floating Scroll Progress Bar */}
      <div className="cf-scroll-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Custom Floating Cursor */}
      <div
        className={`cf-custom-cursor ${cursorHovered ? "hovered" : ""}`}
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />

      {/* Floating Reaction Emojis */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="cf-floating-heart"
          style={{ left: heart.x, top: heart.y }}
        >
          {heart.emoji}
        </div>
      ))}

      {/* Ambient Orbs */}
      <div className="cf-ambient-orb-1" />
      <div className="cf-ambient-orb-2" />

      {/* ==================== 1. LUXURY NAVBAR ==================== */}
      <nav className="cf-navbar">
        <div className="cf-container">
          <div className="cf-nav-inner">
            <Link
              to="/"
              className="cf-brand"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-logo-icon-svg">
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="8" fill="#24170D" />
                  <path
                    d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z"
                    fill="#F5EFE4"
                  />
                  <path
                    d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z"
                    fill="#D8B66A"
                  />
                </svg>
              </div>
              Chatify
            </Link>

            <ul className="cf-nav-menu">
              <li>
                <a
                  href="#platform"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Platform
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="#reviews"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Reviews
                </a>
              </li>
              <li>
                <Link
                  to="/ai-chat"
                  className="cf-nav-ai-pill"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span>🤖</span> AI Assistant
                </Link>
              </li>
            </ul>

            <div className="cf-nav-buttons">
              <Link
                to="/login"
                className="cf-btn-login-nav"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="cf-btn-signup-nav"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                Get Started →
              </Link>
              <button
                className="cf-hamburger"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide Drawer */}
      <div className={`cf-mobile-menu ${mobileMenuOpen ? "active" : ""}`}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
            <div className="cf-brand">
              <div className="cf-logo-icon-svg">
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="8" fill="#24170D" />
                  <path
                    d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z"
                    fill="#F5EFE4"
                  />
                  <path
                    d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z"
                    fill="#D8B66A"
                  />
                </svg>
              </div>
              Chatify
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: "none", border: "none", fontSize: 28, color: "#F5EFE4", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 18, fontWeight: 600 }}>
            <a href="#platform" onClick={() => setMobileMenuOpen(false)} style={{ color: "#E8E1D6", textDecoration: "none" }}>Platform</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: "#E8E1D6", textDecoration: "none" }}>Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} style={{ color: "#E8E1D6", textDecoration: "none" }}>How It Works</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)} style={{ color: "#E8E1D6", textDecoration: "none" }}>Security</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} style={{ color: "#E8E1D6", textDecoration: "none" }}>Reviews</a>
            <Link to="/ai-chat" onClick={() => setMobileMenuOpen(false)} style={{ color: "#D8B66A", textDecoration: "none" }}>
              🤖 Chatify AI Assistant
            </Link>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Link
            to="/login"
            className="cf-btn-login-nav"
            style={{ textAlign: "center" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="cf-btn-signup-nav"
            style={{ textAlign: "center", justifyContent: "center" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Get Started Free →
          </Link>
        </div>
      </div>

      {/* ==================== 2. CINEMATIC HERO SECTION ==================== */}
      <header className="cf-hero">
        <canvas ref={canvasRef} className="cf-hero-particle-canvas" />

        <div className="cf-container">
          <div className="cf-hero-grid">
            {/* Left Column: Content */}
            <div
              className="cf-hero-left"
              style={{
                transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <div
                className="cf-trial-badge"
                onClick={() => navigate("/register")}
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <span className="cf-trial-circle">✦</span>
                Next-Gen AI Messaging Platform • <b>14-Day Free Trial</b>
              </div>

              {/* Dramatic Serif Headline */}
              <h1 className="cf-hero-headline">
                Connect with Clarity.
                <span className="cf-headline-accent">Collaborate with AI.</span>
                <span className="cf-typewriter-text">
                  {phrases[phraseIndex].slice(0, charIndex)}
                  <span className="cf-typewriter-cursor" />
                </span>
              </h1>

              <p className="cf-hero-desc">
                The high-performance team messaging and neural AI collaboration suite. Engineered with sub-11ms WebSockets, zero-knowledge encryption, and deep intelligence in every thread.
              </p>

              <div className="cf-hero-cta-group">
                <Link
                  to="/register"
                  className="cf-btn-primary-hero"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Get Started Free <span>→</span>
                </Link>
                <button
                  className="cf-demo-trigger"
                  onClick={() => setDemoModalOpen(true)}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span className="circ">▶</span>
                  See Live Demo
                </button>
              </div>

              {/* Hero Stat Box */}
              <div
                className="cf-hero-stats-wrap"
                onClick={() => triggerReaction("📈")}
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <div>
                  <p className="cf-stat-big-num">
                    {statCount >= 1000000 ? "1,000,000 +" : `${statCount.toLocaleString()} +`}
                  </p>
                  <p className="cf-stat-description">
                    Encrypted team messages & neural AI queries processed monthly with &lt; 11ms latency
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic ChatApp Product Visual */}
            <div
              className="cf-hero-right"
              style={{
                transform: `translate3d(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px, 0)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <div
                className="cf-product-frame"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                {/* Floating Overlap Badges */}
                <div className="cf-float-badge-1">
                  <span>🔒</span> 256-Bit E2EE Active
                </div>
                <div className="cf-float-badge-2">
                  <span>🤖</span> AI Neural Copilot 4.5
                </div>

                {/* Window Bar */}
                <div className="cf-frame-header">
                  <div className="cf-frame-dots">
                    <span style={{ background: "#ef4444" }} />
                    <span style={{ background: "#f59e0b" }} />
                    <span style={{ background: "#10b981" }} />
                  </div>
                  <div className="cf-frame-title">
                    <span>💬</span> Chatify Workspace • Engineering & AI
                  </div>
                  <div className="cf-frame-latency">
                    ● 8.4ms
                  </div>
                </div>

                {/* Mockup Body */}
                <div className="cf-frame-body">
                  {/* Left Sidebar */}
                  <div className="cf-mock-sidebar">
                    <div className="cf-mock-user-card">
                      <div className="cf-mock-avatar">⚡</div>
                      <div className="cf-mock-user-info">
                        <span className="cf-mock-user-name">Alex Rivera</span>
                        <span className="cf-mock-user-status">● Online</span>
                      </div>
                    </div>

                    <div className="cf-mock-section-title">Channels</div>
                    <div className="cf-mock-channels">
                      <div className="cf-mock-channel-item active">
                        <span>🤖 #ai-copilot</span>
                        <span className="cf-mock-badge">Active</span>
                      </div>
                      <div className="cf-mock-channel-item">
                        <span>💬 #general</span>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>12m</span>
                      </div>
                      <div className="cf-mock-channel-item">
                        <span>💻 #engineering</span>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>2h</span>
                      </div>
                      <div className="cf-mock-channel-item">
                        <span>🎨 #design-review</span>
                      </div>
                    </div>

                    <div className="cf-mock-section-title" style={{ marginTop: 8 }}>Direct Messages</div>
                    <div className="cf-mock-channels">
                      <div className="cf-mock-channel-item">
                        <span>👩‍🎨 Sarah Jenkins</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      </div>
                      <div className="cf-mock-channel-item">
                        <span>👨‍💼 David Vance</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      </div>
                    </div>
                  </div>

                  {/* Main Mockup Chat Area */}
                  <div className="cf-mock-chat-main">
                    <div className="cf-mock-chat-header">
                      <div className="cf-mock-chat-title">
                        <span>🤖</span> #ai-copilot-sync
                      </div>
                      <div className="cf-mock-e2e-pill">
                        <span>🛡️</span> Zero-Knowledge
                      </div>
                    </div>

                    {/* Mock Messages Feed */}
                    <div className="cf-mock-messages">
                      <div className="cf-mock-msg-row">
                        <div className="cf-mock-avatar" style={{ background: '#24170D', color: '#D8B66A' }}>SJ</div>
                        <div className="cf-mock-msg-bubble peer">
                          <div className="cf-mock-msg-author">Sarah Jenkins (Design Lead)</div>
                          The Chatify 2.0 component system and fluid animations are ready for production. 🚀
                        </div>
                      </div>

                      <div className="cf-mock-msg-row">
                        <div className="cf-mock-avatar" style={{ background: 'rgba(216, 182, 106, 0.2)', color: '#D8B66A' }}>🤖</div>
                        <div className="cf-mock-msg-bubble ai">
                          <div className="cf-mock-msg-author ai">⚡ Chatify AI Copilot</div>
                          Analyzed sprint backlog: 14 PRs merged with 0 regressions. Edge WebSocket latency is steady at 8.4ms.
                        </div>
                      </div>

                      <div className="cf-mock-msg-row">
                        <div className="cf-mock-msg-bubble me">
                          Incredible speed! Chatify team chat + AI assistant in one view is a game changer. 🎉
                        </div>
                      </div>
                    </div>

                    {/* Mock Input */}
                    <div className="cf-mock-input-box">
                      <span style={{ opacity: 0.6, fontSize: 13 }}>📎</span>
                      <div className="cf-mock-placeholder">Message #ai-copilot-sync...</div>
                      <div className="cf-mock-send-btn">↵</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automatic Infinite Scrolling Marquee Ticker */}
          <div className="cf-hero-marquee-wrapper">
            <div className="cf-marquee-track-container">
              <div className="cf-marquee-track">
                {[...marqueeTrack1, ...marqueeTrack1].map((item, idx) => (
                  <div key={`t1-${idx}`} className="cf-marquee-badge-card">
                    <span className="cf-marquee-badge-icon">{item.icon}</span>
                    <div>
                      <div className="cf-marquee-badge-title-row">
                        <span className="cf-marquee-badge-title">{item.title}</span>
                        <span className="cf-marquee-badge-tag">{item.tag}</span>
                      </div>
                      <span className="cf-marquee-badge-desc">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cf-marquee-track-container">
              <div className="cf-marquee-track track-right">
                {[...marqueeTrack2, ...marqueeTrack2].map((item, idx) => (
                  <div key={`t2-${idx}`} className="cf-marquee-badge-card">
                    <span className="cf-marquee-badge-icon">{item.icon}</span>
                    <div>
                      <div className="cf-marquee-badge-title-row">
                        <span className="cf-marquee-badge-title">{item.title}</span>
                        <span className="cf-marquee-badge-tag">{item.tag}</span>
                      </div>
                      <span className="cf-marquee-badge-desc">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== 3. INTERACTIVE LIVE PLATFORM & AI DEMO ==================== */}
      <section id="platform" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row">
            <div>
              <div className="cf-tag-kicker">Live Interactive Workspace</div>
              <h2 className="cf-sec-main-title">Experience Chatify & AI Live</h2>
            </div>
            <p className="cf-sec-lead-text">
              Test drive the speed, responsive design, and intelligent AI assistant below. Send a message to see real-time AI handling in action.
            </p>
          </div>

          <div className="cf-live-workspace">
            {/* Sidebar */}
            <div className="cf-workspace-sidebar">
              <div className="cf-ws-title">Chatify Channels</div>
              <div className="cf-channel-list">
                <button
                  className={`cf-channel-item ${activeTab === "ai-copilot" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("ai-copilot");
                    triggerReaction("🤖");
                  }}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span>🤖</span> ai-copilot-chat
                </button>
                <button
                  className={`cf-channel-item ${activeTab === "general" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("general");
                    triggerReaction("💬");
                  }}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span>#</span> general-chat
                </button>
                <button
                  className={`cf-channel-item ${activeTab === "engineering" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("engineering");
                    triggerReaction("💻");
                  }}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span>#</span> engineering-sync
                </button>
                <button
                  className={`cf-channel-item ${activeTab === "design" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("design");
                    triggerReaction("🎨");
                  }}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span>#</span> product-design
                </button>
              </div>

              <div className="cf-ws-title" style={{ marginTop: 12 }}>
                Active Members & AI (4)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#AFA69A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D8B66A", boxShadow: "0 0 8px #D8B66A" }} />
                  Chatify AI Copilot ⚡
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                  Sarah Jenkins (Lead)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                  Alex Rivera (Tech)
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="cf-workspace-chat">
              <div className="cf-ws-chat-top">
                <div className="cf-ws-chat-title">
                  <b>
                    {activeTab === "ai-copilot" ? "🤖 #ai-copilot-chat" : `#${activeTab}-chat`}
                  </b>
                  <span>Live WebSocket & AI Sync (8.4ms ping)</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    to="/ai-chat"
                    className="cf-nav-ai-pill"
                    style={{ padding: "6px 14px", fontSize: 12.5 }}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                  >
                    Open Full AI Chat →
                  </Link>
                  <Link
                    to="/login"
                    className="cf-btn-login-nav"
                    style={{ padding: "6px 14px", fontSize: 12.5 }}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                  >
                    Team Dashboard
                  </Link>
                </div>
              </div>

              <div className="cf-ws-chat-messages">
                {demoMessages.map((msg) => (
                  <div key={msg.id} className={`cf-chat-bubble-row ${msg.isMe ? "me" : ""}`}>
                    <div className="cf-chat-avatar">{msg.avatar}</div>
                    <div className={`cf-chat-bubble-body ${msg.isAi ? "is-ai-bubble" : ""}`}>
                      <div className="cf-chat-meta">
                        {msg.sender} • {msg.time}
                      </div>
                      <p className="cf-chat-text">{msg.text}</p>
                      {msg.reactions && (
                        <div className="cf-reactions-tray">
                          {msg.reactions.map((r, i) => (
                            <span
                              key={i}
                              className="cf-reaction-tag"
                              onClick={() => triggerReaction(r.split(" ")[0])}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isTyping && (
                <div className="cf-typing-bar">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D8B66A" }} />
                  Chatify AI is generating an encrypted response...
                </div>
              )}

              <form onSubmit={handleSendDemoMessage} className="cf-ws-chat-input-row">
                <input
                  type="text"
                  placeholder={
                    activeTab === "ai-copilot"
                      ? "Ask Chatify AI anything or type a prompt..."
                      : `Message #${activeTab}-chat (Type and press Enter)...`
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="cf-ws-input"
                />
                <button
                  type="submit"
                  className="cf-ws-send-btn"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Send ↵
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 4. FEATURE PILLARS ==================== */}
      <section id="features" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row">
            <div>
              <div className="cf-tag-kicker">Architecture & Toolkit</div>
              <h2 className="cf-sec-main-title">Built for High-Velocity Teams & AI</h2>
            </div>
            <p className="cf-sec-lead-text">
              Engineered from the ground up to eliminate noise, accelerate decisions, and ensure uninterrupted data sovereignty.
            </p>
          </div>

          <div className="cf-pillars-grid">
            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">◇</div>
              <h3>Group Channels & DMs</h3>
              <p>Structure conversations with nested threads, topic pins, and customizable notification schedules.</p>
            </div>

            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">🤖</div>
              <h3>Chatify AI Neural Assistant</h3>
              <p>Summon intelligent thread summaries, query search archives, generate action items, and automate standups.</p>
            </div>

            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">⚡</div>
              <h3>Sub-11ms WebSocket Engine</h3>
              <p>Instantaneous messaging, typing indicators, read confirmations, and active presence tracking.</p>
            </div>

            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">🔒</div>
              <h3>End-to-End Encryption</h3>
              <p>Client-side cryptographic handshakes safeguard every packet from unauthorized inspection.</p>
            </div>

            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">📁</div>
              <h3>Media Vault & Attachments</h3>
              <p>Drag and drop images, PDFs, code archives, and audio voice clips with instant in-line previewing.</p>
            </div>

            <div
              className="cf-pillar-box"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">📱</div>
              <h3>Multi-Device Real-Time Sync</h3>
              <p>Seamlessly shift from desktop workstations to mobile apps without losing your cursor or drafts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 5. HOW IT WORKS & SECURITY ==================== */}
      <section id="how" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row">
            <div>
              <div className="cf-tag-kicker">Workflow Blueprint</div>
              <h2 className="cf-sec-main-title">Up and Running in 3 Steps</h2>
            </div>
            <p className="cf-sec-lead-text">
              Onboard your entire department or startup in less than two minutes with zero DevOps overhead.
            </p>
          </div>

          <div className="cf-steps-row">
            {steps.map((step, idx) => (
              <div
                key={step.num}
                className={`cf-step-card ${activeStep === idx ? "active" : ""}`}
                onClick={() => {
                  setActiveStep(idx);
                  triggerReaction(step.icon);
                }}
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <div className="cf-step-number">{step.num}</div>
                <span className="cf-step-pill-tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Dark Spec Security Card */}
          <div id="security" className="cf-dark-spec-card">
            <div>
              <h3>Military-Grade Security & Zero Tracking</h3>
              <p>
                Zero third-party trackers, zero advertising cookies, and zero server logging of decrypted message payloads. Chatify follows the highest international data protection protocols.
              </p>
              <Link
                to="/register"
                className="cf-btn-primary-hero"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                Create Encrypted Workspace →
              </Link>
            </div>

            <div className="cf-dark-metrics-grid">
              <div className="cf-metric-tile">
                <div className="cf-metric-big">99.99%</div>
                <div className="cf-metric-sub">Uptime SLA</div>
              </div>
              <div className="cf-metric-tile">
                <div className="cf-metric-big">&lt; 11ms</div>
                <div className="cf-metric-sub">Edge Latency</div>
              </div>
              <div className="cf-metric-tile">
                <div className="cf-metric-big">256-bit</div>
                <div className="cf-metric-sub">AES Encryption</div>
              </div>
              <div className="cf-metric-tile">
                <div className="cf-metric-big">100%</div>
                <div className="cf-metric-sub">Data Ownership</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. TESTIMONIALS ==================== */}
      <section id="reviews" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row">
            <div>
              <div className="cf-tag-kicker">Verified Customer Stories</div>
              <h2 className="cf-sec-main-title">Trusted by Modern Builders</h2>
            </div>
            <p className="cf-sec-lead-text">
              Join over 70,000 product engineers and distributed teams who rely on Chatify daily.
            </p>
          </div>

          <div className="cf-reviews-grid">
            <div
              className="cf-review-card"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div>
                <div className="cf-review-stars">★★★★★</div>
                <p className="cf-review-quote">
                  "Chatify cut our internal communication noise by half. The combination of team chat with instant AI summarization makes every other tool feel obsolete."
                </p>
              </div>
              <div className="cf-reviewer-info">
                <div className="cf-reviewer-avatar">👩‍💼</div>
                <div className="cf-reviewer-meta">
                  <b>Elena Rostova</b>
                  <span>VP of Product, Studio Meridian</span>
                </div>
              </div>
            </div>

            <div
              className="cf-review-card"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div>
                <div className="cf-review-stars">★★★★★</div>
                <p className="cf-review-quote">
                  "The end-to-end encryption, built-in AI Copilot, and fast WebSockets are simply unmatched. We moved our entire engineering squad over to Chatify in an afternoon."
                </p>
              </div>
              <div className="cf-reviewer-info">
                <div className="cf-reviewer-avatar">👨‍💻</div>
                <div className="cf-reviewer-meta">
                  <b>Marcus Chen</b>
                  <span>Principal Architect, CloudFlow Labs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 7. FINAL FULL-WIDTH CTA BANNER ==================== */}
      <section className="cf-cta-section">
        <div className="cf-container">
          <h2 className="cf-cta-title">Ready to Experience Pure Team & AI Flow?</h2>
          <p className="cf-cta-subtext">
            Start your 14-day unrestricted trial today on Chatify. Includes unlimited group channels, AI Copilot, and guaranteed privacy.
          </p>
          <div className="cf-cta-actions">
            <Link
              to="/register"
              className="cf-btn-cta-white"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              Get Started Free →
            </Link>
            <Link
              to="/login"
              className="cf-btn-cta-outline"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              Sign In to Existing Team
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== 8. SITE FOOTER ==================== */}
      <footer className="cf-site-footer">
        <div className="cf-container">
          <div className="cf-footer-cols">
            <div className="cf-footer-brand-info">
              <div
                className="cf-brand"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <div className="cf-logo-icon-svg">
                  <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                    <rect width="36" height="36" rx="8" fill="#24170D" />
                    <path
                      d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z"
                      fill="#F5EFE4"
                    />
                    <path
                      d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z"
                      fill="#D8B66A"
                    />
                  </svg>
                </div>
                Chatify
              </div>
              <p>
                Pixel-precise team messaging, AI intelligence, and collaboration suite designed for high-performance distributed organizations.
              </p>
            </div>

            <div className="cf-footer-col">
              <h5>Product</h5>
              <ul>
                <li><a href="#platform">Live Platform</a></li>
                <li><Link to="/ai-chat">AI Assistant & Copilot</Link></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How It Works</a></li>
              </ul>
            </div>

            <div className="cf-footer-col">
              <h5>Resources</h5>
              <ul>
                <li><Link to="/help">Help Center & Support</Link></li>
                <li><Link to="/about">About Chatify</Link></li>
                <li><Link to="/privacy">Privacy & Security</Link></li>
              </ul>
            </div>

            <div className="cf-footer-col">
              <h5>Account</h5>
              <ul>
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Create Workspace</Link></li>
                <li><Link to="/forgot-password">Reset Password</Link></li>
              </ul>
            </div>
          </div>

          <div className="cf-footer-base-row">
            <div>© {new Date().getFullYear()} Chatify Inc. All rights reserved.</div>
            <div style={{ display: "flex", gap: 24 }}>
              <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</Link>
              <Link to="/help" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</Link>
              <Link to="/about" style={{ color: "inherit", textDecoration: "none" }}>Security Whitepaper</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== DEMO MODAL PREVIEW ==================== */}
      {demoModalOpen && (
        <div className="cf-modal-overlay" onClick={() => setDemoModalOpen(false)}>
          <div className="cf-modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="cf-modal-x" onClick={() => setDemoModalOpen(false)}>
              ✕
            </button>
            <div className="cf-tag-kicker" style={{ marginBottom: 12 }}>Product Tour</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#F5EFE4", marginBottom: 14 }}>
              Welcome to Chatify & AI Copilot
            </h2>
            <p style={{ fontSize: 15, color: "#AFA69A", lineHeight: 1.65, marginBottom: 28 }}>
              Experience how Chatify combines team messaging with real-time AI intelligence into calm, structured, and encrypted clarity. Test live messaging in the interactive workspace section below or start your free workspace.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link
                to="/register"
                className="cf-btn-primary-hero"
                onClick={() => setDemoModalOpen(false)}
              >
                Create Free Account
              </Link>
              <button
                className="cf-btn-login-nav"
                onClick={() => {
                  setDemoModalOpen(false);
                  const el = document.getElementById("platform");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Scroll to Live Demo ↓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}