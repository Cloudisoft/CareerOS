"use client";

/**
 * Turns a picked image File into a compressed base64 data: URL, resized so
 * its longest side is at most maxDimension. Keeping this entirely
 * client-side and storing the result as a normal text column means image
 * uploads work with zero new infrastructure — no object-storage bucket, no
 * third-party account, nothing but a bit of canvas work in the browser.
 * Not meant for video: this is deliberately image-only and capped in size.
 */
export function fileToResizedDataUrl(file: File, maxDimension: number, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("That image is too large — please choose one under 12MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file. Please try again."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser can't process images. Please try a different browser."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
