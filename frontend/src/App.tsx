import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import BookAppointment from './pages/patient/BookAppointment';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientHistory from './pages/patient/PatientHistory';
import PatientTurnosHistory from './pages/patient/PatientTurnosHistory';
import PatientProfile from './pages/patient/PatientProfile';
import ProfessionalAgenda from './pages/professional/ProfessionalAgenda';
import ProfessionalDashboard from './pages/professional/ProfessionalDashboard';
import ProfessionalSchedule from './pages/professional/ProfessionalSchedule';
import ProfessionalPatients from './pages/professional/ProfessionalPatients';
import ProfessionalProfile from './pages/professional/ProfessionalProfile';
import ClinicalHistory from './pages/professional/ClinicalHistory';
import PatientLayout from './components/layout/PatientLayout';
import ProfessionalLayout from './components/layout/ProfessionalLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfessionals from './pages/admin/AdminProfessionals';
import AdminPatients from './pages/admin/AdminPatients';
import AdminAgenda from './pages/admin/AdminAgenda';
import AdminProfessions from './pages/admin/AdminProfessions';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token || role !== allowedRole) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<ProtectedRoute allowedRole="PATIENT"><PatientLayout><PatientDashboard /></PatientLayout></ProtectedRoute>} />
        <Route path="/patient/book" element={<ProtectedRoute allowedRole="PATIENT"><PatientLayout><BookAppointment /></PatientLayout></ProtectedRoute>} />
        <Route path="/patient/history" element={<ProtectedRoute allowedRole="PATIENT"><PatientLayout><PatientHistory /></PatientLayout></ProtectedRoute>} />
        <Route path="/patient/history-turnos" element={<ProtectedRoute allowedRole="PATIENT"><PatientLayout><PatientTurnosHistory /></PatientLayout></ProtectedRoute>} />
        <Route path="/patient/profile" element={<ProtectedRoute allowedRole="PATIENT"><PatientLayout><PatientProfile /></PatientLayout></ProtectedRoute>} />

        {/* Professional Routes */}
        <Route path="/professional/dashboard" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ProfessionalDashboard /></ProfessionalLayout></ProtectedRoute>} />
        <Route path="/professional/agenda" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ProfessionalAgenda /></ProfessionalLayout></ProtectedRoute>} />
        <Route path="/professional/schedule" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ProfessionalSchedule /></ProfessionalLayout></ProtectedRoute>} />
        <Route path="/professional/listados" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ProfessionalPatients /></ProfessionalLayout></ProtectedRoute>} />
        <Route path="/professional/patients" element={<Navigate to="/professional/listados" replace />} />
        <Route path="/professional/profile" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ProfessionalProfile /></ProfessionalLayout></ProtectedRoute>} />
        <Route path="/professional/history" element={<ProtectedRoute allowedRole="PROFESSIONAL"><ProfessionalLayout><ClinicalHistory /></ProfessionalLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/professionals" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout><AdminProfessionals /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/patients" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout><AdminPatients /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/agenda" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout><AdminAgenda /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/professions" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout><AdminProfessions /></AdminLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
