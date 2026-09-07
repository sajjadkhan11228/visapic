export type PhotoSize = {
  country: string;
  widthMm: number;
  heightMm: number;
  outputWidth: number;
  outputHeight: number;
  aspect: number;
  description: string;
};

export const PHOTO_SIZES: Record<string, PhotoSize> = {
  "United States": {
    country: "United States",
    widthMm: 51,
    heightMm: 51,
    outputWidth: 1200,
    outputHeight: 1200,
    aspect: 1,
    description: "2 × 2 inch passport photo",
  },

  "United Kingdom": {
    country: "United Kingdom",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm passport photo",
  },

  Canada: {
    country: "Canada",
    widthMm: 50,
    heightMm: 70,
    outputWidth: 1000,
    outputHeight: 1400,
    aspect: 50 / 70,
    description: "50 × 70 mm passport photo",
  },

  Pakistan: {
    country: "Pakistan",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },

  India: {
    country: "India",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },

  Germany: {
    country: "Germany",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },

  France: {
    country: "France",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },

  "Saudi Arabia": {
    country: "Saudi Arabia",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },

  "United Arab Emirates": {
    country: "United Arab Emirates",
    widthMm: 35,
    heightMm: 45,
    outputWidth: 700,
    outputHeight: 900,
    aspect: 35 / 45,
    description: "35 × 45 mm photo",
  },
};

export function getPhotoSize(
  country: string
): PhotoSize {
  return (
    PHOTO_SIZES[country] ||
    PHOTO_SIZES["United Kingdom"]
  );
}