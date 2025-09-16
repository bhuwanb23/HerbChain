import { useCallback } from 'react'

export function useIntegrations() {
  const handleAction = useCallback((integration) => {
    if (integration.status === 'Connected') {
      alert(`Initiating data sync with ${integration.name}...`)
    } else if (integration.status === 'Not Configured') {
      alert(`Redirecting to ${integration.name} configuration page...`)
    } else if (integration.action === 'View Data') {
      alert(`Opening data view for ${integration.name}...`)
    }
  }, [])

  return { handleAction }
}


