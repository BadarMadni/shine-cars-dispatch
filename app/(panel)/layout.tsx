import Sidebar from "@/components/dispatch/Sidebar";
import NewBookingAlert from "@/components/dispatch/NewBookingAlert";
import SIPPhone from "@/components/dispatch/SIPPhone";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50/80">
      <Sidebar />
      <main className="flex-1 lg:ml-0 min-h-screen">
        {children}
      </main>
      <NewBookingAlert />
      <SIPPhone />
    </div>
  );
}
