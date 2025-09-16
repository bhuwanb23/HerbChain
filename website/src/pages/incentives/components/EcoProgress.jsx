import React from 'react'

export default function EcoProgress({ ecoProgress, ecoTarget, ecoProgressPercentage, onApply }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Eco-Incentive Progress</h2>
      <p className="mt-3 text-sm text-gray-700">We've rewarded {ecoProgress} out of our {ecoTarget} farmers who adopted sustainable practices this quarter.</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ecoProgressPercentage}%` }} />
      </div>
      <span className="mt-2 block text-right text-sm text-gray-500">{ecoProgressPercentage}% Complete</span>
      <button className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={onApply}>
        Apply for Eco-Bonus Scheme
      </button>
    </div>
  )
}


