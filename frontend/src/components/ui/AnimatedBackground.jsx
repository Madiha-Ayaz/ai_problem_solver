import { useEffect, useRef } from 'react'




export default function AnimatedBackground({ density = 1, speed = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const PALETTE = [
      [124, 108, 255],
      [33, 212, 253],
      [255, 107, 214],
      [255, 184, 77],
    ]

    let particles = []
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect?.()
      width = canvas.clientWidth || window.innerWidth
      height = canvas.clientHeight || window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initParticles()
    }

    function initParticles() {
      const count = Math.round((width * height) / 9000 * density)
      particles = Array.from({ length: Math.max(count, 40) }, () => ({
        x: (Math.random() - 0.5) * width * 1.4,
        y: (Math.random() - 0.5) * height * 1.4,
        z: (Math.random() - 0.5) * 1400,
        r: Math.random() * 1.8 + 0.6,
        vz: (Math.random() - 0.5) * 0.9 * speed,
        vx: (Math.random() - 0.5) * 0.35 * speed,
        vy: (Math.random() - 0.5) * 0.35 * speed,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        tw: Math.random() * Math.PI * 2,
      }))
    }

    function link(p1, p2, d) {
      const alpha = (1 - d / 220) * 0.55
      ctx.strokeStyle = `rgba(140, 130, 255, ${alpha})`
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(p1.sx, p1.sy)
      ctx.lineTo(p2.sx, p2.sy)
      ctx.stroke()
    }

    function frame(t) {
      const cx = width / 2
      const cy = height / 2
      const rot = t * 0.00006 * speed

      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04

      ctx.clearRect(0, 0, width, height)

      
      for (const p of particles) {
        p.tw += 0.02 * speed
        p.x += p.vx
        p.y += p.vy * Math.sin(p.tw)
        p.z += p.vz
        if (p.z > 700) p.z = -700
        if (p.z < -700) p.z = 700

        
        if (p.x > width * 0.8) p.x = -width * 0.8
        if (p.x < -width * 0.8) p.x = width * 0.8
        if (p.y > height * 0.8) p.y = -height * 0.8
        if (p.y < -height * 0.8) p.y = height * 0.8

        const cosR = Math.cos(rot)
        const sinR = Math.sin(rot)
        const rx = p.x * cosR - p.z * sinR
        const rz = p.x * sinR + p.z * cosR

        
        
        
        
        const persp = Math.max(0, Math.min(900 / (900 + rz), 1))
        p.sx = cx + rx * persp
        p.sy = cy + p.y * persp
        p.s = persp
      }

      
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.sx - b.sx
          const dy = a.sy - b.sy
          const d = dx * dx + dy * dy
          if (d < 200 * 200) link(a, b, Math.sqrt(d))
        }
      }

      
      for (const p of particles) {
        const radius = p.r * (p.s || 0)
        if (!(radius > 0)) continue
        const [r, g, b] = p.c
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.002 * speed + p.tw)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + 0.5 * pulse})`
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    function onPointer(e) {
      const rect = canvas.getBoundingClientRect()
      mouse.tx = e.clientX - rect.left
      mouse.ty = e.clientY - rect.top
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [density, speed])

  return (
    <canvas
      ref={canvasRef}
      className={`animated-bg-canvas ${className}`}
      aria-hidden="true"
    />
  )
}
