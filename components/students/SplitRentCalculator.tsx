'use client';

import { useState } from 'react';
import { Calculator, Users, Smartphone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SplitRentCalculatorProps {
  initialRent?: number;
}

export default function SplitRentCalculator({ initialRent = 100000 }: SplitRentCalculatorProps) {
  const [rent, setRent] = useState<number>(initialRent);
  const [roommates, setRoommates] = useState<number>(2);
  const [includeUtilities, setIncludeUtilities] = useState<boolean>(true);
  const router = useRouter();

  // Rough estimates for Cameroon Context:
  const estimatedUtilities = includeUtilities ? 15000 : 0; // Water + Electricity average per month
  const totalMonthly = rent + estimatedUtilities;
  const perPerson = Math.ceil(totalMonthly / roommates);

  // Advance/Deposit typical in student market (e.g. 3 months advance instead of 12)
  const depositMonths = 3;
  const upfrontPerPerson = perPerson * depositMonths;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DDDDDD] h-full flex flex-col transition-colors hover:border-[#B0B0B0]"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#F7F7F7] border border-[#EBEBEB] rounded-full flex items-center justify-center shrink-0">
          <Calculator className="h-5 w-5 text-[#222222] stroke-[1.5]" />
        </div>
        <h3 className="text-[22px] font-semibold text-[#222222]">Rent splitter</h3>
      </div>

      <div className="space-y-6 mb-8 flex-1">
        <div>
          <label className="block text-[15px] font-semibold text-[#222222] mb-2">Total monthly rent (FCFA)</label>
          <input
            type="number"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value) || 0)}
            className="w-full h-14 bg-white border border-[#B0B0B0] rounded-xl px-4 text-[16px] text-[#222222] focus:ring-2 focus:ring-[#222222] focus:outline-none transition-all placeholder:text-[#717171]"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[15px] font-semibold text-[#222222]">Number of roommates</label>
            <span className="text-[18px] font-semibold text-[#222222]">{roommates}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={roommates}
            onChange={(e) => setRoommates(Number(e.target.value))}
            className="w-full accent-[#222222] h-1.5 bg-[#DDDDDD] rounded-full appearance-none cursor-pointer"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group py-2">
          <div className={cn(
            "w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors",
            includeUtilities ? "bg-[#222222] border-[#222222]" : "bg-white border-[#B0B0B0] group-hover:border-[#222222]"
          )}>
            {includeUtilities && <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <input
            type="checkbox"
            checked={includeUtilities}
            onChange={() => setIncludeUtilities(!includeUtilities)}
            className="hidden"
          />
          <span className="text-[15px] text-[#222222]">Include estimated utilities (~15k/mo)</span>
        </label>
      </div>

      {/* Results Block */}
      <div className="bg-[#F7F7F7] rounded-xl p-6 border border-[#EBEBEB] mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[14px] text-[#717171] mb-1">Your monthly share</p>
            <div className="text-[32px] font-semibold text-[#222222] leading-none tracking-tight">
              {perPerson.toLocaleString()} <span className="text-[16px] font-normal text-[#717171]">FCFA</span>
            </div>
          </div>
          <Users className="h-8 w-8 text-[#DDDDDD] stroke-[1.5]" />
        </div>

        <div className="pt-4 border-t border-[#DDDDDD] flex justify-between items-center">
          <span className="text-[15px] text-[#222222]">Advance ({depositMonths} mo)</span>
          <span className="font-semibold text-[#222222]">{upfrontPerPerson.toLocaleString()} FCFA</span>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={() => router.push('/dashboard/split-rent?tab=my-payments')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-lg transition-colors flex items-center justify-center gap-2 text-[15px] active:scale-[0.98]"
        >
          <Smartphone className="h-4 w-4" />
          View payment cycles
        </button>

        <p className="text-center text-[13px] text-[#717171] flex items-center justify-center gap-1.5 mt-4">
          <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
          Payments are initiated by your landlord
        </p>
      </div>
    </motion.div>
  );
}