<html><head></head><body>import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Award, 
  FileText,
  Activity,
  ChevronRight,
  Database,
  Cpu,
  Lock
} from 'lucide-react';interface Skill {
  name: string;
  category: 'technical' | 'certification';
}
interface Post {
  title: string;
  date: string;
  summary: string;
}
interface Bounty {
  target: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reward: string;
}
interface Member {
  id: string;
  codename: string;
  realName: string;
  speciality: string;
  bio: string;
  clearance: string;
  identity: string;
  avatar: string;
  skills: Skill[];
  posts: Post[];
  bounties: Bounty[];
}
type TabType = 'dossier' | 'writeups' | 'bounty';
const TEAM_DATA: Record<string, member=""> = {
  ghost: {
    id: 'ghost',
    codename: 'GHOST',
    realName: 'Alexander Vance',
    speciality: 'Lead Intrusion Architect',
    bio: 'Specializing in low-level kernel exploitation and custom C2 infrastructure. Focused on stealth operations and bypassing advanced EDR telemetry in hardened environments.',
    clearance: 'L-05',
    identity: 'KB-770',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&amp;w=400&amp;h=400&amp;auto=format&amp;fit=crop',
    skills: [
      { name: 'Kernel Exploitation', category: 'technical' },
      { name: 'C/C++', category: 'technical' },
      { name: 'x64 Assembly', category: 'technical' },
      { name: 'Win32 API', category: 'technical' },
      { name: 'OSCP', category: 'certification' },
      { name: 'CRTO', category: 'certification' },
      { name: 'OSEE', category: 'certification' }
    ],
    posts: [
      { title: "Bypassing EDR via custom RPC syscall redirection", date: "2024.10.15", summary: "Detailed analysis of hooking native APIs without triggering telemetry." },
      { title: "Mapping Shadow IT via passive DNS correlation", date: "2024.08.22", summary: "An automated approach to discovering forgotten cloud instances." }
    ],
    bounties: [
      { target: "Undisclosed_Enterprise", severity: "CRITICAL", reward: "$12,500" },
      { target: "Global_Fintech_Node", severity: "HIGH", reward: "$8,000" }
    ]
  },
  kobalt: {
    id: 'kobalt',
    codename: 'KOBALT',
    realName: 'Elena Markov',
    speciality: 'Cryptographic Analyst',
    bio: 'Expert in post-quantum cryptography and blockchain security. Former intelligence asset specializing in signal decryption and secure protocol design.',
    clearance: 'L-04',
    identity: 'KB-412',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&amp;w=400&amp;h=400&amp;auto=format&amp;fit=crop',
    skills: [
      { name: 'Quantum Cryptography', category: 'technical' },
      { name: 'Protocol Auditing', category: 'technical' },
      { name: 'Zero-Knowledge Proofs', category: 'technical' },
      { name: 'CISSP', category: 'certification' },
      { name: 'CISM', category: 'certification' }
    ],
    posts: [
      { title: "Quantum Resistance in Mesh Networks", date: "2024.11.02", summary: "Implementing NTRU-based key exchange in low-power IoT devices." },
      { title: "The Hidden Flaws of Zero-Knowledge Proofs", date: "2024.09.14", summary: "Identifying soundness gaps in recursive SNARK implementations." }
    ],
    bounties: [
      { target: "DeFi_Protocol_X", severity: "CRITICAL", reward: "$25,000" },
      { target: "Gov_Cloud_Secure", severity: "MEDIUM", reward: "$4,500" }
    ]
  },
  phantom: {
    id: 'phantom',
    codename: 'PHANTOM',
    realName: 'Jace Sterling',
    speciality: 'Red Team Operations',
    bio: 'Focused on physical security bypass and advanced social engineering. Specializes in multi-vector attacks combining hardware implants with cloud exploitation.',
    clearance: 'L-05',
    identity: 'KB-901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&amp;w=400&amp;h=400&amp;auto=format&amp;fit=crop',
    skills: [
      { name: 'Physical Bypass', category: 'technical' },
      { name: 'RF Analysis', category: 'technical' },
      { name: 'Cloud Infrastructure', category: 'technical' },
      { name: 'OSCE', category: 'certification' },
      { name: 'GXPN', category: 'certification' },
      { name: 'CRTP', category: 'certification' }
    ],
    posts: [
      { title: "Rogue AP Detection Bypassing", date: "2024.12.01", summary: "Utilizing beamforming to target specific internal workstations while avoiding sensors." },
      { title: "Badge Cloning: HID iClass Vulnerabilities", date: "2024.07.20", summary: "Extracting master keys from legacy readers via power analysis." }
    ],
    bounties: [
      { target: "Fortune_50_Tech", severity: "HIGH", reward: "$10,000" },
      { target: "Secure_Logistics_Co", severity: "CRITICAL", reward: "$15,000" }
    ]
  }
};
const Header = ({ 
  selectedId, 
  onSelect 
}: { 
  selectedId: string, 
  onSelect: (id: string) =&gt; void 
}) =&gt; {
  return (
    <header classname="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14">
<div classname="max-w-6xl mx-auto h-full px-8 flex items-center justify-between">
<div classname="flex items-center gap-3">
<div classname="w-2 h-2 rounded-full bg-[#00ff88]"></div>
<span classname="font-['JetBrains_Mono'] text-[10px] font-bold tracking-[0.2em] text-black">KIWIBIT // V4.0</span>
</div>
<nav classname="flex items-center gap-6">
          {Object.values(TEAM_DATA).map((member) =&gt; (
            <button =="" key="{member.id}" onclick="{()"> onSelect(member.id)}
              className="group relative"
            &gt;
              <div ${="" 'border-black="" 'border-gray-200="" 5'="" :="" ?="" border="" classname="{`w-8" duration-500="" grayscale="" group-hover:grayscale-0'="" group-hover:opacity-100="" h-8="" opacity-40="" overflow-hidden="" ring-2="" ring-black="" rounded-full="" selectedid="member.id" transition-all="" }`}="">
<img alt="{member.codename}" classname="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA94SQ225VvGnEk-bgeW26P0xatFXox6uc7r7u6yTTThPmBMNrAsuwSGwGSTLRNGKEbOgY0xBskvDalv4uiqPcxorwK8kSc9bEr5b96VR1Jzabkqtkn6DkhYPDE3NHX3nnB6gFEhqgbd0aVHAUAqh8sOVzVkPDtki3bK3UA8gEHT23aTenwECzhPCW23yVkLe6TRyZaHBI1sX6Wbgv5NfG5hUNnbCfZceOGTE4mXxzhR4y_2UN-3bV49VrQQSefNM0DGDuBwgJjRtHP"/>
</div>
              {selectedId === member.id &amp;&amp; (
                <motion.div classname="absolute -inset-1 rounded-full border border-[#00ff88] opacity-50 blur-[2px]" layoutid="activeGlow"></motion.div>
              )}
            </button>
          ))}
        </nav>
<div classname="flex items-center gap-4 text-[10px] font-['JetBrains_Mono'] text-gray-400">
<span classname="hidden md:inline uppercase tracking-widest">Node: Primary</span>
<span classname="text-black font-bold">127.0.0.1</span>
</div>
</div>
</header>
  );
};
const HeroSection = ({ member }: { member: Member }) =&gt; {
  return (
    <section classname="pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
<div classname="lg:col-span-7 space-y-6">
<div classname="space-y-1">
<span classname="font-['JetBrains_Mono'] text-[10px] text-gray-400 uppercase tracking-[0.4em] block">
            {member.speciality}
          </span>
<h1 classname="text-6xl md:text-7xl font-bold tracking-tighter text-black uppercase leading-none">
            {member.realName}
          </h1>
<div classname="flex items-center gap-4 pt-2">
<span classname="text-[#00ff88] font-['JetBrains_Mono'] text-xs font-bold tracking-[0.3em]">
              ID: {member.identity}
            </span>
<div classname="h-[1px] w-12 bg-gray-200"></div>
<span classname="text-gray-400 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
              Clearance: {member.clearance}
            </span>
</div>
</div>
<p classname="font-['Inter'] text-base text-gray-500 max-w-lg leading-relaxed">
          {member.bio}
        </p>
</div>
<div classname="lg:col-span-5 flex justify-end">
<div classname="relative w-64 h-64 md:w-80 md:h-80">
<div classname="absolute inset-0 border border-gray-100 translate-x-4 translate-y-4"></div>
<div classname="absolute inset-0 bg-gray-50 overflow-hidden border border-black/5">
<img alt="{member.codename}" classname="w-full h-full object-cover grayscale opacity-90 contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG2J84yPBhDTHRX1kJ_WuWPvGBsEg1LFHuEtc7N7t5XMQKczTexSGchXTj1rn4-qonckw4A4kgZjiCnlh1tHGIlx9sz61qpPkGEfDHNL7AEFLcnCPW6J96pfd5wyR2DqRKqh_mnknP2Js_MFp2_hEc51_sPPR1I2b2s0zjCGQFvKGI5V4i7Ctqy6GfKVSBYLzBqF2hdBXHAsX-VvrEtm-_vcHkWyVkbCNztxxiPCuRMWkhS1NP9cCCPqyc_4EkPl6E-oFL53ClZR5h"/>
</div>
<div classname="absolute top-0 left-0 p-4">
<div classname="bg-black text-white px-2 py-1 font-['JetBrains_Mono'] text-[9px] tracking-widest uppercase">
              {member.codename}
            </div>
</div>
</div>
</div>
</section>
  );
};
const App: React.FC = () =&gt; {
  const [selectedId, setSelectedId] = useState<string>('ghost');
  const [activeTab, setActiveTab] = useState<tabtype>('dossier');
  const member = useMemo(() =&gt; TEAM_DATA[selectedId], [selectedId]);
  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };
  return (
    <div classname="min-h-screen bg-white text-black font-['Inter'] selection:bg-[#00ff88] selection:text-black">
<header onselect="{setSelectedId}" selectedid="{selectedId}"></header>
<main classname="max-w-6xl mx-auto px-8 pb-32">
<animatepresence mode="wait">
<motion.div "circout"="" 0.4,="" animate="animate" duration:="" ease:="" exit="exit" initial="initial" key="{selectedId}" transition="{{" variants="{containerVariants}" }}="">
<herosection member="{member}"></herosection>
            {}
            <div classname="border-b border-gray-100 flex justify-center gap-12 mb-16">
              {(['dossier', 'writeups', 'bounty'] as const).map((tab) =&gt; (
                <button =="" key="{tab}" onclick="{()"> setActiveTab(tab)}
                  className={`pb-4 text-[10px] font-['JetBrains_Mono'] font-bold uppercase tracking-[0.3em] relative transition-colors ${
                    activeTab === tab ? 'text-black' : 'text-gray-300 hover:text-gray-500'
                  }`}
                &gt;
                  [ {tab} ]
                  {activeTab === tab &amp;&amp; (
                    <motion.div classname="absolute bottom-0 left-0 right-0 h-[2px] bg-black" layoutid="tabUnderline"></motion.div>
                  )}
                </button>
              ))}
            </div>
<div classname="min-h-[400px]">
<animatepresence mode="wait">
<motion.div -5="" 0="" 0,="" 0.3="" 1,="" 10="" animate="{{" duration:="" exit="{{" initial="{{" key="{`${selectedId}-${activeTab}`}" opacity:="" transition="{{" y:="" }}="">
                  {activeTab === 'dossier' &amp;&amp; (
                    <div classname="grid grid-cols-1 md:grid-cols-2 gap-16">
<div classname="space-y-8">
<div classname="flex items-center gap-3 border-b border-gray-100 pb-2">
<terminal size="{14}" strokewidth="{2.5}"></terminal>
<h3 classname="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest">Specialties</h3>
</div>
<div classname="grid gap-3">
                          {member.skills.filter(s =&gt; s.category === 'technical').map(skill =&gt; (
                            <div classname="flex items-center gap-4 group" key="{skill.name}">
<div classname="w-1 h-1 bg-gray-200 group-hover:bg-[#00ff88] transition-colors"></div>
<span classname="font-['JetBrains_Mono'] text-[11px] text-gray-500 uppercase">{skill.name}</span>
</div>
                          ))}
                        </div>
</div>
<div classname="space-y-8">
<div classname="flex items-center gap-3 border-b border-gray-100 pb-2">
<award size="{14}" strokewidth="{2.5}"></award>
<h3 classname="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest">Certifications</h3>
</div>
<div classname="flex flex-wrap gap-2">
                          {member.skills.filter(s =&gt; s.category === 'certification').map(cert =&gt; (
                            <span classname="px-3 py-1 bg-gray-50 border border-gray-100 font-['JetBrains_Mono'] text-[10px] font-bold" key="{cert.name}">
                              {cert.name}
                            </span>
                          ))}
                        </div>
</div>
</div>
                  )}
                  {activeTab === 'writeups' &amp;&amp; (
                    <div classname="max-w-3xl space-y-2">
                      {member.posts.map((post, i) =&gt; (
                        <div classname="group p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-all flex items-start gap-8" key="{i}">
<div classname="font-['JetBrains_Mono'] text-[10px] text-gray-300 pt-1">
                            {post.date}
                          </div>
<div classname="flex-1 space-y-2">
<h4 classname="text-base font-bold text-black group-hover:underline underline-offset-4 decoration-1">
                              {post.title}
                            </h4>
<p classname="text-sm text-gray-500 leading-relaxed font-['Inter']">
                              {post.summary}
                            </p>
</div>
<div classname="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
<chevronright size="{14}"></chevronright>
</div>
</div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'bounty' &amp;&amp; (
                    <div classname="overflow-hidden">

                          {member.bounties.map((b, i) =&gt; (
                            
                          ))}
                        <table classname="w-full border-collapse">
<thead>
<tr classname="border-b border-black/5">
<th classname="py-4 text-left font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-widest text-gray-400">Target</th>
<th classname="py-4 text-left font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-widest text-gray-400">Severity</th>
<th classname="py-4 text-right font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-widest text-gray-400">Reward</th>
</tr>
</thead>
<tbody classname="divide-y divide-gray-50"><tr classname="group hover:bg-gray-50/50 transition-colors" key="{i}">
<td classname="py-6 font-['JetBrains_Mono'] text-xs font-medium">{b.target}</td>
<td classname="py-6">
<span ${="" 'bg-black="" 'border="" :="" ?="" b.severity="CRITICAL" border-gray-200="" classname="{`text-[9px]" font-bold="" px-2="" py-0.5="" rounded-sm="" text-gray-400'="" text-white'="" }`}="">
                                  {b.severity}
                                </span>
</td>
<td classname="py-6 text-right font-['JetBrains_Mono'] text-xs font-bold text-black">
                                {b.reward}
                              </td>
</tr></tbody>
</table>
</div>
                  )}
                </motion.div>
</animatepresence>
</div>
</motion.div>
</animatepresence>
</main>
      {}
      <footer classname="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 h-10 flex items-center px-8 z-40">
<div classname="max-w-6xl mx-auto w-full flex justify-between items-center text-[9px] font-['JetBrains_Mono'] text-gray-400 uppercase tracking-widest">
<div classname="flex items-center gap-4">
<span classname="flex items-center gap-2">
<div classname="w-1 h-1 bg-[#00ff88] rounded-full"></div>
              Session: Active
            </span>
<span classname="hidden md:inline">Protocol: Secure_Intel_V4</span>
</div>
<div classname="flex items-center gap-6">
<span classname="hidden lg:flex items-center gap-2">
<shield size="{10}"></shield>
              Verified Operative Profile
            </span>
<span classname="text-black font-bold opacity-30">© 2024 Kiwibit</span>
</div>
</div>
</footer>
</div>
  );
};
export default App;</tabtype></string></string,></body></html>