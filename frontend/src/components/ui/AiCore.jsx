import { useEffect, useRef } from 'react'




export default function AiCore({ size = 340, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const N = 260
    const GAUSS = (Math.sqrt(5) + 1) / 2
    const points = []
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = 2 * Math.PI * i / GAUSS
      points.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
      })
    }

    
    const orbits = []
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 40; j++) {
        const a = (j / 40) * Math.PI * 2
        orbits.push({ tilt: i / 3, a, r: 1.25 + i * 0.16 })
      }

    function frame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2 / dpr
      const cy = canvas.height / 2 / dpr
      const R = size / 2

      const rx = t * 0.00025
      const ry = t * 0.0004
      const rz = t * 0.00015

      const cosX = Math.cos(rx), sinX = Math.sin(rx)
      const cosY = Math.cos(ry), sinY = Math.sin(ry)
      const cosZ = Math.cos(rz), sinZ = Math.sin(rz)

      const rotate = (p) => {
        let x = p.x, y = p.y, z = p.z
        let y1 = y * cosX - z * sinX
        let z1 = y * sinX + z * cosX
        y = y1; z = z1
        let x1 = x * cosY + z * sinY
        let z2 = -x * sinY + z * cosY
        x = x1; z = z2
        let x2 = x * cosZ - y * sinZ
        let y2 = x * sinZ + y * cosZ
        return { x: x2, y: y2, z }
      }

      
      ctx.save()
      ctx.translate(cx, cy)
      const grad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.45)
      grad.addColorStop(0, 'rgba(124,108,255,0.16)')
      grad.addColorStop(0.5, 'rgba(33,212,253,0.05)')
      grad.addColorStop(1, 'rgba(124,108,255,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.45, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      
      for (const o of orbits) {
        const rad = R * o.r
        const pts = []
        for (let j = 0; j <= 40; j++) {
          const a = o.a + j / 40 * Math.PI * 2
          const p = rotate({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.18, z: o.tilt === 1 ? Math.sin(a) * rad * 0.6 : Math.cos(a) * rad * 0.55 })
          pts.push({ x: p.x, y: p.y, z: p.z })
        }
        for (let j = 0; j < pts.length; j++) {
          const p = pts[j]
          const persp = 900 / (900 + p.z)
          const sx = cx + p.x * persp
          const sy = cy + p.y * persp
          ctx.strokeStyle = `rgba(150,140,255,${0.2 * persp})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      
      const sorted = points
        .map((p) => ({ ...rotate(p), base: p }))
        .sort((a, b) => a.z - b.z)
      for (const p of sorted) {
        const persp = 900 / (900 + p.z * R * 0.8)
        const sx = cx + p.x * R * persp
        const sy = cy + p.y * R * persp
        const depth = (p.z + 1) / 2
        const sizeP = 1 + depth * 2.2
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.004 + p.base.x * 10)
        ctx.fillStyle = `rgba(190, 130, 255, ${0.5 + depth * 0.5})`
        ctx.beginPath()
        ctx.arc(sx, sy, sizeP * persp, 0, Math.PI * 2)
        ctx.fill()
        if (depth > 0.75) {
          ctx.strokeStyle = `rgba(33,212,253,${0.5})`
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.arc(sx, sy, (sizeP + 2) * persp, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      raf = requestAnimationFrame(frame)
    }

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      className={`ai-core-canvas ${className}`}
      aria-hidden="true"
    />
  )
}
