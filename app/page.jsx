import Header from '@/components/home/Header.jsx'
import Hero from '@/components/home/Hero.jsx'
import About from '@/components/home/About.jsx'
import Projects from '@/components/home/Projects.jsx'
import Blog from '@/components/home/Blog.jsx'
import Team from '@/components/home/Team.jsx'
import Footer from '@/components/home/Footer.jsx'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Blog />
        <Team />
      </main>
      <Footer />
    </>
  )
}
