/**
 * Tono de color por condición climática, para dar vida y color a las vistas de
 * clima (pronóstico extendido y clima actual). Mapea el nombre de ícono que
 * devuelve la API (sun, cloud, droplet, bolt, snow…) a un color y un degradado.
 */
export type WeatherTone = { color: string; grad: string; soft: string; ring: string };

export function weatherTone(icon: string): WeatherTone {
  const k = (icon || "").toLowerCase();
  if (k.includes("sun") || k.includes("sol") || k.includes("clear") || k.includes("despej"))
    return { color: "#e8951f", grad: "linear-gradient(155deg, #ffd778 0%, #f0a32f 100%)", soft: "rgba(240,163,47,0.12)", ring: "rgba(240,163,47,0.35)" };
  if (k.includes("bolt") || k.includes("storm") || k.includes("torm") || k.includes("electr"))
    return { color: "#7e57c2", grad: "linear-gradient(155deg, #b29adb 0%, #7e57c2 100%)", soft: "rgba(126,87,194,0.12)", ring: "rgba(126,87,194,0.35)" };
  if (k.includes("droplet") || k.includes("rain") || k.includes("lluvia") || k.includes("shower"))
    return { color: "#2c82c9", grad: "linear-gradient(155deg, #7cc0ee 0%, #2c82c9 100%)", soft: "rgba(44,130,201,0.12)", ring: "rgba(44,130,201,0.35)" };
  if (k.includes("snow") || k.includes("niev"))
    return { color: "#5aa9d6", grad: "linear-gradient(155deg, #dcf2fc 0%, #9fd6f0 100%)", soft: "rgba(90,169,214,0.14)", ring: "rgba(90,169,214,0.35)" };
  if (k.includes("cloud") || k.includes("nub") || k.includes("overcast"))
    return { color: "#7488a0", grad: "linear-gradient(155deg, #c2cedd 0%, #8597ad 100%)", soft: "rgba(116,136,160,0.12)", ring: "rgba(116,136,160,0.30)" };
  // por defecto: parcialmente nublado / templado
  return { color: "#4f93cf", grad: "linear-gradient(155deg, #bcd9f0 0%, #6fa3d2 100%)", soft: "rgba(79,147,207,0.10)", ring: "rgba(79,147,207,0.30)" };
}
