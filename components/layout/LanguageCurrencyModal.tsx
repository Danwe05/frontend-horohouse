'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, DollarSign, Check } from 'lucide-react';
import { useLanguage, CURRENCIES } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';
import type { Variants } from 'framer-motion';

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageCurrencyModal({ isOpen, onClose }: LanguageCurrencyModalProps) {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language');

  if (!isOpen) return null;

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' as const } },
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: -28, scale: 0.97 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0, y: -16, scale: 0.97,
      transition: { duration: 0.2, ease: 'easeIn' as const },
    },
  };

  const handleLanguageSelect = (key: Language) => {
    setLanguage(key);
    // Optionally close modal after selection or let the user explicitly close it
  };

  const handleCurrencySelect = (currencyValue: string) => {
    setCurrency(currencyValue);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="lang-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/40 z-[100]"
        onClick={onClose}
      />

      <motion.div
        key="lang-modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] sm:w-full max-w-3xl z-[101] px-4 pointer-events-auto"
      >
        <div className="bg-white rounded-2xl -2xl -blue-100/60 border border-blue-100 overflow-hidden flex flex-col md:flex-row min-h-[400px]">

          {/* Left Sidebar - Tabs */}
          <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6 flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg font-bold text-slate-800">Preferences</h2>
              <button
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('language')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm w-full text-left
                ${activeTab === 'language' ? 'bg-white border border-slate-200 text-blue-600' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
            >
              <Globe className={`w-5 h-5 ${activeTab === 'language' ? 'text-blue-600' : 'text-slate-400'}`} />
              Language
            </button>

            <button
              onClick={() => setActiveTab('currency')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm w-full text-left
                ${activeTab === 'currency' ? 'bg-white border border-slate-200 text-emerald-600' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
            >
              <DollarSign className={`w-5 h-5 ${activeTab === 'currency' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Currency
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-4 md:p-8 bg-white relative">
            <button
              onClick={onClose}
              className="hidden md:flex absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {activeTab === 'language' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Select your language</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(languages).map(([key, lang]) => {
                    const isSelected = language === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleLanguageSelect(key as Language)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 -blue-500/10'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={lang.flag}
                            alt={lang.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100"
                            loading="lazy"
                          />
                          <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {lang.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Select your currency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CURRENCIES.map((c) => {
                    const isSelected = currency === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => handleCurrencySelect(c.value)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                          ${isSelected
                            ? 'border-emerald-500 bg-emerald-50 -emerald-500/10'
                            : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                            ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {c.symbol}
                          </div>
                          <div className="flex flex-col items-start leading-tight">
                            <span className={`font-semibold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                              {c.value}
                            </span>
                            <span className={`text-xs ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {c.label.replace(`${c.value} `, '')}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
