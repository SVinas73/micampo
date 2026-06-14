"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/mc/Icon";

/**
 * Landing pública de MiCampo (antes del login).
 * Estilo "Functional Organicism / AgroTech Precision" adaptado al sistema real:
 * canvas de papel cálido, verde hoja como primario, tarjetas suaves, tipografía
 * editorial (Instrument Serif) + Inter + JetBrains Mono. Soporta claro/oscuro.
 */
export default function LandingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("micampo:landing-theme");
      if (saved === "dark") setDark(true);
    } catch {}
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem("micampo:landing-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const servicios = [
    { icon: "leaf", tint: "var(--ag-success)", fg: "var(--ag-primary)", title: "Campo Digital", desc: "Mapa satelital con capas NDVI, humedad y topografía. Seguí el estado de cada lote, sus cultivos y su sanidad en tiempo real." },
    { icon: "bug", tint: "var(--ag-hay)", fg: "var(--ag-warning)", title: "Detección de Enfermedades IA", desc: "Subí una foto del cultivo y la IA detecta la plaga o enfermedad, su severidad y la estrategia de control con dosis y costo." },
    { icon: "droplet", tint: "var(--ag-secondary-container)", fg: "var(--ag-info)", title: "Plan de Riego Inteligente", desc: "Balance hídrico proyectado y sugerencias de riego que evitan el estrés del cultivo, optimizando agua y rinde." },
    { icon: "flask", tint: "var(--ag-success)", fg: "var(--ag-primary)", title: "Análisis de Suelo", desc: "Mapeo de N, P, K, pH y materia orgánica por lote, con recetas de fertilización generadas automáticamente." },
    { icon: "cow", tint: "var(--ag-hay)", fg: "var(--ag-tertiary)", title: "Ganadería Trazable", desc: "Rodeo, peso, nutrición, reproducción y sanidad con trazabilidad SENASA y documentación de movimientos al día." },
    { icon: "sprout", tint: "var(--ag-secondary-container)", fg: "var(--ag-info)", title: "Planificación con IA", desc: "Planes de siembra recomendados por IA con su razonamiento, proyección económica y conversión directa en órdenes de trabajo." },
  ];

  return (
    <div className={`ag ${dark ? "ag-dark" : ""}`}>
      {/* ===== NAV ===== */}
      <nav className="ag-nav">
        <div className="ag-nav__inner">
          <div className="ag-logo">
            <span className="ag-logo__mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3c-3 4-4 8-4 11a4 4 0 0 0 8 0c0-3-1-7-4-11z" />
                <path d="M12 14v7" />
              </svg>
            </span>
            MiCampo
          </div>
          <div className="ag-nav__links">
            <a href="#inicio" className="is-active">Inicio</a>
            <a href="#servicios">Servicios</a>
            <a href="#nosotros">Sobre Nosotros</a>
            <a href="#contacto">Contacto</a>
          </div>
          <div className="ag-nav__actions">
            <button className="ag-iconbtn" onClick={toggle} title={dark ? "Modo claro" : "Modo oscuro"} aria-label="Cambiar tema">
              <Icon name={dark ? "sun" : "cloud"} size={18} />
            </button>
            <button className="ag-btn ag-btn--ghost" onClick={() => router.push("/login")}>Login</button>
            <button className="ag-btn ag-btn--primary" onClick={() => router.push("/register")}>Registrarse</button>
          </div>
        </div>
      </nav>

      <main>
        {/* ===== HERO ===== */}
        <section id="inicio" className="ag-hero">
          <div className="ag-hero__pattern" />
          <div className="ag-hero__glow ag-hero__glow--1" />
          <div className="ag-hero__glow ag-hero__glow--2" />
          <div className="ag-hero__inner">
            <span className="ag-eyebrow">El sistema nervioso central del agro moderno</span>
            <h1 className="ag-display">Revolucioná la gestión de tu campo</h1>
            <p className="ag-subtitle">
              Monitoreo preciso, decisiones inteligentes con IA y mayor productividad. Toda tu agricultura y ganadería, en un solo lugar.
            </p>
            <div className="ag-hero__cta">
              <button className="ag-btn ag-btn--primary ag-btn--lg" onClick={() => router.push("/register")}>
                Empezar ahora <Icon name="arrowRight" size={18} />
              </button>
              <button className="ag-btn ag-btn--secondary ag-btn--lg" onClick={() => router.push("/login")}>
                Ya tengo cuenta
              </button>
            </div>
            <div className="ag-hero__stats">
              <div><strong>558 Ha</strong><span>productivas gestionadas</span></div>
              <div><strong>96%</strong><span>precisión de la IA</span></div>
              <div><strong>SENASA</strong><span>trazabilidad al día</span></div>
            </div>
          </div>
        </section>

        {/* ===== SERVICIOS ===== */}
        <section id="servicios" className="ag-section ag-section--surface">
          <div className="ag-container">
            <div className="ag-section__head">
              <h2 className="ag-headline">Herramientas para el Agro Digital</h2>
              <p className="ag-section__sub">Control total sobre cada hectárea con tecnología de precisión.</p>
            </div>
            <div className="ag-grid">
              {servicios.map((s) => (
                <div key={s.title} className="ag-card">
                  <div className="ag-card__icon" style={{ background: s.tint, color: s.fg }}>
                    <Icon name={s.icon} size={22} />
                  </div>
                  <h3 className="ag-card__title">{s.title}</h3>
                  <p className="ag-card__desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== NOSOTROS ===== */}
        <section id="nosotros" className="ag-section ag-section--paper">
          <div className="ag-container ag-about">
            <div className="ag-about__visual">
              <div className="ag-about__visual-bg" />
              <div className="ag-about__panel">
                <div className="ag-about__panel-row"><span>NDVI · Lote Norte 1</span><strong style={{ color: "var(--ag-primary)" }}>0.78 ▲</strong></div>
                <div className="ag-about__panel-row"><span>Agua útil</span><strong>62%</strong></div>
                <div className="ag-about__panel-row"><span>Preñez rodeo</span><strong>78%</strong></div>
                <div className="ag-about__panel-bars">
                  {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
                    <span key={i} style={{ height: `${h}%`, background: i === 3 ? "var(--ag-primary)" : "var(--ag-primary-dim)" }} />
                  ))}
                </div>
                <div className="ag-about__panel-foot">Telemetría en vivo · actualizado hace 2 min</div>
              </div>
            </div>
            <div className="ag-about__text">
              <span className="ag-eyebrow">Sobre Nosotros</span>
              <h2 className="ag-headline">Digitalizando el campo, hectárea a hectárea.</h2>
              <p>
                En MiCampo creemos que el futuro de la agricultura está en el cruce entre la experiencia del terreno y la telemetría avanzada. Nuestra misión es darle a agrónomos y productores herramientas de precisión de grado profesional, que se sientan naturales de usar.
              </p>
              <p>
                Diseñado para resistir las exigencias del trabajo a campo y, a la vez, entregar información vital, MiCampo traduce datos complejos en acciones claras para maximizar el rendimiento y la sostenibilidad.
              </p>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section id="contacto" className="ag-section ag-cta">
          <div className="ag-cta__glow ag-cta__glow--1" />
          <div className="ag-cta__glow ag-cta__glow--2" />
          <div className="ag-cta__inner">
            <h2 className="ag-display ag-display--sm">¿Listo para el próximo ciclo de cultivo?</h2>
            <p className="ag-subtitle">Sumate a los productores que ya optimizan su gestión con MiCampo.</p>
            <div className="ag-hero__cta">
              <button className="ag-btn ag-btn--primary ag-btn--lg" onClick={() => router.push("/register")}>Registrarse ahora</button>
              <button className="ag-btn ag-btn--secondary ag-btn--lg" onClick={() => router.push("/login")}>Iniciar sesión</button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="ag-footer">
        <div className="ag-container ag-footer__inner">
          <div className="ag-logo ag-logo--sm">MiCampo</div>
          <div className="ag-footer__copy">© {new Date().getFullYear()} MiCampo · Gestión Agropecuaria de Precisión. Todos los derechos reservados.</div>
          <div className="ag-footer__links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Soporte</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .ag {
          /* ===== Paleta AgroTech Precision — CLARO ===== */
          --ag-bg: #f6fbf5;
          --ag-paper: #f6f5f0;
          --ag-sand: #faf9f4;
          --ag-hay: #f1efe7;
          --ag-surface: #ffffff;
          --ag-surface-low: #f0f5ef;
          --ag-surface-high: #e5e9e4;
          --ag-on-surface: #181d1a;
          --ag-on-variant: #3d4a3b;
          --ag-muted: #6d7b6a;
          --ag-outline: #e6e8e4;
          --ag-primary: #006b21;
          --ag-primary-dim: #59e069;
          --ag-on-primary: #ffffff;
          --ag-primary-container: #00872c;
          --ag-secondary: #515f74;
          --ag-secondary-container: #d5e3fc;
          --ag-tertiary: #4d6400;
          --ag-success: #edfbf2;
          --ag-warning: #c48410;
          --ag-info: #2c6bb8;
          --ag-shadow: 0 4px 14px -4px rgba(24,29,26,0.10), 0 2px 4px rgba(24,29,26,0.05);
          --ag-shadow-primary: 0 4px 14px 0 rgba(0,107,33,0.28);

          font-family: "Inter", -apple-system, system-ui, sans-serif;
          color: var(--ag-on-surface);
          background: var(--ag-paper);
          min-height: 100vh;
        }
        .ag.ag-dark {
          /* ===== Paleta AgroTech Precision — OSCURO ===== */
          --ag-bg: #0f1511;
          --ag-paper: #0d120f;
          --ag-sand: #141a16;
          --ag-hay: #1a221c;
          --ag-surface: #161d18;
          --ag-surface-low: #11160f;
          --ag-surface-high: #1f2820;
          --ag-on-surface: #dfe4dd;
          --ag-on-variant: #bccbb7;
          --ag-muted: #87957f;
          --ag-outline: rgba(255,255,255,0.10);
          --ag-primary: #59e069;
          --ag-primary-dim: #2f7a3a;
          --ag-on-primary: #00390e;
          --ag-primary-container: #00872c;
          --ag-secondary: #b9c7df;
          --ag-secondary-container: #2a3a4f;
          --ag-tertiary: #b0d44f;
          --ag-success: #0e2517;
          --ag-warning: #e3b04a;
          --ag-info: #6fa8e0;
          --ag-shadow: 0 6px 18px rgba(0,0,0,0.45);
          --ag-shadow-primary: 0 6px 20px rgba(89,224,105,0.25);
        }

        .ag * { box-sizing: border-box; }
        .ag a { text-decoration: none; color: inherit; }

        /* NAV */
        .ag-nav { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--ag-bg) 88%, transparent); backdrop-filter: saturate(1.2) blur(8px); border-bottom: 1px solid var(--ag-outline); }
        .ag-nav__inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ag-logo { display: flex; align-items: center; gap: 10px; font-family: "Instrument Serif", serif; font-size: 26px; color: var(--ag-primary); letter-spacing: -0.01em; }
        .ag-logo--sm { font-size: 22px; }
        .ag-logo__mark { width: 34px; height: 34px; border-radius: 10px; background: var(--ag-primary); color: var(--ag-on-primary); display: grid; place-items: center; box-shadow: inset 0 -5px 0 rgba(0,0,0,0.14); }
        .ag-nav__links { display: none; gap: 28px; }
        .ag-nav__links a { font-size: 14px; font-weight: 600; color: var(--ag-on-variant); padding-bottom: 2px; border-bottom: 2px solid transparent; transition: 0.15s; }
        .ag-nav__links a:hover { color: var(--ag-primary); }
        .ag-nav__links a.is-active { color: var(--ag-primary); border-color: var(--ag-primary); }
        .ag-nav__actions { display: flex; align-items: center; gap: 10px; }
        @media (min-width: 880px) { .ag-nav__links { display: flex; } }

        .ag-iconbtn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--ag-outline); background: var(--ag-surface); color: var(--ag-on-variant); display: grid; place-items: center; cursor: pointer; transition: 0.15s; }
        .ag-iconbtn:hover { color: var(--ag-primary); border-color: var(--ag-primary-dim); }

        /* BOTONES */
        .ag-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; font-size: 14px; font-weight: 600; padding: 9px 18px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; transition: transform 0.05s, background 0.15s, box-shadow 0.15s, border-color 0.15s; white-space: nowrap; }
        .ag-btn:active { transform: translateY(0.5px); }
        .ag-btn--lg { padding: 14px 26px; font-size: 15px; border-radius: 12px; }
        .ag-btn--primary { background: var(--ag-primary); color: var(--ag-on-primary); box-shadow: var(--ag-shadow-primary), inset 0 -2px 0 rgba(0,0,0,0.12); }
        .ag-btn--primary:hover { background: var(--ag-primary-container); transform: translateY(-1px); }
        .ag-btn--secondary { background: var(--ag-surface); color: var(--ag-on-surface); border-color: var(--ag-outline); box-shadow: var(--ag-shadow); }
        .ag-btn--secondary:hover { background: var(--ag-surface-low); }
        .ag-btn--ghost { background: transparent; color: var(--ag-on-variant); }
        .ag-btn--ghost:hover { color: var(--ag-primary); }

        .ag-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ag-primary); }
        .ag-display { font-family: "Instrument Serif", serif; font-weight: 400; font-size: clamp(38px, 6vw, 60px); line-height: 1.02; letter-spacing: -0.02em; color: var(--ag-on-surface); margin: 14px 0 0; }
        .ag-display--sm { font-size: clamp(30px, 4vw, 44px); }
        .ag-headline { font-family: "Instrument Serif", serif; font-weight: 400; font-size: clamp(28px, 4vw, 36px); line-height: 1.1; letter-spacing: -0.01em; color: var(--ag-on-surface); margin: 8px 0 0; }
        .ag-subtitle { font-size: clamp(16px, 2vw, 19px); color: var(--ag-on-variant); margin: 18px auto 0; max-width: 620px; line-height: 1.5; }
        .ag-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        /* HERO */
        .ag-hero { position: relative; overflow: hidden; padding: 96px 24px 110px; text-align: center; border-bottom: 1px solid var(--ag-outline); background: linear-gradient(180deg, var(--ag-bg), var(--ag-paper)); }
        .ag-hero__pattern { position: absolute; inset: 0; background-image: linear-gradient(to right, color-mix(in srgb, var(--ag-on-surface) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--ag-on-surface) 6%, transparent) 1px, transparent 1px); background-size: 26px 26px; -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%); mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%); }
        .ag-hero__glow { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
        .ag-hero__glow--1 { width: 360px; height: 360px; background: var(--ag-primary-dim); top: -120px; right: -60px; opacity: 0.25; }
        .ag-hero__glow--2 { width: 320px; height: 320px; background: var(--ag-tertiary); bottom: -140px; left: -80px; opacity: 0.18; }
        .ag-hero__inner { position: relative; z-index: 1; max-width: 820px; margin: 0 auto; }
        .ag-hero__cta { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin-top: 30px; }
        .ag-hero__stats { display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; margin-top: 48px; }
        .ag-hero__stats > div { display: flex; flex-direction: column; }
        .ag-hero__stats strong { font-family: "Instrument Serif", serif; font-size: 30px; color: var(--ag-primary); line-height: 1; }
        .ag-hero__stats span { font-size: 12.5px; color: var(--ag-muted); margin-top: 6px; }

        /* SECTIONS */
        .ag-section { padding: 84px 0; }
        .ag-section--surface { background: var(--ag-surface); border-bottom: 1px solid var(--ag-outline); }
        .ag-section--paper { background: var(--ag-paper); border-bottom: 1px solid var(--ag-outline); }
        .ag-section__head { text-align: center; max-width: 640px; margin: 0 auto 48px; }
        .ag-section__sub { font-size: 15px; color: var(--ag-on-variant); margin-top: 12px; }

        .ag-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
        @media (min-width: 720px) { .ag-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .ag-grid { grid-template-columns: repeat(3, 1fr); } }
        .ag-card { background: var(--ag-surface); border: 1px solid var(--ag-outline); border-radius: 18px; padding: 26px; box-shadow: var(--ag-shadow); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .ag-card:hover { transform: translateY(-4px); border-color: var(--ag-primary-dim); box-shadow: 0 14px 32px -10px rgba(0,107,33,0.18); }
        .ag-card__icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 20px; }
        .ag-card__title { font-family: "Instrument Serif", serif; font-size: 22px; font-weight: 400; color: var(--ag-on-surface); margin: 0 0 8px; }
        .ag-card__desc { font-size: 14px; line-height: 1.55; color: var(--ag-on-variant); margin: 0; }

        /* ABOUT */
        .ag-about { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media (min-width: 900px) { .ag-about { grid-template-columns: 1fr 1fr; } }
        .ag-about__visual { position: relative; }
        .ag-about__visual-bg { position: absolute; inset: 0; transform: translate(16px, 16px); background: color-mix(in srgb, var(--ag-primary-dim) 14%, transparent); border-radius: 18px; }
        .ag-about__panel { position: relative; z-index: 1; background: var(--ag-surface); border: 1px solid var(--ag-outline); border-radius: 18px; padding: 22px; box-shadow: var(--ag-shadow); }
        .ag-about__panel-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--ag-outline); font-size: 14px; color: var(--ag-on-variant); }
        .ag-about__panel-row strong { color: var(--ag-on-surface); font-family: "JetBrains Mono", monospace; }
        .ag-about__panel-bars { display: flex; align-items: flex-end; gap: 8px; height: 90px; margin: 18px 0 10px; }
        .ag-about__panel-bars span { flex: 1; border-radius: 5px 5px 2px 2px; }
        .ag-about__panel-foot { font-size: 11px; color: var(--ag-muted); font-family: "JetBrains Mono", monospace; }
        .ag-about__text .ag-eyebrow { display: block; margin-bottom: 8px; }
        .ag-about__text p { font-size: 15px; line-height: 1.65; color: var(--ag-on-variant); margin: 18px 0 0; }

        /* CTA */
        .ag-cta { position: relative; overflow: hidden; text-align: center; background: var(--ag-sand); }
        .ag-cta__glow { position: absolute; width: 380px; height: 380px; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .ag-cta__glow--1 { background: var(--ag-primary-container); opacity: 0.10; top: -160px; right: -120px; }
        .ag-cta__glow--2 { background: var(--ag-tertiary); opacity: 0.16; bottom: -160px; left: -120px; }
        .ag-cta__inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 0 24px; }

        /* FOOTER */
        .ag-footer { background: var(--ag-surface-high); border-top: 1px solid var(--ag-outline); }
        .ag-footer__inner { display: flex; flex-direction: column; gap: 14px; align-items: center; padding-top: 28px; padding-bottom: 28px; text-align: center; }
        @media (min-width: 720px) { .ag-footer__inner { flex-direction: row; justify-content: space-between; text-align: left; } }
        .ag-footer__copy { font-size: 13px; color: var(--ag-muted); }
        .ag-footer__links { display: flex; gap: 22px; }
        .ag-footer__links a { font-size: 13px; color: var(--ag-on-variant); transition: 0.15s; }
        .ag-footer__links a:hover { color: var(--ag-primary); text-decoration: underline; }
      `}</style>
    </div>
  );
}
