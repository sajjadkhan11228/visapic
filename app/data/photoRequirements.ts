export type CountryCode =
  | "US"
  | "UK"
  | "CA"
  | "PK"
  | "IN"
  | "DE"
  | "FR"
  | "SA"
  | "AE";

export type PhotoRequirement = {
  country: CountryCode;
  name: string;

  printed?: {
    widthMm: number;
    heightMm: number;
  };

  digital?: {
    minWidthPx?: number;
    minHeightPx?: number;
    maxWidthPx?: number;
    maxHeightPx?: number;
    maxFileSizeKb?: number;
  };

  background: {
    required: string;
    colors: string[];
  };

  face: {
    minRatio: number;
    maxRatio: number;
    centerXMin: number;
    centerXMax: number;
    centerYMin: number;
    centerYMax: number;
  };

  notes: string[];
};

export const PHOTO_REQUIREMENTS: Record<
  CountryCode,
  PhotoRequirement
> = {
  US: {
    country: "US",
    name: "United States",

    printed: {
      widthMm: 51,
      heightMm: 51,
    },

    digital: {
      minWidthPx: 600,
      minHeightPx: 600,
      maxWidthPx: 1200,
      maxHeightPx: 1200,
      maxFileSizeKb: 240,
    },

    background: {
      required: "White or off-white",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "Square passport photo.",
      "Face should be clearly visible.",
      "Use a plain white or off-white background.",
      "Photo should be recent and unaltered.",
    ],
  },

  UK: {
    country: "UK",
    name: "United Kingdom",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    digital: {
      minWidthPx: 600,
      minHeightPx: 750,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "Portrait 35 × 45 mm format.",
      "Plain light background.",
      "Face should be clearly visible.",
      "Do not digitally alter the appearance of the face.",
    ],
  },

  CA: {
    country: "CA",
    name: "Canada",

    printed: {
      widthMm: 50,
      heightMm: 70,
    },

    background: {
      required: "Plain white or light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "Passport photo format is 50 × 70 mm.",
      "Face must be clearly visible.",
      "Photo should not be digitally altered.",
      "Check the specific application for digital upload requirements.",
    ],
  },

  PK: {
    country: "PK",
    name: "Pakistan",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "White",
      colors: ["#ffffff"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "Common visa photo format is 35 × 45 mm.",
      "White background is required for the referenced visa specification.",
      "Face should be clearly visible.",
      "Always verify the exact requirement for your application.",
    ],
  },

  IN: {
    country: "IN",
    name: "India",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "35 × 45 mm is used as a VisaPic generic visa-photo preset.",
      "Exact dimensions and digital requirements can vary by application.",
      "Verify the official application requirements before submission.",
    ],
  },

  DE: {
    country: "DE",
    name: "Germany",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "35 × 45 mm is used as a generic VisaPic passport/visa preset.",
      "Exact biometric requirements may vary by document/application.",
      "Verify the official requirements before submission.",
    ],
  },

  FR: {
    country: "FR",
    name: "France",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "35 × 45 mm is used as a generic VisaPic passport/visa preset.",
      "Exact requirements depend on the document and application.",
      "Verify the official requirements before submission.",
    ],
  },

  SA: {
    country: "SA",
    name: "Saudi Arabia",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "35 × 45 mm is used as a generic VisaPic visa-photo preset.",
      "Exact requirements can vary by visa/document type.",
      "Verify the official application requirements before submission.",
    ],
  },

  AE: {
    country: "AE",
    name: "United Arab Emirates",

    printed: {
      widthMm: 35,
      heightMm: 45,
    },

    background: {
      required: "Plain light background",
      colors: ["#ffffff", "#fff1c7"],
    },

    face: {
      minRatio: 0.25,
      maxRatio: 0.55,
      centerXMin: 0.42,
      centerXMax: 0.58,
      centerYMin: 0.35,
      centerYMax: 0.60,
    },

    notes: [
      "35 × 45 mm is used as a generic VisaPic visa-photo preset.",
      "Exact requirements can vary by visa/document type.",
      "Verify the official application requirements.",
    ],
  },
};

export function getPhotoRequirements(
  country: CountryCode
): PhotoRequirement {
  return PHOTO_REQUIREMENTS[country];
}