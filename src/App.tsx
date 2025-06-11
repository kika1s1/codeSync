import React, { useState, useEffect } from 'react';
import { Github, Settings, History, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  selectedRepo: string;
  currentView: 'dashboard' | 'history' | 'settings';
  isLoading: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    selectedRepo: '',
    currentView: 'dashboard',
    isLoading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await chrome.storage.local.get(['githubToken', 'githubUsername', 'selectedRepo']);
      
      if (result.githubToken) {
        // Test the token
        chrome.runtime.sendMessage({ type: 'test-github-auth' }, (response) => {
          if (response?.success) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: response.user,
              selectedRepo: result.selectedRepo || '',
              isLoading: false
            }));
          } else {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleLogin = (user: User, repo: string) => {
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
      selectedRepo: repo
    }));
  };

  const handleLogout = async () => {
    await chrome.storage.local.clear();
    setState({
      isAuthenticated: false,
      user: null,
      selectedRepo: '',
      currentView: 'dashboard',
      isLoading: false
    });
  };

  const setCurrentView = (view: 'dashboard' | 'history' | 'settings') => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  if (state.isLoading) {
    return (
      <div className="w-80 h-96 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="w-80 h-96 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Github className="w-5 h-5" />
          <span className="font-semibold">CodeSync</span>
        </div>
        <div className="flex items-center space-x-2">
          {state.user?.avatar_url && (
            <img 
              src={state.user.avatar_url} 
              alt={state.user.name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm">{state.user?.login}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 border-b flex">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex-1 py-2 px-3 text-sm font-medium ${
            state.currentView === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Status
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className={`flex-1 py-2 px-3 text-sm font-medium ${
            state.currentView === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          History
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex-1 py-2 px-3 text-sm font-medium ${
            state.currentView === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {state.currentView === 'dashboard' && (
          <Dashboard selectedRepo={state.selectedRepo} />
        )}
        {state.currentView === 'history' && <HistoryView />}
        {state.currentView === 'settings' && (
          <SettingsView 
            user={state.user!}
            selectedRepo={state.selectedRepo}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

export default App;