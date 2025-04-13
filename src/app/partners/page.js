'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

/*
SQL Script for Partner Request Table:

CREATE TABLE public.partner_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    partnership_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Create index on status for filtering
CREATE INDEX idx_partner_requests_status ON public.partner_requests(status);

-- Create index on created_at for sorting by date
CREATE INDEX idx_partner_requests_created_at ON public.partner_requests(created_at);

-- Create index on partnership_type for filtering by type
CREATE INDEX idx_partner_requests_type ON public.partner_requests(partnership_type);

-- Add row level security policies
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view partner requests
CREATE POLICY "Allow admins to view partner requests" ON public.partner_requests
    FOR SELECT
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Allow anyone to insert partner requests
CREATE POLICY "Allow anyone to submit partner requests" ON public.partner_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
*/

export default function Partners() {
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    contactPerson: '',
    email: '',
    partnershipType: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // Featured partners data
  const featuredPartners = [
    {
      name: "TechEvents Global",
      logo: "https://img.icons8.com/color/96/tech-companies.png",
      description: "Leading technology conference organizer with events across 30+ countries",
      link: "#"
    },
    {
      name: "Venue Network",
      logo: "https://img.icons8.com/color/96/building.png",
      description: "Premier venue management company with 500+ locations worldwide",
      link: "#"
    },
    {
      name: "Festival Group",
      logo: "https://img.icons8.com/color/96/festival.png",
      description: "Award-winning festival organizers known for immersive experiences",
      link: "#"
    },
    {
      name: "Live Productions",
      logo: "https://img.icons8.com/color/96/music-production.png",
      description: "Full-service production company specializing in live entertainment",
      link: "#"
    },
    {
      name: "Corporate Events Pro",
      logo: "https://img.icons8.com/color/96/conference-call--v1.png",
      description: "Corporate event specialists serving Fortune 500 companies globally",
      link: "#"
    },
    {
      name: "Local Experiences",
      logo: "https://img.icons8.com/color/96/city-buildings.png",
      description: "Curators of authentic local experiences and cultural events",
      link: "#"
    }
  ];
  
  // Partnership types
  const partnershipTypes = [
    {
      title: "Event Organizers",
      icon: "🎪",
      description: "Reach a wider audience and sell more tickets with our powerful platform. Get comprehensive tools for event management, promotion, and analytics.",
      benefits: [
        "Advanced ticketing and registration tools",
        "Marketing and promotion support",
        "Real-time sales and analytics",
        "Lower fees for high-volume partners"
      ]
    },
    {
      title: "Venues",
      icon: "🏟️",
      description: "Showcase your venue to thousands of event planners and maximize bookings. Integrate with our platform for seamless event scheduling.",
      benefits: [
        "Dedicated venue profile and promotion",
        "Integrated calendar and booking system",
        "Direct connection with event organizers",
        "Venue-specific analytics and insights"
      ]
    },
    {
      title: "Sponsors",
      icon: "🤝",
      description: "Connect with events that align with your brand values and audience. Gain visibility through targeted sponsorship opportunities.",
      benefits: [
        "Targeted brand exposure",
        "Audience engagement opportunities",
        "Performance analytics",
        "Exclusive event access and partnership"
      ]
    },
    {
      title: "Technology Partners",
      icon: "💻",
      description: "Integrate your technology with our platform to expand your reach and deliver enhanced experiences to event attendees.",
      benefits: [
        "API access and technical documentation",
        "Joint marketing opportunities",
        "Featured in our partners marketplace",
        "Product development collaboration"
      ]
    }
  ];
  
  // Testimonials
  const testimonials = [
    {
      quote: "Partnering with Event IP has transformed our business. We've seen a 40% increase in ticket sales and expanded our audience reach significantly.",
      author: "Sarah Johnson",
      position: "CEO, TechEvents Global",
      image: "https://randomuser.me/api/portraits/women/42.jpg"
    },
    {
      quote: "The integration was seamless, and the support team went above and beyond to ensure our success. Our venue bookings have increased by 35% since joining.",
      author: "Michael Chen",
      position: "Director, Venue Network",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "As a technology partner, we've found Event IP to be innovative and collaborative. Our joint solution has been very well received by customers.",
      author: "Priya Patel",
      position: "CTO, EventTech Solutions",
      image: "https://randomuser.me/api/portraits/women/63.jpg"
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Insert the partnership request into the partner_requests table
      const { data, error } = await supabase
        .from('partner_requests')
        .insert([
          {
            company_name: formData.companyName,
            website: formData.website || null,
            contact_person: formData.contactPerson,
            email: formData.email,
            partnership_type: formData.partnershipType,
            message: formData.message,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error submitting partnership request:', error);
        throw new Error(error.message || 'Failed to submit partnership request');
      }

      setSubmitStatus({ 
        success: true, 
        message: 'Thank you for your interest in partnering with us. Our partnership team will review your application and get back to you soon. Please check your email for further communications.' 
      });
      setFormData({
        companyName: '',
        website: '',
        contactPerson: '',
        email: '',
        partnershipType: '',
        message: ''
      });
    } catch (error) {
      console.error('Exception when submitting partnership request:', error);
      setSubmitStatus({ 
        success: false, 
        message: 'There was an error submitting your partnership request. Please try again or contact us directly at partnerships@eventip.com.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2070&auto=format&fit=crop"
          alt="Partners"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/90 to-orange-600/70"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Partner With Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-lg"
          >
            Join our growing ecosystem of event organizers, venues, sponsors, and technology partners
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <a 
              href="#contact" 
              className="bg-white text-amber-600 px-8 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors shadow-md mr-4"
            >
              Become a Partner
            </a>
            <a 
              href="#types" 
              className="bg-transparent text-white border-2 border-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </div>
      
      {/* Main Content */}
      <main>
        {/* Featured Partners */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Featured Partners</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                We collaborate with industry leaders and innovative organizations to create exceptional event experiences
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPartners.map((partner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="h-16 w-16 mb-6 mx-auto">
                      <div className="relative h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-amber-600">{partner.name.charAt(0)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{partner.name}</h3>
                    <p className="text-gray-600 text-center mb-4">{partner.description}</p>
                    <div className="text-center">
                      <a 
                        href={partner.link} 
                        className="text-amber-600 font-medium hover:text-amber-700 transition-colors"
                      >
                        Visit Partner
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <a 
                href="#" 
                className="text-amber-600 font-medium hover:text-amber-700 transition-colors"
              >
                View All Partners
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
        
        {/* Why Partner With Us */}
        <section className="py-16 px-4 bg-amber-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Partner With Us?</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Partnering with Event IP unlocks powerful benefits and creates new opportunities for growth
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Global Reach</h3>
                <p className="text-gray-600">
                  Access a worldwide audience of event attendees, organizers, and industry professionals across diverse markets and interests.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Powerful Tools</h3>
                <p className="text-gray-600">
                  Leverage our cutting-edge technology platform, data insights, and marketing tools to grow your business.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Multi-platform</h3>
                <p className="text-gray-600">
                  Promote your offerings across web, mobile, and social platforms for maximum visibility and engagement.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Data & Analytics</h3>
                <p className="text-gray-600">
                  Gain valuable insights through comprehensive analytics, reporting, and trend analysis.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Community</h3>
                <p className="text-gray-600">
                  Join a vibrant ecosystem of event professionals, innovators, and industry leaders.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Support</h3>
                <p className="text-gray-600">
                  Benefit from dedicated partner support, resources, and collaborative opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Partnership Types */}
        <section id="types" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Partnership Types</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                We offer various partnership opportunities tailored to your business needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {partnershipTypes.map((type, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-center mb-6">
                      <div className="text-4xl mr-4">{type.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-800">{type.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{type.description}</p>
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {type.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-center">
                      <a 
                        href="#contact" 
                        className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        Learn More
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-16 px-4 bg-gradient-to-r from-amber-600 to-orange-500">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Partner Success Stories</h2>
              <p className="text-amber-100 max-w-3xl mx-auto">
                Hear what our partners have to say about working with us
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                      <div className="w-full h-full flex items-center justify-center text-amber-600 font-bold text-xl">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 text-center italic">"{testimonial.quote}"</p>
                  <div className="text-center">
                    <h4 className="font-bold text-gray-800">{testimonial.author}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Contact Form */}
        <section id="contact" className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Become a Partner</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Interested in partnering with us? Fill out the form below and our partnership team will contact you shortly.
                  </p>
                </div>
                
                {submitStatus && (
                  <div className={`p-4 mb-6 rounded-lg ${submitStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {submitStatus.message}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input 
                        type="text" 
                        id="companyName" 
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input 
                        type="text" 
                        id="website" 
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="www.example.com or https://example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                      <input 
                        type="text" 
                        id="contactPerson" 
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="partnershipType" className="block text-sm font-medium text-gray-700 mb-1">Partnership Type *</label>
                    <select 
                      id="partnershipType" 
                      name="partnershipType"
                      value={formData.partnershipType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Select a partnership type</option>
                      <option value="organizer">Event Organizer</option>
                      <option value="venue">Venue</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="technology">Technology Partner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea 
                      id="message" 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      placeholder="Tell us about your company and your partnership interests..."
                    ></textarea>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`bg-amber-600 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-700'}`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Partnership Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 