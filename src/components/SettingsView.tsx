import  { useState } from 'react';
import { User, LogOut, Github, Settings, AlertTriangle } from 'lucide-react';

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

interface SettingsProps {
  user: User;
  selectedRepo: string;
  onLogout: () => void;
}

export default function SettingsView({ user, selectedRepo, onLogout }: SettingsProps) {
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleLogout = () => {
    if (showConfirmLogout) {
      onLogout();
    } else {
      setShowConfirmLogout(true);
      setTimeout(() => setShowConfirmLogout(false), 3000);
    }
  };

  const openGitHubProfile = () => {
    chrome.tabs.create({ url: `https://github.com/${user.login}` });
  };

  const openRepository = () => {
    chrome.tabs.create({ url: `https://github.com/${selectedRepo}` });
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* User Profile */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <img 
            src={user.avatar_url} 
            alt={user.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{user.name || user.login}</h3>
            <p className="text-sm text-gray-600">@{user.login}</p>
          </div>
          <button
            onClick={openGitHubProfile}
            className="text-blue-600 hover:text-blue-800 p-2"
            title="View GitHub Profile"
          >
            <Github className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Repository Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Repository Settings
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Repository
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded border">
                {selectedRepo}
              </code>
              <button
                onClick={openRepository}
                className="text-blue-600 hover:text-blue-800 p-2"
                title="View Repository"
              >
                <Github className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Platform Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">LeetCode</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Codeforces</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>

    {/* File Organization */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">File Organization</h4>
      <div className="font-mono text-sm text-blue-800 space-y-2">
        {/* LeetCode Tree */}
        <div>
          <div>📁 leetcode</div>
          <div className="ml-4">📁 difficulty</div>
          <div className="ml-8">📄 problem.ext</div>
        </div>
        
        {/* Codeforces Tree */}
        <div>
          <div>📁 codeforces</div>
          <div className="ml-4">📁 div</div>
          <div className="ml-8">📁 contest_id</div>
          <div className="ml-12">📄 problem.ext</div>
        </div>
      </div>
    </div>


      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-900 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Danger Zone
        </h3>
        <button
          onClick={handleLogout}
          className={`w-full py-2 px-4 rounded-md border transition-colors ${
            showConfirmLogout
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
          }`}
        >
          <LogOut className="w-4 h-4 inline mr-2" />
          {showConfirmLogout ? 'Click again to confirm logout' : 'Logout & Clear Data'}
        </button>
        {showConfirmLogout && (
          <p className="text-xs text-red-600 mt-2">
            This will clear all stored data including your GitHub token.
          </p>
        )}
      </div>
    </div>
  );
}