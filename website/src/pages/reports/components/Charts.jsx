import React from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function Charts({ herbTypeData, complianceHistoryData, supplyChainHealthData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-3">Herb Type Distribution</h3>
        <div className="mt-4 flex h-[260px] items-center justify-center">
          <Doughnut data={herbTypeData} />
        </div>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-3">Compliance Trends</h3>
        <div className="mt-4 flex h-[260px] items-center justify-center">
          <Bar data={complianceHistoryData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-3">Supply Chain Health Breakdown</h3>
        <div className="mt-4 flex h-[260px] items-center justify-center">
          <Doughnut data={supplyChainHealthData} />
        </div>
      </div>
    </div>
  )
}


