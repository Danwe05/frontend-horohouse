'use client';

import { motion } from 'framer-motion';
import { UserPlus, Shield, CheckCircle2, ChevronRight, MessageSquare, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const mockStudents = [
  {
    id: 1,
    name: 'Sarah N.',
    university: 'UB - Faculty of Arts',
    budget: '25,000 F',
    habits: ['Early Bird', 'Neat', 'Quiet'],
    lookingFor: 'A roommate to share a 2-bedroom in Molyko.',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    verified: true,
  },
  {
    id: 2,
    name: 'Paul A.',
    university: 'UB - Engineering',
    budget: '30,000 F',
    habits: ['Night Owl', 'Relaxed', 'Social'],
    lookingFor: 'Has an extra bed in Bomaka. Needs someone cool.',
    avatar: 'https://i.pravatar.cc/150?u=paul',
    verified: true,
  },
  {
    id: 3,
    name: 'Marie T.',
    university: 'UB - Science',
    budget: '20,000 F',
    habits: ['Study Focused', 'Clean', 'No pets'],
    lookingFor: 'Looking to team up to rent a new studio.',
    avatar: 'https://i.pravatar.cc/150?u=marie',
    verified: false,
  }
];

export default function ColocationBoard() {
  return (
    <section className="bg-white rounded-3xl p-6 md:p-10 -sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="text-blue-600 h-6 w-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Roommate Matching</h2>
          </div>
          <p className="text-gray-600">Find verified students to split rent with. Safe and simple.</p>
        </div>
        <button className="bg-blue-50 text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2">
          Create Profile <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockStudents.map((student, idx) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="border border-gray-100 rounded-2xl p-5 hover:-lg transition- bg-gray-50/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-1 border-white -sm">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {student.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                      <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-500/20" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{student.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {student.university}
                  </div>
                </div>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                Max {student.budget}
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4 h-10 line-clamp-2">
              "{student.lookingFor}"
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {student.habits.map(habit => (
                <span key={habit} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded-md">
                  {habit}
                </span>
              ))}
            </div>

            <button className="w-full bg-white border border-blue-200 text-blue-700 font-semibold py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
