"use client";

import {
  getPhotoRequirements,
  type CountryCode,
} from "../data/photoRequirements";

type FaceData = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  imageWidth?: number;
  imageHeight?: number;
  faceWidthRatio?: number;
  faceHeightRatio?: number;
  centerXRatio?: number;
  centerYRatio?: number;
};

type ComplianceCheckerProps = {
  country: string;
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  face?: FaceData | null;
  backgroundRemoved?: boolean;
};

type CheckResult = {
  title: string;
  status: "pass" | "warning" | "fail";
  message: string;
};

function normalizeCountry(country: string): CountryCode {
  const map: Record<string, CountryCode> = {
    "United States": "US",
    "United Kingdom": "UK",
    Canada: "CA",
    Pakistan: "PK",
    India: "IN",
    Germany: "DE",
    France: "FR",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
  };

  return map[country] || "US";
}

export default function ComplianceChecker({
  country,
  widthMm,
  heightMm,
  backgroundColor,
  face,
  backgroundRemoved = false,
}: ComplianceCheckerProps) {
  const countryCode = normalizeCountry(country);

  const requirements =
    getPhotoRequirements(countryCode);

  const checks: CheckResult[] = [];

  // --------------------------------------------------
  // 1. FACE DETECTION
  // --------------------------------------------------

  if (face) {
    checks.push({
      title: "Face detected",
      status: "pass",
      message:
        "A face was detected in the uploaded photo.",
    });
  } else {
    checks.push({
      title: "Face detection",
      status: "fail",
      message:
        "No face detected. Try another photo with the face clearly visible.",
    });
  }

  // --------------------------------------------------
  // 2. OUTPUT SIZE
  // --------------------------------------------------

  const expectedWidth =
    requirements.printed?.widthMm;

  const expectedHeight =
    requirements.printed?.heightMm;

  if (
    expectedWidth === widthMm &&
    expectedHeight === heightMm
  ) {
    checks.push({
      title: "Photo dimensions",
      status: "pass",
      message: `Output preset is ${widthMm} × ${heightMm} mm.`,
    });
  } else {
    checks.push({
      title: "Photo dimensions",
      status: "warning",
      message: `Current output is ${widthMm} × ${heightMm} mm. The selected country preset is ${expectedWidth} × ${expectedHeight} mm.`,
    });
  }

  // --------------------------------------------------
  // 3. BACKGROUND
  // --------------------------------------------------

  const isAllowedBackground =
    requirements.background.colors.some(
      (color) =>
        color.toLowerCase() === backgroundColor.toLowerCase()
    );

  if (!backgroundRemoved) {
    checks.push({
      title: "Background replacement",
      status: "warning",
      message:
        "The original photo background is still present. Run AI Background Removal before treating the selected color as a replacement.",
    });
  } else if (isAllowedBackground) {
    checks.push({
      title: "Background",
      status: "pass",
      message: `Selected background matches the VisaPic preset: ${requirements.background.required}.`,
    });
  } else {
    checks.push({
      title: "Background",
      status: "warning",
      message: `Selected background may not satisfy the recommended requirement: ${requirements.background.required}.`,
    });
  }

  // --------------------------------------------------
  // 4. FACE SIZE
  // --------------------------------------------------

  if (face) {
    const imageHeight =
      face.imageHeight || 0;

    const faceHeightRatio =
      face.faceHeightRatio ??
      (imageHeight
        ? face.height / imageHeight
        : 0);

    if (
      faceHeightRatio >=
        requirements.face.minRatio &&
      faceHeightRatio <=
        requirements.face.maxRatio
    ) {
      checks.push({
        title: "Face size",
        status: "pass",
        message:
          "Detected face size is within the VisaPic guidance range.",
      });
    } else {
      checks.push({
        title: "Face size",
        status: "warning",
        message:
          "The detected face may need repositioning or zoom adjustment.",
      });
    }
  } else {
    checks.push({
      title: "Face size",
      status: "warning",
      message:
        "Face size cannot be evaluated until a face is detected.",
    });
  }

  // --------------------------------------------------
  // 5. HORIZONTAL POSITION
  // --------------------------------------------------

  if (face) {
    const imageWidth =
      face.imageWidth || 0;

    const centerXRatio =
      face.centerXRatio ??
      (imageWidth
        ? face.centerX / imageWidth
        : 0);

    if (
      centerXRatio >=
        requirements.face.centerXMin &&
      centerXRatio <=
        requirements.face.centerXMax
    ) {
      checks.push({
        title: "Horizontal position",
        status: "pass",
        message:
          "Face is approximately centered horizontally.",
      });
    } else {
      checks.push({
        title: "Horizontal position",
        status: "warning",
        message:
          "Face appears too far left or right. Use Smart Auto Position or manual crop.",
      });
    }
  } else {
    checks.push({
      title: "Horizontal position",
      status: "warning",
      message:
        "Cannot evaluate face position without face detection.",
    });
  }

  // --------------------------------------------------
  // 6. VERTICAL POSITION
  // --------------------------------------------------

  if (face) {
    const imageHeight =
      face.imageHeight || 0;

    const centerYRatio =
      face.centerYRatio ??
      (imageHeight
        ? face.centerY / imageHeight
        : 0);

    if (
      centerYRatio >=
        requirements.face.centerYMin &&
      centerYRatio <=
        requirements.face.centerYMax
    ) {
      checks.push({
        title: "Vertical position",
        status: "pass",
        message:
          "Face is approximately positioned correctly vertically.",
      });
    } else {
      checks.push({
        title: "Vertical position",
        status: "warning",
        message:
          "Face may need to be moved higher or lower.",
      });
    }
  } else {
    checks.push({
      title: "Vertical position",
      status: "warning",
      message:
        "Cannot evaluate vertical position without face detection.",
    });
  }

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  const passed =
    checks.filter(
      (check) => check.status === "pass"
    ).length;

  const warnings =
    checks.filter(
      (check) => check.status === "warning"
    ).length;

  const failed =
    checks.filter(
      (check) => check.status === "fail"
    ).length;

  let overallStatus:
    | "pass"
    | "warning"
    | "fail" = "pass";

  if (failed > 0) {
    overallStatus = "fail";
  } else if (warnings > 0) {
    overallStatus = "warning";
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Photo Compliance Check
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {requirements.name} photo guidance
          </p>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            overallStatus === "pass"
              ? "bg-green-100 text-green-700"
              : overallStatus === "warning"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {overallStatus === "pass"
            ? "✓ Looks Good"
            : overallStatus === "warning"
            ? "⚠ Review Needed"
            : "✕ Fix Required"}
        </div>
      </div>

      {/* SCORE */}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {passed}
          </div>

          <div className="mt-1 text-xs font-medium text-green-700">
            Passed
          </div>
        </div>

        <div className="rounded-xl bg-yellow-50 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {warnings}
          </div>

          <div className="mt-1 text-xs font-medium text-yellow-700">
            Warnings
          </div>
        </div>

        <div className="rounded-xl bg-red-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {failed}
          </div>

          <div className="mt-1 text-xs font-medium text-red-700">
            Failed
          </div>
        </div>
      </div>

      {/* CHECKS */}

      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div
            key={check.title}
            className={`rounded-xl border p-4 ${
              check.status === "pass"
                ? "border-green-200 bg-green-50"
                : check.status === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-lg">
                {check.status === "pass"
                  ? "✓"
                  : check.status === "warning"
                  ? "⚠"
                  : "✕"}
              </div>

              <div>
                <div
                  className={`font-bold ${
                    check.status === "pass"
                      ? "text-green-800"
                      : check.status === "warning"
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {check.title}
                </div>

                <div className="mt-1 text-sm text-slate-600">
                  {check.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FACE DETAILS */}

      {face && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-bold text-slate-900">
            Detected Face
          </h4>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">
                Width
              </div>

              <div className="font-semibold text-slate-800">
                {Math.round(face.width)} px
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Height
              </div>

              <div className="font-semibold text-slate-800">
                {Math.round(face.height)} px
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Center X
              </div>

              <div className="font-semibold text-slate-800">
                {Math.round(face.centerX)} px
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Center Y
              </div>

              <div className="font-semibold text-slate-800">
                {Math.round(face.centerY)} px
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUNTRY REQUIREMENTS */}

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-bold text-blue-900">
          {requirements.name} Requirements
        </h4>

        <div className="mt-3 space-y-2 text-sm text-blue-800">
          {requirements.printed && (
            <div>
              <strong>Printed size:</strong>{" "}
              {requirements.printed.widthMm} ×{" "}
              {requirements.printed.heightMm} mm
            </div>
          )}

          {requirements.digital && (
            <div>
              <strong>Digital:</strong>{" "}
              {requirements.digital.minWidthPx &&
                requirements.digital.minHeightPx && (
                  <>
                    minimum{" "}
                    {requirements.digital.minWidthPx} ×{" "}
                    {requirements.digital.minHeightPx} px
                  </>
                )}
            </div>
          )}

          <div>
            <strong>Background:</strong>{" "}
            {requirements.background.required}
          </div>
        </div>
      </div>

      {/* NOTES */}

      <div className="mt-5">
        <h4 className="font-bold text-slate-900">
          Important Notes
        </h4>

        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {requirements.notes.map((note) => (
            <li
              key={note}
              className="flex gap-2"
            >
              <span>•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* DISCLAIMER */}

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        <strong>Important:</strong> VisaPic's compliance
        checker is an automated guidance tool. It does not
        guarantee acceptance by a passport office,
        embassy, immigration authority, or visa application
        system. Always verify the current official
        requirements for your specific application.
      </div>
    </div>
  );
}