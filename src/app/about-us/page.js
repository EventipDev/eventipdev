'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutUs() {
  // Team members data
  const teamMembers = [
    {
      name: "The Visionary",
      position: "Chief Executive Officer",
      bio: "Leading strategy, growth, and big-picture thinking to take EventIP to new heights.",
    },
    {
      name: "The Storyteller",
      position: "Chief Marketing Officer",
      bio: "Building the brand, driving excitement, and ensuring events get the spotlight they deserve.",
    },
    {
      name: "The Connector",
      position: "Head of Internal & External Affairs",
      bio: "Forging partnerships, securing sponsorships, and strengthening relationships with key stakeholders.",
    },
    {
      name: "The Protector",
      position: "Head of Legal",
      bio: "Ensuring smooth operations with compliance, security, and trust at every level of our business.",
    },
    {
      name: "The Innovator",
      position: "Chief Technology Officer",
      bio: "Integrating the latest tech to streamline ticketing, event logistics, and digital experiences.",
    }
  ];

  // Our mission points
  const missionPoints = [
    "To take the stress out of event planning by simplifying invitations, ticketing, and audience management.",
    "To provide brands, businesses, and attendees with a space to connect, learn, and grow.",
    "To become the leading ticketing platform where events don't just happen — they sell out.",
    "To create experiences that blend technology, entertainment, and business, making every event an immersive success."
  ];

  // Company values
  const values = [
    {
      icon: "✨",
      title: "Innovation",
      description: "We constantly push boundaries to create new solutions that enhance how people discover and experience events."
    },
    {
      icon: "🤝",
      title: "Connection",
      description: "We believe in the power of live experiences to bring people together and create lasting memories."
    },
    {
      icon: "🌍",
      title: "Inclusivity",
      description: "We're committed to making events accessible to everyone, regardless of background, ability, or circumstance."
    },
    {
      icon: "🔍",
      title: "Transparency",
      description: "We maintain open communication with our users, partners, and team members to build lasting trust."
    }
  ];

  // Milestones
  const milestones = [
    {
      year: "2018",
      title: "Foundation",
      description: "EventIP was founded with a vision to revolutionize how people discover and experience events.",
      icon: "🚀"
    },
    {
      year: "2019",
      title: "First Million",
      description: "Reached our first million users and expanded to 15 countries across Europe and North America.",
      icon: "🌱"
    },
    {
      year: "2020",
      title: "Digital Pivot",
      description: "Led the industry in adapting to global challenges by pioneering virtual and hybrid event experiences.",
      icon: "💻"
    },
    {
      year: "2021",
      title: "AI Integration",
      description: "Launched our AI-powered event matching technology, revolutionizing personalized event discovery.",
      icon: "🧠"
    },
    {
      year: "2022",
      title: "Global Expansion",
      description: "Expanded to 35 countries and formed strategic partnerships with major venue networks worldwide.",
      icon: "🌎"
    },
    {
      year: "2023",
      title: "Series B Funding",
      description: "Secured $25M in Series B funding to accelerate growth and enhance platform capabilities.",
      icon: "💰"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
          alt="About EventIP"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/90 to-orange-600/80"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Our Story
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl"
          >
            <p className="text-amber-50 text-xl md:text-2xl leading-relaxed">
              Creating seamless, stress-free, and unforgettable event experiences.
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Main Content */}
      <main>
        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
              >
                Our Vision
              </motion.h2>
              <div className="h-1 w-20 bg-amber-500 mx-auto mb-10"></div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
              >
                To redefine the future of events by making them more accessible, engaging, and technology driven, while becoming the go-to platform for event ticketing and seamless experiences.
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video rounded-xl overflow-hidden shadow-xl"
              >
                <Image
                  src="https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2070&auto=format&fit=crop"
                  alt="EventIP Experience"
                  fill
                  className="object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">About Event IP</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  At Event IP, we believe events should be more than just gatherings, they should be seamless, stress free, and unforgettable experiences. We take the hassle out of event planning, from invitation handling to ticket sales, so organizers can focus on what truly matters — creating moments that inspire and connect.
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Whether it's a tech exhibition, a brand activation, or a live performance, we make sure every event runs smoothly and sells out effortlessly. 
                </p>
                <p className="text-gray-600 leading-relaxed">
                  At Event IP, we don't just organize events, we create seamless, sell-out experiences. Let's make something unforgettable together.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4 bg-amber-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
              >
                Our Mission
              </motion.h2>
              <div className="h-1 w-20 bg-amber-500 mx-auto mb-10"></div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {missionPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="bg-amber-600 text-white p-1 rounded-full mr-4 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-700">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Values Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
              >
                Our Values
              </motion.h2>
              <div className="h-1 w-20 bg-amber-500 mx-auto mb-10"></div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-gray-600 max-w-4xl mx-auto"
              >
                These core principles guide everything we do at EventIP, from product development to customer service.
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow"
                >
                  <div className="text-5xl mb-6">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
              >
                Meet Our Team
              </motion.h2>
              <div className="h-1 w-20 bg-amber-500 mx-auto mb-10"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                    <p className="text-amber-600 font-medium mb-4">{member.position}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Timeline Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                Our Journey
              </motion.h2>
              <div className="h-1 w-20 bg-white mx-auto mb-10"></div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-amber-100 max-w-4xl mx-auto"
              >
                Key milestones that have shaped EventIP's growth and evolution.
              </motion.p>
            </div>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-white/30"></div>
              
              {/* Timeline Items */}
              <div className="space-y-16">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className="w-1/2"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white/90 text-amber-600 flex items-center justify-center text-2xl z-10">
                      {milestone.icon}
                    </div>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pl-12' : 'pr-12'}`}>
                      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                        <div className="text-sm font-bold text-amber-200 mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold mb-3">{milestone.title}</h3>
                        <p className="text-amber-100">{milestone.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 px-4 bg-amber-50">
          <div className="max-w-5xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
            >
              Join Us on Our Mission
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Whether you're looking to discover your next favorite event, share your passion as an organizer, or join our growing team, we'd love to have you as part of our journey.
            </motion.p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/explore" className="bg-amber-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-md">
                Explore Events
              </Link>
              <Link href="/partners" className="bg-white text-amber-600 border border-amber-600 px-8 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors">
                Become a Partner
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 