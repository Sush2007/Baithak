"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { LogIn, MessageSquareCode, Coins, Menu, X, Plus, Minus } from 'lucide-react';
import Button from '../components/ui/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const FAQS = [
  {
    q: "Is Baithak only for my college?",
    a: "Currently, Baithak is an exclusive platform. You must register with a verified college email address to access your campus's private circle."
  },
  {
    q: "How do Honour Points work?",
    a: "Every time you answer a question, share helpful notes, or get upvoted by peers, you earn Honour Points. Accumulating these points unlocks special profile badges, ranks, and real-world perks."
  },
  {
    q: "Can I remain anonymous?",
    a: "Yes! While you must verify your identity to join the platform, you can choose a custom Username and Avatar. Your real name and email are never shown publicly."
  },
  {
    q: "Who can answer my questions?",
    a: "Only verified students from your college (seniors, peers, and alumni) can answer. This ensures that every answer is highly contextual to your specific professors and campus culture."
  },
  {
    q: "Is Baithak completely free to use?",
    a: "Yes, Baithak is 100% free for all students. Our mission is to democratize campus knowledge and make it accessible without any paywalls."
  },
  {
    q: "Can I install Baithak as an app on my phone?",
    a: "Absolutely! Baithak is built as a Progressive Web App (PWA). Just open the website in Chrome or Safari on your phone, tap 'Share' or browser options, and select 'Add to Home Screen' to install it natively."
  }
];

const LandingPageClient = () => {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  
  const howItWorksRef = useRef(null);
  const walkwayPathRef = useRef(null);

  const [typedCount, setTypedCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Scroll Spy logic to highlight active section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'how-it-works', el: document.getElementById('how-it-works') },
        { id: 'problems', el: document.getElementById('problems') }
      ];

      let currentActive = '';
      let minDistance = Infinity;

      sections.forEach(({ id, el }) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2) {
            const distance = Math.abs(rect.top);
            if (distance < minDistance) {
              minDistance = distance;
              currentActive = id;
            }
          }
        }
      });

      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    
    // Ensure GSAP recalculates after initial render and image/video loads
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Typewriter effect for Hero Tagline
  useEffect(() => {
    let count = 0;
    const maxCount = 38; // length of "Ek aisi Baithak bhi zaroori hai mittar"
    const timer = setInterval(() => {
      count += 1;
      setTypedCount(count);
      if (count >= maxCount) {
        clearInterval(timer);
      }
    }, 70); // 70ms per character
    return () => clearInterval(timer);
  }, []);

  // Fix GSAP Scroll Clipping (FOUT Bug)
  useEffect(() => {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  // Landing Page Entry Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal animation for all elements marked with class 'reveal-landing'
      const reveals = document.querySelectorAll('.reveal-landing');
      reveals.forEach((el, index) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            delay: index * 0.1, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
            }
          }
        );
      });

      // Custom floating motion for right column cards in Hero
      gsap.to('.hero-float-1', {
        y: -12,
        rotation: -1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
      gsap.to('.hero-float-2', {
        y: 12,
        rotation: 2,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 0.5
      });
    });

    return () => ctx.revert();
  }, []);

  // Scroll walkway animation for "How Baithak Works"
  useEffect(() => {
    let ctx = gsap.context(() => {
      // 2. Safeguard: Ensure elements exist in the DOM
      if (!howItWorksRef.current || !walkwayPathRef.current) return;

      const path = walkwayPathRef.current;
      
      // 3. Force browser to calculate exact path geometry
      const pathLength = path.getTotalLength();

      // 4. Set initial hidden state explicitly
      gsap.set(path, { 
        strokeDasharray: pathLength, 
        strokeDashoffset: pathLength,
        opacity: 1 // Ensure the SVG itself isn't hidden by CSS
      });

      // 5. Link the drawing animation strictly to the container's scroll depth
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: "top 60%", // Start drawing when container is 60% down the viewport
          end: "bottom 80%", // Finish drawing before the user scrolls past it
          scrub: 1.5, // Smooth scrubbing
          invalidateOnRefresh: true, // Recalculate on mobile orientation shifts
        }
      });
    }, howItWorksRef); // Scope context to the container

    return () => {
      ctx.revert(); // Strict cleanup to prevent React strict-mode duplication
    };
  }, []);

  return (
    <ProtectedRoute type="public-only">
      <div className="min-h-screen bg-bg-dark text-on-surface font-body hero-grid selection:bg-accent-yellow selection:text-bg-dark">
        {/* Subtle SVG Noise Grain */}
        <div className="noise-overlay"></div>

        {/* Navigation */}
        {/* Desktop Navigation */}
        <nav className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-4xl rounded-full border border-white/10 bg-surface-dark/60 backdrop-blur-xl z-[60] justify-between items-center px-8 py-3.5 shadow-2xl transition-all duration-300 h-[80px] w-100px">
          <a href="#" className="flex items-center">
            <Image src="/logo.png" alt="Baithak Logo" width={120} height={34} className="h-6 w-auto object-contain hover:opacity-90 transition-opacity" priority={true} />
          </a>
          <div className="flex gap-4 items-center">
            <a
              href="#problems"
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-300 ${
                activeSection === 'problems'
                  ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/5'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Why Baithak
            </a>
            
            <a
              href="#how-it-works"
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-300 ${
                activeSection === 'how-it-works'
                  ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/5'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              How It Works
            </a>

            <Link
              href="/about"
              className="text-sm font-semibold px-4 py-1.5 rounded-full border border-transparent text-on-surface-variant hover:text-on-surface hover:border-accent-yellow/30 hover:bg-accent-yellow/5 transition-all duration-300 cursor-pointer bg-transparent"
            >
              About Us
            </Link>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })} variant="primary" className="text-xs py-2 px-5 font-bold cursor-pointer">
              Join Baithak
            </Button>
          </div>
        </nav>

      
        <button 
          aria-label="Open mobile menu"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden fixed top-6 right-6 w-12 h-12 rounded-full border border-white/10 bg-surface-dark/80 backdrop-blur-xl z-[60] flex items-center justify-center text-on-surface hover:text-accent-yellow shadow-2xl transition-all duration-300 cursor-pointer"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Navigation Drawer */}
        <div 
          className={`fixed inset-0 z-[70] transition-all duration-300 md:hidden ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          ></div>
          
          {/* Drawer Content */}
          <div 
            className={`absolute top-0 right-0 h-full w-[280px] bg-surface-dark border-l border-white/10 p-8 shadow-2xl flex flex-col justify-between transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col space-y-8">
              <div className="flex justify-between items-center h-16 w-auto">
                <a href="#" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  <Image src="/logo.png" alt="Baithak Logo" width={120} height={34} className="h-7 w-auto object-contain hover:opacity-90 transition-opacity" priority={true} />
                </a>
                <button 
                  aria-label="Close mobile menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-on-surface hover:text-accent-yellow transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#problems" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-300 ${
                    activeSection === 'problems'
                      ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/5'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Why Baithak
                </a>
               
                <a 
                  href="#how-it-works" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-300 ${
                    activeSection === 'how-it-works'
                      ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/5'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  How It Works
                </a>

                <Link 
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold px-4 py-2 rounded-full border border-transparent text-on-surface-variant hover:text-on-surface hover:border-accent-yellow/30 hover:bg-accent-yellow/5 transition-all duration-300 cursor-pointer bg-transparent text-left block"
                >
                  About Us
                </Link>
              </nav>
            </div>
            
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  signInWithGoogle();
                }} 
                variant="primary" 
                className="w-full py-3 text-xs font-bold cursor-pointer"
              >
                Sign In / Join
              </Button>
              <p className="text-[10px] text-center text-on-surface-variant/40">© 2026 Baithak.</p>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 px-6 overflow-hidden">
          {/* Softer, more elliptical Glow Blobs */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary-navy/15 blur-[120px] rounded-[100%] pointer-events-none"></div>
          <div className="absolute bottom-20 right-20 w-[400px] h-[200px] bg-accent-yellow/5 blur-[90px] rounded-[100%] pointer-events-none transform -rotate-12"></div>
          
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            <div className="lg:col-span-7 flex flex-col items-start text-left reveal-landing">
              
              {/* Live Indicator */}
              <br />
              <br />
   
              <h1 className="font-heading text-4xl md:text-8xl lg:text-[90px] leading-[1.0] mb-6 tracking-tighter text-on-surface/95 drop-shadow-sm">
                {(() => {
                  const p1 = "Ek aisi ";
                  const p2 = "Baithak";
                  const p3 = " bhi zaroori hai mittar!";

                  const showP1 = typedCount > 0;
                  const showP2 = typedCount > p1.length;
                  const showP3 = typedCount > (p1.length + p2.length);

                  return (
                    <>
                      {showP1 && p1.slice(0, typedCount)}
                      {showP2 && (
                        <span className="text-accent-yellow italic font-normal text-yellow">
                          {p2.slice(0, typedCount - p1.length)}
                        </span>
                      )}
                      {showP3 && <br />}
                      {showP3 && p3.slice(0, typedCount - p1.length - p2.length)}
                      <span className="inline-block w-[4px] md:w-[8px] h-[0.8em] bg-accent-yellow ml-1 md:ml-2 align-middle animate-cursor-blink"></span>
                    </>
                  );
                })()}
              </h1>
   
            
              <p className="text-on-surface-variant text-base md:text-lg mb-10 max-w-xl leading-relaxed">
                Ask questions. Get answers from seniors who actually know your courses, canteen hacks, and exam patterns. Build reputation that opens doors on campus.
              </p>
            </div>

            {/* Right column: Login Interface */}
            <div id="join-section" className="lg:col-span-5 relative flex items-center justify-center lg:justify-end h-full min-h-[400px] reveal-landing w-full">
              <div className="relative w-full max-w-[400px] flex flex-col space-y-6">
                <h2 className="text-5xl font-heading text-on-surface tracking-tight text-left">
                  Join today.
                </h2>
                
                {/* Google Sign Up */}
                <button 
                  onClick={signInWithGoogle}
                  className="w-full bg-white hover:bg-neutral-100 text-black font-semibold py-3.5 px-6 rounded-full flex items-center justify-center gap-3 transition-all duration-300 shadow-sm cursor-pointer text-sm animate-fade-in"
                >
                  <Image src="/google-logo.png" alt="Google" width={20} height={20} className='h-5 w-auto '/>
                  Sign up with Google
                </button>

                {/* Terms of Service text */}
                <p className="text-[11px] text-on-surface-variant/60 leading-relaxed text-left">
                  By signing up, you agree to the{' '}
                  <Link href="/terms" className="text-on-surface hover:text-accent-yellow underline transition-colors cursor-pointer">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-on-surface hover:text-accent-yellow underline transition-colors cursor-pointer">
                    Privacy Policy
                  </Link>
                  , including. Requires verified college id.
                </p>

                {/* Already have an account? */}
                <div className="pt-8 flex flex-col space-y-4">
                  <h3 className="text-base font-semibold text-on-surface font-sans text-left">
                    Already have an account?
                  </h3>
                  
                  {/* Sign In Button */}
                  <button
                    onClick={signInWithGoogle}
                    className="w-full bg-white font-semibold py-3.5 px-6 rounded-full transition-all duration-300 cursor-pointer text-black font-sans flex items-center justify-center"
                  >
                    <Image src="/google-logo.png" alt="Google" width={20} height={20} className="w-auto h-5 inline mr-[5px]" />
                    Sign in with Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Showcase Section */}
        <section className="relative w-full py-16 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center z-20">
          <div className="w-full relative rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 bg-gradient-to-b from-white/10 to-transparent shadow-[0_0_100px_rgba(255,186,9,0.1)] backdrop-blur-md reveal-landing border border-white/5">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent-yellow/50 to-transparent"></div>
            <div className="w-full relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 bg-surface-dark aspect-video flex items-center justify-center group shadow-2xl pointer-events-none">
              <video 
                src={`${process.env.NEXT_PUBLIC_R2_URL || 'https://pub-a45e2aa5add24ba0a8813221a09a64a9.r2.dev'}/landing-page-video/feature-tour.mp4`}
                poster="/dashboard-mockup.png"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                className="w-full h-full object-cover pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section id="problems" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/5">
          <div className="text-center mb-20 reveal-landing">
            <h2 className="font-heading text-5xl md:text-6xl text-on-surface mb-4">
              Your college knowledge <span className="text-accent-yellow italic font-normal text-glow">disappears</span> every semester.
            </h2>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">Traditional platforms lack structure, context, and incentive.</p>
          </div>

          <div className="relative flex flex-col items-center gap-12 w-full max-w-3xl mx-auto pb-12">
            {/* Card 1 */}
            <div 
              className="sticky top-[100px] w-full bg-[#0A1228]/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 border-t-4 border-t-red-400 hover:-translate-y-1 scale-[0.94]" 
              style={{ zIndex: 10 }}
            >
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-heading">WhatsApp loses everything</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Important PDFs, deadlines, and project announcements get buried under good morning forwards and general spam. There is no search filter for campus memory.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              className="sticky top-[130px] w-full bg-[#0A1228]/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 border-t-4 border-t-primary-navy hover:-translate-y-1 scale-[0.96]" 
              style={{ zIndex: 20 }}
            >
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-heading">ChatGPT has no local context</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  AI knows general concepts, but it doesn't know what Prof. Sharma likes to ask in the second internal test or what lab assignments actually score marks.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              className="sticky top-[160px] w-full bg-[#0A1228]/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 border-t-4 border-t-accent-yellow hover:-translate-y-1 scale-[0.98]" 
              style={{ zIndex: 30 }}
            >
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-heading">Zero credit for helping</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  You spend hours explaining complex math formulas, sharing notes, or debugging lab programs for juniors on DMs, but your contribution remains invisible.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div 
              className="sticky top-[190px] w-full bg-[#0A1228]/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 border-t-4 border-t-secondary-sand hover:-translate-y-1 scale-100" 
              style={{ zIndex: 40 }}
            >
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-heading">No way to find trusted peers</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Finding the right senior who cleared that specific subject backlog, did that research internship, or crack a selective club interview is purely based on luck.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Baithak Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="relative w-full h-auto md:h-screen bg-bg-dark/40 border-t border-white/5">
          <div className="how-it-works-content w-full h-auto md:h-full flex flex-col justify-center overflow-visible md:overflow-hidden py-16 md:py-0">
            
            <div className="text-center mb-12 md:mb-16 reveal-landing shrink-0">
              <h2 className="font-heading text-5xl md:text-6xl text-on-surface">
                How <span className="text-accent-yellow italic font-normal ">Baithak</span> Works
              </h2>
              <p className="text-on-surface-variant text-sm mt-3">A seamless loop of campus knowledge sharing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 w-full max-w-5xl mx-auto px-6 items-center flex-1 h-auto">
              {/* Left side: Steps */}
              <div className="md:col-span-6 flex flex-col justify-center space-y-12 pr-4 h-full">
                {/* Step 1 */}
                <div className="step-desc-1 transition-all duration-300">
                  <span className="px-3 py-1 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow rounded-full text-[10px] font-bold uppercase tracking-widest">Step 1</span>
                  <h3 className="text-2xl font-bold text-on-surface mt-3 mb-2 font-heading">Come to Baithak</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Sign in or register with your verified college email to claim your spot in your campus's exclusive community circle.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="step-desc-2 transition-all duration-300">
                  <span className="px-3 py-1 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow rounded-full text-[10px] font-bold uppercase tracking-widest">Step 2</span>
                  <h3 className="text-2xl font-bold text-on-surface mt-3 mb-2 font-heading">Post in your Subject</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Ask questions directly inside dedicated subject channels (like OS, DBMS) or general spaces so the right peers see it.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="step-desc-3 transition-all duration-300">
                  <span className="px-3 py-1 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow rounded-full text-[10px] font-bold uppercase tracking-widest">Step 3</span>
                  <h3 className="text-2xl font-bold text-on-surface mt-3 mb-2 font-heading">Get Answered & Earn Points</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Get clear, contextual answers in no time. Answer others' questions to accumulate Honour Points and unlock achievements.
                  </p>
                </div>
              </div>

              {/* Right side: SVG Walkway */}
              <div className="hidden md:flex md:col-span-6 relative items-center justify-center h-full min-h-[450px]">
                <svg className="w-full h-full max-w-[450px] max-h-[450px] overflow-visible" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="active-path-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFE082" />
                      <stop offset="50%" stopColor="#FFBA09" />
                      <stop offset="100%" stopColor="#FF8F00" />
                    </linearGradient>
                    <radialGradient id="walker-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFBA09" stopOpacity="1" />
                      <stop offset="100%" stopColor="#FFBA09" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Background dashed SVG path */}
                  <path
                    d="M 80 80 C 300 80, 320 160, 320 250 C 320 340, 300 420, 80 420"
                    stroke="rgba(255, 186, 9, 0.15)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                    fill="none"
                  />

                  {/* Foreground active path drawn on scroll */}
                  <path
                    ref={walkwayPathRef}
                    d="M 80 80 C 300 80, 320 160, 320 250 C 320 340, 300 420, 80 420"
                    stroke="url(#active-path-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Step 1 Node */}
                  <g transform="translate(80, 80)">
                    <circle className="step-node-1 transition-all duration-300" r="28" fill="#111A35" stroke="#FFBA09" strokeWidth="3" />
                    <g transform="translate(-10, -10)">
                      <LogIn size={20} className="text-[#FFBA09]" />
                    </g>
                  </g>

                  {/* Step 2 Node */}
                  <g transform="translate(320, 250)">
                    <circle className="step-node-2 transition-all duration-300" r="28" fill="#111A35" stroke="#FFBA09" strokeWidth="3" />
                    <g transform="translate(-10, -10)">
                      <MessageSquareCode size={20} className="text-[#FFBA09]" />
                    </g>
                  </g>

                  {/* Step 3 Node */}
                  <g transform="translate(80, 420)">
                    <circle className="step-node-3 transition-all duration-300" r="28" fill="#111A35" stroke="#FFBA09" strokeWidth="3" />
                    <g transform="translate(-10, -10)">
                      <Coins size={20} className="text-[#FFBA09]" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-white/5">
          <div className="text-center mb-16 reveal-landing">
            <h2 className="font-heading text-4xl md:text-5xl text-on-surface mb-4">
              Frequently Asked <span className="text-accent-yellow italic font-normal text-glow">Questions</span>
            </h2>
            <p className="text-on-surface-variant text-sm">Everything you need to know about the platform.</p>
          </div>

          <div className="space-y-4 reveal-landing">
            {FAQS.map((faq, index) => (
              <div 
                key={index} 
                className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${
                  openFaq === index ? 'bg-white/5 border-white/20 shadow-[0_0_30px_rgba(255,186,9,0.05)]' : 'bg-transparent hover:bg-white/5 hover:border-white/15'
                }`}
              >
                <button
                  onClick={() => {
                    setOpenFaq(openFaq === index ? null : index);
                    // Refresh ScrollTrigger slightly after animation to fix any layout shifts
                    setTimeout(() => ScrollTrigger.refresh(), 350);
                  }}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className={`font-semibold transition-colors duration-300 ${openFaq === index ? 'text-accent-yellow' : 'text-on-surface'}`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 ml-4 p-1 rounded-full transition-all duration-300 ${openFaq === index ? 'bg-accent-yellow/20 text-accent-yellow rotate-180' : 'bg-white/5 text-on-surface-variant'}`}>
                    {openFaq === index ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 px-6 border-t border-white/5 bg-surface-dark/20 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="m-[1px] w-auto h-12 flex items-center justify-center">
              <Image src="/logo.png" alt="Baithak Logo" width={150} height={42} className="w-auto h-8" />
            </div>
            <div className="flex flex-wrap gap-8 text-[11px] font-bold text-on-surface-variant/50 items-center justify-center">
              <Link href="/about" className="hover:text-accent-yellow transition-colors cursor-pointer font-bold bg-transparent border-0">About Us</Link>
              <Link href="/privacy" className="hover:text-accent-yellow transition-colors cursor-pointer font-bold bg-transparent border-0">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-accent-yellow transition-colors cursor-pointer font-bold bg-transparent border-0">Terms of Service</Link>
              
              <a href="https://www.instagram.com/baithak.ig/" className="hover:text-accent-yellow transition-colors"> Instagram</a>
              <a href="#" className="hover:text-accent-yellow transition-colors"> Twitter / X</a>
              <a href="#" className="hover:text-accent-yellow transition-colors"> Linkedin</a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=baithak.support@gmail.com" target="_blank" className="hover:text-accent-yellow transition-colors">Support</a>
            </div>
            <p className="text-[10px] text-on-surface-variant/40">© 2026 Baithak. Designed for midnight academic communities.</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
};

export default LandingPageClient;
