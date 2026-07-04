import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex bg-surface min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
