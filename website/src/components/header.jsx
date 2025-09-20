import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function NavGroup({ title, items }) {
  const [open, setOpen] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setOpen(false);
      setTimeoutId(null);
    }, 300); // 1 seconds delay
    setTimeoutId(id);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-100 hover:text-white">
        {title}
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-30">
          <div className="p-2">
            {items.map((it) => (
              <Link key={it.to} to={it.to} className="block px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100">
                <div className="font-medium">{it.label}</div>
                {it.desc && <div className="text-xs text-gray-500">{it.desc}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="inline-block h-6 w-6 rounded bg-indigo-500"></span>
            <span className="font-semibold">AYUSH Admin</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <NavGroup
              title="Dashboard & Monitoring"
              items={[
                { to: '/', label: 'Dashboard Page', desc: 'Overview of supply chain health' },
                { to: '/compliance', label: 'Batch Traceability & Monitoring', desc: 'Search/trace herbs with maps' },
              ]}
            />
            <NavGroup
              title="User & Role Control"
              items={[
                { to: '/users', label: 'User & Role Management', desc: 'Add/manage stakeholders' },
                { to: '/settings', label: 'Profile & Settings', desc: 'Permissions & configurations' },
              ]}
            />
            <NavGroup
              title="Compliance & Regulation"
              items={[
                { to: '/compliance', label: 'Compliance & Regulation', desc: 'Automated checks & standards' },
                { to: '/recall', label: 'Alerts & Recall Management', desc: 'Violations & recalls' },
              ]}
            />
            <NavGroup
              title="Reports & Insights"
              items={[
                { to: '/reports', label: 'Reports & Analytics', desc: 'Insights & analytics' },
                { to: '/incentives', label: 'Incentives & Funding', desc: 'Rewards & eco-bonuses' },
              ]}
            />
            <NavGroup
              title="Integration & Support"
              items={[
                { to: '/integration', label: 'Integration & API Management', desc: 'AYUSH Grid, A-HMIS, ERP' },
                { to: '/support', label: 'Support & Dispute Resolution', desc: 'Escalations & disputes' },
              ]}
            />
          </nav>
        </div>
      </div>
    </header>
  )
}


