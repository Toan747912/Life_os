import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Learning from './pages/Learning';
import ResourceDetail from './pages/ResourceDetail';
import StudySession from './pages/StudySession';
import Finance from './pages/Finance';   // Nhớ tạo file này
import Settings from './pages/Settings'; // Nhớ tạo file này

function App() {
  return (
    <Layout>
      {/* Khu vực thay đổi nội dung động */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/learning/:id" element={<ResourceDetail />} />
        <Route path="/study" element={<StudySession />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;