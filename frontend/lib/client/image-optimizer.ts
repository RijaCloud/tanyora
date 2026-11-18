"use client";

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const sourceUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Impossible de charger l'image."));
    };
    image.src = sourceUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Impossible de convertir l'image."));
    };
    reader.onerror = () => reject(new Error("Impossible de convertir l'image."));
    reader.readAsDataURL(file);
  });
}

function baseName(filename: string): string {
  if (!filename.includes(".")) {
    return filename;
  }
  return filename.slice(0, filename.lastIndexOf("."));
}

export async function optimizeImageFileForUpload(file: File, fallbackName = "upload-image"): Promise<File> {
  const image = await loadImageFromFile(file);

  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas non disponible.");
  }

  context.drawImage(image, 0, 0, width, height);

  const candidates = [
    { type: "image/avif", quality: 0.56, extension: "avif" },
    { type: "image/webp", quality: 0.74, extension: "webp" },
  ] as const;

  const encoded = await Promise.all(
    candidates.map(async (candidate) => {
      const blob = await canvasToBlob(canvas, candidate.type, candidate.quality);
      return blob ? { blob, ...candidate } : null;
    }),
  );

  const validCandidates = encoded.filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (validCandidates.length === 0) {
    throw new Error("Impossible d'encoder l'image en AVIF/WebP.");
  }

  const best = validCandidates.reduce((smallest, current) => (current.blob.size < smallest.blob.size ? current : smallest));
  const filename = `${baseName(file.name || fallbackName) || fallbackName}.${best.extension}`;
  return new File([best.blob], filename, { type: best.type });
}

export async function optimizeImageToDataUrl(file: File, fallbackName = "upload-image"): Promise<string> {
  const optimized = await optimizeImageFileForUpload(file, fallbackName);
  return fileToDataUrl(optimized);
}
