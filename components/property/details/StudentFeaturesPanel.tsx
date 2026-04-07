'use client';

import React from 'react';
import { useStudentMode } from '@/contexts/StudentModeContext';
import SplitRentCalculator from '@/components/students/SplitRentCalculator';
import { ShieldCheck, FileSignature, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentFeaturesPanelProps {
  property: any;
}

export default function StudentFeaturesPanel({ property }: StudentFeaturesPanelProps) {
  const { isStudentMode } = useStudentMode();
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.features || {};

  // Only render if the user has Student Mode toggled on
  if (!isStudentMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-10 border-b border-[#EBEBEB] w-full"
    >
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#222222] flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
          {s.studentHub || 'Student hub'}
        </h2>
        <p className="text-[16px] text-[#717171]">
          {s.exclusiveFeatures || 'Exclusive features for verified students.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Calculator */}
        <div className="w-full">
          <SplitRentCalculator initialRent={property.price} />
        </div>

        {/* Right Column: Trust Features */}
        <div className="flex flex-col h-full">
          
          {/* Digital Lease Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DDDDDD] flex flex-col justify-between transition-colors hover:border-[#222222] group cursor-pointer h-full">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FileSignature className="h-6 w-6 text-[#222222] stroke-[1.5]" />
                <h3 className="text-[18px] font-semibold text-[#222222]">
                  {s.digitalLease || 'Digital lease agreement'}
                </h3>
              </div>
              <p className="text-[#717171] text-[15px] leading-relaxed mb-8">
                {s.digitalLeaseDesc || 'This landlord accepts our standardized student lease. This guarantees a safe deposit structure (max 3-6 months) and fair maintenance rules.'}
              </p>
            </div>
            
            <div className="flex items-center gap-1 text-[15px] font-semibold text-[#222222] group-hover:text-[#717171] transition-colors w-fit">
              <span className="underline">{s.viewSampleLease || 'View sample lease'}</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}