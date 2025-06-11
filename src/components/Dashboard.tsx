import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';

interface DashboardProps {
  selectedRepo: string;
}

interface StatusInfo {
  isActive: boolean;
  lastSync: number;
  totalSubmissions: number;
  todaySubmissions: number;
}

export default function Dashboard({ selectedRepo }: DashboardProps) {
  const [status, setStatus] = useState<StatusInfo>({
    isActive: true,
    lastSync: Date.now(),
    totalSubmissions: 0,
    todaySubmissions: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStatusInfo();
  }, []);

  const loadStatusInfo = async () => {
    try {
      const result = await chrome.storage.local.get(['submissionHistory']);
      const history = result.submissionHistory || [];
      
      const today = new Date().toDateString();
      const todaySubmissions = history.filter((submission: any) => 
        new Date(submission.timestamp).toDateString() === today
      ).length;

      const lastSubmission = history[0];
      
      setStatus({
        isActive: true,
        lastSync: lastSubmission?.timestamp || Date.now(),
        totalSubmissions: history.length,
        todaySubmissions
      });
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStatusInfo();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const openGitHubRepo = () => {
    if (selectedRepo) {
      chrome.tabs.create({ url: `https://github.com/${selectedRepo}` });
    }
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Status Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">CodeSync Active</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Monitoring LeetCode and Codeforces for new submissions
        </p>
      </div>

      {/* Repository Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Target Repository</h3>
          <button
            onClick={openGitHubRepo}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
          {selectedRepo}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{status.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Synced</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{status.todaySubmissions}</div>
          <div className="text-sm text-gray-600">Today</div>
        </div>
      </div>

      {/* Last Sync */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Last Activity</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {formatTimeAgo(status.lastSync)}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Solve problems on LeetCode or Codeforces</li>
          <li>• Get "Accepted" verdict</li>
          <li>• Your code automatically syncs to GitHub!</li>
        </ul>
      </div>
    </div>
  );
}