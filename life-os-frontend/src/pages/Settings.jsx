import React, { useState, useEffect, useRef } from 'react';
import ModelSelector from '../components/learning/ModelSelector';
import api from '../services/api';
import { Save, Loader2, Sparkles, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [models, setModels] = useState([]);
  const [preferences, setPreferences] = useState({ defaultAiModel: 'gemini-1.5-flash' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timeoutRef = useRef(null);

  const triggerSuccessToast = () => {
    setShowSuccess(false); // Force re-render animation if already true
    setTimeout(() => {
      setShowSuccess(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowSuccess(false), 3000);
    }, 10);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch models
      try {
        const modelsRes = await api.get('/learning/models');
        setModels(modelsRes.data.data);
      } catch (error) {
        console.error("Error fetching models:", error);
      }

      // Fetch preferences
      try {
        const prefsRes = await api.get('/user/preferences');
        const serverPrefs = prefsRes.data.data || {};
        setPreferences(prev => ({
          ...prev,
          ...serverPrefs,
          defaultAiModel: serverPrefs.defaultAiModel || 'gemini-1.5-flash'
        }));
      } catch (error) {
        console.error("Error fetching preferences:", error);
        if (error.response && error.response.status === 404) {
          alert("Lỗi: Người dùng không tồn tại. Vui lòng đăng xuất và đăng nhập lại.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (newId) => {
    const updatedPrefs = { ...preferences, defaultAiModel: newId };
    setPreferences(updatedPrefs);

    // Auto-save logic cho AI Model để tránh người dùng quên bấm Save
    try {
      await api.patch('/user/preferences', updatedPrefs);
      triggerSuccessToast();
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/user/preferences', preferences);
      triggerSuccessToast();
    } catch (error) {
      alert("Lỗi khi lưu cài đặt: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <SettingsIcon className="text-slate-400" /> Settings
          </h1>
          <p className="mt-2 text-slate-600">Manage your system preferences and AI configurations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </header>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={18} /> Settings saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* AI Configuration Section */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">Choose the default engine for content analysis and vocabulary extraction.</p>
          </div>

          <div className="pt-4">
            <ModelSelector
              models={models}
              selectedModel={preferences.defaultAiModel}
              onSelect={handleModelChange}
            />
          </div>
        </section>

        {/* Other settings can go here */}
      </div>
    </div>
  );
};

export default Settings;
