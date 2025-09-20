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

export const PRODUCT_LIST_MOCK = [
  {
    id: 'PROD-001',
    name: 'Organic Turmeric Powder',
    batchId: 'MB-2024-0847',
    status: 'Certified',
    dateCreated: '2024-09-15',
    imageUrl: 'https://via.placeholder.com/150/059669/ffffff?text=Turmeric',
  },
  {
    id: 'PROD-002',
    name: 'Herbal Ginger Tincture',
    batchId: 'MB-2024-0848',
    status: 'Pending Certification',
    dateCreated: '2024-09-18',
    imageUrl: 'https://via.placeholder.com/150/f59e0b/ffffff?text=Ginger',
  },
  {
    id: 'PROD-003',
    name: 'Ashwagandha Immunity Blend',
    batchId: 'MB-2024-0849',
    status: 'Draft',
    dateCreated: '2024-09-20',
    imageUrl: 'https://via.placeholder.com/150/3b82f6/ffffff?text=Ashwagandha',
  },
];

export const PRODUCT_DETAILS_MOCK = {
  'PROD-001': {
    id: 'PROD-001',
    name: 'Organic Turmeric Powder',
    description: 'Finely ground organic turmeric powder, sourced from the best farms in Kerala.',
    batchId: 'MB-2024-0847',
    status: 'Certified',
    dateCreated: '2024-09-15',
    processingMethod: 'Cold Extraction',
    certifications: ['Organic Certified', 'FSSAI Approved'],
    linkedBatches: [
      { herbName: 'Turmeric (Curcuma longa)', batchId: 'TUR-2024-001' },
    ],
    qrCodeImageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/19b28cc669-df757991cd0c62ba2da4.png',
    productionNotes: 'Produced in a allergen-free facility. Batch tested for purity.',
  },
  'PROD-002': {
    id: 'PROD-002',
    name: 'Herbal Ginger Tincture',
    description: 'Potent ginger tincture, traditionally prepared for maximum efficacy.',
    batchId: 'MB-2024-0848',
    status: 'Pending Certification',
    dateCreated: '2024-09-18',
    processingMethod: 'Steam Distillation',
    certifications: ['GMP Certified'],
    linkedBatches: [
      { herbName: 'Ginger (Zingiber officinale)', batchId: 'GIN-2024-003' },
    ],
    qrCodeImageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/19b28cc669-df757991cd0c62ba2da4.png',
    productionNotes: 'Double distilled for enhanced purity.',
  },
  'PROD-003': {
    id: 'PROD-003',
    name: 'Ashwagandha Immunity Blend',
    description: 'A powerful blend of adaptogenic herbs to support immunity and well-being.',
    batchId: 'MB-2024-0849',
    status: 'Draft',
    dateCreated: '2024-09-20',
    processingMethod: 'Powder Blend',
    certifications: [],
    linkedBatches: [
      { herbName: 'Ashwagandha (Withania somnifera)', batchId: 'ASH-2024-002' },
      { herbName: 'Holy Basil (Ocimum tenuiflorum)', batchId: 'HB-2024-001' },
    ],
    qrCodeImageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/19b28cc669-df757991cd0c62ba2da4.png',
    productionNotes: 'Initial formulation, awaiting lab testing.',
  },
};