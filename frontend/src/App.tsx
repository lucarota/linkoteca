import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthScreen from './pages/AuthScreen';
import DashboardWrapper from './pages/DashboardWrapper';
import EditScreen from './pages/EditScreen';
import SettingsScreen from './pages/SettingsScreen';
import PublicDirectoryScreen from './pages/PublicDirectoryScreen';

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        .custom-tag-checkbox {
          appearance: none;
          background-color: #fff;
          border: 1px solid #000;
        }
        .custom-tag-checkbox:checked {
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          background-color: #fff;
          border-color: #000;
        }
      `}</style>
      <Routes>
        <Route path="/" element={<AuthScreen />} />
        <Route path="/directory" element={<PublicDirectoryScreen />} />
        <Route path="/:collectionName" element={<DashboardWrapper />} />
        <Route path="/:collectionName/:linkId/edit" element={<EditScreen />} />
        <Route path="/:collectionName/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
