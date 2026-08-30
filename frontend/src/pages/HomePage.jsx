import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LifeBuoy, Sparkles, MessageSquare, BarChart3, ShieldCheck,
  BrainCircuit, Radio, Zap,
} from 'lucide-react'
import { appName, appTagline } from '../config/app'
import AiCore from '../components/ui/AiCore'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-assisted triage',
    text: 'Auto-suggested category, priority and summary for every incoming ticket before it reaches an agent.',
  },
  {
    icon: MessageSquare,
    title: 'Live conversation',
    text: 'Customers chat with their assigned agent inside a single persistent, searchable ticket thread.',
  },
  {
    icon: BarChart3,
    title: 'Data-driven dashboard',
    text: 'Dashboards and statistics built from real database data across the full NEW → ASSIGNED → IN_PROGRESS → RESOLVED flow.',
  },
]

const CODE_STATS = [
  { icon: Zap, label: 'AI triage', value: 'Real-time' },
  { icon: Radio, label: 'Live threads', value: 'WebSocket' },
  { icon: BrainCircuit, label: 'LLM core', value: 'OpenRouter' },
]

const heroVariants = {
  hidden: { opacity: 0, y: 34, filter: 'blur(8px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
}


export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <motion.span
            className="hero-badge"
            custom={0}
            variants={heroVariants}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.05 }}
          >
            <ShieldCheck size={14} /> Secure · Real-time · AI-powered
          </motion.span>

          <motion.h1
            className="hero-title neon-text"
            custom={1}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {appName}
          </motion.h1>

          <motion.p
            className="hero-role"
            custom={2}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {appTagline}
          </motion.p>

          <motion.p
            className="hero-bio"
            custom={3}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            A support ticketing system where AI drafts category, priority and
            summary — agents review and refine — and customers track everything
            in one place.
          </motion.p>

          <motion.div
            className="hero-core"
            custom={4}
            variants={heroVariants}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.03 }}
          >
            <AiCore size={320} />
          </motion.div>

          <motion.div
            className="hero-actions"
            custom={5}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            <Link to="/register" className="btn btn-primary">Get started</Link>
            <Link to="/login" className="btn btn-ghost">Sign in</Link>
          </motion.div>

          <motion.div
            className="code-stats"
            custom={6}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {CODE_STATS.map((c) => (
              <div key={c.label} className="code-stat glass">
                <c.icon size={16} />
                <span className="code-stat-label">{c.label}</span>
                <b className="code-stat-value">{c.value}</b>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title neon-text">Built for support teams</h2>
            <p className="section-sub">Everything tickets need, without the noise.</p>
          </motion.div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass feature"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                whileHover={{ y: -8 }}
              >
                <div className="service-icon"><f.icon size={24} /></div>
                <h3 className="service-title">{f.title}</h3>
                <p className="service-desc">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title neon-text">How tickets move</h2>
            <p className="section-sub">A clear workflow from first request to resolution.</p>
          </motion.div>
          <div className="flow-strip glass">
            {['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((step, i) => (
              <div key={step} className="flow-step">
                <span className="flow-step-badge badge badge-info">{step}</span>
                {i < 3 && (
                  <span className="flow-arrow">
                    <LifeBuoy size={16} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
