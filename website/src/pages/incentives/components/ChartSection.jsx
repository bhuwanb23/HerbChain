import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function ChartSection({ data }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Reward Distribution by Herb</h2>
      <div className="mt-4 flex h-[260px] w-full items-center justify-center">
        <Doughnut data={data} />
      </div>
    </div>
  )
}


