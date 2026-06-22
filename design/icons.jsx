// Tiny inline SVG icon set — stroke-based, 14px default
const Icon = ({ name, size = 14, className = '' }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', className };
  const p = {
    chat: <path d="M3 4h10v7H7l-3 2.5V11H3z" />,
    docs: <><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" /></>,
    users: <><circle cx="6" cy="6" r="2.2" /><path d="M2.5 13c0-2 1.5-3.4 3.5-3.4S9.5 11 9.5 13" /><circle cx="11" cy="6.5" r="1.7" /><path d="M9 9.5c2.5-.5 4.5 1 4.5 3.5" /></>,
    branding: <><circle cx="8" cy="8" r="5" /><path d="M8 3v3M8 10v3M3 8h3M10 8h3" /></>,
    chart: <><path d="M2.5 13V3" /><path d="M2.5 13h11" /><rect x="4.5" y="8" width="1.6" height="4" /><rect x="7" y="5" width="1.6" height="7" /><rect x="9.5" y="9" width="1.6" height="3" /><rect x="12" y="6.5" width="1.6" height="5.5" /></>,
    billing: <><rect x="2" y="4" width="12" height="9" rx="1" /><path d="M2 7h12" /></>,
    settings: <><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" /></>,
    audit: <><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M5.5 6h5M5.5 9h5M5.5 12h3" /><circle cx="11" cy="9" r="0.5" fill="currentColor" /></>,
    plus: <><path d="M8 3v10M3 8h10" /></>,
    search: <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L13.5 13.5" /></>,
    filter: <path d="M2 3h12l-4.5 5.5V13L6.5 11V8.5z" />,
    upload: <><path d="M8 11V3M5 6l3-3 3 3" /><path d="M2.5 11v2h11v-2" /></>,
    download: <><path d="M8 3v8M5 8l3 3 3-3" /><path d="M2.5 13h11" /></>,
    download_doc: <><path d="M8 2v7M5 6l3 3 3-3" /><path d="M2.5 13h11" /></>,
    close: <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
    chevron_left: <path d="M9.5 3.5L5 8l4.5 4.5" />,
    chevron_right: <path d="M6.5 3.5L11 8l-4.5 4.5" />,
    chevron_down: <path d="M3.5 6L8 10.5 12.5 6" />,
    arrow_up: <><path d="M8 13V3" /><path d="M4 7l4-4 4 4" /></>,
    sparkle: <><path d="M8 2l1.4 4.6L14 8l-4.6 1.4L8 14l-1.4-4.6L2 8l4.6-1.4z" /></>,
    citation: <><path d="M4 5v3.5c0 1 .8 1.5 1.5 1.5M4 5h2.5v3H4z" /><path d="M9.5 5v3.5c0 1 .8 1.5 1.5 1.5M9.5 5H12v3H9.5z" /></>,
    thumbs_up: <><path d="M5 7v6H3V7zM5 7l2.5-4c.8 0 1.5.7 1.5 1.5V7h3.5c.8 0 1.4.7 1.2 1.5l-1 4c-.1.6-.7 1-1.2 1H5" /></>,
    thumbs_down: <><path d="M5 9V3H3v6zM5 9l2.5 4c.8 0 1.5-.7 1.5-1.5V9h3.5c.8 0 1.4-.7 1.2-1.5l-1-4c-.1-.6-.7-1-1.2-1H5" /></>,
    copy: <><rect x="5" y="5" width="8" height="9" rx="1" /><path d="M3 11V3a1 1 0 011-1h7" /></>,
    share: <><circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="12" cy="12" r="1.5" /><path d="M5.3 7.2L10.7 4.7M5.3 8.8L10.7 11.3" /></>,
    refresh: <><path d="M3 8a5 5 0 0110-1" /><path d="M13 4v3h-3" /><path d="M13 8a5 5 0 01-10 1" /><path d="M3 12V9h3" /></>,
    send: <path d="M2 8l11-5-3.5 11-2-4.5z" />,
    eye: <><path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" /><circle cx="8" cy="8" r="1.5" /></>,
    eye_off: <><path d="M3 3l10 10" /><path d="M6.7 6.7C5 7.4 3.5 8 2 8s2 4 6 4c1 0 1.9-.2 2.6-.6" /><path d="M9.4 4.2c-.4-.1-.9-.2-1.4-.2-4 0-6 4-6 4s.6 1.2 1.8 2.3" /></>,
    folder: <><path d="M2 5a1 1 0 011-1h3l1.5 1.5h5.5a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1z" /></>,
    tag: <><path d="M2 7V3h4l8 8-4 4z" /><circle cx="5" cy="6" r="0.5" fill="currentColor" /></>,
    trash: <><path d="M3 4.5h10M5.5 4.5V3a1 1 0 011-1h3a1 1 0 011 1v1.5M4.5 4.5L5 13a1 1 0 001 1h4a1 1 0 001-1l.5-8.5" /></>,
    more: <><circle cx="4" cy="8" r="0.8" fill="currentColor" /><circle cx="8" cy="8" r="0.8" fill="currentColor" /><circle cx="12" cy="8" r="0.8" fill="currentColor" /></>,
    bell: <><path d="M4 11V7.5C4 5.6 5.8 4 8 4s4 1.6 4 3.5V11l1 1H3z" /><path d="M6.5 13a1.5 1.5 0 003 0" /></>,
    sun: <><circle cx="8" cy="8" r="2.5" /><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" /></>,
    moon: <path d="M12 9.5A4.5 4.5 0 016.5 4 4.5 4.5 0 1012 9.5z" />,
    check: <path d="M3 8.5l3 3 7-7" />,
    panel_open: <><rect x="2" y="3" width="12" height="10" rx="1" /><path d="M9.5 3v10" /></>,
    invite: <><circle cx="6" cy="6" r="2.2" /><path d="M2 13c0-2 1.8-3.4 4-3.4s4 1.4 4 3.4" /><path d="M11 6h3M12.5 4.5v3" /></>,
    sub: <><path d="M3 8h10" /><path d="M9 4l4 4-4 4" /></>,
    link: <><path d="M7 9.5L9 7.5" /><path d="M5 11l-1 1a2 2 0 11-3-3l1-1" /><path d="M11 5l1-1a2 2 0 113 3l-1 1" /></>,
    pin: <><path d="M8 9.5V14" /><path d="M5 9.5h6L9.5 7V3.5h-3V7z" /></>,
    book: <><path d="M3 3v9.5a1.5 1.5 0 001.5 1.5H13" /><path d="M3 3a1.5 1.5 0 011.5-1.5H13V11H4.5A1.5 1.5 0 003 12.5" /></>,
  };
  return <svg {...common}>{p[name] || null}</svg>;
};

window.Icon = Icon;