'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, ArrowRight, Loader2, CheckCircle2, Globe, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from "@/components/footer";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitSuccess(true);
    reset();
    setTimeout(() => setSubmitSuccess(false), 5000);
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-blue-500 selection:text-white">

      {/* 1. HERO */}
      <section className="pt-28 sm:pt-36 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] mb-6 sm:mb-8">
              SAY <span className="text-blue-500">HELLO.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-xl">
              Whether you're looking for a luxury villa or a strategic land investment, our team is here to guide you home.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex flex-col items-end text-right flex-shrink-0"
          >
            <div className="w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center mb-4">
              <Globe className="text-blue-500 animate-spin-slow" size={32} />
            </div>
            <p className="font-bold uppercase tracking-widest text-xs">Based in Cameroon</p>
            <p className="text-slate-400 text-xs mt-1">Serving the Global Diaspora</p>
          </motion.div>
        </div>
      </section>

      {/* 2. MAIN INTERACTION ZONE */}
      <section className="pb-16 sm:pb-24 md:pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">

            {/* LEFT: INFO + SERVICE CARD */}
            <div className="lg:col-span-4 space-y-10">
              <div className="space-y-8 sm:space-y-10">
                {[
                  { icon: <Mail size={22} />, label: "Email", val: "infos.horohouse@gmail.com" },
                  { icon: <Phone size={22} />, label: "WhatsApp / Call", val: "+237 695 451 646" },
                  { icon: <MapPin size={22} />, label: "Headquarters", val: "Awae, Yaoundé, CM" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 6 }}
                    className="flex items-start gap-4 sm:gap-6 group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-white flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">{item.label}</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold group-hover:text-blue-500 transition-colors break-all sm:break-normal">{item.val}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* SERVICE CARD */}
              <div className="p-8 sm:p-10 bg-blue-500 rounded-[2.5rem] sm:rounded-[3rem] text-white -sm -blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-20">
                  <ArrowUpRight size={64} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 relative z-10">Real Estate <br />Concierge</h3>
                <ul className="space-y-3 opacity-90 relative z-10">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> Property Sourcing</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> Legal Land Verification</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> Architectural Design</li>
                </ul>
              </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] lg:rounded-[4rem] p-8 sm:p-12 md:p-16 lg:p-20 -[0_50px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-50 relative">
                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16 sm:py-20"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-2">Thank You.</h2>
                      <p className="text-slate-400">Your vision has been sent to our desk.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 sm:space-y-12">
                      {/* Name + Email row — stacked on mobile, side by side on md+ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
                        <div className="relative group">
                          <input
                            {...register('name')}
                            className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-lg sm:text-xl font-medium"
                            placeholder=" "
                          />
                          <label className="absolute left-0 top-4 text-slate-300 text-sm sm:text-base pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:font-bold">
                            YOUR NAME
                          </label>
                        </div>
                        <div className="relative group">
                          <input
                            {...register('email')}
                            className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-lg sm:text-xl font-medium"
                            placeholder=" "
                          />
                          <label className="absolute left-0 top-4 text-slate-300 text-sm sm:text-base pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:font-bold">
                            EMAIL ADDRESS
                          </label>
                        </div>
                      </div>

                      <div className="relative group">
                        <textarea
                          {...register('message')}
                          rows={3}
                          className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-lg sm:text-xl font-medium resize-none"
                          placeholder=" "
                        />
                        <label className="absolute left-0 top-4 text-slate-300 text-sm sm:text-base pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:font-bold">
                          TELL US ABOUT YOUR PROJECT
                        </label>
                      </div>

                      {/* Submit button — full width on mobile, auto on md+ */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-7 bg-blue-500 text-white rounded-full font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-slate-900 transition-all duration-500 flex items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                          <>
                            Send Message
                            <ArrowRight className="group-hover:translate-x-3 transition-transform duration-300" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MAP SECTION */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto h-[380px] sm:h-[480px] md:h-[600px] rounded-[2.5rem] sm:rounded-[3rem] lg:rounded-[4rem] overflow-hidden relative -inner group">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15923.36449174245!2d11.5121!3d3.848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf7a16f6b533%3A0x6a1099661f9d2d8c!2zQXdhw6ksIFlhb3VuZMOp!5e0!3m2!1sen!2scm!4v1700000000000!5m2!1sen!2scm"
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
            className="grayscale group-hover:grayscale-0 transition-all duration-1000"
          />
          {/* Info card — repositioned on mobile to bottom, desktop stays top-left */}
          <div className="absolute bottom-4 left-4 sm:top-8 sm:bottom-auto sm:left-8 md:top-10 md:left-10 p-5 sm:p-6 md:p-8 bg-white rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] -2xl max-w-[calc(100%-2rem)] sm:max-w-xs border border-slate-50">
            <h4 className="font-black text-blue-500 uppercase tracking-widest text-[10px] sm:text-xs mb-2">Visit Our Studio</h4>
            <p className="text-lg sm:text-xl font-bold leading-tight mb-3 sm:mb-4">Awae, Yaoundé, <br />Cameroon</p>
            <button className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-500 hover:text-slate-900 transition-colors">
              Get Directions <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}