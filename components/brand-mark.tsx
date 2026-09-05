import Image from "next/image";
import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`brand ${className}`} aria-label="E-MEDIA home">
      <Image src="/emedia-mark.svg" alt="E-MEDIA" width={244} height={64} priority />
    </Link>
  );
}
