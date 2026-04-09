import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const ViewerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ViewerLayout;
