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
    visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' as const } },
  };

  const handleLanguageSelect = (key: Language) => setLanguage(key);
  const handleCurrencySelect = (val: string) => setCurrency(val);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className="fixed top-20 left-1/2 -translate-x-1/2 w-[92%] sm:w-full max-w-2xl z-[101] px-2 sm:px-0"
      >
        <div className="bg-white rounded-3xl border border-[#DDDDDD] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
            <h2 className="text-[17px] font-bold text-[#222222]">Preferences</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#F7F7F7] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-6 pt-4 border-b border-[#EBEBEB]">
            {(['language', 'currency'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-3 px-1 mr-6 text-[15px] font-semibold transition-colors ${active ? 'text-[#222222]' : 'text-[#717171] hover:text-[#222222]'
                    }`}
                >
                  {tab === 'language' ? 'Language' : 'Currency'}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">

            {activeTab === 'language' && (
              <div>
                <p className="text-[14px] text-[#717171] mb-5">
                  Choose your preferred language for the Horo House experience.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(languages).map(([key, lang]) => {
                    const selected = language === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleLanguageSelect(key as Language)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 text-left ${selected
                          ? 'border-blue-600 bg-white'
                          : 'border-[#DDDDDD] hover:border-blue-600 bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={lang.flag}
                            alt={lang.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#EBEBEB]"
                            loading="lazy"
                          />
                          <span className={`text-[15px] font-semibold ${selected ? 'text-[#222222]' : 'text-[#484848]'}`}>
                            {lang.name}
                          </span>
                        </div>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div>
                <p className="text-[14px] text-[#717171] mb-5">
                  Select the currency you'd like to use for prices and estimates.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CURRENCIES.map((c) => {
                    const selected = currency === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => handleCurrencySelect(c.value)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 text-left ${selected
                          ? 'border-[#1A56DB] bg-[#EFF6FF]'
                          : 'border-[#DDDDDD] hover:border-blue-600 bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[16px] flex-shrink-0 ${selected ? 'bg-[#1A56DB] text-white' : 'bg-[#F7F7F7] text-[#484848]'
                            }`}>
                            {c.symbol}
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className={`text-[15px] font-semibold ${selected ? 'text-[#1A56DB]' : 'text-[#484848]'}`}>
                              {c.value}
                            </span>
                            <span className={`text-[12px] ${selected ? 'text-[#1A56DB]/70' : 'text-[#717171]'}`}>
                              {c.label.replace(`${c.value} `, '')}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-[#1A56DB] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#EBEBEB] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[14px] font-semibold hover:bg-[#444444] transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}