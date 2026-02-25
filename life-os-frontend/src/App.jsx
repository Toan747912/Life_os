import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Learning from './pages/Learning';
import ResourceDetail from './pages/ResourceDetail';
import StudySession from './pages/StudySession';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import DictationPractice from './pages/DictationPractice';
import DictationList from './pages/DictationList';
import CreateDictation from './pages/CreateDictation';
import EditDictation from './pages/EditDictation';
import RoleplayBot from './components/RoleplayBot';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      {/* Public Routes (Không có Sidebar/Header) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes (Có Sidebar/Header) */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:id" element={<ResourceDetail />} />
            <Route path="/study" element={<StudySession />} />
            <Route path="/dictations" element={<DictationList />} />
            <Route path="/dictation/create" element={<CreateDictation />} />
            <Route path="/dictation/edit/:id" element={<EditDictation />} />
            <Route path="/dictation/:id" element={<DictationPractice />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <RoleplayBot />
        </Layout>
      } />
    </Routes>
  );
}

export default App;