"use client";

/**
 * Cola offline de MiCampo (dolor B: "Offline 100%").
 * Guarda en IndexedDB las acciones hechas sin conexión (p. ej. registrar una labor
 * en el campo) y las sincroniza solas cuando vuelve internet. Invisible para el
 * usuario: si hay red, va directo; si no, se encola y se reintenta.
 *
 * Diseñado como primitiva reutilizable: cualquier POST del sistema puede pasar por
 * `postOffline(url, body)` para volverse tolerante a la falta de señal.
 */

const DB_NAME = "micampo-offline";
const STORE = "cola";
const EVENTO = "micampo:offline-change";

export type PendItem = {
  id: string;
  url: string;
  method: string;
  body: unknown;
  createdAt: number;
  descripcion?: string;
};

function disponible(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idUnico(): string {
  // Sin Math.random/Date.now sería ideal, pero acá es válido (lado cliente).
  return `q_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function avisar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function onCambioCola(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO, cb);
  return () => window.removeEventListener(EVENTO, cb);
}

async function encolar(item: PendItem): Promise<void> {
  const db = await abrir();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  avisar();
}

export async function listarPendientes(): Promise<PendItem[]> {
  if (!disponible()) return [];
  const db = await abrir();
  const items = await new Promise<PendItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendItem[]).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

export async function contarPendientes(): Promise<number> {
  return (await listarPendientes()).length;
}

async function borrar(id: string): Promise<void> {
  const db = await abrir();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Sincroniza la cola: reenvía cada acción pendiente en orden. Se detiene al primer
 * fallo de red (sigue sin conexión) para no perder el orden. Devuelve cuántas
 * sincronizó. Seguro de llamar varias veces.
 */
export async function sincronizar(): Promise<number> {
  if (!disponible() || (typeof navigator !== "undefined" && !navigator.onLine)) return 0;
  const pendientes = await listarPendientes();
  let ok = 0;
  for (const it of pendientes) {
    try {
      const r = await fetch(it.url, { method: it.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(it.body) });
      if (r.ok) { await borrar(it.id); ok++; }
      else if (r.status >= 400 && r.status < 500) { await borrar(it.id); ok++; } // request inválido: descartar para no trabar la cola
      else break; // error de servidor: reintentar luego
    } catch {
      break; // sin red: cortar y reintentar al reconectar
    }
  }
  if (ok > 0) avisar();
  return ok;
}

/**
 * POST tolerante a la falta de señal. Si hay red y responde OK, va directo.
 * Si falla por red (offline), encola la acción y devuelve { offline: true } para
 * que la UI confirme "guardado, se sincroniza al reconectar".
 */
export async function postOffline(
  url: string,
  body: unknown,
  descripcion?: string
): Promise<{ ok: boolean; offline: boolean }> {
  const sinRed = typeof navigator !== "undefined" && !navigator.onLine;
  if (!sinRed) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) return { ok: true, offline: false };
      if (r.status >= 400 && r.status < 500) return { ok: false, offline: false }; // error real del request
      // 5xx → tratamos como temporal: encolamos
    } catch {
      // cae a encolar
    }
  }
  if (disponible()) {
    await encolar({ id: idUnico(), url, method: "POST", body, createdAt: Date.now(), descripcion });
    return { ok: true, offline: true };
  }
  return { ok: false, offline: false };
}
