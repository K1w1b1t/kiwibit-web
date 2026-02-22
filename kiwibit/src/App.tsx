import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Award, ChevronRight, Shield } from 'lucide-react'

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
  status: 'REWARDED' | 'PENDING' | 'DISCLOSED'
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

type TabType = 'proficiency' | 'writeups' | 'bounty'

const OPERATIVES: Record<string, Member> = {
  member1: {
    id: 'member1',
    codename: 'ALPHA',
    realName: 'John Doe',
    speciality: 'Cybersecurity Specialist',
    bio: 'Experienced in network penetration testing and ethical hacking.',
    clearance: 'L-01',
    identity: 'ID-001',
    avatar: 'https://via.placeholder.com/80',
    skills: [
      { name: 'JavaScript', category: 'technical' },
      { name: 'React', category: 'technical' },
      { name: 'TypeScript', category: 'technical' },
      { name: 'OSCP', category: 'certification' },
      { name: 'CEH', category: 'certification' },
    ],
    posts: [
      {
        title: 'Intro to Web Pentesting',
        date: '2026-01-01',
        summary: 'Basics of finding vulnerabilities in web apps.',
      },
      {
        title: 'Advanced Recon Techniques',
        date: '2026-02-10',
        summary: 'Using automated and manual methods to map networks.',
      },
    ],
    bounties: [
      { target: 'Company X', severity: 'HIGH', status: 'REWARDED' },
      { target: 'Platform Y', severity: 'MEDIUM', status: 'PENDING' },
    ],
  },
}

const MemberHeader = ({
  selectedMember,
  onSelect,
}: {
  selectedMember: string
  onSelect: (id: string) => void
}) => (
  <header className="fixed top-0 z-50 w-full border-b-[0.5px] border-white/20 bg-black/90 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white/80"></div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
          Generic Intel Dashboard
        </span>
      </div>

      <nav className="flex items-center gap-8">
        {Object.values(OPERATIVES).map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.id)}
            className={`group flex items-center gap-3 transition-all duration-300 ${
              selectedMember === member.id
                ? 'opacity-100'
                : 'opacity-40 hover:opacity-80'
            }`}
          >
            <div
              className={`h-8 w-8 overflow-hidden rounded-full border-[0.5px] p-0.5 transition-colors ${
                selectedMember === member.id ? 'border-white' : 'border-white/20'
              }`}
            >
              <img
                className="h-full w-full object-cover grayscale group-hover:grayscale-0"
                src={member.avatar}
                alt={member.codename}
              />
            </div>
            <div className="flex flex-col items-start font-mono">
              <span
                className={`text-[10px] font-bold tracking-widest ${
                  selectedMember === member.id ? 'text-white' : 'text-white/60'
                }`}
              >
                {member.codename}
              </span>
              <span className="text-[7px] uppercase opacity-40">
                {selectedMember === member.id ? 'Selected' : 'Standby'}
              </span>
            </div>
          </button>
        ))}
      </nav>

      <div className="hidden items-center gap-4 font-mono lg:flex">
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-30">
          Node State:
        </span>
        <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white">
          <Activity size={12} className="animate-pulse" /> ACTIVE
        </span>
      </div>
    </div>
  </header>
)

const OperativeHero = ({ member }: { member: Member }) => (
  <section className="mb-16 space-y-8 pt-32 text-center">
    <div className="inline-flex items-center gap-2 rounded-full border-[0.5px] border-white/20 bg-white/5 px-4 py-1.5">
      <Shield size={11} className="text-white/50" />
      <span className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-60">
        {member.speciality}
      </span>
    </div>
    <h1 className="text-4xl font-bold uppercase tracking-tighter">{member.realName}</h1>
    <p className="font-mono text-[10px] uppercase tracking-[0.5em] opacity-70">
      Codename: {member.codename}
    </p>
    <p className="mx-auto max-w-xl font-mono text-sm leading-relaxed text-white/50">
      {member.bio}
    </p>
    <div className="mx-auto flex max-w-md items-center justify-center gap-10 border-y border-white/10 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
      <span>Clearance {member.clearance}</span>
      <span>Identity {member.identity}</span>
    </div>
  </section>
)

const TabNavigation = ({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'proficiency', label: 'Proficiency' },
    { id: 'writeups', label: 'Write-Ups' },
    { id: 'bounty', label: 'Bug Bounty' },
  ]

  return (
    <div className="mb-12 flex justify-center gap-12 border-b-[0.5px] border-white/20">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative pb-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${
            activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          [{tab.label}]
        </button>
      ))}
    </div>
  )
}

const ProficiencyView = ({ skills }: { skills: Skill[] }) => {
  const technical = skills.filter((skill) => skill.category === 'technical')
  const certs = skills.filter((skill) => skill.category === 'certification')

  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
      <div>
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          Technical Stack
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {technical.map((skill) => (
            <span
              key={skill.name}
              className="cursor-default border-[0.5px] border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/80"
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          <Award size={14} /> Certifications
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {certs.map((cert) => (
            <span
              key={cert.name}
              className="border-[0.5px] border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
            >
              {cert.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const WriteUpsView = ({ posts }: { posts: Post[] }) => (
  <div className="space-y-4">
    {posts.map((post) => (
      <div
        key={post.title}
        className="group cursor-pointer border-[0.5px] border-white/20 bg-white/[0.02] p-6 font-mono transition-all hover:border-white/50"
      >
        <div className="mb-3 flex items-start justify-between">
          <h4 className="text-sm font-bold transition-colors group-hover:text-white">
            {post.title}
          </h4>
          <span className="text-[9px] tracking-widest text-white/30">{post.date}</span>
        </div>
        <p className="max-w-2xl text-[11px] leading-relaxed text-white/50">{post.summary}</p>
        <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[8px] uppercase tracking-widest text-white">
            Access Document
          </span>
          <ChevronRight size={10} className="text-white" />
        </div>
      </div>
    ))}
  </div>
)

const BugBountyView = ({ bounties }: { bounties: Bounty[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse font-mono text-[10px] text-left">
      <thead>
        <tr className="border-b-[0.5px] border-white/20">
          <th className="px-2 py-5 font-bold uppercase tracking-widest text-white/50">
            Target Node
          </th>
          <th className="py-5 font-bold uppercase tracking-widest text-white/50">
            Vector Severity
          </th>
          <th className="px-2 py-5 text-right font-bold uppercase tracking-widest text-white/50">
            Validation Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y-[0.5px] divide-white/20">
        {bounties.map((bounty) => (
          <tr key={`${bounty.target}-${bounty.status}`} className="group transition-colors hover:bg-white/[0.02]">
            <td className="px-2 py-5 font-medium transition-colors group-hover:text-white">
              {bounty.target}
            </td>
            <td className="py-5">
              <span
                className={`rounded-sm px-2 py-0.5 text-[8px] ${
                  bounty.severity === 'CRITICAL' ? 'text-white' : 'text-white/70'
                }`}
              >
                {bounty.severity}
              </span>
            </td>
            <td className="px-2 py-5 text-right font-bold tracking-widest text-white">
              {bounty.status}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const App = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('member1')
  const [activeTab, setActiveTab] = useState<TabType>('proficiency')

  const member = useMemo(() => OPERATIVES[selectedMemberId], [selectedMemberId])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 selection:text-black">
      <MemberHeader
        onSelect={setSelectedMemberId}
        selectedMember={selectedMemberId}
      />
      <main className="mx-auto max-w-4xl px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMemberId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <OperativeHero member={member} />
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedMemberId}-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[400px]"
              >
                {activeTab === 'proficiency' && <ProficiencyView skills={member.skills} />}
                {activeTab === 'writeups' && <WriteUpsView posts={member.posts} />}
                {activeTab === 'bounty' && <BugBountyView bounties={member.bounties} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
