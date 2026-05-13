// src/data/mockData.js
export const batches = [
  {
    id: 'batch1',
    name: 'Herb Mix 001',
    herbType: 'Chamomile',
    status: 'Active',
    location: { lat: 51.505, lng: -0.09 },
    compliance: '100% Compliant',
    supplyChainHealth: 95,
    lastUpdated: '2024-06-20',
  },
  {
    id: 'batch2',
    name: 'Herb Mix 002',
    herbType: 'Lavender',
    status: 'Active',
    location: { lat: 51.51, lng: -0.1 },
    compliance: '90% Compliant',
    supplyChainHealth: 80,
    lastUpdated: '2024-06-18',
  },
  {
    id: 'batch3',
    name: 'Herb Mix 003',
    herbType: 'Peppermint',
    status: 'Inactive',
    location: { lat: 51.52, lng: -0.12 },
    compliance: '45% Compliant',
    supplyChainHealth: 45,
    lastUpdated: '2024-06-15',
  },
];

export const alerts = [
  {
    id: 'alert1',
    batchId: 'batch2',
    message: 'Compliance Warning - Check pesticide levels',
    severity: 'warning',
    reason: 'Pesticide residue exceeded limits during routine lab checks.',
    type: 'Contamination Detected',
  },
  {
    id: 'alert2',
    batchId: 'batch3',
    message: 'Compliance Failure - Batch quarantined',
    severity: 'error',
    reason: 'Unauthorized distribution detected outside geo-fenced region.',
    type: 'Geo-fence Violation',
  },
];