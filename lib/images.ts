import sharp from "sharp";

export const IMAGE_URL_RE = /^\/img\/[a-f0-9]{24}\.webp$/;

const W = 800;
const H = 1000;
const MARGIN = 0.07;

/**
 * Transforme n'importe quelle photo (jpg, png, webp…) en image WebP 4:5 sur fond blanc,
 * avec une petite marge, pour qu'elle s'affiche comme les autres produits.
 */
export async function processProductImage(input: Buffer): Promise<Buffer> {
  const innerW = Math.round(W * (1 - 2 * MARGIN));
  const innerH = Math.round(H * (1 - 2 * MARGIN));
  const resized = await sharp(input, { limitInputPixels: 60_000_000, failOn: "error" })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: innerW, height: innerH, fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const left = Math.floor((W - resized.info.width) / 2);
  const top = Math.floor((H - resized.info.height) / 2);
  return sharp(resized.data)
    .extend({
      top,
      bottom: H - resized.info.height - top,
      left,
      right: W - resized.info.width - left,
      background: "#ffffff",
    })
    .webp({ quality: 82 })
    .toBuffer();
}
