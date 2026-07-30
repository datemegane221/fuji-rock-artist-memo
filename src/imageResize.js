// Resizes/compresses an image file client-side before upload, so a
// full-resolution phone photo never gets sent to GAS (which has request
// size limits and is already slow). Always re-encodes to JPEG.
export function resizeImageFile(file, { maxDimension = 1200, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("画像の圧縮に失敗しました"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = String(reader.result).split(",")[1] || "";
            resolve({ base64, mimeType: "image/jpeg", blob });
          };
          reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = objectUrl;
  });
}
