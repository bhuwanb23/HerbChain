import React from 'react'

export default function MetricDetailModal({ title, content, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[90%] max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="text-gray-700 leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  )
}


