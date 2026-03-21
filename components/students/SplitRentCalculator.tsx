'use client';

import { useState } from 'react';
import { Calculator, Users, Smartphone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 -sm border border-gray-200"
    >
      <div className="flex items-center gap-2 mb-6 text-blue-800">
        <Calculator className="h-6 w-6" />
        <h3 className="text-xl font-bold">Smart Rent Splitter</h3>
      </div>

      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Total Monthly Rent (FCFA)</label>
          <input
            type="number"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-700">Number of Roommates</label>
            <span className="text-blue-600 font-bold">{roommates}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={roommates}
            onChange={(e) => setRoommates(Number(e.target.value))}
            className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={includeUtilities}
            onChange={() => setIncludeUtilities(!includeUtilities)}
            className="w-5 h-5 accent-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Include estimated utilities (~15k/mo)</span>
        </label>
      </div>

      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-blue-700 font-medium mb-1">Your Monthly Share</p>
            <div className="text-3xl font-black text-blue-900">
              {perPerson.toLocaleString()} <span className="text-lg font-bold text-blue-600">FCFA</span>
            </div>
          </div>
          <Users className="h-8 w-8 text-blue-200" />
        </div>

        <div className="pt-4 border-t border-blue-200/50 flex justify-between items-center">
          <span className="text-sm text-blue-800">Estimated Advance ({depositMonths} mo)</span>
          <span className="font-bold text-blue-900">{upfrontPerPerson.toLocaleString()} FCFA</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard/split-rent?tab=my-payments')}
        className="w-full bg-[#ffcc00] hover:bg-[#ffdb4d] text-gray-900 font-bold py-3.5 px-4 rounded-xl transition-colors -sm flex items-center justify-center gap-2"
      >
        <Smartphone className="h-5 w-5" />
        View My Payment Cycles
      </button>

      <p className="text-center text-xs text-gray-500 items-center justify-center flex gap-1 mt-3">
        <ShieldCheck className="h-3 w-3" />
        Actual MoMo payments are initiated by your landlord from their dashboard
      </p>
    </motion.div>
  );
}
