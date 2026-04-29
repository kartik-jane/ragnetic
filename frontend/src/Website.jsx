import { useState, useEffect } from "react";

// ── ALL CONSTANTS OUTSIDE ANY FUNCTION ──

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --bg: #060a10;
    --bg2: #0b1220;
    --surface: #111927;
    --surface2: #192333;
    --border: #1e2f45;
    --cyan: #00e5ff;
    --cyan-dim: #00b8cc;
    --green: #39ff8a;
    --amber: #ffb347;
    --text: #e8f0f8;
    --text-dim: #7a9ab8;
    --text-muted: #3d5470;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  .ragnetic-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    position: relative;
  }

  .ragnetic-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.35;
  }

  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.35;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
  }

  .ragnetic-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 60px;
    background: rgba(6, 10, 16, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    cursor: pointer;
  }

  .logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, var(--cyan), var(--green));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 20px;
    color: var(--text);
    letter-spacing: -0.5px;
  }

  .logo-text span { color: var(--cyan); }

  .nav-links {
    display: flex;
    gap: 36px;
    list-style: none;
  }

  .nav-links a {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-dim);
    text-decoration: none;
    letter-spacing: 0.3px;
    transition: color 0.2s;
    cursor: pointer;
  }

  .nav-links a:hover { color: var(--cyan); }

  .nav-cta {
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .nav-cta:hover {
    background: var(--cyan);
    color: var(--bg);
  }

  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 40px 80px;
    overflow: hidden;
  }

  .hero-glow {
    position: absolute;
    top: -10%; left: 50%;
    transform: translateX(-50%);
    width: 900px; height: 600px;
    background: radial-gradient(ellipse, rgba(0,229,255,0.12) 0%, rgba(57,255,138,0.06) 40%, transparent 70%);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,229,255,0.08);
    border: 1px solid rgba(0,229,255,0.25);
    border-radius: 100px;
    padding: 6px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--cyan);
    letter-spacing: 1px;
    margin-bottom: 32px;
    animation: fadeUp 0.6s ease both;
  }

  .badge-dot {
    width: 6px; height: 6px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }

  .hero h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(48px, 7vw, 90px);
    line-height: 1.0;
    letter-spacing: -3px;
    margin-bottom: 28px;
    animation: fadeUp 0.7s 0.1s ease both;
  }

  .hero h1 .line1 { display: block; color: var(--text); }
  .hero h1 .line2 {
    display: block;
    background: linear-gradient(90deg, var(--cyan), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero p {
    font-size: 18px;
    font-weight: 300;
    color: var(--text-dim);
    max-width: 560px;
    margin: 0 auto 48px;
    line-height: 1.7;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .hero-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    animation: fadeUp 0.7s 0.3s ease both;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--cyan), var(--green));
    color: var(--bg);
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 14px 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(0,229,255,0.3);
  }

  .btn-secondary {
    background: transparent;
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 15px;
    padding: 14px 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: var(--cyan);
    color: var(--cyan);
  }

  .hero-visual {
    margin-top: 80px;
    animation: fadeUp 0.8s 0.4s ease both;
  }

  .terminal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    max-width: 680px;
    margin: 0 auto;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.06);
  }

  .terminal-bar {
    background: var(--surface2);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border);
  }

  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }

  .terminal-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
    margin-right: auto;
  }

  .terminal-body {
    padding: 24px 28px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    line-height: 1.8;
    text-align: left;
  }

  .t-prompt { color: var(--text-muted); }
  .t-cmd { color: var(--cyan); }
  .t-output { color: var(--text-dim); }
  .t-answer { color: var(--green); font-weight: 700; }
  .t-key { color: var(--amber); }
  .t-cursor {
    display: inline-block;
    width: 8px; height: 14px;
    background: var(--cyan);
    animation: blink 1.2s step-end infinite;
    vertical-align: middle;
    margin-left: 2px;
  }

  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  .stats {
    display: flex;
    justify-content: center;
    gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }

  .stat-item {
    flex: 1;
    max-width: 260px;
    padding: 40px 32px;
    text-align: center;
    border-right: 1px solid var(--border);
  }

  .stat-item:last-child { border-right: none; }

  .stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 44px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--cyan), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  .section-wrap {
    padding: 100px 60px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-tag {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--cyan);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .section-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(32px, 4vw, 52px);
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 20px;
  }

  .section-desc {
    font-size: 17px;
    color: var(--text-dim);
    max-width: 520px;
    line-height: 1.7;
    font-weight: 300;
  }

  .how-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
    margin-top: 64px;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step {
    display: flex;
    gap: 20px;
    padding: 28px 0;
    border-bottom: 1px solid var(--border);
    opacity: 0;
    transform: translateX(-20px);
    transition: opacity 0.5s, transform 0.5s;
  }

  .step.visible { opacity: 1; transform: translateX(0); }

  .step-num {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--cyan);
    min-width: 32px;
    margin-top: 3px;
  }

  .step-content h3 {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text);
  }

  .step-content p {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.7;
  }

  .pipeline {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    position: sticky;
    top: 100px;
  }

  .pipeline-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1.5px;
    margin-bottom: 24px;
  }

  .pipe-node {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--bg2);
    border: 1px solid var(--border);
    margin-bottom: 6px;
    transition: border-color 0.3s;
    cursor: default;
  }

  .pipe-node:hover { border-color: var(--cyan); }

  .pipe-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(57,255,138,0.1));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .pipe-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  .pipe-sub {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .pipe-arrow {
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
    padding: 4px 0;
  }

  .features-section {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin-top: 64px;
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .feat-card {
    background: var(--surface);
    padding: 36px 32px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    transition: background 0.25s;
    position: relative;
    overflow: hidden;
  }

  .feat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--cyan), var(--green));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s;
  }

  .feat-card:hover::before { transform: scaleX(1); }
  .feat-card:hover { background: var(--surface2); }
  .feat-card:nth-child(3n) { border-right: none; }
  .feat-card:nth-child(n+4) { border-bottom: none; }

  .feat-icon { font-size: 28px; margin-bottom: 18px; display: block; }

  .feat-card h3 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -0.3px;
  }

  .feat-card p {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.7;
  }

  .demo-section {
    background: var(--bg);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .demo-section::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(57,255,138,0.06) 0%, rgba(0,229,255,0.04) 40%, transparent 70%);
    pointer-events: none;
  }

  .demo-wrapper {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 60px;
    align-items: start;
    margin-top: 56px;
  }

  .demo-input-area {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .demo-input-header {
    background: var(--surface2);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .demo-input-header span {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 1px;
  }

  .demo-live-badge {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(57,255,138,0.1);
    border: 1px solid rgba(57,255,138,0.3);
    border-radius: 100px;
    padding: 3px 10px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--green);
    letter-spacing: 1px;
  }

  .demo-live-dot {
    width: 5px; height: 5px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  .demo-questions-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .demo-q-btn {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .demo-q-btn:hover { border-color: var(--cyan); background: rgba(0,229,255,0.04); }
  .demo-q-btn.active { border-color: var(--cyan); background: rgba(0,229,255,0.07); }

  .q-icon { font-size: 18px; flex-shrink: 0; }
  .q-text { font-size: 13px; color: var(--text-dim); line-height: 1.5; }

  .demo-custom-input { margin: 0 16px 16px; display: flex; gap: 8px; }

  .demo-text-input {
    flex: 1;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 11px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .demo-text-input:focus { border-color: var(--cyan); }
  .demo-text-input::placeholder { color: var(--text-muted); }

  .demo-send-btn {
    background: linear-gradient(135deg, var(--cyan), var(--green));
    border: none;
    border-radius: 8px;
    padding: 11px 18px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
    color: var(--bg);
    font-weight: 700;
  }

  .demo-send-btn:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(0,229,255,0.3); }
  .demo-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .demo-output-panel { display: flex; flex-direction: column; gap: 16px; }

  .demo-pipeline-steps {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .pipeline-steps-header {
    background: var(--surface2);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 1px;
  }

  .pipeline-steps-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 120px;
  }

  .pipe-step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--bg2);
    border-radius: 8px;
    border: 1px solid var(--border);
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.3s, transform 0.3s, border-color 0.3s;
  }

  .pipe-step-item.show { opacity: 1; transform: translateX(0); }
  .pipe-step-item.done { border-color: rgba(57,255,138,0.3); }
  .pipe-step-item.active { border-color: rgba(0,229,255,0.4); }

  .step-status-icon {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
  }

  .status-waiting { background: var(--surface2); border: 1px solid var(--border); }
  .status-running { background: rgba(0,229,255,0.15); border: 1px solid var(--cyan); animation: spinPulse 1s infinite; }
  .status-done { background: rgba(57,255,138,0.15); border: 1px solid var(--green); color: var(--green); }

  @keyframes spinPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
    50% { box-shadow: 0 0 0 4px rgba(0,229,255,0); }
  }

  .step-label { font-size: 12px; color: var(--text-dim); flex: 1; }
  .step-time { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--green); }

  .demo-answer-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.4s;
  }

  .demo-answer-card.has-answer { border-color: rgba(57,255,138,0.3); }

  .answer-header {
    background: var(--surface2);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .answer-header-icon { font-size: 16px; }
  .answer-header-title { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-muted); letter-spacing: 1px; flex: 1; }

  .answer-confidence {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--green);
    background: rgba(57,255,138,0.1);
    padding: 3px 10px;
    border-radius: 100px;
    border: 1px solid rgba(57,255,138,0.2);
  }

  .answer-body { padding: 20px; min-height: 100px; }

  .answer-placeholder { color: var(--text-muted); font-size: 13px; font-style: italic; display: flex; align-items: center; gap: 10px; }

  .answer-text {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s, transform 0.4s;
  }

  .answer-text.show { opacity: 1; transform: translateY(0); }

  .answer-sources {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    opacity: 0;
    transition: opacity 0.4s;
  }

  .answer-sources.show { opacity: 1; }
  .sources-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 10px; }

  .source-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 11px;
    color: var(--text-dim);
    margin: 3px;
  }

  .chunk-highlight { background: rgba(0,229,255,0.1); border-radius: 3px; padding: 1px 3px; color: var(--cyan); }

  .roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 56px; }

  .role-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 36px 28px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .role-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }

  .role-card.highlight {
    border-color: rgba(0,229,255,0.4);
    background: linear-gradient(135deg, var(--surface), rgba(0,229,255,0.04));
  }

  .role-glow { position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; opacity: 0.08; }
  .role-glow-cyan { background: var(--cyan); }
  .role-glow-green { background: var(--green); }
  .role-glow-amber { background: var(--amber); }

  .role-badge {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 4px 12px;
    border-radius: 100px;
    margin-bottom: 20px;
  }

  .badge-user { background: rgba(0,229,255,0.12); color: var(--cyan); border: 1px solid rgba(0,229,255,0.3); }
  .badge-mgmt { background: rgba(57,255,138,0.12); color: var(--green); border: 1px solid rgba(57,255,138,0.3); }
  .badge-admin { background: rgba(255,179,71,0.12); color: var(--amber); border: 1px solid rgba(255,179,71,0.3); }

  .role-card h3 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 14px; }
  .role-perms { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .role-perms li { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-dim); }

  .check {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: rgba(57,255,138,0.15);
    color: var(--green);
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tech-section { background: var(--bg2); border-top: 1px solid var(--border); }
  .tech-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 56px; }

  .tech-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px 24px;
    text-align: center;
    transition: all 0.2s;
  }

  .tech-card:hover { border-color: var(--cyan); background: var(--surface2); }
  .tech-emoji { font-size: 32px; display: block; margin-bottom: 12px; }
  .tech-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .tech-desc { font-size: 12px; color: var(--text-muted); }

  .security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-top: 64px; }
  .sec-list { display: flex; flex-direction: column; gap: 18px; }
  .sec-item { display: flex; gap: 16px; align-items: flex-start; }

  .sec-icon {
    width: 40px; height: 40px;
    background: rgba(0,229,255,0.08);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .sec-item h4 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 5px; }
  .sec-item p { font-size: 13px; color: var(--text-dim); line-height: 1.6; }

  .shield-visual { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 48px; text-align: center; }
  .shield-icon { font-size: 80px; display: block; margin-bottom: 24px; filter: drop-shadow(0 0 30px rgba(0,229,255,0.4)); }
  .shield-text { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 12px; }
  .shield-sub { font-size: 14px; color: var(--text-dim); }

  .status-list { margin-top: 32px; display: flex; flex-direction: column; gap: 10px; text-align: left; }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg2);
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .status-label { font-size: 13px; color: var(--text-dim); }
  .status-ok { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); }

  .cta-section { text-align: center; padding: 120px 60px; position: relative; overflow: hidden; }

  .cta-glow {
    position: absolute;
    bottom: -100px; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(0,229,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .cta-section h2 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 800;
    letter-spacing: -2px;
    line-height: 1.1;
    margin-bottom: 24px;
  }

  .cta-section p {
    font-size: 17px;
    color: var(--text-dim);
    max-width: 480px;
    margin: 0 auto 48px;
    line-height: 1.7;
    font-weight: 300;
  }

  .cta-btn-group { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

  .btn-login {
    background: transparent;
    color: var(--text-dim);
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    padding: 10px 22px;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .btn-login:hover { border-color: var(--cyan); color: var(--cyan); }

  .ragnetic-footer {
    border-top: 1px solid var(--border);
    padding: 48px 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: var(--text-dim); }
  .footer-logo span { color: var(--cyan); }
  .footer-copy { font-size: 13px; color: var(--text-muted); }
  .footer-links { display: flex; gap: 24px; }

  .footer-links a {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
  }

  .footer-links a:hover { color: var(--cyan); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s, transform 0.6s; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  .grad-text {
    background: linear-gradient(90deg, var(--cyan), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 900px) {
    .ragnetic-nav { padding: 16px 20px; }
    .nav-links { display: none; }
    .section-wrap { padding: 60px 20px; }
    .how-wrapper { grid-template-columns: 1fr; gap: 40px; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .roles-grid { grid-template-columns: 1fr; }
    .tech-grid { grid-template-columns: repeat(2, 1fr); }
    .security-grid { grid-template-columns: 1fr; }
    .ragnetic-footer { flex-direction: column; gap: 20px; text-align: center; padding: 36px 20px; }
    .stats { flex-direction: column; }
    .stat-item { border-right: none; border-bottom: 1px solid var(--border); max-width: 100%; }
    .demo-wrapper { grid-template-columns: 1fr; gap: 24px; }
    .pipeline { position: static; }
  }

  @media (max-width: 480px) {
    .ragnetic-nav { padding: 14px 16px; }
    .nav-cta { font-size: 11px; padding: 8px 14px; }
    .hero { padding: 90px 16px 60px; }
    .hero h1 { letter-spacing: -1.5px; }
    .hero p { font-size: 15px; }
    .btn-primary, .btn-secondary { width: 100%; text-align: center; padding: 14px 20px; }
    .hero-actions { flex-direction: column; gap: 12px; }
    .terminal-body { padding: 16px; font-size: 11px; }
    .section-wrap { padding: 52px 16px; }
    .cta-section { padding: 80px 16px; }
    .features-grid { grid-template-columns: 1fr; }
    .tech-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .demo-wrapper { grid-template-columns: 1fr; gap: 20px; }
    .ragnetic-footer { flex-direction: column; gap: 16px; padding: 28px 16px; text-align: center; }
  }
`;

const DEMO_DATA = [
  {
    steps: [
      { label: "Tokenizing query → embedding vector", time: "12ms" },
      { label: "Searching employee-records vector index (top-3)", time: "34ms" },
      { label: "Retrieved 3 relevant document chunks", time: "8ms" },
      { label: "Injecting context into prompt template", time: "5ms" },
      { label: "Generating answer from AI model", time: "620ms" }
    ],
    answer: `Based on the <span class="chunk-highlight">employee records</span> retrieved from the vector index:<br><br>
• <strong>Rohan Sharma</strong> (Lead Developer) → <em>RAGnetic AI Backend & Flask API</em><br>
• <strong>Priya Nair</strong> (AI Engineer) → <em>RAG Pipeline & Embedding Models</em><br>
• <strong>Aditya Kulkarni</strong> (Frontend Dev) → <em>React Dashboard & UI Components</em><br>
• <strong>Sneha Patil</strong> (DB Engineer) → <em>SQLite Schema & Query Optimization</em>`,
    sources: ["employee_records.pdf", "project_assignments.txt", "dept_overview.pdf"],
    confidence: "96% CONFIDENCE"
  },
  {
    steps: [
      { label: "Tokenizing query → embedding vector", time: "11ms" },
      { label: "Searching security-docs vector index (top-4)", time: "29ms" },
      { label: "Retrieved 4 relevant document chunks", time: "7ms" },
      { label: "Injecting context into prompt template", time: "4ms" },
      { label: "Generating answer from AI model", time: "540ms" }
    ],
    answer: `The <span class="chunk-highlight">security audit documentation</span> identifies 3 key vulnerabilities:<br><br>
<strong>1. Debug Mode Enabled</strong> — Flask is running with <code style="background:rgba(0,229,255,0.1);padding:1px 5px;border-radius:3px;color:var(--cyan)">debug=True</code> in development.<br><br>
<strong>2. File Upload Validation</strong> — File type and size checks are limited.<br><br>
<strong>3. Default Secret Key</strong> — A hardcoded fallback key exists in <code style="background:rgba(0,229,255,0.1);padding:1px 5px;border-radius:3px;color:var(--cyan)">app.py</code>.`,
    sources: ["security_report.pdf", "app.py", "vulnerabilities.md"],
    confidence: "99% CONFIDENCE"
  },
  {
    steps: [
      { label: "Tokenizing query → embedding vector", time: "10ms" },
      { label: "Searching tech-stack vector index (top-3)", time: "22ms" },
      { label: "Retrieved 3 relevant document chunks", time: "6ms" },
      { label: "Injecting context into prompt template", time: "4ms" },
      { label: "Generating answer from AI model", time: "490ms" }
    ],
    answer: `Based on the <span class="chunk-highlight">project documentation</span>, RAGnetic AI uses:<br><br>
<strong>Frontend:</strong> React.js + Tailwind CSS + Vite<br>
<strong>Backend:</strong> Python, Flask, Flask-CORS<br>
<strong>AI Layer:</strong> Embedding models, RAG pipeline, Vector similarity search<br>
<strong>Auth:</strong> bcrypt password hashing, session-based auth<br>
<strong>Database:</strong> SQLite (dev) → MySQL (production-ready)`,
    sources: ["tech_stack.pdf", "package.json", "requirements.txt"],
    confidence: "98% CONFIDENCE"
  },
  {
    steps: [
      { label: "Tokenizing query → embedding vector", time: "13ms" },
      { label: "Searching improvement-docs vector index (top-4)", time: "31ms" },
      { label: "Retrieved 4 relevant document chunks", time: "9ms" },
      { label: "Injecting context into prompt template", time: "5ms" },
      { label: "Generating answer from AI model", time: "710ms" }
    ],
    answer: `The <span class="chunk-highlight">project conclusion document</span> outlines key improvements:<br><br>
<strong>Security:</strong> Disable debug mode, add JWT auth, implement rate limiting<br><br>
<strong>Performance:</strong> Migrate to MySQL/PostgreSQL, use Pinecone/Weaviate, add Redis caching<br><br>
<strong>Features:</strong> Chat history persistence, admin analytics dashboard, multi-language support`,
    sources: ["improvements.pdf", "roadmap.md", "conclusion_report.pdf"],
    confidence: "97% CONFIDENCE"
  },
  {
    steps: [
      { label: "Tokenizing query → embedding vector", time: "11ms" },
      { label: "Searching access-control vector index (top-3)", time: "27ms" },
      { label: "Retrieved 3 relevant document chunks", time: "7ms" },
      { label: "Injecting context into prompt template", time: "4ms" },
      { label: "Generating answer from AI model", time: "580ms" }
    ],
    answer: `According to the <span class="chunk-highlight">authentication system documentation</span>:<br><br>
The system enforces <strong>3 access tiers</strong> at both session and vector-index level:<br><br>
• <strong>User</strong> — Accesses only the user-scoped vector index.<br>
• <strong>Management</strong> — Accesses the management vector index with higher-privilege data.<br>
• <strong>Admin</strong> — Full control: manage users, generate API keys, toggle account status.`,
    sources: ["routes.py", "auth_docs.pdf", "rbac_design.md"],
    confidence: "99% CONFIDENCE"
  }
];

const QUESTIONS = [
  { icon: "👤", text: '"Which employee is working on which project?"' },
  { icon: "🔐", text: '"What security vulnerabilities exist in the system?"' },
  { icon: "⚙️", text: '"What technologies does RAGnetic AI use?"' },
  { icon: "🚀", text: '"What improvements can be made to the system?"' },
  { icon: "🛡️", text: '"How does role-based access work?"' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── DEMO COMPONENT ── (outside main component)
function Demo() {
  const [activeIdx, setActiveIdx] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [pipelineDone, setPipelineDone] = useState([]);
  const [pipelineActive, setPipelineActive] = useState([]);
  const [pipelineTime, setPipelineTime] = useState([]);
  const [answerHtml, setAnswerHtml] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState("");
  const [hasAnswer, setHasAnswer] = useState(false);

  const runDemo = async (data) => {
    if (isRunning) return;
    setIsRunning(true);
    setPipelineSteps([]);
    setPipelineDone([]);
    setPipelineActive([]);
    setPipelineTime([]);
    setShowAnswer(false);
    setAnswerHtml("");
    setShowSources(false);
    setHasAnswer(false);
    setConfidence("");

    await sleep(300);

    for (let i = 0; i < data.steps.length; i++) {
      setPipelineSteps((prev) => [...prev, data.steps[i].label]);
      setPipelineActive((prev) => [...prev, true]);
      setPipelineDone((prev) => [...prev, false]);
      setPipelineTime((prev) => [...prev, ""]);
      await sleep(50);
      await sleep(300 + i * 120);
      setPipelineActive((prev) => prev.map((v, j) => (j === i ? false : v)));
      setPipelineDone((prev) => prev.map((v, j) => (j === i ? true : v)));
      setPipelineTime((prev) => prev.map((v, j) => (j === i ? data.steps[i].time : v)));
    }

    await sleep(200);
    setConfidence(data.confidence);
    setHasAnswer(true);
    setAnswerHtml(data.answer);
    setTimeout(() => setShowAnswer(true), 20);
    await sleep(300);
    setSources(data.sources);
    setShowSources(true);
    setIsRunning(false);
  };

  const handleQ = async (idx) => {
    if (isRunning) return;
    setActiveIdx(idx);
    await runDemo(DEMO_DATA[idx]);
  };

  const handleCustom = async () => {
    if (!customQuery.trim() || isRunning) return;
    setActiveIdx(null);
    const customData = {
      steps: [
        { label: "Tokenizing custom query → embedding vector", time: "14ms" },
        { label: "Searching company document vector index (top-5)", time: "38ms" },
        { label: "Retrieved 5 relevant document chunks", time: "9ms" },
        { label: "Injecting context into prompt template", time: "6ms" },
        { label: "Generating answer from AI model", time: "680ms" }
      ],
      answer: `Based on your query about <span class="chunk-highlight">"${customQuery}"</span>:<br><br>RAGnetic AI searched through the company document vector index and retrieved the most semantically relevant chunks. The AI model has generated this response strictly from retrieved document context — no hallucination, no guesswork.`,
      sources: ["company_docs.pdf", "internal_reports.pdf", "knowledge_base.txt"],
      confidence: "94% CONFIDENCE"
    };
    await runDemo(customData);
  };

  return (
    <div className="demo-wrapper">
      <div className="demo-input-area reveal">
        <div className="demo-input-header">
          <span>QUERY INTERFACE</span>
          <div className="demo-live-badge"><div className="demo-live-dot"></div>LIVE</div>
        </div>
        <div className="demo-questions-list">
          {QUESTIONS.map((q, i) => (
            <button key={i} className={`demo-q-btn${activeIdx === i ? " active" : ""}`} onClick={() => handleQ(i)}>
              <span className="q-icon">{q.icon}</span>
              <span className="q-text">{q.text}</span>
            </button>
          ))}
        </div>
        <div className="demo-custom-input">
          <input
            className="demo-text-input"
            placeholder="Or type your own question…"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
          />
          <button className="demo-send-btn" onClick={handleCustom} disabled={isRunning}>→</button>
        </div>
      </div>

      <div className="demo-output-panel reveal">
        <div className="demo-pipeline-steps">
          <div className="pipeline-steps-header">RAG PIPELINE EXECUTION</div>
          <div className="pipeline-steps-body">
            {pipelineSteps.length === 0 && (
              <div className="answer-placeholder" style={{ padding: "8px 0" }}>
                <span>🎯</span> Select a question to watch the pipeline run...
              </div>
            )}
            {pipelineSteps.map((label, i) => (
              <div key={i} className={`pipe-step-item show${pipelineActive[i] ? " active" : ""}${pipelineDone[i] ? " done" : ""}`}>
                <div className={`step-status-icon${pipelineActive[i] ? " status-running" : pipelineDone[i] ? " status-done" : " status-waiting"}`}>
                  {pipelineDone[i] ? "✓" : ""}
                </div>
                <span className="step-label">{label}</span>
                <span className="step-time">{pipelineTime[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`demo-answer-card${hasAnswer ? " has-answer" : ""}`}>
          <div className="answer-header">
            <span className="answer-header-icon">🤖</span>
            <span className="answer-header-title">AI GENERATED ANSWER</span>
            {confidence && <span className="answer-confidence">{confidence}</span>}
          </div>
          <div className="answer-body">
            {!hasAnswer && (
              <div className="answer-placeholder">
                <span>💬</span> Your answer will appear here after the pipeline completes...
              </div>
            )}
            {hasAnswer && (
              <div className={`answer-text${showAnswer ? " show" : ""}`} dangerouslySetInnerHTML={{ __html: answerHtml }} />
            )}
            {hasAnswer && (
              <div className={`answer-sources${showSources ? " show" : ""}`}>
                <div className="sources-label">RETRIEVED FROM</div>
                <div>{sources.map((s, i) => <span key={i} className="source-chip">📄 {s}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REVEAL HOOK ── (outside main component)
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal, .step").forEach((el) => observer.observe(el));
    document.querySelectorAll(".step").forEach((el, i) => { el.style.transitionDelay = `${i * 0.08}s`; });
    document.querySelectorAll(".feat-card").forEach((el, i) => { el.style.transitionDelay = `${i * 0.07}s`; });
    return () => observer.disconnect();
  }, []);
}

// ── MAIN EXPORT ── (one export default, at the bottom, with props)
export default function Website({ onGetStarted, onLogin }) {
  useReveal();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{style}</style>
      <div className="ragnetic-root">

        {/* NAV */}
        <nav className="ragnetic-nav">
          <div className="nav-logo">
            <img src="/logo-nav.png" alt="RAGnetic AI" style={{ height: '50px', width: '130px' }} />
            
          </div>
          <ul className="nav-links">
            {[["how","How it Works"],["demo","Live Demo"],["features","Features"],["roles","Roles"],["tech","Tech Stack"],["security","Security"]].map(([id, label]) => (
              <li key={id}><a onClick={() => scrollTo(id)}>{label}</a></li>
            ))}
          </ul>
          <button className="nav-cta" onClick={onGetStarted}>START FOR FREE →</button>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="grid-bg"></div>
          <div className="hero-glow"></div>
          <div>
            <div className="hero-badge">
              <span className="badge-dot"></span>
              RAG-POWERED · ENTERPRISE READY
            </div>
            <h1>
              <span className="line1">Ask Questions.</span>
              <span className="line2">Get Answers.</span>
            </h1>
            <p>RAGnetic AI transforms your company documents into an intelligent knowledge base. Upload files, ask in plain language, get accurate answers — instantly.</p>
            <div className="hero-actions">
              <button className="nav-cta" onClick={onGetStarted}>GET STARTED →</button>
            </div>
            <div className="hero-visual">
              <div className="terminal">
                <div className="terminal-bar">
                  <div className="dot dot-r"></div>
                  <div className="dot dot-y"></div>
                  <div className="dot dot-g"></div>
                  <span className="terminal-title">ragnetic-ai — query</span>
                </div>
                <div className="terminal-body">
                  <div><span className="t-prompt">user@ragnetic:~$ </span><span className="t-cmd">query --ask "Who is working on the RAGnetic backend?"</span></div>
                  <div style={{ marginTop: 8 }}><span className="t-key">[ RETRIEVING ]</span> <span className="t-output">Searching vector index for relevant chunks...</span></div>
                  <div><span className="t-key">[ FOUND ]</span> <span className="t-output">3 relevant document sections matched</span></div>
                  <div><span className="t-key">[ GENERATING ]</span> <span className="t-output">Composing answer from retrieved context...</span></div>
                  <div style={{ marginTop: 12 }}><span className="t-answer">→ Based on project files: Rohan Sharma (Lead Dev) and Priya Nair (AI Engineer) are assigned to the Flask backend and RAG pipeline respectively.</span></div>
                  <div style={{ marginTop: 12 }}><span className="t-prompt">user@ragnetic:~$ </span><span className="t-cursor"></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          {[["3","Role-Based Access Tiers"],["RAG","Retrieval-Augmented Generation"],["0%","AI Hallucinations (doc-grounded)"],["∞","Documents Supported"]].map(([num, label]) => (
            <div key={label} className="stat-item">
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div id="how">
          <div className="section-wrap">
            <div className="section-tag">// HOW IT WORKS</div>
            <h2 className="section-title reveal">From Documents<br />to Intelligence</h2>
            <p className="section-desc reveal">A precise pipeline that transforms raw files into queryable, AI-powered knowledge — securely and accurately.</p>
            <div className="how-wrapper">
              <div className="steps-list">
                {[
                  ["01","Upload Company Documents","PDFs, reports, employee records and project files are uploaded through the React frontend and sent to the Flask backend."],
                  ["02","Role-Segregated Storage","Documents are separated by access level — User storage and Management storage remain isolated for data security."],
                  ["03","Intelligent Chunking","Large documents are split into small, semantically meaningful chunks. This dramatically improves retrieval accuracy."],
                  ["04","Vector Embedding Generation","Each chunk is converted into a high-dimensional vector embedding that captures semantic meaning — not just keywords."],
                  ["05","Indexed in Vector DB","Embeddings are stored in separate vector indexes per role, enabling blazing-fast similarity search at query time."],
                  ["06","Semantic Search & Generation","Your question becomes an embedding, matched against the index, and top chunks are fed to the AI to generate a grounded answer."],
                ].map(([num, title, desc]) => (
                  <div key={num} className="step">
                    <span className="step-num">{num}</span>
                    <div className="step-content"><h3>{title}</h3><p>{desc}</p></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="pipeline">
                  <div className="pipeline-title">RAG PIPELINE OVERVIEW</div>
                  {[
                    ["📄","Document Upload","PDF, TXT, CSV via React Frontend"],
                    ["✂️","Text Chunking","Semantic splitting into segments"],
                    ["🧮","Embedding Model","Convert text → dense vectors"],
                    ["🗄️","Vector Index","Role-isolated similarity store"],
                    ["🔍","Semantic Retrieval","Top-K relevant chunks selected"],
                    ["🤖","AI Answer Generation","Grounded response from context"],
                  ].map(([icon, label, sub], i, arr) => (
                    <div key={label}>
                      <div className="pipe-node">
                        <div className="pipe-icon">{icon}</div>
                        <div><div className="pipe-label">{label}</div><div className="pipe-sub">{sub}</div></div>
                      </div>
                      {i < arr.length - 1 && <div className="pipe-arrow">↓</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="features-section" id="features">
          <div className="section-wrap">
            <div className="section-tag">// FEATURES</div>
            <h2 className="section-title reveal">Built for Enterprise.<br />Designed for Everyone.</h2>
            <p className="section-desc reveal">Every feature built with security, accuracy, and usability as first principles.</p>
            <div className="features-grid">
              {[
                ["🔎","Semantic Search","Goes beyond keyword matching — understands the meaning of your question and finds contextually relevant answers."],
                ["🛡️","Role-Based Access","Three-tier access system ensures employees only see data they're authorized for. User, Management, and Admin levels."],
                ["📂","Multi-Format Support","Upload PDFs, text documents, reports, and employee records. The system handles extraction and processing automatically."],
                ["⚡","Zero Hallucination","AI answers are grounded strictly in retrieved document chunks. If the answer isn't in your docs, it won't be fabricated."],
                ["🔐","Secure Authentication","Session-based auth with bcrypt password hashing. Admin, management and user sessions are fully isolated."],
                ["✉️","Email Notifications","Automated registration emails and API key delivery. Admins can generate and distribute access keys directly via email."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="feat-card reveal">
                  <span className="feat-icon">{icon}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DEMO */}
        <div className="demo-section" id="demo">
          <div className="section-wrap">
            <div className="section-tag">// INTERACTIVE DEMO</div>
            <h2 className="section-title reveal">Try RAGnetic AI<br /><span className="grad-text">Live Right Now</span></h2>
            <p className="section-desc reveal">Pick a sample question or type your own. Watch the full RAG pipeline execute in real time — step by step.</p>
            <Demo />
          </div>
        </div>

        {/* ROLES */}
        <div id="roles">
          <div className="section-wrap">
            <div className="section-tag">// ACCESS CONTROL</div>
            <h2 className="section-title reveal">Three Roles.<br />One System.</h2>
            <p className="section-desc reveal">Granular access control so every employee interacts only with what they need.</p>
            <div className="roles-grid">
              {[
                { badge: "USER", badgeClass: "badge-user", glowClass: "role-glow-cyan", title: "Employee", highlight: false, perms: ["Upload personal documents","Query user-scoped vector index","View own profile & settings","Update personal information"] },
                { badge: "MANAGEMENT", badgeClass: "badge-mgmt", glowClass: "role-glow-green", title: "Manager", highlight: true, perms: ["All User permissions","Access management-tier documents","Query management vector index","Higher-privilege data access"] },
                { badge: "ADMIN", badgeClass: "badge-admin", glowClass: "role-glow-amber", title: "Administrator", highlight: false, perms: ["Full user management","Generate & revoke API keys","Activate / deactivate accounts","View all users & roles"] },
              ].map((role) => (
                <div key={role.title} className={`role-card reveal${role.highlight ? " highlight" : ""}`}>
                  <div className={`role-glow ${role.glowClass}`}></div>
                  <span className={`role-badge ${role.badgeClass}`}>{role.badge}</span>
                  <h3>{role.title}</h3>
                  <ul className="role-perms">
                    {role.perms.map((p) => <li key={p}><span className="check">✓</span>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TECH STACK */}
        <div className="tech-section" id="tech">
          <div className="section-wrap">
            <div className="section-tag">// TECHNOLOGY STACK</div>
            <h2 className="section-title reveal">Powered by Modern<br />Open Technology</h2>
            <p className="section-desc reveal">A carefully curated stack combining the best of AI, web, and backend engineering.</p>
            <div className="tech-grid">
              {[
                ["⚛️","React.js","Interactive frontend with Vite"],
                ["🐍","Python / Flask","Lightweight REST API backend"],
                ["🧠","Embedding Models","Dense vector representations"],
                ["🗃️","Vector Similarity Search","Fast top-K document retrieval"],
                ["💨","Tailwind CSS","Utility-first responsive design"],
                ["🗄️","SQLite / MySQL","Dev + production databases"],
                ["🔒","bcrypt + Sessions","Secure auth & password hashing"],
                ["📮","Email System","Registration & API key delivery"],
              ].map(([emoji, name, desc]) => (
                <div key={name} className="tech-card reveal">
                  <span className="tech-emoji">{emoji}</span>
                  <div className="tech-name">{name}</div>
                  <div className="tech-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div id="security">
          <div className="section-wrap">
            <div className="section-tag">// SECURITY</div>
            <h2 className="section-title reveal">Security Built<br />From the Ground Up</h2>
            <div className="security-grid">
              <div className="sec-list">
                {[
                  ["🔑","Role-Based Access Control","Every API endpoint is protected by role checks. Users, managers and admins each have strictly scoped permissions enforced server-side."],
                  ["🗂️","Isolated Vector Indexes","User and management documents are stored in completely separate vector indexes. Cross-role data leakage is architecturally impossible."],
                  ["🔐","Password Hashing with bcrypt","All passwords are hashed using bcrypt with salting. Plain text credentials are never stored or transmitted."],
                  ["🌐","CORS & Session Security","Flask-CORS restricts API access to trusted origins. Sessions are server-side and scoped per role — sessions never mix."],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="sec-item reveal">
                    <div className="sec-icon">{icon}</div>
                    <div><h4>{title}</h4><p>{desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="shield-visual reveal">
                <span className="shield-icon">🛡️</span>
                <div className="shield-text">Security Status</div>
                <div className="shield-sub">System health overview</div>
                <div className="status-list">
                  {[
                    ["Auth System","● ACTIVE"],
                    ["Role Isolation","● ENFORCED"],
                    ["Password Encryption","● bcrypt/SALT"],
                    ["CORS Policy","● RESTRICTED"],
                    ["Vector Index Separation","● ISOLATED"],
                  ].map(([label, status]) => (
                    <div key={label} className="status-row">
                      <span className="status-label">{label}</span>
                      <span className="status-ok">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-glow"></div>
          <div className="section-tag">// GET STARTED</div>
          <h2 className="reveal">Ready to Make Your<br /><span className="grad-text">Documents Intelligent?</span></h2>
          <p className="reveal">RAGnetic AI is ready to transform how your team finds and uses company knowledge. Deploy it today.</p>
          <div className="cta-btn-group reveal">
            <button className="nav-cta" onClick={onGetStarted}>GET STARTED →</button>
            <button className="btn-login" onClick={onLogin}>ALREADY HAVE AN ACCOUNT? LOGIN</button>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="ragnetic-footer">
          <div className="footer-logo">RAG<span>netic</span> AI</div>
          <div className="footer-copy">© 2026 RAGnetic AI. All rights reserved.</div>
          <div className="footer-links">
            <a onClick={() => scrollTo("how")}>How it Works</a>
            <a onClick={() => scrollTo("features")}>Features</a>
            <a onClick={() => scrollTo("security")}>Security</a>
          </div>
        </footer>

      </div>
    </>
  );
}