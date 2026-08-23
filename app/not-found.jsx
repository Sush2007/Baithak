"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredDigit, setHoveredDigit] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate normalized mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Function to render a 3D isometric character
  const render3DDigit = (char, index) => {
    const isHovered = hoveredDigit === index;
    // Base rotation for isometric view + mouse parallax
    // We add mouse.y to rotateX and mouse.x to rotateZ for a nice effect
    const rotateX = 55 + (mousePosition.y * 15);
    const rotateZ = -45 + (mousePosition.x * 15);
    
    // Lift up if hovered
    const translateZ = isHovered ? 50 : 0;
    
    return (
      <div 
        className="relative font-black cursor-pointer transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) translateZ(${translateZ}px)`,
          fontSize: 'clamp(100px, 20vw, 300px)', // huge font size
          lineHeight: 0.8
        }}
        onMouseEnter={() => setHoveredDigit(index)}
        onMouseLeave={() => setHoveredDigit(null)}
      >
        {[...Array(40)].map((_, i) => {
           const isFront = i === 0;
           const isBack = i === 39;
           return (
             <span 
               key={i} 
               className="absolute inset-0 pointer-events-none flex items-center justify-center"
               style={{ 
                 transform: `translateZ(${-i}px)`,
                 color: isFront ? '#FFD100' : '#C49A00',
                 WebkitTextStroke: isFront ? '1px #FFD100' : '1px #B88500',
                 textShadow: isBack ? '-30px 30px 40px rgba(0,0,0,0.8)' : 'none',
                 zIndex: 40 - i
               }}
             >
               {char}
             </span>
           );
        })}
        {/* Invisible spacer for layout */}
        <span className="invisible flex items-center justify-center">{char}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111936] flex flex-col relative overflow-hidden font-sans select-none text-white perspective-[1000px]">
      
      

      {/* Abstract dotted line Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,300 C200,100 400,500 800,200 S 1200,600 1600,100" fill="none" stroke="#52D3FF" strokeWidth="2" strokeDasharray="5, 10" />
        <path d="M-100,600 C300,800 600,200 1000,500 S 1400,200 1800,400" fill="none" stroke="#52D3FF" strokeWidth="2" strokeDasharray="5, 10" />
        <path d="M-100,100 C400,50 500,700 1000,300 S 1500,800 1900,200" fill="none" stroke="#254382" strokeWidth="2" strokeDasharray="5, 10" />
        <path d="M800,900 C1000,700 1200,1100 1600,800 S 2000,1200 2400,700" fill="none" stroke="#254382" strokeWidth="2" strokeDasharray="5, 10" />
      </svg>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center p-8 z-20 pl-16 md:pl-28">
        <div className="font-bold tracking-widest text-sm text-white uppercase"><Image src="/logo.png" alt="Logo" width={500} height={500} className="w-24 h-24 md:w-32 md:h-32 object-contain" /></div>
        <div className="w-8 h-6 flex flex-col justify-between cursor-pointer group">
        
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-8 sm:px-24 pt-20">
        
        {/* 3D Interactive 404 */}
        <div className="flex gap-4 md:gap-12 mb-32 md:mb-0 md:absolute md:top-[45%] md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2" style={{ perspective: '1500px' }}>
          {render3DDigit('4', 0)}
          {render3DDigit('0', 1)}
          {render3DDigit('4', 2)}
        </div>

        {/* Text and Buttons (positioned at bottom like image) */}
        <div className="md:absolute md:bottom-16 w-full max-w-6xl flex flex-col md:flex-row justify-between items-end pb-8">
          
          <div className="flex flex-col items-start space-y-2 mb-8 md:mb-0 ml-10">
            <h1 className="text-5xl md:text-7xl font-light text-white tracking-wide transition-transform hover:translate-x-2 duration-300">
              Oops!
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-light max-w-md">
              We can't find the page you're looking for
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 ml-10 md:ml-0">
            <Link 
              href="/"
              className="px-8 py-3.5 bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-full font-medium transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,102,255,0.6)] text-center text-sm tracking-wide"
            >
              Go back to Dashboard
            </Link>
            <Link 
              href="mailto:baithak.support@gmail.com"
              className="px-8 py-3.5 bg-transparent border border-white/20 hover:border-white text-white rounded-full font-medium transition-all hover:bg-white/10 text-center text-sm tracking-wide"
            >
              Contact Support
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
