// ═══════════════════════════════════════════════════════════
// PNJs & QUÊTES — 8 PNJs, 1-2 par biome
// ═══════════════════════════════════════════════════════════

export interface NpcQuest {
  id: string;
  description: string;
  type: "collect" | "boss" | "craft";
  need?: Record<string, number>; // items needed
  needBoss?: string;            // boss biome needed
  needTool?: string;            // craft needed
  reward: { type: "item" | "equip" | "tool"; id: string; name: string; emoji: string };
}

export interface NpcData {
  id: string;
  name: string;
  emoji: string;
  sprite: string; // knight, rogue, wizzard
  biome: string;
  x: number; y: number;
  quest: NpcQuest;
  dialogs: {
    greeting: string;
    quest: string;
    hint: string;
    complete: string;
    after: string;
  };
}

export const NPCS: NpcData[] = [
  // GARRIGUE
  {
    id: "marius", name: "Pépé Marius", emoji: "👴", sprite: "wizzard",
    biome: "garrigue", x: 40, y: 55,
    quest: {
      id: "q_boussole", description: "Trouver 3 Lavandes pour Pépé Marius",
      type: "collect", need: { lavande: 3 },
      reward: { type: "item", id: "boussole", name: "Boussole Ancienne", emoji: "🧭" },
    },
    dialogs: {
      greeting: "Ah, des jeunes ! Ça faisait longtemps... Je suis Marius, le cartographe.",
      quest: "Rapportez-moi 3 Lavandes et je vous donnerai ma vieille Boussole. Elle vous montrera le chemin.",
      hint: "La lavande pousse dans les hauteurs de la Garrigue, cherchez les taches violettes...",
      complete: "Parfait ! Humm... ce parfum ! Tenez, voici la Boussole Ancienne. Elle ne m'a jamais trompé.",
      after: "La Boussole vous guide bien ? Elle a été forgée par les anciens bâtisseurs des Restanques.",
    },
  },
  {
    id: "magali", name: "Tante Magali", emoji: "👵", sprite: "rogue",
    biome: "garrigue", x: 60, y: 40,
    quest: {
      id: "q_epee_bois", description: "Apporter 3 Branches et 2 Herbes à Tante Magali",
      type: "collect", need: { branche: 3, herbe: 2 },
      reward: { type: "equip", id: "epee_bois", name: "Épée en bois", emoji: "🗡️" },
    },
    dialogs: {
      greeting: "Bonjour mes petits ! Je suis Magali. On dit que je suis la meilleure tailleuse de bois du village.",
      quest: "3 Branches solides et 2 Herbes pour le cordage, et je vous fabrique une belle épée en bois !",
      hint: "Les branches tombent des grands chênes. Les herbes poussent partout dans la Garrigue.",
      complete: "Voilà ! Pas la plus tranchante, mais elle vous protégera des bestioles. En garde !",
      after: "Faites attention au Sanglier dans les hauteurs. Il est costaud mais pas très malin.",
    },
  },
  // CALANQUES
  {
    id: "marinette", name: "Marinette", emoji: "🎣", sprite: "rogue",
    biome: "calanques", x: 160, y: 40,
    quest: {
      id: "q_cotte", description: "Apporter 3 Poissons et 3 Coquillages à Marinette",
      type: "collect", need: { poisson: 3, coquillage: 3 },
      reward: { type: "equip", id: "tunique_cuir", name: "Tunique de cuir", emoji: "🧥" },
    },
    dialogs: {
      greeting: "Hé ! Moi c'est Marinette. Je pêche ici depuis que j'ai des dents.",
      quest: "3 Poissons et 3 Coquillages ? Je vous tisse une tunique qui résiste aux coups de bec !",
      hint: "Les poissons nagent près des rochers. Les coquillages, cherchez dans le sable.",
      complete: "Tadaa ! Tunique de cuir de mer. Ça sent un peu le poisson, mais ça protège !",
      after: "La Mouette Géante niche tout en haut des falaises. Elle déteste qu'on la dérange.",
    },
  },
  {
    id: "roustan", name: "Capitaine Roustan", emoji: "⚓", sprite: "knight",
    biome: "calanques", x: 140, y: 60,
    quest: {
      id: "q_mouette", description: "Vaincre la Mouette Géante pour le Capitaine",
      type: "boss", needBoss: "calanques",
      reward: { type: "equip", id: "amulette_herbes", name: "Amulette d'herbes", emoji: "📿" },
    },
    dialogs: {
      greeting: "Capitaine Roustan, marin d'eau douce et d'eau salée. À votre service !",
      quest: "Cette maudite Mouette terrorise mes marins ! Débarrassez-nous d'elle et je vous récompense.",
      hint: "Elle est au sommet des Calanques. Préparez des potions, elle frappe fort.",
      complete: "Elle est vaincue ! Prenez cette amulette, elle vient de ma grand-mère guérisseuse.",
      after: "La mer est calme maintenant. Merci, aventuriers.",
    },
  },
  // MINES
  {
    id: "marcel", name: "Marcel le Mineur", emoji: "⛏️", sprite: "knight",
    biome: "mines", x: 45, y: 160,
    quest: {
      id: "q_epee_fer", description: "Apporter 5 Fers et 3 Ocres à Marcel",
      type: "collect", need: { fer: 5, ocre: 3 },
      reward: { type: "equip", id: "epee_fer", name: "Épée de fer", emoji: "⚔️" },
    },
    dialogs: {
      greeting: "Marcel. Mineur depuis 40 ans. Ces tunnels, je les connais comme ma poche.",
      quest: "5 Fers et 3 Ocres. Avec ça je vous forge une vraie épée, pas un jouet en bois.",
      hint: "Le fer brille dans les parois sombres. L'ocre se cache dans les recoins orangés.",
      complete: "Tiens ! Une lame d'acier trempé. Ça, ça coupe !",
      after: "La Tarasque dort au fond des mines. Enfin... elle dormait.",
    },
  },
  // MER
  {
    id: "ondine", name: "Ondine", emoji: "🧜‍♀️", sprite: "wizzard",
    biome: "mer", x: 155, y: 160,
    quest: {
      id: "q_trident", description: "Apporter 3 Coraux et 2 Perles à Ondine",
      type: "collect", need: { corail: 3, perle: 2 },
      reward: { type: "equip", id: "trident", name: "Trident de corail", emoji: "🔱" },
    },
    dialogs: {
      greeting: "Je suis Ondine, gardienne des profondeurs. Peu d'humains arrivent jusqu'ici.",
      quest: "3 Coraux rouges et 2 Perles nacrées. Je forgerai un trident digne des rois de la mer.",
      hint: "Le corail pousse sur les récifs. Les perles se cachent dans les huîtres géantes.",
      complete: "Le Trident de Corail ! Il canalise la magie des océans. Utilisez-le bien.",
      after: "La Pieuvre Ancienne garde un trésor... la Clé des Restanques.",
    },
  },
  // RESTANQUES
  {
    id: "ancien", name: "L'Ancien des Pierres", emoji: "🧙", sprite: "wizzard",
    biome: "restanques", x: 100, y: 95,
    quest: {
      id: "q_bottes", description: "Forger le Sort de Séisme pour l'Ancien",
      type: "collect", need: { cristal: 3, ocre: 2 },
      reward: { type: "equip", id: "bottes_vent", name: "Bottes du Mistral", emoji: "💨" },
    },
    dialogs: {
      greeting: "Je suis le dernier gardien des Restanques. J'attendais votre venue.",
      quest: "Apportez-moi 3 Cristaux et 2 Ocres. Je vous donnerai les Bottes du Mistral.",
      hint: "Les cristaux brillent dans les mines et les restanques. L'ocre vient des profondeurs.",
      complete: "Ces bottes ont été portées par les anciens bâtisseurs. Avec elles, vous êtes aussi rapides que le vent.",
      after: "Le Mistral approche. Préparez-vous. Il sera le combat de votre vie.",
    },
  },
  {
    id: "fanfan", name: "Fanfan le Chasseur", emoji: "🏹", sprite: "knight",
    biome: "garrigue", x: 55, y: 65,
    quest: {
      id: "q_sanglier", description: "Vaincre le Sanglier pour Fanfan",
      type: "boss", needBoss: "garrigue",
      reward: { type: "equip", id: "sandales", name: "Sandales", emoji: "👡" },
    },
    dialogs: {
      greeting: "Fanfan ! Le meilleur chasseur de Garrigue. Enfin, le seul qui reste...",
      quest: "Ce Sanglier Ancien terrorise le village ! Battez-le et je vous donne mes meilleures sandales.",
      hint: "Le Sanglier rôde au centre de la Garrigue. Il est fort mais lent.",
      complete: "Héros ! Prenez ces sandales. Elles sont légères et solides.",
      after: "La Garrigue respire enfin. Merci, aventuriers !",
    },
  },
];
