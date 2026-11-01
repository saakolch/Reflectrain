'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/dump',
    label: 'Dump',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20z" />
      </svg>
    ),
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M12 3l8 4.6-8 4.6-8-4.6z" />
        <path d="M4 12.2l8 4.6 8-4.6" />
        <path d="M4 16.8l8 4.6 8-4.6" />
      </svg>
    ),
  },
  {
    href: '/plan',
    label: 'Plan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="4.5" />
        <path d="M8.5 12l2.6 2.6L16 9.6" />
      </svg>
    ),
  },
  {
    href: '/self',
    label: 'Self',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="8" r="3.6" />
        <path d="M5 20c1.4-3.9 3.9-5.9 7-5.9S17.6 16.1 19 20" />
      </svg>
    ),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="tabbar">
      <div className="inner">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href} className={active ? 'tab on' : 'tab'}>
              {tab.icon}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
