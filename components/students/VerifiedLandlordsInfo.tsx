'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Banknote, Star } from 'lucide-react';

export default function VerifiedLandlordsInfo() {
  const points = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: "No Viewing Fees",
      desc: "Stop paying agents just to see a house. Our verified landlords guarantee zero hidden viewing fees."
    },
    {
      icon: <FileText className="h-6 w-6 text-emerald-500" />,
      title: "Digital Leases",
      desc: "Standard, fair-terms digital contracts that protect your deposit and rights."
    },
    {
      icon: <Banknote className="h-6 w-6 text-emerald-500" />,
      title: "Fair Deposits",
      desc: "We strictly prefer landlords who ask for reasonable 3-6 month advances, not 12 months."
    }
  ];

  return (
    <section className="bg-emerald-900 rounded-3xl overflow-hidden relative text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center">

        <div className="lg:w-1/2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-800 rounded-full text-emerald-300 text-sm font-semibold mb-6 border border-emerald-700">
            <Star className="h-4 w-4 fill-emerald-300" />
            Student-Approved Program
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rent Confidently with <br />
            <span className="text-emerald-400">Verified Landlords</span>
          </h2>

          <p className="text-emerald-100/80 text-lg mb-8 max-w-lg">
            We extensively vet our landlords to ensure a safe, scam-free, and fair housing market for students. Look for the green verified badge.
          </p>

          <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 py-4 rounded-xl transition-colors -lg">
            Learn About Our Vetting Process
          </button>
        </div>

        <div className="lg:w-1/2 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          {points.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className={`bg-emerald-800/50 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-6 ${idx === 2 ? 'sm:col-span-2' : ''}`}
            >
              <div className="bg-emerald-900/80 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-emerald-800">
                {point.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-emerald-50">{point.title}</h3>
              <p className="text-emerald-200/70 text-sm leading-relaxed">{point.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
