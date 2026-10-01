/* ============ So Lyon — app logic ============ */

let PLACES = [];
let state = {
  view: "feed",
  filter: "all",
  liked: new Set(),
  search: "",
  hood: "Tout Lyon",
  userMarker: null,
};

const CAT_INFO = {
  food:     { label: "Food",     icon: "🍽️", bg: "#f7e2d8", color: "#ce6a4a" },
  sortir:   { label: "Sortir",  icon: "🍸", bg: "#f5dce6", color: "#c14f7c" },
  culture:  { label: "Culture",  icon: "🎭", bg: "#f3e7f4", color: "#8e5fa8" },
  outdoor:  { label: "Nature",   icon: "🌳", bg: "#e9efe2", color: "#5e7c52" },
  sport:    { label: "Sport",    icon: "🏅", bg: "#eaf1f5", color: "#4a83a8" },
  other:    { label: "Lieu",     icon: "📍", bg: "#f4eada", color: "#6b5c4e" },
};

const AMENITY_LABEL = {
  restaurant: "Restaurant", cafe: "Café", bar: "Bar", fast_food: "Fast-food",
  pub: "Pub", ice_cream: "Glacier", biergarten: "Biergarten", food_court: "Cafétéria",
  nightclub: "Boîte de nuit",
  bakery: "Boulangerie", pastry: "Pâtisserie",
  park: "Parc", garden: "Jardin", playground: "Aire de jeux", viewpoint: "Point de vue",
  sports_centre: "Centre sportif", fitness_centre: "Salle de fitness", stadium: "Stade",
  ice_rink: "Patinoire", water_park: "Parc aquatique",
  theatre: "Théâtre", cinema: "Cinéma", arts_centre: "Centre culturel",
  library: "Bibliothèque", community_centre: "Espace associatif", music_venue: "Salle de concert",
  museum: "Musée", gallery: "Galerie", attraction: "Attraction", artwork: "Œuvre d'art",
  zoo: "Zoo", aquarium: "Aquarium",
};

/* ---------- data loading ---------- */
let PHOTOS = {};
async function loadPhotos() {
  try { PHOTOS = await (await fetch("data/photos.json")).json(); } catch (e) { PHOTOS = {}; }
}
async function loadPlaces() {
  try {
    const r = await fetch("data/places.json");
    PLACES = await r.json();
  } catch (e) {
    PLACES = [];
  }
}

const placeById = (id) => PLACES.find((p) => p.id === id);

/* ---------- helpers ---------- */
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function displayPrice(p) {
  if (p.price_level) {
    const n = parseInt(p.price_level);
    if (n === 1) return "€";
    if (n === 2) return "€€";
    if (n >= 3) return "€€€";
  }
  const cheap = ["kebab", "pizza", "sandwich", "burger", "fast_food", "bakery", "ice_cream"];
  return cheap.some((k) => (p.cuisine + p.amenity).includes(k)) ? "€" : "";
}

/* Opening-hours parsing: OSM format -> {day: ranges} */
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAY_FR = { Mo: "Lundi", Tu: "Mardi", We: "Mercredi", Th: "Jeudi", Fr: "Vendredi", Sa: "Samedi", Su: "Dimanche" };

function parseHours(str) {
  if (!str) return null;
  const out = {};
  str.split(";").forEach((seg) => {
    seg = seg.trim();
    const m = seg.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(.+)$/);
    if (!m) return;
    const from = DAYS.indexOf(m[1]), to = m[2] ? DAYS.indexOf(m[2]) : from;
    for (let i = from; i <= to; i++) {
      (out[DAYS[i]] = out[DAYS[i]] || []).push(m[3].trim());
    }
  });
  return Object.keys(out).length ? out : (str.match(/Mo|Tu|We|Th|Fr|Sa|Su/) ? { raw: str } : null);
}

function isOpenNow(p) {
  const h = parseHours(p.opening_hours);
  if (!h) return null;
  const now = new Date();
  const day = DAYS[(now.getDay() + 6) % 7];
  const ranges = h[day];
  if (!ranges) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const r of ranges) {
    const m = r.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!m) continue;
    const a = +m[1] * 60 + +m[2];
    let b = +m[3] * 60 + +m[4];
    if (b < a) b = 1440 + b; // overnight
    if (cur >= a && cur <= b) return true;
  }
  return false;
}

function hoursTable(p) {
  const h = parseHours(p.opening_hours);
  if (!h) return null;
  if (h.raw) return `<div class="h-row"><span>Horaires</span><span>${esc(h.raw)}</span></div>`;
  const today = DAYS[(new Date().getDay() + 6) % 7];
  let html = "";
  DAYS.forEach((d) => {
    if (h[d]) {
      html += `<div class="h-row ${d === today ? "today" : ""}"><span>${DAY_FR[d]}${d === today ? " (auj.)" : ""}</span><span>${esc(h[d].join(", "))}</span></div>`;
    }
  });
  return html || null;
}

/* ---------- navigation ---------- */
function go(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === view));
  render();
  window.scrollTo(0, 0);
}

function render() {
  const v = document.getElementById("view");
  const views = { feed: viewFeed, challenges: viewChallenges, map: viewMap, badges: viewBadges, profile: viewProfile };
  v.innerHTML = views[state.view]();
  if (state.view === "map") initMap();
}

/* ---------- fil ---------- */
function viewFeed() {
  const cats = [
    ["all", "Tout"], ["food", "🍽️ Food"], ["sortir", "🍸 Sortir"],
    ["culture", "🎭 Culture"], ["outdoor", "🌳 Nature"], ["sport", "🏅 Sport"],
  ];
  const chips = cats.map(([k, l]) =>
    `<button class="chip ${state.filter === k ? "active" : ""}" onclick="setFilter('${k}')">${l}</button>`).join("");

  let posts = DEMO_POSTS;
  if (state.filter !== "all") {
    posts = DEMO_POSTS.filter((post) => {
      const place = PLACES.find((p) => p.name === post.place);
      return place && place.cat === state.filter;
    });
  }

  const cards = posts.map((p) => {
    const place = PLACES.find((pl) => pl.name === p.place);
    const info = place ? CAT_INFO[place.cat] : CAT_INFO.other;
    const price = place ? displayPrice(place) : "";
    const open = place ? isOpenNow(place) : null;
    const openBadge = open === null ? "" : open
      ? `<span class="pill" style="font-size:.68rem;padding:2px 8px;">🟢 ouvert</span>`
      : `<span class="pill no" style="font-size:.68rem;padding:2px 8px;">🔴 fermé</span>`;
    const liked = state.liked.has(p.id);
    return `
    <article class="post">
      <div class="post-img" style="background:${info.bg}" onclick="openPlace('${place ? place.id : ""}')">
        ${place && PHOTOS[place.id] ? `<img src="${PHOTOS[place.id]}" alt="${esc(place.name)}" loading="lazy">` : `<span>${info.icon}</span>`}
        <span class="cat-tag">${info.label}</span>
        ${price ? `<span class="price-tag">${price}</span>` : ""}
      </div>
      <div class="post-body">
        <div class="post-user">
          <div class="u-av">${p.emoji}</div>
          <div>
            <div class="u-name">${esc(p.user)}</div>
            <div class="u-meta">${esc(p.meta)}</div>
          </div>
        </div>
        <div class="post-text">${esc(p.text)}</div>
        <div class="post-tags">${p.tags.map((t) => `<span class="ptag ${t === "terrasse" ? "t" : ""}">#${esc(t)}</span>`).join("")}</div>
        ${place ? `
        <div class="post-place" onclick="openPlace('${place.id}')">
          <span class="pp-ic">📍</span>
          <span class="pp-name">${esc(place.name)}</span>
          <span class="pp-open">${openBadge} <span style="font-size:1rem">›</span></span>
        </div>` : ""}
        <div class="post-actions">
          <button class="pa-btn ${liked ? "on" : ""}" onclick="toggleLike('${p.id}')">${liked ? "❤️" : "🤍"} ${p.likes + (liked ? 1 : 0)}</button>
          <button class="pa-btn" onclick="toast('Commentaires bientôt disponibles 💬')">💬 ${p.comments}</button>
          <button class="pa-btn" onclick="toast('Partagé ✨')">↗ Partager</button>
        </div>
      </div>
    </article>`;
  }).join("");

  return `
    <div class="view-head"><h1>Le fil de Lyon</h1><p>Les bons plans partagés par la communauté</p></div>
    <div class="chips">${chips}</div>
    ${cards || `<div class="empty">Pas encore de post dans cette catégorie 🌱</div>`}
    <button class="fab" onclick="toast('Création de post — bientôt !')" aria-label="Créer">＋</button>`;
}

function setFilter(f) { state.filter = f; render(); }

function toggleLike(id) {
  state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
  render();
}

/* ---------- défis ---------- */
function viewChallenges() {
  const cards = CHALLENGES.map((c) => `
    <div class="chal ${c.hot ? "hot" : ""}" onclick="showChallenge('${c.id}')">
      <div class="chal-cat">🏆 ${c.cat} · ${c.n} participants</div>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.desc)}</p>
      <div class="progressbar"><i style="width:${Math.min(100, (c.progress / c.goal) * 100)}%"></i></div>
      <div class="chal-meta"><span>${c.progress}/${c.goal} complétés</span></div>
      <button class="chal-join ${c.joined ? "joined" : ""}" onclick="event.stopPropagation(); toggleJoin('${c.id}')">
        ${c.joined ? "✓ Rejoint" : "Rejoindre"}
      </button>
    </div>`).join("");

  return `
    <div class="view-head"><h1>Défis</h1><p>Releve-toi des défis créés par la communauté</p></div>
    <div class="chips">
      <button class="chip active">Tous</button>
      <button class="chip" onclick="toast('Filtres bientôt disponibles')">Food</button>
      <button class="chip" onclick="toast('Filtres bientôt disponibles')">Culture</button>
      <button class="chip" onclick="toast('Filtres bientôt disponibles')">Sport</button>
    </div>
    ${cards}
    <button class="fab" onclick="openCreateChallenge()" aria-label="Créer un défi">＋</button>`;
}

function toggleJoin(id) {
  const c = CHALLENGES.find((x) => x.id === id);
  c.joined = !c.joined;
  toast(c.joined ? `Défi rejoint : ${c.title}` : "Défi quitté");
  render();
}

function showChallenge(id) {
  const c = CHALLENGES.find((x) => x.id === id);
  openSheet(`
    <div class="sheet-hero" style="background:var(--terra-soft)">🏆</div>
    <div class="sheet-body">
      <div class="s-cat">${c.cat} · ${c.n} participants</div>
      <h2>${esc(c.title)}</h2>
      <p style="color:var(--ink-soft);margin-top:6px">${esc(c.desc)}</p>
      <div class="progressbar" style="margin-top:16px"><i style="width:${Math.min(100, (c.progress / c.goal) * 100)}%"></i></div>
      <div class="sheet-cta">
        <button class="scta primary" onclick="toggleJoin('${c.id}'); closeSheet()">${c.joined ? "Quitter le défi" : "Rejoindre le défi"}</button>
      </div>
    </div>`);
}

function openCreateChallenge() {
  openSheet(`
    <div class="sheet-body" style="padding-top:12px">
      <h2 style="font-size:1.2rem">Créer un défi 🏁</h2>
      <p style="color:var(--ink-faint);font-size:.85rem;margin-top:3px">Ta communauté te suit dans 30 secondes.</p>
      <div style="margin-top:16px">
        <div class="field"><label>Titre du défi</label><input id="cc-title" placeholder="Ex : Tour des glacier de la presqu'île"></div>
        <div class="field"><label>Catégorie</label>
          <select id="cc-cat"><option>Food</option><option>Culture</option><option>Sport</option><option>Outdoor</option></select>
        </div>
        <div class="field"><label>Description</label><textarea id="cc-desc" placeholder="Explique les règles en une ou deux phrases..."></textarea></div>
        <div class="field"><label>Objectif (nombre de lieux)</label><input id="cc-goal" type="number" min="1" value="3"></div>
        <button class="scta primary" style="width:100%" onclick="submitChallenge()">Publier le défi</button>
      </div>
    </div>`);
}

function submitChallenge() {
  const title = document.getElementById("cc-title").value.trim();
  const cat = document.getElementById("cc-cat").value;
  const desc = document.getElementById("cc-desc").value.trim();
  const goal = Math.max(1, parseInt(document.getElementById("cc-goal").value) || 3);
  if (!title) { toast("Donne un titre à ton défi !"); return; }
  CHALLENGES.unshift({ id: "u" + Date.now(), cat, title, desc: desc || "Défi créé par la communauté.", goal, joined: true, progress: 0, n: 1 });
  closeSheet();
  state.view = "challenges";
  render();
  toast("Défi publié ! 🎉");
}

/* ---------- badges ---------- */
function viewBadges() {
  const earned = BADGES.filter((b) => b.earned).length;
  return `
    <div class="view-head"><h1>Badges</h1><p>${earned}/${BADGES.length} débloqués — continue d'explorer !</p></div>
    <div class="badges-grid">
      ${BADGES.map((b) => `
        <div class="badge ${b.earned ? "earned" : ""}">
          <span class="b-ic">${b.ic}</span>
          <div class="b-name">${esc(b.name)}</div>
          <div class="b-desc">${esc(b.desc)}</div>
        </div>`).join("")}
    </div>`;
}

/* ---------- carte ---------- */
let mapObj = null;
const NEIGHBORHOODS = [
  ["Tout Lyon", null],
  ["Presqu'île", [45.7676, 4.8342]],
  ["Vieux Lyon", [45.7622, 4.8270]],
  ["Croix-Rousse", [45.7772, 4.8301]],
  ["Part-Dieu", [45.7600, 4.8540]],
  ["Confluence", [45.7420, 4.8180]],
  ["Tête d'Or", [45.7770, 4.8530]],
  ["Gerland", [45.7300, 4.8320]],
  ["Villeurbanne", [45.7719, 4.8900]],
  ["Bron", [45.7333, 4.9667]],
  ["Vaise", [45.7800, 4.8030]],
  ["Fourvière", [45.7620, 4.8220]],
];

function viewMap() {
  const counts = {};
  PLACES.forEach((p) => counts[p.cat] = (counts[p.cat] || 0) + 1);
  return `
    <div class="view-head"><h1>Carte</h1><p>${PLACES.length.toLocaleString("fr-FR")} lieux à Lyon et alentours</p></div>
    <div class="search-box">
      <select id="map-hood" onchange="setMapHood(this.value)">
        ${NEIGHBORHOODS.map(([n, c]) => `<option value="${n}" ${state.hood === n ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </div>
    <div class="chips" id="map-chips">
      <button class="chip ${state.filter === "all" ? "active" : ""}" onclick="setMapFilter('all')">✨ Tout</button>
      ${["food", "sortir", "culture", "outdoor", "sport"].map((k) =>
        `<button class="chip ${state.filter === k ? "active" : ""}" onclick="setMapFilter('${k}')">${CAT_INFO[k].icon} ${CAT_INFO[k].label} · ${counts[k] || 0}</button>`).join("")}
    </div>
    <div id="map-frame"></div>
    <button class="locate-btn" onclick="locateMe()">📍 Autour de moi</button>
    <p class="map-hint">Tape une épingle pour ouvrir la fiche du lieu</p>`;
}

function setMapHood(n) {
  state.hood = n;
  const c = NEIGHBORHOODS.find(([name]) => name === n)[1];
  if (c && mapObj) mapObj.flyTo(c, 14, { duration: 0.8 });
}

function setMapFilter(k) {
  state.filter = state.filter === k ? "all" : k;
  render();
}

function ensureLeaflet(cb) {
  if (typeof L !== "undefined" && typeof L.MarkerClusterGroup !== "undefined") { cb(); return; }
  if (typeof L === "undefined") {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => ensureLeaflet(cb);
    document.body.appendChild(s);
    return;
  }
  const css2 = document.createElement("link");
  css2.rel = "stylesheet";
  css2.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
  document.head.appendChild(css2);
  const css3 = document.createElement("link");
  css3.rel = "stylesheet";
  css3.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
  document.head.appendChild(css3);
  const s2 = document.createElement("script");
  s2.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
  s2.onload = cb;
  document.body.appendChild(s2);
}

function locateMe() {
  if (!navigator.geolocation) { toast("GPS non disponible sur cet appareil"); return; }
  toast("Recherche de ta position…");
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    if (mapObj) {
      mapObj.flyTo([lat, lon], 16, { duration: 1 });
      if (state.userMarker) mapObj.removeLayer(state.userMarker);
      state.userMarker = L.circleMarker([lat, lon], {
        radius: 9, color: "#fff", weight: 3, fillColor: "#4a83a8", fillOpacity: 1,
      }).addTo(mapObj);
      const nearest = PLACES.slice().sort((a, b) =>
        (Math.hypot(a.lat - lat, a.lon - lon)) - (Math.hypot(b.lat - lat, b.lon - lon)))[0];
      if (nearest) toast(`Le plus proche : ${nearest.name}`);
    }
  }, () => toast("Position refusée — autorise la localisation dans Safari"), { enableHighAccuracy: true, timeout: 8000 });
}

function initMap() {
  const frame = document.getElementById("map-frame");
  if (!frame) return;
  frame.innerHTML = "<p style='padding:40px;text-align:center;color:var(--ink-faint)'>Chargement de la carte…</p>";
  ensureLeaflet(() => buildMap(frame));
}

function pinIcon(cat) {
  const info = CAT_INFO[cat] || CAT_INFO.other;
  const svg = "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">` +
    `<path d="M17 1C8.7 1 2 7.7 2 16c0 11 15 24 15 24s15-13 15-24C32 7.7 25.3 1 17 1z" fill="${info.color}" stroke="#fff" stroke-width="2"/>` +
    `<text x="17" y="21.5" font-size="12" text-anchor="middle" dominant-baseline="middle">${info.icon}</text></svg>`);
  return L.icon({ iconUrl: svg, iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -36] });
}

function buildMap(frame) {
  if (mapObj) { mapObj.remove(); mapObj = null; }
  frame.innerHTML = "";

  mapObj = L.map(frame, { zoomControl: false }).setView([45.7578, 4.8320], 12);
  L.control.zoom({ position: "bottomright" }).addTo(mapObj);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
    className: "map-tint",
  }).addTo(mapObj);

  const icons = {};
  Object.keys(CAT_INFO).forEach((k) => icons[k] = pinIcon(k));

  const places = state.filter !== "all" ? PLACES.filter((p) => p.cat === state.filter) : PLACES;
  const cluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: (c) => {
      const n = c.getChildCount();
      const size = n < 50 ? 42 : n < 300 ? 52 : 62;
      return L.divIcon({
        html: `<div class="cluster-bubble" style="width:${size}px;height:${size}px;font-size:${size < 50 ? .8 : .95}rem">${n}</div>`,
        className: "cluster-wrap",
        iconSize: [size, size],
      });
    },
  });
  places.forEach((p) => {
    const m = L.marker([p.lat, p.lon], { icon: icons[p.cat] || icons.other });
    m.on("click", () => openPlace(p.id));
    cluster.addLayer(m);
  });
  mapObj.addLayer(cluster);
  setTimeout(() => mapObj.invalidateSize(), 150);
}

/* ---------- fiche lieu ---------- */
function openPlace(id) {
  const p = placeById(id);
  if (!p) { toast("Fiche lieu bientôt disponible"); return; }
  const info = CAT_INFO[p.cat] || CAT_INFO.other;
  const amenity = AMENITY_LABEL[p.amenity] || p.amenity || "Lieu";
  const hours = hoursTable(p);
  const fullAddr = [p.housenumber, p.street].filter(Boolean).join(" ");
  const price = displayPrice(p);

  const pills = [];
  if (p.outdoor_seating === "yes") pills.push(["🌳 Terrasse", ""]);
  if (p.wheelchair === "yes") pills.push(["♿ Accessible PMR", ""]);
  if (p.takeaway === "yes") pills.push(["🥡 Vente à emporter", ""]);
  if (p.delivery === "yes") pills.push(["🛵 Livraison", ""]);
  if (p.vegetarian === "yes" || p.vegan === "yes") pills.push(["🌿 Veggie friendly", ""]);
  if (p.dog === "yes") pills.push(["🐶 Animaux bienvenus", ""]);
  if (p.internet_access === "wlan" || p.internet_access === "yes") pills.push(["📶 Wi-Fi", ""]);
  if (price === "€") pills.push(["💰 Petit prix", "warn"]);

  const open = isOpenNow(p);
  const openLabel = open === null ? "" : open ? "🟢 Ouvert maintenant" : "🔴 Fermé actuellement";

  openSheet(`
    <div class="sheet-grab"></div>
    ${PHOTOS[p.id]
      ? `<div class="sheet-hero photo"><img src="${PHOTOS[p.id]}" alt="${esc(p.name)}"></div>`
      : `<div class="sheet-hero" style="background:${info.bg}">${info.icon}</div>`}
    <div class="sheet-body">
      <div class="s-cat">${esc(amenity)}${price ? ` · ${price}` : ""}</div>
      <h2>${esc(p.name)}</h2>
      ${openLabel ? `<p style="font-weight:700;font-size:.86rem;margin-top:4px;color:var(${open ? "--olive" : "--terra-deep"})">${openLabel}</p>` : ""}

      <div class="info-grid">
        <div class="info-cell" onclick="copyAddr('${esc(fullAddr)}')" style="cursor:pointer">
          <div class="ic-label">📍 Adresse</div>
          <div class="ic-val ${fullAddr ? "" : "muted"}">${esc(fullAddr || "—")}${p.city ? `<br><span style="font-weight:400;color:var(--ink-faint)">${esc(p.city)}</span>` : ""}</div>
        </div>
        <div class="info-cell" ${p.phone ? `onclick="window.location.href='tel:'+'${esc(p.phone)}'" style="cursor:pointer"` : ""}>
          <div class="ic-label">📞 Téléphone</div>
          <div class="ic-val ${p.phone ? "" : "muted"}">${esc(p.phone || "—")}</div>
        </div>
        <div class="info-cell" ${p.website ? `onclick="window.open('${esc(p.website)}','_blank')" style="cursor:pointer"` : ""}>
          <div class="ic-label">🌐 Site web</div>
          <div class="ic-val ${p.website ? "" : "muted"}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.website || "—")}</div>
        </div>
        <div class="info-cell">
          <div class="ic-label">🍜 Spécialité</div>
          <div class="ic-val ${p.cuisine ? "" : "muted"}">${esc(p.cuisine ? p.cuisine.split(";")[0].replace(/_/g, " ") : "—")}</div>
        </div>
      </div>

      ${hours ? `<div class="hours">${hours}</div>` : ""}

      ${pills.length ? `<div class="pills">${pills.map(([l, c]) => `<span class="pill ${c}">${l}</span>`).join("")}</div>` : ""}

      <div class="sheet-cta">
        <button class="scta primary" onclick="checkIn('${p.id}')">✓ J'y suis !</button>
        <button class="scta" onclick="savePlace('${p.id}')">🔖 Enregistrer</button>
      </div>
      <p style="text-align:center;font-size:.7rem;color:var(--ink-faint);margin-top:14px">
        Données OpenStreetMap © les contributeurs d'OSM
      </p>
    </div>`);
}

function copyAddr(a) { if (a && a !== "—") toast("Adresse : " + a); }

function checkIn(id) {
  toast("Check-in enregistré ! +10 points 🦁");
  closeSheet();
}
function savePlace(id) {
  toast("Lieu enregistré dans ta collection 🔖");
}

/* ---------- recherche ---------- */
function openSearch() {
  openSheet(`
    <div class="sheet-grab"></div>
    <div class="sheet-body" style="padding-bottom:20px">
      <div class="search-box">
        <input id="search-input" placeholder="Rechercher un lieu à Lyon…" autofocus oninput="runSearch(this.value)">
      </div>
      <div id="search-results"><div class="empty">Tape un nom : restaurant, parc, musée…</div></div>
    </div>`);
  setTimeout(() => document.getElementById("search-input")?.focus(), 250);
}

function runSearch(q) {
  const box = document.getElementById("search-results");
  q = q.trim().toLowerCase();
  if (q.length < 2) { box.innerHTML = `<div class="empty">Tape un nom : restaurant, parc, musée…</div>`; return; }
  const res = PLACES.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    (p.cuisine && p.cuisine.toLowerCase().includes(q)) ||
    (p.amenity && p.amenity.toLowerCase().includes(q))
  ).slice(0, 25);
  box.innerHTML = res.length ? res.map((p) => {
    const info = CAT_INFO[p.cat] || CAT_INFO.other;
    const sub = [AMENITY_LABEL[p.amenity] || p.amenity, p.street].filter(Boolean).join(" · ");
    return `<div class="place-row" onclick="closeSheet(); openPlaceById('${p.id}')">
      <span class="pr-ic">${info.icon}</span>
      <div class="pr-main">
        <div class="pr-name">${esc(p.name)}</div>
        <div class="pr-sub">${esc(sub)}</div>
      </div>
      <span style="color:var(--ink-faint)">›</span>
    </div>`;
  }).join("") : `<div class="empty">Aucun résultat pour « ${esc(q)} » 😕</div>`;
}

function openPlaceById(id) {
  setTimeout(() => openPlace(id), 120);
}

/* ---------- sheet utils ---------- */
function openSheet(html) {
  const sheet = document.getElementById("sheet");
  sheet.innerHTML = html;
  document.getElementById("sheet-backdrop").classList.add("open");
  sheet.classList.add("open");
}
function closeSheet() {
  document.getElementById("sheet-backdrop").classList.remove("open");
  document.getElementById("sheet").classList.remove("open");
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- profil (avatar) ---------- */
document.querySelector(".avatar")?.addEventListener("click", (e) => {
  e.stopPropagation();
  go("profile");
});

/* ---------- boot ---------- */
Promise.all([loadPhotos(), loadPlaces()]).then(() => {
  if (PLACES.length) {
    DEMO_POSTS.forEach((post) => {
      if (!PLACES.find((p) => p.name === post.place)) {
        const fuzzy = PLACES.find((p) => p.name.toLowerCase().includes(post.place.toLowerCase().slice(0, 6)));
        if (fuzzy) post.place = fuzzy.name;
      }
    });
  }
  render();
});
render();


/* ---------- profil ---------- */
const PROFILE = {
  name: "Toi",
  handle: "@moi.lyon",
  bio: "Chasseuse de bons plans à Lyon 🦁 | food · culture · sport",
  followers: 142,
  following: 89,
  points: 1240,
};

let TODO_IDEAS = [
  { id: "t1", txt: "Brunch au Café Mokxa", done: false, pub: true },
  { id: "t2", txt: "Voir la fresque des Lyonnais", done: false, pub: true },
  { id: "t3", txt: "Pique-nique au Parc Blandan", done: false, pub: false },
  { id: "t4", txt: "Manger chez Daniel et Denise", done: false, pub: false },
  { id: "t5", txt: "Cours de climb à Crêpeloup", done: true, pub: true },
];
try {
  const saved = JSON.parse(localStorage.getItem("so-lyon-todos"));
  if (Array.isArray(saved) && saved.length) TODO_IDEAS = saved;
} catch (e) {}
function saveTodos() {
  try { localStorage.setItem("so-lyon-todos", JSON.stringify(TODO_IDEAS)); } catch (e) {}
}
let todoView = "all";

const WEEK_ACTIVITY = [3, 1, 4, 2, 5, 2, 6];

function viewProfile() {
  const photoPosts = DEMO_POSTS.filter((p) => {
    const pl = PLACES.find((x) => x.name === p.place);
    return pl && PHOTOS[pl.id];
  });
  const gridHTML = photoPosts.map((p) => {
    const pl = PLACES.find((x) => x.name === p.place);
    return `<div class="grid-cell" onclick="openPlace('${pl.id}')" style="background:${CAT_INFO[pl.cat].bg}">
      <img src="${PHOTOS[pl.id]}" loading="lazy" alt="${esc(pl.name)}">
    </div>`;
  }).join("");

  const max = Math.max(...WEEK_ACTIVITY);
  const bars = WEEK_ACTIVITY.map((v, i) => {
    const days = ["L", "M", "M", "J", "V", "S", "D"];
    return `<div class="bar-col"><div class="bar" style="height:${(v / max) * 100}%"><span class="bar-v">${v}</span></div><span class="bar-d">${days[i]}</span></div>`;
  }).join("");

  const shown = TODO_IDEAS.filter((t) => todoView === "all" || (todoView === "pub" ? t.pub : !t.pub));
  const todoHTML = shown.map((t) => `
    <div class="todo-row ${t.pub ? "" : "private"}" onclick="toggleTodo('${t.id}')">
      <span class="todo-check ${t.done ? "done" : ""}">${t.done ? "✓" : ""}</span>
      <span class="todo-txt ${t.done ? "done" : ""}">${esc(t.txt)}</span>
      <span class="todo-del" onclick="event.stopPropagation(); delTodo('${t.id}')">✕</span>
      ${t.pub ? "" : `<span class="todo-dot" title="Privé"></span>`}
    </div>`).join("");

  return `
    <div class="profile-head">
      <div class="p-avatar">🦁</div>
      <div class="p-stats">
        <div><b>${PROFILE.points}</b><span>points</span></div>
        <div><b>${PROFILE.followers}</b><span>followers</span></div>
        <div><b>${PROFILE.following}</b><span>suivis</span></div>
      </div>
    </div>
    <div class="p-name">${esc(PROFILE.name)} <span>${esc(PROFILE.handle)}</span></div>
    <div class="p-bio">${esc(PROFILE.bio)}</div>
    <div class="p-cta-row">
      <button class="scta primary" style="flex:1" onclick="toast('Edition du profil — avec les comptes réels 😉')">Modifier le profil</button>
    </div>

    <div class="section-title"><h2>Ma to-do list</h2><span style="font-size:.8rem;color:var(--ink-faint)">${TODO_IDEAS.filter(t=>!t.done).length} en attente</span></div>
    <div class="chips">
      <button class="chip ${todoView === "all" ? "active" : ""}" onclick="setTodoView('all')">Toutes</button>
      <button class="chip ${todoView === "pub" ? "active" : ""}" onclick="setTodoView('pub')">Pour tous</button>
      <button class="chip ${todoView === "priv" ? "active" : ""}" onclick="setTodoView('priv')">Privées</button>
    </div>
    <div class="todo">${todoHTML || '<div class="empty" style="padding:18px">Rien ici — ajoute une idée !</div>'}</div>
    <div class="todo-add">
      <input id="todo-input" placeholder="Ex : brunch chez Mokxa…" onkeydown="if(event.key==='Enter')addTodo()">
      <div class="todo-vis-toggle">
        <button class="chip ${todoAddPub ? "active" : ""}" onclick="todoAddPub=true;renderTodoOnly()">Pour tous</button>
        <button class="chip ${!todoAddPub ? "active" : ""}" onclick="todoAddPub=false;renderTodoOnly()">Privé</button>
      </div>
      <button class="todo-add-btn" onclick="addTodo()">＋</button>
    </div>

    <div class="section-title"><h2>Ma semaine</h2><span style="font-size:.8rem;color:var(--ink-faint)">${WEEK_ACTIVITY.reduce((a,b)=>a+b,0)} activités</span></div>
    <div class="chart">${bars}</div>

    <div class="section-title"><h2>Mes posts</h2></div>
    <div class="profile-grid">${gridHTML || '<div class="empty">Tes posts photo apparaîtront ici</div>'}</div>`;
}

let todoAddPub = true;

function toggleTodo(id) {
  const t = TODO_IDEAS.find((x) => x.id === id);
  t.done = !t.done;
  saveTodos();
  render();
}

function delTodo(id) {
  TODO_IDEAS = TODO_IDEAS.filter((x) => x.id !== id);
  saveTodos();
  render();
}

function addTodo() {
  const inp = document.getElementById("todo-input");
  const txt = (inp.value || "").trim();
  if (!txt) { toast("Écris d'abord ton idée 😉"); return; }
  TODO_IDEAS.unshift({ id: "t" + Date.now(), txt, done: false, pub: todoAddPub });
  saveTodos();
  render();
  toast(todoAddPub ? "Idée publique ajoutée" : "Idée privée ajoutée");
}

function setTodoView(v) {
  todoView = v;
  render();
}

function renderTodoOnly() { render(); }
