const DEMO_POSTS = [
  { id: "p1", user: "Camille", emoji: "🙋‍♀️", meta: "il y a 2 h · Presqu'île", text: "La brasserie légendaire de Lyon. On mange divinement bien pour le prix, le décor est à tomber. Réservez !", place: "Brasserie Georges", likes: 34, comments: 6, tags: ["brasserie", "petitprix"] },
  { id: "p2", user: "Yanis", emoji: "🧑‍🎨", meta: "il y a 5 h · Presqu'île", text: "Le meilleur café de la presqu'île pour bouquiner. Salon au calme, ils font une flûte extraordinaire.", place: "Café Français", likes: 21, comments: 2, tags: ["café", "cosy"] },
  { id: "p3", user: "Sofia", emoji: "👩‍🍳", meta: "hier · Confluence", text: "Le vrai bouchon lyonnais, quenelles à tomber. Ambiance typique et serveurs qui taquinent. J'adore !", place: "Le Bouchon des Filles", likes: 58, comments: 12, tags: ["bouchon", "tradition"] },
  { id: "p4", user: "Théo", emoji: "🧗", meta: "hier · Tête d'Or", text: "Session footing du matin au parc, les gazons au lever du jour 😍 j'ai même croisé les flamants roses.", place: "Parc de la Tête d'Or", likes: 27, comments: 3, tags: ["sport", "nature"] },
  { id: "p5", user: "Inès", emoji: "🌿", meta: "il y a 2 j · Part-Dieu", text: "Musée magnifique et gratuit le 1er dimanche du mois. Les collections contemporaines valent le détour.", place: "Musée d'Art Contemporain", likes: 44, comments: 8, tags: ["culture", "gratuit"] },
];

const CHALLENGES = [
  { id: "c1", cat: "Food", title: "Brunch Hunter 🍳", desc: "Goûter 3 brunchs différents en un mois et élire ton champion.", goal: 3, joined: true, progress: 2, hot: true, n: 412 },
  { id: "c2", cat: "Culture", title: "7 jours, 7 musées 🏛️", desc: "Un musée par jour pendant une semaine. Idéal pour septembre pluvieux.", goal: 7, joined: false, progress: 0, n: 128 },
  { id: "c3", cat: "Sport", title: "Les marches de la Croix-Rousse 🧗", desc: "Monter les 5 principaux escaliers du quartier. Jambes en feu garantie.", goal: 5, joined: true, progress: 3, n: 96 },
  { id: "c4", cat: "Food", title: "Tour des bouchons lyonnais 🍲", desc: "3 bouchons traditionnels, 3 quenelles, 1 tablier à la fin.", goal: 3, joined: false, progress: 0, n: 305 },
  { id: "c5", cat: "Outdoor", title: "Pique-nique au bord du Rhône 🌅", desc: "Un pique-nique au coucher du soleil dans 2 parcs différents.", goal: 2, joined: false, progress: 0, n: 74 },
];

const BADGES = [
  { ic: "🥐", name: "Croissant d'or", desc: "5 boulangeries visitées", earned: true },
  { ic: "🦁", name: "Petit lion", desc: "Premier post publié", earned: true },
  { ic: "☕", name: "Caférine", desc: "10 cafés testés", earned: true },
  { ic: "🏛️", name: "Culture vautf", desc: "3 musées visités", earned: false },
  { ic: "🌳", name: "Nomade", desc: "5 parcs explorés", earned: false },
  { ic: "🍲", name: "Quenelle d'or", desc: "3 bouchons complétés", earned: false },
  { ic: "🏃", name: "Endurance", desc: "10 activités sportives", earned: false },
  { ic: "📸", name: "Influenceur", desc: "100 likes reçus", earned: false },
  { ic: "🗺️", name: "Explorateur", desc: "20 lieux différents", earned: false },
];
