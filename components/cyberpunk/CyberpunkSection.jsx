'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CyberpunkSection() {
    const canvasRef = useRef(null);

    // Código C/C++ para renderizar como overlay
    const codeSnippets = [
        'int main() { return 0; }',
        '#define MAX_THREADS 256',
        'void* encrypt(char* data) {}',
        'if (status == CRITICAL) {}',
        'malloc(sizeof(kernel_t));',
        'struct cipher { uint8_t key[32]; };',
        'for (int i = 0; i < len; i++) {}',
        'uint64_t hash = compute_hash(ptr);',
        'memcpy(buffer, encrypted, 512);',
        'pthread_create(&thread_id, NULL);',
        'if (verify_signature(msg)) {}',
        '#include <openssl/crypto.h>',
        'unsigned char iv[16];',
        'AES_KEY aes_key;',
        'EVP_Cipher* cipher = EVP_aes_256();',
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Code elements floating
        const codeElements = codeSnippets.map((code, index) => ({
            text: code,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.15 + 0.03,
            layer: index % 3, // 3 layers
        }));

        const fontSize = 12;
        const fontFamily = '"Courier New", monospace';
        let animationFrameId;
        let time = 0;

        function animate() {
            time++;

            // Deep black background
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle animated grid
            ctx.strokeStyle = 'rgba(0, 255, 100, 0.03)';
            ctx.lineWidth = 0.5;
            const gridSize = 100;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw horizontal scan lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            for (let y = 0; y < canvas.height; y += 2) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw vertical digital lines (scanning effect)
            if (time % 10 === 0) {
                const lineX = (time / 100) % canvas.width;
                const gradient = ctx.createLinearGradient(lineX - 50, 0, lineX + 50, 0);
                gradient.addColorStop(0, 'rgba(0, 255, 100, 0)');
                gradient.addColorStop(0.5, 'rgba(0, 255, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(lineX, 0);
                ctx.lineTo(lineX, canvas.height);
                ctx.stroke();
            }

            // Draw floating code elements
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = '#00ff64';

            codeElements.forEach((element) => {
                // Update position with drift
                element.x += element.vx;
                element.y += element.vy;

                // Wrap around
                if (element.x < -200) element.x = canvas.width + 200;
                if (element.x > canvas.width + 200) element.x = -200;
                if (element.y < -50) element.y = canvas.height + 50;
                if (element.y > canvas.height + 50) element.y = -50;

                // Layer-based opacity
                const baseOpacity = element.opacity;
                const layerOpacity = 0.05 + element.layer * 0.04;
                const finalOpacity = baseOpacity * (0.7 + Math.sin(time * 0.005 + element.layer) * 0.3);

                ctx.globalAlpha = Math.min(layerOpacity, finalOpacity);

                // Random glitch effect
                if (Math.random() > 0.98) {
                    ctx.globalAlpha *= 0.5;
                    ctx.fillText(element.text, element.x + 2, element.y + 2);
                    ctx.globalAlpha *= 0.8;
                }

                ctx.fillText(element.text, element.x, element.y);
            });

            // Random interference blocks
            if (Math.random() > 0.92) {
                const glitchY = Math.random() * canvas.height;
                const glitchHeight = Math.random() * 40 + 10;
                ctx.fillStyle = 'rgba(0, 255, 100, 0.05)';
                ctx.fillRect(0, glitchY, canvas.width, glitchHeight);
            }

            ctx.globalAlpha = 1;
            animationFrameId = requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Card animation
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut',
            },
        },
    };

    const titleVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delay: 0.3,
                duration: 0.6,
            },
        },
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
            {/* Canvas background with code overlay */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-0"
                style={{ display: 'block' }}
            ></canvas>

            {/* Main content card */}
            <motion.div
                className="relative z-10 max-w-2xl mx-auto px-8"
                initial="hidden"
                whileInView="visible"
                variants={cardVariants}
            >
                <div className="backdrop-blur-md bg-black/40 border border-cyan-500/30 rounded-lg p-12 shadow-2xl hover:border-cyan-500/60 transition-colors duration-300 glitch-border">
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 pointer-events-none"></div>

                    {/* Content */}
                    <div className="relative">
                        <motion.h2
                            className="text-4xl font-bold text-white mb-6 font-mono glitch-text"
                            variants={titleVariants}
                        >
                            SYSTEM.ACTIVE
                        </motion.h2>

                        <motion.p
                            className="text-cyan-100/80 text-lg leading-relaxed font-mono mb-8"
                            variants={titleVariants}
                        >
                            <span className="inline-block">
                                {`> Monitoramento de segurança em tempo real`}
                                <span className="inline-block w-2 h-6 ml-1 bg-cyan-400 animate-pulse"></span>
                            </span>
                        </motion.p>

                        <motion.div
                            className="space-y-2 text-sm text-cyan-300/70 font-mono mb-8"
                            variants={titleVariants}
                        >
                            <p>$ status: online</p>
                            <p>$ encryption: AES-256</p>
                            <p>$ threads: 512 active</p>
                            <p>{`$ latency: <1ms`}</p>
                        </motion.div>

                        <motion.button
                            className="px-8 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-500/50 text-cyan-300 font-mono rounded hover:from-cyan-500/30 hover:to-cyan-500/20 hover:border-cyan-400 transition-all duration-300 glitch-button"
                            variants={titleVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            INITIALIZE_ACCESS
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
