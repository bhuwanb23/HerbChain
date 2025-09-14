export const HERB_SPECIES = [
  { value: 'basil', label: 'Basil (Ocimum basilicum)' },
  { value: 'oregano', label: 'Oregano (Origanum vulgare)' },
  { value: 'thyme', label: 'Thyme (Thymus vulgaris)' },
  { value: 'rosemary', label: 'Rosemary (Rosmarinus officinalis)' },
  { value: 'sage', label: 'Sage (Salvia officinalis)' },
  { value: 'mint', label: 'Mint (Mentha)' },
  { value: 'parsley', label: 'Parsley (Petroselinum crispum)' },
  { value: 'cilantro', label: 'Cilantro (Coriandrum sativum)' },
  { value: 'dill', label: 'Dill (Anethum graveolens)' },
  { value: 'chives', label: 'Chives (Allium schoenoprasum)' },
];

export const CULTIVATION_METHODS = [
  { value: 'organic', label: 'Organic Farming' },
  { value: 'hydroponic', label: 'Hydroponic' },
  { value: 'traditional', label: 'Traditional Soil' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'vertical', label: 'Vertical Farming' },
  { value: 'aquaponic', label: 'Aquaponic' },
];

export const REGISTRATION_STEPS = {
  AI_RECOGNITION: 1,
  MANUAL_ENTRY: 2,
  COMPLETE: 3,
};

export const STEP_LABELS = {
  [REGISTRATION_STEPS.AI_RECOGNITION]: 'AI Recognition',
  [REGISTRATION_STEPS.MANUAL_ENTRY]: 'Manual Entry',
  [REGISTRATION_STEPS.COMPLETE]: 'Complete',
};
