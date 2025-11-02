'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaUsers, FaHome, FaGlobeAfrica } from 'react-icons/fa';
import { Building2, Home, Castle, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const propertyTypes = [
  { 
    icon: Building2, 
    label: "Apartment", 
    description: "Modern living spaces in prime locations"
  },
  { 
    icon: Home, 
    label: "Home", 
    description: "Family residences with comfort"
  },
  { 
    icon: Castle, 
    label: "Villa", 
    description: "Luxury estates for elegant living"
  },
  { 
    icon: Building, 
    label: "Condo", 
    description: "Urban convenience and style"
  },
];

const stats = [
  { icon: FaUsers, label: "Happy Customers", value: "40k+" },
  { icon: FaHome, label: "Properties Sold", value: "50k+" },
  { icon: FaGlobeAfrica, label: "Countries Served", value: "30+" },
];

export default function LuxuriousHaven() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const router = useRouter();
  
  const handlePropertyTypeClick = (propertyType: string) => {
    // Convert property type to match the format expected by FilterSidebar
    const propertyTypeMap: { [key: string]: string } = {
      "Apartment": "apartment",
      "Home": "house",
      "Villa": "villa",
      "Condo": "apartment" // Map Condo to apartment as it's the closest match
    };
    
    const mappedType = propertyTypeMap[propertyType] || propertyType.toLowerCase();
    router.push(`/properties?propertyType=${mappedType}`);
  };

  return (
    <section className="relative py-16 md:py-24 px-5 md:px-10 lg:px-20 bg-gray-50 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Image - Enhanced with overlay */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src="/LuxuriousHaven.jpg"
                alt="Luxurious House"
                width={700}
                height={600}
                className="rounded-3xl object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              {/* Floating badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-6 left-6 bg-white px-4 py-2 rounded-full "
              >
                <p className="text-sm font-semibold text-gray-900">Premium Property</p>
              </motion.div>
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 rounded-3xl opacity-20 blur-2xl"></div>
          </motion.div>

          {/* Right Content */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                Featured Property
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Luxurious Haven at{' '}
                <span>
                  HoroHouse
                </span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-600 text-base md:text-lg leading-relaxed"
            >
              Welcome to HoroHouse, where your African dream home awaits! At
              HoroHouse, we're dedicated to connecting you with the finest
              properties across Africa. Explore this gem today and elevate your
              lifestyle.
            </motion.p>

            {/* Stats - Enhanced Design */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl transition-all duration-300 group"
                  >
                    <div className="p-3 bg-blue-600 rounded-xl transition-transform duration-300">
                      <Icon className="text-white text-2xl" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                      <p className="font-bold text-xl text-gray-900">{stat.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Explore Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-4"
            >
              <Link href="/properties">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-blue-700"
                >
                  Explore All
                </motion.button>
              </Link>
              <Link href="/properties">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="bg-white border-2 border-blue-600 text-blue-600 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300"
                >
                  <FaArrowRight className="text-xl" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Property Types */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10"
        >
    
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {propertyTypes.map((property, index) => {
              const Icon = property.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  whileHover={{ y: -8 }}
                  onClick={() => handlePropertyTypeClick(property.label)}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Background effect on hover */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-blue-50"
                    />

                    {/* Content */}
                    <div className="relative z-10 text-center space-y-4">
                      {/* Icon Container */}
                      <motion.div 
                        className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-2 transition-all duration-300"
                        animate={{
                          backgroundColor: hoveredIndex === index ? '#2563eb' : '#dbeafe',
                          scale: hoveredIndex === index ? 1.1 : 1
                        }}
                      >
                        <Icon 
                          className="w-10 h-10 transition-colors duration-300" 
                          strokeWidth={2}
                          style={{ color: hoveredIndex === index ? '#ffffff' : '#2563eb' }}
                        />
                      </motion.div>

                      {/* Title */}
                      <h4 className="text-xl font-bold text-gray-900 transition-colors duration-300">
                        {property.label}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {property.description}
                      </p>

                      {/* View More Link */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: hoveredIndex === index ? 1 : 0,
                          y: hoveredIndex === index ? 0 : 10
                        }}
                        transition={{ duration: 0.2 }}
                        className="pt-2"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyTypeClick(property.label);
                          }}
                          className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm"
                        >
                          View Properties <FaArrowRight className="text-xs" />
                        </button>
                      </motion.div>
                    </div>

                    {/* Bottom accent line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ 
                        scaleX: hoveredIndex === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 origin-left"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}