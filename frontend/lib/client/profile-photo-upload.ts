import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

import { optimizeImageFileForUpload } from "@/lib/client/image-optimizer";

type PresignUploadPayload = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
};

async function requestProfilePhotoPresign(file: File): Promise<PresignUploadPayload> {
  const response = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const payload = (await response.json().catch(() => null)) as PresignUploadPayload & { error?: string } | null;
  if (!response.ok || !payload?.uploadUrl || !payload.publicUrl) {
    throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de preparer l'upload de la photo."));
  }

  return payload;
}

export async function uploadProfilePhotoToStorage(file: File): Promise<string> {
  const optimized = await optimizeImageFileForUpload(file, "profile-photo");
  const presign = await requestProfilePhotoPresign(optimized);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": optimized.type,
    },
    body: optimized,
  });

  if (!uploadResponse.ok) {
    throw new Error("Echec de l'upload de la photo.");
  }

  return presign.publicUrl;
}

