import Sidebar from "@/app/components/Sidebar";

interface Props {
  children?: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const defaultClasses = "flex-1 pt-25 bg-base-100 shadow-br rounded-xl";

  return (
    <div className="flex bg-base-200 min-h-screen p-6 gap-6">
      {/* Resizable Floating Sidebar */}
      <div className="pt-25">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      {children}
    </div>
  );
};

export default Layout;
