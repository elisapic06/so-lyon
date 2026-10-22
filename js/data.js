const DEMO_POSTS = [
  { id: "p1", user: "Camille", emoji: "C", meta: "il y a 2 h · Presqu'île", text: "La brasserie légendaire de Lyon. On mange divinement bien pour le prix, le décor est à tomber. Réservez !", place: "Brasserie Georges", likes: 34, comments: 6, tags: ["brasserie", "petitprix"] },
  { id: "p2", user: "Yanis", emoji: "Y", meta: "il y a 5 h · Presqu'île", text: "Le meilleur café de la presqu'île pour bouquiner. Salon au calme, ils font une flûte extraordinaire.", place: "Café Français", likes: 21, comments: 2, tags: ["café", "cosy"] },
  { id: "p3", user: "Sofia", emoji: "S", meta: "hier · Confluence", text: "Le vrai bouchon lyonnais, quenelles à tomber. Ambiance typique et serveurs qui taquinent. J'adore !", place: "Le Bouchon des Filles", likes: 58, comments: 12, tags: ["bouchon", "tradition"] },
  { id: "p4", user: "Théo", emoji: "T", meta: "hier · Tête d'Or", text: "Session footing du matin au parc, les gazons au lever du jour 😍 j'ai même croisé les flamants roses.", place: "Parc de la Tête d'Or", likes: 27, comments: 3, tags: ["sport", "nature"] },
  { id: "p5", user: "Inès", emoji: "I", meta: "il y a 2 j · Part-Dieu", text: "Musée magnifique et gratuit le 1er dimanche du mois. Les collections contemporaines valent le détour.", place: "Musée d'Art Contemporain", likes: 44, comments: 8, tags: ["culture", "gratuit"] },
];

const CHALLENGES = [
  { id: "c1", cat: "Food", title: "Brunch Hunter", desc: "Goûter 3 brunchs différents en un mois et élire ton champion.", goal: 3, joined: true, progress: 2, hot: true, n: 412 },
  { id: "c2", cat: "Culture", title: "7 jours, 7 musées", desc: "Un musée par jour pendant une semaine. Idéal pour septembre pluvieux.", goal: 7, joined: false, progress: 0, n: 128 },
  { id: "c3", cat: "Sport", title: "Les marches de la Croix-Rousse", desc: "Monter les 5 principaux escaliers du quartier. Jambes en feu garantie.", goal: 5, joined: true, progress: 3, n: 96 },
  { id: "c4", cat: "Food", title: "Tour des bouchons lyonnais", desc: "3 bouchons traditionnels, 3 quenelles, 1 tablier à la fin.", goal: 3, joined: false, progress: 0, n: 305 },
  { id: "c5", cat: "Outdoor", title: "Pique-nique au bord du Rhône", desc: "Un pique-nique au coucher du soleil dans 2 parcs différents.", goal: 2, joined: false, progress: 0, n: 74 },
  { id: "c6", cat: "Sortir", title: "Cocktail crawl Presqu'île", desc: "3 bars à cocktails différents, un nouveau ingrédient découvert dans chacun.", goal: 3, joined: false, progress: 0, n: 188 },
  { id: "c7", cat: "Sortir", title: "Soirée concert", desc: "Assister à 2 concerts ou DJ sets dans des salles lyonnaises.", goal: 2, joined: false, progress: 1, n: 156 },
  { id: "c8", cat: "Culture", title: "Traboules mystérieuses", desc: "Traverser 5 traboules du Vieux Lyon et de la Croix-Rousse.", goal: 5, joined: false, progress: 0, n: 89 },
  { id: "c9", cat: "Outdoor", title: "Footing Tête d'Or", desc: "5 tours du parc au lever du jour. Les flamands roses t'attendent.", goal: 5, joined: true, progress: 2, n: 232 },
  { id: "c10", cat: "Food", title: "Food trucks express", desc: "Goûter 4 food trucks différents aux Halles ou sur les berges.", goal: 4, joined: false, progress: 0, n: 67 },
  { id: "c11", cat: "Sport", title: "Berges à vélo", desc: "Parcourir les 3 principaux tronçons des berges du Rhône à vélo.", goal: 3, joined: false, progress: 0, n: 141 },
  { id: "c12", cat: "Culture", title: "Fresques urbaines", desc: "Trouver et photographier 6 fresques lyonnaises (des Canuts, des Lyonnais...).", goal: 6, joined: false, progress: 0, n: 112 },
  { id: "c13", cat: "Food", title: "Glacier de l'été", desc: "3 glaciers testés, ta préférée élue sur le fil.", goal: 3, joined: false, progress: 0, n: 58 },
  { id: "c14", cat: "Sortir", title: "Rooftop sunset", desc: "2 rooftops lyonnais au coucher du soleil.", goal: 2, joined: false, progress: 0, n: 93 },
];

const BADGES = [
  // food
  { ic: "plate-cutlery", name: "Bouchons", desc: "0/3 complétés", earned: false, goal: 3, progress: 0 },
  { ic: "croissant", name: "Boulangeries", desc: "5 visites", earned: true, goal: 5, progress: 5 },
  { ic: "coffee", name: "Cafés", desc: "4/10 testés", earned: true, goal: 10, progress: 4 },
  { ic: "plate", name: "Restaurants", desc: "12/25 testés", earned: false, goal: 25, progress: 12 },
  { ic: "cocktail", name: "Bars", desc: "2/10 visités", earned: false, goal: 10, progress: 2 },
  { ic: "star", name: "Petits prix", desc: "8/15 spots à petit prix", earned: false, goal: 15, progress: 8 },
  // culture
  { ic: "museum", name: "Musées", desc: "1/3 visités", earned: false, goal: 3, progress: 1 },
  { ic: "theatre", name: "Théâtres", desc: "0/3 spectacles", earned: false, goal: 3, progress: 0 },
  { ic: "compass", name: "Monuments", desc: "3/10 découverts", earned: false, goal: 10, progress: 3 },
  { ic: "star", name: "Premier post", desc: "Débloqué", earned: true, goal: 1, progress: 1 },
  // nature
  { ic: "tree", name: "Parcs", desc: "2/5 explorés", earned: false, goal: 5, progress: 2 },
  { ic: "tree", name: "Jardins secrets", desc: "1/3 découverts", earned: false, goal: 3, progress: 1 },
  { ic: "compass", name: "Points de vue", desc: "0/5 panoramas", earned: false, goal: 5, progress: 0 },
  // sport
  { ic: "dumbbell", name: "Sport", desc: "3/10 activités", earned: false, goal: 10, progress: 3 },
  { ic: "dumbbell", name: "Endurance", desc: "2 semaines actives", earned: false, goal: 4, progress: 2 },
  { ic: "tree", name: "Trail urbain", desc: "0/3 courses", earned: false, goal: 3, progress: 0 },
  // social
  { ic: "heart", name: "Popularité", desc: "18/100 likes reçus", earned: false, goal: 100, progress: 18 },
  { ic: "user", name: "Sociable", desc: "5/10 followers", earned: false, goal: 10, progress: 5 },
  { ic: "map", name: "Explorateur", desc: "6/20 lieux différents", earned: false, goal: 20, progress: 6 },
  { ic: "flag", name: "Défis", desc: "1/3 complétés", earned: false, goal: 3, progress: 1 },
];
