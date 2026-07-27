import NavBar from "@/components/NavBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <NavBar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
