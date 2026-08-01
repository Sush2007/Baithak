"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ArrowLeft, User } from 'lucide-react';

const TEAM_MEMBERS = [
  {
    id: 'soumya',
    name: 'Soumya Patnaik',
    role: 'Founder & CTO',
    image: "/founder.png",
  },
  {
    id: 'sushmit',
    name: 'Sushmit K. Satapathy',
    role: 'Co-Founder & CEO',
    image: "/Co-Founder.png",
  },
  {
    id: 'akshit',
    name: 'Akshit Bindhani',
    role: 'Creative Head & COO',
    image: "/creativehead.png",
  },
  {
    id: 'siddharth',
    name: 'G. Siddharth',
    role: 'Product Manager',
    image: "/product.png",
  },
];

const SECTIONS = [
  {
    id: 'about',
    title: 'About Baithak',
    content: (
      <>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Baithak is a student-centered discussion platform built to create meaningful conversations within educational communities. We believe students should have a space where they can ask questions, share ideas, seek guidance, discuss opportunities, and connect with others without barriers.
        </p>
      </>
    )
  },
  {
    id: 'vision',
    title: 'Our Vision',
    content: (
      <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
        To build a trusted digital space where students from different institutions can freely exchange ideas, learn from one another, and create communities that encourage growth, curiosity, and meaningful connections.
      </p>
    )
  },
  {
    id: 'mission',
    title: 'Our Mission',
    content: (
      <p className="text-sm text-on-surface-variant leading-relaxed">
        To make student discussions accessible, engaging, and community-driven by providing a platform where people can ask, learn, guide, and grow together.
      </p>
    )
  },
  {
    id: 'whoWeAre',
    title: 'Who We Are',
    content: (
      <>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          We are students building a space where conversations matter. Baithak is designed to connect people through ideas, questions, experiences, and meaningful discussions while creating a trusted and engaging student community.
        </p>
        <p className="text-sm text-accent-yellow font-bold uppercase tracking-wider mt-4 font-heading select-none">
          Built by students. Designed for conversations.
        </p>
      </>
    )
  }
];

const AboutUsPageClient = () => {
  const router = useRouter();
  const lightTubeRef = useRef(null);
  const aboutTitleRef = useRef(null);
  const usTitleRef = useRef(null);
  const backBtnRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Neon lightbar horizontal scale-in
    if (lightTubeRef.current) {
      tl.fromTo(lightTubeRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }
      );
    }

    // 2. Heading lines reveal
    const headingLines = [aboutTitleRef.current, usTitleRef.current].filter(Boolean);
    if (headingLines.length > 0) {
      tl.fromTo(headingLines,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 },
        '-=0.8'
      );
    }

    // 3. Back Button scale/bounce
    if (backBtnRef.current) {
      tl.fromTo(backBtnRef.current,
        { scale: 0, opacity: 0, rotation: 45 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' },
        '-=0.4'
      );
    }

    // 4. Section Grid Items (vertical lines scaling + content fading in)
    const gridItems = document.querySelectorAll('.sec-grid-item');
    gridItems.forEach((item, index) => {
      const line = item.querySelector('.sec-vertical-line');
      const content = item.querySelector('.sec-content');
      
      tl.fromTo(line,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.5, ease: 'power2.out' },
        `-=${index === 0 ? 0.3 : 0.4}`
      );
      
      tl.fromTo(content,
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.5 },
        '-=0.45'
      );
    });

    // 5. Team Title and Team Cards reveal
    const teamTitle = document.querySelector('.team-section-title');
    const teamCards = document.querySelectorAll('.team-card');
    
    if (teamTitle) {
      tl.fromTo(teamTitle,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      );
    }
    
    if (teamCards.length > 0) {
      tl.fromTo(teamCards,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out' },
        '-=0.4'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-body hero-grid flex flex-col items-center justify-start pt-24 pb-16 px-6 selection:bg-accent-yellow selection:text-bg-dark relative overflow-hidden">
      
      {/* Glow Blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-navy/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-accent-yellow/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-4xl w-full flex flex-col items-start z-10">
        
        {/* Neon Lightbar at the top */}
        <div ref={lightTubeRef} className="w-full flex justify-start mb-8 origin-left">
          <div className="neon-light-tube">
            <div className="neon-light-tube-core"></div>
          </div>
        </div>

        {/* Huge Pinterest-inspired title header */}
        <h1 className="flex flex-col gap-1 mb-16">
          <div className="overflow-hidden py-1">
            <div ref={aboutTitleRef} className="font-heading font-black text-6xl md:text-8xl lg:text-[95px] leading-[0.95] tracking-tighter text-on-surface uppercase select-none">
              About
            </div>
          </div>

          <div className="overflow-hidden py-1">
            <div ref={usTitleRef} className="flex items-center gap-4 md:gap-6 flex-wrap leading-[0.95]">
              <span className="text-outline font-heading font-black text-6xl md:text-8xl lg:text-[95px] uppercase tracking-tighter select-none">
                Us
              </span>

              {/* Circular Action Back Button */}
              <button
                ref={backBtnRef}
                onClick={() => router.push('/')}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-accent-yellow text-bg-dark flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,186,9,0.4)] cursor-pointer hover:shadow-[0_0_30px_rgba(255,186,9,0.7)] group"
                aria-label="Back to Home"
              >
                <ArrowLeft className="w-7 h-7 md:w-10 md:h-10 text-bg-dark group-hover:-translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </h1>

        {/* Spaced grid of sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16 w-full">
          {SECTIONS.map((sec) => (
            <div key={sec.id} className="sec-grid-item flex items-stretch text-left">
              
              {/* Vertical accent indicator line */}
              <div className="sec-vertical-line w-[4px] bg-accent-yellow rounded-full shadow-[0_0_10px_rgba(255,186,9,0.5)] origin-top shrink-0"></div>
              
              {/* Section content */}
              <div className="sec-content pl-6 flex flex-col justify-start">
                
                <h2 className="text-2xl font-bold text-on-surface mb-3 font-heading select-none">
                  {sec.title}
                </h2>
                <div className="text-on-surface-variant font-medium">
                  {sec.content}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Meet Our Team Section */}
        <div className="mt-28 w-full flex flex-col items-start">
          <div className="team-section-title overflow-hidden w-full mb-12 text-left">
            <h2 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter text-on-surface select-none">
              Every <span className="text-accent-yellow">Baithak </span> has its <span className="text-outline-accent tracking-normal">regulars</span>
            </h2>
            <p className="text-xs text-on-surface-variant/70 uppercase tracking-widest font-heading mt-2">
              Meet the four who started this one.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="team-card glass-card accent-glow-hover rounded-2xl p-5 flex flex-col items-center text-center group cursor-pointer relative overflow-hidden"
              >
                {/* Photo Placeholder / Image */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-surface-dark to-primary-navy/40 border border-white/5 flex items-center justify-center relative overflow-hidden mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffd791_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute inset-4 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                      <User className="w-8 h-8 text-on-surface-variant/40 group-hover:text-accent-yellow/60 group-hover:scale-110 transition-all duration-300" />
                      <span className="text-[10px] text-on-surface-variant/30 uppercase tracking-widest font-mono group-hover:text-accent-yellow/40 transition-colors duration-300">Photo Here</span>
                    </div>
                  </div>
                )}

                {/* Name */}
                <h3 className="font-heading font-bold text-lg text-on-surface group-hover:text-accent-yellow transition-colors duration-300">
                  {member.name}
                </h3>

                {/* Role */}
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  {member.role}
                </p>

                {/* Subtle light reflect line on hover */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-yellow/40 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUsPageClient;
