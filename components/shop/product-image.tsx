import Image from "next/image";

export function ProductImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <Image src="/logo.png" alt="" width={96} height={96} className="h-24 w-24 opacity-30" />
      </div>
    );
  }
  const external = /^https?:\/\//.test(src);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={external}
      className="object-cover"
    />
  );
}
