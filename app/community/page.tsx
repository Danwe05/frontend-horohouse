"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, PenLine, ThumbsUp, MessageSquare, Eye, ChevronRight,
  Star, Home, Coffee, Compass, BookOpen, TrendingUp,
  Bell, Users, Award, Pin, MoreHorizontal, ArrowUp,
  Flame, Clock, HelpCircle,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ─── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "homes",   label: "Homes",        icon: Home },
  { id: "cafe",    label: "Community Café", icon: Coffee },
  { id: "explore", label: "Explore",      icon: Compass },
  { id: "resources", label: "Resources",  icon: BookOpen },
  { id: "updates", label: "Airbnb Updates", icon: Bell },
];

const MEMBERS = [
  { name: "Amara Diallo",   role: "Top Contributor", years: 4, reviews: 128, avatar: "", initials: "AD", badge: "🏆" },
  { name: "Kwame Asante",   role: "Superhost",        years: 2, reviews: 91,  avatar: "", initials: "KA", badge: "⭐" },
  { name: "Fatou Ndiaye",   role: "Host",             years: 1, reviews: 43,  avatar: "", initials: "FN", badge: "" },
];

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

const QUICK_LINKS = [
  { label: "Help Center", href: "/support" },
  { label: "Host Resources", href: "/about" },
  { label: "Report an issue", href: "/support" },
  { label: "Community guidelines", href: "/terms" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PostCard({ post }: { post: typeof POSTS[number] }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked((p) => !p);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div className="py-6 border-b border-[#EBEBEB] last:border-b-0">
      {/* Top row */}
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          {post.author.avatar && <img src={post.author.avatar} alt={post.author.name} />}
          <AvatarFallback className="bg-[#222222] text-white text-[15px] font-semibold">
            {post.author.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author + meta */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
            <span className="text-[15px] font-semibold text-[#222222]">{post.author.name}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{post.author.role}</span>
            <span className="text-[14px] text-[#717171] hidden sm:inline">·</span>
            <span className="text-[14px] text-[#717171]">{post.time}</span>
            {post.pinned && (
              <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[#FF385C] font-semibold uppercase tracking-wide">
                <Pin className="w-3.5 h-3.5 fill-[#FF385C]" /> Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/community/${post.slug}`}>
            <h3 className="text-[18px] font-semibold text-[#222222] leading-snug mb-2 hover:underline cursor-pointer">
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-[15px] text-[#717171] leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white border border-[#DDDDDD] text-[13px] font-medium text-[#222222] cursor-pointer hover:border-[#222222] transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 text-[14px] font-medium text-[#222222] underline-offset-2">
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-2 hover:opacity-70 transition-opacity",
                liked && "text-[#FF385C]"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4 stroke-[2]", liked && "fill-[#FF385C]")} />
              {likeCount.toLocaleString()}
            </button>
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <MessageCircle className="w-4 h-4 stroke-[2]" />
              {post.replies.toLocaleString()}
            </button>
            <span className="flex items-center gap-2 text-[#717171] font-normal">
              <Eye className="w-4 h-4 stroke-[2]" />
              {post.views.toLocaleString()}
            </span>
            <button className="ml-auto hover:bg-[#F7F7F7] p-2 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-[#222222]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "top",        label: "Top discussions",  icon: TrendingUp },
  { id: "recent",     label: "Recent",           icon: Clock },
  { id: "unanswered", label: "Unanswered",       icon: HelpCircle },
];

export default function CommunityPage() {
  const [search, setSearch]       = useState("");
  const [activeCategory, setActiveCategory] = useState("popular");
  const [activeTab, setActiveTab] = useState("top");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody]   = useState("");

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === "popular" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (activeTab === "top") return b.likes - a.likes;
    if (activeTab === "recent") return a.time.localeCompare(b.time);
    return a.replies - b.replies;
  });

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="bg-[#F7F7F7] border-b border-[#EBEBEB] pt-20 pb-16 px-6 mt-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight leading-tight text-[#222222] mb-4">
            Welcome to the Host Community
          </h1>
          <p className="text-[18px] text-[#717171] mb-10 max-w-2xl mx-auto">
            Connect with hosts locally and globally. Ask questions, share advice, and get the latest updates.
          </p>

          {/* Airbnb-style Search Pill */}
          <div className="mx-auto flex items-center bg-white rounded-full border border-[#DDDDDD] shadow-[0_3px_12px_rgb(0,0,0,0.08)] hover:shadow-[0_3px_12px_rgb(0,0,0,0.12)] transition-shadow p-2 w-full max-w-2xl">
            <div className="flex-1 px-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions, topics, or keywords"
                className="w-full text-[15px] font-medium text-[#222222] placeholder:text-[#717171] bg-transparent focus:outline-none"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 transition-colors p-3.5 rounded-full text-white flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <nav className="space-y-1" aria-label="Community categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-colors text-left",
                    activeCategory === cat.id
                      ? "bg-[#F7F7F7] text-[#222222] font-semibold"
                      : "text-[#717171] font-medium hover:bg-[#F7F7F7] hover:text-[#222222]"
                  )}
                >
                  <cat.icon className={cn("w-5 h-5 stroke-[2]", activeCategory === cat.id ? "text-[#222222]" : "text-[#717171]")} />
                  {cat.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-[#EBEBEB] space-y-2">
              <p className="text-[14px] font-semibold text-[#222222] mb-4 px-4">Helpful links</p>
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[15px] text-[#717171] font-medium hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 ml-auto text-[#B0B0B0]" />
                </a>
              ))}
            </div>
          </aside>

          {/* ── Main feed ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* New post CTA */}
            {!showNewPost ? (
              <button
                onClick={() => setShowNewPost(true)}
                className="w-full mb-8 flex items-center gap-4 px-6 py-4 rounded-2xl border border-[#DDDDDD] bg-white hover:border-[#222222] transition-colors text-[#717171] text-[15px] font-medium shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-[#222222]" />
                </div>
                <span>Share a tip, ask a question, or start a discussion...</span>
                <span className="ml-auto px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-[#000000] text-white text-[14px] font-semibold transition-colors">
                  Create post
                </span>
              </button>
            ) : (
              <div className="mb-8 rounded-2xl border-2 border-[#222222] bg-white overflow-hidden shadow-sm">
                <div className="px-6 pt-6 space-y-4">
                  <input
                    autoFocus
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Give your post a title..."
                    className="w-full text-[20px] font-semibold text-[#222222] placeholder:text-[#B0B0B0] focus:outline-none"
                  />
                  <textarea
                    value={newPostBody}
                    onChange={(e) => setNewPostBody(e.target.value)}
                    placeholder="What's on your mind? Share details here..."
                    rows={5}
                    className="w-full resize-none text-[16px] text-[#222222] placeholder:text-[#717171] focus:outline-none leading-relaxed"
                  />
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#EBEBEB] bg-white">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="text-[15px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newPostTitle.trim()}
                    className="px-6 py-3 rounded-lg bg-[#E61E4D] hover:bg-[#D90B26] text-white text-[15px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Publish
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-6 border-b border-[#EBEBEB]">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 pb-4 text-[15px] font-semibold border-b-2 transition-colors -mb-px",
                    activeTab === tab.id
                      ? "border-[#222222] text-[#222222]"
                      : "border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#222222]"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <span className="ml-auto text-[14px] font-medium text-[#717171] pb-4">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </span>
            </div>

            {/* Post list */}
            {filtered.length === 0 ? (
              <div className="py-24 text-center text-[#717171]">
                <Search className="w-12 h-12 mx-auto mb-4 stroke-[1.5] text-[#DDDDDD]" />
                <p className="text-[18px] font-semibold text-[#222222]">No discussions found</p>
                <p className="text-[15px] mt-2 max-w-sm mx-auto">Try adjusting your search or be the first to start a topic in this category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* ── Right column ───────────────────────────────────────────── */}
          <aside className="hidden xl:block w-[280px] shrink-0 space-y-8 lg:sticky lg:top-28">

            {/* Stats strip */}
            <div>
              <h3 className="text-[16px] font-semibold text-[#222222] mb-4">About this community</h3>
              <div className="space-y-4">
                {[
                  { label: "Members worldwide", value: "12,400+", icon: Users },
                  { label: "Discussions this week", value: "318",     icon: MessageCircle},
                  { label: "Top contributors", value: "42",   icon: Award },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#222222] stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#222222] leading-none">{value}</p>
                      <p className="text-[13px] text-[#717171] mt-1">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <h3 className="text-[16px] font-semibold text-[#222222] mb-4">Top contributors</h3>
              <div className="space-y-5">
                {MEMBERS.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-[#222222] text-white text-[13px] font-semibold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#222222] truncate">
                        {m.name} {m.badge}
                      </p>
                      <p className="text-[13px] text-[#717171] truncate">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full text-left text-[15px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors">
                Show all
              </button>
            </div>

            {/* Back to top */}
            <div className="pt-8 border-t border-[#EBEBEB]">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#222222] text-[15px] font-semibold text-[#222222] hover:bg-[#F7F7F7] transition-colors"
              >
                Back to top
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}