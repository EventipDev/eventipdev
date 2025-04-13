import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-20 pb-8 relative overflow-hidden w-full z-10">
      {/* Shine Effect Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="shine-effect absolute -inset-[100%] w-[300%] h-[300%] rotate-12 animate-shine"></div>
      </div>
      
      {/* Enhanced Background Pattern with slight animation */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50"></div>
      
      {/* Improved Curved Top Edge */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320" 
          className="absolute -top-1 left-0 w-full"
          preserveAspectRatio="none"
          style={{ transform: 'rotateX(180deg)', filter: 'drop-shadow(0 -4px 3px rgba(0,0,0,0.07))' }}
        >
          <path 
            fill="#ffffff" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
          </path>
        </svg>
      </div>
      
      <div className="w-full px-0 relative z-10">
        {/* Main Footer Content with Improved Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 px-6 md:px-10">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-block group">
              <div className="relative w-16 h-16 transition-transform duration-300 transform group-hover:scale-105">
                <div className="absolute inset-0 bg-white rounded-full shadow-md"></div>
                <Image 
                  src="/logo.png" 
                  alt="Eventip" 
                  width={64}
                  height={64}
                  className="object-contain w-16 h-16 relative z-10"
                  unoptimized
                />
              </div>
            </Link>
            <p className="text-gray-300 max-w-md leading-relaxed">Discover and experience the best events happening around you. Connect with like-minded people and create unforgettable memories.</p>
            <div className="flex space-x-4 pt-4">
              {/* Social Media Icons with Enhanced Hover Effects */}
              <a href="https://www.facebook.com/share/1DmqXGCjHi/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="https://x.com/eventipofficial?t=8TtsIz8CI9ud2qDXU49F1Q&s=09" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="https://www.instagram.com/event.ip?igsh=MWtuazJpZjIwZzNzNA==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@event.ip?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a href="https://www.threads.net/@event.ip" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
                <Image
                  src="/thread.png"
                  alt="Threads"
                  width={20}
                  height={20}
                  className="object-contain"
                  unoptimized
                />
              </a>
            </div>
          </div>
          
          {/* Quick Links with Enhanced Styling */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10 text-white">Categories</span>
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-white"></span>
            </h3>
            <ul className="space-y-3">
              <li><Link href="/categories" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">All Events</span>
              </Link></li>
              <li><Link href="/categories/music" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Music</span>
              </Link></li>
              <li><Link href="/categories/sports" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Sports</span>
              </Link></li>
              <li><Link href="/categories/arts" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Arts</span>
              </Link></li>
              <li><Link href="/categories/photography" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Photography</span>
              </Link></li>
            </ul>
          </div>
          
          {/* Resources with Enhanced Styling */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10 text-white">Resources</span>
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-white"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="/user-guides" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">User Guides</span>
              </a></li>
              <li><a href="/help-center" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Help Center</span>
              </a></li>
              <li><a href="/partners" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Partners</span>
              </a></li>
              <li><a href="/news" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">News & Updates</span>
              </a></li>
            </ul>
          </div>
          
          {/* Company with Enhanced Styling */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10 text-white">Company</span>
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-white"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="/about-us" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">About Us</span>
              </a></li>
              <li><a href="/contact-us" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Contact Us</span>
              </a></li>
              <li><Link href="/explore" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Explore</span>
              </Link></li>
              <li><Link href="/categories" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 transition-all duration-300 group-hover:w-2 group-hover:h-2"></span>
                <span className="transition-all duration-300 group-hover:translate-x-1">Categories</span>
              </Link></li>
            </ul>
          </div>
          
          {/* Newsletter with Enhanced Styling */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10 text-white">Stay Connected</span>
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-white"></span>
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed">Subscribe to our newsletter for updates and exclusive offers</p>
            <div className="flex flex-col space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400 transition-all duration-300 border border-white/0 focus:border-white/20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-white text-[#03045E] rounded-lg font-medium hover:bg-white/90 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer with Enhanced Styling */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center px-6 md:px-10">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <select className="bg-white/10 text-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/5 hover:border-white/20 transition-all duration-300">
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Eventip. All rights reserved.
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors relative group">
              Privacy Policy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="hover:text-white transition-colors relative group">
              Terms of Service
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="hover:text-white transition-colors relative group">
              Cookie Policy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
        </div>
      </div>
      
      {/* CSS for the shine effect */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(12deg);
          }
          100% {
            transform: translateX(100%) rotate(12deg);
          }
        }
        
        .shine-effect {
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.03) 25%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.03) 75%, 
            rgba(255, 255, 255, 0) 100%
          );
          animation: shine 8s infinite linear;
        }
        
        @media (prefers-reduced-motion) {
          .shine-effect {
            animation: none;
          }
        }
      `}</style>
    </footer>
  );
}