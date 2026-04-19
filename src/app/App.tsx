import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Root } from './components/Root';
import { Home } from './components/Home';
import { Map } from './components/Map';
import { Services } from './components/Services';
import { Profile } from './components/Profile';
import { NotFound } from './components/NotFound';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Notifications } from './components/Notifications';
import { AdminPanel } from './components/admin/AdminPanel';
import { PassportService } from './components/services/PassportService';
import { PropertyService } from './components/services/PropertyService';
import { BusinessLicenseService, BuildingPermitService, OrganizationService } from './components/services/OtherServices';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Root />}>
            <Route index element={<Home />} />
            <Route path="map" element={<Map />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="services" element={<Services />} />
            <Route path="services/passport" element={<PassportService />} />
            <Route path="services/property" element={<PropertyService />} />
            <Route path="services/business-license" element={<BusinessLicenseService />} />
            <Route path="services/building-permit" element={<BuildingPermitService />} />
            <Route path="services/organization" element={<OrganizationService />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
