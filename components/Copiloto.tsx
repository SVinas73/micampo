"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/mc/Icon";

type Msg = { role: "user" | "assistant"; content: string };

const SUGERENCIAS = [
  "¿Qué tengo que atender hoy?",
  "¿Qué lote me está dando menos margen?",
  "¿Cómo viene la plata este mes?",
  "¿Conviene vender o engordar la hacienda?",
];

export function Copiloto({
  open,
  setOpen,
  seed,
  onSeedConsumed,
  modulo,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  seed?: string | null;
  onSeedConsumed?: () => void;
  modulo?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const enviar = async (texto: string) => {
    const pregunta = texto.trim();
    if (!pregunta || cargando) return;
    const nuevos: Msg[] = [...messages, { role: "user", content: pregunta }];
    setMessages(nuevos);
    setInput("");
    setCargando(true);
    try {
      const res = await fetch("/api/copiloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nuevos, modulo }),
      });

      if (!res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "No pude responder." }]);
        return;
      }

      // Inserta una burbuja vacía y la va completando con el stream
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setCargando(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { role: "assistant", content: acumulado };
          return copia;
        });
      }
      if (!acumulado.trim()) {
        setMessages((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { role: "assistant", content: "No pude completar el análisis. Reformulá la pregunta, por favor." };
          return copia;
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hubo un problema de conexión. Probá de nuevo en un momento." }]);
    } finally {
      setCargando(false);
    }
  };

  // Consumir "seed" enviado desde el ⌘K
  useEffect(() => {
    if (open && seed && seed.trim()) {
      enviar(seed);
      onSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, cargando]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  return (
    <>
      {/* Lanzador flotante */}
      <button
        className="mc-copilot-orb"
        onClick={() => setOpen(!open)}
        title="Copiloto del Campo"
        aria-label="Abrir copiloto"
        style={{ transform: open ? "scale(0.9)" : "scale(1)" }}
      >
        <Icon name={open ? "x" : "sparkles"} size={22} />
        {!open && <span className="mc-copilot-orb__pulse" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="mc-copilot">
          <div className="mc-copilot__head">
            <div className="mc-copilot__head-title">
              <span className="mc-copilot__badge">
                <Icon name="sparkles" size={14} />
              </span>
              <div>
                <div className="mc-copilot__name">Copiloto del Campo</div>
                <div className="mc-copilot__sub">{modulo ? `Contexto: ${modulo}` : "Asistente con tus datos reales"}</div>
              </div>
            </div>
            <button className="mc-icon-btn" style={{ width: 28, height: 28, border: "none" }} onClick={() => setOpen(false)}>
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="mc-copilot__body" ref={scrollRef}>
            {messages.length === 0 && !cargando && (
              <div className="mc-copilot__welcome">
                <div className="mc-copilot__welcome-orb">
                  <Icon name="sparkles" size={24} />
                </div>
                <p className="mc-copilot__welcome-title">¿En qué te ayudo?</p>
                <p className="mc-copilot__welcome-text">
                  Puedo razonar cruzando agronomía, hacienda y finanzas de tu establecimiento.
                </p>
                <div className="mc-copilot__chips">
                  {SUGERENCIAS.map((s) => (
                    <button key={s} className="mc-copilot__chip" onClick={() => enviar(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`mc-copilot__msg mc-copilot__msg--${m.role}`}>
                {m.role === "assistant" && (
                  <span className="mc-copilot__msg-ic">
                    <Icon name="sparkles" size={12} />
                  </span>
                )}
                <div className="mc-copilot__bubble">{m.content}</div>
              </div>
            ))}

            {cargando && (
              <div className="mc-copilot__msg mc-copilot__msg--assistant">
                <span className="mc-copilot__msg-ic">
                  <Icon name="sparkles" size={12} />
                </span>
                <div className="mc-copilot__bubble mc-copilot__typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <div className="mc-copilot__input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviar(input);
              }}
              placeholder="Preguntá lo que quieras…"
            />
            <button
              className="mc-copilot__send"
              onClick={() => enviar(input)}
              disabled={cargando || !input.trim()}
              aria-label="Enviar"
            >
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
