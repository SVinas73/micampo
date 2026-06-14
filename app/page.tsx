"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, X, ArrowUpRight, Play, ChevronDown, ChevronUp,
  Leaf, Droplets, Sun, Sprout, BarChart3, Cpu, ShieldCheck,
  Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin,
} from "lucide-react";

/* ──────────────── NAVBAR ──────────────── */
function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Inicio", href: "#home" },
    { label: "Nosotros", href: "#about" },
    { label: "Funciones", href: "#products" },
    { label: "Sostenibilidad", href: "#sustainability" },
    { label: "Preguntas", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#132a1a]/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#home" className="flex items-center gap-2 text-[#f0f0e8] font-bold text-xl tracking-wider uppercase">
            <span className="w-9 h-9 rounded-xl bg-[#c5e74e] text-[#132a1a] grid place-items-center">
              <Leaf size={18} />
            </span>
            MiCampo
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="px-4 py-2 text-sm text-[#f0f0e8]/80 hover:text-[#f0f0e8] transition-colors rounded-full hover:bg-white/5">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => router.push("/login")} className="text-sm text-[#f0f0e8]/80 hover:text-[#f0f0e8] transition-colors px-3 py-2">
              Iniciar sesión
            </button>
            <button onClick={() => router.push("/register")} className="inline-flex items-center gap-2 bg-[#c5e74e] text-[#132a1a] px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d4f15a] transition-colors">
              Registrarse
              <ArrowUpRight size={16} />
            </button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#f0f0e8] p-2">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[#132a1a]/98 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[#f0f0e8]/80 hover:text-[#f0f0e8] hover:bg-white/5 rounded-lg transition-colors">
                {link.label}
              </a>
            ))}
            <button onClick={() => router.push("/login")} className="block w-full text-left px-4 py-3 text-[#f0f0e8]/80 hover:text-[#f0f0e8] hover:bg-white/5 rounded-lg transition-colors">
              Iniciar sesión
            </button>
            <button onClick={() => router.push("/register")} className="block w-full mt-2 text-center bg-[#c5e74e] text-[#132a1a] px-6 py-3 rounded-full text-sm font-semibold">
              Registrarse
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ──────────────── HERO ──────────────── */
function Hero() {
  const router = useRouter();
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-bg.jpg" alt="Agricultura sostenible" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#132a1a]/85 via-[#132a1a]/55 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Leaf size={16} className="text-[#c5e74e]" />
            <span className="text-sm text-[#f0f0e8]/90">El sistema nervioso central del agro moderno</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
            Cultivá el futuro con{" "}
            <span className="text-[#c5e74e]">agricultura de precisión</span>
          </h1>

          <p className="text-lg text-[#f0f0e8]/80 mb-10 max-w-lg leading-relaxed">
            Monitoreo preciso, decisiones inteligentes con IA y mayor productividad. Toda tu
            agricultura y ganadería, en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => router.push("/register")} className="inline-flex items-center justify-center gap-3 bg-[#c5e74e] text-[#132a1a] px-8 py-4 rounded-full text-base font-semibold hover:bg-[#d4f15a] transition-all hover:scale-105">
              Empezar ahora
              <ArrowUpRight size={20} />
            </button>
            <button onClick={() => router.push("/login")} className="inline-flex items-center justify-center gap-2 border border-[#f0f0e8]/25 text-[#f0f0e8] px-8 py-4 rounded-full text-base font-semibold hover:bg-white/5 transition-all">
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-[#f0f0e8]/60 uppercase tracking-widest">Scroll</span>
        <ChevronDown size={20} className="text-[#c5e74e]" />
      </div>
    </section>
  );
}

/* ──────────────── LOGOS / MÓDULOS ──────────────── */
function Logos() {
  const logos = [
    { name: "Campo Digital", icon: <Sprout size={20} /> },
    { name: "Detección IA", icon: <Cpu size={20} /> },
    { name: "Plan de Riego", icon: <Droplets size={20} /> },
    { name: "Análisis de Suelo", icon: <BarChart3 size={20} /> },
    { name: "Ganadería", icon: <Leaf size={20} /> },
    { name: "Clima", icon: <Sun size={20} /> },
  ];
  return (
    <section className="bg-[#0d1f14] py-12 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 text-[#f0f0e8]/45 hover:text-[#c5e74e] transition-colors">
              {logo.icon}
              <span className="text-sm font-medium tracking-wide">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── NOSOTROS ──────────────── */
function About() {
  const stats = [
    { value: "96%", label: "Precisión de la IA", desc: "Detección de enfermedades y recomendaciones confiables" },
    { value: "558 Ha", label: "Gestionadas", desc: "Lotes, cultivos y ganado bajo control en un solo lugar" },
    { value: "SENASA", label: "Trazabilidad al día", desc: "Documentación y movimientos de tropa siempre en regla" },
  ];
  return (
    <section id="about" className="bg-[#132a1a] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-64"><img src="/farm-aerial.jpg" alt="Vista aérea del campo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
              <div className="rounded-2xl overflow-hidden h-48"><img src="/sustainable-farming.jpg" alt="Agricultura sostenible" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden h-48"><img src="/vegetable-farm.jpg" alt="Producción agrícola" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
              <div className="rounded-2xl overflow-hidden h-64"><img src="/smart-farm.jpg" alt="Tecnología agrícola" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
            </div>
          </div>

          <div>
            <span className="text-[#c5e74e] text-sm font-semibold uppercase tracking-widest">Sobre nosotros</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#f0f0e8] leading-tight mb-6 mt-4">
              DIGITALIZANDO EL CAMPO, HECTÁREA A HECTÁREA
            </h2>
            <p className="text-[#f0f0e8]/70 mb-10 leading-relaxed">
              MiCampo combina tecnología moderna e inteligencia artificial con la experiencia del
              terreno para que productores y agrónomos gestionen más inteligente, rápido y verde.
              Una plataforma integral con datos en tiempo real, herramientas de precisión y
              soluciones que transforman la agricultura tradicional en una práctica sostenible.
            </p>

            <div className="space-y-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="text-3xl lg:text-4xl font-bold text-[#c5e74e] min-w-[110px]">{stat.value}</div>
                  <div>
                    <div className="text-[#f0f0e8] font-semibold text-lg">{stat.label}</div>
                    <div className="text-[#f0f0e8]/60 text-sm">{stat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── TECNOLOGÍA / VIDEO ──────────────── */
function Technology() {
  const articles = [
    { image: "/sustainable-farming.jpg", title: "Campo Digital y mapas NDVI", desc: "Seguí el estado de cada lote con capas satelitales de vegetación, humedad y topografía." },
    { image: "/smart-farm.jpg", title: "Detección de enfermedades con IA", desc: "Subí una foto y la IA identifica la plaga, su severidad y la estrategia de control." },
    { image: "/farm-aerial.jpg", title: "Planificación de siembra inteligente", desc: "Planes recomendados por IA con su razonamiento y proyección económica." },
    { image: "/vegetable-farm.jpg", title: "Riego que evita el estrés hídrico", desc: "Balance hídrico proyectado y sugerencias que optimizan agua y rinde." },
  ];
  return (
    <section id="farms" className="bg-[#0d1f14] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#f0f0e8] max-w-md leading-tight">
            DONDE LA TECNOLOGÍA SE ENCUENTRA CON LAS RAÍCES DE LA NATURALEZA
          </h2>
          <p className="text-[#f0f0e8]/60 mt-4 lg:mt-0 max-w-sm text-sm leading-relaxed">
            Herramientas modernas para nutrir los cultivos, apoyar a los productores y cuidar la
            tierra de la que todos dependemos.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden mb-16 group">
          <img src="/rice-terraces.jpg" alt="Cultivos en terrazas" className="w-full h-[400px] lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <button className="w-20 h-20 bg-[#c5e74e] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#c5e74e]/30">
              <Play size={28} className="text-[#132a1a] ml-1" fill="#132a1a" />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article, i) => (
            <div key={i} className="group bg-[#132a1a] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
              <div className="h-48 overflow-hidden"><img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
              <div className="p-5">
                <h3 className="text-[#f0f0e8] font-semibold text-sm leading-snug mb-2 group-hover:text-[#c5e74e] transition-colors">{article.title}</h3>
                <p className="text-[#f0f0e8]/50 text-xs leading-relaxed">{article.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── FUNCIONES ──────────────── */
function Features() {
  const features = [
    { icon: <Sprout size={28} />, title: "Campo Digital", desc: "Mapa satelital con NDVI, humedad y topografía; estado de cada lote, cultivo y su sanidad en tiempo real." },
    { icon: <Cpu size={28} />, title: "Detección de Enfermedades IA", desc: "La IA detecta la plaga o enfermedad por imagen, su severidad y la estrategia de control con dosis y costo." },
    { icon: <Droplets size={28} />, title: "Plan de Riego Inteligente", desc: "Balance hídrico proyectado y sugerencias de riego que evitan el estrés del cultivo, optimizando agua y rinde." },
    { icon: <BarChart3 size={28} />, title: "Análisis de Suelo", desc: "Mapeo de N, P, K, pH y materia orgánica por lote, con recetas de fertilización automáticas." },
    { icon: <Leaf size={28} />, title: "Ganadería Trazable", desc: "Rodeo, peso, nutrición, reproducción y sanidad con trazabilidad SENASA y documentación al día." },
    { icon: <ShieldCheck size={28} />, title: "Planificación con IA", desc: "Planes de siembra recomendados por IA, con su razonamiento, proyección económica y órdenes de trabajo." },
  ];
  return (
    <section id="products" className="bg-[#132a1a] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c5e74e] text-sm font-semibold uppercase tracking-widest">Nuestras soluciones</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#f0f0e8] mt-4">Herramientas para el agro digital</h2>
          <p className="text-[#f0f0e8]/60 mt-4 max-w-2xl mx-auto">
            De la siembra a la cosecha, un conjunto integral de herramientas para optimizar cada
            aspecto de tu operación, agrícola y ganadera.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="group bg-[#1a3a24] rounded-2xl p-8 hover:bg-[#1f4529] transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#c5e74e]/10 rounded-xl flex items-center justify-center text-[#c5e74e] mb-6 group-hover:bg-[#c5e74e]/20 transition-colors">{feature.icon}</div>
              <h3 className="text-[#f0f0e8] font-semibold text-lg mb-3">{feature.title}</h3>
              <p className="text-[#f0f0e8]/60 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── SOSTENIBILIDAD ──────────────── */
function Sustainability() {
  return (
    <section id="sustainability" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-bg.jpg" alt="Sostenibilidad" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#132a1a]/85" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[#c5e74e] text-sm font-semibold uppercase tracking-widest">Nuestro compromiso</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#f0f0e8] mt-4 leading-tight">Prácticas sostenibles para un mañana más verde</h2>
            <p className="text-[#f0f0e8]/70 mt-6 leading-relaxed">
              Creemos en una agricultura que respeta el ambiente. Nuestras prácticas reducen la
              huella de carbono, conservan el agua, protegen la biodiversidad y aseguran suelos
              fértiles para las próximas generaciones.
            </p>

            <div className="mt-10 space-y-6">
              {[
                { label: "Reducción de huella de carbono", value: 85 },
                { label: "Conservación de agua", value: 70 },
                { label: "Mejora de la salud del suelo", value: 92 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#f0f0e8]">{item.label}</span>
                    <span className="text-[#c5e74e] font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#c5e74e] rounded-full transition-all duration-1000" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-[#1a3a24] rounded-2xl p-6 text-center">
                <Leaf size={32} className="text-[#c5e74e] mx-auto mb-3" />
                <div className="text-3xl font-bold text-[#f0f0e8]">100%</div>
                <div className="text-xs text-[#f0f0e8]/60 mt-1">Prácticas orgánicas</div>
              </div>
              <div className="rounded-2xl overflow-hidden h-40"><img src="/vegetable-farm.jpg" alt="" className="w-full h-full object-cover" /></div>
            </div>
            <div className="space-y-4 pt-6">
              <div className="rounded-2xl overflow-hidden h-40"><img src="/farm-aerial.jpg" alt="" className="w-full h-full object-cover" /></div>
              <div className="bg-[#1a3a24] rounded-2xl p-6 text-center">
                <Droplets size={32} className="text-[#c5e74e] mx-auto mb-3" />
                <div className="text-3xl font-bold text-[#f0f0e8]">40%</div>
                <div className="text-xs text-[#f0f0e8]/60 mt-1">Agua ahorrada</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── FAQ ──────────────── */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    { q: "¿Qué soluciones ofrece MiCampo?", a: "Brindamos herramientas para agricultura de precisión: monitoreo de cultivos, detección de enfermedades con IA, riego inteligente, análisis de suelo y gestión ganadera, para optimizar el rinde y la eficiencia." },
    { q: "¿Cómo empiezo a usar la plataforma?", a: "Es muy fácil: creá una cuenta, cargá tus campos y lotes, y tendrás acceso a todo el conjunto de módulos y herramientas." },
    { q: "¿La IA funciona sin conexión a un modelo propio?", a: "Sí. Las funciones de IA degradan a un modo demo determinístico cuando no hay clave de API, así el sistema es 100% funcional. Cuando entrenes tu modelo a medida, se conecta sin cambios en la interfaz." },
    { q: "¿Incluye trazabilidad ganadera?", a: "Sí, gestionás rodeo, peso, nutrición, reproducción y sanidad con trazabilidad SENASA y documentación de movimientos de tropa." },
    { q: "¿Puedo integrarlo con mis datos existentes?", a: "La plataforma está construida sobre APIs propias y es extensible; podés cargar tus campos, lotes, animales y registros, y conectar nuevas fuentes de datos." },
  ];
  return (
    <section id="faq" className="bg-[#0d1f14] py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-12 gap-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#f0f0e8]">¿TENÉS DUDAS? TE LAS RESPONDEMOS.</h2>
          <p className="text-[#f0f0e8]/60 text-sm max-w-xs leading-relaxed">
            Respuestas rápidas a las preguntas más comunes sobre nuestras soluciones, la tecnología
            y cómo ayudamos a producir más inteligente y sostenible.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#132a1a] rounded-xl overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="text-[#f0f0e8] font-medium pr-4">{faq.q}</span>
                <span className="text-[#c5e74e] flex-shrink-0">{openIndex === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5"><p className="text-[#f0f0e8]/60 text-sm leading-relaxed">{faq.a}</p></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── CTA ──────────────── */
function CTA() {
  const router = useRouter();
  return (
    <section className="bg-[#132a1a] py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-6xl font-bold text-[#f0f0e8] leading-tight">
          ¿Listo para transformar{" "}
          <span className="text-[#c5e74e]">tu campo?</span>
        </h2>
        <p className="text-[#f0f0e8]/60 mt-6 max-w-xl mx-auto leading-relaxed">
          Sumate a los productores que ya gestionan más inteligente, verde y rentable con MiCampo.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => router.push("/register")} className="inline-flex items-center gap-2 bg-[#c5e74e] text-[#132a1a] px-8 py-4 rounded-full font-semibold hover:bg-[#d4f15a] transition-all hover:scale-105">
            Empezar hoy
            <ArrowUpRight size={20} />
          </button>
          <button onClick={() => router.push("/login")} className="inline-flex items-center gap-2 border border-[#f0f0e8]/20 text-[#f0f0e8] px-8 py-4 rounded-full font-semibold hover:bg-white/5 transition-all">
            Iniciar sesión
          </button>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── FOOTER ──────────────── */
function Footer() {
  return (
    <footer id="contact" className="bg-[#0a1a10] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 text-[#f0f0e8] font-bold text-xl tracking-wider uppercase mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#c5e74e] text-[#132a1a] grid place-items-center"><Leaf size={18} /></span>
              MiCampo
            </div>
            <p className="text-[#f0f0e8]/50 text-sm leading-relaxed mb-6">Gestión agropecuaria de precisión, con tecnología sostenible para un futuro más verde.</p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Ic, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#f0f0e8]/50 hover:bg-[#c5e74e] hover:text-[#132a1a] transition-all">
                  <Ic size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[#f0f0e8] font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-3">
              {[["Inicio", "#home"], ["Nosotros", "#about"], ["Funciones", "#products"], ["Sostenibilidad", "#sustainability"], ["Preguntas", "#faq"]].map(([l, h]) => (
                <li key={l}><a href={h} className="text-[#f0f0e8]/50 text-sm hover:text-[#c5e74e] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f0f0e8] font-semibold mb-4">Módulos</h4>
            <ul className="space-y-3">
              {["Campo Digital", "Detección de Enfermedades", "Plan de Riego", "Análisis de Suelo", "Ganadería", "Calculadora de Dosis"].map((s) => (
                <li key={s}><a href="#products" className="text-[#f0f0e8]/50 text-sm hover:text-[#c5e74e] transition-colors">{s}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f0f0e8] font-semibold mb-4">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin size={18} className="text-[#c5e74e] flex-shrink-0 mt-0.5" /><span className="text-[#f0f0e8]/50 text-sm">Establecimiento Don Ramón</span></li>
              <li className="flex items-center gap-3"><Phone size={18} className="text-[#c5e74e] flex-shrink-0" /><span className="text-[#f0f0e8]/50 text-sm">+54 (000) 000-0000</span></li>
              <li className="flex items-center gap-3"><Mail size={18} className="text-[#c5e74e] flex-shrink-0" /><span className="text-[#f0f0e8]/50 text-sm">hola@micampo.app</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#f0f0e8]/40 text-sm">© {new Date().getFullYear()} MiCampo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[#f0f0e8]/40 text-sm hover:text-[#f0f0e8]/60 transition-colors">Privacidad</a>
            <a href="#" className="text-[#f0f0e8]/40 text-sm hover:text-[#f0f0e8]/60 transition-colors">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────── LANDING ──────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#132a1a]">
      <Navbar />
      <Hero />
      <Logos />
      <About />
      <Technology />
      <Features />
      <Sustainability />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
