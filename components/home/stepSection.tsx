// components/steps-section.tsx
'use client';

import { CheckCircle2, Home, Search, FileText, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Browse Properties",
    description: "Explore our curated collection of properties with advanced filters and virtual tours.",
    features: ["Advanced search filters", "Virtual tours", "Save favorites"]
  },
  {
    number: 2,
    icon: Home,
    title: "Schedule Viewing",
    description: "Book in-person or virtual viewings at your convenience with our smart scheduling system.",
    features: ["Flexible scheduling", "Virtual tours", "Agent matching"]
  },
  {
    number: 3,
    icon: FileText,
    title: "Make an Offer",
    description: "Submit your offer digitally with guided assistance and transparent documentation.",
    features: ["Digital paperwork", "Offer tracking", "Legal guidance"]
  },
  {
    number: 4,
    icon: Key,
    title: "Close & Move In",
    description: "Complete the transaction smoothly and get ready to move into your new home.",
    features: ["Secure payment", "Key handover", "Move-in support"]
  }
];

export function StepsSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Find Your Dream Home in 4 Easy Steps
          </h2>
          <p className="text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
            Our streamlined process makes buying or renting property simple, transparent, and stress-free.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connecting Line for Desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-blue-200 -z-10" />
              )}

              {/* Step Card */}
              <Card className="h-full border-blue-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 group">
                <CardContent className="p-6 md:p-8">
                  {/* Step Number with Gradient */}
                  <div className="relative mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    {/* Progress Line for Mobile */}
                    {index < steps.length - 1 && (
                      <div className="md:hidden absolute top-6 -right-8 w-8 h-0.5 bg-blue-200" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              Get Started Today
            </button>
            <button className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Learn More
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Join thousands of satisfied customers who found their perfect home
          </p>
        </div>
      </div>
    </section>
  );
}