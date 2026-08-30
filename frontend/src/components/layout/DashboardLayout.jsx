import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import AppBackground from '../ui/AppBackground'
import { cx } from '../../lib/utils'


export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)
  const openMobile = () => setMobileOpen(true)

  
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <>
      <AppBackground density={0.7} speed={0.75} />
      <div className={cx('app-shell', collapsed && 'shell-collapsed', mobileOpen && 'shell-mobile-open')}>
        {mobileOpen && <div className="shell-backdrop" onClick={closeMobile} aria-hidden="true" />}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          onNavigate={closeMobile}
        />
        <div className="shell-main">
          <Header onOpenSidebar={openMobile} />
          <main className="shell-content">
            <div className="container">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}