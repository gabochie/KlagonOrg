export interface BlogAuthor {
  name: string;
  slug: string;
  role: string;
  bio: string;
  icon: string;
}

export const BLOG_AUTHORS: BlogAuthor[] = [
  {
    name: "Kweku Asante",
    slug: "kweku-asante",
    role: "Software Engineer & Volunteer Mentor, KLAGON.org",
    bio: "Kweku is a self-taught software engineer who mentors Klagon youth on AI tools, programming, and building a career in tech. His 'learn by doing' approach has guided dozens of beginners into their first projects.",
    icon: "👨‍💻",
  },
  {
    name: "Emmanuel Kumi",
    slug: "emmanuel-kumi",
    role: "Programs Lead, KLAGON.org",
    bio: "Emmanuel designs KLAGON.org's learning and community programs. He works daily with young people turning digital skills into income, and brings that on-the-ground experience to every guide he writes.",
    icon: "🧭",
  },
  {
    name: "Ama Kofi",
    slug: "ama-kofi",
    role: "Youth Coach & Communication Specialist, KLAGON.org",
    bio: "Ama coaches young people in public speaking, confidence, and clear thinking. Her workshops focus on practical communication skills that open doors in school, work, and community life.",
    icon: "💬",
  },
  {
    name: "Serwaa Boateng",
    slug: "serwaa-boateng",
    role: "Community Projects Coordinator, KLAGON.org",
    bio: "Serwaa coordinates KLAGON.org's hands-on community projects — from the tree-planting drive to the youth coding club. She helps volunteers turn good intentions into finished, real-world outcomes.",
    icon: "🌳",
  },
  {
    name: "Mary Acheampong",
    slug: "mary-acheampong",
    role: "Digital Literacy Program Lead, KLAGON.org",
    bio: "Mary leads KLAGON.org's digital literacy programme, teaching seniors and newcomers to use phones, mobile money, and the internet. She writes about practical digital and money skills for everyday life.",
    icon: "📚",
  },
  {
    name: "The Discover Klagon Guides",
    slug: "discover-klagon-guides",
    role: "Community-Narrated Tour Team, Discover Klagon",
    bio: "The resident guides of Discover Klagon — vendors, elders, factory workers and youth who narrate their own market, kitchens and wetland. A share of every ticket goes directly to the guides who tell the story.",
    icon: "🧭",
  },
];

export function getAuthorByName(name: string): BlogAuthor | undefined {
  return BLOG_AUTHORS.find((a) => a.name === name);
}

export function getAuthorBySlug(slug: string): BlogAuthor | undefined {
  return BLOG_AUTHORS.find((a) => a.slug === slug);
}

export function getAllAuthors(): BlogAuthor[] {
  return BLOG_AUTHORS;
}