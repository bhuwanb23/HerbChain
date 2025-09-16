import { useMemo, useState } from 'react'
import { complianceBatches, complianceAlerts } from '../constants'

export function useComplianceMetrics() {
  const [selectedMetric, setSelectedMetric] = useState(null)

  const metrics = useMemo(() => {
    const totalBatches = complianceBatches.length
    const compliantBatches = complianceBatches.filter(b => b.compliance === '100% Compliant').length
    const activeViolations = complianceAlerts.length

    return {
      complianceRate: {
        key: 'complianceRate',
        value: totalBatches > 0 ? Number(((compliantBatches / totalBatches) * 100).toFixed(1)) : 0,
        label: 'Compliance Rate',
        suffix: '%',
        details: (
          <div>
            <p><strong>Total Compliant Batches:</strong> {compliantBatches}</p>
            <p><strong>Total Batches:</strong> {totalBatches}</p>
            <p>This metric shows the percentage of all batches that currently meet all compliance standards.</p>
          </div>
        ),
      },
      activeViolations: {
        key: 'activeViolations',
        value: activeViolations,
        label: 'Active Violations',
        details: (
          <div>
            <p><strong>Total Active Alerts:</strong> {activeViolations}</p>
            <p>These are batches flagged for issues like contamination or unauthorized distribution.</p>
          </div>
        ),
      },
      geoFenceZones: {
        key: 'geoFenceZones',
        value: 156,
        label: 'Geo-fence Zones',
        details: (
          <div>
            <p><strong>Total Monitored Zones:</strong> 156</p>
            <p>Number of geographical locations under active monitoring.</p>
          </div>
        ),
      },
      autoChecksToday: {
        key: 'autoChecksToday',
        value: 1248,
        label: 'Auto Checks Today',
        details: (
          <div>
            <p><strong>Total Automated Scans:</strong> 1248</p>
            <p>Automated checks performed on the supply chain today.</p>
          </div>
        ),
      },
    }
  }, [])

  return { metrics, selectedMetric, setSelectedMetric }
}


