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

  // Typewriter animated phrases
  const phrases = ["Team Messaging", "AI Intelligence", "Encrypted Threads", "Global Channels"];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Demo messages state
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
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}`;
      setScrollProgress(Number(scroll));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Typewriter Loop
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const speed = isDeleting ? 45 : 110;

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < currentPhrase.length) {
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1600);
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
      x: (clientX - centerX) / 40,
      y: (clientY - centerY) / 40,
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

    const particles = Array.from({ length: 38 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.4 ? "rgba(224, 82, 28, 0.4)" : "rgba(20, 18, 15, 0.2)",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles with delicate drafting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(20, 18, 15, ${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particle positions
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
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Floating reaction animation
  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1800);
  };

  // Animated counter for stat
  useEffect(() => {
    let start = 0;
    const end = 1000000;
    const duration = 2200;
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

  // Intersection observer for staggered scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cf-in-view");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".cf-anim");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleSendDemoMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "You",
      role: "Product Lead",
      text: inputMessage.trim(),
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* ---------- GLOBAL RESET & FULLSCREEN CANVAS ---------- */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          width: 100%;
          min-height: 100%;
          background: #efece4;
          color: #14120f;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .cf-app-root {
          width: 100%;
          min-height: 100vh;
          background: #efece4;
          color: #14120f;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Top Orange Scroll Progress Bar */
        .cf-scroll-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3.5px;
          background: linear-gradient(90deg, #e0521c, #ff7a3c);
          z-index: 9999;
          box-shadow: 0 0 10px rgba(224, 82, 28, 0.6);
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
          border: 1.5px solid rgba(224, 82, 28, 0.45);
          background: rgba(224, 82, 28, 0.05);
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
          border-color: #e0521c;
          background: rgba(224, 82, 28, 0.12);
        }

        /* Ambient floating blurred backdrop orbs */
        .cf-ambient-orb-1 {
          position: absolute;
          top: 100px;
          left: -80px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 82, 28, 0.15) 0%, rgba(224, 82, 28, 0) 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
          animation: floatOrb 14s ease-in-out infinite alternate;
        }

        .cf-ambient-orb-2 {
          position: absolute;
          top: 320px;
          right: -60px;
          width: 540px;
          height: 540px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20, 18, 15, 0.09) 0%, rgba(20, 18, 15, 0) 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
          animation: floatOrb2 16s ease-in-out infinite alternate;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.15); }
          100% { transform: translate(20px, 80px) scale(0.95); }
        }

        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 60px) scale(1.12); }
          100% { transform: translate(-30px, 20px) scale(1); }
        }

        .cf-container {
          width: 100%;
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 48px;
          position: relative;
          z-index: 2;
        }

        /* Canvas Particle Field in Hero */
        .cf-hero-particle-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        /* ---------- ENHANCED ANIMATIONS & SHADOWS ---------- */
        .cf-anim {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .cf-anim.cf-in-view {
          opacity: 1;
          transform: translateY(0);
        }

        .cf-delay-1 { transition-delay: 0.1s; }
        .cf-delay-2 { transition-delay: 0.2s; }
        .cf-delay-3 { transition-delay: 0.3s; }
        .cf-delay-4 { transition-delay: 0.4s; }

        /* Floating elements animation suite */
        @keyframes floatHeroCard {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }

        @keyframes floatBadge1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(5px); }
        }

        @keyframes floatBadge2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-12px) translateX(-6px); }
        }

        @keyframes floatBadge3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 12px 32px rgba(224, 82, 28, 0.4), 0 0 0 0 rgba(224, 82, 28, 0.4);
          }
          50% {
            box-shadow: 0 20px 52px rgba(224, 82, 28, 0.7), 0 0 0 14px rgba(224, 82, 28, 0);
          }
        }

        @keyframes waveFloat {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }

        @keyframes burstSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes liveDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }

        @keyframes popFloatingHeart {
          0% { opacity: 1; transform: translateY(0) scale(0.6); }
          50% { opacity: 1; transform: translateY(-60px) scale(1.25); }
          100% { opacity: 0; transform: translateY(-120px) scale(0.9); }
        }

        @keyframes soundWaveBar {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Floating reaction particles */
        .cf-floating-pop {
          position: fixed;
          bottom: 120px;
          right: 80px;
          font-size: 32px;
          pointer-events: none;
          z-index: 3000;
          animation: popFloatingHeart 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ---------- PROFESSIONAL CHATIFY LOGO ICON ---------- */
        .cf-logo-icon-svg {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 12px rgba(224, 82, 28, 0.4));
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-brand:hover .cf-logo-icon-svg {
          transform: scale(1.15) rotate(8deg);
        }

        /* ---------- NAVIGATION ---------- */
        .cf-navbar {
          position: sticky;
          top: 0;
          width: 100%;
          height: 102px;
          background: rgba(239, 236, 228, 0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(20, 18, 15, 0.08);
          z-index: 1000;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }
        .cf-navbar:hover {
          background: rgba(239, 236, 228, 0.98);
        }

        .cf-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .cf-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 800;
          color: #14120f;
          letter-spacing: -0.03em;
          text-decoration: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-brand:hover {
          transform: translateY(-2px);
        }

        .cf-nav-menu {
          display: flex;
          align-items: center;
          gap: 36px;
          list-style: none;
        }
        .cf-nav-menu a {
          font-size: 15px;
          font-weight: 600;
          color: #14120f;
          text-decoration: none;
          position: relative;
          padding: 6px 0;
          transition: color 0.2s ease;
        }
        .cf-nav-menu a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: #e0521c;
          border-radius: 2px;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-nav-menu a:hover {
          color: #e0521c;
        }
        .cf-nav-menu a:hover::after {
          width: 100%;
        }

        .cf-nav-ai-pill {
          background: #14120f;
          color: #ffffff !important;
          padding: 7px 16px !important;
          border-radius: 999px;
          font-size: 13.5px !important;
          font-weight: 700 !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(20,18,15,0.22);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cf-nav-ai-pill::after { display: none !important; }
        .cf-nav-ai-pill:hover {
          background: #e0521c !important;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 22px rgba(224,82,28,0.45);
        }

        .cf-nav-buttons {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cf-btn-login-nav {
          background: transparent;
          color: #14120f;
          border: 1.5px solid rgba(20, 18, 15, 0.22);
          border-radius: 999px;
          padding: 11px 26px;
          font-size: 14.5px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .cf-btn-login-nav:hover {
          background: rgba(20, 18, 15, 0.06);
          border-color: #14120f;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }

        .cf-btn-signup-nav {
          background: #14120f;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 14.5px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(20, 18, 15, 0.3);
          position: relative;
          overflow: hidden;
        }
        .cf-btn-signup-nav:hover {
          background: #e0521c;
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 30px rgba(224, 82, 28, 0.45);
        }

        .cf-hamburger {
          display: none;
          width: 32px;
          height: 22px;
          flex-direction: column;
          justify-content: space-between;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1100;
        }
        .cf-hamburger span {
          width: 100%;
          height: 2.2px;
          background: #14120f;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* Mobile Drawer */
        .cf-mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(239, 236, 228, 0.98);
          backdrop-filter: blur(20px);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 32px;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-mobile-menu.active {
          transform: translateX(0);
        }

        /* ---------- HERO SECTION ---------- */
        .cf-hero {
          position: relative;
          padding: 24px 0 32px;
          border-bottom: 1px solid rgba(20, 18, 15, 0.08);
          overflow: hidden;
        }

        .cf-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 32px;
          align-items: flex-start;
          position: relative;
          min-height: auto;
          margin-bottom: 32px;
          padding-bottom: 12px;
        }

        /* Hero Left Column */
        .cf-hero-left {
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 5;
        }

        .cf-trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #55524a;
          margin-bottom: 18px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
        }
        .cf-trial-badge:hover {
          transform: translateX(6px);
        }
        .cf-trial-line {
          width: 32px;
          height: 1.5px;
          background: #14120f;
          transition: width 0.3s ease;
        }
        .cf-trial-badge:hover .cf-trial-line {
          width: 44px;
          background: #e0521c;
        }
        .cf-trial-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid #14120f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-trial-badge:hover .cf-trial-circle {
          background: #e0521c;
          border-color: #e0521c;
          color: #ffffff;
          transform: rotate(45deg);
        }
        .cf-trial-badge b {
          color: #14120f;
          font-weight: 800;
        }

        /* Typewriter Headline */
        .cf-hero-headline {
          font-size: 70px;
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -0.04em;
          color: #14120f;
          margin-bottom: 20px;
          min-height: 120px;
        }
        .cf-typewriter-text {
          font-weight: 800;
          display: block;
          color: #14120f;
          position: relative;
        }
        .cf-typewriter-cursor {
          display: inline-block;
          width: 4px;
          height: 0.85em;
          background: #e0521c;
          margin-left: 6px;
          vertical-align: middle;
          animation: cursorBlink 0.9s infinite;
        }

        .cf-hero-cta-group {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .cf-btn-primary-hero {
          background: #14120f;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          padding: 18px 42px;
          font-size: 16px;
          font-weight: 800;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 12px 32px rgba(20, 18, 15, 0.3);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .cf-btn-primary-hero:hover {
          background: #e0521c;
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 18px 44px rgba(224, 82, 28, 0.48);
        }

        .cf-demo-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #14120f;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 999px;
          transition: all 0.25s ease;
        }
        .cf-demo-trigger span.circ {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #14120f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          background: #efece4;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .cf-demo-trigger:hover span.circ {
          background: #14120f;
          color: #efece4;
          transform: scale(1.15) rotate(15deg);
        }
        .cf-demo-trigger u {
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .cf-demo-trigger:hover u {
          color: #e0521c;
        }

        /* Hero Stat Box & Pulsing Waveform */
        .cf-hero-stats-wrap {
          position: relative;
          width: 300px;
          margin-top: 14px;
        }
        .cf-stat-box {
          background: #a49a89;
          border-radius: 8px;
          padding: 26px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .cf-stat-box:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 52px rgba(0, 0, 0, 0.18);
        }
        .cf-stat-big-num {
          font-size: 34px;
          font-weight: 800;
          color: #14120f;
          margin-bottom: 6px;
          letter-spacing: -0.03em;
        }
        .cf-stat-description {
          font-size: 13.5px;
          color: #2b2822;
          font-weight: 600;
          line-height: 1.45;
        }

        .cf-stat-pill-floating {
          position: absolute;
          left: 0;
          bottom: -24px;
          width: 100%;
          height: 48px;
          background: #f7f5ef;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 20px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(20, 18, 15, 0.08);
          z-index: 6;
          animation: waveFloat 4s ease-in-out infinite;
        }
        .cf-stat-pill-floating .dots {
          font-size: 13.5px;
          font-weight: 800;
          color: #14120f;
        }
        .cf-audio-bars {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 20px;
        }
        .cf-audio-bar {
          width: 3.5px;
          background: #e0521c;
          border-radius: 2px;
          animation: soundWaveBar 1.2s ease-in-out infinite alternate;
        }
        .cf-audio-bar:nth-child(1) { animation-delay: 0.1s; height: 6px; }
        .cf-audio-bar:nth-child(2) { animation-delay: 0.3s; height: 16px; }
        .cf-audio-bar:nth-child(3) { animation-delay: 0.2s; height: 11px; }
        .cf-audio-bar:nth-child(4) { animation-delay: 0.45s; height: 18px; }
        .cf-audio-bar:nth-child(5) { animation-delay: 0.15s; height: 8px; }

        /* Hero Right Visual Cluster with Parallax & Floating */
        .cf-hero-right {
          position: relative;
          height: 440px;
          width: 100%;
        }

        .cf-downloads-badge {
          position: absolute;
          right: 36px;
          top: 0;
          text-align: right;
          z-index: 3;
          animation: floatBadge1 7s ease-in-out infinite;
        }
        .cf-downloads-badge .num {
          font-size: 30px;
          font-weight: 800;
          color: #14120f;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .cf-downloads-badge .lbl {
          font-size: 13px;
          color: #55524a;
          margin-top: 3px;
          font-weight: 700;
        }

        /* Tip Matrix Card */
        .cf-tip-matrix {
          position: absolute;
          left: 10px;
          top: 20px;
          width: 144px;
          height: 144px;
          background: #a49a89;
          border-radius: 8px;
          padding: 18px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
          z-index: 2;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          animation: floatBadge2 8s ease-in-out infinite;
        }
        .cf-tip-matrix:hover {
          transform: translateY(-8px) rotate(-2.5deg) scale(1.04);
          box-shadow: 0 26px 54px rgba(0, 0, 0, 0.22);
        }
        .cf-tip-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 5px;
          width: 80px;
          margin-bottom: 20px;
        }
        .cf-tip-grid span {
          width: 6.5px;
          height: 6.5px;
          background: #14120f;
          opacity: 0.6;
          border-radius: 1.5px;
          transition: all 0.25s ease;
        }
        .cf-tip-matrix:hover .cf-tip-grid span {
          background: #e0521c;
          opacity: 1;
          transform: scale(1.2);
        }
        .cf-tip-matrix p {
          font-size: 13px;
          line-height: 1.35;
          color: #14120f;
          font-weight: 800;
        }

        /* Radiant Orange Action Button */
        .cf-orange-orb {
          position: absolute;
          left: 120px;
          top: -8px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #e0521c;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 8;
          box-shadow: 0 14px 36px rgba(224, 82, 28, 0.45);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .cf-orange-orb:hover {
          transform: scale(1.18) rotate(20deg);
          background: #ff5a22;
        }

        /* Central Floating Photo / Live Chat Showcase Card */
        .cf-photo-card {
          position: absolute;
          left: 160px;
          top: 24px;
          width: 290px;
          height: 310px;
          border-radius: 8px;
          background: #dcd6c7;
          border: 1px solid rgba(20, 18, 15, 0.12);
          box-shadow: 0 28px 70px -15px rgba(0, 0, 0, 0.26);
          z-index: 5;
          overflow: hidden;
          animation: floatHeroCard 6.5s ease-in-out infinite;
          transition: box-shadow 0.4s ease, transform 0.4s ease;
        }
        .cf-photo-card:hover {
          box-shadow: 0 42px 90px -15px rgba(0, 0, 0, 0.4);
          transform: translateY(-8px) scale(1.02);
        }
        .cf-photo-bg {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #c5baa7 0%, #a49a89 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
        }
        .cf-live-badge {
          align-self: flex-start;
          background: rgba(20, 18, 15, 0.92);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.22);
        }
        .cf-live-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          display: block;
          animation: liveDotPulse 2s ease-in-out infinite;
        }
        .cf-floating-chat-bubble {
          background: #efece4;
          padding: 14px 16px;
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
          font-size: 12.5px;
          line-height: 1.4;
          color: #14120f;
          border: 1px solid rgba(20, 18, 15, 0.08);
          transition: transform 0.25s ease;
          cursor: pointer;
        }
        .cf-floating-chat-bubble:hover {
          transform: translateY(-3px) scale(1.02);
        }
        .cf-floating-chat-bubble b {
          display: block;
          margin-bottom: 3px;
          font-size: 11.5px;
          color: #e0521c;
          font-weight: 800;
        }

        /* Floating reaction mini-pill */
        .cf-mini-reaction-pill {
          position: absolute;
          right: -12px;
          top: 120px;
          background: #ffffff;
          border: 1px solid rgba(20,18,15,0.12);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 8px 24px rgba(0,0,0,0.14);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 7;
          animation: floatBadge3 5.5s ease-in-out infinite;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .cf-mini-reaction-pill:hover {
          transform: scale(1.18);
          background: #14120f;
          color: #ffffff;
        }

        /* Right Panel Behind */
        .cf-backdrop-panel {
          position: absolute;
          right: 36px;
          top: 110px;
          width: 96px;
          height: 190px;
          background: #d6cfbe;
          border-radius: 8px;
          z-index: 1;
        }

        /* Sunburst Vector */
        .cf-sunburst {
          position: absolute;
          left: 10px;
          bottom: 40px;
          width: 88px;
          height: 88px;
          z-index: 2;
          animation: burstSpin 28s linear infinite;
        }

        .cf-down-badge {
          position: absolute;
          left: 130px;
          bottom: 66px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #14120f;
          background: #efece4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          z-index: 6;
          box-shadow: 0 6px 14px rgba(0,0,0,0.08);
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .cf-down-badge:hover {
          transform: scale(1.2) translateY(3px);
          background: #14120f;
          color: #ffffff;
        }

        /* Connecting Drafting Lines with glowing flow pulse */
        .cf-draft-line {
          position: absolute;
          background: #14120f;
          opacity: 0.8;
          pointer-events: none;
        }

        /* Auto-Scrolling Hero Feature Marquee Ticker */
        .cf-hero-marquee-wrapper {
          margin-top: 32px;
          margin-bottom: 20px;
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 6px 0 10px;
          mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 94%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cf-marquee-track-container {
          overflow: hidden;
          width: 100%;
          display: flex;
        }

        .cf-marquee-track {
          display: flex;
          gap: 12px;
          width: max-content;
          will-change: transform;
        }

        .cf-marquee-track.track-left {
          animation: scrollMarqueeLeft 38s linear infinite;
        }

        .cf-marquee-track.track-right {
          animation: scrollMarqueeRight 42s linear infinite;
        }

        @keyframes scrollMarqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes scrollMarqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .cf-marquee-badge-card {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(20, 18, 15, 0.09);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.035);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }

        .cf-marquee-badge-card:hover {
          background: #ffffff;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
          border-color: rgba(224, 82, 28, 0.45);
        }

        .cf-marquee-badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(20, 18, 15, 0.05);
          font-size: 14px;
          transition: transform 0.25s ease;
        }

        .cf-marquee-badge-card:hover .cf-marquee-badge-icon {
          transform: rotate(12deg) scale(1.15);
          background: rgba(224, 82, 28, 0.12);
        }

        .cf-marquee-badge-body {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .cf-marquee-badge-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .cf-marquee-badge-title {
          font-size: 13px;
          font-weight: 700;
          color: #14120f;
        }

        .cf-marquee-badge-tag {
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(224, 82, 28, 0.1);
          color: #e0521c;
          border: 1px solid rgba(224, 82, 28, 0.2);
        }

        .cf-marquee-badge-desc {
          font-size: 11.5px;
          font-weight: 500;
          color: rgba(20, 18, 15, 0.6);
        }

        /* Hero Foot Features Row */
        .cf-hero-foot-row {
          margin-top: 18px;
          padding-top: 24px;
          border-top: 1px solid rgba(20, 18, 15, 0.1);
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 28px;
        }
        .cf-hero-feat-item {
          padding: 24px;
          border-radius: 12px;
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(20,18,15,0.08);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cf-hero-feat-item:hover {
          background: #ffffff;
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.09);
        }
        .cf-hero-feat-item h4 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 800;
          color: #14120f;
          margin-bottom: 10px;
        }
        .cf-hero-feat-item p {
          font-size: 14.5px;
          color: #55524a;
          line-height: 1.6;
        }
        .cf-ring-symbol {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #14120f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: bold;
          flex-shrink: 0;
          background: #f7f5ef;
          transition: all 0.3s ease;
        }
        .cf-hero-feat-item:hover .cf-ring-symbol {
          background: #e0521c;
          border-color: #e0521c;
          color: #ffffff;
          transform: scale(1.15) rotate(10deg);
        }

        /* ---------- SECTION 2: INTERACTIVE LIVE PLATFORM & AI DEMO ---------- */
        .cf-section {
          padding: 108px 0;
          border-bottom: 1px solid rgba(20, 18, 15, 0.08);
          position: relative;
        }

        .cf-sec-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
          gap: 32px;
          flex-wrap: wrap;
        }

        .cf-tag-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #e0521c;
          margin-bottom: 12px;
        }
        .cf-tag-kicker::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e0521c;
          animation: liveDotPulse 2s infinite;
        }

        .cf-sec-main-title {
          font-size: 46px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.08;
          color: #14120f;
        }

        .cf-sec-lead-text {
          font-size: 16.5px;
          color: #55524a;
          max-width: 480px;
          line-height: 1.6;
        }

        /* Interactive Live Workspace Card */
        .cf-live-workspace {
          background: #ffffff;
          border: 1px solid rgba(20, 18, 15, 0.12);
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: 300px 1fr;
          min-height: 540px;
          overflow: hidden;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .cf-live-workspace:hover {
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.16);
        }

        .cf-workspace-sidebar {
          background: #f7f5ef;
          border-right: 1px solid rgba(20, 18, 15, 0.08);
          padding: 30px 22px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .cf-ws-title {
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #7d7768;
          padding-left: 10px;
        }
        .cf-channel-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .cf-channel-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          border: none;
          background: none;
          font-size: 14.5px;
          font-weight: 700;
          color: #4a463c;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }
        .cf-channel-item:hover {
          background: rgba(20, 18, 15, 0.06);
          color: #14120f;
          transform: translateX(4px);
        }
        .cf-channel-item.active {
          background: #14120f;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(20, 18, 15, 0.25);
        }
        .cf-channel-item.ai-channel {
          background: linear-gradient(135deg, rgba(224,82,28,0.12), rgba(20,18,15,0.06));
          border: 1px solid rgba(224,82,28,0.25);
          color: #14120f;
        }
        .cf-channel-item.ai-channel.active {
          background: linear-gradient(135deg, #e0521c, #14120f);
          color: #ffffff;
          border-color: transparent;
        }

        .cf-workspace-chat {
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }
        .cf-ws-chat-top {
          padding: 22px 30px;
          border-bottom: 1px solid rgba(20, 18, 15, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
        }
        .cf-ws-chat-title b {
          font-size: 17px;
          font-weight: 800;
          color: #14120f;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cf-ws-chat-title span {
          font-size: 12.5px;
          color: #10b981;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cf-ws-chat-title span::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: liveDotPulse 2s infinite;
        }

        .cf-ws-chat-messages {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 350px;
        }
        .cf-chat-bubble-row {
          display: flex;
          gap: 14px;
          max-width: 84%;
          animation: bubbleAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bubbleAppear {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cf-chat-bubble-row.me {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .cf-chat-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #efece4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          border: 1px solid rgba(20, 18, 15, 0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .cf-chat-bubble-body {
          background: #f7f5ef;
          padding: 15px 20px;
          border-radius: 12px;
          border: 1px solid rgba(20, 18, 15, 0.05);
          box-shadow: 0 3px 12px rgba(0,0,0,0.04);
          position: relative;
        }
        .cf-chat-bubble-body.is-ai-bubble {
          background: linear-gradient(145deg, #fdf8f5 0%, #f7f0eb 100%);
          border: 1.5px solid rgba(224, 82, 28, 0.22);
          box-shadow: 0 6px 18px rgba(224, 82, 28, 0.09);
        }
        .cf-chat-bubble-row.me .cf-chat-bubble-body {
          background: #14120f;
          color: #ffffff;
        }
        .cf-chat-meta {
          font-size: 11.5px;
          font-weight: 700;
          color: #7d7768;
          margin-bottom: 4px;
        }
        .cf-chat-bubble-row.me .cf-chat-meta {
          color: #a49a89;
          text-align: right;
        }
        .cf-chat-text {
          font-size: 14.5px;
          line-height: 1.5;
        }
        .cf-reactions-tray {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .cf-reaction-tag {
          font-size: 11px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(20,18,15,0.08);
          padding: 2px 8px;
          border-radius: 999px;
          color: #14120f;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .cf-reaction-tag:hover {
          transform: scale(1.18);
          background: #ffffff;
        }
        .cf-chat-bubble-row.me .cf-reaction-tag {
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          border-color: rgba(255,255,255,0.2);
        }

        .cf-typing-bar {
          font-size: 13px;
          color: #7d7768;
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 30px;
        }

        .cf-ws-chat-input-row {
          padding: 22px 30px;
          border-top: 1px solid rgba(20, 18, 15, 0.08);
          display: flex;
          gap: 14px;
          background: #ffffff;
        }
        .cf-ws-input {
          flex: 1;
          border: 1.5px solid rgba(20, 18, 15, 0.16);
          border-radius: 999px;
          padding: 14px 24px;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          transition: all 0.25s ease;
          background: #fbf9f5;
        }
        .cf-ws-input:focus {
          border-color: #14120f;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(20, 18, 15, 0.08);
        }
        .cf-ws-send-btn {
          background: #14120f;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 6px 16px rgba(20, 18, 15, 0.25);
        }
        .cf-ws-send-btn:hover {
          background: #e0521c;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(224, 82, 28, 0.4);
        }

        /* ---------- SECTION 3: 6 CORE FEATURE PILLARS ---------- */
        .cf-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 26px;
          margin-top: 28px;
        }
        .cf-pillar-box {
          background: #ffffff;
          border: 1px solid rgba(20, 18, 15, 0.1);
          border-radius: 14px;
          padding: 38px 32px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.04);
        }
        .cf-pillar-box:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 65px rgba(0, 0, 0, 0.12);
          border-color: #14120f;
        }
        .cf-pillar-badge-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1.5px solid #14120f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 24px;
          background: #f7f5ef;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          transition: all 0.35s ease;
        }
        .cf-pillar-box:hover .cf-pillar-badge-icon {
          transform: scale(1.18) rotate(12deg);
          background: #e0521c;
          border-color: #e0521c;
          color: #ffffff;
        }
        .cf-pillar-box h3 {
          font-size: 21px;
          font-weight: 800;
          color: #14120f;
          margin-bottom: 12px;
          letter-spacing: -0.015em;
        }
        .cf-pillar-box p {
          font-size: 14.5px;
          color: #55524a;
          line-height: 1.65;
        }

        /* ---------- SECTION 4: 3-STEP BLUEPRINT & SPECS ---------- */
        .cf-steps-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 38px;
        }
        .cf-step-card {
          background: #ffffff;
          border: 1.5px solid rgba(20, 18, 15, 0.1);
          border-radius: 14px;
          padding: 40px 34px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          box-shadow: 0 10px 24px rgba(0,0,0,0.03);
        }
        .cf-step-card.active {
          border-color: #e0521c;
          box-shadow: 0 22px 52px rgba(224, 82, 28, 0.22);
          transform: translateY(-6px);
        }
        .cf-step-number {
          font-size: 44px;
          font-weight: 800;
          color: #a49a89;
          margin-bottom: 16px;
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .cf-step-card.active .cf-step-number {
          color: #e0521c;
        }
        .cf-step-pill-tag {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: #f4f2ec;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
          color: #14120f;
        }
        .cf-step-card h3 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .cf-step-card p {
          font-size: 14.5px;
          color: #55524a;
          line-height: 1.6;
        }

        /* Dark Spec Deep-Dive Card */
        .cf-dark-spec-card {
          background: #14120f;
          color: #efece4;
          border-radius: 16px;
          padding: 60px;
          margin-top: 52px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 52px;
          align-items: center;
          box-shadow: 0 35px 90px rgba(0,0,0,0.35);
          position: relative;
          overflow: hidden;
        }
        .cf-dark-spec-card::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -120px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(224, 82, 28, 0.28) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .cf-dark-spec-card h3 {
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 18px;
          line-height: 1.15;
          color: #ffffff;
        }
        .cf-dark-spec-card p {
          font-size: 15.5px;
          color: #b7ada0;
          line-height: 1.65;
          margin-bottom: 30px;
        }
        .cf-dark-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .cf-metric-tile {
          border-left: 2.5px solid #e0521c;
          padding-left: 20px;
          transition: transform 0.3s ease;
        }
        .cf-metric-tile:hover {
          transform: translateX(6px);
        }
        .cf-metric-big {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .cf-metric-sub {
          font-size: 13px;
          color: #a49a89;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 4px;
          font-weight: 700;
        }

        /* ---------- SECTION 5: REVIEWS ---------- */
        .cf-reviews-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-top: 28px;
        }
        .cf-review-card {
          background: #ffffff;
          border: 1px solid rgba(20, 18, 15, 0.1);
          border-radius: 14px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.05);
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .cf-review-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 28px 60px rgba(0, 0, 0, 0.12);
        }
        .cf-review-stars {
          color: #e0521c;
          font-size: 17px;
          margin-bottom: 18px;
          letter-spacing: 3px;
        }
        .cf-review-quote {
          font-size: 16.5px;
          line-height: 1.65;
          color: #14120f;
          font-weight: 600;
          margin-bottom: 30px;
        }
        .cf-reviewer-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cf-reviewer-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #efece4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .cf-reviewer-meta b {
          font-size: 16px;
          color: #14120f;
          display: block;
          font-weight: 800;
        }
        .cf-reviewer-meta span {
          font-size: 13.5px;
          color: #55524a;
        }

        /* ---------- SECTION 6: CTA BANNER ---------- */
        .cf-cta-section {
          background: linear-gradient(145deg, #14120f 0%, #2b2721 100%);
          color: #ffffff;
          padding: 104px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cf-cta-section::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 200px;
          background: radial-gradient(circle, rgba(224,82,28,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .cf-cta-title {
          font-size: 52px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          line-height: 1.08;
        }
        .cf-cta-subtext {
          font-size: 17.5px;
          color: #cfc9be;
          max-width: 600px;
          margin: 0 auto 44px;
          line-height: 1.65;
        }
        .cf-cta-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
        }
        .cf-btn-cta-white {
          background: #efece4;
          color: #14120f;
          border: none;
          border-radius: 999px;
          padding: 19px 46px;
          font-size: 16.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          box-shadow: 0 14px 36px rgba(0,0,0,0.38);
        }
        .cf-btn-cta-white:hover {
          background: #ffffff;
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 22px 54px rgba(0,0,0,0.55);
        }
        .cf-btn-cta-outline {
          background: transparent;
          color: #ffffff;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 999px;
          padding: 18px 40px;
          font-size: 16.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .cf-btn-cta-outline:hover {
          border-color: #ffffff;
          background: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }

        /* ---------- FOOTER ---------- */
        .cf-site-footer {
          padding: 88px 0 52px;
          background: #efece4;
          border-top: 1px solid rgba(20, 18, 15, 0.08);
        }
        .cf-footer-cols {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 52px;
          margin-bottom: 68px;
        }
        .cf-footer-brand-info p {
          font-size: 14.5px;
          color: #55524a;
          line-height: 1.65;
          max-width: 300px;
          margin-top: 18px;
        }
        .cf-footer-col h5 {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #14120f;
          margin-bottom: 22px;
        }
        .cf-footer-col ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cf-footer-col a {
          font-size: 14.5px;
          color: #55524a;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .cf-footer-col a:hover {
          color: #e0521c;
        }
        .cf-footer-base-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 36px;
          border-top: 1px solid rgba(20, 18, 15, 0.1);
          font-size: 13.5px;
          color: #7d7768;
          flex-wrap: wrap;
          gap: 20px;
        }

        /* Modal Preview */
        .cf-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 18, 15, 0.78);
          backdrop-filter: blur(12px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: modalFadeIn 0.3s ease;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cf-modal-window {
          background: #efece4;
          width: 660px;
          max-width: 95vw;
          border-radius: 16px;
          padding: 48px;
          position: relative;
          box-shadow: 0 35px 90px rgba(0,0,0,0.5);
          animation: modalPop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.93) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cf-modal-x {
          position: absolute;
          top: 24px;
          right: 24px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #14120f;
          transition: transform 0.2s;
        }
        .cf-modal-x:hover {
          transform: rotate(90deg);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1080px) {
          .cf-hero-headline {
            font-size: 60px;
          }
          .cf-hero-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
          .cf-hero-right {
            height: 480px;
          }
          .cf-live-workspace {
            grid-template-columns: 1fr;
          }
          .cf-pillars-grid {
            grid-template-columns: 1fr 1fr;
          }
          .cf-dark-spec-card {
            grid-template-columns: 1fr;
          }
          .cf-footer-cols {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .cf-container {
            padding: 0 20px;
          }
          .cf-navbar {
            height: 74px;
          }
          .cf-nav-menu {
            display: none;
          }
          .cf-btn-login-nav, .cf-btn-signup-nav {
            display: none;
          }
          .cf-hamburger {
            display: flex;
          }
          .cf-hero {
            padding: 36px 0 60px;
          }
          .cf-hero-headline {
            font-size: 40px;
            letter-spacing: -0.02em;
          }
          .cf-hero-subhead {
            font-size: 16px;
            line-height: 1.55;
          }
          .cf-hero-foot-row {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 40px;
            padding-top: 28px;
          }
          .cf-pillars-grid, .cf-steps-row, .cf-reviews-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .cf-footer-cols {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .cf-hero-right {
            display: none;
          }
          .cf-hero-cta-group {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            width: 100%;
          }
          .cf-btn-primary-hero, .cf-btn-secondary-hero {
            text-align: center;
            justify-content: center;
            width: 100%;
          }
          .cf-section {
            padding: 68px 0;
          }
          .cf-sec-main-title {
            font-size: 32px;
          }
          .cf-live-workspace {
            grid-template-columns: 1fr;
            border-radius: 12px;
          }
          .cf-workspace-sidebar {
            padding: 16px;
            border-right: none;
            border-bottom: 1px solid rgba(20, 18, 15, 0.08);
          }
          .cf-channel-list {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }
          .cf-channel-item {
            white-space: nowrap;
            padding: 8px 14px;
            font-size: 13.5px;
          }
          .cf-cta-title {
            font-size: 34px;
          }
          .cf-cta-subtext {
            font-size: 15.5px;
            margin-bottom: 32px;
          }
          .cf-cta-actions {
            flex-direction: column;
            width: 100%;
          }
          .cf-btn-cta-white, .cf-btn-cta-outline {
            width: 100%;
            text-align: center;
            padding: 16px 24px;
          }
          .cf-footer-base-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }

        @media (max-width: 480px) {
          .cf-container {
            padding: 0 16px;
          }
          .cf-hero-headline {
            font-size: 32px;
          }
          .cf-sec-main-title {
            font-size: 27px;
          }
          .cf-modal-window {
            padding: 28px 20px;
          }
        }
      `}</style>

      {/* Top Scroll Progress Indicator */}
      <div className="cf-scroll-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Custom Spring Cursor Follower */}
      <div
        className={`cf-custom-cursor ${cursorHovered ? "hovered" : ""}`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
      />

      {/* Floating Reaction Particles on Screen */}
      {floatingHearts.map((h) => (
        <div key={h.id} className="cf-floating-pop" style={{ left: `${h.x}%` }}>
          {h.emoji}
        </div>
      ))}

      {/* Ambient background blur lights */}
      <div className="cf-ambient-orb-1" />
      <div className="cf-ambient-orb-2" />

      {/* ==================== 1. FULL WIDTH STICKY NAVBAR ==================== */}
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
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="10" fill="#14120f" />
                  <path
                    d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z"
                    fill="#efece4"
                  />
                  <path
                    d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z"
                    fill="#e0521c"
                  />
                  <circle cx="15" cy="15" r="1.5" fill="#14120f" />
                  <circle cx="21" cy="15" r="1.5" fill="#14120f" />
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
                  How it works
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
                  <span>🤖</span> AI Chat
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
                Sign Up
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
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="10" fill="#14120f" />
                  <path d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z" fill="#efece4" />
                  <path d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z" fill="#e0521c" />
                </svg>
              </div>
              Chatify
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 20, fontWeight: 700 }}>
            <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <Link to="/ai-chat" onClick={() => setMobileMenuOpen(false)} style={{ color: "#e0521c" }}>
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
            style={{ textAlign: "center" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Sign Up & Get App
          </Link>
        </div>
      </div>

      {/* ==================== 2. HERO SECTION WITH RICH FLOAT & DEPTH ==================== */}
      <header className="cf-hero">
        <canvas ref={canvasRef} className="cf-hero-particle-canvas" />

        <div className="cf-container">
          <div className="cf-hero-grid">
            {/* Left Hero Column */}
            <div
              className="cf-hero-left"
              style={{
                transform: `translate3d(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px, 0)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <div
                className="cf-trial-badge cf-anim cf-delay-1"
                onClick={() => navigate("/register")}
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <span className="cf-trial-line" />
                <span className="cf-trial-circle">→</span>
                Explore a 14 day <b>free trial with AI copilot</b>
              </div>

              {/* Dynamic Typewriter Headline */}
              <h1 className="cf-hero-headline cf-anim cf-delay-2">
                <span className="cf-typewriter-text">
                  {phrases[phraseIndex].slice(0, charIndex)}
                  <span className="cf-typewriter-cursor" />
                </span>
                <b>Simplified</b>
              </h1>

              <div className="cf-hero-cta-group cf-anim cf-delay-3">
                <Link
                  to="/register"
                  className="cf-btn-primary-hero"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  Try for free <span>→</span>
                </Link>
                <button
                  className="cf-demo-trigger"
                  onClick={() => setDemoModalOpen(true)}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <span className="circ">▶</span>
                  <u>See demo</u>
                </button>
              </div>

              {/* Stat Box & Floating Pill */}
              <div className="cf-hero-stats-wrap cf-anim cf-delay-4">
                <div
                  className="cf-stat-box"
                  onClick={() => triggerReaction("📈")}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                >
                  <p className="cf-stat-big-num">
                    {statCount >= 1000000 ? "1 million +" : `${statCount.toLocaleString()} +`}
                  </p>
                  <p className="cf-stat-description">
                    Team messages & AI queries delivered every month with sub-11ms latency
                  </p>
                </div>
                <div className="cf-stat-pill-floating">
                  <span className="dots">⟳ Live Sync</span>
                  <div className="cf-audio-bars">
                    <div className="cf-audio-bar" />
                    <div className="cf-audio-bar" />
                    <div className="cf-audio-bar" />
                    <div className="cf-audio-bar" />
                    <div className="cf-audio-bar" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Graphic Rig with Multi-Layer Parallax */}
            <div
              className="cf-hero-right cf-anim cf-delay-2"
              style={{
                transform: `translate3d(${-mousePos.x * 0.7}px, ${-mousePos.y * 0.7}px, 0)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              <div className="cf-downloads-badge">
                <div className="num">70 k</div>
                <div className="lbl">Downloads</div>
              </div>

              {/* Precision Drafting Lines */}
              <div className="cf-draft-line" style={{ right: 80, top: 48, width: 1.5, height: 36 }} />
              <div className="cf-draft-line" style={{ right: 54, top: 84, width: 54, height: 1.5 }} />

              {/* Tip Matrix Box */}
              <div
                className="cf-tip-matrix"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <div className="cf-tip-grid">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <span key={i} />
                  ))}
                </div>
                <p>Chat + AI Copilot under one roof</p>
              </div>

              {/* Radiant Orange Action Button */}
              <div
                className="cf-orange-orb"
                onClick={() => navigate("/register")}
                title="Start Workspace Chat"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6L18 18M18 18V9M18 18H9"
                    stroke="#fff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Central Floating Photo / Live Chat Showcase Card */}
              <div
                className="cf-photo-card"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                <div className="cf-photo-bg">
                  <div className="cf-live-badge">
                    <span /> Live Chat & AI Neural Engine
                  </div>
                  <div
                    className="cf-floating-chat-bubble"
                    onClick={() => triggerReaction("💬")}
                  >
                    <b>Sarah J. (Design Lead)</b>
                    "Chatify 2.0 encrypted sprint thread created. Everyone has instant access."
                  </div>
                </div>
              </div>

              {/* Interactive Reaction Floating Pill */}
              <div
                className="cf-mini-reaction-pill"
                onClick={() => triggerReaction("🔥")}
                title="Click to react"
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                🔥 <span>18 active</span>
              </div>

              {/* Backdrop Panel */}
              <div className="cf-backdrop-panel" />

              {/* Sunburst Vector */}
              <div className="cf-sunburst">
                <svg viewBox="0 0 96 96">
                  <g stroke="#14120f" strokeWidth="1.5">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const angle = (i * Math.PI * 2) / 16;
                      const x2 = 48 + Math.cos(angle) * 44;
                      const y2 = 48 + Math.sin(angle) * 44;
                      return <line key={i} x1="48" y1="48" x2={x2} y2={y2} />;
                    })}
                  </g>
                  <circle cx="48" cy="48" r="4.5" fill="#14120f" />
                </svg>
              </div>

              <div
                className="cf-down-badge"
                onClick={() => triggerReaction("⚡")}
                onMouseEnter={() => setCursorHovered(true)}
                onMouseLeave={() => setCursorHovered(false)}
              >
                ↓
              </div>

              {/* Connecting Drafting Plumbing Lines */}
              <div className="cf-draft-line" style={{ left: 146, bottom: 84, width: 14, height: 1.5 }} />
              <div className="cf-draft-line" style={{ left: 146, bottom: 16, width: 1.5, height: 70 }} />
              <div className="cf-draft-line" style={{ left: 146, bottom: 16, width: 380, height: 1.5 }} />
              <div className="cf-draft-line" style={{ right: 80, bottom: 16, width: 1.5, height: 70 }} />
            </div>
          </div>

          {/* Automatic Infinite Scrolling Marquee Ticker */}
          <div className="cf-hero-marquee-wrapper cf-anim cf-delay-2">
            {/* Track 1: Scrolling Left */}
            <div className="cf-marquee-track-container">
              <div className="cf-marquee-track track-left">
                {[...marqueeTrack1, ...marqueeTrack1].map((item, idx) => (
                  <div
                    key={`t1-${idx}`}
                    className="cf-marquee-badge-card"
                  >
                    <span className="cf-marquee-badge-icon">{item.icon}</span>
                    <div className="cf-marquee-badge-body">
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

            {/* Track 2: Scrolling Right */}
            <div className="cf-marquee-track-container">
              <div className="cf-marquee-track track-right">
                {[...marqueeTrack2, ...marqueeTrack2].map((item, idx) => (
                  <div
                    key={`t2-${idx}`}
                    className="cf-marquee-badge-card"
                  >
                    <span className="cf-marquee-badge-icon">{item.icon}</span>
                    <div className="cf-marquee-badge-body">
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

          {/* Hero Bottom Feature Blocks */}
          <div className="cf-hero-foot-row cf-anim cf-delay-3">
            <div
              className="cf-hero-feat-item"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <h4>
                <span className="cf-ring-symbol">◇</span>Group Channels & DMs
              </h4>
              <p>Bring your whole team into organized threads with topic pins, instant polls, and custom notification rules.</p>
            </div>

            <div
              className="cf-hero-feat-item"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <h4>
                <span className="cf-ring-symbol">🤖</span>Chatify AI Copilot
              </h4>
              <p>Instant conversation summarization, action-item extraction, automated reply drafting, and deep search.</p>
            </div>

            <div
              className="cf-hero-feat-item"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <h4>
                <span className="cf-ring-symbol">◎</span>End-to-End Encrypted
              </h4>
              <p>Military-grade 256-bit cryptography ensures only your team members hold private decryption keys.</p>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== 3. INTERACTIVE LIVE PLATFORM & AI DEMO ==================== */}
      <section id="platform" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row cf-anim">
            <div>
              <div className="cf-tag-kicker">Live Interactive Workspace</div>
              <h2 className="cf-sec-main-title">Experience Chatify & AI Live</h2>
            </div>
            <p className="cf-sec-lead-text">
              Test drive the speed, responsive design, and intelligent AI assistant below. Send a message to see real-time AI handling in action.
            </p>
          </div>

          <div className="cf-live-workspace cf-anim cf-delay-2">
            {/* Sidebar */}
            <div className="cf-workspace-sidebar">
              <div className="cf-ws-title">Chatify Channels</div>
              <div className="cf-channel-list">
                <button
                  className={`cf-channel-item ai-channel ${activeTab === "ai-copilot" ? "active" : ""}`}
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
                Online Teammates & AI (4)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "#55524a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e0521c", boxShadow: "0 0 8px #e0521c" }} />
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
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e0521c" }} />
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

      {/* ==================== 4. FEATURES PILLARS ==================== */}
      <section id="features" className="cf-section">
        <div className="cf-container">
          <div className="cf-sec-heading-row cf-anim">
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
              className="cf-pillar-box cf-anim cf-delay-1"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">◇</div>
              <h3>Group Channels & DMs</h3>
              <p>Structure conversations with nested threads, topic pins, and customizable notification schedules.</p>
            </div>

            <div
              className="cf-pillar-box cf-anim cf-delay-2"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">🤖</div>
              <h3>Chatify AI Neural Assistant</h3>
              <p>Summon intelligent thread summaries, query search archives, generate action items, and automate standups.</p>
            </div>

            <div
              className="cf-pillar-box cf-anim cf-delay-3"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">⚡</div>
              <h3>Sub-11ms WebSocket Engine</h3>
              <p>Instantaneous messaging, typing indicators, read confirmations, and active presence tracking.</p>
            </div>

            <div
              className="cf-pillar-box cf-anim cf-delay-1"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">🔒</div>
              <h3>End-to-End Encryption</h3>
              <p>Client-side cryptographic handshakes safeguard every packet from unauthorized inspection.</p>
            </div>

            <div
              className="cf-pillar-box cf-anim cf-delay-2"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
            >
              <div className="cf-pillar-badge-icon">📁</div>
              <h3>Media Vault & Attachments</h3>
              <p>Drag and drop images, PDFs, code archives, and audio voice clips with instant in-line previewing.</p>
            </div>

            <div
              className="cf-pillar-box cf-anim cf-delay-3"
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
          <div className="cf-sec-heading-row cf-anim">
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
                className={`cf-step-card cf-anim cf-delay-${idx + 1} ${activeStep === idx ? "active" : ""}`}
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

          {/* Dark Spec Card */}
          <div id="security" className="cf-dark-spec-card cf-anim">
            <div>
              <h3>Military-Grade Security & Zero Tracking</h3>
              <p>
                Zero third-party trackers, zero advertising cookies, and zero server logging of decrypted message payloads. Chatify follows the highest international data protection protocols.
              </p>
              <Link
                to="/register"
                className="cf-btn-primary-hero"
                style={{ background: "#e0521c" }}
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
          <div className="cf-sec-heading-row cf-anim">
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
              className="cf-review-card cf-anim cf-delay-1"
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
              className="cf-review-card cf-anim cf-delay-2"
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
      <section className="cf-cta-section cf-anim">
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
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <rect width="36" height="36" rx="10" fill="#14120f" />
                    <path d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z" fill="#efece4" />
                    <path d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z" fill="#e0521c" />
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
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 14 }}>
              Welcome to Chatify & AI Copilot
            </h2>
            <p style={{ fontSize: 15.5, color: "#55524a", lineHeight: 1.65, marginBottom: 28 }}>
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