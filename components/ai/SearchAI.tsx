"use client"
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// shadcn/ui primitives (assumes you have shadcn/ui set up in the project)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icon placeholders (replace with lucide-react or your icon set)
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const IconMic = ({ active = false }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19v3" stroke={active ? "#0057ff" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

type Result = {
  id: string;
  title: string;
  location: string;
  price: string;
  rooms?: number;
  excerpt?: string;
};

export default function SearchAI() {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- Setup Web Speech API (browser) ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "fr-FR";
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (event: any) => {
      // build transcript from interim results
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setLiveTranscript(res);
          setQuery(res);
        } else {
          interim += res;
          setLiveTranscript(interim);
        }
      }
    };

    recog.onend = () => {
      setListening(false);
      // if we have a live transcript, send it to AI
      if (liveTranscript) {
        sendToAI(liveTranscript);
      }
    };

    recog.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTranscript]);

  // --- Mock suggestions logic ---
  useEffect(() => {
    if (!query) {
      setSuggestions([
        "Appartements modernes à Douala",
        "Villas meublées à Yaoundé",
        "Studios pour étudiants",
        "Maisons à louer près du marché"
      ]);
      return;
    }

    // dynamic mock suggestion generation (in production you'll call the AI suggestions endpoint)
    const staticPhrases = ["à louer", "à vendre", "meublé", "3 chambres", "proche des écoles", "balcon"];
    const computed = staticPhrases.map((p) => `${query} ${p}`);
    setSuggestions(computed.slice(0, 4));
  }, [query]);

  // --- Start / Stop listening ---
  function startListening() {
    const recog = recognitionRef.current;
    if (!recog) {
      alert("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
      return;
    }

    try {
      recog.start();
      setListening(true);
      setLiveTranscript("");
    } catch (err) {
      console.warn("could not start recognition", err);
    }
  }

  function stopListening() {
    const recog = recognitionRef.current;
    if (!recog) return;
    recog.stop();
    setListening(false);
  }

  // --- Send to AI backend (embeddings + vector search) ---
  async function sendToAI(text: string) {
    setLoading(true);
    setResults([]);

    try {
      // Example: POST to your NestJS endpoint which calls Flask for embedding
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        // Fallback to mocked results if backend not available
        throw new Error("Backend non disponible — affichage des résultats mockés");
      }

      const data = await res.json();
      // expected: { results: Array<Result> }
      setResults(data.results || []);
    } catch (err) {
      console.warn(err);
      // mock results (useful during dev)
      const mocked: Result[] = [
        {
          id: "m1",
          title: "Appartement moderne 3 chambres",
          location: "Douala, Bonanjo",
          price: "150 000 FCFA/mois",
          rooms: 3,
          excerpt: "Balcon, proche des transports, cuisine équipée"
        },
        {
          id: "m2",
          title: "Villa familiale meublée",
          location: "Yaoundé, Bastos",
          price: "450 000 FCFA/mois",
          rooms: 5,
          excerpt: "Jardin, piscine, garage"
        }
      ];
      setResults(mocked);
    } finally {
      setLoading(false);
    }
  }

  // --- User interactions ---
  function handleSuggestionClick(s: string) {
    setQuery(s);
    sendToAI(s);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    sendToAI(query.trim());
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 mt-20">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-white shadow-sm rounded-2xl p-2 border border-slate-200">
          <div className="px-3">
            <IconSearch />
          </div>

          <Input
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder={"Rechercher un bien ou décrire ce que vous cherchez..."}
            className="flex-1 bg-transparent placeholder:opacity-60"
            aria-label="Recherche HoroHouse"
          />

          <div className="flex items-center gap-2 pr-2">
            <Button
              type="button"
              onClick={() => {
                if (listening) stopListening();
                else startListening();
              }}
              className={`rounded-full p-2 ${listening ? "ring-2 ring-offset-2 ring-blue-300" : ""}`}
            >
              <span className="sr-only">Activer la dictée vocale</span>
              <motion.span animate={{ scale: listening ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <IconMic active={listening} />
              </motion.span>
            </Button>

            <Button type="submit" className="rounded-full p-2">
              <span className="sr-only">Lancer la recherche</span>
              Rechercher
            </Button>
          </div>
        </div>

        {/* Live transcript indicator */}
        <div className="mt-2">
          <AnimatePresence>
            {listening && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-slate-600"
              >
                Écoute… {liveTranscript || "(parlez maintenant)"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Suggestions */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {suggestions.map((s) => (
          <Card key={s} onClick={() => handleSuggestionClick(s)} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium truncate">{s}</div>
              <Badge variant="secondary">IA</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading && <div className="text-center text-sm text-slate-500">Chargement des résultats…</div>}

        {!loading && results.length === 0 && (
          <div className="text-center text-sm text-slate-500">Aucun résultat — essaye une autre requête</div>
        )}

        <div className="mt-4 space-y-3">
          {results.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-sm border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{r.title}</div>
                  <div className="text-sm text-slate-500">{r.location} • {r.rooms ?? "–"} chambres</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold">{r.price}</div>
                  <div className="text-xs text-slate-400">Référence: {r.id}</div>
                </div>
              </div>

              {r.excerpt && <div className="mt-3 text-sm text-slate-600">{r.excerpt}</div>}

              <div className="mt-3 flex items-center gap-2">
                <Button onClick={() => alert("Ouvre la fiche — implémenter la navigation")}>Voir</Button>
                <Button variant="ghost" onClick={() => alert("Sauvegarder l'annonce")}>Sauvegarder</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* Small adjustments to match Zillow/HoroHouse feel */
        :global(.rounded-2xl) { border-radius: 1rem; }
      `}</style>
    </div>
  );
}
