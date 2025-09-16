// Compliance constants: mock data for batches and alerts

export const complianceBatches = [
  { id: 'HERB-ASH-001', name: 'Ashwagandha', compliance: '100% Compliant' },
  { id: 'HERB-TUL-002', name: 'Tulsi', compliance: 'Requires Review' },
  { id: 'HERB-TUR-003', name: 'Turmeric', compliance: '100% Compliant' },
  { id: 'HERB-GIL-004', name: 'Giloy', compliance: 'Violation' },
]

export const complianceAlerts = [
  { id: 1, batchId: 'HERB-GIL-004', severity: 'error', type: 'Contamination', reason: 'Heavy metal threshold exceeded' },
  { id: 2, batchId: 'HERB-TUL-002', severity: 'warn', type: 'Geo-fence', reason: 'Exited approved route near Prayagraj' },
]

export const ayushStandardsDefault = [
  { name: 'Manufacturing Standards', compliance: 85 },
  { name: 'Quality Control', compliance: 92 },
  { name: 'Documentation', compliance: 78 },
  { name: 'Safety Protocols', compliance: 96 },
  { name: 'Labeling Standards', compliance: 89 },
  { name: 'Storage Requirements', compliance: 81 },
]


