"use client";

import React from "react";

export type IconName = keyof typeof ICONS;

export const Icon = ({
  name,
  size = 18,
  strokeWidth = 1.8,
  style,
  className,
}: {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}) => {
  const paths = ICONS[name as IconName] || ICONS.box;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {paths}
    </svg>
  );
};

export const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  wheat: <><path d="M12 22V7"/><path d="M5 11c1.5 0 3 1 3 3-1.5 0-3-1-3-3z"/><path d="M19 11c-1.5 0-3 1-3 3 1.5 0 3-1 3-3z"/><path d="M5 7c1.5 0 3 1 3 3-1.5 0-3-1-3-3z"/><path d="M19 7c-1.5 0-3 1-3 3 1.5 0 3-1 3-3z"/><path d="M5 3c1.5 0 3 1 3 3-1.5 0-3-1-3-3z"/><path d="M19 3c-1.5 0-3 1-3 3 1.5 0 3-1 3-3z"/></>,
  cow: <><path d="M8 8v1a4 4 0 0 0 8 0V8"/><path d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/><path d="M9 13v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4"/><circle cx="9.5" cy="9" r=".5" fill="currentColor"/><circle cx="14.5" cy="9" r=".5" fill="currentColor"/></>,
  box: <><path d="M21 8L12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></>,
  dollar: <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5 5l-7.1 7.1a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l7.1-7.1a4 4 0 0 0 5-5l-2.1 2.1-2.1-.6-.6-2.1z"/>,
  leaf: <><path d="M11 20A7 7 0 0 1 4 13V8a2 2 0 0 1 2-2c5 0 9 1 12 4 2 2 2 4 2 8-3 2-7 2-9 2z"/><path d="M2 22c3-5 8-8 14-9"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  minus: <path d="M5 12h14"/>,
  chevRight: <path d="M9 6l6 6-6 6"/>,
  chevLeft: <path d="M15 6l-6 6 6 6"/>,
  chevDown: <path d="M6 9l6 6 6-6"/>,
  chevUp: <path d="M18 15l-6-6-6 6"/>,
  sprout: <><path d="M7 20h10"/><path d="M12 20V8"/><path d="M17 8a5 5 0 0 0-5 0 5 5 0 0 0-5 0"/><path d="M7 8a5 5 0 0 1 5-5 5 5 0 0 1 5 5"/></>,
  droplet: <path d="M12 2s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>,
  cloud: <path d="M18 10a5 5 0 0 0-10 0 4 4 0 0 0 0 8h10a4 4 0 0 0 0-8z"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  beaker: <><path d="M4 22h16"/><path d="M6 18L10 3h4l4 15"/><path d="M6 14h12"/></>,
  alert: <><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.8L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  pen: <><path d="M17 3l4 4L8 20H4v-4L17 3z"/></>,
  map: <><path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2z"/><path d="M9 3v16M15 5v16"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  filter: <path d="M22 3H2l8 9v7l4 2v-9l8-9z"/>,
  more: <><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></>,
  settings: <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>,
  check: <path d="M20 6L9 17l-5-5"/>,
  x: <><path d="M18 6L6 18M6 6l12 12"/></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
  arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
  arrowDown: <><path d="M12 5v14M19 12l-7 7-7-7"/></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
  arrowLeft: <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
  wind: <><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></>,
  bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>,
  thermometer: <path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
  truck: <><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  tag: <><path d="M20 12l-8 8-8-8V4h8z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z"/>,
  syringe: <><path d="M18 2l4 4"/><path d="M17 3l3 3"/><path d="M19 9l-7-7-4 4 7 7"/><path d="M10 10L3 17v4h4l7-7"/></>,
  scale: <><path d="M12 3v18"/><path d="M5 9l-3 6a4 4 0 0 0 6 0l-3-6z"/><path d="M19 9l-3 6a4 4 0 0 0 6 0l-3-6z"/><path d="M3 6h18"/></>,
  timeline: <><circle cx="4" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><path d="M4 8v8"/><path d="M9 6h11"/><path d="M9 18h11"/><path d="M9 12h6"/></>,
  egg: <path d="M12 2C7 2 4 9 4 14a8 8 0 0 0 16 0c0-5-3-12-8-12z"/>,
  route: <><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M11 19h5.5a3.5 3.5 0 0 0 0-7H8.5a3.5 3.5 0 0 1 0-7H13"/></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></>,
  flask: <><path d="M9 2v6l-5 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2"/><path d="M9 2h6"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  chart: <><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-6"/></>,
  shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  send: <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></>,
  bug: <><circle cx="12" cy="13" r="5"/><path d="M12 8V5"/><path d="M8 5l1.5 2"/><path d="M16 5l-1.5 2"/><path d="M7 13H3"/><path d="M21 13h-4"/><path d="M7.5 16.5L4 19"/><path d="M16.5 16.5L20 19"/></>,
} as const;
