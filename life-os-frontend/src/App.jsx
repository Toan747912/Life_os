import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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
import VocabularyVault from './pages/VocabularyVault';
import FlashcardReview from './pages/FlashcardReview';
import Insights from './pages/Insights';
import RoleplayBot from './components/RoleplayBot';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorBoundary from './components/ErrorBoundary';

// New features
import Goals from './pages/Goals';
import Quests from './pages/Quests';
import SpeakingPractice from './pages/SpeakingPractice';
import DecksManagement from './pages/DecksManagement';
import AIPractice from './pages/AIPractice';

function App() {
  return (
    <Routes>
      {/* Public Routes (Không có Sidebar/Header) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes (Yêu cầu đăng nhập) */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:id" element={<ResourceDetail />} />
              <Route path="/study" element={<StudySession />} />
              <Route path="/dictations" element={<DictationList />} />
              <Route path="/dictation/create" element={<CreateDictation />} />
              <Route path="/dictation/edit/:id" element={<EditDictation />} />
              <Route path="/vocabulary" element={<VocabularyVault />} />
              <Route path="/decks" element={<DecksManagement />} />
              <Route path="/flashcards" element={<FlashcardReview />} />
              <Route path="/aipractice" element={<AIPractice />} />
              <Route path="/speaking" element={<SpeakingPractice />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/dictation/:id" element={
                <ErrorBoundary>
                  <DictationPractice />
                </ErrorBoundary>
              } />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <RoleplayBot />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;