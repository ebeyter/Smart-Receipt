/** Kartın sol kenarındaki renkli şerit; kart `relative overflow-hidden` olmalı. */
export function CardStripe({ tint }: { tint: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 left-0 w-1"
      style={{ background: tint }}
    />
  );
}
