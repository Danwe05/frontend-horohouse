import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Building2, Building, Warehouse, ArrowRight } from 'lucide-react';

export default function PropertyTypeCards() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const propertyTypes = [
    {
      label: 'Residential',
      description: 'Find your dream home in prime locations',
      icon: Home,
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      gradient: 'from-blue-900/80 via-blue-800/70 to-blue-900/80'
    },
    {
      label: 'Commercial',
      description: 'Premium office spaces for your business',
      icon: Building2,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      gradient: 'from-purple-900/80 via-purple-800/70 to-purple-900/80'
    },
    {
      label: 'Apartment',
      description: 'Modern living spaces in the heart of the city',
      icon: Building,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      gradient: 'from-teal-900/80 via-teal-800/70 to-teal-900/80'
    },
    {
      label: 'Industrial',
      description: 'Large-scale facilities for your operations',
      icon: Warehouse,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      gradient: 'from-orange-900/80 via-orange-800/70 to-orange-900/80'
    }
  ];

  const handlePropertyTypeClick = (label: string) => {
    console.log('Navigating to:', label);
  };

  return (
    <div className="bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our diverse range of properties tailored to your needs
          </p> */}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {propertyTypes.map((property, index) => {
            const Icon = property.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                whileHover={{ y: -12 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePropertyTypeClick(property.label)}
                className="group cursor-pointer"
              >
                <div className="relative h-84 rounded-3xl overflow-hidden shadow-xl">
                  {/* Background Image */}
                  <motion.div
                    animate={{
                      scale: hoveredIndex === index ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <img
                      src={property.image}
                      alt={property.label}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${property.gradient}`} />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-8">
                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: hoveredIndex === index ? 1.1 : 1,
                        rotate: hoveredIndex === index ? 5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="inline-flex"
                    >
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                    </motion.div>

                    {/* Text Content */}
                    <div className="space-y-3">
                      <motion.h3
                        animate={{
                          y: hoveredIndex === index ? -5 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold text-white"
                      >
                        {property.label}
                      </motion.h3>
                      
                      <motion.p
                        initial={{ opacity: 0.9 }}
                        animate={{
                          opacity: hoveredIndex === index ? 1 : 0.9,
                        }}
                        transition={{ duration: 0.3 }}
                        className="text-white/90 text-sm leading-relaxed"
                      >
                        {property.description}
                      </motion.p>

                      {/* View Properties Button */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: hoveredIndex === index ? 1 : 0,
                          x: hoveredIndex === index ? 0 : -10,
                        }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyTypeClick(property.label);
                          }}
                          className="inline-flex items-center gap-2 text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
                        >
                          Explore <ArrowRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Bottom Glow Effect */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredIndex === index ? 0.6 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/40 to-transparent"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}