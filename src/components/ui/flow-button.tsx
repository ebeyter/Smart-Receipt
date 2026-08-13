"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Dolu ise bağlantı, boş ise düğme olarak render edilir. */
  href?: string;
  /** Dış siteler yeni sekmede açılır. */
  external?: boolean;
  onClick?: () => void;
  size?: "sm" | "default";
  /** Verilirse oklar yerine bu ikon gösterilir (kısayol butonları için). */
  icon?: React.ReactNode;
  className?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean;
};

/**
 * Üzerine gelince kenarları köşelenen, içi dolan ve okları kayan düğme.
 * Dolgu rengi metin rengiyle aynı (koyu temada açık, açık temada koyu), yazı da
 * arka plan rengine döner — yani hover'da renkler tersine çevrilir.
 */
export function FlowButton({
  text,
  href,
  external,
  onClick,
  size = "default",
  icon,
  className,
  ...aria
}: Props) {
  const isSmall = size === "sm";

  const shell = cn(
    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-[100px]",
    "border-[1.5px] border-border bg-transparent font-semibold text-foreground",
    "transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
    "hover:rounded-[12px] hover:border-transparent hover:text-background active:scale-[0.97]",
    isSmall ? "gap-1 px-5 py-2 text-sm" : "gap-1 px-8 py-3 text-base",
    className
  );

  const arrowBase =
    "absolute z-[9] fill-none stroke-current transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]";

  const content = icon ? (
    <span className="relative z-[1] flex items-center gap-2">
      {icon}
      {text}
    </span>
  ) : (
    <>
      {/* Soldan giren ok */}
      <ArrowRight
        aria-hidden
        className={cn(
          arrowBase,
          isSmall ? "h-3.5 w-3.5 left-[-25%] group-hover:left-3" : "h-4 w-4 left-[-25%] group-hover:left-4"
        )}
      />

      <span
        className={cn(
          "relative z-[1] transition-all duration-[800ms] ease-out",
          isSmall ? "-translate-x-2 group-hover:translate-x-2" : "-translate-x-3 group-hover:translate-x-3"
        )}
      >
        {text}
      </span>

      {/* Açılan renk dairesi */}
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0",
          "transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:opacity-100",
          // Daire, en geniş etiketi bile örtecek kadar büyümeli; aksi hâlde
          // dışarıda kalan yazı arka plan rengine dönüp görünmez oluyor.
          isSmall ? "group-hover:h-[360px] group-hover:w-[360px]" : "group-hover:h-[460px] group-hover:w-[460px]"
        )}
      />

      {/* Sağdan çıkan ok */}
      <ArrowRight
        aria-hidden
        className={cn(
          arrowBase,
          isSmall
            ? "h-3.5 w-3.5 right-3 group-hover:right-[-25%]"
            : "h-4 w-4 right-4 group-hover:right-[-25%]"
        )}
      />
    </>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={shell} onClick={onClick}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={shell} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={shell} {...aria}>
      {content}
    </button>
  );
}
