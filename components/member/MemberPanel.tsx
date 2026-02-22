'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Terminal } from 'lucide-react'

interface Skill {
  name: string
  category: 'technical' | 'certification'
}

interface Post {
  title: string
  date: string
  summary: string
}

interface Bounty {
  target: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  reward: string
}

interface Member {
  id: string
  codename: string
  realName: string
  speciality: string
  bio: string
  clearance: string
  identity: string
  avatar: string
  skills: Skill[]
  posts: Post[]
  bounties: Bounty[]
}

type TabType = 'dossier' | 'writeups' | 'bounty'

const TEAM_DATA: Record<string, Member> = {
  ghost: {
    id: 'ghost',
    codename: 'GHOST',
    realName: 'Alexander Vance',
    speciality: 'Lead Intrusion Architect',
    bio: 'Specializes in low-level kernel exploitation, custom C2 infrastructure, and stealth operations. Loves exploring obscure OS internals and bypassing advanced telemetry.',
    clearance: 'L-05',
    identity: 'KB-770',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop',
    skills: [
      { name: 'Kernel Exploitation', category: 'technical' },
      { name: 'C/C++', category: 'technical' },
      { name: 'x64 Assembly', category: 'technical' },
      { name: 'OSCP', category: 'certification' },
      { name: 'OSEE', category: 'certification' },
    ],
    posts: [
      {
        title: 'Bypassing EDR via RPC',
        date: '2024-10-15',
        summary: 'Hooking native APIs without triggering telemetry alerts in enterprise environments.',
      },
      {
        title: 'Advanced Kernel Exploit Techniques',
        date: '2024-08-22',
        summary: 'Exploring memory corruption exploits and bypassing modern mitigations.',
      },
    ],
    bounties: [
      { target: 'Undisclosed_Enterprise', severity: 'CRITICAL', reward: '$12,500' },
      { target: 'Global_Fintech_Node', severity: 'HIGH', reward: '$8,000' },
    ],
  },
  kobalt: {
    id: 'kobalt',
    codename: 'KOBALT',
    realName: 'Elena Markov',
    speciality: 'Cryptography Specialist',
    bio: 'Focused on post-quantum cryptography, blockchain security, and secure protocol design. Former intelligence asset with experience in signal decryption.',
    clearance: 'L-04',
    identity: 'KB-412',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop',
    skills: [
      { name: 'Quantum Cryptography', category: 'technical' },
      { name: 'Protocol Auditing', category: 'technical' },
      { name: 'CISSP', category: 'certification' },
      { name: 'CISM', category: 'certification' },
    ],
    posts: [
      {
        title: 'Quantum Resistant Protocols',
        date: '2024-11-02',
        summary: 'Implementation of NTRU-based key exchanges for low-power IoT devices.',
      },
      {
        title: 'Zero-Knowledge Proofs Analysis',
        date: '2024-09-14',
        summary: 'Examining soundness gaps in recursive SNARK implementations.',
      },
    ],
    bounties: [
      { target: 'DeFi_Protocol_X', severity: 'CRITICAL', reward: '$25,000' },
      { target: 'Gov_Cloud_Secure', severity: 'MEDIUM', reward: '$4,500' },
    ],
  },
}

function Header({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14">
      <div className="max-w-6xl mx-auto h-full px-8 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          {Object.values(TEAM_DATA).map((member) => (
            <button key={member.id} onClick={() => onSelect(member.id)} className="group relative">
              <div
                className={`w-10 h-10 rounded-full overflow-hidden ring-2 ring-black grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 ${
                  selectedId === member.id ? 'opacity-100' : ''
                }`}
              >
                <img src={member.avatar} alt={member.codename} className="w-full h-full object-cover" />
              </div>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function HeroSection({ member }: { member: Member }) {
  return (
    <section className="pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <span className="text-gray-400 uppercase tracking-widest">{member.speciality}</span>
        <h1 className="text-6xl font-bold uppercase">{member.realName}</h1>
        <p className="text-gray-500 max-w-lg">{member.bio}</p>
      </div>
      <div className="lg:col-span-5 flex justify-end">
        <img
          src={member.avatar}
          alt={member.codename}
          className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg border border-gray-200 shadow-lg"
        />
      </div>
    </section>
  )
}

export default function MemberPanel() {
  const [selectedId, setSelectedId] = useState<string>('ghost')
  const [activeTab, setActiveTab] = useState<TabType>('dossier')
  const member = useMemo(() => TEAM_DATA[selectedId], [selectedId])

  return (
    <div className="min-h-screen bg-white text-black font-inter">
      <Header selectedId={selectedId} onSelect={setSelectedId} />
      <main className="max-w-6xl mx-auto px-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <HeroSection member={member} />

            <div className="border-b border-gray-200 flex justify-center gap-8 mb-8 mt-8">
              {(['dossier', 'writeups', 'bounty'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 uppercase text-xs font-bold tracking-widest transition-colors ${
                    activeTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === 'dossier' && (
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="flex items-center gap-2 mb-2">
                        <Terminal size={16} /> Technical Skills
                      </h3>
                      <ul className="space-y-1">
                        {member.skills
                          .filter((skill) => skill.category === 'technical')
                          .map((skill) => (
                            <li key={skill.name} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span>{skill.name}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 mb-2">
                        <Award size={16} /> Certifications
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {member.skills
                          .filter((skill) => skill.category === 'certification')
                          .map((cert) => (
                            <li key={cert.name} className="px-3 py-1 bg-gray-100 rounded text-xs">
                              {cert.name}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'writeups' && (
                  <div className="space-y-4">
                    {member.posts.map((post) => (
                      <div key={post.title} className="p-4 border rounded hover:shadow transition">
                        <div className="text-xs text-gray-400">{post.date}</div>
                        <h4 className="font-bold text-lg">{post.title}</h4>
                        <p className="text-gray-600">{post.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'bounty' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 text-xs font-bold text-gray-500 uppercase">Target</th>
                          <th className="py-2 text-xs font-bold text-gray-500 uppercase">Severity</th>
                          <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Reward</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {member.bounties.map((bounty) => (
                          <tr key={bounty.target} className="hover:bg-gray-50 transition">
                            <td className="py-2">{bounty.target}</td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  bounty.severity === 'CRITICAL'
                                    ? 'bg-red-500 text-white'
                                    : bounty.severity === 'HIGH'
                                      ? 'bg-orange-400 text-white'
                                      : bounty.severity === 'MEDIUM'
                                        ? 'bg-yellow-300 text-black'
                                        : 'bg-gray-200 text-black'
                                }`}
                              >
                                {bounty.severity}
                              </span>
                            </td>
                            <td className="py-2 text-right font-bold">{bounty.reward}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
