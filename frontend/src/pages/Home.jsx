import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const Home = () => {
  const navigate = useNavigate();


  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Add fade-in effect on scroll
      const sections = document.querySelectorAll('.fade-in-section');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.85;
        if (isVisible) {
          section.classList.add('visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        /* Import unique fonts for distinctive design */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --primary-green: #a3e635;
          --primary-dark: #1a1a1a;
          --secondary-gray: #f5f5f5;
          --text-primary: #0a0a0a;
          --text-secondary: #666;
          --accent-purple: #8b5cf6;
          --accent-blue: #3b82f6;
          --white: #ffffff;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
          --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: var(--white);
          overflow-x: hidden;
          line-height: 1.6;
        }

        .home-container {
          width: 100%;
          overflow-x: hidden;
        }

        /* Navbar Styles */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          z-index: 1000;
          padding: 1rem 0;
          box-shadow: var(--shadow-sm);
          animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .nav-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-left, .nav-center, .nav-right {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .logo {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .logo:hover {
          color: var(--primary-green);
          transform: scale(1.05);
        }

        .nav-link {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.95rem;
          position: relative;
          transition: var(--transition-smooth);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary-green);
          transition: width 0.3s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .btn-login, .btn-register {
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: var(--transition-smooth);
          border: none;
          font-family: inherit;
        }

        .btn-login {
          background: transparent;
          color: var(--text-primary);
          border: 2px solid var(--text-primary);
        }

        .btn-login:hover {
          background: var(--text-primary);
          color: var(--white);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn-register {
          background: var(--text-primary);
          color: var(--white);
        }

        .btn-register:hover {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        /* Hero Section */
        .hero-section {
          padding: 140px 2rem 100px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-text {
          max-width: 600px;
        }

        .hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -2px;
        }

        .title-line {
          display: block;
          opacity: 0;
          animation: fadeInUp 0.8s ease forwards;
        }

        .delay-1 {
          animation-delay: 0.2s;
        }

        .delay-2 {
          animation-delay: 0.4s;
        }

        .delay-3 {
          animation-delay: 0.6s;
        }

        .delay-4 {
          animation-delay: 0.8s;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s ease forwards;
        }

        .hero-description {
          font-size: 1.15rem;
          line-height: 1.8;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }

        .highlight {
          color: var(--text-primary);
          font-weight: 600;
          position: relative;
        }

        .highlight-green {
          color: var(--primary-green);
          font-weight: 700;
          
          background-repeat: no-repeat;
          background-size: 100% 40%;
          background-position: 0 85%;
          padding: 0 4px;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-primary, .btn-secondary {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition-smooth);
          font-family: inherit;
        }

        .btn-primary {
          background: var(--text-primary);
          color: var(--white);
        }

        .btn-primary:hover {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }

        .btn-primary:hover svg {
          transform: translateX(4px);
        }

        .btn-secondary {
          background: var(--secondary-gray);
          color: var(--text-primary);
        }

        .btn-secondary:hover {
          background: var(--text-primary);
          color: var(--white);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .btn-secondary:hover svg {
          transform: translateX(4px);
        }

        .btn-primary svg, .btn-secondary svg {
          transition: transform 0.3s ease;
        }

        /* Hero Visuals */
        .hero-visuals {
          position: relative;
          height: 600px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 1rem;
        }

        .feature-card {
          background: var(--white);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-lg);
          background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .card-1 {
          grid-column: 1 / 3;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .card-2 {
          grid-column: 3 / 4;
          grid-row: 1 / 2;
          flex-direction: column;
          align-items: flex-start;
        }

        .card-3 {
          grid-column: 1 / 2;
          grid-row: 2 / 3;
          justify-content: center;
        }

        .card-4 {
          grid-column: 2 / 4;
          grid-row: 2 / 3;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        .card-5 {
          grid-column: 1 / 2;
          grid-row: 3 / 4;
          justify-content: center;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }

        .card-6 {
          grid-column: 2 / 4;
          grid-row: 3 / 4;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        }

        .card-icon {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .card-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .card-content p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .close-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: var(--text-primary);
          color: var(--white);
          font-size: 1.2rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .close-btn:hover {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: rotate(90deg);
        }

        /* Scroll Indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        .mouse {
          width: 28px;
          height: 45px;
          border: 2px solid var(--text-primary);
          border-radius: 20px;
          position: relative;
        }

        .wheel {
          width: 4px;
          height: 8px;
          background: var(--text-primary);
          border-radius: 2px;
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          animation: wheel 1.5s infinite;
        }

        @keyframes wheel {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(12px);
          }
        }

        /* Section Styles */
        section {
          padding: 100px 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .fade-in-section {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .fade-in-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 3.0rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.5px;
          margin-bottom: 1.5rem;
          color: black;
        }

        .section-title.centered {
          text-align: center;
        }

        .section-description {
          font-size: 1.1rem;
          line-height: 1.8;
          color: var(--text-secondary);
          max-width: 800px;
        }

        .section-description.centered {
          text-align: center;
          margin: 0 auto 3rem;
        }

        .label {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--secondary-gray);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-transform: lowercase;
        }

        /* Benefits Grid */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .benefit-card {
          background: var(--white);
          border: 2px solid var(--secondary-gray);
          border-radius: 24px;
          padding: 2.5rem;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .benefit-card:hover, .benefit-card.hovered {
          border-color: var(--primary-green);
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
        }

        .benefit-card.large {
          grid-column: span 2;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: var(--white);
          min-height: 200px;
        }

        .benefit-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .benefit-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: var(--secondary-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .benefit-label {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: lowercase;
          color: var(--text-secondary);
        }

        .benefit-text {
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .benefit-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1px;
        }

        /* Testimonials */
        .testimonials-carousel {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin: 3rem 0 2rem;
        }

        .testimonial-card {
          background: var(--white);
          border: 2px solid var(--secondary-gray);
          border-radius: 24px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .testimonial-card:hover, .testimonial-card.hovered {
          border-color: var(--primary-green);
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
        }

        .testimonial-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--secondary-gray);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          width: fit-content;
        }

        .testimonial-text {
          line-height: 1.8;
          color: var(--text-secondary);
          flex: 1;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .author-info h4 {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .author-info p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .explore-btn {
          padding: 0.75rem 1.5rem;
          background: var(--text-primary);
          color: var(--white);
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition-smooth);
          font-family: inherit;
        }

        .explore-btn:hover {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: scale(1.02);
        }

        /* Final CTA */
        .final-cta-section {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 40px;
          padding: 80px 4rem;
        }

        .cta-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 4rem;
        }

        .cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.5px;
          margin: 2rem 0 1.5rem;
        }

        .cta-images {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1.5rem;
        }

        .cta-image-card {
          aspect-ratio: 1;
          background: var(--white);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          transition: var(--transition-smooth);
          cursor: pointer;
          font-size: 3rem;
        }

        .cta-image-card:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: var(--shadow-lg);
        }

        /* Footer */
        .footer {
          background: var(--text-primary);
          color: var(--white);
          padding: 80px 2rem 2rem;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 4rem;
          margin-bottom: 3rem;
        }

        .footer-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .footer-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
        }

        .footer-section h4 {
          margin-bottom: 1rem;
        }

        .footer-section a {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          margin-bottom: 0.75rem;
          transition: var(--transition-smooth);
        }

        .footer-section a:hover {
          color: var(--primary-green);
          transform: translateX(4px);
        }

        .footer-bottom {
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .hero-content {
            grid-template-columns: 1fr;
          }
          
          .benefits-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .testimonials-carousel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .nav-center {
            display: none;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .benefits-grid {
            grid-template-columns: 1fr;
          }
          
          .benefit-card.large {
            grid-column: span 1;
          }
          
          .cta-images {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .footer-content {
            grid-template-columns: 1fr;
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="home-container">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-content">
            <div className="nav-left">
              <div 
                className="logo" 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Chatify
              </div>
              <span 
                className="nav-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/help')}
              >
                Contact Us
              </span>
            </div>
            <div className="nav-center">
              <span 
                className="nav-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/about')}
              >
                About
              </span>
              <a 
                href="#benefits" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Benefits
              </a>
              <a 
                href="#app" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                App
              </a>
              <a 
                href="#features" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </a>
              <a 
                href="#reviews" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Reviews
              </a>
              <a 
                href="#plans" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Plans
              </a>
            </div>
            <div className="nav-right">
              <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
              <button className="btn-register" onClick={() => navigate('/register')}>Register</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="title-line fade-in-up">Empower</span>
                <span className="title-line fade-in-up delay-1">Connections</span>
                <span className="title-line fade-in-up delay-2">with Chatify</span>
              </h1>
              <p className="hero-description fade-in-up delay-3">
                Instant real-time <span className="highlight">communication</span>, providing both
                visual connection and <span className="highlight">immediate answers</span> to customers requires.
              </p>
              <div className="hero-buttons fade-in-up delay-4">
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Try Out
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="hero-visuals">
              <div className="feature-card card-1 float-animation">
                <div className="card-icon">📱</div>
                <div className="card-content">
                  <h3>Try Out</h3>
                  <p>Experience seamless chat</p>
                </div>
              </div>
              
              <div className="feature-card card-2 float-animation delay-1">
                <div className="card-icon">❓</div>
                <div className="card-content">
                  <h3>Ask Me A Question</h3>
                  <p>Get instant support</p>
                </div>
              </div>
              
              <div className="feature-card card-3 float-animation delay-2">
                <div className="avatar">👤</div>
              </div>
              
              <div className="feature-card card-4 float-animation delay-3">
                <div className="card-icon">🎤</div>
                <div className="card-content">
                  <h3>Type here</h3>
                </div>
              </div>
              
              <div className="feature-card card-5 float-animation delay-4">
                <button className="close-btn">✕</button>
              </div>
              
              <div className="feature-card card-6 float-animation delay-2">
                <div className="card-icon">📝</div>
                <div className="card-content">
                  <h3>Ask Me A Question</h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="scroll-indicator">
            <div className="mouse">
              <div className="wheel"></div>
            </div>
          </div>
        </section>

        {/* AI Operator & App Showcase Section */}
        <section className="fade-in-section" id="app" style={{textAlign: 'center', padding: '120px 2rem'}}>
          <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem'}}>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'var(--secondary-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: 'var(--shadow-sm)'}}>🌐</div>
            <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'var(--secondary-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: 'var(--shadow-sm)'}}>📹</div>
          </div>
          <h2 className="section-title">
            Even if your operator is reluctant to appear
            on camera, <span style={{ color: '#86df5d', fontWeight: 600 }}>
  our AI expresses
</span>
 engagement
            through text or facial expressions.
          </h2>
        </section>

        {/* Live Chat & Features Section */}
        <section className="fade-in-section" id="features" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '40px', padding: '90px 2rem', textAlign: 'center'}}>
          <div className="label" style={{ background: '#dcfce7', color: '#15803d' }}>✨ core capabilities</div>
          <h2 className="section-title">
            Introducing <span style={{ color: '#6fd341', fontWeight: 600 }}>
  Live Chat
</span>
 Of The Future
          </h2>
          <p style={{ maxWidth: '700px', margin: '0 auto 2.5rem', color: '#166534', fontSize: '1.1rem' }}>
            Built with modern MERN architecture, Socket.IO WebSockets, and real-time synchronization.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', maxWidth: '1050px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Real-Time Messaging</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Instant message delivery with typing indicators, read receipts, and reactions.</p>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📹</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>HD Audio & Video</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Crystal-clear calls with duration timers, mute, camera toggle, and screen privacy.</p>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Group Channels</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Create multi-user group spaces, manage members, and collaborate effortlessly.</p>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Privacy & Security</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>TLS transport encryption, disappearing temporary chats, and safety controls.</p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="fade-in-section" id="benefits">
          <div className="label">🔓 unlocking value</div>
          <h2 className="section-title">Our Benefits</h2>
          
          <div className="benefits-grid">
            <div 
              className={`benefit-card ${hoveredCard === 'engagement' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('engagement')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="benefit-header">
                <div className="benefit-icon">😊</div>
                <div className="benefit-label">clients engagement</div>
              </div>
              <p className="benefit-text">
                The inclusion of an on-site chat feature ensures that your clients remain engaged and are more
                likely to take the desired action before leaving.
              </p>
            </div>
            
            <div 
              className={`benefit-card large ${hoveredCard === 'elevate' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('elevate')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <h3 className="benefit-title">We are here to<br/>Elevate Engagement</h3>
            </div>
            
            <div 
              className={`benefit-card ${hoveredCard === 'refusals' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('refusals')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="benefit-header">
                <div className="benefit-icon">🛒</div>
                <div className="benefit-label">reduced purchase refusals</div>
              </div>
              <p className="benefit-text">
                The occurrence of purchase and order refusals is anticipated to decrease, resulting in a more
                streamlined and efficient transaction process.
              </p>
            </div>
            
            <div 
              className={`benefit-card ${hoveredCard === 'data' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('data')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="benefit-header">
                <div className="benefit-icon">📊</div>
                <div className="benefit-label">data acquisition</div>
              </div>
              <p className="benefit-text">
                The business is poised to enhance its data acquisition efforts by collecting a more
                comprehensive set of visitor contact information.
              </p>
            </div>
            
            <div 
              className={`benefit-card large ${hoveredCard === 'website' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('website')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <h3 className="benefit-title">We are here to<br/>Elevate Your Website<br/>Performance</h3>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="fade-in-section" id="reviews">
          <div className="label">📋 customer reviews</div>
          <h2 className="section-title">Trusted By People</h2>
          
          <div className="testimonials-carousel">
            <div 
              className={`testimonial-card ${hoveredCard === 'test1' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('test1')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="testimonial-badge">Customer Stories</div>
              <p className="testimonial-text">
                Reducing our no-show rate was important to have higher utilization of our sales team.
                With Chatify, we brought it down to about 20%, and time is money.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <h4>Elara Steele</h4>
                  <p>Senior VP, Sales and Service, Blue Nile</p>
                </div>
              </div>
              <button className="explore-btn" onClick={() => navigate('/about')}>
                Explore More
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div 
              className={`testimonial-card ${hoveredCard === 'test2' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('test2')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="testimonial-badge">Customer Stories</div>
              <p className="testimonial-text">
                Chatify is so intuitive and user-friendly. Our team finds it very simple to connect,
                share media files instantly, and communicate in real-time.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <h4>Seraphina Quinn</h4>
                  <p>Senior IT Operations Analyst, Alterra Mountain Company</p>
                </div>
              </div>
              <button className="explore-btn" onClick={() => navigate('/about')}>
                Explore More
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div 
              className={`testimonial-card ${hoveredCard === 'test3' ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('test3')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="testimonial-badge">Customer Stories</div>
              <p className="testimonial-text">
                We use Chatify for everything across departments. Group chats, audio-video calls, and instant
                search make collaboration fast and seamless.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-info">
                  <h4>Xander Frost</h4>
                  <p>System Administrator, Allbirds</p>
                </div>
              </div>
              <button className="explore-btn" onClick={() => navigate('/about')}>
                Explore More
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Plans / Pricing Section */}
        <section className="fade-in-section" id="plans" style={{ padding: '80px 2rem' }}>
          <div className="label">💳 flexible options</div>
          <h2 className="section-title centered">Choose Your Plan</h2>
          <p className="section-description centered">
            Start for free and scale seamlessly as your community or team expands.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Free Plan */}
            <div style={{
              background: 'var(--white)',
              border: '2px solid var(--secondary-gray)',
              borderRadius: '24px',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'var(--transition-smooth)',
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#16a34a' }}>Starter</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '12px 0 8px 0' }}>$0 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>/ month</span></h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Perfect for individuals and personal conversations.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '14px', lineHeight: 2, color: 'var(--text-primary)' }}>
                  <li>✓ Unlimited 1-on-1 chats</li>
                  <li>✓ Real-time typing indicators</li>
                  <li>✓ Media & file sharing up to 10MB</li>
                  <li>✓ Standard audio & video calls</li>
                </ul>
              </div>
              <button
                className="btn-register"
                onClick={() => navigate('/register')}
                style={{ width: '100%', background: 'var(--text-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px' }}
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                background: '#22c55e',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                MOST POPULAR
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#4ade80' }}>Pro Team</span>
                <h3 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '12px 0 8px 0', color: '#fff' }}>$9 <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>/ month</span></h3>
                <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>For teams and power users needing advanced groups and storage.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '14px', lineHeight: 2, color: '#f1f5f9' }}>
                  <li>✓ Everything in Starter</li>
                  <li>✓ Unlimited Group channels</li>
                  <li>✓ Priority WebSocket routing</li>
                  <li>✓ 100MB file uploads & analytics</li>
                </ul>
              </div>
              <button
                className="btn-register"
                onClick={() => navigate('/register')}
                style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px' }}
              >
                Start Pro Trial
              </button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta-section fade-in-section">
          <div className="cta-content">
            <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem'}}>
              <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>🌐</div>
              <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>💬</div>
            </div>
            <h2 className="cta-title">
              Connect Instantly,<br/>
              Communicate Effortlessly<br/>
              - Chatify!
            </h2>
            <p style={{fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '2.5rem'}}>
              Seamlessly bridge distances, spark dialogues, and elevate your communication
              game to a whole new level.
            </p>
            <button
              className="btn-primary"
              style={{padding: '1.25rem 2.5rem', fontSize: '1.1rem'}}
              onClick={() => navigate('/register')}
            >
              Get Started
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          <div className="cta-images">
            <div className="cta-image-card">👨‍💼</div>
            <div className="cta-image-card">👩‍💼</div>
            <div className="cta-image-card">✍️</div>
            <div className="cta-image-card">👨‍💼</div>
            <div className="cta-image-card">👩‍💼</div>
            <div className="cta-image-card">💼</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Chatify</h3>
              <p className="footer-description">
                Seamlessly bridge distances, spark dialogues, and elevate your communication.
              </p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
              <a href="#plans" onClick={(e) => { e.preventDefault(); document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing Plans</a>
              <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>Tech Stack & Specs</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Chatify</a>
              <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>Product Architecture</a>
              <a href="/help" onClick={(e) => { e.preventDefault(); navigate('/help'); }}>Support & FAQs</a>
            </div>
            <div className="footer-section">
              <h4>Support & Legal</h4>
              <a href="/help" onClick={(e) => { e.preventDefault(); navigate('/help'); }}>Help Center</a>
              <a href="/help" onClick={(e) => { e.preventDefault(); navigate('/help'); }}>Contact Support</a>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy & Security</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Chatify. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;