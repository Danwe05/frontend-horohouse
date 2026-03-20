'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Zap, Droplet, Users } from 'lucide-react';

export default function StudentFilters() {
  const [university, setUniversity] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  
  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-0 relative z-20 -mt-10 md:-mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="col-span-1 md:col-span-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">University / Campus</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 appearance-none font-medium"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              >
                <option value="">Select Campus Area</option>
                <option value="ub">University of Buea (UB)</option>
                <option value="uds">University of Dschang (UDs)</option>
                <option value="uy1">University of Yaounde I</option>
                <option value="uy2">University of Yaounde II (Soa)</option>
                <option value="ud">University of Douala</option>
              </select>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-3">
             <label className="block text-sm font-semibold text-gray-700 mb-2">Budget / Person (Mo)</label>
             <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₣</span>
              <input 
                type="number"
                placeholder="20,000"
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 font-medium"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
              />
             </div>
          </div>
          
          <div className="col-span-1 md:col-span-3 hidden md:flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">Must Haves</label>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                <Droplet className="w-4 h-4" /> Borehole
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-100 transition-colors">
                <Zap className="w-4 h-4" /> Backup
              </button>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
               <Search className="w-5 h-5" />
               Search
            </button>
          </div>
          
        </div>
        {/* Advanced Filters */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Furnishing</label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Any Status</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi">Semi-Furnished</option>
              <option value="full">Fully Furnished</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rules & Restrictions</label>
             <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Any Rules</option>
              <option value="girls-only">Girls Only Compound</option>
              <option value="no-curfew">No Gate Curfew</option>
              <option value="visitors">Open Visitor Policy</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Security Features</label>
             <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Any Level</option>
              <option value="gated">Gated Compound</option>
              <option value="watchman">Night Watchman</option>
              <option value="fence">Secure Fence</option>
            </select>
          </div>
        </div>
        
      </motion.div>
    </div>
  );
}
