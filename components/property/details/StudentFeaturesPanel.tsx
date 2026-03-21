'use client';

import { useStudentMode } from '@/contexts/StudentModeContext';
import SplitRentCalculator from '@/components/students/SplitRentCalculator';
import { ShieldCheck, Video, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentFeaturesPanelProps {
  property: any;
}

export default function StudentFeaturesPanel({ property }: StudentFeaturesPanelProps) {
  const { isStudentMode } = useStudentMode();

  if (!isStudentMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50/50 rounded-3xl p-6 sm:p-8 -inner border border-blue-100 space-y-8 mt-10"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Hub Tools</h2>
          <p className="text-gray-600 text-sm">Exclusive features for verified students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Calculator */}
        <div>
          <SplitRentCalculator initialRent={property.price} />
        </div>

        {/* Right Column: Trust & Virtual Features */}
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-2xl border border-gray-100 -sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                <FileSignature className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900">Digital Lease Agreement</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              This landlord accepts our standardized student lease. This guarantees a safe deposit structure (max 3-6 months) and fair maintenance rules.
            </p>
            <button className="text-blue-600 text-sm font-semibold hover:underline">
              View Sample Lease
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 -sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900">Verified Virtual Tour</h3>
            </div>
            {property.virtualTourUrl || property.videoUrl ? (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Explore this property remotely before visiting to avoid scams and wasted viewing fees.
                </p>
                <a
                  href={property.virtualTourUrl || property.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Start Virtual Tour
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                The landlord hasn't uploaded a virtual tour yet. Request one to avoid unnecessary viewing trips.
              </p>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
