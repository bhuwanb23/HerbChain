export const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'turmeric', label: 'Turmeric' },
  { id: 'ginger', label: 'Ginger' },
  { id: 'ashwagandha', label: 'Ashwagandha' },
  { id: 'approved', label: 'Approved' },
];

export const AVAILABLE_HERBS = [
  {
    id: 'TUR2024001',
    name: 'Organic Turmeric',
    farmer: 'Kerala Farms, Kochi',
    weight: '250kg',
    status: 'Approved',
    certifications: ['Organic Certified', 'FSSAI Approved', 'ISO 22000'],
    temperature: '18°C',
    humidity: '45%',
    origin: 'Kerala, India',
    harvestDate: '2024-01-15',
  },
  {
    id: 'GIN2024002',
    name: 'Fresh Ginger',
    farmer: 'Himalayan Herbs, Shimla',
    weight: '180kg',
    status: 'Approved',
    certifications: ['Organic Certified'],
    temperature: '16°C',
    humidity: '50%',
    origin: 'Himachal Pradesh, India',
    harvestDate: '2024-01-20',
  },
  {
    id: 'ASH2024003',
    name: 'Ashwagandha Root',
    farmer: 'Rajasthan Organics, Jaipur',
    weight: '320kg',
    status: 'Approved',
    certifications: ['Organic Certified', 'GAP Certified'],
    temperature: '20°C',
    humidity: '40%',
    origin: 'Rajasthan, India',
    harvestDate: '2024-01-22',
  },
  {
    id: 'TUL2024004',
    name: 'Holy Basil (Tulsi)',
    farmer: 'Gujarat Herbs, Ahmedabad',
    weight: '95kg',
    status: 'Approved',
    certifications: [],
    temperature: '19°C',
    humidity: '48%',
    origin: 'Gujarat, India',
    harvestDate: '2024-01-25',
  },
];

export const ORDERED_HERBS_MOCK = [
  // Initially empty or can have some mock data if needed
];

export const SCANNED_HERB_DETAILS_MOCK = [
  {
    id: 'SCN2024001',
    name: 'Scanned Turmeric Batch',
    farmer: 'Random Farms',
    weight: '100kg',
    status: 'Certified',
    certifications: ['Organic'],
    temperature: '20°C',
    humidity: '50%',
    origin: 'India',
    harvestDate: '2024-01-01',
  }
];