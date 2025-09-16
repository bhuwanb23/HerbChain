import React from 'react'

export default function Insights({ onInvestigate, onDisburse }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-3">Actionable Insights</h3>
      <div className="flex items-center justify-between border-b py-4">
        <p className="flex items-center gap-2 text-gray-800"><span>⚠️</span> Geo-fence violations increased by 15% in Tamil Nadu last quarter.</p>
        <button className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100" onClick={onInvestigate}>Investigate</button>
      </div>
      <div className="flex items-center justify-between py-4">
        <p className="flex items-center gap-2 text-gray-800"><span>💰</span> Over ₹50 lakhs in incentives are pending disbursement.</p>
        <button className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100" onClick={onDisburse}>Disburse Now</button>
      </div>
    </div>
  )
}


