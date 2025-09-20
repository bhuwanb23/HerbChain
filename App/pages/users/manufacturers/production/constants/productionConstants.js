export const HERB_OPTIONS = [
  {
    id: 'turmeric',
    name: 'Turmeric (Curcuma longa)',
    batch: 'TUR-2024-001',
    certified: true,
  },
  {
    id: 'ginger',
    name: 'Ginger (Zingiber officinale)',
    batch: 'GIN-2024-003',
    certified: true,
  },
  {
    id: 'ashwagandha',
    name: 'Ashwagandha (Withania somnifera)',
    batch: 'ASH-2024-002',
    certified: true,
  },
  {
    id: 'holy_basil',
    name: 'Holy Basil (Ocimum tenuiflorum)',
    batch: 'HB-2024-001',
    certified: true,
  },
];

export const PROCESSING_METHODS = [
  'Select processing method',
  'Cold Extraction',
  'Steam Distillation',
  'Powder Blend',
  'Tincture',
];

export const TRACEABILITY_SUMMARY_DATA = {
  totalHerbs: '4 varieties',
  processingMethod: 'Cold Extraction',
  certification: '100% Organic',
  created: 'Today, 2:45 PM',
};

export const QR_CODE_IMAGE_URL = 'https://storage.googleapis.com/uxpilot-auth.appspot.com/19b28cc669-df757991cd0c62ba2da4.png';
export const PRODUCT_ID_MOCK = 'MB-2024-0847';

export const PRODUCTION_STEPS = [
  { id: 1, label: 'Select Herbs' },
  { id: 2, label: 'Formulation' },
  { id: 3, label: 'Link Batches' },
  { id: 4, label: 'Generate QR' },
];