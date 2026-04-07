'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Loader2, CheckCircle2, Globe, Building2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Animations ──────────────────────────────────────────────────────────────

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setSubmitSuccess(true);
    reset();
    setTimeout(() => setSubmitSuccess(false), 5000);
    setIsSubmitting(false);
  };

  const inputClasses = "w-full p-4 text-[16px] text-[#222222] bg-white border border-[#DDDDDD] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#222222] focus:border-blue-600 transition-colors placeholder:text-[#717171]";

  return (
    <main className="min-h-screen bg-white text-[#222222] selection:blue-blue-600 selection:text-white font-sans pb-20">

      {/* ── 1. Hero ── */}
      <section className="pt-32 pb-16 px-6 md:px-12 border-b border-[#DDDDDD] bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <FadeIn className="max-w-2xl">
            <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-6 text-[#222222]">
              Contact our team
            </h1>
            <p className="text-[18px] text-[#717171] leading-relaxed">
              Whether you're looking for a luxury villa, a strategic land investment, or need help managing your listings, our local experts are here to guide you home.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="hidden md:flex flex-col items-end text-right shrink-0 pb-2">
            <div className="flex items-center gap-3 bg-white border border-[#DDDDDD] px-4 py-2.5 rounded-full shadow-sm">
              <Globe className="text-[#222222] w-5 h-5" />
              <span className="font-semibold text-[14px] text-[#222222]">Based in Cameroon</span>
            </div>
            <p className="text-[#717171] text-[14px] mt-3 mr-2">Serving the global diaspora</p>
          </FadeIn>
        </div>
      </section>

      {/* ── 2. Main Interaction Zone ── */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* LEFT: Contact Info + Service Card */}
            <div className="lg:col-span-4 space-y-10">
              <FadeIn delay={0.2} className="space-y-8">
                {[
                  { icon: <Mail className="w-6 h-6 stroke-[1.5]" />, label: "Email us", val: "infos@horohouse.com", action: "mailto:infos@horohouse.com" },
                  { icon: <Phone className="w-6 h-6 stroke-[1.5]" />, label: "Call or WhatsApp", val: "+237 695 451 646", action: "tel:+237695451646" },
                  { icon: <MapPin className="w-6 h-6 stroke-[1.5]" />, label: "Headquarters", val: "Awae, Yaoundé, CM", action: "#map" }
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.action}
                    className="flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-full border border-[#DDDDDD] bg-[#F7F7F7] flex items-center justify-center text-[#222222] group-hover:border-blue-600 transition-colors">
                      {item.icon}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[16px] font-semibold text-[#222222] mb-0.5 group-hover:underline">{item.label}</p>
                      <p className="text-[15px] text-[#717171] break-all sm:break-normal">{item.val}</p>
                    </div>
                  </a>
                ))}
              </FadeIn>

              {/* Service Card */}
              <FadeIn delay={0.3}>
                <div className="p-8 bg-[#F7F7F7] border border-[#DDDDDD] rounded-2xl">
                  <div className="w-10 h-10 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Building2 className="w-5 h-5 text-[#222222] stroke-[1.5]" />
                  </div>
                  <h3 className="text-[20px] font-semibold mb-4 text-[#222222]">Real estate concierge</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-[15px] text-[#717171]">
                      <CheckCircle2 className="w-5 h-5 text-[#222222] stroke-[1.5] shrink-0" />
                      <span>Property sourcing & negotiation</span>
                    </li>
                    <li className="flex items-start gap-3 text-[15px] text-[#717171]">
                      <CheckCircle2 className="w-5 h-5 text-[#222222] stroke-[1.5] shrink-0" />
                      <span>Legal land verification</span>
                    </li>
                    <li className="flex items-start gap-3 text-[15px] text-[#717171]">
                      <CheckCircle2 className="w-5 h-5 text-[#222222] stroke-[1.5] shrink-0" />
                      <span>Architectural design & planning</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-8">
              <FadeIn delay={0.4} className="bg-white rounded-2xl border border-[#DDDDDD] p-8 md:p-10 shadow-sm">
                <h2 className="text-[26px] font-semibold tracking-tight text-[#222222] mb-8">
                  Send us a message
                </h2>

                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-16 h-16 bg-[#ECFDF5] border border-[#008A05]/20 text-[#008A05] rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 stroke-[2]" />
                      </div>
                      <h3 className="text-[24px] font-semibold text-[#222222] mb-2">Message received</h3>
                      <p className="text-[16px] text-[#717171]">
                        Thank you for reaching out. A member of our team will contact you shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[14px] font-semibold text-[#222222] block">First name</label>
                          <input
                            {...register('firstName', { required: true })}
                            className={inputClasses}
                            placeholder="Jane"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[14px] font-semibold text-[#222222] block">Last name</label>
                          <input
                            {...register('lastName', { required: true })}
                            className={inputClasses}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-[#222222] block">Email address</label>
                        <input
                          type="email"
                          {...register('email', { required: true })}
                          className={inputClasses}
                          placeholder="jane@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-[#222222] block">How can we help?</label>
                        <textarea
                          {...register('message', { required: true })}
                          rows={5}
                          className={`${inputClasses} resize-none`}
                          placeholder="Tell us about your project, property search, or investment goals..."
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[16px] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send message"
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Map Section ── */}
      <section id="map" className="px-6 md:px-12 pb-20">
        <FadeIn delay={0.5} className="max-w-6xl mx-auto">
          <div className="h-[400px] md:h-[500px] rounded-2xl overflow-hidden relative border border-[#DDDDDD] bg-[#EBEBEB]">
            {/* Replace src with your actual map URL/embed */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15923.360155018672!2d11.5161!3d3.8667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf7a309a7977%3A0x7f54bad35e693c51!2sYaound%C3%A9%2C%20Cameroon!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
            />

            {/* Info Card Overlay */}
            <div className="absolute bottom-6 left-6 md:top-6 md:bottom-auto md:left-6 p-6 bg-white rounded-xl border border-[#DDDDDD] shadow-lg max-w-[calc(100%-3rem)] sm:max-w-sm">
              <h4 className="font-semibold text-[#222222] text-[18px] mb-1">Our Studio</h4>
              <p className="text-[15px] text-[#717171] mb-4">Awae, Yaoundé, Cameroon</p>
              <a
                href="https://maps.google.com/?q=Awae,Yaounde,Cameroon"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-[15px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors"
              >
                Get directions <ChevronRight className="w-4 h-4 ml-0.5 stroke-[2]" />
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

    </main>
  );
}