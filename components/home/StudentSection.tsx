'use client';

import Image from 'next/image';
import { FaArrowRight, FaBook, FaShieldAlt, FaWifi, FaDollarSign } from 'react-icons/fa';
import { Users, MapPin, Home, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const properties = [
  {
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    title: "Studio Apartment",
    price: "$650/mo",
    beds: "1 Bed",
    distance: "0.5 miles"
  },
  {
    image: "https://images.unsplash.com/photo-1502672260066-6bc35f0cee64?w=600&h=400&fit=crop",
    title: "Shared 2-Bedroom",
    price: "$450/mo",
    beds: "2 Beds",
    distance: "0.3 miles"
  },
  {
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    title: "3-Bedroom Apartment",
    price: "$400/mo",
    beds: "3 Beds",
    distance: "0.8 miles"
  }
];

const benefits = [
  { icon: FaDollarSign, text: "Flexible payment plans" },
  { icon: FaWifi, text: "High-speed internet included" },
  { icon: FaShieldAlt, text: "24/7 security & support" },
  { icon: FaBook, text: "Quiet study spaces" }
];

export default function StudentSection() {
  const [activeProperty, setActiveProperty] = useState(0);

  return (
    <section className="relative py-10 md:py-20 px-5 md:px-10 lg:px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            Student Housing
          </span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-6"
          >
            Find Your Perfect Study Space
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
          >
            Discover affordable, comfortable housing designed for students. 
            Close to campus, fully furnished, and ready for you to move in.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-colors duration-300 inline-flex items-center gap-3 shadow-lg"
          >
            Browse All Student Properties
            <FaArrowRight />
          </motion.button>
        </div>

        {/* Properties Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Featured Properties</h3>
            <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group">
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {properties.map((property, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setActiveProperty(index)}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gray-100 mb-4">
                <Image
                  src={property.image}
                  alt={property.title}
                  width={600}
                  height={400}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                  {property.price}
                </div>
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                
                {/* View Details Button - appears on hover */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <button className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-50 transition-colors">
                    View Details
                  </button>
                </motion.div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {property.title}
              </h3>
              
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{property.beds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{property.distance} from campus</span>
                </div>
              </div>
            </motion.div>
          ))}
          </div>

          {/* See All Button */}
          <div className="text-center">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              
              whileTap={{ scale: 0.98 }}
              className="bg-white border-2 border-blue-600 text-blue-600 font-bold py-4 px-10 rounded-xl hover:bg-blue-50 transition-colors duration-300 inline-flex items-center gap-3"
            >
              See All Student Listings
              <FaArrowRight />
            </motion.button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-blue-600 rounded-3xl p-10 md:p-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Benefits List */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
                Why Students Choose Us
              </h3>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <Icon className="text-blue-600 text-xl" />
                      </div>
                      <p className="text-white text-lg font-medium">{benefit.text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Side - CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-blue-600" />
                <h4 className="text-2xl font-bold text-gray-900">Join 5,000+ Students</h4>
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Ready to find your ideal student accommodation? Schedule a tour 
                or get more information about available properties near your campus.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">No application fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Same-day approval available</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Roommate matching service</span>
                </div>
              </div>

              <motion.button
                
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-3 shadow-lg"
              >
                Schedule a Tour
                <FaArrowRight />
              </motion.button>

              <p className="text-center text-gray-500 text-sm mt-4">
                Limited spots available for next semester
              </p>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}