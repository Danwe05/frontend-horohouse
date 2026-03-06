"use client";

import { useEffect, useState } from 'react';
import { KeyRound, Zap, Lock } from 'lucide-react';

export default function PromoSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      className={`hidden md:flex fixed right-0 top-0 h-screen w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white flex-col justify-center items-center px-16 py-12 overflow-hidden transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="complementary"
      aria-label="Login benefits and information"
    >
      {/* Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />
      
      {/* Top decorative image */}
      <div 
        className="absolute top-12 right-8 w-[280px] h-[280px] bg-[url('/signUp/bg-image1.png')] bg-contain bg-no-repeat opacity-20"
        style={{
          animation: 'float 6s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Bottom decorative image */}
      <div 
        className="absolute bottom-12 -right-3 w-[280px] h-[280px] bg-[url('/signUp/bg-image2.png')] bg-contain bg-no-repeat opacity-20"
        style={{
          animation: 'float 6s ease-in-out infinite 3s',
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className={`relative z-10 max-w-lg space-y-8 transition-all duration-1000 delay-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>

        {/* Heading */}
        <h2 className="text-4xl font-bold leading-tight tracking-tight">
          Welcome Back to HoroHouse
        </h2>
        
        {/* Description */}
        <p className="text-lg leading-relaxed text-blue-50 font-light">
          Sign in to access your personalized dashboard, manage your listings, 
          and continue your journey to finding the perfect African property.
        </p>

        {/* Feature list */}
        <ul className="space-y-4 pt-4" role="list">
          {[
            { Icon: Zap, text: 'Instant access to your saved properties' },
            { Icon: KeyRound, text: 'Manage your listings and inquiries' },
            { Icon: Lock, text: 'Secure and encrypted login' },
          ].map((feature, index) => (
            <li 
              key={index}
              className={`flex items-start gap-3 transition-all duration-700 ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <feature.Icon className="w-5 h-5 text-blue-100" strokeWidth={2} aria-hidden="true" />
              </div>
              <span className="text-blue-50 font-medium pt-0.5">
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Trust indicators */}
        <div className="pt-8 flex items-center gap-6 text-blue-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-sm font-semibold">10k+ Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold">Bank-Level Security</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}