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

export const POSTS = [
  {
    id: 1,
    slug: "how-i-went-from-0-to-40-reviews-in-6-months",
    category: "homes",
    pinned: true,
    title: "How I went from 0 to 40 reviews in 6 months — my complete blueprint",
    excerpt:
      "After struggling to get my first guests, I redesigned my listing, optimized pricing, and added a welcome kit. Here's everything that worked — and what didn't.",
    body: `After my first month as a host I had zero reviews and was barely getting any views. It was demoralizing. Then I systematically changed everything.

**Step 1 — Photography.** I hired a local photographer for $80. My click-through rate tripled overnight. Good lighting and wide-angle shots of every room are non-negotiable.

**Step 2 — Pricing strategy.** I stopped guessing and used a dynamic pricing tool. I lowered my nightly rate 15% below the neighborhood median to generate my first 10 reviews, then gradually raised it.

**Step 3 — The welcome kit.** I added a personal handwritten note, local snack basket, and a one-page neighborhood guide. This alone generated 12 unsolicited 5-star mentions in reviews.

**Step 4 — Response time.** I set up instant book and committed to replying within 30 minutes. Guests booking last-minute felt safe and left better reviews.

**Step 5 — The follow-up message.** Three hours after check-in I send a short message asking if everything is perfect. This catches small issues before they become review problems.

After 6 months: 40 reviews, 4.96 average rating, Superhost status. The blueprint is repeatable — I've seen it work for three friends I mentored.`,
    author: { name: "Amara Diallo", initials: "AD", role: "Top Contributor", avatar: "" },
    time: "2h ago",
    likes: 342,
    replies: 87,
    views: 4100,
    tags: ["Tips", "New Host"],
  },
  {
    id: 2,
    slug: "weekend-coffee-chat-most-unexpected-guest",
    category: "cafe",
    pinned: false,
    title: "Weekend coffee chat ☕ — What's the most unexpected thing a guest has done?",
    excerpt:
      "Share your funniest or most surprising guest story! I'll start: mine rearranged all my furniture into a 'feng shui' layout and left a note explaining why.",
    body: `Happy weekend everyone! It's time for our weekly Community Café thread.

This week's prompt: **What is the most unexpected — funny, surprising, or heartwarming — thing a guest has ever done in your space?**

I'll start. A guest last month rearranged every single piece of furniture in my living room into a completely different configuration. They left a very detailed handwritten note explaining the feng shui reasoning behind each move, and even included a small sketch.

They gave me 5 stars and said it was "the most balanced space they'd ever stayed in." The furniture is still in their arrangement — they were onto something.

Drop your stories below! 👇`,
    author: { name: "Fatou Ndiaye", initials: "FN", role: "Host", avatar: "" },
    time: "5h ago",
    likes: 219,
    replies: 143,
    views: 3820,
    tags: ["Fun", "Community"],
  },
  {
    id: 3,
    slug: "exact-message-template-98-percent-response-satisfaction",
    category: "homes",
    pinned: false,
    title: "The exact message template I use to get 98% response satisfaction",
    excerpt:
      "After 3 years of hosting, I've refined my pre-arrival message down to 7 sentences. I'm sharing the exact template with explanations for each section.",
    body: `Three years. 200+ stays. One pre-arrival message template that hasn't changed in 18 months because it simply works.

Here it is, with annotations:

---

*Hi [Name]! So excited to welcome you on [date]. Here's everything you need for a smooth arrival:*

**[Sentence 1 — personal welcome]** Use their first name. Mention the specific date. This confirms you've read their booking and reduces no-shows.

*Check-in is at [time]. Keypad code: [XXXX]. The lockbox is to the right of the front door.*

**[Sentences 2-3 — access info]** Be hyper-specific. No ambiguity means no 11pm calls.

*WiFi: [NetworkName] / Password: [XXXX]*

**[Sentence 4 — WiFi]** Guests check this before they unpack.

*There's a welcome basket on the kitchen counter with some local favorites.*

**[Sentence 5 — delight moment]** One sentence. No over-promising.

*My number is [XXX]. Message me anytime — I typically reply within 15 minutes.*

**[Sentence 6 — availability]** Sets expectation without making you feel like you're on call 24/7.

*Can't wait for you to experience [City]!*

**[Sentence 7 — closing]** Short, warm, human.

---

That's it. 7 sentences. Under 100 words. 98% satisfaction rating in post-stay surveys.`,
    author: { name: "Kwame Asante", initials: "KA", role: "Superhost", avatar: "" },
    time: "1d ago",
    likes: 186,
    replies: 52,
    views: 2940,
    tags: ["Templates", "Communication"],
  },
  {
    id: 4,
    slug: "12-african-cities-airbnb-demand-outpacing-supply",
    category: "explore",
    pinned: false,
    title: "Hidden gems: The 12 African cities where hosting demand is outpacing supply",
    excerpt:
      "Our research shows massive untapped hosting opportunity in cities like Kigali, Accra, and Nairobi. Here's the data and what it means for new hosts.",
    body: `After six months of analyzing booking data across 30 African cities, the pattern is clear: **demand is massively outpacing supply in a dozen markets**.

Here are the top 12, ranked by demand-supply gap:

1. **Kigali, Rwanda** — Business travel boom, almost no quality short-term supply
2. **Accra, Ghana** — Diaspora tourism surging, listings fail to meet quality bar
3. **Nairobi, Kenya** — Safari gateway, strong demand for business-adjacent stays
4. **Abidjan, Côte d'Ivoire** — Fast-growing economy, expat demand underserved
5. **Douala, Cameroon** — Port city with year-round business travel
6. **Dakar, Senegal** — Cultural tourism boom, few English-friendly listings
7. **Kampala, Uganda** — Strong NGO and diplomatic demand
8. **Dar es Salaam, Tanzania** — Tourist gateway with chronic supply shortage
9. **Lomé, Togo** — Overlooked but growing rapidly
10. **Cotonou, Benin** — Business hub with near-zero competition
11. **Lusaka, Zambia** — Mining sector driving business stays
12. **Harare, Zimbabwe** — Pent-up demand from improving visa situation

For hosts in these cities: **this is your moment**. Early movers capture disproportionate review share and rank higher as listings scale.`,
    author: { name: "Amara Diallo", initials: "AD", role: "Top Contributor", avatar: "" },
    time: "2d ago",
    likes: 154,
    replies: 39,
    views: 2210,
    tags: ["Africa", "Market Data"],
  },
  {
    id: 5,
    slug: "complete-tax-guide-african-hosts",
    category: "resources",
    pinned: false,
    title: "Complete tax guide for African hosts — what you need to report and when",
    excerpt:
      "Tax obligations vary by country but the principles are similar. This guide covers Cameroon, Nigeria, Ghana, and Kenya with links to official resources.",
    body: `Disclaimer: I'm not a tax professional. This is a community resource, not legal advice. Consult a licensed accountant in your country.

That said — here's what I've learned after 3 years of compliant hosting across multiple markets.

**The universal principle:** Short-term rental income is taxable income. Everywhere. Full stop.

**Cameroon:** Report under "revenus fonciers" on your annual declaration. The flat rate is 15% after a 30% standard deduction. DGI accepts digital declarations now.

**Nigeria:** FIRS taxes rental income at personal income tax rates (7–24% depending on bracket). Lagos-based hosts also pay state-level taxes.

**Ghana:** GRA treats short-term rental income as business income. Register as a sole proprietor and file quarterly.

**Kenya:** KRA has a simplified rental income tax of 10% on gross rental receipts for those earning under KES 15M/year. File monthly via iTax.

**Pro tip:** Keep a dedicated bank account for hosting income. It makes tax time dramatically simpler and protects you in an audit.`,
    author: { name: "Kwame Asante", initials: "KA", role: "Superhost", avatar: "" },
    time: "3d ago",
    likes: 98,
    replies: 27,
    views: 1870,
    tags: ["Finance", "Tax"],
  },
  {
    id: 6,
    slug: "regional-host-summit-douala",
    category: "cafe",
    pinned: false,
    title: "Who else is going to the Regional Host Summit in Douala next month?",
    excerpt:
      "The annual summit is back! I'll be there to meet fellow hosts, attend the pricing workshop, and hopefully convince a few of you to do a group co-hosting arrangement.",
    body: `The Regional Host Summit is returning to Douala on June 14-15 and I'm so excited!

For those who haven't attended before: it's a two-day event organized by the West African Hosts Network. Last year had 340 attendees from 12 countries.

**Sessions I'm most excited about:**
- Dynamic pricing masterclass (Saturday morning)
- Co-hosting legal frameworks panel (Saturday afternoon)
- Building a cleaning team you can trust (Sunday morning)
- Q&A with the regional policy team (Sunday afternoon)

**The co-hosting conversation:** I've been thinking about a formal co-hosting group for Douala-area hosts. The idea: share cleaning teams, maintenance contacts, and cover each other during travel. If you're interested in discussing this, DM me or reply here so we can find a time to meet at the summit.

Are you coming? Drop your name and city below — would love to meet community members in person! 👋`,
    author: { name: "Fatou Ndiaye", initials: "FN", role: "Host", avatar: "" },
    time: "4d ago",
    likes: 76,
    replies: 31,
    views: 1340,
    tags: ["Events", "Networking"],
  },
];
