import { Routes, Route } from "react-router";
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import PropertyAccordion from './components/PropertyAccordion';
import RegisterTenant from './pages/RegisterTenant';
import EmailPage from './pages/EmailPage';
import TenantDetails from "./pages/TenantDetails";
import Settings from "./pages/Settings";
import EditTenant from "./pages/EditTenant";
import './index.css';
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import LandlordRegister from "./pages/LandlordRegister";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  return (
    <>
      <div id="main">
        <Routes>
          {/* Public route to display homepage */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-landlord" element={<LandlordRegister />} />

          {/* App route to display other pages with fixed sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/tenants' element={<Tenants />} />
              <Route path='/tenants/:id' element={<TenantDetails />} />
              <Route path='/tenants/edit/:id' element={<EditTenant />} />
              <Route path='/properties' element={<PropertyAccordion />} />
              <Route path='/register' element={<RegisterTenant />} />
              <Route path='/emails' element={<EmailPage />} />
              <Route path='/settings' element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </>
  )
}

export default App;