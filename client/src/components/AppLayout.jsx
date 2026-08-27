import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

function AppLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;