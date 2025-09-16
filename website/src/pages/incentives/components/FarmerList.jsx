import React from 'react'

export default function FarmerList({ farmers, onDisburse }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Farmer List & Rewards</h2>
      <ul>
        {farmers.map((farmer) => (
          <li key={farmer.id} className="flex items-center justify-between border-b py-4 last:border-b-0">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">{farmer.name}</span>
              <span className="text-sm text-gray-600">{farmer.tokens} Tokens</span>
            </div>
            <div className="flex items-center gap-3">
              {farmer.ecoBonus && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">🌿 Eco-Bonus</span>}
              <button className="rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={() => onDisburse(farmer.name)}>
                Disburse
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}


