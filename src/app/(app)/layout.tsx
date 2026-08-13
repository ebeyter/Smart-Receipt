import AppHeader from "@/components/AppHeader";

/** Landing dışındaki tüm sayfaların ortak kabuğu: üst çubuk + içerik. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
