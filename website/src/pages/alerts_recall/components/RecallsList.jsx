import React from 'react'

export default function RecallsList({ recalls }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Initiated Recalls</h2>
      {recalls.length > 0 ? (
        <ul className="divide-y">
          {recalls.map((recall) => (
            <li key={recall.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-medium text-gray-900">Batch {recall.id} has been recalled</p>
                  <p className="text-sm text-gray-600">Reason: {recall.reason}</p>
                </div>
              </div>
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">Recalled</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm italic text-gray-500">No recalls have been initiated.</p>
      )}
    </div>
  )
}


