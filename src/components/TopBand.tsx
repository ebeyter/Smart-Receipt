/**
 * Uygulama sayfalarının zemini: en üstte, başlık çubuğunun arkasından başlayıp
 * aşağı doğru sönen renkli bir bant. İçeriğin bulunduğu alan düz kalır, böylece
 * tablo ve form alanlarının okunaklığı bozulmaz.
 */
export default function TopBand() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--primary) 20%, transparent), transparent 78%)",
        }}
      />
      <div
        className="absolute -top-24 right-0 h-72 w-2/3 opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, var(--accent), transparent 65%)",
        }}
      />
      <div
        className="absolute -top-32 -left-20 h-72 w-1/2 opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, var(--cat-7), transparent 65%)",
        }}
      />
    </div>
  );
}
