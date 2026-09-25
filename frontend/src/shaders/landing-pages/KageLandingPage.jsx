import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { splitTypographyProps, usePageTypography } from "./pageTypography";
import { KAGE_TYPOGRAPHY } from "./pageRecipes";

export function KageLandingPage(props) {
  const [typographyProps] = splitTypographyProps(props || {});
  const customization = usePageTypography(KAGE_TYPOGRAPHY, typographyProps);
  const navigate = useNavigate();

  const [activeChapter, setActiveChapter] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [preloaderPercent, setPreloaderPercent] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorActive, setCursorActive] = useState(false);
  const [scrolledPastNav, setScrolledPastNav] = useState(false);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);

  // Preloader sequence
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 8;
      if (progress >= 100) {
        progress = 100;
        setPreloaderPercent(100);
        clearInterval(interval);
        setTimeout(() => {
          setPreloaderDone(true);
        }, 400);
      } else {
        setPreloaderPercent(progress);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for [data-rv] reveal elements and active section tracking
  useEffect(() => {
    if (!preloaderDone) return;

    const revealElements = document.querySelectorAll("[data-rv]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      setScrolledPastNav(window.scrollY > 40);
      const sections = ["gate", "pathways", "lessons", "eternity"];
      sections.forEach((secId, index) => {
        const el = document.getElementById(secId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.2) {
            setActiveChapter(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [preloaderDone]);

  // Cursor tracking
  useEffect(() => {
    const onMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const onMouseDown = () => setCursorActive(true);
    const onMouseUp = () => setCursorActive(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    const handleInteractEnter = () => setCursorActive(true);
    const handleInteractLeave = () => setCursorActive(false);

    const interactables = document.querySelectorAll("button, a, .card, .chip, .les");
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", handleInteractEnter);
      el.addEventListener("mouseleave", handleInteractLeave);
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", handleInteractEnter);
        el.removeEventListener("mouseleave", handleInteractLeave);
      });
    };
  }, [preloaderDone]);

  // Background WebGL / Canvas ambient temple particle and moon simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = 50;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.45 - 0.15,
      alpha: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * 0.03,
      color: Math.random() > 0.4 ? "#e0231c" : "#ff5a3c",
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.fillStyle = "#05070a";
      ctx.fillRect(0, 0, width, height);

      // Vermilion Moon Ambient Glow
      const moonX = width * 0.73 + (mouseX - width / 2) * 0.025;
      const moonY = height * 0.19 + (mouseY - height / 2) * 0.025;
      const moonRadius = Math.min(width, height) * 0.15;

      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.2, moonX, moonY, moonRadius * 2.8);
      moonGlow.addColorStop(0, "rgba(224, 35, 28, 0.48)");
      moonGlow.addColorStop(0.38, "rgba(224, 35, 28, 0.20)");
      moonGlow.addColorStop(0.72, "rgba(255, 90, 60, 0.06)");
      moonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Moon Disc
      const moonCore = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius);
      moonCore.addColorStop(0, "rgba(255, 130, 110, 0.96)");
      moonCore.addColorStop(0.55, "rgba(224, 35, 28, 0.88)");
      moonCore.addColorStop(1, "rgba(180, 20, 15, 0.45)");
      ctx.fillStyle = moonCore;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ambient Fog Layer
      const fogGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
      fogGrad.addColorStop(0, "rgba(10, 14, 20, 0)");
      fogGrad.addColorStop(0.65, "rgba(8, 12, 18, 0.48)");
      fogGrad.addColorStop(1, "rgba(5, 7, 10, 0.96)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);

      // Embers
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.25;
        p.y += p.vy;
        p.alpha += Math.sin(time * 3 + p.x) * p.pulse;
        const currentAlpha = Math.max(0.1, Math.min(0.9, p.alpha));

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = 9;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const toggleAtmosphericAudio = () => {
    if (!isAudioPlaying) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(108, ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setIsAudioPlaying(true);
      } catch (err) {
        console.warn("Audio Context error:", err);
      }
    } else {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsAudioPlaying(false);
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <div className="kage-root">
      {/* Interactive Cursor Dot */}
      <div
        className={`cur-dot ${cursorActive ? "act" : ""}`}
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
        }}
      />

      {/* Preloader overlay with exact animation grammar */}
      <div id="pre" className={preloaderDone ? "done" : ""}>
        <div className="pre-in">
          <div className="pre-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="rgba(223,231,224,.18)" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="6" fill="#e0231c" />
            </svg>
          </div>
          <div className="pre-jp jp">影 · KYOTO NIGHTWALK</div>
          <div className="pre-bar">
            <i style={{ right: `${100 - preloaderPercent}%` }}></i>
          </div>
          <div className="pre-meta">
            <span>Loading Sanmon</span>
            <b>{preloaderPercent}%</b>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600;700&family=Onest:wght@300;400;500;600;700&display=swap');

        :root {
          --ink: #05070a;
          --ink-2: #0a0e12;
          --bone: #dfe7e0;
          --bone-dim: #aab4ad;
          --muted: #78837c;
          --line: rgba(223, 231, 224, 0.13);
          --line-soft: rgba(223, 231, 224, 0.07);
          --vermilion: #e0231c;
          --ember: #ff5a3c;
          --gold: #c9a24a;
          --pad: clamp(20px, 3.4vw, 56px);
          --nav-h: 84px;
          --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
          --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
          --ease-io: cubic-bezier(0.65, 0, 0.35, 1);
        }

        ${customization?.css || ""}

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .kage-root {
          background: var(--ink);
          color: var(--bone);
          font-family: 'Onest', system-ui, -apple-system, sans-serif;
          font-weight: 300;
          font-size: 16px;
          line-height: 1.6;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        ::selection {
          background: var(--vermilion);
          color: #fff;
        }

        /* Ambient Layer Styles */
        #gl {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          z-index: 0;
          pointer-events: none;
        }

        #vignette {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(125% 95% at 50% 42%, transparent 40%, rgba(2, 4, 6, 0.55) 100%);
        }

        .page {
          position: relative;
          z-index: 10;
        }

        /* Typography */
        .eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--bone-dim);
          text-shadow: 0 1px 16px rgba(3, 6, 8, 0.9);
        }

        .jp {
          font-family: 'Noto Serif JP', 'Onest', sans-serif;
          font-weight: 400;
        }

        h1, h2, h3 {
          font-weight: 400;
          margin: 0;
          letter-spacing: -0.005em;
        }

        .display {
          text-transform: uppercase;
          line-height: 1.055;
          letter-spacing: -0.012em;
          font-weight: 400;
          text-shadow: 0 2px 34px rgba(3, 6, 8, 0.72);
        }

        .h-hero {
          font-size: clamp(26px, 3.05vw, 46px);
        }

        .h-sec {
          font-size: clamp(30px, 4.0vw, 60px);
        }

        .body-lg {
          font-size: clamp(14px, 1.02vw, 17px);
          line-height: 1.72;
          color: #b4bfb7;
          font-weight: 300;
          text-shadow: 0 1px 20px rgba(3, 6, 8, 0.88);
        }

        .body {
          font-size: 14px;
          line-height: 1.68;
          color: #9aa5a0;
          font-weight: 300;
          text-shadow: 0 1px 18px rgba(3, 6, 8, 0.85);
        }

        .num {
          font-size: clamp(26px, 2.5vw, 36px);
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--bone);
          font-variant-numeric: tabular-nums;
        }

        /* Reveal Animations */
        [data-rv] {
          opacity: 0;
          transition: opacity 0.9s var(--ease-out), transform 1.05s var(--ease-out);
        }

        [data-rv="up"] {
          transform: translate3d(0, 26px, 0);
        }

        [data-rv="fade"] {
          transform: none;
        }

        [data-rv].rv-in {
          opacity: 1;
          transform: none;
        }

        .mask-line {
          display: block;
          overflow: hidden;
        }

        .mask-line > span {
          display: block;
          transform: translate3d(0, 110%, 0);
          transition: transform 1.05s var(--ease-out);
        }

        .rv-in .mask-line > span, .mask-line.rv-in > span {
          transform: none;
        }

        /* Preloader */
        #pre {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #05070a;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.8s var(--ease), visibility 0.8s;
        }

        #pre.done {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .pre-in {
          width: min(420px, 74vw);
          text-align: center;
        }

        .pre-mark {
          margin: 0 auto 26px;
          width: 44px;
          height: 44px;
          opacity: 0.9;
        }

        .pre-mark svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .pre-jp {
          font-size: 12px;
          letter-spacing: 0.5em;
          color: var(--bone-dim);
          margin-bottom: 20px;
        }

        .pre-bar {
          position: relative;
          height: 1px;
          background: rgba(223, 231, 224, 0.14);
          overflow: hidden;
        }

        .pre-bar i {
          position: absolute;
          inset: 0 100% 0 0;
          background: var(--bone);
          transition: right 0.35s linear;
        }

        .pre-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .pre-meta b {
          font-weight: 500;
          color: var(--bone-dim);
          font-variant-numeric: tabular-nums;
        }

        /* Navbar */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: var(--nav-h);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 var(--pad);
          transition: transform 0.55s var(--ease), background 0.4s;
        }

        .nav::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: rgba(5, 7, 10, 0.72);
          backdrop-filter: blur(14px) saturate(1.1);
          -webkit-backdrop-filter: blur(14px) saturate(1.1);
          opacity: 0;
          transition: opacity 0.5s linear;
        }

        .nav.stuck::before {
          opacity: 1;
        }

        .nav::after {
          content: '';
          position: absolute;
          left: var(--pad);
          right: var(--pad);
          bottom: 0;
          height: 1px;
          background: var(--line-soft);
          opacity: 0;
          transition: opacity 0.5s;
        }

        .nav.stuck::after {
          opacity: 1;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          flex: 0 0 auto;
          cursor: pointer;
          color: inherit;
        }

        .brand svg {
          width: 34px;
          height: 34px;
          display: block;
        }

        .brand-tx {
          display: flex;
          flex-direction: column;
          line-height: 1;
          gap: 3px;
        }

        .brand-tx b {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.26em;
        }

        .brand-tx i {
          font-style: normal;
          font-size: 8px;
          letter-spacing: 0.34em;
          color: var(--muted);
        }

        .nav-links {
          display: flex;
          gap: clamp(18px, 2.6vw, 46px);
          margin-left: auto;
        }

        .nav-link {
          position: relative;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bone-dim);
          display: block;
          height: 15px;
          line-height: 15px;
          overflow: hidden;
          background: none;
          border: none;
          cursor: pointer;
        }

        .nav-link span {
          display: block;
          height: 15px;
          line-height: 15px;
          transition: transform 0.55s var(--ease-out), color 0.3s;
        }

        .nav-link .alt {
          position: absolute;
          inset: 0;
          transform: translate3d(0, 100%, 0);
          color: var(--bone);
          letter-spacing: 0.32em;
        }

        .nav-link:hover span {
          transform: translate3d(0, -100%, 0);
        }

        .nav-link:hover .alt {
          transform: none;
        }

        .nav-link.on {
          color: var(--bone);
        }

        .nav-link.on::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 1px;
          background: var(--vermilion);
        }

        .nav-burger {
          margin-left: clamp(18px, 2.6vw, 42px);
          width: 26px;
          height: 16px;
          position: relative;
          flex: 0 0 auto;
          cursor: pointer;
          background: none;
          border: none;
        }

        .nav-burger i {
          position: absolute;
          right: 0;
          height: 1.5px;
          background: var(--bone);
          transition: width 0.45s var(--ease-out), transform 0.45s var(--ease-out);
        }

        .nav-burger i:nth-child(1) {
          top: 4px;
          width: 26px;
        }

        .nav-burger i:nth-child(2) {
          top: 11px;
          width: 17px;
        }

        .nav-burger:hover i:nth-child(2) {
          width: 26px;
        }

        .nav-burger:hover i:nth-child(1) {
          width: 17px;
        }

        /* Hero Section */
        .hero {
          position: relative;
          min-height: 100svh;
          padding: 0 var(--pad);
          display: flex;
          flex-direction: column;
        }

        .hero::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 46%;
          pointer-events: none;
          background: linear-gradient(rgba(3, 6, 9, 0.72), rgba(3, 6, 9, 0.34) 46%, transparent);
        }

        .hero-top {
          padding-top: calc(var(--nav-h) + clamp(12px, 2.6vh, 34px));
          max-width: min(560px, 46vw);
          position: relative;
          z-index: 2;
        }

        .hero-top .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .hero-top .eyebrow .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--vermilion);
          box-shadow: 0 0 10px var(--vermilion);
        }

        .hero h1 {
          margin-bottom: 18px;
        }

        .hero-sub {
          max-width: 322px;
          text-shadow: 0 1px 26px rgba(3, 6, 8, 0.95);
        }

        .hero-spacer {
          flex: 1 1 auto;
          min-height: clamp(140px, 26vh, 300px);
        }

        .hero-foot {
          padding-bottom: clamp(22px, 4.2vh, 42px);
          position: relative;
          z-index: 2;
        }

        .hero-cue {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 14px;
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .hero-cue .track {
          width: 54px;
          height: 1px;
          background: var(--line);
          position: relative;
          overflow: hidden;
        }

        .hero-cue .track i {
          position: absolute;
          inset: 0;
          background: var(--bone);
          transform-origin: left;
          animation: cue 2.8s var(--ease-io) infinite;
        }

        @keyframes cue {
          0% { transform: scaleX(0); }
          42% { transform: scaleX(1); }
          100% { transform: scaleX(1) translateX(100%); }
        }

        .chapters {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(14px, 2.4vw, 40px);
          border-top: 1px solid var(--line-soft);
          padding-top: 18px;
        }

        .chip {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          cursor: pointer;
        }

        .chip .num {
          line-height: 1;
          flex: 0 0 auto;
          transition: color 0.4s, transform 0.5s var(--ease-out);
        }

        .chip .tx {
          min-width: 0;
          padding-top: 3px;
        }

        .chip b {
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bone-dim);
          margin-bottom: 6px;
          transition: color 0.4s;
          text-shadow: 0 1px 16px rgba(3, 6, 8, 0.9);
        }

        .chip p {
          margin: 0;
          font-size: 11px;
          line-height: 1.5;
          color: #7d8781;
          max-width: 22ch;
          transition: color 0.4s;
        }

        .chip:hover .num, .chip.on .num {
          color: var(--ember);
          transform: translate3d(0, -2px, 0);
        }

        .chip:hover b, .chip.on b {
          color: var(--bone);
        }

        .chip:hover p {
          color: var(--bone-dim);
        }

        /* Floating Sanmon Peek Window */
        .peek {
          position: absolute;
          z-index: 2;
          right: clamp(78px, 11vw, 190px);
          top: clamp(132px, 25vh, 238px);
          width: clamp(150px, 16vw, 262px);
          display: block;
          cursor: pointer;
          transition: transform 0.8s var(--ease-out);
        }

        .peek-fr {
          display: block;
          aspect-ratio: 16/10;
          background: linear-gradient(180deg, rgba(3, 6, 9, 0.04) 24%, rgba(3, 6, 9, 0.48) 100%),
            radial-gradient(circle at 60% 40%, rgba(224, 35, 28, 0.35), rgba(5, 7, 10, 0.85) 75%);
          outline: 1px solid rgba(223, 231, 224, 0.16);
          outline-offset: -1px;
          box-shadow: 0 34px 70px -30px rgba(0, 0, 0, 0.9);
          transition: outline-color 0.5s;
          border-radius: 4px;
        }

        .peek:hover {
          transform: translate3d(0, -5px, 0);
        }

        .peek:hover .peek-fr {
          outline-color: rgba(223, 231, 224, 0.42);
        }

        .peek-play {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          bottom: auto;
          aspect-ratio: 16/10;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .peek-play svg {
          width: clamp(30px, 3.2vw, 46px);
          height: auto;
          filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.7));
          transition: transform 0.55s var(--ease-out);
        }

        .peek:hover .peek-play svg {
          transform: scale(1.14);
        }

        .peek-cap {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin-top: 9px;
        }

        .peek-cap b {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.24em;
          color: var(--bone-dim);
        }

        .peek-cap i {
          font-style: normal;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .hero-side {
          position: absolute;
          z-index: 2;
          right: var(--pad);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          pointer-events: none;
        }

        .hero-side .v {
          writing-mode: vertical-rl;
          font-size: 13px;
          letter-spacing: 0.62em;
          color: rgba(223, 231, 224, 0.5);
        }

        /* Sections */
        .sec {
          position: relative;
          padding: clamp(88px, 15vh, 190px) var(--pad);
        }

        .sec::before {
          content: '';
          position: absolute;
          inset: -22% -4%;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(110% 62% at 30% 50%, rgba(4, 7, 10, 0.88), rgba(4, 7, 10, 0.62) 42%, rgba(4, 7, 10, 0.18) 74%, rgba(4, 7, 10, 0));
          -webkit-mask-image: linear-gradient(transparent, #000 44%);
          mask-image: linear-gradient(transparent, #000 44%);
        }

        .sec-head {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: clamp(30px, 5vh, 66px);
        }

        .sec-head .k {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .sec-head .k b {
          color: var(--vermilion);
          font-weight: 500;
        }

        .rule {
          flex: 1 1 auto;
          height: 1px;
          background: var(--line-soft);
        }

        /* Gate Grid */
        .gate-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr);
          gap: clamp(28px, 5vw, 90px);
          align-items: start;
        }

        .gate-grid h2 {
          max-width: 11ch;
        }

        .gate-copy {
          padding-top: 6px;
        }

        .gate-copy .lead {
          font-size: clamp(15px, 1.16vw, 19px);
          line-height: 1.66;
          color: #c2cdc5;
          text-shadow: 0 1px 20px rgba(3, 6, 8, 0.9);
        }

        .gate-copy .lead + p {
          margin-top: 20px;
        }

        .arrowlink {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 34px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bone);
          cursor: pointer;
        }

        .arrowlink .ar {
          width: 34px;
          height: 34px;
          border: 1px solid var(--line);
          border-radius: 50%;
          display: grid;
          place-items: center;
          transition: background 0.45s var(--ease), border-color 0.45s, transform 0.5s var(--ease-out);
        }

        .arrowlink .ar svg {
          width: 13px;
          height: 13px;
          transition: transform 0.5s var(--ease-out);
        }

        .arrowlink:hover .ar {
          background: var(--bone);
          border-color: var(--bone);
        }

        .arrowlink:hover .ar svg {
          transform: translate3d(2px, -2px, 0);
        }

        .arrowlink:hover .ar svg path {
          stroke: #05070a;
        }

        .gate-stats {
          display: flex;
          gap: clamp(24px, 4vw, 62px);
          margin-top: clamp(46px, 8vh, 96px);
          border-top: 1px solid var(--line-soft);
          padding-top: 24px;
        }

        .gate-stats div b {
          display: block;
          font-size: clamp(22px, 2.1vw, 32px);
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        .gate-stats div span {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Chapter II: Cards & Glowing Lights */
        .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px, 1.4vw, 22px);
          align-items: start;
        }

        .card {
          position: relative;
          cursor: pointer;
        }

        .card:nth-child(1) { transform: translateY(0); }
        .card:nth-child(2) { transform: translateY(clamp(26px, 5vw, 74px)); }
        .card:nth-child(3) { transform: translateY(clamp(52px, 10vw, 148px)); }

        .card-fr {
          position: relative;
          aspect-ratio: 4/5;
          outline: 1px solid var(--line-soft);
          outline-offset: -1px;
          transition: outline-color 0.5s var(--ease);
          isolation: isolate;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(14, 20, 26, 0.4) 0%, rgba(5, 7, 10, 0.9) 100%);
        }

        .card:hover .card-fr {
          outline-color: rgba(223, 231, 224, 0.30);
        }

        .card-fr::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent 46%, rgba(4, 6, 9, 0.80));
          pointer-events: none;
        }

        /* Glow & Flame Animations */
        .glow {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          left: var(--gx, 50%);
          top: var(--gy, 40%);
          width: calc(var(--gr, 70px) * 2);
          aspect-ratio: 1;
          translate: -50% -50%;
          mix-blend-mode: screen;
          animation: glow-swell var(--gt2, 4.2s) var(--ease-io) infinite alternate;
        }

        .glow::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(closest-side, var(--gc1, rgba(224, 35, 28, 0.8)), var(--gc2, rgba(255, 90, 60, 0.3)) 40%, transparent 72%);
          animation: glow-pulse var(--gt, 3.2s) var(--ease-io) infinite;
        }

        @keyframes glow-swell {
          from { transform: scale(0.93); }
          to { transform: scale(1.07); }
        }

        @keyframes glow-pulse {
          from { opacity: 0.78; }
          50% { opacity: 1; }
          to { opacity: 0.78; }
        }

        @keyframes glow-flame {
          0% { opacity: 0.74; } 6% { opacity: 0.97; } 12% { opacity: 0.63; } 19% { opacity: 0.90; }
          27% { opacity: 0.55; } 34% { opacity: 0.94; } 42% { opacity: 0.71; } 51% { opacity: 1; }
          58% { opacity: 0.60; } 66% { opacity: 0.88; } 74% { opacity: 0.67; } 83% { opacity: 0.96; }
          91% { opacity: 0.72; } 100% { opacity: 0.74; }
        }

        .glow--flame::before {
          animation-name: glow-flame;
          animation-duration: var(--gt2, 2.4s);
        }

        .card-lab {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 14px;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .card-lab b {
          font-size: clamp(13px, 1.15vw, 17px);
          font-weight: 400;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .card-lab .jp {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(223, 231, 224, 0.62);
        }

        .card-ar {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 2;
          width: 26px;
          height: 26px;
          opacity: 0;
          transform: translate3d(-4px, 4px, 0);
          transition: 0.5s var(--ease-out);
        }

        .card:hover .card-ar {
          opacity: 1;
          transform: none;
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Chapter III: Curriculum */
        .cur-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.72fr);
          gap: clamp(28px, 5vw, 90px);
          align-items: end;
          margin-bottom: clamp(34px, 6vh, 72px);
        }

        .cur-head h2 {
          max-width: 13ch;
        }

        .cur {
          border-top: 1px solid var(--line-soft);
        }

        .les {
          position: relative;
          display: grid;
          align-items: center;
          grid-template-columns: 64px minmax(0, 1.05fr) minmax(0, 1.25fr) 86px;
          gap: clamp(14px, 2.4vw, 40px);
          padding: clamp(20px, 2.4vw, 30px) 0;
          border-bottom: 1px solid var(--line-soft);
          cursor: pointer;
          transition: padding 0.5s var(--ease-out);
        }

        .les::before {
          content: '';
          position: absolute;
          left: calc(var(--pad) * -1);
          right: 0;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(224, 35, 28, 0.09), transparent 46%);
          opacity: 0;
          transition: opacity 0.55s var(--ease);
          pointer-events: none;
        }

        .les:hover::before {
          opacity: 1;
        }

        .les:hover {
          padding-left: clamp(8px, 1.2vw, 18px);
        }

        .les .k {
          font-size: 11px;
          letter-spacing: 0.16em;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
          transition: color 0.4s;
        }

        .les:hover .k {
          color: var(--vermilion);
        }

        .les h3 {
          font-size: clamp(16px, 1.5vw, 23px);
          font-weight: 400;
          letter-spacing: -0.005em;
        }

        .les h3 em {
          font-style: normal;
          font-family: 'Noto Serif JP', sans-serif;
          font-size: 0.72em;
          color: var(--muted);
          margin-left: 12px;
          letter-spacing: 0.24em;
        }

        .les p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #909b95;
          text-shadow: 0 1px 16px rgba(3, 6, 8, 0.92);
        }

        .les .t {
          text-align: right;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #8b958f;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 1px 16px rgba(3, 6, 8, 0.92);
        }

        .les .bar {
          position: absolute;
          left: 0;
          bottom: -1px;
          height: 1px;
          width: 100%;
          background: var(--vermilion);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.7s var(--ease-out);
        }

        .les:hover .bar {
          transform: scaleX(1);
        }

        /* Chapter IV: Eternity & CTA */
        .fin {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .fin .eyebrow {
          margin-bottom: 26px;
        }

        .fin h2 {
          font-size: clamp(38px, 7.4vw, 124px);
          line-height: 0.94;
          letter-spacing: -0.03em;
          text-transform: uppercase;
        }

        .fin p {
          max-width: 44ch;
          margin: 26px auto 0;
        }

        .cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-top: 44px;
          padding: 17px 30px;
          border: 1px solid var(--line);
          border-radius: 100px;
          overflow: hidden;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.45s var(--ease), border-color 0.45s;
        }

        .cta i {
          position: absolute;
          inset: 0;
          background: var(--bone);
          transform: translate3d(0, 101%, 0);
          transition: transform 0.62s var(--ease-out);
          z-index: -1;
        }

        .cta span, .cta svg {
          position: relative;
          z-index: 1;
        }

        .cta:hover {
          color: #05070a;
          border-color: var(--bone);
        }

        .cta:hover i {
          transform: none;
        }

        .cta:hover svg path {
          stroke: #05070a;
        }

        /* Footer */
        .foot {
          position: relative;
          padding: clamp(50px, 8vh, 96px) var(--pad) clamp(26px, 4vh, 40px);
          border-top: 1px solid var(--line-soft);
        }

        .foot::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(rgba(4, 7, 10, 0.55), rgba(4, 7, 10, 0.94) 40%, rgba(4, 7, 10, 0.98));
        }

        .foot-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 0.6fr));
          gap: clamp(22px, 4vw, 60px);
        }

        .foot h4 {
          margin: 0 0 16px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .foot ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .foot li a {
          font-size: 13px;
          color: #8f9a93;
          transition: color 0.35s;
          cursor: pointer;
        }

        .foot li a:hover {
          color: var(--bone);
        }

        .foot-brand p {
          margin: 16px 0 0;
          max-width: 34ch;
          font-size: 13px;
          color: #79847e;
        }

        .foot-base {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: clamp(38px, 6vh, 74px);
          padding-top: 20px;
          border-top: 1px solid var(--line-soft);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Progress Rail */
        .rail {
          position: fixed;
          right: calc(var(--pad) - 4px);
          top: 50%;
          transform: translateY(-50%);
          z-index: 45;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .rail button {
          width: 22px;
          height: 10px;
          display: grid;
          place-items: center;
          background: none;
          border: none;
          cursor: pointer;
        }

        .rail i {
          display: block;
          width: 14px;
          height: 1px;
          background: rgba(223, 231, 224, 0.26);
          transition: 0.5s var(--ease-out);
        }

        .rail button.on i, .rail button:hover i {
          width: 22px;
          background: var(--bone);
        }

        /* Cursor Dot */
        .cur-dot {
          position: fixed;
          z-index: 80;
          top: 0;
          left: 0;
          width: 26px;
          height: 26px;
          margin: -13px 0 0 -13px;
          border: 1px solid rgba(223, 231, 224, 0.42);
          border-radius: 50%;
          pointer-events: none;
          transition: width 0.35s var(--ease-out), height 0.35s var(--ease-out), margin 0.35s var(--ease-out), background 0.35s, border-color 0.35s, opacity 0.3s;
          opacity: 0;
        }

        .cur-dot.act {
          width: 52px;
          height: 52px;
          margin: -26px 0 0 -26px;
          background: rgba(223, 231, 224, 0.07);
          border-color: rgba(223, 231, 224, 0.6);
        }

        @media (hover: hover) and (pointer: fine) {
          .cur-dot { opacity: 1; }
        }

        @media (max-width: 1080px) {
          .hero-top { max-width: none; }
          .gate-grid { grid-template-columns: 1fr; gap: 26px; }
          .cur-head { grid-template-columns: 1fr; gap: 18px; }
          .les { grid-template-columns: 44px minmax(0, 1fr) 74px; }
          .les p { display: none; }
          .foot-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 820px) {
          .rail, .hero-side, .hero-cue { display: none; }
          .chapters { grid-template-columns: repeat(2, 1fr); gap: 18px 14px; }
          .cards { grid-template-columns: 1fr; gap: 14px; }
          .card:nth-child(2), .card:nth-child(3) { transform: none; }
          .gate-stats { flex-wrap: wrap; gap: 20px 34px; }
          .foot-grid { grid-template-columns: 1fr; }
          .peek { display: none; }
        }
      `}</style>

      {/* Atmospheric Canvas & Vignette */}
      <canvas id="gl" ref={canvasRef} />
      <div id="vignette" />

      {/* Chapter Progress Rail */}
      <div className="rail">
        <button className={activeChapter === 0 ? "on" : ""} onClick={() => scrollTo("gate")} title="I. The Gate">
          <i></i>
        </button>
        <button className={activeChapter === 1 ? "on" : ""} onClick={() => scrollTo("pathways")} title="II. Gardens">
          <i></i>
        </button>
        <button className={activeChapter === 2 ? "on" : ""} onClick={() => scrollTo("lessons")} title="III. Craft">
          <i></i>
        </button>
        <button className={activeChapter === 3 ? "on" : ""} onClick={() => scrollTo("eternity")} title="IV. Eternity">
          <i></i>
        </button>
      </div>

      <div className="page">
        {/* Navigation */}
        <nav className={`nav ${scrolledPastNav ? "stuck" : ""}`}>
          <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <svg viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="4" fill="rgba(223,231,224,0.06)" />
              <circle cx="17" cy="17" r="7" fill="#e0231c" />
              <rect x="7" y="10" width="20" height="2" fill="#dfe7e0" />
            </svg>
            <div className="brand-tx">
              <b>KAGE · 影</b>
              <i>SANCTUARY</i>
            </div>
          </div>

          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollTo("gate")}>
              <span>The Gate</span>
              <span className="alt">山門</span>
            </button>
            <button className="nav-link" onClick={() => scrollTo("pathways")}>
              <span>Gardens</span>
              <span className="alt">静庭</span>
            </button>
            <button className="nav-link" onClick={() => scrollTo("lessons")}>
              <span>Craft</span>
              <span className="alt">秘法</span>
            </button>
            <button className="nav-link" onClick={() => scrollTo("eternity")}>
              <span>Eternity</span>
              <span className="alt">残光</span>
            </button>
            <button className="nav-link" onClick={() => navigate("/help")}>
              <span>Support</span>
              <span className="alt">案内</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "auto" }}>
            <button
              onClick={toggleAtmosphericAudio}
              style={{
                background: "none",
                border: "1px solid var(--line)",
                borderRadius: "100px",
                padding: "6px 14px",
                color: "var(--bone-dim)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              title="Kyoto Ambient Sound"
            >
              {isAudioPlaying ? "Sound ON 🔊" : "Ambient 🔈"}
            </button>
            <button
              className="cta"
              style={{ marginTop: 0, padding: "8px 20px", fontSize: "10px" }}
              onClick={() => navigate("/login")}
            >
              <span>Login</span>
              <i></i>
            </button>
            <button
              className="cta"
              style={{ marginTop: 0, padding: "8px 20px", fontSize: "10px", borderColor: "var(--vermilion)", color: "#fff", background: "var(--vermilion)" }}
              onClick={() => navigate("/register")}
            >
              <span>Register</span>
              <i></i>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-top" data-rv="up">
            <div className="eyebrow">
              <span className="dot"></span>
              <span>夜歩き · Five-Chapter Night Walk</span>
            </div>
            <h1 className="display h-hero">
              <span className="mask-line"><span>Where stillness</span></span>
              <span className="mask-line"><span style={{ color: "var(--vermilion)" }}>reveals unseen</span></span>
            </h1>
            <p className="body-lg hero-sub">
              A five-chapter night walk through a Kyoto mountain temple. Charred cypress, lantern light, and a vermilion moon.
            </p>
          </div>

          {/* Floating Sanmon Peek Window with Glow */}
          <div className="peek" onClick={() => scrollTo("pathways")}>
            <div className="peek-fr"></div>
            <div className="peek-play">
              <svg viewBox="0 0 46 46" fill="none">
                <circle cx="23" cy="23" r="22" stroke="#dfe7e0" strokeWidth="1.5" />
                <polygon points="19,15 31,23 19,31" fill="#dfe7e0" />
              </svg>
            </div>
            <div className="peek-cap">
              <b>山門 SANMON</b>
              <i>PREVIEW</i>
            </div>
          </div>

          <div className="hero-side">
            <span className="v jp">静寂の中に見えるもの</span>
          </div>

          <div className="hero-spacer"></div>

          <div className="hero-foot" data-rv="up">
            <div className="hero-cue">
              <span>Scroll to Begin</span>
              <div className="track"><i></i></div>
            </div>

            <div className="chapters">
              <div className={`chip ${activeChapter === 0 ? "on" : ""}`} onClick={() => scrollTo("gate")}>
                <span className="num">01</span>
                <div className="tx">
                  <b>The Gate · 山門</b>
                  <p>Crossing the boundary into charred cypress.</p>
                </div>
              </div>
              <div className={`chip ${activeChapter === 1 ? "on" : ""}`} onClick={() => scrollTo("pathways")}>
                <span className="num">02</span>
                <div className="tx">
                  <b>Still Gardens · 静庭</b>
                  <p>Basalt stones, stone lanterns, and pine.</p>
                </div>
              </div>
              <div className={`chip ${activeChapter === 2 ? "on" : ""}`} onClick={() => scrollTo("lessons")}>
                <span className="num">03</span>
                <div className="tx">
                  <b>Sacred Craft · 秘法</b>
                  <p>Direct encrypted dialogue and intelligence.</p>
                </div>
              </div>
              <div className={`chip ${activeChapter === 3 ? "on" : ""}`} onClick={() => scrollTo("eternity")}>
                <span className="num">04</span>
                <div className="tx">
                  <b>Afterlight · 残光</b>
                  <p>A vermilion moon rising over black water.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter I: The Gate */}
        <section id="gate" className="sec">
          <div className="sec-head" data-rv="fade">
            <span className="k">Chapter <b>I</b> · The Gate</span>
            <div className="rule"></div>
            <span className="k jp">山門</span>
          </div>

          <div className="gate-grid">
            <div data-rv="up">
              <h2 className="display h-sec">
                <span className="mask-line"><span>The charred gate</span></span>
                <span className="mask-line"><span>holds the wind</span></span>
              </h2>
            </div>
            <div className="gate-copy" data-rv="up">
              <p className="lead">
                Built in 1642 on the eastern slope of Mount Hiei, the Sanmon gate was designed to frame the moon through heavy timber columns.
              </p>
              <p className="body">
                Step into Chatify’s sanctuary where realtime messages travel without delay, protected by zero-retention encryption.
              </p>
              <div className="arrowlink" onClick={() => navigate("/register")}>
                <span>Enter Sanctuary</span>
                <div className="ar">
                  <svg viewBox="0 0 13 13" fill="none">
                    <path d="M2 11L11 2M11 2H4M11 2V9" stroke="#dfe7e0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="gate-stats" data-rv="up">
            <div>
              <b>1642</b>
              <span>FOUNDED</span>
            </div>
            <div>
              <b>99.9%</b>
              <span>UPTIME RELAY</span>
            </div>
            <div>
              <b>&lt;12ms</b>
              <span>LATENCY</span>
            </div>
            <div>
              <b>0-LOG</b>
              <span>RETENTION</span>
            </div>
          </div>
        </section>

        {/* Chapter II: Still Gardens */}
        <section id="pathways" className="sec">
          <div className="sec-head" data-rv="fade">
            <span className="k">Chapter <b>II</b> · Still Gardens</span>
            <div className="rule"></div>
            <span className="k jp">静庭</span>
          </div>

          <div className="cards">
            {/* Card 1: Approach with Swelling Moon */}
            <div className="card" data-rv="up" onClick={() => navigate("/register")}>
              <div className="card-fr">
                <div className="glow" style={{ "--gx": "72%", "--gy": "28%", "--gr": "45px", "--gc1": "rgba(224,35,28,0.9)", "--gc2": "rgba(255,90,60,0.35)", "--gt": "3.2s", "--gt2": "4.6s" }}></div>
                <div className="card-lab">
                  <b>The Approach</b>
                  <span className="jp">参道</span>
                </div>
                <div className="card-ar">
                  <svg viewBox="0 0 26 26" fill="none"><path d="M6 20L20 6M20 6H9M20 6V17" stroke="#dfe7e0" strokeWidth="1.5" /></svg>
                </div>
              </div>
              <div className="card-meta">
                <span>01 · CEDAR PATH</span>
                <span>ENTER →</span>
              </div>
            </div>

            {/* Card 2: Lantern Court with Flickering Flame */}
            <div className="card" data-rv="up" onClick={() => navigate("/register")}>
              <div className="card-fr">
                <div className="glow glow--flame" style={{ "--gx": "42%", "--gy": "62%", "--gr": "38px", "--gc1": "rgba(255,140,50,0.95)", "--gc2": "rgba(224,35,28,0.4)", "--gt": "1.8s", "--gt2": "2.4s" }}></div>
                <div className="card-lab">
                  <b>Lantern Court</b>
                  <span className="jp">灯籠</span>
                </div>
                <div className="card-ar">
                  <svg viewBox="0 0 26 26" fill="none"><path d="M6 20L20 6M20 6H9M20 6V17" stroke="#dfe7e0" strokeWidth="1.5" /></svg>
                </div>
              </div>
              <div className="card-meta">
                <span>02 · STONE LIGHT</span>
                <span>EXPLORE →</span>
              </div>
            </div>

            {/* Card 3: Moonwater */}
            <div className="card" data-rv="up" onClick={() => navigate("/register")}>
              <div className="card-fr">
                <div className="glow" style={{ "--gx": "65%", "--gy": "35%", "--gr": "50px", "--gc1": "rgba(224,35,28,0.85)", "--gc2": "rgba(180,20,15,0.3)", "--gt": "4.5s", "--gt2": "5.2s" }}></div>
                <div className="card-lab">
                  <b>Moonwater</b>
                  <span className="jp">月水</span>
                </div>
                <div className="card-ar">
                  <svg viewBox="0 0 26 26" fill="none"><path d="M6 20L20 6M20 6H9M20 6V17" stroke="#dfe7e0" strokeWidth="1.5" /></svg>
                </div>
              </div>
              <div className="card-meta">
                <span>03 · BLACK MIRROR</span>
                <span>REFLECT →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter III: Sacred Craft */}
        <section id="lessons" className="sec">
          <div className="sec-head" data-rv="fade">
            <span className="k">Chapter <b>III</b> · Sacred Craft</span>
            <div className="rule"></div>
            <span className="k jp">秘法</span>
          </div>

          <div className="cur-head">
            <h2 className="display h-sec" data-rv="up">
              <span className="mask-line"><span>Five lessons</span></span>
              <span className="mask-line"><span>in restraint</span></span>
            </h2>
            <p className="body-lg" data-rv="up">
              Each discipline is preserved as it was practiced four hundred years ago, translated into state-of-the-art communication architecture.
            </p>
          </div>

          <div className="cur" data-rv="up">
            {[
              { k: "I", title: "Charred Cypress", jp: "焼杉", desc: "Hardening surfaces against moisture, smoke, and unwanted network intrusion.", time: "42 MIN" },
              { k: "II", title: "Stone Lantern Flame", jp: "石灯籠", desc: "Tending a flame that withstands mountain gales through calibrated airflow.", time: "56 MIN" },
              { k: "III", title: "Raked White Gravel", jp: "枯山水", desc: "Patterns that suggest flowing water without a single drop of liquid.", time: "38 MIN" },
              { k: "IV", title: "Vermilion Pigment", jp: "朱砂", desc: "Grinding cinnabar into lacquer that retains its scarlet intensity.", time: "49 MIN" },
              { k: "V", title: "Night Walk Meditation", jp: "夜行", desc: "Walking without lantern or torch, trusting footstep and temple breath.", time: "64 MIN" },
            ].map((lesson, idx) => (
              <div key={idx} className="les" onClick={() => navigate("/about")}>
                <span className="k">{lesson.k}</span>
                <h3>{lesson.title} <em>{lesson.jp}</em></h3>
                <p>{lesson.desc}</p>
                <span className="t">{lesson.time}</span>
                <div className="bar"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Chapter IV: Eternity & Final CTA */}
        <section id="eternity" className="sec fin">
          <div className="eyebrow" data-rv="fade">
            <span>Chapter IV · Afterlight · 残光</span>
          </div>
          <h2 className="display" data-rv="up">
            <span className="mask-line"><span>Step into</span></span>
            <span className="mask-line"><span style={{ color: "var(--vermilion)" }}>The Light</span></span>
          </h2>
          <p className="body-lg" data-rv="up">
            The sanctuary is open. Step past the boundary of noise and enter an unhurried, real-time messaging experience.
          </p>
          <div data-rv="up">
            <button className="cta" onClick={() => navigate("/register")}>
              <span>Begin Journey — Register</span>
              <i></i>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L12 2M12 2H5M12 2V9" stroke="#dfe7e0" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </section>

        {/* Footer & Colophon */}
        <footer className="foot">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <svg viewBox="0 0 34 34" fill="none">
                  <rect width="34" height="34" rx="4" fill="rgba(223,231,224,0.06)" />
                  <circle cx="17" cy="17" r="7" fill="#e0231c" />
                  <rect x="7" y="10" width="20" height="2" fill="#dfe7e0" />
                </svg>
                <div className="brand-tx">
                  <b>KAGE · 影</b>
                  <i>CHATIFY SANCTUARY</i>
                </div>
              </div>
              <p>
                A night walk through charred cypress, lantern light, and a vermilion moon. Preserving silence in a world of noise.
              </p>
            </div>

            <div>
              <h4>Chapters</h4>
              <ul>
                <li><a onClick={() => scrollTo("gate")}>The Gate · 山門</a></li>
                <li><a onClick={() => scrollTo("pathways")}>Gardens · 静庭</a></li>
                <li><a onClick={() => scrollTo("lessons")}>Craft · 秘法</a></li>
                <li><a onClick={() => scrollTo("eternity")}>Eternity · 残光</a></li>
              </ul>
            </div>

            <div>
              <h4>Sanctuary</h4>
              <ul>
                <li><a onClick={() => navigate("/login")}>Enter (Login)</a></li>
                <li><a onClick={() => navigate("/register")}>Register</a></li>
                <li><a onClick={() => navigate("/about")}>Architecture</a></li>
                <li><a onClick={() => navigate("/help")}>Help Desk</a></li>
              </ul>
            </div>

            <div>
              <h4>Colophon</h4>
              <ul>
                <li><a onClick={() => navigate("/privacy")}>Privacy Protocol</a></li>
                <li><a onClick={() => navigate("/help")}>System Health</a></li>
                <li><a onClick={() => navigate("/help")}>Security Disclosure</a></li>
              </ul>
            </div>
          </div>

          <div className="foot-base">
            <span>© 2026 KAGE · CHATIFY. ALL RIGHTS RESERVED.</span>
            <span className="jp">静寂の中に見えるもの</span>
            <span>KYOTO MOUNTAIN TEMPLE NIGHTWALK</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default KageLandingPage;
