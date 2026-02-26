 'use client';

 import React, { useEffect, useRef } from 'react';

 export default function Hero() {
     const canvasRef = useRef(null);

     useEffect(() => {
         const canvas = canvasRef.current;
         if (!canvas) return;

         const ctx = canvas.getContext('2d');
         if (!ctx) return;

         let width = window.innerWidth;
         let height = window.innerHeight;
         let rafId = null;

         const DPR = Math.max(window.devicePixelRatio || 1, 1);

         function resize() {
             width = window.innerWidth;
             height = window.innerHeight;
             canvas.style.width = width + 'px';
             canvas.style.height = height + 'px';
             canvas.width = Math.floor(width * DPR);
             canvas.height = Math.floor(height * DPR);
             ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
         }

         function setupGrid() {
             const cellSize = Math.max(28, Math.floor(Math.min(width, height) / 24));
             const cols = Math.ceil(width / cellSize);
             const rows = Math.ceil(height / cellSize);

             const cells = new Array(cols * rows).fill(0).map(() => ({
                 offset: Math.random() * Math.PI * 2,
                 flicker: Math.random() * 0.6 + 0.2,
             }));

             return { cellSize, cols, rows, cells };
         }

         function setupBinaryColumns() {
             return Array.from({ length: 80 }).map(() => ({
                 x: Math.random() * width,
                 y: Math.random() * height,
                 speed: 20 + Math.random() * 40,
             }));
         }

         let grid = setupGrid();
         let binaryColumns = setupBinaryColumns();

         function draw() {
             ctx.clearRect(0, 0, width, height);

             const t = performance.now() * 0.001;
             const { cellSize, cols, rows, cells } = grid;

             // =============================
             // GRID ORIGINAL (intacto)
             // =============================
             for (let y = 0; y < rows; y++) {
                 for (let x = 0; x < cols; x++) {
                     const idx = y * cols + x;
                     const c = cells[idx];
                     const px = x * cellSize;
                     const py = y * cellSize;

                     const base = ((x + y) % 2 === 0) ? 1 : 0;
                     const flick = 0.5 + Math.sin(t * 6 + c.offset) * 0.5 * c.flicker;
                     const mix = Math.min(Math.max(flick, 0), 1);
                     const isWhite = base ? (mix > 0.45) : (mix < 0.55);

                     ctx.fillStyle = isWhite
                         ? 'rgba(255,255,255,0.9)'
                         : 'rgba(0,0,0,0.9)';

                     ctx.fillRect(px, py, cellSize + 1, cellSize + 1);
                 }
             }

             // =============================
             // BINÁRIO SUAVE NO FUNDO
             // =============================
             ctx.save();
             ctx.globalAlpha = 0.07;
             ctx.font = '14px monospace';
             ctx.fillStyle = '#ffffff';

             binaryColumns.forEach(col => {
                 const binaryChar = Math.random() > 0.5 ? '0' : '1';

                 ctx.fillText(binaryChar, col.x, col.y);

                 col.y += col.speed * 0.016;

                 if (col.y > height) {
                     col.y = -20;
                     col.x = Math.random() * width;
                 }
             });

             ctx.restore();

             // =============================
             // SCANLINES SUTIS
             // =============================
             ctx.save();
             ctx.globalAlpha = 0.04;
             ctx.fillStyle = '#ffffff';
             for (let i = 0; i < height; i += 4) {
                 ctx.fillRect(0, i, width, 1);
             }
             ctx.restore();

             // =============================
             // GLITCH DISCRETO
             // =============================
             if (Math.random() > 0.985) {
                 const sliceY = Math.random() * height;
                 const sliceH = Math.random() * 20 + 5;

                 ctx.drawImage(
                     canvas,
                     0,
                     sliceY,
                     width,
                     sliceH,
                     Math.random() * 10 - 5,
                     sliceY,
                     width,
                     sliceH
                 );
             }

             rafId = requestAnimationFrame(draw);
         }

         function handleResize() {
             resize();
             grid = setupGrid();
             binaryColumns = setupBinaryColumns();
         }

         resize();
         window.addEventListener('resize', handleResize);
         rafId = requestAnimationFrame(draw);

         return () => {
             window.removeEventListener('resize', handleResize);
             if (rafId) cancelAnimationFrame(rafId);
         };
     }, []);

     return (
         <>
             <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden architectural-grid bg-black">

                 <canvas
                     ref={canvasRef}
                     className="absolute inset-0 w-full h-full pointer-events-none z-0"
                 />

                 <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-0"></div>

                 <div className="relative z-10 max-w-[1400px] mx-auto px-8 text-center">
                     <h1 className="text-white text-5xl md:text-[8rem] font-[900] leading-[0.8] tracking-tightest mb-16 uppercase">
                         KIWIBIT
                     </h1>

                     <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                         <button
                             className="w-full sm:w-auto bg-white text-black px-14 py-7 text-[11px] font-black uppercase tracking-ultra hover:bg-zinc-200 transition-colors"
                         >
                             Explore Services
                         </button>

                         <button
                             className="w-full sm:w-auto border border-white/10 px-14 py-7 text-[11px] font-bold uppercase tracking-ultra hover:border-white/40 transition-all text-white/50 hover:text-white"
                         >
                             View Portfolio
                         </button>
                     </div>
                 </div>
             </section>

             <div className="section-divider"></div>
         </>
     );
 }


                             function draw() {
