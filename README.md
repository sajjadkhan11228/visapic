# VisaPic

VisaPic is a Next.js 16 + React 19 web application for passport and visa photo preparation.

## Included

### Main connected passport-photo editor

`/passport-photo` connects:

- Country-specific photo size presets
- AI face detection
- Smart Auto Position
- AI background removal
- Crop
- Zoom
- Rotation
- Background color selection
- Live background preview
- Compliance guidance
- Final JPG generation
- Download

### Standalone tools

- `/passport-photo-maker`
- `/passport-photo-size`
- `/passport-photo-sheet`
- `/photo-print-sheet`
- `/image-cropper`
- `/image-resizer`
- `/image-compressor`
- `/image-size-reducer`
- `/jpg-to-png`
- `/image-to-jpg`
- `/background-changer`
- `/photo-to-pdf`
- `/dpi-converter`

Compatibility aliases are also available:

- `/visa-photo`
- `/photo-resizer`
- `/photo-cropper`

## Requirements

- Node.js 20+ recommended
- npm

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## AI face detector

The Tiny Face Detector model is stored in:

```text
public/models/
```

Required files:

```text
tiny_face_detector_model-weights_manifest.json
tiny_face_detector_model-shard1
```

The face-api package is loaded in the browser, and the model is loaded from `/models`.

## Background removal

`@imgly/background-removal` is loaded lazily in the browser when the user presses **Remove Background**. This avoids evaluating the browser-only library during the initial Next.js server build.

## Important photo-requirement note

The compliance checker is guidance, not an acceptance guarantee. Some countries and applications have different rules for passports, visas, online applications and printed photos. Verify the exact current instructions from the authority handling the application.

The pixel dimensions shown by the editor are VisaPic-generated output dimensions unless the UI explicitly identifies an official digital requirement.

## Before production launch

Set your real site URL in `.env.local`:

```text
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```

Then update branding, support/contact details, privacy/terms text, analytics and advertising disclosures to match the services actually enabled on the production website.
