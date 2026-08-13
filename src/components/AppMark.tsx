/** Uygulama işareti: fiş biçimli, alt kenarı tırtıklı bir defter. */
export default function AppMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center bg-primary text-on-primary ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M7 3.5h10a1 1 0 0 1 1 1v15.2a.6.6 0 0 1-.9.5l-1.7-1-1.8 1a.6.6 0 0 1-.6 0l-1.8-1-1.8 1a.6.6 0 0 1-.6 0l-1.8-1-1.7 1a.6.6 0 0 1-.9-.5V4.5a1 1 0 0 1 1-1Z"
          fill="currentColor"
        />
        <path
          d="M9 8h6M9 11.5h6M9 15h3.5"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
