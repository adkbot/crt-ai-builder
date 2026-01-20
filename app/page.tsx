"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="hero-container">
      {/* Video Background */}
      <div className="video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-video"
        >
          <source src="/videos/14683955_3840_2160_30fps.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Hero Content */}
      <div className={`hero-content ${mounted ? 'fade-in' : ''}`}>
        <div className="hero-badge">
          <span className="badge-icon">🤖</span>
          <span className="badge-text">v2.3 - Sistema Inteligente</span>
        </div>

        <h1 className="hero-title">
          <span className="gradient-text">CRT AI Builder</span>
        </h1>

        <p className="hero-subtitle">
          Crie Expert Advisors profissionais com IA Adaptativa
        </p>

        <div className="hero-features">
          <div className="feature-item">
            <span className="feature-icon">🧠</span>
            <span>Q-Learning Adaptativo</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>75%+ Confiança</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Sem Cegueira de Contexto</span>
          </div>
        </div>

        <div className="hero-actions">
          <Link href="/editor" className="btn-primary">
            <span>✏️ Abrir Editor</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link href="/chat" className="btn-secondary">
            <span>💬 Chat IA</span>
          </Link>
        </div>

        <div className="hero-info">
          <div className="info-card">
            <h3>🎯 Como rodar</h3>
            <ol>
              <li>npm run dev</li>
              <li>Abra o editor visual</li>
              <li>Conecte os nós</li>
            </ol>
          </div>

          <div className="info-card">
            <h3>📦 Deploy (Vercel)</h3>
            <p>Push no GitHub → Import no Vercel → Deploy.</p>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">10+</div>
            <div className="stat-label">Tipos de Nós</div>
          </div>
          <div className="stat">
            <div className="stat-value">6</div>
            <div className="stat-label">Features de Contexto</div>
          </div>
          <div className="stat">
            <div className="stat-value">75%</div>
            <div className="stat-label">Min. Confiança</div>
          </div>
          <div className="stat">
            <div className="stat-value">100%</div>
            <div className="stat-label">Funcional</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <div className="scroll-text">Scroll para saber mais</div>
      </div>
    </div>
  );
}
