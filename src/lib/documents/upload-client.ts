"use client";

import { getClientEnv } from "@/lib/env";

export async function uploadFileWithProgress(
  accessToken: string,
  storagePath: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  const env = getClientEnv();
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/documents/${encodedPath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.send(file);
  });
}
