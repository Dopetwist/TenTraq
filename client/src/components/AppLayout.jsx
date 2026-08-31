import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="app-main">
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="app-content">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;