import React from 'react'

export default function StandardsGrid({ standards }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">AYUSH Standards Compliance</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
        {standards.map((std, idx) => (
          <div key={idx} className="flex flex-col">
            <p className="font-medium text-gray-900 mb-1">{std.name}</p>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${std.compliance}%` }} />
            </div>
            <span className="mt-1 text-right text-sm text-gray-500">{std.compliance}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}


