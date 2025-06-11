import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Code, Trash2, RefreshCw } from 'lucide-react';

interface Submission {
  platform: string;
  title: string;
  difficulty?: string;
  language: string;
  timestamp: number;
  githubUrl?: string;
  contestId?: string;
  problemIndex?: string;
}

export default function HistoryView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await chrome.storage.local.get(['submissionHistory']);
      setSubmissions(result.submissionHistory || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear all submission history?')) {
      await chrome.storage.local.set({ submissionHistory: [] });
      setSubmissions([]);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'leetcode': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'codeforces': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-center">
        <Code className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="font-medium text-gray-700 mb-1">No submissions yet</h3>
        <p className="text-sm text-gray-500">
          Solve problems on LeetCode or Codeforces to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Submission History</h3>
        <button
          onClick={clearHistory}
          className="text-red-600 hover:text-red-800 p-1"
          title="Clear all history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {submissions.map((submission, index) => (
          <div key={index} className="p-3 border-b border-gray-100 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPlatformColor(submission.platform)}`}>
                    {submission.platform}
                  </span>
                  {submission.difficulty && (
                    <span className={`text-xs font-medium ${getDifficultyColor(submission.difficulty)}`}>
                      {submission.difficulty}
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {submission.title}
                  {submission.contestId && submission.problemIndex && (
                    <span className="text-gray-500 ml-1">
                      ({submission.contestId}{submission.problemIndex})
                    </span>
                  )}
                </h4>
                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                  <span>{submission.language}</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(submission.timestamp)}
                  </span>
                </div>
              </div>
              {submission.githubUrl && (
                <button
                  onClick={() => chrome.tabs.create({ url: submission.githubUrl })}
                  className="text-blue-600 hover:text-blue-800 p-1 ml-2"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}