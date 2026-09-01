"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ArrowLeft, User } from 'lucide-react';

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
        { scaleX: 1, opacity: 1, duration: 0.6, ease: 'expo.out' }
      );
    }

    // 2. Heading lines reveal
    const headingLines = [aboutTitleRef.current, usTitleRef.current].filter(Boolean);
    if (headingLines.length > 0) {
      tl.fromTo(headingLines,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        '-=0.4'
      );
    }

    // 3. Back Button scale/bounce
    if (backBtnRef.current) {
      tl.fromTo(backBtnRef.current,
        { scale: 0, opacity: 0, rotation: 45 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: 'back.out(1.7)' },
        '-=0.2'
      );
    }

    // 4. Section Grid Items (vertical lines scaling + content fading in)
    const gridItems = document.querySelectorAll('.sec-grid-item');
    gridItems.forEach((item, index) => {
      const line = item.querySelector('.sec-vertical-line');
      const content = item.querySelector('.sec-content');
      
      tl.fromTo(line,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.3, ease: 'power2.out' },
        `-=${index === 0 ? 0.2 : 0.25}`
      );
      
      tl.fromTo(content,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3 },
        '-=0.2'
      );
    });

    // 5. Team Section fade in
    const teamSection = document.querySelector('.team-section');
    if (teamSection) {
      tl.fromTo(teamSection,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.1'
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

        {/* Team Section */}
        <div className="team-section w-full mt-32 mb-10 flex flex-col items-center text-center">
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter select-none mb-2">
            <span className="text-white">Every </span>
            <span className="text-accent-yellow">Baithak </span>
            <span className="text-white">has its </span>
            <span className="text-outline-accent">Regulars</span>
          </h2>
          <p className="text-[#8E909E] text-xs font-bold tracking-widest uppercase mb-12">
            Meet the four who started this one.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full">
            {[
              { name: 'Soumya Patnaik', role: 'Founder & CTO', image: '/founder.png' },
              { name: 'Sushmit K. Satapathy', role: 'Co-Founder & CEO', image: '/Co-Founder.png' },
              { name: 'Akshit Bindhani', role: 'Creative Head & COO', image: '/creativehead.png' },
              { name: 'G. Siddharth', role: 'Product Manager', image: '/product.png' }
            ].map((member, index) => (
              <div key={index} className="flex flex-col items-center group cursor-default">
                <div className="w-full max-w-[110px] md:max-w-[140px] aspect-[4/5] rounded-2xl overflow-hidden mb-5 border border-white/5 bg-white/5 shadow-xl shadow-black/20 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-500">
                  <User size={40} className="text-white/20 group-hover:text-accent-yellow/50 group-hover:scale-110 transition-all duration-500" />
                </div>
                <h3 className="text-white font-bold text-lg md:text-xl">{member.name}</h3>
                <p className="text-[#8E909E] text-xs md:text-sm font-medium uppercase mt-1.5 tracking-wider">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUsPageClient;

