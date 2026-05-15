// Shared community data — imported by list page, detail page, and author profile.

export const AUTHORS = [
  {
    username: "amara-diallo",
    name: "Amara Diallo",
    initials: "AD",
    avatar: "",
    role: "Top Contributor",
    badge: "🏆",
    superhost: false,
    verified: true,
    location: "Yaoundé, Cameroon",
    joinedDate: "March 2021",
    yearsHosting: 4,
    totalReviews: 128,
    rating: 4.97,
    responseRate: 98,
    kudosReceived: 1240,
    posts: 87,
    bio: "Property investor and full-time host based in Yaoundé. I started with one apartment and now manage 6 listings across Cameroon. Passionate about helping new African hosts build sustainable businesses and avoid the mistakes I made early on.",
    work: "Real Estate",
    spendTime: "Photography",
    languages: ["French", "English", "Fulfulde"],
    achievements: [
      { label: "Top Contributor", icon: "🏆", desc: "Top 1% of community posts by engagement" },
      { label: "1,000+ Kudos", icon: "⭐", desc: "Received over 1,000 kudos from the community" },
      { label: "Mentor", icon: "🎓", desc: "Has helped 50+ new hosts through direct mentoring" },
      { label: "5-Year Host", icon: "🏠", desc: "Hosting for more than 5 years" },
    ],
  },
  {
    username: "kwame-asante",
    name: "Kwame Asante",
    initials: "KA",
    avatar: "",
    role: "Superhost",
    badge: "⭐",
    superhost: true,
    verified: true,
    location: "Accra, Ghana",
    joinedDate: "July 2022",
    yearsHosting: 2,
    totalReviews: 91,
    rating: 4.98,
    responseRate: 100,
    kudosReceived: 634,
    posts: 43,
    bio: "Superhost in Accra with a background in hospitality management. I treat hosting as a profession — every detail matters, from the thread count of the sheets to the follow-up message timing. I share templates and systems that actually work.",
    work: "Hospitality",
    spendTime: "Cooking",
    languages: ["English", "Twi"],
    achievements: [
      { label: "Superhost", icon: "⭐", desc: "Maintained Superhost status for 6 consecutive quarters" },
      { label: "100% Response Rate", icon: "⚡", desc: "Responds to every message within 30 minutes" },
      { label: "Rising Star", icon: "🌟", desc: "Fastest host to reach 90 reviews in Ghana" },
    ],
  },
  {
    username: "fatou-ndiaye",
    name: "Fatou Ndiaye",
    initials: "FN",
    avatar: "",
    role: "Host",
    badge: "",
    superhost: false,
    verified: true,
    location: "Dakar, Senegal",
    joinedDate: "January 2023",
    yearsHosting: 1,
    totalReviews: 43,
    rating: 4.91,
    responseRate: 91,
    kudosReceived: 312,
    posts: 28,
    bio: "First-time host running a cozy apartment in Dakar's Plateau neighborhood. Fluent in French, Wolof, and English which helps with international guests. I love bringing Senegalese culture into the hosting experience — from music playlists to local food recommendations.",
    work: "Fashion",
    spendTime: "Dancing",
    languages: ["French", "Wolof", "English"],
    achievements: [
      { label: "Welcoming Host", icon: "🤝", desc: "Recognized for exceptional guest welcome experiences" },
      { label: "Cultural Ambassador", icon: "🌍", desc: "Promotes local culture through hosting" },
    ],
  },
];

export type Author = typeof AUTHORS[number];

export function getAuthorByUsername(username: string): Author | undefined {
  return AUTHORS.find(a => a.username === username);
}

export function getAuthorByName(name: string): Author | undefined {
  return AUTHORS.find(a => a.name === name);
}
