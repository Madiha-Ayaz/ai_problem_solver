import AnimatedBackground from './AnimatedBackground'




export default function AppBackground({ density = 1, speed = 1 }) {
  return (
    <>
      <div className="bg-aurora" aria-hidden="true">
        <span className="bg-blob blob-a" />
        <span className="bg-blob blob-b" />
        <span className="bg-blob blob-c" />
        <span className="bg-blob blob-d" />
      </div>
      <div className="bg-grid" aria-hidden="true" />
      <AnimatedBackground density={density} speed={speed} />
      <div className="bg-grain" aria-hidden="true" />
    </>
  )
}
