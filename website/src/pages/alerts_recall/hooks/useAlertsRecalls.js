import { useMemo } from 'react'
import { alertsData, recallsData } from '../constants'

export function useAlertsRecalls() {
  const criticalAlerts = useMemo(
    () => alertsData.filter(a => a.severity === 'warning' || a.severity === 'error'),
    []
  )

  const initiatedRecalls = useMemo(
    () => recallsData,
    []
  )

  return { criticalAlerts, initiatedRecalls }
}


