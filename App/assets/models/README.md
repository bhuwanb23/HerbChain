# On-device plant model

The hybrid AI flow expects two files here:

```
App/assets/models/
├── plant_classifier.tflite   # quantized image-classification model
└── LABELS.txt                # one class name per line, matching model output order
```

## How the hybrid flow uses these

1. `App/services/recognition/tflite.js` lazy-loads the model via
   [`react-native-fast-tflite`](https://github.com/mrousavy/react-native-fast-tflite).
2. The on-device classifier returns the top-N `{label, score}` pairs.
3. The mobile client POSTs those candidates to
   `POST /api/v1/recognition/herbs`, which re-ranks them against the AYUSH
   `herb_catalogue` and returns top-3 matched species with `species_id` and
   `confidence`.
4. The farmer confirms one species and the existing batch-registration flow
   continues.

## Swapping in a real model

Pick a license-permitting plant classifier `.tflite` (for example, an
EfficientNet or MobileNet variant trained on PlantCLEF), drop it here as
`plant_classifier.tflite`, and write its class labels to `LABELS.txt`.

If your model's input is not the standard `224x224 RGB float32 [0,1]`,
also adjust the preprocessing block inside
`App/services/recognition/tflite.js#recognizeImage`.

## Expo Go vs custom dev client

`react-native-fast-tflite` is a native module, so it does **not** run in
plain Expo Go. To use real on-device inference, build a custom dev client:

```bash
cd App
npx expo prebuild
eas build --profile development --platform android
```

When the native module is unavailable, the SmartRegister screen falls back to
manual species selection from the catalogue (no on-device inference, but the
backend re-ranker still confirms the species).
