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
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    setSubmitSuccess(true);
    reset();
    setTimeout(() => setSubmitSuccess(false), 5000);
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* 1. MINIMALIST HERO */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-8xl md:text-[9rem] font-black tracking-tighter leading-[0.8] mb-8">
              SAY <span className="text-blue-500">HELLO.</span>
            </h1>
            <p className="text-2xl text-slate-400 font-light leading-relaxed">
              Whether you're looking for a luxury villa or a strategic land investment, our team is here to guide you home.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex flex-col items-end text-right"
          >
            <div className="w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center mb-4">
              <Globe className="text-blue-500 animate-spin-slow" size={32} />
            </div>
            <p className="font-bold uppercase tracking-widest text-xs">Based in Cameroon</p>
            <p className="text-slate-400 text-xs mt-1">Serving the Global Diaspora</p>
          </motion.div>
        </div>
      </section>

      {/* 2. THE MAIN INTERACTION ZONE */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            
            {/* LEFT: SOCIAL & INFO */}
            <div className="lg:col-span-4 space-y-12">
              <div className="space-y-10">
                {[
                  { icon: <Mail size={24}/>, label: "Email", val: "infos.horohouse@gmail.com" },
                  { icon: <Phone size={24}/>, label: "WhatsApp / Call", val: "+237 695 451 646" },
                  { icon: <MapPin size={24}/>, label: "Headquarters", val: "Awae, Yaoundé, CM" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-6 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">{item.label}</p>
                      <p className="text-xl font-bold group-hover:text-blue-500 transition-colors">{item.val}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* SERVICE CARD */}
              <div className="p-10 bg-blue-500 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <ArrowUpRight size={80} />
                </div>
                <h3 className="text-2xl font-bold mb-4 relative z-10">Real Estate <br/>Concierge</h3>
                <ul className="space-y-3 opacity-90 relative z-10">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16}/> Property Sourcing</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16}/> Legal Land Verification</li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle2 size={16}/> Architectural Design</li>
                </ul>
              </div>
            </div>

            {/* RIGHT: THE FORM (OVERLAPPING STYLE) */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[4rem] p-10 md:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-50 relative">
                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="text-center py-20"
                    >
                      <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                      </div>
                      <h2 className="text-4xl font-bold mb-2">Thank You.</h2>
                      <p className="text-slate-400">Your vision has been sent to our desk.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                      <div className="grid md:grid-cols-2 gap-12">
                        <div className="relative group">
                          <input 
                            {...register('name')}
                            className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-xl font-medium"
                            placeholder=" "
                          />
                          <label className="absolute left-0 top-4 text-slate-300 pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold">YOUR NAME</label>
                        </div>
                        <div className="relative group">
                          <input 
                            {...register('email')}
                            className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-xl font-medium"
                            placeholder=" "
                          />
                          <label className="absolute left-0 top-4 text-slate-300 pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold">EMAIL ADDRESS</label>
                        </div>
                      </div>

                      <div className="relative group">
                        <textarea 
                          {...register('message')}
                          rows={3}
                          className="w-full py-4 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all peer text-xl font-medium resize-none"
                          placeholder=" "
                        />
                        <label className="absolute left-0 top-4 text-slate-300 pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-bold">TELL US ABOUT YOUR PROJECT</label>
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="group w-full md:w-auto px-16 py-7 bg-blue-500 text-white rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-slate-900 transition-all duration-500 flex items-center justify-center gap-6"
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

      {/* 3. SOFT FOCUS MAP SECTION */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto h-[600px] rounded-[4rem] overflow-hidden relative shadow-inner group">
          {/* Note: In a real app, replace with a valid Google Maps embed URL */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15923.36449174245!2d11.5121!3d3.848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf7a16f6b533%3A0x6a1099661f9d2d8c!2zQXdhw6ksIFlhb3VuZMOp!5e0!3m2!1sen!2scm!4v1700000000000!5m2!1sen!2scm"
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
            className="grayscale group-hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute top-10 left-10 p-8 bg-white rounded-[2.5rem] shadow-2xl max-w-xs border border-slate-50">
            <h4 className="font-black text-blue-500 uppercase tracking-widest text-xs mb-2">Visit Our Studio</h4>
            <p className="text-xl font-bold leading-tight mb-4">Awae, Yaoundé, <br/>Cameroon</p>
            <button className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-slate-900 transition-colors">
              Get Directions <ArrowUpRight size={16}/>
            </button>
          </div>
        </div>
      </section>

      <Footer />

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