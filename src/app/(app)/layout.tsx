import AppHeader from "@/components/AppHeader";
import TopBand from "@/components/TopBand";

/** Landing dışındaki tüm sayfaların ortak kabuğu: renkli üst bant + çubuk. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBand />
      <AppHeader />
      {children}
    </>
  );
}
