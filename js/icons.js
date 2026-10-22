/* ============================================================
   So Lyon — icônes SVG (style trait fin, cohérent)
   Usage : icon("map-pin") → <svg>...
   ============================================================ */

const ICONS = {
  // navigation
  "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  "flag": '<path d="M4 22V4"/><path d="M4 4c3-2 6 2 9 0s5-1 7 0v10c-2-1-4-2-7 0s-6-2-9 0"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "map": '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  "medal": '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-2 7 5.5-3 5.5 3-2-7"/>',
  "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>',
  "search": '<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>',
  "plus": '<path d="M12 5v14M5 12h14"/>',
  "check": '<path d="m4 12 6 6L20 6"/>',
  "x": '<path d="m6 6 12 12M18 6 6 18"/>',
  "chevron-left": '<path d="m15 5-7 7 7 7"/>',
  "chevron-right": '<path d="m9 5 7 7-7 7"/>',
  // catégories
  "food": '<path d="M6 3v8a3 3 0 0 0 6 0V3M9 11v10"/><path d="M15 3c-1.5 2-2 4-2 6s.8 3 2 3v9"/>',
  "drink": '<path d="M8 3h8l-1 9a3 3 0 0 1-6 0Z"/><path d="M5 3h14M12 15v6M9 21h6"/>',
  "culture": '<circle cx="12" cy="6" r="2"/><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><path d="M4 12v3c0 4 4 7 8 7s8-3 8-7v-3"/><path d="M2 12h20"/>',
  "nature": '<path d="M12 3 6 12c-.8 1.4-.6 3 .6 4l11.4 0c1.2-1 1.4-2.6.6-4Z"/><path d="M12 13v8"/>',
  "sport": '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
  // fiches lieux
  "phone": '<path d="M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z"/>',
  "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  "leaf": '<path d="M6 21c0-9 5-14 14-15-1 9-6 14-14 15Z"/><path d="M6 21c2-5 5-8 9-10"/>',
  "wifi": '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  "accessibility": '<circle cx="12" cy="4.5" r="2"/><path d="M6 8h12M12 8v6h4l3 6M12 14l-3 6"/>',
  "shopping-bag": '<path d="M6 8h12l1 13H5Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  "car": '<path d="M5 16 7 8h10l2 8M4 16h16v4h-2M4 20H2v-4h2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/>',
  "euro": '<path d="M17 6a7 7 0 1 0 0 12c-3 0-6-2-8-6s-5-6-8-6" transform="translate(2 0)"/><path d="M3 10h11M3 14h11"/>',
  "flame": '<path d="M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-5 .5 1.5 1.5 2 3 2-1-2-1-4 0-6Z"/>',
  "star": '<path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-3-5.5 3 1-6.1L3 9.5l6.3-.9Z"/>',
  "bookmark": '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  "send": '<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
  "heart": '<path d="M12 20s-7-4.5-9-9c-1.2-3 .5-7 4-7 2.5 0 4 2 5 4 1-2 2.5-4 5-4 3.5 0 5.2 4 4 7-2 4.5-9 9-9 9Z"/>',
  "message": '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z"/>',
  "share": '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6h14v-6"/>',
  "settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  "log-out": '<path d="M9 4H5v16h4"/><path d="M15 8l4 4-4 4M9 12h10"/>',
  "store": '<path d="M4 9 6 4h12l2 5M4 9v11h16V9M4 9c0 1.5 1.2 3 4 3s4-1.5 4-3c0 1.5 1.2 3 4 3s4-1.5 4-3"/>',
  "crosshair": '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  "pencil": '<path d="m4 20 1-4L16 5l3 3L8 19Z"/><path d="m14 7 3 3"/>',
};

function icon(name, size = 18, cls = "") {
  const paths = ICONS[name] || ICONS["map-pin"];
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

/* icône par catégorie (fiches, filtres, épingles) */
const CAT_ICON = { food: "food", sortir: "drink", culture: "culture", outdoor: "nature", sport: "sport", other: "map-pin" };
function catIcon(cat, size = 18, cls = "") { return icon(CAT_ICON[cat] || "map-pin", size, cls); }

/* badges : pictos dédiés, parlants */
ICONS["croissant"] = '<path d="M4 16c0-4 3.5-8 8-8s8 4 8 8c0 1-1 2-2 1.5-1.6-1-4-1.5-6-1.5s-4.4.5-6 1.5c-1 .5-2-.5-2-1.5Z"/><path d="M7 12.5c.8-2 2.5-3.5 5-4M13 8.5c2.5.5 4.2 2 5 4"/>';
ICONS["coffee"] = '<path d="M5 9h11v6a5 5 0 0 1-10 0Z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2M7 6c0-1.5 1-1.5 1-3M11 6c0-1.5 1-1.5 1-3"/>';
ICONS["museum"] = '<path d="M4 10 12 4l8 6"/><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9M3.5 19h17"/>';
ICONS["tree"] = '<path d="M12 3 6 11h4l-4 7h12l-4-7h4Z"/><path d="M12 18v3"/>';
ICONS["chef-hat"] = '<path d="M6 11a4 4 0 0 1 1-7.9A5 5 0 0 1 17 3.1 4 4 0 0 1 18 11v1H6Z"/><path d="M6 16h12M6 19h12"/>';
ICONS["dumbbell"] = '<path d="M7 8v8M4 9.5v5M17 8v8M20 9.5v5M7 12h10"/>';
ICONS["museum2"] = '<path d="M12 3 4 8v2h16V8Z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16"/>';
ICONS["compass"] = '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>';
